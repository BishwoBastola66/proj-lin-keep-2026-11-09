# Unified Rubix Compiler & Ecosystem Architecture

```text
                                 THE UNIFIED RUBIX PIPELINE
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │                 Source Program                │
                      │               (*.bix source code)             │
                      └───────────────────────┬───────────────────────┘
                                              │ Lexing & Streaming Tokenizer
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │              Frontend Token Stream            │
                      │               (compiler/frontend)             │
                      └───────────────────────┬───────────────────────┘
                                              │ Recursive Descent AST Parsing
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │         SIR (Semantic Intermediate Rep)       │
                      │     Types, Effect Rows, Capability Ledger     │
                      └───────────────────────┬───────────────────────┘
                                              │ Purity Verification & Capability Proofs
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │       AIR (Affine Intermediate Rep)           │
                      │   Resource Moves, Borrows, Region Lifetimes   │
                      └───────────────────────┬───────────────────────┘
                                              │ Escape Analysis & Stack Promotion
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │           UIR (Unified Low-Level IR)          │
                      │        Basic Blocks, CFG, Canonical Types     │
                      └───────────────────────┬───────────────────────┘
                                              │ Algebraic & SSA Optimizations
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │         RUMS Machine Synthesis Engine         │
                      │  Target Model, Register Allocation, MachDesc  │
                      └───────────────────────┬───────────────────────┘
                                              │ Target-Specific Instruction Selection
                                              ▼
                      ┌───────────────────────────────────────────────┐
                      │           Native Binary Packaging             │
                      │  Direct ELF64 / PE32+ / Mach-O / WASI 0.3     │
                      └───────────────────────────────────────────────┘
```

## 1. Architectural Mandate: One Unified Rubix

The architectural dichotomy between "Rubix" and "Rubix Next" is permanently unified into **One Rubix**:
* A single language syntax and type system.
* A single compiler driver executable (`./bin/rubix`).
* A unified multi-stage intermediate representation pipeline: $\text{Source} \to \text{SIR} \to \text{AIR} \to \text{UIR} \to \text{Machine Bytes} \to \text{Native Container}$.
* Zero external toolchain dependencies: zero GCC, zero Clang, zero LLVM, zero Python.

---

## 2. Language Semantics & Type System

### 2.1 Primitive and Compound Types
In [compiler/frontend/token.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/token.bix) and [compiler/common/sir_types.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/sir_types.bix):
* **Signed Integers**: `i64` (64-bit), `i32` (32-bit).
* **Unsigned Integers**: `u8` (8-bit byte).
* **Floating-Point**: `f64` (IEEE 754 double precision), `f32` (single precision).
* **Booleans**: `bool` (1-byte true/false).
* **Characters**: `char` (Unicode code point / 32-bit scalar).
* **Pointers & References**: `ptr` (untyped native address), `&T` (borrowed reference), `&mut T` (mutable reference).
* **Strings**: `str` (contiguous UTF-8 sequence, 64-bit pointer + 64-bit length header, null-terminated for C FFI compatibility).
* **Compound Types**: Structs (`struct Point { x: i64, y: i64 }`), Enums (`enum Status { Ok, Err }`), Tuples, and Arrays (`[T; N]`).

### 2.2 Deterministic Arithmetic Semantics
Rubix provides explicit operator tokens for arithmetic semantics:
* Standard operators (`+`, `-`, `*`): Standard two's-complement arithmetic.
* Checked / Trapping operators (`+!`, `-!`, `*!`): Trap immediately on integer overflow.
* Saturating operators (`+?`, `-?`, `*?`): Saturate at maximum or minimum integer boundaries.

---

## 3. The Tri-Tier Memory System

Rubix eliminates tracing garbage collection without burdening developers with manual `malloc`/`free` pointer arithmetic:

```text
                                  Memory Tiers
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
      Tier 1                        Tier 2                        Tier 3
   Stack Promoted               Lexical Regions               Affine Handles
  (Escape Analysis)             (Bump Arenas)             (Deterministic Drop)
  Zero Allocation               Bulk Deallocation          Linear Resource Moves
  L1 Cache Hot                  No Fragmentation           Exclusive Ownership
```

1. **Tier 1 (Automated Stack Promotion)**: In [compiler/middle/escape_analysis.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/escape_analysis.bix), objects that do not escape their defining function scope are promoted to stack local frames.
2. **Tier 2 (Lexical Region Arenas)**: Temporary batch allocations (such as parser AST nodes or HTTP request processing) allocate from a bump-pointer region arena. Upon exiting the lexical scope, the entire arena is reclaimed in $O(1)$ time with zero fragmentation.
3. **Tier 3 (Affine Unique Handles)**: In [compiler/middle/air.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/air.bix), long-lived resources (file descriptors, sockets, dynamic buffers) are governed by affine ownership rules. When passed by value (`AIR_OP_MOVE`), ownership is transferred. When out of scope, resources are deterministically finalized (`AIR_OP_DROP`).

---

## 4. The Algebraic Effect and Capability Security Architecture

### 4.1 Effect Lattice
In [compiler/common/effects.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/effects.bix), functions declare their side-effect profile:
* `EFFECT_PURE` (0x0): Mathematical purity. No I/O, no mutation of external state, no non-determinism.
* `EFFECT_IO` (0x1): General input/output.
* `EFFECT_FS` (0x2): File system access.
* `EFFECT_NET` (0x4): Network operations.
* `EFFECT_MUT` (0x8): Mutation of shared heap memory.
* `EFFECT_ASYNC` (0x10): Asynchronous suspension and resumption.

