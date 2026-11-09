# Modern Compiler Theory & Multi-Stage Intermediate Representations

## 1. Introduction

Classical compiler engineering (Dragon Book model) assumes a linear pipeline:
$$\text{Source} \longrightarrow \text{AST} \longrightarrow \text{Linear/SSA IR} \longrightarrow \text{Optimization Passes} \longrightarrow \text{Target Code}$$

While effective for simple imperative languages, this classical pipeline suffers from **Premature Lowering Degradation**: high-level algebraic, ownership, and capability information is stripped away during the transition to a low-level intermediate representation. Downstream optimization passes are forced to reconstruct lost semantics using fragile heuristics (e.g., alias analysis, escape analysis).

Rubix implements a **Multi-Stage Typed Semantic Pipeline**:
$$\text{Source} \overset{\text{Lex/Parse}}{\longrightarrow} \mathbf{SIR} \overset{\text{Verify}}{\longrightarrow} \mathbf{AIR} \overset{\text{Escape/Borrow}}{\longrightarrow} \mathbf{UIR} \overset{\text{RUMS Synthesis}}{\longrightarrow} \mathbf{Machine\ Bytes}$$

---

## 2. Theoretical Comparison of Intermediate Representations

| IR Paradigm | Representative Systems | Theoretical Strength | Fundamental Weakness | Rubix Application |
|:---|:---|:---|:---|:---|
| **Abstract Syntax Tree (AST)** | Clang, GHC, Python | Preserves exact lexical structure and source locations. | Unsuitable for optimization; tree walking is cache-hostile and expensive. | Used only during parsing in [sir_ast.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/sir_ast.bix). |
| **Static Single Assignment (SSA)** | LLVM IR, GCC GIMPLE, Go SSA | Explicit def-use chains; optimal for dead code elimination and constant propagation. | Loses high-level algebraic effects and lifetime scopes; $\phi$-node reconstruction is complex. | Retained in low-level [uir](file:///home/bishwaxyz/translator/rubix/compiler/main.bix) for instruction selection. |
| **Continuation-Passing Style (CPS)** | SML/NJ, Scheme, Gallium | Uniform representation of control flow and data flow as function applications. | Heavy closure allocation; difficult to map directly to register-based hardware. | Influenced the structured concurrency channel model. |
| **A-Normal Form (ANF)** | OCaml, Idris | Restricts subexpressions to variables or constants; simplifies evaluation order. | Does not natively track resource ownership or mutation boundaries. | Integrated into Affine IR (AIR). |
| **Affine Resource IR (AIR)** | **Rubix**, Alms, Clean | Statically tracks resource moves, borrows, drops, and lexical regions. | Requires upfront type and capability verification. | Primary optimization IR in [air.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/air.bix). |

---

## 3. The Phase Ordering Problem & The Rubix Solution

### 3.1 The Phase Ordering Problem
In optimizing compilers, the order in which optimization passes run affects the final code quality. For example:
* Running Inlining before Constant Propagation exposes new constants.
* Running Constant Propagation before Inlining simplifies the inlining decision.
* Running Loop Invariant Motion before Vectorization can separate vectorizable operations.

In traditional compilers, phase ordering is tuned through empirical heuristics, often resulting in conflicting sub-optimal passes.

### 3.2 The Rubix Semantic Solution
Rubix breaks the phase ordering dilemma through **Semantic Invariant Lattices**:
1. **Effect-Directed Invariant Hoisting**: Because pure functions are mathematically proven side-effect free in SIR (`effect(pure)`), the optimizer can hoist them across loop boundaries without running expensive alias analysis.
2. **Affine Uniqueness Optimization**: Because resources have exactly one owner in AIR, the backend knows that stores to an affine handle cannot alias any other live pointer in memory, enabling aggressive register caching and instruction reordering.
3. **Region Promotion**: Escape analysis statically proves whether an allocated structure escapes its lexical frame. Non-escaping structures are promoted to stack frames before lower-level instruction selection begins.

---

## 4. Multi-Stage Pipeline Specification

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. SEMANTIC INTERMEDIATE REPRESENTATION (SIR)                         │
│    - Retains Algebraic Effect Ledger: pure, io, net, syscall, alloc   │
│    - Retains Capability Tokens: CapFs, CapNet, CapProc, CapUnsafe      │
│    - AST nodes allocated in flat arena: 64 bytes per node              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ sir_verify_program
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. AFFINE RESOURCE INTERMEDIATE REPRESENTATION (AIR)                   │
│    - Models Resource Ownership: Moves, Borrows, Drops                  │
│    - Explicit Lexical Regions: RegionEnter, RegionLeave                │
│    - Stack Promotion: non-escaping allocations bypassed from heap     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ air_lower_to_uir
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. UNIVERSAL INTERMEDIATE REPRESENTATION (UIR)                         │
│    - Low-level instruction tape (Op, Type, Dst, Src1, Src2, Flags)     │
│    - Target-neutral SSA pseudo-registers                               │
│    - Explicit memory loads, stores, calls, jumps, and branches         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ rums_codegen
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. DIRECT NATIVE MACHINE CODE SYNTHESIS (RUMS)                         │
│    - Target Machine Architecture Models: x86-64, AArch64, RISC-V 64    │
│    - Sovereign Container Packaging: ELF64, PE/COFF, Mach-O, WASI       │
│    - Zero external toolchains (zero GCC, zero Clang, zero LLVM)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Formal Invariant Guarantees Across Lowering

1. **Theorem 1 (Semantic Preservation)**: For every source program $P$, if $P$ typechecks and passes semantic effect verification in SIR, then the operational semantics of $P$ in SIR are identical to the execution of the generated machine code bytes emitted by RUMS.
2. **Theorem 2 (Purity Confinement)**: If a function $f$ is marked `effect(pure)`, no transformation pass in AIR or UIR can introduce an I/O, system call, or ambient heap mutation into $f$'s execution trace.
3. **Theorem 3 (Deterministic Finalization)**: For every affine resource $R$ instantiated in AIR, exactly one cleanup event (`AIR_OP_DROP` or instantaneous region reset) is emitted along every control flow path leading to scope termination.
