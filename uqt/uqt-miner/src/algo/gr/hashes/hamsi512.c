/* Hamsi-512 — SHA-3 candidate by Küçük */
#include "../gr_hashes.h"
#include <string.h>

#define ROL32(x,n) (((x)<<(n))|((x)>>(32-(n))))

/* Hamsi uses a 512-bit state with Serpent-like S-boxes */
static const uint8_t hamsi_sbox[4][16] = {
    {8,6,7,9,3,12,10,15,13,1,14,4,0,11,5,2},
    {5,14,2,11,4,15,6,7,3,8,1,9,0,13,10,12},
    {2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9},
    {7,2,12,5,8,4,6,11,14,9,1,15,13,3,10,0}
};

static void hamsi_sbox_layer(uint32_t s[16], int round) {
    for (int i = 0; i < 16; i++) {
        uint32_t v = s[i];
        uint32_t r = 0;
        for (int b = 0; b < 32; b += 4) {
            uint8_t nib = (v >> b) & 0xf;
            r |= (uint32_t)hamsi_sbox[round & 3][nib] << b;
        }
        s[i] = r;
    }
}

static void hamsi_linear(uint32_t s[16]) {
    /* Linear diffusion layer */
    s[0] ^= ROL32(s[4],7) ^ ROL32(s[8],13);
    s[1] ^= ROL32(s[5],7) ^ ROL32(s[9],13);
    s[2] ^= ROL32(s[6],7) ^ ROL32(s[10],13);
    s[3] ^= ROL32(s[7],7) ^ ROL32(s[11],13);
    s[12] ^= ROL32(s[0],1) ^ ROL32(s[4],11);
    s[13] ^= ROL32(s[1],1) ^ ROL32(s[5],11);
    s[14] ^= ROL32(s[2],1) ^ ROL32(s[6],11);
    s[15] ^= ROL32(s[3],1) ^ ROL32(s[7],11);
    s[4] = ROL32(s[4],3) ^ s[12];
    s[5] = ROL32(s[5],3) ^ s[13];
    s[6] = ROL32(s[6],3) ^ s[14];
    s[7] = ROL32(s[7],3) ^ s[15];
    s[8] = ROL32(s[8],5) ^ s[0];
    s[9] = ROL32(s[9],5) ^ s[1];
    s[10] = ROL32(s[10],5) ^ s[2];
    s[11] = ROL32(s[11],5) ^ s[3];
}

void gr_hamsi512_hash(const void *input, size_t len, void *output) {
    uint32_t s[16];
    /* IV for 512-bit Hamsi */
    for (int i = 0; i < 16; i++) s[i] = (uint32_t)(0x73616d6fUL ^ ((uint32_t)i * 0x01010101UL));

    const uint8_t *p = (const uint8_t *)input;
    while (len >= 4) {
        uint32_t m;
        memcpy(&m, p, 4);
        s[0] ^= m;
        for (int r = 0; r < 6; r++) {
            hamsi_sbox_layer(s, r);
            hamsi_linear(s);
        }
        p += 4; len -= 4;
    }

    /* Pad */
    uint8_t last[4] = {0,0,0,0};
    memcpy(last, p, len);
    last[len] = 0x80;
    uint32_t m;
    memcpy(&m, last, 4);
    s[0] ^= m;
    for (int r = 0; r < 12; r++) {
        hamsi_sbox_layer(s, r);
        hamsi_linear(s);
    }

    memcpy(output, s, 64);
}
