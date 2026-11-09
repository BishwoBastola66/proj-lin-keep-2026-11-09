# System Assumptions & Active Research Horizons

> **Status**: Canonical Working Document  
> **Classification**: Architectural Risk Analysis & Long-Term Roadmap  
> **Last Updated**: October 2026  

---

## 1. Executive Overview

This document formally captures the foundational engineering assumptions, verified boundary constraints, acknowledged operational risks, and open research horizons governing the Rubix ecosystem, EIA-Omega, HNS-Hyperflux, and the Unified Substrate (SAES).

Every architectural decision in Rubix is grounded in explicit hardware and operating system assumptions. When these assumptions change, the corresponding subsystem's formal verification guarantees must be re-evaluated.

---

## 2. Core Architectural Assumptions

### 2.1 Hardware Microarchitecture Assumptions

| Assumption ID | Statement | Systems Affected | Verification Status | Fallback / Contigency |
| :--- | :--- | :--- | :--- | :--- |
| **`ASM-HW-01`** | **Byte-Addressable Coherent Memory**: Target CPUs provide hardware cache coherency (MESI/MOESI) and 64-bit linear byte addressing. | HNS, EIA, SAES, Rubix-Chrono | Verified on x86-64, AArch64, RISC-V 64. | For non-coherent NUMA or accelerators, explicit software memory barriers (`mfence`, `dmb ish`) are emitted. |
| **`ASM-HW-02`** | **Atomic 64-bit Aligned Memory Access**: Naturally aligned 64-bit memory reads and writes are atomic at the hardware bus level without locks. | HNS Stencil Patching, SAES SRT, Rubix-Harmonic | Verified across AMD64, ARMv8.2+, RV64GC. | If unaligned access is detected, fall back to lock-prefixed atomic compare-and-swap (`cmpxchg` / `cas`). |
| **`ASM-HW-03`** | **Instruction Cache Coherency via Fences**: Emitted machine code in user pages becomes visible to instruction prefetchers upon issuing architecture-specific cache flush fences (`clflush` / `isb`). | HNS-Hyperflux, EIA Hole Patching | Verified on Linux, Darwin, Windows x64/ARM64. | Use OS syscall `__builtin___clear_cache` or `FlushInstructionCache` Win32 API. |
| **`ASM-HW-04`** | **Dual Virtual Address Aliasing Support**: OS virtual memory subsystems allow creating two distinct virtual memory mappings to the same underlying physical page frames. | SAES DVAM, EIA-Omega | Verified via `memfd_create` + `mmap` on Linux, `mach_vm_remap` on macOS, Section Views on Windows. | Fall back to synchronous `mprotect(PROT_READ|PROT_EXEC)` with a 1.2 microsecond penalty per code block. |
| **`ASM-HW-05`** | **Hardware Capability Support**: Hardware provides tagged memory and bounds checking (CHERI 128-bit purecap or ARM Morello). | Rubix-Aegis | Active Research Prototype. | Emulate capabilities via 128-bit software fat pointers with compile-time proof verification. |

### 2.2 Operating System & Kernel Assumptions

| Assumption ID | Statement | Systems Affected | Verification Status | Fallback / Contigency |
| :--- | :--- | :--- | :--- | :--- |
| **`ASM-OS-01`** | **POSIX / Direct-Syscall ABI Stability**: Direct kernel system call numbers and trap interfaces remain stable across operating system minor versions. | DDZRE Native Binaries, EIA | Verified on Linux (x86_64, aarch64). | On Darwin and Windows, dispatch through dynamic trampoline tables resolving `libsystem_kernel.dylib` / `ntdll.dll`. |
| **`ASM-OS-02`** | **Resident Daemon Persistence**: User environments permit long-running background daemon processes maintaining shared memory segments (`/dev/shm`). | HNS Resident Daemon, SAES | Verified across modern Linux and macOS workstations. | Provide fallback single-shot execution mode (`rubix --standalone`) with cold-start overhead (<4ms). |
| **`ASM-OS-03`** | **CXL 3.0 / NVRAM Direct Mapping**: Host operating systems support direct-access (`DAX`) file mapping over byte-addressable persistent memory without page cache overhead. | Rubix-Chrono | Verified on Linux kernels 5.15+ with PMEM/DAX. | Fall back to memory-mapped write-ahead logging (WAL) over standard NVMe storage. |

