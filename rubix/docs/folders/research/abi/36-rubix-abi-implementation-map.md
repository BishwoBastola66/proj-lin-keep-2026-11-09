# Rubix ABI Resilience Implementation Map

## 1. Architectural Component Mapping

This document establishes the definitive, line-by-line mapping between the theoretical concepts formulated in the research compendium and their concrete implementation within the unified Rubix compiler codebase:

```
+---------------------------------------------------------------------------------------------------------------+
|                               Theory-to-Implementation Architecture Map                                       |
+-----------------------------------+---------------------------------------+-----------------------------------+
| Research Theory                   | Concrete Implementation File          | Core Function / Struct Symbols    |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Semantic Interface Contract**  | `compiler/middle/abi.bix`             | `abi_contract_alloc`,             |
| (Σ: Arity, Types, Effects, Caps)  |                                       | `abi_contract_hash`               |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Compatibility Lattice Solver**  | `compiler/middle/abi.bix`             | `abi_solve_compatibility`,        |
| (Bitwise, Adapter, Incompatible)  |                                       | `COMPAT_BITWISE`, `COMPAT_ADAPTER`|
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Specialized Adapter Synthesis** | `compiler/middle/abi.bix`             | `abi_synthesize_adapter_sysv_win64`|
| (Register shuffle, shadow space)  |                                       | `abi_synthesize_adapter`          |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Zero-Cost Elimination Pass**    | `compiler/middle/abi.bix`,            | `abi_is_zero_cost_eliminated`     |
| (Direct call fallback)            | `compiler/main.bix`                   |                                   |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Target Machine Register Models**| `compiler/target/target.bix`,         | `target_to_abi`,                  |
| (SysV, Win64, AAPCS64, LP64)      | `targets/*.machine`                   | `target_abi_arg_regs`             |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Compiler Driver CLI Commands**  | `compiler/main.bix`                   | `cli_abi_dispatch`,               |
| (`rubix abi check/analyze`)       |                                       | `cli_abi_check`, `cli_abi_analyze`|
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Sovereign Native Dynamic FFI**  | `std/ffi.bix`                         | `ffi_open_lib`, `ffi_get_symbol`, |
| (ELF64 parser, symbol resolution) |                                       | `ffi_call_c_func`, `ffi_call_win64`|
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Capability Security Gates**     | `compiler/common/capabilities.bix`    | `cap_validate_transfer`,          |
|                                   | `compiler/frontend/semantic_driver.bix`| `ERR_CAP_UNAUTHORIZED`           |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Algebraic Effect Isolation**    | `compiler/common/effects.bix`         | `effect_verify_pure_boundary`     |
+-----------------------------------+---------------------------------------+-----------------------------------+
| **Deterministic Test Verification**| `tests/test_abi_resilience.bix`       | Complete 5-pass ABI test suite    |
+-----------------------------------+---------------------------------------+-----------------------------------+
```

---

## 2. Source Code Invariant Audit

1. **`compiler/middle/abi.bix`**:
   - Represents the central source of truth for ABI resilience.
   - Manages memory descriptors for semantic interface contracts.
   - Computes deterministic contract hashes ($\mathcal{H}_{\text{contract}}$).
   - Solves the compatibility lattice between caller and callee interfaces.
   - Emits byte-accurate machine code for specialized adapters when required.
2. **`compiler/main.bix`**:
   - Integrates the ABI verification passes into function lowering.
   - Hosts the `rubix abi` command dispatcher, offering `check` and `analyze` subcommands.
3. **`std/ffi.bix`**:
   - Implements native ELF64 shared object loading without external libc.
   - Dispatches foreign function calls across System V and Win64 calling conventions safely.