### 4.2 Capability Tokens (Zero Ambient Authority)
In [compiler/common/capabilities.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/capabilities.bix), privileged operations require explicit capability tokens:
* `CAP_PROCESS` (1), `CAP_FILE_IO` (2), `CAP_MEMORY_MAP` (4), `CAP_THREADS` (8), `CAP_ATOMICS` (16), `CAP_CLOCK` (32), `CAP_RANDOM` (64), `CAP_CONSOLE` (128), `CAP_ENV` (256), `CAP_DYNAMIC_LOADING` (512).

---

## 5. Multi-Stage Sovereign IR Pipeline

The Rubix compiler lowers programs across four strictly typed representations:

1. **SIR (Semantic Intermediate Representation)**:
   * Retains full source typing, effect rows, and capability demands.
   * Performs semantic verification: rejects pure violations (`ERR_SIR_PURITY_VIOLATION = -101`) and unauthorized capabilities (`ERR_SIR_CAPABILITY_UNAUTHORIZED = -102`).
2. **AIR (Affine Intermediate Representation)**:
   * Models resource ownership transfers (`AIR_OP_MOVE`), scoped borrows (`AIR_OP_BORROW`), region entries/exits (`AIR_OP_REGION_ENTER`, `AIR_OP_REGION_LEAVE`), and stack promotions (`AIR_OP_STACK_PROMOTE`).
   * Performs the affine borrow checking pass and pure dead-code elimination.
3. **UIR (Unified Low-Level IR)**:
   * Lowers AIR into basic blocks and a Control Flow Graph (CFG).
   * Virtual register assignments, canonical type lowering, and constant folding.
4. **Machine Code (RUMS)**:
   * Selects target-specific machine instructions.
   * Performs linear-scan and graph-coloring register allocation.
   * Emits raw bytes into executable segments (`.text`, `.rodata`, `.data`).

---

## 6. RUMS Machine Synthesis & Target Model

In [compiler/rums/machdesc.bix](file:///home/bishwaxyz/translator/rubix/compiler/rums/machdesc.bix) and [compiler/target/target.bix](file:///home/bishwaxyz/translator/rubix/compiler/target/target.bix):
* **Target Architectures**:
  * `TARGET_X86_64` (Linux ELF64, Windows PE/COFF, macOS Mach-O).
  * `TARGET_ARM64` (Linux ELF64, macOS Mach-O).
  * `TARGET_RISCV64` (Linux ELF64).
  * `TARGET_WASM` (WASI 0.3 component module).
* **Hardware Feature Detection**:
  * Intel/AMD: `FEAT_BASELINE`, `FEAT_SSE2`, `FEAT_SSE4`, `FEAT_AVX`, `FEAT_AVX2`.
  * Arm: `FEAT_NEON`, `FEAT_SVE`.
  * RISC-V: `FEAT_RV_M`, `FEAT_RV_A`, `FEAT_RV_C`, `FEAT_RV_F`, `FEAT_RV_D`.
  * WebAssembly: `FEAT_WASM_SIMD`.

---

## 7. Operating System Layer & Binary Containers

The packaging subsystem directly writes standard binary containers:
* **Linux ELF64** ([compiler/packaging/elf.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/elf.bix)): Emits compliant 64-bit ELF headers, program headers (`PT_LOAD`), `.text`, and entry stubs.
* **Windows PE/COFF** ([compiler/packaging/pe_coff.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/pe_coff.bix)): Emits PE32+ headers, Optional Headers, Section Tables, and import tables for `kernel32.dll`.
* **macOS Mach-O** ([compiler/packaging/macho.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/macho.bix)): Emits 64-bit Mach-O headers, `LC_SEGMENT_64`, `LC_MAIN`, and dynamic link commands.
* **WebAssembly WASI 0.3** ([compiler/packaging/wasm.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/wasm.bix)): Emits WASM binary modules (`\0asm\1\0\0\0`) with type, function, memory, export, and code sections.

---

## 8. Standard Library & Ecosystem Foundation

The standard library in [std/](file:///home/bishwaxyz/translator/rubix/std/) provides the foundational building blocks:
* `std/core.bix`: Core builtins, memory primitives, system call bindings.
* `std/memory.bix`: Arena allocators, region management, slice views.
* `std/string.bix`: High-performance UTF-8 string manipulation, formatters, slicing.
* `std/collections.bix`: Dynamic arrays (`Vector`), hash maps (`Map`), ring buffers.
* Extended modules in `std/archive/` (network, wire serialization, async, processes) are progressively unified into the main tree as capability and effect contracts stabilize.

---

## 9. Toolchain Commands & Developer Experience

The single `rubix` binary provides a unified CLI:
```bash
rubix <file.bix>                        Compile and execute immediately in memory
rubix compile <file.bix> [-o out] [-t target]  Synthesize sovereign native binary
rubix check <file.bix> [--json]          Verify syntax, types, effects, and capabilities
rubix air <file.bix>                     Inspect Affine IR, escape analysis, and borrow ledger
rubix effects <file.bix>                 Inspect declared effects and required capabilities
rubix test <file.bix>                    Run executable tests and verify exit code
rubix bench <file.bix>                   Measure execution throughput and memory behavior
rubix target list / show <triple>        Display target specifications and available CPU features
```

---

## 10. Summary

The unified Rubix architecture demonstrates that safety, productivity, and bare-metal performance can coexist in a single language. By synthesizing algebraic effects, capability security, affine memory tracking, and direct native machine-code emission, Rubix provides a complete platform for 21st-century systems programming.
