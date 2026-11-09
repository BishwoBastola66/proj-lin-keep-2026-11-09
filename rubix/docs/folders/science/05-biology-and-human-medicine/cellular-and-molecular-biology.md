# CELLULAR & MOLECULAR BIOLOGY
## The Architecture of the Living Cell, Organelles, The Central Dogma, and Membrane Transport Dynamics

> **Classification**: Pure Molecular Biology & Cytology  
> **Scope**: Cell Theory, Prokaryotic vs. Eukaryotic Architecture, Organellar Specialization, DNA Replication, and Protein Synthesis  

---

## 1. Cell Theory & Cellular Architecture

In 1838–1855, Matthias Schleiden, Theodor Schwann, and Rudolf Virchow formulated **Cell Theory**:
1. All living organisms are composed of one or more cells.
2. The cell is the fundamental structural and functional unit of life.
3. All cells arise from pre-existing cells via division (*Omnis cellula e cellula*).

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    PROKARYOTES VS. EUKARYOTES                                                 |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| Dimension                | Prokaryotes (Bacteria & Archaea)   | Eukaryotes (Animals, Plants, Fungi, Protists) |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| 1. Size                  | Typically 0.1 to 5.0 μm            | Typically 10 to 100 μm (1000x volume)         |
| 2. Nucleus               | Absent (Circular DNA in nucleoid)  | Present (True double-membrane bound nucleus)  |
| 3. Organelles            | None (No membrane-bound organelles)| Complex (Mitochondria, ER, Golgi, Lysosomes)  |
| 4. Ribosomes             | 70S (50S large + 30S small subunit)| 80S (60S large + 40S small subunit)           |
| 5. Cell Division         | Binary Fission                     | Mitosis & Meiosis                             |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
```

### 1.1 The Eukaryotic Organellar Architecture
- **The Nucleus**: Houses genomic DNA organized into chromatin (DNA wrapped around histone octamer spools). Surrounded by a **Nuclear Envelope** perforated by nuclear pore complexes ($120\text{ nm}$ octagonal rings regulating macromolecular transport via importins/exportins). Contains the **Nucleolus** where ribosomal RNA (rRNA) is transcribed and ribosome subunits assemble.
- **Mitochondria (The Endosymbiotic Theory, Lynn Margulis, 1967)**:
  - Mitochondria were once free-living aerobic alpha-proteobacteria engulfed by an ancestral archaeon 1.5 billion years ago.
  - Possess their own circular genome (mtDNA) and double membrane.
  - The inner folded membrane (**Cristae**) houses the **Electron Transport Chain (Complexes I–IV)** and **ATP Synthase**, generating 30–32 ATP molecules per glucose via oxidative phosphorylation.
- **Endoplasmic Reticulum (ER)**:
  - **Rough ER**: Studded with ribosomes; synthesizes and folds transmembrane and secretory proteins.
  - **Smooth ER**: Lacks ribosomes; synthesizes lipids, phospholipids, and steroid hormones; metabolizes toxins and stores $\text{Ca}^{2+}$ ions.
- **Golgi Apparatus (Camillo Golgi, 1898)**: Flattened stacks of cisternae (*cis*, medial, *trans*). Modifies proteins with post-translational glycosylation, sorting and packaging them into transport vesicles.
- **Lysosomes (Christian de Duve, 1955 Nobel Prize)**: Acidic vesicles (pH 4.5–5.0 maintained by $V$-type $\text{H}^+$-ATPase pumps) filled with hydrolytic enzymes (proteases, nucleases, lipases) that digest cellular waste and damaged organelles via **Autophagy** (Yoshinori Ohsumi, 2016 Nobel Prize).

---

## 2. Membrane Dynamics: The Fluid Mosaic Model (Singer & Nicolson, 1972)

The plasma membrane is a 7–10 nm lipid bilayer composed of **amphipathic phospholipids** (hydrophilic phosphate heads facing water, hydrophobic hydrocarbon fatty acid tails facing inwards).

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    CELLULAR MEMBRANE TRANSPORT MECHANISMS                                     |
+──────────────────────────+────────────────────+───────────────────────────────────────────────────────────────+
| Transport Mechanism      | Energy Required?   | Physical Mechanism & Biomolecular Example                     |
+──────────────────────────+────────────────────+───────────────────────────────────────────────────────────────+
| 1. Simple Passive Diff.  | NO (Down gradient) | Small nonpolar molecules cross bilayer (O₂, CO₂, N₂, Steroids)|
| 2. Facilitated Diffusion | NO (Down gradient) | Ion channels & carrier proteins (GLUT1 glucose transporter)   |
| 3. Primary Active Trans. | YES (ATP Direct)   | Na⁺/K⁺-ATPase pump: 3 Na⁺ OUT, 2 K⁺ IN per ATP hydrolyzed     |
| 4. Secondary Active Tr.  | YES (Ion Gradient) | SGLT1: Sodium-glucose symporter powered by Na⁺ gradient       |
| 5. Vesicular Transport   | YES (GTP / ATP)    | Endocytosis (Clathrin pits) & Exocytosis (SNARE fusion)       |
+──────────────────────────+────────────────────+───────────────────────────────────────────────────────────────+
```

### 2.1 The Sodium-Potassium Pump ($\text{Na}^+/\text{K}^+$-ATPase, Jens Christian Skou, 1957)
The most critical transporter in animal biology, consuming up to **30% of a human resting body's total ATP** (and up to 70% of the brain's energy):
$$\text{ATP} + 3\text{Na}^+_{\text{in}} + 2\text{K}^+_{\text{out}} + \text{H}_2\text{O} \longrightarrow \text{ADP} + P_i + 3\text{Na}^+_{\text{out}} + 2\text{K}^+_{\text{in}}$$
- Generates an electrical resting membrane potential (typically **$-70\text{ mV}$** inside vs outside), establishing the baseline electrochemical battery that drives nerve impulses, heartbeat contraction, and nutrient absorption.

---

## 3. The Central Dogma of Molecular Biology (Francis Crick, 1958)

$$\text{DNA} \xrightarrow{\quad \text{Transcription} \quad} \text{mRNA} \xrightarrow{\quad \text{Translation} \quad} \text{Protein}$$

```
+───────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                  THE BIOCHEMICAL INFORMATION PIPELINE                                         |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| Stage                    | Catalytic Machinery                | Physical / Enzymatic Action                   |
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
| 1. DNA Replication       | DNA Polymerase III & Helicase      | Semi-conservative synthesis; proofreading 10⁻⁷|
| 2. Transcription         | RNA Polymerase II + TATA Factors   | Unwinds DNA, synthesizes complementary pre-mRNA|
| 3. RNA Processing        | Spliceosome (snRNPs) + Poly-A Tail | Removes introns, splices exons; 5' cap added  |
| 4. Translation           | Ribosome (Peptidyl transferase)    | Reads codons in mRNA, couples aminoacyl-tRNA  |
| 5. Post-Translational    | Chaperones (Hsp70, GroEL/GroES)    | Folds polypeptide into native tertiary 3D form|
+──────────────────────────+────────────────────────────────────+───────────────────────────────────────────────+
```

### 3.1 DNA Replication Fidelity
DNA Polymerase III synthesizes DNA at 1,000 nucleotides per second, with an intrinsic error rate of $10^{-5}$. Its $3' \to 5'$ exonuclease proofreading activity reduces the error rate to $10^{-7}$. Post-replication mismatch repair enzymes further reduce the final genomic mutation rate to **1 error in $10^9$ to $10^{10}$ base pairs**—the highest-fidelity biological replication mechanism in the natural world.
