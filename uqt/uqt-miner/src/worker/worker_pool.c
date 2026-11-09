#define _GNU_SOURCE
#include "uqt/worker.h"
#include "uqt/utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void *worker_thread_main(void *arg) {
    uqt_worker_t *w = (uqt_worker_t *)arg;
    uqt_worker_pool_t *pool = w->pool;

    /* 1. Bind thread affinity */
    uqt_cpu_set_thread_affinity(w->cpu_id);

    /* 2. Initialize worker scratchpad if required by backend */
    if (w->backend && w->backend->scratchpad_size > 0) {
        uqt_scratchpad_create(&w->scratchpad, w->backend->scratchpad_size,
                              pool->config.enable_hugepages, (int)w->numa_node);
        if (w->backend->init) {
            w->backend->init(w->scratchpad.memory);
        }
    }

    atomic_store(&w->is_running, true);

    const size_t batch_size = (w->backend && w->backend->batch_width > 0) ? w->backend->batch_width : 1;
    uint8_t input_blocks[64 * 128];
    uint8_t output_hashes[64 * 64];

    uint64_t local_nonce = ((uint64_t)w->worker_id) * 0x100000000ULL;
    uqt_job_t local_job;
    memset(&local_job, 0, sizeof(local_job));

    while (!atomic_load(&w->should_stop)) {
        if (atomic_load(&w->is_paused)) {
            usleep(10000); /* 10ms */
            continue;
        }

        /* Update local job */
        pthread_rwlock_rdlock(&pool->job_lock);
        memcpy(&local_job, &pool->current_job, sizeof(uqt_job_t));
        pthread_rwlock_unlock(&pool->job_lock);

        if (!local_job.is_valid || local_job.header_len == 0) {
            usleep(5000);
            continue;
        }

        uint64_t t_start = uqt_timer_now_ns();
        size_t stride = local_job.header_len;

        /* Prepare batch with advancing nonces */
        for (size_t b = 0; b < batch_size; b++) {
            uint8_t *slot = input_blocks + b * stride;
            memcpy(slot, local_job.header, stride);
            uint32_t nonce_val = (uint32_t)(local_nonce + b);
            if (local_job.nonce_offset + 4 <= stride) {
                memcpy(slot + local_job.nonce_offset, &nonce_val, 4);
            }
        }

        /* Execute SIMD hash batch */
        void *state_ptr = w->scratchpad.memory;
        w->backend->hash_batch(state_ptr, input_blocks, stride, output_hashes, batch_size);

        uint64_t t_end = uqt_timer_now_ns();
        uint64_t elapsed = t_end - t_start;

        /* Check solutions */
        for (size_t b = 0; b < batch_size; b++) {
            uint8_t *digest = output_hashes + b * pool->algo->digest_size;
            if (uqt_job_check_solution(digest, local_job.target)) {
                atomic_fetch_add(&w->stats.solutions_found, 1);
                if (pool->config.on_solution && local_job.is_valid) {
                    uint32_t nonce_val = (uint32_t)(local_nonce + b);
                    pool->config.on_solution(local_job.job_id, nonce_val, local_job.ntime, pool->config.solution_user_data);
                }
            }
        }

        atomic_fetch_add(&w->stats.hashes_done, batch_size);
        atomic_fetch_add(&w->stats.hash_time_ns, elapsed);
        local_nonce += batch_size;

        /* CPU Utilization Governor duty cycling */
        if (pool->config.cpu_limit_pct < 100) {
            uint32_t limit = pool->config.cpu_limit_pct ? pool->config.cpu_limit_pct : 1;
            /* sleep_time = elapsed * (100 - limit) / limit */
            uint64_t sleep_ns = (elapsed * (100 - limit)) / limit;
            if (sleep_ns > 1000) {
                usleep((useconds_t)(sleep_ns / 1000));
                atomic_fetch_add(&w->stats.idle_time_ns, sleep_ns);
            }
        }
    }

    if (w->backend && w->backend->destroy && w->scratchpad.memory) {
        w->backend->destroy(w->scratchpad.memory);
    }
    uqt_scratchpad_destroy(&w->scratchpad);
    atomic_store(&w->is_running, false);
    return NULL;
}

