/* Grøstl-512 — SHA-3 finalist by Gauravaram et al. */
#include "../gr_hashes.h"
#include <string.h>

/* Grøstl uses AES-like S-box and MDS operations on 8x8 state matrix */
static const uint8_t groestl_sbox[256] = {
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
};

/* Grøstl multiplication in GF(2^8) */
static uint8_t gmul2(uint8_t a) {
    return (a & 0x80) ? ((a << 1) ^ 0x1b) : (a << 1);
}
static uint8_t gmul(uint8_t a, uint8_t b) {
    uint8_t r = 0;
    for (int i = 0; i < 8; i++) {
        if (b & 1) r ^= a;
        a = gmul2(a);
        b >>= 1;
    }
    return r;
}

/* Grøstl-512 operates on 8x16 byte state for the 1024-bit internal state */
static void groestl_sub_bytes(uint8_t s[8][16]) {
    for (int i = 0; i < 8; i++)
        for (int j = 0; j < 16; j++)
            s[i][j] = groestl_sbox[s[i][j]];
}

static void groestl_shift_bytes_P(uint8_t s[8][16]) {
    uint8_t t[16];
    for (int i = 1; i < 8; i++) {
        memcpy(t, s[i], 16);
        for (int j = 0; j < 16; j++) s[i][j] = t[(j+i)%16];
    }
}

static void groestl_shift_bytes_Q(uint8_t s[8][16]) {
    uint8_t t[16];
    static const int shifts[8] = {1,3,5,11,0,2,4,6};
    for (int i = 0; i < 8; i++) {
        memcpy(t, s[i], 16);
        for (int j = 0; j < 16; j++) s[i][j] = t[(j+shifts[i])%16];
    }
}

static void groestl_mix_bytes(uint8_t s[8][16]) {
    static const uint8_t mds[8][8] = {
        {2,2,3,4,5,3,5,7},{7,2,2,3,4,5,3,5},{5,7,2,2,3,4,5,3},{3,5,7,2,2,3,4,5},
        {5,3,5,7,2,2,3,4},{4,5,3,5,7,2,2,3},{3,4,5,3,5,7,2,2},{2,3,4,5,3,5,7,2}
    };
    for (int j = 0; j < 16; j++) {
        uint8_t col[8], res[8];
        for (int i = 0; i < 8; i++) col[i] = s[i][j];
        for (int i = 0; i < 8; i++) {
            res[i] = 0;
            for (int k = 0; k < 8; k++) res[i] ^= gmul(mds[i][k], col[k]);
        }
        for (int i = 0; i < 8; i++) s[i][j] = res[i];
    }
}

static void groestl_P(uint8_t s[8][16], int rounds) {
    for (int r = 0; r < rounds; r++) {
        /* AddRoundConstant for P */
        for (int j = 0; j < 16; j++) s[0][j] ^= (uint8_t)((j << 4) ^ r);
        groestl_sub_bytes(s);
        groestl_shift_bytes_P(s);
        groestl_mix_bytes(s);
    }
}

static void groestl_Q(uint8_t s[8][16], int rounds) {
    for (int r = 0; r < rounds; r++) {
        /* AddRoundConstant for Q */
        for (int i = 0; i < 8; i++)
            for (int j = 0; j < 16; j++)
                s[i][j] ^= 0xFF;
        for (int j = 0; j < 16; j++) s[7][j] ^= (uint8_t)((j << 4) ^ r) ^ 0xFF;
        groestl_sub_bytes(s);
        groestl_shift_bytes_Q(s);
        groestl_mix_bytes(s);
    }
}

void gr_groestl512_hash(const void *input, size_t len, void *output) {
    uint8_t h[8][16], m[8][16], tmp[8][16];
    int rounds = 14;
    
    memset(h, 0, sizeof(h));
    h[6][15] = 0x02; /* IV for 512-bit digest */
    
    const uint8_t *p = (const uint8_t *)input;
    uint64_t blocks = 0;
    
    while (len > 128) {
        blocks++;
        for (int j = 0; j < 16; j++)
            for (int i = 0; i < 8; i++)
                m[i][j] = p[j*8+i];
        
        /* tmp = h ^ m */
        for (int i = 0; i < 8; i++)
            for (int j = 0; j < 16; j++)
                tmp[i][j] = h[i][j] ^ m[i][j];
        
        uint8_t tp[8][16], tq[8][16];
        memcpy(tp, tmp, sizeof(tp));
        memcpy(tq, m, sizeof(tq));
        groestl_P(tp, rounds);
        groestl_Q(tq, rounds);
        
        for (int i = 0; i < 8; i++)
            for (int j = 0; j < 16; j++)
                h[i][j] ^= tp[i][j] ^ tq[i][j];
        
        p += 128; len -= 128;
    }
    
    /* Pad last block */
    blocks++;
    uint8_t last[128];
    memset(last, 0, 128);
    memcpy(last, p, len);
    last[len] = 0x80;
    /* Blocks count in big-endian at end */
    uint64_t bc = blocks;
    last[120] = (uint8_t)(bc >> 56); last[121] = (uint8_t)(bc >> 48);
    last[122] = (uint8_t)(bc >> 40); last[123] = (uint8_t)(bc >> 32);
    last[124] = (uint8_t)(bc >> 24); last[125] = (uint8_t)(bc >> 16);
    last[126] = (uint8_t)(bc >> 8);  last[127] = (uint8_t)(bc);
    
    for (int j = 0; j < 16; j++)
        for (int i = 0; i < 8; i++)
            m[i][j] = last[j*8+i];
    
    for (int i = 0; i < 8; i++)
        for (int j = 0; j < 16; j++)
            tmp[i][j] = h[i][j] ^ m[i][j];
    
    uint8_t tp[8][16], tq[8][16];
    memcpy(tp, tmp, sizeof(tp));
    memcpy(tq, m, sizeof(tq));
    groestl_P(tp, rounds);
    groestl_Q(tq, rounds);
    
    for (int i = 0; i < 8; i++)
        for (int j = 0; j < 16; j++)
            h[i][j] ^= tp[i][j] ^ tq[i][j];
    
    /* Output transformation */
    memcpy(tmp, h, sizeof(tmp));
    groestl_P(tmp, rounds);
    for (int i = 0; i < 8; i++)
        for (int j = 0; j < 16; j++)
            h[i][j] ^= tmp[i][j];
    
    /* Extract last 64 bytes */
    uint8_t *out = (uint8_t *)output;
    for (int j = 8; j < 16; j++)
        for (int i = 0; i < 8; i++)
            out[(j-8)*8+i] = h[i][j];
}
