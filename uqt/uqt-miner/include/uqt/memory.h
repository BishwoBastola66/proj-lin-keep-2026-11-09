#ifndef UQT_MEMORY_H
#define UQT_MEMORY_H

#include "uqt/types.h"

/* Memory Allocation Modes */
typedef enum {
    UQT_MEM_STANDARD = 0,
    UQT_MEM_THP,
    UQT_MEM_HUGEPAGE
} uqt_mem_mode_t;

/* Detailed memory allocation diagnostic report */
typedef struct {
    bool explicit_huge_capable;
    bool thp_capable;
    bool requested_huge;
    uqt_mem_mode_t attempted_mode;
    uqt_mem_mode_t allocated_mode;
    bool actually_huge_backed;
    char fallback_reason[128];
    size_t page_size;
    size_t hugepage_size;
} uqt_mem_diag_t;

/* Aligned allocations */
void *uqt_mem_alloc_aligned(size_t size, size_t alignment);
void uqt_mem_free_aligned(void *ptr);

/* Huge page allocations (falls back to THP or Standard) */
void *uqt_mem_alloc_huge(size_t size);
void uqt_mem_free_huge(void *ptr, size_t size);
int uqt_mem_prefault(void *ptr, size_t size);

/* Verify actual huge-page backing (via smaps or mincore) */
bool uqt_mem_verify_hugepage_backing(void *ptr, size_t size);

/* Returns the mode used by the most recent uqt_mem_alloc_huge call on this thread */
uqt_mem_mode_t uqt_mem_get_last_mode(void);
uqt_mem_diag_t uqt_mem_get_diagnostics(void);

/* NUMA API */
int uqt_numa_available(void);
int uqt_numa_node_count(void);
int uqt_numa_bind_memory(void *ptr, size_t size, int node);
int uqt_numa_bind_thread(int node);

/* Scratchpad API */
typedef struct {
    void *memory;
    size_t size;
    size_t alignment;
    int numa_node;
    bool hugepage_backed;
    bool allocated_via_huge;
} uqt_scratchpad_t;

int uqt_scratchpad_create(
    uqt_scratchpad_t *sp,
    size_t size,
    bool prefer_hugepages,
    int numa_node
);

void uqt_scratchpad_destroy(uqt_scratchpad_t *sp);

/* Prefetching Helpers */
UQT_INLINE void uqt_prefetch_read(const void *ptr) {
#if defined(__GNUC__) || defined(__clang__)
    __builtin_prefetch(ptr, 0, 3);
#elif defined(_MSC_VER) && (defined(_M_X64) || defined(_M_IX86))
    #include <mmintrin.h>
    _mm_prefetch((const char*)ptr, _MM_HINT_T0);
#else
    (void)ptr;
#endif
}

UQT_INLINE void uqt_prefetch_write(const void *ptr) {
#if defined(__GNUC__) || defined(__clang__)
    __builtin_prefetch(ptr, 1, 3);
#elif defined(_MSC_VER) && (defined(_M_X64) || defined(_M_IX86))
    #include <mmintrin.h>
    _mm_prefetch((const char*)ptr, _MM_HINT_T0);
#else
    (void)ptr;
#endif
}

/* Diagnostics */
void uqt_memory_print_info(void);

#endif /* UQT_MEMORY_H */
