# uqt-miner Architecture

`uqt-miner` is designed around extreme modularity, hardware awareness, and verifiable optimization.

## Core Abstractions

### 1. Algorithm Interface & Registry (`include/uqt/algo.h`)
The hashing subsystem uses a modular `uqt_algo_t` interface containing multiple `uqt_algo_backend_t` implementations (e.g. scalar, avx2, shani). The algorithm registry handles dynamic registration and lookup.

### 2. Runtime Capability Filtering
Backend selection determines the active hash implementation by checking the bitwise `required_features` flag against the globally cached `uqt_cpu_info_t` from Phase 3 CPU detection. The system starts with the highest priority optimization and cascades down to the guaranteed scalar reference implementation.

### 3. Verification Oracles
Scalar implementations act as correctness oracles. Any hardware-accelerated SIMD or AES-NI backend must perfectly mirror the internal state transformations of its scalar counterpart, ensuring that optimizations never compromise cryptographic integrity.
