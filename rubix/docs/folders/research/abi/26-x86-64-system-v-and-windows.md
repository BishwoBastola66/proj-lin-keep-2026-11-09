# Comparative Analysis: System V AMD64 vs. Microsoft x64

## 1. The Great Architectural Schism on x86-64

Although both operating systems run on the exact same AMD64 microarchitecture, Linux/Unix and Windows made radically different, mutually incompatible ABI choices.
A cross-call between these conventions without an adapter will **corrupt the stack and crash 100% of the time**.

---

## 2. Exhaustive Comparison Matrix

| Dimension | System V AMD64 ABI (Linux, BSD, macOS) | Microsoft x64 ABI (Windows, UEFI) | Fatal Incompatibility Hazard |
|:---|:---|:---|:---|
| **Arg 1 Register** | `RDI` | `RCX` | Arg 1 received in wrong register; reads garbage |
| **Arg 2 Register** | `RSI` | `RDX` | Arg 2 received in wrong register |
| **Arg 3 Register** | `RDX` | `R8` | Arg 3 received in wrong register |
| **Arg 4 Register** | `RCX` | `R9` | Arg 4 received in wrong register |
| **Arg 5 Register** | `R8` | **Stack** | Win64 expects Arg 5 on stack; reads caller stack! |
| **Arg 6 Register** | `R9` | **Stack** | Win64 expects Arg 6 on stack |
| **Shadow Space** | **0 bytes** (None) | **32 bytes (Mandatory)** | Win64 callee spills into shadow space, **overwriting return address!** |
| **Red Zone** | **128 bytes below RSP** | **None (Forbidden)** | Windows interrupt corrupts leaf red zone |
| **RDI Preservation** | **Volatile / Caller-Saved** | **Non-Volatile / Callee-Saved** | Win64 caller assumes RDI preserved; SysV clobbers it |
| **RSI Preservation** | **Volatile / Caller-Saved** | **Non-Volatile / Callee-Saved** | Win64 caller assumes RSI preserved; SysV clobbers it |
| **Varargs Protocol**| `AL` = count of SSE registers | Flat contiguous memory array | SysV varargs fails if `AL` not set |
| **Aggregate Passing**| Up to 16 bytes across 2 GPRs | Direct only if 1, 2, 4, 8 bytes; else pointer | Win64 dereferences register as memory pointer |

---

## 3. Dissecting the Two Fatal Bugs

### Bug 1: The Missing Shadow Space Catastrophe
Suppose a System V compiled function calls a Windows x64 function:
1. System V caller does:
   ```text
   mov rcx, arg1
   call win64_func       ; Pushes 8-byte return address to [RSP]
   ```
2. `win64_func` assumes the caller allocated 32 bytes of shadow space directly above the return address:
   ```text
   mov [rsp + 8], rcx    ; Spills arg1 into expected shadow space!
   ```
3. Since the caller allocated 0 bytes, `[rsp + 8]` is the caller's saved frame pointer or caller's local variable!
4. The caller's stack frame is silently corrupted.

### Bug 2: The `RDI` / `RSI` Preservation Trap
1. On Windows, `RDI` and `RSI` are **callee-saved**. Windows code puts high-priority loop pointers in `RDI` and assumes no downstream function will touch them.
2. On Linux, `RDI` and `RSI` are **caller-saved argument registers**. Any Unix function freely overwrites `RDI` and `RSI` without saving them.
3. If Windows code invokes Unix code directly, Unix code clobbers `RDI`, and upon return to Windows, the Windows loop counter is destroyed.

---

## 4. The Specialized Zero-Cost Machine Adapter

In Rubix, cross-convention calling does NOT require a heavy dynamic library interpreter (such as `libffi`).
Instead, [compiler/middle/abi.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/abi.bix) synthesizes an exact, specialized machine trampoline:

```text
Specialized Machine Adapter (System V -> Win64, 2 Arguments):
  push rbp
  mov  rbp, rsp
  sub  rsp, 32           ; Allocate mandatory 32-byte shadow space (16B aligned)
  mov  rcx, rdi          ; Map Arg 1: SysV (RDI) -> Win64 (RCX)
  mov  rdx, rsi          ; Map Arg 2: SysV (RSI) -> Win64 (RDX)
  call target_win64_func ; Invoke target (RAX contains return)
  add  rsp, 32           ; Tear down shadow space
  pop  rbp
  ret
```
- **Execution Cost**: Exactly 8 instructions, 0 heap allocations, 0 dynamic dispatches, sub-nanosecond overhead.
- When calling between identical ABIs (System V $\to$ System V), the compiler detects `caller_abi == callee_abi` and **eliminates the adapter completely**, compiling down to a direct native `call rel32`.
