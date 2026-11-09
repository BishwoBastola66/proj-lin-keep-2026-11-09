# Architecture Knowledge Base Master Index

This document provides a registry of all architectural specifications, foundations, decisions, and formal models comprising the Rubix, EIA, and HNS architecture knowledge base.

---

## 1. Master Document Registry

| Document Identifier | Title | Subsystem / Domain | Maturity Status | Primary Authors / Origin |
| :--- | :--- | :--- | :--- | :--- |
| `ARCH-DOC-001` | [README.md](README.md) | Ecosystem Master Index | Canonical Accepted | Rubix Core Architecture Team |
| `ARCH-DOC-002` | [INDEX.md](INDEX.md) | Navigation & Registry | Canonical Accepted | Rubix Core Architecture Team |
| `ARCH-DOC-003` | [ARCHITECTURE_CATALOG.md](ARCHITECTURE_CATALOG.md) | Taxonomy & Component Catalog | Canonical Accepted | Rubix Systems Architecture |
| `ARCH-DOC-004` | [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md) | Repository Evidence Inventory | Complete Audited | Systems Research Group |
| `ARCH-DOC-005` | [CONCEPT_INDEX.md](CONCEPT_INDEX.md) | Alphabetical Concept Index | Canonical Accepted | Language & Systems Research |
| `ARCH-DOC-006` | [GLOSSARY.md](GLOSSARY.md) | Technical Terms & Acronyms | Canonical Accepted | Architecture Working Group |
| `ARCH-DOC-007` | [REQUIREMENTS_TRACEABILITY.md](REQUIREMENTS_TRACEABILITY.md) | Traceability & Invariant Matrix | Complete Audited | Formal Methods Team |
| `ARCH-DOC-008` | [ASSUMPTIONS_AND_OPEN_QUESTIONS.md](ASSUMPTIONS_AND_OPEN_QUESTIONS.md) | Assumptions & Research Horizons | Active Working | Systems Strategy Group |
| `ARCH-DOC-009` | [RESEARCH_REGISTER.md](RESEARCH_REGISTER.md) | Authoritative External Citations | Peer-Reviewed | Academic & Industry Research |
| `ARCH-DOC-010` | [ARCHITECTURE_EVALUATION_FRAMEWORK.md](ARCHITECTURE_EVALUATION_FRAMEWORK.md) | Evaluation & Quality Framework | Canonical Accepted | Systems Benchmarking Team |
| `ARCH-DOC-011` | [ARCHITECTURAL_INVARIANTS.md](ARCHITECTURAL_INVARIANTS.md) | Globally Binding Invariants | Formal Invariant | Core Systems Design Team |
| `ARCH-DOC-012` | [CROSS_ARCHITECTURE_DECISIONS.md](CROSS_ARCHITECTURE_DECISIONS.md) | Cross-Cutting Architectural Rules | Canonical Accepted | Principal Architecture Board |

---

## 2. Subsystem Specification Index

### 2.1 Eternal Interface Architecture (EIA)
* [`EIA/EIA_ARCHITECTURE_OVERVIEW.md`](EIA/EIA_ARCHITECTURE_OVERVIEW.md): Comprehensive architectural blueprint of EIA, deconstructing the 40-year static ABI churn trap and operating system binary container lock-in.
* [`EIA/EIA_FOUNDATIONAL_PRINCIPLES.md`](EIA/EIA_FOUNDATIONAL_PRINCIPLES.md): The mathematical foundations of semantic invariance, Reynolds' relational parametricity, and the Post-ABI Continuum.
* [`EIA/EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md`](EIA/EIA_SYSTEM_BOUNDARIES_AND_COMPONENTS.md): Structural boundary definitions for the Universal Hologram ($\Sigma_\infty$), Autonomous Resident Linker-Loader Agent (`ARLL-Agent`), and Universal Polyglot Binary Packaging (`UPBP`).
* [`EIA/EIA_EXECUTION_LIFECYCLE_MODEL.md`](EIA/EIA_EXECUTION_LIFECYCLE_MODEL.md): Dynamic execution lifecycle, polyglot boot sequence (`MZ` + Shell + ELF + Mach-O), and in-memory JIT displacement hole patching.
* [`EIA/EIA_SECURITY_MODEL.md`](EIA/EIA_SECURITY_MODEL.md): Dual Virtual Alias Mapping (`DVAM`), memory safety verification, and capability-bounded foreign function boundaries.
* [`EIA/EIA_FAILURE_RECOVERY_MODEL.md`](EIA/EIA_FAILURE_RECOVERY_MODEL.md): Schema divergence resolution, fallback projection stencils, and self-healing memory layouts.
* [`EIA/EIA_PERFORMANCE_MODEL.md`](EIA/EIA_PERFORMANCE_MODEL.md): Zero-cost steady-state latency proofs ($0.000\text{ ns}$), cycle accounting, and cache locality bounds.
* [`EIA/EIA_COMPATIBILITY_AND_MIGRATION.md`](EIA/EIA_COMPATIBILITY_AND_MIGRATION.md): Seamless backward and forward compatibility strategies for legacy C, C++, POSIX, Win32, and macOS dylib ecosystems.
* [`EIA/EIA_LIMITATIONS_AND_FUTURE_ROADMAP.md`](EIA/EIA_LIMITATIONS_AND_FUTURE_ROADMAP.md): Acknowledged physical limitations, CHERI purecap integration, and the 500,000-year digital preservation roadmap.

