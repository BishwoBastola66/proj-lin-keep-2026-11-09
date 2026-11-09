/* Keccak-512 — SHA-3 standard (FIPS 202) */
#include "../gr_hashes.h"
#include <string.h>

static const uint64_t keccak_rc[24] = {
    0x0000000000000001ULL, 0x0000000000008082ULL, 0x800000000000808aULL,
    0x8000000080008000ULL, 0x000000000000808bULL, 0x0000000080000001ULL,
    0x8000000080008081ULL, 0x8000000000008009ULL, 0x000000000000008aULL,
    0x0000000000000088ULL, 0x0000000080008009ULL, 0x000000008000000aULL,
    0x000000008000808bULL, 0x800000000000008bULL, 0x8000000000008089ULL,
    0x8000000000008003ULL, 0x8000000000008002ULL, 0x8000000000000080ULL,
    0x000000000000800aULL, 0x800000008000000aULL, 0x8000000080008081ULL,
    0x8000000000008080ULL, 0x0000000080000001ULL, 0x8000000080008008ULL
};

#define ROL64(x, y) (((x) << (y)) | ((x) >> (64 - (y))))

static void keccak_f1600(uint64_t st[25]) {
    for (int r = 0; r < 24; r++) {
        uint64_t bc[5];
        /* Theta */
        for (int i = 0; i < 5; i++)
            bc[i] = st[i] ^ st[i+5] ^ st[i+10] ^ st[i+15] ^ st[i+20];
        for (int i = 0; i < 5; i++) {
            uint64_t t = bc[(i+4)%5] ^ ROL64(bc[(i+1)%5], 1);
            for (int j = 0; j < 25; j += 5) st[j+i] ^= t;
        }
        /* Rho + Pi */
        uint64_t t = st[1];
        static const int piln[24] = {
            10,7,11,17,18,3,5,16,8,21,24,4,15,23,19,13,12,2,20,14,22,9,6,1
        };
        static const int rotc[24] = {
            1,3,6,10,15,21,28,36,45,55,2,14,27,41,56,8,25,43,62,18,39,61,20,44
        };
        for (int i = 0; i < 24; i++) {
            uint64_t tmp = st[piln[i]];
            st[piln[i]] = ROL64(t, rotc[i]);
            t = tmp;
        }
        /* Chi */
        for (int j = 0; j < 25; j += 5) {
            uint64_t tmp[5];
            for (int i = 0; i < 5; i++) tmp[i] = st[j+i];
            for (int i = 0; i < 5; i++)
                st[j+i] = tmp[i] ^ ((~tmp[(i+1)%5]) & tmp[(i+2)%5]);
        }
        /* Iota */
        st[0] ^= keccak_rc[r];
    }
}

void gr_keccak512_hash(const void *input, size_t len, void *output) {
    uint64_t st[25];
    memset(st, 0, sizeof(st));
    const uint8_t *p = (const uint8_t *)input;
    const size_t rate = 72; /* rate for 512-bit capacity */

    while (len >= rate) {
        for (size_t i = 0; i < rate/8; i++) {
            uint64_t v;
            memcpy(&v, p + i*8, 8);
            st[i] ^= v;
        }
        keccak_f1600(st);
        p += rate;
        len -= rate;
    }

    uint8_t tmp[72];
    memset(tmp, 0, rate);
    memcpy(tmp, p, len);
    tmp[len] = 0x01;
    tmp[rate-1] |= 0x80;
    for (size_t i = 0; i < rate/8; i++) {
        uint64_t v;
        memcpy(&v, tmp + i*8, 8);
        st[i] ^= v;
    }
    keccak_f1600(st);

    memcpy(output, st, 64);
}
