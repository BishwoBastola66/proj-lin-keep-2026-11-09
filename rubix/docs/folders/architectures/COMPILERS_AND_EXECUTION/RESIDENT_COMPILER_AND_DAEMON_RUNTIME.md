# Resident Compiler Daemon & Runtime Server Architecture

> **Status**: Canonical Accepted  
> **Classification**: Systems Architecture & Daemon Runtime  
> **Subsystem**: Rubix Compiler Substrate  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the architecture of the **Rubix Resident Compiler Daemon (`rubixd`)**.

Traditional compilers suffer an unavoidable 50–150ms penalty on every invocation simply starting the process, loading dynamic libraries (`libLLVM.so`), allocating page tables, and parsing configuration files. `rubixd` operates as an ultra-fast, memory-resident daemon that maintains warm caches and pre-allocated arenas, reducing invocation overhead to **$<1\text{ microsecond}$**.

---

## 2. Daemon Architecture & Shared Memory IPC

```
+───────────────────────────────────────────────────────────────────────────────────+
| Developer Terminal / IDE Language Server                                          |
| Command: `rubix build src/main.rx`                                                |
+───────────────────────────────────────────────────────────────────────────────────+
                                         │
        Writes command descriptor        │  Futex Wakeup
        (<0.8 µs)                        ▼  (<0.6 µs)
+───────────────────────────────────────────────────────────────────────────────────+
| POSIX Shared Memory Ring Buffer: `/dev/shm/rubixd.ipc`                             |
| [Ring Head] [Ring Tail] [Job Slot 0] [Job Slot 1] ... [Job Slot 63]               |
+───────────────────────────────────────────────────────────────────────────────────+
                                         │
                                         ▼
+───────────────────────────────────────────────────────────────────────────────────+
| Resident Daemon Process (`rubixd`)                                                |
|                                                                                   |
|  +─────────────────────────+  +─────────────────────────+  +────────────────────+ |
|  | Worker Thread 0 (Core 0)|  | Worker Thread 1 (Core 1)|  | Worker N (Core N)  | |
|  | 16MB RAMC Bump Arena    |  | 16MB RAMC Bump Arena    |  | 16MB RAMC Bump Arena| |
|  +─────────────────────────+  +─────────────────────────+  +────────────────────+ |
|                                                                                   |
|  +─────────────────────────────────────────────────────────────────────────────+  |
|  | Global Resident Stencil Cache (PCMSS) & Symbol Hologram Registry             |  |
|  +─────────────────────────────────────────────────────────────────────────────+  |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 3. High-Speed IPC Communication Protocol

1. **Zero System Calls on Steady State**: The client writes its job request directly into a pre-mapped memory slot in `/dev/shm/rubixd.ipc`:
   ```c
   typedef struct {
       uint32_t  job_id;
       uint32_t  command_flags;    // BUILD, RUN, TEST, CHECK
       char      source_path[256];
       char      output_path[256];
       uint32_t  status_code;      // 0=PENDING, 1=COMPLETED, 2=FAILED
   } Rubix_IPC_JobSlot;
   ```
2. **Futex Synchronization**: The client invokes `SYS_futex` to wake the sleeping daemon worker thread. Total wake latency is under **600 nanoseconds**.
3. **Core Pinning**: Each daemon worker thread is pinned to a dedicated CPU core (`pthread_setaffinity_np`), preventing thread migration between CPU sockets and maximizing L1/L2 cache warmth.
4. **Instant Completion**: Once `FSQG-Splice` finishes synthesis, the worker writes `status_code = 1` and signals the client. Total round-trip latency from CLI keystroke to binary ready: **$<0.35\text{ ms}$**.
