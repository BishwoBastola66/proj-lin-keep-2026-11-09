# The Science and History of Program Execution Speed & Compilation Speed

## Master Performance Knowledge Base & Synthesis

This repository is an exhaustive, research-first technical compendium detailing how humanity learned to make computer programs execute faster and compilers compile faster. It traces the lineage of performance engineering from the 1940s through 2026 modern multi-architecture systems, synthesizing historical evidence, microarchitectural physics, mathematical theory, living architectures, dead systems, forgotten ideas, and practical compiler implementations.

---

## 1. Historical Synthesis

### Where Did Compiler Optimization Begin?
Compiler optimization began with the **IBM FORTRAN I project (1954–1957)** led by John Backus, Lois Haibt, Peter Sheridan, David Sayre, and Harlan Herrick for the IBM 704 vacuum-tube mainframe.

### Why Did It Begin?
In 1954, operating an IBM 704 rented for over \$30,000/month (\$300–\$600 per machine hour). Management and programmers believed that no high-level programming language could ever replace hand-crafted assembly. If the code emitted by an automatic compiler ran even 10%–20% slower than expert human assembly, the system would be economically inviable. As John Backus stated, optimization was an **existential necessity**; without it, high-level languages would have died in infancy.

### What Were the Earliest Optimization Problems?
1. **Extreme Register Scarcity**: The IBM 704 had only 3 hardware index registers. Every loop and array index had to compete for these 3 registers. Spilling cost slow magnetic core memory cycles.
2. **Strength Reduction**: Array subscript multiplication was expensive; compilers had to automatically transform `i * stride` into successive register additions.
3. **Common Subexpression Elimination**: Identifying redundant arithmetic across expressions to avoid costly multi-cycle vacuum tube multiplications.
4. **Frequency Estimation**: Lois Haibt pioneered Monte Carlo simulated execution flow to determine loop hotness before profiling tools existed.

### Which Ideas Survived?
* Basic Blocks and Control Flow Graphs (Allen, 1969).
* Reaching definitions, available expressions, and liveness analysis (Allen & Cocke, 1969; Kildall, 1973).
* Graph-coloring register allocation (Chaitin, 1981).
* Dominator trees (Lengauer & Tarjan, 1979).
* Loop induction variable strength reduction and Loop-Invariant Code Motion (LICM).
* Static Single Assignment (SSA) form (Cytron et al., 1991).
* Polymorphic Inline Caching and speculative deoptimization (Chambers, Ungar, & Hölzle, 1989–1992).

---

## 2. Theoretical Foundations

### Why Do Optimizations Work?
Optimizations work because high-level source code introduces syntactic abstractions, redundant temporaries, and generic invariants that are not required for physical machine execution. Compilers exploit mathematical properties (monotone lattices, fixed-point theorems, graph coloring, algebraic equivalences) to strip away overhead and emit the minimal sequence of hardware operations that preserves observable program semantics.

### What Assumptions Do They Require?
* **Purity / Absence of Aliasing**: Assuming that memory writes to pointer $p$ do not modify memory read through pointer $q$.
* **Predictable Invariants**: Assuming variables inside a loop do not change across iterations (LICM).
* **Stable Control Flow**: Assuming execution paths observed in profiles represent typical production traffic.

### Where Do They Fail?
* When pointer aliasing is undecidable, forcing conservative pessimization.
* When code-growth transformations (unrolling, inlining) overflow CPU instruction caches (L1I) and iTLBs.
* When register pressure exceeds physical register counts, triggering expensive stack spills that cost more than the original computation.

---

## 3. Hardware Interplay

### How Does Modern CPU Architecture Affect Compiler Design?
Modern processors are wide, speculative, out-of-order execution engines with 400–600+ entry Reorder Buffers. Compilers no longer need to micromanage single-cycle ALU schedules; instead, compilers must:
1. Maximize Instruction-Level Parallelism (ILP) by breaking long serial dependency chains.
2. Structure memory accesses to match 64-byte cache line boundaries.
3. Minimize branch misprediction penalties by aligning hot fall-through paths.

