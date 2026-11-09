#include "uqt/cpu.h"
#include "uqt/memory.h"
#include "uqt/algo.h"
#include "uqt/utils.h"
#include <string.h>
#include <stdio.h>

#if defined(__x86_64__) || defined(__i386__) || defined(_M_X64) || defined(_M_IX86)
#if defined(_MSC_VER)
#include <intrin.h>
#else
#include <cpuid.h>
#endif
#endif

/* Global instance */
uqt_cpu_info_t g_uqt_cpu_info;

/* External declaration for topology detection function */
extern void uqt_cpu_detect_topology(uqt_cpu_info_t *info);

#if defined(__x86_64__) || defined(__i386__) || defined(_M_X64) || defined(_M_IX86)

static void cpuid(uint32_t eax, uint32_t ecx, uint32_t *abcd) {
#if defined(_MSC_VER)
    __cpuidex((int*)abcd, eax, ecx);
#else
    __cpuid_count(eax, ecx, abcd[0], abcd[1], abcd[2], abcd[3]);
#endif
}

static uint64_t xgetbv(uint32_t xcr) {
#if defined(_MSC_VER)
    return _xgetbv(xcr);
#else
    uint32_t eax, edx;
    __asm__ volatile ("xgetbv" : "=a" (eax), "=d" (edx) : "c" (xcr));
    return ((uint64_t)edx << 32) | eax;
#endif
}

static void detect_x86_features(uqt_cpu_info_t *info) {
    uint32_t abcd[4] = {0};
    cpuid(0, 0, abcd);
    uint32_t max_leaf = abcd[0];

    /* Vendor */
    memcpy(info->vendor + 0, &abcd[1], 4); /* EBX */
    memcpy(info->vendor + 4, &abcd[3], 4); /* EDX */
    memcpy(info->vendor + 8, &abcd[2], 4); /* ECX */
    info->vendor[12] = '\0';

    if (max_leaf >= 1) {
        cpuid(1, 0, abcd);
        uint32_t ecx = abcd[2];
        uint32_t edx = abcd[3];

        if (edx & (1 << 25)) info->features |= UQT_CPU_FEAT_SSE;
        if (edx & (1 << 26)) info->features |= UQT_CPU_FEAT_SSE2;
        if (ecx & (1 << 19)) info->features |= UQT_CPU_FEAT_SSE41;
        if (ecx & (1 << 20)) info->features |= UQT_CPU_FEAT_SSE42;
        if (ecx & (1 << 25)) info->features |= UQT_CPU_FEAT_AESNI;
        if (ecx & (1 << 12)) info->features |= UQT_CPU_FEAT_FMA;

        /* AVX OS check */
        bool os_uses_xsave = (ecx & (1 << 27)) != 0;
        bool cpu_has_avx = (ecx & (1 << 28)) != 0;
        
        if (os_uses_xsave && cpu_has_avx) {
            uint64_t xcr0 = xgetbv(0);
            if ((xcr0 & 6) == 6) {
                info->features |= UQT_CPU_FEAT_AVX;
            }
        }
    }

    if (max_leaf >= 7) {
        cpuid(7, 0, abcd);
        uint32_t ebx = abcd[1];
        
        /* AVX2 requires AVX */
        if ((info->features & UQT_CPU_FEAT_AVX) && (ebx & (1 << 5))) {
            info->features |= UQT_CPU_FEAT_AVX2;
        }

        /* SHA-NI */
        if (ebx & (1 << 29)) {
            info->features |= UQT_CPU_FEAT_SHANI;
        }

        /* AVX-512 F */
        if ((info->features & UQT_CPU_FEAT_AVX) && (ebx & (1 << 16))) {
            uint64_t xcr0 = xgetbv(0);
            if ((xcr0 & 0xE6) == 0xE6) {
                info->features |= UQT_CPU_FEAT_AVX512F;
            }
        }
    }

    /* Brand String */
    cpuid(0x80000000, 0, abcd);
    uint32_t max_ext_leaf = abcd[0];
    if (max_ext_leaf >= 0x80000004) {
        cpuid(0x80000002, 0, abcd); memcpy(info->brand + 0, abcd, 16);
        cpuid(0x80000003, 0, abcd); memcpy(info->brand + 16, abcd, 16);
        cpuid(0x80000004, 0, abcd); memcpy(info->brand + 32, abcd, 16);
        info->brand[48] = '\0';
    }
}
#elif defined(__aarch64__) || defined(__arm__)
#if defined(UQT_OS_LINUX)
#include <sys/auxv.h>
#include <asm/hwcap.h>
#endif

static void detect_arm_features(uqt_cpu_info_t *info) {
    strncpy(info->vendor, "ARM", sizeof(info->vendor) - 1);
    
#if defined(UQT_OS_LINUX)
    unsigned long hwcap = getauxval(AT_HWCAP);
#if defined(HWCAP_ASIMD)
    if (hwcap & HWCAP_ASIMD) info->features |= UQT_CPU_FEAT_NEON;
#endif
#if defined(HWCAP_SHA2)
    if (hwcap & HWCAP_SHA2) info->features |= UQT_CPU_FEAT_ARM_CRYPTO;
#endif
#if defined(HWCAP_SVE)
    if (hwcap & HWCAP_SVE) info->features |= UQT_CPU_FEAT_SVE;
#endif
#endif
}
#endif

