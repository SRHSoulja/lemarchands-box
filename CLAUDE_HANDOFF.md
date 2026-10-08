# Lemarchand's Box (The Lament Configuration) — Project Handoff for Claude

## 📌 Executive Summary
**Lemarchand's Box** is an interactive, fully responsive 3D WebGL occult puzzle box and generative NFT collection (1,000 pieces) inspired by Clive Barker's *Hellraiser* mythos, designed according to the authentic 1784 Philip LeMarchand and 1987 Simon Sayce prop schematics.

- **GitHub Repository**: `https://github.com/SRHSoulja/lemarchands-box`
- **Current Branch**: `main`
- **Target Network**: Robinhood Chain / EVM (Arbitrum ecosystem)
- **Live Demo / Pages**: `https://srhsoulja.github.io/lemarchands-box/`
- **Standalone Bundle**: Single-file, zero-dependency HTML viewer (`public/standalone_viewer.html`, ~997 KB)

---

## 🏗️ Core Architecture & Codebase Map

### 1. Smart Contracts (`contracts/`)
- `LemarchandsBox.sol`: ERC-721 collection contract. Max supply: 1,000. Features batch minting, wallet caps, EIP-2981 royalty standard (5%), provenance hash, and configurable `baseTokenURI`.
- `ERC6551Registry.sol` & `ERC6551Account.sol`: Token Bound Account (TBA) implementation allowing each puzzle box NFT to function as an autonomous smart contract vault that can own other NFTs (e.g. Stray Cucks, on-chain SVGs, decentralized relics) and ERC-20 tokens.
- `LemarchandDispatcher.sol`: Automaton copilot enabling pre-flight batch simulation and drop minting with strict spend-cap guardrails.
- `test/LemarchandAutomaton.t.sol`: Foundry unit test suite (12/12 tests passing).

### 2. 3D WebGL Kinematic Engine (`src/js/`)
- `engine.js` (2,700+ lines):
  - 10 canonical kinematic stages (Stage 0 *Lament Cube* to Stage 9 *Gateway Climax* with living pendulum chains and godrays).
  - Preserves exact two-tier cleavage at equatorial seam `Y = 0` with circular turntable bearing (45° star twist and 360° counter-rotations).
  - 4 secret telescoping corner key drawers with reliquary pedestals.
  - 8 articulated scissor linkages and 8 dovetail guide rails.
  - 4 spring-loaded centrifugal sacrificial razor blades extending from midsection.
  - Interactive targets count strictly maintained at 22 (6 dials + 16 blocks).
  - **Blueprint 3D X-Ray Mode**: Toggles outer blocks into luminous cyan wireframe (`#00e5ff`) exposing the 8 internal spinning clockwork gears, resonance bell, clapper pendulum, and dovetail tracks in glowing gold (`#ffd700`).
- `textures.js`: Procedural canvas texture generator producing authentic PBR maps (diffuse, bump, normal, roughness):
  - Face 0 (**Priapus Rosette**): Screen-accurate high-gloss African ebony black lacquer.
  - Faces 1–5 (**Amaimon**, **Serat**, **Escapement**, **Quadrant**, **Chevrons**): Rich dark Peruvian mahogany with fine polished grain.
  - Acid-etched intaglio brass filigree with metallic specular bevels.
  - Cameo plaque portrait renderer for enshrined relics.
- `puzzle.js`: Cipher lifecycle manager handling interactive dial combinations, harmonic tone clues, and Cenobite proclamations.
- `ui.js`: High-fidelity HUD controller:
  - Technical Schematics & Blueprints modal (`#schematicsModal`, hotkey: `P`).
  - Quick Alcove Selector Strip (`#1-#4`) and manual drawer toggle (`📦 Open Drawers` / `📦 Close Drawers`, hotkey: `D`).
  - Face Jump Bar (`Priapus`, `Amaimon`, `Serat`, `Escapement`, `Quadrant`, `Chevrons`).
  - 6551 Reliquary vault HUD with universal media enshrinement (IPFS, Arweave, On-Chain SVG).
- `audio.js`: Synthesized Web Audio engine with 55Hz/110Hz Cenobite Hell Drone, harmonic whisper clues, and music box chimes.

### 3. Collection Metadata (`metadata/`)
- 1,000 JSON metadata files generated with trait distributions, rarity tiers, and unique occult lore journal entries.

---

## 🧪 Verification & Test Commands

```bash
# 1. Run Mechanical Engineering & Kinematics Audits
node scripts/test_two_tier_kinematics.js
node scripts/test_engine_kinematics.js
node scripts/verify_mechanical_engineering.js

# 2. Run Foundry Smart Contract Tests
forge test

# 3. Build Standalone Zero-Dependency HTML Bundle
python3 scripts/build_standalone_bundle.py
```

---

## 💡 Context on Art Storage & Robinhood Chain Deployment
- **On-Chain vs. Off-Chain**: The 3D viewer is ~997 KB. For EVM contracts, storing 1 MB directly in bytecode requires ~42 SSTORE2 chunk contracts. The standard recommended approach for 3D generative NFTs is hosting the standalone HTML bundle on **Arweave** (permanent permaweb) and referencing it via `animation_url` in the token metadata.
- **Updatability**: The contract has `setBaseURI(string)` so metadata can be updated while in development/testing. An irreversible `freezeMetadata()` function can be added to permanently lock the metadata once the drop is sold out.
