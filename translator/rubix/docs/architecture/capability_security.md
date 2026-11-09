# Rubix Next Capability Security & System Boundary Specification

> **Compile-Time Capability-Based Access Control and Zero-Ambient Authority**
> *Specification Version 2.0.0-Next*

---

## 1. Problem Statement: The Ambient Authority Curse

In conventional systems programming languages (C, C++, Rust, Go, Python):
- Any function anywhere in the program can call `sys_open("/etc/shadow", ...)` or `sys_socket(...)` if the OS process permissions allow it.
- When an application imports a third-party library (e.g. for JSON formatting or string utilities), that library inherits the full ambient authority of the entire application.
- If that library is compromised (supply-chain attack) or contains a security vulnerability, it can silently exfiltrate private encryption keys, open backdoors, or tamper with system state.

Rubix Next permanently eliminates ambient authority by grounding security in the **Object Capability Model (OCAP)** enforced statically at compile time.

---

## 2. The Capability Hierarchy

Capabilities are unforgeable, linear/affine tokens representing permission to interact with a specific subsystem of the physical machine or operating system.

```text
                                  MasterCap
                                      │
         ┌───────────────┬────────────┴───────────┬───────────────┐
         │               │                        │               │
       CapFs           CapNet                  CapProc         CapUnsafe
     (File I/O)      (Sockets)               (Processes)         (FFI)
         │               │                        │               │
    • ReadFile      • ConnectSocket          • SpawnProc     • RawPtrDeref
    • WriteFile     • ListenSocket           • KillProc      • InlineAsm
    • DeleteFile    • BindPort               • ExecSyscall   • C_AbiCall
```

---

## 3. Capability Confinement Rules

1. **Origin of Authority**: Authority originates exclusively in the `main` entry point. The OS delivers the root capabilities into `main` based on the host execution manifest:
   ```rubix
   fn main(caps: MasterCap): i64 effect(io, syscall) {
       let fs_cap = caps.split_fs();
       let net_cap = caps.split_net();
       ...
   }
   ```
2. **Explicit Attenuation**: A function can only pass the capabilities it holds, or attenuated subsets of them. A function with `CapFs` (read-write) can downgrade it to `CapFsReadOnly` before passing it to an untrusted plugin or sub-module.
3. **Static Call Site Verification**: If a function invokes `sys_open()`, the compiler checks:
   - Does the signature require `cap: CapFs`?
   - Does the caller pass a valid, unforgeable capability token?
   - If not, compilation fails immediately with `CAPABILITY_UNAUTHORIZED`.

### Example: The Confinement Guarantee
```rubix
# An untrusted markdown parser library:
fn parse_markdown(input: str): str effect(pure) {
    # Even if this library has been compromised with malicious code:
    # It CANNOT open a file because it has NO CapFs token!
    # It CANNOT open a network socket because it has NO CapNet token!
    # It CANNOT call raw pointers because it has NO CapUnsafe token!
    # The compiler physically refuses to compile any unauthorized attempt.
    ...
}
```

---

## 4. Hardware Capability Alignment: CHERI

Rubix Next’s capability model is designed to align with both software-enforced compile-time tokens and future hardware capability architectures such as **CHERI (Capability Hardware Enhanced RISC Instructions)**:
- At compile time, Rubix Next enforces type-level capability tokens.
- On standard x86-64/AArch64 targets, capabilities are zero-cost compile-time witnesses.
- On CHERI-enabled architectures (Morello, CHERI-RISC-V), Rubix Next lowers capabilities directly to hardware bounded capability registers, providing hardware-enforced spatial and temporal memory bounds.
