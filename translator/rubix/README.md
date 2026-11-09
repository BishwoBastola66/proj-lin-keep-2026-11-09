# Rubix Programming Language

**Rubix** (`v0.1.0`) is a self-hosting systems programming language designed for mechanical sympathy, deterministic native execution, and instantaneous compilation. The compiler pipeline operates without external toolchain dependencies: zero Python, C, C++, Rust, LLVM, or GCC. It generates standalone x86-64 Linux ELF64 executables directly from source.

---

## Key Highlights

- **Pure Self-Hosting Compiler**: The entire compiler (`compiler/main.bix`, ~24,000 lines) compiles itself with bit-for-bit deterministic reproducibility (`Stage 2 == Stage 3`).
- **Direct Native Code Emission**: Directly encodes AMD64 machine instructions and ELF64 binary headers in memory. No external assemblers (`as`) or linkers (`ld`) are invoked.
- **Dual Execution Modes**:
  - **In-Memory JIT Execution** (`rubix run`): Allocates pages via `mmap`, generates machine code, transitions memory from RW to RX via `mprotect(PROT_READ | PROT_EXEC)` (W^X), and calls entry points directly on physical CPU.
  - **Ahead-of-Time Compilation** (`rubix compile`): Synthesizes standalone, self-sufficient Linux ELF64 binaries.
- **High Performance**: Heavy integer loop benchmark (`bench_loop.bix`, 50M iterations) executes in **~105ms** (~2.16x faster than GCC -O0); recursive Fibonacci (`bench_fib.bix`, `fib(30)`) executes in **~6.5ms**.
- **Universal Backend (RUMS)**: Cross-targets ARM64 (`aarch64`) and RISC-V 64 (`riscv64`) via model-driven `.machine` specifications, verified under QEMU.
- **Sub-Second Compilation**: Compiles the entire self-hosting compiler codebase in ~1.0–1.1 seconds.

---

## Quick Start

### 1. Installation
Rubix is supported natively on **Linux x86-64**. Download the pre-built binary:

```bash
# Download binary
curl -L -o rubix https://github.com/Rubix-lang/Rubix/releases/latest/download/rubix-v0.1.0-linux-x86_64
chmod +x rubix

# Verify installation
./rubix --version
# Output: rubix v0.1.0
```

For full installation and bootstrap steps, see [INSTALL.md](INSTALL.md).

### 2. Running & Compiling Code

```bash
# Execute directly in-memory
./rubix run examples/01_basics.bix

# Compile to a standalone native ELF64 executable
./rubix compile examples/01_basics.bix -o hello
./hello

# Syntax and type check only
./rubix check examples/01_basics.bix

# Check syntax with JSON output for IDE tooling
./rubix check --json examples/01_basics.bix

# Emit Universal Intermediate Representation (UIR)
./rubix emit uir examples/01_basics.bix
```

---

## Language at a Glance

### Functions, Recursion, & Basic Types
```rubix
fn fibonacci(n: i64): i64 {
    if n <= 1 {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

fn main(): i64 {
    let result = fibonacci(10);
    print "Fibonacci(10):";
    print result;
    return 0;
}
```

### Dynamic Collections (`std/collections.bix`)
```rubix
use std.collections;

fn demo(): i64 {
    # Dynamically expanding vector
    let vec = vec_new(4);
    vec_push(vec, 100);
    vec_push(vec, 250);
    let first = vec_get(vec, 0); # 100

    # Dynamic hash map
    let map = map_new(16);
    map_put(map, 101, 2026);
    let val = map_get(map, 101);    # 2026
    return 0;
}
```

For the complete formal syntax reference, see the [Rubix Syntax Specification](syntax.md) and the practical [Language Guide](docs/LANGUAGE_GUIDE.md).

---

## Architecture

The compiler pipeline is organized as a multi-stage sovereign compiler:

