#include "image_utils.h"
#include <stdio.h>

void save_image_pgm(const char *filename, const Tensor *image, int width, int height) {
    FILE *f = fopen(filename, "wb");
    if (!f) return;
    
    fprintf(f, "P5\n%d %d\n255\n", width, height);
    for (int i = 0; i < width * height; i++) {
        float val = image->data[i] * 255.0f;
        if (val < 0.0f) val = 0.0f;
        if (val > 255.0f) val = 255.0f;
        unsigned char pixel = (unsigned char)val;
        fwrite(&pixel, 1, 1, f);
    }
    
    fclose(f);
}
