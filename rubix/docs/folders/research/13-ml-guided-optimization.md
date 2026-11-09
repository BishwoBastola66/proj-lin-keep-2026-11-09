# Machine-Learning-Guided Compilation (MLGO) & Learned Cost Models

## 1. Introduction: Hand-Tuned Heuristics vs. Learned Policies

Compilers are filled with intractable NP-hard optimization problems:
1. **Instruction Inlining**: Deciding whether to inline a function involves balancing code size expansion against call overhead reduction.
2. **Register Allocation**: Choosing which live range to spill to stack when all architectural registers are occupied.
3. **Pass Ordering**: Determining the optimal sequence of IR transformations.
4. **Vector Factor Selection**: Deciding whether unrolling by $2\times$, $4\times$, or $8\times$ is optimal for memory bandwidth.

Historically, these decisions were governed by hand-tuned static heuristics (e.g., "inline if cost $\le 225$"). These heuristics are fragile, tuned on artificial benchmark suites, and fail across different microarchitectures.

**Machine Learning for Compiler Optimization (MLGO)** (Trofin et al., Google, 2021–2026) demonstrated that Deep Reinforcement Learning (RL) can replace hand-crafted heuristics, achieving substantial size and speed improvements.

---

## 2. The Golden Invariant: Provable Correctness vs. Learned Heuristics

A catastrophic failure mode of "AI compilers" is allowing machine learning models to synthesize code without formal verification, risking silent semantic bugs and security exploits.

Rubix establishes an absolute architectural division:

$$\mathbf{CORRECTNESS} \quad \text{vs.} \quad \mathbf{OPTIMIZATION}$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│ PROVABLE DETERMINISTIC BOUNDARY (Zero ML Permitted)                    │
│   - Lexical parsing & syntax validation                                │
│   - Type system verification                                           │
│   - Algebraic effect lattice checking                                  │
│   - Capability authorization checking                                  │
│   - Affine ownership & borrow checking                                 │
│   - Binary encoding & sovereign container synthesis                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Guarantees Absolute Safety
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LEARNED HEURISTIC OPTIMIZATION BOUNDARY (ML Guided)                    │
│   - Function inlining thresholds                                       │
│   - Register allocation spill priority                                 │
│   - Loop unroll factors (2x, 4x, 8x)                                   │
│   - Basic block code layout ordering                                   │
│   - Multi-objective Pareto selection (Size vs. Speed vs. Energy)       │
└────────────────────────────────────────────────────────────────────────┘
```

* **Core Law**: **Machine Learning may decide whether to apply an optimization, but it can never alter the formal semantics of the program**. Every candidate transformation produced by an ML policy must be verified by the deterministic type and effect checker.

---

## 3. Reinforcement Learning Architecture for Compilers

In the Rubix compiler optimization model:
* **State ($S$)**: Graph Neural Network (GNN) embedding of the SIR/AIR basic block graph, including loop depth, instruction counts, register pressure, and effect flags.
* **Action ($A$)**: Binary decision (e.g., inline vs. do not inline) or discrete scalar (e.g., unroll factor $\in \{1, 2, 4, 8\}$).
* **Reward ($R$)**: Measured execution throughput speedup, binary size reduction, or energy consumption reduction on the target architecture:
  $$R = \alpha \cdot \Delta\text{Throughput} + \beta \cdot \Delta\text{Size}^{-1} + \gamma \cdot \Delta\text{Energy}^{-1}$$

---

## 4. Offline Training with Online Deterministic Inference

Embedding massive multi-gigabyte neural networks directly into the production compiler creates unacceptable compilation latency.
* **Rubix Strategy**: Neural networks are trained offline across large codebase corpora. The resulting policy is compiled into a lightweight, static Decision Tree or quantized matrix ($\le 64$ KB) executed during AOT compilation in **under 10 microseconds**.
* Builds remain **100% deterministic**: identical compiler inputs with the same policy flags produce identical, bit-for-bit reproducible binary outputs.
