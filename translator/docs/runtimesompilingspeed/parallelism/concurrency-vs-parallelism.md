# Concurrency, Parallelism, and Latency Hiding: Foundations and Runtimes

It is a common error to conflate concurrency, parallelism, and latency hiding. They address distinct problems, require different runtime designs, and have fundamentally different performance profiles.

---

## 1. Precise Definitions

```
+-------------------------------------------------------------------------------+
| 1. PARALLELISM: Performing Multiple Computations Simultaneously in Real Time  |
|    - Requires multiple physical CPU cores / execution hardware.               |
|    - Goal: Reduce wall-clock execution time of compute-bound tasks.           |
|    - Example: Running 16 matrix multiplications across 16 CPU cores.           |
+-------------------------------------------------------------------------------+
| 2. CONCURRENCY: Structuring a Program as Independent Computations             |
|    - A composition property; can execute on a single core via time-slicing.   |
|    - Goal: Modularity, responsiveness, and handling interleaved events.       |
|    - Example: Handling 10,000 WebSocket connections on a single-threaded loop.|
+-------------------------------------------------------------------------------+
| 3. LATENCY HIDING: Overlapping Slow I/O or Memory Latency with Useful Work    |
|    - Hardware or runtime interleaves another task while waiting for memory/disk|
|    - Goal: Maximize hardware utilization during high-latency waits.            |
|    - Example: Simultaneous Multi-Threading (SMT/Hyper-Threading), async/await.|
+-------------------------------------------------------------------------------+
```

---

## 2. Task Parallelism & Work-Stealing Runtimes

### The Work-Stealing Principle (Blumofe & Leiserson, 1999)
* Rather than maintaining a centralized global queue of worker tasks protected by a heavy mutex, each CPU worker thread owns a private **Double-Ended Queue (Deque)**.
* **Chase-Lev Lock-Free Deque**:
  * *Local Worker Thread*: Pushes and pops child tasks from the **bottom** of its own deque in LIFO order (optimal for data cache locality).
  * *Idle Thief Thread*: When a worker thread runs out of tasks, it picks a random victim worker thread and steals a task from the **top** of the victim's deque in FIFO order (stealing the largest coarse-grained chunks of work).
  * **Proof of Scalability**: Blumofe and Leiserson proved that work stealing executes fully strict computations in expected time $T_P \le \frac{T_1}{P} + O(T_\infty)$, scaling near-linearly to hundreds of CPU cores with minimal synchronization overhead.
* **Implementations**: Cilk, Intel TBB, Go runtime scheduler, Rust Tokio / Rayon, Java ForkJoinPool.

---

## 3. Synchronization Primitives: Atomics, Mutexes, and Futexes

### A. The Evolution of Mutexes to Futexes
* **Legacy Kernel Mutex**: Every `lock` and `unlock` invoked a slow operating system system call (`sys_semop`), costing 1,000+ clock cycles even when there was zero contention.
* **Linux Fast Userspace Mutex (Futex) (Franke, Russell, Kirkwood, 2002)**:
  * *Fast Path (Uncontended)*: An atomic compare-and-swap (`atomic_cmpxchg`) on a 32-bit integer in user-space memory. Takes **1 to 3 nanoseconds** with zero OS syscall overhead!
  * *Slow Path (Contended)*: Only when two threads collide and contention occurs, the thread invokes `syscall(SYS_futex, ..., FUTEX_WAIT)` to put the thread to sleep in the kernel.

### B. Memory Models & Ordering Semantics
Modern out-of-order CPUs and optimizing compilers freely reorder memory loads and stores unless constrained by atomic memory orders:
1. **Relaxed (`memory_order_relaxed`)**: Guarantees atomic read/write of the value, but provides zero ordering synchronization with other memory locations.
2. **Acquire-Release (`memory_order_acquire` / `release`)**:
   * *Release Store*: Guarantees that all preceding memory writes in this thread are visible to any other thread that subsequently performs an Acquire load on this atomic variable.
   * *Acquire Load*: Guarantees that no subsequent memory reads in this thread can be reordered before this load.
   * Perfect for lock-free message passing with minimal hardware memory fence penalties.
3. **Sequential Consistency (`memory_order_seqcst`)**: Enforces a single global total ordering across all CPU cores. Emits costly full memory fences (`MFENCE` on x86, `DMB ISH` on ARM), stalling pipeline retirement.

---

## 4. Read-Copy-Update (RCU) (Paul McKenney, 2001)
* **The Read-Heavy Concurrency Problem**: In routing tables, symbol tables, and configuration caches, reads outnumber writes 10,000 to 1. Traditional locks cause massive cache-line contention among readers.
* **RCU Mechanics**:
  * **Zero-Overhead Readers**: Readers acquire no locks, write no atomics, and read shared memory at native speed without cache invalidation.
  * **Writers**: When modifying a data structure, the writer allocates a copy, modifies the copy, and atomically swaps the pointer.
  * **Grace Period**: The old version is only freed after all concurrent reader threads have passed through a quiescent state (e.g., thread context switch).
  * Used extensively in the Linux kernel and high-throughput networking runtimes.

---

## 5. NUMA-Aware Scheduling & Memory Placement
* On dual-socket or multi-CCD systems, accessing RAM attached to a remote CPU socket takes 2x to 3x longer than local RAM.
* **NUMA Optimization Rules**:
  1. **Thread Affinity**: Pin worker threads to specific NUMA nodes or Core Complex Dies (CCDs) using `pthread_setaffinity_np`.
  2. **First-Touch Allocation**: Linux allocates physical memory on the NUMA node of the thread that *first writes* to the page, not the thread that called `malloc`. Runtimes must ensure worker threads initialize their own memory buffers.