### 2.3 Type System & Compiler Assumptions

| Assumption ID | Statement | Systems Affected | Verification Status | Fallback / Contigency |
| :--- | :--- | :--- | :--- | :--- |
| **`ASM-TYP-01`** | **Monomorphization Termination**: Compile-time template expansion and recursive type inference are guaranteed to terminate via cycle-detection bounded depth ($D_{\max} = 128$). | SIR Type Checker, HNS | Formally Proven. | Emit static error `E0192: Recursive type instantiation depth exceeded`. |
| **`ASM-TYP-02`** | **Affine Uniqueness Sufficient for Concurrency**: Proving exclusive mutable ownership ($A \oplus M$) at compile time is sufficient to prevent all data races without runtime mutexes. | Rubix Core, HNS | Formally Proven via O'Hearn Separation Logic. | Explicit shared state must use the `Rubix-Harmonic` CRDT join-semilattice or message passing. |

---

## 3. Active Research Horizons & Open Questions

### 3.1 Open Question 1: Quantum-Resistant Cryptographic Contract Ledgers (`CSCL`)
* **Question**: How can EIA-Omega embed post-quantum signatures (ML-DSA / CRYSTALS-Dilithium) in UPBP binaries without exceeding the 512-byte header footprint constraint?
* **Current Status**: Standard Dilithium signatures require 2,420 to 4,595 bytes, which violates the minimal UPBP boot header size.
* **Active Hypothesis**: Use Falcon-512 signatures (666 bytes) compressed via arithmetic coding, or embed a compact 256-bit BLAKE3 Merkle root in the binary header and delegate signature verification to a resident security daemon.

### 3.2 Open Question 2: Zero-Overhead Hardware CHERI Capability Bridging
* **Question**: How can Rubix-Aegis interact with uninstrumented legacy C shared libraries when running on CHERI pure-capability hardware without introducing 100ns pointer translation penalties?
* **Current Status**: CHERI purecap treats all pointers as 128-bit tagged capabilities. Legacy C binaries assume 64-bit integer addresses.
* **Active Hypothesis**: Implement a hardware-isolated compartmentalization bridge (`AFGF-CHERI`) that allocates legacy objects in a dedicated 4GB capability-bounded sandbox, translating addresses using hardware base register offsets.

### 3.3 Open Question 3: Non-Volatile Memory Rejuvenation under CXL 3.0 Fabric Faults
* **Question**: If a remote CXL 3.0 NVRAM memory pool experiences an intermittent network disconnect or power event during an active affine transaction, how does Rubix-Chrono prevent orphan capabilities?
* **Current Status**: Local persistent memory uses atomic cache-line writeback (`clwb` + `sfence`). Remote CXL fabrics introduce asymmetric fabric latency and multi-host split-brain risks.
* **Active Hypothesis**: Employ hardware epoch markers integrated with Rubix's affine region destructors, guaranteeing that an affine token cannot be released until the CXL fabric controller acknowledges write completion.

### 3.4 Open Question 4: Agentic Code Generation Verification Bounds
* **Question**: In Rubix-Autonomic, when an autonomous AI agent synthesizes native machine code directly via stencils in microseconds, what formal verification rules guarantee the synthesized code will not violate spatial memory safety or create infinite loops?
* **Current Status**: HNS machine stencils are individually verified for spatial safety, but arbitrary loop graphs generated by an agent could deadlock.
* **Active Hypothesis**: Enforce that agent-synthesized loops must be bounded by affine induction variables or yield fuel tokens, providing a formal termination proof before machine code emission.
