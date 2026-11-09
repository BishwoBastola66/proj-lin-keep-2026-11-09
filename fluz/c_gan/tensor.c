#include "tensor.h"
#include <stdlib.h>
#include <math.h>

Tensor* tensor_create(int rows, int cols) {
    Tensor *t = (Tensor*)malloc(sizeof(Tensor));
    t->rows = rows;
    t->cols = cols;
    t->data = (float*)calloc(rows * cols, sizeof(float));
    return t;
}

void tensor_free(Tensor *t) {
    if (t) {
        if (t->data) free(t->data);
        free(t);
    }
}

void tensor_randomize(Tensor *t, float min, float max) {
    for (int i = 0; i < t->rows * t->cols; i++) {
        float r = (float)rand() / (float)RAND_MAX;
        t->data[i] = min + r * (max - min);
    }
}

void tensor_fill(Tensor *t, float val) {
    for (int i = 0; i < t->rows * t->cols; i++) {
        t->data[i] = val;
    }
}

void tensor_copy(Tensor *dest, const Tensor *src) {
    for (int i = 0; i < src->rows * src->cols; i++) {
        dest->data[i] = src->data[i];
    }
}

Tensor* tensor_multiply(const Tensor *a, const Tensor *b) {
    if (a->cols != b->rows) return NULL; // Dimension mismatch
    Tensor *result = tensor_create(a->rows, b->cols);
    for (int i = 0; i < a->rows; i++) {
        for (int j = 0; j < b->cols; j++) {
            float sum = 0.0f;
            for (int k = 0; k < a->cols; k++) {
                sum += a->data[i * a->cols + k] * b->data[k * b->cols + j];
            }
            result->data[i * result->cols + j] = sum;
        }
    }
    return result;
}

void tensor_add(Tensor *a, const Tensor *b) {
    for (int i = 0; i < a->rows * a->cols; i++) {
        a->data[i] += b->data[i];
    }
}

void tensor_subtract(Tensor *a, const Tensor *b) {
    for (int i = 0; i < a->rows * a->cols; i++) {
        a->data[i] -= b->data[i];
    }
}

void tensor_scale(Tensor *t, float scalar) {
    for (int i = 0; i < t->rows * t->cols; i++) {
        t->data[i] *= scalar;
    }
}

Tensor* tensor_transpose(const Tensor *t) {
    Tensor *result = tensor_create(t->cols, t->rows);
    for (int i = 0; i < t->rows; i++) {
        for (int j = 0; j < t->cols; j++) {
            result->data[j * result->cols + i] = t->data[i * t->cols + j];
        }
    }
    return result;
}
