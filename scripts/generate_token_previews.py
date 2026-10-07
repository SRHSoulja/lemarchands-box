#!/usr/bin/env python3
"""
Lemarchand's Box - Static Token Preview & Fallback Card Generator
Generates high-resolution 2D preview cards for OpenSea and marketplace fallback images.
"""

import os
import json
import math
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METADATA_DIR = os.path.join(BASE_DIR, "metadata")
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "previews")

CARD_W = 1000
CARD_H = 1000

def hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def render_preview_card(token_id, meta):
    img = Image.new("RGB", (CARD_W, CARD_H), color=(10, 9, 12))
    draw = ImageDraw.Draw(img)

    # 1. Dark background with subtle gradient
    for y in range(CARD_H):
        dist = abs(y - CARD_H // 2) / (CARD_H / 2)
        c = int(14 - dist * 8)
        draw.line([(0, y), (CARD_W, y)], fill=(c, c - 2, c + 2))

    # 2. Outer antique brass filigree border
    margin = 35
    draw.rectangle([margin, margin, CARD_W - margin, CARD_H - margin], outline=(184, 138, 40), width=4)
    draw.rectangle([margin + 12, margin + 12, CARD_W - margin - 12, CARD_H - margin - 12], outline=(100, 75, 25), width=2)

    # Corner brackets
    c_size = 45
    for cx, cy, dx, dy in [
        (margin, margin, 1, 1),
        (CARD_W - margin, margin, -1, 1),
        (CARD_W - margin, CARD_H - margin, -1, -1),
        (margin, CARD_H - margin, 1, -1)
    ]:
        draw.line([(cx, cy), (cx + dx * c_size, cy)], fill=(212, 175, 55), width=3)
        draw.line([(cx, cy), (cx, cy + dy * c_size)], fill=(212, 175, 55), width=3)

    # 3. Header text
    draw.text((CARD_W // 2, 75), "LEMARCHAND'S BOX", fill=(212, 175, 55), anchor="mm")
    draw.text((CARD_W // 2, 105), f"THE LAMENT CONFIGURATION #{token_id}", fill=(240, 230, 215), anchor="mm")
    draw.text((CARD_W // 2, 128), "PARIS, 1784 • PHILIP LEMARCHAND", fill=(160, 145, 130), anchor="mm")

    # 4. Central Box Facet Illustration
    box_cx = CARD_W // 2
    box_cy = 470
    box_size = 540
    bx0 = box_cx - box_size // 2
    by0 = box_cy - box_size // 2
    bx1 = box_cx + box_size // 2
    by1 = box_cy + box_size // 2

    # Dark mahogany backing
    draw.rectangle([bx0, by0, bx1, by1], fill=(22, 16, 14), outline=(140, 105, 35), width=8)

    # Concentric brass inlays
    draw.ellipse([box_cx - 160, box_cy - 160, box_cx + 160, box_cy + 160], outline=(212, 175, 55), width=6)
    draw.ellipse([box_cx - 130, box_cy - 130, box_cx + 130, box_cy + 130], outline=(184, 138, 40), width=3)

    # Star rosette rays
    for i in range(8):
        ang = i * (math.pi / 4)
        x_end = box_cx + math.cos(ang) * 140
        y_end = box_cy + math.sin(ang) * 140
        draw.line([(box_cx, box_cy), (x_end, y_end)], fill=(235, 195, 75), width=4)

    # Central diamond
    d = 40
    draw.polygon([
        (box_cx, box_cy - d),
        (box_cx + d, box_cy),
        (box_cx, box_cy + d),
        (box_cx - d, box_cy)
    ], fill=(12, 10, 15), outline=(212, 175, 55))

    # Core glow center
    core_attr = next((a["value"] for a in meta["attributes"] if a["trait_type"] == "Inner Aperture Core"), "Blue Cenobite Flame")
    core_color = (0, 170, 255) if "Blue" in core_attr else (255, 70, 0) if "Hellfire" in core_attr else (180, 0, 255)
    draw.ellipse([box_cx - 14, box_cy - 14, box_cx + 14, box_cy + 14], fill=core_color)

    # 5. Trait Summary Bar at the bottom
    tier = meta["properties"]["rarity_tier"]
    score = meta["properties"]["rarity_score"]
    cfg = next((a["value"] for a in meta["attributes"] if a["trait_type"] == "Configuration"), "Lament Cube")
    wood = next((a["value"] for a in meta["attributes"] if a["trait_type"] == "Base Wood"), "Ebony")
    metal = next((a["value"] for a in meta["attributes"] if a["trait_type"] == "Filigree Metal"), "Brass")

    draw.rectangle([60, 800, CARD_W - 60, 930], fill=(16, 14, 18), outline=(80, 65, 30), width=2)
    draw.text((CARD_W // 2, 830), f"TIER: {tier.upper()}  •  RARITY SCORE: {score}", fill=(212, 175, 55), anchor="mm")
    draw.text((CARD_W // 2, 865), f"CONFIG: {cfg}", fill=(235, 230, 220), anchor="mm")
    draw.text((CARD_W // 2, 895), f"MATERIAL: {wood}  |  FILIGREE: {metal}", fill=(160, 150, 140), anchor="mm")

    # Footer provenance
    draw.text((CARD_W // 2, 960), "ERC-721 RELIC • PROVENANCE VERIFIED • PHILIP LEMARCHAND ARCHIVE", fill=(110, 100, 90), anchor="mm")

    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Generating static preview cards for sample tokens...")

    sample_ids = [1, 7, 23, 42, 666, 1000]
    for tid in sample_ids:
        meta_file = os.path.join(METADATA_DIR, f"{tid}.json")
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
        
        card = render_preview_card(tid, meta)
        out_path = os.path.join(OUTPUT_DIR, f"{tid}.png")
        card.save(out_path)
        print(f"  - Generated preview card: {out_path}")

    print("\nStatic preview pipeline verified successfully!")

if __name__ == "__main__":
    main()
