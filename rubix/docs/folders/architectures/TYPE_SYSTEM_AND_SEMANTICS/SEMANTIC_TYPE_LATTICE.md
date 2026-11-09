# Rubix Semantic Type Lattice & Tri-Stratum Formalism

> **Status**: Canonical Accepted  
> **Classification**: Type Theory & Formal Semantics  
> **Subsystem**: Rubix Type System  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the mathematical foundations of the Rubix type system: the **Tri-Stratum Semantic Type Lattice ($\mathcal{T}$)**.

Unlike traditional languages that treat memory buffers, network sockets, integer primitives, and access permissions as uniform heap pointers, Rubix partitions all types into three strictly disjoint strata:
1. **Values ($\mathcal{V}$)**: Freely copyable, pure mathematical data.
2. **Resources ($\mathcal{R}$)**: Affinely owned, non-duplicable physical assets (memory, file handles).
3. **Capabilities ($\mathcal{C}$)**: Unforgeable linear authority tokens.

---

## 2. Mathematical Definition of the Type Lattice

The universe of Rubix types $\mathcal{T}$ forms a bounded join-semilattice:

$$\mathcal{T} = \mathcal{V} \uplus \mathcal{R} \uplus \mathcal{C} \cup \{ \bot, \top \}$$

```
                           Top Type (⊤)
                         /      |      \
                        /       |       \
           Values (V)     Resources (R)   Capabilities (C)
           [u64, bool]    [Buffer, File]  [CapToken<IO>]
                        \       |       /
                         \      |      /
                          Bottom Type (⊥)
```

### 2.1 The Three Type Strata

| Stratum | Classification | Copy Semantics | Deallocation / Drop Semantics | Mutation Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Values ($\mathcal{V}$)** | Pure Data | Bitwise duplicable (`memcpy`) | Implicitly discarded; zero deallocation cost. | Read-only immutable sharing or local value mutation. |
| **Resources ($\mathcal{R}$)** | Physical Assets | **Non-copyable**; Move semantics only | Must be consumed once or collapsed in an enclosing region arena. | Exclusive mutable borrow (`&mut`) or affine transfer (`own`). |
| **Capabilities ($\mathcal{C}$)** | Authority Tokens | **Non-copyable, Non-forgeable** | Must be delegated via explicit parameter passing. | Immutable proof of permission; cannot be altered. |

---

## 3. Subtyping, Join ($\sqcup$), and Meet ($\sqcap$) Relations

### Subtyping Axioms ($\le_\tau$)
1. **Reflexivity**: $\forall \tau \in \mathcal{T},\; \tau \le_\tau \tau$
2. **Transitivity**: $\forall \tau_1, \tau_2, \tau_3 \in \mathcal{T},\; (\tau_1 \le_\tau \tau_2 \wedge \tau_2 \le_\tau \tau_3) \implies \tau_1 \le_\tau \tau_3$
3. **Strata Disjointness**:
   $$\forall v \in \mathcal{V}, r \in \mathcal{R}, c \in \mathcal{C}: \quad (v \not\le_\tau r) \wedge (r \not\le_\tau c) \wedge (c \not\le_\tau v)$$
   No implicit coercion can convert a Value into a Resource or a Resource into a Capability.

### Lattice Operations
* **Join ($\tau_1 \sqcup \tau_2$)**: The least common supertype:
  $$\tau_1 \sqcup \tau_2 = \begin{cases} 
  \tau_1 & \text{if } \tau_2 \le_\tau \tau_1 \\
  \tau_2 & \text{if } \tau_1 \le_\tau \tau_2 \\
  \top & \text{if } \text{Stratum}(\tau_1) \neq \text{Stratum}(\tau_2)
  \end{cases}$$
* **Meet ($\tau_1 \sqcap \tau_2$)**: The greatest common subtype:
  $$\tau_1 \sqcap \tau_2 = \begin{cases} 
  \tau_1 & \text{if } \tau_1 \le_\tau \tau_2 \\
  \tau_2 & \text{if } \tau_2 \le_\tau \tau_1 \\
  \bot & \text{otherwise}
  \end{cases}$$

---

## 4. Formal Type Soundness Theorem

### Theorem 4 (Progress and Subject Reduction)
1. **Progress**: If expression $e$ is well-typed under typing context $\Gamma$ ($\Gamma \vdash e : \tau$), then either $e$ is a value or there exists a machine transition state $e \to e'$.
2. **Subject Reduction (Preservation)**: If $\Gamma \vdash e : \tau$ and $e \to e'$, then $\Gamma \vdash e' : \tau$.

### Corollary (Absence of Memory Undefined Behavior)
A well-typed Rubix program contains **zero null pointer dereferences, zero double-free panics, and zero out-of-bounds array reads** at runtime.
