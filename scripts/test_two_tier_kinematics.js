/**
 * Verification of 2-Tier Configuration (Elimination of Triple-Level Middle Stranding)
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

const mockCanvas = {
    clientWidth: 800,
    clientHeight: 600,
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    style: {}
};

THREE.WebGLRenderer = class MockRenderer {
    constructor() { this.domElement = mockCanvas; }
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
};

const engine = new LemarchandEngine(mockCanvas);
const token = LemarchandTraits.resolveTraits(1);
engine.buildBox(token);

console.log("=== Testing Stage 9 Gateway Climax Two-Tier Integrity ===");
engine.updateKinematics(9.0);

// 1. Verify all 16 puzzle blocks
let upperBlockY = null;
let lowerBlockY = null;

engine.puzzleBlocks.forEach((b, idx) => {
    if (b.tier === 'UPPER') {
        if (b.mesh.position.y < 4.5) throw new Error(`Upper block ${idx} Y=${b.mesh.position.y} is too low!`);
        upperBlockY = b.mesh.position.y;
    } else {
        if (b.mesh.position.y > -4.5) throw new Error(`Lower block ${idx} Y=${b.mesh.position.y} is too high!`);
        lowerBlockY = b.mesh.position.y;
    }
});
console.log(`  Block Heights: Upper=${upperBlockY.toFixed(2)}, Lower=${lowerBlockY.toFixed(2)}`);

// 2. Verify Corner Linkages and Edge Rails follow block heights exactly (no stranded mid-level at ±1.75)
engine.puzzleBlocks.forEach((b, idx) => {
    if (b.linkage) {
        const linkY = b.linkage.group.position.y;
        if (Math.abs(linkY - b.mesh.position.y) > 0.001) {
            throw new Error(`Block ${idx} linkage group Y (${linkY}) does not match block mesh Y (${b.mesh.position.y})!`);
        }
        if (Math.abs(linkY - 1.75) < 0.1 || Math.abs(linkY + 1.75) < 0.1) {
            throw new Error(`Block ${idx} linkage is stranded at initial Y=±1.75!`);
        }
    }
    if (b.rail) {
        const railY = b.rail.group.position.y;
        if (Math.abs(railY - b.mesh.position.y) > 0.001) {
            throw new Error(`Block ${idx} rail group Y (${railY}) does not match block mesh Y (${b.mesh.position.y})!`);
        }
        if (Math.abs(railY - 1.75) < 0.1 || Math.abs(railY + 1.75) < 0.1) {
            throw new Error(`Block ${idx} rail is stranded at initial Y=±1.75!`);
        }
    }
});
console.log("  All 8 corner linkages and 8 edge rails match host block heights in lockstep.");

// 3. Verify side pistons are concealed at Stage 9, top/bottom axial pistons visible
engine.pistonAssemblies.forEach((pa, idx) => {
    if (idx === 0 || idx === 1) {
        if (!pa.sleeve.visible || !pa.rod.visible) {
            throw new Error(`Axial piston ${idx} should be visible at Stage 9!`);
        }
    } else {
        if (pa.sleeve.visible || pa.rod.visible) {
            throw new Error(`Side piston ${idx} should be concealed at Stage 9!`);
        }
    }
});
console.log("  Midsection side pistons properly concealed; axial top/bottom pistons active.");

// 4. Verify turntable bearing concealed at Stage 9
if (engine.turntableAssembly.lowerStator.visible || engine.turntableAssembly.upperRotor.visible) {
    throw new Error("Turntable assembly should be concealed at Stage 9 during gateway opening!");
}
console.log("  Equatorial turntable bearing concealed during supernatural chasm opening.");

// 5. Verify turntable bearing IS visible at Stage 0 to 4
engine.updateKinematics(4.0);
if (!engine.turntableAssembly.lowerStator.visible || !engine.turntableAssembly.upperRotor.visible) {
    throw new Error("Turntable assembly should be visible at Stage 4!");
}
console.log("  Equatorial turntable bearing visible during Stage 4 45-degree twist.");

console.log("\nALL TWO-TIER VERIFICATION CHECKS PASSED PERFECTLY!");
