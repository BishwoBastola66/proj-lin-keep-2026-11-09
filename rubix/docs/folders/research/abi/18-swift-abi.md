# Swift Library Evolution and Resilient Value Witnesses

## 1. The Apple OS Challenge: System Framework Distribution

In Apple's ecosystem (iOS, macOS, watchOS), system frameworks (Foundation, UIKit, SwiftUI) are baked directly into the operating system image in flash memory.
- An application compiled in 2020 on iOS 14 must run unmodified on iOS 18 in 2024.
- In each OS release, Apple engineers add new fields, classes, and methods to system frameworks.
- If Swift had frozen its struct layouts like C++, Apple could never add a single field to any public struct.
- If Swift had refused ABI stability like Rust, every app would have to statically bundle the entire OS runtime, wasting gigabytes of storage and memory.

This challenge led to **Swift Library Evolution** (introduced in Swift 5).

---

## 2. Resilient vs. Frozen Types

Swift divides types into two distinct ABI categories:

```
+-----------------------------------------------------------------------------------+
|                        Swift Library Evolution Categories                         |
+-----------------------------+-----------------------------------------------------+
| Type Classification         | ABI & Performance Characteristics                   |
+-----------------------------+-----------------------------------------------------+
| **Frozen (`@frozen`)**      | - Layout permanently fixed at compile time          |
|                             | - Compiler hardcodes field offsets (`[RDI + 16]`)   |
|                             | - Can be allocated directly on the stack with `sub` |
|                             | - Peak native performance                           |
|                             | - Cannot add, remove, or reorder fields in updates  |
+-----------------------------+-----------------------------------------------------+
| **Resilient (Default)**     | - Layout is NOT known at compile time               |
|                             | - Compiler CANNOT hardcode struct size or offsets   |
|                             | - Size, alignment, and stride queried at runtime    |
|                             | - Libraries can add private fields freely in updates|
|                             | - Noticeable runtime indirection penalty            |
+-----------------------------+-----------------------------------------------------+
```

---

## 3. The Mechanics of Resilient Value Witnesses

When a Swift function manipulates a resilient struct `ResilientStruct`:
1. **Value Witness Table (VWT)**: The runtime generates a VWT containing:
   - Size of the type in bytes
   - Alignment requirement
   - Function pointers for:
     - `initializeWithCopy(dest, src)`
     - `destroy(value)`
     - `assignWithCopy(dest, src)`
2. **Dynamic Stack Frame Allocation**:
   Because the compiler does not know how many bytes `ResilientStruct` requires, it cannot emit a fixed `sub rsp, 64` in the function prologue.
   Instead, it must dynamically query the VWT at runtime and adjust `RSP` dynamically (equivalent to `alloca`).
3. **Indirect Field Access**:
   Accessing field `bar` cannot be a direct memory offset. The machine code must load the field offset from an exported **Field Offset Vector**:
   ```text
   mov rax, [rip + _offset_for_field_bar]  ; Load offset dynamically from metadata
   mov rbx, [rdi + rax]                    ; Access field at dynamic offset
   ```

---

## 4. The Performance Cost of Runtime Resilience

Extensive benchmarking in the Swift compiler project demonstrated the significant cost of purely runtime representation resilience:
- Accessing fields in resilient structs is **15% to 40% slower** than accessing frozen structs.
- Dynamic stack allocation prevents the compiler from optimizing frame layouts and breaks scalar replacement of aggregates (SRA).
- Inlining is completely inhibited across resilient library boundaries unless `@inlinable` is explicitly opted into (which freezes the implementation and cancels resilience!).

---

## 5. Architectural Evaluation for Rubix

Swift's library evolution model proves that:
1. **Physical Representation Flexibility Is Achievable**: Software can evolve across OS generations without recompilation.
2. **Pure Runtime Resolution Is Too Expensive**: Placing offset lookups and dynamic stack allocation in the hot execution path incurs a permanent performance penalty.
3. **The Rubix Advantage**: Rubix achieves resilience without dynamic indirection by generating **compile-time and link-time specialized adapters**. When the interface is compatible, Rubix collapses the boundary to direct native offsets, eliminating the 40% runtime tax while retaining safe evolution.
