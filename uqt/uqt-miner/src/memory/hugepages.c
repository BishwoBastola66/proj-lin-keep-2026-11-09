#include "uqt/memory.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
#include <sys/mman.h>
#include <unistd.h>
#ifndef MAP_ANONYMOUS
#define MAP_ANONYMOUS MAP_ANON
#endif
#elif defined(UQT_OS_WINDOWS)
#include <windows.h>
#include <malloc.h>
#endif

/* Thread-local storage for last mode and diagnostics */
static _Thread_local uqt_mem_mode_t tls_last_mode = UQT_MEM_STANDARD;
static _Thread_local char tls_last_fallback[128] = "None (Standard Page Allocation)";

uqt_mem_mode_t uqt_mem_get_last_mode(void) {
    return tls_last_mode;
}

void *uqt_mem_alloc_aligned(size_t size, size_t alignment) {
    if (size == 0) return NULL;
    if (alignment < sizeof(void*)) alignment = sizeof(void*);
    if ((alignment & (alignment - 1)) != 0) return NULL;

#if defined(UQT_OS_WINDOWS)
    return _aligned_malloc(size, alignment);
#elif defined(_ISOC11_SOURCE) || (defined(__STDC_VERSION__) && __STDC_VERSION__ >= 201112L)
    size_t rounded_size = (size + alignment - 1) & ~(alignment - 1);
    return aligned_alloc(alignment, rounded_size);
#elif defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    void *ptr = NULL;
    if (posix_memalign(&ptr, alignment, size) != 0) {
        return NULL;
    }
    return ptr;
#else
    void *ptr = malloc(size + alignment + sizeof(void*));
    if (!ptr) return NULL;
    size_t offset = alignment - ((size_t)ptr + sizeof(void*)) % alignment;
    void *aligned_ptr = (void*)((char*)ptr + sizeof(void*) + offset);
    ((void**)aligned_ptr)[-1] = ptr;
    return aligned_ptr;
#endif
}

void uqt_mem_free_aligned(void *ptr) {
    if (!ptr) return;
#if defined(UQT_OS_WINDOWS)
    _aligned_free(ptr);
#elif defined(_ISOC11_SOURCE) || (defined(__STDC_VERSION__) && __STDC_VERSION__ >= 201112L) || defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    free(ptr);
#else
    free(((void**)ptr)[-1]);
#endif
}

bool uqt_mem_verify_hugepage_backing(void *ptr, size_t size) {
    if (!ptr || size == 0) return false;

#if defined(UQT_OS_LINUX)
    FILE *f = fopen("/proc/self/smaps", "r");
    if (!f) return false;

    uintptr_t target_addr = (uintptr_t)ptr;
    char line[256];
    bool in_target_vma = false;
    bool has_huge = false;

    while (fgets(line, sizeof(line), f)) {
        uintptr_t start = 0, end = 0;
        if (sscanf(line, "%lx-%lx", &start, &end) == 2) {
            in_target_vma = (target_addr >= start && target_addr < end);
            continue;
        }

        if (in_target_vma) {
            if (strncmp(line, "KernelPageSize:", 15) == 0) {
                long kps = 0;
                if (sscanf(line + 15, "%ld", &kps) == 1 && kps >= 2048) {
                    has_huge = true;
                    break;
                }
            } else if (strncmp(line, "AnonHugePages:", 14) == 0) {
                long ahp = 0;
                if (sscanf(line + 14, "%ld", &ahp) == 1 && ahp > 0) {
                    has_huge = true;
                    break;
                }
            }
        }
    }
    fclose(f);
    return has_huge;
#else
    return (tls_last_mode == UQT_MEM_HUGEPAGE);
#endif
}

void *uqt_mem_alloc_huge(size_t size) {
    if (size == 0) return NULL;

    void *ptr = NULL;
    tls_last_mode = UQT_MEM_STANDARD;
    snprintf(tls_last_fallback, sizeof(tls_last_fallback), "None (Success)");

#if defined(UQT_OS_LINUX)
#ifndef MAP_HUGETLB
#define MAP_HUGETLB 0x40000
#endif
    /* 1. Try Explicit Huge Pages (MAP_HUGETLB) */
    ptr = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB, -1, 0);
    if (ptr != MAP_FAILED && ptr != NULL) {
        tls_last_mode = UQT_MEM_HUGEPAGE;
        return ptr;
    }

    /* 2. Try THP via madvise */
    ptr = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (ptr != MAP_FAILED && ptr != NULL) {
#ifndef MADV_HUGEPAGE
#define MADV_HUGEPAGE 14
#endif
        if (madvise(ptr, size, MADV_HUGEPAGE) == 0) {
            tls_last_mode = UQT_MEM_THP;
            snprintf(tls_last_fallback, sizeof(tls_last_fallback), "Explicit huge pages unavailable (THP hint applied)");
        } else {
            tls_last_mode = UQT_MEM_STANDARD;
            snprintf(tls_last_fallback, sizeof(tls_last_fallback), "Explicit huge pages & THP hint unavailable (Standard Pages)");
        }
        return ptr;
    }
    ptr = NULL;
