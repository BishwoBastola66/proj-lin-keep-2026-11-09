#ifndef IMAGE_UTILS_H
#define IMAGE_UTILS_H

#include "tensor.h"

void save_image_pgm(const char *filename, const Tensor *image, int width, int height);

#endif
