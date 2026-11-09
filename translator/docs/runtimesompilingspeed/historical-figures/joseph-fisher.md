# Historical Figure Profile: Joseph A. Fisher (1945–)

* **Person/System**: Joseph A. Fisher / Yale University & Multiflow Computer (Trace Scheduling & VLIW)
* **Era**: 1980s (Instruction-Level Parallelism and VLIW Architectures)
* **Problem They Attacked**:
  Instruction-level parallelism (ILP) within a single basic block is inherently limited to 2 to 3 instructions due to data dependencies. How can a processor execute 8, 16, or 28 instructions in parallel per clock cycle?
* **Their Key Idea**:
  **Trace Scheduling**: Concatenate sequences of basic blocks along the most frequently executed execution path into a "trace". The compiler schedules instructions across the entire trace simultaneously as if it were a single large basic block, packing them into wide Very Long Instruction Word (VLIW) instruction packets.
  Crucially, Fisher proved that correctness can be maintained by inserting **compensation code** on off-trace branches (copies of hoisted or delayed operations along side exits and join points).
* **Original Evidence**:
  Fisher, J. A., *"Trace scheduling: A technique for global microcode compaction"*, IEEE Trans. Comput., 1981.
  Ellis, J. R., *"Bulldog: A Compiler for VLIW Architectures"*, MIT Press, 1986.
  Fisher, J. A., Faraboschi, P., & Young, C., *"Embedded Computing: A VLIW Approach to Architecture, Compilers and Tools"*, 2005.
* **Hardware Context**:
  Multiflow TRACE computers (1987), packing 7, 14, or 28 functional units per instruction word with static lockstep execution.
* **Why It Mattered**:
  Fisher invented VLIW and demonstrated that global instruction scheduling across control-flow edges could extract massive instruction-level parallelism.
* **What Survived**:
  Trace scheduling concepts, loop unrolling and software pipelining (Modulo Scheduling by Rau et al.), compensation code theory, and VLIW in DSPs/embedded systems.
* **What Failed**:
  VLIW failed for general-purpose server/desktop computing (Multiflow ceased operations in 1990; Intel Itanium IA-64 struggled) because compile-time static schedules could not tolerate unpredictable DRAM cache misses and branch variability.
* **Modern Equivalent**:
  Modern GPU execution units (SIMT / warp scheduling), digital signal processors (Qualcomm Hexagon VLIW), and trace-based JIT compilers.
* **Potential Relevance to Rubix**:
  Trace formation is a powerful technique for Rubix's code layout. Emitting hot paths as straight-line traces improves instruction cache hit rates and eliminates branch prediction penalties.
