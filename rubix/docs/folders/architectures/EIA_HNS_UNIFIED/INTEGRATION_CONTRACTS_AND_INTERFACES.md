# Unified Integration Contracts & Binary Interfaces (SAES)

> **Status**: Canonical Accepted  
> **Classification**: Subsystem Integration & Binary Protocol Standard  
> **Subsystem**: Sovereign Autonomic Execution Substrate (SAES / EIA + HNS Unified)  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the concrete binary interfaces, data structures, register passing protocols, and synchronization barriers that unite **EIA-Omega** and **HNS-Hyperflux** into the **Sovereign Autonomic Execution Substrate (SAES)**.

It defines how HNS's sub-millisecond stencil code generation directly communicates with EIA's holographic interface resolution in unified virtual memory without intermediary serialization layers.

---

## 2. The Semantic Relocation Table (SRT) Memory Contract

The **Semantic Relocation Table (`SRT`)** is the primary high-speed rendezvous structure between HNS and EIA. It resides in a dedicated shared memory arena allocated during process initialization.

### 2.1 Binary Layout Definition

```c
#pragma pack(push, 1)

// Individual relocation entry binding an EIA Holographic Symbol to HNS Machine Code
typedef struct {
    uint64_t  symbol_id;            // 0x00: 64-bit truncated BLAKE3 hash of fully-qualified name
    uint64_t  code_vaddr_exec;      // 0x08: Executable virtual address (RX alias in DVAM)
    uint64_t  code_vaddr_write;     // 0x10: Writable virtual address (RW alias in DVAM)
    uint32_t  code_size_bytes;      // 0x18: Total size of synthesized native instructions
    uint16_t  hole_count;           // 0x1C: Number of unresolved relocation holes in this block
    uint16_t  binding_state;        // 0x1E: 0=EMPTY, 1=SYNTHESIZED, 2=EIA_PATCHED, 3=ACTIVE
    uint64_t  hole_descriptors_ptr; // 0x20: Pointer to array of HNS_RelocationHole_v2
    uint64_t  generation_epoch;     // 0x28: Generational epoch counter (GEC-PFD)
    uint64_t  reserved_zero;        // 0x30: Explicit alignment padding
} SAES_SRT_Record;                  // Total: 64 bytes (cache-line aligned)

// Master SRT Table Header
typedef struct {
    uint8_t   magic[8];             // 0x00: "SAESSRT2"
    uint32_t  version;              // 0x08: 0x00000002
    uint32_t  total_records;        // 0x0C: Capacity of table
    uint32_t  active_records;       // 0x10: Number of active bound symbols
    uint32_t  lock_state;           // 0x14: Atomic spinlock / futex word
    uint64_t  base_exec_vaddr;      // 0x18: Base virtual address of execution segment
    uint64_t  base_write_vaddr;     // 0x20: Base virtual address of patch segment
    uint64_t  last_sync_timestamp;  // 0x28: Nanosecond TSC timestamp of last hole patch
} SAES_SRT_Header;                  // Total: 48 bytes (padded to 64 bytes)

#pragma pack(pop)
```

---

## 3. The 3-Step Cohabitation Handshake Protocol

When HNS-Hyperflux compiles a function that invokes an EIA-managed external contract:

```
[HNS Compiler Engine]                    [SAES Shared Memory (SRT)]                   [EIA ARLL-Agent]
        │                                             │                                       │
        ├── 1. Splice machine stencils ─────────────►│                                       │
        │      Leave 32-bit zero holes at call sites  │                                       │
        │      Record hole offsets in SRT entry       │                                       │
        │                                             │                                       │
        ├── 2. Atomically mark state SYNTHESIZED ────►│                                       │
        │                                             │◄── 3. Scan & verify Hologram ────────┤
        │                                             │       Resolve external symbol address │
        │                                             │       Patch holes via write alias     │
        │                                             │       Mark state ACTIVE               │
        │                                             │                                       │
        │◄────────────────────────────────────────────┴── 4. Flush instruction cache & run ───┘
```

1. **HNS Emission**: HNS splices pre-computed stencils into `code_vaddr_write`. Wherever an external function call or struct offset occurs, HNS leaves a 32-bit zero immediate value (`0x00000000`) and appends a `HNS_RelocationHole_v2` record to the SRT entry.
2. **State Transition**: HNS atomically updates `binding_state` from `EMPTY` to `SYNTHESIZED` using an atomic store release (`__atomic_store_n(&rec->binding_state, 1, __ATOMIC_RELEASE)`).
3. **EIA Holographic Patching**: The `ARLL-Agent` inspects the SRT entry, looks up the corresponding `EIA_SymbolContract_v2`, evaluates field/register mappings (with AMA adaptations if applicable), and writes the computed 32-bit target displacements into `code_vaddr_write`. It transitions `binding_state` to `ACTIVE`.
4. **Execution Handoff**: The CPU executes the code through `code_vaddr_exec` at native speed.

---

## 4. Syscall Dispatch Interface (`SAES_Syscall_Dispatch`)

To guarantee zero ambient authority while maintaining raw kernel execution speed:
* Standalone Rubix binaries do not issue raw `syscall` instructions directly from arbitrary functions.
* Instead, system calls are mediated by an internal direct dispatch table (`SAES_Syscall_Dispatch`) generated in the code segment:
  ```assembly
  ; SAES Secure Syscall Trampoline (x86-64)
  saes_dispatch_io_write:
      ; Validate capability token in RDX
      test rdx, rdx
      jz   saes_cap_fault
      ; Direct Linux SYS_write (1)
      mov  rax, 1
      syscall
      ret
  saes_cap_fault:
      mov  rax, -1        ; Return EPERM
      ret
  ```
This eliminates OS library overhead while strictly preventing unauthorized ambient system calls.
