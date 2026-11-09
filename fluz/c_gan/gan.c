#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>
#include <sys/stat.h>
#include <sys/types.h>
#include "tensor.h"
#include "nn.h"
#include "image_utils.h"
#include "mnist_parser.h"

#define NOISE_DIM 100
#define IMAGE_DIM 784 // 28x28

typedef struct {
    DenseLayer *hidden;
    DenseLayer *output;
} Generator;

typedef struct {
    DenseLayer *hidden;
    DenseLayer *output;
} Discriminator;

Generator* create_generator() {
    Generator *g = (Generator*)malloc(sizeof(Generator));
    g->hidden = dense_create(NOISE_DIM, 256);
    g->output = dense_create(256, IMAGE_DIM);
    return g;
}

void free_generator(Generator *g) {
    dense_free(g->hidden);
    dense_free(g->output);
    free(g);
}

Discriminator* create_discriminator() {
    Discriminator *d = (Discriminator*)malloc(sizeof(Discriminator));
    d->hidden = dense_create(IMAGE_DIM, 256);
    d->output = dense_create(256, 1);
    return d;
}

void free_discriminator(Discriminator *d) {
    dense_free(d->hidden);
    dense_free(d->output);
    free(d);
}

Tensor* generate_fake_data(Generator *g, Tensor *noise) {
    Tensor *h = dense_forward(g->hidden, noise);
    leaky_relu_forward(h, 0.2f);
    
    Tensor *out = dense_forward(g->output, h);
    sigmoid_forward(out);
    
    tensor_free(h);
    return out;
}

float train_discriminator(Discriminator *d, const Tensor *real_data, const Tensor *fake_data, float lr) {
    Tensor *h_real = dense_forward(d->hidden, real_data);
    leaky_relu_forward(h_real, 0.2f);
    Tensor *out_real = dense_forward(d->output, h_real);
    sigmoid_forward(out_real);
    
    float loss_real = -logf(out_real->data[0] + 1e-8f);
    
    Tensor *grad_out_real = tensor_create(1, 1);
    grad_out_real->data[0] = (out_real->data[0] - 1.0f);
    
    Tensor *grad_h_real = dense_backward(d->output, grad_out_real, lr);
    leaky_relu_backward(grad_h_real, h_real, 0.2f);
    Tensor *grad_in_real = dense_backward(d->hidden, grad_h_real, lr);
    
    Tensor *h_fake = dense_forward(d->hidden, fake_data);
    leaky_relu_forward(h_fake, 0.2f);
    Tensor *out_fake = dense_forward(d->output, h_fake);
    sigmoid_forward(out_fake);
    
    float loss_fake = -logf(1.0f - out_fake->data[0] + 1e-8f);
    
    Tensor *grad_out_fake = tensor_create(1, 1);
    grad_out_fake->data[0] = (out_fake->data[0] - 0.0f);
    
    Tensor *grad_h_fake = dense_backward(d->output, grad_out_fake, lr);
    leaky_relu_backward(grad_h_fake, h_fake, 0.2f);
    Tensor *grad_in_fake = dense_backward(d->hidden, grad_h_fake, lr);
    
    tensor_free(h_real); tensor_free(out_real); tensor_free(grad_out_real); 
    tensor_free(grad_h_real); tensor_free(grad_in_real);
    
    tensor_free(h_fake); tensor_free(out_fake); tensor_free(grad_out_fake);
    tensor_free(grad_h_fake); tensor_free(grad_in_fake);
    
    return (loss_real + loss_fake) / 2.0f;
}

float train_generator(Generator *g, Discriminator *d, Tensor *noise, float lr) {
    Tensor *h_g = dense_forward(g->hidden, noise);
    leaky_relu_forward(h_g, 0.2f);
    Tensor *fake_data = dense_forward(g->output, h_g);
    sigmoid_forward(fake_data);
    
    Tensor *h_d = dense_forward(d->hidden, fake_data);
    leaky_relu_forward(h_d, 0.2f);
    Tensor *out_d = dense_forward(d->output, h_d);
    sigmoid_forward(out_d);
    
    float loss_g = -logf(out_d->data[0] + 1e-8f);
    
    Tensor *grad_out_d = tensor_create(1, 1);
    grad_out_d->data[0] = (out_d->data[0] - 1.0f);
    
    Tensor *d_out_w_t = tensor_transpose(d->output->weights);
    Tensor *grad_h_d = tensor_multiply(grad_out_d, d_out_w_t);
    tensor_free(d_out_w_t);
    
    leaky_relu_backward(grad_h_d, h_d, 0.2f);
    
    Tensor *d_hid_w_t = tensor_transpose(d->hidden->weights);
    Tensor *grad_fake_data = tensor_multiply(grad_h_d, d_hid_w_t);
    tensor_free(d_hid_w_t);
    
    sigmoid_backward(grad_fake_data, fake_data);
    
    Tensor *grad_h_g = dense_backward(g->output, grad_fake_data, lr);
    leaky_relu_backward(grad_h_g, h_g, 0.2f);
    Tensor *grad_in_g = dense_backward(g->hidden, grad_h_g, lr);
    
    tensor_free(h_g); tensor_free(fake_data);
    tensor_free(h_d); tensor_free(out_d);
    tensor_free(grad_out_d); tensor_free(grad_h_d); tensor_free(grad_fake_data);
    tensor_free(grad_h_g); tensor_free(grad_in_g);
    
    return loss_g;
}

int main() {
    srand(time(NULL));
    
    mkdir("images", 0777);
    
    printf("Loading MNIST dataset...\n");
    MnistDataset *mnist = load_mnist_images("train-images-idx3-ubyte");
    if (!mnist) {
        printf("Failed to load MNIST dataset.\n");
        return 1;
    }
    printf("Loaded %d images.\n", mnist->num_images);
    
    Generator *g = create_generator();
    Discriminator *d = create_discriminator();
    
    printf("Starting C GAN Training on MNIST...\n");
    
    // We increase epochs because real data is harder to learn
    int epochs = 10000;
    float lr = 0.005f;
    
    Tensor *noise = tensor_create(1, NOISE_DIM);
    
    for (int epoch = 0; epoch <= epochs; epoch++) {
        // Pick a random real image
        int rand_idx = rand() % mnist->num_images;
        Tensor *real_data = mnist->images[rand_idx];
        
        tensor_randomize(noise, -1.0f, 1.0f);
        Tensor *fake_data = generate_fake_data(g, noise);
        
        float d_loss = train_discriminator(d, real_data, fake_data, lr);
        tensor_free(fake_data);
        
        tensor_randomize(noise, -1.0f, 1.0f);
        float g_loss = train_generator(g, d, noise, lr);
        
        if (epoch % 500 == 0) {
            printf("Epoch %d: D Loss: %.4f | G Loss: %.4f\n", epoch, d_loss, g_loss);
            
            char filename[256];
            sprintf(filename, "images/mnist_sample_%d.pgm", epoch);
            
            tensor_randomize(noise, -1.0f, 1.0f);
            Tensor *sample = generate_fake_data(g, noise);
            save_image_pgm(filename, sample, 28, 28);
            tensor_free(sample);
        }
    }
    
    tensor_free(noise);
    free_generator(g);
    free_discriminator(d);
    free_mnist_dataset(mnist);
    
    printf("Training complete. Generated digits saved to 'images/' directory.\n");
    return 0;
}
