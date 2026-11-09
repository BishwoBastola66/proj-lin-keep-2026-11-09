# Cross-System Binary Data Models & Schemas

> **Status**: Canonical Accepted  
> **Classification**: Binary ABI & Data Representation Standard  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document specifies the exact bit-level binary schemas, struct definitions, and memory representations shared across EIA-Omega, HNS-Hyperflux, the Sovereign Autonomic Execution Substrate (SAES), and Rubix runtimes.

All structures adhere strictly to **CAD-001** (64-bit Little-Endian) and **CAD-002** (explicit power-of-two natural alignment with zero implicit padding).

---

## 2. Universal Data Structures

### 2.1 EIA Hologram Header (`EIA_HologramHeader_v2`)
* **Size**: 64 bytes (aligned to 64 bytes).
* **Location**: Located at the offset pointed to by the UPBP container's holographic descriptor table.

```c
#pragma pack(push, 1)
typedef struct {
    uint8_t   magic[8];             // 0x00: "EIAHOLO2" (0x324F4C4F48414945)
    uint32_t  version_major;        // 0x08: Major format version (0x00000002)
    uint32_t  version_minor;        // 0x0C: Minor format version (0x00000000)
    uint64_t  target_isa_mask;      // 0x10: Bitmask of valid ISAs (x86_64=1, AArch64=2, RV64=4)
    uint64_t  capability_req_mask;  // 0x18: Bitmask of required ambient capabilities
    uint32_t  symbol_count;         // 0x20: Number of symbols in contract table
    uint32_t  hole_count;           // 0x24: Total number of displacement holes to patch
    uint64_t  symbol_table_offset;  // 0x28: Byte offset to SymbolContract array
    uint64_t  hole_table_offset;    // 0x30: Byte offset to RelocationHole array
    uint64_t  cscl_merkle_root_low; // 0x38: Low 64 bits of BLAKE3-256 Merkle contract root
    uint64_t  cscl_merkle_root_high;// 0x40: High 64 bits of BLAKE3-256 Merkle contract root
    uint64_t  reserved_padding;     // 0x48: Explicit zero padding for 64-byte alignment
} EIA_HologramHeader_v2;            // Total: 64 bytes
#pragma pack(pop)
```

### 2.2 EIA Symbol Contract (`EIA_SymbolContract_v2`)
* **Size**: 32 bytes (aligned to 8 bytes).
* **Purpose**: Encapsulates an invariant exported or imported function or data contract.

```c
#pragma pack(push, 1)
typedef struct {
    uint64_t  symbol_id;          // 0x00: Truncated 64-bit BLAKE3 hash of fully-qualified name
    uint64_t  type_sig_hash;      // 0x08: 64-bit semantic type signature hash (Reynolds invariant)
    uint32_t  flags;              // 0x10: Bit 0: Exported (1) / Imported (0); Bit 1: Affine consumed; Bit 2: Pure
    uint16_t  hole_count;         // 0x14: Number of callsite/field holes associated with this symbol
    uint16_t  calling_convention; // 0x16: 0=Default, 1=FastReg, 2=APX_Extended, 3=VectorStream
    uint64_t  hole_list_offset;   // 0x18: Byte offset to array of hole indices
} EIA_SymbolContract_v2;          // Total: 32 bytes
#pragma pack(pop)
```

### 2.3 HNS Machine Stencil Header (`HNS_StencilHeader_v2`)
* **Size**: 32 bytes (aligned to 8 bytes).
* **Purpose**: Metadata prefix for a pre-compiled machine code stencil buffer.

```c
#pragma pack(push, 1)
typedef struct {
    uint16_t  isa_id;             // 0x00: 1=x86-64, 2=AArch64, 3=RISC-V 64
    uint16_t  opcode_family;      // 0x02: Classification (Arithmetic, MemoryLoad, Branch, Syscall)
    uint16_t  code_size_bytes;    // 0x04: Length of raw native machine code in bytes
    uint16_t  hole_count;         // 0x06: Number of relocatable holes in stencil
    uint32_t  clobbered_gpr_mask; // 0x08: Bitmask of registers clobbered by this stencil
    uint32_t  clobbered_vec_mask; // 0x0C: Bitmask of vector registers clobbered
    uint64_t  fast_path_cycles;   // 0x10: Pre-computed expected hardware latency in cycles
    uint64_t  reserved_zero;      // 0x18: Explicit padding
} HNS_StencilHeader_v2;           // Total: 32 bytes
#pragma pack(pop)
```

### 2.4 HNS Relocation Hole Record (`HNS_RelocationHole_v2`)
* **Size**: 16 bytes (aligned to 8 bytes).
* **Purpose**: Identifies the exact byte offset and relocation type to be patched during splicing.

```c
#pragma pack(push, 1)
typedef struct {
    uint32_t  offset_in_code;     // 0x00: Byte offset within the machine code buffer to patch
    uint16_t  hole_type;          // 0x04: 1=Imm32, 2=Imm64, 3=Disp32_PCRel, 4=RegNum, 5=CapTokenOffset
    uint16_t  operand_index;      // 0x06: Index of operand in instruction
    uint64_t  target_symbol_id;   // 0x08: 64-bit Symbol ID to bind to this hole
} HNS_RelocationHole_v2;          // Total: 16 bytes
#pragma pack(pop)
```

### 2.5 Rubix Linear Capability Token (`Rubix_CapabilityToken_v1`)
* **Size**: 16 bytes (aligned to 16 bytes).
* **Purpose**: Unforgeable, non-duplicable linear capability token passed into privileged functions.

```c
#pragma pack(push, 1)
typedef struct {
    uint64_t  resource_uuid;      // 0x00: Hardware/kernel resource unique identifier (FD, Socket, MMIO)
    uint32_t  permission_mask;    // 0x08: Bit 0: Read, Bit 1: Write, Bit 2: Exec, Bit 3: Grant, Bit 4: Revoke
    uint32_t  revocation_epoch;   // 0x0C: Generation counter; validated against resident security daemon
} Rubix_CapabilityToken_v1;       // Total: 16 bytes
#pragma pack(pop)
```

### 2.6 SAES Semantic Relocation Table Entry (`SAES_SRT_Entry`)
* **Size**: 32 bytes (aligned to 32 bytes).
* **Purpose**: The high-speed shared table bridging EIA symbols with HNS machine code buffers.

```c
#pragma pack(push, 1)
typedef struct {
    uint64_t  symbol_id;          // 0x00: Truncated 64-bit BLAKE3 hash of symbol
    uint64_t  exec_code_vaddr;    // 0x08: Executable virtual address (RX alias) for direct calls
    uint64_t  write_code_vaddr;   // 0x10: Writable virtual address (RW alias) for hot-patching
    uint32_t  binding_state;      // 0x18: 0=Unbound, 1=Resolved_Static, 2=Resolved_JIT, 3=Patched
    uint32_t  generation_epoch;   // 0x1C: Current compilation generation counter (GEC-PFD)
} SAES_SRT_Entry;                 // Total: 32 bytes
#pragma pack(pop)
```

---

## 3. Byte Layout Verification Rules

1. **Strict Packing**: Compilers emitting or consuming these structures must enforce `#pragma pack(push, 1)` or `#[repr(packed)]` with manual padding fields to prevent architecture-dependent padding variance.
2. **Deterministic Hashing**: When computing CSCL Merkle trees, the raw memory representation of `EIA_HologramHeader_v2` and `EIA_SymbolContract_v2` is fed directly into the BLAKE3 compression function without serialization transformations.
