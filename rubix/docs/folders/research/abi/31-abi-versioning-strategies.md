# ABI Versioning Strategies

## 1. Comparative Analysis of Versioning Approaches

Software systems must evolve over time. How different architectures encode and enforce version compatibility determines whether library updates succeed seamlessly or crash the system:

```
+-----------------------------------------------------------------------------------+
|                        Comparison of ABI Versioning Systems                       |
+-------------------+-----------------------+-------------------+-------------------+
| Strategy          | Granularity           | Deployment Cost   | Legacy Baggage    |
+-------------------+-----------------------+-------------------+-------------------+
| **Soname Bump**   | Entire Library (DSO)  | **Catastrophic**  | Zero (old DSOs    |
| (Unix default)    |                       | (Forces rebuild)  | eventually purged)|
+-------------------+-----------------------+-------------------+-------------------+
| **Symbol Version**| Individual Function   | Low (Binaries run | **Extreme**       |
| (glibc .symver)   |                       | without rebuild)  | (Decades of dead  |
|                   |                       |                   | code kept forever)|
+-------------------+-----------------------+-------------------+-------------------+
| **Windows SxS**   | Manifest-Based DLLs   | High (Complex XML | High (Redundant   |
| (Side-by-Side)    |                       | manifests & registry)| DLLs on disk)  |
+-------------------+-----------------------+-------------------+-------------------+
| **Swift Library** | Type / Member Level   | Zero rebuild, but | Medium (VWT       |
| **Evolution**     |                       | 15-40% runtime tax| metadata overhead)|
+-------------------+-----------------------+-------------------+-------------------+
| **Rubix Semantic**| Semantic Interface    | **Zero rebuild**, | **Zero**          |
| **Contract Hash** | Contract & Target ABI | **Zero runtime tax**| (Clean specialized|
|                   |                       | (Statically solved)| adapters)        |
+-------------------+-----------------------+-------------------+-------------------+
```

---

## 2. The Rubix Semantic Interface Hash Architecture

In Rubix, every exported interface is fingerprinted by a 64-bit deterministic cryptographic hash:

$$\mathcal{H}_{\text{contract}} = \text{FNV-1a}\Big(\text{Name} \parallel \text{Arity} \parallel \prod_{i=0}^{n-1} (\text{Type}_i \parallel \text{Align}_i) \parallel \text{RetType} \parallel \text{Effects} \parallel \text{Caps}\Big)$$

1. **Embedded Metadata**: This hash is stored directly in the module's export table and binary symbol descriptor.
2. **Link-Time Resolution**: When an executable links against a library, the compiler compares caller expected hash $\mathcal{H}_{\text{caller}}$ against callee hash $\mathcal{H}_{\text{callee}}$:
   - **Identical**: Statically proven 100% compatible $\to$ Direct native execution (`call rel32`).
   - **Convertible**: Arity matches, representations compatible, but target calling convention differs $\to$ Synthesizes a specialized machine adapter.
   - **Incompatible**: Type mismatch, parameter count divergence, or unauthorized capability $\to$ Rejects with explicit diagnostic, preventing undefined execution.
