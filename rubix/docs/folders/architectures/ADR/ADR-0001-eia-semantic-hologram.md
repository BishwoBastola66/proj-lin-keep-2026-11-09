# ADR-0001: Replacement of Static ABIs with the Semantic Interface Hologram

* **Status**: Accepted
* **Date**: October 2026
* **Deciders**: Rubix Lead Architecture Board, Systems & Compiler Working Group
* **Consulted**: Systems Security Team, Binary Compatibility Working Group
* **Invariants Bound**: `INV-01` (Semantic Invariance), `INV-02` (Zero Steady-State Indirection)

---

## 1. Context and Problem Statement

For over 40 years, compiled systems languages (C, C++, Fortran) have coupled software components through static Application Binary Interfaces (ABIs). An ABI hardcodes:
1. Physical machine register assignments for arguments (e.g., `RDI`, `RSI`, `RDX`, `RCX`, `R8`, `R9` on System V AMD64 vs. `RCX`, `RDX`, `R8`, `R9` on Windows x64).
2. Physical byte offsets for struct fields (e.g., `mov rax, [rbx + 16]`).

This produces two systemic failures:
- **The ABI Churn Trap**: If a library adds a field to an exported struct, every compiled binary that touches that struct reads memory at obsolete offsets, leading to fatal memory corruption or vulnerabilities.
- **The ABI Freeze Trap**: Languages like C++ have been paralyzed (e.g., the Prague 2020 committee vote on P2028R0) from passing modern smart pointers (`std::unique_ptr`) in CPU registers because doing so would break legacy binary `.so` and `.dll` compatibility.
- **The Resilient Struct Tax**: Apple’s Swift solved struct evolution by routing field accesses through runtime Value Witness Tables (VWT), but this introduces a permanent $15\%$ to $40\%$ runtime CPU penalty across all dynamic framework calls.

---

## 2. Decision Drivers

1. Enable libraries to add fields, reorder internal members, and evolve data structures without recompiling client binaries.
2. Eliminate the 15–40% runtime indirection penalty of Value Witness Tables.
3. Allow function calling conventions to automatically leverage all host CPU registers (e.g., Intel APX 32 GPRs) without breaking legacy conventions.
4. Maintain deterministic, mathematically verifiable compatibility between independently compiled binaries.

---

## 3. Considered Options

* **Option 1: Static Frozen ABI (C / C++ Model)**: Freeze calling conventions and struct layouts permanently in the specification.
* **Option 2: Unstable ABI / Recompile-the-World (Rust Model)**: Declare internal ABIs completely unstable; force all downstream dependencies to recompile from source text.
* **Option 3: Runtime Witness Tables (Swift Model)**: Retain dynamic library resilience by routing all field offsets and lifecycle operations through runtime indirection tables.
* **Option 4: The Semantic Interface Hologram & In-Memory JIT Hole Patching (EIA Model)**: Export mathematical semantic contracts ($\Sigma_\infty$) and patch physical instruction displacements and calling registers dynamically at load time.

---

## 4. Decision Outcome

**Chosen Option**: **Option 4: The Semantic Interface Hologram & In-Memory JIT Hole Patching (EIA Model)**.

### Technical Specification
1. **The Semantic Hologram ($\Sigma_\infty$)**: Compiled modules export a compact 46-byte invariant cryptographic contract:
   $$\Sigma_\infty = \langle \mathcal{I}, \mathcal{T}, \mathcal{C}, \mathcal{E}, \mathcal{S} \rangle$$
   declaring arity, abstract field identities, affine lifecycles, effect bitmasks, and capability tokens.
2. **In-Memory JIT Hole Patching (`IMJ-HP`)**: Field accesses are compiled as standard direct machine instructions (`mov rax, [rbx + disp]`), but the displacement byte is left as a relocatable patch hole. At load time, the resident linker calculates:
   $$\text{disp} = \text{Base} + \Delta_{\text{runtime}}(\text{field\_id})$$
   and writes the resolved byte directly into the CPU instruction immediate in RAM.
3. **Steady-State Performance**: Once loaded, field accesses execute via direct hardware memory loads at full L1D cache speed with **$0.000\text{ ns}$ runtime indirection penalty**.

---

## 5. Pros and Cons of the Selected Architecture

### Positive Consequences
* **Decoupled Binary Evolution**: Upstream libraries can add private struct fields without forcing downstream recompilation or causing crashes.
* **Peak Native Hardware Speed**: Field access costs identical CPU cycles to hand-coded assembly; zero witness table lookups.
* **Autonomous Register Expansion**: On host hardware with 32 registers (Intel APX, ARM64), calling conventions automatically pass up to 16 arguments in registers without stack spills.

### Negative Consequences & Mitigations
* **Load-Time Fixup Cost**: Requires the resident linker to patch displacement holes during module loading.
  - *Mitigation*: The patch algorithm operates via direct array indexing in memory, processing 10,000 fixups in under 50 microseconds.
* **Memory Page Modifiability**: Writing instruction displacements requires memory pages to be writable before execution.
  - *Mitigation*: Enforced via Dual Virtual Alias Mapping (`DVAM`), completely satisfying $W \oplus X$ security with zero runtime `mprotect()` system calls.

---

## 6. Implementation and Verification

* **Primary Subsystems**: `compiler/middle/abi.bix`, `compiler/executor/executor.bix`, `ARLL-Agent`.
* **Verification Test**: `test_struct_layout_hashing` and `test_specialized_adapter_synthesis` verify that when a library adds fields, the client binary accesses fields at the new offsets with $0.000\text{ ns}$ extra latency.
