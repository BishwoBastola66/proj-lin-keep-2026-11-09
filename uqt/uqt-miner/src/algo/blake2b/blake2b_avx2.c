#include "uqt/algo.h"
#include <string.h>

#if defined(__GNUC__) || defined(__clang__)
#include <immintrin.h>
#elif defined(_MSC_VER)
#include <intrin.h>
#endif

#define ROTR64_256(x, n) _mm256_or_si256(_mm256_srli_epi64(x, n), _mm256_slli_epi64(x, 64 - (n)))

#define G256(a, b, c, d, x, y) do { \
    a = _mm256_add_epi64(_mm256_add_epi64(a, b), x); \
    d = ROTR64_256(_mm256_xor_si256(d, a), 32); \
    c = _mm256_add_epi64(c, d); \
    b = ROTR64_256(_mm256_xor_si256(b, c), 24); \
    a = _mm256_add_epi64(_mm256_add_epi64(a, b), y); \
    d = ROTR64_256(_mm256_xor_si256(d, a), 16); \
    c = _mm256_add_epi64(c, d); \
    b = ROTR64_256(_mm256_xor_si256(b, c), 63); \
} while(0)

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

static void blake2b_compress_4way(__m256i h[8], const __m256i m[16], uint64_t t0, uint64_t t1, uint64_t f0, uint64_t f1) {
    __m256i v[16];
    for (int i = 0; i < 8; i++) {
        v[i] = h[i];
        v[i + 8] = _mm256_set1_epi64x((long long)blake2b_IV[i]);
    }

    v[12] = _mm256_xor_si256(v[12], _mm256_set1_epi64x((long long)t0));
    v[13] = _mm256_xor_si256(v[13], _mm256_set1_epi64x((long long)t1));
    v[14] = _mm256_xor_si256(v[14], _mm256_set1_epi64x((long long)f0));
    v[15] = _mm256_xor_si256(v[15], _mm256_set1_epi64x((long long)f1));

    for (int r = 0; r < 12; r++) {
        G256(v[0], v[4], v[8],  v[12], m[blake2b_sigma[r][0]], m[blake2b_sigma[r][1]]);
        G256(v[1], v[5], v[9],  v[13], m[blake2b_sigma[r][2]], m[blake2b_sigma[r][3]]);
        G256(v[2], v[6], v[10], v[14], m[blake2b_sigma[r][4]], m[blake2b_sigma[r][5]]);
        G256(v[3], v[7], v[11], v[15], m[blake2b_sigma[r][6]], m[blake2b_sigma[r][7]]);

        G256(v[0], v[5], v[10], v[15], m[blake2b_sigma[r][8]], m[blake2b_sigma[r][9]]);
        G256(v[1], v[6], v[11], v[12], m[blake2b_sigma[r][10]], m[blake2b_sigma[r][11]]);
        G256(v[2], v[7], v[8],  v[13], m[blake2b_sigma[r][12]], m[blake2b_sigma[r][13]]);
        G256(v[3], v[4], v[9],  v[14], m[blake2b_sigma[r][14]], m[blake2b_sigma[r][15]]);
    }

    for (int i = 0; i < 8; i++) {
        h[i] = _mm256_xor_si256(h[i], _mm256_xor_si256(v[i], v[i + 8]));
    }
}

static inline uint64_t load_le64(const uint8_t *p) {
    uint64_t v = 0;
    memcpy(&v, p, 8);
    return v;
}

static inline void store_le64(uint8_t *p, uint64_t v) {
    memcpy(p, &v, 8);
}

