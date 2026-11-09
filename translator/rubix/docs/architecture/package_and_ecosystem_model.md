# Rubix Next Sovereign Package & Ecosystem Model

> **Hermetic Content-Addressed Packages, Capability-Governed Manifests, and Prevention of Supply-Chain Failures**
> *Specification Version 2.0.0-Next*

---

## 1. Executive Directive & Scope

In accordance with Section 57 of the architectural directive:
> **Rubix is ultimately intended to have its own complete ecosystem. Do not design Rubix Next around permanently depending on existing package ecosystems such as npmjs, PyPI, crates.io, Maven, or NuGet. Defer the centralized public registry until the language core, semantic model, and native synthesis architecture are stabilized.**

This specification outlines the foundational principles and metadata architecture of the Rubix sovereign package model, immunizing the ecosystem against the systemic failures that plague existing language package managers.

---

## 2. Autopsy of Existing Package Manager Failures

```text
ECOSYSTEM       PATHOLOGY                            SECURITY CONSEQUENCE
──────────────────────────────────────────────────────────────────────────
npm             Dependency Explosion, Left-Pad,      Event-Stream Bitcoin Theft,
                Unsandboxed `postinstall` Hooks       Arbitrary Local Code Execution
PyPI            Typosquatting, No Build Sandboxing,  Credential Stealing via setup.py
                Dynamic Version Drift                Non-deterministic deployments
Cargo (Rust)    Arbitrary `build.rs` Code Exec,      Malicious macro/build script
                Complex Transitive Dependency Trees   reads ~/.ssh and contacts C2
C / C++ (CMake) Total Fragmentation, Fragile Flags,  Build configuration divergence,
                Orphan Header Files                  Missing transitive dependencies
```

---

## 3. Principles of the Rubix Sovereign Package Architecture

### Principle 1: Zero Ambient Authority Package Manifests
In conventional package managers, an imported dependency inherits full system access. In Rubix Next, packages must declare their required capabilities explicitly in their manifest (`rubix.pkg`):

```toml
[package]
name = "crypto-core"
version = "1.0.0"
hash = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

[capabilities]
allowed = ["CapRandom"]
forbidden = ["CapFs", "CapNet", "CapProc", "CapUnsafe"]
```

If `crypto-core` is compromised and attempts to open a network socket or read `/etc/passwd`, the compiler **refuses to build** because `CapNet` and `CapFs` are forbidden.

### Principle 2: Content-Addressable Immutability (CAS)
Packages are identified not by mutable branch names or tags, but by their cryptographic content hashes (SHA-256).
- Modifying a single character of a dependency changes its hash, immediately invalidating the build.
- Builds are 100% hermetic, offline-capable, and reproducible.

### Principle 3: Elimination of Build Scripts
Rubix Next strictly bans arbitrary pre-install or build-time scripts (such as `build.rs`, `postinstall`, or `setup.py`).
- Metaprogramming and platform specialization occur exclusively within the language via verified `comptime` logic and declarative `.machine` models.
- A package cannot execute arbitrary shell commands during resolution or compilation.

### Principle 4: Unified Semantic Toolchain
The developer does not juggle ten disjoint CLI utilities (`make`, `cmake`, `ninja`, `conan`, `pip`, `npm`, `gdb`, `valgrind`).
All developer operations are unified directly into the sovereign `rubix` multi-call binary:
- `rubix next check` — Semantic, effect, and capability type checking
- `rubix next effects` — Function effect ledger and capability inspection
- `rubix next air` — Affine IR and escape analysis visualization
- `rubix next run` — Native execution with capability verification
- `rubix next compile` — Sovereign native ELF/PE/Mach-O/WASM compilation

---

## 4. Roadmap to Ecosystem Maturity

1. **Phase 1 (Current)**: Language Core, Compiler Architecture, Semantic Invariant Engine, RUMS Native Synthesis.
2. **Phase 2 (Immediate Horizon)**: Standard Library expansion (Networking, High-performance Collections, Cryptographic Primitives).
3. **Phase 3 (Ecosystem Deployment)**: Sovereign Content-Addressed Package Registry and Distributed Verification Network.
