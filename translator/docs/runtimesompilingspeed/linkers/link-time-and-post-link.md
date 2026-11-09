# Link-Time & Post-Link Optimization: Beyond the Compilation Unit Boundary

For decades, the translation unit (single source file) was the hard boundary of compiler optimization. The C/C++ separate compilation model meant that a compiler optimizing `file_a.c` had zero knowledge of functions in `file_b.c`. The compiler was forced to emit conservative calling conventions, disable inlining across files, and assume unknown pointers could modify any global variable.
Link-time and post-link optimizations shatter these boundaries, proving that **optimization does not stop when the compiler emits machine code**.

---

## 1. Link-Time Optimization (LTO) & ThinLTO

```
+-----------------------------------------------------------------------------+
| Traditional Monolithic LTO                                                  |
| Source A -> LLVM Bitcode (.bc) \                                            |
| Source B -> LLVM Bitcode (.bc)  --> Single Giant Process -> Monolithic Pass |
| Source C -> LLVM Bitcode (.bc) /    (Huge RAM, Multi-hour build, Single-core)|
+-----------------------------------------------------------------------------+
                                      |
                                      v (Replaced by ThinLTO)
+-----------------------------------------------------------------------------+
| Scalable ThinLTO (Johnson et al., 2016)                                     |
| Step 1: Compile -> Emit Bitcode + Module Summary (Call Graph, Function Size)|
| Step 2: Thin Linker -> Analyzes summaries globally in seconds, decides      |
|                       cross-module inlining imports/exports                 |
| Step 3: Parallel Codegen -> N worker threads compile modules independently   |
|                            with cross-module imports (Linear multi-core)    |
+-----------------------------------------------------------------------------+
```

### Key Transformations Enabled by LTO:
1. **Cross-Module Inlining**: Inlining small helper functions across library boundaries, eliminating call overhead, parameter passing, and register spill/restores.
2. **Whole-Program Devirtualization**:
   * If the linker observes the entire program and proves that an abstract class or interface has only *one* concrete implementation across all linked modules:
   * It replaces indirect virtual method calls (`CALL [RAX + vtable_offset]`) with direct static jumps (`CALL ConcreteMethod`), enabling subsequent inlining!
3. **Dead-Code Stripping (WPD - Whole Program Dead Strip)**:
   * Eliminates functions, vtables, and global structures that are never referenced across any translation unit.

---

## 2. Post-Link Binary Optimization: BOLT (Panchenko et al., 2019)

Why can post-link binary optimization outperform even an optimizing compiler with PGO?
* **Compilers Lack Final Layout Visibility**: During compilation, the compiler does not know the final virtual memory addresses where functions, basic blocks, or libraries will be loaded. It cannot optimize for hardware cache line conflicts or page boundaries.
* **Linkers Introduce Inefficiencies**: Linkers concatenate sections, insert PLT/GOT trampolines for dynamic linking, and place related functions megabytes apart.

### BOLT Transformations on the Final Executable:
1. **Basic Block Reordering (Fall-Through Optimization)**:
   * Reorders basic blocks within a function so that the most frequent branch target is the direct physical fall-through instruction.
   * Eliminates unconditional jump instructions and minimizes branch target buffer (BTB) lookups.
2. **Hot / Cold Code Splitting**:
   * Partitions every function into two distinct pieces:
     * *Hot Section*: Basic blocks executed during profiling.
     * *Cold Section*: Never-executed error handling, exception blocks, and logging routines.
   * All hot blocks across the entire binary are grouped tightly into contiguous physical pages in `.text.hot`.
   * All cold blocks are moved to `.text.cold` at the end of the binary.
   * **Cache Impact**: The L1 Instruction Cache (32 KB) is saturated with 100% useful, frequently executed instructions. Instruction TLB (iTLB) misses drop by up to **80%**.
3. **Function Reordering via Call-Graph Clustering (C3 Algorithm)**:
   * Functions that frequently call each other are placed consecutively in virtual memory.
   * Keeps caller and callee within the same 4 KB or 2 MB virtual page, preventing page boundary crossings.

---

## 3. Linker Acceleration: Mold (Rui Ueyama, 2021)
* While GNU `ld` and `gold` process relocations sequentially, **Mold** parallelizes every step of linking:
  * Concurrent string interning and symbol resolution using lock-free hash tables.
  * Parallel relocation calculation using memory-mapped output files.
  * Saturates 64+ CPU cores and saturates NVMe disk I/O bandwidth.
  * Reduces link times of multi-gigabyte binaries from 30+ seconds to **under 500 milliseconds**, revolutionizing developer test loops.
