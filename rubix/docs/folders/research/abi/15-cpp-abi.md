# The C++ Itanium ABI and the Great ABI Freeze

## 1. Architecture of the Itanium C++ ABI

The **Itanium C++ ABI** (originally designed by Intel, HP, SGI, and Red Hat for IA-64) became the foundational binary standard for C++ across Linux, macOS, iOS, Android, and BSD.
It governs:
- **Virtual Table (Vtable) Layout**: Precise placement of function pointers, offset-to-top, and RTTI pointers.
- **Virtual Base Classes & Multiple Inheritance**: Thunks and secondary vtables for pointer adjustments.
- **Name Mangling**: Grammar encoding namespaces, template parameters, qualifiers, and types into unique ASCII identifiers (`_Z...`).
- **Object Construction & Destruction**: Complete-object, base-object, and deleting destructors.
- **Zero-Cost Exception Handling**: `.eh_frame` formats, personality routines (`__gxx_personality_v0`), and LSDA (Language-Specific Data Area) tables.

```
Standard Single-Inheritance C++ Object Layout:
+------------------------------------+
|  *vptr (Pointer to Vtable)         | (offset 0, 8 bytes)
+------------------------------------+
|  Field 1: m_id                     | (offset 8, 8 bytes)
+------------------------------------+
|  Field 2: m_flag                   | (offset 16, 1 byte)
|  [7 bytes padding]                 |
+------------------------------------+
                   |
                   v
       Virtual Method Table (.rodata):
       +------------------------------------+
       | Offset-to-top (0)                  | (offset -16)
       +------------------------------------+
       | RTTI pointer (&typeinfo for Class) | (offset -8)
       +------------------------------------+
       | &Class::virtual_method_1()         | (offset 0)  <-- vptr points here
       +------------------------------------+
       | &Class::virtual_method_2()         | (offset 8)
       +------------------------------------+
```

---

## 2. The Great C++ ABI Freeze (The Prague 2020 Decision)

At the ISO C++ Committee (WG21) meeting in Prague (February 2020), the committee faced a historic, existential debate:
**Should C++ ever break its ABI to unlock performance optimizations and modernize the standard library?**

The committee voted overwhelmingly **AGAINST** breaking the ABI, effectively freezing the standard library's physical layout forever.

### 2.1. The Famous Paralyzed Optimizations

#### Case 1: `std::unique_ptr` Passed in Registers
- In C, a raw pointer `void*` is passed in a single register (`RDI`).
- In C++, `std::unique_ptr<T>` has zero runtime overhead in theory (the same size as a raw pointer).
- However, because `std::unique_ptr` has a non-trivial destructor, the Itanium ABI mandates that it is **passed by invisible reference on the stack**, NOT in a register!
- Consequently, passing `std::unique_ptr` incurs memory spills and stack traffic, making it 2x–3x slower than a raw pointer at call sites. Fixing this requires changing parameter passing rules, which is an ABI break.

#### Case 2: The `std::regex` Performance Catastrophe
- When `std::regex` was standardized in C++11, initial implementations in GCC and Clang were naive recursive back-trackers.
- Modern regex engines use non-backtracking automata.
- GCC cannot rewrite `std::regex` to use a modern DFA because modifying the internal private fields of `std::basic_regex` breaks the ABI of every binary using regular expressions on Linux.

#### Case 3: `intmax_t` Frozen at 64 Bits
- `intmax_t` is defined as `long long` (64 bits).
- Hardware supports 128-bit integers (`__int128_t`).
- C and C++ cannot widen `intmax_t` to 128 bits because doing so changes the sizes and alignments of all structs containing `intmax_t`, breaking every shared library on the operating system.

---

## 3. Key Historical Quotations

### Titus Winters (Google, Chair of C++ Library Evolution Working Group):
> *"If you cannot break ABI, you cannot fix design bugs in the standard library. You cannot fix performance bugs in the standard library. C++ is stuck with decisions made in 1998, 2011, and 2014 forever."*

### Chandler Carruth (LLVM / Clang Lead):
> *"ABI stability is poison to performance. By prioritizing binary compatibility between different compiler versions, we permanently sacrifice the peak performance of every program compiled from that day forward."*

---

## 4. The Rubix Verdict

C++ proved that **freezing physical ABI layout is an architectural dead end**. It forces decades of accumulated technical debt onto every future programmer and hardware generation.

Rubix rejects the frozen ABI trap. By decoupling semantic interfaces from physical realizations, Rubix allows internal representations to evolve and optimize freely while synthesizing zero-overhead adapters at binary boundaries.
