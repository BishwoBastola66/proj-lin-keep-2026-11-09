# Dynamic Linking and Loader Contracts

## 1. The Anatomy of Dynamic Linking

Dynamic linking separates program compilation from library binding. Instead of incorporating library object code directly into the executable binary, the executable records:
- The names of required shared libraries (`DT_NEEDED` entries).
- The names and hashes of required external symbols.
- Relocation directives indicating which memory locations must be patched before execution.

```
ELF Executable Binary                            Operating System Dynamic Loader
+------------------------------------+           +-------------------------------------+
| Program Header: PT_DYNAMIC         | --------> | Maps shared libraries into memory   |
| Dynamic Tags:                      |           | Traverses DT_NEEDED dependencies    |
|   DT_NEEDED: libc.so.6             |           | Resolves symbol address collisions  |
|   DT_NEEDED: libm.so.6             |           | Applies relocations (GOT, data)     |
|   DT_SONAME: libfoo.so.1           |           | Executes init routines (.init_array)|
+------------------------------------+           +-------------------------------------+
```

---

## 2. Dynamic Loader Contracts in ELF

### 2.1. Crucial Dynamic Tags (`Elf64_Dyn`)
- **`DT_NEEDED`**: String table offset of a required shared object (e.g. `libcrypto.so.3`).
- **`DT_SONAME`**: The canonical ABI version name of the shared object itself (e.g. `libcrypto.so.3`). When an executable links against `libcrypto.so`, the linker copies `DT_SONAME` into the executable's `DT_NEEDED` field rather than the full filename or development symlink.
- **`DT_STRTAB` / `DT_SYMTAB`**: The virtual addresses of the string table and symbol table used for dynamic linking.
- **`DT_HASH` / `DT_GNU_HASH`**: Accelerated symbol lookup tables. `DT_GNU_HASH` uses Bloom filters to achieve near O(1) negative symbol lookups.
- **`DT_INIT_ARRAY` / `DT_FINI_ARRAY`**: Arrays of function pointers executed by the dynamic loader during library loading and unloading.

### 2.2. The Dangerous Copy Relocation (`R_X86_64_COPY`)
A major historical design flaw in ELF dynamic linking is the **copy relocation**:
1. In position-dependent executables (non-PIE), code accessed global variables using absolute 32-bit addresses (`mov eax, [0x402000]`).
2. If a shared library exported a global variable (e.g. `int global_count;`), the executable's compiler could not know the library's runtime address.
3. To allow the executable to use its fixed address, the linker allocated space in the executable's `.bss` section and emitted an `R_X86_64_COPY` relocation.
4. At startup, the dynamic loader **copies** the variable's initial value from the shared library's memory into the executable's `.bss`.
5. **The ABI Disaster**: The size of `global_count` is permanently frozen in the executable! If a newer version of the library increases the size of `global_count` (e.g. from `int` to `long long` or adding struct fields), the loader cannot copy the larger struct without corrupting adjacent variables in the executable's `.bss`.

---

## 3. Dependency Resolution and Symbol Interposition

### 3.1. Lookup Order
When a symbol is referenced, the dynamic loader searches libraries in a defined order:
1. The executable itself.
2. Preloaded libraries specified by `LD_PRELOAD`.
3. Libraries specified by `DT_RPATH` (if `DT_RUNPATH` is absent).
4. Directories specified in the `LD_LIBRARY_PATH` environment variable.
5. Libraries specified by `DT_RUNPATH`.
6. System default paths (`/lib64`, `/usr/lib64`, `/etc/ld.so.cache`).

### 3.2. Breadth-First vs. Depth-First Search
- **Linux (glibc)**: Searches dependencies in breadth-first order across the dependency graph.
- **Solaris / FreeBSD**: Historical variations used depth-first search.
- **The Diamond Dependency Conflict**:
  If application $A$ links against $B$ and $C$, and both $B$ and $C$ link against different versions of $D$, glibc binds all calls to whichever version of $D$ appeared first in the breadth-first walk. The other library silently executes with incompatible symbols or corrupted struct offsets!

---

## 4. The Sovereign Rubix Loader Architecture

In Rubix, external library interaction does not rely on glibc's dynamic loader or `libdl.so`.
Instead, [std/ffi.bix](file:///home/bishwaxyz/translator/rubix/std/ffi.bix) implements an autonomous, in-process ELF64 dynamic loader:

1. **Direct Memory Mapping**: Reads the shared library via `sys_open` and maps executable memory via `sys_mmap`.
2. **In-Memory Header Traversal**: Directly inspects the 64-bit ELF header, parses `Program Headers` to find `PT_DYNAMIC`, and locates the `.dynsym` and `.dynstr` tables.
3. **Exact Symbol Resolution**: Implements `ffi_get_symbol`, indexing exported function symbols without modifying global process state or risking symbol interposition conflicts.
4. **Zero Dynamic Linker Footprint**: Eliminates the overhead, startup delay, and vulnerabilities of standard POSIX `dlopen`.
