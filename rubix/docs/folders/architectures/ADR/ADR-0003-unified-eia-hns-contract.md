# ADR-0003: Architectural Cohabitation Contract between EIA and HNS

* **Status**: Accepted
* **Date**: October 2026
* **Deciders**: Rubix Lead Architecture Board, Systems Integration Working Group
* **Invariants Bound**: `INV-01` (Semantic Invariance), `INV-02` (Zero Steady-State Indirection), `INV-03` (Sub-Millisecond Compilation)

---

## 1. Context and Problem Statement

Eternal Interface Architecture (EIA) and Hyper-Stride Native Synthesis (HNS) address complementary halves of the software execution lifecycle:
- **HNS** optimizes the *creation phase*: compiling source code into verified machine bytes in sub-millisecond time ($<0.35\text{ ms}$).
- **EIA** optimizes the *boundary and execution phase*: projecting machine bytes across operating system containers and evolving data layouts without static ABI breakage.

If combined naively, the two systems could compromise each other's strengths:
- If EIA forces HNS to generate complex multi-layer runtime wrapper objects during compilation, HNS build times will exceed the 1 ms bound.
- If HNS emits raw physical byte offsets without embedding EIA's Semantic Hologram ($\Sigma_\infty$), binary resilience across operating systems will be destroyed.

---

## 2. Decision Drivers

1. Achieve seamless symbiosis where HNS's sub-millisecond compilation and EIA's lifetime binary resilience reinforce each other.
2. Prevent compilation latency bloat in HNS caused by interface abstractions.
3. Prevent runtime performance degradation in EIA caused by stencil-based compilation.
4. Establish unambiguous boundaries: clearly delineate what data structures are shared and what systems remain strictly independent.

---

## 3. Considered Options

* **Option 1: Complete Monolithic Merger**: Merge EIA and HNS into a single monolithic codebase and intermediate representation.
* **Option 2: Completely Disconnected Stacks**: Keep EIA and HNS as completely separate tools with file-based intermediate handoffs.
* **Option 3: Layered Cohabitation via the Sovereign Autonomic Execution Substrate (SAES)**: Establish a clean contract where HNS acts as the machine byte producer and EIA acts as the memory projection and interface substrate.

---

## 4. Decision Outcome

**Chosen Option**: **Option 3: Layered Cohabitation via the Sovereign Autonomic Execution Substrate (SAES)**.

### Technical Specification
1. **Producer-Consumer Contract**:
   - HNS compiles syntax into raw machine stencils and emits an in-memory **Semantic Relocation Table (SRT)** containing unpatched displacement holes and calling convention anchor points.
   - EIA's resident loader agent reads the SRT, queries the host microarchitecture, binds calling conventions, and patches displacement holes into RAM in a single $O(1)$ pass taking under 50 microseconds.
2. **The Symbiotic Execution Loop**:
   $$\text{Developer Edit} \xrightarrow{50\text{ }\mu\text{s}} \text{HNS Synthesizes Stencil Fragment} \xrightarrow{0.000\text{ ns}} \text{EIA Patches Displacement Holes} \xrightarrow{} \text{Native CPU Execution}$$
3. **Preserved Independent Boundaries**:
   - HNS maintains complete independence from OS loader mechanisms; it operates strictly on byte streams and memory arenas.
   - EIA maintains complete independence from grammar parsing and language syntax; it operates strictly on semantic contracts and machine instruction immediates.

---

## 5. Pros and Cons of the Selected Architecture

### Positive Consequences
* **Exponential Synergy**: Developers get sub-millisecond build times AND zero-breakage binary distribution simultaneously.
* **Clean Architectural Separation**: Changes to language grammar do not affect EIA; changes to OS kernel loaders do not affect HNS.
* **Continuous In-Memory Evolution**: Running processes can hot-patch individual functions safely at runtime without restarts.

### Negative Consequences & Mitigations
* **Inter-System Interface Contract**: Requires maintaining a formal specification for the Semantic Relocation Table (SRT).
  - *Mitigation*: The SRT is formalized as an invariant binary struct in [`SHARED_FOUNDATIONS/CROSS_SYSTEM_DATA_MODELS.md`](../SHARED_FOUNDATIONS/CROSS_SYSTEM_DATA_MODELS.md).

---

## 6. Implementation and Verification

* **Primary Subsystems**: `compiler/main.bix`, `compiler/middle/abi.bix`, `compiler/executor/executor.bix`.
* **Verification Test**: End-to-end integration test: mutate a function body, synthesize replacement stencil via HNS, patch into RAM via EIA, and assert correct execution without process restart.
