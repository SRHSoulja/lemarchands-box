/**
 * Comprehensive Node.js verification test for the 6-stage mechanical puzzle box
 */

// Mock browser globals needed by modules in Node
global.window = global;
global.self = global;

const THREE = require('../src/js/lib/three.min.js');
global.THREE = THREE;

const Module = require('module');
const origRequire = Module.prototype.require;
Module.prototype.require = function(path) {
    if (path === 'three') return THREE;
    return origRequire.apply(this, arguments);
};

const LemarchandTraits = require('../src/js/traits.js');
const LemarchandPuzzle = require('../src/js/puzzle.js');
const LemarchandTextures = require('../src/js/textures.js');

console.log("=== 1. Testing Traits & Determinism ===");
const t1 = LemarchandTraits.resolveTraits(1);
const t7 = LemarchandTraits.resolveTraits(7);
const t42 = LemarchandTraits.resolveTraits(42);
const t777 = LemarchandTraits.resolveTraits(777);

console.log("Token #1:", t1.title, "| Tier:", t1.rarityTier, "| Complexity:", t1.traits.solvingComplexity);
console.log("Token #7:", t7.title, "| Tier:", t7.rarityTier, "| Complexity:", t7.traits.solvingComplexity);
console.log("Token #42:", t42.title, "| Tier:", t42.rarityTier, "| Complexity:", t42.traits.solvingComplexity);
console.log("Token #777:", t777.title, "| Tier:", t777.rarityTier, "| Complexity:", t777.traits.solvingComplexity);

console.log("\n=== 2. Testing Puzzle Combinations & 6-Stage Lifecycle ===");
// Mock mockEngine and mockAudio
class MockEngine {
    constructor() {
        this.currentStage = 0;
        this.faceAssemblies = [0,1,2,3,4,5].map(id => ({
            id,
            dialAngle: 0,
            targetDialAngle: 0,
            isJiggling: false,
            jiggleStart: 0,
            glowFlashUntil: 0
        }));
    }
    setLifecycleStage(st) {
        this.currentStage = st;
    }
    rotateDial(faceIdx) {
        this.faceAssemblies[faceIdx].targetDialAngle += Math.PI / 2;
    }
    jiggleFaceDial(faceIdx) {
        this.faceAssemblies[faceIdx].isJiggling = true;
    }
    flashFaceGlow(faceIdx) {
        this.faceAssemblies[faceIdx].glowFlashUntil = 999;
    }
}

const mockEngine = new MockEngine();
const mockAudio = new Proxy({}, { get: () => () => {} });

const puzzle = new LemarchandPuzzle(mockEngine, mockAudio);

[1, 7, 42, 777].forEach(id => {
    const data = LemarchandTraits.resolveTraits(id);
    puzzle.loadToken(data);
    console.log(`\nToken #${id}:`);
    console.log(`  Steps: ${puzzle.totalSteps}`);
    console.log(`  Solution Sequence:`, puzzle.sequence.map(fIdx => `Face ${fIdx} (${puzzle.getFaceName(fIdx)})`));
    console.log(`  Initial Hint: "${puzzle.getHint()}"`);

    // Verify step progression
    for (let s = 0; s < puzzle.totalSteps; s++) {
        const expectedFace = puzzle.sequence[s];
        // Test wrong dial jiggle first
        const wrongFace = (expectedFace + 1) % 6;
        const badRes = puzzle.handleDialInput(wrongFace);
        if (badRes.success) throw new Error("Wrong dial unexpectedly succeeded!");

        // Test correct dial input
        const goodRes = puzzle.handleDialInput(expectedFace);
        if (!goodRes.success) throw new Error(`Correct dial ${expectedFace} failed!`);
    }

    // Now puzzle should be in final Gateway state (Stage 9)
    console.log(`  Finished manual solving. Engine Stage: ${mockEngine.currentStage} (Expected: 9)`);
    if (mockEngine.currentStage !== 9) throw new Error(`Expected stage 9, got ${mockEngine.currentStage}`);
    if (!puzzle.isGatewayOpen) throw new Error("Gateway should be open!");

    // Test banish
    puzzle.banish();
    console.log(`  Banished box. Engine Stage: ${mockEngine.currentStage} (Expected: 0)`);
    if (mockEngine.currentStage !== 0) throw new Error(`Expected stage 0, got ${mockEngine.currentStage}`);
});

console.log("\n=== 3. Testing Texture Map Order & Synchronization ===");
console.log("FACE_PATTERNS count:", LemarchandTextures.FACE_PATTERNS.length);
if (LemarchandTextures.FACE_PATTERNS.length !== 6) throw new Error("Must have 6 face patterns");

console.log("\nALL VERIFICATION CHECKS PASSED!");
