# System Context & Architecture Topology Diagrams

> **Status**: Canonical Accepted  
> **Classification**: Visual Architecture & C4 Topologies  
> **Subsystem**: Rubix Visual Topologies  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document provides editable Mermaid architecture diagrams modeling the system context, component containers, and network/hardware topologies of the Rubix ecosystem, EIA-Omega, HNS-Hyperflux, and the Unified Substrate (SAES).

---

## 2. C4 Context Diagram: The Rubix Computing Ecosystem

```mermaid
graph TD
    User([Developer / AI Agent]) -->|Writes Source Code / Commands| Toolchain[Rubix Unified CLI / LSP Server]
    
    subgraph Host_Environment["Host Operating System Environment (Linux / macOS / Windows)"]
        Toolchain -->|IPC via /dev/shm| Daemon[Rubix Resident Daemon 'rubixd']
        
        subgraph SAES_Substrate["Sovereign Autonomic Execution Substrate (SAES)"]
            Daemon -->|Single-Pass Stencils| HNS[HNS-Hyperflux Engine]
            HNS -->|Splice Stencils| CodeArena[(DVAM Virtual Code Pages)]
            HNS -->|Record Holes| SRT[(Semantic Relocation Table)]
            
            ARLL[EIA-Omega ARLL-Agent] -->|Parse & Validate| Hologram[(Universal Hologram)]
            ARLL -->|Patch Relocation Holes| SRT
            ARLL -->|Write Displacements| CodeArena
        end
        
        CodeArena -->|Direct Native Execution| CPU[Host CPU Hardware: x86-64 / ARM64 / RV64]
    end
    
    CPU -->|Enforces Tagged Bounds| CHERI[Optional CHERI Purecap Hardware]
    CPU -->|Byte-Addressable Memory| CXL[CXL 3.0 / NVRAM Persistent Fabric]
```

---

## 3. Subsystem Container Diagram: In-Memory Memory Topology

```mermaid
graph LR
    subgraph Physical_RAM["Host Physical RAM Frames"]
        PhysPages["Shared Physical Pages (Code & Data)"]
    end
    
    subgraph Virtual_Address_Space["Process Virtual Address Space (DVAM)"]
        VWrite["Writable Alias: V_write (PROT_READ | PROT_WRITE)"]
        VExec["Executable Alias: V_exec (PROT_READ | PROT_EXEC)"]
        Arena["Resident 16MB Bump Arena: RAMC"]
    end
    
    PhysPages -.->|MMU Mapping| VWrite
    PhysPages -.->|MMU Mapping| VExec
    
    Patcher[HNS Splicer / EIA ARLL-Agent] -->|Writes Machine Bytes & Holes| VWrite
    CPUCore[CPU Instruction Prefetcher] -->|Executes Native Instructions| VExec
```
