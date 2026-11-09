# Rubix Next Runtime Strategy & Deployment Model

> **Zero-Runtime Sovereign Binaries, Capability Resolvers, and Containerless Cloud Deployment**
> *Specification Version 2.0.0-Next*

---

## 1. The Runtime Strategy: Reconciling Extremes

Computing history presents a sharp divide between:
1. **The Heavy Managed Runtime**: Java (JVM), Go (GC runtime), C# (CLR), Python (CPython VM) requiring 5MB–100MB runtimes with background garbage collector threads, signal interceptors, and large initialization costs.
2. **The Fragile Native Runtime**: C and C++ relying on platform `libc` / dynamic linkers (`ld.so`), producing binaries vulnerable to glibc version mismatches and shared library ("DLL Hell") breakage.

**Rubix Next adopts a Zero-Runtime Native Synthesis Strategy by default, paired with an optional Capability Dispatcher for managed platforms.**

```text
                               DEPLOYMENT STRATEGIES
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                 │
    STRATEGY A: SOVEREIGN NATIVE (DEFAULT)                 STRATEGY B: CAPABILITY RUNNER
        │                                                                 │
  • Zero libc / Zero External Runtime                       • Host Capability Grant / Manifest
  • Direct Kernel Syscalls (Linux, x86/ARM/RISC-V)          • MicroVM / WASI Edge Sandboxing
  • Standalone Single-Binary (<1MB, 0 Dependencies)         • Dynamic Hardware Acceleration Dispatch
  • Containerless Bare-Metal Cloud Deployment               • Polyglot Foreign Bridge Orchestration
```

---

## 2. Strategy A: Sovereign Native Single-Binary Execution

By default, Rubix Next emits standalone native executable binaries:
- **Zero libc Dependency**: On Linux, the compiler emits direct kernel system call instructions (`syscall` on x86-64, `svc #0` on AArch64, `ecall` on RISC-V64). It never links against `glibc` or `musl`.
- **Zero Dynamic Linker Overhead**: Binaries are statically relocatable with self-contained entry points (`_start`), eliminating dynamic loader latency. Startup time is under **1 millisecond**.
- **Immutable Containerless Deployment**:
  In cloud environments, developers typically package a 20MB Go or 100MB Java binary inside an 800MB Docker image containing an entire Linux distribution just to supply dynamic libraries.
  Rubix Next binaries have **zero host dependencies**. They run directly on minimal microVM kernels (e.g. Firecracker, AWS Lambda, bare metal) without Docker images, reducing cold starts from seconds to microseconds.

---

## 3. Strategy B: The Capability Runner as System Dispatcher

When deployed in multi-tenant, cloud-edge, or untrusted sandboxed environments:
- The **Runner** is NOT a slow bytecode interpreter or heavyweight VM.
- The Runner is a **Capability Resolver and Security Arbiter**:
  1. Inspects the package's declared capability manifest (`rubix.pkg`).
  2. Compares requested capabilities against the host's deployment security policy.
  3. Injects authorized capability tokens into the binary's `main(caps: MasterCap)` entry point.
  4. Enforces resource limits (memory ceilings, CPU core pinning, I/O bandwidth).

---

## 4. Multi-Platform Container Matrix

Rubix Next synthesizes direct native container formats across the major target platforms:

| Operating System | ISA Target | Binary Container | Syscall / Interface Model | Deployment Persona |
|---|---|---|---|---|
| **Linux** | `x86_64` | ELF64 Executable | Direct Linux Syscall (SysV ABI) | Cloud servers, HPC, microVMs |
| **Linux** | `aarch64` | ELF64 Executable | Direct Linux Syscall (AArch64 ABI) | ARM servers, Raspberry Pi, AWS Graviton |
| **Linux** | `riscv64` | ELF64 Executable | Direct Linux Syscall (RISC-V ABI) | Embedded, open hardware, research |
| **Windows** | `x86_64` | PE32+ (PE/COFF) | Win64 ABI / Direct syscall stubs | Desktop, enterprise workstations |
| **macOS** | `x86_64` / `arm64` | Mach-O 64-bit | Darwin Mach-O Load Commands | Developer workstations, Apple Silicon |
| **WebAssembly** | `wasm32` | WASM Binary (`.wasm`) | WebAssembly System Interface (WASI) | Edge workers, Cloudflare, Fastly, browser |

---

## 5. Binary Reproducibility & Integrity

Every emitted binary is bit-for-bit deterministic:
- Compiling the same Rubix Next source code on two different machines, in two different time zones, produces identical SHA-256 binary digests.
- The binary layout includes zero build-path leaks, zero timestamps, and zero host-specific machine artifacts.
