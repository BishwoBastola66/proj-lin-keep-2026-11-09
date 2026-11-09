#include "uqt/types.h"
#include "uqt/utils.h"
#include "uqt/cpu.h"
#include "uqt/memory.h"
#include "uqt/algo.h"
#include "uqt/worker.h"
#include "uqt/net.h"
#include "uqt/dashboard.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>

#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
#include <unistd.h>
#endif

static volatile bool g_running = true;

static void sigint_handler(int sig) {
    (void)sig;
    g_running = false;
}

static int run_self_tests(void) {
    printf("Running built-in self-tests...\n");
    const uqt_algo_t *sha = uqt_algo_find("sha256d");
    if (!sha) return 1;

    uint8_t out[32];
    sha->backends[0]->hash(NULL, (const uint8_t*)"", 0, out);
    
    const uqt_algo_t *blk = uqt_algo_find("blake2b");
    if (!blk) return 1;
    uint8_t out_b[64];
    blk->backends[0]->hash(NULL, (const uint8_t*)"", 0, out_b);

    printf("All self-tests passed.\n");
    return 0;
}

static int compare_doubles(const void *a, const void *b) {
    double da = *(const double*)a;
    double db = *(const double*)b;
    return (da > db) - (da < db);
}

static void run_benchmark(const uqt_algo_t *algo, const char *forced_backend, uint32_t workers_override) {
    printf("========================================================================================\n");
    printf("Algorithm: %s (Digest: %zu bytes)\n", algo->name, algo->digest_size);
    printf("CPU Model: %s (%u logical CPUs, %u physical cores)\n",
           g_uqt_cpu_info.brand, g_uqt_cpu_info.logical_cpus, g_uqt_cpu_info.physical_cores);
    printf("========================================================================================\n\n");

    const size_t input_len = 80;
    const size_t max_batch = 64;
    uint8_t *inputs = uqt_mem_alloc_aligned(max_batch * input_len, 64);
    uint8_t *outputs = uqt_mem_alloc_aligned(max_batch * algo->digest_size, 64);

    for (size_t b = 0; b < max_batch * input_len; b++) {
        inputs[b] = (uint8_t)(b * 17 + 5);
    }

    if (workers_override > 1) {
        printf("Multi-Threaded Benchmark (Workers: %u)\n", workers_override);
        printf("%-12s %-10s %-10s %-12s %-12s %-12s\n",
               "Backend", "Workers", "Hashes", "Elapsed (s)", "Hashrate (MH/s)", "Status");
        printf("----------------------------------------------------------------------------------------\n");

        for (size_t i = 0; i < algo->num_backends; i++) {
            const uqt_algo_backend_t *opt = algo->backends[i];
            if (forced_backend && strcmp(opt->name, forced_backend) != 0) continue;
            if (opt->required_features && ((g_uqt_cpu_info.features & opt->required_features) != opt->required_features)) {
                printf("%-12s %-10u %-12s %-12s %-12s %-12s\n", opt->name, workers_override, "-", "-", "-", "unavailable");
                continue;
            }

            uqt_worker_pool_config_t cfg;
            memset(&cfg, 0, sizeof(cfg));
            cfg.algo_name = algo->name;
            cfg.backend_name = opt->name;
            cfg.num_workers = workers_override;
            cfg.cpu_limit_pct = 100;
            cfg.thermal_limit_celsius = 95.0;

            uqt_worker_pool_t pool;
            if (uqt_worker_pool_create(&pool, &cfg) != UQT_SUCCESS) continue;

            uqt_job_t test_job;
            uint8_t header[80];
            uint8_t target[32] = {0};
            for (int k = 0; k < 80; k++) header[k] = (uint8_t)(k * 7 + 1);
            uqt_job_create(&test_job, "bench_job", header, 80, target, 76);

            uqt_worker_pool_submit_job(&pool, &test_job);
            uqt_worker_pool_start(&pool);

            usleep(100000); /* 100ms warmup */

            uint64_t t0 = uqt_timer_now_ns();
            sleep(1); /* 1 sec measure */
            uint64_t t1 = uqt_timer_now_ns();

            uqt_pool_metrics_t metrics;
            uqt_worker_pool_get_metrics(&pool, &metrics);

            uqt_worker_pool_stop(&pool);
            uqt_worker_pool_destroy(&pool);

            double sec = (t1 - t0) / 1000000000.0;
            double rate = (metrics.total_hashes / sec) / 1000000.0;

            printf("%-12s %-10u %-12llu %-12.3f %-12.2f %-12s\n",
                   opt->name, workers_override, (unsigned long long)metrics.total_hashes,
                   sec, rate, "Completed");
        }
    } else {
        printf("%-12s %-10s %-10s %-12s %-12s %-12s %-12s\n",
               "Backend", "Input Size", "Batch", "Hashes", "Elapsed (s)", "Median (MH/s)", "Min/Max (MH/s)");
        printf("----------------------------------------------------------------------------------------\n");

        for (size_t i = 0; i < algo->num_backends; i++) {
            const uqt_algo_backend_t *opt = algo->backends[i];

            if (forced_backend && strcmp(opt->name, forced_backend) != 0) {
                continue;
            }

            if (opt->required_features && ((g_uqt_cpu_info.features & opt->required_features) != opt->required_features)) {
                printf("%-12s %-10s %-10s %-12s %-12s %-12s\n",
                       opt->name, "80 B", "-", "-", "-", "unavailable");
                continue;
            }

            size_t batch = opt->batch_width ? opt->batch_width : 1;

            for (int w = 0; w < 5000; w++) {
                opt->hash_batch(NULL, inputs, input_len, outputs, batch);
            }

            const int num_runs = 5;
            double rates[5];
            uint64_t total_hashes = 0;
            double total_elapsed_sec = 0.0;

            for (int run = 0; run < num_runs; run++) {
                uint64_t start_ns = uqt_timer_now_ns();
                uint64_t hashes = 0;
                const uint64_t duration_ns = 500000000ULL;

                while (uqt_timer_now_ns() - start_ns < duration_ns) {
                    for (int k = 0; k < 2000; k++) {
                        opt->hash_batch(NULL, inputs, input_len, outputs, batch);
                        hashes += batch;
                    }
                }
                uint64_t elapsed_ns = uqt_timer_now_ns() - start_ns;
                double sec = elapsed_ns / 1000000000.0;
                rates[run] = (hashes / sec) / 1000000.0;
                total_hashes += hashes;
                total_elapsed_sec += sec;
            }

            qsort(rates, num_runs, sizeof(double), compare_doubles);
            double median = rates[num_runs / 2];
            double min_rate = rates[0];
            double max_rate = rates[num_runs - 1];

            char min_max_buf[32];
            snprintf(min_max_buf, sizeof(min_max_buf), "%.2f / %.2f", min_rate, max_rate);

            printf("%-12s %-10zu %-10zu %-12llu %-12.3f %-12.2f %-12s\n",
                   opt->name, input_len, batch, (unsigned long long)total_hashes,
                   total_elapsed_sec, median, min_max_buf);
        }
    }

    uqt_mem_free_aligned(inputs);
    uqt_mem_free_aligned(outputs);
    printf("\n");
}

