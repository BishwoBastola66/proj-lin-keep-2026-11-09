# HNS System Boundaries & Component Architecture

> **Status**: Canonical Accepted  
> **Classification**: Subsystem Structural Architecture  
> **Subsystem**: Hyper-Stride Native Synthesis (HNS & HNS-Hyperflux)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification defines the internal component structure, memory architecture, and operational boundaries of the **Hyper-Stride Native Synthesis (HNS)** compiler daemon and its upgraded **HNS-Hyperflux** engine. It establishes how source tokens are transformed into executing native machine code within sub-millisecond timeframes.

---

## 2. Component Decomposition

```
+───────────────────────────────────────────────────────────────────────────────────+
|                           HNS Resident Compiler Daemon                            |
|                                                                                   |
|  +─────────────────────────+      +────────────────────────────────────────────+  |
|  | BSIS / FS-VT            |      | RAMC Resident Arena Controller             |  |
|  | SIMD Token Streamer     |      | 16MB L3-Resident Bump Arena                |  |
|  +─────────────────────────+      +────────────────────────────────────────────+  |
|               │                                          │                        |
|               ▼                                          ▼                        |
|  +─────────────────────────+      +────────────────────────────────────────────+  |
|  | FSQG-Splice             |◄────►| PCMSS Machine Stencil Store                |  |
|  | Fast Fragment Splicer   |      | Pre-compiled ISA templates (.machine)      |  |
|  +─────────────────────────+      +────────────────────────────────────────────+  |
|               │                                          │                        |
|               ▼                                          ▼                        |
|  +─────────────────────────+      +────────────────────────────────────────────+  |
|  | ZC-HPVR Virtual Ring    |      | DDZRE Zero-Runtime Binary Engine           |  |
|  | Sub-µs Code Swizzler    |      | Direct-Syscall Executable Emission         |  |
|  +─────────────────────────+      +────────────────────────────────────────────+  |
|               │                                                                   |
|               ▼                                                                   |
|  +─────────────────────────────────────────────────────────────────────────────+  |
|  | DL-BBEL Deep-Lane Background Engine (Polyhedral JIT Stencil Coalescing PJSC)|  |
|  +─────────────────────────────────────────────────────────────────────────────+  |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Subsystem Component Specifications

### 3.1 PCMSS: Pre-Computed Machine Stencil Store
* **Role**: Repository of pre-assembled, optimal native machine code fragments for target instruction set architectures (x86-64, ARM64, RISC-V 64).
* **Structure**: Indexed by opcode family and operand type. Each stencil conforms to `HNS_StencilHeader_v2`, containing the raw opcode bytes, relocatable hole descriptors (`HNS_RelocationHole_v2`), and clobbered register masks.
* **Storage**: Embedded directly in the HNS compiler daemon binary as read-only contiguous memory, eliminating disk I/O.

### 3.2 FSQG-Splice: Fine-Grained Fragment Splicer
* **Role**: The core single-pass code synthesis engine.
* **Mechanism**: As the parser encounters syntax nodes, FSQG-Splice:
  1. Looks up the appropriate stencil in `PCMSS`.
  2. Performs a high-speed memory copy (`memcpy`) of the stencil bytes into the output code buffer.
  3. Evaluates operand values (register IDs, constant literals, stack frame offsets).
  4. Patches operand holes directly in the copied bytes at the recorded hole offsets.
* **Throughput**: Synthesizes native machine code at over **35 million instructions per second**.

### 3.3 RAMC: Resident Arena Memory Controller
* **Role**: High-speed bump allocator managing memory for the entire compilation cycle.
* **Specification**: Pre-allocates a 16MB contiguous virtual memory block committed to host RAM.
  * Allocation: advances an arena pointer: `arena_ptr += aligned_size`.
  * Overhead: **1 CPU cycle**.
  * Deallocation: resets pointer to start: `arena_ptr = arena_base`.
  * Overhead: **0 CPU cycles**.
* **Invariant**: Never calls `malloc` or `free` during compilation passes.

### 3.4 DDZRE: Demand-Driven Zero-Runtime Binary Engine
* **Role**: Emits standalone executable binaries with zero mandatory runtime dependencies.
* **Specification**:
  * Emits raw ELF64 / PE / Mach-O executables directly from memory buffers.
  * Injects direct Linux system call sequences (`syscall` on x86-64, `svc #0` on AArch64) for memory mapping and I/O.
  * Eliminates dependency on `libc.so`, `libpthread.so`, or runtime garbage collectors.
  * Output binary size: **174 bytes for minimal CLI, <64KB for complex applications**.

### 3.5 BSIS / FS-VT: SIMD Token Streamer (HNS-Hyperflux)
* **Role**: Vectorized lexical analysis engine.
* **Specification**: Loads 64-byte chunks of source code into AVX-512 vector registers (`_mm512_loadu_si512`). Evaluates punctuation masks, keyword lookup tables, and literal delimiters in parallel using SIMD shuffle and bitmask instructions. Streams classified tokens directly into `FSQG-Splice`.

### 3.6 ZC-HPVR: Zero-Copy Hot-Patching Virtual Ring (HNS-Hyperflux)
* **Role**: In-memory dynamic function re-linking engine.
* **Specification**: Manages a dual-mapped circular code buffer. Allows background threads to compile modified functions and atomically update call vectors via 64-bit atomic stores without suspending executing worker threads.

### 3.7 DL-BBEL: Deep-Lane Background Engine & PJSC (HNS-Hyperflux)
* **Role**: Asynchronous optimization engine.
* **Specification**: While the fast-lane (`FSQG-Splice`) delivers code in $<0.35\text{ ms}$, DL-BBEL observes hot function execution counts in the background. Hot functions are passed to the Polyhedral JIT Stencil Coalescing (`PJSC`) optimizer, which fuses loops, vectorizes data streams, and replaces stencils with superoptimized machine code asynchronously.
