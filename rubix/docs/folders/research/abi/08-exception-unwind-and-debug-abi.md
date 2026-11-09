# Exception, Unwind, and Debug ABI

## 1. The High Cost of Exception Handling

In early computing and early C++, exception handling was implemented via **dynamic registration**:
- Entering a `try` block executed `setjmp` or linked an exception record into a thread-local linked list on the stack.
- Every function entry and exit paid a runtime cost in instructions and memory writes, even if no exception was ever thrown.

To eliminate this happy-path performance overhead, modern systems adopted **Zero-Cost Exception Handling** (table-driven unwinding).

```
Happy Path (No Exception):
  - Zero instructions executed for try/catch setup
  - Normal direct calls and returns
  - Performance: 100% native speed

Unwind Path (Exception Thrown):
  - libunwind / OS walks the stack using offline metadata tables
  - Inspects .eh_frame / .pdata for each instruction pointer (RIP)
  - Identifies landing pads and cleans up stack frames
  - Performance: 1,000x - 10,000x slower than normal return
```

---

## 2. DWARF Call Frame Information (CFI) & `.eh_frame`

On Unix/ELF platforms (Itanium C++ ABI standard), unwinding is driven by the `.eh_frame` section.
`.eh_frame` contains a virtual machine bytecode that describes how to reconstruct the caller's registers from any arbitrary instruction address:

### 2.1. Common Information Entry (CIE)
Defines shared parameters across a group of functions:
- Version and augmentation string
- Code alignment factor and data alignment factor
- Return address register index
- Initial register preservation rules

### 2.2. Frame Description Entry (FDE)
Describes a specific function's address range `[start, start + length]`:
- Contains CFI bytecode instructions:
  - `DW_CFA_def_cfa_offset`: Defines the Canonical Frame Address (CFA) offset relative to `RSP`.
  - `DW_CFA_offset`: Specifies where a preserved register was spilled relative to the CFA.
  - `DW_CFA_remember_state` / `DW_CFA_restore_state`: For handling non-trivial stack pointer movements in complex loops.

### 2.3. The Two-Phase Personality Routine
When an exception is thrown (`_Unwind_RaiseException`):
1. **Phase 1 (Search Phase)**: The unwinder walks backwards up the call stack, querying each function's **Personality Routine** (e.g. `__gxx_personality_v0`) to determine if a matching `catch` block exists.
2. **Phase 2 (Cleanup Phase)**: The unwinder walks the stack a second time, executing destructors (cleanup landing pads) in each frame until it reaches the handler frame, then transfers control to the handler's landing pad.

---

## 3. Windows Structured Exception Handling (SEH)

On Windows x64, SEH is an operating system kernel primitive rather than a language runtime library:
1. Every executable and DLL contains a `.pdata` section containing an array of `RUNTIME_FUNCTION` entries.
2. Each `RUNTIME_FUNCTION` maps a function's starting and ending Relative Virtual Address (RVA) to an **Unwind Info** structure in `.xdata`.
3. The Unwind Info encodes prologue operations using an array of 2-byte unwind codes:
   - `UWOP_PUSH_NONVOL`: Non-volatile register pushed to stack.
   - `UWOP_ALLOC_LARGE` / `UWOP_ALLOC_SMALL`: Stack pointer decremented.
   - `UWOP_SET_FPREG`: Frame pointer established.
4. **Hardware Enforcement**: In Windows x64, *any* function that allocates stack space or calls another function MUST have valid unwind info in `.pdata`. If an unhandled exception or debugger traps in a function lacking unwind info, Windows terminates the process immediately.

---

## 4. Debug ABI: DWARF vs. CodeView / PDB

- **DWARF (Unix)**: Rich, modular debug format embedded directly into object sections (`.debug_info`, `.debug_line`, `.debug_loc`, `.debug_ranges`).
- **CodeView / PDB (Windows)**: Proprietary, indexed debug format stored in external `.pdb` files, referenced by an `IMAGE_DEBUG_DIRECTORY` in the PE header.

---

## 5. The Rubix Architectural Decision: Algebraic Effects Over Unwinding

Why does Rubix deliberately avoid heavy C++-style stack unwinding tables?
1. **Binary Size Bloat**: In C++ and Rust, `.eh_frame` and unwind tables regularly consume **20% to 35% of the total binary size**.
2. **Compiler & Linker Complexity**: Maintaining exact CFI bytecode across optimizations, inlining, and tail calls is a major source of compiler bugs.
3. **The Rubix Model**: Rubix uses explicit **Result types** (`Result(T, E)`) and **Algebraic Effects**:
   - Error handling is lowered to ordinary branch instructions and register returns.
   - Zero binary bloat: No `.eh_frame` tables required for normal control flow.
   - Pure native stack hygiene: Affine ownership scopes ensure deterministic cleanup upon return without asynchronous personality routines.
