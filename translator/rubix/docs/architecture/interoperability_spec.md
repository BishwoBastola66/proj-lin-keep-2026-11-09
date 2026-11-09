# Rubix Next Interoperability & System Boundary Specification

> **Universal Semantic Interoperability, ABI Adapters, and Foreign System Contracts**
> *Specification Version 2.0.0-Next*

---

## 1. Beyond Classical FFI

Classical interoperability in programming languages is reduced to **Foreign Function Interface (FFI)**: exposing raw C header symbols with unvalidated pointers, completely forfeiting the host language's safety and type guarantees.

Rubix Next defines interoperability as a **Universal Semantic Interface Boundary** across:
1. **Native C / POSIX ABI** (Zero-cost C calling conventions, struct layout compatibility).
2. **Component Interface Models** (Wasm Components, language-agnostic data schemas).
3. **Structured Network & IPC Protocols** (Zero-copy serialization, protocol contracts).
4. **Foreign Language Ecosystems** (Python, Rust, Go, JavaScript, C++).
5. **AI Systems & External Evaluators** (Machine-readable AST and semantic embeddings).

---

## 2. The Four Tiers of Interoperability

```text
                               INTEROPERABILITY TIERS
                                         │
        ┌───────────────────┬────────────┴───────────┬───────────────────┐
        │                   │                        │                   │
     TIER 1              TIER 2                   TIER 3              TIER 4
    NATIVE ABI          CAPABILITY              SCHEMA &            DYNAMIC
    (C / ASM)             SANDBOX              SERIALIZATION        BRIDGES
        │                   │                        │                   │
  • SysV / Win64       • WASI imports         • Cap'n Proto       • Python C-API
  • Zero Overhead      • CHERI bounds         • FlatBuffers       • Node-API
  • CapUnsafe token    • Polyglot modules     • Protobuf / JSON   • JVM JNI
```

---

## 3. Tier 1: Zero-Cost Native C ABI with Capability Guardrails

When interfacing with operating system kernels or high-performance C libraries (OpenSSL, Vulkan, libcurl):
- Functions are declared with `extern "C"` linkage.
- Calls require the `CapUnsafe` capability token. The unsafe boundary is isolated strictly to the adapter stub, preventing unsafe contagion from spreading into safe Rubix Next business logic.
- Structs marked `#[repr(C)]` adhere strictly to System V / Win64 alignment, field offsets, and padding rules.

```rubix
extern "C" fn gettimeofday(tv: *TimeVal, tz: *TimeZone): i32 effect(syscall) with(CapUnsafe);

fn current_timestamp(cap: CapUnsafe): i64 effect(syscall) {
    let mut tv = TimeVal { sec: 0, usec: 0 };
    unsafe(cap) {
        gettimeofday(&mut tv as *TimeVal, 0 as *TimeZone);
    }
    return tv.sec;
}
```

---

## 4. Tier 2 & 3: Component Models & Zero-Copy Protocol Contracts

When interacting across process boundaries, microservices, or external languages:
- Rubix Next uses **Zero-Copy Memory-Mapped Protocol Buffers**:
  Data structures are serialized directly in their native binary memory layout.
  Passing an array of 100,000 telemetry events to an external system requires zero serialization encoding or parsing overhead; the external process maps the memory region directly.
- **Protocol Contracts**:
  Network channels enforce stateful protocol typing (session types). A socket contract defines the state machine:
  $$\text{Init} \xrightarrow{\text{Send(Hello)}} \text{Handshake} \xrightarrow{\text{Recv(Ack)}} \text{Connected}$$
  Violating the protocol order produces a compile-time type mismatch!

---

## 5. Machine-Readable AI & Tooling Interoperability

To enable intelligent coding agents and automated refactoring tools to interact with Rubix Next without parsing ambiguous text:
- The compiler provides `--json` output across all commands.
- The `rubix next ir --json` and `rubix next effects --json` commands emit the fully typed Semantic AST, basic blocks, effect signatures, and capability proofs in standardized JSON format.
- Intelligent tools can inspect, verify, and generate guaranteed-safe Rubix Next code with mathematical certainty.
