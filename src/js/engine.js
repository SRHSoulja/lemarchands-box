/**
 * Lemarchand's Box - High-Fidelity 3D Mechanical & Magical Kinematic Engine
 * 
 * Features:
 * 1. DYNAMIC CAMERA AUTO-DOLLY: Automatically backs off as the box blooms & chains descend
 *    (Distance 15.0 closed -> 26.5 in Gateway Climax), giving an epic wide view of the spectacle!
 * 2. OCCULT MAGIC RUNE RINGS: Concentric glowing Enochian/Leviathan rings floating & spinning in 3D.
 * 3. VOLUMETRIC CORE GODRAYS: Radiant light shafts projecting outward through the open apertures.
 * 4. PENDULUM LIVING CHAINS: Fluid physics sway on descending celestial chains with barbed hooks.
 * 5. ROTATING GEARS & NESTED CORE: 4 spinning antique brass clockwork wheels & nested singularity crystal.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['three'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('three'));
    } else {
        root.LemarchandEngine = factory(root.THREE);
    }
}(typeof self !== 'undefined' ? self : this, function (THREE) {

    const BOX_SIZE = 7.0;
    const HALF = BOX_SIZE / 2; // 3.5

    // Cubic Hermite smoothstep easing for silky, jerk-free kinematics
    function smoothEase(t) {
        const c = Math.max(0, Math.min(1, t));
        return c * c * (3.0 - 2.0 * c);
    }

    class CollisionResolver {
        constructor() {
            this.spheres = [];
            this.boxes = [];
            this.capsules = [];

            // Pre-allocated scratch vectors to eliminate per-frame GC allocations
            this._diff = new THREE.Vector3();
            this._local = new THREE.Vector3();
            this._ab = new THREE.Vector3();
            this._ap = new THREE.Vector3();
            this._closest = new THREE.Vector3();

            // Object pools for reusable collision shapes
            this._boxPool = [];
            this._capsulePool = [];
            this._spherePool = [];
        }

        clear() {
            this.spheres.length = 0;
            this.boxes.length = 0;
            this.capsules.length = 0;
        }

        addSphere(center, radius) {
            let s = this._spherePool[this.spheres.length];
            if (!s) {
                s = { center: new THREE.Vector3(), radius: 0 };
                this._spherePool.push(s);
            }
            s.center.copy(center);
            s.radius = radius;
            this.spheres.push(s);
        }

        addBox(center, halfSize, quat, padding = 0.25) {
            let b = this._boxPool[this.boxes.length];
            if (!b) {
                b = {
                    center: new THREE.Vector3(),
                    halfSize: new THREE.Vector3(),
                    quat: new THREE.Quaternion(),
                    invQuat: new THREE.Quaternion()
                };
                this._boxPool.push(b);
            }
            b.center.copy(center);
            b.halfSize.set(halfSize.x + padding, halfSize.y + padding, halfSize.z + padding);
            b.quat.copy(quat);
            b.invQuat.copy(quat).invert();
            this.boxes.push(b);
        }

        addCapsule(p0, p1, radius) {
            let c = this._capsulePool[this.capsules.length];
            if (!c) {
                c = { p0: new THREE.Vector3(), p1: new THREE.Vector3(), radius: 0 };
                this._capsulePool.push(c);
            }
            c.p0.copy(p0);
            c.p1.copy(p1);
            c.radius = radius;
            this.capsules.push(c);
        }

        resolve(point, linkRadius = 0.22) {
            // Mutates point in-place without new allocations
            // 1. Deflect outside spheres (central hub, collar)
            for (let i = 0; i < this.spheres.length; i++) {
                const s = this.spheres[i];
                const targetR = s.radius + linkRadius;
                const distSq = point.distanceToSquared(s.center);
                if (distSq < targetR * targetR && distSq > 1e-6) {
                    const dist = Math.sqrt(distSq);
                    this._diff.subVectors(point, s.center).multiplyScalar(1 / dist);
                    point.copy(s.center).addScaledVector(this._diff, targetR);
                }
            }

            // 2. Deflect outside capsules (piston rods)
            for (let i = 0; i < this.capsules.length; i++) {
                const c = this.capsules[i];
                const targetR = c.radius + linkRadius;
                this._ab.subVectors(c.p1, c.p0);
                this._ap.subVectors(point, c.p0);
                const abLenSq = this._ab.lengthSq();
                if (abLenSq > 1e-6) {
                    let t = Math.max(0, Math.min(1, this._ap.dot(this._ab) / abLenSq));
                    this._closest.copy(c.p0).addScaledVector(this._ab, t);
                    const distSq = point.distanceToSquared(this._closest);
                    if (distSq < targetR * targetR && distSq > 1e-6) {
                        const dist = Math.sqrt(distSq);
                        this._diff.subVectors(point, this._closest).multiplyScalar(1 / dist);
                        point.copy(this._closest).addScaledVector(this._diff, targetR);
                    }
                }
            }

            // 3. Deflect outside oriented bounding boxes (16 puzzle blocks + face dials)
            for (let i = 0; i < this.boxes.length; i++) {
                const b = this.boxes[i];
                this._local.subVectors(point, b.center).applyQuaternion(b.invQuat);
                const hx = b.halfSize.x + linkRadius;
                const hy = b.halfSize.y + linkRadius;
                const hz = b.halfSize.z + linkRadius;

                if (Math.abs(this._local.x) < hx && Math.abs(this._local.y) < hy && Math.abs(this._local.z) < hz) {
                    const penX = hx - Math.abs(this._local.x);
                    const penY = hy - Math.abs(this._local.y);
                    const penZ = hz - Math.abs(this._local.z);

                    if (penX <= penY && penX <= penZ) {
                        this._local.x = (this._local.x >= 0 ? hx : -hx);
                    } else if (penY <= penX && penY <= penZ) {
                        this._local.y = (this._local.y >= 0 ? hy : -hy);
                    } else {
                        this._local.z = (this._local.z >= 0 ? hz : -hz);
                    }
                    point.copy(this._local.applyQuaternion(b.quat).add(b.center));
                }
            }

            return point;
        }
    }

    class BoxEngine {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.options = options;

            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.clock = new THREE.Clock();

            // Object groups
            this.boxGroup = new THREE.Group();
            this.upperSliceGroup = new THREE.Group();
            this.lowerSliceGroup = new THREE.Group();
            this.clockworkHub = new THREE.Group();
            this.magicRingGroup = new THREE.Group();
            this.godrayGroup = new THREE.Group();
            this.chainGroup = new THREE.Group();

            this.faceAssemblies = [];
            this.pistonAssemblies = [];
            this.puzzleBlocks = [];
            this.topHub = null;
            this.bottomHub = null;
            this.gears = [];
            this.magicRings = [];
            this.godrays = [];
            this.chainStrands = [];
            this.collisionResolver = new CollisionResolver();
            this.interactiveDials = [];
            this.sacrificialBlades = [];
            this.cornerLinkages = [];
            this.edgeRails = [];
            this.turntableAssembly = null;
            this.relicPlaques = [];
            this.enshrinedRelics = [];

            // Pre-allocated scratch vectors to eliminate per-frame GC allocations
            this._scratchOffset = new THREE.Vector3();
            this._scratchQuat = new THREE.Quaternion();
            this._tempPos = new THREE.Vector3();
            this._tempQuat = new THREE.Quaternion();
            this._zeroVec = new THREE.Vector3(0, 0, 0);
            this._dialHalfSize = new THREE.Vector3(1.10, 1.10, 0.25);
            this._defaultHalfSize = new THREE.Vector3(1.2, 1.75, 1.2);
            this._blockHalfSize = new THREE.Vector3();
            this._chainPos = new THREE.Vector3();
            this._hookPos = new THREE.Vector3();
            this._dialUpperOffset = new THREE.Vector3();
            this._dialLowerOffset = new THREE.Vector3();
            this._unitX = new THREE.Vector3(1, 0, 0);
            this._unitY = new THREE.Vector3(0, 1, 0);
            this._unitZ = new THREE.Vector3(0, 0, 1);

            this.coreMesh = null;
            this.coreCage = null;
            this.portalVortex = null;
            this.coreLight = null;
            this.dustParticles = null;

            // Multi-Stage Kinematic Progress (0.0 to 5.0)
            this.lifecycleProgress = 0.0;
            this.targetLifecycleProgress = 0.0;
            this.currentStage = 0;

            // Dynamic Camera Auto-Dolly:
            // Stage 0 (Closed Cube): 15.0 (Hero close-up)
            // Stage 1 (Dial Aligned): 15.8
            // Stage 2 (Shifted Slice): 18.2
            // Stage 3 (Star Bloom): 22.0
            // Stage 4 (Cenobite Gateway): 26.5 (Epic wide view showing full chains & magic rings)
            this.userZoomOffset = 0.0;
            this.baseDistance = 15.0;
            this.cameraDistance = 15.0;
            this.targetCameraDistance = 15.0;

            // Orbit controls state with physical momentum & polar protection
            this.isDragging = false;
            this.previousMousePosition = { x: 0, y: 0 };
            this.targetRotation = { x: 0.45, y: -0.68 };
            this.currentRotation = { x: 0.45, y: -0.68 };
            this.targetLookAt = new THREE.Vector3(0, 0, 0);
            this.currentLookAt = new THREE.Vector3(0, 0, 0);
            this.angularVelocity = { x: 0, y: 0 };
            this.autoRotate = true;
            this.autoRotateSpeed = 0.002;
            this.idleTimer = 0.0;
            this.autoRotateBlend = 0.0;
            this.touchPinchDist = 0;

            // Interactive Face Hover & Click State
            this.hoveredFaceIndex = -1;
            this.onFaceHover = null;
            this.onFaceUnhover = null;
            this.onDialClick = null;
            this.interactiveDials = [];
            this.interactiveTargets = [];

            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();

            this.currentTraits = null;
            this.magicEnabled = true;

            this.init();
        }

        init() {
            // 1. Scene setup
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x060508, 0.022);

            // 2. Camera setup
            const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
            this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
            this.camera.position.set(0, 4, this.cameraDistance);

            // 3. Renderer setup
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.15;

            // 4. Lighting setup
            this.setupLighting();

            // 5. Structure Hierarchy
            this.scene.add(this.boxGroup);
            this.boxGroup.add(this.clockworkHub);
            this.boxGroup.add(this.upperSliceGroup);
            this.boxGroup.add(this.lowerSliceGroup);
            this.boxGroup.add(this.magicRingGroup);
            this.boxGroup.add(this.godrayGroup);
            this.boxGroup.add(this.chainGroup);

            // 6. Chamber Dust
            this.setupDust();

            // 7. Event Handlers
            this.setupEvents();

            // 8. Render Loop
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
        }

        setupLighting() {
            this.ambientLight = new THREE.AmbientLight(0x241d18, 0.85);
            this.scene.add(this.ambientLight);

            this.keyLight = new THREE.DirectionalLight(0xffeedd, 1.5);
            this.keyLight.position.set(16, 22, 14);
            this.scene.add(this.keyLight);

            this.rimLight = new THREE.DirectionalLight(0x284477, 1.0);
            this.rimLight.position.set(-18, -12, -16);
            this.scene.add(this.rimLight);

            this.fillLight = new THREE.PointLight(0xff7722, 0.85, 35);
            this.fillLight.position.set(-10, 8, 10);
            this.scene.add(this.fillLight);

            this.coreLight = new THREE.PointLight(0x0088ff, 0.25, 30);
            this.coreLight.position.set(0, 0, 0);
            this.clockworkHub.add(this.coreLight);

            // Procedural IBL specular environment map (Gothic candlelit study)
            try {
                if (this.renderer && typeof THREE.PMREMGenerator === 'function') {
                    const pmremGen = new THREE.PMREMGenerator(this.renderer);
                    const envScene = new THREE.Scene();
                    const roomGeom = new THREE.BoxGeometry(20, 20, 20);
                    const roomMat = new THREE.MeshBasicMaterial({ color: 0x141110, side: THREE.BackSide });
                    envScene.add(new THREE.Mesh(roomGeom, roomMat));

                    const candle1 = new THREE.PointLight(0xffaa44, 2.5, 20);
                    candle1.position.set(6, 4, 6);
                    envScene.add(candle1);

                    const candle2 = new THREE.PointLight(0xff7722, 1.8, 20);
                    candle2.position.set(-6, -3, 6);
                    envScene.add(candle2);

                    const moonAperture = new THREE.DirectionalLight(0x4466aa, 1.2);
                    moonAperture.position.set(-5, 10, -8);
                    envScene.add(moonAperture);

                    const envTarget = pmremGen.fromScene(envScene, 0.04);
                    this.scene.environment = envTarget.texture;
                    pmremGen.dispose();
                }
            } catch (e) {
                // Ignore if WebGL context doesn't support float render targets in mock tests
            }
        }

        setupDust() {
            const count = 350;
            const geom = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            const velocities = new Float32Array(count * 3);

            for (let i = 0; i < count; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 35;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
                velocities[i * 3] = (Math.random() - 0.5) * 0.006;
                velocities[i * 3 + 1] = 0.003 + Math.random() * 0.006; // gentle rising atmospheric drift
                velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
            }

            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this._dustVelocities = velocities;

            const mat = new THREE.PointsMaterial({
                color: 0xd4af37,
                size: 0.12,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending
            });

            this.dustParticles = new THREE.Points(geom, mat);
            this.scene.add(this.dustParticles);
        }

        // Build central circular dial & brass bezel assembly
        createDialAssembly(faceIndex, dialRadius, frontMat, brassTrimMat) {
            const dialBezelMat = brassTrimMat.clone();

            if (faceIndex === 0 || faceIndex === 1) { // TOP & BOTTOM: intact complete circles
                const dialGroup = new THREE.Group();
                const segments = 36;
                const dialGeom = new THREE.CircleGeometry(dialRadius, segments);
                const uv = dialGeom.attributes.uv;
                const pos = dialGeom.attributes.position;

                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const y = pos.getY(i);
                    uv.setXY(i, 0.5 + (x / BOX_SIZE), 0.5 + (y / BOX_SIZE));
                }
                uv.needsUpdate = true;

                const dialMesh = new THREE.Mesh(dialGeom, frontMat);
                dialMesh.position.set(0, 0, 0.005);
                dialMesh.userData = { isDial: true, faceIndex };

                const bezelGeom = new THREE.TorusGeometry(dialRadius, 0.042, 8, segments);
                const bezelMesh = new THREE.Mesh(bezelGeom, dialBezelMat);
                bezelMesh.position.set(0, 0, 0.008);
                bezelMesh.userData = { isDial: true, faceIndex };

                dialGroup.add(dialMesh);
                dialGroup.add(bezelMesh);

                return {
                    group: dialGroup,
                    lowerGroup: null,
                    dialMesh,
                    lowerDialMesh: null,
                    bezelMesh,
                    lowerBezelMesh: null,
                    dialBezelMat
                };
            }

            // SIDES (2, 3, 4, 5): mathematically split along the equatorial cut Y = 0
            // Upper semicircle (Y >= 0): attached to upper slice
            const upperGroup = new THREE.Group();
            const upperDialGeom = new THREE.CircleGeometry(dialRadius, 36, 0, Math.PI);
            const uPos = upperDialGeom.attributes.position;
            const uUv = upperDialGeom.attributes.uv;
            for (let i = 0; i < uPos.count; i++) {
                const x = uPos.getX(i);
                const y = uPos.getY(i);
                uUv.setXY(i, 0.5 + (x / BOX_SIZE), 0.5 + (y / BOX_SIZE));
            }
            uUv.needsUpdate = true;

            const upperDialMesh = new THREE.Mesh(upperDialGeom, frontMat);
            upperDialMesh.position.set(0, 0, 0.005);
            upperDialMesh.userData = { isDial: true, faceIndex };

            const upperBezelGeom = new THREE.TorusGeometry(dialRadius, 0.042, 8, 18, Math.PI);
            const upperBezelMesh = new THREE.Mesh(upperBezelGeom, dialBezelMat);
            upperBezelMesh.position.set(0, 0, 0.008);
            upperBezelMesh.userData = { isDial: true, faceIndex };

            // Machined brass lap-joint rebate trim along equatorial cut line Y = 0
            const upperSeamGeom = new THREE.BoxGeometry(dialRadius * 2, 0.024, 0.006);
            const upperSeamMesh = new THREE.Mesh(upperSeamGeom, dialBezelMat);
            upperSeamMesh.position.set(0, 0.012, 0.007);
            upperSeamMesh.userData = { isDial: true, faceIndex };

            upperGroup.add(upperDialMesh);
            upperGroup.add(upperBezelMesh);
            upperGroup.add(upperSeamMesh);

            // Lower semicircle (Y <= 0): attached to lower slice
            const lowerGroup = new THREE.Group();
            const lowerDialGeom = new THREE.CircleGeometry(dialRadius, 36, Math.PI, Math.PI);
            const lPos = lowerDialGeom.attributes.position;
            const lUv = lowerDialGeom.attributes.uv;
            for (let i = 0; i < lPos.count; i++) {
                const x = lPos.getX(i);
                const y = lPos.getY(i);
                lUv.setXY(i, 0.5 + (x / BOX_SIZE), 0.5 + (y / BOX_SIZE));
            }
            lUv.needsUpdate = true;

            const lowerDialMesh = new THREE.Mesh(lowerDialGeom, frontMat);
            lowerDialMesh.position.set(0, 0, 0.005);
            lowerDialMesh.userData = { isDial: true, faceIndex };

            const lowerBezelGeom = new THREE.TorusGeometry(dialRadius, 0.042, 8, 18, Math.PI);
            lowerBezelGeom.rotateZ(Math.PI);
            const lowerBezelMesh = new THREE.Mesh(lowerBezelGeom, dialBezelMat);
            lowerBezelMesh.position.set(0, 0, 0.008);
            lowerBezelMesh.userData = { isDial: true, faceIndex };

            // Machined brass lap-joint rebate trim along equatorial cut line Y = 0
            const lowerSeamGeom = new THREE.BoxGeometry(dialRadius * 2, 0.024, 0.006);
            const lowerSeamMesh = new THREE.Mesh(lowerSeamGeom, dialBezelMat);
            lowerSeamMesh.position.set(0, -0.012, 0.007);
            lowerSeamMesh.userData = { isDial: true, faceIndex };

            lowerGroup.add(lowerDialMesh);
            lowerGroup.add(lowerBezelMesh);
            lowerGroup.add(lowerSeamMesh);

            return {
                group: upperGroup,
                lowerGroup: lowerGroup,
                dialMesh: upperDialMesh,
                lowerDialMesh: lowerDialMesh,
                bezelMesh: upperBezelMesh,
                lowerBezelMesh: lowerBezelMesh,
                upperSeamMesh: upperSeamMesh,
                lowerSeamMesh: lowerSeamMesh,
                dialBezelMat
            };
        }

        disposeHierarchy(rootObject) {
            if (!rootObject) return;
            rootObject.traverse(obj => {
                if (obj.geometry && typeof obj.geometry.dispose === 'function') {
                    obj.geometry.dispose();
                }
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => this.disposeMaterial(m));
                    } else {
                        this.disposeMaterial(obj.material);
                    }
                }
            });
        }

        disposeMaterial(mat) {
            if (!mat) return;
            ['map', 'bumpMap', 'roughnessMap', 'metalnessMap', 'normalMap', 'emissiveMap', 'alphaMap'].forEach(texKey => {
                if (mat[texKey] && typeof mat[texKey].dispose === 'function') {
                    mat[texKey].dispose();
                }
            });
            if (typeof mat.dispose === 'function') {
                mat.dispose();
            }
        }

        buildBox(tokenData) {
            this.currentTraits = tokenData;

            // Fully dispose GPU VRAM resources before clearing scene graph
            [this.upperSliceGroup, this.lowerSliceGroup, this.clockworkHub,
             this.magicRingGroup, this.godrayGroup, this.chainGroup].forEach(grp => {
                this.disposeHierarchy(grp);
                while (grp.children.length > 0) grp.remove(grp.children[0]);
            });

            this.faceAssemblies = [];
            this.pistonAssemblies = [];
            this.puzzleBlocks = [];
            this.gears = [];
            this.magicRings = [];
            this.godrays = [];
            this.chainStrands = [];
            this.interactiveDials = [];
            this.sacrificialBlades = [];
            this.cornerLinkages = [];
            this.edgeRails = [];
            this.turntableAssembly = null;
            this.relicPlaques = [];
            this.topHub = null;
            this.bottomHub = null;

            const vis = (tokenData && tokenData.visualParameters) || {
                fogColor: 0x050406,
                ambientColor: 0x221a16
            };

            if (this.scene && this.scene.fog) {
                this.scene.fog.color.set(vis.fogColor);
            }
            if (this.renderer && typeof this.renderer.setClearColor === 'function') {
                this.renderer.setClearColor(vis.fogColor);
            }
            if (this.ambientLight) {
                this.ambientLight.color.set(vis.ambientColor);
            }

            const darkSteelMat = new THREE.MeshStandardMaterial({
                color: 0x141316,
                metalness: 0.88,
                roughness: 0.32
            });

            const antiqueBrassMat = new THREE.MeshStandardMaterial({
                color: 0xd4af37,
                metalness: 0.94,
                roughness: 0.20
            });

            const agedCopperMat = new THREE.MeshStandardMaterial({
                color: 0xc86d51,
                metalness: 0.90,
                roughness: 0.25
            });

            const damascusSteelMat = new THREE.MeshStandardMaterial({
                color: 0x24262e,
                metalness: 0.88,
                roughness: 0.34
            });

            const burnishedBronzeMat = new THREE.MeshStandardMaterial({
                color: 0x8a6234,
                metalness: 0.92,
                roughness: 0.28
            });

            const roseGoldMat = new THREE.MeshStandardMaterial({
                color: 0xdfa052,
                metalness: 0.95,
                roughness: 0.18
            });

            // 1. Central Clockwork Mechanical Hub & Simon Sayce Resonance Bell
            const hubSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.88, 24, 24),
                darkSteelMat
            );
            this.clockworkHub.add(hubSphere);

            // Simon Sayce Central Brass Resonance Bell Assembly (1987 Attic sequence prop)
            this.bellGroup = new THREE.Group();
            const bellCylinderGeom = new THREE.CylinderGeometry(0.58, 0.58, 1.20, 32, 1, true);
            const bellCylinder = new THREE.Mesh(bellCylinderGeom, antiqueBrassMat);
            this.bellGroup.add(bellCylinder);

            // Knurled Bronze Collars
            const bellCollarGeom = new THREE.TorusGeometry(0.59, 0.040, 12, 32);
            const topCollar = new THREE.Mesh(bellCollarGeom, burnishedBronzeMat);
            topCollar.position.y = 0.55;
            topCollar.rotation.x = Math.PI / 2;
            this.bellGroup.add(topCollar);

            const btmCollar = new THREE.Mesh(bellCollarGeom, burnishedBronzeMat);
            btmCollar.position.y = -0.55;
            btmCollar.rotation.x = Math.PI / 2;
            this.bellGroup.add(btmCollar);

            // Central Suspended Clapper Pendulum
            const clapperRod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.70, 12),
                damascusSteelMat
            );
            clapperRod.position.y = 0.12;
            this.bellGroup.add(clapperRod);

            const clapperSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                agedCopperMat
            );
            clapperSphere.position.y = -0.20;
            this.bellGroup.add(clapperSphere);

            // Longitudinal Resonance Slit Plates
            for (let s = 0; s < 4; s++) {
                const slitGeom = new THREE.BoxGeometry(0.03, 0.70, 0.10);
                const slitMesh = new THREE.Mesh(slitGeom, damascusSteelMat);
                const slitAngle = (s * Math.PI) / 2;
                slitMesh.position.set(Math.cos(slitAngle) * 0.58, 0, Math.sin(slitAngle) * 0.58);
                slitMesh.rotation.y = slitAngle;
                this.bellGroup.add(slitMesh);
            }
            this.clockworkHub.add(this.bellGroup);

            // 8 Multi-Axis Antique Clockwork Mechanisms (Dimensioned to fit cavity R <= 1.02)
            this.gears = [];

            // Mechanism 0: Large Spoked Sun Wheel (Horizontal, Y-axis)
            const sunGroup = new THREE.Group();
            const sunRim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.035, 8, 36), antiqueBrassMat);
            sunRim.rotation.x = Math.PI / 2;
            sunGroup.add(sunRim);
            for (let sp = 0; sp < 6; sp++) {
                const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.94, 8), antiqueBrassMat);
                spoke.rotation.y = (sp * Math.PI) / 6;
                spoke.rotation.z = Math.PI / 2;
                sunGroup.add(spoke);
            }
            this.clockworkHub.add(sunGroup);
            this.gears.push({ mesh: sunGroup, axis: 'y', baseSpeed: 0.012, pulseSpeed: 0 });

            // Mechanism 1: Contrate / Crown Gear (Engaging perpendicularly, X-axis)
            const crownGeom = new THREE.CylinderGeometry(0.90, 0.90, 0.06, 28);
            crownGeom.rotateZ(Math.PI / 2);
            const crownMesh = new THREE.Mesh(crownGeom, agedCopperMat);
            this.clockworkHub.add(crownMesh);
            this.gears.push({ mesh: crownMesh, axis: 'x', baseSpeed: -0.018, pulseSpeed: 0 });

            // Mechanism 2: Planetary Escapement Wheel (Z-axis)
            const escGeom = new THREE.CylinderGeometry(0.94, 0.94, 0.06, 24);
            escGeom.rotateX(Math.PI / 2);
            const escMesh = new THREE.Mesh(escGeom, burnishedBronzeMat);
            this.clockworkHub.add(escMesh);
            this.gears.push({ mesh: escMesh, axis: 'z', baseSpeed: 0.016, pulseSpeed: 0 });

            // Mechanism 3: Geneva / Maltese Escapement Wheel (Y-axis counter)
            const genevaGroup = new THREE.Group();
            const genevaGeom = new THREE.CylinderGeometry(0.70, 0.70, 0.05, 4);
            const genevaMesh = new THREE.Mesh(genevaGeom, damascusSteelMat);
            genevaGroup.add(genevaMesh);
            this.clockworkHub.add(genevaGroup);
            this.gears.push({ mesh: genevaGroup, axis: 'y', baseSpeed: -0.022, pulseSpeed: 0 });

            // Mechanism 4: Astrolabe Horizon Calibrated Ring (Z-axis)
            const astroRingGeom = new THREE.TorusGeometry(0.98, 0.025, 8, 48);
            const astroRingMesh = new THREE.Mesh(astroRingGeom, roseGoldMat);
            this.clockworkHub.add(astroRingMesh);
            this.gears.push({ mesh: astroRingMesh, axis: 'z', baseSpeed: -0.009, pulseSpeed: 0 });

            // Mechanism 5: Concentric Celestial Meridian Ring (X-axis)
            const meridianGeom = new THREE.TorusGeometry(0.92, 0.025, 8, 48);
            meridianGeom.rotateY(Math.PI / 2);
            const meridianMesh = new THREE.Mesh(meridianGeom, agedCopperMat);
            this.clockworkHub.add(meridianMesh);
            this.gears.push({ mesh: meridianMesh, axis: 'x', baseSpeed: 0.014, pulseSpeed: 0 });

            // Mechanism 6: Satellite Pinion Cog Alpha (X-axis offset)
            const pinionAGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16);
            pinionAGeom.rotateZ(Math.PI / 2);
            const pinionAMesh = new THREE.Mesh(pinionAGeom, antiqueBrassMat);
            pinionAMesh.position.set(0, 0.70, 0.55);
            this.clockworkHub.add(pinionAMesh);
            this.gears.push({ mesh: pinionAMesh, axis: 'x', baseSpeed: 0.032, pulseSpeed: 0 });

            // Mechanism 7: Satellite Pinion Cog Beta (Z-axis offset)
            const pinionBGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16);
            pinionBGeom.rotateX(Math.PI / 2);
            const pinionBMesh = new THREE.Mesh(pinionBGeom, damascusSteelMat);
            pinionBMesh.position.set(0.55, -0.70, 0);
            this.clockworkHub.add(pinionBMesh);
            this.gears.push({ mesh: pinionBMesh, axis: 'z', baseSpeed: -0.035, pulseSpeed: 0 });

            // Curved Copper Conduits linking Core to Cavity Quadrants (Spiral bounds R <= 0.95)
            for (let c = 0; c < 4; c++) {
                const conduitAngle = (c * Math.PI / 2) + (Math.PI / 4);
                const curve = new THREE.QuadraticBezierCurve3(
                    new THREE.Vector3(Math.cos(conduitAngle) * 0.45, 0, Math.sin(conduitAngle) * 0.45),
                    new THREE.Vector3(Math.cos(conduitAngle) * 0.70, (c % 2 === 0 ? 0.70 : -0.70), Math.sin(conduitAngle) * 0.70),
                    new THREE.Vector3(Math.cos(conduitAngle) * 0.95, (c % 2 === 0 ? 1.40 : -1.40), Math.sin(conduitAngle) * 0.95)
                );
                const conduitGeom = new THREE.TubeGeometry(curve, 16, 0.035, 8, false);
                const conduitMesh = new THREE.Mesh(conduitGeom, agedCopperMat);
                this.clockworkHub.add(conduitMesh);
            }

            // Singularity Core: Inner crystal + outer golden wireframe cage
            const coreGeom = new THREE.DodecahedronGeometry(0.48, 0);
            const coreMat = new THREE.MeshStandardMaterial({
                color: vis.coreColor,
                emissive: vis.coreGlowColor,
                emissiveIntensity: 0.95,
                roughness: 0.1,
                metalness: 0.9
            });
            this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
            this.clockworkHub.add(this.coreMesh);

            const cageGeom = new THREE.IcosahedronGeometry(0.70, 0);
            const cageMat = new THREE.MeshBasicMaterial({
                color: 0xd4af37,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
            this.coreCage = new THREE.Mesh(cageGeom, cageMat);
            this.clockworkHub.add(this.coreCage);

            this.coreLight = new THREE.PointLight(vis.coreGlowColor, 0.25, 30);
            this.clockworkHub.add(this.coreLight);

            // Chain Anchor Collar & Void Vortex deep inside the central core
            const anchorCollarGeom = new THREE.TorusGeometry(0.72, 0.10, 8, 24);
            const anchorCollar = new THREE.Mesh(anchorCollarGeom, darkSteelMat);
            this.clockworkHub.add(anchorCollar);

            const vortexGeom = new THREE.TorusGeometry(0.88, 0.10, 12, 32);
            const vortexMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(vis.coreGlowColor),
                emissive: new THREE.Color(vis.coreGlowColor),
                emissiveIntensity: 1.2,
                roughness: 0.15,
                metalness: 0.95
            });
            this.portalVortex = new THREE.Mesh(vortexGeom, vortexMat);
            this.portalVortex.scale.set(0.001, 0.001, 0.001);
            this.clockworkHub.add(this.portalVortex);

            // 2. Generate PBR Face Materials and Internal Chassis Dovetail Material
            const faceMats = [];
            const faceConfigs = [
                { id: 0, name: "TOP", normal: new THREE.Vector3(0, 1, 0), rot: [-Math.PI / 2, 0, 0], slice: "UPPER" },
                { id: 1, name: "BOTTOM", normal: new THREE.Vector3(0, -1, 0), rot: [Math.PI / 2, 0, 0], slice: "LOWER" },
                { id: 2, name: "FRONT", normal: new THREE.Vector3(0, 0, 1), rot: [0, 0, 0], slice: "UPPER" },
                { id: 3, name: "BACK", normal: new THREE.Vector3(0, 0, -1), rot: [0, Math.PI, 0], slice: "LOWER" },
                { id: 4, name: "RIGHT", normal: new THREE.Vector3(1, 0, 0), rot: [0, Math.PI / 2, 0], slice: "UPPER" },
                { id: 5, name: "LEFT", normal: new THREE.Vector3(-1, 0, 0), rot: [0, -Math.PI / 2, 0], slice: "LOWER" }
            ];

            faceConfigs.forEach((fc, idx) => {
                const texData = LemarchandTextures.generateFaceTexture(idx, {
                    woodColor: vis.woodColor,
                    metalColor: vis.metalColor,
                    metalness: vis.metalness,
                    roughness: vis.metalRoughness
                });
                faceMats.push(new THREE.MeshPhysicalMaterial({
                    map: texData.diffuse,
                    normalMap: texData.normal,
                    normalScale: new THREE.Vector2(0.75, 0.75),
                    bumpMap: texData.bump,
                    bumpScale: texData.materialParams.bumpScale,
                    roughnessMap: texData.roughnessMap,
                    metalness: texData.materialParams.metalness,
                    roughness: texData.materialParams.roughness,
                    clearcoat: 0.94,
                    clearcoatRoughness: 0.10
                }));
            });

            // 4 Concealed Ceremonial Brass Sacrifice Blades with Scabbards (Stage 7 Liminal Monolith Extension)
            this.sacrificialBlades = [];
            const bladeGeom = new THREE.BoxGeometry(0.10, 0.85, 0.30);
            const bladeMat = new THREE.MeshStandardMaterial({
                color: 0xdfb438,
                metalness: 0.95,
                roughness: 0.18
            });

            const scabbardGeom = new THREE.BoxGeometry(0.20, 0.36, 0.65);

            const bladeOffsets = [
                { dir: new THREE.Vector3(1, 0, 0), rot: [0, 0, Math.PI / 2] },
                { dir: new THREE.Vector3(-1, 0, 0), rot: [0, 0, -Math.PI / 2] },
                { dir: new THREE.Vector3(0, 0, 1), rot: [Math.PI / 2, 0, 0] },
                { dir: new THREE.Vector3(0, 0, -1), rot: [-Math.PI / 2, 0, 0] }
            ];

            bladeOffsets.forEach(bo => {
                const scabbardMesh = new THREE.Mesh(scabbardGeom, darkSteelMat);
                scabbardMesh.position.copy(bo.dir).multiplyScalar(0.48);
                scabbardMesh.rotation.set(bo.rot[0], bo.rot[1], bo.rot[2]);
                scabbardMesh.visible = false;
                scabbardMesh.raycast = () => {};
                this.clockworkHub.add(scabbardMesh);

                const bladeMesh = new THREE.Mesh(bladeGeom, bladeMat);
                bladeMesh.position.copy(bo.dir).multiplyScalar(0.48); // Concealed inside core hub cavity (R <= 0.92)
                bladeMesh.rotation.set(bo.rot[0], bo.rot[1], bo.rot[2]);
                bladeMesh.visible = false; // Concealed until Stage 7
                bladeMesh.userData = { isBlade: true };
                this.clockworkHub.add(bladeMesh);
                this.sacrificialBlades.push({
                    mesh: bladeMesh,
                    scabbard: scabbardMesh,
                    basePos: bladeMesh.position.clone(),
                    dir: bo.dir.clone()
                });
            });

            const chassisTex = LemarchandTextures.generateInternalChassisTexture();
            const chassisDovetailMat = new THREE.MeshStandardMaterial({
                map: chassisTex.diffuse,
                bumpMap: chassisTex.bump,
                bumpScale: chassisTex.materialParams.bumpScale,
                metalness: chassisTex.materialParams.metalness,
                roughness: 0.26,
                color: 0x24242c
            });

            const escapementTex = LemarchandTextures.generateEscapementPlateTexture();
            const chassisEscapementMat = new THREE.MeshStandardMaterial({
                map: escapementTex.diffuse,
                bumpMap: escapementTex.bump,
                bumpScale: escapementTex.materialParams.bumpScale,
                metalness: escapementTex.materialParams.metalness,
                roughness: escapementTex.materialParams.roughness
            });

            const conduitTex = LemarchandTextures.generateOccultConduitTexture();
            const chassisConduitMat = new THREE.MeshStandardMaterial({
                map: conduitTex.diffuse,
                bumpMap: conduitTex.bump,
                bumpScale: conduitTex.materialParams.bumpScale,
                metalness: conduitTex.materialParams.metalness,
                roughness: conduitTex.materialParams.roughness
            });

            const turntableTex = LemarchandTextures.generateTurntableTexture();
            const turntableMat = new THREE.MeshStandardMaterial({
                map: turntableTex.diffuse,
                bumpMap: turntableTex.bump,
                bumpScale: turntableTex.materialParams.bumpScale,
                metalness: turntableTex.materialParams.metalness,
                roughness: turntableTex.materialParams.roughness
            });

            // 3. Construct 16-Block Interlocking Mechanical Chassis
            // Bounds [-3.5, 3.5]^3, Corner size 2.45, Center width 2.10, Tier height 3.50
            const Wc = 2.45;
            const Wm = 2.10;
            const H = 3.50;
            const groupToFaceId = [4, 5, 0, 1, 2, 3]; // +X, -X, +Y, -Y, +Z, -Z

            const createBlock = (tier, type, cx, cy, cz, w, h, d, moveDir, tiltAxis) => {
                const geom = new THREE.BoxGeometry(w, h, d);
                const pos = geom.attributes.position;
                const uv = geom.attributes.uv;
                const index = geom.index;

                const isOuter = [
                    Math.abs((cx + w / 2) - HALF) < 0.02, // +X
                    Math.abs((cx - w / 2) + HALF) < 0.02, // -X
                    Math.abs((cy + h / 2) - HALF) < 0.02, // +Y
                    Math.abs((cy - h / 2) + HALF) < 0.02, // -Y
                    Math.abs((cz + d / 2) - HALF) < 0.02, // +Z
                    Math.abs((cz - d / 2) + HALF) < 0.02  // -Z
                ];

                const blockMaterials = [];
                const faceMap = [];

                for (let g = 0; g < 6; g++) {
                    if (isOuter[g]) {
                        const fId = groupToFaceId[g];
                        blockMaterials.push(faceMats[fId]);
                        faceMap.push(fId);

                        const start = geom.groups[g].start;
                        const count = geom.groups[g].count;
                        for (let i = 0; i < count; i++) {
                            const v = index.getX(start + i);
                            const X = cx + pos.getX(v);
                            const Y = cy + pos.getY(v);
                            const Z = cz + pos.getZ(v);
                            let u = 0, vCoord = 0;
                            if (g === 0) { u = (HALF - Z) / BOX_SIZE; vCoord = (Y + HALF) / BOX_SIZE; }
                            else if (g === 1) { u = (Z + HALF) / BOX_SIZE; vCoord = (Y + HALF) / BOX_SIZE; }
                            else if (g === 2) { u = (X + HALF) / BOX_SIZE; vCoord = (HALF - Z) / BOX_SIZE; }
                            else if (g === 3) { u = (X + HALF) / BOX_SIZE; vCoord = (Z + HALF) / BOX_SIZE; }
                            else if (g === 4) { u = (X + HALF) / BOX_SIZE; vCoord = (Y + HALF) / BOX_SIZE; }
                            else if (g === 5) { u = (HALF - X) / BOX_SIZE; vCoord = (Y + HALF) / BOX_SIZE; }
                            uv.setXY(v, u, vCoord);
                        }
                    } else {
                        // Varied internal chassis anatomy based on block face role:
                        // 1. Sliding equatorial interface (Y=0 dividing planes): Machined Dovetail Brass Rails
                        // 2. Center-facing interior walls (facing central clockwork & bell): Horological Escapement Plates with Ruby Jewels
                        // 3. Lateral inter-block partitioning walls: Damascus Steel Occult Hydraulic Conduits
                        let internalMat = chassisConduitMat;
                        if ((tier === "UPPER" && g === 3) || (tier === "LOWER" && g === 2)) {
                            // Equatorial sliding interface (Y=0)
                            internalMat = chassisDovetailMat;
                        } else {
                            const faceNormX = (g === 0) ? 1 : (g === 1 ? -1 : 0);
                            const faceNormY = (g === 2) ? 1 : (g === 3 ? -1 : 0);
                            const faceNormZ = (g === 4) ? 1 : (g === 5 ? -1 : 0);
                            const dotInward = -(faceNormX * cx + faceNormY * cy + faceNormZ * cz);
                            if (dotInward > 0.35) {
                                internalMat = chassisEscapementMat;
                            } else {
                                internalMat = (type === 'CORNER') ? chassisDovetailMat : chassisConduitMat;
                            }
                        }
                        blockMaterials.push(internalMat);
                        faceMap.push(-1);
                    }
                }
                uv.needsUpdate = true;

                const mesh = new THREE.Mesh(geom, blockMaterials);
                mesh.position.set(cx, cy, cz);
                mesh.userData = {
                    isPuzzleBlock: true,
                    tier: tier,
                    type: type,
                    faceMap: faceMap
                };

                const parent = (tier === "UPPER") ? this.upperSliceGroup : this.lowerSliceGroup;
                parent.add(mesh);

                this.puzzleBlocks.push({
                    mesh: mesh,
                    tier: tier,
                    type: type,
                    initialPos: new THREE.Vector3(cx, cy, cz),
                    moveDir: moveDir.clone().normalize(),
                    tiltAxis: tiltAxis ? tiltAxis.clone().normalize() : null
                });

                return mesh;
            };

            // Upper Tier Blocks (Y center = +1.75)
            createBlock("UPPER", "CORNER", 2.275, 1.75, 2.275, Wc, H, Wc, new THREE.Vector3(1, 0, 1), new THREE.Vector3(1, 0, -1));
            createBlock("UPPER", "CORNER", -2.275, 1.75, 2.275, Wc, H, Wc, new THREE.Vector3(-1, 0, 1), new THREE.Vector3(-1, 0, -1));
            createBlock("UPPER", "CORNER", 2.275, 1.75, -2.275, Wc, H, Wc, new THREE.Vector3(1, 0, -1), new THREE.Vector3(1, 0, 1));
            createBlock("UPPER", "CORNER", -2.275, 1.75, -2.275, Wc, H, Wc, new THREE.Vector3(-1, 0, -1), new THREE.Vector3(-1, 0, 1));

            createBlock("UPPER", "EDGE", 0, 1.75, 2.275, Wm, H, Wc, new THREE.Vector3(0, 0, 1), null);
            createBlock("UPPER", "EDGE", 0, 1.75, -2.275, Wm, H, Wc, new THREE.Vector3(0, 0, -1), null);
            createBlock("UPPER", "EDGE", 2.275, 1.75, 0, Wc, H, Wm, new THREE.Vector3(1, 0, 0), null);
            createBlock("UPPER", "EDGE", -2.275, 1.75, 0, Wc, H, Wm, new THREE.Vector3(-1, 0, 0), null);

            // Lower Tier Blocks (Y center = -1.75)
            createBlock("LOWER", "CORNER", 2.275, -1.75, 2.275, Wc, H, Wc, new THREE.Vector3(1, 0, 1), new THREE.Vector3(1, 0, -1));
            createBlock("LOWER", "CORNER", -2.275, -1.75, 2.275, Wc, H, Wc, new THREE.Vector3(-1, 0, 1), new THREE.Vector3(-1, 0, -1));
            createBlock("LOWER", "CORNER", 2.275, -1.75, -2.275, Wc, H, Wc, new THREE.Vector3(1, 0, -1), new THREE.Vector3(1, 0, 1));
            createBlock("LOWER", "CORNER", -2.275, -1.75, -2.275, Wc, H, Wc, new THREE.Vector3(-1, 0, -1), new THREE.Vector3(-1, 0, 1));

            createBlock("LOWER", "EDGE", 0, -1.75, 2.275, Wm, H, Wc, new THREE.Vector3(0, 0, 1), null);
            createBlock("LOWER", "EDGE", 0, -1.75, -2.275, Wm, H, Wc, new THREE.Vector3(0, 0, -1), null);
            createBlock("LOWER", "EDGE", 2.275, -1.75, 0, Wc, H, Wm, new THREE.Vector3(1, 0, 0), null);
            createBlock("LOWER", "EDGE", -2.275, -1.75, 0, Wc, H, Wm, new THREE.Vector3(-1, 0, 0), null);

            // Pre-computed kinematic offsets for iconic movie mechanical configurations (zero runtime allocation)
            this._zigguratOffsets = [
                // Upper Tier (0-7): Diagonal staircase terraces (Frank Cotton Attic 1987)
                new THREE.Vector3(1.0, 0, 1.0).normalize().multiplyScalar(1.45),   // 0: Corner (+X, +Z)
                new THREE.Vector3(0, 0, 0),                                         // 1: Corner (-X, +Z)
                new THREE.Vector3(0, 0, 0),                                         // 2: Corner (+X, -Z)
                new THREE.Vector3(-1.0, 0, -1.0).normalize().multiplyScalar(1.45),  // 3: Corner (-X, -Z)
                new THREE.Vector3(1.0, 0, 1.0).normalize().multiplyScalar(0.72),   // 4: Edge (+Z)
                new THREE.Vector3(-1.0, 0, -1.0).normalize().multiplyScalar(0.72),  // 5: Edge (-Z)
                new THREE.Vector3(1.0, 0, 1.0).normalize().multiplyScalar(0.72),   // 6: Edge (+X)
                new THREE.Vector3(-1.0, 0, -1.0).normalize().multiplyScalar(0.72),  // 7: Edge (-X)
                // Lower Tier (8-15): Counter-diagonal terraces
                new THREE.Vector3(0, 0, 0),                                         // 8: Corner (+X, +Z)
                new THREE.Vector3(-1.0, 0, 1.0).normalize().multiplyScalar(1.45),  // 9: Corner (-X, +Z)
                new THREE.Vector3(1.0, 0, -1.0).normalize().multiplyScalar(1.45),  // 10: Corner (+X, -Z)
                new THREE.Vector3(0, 0, 0),                                         // 11: Corner (-X, -Z)
                new THREE.Vector3(-1.0, 0, 1.0).normalize().multiplyScalar(0.72),  // 12: Edge (+Z)
                new THREE.Vector3(1.0, 0, -1.0).normalize().multiplyScalar(0.72),  // 13: Edge (-Z)
                new THREE.Vector3(1.0, 0, -1.0).normalize().multiplyScalar(0.72),  // 14: Edge (+X)
                new THREE.Vector3(-1.0, 0, 1.0).normalize().multiplyScalar(0.72)   // 15: Edge (-X)
            ];

            this._pinwheelOffsets = [
                // Upper Tier (0-7): Interlocking Clockwise Pinwheel Windmill (Tiffany Hellbound 1988)
                // All 4 corners expand outward diagonally to clear dovetail channels
                new THREE.Vector3(1.0, 0, 1.0).normalize().multiplyScalar(1.45),   // 0: Corner (+X, +Z)
                new THREE.Vector3(-1.0, 0, 1.0).normalize().multiplyScalar(1.45),  // 1: Corner (-X, +Z)
                new THREE.Vector3(1.0, 0, -1.0).normalize().multiplyScalar(1.45),  // 2: Corner (+X, -Z)
                new THREE.Vector3(-1.0, 0, -1.0).normalize().multiplyScalar(1.45), // 3: Corner (-X, -Z)
                new THREE.Vector3(-0.70, 0, 0),                                     // 4: Edge (+Z) -> slides into vacated channel
                new THREE.Vector3(0.70, 0, 0),                                      // 5: Edge (-Z)
                new THREE.Vector3(0, 0, 0.70),                                      // 6: Edge (+X)
                new THREE.Vector3(0, 0, -0.70),                                     // 7: Edge (-X)
                // Lower Tier (8-15): Counter-clockwise Pinwheel Windmill
                new THREE.Vector3(1.0, 0, 1.0).normalize().multiplyScalar(1.45),   // 8: Corner (+X, +Z)
                new THREE.Vector3(-1.0, 0, 1.0).normalize().multiplyScalar(1.45),  // 9: Corner (-X, +Z)
                new THREE.Vector3(1.0, 0, -1.0).normalize().multiplyScalar(1.45),  // 10: Corner (+X, -Z)
                new THREE.Vector3(-1.0, 0, -1.0).normalize().multiplyScalar(1.45), // 11: Corner (-X, -Z)
                new THREE.Vector3(0.70, 0, 0),                                      // 12: Edge (+Z)
                new THREE.Vector3(-0.70, 0, 0),                                     // 13: Edge (-Z)
                new THREE.Vector3(0, 0, -0.70),                                     // 14: Edge (+X)
                new THREE.Vector3(0, 0, 0.70)                                       // 15: Edge (-X)
            ];

            // 4. Articulated Mechanical Linkages, Guide Rails, and Equatorial Turntable Bearing
            // A. 8 Articulated Corner Linkages (Telescoping Strut & Pinned Clevis Joints)
            this.cornerLinkages = [];
            this.edgeRails = [];
            this.puzzleBlocks.forEach(b => {
                if (b.type === 'CORNER') {
                    const parent = (b.tier === "UPPER") ? this.upperSliceGroup : this.lowerSliceGroup;
                    const linkageGroup = new THREE.Group();
                    // Anchor base mount on internal chassis frame
                    linkageGroup.position.set(
                        b.initialPos.x * 0.38,
                        b.initialPos.y,
                        b.initialPos.z * 0.38
                    );

                    // Orient coordinate system: local +Z points along moveDir, local +X along tiltAxis
                    const m4 = new THREE.Matrix4();
                    const upAxis = new THREE.Vector3(0, 1, 0);
                    const zAxis = b.moveDir.clone().normalize();
                    const xAxis = b.tiltAxis ? b.tiltAxis.clone().normalize() : new THREE.Vector3().crossVectors(upAxis, zAxis).normalize();
                    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
                    m4.makeBasis(xAxis, yAxis, zAxis);
                    linkageGroup.quaternion.setFromRotationMatrix(m4);

                    // Fluted Antique Brass Outer Sleeve
                    const sleeveGeom = new THREE.CylinderGeometry(0.12, 0.14, 1.10, 12);
                    sleeveGeom.rotateX(Math.PI / 2);
                    const sleeveMesh = new THREE.Mesh(sleeveGeom, antiqueBrassMat);
                    sleeveMesh.position.set(0, 0, 0.55);
                    sleeveMesh.raycast = () => {};
                    linkageGroup.add(sleeveMesh);

                    // Sliding Polished Piston Ram
                    const ramGeom = new THREE.CylinderGeometry(0.075, 0.075, 1.40, 12);
                    ramGeom.rotateX(Math.PI / 2);
                    const ramMesh = new THREE.Mesh(ramGeom, burnishedBronzeMat);
                    ramMesh.position.set(0, 0, 0.85);
                    ramMesh.raycast = () => {};
                    linkageGroup.add(ramMesh);

                    // Articulated Clevis Fork Head with Transverse Hinge Pin
                    const clevisGroup = new THREE.Group();
                    clevisGroup.position.set(0, 0, 1.55);

                    const clevisGeom = new THREE.BoxGeometry(0.18, 0.22, 0.16);
                    const clevisMesh = new THREE.Mesh(clevisGeom, antiqueBrassMat);
                    clevisMesh.raycast = () => {};
                    clevisGroup.add(clevisMesh);

                    const pinGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8);
                    pinGeom.rotateZ(Math.PI / 2);
                    const pinMesh = new THREE.Mesh(pinGeom, darkSteelMat);
                    pinMesh.raycast = () => {};
                    clevisGroup.add(pinMesh);

                    linkageGroup.add(clevisGroup);
                    linkageGroup.visible = false;
                    parent.add(linkageGroup);

                    const linkageObj = {
                        group: linkageGroup,
                        sleeve: sleeveMesh,
                        ram: ramMesh,
                        clevis: clevisGroup
                    };
                    b.linkage = linkageObj;
                    this.cornerLinkages.push(linkageObj);
                } else if (b.type === 'EDGE') {
                    // B. 8 Machined Brass Dovetail Guide Rails for Edge Blocks
                    const parent = (b.tier === "UPPER") ? this.upperSliceGroup : this.lowerSliceGroup;
                    const railGroup = new THREE.Group();
                    railGroup.position.copy(b.initialPos).sub(b.moveDir.clone().multiplyScalar(1.10));
                    railGroup.lookAt(railGroup.position.clone().add(b.moveDir));

                    const railGeom = new THREE.BoxGeometry(0.36, 0.22, 1.80);
                    railGeom.rotateX(Math.PI / 2);
                    const railMesh = new THREE.Mesh(railGeom, antiqueBrassMat);
                    railMesh.position.set(0, 0, 0.90);
                    railMesh.raycast = () => {};
                    railGroup.add(railMesh);
                    railGroup.visible = false;

                    parent.add(railGroup);
                    const railObj = {
                        group: railGroup,
                        rail: railMesh
                    };
                    b.rail = railObj;
                    this.edgeRails.push(railObj);
                }
            });

            // C. Heavy Antique Brass Equatorial Turntable Bearing Assembly at Y = 0
            // Lower Stator Ring (attached to lowerSliceGroup at Y = -0.015)
            const lowerStatorGroup = new THREE.Group();
            lowerStatorGroup.position.set(0, -0.015, 0);

            const statorDiscGeom = new THREE.CylinderGeometry(2.42, 2.42, 0.03, 48);
            const statorDisc = new THREE.Mesh(statorDiscGeom, turntableMat);
            statorDisc.raycast = () => {};
            lowerStatorGroup.add(statorDisc);

            // Ball Bearings in circular raceway (R = 1.75)
            const ballGeom = new THREE.SphereGeometry(0.045, 8, 8);
            for (let i = 0; i < 16; i++) {
                const ang = (i / 16) * Math.PI * 2;
                const ball = new THREE.Mesh(ballGeom, darkSteelMat);
                ball.position.set(Math.cos(ang) * 1.75, 0.02, Math.sin(ang) * 1.75);
                ball.raycast = () => {};
                lowerStatorGroup.add(ball);
            }

            // 8 Radial Detent Stops at 45° intervals
            const detentGeom = new THREE.BoxGeometry(0.12, 0.035, 0.22);
            for (let d = 0; d < 8; d++) {
                const ang = (d / 8) * Math.PI * 2;
                const stop = new THREE.Mesh(detentGeom, antiqueBrassMat);
                stop.position.set(Math.cos(ang) * 2.22, 0.02, Math.sin(ang) * 2.22);
                stop.rotation.y = -ang;
                stop.raycast = () => {};
                lowerStatorGroup.add(stop);
            }
            this.lowerSliceGroup.add(lowerStatorGroup);

            // Upper Rotor Ring (attached to upperSliceGroup at Y = 0.015)
            const upperRotorGroup = new THREE.Group();
            upperRotorGroup.position.set(0, 0.015, 0);

            const rotorDiscGeom = new THREE.CylinderGeometry(2.38, 2.38, 0.03, 48);
            const rotorDisc = new THREE.Mesh(rotorDiscGeom, turntableMat);
            rotorDisc.raycast = () => {};
            upperRotorGroup.add(rotorDisc);

            // Linear Dovetail Guide Rails along X-axis (two parallel brass rails at Z = ±0.52)
            const railBarGeom = new THREE.BoxGeometry(4.60, 0.035, 0.07);
            const rail1 = new THREE.Mesh(railBarGeom, antiqueBrassMat);
            rail1.position.set(0, -0.018, 0.52);
            rail1.raycast = () => {};
            upperRotorGroup.add(rail1);

            const rail2 = new THREE.Mesh(railBarGeom, antiqueBrassMat);
            rail2.position.set(0, -0.018, -0.52);
            rail2.raycast = () => {};
            upperRotorGroup.add(rail2);

            // 2 Spring-Loaded Detent Index Pawls at 0° and 180°
            const pawlGeom = new THREE.BoxGeometry(0.10, 0.035, 0.18);
            const pawl1 = new THREE.Mesh(pawlGeom, burnishedBronzeMat);
            pawl1.position.set(2.22, -0.018, 0);
            pawl1.raycast = () => {};
            upperRotorGroup.add(pawl1);

            const pawl2 = new THREE.Mesh(pawlGeom, burnishedBronzeMat);
            pawl2.position.set(-2.22, -0.018, 0);
            pawl2.raycast = () => {};
            upperRotorGroup.add(pawl2);

            this.upperSliceGroup.add(upperRotorGroup);

            this.turntableAssembly = {
                lowerStator: lowerStatorGroup,
                upperRotor: upperRotorGroup
            };

            // 4.5 Mount Enshrined Reliquary Cameo Assemblies on Key Drawers
            this.relicPlaques = [];
            const drawerIndices = [0, 3, 9, 10]; // 4 Alternating Key Drawers
            drawerIndices.forEach((bIdx, rIdx) => {
                const b = this.puzzleBlocks[bIdx];
                if (!b) return;

                const reliquaryGroup = new THREE.Group();
                reliquaryGroup.name = `ReliquaryDrawer_${rIdx}`;

                // A. Antique Ornate Brass Bezel / Mounting Stand
                const frameGeom = new THREE.BoxGeometry(1.68, 1.68, 0.10);
                const frameMesh = new THREE.Mesh(frameGeom, chassisDovetailMat);
                reliquaryGroup.add(frameMesh);

                // Ornate Brass Corner Gem Studs
                const studGeom = new THREE.ConeGeometry(0.10, 0.12, 4);
                const studMat = new THREE.MeshStandardMaterial({
                    color: 0xd4af37,
                    metalness: 0.95,
                    roughness: 0.15
                });
                const studOffset = 0.74;
                [
                    [-studOffset, studOffset],
                    [studOffset, studOffset],
                    [-studOffset, -studOffset],
                    [studOffset, -studOffset]
                ].forEach(([sx, sy]) => {
                    const stud = new THREE.Mesh(studGeom, studMat);
                    stud.position.set(sx, sy, 0.055);
                    stud.rotation.x = Math.PI / 2;
                    frameMesh.add(stud);
                });

                // B. Cameo NFT Artwork Disc / Plaque
                const plaqueGeom = new THREE.PlaneGeometry(1.52, 1.52);
                let relicData = (this.enshrinedRelics && this.enshrinedRelics[rIdx]);
                if (!relicData && typeof StrayCucks !== 'undefined' && StrayCucks.getSample) {
                    const sampleIds = [527, 414, 1284, 82];
                    relicData = StrayCucks.getSample(sampleIds[rIdx % sampleIds.length]);
                }
                if (!relicData) {
                    const fallbackIds = [527, 414, 1284, 82];
                    const tid = fallbackIds[rIdx % fallbackIds.length];
                    relicData = {
                        theme: "CUCKS",
                        name: `STRAY CUCK #${tid}`,
                        id: tid
                    };
                }

                const onUpdate = () => {
                    if (plaqueMat) {
                        if (plaqueMat.map) plaqueMat.map.needsUpdate = true;
                        if (plaqueMat.emissiveMap) plaqueMat.emissiveMap.needsUpdate = true;
                        if (plaqueMat.bumpMap) plaqueMat.bumpMap.needsUpdate = true;
                        plaqueMat.needsUpdate = true;
                    }
                };

                const plaqueTex = LemarchandTextures.generateReliquaryCameoTexture(relicData, onUpdate);
                const plaqueMat = new THREE.MeshStandardMaterial({
                    map: plaqueTex.diffuse,
                    emissiveMap: plaqueTex.diffuse,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.28,
                    bumpMap: plaqueTex.bump,
                    bumpScale: 0.02,
                    metalness: 0.04,
                    roughness: 0.38,
                    side: THREE.DoubleSide
                });

                const plaqueMesh = new THREE.Mesh(plaqueGeom, plaqueMat);
                plaqueMesh.position.z = 0.055;
                frameMesh.add(plaqueMesh);

                // C. Articulated Telescoping Arm
                const armGeom = new THREE.CylinderGeometry(0.07, 0.09, 1.2, 8);
                const armMesh = new THREE.Mesh(armGeom, chassisDovetailMat);
                armMesh.position.y = -0.95;
                reliquaryGroup.add(armMesh);

                // D. Warm Reliquary Candlelight / Spotlight
                const relicLight = new THREE.PointLight(0xffdf90, 0.0, 5.5);
                relicLight.position.set(0, 0.6, 1.2);
                reliquaryGroup.add(relicLight);

                // Face outwards along b.moveDir, tilted slightly upward toward the viewer
                const faceAngle = Math.atan2(b.moveDir.x, b.moveDir.z);
                reliquaryGroup.rotation.y = faceAngle;
                reliquaryGroup.rotation.x = (b.tier === 'UPPER') ? 0.35 : -0.20;

                // Tucked in Stage 0; deployed in Stage 5+
                const baseY = (b.tier === 'UPPER') ? 1.76 : -1.76;
                reliquaryGroup.position.set(0, baseY, 0);
                reliquaryGroup.scale.set(0.001, 0.001, 0.001);
                reliquaryGroup.visible = false;

                // Disable direct raycasting to preserve interactiveTargets = 22
                frameMesh.raycast = () => {};
                plaqueMesh.raycast = () => {};
                armMesh.raycast = () => {};

                b.mesh.add(reliquaryGroup);
                this.relicPlaques.push({
                    group: reliquaryGroup,
                    frameMesh: frameMesh,
                    plaqueMesh: plaqueMesh,
                    material: plaqueMat,
                    light: relicLight,
                    blockIndex: bIdx,
                    relicIndex: rIdx,
                    tier: b.tier,
                    moveDir: b.moveDir.clone()
                });
            });

            // 5. Mount Central Circular Dial Assemblies & Telescoping Pistons
            this.topHub = new THREE.Group();
            this.upperSliceGroup.add(this.topHub);

            // Solid Core Plug for Top Hub: perfectly seals the 2.10 x 2.10 central opening on the TOP face
            const topPlugGeom = new THREE.BoxGeometry(Wm, 0.40, Wm);
            const topPlugPos = topPlugGeom.attributes.position;
            const topPlugUv = topPlugGeom.attributes.uv;
            const topPlugIdx = topPlugGeom.index;
            const g2Start = topPlugGeom.groups[2].start;
            const g2Count = topPlugGeom.groups[2].count;
            for (let i = 0; i < g2Count; i++) {
                const v = topPlugIdx.getX(g2Start + i);
                const X = topPlugPos.getX(v);
                const Z = topPlugPos.getZ(v);
                const u = (X + HALF) / BOX_SIZE;
                const vCoord = (HALF - Z) / BOX_SIZE;
                topPlugUv.setXY(v, u, vCoord);
            }
            topPlugUv.needsUpdate = true;
            const topPlugMats = [
                chassisDovetailMat,
                chassisDovetailMat,
                faceMats[0],
                chassisEscapementMat,
                chassisDovetailMat,
                chassisDovetailMat
            ];
            const topHubPlug = new THREE.Mesh(topPlugGeom, topPlugMats);
            topHubPlug.position.set(0, HALF - 0.20, 0); // Top face flush at Y = 3.50
            topHubPlug.userData = { faceIndex: 0 };
            this.topHub.add(topHubPlug);

            this.bottomHub = new THREE.Group();
            this.lowerSliceGroup.add(this.bottomHub);

            // Solid Core Plug for Bottom Hub: perfectly seals the 2.10 x 2.10 central opening on the BOTTOM face
            const btmPlugGeom = new THREE.BoxGeometry(Wm, 0.40, Wm);
            const btmPlugPos = btmPlugGeom.attributes.position;
            const btmPlugUv = btmPlugGeom.attributes.uv;
            const btmPlugIdx = btmPlugGeom.index;
            const g3Start = btmPlugGeom.groups[3].start;
            const g3Count = btmPlugGeom.groups[3].count;
            for (let i = 0; i < g3Count; i++) {
                const v = btmPlugIdx.getX(g3Start + i);
                const X = btmPlugPos.getX(v);
                const Z = btmPlugPos.getZ(v);
                const u = (X + HALF) / BOX_SIZE;
                const vCoord = (Z + HALF) / BOX_SIZE;
                btmPlugUv.setXY(v, u, vCoord);
            }
            btmPlugUv.needsUpdate = true;
            const btmPlugMats = [
                chassisDovetailMat,
                chassisDovetailMat,
                chassisEscapementMat,
                faceMats[1],
                chassisDovetailMat,
                chassisDovetailMat
            ];
            const bottomHubPlug = new THREE.Mesh(btmPlugGeom, btmPlugMats);
            bottomHubPlug.position.set(0, -HALF + 0.20, 0); // Bottom face flush at Y = -3.50
            bottomHubPlug.userData = { faceIndex: 1 };
            this.bottomHub.add(bottomHubPlug);

            faceConfigs.forEach((fc, idx) => {
                const dialRadius = 1.04;
                const dialAssembly = this.createDialAssembly(idx, dialRadius, faceMats[idx], antiqueBrassMat);

                if (idx === 0) { // TOP
                    dialAssembly.group.position.set(0, HALF, 0);
                    dialAssembly.group.rotation.set(-Math.PI / 2, 0, 0);
                    this.topHub.add(dialAssembly.group);
                } else if (idx === 1) { // BOTTOM
                    dialAssembly.group.position.set(0, -HALF, 0);
                    dialAssembly.group.rotation.set(Math.PI / 2, 0, 0);
                    this.bottomHub.add(dialAssembly.group);
                } else { // SIDES: mathematically split along equatorial seam Y=0
                    dialAssembly.group.position.copy(fc.normal.clone().multiplyScalar(HALF));
                    dialAssembly.group.rotation.set(fc.rot[0], fc.rot[1], fc.rot[2]);
                    this.upperSliceGroup.add(dialAssembly.group);

                    dialAssembly.lowerGroup.position.copy(fc.normal.clone().multiplyScalar(HALF));
                    dialAssembly.lowerGroup.rotation.set(fc.rot[0], fc.rot[1], fc.rot[2]);
                    this.lowerSliceGroup.add(dialAssembly.lowerGroup);
                }

                // Telescoping Piston: compact within hub cavity (R <= 0.85) when closed
                const sleeveLength = 0.70;
                const sleeveGeom = new THREE.CylinderGeometry(0.20, 0.22, sleeveLength, 16);
                sleeveGeom.rotateX(Math.PI / 2);
                const sleeveMesh = new THREE.Mesh(sleeveGeom, darkSteelMat);
                sleeveMesh.position.copy(fc.normal.clone().multiplyScalar(0.48));
                sleeveMesh.lookAt(fc.normal.clone().multiplyScalar(10));
                sleeveMesh.visible = false; // Concealed until Stage 6 Star Bloom
                this.clockworkHub.add(sleeveMesh);

                const rodLength = 1.0;
                const rodGeom = new THREE.CylinderGeometry(0.12, 0.12, rodLength, 16);
                rodGeom.rotateX(Math.PI / 2);
                const rodMesh = new THREE.Mesh(rodGeom, antiqueBrassMat);
                rodMesh.position.copy(fc.normal.clone().multiplyScalar(0.48));
                rodMesh.lookAt(fc.normal.clone().multiplyScalar(10));
                rodMesh.visible = false; // Concealed until Stage 6 Star Bloom
                this.clockworkHub.add(rodMesh);

                this.pistonAssemblies.push({
                    normal: fc.normal,
                    sleeve: sleeveMesh,
                    rod: rodMesh,
                    initialRodPos: rodMesh.position.clone()
                });

                let upperHostBlock = null;
                let lowerHostBlock = null;
                if (idx === 2) { upperHostBlock = this.puzzleBlocks[4]; lowerHostBlock = this.puzzleBlocks[12]; }
                else if (idx === 3) { upperHostBlock = this.puzzleBlocks[5]; lowerHostBlock = this.puzzleBlocks[13]; }
                else if (idx === 4) { upperHostBlock = this.puzzleBlocks[6]; lowerHostBlock = this.puzzleBlocks[14]; }
                else if (idx === 5) { upperHostBlock = this.puzzleBlocks[7]; lowerHostBlock = this.puzzleBlocks[15]; }

                this.faceAssemblies.push({
                    id: idx,
                    name: fc.name,
                    normal: fc.normal,
                    group: dialAssembly.group,
                    lowerGroup: dialAssembly.lowerGroup,
                    dial: dialAssembly.dialMesh,
                    lowerDial: dialAssembly.lowerDialMesh,
                    bezelMesh: dialAssembly.bezelMesh,
                    lowerBezelMesh: dialAssembly.lowerBezelMesh,
                    upperSeamMesh: dialAssembly.upperSeamMesh,
                    lowerSeamMesh: dialAssembly.lowerSeamMesh,
                    dialBezelMat: dialAssembly.dialBezelMat,
                    upperHostBlock: upperHostBlock,
                    lowerHostBlock: lowerHostBlock,
                    initialPos: dialAssembly.group.position.clone(),
                    initialRot: dialAssembly.group.rotation.clone(),
                    dialAngle: 0,
                    targetDialAngle: 0,
                    isJiggling: false,
                    jiggleStart: 0,
                    glowFlashUntil: 0
                });
            });

            // Pre-populate interactive dial meshes for accelerated raycasting
            this.interactiveDials = this.faceAssemblies.map(fa => fa.dial);
            this.interactiveTargets = [...this.interactiveDials, ...this.puzzleBlocks.map(b => b.mesh)];

            // 6. Volumetric Core Godray Beams streaming through the 8 open star chasms
            const beamLength = 18.0;
            const rayGeom = new THREE.CylinderGeometry(0.06, 0.72, beamLength, 16, 1, true);
            rayGeom.translate(0, beamLength / 2, 0); // Apex at (0, 0, 0)

            const chasmDirs = [
                new THREE.Vector3(1.0, 0.45, 0.45).normalize(),
                new THREE.Vector3(-1.0, 0.45, 0.45).normalize(),
                new THREE.Vector3(1.0, 0.45, -0.45).normalize(),
                new THREE.Vector3(-1.0, 0.45, -0.45).normalize(),
                new THREE.Vector3(1.0, -0.45, 0.45).normalize(),
                new THREE.Vector3(-1.0, -0.45, 0.45).normalize(),
                new THREE.Vector3(1.0, -0.45, -0.45).normalize(),
                new THREE.Vector3(-1.0, -0.45, -0.45).normalize()
            ];

            chasmDirs.forEach(dir => {
                const rayMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(vis.coreGlowColor),
                    transparent: true,
                    opacity: 0.0,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
                const rayMesh = new THREE.Mesh(rayGeom, rayMat);
                rayMesh.position.set(0, 0, 0);
                rayMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                rayMesh.raycast = () => {};
                this.godrayGroup.add(rayMesh);
                this.godrays.push(rayMesh);
            });

            // 3. Build Glowing Occult Magic Rune Rings
            this.buildMagicRings(vis.coreGlowColor);

            // 4. Build Celestial Chains
            this.buildChains();

            // ALWAYS INITIALIZE AS 100% CLOSED NORMAL CUBE (progress = 0)
            this.lifecycleProgress = 0.0;
            this.targetLifecycleProgress = 0.0;
            this.currentStage = 0;
            this.updateKinematics(0.0);
        }

        // Build Concentric Occult Rune Rings (Enochian Gyroscope)
        buildMagicRings(glowColor) {
            const runeTex = LemarchandTextures.generateMagicRuneTexture(glowColor);

            const ring1Geom = new THREE.RingGeometry(6.5, 8.8, 64);
            const ring1Mat = new THREE.MeshBasicMaterial({
                map: runeTex,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
            ring1.rotation.x = Math.PI / 2; // Horizontal
            ring1.raycast = () => {};
            this.magicRingGroup.add(ring1);

            const ring2Geom = new THREE.RingGeometry(8.5, 11.2, 64);
            const ring2Mat = new THREE.MeshBasicMaterial({
                map: runeTex,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
            ring2.rotation.x = Math.PI / 4;
            ring2.rotation.y = Math.PI / 6;
            ring2.raycast = () => {};
            this.magicRingGroup.add(ring2);

            this.magicRings = [
                { mesh: ring1, speed: 0.005 },
                { mesh: ring2, speed: -0.007 }
            ];
        }

        buildChains() {
            while (this.chainGroup.children.length > 0) this.chainGroup.remove(this.chainGroup.children[0]);
            this.chainStrands = [];

            const chainMat = new THREE.MeshStandardMaterial({
                color: 0x90949d,
                metalness: 0.94,
                roughness: 0.26
            });

            const linkGeom = new THREE.TorusGeometry(0.32, 0.08, 8, 16);
            const linkCount = 28;

            // 6 menacing trajectories bursting outward through wide-open star chasms
            const chainDirections = [
                new THREE.Vector3(0.92, 0.22, 0.35).normalize(),   // Upper Right-Front Chasm
                new THREE.Vector3(-0.92, 0.22, 0.35).normalize(),  // Upper Left-Front Chasm
                new THREE.Vector3(0.92, -0.22, -0.35).normalize(), // Lower Right-Back Chasm
                new THREE.Vector3(-0.92, -0.22, -0.35).normalize(),// Lower Left-Back Chasm
                new THREE.Vector3(0.35, 0.95, -0.35).normalize(),  // Top Zenith Aperture
                new THREE.Vector3(-0.35, -0.95, 0.35).normalize()  // Bottom Nadir Aperture
            ];

            chainDirections.forEach((dir, strandIndex) => {
                const chainStrand = new THREE.Group();
                const strandLinks = [];

                for (let i = 0; i < linkCount; i++) {
                    const link = new THREE.Mesh(linkGeom, chainMat);
                    link.scale.set(0.95, 1.35, 0.95);
                    link.raycast = () => {};
                    link.visible = false;
                    link.position.copy(dir.clone().multiplyScalar(1.35));
                    chainStrand.add(link);
                    strandLinks.push(link);
                }

                // Authentic Cenobite Barbed Meat Hook - Interlocked with last chain link
                const hookGroup = new THREE.Group();
                
                // Interlocking eyelet ring
                const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 16), chainMat);
                hookGroup.add(eyelet);

                // Heavy swivel collar
                const swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.30, 12), chainMat);
                swivel.position.set(0, 0.22, 0);
                hookGroup.add(swivel);

                // Curved sickle blade
                const hookBlade = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 10, 24, Math.PI * 1.35), chainMat);
                hookBlade.rotation.z = Math.PI / 2;
                hookBlade.position.set(0.28, 0.46, 0);
                hookGroup.add(hookBlade);

                // Sharp barb cone
                const barb = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 8), chainMat);
                barb.position.set(0.68, 0.06, 0);
                barb.rotation.z = -Math.PI / 3;
                hookGroup.add(barb);

                hookGroup.traverse(c => { c.raycast = () => {}; });
                hookGroup.visible = false;
                chainStrand.add(hookGroup);

                this.chainGroup.add(chainStrand);

                // Basis vectors for serpentine wave perpendicular to dir
                const up = Math.abs(dir.y) < 0.95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
                const tangentX = new THREE.Vector3().crossVectors(dir, up).normalize();
                const tangentY = new THREE.Vector3().crossVectors(dir, tangentX).normalize();

                this.chainStrands.push({
                    group: chainStrand,
                    dir: dir,
                    tangentX: tangentX,
                    tangentY: tangentY,
                    links: strandLinks,
                    hook: hookGroup,
                    strandIndex: strandIndex
                });
            });

            this.chainGroup.position.set(0, 0, 0);
            this.chainGroup.visible = false;
        }

        setLifecycleStage(stage) {
            this.currentStage = Math.max(0, Math.min(9, stage));
            this.targetLifecycleProgress = this.currentStage;
            if (this.currentStage === 0) {
                this.faceAssemblies.forEach(fa => {
                    fa.targetDialAngle = 0;
                });
            }
        }

        rotateDial(faceIndex, angleDelta = Math.PI / 2) {
            if (this.faceAssemblies[faceIndex]) {
                const face = this.faceAssemblies[faceIndex];
                face.targetDialAngle += angleDelta;
                face.glowFlashUntil = this.clock.getElapsedTime() + 0.55;
                // Whirring impulse burst to internal clockwork gears
                this.gears.forEach(g => {
                    g.pulseSpeed = (g.pulseSpeed || 0) + 0.45;
                });
            }
        }

        jiggleFaceDial(faceIndex) {
            if (this.faceAssemblies[faceIndex]) {
                const face = this.faceAssemblies[faceIndex];
                face.isJiggling = true;
                face.jiggleStart = this.clock.getElapsedTime();
            }
        }

        setEnshrinedRelics(relics) {
            this.enshrinedRelics = relics || [];
            if (this.relicPlaques && this.relicPlaques.length > 0) {
                this.relicPlaques.forEach((rp, idx) => {
                    let relic = this.enshrinedRelics[idx];
                    if (!relic && typeof StrayCucks !== 'undefined' && StrayCucks.getSample) {
                        const sampleIds = [527, 414, 1284, 82];
                        relic = StrayCucks.getSample(sampleIds[idx % sampleIds.length]);
                    }
                    if (!relic) {
                        const fallbackIds = [527, 414, 1284, 82];
                        const tid = fallbackIds[idx % fallbackIds.length];
                        relic = {
                            theme: "CUCKS",
                            name: `STRAY CUCK #${tid}`,
                            id: tid
                        };
                    }
                    const onUpdate = () => {
                        if (rp.material) {
                            if (rp.material.map) rp.material.map.needsUpdate = true;
                            if (rp.material.emissiveMap) rp.material.emissiveMap.needsUpdate = true;
                            if (rp.material.bumpMap) rp.material.bumpMap.needsUpdate = true;
                            rp.material.needsUpdate = true;
                        }
                    };
                    const texData = LemarchandTextures.generateReliquaryCameoTexture(relic, onUpdate);
                    if (rp.material) {
                        rp.material.map = texData.diffuse;
                        rp.material.emissiveMap = texData.diffuse;
                        rp.material.bumpMap = texData.bump;
                        rp.material.metalness = 0.04;
                        rp.material.roughness = 0.38;
                        rp.material.emissive = new THREE.Color(0xffffff);
                        rp.material.emissiveIntensity = 0.28;
                        rp.material.needsUpdate = true;
                    }
                });
            }
        }

        resetCamera() {
            this.targetRotation.x = 0.45;
            this.targetRotation.y = -0.68;
            this.angularVelocity.x = 0;
            this.angularVelocity.y = 0;
            this.userZoomOffset = 0.0;
            this.targetCameraDistance = this.baseDistance;
            if (this.targetLookAt) this.targetLookAt.set(0, 0, 0);
            this.idleTimer = 18.0;
            this.autoRotateBlend = 0.0;
        }

        focusFace(faceIndex) {
            this.idleTimer = 18.0; // Ample time to inspect faces without auto-rotate interruption
            this.autoRotateBlend = 0.0;
            this.angularVelocity.x = 0;
            this.angularVelocity.y = 0;
            if (this.targetLookAt) this.targetLookAt.set(0, 0, 0);

            let targetX = 0.08;
            let targetY = this.targetRotation.y;

            switch (faceIndex) {
                case 0: // TOP (Zenith - true perpendicular viewing)
                    targetX = 1.50;
                    break;
                case 1: // BOTTOM (Nadir - true perpendicular viewing)
                    targetX = -1.50;
                    break;
                case 2: // FRONT (+Z)
                    targetX = 0.08;
                    targetY = 0.0;
                    break;
                case 3: // BACK (-Z)
                    targetX = 0.08;
                    targetY = Math.PI;
                    break;
                case 4: // RIGHT (+X)
                    targetX = 0.08;
                    targetY = -Math.PI / 2;
                    break;
                case 5: // LEFT (-X)
                    targetX = 0.08;
                    targetY = Math.PI / 2;
                    break;
            }

            // Shortest arc yaw normalization to eliminate dizzying multi-revolution spin-outs
            const twoPi = Math.PI * 2;
            const currentY = this.targetRotation.y;
            const deltaY = ((targetY - currentY) % twoPi + twoPi + Math.PI) % twoPi - Math.PI;
            this.targetRotation.y = currentY + deltaY;
            this.targetRotation.x = targetX;
        }

        focusRelic(relicIndex) {
            this.idleTimer = 40.0; // Ample time to inspect relic without auto-rotate interruption
            this.autoRotateBlend = 0.0;
            this.angularVelocity.x = 0;
            this.angularVelocity.y = 0;

            const rIdx = Math.max(0, parseInt(relicIndex) || 0);
            const drawerIndices = [0, 3, 9, 10];
            const bIdx = drawerIndices[rIdx % drawerIndices.length];
            const b = this.puzzleBlocks[bIdx];
            if (!b) return;

            // Angle around Y axis pointing directly at this drawer:
            // bIdx 0 (+X, +Z): angle around Y is PI/4 (45 deg)
            // bIdx 3 (-X, -Z): angle around Y is -3*PI/4 (-135 deg)
            // bIdx 9 (-X, +Z): angle around Y is -PI/4 (-45 deg)
            // bIdx 10 (+X, -Z): angle around Y is 3*PI/4 (135 deg)
            const angleY = Math.atan2(b.initialPos.x, b.initialPos.z);
            const targetY = angleY; // Directly aligns camera facing the drawer alcove!
            const isUpper = (b.tier === 'UPPER');
            const targetX = isUpper ? 0.28 : -0.22;

            const twoPi = Math.PI * 2;
            const currentY = this.targetRotation.y;
            const deltaY = ((targetY - currentY) % twoPi + twoPi + Math.PI) % twoPi - Math.PI;
            this.targetRotation.y = currentY + deltaY;
            this.targetRotation.x = targetX;

            // Close-up framing so the enshrined artwork fills the screen
            this.userZoomOffset = -11.5;
            this.targetCameraDistance = 9.0;

            // Smoothly center the camera look-at on the deployed drawer shelf
            if (this.targetLookAt) {
                const targetPos = b.initialPos.clone().addScaledVector(b.moveDir, 1.4);
                targetPos.y += isUpper ? 1.4 : -1.4;
                this.targetLookAt.copy(targetPos);
            }
        }

        // 10-Stage Mechanical & Supernatural Kinematic Engine (Stages 0 to 9)
        updateKinematics(prog) {
            // 1. DYNAMIC CAMERA AUTO-DOLLY CALCULATION
            // 10 Stages: 0: 15.0 -> 1: 16.5 -> 2: 17.5 -> 3: 18.5 -> 4: 19.5 -> 5: 20.5 -> 6: 22.5 -> 7: 24.5 -> 8: 26.5 -> 9: 28.5
            const stageDistances = [15.0, 16.5, 17.5, 18.5, 19.5, 20.5, 22.5, 24.5, 26.5, 28.5];
            const lowerIdx = Math.floor(Math.max(0, Math.min(8.999, prog)));
            const upperIdx = Math.min(9, lowerIdx + 1);
            const frac = prog - lowerIdx;
            const d0 = stageDistances[lowerIdx] || 15.0;
            const d1 = stageDistances[upperIdx] || 28.5;

            this.baseDistance = THREE.MathUtils.lerp(d0, d1, smoothEase(frac));
            this.targetCameraDistance = this.baseDistance + this.userZoomOffset;

            // 2. Stage 0 -> 1: Top Dial Rotation & User Dial Rotation across all faces
            const dialSubProg = smoothEase(THREE.MathUtils.clamp(prog, 0, 1));
            const elapsedNow = this.clock.getElapsedTime();

            this.faceAssemblies.forEach((fa) => {
                fa.dialAngle = THREE.MathUtils.lerp(fa.dialAngle, fa.targetDialAngle, 0.16);
                const stageDialAngle = (fa.id === 0) ? (dialSubProg * Math.PI) : 0;

                // Mechanical jiggle recoil if locked
                let jiggleAngle = 0;
                let jiggleZ = 0;
                if (fa.isJiggling) {
                    const jt = elapsedNow - fa.jiggleStart;
                    if (jt < 0.35) {
                        jiggleAngle = Math.sin(jt * 38.0) * 0.12 * Math.exp(-jt * 8.5);
                        jiggleZ = Math.sin(jt * 38.0) * 0.02 * Math.exp(-jt * 8.5);
                    } else {
                        fa.isJiggling = false;
                    }
                }

                if (fa.id === 0 || fa.id === 1) {
                    // Top & Bottom complete dials rotate freely
                    fa.dial.rotation.z = stageDialAngle + fa.dialAngle + jiggleAngle;
                } else {
                    // Side dials are split along equatorial seam Y=0
                    // Tactile mechanical catch depression & vibration on click/jiggle
                    let depressZ = 0;
                    if (fa.glowFlashUntil > elapsedNow) {
                        const pressT = THREE.MathUtils.clamp((fa.glowFlashUntil - elapsedNow) / 0.55, 0, 1);
                        depressZ = Math.sin(pressT * Math.PI) * -0.015;
                    }
                    const totalZ = 0.005 + jiggleZ + depressZ;
                    fa.dial.position.z = totalZ;
                    if (fa.lowerDial) fa.lowerDial.position.z = totalZ;
                    if (fa.bezelMesh) fa.bezelMesh.position.z = totalZ + 0.003;
                    if (fa.lowerBezelMesh) fa.lowerBezelMesh.position.z = totalZ + 0.003;
                    if (fa.upperSeamMesh) fa.upperSeamMesh.position.z = totalZ + 0.002;
                    if (fa.lowerSeamMesh) fa.lowerSeamMesh.position.z = totalZ + 0.002;
                }

                // Visual materials: hover glow, unlock flash, or locked ember
                if (fa.dialBezelMat) {
                    if (fa.glowFlashUntil > elapsedNow) {
                        fa.dialBezelMat.emissive.setHex(0xffea77);
                        fa.dialBezelMat.emissiveIntensity = 0.95;
                    } else if (fa.isJiggling) {
                        fa.dialBezelMat.emissive.setHex(0xdd2233);
                        fa.dialBezelMat.emissiveIntensity = 0.85;
                    } else if (this.hoveredFaceIndex === fa.id) {
                        const pulse = 0.55 + Math.sin(elapsedNow * 6.0) * 0.25;
                        fa.dialBezelMat.emissive.setHex(0xd4af37);
                        fa.dialBezelMat.emissiveIntensity = pulse;
                    } else {
                        fa.dialBezelMat.emissive.setHex(0x000000);
                        fa.dialBezelMat.emissiveIntensity = 0;
                    }
                }

                if (fa.faceTrimMat) {
                    if (this.hoveredFaceIndex === fa.id) {
                        fa.faceTrimMat.emissive.setHex(0x9e7b24);
                        fa.faceTrimMat.emissiveIntensity = 0.24;
                    } else {
                        fa.faceTrimMat.emissive.setHex(0x000000);
                        fa.faceTrimMat.emissiveIntensity = 0;
                    }
                }
            });

            // 3. MECHANICAL PUZZLE CUBE TIER MANIPULATIONS (Stages 0 to 5)
            // Procedural mechanical concealment during sliding puzzle stages (Stages 1 to 4)
            // While the upper and lower tiers shear across the central axis, the internal core
            // is safely concealed inside the puzzle locking mechanism to preserve strict mechanical clearance.
            // As soon as the box re-aligns to square detent and drawers open (prog >= 4.25),
            // the clockwork hub becomes visible to reveal the intricate gearing within.
            const inPuzzleShear = (prog > 0.05 && prog < 4.25);
            if (this.clockworkHub) {
                this.clockworkHub.visible = !inPuzzleShear;
            }

            // Stage 0 -> 1: Primary X Flange Shift (Simon Sayce 1987)
            // Stage 1 -> 2: Stepped Ziggurat / Diagonal Staircase (Frank Cotton Attic 1987)
            // Stage 2 -> 3: Hellbound Pinwheel Windmill Swirl (Tiffany 1988)
            // Stage 3 -> 4: Axial 45° Twist (8-pointed Interlocking Star Prism on Equatorial Turntable)
            // Stage 4 -> 5: Re-align & Alternating Dovetail Key Drawers (Sliding compartments & core lift)
            let shiftX = 0;
            let shiftZ = 0;
            let twistY = 0;

            if (prog <= 1.0) {
                const p = smoothEase(Math.max(0, prog));
                shiftX = p * 1.45;
            } else if (prog <= 2.0) {
                const p = smoothEase(prog - 1.0);
                shiftX = 1.45 * (1.0 - p); // smoothly returns to 0 as Stepped Ziggurat engages
            } else if (prog > 3.0 && prog <= 4.0) {
                const p = smoothEase(prog - 3.0);
                twistY = p * (Math.PI / 4); // Exact 45 degrees twist onto turntable detents in Stage 4
            } else if (prog > 4.0 && prog <= 4.4) {
                const p = smoothEase((prog - 4.0) / 0.4);
                twistY = (Math.PI / 4) * (1.0 - p); // smoothly settles back to 0 detent before drawers open
            }

            this.upperSliceGroup.position.set(shiftX, 0, shiftZ);
            this.lowerSliceGroup.position.set(-shiftX, 0, -shiftZ);
            this.upperSliceGroup.rotation.set(0, twistY, 0);
            this.lowerSliceGroup.rotation.set(0, 0, 0); // Grounded stationary base: relative twist is exactly 45.0 degrees!

            // Stepped Ziggurat Stagger Factor (Stage 2)
            let ziggFactor = 0;
            if (prog > 1.0 && prog <= 2.0) {
                ziggFactor = smoothEase(prog - 1.0);
            } else if (prog > 2.0 && prog <= 3.0) {
                ziggFactor = 1.0 - smoothEase(prog - 2.0);
            }

            // Hellbound Pinwheel Windmill Swirl Factor (Stage 3)
            let pinwheelFactor = 0;
            if (prog > 2.0 && prog <= 3.0) {
                pinwheelFactor = smoothEase(prog - 2.0);
            } else if (prog > 3.0 && prog <= 4.0) {
                pinwheelFactor = 1.0 - smoothEase(prog - 3.0);
            }

            // Alternating Dovetail Key Drawers Factor (Stage 5)
            // Extends smoothly between 4.2 and 5.0 after the turntable locks into square alignment
            let drawerFactor = 0;
            if (prog > 4.2 && prog <= 5.0) {
                drawerFactor = smoothEase((prog - 4.2) / 0.8);
            } else if (prog > 5.0 && prog <= 6.0) {
                drawerFactor = 1.0 - smoothEase(prog - 5.0);
            }

            // 4. SUPERNATURAL TRANSMUTATION (Stages 6 to 9)
            // Stage 6: Lauder Star Bloom (Radial Separation & 8 Chasms)
            const starSubProg = smoothEase(THREE.MathUtils.clamp(prog - 5.0, 0, 1));
            const edgeDist = starSubProg * 2.0;
            const tiltAngle = starSubProg * 0.21; // ~12 degrees outward star wedge flare

            // Stage 7: Liminal Tesseract Monolith (Column Elongation & Blades)
            const tessSubProg = smoothEase(THREE.MathUtils.clamp(prog - 6.0, 0, 1));
            const tierLift = starSubProg * 1.3 + tessSubProg * 2.2;

            // Sacrificial Blades deploy through the open midsection incision only in Stage 7 (Liminal Monolith)
            this.sacrificialBlades.forEach(sb => {
                sb.mesh.visible = (prog >= 5.95);
                if (sb.scabbard) {
                    sb.scabbard.visible = (prog >= 4.25);
                }
                if (sb.mesh.visible) {
                    sb.mesh.position.copy(sb.basePos).addScaledVector(sb.dir, tessSubProg * 2.70);
                }
            });

            // Stage 8: Lazarus Leviathan Rhombus (Occult Diamond Geometry)
            const rhombSubProg = smoothEase(THREE.MathUtils.clamp(prog - 7.0, 0, 1));

            // Stage 9: Gateway Climax (Cenobite Summoning & Chains)
            const summonSubProg = smoothEase(THREE.MathUtils.clamp(prog - 8.0, 0, 1));

            // Update all 16 segmented puzzle blocks and articulated linkages
            this.puzzleBlocks.forEach((b, bIdx) => {
                const offset = this._scratchOffset;
                offset.set(0, 0, 0);

                // A. Stepped Ziggurat Stagger (Stage 2)
                if (ziggFactor > 0.001 && this._zigguratOffsets && this._zigguratOffsets[bIdx]) {
                    offset.addScaledVector(this._zigguratOffsets[bIdx], ziggFactor);
                }

                // B. Hellbound Pinwheel Windmill Swirl (Stage 3)
                if (pinwheelFactor > 0.001 && this._pinwheelOffsets && this._pinwheelOffsets[bIdx]) {
                    offset.addScaledVector(this._pinwheelOffsets[bIdx], pinwheelFactor);
                }

                // C. Dovetail Key Drawers (Stage 5) & Star Bloom (Stage 6)
                if (b.type === 'CORNER') {
                    const isKeyDrawer = (b.tier === 'UPPER' && (bIdx === 0 || bIdx === 3)) ||
                                        (b.tier === 'LOWER' && (bIdx === 9 || bIdx === 10));

                    let curDist = 0;
                    if (starSubProg > 0) {
                        // Blend from drawer position into full star bloom
                        const startD = isKeyDrawer ? 1.4 : 0.0;
                        curDist = THREE.MathUtils.lerp(startD, 3.2, starSubProg);
                    } else if (drawerFactor > 0 && isKeyDrawer) {
                        curDist = drawerFactor * 1.4;
                    }

                    if (curDist > 0.001) {
                        offset.addScaledVector(b.moveDir, curDist);
                    }

                    if (b.tiltAxis) {
                        this._scratchQuat.setFromAxisAngle(
                            b.tiltAxis,
                            (b.tier === 'UPPER' ? 1 : -1) * tiltAngle
                        );
                        b.mesh.quaternion.copy(this._scratchQuat);
                    }

                    // Articulated Corner Linkage: telescoping piston ram and pivoting clevis fork
                    if (b.linkage) {
                        const cl = b.linkage;
                        cl.ram.position.z = 0.85 + (curDist * 0.45);
                        cl.ram.scale.set(1, 1, 1.0 + (curDist * 0.65));
                        cl.clevis.position.z = 1.55 + curDist;
                        if (b.tiltAxis) {
                            cl.clevis.rotation.x = (b.tier === 'UPPER' ? 1 : -1) * tiltAngle;
                        }
                        cl.group.visible = (curDist > 0.05 || prog >= 4.25);
                    }
                } else if (b.type === 'EDGE') {
                    if (edgeDist > 0.001) {
                        const edgeFactor = edgeDist * (1.0 - rhombSubProg * 0.25);
                        offset.addScaledVector(b.moveDir, edgeFactor);
                    }
                    b.mesh.quaternion.identity();

                    // Linear Dovetail Guide Rails for Edge Blocks
                    if (b.rail) {
                        b.rail.group.visible = (edgeDist > 0.05 || prog >= 4.95);
                    }
                }

                // Vertical lift calculation
                let yLift = (b.tier === 'UPPER') ? tierLift : -tierLift;
                if (rhombSubProg > 0.01 && b.type === 'CORNER') {
                    yLift *= (1.0 + rhombSubProg * 0.35);
                }

                b.mesh.position.copy(b.initialPos).add(offset);
                b.mesh.position.y += yLift;

                // Synchronize linkages and rails so they travel vertically in lockstep with their host blocks
                if (b.linkage) {
                    b.linkage.group.position.y = b.mesh.position.y;
                }
                if (b.rail) {
                    b.rail.group.position.y = b.mesh.position.y;
                }
            });

            // Elevate/Lower top and bottom hubs with their respective tiers
            const hubLift = (tierLift * 1.15) + (drawerFactor * 0.45);
            if (this.topHub) {
                this.topHub.position.y = hubLift;
            }
            if (this.bottomHub) {
                this.bottomHub.position.y = -hubLift;
            }

            // Enshrined Reliquary Cameo Assemblies: deployed and elevated during Stage 5+
            if (this.relicPlaques && this.relicPlaques.length > 0) {
                const deployProg = (starSubProg > 0 || rhombSubProg > 0) ? 1.0 : drawerFactor;
                const isDeployed = deployProg > 0.001;
                for (let i = 0; i < this.relicPlaques.length; i++) {
                    const rp = this.relicPlaques[i];
                    if (!rp.group) continue;
                    rp.group.visible = isDeployed;
                    if (isDeployed) {
                        const s = Math.min(1.0, deployProg * 2.0);
                        rp.group.scale.set(s, s, s);
                        const isUpper = (rp.tier === 'UPPER');
                        const baseY = isUpper ? 1.76 : -1.76;
                        const lift = isUpper ? (deployProg * 0.88) : (-deployProg * 0.88);
                        rp.group.position.y = baseY + lift;
                        if (rp.light) {
                            rp.light.intensity = deployProg * 2.2;
                        }
                    }
                }
            }

            // Retract / conceal turntable bearing during supernatural gateway opening so the central void is clear
            if (this.turntableAssembly) {
                const showTurntable = (prog < 4.95);
                this.turntableAssembly.lowerStator.visible = showTurntable;
                this.turntableAssembly.upperRotor.visible = showTurntable;
            }

            // Side Dials: mechanically synchronized with host edge blocks across all transformations
            // (Flanged Shift, Ziggurat Terraces, Pinwheel Swirl, Star Bloom, and Monolith Lift)
            this.faceAssemblies.forEach(fa => {
                if (fa.id !== 0 && fa.id !== 1) {
                    if (fa.upperHostBlock && fa.lowerHostBlock) {
                        this._dialUpperOffset.copy(fa.normal).multiplyScalar(1.225).setY(-1.75);
                        this._dialLowerOffset.copy(fa.normal).multiplyScalar(1.225).setY(1.75);

                        fa.group.position.copy(fa.upperHostBlock.mesh.position).add(this._dialUpperOffset);
                        if (fa.lowerGroup) {
                            fa.lowerGroup.position.copy(fa.lowerHostBlock.mesh.position).add(this._dialLowerOffset);
                        }
                    } else {
                        fa.group.position.copy(fa.initialPos);
                        if (fa.lowerGroup) fa.lowerGroup.position.copy(fa.initialPos);
                    }
                }
            });

            // Telescoping Piston rods: vertical axial pistons support top and bottom hubs
            this.pistonAssemblies.forEach((pa, idx) => {
                if (idx === 0) { // TOP
                    pa.sleeve.visible = (prog >= 4.95);
                    pa.rod.visible = (prog >= 4.95);
                    pa.rod.position.copy(pa.initialRodPos).addScaledVector(pa.normal, hubLift);
                    pa.rod.scale.set(1, 1, 1.0 + (hubLift * 0.8));
                } else if (idx === 1) { // BOTTOM
                    pa.sleeve.visible = (prog >= 4.95);
                    pa.rod.visible = (prog >= 4.95);
                    pa.rod.position.copy(pa.initialRodPos).addScaledVector(pa.normal, hubLift);
                    pa.rod.scale.set(1, 1, 1.0 + (hubLift * 0.8));
                } else {
                    // SIDES: Side dials split along equatorial cut Y=0 and travel vertically with tiers.
                    // Keep horizontal side pistons concealed so the central chasm remains clean
                    // for sacrificial blades, volumetric godrays, and summoning chains.
                    pa.sleeve.visible = false;
                    pa.rod.visible = false;
                }
            });

            // Clockwork gears spin along proper wheel axes
            this.gears.forEach(g => {
                g.pulseSpeed = (g.pulseSpeed || 0) * 0.92;
                const spinDelta = (g.baseSpeed * (1 + (prog > 1 ? (prog - 1) * 1.5 : 0))) + g.pulseSpeed;
                if (g.axis === 'z') {
                    g.mesh.rotation.z += spinDelta;
                } else if (g.axis === 'y') {
                    g.mesh.rotation.y += spinDelta;
                } else {
                    g.mesh.rotation.x += spinDelta;
                }
            });

            if (this.bellGroup) {
                this.bellGroup.rotation.y += 0.005 * (1 + prog * 0.5);
            }

            // Core flaring & nested cage rotation
            if (this.coreMesh) {
                const coreScale = 1.0 + starSubProg * 0.18 + tessSubProg * 0.15 + summonSubProg * 0.40 + Math.sin(this.clock.getElapsedTime() * 4) * 0.05;
                this.coreMesh.scale.set(coreScale, coreScale, coreScale);
                this.coreMesh.rotation.y += 0.02 * (1 + summonSubProg * 3);
            }

            if (this.coreCage) {
                const cageScale = 1.0 + starSubProg * 0.15 + summonSubProg * 0.25;
                this.coreCage.scale.set(cageScale, cageScale, cageScale);
                this.coreCage.rotation.x += 0.015;
                this.coreCage.rotation.y -= 0.02;
                this.coreCage.material.opacity = (starSubProg * 0.4 + summonSubProg * 0.5);
            }

            if (this.portalVortex) {
                const vortexScale = summonSubProg * 1.45;
                this.portalVortex.scale.set(vortexScale, vortexScale, vortexScale);
                this.portalVortex.rotation.z += 0.06;
                this.portalVortex.rotation.x += 0.035;
            }

            if (this.coreLight) {
                this.coreLight.intensity = 0.25 + starSubProg * 0.6 + tessSubProg * 1.1 + summonSubProg * 3.55;
            }

            // Magic Rune Rings - Expanding outward from central core
            const magicScale = THREE.MathUtils.clamp((prog - 5.5) / 2.5, 0.0, 1.0);
            if (this.magicRingGroup) {
                this.magicRingGroup.scale.set(magicScale, magicScale, magicScale);
                this.magicRingGroup.visible = (magicScale > 0.01 && this.magicEnabled);
            }
            this.magicRings.forEach(mr => {
                mr.mesh.material.opacity = magicScale * (this.magicEnabled ? 0.75 : 0.0);
                mr.mesh.rotation.z += mr.speed * (1 + summonSubProg * 2.5);
            });

            // Volumetric Core Godray Beams - Projecting directly from (0,0,0) through open chasms
            const beamProg = THREE.MathUtils.clamp((prog - 5.2) / 2.8, 0.0, 1.0);
            const rayPulse = 1.0 + Math.sin(elapsedNow * 3.5) * 0.07;
            this.godrays.forEach(ray => {
                ray.scale.set(beamProg * rayPulse, beamProg, beamProg * rayPulse);
                ray.material.opacity = beamProg * (this.magicEnabled ? (0.32 + Math.sin(elapsedNow * 4.2) * 0.06) : 0.0);
            });

            // Environmental mood shifts to dark void in summon state
            if (summonSubProg > 0.005) {
                this.keyLight.intensity = 1.5 * (1.0 - summonSubProg * 0.70);
                this.ambientLight.intensity = 0.85 * (1.0 - summonSubProg * 0.60);
                this.chainGroup.visible = true;
                this.chainGroup.position.set(0, 0, 0); // Anchored at (0, 0, 0) core!
            } else {
                this.keyLight.intensity = 1.5;
                this.ambientLight.intensity = 0.85;
                this.chainGroup.visible = false;
            }
        }

        resolveHitFaceIndex(hit) {
            if (!hit || !hit.object || !hit.object.userData) return -1;
            if (hit.object.userData.faceIndex !== undefined) return hit.object.userData.faceIndex;
            if (hit.object.userData.isPuzzleBlock && hit.face && hit.object.userData.faceMap) {
                const mapped = hit.object.userData.faceMap[hit.face.materialIndex];
                if (mapped !== undefined && mapped !== -1) return mapped;
            }
            return -1;
        }

        setupEvents() {
            window.addEventListener('resize', () => {
                if (!this.canvas) return;
                const width = this.canvas.clientWidth;
                const height = this.canvas.clientHeight;
                if (width === 0 || height === 0) return;
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height, false);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            });

            let dragDistance = 0;

            const onDown = (clientX, clientY) => {
                this.isDragging = true;
                dragDistance = 0;
                this.previousMousePosition = { x: clientX, y: clientY };
                this.angularVelocity.x = 0;
                this.angularVelocity.y = 0;
                this.idleTimer = 22.0;
                this.autoRotateBlend = 0.0;
                if (this.targetLookAt) this.targetLookAt.set(0, 0, 0);
                if (window.LemarchandAudio) LemarchandAudio.ensureContext();
            };

            const onMove = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();

                if (!this.isDragging) {
                    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
                    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
                    this.raycaster.setFromCamera(this.mouse, this.camera);
                    const targets = (this.interactiveTargets && this.interactiveTargets.length > 0)
                        ? this.interactiveTargets
                        : this.boxGroup.children;
                    const hits = this.raycaster.intersectObjects(targets, targets === this.boxGroup.children);
                    let newHoveredIdx = -1;
                    for (let hit of hits) {
                        const idx = this.resolveHitFaceIndex(hit);
                        if (idx !== -1) {
                            newHoveredIdx = idx;
                            break;
                        }
                    }

                    if (newHoveredIdx !== this.hoveredFaceIndex) {
                        this.hoveredFaceIndex = newHoveredIdx;
                        if (this.hoveredFaceIndex !== -1) {
                            if (typeof this.onFaceHover === 'function') this.onFaceHover(this.hoveredFaceIndex);
                            const rootFreq = (this.currentTraits && this.currentTraits.visualParameters && this.currentTraits.visualParameters.keyFreq) || 523.25;
                            if (window.LemarchandAudio && window.LemarchandAudio.playFaceHover) window.LemarchandAudio.playFaceHover(this.hoveredFaceIndex, rootFreq);
                        } else {
                            if (typeof this.onFaceUnhover === 'function') this.onFaceUnhover();
                        }
                    }
                    this.canvas.style.cursor = (newHoveredIdx !== -1) ? 'pointer' : 'grab';
                    return;
                }

                this.idleTimer = 22.0;
                this.autoRotateBlend = 0.0;

                const deltaX = clientX - this.previousMousePosition.x;
                const deltaY = clientY - this.previousMousePosition.y;
                dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

                // Track momentum velocity
                const vx = deltaY * 0.0055;
                const vy = deltaX * 0.0055;
                this.angularVelocity.x = 0.5 * this.angularVelocity.x + 0.5 * vx;
                this.angularVelocity.y = 0.5 * this.angularVelocity.y + 0.5 * vy;

                // Soft polar resistance near limits to eliminate gimbal lock singularity
                const polarLimit = 1.52;
                let resistance = 1.0;
                if (Math.abs(this.targetRotation.x) > 1.38) {
                    resistance = Math.max(0.12, Math.cos(this.targetRotation.x * 1.02));
                }

                this.targetRotation.y += deltaX * 0.0055;
                this.targetRotation.x += deltaY * 0.0055 * resistance;
                this.targetRotation.x = Math.max(-polarLimit, Math.min(polarLimit, this.targetRotation.x));

                this.previousMousePosition = { x: clientX, y: clientY };
            };

            const onUp = () => {
                this.isDragging = false;
                this.canvas.style.cursor = (this.hoveredFaceIndex !== -1) ? 'pointer' : 'grab';
            };

            this.canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', onUp);

            // Touch events with momentum & pinch-to-zoom
            this.canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    onDown(e.touches[0].clientX, e.touches[0].clientY);
                } else if (e.touches.length === 2) {
                    this.isDragging = false;
                    this.idleTimer = 22.0;
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    this.touchPinchDist = Math.hypot(dx, dy);
                }
            }, { passive: true });

            window.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1) {
                    onMove(e.touches[0].clientX, e.touches[0].clientY);
                } else if (e.touches.length === 2 && this.touchPinchDist > 0) {
                    this.idleTimer = 22.0;
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const newDist = Math.hypot(dx, dy);
                    const pinchDelta = (this.touchPinchDist - newDist) * 0.035;
                    this.userZoomOffset = Math.max(-13.0, Math.min(15.0, this.userZoomOffset + pinchDelta));
                    this.targetCameraDistance = this.baseDistance + this.userZoomOffset;
                    this.touchPinchDist = newDist;
                }
            }, { passive: true });

            window.addEventListener('touchend', () => {
                onUp();
                this.touchPinchDist = 0;
            });

            // Wheel zoom modifies userZoomOffset, preserving dynamic auto-dolly
            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.idleTimer = 22.0;
                this.autoRotateBlend = 0.0;
                this.userZoomOffset += e.deltaY * 0.015;
                this.userZoomOffset = Math.max(-13.0, Math.min(15.0, this.userZoomOffset));
                this.targetCameraDistance = this.baseDistance + this.userZoomOffset;
            }, { passive: false });

            // Click face or dial to interact
            this.canvas.addEventListener('click', (e) => {
                if (dragDistance > 12) return; // Prevent dial spin if user was orbiting camera

                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const targets = (this.interactiveTargets && this.interactiveTargets.length > 0)
                    ? this.interactiveTargets
                    : this.boxGroup.children;
                const intersects = this.raycaster.intersectObjects(targets, targets === this.boxGroup.children);

                let clickedFaceIdx = -1;
                for (let hit of intersects) {
                    const idx = this.resolveHitFaceIndex(hit);
                    if (idx !== -1) {
                        clickedFaceIdx = idx;
                        break;
                    }
                }

                if (clickedFaceIdx !== -1) {
                    this.idleTimer = 25.0;
                    this.autoRotateBlend = 0.0;
                    if (typeof this.onDialClick === 'function') {
                        this.onDialClick(clickedFaceIdx);
                    } else {
                        this.rotateDial(clickedFaceIdx);
                    }
                }
            });

            this.canvas.addEventListener('dblclick', () => {
                this.resetCamera();
            });
        }

        captureSnapshot() {
            this.renderer.render(this.scene, this.camera);
            return this.renderer.domElement.toDataURL('image/png');
        }

        animate() {
            requestAnimationFrame(this.animate);
            const delta = this.clock.getDelta();
            const elapsed = this.clock.getElapsedTime();

            // Inertia decay when not dragging
            if (!this.isDragging) {
                if (Math.abs(this.angularVelocity.x) > 0.00005 || Math.abs(this.angularVelocity.y) > 0.00005) {
                    this.targetRotation.x += this.angularVelocity.x;
                    this.targetRotation.y += this.angularVelocity.y;
                    this.targetRotation.x = Math.max(-1.52, Math.min(1.52, this.targetRotation.x));
                    this.angularVelocity.x *= 0.92;
                    this.angularVelocity.y *= 0.92;
                }

                // Auto-orbit idle timer: only resumes after 4s of inactivity with smooth blend
                if (this.idleTimer > 0) {
                    this.idleTimer -= delta;
                } else if (this.autoRotate) {
                    this.autoRotateBlend = Math.min(1.0, this.autoRotateBlend + delta * 0.65);
                    this.targetRotation.y += this.autoRotateSpeed * this.autoRotateBlend;
                }
            }

            // Framerate-independent delta decay smoothing
            const dt = (delta > 0.0001 && delta < 0.2) ? delta : 0.0166;
            const rotAlpha = 1.0 - Math.exp(-6.0 * dt);
            const distAlpha = 1.0 - Math.exp(-4.5 * dt);
            const progAlpha = 1.0 - Math.exp(-3.8 * dt);

            this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * rotAlpha;
            this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * rotAlpha;
            this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * distAlpha;

            const phi = Math.PI / 2 - this.currentRotation.x;
            const theta = this.currentRotation.y;

            if (this.currentLookAt && this.targetLookAt) {
                this.currentLookAt.lerp(this.targetLookAt, 0.08);
                this.camera.position.x = this.currentLookAt.x + this.cameraDistance * Math.sin(phi) * Math.sin(theta);
                this.camera.position.y = this.currentLookAt.y + this.cameraDistance * Math.cos(phi);
                this.camera.position.z = this.currentLookAt.z + this.cameraDistance * Math.sin(phi) * Math.cos(theta);
                this.camera.lookAt(this.currentLookAt);
            } else {
                this.camera.position.x = this.cameraDistance * Math.sin(phi) * Math.sin(theta);
                this.camera.position.y = this.cameraDistance * Math.cos(phi);
                this.camera.position.z = this.cameraDistance * Math.sin(phi) * Math.cos(theta);
                this.camera.lookAt(0, 0, 0);
            }

            // Majestic, cinematic dimensional levitation without high-frequency shaking
            const summonProg = THREE.MathUtils.clamp(this.lifecycleProgress - 8.0, 0.0, 1.0);
            let levitationY = Math.sin(elapsed * 1.4) * 0.18;
            if (summonProg > 0.005) {
                // Low-frequency ominous occult dimensional heave (1.8Hz)
                const summonHeave = Math.sin(elapsed * 1.8) * (summonProg * 0.12);
                levitationY += summonHeave;
            }
            this.boxGroup.position.y = levitationY;

            // Smooth lifecycle progress interpolation
            this.lifecycleProgress += (this.targetLifecycleProgress - this.lifecycleProgress) * progAlpha;
            this.updateKinematics(this.lifecycleProgress);
            this.boxGroup.updateMatrixWorld(true);

            // Collision Resolution & Dynamic Cenobite Chains
            // Gated to eliminate overhead when chains are dormant/invisible
            if (this.chainGroup.visible && this.chainStrands.length > 0) {
                this.collisionResolver.clear();
                this.collisionResolver.addSphere(this._zeroVec, 1.35);

                // 16 Segmented puzzle blocks
                this.puzzleBlocks.forEach(b => {
                    b.mesh.getWorldPosition(this._tempPos);
                    b.mesh.getWorldQuaternion(this._tempQuat);
                    const geomParams = b.mesh.geometry.parameters;
                    if (geomParams) {
                        this._blockHalfSize.set(geomParams.width / 2, geomParams.height / 2, geomParams.depth / 2);
                    } else {
                        this._blockHalfSize.copy(this._defaultHalfSize);
                    }
                    this.collisionResolver.addBox(this._tempPos, this._blockHalfSize, this._tempQuat, 0.22);
                });

                // 6 Face dials & bezels (including lower halves for split dials)
                this.faceAssemblies.forEach(fa => {
                    fa.group.getWorldPosition(this._tempPos);
                    fa.group.getWorldQuaternion(this._tempQuat);
                    this.collisionResolver.addBox(this._tempPos, this._dialHalfSize, this._tempQuat, 0.15);
                    if (fa.lowerGroup) {
                        fa.lowerGroup.getWorldPosition(this._tempPos);
                        fa.lowerGroup.getWorldQuaternion(this._tempQuat);
                        this.collisionResolver.addBox(this._tempPos, this._dialHalfSize, this._tempQuat, 0.15);
                    }
                });

                // Telescoping piston rods (axial spine rods supporting top/bottom hubs)
                this.pistonAssemblies.forEach(pa => {
                    if (pa.rod.visible) {
                        pa.rod.getWorldPosition(this._tempPos);
                        this.collisionResolver.addCapsule(this._zeroVec, this._tempPos, 0.28);
                    }
                });

                // Dynamic Cenobite Chains Erupting from Core (0, 0, 0)
                // Spools out at fixed physical pitch (0.42) so links interlock realistically
                const eruption = THREE.MathUtils.clamp(this.lifecycleProgress - 8.0, 0.0, 1.0);
                const linkPitch = 0.42;

                this.chainStrands.forEach((strand) => {
                    const dir = strand.dir;
                    const tangentX = strand.tangentX;
                    const tangentY = strand.tangentY;
                    const strandIdx = strand.strandIndex;
                    const totalLinks = strand.links.length;

                    // Progressively spool out links as eruption increases (0 to totalLinks)
                    const numVisible = (eruption > 0.01)
                        ? Math.max(1, Math.min(totalLinks, Math.floor(Math.pow(eruption, 0.72) * totalLinks)))
                        : 0;

                    let lastNominalDist = 1.35;

                    for (let i = 0; i < totalLinks; i++) {
                        const link = strand.links[i];
                        if (i < numVisible) {
                            link.visible = true;
                            const nominalDist = 1.35 + (i + 1) * linkPitch;
                            lastNominalDist = nominalDist;

                            // Serpentine wave amplitude scales with distance from core
                            const wavePhase = elapsed * 3.8 - i * 0.45 + strandIdx * 1.4;
                            const distFraction = Math.min(1.0, nominalDist / 12.0);
                            const swayX = Math.sin(wavePhase) * (distFraction * 0.45);
                            const swayY = Math.cos(wavePhase * 0.85) * (distFraction * 0.35);

                            this._chainPos.copy(dir).multiplyScalar(nominalDist)
                                .addScaledVector(tangentX, swayX)
                                .addScaledVector(tangentY, swayY);

                            // Deflect link outside solid blocks, dials, and rods
                            const resolvedPos = this.collisionResolver.resolve(this._chainPos, 0.30);
                            link.position.copy(resolvedPos);

                            // Alternating 90-degree twist along chain direction
                            link.quaternion.setFromUnitVectors(this._unitY, dir);
                            if (i % 2 === 1) {
                                link.rotateOnAxis(this._unitY, Math.PI / 2);
                            }
                            link.rotateOnAxis(this._unitX, swayX * 0.6);
                        } else {
                            link.visible = false;
                        }
                    }

                    // Barbed meat hook at the strand tip - RIGIDLY CONNECTED to the leading link
                    if (numVisible > 0) {
                        strand.hook.visible = true;
                        const hookDist = lastNominalDist + linkPitch * 0.85;
                        const hookPhase = elapsed * 3.8 - numVisible * 0.45 + strandIdx * 1.4;
                        const hookDistFrac = Math.min(1.0, hookDist / 12.0);
                        const hookSwayX = Math.sin(hookPhase) * (hookDistFrac * 0.45);
                        const hookSwayY = Math.cos(hookPhase * 0.85) * (hookDistFrac * 0.35);

                        this._hookPos.copy(dir).multiplyScalar(hookDist)
                            .addScaledVector(tangentX, hookSwayX)
                            .addScaledVector(tangentY, hookSwayY);

                        const resolvedHookPos = this.collisionResolver.resolve(this._hookPos, 0.35);
                        strand.hook.position.copy(resolvedHookPos);

                        // Align hook along strand direction with alternating link twist
                        strand.hook.quaternion.setFromUnitVectors(this._unitY, dir);
                        if (numVisible % 2 === 1) {
                            strand.hook.rotateOnAxis(this._unitY, Math.PI / 2);
                        }
                        strand.hook.rotateOnAxis(this._unitZ, hookSwayX * 0.8);
                    } else {
                        strand.hook.visible = false;
                    }
                });
            }

            if (this.dustParticles && this.dustParticles.geometry) {
                this.dustParticles.rotation.y = elapsed * 0.015;
                const posAttr = this.dustParticles.geometry.attributes.position;
                if (posAttr && this._dustVelocities) {
                    const pos = posAttr.array;
                    const v = this._dustVelocities;
                    const count = pos.length / 3;
                    for (let i = 0; i < count; i++) {
                        pos[i * 3 + 1] += v[i * 3 + 1];
                        if (pos[i * 3 + 1] > 18) {
                            pos[i * 3 + 1] = -18;
                        }
                    }
                    posAttr.needsUpdate = true;
                }

                if (this.dustParticles.material) {
                    const summonFactor = THREE.MathUtils.clamp((this.lifecycleProgress - 5.0) / 4.0, 0, 1);
                    this.dustParticles.material.opacity = 0.35 + summonFactor * 0.30;
                    this.dustParticles.material.size = 0.12 + summonFactor * 0.08;
                }
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

    return BoxEngine;
}));
