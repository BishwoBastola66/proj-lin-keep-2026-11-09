#ifndef UQT_CPU_H
#define UQT_CPU_H

#include "uqt/types.h"

#define UQT_MAX_CPUS 256

/* CPU Features bitmask */
typedef enum {
    UQT_CPU_FEAT_SSE        = (1ULL << 0),
    UQT_CPU_FEAT_SSE2       = (1ULL << 1),
    UQT_CPU_FEAT_SSE41      = (1ULL << 2),
    UQT_CPU_FEAT_SSE42      = (1ULL << 3),
    UQT_CPU_FEAT_AVX        = (1ULL << 4),
    UQT_CPU_FEAT_AVX2       = (1ULL << 5),
    UQT_CPU_FEAT_AVX512F    = (1ULL << 6),
    UQT_CPU_FEAT_AESNI      = (1ULL << 7),
    UQT_CPU_FEAT_SHANI      = (1ULL << 8),
    UQT_CPU_FEAT_FMA        = (1ULL << 9),
    UQT_CPU_FEAT_NEON       = (1ULL << 10),
    UQT_CPU_FEAT_ARM_CRYPTO = (1ULL << 11),
    UQT_CPU_FEAT_SVE        = (1ULL << 12)
} uqt_cpu_feature_t;

/* Core classification for heterogeneous architectures (e.g. Intel Hybrid, ARM big.LITTLE) */
typedef enum {
    UQT_CORE_TYPE_UNKNOWN = 0,
    UQT_CORE_TYPE_PERFORMANCE, /* P-Core / Big core */
    UQT_CORE_TYPE_EFFICIENCY   /* E-Core / LITTLE core */
} uqt_core_type_t;

/* Per-logical-CPU topology descriptor */
typedef struct {
    uint32_t cpu_id;
    uint32_t physical_core_id;
    uint32_t package_id;
    uint32_t numa_node;
    uqt_core_type_t core_type;
    bool is_smt_sibling;
    uint32_t max_freq_khz;
    uint32_t cpu_capacity;
} uqt_cpu_core_info_t;

/* System CPU Topology and Feature Info */
typedef struct {
    char vendor[13];
    char brand[65];
    char architecture[32];
    
    uint64_t features;

    /* Topology */
    uint32_t logical_cpus;
    uint32_t physical_cores;
    uint32_t threads_per_core;
    uint32_t numa_nodes;
    
    /* Heterogeneous Core Counts */
    bool is_heterogeneous;
    uint32_t p_core_count;
    uint32_t e_core_count;

    /* Per-CPU table */
    uqt_cpu_core_info_t cores[UQT_MAX_CPUS];

    /* Cache Hierarchy (in bytes) */
    uint32_t cache_line_size;
    uint32_t cache_l1d;
    uint32_t cache_l1i;
    uint32_t cache_l2;
    uint32_t cache_l3;
} uqt_cpu_info_t;

/* Global access to current CPU info (cached after uqt_cpu_detect) */
extern uqt_cpu_info_t g_uqt_cpu_info;

/* Initializes CPU detection and caches the result. Returns UQT_SUCCESS on success. */
int uqt_cpu_detect(void);

/* Check for a specific feature from the cached info */
UQT_INLINE bool uqt_cpu_has_feature(uqt_cpu_feature_t feat) {
    return (g_uqt_cpu_info.features & feat) != 0;
}

/* Thread affinity */
int uqt_cpu_set_thread_affinity(uint32_t cpu_id);
int uqt_cpu_get_thread_affinity(uint32_t *cpu_id);

/* Thermal monitoring */
int uqt_cpu_get_temperature(double *temp_celsius);

/* Diagnostics */
void uqt_cpu_print_info(void);
void uqt_system_print_info(void);

#endif /* UQT_CPU_H */
