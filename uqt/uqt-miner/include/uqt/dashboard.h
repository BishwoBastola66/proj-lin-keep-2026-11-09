#ifndef UQT_DASHBOARD_H
#define UQT_DASHBOARD_H

#include "uqt/types.h"
#include "uqt/worker.h"
#include "uqt/net.h"
#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const char *algo_name;
    const char *backend_name;
    const char *pool_url;
    const char *wallet;
    uint32_t num_workers;
    double pool_difficulty;
    uint64_t shares_accepted;
    uint64_t shares_rejected;
    uint64_t shares_invalid;
    uint64_t uptime_seconds;
    uint64_t last_share_time_ns;
    char last_job_id[64];
    double last_latency_ms;
    bool is_paused;
} uqt_dashboard_stats_t;

/* Interactive Terminal & Dashboard Lifecycle */
int uqt_dashboard_init(void);
void uqt_dashboard_cleanup(void);
int uqt_dashboard_read_key(void);

/* Rendering & Interactive Commands */
void uqt_dashboard_render(const uqt_dashboard_stats_t *stats, const uqt_pool_metrics_t *metrics);
void uqt_dashboard_show_hashrate(const uqt_worker_pool_t *pool, const uqt_dashboard_stats_t *stats);
void uqt_dashboard_show_shares(const uqt_dashboard_stats_t *stats);
void uqt_dashboard_show_connection(const uqt_stratum_client_t *stratum, const uqt_dashboard_stats_t *stats);
void uqt_dashboard_show_environment(const uqt_worker_pool_t *pool);
void uqt_dashboard_show_help(void);

#ifdef __cplusplus
}
#endif

#endif /* UQT_DASHBOARD_H */
