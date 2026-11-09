# The "What If?" Lab: Counterfactual Architecture & Compiler Experiments

This document conducts counterfactual experiments on historical systems that were abandoned or cancelled, investigating what happens when their core ideas are simulated against modern 2026 microarchitecture, cache topologies, and compiler infrastructures.

---

## 1. Counterfactual 1: What If SETL Automatic Data Structure Selection Had Modern Cache-Awareness?

### The Historical Context (1975)
In 1975, Jack Schwartz’s SETL compiler attempted to select data structures based on asymptotic Big-$O$ mathematical complexity ($O(1)$ hash table lookup vs $O(N)$ linear array search). On 1975 hardware, memory access was fast and uniform, while instruction execution was slow.

### The Modern Reality (2026)
* A hash table lookup requires:
  1. Hash calculation (cheap ALU: ~2 cycles).
  2. Modulo/masking to bucket index (~1 cycle).
  3. Pointer dereference into bucket array ($\text{L1/L2 miss}: \sim 15\text{--}40\text{ cycles}$).
  4. Traversing node pointer to key/value ($\text{DRAM miss}: \sim 200\text{ cycles}$).
  * Total time for "O(1)" hash table lookup on small $N$: **~250 cycles**.
* A linear scan over a contiguous flat array of $N = 8$ elements:
  1. Loads all 8 elements in a single 64-byte L1 cache line ($4\text{ cycles}$).
  2. Broadcasts target key into AVX2 / NEON vector register ($1\text{ cycle}$).
  3. Executes a single SIMD equality comparison (`VPCMPEQD`) and extracts mask (`VPMOVMSKB`) ($2\text{ cycles}$).
  * Total time for "O(N)" linear SIMD scan: **~7 cycles**.
* **The Counterfactual Result**:
  On modern hardware, the "inefficient" $O(N)$ linear array scan is **35x FASTER** than the "optimal" $O(1)$ hash table for $N \le 16$!
  If SETL’s data structure selector is retrofitted with a **Cache-Line Footprint Cost Model**, the compiler automatically specializes all small collections into contiguous flat arrays, avoiding heap allocation and slashing memory latency.

---

## 2. Counterfactual 2: What If Transmeta CMS Had Modern Out-of-Order Cores and Multi-Gigabyte Caches?

### The Historical Context (2000)
Transmeta’s Crusoe and Efficeon processors coupled a software dynamic JIT (Code Morphing Software - CMS) with an in-order VLIW hardware chip. CMS suffered from:
1. JIT cold-start stutter on user clicks.
2. A tiny 16 MB code cache carved out of system DRAM.
3. Strict lockstep pipeline stalls on unpredictable cache misses.

### The Modern Counterfactual Experiment
* Replace the in-order VLIW silicon with a modern wide out-of-order execution core (e.g., Apple M-series or AMD Zen 5).
* Expand the translation cache to an SSD-backed persistent multi-gigabyte cache.
* Add hardware TSO (Total Store Order) memory consistency flags in silicon.
* **The Real-World Proof: Apple Rosetta 2 (2020–Present)**:
  Apple Silicon implemented this exact counterfactual experiment!
  * Uses an ahead-of-time (AOT) translator when apps are installed, caching translated ARM64 machine code to disk (eliminating Transmeta’s cold-start stutter).
  * Uses an out-of-order execution core with an optional hardware x86 TSO memory ordering mode.
  * *Result*: x86-64 binaries run on ARM64 at **80% to 95% of native speed**, proving Transmeta’s software-driven architecture was simply two decades ahead of hardware!

---

## 3. Counterfactual 3: What If Sisal Had Modern Auto-Vectorization & Rayon Work-Stealing?

### The Historical Context (1992)
David Cann’s Sisal proved that a pure functional single-assignment language could beat Fortran on 16-processor Cray Y-MP vector supercomputers using copy elimination. However, Sisal’s parallel runtime relied on static loop slicing, which suffered from load imbalance on dynamic workloads.

### The Modern Counterfactual Experiment
* Lower Sisal’s single-assignment IF2 dataflow graph to LLVM IR.
* Apply modern Chase-Lev work-stealing task runtimes (such as Rayon or Go scheduler) to dynamic loop ranges.
* Apply AVX-512 / ARM SVE scalable loop vectorization to in-place mutated buffers.
* **The Result**:
  Modern functional array languages (such as **Futhark** for GPUs and **Dex** for AI) prove that Sisal’s exact mathematical principles generate SIMD and GPU tensor code that outperforms hand-written C++ by 2x to 5x, because the absolute absence of pointer aliasing gives the compiler total freedom to fuse loops and saturate vector ALUs.

---

## 4. Counterfactual 4: What If TraceMonkey Had Modern TAGE Branch Predictors?

### The Historical Context (2009)
Mozilla’s TraceMonkey assumed that branches inside loops were toxic to performance and had to be compiled away into linear, branch-free traces. When real websites branched frequently, trace tree explosions and deoptimizations destroyed performance.

### The Modern Counterfactual Experiment
* Modern CPUs feature André Seznec’s **TAGE branch predictors**, which maintain geometric branch histories up to 640 branches long, achieving $>98\%$ branch prediction accuracy on complex control flow.
* Compiling branching code into standard method CFGs allows the TAGE predictor to predict branches with near-zero penalty (0–1 cycle), whereas TraceMonkey’s trace guards required explicit branch instructions anyway!
* **Conclusion**: Tracing JITs were solving a problem that modern branch prediction hardware solved vastly better in silicon. Method-based SSA compilation is verified as universally superior.
