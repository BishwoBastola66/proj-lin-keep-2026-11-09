#include "uqt/dashboard.h"
#include "uqt/cpu.h"
#include "uqt/memory.h"
#include "uqt/utils.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdatomic.h>

#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
#include <termios.h>
#include <unistd.h>
#include <sys/select.h>

static struct termios g_orig_termios;
static bool g_termios_saved = false;

void uqt_dashboard_cleanup(void) {
    if (g_termios_saved) {
        tcsetattr(STDIN_FILENO, TCSANOW, &g_orig_termios);
        g_termios_saved = false;
    }
}

int uqt_dashboard_init(void) {
    if (!isatty(STDIN_FILENO)) return 0;

    if (tcgetattr(STDIN_FILENO, &g_orig_termios) == 0) {
        g_termios_saved = true;
        atexit(uqt_dashboard_cleanup);

        struct termios raw = g_orig_termios;
        raw.c_lflag &= ~(ICANON | ECHO | ECHOE | ECHOK | ECHONL);
        raw.c_cc[VMIN] = 0;
        raw.c_cc[VTIME] = 0;
        tcsetattr(STDIN_FILENO, TCSANOW, &raw);
    }
    return 0;
}

int uqt_dashboard_read_key(void) {
    if (!g_termios_saved) {
        return -1;
    }

    fd_set readfds;
    FD_ZERO(&readfds);
    FD_SET(STDIN_FILENO, &readfds);

    struct timeval tv = {0, 0};
    int ret = select(STDIN_FILENO + 1, &readfds, NULL, NULL, &tv);
    if (ret > 0 && FD_ISSET(STDIN_FILENO, &readfds)) {
        unsigned char ch = 0;
        if (read(STDIN_FILENO, &ch, 1) == 1) {
            return (int)ch;
        }
    }
    return -1;
}

#else

void uqt_dashboard_cleanup(void) {}
int uqt_dashboard_init(void) { return 0; }
int uqt_dashboard_read_key(void) { return -1; }

#endif

void uqt_dashboard_render(const uqt_dashboard_stats_t *stats, const uqt_pool_metrics_t *metrics) {
    if (!stats || !metrics) return;

    uint32_t hrs = (uint32_t)(stats->uptime_seconds / 3600);
    uint32_t mins = (uint32_t)((stats->uptime_seconds % 3600) / 60);
    uint32_t secs = (uint32_t)(stats->uptime_seconds % 60);

    const char *status_tag = stats->is_paused ? "\033[1;31m[PAUSED]\033[0m " : "";

    printf("\n%s\033[1;36m[uqt-miner v0.1.0]\033[0m \033[1;32mUPTIME:\033[0m %02uh %02um %02us | \033[1;33mALGO:\033[0m %s (%s)\n",
           status_tag, hrs, mins, secs, stats->algo_name ? stats->algo_name : "sha256d",
           stats->backend_name ? stats->backend_name : "auto");
    printf("\033[1;34mPOOL:\033[0m %s | \033[1;35mDIFF:\033[0m %.2f | \033[1;32mSHARES:\033[0m %llu acc / %llu rej\n",
           stats->pool_url ? stats->pool_url : "local",
           stats->pool_difficulty,
           (unsigned long long)stats->shares_accepted,
           (unsigned long long)stats->shares_rejected);

    double speed_hs = (stats->uptime_seconds > 0) ? (double)metrics->total_hashes / (double)stats->uptime_seconds : 0.0;
    char speed_buf[32];
    if (speed_hs >= 1000000.0) {
        snprintf(speed_buf, sizeof(speed_buf), "%.2f MH/s", speed_hs / 1000000.0);
    } else if (speed_hs >= 1000.0) {
        snprintf(speed_buf, sizeof(speed_buf), "%.2f KH/s", speed_hs / 1000.0);
    } else {
        snprintf(speed_buf, sizeof(speed_buf), "%.2f H/s", speed_hs);
    }

    printf("\033[1;32mSPEED:\033[0m \033[1;37m%s\033[0m (%llu hashes) | \033[1;33mTHREADS:\033[0m %u/%u\n",
           speed_buf, (unsigned long long)metrics->total_hashes,
           stats->num_workers, g_uqt_cpu_info.logical_cpus);
    printf("\033[0;37m[Hotkeys: 'h' Hashrate | 's' Shares | 'c' Connection | 'e' System | 'p' Pause | 'd' Help]\033[0m\n");
    printf("--------------------------------------------------------------------------------\n");
    fflush(stdout);
}

