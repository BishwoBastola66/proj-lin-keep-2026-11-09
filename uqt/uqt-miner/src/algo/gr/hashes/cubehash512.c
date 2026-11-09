/* CubeHash-512 — Daniel J. Bernstein's SHA-3 candidate */
#include "../gr_hashes.h"
#include <string.h>

static void cubehash_round(uint32_t x[32]) {
    uint32_t y[32];
    int i;
    for (i = 0; i < 16; i++) x[i+16] += x[i];
    for (i = 0; i < 16; i++) y[i^8] = x[i];
    for (i = 0; i < 16; i++) x[i] = (y[i] << 7) | (y[i] >> 25);
    for (i = 0; i < 16; i++) x[i] ^= x[i+16];
    for (i = 0; i < 16; i++) y[i+16] = x[i+16]; 
    for (i = 16; i < 32; i++) x[i] = y[(i-16)^2+16];
    for (i = 0; i < 16; i++) x[i+16] += x[i];
    for (i = 0; i < 16; i++) y[i^4] = x[i];
    for (i = 0; i < 16; i++) x[i] = (y[i] << 11) | (y[i] >> 21);
    for (i = 0; i < 16; i++) x[i] ^= x[i+16];
    for (i = 0; i < 16; i++) y[i+16] = x[i+16];
    for (i = 16; i < 32; i++) x[i] = y[(i-16)^1+16];
}

void gr_cubehash512_hash(const void *input, size_t len, void *output) {
    uint32_t x[32];
    int i;
    memset(x, 0, sizeof(x));
    x[0] = 512; x[1] = 32; x[2] = 16;
    for (i = 0; i < 160; i++) cubehash_round(x);

    const uint8_t *p = (const uint8_t *)input;
    while (len >= 32) {
        for (i = 0; i < 8; i++) {
            uint32_t v;
            memcpy(&v, p + i*4, 4);
            x[i] ^= v;
        }
        for (i = 0; i < 16; i++) cubehash_round(x);
        p += 32; len -= 32;
    }

    uint8_t last[32];
    memset(last, 0, 32);
    memcpy(last, p, len);
    last[len] = 0x80;
    for (i = 0; i < 8; i++) {
        uint32_t v;
        memcpy(&v, last + i*4, 4);
        x[i] ^= v;
    }
    for (i = 0; i < 16; i++) cubehash_round(x);
    x[31] ^= 1;
    for (i = 0; i < 160; i++) cubehash_round(x);

    memcpy(output, x, 64);
}
