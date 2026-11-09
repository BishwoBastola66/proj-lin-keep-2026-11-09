# Architecture Catalog & Systems Taxonomy

> **Standard**: Comprehensive catalog of all baseline, upgraded, and newly introduced architectures across the Rubix, EIA, and HNS ecosystems.  
> **Status**: Canonical Accepted Architecture Taxonomy  
> **Last Updated**: October 2026

---

## 1. Architectural Taxonomy Overview

The Rubix architectural universe is categorized into four tiers:
1. **Core Subsystems**: Baseline architectures derived from repository research.
2. **Upgraded Architectures (Next-Gen)**: Existing systems significantly enhanced with new research and microarchitectural breakthroughs.
3. **New Novel Architectures**: Completely new architectural systems created to solve cross-cutting, persistent, and deep-future problems.
4. **Cohabitation & Unified Frameworks**: Integrated multi-system execution substrates.

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                        RUBIX ARCHITECTURAL TAXONOMY MATRIX                                    |
+───────────────────────────+───────────────────────────+───────────────────────────────────────────────────────+
| System Tier               | System Name & Codename    | Architectural Role & Core Innovation                  |
+───────────────────────────+───────────────────────────+───────────────────────────────────────────────────────+
| Baseline EIA              | EIA Baseline              | Universal Container Elimination (UPBP) & Hologram Σ_∞ |
| Upgraded EIA              | EIA-Omega (EHSC)          | Autonomic Microarch Adaptation & Merkle Contract Net  |
| Baseline HNS              | HNS / ZWNS Baseline       | 6-Vector Sub-ms Compiler (PCMSS, RAMC, DDZRE)         |
| Upgraded HNS              | HNS-Hyperflux (ZLFSNS)    | SIMD Vector Token Streaming & Polyhedral JIT Stencils |
| Unified Baseline          | EIA-HNS Cohabitation      | Layered integration of Hologram + Stencil Engine      |
| Upgraded Unified          | SAES (Sovereign Substrate)| Continuous Hot-Splicing Execution Fabric (0.000 ns)   |
| New Rubix Architecture 1  | Rubix-Autonomic (ANSCS)   | Differentiable Syntax & Agent-Native Semantic AST     |
| New Rubix Architecture 2  | Rubix-Chrono (TSPMA)      | NVRAM / CXL Zero-Serialization Persistent Memory      |
| New Rubix Architecture 3  | Rubix-Aegis (CNCSS)       | CHERI 128-Bit Hardware Capability Security Substrate  |
+───────────────────────────+───────────────────────────+───────────────────────────────────────────────────────+
```

---

## 2. Baseline Architecture Specifications

### 2.1 EIA Baseline (Eternal Interface Architecture)
* **Identifier**: `ARCH-EIA-BASE`
* **Governing Maxim**: *"The file format is not a law of physics; it is a superficial container. The interface is not a set of register offsets; it is a mathematical invariant."*
* **Core Mechanisms**:
  - **The Universal Hologram ($\Sigma_\infty$)**: 46-byte invariant cryptographic contract declaring types, affine lifecycles, effects, and capability bounds.
  - **Universal Polyglot Binary Packaging (UPBP)**: Single binary artifact booting across Windows (`MZ`), Linux (`\x7fELF`), and macOS (`Mach-O`).
  - **In-Memory JIT Displacement Hole Patching**: Resolves struct layout drift at load time with zero runtime indirection penalty.
  - **Dual Virtual Alias Mapping (`DVAM`)**: $W \oplus X$ enforcement with zero system calls and zero TLB shootdowns.
* **Specification Documents**:
  - [`EIA/EIA_ARCHITECTURE_OVERVIEW.md`](EIA/EIA_ARCHITECTURE_OVERVIEW.md)
  - [`EIA/EIA_FOUNDATIONAL_PRINCIPLES.md`](EIA/EIA_FOUNDATIONAL_PRINCIPLES.md)
  - [`EIA/EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md`](EIA/EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)

### 2.2 HNS Baseline (Hyper-Stride Native Synthesis / ZWNS)
* **Identifier**: `ARCH-HNS-BASE`
* **Governing Maxim**: *"The fastest compiler is not the compiler that performs the fewest optimizations; it is the compiler that performs the least unnecessary work."*
* **Core Mechanisms**:
  - **Pre-Computed Machine Stencils (`PCMSS`)**: Copy-and-patch code emission in 4–6 clock cycles per node.
  - **Fine-Grained Semantic Query Graph with Fragment Splicing (`FSQG-Splice`)**: Recompiles single functions and hot-patches RAM in 50–150 microseconds.
  - **Resident Arena Memory Continuum (`RAMC`)**: 16MB bump arenas locked in memory with 0.2 ms turnaround via `rubix server`.
  - **Demand-Driven Zero-Runtime Envelope (`DDZRE`)**: Emits 174-byte direct-syscall native binaries with 150-microsecond startup.
  - **Branchless Speculative Inline Selection (`BSIS`)**: Lowers conditionals to `CMOVcc`/`CSEL`, eliminating pipeline flushes.
  - **Dual-Lane Escalation Ladder (`DL-BBEL`)**: Sub-1ms Fast Lane vs profiling-proven Deep Lane.
* **Specification Documents**:
  - [`HNS/HNS_ARCHITECTURE_OVERVIEW.md`](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
  - [`HNS/HNS_FOUNDATIONAL_PRINCIPLES.md`](HNS/HNS_FOUNDATIONAL_PRINCIPLES.md)
  - [`HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md`](HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)

---

## 3. Upgraded Architectures (Next-Gen)

### 3.1 Upgraded EIA: `EIA-Omega` (Eternal Holographic Semantic Continuum - EHSC)
* **Identifier**: `ARCH-EIA-OMEGA`
* **Why Upgraded**: Baseline EIA solved struct offset drift and static container lock-in on standard CPUs. However, modern 2026 systems face accelerator ISA fragmentation (Intel APX 32 GPRs, ARM SVE2, Apple AMX, RISC-V VLEN) and distributed decentralized supply-chain attacks.
* **New Breakthrough Capabilities**:
  1. **Autonomic Microarchitecture Adaptation (AMA)**:
     - Upon execution, the embedded ARLL-Agent queries CPUID/HWCAP and synthesizes the optimal vector width and register calling convention. On Intel APX hardware, it expands argument passing from 6 to 16 GPRs autonomously, eliminating all stack spills.
  2. **Cryptographic Semantic Contract Ledger (CSCL)**:
     - Interface signatures are recorded in a hierarchical BLAKE3 Merkle Tree. Library updates undergo cryptographic verification: breaking changes trigger automated semantic shim synthesis, while non-breaking changes are linked with $O(1)$ verification time.
  3. **Autonomous Foreign Gateway Fabric (AFGF)**:
     - Dynamically generates bidirectional zero-copy bridges between Rubix affine handles and external C, C++, Rust, and WebAssembly components without requiring manual `bindgen` or `libffi` shims.
* **Specification Documents**:
  - [`EIA/EIA_ARCHITECTURE_OVERVIEW.md#section-4`](EIA/EIA_ARCHITECTURE_OVERVIEW.md)
  - [`ADR/ADR-0001-eia-semantic-hologram.md`](ADR/ADR-0001-eia-semantic-hologram.md)

