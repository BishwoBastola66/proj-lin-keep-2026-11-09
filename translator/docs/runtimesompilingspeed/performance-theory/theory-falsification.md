# Breaking Performance Dogmas: Theoretical Limits, Counterexamples, and Falsification

A core tenet of rigorous performance engineering is skepticism toward received wisdom. Every performance claim rests on implicit assumptions about hardware, workload, or data distribution. When those assumptions fail, applying the "optimization" actively degrades performance.
This document systematically interrogates and falsifies the eight major dogmas of computer performance.

---

## 1. Dogma: "More Threads Make Programs Faster"

### Under What Assumptions Is This True?
* Workload is embarrassingly parallel with zero synchronization.
* Threads share zero mutable memory states (no false sharing).
* Problem is compute-bound, not memory bandwidth-bound.
* Physical CPU cores are available without oversubscription.

### When Do Those Assumptions Fail?
* **Amdahl’s Law Bottleneck**: When serial fraction $s > 0$.
* **Cache Line Bouncing / False Sharing**: Multiple threads writing variables that share a 64-byte cache line.
* **Memory Bus Saturation**: Multiple cores contending for the same DDR5 memory channels.
* **Context Switching & Synchronization Overhead**: Lock contention or thread migration across NUMA nodes.

### The Counterexample:
* Consider an array reduction where 32 threads update an atomic counter or write to adjacent array indices:
  ```c
  // Counterexample: False sharing + atomic serialization
  int results[32]; // All 32 integers fit in a SINGLE 64-byte or two 64-byte cache lines!
  #pragma omp parallel num_threads(32)
  {
      int tid = omp_get_thread_num();
      for (long i = 0; i < 100000000; i++) {
          results[tid]++; // Cache line constantly ping-pongs across 32 cores!
      }
  }
  ```
* **Empirical Result**: Running with 32 threads runs **15x to 30x SLOWER** than running with a single thread!
* **Falsification Boundary**: Increasing thread count degrades performance whenever synchronization latency and cache coherence invalidations exceed the parallel work chunk size.

---

## 2. Dogma: "Inlining Always Makes Code Faster"

### Under What Assumptions Is This True?
* Inlining eliminates procedure call/return instructions (`CALL`/`RET`), argument marshalling, and enables downstream constant propagation across caller-callee boundaries.
* Function body is small and called frequently.

### When Do Those Assumptions Fail?
* Inlining large or medium functions expands machine code footprint.
* Exceeds the CPU’s 32 KB L1 Instruction Cache (L1I) and 64-entry Instruction TLB (iTLB).
* Increases register pressure: combining two functions into one scope increases overlapping live ranges, forcing the register allocator to spill variables to stack memory.

### The Counterexample:
* Inlining a 200-instruction function into 50 different call sites in a server loop expands code by 10,000 instructions.
* L1I cache miss rate jumps from 0.1% to 12%.
* **Empirical Result**: The binary runs **15% to 25% SLOWER** due to continuous front-end instruction-fetch stalls, even though zero call instructions were executed!
* **Falsification Boundary**: Inlining reduces performance whenever code growth induces L1I/iTLB cache misses that exceed the saved call instruction overhead (typically ~2–3 cycles).

---

## 3. Dogma: "SIMD Always Improves Performance"

### Under What Assumptions Is This True?
* Data is contiguous in memory (stride-1) and aligned to vector boundaries.
* Loop trip counts are large multiples of vector width ($N \gg V_{\text{width}}$).
* Control flow within loop iterations is uniform (no branching divergence).
* Operations are compute-intensive.

### When Do Those Assumptions Fail?
* **Gather/Scatter Penalties**: Accessing non-contiguous elements (`A[idx[i]]`) forces serialized memory reads across multiple cache lines.
* **AVX-512 Frequency Throttling**: On earlier architectures (Skylake-X), executing 512-bit instructions triggered core downclocking.
* **Small Trip Counts**: When $N = 5$ on an 8-wide vector unit, the overhead of setup, alignment checks, and scalar tail peel code exceeds the vector execution benefit.

### The Counterexample:
* Vectorizing a loop with sparse indirect memory lookup:
  ```c
  for (int i = 0; i < N; i++) {
      sum += table[indices[i]]; // Non-contiguous gather
  }
  ```
* Scalar code: Memory controller pipelines independent L1D requests via simple scalar instructions.
* SIMD `VGATHERDPS`: Stalls the CPU execution port, serialization logic kicks in, and LSU queue fills.
* **Empirical Result**: The SIMD gather version runs **2x to 3x SLOWER** than scalar compiled code!
* **Falsification Boundary**: SIMD degrades performance when memory access is non-contiguous or when vector setup and loop peeling costs dominate loop execution time.

---

## 4. Dogma: "JIT is Faster Than AOT"

