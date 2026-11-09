# Master Global Catalog: Hardware & Software Existing in the World

> **Comprehensive Taxonomy of Physical Compute Substrates, Silicon Architectures, Storage Media, Network Fabrics, Operating Systems, Compilers, Distributed Systems, AI Engines, and Enterprise Platforms.**

---

## Architecture Navigation & Index
```text
================================================================================
                    GLOBAL TAXONOMY OF COMPUTING SYSTEMS
================================================================================
  PART I: HARDWARE TAXONOMY
    ├── 1. Compute & Processing Silicon (CPUs, GPUs, TPUs, FPGAs, ASICs, QPUs)
    ├── 2. Memory & Storage Hierarchies (SRAM, DRAM, HBM, NVMe, Tape, Optical)
    ├── 3. Interconnects, Busses & Networks (PCIe, CXL, NVLink, InfiniBand, 5G)
    └── 4. Sensors, Actuators & Power (LiDAR, RADAR, Bio/Neural, PMICs, Rad-Hard)

  PART II: SOFTWARE TAXONOMY
    ├── 5. System Software & Operating Systems (Linux, Windows, RTOS, seL4)
    ├── 6. Compilers, Languages & Runtimes (AOT, JIT, LLVM, WebAssembly, CUDA)
    ├── 7. Data Systems & Databases (RDBMS, NoSQL, OLAP, Vector DBs, NewSQL)
    ├── 8. Networking, Middleware & Distributed Systems (K8s, Kafka, eBPF, gRPC)
    ├── 9. AI, Neural Runtimes & Scientific Computing (PyTorch, vLLM, TensorRT)
    └── 10. Cybersecurity, Enterprise & Creative (EDR, ERP, CAD, Game Engines, HFT)
================================================================================
```

---

# PART I: ALL TYPES OF HARDWARE EXISTING IN THE WORLD

## 1. Compute & Processing Hardware

| Hardware Class | Prominent Microarchitectures & Families | Core Characteristics & Use Cases |
| :--- | :--- | :--- |
| **Central Processing Units (CPUs)** | • **x86-64**: Intel Core/Xeon, AMD Ryzen/EPYC<br>• **ARM64**: Apple M-series, AWS Graviton, Qualcomm Snapdragon, Cortex-A/R/M<br>• **RISC-V**: SiFive Performance, T-Head XuanTie, ESP32-C3<br>• **Legacy/Mainframe**: IBM z/Architecture, POWER10, SPARC64, MIPS | General-purpose compute, complex branching, out-of-order execution pipelines, multi-level caches. |
| **Graphics Processing Units (GPUs)** | • **Datacenter AI/Compute**: Nvidia H100/H200/B200 (Blackwell), AMD Instinct MI300X, Intel Gaudi 3<br>• **Discrete Consumer**: Nvidia GeForce RTX 40/50 series, AMD Radeon RX 7000/8000, Intel Arc<br>• **Integrated**: Intel Xe, AMD RDNA iGPU, Apple unified GPU cores | Massive SIMD/SIMT data parallelism, matrix arithmetic, texture mapping, rendering pipelines. |
| **Tensor & Neural Accelerators (TPU/NPU)** | • **Cloud AI ASICs**: Google TPU v4/v5p/v6e, AWS Trainium 2, AWS Inferentia<br>• **Edge & Client NPUs**: Apple Neural Engine (ANE), Qualcomm Hexagon, Intel NPU, AMD XDNA<br>• **Vision Processing**: Intel Movidius Myriad | Systolic array GEMM matrix multiplication, quantized INT8/FP8/BF16 matrix execution. |
| **Field-Programmable Gate Arrays (FPGA)** | • **High-End**: AMD/Xilinx Versal AI / Virtex UltraScale+, Intel Agilex / Stratix 10<br>• **Low-Power/Embedded**: Lattice iCE40 / Certus-NX, Microchip PolarFire SoC | Reconfigurable hardware logic, custom register-transfer level (RTL) pipelines, ultra-low latency. |
| **Application-Specific ICs (ASIC)** | • **Cryptographic Miners**: Bitmain Antminer (SHA-256)<br>• **Network Switches**: Broadcom Tomahawk 5, Cisco Silicon One, Marvell Teralynx<br>• **Video Transcoding**: Google VCU, NETINT Quadra | Fixed non-programmable silicon designed for maximum thermodynamic and operational efficiency. |
| **Digital Signal Processors (DSP/ISP)** | • **Audio/RF DSPs**: TI TMS320, Analog Devices SHARC/Blackfin<br>• **Image Signal Processors (ISPs)**: Sony IMX ISP, Qualcomm Spectra | Fixed-point and floating-point Fourier transforms, audio filters, camera sensor raw Bayer pipelines. |
| **Microcontrollers (MCU)** | • **8/16-bit**: Atmel AVR (ATmega328), Microchip PIC16/18, TI MSP430<br>• **32-bit Cortex-M**: STMicroelectronics STM32, NXP LPC, Nordic nRF52/53<br>• **Dual-Core Wireless**: Espressif ESP32 (Xtensa/RISC-V), Raspberry Pi RP2040/RP2350 | Bare-metal firmware execution, direct memory-mapped GPIO register control, milliwatt power budgets. |
| **Quantum Processing Units (QPU)** | • **Superconducting**: IBM Heron/Eagle, Google Sycamore, Rigetti Computing<br>• **Trapped-Ion**: IonQ Forte, Quantinuum H-series<br>• **Photonic**: Xanadu Borealis, PsiQuantum<br>• **Neutral Atom**: QuEra Aquila, Pasqal | Quantum superposition and entanglement circuits for quantum chemistry, Shor/Grover algorithms. |
| **Neuromorphic & Analog Processors** | • **Spiking Silicon**: Intel Loihi 2, IBM TrueNorth, SpiNNaker 2, BrainScaleS-2<br>• **Analog In-Memory**: Mythic AI AMP, Memristor resistive RAM arrays<br>• **Photonic Accelerators**: Lightmatter Envise, Celestial AI Photonic Fabric | Event-based asynchronous spike processing and analog crossbar array physics for matrix dot-products. |
| **Hardware Security Modules (HSM/TPM)** | • **Discrete Security**: YubiKey, Smartcards, Infineon TPM 2.0 chips, Thales Luna HSM<br>• **Silicon Enclaves**: Apple Secure Enclave, ARM TrustZone, AMD PSP, Intel SGX | Tamper-resistant physical key storage, elliptic-curve cryptography acceleration, secure boot roots. |

