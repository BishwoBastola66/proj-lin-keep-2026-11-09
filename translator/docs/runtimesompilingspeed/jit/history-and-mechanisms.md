# Just-In-Time (JIT) Compilation: Lineage, Mechanisms, and Adaptive Runtimes

This document details the lineage and mechanics of dynamic Just-In-Time (JIT) compilation from early Smalltalk systems through modern 2026 tiered compilation engines.

---

## 1. The Core Architecture of Adaptive JIT Systems

```
+------------------------------------------------------------------------+
|                          Interpreter / Tier 0                          |
|  - Fast startup, executes bytecode immediately                         |
|  - Injects profiling counters (Invocation Counter, Backedge Counter)   |
|  - Collects Type Feedback at polymorphic sites (Inline Caching)        |
+------------------------------------------------------------------------+
                                   |
                (Counter exceeds Hotness Threshold $\Theta_1$)
                                   v
+------------------------------------------------------------------------+
|                    Baseline / Tier 1 JIT (e.g., Sparkplug / C1)        |
|  - Fast one-pass compilation without heavy SSA optimization            |
|  - Emits machine code quickly to relieve interpreter pressure          |
|  - Continues gathering high-resolution profile data                    |
+------------------------------------------------------------------------+
                                   |
                (Counter exceeds Hotness Threshold $\Theta_2$)
                                   v
+------------------------------------------------------------------------+
|               Optimizing / Tier 2 JIT (e.g., TurboFan / C2 / Graal)   |
|  - Builds full SSA Sea-of-Nodes graph                                  |
|  - Speculative Inlining based on type feedback                         |
|  - Escape Analysis, Scalar Replacement, Loop Unrolling, Vectorization  |
|  - Inserts Deoptimization Guards (Uncommon Traps)                      |
+------------------------------------------------------------------------+
                                   |
              (Speculative Guard Fails: Class Hierarchy Modified)
                                   v
+------------------------------------------------------------------------+
|               Deoptimization / On-Stack Replacement (OSR)              |
|  - Reads hardware CPU register state and stack frame                   |
|  - Reconstructs unoptimized Interpreter activation records on the fly  |
|  - Resumes execution seamlessly in Interpreter at exact bytecode offset|
+------------------------------------------------------------------------+
```

---

## 2. System-by-System Comparative Analysis

### A. Smalltalk-80 (Deutsch & Schiffman, 1984)
* **What Did It Observe?**: Bytecode execution frequency.
* **What Did It Optimize?**: Translated interpreted Smalltalk bytecodes into native machine code on demand in a dynamic code cache.
* **When Did It Optimize?**: On first execution of a method.
* **How Did It Know Something Was Hot?**: It didn't—it compiled everything dynamically on first call, discarding compiled code when the cache filled.
* **What Assumptions Did It Make?**: Stable object layout.
* **How Did It Recover When Assumptions Failed?**: Flushed native code cache and recompiled.

### B. Self-91 & Strongtalk (Chambers, Ungar, & Hölzle, 1989–1994)
* **What Did It Observe?**: Receiver object types at call sites and method invocation counts.
* **What Did It Optimize?**: Polymorphic call sites via **Inline Caches (ICs)** and **Polymorphic Inline Caches (PICs)**; performed speculative method inlining.
* **When Did It Optimize?**: When an invocation counter crossed a hot threshold.
* **How Did It Know Something Was Hot?**: Counter incremented at method entry and loop backward branches.
* **What Assumptions Did It Make?**: Assumed call sites were monomorphic (called with only one receiver type) even though the language was dynamically typed.
* **How Did It Recover When Assumptions Failed?**: **Deoptimization (Uncommon Traps)**. If a guard failed, the runtime halted native execution, read CPU registers, materialized interpreter stack frames, and resumed in the interpreter.

### C. Java HotSpot (Sun / Oracle, 1999–Present)
* **What Did It Observe?**: Method invocation counters, loop backedge counters, and branch execution probabilities.
* **What Did It Optimize?**: Tiered compilation: Client compiler (C1) for quick native emission, Server compiler (C2) with SSA Sea-of-Nodes graph, global value numbering, escape analysis, and loop vectorization.
* **When Did It Optimize?**: Tier 1 (C1) at ~1,000 invocations; Tier 2 (C2) at ~10,000 invocations.
* **How Did It Know Something Was Hot?**: Method invocation counter + loop backedge counter decay over time.
* **What Assumptions Did It Make?**: Class hierarchy finality (assumed an interface had only 1 implementing class loaded in the JVM).
* **How Did It Recover When Assumptions Failed?**: Class loading triggered class hierarchy analysis (CHA) invalidation. Marked compiled code as zombie, patched call sites, and triggered OSR (On-Stack Replacement) deoptimization.

