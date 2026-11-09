# Dataflow & Execution Flow Diagrams

> **Status**: Canonical Accepted  
> **Classification**: Visual Architecture & Dataflow Diagrams  
> **Subsystem**: Rubix Visual Topologies  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document provides editable Mermaid diagrams modeling the detailed runtime dataflow, single-pass compilation streaming, and execution lifecycle flows across Rubix, HNS-Hyperflux, and EIA-Omega.

---

## 2. Sequence Diagram: Sub-Millisecond Synthesis & Relocation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / CLI
    participant Daemon as Resident Daemon (rubixd)
    participant HNS as HNS-Hyperflux (FSQG)
    participant SRT as Semantic Relocation Table
    participant ARLL as EIA ARLL-Agent
    participant CPU as Host Hardware Core

    Dev->>Daemon: Send build command via /dev/shm (<0.8 µs)
    Daemon->>HNS: Futex wakeup worker thread (<0.6 µs)
    HNS->>HNS: SIMD Vector Token Streaming (FS-VT) (48 µs)
    HNS->>SRT: Splice stencils & record holes (93 µs)
    HNS->>ARLL: Notify SRT entries SYNTHESIZED (<1 µs)
    ARLL->>ARLL: Match Hologram & calculate displacements (12 µs)
    ARLL->>SRT: Patch 32-bit holes via V_write (18 µs)
    ARLL->>CPU: Issue instruction cache barrier (ISB / FENCE) (0.1 µs)
    Daemon->>Dev: Emit compilation ready signal (Total: ~266 µs)
    Dev->>CPU: Jump to V_exec entry point (0.000 ns steady state)
```

---

## 3. Flowchart: UPBP Multi-OS Polyglot Boot Flow

```mermaid
flowchart TD
    Start([Process Executed on Host OS]) --> DetectOS{Operating System Type}
    
    DetectOS -->|Linux| ElfHeader[Kernel parses ELF64 Header at Byte 128]
    DetectOS -->|Windows| PeHeader[Kernel parses MZ/PE Header at Byte 0]
    DetectOS -->|macOS| MachHeader[Kernel parses Mach-O Header at Byte 256]
    DetectOS -->|Shell Script| ShellScript[POSIX /bin/sh executes wrapper script at Byte 64]
    
    ElfHeader --> CommonEntry[Common Entry Point: ARLL Bootstrap Stub]
    PeHeader --> CommonEntry
    MachHeader --> CommonEntry
    ShellScript --> CommonEntry
    
    CommonEntry --> CheckCSCL{Verify CSCL Merkle Tree}
    CheckCSCL -->|Invalid Root| Abort([Abort with ERR_EIA_CONTRACT_VIOLATION])
    CheckCSCL -->|Valid Root| MapDVAM[Initialize DVAM Virtual Memory Aliases]
    
    MapDVAM --> PatchHoles[Evaluate Hologram & Patch In-Memory Holes]
    PatchHoles --> FlushCache[Flush CPU Instruction Prefetch Pipeline]
    FlushCache --> RunApp[Execute Native Rubix Main Logic: 0.000 ns Dispatch]
```
