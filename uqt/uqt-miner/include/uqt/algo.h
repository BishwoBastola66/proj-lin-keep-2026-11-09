#ifndef UQT_ALGO_H
#define UQT_ALGO_H

#include "uqt/types.h"
#include "uqt/cpu.h"

/* Digest buffer size assumption */
#define UQT_MAX_DIGEST_SIZE 64

typedef struct uqt_algo_backend {
    const char *name;                /* Backend name (e.g. "scalar", "avx2") */
    uint64_t required_features;      /* Bitmask of required CPU features */

    /* Initialize algorithm state if needed (can be NULL) */
    int (*init)(void **state);
    
    /* Cleanup state if needed (can be NULL) */
    void (*destroy)(void *state);

    /* Single hash operation */
    int (*hash)(
        void *state,
        const uint8_t *input,
        size_t input_len,
        uint8_t *output
    );

    /* Batch hash operation */
    int (*hash_batch)(
        void *state,
        const uint8_t *inputs,
        size_t input_stride,
        uint8_t *outputs,
        size_t count
    );

    size_t batch_width;              /* Ideal/native batch width (e.g. 1 for scalar, 8 for AVX2) */
    size_t scratchpad_size;          /* 0 if no scratchpad needed */
} uqt_algo_backend_t;

typedef struct uqt_algo {
    const char *name;
    size_t digest_size;
    const uqt_algo_backend_t **backends;
    size_t num_backends;
} uqt_algo_t;

/* Registry API */
int uqt_algo_register(const uqt_algo_t *algo);
const uqt_algo_t *uqt_algo_find(const char *name);
size_t uqt_algo_count(void);
const uqt_algo_t *uqt_algo_get(size_t index);
const uqt_algo_backend_t *uqt_algo_select_backend(const uqt_algo_t *algo);

/* Internal Declarations for builtin algorithms to register themselves */
extern const uqt_algo_t uqt_algo_sha256d;
extern const uqt_algo_t uqt_algo_blake2b;
extern const uqt_algo_t uqt_algo_gr;

/* Auto-initialize the registry with built-in algorithms */
void uqt_algo_registry_init(void);

#endif /* UQT_ALGO_H */