---

## 2. Memory & Storage Hierarchies

```text
[Registers]          <1 ns       Bytes        Physical Silicon Registers (APX, AVX, SVE)
     │
[L1/L2/L3 Caches]   1 - 15 ns   KB - MB      On-Die Static RAM (SRAM)
     │
[Primary DRAM/HBM]  50 - 100 ns  GB - TB      DDR5, LPDDR5X, HBM3e (High-Bandwidth Stacked)
     │
[Persistent NVRAM]  150 - 300 ns GB - TB      CXL Attached Memory, MRAM, FeRAM, Optane
     │
[Solid-State Flash] 10 - 50 µs   TB           NVMe PCIe Gen5 SSDs, UFS 4.0, eMMC
     │
[Magnetic / Tape]   5 - 15 ms    TB - PB      HAMR HDDs, LTO-9 Linear Magnetic Tape
     │
[Deep-Time Media]   Seconds     PB - EB      5D Optical Silica Glass, Synthetic DNA Storage
```

1. **Volatile Primary Memory**:
   - **SRAM**: On-die multi-ported cache lines (L1 Data/Instruction, L2, unified L3 slices).
   - **DRAM**: DDR4, DDR5, LPDDR5X (Mobile), GDDR6/GDDR7 (Graphics discrete cards).
   - **HBM (High Bandwidth Memory)**: 3D Through-Silicon-Via (TSV) memory stacks (HBM2e, HBM3, HBM3e) offering $>8\text{ TB/s}$ bandwidth.
2. **Solid-State Non-Volatile Flash**:
   - **NVMe SSDs**: PCIe Gen4 / Gen5 M.2 and enterprise U.2, E1.S, E3.S form factors using NAND Flash (SLC, TLC, QLC).
   - **Embedded Mobile**: UFS 4.0 (Universal Flash Storage) and eMMC 5.1.
3. **Magnetic & Mechanical Mass Storage**:
   - **Hard Disk Drives (HDD)**: Conventional Magnetic Recording (CMR), Shingled (SMR), Heat-Assisted Magnetic Recording (HAMR).
   - **Magnetic Tape**: LTO-9 (Linear Tape-Open), IBM 3592 Enterprise tape cartridges for cold tier cloud archiving.
4. **Firmware & Non-Volatile Memory**:
   - NOR Flash (SPI boot memory for UEFI/BIOS), EEPROM for hardware calibration parameters.
5. **Emerging Deep-Time Media**:
   - **5D Optical Glass Storage**: Femtosecond laser encoding into quartz silica glass (survives centuries).
   - **Synthetic DNA Storage**: Density exceeding 200 Petabytes per gram with multi-millennium stability.

