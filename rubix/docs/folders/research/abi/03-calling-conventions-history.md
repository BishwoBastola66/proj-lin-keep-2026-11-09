# The History and Evolution of Calling Conventions

## 1. The 32-Bit x86 Calling Convention Chaos

On 32-bit x86 (IA-32), the processor only had 8 general-purpose registers (`EAX`, `ECX`, `EDX`, `EBX`, `ESP`, `EBP`, `ESI`, `EDI`). Because registers were severely scarce, an explosion of competing calling conventions emerged:

| Convention | Argument Registers | Stack Order | Stack Cleanup | Primary Use Case |
|:---|:---|:---|:---|:---|
| **`cdecl`** | None (All on stack) | Right-to-Left | **Caller** (`add esp, 16`) | Default C / Unix; variadic functions (`printf`) |
| **`stdcall`** | None (All on stack) | Right-to-Left | **Callee** (`ret 16`) | Microsoft Win32 API (`WINAPI`); compact call sites |
| **`pascal`** | None (All on stack) | Left-to-Right | **Callee** (`ret 16`) | Classic MacOS, Turbo Pascal, 16-bit Windows |
| **`fastcall`** | `ECX`, `EDX` (first 2 args) | Right-to-Left | **Callee** | Optimized internal loops in Borland / MSVC |
| **`thiscall`** | `ECX` (holds `this` pointer) | Right-to-Left | **Callee** | Microsoft C++ non-static member functions |
| **`vectorcall`** | `ECX`, `EDX` + `XMM0-XMM5` | Right-to-Left | **Callee** | High-performance SIMD vector math functions |

### 1.1. Why This Caused Massive Breakage
A function declared as `int foo(int, int)` compiled under `cdecl` would fail catastrophically if linked against a caller expecting `stdcall`:
- If caller uses `stdcall` (expects callee to clean stack) and callee is `cdecl` (callee does not clean stack), the stack pointer is never adjusted, leading to stack leakage and eventual stack overflow.
- If caller uses `cdecl` (caller will add 8 to `ESP`) and callee is `stdcall` (callee already popped 8 via `ret 8`), the stack pointer is adjusted twice. Upon returning to the caller's caller, `ESP` is misaligned or points to garbage, triggering immediate memory corruption.

---

## 2. The 64-Bit Unification (and New Schism)

When AMD designed AMD64 (x86-64) in 2003, they expanded the register file from 8 to 16 general-purpose registers (`RAX`, `RCX`, `RDX`, `RBX`, `RSP`, `RBP`, `RSI`, `RDI`, `R8`-`R15`).
This eliminated the need for dozens of 32-bit conventions, but resulted in a major split between Unix and Windows:

```
                  +-----------------------------------+
                  |         x86-64 Architecture       |
                  |     16 GPRs (RAX..R15), 16 XMMs   |
                  +-----------------------------------+
                                    |
                 +------------------+------------------+
                 |                                     |
                 v                                     v
  +------------------------------+     +-------------------------------+
  |    System V AMD64 ABI        |     |      Microsoft x64 ABI        |
  |  (Linux, BSD, macOS, Solaris)|     |       (Windows, UEFI)         |
  +------------------------------+     +-------------------------------+
  | - 6 Integer Regs:            |     | - 4 Integer Regs:             |
  |   RDI, RSI, RDX, RCX, R8, R9 |     |   RCX, RDX, R8, R9            |
  | - 8 FP Regs: XMM0 - XMM7     |     | - 4 FP Regs: XMM0 - XMM3      |
  | - Red Zone: 128 bytes        |     | - Red Zone: NONE              |
  | - Shadow Space: NONE         |     | - Shadow Space: 32 bytes      |
  | - Callee Saved:              |     | - Callee Saved:               |
  |   RBX, RBP, R12, R13, R14, R15|    |   RBX, RBP, RDI, RSI, R12..R15|
  +------------------------------+     +-------------------------------+
```

### 2.1. System V AMD64 Calling Sequence
- Arguments 1–6: Passed in `RDI`, `RSI`, `RDX`, `RCX`, `R8`, `R9`.
- Arguments 7+: Pushed onto stack right-to-left.
- Floating-point / Vector: Passed in `XMM0`–`XMM7`.
- Variadic calls: `AL` register must hold the number of vector registers used.
- Stack alignment: `RSP + 8` must be a multiple of 16 immediately after the `CALL` instruction.
- **Red Zone**: 128 bytes below `RSP` reserved for leaf function scratch space without moving `RSP`.

