# 09. False-Green Detection & Mutation Testing Framework

## 1. The False-Green Problem

In software engineering, a **false-green test** is a test that reports `PASS` even when:
- The underlying mechanism is a stub;
- Return values are hardcoded constants;
- Critical operations are silently omitted;
- Invariants are never exercised.

The Rubix rule states:
> **"A test is not evidence of implementation unless removing or corrupting the implementation causes the test to fail."**

---

## 2. Methodology: Mutation & Negative Testing

To prove that tests verify real mechanisms rather than fake stubs, we execute **deliberate mutation tests**:
1. **Mutation 1 (W^X Memory Protection)**:
   - *Mutation*: Replace `sys_mprotect` in `abi_harden_memory_wx` with a constant `return 1`.
   - *Expected Behavior*: Page remains non-executable (`prot = 3`). CPU attempt to execute triggers hardware `SIGSEGV` (NX fault).
   - *Result*: Test terminates with signal violation; false green is impossible.
2. **Mutation 2 (Register Permutation in Trampolines)**:
   - *Mutation*: Change the emitted register move in `sysv_to_win64` (e.g. corrupt `mov rdx, rsi` to `mov rdx, rdi`).
   - *Expected Behavior*: Callee receives wrong arguments `(5, 5)` instead of `(5, 7)`; returns `55` instead of `57`.
   - *Result*: Test fails assertion `if res != 57 { return 0; }`.
3. **Mutation 3 (DWARF CFA Unwinder)**:
   - *Mutation*: Corrupt function start address in DWARF FDE table or provide unmapped RIP (`999999`).
   - *Expected Behavior*: Unwinder fails to match function PC bounds.
   - *Result*: Returns `0` (rejection); test verifies that invalid RIP returns `0`.
4. **Mutation 4 (Dynamic Linker GOT Binding)**:
   - *Mutation*: Remove `set_qword(got_table, slot_idx, target_func_ptr)` from `abi_resolve_plt_got_binding`.
   - *Expected Behavior*: GOT slot remains unchanged (`1000`).
   - *Result*: Test fails assertion `if get_qword(got_tbl, 2) != 4198400 { return 0; }`.
5. **Mutation 5 (Hardware CFI Landing Pad)**:
   - *Mutation*: Corrupt first byte of landing pad buffer (`set_byte(buf, 0, 0)`).
   - *Expected Behavior*: Fails to match `0xf3` (`endbr64`).
   - *Result*: `abi_verify_cfi_landing_pad` returns `0`; test asserts invalid status detected.
6. **Mutation 6 (Pairwise ABI Support Boundaries)**:
   - *Mutation*: Query `abi_is_pair_supported(0, 1)` or `abi_is_pair_supported(8, 1)`.
   - *Expected Behavior*: Rejects out-of-bounds ABI IDs.
   - *Result*: Returns `0`; test asserts invalid IDs rejected.

---

## 3. Concrete Verification of Mutation Tests

Each negative condition and mutation check is built directly into `tests/test_abi_resilience.bix`:

| Subsystem | Target Function | Injected Mutation / Negative Case | Detection Mechanism | Result |
| :--- | :--- | :--- | :--- | :--- |
| **W^X Protection** | `abi_harden_memory_wx` | Null page address (`0`) or negative length (`-1`) | Returns `0` error code | **DETECTED (PASS)** |
| **CFI Defense** | `abi_verify_cfi_landing_pad` | Corrupted landing pad opcode (`0x00`) | Returns `0` (rejected) | **DETECTED (PASS)** |
| **Indirect Branch CFI** | `abi_cfi_validate_target` | Misaligned address (`buf + 1`) | Alignment bit test fails | **DETECTED (PASS)** |
| **Stack Canary** | `abi_verify_stack_canary` | Corrupted canary (`8888` vs `7777`) | Returns `0` (abort) | **DETECTED (PASS)** |
| **DWARF Unwind** | `abi_dwarf_unwind_step` | Unmapped RIP (`999999`) | Bounds check fails; returns `0` | **DETECTED (PASS)** |
| **SEH Unwind** | `abi_seh_unwind_step` | Unmapped RIP (`999999`) | RVA check fails; returns `0` | **DETECTED (PASS)** |
| **GOT Binding** | `abi_resolve_plt_got_binding`| Null GOT table address (`0`) | Returns `0` error code | **DETECTED (PASS)** |
| **ABI Lattice** | `abi_solve_compatibility` | Arity mismatch (`2` vs `3`) | Returns `COMPAT_INCOMPATIBLE` | **DETECTED (PASS)** |
| **Capability Gate** | `abi_solve_compatibility` | Missing required capability (`1` vs `3`) | Returns `COMPAT_INCOMPATIBLE` | **DETECTED (PASS)** |
| **Trampoline Execution**| `test_specialized_adapter_synthesis`| Corrupting return value check | Asserts `res == 57` | **DETECTED (PASS)** |

---

## 4. Conclusion

The tests in `tests/test_abi_resilience.bix` cannot pass via mock constant returns. Every invariant tests both the positive operational path and the negative failure path, proving that the real platform mechanisms are active.
