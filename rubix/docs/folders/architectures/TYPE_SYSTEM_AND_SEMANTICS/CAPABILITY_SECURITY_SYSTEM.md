# Capability Security System & Zero-Ambient Authority

> **Status**: Canonical Accepted  
> **Classification**: Security Architecture & Capability Theory  
> **Subsystem**: Rubix Type System  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This specification establishes the capability-based security model of the Rubix ecosystem: the **Zero-Ambient Authority Capability System**.

Traditional programming languages operate under ambient authority: any code imported from an external library can call `open("/etc/passwd")` or `socket(AF_INET)` to exfiltrate private data. Rubix eliminates ambient authority entirely: code possesses zero implicit permissions. Every sensitive operation requires an unforgeable linear capability token passed explicitly as a function parameter.

---

## 2. Zero-Ambient Authority Principles

1. **No Global Access**: There are no global functions like `File::open()`, `Socket::connect()`, or `System::exit()`.
2. **Explicit Authority Delegation**: Authority must flow explicitly down the call graph via unforgeable capability arguments:
   ```rubix
   // This function cannot touch the filesystem because it receives no FileCapability:
   fn calculate_hash(buffer: &[u8]) -> u64 { ... }
   
   // This function can write to the network ONLY because the caller explicitly passes the token:
   fn send_telemetry(cap: &CapToken<Network>, packet: &[u8]) { ... }
   ```
3. **Principle of Least Authority (POLA)**: Functions receive only the minimum permissions necessary to accomplish their task.

---

## 3. Unforgeable 128-Bit Capability Token Representation

Every capability token conforms to `Rubix_CapabilityToken_v1` (16 bytes / 128 bits):

$$\text{CapToken} = \langle \text{ResourceID}_{64}, \text{PermissionMask}_{32}, \text{RevocationEpoch}_{32} \rangle$$

```
+───────────────────────────────────┬───────────────────┬───────────────────+
| 64-bit Resource UUID              | 32-bit Permissions| 32-bit Epoch      |
| (Kernel FD, MMIO range, Hardware) | (Read, Write, etc)| (Revocation check)|
+───────────────────────────────────┴───────────────────┴───────────────────+
```

### 3.1 Unforgeability Invariant
* Capabilities are members of the **$\mathcal{C}$ Stratum** in the type lattice.
* User code cannot cast an integer (`u64`) or pointer into a `CapToken`.
* Only the kernel or the sovereign runtime root initialization stub can instantiate a base capability token.

---

## 4. Capability Attenuation & Delegation

Capabilities support mathematical **Attenuation** (narrowing permissions) without contacting the kernel:

$$\text{Attenuate}: \text{CapToken}\langle \mathcal{P} \rangle \times \mathcal{P}_{\text{mask}} \to \text{CapToken}\langle \mathcal{P} \cap \mathcal{P}_{\text{mask}} \rangle$$

```rubix
// Attenuating a Read-Write capability into a Read-Only capability:
let rw_cap: CapToken<FileRW> = obtain_file();
let ro_cap: CapToken<FileReadOnly> = rw_cap.attenuate(PERM_READ_ONLY);

// ro_cap can be safely passed to untrusted plugins; writes are statically rejected
```

---

## 5. Hardware CHERI Pure-Capability Co-Design (Rubix-Aegis)

When executing on CHERI-enabled hardware (such as ARM Morello or RISC-V CHERI):
1. **Tagged Memory**: Every 128-bit capability is protected by a hardware tag bit stored outside the addressable memory space.
2. **Zero-Cost Hardware Bounds**: The hardware CPU registers (`C0`–`C31`) enforce base address, length, and permissions on every memory dereference in hardware:
   $$\text{Hardware Check: } \text{Base} \le \text{Address} \le \text{Base} + \text{Length}$$
3. Any attempt by malicious software to forge a pointer or exceed bounds triggers an instantaneous hardware exception (`SIGPROT`) in **0 cycles**, achieving memory compartmentalization without MMU page table switching.
