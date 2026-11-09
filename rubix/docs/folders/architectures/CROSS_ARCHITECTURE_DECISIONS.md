# Cross-Cutting Architectural Decisions

> **Status**: Canonical Accepted  
> **Classification**: Global Architecture Governance  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document establishes the binding cross-cutting architectural decisions that apply uniformly across all Rubix subsystems, including EIA-Omega, HNS-Hyperflux, the Sovereign Autonomic Execution Substrate (SAES), and the novel Rubix computing architectures (Autonomic, Chrono, Aegis, Harmonic).

These decisions prevent architectural divergence, ensure bit-level compatibility across boundaries, and eliminate architectural friction between independent components.

---

## 2. Core Cross-Cutting Decisions

### CAD-001: Universal Endianness and Word Width
* **Decision**: All internal data representations, binary headers, relocation records, and network-serialized structures across all Rubix subsystems are strictly **64-bit Little-Endian (LE64)**.
* **Rationale**: Over 99% of contemporary and projected computing targets (x86-64, ARM64, RISC-V 64) execute in little-endian byte order. Big-endian targets (e.g., s390x) must perform byte-swapping at the I/O boundary. Standardizing on LE64 eliminates endianness checks in high-speed stencil splicing and holographic hole patching.
* **Subsystems Affected**: EIA-Omega (UPBP headers), HNS-Hyperflux (PCMSS holes), SAES (SRT layout), Rubix-Chrono (NVRAM persistence).

### CAD-002: Struct Memory Packing and Explicit Alignment
* **Decision**: All struct types exposed across module or process boundaries must adhere to **Natural Power-of-Two Alignment with Zero Implicit Padding**. Compilers must order struct fields in descending order of alignment or make padding bytes explicit and zero-initialized.
* **Rationale**: Implicit compiler-inserted padding creates information leakage security vulnerabilities and causes silent ABI breakage when compilers change packing heuristics. Explicit zero-padded layouts guarantee bitwise determinism and deterministic Merkle tree contract generation in `CSCL`.
* **Subsystems Affected**: EIA Semantic Hologram, HNS Machine Stencils, Rubix Type System.

### CAD-003: Error Representation via Monadic Result Types Over Stack Unwinding
* **Decision**: Subsystem APIs, internal functions, and compiler pipelines must communicate failure through explicit **128-bit Monadic Result Types (`Result<T, E>`)** returned directly in CPU registers (`RAX`/`RDX` on x86-64; `X0`/`X1` on AArch64). C++-style stack unwinding (`_Unwind_RaiseException`, DWARF `.eh_frame`) is strictly prohibited.
* **Rationale**: DWARF exception tables add massive binary bloat (often 20–30% of binary size), require complex runtime unwinding engines that destroy sub-millisecond boot latency, and are notoriously difficult to verify formally. Value-based result passing completes in 0 CPU cycles beyond standard register transfer.
* **Subsystems Affected**: HNS Compiler Daemon, EIA ARLL-Agent, Rubix Runtime, Language Syntax.

### CAD-004: In-Memory Direct Splicing Over Dynamic Relocation Sections
* **Decision**: Rubix binaries and modules must not contain traditional ELF/PE dynamic relocation sections (`.rel.dyn`, `.rela.plt`). Instead, external dependencies and dynamic links are resolved exclusively via **In-Memory JIT Stencil Splicing and Semantic Relocation Tables (`SRT`)**.
* **Rationale**: ELF dynamic linkers (`ld.so`) require costly symbol hash lookups, lazy PLT trampolines that cause branch misprediction, and complex copy relocations. Direct in-memory hole patching executes once at module load, yielding $0.000\text{ ns}$ call overhead in steady state.
* **Subsystems Affected**: HNS FSQG-Splice, EIA ARLL-Agent, SAES Substrate.

### CAD-005: Capability-Isolated Foreign Function Gateways
* **Decision**: Direct raw pointer sharing between safe Rubix code and untrusted foreign code (C, C++, Go) is prohibited. All foreign interactions must execute through the **Autonomous Foreign Gateway Fabric (`AFGF`)**, which copies or validates data across capability-bounded memory buffers.
* **Rationale**: Unrestricted raw pointer sharing allows legacy C code with spatial or temporal bugs to corrupt Rubix affine arenas and invalidate formal safety proofs. Isolating foreign memory behind explicit capability buffers confines memory corruption to the foreign enclave.
* **Subsystems Affected**: EIA-Omega AFGF, Rubix-Aegis CHERI compartments, Security Threat Model.

### CAD-006: Concurrency via Affine Message Passing and Join-Semilattices
* **Decision**: Raw operating system mutexes (`pthread_mutex_t`), condition variables, and uncoordinated shared-memory mutations are banned from user-facing APIs. Concurrency must be expressed either through **Affine Message Passing (Actors with Exclusive Region Transfer)** or through **Conflict-Free Replicated Data Types (`CRDTs`) over Join-Semilattices**.
* **Rationale**: Mutex-based multithreading is the leading cause of deadlocks, priority inversions, and Heisenbugs in distributed and high-concurrency systems. Affine message passing and join-semilattices guarantee race freedom and deterministic convergence mathematically.
* **Subsystems Affected**: Rubix Language Concurrency, Rubix-Harmonic, HNS Daemon Concurrency.
