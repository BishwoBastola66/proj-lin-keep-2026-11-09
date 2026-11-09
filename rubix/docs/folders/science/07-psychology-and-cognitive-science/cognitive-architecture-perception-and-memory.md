# COGNITIVE ARCHITECTURE, PERCEPTION & MEMORY SYSTEMS
## Psychophysics, Perceptual Binding, Multi-Store Memory Models, Hebbian Synaptic Consolidation, and Kahneman-Tversky Dual-Process Decision Dynamics

> **Classification**: Cognitive Science & Experimental Psychology  
> **Scope**: Sensation Thresholds, Gestalt Psychology, Working Memory Systems, Neural Plasticity, Heuristics, and Decision Biases  

---

## 1. Sensation & Psychophysics: The Quantification of Perception

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                  THE SENSORY TRANSDUCTION AND PERCEPTION PIPELINE                             |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| Stage                    | Mechanism                          | Governing Scientific Law                      |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| 1. Physical Stimulus     | Photons, Acoustic Waves, Pressure  | Classical Wave & Quantum Mechanics            |
| 2. Sensory Transduction  | Photoreceptors, Hair Cells, Mechan.| Generator Potentials (Ion Channel Flux)       |
| 3. Psychophysical Scaling| Differential Threshold Detection   | Weber-Fechner Law: S = k · ln(I / I₀)         |
| 4. Feature Extraction    | Cortical Orientation Columns (V1)  | Hubel & Wiesel Receptive Field Organization   |
| 5. Perceptual Synthesis  | Figure-Ground Segregation          | Gestalt Principles of Perceptual Organization |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
```

### 1.1 The Mathematical Laws of Psychophysics
Psychophysics, founded by Ernst Heinrich Weber and Gustav Fechner in the 19th century, was the first rigorous scientific bridge between physical energy and subjective psychological perception.

1. **Weber's Law (1834)**:
   The just-noticeable difference ($\Delta I$, or difference threshold) between two stimuli is a constant fraction $k$ of the baseline stimulus intensity $I$:
   $$\frac{\Delta I}{I} = k \quad (\text{Weber Fraction})$$
   - Weight discrimination: $k \approx 0.02$ (a 2% difference is required to detect a weight change).
   - Light brightness: $k \approx 0.08$.
   - Acoustic frequency discrimination: $k \approx 0.003$ (0.3% frequency shift).

2. **Fechner's Law (1860)**:
   By integrating Weber's relationship, Fechner established that subjective sensory magnitude $S$ grows logarithmically relative to physical stimulus intensity $I$:
   $$S = k \ln\left(\frac{I}{I_0}\right)$$
   Where $I_0$ represents the absolute detection threshold. This logarithmic compression allows biological nervous systems to perceive stimuli spanning over 10 to 12 orders of magnitude (e.g., human hearing from $0\text{ dB}$ [$10^{-12}\text{ W/m}^2$] to $120\text{ dB}$ [$1\text{ W/m}^2$] without receptor destruction).

3. **Stevens' Power Law (1957, S.S. Stevens)**:
   Demonstrated that subjective perception follows a power function across wider modalities:
   $$\psi(I) = k \cdot I^a$$
   - Light brightness: $a \approx 0.33$ (compressive, protects vision from saturation).
   - Loudness: $a \approx 0.67$ (compressive).
   - Electric shock: $a \approx 3.5$ (expansive, triggering rapid protective reflexes).

### 1.2 Gestalt Principles of Perceptual Organization
Max Wertheimer, Wolfgang Köhler, and Kurt Koffka demonstrated that human perception does not assemble isolated sensory atoms; the brain perceives holistically via the **Law of Prägnanz** (the brain selects the simplest, most stable visual interpretation):
- **Law of Proximity**: Stimuli positioned in close spatial or temporal proximity are perceived as a unified group.
- **Law of Similarity**: Elements sharing physical characteristics (color, shape, luminance, orientation) are grouped together.
- **Law of Good Continuation**: The visual cortex preferentially connects line segments that form continuous, smooth curves rather than abrupt angles.
- **Law of Closure**: The visual system automatically interpolates missing sensory inputs to perceive enclosed, complete contours.
- **Figure-Ground Segregation**: Danish psychologist Edgar Rubin established that visual scenes are systematically bifurcated into a salient foreground "figure" with defined borders, and an indefinite "ground".

---

## 2. Memory Architecture: Storage, Retrieval & Synaptic Consolidation

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                 THE ATKINSON-SHIFFRIN MEMORY ARCHITECTURE (1968)                              |
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|   Sensory Input ───> [ SENSORY REGISTER ] ──(Attention)──> [ SHORT-TERM MEMORY (STM) ] ───> [ LONG-TERM (LTM) ]|
|                      - Iconic: ~250-500 ms                 - Capacity: 7 ± 2 items           - Unlimited Cap. |
|                      - Echoic: 3-4 seconds                 - Duration: ~15-30 seconds        - Lifetime Dur.  |
|                      - Transduction filters                - Phonological/Rehearsal loop     - Episodic/Sem.  |
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### 2.1 The Multi-Store Model & Working Memory
1. **Atkinson & Shiffrin Multi-Store Model (1968)**:
   - **Sensory Register**: George Sperling's partial-report experiments (1960) proved high-capacity iconic visual memory lasts only $250\text{ ms}$ before decaying. Echoic auditory memory lasts $3\text{--}4\text{ seconds}$.
   - **Short-Term Store**: George Miller (1956) identified the magical number $7 \pm 2$ discrete chunks of information. Peterson & Peterson (1959) showed unrehearsed STM decays within $18\text{ seconds}$.
   - **Long-Term Store**: Permanent, chemically encoded information network.

2. **Baddeley & Hitch Multicomponent Working Memory Model (1974, 2000)**:
   Alan Baddeley and Graham Hitch replaced passive short-term storage with an active tripartite working memory system:
   - **Central Executive**: Prefrontal cortex attentional controller; allocates cognitive resources, resolves interference, and switches task sets.
   - **Phonological Loop**: Broca's and Wernicke's speech circuits; maintains acoustic/verbal data via an inner speech subvocal rehearsal mechanism (limited to ~2 seconds of spoken material).
   - **Visuo-Spatial Sketchpad**: Parieto-occipital network; manipulates spatial coordinates, mental rotation, and visual imagery.
   - **Episodic Buffer (Added 2000)**: Binds multi-modal sensory streams into coherent temporal episodes linked to long-term memory.

### 2.2 Endel Tulving's Taxonomy of Long-Term Memory
- **Declarative (Explicit) Memory**:
  - *Episodic Memory*: Autonoetic consciousness; personal temporal experiences ("mental time travel", encoded via the medial temporal lobe and hippocampus).
  - *Semantic Memory*: Noetic consciousness; decontextualized factual knowledge, grammar, mathematics, and encyclopedic facts (stored across neocortical association areas).
- **Non-Declarative (Implicit) Memory**:
  - *Procedural Memory*: Striatal and cerebellar motor skills (cycling, playing an instrument, typing).
  - *Priming*: Neocortical facilitation of stimulus recognition via previous exposure.
  - *Associative Conditioning*: Amygdala (emotional fear conditioning) and cerebellum (skeletal reflexes).

### 2.3 Synaptic Plasticity: The Neurochemical Engine of Memory
- **Hebb's Postulate (1949, Donald Hebb)**:
  *"When an axon of cell A is near enough to excite cell B and repeatedly or persistently takes part in firing it, some growth process or metabolic change takes place in one or both cells such that A's efficiency, as one of the cells firing B, is increased."* ("Neurons that fire together, wire together.")
- **Long-Term Potentiation (LTP)**:
  Discovered by Terje Lømo (1966) in the rabbit hippocampus:
  1. High-frequency electrical stimulation (tetanus) depolarizes the postsynaptic membrane via AMPA glutamate receptors.
  2. Depolarization expels the $\text{Mg}^{2+}$ ion plug blocking the **NMDA receptor** channel.
  3. $\text{Ca}^{2+}$ ions flood into the postsynaptic dendritic spine.
  4. Calcium activates **CaMKII** and **PKC**, which insert additional AMPA receptors into the postsynaptic density.
  5. Sustained LTP induces **CREB** transcription factor activation, leading to gene expression, protein synthesis, and the growth of new dendritic spines, cementing the physical memory trace (**engram**).
- **Ebbinghaus Forgetting Curve (1885, Hermann Ebbinghaus)**:
  Retention of learned nonsense syllables decays exponentially over time without review:
  $$R(t) = e^{-\frac{t}{S}}$$
  Where $R$ is memory retention, $S$ is memory stability, and $t$ is time. Spaced repetition resets $t$ and progressively amplifies stability $S$.

---

## 3. Cognitive Architecture & Decision Making: The Kahneman-Tversky Revolution

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    DUAL-PROCESS COGNITIVE ARCHITECTURE                                        |
+───────────────────────────────────+───────────────────────────────────────────────────────────────────────────+
| SYSTEM 1: Intuitive / Associative | SYSTEM 2: Deliberative / Analytic                                         |
+───────────────────────────────────+───────────────────────────────────────────────────────────────────────────+
| - Fast, automatic, effortless     | - Slow, controlled, cognitively demanding                                 |
| - Unconscious, implicit heuristics| - Conscious, rule-governed, logical calculation                           |
| - Emotionally charged, associative| - Neutral, reflective, abstract reasoning                                 |
| - Evolutionarily ancient (limbic) | - Evolutionarily recent (dorsolateral prefrontal cortex)                  |
| - Prone to systemic heuristics    | - Capable of overriding System 1 errors when activated                   |
+───────────────────────────────────+───────────────────────────────────────────────────────────────────────────+
```

