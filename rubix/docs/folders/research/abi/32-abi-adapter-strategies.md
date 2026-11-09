# Zero-Cost Adapter Synthesis Strategies

## 1. Taxonomy of Adapter Architectures

When two software components speak different binary conventions, an **adapter** must mediate the call. How this adapter is constructed dictates the performance and security profile of the system:

```
+-------------------------------------------------------------------------------+
|                         Comparison of Adapter Architectures                   |
+-------------------+-------------------+-------------------+-------------------+
| Approach          | Mechanism         | Latency Overhead  | Security Profile  |
+-------------------+-------------------+-------------------+-------------------+
| **Interpreted**   | Runtime loop over | **40–120 cycles** | High risk; buffer |
| (e.g. libffi)     | type descriptors  | (15–35 ns)        | overflows in stubs|
+-------------------+-------------------+-------------------+-------------------+
| **JIT Trampoline**| Allocates W+X     | **10,000+ cycles**| Severe W^X risk;  |
| (DynamicCodeGen)  | memory at runtime | (first call)      | blocked on iOS/NX |
+-------------------+-------------------+-------------------+-------------------+
| **AOT Specialized**| Emits fixed static| **2–4 cycles**    | Safe; static text |
| **Machine Stub**  | register shuffles | (sub-nanosecond)  | section only      |
+-------------------+-------------------+-------------------+-------------------+
| **Rubix Zero-Cost**| **Statically inlined| **0 cycles**      | Safe; direct      |
| **Elimination**   | & eliminated**    | **(Direct Call)** | native machine code|
+-------------------+-------------------+-------------------+-------------------+
```

---

## 2. Mathematical Formalization of Adapter Synthesis

Let $\mathcal{C}_{\text{caller}}$ and $\mathcal{C}_{\text{callee}}$ be the calling conventions of the caller and callee respectively:
$$\mathcal{C} = \langle \mathcal{R}_{\text{args}}, \mathcal{R}_{\text{ret}}, \mathcal{S}_{\text{align}}, \mathcal{S}_{\text{shadow}} \rangle$$

Where:
- $\mathcal{R}_{\text{args}} = [r_0, r_1, \dots, r_{k-1}]$ is the ordered sequence of physical argument registers.
- $\mathcal{R}_{\text{ret}}$ is the return value register.
- $\mathcal{S}_{\text{align}}$ is the mandatory stack alignment at call entry (typically 16 bytes).
- $\mathcal{S}_{\text{shadow}}$ is the mandatory caller shadow space allocation (0 or 32 bytes).

### 2.1. The Adapter Transformation Function
The synthesized adapter $\mathcal{A}(\mathcal{C}_{\text{caller}} \to \mathcal{C}_{\text{callee}})$ produces a sequence of register movements and stack frame adjustments:
1. **Frame Setup**:
   $$\Delta_{\text{stack}} = \text{AlignUp}(\mathcal{S}_{\text{shadow}} + \text{StackArgs}(\mathcal{C}_{\text{callee}}), \mathcal{S}_{\text{align}})$$
   $$\text{Emit: } \texttt{sub rsp, } \Delta_{\text{stack}}$$
2. **Register Permutation**:
   For each argument index $i \in [0, k-1]$:
   $$\text{Emit: } \texttt{mov } \mathcal{R}_{\text{callee}}[i], \mathcal{R}_{\text{caller}}[i]$$
   *(If cycles exist in register mappings, temporary scratch registers are used to break the cycle)*.
3. **Target Invocation**:
   $$\text{Emit: } \texttt{call } \text{target\_func}$$
4. **Frame Teardown & Return**:
   $$\text{Emit: } \texttt{add rsp, } \Delta_{\text{stack}}$$
   $$\text{Emit: } \texttt{ret}$$

---

## 3. The Zero-Cost Elimination Theorem

### Theorem (Zero-Cost Adapter Elimination):
If the caller convention and callee convention are equivalent under the target register mapping:
$$\mathcal{C}_{\text{caller}} \equiv \mathcal{C}_{\text{callee}}$$
Then the adapter $\mathcal{A}(\mathcal{C}_{\text{caller}} \to \mathcal{C}_{\text{callee}})$ is the identity transformation:
$$\mathcal{A}(\mathcal{C} \to \mathcal{C}) = \text{Id}$$
And the compiler rewrites the call site directly:
$$\text{Call Site} \Longrightarrow \texttt{call rel32 target\_func}$$
**Result**: The adapter is completely eliminated. Zero instructions, zero stack frame adjustments, and zero cycle overhead are introduced.
