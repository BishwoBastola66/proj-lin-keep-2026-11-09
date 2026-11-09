# ECONOMIC THEORY, MACROECONOMICS & MATHEMATICAL GAME THEORY
## Classical Foundations, Walrasian General Equilibrium, Keynesian Dynamics, Monetarism, Nash Equilibria, and Mechanism Design

> **Classification**: Pure Economic Sciences & Mathematical Game Theory  
> **Scope**: Price Theory, Macroeconomic Equilibrium, Monetary Velocity, Non-Cooperative Games, Strategic Minimax, and Social Choice Theorems  

---

## 1. Classical & Neoclassical Foundations: The Architecture of Markets

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                  THE EVOLUTION OF ECONOMIC EQUILIBRIUM PARADIGMS                              |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| School of Thought        | Key Pioneers                       | Foundational Principle / Mathematical Model   |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| 1. Classical Political   | Adam Smith (1776),                 | Invisible Hand; Division of Labor;            |
|    Economy               | David Ricardo (1817)               | Comparative Advantage: Production Cost Ratio  |
| 2. Marginalist           | Carl Menger, William Jevons,       | Diminishing Marginal Utility;                 |
|    Revolution            | Léon Walras (1874)                 | Walrasian General Equilibrium: Σ pᵢ·zᵢ(p) = 0 |
| 3. Neoclassical Synthesis| Alfred Marshall (1890)             | Supply-Demand Scissors; Price Elasticity      |
| 4. Keynesian Macro       | John Maynard Keynes (1936)         | Aggregate Demand Failure; Liquidity Preference|
| 5. Monetarist Counter    | Milton Friedman (1968)             | Quantity Theory: M·V = P·Y; Natural Unemploy. |
| 6. Game Theory           | Von Neumann (1944), Nash (1950)    | Strategic Interaction & Nash Equilibrium      |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
```

### 1.1 Classical Foundations: Specialization & Trade
1. **Adam Smith (*The Wealth of Nations*, 1776)**:
   - **Division of Labor**: Pin factory example demonstrates that breaking complex production into specialized repetitive tasks multiplies worker productivity by orders of magnitude.
   - **The "Invisible Hand"**: Uncoordinated self-interested actions of decentralized economic agents optimize social resource allocation through the price mechanism.
2. **David Ricardo (*Principles of Political Economy and Taxation*, 1817)**:
   - **Law of Comparative Advantage**: Nations maximize global output by specializing in goods where their opportunity cost is lowest, even if one nation holds an absolute advantage in every product.
   - If Country A produces cloth at cost $C_A$ and wine at $W_A$, and Country B at $C_B$ and $W_B$, trade is mutually beneficial if:
     $$\frac{C_A}{W_A} \neq \frac{C_B}{W_B}$$

### 1.2 The Marginalist Revolution & Neoclassical Price Theory
In the 1870s, William Stanley Jevons, Carl Menger, and Léon Walras resolved the **Diamond-Water Paradox** (why diamonds cost more than life-sustaining water) by discovering that value is determined not by total utility, but by **marginal utility** ($\frac{dU}{dQ}$):
- **Walras' Law & General Equilibrium**:
  In a closed economy with $k$ markets, the sum of excess demands across all markets must identically equal zero:
  $$\sum_{j=1}^{k} p_j \cdot z_j(p) = 0$$
  Where $p_j$ is the price vector and $z_j(p) = D_j(p) - S_j(p)$ is the excess demand function. If $k-1$ markets are in equilibrium ($z_j = 0$), the $k$-th market must also be in equilibrium.
- **Alfred Marshall: Price Elasticity of Demand**:
  $$\epsilon_d = \frac{\% \Delta Q}{\% \Delta P} = \frac{dQ/Q}{dP/P} = \frac{dQ}{dP} \cdot \frac{P}{Q}$$
  Governs consumer responsiveness: $|\epsilon_d| > 1$ (elastic), $|\epsilon_d| < 1$ (inelastic), $|\epsilon_d| = 1$ (unitary).

---

## 2. Macroeconomic Paradigms: Keynesianism vs. Monetarism

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                 THE KEYNESIAN AGGREGATE DEMAND IDENTITY & MULTIPLIER                         |
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|   Y = C(Y - T) + I(r) + G + NX                                                                                |
|                                                                                                               |
|   Where:                                                                                                      |
|   Y  = Gross Domestic Product (National Output)       I(r) = Private Investment (function of interest rate r) |
|   C  = Consumption (function of disposable income)    G    = Government Expenditure                           |
|   T  = Taxes                                          NX   = Net Exports (Exports - Imports)                  |
|                                                                                                               |
|   Autonomous Spending Multiplier:  k = 1 / (1 - MPC)   [MPC = Marginal Propensity to Consume]                |
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### 2.1 John Maynard Keynes (*The General Theory*, 1936)
Keynes dismantled Say's Law ("supply creates its own demand") during the Great Depression:
- **Price and Wage Stickiness**: Prices and nominal wages do not adjust instantaneously downwards during recessions due to contracts, unions, and psychological resistance.
- **The Liquidity Trap**: When nominal interest rates fall toward zero, people hoard cash rather than investing in bonds. Monetary expansion becomes ineffective, requiring direct **counter-cyclical fiscal intervention** ($\Delta G$).
- **The Multiplier Effect**: An injection of government spending $\Delta G$ produces an expanded change in output $\Delta Y$:
  $$\Delta Y = \left(\frac{1}{1 - \text{MPC}}\right) \Delta G$$
  If $\text{MPC} = 0.8$, each dollar of government spending stimulates $\$5.00$ of total economic activity.

### 2.2 Milton Friedman & The Monetarist Counter-Revolution
1. **The Quantity Theory of Money (Equation of Exchange)**:
   $$M \cdot V = P \cdot Y$$
   Where $M$ is money supply, $V$ is velocity of money, $P$ is price level, and $Y$ is real GDP. Assuming $V$ and $Y$ are stable or determined by real factors in the long run:
   $$\% \Delta P = \% \Delta M \implies \text{"Inflation is always and everywhere a monetary phenomenon."}$$
2. **The Natural Rate Hypothesis & The Phillips Curve**:
   Friedman (1968) and Edmund Phelps proved that the short-run trade-off between inflation and unemployment (the original Phillips Curve) collapses in the long run. Any attempt to hold unemployment below the **NAIRU** (Non-Accelerating Inflation Rate of Unemployment) triggers spiraling hyperinflation as inflation expectations adjust.

---

## 3. Mathematical Game Theory: Strategic Interactions & Equilibria

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    THE CLASSICAL PRISONER'S DILEMMA MATRIX                                    |
+──────────────────────────+──────────────────────────────────────+─────────────────────────────────────────────+
| Player 1 \ Player 2      | Cooperate (Remain Silent)            | Defect (Confess)                            |
+──────────────────────────+──────────────────────────────────────+─────────────────────────────────────────────+
| Cooperate (Silent)       | (-1, -1)   [Pareto Optimal]          | (-10, 0)   [Player 1 Exploited]             |
+──────────────────────────+──────────────────────────────────────+─────────────────────────────────────────────+
| Defect (Confess)         | (0, -10)   [Player 1 Free-rides]     | (-5, -5)   [UNIQUE NASH EQUILIBRIUM]        |
+──────────────────────────+──────────────────────────────────────+─────────────────────────────────────────────+
```

