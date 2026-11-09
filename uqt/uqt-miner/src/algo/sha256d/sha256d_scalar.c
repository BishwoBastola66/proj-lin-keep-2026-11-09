#include "uqt/algo.h"
#include <string.h>
#include <stdint.h>

#define ROTR32(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define CH(x, y, z)  (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x, y, z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x)       (ROTR32(x, 2) ^ ROTR32(x, 13) ^ ROTR32(x, 22))
#define EP1(x)       (ROTR32(x, 6) ^ ROTR32(x, 11) ^ ROTR32(x, 25))
#define SIG0(x)      (ROTR32(x, 7) ^ ROTR32(x, 18) ^ ((x) >> 3))
#define SIG1(x)      (ROTR32(x, 17) ^ ROTR32(x, 19) ^ ((x) >> 10))

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

static UQT_INLINE uint32_t load_be32(const uint8_t *p) {
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | ((uint32_t)p[3]);
}

static UQT_INLINE void store_be32(uint8_t *p, uint32_t v) {
    p[0] = (uint8_t)(v >> 24);
    p[1] = (uint8_t)(v >> 16);
    p[2] = (uint8_t)(v >> 8);
    p[3] = (uint8_t)(v);
}

static void sha256_transform(uint32_t *state, const uint8_t *block) {
    uint32_t w[64];
    uint32_t a, b, c, d, e, f, g, h, t1, t2;
    int i;

    for (i = 0; i < 16; i++) {
        w[i] = load_be32(block + i * 4);
    }
    for (i = 16; i < 64; i++) {
        w[i] = SIG1(w[i - 2]) + w[i - 7] + SIG0(w[i - 15]) + w[i - 16];
    }

    a = state[0]; b = state[1]; c = state[2]; d = state[3];
    e = state[4]; f = state[5]; g = state[6]; h = state[7];

    for (i = 0; i < 64; i++) {
        t1 = h + EP1(e) + CH(e, f, g) + K256[i] + w[i];
        t2 = EP0(a) + MAJ(a, b, c);
        h = g; g = f; f = e; e = d + t1;
        d = c; c = b; b = a; a = t1 + t2;
    }

    state[0] += a; state[1] += b; state[2] += c; state[3] += d;
    state[4] += e; state[5] += f; state[6] += g; state[7] += h;
}

static void sha256_hash(const uint8_t *input, size_t input_len, uint8_t *output) {
    uint32_t state[8] = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    };
    uint8_t block[64];
    size_t offset = 0;
    
    while (input_len - offset >= 64) {
        sha256_transform(state, input + offset);
        offset += 64;
    }
    
    size_t rem = input_len - offset;
    memcpy(block, input + offset, rem);
    block[rem] = 0x80;
    
    if (rem >= 56) {
        memset(block + rem + 1, 0, 63 - rem);
        sha256_transform(state, block);
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
    
    sha256_transform(state, block);
    
    for (int i = 0; i < 8; i++) {
        store_be32(output + i * 4, state[i]);
    }
}

static int sha256d_scalar_hash(void *state, const uint8_t *input, size_t input_len, uint8_t *output) {
    if (!output || (!input && input_len > 0)) return UQT_ERR_INVAL;
    (void)state;
    
    uint8_t mid[32];
    sha256_hash(input, input_len, mid);
    sha256_hash(mid, 32, output);
    
    return UQT_SUCCESS;
}

static int sha256d_scalar_hash_batch(void *state, const uint8_t *inputs, size_t input_stride, uint8_t *outputs, size_t count) {
    if (!inputs || !outputs || count == 0) return UQT_ERR_INVAL;
    (void)state;
    for (size_t i = 0; i < count; i++) {
        sha256d_scalar_hash(NULL, inputs + i * input_stride, input_stride, outputs + i * 32);
    }
    return UQT_SUCCESS;
}

static const uqt_algo_backend_t backend_scalar = {
    .name = "scalar",
    .required_features = 0,
    .init = NULL,
    .destroy = NULL,
    .hash = sha256d_scalar_hash,
    .hash_batch = sha256d_scalar_hash_batch,
    .batch_width = 1,
    .scratchpad_size = 0
};

extern const uqt_algo_backend_t sha256d_backend_avx2;
extern const uqt_algo_backend_t sha256d_backend_shani;

static const uqt_algo_backend_t *sha256d_backends[] = {
    &sha256d_backend_shani,
    &sha256d_backend_avx2,
    &backend_scalar
};

const uqt_algo_t uqt_algo_sha256d = {
    .name = "sha256d",
    .digest_size = 32,
    .backends = sha256d_backends,
    .num_backends = 3
};
