#include "uqt/algo.h"
#include <string.h>

#if defined(__GNUC__) || defined(__clang__)
#include <x86intrin.h>
#elif defined(_MSC_VER)
#include <intrin.h>
#endif

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

static inline void sha256_shani_transform(__m128i* state, const uint8_t* block) {
    __m128i msg0, msg1, msg2, msg3;
    __m128i abef_save, cdgh_save;
    __m128i abef, cdgh;
    __m128i shuf_mask = _mm_set_epi64x(0x0c0d0e0f08090a0bULL, 0x0405060700010203ULL);

    msg0 = _mm_shuffle_epi8(_mm_loadu_si128((const __m128i*)(block + 0)), shuf_mask);
    msg1 = _mm_shuffle_epi8(_mm_loadu_si128((const __m128i*)(block + 16)), shuf_mask);
    msg2 = _mm_shuffle_epi8(_mm_loadu_si128((const __m128i*)(block + 32)), shuf_mask);
    msg3 = _mm_shuffle_epi8(_mm_loadu_si128((const __m128i*)(block + 48)), shuf_mask);

    abef = state[0];
    cdgh = state[1];
    abef_save = abef;
    cdgh_save = cdgh;

    for (int i = 0; i < 64; i += 16) {
        if (i > 0) {
            msg0 = _mm_sha256msg1_epu32(msg0, msg1);
            __m128i tmp = _mm_alignr_epi8(msg3, msg2, 4);
            msg0 = _mm_add_epi32(msg0, tmp);
            msg0 = _mm_sha256msg2_epu32(msg0, msg3);
        }

        __m128i k = _mm_loadu_si128((const __m128i*)&K256[i]);
        __m128i tm = _mm_add_epi32(msg0, k);
        cdgh = _mm_sha256rnds2_epu32(cdgh, abef, tm);
        tm = _mm_shuffle_epi32(tm, 0x0E);
        abef = _mm_sha256rnds2_epu32(abef, cdgh, tm);

        if (i > 0) {
            msg1 = _mm_sha256msg1_epu32(msg1, msg2);
            __m128i tmp = _mm_alignr_epi8(msg0, msg3, 4);
            msg1 = _mm_add_epi32(msg1, tmp);
            msg1 = _mm_sha256msg2_epu32(msg1, msg0);
        }

        k = _mm_loadu_si128((const __m128i*)&K256[i + 4]);
        tm = _mm_add_epi32(msg1, k);
        cdgh = _mm_sha256rnds2_epu32(cdgh, abef, tm);
        tm = _mm_shuffle_epi32(tm, 0x0E);
        abef = _mm_sha256rnds2_epu32(abef, cdgh, tm);

        if (i > 0) {
            msg2 = _mm_sha256msg1_epu32(msg2, msg3);
            __m128i tmp = _mm_alignr_epi8(msg1, msg0, 4);
            msg2 = _mm_add_epi32(msg2, tmp);
            msg2 = _mm_sha256msg2_epu32(msg2, msg1);
        }

        k = _mm_loadu_si128((const __m128i*)&K256[i + 8]);
        tm = _mm_add_epi32(msg2, k);
        cdgh = _mm_sha256rnds2_epu32(cdgh, abef, tm);
        tm = _mm_shuffle_epi32(tm, 0x0E);
        abef = _mm_sha256rnds2_epu32(abef, cdgh, tm);

        if (i > 0) {
            msg3 = _mm_sha256msg1_epu32(msg3, msg0);
            __m128i tmp = _mm_alignr_epi8(msg2, msg1, 4);
            msg3 = _mm_add_epi32(msg3, tmp);
            msg3 = _mm_sha256msg2_epu32(msg3, msg2);
        }

        k = _mm_loadu_si128((const __m128i*)&K256[i + 12]);
        tm = _mm_add_epi32(msg3, k);
        cdgh = _mm_sha256rnds2_epu32(cdgh, abef, tm);
        tm = _mm_shuffle_epi32(tm, 0x0E);
        abef = _mm_sha256rnds2_epu32(abef, cdgh, tm);
    }

    state[0] = _mm_add_epi32(abef, abef_save);
    state[1] = _mm_add_epi32(cdgh, cdgh_save);
}

