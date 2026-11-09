# Heterogeneous Computing and Accelerator Placement

```text
       ┌───────────────────────────────────────────────────────────────┐
       │             Rubix Unified Heterogeneous Architecture          │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ Semantic Workload IR
                                       │ (Data Dependency & Shape Graph)
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │             Target Capability & Topology Mapper               │
       └───────┬───────────────────────┼───────────────────────┬───────┘
               │                       │                       │
               ▼                       ▼                       ▼
      Host CPU (Scalar/O3)      SIMD/Vector Engine     Accelerator / GPU / NPU
     Low Latency, Branches     High Throughput, SIMD    Dense Matrix, Tensors
     (x86-64 / APX / Arm64)    (AVX10.2 / SVE2 / RVV)  (Metal / Vulkan / WebGPU)
               │                       │                       │
               └───────────────────────┼───────────────────────┘
                                       ▼
       ┌───────────────────────────────────────────────────────────────┐
       │           Zero-Copy Unified Memory & Buffer Management        │
       └───────────────────────────────────────────────────────────────┘
```

## 1. Abstract & Motivation

The era of monolithic single-ISA homogeneous computing has ended. Modern high-performance and energy-efficient systems combine:
* Out-of-order latency-sensitive CPU cores (e.g., Intel Lion Cove, AMD Nirvana, Apple Everest).
* In-order throughput-oriented efficiency cores (e.g., Intel Skymont, AMD Zen 5c, Apple Sawtooth).
* Wide vector engines (AVX10.2, Arm SVE2, RISC-V Vector).
* Integrated and discrete Graphics Processing Units (GPUs).
* Neural Processing Units (NPUs) and matrix multiplication engines (Apple ANE, Intel NPU, Qualcomm Hexagon).
* Near-Memory / Processing-in-Memory (PIM) accelerators.

Treating the CPU as the sole universal execution target results in orders-of-magnitude performance loss and energy waste. However, forcing the programmer to manually write separate programs across CUDA, OpenCL, Metal, Vulkan, and C++ leads to fragmented codebases and massive glue-code overhead.

Rubix investigates a **Semantic Placement Architecture**: a single language whose semantic representations carry sufficient dependency, effect, and resource bounds to allow the compiler to synthesize native code for heterogeneous hardware targets without altering source program meaning.

---

## 2. Memory Topology: The Primary Heterogeneous Bottleneck

Historically, heterogeneous computing failed in general-purpose languages due to the **PCIe Data Transfer Bottleneck**:
$$\text{Speedup} = \frac{T_{\text{CPU}}}{T_{\text{Kernel}} + T_{\text{Transfer\_to\_Device}} + T_{\text{Transfer\_from\_Device}}}$$
If transfer latency across a narrow PCIe bus ($16\text{–}64\text{ GB/s}$) exceeds the compute acceleration gain, offloading produces a net slowdown.

### 2.1 The Unified Memory Revolution (2024–2026)
Contemporary hardware has transformed this equation:
1. **Apple Silicon Unified Memory Architecture (UMA)**: CPU, GPU, and NPU share a single unified LPDDR5X/LPDDR5T memory pool with bandwidth exceeding $400\text{–}800\text{ GB/s}$. Pointers are valid across all processing units with zero memory copying.
2. **NVIDIA Grace Hopper / Blackwell Superchips (NVLink-C2C)**: Coherent CPU-GPU memory interconnect with $900\text{ GB/s}$ bidirectional bandwidth, allowing CPU threads and GPU thread blocks to dereference the same virtual addresses.
3. **Intel Lunar Lake & AMD Strix Point**: Memory-on-package integration bringing low-latency unified access to CPU, iGPU, and NPU.

**Implication for Rubix**: When hardware provides unified physical memory, heterogeneous offloading is no longer a serialization and transport problem; it is a **pure scheduling and dispatch problem**.

---

## 3. The Rubix Heterogeneous Strategy

Rubix addresses heterogeneous targets through four coordinated mechanisms:

### 3.1 Capability-Guided Device Targeting
In [compiler/common/capabilities.bix](file:///home/bishwaxyz/translator/rubix/compiler/common/capabilities.bix) and [compiler/target/target.bix](file:///home/bishwaxyz/translator/rubix/compiler/target/target.bix), hardware capabilities are codified as first-class target flags:
* `FEAT_SSE2`, `FEAT_AVX`, `FEAT_AVX2`: Traditional x86 SIMD.
* `FEAT_NEON`, `FEAT_SVE`: Arm scalable vector extensions.
* `FEAT_RV_M`, `FEAT_RV_A`, `FEAT_RV_C`, `FEAT_RV_V`: RISC-V modular capabilities.
* `FEAT_WASM_SIMD`: WebAssembly 128-bit SIMD.

### 3.2 Pure Function Kernel Extraction
Functions annotated with `EFFECT_PURE` (0x0) and working over dense indexed buffers have zero observable side effects. The compiler can legally:
1. Transform loops over pure functions into parallel workgroups.
2. Offload execution to an attached vector unit, GPU compute shader, or background worker thread without violating program semantics.

### 3.3 Zero-Copy Buffer Sharing
Because Rubix uses affine ownership handles (`AIR_OP_MOVE`, `AIR_OP_BORROW`), the compiler guarantees that a buffer passed to a device kernel has no concurrent aliases on the host CPU. This eliminates defensive buffer copies, enabling zero-copy shared memory semantics.

---

## 4. Multi-Target Synthesis Model

Rather than bundling a massive JIT runtime into every binary, Rubix adheres to its native-first principle:
1. **Ahead-of-Time (AOT) Multi-Targeting**: The compiler generates native host machine instructions directly, targeting the host platform ABI.
2. **Embedded Kernel Payloads**: When target features indicate accelerator availability (e.g., Vulkan SPIR-V, Metal Bytecode, or WASI-NN), the compiler emits pre-compiled binary modules embedded within the native executable data segment (`.rodata`).
3. **Deterministic Fallback**: If the runtime hardware does not expose the accelerator capability at runtime, execution seamlessly falls back to the verified scalar/vector CPU implementation.

---

## 5. Summary

Heterogeneous computing in Rubix does not mean writing distinct languages for distinct chips. By capturing data dependencies, memory locality, and effect purity in the compiler's middle layers, Rubix enables optimal hardware placement while maintaining portable, unified source code.
