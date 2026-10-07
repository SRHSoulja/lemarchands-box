#!/usr/bin/env python3
"""
Lemarchand's Box (The Lament Configuration)
1,000-Piece Interactive NFT Collection Generator

Generates all 1,000 ERC-721 JSON metadata files, collection manifest,
provenance hash, and rarity distribution report.
"""

import os
import json
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METADATA_DIR = os.path.join(BASE_DIR, "metadata")
TOTAL_SUPPLY = 1000

# Mulberry32 PRNG matching JS implementation
def mulberry32(seed):
    s = seed & 0xFFFFFFFF
    def rng():
        nonlocal s
        s = (s + 0x6D2B79F5) & 0xFFFFFFFF
        t = (s ^ (s >> 15)) * (1 | s)
        t &= 0xFFFFFFFF
        t = (t ^ (t >> 7)) * (61 | t)
        t &= 0xFFFFFFFF
        res = ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
        return res
    return rng

def hash_seed(token_id, salt="LEMARCHAND_1784"):
    s = f"TOKEN_{token_id}_{salt}"
    h = 0x811c9dc5
    for char in s:
        h ^= ord(char)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h

CONFIGURATIONS = [
    ("Lament Cube (Prime Orthodox)", 450, "CUBE"),
    ("Flanged Aperture (Shifted Rails)", 200, "FLANGE"),
    ("Lemarchand Bloom (Unfolded Star)", 150, "BLOOM"),
    ("Leviathan Diamond (Stretched Rhombus)", 100, "LEVIATHAN"),
    ("Tesseract Rift (Segmented Void)", 60, "TESSERACT"),
    ("Cenobite Monolith (Ascended Pillar)", 30, "MONOLITH"),
    ("Genesis Masterpiece 1784 (Apotheosis)", 10, "GENESIS")
]

WOODS = [
    ("French Ancient Ebony", 300),
    ("Blood Mahogany", 250),
    ("Petrified Black Oak", 180),
    ("Obsidian Stone Inlay", 120),
    ("Cursed Rosewood", 80),
    ("Fossilized Bone Carving", 40),
    ("Damned Ironwood", 25),
    ("Singing Relic Core", 5)
]

METALS = [
    ("Parisian Antique Brass", 350),
    ("Tarnished Imperial Gold", 250),
    ("Blood Bronze", 180),
    ("Corroded Iron", 100),
    ("Sterling Occult Silver", 60),
    ("Verdigris Copper", 35),
    ("Celestial Electrum", 20),
    ("Platinum of the Void", 5)
]

CORES = [
    ("Event Horizon Void", 300),
    ("Molten Hellfire", 250),
    ("Blue Cenobite Flame", 200),
    ("Prismatic Singularity", 120),
    ("Singing Mirror Matrix", 70),
    ("Emerald Ectoplasm", 40),
    ("Pure Stygian Light", 15),
    ("Leviathan Eye", 5)
]

AURAS = [
    ("The Seal of Philip 1784", 300),
    ("Enochian Star Gates", 250),
    ("Labyrinth of Leviathan", 200),
    ("Alchemical Gyroscope", 140),
    ("Hexagram of the Schism", 80),
    ("Cenobite Gateway Arch", 30)
]

PATRONS = [
    ("The Hell Priest (Pinhead)", 350),
    ("The Chatterer", 250),
    ("The Female Cenobite", 180),
    ("Butterball", 120),
    ("The Engineer", 70),
    ("Leviathan, Lord of the Labyrinth", 30)
]

ATMOSPHERES = [
    ("Cathedral of Pain", 280),
    ("The Labyrinth of Leviathan", 240),
    ("Victorian Study 1784", 200),
    ("The Ash Chamber", 140),
    ("Whispering Void", 80),
    ("Crimson Eclipse", 40),
    ("Chamber of Relic Souls", 20)
]

ACOUSTICS = [
    ("Clockwork Ratchet & Ticks", 320),
    ("Requiem Bell Chimes", 260),
    ("Sub-bass Hell Drone", 200),
    ("Celestial Chain Rattles", 120),
    ("Music Box of Lemarchand", 70),
    ("Echoes of the Damned", 30)
]

DIFFICULTIES = [
    ("Initiate (3-Step Dial Alignment)", 400, 3),
    ("Adept (4-Step Flange Sequence)", 300, 4),
    ("Architect (5-Step Labyrinth Order)", 180, 5),
    ("Cenobite (6-Step Tesseract Shift)", 90, 6),
    ("Master of the Box (7-Step Leviathan Key)", 30, 7)
]

JOURNALS = [
    "Paris, 1784. The gears within this specimen whisper when the clock strikes three. It is not mere brass and ebony; it is an incision into the flesh of space.",
    "The Duc de L'Isle demanded an enigma no intellect could untangle without yielding to desire. I fitted the sixth panel with singing bronze.",
    "To open it is not to solve a puzzle, but to invite an audience with architects who know nothing of mercy and everything of exquisite sensation.",
    "I spent forty nights carving the fourth quadrant. When the silver wire settled into the rosewood track, the candle flames bent without wind.",
    "Leviathan does not speak in words, but in the exact proportion of sliding rhombuses. Listen carefully to the chime before you twist the dial.",
    "A toy for those whose appetites have outgrown the world. It requires no key save the surrender of your mortal reason.",
    "The brass was quenched in cold well water drawn beneath the new moon. Each facet remembers the hands of the craftsman.",
    "They call it a box, but it is an aperture. When the flanges part, you will see the geometries of the labyrinth stretching into eternity."
]

