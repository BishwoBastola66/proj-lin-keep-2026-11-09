# Rubix

**A self-hosting, zero-dependency native compiler and execution platform.**

> `.bix source → machine code bytes → in-memory execution`
> Zero GCC · Zero Clang · Zero LLVM · Zero `as` · Zero `ld`

---

## 1. What Rubix Is

Rubix is a programming language and a **native compiler toolchain written entirely in itself**.

It goes from source code to running machine code **without ever invoking another language's
toolchain**. There is no C compiler, no assembler, no linker, and no libc in the execution path.
The compiler emits x86‑64 opcodes directly, runs them in memory, builds ELF executables by hand,
and also targets ARM64, RISC‑V64, and a portable bytecode format (REX).

Everything is `.bix`:

- Lexer, parser, AST, semantic analysis
- UIR/TIR intermediate representations
- Optimizer and register allocator
- x86‑64 / ARM64 / RISC‑V back ends
- REX bytecode encoder, interpreter, and VM
- Standard library, web/UI framework, REPL, formatter, LSP

Rubix does not sit on top of the C ecosystem. It replaces it.

---

## 2. The Core Claim

The defining invariant — stated verbatim in the build file:

```
# ==============================================================================
# Rubix Compiler — Native Independent Compiler
# Pure Rubix Architecture: .bix -> Machine Code Bytes -> In-Memory Execution
# Zero GCC, zero Clang, zero LLVM, zero 'as', zero 'ld'
# ==============================================================================
```

How each layer is replaced:

| Traditional layer | How Rubix removes it |
|---|---|
| C compiler (gcc/clang) | Compiler emits machine bytes itself |
| Assembler (`as`, text `.s` IR) | Direct opcode byte emission |
| Linker (`ld`, relocations) | Hand-built ELF64 writer |
| libc (malloc, printf, POSIX) | Raw Linux syscalls |
| C runtime startup (`crt0`, `_start`) | Own entry point + ELF header |
| Prebuilt runtime archive (`.a`) | Nothing to link against |
| C ABI / calling convention | Own register mapping & convention |
| Interpreter/VM written in C | Interpreter + VM written in `.bix` |
| Single-target lock-in | Machine descriptors per target |

**One honest exception:** the *bootstrap* still calls `gcc` once to build stage 1
(`legacy/scripts/selfhost.sh`). After that, stages 2 and 3 are produced natively. The
toolchain is a one-time bootstrap crutch, not a runtime dependency.

---

## 3. How It Works

### 3.1 Source → Machine Code Pipeline

```
.bix source
   │  lexer → parser → AST
   ▼
UIR  (Universal IR)          21-pass optimizer, fixed-point iteration
   │
   ▼
TIR  (Typed IR)              float promotion, type rules
   │  instruction selection
   ▼
machine code bytes           machine-descriptor driven
   │  register allocation     Poletto–Sarkar linear scan
   ▼
in-memory execution   OR   hand-built ELF   OR   .rex module
```

### 3.2 Direct Byte Emission

Instead of generating text assembly, the compiler writes literal opcode bytes:

- `emit_byte()` — writes raw opcodes (e.g. `48 8B 07` = `mov rax, [rdi]`)
- `emit_jmp_rel32()` — backpatches relative jumps in a single pass
- Float arithmetic is emitted as real IEEE‑754 bytes:
  `addsd xmm0, xmm1` → `242 15 88 193` (`F2 0F 58 C1`), plus `mulsd` / `divsd`

### 3.3 In-Memory Execution (W^X)

```
mmap RW buffer → emit machine code bytes
               → sys_mprotect(buf, len, 5)   # flip to Read | Execute
               → sys_call_code(buf)          # jump straight in
```

No process spawn, no assembler, no temporary files.

### 3.4 Hand-Built ELF

For standalone binaries, Rubix writes the ELF64 header and sections itself via raw syscalls
(`sys_open`, `sys_write_all`, `sys_close`) — no linker involved.

---

## 4. Language Surface

A statically typed, systems-oriented language with an ergonomic expression style.

```rubix
# Recursion + Tail-Call Optimization
fn fib(n: Integer): Integer {
    if n <= 1 { n } else { fib(n - 1) + fib(n - 2) }
}

# Tail-recursive: compiled into a zero-overhead loop with O(1) stack space
fn sum_acc(n: Integer, acc: Integer): Integer {
    if n <= 0 { acc } else { sum_acc(n - 1, acc + n) }
}

fn main(): Integer {
    print "Fibonacci(10):"
    print fib(10)
    print "Tail-recursive sum 1..100:"
    print sum_acc(100, 0)
    0
}
```

