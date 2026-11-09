#include "uqt/algo.h"
#include <string.h>

#if defined(__GNUC__) || defined(__clang__)
#include <immintrin.h>
#elif defined(_MSC_VER)
#include <intrin.h>
#endif

#define ROR256(x, n) _mm256_or_si256(_mm256_srli_epi32(x, n), _mm256_slli_epi32(x, 32 - (n)))
#define CH256(x, y, z) _mm256_xor_si256(_mm256_and_si256(x, y), _mm256_andnot_si256(x, z))
#define MAJ256(x, y, z) _mm256_xor_si256(_mm256_and_si256(x, y), _mm256_xor_si256(_mm256_and_si256(x, z), _mm256_and_si256(y, z)))
#define EP0_256(x) _mm256_xor_si256(ROR256(x, 2), _mm256_xor_si256(ROR256(x, 13), ROR256(x, 22)))
#define EP1_256(x) _mm256_xor_si256(ROR256(x, 6), _mm256_xor_si256(ROR256(x, 11), ROR256(x, 25)))
#define SIG0_256(x) _mm256_xor_si256(ROR256(x, 7), _mm256_xor_si256(ROR256(x, 18), _mm256_srli_epi32(x, 3)))
#define SIG1_256(x) _mm256_xor_si256(ROR256(x, 17), _mm256_xor_si256(ROR256(x, 19), _mm256_srli_epi32(x, 10)))

