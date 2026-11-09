#define _GNU_SOURCE
#include "uqt/cpu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#if defined(UQT_OS_LINUX)
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <sched.h>
#include <pthread.h>

static long read_sysfs_long(const char *path, long def_val) {
    FILE *f = fopen(path, "r");
    if (!f) return def_val;
    long val = def_val;
    if (fscanf(f, "%ld", &val) != 1) {
        val = def_val;
    }
    fclose(f);
    return val;
}

static uint32_t count_sysfs_dirs(const char *path, const char *prefix) {
    DIR *dir = opendir(path);
    if (!dir) return 0;
    struct dirent *ent;
    uint32_t count = 0;
    size_t prefix_len = strlen(prefix);
    while ((ent = readdir(dir)) != NULL) {
        if (strncmp(ent->d_name, prefix, prefix_len) == 0) {
            count++;
        }
    }
    closedir(dir);
    return count;
}

static void detect_linux_topology(uqt_cpu_info_t *info) {
    long num_procs = sysconf(_SC_NPROCESSORS_ONLN);
    if (num_procs > 0) {
        info->logical_cpus = (uint32_t)(num_procs > UQT_MAX_CPUS ? UQT_MAX_CPUS : num_procs);
    } else {
        info->logical_cpus = 1;
    }

    /* Cache info from cpu0 */
    char path[256];
    for (int index = 0; index < 4; index++) {
        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu0/cache/index%d/level", index);
        long level = read_sysfs_long(path, 0);
        if (level == 0) continue;

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu0/cache/index%d/type", index);
        FILE *f = fopen(path, "r");
        char type_str[32] = {0};
        if (f) {
            if (fscanf(f, "%31s", type_str) != 1) type_str[0] = '\0';
            fclose(f);
        }

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu0/cache/index%d/size", index);
        long size_kb = 0;
        f = fopen(path, "r");
        if (f) {
            char size_str[32];
            if (fscanf(f, "%31s", size_str) == 1) {
                size_t len = strlen(size_str);
                if (len > 1 && (size_str[len-1] == 'K' || size_str[len-1] == 'k')) {
                    size_str[len-1] = '\0';
                }
                size_kb = strtol(size_str, NULL, 10);
            }
            fclose(f);
        }

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu0/cache/index%d/coherency_line_size", index);
        long line_size = read_sysfs_long(path, UQT_CACHE_LINE_SIZE);
        info->cache_line_size = (uint32_t)line_size;

        if (level == 1 && strcasecmp(type_str, "Data") == 0) {
            info->cache_l1d = (uint32_t)(size_kb * 1024);
        } else if (level == 1 && strcasecmp(type_str, "Instruction") == 0) {
            info->cache_l1i = (uint32_t)(size_kb * 1024);
        } else if (level == 2) {
            info->cache_l2 = (uint32_t)(size_kb * 1024);
        } else if (level == 3) {
            info->cache_l3 = (uint32_t)(size_kb * 1024);
        }
    }

    info->numa_nodes = count_sysfs_dirs("/sys/devices/system/node", "node");
    if (info->numa_nodes == 0) info->numa_nodes = 1;

    /* Per-CPU topology details & Heterogeneous classification */
    uint32_t max_freq_global = 0;
    uint32_t min_freq_global = UINT32_MAX;

    for (uint32_t i = 0; i < info->logical_cpus; i++) {
        uqt_cpu_core_info_t *core = &info->cores[i];
        core->cpu_id = i;

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu%u/topology/core_id", i);
        core->physical_core_id = (uint32_t)read_sysfs_long(path, (long)i);

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu%u/topology/physical_package_id", i);
        core->package_id = (uint32_t)read_sysfs_long(path, 0);

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu%u/cpufreq/cpuinfo_max_freq", i);
        core->max_freq_khz = (uint32_t)read_sysfs_long(path, 0);
        if (core->max_freq_khz > max_freq_global) max_freq_global = core->max_freq_khz;
        if (core->max_freq_khz > 0 && core->max_freq_khz < min_freq_global) min_freq_global = core->max_freq_khz;

        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu%u/cpu_capacity", i);
        core->cpu_capacity = (uint32_t)read_sysfs_long(path, 1024);

        /* NUMA node mapping */
        core->numa_node = 0;
        DIR *cpu_dir;
        snprintf(path, sizeof(path), "/sys/devices/system/cpu/cpu%u", i);
        cpu_dir = opendir(path);
        if (cpu_dir) {
            struct dirent *ent;
            while ((ent = readdir(cpu_dir)) != NULL) {
                if (strncmp(ent->d_name, "node", 4) == 0 && ent->d_name[4] >= '0' && ent->d_name[4] <= '9') {
                    core->numa_node = (uint32_t)atoi(ent->d_name + 4);
                    break;
                }
            }
            closedir(cpu_dir);
        }

        /* SMT sibling check */
        core->is_smt_sibling = false;
        for (uint32_t prev = 0; prev < i; prev++) {
            if (info->cores[prev].physical_core_id == core->physical_core_id &&
                info->cores[prev].package_id == core->package_id) {
                core->is_smt_sibling = true;
                break;
            }
        }
    }

    /* Core type classification (P-core vs E-core) */
    bool has_varying_freq = (max_freq_global > 0 && min_freq_global < max_freq_global);
    info->is_heterogeneous = false;
    info->p_core_count = 0;
    info->e_core_count = 0;

    for (uint32_t i = 0; i < info->logical_cpus; i++) {
        uqt_cpu_core_info_t *core = &info->cores[i];
        if (has_varying_freq) {
            info->is_heterogeneous = true;
            /* If frequency is within 10% of max, consider Performance core */
            if (core->max_freq_khz >= (max_freq_global * 90 / 100)) {
                core->core_type = UQT_CORE_TYPE_PERFORMANCE;
                if (!core->is_smt_sibling) info->p_core_count++;
            } else {
                core->core_type = UQT_CORE_TYPE_EFFICIENCY;
                if (!core->is_smt_sibling) info->e_core_count++;
            }
        } else {
            core->core_type = UQT_CORE_TYPE_PERFORMANCE;
            if (!core->is_smt_sibling) info->p_core_count++;
        }
    }

    /* Physical core calculation */
    uint32_t phys_count = 0;
    for (uint32_t i = 0; i < info->logical_cpus; i++) {
        if (!info->cores[i].is_smt_sibling) phys_count++;
    }
    info->physical_cores = phys_count ? phys_count : 1;
    info->threads_per_core = info->logical_cpus / info->physical_cores;
    if (info->threads_per_core == 0) info->threads_per_core = 1;
}

