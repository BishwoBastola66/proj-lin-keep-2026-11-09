#include "nn.h"
#include <stdlib.h>
#include <math.h>

DenseLayer* dense_create(int input_size, int output_size) {
    DenseLayer *layer = (DenseLayer*)malloc(sizeof(DenseLayer));
    layer->weights = tensor_create(input_size, output_size);
    // Xavier initialization
    float bound = sqrtf(6.0f / (input_size + output_size));
    tensor_randomize(layer->weights, -bound, bound);
    
    layer->bias = tensor_create(1, output_size);
    tensor_fill(layer->bias, 0.0f);
    
    layer->input = NULL;
    layer->output = NULL;
    layer->d_weights = tensor_create(input_size, output_size);
    layer->d_bias = tensor_create(1, output_size);
    layer->d_input = tensor_create(1, input_size);
    return layer;
}

void dense_free(DenseLayer *layer) {
    if (layer) {
        tensor_free(layer->weights);
        tensor_free(layer->bias);
        if (layer->input) tensor_free(layer->input);
        if (layer->output) tensor_free(layer->output);
        tensor_free(layer->d_weights);
        tensor_free(layer->d_bias);
        tensor_free(layer->d_input);
        free(layer);
    }
}

Tensor* dense_forward(DenseLayer *layer, const Tensor *input) {
    if (layer->input) tensor_free(layer->input);
    layer->input = tensor_create(input->rows, input->cols);
    tensor_copy(layer->input, input);
    
    if (layer->output) tensor_free(layer->output);
    layer->output = tensor_multiply(input, layer->weights);
    
    for (int i = 0; i < layer->output->rows; i++) {
        for (int j = 0; j < layer->output->cols; j++) {
            layer->output->data[i * layer->output->cols + j] += layer->bias->data[j];
        }
    }
    
    Tensor *result = tensor_create(layer->output->rows, layer->output->cols);
    tensor_copy(result, layer->output);
    return result;
}

Tensor* dense_backward(DenseLayer *layer, const Tensor *output_gradient, float learning_rate) {
    // Calculate gradients
    Tensor *input_t = tensor_transpose(layer->input);
    Tensor *d_weights = tensor_multiply(input_t, output_gradient);
    tensor_free(input_t);
    
    tensor_copy(layer->d_weights, d_weights);
    
    tensor_fill(layer->d_bias, 0.0f);
    for (int i = 0; i < output_gradient->rows; i++) {
        for (int j = 0; j < output_gradient->cols; j++) {
            layer->d_bias->data[j] += output_gradient->data[i * output_gradient->cols + j];
        }
    }
    
    Tensor *weights_t = tensor_transpose(layer->weights);
    Tensor *d_input = tensor_multiply(output_gradient, weights_t);
    tensor_free(weights_t);
    tensor_copy(layer->d_input, d_input);
    
    // Update weights and biases
    tensor_scale(d_weights, learning_rate);
    tensor_subtract(layer->weights, d_weights);
    
    Tensor *scaled_d_bias = tensor_create(layer->d_bias->rows, layer->d_bias->cols);
    tensor_copy(scaled_d_bias, layer->d_bias);
    tensor_scale(scaled_d_bias, learning_rate);
    tensor_subtract(layer->bias, scaled_d_bias);
    
    tensor_free(d_weights);
    tensor_free(scaled_d_bias);
    
    Tensor *result = tensor_create(d_input->rows, d_input->cols);
    tensor_copy(result, d_input);
    tensor_free(d_input);
    
    return result;
}

void relu_forward(Tensor *t) {
    for (int i = 0; i < t->rows * t->cols; i++) {
        if (t->data[i] < 0) t->data[i] = 0;
    }
}

void relu_backward(Tensor *gradient, const Tensor *input) {
    for (int i = 0; i < gradient->rows * gradient->cols; i++) {
        if (input->data[i] <= 0) gradient->data[i] = 0;
    }
}

void leaky_relu_forward(Tensor *t, float alpha) {
    for (int i = 0; i < t->rows * t->cols; i++) {
        if (t->data[i] < 0) t->data[i] *= alpha;
    }
}

void leaky_relu_backward(Tensor *gradient, const Tensor *input, float alpha) {
    for (int i = 0; i < gradient->rows * gradient->cols; i++) {
        if (input->data[i] <= 0) gradient->data[i] *= alpha;
    }
}

void sigmoid_forward(Tensor *t) {
    for (int i = 0; i < t->rows * t->cols; i++) {
        t->data[i] = 1.0f / (1.0f + expf(-t->data[i]));
    }
}

void sigmoid_backward(Tensor *gradient, const Tensor *output) {
    for (int i = 0; i < gradient->rows * gradient->cols; i++) {
        float sig = output->data[i];
        gradient->data[i] *= sig * (1.0f - sig);
    }
}
