# Historical Figure Profile: Gregory Chaitin (1947–)

* **Person/System**: Gregory J. Chaitin / IBM Research (Graph-Coloring Register Allocation)
* **Era**: Late 1970s–1980s (Register Allocation & Spilling)
* **Problem They Attacked**:
  Register allocation was historically handled by ad-hoc, brittle heuristics. When program variables exceeded the number of available hardware registers, compilers frequently made poor spilling decisions, flooding hot inner loops with memory load/store operations.
* **Their Key Idea**:
  Formulate global register allocation as graph vertex $K$-coloring (where $K$ is the number of machine registers).
  Two live ranges that are simultaneously active interfere and are connected by an edge.
  Kempe's heuristic was adapted: iteratively find a node with degree $< K$, push it onto a stack, and remove it from the graph. If all nodes have degree $\ge K$, select a node with minimum spill cost $\frac{\text{spill\_cost}}{\text{degree}}$ to spill to memory. When popping the stack, assign an unused color (register).
* **Original Evidence**:
  Chaitin, G. J., Auslander, M. A., Chandra, A. K., Cocke, J., Hopkins, M. E., & Markstein, P. W., *"Register allocation via coloring"*, Computer Languages, 1981.
  Chaitin, G. J., *"Register allocation & spilling via graph coloring"*, ACM SIGPLAN Notices, 1982.
* **Hardware Context**:
  IBM 801 RISC architecture with 32 general-purpose registers.
* **Why It Mattered**:
  Chaitin's formulation turned register allocation from an unpredictable heuristic into an elegant graph-theoretic optimization. It established that global register allocation over procedures is solvable in near-linear time in practice.
* **What Survived**:
  Graph-coloring register allocation (refined by Briggs' optimistic coloring in 1989), live range coalescing, and interference graph construction.
* **What Failed**:
  Pure graph coloring can be slow for rapid JIT compilation due to quadratic $O(V^2)$ interference graph construction overhead, which led to Linear Scan Register Allocation (Poletto & Sarkar, 1999) in JITs.
* **Modern Equivalent**:
  Chaitin-Briggs register allocators in GCC and LLVM (`RegAllocPBQP` and Iterated Register Coalescing).
* **Potential Relevance to Rubix**:
  For an optimizing AOT backend, Chaitin-style graph coloring ensures maximum register utilization. For a fast debug compiler or JIT, Poletto & Sarkar's Linear Scan register allocator provides 90% of the quality at a fraction of the compile-time cost.
