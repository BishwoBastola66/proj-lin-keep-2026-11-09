# RISC-V Processor Specific ABI (psABI)

## 1. Overview of the RISC-V psABI (LP64 Standard)

The **RISC-V Processor-Specific ABI (psABI)** is maintained by RISC-V International. For 64-bit systems, the standard flavor is **LP64** (integers are 32-bit, longs and pointers are 64-bit).

```
+-------------------------------------------------------------------------------+
|                       RISC-V Register File (32 GPRs)                          |
+-----------+---------------+-------------------+-------------------------------+
| Register  | ABI Name      | Role              | Preservation Rule             |
+-----------+---------------+-------------------+-------------------------------+
| **x0**    | `zero`        | Hardwired Zero    | Immutable (writes discarded)  |
+-----------+---------------+-------------------+-------------------------------+
| **x1**    | `ra`          | Return Address    | Caller-Saved; set by `jalr`   |
+-----------+---------------+-------------------+-------------------------------+
| **x2**    | `sp`          | Stack Pointer     | **Callee-Saved**; 16B aligned |
+-----------+---------------+-------------------+-------------------------------+
| **x3**    | `gp`          | Global Pointer    | Unallocatable; points to data |
+-----------+---------------+-------------------+-------------------------------+
| **x4**    | `tp`          | Thread Pointer    | Unallocatable; points to TLS  |
+-----------+---------------+-------------------+-------------------------------+
| **x5–x7** | `t0 – t2`     | Temporaries       | Caller-Saved scratch          |
+-----------+---------------+-------------------+-------------------------------+
| **x8**    | `s0` / `fp`   | Saved Reg / FP    | **Callee-Saved**              |
+-----------+---------------+-------------------+-------------------------------+
| **x9**    | `s1`          | Saved Register    | **Callee-Saved**              |
+-----------+---------------+-------------------+-------------------------------+
| **x10–x11**| `a0 – a1`    | Args 1–2 / Return | Caller-Saved; return values   |
+-----------+---------------+-------------------+-------------------------------+
| **x12–x17**| `a2 – a7`    | Args 3–8          | Caller-Saved argument regs    |
+-----------+---------------+-------------------+-------------------------------+
| **x18–x27**| `s2 – s11`   | Saved Registers   | **Callee-Saved**              |
+-----------+---------------+-------------------+-------------------------------+
| **x28–x31**| `t3 – t6`    | Temporaries       | Caller-Saved scratch          |
+-----------+---------------+-------------------+-------------------------------+
```

---

## 2. Calling Convention Mechanics

1. **Parameter Passing**:
   - Up to eight scalar/pointer arguments are passed in `a0` through `a7`.
   - Arguments beyond eight are passed on the stack.
2. **Return Values**:
   - Primitive scalar values are returned in `a0`.
   - Double-word or two-element scalar values are returned across `a0` and `a1`.
   - Large aggregate values ($> 16$ bytes) are returned via an indirect memory pointer passed in `a0` as a hidden parameter.
3. **Stack Alignment**:
   - The stack pointer `sp` MUST remain aligned to a **16-byte boundary** at all times.
   - Stack grows downward.

---

## 3. Linker Relaxation (`R_RISCV_RELAX`)

A unique characteristic of the RISC-V ABI is ubiquitous **Linker Relaxation**:
- Because RISC-V instructions are 32 bits wide, forming a 32-bit immediate or calling a function far away requires a pair of instructions:
  ```text
  auipc t0, %pcrel_hi(symbol)
  jalr  ra, t0, %pcrel_lo(symbol)
  ```
- When the static linker discovers that the target symbol is within $\pm 1 \text{ MB}$, it "relaxes" (rewrites) this 8-byte sequence into a single 4-byte `jal ra, symbol` instruction.
- If the compressed extension (`RVC`) is present, it can relax it further into a 2-byte `c.jal` instruction!
- **Consequence**: Code sections dynamically shrink during final link time, shifting all subsequent code addresses. Compilers emit `R_RISCV_RELAX` relocation tags to guide this transformation.

---

## 4. The Sovereign Rubix RISC-V Model

In Rubix:
- Target configuration [targets/riscv64.machine](file:///home/bishwaxyz/translator/rubix/targets/riscv64.machine) formalizes the RISC-V register file and LP64 calling convention.
- Verified in cross-compilation testing via `qemu-riscv64` in [scripts/test.sh](file:///home/bishwaxyz/translator/rubix/scripts/test.sh).
