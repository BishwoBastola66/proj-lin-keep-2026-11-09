# The Rux Language Specification: Formal Syntax, Type System, and Operational Semantics
## Master Canonical Language Specification (`SPEC-RUX-LANG-001`)

**Author:** Rux Sovereign Architecture Group  
**Classification:** Programming Language Design, Formal Grammars, & Operational Semantics  
**Status:** Canonical Language Reference Standard  
**Key Precedents:** Pierce (Types and Programming Languages), Scott (Programming Language Pragmatics)  

---

### Abstract

For decades, systems programming languages have forced software developers to compromise between expressive, human-friendly ergonomics and direct control over underlying physical silicon. C provides raw hardware control but imposes archaic header files, unsafe manual pointer decay, and fragile macro preprocessors. Rust guarantees memory safety but imposes steep cognitive friction via complex lifetime annotations (`<'a, 'b>`) and prolonged compilation times. Go provides rapid compilation but enforces mandatory garbage collection pauses and lacks expressive algebraic sum types.

We present the **Rux Sovereign Language (`.rx`)**, a systems programming language engineered under the maxim: *"Simpler than C in syntax, vastly deeper than C in silicon mastery."* Rux combines the syntactic ergonomics of modern high-level languages—local type inference, concise arrow expressions (`fn => expr`), immutability by default, deterministic scope cleanup (`defer`), and first-class memory and time unit literals (`16MB`, `250ms`)—with zero-cost bare-metal silicon control. This document provides the formal grammar specification, type system rules, memory layout semantics, and comparative design evaluation for Rux.

---

### 1. Design Principles & Language Philosophy

Rux is architected around five core maxims:
1. **Ergonomic Simplicity:** Programs should be clean and readable. Semicolons are optional, header files are eliminated, and variables are immutable by default.
2. **Predictable Performance:** Zero hidden allocations, zero tracing garbage collection, and zero runtime virtualization. Every language construct translates into deterministic, minimal machine instructions.
3. **Silicon Transparency:** High-level types map directly to physical hardware realities. Developers use natural types (`int`, `uint`, `float`) for daily development, while exact-width types (`u64`, `i32`, `u8`) remain zero-cost hardware-aligned aliases.
4. **Zero Header Burden:** Modular code uses clean, direct inclusion (`include "file.rx"`) resolved through monotonic arenas with zero header guard overhead.
5. **Deterministic Lifetime Scoping:** Scope exit guarantees resource cleanup via `defer`, executing deterministically in reverse order of declaration.

---

### 2. Lexical Grammar & Natural Primitive Types

Rux source files are UTF-8 encoded text streams. Keywords and identifiers are case-sensitive.

#### 2.1 Natural Primitive Types & Hardware Aliases
Developers write natural, intuitive keywords that developers love, while exact-width silicon types remain fully supported as hardware-level aliases:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RUX PRIMITIVE TYPE MATRIX                                       │
├────────────────────┬────────────────────┬─────────────────────┬────────────────────────┤
│ Natural Type       │ Hardware Alias     │ Physical Width      │ Silicon Representation │
├────────────────────┼────────────────────┼─────────────────────┼────────────────────────┤
│ int                │ i64                │ 64 bits (8 bytes)   │ Two's Complement Int   │
│ uint               │ u64                │ 64 bits (8 bytes)   │ Unsigned Binary Word   │
│ byte               │ u8                 │ 8 bits (1 byte)     │ Raw Unsigned Octet     │
│ float              │ f64                │ 64 bits (8 bytes)   │ IEEE-754 Double Prec   │
│ str                │ &[byte]            │ 128 bits (16 bytes) │ Fat Slice (ptr + len)  │
│ bool               │ u8                 │ 8 bits (1 byte)     │ Boolean (0 or 1)       │
│ char               │ u32                │ 32 bits (4 bytes)   │ Unicode Codepoint      │
│ void               │ ()                 │ 0 bits              │ Empty Tuple / Unit     │
└────────────────────┴────────────────────┴─────────────────────┴────────────────────────┘
```

#### 2.2 Variable Declarations & Immutability
Variables are immutable by default:

```rust
// Immutable by default
let count: int = 42;
let threshold = 1000;         // Inferred as int (i64)

// Explicitly mutable
let mut buffer_size: uint = 1024;
mut counter = 0;              // Inferred as mutable int
counter = counter + 1;

// Short declaration form (Go-style inference)
name := "Sovereign Rux";      // Inferred as immutable str

