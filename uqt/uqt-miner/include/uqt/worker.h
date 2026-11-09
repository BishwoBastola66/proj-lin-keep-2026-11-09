#ifndef UQT_WORKER_H
#define UQT_WORKER_H

#include "uqt/types.h"
#include "uqt/cpu.h"
#include "uqt/memory.h"
#include "uqt/algo.h"
#include <pthread.h>
#include <stdatomic.h>

#define UQT_MAX_WORKERS 128

/* Mining Job Specification */
typedef struct {
    char job_id[64];
    uint8_t header[128];
    size_t header_len;
    uint8_t target[32];
    size_t nonce_offset;
    uint64_t nonce_start;
    uint64_t nonce_count;
    uint32_t ntime;
    uint64_t epoch;
    bool is_valid;
} uqt_job_t;

int uqt_job_create(uqt_job_t *job, const char *job_id, const uint8_t *header, size_t header_len, const uint8_t target[32], size_t nonce_offset);
bool uqt_job_check_solution(const uint8_t hash[32], const uint8_t target[32]);

/* Cache-line aligned stats structure to eliminate false sharing */
typedef struct {
    _Alignas(UQT_CACHE_LINE_SIZE) _Atomic uint64_t hashes_done;
    _Atomic uint64_t solutions_found;
    _Atomic uint64_t hash_time_ns;
    _Atomic uint64_t idle_time_ns;
    uint8_t _pad[UQT_CACHE_LINE_SIZE - (4 * sizeof(uint64_t))];
} uqt_worker_stats_t;

struct uqt_worker_pool_s;

/* Individual Worker Context */
typedef struct {
    uint32_t worker_id;
    uint32_t cpu_id;
    uint32_t numa_node;
    uqt_core_type_t core_type;
    const uqt_algo_backend_t *backend;
    uqt_scratchpad_t scratchpad;
    
    uqt_worker_stats_t stats;
    
    _Atomic bool should_stop;
    _Atomic bool is_paused;
    _Atomic bool is_running;
    
    pthread_t thread;
    struct uqt_worker_pool_s *pool;
} uqt_worker_t;

/* Solution callback invoked when a valid hash meeting target is found */
typedef void (*uqt_on_solution_cb)(const char *job_id, uint32_t nonce, uint32_t ntime, void *user_data);

/* Worker Pool Configuration */
typedef struct {
    const char *algo_name;
    const char *backend_name;
    uint32_t num_workers;
    uint32_t cpu_limit_pct;          /* 1..100, default 100 */
    double thermal_limit_celsius;    /* Default 85.0 °C */
    bool prefer_performance_cores;
    bool enable_smt;
    bool enable_hugepages;
    const char *profile;             /* "performance" or "balanced" */
    uqt_on_solution_cb on_solution;
    void *solution_user_data;
} uqt_worker_pool_config_t;

/* Aggregated Metrics */
typedef struct {
    uint64_t total_hashes;
    uint64_t total_solutions;
    double current_hashrate_mhs;
    double avg_hashrate_mhs;
    double cpu_utilization_pct;
    double current_temperature_c;
    uint32_t active_workers;
    uint32_t paused_workers;
    uint64_t elapsed_ns;
} uqt_pool_metrics_t;

/* Worker Pool Engine */
typedef struct uqt_worker_pool_s {
    uqt_worker_pool_config_t config;
    const uqt_algo_t *algo;
    const uqt_algo_backend_t *backend;
    
    uint32_t worker_count;
    uqt_worker_t workers[UQT_MAX_WORKERS];
    
    uqt_job_t current_job;
    pthread_rwlock_t job_lock;
    
    _Atomic bool is_active;
    _Atomic bool is_throttled;
    uint64_t start_time_ns;
    
    /* Governor thread */
    pthread_t governor_thread;
    _Atomic bool governor_stop;
} uqt_worker_pool_t;

/* Pool Engine Lifecycle */
int uqt_worker_pool_create(uqt_worker_pool_t *pool, const uqt_worker_pool_config_t *config);
int uqt_worker_pool_start(uqt_worker_pool_t *pool);
int uqt_worker_pool_stop(uqt_worker_pool_t *pool);
void uqt_worker_pool_destroy(uqt_worker_pool_t *pool);

int uqt_worker_pool_pause(uqt_worker_pool_t *pool);
int uqt_worker_pool_resume(uqt_worker_pool_t *pool);
int uqt_worker_pool_submit_job(uqt_worker_pool_t *pool, const uqt_job_t *job);
int uqt_worker_pool_get_metrics(uqt_worker_pool_t *pool, uqt_pool_metrics_t *metrics);

/* Autotuner API */
int uqt_autotune_run(const char *algo_name, const char *profile, uqt_worker_pool_config_t *best_config);

#endif /* UQT_WORKER_H */
