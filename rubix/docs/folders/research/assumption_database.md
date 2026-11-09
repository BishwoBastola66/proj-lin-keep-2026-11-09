# Historical Assumption Database

> **Systematic Evaluation of Implicit Assumptions in Systems Programming, Compiler Design, and Language Runtimes**
> *Prepared as Foundational Architecture for Rubix Next*

---

## 1. Overview & Analytical Criteria

Every programming language decision rests upon unstated assumptions inherited from its predecessors. Many of these assumptions were brilliant solutions to the constraints of the 1970s, 1980s, or 1990s, but have metastasized into debilitating dogmas in 2026.

For each major assumption, Rubix Next records:
1. **Origin & Historical Context**
2. **Historical Rationale**
3. **Past Benefits**
4. **Hidden Modern Costs**
5. **Modern Counter-Evidence**
6. **Current Validity Assessment**
7. **Rubix Next Replacement Principle**

---

## 2. The Core Assumption Records

### Assumption 1: "A heavy runtime or VM is necessary for cross-platform portability"
- **Origin**: UCSD Pascal p-System (1978), Java Virtual Machine (1995), Common Language Runtime (.NET, 2000).
- **Historical Rationale**: CPU architectures in the 1990s were fragmented (x86, SPARC, Alpha, MIPS, PowerPC, PA-RISC). Writing backend machine code generators for each architecture was too difficult for individual compiler teams. A universal bytecode VM abstracted away hardware differences.
- **Modern Cost**: Massive memory overhead, warmup latency, JIT compilation stutter, JIT vulnerability surfaces (memory executable & writable), inability to run in bare-metal or minimal OS environments.
- **Counter-Evidence**: Modern compilers (RUMS, LLVM) generate direct machine code for multiple architectures from a single intermediate representation. WebAssembly proved that sandboxed portability can exist without JVM-style runtime bloat.
- **Current Validity**: **INVALID.** Portability should exist at the **intermediate representation and target description layer**, not as a mandatory runtime interpreter or JIT.
- **Rubix Next Replacement**: **RUMS Next (Rubix Universal Machine Synthesis).** Direct, deterministic native binary synthesis targeting ELF, PE, Mach-O, and WASM directly from a single unified compiler backend without an external runtime VM.

---

### Assumption 2: "Manual memory management (malloc/free) is required for true systems-level control"
- **Origin**: C (Dennis Ritchie, 1972).
- **Historical Rationale**: Uniprocessors had flat memories without hardware memory tagging or compile-time lifetime checkers. The C compiler could not afford the algorithmic complexity of global lifetime analysis on a PDP-11.
- **Modern Cost**: 70% of critical security vulnerabilities (Microsoft, Google Chromium, Apple) are spatial/temporal memory corruptions: use-after-free, double-free, buffer overruns, uninitialized reads.
- **Counter-Evidence**: Rust proved that affine types and borrow checking can eliminate memory safety bugs at compile time with zero runtime overhead. Vale, Austral, and Cyclone demonstrated linear resource proofs.
- **Current Validity**: **INVALID.** Manual memory is not a virtue; it is an omission of compile-time information.
- **Rubix Next Replacement**: **Affine Ownership + Region Arenas + Escape Analysis.** Static compile-time lifetime verification guarantees zero use-after-free and zero double-free without any runtime tracing garbage collector.

---

### Assumption 3: "Garbage collection is mandatory for developer ergonomics and high productivity"
- **Origin**: Lisp (John McCarthy, 1958), Smalltalk (1980), Java (1995), Python, Ruby, Go.
- **Historical Rationale**: Programmers spent 40% of their debugging time chasing memory leaks and dangling pointers. Automatic reclamation liberated the developer.
- **Modern Cost**: Unpredictable latency spikes, memory overhead (2x–3x heap expansion required for GC efficiency), complete destruction of hardware cache prefetching when traversing pointer graphs.
- **Counter-Evidence**: Modern Rust and Swift developers build complex systems with high productivity without tracing GC.
- **Current Validity**: **INVALID.** Ergonomics can be achieved through **compile-time lifetime inference, lexical regions, and value semantics**.
- **Rubix Next Replacement**: **Zero-GC Frictionless Memory.** Values on the stack and within lexical region arenas require zero manual memory management and zero GC pauses.

---

### Assumption 4: "Type information must disappear after semantic checking (Type Erasure)"
- **Origin**: C (types dropped at codegen), Java Generics (erased to `Object`), C++ (templates monomorphized and type tags erased).
- **Historical Rationale**: Memory was scarce; maintaining rich runtime type descriptors bloated binary size and instruction cache footprint.
- **Modern Cost**: Inability of backend optimizers to exploit high-level invariant knowledge; fragile and dangerous FFI; inability of modern AI or tooling to inspect program semantics in compiled artifacts.
- **Counter-Evidence**: MLIR, Swift metadata, and type-directed optimization (TDO) show that retaining semantic and layout facts deep into code generation enables superior vectorization, devirtualization, and layout synthesis.
- **Current Validity**: **INVALID.** High-level semantics should be preserved as late as possible through compilation.
- **Rubix Next Replacement**: **Multi-Stage Semantic IR (SIR -> AIR -> UIR -> RUMS).** Semantic types, effect constraints, and capability bounds are preserved until final hardware register allocation.