### 3.1 Formal Definition of Nash Equilibrium (John Nash, 1950)
Consider a normal-form game $G = (N, (S_i)_{i \in N}, (u_i)_{i \in N})$ with $N$ players, strategy spaces $S_i$, and payoff functions $u_i$:
A strategy profile $s^* = (s_1^*, s_2^*, \dots, s_n^*) \in S$ is a **Nash Equilibrium** if and only if no player $i$ can unilaterally deviate to increase their expected payoff:
$$u_i(s_i^*, s_{-i}^*) \ge u_i(s_i, s_{-i}^*) \quad \forall s_i \in S_i, \; \forall i \in N$$
Where $s_{-i}^*$ denotes the chosen strategies of all players except player $i$. Nash proved via Kakutani's fixed-point theorem that **every finite game has at least one Nash equilibrium in mixed strategies**.

### 3.2 John von Neumann: The Minimax Theorem (1928)
For any two-player zero-sum game ($u_1(s_1, s_2) + u_2(s_1, s_2) = 0$), there exists a unique game value $V$:
$$\max_{x \in \Delta_1} \min_{y \in \Delta_2} x^T A y = \min_{y \in \Delta_2} \max_{x \in \Delta_1} x^T A y = V$$
The optimal strategy for Player 1 minimizes the maximum damage Player 2 can inflict.

### 3.3 Social Choice Theory: Kenneth Arrow's Impossibility Theorem (1951)
Arrow demonstrated mathematically that no rank-order voting system can convert individual preference rankings into a community-wide ranking while simultaneously satisfying four fair criteria:
1. **Unrestricted Domain**: All individual preference orderings are allowed.
2. **Non-Dictatorship**: No single individual can dictate the aggregate outcome.
3. **Pareto Efficiency**: If every voter prefers alternative $X$ over $Y$, society must prefer $X$ over $Y$.
4. **Independence of Irrelevant Alternatives (IIA)**: The social preference between $X$ and $Y$ depends solely on individual preferences between $X$ and $Y$, independent of third options $Z$.

### 3.4 Mechanism Design & Auction Theory
- **William Vickrey (1961 Nobel)**:
  - **Second-Price Sealed-Bid Auction (Vickrey Auction)**: Bidders submit secret bids. The highest bidder wins, but pays the price of the *second-highest bid*.
  - **Dominant Strategy Truth-Telling**: Bidding one's exact true valuation $v_i$ is a strictly dominant strategy:
    - Bidding higher than $v_i$ risks winning at an unprofitable price ($p > v_i$).
    - Bidding lower than $v_i$ risks losing an auction that would have been profitable without reducing the payment upon winning.
