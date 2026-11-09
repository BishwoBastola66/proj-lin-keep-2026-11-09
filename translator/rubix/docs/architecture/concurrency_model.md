# Rubix Next Concurrency & Parallel Execution Model

> **Structured Message Passing, Capability-Governed CSP Channels, and Effect-Isolated Task Pipelines**
> *Specification Version 2.0.0-Next*

---

## 1. The Core Concurrency Axiom

Rubix Next rejects shared-memory multithreading with manual locks (mutexes, semaphores, condition variables) as fundamentally unsafe and error-prone.

> **"Do not communicate by sharing memory; instead, share memory by communicating."** — *Tony Hoare / Rob Pike*

Rubix Next elevates this principle by enforcing **Zero Shared Mutable State** at compile time through the affine type system and algebraic effect isolation.

```text
CONVENTIONAL THREADING                     RUBIX NEXT STRUCTURED CONCURRENCY
┌──────────────────────────────┐          ┌──────────────┐      ┌──────────────┐
│ Thread A         Thread B    │          │  Task Alpha  │      │   Task Beta  │
│    │                │        │          │ (Isolated)   │      │  (Isolated)  │
│    ▼                ▼        │          └──────┬───────┘      └──────▲───────┘
│ [ Shared Mutable Memory ]    │                 │                     │
│    ▲                ▲        │                 │   [ CSP Channel ]   │
│  Mutex           Data Race   │                 └─── Ownership Move ──┘
│ (Deadlock Risk)  (Undefined) │               (Zero Copy, Data-Race Free)
└──────────────────────────────┘
```

---

## 2. Structured Concurrency Scopes

In Rubix Next, concurrent tasks cannot outlive their enclosing lexical scope. This eliminates orphan background threads, resource leaks, and unhandled panics.

### Lexical Task Nurseries
```rubix
nursery n {
    n.spawn(worker_task_a);
    n.spawn(worker_task_b);
} # The nursery guarantees all spawned tasks complete or cancel before scope exits!
```

### Invariants of Task Nurseries
1. **Bounded Lifetimes**: Every spawned task is bound to the nursery lifetime.
2. **Deterministic Cancellation**: If any task in a nursery fails or aborts, all sibling tasks are automatically signaled to cancel.
3. **Zero Orphan Tasks**: Execution cannot exit the nursery scope until all tasks have terminated and released their resources.

---

## 3. Capability-Governed CSP Channels

Communication between concurrent tasks occurs exclusively through typed, capability-governed channels:

```rubix
struct Channel<T> {
    buffer: ptr,
    capacity: i64,
    head: i64,
    tail: i64,
    count: i64
}
```

### Channel Invariants
1. **Ownership Transfer Across Boundaries**:
   When a task sends an affine resource $R$ across a channel (`chan_send(ch, move r)`), ownership of $R$ transfers instantaneously to the receiver.
   The sender variable enters the `MOVED` state and cannot be accessed again.
   This guarantees **Data-Race Freedom without copying**: memory is transferred in zero cycles with zero cache coherency storms!
2. **Synchronous & Asynchronous Buffering**:
   - Rendezvous channels (`capacity = 0`): Sender blocks until receiver arrives.
   - Bounded FIFO channels (`capacity = N`): Bounded queue preventing unbounded memory allocation.
3. **Exhaustion & Closure Semantics**:
   Closing a channel prevents further sends; receivers drain remaining messages deterministically.

---

## 4. Effect-Directed Parallelism

Because the Rubix Next compiler statically tracks function effects via bitmask lattices, the optimizer can automatically parallelize independent operations without developer intervention:

### Pure Expression Independence Theorem
For two expressions $e_1$ and $e_2$:
$$\text{Eff}(e_1) == \text{EFFECT\_PURE} \quad \land \quad \text{Eff}(e_2) == \text{EFFECT\_PURE}$$
$$\implies \text{Order}(e_1, e_2) \text{ is commute-equivalent}$$

Therefore, `let a = pure_calc_a(); let b = pure_calc_b();` can be parallelized across separate CPU SIMD lanes or worker threads with **provably zero data-race hazard**.

---

## 5. Heterogeneous Execution & Accelerators

Rubix Next's concurrency architecture extends seamlessly from CPU cores to hardware accelerators (GPUs, NPUs, DSPs):
1. **CPU Tasks**: Lightweight green tasks scheduled across physical OS worker threads.
2. **SIMD Vector Execution**: Auto-vectorized arithmetic loops running across 128-bit, 256-bit (AVX2), or 512-bit (AVX-512) vector registers via RUMS target synthesis.
3. **Accelerator Streams**: Tasks marked with device capabilities (`CapDevice`) offloaded to asynchronous GPU/NPU command queues with zero host-thread blocking.
