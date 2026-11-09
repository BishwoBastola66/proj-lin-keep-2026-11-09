# ADR-0005: Zero Ambient Authority via Unforgeable Linear Capability Tokens

* **Status**: Accepted
* **Date**: October 2026
* **Deciders**: Rubix Lead Architecture Board, Systems Security Working Group
* **Invariants Bound**: `INV-07` (Zero Ambient Authority), `INV-08` (Purity Isolation)

---

## 1. Context and Problem Statement

Standard operating systems (POSIX, Windows NT) and runtime libraries operate under the flawed model of **Ambient Authority**:
- Any function executing in a process inherits all permissions of the parent user.
- If a program imports a third-party library to parse JSON or format timestamps, that library can silently open `/etc/shadow`, bind raw network sockets, exfiltrate private keys, or invoke shell commands via `system()`.
- Supply-chain attacks (npm, PyPI, crates.io dependency poisoning) exploit ambient authority to execute malicious I/O without the host application's knowledge.

---

## 2. Decision Drivers

1. Mathematically eliminate supply-chain ambient authority exploits at compile time.
2. Ensure third-party libraries cannot perform I/O unless explicitly granted by the caller.
3. Align language capability semantics with modern capability hardware (e.g., Cambridge CHERI 128-bit architectural capabilities).
4. Maintain high execution speed without expensive virtual machine sandbox overhead.

---

## 3. Considered Options

* **Option 1: POSIX Ambient Authority with Process Sandboxing (seccomp / pledge)**: Rely on external operating system filters to restrict syscalls after process launch.
* **Option 2: WebAssembly Virtual Machine Sandbox**: Execute third-party code in WebAssembly runtimes with isolated linear memory.
* **Option 3: Compile-Time Linear Capability Tokens (Rubix Model)**: Enforce zero ambient authority at the language type system level using unforgeable linear capability tokens (`CapFs`, `CapNet`, `CapProc`, `CapTime`).

---

## 4. Decision Outcome

**Chosen Option**: **Option 3: Compile-Time Linear Capability Tokens (Rubix Model)**.

### Technical Specification
1. **Unforgeable Linear Tokens**: Capabilities are modeled as first-class unforgeable witness types:
   $$\mathcal{C} = \{ \text{CapFs}, \text{CapNet}, \text{CapProc}, \text{CapTime}, \text{CapRandom}, \text{CapUnsafe}, \text{MasterCap} \}$$
2. **Explicit Parameter Passing**: A function cannot perform filesystem I/O unless it receives a `cap: CapFs` parameter. An imported JSON parser declared as `fn parse(input: String) -> Value` cannot open files or sockets because its parameter list lacks capability tokens.
3. **Purity Confinement Theorem**: If a function is declared with `effect pure`, its required capabilities set is mathematically proven empty: $\text{Caps}(f) = \emptyset$.
4. **Hardware Co-Design (Rubix-Aegis)**: On CHERI capability hardware, software capability tokens compile directly to 128-bit hardware capability registers (`C0`–`C7`) with hardware-enforced bounds and permissions.

---

## 5. Pros and Cons of the Selected Architecture

### Positive Consequences
* **Supply-Chain Immunization**: Imported libraries are constrained by construction; malicious dependencies cannot perform unauthorized network or disk operations.
* **Zero Runtime Overhead**: Capability verification occurs entirely during compile-time type checking; capability tokens have zero runtime representation size in unboxed code paths.
* **Audit Transparency**: A function's security footprint is immediately visible in its signature.

### Negative Consequences & Mitigations
* **Explicit Parameter Passing Overhead**: Functions performing I/O must accept capability arguments.
  - *Mitigation*: Capability grouping tokens (`MasterCap`, `AppCaps`) allow bundling related permissions cleanly.

---

## 6. Implementation and Verification

* **Primary Subsystems**: `compiler/middle/typecheck.bix`, `SIR`, `std/io.bix`.
* **Verification Test**: `test_capability_enforcement` verifies that attempting to call file I/O functions without passing a `CapFs` token results in compile-time rejection.