### How Do Caches Affect Generated Code?
CPUs are compute monsters starving for data. Fetching data from off-chip DRAM takes ~60 ns (200+ cycles), whereas L1D cache takes ~1 ns (4 cycles). Cache blocking/loop tiling can increase arithmetic intensity by 50x–100x, turning memory-starved bandwidth bottlenecks into high-throughput compute kernels.

### How Do Branch Predictors Affect Control Flow?
Modern TAGE branch predictors achieve $>98\%$ accuracy on patterned branches. However, unpredictable data-dependent branches cost 15–20 cycle pipeline flushes. Compilers eliminate unpredictable branches using predication (`CMOV` instructions) and cluster hot basic blocks contiguously.

### How Do SIMD / Vector Units Affect Loops?
Fixed-width SIMD (AVX2/AVX-512/NEON) and Scalable Vectors (ARM SVE, RISC-V RVV) execute 4, 8, 16, or 32 data elements per cycle. Compilers must prove loop-carried independence, ensure contiguous memory alignment, and guard against non-contiguous gather/scatter operations that negate vector throughput.

### How Do Heterogeneous Cores & Accelerators Change Design?
Modern chips combine Performance (P) cores and Efficiency (E) cores (Intel Arrow Lake, Apple M-series), or pair CPUs coherently with GPUs via 900 GB/s buses (NVIDIA Grace Hopper). Runtimes must bind latency-sensitive tasks to P-cores, stream batch throughput to E-cores, and leverage unified coherent memory to eliminate explicit DMA PCIe copy latency.

---

## 4. Compiler Speed

### What Makes Compilation Slow?
* Allocating individual AST and IR nodes via general-purpose `malloc` and freeing them with recursive `free`.
* Non-linear ($O(N^2)$) optimization passes on massive monomorphized template/generic codebases.
* Invalidation of expensive analysis structures (recalculating Dominator Trees repeatedly).
* Single-threaded linkers struggling with symbol tables.

### What Makes Generated Code Fast?
* Lean SSA intermediate representations with Global Value Numbering (GVN) and Sparse Conditional Constant Propagation (SCCP).
* Scalar Replacement of Aggregates (SROA) via escape analysis, promoting heap allocations into registers.
* Vectorization and cache-line-aware loop layouts.

### How Can Compilation Itself Be Accelerated?
* **Bump Arena Allocators**: 2-instruction node allocation and instant $O(1)$ arena resets.
* **ThinLTO**: Parallelized whole-program cross-module optimization.
* **Mold Linker**: Parallel symbol resolution and relocation.
* **Compiler Self-Optimization**: Bootstrapping the compiler binary with PGO + BOLT to eliminate L1I and iTLB front-end stalls in the compiler executable itself.

---

## 5. Runtime Architecture

### What Makes Startup Slow?
* Dynamic linker symbol resolution and ELF relocation across dozens of `.so` libraries.
* JIT compiler warmup and initial bytecode verification.

### What Makes Dispatch Slow?
* Monolithic `switch` loops with indirect branches that thrash the CPU Branch Target Buffer (BTB).
* Deep virtual function table (`vtable`) lookups in dynamic object systems.

### What Makes Allocation Slow?
* General-purpose allocators managing fragmented free-lists with thread locks.
* Cache-line invalidation from cross-thread atomic increments in naive reference counting.

### What Makes JITs Fast & What Makes Them Expensive?
* **Why Fast**: Monomorphic Inline Caching (PIC), speculative method inlining, and type specialization eliminate dynamic dispatch, matching native C speed.
* **Why Expensive**: Heavy compilation latency competing with user threads, memory overhead for deopt metadata and JIT code caches, and deoptimization storms on polymorphic inputs.

---

## 6. Scientific Evidence Taxonomy