int uqt_cpu_detect(void) {
    memset(&g_uqt_cpu_info, 0, sizeof(g_uqt_cpu_info));
    g_uqt_cpu_info.cache_line_size = UQT_CACHE_LINE_SIZE;

#if defined(__x86_64__)
    strncpy(g_uqt_cpu_info.architecture, "x86_64", sizeof(g_uqt_cpu_info.architecture) - 1);
    detect_x86_features(&g_uqt_cpu_info);
#elif defined(__i386__) || defined(_M_IX86)
    strncpy(g_uqt_cpu_info.architecture, "x86", sizeof(g_uqt_cpu_info.architecture) - 1);
    detect_x86_features(&g_uqt_cpu_info);
#elif defined(__aarch64__)
    strncpy(g_uqt_cpu_info.architecture, "aarch64", sizeof(g_uqt_cpu_info.architecture) - 1);
    detect_arm_features(&g_uqt_cpu_info);
#elif defined(__arm__)
    strncpy(g_uqt_cpu_info.architecture, "arm", sizeof(g_uqt_cpu_info.architecture) - 1);
    detect_arm_features(&g_uqt_cpu_info);
#else
    strncpy(g_uqt_cpu_info.architecture, "unknown", sizeof(g_uqt_cpu_info.architecture) - 1);
#endif

    uqt_cpu_detect_topology(&g_uqt_cpu_info);
    return UQT_SUCCESS;
}

void uqt_cpu_print_info(void) {
    printf("CPU\n");
    printf("  Vendor: %s\n", g_uqt_cpu_info.vendor[0] ? g_uqt_cpu_info.vendor : "Unknown");
    printf("  Model: %s\n", g_uqt_cpu_info.brand[0] ? g_uqt_cpu_info.brand : "Unknown");
    printf("  Architecture: %s\n", g_uqt_cpu_info.architecture);
    printf("\nTopology\n");
    printf("  Logical CPUs: %u\n", g_uqt_cpu_info.logical_cpus);
    printf("  Physical cores: %u\n", g_uqt_cpu_info.physical_cores);
    printf("  Threads/core: %u\n", g_uqt_cpu_info.threads_per_core);
    printf("  NUMA nodes: %u\n", g_uqt_cpu_info.numa_nodes);
    if (g_uqt_cpu_info.is_heterogeneous) {
        printf("  Heterogeneous Cores: Yes (P-Cores: %u, E-Cores: %u)\n",
               g_uqt_cpu_info.p_core_count, g_uqt_cpu_info.e_core_count);
    }
    printf("\nCache\n");
    printf("  Line: %u B\n", g_uqt_cpu_info.cache_line_size);
    printf("  L1D: %u KB\n", g_uqt_cpu_info.cache_l1d / 1024);
    printf("  L1I: %u KB\n", g_uqt_cpu_info.cache_l1i / 1024);
    printf("  L2: %u KB\n", g_uqt_cpu_info.cache_l2 / 1024);
    printf("  L3: %u KB\n", g_uqt_cpu_info.cache_l3 / 1024);
    
    printf("\nInstruction Sets\n");
    printf("  SSE2:    %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_SSE2) ? "yes" : "no");
    printf("  SSE4.1:  %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_SSE41) ? "yes" : "no");
    printf("  SSE4.2:  %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_SSE42) ? "yes" : "no");
    printf("  AVX:     %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_AVX) ? "yes" : "no");
    printf("  AVX2:    %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_AVX2) ? "yes" : "no");
    printf("  AVX512:  %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_AVX512F) ? "yes" : "no");
    printf("  AES-NI:  %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_AESNI) ? "yes" : "no");
    printf("  SHA-NI:  %s\n", uqt_cpu_has_feature(UQT_CPU_FEAT_SHANI) ? "yes" : "no");
    printf("\n");
}

void uqt_system_print_info(void) {
    printf("========================================================================================\n");
    printf("                        uqt-miner System Diagnostics\n");
    printf("========================================================================================\n\n");
    
    uqt_cpu_print_info();
    uqt_memory_print_info();

    printf("Algorithms and Backend Dispatch\n");
    for (size_t i = 0; i < uqt_algo_count(); i++) {
        const uqt_algo_t *algo = uqt_algo_get(i);
        const uqt_algo_backend_t *sel = uqt_algo_select_backend(algo);
        printf("  Algorithm: %-10s (Digest: %2zu B, Selected Backend: %s)\n",
               algo->name, algo->digest_size, sel ? sel->name : "none");
        for (size_t b = 0; b < algo->num_backends; b++) {
            const uqt_algo_backend_t *be = algo->backends[b];
            bool supported = true;
            if (be->required_features && ((g_uqt_cpu_info.features & be->required_features) != be->required_features)) {
                supported = false;
            }
            printf("    - %-10s [Width: %2zu] : %s\n",
                   be->name, be->batch_width, supported ? "supported" : "unavailable");
        }
    }
    printf("\n========================================================================================\n");
}
