#include "uqt/worker.h"
#include "uqt/utils.h"
#include <string.h>

int uqt_job_create(uqt_job_t *job, const char *job_id, const uint8_t *header, size_t header_len, const uint8_t target[32], size_t nonce_offset) {
    if (!job || !header || header_len == 0 || !target) return UQT_ERR_INVAL;

    memset(job, 0, sizeof(*job));
    if (job_id) {
        strncpy(job->job_id, job_id, sizeof(job->job_id) - 1);
    }
    if (header_len > sizeof(job->header)) header_len = sizeof(job->header);

    memcpy(job->header, header, header_len);
    job->header_len = header_len;
    memcpy(job->target, target, 32);
    job->nonce_offset = nonce_offset;
    job->nonce_start = 0;
    job->nonce_count = UINT64_MAX;
    job->epoch = uqt_timer_now_ns();
    job->is_valid = true;

    return UQT_SUCCESS;
}

bool uqt_job_check_solution(const uint8_t hash[32], const uint8_t target[32]) {
    /* 1. Little-endian Proof-of-Work comparison (MSB at index 31 down to 0) */
    bool match_le = true;
    for (int i = 31; i >= 0; i--) {
        if (hash[i] < target[i]) { match_le = true; break; }
        if (hash[i] > target[i]) { match_le = false; break; }
    }
    if (match_le) return true;

    /* 2. Big-endian Proof-of-Work comparison (MSB at index 0 up to 31) */
    for (int i = 0; i < 32; i++) {
        if (hash[i] < target[i]) return true;
        if (hash[i] > target[i]) return false;
    }
    return true; /* Exact match */
}
