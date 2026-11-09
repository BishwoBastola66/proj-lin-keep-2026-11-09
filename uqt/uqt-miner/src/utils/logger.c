#include "uqt/utils.h"
#include <stdio.h>
#include <time.h>
#include <stdarg.h>

static uqt_log_level_t g_min_level = UQT_LOG_INFO;

void uqt_log_init(uqt_log_level_t min_level) {
    g_min_level = min_level;
}

void uqt_log(uqt_log_level_t level, const char *fmt, ...) {
    if (level < g_min_level) {
        return;
    }

    /* Print timestamp */
    time_t now;
    time(&now);
    struct tm *tm_info = localtime(&now);
    char time_buf[24];
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);

    const char *level_str = "UNK";
    const char *color_code = "";
    const char *color_reset = "\033[0m";

    switch (level) {
        case UQT_LOG_DEBUG:
            level_str = "DBG";
            color_code = "\033[36m"; /* Cyan */
            break;
        case UQT_LOG_INFO:
            level_str = "INF";
            color_code = "\033[32m"; /* Green */
            break;
        case UQT_LOG_WARN:
            level_str = "WRN";
            color_code = "\033[33m"; /* Yellow */
            break;
        case UQT_LOG_ERROR:
            level_str = "ERR";
            color_code = "\033[31m"; /* Red */
            break;
    }

    fprintf(stdout, "[%s] %s[%s]%s ", time_buf, color_code, level_str, color_reset);

    va_list args;
    va_start(args, fmt);
    vfprintf(stdout, fmt, args);
    va_end(args);

    fprintf(stdout, "\n");
    fflush(stdout);
}