def pick_weighted(items, val):
    total = sum(item[1] for item in items)
    threshold = val * total
    for item in items:
        if threshold < item[1]:
            return item
        threshold -= item[1]
    return items[-1]

def generate_token_metadata(token_id):
    seed = hash_seed(token_id)
    rng = mulberry32(seed)

    config = pick_weighted(CONFIGURATIONS, rng())
    wood = pick_weighted(WOODS, rng())
    metal = pick_weighted(METALS, rng())
    core = pick_weighted(CORES, rng())
    aura = pick_weighted(AURAS, rng())
    patron = pick_weighted(PATRONS, rng())
    atmosphere = pick_weighted(ATMOSPHERES, rng())
    acoustic = pick_weighted(ACOUSTICS, rng())
    difficulty = pick_weighted(DIFFICULTIES, rng())

    journal_idx = int(rng() * len(JOURNALS))
    journal_text = JOURNALS[journal_idx]

    FACE_NAMES = ["Top Rosette", "Bottom Astrolabe", "Front Labyrinth", "Back Escapement", "Right Cross", "Left Chevrons"]
    puzzle_sequence = [int(rng() * 6) for _ in range(difficulty[2])]
    solution_names = [FACE_NAMES[idx] for idx in puzzle_sequence]

    # Calculate rarity score matching JS implementation exactly
    score = (
        (1000.0 / config[1]) * 3.0 +
        (1000.0 / wood[1]) * 1.5 +
        (1000.0 / metal[1]) * 1.8 +
        (1000.0 / core[1]) * 2.2 +
        (1000.0 / aura[1]) * 1.5 +
        (1000.0 / patron[1]) * 1.6 +
        (1000.0 / difficulty[1]) * 1.2
    )
    rarity_score = round(score, 2)

    tier = "Standard"
    if rarity_score > 130:
        tier = "Mythic Masterpiece"
    elif rarity_score > 80:
        tier = "Ancient Relic"
    elif rarity_score > 50:
        tier = "Cenobite Tier"
    elif rarity_score > 28:
        tier = "Occult Adept"

    metadata = {
        "name": f"Lemarchand's Box #{token_id}",
        "description": f"Lemarchand's Box #{token_id} is an interactive 3D Lament Configuration created in Paris, 1784 by toy maker and occult geometer Philip Lemarchand. Manipulating its mechanical facets reveals the geometry of the Schism.",
        "image": f"ipfs://QmLemarchandVault/images/{token_id}.png",
        "animation_url": f"ipfs://QmLemarchandVault/viewer.html?id={token_id}",
        "external_url": f"https://lemarchand.art/relic/{token_id}",
        "attributes": [
            {"trait_type": "Configuration", "value": config[0]},
            {"trait_type": "Base Wood", "value": wood[0]},
            {"trait_type": "Filigree Metal", "value": metal[0]},
            {"trait_type": "Inner Aperture Core", "value": core[0]},
            {"trait_type": "Occult Magic Circle", "value": aura[0]},
            {"trait_type": "Summoned Patron", "value": patron[0]},
            {"trait_type": "Atmosphere", "value": atmosphere[0]},
            {"trait_type": "Acoustic Harmonics", "value": acoustic[0]},
            {"trait_type": "Solving Complexity", "value": difficulty[0]},
            {"trait_type": "Rarity Tier", "value": tier},
            {"display_type": "number", "trait_type": "Riddle Steps", "value": difficulty[2]},
            {"display_type": "number", "trait_type": "Rarity Score", "value": rarity_score}
        ],
        "properties": {
            "token_id": token_id,
            "artisan": "Philip Lemarchand",
            "year": 1784,
            "origin": "Paris, Kingdom of France",
            "journal_entry": journal_text,
            "solution_sequence": solution_names,
            "rarity_score": rarity_score,
            "rarity_tier": tier,
            "configuration_code": config[2]
        }
    }
    return metadata

def main():
    os.makedirs(METADATA_DIR, exist_ok=True)
    print(f"Generating 1,000 Lemarchand's Box metadata files...")

    provenance_hashes = []
    tier_counts = {}
    config_counts = {}

    for token_id in range(1, TOTAL_SUPPLY + 1):
        meta = generate_token_metadata(token_id)
        
        # Save JSON file
        out_path = os.path.join(METADATA_DIR, f"{token_id}.json")
        json_str = json.dumps(meta, indent=2)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(json_str)

        # Hash for provenance
        h = hashlib.sha256(json_str.encode('utf-8')).hexdigest()
        provenance_hashes.append(h)

        # Stats
        tier = meta["properties"]["rarity_tier"]
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

        cfg = meta["properties"]["configuration_code"]
        config_counts[cfg] = config_counts.get(cfg, 0) + 1

    # Master Provenance Hash
    combined_hash = hashlib.sha256("".join(provenance_hashes).encode('utf-8')).hexdigest()

    manifest = {
        "collection_name": "Lemarchand's Box",
        "symbol": "LAMENT",
        "total_supply": TOTAL_SUPPLY,
        "provenance_hash": combined_hash,
        "standard": "ERC-721",
        "creator": "Philip Lemarchand (1784 Archive)",
        "rarity_distribution": tier_counts,
        "configuration_distribution": config_counts
    }

    manifest_path = os.path.join(METADATA_DIR, "collection_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("\nGeneration Completed Successfully!")
    print(f"Total Tokens: {TOTAL_SUPPLY}")
    print(f"Master Provenance Hash: {combined_hash}")
    print("Rarity Tier Breakdown:")
    for tier, cnt in tier_counts.items():
        print(f"  - {tier}: {cnt} ({cnt / 10.0}%)")
    print(f"Manifest written to: {manifest_path}")

if __name__ == "__main__":
    main()
