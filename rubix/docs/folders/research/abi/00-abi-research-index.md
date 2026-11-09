# Rubix ABI Resilience: Master Research Index & Methodology

## 1. Executive Summary

The **Application Binary Interface (ABI)** is the foundational contract that governs how software components interact at the machine level. While Application Programming Interfaces (APIs) govern source-level vocabulary and syntax, the ABI governs physical reality:
- Physical register allocation for argument passing and return values
- Call stack frame layout, direction, alignment, and parameter overflow slots
- Callee-saved versus caller-saved (scratch) register preservation invariants
- In-memory data layout, structure padding, field alignment, and bit-level representations
- Symbol naming, name mangling, linkage, relocation formats, and dynamic loader resolution
- Exception propagation, stack unwinding metadata, and debug symbols
- Thread-Local Storage (TLS) pointer offsets and system call invocation conventions

Throughout computing history, ABIs have suffered from a crippling dichotomy:
1. **The Frozen ABI Trap (C / C++ / POSIX)**: Freezing physical layouts and register conventions forever ensures binary compatibility, but paralyzes language evolution, optimization, and hardware adaptation (e.g. C++'s inability to optimize `std::string` or `std::unique_ptr` without breaking ABI).
2. **The Wild West Trap (Rust / Go)**: Completely refusing to stabilize an ABI gives compiler authors total optimization freedom, but destroys dynamic linking and binary library distribution, forcing whole-world source recompilation and creating massive dependency bloat.

### The Rubix ABI Resilience Thesis

Rubix introduces a third paradigm: **Semantic ABI Resilience with Zero-Overhead Specialization**.
Instead of freezing physical register and memory layouts, Rubix establishes:
1. **Semantic Interface Contracts**: Stable contracts define logical types, parameter arities, ownership semantics (affine linear moves vs borrowed views), algebraic effects, and security capabilities.
2. **First-Class Machine Realizations**: Concrete target ABIs (System V AMD64, Microsoft x64, ARM AAPCS64, RISC-V psABI, WASI) are formalized as explicit mathematical mappings in RUMS.
3. **Compatibility Lattice & Zero-Cost Elimination**: When caller and callee share compatible representations, adapter trampolines are **statically eliminated**, resulting in **100% direct native execution with zero runtime overhead**.
4. **Specialized Trampoline Synthesis**: When calling across ABI boundaries (e.g., System V calling Microsoft x64 or FFI shared libraries), the compiler synthesizes a specialized zero-branch machine trampoline whose cost is isolated strictly to the boundary.
5. **Safe Failure Invariants**: When interfaces diverge incompatibly (arity mismatch, incompatible register class, capability escalation), Rubix rejects execution at compile or load time, preventing silent memory or stack corruption.

---

## 2. Compendium Sitemap

| Document | Title | Focus Area |
|:---|:---|:---|
| [01-what-is-an-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/01-what-is-an-abi.md) | What is an ABI? | Theoretical definition, layers of abstraction, boundary mechanics |
| [02-abi-history.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/02-abi-history.md) | The History of ABIs | 1950s machine sequences to modern 2026 multi-core architectures |
| [03-calling-conventions-history.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/03-calling-conventions-history.md) | Calling Conventions History | Evolution from stack-only (cdecl/pascal) to register-rich conventions |
| [04-data-layout-and-representation.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/04-data-layout-and-representation.md) | Data Layout & Representation | Struct packing, alignment rules, fat pointers, slices, tagged unions |
| [05-register-and-stack-conventions.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/05-register-and-stack-conventions.md) | Register & Stack Conventions | Argument registers, callee-saved invariants, red zones, shadow space |
| [06-symbols-linking-relocations.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/06-symbols-linking-relocations.md) | Symbols, Linking & Relocations | Mangling algorithms, relocation types, symbol visibility, GOT/PLT |
| [07-dynamic-linking-and-loader-contracts.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/07-dynamic-linking-and-loader-contracts.md) | Dynamic Linking & Loaders | ELF `PT_DYNAMIC`, `DT_NEEDED`, lazy binding, copy relocations |
| [08-exception-unwind-and-debug-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/08-exception-unwind-and-debug-abi.md) | Exception Unwind & Debug ABI | DWARF CFI, `.eh_frame`, zero-cost exception tables, SEH |
| [09-thread-local-storage-and-process-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/09-thread-local-storage-and-process-abi.md) | TLS & Process ABI | Thread-local models (GD, LD, IE, LE), FS/GS segments, process startup |
| [10-varargs-vector-and-aggregate-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/10-varargs-vector-and-aggregate-abi.md) | Varargs, Vector & Aggregate ABI | Eightbyte classification, SIMD vector registers, variadic register spills |
| [11-os-user-kernel-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/11-os-user-kernel-abi.md) | OS User/Kernel ABI | Syscall interfaces across Linux, Windows, macOS, and WASI |
| [12-library-abi-evolution.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/12-library-abi-evolution.md) | Library ABI Evolution | Fragile base classes, symbol versioning, Soname maintenance |
| [13-language-runtime-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/13-language-runtime-abi.md) | Language Runtime ABI | Memory allocator boundaries, GC safepoints, runtime metadata |
| [14-c-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/14-c-abi.md) | The C ABI: Lingua Franca | Why C won, what it lacks, implicit assumptions, safety gaps |
| [15-cpp-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/15-cpp-abi.md) | The C++ Itanium ABI | Vtables, RTTI, name mangling, virtual bases, ABI freeze debate |
| [16-rust-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/16-rust-abi.md) | The Rust Unstable ABI | Tradeoffs of avoiding a stable ABI, `repr(C)`, FFI boundaries |
| [17-go-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/17-go-abi.md) | The Go ABI Transition | Stack-based ABI0 to register-based ABIInternal, transparent wrappers |
| [18-swift-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/18-swift-abi.md) | Swift Library Evolution | Resilient vs frozen structs, dynamic value witnesses, metadata |
| [19-java-jni-and-managed-boundaries.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/19-java-jni-and-managed-boundaries.md) | Java JNI & Panama | Managed-to-native boundaries, transition costs, foreign linker |
| [20-wasm-component-canonical-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/20-wasm-component-canonical-abi.md) | WASM Canonical ABI | Component model, lift/lower mechanics, interface type conversions |
| [21-elf-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/21-elf-abi.md) | The ELF64 ABI Specification | ELF headers, sections, program headers, dynamic tags, symbol tables |
| [22-pe-windows-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/22-pe-windows-abi.md) | The PE/COFF Windows ABI | Portable Executable format, import/export tables, delay loading |
| [23-macho-darwin-abi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/23-macho-darwin-abi.md) | The Mach-O Darwin ABI | Load commands, chained fixups, two-level namespaces |
| [24-arm-aapcs64.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/24-arm-aapcs64.md) | ARM AAPCS64 Specification | Register conventions, HFA/HVA aggregates, 2026 standard updates |
| [25-riscv-psabi.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/25-riscv-psabi.md) | RISC-V psABI Specification | LP64 standard, calling conventions, compressed instruction ABI |
| [26-x86-64-system-v-and-windows.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/26-x86-64-system-v-and-windows.md) | System V vs Microsoft x64 | Direct comparative audit: argument registers, shadow space, red zone |
| [27-abi-compatibility-failure-analysis.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/27-abi-compatibility-failure-analysis.md) | Failure Modes Taxonomy | Register corruption, misaligned stacks, silent memory leaks |
| [28-abi-maintenance-problems.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/28-abi-maintenance-problems.md) | Industry Maintenance Burden | Distribution packaging headaches, C++ committee deadlock |
| [29-abi-performance-analysis.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/29-abi-performance-analysis.md) | Microarchitectural Impacts | Branch predictors, cache traffic, register pressure, adapter costs |
| [30-abi-security-analysis.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/30-abi-security-analysis.md) | ABI Security & Integrity | Type confusion, capability escalation, CFI, shadow stacks |
| [31-abi-versioning-strategies.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/31-abi-versioning-strategies.md) | Versioning Strategies | Symbol versioning, Sonames, semantic interface hash stamping |
| [32-abi-adapter-strategies.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/32-abi-adapter-strategies.md) | Adapter Synthesis Strategies | Interpreted (libffi) vs specialized machine trampolines |
| [33-semantic-interface-hypothesis.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/33-semantic-interface-hypothesis.md) | The Semantic Interface Thesis | Separating semantic interfaces from concrete machine realizations |
| [34-rubix-abi-resilience-theory.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/34-rubix-abi-resilience-theory.md) | Rubix ABI Resilience Theory | Mathematical lattice, orderings, proof of zero-cost elimination |
| [35-rubix-abi-experiments.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/35-rubix-abi-experiments.md) | Experimental Measurements | Microbenchmarks: direct vs adapter vs dynamic call overheads |
| [36-rubix-abi-implementation-map.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/36-rubix-abi-implementation-map.md) | Implementation Map | Mapping theories to Rubix compiler subsystems and source lines |
| [37-rubix-abi-final-design.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/37-rubix-abi-final-design.md) | Final Architecture & Principles | Surviving design invariants, contracts, and compiler pipeline |
| [38-rubix-abi-open-problems.md](file:///home/bishwaxyz/translator/rubix/docs/research/abi/38-rubix-abi-open-problems.md) | Open Research Problems | CHERI hardware capabilities, dynamic vector widths, JIT bridges |

---

## 3. Investigation Methodology

Every claim in this research suite has been evaluated against three pillars:
1. **Historical Documentation & Primary Specifications**: Authoritative standards (System V AMD64 ABI, Microsoft x64 Calling Convention, ARM AAPCS64 2026, RISC-V psABI v1.0, Itanium C++ ABI, WASM Component Model).
2. **Microarchitectural Evidence**: Real CPU instruction sequences, cycle counts, pipeline stalls, and cache behavior.
3. **Executable Source Code in Rubix**: Direct implementation in [compiler/middle/abi.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/abi.bix), [compiler/target/target.bix](file:///home/bishwaxyz/translator/rubix/compiler/target/target.bix), [std/ffi.bix](file:///home/bishwaxyz/translator/rubix/std/ffi.bix), and [tests/test_abi_resilience.bix](file:///home/bishwaxyz/translator/rubix/tests/test_abi_resilience.bix).
