# 17. Complete Multi-Language Synthesis (Rust + Zig + QuickJS + TinyCC)

## 1. Executive Architectural Overview

Rux synthesizes the strongest compile-time, runtime, and binary-emission capabilities from all four reference compilers in `languages/` (`rust`, `zig`, `quickjs`, `tinycc`) into a single self-hosted compiler (`compiler/rux.rx`) with **zero external dependencies**, **zero `libc` link**, and **strict < 800 lines per compiler module** modular discipline:

```
+-----------------------------------------------------------------------------------+
|                        RUX SOVEREIGN MULTI-LANGUAGE SYNTHESIS                     |
+-------------------+-------------------+---------------------+---------------------+
|    RUST PARITY    |    ZIG PARITY     |   QUICKJS PARITY    |    TINYCC PARITY    |
+-------------------+-------------------+---------------------+---------------------+
| - Ownership/Move  | - comptime Engine | - Closures/Upvalues | - Full Preprocessor |
| - Borrow/Lifetime | - !T, try, catch  | - Returned Closures |   (#define, #ifdef) |
| - Drop (RAII)     | - errdefer        | - Optional Chaining | - union & Bitfields |
| - Send / Sync     | - ?T Optionals    |   (?.) & Nullish ?? | - Variadics (...)   |
| - Trait Bounds    | - []T Fat Slices  | - Event Loop &      |   & lib/c/stdarg.rx |
| - impl Trait      | - @Vector / @simd |   Microtask Queue   | - Relocatable .o,   |
| - dyn Trait Vtable| - @TypeOf/@TypeInfo| - Promise::all/race |   Static .a, Shared |
| - Never Type (!)  | - @asm Inline Asm | - Native Regex NFA  |   .so ELF Emission  |
| - #[derive(Copy)] | - packed struct   | - Opt-in Mark/Sweep | - @cImport/@cInclude|
| - DWARF v4 Debug  | - Allocator Vtable|   GC & TypedArrays  |   Header Bridge     |
+-------------------+-------------------+---------------------+---------------------+
```

---

## 2. Rust Parity Architecture

| Feature | Implementation Module | Technical Mechanism |
|---|---|---|
| **`Copy` / `Clone` & `#[derive(Copy, Clone)]`** | `compiler/src/traits.rx`, `compiler/src/driver.rx` | Pre-seeds `Copy` (`3929114272712712900`) and `Clone` (`6784203327934035010`) traits; `#[derive(Copy, Clone)]` registers `TraitImpl` entries so the borrow/move verifier treats derived structs as `Copy`. |
| **`impl Trait` in Return Position** | `compiler/src/parser_decl.rx` | Parses `-> impl Trait` and resolves the concrete return struct layout while enforcing trait conformance. |
| **`dyn Trait` & `@vtable(Trait, Type)`** | `compiler/src/traits.rx`, `compiler/src/reflect_simd.rx`, `compiler/src/codegen_x86_expr.rx` | Every `trait` registers a 16-byte fat pointer `{ data: *mut u8, vtable: *mut u64 }`. `@vtable(Trait, Type)` emits a `.rodata` method table populated via RIP-relative `CallFixup` slots, and `d.method(...)` dispatches indirectly through `call r11`. |
| **Never Type (`-> !`)** | `compiler/src/parser_decl.rx` | Recognizes `-> !` diverging return type annotations on functions that never return (`sys_exit`, `unreachable`). |
| **Full Async Runtime (`AsyncExecutor`)** | `lib/sync/executor.rx` | Provides `AsyncExecutor`, macrotask scheduling, microtask draining, and `Promise` combinators. |
| **Stdlib Collections (`HashSet`, `VecDeque`, `BTreeMap`)** | `lib/core/hashset.rx`, `lib/core/vecdeque.rx`, `lib/core/btreemap.rx` | Open-addressing `HashSet`, power-of-two ring-buffer `VecDeque`, and binary-searched sorted `BTreeMap`. |
| **LSP, Linter (`clippy`), Formatter, REPL** | `tools/lsp/lsp.rx`, `tools/lint/clippy.rx`, `tools/fmt/formatter.rx`, `tools/repl/repl.rx` | Native IDE symbol indexing & go-to-definition, static lint analysis, source formatting, and interactive expression evaluation. |

---

## 3. Zig Parity Architecture