### 2.2 Hyper-Stride Native Synthesis (HNS / HSNS / ZWNS)
* [`HNS/HNS_ARCHITECTURE_OVERVIEW.md`](HNS/HNS_ARCHITECTURE_OVERVIEW.md): Comprehensive architectural blueprint of HNS, deconstructing traditional compiler latency and introducing the six acceleration vectors.
* [`HNS/HNS_FOUNDATIONAL_PRINCIPLES.md`](HNS/HNS_FOUNDATIONAL_PRINCIPLES.md): The zero-waste philosophy, Amdahl parallelism, Wirthian single-pass streaming, and copy-and-patch compilation theory.
* [`HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md`](HNS/HNS_SYSTEM_BOUNDARIES_AND_COMPONENTS.md): Structural specifications for `PCMSS`, `FSQG-Splice`, `RAMC`, `DDZRE`, `BSIS`, and `DL-BBEL`.
* [`HNS/HNS_EXECUTION_LIFECYCLE_MODEL.md`](HNS/HNS_EXECUTION_LIFECYCLE_MODEL.md): Token streaming, single-pass stencil instantiation, in-RAM relocation resolution, and direct page mapping.
* [`HNS/HNS_SECURITY_AND_ARENA_BOUNDARIES.md`](HNS/HNS_SECURITY_AND_ARENA_BOUNDARIES.md): Bump arena memory protection, emergency signal buffers, and zero-cost stack probing.
* [`HNS/HNS_FAILURE_RECOVERY_MODEL.md`](HNS/HNS_FAILURE_RECOVERY_MODEL.md): Generational epoch cycling (`GEC-PFD`), daemon state rejuvenation, and compiler panic unwinding.
* [`HNS/HNS_PERFORMANCE_MODEL.md`](HNS/HNS_PERFORMANCE_MODEL.md): Sub-millisecond compilation latency formulations ($T_{\text{HNS}} \approx 0.35\text{ ms}$), memory access models, and Big-O proofs.
* [`HNS/HNS_COMPATIBILITY_AND_MIGRATION.md`](HNS/HNS_COMPATIBILITY_AND_MIGRATION.md): Migration pathways from GCC, Clang, Rustc, and Go build systems to HNS.
* [`HNS/HNS_LIMITATIONS_AND_FUTURE_ROADMAP.md`](HNS/HNS_LIMITATIONS_AND_FUTURE_ROADMAP.md): Fast Lane vs Deep Lane optimization boundaries, polyhedral vectorization limits, and future hardware targets.

### 2.3 EIA + HNS Unified Architecture Program
* [`EIA_HNS_UNIFIED/UNIFIED_REFERENCE_ARCHITECTURE.md`](EIA_HNS_UNIFIED/UNIFIED_REFERENCE_ARCHITECTURE.md): Authoritative combined reference architecture demonstrating how EIA's semantic invariance and HNS's sub-millisecond synthesis reinforce each other.
* [`EIA_HNS_UNIFIED/CANDIDATE_ARCHITECTURES_COMPARISON.md`](EIA_HNS_UNIFIED/CANDIDATE_ARCHITECTURES_COMPARISON.md): Systematic evaluation of 6 distinct integration candidates (Loosely Coupled, Shared Foundation, Layered, Capability-Oriented, Deep Unified, Minimal Integration).
* [`EIA_HNS_UNIFIED/INTEGRATION_CONTRACTS_AND_INTERFACES.md`](EIA_HNS_UNIFIED/INTEGRATION_CONTRACTS_AND_INTERFACES.md): Concrete binary schemas, data structures, register allocation protocols, and syscall dispatch tables.
* [`EIA_HNS_UNIFIED/SHARED_AND_INDEPENDENT_BOUNDARIES.md`](EIA_HNS_UNIFIED/SHARED_AND_INDEPENDENT_BOUNDARIES.md): Explicit demarcation of shared invariants versus strictly isolated subsystems where combining would introduce harmful coupling.
* [`EIA_HNS_UNIFIED/UNIFIED_MIGRATION_AND_COMPATIBILITY.md`](EIA_HNS_UNIFIED/UNIFIED_MIGRATION_AND_COMPATIBILITY.md): Dual-track adoption strategy for deploying EIA+HNS into existing enterprise infrastructure.