### 2.2. Microsoft x64 Calling Sequence
- Arguments 1–4: Passed in `RCX`, `RDX`, `R8`, `R9`.
- Arguments 5+: Pushed onto stack right-to-left.
- Floating-point / Vector: Passed in `XMM0`–`XMM3` (strictly paired with integer slots: arg 1 is either `RCX` or `XMM0`, arg 2 is `RDX` or `XMM1`).
- **Shadow Space (Home Space)**: The caller MUST allocate 32 bytes (4 words) on the stack immediately preceding the return address, even if the callee has fewer than 4 arguments.
- **No Red Zone**: Any memory beyond `RSP` can be asynchronously overwritten by Windows kernel threads or APC interrupts at any time.

---

## 3. RISC Calling Conventions

### 3.1. ARM AAPCS64 (AArch64)
ARM standardized the Procedure Call Standard for the 64-bit ARM Architecture:
- 31 General Purpose Registers: `X0`–`X30`.
- **Arguments 1–8**: Passed in `X0`–`X7`.
- **Indirect Result Location (`sret`)**: Dedicated register `X8` holds the memory pointer for aggregate return values larger than 16 bytes.
- **Temporary / Scratch**: `X9`–`X15` (caller-saved).
- **Platform Register**: `X18` (reserved for OS thread pointer in iOS / Windows; scratch in Linux).
- **Callee-Saved**: `X19`–`X28`.
- **Frame Pointer**: `X29`.
- **Link Register**: `X30` holds return address (no stack push on `BL` branch instruction).
- **Stack Pointer**: `SP` must remain 16-byte aligned at all times.

### 3.2. RISC-V psABI (LP64)
The standard RISC-V 64-bit calling convention:
- **Arguments 1–8**: `a0`–`a7` (x10–x17).
- **Return Values**: `a0`, `a1` (x10, x11).
- **Return Address**: `ra` (x1).
- **Stack Pointer**: `sp` (x2) must be 16-byte aligned.
- **Global Pointer**: `gp` (x3) holds base of small data section.
- **Thread Pointer**: `tp` (x4) points to TLS block.
- **Temporaries**: `t0`–`t6` (x5–x7, x28–x31).
- **Saved Registers**: `s0`–`s11` (x8–x9, x18–x27). `s0` may serve as frame pointer `fp`.

---

## 4. Modern WebAssembly & Component Boundaries

WebAssembly began with a flat stack machine and linear memory:
- **WASM Core ABI**: Functions take only 32-bit and 64-bit integers and floats (`i32`, `i64`, `f32`, `f64`).
- **Pointers**: Mere 32-bit integer offsets into a module-private linear byte array (`Memory`).
- **Canonical ABI**: Built for the Component Model, defines typed conversions:
  - Strings converted between host UTF-8 and guest linear memory.
  - Slices passed as `(ptr, len)` tuples.
  - Structs decomposed into primitive flat register sequences or spilled into linear memory.

---

## 5. Summary Matrix: Cross-Architecture Register Allocations

| Role | x86-64 System V | x86-64 Win64 | ARM64 AAPCS | RISC-V LP64 |
|:---|:---|:---|:---|:---|
| **Arg 1** | `RDI` | `RCX` | `X0` | `a0` |
| **Arg 2** | `RSI` | `RDX` | `X1` | `a1` |
| **Arg 3** | `RDX` | `R8` | `X2` | `a2` |
| **Arg 4** | `RCX` | `R9` | `X3` | `a3` |
| **Arg 5** | `R8` | Stack | `X4` | `a4` |
| **Arg 6** | `R9` | Stack | `X5` | `a5` |
| **Arg 7** | Stack | Stack | `X6` | `a6` |
| **Arg 8** | Stack | Stack | `X7` | `a7` |
| **Return** | `RAX` (hi: `RDX`) | `RAX` | `X0` (hi: `X1`) | `a0` (hi: `a1`) |
| **Shadow Space** | 0 bytes | 32 bytes | 0 bytes | 0 bytes |
| **Red Zone** | 128 bytes | 0 bytes | 0 bytes | 0 bytes |
| **Link Reg** | Stack (`[RSP]`) | Stack (`[RSP]`) | `X30` (`LR`) | `ra` (`x1`) |
