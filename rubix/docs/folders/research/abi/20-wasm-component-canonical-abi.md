# The WebAssembly Component Model and Canonical ABI

## 1. The Core WebAssembly Boundary Problem

Core WebAssembly (WASM 1.0) was deliberately designed with a minimal primitive type system:
- **Only Four Types**: `i32`, `i64`, `f32`, `f64`.
- **Single Isolated Linear Memory**: A continuous array of unformatted bytes private to each module instance.

When two independent WebAssembly modules (e.g. a Python module and a Rust module) need to call each other, there is no shared object space:
- Passing a "string" requires passing a raw 32-bit integer offset into Module A's linear memory.
- Module B cannot read Module A's linear memory!
- To communicate, developers resorted to ad-hoc, brittle C FFI shims that manually allocated buffers and copied memory across instances.

---

## 2. The Canonical ABI: Formal Lifting and Lowering

To solve this fragmentation, the WebAssembly community designed the **Component Model** and the **Canonical ABI**:
A formal mathematical contract that defines how high-level Interface Types (WIT: strings, lists, records, variants, resources) are lowered to core WASM values and lifted back.

```
Caller (High-Level WIT Interface)                 Callee (High-Level WIT Interface)
  record Person { name: string, age: u32 }           record Person { name: string, age: u32 }
              |                                                  ^
              |  [canon lower]                                   |  [canon lift]
              v                                                  |
Core WebAssembly Call Boundary:
  (call $func (i32 $ptr) (i32 $len) (i32 $age))
  [Values transferred via Core WASM stack / parameters]
```

### 2.1. The Flattening Rule (`MAX_FLAT_PARAMS = 16`)
1. Types are recursively flattened into a sequence of core `i32`, `i64`, `f32`, `f64` values.
2. If the total number of flattened fields is $\le 16$, they are passed directly as function arguments.
3. If the number of flattened fields exceeds 16, the arguments are written into memory, and a single pointer (`i32`) is passed.

### 2.2. Memory Allocation Contract: `cabi_realloc`
When transferring dynamically sized data (e.g. strings or lists) to a component:
- The caller cannot simply write into the callee's linear memory.
- The caller invokes the callee's exported **`cabi_realloc(old_ptr, old_size, align, new_size)`** function to allocate memory inside the callee's address space.
- The caller copies the bytes across into the newly allocated space.
- The callee's `cabi_post_return` function is invoked afterward to clean up temporary buffers.

### 2.3. Resource Handles (`own<T>` and `borrow<T>`)
The Component Model incorporates affine resource semantics:
- **`own<T>`**: Represents exclusive ownership of an opaque resource. When passed, ownership is transferred; the caller cannot use the handle again.
- **`borrow<T>`**: Represents a temporary, scoped borrow. The resource cannot be destroyed while a borrow is active.

---

## 3. The Performance Cost of the Canonical ABI

While the Canonical ABI provides mathematical elegance and sandboxed memory safety, it comes at a steep runtime cost:
- **Mandatory Memory Copies**: Passing a 1MB string or array between two sandboxed components requires allocating memory in the callee and copying every byte via `memcpy`.
- **String Transcoding**: If components use different string encodings, strings must be transcoded at the boundary.
- **Function Call Latency**: Invoking a component function with string parameters takes **several microseconds**, orders of magnitude slower than a 1-nanosecond direct native call.

---

## 4. Key Takeaways for Rubix

1. **Formal Lifting/Lowering is Architecturally Sound**: The concept of explicit semantic types lowered to target representations matches Rubix's RUMS philosophy.
2. **First-Class Ownership is Essential**: The Component Model proved that encoding `own` (affine transfer) and `borrow` in the ABI contract prevents memory leaks and use-after-free bugs across boundaries.
3. **Zero-Copy Native Execution**: Unlike WASM, which is constrained by sandboxed linear memory isolation, Rubix operates in unified virtual address spaces, allowing affine resource transfers to execute with **zero memory copies** via direct 64-bit register moves.
