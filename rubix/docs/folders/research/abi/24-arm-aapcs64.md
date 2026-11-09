# ARM AAPCS64 Specification (Including 2026 Extensions)

## 1. Overview of the 64-Bit ARM Procedure Call Standard

The **Procedure Call Standard for the 64-bit ARM Architecture (AAPCS64)** governs procedure linkage and data layout for AArch64 processors.
It is standardized by Arm Ltd. and adhered to by Linux, Android, and Windows on ARM.

```
+-------------------------------------------------------------------------------+
|                       AArch64 Register File (31 GPRs + SP)                    |
+-------------------+-------------------+---------------------------------------+
| Register Range    | Role              | Invariant & Preservation              |
+-------------------+-------------------+---------------------------------------+
| **X0 – X7**       | Parameter Passing | Volatile / Caller-Saved;              |
|                   | & Return Values   | X0-X1 return primary scalar/pointer   |
+-------------------+-------------------+---------------------------------------+
| **X8**            | Indirect Result   | Caller-Saved; Holds pointer for large |
|                   | Pointer (`sret`)  | aggregate returns (> 16 bytes)        |
+-------------------+-------------------+---------------------------------------+
| **X9 – X15**      | Scratch Temporaries| Volatile / Caller-Saved               |
+-------------------+-------------------+---------------------------------------+
| **X16 – X17**     | Intra-Procedure   | Volatile / Caller-Saved; Used by PLT  |
|                   | Call (IP0, IP1)   | link stubs and dynamic veneers        |
+-------------------+-------------------+---------------------------------------+
| **X18**           | Platform Register | Reserved for OS; TLS pointer in iOS / |
|                   |                   | Windows; scratch in Linux kernel      |
+-------------------+-------------------+---------------------------------------+
| **X19 – X28**     | Preserved GPRs    | **Callee-Saved**; Must be spilled and |
|                   |                   | restored if modified                  |
+-------------------+-------------------+---------------------------------------+
| **X29**           | Frame Pointer (FP)| **Callee-Saved**; Points to base of   |
|                   |                   | current stack activation record       |
+-------------------+-------------------+---------------------------------------+
| **X30**           | Link Register (LR)| Volatile; Receives return address on  |
|                   |                   | `BL` (Branch with Link) instruction   |
+-------------------+-------------------+---------------------------------------+
| **SP**            | Stack Pointer     | Must remain strictly **16-byte aligned|
|                   |                   | at all times**; hardware fault on mis.|
+-------------------+-------------------+---------------------------------------+
```

---

## 2. Floating-Point and SIMD Registers (`V0`–`V31`)

AArch64 provides thirty-two 128-bit SIMD/FP registers (`V0`–`V31`):
- **`V0`–`V7`**: Passed arguments and return values (single, double, or vector).
- **`V8`–`V15`**: **Callee-Saved**: Only the lower 64 bits (`D8`–`D15`) are preserved across calls! The upper 64 bits are volatile scratch.
- **`V16`–`V31`**: Volatile scratch registers (caller-saved).

### Homogeneous Aggregates (HFA and HVA)
AAPCS64 features a specialized performance rule:
- A struct containing between 1 and 4 identical floating-point values (e.g. `struct Vec3 { float x, y, z; }`) is classified as a **Homogeneous Floating-point Aggregate (HFA)**.
- Instead of being spilled to stack or packed into integer registers, an HFA is passed across consecutive vector registers: `V0.S[0], V1.S[0], V2.S[0]`.
- This enables SIMD math libraries to achieve maximum register pipeline throughput without memory conversions.

---

## 3. The 2026 AAPCS64 Modern Extensions

In the current (2026) release of the ARM Architecture Specification, three advanced hardware features alter the ABI landscape:

### 3.1. Guarded Control Stack (GCS)
- Hardware-enforced shadow stack preventing Return-Oriented Programming (ROP) attacks.
- Function entries push the return address to both the architectural stack (`[SP]`) and the hardware GCS.
- Function epilogues execute `GCSPUSH` / `GCSPOP` and verify that the return addresses match before jumping, trapping stack-smashing attacks.

### 3.2. Pointer Authentication (PAC)
- Function prologues execute `PACIASP` (signing the Link Register `X30` with the Stack Pointer and a secret CPU key).
- Function epilogues execute `AUTIASP` (verifying the signature before returning). If the stack was corrupted, the CPU generates an invalid address and traps.

### 3.3. Scalable Matrix Extension (SME) Streaming Mode
- When entering SME streaming mode (`SMSTART`), vector widths expand dynamically, and the `ZA` matrix accumulator array is activated.
- Calling conventions define whether functions preserve streaming mode (`streaming`, `streaming-compatible`, or non-streaming), with automatic compiler veneers inserted to toggle CPU states if mismatched.