### D. HP Dynamo (Bala, Duesterwald, Santhanam, 2000)
* **What Did It Observe?**: Dynamic native instruction branches in running PA-RISC binary executables.
* **What Did It Optimize?**: Linked frequent execution traces together into contiguous straight-line memory blocks in a software code cache.
* **When Did It Optimize?**: When a backward branch or branch target hit a hotness threshold.
* **How Did It Know Something Was Hot?**: Low-overhead hardware/software counters on branch targets.
* **What Assumptions Did It Make?**: Assumed program execution repeatedly follows the exact same linear trace.
* **How Did It Recover When Assumptions Failed?**: Side exits linked back into the trace dispatcher.

### E. TraceMonkey (Mozilla, 2009)
* **What Did It Observe?**: Executed bytecode paths through JavaScript loops and runtime variable types.
* **What Did It Optimize?**: Formed single-entry loop traces with strictly typed numeric variables, compiling straight-line native code without branch instructions.
* **When Did It Optimize?**: When a loop executed multiple times with identical operand types.
* **How Did It Know Something Was Hot?**: Loop backedge counter.
* **What Assumptions Did It Make?**: Loop conditions and types never diverge.
* **How Did It Recover When Assumptions Failed?**: Trace guard exit; if guard failed too frequently, blacklisted the trace and fell back to interpreter. Trace trees suffered from combinatorial explosions, leading to TraceMonkey's retirement in favor of method-based JITs.

### F. V8 TurboFan & Crankshaft (Google Chrome, 2010–Present)
* **What Did It Observe?**: "Hidden classes" (Maps/Shapes) of JavaScript objects and call-site feedback vectors.
* **What Did It Optimize?**: Full SSA Sea-of-Nodes pipeline; converts property lookups `obj.x` into direct pointer offsets `*(obj + offset)` with single map-check guards.
* **When Did It Optimize?**: Ignition (Interpreter) $\to$ Sparkplug (Non-optimizing baseline JIT) $\to$ Maglev (Mid-tier SSA JIT) $\to$ TurboFan (Full optimizing Sea-of-Nodes JIT).
* **How Did It Know Something Was Hot?**: Multi-tier feedback vectors tracking invocation counts and type transitions.
* **What Assumptions Did It Make?**: Object shapes do not mutate; operations on numbers remain 31-bit small integers (Smis).
* **How Did It Recover When Assumptions Failed?**: Deoptimization bailout to Ignition interpreter.

### G. GraalVM & Truffle (Oracle Labs, 2012–Present)
* **What Did It Observe?**: AST node execution and type specializations inside Truffle language interpreters.
* **What Did It Optimize?**: **Partial Evaluation**: Evaluates the Truffle interpreter AST with respect to the user program, compiling the interpreter away to leave only raw machine code representing the application logic.
* **When Did It Optimize?**: After AST nodes stabilize their type specializations and invocation counters trip hot thresholds.
* **How Did It Know Something Was Hot?**: Built-in AST invocation and loop execution counters.
* **What Assumptions Did It Make?**: AST node specialization invariants remain stable.
* **How Did It Recover When Assumptions Failed?**: Speculation failure guards trigger AST node transfer-to-interpreter.

---

## 3. Core Mechanisms of JIT Compilation

### 1. Inline Caching (IC) and Polymorphic Inline Caching (PIC)
* **Monomorphic IC**: Caches a single shape/class and target function pointer directly at the call site.
  ```assembly
  CMP [RDI + Object.shape], ExpectedShape
  JNE PolymorphicFallback
  CALL OptimizedMethodDirect   ; Direct jump, no vtable lookup!
  ```
* **Polymorphic IC**: Caches 2 to 4 classes using a linear search table.
* **Megamorphic Stub**: If $>4$ classes are observed, falls back to a global hash table lookup.

### 2. On-Stack Replacement (OSR)
* If a long-running loop (e.g., $10^8$ iterations) begins in the interpreter, waiting for the method to return before using the JIT compiler means the program runs the entire loop slowly!
* **OSR Mechanism**: While the loop is actively spinning in the interpreter, the JIT compiles the loop body in the background. At the next loop backedge, the runtime swaps the stack frame out and jumps into the middle of the newly compiled native machine code loop on the fly.

### 3. Deoptimization: The Safety Net of Speculation
Without deoptimization, a compiler cannot make speculative assumptions.
If an optimizer can assume:
1. Object $X$ is always of class `Foo`.
2. Array $A$ index is always within bounds $0 \le i < \text{len}$.
3. Number $N$ never overflows 32-bit integer arithmetic.
Then it can eliminate all class checks, eliminate all array bounds checks, and emit single-cycle raw ALU instructions!
The deoptimization engine records a metadata table mapping every native code instruction offset to the corresponding bytecode PC and variable locations. If any guard fails, the interpreter safely takes over.
