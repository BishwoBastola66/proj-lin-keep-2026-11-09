# Rubix Next Resource & Memory Model

> **Affine Ownership, Lexical Regions, Escape Analysis, and Zero-Cost Lifetime Management**
> *Specification Version 2.0.0-Next*

---

## 1. Core Thesis

Rubix Next rejects the false dichotomy of:
> *Manual Unsafe C Memory* **vs** *Stop-the-World Tracing Garbage Collection*

Instead, Rubix Next implements a **Hybrid Tri-Tier Resource Architecture**:
1. **Tier 1: Stack & Value Semantics** (Default for all unboxed primitives, structs, and arrays).
2. **Tier 2: Lexical Region Arenas with Automated Escape Analysis** (Zero-cost bump allocation for local complex graphs and temporary structures).
3. **Tier 3: Affine Ownership with Deterministic Drop** (Single-owner heap handles for long-lived resources).

---

## 2. Affine Ownership & Move Semantics

Every allocated resource $R$ has a unique owner variable $x$.

### The Invariants of Affine Ownership
1. **Unique Ownership**: At any instruction address, exactly one variable owns $R$.
2. **Move by Assignment / Call**: Assigning $y = x$ or passing $x$ as an argument to a consuming function transfers ownership of $R$ to $y$. Variable $x$ enters the `MOVED` state.
3. **Static Prevention of Use-After-Move**: Reading or passing a variable in the `MOVED` state triggers a compile-time diagnostic:
   ```text
   rubix next: error[-201] [AFFINE_USE_AFTER_MOVE]: value 'buffer' was moved at line 24
     --> src/processor.bix:28:12
      |
   24 |     send_payload(move buffer);
      |                  ----------- value moved here
      |
   28 |     let len = buffer.length();
      |               ^^^^^^ use of moved value 'buffer'
   ```
4. **Deterministic Scope Finalization (Drop)**: When the owner of an affine resource goes out of scope, the compiler automatically inserts the resource's destructor / finalizer call. No runtime garbage collector runs; no memory leaks can occur.

---

## 3. Lexical Region Arenas & Escape Analysis

Cyclic data structures, graph traversals, and temporary string buffers create severe friction under strict single-ownership borrow checkers. Rubix Next solves this with **First-Class Region Arenas**:

```rubix
region r {
    let tree = build_parse_tree(r, source_text);
    let result = evaluate_tree(tree);
    return result; # result is a pure value copied out
} # The entire arena 'r' is deallocated instantaneously in O(1) time here!
```

### Automated Escape Analysis
The developer does not even need to declare explicit regions for local allocations:
1. When a function executes `let list = Vector.new();`, the compiler traces whether `list` or any interior pointer escapes the function return boundary.
2. **Non-Escaping**: If `list` does not escape, the compiler promotes the entire buffer to the **Function Stack Frame** or a **Frame Bump Arena**. Allocation cost = 0 instructions (part of stack pointer adjustment `sub rsp, N`). Deallocation cost = 0 instructions (`add rsp, N`).
3. **Escaping**: If `list` escapes (e.g. `return list;`), it is allocated on the process heap as an affine resource whose ownership is transferred to the caller.

---

## 4. Borrowing & Scoped References

To allow reading or mutating a resource without transferring ownership:
- **Immutable Borrow (`&T`)**: Multiple concurrent readers permitted; no mutations allowed while borrowed.
- **Mutable Borrow (`&mut T`)**: Exactly one exclusive writer permitted; no readers allowed while borrowed.
- **Aliasing XOR Mutability**: Enforces the fundamental law:
  $$\text{Shared} \implies \text{Immutable} \quad \land \quad \text{Mutable} \implies \text{Unique}$$

---

## 5. Comparison Against Other Languages

| Feature | C | Java / Go | Rust | **Rubix Next** |
|---|---|---|---|---|
| **Use-After-Free Prevention** | ❌ None | ✅ GC | ✅ Borrow Checker | ✅ Affine Types + Regions |
| **Double-Free Prevention** | ❌ None | ✅ GC | ✅ Ownership Drop | ✅ Affine Ownership Drop |
| **Memory Leaks** | ⚠️ Frequent | ⚠️ Possible (cyclic refs) | ⚠️ Rare (Rc cycles) | ⚠️ Rare (scoped to region) |
| **Allocation Latency** | High (malloc) | High (GC nursery) | High (malloc) | **Zero (Stack/Region Bump)** |
| **Deallocation Cost** | O(N) calls to free | O(Heap) sweep | O(N) calls to drop | **O(1) Arena Drop** |
| **Cyclic Graph Usability** | ⚠️ Unsafe pointers | ✅ Easy (GC) | ❌ High friction | **✅ Easy (Region-scoped)** |
| **Runtime Overhead** | Zero | 20%–50% CPU/Memory | Zero | **Zero** |
