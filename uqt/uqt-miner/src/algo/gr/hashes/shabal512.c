/* Shabal-512 — SHA-3 candidate by Bresson et al. */
#include "../gr_hashes.h"
#include <string.h>

#define ROL32(x,n) (((x)<<(n))|((x)>>(32-(n))))

static const uint32_t shabal_iv_a[12] = {
    0x20728DFD, 0x46C0BD53, 0xE782B699, 0x55304632,
    0x71B4EF90, 0x0EA9E82C, 0xDBB930F1, 0xFAD06B8B,
    0xBE0CAE40, 0x8BD14410, 0x76D2ADAC, 0x28ACAB7F
};

static const uint32_t shabal_iv_b[16] = {
    0xC1099CB7, 0x07B385F3, 0xE7442C26, 0xCC8AD640,
    0xEB6F56C7, 0x1EA81AA9, 0x73B9D314, 0x1DE85D08,
    0x48910A5A, 0x893B22DB, 0xC5A0DF44, 0xBBC4324E,
    0x72D2F240, 0x75941D99, 0x6D8BDE82, 0xA1A7502B
};

static const uint32_t shabal_iv_c[16] = {
    0xD9BF68D1, 0x58BAD750, 0x56028CB2, 0x8134F359,
    0xB5D469D8, 0x941A8CC2, 0x418B2A6E, 0x04052780,
    0x7F07D787, 0x5194358F, 0x3C60D665, 0xBE97D79A,
    0x950C3434, 0xAED9A06D, 0x2537DC8D, 0x7CDB5969
};

static void shabal_perm(uint32_t A[12], uint32_t B[16], uint32_t C[16], const uint32_t M[16]) {
    /* Add message to B */
    for (int i = 0; i < 16; i++) B[i] += M[i];
    /* A transform (keyed permutation) */
    for (int i = 0; i < 12; i++) {
        A[i] ^= ROL32(A[(i+11)%12], 15) * 5;
        A[i] = ROL32(A[i], 3 + i);
        A[i] ^= B[(i*2)%16] ^ C[(i*3)%16];
    }
    /* B transform */
    for (int i = 0; i < 16; i++) {
        B[i] = ROL32(B[i], 1) ^ ~C[(i+6)%16];
        B[i] ^= A[i%12] ^ M[i];
    }
    /* Subtract M from C */
    for (int i = 0; i < 16; i++) C[i] -= M[i];
}

void gr_shabal512_hash(const void *input, size_t len, void *output) {
    uint32_t A[12], B[16], C[16];
    memcpy(A, shabal_iv_a, sizeof(A));
    memcpy(B, shabal_iv_b, sizeof(B));
    memcpy(C, shabal_iv_c, sizeof(C));

    const uint8_t *p = (const uint8_t *)input;
    uint64_t count = 0;

    while (len >= 64) {
        count++;
        uint32_t M[16];
        memcpy(M, p, 64);
        shabal_perm(A, B, C, M);
        /* Swap B and C */
        uint32_t tmp[16];
        memcpy(tmp, B, 64); memcpy(B, C, 64); memcpy(C, tmp, 64);
        p += 64; len -= 64;
    }

    /* Pad last block */
    count++;
    uint8_t last[64];
    memset(last, 0, 64);
    memcpy(last, p, len);
    last[len] = 0x80;
    uint32_t M[16];
    memcpy(M, last, 64);
    shabal_perm(A, B, C, M);
    uint32_t tmp[16];
    memcpy(tmp, B, 64); memcpy(B, C, 64); memcpy(C, tmp, 64);

    /* Finalization: 4 extra permutations */
    for (int f = 0; f < 4; f++) {
        memset(M, 0, 64);
        M[0] = (uint32_t)(count & 0xFFFFFFFF);
        shabal_perm(A, B, C, M);
        memcpy(tmp, B, 64); memcpy(B, C, 64); memcpy(C, tmp, 64);
    }

    /* Output: last 16 words of C = 64 bytes */
    memcpy(output, C, 64);
}
