# Vectorization, SIMD Architectures, and Data-Parallel Synthesis

## 1. Introduction: From Instruction-Level to Data-Level Parallelism

As CPU clock scaling encountered the thermal dissipation limit ("Power Wall", ~2005), hardware manufacturers transitioned from frequency scaling to parallelism:
1. Multi-Core parallelism (MIMD).
2. **Single Instruction, Multiple Data (SIMD / Vectorization)**: Executing one mathematical operation across multiple data elements simultaneously.

In modern hardware, scalar arithmetic utilizes only a fraction of silicon capacity; utilizing vector units can deliver a **$4\times$ to $16\times$ throughput speedup**.

---

## 2. Microarchitectural Vector Landscape

```text
x86-64:    SSE (128-bit) ──► AVX/AVX2 (256-bit) ──► AVX-512 (512-bit) ──► AVX10.2 / APX
Arm64:     NEON (128-bit) ─────────────────────► SVE / SVE2 (Scalable) ──► SME (Matrix)
RISC-V:    Baseline Scalar ────────────────────► RISC-V Vector (RVV, VLEN Scalable)
```

| Architecture | Vector Width | Register Count | Distinctive Features | Optimization Considerations |
|:---|:---:|:---:|:---|:---|
| **x86 AVX2** | 256 bits | 16 registers (`ymm0–15`) | 4 x 64-bit or 8 x 32-bit floats/ints. | Ubiquitous on Intel Core & AMD Zen 2–5. |
| **x86 AVX-512** | 512 bits | 32 registers (`zmm0–31`) | Per-element opmask predication (`k0–k7`). | Frequency downclocking on older Intel Skylake (resolved in Zen 4/5). |
| **Intel AVX10.2 / APX** | 256 / 512 bits | **32 GPRs** + 32 Vector | APX adds 16 new general-purpose registers (`r16–r31`) and 3-operand forms. | APX reduces memory spills by up to 25%; AVX10 unifies P-core & E-core vector ISAs. |
| **Arm NEON** | 128 bits | 32 registers (`v0–v31`) | Fixed 128-bit execution across mobile & server. | Universal across Apple Silicon, AWS Graviton, and Android. |
| **Arm SVE2 / SME** | Scalable (128–2048b)| 32 scalable vectors | Vector-Length Agnostic (VLA); predicate registers. | Code compiled once executes across 128-bit to 512-bit hardware implementations. |
| **RISC-V Vector (RVV)** | Scalable (`VLEN`) | 32 vector registers | Vector configuration via `vsetvli`; fractional vector registers (`LMUL`). | Standard in modern high-performance RISC-V cores. |

---

## 3. The Auto-Vectorization Dilemma in C/C++

In classical C and C++ compilers (GCC, LLVM), auto-vectorization routinely fails because the compiler cannot mathematically prove:
1. **Pointer Non-Aliasing**: If pointers `a` and `b` might overlap in memory, vectorizing `a[i] = b[i] + c[i]` produces incorrect results if a store overwrites a subsequent read. The compiler is forced to emit expensive runtime alias check blocks.
2. **Side-Effect Purity**: If a loop invokes a function, the compiler cannot vectorize the loop unless the function is proven pure.

---

## 4. The Rubix Solution: Semantic Vectorization

Rubix solves the auto-vectorization barrier through its unified type and effect system:

### 4.1 Proof of Non-Aliasing via Affine Uniqueness
Because affine handles guarantee single ownership, and region arena slices guarantee distinct non-overlapping sub-allocations, the Rubix optimizer knows statically that array inputs do not alias:
$$\forall i, j, \quad \&\text{dest}[i] \ne \&\text{src}[j]$$
Zero runtime pointer check preambles are required; the compiler directly emits aligned vector loads and stores (`VMOVUPS` / `VADDPS`).

### 4.2 Effect-Verified Pure Loop Transformations
When a loop body contains calls marked `effect(pure)`, the loop vectorizer is mathematically guaranteed that no function call writes to hidden global memory or triggers an I/O side effect. Loops containing pure transformations are auto-vectorized directly to SIMD machine instructions without developer pragmas.
