# HNS Security & Arena Memory Boundaries

> **Status**: Canonical Accepted  
> **Classification**: Security Architecture & Arena Isolation  
> **Subsystem**: Hyper-Stride Native Synthesis (HNS & HNS-Hyperflux)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the security boundaries, memory protection invariants, and failure containment mechanisms of the **Hyper-Stride Native Synthesis (HNS)** daemon and generated binaries.

Because HNS operates as a persistent, high-speed memory-resident daemon handling untrusted developer source code, it must guarantee absolute immunity against memory exhaustion attacks, buffer overruns, compiler crashes, and daemon poisoning.

---

## 2. Arena Memory Isolation & Guard Page Architecture

The 16MB resident compilation arena (`RAMC`) is protected by hardware memory management unit (MMU) guard pages:

```
+─────────────────────────────────────────────────────────────────────────────────+
| Lower Guard Page |         Active Resident Arena Space (RAMC)        | Upper Guard|
| 4KB (PROT_NONE)  | 16MB (PROT_READ | PROT_WRITE)                    | 4KB (NONE) |
+─────────────────────────────────────────────────────────────────────────────────+
         ▲                                                                   ▲
         │                                                                   │
    Traps Stack Underflow                                           Traps Memory Overflow
```

### 2.1 Hardware Guard Pages
* **Implementation**: The virtual memory range enclosing the 16MB bump arena is bordered on both sides by 4KB guard pages mapped with `PROT_NONE`.
* **Protection Guarantee**: Any stray memory write or runaway pointer exceeding the 16MB boundary triggers an immediate hardware Page Fault (`SIGSEGV`) trapped by the kernel before any surrounding process memory or neighboring arenas can be corrupted.

### 2.2 Compilation Quota & Denial-of-Service Defense
* To prevent malicious source code (e.g., deeply nested macro expansions or massive string literals) from exhausting daemon memory:
  * Each translation unit is allocated a strict 16MB memory quota.
  * If the bump pointer reaches `RAMC_LIMIT - 64KB`, the parser immediately aborts compilation with error code `ERR_HNS_ARENA_EXHAUSTED` rather than allocating additional memory.
  * The arena is rolled back instantaneously without affecting concurrent compilation workers.

---

## 3. Dedicated Signal Stack & Compiler Fault Containment

If a bug or malformed AST stencil causes a panic in the HNS compiler daemon, it must not terminate the background daemon process or corrupt other active threads:

### 3.1 Alternative Signal Stack (`sigaltstack`)
* Each daemon worker thread registers an independent 64KB emergency signal stack using `sigaltstack()`.
* When a critical signal (`SIGSEGV`, `SIGBUS`, `SIGFPE`) occurs:
  1. The Linux kernel delivers the signal on the clean alternative stack, avoiding corrupted worker stack frames.
  2. The custom signal handler logs the precise faulting source line, column, and stencil ID.
  3. The handler executes `siglongjmp` back to the worker thread's recovery point.
  4. The worker thread resets its `RAMC` arena watermark, clears its pending queue, and transitions back to ready state in $<5\text{ µs}$.

---

## 4. Synthesized Native Code Stack Probing

In traditional native compilers, large stack frame allocations can skip over OS guard pages (the "Stack Clash" vulnerability), allowing malicious code to overwrite adjacent memory structures.

### Zero-Cost Stack Probing
HNS synthesizes stack probing directly into function prologues for frames exceeding 4KB:
* On **x86-64**:
  ```assembly
  sub rsp, 4096
  test [rsp], rsp   ; Probe page
  sub rsp, remaining_frame
  ```
* On **AArch64**:
  ```assembly
  sub sp, sp, #4096
  ldr xzr, [sp]     ; Probe page
  sub sp, sp, #remaining_frame
  ```
This guarantees that stack frames cannot jump over kernel guard pages, providing 100% spatial stack safety for all synthesized binaries.
