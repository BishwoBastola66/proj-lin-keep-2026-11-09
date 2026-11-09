# Cache Locality, Loop Tiling, and Why Faster CPUs Fail on Memory-Bound Workloads

## 1. The Core Paradox: Why Faster CPUs Do Not Accelerate Memory-Bound Workloads
Consider a workload whose arithmetic intensity is low, such that it spends 90% of its execution cycles stalled on main memory bandwidth and only 10% performing ALU operations.
Suppose hardware architects replace a 3 GHz CPU with a next-generation 6 GHz CPU (2x clock speed) with double the ALU execution ports, while leaving the DRAM memory bus identical (e.g., dual-channel DDR5 at 80 GB/s).

### Mathematical Proof via Amdahl's Law
Let $T_{\text{orig}} = T_{\text{compute}} + T_{\text{memory}} = 10\text{ s} + 90\text{ s} = 100\text{ s}$.
The CPU compute speedup is $S_{\text{compute}} = 2.0$. The memory subsystem speedup is $S_{\text{memory}} = 1.0$.
$$T_{\text{new}} = \frac{T_{\text{compute}}}{2.0} + \frac{T_{\text{memory}}}{1.0} = \frac{10\text{ s}}{2.0} + 90\text{ s} = 5\text{ s} + 90\text{ s} = 95\text{ s}$$
The overall speedup is:
$$\text{Speedup} = \frac{T_{\text{orig}}}{T_{\text{new}}} = \frac{100\text{ s}}{95\text{ s}} = 1.0526 \quad (\text{only a } 5.26\% \text{ gain!})$$
Despite spending massive power and silicon budget to double CPU execution capacity, the end-to-end program runs barely 5% faster. The workload is strictly bounded by the **DRAM Bandwidth and Latency Ceiling**.

---

## 2. Arithmetic Intensity & The Roofline Model (Williams et al., 2009)
* **Arithmetic Intensity ($I$)**: The ratio of work (FLOPs or useful integer operations) performed per byte of DRAM memory traffic:
  $$I = \frac{\text{Total Operations}}{\text{Total Bytes Transferred from Memory}} \quad [\text{FLOPs/Byte}]$$
* **The Roofline Formula**:
  $$\text{Attainable Performance } P = \min\left(P_{\text{peak\_compute}}, \; I \times B_{\text{peak\_bandwidth}}\right)$$
* **The Inflection Point ($I^*$)**:
  $$I^* = \frac{P_{\text{peak\_compute}}}{B_{\text{peak\_bandwidth}}}$$
  * If $I < I^*$: The program is **Memory-Bound**. Increasing CPU FLOP/s or clock rate has ZERO effect on performance. The only ways to improve speed are:
    1. Increase memory bandwidth ($B$).
    2. Restructure the algorithm to increase arithmetic intensity ($I$) using cache locality.
  * If $I > I^*$: The program is **Compute-Bound**.

---

## 3. Case Study: Naive vs. Cache-Blocked (Tiled) Matrix Multiplication

Let $A, B, C$ be $N \times N$ matrices of 64-bit double-precision floats ($8$ bytes/element), computing $C = A \times B$:
$$\text{Total Floating-Point Operations} = 2 N^3 \text{ FLOPs}$$

### A. The Naive Algorithm ($i \text{-} j \text{-} k$ loops)
```c
for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
        double sum = 0.0;
        for (int k = 0; k < N; k++) {
            sum += A[i][k] * B[k][j]; // Column traversal of B!
        }
        C[i][j] = sum;
    }
}
```
* **Memory Access Pattern**:
  * Matrix $A$ is read row by row (good spatial locality).
  * Matrix $B$ is read column by column ($B[k][j]$ stride is $N \times 8$ bytes).
  * For $N = 2048$, each access to $B$ jumps $16,384$ bytes away, guaranteeing a cache line miss on almost every inner loop iteration!
* **Memory Traffic**:
  * Every element of $B$ is loaded into cache from DRAM $N$ separate times.
  * Total memory bytes transferred $\approx N \times (N^2 \times 8\text{ B}) = 8 N^3\text{ Bytes}$.
