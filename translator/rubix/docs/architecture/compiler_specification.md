# Rubix Next Compiler Specification

> **End-to-End Compiler Pipeline, Pass Invariants, Diagnostic Engine, and Bootstrap Determinism**
> *Specification Version 2.0.0-Next*

---

## 1. Pipeline Overview

The Rubix Next compiler is an independent, sovereign ahead-of-time (AOT) compiler that translates Rubix source code directly into native machine code containers (ELF64, PE32+, Mach-O, WebAssembly) without intermediate C compilation or external assemblers/linkers.

```text
                               THE COMPILER PIPELINE
                                         │
 1. DRIVER & CLI       Parse arguments, verify file paths, initialize arenas
        │
 2. MMAP SOURCE        Zero-copy mmap of source code; zero string heap allocation
        │
 3. LEXER & TOKENIZER  Streaming zero-allocation lexer emitting integer token streams
        │
 4. SIR PARSER         Constructs typed Semantic AST with Effect and Capability metadata
        │
 5. SEMANTIC VERIFY    Asserts Effect Confinement and Capability Proof tokens
        │
 6. AIR LOWERING       Synthesizes Affine IR; runs Escape Analysis & Borrow Checker
        │
 7. AIR OPTIMIZER      Stack frame promotion, pure Dead-Code Elimination (DCE)
        │
 8. UIR LOWERING       Lowers verified AIR into 3-address virtual instruction stream
        │
 9. UIR OPTIMIZER      Constant folding, copy propagation, CFG invariant verification
        │
10. RUMS SYNTHESIS     Linear scan register allocation; target pattern instruction emission
        │
11. CONTAINER EMIT     Direct binary container emission (ELF64, PE/COFF, Mach-O, WASM)
        │
12. OUTPUT EMISSION    Writes executable binary directly to disk via sys_open + sys_write
```

---

## 2. Stage Contracts & Invariants

Each phase in the pipeline is guarded by formal invariants:

| Pipeline Stage | Input Contract | Output Contract | Failure Diagnostic |
|---|---|---|---|
| **Lexing & Parsing** | Valid UTF-8 source buffer | Well-formed SIR AST in flat arena | `SYNTAX_ERROR` with line/column pointer |
| **SIR Semantic Verify** | SIR AST | Proved effect confinement & valid capabilities | `EFFECT_VIOLATION` (-101) / `CAPABILITY_UNAUTHORIZED` (-102) |
| **AIR Lowering** | Verified SIR AST | Monotonic Affine IR instruction stream | `AIR_LOWER_FAIL` |
| **Escape Analysis** | AIR instruction stream | Non-escaping resources promoted to stack | None (safe conservative fallback) |
| **Borrow Checker** | AIR instruction stream | All affine resources have single owner | `USE_AFTER_MOVE` (-201) / `DOUBLE_DROP` (-203) |
| **UIR Lowering** | Verified AIR stream | 3-address virtual register stream | `UIR_EMIT_FAIL` |
| **RUMS Synthesis** | Verified UIR stream | Machine code bytes matching `.machine` model | `REGISTER_EXHAUSTION` / `UNSUPPORTED_OP` |
| **Container Emission**| Machine code bytes + symbols | Standalone OS executable | `CONTAINER_EMIT_FAIL` |

---

## 3. Diagnostic & Error Reporting Architecture

Rubix Next provides dual-mode diagnostics:
1. **Human-Readable Diagnostics**: High-fidelity terminal output featuring colored severity headers, source code snippets, carets, and contextual remediation advice:
   ```text
   rubix next: error[-101] [EFFECT_VIOLATION]: pure function cannot invoke effectful operation
     --> src/math.bix:12:5
      |
   12 |     sys_write(1, msg, len);
      |     ^^^^^^^^^^^^^^^^^^^^^^ function is declared 'pure', but operation has effects 'io, syscall'
   ```
2. **Machine-Readable JSON Diagnostics (`--json`)**: Structured JSON output designed for Language Server Protocols (LSP), automated agents, and CI pipelines:
   ```json
   {
     "status": "error",
     "code": -101,
     "category": "EFFECT_VIOLATION",
     "message": "pure function cannot invoke effectful operation",
     "span": { "file": "src/math.bix", "line": 12, "col": 5 }
   }
   ```

---

## 4. Self-Hosting Bootstrap Determinism

The unified Rubix compiler is self-hosting: the compiler source (`compiler/main.bix` and its modular subsystems in `compiler/frontend/`, `compiler/middle/`, `compiler/backend/`, `compiler/rums/`, `compiler/common/`, `compiler/packaging/`) compiles itself.

### Deterministic Three-Stage Build Process
1. **Stage 1 Binary**: The existing baseline `bin/rubix` compiles `compiler/main.bix` to produce `scratch/stage2.elf`.
2. **Stage 2 Binary**: `scratch/stage2.elf` compiles `compiler/main.bix` to produce `scratch/stage3.elf`.
3. **Verification**: The compiler executes a byte-for-byte binary comparison:
   $$\text{cmp -s scratch/stage2.elf scratch/stage3.elf} == 0$$
   $$\text{SHA256}(\text{stage2.elf}) \equiv \text{SHA256}(\text{stage3.elf})$$

This mathematical equality guarantees that the compiler has zero non-deterministic timestamps, zero pointer-leak nonces, and zero build-environment dependencies in its generated native artifacts.

