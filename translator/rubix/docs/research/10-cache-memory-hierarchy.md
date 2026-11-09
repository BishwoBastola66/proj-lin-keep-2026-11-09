# Cache Memory Hierarchy, Hardware Prefetching, and NUMA Topologies

## 1. The Physics of the Memory Wall

Modern CPU execution is dominated by memory latency. While CPU execution units can process multiple instructions per clock cycle (IPC > 4), main memory (DRAM) access requires hundreds of cycles.

```text
┌─────────────────────────────────┬──────────────┬──────────────────┐
│ Hierarchy Level                 │ Latency (ns) │ Latency (Cycles) │
├─────────────────────────────────┼──────────────┼──────────────────┤
│ CPU Registers                   │ ~0.3 ns      │ 1 cycle          │
│ L1 Data Cache (32–48 KB)        │ ~1.0 ns      │ 4–5 cycles       │
│ L2 Cache (512 KB–1 MB)          │ ~3.5 ns      │ 12–14 cycles     │
│ L3 Shared Cache (16–96 MB)      │ ~12.0 ns     │ 45–60 cycles     │
│ Main DRAM (DDR5-6000)           │ ~65.0 ns     │ 250–350 cycles   │
│ Cross-Socket NUMA Memory Access │ ~120.0 ns    │ 500–600 cycles   │
└─────────────────────────────────┴──────────────┴──────────────────┘
```

A single L3 cache miss stalls the CPU pipeline for up to **350 instructions**. Therefore, high-performance compilation is not merely about minimizing instructions; it is about **maximizing cache residency and predictable memory access patterns**.

---

## 2. Cache Lines & The 64-Byte Rule

All modern x86-64, Arm64, and RISC-V processors transfer data between main memory and caches in units of **64-byte cache lines**.

### 2.1 Spatial and Temporal Locality
* **Spatial Locality**: Accessing address $A$ implies that address $A + \delta$ will be accessed soon. Contiguous arrays exploit this; linked lists defeat it.
* **Temporal Locality**: Accessing address $A$ implies that address $A$ will be accessed again soon. Compact loops and stack frames maximize temporal reuse.

### 2.2 False Sharing
In multi-threaded code, when Thread 0 on Core 0 mutates variable $X$, and Thread 1 on Core 1 reads variable $Y$, if $X$ and $Y$ reside on the **same 64-byte cache line**:
1. Core 0's write invalidates the cache line across all CPU cores (MESI protocol).
2. Core 1 must reload the entire cache line from L3 or DRAM, creating a performance cliff of up to $50\times$.
* **Rubix Defense**: The compiler automatically detects concurrent channel buffer allocations and inserts 64-byte alignment barriers (`align(64)`) to isolate per-core states onto independent cache lines.

---

## 3. Hardware Prefetchers & Stream Predictability

Modern CPUs include hardware prefetchers:
* **Stream Prefetcher**: Detects consecutive ascending or descending cache line accesses and pre-fetches future lines before instructions request them.
* **Stride Prefetcher**: Detects regular address stride jumps (e.g., $+128$ bytes).

When software uses pointer chasing (e.g., linked lists or tree traversals), hardware prefetchers fail, resulting in full DRAM round-trip latency on every pointer dereference.
* **Rubix Design Principle**: All standard collections in Rubix (dynamic vectors, hash tables, string buffers) use contiguous flat memory blocks to cooperate with hardware prefetchers.

---

## 4. Translation Lookaside Buffers (TLB) & Huge Pages

Virtual-to-physical address translation is cached in the CPU's **Translation Lookaside Buffer (TLB)**.
* Standard 4 KB pages: A program spanning 64 MB of heap memory requires 16,384 TLB entries, far exceeding the L1/L2 TLB capacity (typically 1,536 entries), causing frequent page table walks.
* **Rubix Memory Allocation Strategy**: For large region arenas exceeding 2 MB, Rubix requests `MADV_HUGEPAGE` (2 MB pages) via direct Linux syscalls, reducing TLB miss overhead to near zero.
