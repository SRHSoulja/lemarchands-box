#!/usr/bin/env python3
"""
Lemarchand's Box - Standalone HTML Bundler
Inlines index.html, CSS, Three.js, Web Audio, Textures, Engine, Puzzle, and UI into
a single self-contained HTML file without any external dependencies.
"""

import os
import shutil
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
WINDOWS_DOWNLOADS = "/mnt/c/Users/Eric/Downloads"

def bundle():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    out_file = os.path.join(PUBLIC_DIR, "standalone_viewer.html")

    # Read components
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        html = f.read()

    with open(os.path.join(SRC_DIR, "css", "style.css"), "r", encoding="utf-8") as f:
        css = f.read()

    with open(os.path.join(SRC_DIR, "js", "lib", "three.min.js"), "r", encoding="utf-8") as f:
        three_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "traits.js"), "r", encoding="utf-8") as f:
        traits_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "audio.js"), "r", encoding="utf-8") as f:
        audio_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "media_resolver.js"), "r", encoding="utf-8") as f:
        media_resolver_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "strays.js"), "r", encoding="utf-8") as f:
        strays_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "textures.js"), "r", encoding="utf-8") as f:
        textures_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "engine.js"), "r", encoding="utf-8") as f:
        engine_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "puzzle.js"), "r", encoding="utf-8") as f:
        puzzle_js = f.read()

    with open(os.path.join(SRC_DIR, "js", "ui.js"), "r", encoding="utf-8") as f:
        ui_js = f.read()

    # Replace CSS link
    html = re.sub(
        r'<link\s+rel="stylesheet"\s+href="src/css/style\.css"\s*>',
        f'<style>\n{css}\n</style>',
        html
    )

    # Combine all scripts
    combined_scripts = "\n;\n".join([
        three_js,
        traits_js,
        audio_js,
        media_resolver_js,
        strays_js,
        textures_js,
        engine_js,
        puzzle_js,
        ui_js
    ])

    # Replace script tags using lambda to avoid backslash escape issues
    script_pattern = r'<!-- Core Scripts -->[\s\S]*?<script src="src/js/ui\.js"></script>'
    inlined_script_block = f'<script>\n{combined_scripts}\n</script>'
    html = re.sub(script_pattern, lambda m: inlined_script_block, html)

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = round(os.path.getsize(out_file) / 1024, 1)
    print(f"Standalone single-file bundle built: {out_file} ({size_kb} KB)")

    # Copy to Windows Downloads if present
    if os.path.exists(WINDOWS_DOWNLOADS):
        win_dest = os.path.join(WINDOWS_DOWNLOADS, "Lemarchands-Box-Interactive.html")
        shutil.copyfile(out_file, win_dest)
        print(f"Deployed directly to Windows: {win_dest}")

if __name__ == "__main__":
    bundle()
