# Dead Systems Dossier: Sisal (Streams & Iteration in a Single Assignment Language) (1983–1995)

* **Project**: Sisal (Streams and Iteration in a Single Assignment Language)
* **Years**: 1983–1995
* **People**: John Feo (LLNL), David Cann (LLNL), Rodney Oldehoeft (Colorado State), James McGraw
* **Organization**: Lawrence Livermore National Laboratory (LLNL), Colorado State University, Manchester University, DEC
* **Language**: Sisal 1.2 / Sisal 90 (Pure functional, single-assignment dataflow language)
* **Target Hardware**: Cray X-MP, Cray Y-MP, Cray C90, Alliant FX/8, Encore Multimax, Sequent Balance, SGI Challenge, Sun SPARC
* **Target OS**: UNICOS (Cray Unix), SunOS, IRIX
* **Compiler Architecture**:
  Frontend $\to$ IF1 (Intermediate Format 1: Acyclic Dataflow Graph) $\to$ **IF2 (Monolithic Graph with Explicit Memory & Buffer Allocations)** $\to$ Optimization Passes (Copy Elimination, Build-in-Place, Loop Slicing, Update-in-Place Analysis) $\to$ Parallel C Code Generator $\to$ Target Native C Compiler.
* **Runtime Architecture**: Lightweight multi-threaded work-stealing runtime optimized for Cray vector registers and shared-memory parallel execution.
* **Original Problem**: Parallel supercomputers (Crays) were programmed in Fortran with manual micro-tasking directives or auto-vectorization flags. Programmers had to spend months tracking race conditions and deadlocks because Fortran had unrestricted mutable state and pointers.
* **Original Goal**: Build a pure functional, single-assignment programming language that guaranteed mathematical determinism and dead-lock freedom, while matching or exceeding the speed of expert hand-tuned parallel Fortran on Cray vector supercomputers.
* **Design Philosophy**:
  > *"Functional languages are not inherently slow; their slowness is an artifact of naive compilers that copy arrays on every modification. If a compiler can mathematically prove when an array update can be performed in-place, a functional language can beat Fortran."*
* **Optimization Philosophy**:
  **Copy Elimination & Build-In-Place Analysis (David Cann, 1992)**:
  1. In functional single assignment: `B = A with [i: val]` theoretically creates a brand-new copy of array $A$ with element $i$ modified.
  2. The Sisal compiler transformed the program into the **IF2 dataflow graph**, where memory buffers are first-class edges.
  3. Using liveness and reference count analysis over the dataflow graph, the compiler proved whether array $A$ was ever read after this point.
  4. If $A$ had no future readers, the compiler **eliminated the copy completely** and compiled the operation into a single in-place hardware memory write: `A[i] = val`!
* **Compilation Strategy**: AOT dataflow compilation lowering to parallel C.
* **Runtime Strategy**: Pre-allocated thread pools pinned to physical supercomputer CPUs; lock-free work distribution.
* **Memory Model**: Pure value semantics with compile-time proven in-place updates.
* **Concurrency Model**: Implicit, deterministic data parallelism and loop parallelism.
* **Type System**: Statically typed arrays, records, unions, streams, and scalars.
* **Code-Generation Strategy**: Emitted vectorized loops targeting Cray vector chaining instructions directly.
* **What They Believed**: That a clean functional language with mathematical dataflow semantics could match Fortran's performance by eliminating aliasing.
* **What They Attempted**: Taking on Fortran at the holy temple of HPC computing: Lawrence Livermore National Laboratory.
* **What Worked**:
  * **Sisal Beat Fortran**: In 1992, David Cann published the astonishing landmark paper: *"Retire Fortran? A Debate Rekindled"* (Communications of the ACM, August 1992).
  * On real scientific benchmarks (Livermore Loops, Ricard 2D Hydrodynamics) running on Cray Y-MP supercomputers, **Sisal ran as fast as, or up to 20% FASTER than, hand-tuned parallel Cray Fortran**!
  * Sisal achieved near-linear parallel speedup across 16 Cray vector processors, with zero race conditions, zero deadlocks, and half the lines of code.
* **What Failed**:
  * *Cultural & Ecosystem Resistance*: HPC scientists and national laboratories had tens of millions of lines of validated legacy Fortran code. They refused to rewrite scientific libraries (BLAS, LAPACK) in a new language.
  * *I/O and Legacy System Interoperability*: Sisal struggled with dirty, real-world file I/O and interactive graphics without compromising its pure functional purity.
* **What Was Unfinished**: Sisal 90 (which intended to add higher-order functions and mutable data escapes) was abandoned before full deployment.
* **Why It Died**:
  * **FUNDING ENDED / MANAGEMENT CANCELLED IT / ECOSYSTEM RESISTANCE**: In the mid-1990s, US Department of Energy and LLNL management redirected supercomputing budgets to the Accelerated Strategic Computing Initiative (ASCI) using commodity clusters running MPI and C++/Fortran. Funding for Sisal was abruptly cut in 1995.
* **What Survived**:
  * **Copy Elimination Theory**: David Cann's algorithms for proving when functional updates can be transformed into in-place mutations became the foundation of modern functional compiler backends.
  * Single-assignment IR representations directly inspired modern **SSA Form** (Static Single Assignment).
* **Where Its Ideas Resurfaced**:
  * **Rust’s Ownership & Borrow Checker**: Rust achieves compile-time in-place mutation without copying by using affine types and linear lifetimes—the exact goal Sisal achieved via dataflow graph analysis!
  * **MLIR Affine & Linalg Dialects**: Lowering functional array operations into in-place buffer allocations (Bufferization pass in LLVM/MLIR).
* **What Modern Hardware Changes**: Modern CPUs penalize memory allocation and memory copies far more severely than 1980s Crays due to the Memory Wall. Eliminating redundant copies is now worth a 10x speedup rather than a 20% speedup!
* **Could It Work Now?**: **YES**: Modern compilers (like Futhark for GPUs or Koka for Perceus reference counting) use Sisal's exact copy-elimination principles to beat imperative code today.
* **Could Rubix Implement a Descendant?**:
  **YES**: Rubix can implement **Single-Assignment In-Place Bufferization (Copy Elision)**: When a vector or compound collection is passed into a function and modified, if the compiler proves via liveness analysis that the caller never references the original collection again, the compiler elides memory allocation and mutates the buffer in-place!
