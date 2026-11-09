#ifndef MNIST_PARSER_H
#define MNIST_PARSER_H

#include "tensor.h"

typedef struct {
    int num_images;
    int num_rows;
    int num_cols;
    Tensor **images; // Array of pointers to Tensors
} MnistDataset;

// Load MNIST images from the idx3 binary format
MnistDataset* load_mnist_images(const char *filename);

// Free the dataset
void free_mnist_dataset(MnistDataset *dataset);

#endif