```
Source (*.bix)
      │
      ▼
Streaming Lexers (compiler/frontend/lexer.bix & sir_lexer.bix)
      │
      ▼
Semantic Intermediate Representation (SIR)
      │  - Effect Lattice & Capability Token Proofs (sir_typecheck.bix)
      ▼
Affine Resource Intermediate Representation (AIR)
      │  - Resource Moves, Borrows, Drops (air.bix, borrow_checker.bix)
      │  - Interprocedural Escape Analysis & Stack Promotion (escape_analysis.bix)
      │  - Pure Dead-Code Elimination (effect_optimizer.bix)
      ▼
Universal Intermediate Representation (UIR)
      │  - CFG, Basic Blocks, Canonical Lowering (uir.bix, air_to_uir.bix)
      │  - Native Optimization Framework (optimizer.bix)
      ▼
RUMS Machine Synthesis Engine (compiler/rums/)
      │  - Architecture Machine Models (.machine specifications)
      │  - Linear-Scan Register Allocator (regalloc.bix)
      │  - Instruction Selector & Bounded Superoptimizer (backend/isel.bix)
      │  - Native Machine Code Emitter (backend/emitter.bix)
      │
      ├──▶ In-Memory Execution (W^X mprotect, executor.bix)
      ▼
Binary Container Packagers (compiler/packaging/)
      ├──▶ Linux ELF64 (elf.bix)
      ├──▶ Windows PE32+ (pe_coff.bix)
      ├──▶ macOS Mach-O (macho.bix)
      └──▶ WebAssembly WASI 0.3 (wasm.bix)
```

For complete architectural details, see [Architecture Specification](docs/ARCHITECTURE.md) and the [Deep Research Compendium](docs/research/00-research-index.md).

---

## Platform Support

| Platform | Arch | Format | Maturity Tier | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Linux** | x86-64 | ELF64 | **Tier 1** | ✅ Verified Native & Self-Hosting (Full stdlib) |
| **Linux** | AArch64 | ELF64 | **Tier 2** | ✅ Verified Cross-Target (RUMS / QEMU core codegen) |
| **Linux** | RISC-V 64 | ELF64 | **Tier 2** | ✅ Verified Cross-Target (RUMS / QEMU core codegen) |
| **Windows** | x86-64 | PE32+ (PE/COFF) | **Tier 4** | ✅ Verified Direct Packaging (`.exe`) |
| **macOS** | x86-64 | Mach-O 64-bit | **Tier 4** | ✅ Verified Direct Packaging (`.macho`) |
| **WASM** | Wasm32 | WebAssembly | **Tier 4** | ✅ Verified Direct Packaging (`.wasm`) |

*(Note: Windows PE32+ and macOS Mach-O binaries are packaged directly without external toolchains; for native Linux development on Windows, WSL2 is also supported).*

---

## Quality & Test Ledger

All components are validated natively via `./scripts/test.sh`:
- **Compiler Subsystems**: MIR CFG verifier, AST memory arena, pattern matching evaluators.
- **Runtime Safety**: Heap memory allocator, 16-byte alignment, OOM guards, dynamic collections.
- **Round 5 Acceptance**: 15/15 acceptance criteria verified cleanly.
- **Standard Library**: 19/19 stdlib modules verified.
- **Semantic & Adversarial Suites**: Compile-time rejection of unauthorized capabilities and pure function violations.
- **Shipped Examples**: All 11 examples in `examples/` compile and run cleanly on Tier 1 (examples 01-07 verified cross-target; examples 09-11 verify effects, affine resources, and region arenas).
- **Cross-Target Core**: Arithmetic, loops, recursion, functions, and printing verified on x86-64, QEMU ARM64, and QEMU RISC-V 64.

For the complete verification audit and benchmark numbers, see [Verified Claims](docs/VERIFIED_CLAIMS.md).

---

## Documentation Index

- [Rubix Master Research Compendium (00–30)](docs/research/00-research-index.md)
- [Rubix Syntax Specification (A–Z)](syntax.md)
- [Installation Guide](INSTALL.md)
- [Architecture Specification](docs/ARCHITECTURE.md)
- [Language Guide](docs/LANGUAGE_GUIDE.md)
- [Verified Claims & Quality Ledger](docs/VERIFIED_CLAIMS.md)
- [Theory-to-Implementation Map](docs/research/27-theory-to-implementation-map.md)
- [Open Research Problems](docs/research/30-open-problems.md)

---

## License

This project is licensed under the terms specified in [LICENSE](LICENSE).

