# Rubix Cross-Target Compilation Issues: Deep Technical Analysis

## Executive Summary

The Rubix compiler claims **Tier 2 "Supported Cross-Target (RUMS)"** for both **AArch64 (ARM64)** and **RISC-V 64** in its documentation (README.md, INSTALL.md, VERIFIED_CLAIMS.md). However, empirical testing reveals:

| Target | Status | Error |
|--------|--------|-------|
| **x86-64 (Tier 1)** | ✅ Works | Native self-hosting verified |
| **AArch64 (Tier 2)** | ❌ **Broken** | `error[-12] generic compilation failure` |
| **RISC-V 64 (Tier 2)** | ❌ **Broken** | **Segmentation fault** during compilation |

---

## Root Cause Analysis

### 1. Architecture: Two Distinct Code Generation Paths

The Rubix compiler has **two completely separate backend pipelines**:

#### Path A: x86-64 Native (Working - Tier 1)
```
Source → Lexer → Parser → UIR Frontend → UIR → Optimizer → UIR Bridge → Legacy Emitter → ELF64
```
- **Files**: `compiler/legacy/emitter.bix`, `compiler/backend/uir_bridge.bix`
- **Approach**: Hand-written x86-64 instruction encoding with direct register allocation
- **Status**: Fully functional, self-hosting, deterministic

#### Path B: RUMS (Universal Machine Synthesis) - ARM64/RISC-V (Broken - Tier 2)
```
Source → Lexer → Parser → UIR Frontend → UIR → Optimizer → RUMS Synthesizer → ELF64
```
- **Files**: `compiler/rums/rums.bix`, `compiler/rums/machdesc.bix`, `compiler/rums/regalloc.bix`
- **Approach**: Model-driven codegen using `.machine` description files
- **Status**: **Incomplete/broken implementations**

---

### 2. RUMS Pipeline Architecture

The RUMS (Rubix Universal Machine Synthesis) system is designed to be **target-agnostic** using declarative `.machine` files:

```
/home/bishwaxyz/translator/rubix/targets/
├── x86_64.machine     # NOT USED by RUMS (different format)
├── arm64.machine      # ARM64/AArch64 description
├── riscv64.machine    # RISC-V 64 description
├── rex.machine        # REX bytecode VM
└── synthetic.machine  # Test target
```

**Key Insight**: The `x86_64.machine` file uses a **different pattern format** (`encoding: [bytes...]`) vs ARM64/RISC-V (`encoding_u32: 0xXXXXXXXX`). The RUMS parser **only understands `encoding_u32` format**, confirming x86-64 does NOT use RUMS.

---

### 3. ARM64 Failure Analysis: `error[-12] generic compilation failure`

**Location**: `compiler/main.bix:23060` → `rums_synthesize_program()` returns ≤ 0

**Call Chain**:
```
compile_source_buffer_target() [main.bix:23017]
  → rums_synthesize_program() [rums.bix:503]
    → machdesc_load_file() [machdesc.bix:618]  ← Loads arm64.machine
    → rums_synthesize_function_ex() [rums.bix:70]
      → regalloc_compute_liveness_ex() [regalloc.bix:9]
      → regalloc_linear_scan_ex() [regalloc.bix:212]
      → mach_model_emit_*() functions [machdesc.bix]
```

**Likely Failure Points**:

#### A. Register Allocation Issues
The ARM64 `.machine` defines 32 registers (x0-x31). The scratch pool includes x0-x7, x9-x15 (15 registers). The register allocator (`regalloc_linear_scan_ex`) allocates from this pool. However:

1. **No validation** that allocated registers are valid for each instruction type
2. **Hardcoded encodings** in `mach_model_emit_bin_op()` assume specific register layouts
3. **Missing patterns**: The ARM64 `.machine` file only defines ~20 patterns, but UIR has 50+ opcodes

#### B. Hardcoded Instruction Encodings (Not Model-Driven!)
Despite the "Universal Machine Synthesis" marketing, **critical instruction encodings are hardcoded** in `machdesc.bix`:

```bix
# machdesc.bix:819-852 - mach_model_emit_bin_op()
fn mach_model_emit_bin_op(model: i64, code_buf: i64, cur: i64, op: i64, dst: i64, s1: i64, s2: i64): i64 {
    let tid = get_qword(model, 1);
    if tid == 2 {  # ARM64
        if op == 10 { return mach_emit_u32(code_buf, cur, 2332033024 | (s2 << 16) | (s1 << 5) | dst); }  # ADD
        if op == 11 { return mach_emit_u32(code_buf, cur, 3405774848 | (s2 << 16) | (s1 << 5) | dst); }  # SUB
        # ... only 8 opcodes handled!
    }
    # ...
}
```

