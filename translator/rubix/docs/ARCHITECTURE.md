# Rubix Architecture Specification

Rubix is an autonomous, self-hosting systems programming language designed for deterministic native execution, mechanical sympathy, and zero toolchain bloat.

---

## 1. High-Level Architecture Overview

The Rubix compiler operates as a single, self-contained native pipeline without delegating to external assemblers, linkers, or runtimes:

```
+-------------------------------------------------------------+
|                      Rubix Source Code                      | (*.bix)
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|    Streaming Lexers (lexer.bix / sir_lexer.bix)             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  Semantic Intermediate Representation (SIR)                 |
|   - AST (sir_ast.bix), Parsers (parser.bix / sir_parser.bix)|
|   - Type & Effect Checking (sir_typecheck.bix)              |
|   - Purity Verification & Capability Token Proofs           |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  Affine Resource Intermediate Representation (AIR)          |
|   - Resource Moves, Borrows, Drops (air.bix)                |
|   - Interprocedural Escape Analysis (escape_analysis.bix)   |
|   - Affine Borrow Checker (borrow_checker.bix)              |
|   - Pure Dead-Code Elimination (effect_optimizer.bix)       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  Universal IR (UIR) & Optimization Passes                   |
|   - AIR to UIR Bridge (air_to_uir.bix)                      |
|   - CFG & Basic Blocks (uir.bix)                            |
|   - Algebraic Optimizer (optimizer.bix)                     |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  RUMS: Rubix Universal Machine Synthesis (compiler/rums/)   |
|   - Hardware Model & Cost Evaluation (machdesc.bix, rums.bix|
|   - Architecture-Agnostic Register Allocator (regalloc.bix) |
|   - Target Instruction Selector & Superoptimizer (isel.bix) |
+-------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
+-----------------------------------+   +-----------------------------------+
| Container Packagers               |   | In-Memory Execution               |
| - Linux ELF64 (elf.bix)           |   | - W^X Native Direct Run           |
| - Windows PE/COFF (pe_coff.bix)   |   |   (sys_mprotect, executor.bix)    |
| - macOS Mach-O (macho.bix)        |   +-----------------------------------+
| - WASI 0.3 (wasm.bix)             |
+-----------------------------------+
          |
          v
[ Sovereign Native Standalone Executables ]
```

---

## 2. Compiler Subsystems & Directory Layout

### Common (`compiler/common/`)
- **`capabilities.bix`**: Unforgeable capability tokens (`CAP_FILE_IO`, `CAP_NET`, `CAP_PROCESS`, `CAP_MEMORY_MAP`).
- **`effects.bix`**: Typed algebraic effect lattice constants (`EFFECT_PURE`, `EFFECT_IO`, `EFFECT_FS`, `EFFECT_NET`, `EFFECT_MUT`).
- **`sir_types.bix`**: High-level semantic type identifiers and canonical conversions.
- **`memory_layout.bix`**: Struct field alignment, padding, and stack layout calculations.
- **`symbol_tables.bix`**: Lexical scopes, identifier hashing, and variable bindings.

### Frontend (`compiler/frontend/`)
- **`lexer.bix`**: Streaming token scanner operating directly over raw mmapped byte buffers. Zero allocation per token.
- **`ast.bix`**: AST node representations and memory pool allocation.
- **`symtab.bix`**: Symbol tables for local variables, global symbols, structs, and enums.
- **`parser.bix`**: Recursive descent parser handling statement and expression grammar.
- **`sir_ast.bix`**: Semantic AST representation capturing effects, capabilities, and types.
- **`sir_lexer.bix` & `sir_parser.bix`**: Dedicated lexer and parser for semantic contracts.
- **`sir_typecheck.bix`**: Static verification of effect purity and capability tokens.

### Middle-End (`compiler/middle/`)
- **`semantic_driver.bix`**: Master coordinator for the multi-stage pipeline ($\text{SIR} \to \text{AIR} \to \text{UIR}$).
- **`air.bix`**: Affine Intermediate Representation tracking resource moves, borrows, and drops.
- **`escape_analysis.bix`**: Interprocedural pointer escape analysis performing automated stack promotion.
- **`borrow_checker.bix`**: Monotonic resource state machine verifying affine uniqueness.
- **`effect_optimizer.bix`**: Purity-driven dead-code elimination (DCE).
- **`uir.bix`**: Hardware-independent Universal Rubix Intermediate Representation.
- **`optimizer.bix`**: Sequential optimization pass manager providing constant folding and algebraic simplification.
- **`warnings.bix`**: Canonical diagnostic scanner analyzing UIR streams for unreachable code and semantic warnings.