---

## 3. Interconnects, Buses & Networking Hardware

1. **System Buses & Inter-Chip Fabrics**:
   - **PCIe**: Peripheral Component Interconnect Express (PCIe Gen 3, Gen 4, Gen 5, Gen 6 with PAM4 signaling).
   - **CXL**: Compute Express Link (CXL 1.1, 2.0, 3.0 memory pooling and device disaggregation).
   - **Accelerator Interconnects**: Nvidia NVLink 4/5 ($1.8\text{ TB/s}$ per GPU), NVSwitch, AMD Infinity Fabric, Intel UPI.
2. **Datacenter & High-Performance Fabrics**:
   - **InfiniBand**: Quantum-2 NDR ($400\text{ Gbps}$), Quantum-3 XDR ($800\text{ Gbps}$) with sub-microsecond RDMA.
   - **Ethernet**: 10GbE, 25GbE, 100GbE, 400GbE, 800GbE; RoCE v2 (RDMA over Converged Ethernet).
   - **DPUs & SmartNICs**: Nvidia BlueField-3, Intel Mount Evans, AMD Pensando (offloading networking and crypto).
3. **Telecommunications & Wireless**:
   - **Cellular**: 5G Sub-6GHz & mmWave baseband units (BBU), Remote Radio Units (RRU), Open-RAN hardware.
   - **Satellite Networks**: Phased-array electronic beam-steering antennas (Starlink Dishy, Project Kuiper).
   - **Local Wireless**: Wi-Fi 6E/7 (802.11be, 320 MHz channels), Bluetooth 5.4, Ultra-Wideband (UWB), LoRaWAN.
4. **Embedded, Automotive & Industrial Buses**:
   - Automotive: CAN bus, CAN-FD, FlexRay, LIN, Automotive Ethernet (100BASE-T1).
   - Industrial: I2C, SPI, UART, RS-485, Modbus, Profibus, SpaceWire (aerospace).

---

## 4. Sensors, Actuators & Power Delivery

1. **Optical & Spatial Sensors**: Solid-state LiDAR, mmWave RADAR, CMOS sensors (Sony Exmor), Thermal microbolometers, IMUs (6-DOF / 9-DOF gyros & accelerometers).
2. **Biomedical & Neural Telemetry**: ECG/PPG cardiac sensors, continuous glucose monitors (CGM), intracortical electrode arrays (Utah array, Neuralink N1).
3. **Motion Actuators & Robotics**: Brushless DC (BLDC) motors, Field-Oriented Control (FOC) drivers, harmonic drive gears, hydraulic servo-valves.
4. **Displays & Spatial Interfaces**: MicroLED, QD-OLED, E-Ink Carta, VR pancake optics, Micro-OLED waveguides, piezoelectric haptic drivers.
5. **Power & Thermal Hardware**: Gallium Nitride (GaN) and Silicon Carbide (SiC) FETs, PMICs, liquid-to-air Heat Distribution Units (CDUs), fluorochemical immersion cooling tanks.
6. **Radiation-Hardened Space Electronics**: Silicon-on-Insulator (SOI) chips, BAE RAD750, Vorago rad-tolerant ARM microcontrollers.

---

# PART II: ALL TYPES OF SOFTWARE EXISTING IN THE WORLD

## 5. System Software & Operating Systems

