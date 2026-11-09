# `rux` Sovereign Language Specification
**Paradigm: Holographic Continuum Programming (HCP)**  
**Version:** 1.0.0  
**Governing Architecture:** Eternal Interface Architecture (EIA v2.0)  
**Exclusive Source Extension:** `.rx`  
**Exclusive Data/Config Extension:** `.rxd` (Rux Data)

---

## 1. Executive Summary

`rux` is a sovereign compiled language written exclusively in `.rx` source files and configured via `.rxd` (Rux Data) artifacts. It eliminates the historical dichotomy between high-level application ergonomics and bare-metal systems performance. 

By unifying **JavaScript/Python simplicity** (natural types `int`/`uint`/`byte`/`str`, optional semicolons, type inference, arrow functions `=>`, pipe operators `|>`, direct `println`) with **beyond-C silicon mastery** (declarative `@hologram` and `@memory` decorators, hardware `silicon.*` intrinsics, dual-virtual aliasing, and $<12\,\mu\text{s}$ field layout relocation holes), `rux` compiles **directly from `.rx` source to native executable binary** with:
- **ZERO assembly intermediate files**
- **ZERO external linkers (`ld`, `gold`, `lld`)**
- **ZERO C runtime dependency (`libc`, `glibc`, `musl`)**
- **ZERO external formats (No JSON, TOML, or YAML; pure `.rxd` sovereignty)**

---

## 2. The Holographic Continuum Paradigm

Existing systems force developers into rigid design silos:
1. **Object-Oriented Languages**: Impose vtable indirection, heap bloat, and rigid class hierarchies.
2. **Functional Languages**: Impose immutable heap copies, recursion limits, and runtime garbage collectors.
3. **Procedural Languages (C/C++)**: Require manual struct padding, ABI incompatibility across compilers, and error-prone pointer arithmetic.

`rux` operates on a **Holographic Continuum**:

$$\Sigma_{\infty} = \langle \mathcal{F}_{\text{fields}}, \mathcal{H}_{\text{holes}}, \mathcal{B}_{\text{bridges}}, \mathcal{T}_{\text{tier}} \rangle$$

Every data structure defined as a `shape` (or `struct`) is an **EIA Universal Hologram**:
- Field offsets are not permanently baked into machine code instructions at compile time.
- Field accesses (`p.score`) emit a 32-bit relocation hole (`EiaRelocHole`) into the binary text segment.
- At process boot, the microsecond in-memory patcher resolves field displacements according to runtime layout hash contracts.
- Steady-state runtime execution operates at $0.000\,\text{ns}$ overhead (pure CPU register + displacement addressing `[reg + disp32]`).

---

## 3. Ergonomics & Syntax

### 3.1 Optional Semicolons & Automatic Semicolon Insertion (ASI)
Semicolons (`;`) are completely optional. Statements can be delimited by either a newline (`\n`) or an explicit semicolon:

```rux
let a = 10
let b = 20;
let c = a + b
```

### 3.2 Declarations & Natural Type System
Variables are declared using `let`, `mut`, or `const`:
- `let x = 42`: Immutable variable with type inferred as natural `int` (always 64-bit on silicon).
- `let x: uint = 42`: Immutable variable with explicit natural `uint` (64-bit unsigned).
- `mut counter = 0`: Mutable variable with type inferred as `int`.
- `let tag: byte = 0xFF`: Byte variable (`u8`).
- `let label: str = "Sensor"`: UTF-8 string view slice.
- `const EPOCH: uint = 2`: Compile-time constant.
- Exact-width hardware types (`i64`, `u64`, `u32`, `i32`, `u16`, `u8`) remain fully available for bit-precise register and packet layouts.

```rux
const MAGIC = 0x44484945
let greeting = "Hello, world!" // Inferred as str
mut score: int = 100           // Natural int (replaces noisy i64)
score += 50
```

### 3.3 Shapes & Structs
`shape` and `struct` are synonymous keywords defining holographic data types. Field definitions can be separated by commas, newlines, or semicolons:

