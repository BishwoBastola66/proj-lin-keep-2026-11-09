# Rejected Ideas Database

> **An Explicit Archive of Discarded Language, Runtime, and Compiler Designs**
> *Prepared for the Rubix Next Architectural Foundation*

---

## 1. Overview & Discipline

An architecture is defined as much by what it rejects as by what it adopts. In naive projects, discarded ideas are silently forgotten, only to be resurrected years later by well-meaning contributors who repeat the exact same failures.

Rubix Next maintains this explicit **Rejected Ideas Database** documenting:
1. **The Idea**
2. **Why it was superficially attractive**
3. **Empirical evidence considered**
4. **Failure mode & why it was rejected**
5. **Whether the failure is fundamental or hardware-dependent**
6. **Conditions under which it could ever be reconsidered**

---

## 2. The Discarded Designs

### Rejected Idea 1: Traditional Tracing Garbage Collection (Stop-The-World or Concurrent)
- **Why It Was Attractive**: Eradicates all manual memory tracking; simplifies cyclical data structures; creates a frictionless onboarding experience for junior engineers.
- **Evidence**: Java, Go, C#, JavaScript, Python, OCaml, Haskell.
- **Failure Mode**:
  - Unpredictable latency spikes (p99/p999 tail latency) that make the language non-viable for operating system kernels, audio processing, robotics, databases, game engines, and financial trading.
  - Destroys hardware cache locality: tracing pointer graphs touches cold memory pages and causes cache line invalidation.
  - Memory tax: requires 2x to 3x memory footprint overhead to operate efficiently without constant collection cycles.
- **Is Failure Fundamental?**: Yes, with respect to modern multi-level cache hierarchies where memory latency is 200x slower than CPU ALU operations.
- **Reconsideration Condition**: Only if future hardware incorporates zero-latency, zero-power associative hardware-managed garbage collection directly into silicon (which does not exist and is physically improbable).
- **Verdict**: **REJECTED.** Rubix Next uses Affine Ownership, Region Arenas, and Escape Analysis.

---

### Rejected Idea 2: Unchecked Manual Pointer Arithmetic as the Primary Memory Model
- **Why It Was Attractive**: Maximum theoretical raw machine performance; zero compiler analysis overhead; direct parity with C.
- **Evidence**: C, C++, baseline Rubix (prior to Next).
- **Failure Mode**:
  - 70% of high-severity CVEs across industry are spatial or temporal memory corruptions.
  - Arbitrary pointer aliasing blinds the optimizer: the compiler cannot safely vectorize or reorder instructions because any pointer might write to the memory location of any other pointer.
- **Is Failure Fundamental?**: Yes. Human beings cannot maintain spatial and temporal pointer invariants across large codebases over decades.
- **Reconsideration Condition**: Never.
- **Verdict**: **REJECTED.** Safe affine references and bounded region slices are default; raw pointers are restricted to explicit `CapUnsafe` FFI blocks.

---

### Rejected Idea 3: Monadic Effect Encodings (Haskell-Style IO Monads & Monad Transformers)
- **Why It Was Attractive**: Mathematical purity; provable referential transparency; explicit encapsulation of side effects.
- **Evidence**: Haskell, PureScript.
- **Failure Mode**:
  - "Monad Transformer Hell": Combining IO, State, Error, and Reader monads creates impenetrable type signatures (`ReaderT Config (ExceptT AppError (StateT State IO)) a`) and severe cognitive fatigue.
  - Runtime penalty: Monadic closures allocate thunks and indirect call jumps, destroying hardware branch prediction and CPU instruction pipelining.
- **Is Failure Fundamental?**: Yes, software engineering cognitive load and runtime call indirection.
- **Reconsideration Condition**: Never in a systems language.
- **Verdict**: **REJECTED.** Rubix Next implements **Algebraic Effect Typing as Compiler Metadata**, not runtime monadic wrappers. An effect is a compile-time set tag on the function (`effect(io, syscall)`), incurring ZERO runtime boxing overhead.

---

### Rejected Idea 4: Pure Lexical Lifetime Parameter Infection (Rust-Style Named Lifetimes Everywhere)
- **Why It Was Attractive**: Complete compile-time memory safety without garbage collection.
- **Evidence**: Rust's `'a, 'b, 'c` lifetime annotations on structs and functions.
- **Failure Mode**:
  - "Lifetime infection": Adding a lifetime annotation to a low-level struct forces every caller, container, and trait up the call stack to declare and thread the generic lifetime parameter.
  - High barrier to entry: Developers spend hours debugging complex lifetime variance rules rather than writing business logic.
- **Is Failure Fundamental?**: No, it is an ergonomic failure of manual parameterization.
- **Reconsideration Condition**: Rust has made lifetime elision better, but the fundamental pain remains on cyclic structures.
- **Verdict**: **REJECTED.** Rubix Next replaces manual lifetime annotation threading with **Lexical Region Arenas** and **Automated Escape Analysis**. The compiler infers the scope of borrows automatically; when cyclic or complex data is needed, it is allocated in a named region arena whose lifetime is bounded by the block.

---

### Rejected Idea 5: Mandating an External Heavy Toolchain (LLVM / Clang / GCC Dependency)
- **Why It Was Attractive**: Decades of optimization passes; support for every obscure CPU architecture; out-of-the-box vectorization.
- **Evidence**: Rust, Swift, Clang, Zig, Julia.
- **Failure Mode**:
  - Gigantic compiler binary sizes (hundreds of megabytes).
  - Horrendous compilation speeds: building a small project takes 10 to 60 seconds; enterprise projects take 30+ minutes.
  - Loss of architectural sovereignty: the language becomes subservient to LLVM's internal IR representation and bugs.
- **Is Failure Fundamental?**: Yes, LLVM's internal design prioritizes heavy-pass whole-program optimization over developer compilation latency.
- **Reconsideration Condition**: LLVM may optionally be supported as an auxiliary backend for maximum release PGO builds, but never as the required primary toolchain.
- **Verdict**: **REJECTED.** Rubix Next's primary engine is **RUMS Next (Rubix Universal Machine Synthesis)**, which directly generates native ELF64, PE/COFF, Mach-O, and WASM in milliseconds with zero external dependencies.

---

### Rejected Idea 6: Ambient Syscall Authority for Libraries
- **Why It Was Attractive**: Standard POSIX paradigm; simple function calls (`sys_open()`, `socket()`) without passing capability handles.
- **Evidence**: C, Python, Go, Node.js (prior to experimental permissions).
- **Failure Mode**:
  - Supply-chain hijacking: a logging or color-printing library secretly executes `curl` or opens a socket to exfiltrate passwords from `/etc/passwd`.
- **Is Failure Fundamental?**: Yes, ambient authority is a proven security flaw.
- **Reconsideration Condition**: Never.
- **Verdict**: **REJECTED.** All privileged operations require an explicit capability token (`CapFs`, `CapNet`, `CapProc`, `CapSyscall`).
