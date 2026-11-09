# Failed & Abandoned Languages: The Graveyard of Ambition

Languages die for many reasons: grammar over-complexity, slow compilers, bad commercial timing, hardware limitations, or corporate cancellation. This document investigates the seminal programming languages that failed commercially or died as active ecosystems, dissecting their technical contributions and the exact causes of their demise.

---

## 1. Catalog of Failed Languages

### A. Algol 68 (1968)
* **What They Attempted**: The ultimate mathematical programming language. Designed by IFIP Working Group 2.1 (van Wijngaarden, Mailloux, Peck, Koster). Introduced orthogonal design, strict expression-based semantics, user-defined operators, parallel clauses (`par begin ... end`), and two-level van Wijngaarden grammars (W-grammars).
* **Why It Failed / Cause of Death**:
  * **TOO COMPLEX / LACK OF TOOLING / COMMUNITY REVOLT**: The formal specification was impenetrable; prominent committee members (including Tony Hoare and Edsger Dijkstra) publicly resigned in protest, stating the language was too baroque and dangerous. Writing an Algol 68 compiler was so difficult that working implementations took nearly a decade to appear, by which time simpler languages (Pascal and C) had conquered the world.
* **What Survived**:
  * Expression-oriented language design (where blocks, `if`, and `case` return values, as in Rust, Scala, and Rubix).
  * Orthogonality principle: constructs can be freely composed without arbitrary syntactic restrictions.
* **Modern Status**: Dead.

---

### B. IBM PL/I (1964)
* **What They Attempted**: The "Programming Language One" intended to unify scientific computing (Fortran), business data processing (COBOL), and systems programming (Algol) into a single universal language for the IBM System/360.
* **Why It Failed / Cause of Death**:
  * **TOO COMPLEX / TOO EXPENSIVE / UNBOUNDED RUNTIME**: PL/I had every feature conceivable: multi-tasking, exception handling (`ON CONDITIONS`), complex string manipulation, fixed-point decimal arithmetic, arrays, and pointer manipulation. The compiler was a monstrous, multi-pass behemoth that ran slowly and produced bloated binaries. Programmers could not master the full language and feared hidden runtime costs.
* **What Survived**:
  * The cautionary architectural tale: languages that attempt to be everything to everyone fail under their own cognitive and compilation weight.
* **Modern Status**: Legacy IBM mainframe maintenance only.

---

### C. Apple Dylan (1992–1995)
* **What They Attempted**: Apple Computer’s intended next-generation language for the Apple Newton and Macintosh. Designed by Apple’s Cambridge Research Lab. Blended the dynamic power and multiple dispatch of CLOS (Common Lisp Object System) with Algol-like syntax and a module system designed for ahead-of-time compilation.
* **Why It Failed / Cause of Death**:
  * **MANAGEMENT CANCELLED IT / ECONOMIC HARDSHIP**: In 1995, Apple faced near-bankruptcy and underwent drastic corporate restructuring. CEO Gil Amelio cut advanced research projects. The Newton team pivoted to C++ to meet memory and deadline constraints. Dylan was open-sourced and abandoned by Apple.
* **What Survived**:
  * Multiple dispatch and type specialization algorithms directly influenced the **Julia programming language**.
* **Modern Status**: Small open-source niche (OpenDylan).

---

### D. Cecil (1992–1997)
* **What They Attempted**: Craig Chambers (University of Washington). Combined pure object orientation, predicate dispatch (methods selected dynamically based on boolean predicates and object state), multi-methods, and dynamic inheritance.
* **Why It Failed / Cause of Death**:
  * **TOO SLOW / RESEARCH GOAL COMPLETED**: Multiple dispatch combined with predicate dispatch required whole-program analysis and complex multi-dimensional dispatch tables. Without whole-program compilation, every method dispatch was an expensive multi-table search.
* **What Survived**:
  * Chambers’ compiler research for Cecil laid the groundwork for modern devirtualization, fast dynamic dispatch algorithms, and the Vortex optimizing compiler framework.
* **Modern Status**: Academic research artifact.

---

### E. Sun Fortress (2002–2012)
* **What They Attempted**: High-performance scientific computing language designed by Guy L. Steele Jr. at Sun Microsystems under the DARPA HPCS program. Supported mathematical unicode syntax (e.g., matrix juxtaposition $AB$ meant multiplication), implicit parallel loops by default, and pluggable dimensional analysis units (meters, seconds, kilograms verified at compile time).
* **Why It Failed / Cause of Death**:
  * **CORPORATE ACQUISITION / MANAGEMENT CANCELLATION**: Oracle acquired Sun Microsystems in 2010. Oracle dismantled Sun Labs’ non-commercial research projects. Fortress was officially shuttered in 2012.
* **What Survived**:
  * Compile-time type-checked physical units of measurement (reappeared in F# and modern C++ libraries).
  * Implicit parallel loops (reappeared in Rayon and Julia).
* **Modern Status**: Dead.

---

### F. IBM X10 & Cray Chapel (2004–Present)
* **What They Attempted**: Partitioned Global Address Space (PGAS) languages funded by DARPA HPCS. Unified distributed-memory cluster computing with shared-memory thread models (`async`, `finish`, `at (place)`).
* **Why It Failed / Cause of Death**:
  * **ECOSYSTEM FAILED / NARROW HPC NICHE**: Required custom runtime systems and distributed cluster deployments. Mainstream data science and distributed computing adopted Python with distributed libraries (MPI, Ray, PyTorch, Spark) rather than adopting a brand-new programming language.
* **What Survived**:
  * Structured concurrency concepts (`finish` blocks in X10 inspired structured concurrency in modern Java Project Loom and Python trio).
* **Modern Status**: Chapel survives in specialized HPC supercomputing centers; X10 is dormant.
