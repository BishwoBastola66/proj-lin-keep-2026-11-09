# Rubix Next Multi-Stage IR Architecture

> **The Multi-Stage Semantic, Affine, and Universal Intermediate Representations**
> *Specification Version 2.0.0-Next*

---

## 1. Architectural Philosophy: Semantic Preservation

Traditional compilers (e.g. GCC, LLVM) lower high-level abstract syntax trees to low-level, flat instruction sequences almost immediately. In doing so, they erase critical semantic knowledge:
- Types are reduced to primitive byte widths (`i32`, `i64`).
- Non-aliasing and uniqueness guarantees are lost, forcing optimizers into complex, fragile points-to alias analysis.
- Purity and side-effect boundaries vanish, preventing aggressive loop invariant hoisting and dead-code elimination.
- Capability boundaries evaporate, precluding static security sandboxing.

Rubix Next proves that **high-level semantic information must be preserved as late as possible in the compilation pipeline**.

```text
               MULTI-STAGE INTERMEDIATE REPRESENTATION STRATA
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
     SIR                            AIR                            UIR
 (Semantic IR)              (Affine & Resource IR)             (Universal IR)
      │                              │                              │
• Typed Expressions            • Affine Ownership Transfers   • 3-Address Instructions
• Effect Bitmasks              • Scoped Borrow References     • Control Flow Graphs
• Capability Witness Checks    • Region Arena Allocation      • Live Range Analysis
• Purity Confinement           • Stack Frame Promotion        • Dominator Trees
```

---

## 2. Stratum 1: Semantic IR (SIR)

The Semantic IR models the program as a typed graph of mathematical expressions, effect constraints, and capability bounds.

### Flat Arena Node Layout (64 Bytes per Node)
To maximize CPU L1 cache locality and eliminate pointer chasing, SIR nodes are laid out contiguously in flat memory-mapped arena buffers:

```text
[ Offset  0 -  7 ]: kind (SIR_NODE_FN_DECL, SIR_NODE_LET_DECL, etc.)
[ Offset  8 - 15 ]: type_id (SIR_TYPE_I64, SIR_TYPE_BOOL, etc.)
[ Offset 16 - 23 ]: effect_mask (EFFECT_PURE, EFFECT_IO, etc.)
[ Offset 24 - 31 ]: capability_mask (CAP_FLAG_FS, CAP_FLAG_NET, etc.)
[ Offset 32 - 39 ]: child_0 / next_sibling
[ Offset 40 - 47 ]: child_1 / symbol_name_hash
[ Offset 48 - 55 ]: child_2 / extra_flags
[ Offset 56 - 63 ]: data / literal_value / parameter_count
```

---

## 3. Stratum 2: Affine & Resource IR (AIR)

AIR models the physical lifecycle of resources, memory regions, and borrow scopes.

### Core AIR Opcodes
| Opcode ID | Symbolic Name | Semantic Meaning |
|---|---|---|
| `1` | `AIR_OP_CONST` | Constant integer or immediate value |
| `2` | `AIR_OP_MOVE` | Resource ownership transfer (invalidates source) |
| `3` | `AIR_OP_BORROW` | Scoped read/write reference creation |
| `4` | `AIR_OP_DROP` | Deterministic resource destruction / finalization |
| `5` | `AIR_OP_REGION_ENTER` | Open a lexical region bump arena |
| `6` | `AIR_OP_REGION_LEAVE` | Instantaneous $O(1)$ batch tear-down of arena |
| `7` | `AIR_OP_CALL` | Function invocation with effect checking |
| `8` | `AIR_OP_EFFECT_BARRIER`| Synchronization boundary for effectful operations |
| `9` | `AIR_OP_STACK_PROMOTE` | Allocation promoted from heap to stack frame |

### Automated Escape Analysis & Stack Promotion
During the AIR pass, the **Escape Analysis Engine** traces the flow of all allocated resources:
1. If a resource register flows into the function return register, it is marked as `ESCAPE_GLOBAL` (preserved as an affine heap handle).
2. If it is bound within a lexical loop or block, it is marked as `ESCAPE_REGION` (allocated in a region bump arena).
3. If it does not escape the function body, the opcode is transformed from `AIR_OP_MOVE` to `AIR_OP_STACK_PROMOTE`. Stack allocation cost = 0 instructions.

---

## 4. Stratum 3: Universal Machine IR (UIR)

UIR represents the program as a clean, hardware-independent 3-address virtual instruction stream.

### UIR Node Structure
```text
[ Offset  0 -  7 ]: opcode (UIR_CONST, UIR_MOVE, UIR_ADD, UIR_CALL, etc.)
[ Offset  8 - 15 ]: type_id (i64, f64, ptr)
[ Offset 16 - 23 ]: basic_block_id
[ Offset 24 - 31 ]: dominator_depth
[ Offset 32 - 39 ]: destination_vreg (v0, v1, v2...)
[ Offset 40 - 47 ]: source1_operand
[ Offset 48 - 55 ]: source2_operand
[ Offset 56 - 63 ]: branch_target_label
```

### Invariants Verified at the UIR Boundary
- **Basic Block Termination**: Every basic block terminates in exactly one unconditional jump, conditional branch, or function return.
- **SSA Property / Virtual Register Linearity**: Virtual registers are numbered monotonically; definitions precede all uses.
- **Control Flow Graph (CFG) Verification**: Dominator trees are mathematically checked for unreachable nodes and illegal cross-block jumps.

---

## 5. Lowering Pipeline & Invariant Flow

```text
Source Code
    │
    ▼ [Parsing]
SIR Graph
    │   • Proves Purity Invariants (Theorem 1)
    │   • Proves Capability Authorizations
    ▼ [Affine Lowering]
AIR Instruction Stream
    │   • Proves Single Ownership (0 Use-After-Move)
    │   • Executes Escape Analysis & Stack Promotion
    │   • Executes Pure Dead-Code Elimination
    ▼ [UIR Lowering]
UIR Control-Flow Stream
    │   • Proves CFG Invariants & Dominance
    │   • Copy Propagation & Constant Folding
    ▼ [RUMS Synthesis]
Machine Code Bytes (.text, .rodata, ELF/PE/Mach-O)
```
