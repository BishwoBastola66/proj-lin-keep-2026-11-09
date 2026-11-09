#include "uqt/algo.h"
#include <string.h>
#include <stdio.h>

#define MAX_ALGOS 16

static const uqt_algo_t *g_algos[MAX_ALGOS];
static size_t g_num_algos = 0;

int uqt_algo_register(const uqt_algo_t *algo) {
    if (!algo || !algo->name) return UQT_ERR_INVAL;
    if (g_num_algos >= MAX_ALGOS) return UQT_ERR_NOMEM;

    /* Avoid duplicates */
    for (size_t i = 0; i < g_num_algos; i++) {
        if (strcmp(g_algos[i]->name, algo->name) == 0) {
            return UQT_ERR_INVAL;
        }
    }

    g_algos[g_num_algos++] = algo;
    return UQT_SUCCESS;
}

const uqt_algo_t *uqt_algo_find(const char *name) {
    if (!name) return NULL;
    for (size_t i = 0; i < g_num_algos; i++) {
        if (strcmp(g_algos[i]->name, name) == 0) {
            return g_algos[i];
        }
    }
    return NULL;
}

size_t uqt_algo_count(void) {
    return g_num_algos;
}

const uqt_algo_t *uqt_algo_get(size_t index) {
    if (index >= g_num_algos) return NULL;
    return g_algos[index];
}

const uqt_algo_backend_t *uqt_algo_select_backend(const uqt_algo_t *algo) {
    if (!algo || !algo->backends || algo->num_backends == 0) return NULL;

    /* Backends should be ordered by highest priority first */
    for (size_t i = 0; i < algo->num_backends; i++) {
        const uqt_algo_backend_t *backend = algo->backends[i];
        if (backend->required_features == 0) {
            return backend; /* Scalar fallback */
        }
        /* Check if all required features are supported */
        if ((g_uqt_cpu_info.features & backend->required_features) == backend->required_features) {
            return backend;
        }
    }

    /* Fallback to scalar (usually the last in the array) */
    return algo->backends[algo->num_backends - 1];
}

/* Auto-init */
void uqt_algo_registry_init(void) {
    g_num_algos = 0;
    uqt_algo_register(&uqt_algo_sha256d);
    uqt_algo_register(&uqt_algo_blake2b);
    uqt_algo_register(&uqt_algo_gr);
}
