# Multi-Objective Performance Model and Microarchitectural Metrics

```text
       ┌───────────────────────────────────────────────────────────────┐
       │             Rubix Multi-Objective Performance Model           │
       └───────────────────────────────┬───────────────────────────────┘
                                       │
     ┌───────────────────┬─────────────┴─────┬───────────────────┐
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
  Throughput          Latency          Memory / DRAM          Energy
 (Ops / Sec)        (p99 / Tail)      (Bytes & Misses)       (Joules)
```

## 1. Abstract & Problem Formulation

In modern computer systems, "fast" is not a single scalar number. Optimizing exclusively for a single dimension (such as raw benchmark throughput) frequently causes severe regressions in:
* **Tail Latency**: Aggressive JIT warm-up or concurrent GC garbage collection pauses destroy real-time predictability.
* **Energy Consumption**: Wide 512-bit vector units or aggressive speculative execution scale power super-linearly ($P \propto V^2 f$).
* **Memory Footprint**: Massive static lookup tables or uncompressed intermediate representations exhaust L1/L2 caches, causing DRAM thrashing.
* **Compilation Latency**: Whole-program interprocedural analysis taking tens of minutes impairs developer productivity.

Rubix implements a **Multi-Objective Pareto Performance Model** that evaluates software performance across 15 explicit microarchitectural metrics under selectable compiler policies.

---

## 2. The 15 Core Performance Metrics

Rubix defines and measures 15 distinct dimensions of hardware performance:

