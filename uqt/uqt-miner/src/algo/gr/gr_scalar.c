/* GhostRider (gr) — Full multi-stage hash pipeline
 * 15 core hash functions + 3 CryptoNight memory-hard stages
 * Permutation order derived from input hash bytes */
#include "uqt/algo.h"
#include "gr_hashes.h"
#include <string.h>
#include <stdlib.h>

/* GhostRider hash pipeline:
 *   input → Hash[perm[0..4]] → CN/dark → Hash[perm[5..9]] → CN/darklite
 *         → Hash[perm[10..14]] → CN/fast → 32-byte output
 *
 * The permutation is derived from the first 15 bytes of the input,
 * mapping each byte mod 15 to select a hash function without repeats. */

/* Generate permutation from input data */
static void gr_generate_permutation(const uint8_t *input, size_t len, int perm[15]) {
    uint8_t available[15];
    for (int i = 0; i < 15; i++) available[i] = (uint8_t)i;

    int remaining = 15;
    for (int i = 0; i < 15; i++) {
        uint8_t sel = (i < (int)len) ? input[i] : 0;
        int idx = sel % remaining;
        perm[i] = available[idx];
        /* Remove selected from available */
        available[idx] = available[remaining - 1];
        remaining--;
    }
}

/* Maximum scratchpad size needed (CN/fast = 2MB) */
#define GR_SCRATCHPAD_SIZE (2 * 1024 * 1024)

#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 201112L
static _Thread_local uint8_t *tls_gr_scratchpad = NULL;
#endif

static int gr_scalar_hash(void *state, const uint8_t *input, size_t input_len, uint8_t *output) {
    if (!input || !output) return UQT_ERR_INVAL;

    /* Generate permutation from input */
    int perm[15];
    gr_generate_permutation(input, input_len, perm);

    /* Zero-allocation scratchpad: use worker thread's scratchpad if provided */
    void *scratchpad = state;
    bool allocated = false;

    if (!scratchpad) {
#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 201112L
        if (!tls_gr_scratchpad) {
            tls_gr_scratchpad = (uint8_t *)malloc(GR_SCRATCHPAD_SIZE);
        }
        scratchpad = tls_gr_scratchpad;
#endif
        if (!scratchpad) {
            scratchpad = malloc(GR_SCRATCHPAD_SIZE);
            if (!scratchpad) return UQT_ERR_NOMEM;
            allocated = true;
        }
    }

    /* Working buffers: double-buffered 64-byte intermediate */
    uint8_t buf[2][64];
    int cur = 0;

    /* Initial: hash the full input through first permuted hash */
    gr_get_hash_func(perm[0])(input, input_len, buf[cur]);

    /* Phase 1: Hash[perm[1..4]] */
    for (int i = 1; i < 5; i++) {
        int next = 1 - cur;
        gr_get_hash_func(perm[i])(buf[cur], 64, buf[next]);
        cur = next;
    }

    /* Derive CryptoNight variant seed from input */
    uint32_t seed = (input_len >= 8) ? (*(const uint32_t *)(input + 4)) : (uint32_t)input[0];

    /* CryptoNight stage 1: cn/dark (512KB) or cn/dark-lite (256KB) */
    {
        uint8_t cn_out[32];
        if (seed & 1) {
            gr_cryptonight_dark_lite(buf[cur], 64, cn_out, scratchpad);
        } else {
            gr_cryptonight_dark(buf[cur], 64, cn_out, scratchpad);
        }
        memset(buf[1-cur], 0, 64);
        memcpy(buf[1-cur], cn_out, 32);
        cur = 1 - cur;
    }

    /* Phase 2: Hash[perm[5..9]] */
    for (int i = 5; i < 10; i++) {
        int next = 1 - cur;
        gr_get_hash_func(perm[i])(buf[cur], 64, buf[next]);
        cur = next;
    }

    /* CryptoNight stage 2: cn/fast (2MB) or cn/lite (1MB) */
    {
        uint8_t cn_out[32];
        if ((seed >> 1) & 1) {
            gr_cryptonight_lite(buf[cur], 64, cn_out, scratchpad);
        } else {
            gr_cryptonight_fast(buf[cur], 64, cn_out, scratchpad);
        }
        memset(buf[1-cur], 0, 64);
        memcpy(buf[1-cur], cn_out, 32);
        cur = 1 - cur;
    }

    /* Phase 3: Hash[perm[10..14]] */
    for (int i = 10; i < 15; i++) {
        int next = 1 - cur;
        gr_get_hash_func(perm[i])(buf[cur], 64, buf[next]);
        cur = next;
    }

    /* CryptoNight stage 3: cn/turtle-lite (128KB) or cn/turtle (256KB) */
    {
        uint8_t cn_out[32];
        if ((seed >> 2) & 1) {
            gr_cryptonight_turtle_lite(buf[cur], 64, cn_out, scratchpad);
        } else {
            gr_cryptonight_turtle(buf[cur], 64, cn_out, scratchpad);
        }
        memcpy(output, cn_out, 32);
    }

    if (allocated) {
        free(scratchpad);
    }
    return UQT_SUCCESS;
}

static int gr_scalar_hash_batch(void *state, const uint8_t *inputs, size_t input_stride, uint8_t *outputs, size_t count) {
    (void)state;
    if (!inputs || !outputs) return UQT_ERR_INVAL;

    for (size_t i = 0; i < count; i++) {
        int rc = gr_scalar_hash(state, inputs + (i * input_stride), input_stride, outputs + (i * 32));
        if (rc != UQT_SUCCESS) return rc;
    }
    return UQT_SUCCESS;
}

static const uqt_algo_backend_t gr_backend_scalar = {
    .name = "scalar",
    .required_features = 0,
    .init = NULL,
    .destroy = NULL,
    .hash = gr_scalar_hash,
    .hash_batch = gr_scalar_hash_batch,
    .batch_width = 1,
    .scratchpad_size = GR_SCRATCHPAD_SIZE
};

static const uqt_algo_backend_t *gr_backends[] = {
    &gr_backend_scalar
};

const uqt_algo_t uqt_algo_gr = {
    .name = "gr",
    .digest_size = 32,
    .backends = gr_backends,
    .num_backends = sizeof(gr_backends) / sizeof(gr_backends[0])
};
