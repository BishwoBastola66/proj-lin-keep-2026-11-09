# Data-Oriented Design, Memory Layout Synthesis, and Structural Performance

## 1. Introduction: The Fallacy of Object-Oriented Layout

Object-Oriented Programming (OOP) packages data and operations into self-contained objects. While conceptually convenient for humans, this design is hostile to modern hardware:
1. **Pointer Indirection**: Objects allocated on the heap force the CPU to dereference pointers continuously ("pointer chasing").
2. **Cache Line Waste**: When iterating over an array of objects to update a single property (e.g., entity position), the CPU fetches entire 64-byte cache lines containing irrelevant fields (e.g., entity names, audio handles, network IDs). Over $85\%$ of fetched memory bandwidth is discarded.
3. **Internal Padding Bloat**: Poor field ordering introduces padding bytes to maintain CPU alignment, bloating cache footprints.

**Data-Oriented Design (DoD)** (Mike Acton, 2014) prioritizes data transformation over entity identity, organizing memory according to hardware access patterns.

---

## 2. Structural Memory Layouts Compared

```text
1. ARRAY OF STRUCTURES (AoS) - Traditional OOP
┌──────────────────┬──────────────────┬──────────────────┐
│ Entity 0         │ Entity 1         │ Entity 2         │
│ [X, Y, Z, R, G, B│ [X, Y, Z, R, G, B│ [X, Y, Z, R, G, B│
└──────────────────┴──────────────────┴──────────────────┘
Result: Updating (X, Y, Z) wastes 50% of cache bandwidth loading (R, G, B).

2. STRUCTURE OF ARRAYS (SoA) - Pure Data-Oriented
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ X: [X0, X1, X2, X3, ...]      │  │ R: [R0, R1, R2, R3, ...]      │
│ Y: [Y0, Y1, Y2, Y3, ...]      │  │ G: [G0, G1, G2, G3, ...]      │
│ Z: [Z0, Z1, Z2, Z3, ...]      │  │ B: [B0, B1, B2, B3, ...]      │
└───────────────────────────────┘  └───────────────────────────────┘
Result: Contiguous streaming; 100% cache line utilization for SIMD arithmetic.

3. ARRAY OF STRUCTURES OF ARRAYS (AoSoA) - Cache-Blocked Hybrid
┌───────────────────────────────┬───────────────────────────────┐
│ Block 0 (8 Entities)          │ Block 1 (8 Entities)          │
│ [X[0..7], Y[0..7], Z[0..7]...]│ [X[8..15], Y[8..15]...]       │
└───────────────────────────────┴───────────────────────────────┘
Result: Perfectly fits CPU vector register widths (AVX-512 = 8 x f64 or 16 x f32).
```

---

## 3. Rubix Layout Synthesis & Struct Packing

The Rubix compiler automatically optimizes composite record representations:

### 3.1 Natural Alignment Reordering
Naively defined structs often waste memory:
```text
// Naive Definition (16 bytes due to alignment padding)
struct Unoptimized {
    a: u8,   // 1 byte
             // 3 bytes padding
    b: i32,  // 4 bytes
    c: u8,   // 1 byte
             // 7 bytes padding
    d: i64   // 8 bytes
}
```
Rubix sorts fields internally by alignment descending ($8 \to 4 \to 2 \to 1$ bytes):
$$\text{Optimized Layout}: [d: \text{i64 (8B)}, \ b: \text{i32 (4B)}, \ a: \text{u8 (1B)}, \ c: \text{u8 (1B)}, \ \text{pad: 2B}] \implies \mathbf{16\ bytes\ reduced\ to\ 16\ bytes\ with\ zero\ holes}$$

### 3.2 Hot/Cold Struct Splitting
When profiling reveals that certain fields are accessed in hot loops while others are accessed rarely (e.g., error strings or debug IDs), the Rubix optimizer partitions the structure into hot and cold sub-allocations, keeping cold metadata out of L1/L2 caches.
