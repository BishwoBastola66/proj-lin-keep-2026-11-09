#ifndef UQT_TYPES_H
#define UQT_TYPES_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* Platform Detection */
#if defined(_WIN32)
    #define UQT_OS_WINDOWS 1
#elif defined(__APPLE__)
    #define UQT_OS_MACOS 1
#elif defined(__linux__)
    #define UQT_OS_LINUX 1
#else
    #define UQT_OS_UNKNOWN 1
#endif

/* Compiler hints and attributes */
#if defined(__GNUC__) || defined(__clang__)
    #define UQT_LIKELY(x)   __builtin_expect(!!(x), 1)
    #define UQT_UNLIKELY(x) __builtin_expect(!!(x), 0)
    #define UQT_INLINE      inline __attribute__((always_inline))
    #define UQT_NOINLINE    __attribute__((noinline))
    #define UQT_ALIGN(x)    __attribute__((aligned(x)))
    #define UQT_RESTRICT    __restrict__
#elif defined(_MSC_VER)
    #define UQT_LIKELY(x)   (x)
    #define UQT_UNLIKELY(x) (x)
    #define UQT_INLINE      __forceinline
    #define UQT_NOINLINE    __declspec(noinline)
    #define UQT_ALIGN(x)    __declspec(align(x))
    #define UQT_RESTRICT    __restrict
#else
    #define UQT_LIKELY(x)   (x)
    #define UQT_UNLIKELY(x) (x)
    #define UQT_INLINE      inline
    #define UQT_NOINLINE
    #define UQT_ALIGN(x)
    #define UQT_RESTRICT
#endif

/* Cache line size typical for modern architectures */
#define UQT_CACHE_LINE_SIZE 64
#define UQT_CACHE_ALIGN UQT_ALIGN(UQT_CACHE_LINE_SIZE)

/* Portable error codes */
typedef enum {
    UQT_SUCCESS = 0,
    UQT_ERR_NOMEM = -1,
    UQT_ERR_INVAL = -2,
    UQT_ERR_UNSUPPORTED = -3,
    UQT_ERR_SYSCALL = -4,
    UQT_ERR_NOT_FOUND = -5
} uqt_status_t;

#endif /* UQT_TYPES_H */
