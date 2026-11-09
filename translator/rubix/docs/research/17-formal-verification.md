# Formal Verification, Semantic Preservation, and Compiler Trust

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                 Source Language Semantics                     │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ Verified Translation Rules /
                                       │ Machine-Checked Properties
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │             SIR (Semantic Intermediate Representation)         │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ Preservation of Typed Effects &
                                       │ Capability Invariants
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │             AIR (Affine & Resource Representation)            │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ Translation Validation /
                                       │ SMT Equivalence Checking
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │                    UIR (Unified Low-Level IR)                 │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ Validated Instruction Selection /
                                       │ Machine-Code Emission
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │             Native Sovereign Executable (ELF64/PE/Mach-O)     │
       └───────────────────────────────────────────────────────────────┘
```

## 1. Abstract & Problem Formulation

Can a realistic, highly optimizing, native-generating compiler provide formal guarantees of correctness without incurring prohibitive compile-time latency or preventing aggressive microarchitectural optimization?

Historically, formal methods and optimizing compilers existed in separate silos:
1. **Academic Verified Compilers (CompCert)** prioritized machine-checked semantic preservation (using Coq/Rocq) at the expense of peak compile speed, dynamic profiling, JIT adaptation, and certain aggressive non-linear loop optimizations.
2. **Production Industrial Compilers (GCC, LLVM)** prioritized raw runtime throughput and extensive heuristic passes, tolerating miscompilation bugs, subtle undefined behavior (UB) exploits, and unsound optimization chains (e.g., LLVM's historical `undef` and `poison` semantics bugs documented by Lee et al., PLDI 2017).

Rubix synthesizes these paradigms through a **Layered Verification Architecture**:
* **Language Semantics**: Deterministic static type, effect, and capability rules verified at the source level.
* **Preservation Guarantees**: Semantic properties (such as purity, zero-ambient authority, affine linearity) are guaranteed not to be weakened across IR lowerings ($\text{SIR} \to \text{AIR} \to \text{UIR}$).
* **Translation Validation**: Individual compilation passes emit proof certificates or undergo targeted SMT validation rather than requiring whole-compiler interactive theorem proving.
* **Machine-Code Validation**: Emission of native ELF64/PE/Mach-O binaries verifies entry offsets, register invariants, and stack alignment prior to disk commit.

---

## 2. Historical & Contemporary Evidence

### 2.1 CompCert (Leroy et al., 2006–2026)
CompCert demonstrated that realistic C compilers can be formally proven correct in a proof assistant.
* **Milestone 3.16 (September 2025)**: Introduced position-independent code (PIC) and position-independent executables (PIE) across x86-64, AArch64, and RISC-V architectures while retaining semantic preservation proofs.
* **Milestone 3.17 (February 2026)**: Added compatibility with Rocq 9.1 and updated Menhir parsing algorithms.
* **Milestone 3.18 (August 2026)**: Refined formal models for memory alignment constraints and dynamic memory deallocation (`free`), alongside industrial qualification under DO-178C, DO-333, and DO-330 for the ATR 42/72 Multi-Function Computer New Generation (MFC_NG).
* **Lesson for Rubix**: Whole-compiler verification in Coq is feasible for C-scale semantics, but verifying an evolving general-purpose language directly in a proof assistant slows compiler evolution. Rubix adopts **translation validation** and **invariant-preserving typed IRs** as its engineering mechanism.

### 2.2 seL4 Microkernel (Klein et al., 2009–2026)
The seL4 microkernel proved that machine-checked formal verification (Isabelle/HOL) can produce code that is not only mathematically bug-free with respect to specification, but also the world's fastest microkernel in IPC latency.
* **Lesson for Rubix**: Safety and verification do *not* inherently cost performance. Explicit, unambiguous semantics allow the optimizer to eliminate runtime defensive checks with mathematical certainty.

### 2.3 Alive and Alive2 (Lopes et al., 2015–2021)
Alive2 demonstrated that translation validation using SMT solvers (Z3) can detect thousands of optimizer bugs in LLVM without requiring LLVM itself to be rewritten in a formal proof assistant.
* **Lesson for Rubix**: Target-specific peepholes, algebraic re-associations, and IR transformations can be verified offline and validated online via bounded symbolic equivalence checking.

---

## 3. The Rubix Verification Hierarchy

Rubix establishes five strict tiers of verification:

```text
Tier 4: Formal Axioms & Operational Semantics (Mathematical Specification)
  │