### Feature highlights

- **Implicit returns** — the last expression of a block is its value
- **If-as-expression** — `if c { a } else { b }` yields a value
- **Guaranteed tail-call optimization** — direct self-calls at return sites become loop jumps
- **Struct / record types**
- **Option / Result & ADTs** — `Ok`, `Err`, `Some`, `None`, `Success`, `Failure`
- **Full float support** — `f64` / `f32` with real `addsd`/`mulsd`/`divsd` codegen
- **Rich ergonomics** — `match`, `defer`, destructuring, `?`/elvis operators, pipelines,
  ranges, string interpolation, method syntax, inferred arrays, enums in `for`

---

## 5. Multi-Target: RUMS + Machine Descriptors

**RUMS (Rubix Universal Machine Synthesis)** = one IR, many targets, driven by loadable
`.machine` descriptor files parsed entirely in pure Rubix.

| Descriptor | Target | Word | Args / Return |
|---|---|---|---|
| `x86_64.machine` | x86‑64 native ELF | 64 | `rdi,rsi,rdx,rcx,r8,r9` / `rax,rdx` |
| `arm64.machine` | ARM64 native ELF | 64 | `x0–x7` / `x0` |
| `riscv64.machine` | RISC‑V64 native ELF | 64 | LP64 |
| `rex.machine` | REX portable bytecode | 64 | REX ISA |
| `synthetic.machine` | Synthesis / validation target | — | — |

Verified across dedicated multi-arch test suites, with committed `.arm64.elf` and `.riscv.elf`
artifacts.

---

## 6. REX — Portable Bytecode with 3 Execution Tiers

**REX (Rubix Execution eXchange)** is a `.rex` module format and architecture-neutral ISA.
It is executed by **three differentially-verified tiers** — all must produce identical
outputs and identical trap codes.

```
Rubix Source → UIR → generalized RUMS
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
     x86-64            ARM64             REX (.rex)
   (Native ELF)      (Native ELF)           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
            Tier 1: COMPILED       Tier 2: INTERPRETED    Tier 3: REFERENCE VM
            Native x86-64 JIT       Direct Bytecode         Semantic Baseline
              (Hardware Speed)      (Instant Startup)      (Differential Proof)
```

| Tier | Role | Module |
|---|---|---|
| Tier 1 | Compiled JIT → native machine code | `rex_compiler.bix` |
| Tier 2 | Direct-threaded bytecode interpreter | `rex_interp.bix` |
| Tier 3 | Reference VM (ground truth) | `rex_vm.bix` |

### Measured JIT speedups (identical outputs across all tiers)

| Benchmark | vs Reference VM | vs Interpreter |
|---|---|---|
| Recursive Fibonacci (n=24) | **58.9x** | **60.3x** |
| Tight accumulator loop (N=500k) | **108.4x** | **124.7x** |
| Collatz path length sum (N=500) | **26.9x** | **27.0x** |

### REX module format

- 16-byte header, magic `\x7FRBX`
- Tagged sections: TYPE, IMPORT, FUNCTION, TABLE, MEMORY, GLOBAL, EXPORT, CODE, DATA
- 64-bit integer ISA: locals, arithmetic, bitwise, comparisons, linear memory, `MEM_GROW`,
  `STACK_ALLOC`

---

## 7. Developer Tooling

Written in Rubix:

- `repl.bix` — interactive REPL
- `formatter.bix` — source formatter
- `lsp.bix` — language server
- `docgen.bix` — documentation generator
- `rex_compiler.py`, `rex_vm.py`, `rex_css_engine.py`, `rex_rasterizer.py`, `rex_browser_host.py`
  — the REX / browser pipeline

Editors: VS Code / Cursor, Vim, Sublime, GitHub Linguist.

---

## 8. GUI / Web Stack

Rubix ships a full UI stack — no external GUI engine required. Two cooperating layers:

### Layer A — webbix: Web IR → semantic HTML5 / CSS

- `webbix/render/render.bix` — Web IR to HTML5 serializer
- `webbix_render_css()` — emits a complete stylesheet (box model, flex, grid, `@media`, hover)
- Modules: `ir/`, `declarative/`, `components/`, `state/reactive.bix`, `routing/router.bix`,
  `server/http.bix`, `client/`, `net/`, `runtime/`

