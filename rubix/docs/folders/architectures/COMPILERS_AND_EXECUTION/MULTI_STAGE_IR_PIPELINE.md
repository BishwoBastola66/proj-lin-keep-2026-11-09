# Multi-Stage Compiler Pipeline & Intermediate Representations

> **Status**: Canonical Accepted  
> **Classification**: Compiler Engineering & IR Pipeline Architecture  
> **Subsystem**: Rubix Compiler Substrate  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the concrete intermediate data structures, lowering passes, and verification invariants of the Rubix multi-stage compiler pipeline.

It details how source code progresses from Semantic IR (SIR) to Affine IR (AIR) and Universal IR (UIR) entirely within the 16MB resident bump arena (`RAMC`) without external memory allocations.

---

## 2. Pipeline Stage Specifications

```
+───────────────────+     +───────────────────+     +───────────────────+
| Semantic IR (SIR) | ──► |  Affine IR (AIR)  | ──► | Universal IR (UIR)|
+───────────────────+     +───────────────────+     +───────────────────+
  • Type checking           • Ownership check         • Linearized CFG
  • Effect inference        • Region lifetimes        • Target pseudo-ops
  • Hologram symbols        • Drop elaboration        • Cap validation
```

### 2.1 Stage 1: Semantic Intermediate Representation (SIR)
* **Structure**: High-level typed syntax tree allocated sequentially in `RAMC`.
* **Node Definition**:
  ```c
  typedef struct {
      uint16_t  node_kind;       // SIR_CALL, SIR_LET, SIR_MATCH, etc.
      uint16_t  stratum;         // STRATUM_VALUE, STRATUM_RESOURCE, STRATUM_CAP
      uint8_t   effect_bitmask;  // 7-bit algebraic effect mask
      uint32_t  type_id;         // Index into symbol table
      uint32_t  source_span;     // Packed line/column for diagnostics
      uint64_t  payload_offset;  // Byte offset to child nodes
  } SIR_Node;
  ```
* **Invariants**: All types must be fully inferred and monomorphized. Expressions violating effect purity or stratum isolation are rejected before AIR lowering.

### 2.2 Stage 2: Affine Intermediate Representation (AIR)
* **Structure**: Control-flow graph enriched with ownership transfer markers and lexical region arena boundaries.
* **Transformations**:
  1. **Move Analysis**: Variable uses are classified as either `BorrowShared`, `BorrowExclusive`, or `AffineMove`.
  2. **Drop Elaboration**: Inserts region collapse instructions at the exact lexical boundary where a resource becomes unreferenced.
  3. **Escape Verification**: Proves that no region-borrowed pointer outlives its enclosing arena watermark.

### 2.3 Stage 3: Universal Intermediate Representation (UIR)
* **Structure**: Flat linear sequence of target-agnostic three-address code instructions.
* **Instruction Definition**:
  ```c
  typedef struct {
      uint8_t   opcode;          // UIR_ADD, UIR_LOAD, UIR_STORE, UIR_CALL, etc.
      uint8_t   dest_reg;        // Virtual register index (V0..V255)
      uint8_t   src1_reg;        // Source operand 1
      uint8_t   src2_reg;        // Source operand 2
      int32_t   immediate;       // Literal constant or relocation hole index
  } UIR_Instruction;
  ```
* **SSA-Free Guarantee**: UIR avoids traditional static single assignment $\phi$-nodes by utilizing linear register live-interval tracks, allowing the subsequent backend to synthesize native code in a single forward scan.
