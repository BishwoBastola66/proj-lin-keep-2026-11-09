#include "uqt/algo.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static uint64_t g_prng_state = 0x853c49e6748fea9bULL;

static uint32_t prng_next(void) {
    g_prng_state = g_prng_state * 6364136223846793005ULL + 1442695040888963407ULL;
    return (uint32_t)(g_prng_state >> 32);
}

static void print_hex(const char *label, const uint8_t *data, size_t len) {
    printf("%s: ", label);
    for (size_t i = 0; i < len; i++) {
        printf("%02x", data[i]);
    }
    printf("\n");
}

static bool test_backend_deterministic(const uqt_algo_t *algo, const uqt_algo_backend_t *opt, const uqt_algo_backend_t *scalar) {
    const size_t lengths[] = {
        0, 1, 2, 3, 31, 32, 55, 56, 63, 64, 65, 79, 80, 81,
        127, 128, 129, 255, 256, 257, 511, 512, 513, 1024, 2048, 4096
    };
    const size_t num_lengths = sizeof(lengths) / sizeof(lengths[0]);

    for (size_t j = 0; j < num_lengths; j++) {
        size_t len = lengths[j];
        uint8_t *input = malloc(len ? len : 1);
        if (len) {
            for (size_t k = 0; k < len; k++) {
                input[k] = (uint8_t)(k ^ len ^ 0xA5);
            }
        }

        uint8_t expected[64] = {0};
        uint8_t actual[64] = {0};

        scalar->hash(NULL, input, len, expected);
        opt->hash(NULL, input, len, actual);

        if (memcmp(expected, actual, algo->digest_size) != 0) {
            printf("ERROR: Deterministic mismatch in %s vs %s for length %zu\n", opt->name, scalar->name, len);
            print_hex("Expected", expected, algo->digest_size);
            print_hex("Actual  ", actual, algo->digest_size);
            free(input);
            return false;
        }

        free(input);
    }
    return true;
}

static bool test_backend_batches(const uqt_algo_t *algo, const uqt_algo_backend_t *opt, const uqt_algo_backend_t *scalar) {
    const size_t batch_counts[] = {1, 2, 3, 4, 5, 7, 8, 9, 15, 16, 17, 31, 32, 33, opt->batch_width};
    const size_t num_counts = sizeof(batch_counts) / sizeof(batch_counts[0]);
    const size_t test_lengths[] = {0, 1, 32, 64, 80, 128, 256};
    const size_t num_lengths = sizeof(test_lengths) / sizeof(test_lengths[0]);

    for (size_t l_idx = 0; l_idx < num_lengths; l_idx++) {
        size_t len = test_lengths[l_idx];
        for (size_t b_idx = 0; b_idx < num_counts; b_idx++) {
            size_t count = batch_counts[b_idx];
            if (count == 0) continue;

            size_t stride = len ? len : 1;
            uint8_t *inputs = malloc(count * stride);
            uint8_t *outputs = malloc(count * algo->digest_size);

            for (size_t c = 0; c < count; c++) {
                for (size_t k = 0; k < len; k++) {
                    inputs[c * stride + k] = (uint8_t)((c * 37 + k * 19 + len) & 0xFF);
                }
            }

            opt->hash_batch(NULL, inputs, len, outputs, count);

            for (size_t c = 0; c < count; c++) {
                uint8_t expected[64] = {0};
                scalar->hash(NULL, inputs + c * stride, len, expected);
                if (memcmp(expected, outputs + c * algo->digest_size, algo->digest_size) != 0) {
                    printf("ERROR: Batch mismatch in %s vs %s (len=%zu, count=%zu, item=%zu)\n",
                           opt->name, scalar->name, len, count, c);
                    print_hex("Expected", expected, algo->digest_size);
                    print_hex("Actual  ", outputs + c * algo->digest_size, algo->digest_size);
                    free(inputs);
                    free(outputs);
                    return false;
                }
            }

            free(inputs);
            free(outputs);
        }
    }
    return true;
}

static bool test_backend_fuzz(const uqt_algo_t *algo, const uqt_algo_backend_t *opt, const uqt_algo_backend_t *scalar, size_t num_cases) {
    for (size_t case_idx = 0; case_idx < num_cases; case_idx++) {
        size_t len = prng_next() % 512;
        size_t count = 1 + (prng_next() % 32);
        size_t stride = (len == 0) ? 1 : len + (prng_next() % 16);

        uint8_t *inputs = malloc(count * stride);
        uint8_t *outputs = malloc(count * algo->digest_size);

        for (size_t i = 0; i < count * stride; i++) {
            inputs[i] = (uint8_t)prng_next();
        }

        opt->hash_batch(NULL, inputs, stride, outputs, count);

        for (size_t c = 0; c < count; c++) {
            uint8_t expected[64] = {0};
            scalar->hash(NULL, inputs + c * stride, stride, expected);
            if (memcmp(expected, outputs + c * algo->digest_size, algo->digest_size) != 0) {
                printf("ERROR: Fuzz mismatch!\n");
                printf("  algorithm:     %s\n", algo->name);
                printf("  backend:       %s\n", opt->name);
                printf("  seed:          0x%016llx\n", (unsigned long long)g_prng_state);
                printf("  case number:   %zu\n", case_idx);
                printf("  input length:  %zu\n", stride);
                printf("  batch count:   %zu\n", count);
                printf("  item:          %zu\n", c);
                print_hex("  expected:     ", expected, algo->digest_size);
                print_hex("  actual:       ", outputs + c * algo->digest_size, algo->digest_size);
                free(inputs);
                free(outputs);
                return false;
            }
        }

        free(inputs);
        free(outputs);
    }
    return true;
}

static bool uqt_algo_compare_backends(const uqt_algo_t *algo) {
    printf("Differential testing for %s...\n", algo->name);

    const uqt_algo_backend_t *scalar = algo->backends[algo->num_backends - 1];

    for (size_t i = 0; i < algo->num_backends - 1; i++) {
        const uqt_algo_backend_t *opt = algo->backends[i];

        if (opt->required_features && ((g_uqt_cpu_info.features & opt->required_features) != opt->required_features)) {
            printf("  Skipping %s (unsupported by CPU)\n", opt->name);
            continue;
        }

        printf("  [Deterministic] %s vs %s...\n", opt->name, scalar->name);
        if (!test_backend_deterministic(algo, opt, scalar)) return false;

        printf("  [Batch boundaries] %s vs %s...\n", opt->name, scalar->name);
        if (!test_backend_batches(algo, opt, scalar)) return false;

        printf("  [Fuzz testing 2000 cases] %s vs %s...\n", opt->name, scalar->name);
        if (!test_backend_fuzz(algo, opt, scalar, 2000)) return false;
    }

    return true;
}

int main(void) {
    uqt_cpu_detect();

    if (!uqt_algo_compare_backends(&uqt_algo_sha256d)) return 1;
    if (!uqt_algo_compare_backends(&uqt_algo_blake2b)) return 1;

    printf("All differential, batch, and fuzz tests passed successfully!\n");
    return 0;
}