| Metric | Measurement Unit | Microarchitectural Significance | Rubix Measurement Tool / Counter |
|:---|:---|:---|:---|
| **1. Execution Latency** | Nanoseconds (ns) / Cycles | Time required to complete a single discrete operation or request | `sys_clock_gettime(CLOCK_MONOTONIC)` |
| **2. Throughput** | Operations per Second (ops/s) | Aggregate volume of transactions completed per unit time | `./bin/rubix bench <file.bix>` |
| **3. Instruction Count** | Retired Instructions | Total count of macro-instructions completed by the CPU | `perf stat -e instructions` |
| **4. Micro-op (uop) Count** | Retired uops | Real decoded operations executed by internal CPU execution ports | `perf stat -e uops_retired.all` |
| **5. Register Pressure** | Active Virtual Registers | Number of simultaneously live variables at a program point | Recorded in [compiler/rums/regalloc.bix](file:///home/bishwaxyz/translator/rubix/compiler/rums/regalloc.bix) |
| **6. Stack Spills** | Spill / Reload Instructions | Count of memory loads/stores generated due to register starvation | Emitted stack frame size in [emitter.bix](file:///home/bishwaxyz/translator/rubix/compiler/backend/emitter.bix) |
| **7. Memory Traffic** | Bytes Transferred (DRAM) | Total volume of data crossing the off-chip memory controller | `perf stat -e uncore_imc/data_reads/,data_writes/` |
| **8. Cache Misses** | L1D, L2, L3 Miss Count | Memory requests that fail to hit on-chip SRAM caches | `perf stat -e L1-dcache-load-misses,LLC-load-misses` |
| **9. Branch Mispredicts** | Mispredicted Branches | Control-flow predictions that fail, flushing the execution pipeline | `perf stat -e branch-misses` |
| **10. Vector Utilization** | % SIMD / Vector uops | Proportion of arithmetic performed via SIMD/Vector units | Vector instruction ratio in machine bytecode |
| **11. Heap Allocation Rate** | Bytes Allocated / Sec | Dynamic memory requests made via `mmap` or heap arenas | Tracked in [compiler/middle/escape_analysis.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/escape_analysis.bix) |
| **12. Peak Memory (RSS)** | Megabytes (MB) | Maximum resident set size of process in virtual memory | Linux `/proc/[pid]/status` `VmHWM` |
| **13. Binary Size** | Bytes (Executable Size) | Physical byte footprint of the generated native binary | `ls -la` on ELF/PE/Mach-O container |
| **14. Startup Latency** | Microseconds ($\mu$s) | Time elapsed from OS `execve` to first instruction execution | Measured via process entry profiling |
| **15. Electrical Energy** | Joules (J) / Picojoules (pJ) | Energy consumed across CPU package and DRAM controllers | `perf stat -e power/energy-pkg/,power/energy-ram/` |

---

## 3. The Instruction Count Fallacy and Modern Microarchitectures

A critical insight from 2025–2026 CPU architecture research:
> **Fewer instructions do not necessarily mean faster or more efficient execution.**

Consider an optimization that replaces two independent memory loads with a single fused instruction, or that unrolls a loop to eliminate loop-counter increments:
* If the two memory loads were accessing different cache banks, the out-of-order execution engine could issue them in parallel using **Memory-Level Parallelism (MLP)**.
* Replacing them with a serialized computation reduces the instruction count by 1, but *increases overall execution latency* because the hardware pipeline stalls waiting on serial dependencies.
* Furthermore, aggressive loop unrolling bloats the instruction cache (L1I), increasing instruction-fetch misses.

In Rubix, the RUMS cost model ([compiler/rums/machdesc.bix](file:///home/bishwaxyz/translator/rubix/compiler/rums/machdesc.bix)) weights operations by **critical path latency and memory hierarchy tier** rather than naive instruction count.

---

## 4. Policy-Driven Compilation Profiles

Developers can configure the multi-objective optimization weights depending on target deployment scenarios:

```text
                               Optimization Policies
                                         │
        ┌───────────────────┬────────────┴────────┬───────────────────┐
        │                   │                     │                   │
     Release              Server                Mobile              Embedded
 (Max Performance)    (Predictable Tail)    (Battery & Energy)    (Minimal Size)
   Vectorize Loops      Zero GC Pauses       Minimize DRAM         Stack Promotion
   Unroll Loops         Region Arenas        Register Packing      Direct Syscalls
   Inline aggressively  Lock-Free CSP        Cap DVFS Frequency    Strip Debug Syms
```

1. **Profile `performance` (Default Release)**:
   * Prioritizes throughput and latency.
   * Enables loop unrolling, bounded superoptimization of address arithmetic, and aggressive function inlining.
2. **Profile `server` (Cloud Services & Microservices)**:
   * Prioritizes p99 tail latency predictability and memory density.
   * Utilizes region arenas for per-request isolation; strictly avoids stop-the-world pauses.
3. **Profile `battery` / `green` (Mobile & Edge Devices)**:
   * Minimizes DRAM bus traffic and package switching power.
   * Maximizes register residency (targeting 32 GPRs on APX/Arm64); prefers clean scalar loops over energy-expensive 512-bit vector spin-ups for small datasets.
4. **Profile `size` (Embedded & Microcontrollers)**:
   * Minimizes final binary footprint.
   * Emits compact 2-byte instruction encodings; shares identical function bodies; avoids loop unrolling.

---

## 5. Benchmarking Infrastructure in the Repository

Rubix provides built-in benchmarking via `./bin/rubix bench`:
* [tests/bench_semantic_performance.bix](file:///home/bishwaxyz/translator/rubix/tests/bench_semantic_performance.bix): Executes millions of mathematical and memory operations, measuring throughput in iterations per millisecond with zero runtime overhead.
* [bench_fib.bix](file:///home/bishwaxyz/translator/rubix/bench_fib.bix): Measures recursive function call overhead, stack frame construction, and register preservation against equivalent native C code (`bench_fib.c`).
* [bench_loop.bix](file:///home/bishwaxyz/translator/rubix/bench_loop.bix): Evaluates tight loop execution, register allocation efficiency, and branch predictor compatibility against `bench_loop.c`.

---

## 6. Summary

The Rubix performance model is multi-dimensional and microarchitecturally grounded. By measuring throughput, tail latency, DRAM traffic, and energy consumption under distinct deployment policies, Rubix produces native binaries that excel in real-world operating environments.
