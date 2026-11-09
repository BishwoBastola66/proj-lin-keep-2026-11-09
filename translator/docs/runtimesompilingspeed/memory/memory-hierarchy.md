# Memory Hierarchy: Latency, Bandwidth, and the Memory Wall

## 1. The Hierarchy of Storage and Latency
The single most critical reality of modern computer performance is that **CPUs are compute monsters starving for memory data**.
A modern CPU core can perform two 512-bit vector FMAs per cycle (32 single-precision floating-point operations per cycle at 4 GHz = 128 GFLOP/s per core). However, fetching a single 64-bit float from off-chip DRAM takes ~60 nanoseconds (240 clock cycles).

### Latency and Bandwidth Matrix (Representative 2024–2026 High-End System)
| Hierarchy Level | Typical Capacity | Access Latency (Cycles) | Access Latency (ns) | Peak Bandwidth |
| :--- | :--- | :--- | :--- | :--- |
| **CPU Registers** | ~2–4 KB total | 0–1 cycle | ~0.2 ns | ~10–20 TB/s |
| **L1 Data Cache (L1D)**| 32–64 KB per core| 4–5 cycles | ~1.0 ns | ~3–5 TB/s |
| **L2 Cache** | 1–3 MB per core | 12–14 cycles | ~3.0 ns | ~1.5–2 TB/s |
| **L3 / LLC (Shared)** | 32–96 MB / CCD | 40–55 cycles | ~10–14 ns | ~400–800 GB/s |
| **AMD 3D V-Cache (LLC)**| 96–192 MB | 45–60 cycles | ~12–15 ns | ~800–1200 GB/s |
| **Main Memory (DDR5)** | 32–512 GB | 200–280 cycles | ~50–70 ns | ~60–120 GB/s/ch |
| **HBM3e (Superchips)** | 96–144 GB | 140–180 cycles | ~35–45 ns | **1.2–4.8 TB/s** |
| **Remote NUMA Node** | Terabytes | 350–500 cycles | ~90–130 ns | ~30–50 GB/s |
| **NVMe PCIe SSD** | Terabytes | 40,000+ cycles | ~10–20 $\mu$s | ~7–14 GB/s |

---

## 2. The "Memory Wall" (Wulf & McKee, 1995)
In their seminal 1995 paper, *"Hitting the Memory Wall: Implications of the Future of Computing"*, Wm. A. Wulf and Sally A. McKee mathematically proved that exponential improvements in CPU clock frequency ($\sim 60\%$/year) contrasted with linear improvements in DRAM access latency ($\sim 7\%$/year) would inevitably lead to a wall where processors spend almost 100% of their execution time waiting for memory:
$$T_{\text{total}} = T_{\text{CPU}} + T_{\text{Memory}} = N_{\text{inst}} \times CPI_{\text{ideal}} \times t_c + N_{\text{misses}} \times t_{\text{memory\_latency}}$$
As $t_c \to 0$ (CPU clock period shrinks), $T_{\text{CPU}} \to 0$, leaving $T_{\text{total}} \approx N_{\text{misses}} \times t_{\text{memory\_latency}}$.
Modern processors did not avoid the memory wall—they hid it behind massive multi-megabyte SRAM caches, hardware prefetchers, and out-of-order execution windows.

---

## 3. Cache Line Organization & Associativity
* **Cache Line**: The atomic unit of data transfer between memory and cache is strictly **64 bytes**. Loading a 1-byte `char` from memory loads all 64 bytes in that aligned block.
* **Set Associativity**: Caches are organized into sets with $N$ ways (typically 8-way for L1, 16-way for L2/L3).
  * Memory address is split into: `[ Tag | Set Index | Offset (6 bits for 64B) ]`.
  * If multiple frequently accessed data structures hash to the exact same Set Index, they cause **conflict misses** and repeatedly evict each other, even if 90% of the total cache capacity is empty!

---