static void *governor_thread_main(void *arg) {
    uqt_worker_pool_t *pool = (uqt_worker_pool_t *)arg;

    while (!atomic_load(&pool->governor_stop)) {
        for (int slice = 0; slice < 20 && !atomic_load(&pool->governor_stop); slice++) {
            usleep(50000); /* 50ms responsive sleep slices */
        }
        if (atomic_load(&pool->governor_stop)) break;

        double temp = 0.0;
        if (uqt_cpu_get_temperature(&temp) == UQT_SUCCESS) {
            if (pool->config.thermal_limit_celsius > 0 && temp >= pool->config.thermal_limit_celsius) {
                /* Thermal threshold reached: throttle / pause half the workers */
                if (!atomic_load(&pool->is_throttled)) {
                    atomic_store(&pool->is_throttled, true);
                    for (uint32_t i = pool->worker_count / 2; i < pool->worker_count; i++) {
                        atomic_store(&pool->workers[i].is_paused, true);
                    }
                }
            } else if (atomic_load(&pool->is_throttled) && temp < (pool->config.thermal_limit_celsius - 5.0)) {
                /* Cooled down: resume all workers */
                atomic_store(&pool->is_throttled, false);
                for (uint32_t i = 0; i < pool->worker_count; i++) {
                    atomic_store(&pool->workers[i].is_paused, false);
                }
            }
        }
    }
    return NULL;
}

int uqt_worker_pool_create(uqt_worker_pool_t *pool, const uqt_worker_pool_config_t *config) {
    if (!pool || !config || !config->algo_name) return UQT_ERR_INVAL;

    memset(pool, 0, sizeof(*pool));
    memcpy(&pool->config, config, sizeof(*config));

    pool->algo = uqt_algo_find(config->algo_name);
    if (!pool->algo) return UQT_ERR_NOT_FOUND;

    if (config->backend_name) {
        for (size_t i = 0; i < pool->algo->num_backends; i++) {
            if (strcmp(pool->algo->backends[i]->name, config->backend_name) == 0) {
                pool->backend = pool->algo->backends[i];
                break;
            }
        }
        if (!pool->backend) return UQT_ERR_NOT_FOUND;
    } else {
        pool->backend = uqt_algo_select_backend(pool->algo);
    }

    if (!pool->backend) return UQT_ERR_UNSUPPORTED;

    /* Determine number of workers */
    uint32_t num_w = config->num_workers;
    if (num_w == 0) {
        if (config->profile && strcmp(config->profile, "balanced") == 0) {
            num_w = g_uqt_cpu_info.physical_cores ? g_uqt_cpu_info.physical_cores : 1;
        } else {
            num_w = g_uqt_cpu_info.logical_cpus ? g_uqt_cpu_info.logical_cpus : 1;
        }
    }
    if (num_w > UQT_MAX_WORKERS) num_w = UQT_MAX_WORKERS;
    pool->worker_count = num_w;

    pthread_rwlock_init(&pool->job_lock, NULL);

    /* Initialize worker structures */
    for (uint32_t i = 0; i < pool->worker_count; i++) {
        uqt_worker_t *w = &pool->workers[i];
        w->worker_id = i;
        w->pool = pool;
        w->backend = pool->backend;
        w->cpu_id = i % (g_uqt_cpu_info.logical_cpus ? g_uqt_cpu_info.logical_cpus : 1);
        w->numa_node = g_uqt_cpu_info.cores[w->cpu_id].numa_node;
        w->core_type = g_uqt_cpu_info.cores[w->cpu_id].core_type;

        atomic_store(&w->stats.hashes_done, 0);
        atomic_store(&w->stats.solutions_found, 0);
        atomic_store(&w->stats.hash_time_ns, 0);
        atomic_store(&w->stats.idle_time_ns, 0);
        atomic_store(&w->should_stop, false);
        atomic_store(&w->is_paused, false);
        atomic_store(&w->is_running, false);
    }

    return UQT_SUCCESS;
}

int uqt_worker_pool_start(uqt_worker_pool_t *pool) {
    if (!pool || pool->worker_count == 0) return UQT_ERR_INVAL;

    pool->start_time_ns = uqt_timer_now_ns();
    atomic_store(&pool->is_active, true);
    atomic_store(&pool->is_throttled, false);
    atomic_store(&pool->governor_stop, false);

    /* Start worker threads */
    for (uint32_t i = 0; i < pool->worker_count; i++) {
        atomic_store(&pool->workers[i].should_stop, false);
        pthread_create(&pool->workers[i].thread, NULL, worker_thread_main, &pool->workers[i]);
    }

    /* Start thermal / resource governor thread */
    pthread_create(&pool->governor_thread, NULL, governor_thread_main, pool);

    return UQT_SUCCESS;
}

