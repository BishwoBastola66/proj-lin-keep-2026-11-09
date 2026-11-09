# Algebraic Effect Confinement & Purity Calculus

> **Status**: Canonical Accepted  
> **Classification**: Type Theory & Algebraic Effects  
> **Subsystem**: Rubix Type System  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the algebraic effect system and purity confinement theorems of the Rubix programming language.

In Rubix, side effects (I/O, network transmission, memory allocation, syscalls) are not implicit invisible operations; they are tracked statically as elements of a **7-bit Algebraic Effect Semilattice**. This enables mathematically sound dead-code elimination, aggressive compiler memoization, and compile-time isolation of untrusted code.

---

## 2. The 7-Bit Effect Bitmask Lattice

Every expression $e$ in Rubix is typed with an effect bitmask $\mathcal{E}(e) \in \{0, 1\}^7$:

```
Bit Index:  6      5       4        3      2        1      0
Effect:   [Rand | Time | Syscall | Mut | Alloc |  Net  |  IO  ]
```

### 2.1 Effect Taxonomy

| Bit | Identifier | Effect Description | Prohibited Under Pure Context |
| :--- | :--- | :--- | :--- |
| **0** | `IO` | Local filesystem read/write operations | YES |
| **1** | `Net` | Network socket transmission / packet receive | YES |
| **2** | `Alloc` | Dynamic heap allocation outside current stack frame | NO (if region bounded) |
| **3** | `Mut` | Mutation of mutable references or shared state | YES (in pure expressions) |
| **4** | `Syscall` | Direct kernel system call trap | YES |
| **5** | `Time` | Non-deterministic system clock reads | YES |
| **6** | `Rand` | Hardware entropy or pseudo-random generation | YES |

---

## 3. The Purity Confinement Theorem

### Definition (Pure Function)
A function $f: \tau_{\text{in}} \to \tau_{\text{out}}$ is defined as **Pure** if and only if its static effect bitmask is strictly zero:
$$\text{Pure}(f) \iff \mathcal{E}(f) = \mathbf{0000000}_2$$

### Theorem 5 (Purity Confinement)
Let $e_{\text{pure}}$ be an expression evaluated in a pure scope. Then:
1. **Determinism**: Given identical inputs $x_1 = x_2$, evaluating $e_{\text{pure}}(x_1)$ and $e_{\text{pure}}(x_2)$ produces identical outputs $y_1 = y_2$.
2. **Referential Transparency**: Any subexpression $e \subseteq e_{\text{pure}}$ can be replaced with its evaluated value without altering the observational behavior of the program.
3. **Sound Dead-Code Elimination (DCE)**: If the result of $e_{\text{pure}}$ is unused, the entire expression can be eliminated by the compiler with zero observational side effects.

### Proof
Assume for contradiction that $e_{\text{pure}}$ causes a side effect (e.g., writes a file to disk). Then $e_{\text{pure}}$ must execute an `IO` or `Syscall` operation. By definition of the effect typing rules:
$$\Gamma \vdash \text{write\_file}(...) : \tau \text{ with } \mathcal{E} \ge \mathbf{0000001}_2$$
Because $\mathcal{E}(e_{\text{pure}}) = \mathbf{0}$, the type checker rejects the expression at compile time. Contradiction. Therefore, pure expressions are strictly confined. $\blacksquare$

---

## 4. Effect Composition & Lattice Join

When combining two expressions $e_1$ and $e_2$:
$$\mathcal{E}(e_1 ; e_2) = \mathcal{E}(e_1) \vee \mathcal{E}(e_2) \quad (\text{Bitwise OR})$$

The effect lattice has a bottom element $\bot = \mathbf{0000000}_2$ (pure computation) and a top element $\top = \mathbf{1111111}_2$ (arbitrary ambient effects). Compilers use single-cycle bitwise ALU instructions (`or`, `and`, `test`) to compute and verify effects across entire call trees during the single-pass compilation pipeline.
