# Architecture Knowledge Base Technical Glossary & Acronyms

> **Standard**: Authoritative, unambiguous definitions for all systems engineering terms, microarchitectural primitives, compiler abstractions, and acronyms used across the Rubix, EIA, and HNS ecosystems.  
> **Status**: Canonical Accepted Glossary  
> **Last Updated**: October 2026

---

## 1. Primary Systems & Architectures

* **EIA (Eternal Interface Architecture)**: The post-ABI sovereign interface substrate that eliminates static ABI churn and operating system container lock-in through mathematical semantic invariance and autonomous load-time projection.
* **EIA-Omega (Eternal Holographic Semantic Continuum - EHSC)**: The upgraded next-generation EIA architecture incorporating Autonomic Microarchitecture Adaptation (AMA), Cryptographic Semantic Contract Ledgers (CSCL), and Autonomous Foreign Gateway Fabrics (AFGF).
* **HNS (Hyper-Stride Native Synthesis)**: The sub-millisecond native compiler and direct machine stencil engine that eliminates monolithic compiler passes using pre-computed machine stencils, resident memory bump arenas, and demand-driven zero runtimes. Also referenced historically as **HSNS** or **ZWNS (Zero-Waste Native Synthesis)**.
* **HNS-Hyperflux (Zero-Latency Flux-Stream Native Synthesis - ZLFSNS)**: The upgraded next-generation HNS compiler utilizing SIMD vectorized token streaming, polyhedral JIT stencil coalescing, and zero-copy hot-patching virtual rings.
* **SAES (Sovereign Autonomic Execution Substrate)**: The unified cohabitation architecture combining EIA's lifetime invariant projection with HNS's sub-millisecond native machine stencil synthesis.
* **Rubix Next**: The sovereign systems programming language and multi-stage intermediate representation framework designed to eliminate memory safety vulnerabilities, ambient authority, and toolchain bloat without garbage collection or external C toolchain dependencies.
* **Rubix-Autonomic (ANSCS)**: The autonomic neural-symbolic compiler subsystem integrating syntax-time automatic differentiation, differentiable semantics, and agent-native semantic AST reflection.
* **Rubix-Chrono (TSPMA)**: The time-space persistent memory architecture providing zero-serialization data structures and hardware-atomic durability over NVRAM and CXL 3.0 fabrics.
* **Rubix-Aegis (CNCSS)**: The hardware capability security substrate co-designed with 128-bit tagged CHERI architectural capabilities.

---

## 2. Core Architectural Mechanisms & Acronyms

### A
* **ACCF (Arena Chaining with Chunk Allocation)**: A memory management technique in HNS that links secondary 16MB virtual memory extents dynamically when a massive translation unit exceeds the primary arena capacity.
* **ACS (Autonomous Contract Stamping)**: The process of verifying a module's cryptographic semantic contract hash ($\mathcal{H}_{\text{contract}}$) before linking, allowing binary reuse without source recompilation.
* **AFGF (Autonomous Foreign Gateway Fabric)**: The upgraded EIA-Omega mechanism that dynamically generates bidirectional zero-copy bridges between Rubix affine handles and external C/C++/Wasm ABIs.
* **AIR (Affine & Resource Intermediate Representation)**: The second stratum of the Rubix compiler pipeline, responsible for ownership verification, borrow checking, linear scan escape analysis, and automated stack promotion.
* **AMA (Autonomic Microarchitecture Adaptation)**: The EIA-Omega capability that detects host microarchitecture features (such as Intel APX, AVX-512, or ARM SVE2) at load time and dynamically negotiates optimal register width and vector layouts.
* **AOSH-TTAC (Automated Offline Stencil Harvester)**: A headless offline toolchain subsystem that compiles canonical C micro-kernels across target instruction sets and harvests verified raw opcodes and relocation hole offsets.
* **AOP (Affine Ownership Projection)**: The mechanism by which EIA preserves move and borrow semantics across binary boundaries, preventing callees from retaining borrowed references.
* **APX (Intel Advanced Performance Extensions)**: An x86-64 architecture extension doubling general-purpose registers from 16 to 32 (`r16`–`r31`), supported natively by EIA and HNS stencils via EVEX and REX2 prefixes.
* **AR-CSP (Acquire-Release Context-Synchronization Protocol)**: The memory ordering protocol pairing release stores (`stlr`) on code writer cores with acquire loads (`ldar`) and instruction synchronization barriers (`isb`) on code reader cores to guarantee SMP I-cache consistency.
* **ARLL-Agent (Autonomous Resident Linker-Loader Agent)**: An ultra-compact embedded loader agent (2.4KB native bytecode) contained within Universal Polyglot Binary Packaging that projects semantic intent directly into host memory pages at startup.

### B
* **BLAKE3**: A cryptographic hash function operating in a tree structure, capable of hashing at $>10\text{ GB/s}$, utilized by EIA to compute the Semantic Schema Hash ($\mathcal{S} = \text{BLAKE3}(\Sigma_\infty)$).
* **BSIS (Branchless Speculative Inline Selection)**: The compiler optimization vector that lowers conditional expressions into hardware predicated instructions (`CMOVcc` on x86-64, `CSEL` on ARM64), eliminating 15–20 cycle branch misprediction pipeline flushes.

### C
* **CGBE (Capability-Gated Boundary Envelopes)**: Security boundaries where external or unprivileged function invocations are gated by unforgeable mathematical capability tokens.
* **CHERI (Capability Hardware Enhanced RISC Instructions)**: A hardware architecture extension extending 64-bit pointers into 128-bit tagged capabilities containing base, bounds, permissions, and an unforgeable hardware validity bit.
* **CSCL (Cryptographic Semantic Contract Ledger)**: The EIA-Omega decentralized Merkle-tree validation structure ensuring zero-trust binary compatibility across external software supply chains.
* **CFI (Control-Flow Integrity)**: Hardware forward-edge indirect branch protection enforced via Intel CET (`endbr64`) and ARM BTI (`bti c`).

