# Machine Synthesis & RUMS Backend Architecture

> **Status**: Canonical Accepted  
> **Classification**: Machine Code Synthesis & Code Generation  
> **Subsystem**: Rubix Compiler Substrate  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the architecture of the **Rubix Universal Machine Synthesis (RUMS)** backend.

RUMS completely eliminates the need for external assemblers (`as`, `nasm`, `llvm-mc`) or linkers (`ld`, `lld`). It synthesizes raw native machine code directly from Universal IR (UIR) using declarative machine description files (`.machine`) and pre-computed machine stencils (`PCMSS`).

---

## 2. Declarative Target Architecture Specifications (`.machine`)

Hardware architectures are specified through declarative configuration rules defining register banks, calling conventions, and instruction encodings:

```
// x86_64.machine Definition Fragment
target x86_64 {
    endianness: little
    word_size: 64
    
    registers {
        gpr: [rax, rcx, rdx, rbx, rsp, rbp, rsi, rdi, r8, r9, r10, r11, r12, r13, r14, r15]
        apx_extended: [r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31]
        vector: [zmm0..zmm31]
    }
    
    abi_calling_convention default {
        params_gpr: [rdi, rsi, rdx, rcx, r8, r9]
        return_gpr: [rax, rdx]
        callee_saved: [rbx, rsp, rbp, r12, r13, r14, r15]
    }
}
```

---

## 3. Direct Machine Byte Encoders

RUMS incorporates direct byte encoders for three primary instruction set architectures:

### 3.1 x86-64 Machine Emission
* **Instruction Splicing**: Emits variable-length machine instructions (1 to 15 bytes).
* **Prefix Encoding**: Directly generates REX prefixes (`0x48` for 64-bit operands) or EVEX prefixes for Intel APX 32-register access without invoking an external assembler.
* **ModR/M & SIB Generation**: Encodes register-to-register moves (`mov rax, rbx` $\to$ `48 89 D8`) and displacement-based memory loads in single CPU cycles.

### 3.2 AArch64 (ARM64) Machine Emission
* **Instruction Splicing**: Emits fixed 32-bit (4-byte) aligned instruction words.
* **Register Mapping**: Maps virtual registers directly to hardware registers `X0` through `X30`.
* **Example Instruction Emission**:
  * Arithmetic Add: `add x0, x1, x2` $\to$ `0x8B020020`
  * Function Return: `ret` $\to$ `0xD65F03C0`

### 3.3 RISC-V 64 (RV64GC) Machine Emission
* **Instruction Splicing**: Emits 32-bit standard instructions and 16-bit compressed (`C` extension) instructions.
* **Immediate Fields**: Encodes signed 12-bit immediates directly into I-type and S-type instruction bitfields without string parsing.

---

## 4. End-to-End Emission Invariant

```
[Universal IR (UIR) Buffer]
            │
            ▼
[RUMS Fast Stencil Matcher]
            │
            ▼
[Direct In-Memory Byte Splicer]
            │
            ▼
[Executable Virtual Memory Page (PROT_READ | PROT_EXEC)]
```

RUMS operates strictly within memory: **zero intermediate assembly files (`.s`) are written to disk**, slashing disk I/O and enabling sub-millisecond compilation.
