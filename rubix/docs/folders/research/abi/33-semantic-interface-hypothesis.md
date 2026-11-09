# The Semantic Interface Hypothesis

## 1. The Core Rubix Thesis

For six decades, compiler architectures have treated Application Binary Interfaces as a monolithic, indivisible artifact:
$$\text{Source Function} \longrightarrow \text{Physical Machine Code with Hardcoded Register/Stack Assumptions}$$

Under this traditional model:
- To guarantee that an existing binary can call a function, the compiler must freeze every physical register, stack offset, and struct byte layout permanently.
- Any attempt to optimize the compiler (e.g. passing an extra argument in a register, reordering struct fields to save cache lines, utilizing new CPU instructions) breaks the binary interface.

### The Hypothesis
> **An interface should declare stable semantic meaning, resource ownership lifecycles, and capability constraints, while physical ABI realization remains an adaptable, target-specific projection.**

$$\text{Semantic Contract } (\Sigma) \xrightarrow{\quad \text{Projection} \quad} \text{Physical Realization } (\pi_1, \pi_2, \dots, \pi_k)$$

---

## 2. Deconstructing the Interface into Three Orthogonal Layers

```
Layer 1: Semantic Interface Contract (Σ)
  - Logical types (Integer, Slice, Map, Tensor)
  - Resource semantics (Affine Move, Shared Borrow, Linear Lifecycle)
  - Algebraic Effects (Pure, IO, Mutate, Alloc)
  - Capability Requirements (CapFs, CapNet, CapMem)
  - Invariant: 100% stable across architectures, OSes, and compiler versions.
                            |
                            v
Layer 2: Representation Contract (ρ)
  - Abstract memory layout constraints
  - Natural alignments, field ordering schemas, discriminants
  - Invariant: Resilient to internal private member additions via adapters.
                            |
                            v
Layer 3: Physical ABI Realization (π)
  - Target machine register assignments (RDI, RCX, X0, a0)
  - Stack frame alignment (16 bytes) and shadow space (0 vs 32 bytes)
  - Return registers (RAX, X0, a0) and hidden sret pointers
  - Invariant: Specialized to the exact target CPU and OS at compile/link time.
```

---

## 3. Why This Resolves the Historical Dilemma

Under the Semantic Interface Hypothesis:
1. **The Compiler Retains Total Internal Freedom**:
   Within a compilation unit, module, or whole-program LTO graph, the Rubix compiler can use any register allocation, custom fastcall convention, or struct layout optimization it chooses.
2. **Binary Libraries Remain Permanently Usable**:
   When exporting an interface, the compiler stamps it with the semantic contract $\Sigma$. Any client consuming the interface projects $\Sigma$ onto its own target calling convention.
3. **Adapters Bridge the Gap at Zero Cost**:
   - If caller and callee target the same physical convention ($\pi_{\text{caller}} = \pi_{\text{callee}}$), the projection produces **identity**, compiling to a **direct native call with zero runtime overhead**.
   - If conventions differ (e.g., calling Windows DLL from Linux ELF, or calling an older ABI version), the projection synthesizes an exact, specialized machine adapter.