int uqt_cpu_set_thread_affinity(uint32_t cpu_id) {
    if (cpu_id >= g_uqt_cpu_info.logical_cpus) return UQT_ERR_INVAL;

    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET((int)cpu_id, &cpuset);

    int s = pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    return (s == 0) ? UQT_SUCCESS : UQT_ERR_SYSCALL;
}

int uqt_cpu_get_thread_affinity(uint32_t *cpu_id) {
    if (!cpu_id) return UQT_ERR_INVAL;

    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    int s = pthread_getaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    if (s != 0) return UQT_ERR_SYSCALL;

    for (int i = 0; i < (int)g_uqt_cpu_info.logical_cpus; i++) {
        if (CPU_ISSET(i, &cpuset)) {
            *cpu_id = (uint32_t)i;
            return UQT_SUCCESS;
        }
    }
    return UQT_ERR_NOT_FOUND;
}

int uqt_cpu_get_temperature(double *temp_celsius) {
    if (!temp_celsius) return UQT_ERR_INVAL;
    *temp_celsius = 0.0;

    /* Check thermal zones */
    char path[256];
    for (int i = 0; i < 10; i++) {
        snprintf(path, sizeof(path), "/sys/class/thermal/thermal_zone%d/temp", i);
        long temp_mC = read_sysfs_long(path, -1);
        if (temp_mC > 0 && temp_mC < 150000) {
            *temp_celsius = temp_mC / 1000.0;
            return UQT_SUCCESS;
        }
    }

    /* Check hwmon */
    for (int i = 0; i < 10; i++) {
        snprintf(path, sizeof(path), "/sys/class/hwmon/hwmon%d/temp1_input", i);
        long temp_mC = read_sysfs_long(path, -1);
        if (temp_mC > 0 && temp_mC < 150000) {
            *temp_celsius = temp_mC / 1000.0;
            return UQT_SUCCESS;
        }
    }

    return UQT_ERR_NOT_FOUND;
}

#else

static void detect_fallback_topology(uqt_cpu_info_t *info) {
    info->logical_cpus = 1;
    info->physical_cores = 1;
    info->threads_per_core = 1;
    info->numa_nodes = 1;
    info->cache_line_size = UQT_CACHE_LINE_SIZE;
    info->cores[0].cpu_id = 0;
    info->cores[0].physical_core_id = 0;
    info->cores[0].core_type = UQT_CORE_TYPE_PERFORMANCE;
    info->p_core_count = 1;
}

int uqt_cpu_set_thread_affinity(uint32_t cpu_id) {
    (void)cpu_id;
    return UQT_SUCCESS;
}

int uqt_cpu_get_thread_affinity(uint32_t *cpu_id) {
    if (cpu_id) *cpu_id = 0;
    return UQT_SUCCESS;
}

int uqt_cpu_get_temperature(double *temp_celsius) {
    if (temp_celsius) *temp_celsius = 0.0;
    return UQT_ERR_UNSUPPORTED;
}

#endif

void uqt_cpu_detect_topology(uqt_cpu_info_t *info) {
#if defined(UQT_OS_LINUX)
    detect_linux_topology(info);
#else
    detect_fallback_topology(info);
#endif
}
