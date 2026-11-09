#ifndef GR_HASHES_H
#define GR_HASHES_H

#include <stdint.h>
#include <stddef.h>

/* All GhostRider sub-hash functions take arbitrary input and produce 64-byte (512-bit) output */

void gr_blake512_hash(const void *input, size_t len, void *output);
void gr_bmw512_hash(const void *input, size_t len, void *output);
void gr_groestl512_hash(const void *input, size_t len, void *output);
void gr_jh512_hash(const void *input, size_t len, void *output);
void gr_keccak512_hash(const void *input, size_t len, void *output);
void gr_skein512_hash(const void *input, size_t len, void *output);
void gr_luffa512_hash(const void *input, size_t len, void *output);
void gr_cubehash512_hash(const void *input, size_t len, void *output);
void gr_shavite512_hash(const void *input, size_t len, void *output);
void gr_simd512_hash(const void *input, size_t len, void *output);
void gr_echo512_hash(const void *input, size_t len, void *output);
void gr_hamsi512_hash(const void *input, size_t len, void *output);
void gr_fugue512_hash(const void *input, size_t len, void *output);
void gr_shabal512_hash(const void *input, size_t len, void *output);
void gr_whirlpool_hash(const void *input, size_t len, void *output);

/* CryptoNight variants (all 6 GhostRider algorithm stages) */
void gr_cryptonight_dark(const void *input, size_t len, void *output, void *scratchpad);
void gr_cryptonight_dark_lite(const void *input, size_t len, void *output, void *scratchpad);
void gr_cryptonight_fast(const void *input, size_t len, void *output, void *scratchpad);
void gr_cryptonight_lite(const void *input, size_t len, void *output, void *scratchpad);
void gr_cryptonight_turtle(const void *input, size_t len, void *output, void *scratchpad);
void gr_cryptonight_turtle_lite(const void *input, size_t len, void *output, void *scratchpad);

/* Hash function table for GhostRider permutation */
typedef void (*gr_hash_func_t)(const void *input, size_t len, void *output);

static inline gr_hash_func_t gr_get_hash_func(int id) {
    static const gr_hash_func_t funcs[15] = {
        gr_blake512_hash,    gr_bmw512_hash,      gr_groestl512_hash,
        gr_jh512_hash,       gr_keccak512_hash,   gr_skein512_hash,
        gr_luffa512_hash,    gr_cubehash512_hash, gr_shavite512_hash,
        gr_simd512_hash,     gr_echo512_hash,     gr_hamsi512_hash,
        gr_fugue512_hash,    gr_shabal512_hash,   gr_whirlpool_hash
    };
    return (id >= 0 && id < 15) ? funcs[id] : funcs[0];
}

#endif /* GR_HASHES_H */
