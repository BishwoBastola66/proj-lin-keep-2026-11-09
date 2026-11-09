# Dead Systems Dossier: Thinking Machines CM-2, CM-5 & *Lisp / CM Fortran (1983–1994)

* **Project**: Thinking Machines Connection Machine (CM-1, CM-2, CM-5) & Data-Parallel Compilers (*Lisp, CM Fortran, C*)
* **Years**: 1983–1994
* **People**: W. Daniel Hillis (MIT), Guy L. Steele Jr. (co-creator of Scheme), Brewster Kahle, Cliff Lasser
* **Organization**: Thinking Machines Corporation (Cambridge, MA) & MIT AI Lab
* **Language**: *Lisp ("Star Lisp"), CM Fortran (Fortran 90 array extensions), C* ("C-Star")
* **Target Hardware**:
  * CM-1 / CM-2 (1985–1987): Massively parallel SIMD architecture: 65,536 1-bit processors organized in a 12-dimensional Boolean hypercube network, controlled by a front-end VAX or Sun-4 sequencer.
  * CM-5 (1991): MIMD architecture: up to 1,024 SPARC processors with custom vector units connected via a "Fat-Tree" packet routing network.
* **Target OS**: CMOST (extended SunOS / Unix)
* **Compiler Architecture**:
  Data-Parallel Frontend $\to$ Virtual Processor (VP) Ratio Slicing $\to$ Array Shape Layout Optimization $\to$ Hypercube Inter-Processor Communication Router Scheduling $\to$ Microcoded Paris (Parallel Instruction Set) or Native SPARC+Vector Machine Code.
* **Runtime Architecture**: Host-accelerator model: front-end workstation issued scalar instructions; vector/hypercube data-parallel array operations were broadcast to 65,536 worker nodes.
* **Original Problem**: Von Neumann single-processor computers were fundamentally sequential ("von Neumann bottleneck"). The human brain processes information via billions of simple interconnected neurons operating simultaneously.
* **Original Goal**: Build a massively parallel "thinking machine" with 65,536 processors to conquer artificial intelligence, computer vision, and scientific supercomputing.
* **Design Philosophy**:
  **Data Parallelism**: The programmer writes operations over entire multi-dimensional arrays or sets ("pvars" in *Lisp). The compiler and hardware assign one physical processor (or virtual processor slice) to *every single element of data*.
* **Optimization Philosophy**:
  1. *Virtual Processor (VP) Ratio Minimization*: When dataset size $N > 65,536$, slicing each physical 1-bit processor into time-multiplexed virtual processors.
  2. *Hypercube Routing Optimization*: Minimizing inter-processor communication distance across the 12-dimensional hypercube.
* **Compilation Strategy**: Data-parallel array expansion; AOT cross-compilation from host workstation.
* **Runtime Strategy**: Synchronous SIMD lockstep execution (CM-2); message-passing MIMD execution (CM-5).
* **Memory Model**: Distributed memory with explicit parallel array variables (`pvars`).
* **Concurrency Model**: Massively parallel SIMD (Single Instruction, Multiple Data).
* **Type System**: Standard scalar types augmented with parallel dimension types (e.g., `(pvar (array integer (1024 1024)))`).
* **Code-Generation Strategy**: Emitted low-level PARIS microcode or customized SPARC assembly driving memory-mapped network routers.
* **What They Believed**: That massive fine-grained SIMD parallelism with 65,536 1-bit ALUs would render traditional pipelined scalar supercomputers (Cray) obsolete.
* **What They Attempted**: Building the world's most powerful parallel supercomputers, famous for their stunning visual black-cube chassis with flashing red LEDs.
* **What Worked**:
  * On problems with natural regular data grids (image processing, seismic wave modeling, cellular automata), CM-2 shattered world supercomputing records, achieving multiple GFLOPS in 1987!
  * Guy Steele’s design of *Lisp and CM Fortran laid the conceptual foundations for the Fortran 90 array syntax and modern data-parallel array languages.
* **What Failed**:
  1. *Severe Irregular Data Bottleneck*: When computations required irregular communication (pointer chasing, sparse graphs), the hypercube network router suffered severe packet collisions and stalled, dropping efficiency to under 5% of peak.
  2. *Single-Bit ALU Slowness*: Each processor was only 1-bit wide. Performing a 64-bit double-precision floating-point addition took thousands of clock cycles of bit-serial arithmetic until floating-point Weitek chips were retrofitted.
  3. *Defense Spending Cuts (Peace Dividend)*: The end of the Cold War (1989–1991) gutted DARPA funding and national laboratory supercomputer budgets.
* **What Was Unfinished**: Unified shared-memory programming models without manual array alignment declarations.
* **Why It Died**:
  * **FUNDING ENDED / ECONOMICALLY FAILED / HARDWARE EVOLUTION**: Thinking Machines filed for Chapter 11 bankruptcy in August 1994. Cheap clusters of commodity workstations (Beowulf clusters) and out-of-order superscalar microprocessors delivered better price-to-performance.
* **What Survived**:
  * The **Data-Parallel Programming Model**: Guy Steele’s CM Fortran array operations (`A = B + C` where $A, B, C$ are multidimensional arrays) directly survived into Fortran 90, NumPy (`ndarray`), Julia, and PyTorch tensors!
  * The Fat-Tree interconnect network topology (Charles Leiserson) invented for the CM-5 became the universal network architecture of modern data centers (InfiniBand, PCIe switches, AWS data center fabrics).
* **Where Its Ideas Resurfaced**: **Modern GPUs (NVIDIA CUDA / AMD ROCm)**: A modern NVIDIA Blackwell GPU containing tens of thousands of CUDA cores executing warps of data-parallel threads is the exact technological reincarnation of Daniel Hillis's 65,536-processor Connection Machine!
* **What Modern Hardware Changes**: Modern GPUs have 32-bit/64-bit wide vector ALUs, multi-terabyte/sec HBM memory bandwidth, and hardware memory coalescing, resolving the 1-bit serial slowness and router contention of 1985.
* **Could It Work Now?**: **Yes**: GPUs and TPUs dominate modern AI computing today using Thinking Machines' exact data-parallel model.
* **Could Rubix Implement a Descendant?**:
  Rubix can implement **High-Level Array Comprehensions & Vector Kernels**: Exposing native syntax for element-wise array math that the compiler lowers directly to SIMD vector loops or GPU accelerator compute passes.
