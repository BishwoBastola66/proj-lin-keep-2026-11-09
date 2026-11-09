#include "uqt/algo.h"
#include <string.h>

static UQT_INLINE uint64_t load_le64(const uint8_t *p) {
    return ((uint64_t)p[0]) | ((uint64_t)p[1] << 8) | ((uint64_t)p[2] << 16) | ((uint64_t)p[3] << 24) |
           ((uint64_t)p[4] << 32) | ((uint64_t)p[5] << 40) | ((uint64_t)p[6] << 48) | ((uint64_t)p[7] << 56);
}

static UQT_INLINE void store_le64(uint8_t *p, uint64_t v) {
    p[0] = (uint8_t)(v); p[1] = (uint8_t)(v >> 8);
    p[2] = (uint8_t)(v >> 16); p[3] = (uint8_t)(v >> 24);
    p[4] = (uint8_t)(v >> 32); p[5] = (uint8_t)(v >> 40);
    p[6] = (uint8_t)(v >> 48); p[7] = (uint8_t)(v >> 56);
}

#define ROTR64(x, y) (((x) >> (y)) ^ ((x) << (64 - (y))))

static const uint64_t blake2b_IV[8] = {
    0x6a09e667f3bcc908ULL, 0xbb67ae8584caa73bULL,
    0x3c6ef372fe94f82bULL, 0xa54ff53a5f1d36f1ULL,
    0x510e527fade682d1ULL, 0x9b05688c2b3e6c1fULL,
    0x1f83d9abfb41bd6bULL, 0x5be0cd19137e2179ULL
};

static const uint8_t blake2b_sigma[12][16] = {
    {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15},
    {14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3},
    {11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4},
    {7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8},
    {9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13},
    {2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9},
    {12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11},
    {13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10},
    {6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5},
    {10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0},
    {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15},
    {14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3}
};

#define G(r, i, a, b, c, d) do { \
    a = a + b + m[blake2b_sigma[r][2 * i]]; \
    d = ROTR64(d ^ a, 32); \
    c = c + d; \
    b = ROTR64(b ^ c, 24); \
    a = a + b + m[blake2b_sigma[r][2 * i + 1]]; \
    d = ROTR64(d ^ a, 16); \
    c = c + d; \
    b = ROTR64(b ^ c, 63); \
} while(0)

static void blake2b_compress(uint64_t *h, const uint8_t *block, uint64_t t0, uint64_t t1, bool is_last) {
    uint64_t v[16];
    uint64_t m[16];
    int i;

    for (i = 0; i < 8; i++) {
        v[i] = h[i];
        v[i + 8] = blake2b_IV[i];
    }
    
    v[12] ^= t0;
    v[13] ^= t1;
    if (is_last) {
        v[14] ^= ~0ULL;
    }

    for (i = 0; i < 16; i++) {
        m[i] = load_le64(block + i * 8);
    }

    for (i = 0; i < 12; i++) {
        G(i, 0, v[0], v[4], v[8], v[12]);
        G(i, 1, v[1], v[5], v[9], v[13]);
        G(i, 2, v[2], v[6], v[10], v[14]);
        G(i, 3, v[3], v[7], v[11], v[15]);
        G(i, 4, v[0], v[5], v[10], v[15]);
        G(i, 5, v[1], v[6], v[11], v[12]);
        G(i, 6, v[2], v[7], v[8], v[13]);
        G(i, 7, v[3], v[4], v[9], v[14]);
    }

    for (i = 0; i < 8; i++) {
        h[i] ^= v[i] ^ v[i + 8];
    }
}

static int blake2b_scalar_hash(void *state, const uint8_t *input, size_t input_len, uint8_t *output) {
    if (!output || (!input && input_len > 0)) return UQT_ERR_INVAL;
    (void)state;

    uint64_t h[8];
    for (int i = 0; i < 8; i++) {
        h[i] = blake2b_IV[i];
    }
    
    /* Config block (digest_size = 64) */
    h[0] ^= 0x01010040; 
    
    uint64_t t0 = 0, t1 = 0;
    uint8_t block[128] = {0};
    size_t offset = 0;

    if (input_len == 0) {
        blake2b_compress(h, block, 0, 0, true);
    } else {
        while (input_len - offset > 128) {
            t0 += 128;
            if (t0 < 128) t1++;
            blake2b_compress(h, input + offset, t0, t1, false);
            offset += 128;
        }

        size_t rem = input_len - offset;
        t0 += rem;
        if (t0 < rem) t1++;
        memcpy(block, input + offset, rem);
        memset(block + rem, 0, 128 - rem);
        blake2b_compress(h, block, t0, t1, true);
    }

    for (int i = 0; i < 8; i++) {
        store_le64(output + i * 8, h[i]);
    }
    return UQT_SUCCESS;
}

static int blake2b_scalar_hash_batch(void *state, const uint8_t *inputs, size_t input_stride, uint8_t *outputs, size_t count) {
    if (!inputs || !outputs || count == 0) return UQT_ERR_INVAL;
    (void)state;
    for (size_t i = 0; i < count; i++) {
        blake2b_scalar_hash(NULL, inputs + i * input_stride, input_stride, outputs + i * 64);
    }
    return UQT_SUCCESS;
}

static const uqt_algo_backend_t backend_scalar = {
    .name = "scalar",
    .required_features = 0,
    .init = NULL,
    .destroy = NULL,
    .hash = blake2b_scalar_hash,
    .hash_batch = blake2b_scalar_hash_batch,
    .batch_width = 1,
    .scratchpad_size = 0
};

extern const uqt_algo_backend_t blake2b_backend_avx2;

static const uqt_algo_backend_t *blake2b_backends[] = {
    &blake2b_backend_avx2,
    &backend_scalar
};

const uqt_algo_t uqt_algo_blake2b = {
    .name = "blake2b",
    .digest_size = 64,
    .backends = blake2b_backends,
    .num_backends = 2
};