| OS Category | Major Systems | Execution Model & Guarantees |
| :--- | :--- | :--- |
| **Desktop & Server OS** | • **Linux**: Ubuntu, Debian, RHEL, Fedora, Arch, Alpine, NixOS<br>• **Windows NT**: Windows 11, Windows Server 2022/2025<br>• **Darwin/macOS**: macOS Sequoia, Sonoma<br>• **BSDs**: FreeBSD, OpenBSD, NetBSD, DragonFly BSD | Preemptive multitasking, virtual memory paging, POSIX / Win32 APIs, multi-user privilege rings. |
| **Real-Time OS (RTOS)** | • **FreeRTOS**: Microcontroller IoT deployments<br>• **VxWorks**: Aerospace, defense, space exploration<br>• **QNX Neutrino**: Automotive cockpits, safety-critical medical devices<br>• **Zephyr RTOS**: Modular Linux Foundation open-source RTOS | Deterministic task scheduling, bounded interrupt latency, priority inversion mitigation (ceiling protocols). |
| **Hypervisors & VMMs** | • **Type 1 (Bare-Metal)**: KVM, VMware ESXi, Xen, Microsoft Hyper-V<br>• **Type 2 (Hosted)**: QEMU, VirtualBox, VMware Workstation<br>• **MicroVMs**: AWS Firecracker, Cloud-Hypervisor | Hardware-assisted virtualization (Intel VT-x/VT-d, AMD-V), isolated virtual memory partitions. |
| **Microkernels & Verified Kernels** | • **seL4**: Mathematically verified microkernel with formal proofs<br>• **Google Fuchsia (Zircon)**: Capability-based object microkernel<br>• **Redox OS**: Rust-based microkernel with URL-based schemes | Minimalist kernel space ($<10\text{k}$ lines of code), drivers run in isolated user space, capability tokens. |
| **Mobile & Spatial OS** | • **Android / AOSP**: Linux kernel + ART virtual machine<br>• **Apple iOS / iPadOS / watchOS / visionOS** | Sandboxed application lifecycles, touch and spatial eye/gesture pipelines, hardware-enforced privacy. |
| **Mainframe & HPC OS** | • **IBM z/OS**: High-throughput transaction banking<br>• **Cray Linux Environment (CLE)**: Supercomputer clusters | Massive I/O channel subsystems, non-stop fault tolerance, parallel cluster scheduling. |
| **Bootloaders & Firmware** | • **UEFI / TianoCore**, Coreboot, Libreboot<br>• **Embedded Bootloaders**: Das U-Boot, OpenSBI (RISC-V) | Hardware initialization, memory training, ACPI tables, cryptographically verified Secure Boot. |

---

## 6. Compilers, Languages & Virtual Machines

1. **Ahead-of-Time (AOT) Compilers**:
   - **GCC & Clang/LLVM**: Multi-language, SSA-based modular optimization backends for C, C++, Swift, Fortran.
   - **Rustc**: Affine borrow-checking compiler targeting LLVM IR.
   - **GHC (Glasgow Haskell Compiler)**: Pure functional lazy evaluation compiler lowering to STG machine.
   - **Rubix Compiler**: Self-hosted zero-runtime native synthesizer emitting ELF, PE, Mach-O, and WASI directly.
2. **Just-in-Time (JIT) Runtimes & Interpreters**:
   - **JVM**: HotSpot, GraalVM (JIT-compiling Java bytecode to optimized native machine code).
   - **JavaScript Engines**: V8 (Chrome/Node.js), SpiderMonkey (Firefox), JavaScriptCore (Safari).
   - **CLR (.NET)**: Common Language Runtime JIT for C#, F#.
   - **CPython**: Reference interpreter with Global Interpreter Lock (GIL) and optional PEP 703 free-threading.
3. **Bytecode Virtual Machines & Sandboxes**:
   - **WebAssembly (WASM)**: Wasmtime, WasmEdge, Wasmer (sandboxed capability-isolated bytecode).
   - **BEAM VM**: Erlang/Elixir lightweight actor virtual machine with preemptive reduction scheduling.
   - **EVM**: Ethereum Virtual Machine (deterministic blockchain state execution).
4. **Domain & Shading Compilers**:
   - **NVCC (Nvidia CUDA Compiler)**: Compiles high-level C++ CUDA kernels to PTX intermediate and SASS machine code.
   - **Shader Toolchains**: DXC (DirectX Shader Compiler), glslang (Vulkan SPIR-V emission).
   - **ML Compilers**: MLIR (Multi-Level Intermediate Representation), Halide (image processing pipeline scheduler).

---

## 7. Data Systems & Databases

1. **Relational Database Management Systems (RDBMS)**:
   - PostgreSQL (ACID compliant, extensible catalog, rich JSON/vector extensions), MySQL, MariaDB, SQLite.
   - Commercial: Oracle Database, Microsoft SQL Server, IBM Db2.
2. **Document & Key-Value NoSQL Stores**:
   - Document: MongoDB, Couchbase, AWS DocumentDB.
   - In-Memory Key-Value: Redis, KeyDB, Dragonfly, Memcached.
   - Embedded High-Throughput Key-Value: RocksDB (LSM-tree), LevelDB, LMDB (B+ tree).
3. **Wide-Column & Distributed Tabular**:
   - Apache Cassandra, ScyllaDB, Apache HBase, Google Cloud Bigtable.
4. **Analytical OLAP & Columnar Engines**:
   - Embedded Columnar: DuckDB (vectorized in-process analytics).
   - Real-Time Distributed: ClickHouse, Apache Doris, StarRocks.
   - Cloud Warehouses: Snowflake, Google BigQuery, AWS Redshift, Databricks Lakehouse.
5. **Vector Databases (AI Search & Embeddings)**:
   - Dedicated: Milvus, Qdrant, Pinecone, Chroma, Weaviate, pgvector.