### 3.1 Prospect Theory: Behavioral Economics & Risk Preference (1979)
Daniel Kahneman and Amos Tversky dismantled the neoclassical economic assumption of the "rational agent" (Homo economicus) by proving human choice violates expected utility theory.

1. **The S-Shaped Value Function**:
   - People evaluate outcomes as **gains or losses relative to a subjective reference point**, rather than absolute wealth states.
   - The value function is concave for gains (risk aversion for positive outcomes) and convex for losses (risk seeking to avoid definite loss).
   - **Loss Aversion**: Losses hurt approximately twice as much as equivalent gains feel pleasurable:
     $$\frac{|v(-x)|}{v(x)} \approx 2.0 \text{ to } 2.5$$
2. **Probability Weighting Function**:
   Humans systematically overweight small probabilities (e.g., buying lottery tickets, irrational fear of rare terrorist attacks or plane crashes) and underweight moderate-to-high probabilities.

### 3.2 Cognitive Heuristics and Systemic Biases
When facing uncertainty, System 1 employs mental shortcuts (**heuristics**) that often lead to severe cognitive biases:

| Heuristic / Bias | Mechanism | Real-World manifestation |
| :--- | :--- | :--- |
| **Availability Heuristic** | Judging the frequency or likelihood of an event by the ease with which instances come to mind. | Overestimating deaths from shark attacks, plane crashes, or homicides due to vivid media coverage. |
| **Representativeness Heuristic** | Evaluating the probability that an object A belongs to class B by how much A resembles the prototype of B. | Committing the **Conjunction Fallacy** ("Linda problem": believing Linda is more likely to be a feminist bank teller than just a bank teller). |
| **Anchoring & Adjustment** | Initial arbitrary numerical values disproportionately pull final quantitative estimates toward themselves. | Real estate valuations, salary negotiations, and retail retail pricing ("$999" struck through to "$499"). |
| **Confirmation Bias** | Seeking, interpreting, and remembering evidence that corroborates prior beliefs while ignoring counter-evidence. | Polarized political beliefs, scientific dogma persistence, and selective memory retrieval. |
| **Dunning-Kruger Effect** | Metacognitive failure where incompetent individuals in a domain overestimate their competence due to lack of skill to judge quality. | Novices expressing extreme certainty, whereas true domain experts express nuance and epistemic humility. |
| **Framing Effect** | Altering choices by presenting logically equivalent options in terms of either survival/gains or mortality/losses. | Patients choose surgery when told "90% survival rate" but reject it when told "10% mortality rate". |
