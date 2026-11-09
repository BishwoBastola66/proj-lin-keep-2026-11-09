# Operating System User/Kernel ABI

## 1. The Kernel Boundary as an ABI Contract

The boundary between user space and kernel space is the most rigid binary interface in computing.
While user-space libraries can occasionally be updated or recompiled together, an operating system kernel must run binaries that were compiled decades earlier.

---

## 2. System Call Conventions Across Operating Systems

### 2.1. Linux x86-64 Kernel Syscall ABI
Linux on x86-64 uses the dedicated hardware instruction `syscall`:
- **Syscall Number**: Passed in register `RAX`.
- **Arguments 1–6**: Passed in `RDI`, `RSI`, `RDX`, `R10`, `R8`, `R9`.
  - *Critical Difference from User-Space ABI*: Argument 4 is passed in **`R10`**, NOT `RCX`.
  - *Hardware Reason*: The Intel/AMD `syscall` instruction automatically saves the user-space `RIP` into `RCX` and `RFLAGS` into `R11`. Therefore, `RCX` and `R11` are destroyed by the hardware during the transition!
- **Return Value**: Passed in `RAX`. Values in the range `[-4095, -1]` represent negative error codes (`-errno`). Non-negative values indicate success.
- **Preserved Registers**: The kernel preserves all user registers except `RAX`, `RCX`, and `R11`.

```
Linux x86-64 Syscall Instruction Sequence:
  mov rax, 1        ; __NR_write
  mov rdi, 1        ; fd = stdout
  mov rsi, buf_ptr  ; buffer
  mov rdx, 14       ; count
  syscall           ; hardware trap into kernel (clobbers rcx, r11)
  cmp rax, 0
  jl  handle_error  ; negative return indicates -errno
```

### 2.2. Linux AArch64 (ARM64) Syscall ABI
- **Instruction**: `svc #0` (Supervisor Call).
- **Syscall Number**: Passed in register **`X8`**.
- **Arguments 1–6**: Passed in `X0`–`X5`.
- **Return Value**: Passed in `X0` (negative values `[-4095, -1]` indicate `-errno`).

### 2.3. Linux RISC-V 64 Syscall ABI
- **Instruction**: `ecall` (Environment Call).
- **Syscall Number**: Passed in register **`a7`** (x17).
- **Arguments 1–6**: Passed in `a0`–`a5` (x10–x15).
- **Return Value**: Passed in `a0` (negative values indicate `-errno`).

### 2.4. Apple macOS / Darwin Kernel ABI
- **Instruction**: `syscall`.
- **Syscall Class Encoding**: macOS encodes system call classes into the upper bits of `RAX`:
  - `0x2000000` = BSD POSIX syscalls (e.g. `exit` is `0x2000001`, `write` is `0x2000004`).
  - `0x1000000` = Mach IPC syscalls.
- **Error Flag**: Unlike Linux, Darwin indicates errors using the CPU **Carry Flag (CF)**. If `CF = 1`, `RAX` contains the positive `errno` code.

### 2.5. Microsoft Windows: The Unstable Syscall Trap
Microsoft explicitly **forbids** direct system calls in user applications:
- The numeric opcode identifiers for Windows syscalls (`NtCreateFile`, `NtAllocateVirtualMemory`) change between almost every major Windows build and service pack.
- Programs that issue direct `syscall` instructions on Windows break across OS updates.
- **Windows User Contract**: All software must link against `ntdll.dll` or `kernel32.dll` and invoke exported library functions using the standard Microsoft x64 calling convention. The OS DLL itself contains the dynamic `syscall` stubs.

---

## 3. The Sovereign Rubix Kernel Strategy

Rubix adheres strictly to native platform truth:
1. **On Linux**: Rubix generates direct sovereign `syscall` instructions ([compiler/main.bix](file:///home/bishwaxyz/translator/rubix/compiler/main.bix)), eliminating glibc, musl, and external C runtime startup dependencies entirely.
2. **On Windows & macOS**: Rubix packaging formats emit import tables for platform dynamic libraries (`kernel32.dll`, `libSystem.B.dylib`), preserving OS vendor contracts without breakage.
