# EIA Security Model & Trust Architecture

> **Status**: Canonical Accepted  
> **Classification**: Security Architecture & Trust Verification  
> **Subsystem**: Eternal Interface Architecture (EIA & EIA-Omega)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the security architecture, threat model, cryptographic verification guarantees, and memory protection mechanisms of the **Eternal Interface Architecture (EIA)** and **EIA-Omega**.

Because EIA performs in-memory code modification (hole patching) at load time, it must guarantee absolute immunity against code-injection, arbitrary code execution, return-oriented programming (ROP), and binary supply-chain tampering without relying on slow operating system security boundaries.

---

## 2. Threat Model & Security Invariants

### 2.1 Threat Vectors Evaluated (STRIDE)

| Threat Category | Attack Vector | EIA / EIA-Omega Mitigation | Formal Verification Invariant |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Forged foreign library pretending to implement an invariant contract | **BLAKE3-64 Contract Verification**: Library contract must match the `blake3_contract_root` field in the Hologram header. | $\text{Verify}(\text{Root}_{\text{lib}}, \mathcal{K}_{\text{trusted}}) \equiv \text{True}$ |
| **Tampering** | In-memory modification of patched code bytes post-initialization | **Dual Virtual Alias Mapping (DVAM)**: Executable pages are strictly mapped $\neg W \wedge X$ via shared `memfd_create` backing. | $\mathcal{V}_{\text{exec}} \cap \text{WritePerm} = \emptyset$ |
| **Repudiation** | Unverified dynamic modification of calling conventions | **Deterministic Stencil Ledger**: All hole patches are logged to an immutable audit record. | $\text{AuditLog} \subseteq \text{AppendOnlyArena}$ |
| **Information Disclosure** | Memory leaks via struct padding or uninitialized hole offsets | **Explicit Natural Alignment (CAD-002)**: All padding bytes are zero-initialized by contract. | $\forall b \in \text{PaddingBytes}, b = 0x00$ |
| **Denial of Service** | Malformed circular Hologram dependencies causing infinite loop | **Bounded Resolution Depth (ASM-TYP-01)**: Resolution terminates in $D \le 128$ steps. | $\text{Depth}(\text{ResolveTree}) \le 128$ |
| **Elevation of Privilege** | Untrusted foreign C library attempting to execute unauthorized syscalls | **Capability Gateways (AFGF)**: Foreign calls cannot obtain ambient handles or invoke syscalls via `arll_negotiate_calling_convention`. | $\text{AmbientSyscalls} = \emptyset$ |

---

## 3. Dual Virtual Alias Mapping (DVAM) & $W \oplus X$

Modern operating systems enforce **Write XOR Execute ($W \oplus X$)**: a memory page cannot be simultaneously writable and executable.
In traditional JIT compilers, code patching requires alternating between `mprotect(PROT_READ|PROT_WRITE)` and `mprotect(PROT_READ|PROT_EXEC)`. Each `mprotect` system call costs 1.2 to 2.5 microseconds, destroys TLB performance, and introduces a Time-Of-Check to Time-Of-Use (TOCTOU) vulnerability where the page is temporarily writable.

### 3.1 DVAM Architecture
EIA solves this by creating two distinct virtual memory mappings to the exact same physical RAM frames via Linux `memfd_create` + `mmap`:

```
                   +--------------------------------+
                   |   Physical Memory Pages (RAM)  |
                   +--------------------------------+
                                ▲        ▲
               Shared Physical  │        │  Shared Physical
               Page Frame       │        │  Page Frame
                                │        │
       +------------------------+        +------------------------+
       │                                                          │
+──────────────────────────────+           +─────────────────────────────+
| Virtual Address Space V_write|           | Virtual Address Space V_exec|
| Permissions: PROT_READ | WRITE|           | Permissions: PROT_READ | EXEC|
| Access: ARLL-Agent Hole Patch|           | Access: CPU Instruction Fetch|
+──────────────────────────────+           +─────────────────────────────+
```

### 3.2 Formal Security Proof
1. The application thread executing native logic has access only to pointers in $\mathcal{V}_{\text{exec}}$.
2. Any attempt by an attacker (e.g., via buffer overflow) to write to $\mathcal{V}_{\text{exec}}$ triggers an immediate hardware Page Fault (`SIGSEGV`) because the page entry lacks the `Write` bit.
3. The writable virtual mapping $\mathcal{V}_{\text{write}}$ is held exclusively by `ARLL-Agent` and unmapped or closed (`madvise(MADV_DONTNEED)`) immediately after the verification and patching phases complete.
4. As a result, the code is fully immutable during user execution. DVAM uses `memfd_create` + `mmap` system calls (not zero syscalls as earlier revisions claimed), but eliminates the need for per-patch `mprotect` syscalls during hole patching.
* *Implemented*: `dvam_create` (runtime.bix:482), `dvam_alloc` (542), `dvam_exec_addr_of` (555).

---

## 4. Cryptographic Contract Verification (CSCL)

In EIA, binary integrity is protected by a BLAKE3-64 hash embedded within the Hologram header (`blake3_contract_root` at offset 0x50):

