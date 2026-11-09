/* BMW-512 (Blue Midnight Wish) — SHA-3 candidate by Gligoroski et al. */
#include "../gr_hashes.h"
#include <string.h>

#define SHR64(x,n) ((x) >> (n))
#define SHL64(x,n) ((x) << (n))
#define ROL64(x,n) (((x)<<(n))|((x)>>(64-(n))))
#define ROR64(x,n) (((x)>>(n))|((x)<<(64-(n))))

static const uint64_t bmw_iv[16] = {
    0x8081828384858687ULL, 0x88898A8B8C8D8E8FULL,
    0x9091929394959697ULL, 0x98999A9B9C9D9E9FULL,
    0xA0A1A2A3A4A5A6A7ULL, 0xA8A9AAABACADAEAFULL,
    0xB0B1B2B3B4B5B6B7ULL, 0xB8B9BABBBCBDBEBFULL,
    0xC0C1C2C3C4C5C6C7ULL, 0xC8C9CACBCCCDCECFULL,
    0xD0D1D2D3D4D5D6D7ULL, 0xD8D9DADBDCDDDEDFULL,
    0xE0E1E2E3E4E5E6E7ULL, 0xE8E9EAEBECEDEEEFULL,
    0xF0F1F2F3F4F5F6F7ULL, 0xF8F9FAFBFCFDFEFFULL
};

static uint64_t s64_0(uint64_t x) { return SHR64(x,1)^SHL64(x,3)^ROL64(x,4)^ROL64(x,37); }
static uint64_t s64_1(uint64_t x) { return SHR64(x,1)^SHL64(x,2)^ROL64(x,13)^ROL64(x,43); }
static uint64_t s64_2(uint64_t x) { return SHR64(x,2)^SHL64(x,1)^ROL64(x,19)^ROL64(x,53); }
static uint64_t s64_3(uint64_t x) { return SHR64(x,2)^SHL64(x,2)^ROL64(x,28)^ROL64(x,59); }
static uint64_t s64_4(uint64_t x) { return SHR64(x,1)^x; }
static uint64_t s64_5(uint64_t x) { return SHR64(x,2)^x; }

