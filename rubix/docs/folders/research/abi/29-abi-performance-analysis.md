# ABI Microarchitectural Performance Analysis

## 1. Hardware Cost of Call Invocations

At the CPU pipeline level, a function call is not a single abstract operation. It interacts with:
1. **Branch Predictor & Branch Target Buffer (BTB)**: Predicting whether a branch occurs and target address.
2. **Return Address Stack (RAS)**: A hardware circular buffer (typically 16–32 entries) predicting `RET` instruction targets.
3. **Store-Forwarding Buffers**: Forwarding stored stack arguments directly to subsequent loads in the callee.
4. **Register Renaming & Out-of-Order Execution**: Register alias tables (RAT) mapping architectural registers to physical registers.

```
+-------------------------------------------------------------------------------+
|                       Microarchitectural Latency Breakdown                    |
+-----------------------------+-------------------+-----------------------------+
| Call Invocation Mechanism   | CPU Cycles        | Microarchitectural Hazard   |
+-----------------------------+-------------------+-----------------------------+
| **Direct Call (`call rel32`)**| **1 cycle**     | None; 100% BTB prediction   |
+-----------------------------+-------------------+-----------------------------+
| **Indirect Call (`call *reg`)**| **2 – 3 cycles** | Stresses Indirect Predictor |
+-----------------------------+-------------------+-----------------------------+
| **Indirect Mispredict**     | **15 – 22 cycles**| Full CPU pipeline flush     |
+-----------------------------+-------------------+-----------------------------+
| **Stack Argument Spill/Reload**| **4 – 6 cycles**| Store-to-load forwarding    |
+-----------------------------+-------------------+-----------------------------+
| **Dynamic Dispatch (libffi)**| **40 – 90 cycles**| Multiple indirect branches, |
|                             |                   | heap lookup, memory copies  |
+-----------------------------+-------------------+-----------------------------+
```

---

## 2. Direct Calls vs. Adapters vs. Dynamic Dispatch

### 2.1. The Direct Native Path (`call rel32`)
- The instruction encodes a 32-bit relative displacement: `E8 <disp32>`.
- The BTB identifies the static target instantly during the instruction fetch stage.
- Zero register shuffling; arguments reside directly in the target registers.
- **This is the Rubix standard for all internal calls and known-compatible external calls.**

### 2.2. The Specialized Machine Adapter Path
- When crossing between distinct conventions (e.g., System V to Microsoft x64):
  - 2 to 4 register `MOV` instructions to permute argument registers.
  - 1 `SUB RSP, 32` to reserve shadow space.
  - 1 direct `CALL`.
  - 1 `ADD RSP, 32` to clean up.
- **Microarchitectural Cost**: ~3 to 5 CPU cycles total.
- **Crucial Advantage**: All branches are direct and static; BTB predictions remain 100% accurate; zero memory allocation.

### 2.3. The Catastrophic Cost of Generic Dynamic Dispatch (e.g. `libffi`)
Frameworks that interpret ABIs dynamically at runtime (e.g. Python `ctypes`, JNI, generic FFI layers):
1. Must allocate an argument description array on the heap.
2. Must interpret a type descriptor switch statement in a loop.
3. Must marshal arguments through a generic memory buffer.
4. Must invoke a generic assembly stub that reads buffer offsets into registers.
- **Measured Latency**: **15 to 35 nanoseconds (60 to 140 CPU cycles)** per function call!

---

## 3. Register Pressure and Calling Convention Optimization

The choice of calling convention directly impacts register allocation:
- **Too Few Argument Registers (x86 32-bit, Win64)**: Forces arguments onto the stack, generating memory bus traffic and increasing cache pressure.
- **Too Many Argument Registers (Go ABIInternal 9 regs)**: May starve the callee of scratch registers, forcing the callee to immediately spill arguments in its prologue.
- **The Sweet Spot**: 6 to 8 argument registers (System V AMD64: 6; ARM AAPCS64: 8; RISC-V psABI: 8). Over 95% of real-world functions have $\le 6$ parameters, allowing 95%+ of calls to execute without a single stack memory access.
