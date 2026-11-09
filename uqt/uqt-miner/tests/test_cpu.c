#include "uqt/cpu.h"
#include <stdio.h>
#include <string.h>

int main(void) {
    printf("Starting CPU detection test...\n");
    
    if (uqt_cpu_detect() != UQT_SUCCESS) {
        printf("ERROR: uqt_cpu_detect failed.\n");
        return 1;
    }

    if (g_uqt_cpu_info.logical_cpus == 0) {
        printf("ERROR: Logical CPUs is zero.\n");
        return 1;
    }

    if (g_uqt_cpu_info.physical_cores == 0) {
        printf("ERROR: Physical cores is zero.\n");
        return 1;
    }

    if (g_uqt_cpu_info.threads_per_core == 0) {
        printf("ERROR: Threads per core is zero.\n");
        return 1;
    }
    
    /* Ensure internal consistency */
    if (g_uqt_cpu_info.logical_cpus < g_uqt_cpu_info.physical_cores) {
        printf("ERROR: logical_cpus (%u) < physical_cores (%u)\n", 
            g_uqt_cpu_info.logical_cpus, g_uqt_cpu_info.physical_cores);
        return 1;
    }

    if (g_uqt_cpu_info.cache_line_size == 0 || g_uqt_cpu_info.cache_line_size > 512) {
        printf("ERROR: Cache line size out of reasonable bounds (%u).\n", g_uqt_cpu_info.cache_line_size);
        return 1;
    }

    /* Print a small summary */
    printf("Architecture: %s\n", g_uqt_cpu_info.architecture);
    printf("Logical: %u\n", g_uqt_cpu_info.logical_cpus);
    printf("Physical: %u\n", g_uqt_cpu_info.physical_cores);
    
    /* Test has_feature macro */
    bool has_sse2 = uqt_cpu_has_feature(UQT_CPU_FEAT_SSE2);
    printf("SSE2 Support: %s\n", has_sse2 ? "Yes" : "No");

    printf("CPU test passed.\n");
    return 0;
}