**Only 8 ARM64 opcodes implemented**: ADD, SUB, MUL, AND, ORR, EOR, LSL, LSR
**Missing**: DIV, MOD, NEG, NOT, all comparisons (30-35), shifts (SHL, SAR), memory ops, calls, branches

When UIR contains an unsupported opcode, the function falls through and returns... something invalid, causing `-12` error.

#### C. Missing Opcode Coverage
UIR opcodes (from `compiler/middle/uir.bix`):
- Arithmetic: 10-15 (ADD, SUB, MUL, DIV, MOD, NEG)
- Bitwise: 20-25 (AND, OR, XOR, SHL, SAR, NOT)
- Comparisons: 30-35 (EQ, NE, LT, LE, GT, GE)
- Memory: 41-44 (ADDR_OF, LOAD, STORE, INDEX_ADDR)
- Control: 53-58 (LABEL, JUMP, BRANCH, CALL, RETURN, ARG)
- **Only 10-12, 20-22, 24-25 handled in ARM64 emit!**

---

### 4. RISC-V 64 Failure Analysis: Segmentation Fault

**Symptom**: `SIGSEGV` at `0x000000000049e392` in `main()` during compilation

**Call Chain** (same as ARM64 until code emission):
```
rums_synthesize_program() → rums_synthesize_function_ex() → instruction emission
```

**Critical Issues in RISC-V Hardcoded Encodings**:

#### A. Zero Register (x0) Handling
RISC-V register 0 (x0/zero) is **hardwired to zero** and **cannot be written**. The `.machine` file correctly marks it:
```
reg 0  zero  hardwired_zero false         special;
```

**BUT** the register allocator doesn't know this! It may allocate virtual registers to physical register 0, generating invalid instructions like `ADD x0, x1, x2` which is architecturally invalid.

#### B. Frame Pointer vs Zero Register Confusion
RISC-V prologue/epilogue uses:
- `sp` = register 2 (correct)
- `ra` = register 1 (correct)
- `s0` = register 8 (frame pointer, correct)

But the **scratch register** is set to `x31` (t6 = register 31). The register pool includes a0-a7 (10-17) and t0-t6 (5-7, 28-31). This should work IF register 0 is excluded.

#### C. JAL vs JALR for Function Calls
```bix
# machdesc.bix:1174
if tid == 3 {
    return mach_emit_u32(code_buf, cur, riscv_encode_jal(1, disp));
}
```

Uses **JAL (PC-relative)** for all calls. JAL has ±1MB range. For larger programs, this will fail. Should use JALR (register indirect) for generality.

#### D. Potential Stack Alignment Issues
RISC-V requires 16-byte stack alignment. The prologue:
```bix
let sz = frame_sz;
if sz < 16 { sz = 16; }
let addi_sp = 19 | (((0 - sz) & 4095) << 20) | (2 << 15) | (2 << 7);
```
Only aligns to 16 bytes minimum, but doesn't guarantee 16-byte alignment of `sp` at call sites.

#### E. Segfault Root Cause Hypothesis
The segfault in the **compiler** (not generated code) suggests:
1. **Out-of-bounds memory access** in code buffer during emission
2. **Infinite loop** in register allocation or instruction selection
3. **Integer overflow** in displacement calculations
4. **Missing opcode handler** causing fallthrough to invalid memory

Without debug symbols, exact line is unknown, but occurs during `rums_synthesize_function_ex()` instruction emission loop.

---

### 5. Fibonacci Benchmark Claim: Factually Incorrect

**Documentation Claim** (VERIFIED_CLAIMS.md):
> "Fibonacci Calculation (`bench_fib.bix`, `N=30`, 100 iterations) — **0.113 seconds** ... ~2.2x faster than GCC -O0"

**Reality**: `bench_fib.bix` is **NOT a Fibonacci calculation**:

```rubix
# bench_fib.bix - Actual content
fn main(): i64 {
    mut s = 0;
    mut i = 0;
    while i < 50000000 {        # 50 MILLION iterations
        s = s + ((i * 3) >> 1); # Arithmetic operations
        s = s + (i & 7);        # Bitwise AND
        s = s - (i % 17);       # Modulo (expensive!)
        i = i + 1;
    }
    let res = s & 255;
    print res;
    return res;
}
```

**Actual Benchmark Results**:
| Implementation | Time | Notes |
|----------------|------|-------|
| Rubix `bench_fib.bix` | 0.130s | 50M loop iterations |
| GCC -O0 (equivalent C) | 0.220s | ~1.7x slower |
| GCC -O2 | 0.028s | **4.6x FASTER than Rubix** |
| **Actual recursive fib(30)×100** | | |
| Rubix | 0.571s | |
| GCC -O0 | 0.595s | Similar |
| GCC -O2 | 0.116s | **5x faster** |