int uqt_worker_pool_stop(uqt_worker_pool_t *pool) {
    if (!pool || !atomic_load(&pool->is_active)) return UQT_SUCCESS;

    atomic_store(&pool->is_active, false);
    atomic_store(&pool->governor_stop, true);
    pthread_join(pool->governor_thread, NULL);

    for (uint32_t i = 0; i < pool->worker_count; i++) {
        atomic_store(&pool->workers[i].should_stop, true);
    }

    for (uint32_t i = 0; i < pool->worker_count; i++) {
        pthread_join(pool->workers[i].thread, NULL);
    }

    return UQT_SUCCESS;
}

void uqt_worker_pool_destroy(uqt_worker_pool_t *pool) {
    if (!pool) return;
    uqt_worker_pool_stop(pool);
    pthread_rwlock_destroy(&pool->job_lock);
}

int uqt_worker_pool_pause(uqt_worker_pool_t *pool) {
    if (!pool) return UQT_ERR_INVAL;
    for (uint32_t i = 0; i < pool->worker_count; i++) {
        atomic_store(&pool->workers[i].is_paused, true);
    }
    return UQT_SUCCESS;
}

int uqt_worker_pool_resume(uqt_worker_pool_t *pool) {
    if (!pool) return UQT_ERR_INVAL;
    for (uint32_t i = 0; i < pool->worker_count; i++) {
        atomic_store(&pool->workers[i].is_paused, false);
    }
    return UQT_SUCCESS;
}

int uqt_worker_pool_submit_job(uqt_worker_pool_t *pool, const uqt_job_t *job) {
    if (!pool || !job) return UQT_ERR_INVAL;

    pthread_rwlock_wrlock(&pool->job_lock);
    memcpy(&pool->current_job, job, sizeof(uqt_job_t));
    pthread_rwlock_unlock(&pool->job_lock);

    return UQT_SUCCESS;
}

int uqt_worker_pool_get_metrics(uqt_worker_pool_t *pool, uqt_pool_metrics_t *metrics) {
    if (!pool || !metrics) return UQT_ERR_INVAL;

    memset(metrics, 0, sizeof(*metrics));
    metrics->elapsed_ns = uqt_timer_now_ns() - pool->start_time_ns;

    uint64_t total_hashes = 0;
    uint64_t total_solutions = 0;
    uint64_t total_hash_ns = 0;
    uint64_t total_idle_ns = 0;
    uint32_t active = 0, paused = 0;

    for (uint32_t i = 0; i < pool->worker_count; i++) {
        total_hashes += atomic_load(&pool->workers[i].stats.hashes_done);
        total_solutions += atomic_load(&pool->workers[i].stats.solutions_found);
        total_hash_ns += atomic_load(&pool->workers[i].stats.hash_time_ns);
        total_idle_ns += atomic_load(&pool->workers[i].stats.idle_time_ns);

        if (atomic_load(&pool->workers[i].is_running)) {
            if (atomic_load(&pool->workers[i].is_paused)) paused++;
            else active++;
        }
    }

    metrics->total_hashes = total_hashes;
    metrics->total_solutions = total_solutions;
    metrics->active_workers = active;
    metrics->paused_workers = paused;

    double elapsed_sec = metrics->elapsed_ns / 1000000000.0;
    if (elapsed_sec > 0) {
        metrics->avg_hashrate_mhs = (total_hashes / elapsed_sec) / 1000000.0;
        metrics->current_hashrate_mhs = metrics->avg_hashrate_mhs;
    }

    uint64_t total_worker_time = total_hash_ns + total_idle_ns;
    if (total_worker_time > 0) {
        metrics->cpu_utilization_pct = (double)total_hash_ns * 100.0 / (double)total_worker_time;
    } else {
        metrics->cpu_utilization_pct = 100.0;
    }

    uqt_cpu_get_temperature(&metrics->current_temperature_c);
    return UQT_SUCCESS;
}