### 2.4 Rubix Future Architecture Program
* [`RUBIX/RUBIX_LIVING_NEURO_GENOMIC_ARCHITECTURE.md`](RUBIX/RUBIX_LIVING_NEURO_GENOMIC_ARCHITECTURE.md): The Living Neuro-Genomic Architecture uniting all architectures via generational DNA hereditary transmission, inter-architectural neural synapses, autonomic reflex arcs, and living homeostatic stability.
* [`RUBIX/RUBIX_OMNI_SCIENTIFIC_UNIFIED_ARCHITECTURE.md`](RUBIX/RUBIX_OMNI_SCIENTIFIC_UNIFIED_ARCHITECTURE.md): The Grand Convergence masterwork synthesizing cellular genetics, deep geology, catalytic kinetics, quantum metallurgy, cognitive neuroplasticity, and sacred hermeneutics into an indestructible sovereign computing substrate.
* [`RUBIX/RUBIX_AETERNA_LIVING_COSMIC_ARCHITECTURE.md`](RUBIX/RUBIX_AETERNA_LIVING_COSMIC_ARCHITECTURE.md): The Living-Cosmic Sovereign Architecture synthesizing tardigrade vitrification, hemodynamics, Turritopsis transdifferentiation, 5-body Lagrange equilibrium, and Indra's Net.
* [`RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md`](RUBIX/RUBIX_FUTURE_ARCHITECTURE_PROPOSALS.md): Sovereign language capabilities, autonomic systems optimization, heterogeneous hardware placement, and neural-symbolic compilation.
* [`RUBIX/RUBIX_MULTI_STAGE_SEMANTIC_MODEL.md`](RUBIX/RUBIX_MULTI_STAGE_SEMANTIC_MODEL.md): The multi-stage intermediate representation pipeline spanning SIR, AIR, UIR, and the RUMS Next machine synthesis engine.
* [`RUBIX/RUBIX_STAGED_DEVELOPMENT_ROADMAP.md`](RUBIX/RUBIX_STAGED_DEVELOPMENT_ROADMAP.md): 5-phase execution plan: Phase 1 (Core Foundations) through Phase 5 (Autonomous Ecosystem & Long-Term Preservation).

