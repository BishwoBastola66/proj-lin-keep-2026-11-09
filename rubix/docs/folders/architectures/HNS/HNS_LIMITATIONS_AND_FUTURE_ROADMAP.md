# HNS Limitations & Superoptimization Roadmap

> **Status**: Canonical Accepted  
> **Classification**: Architectural Limits & Strategic Horizons  
> **Subsystem**: Hyper-Stride Native Synthesis (HNS & HNS-Hyperflux)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification articulates the known algorithmic boundaries, register allocation trade-offs, and microarchitectural constraints of **Hyper-Stride Native Synthesis (HNS)** and **HNS-Hyperflux**, alongside the future research roadmap for **Automated SMT Superoptimization** and **Neural/Heterogeneous Hardware Synthesis**.

---

## 2. Acknowledged Algorithmic & Hardware Limitations

### 2.1 The Stencil Combinatorial Explosion Limit
* **Constraint**: A naive implementation of copy-and-patch compilation requires pre-generating a unique stencil for every combination of opcode, operand size (8, 16, 32, 64-bit), and addressing mode. For an instruction set like x86-64, this would require over 100,000 distinct machine templates.
* **Mitigation**: HNS employs **Parameterized Generic Stencils with Register Holes**. Instead of baking fixed register encodings into distinct stencils, register indices are encoded as relocatable 3-bit / 4-bit nibbles patched dynamically, reducing the required template count to under 1,200 stencils per architecture.

### 2.2 Fast-Lane Register Spilling vs Global Graph Coloring
* **Constraint**: Because the Fast Lane compiles in a single pass without an interference graph, long-lived variables in extremely large mathematical expressions ($>50$ live variables) must occasionally spill to the stack frame, incurring a small (3–7%) execution throughput penalty relative to heavily-optimized LLVM `-O3` binaries.
* **Mitigation**: The background Deep Lane (`DL-BBEL`) and Polyhedral Stencil Coalescing (`PJSC`) optimizer detect hot loops and asynchronously re-synthesizes register-perfect native machine code while the fast-lane binary is already running.

### 2.3 Single-Pass Whole-Program Inlining Horizon
* **Constraint**: In pure single-pass streaming compilation, a function cannot be inlined before its source definition has been parsed. Calls to functions declared later in the translation unit cannot be inlined on the fly.
* **Mitigation**: HNS reserves 16-byte padding stencils at forward callsites; if the subsequent function definition is small ($\le 3$ instructions), the patcher converts the call into an inlined block during the fixup phase.

---

## 3. Superoptimization & Heterogeneous Acceleration Roadmap

```
[Phase 1: 2026-2027] SMT-Driven Stencil Superoptimization
  └── Use Z3 / Rosette SMT solvers to prove mathematically optimal machine stencils for PCMSS.
        │
        ▼
[Phase 2: 2027-2029] Native Heterogeneous Synthesis
  └── Extend stencils to GPU compute shaders (SPIR-V) and neural NPU accelerators.
        │
        ▼
[Phase 3: 2029-2032] Hardware-Synthesized Co-Processors
  └── Direct FPGA bitstream synthesis from Rubix source code using HNS machine pipelines.
```

### SMT Superoptimization Verification Standard
Every stencil admitted into `PCMSS` must undergo automated SMT verification:
$$\forall \vec{x} \in \text{Inputs},\quad \text{Semantics}_{\text{Spec}}(\vec{x}) \equiv \text{Execute}_{\text{Stencil}}(\vec{x})$$
This guarantees that no fast-lane machine stencil will ever produce undefined behavior, silent overflow, or arithmetic drift.
