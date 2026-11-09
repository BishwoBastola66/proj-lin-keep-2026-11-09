# Capability Security, Zero-Ambient Authority, and Hardware Co-Design

## 1. Introduction: The Failure of Ambient Authority

Modern operating systems and languages historically adopted an **Ambient Authority** model (Saltzer & Schroeder, 1975): a running program inherits all permissions possessed by the user who launched it. If a user runs a text editor, the editor has the ambient right to read `~/.ssh/id_rsa`, connect to external IP addresses, or overwrite system binaries.

This model is fundamentally broken in the era of multi-thousand-dependency software supply chains. A single compromised package in `npm`, `PyPI`, or `crates.io` inherits the full privileges of the host process.

Rubix implements **Zero-Ambient Authority (ZAA)** at the language and compiler level. No function has implicit access to system resources. Privileged operations require explicit, unforgeable **Capability Tokens**.

---

## 2. Historical Capability Systems & The CHERI Frontier

| System | Era | Architecture | Core Innovation | Reason for Incomplete Adoption |
|:---|:---:|:---|:---|:---|
| **KeyKOS** | 1985 | Pure Capability OS | Object capabilities for microkernel processes. | Specialized proprietary hardware and microkernel performance overhead. |
| **E Language** | 1997 | Distributed O-Cap | Secure distributed capability-based programming. | Dynamic scripting performance limits; academic ecosystem isolation. |
| **Capsicum** | 2010 | OS-Level Sandboxing | Capability mode for UNIX file descriptors (FreeBSD). | Coarse-grained (process-level); does not prevent in-process memory exploitation. |
| **seL4** | 2009–2026 | Formally Verified Microkernel | Machine-checked capability security; zero privilege escalation. | Microkernel IPC boundary crossing costs for high-throughput monolithic apps. |
| **CHERI** | 2014–2026 | Hardware-Software Co-Design | 128-bit architectural fat pointers with hardware bounds and permissions. | Hardware availability limited; requires ISA extensions (Arm Morello / RISC-V). |

---

## 3. The Rubix Capability Security Model

Rubix enforces capability security directly at **compile time**, providing mathematical guarantees on standard commodity hardware (x86-64, AArch64, RISC-V) while remaining ready to leverage hardware CHERI capabilities when present.

### 3.1 The Static Capability Lattice
In [capabilities.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/capabilities.bix), capabilities are represented as an orthogonal permission bitmask:

```text
                               CAP_FLAG_ALL (0x0F)
                                        │
           ┌────────────────┬───────────┴───────────┬────────────────┐
           ▼                ▼                       ▼                ▼
     CAP_FLAG_FS      CAP_FLAG_NET            CAP_FLAG_PROC    CAP_FLAG_UNSAFE
        (0x01)           (0x02)                  (0x04)            (0x08)
           │                │                       │                │
           └────────────────┼───────────┬───────────┴────────────────┘
                                        ▼
                                 CAP_FLAG_NONE (0x00)
```

| Capability Token | Bitmask | Protected Facilities | Enforcement Point |
|:---|:---:|:---|:---|
| `CapFs` | `0x01` | Filesystem access: open, read, write, stat, unlink | Verified before file I/O operations |
| `CapNet` | `0x02` | Network communication: sockets, DNS, packets | Verified before network syscalls |
| `CapProc` | `0x04` | Process control: fork, exec, kill, signals | Verified before process spawning |
| `CapUnsafe` | `0x08` | Raw pointer arithmetic, FFI calls, unchecked casts| Verified at unsafe language boundaries |

### 3.2 Formal Verification Invariant
Let function $f$ hold declared capability set $C_f$. For every privileged callee $g$ invoked by $f$:
$$C_g \subseteq C_f \iff (C_g \ \& \ (\sim C_f)) = 0$$
If $f$ attempts to invoke $g$ without possessing $C_g$:
$$\text{Reject Compilation with } \mathbf{error[-102]\ [CAPABILITY\_UNAUTHORIZED]}$$

* **Supply Chain Isolation**: Third-party packages (e.g., a JSON parser or image decoder) are declared with `effect(pure)` and `with()`. Even if an attacker injects malicious payload code, the Rubix compiler guarantees at compile time that the library cannot read disk files, establish network connections, or spawn subprocesses.

---

## 4. Hardware/Software Co-Design: CHERI Alignment

On future and research hardware supporting CHERI (Capability Hardware Enhanced RISC Instructions):
1. **Pointers as Capabilities**: Every pointer in Rubix can map to an architectural CHERI capability holding base, length, and permissions metadata.
2. **Hardware Revocation**: Freeing a memory buffer automatically revokes the capability in the hardware capability table, preventing spatial and temporal exploits at the silicon level.
3. **Graceful Fallback**: On standard x86-64 and Arm64 processors without CHERI, Rubix enforces identical security invariants statically through affine ownership and capability token verification.
