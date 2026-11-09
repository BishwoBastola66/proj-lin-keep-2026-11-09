#include "uqt/memory.h"
#include <stdio.h>

#if defined(UQT_OS_LINUX)
#include <unistd.h>
#include <dirent.h>
#include <string.h>
#include <sys/syscall.h>

/* NUMA constants for mbind */
#define MPOL_BIND 2
#define MPOL_F_STRICT (1 << 0)

static int get_numa_node_count(void) {
    DIR *dir = opendir("/sys/devices/system/node");
    if (!dir) return 1;
    
    int count = 0;
    struct dirent *ent;
    while ((ent = readdir(dir)) != NULL) {
        if (strncmp(ent->d_name, "node", 4) == 0) {
            count++;
        }
    }
    closedir(dir);
    return count > 0 ? count : 1;
}

int uqt_numa_available(void) {
    return get_numa_node_count() > 1;
}

int uqt_numa_node_count(void) {
    return get_numa_node_count();
}

int uqt_numa_bind_memory(void *ptr, size_t size, int node) {
    if (!ptr || size == 0) return UQT_ERR_INVAL;
    if (node < 0 || node >= uqt_numa_node_count()) return UQT_ERR_INVAL;

    unsigned long nodemask = (1UL << node);
    
    /* System call directly to avoid requiring libnuma dependency */
    long ret = syscall(SYS_mbind, ptr, size, MPOL_BIND, &nodemask, sizeof(nodemask) * 8 + 1, MPOL_F_STRICT);
    
    return (ret == 0) ? UQT_SUCCESS : UQT_ERR_SYSCALL;
}

int uqt_numa_bind_thread(int node) {
    if (node < 0 || node >= uqt_numa_node_count()) return UQT_ERR_INVAL;

    unsigned long nodemask = (1UL << node);
    long ret = syscall(SYS_set_mempolicy, MPOL_BIND, &nodemask, sizeof(nodemask) * 8 + 1);

    return (ret == 0) ? UQT_SUCCESS : UQT_ERR_SYSCALL;
}

#elif defined(UQT_OS_WINDOWS)
#include <windows.h>

int uqt_numa_available(void) {
    ULONG highest_node = 0;
    if (GetNumaHighestNodeNumber(&highest_node)) {
        return highest_node > 0;
    }
    return 0;
}

int uqt_numa_node_count(void) {
    ULONG highest_node = 0;
    if (GetNumaHighestNodeNumber(&highest_node)) {
        return (int)(highest_node + 1);
    }
    return 1;
}

int uqt_numa_bind_memory(void *ptr, size_t size, int node) {
    /* VirtualAllocExNuma should ideally be used for allocation instead of binding after.
       For a pre-allocated pointer, Windows doesn't easily let you migrate pages like mbind. */
    (void)ptr; (void)size; (void)node;
    return UQT_ERR_UNSUPPORTED; 
}

int uqt_numa_bind_thread(int node) {
    (void)node;
    /* Not implemented without processor group manipulation */
    return UQT_ERR_UNSUPPORTED;
}

#else

int uqt_numa_available(void) { return 0; }
int uqt_numa_node_count(void) { return 1; }
int uqt_numa_bind_memory(void *ptr, size_t size, int node) { (void)ptr; (void)size; (void)node; return UQT_ERR_UNSUPPORTED; }
int uqt_numa_bind_thread(int node) { (void)node; return UQT_ERR_UNSUPPORTED; }

#endif