#elif defined(UQT_OS_WINDOWS)
    size_t large_page_minimum = GetLargePageMinimum();
    if (large_page_minimum > 0) {
        size_t rounded_size = (size + large_page_minimum - 1) & ~(large_page_minimum - 1);
        ptr = VirtualAlloc(NULL, rounded_size, MEM_COMMIT | MEM_RESERVE | MEM_LARGE_PAGES, PAGE_READWRITE);
        if (ptr) {
            tls_last_mode = UQT_MEM_HUGEPAGE;
            return ptr;
        }
    }
    snprintf(tls_last_fallback, sizeof(tls_last_fallback), "MEM_LARGE_PAGES unavailable or privilege missing");
#endif

    /* 3. Fallback to standard page-aligned memory */
#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    ptr = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (ptr != MAP_FAILED && ptr != NULL) {
        tls_last_mode = UQT_MEM_STANDARD;
        snprintf(tls_last_fallback, sizeof(tls_last_fallback), "Standard mmap fallback");
        return ptr;
    }
#elif defined(UQT_OS_WINDOWS)
    ptr = VirtualAlloc(NULL, size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (ptr) {
        tls_last_mode = UQT_MEM_STANDARD;
        return ptr;
    }
#endif

    /* 4. Absolute fallback */
    size_t page_size = 4096;
#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    page_size = (size_t)sysconf(_SC_PAGESIZE);
#endif
    ptr = uqt_mem_alloc_aligned(size, page_size);
    tls_last_mode = UQT_MEM_STANDARD;
    snprintf(tls_last_fallback, sizeof(tls_last_fallback), "posix_memalign / aligned_alloc fallback");
    return ptr;
}

void uqt_mem_free_huge(void *ptr, size_t size) {
    if (!ptr) return;
#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    munmap(ptr, size);
#elif defined(UQT_OS_WINDOWS)
    VirtualFree(ptr, 0, MEM_RELEASE);
#else
    uqt_mem_free_aligned(ptr);
#endif
}

int uqt_mem_prefault(void *ptr, size_t size) {
    if (!ptr || size == 0) return UQT_ERR_INVAL;

    volatile uint8_t *p = (volatile uint8_t *)ptr;
    size_t page_size = 4096;
#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    page_size = (size_t)sysconf(_SC_PAGESIZE);
#endif

    for (size_t i = 0; i < size; i += page_size) {
        p[i] = 0;
    }
    p[size - 1] = 0;

    return UQT_SUCCESS;
}

uqt_mem_diag_t uqt_mem_get_diagnostics(void) {
    uqt_mem_diag_t diag;
    memset(&diag, 0, sizeof(diag));

    diag.page_size = 4096;
#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
    diag.page_size = (size_t)sysconf(_SC_PAGESIZE);
#endif
    diag.hugepage_size = 2 * 1024 * 1024; /* 2MB default */

    /* Check explicit hugepage capability via a probe allocation */
    void *probe = uqt_mem_alloc_huge(diag.hugepage_size);
    diag.requested_huge = true;
    diag.attempted_mode = UQT_MEM_HUGEPAGE;
    diag.allocated_mode = uqt_mem_get_last_mode();

    if (probe) {
        uqt_mem_prefault(probe, diag.hugepage_size);
        diag.actually_huge_backed = uqt_mem_verify_hugepage_backing(probe, diag.hugepage_size);
        diag.explicit_huge_capable = (diag.allocated_mode == UQT_MEM_HUGEPAGE);
        diag.thp_capable = (diag.allocated_mode == UQT_MEM_THP || diag.allocated_mode == UQT_MEM_HUGEPAGE);
        strncpy(diag.fallback_reason, tls_last_fallback, sizeof(diag.fallback_reason) - 1);
        uqt_mem_free_huge(probe, diag.hugepage_size);
    } else {
        snprintf(diag.fallback_reason, sizeof(diag.fallback_reason), "Memory allocation failed");
    }

    return diag;
}

void uqt_memory_print_info(void) {
    uqt_mem_diag_t diag = uqt_mem_get_diagnostics();

    printf("Memory Subsystem & Diagnostics\n");
    printf("  Standard Page Size:     %zu B\n", diag.page_size);
    printf("  Huge-Page Size:         %zu B (%.1f MB)\n", diag.hugepage_size, diag.hugepage_size / (1024.0 * 1024.0));
    printf("  Explicit Huge Pages:    %s\n", diag.explicit_huge_capable ? "Available" : "Unavailable");
    printf("  THP Hint Capability:    %s\n", diag.thp_capable ? "Supported" : "Unsupported");
    
    printf("\n  Sample Probe Allocation (2 MB):\n");
    printf("    Requested Mode:       Huge Pages (2 MB)\n");
    const char *mode_str = "Standard Pages";
    if (diag.allocated_mode == UQT_MEM_HUGEPAGE) mode_str = "Explicit Huge Pages (MAP_HUGETLB)";
    else if (diag.allocated_mode == UQT_MEM_THP) mode_str = "Standard Pages + THP Hint (MADV_HUGEPAGE)";
    printf("    Allocated Mode:       %s\n", mode_str);
    printf("    Actually Huge Backed: %s\n", diag.actually_huge_backed ? "Yes" : "No (Standard 4KB / THP pending)");
    printf("    Diagnostic / Status:  %s\n", diag.fallback_reason);
    printf("\n");
}
