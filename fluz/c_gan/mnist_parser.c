#include "mnist_parser.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

// Helper to reverse bytes (MNIST is Big Endian, typical systems are Little Endian)
uint32_t reverse_int(uint32_t i) {
    unsigned char c1, c2, c3, c4;
    c1 = i & 255;
    c2 = (i >> 8) & 255;
    c3 = (i >> 16) & 255;
    c4 = (i >> 24) & 255;
    return ((uint32_t)c1 << 24) + ((uint32_t)c2 << 16) + ((uint32_t)c3 << 8) + c4;
}

MnistDataset* load_mnist_images(const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        fprintf(stderr, "Error opening %s\n", filename);
        return NULL;
    }

    uint32_t magic_number = 0;
    uint32_t num_images = 0;
    uint32_t num_rows = 0;
    uint32_t num_cols = 0;

    fread(&magic_number, sizeof(uint32_t), 1, f);
    magic_number = reverse_int(magic_number);
    if (magic_number != 2051) {
        fprintf(stderr, "Invalid magic number: %d\n", magic_number);
        fclose(f);
        return NULL;
    }

    fread(&num_images, sizeof(uint32_t), 1, f);
    num_images = reverse_int(num_images);

    fread(&num_rows, sizeof(uint32_t), 1, f);
    num_rows = reverse_int(num_rows);

    fread(&num_cols, sizeof(uint32_t), 1, f);
    num_cols = reverse_int(num_cols);
    
    // For testing and memory limits, we might want to restrict to first 10,000 images
    if (num_images > 10000) {
        num_images = 10000; 
    }

    MnistDataset *dataset = (MnistDataset*)malloc(sizeof(MnistDataset));
    dataset->num_images = num_images;
    dataset->num_rows = num_rows;
    dataset->num_cols = num_cols;
    dataset->images = (Tensor**)malloc(sizeof(Tensor*) * num_images);

    int image_size = num_rows * num_cols;
    unsigned char *buffer = (unsigned char*)malloc(image_size);

    for (int i = 0; i < num_images; i++) {
        fread(buffer, sizeof(unsigned char), image_size, f);
        Tensor *img = tensor_create(1, image_size);
        for (int j = 0; j < image_size; j++) {
            img->data[j] = ((float)buffer[j]) / 255.0f; // Scale to 0..1
        }
        dataset->images[i] = img;
    }

    free(buffer);
    fclose(f);
    return dataset;
}

void free_mnist_dataset(MnistDataset *dataset) {
    if (!dataset) return;
    for (int i = 0; i < dataset->num_images; i++) {
        tensor_free(dataset->images[i]);
    }
    free(dataset->images);
    free(dataset);
}
