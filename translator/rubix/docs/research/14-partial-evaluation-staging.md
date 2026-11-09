# Partial Evaluation, Multi-Stage Staging, and Compile-Time Computation

## 1. Introduction: The Spectrum of Computation Time

Computation can occur at different points in a software system's lifecycle:
$$\text{Compile-Time} \longleftrightarrow \text{Link-Time} \longleftrightarrow \text{Load-Time} \longleftrightarrow \text{Run-Time}$$

A primary objective of programming language design is **turning runtime overhead into compile-time knowledge**. Any calculation that can be solved before runtime eliminates execution latency, reduces energy consumption, and simplifies generated machine code.

---

## 2. Theoretical Foundations: The Futamura Projections

In 1971, Yoshihiko Futamura demonstrated three mathematical projections governing partial evaluation ($\alpha$):

### 2.1 The First Futamura Projection (Compilation via Specialization)
Given an interpreter $\text{Int}$ and source program $P$, specializing $\text{Int}$ with $P$ yields a compiled executable $P_{\text{compiled}}$:
$$\alpha(\text{Int}, P) = P_{\text{compiled}}$$
* **Implication**: Any clean interpreter can automatically become an optimizing compiler if partial evaluation is sound.

### 2.2 The Second Futamura Projection (Compiler Generation)
Specializing the partial evaluator itself with the interpreter yields a standalone compiler $\text{Comp}$:
$$\alpha(\alpha, \text{Int}) = \text{Comp}$$

### 2.3 The Third Futamura Projection (Compiler-Generator Generation)
Specializing the partial evaluator with itself yields a compiler generator:
$$\alpha(\alpha, \alpha) = \text{Cogen}$$

---

## 3. Comparison of Contemporary Compile-Time Systems

| Staging Paradigm | Languages | Implementation Mechanism | Failure Mode / Limitation |
|:---|:---|:---|:---|
| **Macro Expansion** | C/C++ preprocessor, Rust `macro_rules!` | Lexical or token-stream rewriting. | Hygienic complexity, zero type safety, unreadable error diagnostics. |
| **Template Metaprogramming** | C++ templates | Turing-complete type-level substitution. | Astronomical compile times, massive binary bloat, cryptic error messages. |
| **`constexpr` / `consteval`** | C++20/23 | Subset of language executed in an internal compiler interpreter. | Rigid restrictions on memory allocation and standard library usage. |
| **`comptime` Execution** | Zig | Full language available at compile time via an internal bytecode interpreter. | Non-trivial compiler memory footprints, potential infinite compile-time loops. |
| **Effect-Verified Pure Folding** | **Rubix** | Pure functions (`effect(pure)`) evaluated directly during AST lowering. | Restricted strictly to provably terminating pure functions. |

---

## 4. The Rubix Compile-Time Staging Model

Rubix implements staging through its **Algebraic Effect System**:

### 4.1 Purity as a Precondition for Compile-Time Execution
In Rubix, any expression whose constituent functions are proven `effect(pure)` and whose inputs are known compile-time constants is an eligible candidate for automatic compile-time reduction:
```text
// Source Code
fn fib(n: i64): i64 effect(pure) {
    if n <= 1 { return n; }
    return fib(n - 1) + fib(n - 2);
}

let result = fib(10); // Inputs known at compile-time
```
During SIR-to-AIR lowering, the compiler evaluates `fib(10)` directly, folding the call tree into a single immediate constant:
$$\text{UIR\_CONST}(55)$$
No function call, stack frame, or arithmetic instructions are emitted in the final binary.

### 4.2 Termination & Resource Bounds
To prevent infinite compile-time loops (e.g., non-terminating recursion), Rubix enforces strict computation step quotas (e.g., $10^6$ operations). If a compile-time calculation exceeds the quota without terminating, the compiler transparently defers execution to runtime without failing compilation.
