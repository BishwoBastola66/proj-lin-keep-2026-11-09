# Compilation Speed: The Compiler as a Performance-Critical System

A compiler is not merely an abstract mathematical function; it is a heavy data-processing pipeline that ingests source code text and emits machine code. If a compiler is slow, developer iteration speed collapses, CI/CD pipelines bottleneck, and rapid test feedback is destroyed.

---

## 1. Breakdown of Compiler Phase Costs

In a typical non-optimizing vs optimizing build (e.g., Clang, Rustc, Swift):

```
Debug Build (-O0):
[ Lexing & Parsing: 15% ] -> [ Typecheck & Semantics: 25% ] -> [ IR Gen: 20% ] -> [ Codegen & Linking: 40% ]

Optimizing Release Build (-O3 + LTO):
[ Frontend: 10% ] -> [ Middle-End SSA Passes: 50% ] -> [ Backend Selection & RegAlloc: 25% ] -> [ LTO Linking: 15% ]
```

---

## 2. Memory Allocation in Compilers: Arena / Bump vs. `malloc`
The single most common engineering flaw in naive compilers is using standard `malloc` and `free` (or C++ `new`/`delete`) for AST nodes, IR instructions, and symbol table entries.

### The `malloc` Pathology:
* A medium project contains millions of AST nodes and IR instructions.
* Allocating each node individually calls `malloc`, traversing free-lists, acquiring thread-safe allocator locks, and writing 16-byte metadata headers per allocation.
* When the compiler finishes a function or translation unit, calling `free` recursively traverses millions of heap pointers, inducing catastrophic L1/L2 cache misses.

### The Arena Allocator Solution:
* High-speed compilers (Go compiler, Clang `BumpPtrAllocator`, Rustc arena) allocate large contiguous blocks of memory (e.g., 4 MB chunks).
* Allocating an AST node is a **2-instruction bump operation**:
  ```c
  void* allocate(size_t size) {
      size = (size + 7) & ~7; // 8-byte align
      if (current + size > end) allocate_new_chunk();
      void* ptr = current;
      current += size;
      return ptr;
  }
  ```
* **Instant Freeing**: When the compilation phase or function finishes, the entire arena is reset by setting `current = base` in a **single instruction** ($O(1)$) without freeing individual nodes!
* AST nodes remain contiguous in physical memory, ensuring hardware prefetchers stream them into L1D cache during semantic analysis.

---

## 3. The Monomorphization Explosion (Generics / Templates)
Languages with compile-time generic monomorphization (C++, Rust, Swift, D):
* Every unique combination of generic parameters (`Vec<i32>`, `Vec<String>`, `Vec<Foo>`) generates a distinct copy of all method implementations in the compiler's IR.
* **Combinatorial IR Explosion**: A deeply nested generic library can expand a 10,000-line source file into 1,000,000 lines of LLVM IR!
* Downstream optimizer passes (Global Value Numbering, Inliner, Register Allocator) are non-linear (often $O(N \log N)$ or $O(N^2)$), causing compile times to blow up exponentially.
* **Mitigation**: Polymorphic code-sharing (instantiating pointers as a single shared implementation, as in Go or Java) or generic instantiations deduplicated across compilation units.

---

## 4. Compiler Pass Pipelines & Analysis Invalidation
* In an optimizing compiler, dozens of passes run sequentially:
  $$\text{SimplifyCFG} \to \text{SROA} \to \text{EarlyCSE} \to \text{LICM} \to \text{GVN} \to \text{DCE}$$
* **Analysis Invalidation Cost**:
  * An optimization pass (e.g., Loop Unrolling) mutates the CFG.
  * If the pass manager is naive, it invalidates the Dominator Tree and Loop Info, forcing the compiler to re-compute dominators from scratch.
  * Recomputing dominator trees repeatedly accounts for up to **20% to 30% of total middle-end compile time**!
* **Preserving Analyses**: Modern pass managers (LLVM New Pass Manager) require transformations to incrementally update dominator trees and loop info rather than invalidating them.

---

## 5. Parallel Compilation: Frontend vs. Backend vs. ThinLTO
* **Frontend Parallelism**: Compiling individual files/modules in parallel across independent OS processes or worker threads (`make -j$(nproc)`).
* **Backend Parallelism (ThinLTO)**:
  * Traditional LTO is single-threaded at link time because the entire whole-program call graph is merged into a single process.
  * **ThinLTO (Johnson et al., 2016)** divides the program into a global index summary phase (fast, cross-module call graph analysis) and dispatches the actual code generation and inlining to dozens of parallel worker threads.
* **Linker Bottlenecks**:
  * The final link step combines symbol tables, performs relocations, and writes the output binary.
  * Traditional single-threaded linkers (`ld`, `gold`) take 30–60 seconds on large projects.
  * **Mold Linker (Rui Ueyama, 2021)**: Designed from the ground up for massive multi-threading, saturating all memory channels and completing links in 100–300 milliseconds.

---

## 6. Incremental Compilation, Caching, and Persistent Daemons
* **Compiler Caches (`ccache`, `sccache`)**:
  * Hashes compiler flags, dependency headers, and source text.
  * If the hash matches a previously compiled object file, returns the cached `.o` binary in milliseconds, bypassing the compiler entirely.
* **Persistent Compiler Daemons (e.g., Kotlin daemon, Gradle, TypeScript tsc)**:
  * Eliminates process launch and JVM/runtime warmup latency by keeping the compiler resident in memory between builds.
