# Operating System & Runtime Interaction: The Invisible Performance Tax

A high-performance runtime or compiler cannot treat the operating system as a neutral abstraction layer. System calls, context switches, page table faults, and dynamic loaders impose profound performance boundaries that can easily dominate application execution time.

---

## 1. System Calls & Kernel Transitions
* **The Syscall Cost**: Executing an instruction like `syscall` (x86-64) or `svc` (ARM64) switches the CPU from Ring 3 (user space) to Ring 0 (kernel space).
* **Spectre / Meltdown & KPTI (Kernel Page Table Isolation)**:
  * Prior to 2018, user and kernel page tables were mapped into the same virtual address space.
  * To defeat Meltdown, modern OS kernels implement KPTI, requiring a complete swap of the `CR3` register (page table root) on every system call!
  * Swapping `CR3` flushes non-global TLB entries, ballooning syscall latency from **~50 ns to 200–500+ ns**.
* **Modern Mitigation**: Runtimes must batch or eliminate system calls using asynchronous ring buffers:
  * **Linux `io_uring` (Jens Axboe, 2019)**: User space and kernel share two lock-free ring buffers (Submission Queue `SQ` and Completion Queue `CQ`) via memory mapping. Applications submit thousands of I/O operations without executing a single `syscall`!

---

## 2. Context Switches & CPU Migration
* **Direct Cost**: Saving and restoring 16+ general-purpose registers, floating-point / SIMD vector state (XSAVE/XRSTOR is ~500 bytes to 2 KB), and swapping stack pointers: ~1 to 2 microseconds.
* **Indirect Cost (Cache Pollution & Footprint)**:
  * When the Linux CFS / EEVDF scheduler switches out thread $A$ to run thread $B$, thread $B$ loads its own working set into L1D, L1I, and L2 caches, evicting thread $A$’s cached data.
  * When thread $A$ resumes execution, it experiences a catastrophic cascade of L1/L2 cache misses and TLB misses, spending the next **10 to 50 microseconds** reloading its working set from slow DRAM.
* **Scheduler Migration**: If the OS moves thread $A$ to a different CPU core or remote NUMA node, all warm cache data is completely lost. Runtimes must bind compute workers via CPU affinity (`sched_setaffinity`).

---

## 3. Virtual Memory & Page Faults
* **Minor Page Faults**:
  * When `malloc` allocates 1 GB of memory, the OS merely reserves virtual address space (`mmap(PROT_READ|PROT_WRITE)`). No physical RAM is allocated!
  * On the first write to each 4 KB page, the hardware triggers a Page Fault exception. The OS kernel traps, finds a zeroed physical page frame, updates the page table, and resumes the application.
  * Allocating and touching 1 GB of memory requires **262,144 minor page faults**, costing hundreds of milliseconds!
* **Transparent Huge Pages (THP - 2 MB Pages)**:
  * Using 2 MB pages reduces page table overhead by 512x and radically boosts TLB reach.
  * *The Trap*: If physical memory is fragmented, the Linux kernel invokes background compaction (`khugepaged`), freezing threads in uninterruptible sleep (`D-state`) for dozens of milliseconds. Runtimes with unpredictable allocation patterns should use explicit huge pages (`mmap(MAP_HUGETLB)`) or madvise (`MADV_HUGEPAGE`).

---

## 4. Dynamic Linking: ELF, PLT, and GOT Overhead
* **Executable Startup & Relocation Cost**:
  * Dynamically linked programs (`.so` / `.dylib`) rely on the dynamic linker (`ld.so`) to resolve symbol addresses at program startup.
  * For programs with thousands of symbols, `ld.so` parses ELF relocation tables, applies Address Space Layout Randomization (ASLR) rebasing, and updates GOT entries before `main()` is even invoked!
  * Can add **50 to 200+ milliseconds of cold-start latency**.
* **Procedure Linkage Table (PLT) Indirection**:
  * Every call to an external library function jumps through a PLT stub:
    `call foo@plt` $\to$ jumps to `[GOT + offset]` $\to$ executes target function.
  * Adds an unnecessary indirect jump and defeats compiler inlining.
  * **Static Linking / LTO Advantage**: Static linking resolves all symbols at build time, eliminates PLT/GOT trampolines, enables whole-program inlining, and cuts program startup time to sub-millisecond speeds.

---

## 5. File I/O: `mmap` vs. Buffered Read/Write
* **`read()` / `write()`**: Copies data from kernel page cache into user-space buffer via CPU memory copy (`memcpy`), incurring double memory bandwidth overhead.
* **`mmap()`**: Maps file blocks directly into user virtual memory space.
  * Eliminates user-space copying (Zero-Copy I/O).
  * Ideal for large read-mostly data (compilers reading source files, databases reading indexes).
  * *Caveat*: If a memory-mapped file access encounters disk I/O, the resulting page fault freezes the accessing thread synchronously.