| Feature | Implementation Module | Technical Mechanism |
|---|---|---|
| **`comptime` Execution Engine** | `compiler/src/reflect_simd.rx` | Full AST interpreter (`eval_comptime_node`, `eval_comptime_stmt_list`, `register_comptime_fn`) capable of evaluating `comptime fn`, `let`, loops (`while`), conditionals (`if`/`else`), and recursion at compile time, baking results into `NODE_INT_LIT` constants. |
| **Error Unions (`!T`, `try`, `catch`, `errdefer`)** | `compiler/src/parser_expr.rx`, `compiler/src/parser_stmt.rx`, `compiler/src/codegen_x86_helpers.rx` | `!T` error union types, prefix `try expr` early-return unwrapping, binary `expr catch fallback`, and `errdefer` scope-exit blocks that execute only when `rax < 0` or `rax == 0`. |
| **Optional Types (`?T`) & Slices (`[]T`)** | `compiler/src/parser_stmt.rx`, `compiler/src/parser_decl.rx` | Native `?T` optional prefix syntax and `[]T` slice type annotations. |
| **Inline Assembly (`@asm`)** | `compiler/src/reflect_simd.rx`, `compiler/src/codegen_x86_expr.rx` | `NODE_INLINE_ASM` (kind 135) emits raw hex machine code bytes (`@asm("48ffc0")` -> `inc rax`), mnemonics (`nop`, `mfence`, `lfence`, `sfence`, `cpuid`, `pause`), or raw byte arguments directly into `.text`. |
| **SIMD Vector Types (`@Vector`, `@simd.*`)** | `compiler/src/reflect_simd.rx`, `compiler/src/codegen_x86_ops.rx` | `@Vector(N, T)` 16-byte stack allocation and native x86-64 SSE2 128-bit vector instructions (`movdqu`, `paddq`, `psubq`, `paddd`, `pxor`). |
| **Compile-Time Reflection (`@TypeOf`, `@TypeInfo`)** | `compiler/src/reflect_simd.rx` | Compile-time type hash and struct size/alignment introspection. |
| **`packed struct`, `thread_local`, `export`** | `compiler/src/traits.rx`, `compiler/src/strings.rx` | `packed struct` disables field padding (`align = 1`); `export` and `thread_local` modifiers supported on declarations. |

---

## 4. QuickJS (JavaScript) Parity Architecture

| Feature | Implementation Module | Technical Mechanism |
|---|---|---|
| **First-Class Closures & Upvalue Capture** | `compiler/src/codegen_x86_helpers.rx`, `compiler/src/codegen_x86_stmt.rx`, `compiler/src/codegen_x86_expr.rx` | Functions containing anonymous lambdas mirror parameters and locals into writable `.rodata` upvalue cells (`1024..2048`), enabling both mutable upvalues and returned closures (`fn(int) -> int`) with zero ABI overhead. |
| **Optional Chaining (`?.`) & Nullish Coalescing (`??`)** | `compiler/src/lexer.rx`, `compiler/src/parser_expr.rx`, `compiler/src/codegen_x86_expr.rx`, `compiler/src/codegen_x86_ops.rx` | `ptr?.field` short-circuits to `0` if `ptr == 0` before dereferencing; `lhs ?? rhs` evaluates `rhs` only when `lhs == 0`. |
| **Event Loop, Microtasks & `Promise::all` / `Promise::race`** | `lib/sync/executor.rx` | Drains queued microtasks before macrotasks and provides `promise_all` and `promise_race`. |
| **Native Regular Expression Engine** | `lib/format/regex.rx` | Zero-dependency NFA/backtracking matcher supporting `^`, `$`, `.`, `*`, `+`, `?`, `[a-z0-9]`, `\d`, `\w`, `\s`. |
| **Opt-in Mark-and-Sweep GC & `TypedArray`** | `lib/core/gc.rx` | `GcHeap` (`gc_alloc`, `gc_mark`, `gc_sweep`) and `ArrayBuffer` / `Uint8Array` views. |

---

## 5. TinyCC (C) Parity Architecture

| Feature | Implementation Module | Technical Mechanism |
|---|---|---|
| **Full C Preprocessor** | `compiler/src/preprocessor.rx` | Supports `#include "..."`, `#define` (both object-like constants and parameterized function macros `ADD(a, b)`), `#undef`, `#ifdef`, `#ifndef`, `#if`, `#elif`, `#else`, `#endif`, and `#pragma once`. |
| **`union` & Bitfields (`: width`)** | `compiler/src/parser_decl.rx`, `compiler/src/traits.rx` | Native `union` layout where all fields share `offset = 0` and `total_size = max(field_size)`, plus C struct bitfield width syntax (`field: u32 : 4`). |
| **Variadic Functions (`...`, `va_list`)** | `compiler/src/parser_decl.rx`, `lib/c/stdarg.rx` | Functions with `...` pad signature to 6 register arguments; `lib/c/stdarg.rx` provides `VaList`, `va_start_4`, `va_arg_int`, `va_end_clean`. |
| **Relocatable `.o`, Static `.a`, Shared `.so`** | `compiler/src/writer_elf.rx` | Automatic ELF64 `ET_REL` (`.o`), `ET_DYN` (`.so`), and Unix `!<arch>\n` static archive (`.a`) emission inferred from output file extension. |