static const uint32_t K256[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

static void sha256_transform_8way(__m256i state[8], const __m256i w_in[16]) {
    __m256i w[64];
    __m256i a, b, c, d, e, f, g, h, t1, t2;
    int i;
    for (i = 0; i < 16; i++) {
        w[i] = w_in[i];
    }
    for (i = 16; i < 64; i++) {
        __m256i s0 = SIG0_256(w[i - 15]);
        __m256i s1 = SIG1_256(w[i - 2]);
        w[i] = _mm256_add_epi32(_mm256_add_epi32(w[i - 16], s0), _mm256_add_epi32(w[i - 7], s1));
    }

    a = state[0]; b = state[1]; c = state[2]; d = state[3];
    e = state[4]; f = state[5]; g = state[6]; h = state[7];

    for (i = 0; i < 64; i++) {
        __m256i k = _mm256_set1_epi32((int)K256[i]);
        t1 = _mm256_add_epi32(h, EP1_256(e));
        t1 = _mm256_add_epi32(t1, CH256(e, f, g));
        t1 = _mm256_add_epi32(t1, k);
        t1 = _mm256_add_epi32(t1, w[i]);

        t2 = _mm256_add_epi32(EP0_256(a), MAJ256(a, b, c));

        h = g;
        g = f;
        f = e;
        e = _mm256_add_epi32(d, t1);
        d = c;
        c = b;
        b = a;
        a = _mm256_add_epi32(t1, t2);
    }

    state[0] = _mm256_add_epi32(state[0], a);
    state[1] = _mm256_add_epi32(state[1], b);
    state[2] = _mm256_add_epi32(state[2], c);
    state[3] = _mm256_add_epi32(state[3], d);
    state[4] = _mm256_add_epi32(state[4], e);
    state[5] = _mm256_add_epi32(state[5], f);
    state[6] = _mm256_add_epi32(state[6], g);
    state[7] = _mm256_add_epi32(state[7], h);
}

static inline uint32_t load_be32(const uint8_t *p) {
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

static inline void store_be32(uint8_t *p, uint32_t v) {
    p[0] = (uint8_t)(v >> 24);
    p[1] = (uint8_t)(v >> 16);
    p[2] = (uint8_t)(v >> 8);
    p[3] = (uint8_t)(v);
}

static void sha256_8way(const uint8_t *inputs[8], size_t len, uint8_t outputs[8][32]) {
    __m256i state[8];
    state[0] = _mm256_set1_epi32((int)0x6a09e667);
    state[1] = _mm256_set1_epi32((int)0xbb67ae85);
    state[2] = _mm256_set1_epi32((int)0x3c6ef372);
    state[3] = _mm256_set1_epi32((int)0xa54ff53a);
    state[4] = _mm256_set1_epi32((int)0x510e527f);
    state[5] = _mm256_set1_epi32((int)0x9b05688c);
    state[6] = _mm256_set1_epi32((int)0x1f83d9ab);
    state[7] = _mm256_set1_epi32((int)0x5be0cd19);

    size_t offset = 0;
    while (len - offset >= 64) {
        __m256i w[16];
        for (int k = 0; k < 16; k++) {
            uint32_t lane[8];
            for (int l = 0; l < 8; l++) {
                lane[l] = load_be32(inputs[l] + offset + k * 4);
            }
            w[k] = _mm256_setr_epi32((int)lane[0], (int)lane[1], (int)lane[2], (int)lane[3],
                                     (int)lane[4], (int)lane[5], (int)lane[6], (int)lane[7]);
        }
        sha256_transform_8way(state, w);
        offset += 64;
    }

    size_t rem = len - offset;
    uint8_t blocks[8][128];
    memset(blocks, 0, sizeof(blocks));
    int two_blocks = (rem >= 56);

    for (int l = 0; l < 8; l++) {
        if (inputs[l] && rem > 0) {
            memcpy(blocks[l], inputs[l] + offset, rem);
        }
        blocks[l][rem] = 0x80;
        uint64_t bitlen = (uint64_t)len * 8;
        size_t len_pos = two_blocks ? 120 : 56;
        for (int b = 0; b < 8; b++) {
            blocks[l][len_pos + b] = (uint8_t)(bitlen >> ((7 - b) * 8));
        }
    }

    if (two_blocks) {
        __m256i w[16];
        for (int k = 0; k < 16; k++) {
            uint32_t lane[8];
            for (int l = 0; l < 8; l++) {
                lane[l] = load_be32(blocks[l] + k * 4);
            }
            w[k] = _mm256_setr_epi32((int)lane[0], (int)lane[1], (int)lane[2], (int)lane[3],
                                     (int)lane[4], (int)lane[5], (int)lane[6], (int)lane[7]);
        }
        sha256_transform_8way(state, w);

        for (int k = 0; k < 16; k++) {
            uint32_t lane[8];
            for (int l = 0; l < 8; l++) {
                lane[l] = load_be32(blocks[l] + 64 + k * 4);
            }
            w[k] = _mm256_setr_epi32((int)lane[0], (int)lane[1], (int)lane[2], (int)lane[3],
                                     (int)lane[4], (int)lane[5], (int)lane[6], (int)lane[7]);
        }
        sha256_transform_8way(state, w);
    } else {
        __m256i w[16];
        for (int k = 0; k < 16; k++) {
            uint32_t lane[8];
            for (int l = 0; l < 8; l++) {
                lane[l] = load_be32(blocks[l] + k * 4);
            }
            w[k] = _mm256_setr_epi32((int)lane[0], (int)lane[1], (int)lane[2], (int)lane[3],
                                     (int)lane[4], (int)lane[5], (int)lane[6], (int)lane[7]);
        }
        sha256_transform_8way(state, w);
    }

    uint32_t raw_state[8][8];
    for (int s = 0; s < 8; s++) {
        _mm256_storeu_si256((__m256i*)raw_state[s], state[s]);
    }
    for (int l = 0; l < 8; l++) {
        for (int s = 0; s < 8; s++) {
            store_be32(outputs[l] + s * 4, raw_state[s][l]);
        }
    }
}

static void sha256d_avx2_8way(const uint8_t *inputs[8], size_t len, uint8_t outputs[8][32]) {
    uint8_t mid[8][32];
    sha256_8way(inputs, len, mid);
    const uint8_t *mid_ptrs[8];
    for (int i = 0; i < 8; i++) mid_ptrs[i] = mid[i];
    sha256_8way(mid_ptrs, 32, outputs);
}

static int sha256d_avx2_hash(void *state, const uint8_t *input, size_t input_len, uint8_t *output) {
    if (!output || (!input && input_len > 0)) return UQT_ERR_INVAL;
    (void)state;

    static const uint8_t empty_byte = 0;
    const uint8_t *src = input ? input : &empty_byte;
    const uint8_t *inputs[8];
    for (int i = 0; i < 8; i++) inputs[i] = src;

    uint8_t outputs[8][32];
    sha256d_avx2_8way(inputs, input_len, outputs);
    memcpy(output, outputs[0], 32);
    return UQT_SUCCESS;
}

static int sha256d_avx2_hash_batch(void *state, const uint8_t *inputs, size_t input_stride, uint8_t *outputs, size_t count) {
    if (!inputs || !outputs || count == 0) return UQT_ERR_INVAL;
    (void)state;

    size_t i = 0;
    while (i + 8 <= count) {
        const uint8_t *ptrs[8];
        uint8_t out[8][32];
        for (int k = 0; k < 8; k++) {
            ptrs[k] = inputs + (i + k) * input_stride;
        }
        sha256d_avx2_8way(ptrs, input_stride, out);
        for (int k = 0; k < 8; k++) {
            memcpy(outputs + (i + k) * 32, out[k], 32);
        }
        i += 8;
    }

    if (i < count) {
        const uint8_t *ptrs[8];
        uint8_t out[8][32];
        size_t rem = count - i;
        for (size_t k = 0; k < 8; k++) {
            if (k < rem) ptrs[k] = inputs + (i + k) * input_stride;
            else ptrs[k] = inputs + i * input_stride;
        }
        sha256d_avx2_8way(ptrs, input_stride, out);
        for (size_t k = 0; k < rem; k++) {
            memcpy(outputs + (i + k) * 32, out[k], 32);
        }
    }

    return UQT_SUCCESS;
}

const uqt_algo_backend_t sha256d_backend_avx2 = {
    .name = "avx2",
    .required_features = UQT_CPU_FEAT_AVX2,
    .init = NULL,
    .destroy = NULL,
    .hash = sha256d_avx2_hash,
    .hash_batch = sha256d_avx2_hash_batch,
    .batch_width = 8,
    .scratchpad_size = 0
};
