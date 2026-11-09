/* CryptoNight variant configurations for GhostRider (Raptoreum) */
#ifndef CN_VARIANTS_H
#define CN_VARIANTS_H

#include <stddef.h>
#include <stdint.h>

/* CryptoNight variant parameters */
typedef struct {
    const char *name;
    size_t memory;       /* scratchpad size in bytes */
    uint32_t iterations; /* number of main loop iterations */
    int variant;         /* variant ID for tweak selection */
} cn_variant_t;

/* cn/dark: 512KB */
static const cn_variant_t CN_DARK = {
    .name = "cn/dark",
    .memory = 524288,
    .iterations = 262144,
    .variant = 0
};

/* cn/dark-lite: 256KB */
static const cn_variant_t CN_DARK_LITE = {
    .name = "cn/dark-lite",
    .memory = 262144,
    .iterations = 131072,
    .variant = 1
};

/* cn/fast: 2MB */
static const cn_variant_t CN_FAST = {
    .name = "cn/fast",
    .memory = 2097152,
    .iterations = 524288,
    .variant = 2
};

/* cn/lite: 1MB */
static const cn_variant_t CN_LITE = {
    .name = "cn/lite",
    .memory = 1048576,
    .iterations = 262144,
    .variant = 3
};

/* cn/turtle: 256KB */
static const cn_variant_t CN_TURTLE = {
    .name = "cn/turtle",
    .memory = 262144,
    .iterations = 65536,
    .variant = 4
};

/* cn/turtle-lite: 128KB */
static const cn_variant_t CN_TURTLE_LITE = {
    .name = "cn/turtle-lite",
    .memory = 131072,
    .iterations = 32768,
    .variant = 5
};

#endif /* CN_VARIANTS_H */
