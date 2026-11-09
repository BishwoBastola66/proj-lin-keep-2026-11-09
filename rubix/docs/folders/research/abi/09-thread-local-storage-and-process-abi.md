# Thread-Local Storage (TLS) and Process ABI

## 1. Process Startup ABI: The Initial Stack State

When the operating system kernel executes a program (via `execve` on Linux), it does not call `main()`. Instead, it sets up an initial stack layout and branches directly to the program's entry point (`_start` in the ELF header):

```
Initial Stack Layout at Process Entry (_start):
High Memory
  +-------------------------------------------------------+
  | Environment Strings ("PATH=/bin", "USER=root", ...)   |
  +-------------------------------------------------------+
  | Argument Strings ("./program", "arg1", "arg2", ...)   |
  +-------------------------------------------------------+
  | Auxiliary Vector: AT_NULL (0, 0)                      | <-- End of auxv
  | Auxiliary Vector Entries:                             |
  |   AT_ENTRY   (entry point address)                    |
  |   AT_PHDR    (program header address)                 |
  |   AT_PHNUM   (number of program headers)              |
  |   AT_PAGESZ  (page size, e.g., 4096)                  |
  |   AT_RANDOM  (16 random bytes for stack canary)       |
  +-------------------------------------------------------+
  | NULL pointer terminator (0x0)                         |
  +-------------------------------------------------------+
  | envp[M] ... envp[0] pointers                          | <-- Pointers to env strings
  +-------------------------------------------------------+
  | NULL pointer terminator (0x0)                         |
  +-------------------------------------------------------+
  | argv[N-1] ... argv[0] pointers                        | <-- Pointers to arg strings
  +-------------------------------------------------------+
  | argc (64-bit integer argument count)                  | <-- RSP points directly here
  +-------------------------------------------------------+
Low Memory
```

In pure sovereign Rubix binaries, [compiler/packaging/elf.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/elf.bix) emits code that parses `argc`, `argv`, and `envp` directly from `RSP` without linking `crt0.o` or libc startup boilerplate.

---

## 2. Thread-Local Storage (TLS) Models

Thread-Local Storage allows global and static variables to have a distinct, independent copy for each thread in the process.

To access thread-local data, the processor uses a dedicated hardware base register:
- **x86-64**: The `FS` segment register points to the Thread Control Block (TCB). The instruction `mov rax, fs:[offset]` reads from TLS.
- **AArch64**: Register `tpidr_el0` (Thread Pointer ID Register, EL0) holds the TCB pointer.
- **RISC-V**: General-purpose register `tp` (x4) holds the thread pointer.

There are four distinct TLS access models defined in the ELF specification:

```
+-----------------------------------------------------------------------------------+
|                                 ELF TLS Access Models                             |
+-----------------------------+-------------------------------+---------------------+
| Model                       | Code Generation Mechanism     | Primary Usage       |
+-----------------------------+-------------------------------+---------------------+
| **Local Exec (LE)**         | Direct offset from TCB:       | Executable only,    |
|                             | `mov rax, fs:[-offset]`       | static variables    |
+-----------------------------+-------------------------------+---------------------+
| **Initial Exec (IE)**       | Load offset from GOT, then    | Non-dlopened shared |
|                             | access via TCB:               | libraries loaded at |
|                             | `mov rax, [rip+offset@gottpoff]` startup            |
+-----------------------------+-------------------------------+---------------------+
| **General Dynamic (GD)**    | Function call to loader:      | Dynamically loaded  |
|                             | `call __tls_get_addr`         | plugins (dlopen)    |
+-----------------------------+-------------------------------+---------------------+
| **Local Dynamic (LD)**      | Call `__tls_get_addr` once    | Multiple TLS vars   |
|                             | for module base, then offsets | in same DSO         |
+-----------------------------+-------------------------------+---------------------+
```

### The Performance Hierarchy of TLS
- **Local Exec**: 1 instruction, 0 memory accesses (pure register offset). Blazing fast.
- **General Dynamic**: Requires saving caller-saved registers, executing a function call to `__tls_get_addr`, acquiring loader mutexes, and walking internal module vectors. Extremely slow in hot loops.

---

## 3. Rubix Thread Architecture: CSP Over Mutable TLS

Why does Rubix emphasize CSP channels ([std/thread.bix](file:///home/bishwaxyz/translator/rubix/std/thread.bix)) over thread-local mutable globals?
1. **Concurrency Hazards**: Mutable thread-local variables frequently lead to hidden state leaks when thread pools reuse workers.
2. **Dynamic Loader Coupling**: Dynamic TLS (`__tls_get_addr`) requires tight coupling with a platform dynamic linker.
3. **The Rubix Approach**: Rubix promotes explicit thread-isolated heaps and message passing over lock-free FIFO channels. Thread state is encapsulated within lexical tasks and affine resources, eliminating TLS overhead and ensuring thread safety by construction.
