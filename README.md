# Lemarchand's Box (The Lament Configuration)
### 1,000-Piece Interactive 3D Occult NFT Collection • Paris, 1784

> *"The box. You opened it. We came. Now you must come with us, taste our pleasures."*  
> — Clive Barker, *The Hellbound Heart*

---

## Complete Collection & Kinematic Lifecycle

This project implements the complete end-to-end lifecycle of Philip Lemarchand's 1784 *Lament Configuration* (The Hellraiser Cube), bridging authentic Clive Barker lore, mechanical horological kinematics, and production-grade on-chain architecture.

```
                              THE LIFECYCLE PHASES
                              
 [0. DORMANT CUBE] ───► [1. DIAL TRIGGER] ───► [2. SHIFTED SLICE]
   Order Preserved        Rosette Spun           Iconic Simon Sayce
   Closed 7x7x7           Clockwork Clicks       Stepped Flange
         ▲                                             │
         │                                             ▼
 [5. BANISHMENT]   ◄─── [4. THE GATEWAY]   ◄─── [3. STAR BLOOM]
   Reverse Collapse       Chains Descend         Telescoping Pistons
   Order Restored         Cenobite Decree        Clockwork Spinning
```

---

## 1. Kinematic Solving Stages (Movie-Accurate)

1. **Stage 0: Dormant Cube (Order)**
   - 100% solid, seamless antique mahogany and Simon Sayce 1987 gold filigree cube.
   - All 6 face plates meet flush at the 12 edges with **zero gaps**.
   - Sealed, cold, rotating gently under atmospheric candlelight.

2. **Stage 1: Dial Trigger (The First Clack)**
   - Top circular rosette rotates with crisp dual-impulse clockwork ratchet clicks (`tick-tick-clack`).
   - Mechanical locking pins disengage.

3. **Stage 2: The Shifted Slice (The Signature Silhouette)**
   - The iconic Hellraiser movie shape: the upper tier slides horizontally by 1.35 units along brass dovetail tracks, creating the legendary stepped offset silhouette.
   - Heavy wood-on-metal sliding sound.

4. **Stage 3: The Star Bloom (The Aperture)**
   - The face plates telescope outward along polished brass guide pistons.
   - Four internal antique brass gears begin actively spinning inside the dark steel clockwork hub.
   - The central singularity core flares to life with radiant light.

5. **Stage 4: The Cenobite Gateway (The Climax)**
   - Ambient room lighting plunges into stygian darkness.
   - Iron celestial chains with barbed meathooks descend from the void, swaying in midair.
   - Christopher Young-inspired horror music box bells chime the diminished arpeggio.
   - The sub-bass Leviathan drone swells, and a Cenobite decree appears on the HUD (*"We have such sights to show you."*).

6. **The Banishment (Reverse Ritual)**
   - Clicking **"⚔️ Banish / Re-Lock"** triggers the reverse sequence discovered by Kirsty Cotton in *Hellbound*: chains snap back into the void, the blooming panels retract, the shifted slice slides flush into cubic alignment, and the dial clicks locked with a heavy metallic thud.

---

## 2. Smart Contract & Metadata Lifecycle

- **Contract:** [`contracts/LemarchandsBox.sol`](file:///home/arson/lemarchands-box/contracts/LemarchandsBox.sol) (Solidity 0.8.20)
  - Strict 1,000 max supply cap (reverts on token 1,001).
  - 5-token max per wallet minting cap.
  - EIP-2981 5% creator royalty standard.
  - Cryptographic Provenance Hash verification.
  - Fully tested via [`scripts/simulate_contract_lifecycle.py`](file:///home/arson/lemarchands-box/scripts/simulate_contract_lifecycle.py) (100% passing).
- **Metadata Vault:** [`metadata/`](file:///home/arson/lemarchands-box/metadata/)
  - All 1,000 ERC-721 JSON metadata files generated and verified.
  - Master Provenance Hash: `a8336bf123ece8893dc2e0a41a0c9ab3b963b80ffb8a5ea03a4bf8400c9a2183`.
- **Static Preview Pipeline:** [`scripts/generate_token_previews.py`](file:///home/arson/lemarchands-box/scripts/generate_token_previews.py)
  - Generates 1000x1000 static fallback preview cards for marketplaces like OpenSea.
- **In-Browser HD Snapshot:**
  - Integrated 1-click **"📷 Capture HD Relic"** button downloads a crisp PNG of the collector's current 3D configuration.

---

## 3. Directory Layout

```
/home/arson/lemarchands-box/
├── index.html                     # Full 3D collection explorer & interactive laboratory
├── viewer.html                    # Embeddable marketplace viewer (animation_url?id=42)
├── contracts/
│   └── LemarchandsBox.sol         # Production ERC-721 + EIP-2981 Solidity contract
├── metadata/
│   ├── 1.json ... 1000.json       # All 1,000 verified metadata files
│   └── collection_manifest.json   # Collection stats & master provenance hash
├── public/
│   ├── standalone_viewer.html     # Zero-dependency single-file HTML viewer (681 KB)
│   └── previews/                  # High-res static fallback card previews
├── scripts/
│   ├── generate_collection.py     # Deterministic metadata generator
│   ├── verify_collection.py       # Automated test suite
│   ├── simulate_contract_lifecycle.py # Smart contract simulation & test suite
│   ├── generate_token_previews.py # Static card generator
│   └── build_standalone_bundle.py # Standalone HTML bundler
└── src/
    ├── css/style.css              # Dark Victorian Gothic theme
    └── js/
        ├── audio.js               # Procedural Web Audio synthesizer
        ├── engine.js              # 5-Stage mechanical kinematics & Three.js renderer
        ├── puzzle.js              # Lifecycle state machine & Cenobite decrees
        ├── textures.js            # Simon Sayce 1987 canonical PBR textures
        ├── traits.js              # Deterministic Mulberry32 trait engine
        └── ui.js                  # HUD & event controller
```

---

## Quick Testing

- **Direct Windows Test:** Double-click [`C:\Users\Eric\Downloads\Lemarchands-Box-Interactive.html`](file:///mnt/c/Users/Eric/Downloads/Lemarchands-Box-Interactive.html).
- **Run Verification Suite:**
  ```bash
  python3 scripts/verify_collection.py
  python3 scripts/simulate_contract_lifecycle.py
  ```