```rux
shape Player {
    id: uint
    score: uint
    level: u32
}
```

### 3.4 Functions & Arrow Shorthand
Functions can be defined with standard blocks or concise JS-style arrow bodies (`=>`):

```rux
// Standard block syntax using natural 'int'
fn add(a: int, b: int) -> int {
    return a + b
}

// Concise arrow shorthand
fn double(x: int) => x * 2

// Omitted return type defaults to int (exit code 0 if fallthrough)
fn main() {
    println("Welcome to Rux!")
    return 0
}
```

### 3.5 Built-in `print` & `println`
`print(str)` and `println(str)` are built-in language primitives. At compile time, `rux` computes the byte length of string literals and emits an optimized direct native write syscall, bypassing all external I/O formatting overhead:

```rux
print("Initializing kernel...")
println(" OK")
```

### 3.6 Functional Pipe Operator (`|>`)
The pipe operator forwards the left-hand expression as the first argument to the right-hand function call:

```rux
fn boost(val: uint, bonus: uint) => val + bonus

fn main() {
    let final_score = 30 |> boost(12) // Evaluates to boost(30, 12) = 42
    return final_score as int
}
```

---

## 4. Deep Silicon & Architecture Control

`rux` allows systems engineers, kernel architects, and embedded programmers to specify low-level silicon invariants directly in source code:

### 4.1 Decorators
- `@hologram(epoch: 2, permute: true, bridge: true)`:  
  Configures the 96-byte `UniversalHologramHeader` (`EIAH`), layout permutation chaos, and cross-calling-convention bridges.
- `@memory(tier: "nvram" | "dram" | "l3", align: 64, vitrify: true)`:  
  Specifies persistent cache-line alignment and hardware write-back guarantees.
- `@capability(perm: "rw" | "rx")`:  
  Specifies dual-virtual address mapping (DVAM) permission contracts.
- `@lattice(join: "max" | "add")`:  
  Enforces monotonic conflict-free replicated data type (CRDT) invariants.

```rux
@hologram(epoch: 2, permute: true, bridge: true)
@memory(tier: "nvram", align: 64, vitrify: true)
shape HardwareRingBuffer {
    head: u64
    tail: u64
    capacity: u64
}
```

### 4.2 Silicon Intrinsics (`silicon.*`)
`rux` provides direct machine instruction intrinsics without resorting to ugly or unportable inline assembly strings:

| Intrinsic | Emitted Machine Instructions | Description |
|---|---|---|
| `silicon.rdtsc() -> u64` | `rdtsc` (`0F 31`), `shl rdx, 32`, `or rax, rdx` | Reads 64-bit hardware time-stamp counter |
| `silicon.icache_sync()` | `cpuid` (`0F A2`) or `mfence` (`0F AE F0`) | Serializes execution pipeline & syncs I-cache |
| `silicon.clwb(ptr)` | `clwb [reg]` (`66 0F AE /6`) + `sfence` (`0F AE F8`) | Flushes cache line to persistent storage |
| `silicon.syscall(...)` | `syscall` (`0F 05`) / `svc #0` / `ecall` | Direct kernel vector invocation |

---

## 5. Direct-to-Binary Compilation Model

The `rux` compiler operates in a single pass directly into an ELF64, UPBP, or multi-ISA image buffer:

```
[ .rux Source ]
       │
       ▼
[ Lexer with ASI & Arrow / Pipe Recognition ]
       │
       ▼
[ AST Construction (Shapes, Decorators, Exprs) ]
       │
       ▼
[ Machine Code Emitter (x86_64 / ARM64 / RISC-V) ]
  ├── Resolves print / println string literals in .rodata
  ├── Emits 32-bit EIA Relocation Holes for field access
  └── Synthesizes Universal Hologram Header (EIAH v2.0)
       │
       ▼
[ Native Executable Binary (chmod +x) ]
```

No intermediate `.s` assembly files, no external linker script, and zero shared libraries required.
