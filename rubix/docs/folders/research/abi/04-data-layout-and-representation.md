# Data Layout, Struct Representation, and ABI Alignment

## 1. Natural Alignment and Padding Rules

Data representation in physical memory is governed by hardware performance and memory bus architecture.
Most modern processors (x86-64, ARM64, RISC-V) require, or strongly prefer, that multi-byte primitive values reside at memory addresses that are multiples of their size.

### 1.1. Natural Alignment Rules
For any primitive type $T$ with size $S(T)$ bytes, its alignment requirement $A(T)$ satisfies:
$$A(T) = S(T)$$
For standard 64-bit platforms:
- `i8` / `u8` / `bool`: Size 1, Alignment 1
- `i16` / `u16`: Size 2, Alignment 2
- `i32` / `u32` / `f32`: Size 4, Alignment 4
- `i64` / `u64` / `f64` / `pointer`: Size 8, Alignment 8
- `i128` / `u128`: Size 16, Alignment 16

### 1.2. Aggregate Layout Rules
For a struct $S$ containing fields $f_0, f_1, \dots, f_{n-1}$ with sizes $S(f_i)$ and alignments $A(f_i)$:
1. The alignment of the entire struct is the maximum alignment of any of its fields:
   $$A(S) = \max_{0 \le i < n} A(f_i)$$
2. The offset of field $f_i$, denoted $\text{Offset}(f_i)$, must be a multiple of $A(f_i)$:
   $$\text{Offset}(f_0) = 0$$
   $$\text{Offset}(f_i) = \text{AlignUp}(\text{Offset}(f_{i-1}) + S(f_{i-1}), A(f_i))$$
   Where $\text{AlignUp}(x, a) = (x + a - 1) \& \sim(a - 1)$.
3. **Tail Padding**: The total size of the struct, $S(S)$, must be padded up to a multiple of $A(S)$ to ensure that array elements $S[0], S[1], \dots$ maintain valid field alignment:
   $$S(S) = \text{AlignUp}(\text{Offset}(f_{n-1}) + S(f_{n-1}), A(S))$$

---

## 2. The Fragile Struct Problem (Representation Coupling)

Consider a simple struct in a shared library:

```rust
// Version 1.0 of libfoo
struct Connection {
    fd: i32,        // offset 0, size 4
    // 4 bytes padding
    timeout_ms: i64 // offset 8, size 8
} // total size: 16 bytes, align: 8
```

Now, the library author updates the library to support encrypted connections:

```rust
// Version 1.1 of libfoo
struct Connection {
    fd: i32,        // offset 0, size 4
    is_tls: bool,   // offset 4, size 1  <-- NEW FIELD INSERTED
    // 3 bytes padding
    timeout_ms: i64 // offset 8, size 8
} // total size: 16 bytes, align: 8
```

At the API level, this seems completely backward-compatible.
However, if a field is added to the *middle* or *end* of an exported struct:
1. If caller code allocated `Connection` on its own stack:
   - In v1.0, caller allocated 16 bytes.
   - If v1.2 adds `ssl_ctx: *mut Void`, total size becomes 24 bytes.
   - When caller passes the 16-byte stack buffer to a v1.2 function, the function writes into `ssl_ctx` at offset 16, corrupting the caller's stack frame!
2. If caller reads a field whose offset changed:
   - The compiled caller code has hardcoded the machine instruction:
     `mov rax, [rdi + 8]`
   - If the field offset in v1.2 shifted from 8 to 16, the caller reads garbage.

---

## 3. High-Level Types at the ABI Boundary

### 3.1. Slices and Strings
In high-level languages, a string or slice is not a null-terminated pointer. It is a fat pointer:
$$\text{Slice} = (\text{pointer}: \text{u64}, \text{length}: \text{u64})$$
- In C: Strings are raw `char*` terminated by `\0` (O(N) length calculation, buffer overflow vulnerability).
- In Go: Slices are 3 words: `(ptr, len, cap)`. Strings are 2 words: `(ptr, len)`.
- In Rust: Slices are 2 words: `(ptr, len)`. `String` is 3 words: `(ptr, cap, len)`.
- In Rubix: Strings and buffers are length-prefixed: an 8-byte length followed immediately by contiguous UTF-8 bytes. When passed to C, a zero-copy pointer skip converts it into a C-compatible pointer.

### 3.2. Tagged Unions and Enums
A discriminated union (e.g. `Result<T, E>`) requires:
1. **Discriminant (Tag)**: 1, 2, 4, or 8 bytes identifying the active variant.
2. **Payload**: The overlapping union of variant data types.
ABI layout options:
- **Separated Tag & Union**: `tag` at offset 0, followed by padding, followed by payload at offset `align(payload)`.
- **Niche Optimization (Rust)**: Storing the discriminant inside invalid bit patterns of pointer types (e.g., `Option<&T>` uses `0x0` to represent `None`, requiring 0 extra bytes for the tag).
- **Rubix Approach**: Explicit 8-byte discriminator tag prefix for ABI stability across target architectures.

### 3.3. Dynamic Trait Objects and Vtables
A trait object (interface value) typically consists of:
1. **Data Pointer**: Address of the underlying concrete instance.
2. **Vtable Pointer**: Address of a static table of function pointers.

```
Trait Object (16 bytes):
+---------------------+---------------------+
|   Data Pointer      |   Vtable Pointer    |
|   (address of foo)  |   (address of vtbl) |
+---------------------+---------------------+
                              |
                              v
                  Vtable in .rodata:
                  +-------------------------+
                  | Type Descriptor / RTTI  |
                  | Size & Alignment Info   |
                  | Drop / Destructor Fn    |
                  | Method 1: fn_compute    |
                  | Method 2: fn_format     |
                  +-------------------------+
```

If a library adds a method to an interface:
- If the method is added to the vtable, all existing indices shift unless it is strictly appended.
- If two compilers order methods differently, calling a method invokes the wrong function pointer.

---

## 4. Representation Resilience Strategies

How can modern systems allow structs to evolve without breaking binary compatibility?

| Strategy | Mechanisms | Pros | Cons |
|:---|:---|:---|:---|
| **Opaque Pointer (PIMPL)** | Only pointers (`*mut Handle`) exposed; allocation inside library | 100% ABI resilient; fields can change freely | Extra heap allocation; pointer indirection on every field access; prevents inlining |
| **Resilient Value Witnesses (Swift)** | Runtime generates layout metadata; offsets computed at runtime | Zero source change; structs can change size | Runtime overhead: every field access loads offset from metadata table; stack allocation requires dynamic frame adjustments |
| **Frozen vs. Resilient Attribute** | Developer tags structs as `@frozen` (fixed layout) or resilient | Performance where needed, stability where needed | Manual developer burden; mistaken freeze prevents future fixes |
| **Rubix Semantic Interface** | Compiler separates semantic access from physical offsets; generates specialized adapters at boundary | Native direct performance when compatible; zero dynamic dispatch | Requires compiler ABI metadata awareness |