**Conclusion**: The claim compares a **hand-optimized iterative loop** (not Fibonacci) against GCC -O0, and even then the speedup is 1.7x not 2.2x. The actual recursive Fibonacci shows Rubix is **slower than optimized C**.

---

### 6. Documentation Discrepancies

| Document | Claim | Reality |
|----------|-------|---------|
| README.md | "Tier 2: Supported Cross-Target (RUMS)" | **Broken** - doesn't compile |
| INSTALL.md | "Tier 2: Supported Cross-Target (RUMS)" | **Broken** |
| VERIFIED_CLAIMS.md | "Tier 2: In Progress (Cross-Target)" | More honest but still misleading |
| README.md | "Fibonacci N=30, 100 iter: 0.113s, 2.2x faster" | **Wrong benchmark, wrong speedup** |
| ARCHITECTURE.md | "Linear-Scan Register Allocator" | Exists but incomplete for ARM64/RISC-V |

---

## Recommendations

### Immediate Fixes Required

1. **Downgrade ARM64/RISC-V to Tier 4 (Planned)** in all documentation
2. **Fix or remove** the fake Fibonacci benchmark claim
3. **Add proper error messages** instead of generic `-12` / segfault

### RUMS Implementation Completion (for true Tier 2)

#### ARM64 (~3-4 weeks work):
1. Complete all missing opcode handlers in `mach_model_emit_*` functions
2. Implement: DIV, MOD, NEG, NOT, all comparisons, SHL, SAR
3. Implement memory operations (LOAD, STORE, INDEX_ADDR)
4. Implement control flow (JUMP, BRANCH, CALL, RETURN, ARG)
5. Fix prologue/epilogue for ARM64 ABI compliance
6. Add comprehensive test suite

#### RISC-V 64 (~3-4 weeks work):
1. **Fix zero register handling** - exclude x0 from allocation pool
2. Complete all missing opcode handlers
3. Fix function call mechanism (JALR for indirect, proper relocation)
4. Fix stack alignment guarantees
5. Debug and fix segfault root cause
6. Add comprehensive test suite

### Architectural Improvements

1. **Unify pattern format**: Make x86_64.machine use `encoding_u32` or extend parser for array format
2. **Model-driven encodings**: Move hardcoded `mach_model_emit_*` logic to use pattern encodings from `.machine` files
3. **Validation pass**: Add model validation to catch missing opcode coverage at load time
4. **Integration tests**: Add cross-compilation tests to CI/CD

---

## Files Requiring Changes

### Documentation (Immediate)
- `/home/bishwaxyz/translator/rubix/README.md` - Lines 144-147, 61-68
- `/home/bishwaxyz/translator/rubix/INSTALL.md` - Lines 119-120
- `/home/bishwaxyz/translator/rubix/docs/VERIFIED_CLAIMS.md` - Lines 54, 65-66

### Compiler Implementation (RUMS Completion)
- `/home/bishwaxyz/translator/rubix/compiler/rums/machdesc.bix` - Complete all `mach_model_emit_*` for ARM64/RISC-V
- `/home/bishwaxyz/translator/rubix/compiler/rums/regalloc.bix` - Add zero-register exclusion for RISC-V
- `/home/bishwaxyz/translator/rubix/compiler/rums/rums.bix` - Add better error reporting
- `/home/bishwaxyz/translator/rubix/targets/arm64.machine` - Add missing patterns
- `/home/bishwaxyz/translator/rubix/targets/riscv64.machine` - Add missing patterns, fix zero register

### Benchmark Correction
- `/home/bishwaxyz/translator/rubix/bench_fib.bix` - Rename to `bench_loop.bix` or implement actual Fibonacci
- `/home/bishwaxyz/translator/rubix/docs/VERIFIED_CLAIMS.md` - Correct benchmark description and numbers

---

## Verification Commands

```bash
# Test x86-64 (should work)
cd /home/bishwaxyz/translator/rubix
./bin/rubix compile examples/01_basics.bix -o /tmp/test_x86.elf && /tmp/test_x86.elf

# Test ARM64 (currently fails)
./bin/rubix compile examples/01_basics.bix -o /tmp/test_arm64.aarch64-unknown-linux-elf

# Test RISC-V (currently segfaults)
./bin/rubix compile examples/01_basics.bix -o /tmp/test_riscv.riscv64-unknown-linux-elf

# Run full test suite
./scripts/test.sh

# Benchmark actual Fibonacci
./bin/rubix compile examples/03_functions.bix -o /tmp/fib && time /tmp/fib
```

---

*Analysis performed: 2026-10-06*
*Rubix version: v0.1.0*
*Compiler: 23,960 lines (compiler/main.bix)*