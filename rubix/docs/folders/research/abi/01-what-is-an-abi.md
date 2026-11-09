# What is an Application Binary Interface (ABI)?

## 1. Defining the Boundary: API vs. ABI

In computer systems, the boundary between components exists at multiple levels of abstraction:

```
+-------------------------------------------------------------+
|                 Source Code (Human / High-Level)            |
|   fn compute(data: &[u8], flags: u32) -> Result<i64, Error> |
+-------------------------------------------------------------+
                               |
                        [API Boundary]  <-- Abstract syntax, types, naming
                               v
+-------------------------------------------------------------+
|                Compiled Object / Machine Code               |
|   mov rdi, rbx; mov esi, 0x1; call 0x401020                 |
+-------------------------------------------------------------+
                               |
                        [ABI Boundary]  <-- Physical registers, stack, bytes
                               v
+-------------------------------------------------------------+
|                  CPU Execution / Memory Bus                 |
|   RDI=0x7ffe..., RSI=0x1, RIP=0x401020, RSP=0x7ffd...       |
+-------------------------------------------------------------+
```

An **Application Programming Interface (API)** is a compile-time syntactic contract. It defines:
- What types and functions are named in source code.
- What signatures and access modifiers exist in human-readable declarations.
- What operations are syntactically and semantically valid in the programming language.

An **Application Binary Interface (ABI)** is a link-time and runtime physical contract. It defines:
- The exact binary encoding of types in memory (offsets, sizes, alignments, padding, endianness).
- The exact hardware register assignments for passing arguments and returning values.
- The state of the hardware stack pointer (`RSP`, `SP`) before and after a control transfer (`CALL`/`RET`).
- Which registers are volatile (caller-saved) and which must be preserved across invocations (callee-saved).
- The encoding of symbols, dynamic links, relocations, and external imports in binary object containers.
- The metadata required to unwind call frames during exceptions or debugging.

---

## 2. The Comprehensive Dimensions of an ABI

An ABI is not merely "which registers hold the arguments." A complete ABI specification encompasses seven distinct subsystems:

### 2.1. Calling Convention (Procedure Call Standard)
1. **Argument Partitioning**: Dividing arguments between integer registers, floating-point/vector registers, and stack slots.
2. **Hidden Parameters**: Invisible pointers for aggregate return values (`sret`), closure environments, or lexical static links.
3. **Return Value Passing**: Primary register returns, multi-register pairs, or caller-allocated buffer pointers.
4. **Variadic Conventions**: Handling variable argument counts (e.g., AMD64's `AL` register indicating vector argument counts).
5. **Indirect Calls**: Expectations when invoking function pointers or virtual dispatch tables.

### 2.2. Register Allocation Invariants
1. **Argument Registers**: Registers dedicated to passing incoming parameters.
2. **Result Registers**: Registers holding returned values.
3. **Scratch / Volatile Registers**: Registers the callee is permitted to overwrite without saving.
4. **Preserved / Non-Volatile Registers**: Registers the callee must spill to the stack and restore before returning.
5. **Special-Purpose Registers**: Stack pointer, frame/base pointer, thread-local base, link register, platform register.

### 2.3. Stack Frame Mechanics
1. **Stack Direction**: Downward (towards lower addresses in virtually all modern architectures) or upward.
2. **Stack Alignment Invariant**: Mandatory byte alignment at call instruction entry (e.g., 16-byte alignment in System V AMD64 and AAPCS64).
3. **Shadow Space (Home Space)**: Mandatory caller-allocated stack slots for register arguments (e.g., 32 bytes in Microsoft x64).
4. **Red Zone**: Memory below the stack pointer that signal handlers or leaf functions may use without moving the stack pointer (e.g., 128 bytes in System V AMD64).

### 2.4. Data Representation and Memory Layout
1. **Scalar Encodings**: Two's complement integers, IEEE 754 floating point, booleans (0 vs 1 vs non-zero).
2. **Aggregate Layout**: Struct field offsets determined by natural alignment rules (`offset % align == 0`), tail padding to preserve array stride.
3. **Tagged Unions & Enums**: Discriminant size, alignment, and payload union placement.
4. **Pointers & References**: Raw pointers (32-bit vs 64-bit), fat pointers (pointer + length or pointer + vtable), capability descriptors.

### 2.5. Linkage and Binary Formats
1. **Symbol Mangling**: Deterministic encoding of module names, types, and generic parameters into linker-safe ASCII strings.
2. **Relocation Semantics**: Absolute, PC-relative, GOT-relative, or PLT-relative address fixups.
3. **Object File Structure**: Sections (`.text`, `.rodata`, `.data`, `.bss`), headers, and segment mappings in ELF, PE/COFF, Mach-O, or WASM.

### 2.6. System and Execution Contracts
1. **Process Initialization**: Stack state at process entry (`_start`), `argc`, `argv`, `envp`, auxiliary vector (`auxv`).
2. **Thread-Local Storage**: TLS segment initialization, thread pointer register access (`FS` on x86-64, `TP` on RISC-V, `tpidr_el0` on ARM64).
3. **System Call Boundary**: Trap instructions (`syscall`, `svc`, `ecall`), register mappings, kernel clobber rules.

### 2.7. Unwinding, Exceptions, and Security
1. **Frame Unwinding**: Call frame information (CFI) tables, DWARF `.eh_frame`, Windows SEH runtime function entries.
2. **Control Flow Integrity**: Shadow call stacks, branch target identification (BTI / IBT), pointer authentication (PAC).

---

## 3. Why ABI Failures Are Catastrophic

When an API check fails, the compiler emits a diagnostic and halts compilation. The programmer fixes the code, and no broken binary is ever produced.

When an ABI contract fails at runtime:
1. **Register Misclassification**: The caller puts an argument in `RDI`, but the callee expects it in `RCX`. The callee reads garbage from `RCX` and executes with invalid pointers or corrupted values.
2. **Stack Misalignment**: An SSE/AVX instruction (e.g., `movaps`) requires 16-byte alignment. If the stack is offset by 8 bytes due to an ABI mismatch, the instruction triggers a hardware General Protection Fault (`SIGSEGV`).
3. **Shadow Space Absence**: A caller compiled under System V calls a Microsoft x64 callee without reserving 32 bytes of shadow space. The callee spills its argument registers into `[RSP + 8]`, overwriting the caller's return address on the stack. Upon return, the CPU jumps to an attacker-controlled or corrupted address.
4. **Silent Memory Corruption**: If a struct field is offset by 8 bytes in library v1 but 16 bytes in library v2, writes to the field silently overwrite adjacent fields in memory, leading to unpredictable, un-debuggable security exploits.

---

## 4. The Rubix Architectural View

In Rubix, an ABI is treated not as an accidental byproduct of code generation, but as a **formal semantic mapping**:

$$\mathcal{M}_{\text{ABI}}: \text{TypeSignature} \times \text{TargetProfile} \longrightarrow \text{PhysicalAllocation}$$

Where:
- $\text{TypeSignature}$ describes the logical parameters, ownership attributes, and effects.
- $\text{TargetProfile}$ encapsulates the ISA, operating system, and hardware register model.
- $\text{PhysicalAllocation}$ yields the deterministic sequence of registers, stack offsets, alignment padding, and trampoline adapters necessary for zero-cost execution.
