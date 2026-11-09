# Comprehensive ABI Compatibility Failure Modes Taxonomy

## 1. The Anatomy of Binary Failure

Unlike API errors which produce clear, actionable compiler messages, ABI failures manifest as:
- **Silent Memory Corruption**: Writes to memory that belong to other data structures.
- **Delayed Crash / Heisenbugs**: The crash occurs millions of instructions *after* the corrupting call returned, making debugging virtually impossible.
- **Security Vulnerabilities**: Control-flow hijacking, privilege escalation, or arbitrary code execution.

---

## 2. Exhaustive Failure Taxonomy

| Failure Mode | Root Cause | Immediate Manifestation | Ultimate Consequence | Detection Method in Rubix |
|:---|:---|:---|:---|:---|
| **1. Register Misclassification** | Caller puts arg in `RDI`, callee reads `RCX` | Callee receives uninitialized CPU register data | Logic failure, null pointer dereference, wild branch | **Compile-Time Contract Validation** |
| **2. Stack Argument Misalignment** | Stack pointer not aligned to 16 bytes | SSE instruction (`movaps`) traps on misaligned address | Hardware `#GP` General Protection Fault (`SIGSEGV`) | **Static Stack Frame Alignment Invariant** |
| **3. Shadow Space Omission** | Unix caller omits 32B shadow space for Win64 callee | Callee spills arg registers into `[RSP+8]` | Overwrites caller's return address; return jumps to shellcode/crash | **Adapter Synthesis with Automatic Shadow Frame** |
| **4. Return Convention Mismatch** | Callee returns aggregate via hidden pointer `sret`, caller expects register `RAX` | Callee writes to address pointed to by `RDI` | Arbitrary memory overwrite; caller reads garbage from `RAX` | **Semantic Contract Return Class Check** |
| **5. Callee-Saved Register Clobber** | Callee treats `RBX` as volatile; caller expects `RBX` preserved | Callee overwrites `RBX` without restoring in epilogue | Caller returns and dereferences corrupted `RBX` pointer | **Target Register Model Invariant Verification** |
| **6. Struct Padding / Size Shift** | Field added or alignment altered in shared library | Struct offsets shifted by 4 or 8 bytes in caller vs callee | Reads garbage fields; writes overwrite adjacent variables | **Semantic Field Hash & Layout Validator** |
| **7. Tagged Union Tag Divergence** | Library widened discriminant from 1 byte to 4 bytes | Caller reads 1-byte tag; branch jump table miscalculates | Wrong variant executed; type confusion attack | **Discriminant Width Stamping** |
| **8. Allocator Mismatch** | Callee allocates via `jemalloc`, caller frees via `glibc` | `free()` invoked on foreign heap metadata structure | Heap allocator slab corruption; memory leaks; crash | **Explicit Affine Deallocation Semantics** |
| **9. Capability Escalation** | Unprivileged pure function calls foreign C symbol accessing filesystem | Foreign code executes unverified syscalls | Bypasses capability sandbox; security breach | **Compile-Time Capability Gate Enforcement** |
| **10. Effect System Subversion** | Caller assumes purity (`@pure`), callee modifies global disk state | Compiler folds or eliminates call based on purity assumption | Stale state, broken program logic | **Algebraic Effect Boundary Barrier** |

---

## 3. The Rubix Safe Failure Principle

The central invariant of Rubix ABI architecture:
> **No binary boundary invocation shall ever result in silent memory corruption or undefined register state.**

When an interface mismatch is detected:
1. **At Compile Time**: The compiler rejects the code with an explicit diagnostic (`ERR_ABI_MISMATCH_ARITY`, `ERR_CAP_UNAUTHORIZED`).
2. **At Load / Link Time**: The dynamic loader rejects the library with an explicit contract error specifying the mismatched symbol and expected parameters.
3. **At Runtime Boundary**: If an adapter cannot be synthesized, the invocation is safely trapped with a deterministic error code, never undefined execution.
