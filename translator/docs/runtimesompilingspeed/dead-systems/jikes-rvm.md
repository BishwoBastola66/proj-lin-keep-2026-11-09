# Dead Systems Dossier: IBM Jikes RVM / Jalapeño (1997–2010s)

* **Project**: Jikes Research Virtual Machine (originally Jalapeño)
* **Years**: 1997–2010s
* **People**: Bowen Alpern, C. Randy Sears, Matthew Arnold, Stephen Fink, David Grove, Michael Hind
* **Organization**: IBM Thomas J. Watson Research Center & Academic Community
* **Language**: Java executing Java (Meta-circular)
* **Target Hardware**: PowerPC, IA-32 (x86), AMD64
* **Target OS**: AIX, Linux, macOS
* **Compiler Architecture**:
  No interpreter! Pure multi-tiered compiler architecture:
  Baseline Compiler (quick template JIT) $\to$ Adaptive Optimization System (AOS: online sampling with PMU) $\to$ Optimizing Compiler (High-level IR SSA $\to$ Low-level IR $\to$ Machine IR $\to$ Register Allocation).
* **Runtime Architecture**: **Meta-circular VM**: The runtime itself (thread scheduler, object layout, memory allocator, garbage collectors via MMTk) was written entirely in Java, with no C/C++ runtime layer!
* **Original Problem**: Commercial JVMs (HotSpot, IBM J9) were massive, proprietary C++ codebases with high maintenance barriers, making academic research into advanced JIT optimizations and garbage collectors exceedingly difficult.
* **Original Goal**: Build a high-performance Java virtual machine written completely in Java, proving that meta-circularity does not compromise performance while creating the premier testbed for systems research.
* **Design Philosophy**:
  > *"Java is a systems programming language. If the runtime is written in Java, the JIT compiler can optimize the runtime itself, inlining runtime checks and memory allocators directly into application code."*
* **Optimization Philosophy**:
  **MMTk (Memory Management Toolkit) & AOS**:
  1. *Compile-Only Architecture*: Eliminate the interpreter; compile all bytecodes immediately with the baseline compiler to avoid dual-mode stack transitions.
  2. *Online Controller*: Uses cost-benefit models:
     $$\text{Benefit} = (\text{Speedup} \times \text{Expected Future Time}) - \text{Compilation Cost}$$
     Compiles hot methods with higher optimization tiers only when the predicted future execution time pays off the compilation tax.
* **Compilation Strategy**: Tier 0 Baseline JIT $\to$ Tier 1 Optimizing JIT $\to$ Tier 2 Aggressive Inlining JIT.
* **Runtime Strategy**: Fully managed, garbage-collected via MMTk (semi-space, generational, Mark-Sweep, Immix).
* **Memory Model**: Java Memory Model.
* **Concurrency Model**: Java threads mapped to OS pthreads or M:N user-level green threads.
* **Type System**: Java statically typed object system with runtime reflection.
* **Code-Generation Strategy**: Direct native assembly emission.
* **What They Believed**: That a meta-circular VM could match or beat C++-implemented VMs by applying JIT optimizations recursively to itself.
* **What They Attempted**: Building an industrial-grade production server JVM for IBM AIX and Linux servers.
* **What Worked**:
  * Jikes RVM became the most successful academic VM in computer science history, generating hundreds of seminal papers on garbage collection (including Immix GC) and adaptive profiling.
  * MMTk proved that garbage collectors could be built modularly with near-zero overhead.
  * Inlining runtime allocation stubs directly into user code proved highly effective.
* **What Failed**:
  * *Bootstrapping Fragility & "Chicken-and-Egg" Pathology*: Compiling Java using a VM written in Java required a special "boot image runner" that froze an in-memory Java heap to disk as an ELF binary. Any bug in the garbage collector or JIT compiler during bootstrap produced incomprehensible low-level memory faults that were notoriously difficult to debug.
  * *High Memory Footprint*: Because the VM’s own data structures were Java objects with standard headers and garbage-collection overhead, Jikes RVM consumed significantly more RAM than C++-based JVMs like HotSpot.
* **What Was Unfinished**: Full adoption by IBM as a replacement for the commercial J9 JVM.
* **Why It Died**:
  * **RESEARCH GOAL COMPLETED / ECOSYSTEM SHIFT**: Jikes achieved its academic research mission. Oracle’s **GraalVM** (which implements a Java-in-Java optimizing compiler using JVMCI) emerged in the 2010s with corporate backing, absorbing many of Jikes' core contributors and ideas.
* **What Survived**:
  * **MMTk (Memory Management Toolkit)**: Survived and was recently rewritten in Rust, now used as a high-performance GC backend for OpenJDK, Julia, and V8!
  * Cost-benefit driven adaptive compilation controllers.
* **Where Its Ideas Resurfaced**: **GraalVM / Truffle** (Oracle Labs): Writing JIT compilers in high-level managed languages and compiling them via AOT or substrate VM.
* **What Modern Hardware Changes**: Modern servers have hundreds of gigabytes of RAM, diminishing the memory footprint penalty that previously penalized meta-circular runtimes.
* **Could It Work Now?**: **Yes**: GraalVM proves that meta-circular compiler components in managed languages are commercially viable in 2026.
* **Could Rubix Implement a Descendant?**:
  Rubix is already self-hosting! Jikes proves that **Rubix’s compiler can compile Rubix’s own runtime**: runtime memory allocators and collections written in `.bix` can be inlined directly into user code by the compiler, eliminating foreign function call (FFI) overhead.
