# Vectorization Science: SIMD, Scalable Vectors, and Compiler Proofs

## 1. Vector Architectures: SIMD vs. Scalable Vectors vs. SIMT

```
+-----------------------------------------------------------------------------------+
| 1. Fixed-Width SIMD (x86 SSE/AVX, ARM NEON)                                      |
|    - Vector width hardcoded into opcode and registers (128-bit, 256-bit, 512-bit)  |
|    - Requires separate loop peels, main vector loops, and remainder/tail loops    |
+-----------------------------------------------------------------------------------+
| 2. Scalable Vectors (ARM SVE/SVE2, RISC-V Vector RVV)                             |
|    - Vector-Length Agnostic (VLA): Hardware decides VLEN (128 to 2048 bits)       |
|    - Native predication masks; single loop handles all trip counts without tails   |
+-----------------------------------------------------------------------------------+
| 3. Single Instruction Multiple Threads (SIMT - GPUs)                              |
|    - Hardware executes 32 threads (warp) or 64 threads (wavefront) in lockstep    |
|    - Programmer writes scalar code; hardware schedules across SIMD execution units|
+-----------------------------------------------------------------------------------+
```

---

## 2. Loop Vectorization vs. SLP Vectorization

### A. Loop Vectorization
* Identifies a loop with an induction variable where iterations are independent.
* **Strip-Mining**: Transforms loop of count $N$ into an outer loop with step $V_{\text{width}}$ (e.g., 4 or 8) and unrolls the inner operation into packed vector instructions.
* **Tail Handling**: If $N \pmod{V_{\text{width}}} \ne 0$, the compiler must emit a scalar remainder loop, or use masked predication.

### B. Superword-Level Parallelism (SLP) (Larsen & Amarasinghe, 2000)
* Operates within a *single basic block* without requiring loops.
* Discovers isomorphic independent scalar operations (e.g., `x = a + b; y = c + d; z = e + f; w = g + h;`).
* Packs the operations into a single vector addition: `[x,y,z,w] = [a,c,e,g] + [b,d,f,h]`.

---

## 3. Compiler Safety Proofs and Aliasing Disambiguation

Can the compiler prove vectorization safety?
Under C/C++ pointer semantics, the compiler must assume that pointers may overlap (**aliasing**):
```c
void add_arrays(float* a, float* b, float* c, int n) {
    for (int i = 0; i < n; i++) {
        c[i] = a[i] + b[i];
    }
}
```
If pointer `c` overlaps with `a + 1`, a vector load from `a` followed by a vector store to `c` would overwrite values that subsequent iterations of `a` were supposed to read (a loop-carried Read-After-Write dependency).

### Compiler Disambiguation Strategies:
1. **Language Invariants / `restrict` keyword**:
   * If the programmer marks `float* __restrict__ c`, the compiler mathematically proves absence of aliasing and vectorizes unconditionally.
2. **Runtime Pointer Versioning (Alias Guards)**:
   * When static proof is impossible, modern compilers emit a runtime alias check:
     ```c
     if (c + n <= a || a + n <= c) && (c + n <= b || b + n <= c) {
         // Hot Path: Execute AVX2/AVX-512 Vectorized Loop
     } else {
         // Cold Path: Execute Safe Scalar Fallback Loop
     }
     ```
3. **Data Dependence Analysis (Direction & Distance Vectors)**:
   * The compiler analyzes array subscript linear equations $A[i + k]$.
   * If dependency distance $d \ge V_{\text{width}}$, vectorization is safe. If $d < V_{\text{width}}$, vectorization is illegal.

---

## 4. Gather / Scatter Pathology: When SIMD Runs Slower Than Scalar
* **Contiguous Loads (`VMOVUPS`)**: Single instruction loads 64 contiguous bytes into a register from a single cache line.
* **Gather Operations (`VGATHERDPS`)**: Loads elements from arbitrary non-contiguous memory locations (`a[indices[i]]`):
  * A 512-bit gather must load sixteen 32-bit floats.
  * In the worst case, these 16 floats reside on **16 completely distinct 64-byte cache lines**!
  * Hardware must serialize 16 distinct L1D/L2 cache accesses, 16 TLB checks, and handle potential cache misses across different memory banks.
  * **Empirical Reality**: A gather operation on scattered data often executes **2x to 5x slower** than a simple scalar loop, because the gather instruction ties up LSU reservation stations and blocks out-of-order execution.

---

## 5. AVX-512 Downclocking & Modern Mitigations
* **Historical Issue (Skylake-X / Ice Lake Client)**:
  * 512-bit vector units drew massive current ($dI/dt$).
  * The CPU voltage regulator required lowering base clock frequencies (by 15%–25%) across the entire core when 512-bit instructions were detected ("AVX frequency offset").
  * Lightly vectorized code with intermittent 512-bit operations experienced a net slowdown across the entire application.
* **Modern Mitigations (AMD Zen 5 / Intel Redwood Cove)**:
  * Zen 5 and modern Intel server cores use dedicated power rails and advanced TSMC/Intel processes where full 512-bit vector FMAs run at nominal boost frequencies with zero downclocking.
  * Modern compilers (LLVM/GCC) default to 256-bit vectorization (`-mprefer-vector-width=256`) unless explicitly overridden or when arithmetic intensity justifies 512-bit width.