### Layer B — REX → Browser → Pixels: the output engine

- `webbix/rex/rex_bridge.bix` — lowers Web IR into REX web opcodes
  (`CREATE_NODE`, `APPEND_CHILD`, `SET_TEXT`, `APPLY_STYLE`, `ATTACH_LISTENER`,
  `BIND_STATE`, `SET_ANIMATION`, `COMMIT_MUTATION`) with an incremental DOM-mutation journal
- `docs/rex/browser_integration.md` — full pipeline to **physical screen pixels**, with
  **zero JavaScript, zero WebAssembly, zero JS engine**
- Includes:
  - CSS cascade engine with selector specificity, variables, inheritance, Tailwind utilities
  - Box-model and Flexbox layout
  - Deterministic RGBA **software rasterizer** + zero-dependency PNG encoder
  - Event propagation, transitions, keyframes, `async_fetch`

**Verified:** DOM 5/5 · CSS 7/7 · Pixel rendering 5/5 · Browser integration 5/5 —
with golden PNG references.

> The document, style, layout, raster, and event layers already exist.
> Only a thin host/input shim is missing.

---

## 9. Standard Library

Fourteen modules under `rubix/std/`:

`core` · `string` · `collections` · `math` · `matrix` · `json` · `fs` · `cli` ·
`http` · `web` · `async` · `thread` · `wire` · `ffi`

**Honest depth notes:**

- `std/math.bix` is **integer-only** (`min`, `max`, `clamp`, `abs`, `sign`, `pow`, `gcd`, `lcm`)
- `std/matrix.bix` is a **2×2 integer matrix** + `dot_product_3d` — no real tensor library
- `std/ffi.bix` — **dlopen/dlsym and arbitrary C-ABI calls are NOT implemented**
  (`ffi_is_supported()` returns `false`)

A capable systems / networking / web standard library — **not** a numerical or FFI-rich one.

---

## 10. Verification & Testing

Approximately **120 test files** in `rubix/tests/`:

- **Back end:** x86 emitter unit test, disassembler, backend ops, overflow modes
- **Bootstrapping:** phase 2/3 bootstrap, stage‑1 verification, 10-phase phase‑3/4/5 suites
- **ABI:** C‑ABI, args 0–6, doubles, recursion, ABI hardening
- **Security:** adversarial tests, security regression, forged interiors, OOB access
- **REX:** differential, fuzz, modes, benchmarks, synthesis
- **RUMS / multi-arch:** architecture, synthesis, performance
- **Other:** floats, threads, provenance, machdesc

Regression running via `run_all_regressions.py`; integration + unit `.bix` suites run in
pure Rubix.

---

## 11. Ecosystem Map

| Layer | Location | Role |
|---|---|---|
| Compiler | `rubix/compiler/` | lexer → parser → UIR → TIR → bytes, ELF, REX |
| Machine descriptions | `rubix/targets/` | x86_64, arm64, riscv64, rex, synthetic |
| Standard library | `rubix/std/` | 14 modules (systems / net / web / collections) |
| Web / UI framework | `rubix/webbix/`, `webbix/` | Web IR → HTML5/CSS + REX bridge + reactive state |
| Tools | `rubix/tools/` | repl, formatter, lsp, docgen, REX/raster/CSS |
| Tests | `rubix/tests/` | ~120 suites + golden PNGs |
| Docs | `rubix/docs/` | REX spec, browser integration, RUMS synthesis |
| Drivers | `rix/bin/rix`, `bin/` | unified runner (`rix run` / `test` / `compile`) |
| Wrapper (separate) | `Rubix-Mobile-Framework-2.0/` | text-asm generator → `as` + `gcc` + `librubix_rt.a` |

---

## 12. Why Rubix Matters — The Trade-off

### What it kills

Rubix removes **C as the substrate**. No C compiler, assembler, linker, libc, CRT, C ABI, or
native toolkit is needed to go from source to running code.

| C/C++ foundation | Replaced by |
|---|---|
| C compiler | Direct machine-byte emission |
| Assembler | Raw opcode emission |
| Linker | Hand-built ELF writer |
| libc | Raw syscalls |
| C runtime startup | Own entry point + ELF header |
| Prebuilt runtime `.a` | Nothing to link against |
| Dynamic linking | Deliberately absent |
| C interpreter/VM | Interpreter + VM in Rubix |
| Single-target lock-in | Machine descriptors per arch |
| Permanent toolchain dependency | Self-hosting stages |

