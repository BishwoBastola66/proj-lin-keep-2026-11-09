# 07. Debug Information ABI (DWARF 5 & CodeView) Research

## 1. Historical Background

In early Unix, debugging information was encoded in simple symbol table strings known as **a.out / stabs** (Symbol Table Strings). As compilers gained sophisticated optimization passes, inlining, and complex type systems, stabs proved incapable of describing optimized register allocations and multi-range functions.

In the 1990s, the **DWARF (Debugging With Attributed Record Formats)** standard was introduced for Unix/ELF systems, while Microsoft developed the **CodeView / PDB (Program Database)** system for Windows.

---

## 2. Current Specifications

### 2.1. DWARF 5 Line Number Program
Defined in the DWARF 5 Standard (Section 6.2):
- Encoded in the `.debug_line` section as a bytecode program interpreted by a finite state machine.
- The state machine maintains registers:
  - `address`: Current program counter.
  - `line`: Current source line number.
  - `column`: Current column.
  - `file`: Current source file index.
  - `is_stmt`: Boolean statement flag.
- **Core Standard Opcodes**:
  - `DW_LNS_copy` (`0x01`): Emits a row into the line number matrix using current state machine registers.
  - `DW_LNS_advance_pc` (`0x02`): Increments the address register by an unsigned LEB128 delta.
  - `DW_LNS_advance_line` (`0x03`): Increments the line register by a signed LEB128 delta.
  - `DW_LNE_end_sequence` (`0x00 0x01 0x01`): Extended opcode signaling the end of a contiguous instruction block.

### 2.2. Microsoft CodeView Symbols & Lines
Defined in Microsoft PDB / CodeView specifications:
- **`S_GPROC32` (`0x1110`)**: Global procedure start record. Contains code offset, procedure length, debug start/end offsets, and procedure type index.
- **`CV_LINE`**: CodeView line records contain the 32-bit offset within the contribution and a 32-bit line number where bit 31 indicates the statement flag (`0x80000000`).

---

## 3. Rubix Internal Debug Model

Rubix establishes an internal line mapping model that unifies DWARF and CodeView generation:
1. **Source Tracking**: Lexer and parser assign 1-indexed line and column numbers to AST nodes.
2. **IR Mapping**: The Unified IR (UIR) attaches source span metadata to every emitted basic block and call site.
3. **Dual-Format Emission**:
   - ELF targets emit DWARF `.debug_line` state machine programs.
   - PE/COFF targets emit CodeView `S_GPROC32` procedure records and `CV_LINE` statement entries.

---

## 4. Concrete Implementation in Rubix

Implemented in `compiler/middle/abi.bix`:
- `abi_emit_dwarf_line_header`: Lines 2220–2230 (emits DWARF line header: length, version 4, min instruction length 1).
- `abi_emit_dwarf_line_entry`: Lines 2240–2250 (emits `DW_LNS_advance_pc`, `DW_LNS_advance_line`, `DW_LNS_copy`).
- `abi_emit_dwarf_line_end`: Lines 2252–2260 (emits `DW_LNE_end_sequence`).
- `abi_emit_codeview_proc_sym`: Lines 2232–2240 (emits CodeView `S_GPROC32` procedure record with function length).
- `abi_emit_codeview_line_entry`: Lines 2262–2275 (emits CodeView `CV_LINE` record with statement flag `0x80000000`).

---

## 5. Testing & Evidence

Verified in `tests/test_abi_resilience.bix:430-460`:
1. **DWARF Line Header**: Emits 7 bytes; validates version 4.
2. **DWARF Line State Machine Sequence**:
   - `abi_emit_dwarf_line_entry` advances PC by 16 and line by 5, then issues `DW_LNS_copy` -> validates exact opcode bytes `0x02`, `16`, `0x03`, `5`, `0x01`.
   - `abi_emit_dwarf_line_end` terminates sequence with extended opcode `0x00`, `0x01`, `0x01`.
3. **CodeView Procedure & Line Records**:
   - `abi_emit_codeview_proc_sym` emits 8 bytes with `0x1011` (`S_GPROC32`).
   - `abi_emit_codeview_line_entry` emits 8 bytes with 32-bit statement flag bit `0x80000000` set.

---

## 6. Measurements

- DWARF line entry size: **5 bytes** per statement row.
- CodeView line entry size: **8 bytes** per statement row.
- Emission overhead: Emitted in single sequential memory passes during object serialization.

---

## 7. Remaining Limitations

- Current debug emitters construct line tables (`.debug_line`) and procedure symbols; full DWARF type DIEs (`DW_TAG_structure_type`) for complex nested generics are handled during full debug compilation passes.
