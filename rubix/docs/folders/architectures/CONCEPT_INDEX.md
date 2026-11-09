# Alphabetical Concept Index

This index defines and cross-references all theoretical concepts, algorithmic mechanisms, binary structures, and formal constructs developed across the Rubix, EIA, HNS, and future architecture specifications.

---

## A

* **Affine Ownership ($A \oplus M$)**: Type system discipline guaranteeing that any value or resource can be consumed at most once. Prevents resource leaks, double frees, and data races at compile time without a tracing garbage collector.
  * *Specification*: [AFFINE_OWNERSHIP_AND_BORROWING.md](TYPE_SYSTEM_AND_SEMANTICS/AFFINE_OWNERSHIP_AND_BORROWING.md)
  * *ADR*: [ADR-0004-affine-ownership-regions.md](ADR/ADR-0004-affine-ownership-regions.md)
* **Agent-Native Semantic Computation Substrate (`ANSCS` / Rubix-Autonomic)**: Architectural substrate enabling autonomous AI agents to dynamically generate, inspect, type-check, and hot-patch native machine code stencils in microseconds.
  * *Specification*: [RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)
* **Algebraic Effect Confinement**: Static analysis technique where side effects (I/O, allocation, concurrency, syscalls) are tracked as elements of a 7-bit effect semilattice and strictly isolated at compile time.
  * *Specification*: [ALGEBRAIC_EFFECT_CONFINEMENT.md](TYPE_SYSTEM_AND_SEMANTICS/ALGEBRAIC_EFFECT_CONFINEMENT.md)
* **Autonomic Microarchitecture Adaptation (`AMA` / EIA-Omega)**: Load-time engine that dynamically rewrites machine calling conventions and register allocations to exploit host microarchitectural features (e.g., Intel APX 32 GPRs, ARM SVE2 variable vectors) without changing binary schemas.
  * *Specification*: [EIA_ARCHITECTURE_OVERVIEW.md](EIA/EIA_ARCHITECTURE_OVERVIEW.md)
* **Autonomous Resident Linker-Loader Agent (`ARLL-Agent`)**: The lightweight in-process execution agent that loads EIA Universal Polyglot Binary Packages (`UPBP`), evaluates the Semantic Hologram ($\Sigma_\infty$), and performs in-memory displacement hole patching.
  * *Specification*: [EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md](EIA/EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)

---

## B

* **Backward & Forward Semantic Invariance**: The mathematical guarantee that software components built under EIA can interoperate across disparate operating systems and compilation vintages without recompilation.
  * *Specification*: [EIA_FOUNDATIONAL_PRINCIPLES.md](EIA/EIA_FOUNDATIONAL_PRINCIPLES.md)
* **Bump Arena Memory Controller (`RAMC`)**: In-memory 16MB contiguous virtual memory block used by HNS for lightning-fast linear pointer-bump allocations during single-pass compilation. Reset via pointer rollback in $0.00\text{ ms}$.
  * *Specification*: [HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md](HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)

---

## C

* **Capability Token (`CapToken`)**: 128-bit unforgeable linear token embodying an explicit permission to perform a privileged operation (file I/O, network socket, clock access, memory mapping).
  * *Specification*: [CAPABILITY_SECURITY_SYSTEM.md](TYPE_SYSTEM_AND_SEMANTICS/CAPABILITY_SECURITY_SYSTEM.md)
  * *ADR*: [ADR-0005-capability-security.md](ADR/ADR-0005-capability-security.md)
* **Capability-Native Compartmentalized Security Substrate (`CNCSS` / Rubix-Aegis)**: Hardware-enforced spatial and temporal safety targeting 128-bit CHERI architectural capabilities and ARM Morello.
  * *Specification*: [RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)
* **Copy-and-Patch Compilation**: Compilation methodology where pre-compiled machine code templates (stencils) are copied into memory and binary immediate holes are patched in-place, bypassing AST/SSA graph optimization passes.
  * *Specification*: [HNS_FOUNDATIONAL_PRINCIPLES.md](HNS/HNS_FOUNDATIONAL_PRINCIPLES.md)
  * *ADR*: [ADR-0002-hns-machine-stencils.md](ADR/ADR-0002-hns-machine-stencils.md)
* **Cryptographic Semantic Contract Ledger (`CSCL` / EIA-Omega)**: Merkle-tree rooted tamper-proof ledger verifying semantic interface contracts against cryptographic signatures and hardware enclave attestations.
  * *Specification*: [EIA_ARCHITECTURE_OVERVIEW.md](EIA/EIA_ARCHITECTURE_OVERVIEW.md)

