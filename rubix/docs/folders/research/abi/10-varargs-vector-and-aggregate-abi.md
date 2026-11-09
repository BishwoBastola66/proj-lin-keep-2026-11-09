# Varargs, Vector, and Aggregate ABI

## 1. The Complexity of Variadic Functions (`varargs`)

A variadic function (e.g. `printf(const char* fmt, ...)`) can accept an unknown number of arguments of unknown types at runtime. How the machine code passes and retrieves these arguments is one of the most divergent areas in ABI design.

### 1.1. System V AMD64 Variadic Protocol
In System V, floating-point arguments are passed in `XMM0-XMM7` while integers are passed in `RDI, RSI, RDX, RCX, R8, R9`.
To enable the callee to spill only the registers that were actually used:
1. **The `AL` Invariant**: Before executing the `CALL` instruction to a variadic function, the caller MUST set register `AL` (the lower 8 bits of `RAX`) to the **number of SSE registers used** (between 0 and 8).
   - If no floating-point arguments are passed: `xor eax, eax` (sets `AL = 0`).
2. **The `va_list` Record**: In System V, `va_list` is an array of one struct containing:
   ```c
   typedef struct {
       unsigned int gp_offset;      // offset in reg_save_area for next GPR
       unsigned int fp_offset;      // offset in reg_save_area for next XMM
       void *overflow_arg_area;    // pointer to next stack argument
       void *reg_save_area;        // pointer to register spill buffer
   } va_list[1];
   ```
   The callee allocates a 176-byte `reg_save_area` on its stack in the prologue and spills `RDI..R9` and `XMM0..XMM7` (if `AL > 0`).

### 1.2. Microsoft x64 Variadic Simplicity
Microsoft x64 took a radically simpler approach:
1. Since the caller **always allocates 32 bytes of shadow space** on the stack, the callee simply spills the 4 register arguments (`RCX, RDX, R8, R9`) into `[RSP + 8]` through `[RSP + 32]`.
2. Stack arguments follow immediately above the shadow space.
3. Therefore, all arguments form a **completely contiguous, linear array in memory**.
4. **`va_list` on Windows**: It is simply a flat pointer:
   ```c
   typedef char* va_list;
   ```
   Advancing `va_list` is a single addition: `ap += 8`.

---

## 2. Aggregate Argument Passing (Structs & Records)

How are structs passed when passed by value?

### 2.1. System V AMD64 "Eightbyte Classification"
System V classifies each 8-byte chunk of a struct into one of several classes:
- **`INTEGER`**: Passed in GPRs (`RDI`, `RSI`, etc.).
- **`SSE`**: Passed in `XMM` registers.
- **`MEMORY`**: Passed on the stack.

**Classification Rules**:
1. If the struct is larger than 16 bytes (2 eightbytes), it is classified as `MEMORY` and passed entirely on the stack.
2. If the struct is $\le 16$ bytes, each 8-byte chunk is classified independently.
   - Example: A struct with two `i64` fields is classified as `(INTEGER, INTEGER)` and passed in `RDI` and `RSI`.
   - Example: A struct with one `i64` and one `f64` is passed in `RDI` and `XMM0`.

### 2.2. Microsoft x64 Struct Rules
Microsoft x64 avoids complex field classification:
1. If a struct size is exactly 1, 2, 4, or 8 bytes: It is passed directly in the corresponding GPR (`RCX`, `RDX`, etc.).
2. If a struct size is **ANY other size** (e.g. 3 bytes, 5 bytes, 12 bytes, 16 bytes):
   - The caller allocates a temporary copy on its stack.
   - The caller passes a **pointer to the copy** in the argument register!

### 2.3. The 16-Byte Struct Bug Hazard
Consider a struct with two 64-bit integers:
```c
struct Point { int64_t x; int64_t y; };
```
- In System V: Passed in **two registers** (`RDI` and `RSI`).
- In Windows x64: Passed as **a single pointer** in `RCX` pointing to stack memory!
If a System V caller calls a Windows callee, the callee dereferences `RDI` (or `RCX`) as a pointer, causing an immediate memory fault or reading garbage.

---

## 3. Vector and SIMD ABIs: Fixed vs. Scalable

### 3.1. Fixed-Width Vector ABIs (SSE, AVX, AVX-512)
- **SSE**: 128-bit registers (`XMM0-XMM15`).
- **AVX**: 256-bit registers (`YMM0-YMM15`). Upper 128 bits are volatile caller-saved.
- **AVX-512**: 512-bit registers (`ZMM0-ZMM31`) plus mask registers (`k0-k7`).
- **The AVX/SSE Transition Penalty**: Mixing legacy 128-bit SSE instructions with 256-bit AVX instructions causes a 70-cycle microarchitectural penalty on Intel CPUs unless `VZEROUPPER` is executed before returning from or calling an external function.

### 3.2. Scalable Vector ABIs (ARM SVE and RISC-V RVV)
In modern architectures (ARM Scalable Vector Extension and RISC-V Vector Extension), the hardware vector length is **not fixed at compile time**. It can range from 128 bits to 2048 bits depending on the specific CPU implementation.
- **Vector-Length Agnostic (VLA) ABI**:
  - Functions cannot assume a fixed register byte size for stack spilling.
  - Frame layout must dynamically query the vector length at runtime (e.g. `RDVL` instruction on ARM64) to calculate stack offsets.
  - Callee-saved vector registers must spill only the bottom 64 or 128 bits, leaving higher vector lanes as volatile scratch.
