# Open Research Problems in ABI Resilience

## 1. Hardware Capability Systems (CHERI / Morello)

In traditional 64-bit architectures, a pointer is an integer memory address (8 bytes).
In capability hardware architectures such as **CHERI (Capability Hardware Enhanced RISC Instructions)** and ARM Morello:
- A capability pointer is **128 bits wide** (16 bytes):
  - 64 bits of virtual address
  - 64 bits of compressed hardware bounds, permissions (read/write/execute), and object types
  - 1 out-of-band hardware tag bit guaranteeing unforgeability.
- **The ABI Problem**:
  When migrating an operating system from 64-bit pointers to 128-bit CHERI capabilities, every struct containing a pointer doubles its pointer field size, shifting all field offsets and breaking all existing 64-bit binary libraries.
- **Rubix Research Target**: Can semantic interface contracts allow 64-bit legacy pointer consumers to interact with 128-bit capability-aware libraries via automated capability-widening adapters without recompilation?

---

## 2. Dynamic Hardware Vector Lengths (SVE and RVV)

In ARM Scalable Vector Extension (SVE) and RISC-V Vector Extension (RVV), the CPU vector register length ($\text{VL}$) is not defined by the ISA specification:
- An SVE CPU can have 128-bit, 256-bit, 512-bit, 1024-bit, or 2048-bit vector registers.
- If a caller compiled on a 256-bit SVE CPU calls a function in a shared library compiled for a 512-bit SVE CPU:
  - How do vector arguments passed in vector registers behave?
  - Does the callee read uninitialized upper vector lanes?
- **Rubix Research Target**: Designing Vector-Length Agnostic (VLA) Semantic ABI contracts where vector parameters declare element counts and logical shapes, allowing hardware adapters to dynamically strip-mine or clamp vector lengths at the boundary.

---

## 3. Heterogeneous and Non-Von-Neumann Boundaries

As computing moves toward heterogeneous accelerators (GPUs, NPUs, TPUs, Photonic and Neuromorphic processors):
- Calling a kernel is no longer a CPU register branch (`CALL`).
- It requires queueing command packets into hardware ring buffers, synchronizing shared virtual memory (SVM) page tables, and handling asynchronous completion signals.
- **Rubix Research Target**: Unifying Procedure Call Standards (PCS) with Accelerator Command Queues under a single Semantic ABI model, where invoking a GPU or NPU tensor kernel uses the exact same contract semantics as a CPU function call.