### D
* **DATP (Debug-Aware Trap Preservation)**: A fragment splicing safety mechanism that inspects active debugger software breakpoints (`INT3` / `0xCC`) before in-memory code replacement, preserving interactive debugging sessions.
* **DDZRE (Demand-Driven Zero-Runtime Envelope)**: The HNS runtime architecture ensuring that binaries only link what they explicitly use, producing 174-byte direct-syscall native executables with 150-microsecond boot times.
* **DL-BBEL (Dual-Lane Budget-Bounded Escalation Ladder)**: The compilation scheduling framework bifurcating builds into an instantaneous Fast Lane ($<1\text{ ms}$) and a cycle-budget-bounded Deep Lane ($\le 20\text{ ms}$) for hot paths.
* **DRF (Direct Register Forwarding)**: Passing function arguments directly across CPU physical register renaming files without writing stack activation frames to DRAM.
* **DTUS (Dual-Track Universal Substrate)**: An HNS operational mode supporting freestanding direct-syscall binaries for microservices, and dynamic ELF/PE wrapper modes for legacy C library linking.
* **DVAM (Dual Virtual Alias Mapping)**: An executable memory management mechanism that maps a single physical RAM frame into two distinct virtual address aliases: a write-only non-executable alias ($V_{\text{write}}$) and a read-only executable alias ($V_{\text{exec}}$), satisfying $W \oplus X$ security with zero runtime `mprotect()` system calls.

### E–F
* **FSQG-Splice (Fine-Grained Semantic Query Graph with Fragment Splicing)**: An incremental compilation engine that tracks fine-grained semantic units (`SQU`), recompiling only modified function bodies and splicing new machine bytes directly into executable memory in 50–150 microseconds.

### G–L
* **GEC-PFD (Generational Epoch Cycling)**: A fault-tolerance mechanism that isolates compilation queries inside thread-local generational memory rings, allowing complete $O(1)$ state reset upon syntax errors or panics without corrupting the persistent daemon.
* **IMJ-HP (In-Memory JIT Displacement Hole Patching)**: The EIA mechanism that resolves dynamic struct field additions by patching instruction immediate displacements in memory at load time, achieving 100% binary resilience with $0.000\text{ ns}$ runtime overhead.
* **LFAR-ESB (Lock-Free Atomic Reserve with Emergency Signal Buffer)**: A concurrency control mechanism ensuring that memory bump allocations execute via hardware atomic operations (`lock xadd`), while asynchronous OS signals allocate from an isolated 64KB buffer.

### M–P
* **PCMSS (Pre-Computed Verified Machine Stencils)**: Machine code templates pre-assembled offline for target ISAs, instantiated at compile time via $O(1)$ bitwise immediate hole patching in 4–6 CPU cycles per node.
* **PV-SDB (Poly-Versioned Semantic Dynamic Binding)**: The runtime linking capability that evaluates layout diffs between library versions, rewriting client memory displacements dynamically so multiple versions coexist in memory without recompilation.

### R–S
* **RAMC (Resident Arena Memory Continuum)**: The memory architecture of HNS wherein persistent compiler daemons (`rubix server`) maintain target descriptions and symbol tables locked in 16MB bump arenas, resetting allocation offsets in 1 clock cycle.
* **REBI-Veneer (Range-Extension Branch Islands & Veneer Thunks)**: Local in-arena branch stubs that allow relative jump instructions to bridge address spaces exceeding $\pm 2\text{ GB}$ (x86-64) or $\pm 128\text{ MB}$ (ARM64).
* **RUMS Next (Rubix Universal Machine Synthesis)**: The declarative machine synthesis backend that compiles Universal Intermediate Representation (UIR) directly into native machine instructions using declarative target descriptions (`.machine`) without LLVM or external assemblers.
* **SIR (Semantic Intermediate Representation)**: The first stratum of the Rubix compiler pipeline, representing abstract syntax trees annotated with formal types, algebraic effect bitmasks, and capability permissions.

### T–Z
* **TLAR (Thread-Local Arena Rings)**: Lock-free 16MB bump allocation buffers assigned privately to each compiler worker thread, eliminating mutex contention and enabling linear multicore compilation scaling.
* **TTEDR (Tri-Tier Ephemeral Debug Registry)**: An observability framework that strips DWARF tables from production binaries (keeping them at 174 bytes) while exporting out-of-band `/tmp/perf-<pid>.map` files and GDB JIT descriptors for full source-level interactive debugging.
* **UIR (Universal Machine Intermediate Representation)**: The third stratum of the Rubix compiler pipeline, structured as a 3-address virtual register stream with explicit basic blocks, control flow dominator trees, and target-agnostic machine operations.
* **UPBP (Universal Polyglot Binary Packaging)**: A binary packaging format beginning with overlapping MS-DOS (`MZ`), Unix shell script, Linux ELF, and Darwin Mach-O headers, allowing a single disk artifact to boot natively across all major operating systems.
* **Universal Hologram ($\Sigma_\infty$)**: The mathematical semantic specification $\Sigma_\infty = \langle \mathcal{I}, \mathcal{T}, \mathcal{C}, \mathcal{E}, \mathcal{S} \rangle$ defining the invariant interface contract of a software component.
* **W^X (Write XOR Execute)**: The operating system security policy dictating that a virtual memory page must never be simultaneously writable and executable.