/* Stratum context for live mining */
typedef struct {
    uqt_worker_pool_t *pool;
    uqt_dashboard_stats_t *dash_stats;
    uqt_stratum_client_t *stratum;
} stratum_mining_ctx_t;

static void on_pool_solution(const char *job_id, uint32_t nonce, uint32_t ntime, void *user_data) {
    stratum_mining_ctx_t *ctx = (stratum_mining_ctx_t *)user_data;
    if (ctx && ctx->stratum && ctx->stratum->connected) {
        uqt_stratum_submit_share(ctx->stratum, job_id, nonce, ntime, "00000000");
    }
}

static void on_stratum_job(const uqt_job_t *job, bool clean_jobs, void *user_data) {
    stratum_mining_ctx_t *ctx = (stratum_mining_ctx_t *)user_data;
    if (ctx) {
        if (ctx->pool) {
            uqt_worker_pool_submit_job(ctx->pool, job);
        }
        if (ctx->dash_stats && job) {
            strncpy(ctx->dash_stats->last_job_id, job->job_id, sizeof(ctx->dash_stats->last_job_id) - 1);
        }
    }
}

static void on_stratum_diff(double diff, void *user_data) {
    stratum_mining_ctx_t *ctx = (stratum_mining_ctx_t *)user_data;
    if (ctx && ctx->dash_stats) {
        ctx->dash_stats->pool_difficulty = diff;
    }
}