### 3.2 Upgraded HNS: `HNS-Hyperflux` (Zero-Latency Flux-Stream Native Synthesis - ZLFSNS)
* **Identifier**: `ARCH-HNS-HYPERFLUX`
* **Why Upgraded**: Baseline HNS compiles 10,000 lines in 0.35 ms using character-by-character lexing and basic stencil copying. On 64-core systems with AVX-512 and massive codebases, compiler throughput can be accelerated by an order of magnitude.
* **New Breakthrough Capabilities**:
  1. **Flux-Stream Vectorized Tokenizer (FS-VT)**:
     - Employs SIMD/SWAR vector instructions (`_mm512_cmpeq_epi8_mask`) to tokenize 64 source characters per clock cycle, accelerating lexing throughput to $>8\text{ GB/s}$.
  2. **Polyhedral JIT Stencil Coalescing (PJSC)**:
     - In the Deep Lane, loop nests are analyzed using affine polyhedral integer set relations without building whole-function LLVM IR. Stencils for consecutive loop iterations are coalesced into vector SIMD instructions directly in memory.
  3. **Zero-Copy Hot-Patching Virtual Ring (ZC-HPVR)**:
     - Eliminates OS thread pauses during fragment splicing by publishing atomic pointer updates with release memory ordering (`stlr` / `lock cmpxchg`), allowing running threads to transition smoothly to newly synthesized code fragments with zero downtime.
