# The History of ABIs: From Machine Sequences to Modern Systems

## 1. The Pre-ABI Era: Raw Machine Sequences (1940s–1950s)

Before standard ABIs existed, there was no concept of a "procedure call standard." Computers had minimal hardware support for subroutines:

### 1.1. The Wheeler Jump (EDSAC, 1949)
David Wheeler invented the closed subroutine calling mechanism on the EDSAC. Because the hardware lacked a call instruction or hardware stack, the calling program modified the subroutine's terminal jump instruction before branching into it:

```text
Calling Sequence:
  A 42 F        ; Add current program counter into accumulator
  T 105 F       ; Store accumulator into subroutine exit address (self-modifying code)
  E 100 F       ; Jump to subroutine entry at 100
```

There were no registers reserved for arguments. Parameters were placed in fixed memory words immediately following the call instruction, and the subroutine read them by computing offsets from its own return address.

### 1.2. Hardware Subroutine Instructions (IBM 704, 1954)
The IBM 704 introduced the `TSX` (Transfer and Set Index) instruction, which stored the negated return address into an index register:
```text
TSX 4, SUBR     ; Jump to SUBR, place return address into Index Register 4
TRA 1, 4        ; Return by transferring to address (1 + Index Register 4)
```
This was the first time a specific hardware register was standardized for procedure linkage across programs.

---

## 2. High-Level Language Conventions (1950s–1970s)

### 2.1. FORTRAN I (1957): Static Allocation
Early FORTRAN did not support recursion. Every subroutine had statically allocated memory for its parameters and local variables. Calling a subroutine meant copying parameters into fixed global memory addresses:
- **Pros**: Blazing fast on memory-constrained machines; no stack manipulation overhead.
- **Cons**: Zero recursion; re-entrancy was impossible; interrupts could corrupt routine state.

### 2.2. ALGOL 60: Activation Records and Lexical Displays
ALGOL 60 introduced recursion, block structure, and lexical scoping. This necessitated:
- **Dynamic Call Stacks**: Each invocation created an activation record (stack frame).
- **The Display Vector / Static Chains**: Pointers maintained on the stack or in dedicated registers to access enclosing lexical scopes.
- **Call-by-Name (Jensen's Device)**: Passing thunks (implicit zero-argument subroutines) for arguments, requiring specialized calling sequences to evaluate parameters on demand.

### 2.3. Pascal (1970): Callee Cleans the Stack
Niklaus Wirth's Pascal standardized a clean, compact stack convention:
- Arguments pushed from left to right onto the stack.
- **Callee Pop**: The callee used `RET n` (or equivalent) to remove arguments from the stack upon returning.
- **Benefit**: Reduced code size because stack adjustment instructions were emitted once in the callee instead of at every call site.
- **Limitation**: Variadic functions (like `printf`) were fundamentally impossible because the callee could not know at compile time how many bytes were pushed.

---

## 3. The Unix and C Revolution (1970s–1980s)

### 3.1. The C `cdecl` Convention
Ken Thompson and Dennis Ritchie designed C with variadic functions (`printf`) as a first-class requirement. This forced:
- **Right-to-Left Argument Pushing**: The first argument was always pushed last, ensuring it was located at a fixed stack offset relative to the stack frame pointer (`EBP + 8`), regardless of how many additional arguments followed.
- **Caller Cleans the Stack**: Because only the caller knew how many arguments it pushed, the caller was responsible for adding `N` to the stack pointer after the `CALL` instruction returned (`add esp, 16`).

### 3.2. Early Object File Formats: `a.out` to `COFF`
- **`a.out` (Assembler Output)**: A simple header with text, data, and BSS sizes, followed by raw segment bytes and a flat symbol table. It had no support for dynamic linking, shared libraries, or symbol versioning.
- **COFF (Common Object File Format)**: AT&T Unix System V Release 3 introduced COFF in the early 1980s, providing typed sections, symbol tables, and auxiliary records. It served as the direct ancestor to Microsoft PE.

---

## 4. The Shared Library and Dynamic Linking Crisis (1980s–1990s)

As software systems grew, duplicating library code across every binary on disk became intolerable:

### 4.1. SunOS and SVR4: ELF and the Global Offset Table (GOT)
Sun Microsystems and Unix System Laboratories developed **ELF (Executable and Linkable Format)** for System V Release 4 (1990):
- **Position-Independent Code (PIC)**: Code that executes identically regardless of its virtual memory address.
- **Global Offset Table (GOT)**: A writable table of absolute addresses located in data memory. Code accesses globals via PC-relative offsets to the GOT.
- **Procedure Linkage Table (PLT)**: Small stubs in `.text` that permit lazy symbol binding on first invocation.

### 4.2. Name Mangling and the C++ ABI Wars (1990s)
C++ introduced function overloading, templates, namespaces, and virtual methods. The linker only understood flat ASCII symbols. Each compiler vendor invented their own proprietary mangling algorithm:
- Microsoft: `?compute@@YAHPEAUData@@H@Z`
- GCC 2.95: `compute__FP4Datai`
- Metrowerks, Borland, Watcom: completely incompatible.
This made it impossible to link a C++ library built with GCC into an application built with Clang or another compiler.

### 4.3. The Itanium C++ ABI Standard (2001)
To resolve this fragmentation for Intel's IA-64 (Itanium) processor, an industry consortium (HP, Intel, IBM, SGI, Red Hat) created the **Itanium C++ ABI**. It standardized:
- Deterministic name mangling (`_Z7computep4Datai`)
- Vtable memory layouts and offset-to-top fields
- RTTI structure definitions
- DWARF-based zero-cost exception handling tables (`.eh_frame`)
Although IA-64 failed commercially, the Itanium C++ ABI was adopted by GCC and Clang for x86-64 Linux, macOS, Android, and iOS, becoming the global standard for non-Windows platforms.

---

## 5. Modern Multi-Architecture Era (2000s–2020s)

| Decade | Milestones | Primary Innovations |
|:---|:---|:---|
| **2000s** | AMD64 System V vs Microsoft x64 | Transition from 32-bit stack-heavy calls to 64-bit register-rich passing (6 vs 4 registers). Introduction of shadow space on Windows and red zone on Linux. |
| **2010s** | ARM AAPCS64 & Apple Silicon | Standardized 8-register passing (`X0-X7`), dedicated indirect return register (`X8`), link register (`X30`). Apple Darwin introduced custom conventions (no red zone, packed varargs). |
| **2015s** | WebAssembly & Component Model | Pure bytecode execution; transition from linear memory C stubs to Canonical ABI with typed lifting/lowering. |
| **2020s** | Vector ABI Extensions (SVE, RVV, AVX-512) | Dynamic register lengths (SVE / RISC-V Vector), mask registers, hardware shadow stacks (Intel CET, ARM PAC/BTI). |
| **2026** | ARM AAPCS64 2026 Release | Enhanced PAC (Pointer Authentication), Guarded Control Stack (GCS) unwind specifications, SME streaming mode ABIs. |

---

## 6. Historical Lessons for Rubix

1. **Physical Register Pinning Destroys Evolution**: When an architecture pins an interface to specific registers, any later hardware innovation (more registers, vector units) cannot be used by existing binaries without breaking compatibility.
2. **Caller/Callee Asymmetry Causes Silent Bugs**: Mismatches in who cleans the stack, who reserves shadow space, or who saves a register always lead to silent memory corruption.
3. **The Lingua Franca Problem**: C ABI became the universal lingua franca not because it was good, but because it was the simplest common denominator. In doing so, it discarded high-level semantics: types, memory ownership, slices, error handling, effects, and capabilities.