static inline void store_be32(uint8_t *p, uint32_t v) {
    p[0] = (uint8_t)(v >> 24);
    p[1] = (uint8_t)(v >> 16);
    p[2] = (uint8_t)(v >> 8);
    p[3] = (uint8_t)(v);
}

static inline void store_state(__m128i *state, uint8_t *out) {
    uint32_t s0[4], s1[4];
    _mm_storeu_si128((__m128i*)s0, state[0]);
    _mm_storeu_si128((__m128i*)s1, state[1]);
    store_be32(out + 0 * 4, s0[3]); // A
    store_be32(out + 1 * 4, s0[2]); // B
    store_be32(out + 2 * 4, s1[3]); // C
    store_be32(out + 3 * 4, s1[2]); // D
    store_be32(out + 4 * 4, s0[1]); // E
    store_be32(out + 5 * 4, s0[0]); // F
    store_be32(out + 6 * 4, s1[1]); // G
    store_be32(out + 7 * 4, s1[0]); // H
}

static void sha256_shani_single(const uint8_t *input, size_t input_len, uint8_t *output) {
    __m128i state[2];
    state[0] = _mm_set_epi32((int)0x6a09e667, (int)0xbb67ae85, (int)0x510e527f, (int)0x9b05688c);
    state[1] = _mm_set_epi32((int)0x3c6ef372, (int)0xa54ff53a, (int)0x1f83d9ab, (int)0x5be0cd19);

    size_t offset = 0;
    while (input_len - offset >= 64) {
        sha256_shani_transform(state, input + offset);
        offset += 64;
    }

    uint8_t block[64];
    size_t rem = input_len - offset;
    if (input && rem > 0) {
        memcpy(block, input + offset, rem);
    }
    block[rem] = 0x80;

    if (rem >= 56) {
        memset(block + rem + 1, 0, 63 - rem);
        sha256_shani_transform(state, block);
        memset(block, 0, 56);
    } else {
        memset(block + rem + 1, 0, 55 - rem);
    }

    uint64_t bitlen = (uint64_t)input_len * 8;
    block[56] = (uint8_t)(bitlen >> 56);
    block[57] = (uint8_t)(bitlen >> 48);
    block[58] = (uint8_t)(bitlen >> 40);
    block[59] = (uint8_t)(bitlen >> 32);
    block[60] = (uint8_t)(bitlen >> 24);
    block[61] = (uint8_t)(bitlen >> 16);
    block[62] = (uint8_t)(bitlen >> 8);
    block[63] = (uint8_t)(bitlen);

    sha256_shani_transform(state, block);
    store_state(state, output);
}

static int sha256d_shani_hash(void *state, const uint8_t *input, size_t input_len, uint8_t *output) {
    if (!output || (!input && input_len > 0)) return UQT_ERR_INVAL;
    (void)state;

    uint8_t mid[32];
    sha256_shani_single(input, input_len, mid);
    sha256_shani_single(mid, 32, output);
    return UQT_SUCCESS;
}

static int sha256d_shani_hash_batch(void *state, const uint8_t *inputs, size_t input_stride, uint8_t *outputs, size_t count) {
    if (!inputs || !outputs || count == 0) return UQT_ERR_INVAL;
    (void)state;
    for (size_t i = 0; i < count; i++) {
        sha256d_shani_hash(NULL, inputs + i * input_stride, input_stride, outputs + i * 32);
    }
    return UQT_SUCCESS;
}

const uqt_algo_backend_t sha256d_backend_shani = {
    .name = "sha-ni",
    .required_features = UQT_CPU_FEAT_SHANI | UQT_CPU_FEAT_SSE41,
    .init = NULL,
    .destroy = NULL,
    .hash = sha256d_shani_hash,
    .hash_batch = sha256d_shani_hash_batch,
    .batch_width = 1,
    .scratchpad_size = 0
};
