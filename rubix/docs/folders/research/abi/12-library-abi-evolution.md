# Library ABI Evolution and Binary Maintenance

## 1. The Anatomy of Library ABI Breakage

A library can maintain 100% source code (API) compatibility while simultaneously breaking binary (ABI) compatibility. When ABI breaks, existing compiled binaries linked against the library will crash, corrupt data, or fail to load.

```
API Compatible (Recompilation Works)        !=      ABI Compatible (Drop-in Binary Works)
------------------------------------                -------------------------------------
- Same function names and types                     - Same physical register assignments
- Same header file compiles cleanly                 - Same struct sizes and field offsets
- Developer notices zero compiler errors            - Same symbol names and mangling
                                                    - Same virtual table method indices
```

---

## 2. Taxonomy of Binary Breaking Changes

| Code Change | API Impact | ABI Impact | Physical Consequence |
|:---|:---:|:---:|:---|
| **Adding a field to an exported struct** | Non-breaking | **FATAL** | Increases struct size; corrupts caller stack frames; shifts offsets of all trailing fields |
| **Reordering fields in a struct** | Non-breaking | **FATAL** | Callers read wrong data fields silently |
| **Adding a virtual method to a class** | Non-breaking | **FATAL** | Shifts vtable indices for all subsequent virtual methods |
| **Changing function return type** | Breaking | **FATAL** | Registers / sret conventions change (e.g. from `RAX` to stack memory) |
| **Adding a default argument value** | Non-breaking | **FATAL** | Default values are evaluated at the *call site*; existing binaries pass the old argument count |
| **Adding an enum variant** | Non-breaking | **CONDITIONAL** | May widen the underlying enum integer type; exhaustiveness mismatch in jump tables |
| **Changing an inline function implementation** | Non-breaking | **SILENT BUG** | Old binaries continue executing the stale inline code baked into their `.text` |
| **Switching from typedef to struct** | Non-breaking | **FATAL** | C++ mangled name changes completely; linker fails with undefined symbol |

---

## 3. Historical Industry Mitigation Strategies

### 3.1. Symbol Versioning (GNU `.symver`)
Used in `glibc` to provide multiple versions of the same symbol within a single shared library:
```c
// Internal implementation of old version
int old_memcpy(void *dst, const void *src, size_t n);
__asm__(".symver old_memcpy, memcpy@GLIBC_2.2.5");

// Internal implementation of new AVX-optimized version
int new_memcpy(void *dst, const void *src, size_t n);
__asm__(".symver new_memcpy, memcpy@@GLIBC_2.14");
```
- Binaries compiled against glibc 2.2.5 bind to `memcpy@GLIBC_2.2.5`.
- Binaries compiled against glibc 2.14+ bind to `memcpy@@GLIBC_2.14`.
- **The Baggage Problem**: `glibc` cannot remove historical implementations, carrying decades of deprecated stubs in `.text` indefinitely.

### 3.2. Inline Namespaces (GCC / Clang C++11)
When GCC 5 transitioned `std::string` from Copy-On-Write (COW) to Small String Optimization (SSO) as mandated by C++11:
- To prevent ABI collisions with pre-C++11 binaries, GCC wrapped the new implementation in an inline namespace:
  ```cpp
  namespace std {
      inline namespace __cxx11 {
          class string { ... };
      }
  }
  ```
- This changed the mangled name from `_ZNSs...` to `_ZNSt7__cxx1112basic_string...`, preventing silent data corruption by intentionally forcing link-time symbol errors.

### 3.3. Reserved Padding Fields ("Padded ABI")
Many classic C libraries (e.g., Win32 structs, libpng) explicitly include reserved fields for future expansion:
```c
struct ContextHeader {
    uint32_t version;
    uint32_t flags;
    uint64_t reserved[8]; // Reserved for future ABI expansion
};
```
- When new features are added, library authors repurpose a reserved word rather than resizing the struct.
- **Limitation**: If future expansion exceeds the reserved words, the ABI breaks anyway. Wastes memory bandwidth in the meantime.

---

## 4. The Rubix Approach: Semantic Interface Contracts

Instead of relying on developer vigilance or manual struct padding, Rubix treats library interfaces as **versioned semantic contracts**:
1. Every exported module exports an ABI metadata descriptor encoding:
   - Logical type identities and field accessors.
   - Capability gates and algebraic effects.
   - Exact structural layouts and version hashes.
2. When a client links against an updated library, Rubix's **ABI Compatibility Solver** checks whether differences can be bridged via a zero-cost specialized adapter, or whether an explicit version rejection must be reported safely.
