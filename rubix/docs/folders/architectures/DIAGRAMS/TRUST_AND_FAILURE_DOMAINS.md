# Trust Boundaries & Failure Domain Diagrams

> **Status**: Canonical Accepted  
> **Classification**: Visual Architecture & Security Boundaries  
> **Subsystem**: Rubix Visual Topologies  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document provides editable Mermaid diagrams modeling the trust domains, privilege isolation boundaries, and crash containment architectures within the Rubix ecosystem.

---

## 2. Security Trust Boundaries & Privilege Separation

```mermaid
graph TD
    subgraph Untrusted_Foreign_Domain["Untrusted Foreign Domain"]
        LegacyC["Legacy C / C++ / Go Code"]
        UntrustedPlugin["Untrusted 3rd-Party Plugins"]
    end

    subgraph Capability_Sandbox["Rubix Capability Sandbox (Seccomp-BPF)"]
        AFGF["AFGF Foreign Gateway Adapter"]
        BoundedMem["Bounded Capability Descriptors (0..N)"]
    end

    subgraph Sovereign_Rubix_Domain["Sovereign Rubix Execution Domain"]
        AppLogic["User Application Logic"]
        TypeLattice["Tri-Stratum Type System (V, R, C)"]
        ARLL["EIA-Omega ARLL-Agent"]
    end

    subgraph Privileged_Kernel_Domain["Privileged Hardware / Kernel Domain"]
        SyscallFilter["SAES Syscall Dispatch Table"]
        Kernel["Operating System Kernel"]
        CHERIHardware["CHERI Tagged Capability Registers"]
    end

    Untrusted_Foreign_Domain -->|Strict Capability Gate| AFGF
    AFGF --> BoundedMem
    BoundedMem --> AppLogic
    
    AppLogic -->|Must Provide Explicit CapToken| SyscallFilter
    SyscallFilter -->|Mediated Traps| Kernel
    AppLogic -.->|Direct Hardware Checks| CHERIHardware
```

---

## 3. Crash Isolation & Epoch Rejuvenation Flow

```mermaid
flowchart TD
    Request([Incoming Compilation Job]) --> Worker[Epoch N Worker Thread]
    
    Worker --> Process{Compilation Status}
    
    Process -->|Success| CleanReset[Reset RAMC Arena Watermark in 0.2 µs]
    CleanReset --> Ready[Ready for Next Request]
    
    Process -->|Worker Panic / SIGSEGV| SigAltStack[Kernel Catches Fault on sigaltstack]
    SigAltStack --> LogDiagnostic[Emit Structured JSON Machine Diagnostic]
    LogDiagnostic --> SigLongJmp[siglongjmp to Worker Safe Point]
    SigLongJmp --> ForceReset[Force Reset RAMC Bump Arena]
    ForceReset --> Ready
    
    Worker --> CheckEpoch{Processed 10,000 Builds?}
    CheckEpoch -->|Yes| SpawnNext[Spawn Epoch N+1 Worker & Pre-warm Cache]
    SpawnNext --> SwapPointer[Atomic Pointer Swap in /dev/shm Ring]
    SwapPointer --> Retire[Retire Epoch N Worker Gracefully]
    CheckEpoch -->|No| Ready
```
