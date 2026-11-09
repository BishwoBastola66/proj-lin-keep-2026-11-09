/* CryptoNight core — memory-hard hash function used in GhostRider
 * Implements the CryptoNight algorithm with configurable scratchpad and iterations.
 * Hardware AES-NI acceleration with software AES fallback. */
#include "../gr_hashes.h"
#include "cn_variants.h"
#include <string.h>
#include <stdlib.h>

#if (defined(__x86_64__) || defined(_M_X64)) && (defined(__GNUC__) || defined(__clang__))
#include <immintrin.h>
#include <smmintrin.h>
#include <wmmintrin.h>
#include <emmintrin.h>
#define HAVE_AES_NI 1
#endif

/* ---- Software AES Fallback ---- */
static const uint8_t cn_sbox[256] = {
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

#if !defined(HAVE_AES_NI) || !defined(__AES__)
static void cn_soft_aes_round(uint8_t state[16], const uint8_t rk[16]) {
    uint8_t t[16];
    for (int i = 0; i < 16; i++) t[i] = cn_sbox[state[i]];
    /* ShiftRows */
    uint8_t u[16];
    u[0]=t[0];u[1]=t[5];u[2]=t[10];u[3]=t[15];
    u[4]=t[4];u[5]=t[9];u[6]=t[14];u[7]=t[3];
    u[8]=t[8];u[9]=t[13];u[10]=t[2];u[11]=t[7];
    u[12]=t[12];u[13]=t[1];u[14]=t[6];u[15]=t[11];
    /* MixColumns */
    for (int c = 0; c < 4; c++) {
        int b = c*4;
        uint8_t a0=u[b],a1=u[b+1],a2=u[b+2],a3=u[b+3];
        uint8_t x = a0^a1^a2^a3;
        uint8_t d;
        d = a0^a1; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        state[b] = a0^d^x;
        d = a1^a2; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        state[b+1] = a1^d^x;
        d = a2^a3; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        state[b+2] = a2^d^x;
        d = a3^a0; d = ((d&0x80)?((d<<1)^0x1b):(d<<1));
        state[b+3] = a3^d^x;
    }
    for (int i = 0; i < 16; i++) state[i] ^= rk[i];
}
#endif

#if defined(HAVE_AES_NI) && defined(__AES__)
static inline void cn_aes_round(uint8_t state[16], const uint8_t rk[16]) {
    __m128i s = _mm_loadu_si128((const __m128i *)state);
    __m128i k = _mm_loadu_si128((const __m128i *)rk);
    s = _mm_aesenc_si128(s, k);
    _mm_storeu_si128((__m128i *)state, s);
}
#else
static inline void cn_aes_round(uint8_t state[16], const uint8_t rk[16]) {
    cn_soft_aes_round(state, rk);
}
#endif

/* AES key expansion (10 round keys from 128-bit key) */
static void cn_aes_expand_key(const uint8_t key[16], uint8_t rk[11][16]) {
    static const uint8_t rcon[10] = {1,2,4,8,16,32,64,128,27,54};
    memcpy(rk[0], key, 16);
    for (int i = 1; i <= 10; i++) {
        uint8_t t[4];
        t[0] = cn_sbox[rk[i-1][13]] ^ rcon[i-1];
        t[1] = cn_sbox[rk[i-1][14]];
        t[2] = cn_sbox[rk[i-1][15]];
        t[3] = cn_sbox[rk[i-1][12]];
        for (int j = 0; j < 4; j++) rk[i][j] = rk[i-1][j] ^ t[j];
        for (int j = 4; j < 16; j++) rk[i][j] = rk[i-1][j] ^ rk[i][j-4];
    }
}

/* ---- Keccak-1600 for CryptoNight state init ---- */
#define ROL64(x,n) (((x)<<(n))|((x)>>(64-(n))))

static const uint64_t cn_krc[24] = {
    0x0000000000000001ULL,0x0000000000008082ULL,0x800000000000808aULL,
    0x8000000080008000ULL,0x000000000000808bULL,0x0000000080000001ULL,
    0x8000000080008081ULL,0x8000000000008009ULL,0x000000000000008aULL,
    0x0000000000000088ULL,0x0000000080008009ULL,0x000000008000000aULL,
    0x000000008000808bULL,0x800000000000008bULL,0x8000000000008089ULL,
    0x8000000000008003ULL,0x8000000000008002ULL,0x8000000000000080ULL,
    0x000000000000800aULL,0x800000008000000aULL,0x8000000080008081ULL,
    0x8000000000008080ULL,0x0000000080000001ULL,0x8000000080008008ULL
};

static void cn_keccak_f1600(uint64_t st[25]) {
    for (int r = 0; r < 24; r++) {
        uint64_t bc[5];
        for (int i = 0; i < 5; i++) bc[i] = st[i]^st[i+5]^st[i+10]^st[i+15]^st[i+20];
        for (int i = 0; i < 5; i++) {
            uint64_t t = bc[(i+4)%5] ^ ROL64(bc[(i+1)%5],1);
            for (int j = 0; j < 25; j+=5) st[j+i] ^= t;
        }
        uint64_t t = st[1];
        static const int piln[24]={10,7,11,17,18,3,5,16,8,21,24,4,15,23,19,13,12,2,20,14,22,9,6,1};
        static const int rotc[24]={1,3,6,10,15,21,28,36,45,55,2,14,27,41,56,8,25,43,62,18,39,61,20,44};
        for (int i = 0; i < 24; i++) { uint64_t tmp=st[piln[i]]; st[piln[i]]=ROL64(t,rotc[i]); t=tmp; }
        for (int j = 0; j < 25; j+=5) {
            uint64_t tmp[5]; for(int i=0;i<5;i++) tmp[i]=st[j+i];
            for(int i=0;i<5;i++) st[j+i]=tmp[i]^((~tmp[(i+1)%5])&tmp[(i+2)%5]);
        }
        st[0] ^= cn_krc[r];
    }
}

static void cn_keccak(const uint8_t *in, size_t len, uint8_t *md, size_t mdlen) {
    uint64_t st[25];
    memset(st, 0, sizeof(st));
    size_t rsiz = 136;
    if (mdlen <= 100) rsiz = 200 - (mdlen * 2);
    const uint8_t *p = in;
    while (len >= rsiz) {
        for (size_t i = 0; i < rsiz/8; i++) { uint64_t v; memcpy(&v,p+i*8,8); st[i]^=v; }
        cn_keccak_f1600(st);
        p += rsiz; len -= rsiz;
    }
    uint8_t tmp[200];
    memset(tmp, 0, 200);
    memcpy(tmp,p,len);
    tmp[len] = 0x01;
    tmp[rsiz-1] |= 0x80;
    for (size_t i = 0; i < rsiz/8; i++) { uint64_t v; memcpy(&v,tmp+i*8,8); st[i]^=v; }
    cn_keccak_f1600(st);
    memcpy(md, st, (mdlen <= 200) ? mdlen : 200);
}

/* ---- CryptoNight core ---- */
/* ---- CryptoNight core (Hardware AES-NI Optimized) ---- */
static void cryptonight_hash(const void *input, size_t len, void *output, void *scratchpad, const cn_variant_t *var) {
    uint8_t state[200];
    uint8_t *sp = (uint8_t *)scratchpad;

    /* Step 1: Keccak-1600 to initialize 200-byte state */
    cn_keccak((const uint8_t *)input, len, state, 200);

    /* Step 2: Initialize scratchpad with AES-encrypted state */
    uint8_t rk[11][16];
    cn_aes_expand_key(state, rk);

#if defined(HAVE_AES_NI) && defined(__AES__)
    __m128i rk_m[10];
    for (int r = 0; r < 10; r++) rk_m[r] = _mm_loadu_si128((const __m128i *)rk[r]);

    __m128i t0 = _mm_loadu_si128((const __m128i *)(state + 64));
    __m128i t1 = _mm_loadu_si128((const __m128i *)(state + 80));
    __m128i t2 = _mm_loadu_si128((const __m128i *)(state + 96));
    __m128i t3 = _mm_loadu_si128((const __m128i *)(state + 112));
    __m128i t4 = _mm_loadu_si128((const __m128i *)(state + 128));
    __m128i t5 = _mm_loadu_si128((const __m128i *)(state + 144));
    __m128i t6 = _mm_loadu_si128((const __m128i *)(state + 160));
    __m128i t7 = _mm_loadu_si128((const __m128i *)(state + 176));

    for (size_t i = 0; i < var->memory; i += 128) {
        for (int r = 0; r < 10; r++) {
            t0 = _mm_aesenc_si128(t0, rk_m[r]);
            t1 = _mm_aesenc_si128(t1, rk_m[r]);
            t2 = _mm_aesenc_si128(t2, rk_m[r]);
            t3 = _mm_aesenc_si128(t3, rk_m[r]);
            t4 = _mm_aesenc_si128(t4, rk_m[r]);
            t5 = _mm_aesenc_si128(t5, rk_m[r]);
            t6 = _mm_aesenc_si128(t6, rk_m[r]);
            t7 = _mm_aesenc_si128(t7, rk_m[r]);
        }
        _mm_storeu_si128((__m128i *)(sp + i), t0);
        _mm_storeu_si128((__m128i *)(sp + i + 16), t1);
        _mm_storeu_si128((__m128i *)(sp + i + 32), t2);
        _mm_storeu_si128((__m128i *)(sp + i + 48), t3);
        _mm_storeu_si128((__m128i *)(sp + i + 64), t4);
        _mm_storeu_si128((__m128i *)(sp + i + 80), t5);
        _mm_storeu_si128((__m128i *)(sp + i + 96), t6);
        _mm_storeu_si128((__m128i *)(sp + i + 112), t7);
    }

    /* Step 3: Main memory-hard loop (Zero-copy SIMD registers) */
    __m128i va = _mm_xor_si128(_mm_loadu_si128((const __m128i *)state), _mm_loadu_si128((const __m128i *)(state + 16)));
    __m128i vb = _mm_xor_si128(_mm_loadu_si128((const __m128i *)(state + 32)), _mm_loadu_si128((const __m128i *)(state + 48)));

    uint32_t iters = var->iterations / 2;
    size_t mask = (var->memory / 16) - 1;

    for (uint32_t i = 0; i < iters; i++) {
        uint32_t addr = (_mm_cvtsi128_si32(va) & (uint32_t)mask) * 16;
        __builtin_prefetch(sp + addr, 1, 3);

        __m128i vc = _mm_loadu_si128((const __m128i *)(sp + addr));
        vc = _mm_aesenc_si128(vc, va);
        _mm_storeu_si128((__m128i *)(sp + addr), _mm_xor_si128(vb, vc));

        uint32_t addr2 = (_mm_cvtsi128_si32(vc) & (uint32_t)mask) * 16;
        __builtin_prefetch(sp + addr2, 1, 3);

        __m128i vd = _mm_loadu_si128((const __m128i *)(sp + addr2));

        uint64_t ca = (uint64_t)_mm_cvtsi128_si64(vc);
        uint64_t cb = (uint64_t)_mm_extract_epi64(vc, 1);
        uint64_t da = (uint64_t)_mm_cvtsi128_si64(vd);
        uint64_t db = (uint64_t)_mm_extract_epi64(vd, 1);

        uint64_t a0 = (uint64_t)_mm_cvtsi128_si64(va) + da * ca;
        uint64_t a1 = (uint64_t)_mm_extract_epi64(va, 1) + db + cb;

        _mm_storeu_si128((__m128i *)(sp + addr2), _mm_set_epi64x((int64_t)a1, (int64_t)a0));
        va = vc;
        vb = vd;

        if (var->variant > 0) {
            sp[addr2] ^= (uint8_t)(var->variant);
        }
    }

    /* Step 4: Finalize - AES decrypt scratchpad back into state */
    cn_aes_expand_key(state + 32, rk);
    for (int r = 0; r < 10; r++) rk_m[r] = _mm_loadu_si128((const __m128i *)rk[r]);

    __m128i txt[8];
    for (int j = 0; j < 8; j++) txt[j] = _mm_loadu_si128((const __m128i *)(state + 64 + j*16));

    for (size_t i = 0; i < var->memory; i += 128) {
        for (int j = 0; j < 8; j++) {
            __m128i spi = _mm_loadu_si128((const __m128i *)(sp + i + j*16));
            txt[j] = _mm_xor_si128(txt[j], spi);
            for (int r = 0; r < 10; r++) {
                txt[j] = _mm_aesenc_si128(txt[j], rk_m[r]);
            }
        }
    }
    for (int j = 0; j < 8; j++) _mm_storeu_si128((__m128i *)(state + 64 + j*16), txt[j]);

#else
    /* Software AES Fallback */
    uint8_t text[128];
    memcpy(text, state + 64, 128);
    for (size_t i = 0; i < var->memory; i += 128) {
        for (int j = 0; j < 8; j++) {
            for (int r = 0; r < 10; r++) cn_aes_round(text + j*16, rk[r]);
        }
        memcpy(sp + i, text, 128);
    }

    uint8_t a[16], b[16];
    memcpy(a, state, 16);
    memcpy(b, state + 32, 16);
    for (int i = 0; i < 16; i++) { a[i] ^= state[16+i]; b[i] ^= state[48+i]; }

    uint32_t iters = var->iterations / 2;
    size_t mask = (var->memory / 16) - 1;

    for (uint32_t i = 0; i < iters; i++) {
        uint32_t addr = (*(const uint32_t *)a & (uint32_t)mask) * 16;
        uint8_t c[16];
        memcpy(c, sp + addr, 16);
        cn_aes_round(c, a);

        uint64_t *sp64 = (uint64_t *)(sp + addr);
        sp64[0] = ((const uint64_t *)b)[0] ^ ((const uint64_t *)c)[0];
        sp64[1] = ((const uint64_t *)b)[1] ^ ((const uint64_t *)c)[1];

        uint32_t addr2 = (*(const uint32_t *)c & (uint32_t)mask) * 16;
        uint8_t d[16];
        memcpy(d, sp + addr2, 16);

        uint64_t ca = ((const uint64_t *)c)[0];
        uint64_t cb = ((const uint64_t *)c)[1];
        uint64_t da = *(const uint64_t *)d;
        uint64_t db = *(const uint64_t *)(d + 8);

        uint64_t *a64 = (uint64_t *)a;
        a64[0] += da * ca;
        a64[1] += db + cb;

        uint64_t *sp64_2 = (uint64_t *)(sp + addr2);
        sp64_2[0] = a64[0];
        sp64_2[1] = a64[1];
        memcpy(a, c, 16);
        memcpy(b, d, 16);

        if (var->variant > 0) sp[addr2] ^= (uint8_t)(var->variant);
    }

    cn_aes_expand_key(state + 32, rk);
    memcpy(text, state + 64, 128);
    for (size_t i = 0; i < var->memory; i += 128) {
        for (int j = 0; j < 8; j++) {
            for (int k = 0; k < 16; k++) text[j*16+k] ^= sp[i+j*16+k];
            for (int r = 0; r < 10; r++) cn_aes_round(text + j*16, rk[r]);
        }
    }
    memcpy(state + 64, text, 128);
#endif

    /* Step 5: Final Keccak */
    uint64_t *st64 = (uint64_t *)state;
    cn_keccak_f1600(st64);

    /* Select final hash based on state[0] bits */
    uint8_t final_hash[64];
    int sel = state[0] & 3;
    switch (sel) {
        case 0: gr_blake512_hash(state, 200, final_hash); break;
        case 1: gr_groestl512_hash(state, 200, final_hash); break;
        case 2: gr_jh512_hash(state, 200, final_hash); break;
        default: gr_skein512_hash(state, 200, final_hash); break;
    }

    memcpy(output, final_hash, 32);
}

/* Public API for GhostRider CryptoNight variants */
void gr_cryptonight_dark(const void *input, size_t len, void *output, void *scratchpad) {
    cryptonight_hash(input, len, output, scratchpad, &CN_DARK);
}

void gr_cryptonight_dark_lite(const void *input, size_t len, void *output, void *scratchpad) {
    cryptonight_hash(input, len, output, scratchpad, &CN_DARK_LITE);
}

void gr_cryptonight_fast(const void *input, size_t len, void *output, void *scratchpad) {
    cryptonight_hash(input, len, output, scratchpad, &CN_FAST);
}

void gr_cryptonight_lite(const void *input, size_t len, void *output, void *scratchpad) {
    cryptonight_hash(input, len, output, scratchpad, &CN_LITE);
}

void gr_cryptonight_turtle(const void *input, size_t len, void *output, void *scratchpad) {
    cryptonight_hash(input, len, output, scratchpad, &CN_TURTLE);
}

void gr_cryptonight_turtle_lite(const void *input, size_t len, void *output, void *scratchpad) {
    cryptonight_hash(input, len, output, scratchpad, &CN_TURTLE_LITE);
}