6. **Graph, Time-Series & NewSQL**:
   - Graph: Neo4j (Cypher), Amazon Neptune, Memgraph.
   - Time-Series: InfluxDB, TimescaleDB, QuestDB, Prometheus TSDB.
   - Globally Distributed NewSQL: CockroachDB (Raft multi-range), Google Spanner (TrueTime atomic clocks), YugabyteDB.

---

## 8. Networking, Middleware & Distributed Systems

1. **RPC & Serialization**: gRPC (HTTP/2 + Protocol Buffers), Cap'n Proto (zero-copy serialization), Apache Thrift, FlatBuffers.
2. **Event Streaming & Message Brokers**: Apache Kafka (distributed commit log), Apache Pulsar, RabbitMQ (AMQP), NATS.io, ZeroMQ, MQTT (Mosquitto).
3. **Distributed Coordination & Consensus**: etcd (Raft key-value consensus powering Kubernetes), HashiCorp Consul, Apache ZooKeeper.
4. **Container Orchestration**: Kubernetes (k8s control plane, kubelet), HashiCorp Nomad, Docker Engine, containerd, Podman, CRI-O.
5. **Ingress, Proxies & Gateways**: Envoy Proxy, Nginx, HAProxy, Caddy, Cloudflare Pingora (Rust-based proxy).
6. **Software-Defined Networking & Observability**: Cilium (eBPF-based service mesh and firewall), Open vSwitch (OVS), DPDK, BIRD Internet Routing Daemon.

---

## 9. Artificial Intelligence & Scientific Software

1. **Deep Learning Frameworks**: PyTorch (Dynamic eager graph execution, TorchDynamo compiler), Google JAX (composable functional autodiff), TensorFlow.
2. **Inference Engines & Serving Frameworks**:
   - **vLLM**: High-throughput LLM serving via PagedAttention and continuous batching.
   - **TensorRT / TensorRT-LLM**: Nvidia hardware-specialized kernel graph optimizer.
   - **Triton Compiler**: OpenAI GPU kernel programming language.
   - **ONNX Runtime**: Cross-platform open neural network exchange runtime.
   - **llama.cpp / GGML**: Quantized (GGUF) pure C/C++ cross-platform inference engine.
3. **Scientific & Numerical Computing**:
   - NumPy, SciPy, Julia language (multiple dispatch scientific ecosystem), MATLAB, GNU Octave.
   - Computational Fluid Dynamics: OpenFOAM.
   - Finite Element Analysis: ANSYS, COMSOL Multiphysics, Abaqus.
   - Molecular Dynamics: GROMACS, LAMMPS, NAMD.
4. **Autonomous Agent & Orchestration Frameworks**: LangChain, AutoGen, CrewAI, LlamaIndex.

---

## 10. Cybersecurity, Enterprise & Creative Software

1. **Cybersecurity & Threat Defense**:
   - Endpoint Detection & Response (EDR): CrowdStrike Falcon, SentinelOne, Microsoft Defender for Endpoint.
   - Security Information & Event Management (SIEM): Splunk, Elastic Security, IBM QRadar.
   - Cryptographic Libraries & Secure VPNs: OpenSSL 3.x, BoringSSL, WireGuard kernel module, IPsec.
2. **Enterprise Business Platforms**:
   - ERP: SAP S/4HANA, Oracle NetSuite.
   - CRM: Salesforce, Microsoft Dynamics 365.
   - Banking & Financial Cores: Temenos Transact, Infosys Finacle, SWIFT Alliance Access.
3. **Creative, CAD & Simulation Engines**:
   - Real-Time 3D Engines: Unreal Engine 5 (Nanite, Lumen), Unity, Godot.
   - CAD & CAM: Dassault CATIA / SolidWorks, Autodesk AutoCAD / Fusion 360, Blender 3D.
   - Electronic Design Automation (EDA): Synopsys Custom Compiler, Cadence Virtuoso, KiCad.
4. **High-Frequency Trading (HFT) Systems**:
   - Low-latency order matching engines (LMAX Disruptor pattern, kernel-bypass Solarflare Onload).
   - Financial Information eXchange (FIX protocol engines).
5. **Developer Tooling & DevOps**:
   - IDEs: VS Code, Neovim, JetBrains IntelliJ / CLion / PyCharm.
   - Version Control: Git, Jujutsu (jj), Mercurial.
   - CI/CD & Observability: GitHub Actions, GitLab CI, Jenkins, Prometheus, Grafana, OpenTelemetry.
================================================================================
