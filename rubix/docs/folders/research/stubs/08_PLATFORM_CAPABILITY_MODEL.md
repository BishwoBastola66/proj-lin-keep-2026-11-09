# 08. Platform Capability Model & Security Boundaries Research

## 1. Historical Background

In classic operating systems (UNIX, Windows), security is coarse-grained and process-centric: any user code running with a user ID can execute any system call (read any readable file, open any network socket). Binary boundaries (dynamic libraries, FFI) possessed zero authorization barriers: importing an external C library allowed it to silently make arbitrary OS calls with the host process's full ambient authority.

The principle of **Capability-Based Security** (pioneered by Dennis and Van Horn in 1966, modernized by KeyKOS, EROS, and capability hardware architectures like CHERI) replaces ambient authority with explicit, unforgeable capability tokens.

---

## 2. Current Specifications & Hardware Capability Systems

Modern architectures are introducing hardware and software capability isolation:
1. **CHERI (Capability Hardware Enhanced RISC Instructions)**:
   - Extends 64-bit pointers to 128-bit capabilities containing base, bounds, permissions, and an unforgeable hardware tag bit.
   - Pointers cannot be manufactured from integers or altered to escape memory bounds.
2. **WASI (WebAssembly System Interface, Preview 2)**:
   - Eliminates ambient filesystem and network access; programs can only operate on file descriptors explicitly passed as capabilities during instantiation.
3. **Intel CET / ARM PAC / BTI**:
   - Hardware indirect branch and return address protection.

---

## 3. Rubix Capability & Effect Security Model

Rubix establishes an integrated capability security gate across all binary and language boundaries:
1. **Language-Level Capabilities**:
   - `CapFs`: Authority to perform filesystem operations.
   - `CapNet`: Authority to perform network I/O.
   - `CapMem`: Authority to execute dynamic page allocations / JIT memory changes.
2. **Compile-Time Enforcement**:
   - Functions requiring privileged capabilities must declare them explicitly:
     ```rubix
     fn write_data(data: str) with CapFs { ... }
     ```
   - Unprivileged caller invoking a privileged function triggers compile-time abort (`ERR_CAP_UNAUTHORIZED = -71`).
3. **ABI Boundary Defense**:
   - The semantic contract hash ($\mathcal{H}_{\text{contract}}$) directly folds capability bitmasks into its cryptographic digest.
   - Calling a foreign binary function requires the caller to hold the requisite capability token.

---

## 4. Concrete Implementation in Rubix

Implemented in:
- `compiler/common/capabilities.bix`: Validates capability bitmasks (`CAP_FS = 1`, `CAP_NET = 2`, `CAP_MEM = 4`, `CAP_PROC = 8`).
- `compiler/middle/abi.bix`: Folds capabilities into contract hashing and lattice resolution:
  ```bix
  fn abi_solve_compatibility(...): i64 {
      # Missing required capability -> INCOMPATIBLE
      if (caller_caps & callee_caps) != callee_caps {
          return COMPAT_INCOMPATIBLE; # -1
      }
      ...
  }
  ```
- `tests/test_abi_resilience.bix:33-55`: Asserts that missing required capabilities immediately causes the lattice solver to reject the interface.

---

## 5. Testing & Evidence

Verified in `tests/test_abi_resilience.bix`:
- `test_compatibility_lattice`:
  - Rule 5: Caller with capability 1 attempting to call callee requiring capability 3 returns `COMPAT_INCOMPATIBLE` (`-1`).
- `test_contract_hashing`:
  - Changing capability mask from 15 to 0 alters the contract hash completely.

---

## 6. Measurements

- Capability check overhead at compile time: **O(1) bitwise AND operation**.
- Runtime overhead: **0 cycles** on verified native call sites (statically proven safe).

---

## 7. Remaining Limitations

- Hardware 128-bit capability pointers (CHERI) are tracked at the semantic model level; physical emission targets standard 64-bit pointers with software capability gating.