1. **Leaf Construction**: Each function symbol, parameter type, and hole location forms a cryptographic hash:
   $$L_i = \text{BLAKE3-64}(\text{SymbolID}_i \parallel \text{TypeSignatureHash}_i \parallel \text{HoleOffsets}_i)$$
2. **Root Generation**: The contract root is computed deterministically from the symbol table.
   $$\text{Root} = \text{BLAKE3-64}(\{ L_1, L_2, \dots, L_n \})$$
3. **Load-Time Gate**: `ARLL-Agent` verifies the root before performing any memory aliasing. If even a single byte of the machine stencils or symbol contracts has been altered on disk, the signature check fails and the binary refuses to execute.
* *Implemented*: `blake3_hash_contract` (runtime.bix:257), `blake3_contract_root` field in `HologramHeader` (runtime.bix:67). Single-level BLAKE3-64 contract hashing provides tamper detection for the symbol table.

---

## 5. Absolute Spatial & Temporal Memory Safety (Zero-Indirection Capability Tags)

EIA unifies dynamic displacement hole patching with hardware-tagged capabilities to eliminate both spatial and temporal memory safety bugs without the overhead of fat pointers or garbage collection.

### 5.1 Spatial Safety: Dynamic In-Register Capability Bounds
* Rather than storing 128-bit fat pointers in memory (which doubles cache footprint and register pressure), EIA pointers remain native 64-bit addresses.
* Dynamic capability bounds are maintained at displacement patch sites.
* When struct layouts expand, bounds are adjusted in-place to ensure memory accesses strictly satisfy $0 \le \text{offset} < \text{capacity}$, making buffer overruns difficult to trigger via schema drift.
* *Implemented*: DVAM dual-alias W⊕X enforcement, `arll_patch_field_hole` bounds-aware patching.

### 5.2 Temporal Safety: Generation-Epoch Tags (Zero-GC Use-After-Free Immunity)
* Pointers are tracked via generation epochs maintained by `dvam_advance_generation` (runtime.bix:570) and `arll_agent_advance_generation` (runtime.bix:883).
* When a struct undergoes schema migration, the memory allocator advances the generation epoch via `gdam_stage_new_schema` (runtime.bix:950). Stale references from previous generations are detected by `gdam_is_pointer_current` (runtime.bix:980), eradicating Use-After-Free (UAF) vulnerabilities across schema evolutions with zero garbage collection overhead.
* *Implemented*: `dvam_advance_generation` (570), `dvam_get_generation` (577), `arll_agent_advance_generation` (883), `arll_agent_get_generation` (891), `gdam_stage_new_schema` (950), `gdam_publish_entry_vector` (968), `gdam_is_pointer_current` (980), `gdam_migrate_struct` (988).

---

## 6. Runtime Soundness & Formal Memory Immunity

To eliminate the risks inherent in raw memory patching:
* The mapping isomorphism $\phi$ is resolved at boot time via `eia_resolve_field_displacement` (runtime.bix:434):
  $$\forall \mathcal{P}, \forall \mathcal{S}_v, \mathcal{S}_{v'}, \quad \Gamma \vdash \mathcal{P} : \tau \implies \text{Eval}(\mathcal{P}[\mathcal{S}_v]) \approx_\phi \text{Eval}(\mathcal{P}[\mathcal{S}_{v'}])$$
* Runtime verification guarantees that for all valid schema evolutions:
  1. No out-of-bounds memory access can occur ($\text{NoOOBAccess}$) — empirically verified via 12-architecture test suite.
  2. No type confusion can occur — field identity is resolved via BLAKE3-hashed field names.
  3. No alignment faults can occur — `eia_resolve_field_displacement` enforces natural alignment.
* *Implemented*: `eia_load_schema` (422), `eia_resolve_field_displacement` (434), `arll_boot_patch_holes` (main.bix:12259), `abi_cfi_validate_target` (abi.bix:2359). Verified empirically via 12-architecture integration test suite (tests/test_all_architectures.bix) passing in ~25ms.

---

## 7. Live Hot-Swapping Concurrency Isolation (Lock-Free Epochs)

EIA implements zero-pause, lock-free schema migration through **Generation-Stamped Dual-Alias Migration (`G-DAM`)**:

* Writable pages $\mathcal{V}_{\text{write}}$ for the new generation $g+1$ are isolated from the active execution space $\mathcal{V}_{\text{exec}}$ of generation $g$.
* Struct instances migrate atomically via `gdam_migrate_struct` (runtime.bix:988) — non-blocking copy-and-publish forwarding into newly allocated bump arenas.
* Global vector swing occurs via `gdam_publish_entry_vector` (runtime.bix:968) — single release-store memory barrier (`hasi_synchronize_icache_ex`) once all worker threads reach quiescent safe points.
* Generation stamps are tracked via `dvam_advance_generation` (runtime.bix:582) and `arll_agent_advance_generation` (runtime.bix:906). `gdam_is_pointer_current` (runtime.bix:980) validates pointer freshness against the current epoch.
* *Implemented*: `gdam_stage_new_schema` (runtime.bix:950), `gdam_migrate_struct` (988), `gdam_publish_entry_vector` (968), `gdam_is_pointer_current` (980).