### 2.5 Cross-Cutting Engineering Foundations
* [`SHARED_FOUNDATIONS/SHARED_PRINCIPLES_AND_INVARIANTS.md`](SHARED_FOUNDATIONS/SHARED_PRINCIPLES_AND_INVARIANTS.md): 16 core engineering principles binding all architectures.
* [`SHARED_FOUNDATIONS/CROSS_SYSTEM_DATA_MODELS.md`](SHARED_FOUNDATIONS/CROSS_SYSTEM_DATA_MODELS.md): Concrete binary representations of the Semantic Hologram, Capability Tokens, Stencil Headers, and Arena Descriptors.
* [`LANGUAGE_AND_SYNTAX/FORMAL_GRAMMAR_EBNF.md`](LANGUAGE_AND_SYNTAX/FORMAL_GRAMMAR_EBNF.md): Formal grammar of the Rubix language in ISO/IEC 14977 EBNF notation.
* [`LANGUAGE_AND_SYNTAX/LEXICAL_AND_SYNTAX_SPECIFICATION.md`](LANGUAGE_AND_SYNTAX/LEXICAL_AND_SYNTAX_SPECIFICATION.md): Token definitions, identifier hygiene, operator precedence, and grammar ambiguity resolutions.
* [`TYPE_SYSTEM_AND_SEMANTICS/SEMANTIC_TYPE_LATTICE.md`](TYPE_SYSTEM_AND_SEMANTICS/SEMANTIC_TYPE_LATTICE.md): Mathematical formalization of the $\mathcal{T} = \mathcal{V} \cup \mathcal{R} \cup \mathcal{C}$ join-semilattice.
* [`TYPE_SYSTEM_AND_SEMANTICS/AFFINE_OWNERSHIP_AND_BORROWING.md`](TYPE_SYSTEM_AND_SEMANTICS/AFFINE_OWNERSHIP_AND_BORROWING.md): Non-lexical lifetimes, lexical region bump allocation, and compile-time escape analysis.
* [`TYPE_SYSTEM_AND_SEMANTICS/ALGEBRAIC_EFFECT_CONFINEMENT.md`](TYPE_SYSTEM_AND_SEMANTICS/ALGEBRAIC_EFFECT_CONFINEMENT.md): The 7-bit effect bitmask lattice and Purity Confinement Theorem.
* [`TYPE_SYSTEM_AND_SEMANTICS/CAPABILITY_SECURITY_SYSTEM.md`](TYPE_SYSTEM_AND_SEMANTICS/CAPABILITY_SECURITY_SYSTEM.md): Zero-ambient authority, linear unforgeable capability tokens, and CHERI hardware co-design.
* [`COMPILERS_AND_EXECUTION/MULTI_STAGE_IR_PIPELINE.md`](COMPILERS_AND_EXECUTION/MULTI_STAGE_IR_PIPELINE.md): Invariant preservation across SIR, AIR, and UIR compiler stages.
* [`COMPILERS_AND_EXECUTION/MACHINE_SYNTHESIS_AND_RUMS.md`](COMPILERS_AND_EXECUTION/MACHINE_SYNTHESIS_AND_RUMS.md): Declarative target descriptions (`.machine`) and direct native byte emission without external assemblers.
* [`COMPILERS_AND_EXECUTION/RESIDENT_COMPILER_AND_DAEMON_RUNTIME.md`](COMPILERS_AND_EXECUTION/RESIDENT_COMPILER_AND_DAEMON_RUNTIME.md): In-memory daemon architecture, arena reset mechanisms, and IPC communication protocols.
* [`SECURITY_AND_TRUST/SECURITY_ARCHITECTURE_AND_THREAT_MODEL.md`](SECURITY_AND_TRUST/SECURITY_ARCHITECTURE_AND_THREAT_MODEL.md): Comprehensive STRIDE threat modeling, trust boundaries, and attack tree mitigations.
* [`SECURITY_AND_TRUST/CAPABILITY_SANDBOXING_AND_WX.md`](SECURITY_AND_TRUST/CAPABILITY_SANDBOXING_AND_WX.md): Zero-syscall W^X memory page aliasing, stack clash protection, and CFI landing pads.
* [`DIAGRAMS/SYSTEM_CONTEXT_AND_TOPOLOGY.md`](DIAGRAMS/SYSTEM_CONTEXT_AND_TOPOLOGY.md): C4 context and component diagrams in editable Mermaid format.
* [`DIAGRAMS/DATAFLOW_AND_EXECUTION_FLOW.md`](DIAGRAMS/DATAFLOW_AND_EXECUTION_FLOW.md): Mermaid dataflow, single-pass compilation streaming, and polyglot boot sequence flows.
* [`DIAGRAMS/TRUST_AND_FAILURE_DOMAINS.md`](DIAGRAMS/TRUST_AND_FAILURE_DOMAINS.md): Mermaid fault isolation, epoch recycling, and capability security boundary diagrams.

### 2.6 Architecture Decision Records (ADR)
* [`ADR/ADR-0001-eia-semantic-hologram.md`](ADR/ADR-0001-eia-semantic-hologram.md): Replacement of static ABIs with Semantic Holograms.
* [`ADR/ADR-0002-hns-machine-stencils.md`](ADR/ADR-0002-hns-machine-stencils.md): Copy-and-patch stencils over monolithic multi-pass SSA optimization.
* [`ADR/ADR-0003-unified-eia-hns-contract.md`](ADR/ADR-0003-unified-eia-hns-contract.md): Architectural cohabitation contract between EIA and HNS.
* [`ADR/ADR-0004-affine-ownership-regions.md`](ADR/ADR-0004-affine-ownership-regions.md): Affine types and lexical bump arenas over tracing GC and manual heap allocators.
* [`ADR/ADR-0005-capability-security.md`](ADR/ADR-0005-capability-security.md): Zero-ambient authority via unforgeable linear capability tokens.
* [`ADR/ADR-0006-dual-virtual-alias-wx.md`](ADR/ADR-0006-dual-virtual-alias-wx.md): Dual virtual alias mapping for zero-syscall W^X memory page execution.
