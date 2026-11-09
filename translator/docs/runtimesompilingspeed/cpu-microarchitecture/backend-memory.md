# CPU Microarchitecture: The Back-End Memory Subsystem & Load/Store Unit

## 1. The Challenge of Out-of-Order Memory Operations
Registers have explicit names and can be trivially renamed at decode time. Memory addresses, however, are computed at runtime:
```assembly
MOV [RAX + RCX*4], EDX   ; Store to address A
MOV EBX, [RSI + RDI*8]   ; Load from address B
```
Until `RAX + RCX*4` and `RSI + RDI*8` are evaluated in the Address Generation Units (AGUs), the CPU does not know if address $A$ and address $B$ are identical!
* If $A == B$, the load must receive the value written by the store (True RAW memory dependency).
* If $A \ne B$, the load can execute ahead of the store out-of-order.

The **Load/Store Unit (LSU)** and **Memory Order Buffer (MOB)** are responsible for dynamically solving the memory disambiguation problem at wire speed.

---

## 2. Load Queue (LQ) & Store Queue (SQ)
* **Store Buffer / Store Queue (SQ)**:
  * Stores cannot write to L1 Data cache speculatively! If an exception or branch misprediction occurs, speculative cache writes would permanently corrupt memory state.
  * Stores write their target address and data into the private hardware Store Queue.
  * Only when the store instruction reaches the head of the Reorder Buffer (ROB) and officially *commits/retires*, the data is drained from the Store Queue and written into the L1D cache.
* **Load Queue (LQ)**:
  * Tracks all in-flight speculative load operations and their memory addresses.
  * Ensures cache coherence: if another CPU core attempts to write to a cache line that this core has speculatively read before the load retires, the core detects a coherence violation and pipeline-flushes the speculative thread.

---

## 3. Store-to-Load Forwarding (STLF)
When a load instruction needs data from a memory address that was recently written by an older store instruction currently waiting in the Store Queue:
* Instead of waiting for the store to commit and write to L1D cache (which takes dozens of cycles), the LSU matches the addresses and forwards the data directly from the Store Queue into the Load register!
* **Optimal Forwarding**:
  * Address match is exact.
  * Load size $\le$ Store size.
  * Load offset aligns within the stored byte range.
  * Latency: ~4 to 7 clock cycles.
* **Failed Forwarding (STLF Failure Penalty)**:
  * Happens when a load overlaps two different stores, or a 4-byte load reads across a boundary where only 2 bytes were stored, or alignment spans a 64-byte cache line boundary.
  * Incurred penalty: The load cannot forward and must stall until the Store Queue drains to L1D cache, costing **15 to 25+ wasted clock cycles**.

---

## 4. Speculative Memory Disambiguation
* Waiting for all older store addresses to be known before issuing any younger load destroys instruction-level parallelism.
* Modern processors implement dynamic **Memory Disambiguation Predictors**:
  * The LSU speculates that younger loads *do not* alias with unresolved older stores and executes the load immediately from L1D cache.
  * When older stores finally calculate their addresses, the LSU verifies if an address match occurred.
  * If a store discovers that a younger load speculatively read stale data from L1D, the LSU triggers a **Memory Order Violation pipeline flush**, rolling back state and retraining the predictor to force serialization next time.

---

## 5. Line Split & Unaligned Memory Accesses
* Cache lines are 64 bytes wide.
* If a 4-byte or 8-byte load or store crosses a 64-byte cache line boundary (e.g., loading an 8-byte integer from address `0x...3F` to `0x...47`), it touches two distinct physical cache lines:
  * Requires 2 separate cache lookups, 2 TLB lookups, and internal stitching logic.
  * Costs ~2x to 3x higher latency and consumes double LSU throughput.
  * If the split crosses a 4 KB virtual memory page boundary, it may trigger two separate page table lookups or page faults!

---

## 6. Software & Compiler Guidelines for LSU Optimization
1. **Enforce Strict Memory Alignment**: Keep 32-bit values 4-byte aligned, 64-bit values 8-byte aligned, and 256-bit SIMD vectors 32-byte aligned. This completely avoids line-split penalties.
2. **Avoid Store-Forwarding Type Punning**:
   * Storing a 64-bit integer and immediately loading it as two 32-bit floats from overlapping offsets induces severe STLF stalls.
   * Prefer explicit SIMD registers and bitcast instructions over round-tripping through stack memory.
3. **Keep Local Variables in Registers**: Round-tripping through stack frame memory saturates Store Buffers and wastes LSU load/store ports.
