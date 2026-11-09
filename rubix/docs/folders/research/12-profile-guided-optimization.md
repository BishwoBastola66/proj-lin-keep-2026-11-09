# Profile-Guided Optimization (PGO) and Binary-Level Layout Synthesis

## 1. Introduction: The Limits of Static Heuristics

Static compilers are fundamentally handicapped: they must optimize code without knowing the runtime data distribution. When a compiler encounters a branch:
```text
if (condition) {
    branch_A();
} else {
    branch_B();
}
```
A static compiler must guess which path is more likely based on syntactic heuristics (e.g., assuming error checks are unlikely). If the guess is wrong:
1. The CPU branch predictor incurs misprediction penalties (~15–20 cycles).
2. The instruction cache (I-Cache) is polluted with cold code.
3. Inlining decisions bloat binary sizes without improving hot-path throughput.

**Profile-Guided Optimization (PGO)** feeds real execution profiles back into the compilation pipeline, replacing guesses with measured empirical probabilities.

---

## 2. PGO Architectures Compared

| Paradigm | Workflow | Instrumentation Overhead | Profile Fidelity |
|:---|:---|:---:|:---:|
| **Instrumented PGO (GCC / Clang `-fprofile-generate`)** | Compile with counters $\to$ Run workload $\to$ Recompile with profile | High ($2\times\text{--}5\times$ slowdown during collection) | Exact edge and call counts |
| **Sample-Based PGO (AutoFDO / Linux `perf`)** | Run production binary $\to$ Sample hardware counters (LBR) $\to$ Recompile | Near zero ($\le 2\%$ overhead) | Statistical approximation |
| **Post-Link Binary Optimization (LLVM BOLT / Propeller)** | Inspect compiled ELF binary $\to$ Reorder basic blocks directly | Zero source compilation overhead | Maximum I-Cache and branch optimization ($5\%\text{--}15\%$ speedup) |

---

## 3. Core PGO Transformations in Rubix

Rubix integrates profiling directly through its native CLI (`rubix profile`) and feedback compiler:

### 3.1 Branch Weighting & Fall-Through Layout
In modern CPUs, conditional branches where the branch is **not taken** (fall-through) execute with near-zero latency because instructions are pre-decoded in sequence:
* The hot path is aligned sequentially as fall-through code.
* The cold path is converted into a jump target positioned outside the primary instruction cache line.

### 3.2 Hot/Cold Function Partitioning
Functions invoked during initialization or error recovery are segregated into a `.text.cold` section. Hot functions are packed tightly into `.text.hot` to maximize L1 Instruction Cache (L1-I) and Instruction TLB (iTLB) hit rates.

### 3.3 Value Profiling & Specialization
If profiling shows that a dynamic parameter $X$ equals a specific constant (e.g., $X = 64$) in $95\%$ of invocations:
```text
if (X == 64) {
    specialized_fast_path_64(); // Fully unrolled, zero division
} else {
    generic_slow_path(X);
}
```
The specialized path enables complete loop unrolling and eliminates general integer division.
