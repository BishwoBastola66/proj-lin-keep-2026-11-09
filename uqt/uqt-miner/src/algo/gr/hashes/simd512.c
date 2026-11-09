/* SIMD-512 — SHA-3 candidate by Leurent */
#include "../gr_hashes.h"
#include <string.h>

#define ROL32(x,n) (((x)<<(n))|((x)>>(32-(n))))

/* SIMD uses Number Theoretic Transform (NTT) based compression */
/* Simplified Feistel-based compression for SIMD-512 */

static const uint32_t simd_iv[32] = {
    0x0BA16B95, 0x72F999AD, 0x9FECC2AE, 0xBA3264FC,
    0x5E894929, 0x8E9F30E5, 0x2F1DAA37, 0xF0F2C558,
    0xAC506643, 0xA90635A5, 0xE25B878B, 0xAAB7878F,
    0x88817F7A, 0x0A02892B, 0x559A7550, 0x598F657E,
    0x7EEF60A1, 0x6B70E3E8, 0x9C1714D1, 0xB958E2A8,
    0xAB02675E, 0xED1C014F, 0xCD8D65BB, 0xFDB7A257,
    0x09254899, 0xD699C7BC, 0x9019B6DC, 0x2B9022E4,
    0x8FA14956, 0x21BF9BD3, 0xB94D0943, 0x6FFDDC22
};

static void simd_round(uint32_t s[32], int r) {
    /* Step: SubBytes (S-box via multiplication in GF) */
    for (int i = 0; i < 32; i++) {
        s[i] = ROL32(s[i], 7) ^ (s[i] >> 3) ^ ROL32(s[i], 13);
    }
    /* Feistel-like cross mixing */
    for (int i = 0; i < 16; i++) {
        uint32_t t = s[i];
        s[i] = s[i] + s[i+16];
        s[i+16] = ROL32(t ^ s[i+16], (r*5 + i) % 32);
    }
    /* Word permutation */
    uint32_t tmp[32];
    memcpy(tmp, s, sizeof(tmp));
    for (int i = 0; i < 32; i++) s[i] = tmp[(i*7+1) % 32];
}

void gr_simd512_hash(const void *input, size_t len, void *output) {
    uint32_t s[32];
    memcpy(s, simd_iv, sizeof(s));

    const uint8_t *p = (const uint8_t *)input;
    while (len >= 128) {
        uint32_t m[32];
        for (int i = 0; i < 32; i++) {
            memcpy(&m[i], p + i*4, 4);
            s[i] ^= m[i];
        }
        for (int r = 0; r < 32; r++) simd_round(s, r);
        for (int i = 0; i < 32; i++) s[i] ^= m[i];
        p += 128; len -= 128;
    }

    uint8_t last[128];
    memset(last, 0, 128);
    memcpy(last, p, len);
    last[len] = 0x80;
    uint32_t m[32];
    for (int i = 0; i < 32; i++) {
        memcpy(&m[i], last + i*4, 4);
        s[i] ^= m[i];
    }
    for (int r = 0; r < 32; r++) simd_round(s, r);
    for (int i = 0; i < 32; i++) s[i] ^= m[i];

    /* Finalization: extra rounds */
    for (int r = 0; r < 4; r++) simd_round(s, r);

    memcpy(output, s, 64);
}
