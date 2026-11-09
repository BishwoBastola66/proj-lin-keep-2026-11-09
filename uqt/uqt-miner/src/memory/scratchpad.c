#include "uqt/memory.h"
#include <string.h>

int uqt_scratchpad_create(uqt_scratchpad_t *sp, size_t size, bool prefer_hugepages, int numa_node) {
    if (!sp || size == 0) return UQT_ERR_INVAL;

    memset(sp, 0, sizeof(*sp));
    sp->size = size;
    sp->alignment = UQT_CACHE_LINE_SIZE;
    sp->numa_node = numa_node;

    if (prefer_hugepages) {
        sp->memory = uqt_mem_alloc_huge(size);
        sp->hugepage_backed = (uqt_mem_get_last_mode() != UQT_MEM_STANDARD);
        sp->allocated_via_huge = true;
    } else {
        sp->memory = uqt_mem_alloc_aligned(size, sp->alignment);
        sp->hugepage_backed = false;
        sp->allocated_via_huge = false;
    }

    if (!sp->memory) return UQT_ERR_NOMEM;

    /* NUMA binding if requested and available */
    if (numa_node >= 0 && uqt_numa_available()) {
        uqt_numa_bind_memory(sp->memory, size, numa_node);
    }

    /* Prefault to ensure memory is actually backed by physical RAM and not copy-on-write zero page */
    uqt_mem_prefault(sp->memory, size);

    return UQT_SUCCESS;
}

void uqt_scratchpad_destroy(uqt_scratchpad_t *sp) {
    if (!sp || !sp->memory) return;

    if (sp->allocated_via_huge) {
        uqt_mem_free_huge(sp->memory, sp->size);
    } else {
        uqt_mem_free_aligned(sp->memory);
    }
    
    memset(sp, 0, sizeof(*sp));
}
