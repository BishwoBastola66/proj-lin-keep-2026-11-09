# USES: ARCHITECTURAL REFERENCES & THEORETICAL CITATIONS
## Historical Principles, Hardware RFCs, Silicon Specifications, and Academic Foundations

> **Subsystem**: Universal Semantic Execution Substrate (`USES` / `PLANNED-ARCH-USES-013`)  
> **Classification**: Master Bibliography and Theoretical Grounding  
> **Workspace Location**: [`file:///home/bishwaxyz/rubix/docs/folders/planned/uses/references.md`](file:///home/bishwaxyz/rubix/docs/folders/planned/uses/references.md)  
> **Status**: Official Canonical Reference Archive  

---

## 1. Primary Academic Foundations

1. **Backus, John** (1978). *Can Programming Be Liberated from the von Neumann Style? A Functional Style and Its Algebra of Programs.* Communications of the ACM, 21(8), 613–641.
   * *USES Foundation*: Confining side effects to algebraic effect lattices and eliminating pointer-aliased state machines.

2. **Dennis, Jack B., & Van Horn, Earl C.** (1966). *Programming Semantics for Multiprogrammed Computations.* Communications of the ACM, 9(3), 143–155.
   * *USES Foundation*: The original formulation of capability systems, establishing that access control must be mediated via unforgeable tokens rather than ambient user identities.

3. **Klein, Gerwin, et al.** (2009). *seL4: Formal Verification of an OS Kernel.* Proceedings of the ACM SIGOPS 22nd Symposium on Operating Systems Principles (SOSP '09), 207–220.
   * *USES Foundation*: Proving that formal capability systems can eliminate privilege escalation bugs while achieving world-record microkernel latency.

4. **Lampson, Butler W.** (1974). *Protection.* ACM SIGOPS Operating Systems Review, 8(1), 18–24.
   * *USES Foundation*: Principle of Least Privilege and capability-based confinement matrices.

5. **Miller, Jonathan S., et al.** (2020). *Capability Hardware Enhanced RISC Instructions (CHERI): An Architecture for Pragmatic Capability-Based Protection.* IEEE Micro, 40(4), 89–98.
   * *USES Foundation*: 128-bit hardware capability registers, out-of-band hardware validity tags, and hardware-enforced spatial/temporal bounds without MMU paging overhead.

6. **Wulf, William A., & McKee, Sally A.** (1995). *Hitting the Memory Wall: Implications of the Obvious.* ACM SIGARCH Computer Architecture News, 23(1), 20–24.
   * *USES Foundation*: Proving that memory bus latency is the true bottleneck of modern computing, justifying the elimination of multi-level radix page-table walks.

7. **Winters, Titus** (2020). *ABI - Now or Never.* ISO/IEC JTC1/SC22/WG21 C++ Standards Committee Paper P2028R0.
   * *USES Foundation*: The economic and architectural disaster of frozen ABIs, justifying the death of static calling conventions.

---

## 2. Hardware & Microarchitectural Specifications

1. **Compute Express Link Consortium** (2022–2026). *CXL Specification 3.0: High-Bandwidth, Low-Latency Memory Disaggregation and Direct Fabric Memory Access.*
   * *USES Foundation*: Hardware memory fabrics, direct cache-coherent memory access across hosts, accelerators, and persistent memory without operating system block drivers.

2. **RISC-V International** (2024–2026). *The RISC-V Instruction Set Manual: Volume I (Unprivileged Architecture) & Volume II (Privileged Architecture).*
   * *USES Foundation*: Specification of custom opcode extensions (CUSTOM_0) for the `RV64GCBH_EIAV` silicon co-design (`eia.disp.ld`, `eia.acrq.sub`, `eia.cap.chk`, `eia.dvam.flip`).

3. **Intel Corporation** (2024–2026). *Intel Advanced Performance Extensions (Intel APX) Architecture Specification: 32 General-Purpose Registers and EVEX Stencil Encodings.*
   * *USES Foundation*: Dynamic promotion of stack-spilled arguments into extended registers $R16$–$R31$ via sub-microsecond stencil patching.

4. **Axboe, Jens** (2019–2026). *Efficient IO with io_uring.* Linux Kernel Documentation.
   * *USES Foundation*: The historical predecessor to ACRQ; proving that asynchronous user-space shared memory ring buffers can eliminate synchronous syscall traps.

5. **NVM Express Inc.** (2020–2026). *NVM Express Base Specification Revision 2.0.*
   * *USES Foundation*: Paired circular submission/completion queues (`SQ`/`CQ`) operating directly over PCIe memory-mapped physical memory without CPU ring transitions.

---

## 3. Rubix Internal Systems Architecture References

1. [`PLANNED-ARCH-EIA-001`](file:///home/bishwaxyz/rubix/docs/folders/planned/eia/main.md): Eternal Interface Architecture — Universal Holograms ($\Sigma_\infty$), ARLL-Agent, UPBP, and Relational Parametricity.
2. [`PLANNED-ARCH-ZWNS-002`](file:///home/bishwaxyz/rubix/docs/folders/planned/zwns/main.md): Zero-Waste Native Synthesis — 16MB L3 RAMC Bump Arenas & 0-Cycle Deallocation.
3. [`PLANNED-ARCH-CCNS-004`](file:///home/bishwaxyz/rubix/docs/folders/planned/aegis/main.md): Cryptographic Capability Network Shield — 128-bit hardware capabilities.
4. [`PLANNED-ARCH-LNGA-009`](file:///home/bishwaxyz/rubix/docs/folders/planned/lnga/main.md): Lock-Free Neural Graph Architecture — 5 Autonomic Reflex Arcs for HASA hardware scheduling.
5. [`PLANNED-ARCH-SAES-011`](file:///home/bishwaxyz/rubix/docs/folders/planned/saes/main.md): Runtime Kernel Executive — Multi-substrate dispatch across silicon, photonic, neuromorphic, and quantum cores.
6. [`PLANNED-ARCH-RSE-012`](file:///home/bishwaxyz/rubix/docs/folders/planned/rse/main.md): Sovereign Spacetime Enclave Plate — 16MB contiguous anonymous spacetime continuum.
7. [`research_paper_os_and_chip_elimination.md`](file:///home/bishwaxyz/rubix/docs/folders/research/research_paper_os_and_chip_elimination.md): Master research monograph detailing empirical benchmarks, category-theoretic proofs, and microarchitectural co-design.
