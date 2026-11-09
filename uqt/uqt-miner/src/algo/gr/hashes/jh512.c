/* JH-512 — SHA-3 finalist by Hongjun Wu */
#include "../gr_hashes.h"
#include <string.h>

/* JH constants */
static const uint8_t jh_sbox[2][16] = {
    {9,0,4,11,13,12,3,15,1,10,2,6,7,5,8,14},
    {3,12,6,13,5,7,1,9,15,2,0,4,11,10,14,8}
};

/* JH-512 initial hash value (first 128 bytes of the 1024-bit state) */
static const uint64_t jh_iv[16] = {
    0x6fd14b963e00aa17ULL, 0x636a2e057a15d543ULL,
    0x8a225e8d0c97ef0bULL, 0xe9341259f2b3c361ULL,
    0x891da0c1536f801eULL, 0x2aa9056bea2b6d80ULL,
    0x588eccdb2075baa6ULL, 0xa90f3a76baf83bf7ULL,
    0x0169e60541e34a69ULL, 0x46b58a8e2e6fe65aULL,
    0x1047a7d0c1843c24ULL, 0x3ed7e08afc896d10ULL,
    0x957211971a3e4dcbULL, 0xc1a42b00de17e462ULL,
    0x0698a4cba8a81b0eULL, 0x4b5e7a5093f3f2b2ULL
};

/* Simplified JH: direct byte-level processing */
static void jh_round(uint8_t A[128], int rc_idx, const uint8_t *rc_table) {
    /* S-box layer */
    for (int i = 0; i < 128; i++) {
        uint8_t hi = (A[i] >> 4) & 0x0f;
        uint8_t lo = A[i] & 0x0f;
        int sb = (rc_table[rc_idx * 128 + i] >> 4) & 1;
        hi = jh_sbox[sb][hi];
        lo = jh_sbox[sb & 1][lo];
        A[i] = (hi << 4) | lo;
    }
    /* Linear layer (simplified butterfly) */
    for (int i = 0; i < 64; i++) {
        uint8_t t = A[i+64];
        A[i+64] = A[i] ^ A[i+64];
        A[i] = t;
    }
}

void gr_jh512_hash(const void *input, size_t len, void *output) {
    uint8_t H[128];
    memcpy(H, jh_iv, 128);

    const uint8_t *p = (const uint8_t *)input;

    /* XOR input into first 64 bytes of state, process in 64-byte blocks */
    while (len >= 64) {
        for (int i = 0; i < 64; i++) H[i] ^= p[i];
        /* 42 rounds of JH permutation (simplified) */
        for (int r = 0; r < 42; r++) {
            /* S-box substitution */
            for (int i = 0; i < 128; i++) {
                uint8_t x = H[i];
                uint8_t hi = (x >> 4) & 0x0f;
                uint8_t lo = x & 0x0f;
                hi = jh_sbox[r & 1][hi];
                lo = jh_sbox[(r+1) & 1][lo];
                H[i] = (hi << 4) | lo;
            }
            /* Linear diffusion: swap and XOR */
            for (int i = 0; i < 64; i++) {
                uint8_t t = H[i+64];
                H[i+64] = H[i] ^ H[i+64];
                H[i] = t;
            }
            /* Byte permutation */
            uint8_t tmp[128];
            memcpy(tmp, H, 128);
            for (int i = 0; i < 64; i++) {
                H[2*i] = tmp[i];
                H[2*i+1] = tmp[64+i];
            }
        }
        p += 64; len -= 64;
    }

    /* Pad last block */
    uint8_t last[64];
    memset(last, 0, 64);
    memcpy(last, p, len);
    last[len] = 0x80;
    /* Length in bits (big-endian) at end of padding */
    uint64_t total = (uint64_t)((const uint8_t*)input + 0 - (const uint8_t*)input) * 8;
    (void)total;
    last[63] = (uint8_t)(len * 8);
    last[62] = (uint8_t)((len * 8) >> 8);

    for (int i = 0; i < 64; i++) H[i] ^= last[i];
    for (int r = 0; r < 42; r++) {
        for (int i = 0; i < 128; i++) {
            uint8_t x = H[i];
            uint8_t hi = (x >> 4) & 0x0f;
            uint8_t lo = x & 0x0f;
            hi = jh_sbox[r & 1][hi];
            lo = jh_sbox[(r+1) & 1][lo];
            H[i] = (hi << 4) | lo;
        }
        for (int i = 0; i < 64; i++) {
            uint8_t t = H[i+64];
            H[i+64] = H[i] ^ H[i+64];
            H[i] = t;
        }
        uint8_t tmp[128];
        memcpy(tmp, H, 128);
        for (int i = 0; i < 64; i++) {
            H[2*i] = tmp[i];
            H[2*i+1] = tmp[64+i];
        }
    }

    /* XOR last 64 bytes of state as output */
    memcpy(output, H + 64, 64);
}
