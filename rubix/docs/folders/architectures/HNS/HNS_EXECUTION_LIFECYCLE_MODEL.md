# HNS Compilation Lifecycle & Execution Model

> **Status**: Canonical Accepted  
> **Classification**: Compiler Lifecycle & Systems Runtime  
> **Subsystem**: Hyper-Stride Native Synthesis (HNS & HNS-Hyperflux)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document specifies the step-by-step lifecycle of a compilation event within the **Hyper-Stride Native Synthesis (HNS)** daemon and its **HNS-Hyperflux** engine. It establishes how compilation requests are received, synthesized, and deployed with an end-to-end target latency of **$<0.35\text{ ms}$ (350 microseconds)** for a 10,000-line translation unit.

---

## 2. Compilation Lifecycle Workflow

```
[Developer File Save / Build Command]
                  │
                  ▼
[Step 1: POSIX Shared Memory Command Dispatch (/dev/shm)]
                  │
                  ▼
[Step 2: Resident Compiler Daemon Futex Wakeup (<1 µs)]
                  │
                  ▼
[Step 3: SIMD Token Streaming (FS-VT / BSIS)]
                  │
                  ▼
[Step 4: Single-Pass Stencil Splicing (FSQG-Splice & PCMSS)]
                  │
                  ▼
[Step 5: Immediate Hole Relocation Patching]
                  │
                  ▼
[Step 6: Executable Memory Page Mapping / DDZRE Binary Emission]
                  │
                  ▼
[Step 7: RAMC Bump Arena Instantaneous Watermark Reset]
                  │
                  ▼
[Step 8: Completion Signal Return (<0.35 ms Total)]
```

---

## 3. Detailed Operational Steps

### Step 1: Shared Memory Dispatch
* **Latency**: $<0.8\text{ µs}$.
* **Mechanism**: The Rubix CLI client (`rubix build`) or IDE language server writes the source file path and compilation flags into a circular command ring located in `/dev/shm/rubix_compiler.ring`. No child process is spawned via `fork()` or `execve()`.

### Step 2: Resident Daemon Futex Wakeup
* **Latency**: $<0.6\text{ µs}$.
* **Mechanism**: The client issues a Linux `futex` wakeup call (`FUTEX_WAKE`) targeting the daemon's notification address. The resident HNS daemon worker thread wakes from kernel sleep immediately without thread creation overhead.

### Step 3: SIMD Token Streaming (FS-VT)
* **Latency**: $<80\text{ µs}$ for 10,000 LOC.
* **Mechanism**: Source text mapped into RAM is ingested by the Vectorized SIMD Token Streaming (`FS-VT`) engine. AVX-512 vector registers process 64 characters per cycle, generating a flat token stream directly in the `RAMC` bump arena.

### Step 4: Single-Pass Stencil Splicing
* **Latency**: $<140\text{ µs}$ for 10,000 LOC.
* **Mechanism**: As the grammar parser consumes tokens, `FSQG-Splice` matches high-level expressions to `PCMSS` stencils. The pre-assembled machine instructions are copied contiguously into the destination code buffer. Expression values are assigned to CPU registers using a fast greedy linear register allocator.

### Step 5: Immediate Hole Relocation Patching
* **Latency**: $<50\text{ µs}$ across all operand holes.
* **Mechanism**: Immediate operands, branch displacement offsets, and external call targets are calculated and written directly into the machine instruction byte stream. Unresolved forward jumps are recorded in a temporary fixup array and patched when the target label is reached during the same single pass.

### Step 6: Code Mapping / Direct Binary Emission
* **Latency**: $<40\text{ µs}$.
* **Mechanism**:
  * For **JIT / Hot-Reload Execution**: The code buffer is mapped into executable memory via Dual Virtual Alias Mapping (DVAM). Function pointers in the Semantic Relocation Table (`SRT`) are updated atomically.
  * For **Standalone Disk Binaries**: `DDZRE` writes the completed ELF64/PE header, machine code segment, and `EIA_HologramHeader_v2` directly to disk using non-blocking asynchronous direct I/O (`io_uring`).

### Step 7: RAMC Bump Arena Instantaneous Reset
* **Latency**: $<0.2\text{ µs}$ (0.0002 ms).
* **Mechanism**: The `RAMC` bump pointer is reset back to the base address:
  ```c
  ramc_arena.current_offset = 0;
  ```
  No per-object memory frees or destructor loops are executed. All 16MB of virtual memory remains mapped in host RAM, warm in L3 cache for the next compilation request.

### Step 8: Completion Signal
* **Latency**: $<0.5\text{ µs}$.
* **Mechanism**: The daemon posts a completion notification to `/dev/shm/rubix_compiler.ring` and signals the client. Total wall-clock elapsed time: **$312.1\text{ µs}$** ($0.312\text{ ms}$).
