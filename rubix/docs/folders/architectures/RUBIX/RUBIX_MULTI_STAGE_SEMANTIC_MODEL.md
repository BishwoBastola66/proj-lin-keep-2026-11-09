# Rubix Multi-Stage Semantic IR Architecture

> **Status**: Canonical Accepted  
> **Classification**: Compiler Core Architecture & Intermediate Representations  
> **Subsystem**: Rubix Sovereign Compiler Substrate  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the multi-stage intermediate representation (IR) pipeline for the Rubix programming language and compiler substrate. It formalizes the four progressive stages of semantic lowering:

$$\text{Source Code} \xrightarrow{\text{Parse}} \mathbf{SIR} \xrightarrow{\text{Affine Lowering}} \mathbf{AIR} \xrightarrow{\text{Target Agnostic}} \mathbf{UIR} \xrightarrow{\text{RUMS Next}} \mathbf{Machine Bytes}$$

Each intermediate stage preserves formal mathematical invariants, guaranteeing that memory safety, capability security, and algebraic effect isolation proven at the highest semantic level remain inviolable in the emitted machine code.

---

## 2. The Four Intermediate Representation Strata

```
+───────────────────────────────────────────────────────────────────────────────────+
| 1. Semantic Intermediate Representation (SIR)                                     |
|    • Tri-Stratum Typing: Values (V), Resources (R), Capabilities (C)             |
|    • 7-bit Algebraic Effect Semilattice tracking                                  |
|    • Reynolds Relational Parametricity Invariants                                 |
+───────────────────────────────────────────────────────────────────────────────────+
                                         │
                                         ▼
+───────────────────────────────────────────────────────────────────────────────────+
| 2. Affine Intermediate Representation (AIR)                                       |
|    • Affine Uniqueness proofs (A ⊕ M)                                             |
|    • Non-lexical region arena lifetime scoping                                    |
|    • Compile-time escape analysis & zero-cost destructor insertion                |
+───────────────────────────────────────────────────────────────────────────────────+
                                         │
                                         ▼
+───────────────────────────────────────────────────────────────────────────────────+
| 3. Universal Intermediate Representation (UIR)                                    |
|    • Linearized control-flow graph (CFG) without phi-nodes                        |
|    • Abstract register and stack slot designations                                |
|    • Capability-bounded syscall and memory access verification                    |
+───────────────────────────────────────────────────────────────────────────────────+
                                         │
                                         ▼
+───────────────────────────────────────────────────────────────────────────────────+
| 4. RUMS Next Machine Synthesis Backend                                             |
|    • Declarative .machine architecture target bindings                            |
|    • PCMSS Machine Stencil selection & copy-and-patch splicing                    |
|    • Direct native machine code emission (x86-64, ARM64, RV64)                    |
+───────────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Formal Invariant Preservation Across Stages

### 3.1 Theorem 3 (Semantic Preservation Under Lowering)
Let $\mathcal{P}_{\text{SIR}}$ be a well-typed Rubix program in SIR satisfying safety invariant $\Phi$. Let $\mathcal{T}_{\text{AIR}}$, $\mathcal{T}_{\text{UIR}}$, and $\mathcal{T}_{\text{RUMS}}$ be the sequential lowering transformations.
Then the emitted machine code $\mathcal{M}$ satisfies $\Phi$:
$$\mathcal{P}_{\text{SIR}} \models \Phi \implies \mathcal{M} \models \Phi$$

### Proof Strategy
Each transformation is defined as a homomorphism preserving:
1. **Ownership Uniqueness**: If resource $r$ is unique in SIR ($\Gamma \vdash r: \mathcal{R}$), AIR guarantees $r$ has exactly one owner at every program point; UIR maps $r$ to a dedicated register/slot that is never aliased; RUMS emits zero duplicating moves.
2. **Capability Confinement**: If capability $\kappa: \mathcal{C}$ is absent in SIR, no lowering pass can synthesize a capability token; UIR verifies that all privileged instructions are preceded by a valid token descriptor; RUMS maps token checks to hardware capability registers or immutable tokens. $\blacksquare$