## 4. Cache Coherence & False Sharing
* **MESI / MOESI Protocol**: Maintains coherence across cores: Modified (M), Owned (O), Exclusive (E), Shared (S), Invalid (I).
* **False Sharing**:
  * Occurs when two threads running on different CPU cores modify distinct, independent variables that happen to reside within the *same 64-byte cache line*.
  * Core 1 writes variable $A$; the hardware protocol marks the entire 64-byte line in Core 2’s L1 cache as *Invalid*.
  * When Core 2 writes independent variable $B$, it misses its L1 cache, forces Core 1 to flush its cache line to L3, and reloads the line into Core 2 in *Modified* state.
  * Result: The cache line constantly bounces between cores across the interconnect ("cache line ping-pong"), crippling multi-threaded throughput by up to **10x to 50x**.
  * **Remedy**: Pad independent thread-local data structures to 64-byte (or 128-byte) boundaries (`alignas(64)`).

---

## 5. Translation Lookaside Buffer (TLB) & Virtual Memory
* Every memory load and store requires translating a virtual address into a physical address via multi-level page tables (4-level or 5-level page tables in x86-64 / ARM64).
* **TLB (Translation Lookaside Buffer)**: An on-die cache of virtual-to-physical page mappings (L1 dTLB: ~64 entries; L2 STLB: ~1,500–2,048 entries).
* **Page Table Walk Overhead**:
  * If an access misses both L1 and L2 TLBs, a hardware state machine must walk the 4-level page table hierarchy in memory:
    $$\text{CR3} \to \text{PML4} \to \text{PDPT} \to \text{Page Directory} \to \text{Page Table} \to \text{Physical Frame}$$
  * A full page table walk can require up to 4 dependent memory dereferences, costing **100 to 250+ clock cycles**!
* **Huge Pages (2 MB / 1 GB)**:
  * Standard pages are 4 KB. A 2,048-entry TLB covers only $2,048 \times 4\text{ KB} = 8\text{ MB}$ of memory!
  * Using 2 MB Huge Pages, a 2,048-entry TLB covers **4 GB** of memory, virtually eliminating TLB misses for large compiler heaps, runtime garbage collectors, and database indexes.

---

## 6. Hardware Prefetchers vs. Pointer Chasing
Modern CPU memory controllers contain sophisticated hardware prefetchers:
* **Stream Prefetcher**: Detects consecutive cache line accesses ($N, N+1, N+2$) and speculatively loads $N+3, N+4$ into L2/L1 before the CPU asks.
* **Stride Prefetcher**: Detects constant-stride patterns ($N, N+K, N+2K$) for traversing arrays of structs.
* **Why Pointer Chasing Defeats Prefetchers**:
  * Linked lists, node-based trees, and object graphs use pointers where address $N+1 = \text{node}\to\text{next}$ is completely unpredictable and depends on heap allocation history.
  * The prefetcher cannot predict the next address because it does not know the value stored inside the memory cell until that cell is loaded.
  * Pointer chasing exposes the raw, unmitigated 60 ns DRAM latency at every step. Arrays and contiguous flat buffers allow hardware prefetchers to achieve near-L1 effective memory bandwidth.

---

## 7. Memory-Level Parallelism (MLP)
* Out-of-order processors feature **Non-Blocking Caches** and Miss Status Holding Registers (MSHRs, typically 32–64 entries).
* **Serial Cache Misses (MLP = 1)**:
  ```c
  p = p->next; // Must wait 200 cycles before issuing next fetch!
  ```
* **Parallel Cache Misses (MLP = 8–16)**:
  ```c
  for (int i = 0; i < 16; i++) {
      sum += array[indices[i]]; // CPU issues all 16 DRAM fetches concurrently!
  }
  ```
  Instead of paying $16 \times 60\text{ ns} = 960\text{ ns}$, all 16 requests overlap in DRAM memory controllers, completing in $\sim 75\text{ ns}$ total. Maximizing MLP is a central goal of compiler loop transformations.
