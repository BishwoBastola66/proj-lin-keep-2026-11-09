# The Rust Unstable ABI and the Recompilation Tax

## 1. The Deliberate Absence of a Stable Rust ABI

Unlike C++ (which prioritized permanent ABI stability) or C (which froze conventions in the 1980s), Rust made an explicit, conscious design choice:
**The Rust compiler (`rustc`) promises zero ABI stability between compiler versions or build configurations.**

```
Compilation with rustc 1.75.0 (Crate A)
                   +
Compilation with rustc 1.76.0 (Crate B)
                   =
FATAL LINK ERROR / IMMEDIATE SILENT CRASH
(ABI compatibility is explicitly undefined behavior)
```

---

## 2. Why Rust Refuses to Stabilize Its ABI

Rust's refusal to stabilize its ABI was driven by legitimate compiler optimization arguments:

### 2.1. Automatic Struct Field Reordering
In C, the compiler must lay out struct fields in the exact textual order written by the programmer:
```c
struct Inefficient {
    char a;     // 1 byte + 7 bytes padding
    double b;   // 8 bytes
    char c;     // 1 byte + 7 bytes padding
};              // Total size: 24 bytes
```
In Rust (under default `repr(Rust)`), the compiler is free to reorder fields to minimize alignment padding:
```rust
struct Optimized {
    b: f64,     // 8 bytes
    a: u8,      // 1 byte
    c: u8,      // 1 byte
    // 6 bytes padding
};              // Total size: 16 bytes (33% memory reduction!)
```
Stabilizing the ABI would freeze field layouts forever, preventing the compiler from improving struct layout algorithms in future releases.

### 2.2. Niche Optimization (Zero-Cost Discriminants)
Rust exploits invalid bit patterns to encode enum variants without memory overhead:
- A reference `&T` or non-null pointer `NonNull<T>` can never have the bit pattern `0x0`.
- Therefore, `Option<&T>` uses `0x0` to represent `None`, and any non-zero pointer to represent `Some(&T)`.
- Size of `Option<&T>`: exactly 8 bytes (0 extra bytes for the tag!).
- If Rust stabilized its ABI, it could not invent new niche optimizations (e.g. using `0x1` or pointer tagging) without breaking existing binaries.

### 2.3. Extensive Monomorphization
Generic types and functions are fully monomorphized (instantiated with concrete types at compile time). Monomorphization requires source code or rich compiler AST metadata, making pre-compiled binary distribution impractical.

---

## 3. The Consequences: The Recompilation Tax

While this approach gives the Rust compiler maximum freedom, it creates massive engineering liabilities:

1. **The Recompilation Tax**: Because pre-compiled dynamic libraries cannot be distributed, every application must compile its entire dependency tree (often 300+ crates) **from source code** on every clean build. Clean CI/CD builds take tens of minutes or hours.
2. **Binary Bloat & Memory Waste**: Every application statically links its own copy of the standard library and dependencies, leading to 50MB+ binaries and redundant physical RAM usage across running processes.
3. **The C FFI Degeneration**: When Rust components *must* interact across dynamic boundaries (e.g. plugin architectures), they are forced to downgrade to `extern "C"` and `#[repr(C)]`. This discards all of Rust's safety guarantees: lifetimes, fat pointers, slices, traits, and algebraic error types.

---

## 4. The Rubix Solution

Rubix breaks this false dichotomy:
- We do **not** freeze physical representations like C++, nor do we **surrender binary compatibility** like Rust.
- By defining **Semantic Interface Contracts** with automated, zero-cost adapter synthesis, Rubix enables dynamic binary linking and instant compilation while retaining the compiler's freedom to optimize internal representations.
