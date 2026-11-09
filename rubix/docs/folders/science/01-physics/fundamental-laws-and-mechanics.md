# FUNDAMENTAL LAWS, MECHANICS & CONSERVATION THEOREMS
## Classical Dynamics, Celestial Laws, Analytical Mechanics and Noether's Symmetry Foundations

> **Classification**: Pure Theoretical Physics  
> **Scope**: Newtonian Mechanics, Celestial Orbits, Lagrangian & Hamiltonian Formulations, and the Mathematical Symmetry Origins of Physical Laws  

---

## 1. Classical Mechanics: The Foundation of Physical Dynamics

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                      THE ARCHITECTURE OF CLASSICAL DYNAMICS                                   |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| Formulation              | Mathematical Framework             | Core Principle / Equation                     |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| 1. Newtonian Dynamics    | Vector forces in Cartesian space   | F = dp/dt = m · a                             |
| 2. Universal Gravitation | Inverse-square central force field | F = G · (m₁ · m₂) / r²                        |
| 3. Keplerian Motion      | Orbital geometry & periods         | T² ∝ a³ (Elliptical Orbits)                   |
| 4. Lagrangian Mechanics  | Configuration space generalized q  | d/dt(∂L/∂q̇) - ∂L/∂q = 0 (Principle of Action)|
| 5. Hamiltonian Mechanics | Phase space (q, p) symplectic flow | q̇ = ∂H/∂p,  ṗ = -∂H/∂q (Energy conservation) |
| 6. Noether's Theorem     | Continuous Lie group symmetries    | Symmetry under transformation = Conserved Q   |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
```

### 1.1 Isaac Newton's Three Laws of Motion (1687, *Principia Mathematica*)
1. **First Law (Law of Inertia)**: An object at rest remains at rest, and an object in uniform motion remains in motion with constant velocity, unless acted upon by a non-zero net external force:
   $$\sum \mathbf{F} = 0 \iff \frac{d\mathbf{v}}{dt} = 0$$
2. **Second Law (Fundamental Law of Dynamics)**: The rate of change of momentum of a body is directly proportional to the net applied force and acts in the direction of the applied force:
   $$\mathbf{F}_{\text{net}} = \frac{d\mathbf{p}}{dt} = \frac{d(m\mathbf{v})}{dt} = m \mathbf{a} \quad (\text{for constant mass } m)$$
3. **Third Law (Action and Reaction)**: When body A exerts a force on body B, body B simultaneously exerts an equal and opposite force on body A:
   $$\mathbf{F}_{A \to B} = -\mathbf{F}_{B \to A}$$

### 1.2 Universal Gravitation and Kepler's Laws
- **Newton's Law of Universal Gravitation**:
  $$\mathbf{F}_g = -G \frac{m_1 m_2}{r^2} \hat{\mathbf{r}}$$
  Where $G = 6.67430(15) \times 10^{-11}\text{ N}\cdot\text{m}^2/\text{kg}^2$.
- **Johannes Kepler's Laws of Planetary Motion (1609–1619)**:
  1. *First Law (The Law of Ellipses)*: All planets orbit the Sun in elliptical paths, with the Sun situated at one of the two foci.
  2. *Second Law (The Law of Equal Areas)*: A line segment joining a planet and the Sun sweeps out equal areas during equal intervals of time ($dA/dt = \text{constant}$), direct consequence of **conservation of angular momentum**.
  3. *Third Law (The Law of Harmonies)*: The square of the orbital period $T$ of a planet is directly proportional to the cube of the semi-major axis $a$ of its orbit:
     $$T^2 = \frac{4\pi^2}{G(M + m)} a^3 \approx \frac{4\pi^2}{GM_{\odot}} a^3$$

---

## 2. Analytical Mechanics: Lagrangian & Hamiltonian Formulations

### 2.1 The Principle of Least Action (Hamilton's Principle)
Nature is profoundly economical. A physical particle moving between two points in space from time $t_1$ to $t_2$ does not take an arbitrary trajectory; it follows the path that makes the **Action Integral** $S$ stationary ($\delta S = 0$):
$$S = \int_{t_1}^{t_2} \mathcal{L}(q, \dot{q}, t) \, dt$$
Where $\mathcal{L} = T - V$ is the **Lagrangian** (Kinetic Energy $T$ minus Potential Energy $V$).

### 2.2 The Euler-Lagrange Equations
Demanding $\delta S = 0$ leads directly to the fundamental equations of motion in generalized coordinates:
$$\frac{d}{dt} \left( \frac{\partial \mathcal{L}}{\partial \dot{q}_i} \right) - \frac{\partial \mathcal{L}}{\partial q_i} = 0$$
- Allows solving complex mechanical problems (pendulums, double pendulums, robotic arms) without decomposing vector constraint forces.

### 2.3 Hamiltonian Mechanics and Phase Space
Introduced by William Rowan Hamilton in 1833. Replaces generalized velocities $\dot{q}_i$ with **generalized conjugate momenta** $p_i = \frac{\partial \mathcal{L}}{\partial \dot{q}_i}$.
- The **Hamiltonian** represents total energy: $\mathcal{H}(q, p, t) = T + V = \sum p_i \dot{q}_i - \mathcal{L}$.
- **Hamilton's Canonical Equations**:
  $$\dot{q}_i = \frac{\partial \mathcal{H}}{\partial p_i}, \quad \dot{p}_i = -\frac{\partial \mathcal{H}}{\partial q_i}$$
- Describes motion as a deterministic vector flow across a 6N-dimensional **Phase Space**, laying the direct mathematical groundwork for statistical mechanics and the Schrödinger equation in quantum mechanics.

---

## 3. Emmy Noether's Theorem (1915): Symmetries Dictate Physical Laws

In 1915, mathematician Emmy Noether proved the deepest theorem in theoretical physics:
> **Every continuous, differentiable symmetry of the action of a physical system has a corresponding conserved quantity.**

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                         NOETHER'S SYMMETRY-CONSERVATION MAP                                   |
+──────────────────────────────────────────────+────────────────────────────────────────────────────────────────+
| Continuous Symmetry of Spacetime / Field     | Conserved Physical Law                                         |
+──────────────────────────────────────────────+────────────────────────────────────────────────────────────────+
| 1. Time Translation Invariance (t -> t + dt) | Law of Conservation of Energy (Energy cannot be created/destr.)|
| 2. Space Translation Invariance (x -> x + dx)| Law of Conservation of Linear Momentum (Total p is constant)   |
| 3. Rotational Invariance (θ -> θ + dθ)       | Law of Conservation of Angular Momentum (Total L is constant)  |
| 4. Global U(1) Gauge Phase Symmetry in QED   | Law of Conservation of Electric Charge                         |
| 5. Global SU(2) Flavor Symmetry              | Law of Conservation of Weak Isospin                            |
| 6. Global SU(3) Color Symmetry               | Law of Conservation of Color Charge                            |
+──────────────────────────────────────────────+────────────────────────────────────────────────────────────────+
```

Noether’s theorem explains **WHY** physical laws exist:
- Energy is conserved not by arbitrary fiat, but because the laws of physics are **identical today as they were yesterday** (time translation symmetry).
- Momentum is conserved because the laws of physics are **identical here as they are in the Andromeda Galaxy** (space translation symmetry).
- Angular momentum is conserved because the laws of physics do not care which direction you orient your experiment (rotational symmetry).
- If spacetime expands non-statically (as in the accelerating universe of General Relativity), time-translation symmetry is broken on cosmological scales, explaining why cosmological photon wavelengths stretch (redshift), decreasing photon energy.
