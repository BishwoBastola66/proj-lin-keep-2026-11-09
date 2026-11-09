# Foundational Principles of Rubix

> [!NOTE]
> **Status: Superseded & Consolidated into [25-rubix-principles.md](file:///home/bishwaxyz/translator/rubix/docs/research/25-rubix-principles.md)**.
> This preliminary document has been unified into the comprehensive Rubix Research Synthesis in `25-rubix-principles.md`, reflecting the single unified Rubix compiler architecture.

---

## Principle 1: Semantic Preservation Across Compilation
- **What Rubix Next Believes**: High-level semantic information (types, effects, resource lifetimes, non-aliasing facts, capability bounds) must not be erased prematurely; it must be preserved deep into the compiler pipeline until final machine code synthesis.
- **Why**: Traditional compilers lower AST to flat machine-like IR early, destroying structural knowledge. Once destroyed, later optimizer passes must spend massive CPU time attempting to reconstruct alias graphs and purity through fragile heuristic analysis.
- **Historical Evidence For**: MLIR, Fortran's alias-free optimization, Swift SIL, Wasm validation.
- **Historical Evidence Contradicting**: C/UNIX early type erasure (which was necessary only because PDP-11 memory could not hold rich compiler data structures).
- **Technology Making It Possible Now**: Multi-stage typed IRs (SIR -> AIR -> PIR) held in compact arena-allocated memory buffers on 64-bit systems.
- **How It Is Implemented**: SIR (Semantic Intermediate Representation) explicitly encodes types, effect sets, and capability contracts. AIR (Affine Intermediate Representation) encodes resource lifetimes and borrow trees before lowering to UIR/RUMS.
- **How It Is Tested**: Invariant verification passes (`sir_verify_module`, `air_verify_resources`) that check semantic invariants at every pipeline boundary.

---

## Principle 2: Memory Safety Without Garbage Collection
- **What Rubix Next Believes**: Memory safety (both spatial and temporal) can and must be achieved with ZERO runtime tracing garbage collection, ZERO stop-the-world pauses, and ZERO reference-counting overhead by default.
- **Why**: Modern hardware memory latency is hundreds of times slower than compute. Tracing garbage collectors destroy CPU cache locality and introduce unacceptable p99 tail latency.
- **Historical Evidence For**: Rust’s affine ownership, Cyclone’s region types, Baker’s linear logic, Austral's linear types.
- **Historical Evidence Contradicting**: Java, Python, Go, and Lisp claims that GC is the only way to achieve memory safety and developer productivity.
- **Technology Making It Possible Now**: Affine ownership tracking combined with automated escape analysis and lexical region arenas.
- **How It Is Implemented**: Every resource has a single unique owner. Moving a resource transfers ownership in O(1) time. Borrowing creates a scoped read or write reference. Non-escaping allocations are automatically promoted to stack arenas.
- **How It Is Tested**: Compile-time test suite (`test_affine_borrow.bix`) asserting that use-after-move and double-free trigger compile-time diagnostic errors.

---

## Principle 3: Algebraic Effects as Optimization Knowledge
- **What Rubix Next Believes**: Effects (e.g. `pure`, `read`, `write`, `alloc`, `syscall`, `io`, `net`) are not runtime monadic wrappers; they are compile-time algebraic sets that serve as first-class optimization intelligence and security contracts.
- **Why**: A pure function can be memoized, hoisted out of loops, dead-code eliminated if unused, or parallelized across CPU cores with zero synchronization. An impure function with `net` effects cannot. Statically knowing this allows aggressive, provably sound compiler transformations.
- **Historical Evidence For**: Haskell purity advantages, Koka effect systems, Fortran pure subroutines.
- **Historical Evidence Contradicting**: C/C++ `const` qualifiers, which are easily cast away (`const_cast`) and do not convey purity to the optimizer.
- **Technology Making It Possible Now**: Compile-time effect lattice inference and bitmask representation.
- **How It Is Implemented**: Each function has an effect bitmask (`EFFECT_PURE`, `EFFECT_READ`, `EFFECT_WRITE`, `EFFECT_ALLOC`, `EFFECT_IO`, `EFFECT_SYSCALL`, `EFFECT_NET`). The compiler propagates effects up the call graph and optimizes accordingly.
- **How It Is Tested**: Diagnostic tests (`test_effects.bix`) validating that calling an I/O function from a `pure` function is rejected at compile time, and optimizing pure loops into closed-form constants.

---

## Principle 4: Capability-Governed System Boundaries (Zero Ambient Authority)
- **What Rubix Next Believes**: No code may execute privileged operations (file system, network, process control, raw pointer manipulation) through ambient authority. Every privileged operation requires an unforgeable capability token.
- **Why**: Ambient authority is the root cause of supply-chain attacks, unauthorized data exfiltration, and sandbox escapes. If a function does not possess `CapNet`, it is physically impossible for it to exfiltrate data over a socket.
- **Historical Evidence For**: CHERI hardware capability architecture, WASI, KeyKOS, E language, Capsicum.
- **Historical Evidence Contradicting**: POSIX ambient authority, C `open()` and `socket()` callable anywhere in any translation unit.
- **Technology Making It Possible Now**: Linear/affine capability tokens passed explicitly down the call stack or injected via module boundaries.
- **How It Is Implemented**: Syscall primitives (`sys_open`, `sys_socket`) require a first-class capability parameter (`CapFs`, `CapNet`). The compiler verifies capability possession at the call site.
- **How It Is Tested**: Security regression tests (`test_capabilities.bix`) verifying that attempting a file write or network call without a valid capability token fails compilation.

---

## Principle 5: Sovereign Native Synthesis via Machine Models
- **What Rubix Next Believes**: A programming language must maintain an independent, self-contained native code generation system capable of directly producing standalone binaries (ELF, PE, Mach-O, WASM) without mandatory external dependencies on LLVM, GCC, or platform assemblers.
- **Why**: Dependency on massive external toolchains compromises compile-time velocity, inflates distribution footprints, and forfeits language architectural sovereignty.
- **Historical Evidence For**: Turbo Pascal (compiling thousands of lines per second in 1983), Go’s independent native compiler, current Rubix RUMS engine.
- **Historical Evidence Contradicting**: Rust, Swift, and Julia requiring multi-gigabyte LLVM installations and enduring slow build iterations.
- **Technology Making It Possible Now**: RUMS Next (Rubix Universal Machine Synthesis), driven by declarative `.machine` models mapping virtual IR to native instruction encodings and ABI standards.
- **How It Is Implemented**: Compact architecture description tables, fast linear-scan register allocation, and direct binary container emission (`elf.bix`, `pe_coff.bix`, `macho.bix`, `wasm.bix`).
- **How It Is Tested**: Bootstrap determinism tests verifying bit-for-bit Stage 2 == Stage 3 binary identity, and QEMU multi-target tests (x86_64, AArch64, RISC-V64).

---

## Principle 6: The Integrated Toolchain as a Semantic Database
- **What Rubix Next Believes**: The compiler, linter, formatter, test runner, benchmark harness, and packaging system are not fragmented external programs; they are views into a single, unified compiler semantic database.
- **Why**: Disparate tools lead to out-of-sync parsers, mismatched compiler flags, fragile build scripts, and catastrophic developer friction.
- **Historical Evidence For**: Go’s integrated toolchain (`go test`, `go build`, `go fmt`), Cargo.
- **Historical Evidence Contradicting**: The C/C++ tooling fragmentation (Make + CMake + Ninja + Conan + vcpkg + Clang-Tidy + GDB + Valgrind).
- **Technology Making It Possible Now**: Unified CLI dispatcher in the Rubix binary that shares AST, symbol tables, and execution engines across all developer commands.
- **How It Is Implemented**: `rubix next <check|compile|run|bench|ir|effects>` integrated into the core compiler entry point.
- **How It Is Tested**: Test suite verifying that `check`, `compile`, and `run` produce identical semantic outcomes.