---

### Assumption 5: "System calls and foreign function interfaces (FFI) are inherently unsafe and untrackable"
- **Origin**: C standard library, POSIX ambient authority.
- **Historical Rationale**: The operating system kernel was assumed to be the sole security perimeter. Any user-space process had the right to call any syscall (`sys_open`, `sys_write`, `sys_socket`) if file permissions allowed.
- **Modern Cost**: RCE (Remote Code Execution) and supply-chain attacks exploit ambient syscall authority to compromise machines.
- **Counter-Evidence**: CHERI hardware capabilities, WebAssembly System Interface (WASI), Capsicum, OpenBSD `pledge`/`unveil`.
- **Current Validity**: **INVALID.** System calls and external FFI calls can and must be governed by compile-time capability tokens.
- **Rubix Next Replacement**: **First-Class Capability Tokens (`CapFs`, `CapNet`, `CapProc`, `CapUnsafe`).** A function cannot perform a syscall or invoke foreign C libraries unless explicitly granted the capability token by the caller.

---

### Assumption 6: "The Operating System is below the programming language, and the language must submit to POSIX"
- **Origin**: UNIX & C co-evolution (1970s).
- **Historical Rationale**: POSIX standardized the kernel interface across differing minicomputers and mainframes.
- **Modern Cost**: POSIX is a 50-year-old abstraction designed around synchronous blocking file descriptors, fork-exec process duplication, and ambient authority. It is notoriously inefficient for modern asynchronous IO (e.g., io_uring), modern capability hardware (CHERI), and distributed architectures.
- **Counter-Evidence**: Unikernels, SeL4, WASI, and Windows NT native NTDLL abstractions bypass POSIX for higher performance and security.
- **Current Validity**: **CONDITIONALLY OBSOLETE.** POSIX is a legacy compatibility target, not a universal law of nature.
- **Rubix Next Replacement**: **Target Platform Abstraction with Direct Kernel Syscalls and Capability Sandboxing.** Rubix interacts directly with Linux syscalls, Windows NT, macOS Mach, or WASI, eliminating unnecessary libc middleware.

---

### Assumption 7: "Build systems, package managers, and debuggers are separate external tools"
- **Origin**: Make (Stuart Feldman, 1976), CMake, Autotools, gdb, npm, Cargo.
- **Historical Rationale**: Separation of concerns in the UNIX philosophy ("Do one thing and do it well"). Small memory footprints required separate executables.
- **Modern Cost**: Tower of Babel in tooling: complex build scripts written in Python/CMake/Bash, mismatched compiler flags, non-reproducible builds, divergent AST parsers in LSP vs linter vs compiler vs debugger.
- **Counter-Evidence**: Zig's `build.zig`, Go's integrated toolchain (`go test`, `go build`, `go vet`), Rust's Cargo.
- **Current Validity**: **INVALID.** The compiler is a semantic database; build orchestration, testing, formatting, and diagnostics should be native operations powered by the same compiler core.
- **Rubix Next Replacement**: **Unified Semantic Compiler Toolchain.** Compiler, verification engine, test runner, benchmark harness, and packaging are unified under a single coherent Rubix Next command architecture (`rubix next <check|compile|run|bench|ir|effects>`).

---

### Assumption 8: "AI systems and program synthesizers belong entirely outside the language and compiler"
- **Origin**: 2020–2024 LLM coding assistants (Copilot, ChatGPT) treating source code purely as natural language text tokens.
- **Historical Rationale**: Compilers were opaque command-line binaries that ingested ASCII text and spat out machine code; AI models operated purely at the textual level.
- **Modern Cost**: High hallucination rates, type-checker rejection loops, inability of LLMs to verify semantic invariants, borrow lifetimes, or capability constraints without external trial-and-error.
- **Counter-Evidence**: Program synthesis research, Proof-Carrying Code (Necula), typed semantic embeddings.
- **Current Validity**: **INVALID.** A modern language should expose its typed semantic graph, capability ledger, and proof obligations directly to intelligent tools.
- **Rubix Next Replacement**: **Machine-Readable Semantic Interfaces (`--json` diagnostics, SIR exports, effect ledgers).** Exposes typed ASTs, effect constraints, and verification proofs in structured machine format so AI agents can reason about, verify, and synthesize correct Rubix Next code with zero guesswork.