| Status | Optimization Technique | Empirical Reality |
| :--- | :--- | :--- |
| **Proven Universal** | Bump Arena Allocation in Compilers | 15%–25% compile-time speedup; zero fragmentation. |
| **Proven Universal** | SSA Form & Dominator Analysis | Linear-time optimization, optimal def-use tracking. |
| **Proven Universal** | Cache-Blocking / Loop Tiling | 10x–50x speedups on bandwidth-bound matrix/stencil code. |
| **Workload-Dependent** | Function Inlining | Speeds up small leaf calls; bloats code and destroys L1I cache if abused. |
| **Workload-Dependent** | SIMD Vectorization | Massively accelerates contiguous math; slows down sparse gathers. |
| **Workload-Dependent** | Multi-Threading | Accelerates embarrassingly parallel tasks; slows down under false sharing/locks. |
| **Workload-Dependent** | Profile-Guided Optimization (PGO) | 10%–20% gain on representative traffic; degrades on skewed microbenchmarks. |
| **Disappeared / Failed** | Pure Static General VLIW (IA-64) | Failed due to unpredictable DRAM cache misses. |
| **Disappeared / Failed** | Pure Tracing JITs for General Apps | Suffered trace tree explosion on real-world branching code. |
| **Disappeared / Failed** | Hardware Delay Slots | Destroyed pipeline backward compatibility as pipelines deepened. |

---

## 7. Master Research Library Sitemap