---

## D

* **Demand-Driven Zero-Runtime Binaries (`DDZRE`)**: Executables synthesized with zero extraneous runtime support libraries, yielding minimal memory footprints ($174\text{ bytes}$) and sub-millisecond cold boot times.
  * *Specification*: [HNS_ARCHITECTURE_OVERVIEW.md](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
* **Deterministic Distributed Concurrency Fabric (`DDCF` / Rubix-Harmonic)**: Concurrency model embedding Conflict-Free Replicated Data Types (CRDTs) and join-semilattices directly into type checking, guaranteeing lock-free, race-free distributed consensus.
  * *Specification*: [RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)
* **Dual Virtual Alias Mapping (`DVAM`)**: Operating system memory management pattern mapping a single physical allocation to two distinct virtual addresses: one writable non-executable ($W \wedge \neg X$) for compilation/patching, and one executable non-writable ($\neg W \wedge X$) for execution. Eliminates `mprotect` syscall overhead.
  * *Specification*: [CAPABILITY_SANDBOXING_AND_WX.md](SECURITY_AND_TRUST/CAPABILITY_SANDBOXING_AND_WX.md)
  * *ADR*: [ADR-0006-dual-virtual-alias-wx.md](ADR/ADR-0006-dual-virtual-alias-wx.md)

---

## E

* **EIA (Eternal Interface Architecture)**: The post-ABI binary interoperability substrate that decouples binary execution from static machine ABIs using Semantic Holograms and load-time hole patching.
  * *Specification*: [EIA_ARCHITECTURE_OVERVIEW.md](EIA/EIA_ARCHITECTURE_OVERVIEW.md)
* **EIA-Omega (EHSC)**: Upgraded edition of EIA featuring Autonomic Microarchitecture Adaptation, Cryptographic Contract Ledgers, and Autonomous Foreign Gateway Fabrics.
  * *Specification*: [EIA_ARCHITECTURE_OVERVIEW.md](EIA/EIA_ARCHITECTURE_OVERVIEW.md)
* **Epoch-Based Generational Cycling (`GEC-PFD`)**: Runtime safety mechanism in HNS where memory arenas cycle across generations to prevent allocation fragmentation and enable instantaneous crash isolation.
  * *Specification*: [HNS_FAILURE_RECOVERY_MODEL.md](HNS/HNS_FAILURE_RECOVERY_MODEL.md)

---

## F

* **Fine-Grained Fragment Splicing (`FSQG-Splice`)**: The core code-generation pipeline in HNS that splices pre-computed machine stencils directly into executable buffers at cache speeds.
  * *Specification*: [HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md](HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)
* **Foreign Gateway Fabric (`AFGF` / EIA-Omega)**: Automated zero-cost ABI bridge between Rubix/EIA components and legacy C, C++, Rust, Go, WASM, and Java JNI libraries.
  * *Specification*: [EIA_COMPATIBILITY_AND_MIGRATION.md](EIA/EIA_COMPATIBILITY_AND_MIGRATION.md)

---

## H

* **HNS (Hyper-Stride Native Synthesis / ZWNS)**: Sub-millisecond single-pass native machine code compiler and resident execution daemon.
  * *Specification*: [HNS_ARCHITECTURE_OVERVIEW.md](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
* **HNS-Hyperflux (ZLFSNS)**: Upgraded edition of HNS incorporating SIMD vector token streaming, polyhedral stencil coalescing, and hot-patching virtual rings.
  * *Specification*: [HNS_ARCHITECTURE_OVERVIEW.md](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
* **Hole Patching**: Load-time binary rewriting technique where immediate operand offsets (displacements, call targets, struct field offsets) are populated directly into machine instruction bytes.
  * *Specification*: [EIA_EXECUTION_LIFECYCLE_MODEL.md](EIA/EIA_EXECUTION_LIFECYCLE_MODEL.md)
  * *ADR*: [ADR-0001-eia-semantic-hologram.md](ADR/ADR-0001-eia-semantic-hologram.md)

---

## P

* **Polyhedral JIT Stencil Coalescing (`PJSC`)**: Optimizer inside HNS-Hyperflux that fuses adjacent stencils into continuous register-allocated instruction streams on the fly.
  * *Specification*: [HNS_ARCHITECTURE_OVERVIEW.md](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
* **Pre-Computed Machine Stencils (`PCMSS`)**: Architecture-specific fragments of pre-assembled native instructions containing relocatable holes for operands and registers.
  * *Specification*: [HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md](HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)
  * *ADR*: [ADR-0002-hns-machine-stencils.md](ADR/ADR-0002-hns-machine-stencils.md)

---

## R

* **RUMS (Rubix Universal Machine Synthesis)**: Machine description and synthesis backend that translates Universal Intermediate Representation (UIR) to target instructions using `.machine` declarations.
  * *Specification*: [MACHINE_SYNTHESIS_AND_RUMS.md](COMPILERS_AND_EXECUTION/MACHINE_SYNTHESIS_AND_RUMS.md)

---

## S

* **Semantic Hologram ($\Sigma_\infty$)**: An invariant mathematical descriptor embedded in UPBP binaries capturing types, constraints, resource lifetimes, and symbolic dependencies, decoupled from machine layout.
  * *Specification*: [EIA_FOUNDATIONAL_PRINCIPLES.md](EIA/EIA_FOUNDATIONAL_PRINCIPLES.md)
  * *ADR*: [ADR-0001-eia-semantic-hologram.md](ADR/ADR-0001-eia-semantic-hologram.md)
* **Semantic Relocation Table (`SRT`)**: The high-speed shared memory table bridging EIA interface bindings with HNS code buffers in the unified SAES architecture.
  * *Specification*: [UNIFIED_REFERENCE_ARCHITECTURE.md](EIA_HNS_UNIFIED/UNIFIED_REFERENCE_ARCHITECTURE.md)
* **Sovereign Autonomic Execution Substrate (`SAES`)**: The unified runtime and compiler substrate uniting EIA-Omega and HNS-Hyperflux.
  * *Specification*: [UNIFIED_REFERENCE_ARCHITECTURE.md](EIA_HNS_UNIFIED/UNIFIED_REFERENCE_ARCHITECTURE.md)
  * *ADR*: [ADR-0003-unified-eia-hns-contract.md](ADR/ADR-0003-unified-eia-hns-contract.md)

---

## T

* **Temporal State Persistence & Memory Architecture (`TSPMA` / Rubix-Chrono)**: Direct persistent memory architecture eliminating serialization layers by mapping data structures directly to CXL 3.0 NVRAM.
  * *Specification*: [RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md)
* **Tri-Stratum Semantics**: Rubix core typing architecture dividing all computation into three disjoint strata: Values ($\mathcal{V}$), Resources ($\mathcal{R}$), and Capabilities ($\mathcal{C}$).
  * *Specification*: [SEMANTIC_TYPE_LATTICE.md](TYPE_SYSTEM_AND_SEMANTICS/SEMANTIC_TYPE_LATTICE.md)

---

## U

* **Universal Polyglot Binary Packaging (`UPBP`)**: Polyglot binary container beginning with an MZ header, followed by a POSIX shell bootstrap script, ELF, and Mach-O descriptors, executable across Linux, Windows, macOS, and bare-metal firmware.
  * *Specification*: [EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md](EIA/EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md)

---

## V

* **Vectorized SIMD Token Streaming (`FS-VT` / HNS-Hyperflux)**: Lexing engine utilizing AVX-512 / ARM NEON vector instructions to classify source code tokens at memory bus bandwidth (>8 GB/s).
  * *Specification*: [HNS_ARCHITECTURE_OVERVIEW.md](HNS/HNS_ARCHITECTURE_OVERVIEW.md)

---

## Z

* **Zero-Ambient Authority**: Security principle stating that a program component possesses no implicit access to the host environment, requiring explicit capability token arguments for every interaction.
  * *Specification*: [CAPABILITY_SECURITY_SYSTEM.md](TYPE_SYSTEM_AND_SEMANTICS/CAPABILITY_SECURITY_SYSTEM.md)
  * *ADR*: [ADR-0005-capability-security.md](ADR/ADR-0005-capability-security.md)
* **Zero-Copy Hot-Patching Virtual Ring (`ZC-HPVR` / HNS-Hyperflux)**: Virtual memory ring buffer architecture enabling lock-free dynamic code reloading in less than $1\text{ microsecond}$ without process restarts.
  * *Specification*: [HNS_ARCHITECTURE_OVERVIEW.md](HNS/HNS_ARCHITECTURE_OVERVIEW.md)
