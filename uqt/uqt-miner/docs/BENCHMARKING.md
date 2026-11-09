# Benchmarking Methodology

Performance is the paramount goal of `uqt-miner`, but performance claims must be rigorously empirical.

> **Note:** Benchmark numbers will be introduced in subsequent phases after the hashing implementations are fully verified. Currently, the framework prioritizes establishing absolute correctness via scalar reference implementations and deterministic test vectors.

## Methodology Principles
- **No Fabricated Data**: Optimization claims must be backed by reproducible benchmark results.
- **Microbenchmarking over Time**: Hashrates must be captured over statistically significant time windows to eliminate transient noise and CPU throttling effects.
- **Hardware Agnosticism**: Results should detail exact compiler versions, flags (`-O3 -march=native`), thread placement, NUMA state, and huge page backing.
