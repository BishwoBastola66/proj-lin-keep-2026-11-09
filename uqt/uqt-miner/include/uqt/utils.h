#ifndef UQT_UTILS_H
#define UQT_UTILS_H

#include "uqt/types.h"
#include <stdarg.h>

/* Logging Levels */
typedef enum {
    UQT_LOG_DEBUG = 0,
    UQT_LOG_INFO,
    UQT_LOG_WARN,
    UQT_LOG_ERROR
} uqt_log_level_t;

/* Logger setup and usage */
void uqt_log_init(uqt_log_level_t min_level);
void uqt_log(uqt_log_level_t level, const char *fmt, ...);

/* Timing utilities */
/* Returns high resolution monotonic time in nanoseconds */
uint64_t uqt_timer_now_ns(void);

/* Returns a CPU cycle counter if available, otherwise 0 */
uint64_t uqt_timer_rdtsc(void);

/* Sleeps for a specified number of milliseconds */
void uqt_sleep_ms(uint32_t ms);

#endif /* UQT_UTILS_H */