static void blake2b_4way(const uint8_t *inputs[4], size_t len, uint8_t outputs[4][64]) {
    __m256i h[8];
    for (int i = 0; i < 8; i++) {
        h[i] = _mm256_set1_epi64x((long long)blake2b_IV[i]);
    }
    h[0] = _mm256_xor_si256(h[0], _mm256_set1_epi64x(0x01010040ULL));

    size_t offset = 0;
    uint64_t total_bytes = (uint64_t)len;

    while (total_bytes - offset > 128) {
        __m256i m[16];
        for (int k = 0; k < 16; k++) {
            uint64_t lane[4];
            for (int l = 0; l < 4; l++) {
                lane[l] = load_le64(inputs[l] + offset + k * 8);
            }
            m[k] = _mm256_setr_epi64x((long long)lane[0], (long long)lane[1], (long long)lane[2], (long long)lane[3]);
        }
        offset += 128;
        blake2b_compress_4way(h, m, offset, 0, 0, 0);
    }

    size_t rem = total_bytes - offset;
    uint8_t blocks[4][128];
    memset(blocks, 0, sizeof(blocks));
    for (int l = 0; l < 4; l++) {
        if (inputs[l] && rem > 0) {
            memcpy(blocks[l], inputs[l] + offset, rem);
        }
    }

    __m256i m[16];
    for (int k = 0; k < 16; k++) {
        uint64_t lane[4];
        for (int l = 0; l < 4; l++) {
            lane[l] = load_le64(blocks[l] + k * 8);
        }
        m[k] = _mm256_setr_epi64x((long long)lane[0], (long long)lane[1], (long long)lane[2], (long long)lane[3]);
    }

    blake2b_compress_4way(h, m, total_bytes, 0, ~0ULL, 0);

    uint64_t raw_h[8][4];
    for (int i = 0; i < 8; i++) {
        _mm256_storeu_si256((__m256i*)raw_h[i], h[i]);
    }
    for (int l = 0; l < 4; l++) {
        for (int i = 0; i < 8; i++) {
            store_le64(outputs[l] + i * 8, raw_h[i][l]);
        }
    }
}

static int blake2b_avx2_hash(void *state, const uint8_t *input, size_t input_len, uint8_t *output) {
    if (!output || (!input && input_len > 0)) return UQT_ERR_INVAL;
    (void)state;

    static const uint8_t empty_byte = 0;
    const uint8_t *src = input ? input : &empty_byte;
    const uint8_t *inputs[4];
    for (int i = 0; i < 4; i++) inputs[i] = src;

    uint8_t outputs[4][64];
    blake2b_4way(inputs, input_len, outputs);
    memcpy(output, outputs[0], 64);
    return UQT_SUCCESS;
}

static int blake2b_avx2_hash_batch(void *state, const uint8_t *inputs, size_t input_stride, uint8_t *outputs, size_t count) {
    if (!inputs || !outputs || count == 0) return UQT_ERR_INVAL;
    (void)state;

    size_t i = 0;
    while (i + 4 <= count) {
        const uint8_t *ptrs[4];
        uint8_t out[4][64];
        for (int k = 0; k < 4; k++) {
            ptrs[k] = inputs + (i + k) * input_stride;
        }
        blake2b_4way(ptrs, input_stride, out);
        for (int k = 0; k < 4; k++) {
            memcpy(outputs + (i + k) * 64, out[k], 64);
        }
        i += 4;
    }

    if (i < count) {
        const uint8_t *ptrs[4];
        uint8_t out[4][64];
        size_t rem = count - i;
        for (size_t k = 0; k < 4; k++) {
            if (k < rem) ptrs[k] = inputs + (i + k) * input_stride;
            else ptrs[k] = inputs + i * input_stride;
        }
        blake2b_4way(ptrs, input_stride, out);
        for (size_t k = 0; k < rem; k++) {
            memcpy(outputs + (i + k) * 64, out[k], 64);
        }
    }

    return UQT_SUCCESS;
}

const uqt_algo_backend_t blake2b_backend_avx2 = {
    .name = "avx2",
    .required_features = UQT_CPU_FEAT_AVX2,
    .init = NULL,
    .destroy = NULL,
    .hash = blake2b_avx2_hash,
    .hash_batch = blake2b_avx2_hash_batch,
    .batch_width = 4,
    .scratchpad_size = 0
};
