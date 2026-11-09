/* Skein-512 — SHA-3 finalist, Threefish-based hash */
#include "../gr_hashes.h"
#include <string.h>

#define SKEIN_BLOCK_BYTES 64
#define ROL64(x,n) (((x)<<(n))|((x)>>(64-(n))))

static const uint64_t skein_iv[8] = {
    0x4903ADFF749C51CEULL, 0x0D95DE399746DF03ULL,
    0x8FD1934127C79BCEULL, 0x9A255629FF352CB1ULL,
    0x5DB62599DF6CA7B0ULL, 0xEABE394CA9D5C3F4ULL,
    0x991112C71A75B523ULL, 0xAE18A40B660FCC33ULL
};

static const int R[8][4] = {
    {46,36,19,37}, {33,27,14,42}, {17,49,36,39}, {44, 9,54,56},
    {39,30,34,24}, {13,50,10,17}, {25,29,39,43}, {8, 35,56,22}
};

static void threefish512(uint64_t out[8], const uint64_t key[8], const uint64_t tweak[2], const uint64_t plain[8]) {
    uint64_t ks[9], ts[3], x[8];
    ks[8] = 0x1BD11BDAA9FC1A22ULL;
    for (int i = 0; i < 8; i++) { ks[i] = key[i]; ks[8] ^= key[i]; }
    ts[0] = tweak[0]; ts[1] = tweak[1]; ts[2] = tweak[0] ^ tweak[1];
    for (int i = 0; i < 8; i++) x[i] = plain[i];

    for (int d = 0; d < 72; d += 8) {
        int s = d / 4;
        /* Key injection */
        if (d % 4 == 0) {
            for (int i = 0; i < 8; i++) x[i] += ks[(s+i)%9];
            x[5] += ts[s%3]; x[6] += ts[(s+1)%3]; x[7] += (uint64_t)s;
        }
        /* Mix rounds */
        for (int j = 0; j < 4; j++) {
            int rr = (d + j) % 8;
            x[0] += x[1]; x[1] = ROL64(x[1], R[rr][0]); x[1] ^= x[0];
            x[2] += x[3]; x[3] = ROL64(x[3], R[rr][1]); x[3] ^= x[2];
            x[4] += x[5]; x[5] = ROL64(x[5], R[rr][2]); x[5] ^= x[4];
            x[6] += x[7]; x[7] = ROL64(x[7], R[rr][3]); x[7] ^= x[6];
            /* Permute */
            uint64_t t1 = x[1]; x[1] = x[3]; x[3] = x[5]; x[5] = x[7]; x[7] = t1;
        }
        s = (d + 4) / 4;
        for (int i = 0; i < 8; i++) x[i] += ks[(s+i)%9];
        x[5] += ts[s%3]; x[6] += ts[(s+1)%3]; x[7] += (uint64_t)s;

        for (int j = 0; j < 4; j++) {
            int rr = (d + 4 + j) % 8;
            x[0] += x[1]; x[1] = ROL64(x[1], R[rr][0]); x[1] ^= x[0];
            x[2] += x[3]; x[3] = ROL64(x[3], R[rr][1]); x[3] ^= x[2];
            x[4] += x[5]; x[5] = ROL64(x[5], R[rr][2]); x[5] ^= x[4];
            x[6] += x[7]; x[7] = ROL64(x[7], R[rr][3]); x[7] ^= x[6];
            uint64_t t1 = x[1]; x[1] = x[3]; x[3] = x[5]; x[5] = x[7]; x[7] = t1;
        }
    }
    /* Final key injection */
    int s = 18;
    for (int i = 0; i < 8; i++) out[i] = x[i] + ks[(s+i)%9];
    out[5] += ts[s%3]; out[6] += ts[(s+1)%3]; out[7] += (uint64_t)s;
}

void gr_skein512_hash(const void *input, size_t len, void *output) {
    uint64_t h[8], msg[8], tw[2], cipher[8];
    memcpy(h, skein_iv, sizeof(h));
    const uint8_t *p = (const uint8_t *)input;
    uint64_t pos = 0;

    while (len > SKEIN_BLOCK_BYTES) {
        memcpy(msg, p, SKEIN_BLOCK_BYTES);
        pos += SKEIN_BLOCK_BYTES;
        tw[0] = pos; tw[1] = (pos == SKEIN_BLOCK_BYTES) ? (0x70ULL << 56) : (0x30ULL << 56);
        if (pos == SKEIN_BLOCK_BYTES) tw[1] |= (1ULL << 62);
        threefish512(cipher, h, tw, msg);
        for (int i = 0; i < 8; i++) h[i] = cipher[i] ^ msg[i];
        p += SKEIN_BLOCK_BYTES;
        len -= SKEIN_BLOCK_BYTES;
    }

    uint8_t last[64];
    memset(last, 0, 64);
    memcpy(last, p, len);
    memcpy(msg, last, 64);
    pos += len;
    tw[0] = pos; tw[1] = (0x70ULL << 56) | (1ULL << 63);
    if (pos <= SKEIN_BLOCK_BYTES) tw[1] |= (1ULL << 62);
    threefish512(cipher, h, tw, msg);
    for (int i = 0; i < 8; i++) h[i] = cipher[i] ^ msg[i];

    /* Output */
    memset(msg, 0, 64);
    tw[0] = 8; tw[1] = (0xFFULL << 56) | (1ULL << 63) | (1ULL << 62);
    threefish512(cipher, h, tw, msg);
    memcpy(output, cipher, 64);
}