```text
docs/runtimesompilingspeed/
├── README.md                                          # Master synthesis & roadmap
├── performance-knowledge-graph.md                     # Bidirectional hardware-software feedback
├── original-quotations.md                             # Verified historical quotations & citations
├── rubix-mapping.md                                   # (Phase 27) Rubix codebase audit & mapping
│
├── history/                                           # Chronological history (1940s to 2026)
│   ├── 1940s.md                                       # Early stored-program & delay lines
│   ├── 1950s.md                                       # FORTRAN I, Backus, Haibt, Sheridan
│   ├── 1960s.md                                       # Formal theory, CFGs, Allen, Cocke
│   ├── 1970s.md                                       # Kildall lattices, Chaitin, Tarjan
│   ├── 1980s.md                                       # RISC revolution, VLIW, Patterson, Hennessy
│   ├── 1990s.md                                       # OoO execution, SSA, Self, HotSpot
│   ├── 2000s.md                                       # Multi-core, Dennard breakdown, LLVM
│   ├── 2010s.md                                       # ThinLTO, BOLT, AVX-512, TurboFan
│   ├── 2020s.md                                       # Chiplets, 3D V-Cache, Apple Silicon, RVV
│   ├── 2026-modern-era.md                             # Xeon 6, Zen 5, Grace Hopper, SPEC 2026
│   └── survived-vs-died.md                            # Comprehensive Survived vs Died matrix
│
├── historical-figures/                                # Deep profiles of computing pioneers
│   ├── john-backus.md                                 # Origin of compiler optimization
│   ├── lois-haibt.md                                  # First CFG, loop frequency analysis
│   ├── frances-allen.md                               # Formal data-flow, basic blocks, interval analysis
│   ├── john-cocke.md                                  # Father of RISC, global optimization, IBM 801
│   ├── ken-kennedy.md                                 # Data dependence theory, loop transformations
│   ├── robert-tarjan.md                               # Fast dominator trees, graph algorithms
│   ├── gregory-chaitin.md                             # Graph-coloring register allocation
│   ├── joseph-fisher.md                               # Trace scheduling and VLIW architectures
│   ├── patterson-and-hennessy.md                      # Quantitative computer architecture and RISC
│   ├── ungar-chambers-hoelzle.md                      # Adaptive optimization, inline caches, deopt
│   └── chris-lattner.md                               # Modular SSA IR, LLVM, MLIR
│
├── living-systems/                                    # Forensic analysis of surviving architectures
│   └── systems-analysis.md                            # FORTRAN, C, C++, Lisp, Java, JS, Rust, Go, LLVM
│
├── dead-systems/                                      # Complete dossiers on major dead projects
│   ├── multiflow-bulldog.md                           # Multiflow TRACE VLIW & Bulldog compiler
│   ├── intel-itanium-open64.md                        # Intel Itanium IA-64 & Open64 compiler
│   ├── transmeta-code-morphing.md                     # Transmeta Crusoe & Code Morphing Software
│   ├── hp-dynamo.md                                   # HP Dynamo native binary dynamic optimizer
│   ├── mozilla-tracemonkey.md                         # Mozilla TraceMonkey tracing JIT compiler
│   ├── jikes-rvm.md                                   # IBM Jikes RVM meta-circular Java VM
│   ├── thinking-machines-cm.md                        # Thinking Machines CM-2/CM-5 & *Lisp
│   ├── setl-optimizer.md                              # SETL & automatic data structure selection
│   ├── sisal.md                                       # Sisal functional language beating Fortran on Crays
│   └── dec-alpha-gem.md                               # DEC Alpha GEM optimizing compiler
│
├── failed-languages/                                  # Catalog of languages that died or were abandoned
│   └── catalog.md                                     # Algol 68, PL/I, Dylan, Cecil, Fortress, X10/Chapel
│
├── forgotten-ideas/                                   # Resurrectable forgotten concepts
│   └── catalog.md                                     # Superoperators, Customization, Linear Types, etc.
│
├── theory-only/                                       # Book-only and theoretical concepts
│   └── catalog.md                                     # Futamura Projections, Polyhedral Model, PCC, etc.
│
├── what-if/                                           # Counterfactual architecture experiments
│   └── counterfactual-experiments.md                  # Simulating SETL, Transmeta, Sisal on 2026 hardware
│
├── new-methods/                                       # Newly synthesized research methods
│   └── synthesized-methods.md                         # ADSS-CacheBlock, QuickTrace-PIC, LinearEscape-Bump
│
├── cpu-microarchitecture/                             # Modern CPU microarchitecture
│   ├── frontend.md                                    # Fetch, decode, uop cache, TAGE predictor
│   ├── execution-engine.md                            # OoO, ROB, Reservation Stations, Renaming
│   └── backend-memory.md                              # LSU, Store Buffers, STLF, Memory Disambiguation
│
├── memory/                                            # Memory hierarchy and management
│   ├── memory-hierarchy.md                            # Latency/bandwidth matrix, Memory Wall, TLB
│   └── runtime-memory-management.md                   # Allocators, slabs, arenas, GC, escape analysis
│
├── caches/                                            # Cache locality and tiling
│   └── cache-locality-and-tiling.md                   # Arithmetic intensity, roofline, tiling proof
│
├── hardware/                                          # Hardware matrix and multi-architecture
│   └── modern-matrix.md                               # Multi-architecture 2026 matrix (Intel/AMD/ARM/RISC-V/GPU)
│
├── compilers/                                         # Compiler theory and engineering
│   ├── theory-1960s-techniques.md                     # 20 foundational compiler techniques analyzed
│   ├── theory-1970s-optimization.md                   # Mathematical dataflow, lattices, graph coloring
│   ├── compilation-speed.md                           # Compiler efficiency, arenas, pass cost, linkers
│   └── compiler-self-optimization.md                  # PGO + BOLT + ThinLTO toolchain pipeline
│
├── jit/                                               # Dynamic compilation
│   └── history-and-mechanisms.md                      # JIT lineage, ICs, OSR, deoptimization
│
├── interpreters/                                      # Interpreter architecture
│   └── interpreter-design.md                          # AST vs Bytecode, direct-threaded goto, quickening
│
├── vectorization/                                     # Vectorization science
│   └── vectorization-science.md                       # SIMD, scalable vectors, aliasing, downclocking
│
├── parallelism/                                       # Parallelism and concurrency
│   └── concurrency-vs-parallelism.md                  # Concurrency vs Parallelism, work stealing, atomics
│
├── operating-systems/                                 # OS and runtime interaction
│   └── os-runtime-interaction.md                      # Syscalls, KPTI, context switches, THP, dynamic linking
│
├── optimization-techniques/                           # Optimization techniques
│   └── profile-guided-optimization.md                 # PGO, AutoFDO, microbenchmark pitfalls
│
├── linkers/                                           # Linking and post-link
│   └── link-time-and-post-link.md                     # LTO, ThinLTO, Mold, BOLT binary layout
│
├── performance-theory/                                # Theoretical models and falsification
│   ├── mathematical-models.md                         # Amdahl, Little's Law, Roofline, IPC
│   └── theory-falsification.md                        # Falsifying the 8 major performance dogmas
│
├── benchmarks/                                        # Benchmarking science
│   └── benchmark-science.md                           # SPEC CPU history, statistical rigor, geomean
│
└── experiments/                                       # Empirical experiment database
    └── experiment-database-template.md                # Scientific experiment schema and records
```