void uqt_dashboard_show_hashrate(const uqt_worker_pool_t *pool, const uqt_dashboard_stats_t *stats) {
    if (!pool) return;

    printf("\n\033[1;36m============================= HASHRATE BREAKDOWN =============================\033[0m\n");
    printf("%-8s %-8s %-12s %-8s %-16s %-12s %-10s\n",
           "Thread", "CPU ID", "Core Type", "NUMA", "Hashes Done", "Speed (H/s)", "Status");
    printf("------------------------------------------------------------------------------\n");

    uint64_t total_hashes = 0;
    double elapsed_sec = (stats && stats->uptime_seconds > 0) ? (double)stats->uptime_seconds : 1.0;

    for (uint32_t i = 0; i < pool->worker_count; i++) {
        const uqt_worker_t *w = &pool->workers[i];
        uint64_t h = atomic_load(&w->stats.hashes_done);
        total_hashes += h;

        double speed = (double)h / elapsed_sec;
        const char *core_str = (w->core_type == UQT_CORE_TYPE_PERFORMANCE) ? "P-Core" :
                               (w->core_type == UQT_CORE_TYPE_EFFICIENCY) ? "E-Core" : "SMT/Std";
        const char *status_str = atomic_load(&w->is_paused) ? "\033[31mPAUSED\033[0m" : "\033[32mACTIVE\033[0m";

        printf("T%02u     CPU%-3u  %-12s Node %-3u %-16llu %-12.2f %s\n",
               i, w->cpu_id, core_str, w->numa_node,
               (unsigned long long)h, speed, status_str);
    }
    printf("------------------------------------------------------------------------------\n");
    double total_speed_hs = (double)total_hashes / elapsed_sec;
    double total_speed_mhs = total_speed_hs / 1000000.0;
    printf("\033[1;32mTOTAL:\033[0m %u threads | \033[1;37m%.2f H/s\033[0m (%.4f MH/s) | %llu total hashes\n",
           pool->worker_count, total_speed_hs, total_speed_mhs, (unsigned long long)total_hashes);
    printf("\033[1;36m==============================================================================\033[0m\n\n");
    fflush(stdout);
}

void uqt_dashboard_show_shares(const uqt_dashboard_stats_t *stats) {
    if (!stats) return;

    uint64_t total_shares = stats->shares_accepted + stats->shares_rejected + stats->shares_invalid;
    double accept_ratio = (total_shares > 0) ? (double)stats->shares_accepted * 100.0 / (double)total_shares : 100.0;

    printf("\n\033[1;35m========================= MINING RESULTS & SHARES =========================\033[0m\n");
    printf("  \033[1;32m* accepted\033[0m         %llu (%.1f%%)\n", (unsigned long long)stats->shares_accepted, accept_ratio);
    printf("  \033[1;31m* rejected\033[0m         %llu\n", (unsigned long long)stats->shares_rejected);
    printf("  \033[1;33m* invalid\033[0m          %llu\n", (unsigned long long)stats->shares_invalid);
    printf("  \033[1;37m* total submitted\033[0m   %llu\n", (unsigned long long)total_shares);
    printf("  \033[1;34m* pool difficulty\033[0m   %.4f (%.0f)\n", stats->pool_difficulty, stats->pool_difficulty * 65536.0);
    if (stats->last_job_id[0]) {
        printf("  \033[1;37m* active job ID\033[0m     %s\n", stats->last_job_id);
    }
    printf("\033[1;35m===========================================================================\033[0m\n\n");
    fflush(stdout);
}

void uqt_dashboard_show_connection(const uqt_stratum_client_t *stratum, const uqt_dashboard_stats_t *stats) {
    printf("\n\033[1;34m========================= STRATUM POOL CONNECTION =========================\033[0m\n");
    printf("  \033[1;37mPool URL:\033[0m         %s\n", (stats && stats->pool_url) ? stats->pool_url : "dry-run (local)");
    printf("  \033[1;37mWallet/User:\033[0m      %s\n", (stats && stats->wallet) ? stats->wallet : "anonymous");

    if (stratum) {
        printf("  \033[1;32mConnection:\033[0m       %s\n", stratum->connected ? "\033[32mCONNECTED\033[0m" : "\033[31mDISCONNECTED\033[0m");
        printf("  \033[1;32mSubscription:\033[0m     %s (Extranonce1: %s)\n", stratum->subscribed ? "\033[32mOK\033[0m" : "\033[33mPENDING\033[0m", stratum->extranonce1);
        printf("  \033[1;32mAuthorization:\033[0m    %s\n", stratum->authorized ? "\033[32mAUTHORIZED\033[0m" : "\033[33mPENDING\033[0m");
        printf("  \033[1;33mSocket FD:\033[0m        %d\n", stratum->socket_fd);
        printf("  \033[1;33mRPC Sequence:\033[0m     %llu\n", (unsigned long long)stratum->rpc_id);
    } else {
        printf("  \033[1;33mConnection:\033[0m       Local offline mode (dry-run)\n");
    }
    printf("\033[1;34m===========================================================================\033[0m\n\n");
    fflush(stdout);
}

