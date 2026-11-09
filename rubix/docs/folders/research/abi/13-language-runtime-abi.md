# Language Runtime ABI and Memory Boundaries

## 1. The Hidden Runtime Coupling Problem

High-level programming languages rarely compile to raw standalone machine code. They rely on a **Language Runtime** that manages:
- Dynamic heap allocation and deallocation
- Threading models and goroutine/task schedulers
- Garbage collection safepoints, read/write barriers, and stack maps
- Coroutine state machines and suspension frames
- Global exception dispatch tables and panic handlers

When two binary components (e.g. an application and a shared library) interact, they often collide on hidden runtime assumptions.

---

## 2. The Cross-Allocator Disaster

One of the most frequent causes of undefined behavior in multi-component software is the **allocator boundary violation**:

```
Application (Linked against jemalloc)            Shared Library (Linked against glibc malloc)
+------------------------------------+           +------------------------------------+
| ptr = lib_create_object()          | <-------- | Allocates 256 bytes via malloc()   |
| ... uses object ...                |           +------------------------------------+
| free(ptr)                          | 
+------------------------------------+
                   |
                   v
  [jemalloc free() invoked on glibc chunk]
  -> Corrupts jemalloc slab metadata
  -> Triggers fatal heap corruption crash (SIGSEGV / abort)
```

In standard C and C++, allocating an object in one dynamic module and freeing it in another is undefined behavior unless both modules share the exact same dynamic C runtime DLL (e.g. `MSVCRT.DLL` on Windows).

---

## 3. Garbage Collection Safepoints and Stack Maps

In managed runtimes (Go, Java, OCaml, .NET):
1. The garbage collector periodically pauses threads to trace live heap pointers.
2. The runtime requires **Stack Maps**: metadata emitted by the compiler for every instruction where a GC pause can occur (safepoint), recording which CPU registers and stack slots hold GC pointers.
3. If native code (C / C++ / Rust) calls into or is called by the managed runtime:
   - The GC cannot inspect registers or stack slots in the unmanaged frame.
   - Pointers passed across the boundary must be pinned in memory (`GCHandle.Alloc(..., GCHandleType.Pinned)` in C#).
   - The thread must explicitly transition between "in GC" and "in native" states, introducing a 50–100 cycle latency penalty on every boundary crossing.

---

## 4. Coroutine and Async/Await ABIs

Modern async/await models (Rust, C++20, Swift) lower asynchronous functions into state machines:
- **Resumption Frame**: A dynamically allocated or caller-provided frame holding spilled local variables and the current suspension point index.
- **Poll / Resume Function Pointer**: A standardized entry point that advances the state machine until the next yield or completion.
- **The ABI Freeze Hazard**: If an async function's local variables change, the size and layout of its resumption frame changes. If the caller allocates this frame, updating the async library breaks the caller's stack or heap layout.

---

## 5. The Rubix Zero-Runtime Architecture

Rubix eliminates runtime coupling through sovereign, self-contained architecture:
1. **Affine Linear Ownership**: Memory deallocation is governed by affine ownership types verified at compile time. No garbage collector or background runtime thread exists.
2. **Lexical Region Arenas**: Temporary allocations occur in local bump-allocated regions ([compiler/middle/escape_analysis.bix](file:///home/bishwaxyz/translator/rubix/compiler/middle/escape_analysis.bix)), reset instantaneously in $O(1)$ time upon scope exit.
3. **Explicit Allocator Parameters**: When dynamic memory crosses a boundary, allocator handles are passed explicitly or owned affine buffers are transferred with clear ownership, preventing cross-allocator corruption.
