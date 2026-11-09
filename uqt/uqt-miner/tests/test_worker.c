#include "uqt/worker.h"
#include "uqt/utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <assert.h>

static bool test_worker_lifecycle(void) {
    printf("Testing worker pool lifecycle...\n");

    uqt_worker_pool_config_t config;
    memset(&config, 0, sizeof(config));
    config.algo_name = "sha256d";
    config.num_workers = 4;
    config.cpu_limit_pct = 100;
    config.thermal_limit_celsius = 95.0;

    uqt_worker_pool_t pool;
    if (uqt_worker_pool_create(&pool, &config) != UQT_SUCCESS) {
        printf("ERROR: Worker pool creation failed\n");
        return false;
    }

    uqt_job_t job;
    uint8_t header[80] = {0};
    uint8_t target[32] = {0};
    memset(target, 0xFF, 32); /* Easy target */
    uqt_job_create(&job, "lifecycle_job_1", header, 80, target, 76);

    if (uqt_worker_pool_submit_job(&pool, &job) != UQT_SUCCESS) {
        printf("ERROR: Job submission failed\n");
        return false;
    }

    if (uqt_worker_pool_start(&pool) != UQT_SUCCESS) {
        printf("ERROR: Worker pool start failed\n");
        return false;
    }

    /* Let it run for 200ms */
    usleep(200000);

    /* Test pause */
    uqt_worker_pool_pause(&pool);
    usleep(50000);

    uqt_pool_metrics_t metrics;
    uqt_worker_pool_get_metrics(&pool, &metrics);
    printf("  [Paused] Active: %u, Paused: %u, Hashes: %llu\n",
           metrics.active_workers, metrics.paused_workers, (unsigned long long)metrics.total_hashes);

    /* Test resume */
    uqt_worker_pool_resume(&pool);
    usleep(100000);

    uqt_worker_pool_get_metrics(&pool, &metrics);
    printf("  [Resumed] Active: %u, Hashes: %llu, Hashrate: %.2f MH/s\n",
           metrics.active_workers, (unsigned long long)metrics.total_hashes, metrics.avg_hashrate_mhs);

    if (metrics.total_hashes == 0) {
        printf("ERROR: No hashes executed by worker pool\n");
        uqt_worker_pool_destroy(&pool);
        return false;
    }

    uqt_worker_pool_stop(&pool);
    uqt_worker_pool_destroy(&pool);
    printf("Lifecycle test passed!\n");
    return true;
}

static bool test_worker_stress(void) {
    printf("Testing rapid start/stop stress cycles...\n");

    uqt_worker_pool_config_t config;
    memset(&config, 0, sizeof(config));
    config.algo_name = "blake2b";
    config.num_workers = 4;
    config.cpu_limit_pct = 100;

    uqt_job_t job;
    uint8_t header[80] = {0};
    uint8_t target[32] = {0};
    memset(target, 0xFF, 32);
    uqt_job_create(&job, "stress_job", header, 80, target, 76);

    for (int cycle = 0; cycle < 10; cycle++) {
        uqt_worker_pool_t pool;
        if (uqt_worker_pool_create(&pool, &config) != UQT_SUCCESS) {
            printf("ERROR: Failed in cycle %d create\n", cycle);
            return false;
        }
        uqt_worker_pool_submit_job(&pool, &job);
        uqt_worker_pool_start(&pool);
        usleep(10000); /* 10ms quick burst */
        uqt_worker_pool_stop(&pool);
        uqt_worker_pool_destroy(&pool);
    }

    printf("Rapid start/stop stress test passed!\n");
    return true;
}

int main(void) {
    uqt_cpu_detect();
    uqt_algo_registry_init();

    if (!test_worker_lifecycle()) return 1;
    if (!test_worker_stress()) return 1;

    printf("All worker engine tests passed successfully!\n");
    return 0;
}
