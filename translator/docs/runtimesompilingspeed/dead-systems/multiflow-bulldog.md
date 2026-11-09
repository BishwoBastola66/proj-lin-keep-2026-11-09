# Dead Systems Dossier: Multiflow Bulldog & TRACE VLIW (1984–1990)

* **Project**: Multiflow TRACE Computers & Bulldog Optimizing Compiler
* **Years**: 1984–1990
* **People**: Joseph A. Fisher, John R. Ellis, Robert P. Colwell, Woody Lichtenstein
* **Organization**: Multiflow Computer, Inc. & Yale University
* **Language**: FORTRAN, C
* **Target Hardware**: Multiflow TRACE 7/300, 14/300, 28/300 (VLIW: 7, 14, or 28 32-bit operations packaged into 256-bit to 1024-bit instruction words)
* **Target OS**: TRACE / UNIX (BSD 4.3 derivative)
* **Compiler Architecture**: Bulldog Compiler: Frontend $\to$ Loop Unrolling & Memory Disambiguation $\to$ Trace Selection $\to$ Trace Scheduling with Compensation Code Generation $\to$ VLIW Code Emission.
* **Runtime Architecture**: Static bare-metal execution; no dynamic runtime or JIT.
* **Original Problem**: Single-instruction issue CPUs could not extract more than 2–3 instructions of instruction-level parallelism (ILP) within basic blocks due to data dependencies.
* **Original Goal**: Build a commercial supercomputing workstation that achieved vector-supercomputer speeds on standard sequential scalar code without requiring explicit vectorization.
* **Design Philosophy**: Shift all scheduling complexity from silicon to the compiler. The compiler has unlimited time to plan optimal parallel schedules; the hardware executes statically in lockstep.
* **Optimization Philosophy**: **Trace Scheduling**: Concatenate frequent basic blocks into long execution traces. Schedule instructions across the entire trace simultaneously, inserting compensation code on off-trace exits.
* **Compilation Strategy**: Ahead-Of-Time (AOT) static compilation with massive trace unrolling.
* **Runtime Strategy**: Unmanaged, deterministic lockstep execution.
* **Memory Model**: Flat physical memory; interleaved banks with deterministic latency.
* **Concurrency Model**: Pure instruction-level parallelism (ILP); single thread issuing wide VLIW words.
* **Type System**: Fortran/C static types.
* **Code-Generation Strategy**: Pack independent operations into wide instruction words across multiple functional units (integer ALUs, floating-point multipliers, memory ports, branch units).
* **What They Believed**: That static compiler analysis and profiling could anticipate all runtime execution delays and optimize instruction schedules better than any dynamic hardware logic.
* **What They Attempted**: Building wide 28-ALU VLIW hardware with 1024-bit instruction words coordinated entirely by the Bulldog compiler.
* **What Worked**: Trace scheduling worked brilliantly for numeric scientific code with predictable loops, achieving 5x–10x speedups over contemporary scalar workstations.
* **What Failed**:
  1. *Unpredictable Memory Latencies*: As DRAM cache hierarchies developed, the compiler could not predict whether a memory load would hit cache or miss to DRAM. If a load missed, the entire 28-ALU VLIW processor had to freeze in lockstep.
  2. *Code Bloat from Compensation Code*: Scheduling across multiple branches caused compensation code to explode, overflowing instruction caches.
* **What Was Unfinished**: Dynamic memory disambiguation and adaptive latency tolerance.
* **Why It Died**:
  * **ECONOMICALLY FAILED / HARDWARE LIMITATION**: Out-of-order superscalar processors (Pentium Pro, MIPS R10000) arrived in the mid-1990s and discovered ILP dynamically at runtime without compiler compensation code bloat. Multiflow ran out of capital and closed in 1990.
* **What Survived**:
  * Trace scheduling principles; software pipelining (Modulo Scheduling); loop unrolling and critical path scheduling in GCC and LLVM.
* **Where Its Ideas Resurfaced**: Digital Signal Processors (Qualcomm Hexagon, TI C6000), Intel Itanium (IA-64), GPU warp schedulers, and trace-based JITs (TraceMonkey, PyPy).
* **What Modern Hardware Changes**: Modern CPUs have 500+ entry Reorder Buffers (ROBs) and non-blocking caches that resolve unpredictable memory latencies dynamically.
* **Could It Work Now?**: For general-purpose CPUs: **No**. For deterministic domain-specific AI/tensor accelerators (Google TPU, Groq LPU): **Yes**, Groq operates on pure compiler-scheduled VLIW-like execution!
* **Could Rubix Implement a Descendant?**:
  Rubix can adopt **Trace Formation for Code Layout**: Group hot basic blocks along the most likely path into contiguous memory traces to eliminate taken jumps and maximize L1I / BTB hit rates.
