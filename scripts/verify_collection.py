#!/usr/bin/env python3
"""
Lemarchand's Box - Collection Verification Script
Verifies integrity of all 1,000 JSON metadata files, schema conformance,
uniqueness, and provenance hash consistency.
"""

import os
import json
import hashlib
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METADATA_DIR = os.path.join(BASE_DIR, "metadata")
TOTAL = 1000

def verify():
    print("Verifying 1,000 Lemarchand's Box metadata files...")
    
    hashes = []
    seen_names = set()
    errors = []

    for i in range(1, TOTAL + 1):
        fpath = os.path.join(METADATA_DIR, f"{i}.json")
        if not os.path.exists(fpath):
            errors.append(f"Missing file: {fpath}")
            continue

        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
                data = json.loads(content)
        except Exception as e:
            errors.append(f"JSON parse error in {i}.json: {e}")
            continue

        # Hash
        h = hashlib.sha256(content.encode('utf-8')).hexdigest()
        hashes.append(h)

        # Check required fields
        for field in ["name", "description", "image", "animation_url", "attributes", "properties"]:
            if field not in data:
                errors.append(f"Token #{i} missing field '{field}'")

        if data["name"] in seen_names:
            errors.append(f"Duplicate name: {data['name']}")
        seen_names.add(data["name"])

        # Check attributes
        traits = {a["trait_type"]: a["value"] for a in data.get("attributes", []) if "trait_type" in a}
        required_traits = [
            "Configuration", "Base Wood", "Filigree Metal", "Inner Aperture Core",
            "Occult Magic Circle", "Summoned Patron", "Atmosphere",
            "Acoustic Harmonics", "Solving Complexity", "Rarity Tier"
        ]
        for rt in required_traits:
            if rt not in traits:
                errors.append(f"Token #{i} missing trait '{rt}'")

    if errors:
        print(f"FAILED with {len(errors)} errors:")
        for err in errors[:10]:
            print(f"  - {err}")
        sys.exit(1)

    # Check manifest provenance hash
    manifest_path = os.path.join(METADATA_DIR, "collection_manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    computed_hash = hashlib.sha256("".join(hashes).encode('utf-8')).hexdigest()
    if computed_hash != manifest["provenance_hash"]:
        print(f"Provenance mismatch: {computed_hash} != {manifest['provenance_hash']}")
        sys.exit(1)

    print(f"ALL 1,000 TOKENS VERIFIED SUCCESSFULLY!")
    print(f"  - Files Checked: {TOTAL}")
    print(f"  - Schema Conformance: 100%")
    print(f"  - Unique Names: {len(seen_names)}")
    print(f"  - Provenance Hash: {computed_hash} (MATCH)")

if __name__ == "__main__":
    verify()
