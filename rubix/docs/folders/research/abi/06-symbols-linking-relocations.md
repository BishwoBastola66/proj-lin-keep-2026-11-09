# Symbols, Linking, and Relocations

## 1. Symbol Nomenclature and Name Mangling

Linkers operate on ASCII or UTF-8 strings called **symbols**. In C, symbol naming was trivial: an identifier `foo` in source code translated directly into `foo` (or `_foo` on classic BSD/macOS).

As languages added overloading, namespaces, classes, templates, traits, and modules, identical function names could refer to distinct implementations. Compilers were forced to encode signatures into unique symbol strings through **name mangling**.

### 1.1. Name Mangling Schemes Across Languages

| Scheme | Example Source Signature | Mangled Symbol Output |
|:---|:---|:---|
| **C** | `int compute(int x)` | `compute` (or `_compute`) |
| **Itanium C++** | `int Math::compute(int x)` | `_ZN4Math7computeEi` |
| **Microsoft C++** | `int Math::compute(int x)` | `?compute@Math@@YAHH@Z` |
| **Rust Legacy** | `math::compute(i32)` | `_ZN4math7compute17h1a2b3c4d5e6f7g8E` |
| **Rust v0** | `math::compute(i32)` | `_RNvNtCs123_4math7computel` |
| **Swift** | `Math.compute(x: Int) -> Int` | `$s4Math7computeyS2iF` |
| **Rubix Native** | `fn math.compute(x: i64): i64` | `__rubix_m_math_f_compute_1` |

### 1.2. The Fragility of Name Mangling
If a language or compiler changes its mangling scheme:
- Linkers report `undefined reference` or `unresolved external symbol`.
- Even though the function machine code and binary ABI are 100% identical, the linker cannot pair them.
- This represents an **artificial link-time ABI break** that has nothing to do with physical execution compatibility.

---

## 2. Symbol Visibility and Scope

In dynamic linkers (ELF and Mach-O), symbols exported from shared libraries can have different visibility attributes:

```
+-------------------------------------------------------------+
|                     Symbol Visibility                       |
+-------------------+--------------------+--------------------+
|  STV_DEFAULT      |  STV_HIDDEN        |  STV_PROTECTED     |
|  - Exported to    |  - Local to DSO    |  - Exported to DSO |
|    dynamic symbol |  - Not in .dynsym  |  - Cannot be       |
|    table (.dynsym)|  - Direct local PC |    interposed      |
|  - Interposable   |    relocations     |  - Direct local    |
|    (can be hooked)|  - High optimizer  |    binding         |
|  - Indirect GOT   |    freedom         |                    |
+-------------------+--------------------+--------------------+
```

### The Interposition Problem (`STV_DEFAULT`)
In ELF shared libraries, all default symbols are **interposable** by default:
- If library `A` defines `malloc()`, and `LD_PRELOAD` defines a different `malloc()`, calls inside library `A` to `malloc()` must dynamically resolve to the preloaded version.
- **Consequence**: The compiler CANNOT inline or devirtualize internal calls between functions in the same shared library unless they are marked `hidden` (`__attribute__((visibility("hidden")))`) or compiled with `-fno-semantic-interposition`.
- This imposes a permanent performance penalty on ordinary internal function calls in ELF libraries.

---

## 3. Relocation Mechanics Across Architectures

A **relocation** is a record in an object file instructing the linker how to patch machine code when the final memory addresses of code or data are known.

### 3.1. Common x86-64 Relocations
- **`R_X86_64_64`**: Absolute 64-bit address patch. Used for pointers in data sections (`.data`).
- **`R_X86_64_PC32`**: 32-bit PC-relative offset:
  $$\text{Value} = \text{SymbolAddress} + \text{Addend} - \text{PatchAddress}$$
  Used for direct calls (`call rel32`) and PC-relative loads (`mov rax, [rip + disp32]`).
- **`R_X86_64_PLT32`**: 32-bit PC-relative offset to a Procedure Linkage Table entry.
- **`R_X86_64_GOTPCREL`**: 32-bit PC-relative offset to the symbol's Global Offset Table entry.

### 3.2. Common AArch64 (ARM64) Relocations
Because ARM instructions are fixed 32-bit words, they cannot encode a 64-bit immediate in one instruction.
- **`R_AARCH64_CALL26`**: 26-bit PC-relative branch (`BL`). Can branch within $\pm 128 \text{ MB}$.
- **`R_AARCH64_ADR_PREL_PG_HI21`** + **`R_AARCH64_ADD_ABS_LO12_NC`**: Two-instruction pair (`ADRP` + `ADD`) to compute a 64-bit PC-relative address within a $\pm 4 \text{ GB}$ range.

### 3.3. Common RISC-V Relocations
- **`R_RISCV_CALL`** / **`R_RISCV_CALL_PLT`**: Pair of `auipc` + `jalr` instructions for function calls within a $\pm 2 \text{ GB}$ PC-relative window.
- **Relaxation (`R_RISCV_RELAX`)**: The linker can optimize an `auipc` + `jalr` pair into a single `c.jal` or `c.j` compressed 16-bit instruction if the target is close enough, shrinking binary size at link time.

---

## 4. The GOT / PLT Lazy Binding Architecture

```
Code (.text)                       PLT (.plt)                      GOT (.got.plt)
+-------------------+              +----------------------+        +-----------------------+
| call foo@PLT      | -----------> | jmp *[GOT_entry]     | -----> | Points back to PLT+6  | (initial)
+-------------------+              | push reloc_index     | <----+ |                       |
                                   | jmp dl_runtime_resolve|        +-----------------------+
                                   +----------------------+                    |
                                              |                                v
                                              |                   [Dynamic Linker ld.so]
                                              |                   - Resolves symbol 'foo'
                                              |                   - Writes actual address
                                              v                     into GOT_entry
                                   +----------------------+                    |
                                   | jmp *[GOT_entry]     | -------------------+ (subsequent calls)
                                   +----------------------+
                                              |
                                              v
                                   [Actual Function Code]
```

### The Cost of Lazy Binding
1. **Security Vulnerability**: `.got.plt` must remain writable at runtime so the dynamic linker can patch it. Attackers exploit writable GOT entries to hijack control flow (Overwriting GOT with shellcode pointer).
2. **Modern Hardening (`-Wl,-z,relro,-z,now`)**: Modern distributions disable lazy binding by default. All symbols are resolved at startup, and the GOT is made read-only before `main()` executes (`GNU_RELRO`).
