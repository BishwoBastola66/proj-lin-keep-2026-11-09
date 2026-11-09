/* BLAKE-512 — SHA-3 finalist hash function
 * Reference: Jean-Philippe Aumasson et al. */
#include "../gr_hashes.h"
#include <string.h>

#define ROTR64(x,n) (((x) >> (n)) | ((x) << (64-(n))))

static const uint64_t blake_iv[8] = {
    0x6a09e667f3bcc908ULL, 0xbb67ae8584caa73bULL,
    0x3c6ef372fe94f82bULL, 0xa54ff53a5f1d36f1ULL,
    0x510e527fade682d1ULL, 0x9b05688c2b3e6c1fULL,
    0x1f83d9abfb41bd6bULL, 0x5be0cd19137e2179ULL
};

static const uint64_t blake_c[16] = {
    0x243f6a8885a308d3ULL, 0x13198a2e03707344ULL,
    0xa4093822299f31d0ULL, 0x082efa98ec4e6c89ULL,
    0x452821e638d01377ULL, 0xbe5466cf34e90c6cULL,
    0xc0ac29b7c97c50ddULL, 0x3f84d5b5b5470917ULL,
    0x9216d5d98979fb1bULL, 0xd1310ba698dfb5acULL,
    0x2ffd72dbd01adfb7ULL, 0xb8e1afed6a267e96ULL,
    0xba7c9045f12c7f99ULL, 0x24a19947b3916cf7ULL,
    0x0801f2e2858efc16ULL, 0x636920d871574e69ULL
};

static const uint8_t blake_sigma[16][16] = {
    { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15},
    {14,10, 4, 8, 9,15,13, 6, 1,12, 0, 2,11, 7, 5, 3},
    {11, 8,12, 0, 5, 2,15,13,10,14, 3, 6, 7, 1, 9, 4},
    { 7, 9, 3, 1,13,12,11,14, 2, 6, 5,10, 4, 0,15, 8},
    { 9, 0, 5, 7, 2, 4,10,15,14, 1,11,12, 6, 8, 3,13},
    { 2,12, 6,10, 0,11, 8, 3, 4,13, 7, 5,15,14, 1, 9},
    {12, 5, 1,15,14,13, 4,10, 0, 7, 6, 3, 9, 2, 8,11},
    {13,11, 7,14,12, 1, 3, 9, 5, 0,15, 4, 8, 6, 2,10},
    { 6,15,14, 9,11, 3, 0, 8,12, 2,13, 7, 1, 4,10, 5},
    {10, 2, 8, 4, 7, 6, 1, 5,15,11, 9,14, 3,12,13, 0},
    { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15},
    {14,10, 4, 8, 9,15,13, 6, 1,12, 0, 2,11, 7, 5, 3},
    {11, 8,12, 0, 5, 2,15,13,10,14, 3, 6, 7, 1, 9, 4},
    { 7, 9, 3, 1,13,12,11,14, 2, 6, 5,10, 4, 0,15, 8},
    { 9, 0, 5, 7, 2, 4,10,15,14, 1,11,12, 6, 8, 3,13},
    { 2,12, 6,10, 0,11, 8, 3, 4,13, 7, 5,15,14, 1, 9}
};

static uint64_t load64(const uint8_t *p) {
    return ((uint64_t)p[0]<<56)|((uint64_t)p[1]<<48)|((uint64_t)p[2]<<40)|((uint64_t)p[3]<<32)|
           ((uint64_t)p[4]<<24)|((uint64_t)p[5]<<16)|((uint64_t)p[6]<<8)|((uint64_t)p[7]);
}

static void store64(uint8_t *p, uint64_t v) {
    p[0]=(uint8_t)(v>>56); p[1]=(uint8_t)(v>>48); p[2]=(uint8_t)(v>>40); p[3]=(uint8_t)(v>>32);
    p[4]=(uint8_t)(v>>24); p[5]=(uint8_t)(v>>16); p[6]=(uint8_t)(v>>8);  p[7]=(uint8_t)(v);
}

#define G(a,b,c,d,i) do { \
    a += b + (m[blake_sigma[r][2*i]] ^ blake_c[blake_sigma[r][2*i+1]]); \
    d = ROTR64(d ^ a, 32); \
    c += d; \
    b = ROTR64(b ^ c, 25); \
    a += b + (m[blake_sigma[r][2*i+1]] ^ blake_c[blake_sigma[r][2*i]]); \
    d = ROTR64(d ^ a, 16); \
    c += d; \
    b = ROTR64(b ^ c, 11); \
} while(0)

static void blake512_compress(uint64_t h[8], const uint8_t block[128], uint64_t t0, uint64_t t1) {
    uint64_t v[16], m[16];
    int r;

    for (int i = 0; i < 16; i++) m[i] = load64(block + i*8);

    for (int i = 0; i < 8; i++) v[i] = h[i];
    v[8]  = blake_c[0]; v[9]  = blake_c[1]; v[10] = blake_c[2]; v[11] = blake_c[3];
    v[12] = blake_c[4]; v[13] = blake_c[5]; v[14] = blake_c[6]; v[15] = blake_c[7];
    v[12] ^= t0; v[13] ^= t0; v[14] ^= t1; v[15] ^= t1;

    for (r = 0; r < 16; r++) {
        G(v[0],v[4],v[8], v[12],0); G(v[1],v[5],v[9], v[13],1);
        G(v[2],v[6],v[10],v[14],2); G(v[3],v[7],v[11],v[15],3);
        G(v[0],v[5],v[10],v[15],4); G(v[1],v[6],v[11],v[12],5);
        G(v[2],v[7],v[8], v[13],6); G(v[3],v[4],v[9], v[14],7);
    }
    for (int i = 0; i < 8; i++) h[i] ^= v[i] ^ v[i+8];
}

void gr_blake512_hash(const void *input, size_t len, void *output) {
    uint64_t h[8];
    uint8_t buf[128];
    memcpy(h, blake_iv, sizeof(h));

    size_t left = len;
    const uint8_t *p = (const uint8_t *)input;
    uint64_t t = 0;

    while (left > 128) {
        t += 1024;
        blake512_compress(h, p, t, 0);
        p += 128;
        left -= 128;
    }

    t += left * 8;
    memset(buf, 0, 128);
    memcpy(buf, p, left);
    buf[left] |= 0x80;
    if (left >= 111) {
        blake512_compress(h, buf, t, 0);
        memset(buf, 0, 128);
    }
    buf[111] |= 0x01;
    store64(buf + 112, 0);
    store64(buf + 120, t);
    blake512_compress(h, buf, t, 0);

    uint8_t *out = (uint8_t *)output;
    for (int i = 0; i < 8; i++) store64(out + i*8, h[i]);
}
