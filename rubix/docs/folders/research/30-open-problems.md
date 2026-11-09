# Open Research Problems and Experimental Frontiers

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                 The Active Rubix Research Frontier            │
       └───────────────────────────────┬───────────────────────────────┘
                                       │
     Unsolved Systems Challenge ───────┼──── Mathematical Hypothesis
                                       │
     Experimental Prototype ───────────┴──── Empirical Results & Next Steps
```

## 1. Abstract & Frontier Mandate

A research-driven compiler must remain candid about its boundaries. Claiming that all theoretical challenges are solved breeds complacency and masks technical debt.

This document catalogs the **active open problems**, theoretical tensions, and ongoing experimental frontiers in the unified Rubix language and compiler architecture.

---

## 2. Open Research Status Table

| Problem | Current Theory | Rubix Hypothesis | Prototype | Result | Remaining Problem | Next Experiment |
|:---|:---|:---|:---|:---|:---|:---|
| **Interprocedural View Types for Disjoint Struct Borrows** | Rust borrow checker rejects borrowing two fields of the same struct through a function boundary (`&mut s.field_a` vs `&mut s.field_b`). | View types in function signatures (`fn foo(s: &view{field_a} Struct)`) allow granular field borrows without full struct locks. | Prototype field masks in [compiler/middle/air.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/air.bix). | Successfully permits intra-procedural disjoint field borrows. | Signature syntax ergonomics for deeply nested aggregates and generic projections. | Implement view-type syntax parser in `parser.bix` and test against complex graph algorithms. |
| **Zero-Cost Algebraic Effect Continuation Resumption** | Traditional algebraic effects allocate heap frames for delimited continuations, causing 5x–10x slowdown over direct calls. | Linear/affine continuations can be resumed exactly once, allowing continuations to remain on the existing physical stack. | Effect handler lowering in [compiler/middle/effect_optimizer.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/effect_optimizer.bix). | Pure effects and tail-resumptions lower to direct jumps with zero allocation. | Multi-shot continuations or asynchronous non-local yields across thread boundaries. | Implement one-shot linear resumption pass in AIR and measure against coroutine context switches. |
| **Scalable Equality Saturation (E-graphs) Without Memory Blowup** | E-graph saturation explodes combinatorially ($>10^7$ e-nodes) when applied indiscriminately to large functions. | Domain-restricted e-graphs with strict iteration bounds ($N \le 8$) and cost-directed extraction eliminate phase-ordering bugs safely. | E-graph testbed in [docs/research/16-equality-saturation.md](file:///home/bishwaxyz/translator/rubix/docs/research/16-equality-saturation.md). | Successfully simplifies nested bitwise arithmetic and address arithmetic in bounded steps. | Search space explosion when combined with aggressive loop transformations (unrolling + vectorization). | Integrate bounded e-graph extractor into [compiler/backend/isel.bix](file:///home/bishwaxyz/translator/rubix/compiler/backend/isel.bix) specifically for pointer offset folding. |
| **Hardware Capability Fallback on Non-CHERI Silicon** | Hardware capabilities (e.g., CHERI / Arm Morello) are not universally available on commodity x86 and standard ARM silicon. | Software capability tokens with zero-ambient authority provide equivalent architectural safety with optional hardware acceleration on CHERI. | Static capability bitmasks in [compiler/common/capabilities.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/capabilities.bix). | 100% compile-time unauthorized capability rejection on standard Linux x86-64 and Arm64. | Fine-grained spatial byte-level bounds still rely on software fat pointers rather than hardware-tagged words. | Prototype CHERI-RISC-V machine descriptor emitting tagged capability registers (`c0-c31`). |
| **Vector-Length-Agnostic Auto-Vectorization (RISC-V Vector)** | Compilers typically optimize for fixed SIMD widths (128-bit, 256-bit, 512-bit); variable-length vectorization requires dynamic strip-mining. | Preserving high-level array shape and iteration bounds in AIR enables native `vsetvli` strip-mining synthesis without unrolling penalties. | Target feature flags `FEAT_RV_V` in [compiler/target/target.bix](file:///home/bishwaxyz/translator/rubix/compiler/target/target.bix). | Target triple recognition and basic vector instruction emission under QEMU-riscv64. | Complex reduction loops and non-contiguous stride gathers in autonomous vectorizer. | Build automated strip-mining loop transform pass in `air_to_uir.bix` for RVV targets. |
| **Bit-for-Bit Determinism Across Cross-Compilation Targets** | Native cross-compilers often produce varying binary layouts depending on host endianness, pointer widths, or memory layouts. | All internal compiler symbol tables, AST identifiers, and section generators use canonical 64-bit little-endian representations. | Unified binary packaging in [compiler/packaging/](file:///home/bishwaxyz/translator/rubix/compiler/packaging/). | Verified: Compiling Windows PE and macOS Mach-O binaries on Linux produces identical bytes across host runs. | Host platform line endings (CRLF vs LF) in source files requiring strict normalization in lexer. | Add fuzzing test asserting binary hash identity regardless of input file newline formats. |
| **Dynamic Energy Profiling with RAPL / Battery Feedback** | Compilers cannot measure true physical energy without hardware energy counters (`RAPL`, Apple Energy Counters). | Integrate sample-based energy counter readings into the profiling driver (`./bin/rubix profile`) to generate energy-guided feedback. | Profile CLI command in [compiler/main.bix](file:///home/bishwaxyz/translator/rubix/compiler/main.bix). | Profile flag runs cleanly with zero runtime overhead. | Accessing `/sys/class/powercap/intel-rapl` requires Linux root/capability permissions. | Develop unprivileged energy estimation model based on retired uop classes and L3 cache misses. |

---

## 3. Experimental Protocol for Frontier Hypotheses

For every open problem listed above, Rubix mandates the following scientific protocol before merging any changes into the primary compiler codebase:

```text
1. Define Failure Condition: Exactly what measurable metric would prove the hypothesis false?
2. Implement Minimal Prototype: Isolate the pass in compiler/middle/ or compiler/backend/.
3. Execute Adversarial Verification: Must survive existing test suite without regressions.
4. Measure on Physical Silicon: Measure throughput, memory, binary size, and energy.
5. Merge or Purge: If the hypothesis fails to beat the baseline by >5% or increases compile time by >10%, document the negative result and remove the code.
```

---

## 4. The Grand 11-Domain Taxonomy (2026 to 500,000+ Year Horizon)

Beyond compiler-internal prototypes, the exhaustive catalog of open problems covering every major domain of software engineering—operating systems, hardware heterogeneity, distributed consensus, data storage, cybersecurity, AI synthesis, formal verification, and digital longevity—is detailed in:
- [legends_hypotheses.md §3](file:///home/bishwaxyz/rubix/research/legends_hypotheses.md#3-the-grand-master-taxonomy-of-open-problems-across-all-fields-of-software-2026-to-the-500000-year-horizon): Master Taxonomy of 30 Open Problems across 11 Software Disciplines and Deep-Time Continuum.

---

## 5. Summary

The open problems in Rubix represent exciting opportunities to push programming language design forward. By tracking each challenge with explicit hypotheses, empirical prototypes, and strict failure thresholds, the Rubix project maintains continuous scientific and engineering rigor.

