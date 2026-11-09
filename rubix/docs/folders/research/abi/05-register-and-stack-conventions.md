# Register and Stack Conventions

## 1. Register Classification Invariants

In modern architectures, hardware registers are partitioned into functional classes:

```
+-------------------------------------------------------------------------------+
|                             Physical CPU Registers                            |
+---------------------------------------+---------------------------------------+
|          Caller-Saved (Volatile)      |        Callee-Saved (Preserved)       |
|  - Overwritten without permission     |  - Must be preserved across call      |
|  - Free to use for scratch evaluation |  - Callee must spill and restore      |
+---------------------------------------+---------------------------------------+
|  Argument Registers (RDI, RSI...)    |  Frame Pointer (RBP, X29)              |
|  Return Registers (RAX, X0, a0...)    |  Preserved GPRs (RBX, R12..R15, X19)  |
|  Scratch Temporaries (R10, R11, t0)  |  Link Register (on non-leaf calls)    |
+---------------------------------------+---------------------------------------+
```

### 1.1. Caller-Saved (Volatile) Invariant
A register is **caller-saved** if the callee is permitted to modify its value without preserving it.
- **Rule for the Caller**: If the caller needs the value across a function invocation, the caller MUST spill the register to the stack before the `CALL` instruction and reload it afterward.
- **Rule for the Callee**: The callee can freely treat the register as immediate scratch space.

### 1.2. Callee-Saved (Non-Volatile / Preserved) Invariant
A register is **callee-saved** if its value must remain intact across a function invocation.
- **Rule for the Callee**: If the callee modifies any preserved register, it MUST save its original value in the function prologue (e.g. `push rbx`) and restore it in the function epilogue (e.g. `pop rbx`) prior to returning.
- **Rule for the Caller**: The caller can rely on the register maintaining its value without spilling it before the call.

### 1.3. Why Invariant Violations Cause Catastrophic Corruption
If a function compiled under a convention where register $R$ is *volatile* is called by code assuming $R$ is *callee-saved*:
- The callee overwrites $R$ with scratch data.
- The caller returns and assumes $R$ still contains its vital loop counter or heap pointer.
- The caller dereferences $R$, triggering a crash or writing garbage across arbitrary heap addresses.

---

## 2. Stack Frame Architecture and Layout

### 2.1. Anatomy of a Standard 64-Bit Stack Frame

```
High Memory
  |
  +---------------------------------------------+
  | Caller Frame: Function Locals & Temporaries |
  +---------------------------------------------+
  | Caller Stack Arguments (Arg 7, Arg 8, ...)  |
  +---------------------------------------------+
  | [Microsoft x64 Only: 32-Byte Shadow Space]  |
  +---------------------------------------------+
  | Return Address (pushed by CALL instruction) | <-- RSP at function entry
  +---------------------------------------------+
  | Saved Frame Pointer (pushed RBP / X29)      | <-- RBP points here
  +---------------------------------------------+
  | Callee Preserved Registers (RBX, R12..R15)  |
  +---------------------------------------------+
  | Callee Local Variables & Buffers            |
  +---------------------------------------------+
  | Callee Outgoing Stack Arguments             | <-- RSP after sub rsp, <frame_sz>
  +---------------------------------------------+
  | [System V AMD64 Only: 128-Byte Red Zone]    | (below RSP, not modified by kernel)
  +---------------------------------------------+
Low Memory
```

### 2.2. The 16-Byte Stack Alignment Invariant
Virtually all modern 64-bit ABIs mandate that the stack pointer be aligned to **16 bytes** at specific execution boundaries:
- **System V AMD64**: Immediately before executing a `CALL` instruction, `RSP` must be an integer multiple of 16. Because the `CALL` instruction pushes the 8-byte return address, upon function entry `(RSP + 8)` is a multiple of 16 (or `RSP % 16 == 8`).
- **Function Prologue**: The prologue executes `push rbp` (an 8-byte decrement), restoring `RSP % 16 == 0`.
- **Subsequent Stack Allocation**: The frame size allocated by `sub rsp, <size>` MUST be a multiple of 16 to preserve the 16-byte alignment invariant for downstream calls.

```text
Assembly Prologue Example:
  push rbp               ; RSP decreases by 8 (now 16-byte aligned)
  mov rbp, rsp           ; establish frame pointer
  sub rsp, 32            ; allocate 32 bytes (multiple of 16)
  ...
  mov rsp, rbp           ; restore stack pointer
  pop rbp                ; restore frame pointer
  ret                    ; pops return address
```

---

## 3. The Shadow Space (Home Space) on Windows

The **Microsoft x64 ABI** requires a mechanism completely absent from Unix:
1. Every function call MUST reserve at least **32 bytes (4 words)** of stack space directly above the return address.
2. These 32 bytes correspond to the 4 register arguments (`RCX`, `RDX`, `R8`, `R9`).
3. Even if the called function takes **0 arguments**, the caller must still allocate this 32-byte space!
4. **Purpose**: In debug builds or variadic functions, the callee can execute:
   ```text
   mov [rsp + 8],  rcx   ; spill Arg 1
   mov [rsp + 16], rdx   ; spill Arg 2
   mov [rsp + 24], r8    ; spill Arg 3
   mov [rsp + 32], r9    ; spill Arg 4
   ```
   This forms a contiguous array of arguments on the stack that a `va_list` can traverse.

### The Disaster of Cross-ABI Calls without Shadow Space
If a Unix compiler emits a call to a Windows function without allocating 32 bytes:
- The Windows callee assumes the 32 bytes exist and executes `mov [rsp + 8], rcx`.
- Since no space was allocated, `[rsp + 8]` is the caller's return address or saved frame pointer!
- The caller's return address is obliterated, causing a crash upon `ret`.

---

## 4. The Red Zone on System V AMD64

The **System V AMD64 ABI** specifies a **128-byte Red Zone** below `RSP`:
- The area `[RSP - 128]` to `[RSP - 1]` is guaranteed **NOT** to be modified by signal handlers or interrupts.
- Compilers can use this area for scratch data in leaf functions (functions that call no other functions) without moving `RSP` (`sub rsp, N`).
- **Performance Gain**: Saves two instructions (`sub rsp, N` and `add rsp, N`) on every leaf call.
- **Kernel & Interrupt Invariant**: Operating system kernels (Linux, FreeBSD) MUST disable the Red Zone (`-mno-red-zone`) because kernel interrupt handlers execute on the current thread stack and would corrupt the red zone.

---

## 5. Stack Probes (`__chkstk`)

On operating systems with demand-paged guard stacks (notably Windows):
- The stack grows page by page (4096 bytes).
- At the bottom of the allocated stack is a **guard page** (`PAGE_GUARD`). When touched, the OS page fault handler allocates a new physical page and moves the guard page.
- If a function allocates a large stack frame (e.g., `sub rsp, 16384` without touching intermediate pages), it might skip over the guard page and touch unmapped memory beyond the guard page, causing a fatal `STATUS_ACCESS_VIOLATION`.
- **The Stack Probe Contract**: For stack allocations exceeding one page (4096 bytes), the compiler MUST emit a loop that reads or writes each 4096-byte page boundary sequentially to trigger guard page faults in order.