// Compile-time sealed constants
const MAX_PACKET_SIZE: uint = 65536;
const PROTOCOL_MAGIC: u32 = 0x52555843; // 'RUXC'
```

#### 2.3 First-Class Hardware Unit Literals
Integers with memory or time unit suffixes are evaluated during lexing in $O(1)$ time into raw scalar values:

```rust
let cache_limit: uint = 16MB;    // 16,777,216 bytes
let retry_delay: uint = 250ms;   // 250,000,000 nanoseconds
let epoch_timeout: uint = 5s;    // 5,000,000,000 nanoseconds
```

---

### 3. Functions, Arrow Shorthand, and Closures

Functions support explicit parameter signatures, concise single-expression arrow syntax, and implicit last-expression returns:

```rust
// Concise single-expression arrow function
fn square(x: int) => x * x;
fn is_even(n: int) => (n & 1) == 0;
fn max(a: int, b: int) => if a > b { a } else { b };

// Standard block function with explicit return
fn calculate_hash(data: *const byte, len: uint) -> uint {
    let mut hash: uint = 14695981039346656037;
    let mut i: uint = 0;
    while i < len {
        hash = (hash ^ (data[i] as uint)) * 1099511628211;
        i = i + 1;
    }
    return hash;
}
```

---

### 4. Deterministic Scope Exit (`defer` and `errdefer`)

Resource cleanup is managed deterministically via `defer` and `errdefer`, executing in **Last-In, First-Out (LIFO)** order without garbage collection pauses or mandatory destructors:

```rust
fn process_file(path: str) -> FileError!uint {
    // 1. Open persistent capability channel via USES Substrate
    let handle = @uses.open(path, USES_READ);
    if handle < 0 {
        return FileError.NotFound;
    }
    
    // Always runs upon block exit (normal return or error)
    defer @uses.close(handle);

    // Runs ONLY if the function exits with an error condition
    errdefer @terminal.print_error("Failed to process file: ", path);

    let mut buf: [byte; 4096];
    let bytes_read = @uses.read(handle, &mut buf[0], 4096);
    if bytes_read <= 0 {
        return FileError.ReadFailed;
    }

    return bytes_read as uint;
}
```

---

### 5. Shapes and Tagged Enums (Sum Types)

#### 5.1 Shapes: Zero-Cost Native Memory Structures
Composite types are declared as **Shapes**. Shapes define exact, contiguous physical memory layouts without hidden vtable pointers or dynamic padding:

```rust
shape Point3D {
    x: float,
    y: float,
    z: float,
}

shape NetworkPacket {
    header_magic: u32,
    packet_length: u16,
    checksum: u16,
    payload_ptr: *const byte,
}
```

#### 5.2 Tagged Enums (Algebraic Sum Types) & Pattern Matching
Enums support rich algebraic data payloads, evaluated through exhaustive `match` statements:

```rust
enum NetworkEvent {
    Disconnected,
    Connecting(uint),                   // Connection attempt counter
    DataPacket(NetworkPacket),          // Payload shape
    FatalError(FileError),              // Typed error code
}

fn handle_event(event: NetworkEvent) {
    match event {
        NetworkEvent.Disconnected => @terminal.print_line("Disconnected."),
        NetworkEvent.Connecting(retry) => @terminal.print_line("Retrying: ", retry),
        NetworkEvent.DataPacket(pkt) => process_packet(&pkt),
        NetworkEvent.FatalError(err) => panic("Fatal network condition"),
    }
}
```

---

### 6. Parametric Generics Syntax

Generic functions and shapes declare type parameters inside brackets `[T]`, specialized via load-time machine stencils (ANSS) without C++ monomorphization binary bloat:

```rust
shape RingBuffer[T, const CAP: uint] {
    slots: [T; CAP],
    head: uint,
    tail: uint,
}

fn push[T](ring: *mut RingBuffer[T, CAP], item: T) -> bool {
    let next_tail = (ring.tail + 1) % CAP;
    if next_tail == ring.head {
        return false; // Full
    }
    ring.slots[ring.tail] = item;
    ring.tail = next_tail;
    return true;
}
```

---

### 7. Module Namespaces & Export Visibility

To prevent C-style global symbol collisions, Rux enforces clean namespaced imports and explicit public visibility (`pub`):

```rust
// In "crypto/hash.rx"
pub fn blake3_digest(data: &[byte]) -> u64 { ... }
fn internal_round() { ... } // Private to module

// In "main.rx"
import "crypto/hash.rx" as crypto;

pub fn main() -> int {
    let digest = crypto.blake3_digest(buffer[0..256]);
    return 0;
}
```

---

### 8. The USES Substrate Standard API & Silicon Intrinsics

Developers interact with memory, I/O, and hardware through unified substrate builtins that compile directly to either **Ring 0 Bare-Metal MMIO** or **User-Space ACRQ Rings** depending on target environment:

```rust
// 1. Storage & Channel Operations via @uses
let h = @uses.open("config.rxd", USES_READ);
let bytes = @uses.read(h, buf, 1024);
let written = @uses.write(h, data, len);
@uses.close(h);

