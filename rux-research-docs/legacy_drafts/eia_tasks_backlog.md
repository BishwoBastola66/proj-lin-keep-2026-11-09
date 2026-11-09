# EIA Engineering Backlog: Unimplemented & Partial Features

**Document Identifier**: `DOC-EIA-TASKS-001`  
**Parent Specification**: [`eiapaper.md`](file:///home/bishwaxyz/ru/eiapaper.md) & [`docs/eia.md`](file:///home/bishwaxyz/ru/docs/eia.md)  
**Status**: Official Engineering Task Registry  
**Purpose**: Catalog of architectural claims from the Eternal Interface Architecture (EIA) that are either **NOT IMPLEMENTED** or **PARTIALLY IMPLEMENTED** in the pure sovereign codebase (`rux/`), establishing our development roadmap.

---

## Task Summary & Implementation Status Matrix

| Task ID | Component / Feature Description | Status | Current Code Reference | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **EIA-TASK-01** | Full Sovereign ARM64 Machine Codegen in Pure `.rx` | **IMPLEMENTED (Pure `.rx`)** | [`rux/silicon.rx:161-460`](file:///home/bishwaxyz/ru/rux/silicon.rx#L161-L460) | **P0 (Critical)** |
| **EIA-TASK-02** | Full Sovereign RISC-V 64 Machine Codegen in Pure `.rx` | **IMPLEMENTED (Pure `.rx`)** | [`rux/silicon.rx:461-750`](file:///home/bishwaxyz/ru/rux/silicon.rx#L461-L750) | **P0 (Critical)** |
| **EIA-TASK-03** | Standalone Direct PE32+ (Windows CUI) Binary Vessel | **IMPLEMENTED (Pure `.rx`)** | [`rux/vessel.rx:738-964`](file:///home/bishwaxyz/ru/rux/vessel.rx#L738-L964) | **P1 (High)** |
| **EIA-TASK-04** | Standalone Direct Mach-O 64 (macOS) Binary Vessel | **IMPLEMENTED (Pure `.rx`)** | [`rux/vessel.rx:965-1143`](file:///home/bishwaxyz/ru/rux/vessel.rx#L965-L1143) | **P1 (High)** |
| **EIA-TASK-05** | Native UEFI PE32+ Firmware Application Vessel in `.rx` | **IMPLEMENTED (Pure `.rx`)** | [`rux/vessel.rx:738-964`](file:///home/bishwaxyz/ru/rux/vessel.rx#L738-L964) | **P1 (High)** |
| **EIA-TASK-06** | Bare-Metal Multiboot 1 & OpenSBI Firmware Wrappers | **IMPLEMENTED (Pure `.rx`)** | [`rux/silicon.rx:1120-1375`](file:///home/bishwaxyz/ru/rux/silicon.rx#L1120-L1375) | **P2 (Medium)** |
| **EIA-TASK-07** | Asynchronous Capability Ring Queues (ACRQ / USES) | **IMPLEMENTED (Pure `.rx`)** | [`rux/vessel.rx:1144-1210`](file:///home/bishwaxyz/ru/rux/vessel.rx#L1144-L1210) | **P2 (Medium)** |

---

## Detailed Task Specifications

### EIA-TASK-01: Full Sovereign ARM64 Machine Codegen in Pure `.rx`

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/silicon.rx:161-460`](file:///home/bishwaxyz/ru/rux/silicon.rx#L161-L460)
- **Implementation Summary**:
  - Implemented `arm64_emit_mov_imm64(cg, reg, val)` synthesizing arbitrary 64-bit constants across 4 16-bit halfwords using `MOVZ` (`0xD2800000`) and successive `MOVK` instructions (`0xF2A00000`, `0xF2C00000`, `0xF2E00000`).
  - Implemented `compile_expr_arm64(cg, node)`:
    - Number literals: full immediate generation into `X0`.
    - Local variable reads: stack frame offsets loaded via `LDR X0, [X29, #offset]`.
    - String literals: string address loaded into `X0` and length into `X1`.
    - Function calls: AAPCS64 parameter marshalling into `X0..X5`, emitting `BL <rel26>`.
    - Syscalls: standard Linux AArch64 syscall invocation via `SVC #0` with `X8` holding syscall id, `X0..X5` parameters, and return in `X0`.
    - Binary operations: `ADD` (`0x8B010000`), `SUB` (`0xCB010000`), `MUL` (`0x9B017C00`), `SDIV` (`0x9AC10C00`), `AND` (`0x8A010000`), `ORR` (`0xAA010000`), `EOR` (`0xCA010000`), and comparisons via `SUBS` + `CSET`.
  - Implemented `compile_stmt_arm64(cg, node)` and `compile_fn_arm64(cg, node)`:
    - Stack frame setup: `STP X29, X30, [SP, #-16]!` (`0xA9BF7BFD`), `MOV X29, SP` (`0x910003FD`), local variable allocation on stack.
    - Epilogue: `LDP X29, X30, [SP], #16` (`0xA8C17BFD`), `RET` (`0xD65F03C0`).
  - Multi-target entry stub in `emit_start_stub()`: Target 1 (ARM64 Linux) invokes `main()` and passes return value to `SYS_exit` (`93`).

---

### EIA-TASK-02: Full Sovereign RISC-V 64 Machine Codegen in Pure `.rx`

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/silicon.rx:461-750`](file:///home/bishwaxyz/ru/rux/silicon.rx#L461-L750)
- **Implementation Summary**:
  - Implemented `riscv_emit_mov_imm(cg, reg, val)` emitting `LUI` (`0x37`) and `ADDIW` / `ADDI` sequence for immediate loading.
  - Implemented `compile_expr_riscv(cg, node)`:
    - Number literals: synthesized into `A0` (`x10`).
    - Local variable reads: `LD a0, offset(s0)`.
    - String literals: pointer loaded into `A0` and length into `A1`.
    - Function calls: parameters in `A0..A5`, emitting `JAL ra, <imm20>`.
    - Syscalls: Linux RV64 syscall dispatch via `ECALL` (`0x00000073`) with `A7` holding syscall number.
    - Binary operations: RV64I ALU instructions: `ADD` (`0x00B50533`), `SUB` (`0x40B50533`), `MUL` (`0x02B50533`), `DIV` (`0x02B54533`), `AND`, `OR`, `XOR`, `SLT`, `SLL`, `SRL`.
  - Implemented `compile_stmt_riscv(cg, node)` and `compile_fn_riscv(cg, node)`:
    - Stack frame: `ADDI sp, sp, -32`, `SD ra, 24(sp)`, `SD s0, 16(sp)`, `ADDI s0, sp, 32`.
    - Epilogue: `LD s0, 16(sp)`, `LD ra, 24(sp)`, `ADDI sp, sp, 32`, `JALR zero, 0(ra)`.
  - Multi-target entry stub in `emit_start_stub()`: Target 2 (RISC-V 64 Linux) invokes `main()` and exits via `SYS_exit` (`93`).

---

### EIA-TASK-03: Standalone Direct PE32+ (Windows CUI) Binary Vessel

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/vessel.rx:738-964`](file:///home/bishwaxyz/ru/rux/vessel.rx#L738-L964)
- **Implementation Summary**:
  - Authored standalone `write_pe32_binary(cg: *mut CodeGen, out_path: *u8, is_uefi: u32) -> i64` in pure `.rx`.
  - Emits valid MS-DOS stub (`0x5A4D`, `e_lfanew = 0x80`).
  - Emits PE Signature (`0x00004550` - `'PE\0\0'`).
  - Emits COFF Header: `Machine = 0x8664` (IMAGE_FILE_MACHINE_AMD64), `NumberOfSections = 2` (`.text` and `.eia`).
  - Emits Optional Header PE32+ (`0x020B`):
    - `ImageBase = 0x140000000` (or `0x400000` for UEFI).
    - `SectionAlignment = 0x1000`, `FileAlignment = 0x200`.
    - `Subsystem = 3` (`IMAGE_SUBSYSTEM_WINDOWS_CUI`) when `is_uefi == 0`.
    - `SizeOfImage`, `SizeOfHeaders`, `AddressOfEntryPoint` calculated and aligned.
  - Emits Section Table for `.text` and `.eia` (containing Universal Hologram ABI metadata).
  - CLI flag `--format=pe` and `--pe` added to [`rux/driver.rx`](file:///home/bishwaxyz/ru/rux/driver.rx).

---

### EIA-TASK-04: Standalone Direct Mach-O 64 (macOS) Binary Vessel

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/vessel.rx:965-1143`](file:///home/bishwaxyz/ru/rux/vessel.rx#L965-L1143)
- **Implementation Summary**:
  - Authored standalone `write_macho_binary(cg: *mut CodeGen, out_path: *u8) -> i64` in pure `.rx`.
  - Emits `mach_header_64` (`magic = 0xFEEDFACF`, `cputype = 0x01000007` [CPU_TYPE_X86_64], `filetype = 2` [MH_EXECUTE]).
  - Emits `LC_SEGMENT_64` for `__PAGEZERO` (size 4 GB, `0x100000000`, zero file size).
  - Emits `LC_SEGMENT_64` for `__TEXT` (vmaddr `0x100000000`, containing `__text` and `__eia_hologram` sections).
  - Emits `LC_MAIN` (`0x80000028`) load command configuring the dynamic entrypoint offset.
  - CLI flag `--format=macho` and `--macho` added to [`rux/driver.rx`](file:///home/bishwaxyz/ru/rux/driver.rx).

---

### EIA-TASK-05: Native UEFI PE32+ Firmware Application Vessel in `.rx`

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/vessel.rx:738-964`](file:///home/bishwaxyz/ru/rux/vessel.rx#L738-L964)
- **Implementation Summary**:
  - Integrated into `write_pe32_binary(cg, out_path, is_uefi=1)`.
  - Sets PE Optional Header `Subsystem = 10` (`IMAGE_SUBSYSTEM_EFI_APPLICATION`).
  - Configures Win64 MS_ABI entrypoint stub in `emit_start_stub()` (Target 4), taking `(ImageHandle: *void, SystemTable: *EFI_SYSTEM_TABLE)`, calling `ConOut->OutputString()` directly via table pointer offsets, and returning `EFI_SUCCESS` (`0`).
  - Serializes the Universal Hologram into dedicated `.eia` section inside the `.efi` image.
  - CLI flags `--target=uefi`, `--format=uefi`, and `--uefi` added to [`rux/driver.rx`](file:///home/bishwaxyz/ru/rux/driver.rx).

---

### EIA-TASK-06: Bare-Metal Multiboot 1 & OpenSBI Firmware Wrappers

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/silicon.rx:1120-1375`](file:///home/bishwaxyz/ru/rux/silicon.rx#L1120-L1375) & [`rux/vessel.rx:420-737`](file:///home/bishwaxyz/ru/rux/vessel.rx#L420-L737)
- **Implementation Summary**:
  - **x86-64 Multiboot 1** (Target 3):
    - Emits 12-byte header: `magic = 0x1BADB002`, `flags = 0x00000003`, `checksum = 0xE4524FFB`.
    - Protected/Long-mode trampoline configuring GDT, CR0, CR4, and paging registers.
    - COM1 UART (`0x3F8`) and VGA text buffer (`0xB8000`) initialization and string emitter.
  - **ARM64 Bare-Metal / PSCI** (Target 8):
    - Generates 64-byte Linux ARM64 boot header (`ARM\x64` magic) jumping to PL011 UART MMIO (`0x09000000`) driver and PSCI powerdown stub.
    - Emits both ELF and raw `.bin` image for firmware flashes.
  - **RISC-V 64 OpenSBI Bare-Metal** (Target 9):
    - Generates OpenSBI boot header jumping to NS16550A UART MMIO (`0x10000000`) transmitter.
  - CLI flags `--target=baremetal`, `--target=multiboot`, `--target=opensbi`, `--target=arm64-baremetal` added to [`rux/driver.rx`](file:///home/bishwaxyz/ru/rux/driver.rx).

---

### EIA-TASK-07: Asynchronous Capability Ring Queues (ACRQ / USES)

- **Status**: **IMPLEMENTED (Full Pure `.rx`)**
- **Affected File**: [`rux/vessel.rx:1144-1210`](file:///home/bishwaxyz/ru/rux/vessel.rx#L1144-L1210) & [`rux/hologram.rx:55-82`](file:///home/bishwaxyz/ru/rux/hologram.rx#L55-L82)
- **Implementation Summary**:
  - Implemented 64-byte `ACRQ_SubmissionEntry`: opcode, capability flags, ticket ID, buffer virtual address, byte length, completion virtual address, AVX-512 non-temporal store flag.
  - Implemented 32-byte `ACRQ_CompletionEntry`: ticket ID, status code, transferred bytes, result hash.
  - Implemented `ACRQ_Ring` structure with submission queue ring (`sq_entries`), completion queue ring (`cq_entries`), tail/head pointers, and bitmasks.
  - Implemented `acrq_init_ring(ring, capacity)` using anonymous memory pages (`mmap_alloc`).
  - Implemented `acrq_submit_entry(ring, entry)` performing zero-syscall user-space ring enqueueing.
  - Implemented `acrq_poll_completion(ring, out_cqe)` polling completion ring queue without context switches.