* **Arithmetic Intensity**:
  $$I_{\text{naive}} = \frac{2 N^3\text{ FLOPs}}{8 N^3\text{ Bytes}} = 0.25\text{ FLOPs/Byte}$$
  * On a modern system with peak memory bandwidth of $80\text{ GB/s}$, the maximum possible performance is:
    $$P_{\text{max}} = 0.25\text{ FLOP/B} \times 80\text{ GB/s} = 20\text{ GFLOP/s}$$
  * Even if the CPU has a theoretical peak of $2,000\text{ GFLOP/s}$, the CPU operates at only **1% of its silicon capability**!

---

### B. The Cache-Tiled Algorithm ($B \times B$ Blocks)
Partition matrices into square blocks of size $S \times S$ such that three sub-matrices ($A_{\text{sub}}, B_{\text{sub}}, C_{\text{sub}}$) fit completely inside the CPU L1/L2 cache:
$$3 \times S^2 \times 8\text{ Bytes} \le \text{Cache Size}$$
For a 512 KB L2 cache, choosing $S = 64$ requires $3 \times 64^2 \times 8 = 98.3\text{ KB} \ll 512\text{ KB}$.

```c
for (int ii = 0; ii < N; ii += S) {
    for (int kk = 0; kk < N; kk += S) {
        for (int jj = 0; jj < N; jj += S) {
            // Inner kernel operates entirely inside L1/L2 cache!
            for (int i = ii; i < ii + S; i++) {
                for (int k = kk; k < kk + S; k++) {
                    for (int j = jj; j < jj + S; j++) {
                        C[i][j] += A[i][k] * B[k][j];
                    }
                }
            }
        }
    }
}
```
* **Memory Traffic with Tiling**:
  * Each block of size $S \times S$ is loaded from DRAM into L2 cache once and reused $S$ times across the inner loop before being evicted.
  * Total memory bytes transferred from DRAM $\approx \frac{8 N^3}{S}\text{ Bytes}$.
* **Arithmetic Intensity**:
  $$I_{\text{tiled}} = \frac{2 N^3\text{ FLOPs}}{\frac{8 N^3}{S}\text{ Bytes}} = \frac{S}{4}\text{ FLOPs/Byte}$$
  * For block size $S = 64$:
    $$I_{\text{tiled}} = \frac{64}{4} = 16.0\text{ FLOPs/Byte}$$
  * Arithmetic intensity increases by a factor of **64x**!
  * With $I = 16.0\text{ FLOPs/Byte}$ and $80\text{ GB/s}$ DRAM bandwidth:
    $$\text{Attainable Performance} = 16.0 \times 80\text{ GB/s} = 1,280\text{ GFLOP/s}$$
  * Tiling shifts the workload from severely memory-bound into compute-bound territory, yielding a measured **20x to 50x end-to-end speedup** purely by rearranging loop order without changing the machine code instruction set or CPU hardware!

---

## 4. Empirical Measurements Across CPU Generations
Modern multi-generational hardware studies (e.g., comparing Intel Skylake $\to$ Ice Lake $\to$ Sapphire Rapids or AMD Zen 2 $\to$ Zen 3 $\to$ Zen 4) document the following empirical findings:
1. **Un-tiled / Bandwidth-bound workloads**: Running an un-tiled large stencil or naive matrix operation shows almost zero performance delta between an 8-core CPU and a 64-core CPU on the same memory bus, because all 64 cores bottleneck on the same memory controller queue.
2. **AMD 3D V-Cache Impact**: On workloads whose working set is 40–90 MB (e.g., game simulation physics, CAD rendering, database join kernels), AMD Zen 3/Zen 4 X3D processors demonstrate up to **30%–80% higher throughput** over non-V-Cache variants running at identical or higher clock speeds, solely because the working set avoids DRAM roundtrips.
3. **Compiler Implication**: In compilers, transforming code to preserve spatial and temporal cache locality (loop interchange, loop blocking, structure splitting, struct-of-arrays) has orders of magnitude greater performance impact than instruction-level micro-optimizations like peephole instruction swaps.
