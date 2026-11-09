# CPU Microarchitecture: The Front End & Branch Prediction

## 1. Overview of the Modern Front End
The processor front end is responsible for fetching raw instruction bytes from memory, predicting branch targets, decoding variable-length instructions into internal micro-operations ($\mu\text{ops}$), and supplying the execution engine at peak throughput (e.g., 6–8 $\mu\text{ops}$ per clock cycle on modern Intel Golden Cove / AMD Zen 5 / Apple M4).
If the front end stalls or starves the out-of-order execution engine ("Front-End Bound"), the thousands of execution transistors downstream sit completely idle.

```
       +-----------------------------------------------+
       |             Branch Predictor (TAGE)           |
       +-----------------------------------------------+
                             | (Predicted PC)
                             v
   +--------------+   +---------------+   +------------+
   | Instruction  |-->|  Instruction  |-->| L1I Cache  |
   | TLB (iTLB)   |   | Pre-decode    |   | (32-64 KB) |
   +--------------+   +---------------+   +------------+
                             |
                             v
                   +-------------------+
                   | Instruction Queue |
                   +-------------------+
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
+------------------+                   +--------------------+
| Instruction      |                   |    $\mu$op Cache   |
| Decoders (4-8 wide)|                 | (DSB: 4K-8K $\mu$ops)|
+------------------+                   +--------------------+
         |                                       |
         +-------------------+-------------------+
                             |
                             v
                  +--------------------+
                  | Loop Stream Buffer |
                  |    (LSD / IDQ)     |
                  +--------------------+
                             |
                             v (Dispatched to Renamer/Out-of-Order Engine)
```

---

## 2. Instruction Fetch & Instruction Cache (L1I)
* **L1 Instruction Cache (L1I)**: Typically 32 KB to 64 KB, 8-way set-associative with 64-byte cache lines.
* **Instruction TLB (iTLB)**: Caches virtual-to-physical address translations for code pages. An L1 iTLB miss costs 7–10 cycles for L2 TLB hit, or a costly page table walk (50–100+ cycles) on total miss.
* **Front-End Fetch Window**: Fetches a 16-byte, 32-byte, or 64-byte contiguous chunk of instruction bytes per cycle from L1I based on the Program Counter (PC).

---

## 3. Dynamic Branch Prediction: The TAGE Architecture
Modern processors have 14 to 20+ pipeline stages. If a branch prediction cannot be made with extreme accuracy, speculative execution cannot proceed.
* **Branch Target Buffer (BTB)**: Caches the target address of known branches. Modern CPUs use two levels of BTBs (L1 BTB: ~1,024 entries, 0-cycle latency; L2 BTB: 8,000–16,000 entries, 2–4 cycle latency).
* **Return Stack Buffer (RSB)**: A dedicated hardware LIFO stack (typically 32–48 entries) tracking function call returns (`CALL` pushes return address, `RET` pops it). If software executes unbalanced calls/returns (e.g., longjmp or corrupted stack), RSB underflows cause catastrophic misprediction storms.
* **The TAGE Branch Predictor (André Seznec, 2006–Present)**:
  * TAGE (TAgged GEometric history length) represents the state-of-the-art predictor used across AMD Zen, Intel Core, and high-performance ARM cores.
  * *Architecture*: Composed of a base predictor (bimodal/2-bit saturating counter table) and a series of $M$ tagged predictor tables indexed by branch address hashed with geometrically increasing lengths of branch history (e.g., history lengths: $L_1 = 4, L_2 = 8, L_3 = 16, L_4 = 32, L_5 = 64, \dots, L_8 = 640$ past branches).
  * *Prediction Mechanism*: The table with the longest matching history that has a valid tag provides the prediction. If no tagged table matches, the base bimodal predictor is used.
  * *Accuracy*: TAGE achieves $>97\%\text{--}99\%$ prediction accuracy on complex, non-periodic branch patterns.

---

## 4. Instruction Decode & Pre-Decode
* On CISC architectures (x86-64), instructions are variable-length (1 to 15 bytes) and prefix-heavy. Decoding instruction boundaries requires complex pre-decode logic to mark instruction start and end bytes before feeding parallel decoders.
* **Decode Units**: Modern Intel/AMD cores feature 4 to 6 parallel decoders (typically 1 complex decoder capable of generating multiple $\mu\text{ops}$, and 3–5 simple decoders that generate single $\mu\text{ops}$).
* On fixed-length RISC architectures (ARM64, RISC-V), every instruction is exactly 4 bytes (32 bits), enabling trivial 8-wide parallel decoding (e.g., Apple M-series 8-wide decode) with minimal power and silicon overhead.

---

## 5. The $\mu\text{op}$ Cache (Decoded Stream Buffer - DSB)
* Because x86 instruction decoding is energy-intensive and introduces latency, modern CPUs store already-decoded $\mu\text{ops}$ in an on-die **$\mu\text{op}$ Cache** (typically 1,500 to 6,750 $\mu\text{ops}$).
* When code loops or repeatedly hits addresses present in the $\mu\text{op}$ cache, the legacy fetch and decode units are completely powered down, cutting front-end latency by 2–3 cycles and eliminating decode bottlenecks.

---

## 6. Loop Stream Detector (LSD)
* When a tight loop fits entirely within the Instruction Decode Queue (IDQ, typically 64–96 $\mu\text{ops}$), the front end enters LSD mode:
* The loop is replayed directly from the queue. Both L1I fetch, branch prediction, and the $\mu\text{op}$ cache are powered down, achieving zero front-end latency and zero branch misprediction within the loop body.

---

## 7. Interaction with Compiler & Software Design
* **Code Alignment**: Aligning loop headers and hot function entry points to 32-byte or 64-byte boundaries ensures that the fetch engine grabs the maximum number of useful instructions per 64-byte L1I line without split fetch penalties.
* **Branch Density**: Clustering more than 2–3 branches within a single 16-byte window can overwhelm BTB read ports, causing pipeline bubbles.
* **Hot/Cold Code Splitting**: Placing error-handling blocks and cold branches into separate memory sections keeps the L1I cache packed with frequently executed $\mu\text{ops}$.
