# Rubix Next Architecture Specification

> **The Universal Semantic, Resource, and Machine Synthesis Architecture**
> *Specification Version 2.0.0-Next*

---

## 1. System Architecture Overview

Rubix Next is designed from first principles as a **Universal Semantic and Computational Layer**. It replaces the legacy single-layer imperative compiler with a multi-stratum reasoning and synthesis engine.

```text
                        ┌──────────────────────────────────────────────┐
                        │              RUBIX NEXT SOURCE               │
                        │    Syntax: Pure Functions, Affine Resources, │
                        │    Algebraic Effects, Capability Tokens      │
                        └──────────────────────┬───────────────────────┘
                                               │
                                       [ Lexer & Parser ]
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │          SIR: SEMANTIC INTERMEDIATE IR       │
                        │    • Typed Algebraic Expression Graph        │
                        │    • Effect Annotations (pure, io, net)      │
                        │    • Capability Requirements Ledger          │
                        └──────────────────────┬───────────────────────┘
                                               │
                                    [ Semantic Analysis ]
                                    • Type Checking
                                    • Effect Confinement Verification
                                    • Capability Authorization Check
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │           AIR: AFFINE & RESOURCE IR          │
                        │    • Linear / Affine Ownership Tracking      │
                        │    • Lexical Region & Arena Bounding         │
                        │    • Escape Analysis & Stack Promotion       │
                        │    • Borrow Invariant Validation             │
                        └──────────────────────┬───────────────────────┘
                                               │
                                    [ Resource Optimization ]
                                    • Region Allocation Elision
                                    • Pure Expression Memoization
                                    • Dead Effect Elimination
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │          UIR NEXT / CONTROL FLOW IR          │
                        │    • Hardware-Independent 3-Address Virtual  │
                        │    • Basic Blocks & CFG Dominator Trees      │
                        │    • Copy Prop, CSE, Strength Reduction      │
                        └──────────────────────┬───────────────────────┘
                                               │
                                     [ RUMS Next Synthesis ]
                                     • Target Machine Description (.machine)
                                     • Physical Register Allocation
                                     • Instruction Pattern Matching
                                     • ABI Frame Synthesis
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │          NATIVE CONTAINER GENERATION         │
                        │    • Direct ELF64 (Linux x86_64/ARM/RISC-V)  │
                        │    • Direct PE32+ (Windows x86_64)           │
                        │    • Direct Mach-O 64 (macOS x86_64/ARM64)   │
                        │    • Direct WebAssembly (WASM32/WASI)        │
                        └──────────────────────────────────────────────┘
```

---

## 2. The Core Compiler Strata

### Stratum 1: High-Level Semantic IR (SIR)
- **Role**: Captures the developer's intent with full mathematical fidelity.
- **Key Invariants**:
  - Functions declare or infer their effect signatures: `pure`, `read`, `write`, `alloc`, `syscall`, `io`, `net`, `unsafe`.
  - Effect confinement rule: A function declared `pure` cannot invoke any function with effects `io`, `syscall`, `alloc`, or `net`.
  - Operations requiring operating system interaction require unforgeable capability tokens (`CapFs`, `CapNet`, `CapProc`).
  - Data structures are unboxed algebraic sum types (`enum`), product types (`struct`), or fixed arrays.

### Stratum 2: Affine & Resource IR (AIR)
- **Role**: Solves memory safety, lifetimes, and resource bounds at compile time with zero runtime garbage collection.
- **Key Invariants**:
  - Every resource value has exactly one owner at any program point.
  - Passing a value by value transfers ownership (`move`). The source variable becomes invalid; subsequent reads trigger a compile-time `USE_AFTER_MOVE` error.
  - Borrowing creates a scoped reference (`borrow`), which cannot outlive the owner.
  - The **Escape Analysis Engine** evaluates every allocation:
    - If an allocated resource does not escape the current function's lexical scope, it is promoted to the **Local Stack Frame** or a **Lexical Region Arena**.
    - If it escapes, it is marked as an affine heap handle with a deterministic compiler-inserted drop instruction at the boundary of its owner's scope.

### Stratum 3: Universal Machine Synthesis (RUMS Next)
- **Role**: Translates virtual instructions into native machine code bytes without external compiler dependencies.
- **Key Invariants**:
  - Architecture-neutral: Driven entirely by declarative `.machine` models (`targets/x86_64.machine`, `arm64.machine`, `riscv64.machine`).
  - Physical register allocation via linear scan over live intervals.
  - Emits native machine bytes directly into ELF, PE/COFF, Mach-O, or WASM containers.
  - Guarantees bit-for-bit deterministic binary output across compilation runs.

