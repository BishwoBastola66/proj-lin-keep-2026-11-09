# Dead Systems Dossier: HP Dynamo Dynamic Native Optimizer (1998–2002)

* **Project**: Dynamo (Dynamic Optimizer)
* **Years**: 1998–2002
* **People**: Vasanth Bala, Evelyn Duesterwald, Sanjeev Santhanam
* **Organization**: Hewlett-Packard Laboratories (Cambridge, MA)
* **Language**: HP PA-RISC native machine code (PA-8000 binary executable)
* **Target Hardware**: HP PA-RISC 8000 series (64-bit out-of-order processors)
* **Target OS**: HP-UX
* **Compiler Architecture**:
  Native Binary Interpreter $\to$ Backward Branch Counter Profiler $\to$ Hot Trace Selector $\to$ Redundancy Elimination & Constant Folding Optimizer $\to$ Native Code Emitter $\to$ Fragment Code Cache.
* **Runtime Architecture**: User-space dynamic binary re-writer; intercepted binary execution at entry point without kernel modifications.
* **Original Problem**: Statically compiled and optimized C/Fortran production binaries (`-O3`) still suffered from inefficiencies because static compilers could not see dynamic runtime call frequencies, memory aliasing, or branch probabilities.
* **Original Goal**: Make fully compiled, production-optimized native binaries run *faster* by running them inside a dynamic binary optimizer than they ran running natively on the bare metal CPU!
* **Design Philosophy**:
  > *"Software should observe its own execution at runtime, extract hot traces across subroutine and library boundaries, and optimize code specifically for the observed data flow."*
* **Optimization Philosophy**:
  **Trace Extraction (Hot Path Inlining)**:
  1. Most programs spend 90% of time in a small fraction of code.
  2. A trace is a single-entry, multi-exit sequence of instructions across function calls and branches.
  3. By copying these instructions into a contiguous memory cache ("Fragment Cache"), Dynamo:
     * Inlined cross-library calls dynamically.
     * Straightened branches: fall-through branches replaced conditional jumps.
     * Performed partial redundancy elimination on the trace.
* **Compilation Strategy**: Dynamic trace JIT compilation from native machine code.
* **Runtime Strategy**: Interpretation of cold code; execution from fragment cache for hot code.
* **Memory Model**: Identical to native PA-RISC.
* **Concurrency Model**: Single thread / multithreaded process space.
* **Type System**: Raw untyped machine instructions.
* **Code-Generation Strategy**: Trace stitching: exiting a trace branched directly to the entry of another cached trace, bypassing the interpreter entirely.
* **What They Believed**: That dynamic runtime optimization could surpass static compilation by exploiting runtime invariants.
* **What They Attempted**: Demonstrating that Dynamo could accelerate binaries compiled with HP’s best static optimizer (`+O4`).
* **What Worked**:
  * Bala et al. published the landmark paper in PLDI 2000 (*"Dynamo: A Transparent Dynamic Optimization System"*).
  * On real SPECint95 benchmarks compiled with `-O2` and `-O4`, Dynamo achieved **up to 18% speedups over the native binary running directly on hardware**!
  * Demonstrated that eliminating indirect branch mispredictions and improving instruction cache locality was worth the overhead of dynamic instrumentation.
* **What Failed**:
  * *High Startup Overhead*: On short-running programs, the cost of interpreting and profiling consumed more time than could be recovered by hot traces.
  * *Code Cache Thrashing*: On programs with large, flat, non-repeating execution profiles (e.g., compilers or database engines), the fragment cache filled up, causing constant evictions.
* **What Was Unfinished**: Automatic persistence of optimized traces to disk across application runs.
* **Why It Died**:
  * **RESEARCH GOAL COMPLETED / IDEA ABSORBED ELSEWHERE**: Dynamo was an HP Labs research project that proved its thesis. HP shifted corporate resources to Itanium (IA-64), and Dynamo was retired as a standalone product.
* **What Survived**:
  * Directly inspired the modern field of Dynamic Binary Translation and Instrumentation:
    * **DynamoRIO** (Derek Bruening, MIT/Google): High-performance binary instrumentation framework.
    * **Valgrind** (Julian Seward): Memory debugging via binary translation.
    * **QEMU TCG**: Tiny Code Generator dynamic binary translator.
* **Where Its Ideas Resurfaced**: Modern profile-guided binary optimizers (**BOLT** at Meta, **Propeller** at Google) execute Dynamo’s trace straightening and basic-block fall-through optimizations *offline* using hardware LBR logs, gaining all of Dynamo's speedups with zero runtime overhead!
* **What Modern Hardware Changes**: Modern CPUs have hardware PMU and Last Branch Record (LBR) registers, eliminating the need to interpret instructions just to count branches.
* **Could It Work Now?**: **Yes**: Modern post-link optimizers (BOLT) are the direct offline manifestation of Dynamo.
* **Could Rubix Implement a Descendant?**:
  Rubix can adopt Dynamo's **Trace Straightening**: When generating machine code, place the expected successor block contiguously in memory to eliminate unconditional jump instructions and exploit CPU hardware prefetchers.
