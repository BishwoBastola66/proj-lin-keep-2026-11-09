# RUMS Next Hardware Abstraction & Native Synthesis Specification

> **Rubix Universal Machine Synthesis (RUMS Next) — Architecture & Target Model Engine**
> *Specification Version 2.0.0-Next*

---

## 1. The RUMS Paradigm

Traditional compilers use either:
1. Massive monolithic code generators with hundreds of thousands of lines of hardcoded C++ emitter logic (GCC/Clang).
2. Or a virtual machine interpreter/JIT with heavy runtime overhead (JVM/CLR/V8).

**RUMS (Rubix Universal Machine Synthesis)** proves a radically different hypothesis:
> **Target architectures can be expressed as declarative, machine-readable semantic models (`.machine` files), and machine code bytes can be synthesized directly from virtual IR using generic pattern matching and linear-scan register allocation.**

RUMS Next evolves this baseline from a simple instruction-matcher into a comprehensive **Hardware Knowledge System**.

---

## 2. RUMS Next Machine Model Architecture

A `.machine` target description in RUMS Next specifies:
1. **Machine Properties**: Word size, endianness, stack alignment, branch penalty, instruction width.
2. **Physical Register File**: Register IDs, roles (return value, argument registers, callee-saved, scratch, frame pointer, stack pointer), and register classes.
3. **Calling Conventions**: Argument order, return registers, scratch pool, preserved pool, stack entry displacement.
4. **Instruction Encoding Patterns**: Virtual IR opcodes mapped to native instruction encodings, ModR/M byte calculators, immediate encodings, and PC-relative jump formulas.
5. **Hardware Capabilities Matrix**:
   - SIMD vector width (128-bit, 256-bit AVX2, 512-bit AVX-512, Neon, SVE, RVV).
   - Atomic instruction support (CMPXCHG, LR/SC, AMO).
   - Cache line width (64B standard) and prefetcher behavior.
   - Energy profile and power-efficient instruction alternatives.

---

## 3. The RUMS Next Synthesis Pipeline

```text
       AIR / UIR Node Stream (Virtual Registers v0, v1, v2...)
                                  │
                                  ▼
               [ Live Interval Analysis & Live Ranges ]
                                  │
                                  ▼
               [ Linear Scan Register Allocation Pass ]
               • Maps virtual registers to physical registers
               • Allocates stack spill slots if pressure exceeds pool
                                  │
                                  ▼
               [ Pattern Matcher & Instruction Selection ]
               • Queries loaded .machine model
               • Emits native bytes into code buffer
                                  │
                                  ▼
               [ Relocation & Patch Resolution ]
               • Computes PC-relative jump displacements
               • Patches forward branch targets and function call offsets
                                  │
                                  ▼
               [ Direct Binary Container Packaging ]
               • ELF64 Executable Header & Program Headers (Linux)
               • PE32+ Optional Header & Section Headers (Windows)
               • Mach-O 64 Load Commands & Segments (macOS)
               • WASM Type/Function/Code Sections (WASI)
```

---

## 4. Multi-Target Matrix

| Target Triple | ISA | OS | Object Container | Status |
|---|---|---|---|---|
| `x86_64-unknown-linux-elf` | x86-64 | Linux | ELF64 (Direct Syscall) | Tier 1 (Self-Hosting Native) |
| `aarch64-unknown-linux-elf` | AArch64 | Linux | ELF64 (Direct Syscall) | Tier 2 (RUMS QEMU Verified) |
| `riscv64-unknown-linux-elf` | RISC-V 64 | Linux | ELF64 (Direct Syscall) | Tier 2 (RUMS QEMU Verified) |
| `x86_64-pc-windows-pe` | x86-64 | Windows | PE32+ (PE/COFF Executable) | Tier 3 (Direct Packaging) |
| `x86_64-apple-darwin-macho` | x86-64 | macOS | Mach-O 64-bit | Tier 3 (Direct Packaging) |
| `wasm32-unknown-wasi` | WASM32 | WASI | WebAssembly Binary (.wasm) | Tier 3 (Direct Packaging) |

---

## 5. Elimination of External Assemblers and Linkers

RUMS Next contains zero runtime invocations of GNU `as`, GNU `ld`, or LLVM `lld`.
- ELF headers, segments, symbol tables, and string tables are synthesized directly in memory using bitwise formatting.
- Executables are written directly to disk via `sys_open` + `sys_write` with permission `0755` (`rwxr-xr-x`).
- The entire process from source text to executable binary takes **under 50 milliseconds** for standard programs.