---

## 6. Ecosystem, Runtime, JIT, C-Interop & Build System Synthesis

| Ecosystem / Runtime Capability | Implementation Module | Technical Mechanism |
|---|---|---|
| **Production Async Runtime & Linux Epoll Reactor** | [`lib/sync/executor.rx`](file:///home/bishwaxyz/ru/lib/sync/executor.rx) | Multi-yield coroutine poll state machine (`POLL_PENDING` / `POLL_READY`, `CoroutineTask`), Linux `SYS_epoll_create1` (`291`) reactor, microtask job queue, and `Promise::all` / `Promise::race`. |
| **Complete TLS 1.3 Key Schedule + AEAD + `BinaryHeap`** | [`lib/net/tls.rx`](file:///home/bishwaxyz/ru/lib/net/tls.rx) | RFC 8446 HKDF-Extract / Expand-Label key schedule (`tls_derive_key_schedule`), 16-byte AEAD tag sealing/opening (`tls_aead_seal_record`, `tls_aead_open_record`) with tamper rejection, and max-heap priority queue (`BinaryHeap`). |
| **Production `clippy` Linter & `rustfmt` Formatter** | [`tools/lint/clippy.rx`](file:///home/bishwaxyz/ru/tools/lint/clippy.rx), [`tools/fmt/formatter.rx`](file:///home/bishwaxyz/ru/tools/fmt/formatter.rx) | 6-rule static code analyzer (`unsafe`, raw pointer cast, `while true`, `/ 0` div-by-zero, `{}` empty blocks, `TODO` markers) and deterministic brace-depth source formatter (`fmt_format_buffer`). |
| **C Header Interop (`@cInclude`, `#include "foo.h"`)** | [`compiler/src/calling_conv.rx`](file:///home/bishwaxyz/ru/compiler/src/calling_conv.rx), [`compiler/src/preprocessor.rx`](file:///home/bishwaxyz/ru/compiler/src/preprocessor.rx) | Compile-time C header translator (`translate_c_header_to_rux`) converting C `#define`, `typedef`, `struct`, `typedef struct`, and C function prototypes from `.h` files into native Rux AST declarations. |
| **Integrated Build System (`rux build -target ...`)** | [`compiler/src/driver.rx`](file:///home/bishwaxyz/ru/compiler/src/driver.rx), [`lib/build/build_system.rx`](file:///home/bishwaxyz/ru/lib/build/build_system.rx) | Automatic `build.rx` / `main.rx` discovery on `rux build`, `-target <arch>` CLI flag support (`linux`, `arm64`, `riscv64`, `win64`, `macos`, `macos-arm64`, `uefi`), and `BuildGraph` declarative step runner. |
| **Preemptive M:N Work-Stealing Goroutine Scheduler** | [`lib/sync/goroutine.rx`](file:///home/bishwaxyz/ru/lib/sync/goroutine.rx) | Multiplexes up to 256 `GoroutineG` tasks across $P$ `ProcessorP` local run queues with timeslice preemption quanta and cross-processor work stealing (`mn_steal_work`). |
| **Typed `Chan<T>` & Native `select { ... }` Statement** | [`compiler/src/parser_stmt.rx`](file:///home/bishwaxyz/ru/compiler/src/parser_stmt.rx), [`lib/sync/channel.rx`](file:///home/bishwaxyz/ru/lib/sync/channel.rx) | Native `select { case chan_try_recv(...) => { ... } default => { ... } }` statement and generic `Chan<T>` ring buffer. |
| **Native x86-64 Runtime JIT Compiler** | [`lib/jit/jit_engine.rx`](file:///home/bishwaxyz/ru/lib/jit/jit_engine.rx) | Allocates executable RWX memory via Linux `sys_mmap` (`PROT_READ | PROT_WRITE | PROT_EXEC = 7`), emits native x86-64 machine instructions at runtime, and executes the compiled function pointer on silicon. |
| **DOM / BOM Web APIs & TypeScript Gradual Typing (`any`)** | [`compiler/src/strings.rx`](file:///home/bishwaxyz/ru/compiler/src/strings.rx), [`lib/web/dom_bom.rx`](file:///home/bishwaxyz/ru/lib/web/dom_bom.rx) | `DomDocument`, `DomElement`, `document_get_element_by_id`, `EventTarget` listener dispatch, `LocalStorage`, plus `any` / `unknown` gradual type keywords and `AnyVal` dynamic runtime values. |


