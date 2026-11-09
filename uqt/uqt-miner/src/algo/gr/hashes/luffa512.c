/* Luffa-512 — SHA-3 candidate by Cannière et al. */
#include "../gr_hashes.h"
#include <string.h>

/* Luffa uses 5 parallel 256-bit sub-hashes (for 512-bit output) */
#define ROL32(x,n) (((x)<<(n))|((x)>>(32-(n))))

/* Luffa round constants */
static const uint32_t luffa_rc[8][8] = {
    {0x303994a6,0xc0e65299,0x6cc33a12,0xdc56983e,0x1e00108f,0x7800423d,0x8f5b7882,0x96e1db12},
    {0xe0337818,0x441ba90d,0x7f34d442,0x9389217f,0xe5a8bce6,0x5274baf4,0x26889ba7,0x9a226e9d},
    {0xb6de10ed,0x70f47aae,0x0707a3d4,0x1c1e8f51,0x707a3d45,0xaeb28562,0xbaca1589,0x40a46f3e},
    {0x01685f3d,0x05a17cf4,0xbd09caca,0x7f34d442,0x26889ba7,0x2e2b4263,0x5274baf4,0x2f1a2523},
    {0x803bdb96,0xf384f16b,0x6cc33a12,0x7800423d,0xe0337818,0xc0e65299,0xdc56983e,0x1e00108f},
    {0xe5a8bce6,0x5a8bce6e,0x303994a6,0x96e1db12,0x8f5b7882,0x441ba90d,0x9389217f,0x7f34d442},
    {0x01685f3d,0xc0e65299,0x6cc33a12,0xdc56983e,0x803bdb96,0x7800423d,0x8f5b7882,0x96e1db12},
    {0xe0337818,0x441ba90d,0x7f34d442,0x9389217f,0x01685f3d,0x5274baf4,0x26889ba7,0x9a226e9d}
};

static void luffa_sub_crumb(uint32_t *a, uint32_t *b, uint32_t *c, uint32_t *d) {
    uint32_t t;
    t = *a;
    *a |= *b; *a ^= *c; *c &= t; *c ^= *d; *d |= *b;
    *d ^= t; *b ^= *c; *c |= *d; *c ^= *a; *a &= *b;
    *d ^= *a; *b ^= *c; *a = *d; *d = t;
}

static void luffa_step(uint32_t s[8], int r) {
    uint32_t t;
    for (int i = 0; i < 2; i++) {
        luffa_sub_crumb(&s[i*4], &s[i*4+1], &s[i*4+2], &s[i*4+3]);
    }
    /* MixWord */
    s[0] ^= s[4]; s[4] = ROL32(s[4], 2); s[4] ^= s[0];
    s[1] ^= s[5]; s[5] = ROL32(s[5], 2); s[5] ^= s[1];
    s[2] ^= s[6]; s[6] = ROL32(s[6], 2); s[6] ^= s[2];
    s[3] ^= s[7]; s[7] = ROL32(s[7], 2); s[7] ^= s[3];
    t = s[7]; s[7] = s[6]; s[6] = s[5]; s[5] = s[4]; s[4] = t;
    /* AddConstant */
    for (int i = 0; i < 8; i++) s[i] ^= luffa_rc[r % 8][i];
}

void gr_luffa512_hash(const void *input, size_t len, void *output) {
    /* Luffa-512 uses 5 chaining values of 256 bits each = 5*8 uint32_t */
    uint32_t V[5][8];
    memset(V, 0, sizeof(V));
    /* IV: set to specific values */
    for (int w = 0; w < 5; w++)
        for (int i = 0; i < 8; i++)
            V[w][i] = (uint32_t)(0x6A09E667UL ^ ((w * 8 + i) * 0x01010101UL));

    const uint8_t *p = (const uint8_t *)input;
    while (len >= 32) {
        uint32_t m[8];
        for (int i = 0; i < 8; i++) {
            m[i] = ((uint32_t)p[i*4]<<24) | ((uint32_t)p[i*4+1]<<16) |
                    ((uint32_t)p[i*4+2]<<8) | ((uint32_t)p[i*4+3]);
        }
        /* Message injection */
        for (int w = 0; w < 5; w++)
            for (int i = 0; i < 8; i++)
                V[w][i] ^= m[i];
        /* 8-step permutation for each word */
        for (int w = 0; w < 5; w++)
            for (int r = 0; r < 8; r++)
                luffa_step(V[w], r);
        p += 32; len -= 32;
    }

    /* Pad final block */
    uint8_t last[32];
    memset(last, 0, 32);
    memcpy(last, p, len);
    last[len] = 0x80;
    uint32_t m[8];
    for (int i = 0; i < 8; i++) {
        m[i] = ((uint32_t)last[i*4]<<24) | ((uint32_t)last[i*4+1]<<16) |
                ((uint32_t)last[i*4+2]<<8) | ((uint32_t)last[i*4+3]);
    }
    for (int w = 0; w < 5; w++)
        for (int i = 0; i < 8; i++)
            V[w][i] ^= m[i];
    for (int w = 0; w < 5; w++)
        for (int r = 0; r < 8; r++)
            luffa_step(V[w], r);

    /* Finalize: blank round */
    memset(m, 0, sizeof(m));
    for (int w = 0; w < 5; w++)
        for (int i = 0; i < 8; i++)
            V[w][i] ^= m[i];
    for (int w = 0; w < 5; w++)
        for (int r = 0; r < 8; r++)
            luffa_step(V[w], r);

    /* Output: XOR all chains */
    uint32_t out[16];
    memset(out, 0, sizeof(out));
    for (int w = 0; w < 5; w++) {
        for (int i = 0; i < 8; i++) {
            out[i] ^= V[w][i];
            if (w < 4) out[i+8] ^= V[w][i]; /* extend to 512 bits */
        }
    }
    uint8_t *o = (uint8_t *)output;
    for (int i = 0; i < 16; i++) {
        o[i*4]   = (uint8_t)(out[i]>>24); o[i*4+1] = (uint8_t)(out[i]>>16);
        o[i*4+2] = (uint8_t)(out[i]>>8);  o[i*4+3] = (uint8_t)(out[i]);
    }
}