static void bmw512_compress(uint64_t h[16], const uint64_t m[16]) {
    uint64_t q[32], xl, xh;

    /* Expand 1 */
    for (int i = 0; i < 16; i++) {
        q[i] = h[i] ^ m[i];
    }

    uint64_t w[16];
    for (int i = 0; i < 16; i++) w[i] = q[i];

    q[0] = s64_0(w[5]-w[7]+w[10]+w[13]+w[14]) + h[1];
    q[1] = s64_1(w[6]-w[8]+w[11]+w[14]-w[15]) + h[2];
    q[2] = s64_2(w[0]+w[7]+w[9]-w[12]+w[15]) + h[3];
    q[3] = s64_3(w[0]-w[1]+w[8]-w[10]+w[13]) + h[4];
    q[4] = s64_4(w[1]+w[2]+w[9]-w[11]-w[14]) + h[5];
    q[5] = s64_0(w[3]-w[2]+w[10]-w[12]+w[15]) + h[6];
    q[6] = s64_1(w[4]-w[0]-w[3]-w[11]+w[13]) + h[7];
    q[7] = s64_2(w[1]-w[4]-w[5]-w[12]-w[14]) + h[8];
    q[8] = s64_3(w[2]-w[5]-w[6]+w[13]-w[15]) + h[9];
    q[9] = s64_4(w[0]-w[3]+w[6]-w[7]+w[14]) + h[10];
    q[10] = s64_0(w[8]-w[1]-w[4]-w[7]+w[15]) + h[11];
    q[11] = s64_1(w[8]-w[0]-w[2]-w[5]+w[9]) + h[12];
    q[12] = s64_2(w[1]+w[3]-w[6]-w[9]+w[10]) + h[13];
    q[13] = s64_3(w[2]+w[4]+w[7]+w[10]+w[11]) + h[14];
    q[14] = s64_4(w[3]-w[5]+w[8]-w[11]-w[12]) + h[15];
    q[15] = s64_0(w[12]-w[4]-w[6]-w[9]+w[13]) + h[0];

    /* Expand 2 */
    for (int i = 16; i < 18; i++)
        q[i] = s64_5(q[i-16]) + s64_4(q[i-15]) + s64_3(q[i-14]) + s64_2(q[i-13])
             + s64_1(q[i-12]) + s64_0(q[i-11]) + s64_5(q[i-10]) + s64_4(q[i-9])
             + s64_3(q[i-8]) + s64_2(q[i-7]) + s64_1(q[i-6]) + s64_0(q[i-5])
             + s64_5(q[i-4]) + s64_4(q[i-3]) + s64_3(q[i-2]) + s64_2(q[i-1])
             + ((uint64_t)(i-15) * 0x0555555555555555ULL + m[(i-16)%16]);

    for (int i = 18; i < 32; i++)
        q[i] = q[i-16] + ROL64(q[i-15],5) + q[i-14] + ROL64(q[i-13],11)
             + q[i-12] + ROL64(q[i-11],27) + q[i-10] + ROL64(q[i-9],32)
             + q[i-8] + ROL64(q[i-7],37) + q[i-6] + ROL64(q[i-5],43)
             + q[i-4] + ROL64(q[i-3],53) + s64_4(q[i-2]) + s64_5(q[i-1])
             + ((uint64_t)(i-15) * 0x0555555555555555ULL + m[(i-16)%16]);

    xl = q[16] ^ q[17] ^ q[18] ^ q[19] ^ q[20] ^ q[21] ^ q[22] ^ q[23];
    xh = xl ^ q[24] ^ q[25] ^ q[26] ^ q[27] ^ q[28] ^ q[29] ^ q[30] ^ q[31];

    h[0] = (SHL64(xh,5) ^ SHR64(q[16],5) ^ m[0]) + (xl ^ q[24] ^ q[0]);
    h[1] = (SHR64(xh,7) ^ SHL64(q[17],8) ^ m[1]) + (xl ^ q[25] ^ q[1]);
    h[2] = (SHR64(xh,5) ^ SHL64(q[18],5) ^ m[2]) + (xl ^ q[26] ^ q[2]);
    h[3] = (SHR64(xh,1) ^ SHL64(q[19],5) ^ m[3]) + (xl ^ q[27] ^ q[3]);
    h[4] = (SHR64(xh,3) ^ q[20] ^ m[4]) + (xl ^ q[28] ^ q[4]);
    h[5] = (SHL64(xh,6) ^ SHR64(q[21],6) ^ m[5]) + (xl ^ q[29] ^ q[5]);
    h[6] = (SHR64(xh,4) ^ SHL64(q[22],6) ^ m[6]) + (xl ^ q[30] ^ q[6]);
    h[7] = (SHR64(xh,11) ^ SHL64(q[23],2) ^ m[7]) + (xl ^ q[31] ^ q[7]);
    h[8] = ROL64(h[4],9) + (xh ^ q[24] ^ m[8]) + (SHL64(xl,8) ^ q[23] ^ q[8]);
    h[9] = ROL64(h[5],10) + (xh ^ q[25] ^ m[9]) + (SHR64(xl,6) ^ q[16] ^ q[9]);
    h[10] = ROL64(h[6],11) + (xh ^ q[26] ^ m[10]) + (SHL64(xl,6) ^ q[17] ^ q[10]);
    h[11] = ROL64(h[7],12) + (xh ^ q[27] ^ m[11]) + (SHL64(xl,4) ^ q[18] ^ q[11]);
    h[12] = ROL64(h[0],13) + (xh ^ q[28] ^ m[12]) + (SHR64(xl,3) ^ q[19] ^ q[12]);
    h[13] = ROL64(h[1],14) + (xh ^ q[29] ^ m[13]) + (SHR64(xl,4) ^ q[20] ^ q[13]);
    h[14] = ROL64(h[2],15) + (xh ^ q[30] ^ m[14]) + (SHR64(xl,7) ^ q[21] ^ q[14]);
    h[15] = ROL64(h[3],16) + (xh ^ q[31] ^ m[15]) + (SHR64(xl,2) ^ q[22] ^ q[15]);
}

void gr_bmw512_hash(const void *input, size_t len, void *output) {
    uint64_t h[16], m[16];
    memcpy(h, bmw_iv, sizeof(h));
    const uint8_t *p = (const uint8_t *)input;

    while (len >= 128) {
        memcpy(m, p, 128);
        bmw512_compress(h, m);
        p += 128; len -= 128;
    }

    uint8_t last[128];
    memset(last, 0, 128);
    memcpy(last, p, len);
    last[len] = 0x80;
    if (len >= 112) {
        memcpy(m, last, 128);
        bmw512_compress(h, m);
        memset(last, 0, 128);
    }
    uint64_t bits = (uint64_t)((const uint8_t*)input + 0 - (const uint8_t*)input + len) * 8;
    /* Store original message length in bits at end */
    memcpy(last + 120, &bits, 8);
    memcpy(m, last, 128);
    bmw512_compress(h, m);

    /* Final transform */
    uint64_t h2[16];
    memcpy(h2, bmw_iv, sizeof(h2));
    bmw512_compress(h2, h);
    memcpy(output, h2 + 8, 64);
}
