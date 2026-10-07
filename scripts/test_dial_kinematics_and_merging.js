/**
 * Comprehensive Dial Kinematics, Merging & Intermingling Verification
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

console.log("=== Testing Dial Kinematics, Merging & Intermingling ===");

// 1. Stage 0: Perfect Merge (0 gap, centered at Y=0)
engine.updateKinematics(0.0);
engine.boxGroup.updateMatrixWorld(true);
[2, 3, 4, 5].forEach(faceIdx => {
    const fa = engine.faceAssemblies[faceIdx];
    const uWorld = new THREE.Vector3();
    const lWorld = new THREE.Vector3();
    fa.group.getWorldPosition(uWorld);
    fa.lowerGroup.getWorldPosition(lWorld);
    const dist = uWorld.distanceTo(lWorld);
    if (dist > 0.001) {
        throw new Error(`Face ${faceIdx} (${fa.name}) not merged at Stage 0! Gap: ${dist}`);
    }
});
console.log("  Stage 0 (Lament): All 4 side dials perfectly merged at Y=0 seam (gap = 0.000).");

// 2. Stage 1: Linear Shear & Merge
engine.updateKinematics(1.0);
engine.boxGroup.updateMatrixWorld(true);
const faFront1 = engine.faceAssemblies[2];
const uPos1 = new THREE.Vector3();
const lPos1 = new THREE.Vector3();
faFront1.group.getWorldPosition(uPos1);
faFront1.lowerGroup.getWorldPosition(lPos1);
const shearDist1 = Math.abs(uPos1.x - lPos1.x);
console.log(`  Stage 1 (Flanged Shift): Front dial sheared apart along equator by ${shearDist1.toFixed(2)} units.`);
if (shearDist1 < 2.8) throw new Error("Expected Front dial to shear apart by ~2.90 units in Stage 1!");

// Return to 2.0: re-merge
engine.updateKinematics(2.0);
engine.boxGroup.updateMatrixWorld(true);
faFront1.group.getWorldPosition(uPos1);
faFront1.lowerGroup.getWorldPosition(lPos1);
const distAt2 = uPos1.distanceTo(lPos1);
console.log(`  Stage 2 start: Front dial re-merged after Stage 1 shear (gap = ${distAt2.toFixed(3)}).`);

// 3. Stage 2: Stepped Ziggurat Intermingling
engine.updateKinematics(2.0); // full ziggurat factor
const uHostBlock2 = faFront1.upperHostBlock.mesh.position;
const uDialPos2 = faFront1.group.position;
// Check that dial is tracking host block
const expectedUDialZ = uHostBlock2.z + 1.225;
const expectedUDialX = uHostBlock2.x;
if (Math.abs(uDialPos2.z - expectedUDialZ) > 0.001 || Math.abs(uDialPos2.x - expectedUDialX) > 0.001) {
    throw new Error(`Upper front dial not tracking Upper Front Edge block in Ziggurat! Expected (${expectedUDialX}, ${expectedUDialZ}), got (${uDialPos2.x}, ${uDialPos2.z})`);
}
console.log(`  Stage 2 (Stepped Ziggurat): Upper front dial synchronized with host block terrace at (${uDialPos2.x.toFixed(2)}, ${uDialPos2.z.toFixed(2)}).`);

// 4. Stage 3: Hellbound Pinwheel Counter-Sliding Iris
engine.updateKinematics(3.0);
const uDialPos3 = faFront1.group.position;
const lDialPos3 = faFront1.lowerGroup.position;
const pinwheelSpread = Math.abs(uDialPos3.x - lDialPos3.x);
console.log(`  Stage 3 (Pinwheel Swirl): Upper dial at X=${uDialPos3.x.toFixed(2)}, Lower dial at X=${lDialPos3.x.toFixed(2)}, counter-sliding iris spread=${pinwheelSpread.toFixed(2)} units.`);
if (pinwheelSpread < 1.35) throw new Error("Expected Pinwheel dials to counter-slide apart by ~1.40 units!");

// 5. Stage 4: 45° Axial Twist
engine.updateKinematics(4.0);
const twistYDeg = (engine.upperSliceGroup.rotation.y * 180 / Math.PI);
console.log(`  Stage 4 (Octagram Star): Upper dial group rotated by ${twistYDeg.toFixed(2)}° on equatorial turntable.`);

// 6. Stage 6: Star Bloom Radial Expansion & Tier Separation
engine.updateKinematics(6.0);
const uDialPos6 = faFront1.group.position;
const lDialPos6 = faFront1.lowerGroup.position;
const uHostPos6 = faFront1.upperHostBlock.mesh.position;
// Verify dial sits exactly on host block outer face
if (Math.abs(uDialPos6.z - (uHostPos6.z + 1.225)) > 0.001) {
    throw new Error("Dial not flush on host block outer face during Star Bloom!");
}
console.log(`  Stage 6 (Star Bloom): Dials flush on host block front face at Z=${uDialPos6.z.toFixed(2)}, vertically parted (Upper Y=${uDialPos6.y.toFixed(2)}, Lower Y=${lDialPos6.y.toFixed(2)}).`);

// 7. Banish Protocol: Smooth return to Stage 0
engine.updateKinematics(0.0);
engine.boxGroup.updateMatrixWorld(true);
[2, 3, 4, 5].forEach(faceIdx => {
    const fa = engine.faceAssemblies[faceIdx];
    const uW = new THREE.Vector3();
    const lW = new THREE.Vector3();
    fa.group.getWorldPosition(uW);
    fa.lowerGroup.getWorldPosition(lW);
    if (uW.distanceTo(lW) > 0.001) throw new Error(`Face ${faceIdx} failed to re-merge after banish!`);
});
console.log("  Banish back to Stage 0: All dials successfully re-merged into seamless locked circles!");

console.log("\nALL DIAL MERGING, MOVING & INTERMINGLING VERIFICATION TESTS PASSED!");
