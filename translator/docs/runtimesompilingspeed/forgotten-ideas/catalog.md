# The Idea Graveyard: Forgotten, Abandoned, and Resurrectable Ideas

A technique may disappear not because its theory was wrong, but because it was implemented on 1970s hardware with 64 KB of RAM, because compilers lacked SSA intermediate representations, or because its inventors moved on. This document recovers eight forgotten ideas from the annals of computer science, analyzing why they were abandoned and how modern hardware unlocks their potential.

---

## 1. Catalog of Forgotten Ideas

### 1. Superoperators & Dynamic Bytecode Fusion (Todd Proebsting, 1995)
* **What Was Attempted?**:
  In a bytecode interpreter, instruction dispatch overhead (fetching opcode, decoding, and jumping) accounts for 40%–60% of execution time. Proebsting demonstrated that analyzing bytecode sequences reveals frequent patterns (e.g., `LOAD_LOCAL`, `LOAD_CONST`, `ADD`, `STORE_LOCAL`).
  The compiler automatically synthesizes **Superoperators**—composite single bytecodes that fuse 2, 3, or 4 operations into a single opcode with a single dispatch!
* **Why Was It Abandoned?**:
  In the late 1990s, the emergence of JIT compilers (HotSpot, V8) made bytecode interpreter optimization appear obsolete. Why optimize bytecode dispatch when you can compile to machine code?
* **Why Modern Hardware Changes This**:
  Modern CPU Branch Target Buffers (BTBs) suffer severely on polymorphic indirect jumps in switch loops. Furthermore, in serverless, edge, and WebAssembly environments, JIT compilation is either forbidden (due to W^X security rules on iOS / gaming consoles) or too slow due to cold-start constraints.
* **Resurrection Potential**:
  **HIGH**: Synthesizing superoperators for hot bytecode sequences cuts dispatch overhead by 50% without requiring an executable JIT code buffer!

---

### 2. Customization & Split Compilation (Chambers & Ungar, 1989)
* **What Was Attempted?**:
  In object-oriented and dynamic languages, generic methods must handle multiple receiver types. In Self, Chambers and Ungar introduced **Customization**:
  The compiler automatically compiled a *specialized copy* of each method for every concrete receiver class that inherited it. Because the receiver's concrete type was known at compile time, all dynamic message sends within the customized method were resolved into direct static calls or inlined completely!
* **Why Was It Abandoned?**:
  Caused severe **Code Bloat** (code size exploded by 5x to 10x), overflowing the tiny 16 KB / 32 KB instruction caches of 1990s SPARCstations.
* **Why Modern Hardware Changes This**:
  Modern systems have massive multi-megabyte L2 and L3 caches (and up to 96 MB L3 on AMD 3D V-Cache).
* **Resurrection Potential**:
  **HIGH**: Combining customization with Profile-Guided Optimization (only customizing methods proven to be on the hot path) achieves maximum specialization speedups without cold-path code bloat.

---

### 3. Uniqueness Types & In-Place Destructive Mutation (Clean / Wadler, 1990)
* **What Was Attempted?**:
  In the Clean programming language and Philip Wadler’s 1990 paper (*"Linear Types Can Change the World!"*), values with a "unique" type ($\ast T$) were statically guaranteed by the compiler to have exactly one reference in existence.
  Because no other part of the program holds a reference, updating a unique record or array does not require allocating a new copy; the compiler emits a raw, destructive in-place hardware write!
* **Why Was It Abandoned?**:
  Mainstream industry adopted Java and C++ with unrestricted mutable pointers. Clean lost the ecosystem war to Haskell, which chose lazy evaluation and monads for I/O instead of uniqueness types.
* **Why Modern Hardware Changes This**:
  The Memory Wall and multi-core cache invalidation make memory copying catastrophically expensive today.
* **Resurrection Potential**:
  **MAXIMUM**: Uniqueness types were resurrected 25 years later as **Rust's Affine Ownership System** (`&mut T`), proving that Wadler was completely right.

---

### 4. Software Pipelining with Rotating Register Files (Rau & Cydrome, 1988)
* **What Was Attempted?**:
  B. Ramakrishna Rau at Cydrome and later on Intel Itanium designed hardware **Rotating Register Files**:
  In an unrolled loop, each iteration used register names ($r_1, r_2, \dots$), and at the end of the loop iteration, a hardware instruction (`br.ctop`) automatically shifted the physical register pointer by a fixed offset.
  This allowed the compiler to schedule software-pipelined loops across multiple iterations without generating loop unrolling code bloat or register copying moves!
* **Why Was It Abandoned?**:
  Cydrome went bankrupt in 1988; Itanium was abandoned in the 2010s. Modern x86 and ARM processors omitted rotating register files in hardware.
* **Why Modern Hardware Changes This**:
  While the hardware rotating register file died on general CPUs, the mathematical compiler algorithm (**Modulo Scheduling**) remains the gold standard for loop scheduling.

---

### 5. Cheney on the MTA (Henry Baker, 1994)
* **What Was Attempted?**:
  Henry Baker published *"CONS Should Not CONS Its Spaces, Part II"* (1994). Compiling Scheme/Lisp to standard C code:
  1. All function calls are transformed into Continuation-Passing Style (CPS) and called as C functions.
  2. Every dynamic object and stack frame is allocated directly on the native **C hardware stack** (ultra-fast bump allocation).
  3. Functions never return! They simply call the continuation.
  4. When the C hardware stack pointer hits a limit (e.g., 512 KB), the runtime triggers a "Garbage Collection": it traverses live roots using Cheney's copying GC algorithm, copies live objects into a heap nursery, and resets the C hardware stack pointer using `longjmp()`!
* **Why Was It Abandoned?**:
  Relied on non-standard C tricks and broke debugging tools; modern systems preferred standard call stacks. Survived in the Chicken Scheme compiler.
* **Resurrection Potential**:
  **MODERATE**: Proves that using the physical CPU stack as a generational nursery yields zero-cost allocation with automatic batch reclamation.

---

### 6. Superword Vector Splitting via Polyvariant Cloning
* **What Was Attempted?**:
  Cloning a procedure multiple times at compile time, each clone specialized for a different memory alignment or pointer aliasing condition, selected at the call site via a single dynamic branch guard.
* **Why Was It Abandoned?**:
  Compilers feared code bloat.
* **Resurrection Potential**:
  **HIGH**: Used today in high-performance math libraries (Intel MKL, OpenBLAS) to dispatch between AVX2, AVX-512, and scalar math kernels seamlessly.
