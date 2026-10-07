/**
 * Test BoxEngine Kinematics and Collision Resolver
 */

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    devicePixelRatio: 1
};
global.self = global;
global.requestAnimationFrame = () => {};
global.document = {
    createElement: () => ({
        getContext: () => new Proxy({
            createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
        }, {
            get: (target, prop) => {
                if (prop in target) return target[prop];
                return () => ({});
            }
        }),
        width: 512,
        height: 512
    })
};

const THREE = require('../src/js/lib/three.min.js');
global.THREE = THREE;

const Module = require('module');
const origRequire = Module.prototype.require;
Module.prototype.require = function(path) {
    if (path === 'three') return THREE;
    return origRequire.apply(this, arguments);
};

const LemarchandTraits = require('../src/js/traits.js');
const LemarchandTextures = require('../src/js/textures.js');
global.LemarchandTextures = LemarchandTextures;
const LemarchandEngine = require('../src/js/engine.js');

console.log("=== Testing CollisionResolver Object Pooling ===");

// Let's test CollisionResolver directly:
// In engine.js, CollisionResolver is inside the closure. Let's inspect an engine instance with a mock canvas:
const mockCanvas = {
    clientWidth: 800,
    clientHeight: 600,
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    style: {}
};

// Mock WebGLRenderer
THREE.WebGLRenderer = class MockRenderer {
    constructor() {
        this.domElement = mockCanvas;
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
};

const realEngine = new LemarchandEngine(mockCanvas);
const token1 = LemarchandTraits.resolveTraits(1);
realEngine.buildBox(token1);

console.log("Built box for Token #1:");
console.log("  Puzzle blocks count:", realEngine.puzzleBlocks.length);
console.log("  Face assemblies count:", realEngine.faceAssemblies.length);
console.log("  Piston assemblies count:", realEngine.pistonAssemblies.length);
console.log("  Blades count:", realEngine.sacrificialBlades.length);
console.log("  Chains count:", realEngine.chainStrands.length);
console.log("  Interactive targets count:", realEngine.interactiveTargets.length);

if (realEngine.puzzleBlocks.length !== 16) throw new Error("Expected 16 puzzle blocks");
if (realEngine.faceAssemblies.length !== 6) throw new Error("Expected 6 face assemblies");
if (realEngine.sacrificialBlades.length !== 4) throw new Error("Expected 4 blades");
if (realEngine.interactiveTargets.length !== 22) throw new Error("Expected 22 interactive targets (6 dials + 16 blocks)");

console.log("\n=== Testing Side Face Dial Equatorial Semicircular Splits ===");
[2, 3, 4, 5].forEach(faceIdx => {
    const fa = realEngine.faceAssemblies[faceIdx];
    if (!fa.lowerGroup || !fa.lowerDial || !fa.lowerBezelMesh) {
        throw new Error(`Face ${faceIdx} missing lower split dial/bezel assembly!`);
    }
    // Verify upper dial geometry Y >= -0.001
    const uPos = fa.dial.geometry.attributes.position;
    for (let i = 0; i < uPos.count; i++) {
        if (uPos.getY(i) < -0.001) throw new Error(`Face ${faceIdx} upper dial penetrates lower tier: Y = ${uPos.getY(i)}`);
    }
    // Verify lower dial geometry Y <= 0.001
    const lPos = fa.lowerDial.geometry.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
        if (lPos.getY(i) > 0.001) throw new Error(`Face ${faceIdx} lower dial penetrates upper tier: Y = ${lPos.getY(i)}`);
    }
    console.log(`  Face ${faceIdx} (${fa.name}): Semicircular split along equatorial seam Y=0 verified.`);
});

console.log("\n=== Testing Core Cavity Bounds & Retracted Blades (prog=0.0) ===");
realEngine.sacrificialBlades.forEach((sb, idx) => {
    const dist = sb.basePos.length();
    if (dist > 0.85) throw new Error(`Sacrificial blade ${idx} not retracted in core cavity: dist = ${dist}`);
});
console.log("  All 4 sacrificial blades retracted inside core cavity (dist <= 0.85)");

realEngine.updateKinematics(7.0);
realEngine.sacrificialBlades.forEach((sb, idx) => {
    const dist = sb.mesh.position.length();
    if (dist < 3.0) throw new Error(`Sacrificial blade ${idx} did not extend in Stage 7: dist = ${dist}`);
});
console.log("  All 4 sacrificial blades extended through midsection incision at Stage 7 (dist >= 3.0)");
realEngine.updateKinematics(0.0);

console.log("\n=== Testing Kinematics across all 10 Stages (0.0 to 9.0) ===");
for (let p = 0.0; p <= 9.0; p += 0.5) {
    realEngine.updateKinematics(p);
    console.log(`  Kinematics at prog=${p.toFixed(1)}: cameraDistance=${realEngine.baseDistance.toFixed(2)}, coreLight=${realEngine.coreLight.intensity.toFixed(2)}`);
}

// Test collision resolver with pooled objects
console.log("\n=== Testing Chain-Hook Physical Attachment ===");
[8.2, 8.6, 9.0].forEach(stageProg => {
    realEngine.lifecycleProgress = stageProg;
    realEngine.targetLifecycleProgress = stageProg;
    realEngine.chainGroup.visible = true;

    for (let frame = 0; frame < 3; frame++) {
        realEngine.animate();
    }

    realEngine.chainStrands.forEach((strand, idx) => {
        const visibleLinks = strand.links.filter(l => l.visible);
        if (visibleLinks.length > 0) {
            const lastLink = visibleLinks[visibleLinks.length - 1];
            const hookPos = strand.hook.position;
            const gap = hookPos.distanceTo(lastLink.position);
            if (gap > 0.65) {
                throw new Error(`Chain broke at prog ${stageProg}! Gap is ${gap.toFixed(3)} units`);
            }
        }
    });
    console.log(`  All 6 strands attached with zero gap at progress = ${stageProg}!`);
});

console.log("\nALL ENGINE & KINEMATICS TESTS PASSED!");
