# The Go ABI Transition: From ABI0 to ABIInternal

## 1. The Historical Heritage: Plan 9 Stack ABI (`ABI0`)

From its inception in 2009 until Go 1.17 (2021), Go used a purely **stack-based calling convention** inherited from the Plan 9 C compiler:
- **Zero registers used for parameters**: All function arguments were pushed onto the stack.
- **Zero registers used for returns**: Return values were placed in designated caller stack slots.
- **Why Go did this**:
  1. *Stack Copying Simplicity*: Go goroutines start with small (2KB) stacks. When a stack overflows, the runtime allocates a larger stack and copies the entire call frame. When all arguments and locals reside exclusively in stack memory, the runtime GC and stack copier can inspect and rewrite pointers without tracking CPU registers.
  2. *Compiler Simplicity*: The original gc compiler did not have a complex register allocator; stack-only passing simplified code generation.

---

## 2. The Performance Penalty of Stack Calls

Stack-only argument passing imposes a severe microarchitectural penalty:
- Every function call requires executing `MOV` instructions to write arguments to L1 data cache memory, and the callee immediately executes `MOV` instructions to read them back.
- While L1 cache is fast, store-to-load forwarding buffers on modern CPUs have finite throughput and latency (4–5 cycles).
- Register-to-register passing, in contrast, executes in 0 to 1 cycle with zero memory bus traffic.

---

## 3. The Go 1.17 Revolution: Register-Based `ABIInternal`

In Go 1.17, the Go compiler team introduced **`ABIInternal`**, a register-based calling convention:
- **Integer / Pointer Arguments**: Passed in 9 registers: `RAX`, `RBX`, `RCX`, `RDX`, `RSI`, `RDI`, `R8`, `R9`, `R10`.
- **Floating-Point Arguments**: Passed in 15 registers: `XMM0`–`XMM14`.
- **Return Values**: Returned in the same register sequence.

### The Backward Compatibility Dilemma
Thousands of production Go libraries contained hand-written assembly files (`.s`) written for the stack-based convention (`ABI0`). Switching the compiler directly to registers would break every existing assembly package.

### The Solution: Transparent ABI Wrappers (Trampolines)
The Go compiler invented **transparent ABI wrapper synthesis**:
1. When a Go function compiled under `ABIInternal` calls an assembly function expecting `ABI0`, the compiler synthesizes a small machine trampoline that:
   - Spills the 9 argument registers onto the stack slots expected by `ABI0`.
   - Calls the assembly function.
   - Reloads return values from stack slots into `ABIInternal` return registers.
2. When assembly code calls Go code, the reverse wrapper is executed.
3. **Result**: Zero source code changes required in external assembly; existing code worked seamlessly while native Go-to-Go calls achieved **100% direct register performance**.

```
Native Go Call (Hot Path):
  Caller (ABIInternal) ---> Direct Register Call ---> Callee (ABIInternal)
  [Zero overhead, zero trampoline, pure register passing]

Assembly Call (Boundary Path):
  Caller (ABIInternal) ---> ABI Wrapper Trampoline ---> Assembly (ABI0)
                            - Spills regs to stack
                            - Adjusts frame
                            - Restores on return
```

---

## 4. Measured Performance Impact

By transitioning to `ABIInternal`:
- Go CPU-bound workloads demonstrated an immediate **5% to 15% throughput improvement**.
- Binary code size decreased by ~2% (fewer stack `MOV` instructions emitted across call sites).
- Memory bandwidth consumption dropped significantly due to reduced stack spill traffic.

---

## 5. Lessons for Rubix

Go's successful deployment of `ABIInternal` provides empirical, real-world proof of a core Rubix principle:
1. **Internal Calling Conventions Can Evolve**: Compilers do not need to freeze their internal calling conventions to maintain compatibility with legacy or external code.
2. **Transparent Machine Trampolines Work**: Synthesizing specialized machine adapters at boundaries isolates conversion costs exclusively to the boundary, leaving internal hot paths at peak native speed.
3. **Rubix Generalization**: Rubix takes Go's concept further: while Go only bridges between its own `ABI0` and `ABIInternal`, Rubix's RUMS and Semantic ABI solver can bridge dynamically between System V, Microsoft x64, AAPCS64, RISC-V, and native specialized conventions.
