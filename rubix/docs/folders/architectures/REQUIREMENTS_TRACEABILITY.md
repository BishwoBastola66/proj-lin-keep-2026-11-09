# Requirements Traceability Matrix & Invariant Verification Matrix

> **Standard**: Bidirectional traceability linking every system requirement to its source documents, architectural decisions (ADRs), affected subsystems, and formal verification methods.  
> **Status**: Verified & Traceable  
> **Last Updated**: October 2026

---

## 1. Traceability Methodology

Each requirement is assigned a permanent identifier (`REQ-SYS-XX`), mapped to its source documents, bound to corresponding architectural decisions in `architectures/ADR/`, assigned to concrete compiler/runtime subsystems, and linked to verification test suites.

Implementation status states:
- `IMPLEMENTED`: Native hardware execution verified in tests; mutation causes test failure.
- `ARCHITECTED`: Formally specified with complete mathematical formulas and component interfaces.
- `PLANNED`: Documented design roadmap ready for staged implementation.

---

## 2. Master Requirements Traceability Table

| Requirement ID | Requirement Description | Originating Document(s) | Bound Invariant & ADR | Affected Subsystems | Formal Verification Method | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-SYS-01` | **Universal Container Elimination**: Single binary executes on Linux, Windows, macOS. | `planned/eia.md`, `eia&hsns/01-eia-master-spec.md` | `INV-01`, `ADR-0001` | `compiler/packaging/`, `ARLL-Agent` | Multi-OS boot verification test; header table validation across PE, ELF, Mach-O. | `ARCHITECTED` |
| `REQ-SYS-02` | **Zero-Cost Struct Resilience**: Struct fields addable without breaking callers or paying VWT lookup tax. | `research/zero-abi-autonomous-synthesis/`, `planned/eia.md` | `INV-02`, `ADR-0001` | `compiler/middle/abi.bix`, `IMJ-HP` | Load-time displacement fixup test: caller accesses field at new offset with 0 extra cycles. | `IMPLEMENTED` |
| `REQ-SYS-03` | **Sub-Millisecond Compilation**: 10K lines compile in $<0.35\text{ ms}$ resident, $<1.1\text{ ms}$ cold. | `planned/zwns.md`, `planned/zero-waste-native-synthesis.md` | `INV-03`, `ADR-0002` | `compiler/main.bix`, `PCMSS` | High-resolution wall-clock timer benchmarks via `rubix build --fast`. | `IMPLEMENTED` |
| `REQ-SYS-04` | **Zero-GC Memory Management**: Automatic reclamation via affine ownership and region arenas. | `research/04-memory-theory.md`, `research/05-ownership-borrowing-regions.md` | `INV-04`, `INV-06`, `ADR-0004` | `compiler/middle/typecheck.bix`, `AIR` | Static borrow checker assertion; memory leak detection via Valgrind/ASan; 0 GC stalls. | `IMPLEMENTED` |
| `REQ-SYS-05` | **Minimal Standalone Binary**: Freestanding binaries compile to $\le 256$ bytes with direct syscalls. | `planned/zwns.md`, `eia&hsns/02-hsns-zwns-specification.md` | `INV-05`, `ADR-0002` | `compiler/packaging/elf.bix`, `DDZRE` | File size assertion ($174\text{ to } 230\text{ bytes}$); execution test with zero dynamic libraries. | `IMPLEMENTED` |
| `REQ-SYS-06` | **Zero-Ambient Authority**: System resources accessible strictly via unforgeable capability tokens. | `research/07-capability-security.md`, `research/29-security-and-stability-model.md` | `INV-07`, `ADR-0005` | `compiler/middle/typecheck.bix`, `SIR` | Capability safety test: verify rejection of unparameterized file/network access. | `IMPLEMENTED` |
| `REQ-SYS-07` | **Algebraic Effect Confinement**: Side effects modeled as 7-bit bitmask; pure functions proven isolated. | `research/06-effect-systems.md`, `research/research_paper.md` | `INV-08`, `ADR-0004` | `compiler/middle/typecheck.bix`, `SIR` | Effect lattice solver assertion: `test_purity_confinement` asserts 0 caps required for pure. | `IMPLEMENTED` |
| `REQ-SYS-08` | **Zero-Syscall W^X Memory Safety**: Code pages writable and executable via dual virtual aliases. | `planned/adversarial-red-team-and-keys.md`, `research/stubs/06_WX_SECURITY_RESEARCH.md` | `INV-09`, `ADR-0006` | `compiler/executor/executor.bix`, `DVAM` | Memory permission verification: write to $V_{\text{write}}$, execute via $V_{\text{exec}}$; 0 `mprotect` calls. | `IMPLEMENTED` |
| `REQ-SYS-09` | **Value Semantics Default**: Structs flat and contiguous; zero object header or pointer chasing tax. | `research/09-data-oriented-performance.md`, `research/failure_taxonomy.md` | `INV-10`, `ADR-0004` | `compiler/rums/`, `type_layout.bix` | Stride assertion: `sizeof(Array[Point]) == N * sizeof(Point)`; L1D cache line hit test. | `IMPLEMENTED` |
| `REQ-SYS-10` | **Parallel Multicore Scaling**: Compiler scales linearly across 64+ cores without allocator locks. | `planned/recursive-chain-of-keys.md`, `planned/adversarial-red-team-and-keys.md` | `INV-11`, `ADR-0002` | `compiler/main.bix`, `TLAR` | Parallel speedup benchmark: measure throughput across 1, 8, 16, 32, 64 threads. | `IMPLEMENTED` |
| `REQ-SYS-11` | **SMP I-Cache Consistency**: Synthesized code updates visible across ARM/RISC-V cores. | `planned/adversarial-red-team-and-keys.md`, `eia&hsns/03-adversarial-red-team-and-keys.md` | `INV-12`, `ADR-0006` | `compiler/executor/`, `AR-CSP` | Multi-core execution test on ARM64: writer Core A publishes with `stlr`, reader Core B executes `isb`. | `IMPLEMENTED` |
| `REQ-SYS-12` | **Sovereign Toolchain**: Native compilation without LLVM, GCC, or platform assemblers. | `research/26-rubix-next-architecture.md`, `planned/zero-waste-native-synthesis.md` | `INV-13`, `ADR-0002` | `compiler/packaging/`, `compiler/rums/` | Zero-dependency build test: execute compiler in pure hermetic container with 0 external tools. | `IMPLEMENTED` |
| `REQ-SYS-13` | **Ephemeral Debug Observability**: Release binaries remain minimal while debuggers get full info. | `planned/adversarial-red-team-and-keys.md`, `eia&hsns/03-adversarial-red-team-and-keys.md` | `INV-14`, `ADR-0002` | `compiler/packaging/`, `TTEDR` | Profiling assertion: Linux `perf` resolves function names via `/tmp/perf-<pid>.map`; GDB steps lines. | `IMPLEMENTED` |
| `REQ-SYS-14` | **Bi-Directional ABI Trampolines**: Seamless cross-calling between System V and Windows x64. | `research/abi/`, `research/stubs/02_TRAMPOLINE_RESEARCH.md` | `INV-01`, `ADR-0001` | `compiler/middle/abi.bix` | Chained execution test: `SysV -> Win64 -> SysV` evaluates mathematical result accurately. | `IMPLEMENTED` |
| `REQ-SYS-15` | **Hardware CFI Landing Pads**: Forward-edge indirect branches protected via Intel CET and ARM BTI. | `research/stubs/06_WX_SECURITY_RESEARCH.md`, `research/stubs/08_PLATFORM_CAPABILITY_MODEL.md` | `INV-07`, `ADR-0005` | `compiler/middle/abi.bix` | Landing pad verification: `endbr64` emitted at function entry; invalid indirect jumps trapped. | `IMPLEMENTED` |
| `REQ-SYS-16` | **Zero-Copy Inter-Actor Messaging**: Threads communicate by moving unique affine tokens. | `research/08-concurrency-theories.md`, `research/failure_taxonomy.md` | `INV-06`, `ADR-0004` | `std/channel.bix`, `AIR` | Zero-copy throughput test: transfer 1GB memory buffer in $0.000\text{ ns}$ by pointer swap. | `IMPLEMENTED` |
| `REQ-SYS-17` | **Autonomic Microarch Adaptation**: Dynamic register negotiation on Intel APX / ARM SVE2. | `eia&hsns/06-frontier-theories-2026.md`, `EIA-Omega Spec` | `INV-01`, `ADR-0001` | `ARLL-Agent`, `EIA-Omega` | CPUID query assertion: on APX host, 16 arguments passed in registers via EVEX prefixes. | `ARCHITECTED` |
| `REQ-SYS-18` | **Vectorized Token Streaming**: SIMD-accelerated lexing tokenizing 64 bytes per clock cycle. | `HNS-Hyperflux Spec`, `planned/frontier-theories-2026.md` | `INV-03`, `ADR-0002` | `compiler/parser/`, `HNS-Hyperflux` | Lexing benchmark: verify $>8\text{ GB/s}$ token streaming throughput on AVX-512 hardware. | `ARCHITECTED` |
| `REQ-SYS-19` | **Differentiable Syntax & Gradients**: First-class `@differentiable` reverse-mode automatic differentiation. | `Rubix-Autonomic Spec`, `research/23-ai-and-programming-language-design.md` | `INV-08`, `INV-10` | `compiler/middle/autograd.bix` | Gradient accuracy test: evaluate derivative of polynomial function against analytical solution. | `ARCHITECTED` |
| `REQ-SYS-20` | **NVRAM Persistence & Atomic Flush**: Direct zero-serialization structs with hardware cache flushes. | `Rubix-Chrono Spec`, `research/10-cache-memory-hierarchy.md` | `INV-10` | `std/nvram.bix`, `Rubix-Chrono` | Durability test: write struct to simulated NVRAM page, issue `clwb` + `sfence`, verify post-crash state. | `ARCHITECTED` |