### What it does not kill (hardware/OS truths, not C inventions)

- The Linux **syscall ABI** — still uses `SYS_read`, `SYS_mmap`, `SYS_ioctl`, etc.
- The **ELF format** — replaces the linker but still emits ELF (the kernel loader reads it)
- The **CPU instruction set** — x86‑64 / ARM64 / RISC‑V are the hardware
- The **bootstrap paradox** — still needs one pre-existing tool once to build stage 1
- **Native library access** — currently impossible (no C ABI / dynamic linking)

### The bottom line

> **It kills the C foundation, and in exchange it inherits the burden of rebuilding
> everything that foundation used to hand you for free.**

What you gain: zero toolchain, native speed (up to 124x over interpretation), multi-arch, and a
portable bytecode fallback — all differentially verified.

What you owe: every ecosystem library that assumes the C ABI (graphics, audio, crypto,
databases) must be reimplemented in-language.

---

## 13. Current Status: Strong vs. Thin

### Strong / real

- Direct machine-code emission + in-memory execution (W^X) + hand-built ELF —
  **no external toolchain at runtime**
- Dense, genuinely functional instruction selection, optimizer passes, and live register allocation
- Multi-arch (x86‑64 / ARM64 / RISC‑V) via RUMS, plus portable REX bytecode with three
  differentially-verified execution tiers
- A real web/UI rendering stack (webbix + REX → Browser → Pixels) with a working software
  rasterizer and PNG output
- A broad, serious test suite (~120 files) covering ABI, security, fuzz, and differential testing

### Thin / caveated

- **Bootstrap still needs `gcc` once** — not fully self-hosted from nothing
- **No dynamic linking / C-ABI FFI** — no GPU, SDL/GTK, libcrypto, databases
- **No tensor / autodiff / GPU / BLAS** — `std/matrix.bix` is a 2×2 integer type and
  `std/math.bix` is integer-only, so it **cannot build or train an LLM today**
  (though the `f64`/`f32` codegen and optimizing backend are the correct *base* for one)
- **No hardware-backed SIMD** — no packed float vector ops in the native back end
- **Legacy and mixed state** — assembly/clang-era code still present under `compiler/legacy/`;
  some `tools/` pieces are Python; two function syntaxes coexist (`fn` vs `def/do/end`)
- **Repo hygiene** — root mixes temporary `tmp_*` / `test_*.bin` scratch artifacts with sources

---

## 14. Objection Handling

**“Raw x86 makes the project worthless.”**
No — it is the feature. It delivers zero-dependency native execution, and it is *not*
arch-locked: machine descriptions drive x86‑64, ARM64, and RISC‑V, while REX provides a
portable bytecode fallback that runs anywhere.

**“You'll need a C++ bridge for graphics.”**
No — the project has no FFI bridge by design (`std/ffi.bix` returns `false`).
Display and input can be done in Rubix with raw syscalls already present in the runtime:
`sys_open("/dev/fb0")` → `sys_ioctl` → `sys_mmap` → blit; or sockets to Wayland/X11;
or the already-working HTTP + PNG/HTML5 path.

**“You must build a GUI engine from scratch.”**
No — the rendering/UI stack already exists (webbix + REX → Browser → Pixels), down to a
deterministic software rasterizer and PNG output. Only a thin host/input shim is missing.

**“Can it build an LLM?”**
Not today — there is no tensor/autodiff/GPU/BLAS layer. But Rubix has the two hard
prerequisites most toy languages lack: **real IEEE‑754 float codegen** and a **real
optimizing back end**, making it the correct foundation to extend.

---

## 15. Summary

Rubix today is a **genuinely impressive compiler and execution-VM project**. The hard,
valuable parts are real and tested:

- Byte-level native code generation
- A 21-pass optimizing middle end with live register allocation
- Multi-arch synthesis via machine descriptors
- A self-hosted, three-tier bytecode execution model (REX)
- A from-scratch web rendering pipeline (webbix + REX → Browser → Pixels)

Its remaining gaps are **ecosystem-shaped rather than compiler-shaped**: no C-ABI / dynamic
linking, no numerical/tensor library or SIMD/GPU support, and a bootstrap that still leans on
`gcc` once.

> **Rubix is the correct foundation to extend — not yet a complete, self-sufficient platform.**
