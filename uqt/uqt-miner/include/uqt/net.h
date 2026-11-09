#ifndef UQT_NET_H
#define UQT_NET_H

#include "uqt/types.h"
#include "uqt/worker.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Stratum URL components */
typedef struct {
    char host[256];
    uint16_t port;
    bool is_tls;
} uqt_url_t;

/* Stratum Job Notification from Pool */
typedef struct {
    char job_id[128];
    uint8_t prevhash[32];
    uint8_t coinb1[1024];
    size_t coinb1_len;
    uint8_t coinb2[1024];
    size_t coinb2_len;
    uint8_t merkle_branches[32][32];
    size_t merkle_count;
    uint32_t version;
    uint32_t nbits;
    uint32_t ntime;
    bool clean_jobs;
} uqt_stratum_notify_t;

/* Stratum Client State */
typedef struct uqt_stratum_client uqt_stratum_client_t;

typedef void (*uqt_on_job_cb)(const uqt_job_t *job, bool clean_jobs, void *user_data);
typedef void (*uqt_on_share_result_cb)(uint64_t submit_id, bool accepted, const char *reason, void *user_data);
typedef void (*uqt_on_diff_cb)(double difficulty, void *user_data);

typedef struct {
    const char *url;
    const char *user;
    const char *pass;
    const char *algo;
    uqt_on_job_cb on_job;
    uqt_on_share_result_cb on_share_result;
    uqt_on_diff_cb on_diff;
    void *user_data;
} uqt_stratum_config_t;

struct uqt_stratum_client {
    uqt_stratum_config_t config;
    int socket_fd;
    bool connected;
    bool authorized;
    bool subscribed;
    uint64_t rpc_id;
    
    char extranonce1[64];
    size_t extranonce2_size;
    uint64_t extranonce2_counter;
    
    double current_difficulty;
    uint8_t target[32];
    
    char recv_buf[8192];
    size_t recv_pos;
};

/* Core Net API */
uqt_status_t uqt_url_parse(const char *url_str, uqt_url_t *out_url);
uqt_status_t uqt_stratum_create(uqt_stratum_client_t **client, const uqt_stratum_config_t *config);
uqt_status_t uqt_stratum_connect(uqt_stratum_client_t *client);
uqt_status_t uqt_stratum_process(uqt_stratum_client_t *client, int timeout_ms);
uqt_status_t uqt_stratum_submit_share(uqt_stratum_client_t *client, const char *job_id, uint32_t nonce, uint32_t ntime, const char *extranonce2);
void uqt_stratum_disconnect(uqt_stratum_client_t *client);
void uqt_stratum_destroy(uqt_stratum_client_t *client);

/* Target / Difficulty utilities */
void uqt_diff_to_target(double diff, uint8_t target_out[32]);
void uqt_target_to_diff(const uint8_t target[32], double *diff_out);

#ifdef __cplusplus
}
#endif

#endif /* UQT_NET_H */
