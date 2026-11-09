#include "uqt/memory.h"
#include <stdio.h>

int main(void) {
    printf("Starting Memory test...\n");

    /* 1. Alignment tests */
    void *ptr64 = uqt_mem_alloc_aligned(1024, 64);
    if (!ptr64 || ((size_t)ptr64 % 64) != 0) {
        printf("ERROR: 64-byte alignment failed.\n");
        return 1;
    }
    uqt_mem_free_aligned(ptr64);

    void *ptr128 = uqt_mem_alloc_aligned(1024, 128);
    if (!ptr128 || ((size_t)ptr128 % 128) != 0) {
        printf("ERROR: 128-byte alignment failed.\n");
        return 1;
    }
    uqt_mem_free_aligned(ptr128);

    /* 2. Huge pages allocation test */
    size_t huge_size = 2 * 1024 * 1024; /* 2 MiB */
    void *huge_ptr = uqt_mem_alloc_huge(huge_size);
    if (!huge_ptr) {
        printf("ERROR: Huge allocation failed completely (no fallback).\n");
        return 1;
    }
    
    uqt_mem_mode_t mode = uqt_mem_get_last_mode();
    printf("Allocated 2 MiB, mode: %d\n", mode);
    
    if (uqt_mem_prefault(huge_ptr, huge_size) != UQT_SUCCESS) {
        printf("ERROR: Prefault failed.\n");
        return 1;
    }

    /* Prefetch test (compile + run, no crash expected) */
    uqt_prefetch_read(huge_ptr);
    uqt_prefetch_write(huge_ptr);

    uqt_mem_free_huge(huge_ptr, huge_size);

    /* 3. Scratchpad test */
    uqt_scratchpad_t sp;
    if (uqt_scratchpad_create(&sp, 1024 * 1024, true, -1) != UQT_SUCCESS) {
        printf("ERROR: Scratchpad creation failed.\n");
        return 1;
    }
    
    if (!sp.memory || sp.size != 1024 * 1024) {
        printf("ERROR: Scratchpad invalid state.\n");
        return 1;
    }

    uqt_scratchpad_destroy(&sp);
    if (sp.memory != NULL || sp.size != 0) {
        printf("ERROR: Scratchpad not zeroed on destroy.\n");
        return 1;
    }

    /* 4. NUMA APIs */
    int numa_avail = uqt_numa_available();
    int numa_nodes = uqt_numa_node_count();
    printf("NUMA Available: %d, Nodes: %d\n", numa_avail, numa_nodes);

    if (numa_nodes <= 0) {
        printf("ERROR: Invalid NUMA node count.\n");
        return 1;
    }

    printf("Memory test passed.\n");
    return 0;
}
