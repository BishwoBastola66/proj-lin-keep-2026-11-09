#include "uqt/worker.h"
#include "uqt/utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int uqt_autotune_run(const char *algo_name, const char *profile, uqt_worker_pool_config_t *best_config) {
    if (!algo_name) return UQT_ERR_INVAL;

    const uqt_algo_t *algo = uqt_algo_find(algo_name);
    if (!algo) {
        printf("Autotune error: Algorithm %s not found\n", algo_name);
        return UQT_ERR_NOT_FOUND;
    }

    printf("========================================================================================\n");
    printf("                  uqt-miner Adaptive Thread & Backend Autotuner\n");
    printf("========================================================================================\n");
    printf("Target Algorithm:   %s\n", algo->name);
    printf("Tuning Profile:     %s\n", profile ? profile : "performance");
    printf("CPU Topology:       %u physical cores / %u logical CPUs (P-Cores: %u, E-Cores: %u)\n",
           g_uqt_cpu_info.physical_cores, g_uqt_cpu_info.logical_cpus,
           g_uqt_cpu_info.p_core_count, g_uqt_cpu_info.e_core_count);
    printf("========================================================================================\n\n");

    printf("%-10s %-12s %-12s %-15s %-15s\n", "Config #", "Backend", "Workers", "Hashrate (MH/s)", "Evaluation");
    printf("----------------------------------------------------------------------------------------\n");

    /* Prepare dummy job */
    uqt_job_t test_job;
    uint8_t test_header[80];
    uint8_t test_target[32];
    for (int i = 0; i < 80; i++) test_header[i] = (uint8_t)(i * 3 + 1);
    memset(test_target, 0x00, 32); /* Difficult target so workers just hash continuously */
    uqt_job_create(&test_job, "autotune_probe", test_header, 80, test_target, 76);

    double max_hashrate = 0.0;
    uqt_worker_pool_config_t winner;
    memset(&winner, 0, sizeof(winner));
    winner.algo_name = algo->name;
    winner.profile = profile ? profile : "performance";

    /* Configurations to test:
       Worker counts: 1, P-cores, Physical Cores, Logical CPUs
       Backends: all supported backends for algorithm */
    uint32_t worker_counts[8];
    size_t num_counts = 0;
    worker_counts[num_counts++] = 1;
    if (g_uqt_cpu_info.p_core_count > 1 && g_uqt_cpu_info.p_core_count != 1) {
        worker_counts[num_counts++] = g_uqt_cpu_info.p_core_count;
    }
    if (g_uqt_cpu_info.physical_cores > 1 && g_uqt_cpu_info.physical_cores != g_uqt_cpu_info.p_core_count) {
        worker_counts[num_counts++] = g_uqt_cpu_info.physical_cores;
    }
    if (g_uqt_cpu_info.logical_cpus > 1 && g_uqt_cpu_info.logical_cpus != g_uqt_cpu_info.physical_cores) {
        worker_counts[num_counts++] = g_uqt_cpu_info.logical_cpus;
    }

    int config_idx = 1;

    for (size_t b = 0; b < algo->num_backends; b++) {
        const uqt_algo_backend_t *be = algo->backends[b];
        if (be->required_features && ((g_uqt_cpu_info.features & be->required_features) != be->required_features)) {
            continue;
        }

        for (size_t w = 0; w < num_counts; w++) {
            uint32_t w_count = worker_counts[w];

            uqt_worker_pool_config_t cfg;
            memset(&cfg, 0, sizeof(cfg));
            cfg.algo_name = algo->name;
            cfg.backend_name = be->name;
            cfg.num_workers = w_count;
            cfg.cpu_limit_pct = 100;
            cfg.thermal_limit_celsius = 90.0;
            cfg.profile = profile ? profile : "performance";

            uqt_worker_pool_t pool;
            if (uqt_worker_pool_create(&pool, &cfg) != UQT_SUCCESS) {
                continue;
            }

            uqt_worker_pool_submit_job(&pool, &test_job);
            uqt_worker_pool_start(&pool);

            /* Fast convergence warmup: 30ms */
            usleep(30000);

            /* High-precision measurement: 70ms */
            uint64_t t0 = uqt_timer_now_ns();
            usleep(70000);
            uint64_t t1 = uqt_timer_now_ns();

            uqt_pool_metrics_t metrics;
            uqt_worker_pool_get_metrics(&pool, &metrics);

            uqt_worker_pool_stop(&pool);
            uqt_worker_pool_destroy(&pool);

            double sec = (t1 - t0) / 1000000000.0;
            double rate = (metrics.total_hashes / sec) / 1000000.0;

            bool is_best = (rate > max_hashrate);
            if (is_best) {
                max_hashrate = rate;
                memcpy(&winner, &cfg, sizeof(cfg));
            }

            printf("%-10d %-12s %-12u %-15.2f %-15s\n",
                   config_idx++, be->name, w_count, rate, is_best ? "★ Best so far" : "Tested");
        }
    }

    printf("----------------------------------------------------------------------------------------\n");
    printf("Autotune Winner Selected:\n");
    printf("  Backend:       %s\n", winner.backend_name);
    printf("  Workers:       %u\n", winner.num_workers);
    printf("  Peak Hashrate: %.2f MH/s\n", max_hashrate);
    printf("========================================================================================\n\n");

    if (best_config) {
        memcpy(best_config, &winner, sizeof(winner));
    }
    return UQT_SUCCESS;
}
