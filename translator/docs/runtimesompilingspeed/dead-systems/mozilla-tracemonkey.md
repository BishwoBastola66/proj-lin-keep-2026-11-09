# Dead Systems Dossier: Mozilla TraceMonkey Tracing JIT (2008–2011)

* **Project**: TraceMonkey (SpiderMonkey Tracing Extension)
* **Years**: 2008–2011
* **People**: Andreas Gal, Brendan Eich, Mike Shaver, David Anderson
* **Organization**: Mozilla Corporation & UC Irvine
* **Language**: JavaScript (ECMAScript)
* **Target Hardware**: x86-32, x86-64, ARM
* **Target OS**: Linux, Windows, macOS, Android
* **Compiler Architecture**:
  Interpreter $\to$ Loop Backedge Counter $\to$ Trace Recorder $\to$ Linear LIR (Low-level IR) $\to$ Nanojit Machine Code Emitter $\to$ Native Execution with Type Guards.
* **Runtime Architecture**: Hybrid Interpreter + Trace JIT integrated inside SpiderMonkey.
* **Original Problem**: JavaScript was interpreted; Google Chrome was about to release V8 (with direct method-based native compilation), threatening Firefox’s market share with 10x faster web execution.
* **Original Goal**: Make JavaScript execute at near-C speeds by identifying hot loops, recording execution traces with concrete types, and compiling linear machine code without method boundaries or polymorphic dispatches.
* **Design Philosophy**:
  > *"Programs spend most of their time in hot loops. Within a loop, control flow almost always follows the same path, and variables almost always have the same types."*
* **Optimization Philosophy**:
  **Trace Compilation (Andreas Gal & Michael Franz, 2006)**:
  1. Record the sequence of bytecodes executed during one loop iteration.
  2. Embed concrete type assumptions into the trace (e.g., `x` is a 32-bit integer).
  3. Emit a straight-line sequence of machine instructions without branching, protected by **Guards** (checks that verify types and branch conditions).
  4. If a guard fails, branch out to an off-trace exit or grow a secondary "trace tree".
* **Compilation Strategy**: Dynamic trace JIT via Nanojit.
* **Runtime Strategy**: Interpretation until loop becomes hot; execute native trace; fall back to interpreter on guard failure.
* **Memory Model**: Standard JavaScript garbage-collected heap.
* **Concurrency Model**: Single-threaded event loop.
* **Type System**: Dynamically typed JS mapped to statically typed native primitives.
* **Code-Generation Strategy**: Emitted lean x86 assembly directly without an intermediate SSA optimizer pass.
* **What They Believed**: That trace-based compilation was inherently superior to method-based compilation because traces cross function call boundaries naturally and inline without complex heuristics.
* **What They Attempted**: Powering Firefox 3.5 with TraceMonkey as the primary JIT engine.
* **What Worked**:
  * On numerical, arithmetic-heavy benchmarks with simple loops (SunSpider, bitwise operations, math raytracers), TraceMonkey was **20x to 40x faster than the interpreter**, matching V8!
  * Andreas Gal et al. published the seminal paper at PLDI 2009 (*"Trace-based Just-in-Time Type Specialization for Dynamic Languages"*).
* **What Failed**:
  1. *Trace Tree Explosion on Real-World Control Flow*: In real-world web applications with complex branching (e.g., `if-else` cascades, switch statements, DOM events), loops did not follow a single linear path. The trace recorder tried to build secondary trees for every branch, causing combinatorial explosions in compilation time and memory.
  2. *Frequent Deoptimization (Trace Aborts)*: As soon as an object had a different shape or an unexpected null was encountered, the trace aborted back to the interpreter. The overhead of repeatedly starting and aborting traces made complex websites *slower* than running in a simple interpreter!
  3. *Inability to Optimize Whole Functions*: Traces only optimized loops, leaving outer functions, object constructors, and non-loop methods unoptimized.
* **What Was Unfinished**: Stable heuristics for capping trace tree depth without causing performance cliffs.
* **Why It Died**:
  * **TOO COMPLEX / TOO SLOW / COMPETITOR WON**: Google's V8 (using method-based compilation with Hidden Classes and Inline Caches) proved consistently fast across *all* workloads without pathological slowdowns. Mozilla conceded defeat and replaced TraceMonkey with **JaegerMonkey** (2010) and then **IonMonkey** (2012), fully adopting method-based SSA compilation.
* **What Survived**:
  * The realization that type feedback and specialization are mandatory for dynamic language speed.
  * PyPy retained tracing JIT technology successfully (because PyPy traces the interpreter implementing Python rather than user Python loops directly).
* **Where Its Ideas Resurfaced**: Modern tracing in eBPF kernel verifiers and profile-guided binary trace optimizers.
* **What Modern Hardware Changes**: Modern CPUs have wide branch predictors (TAGE) that easily predict branches inside functions anyway, eliminating the need to force programs into artificial branchless traces.
* **Could It Work Now?**: For general-purpose dynamic programming: **No**. Method JITs with Polymorphic Inline Caching are universally superior for general software.
* **Could Rubix Implement a Descendant?**:
  Rubix should explicitly **REJECT Tracing JITs** in favor of **Method/Function-level SSA compilation with Inline Caching**. Tracing is fragile on branching logic; method SSA compilation is robust and stable.
