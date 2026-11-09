#ifndef TENSOR_H
#define TENSOR_H

#include <stddef.h>

typedef struct {
    int rows;
    int cols;
    float *data;
} Tensor;

Tensor* tensor_create(int rows, int cols);
void tensor_free(Tensor *t);
void tensor_randomize(Tensor *t, float min, float max);
void tensor_fill(Tensor *t, float val);
void tensor_copy(Tensor *dest, const Tensor *src);
Tensor* tensor_multiply(const Tensor *a, const Tensor *b);
void tensor_add(Tensor *a, const Tensor *b); // a += b
void tensor_subtract(Tensor *a, const Tensor *b); // a -= b
void tensor_scale(Tensor *t, float scalar); // t *= scalar
Tensor* tensor_transpose(const Tensor *t);

#endif
