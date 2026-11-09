# Historical Figure Profile: David Patterson & John Hennessy

* **Person/System**: David A. Patterson (UC Berkeley / RISC-I/II) & John L. Hennessy (Stanford University / MIPS)
* **Era**: 1980s–Present (The RISC Revolution & Quantitative Computer Architecture)
* **Problem They Attacked**:
  Computer architects in the late 1970s designed increasingly complicated instruction sets (CISC) under the false belief that matching high-level language constructs in hardware made computers faster. The resulting microcoded machines were bloated, slow, and difficult for compilers to target effectively.
* **Their Key Idea**:
  **Quantitative Computer Architecture & Reduced Instruction Set Computers (RISC)**:
  Make the hardware simple, streamlined, and fast. Implement only orthogonal instructions that execute in a single clock cycle ($CPI = 1$). Use pipelining, dedicated load/store memory operations, and a large uniform register file. Leave optimization and code generation to smart optimizing compilers.
  Co-authored the foundational textbook *"Computer Architecture: A Quantitative Approach"* (1990).
* **Original Evidence**:
  Patterson, D. A. & Ditzel, D. R., *"The Case for the Reduced Instruction Set Computer"*, ACM SIGARCH Computer Architecture News, 1980.
  Hennessy, J. L. et al., *"Hardware/software tradeoffs for increased performance"*, ASPLOS, 1982.
  Hennessy, J. L. & Gross, T. R., *"Postpass code optimization of pipeline constraints"*, ACM TOPLAS, 1983.
  Joint winners of the ACM A.M. Turing Award (2017).
* **Hardware Context**:
  Berkeley RISC-I/II, Stanford MIPS, MIPS R2000, Sun SPARC, DEC Alpha, ARM, and RISC-V.
* **Why It Mattered**:
  Hennessy and Patterson transformed computer design from an intuitive, artisanal craft into an empirical, data-driven science governed by the Iron Law of Processor Performance:
  $$\text{CPU Time} = I \times CPI \times T_c$$
  Every modern high-performance processor (including the internal execution core of modern x86 chips, Apple Silicon, and ARM/RISC-V) is fundamentally a RISC engine.
* **What Survived**:
  Load/store architecture, pipelining, quantitatively driven compiler/hardware co-design, RISC-V ISA (championed by Patterson).
* **What Failed**:
  Hardware register windows (SPARC) and exposed pipeline branch delay slots (MIPS), which proved harmful to deeper pipelining and superscalar execution.
* **Modern Equivalent**:
  ARM64, Apple Silicon M-series, RISC-V RV64GCV.
* **Potential Relevance to Rubix**:
  Rubix's compiler and bytecode design should adhere to RISC principles: simple, orthogonal instructions that compose cleanly. Complex composite operations should be broken down into lean primitives that can be independently scheduled, hoisted, or folded.