### Universal Target Architecture (`compiler/target/`)
- **`target.bix`**: Universal Target composition model:
  `Target = ISA + CPU Features + ABI + OS + ObjectFormat + Runtime + Capabilities`.
  - Target triple/quadruple parser supporting standard triples and aliases.
  - Target-independent Data Layout model (pointer width, alignment, endianness, string layout).
  - First-class ABI layer (System V AMD64, Microsoft x64, AAPCS64, RISC-V LP64, WASI).
  - Platform capabilities bitmask (`process`, `file_io`, `memory_map`, `threads`, `atomics`, `clock`, `random`, `console`, `env`).
  - CPU features bitmask (`baseline`, `sse2`, `sse4`, `avx`, `avx2`, `neon`, `sve`, `rv_m`, `rv_a`, `rv_c`, `rv_f`, `rv_d`, `wasm_simd`).

### Backend & Universal Machine Synthesis (`compiler/rums/` & `compiler/backend/`)
- **`air_to_uir.bix`**: Lowering bridge translating verified AIR affine nodes into UIR.
- **`isel.bix`**: Target instruction selection and bounded peephole superoptimization.
- **`machdesc.bix`**: Target machine description capturing physical register pools, ABI calling conventions, instruction pattern encodings, and operand bit shifts from declarative `.machine` specifications.
- **`regalloc.bix`**: Target-independent linear-scan register allocator with preferred register hints and spill weight calculation.
- **`rums.bix`**: Rubix Universal Machine Synthesis backend lowering UIR directly into machine code bytes for target architectures (`x86_64`, `aarch64`, `riscv64`).
- **`uir_bridge.bix` & `emitter.bix`**: Direct machine code synthesizer emitting native instructions.

### Packaging & Execution (`compiler/packaging/` & `compiler/executor/`)
- **`elf.bix`**: Encapsulates machine code bytes into valid ELF64 executables for x86-64, AArch64, and RISC-V 64.
- **`pe_coff.bix`**: Encapsulates machine code bytes into valid PE32+ Windows executables (.exe) and COFF objects (.obj).
- **`macho.bix`**: Encapsulates machine code bytes into 64-bit Mach-O objects (.macho) for macOS / Darwin.
- **`wasm.bix`**: Packages WebAssembly binary modules (.wasm) for WASI environments.
- **`executor.bix`**: Direct in-memory runner applying W^X security transitions (`mprotect(PROT_READ | PROT_EXEC)`) before executing entry addresses on the CPU.

---

## 3. Core Design Principles

1. **One Unified Rubix**: Single language, single compiler binary (`rubix`), single semantic pipeline.
2. **Zero External Toolchain Dependencies**: Direct synthesis of native machine bytes into ELF, PE, Mach-O, and WASM containers with zero GCC, zero Clang, zero LLVM.
3. **Zero-Ambient Authority**: All privileged operations require an unforgeable capability token verified at compile time.
4. **Purity as an Optimization Domain**: Typed algebraic effects allow provably sound dead-code elimination and auto-parallelization.
5. **Tri-Tier Memory Safety Without GC**: Affine ownership + lexical region arenas + automated stack promotion provide 100% memory safety with zero garbage collection overhead.
6. **Deterministic Self-Hosting Bootstrap**: Stage 2 compiling the source code yields a Stage 3 executable that matches Stage 2 byte-for-byte ($\text{SHA256}(\text{Stage 2}) \equiv \text{SHA256}(\text{Stage 3})$).
7. **Hardware Sympathy**: Direct memory buffers, micro-op fusion awareness, 32-register modeling (Intel APX / Arm64), and minimization of off-chip DRAM traffic.

---

## 4. The Eternal Interface Architecture (EIA)

Detailed in [`rubix/docs/eternal-interface-architecture/`](file:///home/bishwaxyz/translator/rubix/docs/eternal-interface-architecture/):
* **Core Principle**: Completely eliminates fragile, periodic ABI churn (the 6-month/annual obsolescence trap) by establishing immutable mathematical semantic contracts ($\Sigma_\infty$).
* **Zero-Maintenance Guarantee**: Delivers 100% binary longevity across decades with **$0.000\text{ ns}$ runtime indirection penalties** via In-Memory JIT Displacement Hole Patching, autonomous Intel APX 32-register negotiation, and multi-core SMP cache invalidation broadcast pipelines (`dc cvau` $\to$ `dsb ish` $\to$ `ic ivau` $\to$ `isb`).