Tier 3: Invariant-Preserving IR Lowering (SIR -> AIR -> UIR)
  │
Tier 2: Translation Validation & SMT Equivalence (Optimizer Passes)
  │
Tier 1: Machine Code & Binary Container Validation (RUMS / ELF Emission)
  │
Tier 0: Deterministic Self-Hosting Bootstrap (Bit-for-Bit Hash Identity)
```

### Tier 0: Deterministic Self-Hosting Bootstrap Verification
The foundational trust anchor of Rubix is deterministic binary self-hosting:
$$\text{SHA256}(\text{Stage 2 Compiler Binary}) \equiv \text{SHA256}(\text{Stage 3 Compiler Binary})$$
Any discrepancy in binary hashes between Stage 2 and Stage 3 immediately flags non-determinism, uninitialized memory usage, or compiler miscompilation.

### Tier 1: Machine-Code Structural Validation
During native emission ([compiler/packaging/elf.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/elf.bix)), the emitter validates:
1. **ELF Header Integrity**: Ident bytes (`0x7F 'E' 'L' 'F'`), Machine class (`ELFCLASS64`), Data encoding (`ELFDATA2LSB`), Machine ID (`EM_X86_64 = 62`, `EM_AARCH64 = 183`, `EM_RISCV = 243`).
2. **Segment Alignment**: Memory segments (`PT_LOAD`) are aligned strictly to 4096-byte boundaries (`p_align = 4096`).
3. **Control-Flow Targets**: All relative jumps (`E9 rel32`, `EB rel8`) and calls (`E8 rel32`) are validated to point within valid executable code boundaries.

### Tier 2: Translation Validation for Affine & Effect Transformations
In [compiler/middle/semantic_driver.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/semantic_driver.bix):
1. **Purity Confinement**: If a function is tagged `EFFECT_PURE` (0x0), the verifier enforces that no node within its call-graph invokes `EFFECT_IO`, `EFFECT_FS`, `EFFECT_NET`, or `EFFECT_MUT`.
2. **Capability Containment**: If an AST or AIR node attempts an operation requiring capability $C_k$ (e.g., `CAP_FILE_IO = 2`), the enclosing scope must possess a valid capability token.
3. **Affine Resource Monotonicity**: A resource handle $R_i$ transitioned to `STATE_MOVED` or `STATE_DROPPED` can never be read or borrowed again.

---

## 4. Formal Proof Obligations & Test Oracles

Rubix uses differential testing and adversarial compiler suites as executable proof obligations:

| Verification Target | Implementation | Adversarial Test File | Pass Condition |
|:---|:---|:---|:---|
| **Purity Violation** | `sir_typecheck.bix` / `semantic_driver.bix` | [tests/test_adversarial_purity.bix](file:///home/bishwaxyz/translator/rubix/tests/test_adversarial_purity.bix) | Compiler rejects with `ERR_SIR_PURITY_VIOLATION (-101)` |
| **Capability Token** | `capabilities.bix` / `semantic_driver.bix` | [tests/test_adversarial_capability.bix](file:///home/bishwaxyz/translator/rubix/tests/test_adversarial_capability.bix) | Compiler rejects with `ERR_SIR_CAPABILITY_UNAUTHORIZED (-102)` |
| **Affine Use-After-Move** | `borrow_checker.bix` / `air.bix` | [tests/test_affine_borrow.bix](file:///home/bishwaxyz/translator/rubix/tests/test_affine_borrow.bix) | Detected and rejected at compile-time |
| **Stack Address Escape** | `escape_analysis.bix` | [tests/test_escape_regions.bix](file:///home/bishwaxyz/translator/rubix/tests/test_escape_regions.bix) | Rejection or automated heap/region promotion |
| **Bootstrap Determinism**| `scripts/build.bix` | Whole-compiler pipeline | `stage2.elf` hash $\equiv$ `stage3.elf` hash |

---

## 5. Summary & Conclusion

Formal verification in Rubix is not a delayed academic exercise; it is an active structural pipeline component. By embedding typed effect lattices, capability-based ambient authority confinement, affine ownership rules, and bit-level deterministic self-hosting into the unified compiler architecture, Rubix guarantees software safety without forfeiting bare-metal execution speed.