static void on_stratum_share(uint64_t id, bool accepted, const char *reason, void *user_data) {
    stratum_mining_ctx_t *ctx = (stratum_mining_ctx_t *)user_data;
    if (ctx && ctx->dash_stats) {
        if (accepted) {
            ctx->dash_stats->shares_accepted++;
            uqt_log(UQT_LOG_INFO, "\033[1;32mAccepted share #%llu!\033[0m", (unsigned long long)id);
        } else {
            ctx->dash_stats->shares_rejected++;
            uqt_log(UQT_LOG_WARN, "Rejected share #%llu: %s", (unsigned long long)id, reason);
        }
    }
}

static void print_usage(void) {
    printf("uqt-miner v0.1.0 - High-Performance Zero-Dependency CPU Miner\n\n");
    printf("Usage: uqt_miner [OPTIONS]\n\n");
    printf("Mining Options:\n");
    printf("  -o, --url <url>          Stratum pool URL (e.g. stratum+tcp://pool:3333)\n");
    printf("  -u, --user <username>    Pool username / wallet address\n");
    printf("  -p, --pass <password>    Pool password (default: x)\n");
    printf("  -a, --algo <algo>        Algorithm (default: sha256d, blake2b)\n");
    printf("  -t, --threads <n>        Number of mining threads (default: auto)\n");
    printf("  --dry-run                Simulate mining without network\n\n");
    printf("Diagnostics & Benchmarks:\n");
    printf("  --benchmark              Run algorithm performance benchmarks\n");
    printf("  --auto-tune              Auto-detect optimal thread count and affinity\n");
    printf("  --profile <name>         Auto-tune profile (performance, efficiency, low-power)\n");
    printf("  --system-info            Show hardware & OS capabilities\n");
    printf("  --cpu-info               Show CPU topology and SIMD flags\n");
    printf("  --memory-info            Show HugePages & NUMA status\n");
    printf("  --list-algos             List available hashing algorithms\n");
    printf("  --test                   Run internal unit & regression tests\n");
    printf("  -h, --help               Show this help message\n\n");
}

