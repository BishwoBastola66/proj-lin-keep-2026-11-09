# Modern CPU Microarchitecture and Hardware-Aware Compilation

```text
       ┌───────────────────────────────────────────────────────────────┐
       │             Evolution of Target Microarchitectures            │
       └───────────────────────────────┬───────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
   Intel APX & AVX10.2             Arm64 & Apple M4           RISC-V Vector (RVV)
  32 GPRs (EGPR r16-r31)        Deep OoO (8-10 wide)        Vector-Length-Agnostic
 3-Operand Form, CCMP, NF       SVE2, SME Matrix Engine     Dynamic VLEN with vsetvli
```

## 1. Abstract & Context

Compilers designed in the 1980s and 1990s operated under microarchitectural assumptions that are completely invalid on modern silicon:
* **Obsolete Assumption**: Instructions execute in program order with static latencies.
* **Obsolete Assumption**: The register file is limited to 8 or 16 general-purpose registers (x86/x86-64 legacy).
* **Obsolete Assumption**: Memory access latency is roughly proportional to clock frequency.
* **Obsolete Assumption**: Reducing instruction count is always the optimal strategy.

In 2026, processors are massive out-of-order speculative execution machines featuring:
* Decode/rename widths of 6 to 10 micro-ops per cycle.
* Reorder buffer (ROB) depths exceeding 500 to 650 instructions.
* Dynamic branch predictors with multi-kilobyte TAGE-style tables.
* Massive physical register files and register renaming.
* Memory-level parallelism (MLP) with up to 64 outstanding cache misses tracked simultaneously via Miss Status Holding Registers (MSHRs).

Rubix designs its hardware model and machine synthesis around the physical realities of modern CPUs.

---

## 2. Deep Dive: Key Modern Architectures (2025–2026)

### 2.1 Intel APX (Advanced Performance Extensions)
Intel APX represents the most significant upgrade to the x86 instruction set architecture since AMD64 in 2003:
1. **Doubling General-Purpose Registers (16 $\to$ 32 GPRs)**:
   * Adds `r16` through `r31` (EGPRs / Extended GPRs).
   * Reduces memory loads by up to **22%** and memory stores by up to **20%** compared to legacy x86-64 code.
2. **Three-Operand Non-Destructive Instructions**:
   * Legacy x86 required destructive two-operand forms: `mov dst, src1; add dst, src2`.
   * APX introduces direct non-destructive forms: `add r16, rdi, rsi` (via the new REX2 and EVEX prefixes).
3. **No-Flags (NF) Operations**:
   * Instructions can execute without updating the status flags register (`EFLAGS`), eliminating false dependencies between arithmetic operations and branches.
4. **Conditional Instructions (CCMP / CTEST)**:
   * Enables conditional compare operations directly in the execution pipeline, reducing branch misprediction penalties by converting branchy code into straight-line conditional operations.

### 2.2 Intel AVX10.2
* Unifies vector processing across performance cores (P-cores) and efficiency cores (E-cores).
* Provides a consistent vector ISA with both 256-bit and 512-bit vector lengths, embedded rounding modes, and 32 vector registers (`ymm0-ymm31` / `zmm0-zmm31`).
* Resolves the historical problem of AVX-512 being disabled on hybrid client processors (Alder Lake through Raptor Lake).

### 2.3 Arm64, ARMv9, and Apple Silicon M3/M4
* **Extreme Decode Width**: Apple M3/M4 architectures feature an 8- to 10-wide instruction decode engine and reorder buffers exceeding 600 entries.
* **Arm SVE2 & SME**: Scalable Vector Extension 2 and Scalable Matrix Extension allow vector and matrix code to scale automatically with hardware vector register widths (from 128 bits up to 2048 bits).
* **MTE & BTI**: Hardware Memory Tagging Extension and Branch Target Identification provide microarchitectural CFI (Control-Flow Integrity) and spatial memory safety.

### 2.4 RISC-V Vector Extension (RVV 1.0 / RVA23)
* Unlike fixed-width SIMD (x86 AVX, Arm NEON), RVV is **Vector-Length-Agnostic (VLA)**.
* The instruction `vsetvli` dynamically configures vector length based on hardware `VLEN` and application requirements.
* A single binary compiled for RISC-V Vector runs natively on embedded 128-bit cores and server-grade 512-bit or 1024-bit supercomputing cores without recompilation.

---

## 3. Microarchitectural Optimization Principles in Rubix

### 3.1 Store-to-Load Forwarding Awareness
When a write is followed immediately by a read from the same memory location, modern CPUs forward the data directly from the Store Buffer to the Load Queue without accessing the L1 cache.
* **Hazard**: If the read is of a different size or unaligned offset compared to the write (e.g., storing 64-bit integer, then reading two 32-bit halves), store-forwarding fails, causing a 12–20 cycle pipeline stall.
* **Rubix Mitigation**: In [compiler/middle/memory_layout.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/memory_layout.bix), struct fields are aligned to natural boundaries, and stack slots for local variables are laid out to guarantee exact size-and-offset matching.

### 3.2 Micro-op Fusion and Macro-Fusion
Modern decoders fuse adjacent instruction pairs into a single micro-op:
* `cmp` followed by `jcc` is macro-fused into a single branch micro-op.
* In [compiler/backend/emitter.bix](file:///home/bishwaxyz/translator/rubix/compiler/backend/emitter.bix), conditional jumps are generated immediately adjacent to their test/compare instructions to guarantee macro-fusion on x86-64.

### 3.3 Instruction Cache Alignment & Branch Padding
* Modern branch prediction units fetch instructions in 32-byte or 64-byte blocks.
* Loop headers and function entry points are padded to 16-byte or 32-byte boundaries (`.p2align 4`), preventing loop entry instructions from straddling cache lines.

---

## 4. The Rubix Hardware Model (RUMS Evolution)

In [compiler/rums/machdesc.bix](file:///home/bishwaxyz/translator/rubix/compiler/rums/machdesc.bix) and [compiler/rums/regalloc.bix](file:///home/bishwaxyz/translator/rubix/compiler/rums/regalloc.bix), the machine descriptor is expanded to model:
1. **Register Classes**:
   * General Purpose (GPR: 16 scalar on standard x86, 32 scalar on APX/Arm64).
   * Floating Point / Vector (FPR/VR: 16 to 32 entries).
2. **Calling Conventions**:
   * SysV AMD64: 6 argument GPRs (`rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9`).
   * Win64: 4 argument GPRs (`rcx`, `rdx`, `r8`, `r9`) + 32-byte shadow spill.
   * AAPCS64: 8 argument GPRs (`x0` through `x7`).
   * RISC-V LP64: 8 argument GPRs (`a0` through `a7`).

---

## 5. Summary

A sovereign native compiler must treat the underlying CPU not as an abstract Turing machine, but as a complex physical pipeline. By tailoring code generation to 32-register sets, uop fusion patterns, and memory-forwarding rules, Rubix achieves peak hardware utilization across x86-64, Arm64, and RISC-V.
