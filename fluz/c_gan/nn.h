#ifndef NN_H
#define NN_H

#include "tensor.h"

typedef struct {
    Tensor *weights;
    Tensor *bias;
    Tensor *input;
    Tensor *output;
    Tensor *d_weights;
    Tensor *d_bias;
    Tensor *d_input;
} DenseLayer;

DenseLayer* dense_create(int input_size, int output_size);
void dense_free(DenseLayer *layer);
Tensor* dense_forward(DenseLayer *layer, const Tensor *input);
Tensor* dense_backward(DenseLayer *layer, const Tensor *output_gradient, float learning_rate);

void relu_forward(Tensor *t);
void relu_backward(Tensor *gradient, const Tensor *input);

void leaky_relu_forward(Tensor *t, float alpha);
void leaky_relu_backward(Tensor *gradient, const Tensor *input, float alpha);

void sigmoid_forward(Tensor *t);
void sigmoid_backward(Tensor *gradient, const Tensor *output);

#endif
