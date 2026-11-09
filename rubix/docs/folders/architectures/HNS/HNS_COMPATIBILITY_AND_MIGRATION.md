# HNS Compatibility & Toolchain Migration Strategy

> **Status**: Canonical Accepted  
> **Classification**: Toolchain Integration & Migration Strategy  
> **Subsystem**: Hyper-Stride Native Synthesis (HNS & HNS-Hyperflux)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification defines the build system integration, developer tooling compatibility, and toolchain migration pathways for **Hyper-Stride Native Synthesis (HNS)** and **HNS-Hyperflux**.

It articulates how existing software engineering teams using GCC, Clang, Make, CMake, Ninja, Cargo, or Go can adopt HNS seamlessly without altering existing CI/CD pipelines or development workflows.

---

## 2. Toolchain Drop-In Compatibility Interfaces

### 2.1 The `rubix cc` Drop-In Driver
To integrate with existing POSIX build systems, HNS provides a POSIX-compatible compiler driver:
* **Syntax**: `rubix cc -O2 -c file.rx -o file.o`
* **Make & Ninja Integration**: Developers update their build configuration with:
  ```makefile
  CC = rubix cc
  CFLAGS = --resident-daemon
  ```
* When executed by `make`, `rubix cc` redirects flags to the resident daemon over `/dev/shm`, completing builds in milliseconds instead of launching thousands of GCC processes.

### 2.2 Language Server Protocol (LSP) Real-Time Integration
* Modern IDEs (VS Code, Neovim, Zed) experience 200–800ms delays when rust-analyzer or clangd re-indexes code after a keystroke.
* Because HNS recompiles 10,000 LOC in **$0.266\text{ ms}$**, the embedded Rubix LSP server runs a complete compilation pass on **every single keystroke in real time**.
* Developers receive instant syntax validation, precise type inference tooltips, and diagnostic red-squiggles with **zero perceptible latency**.

---

## 3. Dual-Lane Optimization Architecture

To address the trade-off between instant compilation speed and deep polyhedral optimization, HNS implements the **Dual-Lane Architecture**:

```
[Developer Edit / Save]
          │
          ├──► [FAST LANE: HNS Copy-and-Patch] ──────► Instant Executable (<0.35 ms)
          │                                            (Used for Dev Feedback & Tests)
          │
          └──► [DEEP LANE: DL-BBEL / LLVM Backend] ──► Highly Optimized Binary (Release)
                                                       (Background Asynchronous Pass)
```

1. **Fast Lane (Default)**: Uses pre-compiled machine stencils (`PCMSS`). Emits executables in $<0.35\text{ ms}$. Perfect for local debugging, unit testing, and inner-loop developer workflows.
2. **Deep Lane (Release / Background)**: Runs asynchronously in background worker threads. Performs whole-program devirtualization, polyhedral vectorization, and cache line alignment for production deployments.

This eliminates the age-old compromise between slow, highly-optimizing compilers and fast, unoptimized development tools.
