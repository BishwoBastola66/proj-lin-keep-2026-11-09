# Rubix ABI Resilience: Final Architecture and Design Principles

## 1. The Seven Surviving Design Principles

Through extensive historical research, theoretical formulation, and empirical experimentation, seven architectural principles have emerged as the foundational pillars of Rubix ABI resilience:

### Principle 1: Semantic Stability Over Representation Freezing
An interface contract must promise logical types, parameter arities, ownership transfer rules, algebraic effects, and capability constraints. Physical register numbers and struct field byte offsets belong to target projections and must not freeze language evolution.

### Principle 2: Total Internal Freedom with Stable External Contracts
Within a module, application, or whole-program compilation graph, the compiler is completely unconstrained: it may use custom register allocations, reorder struct fields to optimize cache lines, or scalarize aggregates. Only when crossing exported module boundaries are semantic contracts enforced.

### Principle 3: Zero-Cost Elimination for Compatible Calls
For any call where caller and callee share identical calling conventions and register classifications, all intermediate adapter layers are statically eliminated. The emitted machine code is a **100% direct native instruction (`call rel32` or `call *reg`)** with zero runtime overhead.

### Principle 4: Specialized Machine Trampolines for Boundaries
When crossing divergent conventions (e.g. System V calling Microsoft x64 or foreign FFI), the compiler or dynamic loader synthesizes a specialized, zero-branch machine trampoline. Argument permutation and shadow space allocation execute in sub-nanosecond time without dynamic memory allocation or interpreter loops.

### Principle 5: Deterministic Safe Failure Over Silent Corruption
No interface mismatch shall ever cause uninitialized register reads, stack misalignments, or silent memory corruption. Mismatched arities, incompatible types, or unauthorized capabilities are detected and rejected explicitly at compile or load time.

### Principle 6: Security and Capability Gated Boundaries
Foreign function interfaces are strictly gated by capability security tokens (`CapFs`, `CapNet`, `CapMem`). Untrusted or unprivileged code cannot invoke external binary symbols that execute privileged operating system actions.

### Principle 7: 100% Sovereign Native Realization
The entire ABI resilience pipeline—from contract verification and hash generation to ELF/PE/Mach-O dynamic loading and adapter synthesis—is implemented in pure, sovereign Rubix code with zero external dependencies (no GCC, Clang, LLVM, glibc, or libffi).

---

## 2. Complete Compilation & Execution Pipeline

```
Rubix Source Code (.bix)
           |
           v
[Frontend Semantic Analysis]
  - Type inference & checking
  - Effect & Capability verification
  - Semantic Contract Construction (Σ)
           |
           v
[Middle-End ABI Compatibility Solver]
  - Query Caller Target Convention (π_caller)
  - Query Callee Target Convention (π_callee)
  - Compute Lattice Relation: Solve(π_caller, π_callee)
           |
    +------+------+
    |             |
[COMPAT_BITWISE]  [COMPAT_ADAPTER]       [COMPAT_INCOMPATIBLE]
    |             |                              |
    |             v                              v
    |     [Synthesize Trampoline]        [Abort with Error Diagnostic]
    |     - Register permutation         - ERR_ABI_MISMATCH_ARITY
    |     - Shadow space frame           - ERR_CAP_UNAUTHORIZED
    |             |
    +------+------+
           |
           v
[RUMS Code Generation]
  - Lowers to native machine instructions (x86-64, ARM64, RISC-V)
  - Direct PC-relative calls or specialized trampolines
           |
           v
[Sovereign Container Packaging]
  - ELF64, PE/COFF, Mach-O, or WASM container emission
  - Deterministic, bit-for-bit self-hosted binary output
```
