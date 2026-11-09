# Rubix Next Type System Specification

> **Formal Specification of Primitive Values, Algebraic Data Types, Affine Resources, and Capability Tokens**
> *Specification Version 2.0.0-Next*

---

## 1. Ontological Foundations

The Rubix Next type system is grounded in a three-way ontological division:
1. **Value Types ($\mathcal{V}$)**: Freely copyable, immutable data representations without external state linkage.
2. **Resource Types ($\mathcal{R}$)**: Affine entities linked to finite physical assets with unique ownership.
3. **Capability Types ($\mathcal{C}$)**: Zero-cost compile-time witness tokens representing system authorization.

```text
                                  Top (Any)
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
    Value Types (V)           Resource Types (R)          Capability Types (C)
    (Copy Semantics)          (Affine Semantics)         (Zero-Cost Witnesses)
         │                            │                            │
   • i64, i32, u8               • AffineHandle<T>            • CapFs
   • f64, f32                   • RegionArena<r>             • CapNet
   • bool, char                 • &T (Immutable Borrow)      • CapProc
   • Point { x, y }             • &mut T (Exclusive Borrow)  • CapUnsafe
   • Option<T>, Result<T,E>     • FileDescriptor             • MasterCap
```

---

## 2. Primitive Value Types (Unboxed Copy Semantics)

Value types implement copy semantics. Copying a value copies its raw bits without aliasing hazards or destructor obligations.

| Type | Bit Width | Alignment | Machine Representation | Semantic Role |
|---|---|---|---|---|
| `i64` | 64 | 8 | 64-bit Two's Complement Integer | Default signed integer |
| `i32` | 32 | 4 | 32-bit Two's Complement Integer | Compact integer, indices |
| `u8` | 8 | 1 | 8-bit Unsigned Byte | Raw bytes, byte streams |
| `f64` | 64 | 8 | IEEE 754 Double Precision Float | Mathematical calculation |
| `f32` | 32 | 4 | IEEE 754 Single Precision Float | Vector/Graphics float |
| `bool` | 8 | 1 | 0 = false, 1 = true | Logical predicates |
| `char` | 32 | 4 | UTF-32 / Unicode Scalar Value | Textual characters |
| `void` | 0 | 1 | 0-byte Unit / Void | Unit return value |
| `ptr` | 64 | 8 | Raw 64-bit Virtual Address | Low-level pointer (CapUnsafe) |

---

## 3. Algebraic Data Types (ADTs)

### 3.1 Product Types (`struct`)
Product types define composite structures with deterministic, unboxed hardware layouts:

$$\text{Size}(\text{Struct}) = \sum \text{Size}(\text{Field}_i) + \text{Padding}$$

Alignment equals the maximum alignment of its constituent fields:
$$\text{Align}(\text{Struct}) = \max_i (\text{Align}(\text{Field}_i))$$

### 3.2 Sum Types (`enum`)
Sum types represent tagged unions with exhaustive compile-time pattern matching.
A sum type layout consists of:
1. **Discriminant Tag**: An unboxed integer (`u8` or `i32`) identifying the active variant.
2. **Payload Union**: Overlaid memory sized to the largest variant payload.

```rubix
enum Result<T, E> {
    Ok(T),
    Err(E)
}
```

---

## 4. Affine Resource Types ($\mathcal{R}$)

Resource types model entities whose duplication would cause physical or logical corruption (double-free, socket conflict, data race).

### Invariants of Affine Types
1. **Single Owner**: Exactly one binding owns resource $R$ at any program point.
2. **Move by Default**: Assignment `let y = x;` transfers ownership to `y`. Variable `x` transitions to the `MOVED` state.
3. **No Silent Duplication**: Affine types do not implement copy semantics.
4. **Deterministic Scope Finalization**: When an active affine binding exits its lexical scope, the compiler synthesizes a call to its destructor / drop handler (`AIR_OP_DROP`).

### Scoped Borrow References
To allow inspection or mutation without transferring ownership:
- **`&T` (Shared Borrow)**: Multiple concurrent readers. The underlying value is strictly immutable while borrowed.
- **`&mut T` (Exclusive Borrow)**: Exactly one writer. Zero concurrent readers permitted.
- **The Aliasing Law**:
  $$\text{Shared}(x) \implies \neg \text{Mutable}(x) \quad \land \quad \text{Mutable}(x) \implies \text{Unique}(x)$$

---

## 5. Capability Witness Types ($\mathcal{C}$)

Capability types are linear tokens that grant permission to execute privileged operations.
- They have zero runtime memory representation (optimized to zero bytes at native synthesis).
- They serve exclusively as static proof tokens verified during the SIR semantic analysis phase.

| Capability | Bitmask Flag | Authorized Subsystems |
|---|---|---|
| `CapFs` | `0x01` | Filesystem access (`sys_open`, `sys_read`, `sys_write`, `sys_close`) |
| `CapNet` | `0x02` | Networking sockets (`sys_socket`, `sys_bind`, `sys_connect`) |
| `CapProc` | `0x04` | Process execution (`sys_fork`, `sys_exec`, `sys_kill`) |
| `CapUnsafe` | `0x08` | Raw memory pointer dereferencing and external C ABI calls |
| `CapTime` | `0x10` | Real-time hardware clock and performance counters |
| `CapRandom` | `0x20` | Hardware entropy and cryptographic random generators |
| `MasterCap` | `0x3F` | Root process authority (delivered exclusively into `main`) |

---

## 6. Type Checking & Verification Algorithms

The Rubix Next type checker executes three verification phases:
1. **Structural Type Inference**: Deduces expression types using bidirectional local inference.
2. **Effect Confinement Verification**: Checks that function effect sets satisfy the call-graph containment invariant.
3. **Capability Witness Verification**: Ensures every privileged call site supplies an in-scope capability token.