// 2. Direct Memory Allocation from Spacetime Plates
let plate: *mut u8 = @uses.alloc(16MB);
defer @uses.free(plate, 16MB);

// 3. Hardware Silicon Intrinsics via @silicon
let cycles: uint = @silicon.rdtsc();           // Read CPU time-stamp counter
@silicon.clwb(plate);                          // Non-volatile cache line writeback
@silicon.sfence();                             // Store serialization barrier
let old_val = @silicon.atomic_add(&counter, 1);// Hardware bus-locked atomic add
```

---

### 9. Foreign Function Interface (FFI)

Rux interfaces directly with legacy C/C++ libraries and operating system symbols through `extern "C"` declaration blocks:

```rust
extern "C" {
    fn sqlite3_open(filename: *const byte, db: *mut *mut byte) -> int;
    fn sqlite3_exec(db: *mut byte, sql: *const byte, cb: *const byte, arg: *mut byte, err: *mut *mut byte) -> int;
    fn sqlite3_close(db: *mut byte) -> int;
}
```

---

### 10. Formal Operational Semantics

We define the operational semantics of Rux as a small-step transition system over configurations $\langle e, \sigma \rangle$, where $e$ is an active expression and $\sigma$ represents physical memory state:

#### 10.1 Variable Lookup
$$\frac{\sigma(x) = v}{\langle x, \sigma \rangle \to \langle v, \sigma \rangle}$$

#### 10.2 Scope Defer Evaluation
$$\frac{\langle e_1, \sigma \rangle \to \langle v_1, \sigma' \rangle}{\langle \text{block} \{ \text{defer } e_2; e_1 \}, \sigma \rangle \to \langle \text{seq}(v_1, e_2), \sigma' \rangle}$$

#### 10.3 USES Substrate Ring Enqueue
$$\frac{\text{sq.tail} + 1 \neq \text{sq.head}}{\langle \text{@uses.submit}(op, src, dst), \sigma \rangle \to \langle 0, \; \sigma[\text{sq.entries}[\text{tail}] \mapsto \text{sqe}, \; \text{tail} \mapsto \text{tail} + 1] \rangle}$$

---

### 7. Comparative Language Ergonomics

```text
┌─────────────────────────┬──────────────────┬──────────────────┬────────────────┬───────────────┐
│ Feature / Capability    │ C (C11)          │ Rust 1.80        │ Go 1.24        │ Rux Sovereign │
├─────────────────────────┼──────────────────┼──────────────────┼────────────────┼───────────────┤
│ Immutability by Default │ ❌ const manual  │ 🏆 let / let mut │ ❌ None (all)  │ 🏆 let/let mut│
│ Header Files Required   │ ❌ Yes (.h files)│ 🏆 No (Modules)  │ 🏆 No (Packages│ 🏆 No (.rx)   │
│ Deterministic Cleanup   │ ❌ Manual free() │ 🏆 RAII Drop     │ 🏆 defer       │ 🏆 defer      │
│ Memory Unit Literals    │ ❌ None          │ ❌ None          │ ❌ None        │ 🏆 16MB, 250ms│
│ Tracing Garbage Collect │ 🏆 None          │ 🏆 None          │ ❌ Mandatory GC│ 🏆 None       │
│ Lifetime Annotation Tax │ 🏆 None          │ ❌ Complex <'a>  │ 🏆 None        │ 🏆 None       │
│ Single-Command Freestnd │ ❌ Complex ld    │ ❌ Target config │ ❌ Runtime pkg │ 🏆 Built-in   │
└─────────────────────────┴──────────────────┴──────────────────┴────────────────┴───────────────┘
```

### 8. Conclusion
The Rux Sovereign Language reconciles high-level developer ergonomics with low-level silicon mastery. By eliminating accidental historical complexities (header files, mandatory semicolons, tracing garbage collectors, and verbose lifetime annotations) while introducing native unit literals, concise arrow functions, and deterministic bump-arena scoping, Rux establishes an optimal language standard for 21st-century systems programming.

---
**References:**
1. Pierce, B. C. (2002). *Types and Programming Languages*. MIT Press.
2. Scott, M. L. (2015). *Programming Language Pragmatics*. Morgan Kaufmann.
3. Kernighan, B. W., & Ritchie, D. M. (1988). *The C Programming Language (2nd ed.)*. Prentice Hall.
4. Matsakis, N. D., & Klock, F. S. (2014). *The Rust language*. ACM SIGAda Ada Letters, 34(3), 103–104.

