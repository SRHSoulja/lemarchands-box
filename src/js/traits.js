/**
 * Lemarchand's Box (Lament Configuration) - Deterministic Trait Engine
 * 1,000-Piece Interactive NFT Collection
 * 
 * Generates deterministic traits, rarity weights, mechanical puzzle codes,
 * musical resonance keys, occult aura geometries, and Philip Lemarchand 1784 journal entries.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.LemarchandTraits = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    function createRNG(seed) {
        let s = seed >>> 0;
        return function () {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hashSeed(tokenId, salt = 'LEMARCHAND_1784') {
        let str = `TOKEN_${tokenId}_${salt}`;
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
    }

    const TRAIT_REGISTRY = {
        configurations: [
            { name: "Lament Cube (Prime Orthodox)", weight: 450, code: "CUBE" },
            { name: "Flanged Aperture (Shifted Rails)", weight: 200, code: "FLANGE" },
            { name: "Lemarchand Bloom (Unfolded Star)", weight: 150, code: "BLOOM" },
            { name: "Leviathan Diamond (Stretched Rhombus)", weight: 100, code: "LEVIATHAN" },
            { name: "Tesseract Rift (Segmented Void)", weight: 60, code: "TESSERACT" },
            { name: "Cenobite Monolith (Ascended Pillar)", weight: 30, code: "MONOLITH" },
            { name: "Genesis Masterpiece 1784 (Apotheosis)", weight: 10, code: "GENESIS" }
        ],

        woods: [
            { name: "French Ancient Ebony", weight: 300, color: "#100d0c" },
            { name: "Blood Mahogany", weight: 250, color: "#220c09" },
            { name: "Petrified Black Oak", weight: 180, color: "#141412" },
            { name: "Obsidian Stone Inlay", weight: 120, color: "#0c0d11" },
            { name: "Cursed Rosewood", weight: 80, color: "#2d130f" },
            { name: "Fossilized Bone Carving", weight: 40, color: "#b5aa94" },
            { name: "Damned Ironwood", weight: 25, color: "#1a1615" },
            { name: "Singing Relic Core", weight: 5, color: "#140a20" }
        ],

        metals: [
            { name: "Parisian Antique Brass", weight: 350, color: "#d4af37", metalness: 0.94, roughness: 0.22 },
            { name: "Tarnished Imperial Gold", weight: 250, color: "#e5c158", metalness: 0.95, roughness: 0.18 },
            { name: "Blood Bronze", weight: 180, color: "#b86b3a", metalness: 0.90, roughness: 0.28 },
            { name: "Corroded Iron", weight: 100, color: "#8a8680", metalness: 0.85, roughness: 0.38 },
            { name: "Sterling Occult Silver", weight: 60, color: "#d6dadf", metalness: 0.96, roughness: 0.16 },
            { name: "Verdigris Copper", weight: 35, color: "#48927a", metalness: 0.88, roughness: 0.32 },
            { name: "Celestial Electrum", weight: 20, color: "#e8db88", metalness: 0.96, roughness: 0.15 },
            { name: "Platinum of the Void", weight: 5, color: "#eef2f7", metalness: 0.98, roughness: 0.12 }
        ],

        cores: [
            { name: "Event Horizon Void", weight: 300, color: "#050508", glowColor: "#414166", keyFreq: 440.0 },
            { name: "Molten Hellfire", weight: 250, color: "#ff3700", glowColor: "#ff6600", keyFreq: 392.0 },
            { name: "Blue Cenobite Flame", weight: 200, color: "#0088ff", glowColor: "#33bbee", keyFreq: 523.25 },
            { name: "Prismatic Singularity", weight: 120, color: "#aa00ff", glowColor: "#bb44ff", keyFreq: 587.33 },
            { name: "Singing Mirror Matrix", weight: 70, color: "#88ffff", glowColor: "#aaffff", keyFreq: 659.25 },
            { name: "Emerald Ectoplasm", weight: 40, color: "#00ff66", glowColor: "#33ff88", keyFreq: 493.88 },
            { name: "Pure Stygian Light", weight: 15, color: "#ffffff", glowColor: "#eeeeff", keyFreq: 698.46 },
            { name: "Leviathan Eye", weight: 5, color: "#ff0044", glowColor: "#ff0066", keyFreq: 329.63 }
        ],

        auras: [
            { name: "The Seal of Philip 1784", weight: 300 },
            { name: "Enochian Star Gates", weight: 250 },
            { name: "Labyrinth of Leviathan", weight: 200 },
            { name: "Alchemical Gyroscope", weight: 140 },
            { name: "Hexagram of the Schism", weight: 80 },
            { name: "Cenobite Gateway Arch", weight: 30 }
        ],

        patrons: [
            { name: "The Hell Priest (Pinhead)", weight: 350 },
            { name: "The Chatterer", weight: 250 },
            { name: "The Female Cenobite", weight: 180 },
            { name: "Butterball", weight: 120 },
            { name: "The Engineer", weight: 70 },
            { name: "Leviathan, Lord of the Labyrinth", weight: 30 }
        ],

        atmospheres: [
            { name: "Cathedral of Pain", weight: 280, fogColor: "#10080e", ambient: "#1c1018" },
            { name: "The Labyrinth of Leviathan", weight: 240, fogColor: "#060910", ambient: "#0c121c" },
            { name: "Victorian Study 1784", weight: 200, fogColor: "#140f0b", ambient: "#1f1712" },
            { name: "The Ash Chamber", weight: 140, fogColor: "#0d0d0d", ambient: "#161616" },
            { name: "Whispering Void", weight: 80, fogColor: "#050509", ambient: "#0a0a14" },
            { name: "Crimson Eclipse", weight: 40, fogColor: "#1a0404", ambient: "#280808" },
            { name: "Chamber of Relic Souls", weight: 20, fogColor: "#06140e", ambient: "#0b2016" }
        ],

        acoustics: [
            { name: "Clockwork Ratchet & Ticks", weight: 320, synthType: "clockwork" },
            { name: "Requiem Bell Chimes", weight: 260, synthType: "bells" },
            { name: "Sub-bass Hell Drone", weight: 200, synthType: "drone" },
            { name: "Celestial Chain Rattles", weight: 120, synthType: "chains" },
            { name: "Music Box of Lemarchand", weight: 70, synthType: "musicbox" },
            { name: "Echoes of the Damned", weight: 30, synthType: "echoes" }
        ],

        difficulties: [
            { name: "Initiate (3-Step Dial Alignment)", weight: 400, steps: 3 },
            { name: "Adept (4-Step Flange Sequence)", weight: 300, steps: 4 },
            { name: "Architect (5-Step Labyrinth Order)", weight: 180, steps: 5 },
            { name: "Cenobite (6-Step Tesseract Shift)", weight: 90, steps: 6 },
            { name: "Master of the Box (7-Step Leviathan Key)", weight: 30, steps: 7 }
        ]
    };

    const JOURNAL_TEMPLATES = [
        "Paris, 1784. The gears within this specimen whisper when the clock strikes three. It is not mere brass and ebony; it is an incision into the flesh of space.",
        "The Duc de L'Isle demanded an enigma no intellect could untangle without yielding to desire. I fitted the sixth panel with singing bronze.",
        "To open it is not to solve a puzzle, but to invite an audience with architects who know nothing of mercy and everything of exquisite sensation.",
        "I spent forty nights carving the fourth quadrant. When the silver wire settled into the rosewood track, the candle flames bent without wind.",
        "Leviathan does not speak in words, but in the exact proportion of sliding rhombuses. Listen carefully to the chime before you twist the dial.",
        "A toy for those whose appetites have outgrown the world. It requires no key save the surrender of your mortal reason.",
        "The brass was quenched in cold well water drawn beneath the new moon. Each facet remembers the hands of the craftsman.",
        "They call it a box, but it is an aperture. When the flanges part, you will see the geometries of the labyrinth stretching into eternity."
    ];

    function pickWeighted(list, rngVal) {
        const total = list.reduce((sum, item) => sum + item.weight, 0);
        let threshold = rngVal * total;
        for (let item of list) {
            if (threshold < item.weight) return item;
            threshold -= item.weight;
        }
        return list[list.length - 1];
    }

    function resolveTraits(tokenId) {
        if (tokenId < 1 || tokenId > 1000) {
            throw new Error(`Token ID must be between 1 and 1000, got ${tokenId}`);
        }

        const seed = hashSeed(tokenId);
        const rng = createRNG(seed);

        const config = pickWeighted(TRAIT_REGISTRY.configurations, rng());
        const wood = pickWeighted(TRAIT_REGISTRY.woods, rng());
        const metal = pickWeighted(TRAIT_REGISTRY.metals, rng());
        const core = pickWeighted(TRAIT_REGISTRY.cores, rng());
        const aura = pickWeighted(TRAIT_REGISTRY.auras, rng());
        const patron = pickWeighted(TRAIT_REGISTRY.patrons, rng());
        const atmosphere = pickWeighted(TRAIT_REGISTRY.atmospheres, rng());
        const acoustic = pickWeighted(TRAIT_REGISTRY.acoustics, rng());
        const difficulty = pickWeighted(TRAIT_REGISTRY.difficulties, rng());

        const journalIndex = Math.floor(rng() * JOURNAL_TEMPLATES.length);
        const journalEntry = JOURNAL_TEMPLATES[journalIndex];

        // Deterministic Solving Riddle Sequence
        const FACE_NAMES = ["Top Rosette", "Bottom Astrolabe", "Front Labyrinth", "Back Escapement", "Right Cross", "Left Chevrons"];
        const FACE_CLUES = [
            "Align the Rosette of the Heavens (Top)",
            "Depress the Astrolabe of the Nadir (Bottom)",
            "Untangle the Concentric Labyrinth (Front)",
            "Disengage the Escapement Cog (Back)",
            "Rotate the Quadrant Cross (Right)",
            "Shift the Radiating Chevrons (Left)"
        ];

        const puzzleSequence = [];
        for (let s = 0; s < difficulty.steps; s++) {
            puzzleSequence.push(Math.floor(rng() * 6));
        }

        const totalItems = 1000;
        const rarityScore = (
            (totalItems / config.weight) * 3.0 +
            (totalItems / wood.weight) * 1.5 +
            (totalItems / metal.weight) * 1.8 +
            (totalItems / core.weight) * 2.2 +
            (totalItems / aura.weight) * 1.5 +
            (totalItems / patron.weight) * 1.6 +
            (totalItems / difficulty.weight) * 1.2
        ).toFixed(2);

        let rarityTier = "Standard";
        if (rarityScore > 130) rarityTier = "Mythic Masterpiece";
        else if (rarityScore > 80) rarityTier = "Ancient Relic";
        else if (rarityScore > 50) rarityTier = "Cenobite Tier";
        else if (rarityScore > 28) rarityTier = "Occult Adept";

        return {
            tokenId,
            seed,
            name: `Lemarchand's Box #${tokenId}`,
            title: `${config.name.split(' (')[0]} #${tokenId}`,
            rarityScore: parseFloat(rarityScore),
            rarityTier,
            traits: {
                configuration: config.name,
                configurationCode: config.code,
                baseWood: wood.name,
                filigreeMetal: metal.name,
                innerApertureCore: core.name,
                occultMagicCircle: aura.name,
                summonedPatron: patron.name,
                atmosphere: atmosphere.name,
                acousticHarmonics: acoustic.name,
                solvingComplexity: difficulty.name,
                stepCount: difficulty.steps
            },
            visualParameters: {
                woodColor: wood.color,
                metalColor: metal.color,
                metalness: metal.metalness,
                metalRoughness: metal.roughness,
                coreColor: core.color,
                coreGlowColor: core.glowColor,
                keyFreq: core.keyFreq,
                fogColor: atmosphere.fogColor,
                ambientColor: atmosphere.ambient,
                synthType: acoustic.synthType
            },
            puzzle: {
                steps: difficulty.steps,
                sequence: puzzleSequence,
                sequenceNames: puzzleSequence.map(i => FACE_NAMES[i]),
                sequenceClues: puzzleSequence.map(i => FACE_CLUES[i])
            },
            lore: {
                artisan: "Philip Lemarchand (Paris, 1784)",
                journalEntry
            }
        };
    }

    return {
        TRAIT_REGISTRY,
        JOURNAL_TEMPLATES,
        resolveTraits,
        hashSeed,
        createRNG
    };
}));
