# Historical Figure Profile: Lois Haibt (1934–)

* **Person/System**: Lois Mitchell Haibt / Section 4 & 5 of IBM FORTRAN I Compiler (1954–1957)
* **Era**: 1950s (Early Computing & The Origin of Control-Flow Analysis)
* **Problem They Attacked**:
  The IBM 704 had only 3 hardware index registers. Fortran programs had arbitrarily many nested loops and array indexing operations. How does a compiler decide which variables stay in the 3 index registers and which get spilled to slow core memory, without executing the code?
* **Their Key Idea**:
  Construct a graph of the program's basic blocks, compute loop nesting depths, and use a simulated probabilistic execution model (Monte Carlo branch frequency estimation) to compute hot paths. Allocate the precious 3 index registers exclusively to the hottest loops, placing spill/restore code in cold blocks.
* **Original Evidence**:
  Haibt, L. M., *"A program to draw multilevel flow charts"*, Western Joint Computer Conference, 1959.
  Backus et al., *"The FORTRAN Automatic Coding System"*, 1957 (describing Section 4 & 5).
* **Hardware Context**:
  IBM 704 (3 index registers: A, B, C; 4K core memory words). Register spills incurred direct memory load/store instruction costs.
* **Why It Mattered**:
  Haibt was the sole woman on the original FORTRAN team and independently invented the foundational concepts of control-flow graphs, loop frequency estimation, and frequency-driven register allocation—decades before these were formalized in academic literature.
* **What Survived**:
  Weighting optimizations by basic block execution frequency; loop header register hoisting; frequency-weighted spill costs.
* **What Failed**:
  Simulated probabilistic flow without runtime profile feedback was inaccurate on input-dependent branches.
* **Modern Equivalent**:
  Profile-Guided Optimization (PGO), Static Branch Prediction Heuristics (Ball-Larus heuristics in LLVM/GCC), and hot/cold block splitting.
* **Potential Relevance to Rubix**:
  In Rubix's compiler, when allocating registers or scheduling instructions, loops and hot basic blocks must be prioritized. Frequency weighting ensures spill instructions are pushed to cold paths.