* **Specification Documents**:
  - [`HNS/HNS_ARCHITECTURE_OVERVIEW.md#section-4`](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
  - [`ADR/ADR-0002-hns-machine-stencils.md`](ADR/ADR-0002-hns-machine-stencils.md)

---

## 4. New Novel Architectures for Rubix

### 4.1 `Rubix-Autonomic`: Autonomic Neural-Symbolic Compiler Subsystem (ANSCS)
* **Identifier**: `ARCH-RUBIX-AUTONOMIC`
* **Problem Solved**: High-level AI and data science rely on Python glued to C++/CUDA via fragile bindings (Ousterhout's Dichotomy), while neural network models suffer heavy JIT compilation jitter when input sequence lengths change dynamically.
* **Architecture Design**:
  - **Differentiable Syntax & First-Class Gradient Operators**: Functions marked with `@differentiable` automatically synthesize reverse-mode automatic differentiation stencils at syntax time. Forward activations are preserved via affine lifetime rules, eliminating the autograd heap tape.
  - **Agent-Native Semantic Reflection (ANSR)**: The compiler exposes typed semantic AST nodes, effect bitmasks, and capability proofs directly to AI coding agents via a structured in-memory API (`/dev/rubix_semantic`), allowing AI agents to synthesize, verify, and patch code autonomously.
* **Specification Document**: [`RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md#proposal-1`](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)

### 4.2 `Rubix-Chrono`: Time-Space Persistent Memory Architecture (TSPMA)
* **Identifier**: `ARCH-RUBIX-CHRONO`
* **Problem Solved**: Modern distributed and database systems spend up to 50% of CPU cycles serializing and deserializing data structures (JSON, Protobuf, Flatbuffers) and writing to disk via slow Write-Ahead Logging (WAL).
* **Architecture Design**:
  - **Zero-Serialization In-Memory Structs**: Data structures are stored in byte-identical format in Non-Volatile Memory (NVRAM / CXL 3.0). Pointers are encoded as 64-bit region-relative offsets.
  - **Hardware-Atomic Persistence Barriers**: Replaces heavy WAL two-phase commits with single-instruction hardware cache flush primitives (`clwb` + `sfence`), delivering microsecond transaction durability.
* **Specification Document**: [`RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md#proposal-2`](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)

### 4.3 `Rubix-Aegis`: CHERI-Native Capability Security Substrate (CNCSS)
* **Identifier**: `ARCH-RUBIX-AEGIS`
* **Problem Solved**: Conventional 64-bit pointer architectures treat memory addresses as unconstrained integers, enabling spatial (buffer overflow) and temporal (use-after-free) vulnerabilities that constitute 70% of historical CVEs.
* **Architecture Design**:
  - **128-Bit Architectural Hardware Capabilities**: Native integration with CHERI (Capability Hardware Enhanced RISC Instructions) silicon (Arm Morello, RISC-V CHERI). Every pointer carries hardware-enforced base, bounds, permissions, and a 1-bit unforgeable validity tag.
  - **Tag-Preserving Capability Cast (`TPCC`)**: Prevents capability tag clearing across binary boundaries, delivering mathematical hardware memory safety without runtime software bounds checks.
* **Specification Document**: [`RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md#proposal-3`](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)

---

## 5. Cohabitation & Unified Frameworks

### 5.1 The Sovereign Autonomic Execution Substrate (SAES)
* **Identifier**: `ARCH-EIA-HNS-UNIFIED`
* **The Symbiotic Synthesis**:
  - **HNS acts as the Engine**: Synthesizes verified machine bytes in $<0.35\text{ ms}$.
  - **EIA acts as the Substrate**: Projects those machine bytes into running process memory, binding calling conventions, patching struct displacements, and enforcing $W \oplus X$ security.
  - **Together**: They achieve **Zero-Recompilation Continuous Evolution**. Developers edit source code, HNS compiles the edited function in 50 microseconds, EIA patches the call displacement in RAM in 0.000 ns, and execution continues at native hardware speed with zero server restarts.
* **Specification Documents**:
  - [`EIA_HNS_UNIFIED/UNIFIED_REFERENCE_ARCHITECTURE.md`](EIA_HNS_UNIFIED/UNIFIED_REFERENCE_ARCHITECTURE.md)
  - [`EIA_HNS_UNIFIED/INTEGRATION_CONTRACTS_AND_INTERFACES.md`](EIA_HNS_UNIFIED/INTEGRATION_CONTRACTS_AND_INTERFACES.md)
  - [`EIA_HNS_UNIFIED/SHARED_AND_INDEPENDENT_BOUNDARIES.md`](EIA_HNS_UNIFIED/SHARED_AND_INDEPENDENT_BOUNDARIES.md)
