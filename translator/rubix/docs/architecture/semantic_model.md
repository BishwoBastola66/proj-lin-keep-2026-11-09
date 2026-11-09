# Rubix Next Semantic & Type Model

> **Formal Specification of Values, Computations, Types, and Algebraic Effects**
> *Specification Version 2.0.0-Next*

---

## 1. What is a Value, a Computation, and a Resource?

Rubix Next explicitly defines the ontological foundations of its semantic model:

- **Value**: An immutable, inert representation of information (e.g. integer `42`, float `3.1415`, boolean `true`, record `{ x: 10, y: 20 }`). Values have value semantics: they can be copied freely without aliasing hazards or side effects.
- **Computation**: A transition between program states defined by expressions and control flow. Computations may be **pure** (producing a value from arguments with zero environment side effects) or **effectful** (performing memory allocation, I/O, system calls, or network communication).
- **Resource**: An entity bound to an external or finite physical asset (a heap block, an open file descriptor, a network socket, a thread handle, a hardware sensor). Resources possess **affine semantics**: they must have a single unique owner, cannot be silently duplicated, and must be deterministically finalized upon scope exit.

---

## 2. Type System Foundations

The Rubix Next type system synthesizes:
1. **Unboxed Nominal & Structural Types**: Zero-cost layout matching native hardware.
2. **Algebraic Data Types (ADTs)**: Exhaustive pattern-matched `enum` sum types and `struct` product types.
3. **Affine Qualifiers**: Types tagged as resources requiring single-ownership tracking (`affine`).
4. **Effect Annotations**: Function types specifying their permitted side effects (`effect(pure, io, net, syscall)`).
5. **Capability Types**: First-class security tokens (`CapFs`, `CapNet`, `CapProc`, `CapUnsafe`).

### Type Lattice

```text
                                AnyType
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
    ValueTypes                ResourceTypes             CapabilityTypes
  (Copy Semantics)          (Affine Semantics)         (Linear Tokens)
        │                          │                          │
  • i64, i32, u8             • AffineHandle<T>          • CapFs
  • f64, f32                 • FileStream               • CapNet
  • bool, char               • SocketHandle             • CapProc
  • Point { x, y }           • ArenaRegion              • CapUnsafe
  • Option<T>                • MutexLock                • CapClock
  • Result<T, E>             • ProcessHandle            • CapRandom
```

---

## 3. The Algebraic Effect System

In Rubix Next, effects form a join-semilattice represented as bitmasks:

```text
    EFFECT_PURE     = 0b00000000 (0)  - Pure computation (mathematical function)
    EFFECT_READ     = 0b00000001 (1)  - Reads external/heap memory
    EFFECT_WRITE    = 0b00000010 (2)  - Mutates external/heap memory
    EFFECT_ALLOC    = 0b00000100 (4)  - Allocates heap memory
    EFFECT_IO       = 0b00001000 (8)  - Performs standard input/output
    EFFECT_SYSCALL  = 0b00010000 (16) - Direct operating system kernel syscall
    EFFECT_NET      = 0b00100000 (32) - Network socket send/receive
    EFFECT_UNSAFE   = 0b01000000 (64) - Raw pointer dereference or FFI call
```

### Effect Composition Rules

For an expression $E = f(g(x), h(y))$:
$$\text{Effect}(E) = \text{Effect}(f) \cup \text{Effect}(g) \cup \text{Effect}(h)$$

### Effect Confinement Theorem
If a function is declared:
```rubix
fn compute_hash(data: [u8]): i64 effect(pure)
```
The compiler asserts that:
$$\text{Effect}(\text{compute\_hash}) \subseteq \text{EFFECT\_PURE}$$

If `compute_hash` attempts to call any function $g$ where $\text{Effect}(g) \neq \text{EFFECT\_PURE}$, the compiler emits:
```text
rubix next: error[-101] [EFFECT_VIOLATION]: pure function cannot invoke effectful operation
  --> src/crypto.bix:14:5
   |
14 |     sys_write(1, debug_msg, len);
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ operation has effect 'io, syscall', but 'compute_hash' is declared 'pure'
```

---

## 4. Optimization Benefits of the Semantic Model

1. **Pure Loop Invariant Code Motion (LICM)**: If a loop contains `let k = math_calc(c);` and `math_calc` is `pure`, the compiler can hoist it out of the loop unconditionally.
2. **Dead Code Elimination (DCE)**: If `let val = f(x);` is unused, traditional compilers cannot delete it if `f` might have side effects. In Rubix Next, if $\text{Effect}(f) == \text{EFFECT\_PURE}$, the call is eliminated entirely.
3. **Automatic Parallelization**: Two function calls `f()` and `g()` can be executed concurrently on separate CPU cores if:
   $$\text{WriteSet}(f) \cap (\text{ReadSet}(g) \cup \text{WriteSet}(g)) = \emptyset$$
   Which is trivially true when both are `pure` or disjoint in their memory regions!
