# ADR-0004: Affine Ownership & Lexical Region Arenas over Tracing Garbage Collection

* **Status**: Accepted
* **Date**: October 2026
* **Deciders**: Rubix Lead Architecture Board, Language Semantics Working Group
* **Invariants Bound**: `INV-04` (Bump Arena Zero-GC Law), `INV-06` (Affine Exclusivity), `INV-10` (Value Semantics Default)

---

## 1. Context and Problem Statement

Memory management has traditionally been split between two flawed paradigms:
1. **Manual Unsafe Memory (C / C++)**: Developers manually call `malloc` and `free`. This leads to spatial (buffer overflow) and temporal (use-after-free, double-free) memory violations, which account for approximately 70% of all critical CVEs in production systems software.
2. **Tracing Garbage Collection (Java / Go / Node.js)**: A background tracing runtime periodically stops application threads to reclaim memory. This introduces unpredictable latency spikes (stop-the-world pauses), high memory overhead ($2\times \text{ to } 4\times$ footprint due to object headers and allocation nurseries), and destroys CPU cache locality.
3. **Complex Borrow Checking with Lifetimes (Rust)**: Proves memory safety at compile time without GC, but introduces heavy cognitive friction when handling cyclic graphs, forces pervasive lifetime annotations (`'a`, `'b`), and leads to slow compilation times.

---

## 2. Decision Drivers

1. Guarantee 100% spatial and temporal memory safety without undefined behavior.
2. Eliminate tracing garbage collection, stop-the-world pauses, and reference counting cycle overhead.
3. Eliminate pervasive manual lifetime annotations to maintain ergonomic developer velocity.
4. Support cyclic data structures (graphs, UI trees) efficiently without runtime reference counting cells (`Rc<RefCell<T>>`).

---

## 3. Considered Options

* **Option 1: Generational Tracing Garbage Collector**: Implement a low-latency concurrent garbage collector.
* **Option 2: Strict Rust-Style Lifetimes**: Require explicit lifetime parameters across all data structures and function signatures.
* **Option 3: Tri-Tier Resource Architecture (Rubix Model)**: Combine **Affine Single-Ownership ($A \oplus M$)** with **Lexical Region Arenas** and **Automated Compile-Time Escape Analysis**.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3: Tri-Tier Resource Architecture (Rubix Model)**.

### Technical Specification
1. **Affine Single-Ownership**: Resources (files, sockets, heap buffers) have exactly one owner. Moving a resource invalidates the source variable statically.
2. **Lexical Region Arenas**: Cyclic structures and transient allocations are bound to a scoped region arena. Allocations inside the arena execute via high-speed pointer bump (`offset += size`). When the lexical region exits, the entire arena memory is reclaimed in $O(1)$ time with zero traversal.
3. **Automated Escape Analysis**: The compiler automatically promotes non-escaping allocations to stack frames, leaving only true cross-scope objects to affine move semantics. Developers rarely write explicit lifetime annotations.
4. **Value Semantics by Default**: All structs and arrays are flat, unboxed, and contiguous in memory, maximizing L1/L2 cache prefetching efficiency.

---

## 5. Pros and Cons of the Selected Architecture

### Positive Consequences
* **Deterministic Resource Lifecycles**: Zero memory leaks, zero use-after-free, zero double-free bugs.
* **Zero Runtime Latency Spikes**: No background tracing threads, no stop-the-world pauses; suitable for hard real-time and OS kernel environments.
* **Effortless Graph Structures**: Complex graphs allocate inside local region arenas without lifetime annotation friction.

### Negative Consequences & Mitigations
* **Regional Lifetime Binding**: Objects in a region arena cannot outlive the region.
  - *Mitigation*: Cross-region data movement is achieved via explicit affine ownership transfer (`move`).

---

## 6. Implementation and Verification

* **Primary Subsystems**: `compiler/middle/typecheck.bix`, `AIR` intermediate representation.
* **Verification Test**: `test_ownership_and_regions` asserts that double moves are rejected at compile time, while regional bump allocations are reclaimed in $O(1)$ time without memory leaks.