---

## 3. Subsystem Mapping & Repository Structure (Unified Architecture)

> [!NOTE]
> **Status: Superseded & Consolidated**. The former research prototype paths under `compiler/next/*` have been fully unified and consolidated into the sovereign root compiler directories (`compiler/common/`, `compiler/frontend/`, `compiler/middle/`, `compiler/backend/`, `compiler/rums/`). The compiler is a single executable (`rubix`) without separate "Next" subcommands.

| Subsystem | Source Location | Public Interface / Responsibilities | Status |
|---|---|---|:---:|
| **Type System & Constants** | [compiler/common/sir_types.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/sir_types.bix) | Represents primitive, algebraic, affine, pointer, and capability types. | **Valid** |
| **Capability Engine** | [compiler/common/capabilities.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/capabilities.bix) | Defines capability flags (`CAP_FILE_IO`, `CAP_NET`, `CAP_PROCESS`, etc.), verification logic. | **Valid** |
| **Effect Algebra** | [compiler/common/effects.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/effects.bix) | Defines effect flags (`EFFECT_PURE`, `EFFECT_IO`, `EFFECT_FS`, `EFFECT_NET`, `EFFECT_MUT`). | **Valid** |
| **Semantic AST** | [compiler/frontend/sir_ast.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/sir_ast.bix) | Arena-allocated high-level semantic node graph preserving effect/capability attributes. | **Valid** |
| **Semantic Lexer** | [compiler/frontend/sir_lexer.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/sir_lexer.bix) | Streaming tokenizer recognizing effect keywords (`pure`, `effect`, `cap`, `region`, `move`, `borrow`). | **Valid** |
| **Semantic Parser** | [compiler/frontend/sir_parser.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/sir_parser.bix) | Parses programs into SIR AST nodes. | **Valid** |
| **Type & Effect Checker**| [compiler/frontend/sir_typecheck.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/sir_typecheck.bix) | Verifies type compatibility, effect purity boundaries, and capability token possession. | **Valid** |
| **Affine Resource IR (AIR)** | [compiler/middle/air.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/air.bix) | Intermediate representation tracking resource ownership, drops, moves, and regions. | **Valid** |
| **Escape Analysis** | [compiler/middle/escape_analysis.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/escape_analysis.bix) | Analyzes value lifespans, performing stack promotion and region allocation. | **Valid** |
| **Borrow Checker** | [compiler/middle/borrow_checker.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/borrow_checker.bix) | Validates affine uniqueness, detects use-after-move and invalid alias mutations. | **Valid** |
| **Effect Optimizer** | [compiler/middle/effect_optimizer.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/effect_optimizer.bix) | Performs purity-driven dead code elimination and constant hoisting. | **Valid** |
| **AIR to UIR Lowering**| [compiler/backend/air_to_uir.bix](file:///home/bishwaxyz/translator/rubix/compiler/backend/air_to_uir.bix) | Bridges verified AIR nodes into low-level UIR nodes for machine synthesis. | **Valid** |
| **Semantic Driver** | [compiler/middle/semantic_driver.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/semantic_driver.bix) | Coordinates the full pipeline (`semantic_check_source`, `semantic_emit_air`, `semantic_emit_effects`). | **Valid** |
| **Integrated CLI Driver** | [compiler/main.bix](file:///home/bishwaxyz/translator/rubix/compiler/main.bix) | Master dispatcher exposing unified commands (`check`, `compile`, `air`, `effects`, `test`, `bench`). | **Valid** |

---

## 4. Architectural Invariants

1. **Zero Runtime Dependency**: The generated binaries interact directly with the operating system kernel via native system calls or target ABIs. Zero libc, zero CRT, zero JVM/V8 required.
2. **Deterministic Reproducibility**: Compiling the exact same source code produces identical SHA256 binary outputs every single time.
3. **No Unchecked Pointers**: Raw memory access is forbidden in safe Rubix code; all memory is managed through affine handles, region slices, or capability-verified FFI bridges.
4. **Compile-Time Security**: A program without `CAP_NET` cannot open a socket. A program without `CAP_FILE_IO` cannot read a file. Security is enforced by type proofs at build time, not runtime firewalls.

