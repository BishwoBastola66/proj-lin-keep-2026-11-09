# Historical Figure Profile: David Ungar, Craig Chambers, & Urs Hölzle

* **Person/System**: David Ungar, Craig Chambers, & Urs Hölzle / Stanford University & Longview Technologies (Self-91, Strongtalk, Java HotSpot)
* **Era**: Late 1980s–1990s (The JIT Revolution and Dynamic Adaptive Optimization)
* **Problem They Attacked**:
  Pure object-oriented and dynamically typed languages (Smalltalk, Self, early Java) were hopelessly slow compared to C (often 20x to 50x slower). Every operation, even integer addition or field access, was a dynamic polymorphic message send (`vtable` lookup). Static ahead-of-time compilers could not optimize dynamic code because target types were unknown until runtime.
* **Their Key Idea**:
  **Dynamic Adaptive Profiling & Speculative Optimization with Deoptimization**:
  1. *Inline Caching (IC) and Polymorphic Inline Caching (PIC)*: Rewrite dynamic call sites to cache receiver type tags and jump directly to the target method.
  2. *Type Feedback & Speculative Inlining*: Profile call sites at runtime. When a call site is 99% monomorphic, inline the receiver's method directly, guarded by a single quick type check.
  3. *Deoptimization (On-Stack Replacement / Uncommon Traps)*: Allow the JIT compiler to make aggressive speculative assumptions. If an assumption is invalidated at runtime (e.g., a subclass is dynamically loaded), execute a deoptimization trap that transparently reconstructs interpreter stack frames on the fly and resumes execution in the interpreter without program disruption.
* **Original Evidence**:
  Ungar, D. & Smith, R. B., *"Self: The power of simplicity"*, OOPSLA 1987.
  Chambers, C. & Ungar, D., *"Customization: Optimizing compiler technology for Self, a dynamically-typed object-oriented programming language"*, PLDI 1989.
  Hölzle, U., Chambers, C., & Ungar, D., *"Optimizing dynamically-typed object-oriented languages with polymorphic inline caches"*, ECOOP 1991.
  Hölzle, U., Chambers, C., & Ungar, D., *"Debugging optimized code with dynamic deoptimization"*, PLDI 1992.
* **Hardware Context**:
  Sun SPARCstations (32-bit RISC, 25–50 MHz, 16–64 MB RAM).
* **Why It Mattered**:
  This triumvirate invented the entire technology stack that powers modern high-performance dynamic runtimes: Java HotSpot, V8 (JavaScript), JavaScriptCore, PyPy, and Julia. They proved that dynamic languages could achieve near-C execution performance through adaptive runtime specialization.
* **What Survived**:
  Monomorphic and polymorphic inline caches, speculative inlining, on-stack replacement (OSR), deoptimization bailouts, and tiered compilation.
* **What Failed**:
  Pure interpreted execution without type feedback; attempt to compile everything ahead of time without profiling.
* **Modern Equivalent**:
  V8 TurboFan/Ignition (Google Chrome), Java HotSpot C1/C2/GraalVM, SpiderMonkey (Firefox).
* **Potential Relevance to Rubix**:
  Whether Rubix operates via an interpreter, JIT, or AOT compiler, inline caching and type specialization are the most effective techniques known for accelerating polymorphic method dispatch and dynamic attribute access.
