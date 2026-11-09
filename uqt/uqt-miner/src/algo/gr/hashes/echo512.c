/* ECHO-512 — SHA-3 candidate by Benadjila et al. */
#include "../gr_hashes.h"
#include <string.h>

/* ECHO uses AES round function on a 4x4 array of 128-bit values (2048-bit state) */
static const uint8_t echo_sbox[256] = {
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

static void echo_aes_sub_mix(uint8_t s[16]) {
    /* SubBytes */
    for (int i = 0; i < 16; i++) s[i] = echo_sbox[s[i]];
    /* ShiftRows */
    uint8_t t[16];
    t[0]=s[0]; t[1]=s[5]; t[2]=s[10]; t[3]=s[15];
    t[4]=s[4]; t[5]=s[9]; t[6]=s[14]; t[7]=s[3];
    t[8]=s[8]; t[9]=s[13]; t[10]=s[2]; t[11]=s[7];
    t[12]=s[12]; t[13]=s[1]; t[14]=s[6]; t[15]=s[11];
    /* MixColumns */
    for (int c = 0; c < 4; c++) {
        int b = c*4;
        uint8_t a0=t[b],a1=t[b+1],a2=t[b+2],a3=t[b+3];
        uint8_t x = a0^a1^a2^a3;
        uint8_t d;
        d = a0^a1; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        s[b] = a0^d^x;
        d = a1^a2; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        s[b+1] = a1^d^x;
        d = a2^a3; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        s[b+2] = a2^d^x;
        d = a3^a0; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        s[b+3] = a3^d^x;
    }
}

void gr_echo512_hash(const void *input, size_t len, void *output) {
    /* State: 4x4 grid of 16-byte AES states = 256 bytes total */
    uint8_t W[4][4][16];
    memset(W, 0, sizeof(W));
    /* IV: hash length 512 in first word */
    W[0][0][0] = 0x00; W[0][0][1] = 0x02; /* 512 = 0x0200 LE */

    const uint8_t *p = (const uint8_t *)input;
    uint64_t count = 0;

    while (len >= 192) {
        count += 1536;
        for (int i = 0; i < 4; i++)
            for (int j = 0; j < 4; j++)
                if (!(i == 0 && j == 0))
                    memcpy(W[i][j], p + ((i*4+j-1)*16), 16);
        for (int r = 0; r < 8; r++) {
            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 4; j++)
                    echo_aes_sub_mix(W[i][j]);
            /* Big ShiftRows on 4x4 grid */
            uint8_t tmp[16];
            for (int i = 1; i < 4; i++) {
                for (int s = 0; s < i; s++) {
                    memcpy(tmp, W[i][0], 16);
                    memcpy(W[i][0], W[i][1], 16);
                    memcpy(W[i][1], W[i][2], 16);
                    memcpy(W[i][2], W[i][3], 16);
                    memcpy(W[i][3], tmp, 16);
                }
            }
            /* Big MixColumns */
            for (int j = 0; j < 4; j++) {
                for (int b = 0; b < 16; b++) {
                    uint8_t a = W[0][j][b], bb2 = W[1][j][b], c = W[2][j][b], d = W[3][j][b];
                    uint8_t x = a^bb2^c^d;
                    W[0][j][b] = a ^ x; W[1][j][b] = bb2 ^ x;
                    W[2][j][b] = c ^ x; W[3][j][b] = d ^ x;
                }
            }
        }
        p += 192; len -= 192;
    }

    /* Pad + finalize */
    count += len * 8;
    uint8_t last[192];
    memset(last, 0, 192);
    memcpy(last, p, len);
    last[len] = 0x80;
    memcpy(last + 184, &count, 8);

    for (int i = 0; i < 4; i++)
        for (int j = 0; j < 4; j++)
            if (!(i == 0 && j == 0)) {
                int idx = (i*4+j-1)*16;
                if (idx >= 0 && idx + 16 <= 192)
                    for (int b = 0; b < 16; b++) W[i][j][b] ^= last[idx+b];
            }

    for (int r = 0; r < 8; r++) {
        for (int i = 0; i < 4; i++)
            for (int j = 0; j < 4; j++)
                echo_aes_sub_mix(W[i][j]);
        uint8_t tmp[16];
        for (int i = 1; i < 4; i++) {
            for (int s = 0; s < i; s++) {
                memcpy(tmp, W[i][0], 16);
                memcpy(W[i][0], W[i][1], 16);
                memcpy(W[i][1], W[i][2], 16);
                memcpy(W[i][2], W[i][3], 16);
                memcpy(W[i][3], tmp, 16);
            }
        }
        for (int j = 0; j < 4; j++) {
            for (int b = 0; b < 16; b++) {
                uint8_t a = W[0][j][b], bb2 = W[1][j][b], c = W[2][j][b], d = W[3][j][b];
                uint8_t x = a^bb2^c^d;
                W[0][j][b] = a ^ x; W[1][j][b] = bb2 ^ x;
                W[2][j][b] = c ^ x; W[3][j][b] = d ^ x;
            }
        }
    }

    uint8_t *out = (uint8_t *)output;
    memcpy(out, W[0][0], 16);
    memcpy(out+16, W[0][1], 16);
    memcpy(out+32, W[0][2], 16);
    memcpy(out+48, W[0][3], 16);
}
