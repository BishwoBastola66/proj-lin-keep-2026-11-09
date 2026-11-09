#include "uqt/worker.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    uqt_cpu_detect();
    uqt_algo_registry_init();

    printf("Starting Autotuner test on SHA-256d...\n");
    uqt_worker_pool_config_t best_sha256d;
    if (uqt_autotune_run("sha256d", "performance", &best_sha256d) != UQT_SUCCESS) {
        printf("ERROR: Autotune failed on sha256d\n");
        return 1;
    }

    printf("Starting Autotuner test on BLAKE2b...\n");
    uqt_worker_pool_config_t best_blake2b;
    if (uqt_autotune_run("blake2b", "balanced", &best_blake2b) != UQT_SUCCESS) {
        printf("ERROR: Autotune failed on blake2b\n");
        return 1;
    }

    printf("All autotuner tests passed successfully!\n");
    return 0;
}
