# Security, Stability, and the Compiler Trust Model

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                 The Rubix Security Architecture               │
       └───────────────────────────────┬───────────────────────────────┘
                                       │
     ┌───────────────────┬─────────────┴─────┬───────────────────┐
     │                   │                   │                   │
     ▼                   ▼                   ▼                   ▼
Memory Safety       Capability        Reproducibility     Compiler Trust
(Spatial+Temporal)  (Zero Ambient)    (Bit-for-Bit)       (Trust Hierarchy)
```

## 1. Abstract & Threat Model

Software security cannot be an afterthought bolted on via external static analyzers or runtime firewalls. More than 70% of high-severity CVE vulnerabilities in modern operating systems and browsers stem directly from two fundamental architectural flaws:
1. **Memory Unsoundness**: Spatial violations (buffer overflows, out-of-bounds indexing) and temporal violations (use-after-free, double-free, uninitialized memory reads).
2. **Ambient Authority**: Processes running third-party libraries inherit the full privileges of the host process, allowing compromised dependencies to exfiltrate private keys, read arbitrary files, or execute remote commands.

Rubix eliminates these vulnerability classes through a comprehensive **Security and Stability Architecture** enforced at compile time with zero runtime cycle penalties.

---

## 2. Spatial and Temporal Memory Safety

Rubix provides rigorous separation between spatial safety and temporal safety:

### 2.1 Spatial Memory Safety
Spatial safety guarantees that memory accesses never cross allocated object boundaries:
* **Fat Slice Architecture**: In [std/string.bix](file:///home/bishwaxyz/translator/rubix/std/string.bix) and [std/collections.bix](file:///home/bishwaxyz/translator/rubix/std/collections.bix), slices and dynamic arrays carry contiguous length headers: `(data_ptr: ptr, len: i64)`.
* **Out-of-Bounds Protection**: Substring and indexing operations verify bounds against length headers, eliminating buffer over-reads and buffer overflows.
* **Deterministic Verification**: Tested in [tests/test_char_at_oob.bix](file:///home/bishwaxyz/translator/rubix/tests/test_char_at_oob.bix).

### 2.2 Temporal Memory Safety
Temporal safety guarantees that memory cannot be accessed before initialization or after deallocation:
* **Affine Uniqueness**: In [compiler/middle/air.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/air.bix), resources transferred via `AIR_OP_MOVE` cannot be read again. Use-after-move and double-free bugs are rejected at compile time.
* **Lexical Region Invariance**: Objects allocated within a region arena cannot outlive the region scope; escaping references are detected via interprocedural escape analysis ([compiler/middle/escape_analysis.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/escape_analysis.bix)) and promoted or rejected.
* **Stack Address Escape Prevention**: Returning a pointer to a stack-local variable is detected and blocked with `ERR_STACK_ESCAPE (-46)`.

---

## 3. The Compiler Trust Model

A compiler must answer: *What components of the toolchain must be trusted, and how is each component verified?*

```text
                               The Compiler Trust Model
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       │                  │                               │                  │
       ▼                  ▼                               ▼                  ▼
    Lexer &            Semantic                    Optimizer &            Binary
    Parser             Typecheck                   AIR Passes             Emitter
  [Tested via        [Mathematically              [Validated via         [Validated
   Differential       Checked Invariants:          Bounded SMT            via Section
   Fuzzing]           Effects & Caps]              Equivalence]           Checks]
```

| Compiler Subsystem | Primary Source File | Assurance Strategy | Verification Technique |
|:---|:---|:---|:---|
| **Lexer & Streaming Scanner** | [compiler/frontend/lexer.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/lexer.bix) | High-assurance state machine | Adversarial lexical fuzzing; zero-panic on invalid UTF-8 |
| **Parser & AST Construction** | [compiler/frontend/parser.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/parser.bix) | Deterministic recursive descent | Rejection tests on malformed syntax ([tests/test_malformed.bix](file:///home/bishwaxyz/translator/rubix/tests/test_malformed.bix)) |
| **Semantic & Effect Analyzer** | [compiler/frontend/sir_typecheck.bix](file:///home/bishwaxyz/translator/rubix/compiler/frontend/sir_typecheck.bix) | Machine-checked typing rules | Rejects purity and capability violations at compile time |
| **Affine Borrow Checker** | [compiler/middle/borrow_checker.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/borrow_checker.bix) | Monotonic resource state machine | Verified affine transitions; rejects use-after-move |
| **Escape Analyzer & Promoter** | [compiler/middle/escape_analysis.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/escape_analysis.bix) | Conservative pointer provenance | Verifies zero pointer escapes across lexical scopes |
| **Instruction Selector (RUMS)**| [compiler/backend/isel.bix](file:///home/bishwaxyz/translator/rubix/compiler/backend/isel.bix) | Equivalence-preserving peepholes | SMT validation of arithmetic rewrites |
| **ELF / PE / Mach-O Emitters** | [compiler/packaging/elf.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/elf.bix) | Structural format conformance | Validated via `readelf`, `objdump`, and QEMU execution |
| **Self-Hosting Pipeline** | [scripts/build.bix](file:///home/bishwaxyz/translator/rubix/scripts/build.bix) | Bit-for-bit reproducible bootstrap | $\text{SHA256}(\text{Stage 2}) \equiv \text{SHA256}(\text{Stage 3})$ |

---

## 4. Reproducible Builds and Binary Provenance

Rubix enforces **bit-for-bit build reproducibility**:
1. **Zero Timestamp Embeddings**: Binary headers (ELF, PE, Mach-O) emit deterministic constant timestamps (e.g., epoch 0) or source-hash derived timestamps, avoiding non-deterministic clock leaks.
2. **Deterministic Symbol Ordering**: Symbol tables and function offsets are laid out using deterministic hash order rather than pointer addresses in memory.
3. **Zero Uninitialized Memory**: All compiler internal allocation buffers (`sys_mmap`) are zero-initialized prior to code generation.
4. **Self-Hosting Identity**: Compiling `compiler/main.bix` with `bin/rubix` producing `stage2.elf`, and then compiling `compiler/main.bix` with `stage2.elf` producing `stage3.elf`, produces identical SHA-256 binary digests.

---

## 5. Adversarial Testing & Security Regression Suite

Rubix includes a dedicated adversarial test suite designed to attempt to break the compiler's safety invariants:

* [tests/test_adversarial_purity.bix](file:///home/bishwaxyz/translator/rubix/tests/test_adversarial_purity.bix): Attempts to invoke an effectful operation (`sys_write`) from within a function marked pure. The compiler must reject it at compile time.
* [tests/test_adversarial_capability.bix](file:///home/bishwaxyz/translator/rubix/tests/test_adversarial_capability.bix): Attempts to execute an OS file operation without holding the required `CAP_FILE_IO` token. The compiler must reject it at compile time.
* [tests/adversarial_tests.bix](file:///home/bishwaxyz/translator/rubix/tests/adversarial_tests.bix): Attempts to construct illegal pointer aliases, stack escapes, and forge interior references.
* [tests/security_regression_test.bix](file:///home/bishwaxyz/translator/rubix/tests/security_regression_test.bix): Regression verification covering all known security and compiler soundness bounds.

---

## 6. Summary

Security and stability in Rubix are not subjective goals; they are mathematically enforced compiler guarantees. By unifying spatial bounds checking, temporal affine ownership, capability-based privilege confinement, and bit-for-bit reproducible compilation, Rubix provides a trustworthy foundation for mission-critical native software.
