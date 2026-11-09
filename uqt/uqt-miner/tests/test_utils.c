#include "uqt/types.h"
#include "uqt/utils.h"
#include <stdio.h>

int main(void) {
    uqt_log_init(UQT_LOG_DEBUG);
    uqt_log(UQT_LOG_INFO, "Starting UtilsTest");

    uint64_t t1 = uqt_timer_now_ns();
    uint64_t c1 = uqt_timer_rdtsc();
    
    uqt_sleep_ms(50);
    
    uint64_t t2 = uqt_timer_now_ns();
    uint64_t c2 = uqt_timer_rdtsc();

    uint64_t elapsed_ns = t2 - t1;
    
    uqt_log(UQT_LOG_DEBUG, "50ms sleep took %llu ns", (unsigned long long)elapsed_ns);
    uqt_log(UQT_LOG_DEBUG, "Cycles elapsed: %llu", (unsigned long long)(c2 - c1));

    if (elapsed_ns < 40000000ULL || elapsed_ns > 100000000ULL) {
        uqt_log(UQT_LOG_ERROR, "Timer test failed: elapsed_ns out of expected bounds");
        return -1;
    }

    uqt_log(UQT_LOG_INFO, "UtilsTest passed.");
    return 0;
}