void uqt_dashboard_show_environment(const uqt_worker_pool_t *pool) {
    printf("\n\033[1;33m========================== HARDWARE & SYSTEM INFO ==========================\033[0m\n");
    printf("  \033[1;37mCPU Brand:\033[0m        %s\n", g_uqt_cpu_info.brand);
    printf("  \033[1;37mTopology:\033[0m         %u physical cores, %u logical CPUs (%u NUMA nodes)\n",
           g_uqt_cpu_info.physical_cores, g_uqt_cpu_info.logical_cpus, g_uqt_cpu_info.numa_nodes);
    printf("  \033[1;37mSIMD Extensions:\033[0m  %s%s%s%s%s%s\n",
           (g_uqt_cpu_info.features & UQT_CPU_FEAT_AVX512F) ? "AVX512 " : "",
           (g_uqt_cpu_info.features & UQT_CPU_FEAT_AVX2) ? "AVX2 " : "",
           (g_uqt_cpu_info.features & UQT_CPU_FEAT_AVX) ? "AVX " : "",
           (g_uqt_cpu_info.features & UQT_CPU_FEAT_SHANI) ? "SHA-NI " : "",
           (g_uqt_cpu_info.features & UQT_CPU_FEAT_AESNI) ? "AES-NI " : "",
           (g_uqt_cpu_info.features & UQT_CPU_FEAT_SSE41) ? "SSE4.1 " : "");

    uqt_mem_diag_t diag = uqt_mem_get_diagnostics();
    printf("  \033[1;32mHugePages 2MB:\033[0m    %s\n",
           (diag.explicit_huge_capable || diag.thp_capable) ? "\033[32mAVAILABLE (Enabled)\033[0m" : "\033[33mDISABLED (Standard 4KB Pages)\033[0m");

    double temp = 0.0;
    if (uqt_cpu_get_temperature(&temp) == UQT_SUCCESS) {
        printf("  \033[1;31mCPU Temperature:\033[0m  %.1f °C\n", temp);
    }

    if (pool) {
        printf("  \033[1;36mWorker Profile:\033[0m   %s | Algorithm: %s (%s)\n",
               pool->config.profile ? pool->config.profile : "default",
               pool->algo ? pool->algo->name : "unknown",
               pool->backend ? pool->backend->name : "scalar");
    }
    printf("\033[1;33m============================================================================\033[0m\n\n");
    fflush(stdout);
}

void uqt_dashboard_show_help(void) {
    printf("\n\033[1;36m=========================== COMMANDS & KEYBINDINGS ===========================\033[0m\n");
    printf("  \033[1;33mh\033[0m / \033[1;33mH\033[0m  : \033[1;37mhashrate\033[0m   - Show per-thread CPU hashrate breakdown\n");
    printf("  \033[1;33ms\033[0m / \033[1;33mS\033[0m  : \033[1;37mresults\033[0m    - Show accepted/rejected shares & difficulty\n");
    printf("  \033[1;33mc\033[0m / \033[1;33mC\033[0m  : \033[1;37mconnection\033[0m - Show Stratum pool connection & socket state\n");
    printf("  \033[1;33me\033[0m / \033[1;33mE\033[0m  : \033[1;37msystem\033[0m     - Show CPU topology, temperature & HugePages\n");
    printf("  \033[1;33mp\033[0m / \033[1;33mP\033[0m  : \033[1;37mpause\033[0m      - Pause mining worker threads\n");
    printf("  \033[1;33mr\033[0m / \033[1;33mR\033[0m  : \033[1;37mresume\033[0m     - Resume mining worker threads (or reset stats)\n");
    printf("  \033[1;33md\033[0m / \033[1;33m?\033[0m  : \033[1;37mhelp\033[0m       - Show this interactive help menu\n");
    printf("  \033[1;33mq\033[0m / \033[1;33mQ\033[0m  : \033[1;37mquit\033[0m       - Stop worker threads and exit cleanly\n");
    printf("\033[1;36m==============================================================================\033[0m\n\n");
    fflush(stdout);
}
