# ABI Security and Boundary Integrity

## 1. The ABI as a Security Attack Surface

In security engineering, binary interfaces are prime vectors for exploitation. Attackers exploit ABI conventions to subvert application control flow:

```
+-------------------------------------------------------------------------------+
|                             ABI Exploitation Vectors                          |
+-----------------------------+-------------------------------------------------+
| Attack Technique            | ABI Vulnerability Exploited                     |
+-----------------------------+-------------------------------------------------+
| **Return-Oriented**         | Predictable stack frame layout; return address  |
| **Programming (ROP)**       | stored unprotected directly on the stack        |
+-----------------------------+-------------------------------------------------+
| **Type Confusion**          | Mismatched struct layout or parameter classes   |
|                             | across unverified FFI boundaries                |
+-----------------------------+-------------------------------------------------+
| **Capability Escalation**   | Calling unprivileged native functions that      |
|                             | secretly issue privileged kernel system calls   |
+-----------------------------+-------------------------------------------------+
| **Use-After-Free Across FFI**| Shared memory pointers freed by foreign code    |
|                             | while still referenced by caller                |
+-----------------------------+-------------------------------------------------+
| **GOT Overwrite Hijack**    | Writable Global Offset Table (.got.plt) entries |
|                             | overwritten to redirect function calls          |
+-----------------------------+-------------------------------------------------+
```

---

## 2. Hardware and Software Defense Mechanisms

### 2.1. Shadow Stacks (Intel CET & ARM GCS)
- **Problem**: In standard x86 and ARM ABIs, return addresses are stored on the writable data stack alongside local variable buffers. A buffer overflow can overwrite the return address.
- **Hardware Solution**: A dedicated, non-writable **Shadow Stack** maintained by the CPU. The `CALL` instruction pushes the return address to both stacks. The `RET` instruction pops and compares both addresses. If they differ, the CPU raises an immediate Control Protection Exception (`#CP`).

### 2.2. Pointer Authentication (ARM PAC)
- Cryptographically signs pointers (including function pointers and return addresses) using upper unused bits of 64-bit addresses.
- If an attacker tampers with a pointer in memory, the cryptographic signature check fails upon dereference (`AUTIASP`), trapping execution before exploitation occurs.

---

## 3. The Rubix Security Architecture at the ABI Boundary

Rubix hardens binary interfaces across three core dimensions:

### 3.1. Capability Gate Enforcement
In Rubix, foreign FFI functions declared in [std/ffi.bix](file:///home/bishwaxyz/translator/rubix/std/ffi.bix) cannot be invoked unless the caller holds the corresponding capability:
```rubix
# Caller must explicitly possess CapFs to invoke foreign file operations
fn read_config(path: str) with CapFs {
    let lib = ffi_open_lib("libc.so.6");
    ...
}
```
If an unprivileged function attempts to call a foreign function that executes I/O, compilation is aborted at compile time (`ERR_CAP_UNAUTHORIZED = -71`).

### 3.2. Affine Ownership Across Boundaries
When memory buffers or handles cross an ABI boundary, Rubix's borrow checker enforces linear ownership:
- An owned buffer passed by move cannot be accessed by the caller again.
- Prevents use-after-free and double-free vulnerabilities across dynamic library boundaries by construction.

### 3.3. Mandatory Non-Executable Stacks
All ELF binaries produced by Rubix emit `PT_GNU_STACK` with execute permissions cleared, guaranteeing hardware NX/DEP enforcement on all modern operating systems.
