# Operating System and Platform Abstraction

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                 Rubix Universal Source Code                   │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ Compile-Time Target Selection
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │             Platform Abstraction Layer (PAL)                  │
       └───────┬───────────────────┬───────────────────┬───────────────┘
               │                   │                   │
               ▼                   ▼                   ▼
          Linux x86-64        Windows x86-64      Darwin Arm64/x86    WASI 0.3
         Direct Syscall          PE/COFF               Mach-O           WASM
        (sys_write, mmap)    (Kernel32/NTDLL)      (libSystem.dylib)  (wasi:cli)
               │                   │                   │                   │
               ▼                   ▼                   ▼                   ▼
         Sovereign ELF        Sovereign EXE        Sovereign Mach-O    WASI Module
```

## 1. Abstract & Architectural Philosophy

How should a language abstract the operating system?

Traditional programming systems adopted one of two extremes:
1. **The Heavyweight C Runtime Abstraction (C, C++, Rust, Go)**: Rely on an external C library (`glibc`, `musl`, `msvcrt.dll`) or bundle a multi-megabyte runtime scheduler into every binary. Cross-compiling requires installing massive cross-toolchain sysroots (GCC/Clang multi-libs, target headers).
2. **The Virtual Machine / Hypervisor Abstraction (Java JVM, CLR, Erlang)**: Abstract the operating system completely behind an artificial bytecode engine, forfeiting low-level control, zero-cost kernel interfaces, and deterministic memory behavior.

Rubix rejects both models and implements **Compile-Time Sovereign Platform Synthesis**:
* **Direct Sovereign Execution**: On Linux, Rubix generates direct `syscall` machine instructions (`0x0F 0x05`), completely bypassing `glibc` and external dynamic linkers.
* **Pure Container Synthesis**: The Rubix compiler directly synthesizes native binary container formats:
  * Linux: **ELF64** ([compiler/packaging/elf.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/elf.bix))
  * Windows: **PE/COFF** ([compiler/packaging/pe_coff.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/pe_coff.bix))
  * macOS: **Mach-O** ([compiler/packaging/macho.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/macho.bix))
  * Web/Edge: **WASI 0.3** ([compiler/packaging/wasm.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/wasm.bix))
* **Zero External Dependencies**: The compiler requires zero GCC, zero Clang, zero LLVM, zero binutils, and zero Python.

---

## 2. Platform System Call Specifications

### 2.1 Linux Direct Syscall Vector
On Linux x86-64, system calls are issued via the `syscall` instruction. Arguments are passed in registers:
* Syscall Number: `rax`
* Arguments: `rdi` (arg1), `rsi` (arg2), `rdx` (arg3), `r10` (arg4), `r8` (arg5), `r9` (arg6)
* Return Value: `rax` (negative values indicate `-errno`)
* Clobbered Registers: `rcx`, `r11`

Core direct syscall implementations in Rubix:
* `sys_read` (`rax = 0`): Read bytes from file descriptor.
* `sys_write` (`rax = 1`): Write bytes to file descriptor.
* `sys_open` (`rax = 2`): Open file with flags and mode.
* `sys_close` (`rax = 3`): Close file descriptor.
* `sys_mmap` (`rax = 9`): Map pages into virtual memory space.
* `sys_munmap` (`rax = 11`): Unmap memory pages.
* `sys_exit` (`rax = 60`): Terminate process execution.

On Linux Arm64 (`svc #0`):
* Syscall Number: `x8`
* Arguments: `x0` through `x5`
* Return Value: `x0`

On Linux RISC-V 64 (`ecall`):
* Syscall Number: `a7`
* Arguments: `a0` through `a5`
* Return Value: `a0`

### 2.2 Windows NT & PE/COFF Container Synthesis
Windows kernels disallow direct static syscall numbers due to frequent undocumented changes between NT kernel builds. 
Rubix targets Windows via:
1. Emitting compliant **PE32+ (PE/COFF)** executable headers with standard DOS stub, PE signature, Optional Header, `.text`, `.rdata`, and `.data` section tables.
2. Generating import directory tables binding directly to fundamental Win32 kernel exports (`kernel32.dll`: `GetStdHandle`, `WriteFile`, `ExitProcess`, `VirtualAlloc`).

### 2.3 macOS Mach-O & Darwin Traps
Darwin disallows direct raw syscalls and requires linking with `libSystem.B.dylib` for API stability.
Rubix synthesizes valid 64-bit Mach-O object and executable containers:
* Magic: `0xFEEDFACF` (`MH_MAGIC_64`).
* Load Commands: `LC_SEGMENT_64`, `LC_MAIN` (entry offset), `LC_LOAD_DYLINKER`, `LC_LOAD_DYLIB`.

---

## 3. The Platform Capability Matrix

In [compiler/common/capabilities.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/capabilities.bix), platforms declare their native supported capabilities:

| Capability Flag | Value | Linux (ELF) | Windows (PE) | macOS (Mach-O) | WASI 0.3 |
|:---|:---|:---:|:---:|:---:|:---:|
| `CAP_PROCESS` | 1 | Yes | Yes | Yes | Limited |
| `CAP_FILE_IO` | 2 | Yes | Yes | Yes | Yes (Scoped) |
| `CAP_MEMORY_MAP` | 4 | Yes (`mmap`) | Yes (`VirtualAlloc`) | Yes (`mmap`) | Yes (`memory.grow`) |
| `CAP_THREADS` | 8 | Yes (`clone3`) | Yes (`CreateThread`) | Yes (`pthread`) | Yes (WASI-threads) |
| `CAP_ATOMICS` | 16 | Yes | Yes | Yes | Yes |
| `CAP_CLOCK` | 32 | Yes | Yes | Yes | Yes |
| `CAP_RANDOM` | 64 | Yes (`getrandom`) | Yes (`BCrypt`) | Yes (`getentropy`) | Yes |
| `CAP_CONSOLE` | 128 | Yes | Yes | Yes | Yes |
| `CAP_DYNAMIC_LOADING` | 512 | Yes (`dlopen`) | Yes (`LoadLibrary`) | Yes (`dlopen`) | No |

---

## 4. Verification & Testing Evidence

The Rubix platform abstraction is continuously verified in the sovereign test suite:
* [tests/test_target_conformance.bix](file:///home/bishwaxyz/translator/rubix/tests/test_target_conformance.bix): Compiles and validates executables across `x86_64-pc-windows-pe`, `x86_64-apple-darwin-macho`, and `wasm32-unknown-wasi`.
* [tests/test_cross_target.bix](file:///home/bishwaxyz/translator/rubix/tests/test_cross_target.bix): Compiles and runs test programs via QEMU user emulation across `aarch64-linux` and `riscv64-linux`.

---

## 5. Summary

By moving platform abstraction from a bloated C runtime into compile-time binary container synthesis, Rubix delivers self-contained, dependency-free native binaries with zero external toolchain requirements.
