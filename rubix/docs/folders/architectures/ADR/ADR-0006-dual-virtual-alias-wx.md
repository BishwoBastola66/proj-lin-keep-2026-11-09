# ADR-0006: Dual Virtual Alias Mapping for Zero-Syscall W^X Memory Safety

* **Status**: Accepted
* **Date**: October 2026
* **Deciders**: Rubix Lead Architecture Board, Operating Systems & Security Working Group
* **Invariants Bound**: `INV-09` (W^X Memory Separation), `INV-12` (Causal SMP Consistency)

---

## 1. Context and Problem Statement

Modern operating systems (OpenBSD, macOS Apple Silicon Hardened Runtime, Linux SELinux, Windows ACG) strictly enforce **$W \oplus X$ (Write XOR Execute)**: a memory page must never be simultaneously writable and executable.

JIT compilers and dynamic code synthesizers traditionally modify executable memory by:
1. Calling `mprotect(PROT_READ | PROT_WRITE)`.
2. Writing synthesized machine instructions.
3. Calling `mprotect(PROT_READ | PROT_EXEC)`.

This approach incurs severe failure modes:
- **System Call & TLB Shootdown Latency**: Each `mprotect()` triggers an OS kernel trap, Inter-Processor Interrupts (IPI), and global Translation Lookaside Buffer (TLB) shootdowns across all CPU cores, degrading compilation and splicing throughput by up to $100\times$.
- **EDR False Positives**: Enterprise Detection and Response (EDR) software flags frequent page permission flipping as active malware/shellcode injection, terminating the process.

---

## 2. Decision Drivers

1. Satisfy strict $W \oplus X$ and hardened runtime security invariants 100% of the time.
2. Eliminate `mprotect()` system call overhead during dynamic machine code synthesis and fragment splicing.
3. Prevent multi-core TLB shootdown latency.
4. Prevent EDR false-positive alerts on enterprise servers and developer workstations.

---

## 3. Considered Options

* **Option 1: POSIX mprotect Permission Flipping**: Toggle page permissions dynamically before and after code emission.
* **Option 2: RWX Pages (Unsafe)**: Allocate memory as simultaneously readable, writable, and executable (`PROT_READ | PROT_WRITE | PROT_EXEC`).
* **Option 3: Dual Virtual Alias Mapping (`DVAM`)**: Map a single physical RAM frame into two distinct virtual address aliases: one write-only and one read-only executable.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3: Dual Virtual Alias Mapping (`DVAM`)**.

### Technical Specification
1. **Physical Frame Allocation**: Physical memory is allocated via an anonymous RAM file descriptor (`memfd_create` on Linux, `shm_open` on BSD/macOS, `CreateFileMapping` on Windows).
2. **Dual Mapping**: The operating system maps the same underlying physical page into two distinct virtual address regions:
   $$V_{\text{write}} \longleftarrow \text{mmap}(\text{fd}, \text{PROT\_READ} \mid \text{PROT\_WRITE}, \text{MAP\_SHARED})$$
   $$V_{\text{exec}} \longleftarrow \text{mmap}(\text{fd}, \text{PROT\_READ} \mid \text{PROT\_EXEC}, \text{MAP\_SHARED})$$
3. **Execution Separation**:
   - The synthesizer and fragment splicer write machine code exclusively through the $V_{\text{write}}$ pointer.
   - The CPU executes machine instructions exclusively through the $V_{\text{exec}} = V_{\text{write}} + \Delta_{\text{alias}}$ address.
4. **Permanent Invariance**: $V_{\text{exec}}$ remains permanently read-only and executable; $V_{\text{write}}$ remains permanently non-executable. **Zero `mprotect()` calls are issued at runtime.**

---

## 5. Pros and Cons of the Selected Architecture

### Positive Consequences
* **Zero System Call Overhead**: Writing and splicing machine code executes at bare-metal memory speeds without kernel transitions.
* **Zero TLB Shootdowns**: Virtual page permissions remain static forever; multi-core CPUs suffer zero IPI shootdown stalls.
* **100% Compliance**: Fully compliant with OpenBSD, macOS Hardened Runtime, and enterprise EDR monitors.

### Negative Consequences & Mitigations
* **Virtual Address Space Consumption**: Consumes double the virtual address space for code pages.
  - *Mitigation*: 64-bit architectures provide 128TB to 16EB of virtual address space; virtual address consumption is negligible.

---

## 6. Implementation and Verification

* **Primary Subsystems**: `compiler/executor/executor.bix`, `DVAM`.
* **Verification Test**: `test_debug_and_security_hardening` verifies that code written through $V_{\text{write}}$ executes correctly via $V_{\text{exec}}$ with zero `mprotect` calls, and that attempting to execute $V_{\text{write}}$ triggers an immediate hardware trap.