### Under What Assumptions Is This True?
* JIT runtime has access to dynamic type profiles, exact CPU target capabilities (`CPUID`), and can perform speculative devirtualization and deoptimization that static AOT compilers cannot legally perform.
* Application runs indefinitely (warm server), amortizing compilation overhead.

### When Do Those Assumptions Fail?
* **Warmup & Compilation Overhead**: JIT must compile code *while the application is actively running*, consuming CPU cycles and memory that compete with application threads.
* **Deoptimization Storms**: Polymorphic inputs cause frequent deoptimization bailouts back to the slow interpreter.
* **Code Cache Bloat & GC**: JIT code caches require continuous GC sweeps and memory reallocations.

### The Counterexample:
* Short-lived CLI commands, serverless functions (AWS Lambda), or microservices with strict p99 cold-start latency requirements ($<10\text{ ms}$).
* Java / Node.js JIT takes 200–500 ms just to initialize the VM and warm up bytecode.
* Compiled AOT binary (Rust, Go, C++) executes in **2 milliseconds total**!
* **Empirical Result**: AOT is **100x to 250x FASTER** end-to-end on short-lived tasks.
* **Falsification Boundary**: JIT loses to AOT whenever execution duration is shorter than the JIT warmup and compilation horizon, or when AOT has access to profile data via PGO.

---

## 5. Dogma: "More Cache Always Improves Performance"

### Under What Assumptions Is This True?
* Larger caches retain a larger working set, converting DRAM misses into on-die cache hits.

### When Do Those Assumptions Fail?
* Larger caches inherently have **higher access latency**!
  * 32 KB L1: 4–5 cycles latency.
  * 512 KB L2: 12–14 cycles latency.
  * 32 MB L3: 40–55 cycles latency.
* If a working set fits entirely within 32 KB of L1 cache, adding a larger, slower L2 or L3 cache provides zero benefit to hit rates, while increasing physical die size, power, and potentially interconnect hops.
* On NUMA / chiplet architectures (AMD Zen), larger caches distributed across multiple CCDs introduce cross-CCD latency penalties when data is shared.
* **Falsification Boundary**: Increasing cache size increases latency without performance benefit when the active working set already fits within smaller cache tiers.

---

## 6. Dogma: "More Compiler Optimization Always Produces Faster Binaries"

### Under What Assumptions Is This True?
* Higher optimization levels (`-O3` vs `-O2`) apply additional mathematical transformations (loop unrolling, aggressive inlining, vectorization) that eliminate instructions.

### When Do Those Assumptions Fail?
* `-O3` triggers aggressive loop unrolling and function inlining, drastically increasing binary size.
* The expanded code footprint overflows the L1 Instruction Cache and iTLB.
* Register pressure spikes, forcing the register allocator to insert spill/reload memory instructions inside inner loops.

### The Counterexample:
* Compiling large database engines (e.g., SQLite, PostgreSQL) with `-O3` often produces **3% to 8% SLOWER** performance than compiling with `-O2` or `-Os` (optimize for size)!
* `-Os` keeps the entire database query dispatch loop inside the L1I cache, eliminating instruction fetch stalls.
* **Falsification Boundary**: High optimization flags degrade performance when the code growth penalty exceeds the microarchitectural efficiency of the transformations.

---

## 7. Dogma: "PGO Always Improves Performance"

### Under What Assumptions Is This True?
* The profile captured during training perfectly mirrors real-world production workload distribution.
* Hardware execution environment is identical between training and production.

### When Do Those Assumptions Fail?
* **Training on Microbenchmarks**: Distorts branch weights and call graphs.
* **Workload Shift**: Training on batch processing, deploying to low-latency interactive serving.
* Compilers optimize one path so heavily that alternate, secondary paths become severely deprioritized and cold-split, causing catastrophic tail latency (p99/p99.9) spikes when secondary paths are executed.
* **Falsification Boundary**: PGO degrades performance when training inputs diverge from production distributions or when tail latency on minority code paths is business-critical.

---

## 8. Dogma: "More Aggressive Optimization is Better"

### Under What Assumptions Is This True?
* Optimization passes have zero cost at compile time and zero downside at runtime.

### When Do Those Assumptions Fail?
* Aggressive optimizations introduce subtle edge-case compiler bugs, increase compilation time from seconds to hours, and fragilely break when surrounding code changes.
* Over-optimizing scalar code can prevent downstream vectorization passes from recognizing standard loop patterns.
* **Falsification Boundary**: Optimization is a series of trade-offs governed by the Pareto principle: 80% of the benefit comes from 20% of the core optimizations (SSA value numbering, LICM, inlining, register allocation). Pushing beyond into hyper-aggressive passes yields diminishing returns while introducing stability, binary size, and compile-time liabilities.
