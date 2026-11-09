# Equality Saturation, E-Graphs, and Phase-Ordering Elimination

## 1. Introduction: Destructive Rewriting vs. Equality Saturation

In standard optimizing compilers, intermediate representation transformations are **destructive**:
$$\text{Expression } E_1 \overset{\text{Rule } R}{\Longrightarrow} \text{Expression } E_2$$
Once $E_1$ is rewritten into $E_2$, $E_1$ is erased from memory. If a subsequent optimization rule $R'$ could have matched on $E_1$ to produce a vastly superior sequence $E_3$, that opportunity is permanently lost. This is the root cause of the **Phase Ordering Problem**.

**Equality Saturation** (Tate et al., 2009; Willsey et al., `egg`, 2021–2026) eliminates destructive rewriting by representing all equivalent programs simultaneously inside an **Equivalence Graph (E-Graph)**.

---

## 2. Theoretical Structure of an E-Graph

An E-Graph $\mathcal{G} = (\mathcal{C}, \mathcal{N})$ consists of:
* **E-Classes ($\mathcal{C}$)**: Equivalence sets representing mathematically equivalent values.
* **E-Nodes ($\mathcal{N}$)**: Operator nodes whose arguments are E-Class IDs rather than literal values.

```text
Example: Multiplying (x * 2) / 2

             [E-Class 1] (x)
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
  [E-Class 2] (2)         [E-Class 3] (x * 2)
      │                       │
      └───────────┬───────────┘
                  ▼
              [E-Class 4] ((x * 2) / 2) ≡ [E-Class 1] (x)
```

### 2.1 Non-Destructive Rewriting
When an algebraic rule applies (e.g., $(a \cdot b) / b \implies a$):
1. The compiler does not delete $(x \cdot 2) / 2$.
2. It unions E-Class 4 with E-Class 1.
3. Both expressions now inhabit the same equivalence class.

---

## 3. Cost-Guided Extraction

Once an E-Graph reaches saturation (no new equivalence rules apply) or hits an iteration budget limit:
1. An **Extraction Cost Model** evaluates every e-node in the graph using target hardware costs:
   $$\mathbf{Cost}(e) = \mathbf{OpCost}(e.\text{op}) + \sum_{c \in e.\text{children}} \min_{n \in c} \mathbf{Cost}(n)$$
2. A single extraction pass extracts the provably optimal expression sequence for the target ISA.

---

## 4. The Rubix Bounded E-Graph Engine

E-Graphs can suffer from exponential node explosion if unconstrained associativity and commutativity rules are applied to large basic blocks.

Rubix implements **Bounded Equality Saturation**:
1. **Isolated Expression Subtrees**: E-Graphs are applied strictly to pure arithmetic, bitwise, and address calculation subgraphs.
2. **Effect Barrier**: Effectful operations (`effect(io)`, `effect(syscall)`) act as strict boundary walls, preventing uncontrolled graph expansion.
3. **Hardware-Tuned Cost Function**: The extraction function evaluates target CPU execution port contention and uop latency directly from **RUMS** machine models.
