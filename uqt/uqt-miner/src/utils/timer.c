#include "uqt/utils.h"

#if defined(UQT_OS_WINDOWS)
#include <windows.h>
#elif defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
#include <time.h>
#include <unistd.h>
#if defined(__x86_64__) || defined(__i386__)
#include <x86intrin.h>
#endif
#endif

uint64_t uqt_timer_now_ns(void) {
#if defined(UQT_OS_WINDOWS)
    LARGE_INTEGER freq, count;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&count);
    return (uint64_t)((count.QuadPart * 1000000000ULL) / freq.QuadPart);
#elif defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + (uint64_t)ts.tv_nsec;
#else
    return 0;
#endif
}

uint64_t uqt_timer_rdtsc(void) {
#if (defined(__x86_64__) || defined(__i386__)) && (defined(__GNUC__) || defined(__clang__))
    return __rdtsc();
#elif defined(_MSC_VER) && (defined(_M_X64) || defined(_M_IX86))
    return __rdtsc();
#elif defined(__aarch64__)
    uint64_t val;
    __asm__ volatile("mrs %0, cntvct_el0" : "=r" (val));
    return val;
#else
    return 0;
#endif
}

void uqt_sleep_ms(uint32_t ms) {
#if defined(UQT_OS_WINDOWS)
    Sleep(ms);
#elif defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    struct timespec ts;
    ts.tv_sec = ms / 1000;
    ts.tv_nsec = (ms % 1000) * 1000000ULL;
    nanosleep(&ts, NULL);
#endif
}
