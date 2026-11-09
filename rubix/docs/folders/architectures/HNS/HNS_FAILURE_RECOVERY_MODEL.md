# HNS Failure Recovery & Generational Epoch Model

> **Status**: Canonical Accepted  
> **Classification**: Systems Resilience & Daemon Rejuvenation  
> **Subsystem**: Hyper-Stride Native Synthesis (HNS & HNS-Hyperflux)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the failure recovery, panic unwinding, and memory rejuvenation mechanisms of the **Hyper-Stride Native Synthesis (HNS)** resident compiler daemon. It articulates the **Generational Epoch Cycling (`GEC-PFD`)** model, ensuring that long-running compilation daemons maintain bit-for-bit deterministic reproducibility across millions of builds without memory leaks, resource exhaustion, or state decay.

---

## 2. Generational Epoch Cycling (`GEC-PFD`)

Long-running developer daemons (e.g., Gradle daemons, TypeScript language servers, rust-analyzer) frequently suffer from state drift, memory fragmentation, and accumulated cache pollution after hours of continuous use.

HNS resolves this via **Generational Epoch Cycling (`GEC-PFD`)**:

```
[Epoch N Active] ───────────────────► [Compilation Requests Processed]
        │                                      │
        ▼                                      ▼
[Threshold Reached: 10,000 Builds]     [Request Triggers Panic / OOM]
        │                                      │
        ▼                                      ▼
[Spawn Fresh Epoch N+1 Worker]         [Immediate Epoch N Arena Reset]
        │                                      │
        ▼                                      ▼
[Atomic Shared Memory Pointer Flip]    [Worker Rejuvenated in <5 µs]
```

### 2.1 Rejuvenation Invariants
1. **Bounded Epoch Lifespan**: A daemon worker thread is retired after processing 10,000 compilation jobs or 24 hours of wall-clock time, whichever occurs first.
2. **Zero-Downtime Worker Swapping**: Before terminating Epoch $N$, the supervisory daemon spawns an Epoch $N+1$ worker thread and pre-warms its 16MB bump arena.
3. **Atomic Pointer Swapping**: The shared memory pointer in `/dev/shm/rubix_compiler.ring` is atomically swapped using `atomic_store_explicit`. Clients never observe a dropped request or a dead socket.

---

## 3. Single-Pass Syntax Panic Unwinding

Because HNS does not build a multi-pass AST, syntax errors must be reported without leaving partially synthesized machine code in executable pages.

### 3.1 Lexical & Parse Error Isolation
* When a syntax error (e.g., unexpected token, missing delimiter) is detected:
  1. `FSQG-Splice` immediately halts stencil emission into the output code buffer.
  2. The parser records the exact byte offset, line number, column, and expected grammar production.
  3. The compilation session is marked `FAILED`.
  4. The code buffer pointer is rolled back to the beginning of the translation unit:
     $$\text{CodeBuffer}_{\text{head}} \leftarrow \text{CodeBuffer}_{\text{base}}$$
  5. The virtual memory pages are untouched; no dirty code bytes are ever exposed to the operating system loader.

### 3.2 Structured Machine Diagnostics
HNS generates structured diagnostics directly from RAM into the response buffer:
```json
{
  "diagnostic_level": "ERROR",
  "error_code": "E0412",
  "message": "Type mismatch in affine assignment: expected `Resource<FileHandle>`, found `Value<u32>`",
  "file": "src/network/socket_pool.rx",
  "line": 42,
  "column": 18,
  "source_snippet": "let handle: FileHandle = port_number;",
  "suggested_fix": "Use `FileHandle::open(port_number)` with explicit capability `CapToken<Network>`"
}
```
This structured format ensures instantaneous error rendering in IDEs and allows AI agents in Rubix-Autonomic to repair syntax errors autonomously.
