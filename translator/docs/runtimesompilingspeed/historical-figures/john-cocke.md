# Historical Figure Profile: John Cocke (1925–2002)

* **Person/System**: John Cocke / IBM Research (IBM 801, PL.8 Compiler)
* **Era**: 1970s–1980s (Father of RISC Architecture and Modern Global Optimization)
* **Problem They Attacked**:
  Hardware architects were adding increasingly baroque CISC instructions in hardware microcode. Compilers rarely used these instructions, while the hardware complexity slowed down the clock rate of every instruction.
* **Their Key Idea**:
  Co-design the hardware and the compiler: strip hardware down to simple, single-cycle RISC instructions (IBM 801), and delegate global optimization (strength reduction, global CSE, dominator-based loop analysis, and register allocation) to an optimizing compiler (PL.8).
* **Original Evidence**:
  Cocke, J. & Allen, F. E., *"A Catalogue of Optimizing Transformations"*, 1972.
  Cocke, J. & Markstein, V., *"Measurement of Program Improvement by the IBM 801 Compiler"*, 1980.
  Cocke received the ACM A.M. Turing Award (1987) and National Medal of Technology.
* **Hardware Context**:
  IBM 801 minicomputer (1975–1980), the world's first true RISC computer, featuring single-cycle execution, 32 general-purpose registers, separate data/instruction caches, and no microcode.
* **Why It Mattered**:
  Cocke proved that an aggressively optimizing compiler paired with a streamlined RISC processor would vastly outperform complex CISC processors. This sparked the entire RISC revolution (MIPS, SPARC, ARM, PowerPC).
* **What Survived**:
  Global common subexpression elimination, dominator trees, strength reduction, graph coloring register allocation (co-invented with Chaitin), and RISC philosophy.
* **What Failed**:
  Early attempts to eliminate all hardware interlocks; hardware had to retain branch prediction and memory disambiguation as pipelines deepened.
* **Modern Equivalent**:
  LLVM / GCC middle-end optimization suites targeting modern ARM64 and RISC-V architectures.
* **Potential Relevance to Rubix**:
  Rubix should emit simple, orthogonal instructions or IR operations rather than attempting to synthesize monolithic, high-level composite runtime calls. Let the compiler decompose complex expressions into lean primitives that SSA passes can simplify.