int main(int argc, char **argv) {
    signal(SIGINT, sigint_handler);
    signal(SIGTERM, sigint_handler);

    uqt_log_init(UQT_LOG_INFO);
    uqt_cpu_detect();
    uqt_algo_registry_init();

    bool benchmark_mode = false;
    bool autotune_mode = false;
    bool dry_run_mode = false;
    const char *target_algo = "sha256d";
    const char *forced_backend = NULL;
    const char *profile = "performance";
    const char *pool_url = NULL;
    const char *pool_user = NULL;
    const char *pool_pass = "x";
    uint32_t workers_count = 0;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage();
            return UQT_SUCCESS;
        }
        if (strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--url") == 0) {
            if (i + 1 < argc) pool_url = argv[++i];
            continue;
        }
        if (strcmp(argv[i], "-u") == 0 || strcmp(argv[i], "--user") == 0) {
            if (i + 1 < argc) pool_user = argv[++i];
            continue;
        }
        if (strcmp(argv[i], "-p") == 0 || strcmp(argv[i], "--pass") == 0) {
            if (i + 1 < argc) pool_pass = argv[++i];
            continue;
        }
        if (strcmp(argv[i], "-t") == 0 || strcmp(argv[i], "--threads") == 0 || strcmp(argv[i], "--workers") == 0) {
            if (i + 1 < argc) workers_count = (uint32_t)atoi(argv[++i]);
            continue;
        }
        if (strcmp(argv[i], "-a") == 0 || strcmp(argv[i], "--algo") == 0) {
            if (i + 1 < argc) target_algo = argv[++i];
            continue;
        }
        if (strcmp(argv[i], "--backend") == 0) {
            if (i + 1 < argc) forced_backend = argv[++i];
            continue;
        }
        if (strcmp(argv[i], "--dry-run") == 0) {
            dry_run_mode = true;
            continue;
        }
        if (strcmp(argv[i], "--system-info") == 0) {
            uqt_system_print_info();
            return UQT_SUCCESS;
        }
        if (strcmp(argv[i], "--cpu-info") == 0) {
            uqt_cpu_print_info();
            return UQT_SUCCESS;
        }
        if (strcmp(argv[i], "--memory-info") == 0) {
            uqt_memory_print_info();
            return UQT_SUCCESS;
        }
        if (strcmp(argv[i], "--list-algos") == 0) {
            printf("Available algorithms:\n\n");
            for (size_t j = 0; j < uqt_algo_count(); j++) {
                printf("%s\n", uqt_algo_get(j)->name);
            }
            return UQT_SUCCESS;
        }
        if (strcmp(argv[i], "--test") == 0) {
            return run_self_tests();
        }
        if (strcmp(argv[i], "--benchmark") == 0) {
            benchmark_mode = true;
            continue;
        }
        if (strcmp(argv[i], "--auto-tune") == 0) {
            autotune_mode = true;
            continue;
        }
        if (strcmp(argv[i], "--profile") == 0 && i + 1 < argc) {
            profile = argv[++i];
            continue;
        }
    }

    if (autotune_mode) {
        uqt_worker_pool_config_t best;
        return (uqt_autotune_run(target_algo, profile, &best) == UQT_SUCCESS) ? 0 : 1;
    }
    
    if (benchmark_mode) {
        const uqt_algo_t *algo = uqt_algo_find(target_algo);
        if (!algo) {
            printf("Algorithm not found: %s\n", target_algo);
            return 1;
        }
        run_benchmark(algo, forced_backend, workers_count);
        return 0;
    }

    /* Pool Mining or Dry Run */
    if (pool_url || dry_run_mode) {
        if (workers_count == 0) {
            /* Default to physical cores to avoid hyperthread cache contention */
            workers_count = g_uqt_cpu_info.physical_cores ? g_uqt_cpu_info.physical_cores : 4;
        }

        const uqt_algo_t *algo = uqt_algo_find(target_algo);
        if (!algo) {
            uqt_log(UQT_LOG_ERROR, "Requested algorithm '%s' is not supported.", target_algo);
            return 1;
        }

        const uqt_algo_backend_t *backend = uqt_algo_select_backend(algo);
        if (!backend) {
            uqt_log(UQT_LOG_ERROR, "No compatible backend found for algorithm '%s'.", target_algo);
            return 1;
        }

        uqt_log(UQT_LOG_INFO, "Initializing uqt-miner on CPU: %s (%u threads)", g_uqt_cpu_info.brand, workers_count);
        uqt_log(UQT_LOG_INFO, "Using algorithm: %s, backend: %s", algo->name, backend->name);

        uqt_worker_pool_config_t pool_cfg;
        memset(&pool_cfg, 0, sizeof(pool_cfg));
        pool_cfg.algo_name = algo->name;
        pool_cfg.backend_name = backend->name;
        pool_cfg.num_workers = workers_count;
        pool_cfg.cpu_limit_pct = 100;
        pool_cfg.thermal_limit_celsius = 95.0;

        uqt_worker_pool_t pool;
        uqt_dashboard_stats_t dash_stats;
        memset(&dash_stats, 0, sizeof(dash_stats));
        dash_stats.algo_name = algo->name;
        dash_stats.backend_name = backend->name;
        dash_stats.pool_url = pool_url ? pool_url : "dry-run (local)";
        dash_stats.wallet = pool_user ? pool_user : "bench";
        dash_stats.num_workers = workers_count;
        dash_stats.pool_difficulty = 1.0;

        stratum_mining_ctx_t ctx;
        memset(&ctx, 0, sizeof(ctx));
        ctx.pool = &pool;
        ctx.dash_stats = &dash_stats;

        pool_cfg.on_solution = on_pool_solution;
        pool_cfg.solution_user_data = &ctx;

        if (uqt_worker_pool_create(&pool, &pool_cfg) != UQT_SUCCESS) {
            uqt_log(UQT_LOG_ERROR, "Failed to initialize worker pool.");
            return 1;
        }

        uqt_stratum_client_t *stratum = NULL;

        if (pool_url && !dry_run_mode) {
            uqt_stratum_config_t strat_cfg;
            memset(&strat_cfg, 0, sizeof(strat_cfg));
            strat_cfg.url = pool_url;
            strat_cfg.user = pool_user;
            strat_cfg.pass = pool_pass;
            strat_cfg.algo = target_algo;
            strat_cfg.on_job = on_stratum_job;
            strat_cfg.on_diff = on_stratum_diff;
            strat_cfg.on_share_result = on_stratum_share;
            strat_cfg.user_data = &ctx;

            if (uqt_stratum_create(&stratum, &strat_cfg) != UQT_SUCCESS ||
                uqt_stratum_connect(stratum) != UQT_SUCCESS) {
                uqt_log(UQT_LOG_WARN, "Could not connect to pool. Falling back to offline simulation.");
            } else {
                ctx.stratum = stratum;
            }
        }

        /* Submit initial job */
        uqt_job_t initial_job;
        uint8_t header[80];
        uint8_t target[32];
        uqt_diff_to_target(1.0, target);
        for (int k = 0; k < 80; k++) header[k] = (uint8_t)(k * 13 + 7);
        uqt_job_create(&initial_job, "job_001", header, 80, target, 76);
        uqt_worker_pool_submit_job(&pool, &initial_job);

        uqt_worker_pool_start(&pool);
        uqt_dashboard_init();
        uqt_log(UQT_LOG_INFO, "Mining threads started. Press 'd' for interactive commands, Ctrl+C to stop.\n");

        uint64_t start_time = uqt_timer_now_ns();
        uint64_t last_dash_update = start_time;

        while (g_running) {
            if (stratum && stratum->connected) {
                uqt_stratum_process(stratum, 50);
            } else {
                usleep(50000);
            }

            /* Process interactive keypresses */
            int ch = uqt_dashboard_read_key();
            if (ch > 0) {
                uint64_t cur_now = uqt_timer_now_ns();
                dash_stats.uptime_seconds = (cur_now - start_time) / 1000000000ULL;
                switch (ch) {
                    case 'h':
                    case 'H':
                        uqt_dashboard_show_hashrate(&pool, &dash_stats);
                        break;
                    case 's':
                    case 'S':
                        uqt_dashboard_show_shares(&dash_stats);
                        break;
                    case 'c':
                    case 'C':
                        uqt_dashboard_show_connection(stratum, &dash_stats);
                        break;
                    case 'e':
                    case 'E':
                    case 'i':
                    case 'I':
                        uqt_dashboard_show_environment(&pool);
                        break;
                    case 'p':
                    case 'P':
                        dash_stats.is_paused = !dash_stats.is_paused;
                        if (dash_stats.is_paused) {
                            uqt_worker_pool_pause(&pool);
                            printf("\n\033[1;31m>>> Mining PAUSED by user. Press 'p' to resume. <<<\033[0m\n\n");
                        } else {
                            uqt_worker_pool_resume(&pool);
                            printf("\n\033[1;32m>>> Mining RESUMED by user. <<<\033[0m\n\n");
                        }
                        break;
                    case 'r':
                    case 'R':
                        if (dash_stats.is_paused) {
                            dash_stats.is_paused = false;
                            uqt_worker_pool_resume(&pool);
                            printf("\n\033[1;32m>>> Mining RESUMED by user. <<<\033[0m\n\n");
                        } else {
                            uqt_dashboard_show_shares(&dash_stats);
                        }
                        break;
                    case 'd':
                    case 'D':
                    case '?':
                        uqt_dashboard_show_help();
                        break;
                    case 'q':
                    case 'Q':
                        printf("\n\033[1;31m>>> Quitting miner... <<<\033[0m\n");
                        g_running = false;
                        break;
                }
            }

            uint64_t now = uqt_timer_now_ns();
            if (now - last_dash_update >= 1000000000ULL) { /* 1 sec dashboard refresh */
                dash_stats.uptime_seconds = (now - start_time) / 1000000000ULL;
                uqt_pool_metrics_t metrics;
                uqt_worker_pool_get_metrics(&pool, &metrics);
                uqt_dashboard_render(&dash_stats, &metrics);
                last_dash_update = now;
            }
        }

        uqt_dashboard_cleanup();
        uqt_log(UQT_LOG_INFO, "\nShutting down worker threads...");
        uqt_worker_pool_stop(&pool);
        uqt_worker_pool_destroy(&pool);

        if (stratum) {
            uqt_stratum_destroy(stratum);
        }

        uqt_log(UQT_LOG_INFO, "Miner stopped cleanly.");
        return UQT_SUCCESS;
    }

    /* Default startup: display system diagnostics */
    uqt_system_print_info();
    printf("\nTip: Run with --help to see all mining and benchmark options.\n");
    return UQT_SUCCESS;
}
