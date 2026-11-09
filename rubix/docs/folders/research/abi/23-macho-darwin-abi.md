# The Mach-O Darwin ABI Specification

## 1. Architecture of the Mach-O Format

**Mach-O (Mach Object)** is the native executable and library format for Apple operating systems (macOS, iOS, iPadOS, watchOS, visionOS).
Unlike ELF (which groups sections into segments) or PE (which uses a flat list of sections), Mach-O uses a hierarchical structure:
$$\text{File} \longrightarrow \text{Load Commands} \longrightarrow \text{Segments} \longrightarrow \text{Sections}$$

```
+-------------------------------------------------------------------------------+
|                            Mach-O 64-Bit File Layout                          |
+-------------------------------------------------------------------------------+
|  Mach-O Header (32 bytes): Magic (0xFEEDFACF), CPU Type (ARM64/x86_64), Flags |
+-------------------------------------------------------------------------------+
|  Load Commands:                                                               |
|    - LC_SEGMENT_64: __PAGEZERO (4GB unmapped guard segment to trap NULL ptrs) |
|    - LC_SEGMENT_64: __TEXT (__text code, __cstring literals, __unwind_info)   |
|    - LC_SEGMENT_64: __DATA (__data globals, __la_symbol_ptr lazy stubs)       |
|    - LC_SEGMENT_64: __LINKEDIT (Symbol tables, dynamic linker strings, fixups)|
|    - LC_LOAD_DYLINKER: Path to dynamic linker (/usr/lib/dyld)                 |
|    - LC_MAIN: Modern entry point offset and stack size                        |
|    - LC_LOAD_DYLIB: Linked libraries (/usr/lib/libSystem.B.dylib)             |
+-------------------------------------------------------------------------------+
|  Raw Segment & Section Data                                                   |
+-------------------------------------------------------------------------------+
```

---

## 2. Two-Level Namespaces

A key historical innovation of Apple's Mach-O ABI is the **Two-Level Namespace**:
- In standard ELF, symbol resolution uses a single flat global namespace. If two libraries export `init_buffer()`, whichever library was loaded first shadows the other.
- In Mach-O, every imported symbol records **two pieces of information**:
  1. The name of the symbol (e.g. `_malloc`).
  2. The exact library where the symbol must be found (e.g. `libSystem.B.dylib`).
- **Benefit**: Completely eliminates accidental symbol collision and interposition vulnerabilities across third-party libraries.

---

## 3. Apple Silicon (ARM64) ABI Peculiarities

When Apple introduced the M1 processor running macOS on AArch64, they deviated from the standard ARM AAPCS64 specification in several crucial ways:
1. **No Variadic Register Splitting**: In standard AAPCS64, variadic arguments are placed in remaining parameter registers (`X0-X7`). In Apple Darwin ARM64, all variadic arguments are **always passed entirely on the stack**!
2. **Page Size Invariant**: macOS uses **16KB (16,384 bytes)** virtual memory pages by default, compared to 4KB on Linux and Windows. Segment alignment in Mach-O must respect 16KB boundaries.
3. **Pointer Authentication (PAC)**: Return addresses on the stack are cryptographically signed using hardware PAC instructions (`PACIASP` / `AUTIASP`), trapping buffer overflow attacks at the hardware level.

---

## 4. The Sovereign Rubix Mach-O Implementation

Rubix generates Mach-O binaries natively in [compiler/packaging/macho.bix](file:///home/bishwaxyz/translator/rubix/compiler/packaging/macho.bix):
- Emits `MH_MAGIC_64` (0xfeedfacf) with `CPU_TYPE_X86_64` or `CPU_TYPE_ARM64`.
- Emits `__PAGEZERO` segment protecting against null pointer dereferences.
- Emits `LC_MAIN` entry command pointing to user entry code.
- Establishes linkage with `/usr/lib/dyld` and `/usr/lib/libSystem.B.dylib`, allowing sovereign native Rubix execution on Apple platforms without Xcode or clang.
