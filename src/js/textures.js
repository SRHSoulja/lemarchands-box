/**
 * Lemarchand's Box - Authentic Simon Sayce 1987 Canonical PBR Textures & Occult Magic Rings
 * 
 * Includes:
 * - 6 Canonical Simon Sayce faces (Lament Rosette, Labyrinth, Quadrant Cross, Chevron, Astrolabe, Escapement)
 * - Procedural Glowing Enochian / Leviathan Occult Magic Ring textures
 * - PBR Multi-channel maps (diffuse, bump, roughness, metalness)
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['three'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('three'));
    } else {
        root.LemarchandTextures = factory(root.THREE);
    }
}(typeof self !== 'undefined' ? self : this, function (THREE) {

    const RESOLUTION = 1024;

    function hexToRgb(hex) {
        const c = parseInt((hex || "#d4af37").replace('#', ''), 16);
        return {
            r: (c >> 16) & 255,
            g: (c >> 8) & 255,
            b: c & 255
        };
    }

    // Render dark antique mahogany / ebony wood backing with fine polished grain
    function renderDarkWoodBase(ctx, w, h, woodHex) {
        const base = hexToRgb(woodHex || "#120c09");

        ctx.fillStyle = woodHex || "#120c09";
        ctx.fillRect(0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const dist = Math.sqrt((x - w * 0.5) ** 2 + (y + h * 0.4) ** 2);
                const grain = Math.sin(dist * 0.06 + Math.sin(x * 0.025) * 3.0);
                const fine = (Math.random() - 0.5) * 10;
                const factor = 1.0 + (grain * 0.05) + (fine / 255.0);

                data[idx] = Math.min(255, Math.max(0, base.r * factor));
                data[idx + 1] = Math.min(255, Math.max(0, base.g * factor));
                data[idx + 2] = Math.min(255, Math.max(0, base.b * factor));
            }
        }
        ctx.putImageData(imgData, 0, 0);

        const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.72);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(0.7, "rgba(0,0,0,0.45)");
        vignette.addColorStop(1, "rgba(0,0,0,0.85)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
    }

    // Render embossed metallic elements with bevel highlight & recessed shadow
    function renderEmbossedBrass(ctx, drawPattern, w, h, metalColor, isBump) {
        if (isBump) {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#ffffff";
            drawPattern(ctx, w, h, "#ffffff");
            return;
        }

        // 1. Deep engraved shadow (+2, +2)
        ctx.save();
        ctx.translate(2, 2);
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        drawPattern(ctx, w, h, "rgba(0,0,0,0.85)");
        ctx.restore();

        // 2. Main Gold/Brass Body with metallic gradient
        const metalGrad = ctx.createLinearGradient(0, 0, w, h);
        metalGrad.addColorStop(0, "#f5d469");
        metalGrad.addColorStop(0.25, metalColor || "#d4af37");
        metalGrad.addColorStop(0.5, "#b88a28");
        metalGrad.addColorStop(0.75, metalColor || "#d4af37");
        metalGrad.addColorStop(1, "#f8dc7b");

        ctx.fillStyle = metalGrad;
        ctx.strokeStyle = metalGrad;
        drawPattern(ctx, w, h, metalGrad);

        // 3. Specular Bevel Highlight (-1, -1)
        ctx.save();
        ctx.translate(-1, -1);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        drawPattern(ctx, w, h, "rgba(255,255,255,0.28)");
        ctx.restore();
    }

    // Universal Canonical Border Frame
    function drawBorderFrame(ctx, w, h, style) {
        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        const margin = 26;
        const outerThick = 16;
        ctx.lineWidth = outerThick;
        ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

        ctx.lineWidth = 4;
        ctx.strokeRect(margin + 22, margin + 22, w - (margin + 22) * 2, h - (margin + 22) * 2);

        const cornerSize = w * 0.22;
        const corners = [
            { x: margin, y: margin, rot: 0 },
            { x: w - margin, y: margin, rot: Math.PI / 2 },
            { x: w - margin, y: h - margin, rot: Math.PI },
            { x: margin, y: h - margin, rot: -Math.PI / 2 }
        ];

        corners.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(cornerSize, 0);
            ctx.lineTo(cornerSize, 14);
            ctx.lineTo(14, 14);
            ctx.lineTo(14, cornerSize);
            ctx.lineTo(0, cornerSize);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.arc(26, 26, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        [
            [w / 2, margin + 8],
            [w / 2, h - margin - 8],
            [margin + 8, h / 2],
            [w - margin - 8, h / 2]
        ].forEach(([mx, my]) => {
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    // FACE 0 (Top): The 8-Pointed Star Rosette & Arabesque Flourishes
    function drawFace0(ctx, w, h, style) {
        drawBorderFrame(ctx, w, h, style);
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((Math.PI * 2 * i) / 8);

            ctx.beginPath();
            ctx.moveTo(-14, -w * 0.08);
            ctx.lineTo(0, -w * 0.238);
            ctx.lineTo(14, -w * 0.08);
            ctx.lineTo(6, -w * 0.04);
            ctx.lineTo(-6, -w * 0.04);
            ctx.closePath();
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -w * 0.06);
            ctx.lineTo(0, -w * 0.21);
            ctx.stroke();

            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.075, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(18, 0);
        ctx.lineTo(0, 18);
        ctx.lineTo(-18, 0);
        ctx.closePath();
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        const qDist = w * 0.28;
        [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach(ang => {
            const qx = cx + Math.cos(ang) * qDist;
            const qy = cy + Math.sin(ang) * qDist;
            ctx.save();
            ctx.translate(qx, qy);
            ctx.rotate(ang + Math.PI / 4);

            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();
    }

    // FACE 1 (Bottom): The Labyrinth of Leviathan (Concentric Greek-Key Maze)
    function drawFace1(ctx, w, h, style) {
        drawBorderFrame(ctx, w, h, style);
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        const rings = 6;
        const step = (w * 0.35) / rings;
        ctx.lineWidth = 6;

        for (let i = 1; i <= rings; i++) {
            const r = i * step;
            ctx.beginPath();
            ctx.rect(cx - r, cy - r, r * 2, r * 2);
            ctx.stroke();

            const notch = 18;
            if (i % 2 === 0) {
                ctx.clearRect(cx - r - 4, cy - notch / 2, 8, notch);
                ctx.clearRect(cx + r - 4, cy - notch / 2, 8, notch);
            } else {
                ctx.clearRect(cx - notch / 2, cy - r - 4, notch, 8);
                ctx.clearRect(cx - notch / 2, cy + r - 4, notch, 8);
            }
        }

        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(90, 90); ctx.lineTo(cx - 45, cy - 45);
        ctx.moveTo(w - 90, 90); ctx.lineTo(cx + 45, cy - 45);
        ctx.moveTo(w - 90, h - 90); ctx.lineTo(cx + 45, cy + 45);
        ctx.moveTo(90, h - 90); ctx.lineTo(cx - 45, cy + 45);
        ctx.stroke();

        ctx.fillRect(cx - 32, cy - 32, 64, 64);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(cx - 20, cy - 20, 40, 40);
        ctx.stroke();

        ctx.restore();
    }

    // FACE 2 (Front): The Four-Quadrant Cross of Philip Lemarchand
    function drawFace2(ctx, w, h, style) {
        drawBorderFrame(ctx, w, h, style);
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        // 1. Central Machined Dovetail Cross of Philip Lemarchand
        // Aligned mathematically to physical Edge blocks (X in [358, 666]) and equatorial slide (Y in [358, 666])
        const seamL = 358;
        const seamR = 666;
        const seamTop = 358;
        const seamBtm = 666;

        // Central cross guide tracks
        ctx.lineWidth = 4;
        // Vertical track borders
        ctx.strokeRect(seamL + 12, 50, (seamR - seamL) - 24, h - 100);
        // Horizontal track borders
        ctx.strokeRect(50, seamTop + 12, w - 100, (seamBtm - seamTop) - 24);

        // Heavy central brass core cross
        const crossThick = 52;
        ctx.fillRect(cx - crossThick / 2, 50, crossThick, h - 100);
        ctx.fillRect(50, cy - crossThick / 2, w - 100, crossThick);

        // Rack and pinion dovetail alignment notches along the channel borders
        for (let y = 60; y < h - 60; y += 36) {
            ctx.fillRect(seamL + 14, y, 16, 6);
            ctx.fillRect(seamR - 30, y, 16, 6);
        }
        for (let x = 60; x < w - 60; x += 36) {
            ctx.fillRect(x, seamTop + 14, 6, 16);
            ctx.fillRect(x, seamBtm - 30, 6, 16);
        }

        // 2. Four Quadrant Rings: Mathematically centered on the 4 Corner Blocks
        // Corner centers: X = 179 and 845, Y = 256 and 768. Radius 114px guarantees 65px clearance from cuts!
        const cornerCenters = [
            { x: 179, y: 256 }, // Top-Left Corner Block
            { x: 845, y: 256 }, // Top-Right Corner Block
            { x: 845, y: 768 }, // Bottom-Right Corner Block
            { x: 179, y: 768 }  // Bottom-Left Corner Block
        ];

        cornerCenters.forEach(off => {
            ctx.save();
            ctx.translate(off.x, off.y);

            // Outer heavy brass bezel ring (R = 114)
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, 114, 0, Math.PI * 2);
            ctx.stroke();

            // Intermediate concentric astrolabe ring (R = 86)
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, 86, 0, Math.PI * 2);
            ctx.stroke();

            // 12 Radial calibration ciphers between rings
            for (let a = 0; a < 12; a++) {
                const ang = (a * Math.PI * 2) / 12;
                ctx.lineWidth = (a % 3 === 0) ? 3 : 1.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * 86, Math.sin(ang) * 86);
                ctx.lineTo(Math.cos(ang) * 114, Math.sin(ang) * 114);
                ctx.stroke();
            }

            // Central raised rosette button boss
            ctx.beginPath();
            ctx.arc(0, 0, 42, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.strokeStyle = "#120c09";
            ctx.stroke();
            ctx.strokeStyle = style;

            // 4 Cardinal spoke bars pointing inward
            for (let s = 0; s < 4; s++) {
                ctx.save();
                ctx.rotate(s * Math.PI / 2);
                ctx.fillRect(-6, -112, 12, 34);
                ctx.restore();
            }

            ctx.restore();
        });

        // 3. Central Rosette Dial Mount
        ctx.beginPath();
        ctx.arc(cx, cy, 54, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 82, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // FACE 3 (Back): The Stepped Chevron Diamond Lozenge
    function drawFace3(ctx, w, h, style) {
        drawBorderFrame(ctx, w, h, style);
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        const chevronCount = 5;
        ctx.lineWidth = 7;
        for (let i = 1; i <= chevronCount; i++) {
            const span = i * 36;
            const yOff = 65 + i * 26;

            ctx.beginPath();
            ctx.moveTo(cx - span, yOff);
            ctx.lineTo(cx, yOff + 32);
            ctx.lineTo(cx + span, yOff);
            ctx.stroke();

            const byOff = h - yOff;
            ctx.beginPath();
            ctx.moveTo(cx - span, byOff);
            ctx.lineTo(cx, byOff - 32);
            ctx.lineTo(cx + span, byOff);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(cx, cy);
        const dSize = w * 0.24;
        ctx.beginPath();
        ctx.moveTo(0, -dSize);
        ctx.lineTo(dSize, 0);
        ctx.lineTo(0, dSize);
        ctx.lineTo(-dSize, 0);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -dSize * 0.6);
        ctx.lineTo(dSize * 0.6, 0);
        ctx.lineTo(0, dSize * 0.6);
        ctx.lineTo(-dSize * 0.6, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
        ctx.restore();
    }

    // FACE 4 (Right): The Sunburst Astrolabe Dial
    function drawFace4(ctx, w, h, style) {
        drawBorderFrame(ctx, w, h, style);
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        const rays = 32;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < rays; i++) {
            ctx.rotate((Math.PI * 2) / rays);
            const len = (i % 2 === 0) ? w * 0.32 : w * 0.22;
            const width = (i % 4 === 0) ? 6 : 3;
            ctx.fillRect(-width / 2, -len, width, len * 0.55);
        }
        ctx.restore();

        [w * 0.34, w * 0.27, w * 0.18].forEach(rad => {
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.05, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    // FACE 5 (Left): The Clockwork Escapement Gear & Maltese Spokes
    function drawFace5(ctx, w, h, style) {
        drawBorderFrame(ctx, w, h, style);
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = style;
        ctx.strokeStyle = style;

        const gearR = w * 0.32;
        const teeth = 28;
        ctx.save();
        ctx.translate(cx, cy);
        for (let t = 0; t < teeth; t++) {
            ctx.rotate((Math.PI * 2) / teeth);
            ctx.fillRect(-7, -gearR, 14, 16);
        }

        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, 0, gearR - 8, 0, Math.PI * 2);
        ctx.stroke();

        const crossW = 22;
        ctx.fillRect(-w * 0.24, -crossW / 2, w * 0.48, crossW);
        ctx.fillRect(-crossW / 2, -w * 0.24, crossW, w * 0.48);

        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
        ctx.restore();
    }

    // Canonical Face Order: 0:Top Rosette, 1:Bottom Astrolabe, 2:Front Labyrinth, 3:Back Escapement, 4:Right Cross, 5:Left Chevrons
    const FACE_PATTERNS = [drawFace0, drawFace4, drawFace1, drawFace5, drawFace2, drawFace3];

    // Generate Tangent-Space Normal Map via Fast Sobel Filter from Bump Canvas
    function generateNormalMapFromCanvas(srcCanvas, strength = 2.4) {
        const w = srcCanvas.width;
        const h = srcCanvas.height;
        const srcCtx = srcCanvas.getContext('2d');
        const srcData = srcCtx.getImageData(0, 0, w, h);
        const srcPixels = srcData.data;

        const normCanvas = document.createElement('canvas');
        normCanvas.width = w;
        normCanvas.height = h;
        const normCtx = normCanvas.getContext('2d');
        const normData = normCtx.createImageData(w, h);
        const normPixels = normData.data;

        const getH = (x, y) => {
            const cx = (x < 0) ? 0 : (x >= w ? w - 1 : x);
            const cy = (y < 0) ? 0 : (y >= h ? h - 1 : y);
            return srcPixels[(cy * w + cx) * 4] / 255.0;
        };

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const dx = (getH(x + 1, y) - getH(x - 1, y)) * strength;
                const dy = (getH(x, y + 1) - getH(x, y - 1)) * strength;
                const dz = 1.0;

                const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);
                const nx = -dx * invLen;
                const ny = -dy * invLen;
                const nz = dz * invLen;

                normPixels[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
                normPixels[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
                normPixels[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
                normPixels[idx + 3] = 255;
            }
        }

        normCtx.putImageData(normData, 0, 0);
        const normalTex = new THREE.CanvasTexture(normCanvas);
        normalTex.generateMipmaps = true;
        return normalTex;
    }

    // Build PBR Textures
    function generateFaceTexture(faceIndex, options = {}) {
        const {
            woodColor = "#120c09",
            metalColor = "#d4af37",
            metalness = 0.94,
            roughness = 0.35
        } = options;

        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = RESOLUTION;
        diffCanvas.height = RESOLUTION;
        const dCtx = diffCanvas.getContext('2d');

        renderDarkWoodBase(dCtx, RESOLUTION, RESOLUTION, woodColor);
        const patternFn = FACE_PATTERNS[faceIndex % FACE_PATTERNS.length];
        renderEmbossedBrass(dCtx, patternFn, RESOLUTION, RESOLUTION, metalColor, false);

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = RESOLUTION / 2;
        bumpCanvas.height = RESOLUTION / 2;
        const bCtx = bumpCanvas.getContext('2d');

        bCtx.fillStyle = "#111111";
        bCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
        renderEmbossedBrass(bCtx, patternFn, bumpCanvas.width, bumpCanvas.height, "#ffffff", true);

        const roughCanvas = document.createElement('canvas');
        roughCanvas.width = RESOLUTION / 2;
        roughCanvas.height = RESOLUTION / 2;
        const rCtx = roughCanvas.getContext('2d');
        rCtx.fillStyle = "rgb(170, 160, 150)";
        rCtx.fillRect(0, 0, roughCanvas.width, roughCanvas.height);
        patternFn(rCtx, roughCanvas.width, roughCanvas.height, "rgb(40, 35, 30)");

        const diffuseTexture = new THREE.CanvasTexture(diffCanvas);
        diffuseTexture.generateMipmaps = true;
        diffuseTexture.minFilter = THREE.LinearMipmapLinearFilter;

        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        bumpTexture.generateMipmaps = true;

        const normalTexture = generateNormalMapFromCanvas(bumpCanvas, 2.4);

        const roughTexture = new THREE.CanvasTexture(roughCanvas);
        roughTexture.generateMipmaps = true;

        return {
            diffuse: diffuseTexture,
            bump: bumpTexture,
            normal: normalTexture,
            roughnessMap: roughTexture,
            materialParams: {
                bumpScale: 0.048,
                metalness: metalness,
                roughness: roughness
            }
        };
    }

    // Procedural Occult Magic Ring Texture (Enochian & Leviathan Circles)
    function generateMagicRuneTexture(glowColorHex = "#00aaff") {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        const cx = 512;
        const cy = 512;

        ctx.clearRect(0, 0, 1024, 1024);

        // Glowing concentric occult rings
        ctx.strokeStyle = glowColorHex;
        ctx.fillStyle = glowColorHex;
        ctx.shadowColor = glowColorHex;
        ctx.shadowBlur = 15;

        // Outer glyph band
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 480, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 450, 0, Math.PI * 2);
        ctx.stroke();

        // Radiating tick marks (Enochian degrees)
        for (let i = 0; i < 72; i++) {
            const ang = (i * Math.PI * 2) / 72;
            const r0 = (i % 6 === 0) ? 430 : 442;
            const r1 = 450;
            ctx.lineWidth = (i % 6 === 0) ? 3 : 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
            ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
            ctx.stroke();
        }

        // Intersecting sacred geometric triangles (The Schism seal)
        ctx.lineWidth = 3;
        for (let t = 0; t < 2; t++) {
            const rot = t * (Math.PI / 3);
            ctx.beginPath();
            for (let v = 0; v < 3; v++) {
                const ang = rot + (v * Math.PI * 2) / 3;
                const vx = cx + Math.cos(ang) * 360;
                const vy = cy + Math.sin(ang) * 360;
                if (v === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Inner rune ring
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 260, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
            const ang = (i * Math.PI * 2) / 12;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(ang) * 260, cy + Math.sin(ang) * 260, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = true;
        return texture;
    }

    // Generate Machined Internal Dovetail & Gear Rack Chassis Textures
    function generateInternalChassisTexture() {
        const size = 512;
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = size;
        diffCanvas.height = size;
        const diffCtx = diffCanvas.getContext('2d');

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size;
        const bumpCtx = bumpCanvas.getContext('2d');

        // 1. Dark gunmetal steel backing with fine brushed horizontal grain
        diffCtx.fillStyle = "#16151a";
        diffCtx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = "#222222";
        bumpCtx.fillRect(0, 0, size, size);

        // Brushed texture
        for (let y = 0; y < size; y += 2) {
            const noise = (Math.random() - 0.5) * 16;
            diffCtx.fillStyle = `rgba(${30 + noise}, ${28 + noise}, ${34 + noise}, 0.6)`;
            diffCtx.fillRect(0, y, size, 1);
        }

        // 2. Machined Brass Dovetail Guide Rails
        const railYs = [96, 256, 416];
        railYs.forEach(ry => {
            // Shadow behind rail
            diffCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
            diffCtx.fillRect(0, ry - 18, size, 36);

            // Brass rail body
            const brassGrad = diffCtx.createLinearGradient(0, ry - 14, 0, ry + 14);
            brassGrad.addColorStop(0, "#f0d468");
            brassGrad.addColorStop(0.3, "#c89d2c");
            brassGrad.addColorStop(0.7, "#8e6d19");
            brassGrad.addColorStop(1, "#ffe288");
            diffCtx.fillStyle = brassGrad;
            diffCtx.fillRect(0, ry - 14, size, 28);

            // Center slot channel
            diffCtx.fillStyle = "#0c0b0e";
            diffCtx.fillRect(0, ry - 4, size, 8);

            // Bump mapping
            bumpCtx.fillStyle = "#888888";
            bumpCtx.fillRect(0, ry - 14, size, 28);
            bumpCtx.fillStyle = "#000000";
            bumpCtx.fillRect(0, ry - 4, size, 8);

            // Rack and pinion gear teeth along the central track
            const toothStep = 16;
            for (let x = 8; x < size; x += toothStep) {
                diffCtx.fillStyle = "#eed572";
                diffCtx.fillRect(x, ry - 12, 8, 24);
                diffCtx.fillStyle = "rgba(0,0,0,0.5)";
                diffCtx.fillRect(x + 6, ry - 12, 2, 24);

                bumpCtx.fillStyle = "#ffffff";
                bumpCtx.fillRect(x, ry - 12, 8, 24);
            }

            // Brass rivet heads
            for (let rx = 32; rx < size; rx += 96) {
                diffCtx.fillStyle = "#ffd966";
                diffCtx.beginPath();
                diffCtx.arc(rx, ry, 6, 0, Math.PI * 2);
                diffCtx.fill();
                diffCtx.strokeStyle = "#44340c";
                diffCtx.lineWidth = 1.5;
                diffCtx.stroke();

                bumpCtx.fillStyle = "#ffffff";
                bumpCtx.beginPath();
                bumpCtx.arc(rx, ry, 6, 0, Math.PI * 2);
                bumpCtx.fill();
            }
        });

        // 3. Occult calibration ciphers and alignment notches
        diffCtx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        diffCtx.lineWidth = 2;
        for (let x = 0; x < size; x += 32) {
            diffCtx.beginPath();
            diffCtx.moveTo(x, 0);
            diffCtx.lineTo(x, (x % 64 === 0) ? 22 : 12);
            diffCtx.stroke();

            diffCtx.beginPath();
            diffCtx.moveTo(x, size);
            diffCtx.lineTo(x, size - ((x % 64 === 0) ? 22 : 12));
            diffCtx.stroke();
        }

        const diffTex = new THREE.CanvasTexture(diffCanvas);
        diffTex.generateMipmaps = true;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        bumpTex.generateMipmaps = true;

        return {
            diffuse: diffTex,
            bump: bumpTex,
            materialParams: {
                metalness: 0.88,
                bumpScale: 0.04
            }
        };
    }

    // Generate Antique Brass Clockwork Mainplate with Ruby Pivot Bearings, Blued Screws & Geneva Perlage
    function generateEscapementPlateTexture() {
        const size = 512;
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = size;
        diffCanvas.height = size;
        const diffCtx = diffCanvas.getContext('2d');

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size;
        const bumpCtx = bumpCanvas.getContext('2d');

        // 1. Antique Brass Plate with circular brushed perlage / engine turning
        const baseGrad = diffCtx.createLinearGradient(0, 0, size, size);
        baseGrad.addColorStop(0, "#d8b248");
        baseGrad.addColorStop(0.35, "#be942d");
        baseGrad.addColorStop(0.7, "#99731d");
        baseGrad.addColorStop(1, "#e5c464");
        diffCtx.fillStyle = baseGrad;
        diffCtx.fillRect(0, 0, size, size);

        bumpCtx.fillStyle = "#888888";
        bumpCtx.fillRect(0, 0, size, size);

        // Circular Perlage / Engine Turning rosettes
        const step = 48;
        for (let py = 0; py <= size + step; py += step) {
            for (let px = 0; px <= size + step; px += step) {
                const ox = ((py / step) % 2 === 0) ? px : px + step / 2;
                const radGrad = diffCtx.createRadialGradient(ox, py, 2, ox, py, step * 0.85);
                radGrad.addColorStop(0, "rgba(255, 235, 140, 0.45)");
                radGrad.addColorStop(0.5, "rgba(160, 120, 25, 0.25)");
                radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
                diffCtx.fillStyle = radGrad;
                diffCtx.beginPath();
                diffCtx.arc(ox, py, step * 0.85, 0, Math.PI * 2);
                diffCtx.fill();
            }
        }

        // 2. Machined Gear Sinks (circular recessed pockets where internal gears sit)
        const sinks = [
            { x: 140, y: 150, r: 85 },
            { x: 370, y: 180, r: 70 },
            { x: 260, y: 360, r: 95 }
        ];

        sinks.forEach(sink => {
            // Shadowed recessed well
            const sinkGrad = diffCtx.createRadialGradient(sink.x, sink.y, sink.r * 0.2, sink.x, sink.y, sink.r);
            sinkGrad.addColorStop(0, "#1c1a20");
            sinkGrad.addColorStop(0.85, "#100f13");
            sinkGrad.addColorStop(0.95, "#42381e");
            sinkGrad.addColorStop(1, "#8a702a");
            diffCtx.fillStyle = sinkGrad;
            diffCtx.beginPath();
            diffCtx.arc(sink.x, sink.y, sink.r, 0, Math.PI * 2);
            diffCtx.fill();

            // Bevel rim highlight
            diffCtx.strokeStyle = "rgba(255, 230, 130, 0.6)";
            diffCtx.lineWidth = 2.5;
            diffCtx.beginPath();
            diffCtx.arc(sink.x, sink.y, sink.r, 0, Math.PI * 2);
            diffCtx.stroke();

            // Bump map recess
            bumpCtx.fillStyle = "#181818";
            bumpCtx.beginPath();
            bumpCtx.arc(sink.x, sink.y, sink.r, 0, Math.PI * 2);
            bumpCtx.fill();
            bumpCtx.strokeStyle = "#ffffff";
            bumpCtx.lineWidth = 3;
            bumpCtx.stroke();

            // Gear teeth profile visible inside the recess
            const teeth = 18;
            diffCtx.strokeStyle = "#e8c85e";
            diffCtx.lineWidth = 3;
            for (let t = 0; t < teeth; t++) {
                const angle = (t / teeth) * Math.PI * 2;
                const innerR = sink.r * 0.62;
                const outerR = sink.r * 0.88;
                diffCtx.beginPath();
                diffCtx.moveTo(sink.x + Math.cos(angle) * innerR, sink.y + Math.sin(angle) * innerR);
                diffCtx.lineTo(sink.x + Math.cos(angle) * outerR, sink.y + Math.sin(angle) * outerR);
                diffCtx.stroke();
            }
        });

        // 3. Synthetic Ruby Jewel Bearings in Gold Chaton Settings
        const jewels = [
            { x: 140, y: 150, r: 16 },
            { x: 370, y: 180, r: 14 },
            { x: 260, y: 360, r: 18 },
            { x: 256, y: 220, r: 12 },
            { x: 110, y: 390, r: 13 },
            { x: 420, y: 370, r: 15 }
        ];

        jewels.forEach(j => {
            // Gold chaton setting collar
            const chatonGrad = diffCtx.createRadialGradient(j.x, j.y, j.r * 0.6, j.x, j.y, j.r * 1.6);
            chatonGrad.addColorStop(0, "#ffe88a");
            chatonGrad.addColorStop(0.6, "#c69b2d");
            chatonGrad.addColorStop(1, "#5a4310");
            diffCtx.fillStyle = chatonGrad;
            diffCtx.beginPath();
            diffCtx.arc(j.x, j.y, j.r * 1.6, 0, Math.PI * 2);
            diffCtx.fill();

            // Ruby gemstone body (vibrant pigeon-blood crimson with translucent depth)
            const rubyGrad = diffCtx.createRadialGradient(j.x - j.r * 0.3, j.y - j.r * 0.3, 1, j.x, j.y, j.r);
            rubyGrad.addColorStop(0, "#ff3355");
            rubyGrad.addColorStop(0.4, "#c00e2e");
            rubyGrad.addColorStop(0.85, "#6a0416");
            rubyGrad.addColorStop(1, "#2e0108");
            diffCtx.fillStyle = rubyGrad;
            diffCtx.beginPath();
            diffCtx.arc(j.x, j.y, j.r, 0, Math.PI * 2);
            diffCtx.fill();

            // Specular reflection highlight on gemstone
            diffCtx.fillStyle = "rgba(255, 230, 240, 0.75)";
            diffCtx.beginPath();
            diffCtx.arc(j.x - j.r * 0.32, j.y - j.r * 0.32, j.r * 0.28, 0, Math.PI * 2);
            diffCtx.fill();

            // Center steel pivot hole
            diffCtx.fillStyle = "#0c0b0f";
            diffCtx.beginPath();
            diffCtx.arc(j.x, j.y, j.r * 0.24, 0, Math.PI * 2);
            diffCtx.fill();

            // Bump map for jewel
            bumpCtx.fillStyle = "#ffffff";
            bumpCtx.beginPath();
            bumpCtx.arc(j.x, j.y, j.r * 1.6, 0, Math.PI * 2);
            bumpCtx.fill();
            bumpCtx.fillStyle = "#000000";
            bumpCtx.beginPath();
            bumpCtx.arc(j.x, j.y, j.r * 0.24, 0, Math.PI * 2);
            bumpCtx.fill();
        });

        // 4. Heat-Blued Steel Screws with Polished Countersunk Chamfers
        const screws = [
            { x: 50, y: 50, r: 10, angle: 0.3 },
            { x: 462, y: 50, r: 10, angle: 1.1 },
            { x: 50, y: 462, r: 10, angle: 2.4 },
            { x: 462, y: 462, r: 10, angle: 0.8 },
            { x: 256, y: 70, r: 9, angle: 1.7 },
            { x: 70, y: 256, r: 9, angle: 2.1 },
            { x: 442, y: 256, r: 9, angle: 0.5 },
            { x: 256, y: 442, r: 9, angle: 2.9 }
        ];

        screws.forEach(sc => {
            // Countersink hole
            diffCtx.fillStyle = "#1a1610";
            diffCtx.beginPath();
            diffCtx.arc(sc.x, sc.y, sc.r * 1.35, 0, Math.PI * 2);
            diffCtx.fill();

            // Tempered Cobalt Blued Steel Screw Head
            const screwGrad = diffCtx.createRadialGradient(sc.x - sc.r * 0.2, sc.y - sc.r * 0.2, 1, sc.x, sc.y, sc.r);
            screwGrad.addColorStop(0, "#5b84d6");
            screwGrad.addColorStop(0.5, "#20428e");
            screwGrad.addColorStop(0.85, "#102352");
            screwGrad.addColorStop(1, "#081026");
            diffCtx.fillStyle = screwGrad;
            diffCtx.beginPath();
            diffCtx.arc(sc.x, sc.y, sc.r, 0, Math.PI * 2);
            diffCtx.fill();

            // Chamfer edge highlight
            diffCtx.strokeStyle = "rgba(130, 180, 255, 0.6)";
            diffCtx.lineWidth = 1.2;
            diffCtx.stroke();

            // Screw Slot Cut
            const cosA = Math.cos(sc.angle);
            const sinA = Math.sin(sc.angle);
            diffCtx.strokeStyle = "#050812";
            diffCtx.lineWidth = 2.2;
            diffCtx.beginPath();
            diffCtx.moveTo(sc.x - cosA * (sc.r * 0.85), sc.y - sinA * (sc.r * 0.85));
            diffCtx.lineTo(sc.x + cosA * (sc.r * 0.85), sc.y + sinA * (sc.r * 0.85));
            diffCtx.stroke();

            // Bump mapping
            bumpCtx.fillStyle = "#d0d0d0";
            bumpCtx.beginPath();
            bumpCtx.arc(sc.x, sc.y, sc.r, 0, Math.PI * 2);
            bumpCtx.fill();
            bumpCtx.strokeStyle = "#000000";
            bumpCtx.lineWidth = 2;
            bumpCtx.beginPath();
            bumpCtx.moveTo(sc.x - cosA * (sc.r * 0.85), sc.y - sinA * (sc.r * 0.85));
            bumpCtx.lineTo(sc.x + cosA * (sc.r * 0.85), sc.y + sinA * (sc.r * 0.85));
            bumpCtx.stroke();
        });

        // 5. Fine Horological Calibration Arcs & Enochian Sector Hashes
        diffCtx.strokeStyle = "rgba(70, 52, 12, 0.55)";
        diffCtx.lineWidth = 1.5;
        diffCtx.beginPath();
        diffCtx.arc(256, 256, 210, 0, Math.PI * 2);
        diffCtx.stroke();
        diffCtx.beginPath();
        diffCtx.arc(256, 256, 185, 0, Math.PI * 2);
        diffCtx.stroke();

        for (let a = 0; a < 60; a++) {
            const rad = (a / 60) * Math.PI * 2;
            const len = (a % 5 === 0) ? 14 : 7;
            const r1 = 210;
            const r2 = r1 - len;
            diffCtx.lineWidth = (a % 5 === 0) ? 2 : 1;
            diffCtx.beginPath();
            diffCtx.moveTo(256 + Math.cos(rad) * r1, 256 + Math.sin(rad) * r1);
            diffCtx.lineTo(256 + Math.cos(rad) * r2, 256 + Math.sin(rad) * r2);
            diffCtx.stroke();
        }

        const diffTex = new THREE.CanvasTexture(diffCanvas);
        diffTex.generateMipmaps = true;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        bumpTex.generateMipmaps = true;

        return {
            diffuse: diffTex,
            bump: bumpTex,
            materialParams: {
                metalness: 0.92,
                roughness: 0.22,
                bumpScale: 0.05
            }
        };
    }

    // Generate Damascus Steel Chassis with Occult Hydraulic Conduits & Pressure Channels
    function generateOccultConduitTexture() {
        const size = 512;
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = size;
        diffCanvas.height = size;
        const diffCtx = diffCanvas.getContext('2d');

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size;
        const bumpCtx = bumpCanvas.getContext('2d');

        // 1. Blackened Damascus Crucible Steel with Acid-Etched Flow Grain
        diffCtx.fillStyle = "#191a20";
        diffCtx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = "#333333";
        bumpCtx.fillRect(0, 0, size, size);

        // Acid-etched Damascus banding
        diffCtx.lineWidth = 3;
        for (let i = 0; i < size; i += 8) {
            const wave = Math.sin(i * 0.04) * 15;
            const shade = 28 + Math.sin(i * 0.08) * 14;
            diffCtx.strokeStyle = `rgba(${shade + 4}, ${shade + 6}, ${shade + 12}, 0.75)`;
            diffCtx.beginPath();
            diffCtx.moveTo(0, i + wave);
            diffCtx.bezierCurveTo(size * 0.33, i - wave * 1.5, size * 0.66, i + wave * 1.5, size, i - wave);
            diffCtx.stroke();
        }

        // 2. Copper Hydraulic Blood Veins / Occult Pressure Conduits
        const conduits = [
            [ { x: 40, y: 40 }, { x: 180, y: 160 }, { x: 256, y: 256 } ],
            [ { x: 256, y: 256 }, { x: 340, y: 180 }, { x: 470, y: 80 } ],
            [ { x: 256, y: 256 }, { x: 190, y: 350 }, { x: 70, y: 450 } ],
            [ { x: 256, y: 256 }, { x: 370, y: 330 }, { x: 460, y: 440 } ]
        ];

        conduits.forEach(path => {
            // Recessed conduit channel bed (shadow)
            diffCtx.strokeStyle = "rgba(0, 0, 0, 0.85)";
            diffCtx.lineWidth = 18;
            diffCtx.lineCap = "round";
            diffCtx.lineJoin = "round";
            diffCtx.beginPath();
            diffCtx.moveTo(path[0].x, path[0].y);
            for (let p = 1; p < path.length; p++) diffCtx.lineTo(path[p].x, path[p].y);
            diffCtx.stroke();

            // Polished Aged Copper Pipe Body
            diffCtx.strokeStyle = "#c86d51";
            diffCtx.lineWidth = 12;
            diffCtx.beginPath();
            diffCtx.moveTo(path[0].x, path[0].y);
            for (let p = 1; p < path.length; p++) diffCtx.lineTo(path[p].x, path[p].y);
            diffCtx.stroke();

            // Pipe Specular Center Highlight
            diffCtx.strokeStyle = "#f39f82";
            diffCtx.lineWidth = 4;
            diffCtx.beginPath();
            diffCtx.moveTo(path[0].x, path[0].y);
            for (let p = 1; p < path.length; p++) diffCtx.lineTo(path[p].x, path[p].y);
            diffCtx.stroke();

            // Bump map
            bumpCtx.strokeStyle = "#000000";
            bumpCtx.lineWidth = 18;
            bumpCtx.beginPath();
            bumpCtx.moveTo(path[0].x, path[0].y);
            for (let p = 1; p < path.length; p++) bumpCtx.lineTo(path[p].x, path[p].y);
            bumpCtx.stroke();

            bumpCtx.strokeStyle = "#ffffff";
            bumpCtx.lineWidth = 10;
            bumpCtx.beginPath();
            bumpCtx.moveTo(path[0].x, path[0].y);
            for (let p = 1; p < path.length; p++) bumpCtx.lineTo(path[p].x, path[p].y);
            bumpCtx.stroke();

            // Brass Compression Unions / Flanges along pipes
            path.forEach(pt => {
                const unionGrad = diffCtx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, 14);
                unionGrad.addColorStop(0, "#ffe07a");
                unionGrad.addColorStop(0.5, "#c49a2a");
                unionGrad.addColorStop(1, "#543d0b");
                diffCtx.fillStyle = unionGrad;
                diffCtx.beginPath();
                diffCtx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
                diffCtx.fill();
                diffCtx.strokeStyle = "#382907";
                diffCtx.lineWidth = 2;
                diffCtx.stroke();

                // Hex bolt fittings
                for (let b = 0; b < 6; b++) {
                    const ba = (b / 6) * Math.PI * 2;
                    diffCtx.fillStyle = "#ffe288";
                    diffCtx.beginPath();
                    diffCtx.arc(pt.x + Math.cos(ba) * 10, pt.y + Math.sin(ba) * 10, 2.5, 0, Math.PI * 2);
                    diffCtx.fill();
                }

                bumpCtx.fillStyle = "#ffffff";
                bumpCtx.beginPath();
                bumpCtx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
                bumpCtx.fill();
            });
        });

        // 3. Central Hydraulic Manifold Chamber
        const maniGrad = diffCtx.createRadialGradient(256, 256, 6, 256, 256, 38);
        maniGrad.addColorStop(0, "#f5cf62");
        maniGrad.addColorStop(0.4, "#ba8d24");
        maniGrad.addColorStop(0.8, "#63470d");
        maniGrad.addColorStop(1, "#1c1404");
        diffCtx.fillStyle = maniGrad;
        diffCtx.beginPath();
        diffCtx.arc(256, 256, 38, 0, Math.PI * 2);
        diffCtx.fill();

        diffCtx.strokeStyle = "#ffd460";
        diffCtx.lineWidth = 3;
        diffCtx.stroke();

        // 4. Etched Enochian Occult Circuits and Alchemical Alignment Tracks
        diffCtx.strokeStyle = "rgba(214, 180, 70, 0.45)";
        diffCtx.lineWidth = 2;
        [80, 140, 200].forEach(r => {
            diffCtx.beginPath();
            diffCtx.arc(256, 256, r, 0, Math.PI * 2);
            diffCtx.stroke();
        });

        for (let a = 0; a < 24; a++) {
            const rad = (a / 24) * Math.PI * 2;
            diffCtx.beginPath();
            diffCtx.moveTo(256 + Math.cos(rad) * 140, 256 + Math.sin(rad) * 200);
            diffCtx.lineTo(256 + Math.cos(rad) * 200, 256 + Math.sin(rad) * 200);
            diffCtx.stroke();
        }

        const diffTex = new THREE.CanvasTexture(diffCanvas);
        diffTex.generateMipmaps = true;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        bumpTex.generateMipmaps = true;

        return {
            diffuse: diffTex,
            bump: bumpTex,
            materialParams: {
                metalness: 0.86,
                roughness: 0.32,
                bumpScale: 0.045
            }
        };
    }

    // Generate Equatorial Turntable Bearing Plate Texture with Concentric Races & Octagonal Detents
    function generateTurntableTexture() {
        const size = 512;
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = size;
        diffCanvas.height = size;
        const diffCtx = diffCanvas.getContext('2d');

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size;
        const bumpCtx = bumpCanvas.getContext('2d');

        const cx = size / 2;
        const cy = size / 2;

        // 1. Dark gunmetal steel circular base with radial engine turning
        diffCtx.fillStyle = "#141318";
        diffCtx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = "#202020";
        bumpCtx.fillRect(0, 0, size, size);

        // Concentric brass bearing tracks
        const rMax = size * 0.46;
        const rMin = size * 0.22;

        const plateGrad = diffCtx.createRadialGradient(cx, cy, rMin, cx, cy, rMax);
        plateGrad.addColorStop(0, "#2c261e");
        plateGrad.addColorStop(0.3, "#a68228");
        plateGrad.addColorStop(0.7, "#dfbe5a");
        plateGrad.addColorStop(1, "#6b5417");

        diffCtx.beginPath();
        diffCtx.arc(cx, cy, rMax, 0, Math.PI * 2);
        diffCtx.fillStyle = plateGrad;
        diffCtx.fill();

        bumpCtx.beginPath();
        bumpCtx.arc(cx, cy, rMax, 0, Math.PI * 2);
        bumpCtx.fillStyle = "#909090";
        bumpCtx.fill();

        // Concentric roller raceway groove (R = size * 0.35)
        const raceR = size * 0.35;
        diffCtx.beginPath();
        diffCtx.arc(cx, cy, raceR, 0, Math.PI * 2);
        diffCtx.lineWidth = 18;
        diffCtx.strokeStyle = "#1a1820";
        diffCtx.stroke();

        bumpCtx.beginPath();
        bumpCtx.arc(cx, cy, raceR, 0, Math.PI * 2);
        bumpCtx.lineWidth = 18;
        bumpCtx.strokeStyle = "#101010";
        bumpCtx.stroke();

        // Polished steel ball bearings along raceway
        const ballCount = 24;
        for (let i = 0; i < ballCount; i++) {
            const ang = (i / ballCount) * Math.PI * 2;
            const bx = cx + Math.cos(ang) * raceR;
            const by = cy + Math.sin(ang) * raceR;

            const ballGrad = diffCtx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7);
            ballGrad.addColorStop(0, "#ffffff");
            ballGrad.addColorStop(0.5, "#a0a4aa");
            ballGrad.addColorStop(1, "#303236");
            diffCtx.fillStyle = ballGrad;
            diffCtx.beginPath();
            diffCtx.arc(bx, by, 6, 0, Math.PI * 2);
            diffCtx.fill();

            bumpCtx.fillStyle = "#ffffff";
            bumpCtx.beginPath();
            bumpCtx.arc(bx, by, 6, 0, Math.PI * 2);
            bumpCtx.fill();
        }

        // 8 Radial Detent Notches (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
        for (let d = 0; d < 8; d++) {
            const ang = (d / 8) * Math.PI * 2;
            const cos = Math.cos(ang);
            const sin = Math.sin(ang);

            // Detent slot
            const nStart = rMax - 28;
            const nEnd = rMax + 2;
            diffCtx.lineWidth = 6;
            diffCtx.strokeStyle = "#0d0b10";
            diffCtx.beginPath();
            diffCtx.moveTo(cx + cos * nStart, cy + sin * nStart);
            diffCtx.lineTo(cx + cos * nEnd, cy + sin * nEnd);
            diffCtx.stroke();

            bumpCtx.lineWidth = 6;
            bumpCtx.strokeStyle = "#000000";
            bumpCtx.beginPath();
            bumpCtx.moveTo(cx + cos * nStart, cy + sin * nStart);
            bumpCtx.lineTo(cx + cos * nEnd, cy + sin * nEnd);
            bumpCtx.stroke();

            // Gold detent marker rivet
            const rx = cx + cos * (rMax - 36);
            const ry = cy + sin * (rMax - 36);
            diffCtx.fillStyle = "#ffe288";
            diffCtx.beginPath();
            diffCtx.arc(rx, ry, 4, 0, Math.PI * 2);
            diffCtx.fill();

            bumpCtx.fillStyle = "#ffffff";
            bumpCtx.beginPath();
            bumpCtx.arc(rx, ry, 4, 0, Math.PI * 2);
            bumpCtx.fill();
        }

        // Circular graduated degree vernier markings (every 5 degrees)
        for (let deg = 0; deg < 360; deg += 5) {
            const rad = (deg * Math.PI) / 180;
            const isMajor = (deg % 45 === 0);
            const isMid = (deg % 15 === 0);
            const tickLen = isMajor ? 14 : (isMid ? 9 : 5);
            const rOuter = rMax - 2;
            const rInner = rOuter - tickLen;

            diffCtx.lineWidth = isMajor ? 2.5 : (isMid ? 1.5 : 1);
            diffCtx.strokeStyle = isMajor ? "#ffd700" : "rgba(220, 185, 80, 0.6)";
            diffCtx.beginPath();
            diffCtx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
            diffCtx.lineTo(cx + Math.cos(rad) * rOuter, cy + Math.sin(rad) * rOuter);
            diffCtx.stroke();
        }

        // Clear center hole (R < rMin)
        diffCtx.clearRect(cx - rMin, cy - rMin, rMin * 2, rMin * 2);
        diffCtx.fillStyle = "#100e14";
        diffCtx.beginPath();
        diffCtx.arc(cx, cy, rMin, 0, Math.PI * 2);
        diffCtx.fill();

        bumpCtx.clearRect(cx - rMin, cy - rMin, rMin * 2, rMin * 2);
        bumpCtx.fillStyle = "#000000";
        bumpCtx.beginPath();
        bumpCtx.arc(cx, cy, rMin, 0, Math.PI * 2);
        bumpCtx.fill();

        const diffTex = new THREE.CanvasTexture(diffCanvas);
        diffTex.generateMipmaps = true;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        bumpTex.generateMipmaps = true;

        return {
            diffuse: diffTex,
            bump: bumpTex,
            materialParams: {
                metalness: 0.92,
                roughness: 0.22,
                bumpScale: 0.05
            }
        };
    }

    // Helper to draw procedural talisman or relic art inside the cameo medallion
    // Helper to draw procedural talisman or relic art inside the cameo medallion
    function drawProceduralRelicArt(ctx, cx, cy, r, relicData, onUpdate) {
        const theme = (relicData && relicData.theme) || "CUCKS";

        // Prioritize instant offline embedded base64 if available in StrayCucks samples
        if (typeof StrayCucks !== 'undefined' && relicData && relicData.id) {
            const sample = StrayCucks.getSample(relicData.id);
            if (sample) {
                if (sample.dataUrl && !relicData.dataUrl) relicData.dataUrl = sample.dataUrl;
                if (sample.imageElement && !relicData.imageElement) relicData.imageElement = sample.imageElement;
                if (!relicData.name) relicData.name = sample.name;
                if (!relicData.attributes && sample.attributes) relicData.attributes = sample.attributes;
            }
        }

        let imgElem = relicData && relicData.imageElement;
        const rawSrc = relicData && (relicData.dataUrl || relicData.imageUrl || relicData.image || (relicData.id ? `https://straycucks.com/gif/${relicData.id}.gif` : null));

        if (!imgElem && typeof StrayCucks !== 'undefined' && relicData && (relicData.id || relicData.dataUrl || relicData.image)) {
            const cached = StrayCucks.preloadStrayImage(relicData, (loaded) => {
                if (loaded && onUpdate) onUpdate();
            });
            if (cached && cached.complete && cached.naturalWidth > 0) {
                imgElem = cached;
            }
        } else if (!imgElem && typeof RelicMediaResolver !== 'undefined' && rawSrc) {
            const loaded = RelicMediaResolver.loadNFTImage(rawSrc, (loadedImg) => {
                if (loadedImg && onUpdate) onUpdate();
            });
            if (loaded && loaded.complete && loaded.naturalWidth > 0) {
                imgElem = loaded;
            }
        }

        if (imgElem && imgElem.complete && imgElem.naturalWidth > 0) {
            ctx.fillStyle = "#1b121e";
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            // Draw pixel art crisply inside medallion
            ctx.drawImage(imgElem, cx - r, cy - r, r * 2, r * 2);
            ctx.restore();

            // Label banner
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(cx - 95, cy + r - 34, 190, 26);
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1.8;
            ctx.strokeRect(cx - 95, cy + r - 34, 190, 26);

            ctx.fillStyle = "#fff5db";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText((relicData && relicData.name) || "ENSHRINED RELIC", cx, cy + r - 17);
            return;
        }

        if (theme === "CUCKS") {
            // Stray Cuck Crowned Orange Tabby Pixel Relic
            const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
            grad.addColorStop(0, "#4a1e38");
            grad.addColorStop(0.7, "#250f1d");
            grad.addColorStop(1, "#120810");
            ctx.fillStyle = grad;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

            // Radiant occult halo
            ctx.fillStyle = "rgba(255, 215, 0, 0.35)";
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
            ctx.fill();

            // Pixel cat face silhouette
            ctx.fillStyle = "#ff8c2b"; // Vibrant Orange tabby
            ctx.beginPath();
            // Head
            ctx.arc(cx, cy + 12, 48, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.beginPath();
            ctx.moveTo(cx - 38, cy - 10);
            ctx.lineTo(cx - 52, cy - 65);
            ctx.lineTo(cx - 12, cy - 30);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx + 38, cy - 10);
            ctx.lineTo(cx + 52, cy - 65);
            ctx.lineTo(cx + 12, cy - 30);
            ctx.closePath();
            ctx.fill();

            // Inner ears
            ctx.fillStyle = "#ffb085";
            ctx.beginPath();
            ctx.moveTo(cx - 34, cy - 12);
            ctx.lineTo(cx - 44, cy - 50);
            ctx.lineTo(cx - 18, cy - 25);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx + 34, cy - 12);
            ctx.lineTo(cx + 44, cy - 50);
            ctx.lineTo(cx + 18, cy - 25);
            ctx.closePath();
            ctx.fill();

            // Golden Crown
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.moveTo(cx - 32, cy - 38);
            ctx.lineTo(cx - 38, cy - 68);
            ctx.lineTo(cx - 16, cy - 52);
            ctx.lineTo(cx, cy - 78);
            ctx.lineTo(cx + 16, cy - 52);
            ctx.lineTo(cx + 38, cy - 68);
            ctx.lineTo(cx + 32, cy - 38);
            ctx.closePath();
            ctx.fill();

            // Ruby in crown
            ctx.fillStyle = "#ff1744";
            ctx.beginPath();
            ctx.arc(cx, cy - 55, 6, 0, Math.PI * 2);
            ctx.fill();

            // Big expressive eyes
            ctx.fillStyle = "#00e5ff"; // Vibrant Glowing Cyan eyes
            ctx.beginPath();
            ctx.ellipse(cx - 20, cy + 8, 11, 14, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 20, cy + 8, 11, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#071018"; // Pupils
            ctx.beginPath();
            ctx.ellipse(cx - 20, cy + 8, 5, 12, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 20, cy + 8, 5, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye gleam highlights
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(cx - 22, cy + 4, 3, 0, Math.PI * 2);
            ctx.arc(cx + 18, cy + 4, 3, 0, Math.PI * 2);
            ctx.fill();

            // Snout & nose
            ctx.fillStyle = "#ffb085";
            ctx.beginPath();
            ctx.arc(cx, cy + 26, 6, 0, Math.PI * 2);
            ctx.fill();

            // Label banner
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(cx - 75, cy + 62, 150, 24);
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1.8;
            ctx.strokeRect(cx - 75, cy + 62, 150, 24);

            ctx.fillStyle = "#fff5db";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText((relicData && relicData.name) || "STRAY CUCK #527", cx, cy + 78);
        } else {
            // Occult Leviathan Talisman Relic
            const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
            grad.addColorStop(0, "#c62828");
            grad.addColorStop(0.6, "#5c0e12");
            grad.addColorStop(1, "#180305");
            ctx.fillStyle = grad;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

            // Sacred geometry star
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(a) * (r * 0.7), cy + Math.sin(a) * (r * 0.7));
                ctx.stroke();
            }

            // Central glowing eye
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(cx, cy, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#d32f2f";
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();

            // Label banner
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(cx - 80, cy + 62, 160, 24);
            ctx.strokeStyle = "#ffd700";
            ctx.lineWidth = 1.8;
            ctx.strokeRect(cx - 80, cy + 62, 160, 24);

            ctx.fillStyle = "#fff5db";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText((relicData && relicData.name) || "LEVIATHAN SEAL", cx, cy + 78);
        }
    }

    // Generate Ornate Antique Brass Reliquary Cameo Plaque with Enshrined NFT Art
    function generateReliquaryCameoTexture(relicData, onTextureUpdated) {
        const size = 512;
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = size;
        diffCanvas.height = size;
        const diffCtx = diffCanvas.getContext('2d');

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = size;
        bumpCanvas.height = size;
        const bumpCtx = bumpCanvas.getContext('2d');

        const diffTex = new THREE.CanvasTexture(diffCanvas);
        diffTex.generateMipmaps = true;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        bumpTex.generateMipmaps = true;

        function renderPass() {
            // Background: Deep Royal Obsidian Velvet
            diffCtx.fillStyle = "#120c10";
            diffCtx.fillRect(0, 0, size, size);
            bumpCtx.fillStyle = "#101010";
            bumpCtx.fillRect(0, 0, size, size);

            const cx = size / 2;
            const cy = size / 2;
            const frameR = size * 0.44;

            // Embossed Frame Outer Ring
            diffCtx.lineWidth = 18;
            diffCtx.strokeStyle = "#d4af37";
            diffCtx.beginPath();
            diffCtx.arc(cx, cy, frameR, 0, Math.PI * 2);
            diffCtx.stroke();

            bumpCtx.lineWidth = 18;
            bumpCtx.strokeStyle = "#d0d0d0";
            bumpCtx.beginPath();
            bumpCtx.arc(cx, cy, frameR, 0, Math.PI * 2);
            bumpCtx.stroke();

            // Inner Beaded Filigree Trim
            diffCtx.lineWidth = 4;
            diffCtx.strokeStyle = "#fff2a8";
            diffCtx.beginPath();
            diffCtx.arc(cx, cy, frameR - 12, 0, Math.PI * 2);
            diffCtx.stroke();

            bumpCtx.lineWidth = 4;
            bumpCtx.strokeStyle = "#ffffff";
            bumpCtx.beginPath();
            bumpCtx.arc(cx, cy, frameR - 12, 0, Math.PI * 2);
            bumpCtx.stroke();

            // 16 Filigree Scallops
            for (let i = 0; i < 16; i++) {
                const a = (i / 16) * Math.PI * 2;
                const sx = cx + Math.cos(a) * (frameR + 10);
                const sy = cy + Math.sin(a) * (frameR + 10);

                diffCtx.fillStyle = "#e6c35c";
                diffCtx.beginPath();
                diffCtx.arc(sx, sy, 7, 0, Math.PI * 2);
                diffCtx.fill();

                bumpCtx.fillStyle = "#f0f0f0";
                bumpCtx.beginPath();
                bumpCtx.arc(sx, sy, 7, 0, Math.PI * 2);
                bumpCtx.fill();
            }

            // Medallion Center: Draw Enshrined Artwork
            const medR = frameR - 18;
            diffCtx.save();
            diffCtx.beginPath();
            diffCtx.arc(cx, cy, medR, 0, Math.PI * 2);
            diffCtx.clip();

            drawProceduralRelicArt(diffCtx, cx, cy, medR, relicData, () => {
                renderPass();
                if (onTextureUpdated) onTextureUpdated();
            });
            diffCtx.restore();

            // Subtle depth gradient around outer edge of medallion disc (non-darkening)
            diffCtx.save();
            const medVignette = diffCtx.createRadialGradient(cx, cy, medR * 0.75, cx, cy, medR);
            medVignette.addColorStop(0, "rgba(0,0,0,0)");
            medVignette.addColorStop(1, "rgba(0,0,0,0.20)");
            diffCtx.fillStyle = medVignette;
            diffCtx.beginPath();
            diffCtx.arc(cx, cy, medR, 0, Math.PI * 2);
            diffCtx.fill();
            diffCtx.restore();

            diffTex.needsUpdate = true;
            bumpTex.needsUpdate = true;
        }

        renderPass();

        return {
            diffuse: diffTex,
            bump: bumpTex,
            canvas: diffCanvas,
            materialParams: {
                metalness: 0.04,
                roughness: 0.38,
                bumpScale: 0.02,
                emissiveIntensity: 0.28
            }
        };
    }

    return {
        generateFaceTexture,
        generateNormalMapFromCanvas,
        generateMagicRuneTexture,
        generateInternalChassisTexture,
        generateEscapementPlateTexture,
        generateOccultConduitTexture,
        generateTurntableTexture,
        generateReliquaryCameoTexture,
        FACE_PATTERNS
    };
}));
