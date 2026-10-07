/**
 * Lemarchand's Box - High-Fidelity Procedural Sound Synthesizer
 * 100% Pure Web Audio API Synthesis • Zero External Dependencies
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.LemarchandAudio = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    let ctx = null;
    let masterGain = null;
    let droneGain = null;
    let droneNodes = [];
    let isMuted = false;
    let isInitialized = false;
    let convolver = null;
    let reverbGain = null;

    function createCathedralImpulseResponse(actx, duration = 3.2, decay = 2.2) {
        const sampleRate = actx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const impulse = actx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * decay);
            left[i] = (Math.random() * 2 - 1) * env;
            right[i] = (Math.random() * 2 - 1) * env;
        }
        return impulse;
    }

    function initAudio() {
        if (isInitialized && ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            ctx = new AudioContext();
            masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(isMuted ? 0 : 0.75, ctx.currentTime);
            masterGain.connect(ctx.destination);

            // Procedural Stone Cathedral Convolver Reverb
            if (ctx.createConvolver) {
                try {
                    convolver = ctx.createConvolver();
                    convolver.buffer = createCathedralImpulseResponse(ctx, 3.2, 2.2);
                    reverbGain = ctx.createGain();
                    reverbGain.gain.setValueAtTime(0.28, ctx.currentTime);
                    convolver.connect(reverbGain);
                    reverbGain.connect(masterGain);
                } catch (revErr) {
                    console.warn("Reverb initialization skipped:", revErr);
                }
            }

            isInitialized = true;
        } catch (e) {
            console.warn("Web Audio not supported", e);
        }
    }

    function ensureContext() {
        if (!isInitialized) initAudio();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    }

    function toggleMute() {
        ensureContext();
        isMuted = !isMuted;
        if (masterGain && ctx) {
            masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.75, ctx.currentTime, 0.05);
        }
        return isMuted;
    }

    function setMute(muted) {
        isMuted = muted;
        if (masterGain && ctx) {
            masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.75, ctx.currentTime, 0.05);
        }
    }

    // Dual-Impulse Clockwork Ratchet Click
    function playClockworkTick(pitch = 1.0) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        const clickNoise = ctx.createBufferSource();
        const bufLen = ctx.sampleRate * 0.025;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25));
        }
        clickNoise.buffer = buf;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(2400 * pitch, now);
        bandpass.Q.setValueAtTime(9.0, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.45, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        clickNoise.connect(bandpass);
        bandpass.connect(clickGain);
        clickGain.connect(masterGain);

        clickNoise.start(now);
        clickNoise.stop(now + 0.03);

        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = "sine";
        bodyOsc.frequency.setValueAtTime(140 * pitch, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(45, now + 0.045);

        bodyGain.gain.setValueAtTime(0.35, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(masterGain);

        bodyOsc.start(now);
        bodyOsc.stop(now + 0.05);
    }

    // Heavy Wood & Brass Rail Sliding Friction
    function playWoodSlide() {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const dur = 0.42;
        const bufSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufSize; i++) {
            const env = Math.sin((i / bufSize) * Math.PI);
            output[i] = (Math.random() * 2 - 1) * env;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(280, now);
        filter.frequency.linearRampToValueAtTime(780, now + dur * 0.4);
        filter.frequency.linearRampToValueAtTime(220, now + dur);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.32, now + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        if (convolver) gain.connect(convolver);

        source.start(now);
        source.stop(now + dur);
    }

    // Authentic Hellraiser Music Box Chime
    function playBellChime(freq = 523.25, duration = 3.2) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const partials = [1.0, 2.01, 3.01, 4.25, 5.4];
        const amps = [0.45, 0.25, 0.14, 0.07, 0.03];

        partials.forEach((p, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq * p, now);

            gain.gain.setValueAtTime(amps[idx], now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (idx * 0.45 + 1));

            osc.connect(gain);
            gain.connect(masterGain);
            if (convolver) gain.connect(convolver);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // Harmonic ratios for the 6 authentic faces (1784 Lemarchand Just Intonation Scale)
    // 0: Top (Root 1/1), 1: Bottom (Perfect 5th 3/2), 2: Front (Major 3rd 5/4),
    // 3: Back (Octave 2/1), 4: Right (Perfect 4th 4/3), 5: Left (Harmonic 7th 7/4)
    const FACE_INTERVALS = [1.0, 1.4983, 1.2599, 2.0, 1.3348, 1.7818];

    // Play Face Acoustic Note with Escapement Click
    function playFaceTone(faceIndex, rootFreq = 523.25) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const ratio = FACE_INTERVALS[faceIndex] || 1.0;
        const toneFreq = rootFreq * ratio;

        playClockworkTick(1.0 + (faceIndex * 0.08));
        playBellChime(toneFreq, 1.8);
    }

    // Dull Mechanical Resistance Clunk when a face dial is locked
    function playResistanceClunk() {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Heavy wooden dull thud
        const thudOsc = ctx.createOscillator();
        const thudGain = ctx.createGain();
        thudOsc.type = "sine";
        thudOsc.frequency.setValueAtTime(160, now);
        thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        thudGain.gain.setValueAtTime(0.55, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

        thudOsc.connect(thudGain);
        thudGain.connect(masterGain);
        if (convolver) thudGain.connect(convolver);
        thudOsc.start(now);
        thudOsc.stop(now + 0.09);

        // 2. Metallic catch recoil clatter
        const noise = ctx.createBufferSource();
        const bufLen = ctx.sampleRate * 0.04;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.2));
        }
        noise.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(850, now);
        filter.Q.setValueAtTime(5.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.38, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        if (convolver) noiseGain.connect(convolver);

        noise.start(now);
        noise.stop(now + 0.045);
    }

    // Triumphant Tumbler Engagement Lock Click
    function playTumblerClick(stepIndex, totalSteps, rootFreq = 523.25) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        playClockworkTick(1.25);
        playWoodSlide();

        const progress = Math.min(1.0, (stepIndex + 1) / totalSteps);
        const chimeFreq = rootFreq * (1.0 + progress * 0.5);
        setTimeout(() => {
            playBellChime(chimeFreq, 2.4);
        }, 60);
    }

    // Subtle micro-tick and faint harmonic pitch when gliding mouse over interactive face dials
    function playFaceHover(faceIndex = -1, rootFreq = 523.25) {
        if (isMuted) return;
        if (!ctx || ctx.state !== 'running') return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(3200, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.012);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.014);

        if (faceIndex >= 0 && faceIndex < 6) {
            const ratio = FACE_INTERVALS[faceIndex] || 1.0;
            const targetFreq = rootFreq * ratio;
            const toneOsc = ctx.createOscillator();
            const toneGain = ctx.createGain();
            toneOsc.type = "sine";
            toneOsc.frequency.setValueAtTime(targetFreq, now);

            toneGain.gain.setValueAtTime(0.0001, now);
            toneGain.gain.linearRampToValueAtTime(0.035, now + 0.04);
            toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

            toneOsc.connect(toneGain);
            toneGain.connect(masterGain);
            if (convolver) toneGain.connect(convolver);
            toneOsc.start(now);
            toneOsc.stop(now + 0.46);
        }
    }

    // Mystical Whispering Harmonic Clue (plays target face's tone with ethereal reverberation)
    function playWhisperHarmonic(faceIndex, rootFreq = 523.25) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const ratio = FACE_INTERVALS[faceIndex] || 1.0;
        const targetFreq = rootFreq * ratio;
        const now = ctx.currentTime;

        // Ethereal singing resonance
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(targetFreq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(gain);
        gain.connect(masterGain);
        if (convolver) gain.connect(convolver);

        osc.start(now);
        osc.stop(now + 2.25);

        // Overtone shimmer
        playBellChime(targetFreq * 2.0, 1.6);
    }

    // Celestial Chain Rattle & Scraping
    function playChainRattle() {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const count = 5;

        for (let i = 0; i < count; i++) {
            const hit = now + i * 0.07 + (Math.random() * 0.04);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(1600 + Math.random() * 1400, hit);
            osc.frequency.exponentialRampToValueAtTime(500, hit + 0.08);

            gain.gain.setValueAtTime(0.14, hit);
            gain.gain.exponentialRampToValueAtTime(0.001, hit + 0.075);

            osc.connect(gain);
            gain.connect(masterGain);
            if (convolver) gain.connect(convolver);

            osc.start(hit);
            osc.stop(hit + 0.09);
        }
    }

    // Box Solve Chord with Token-Specific Musical Key Root
    function playSolveWhoosh(baseRootFreq = 523.25) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Sub bass hell drop
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(28, now + 1.4);
        subGain.gain.setValueAtTime(0.65, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
        sub.connect(subGain);
        subGain.connect(masterGain);
        if (convolver) subGain.connect(convolver);
        sub.start(now);
        sub.stop(now + 1.6);

        // Diminished chords rooted on this token's unique key!
        // Intervals: 1.0, 1.189 (minor third), 1.414 (dim 5th), 1.682 (dim 7th), 2.0 (octave)
        const ratios = [1.0, 1.189, 1.414, 1.682, 2.0];
        ratios.forEach((r, i) => {
            setTimeout(() => {
                playBellChime(baseRootFreq * r, 3.2);
            }, i * 140);
        });

        setTimeout(playChainRattle, 320);
        setTimeout(playChainRattle, 700);
    }

    // Sub-harmonic Leviathan Hell Drone (Atmospheric Labyrinth Ambience)
    function startHellDrone() {
        ensureContext();
        if (!ctx) initAudio();
        if (!ctx) return;
        if (droneNodes.length > 0) return;

        const now = ctx.currentTime;
        droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.001, now);
        droneGain.gain.linearRampToValueAtTime(isMuted ? 0 : 0.42, now + 0.8);
        droneGain.connect(masterGain);
        if (convolver) {
            const wetSend = ctx.createGain();
            wetSend.gain.setValueAtTime(0.25, now);
            droneGain.connect(wetSend);
            wetSend.connect(convolver);
            droneNodes.push(wetSend);
        }

        // 1. Bedrock Sub-Bass Beating Sines (55Hz + 55.4Hz binaural pulse)
        [55.0, 55.4].forEach(freq => {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);

            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(0.14, now);
            lfoGain.gain.setValueAtTime(1.5, now);
            lfo.connect(osc.frequency);

            osc.connect(droneGain);
            osc.start(now);
            lfo.start(now);

            droneNodes.push(osc, lfo, lfoGain);
        });

        // 2. Menacing Leviathan Harmonics (110Hz + 164.8Hz dark filtered triangle)
        // Provides rich low-mid presence clearly audible on laptops, phones, and headphones
        const darkFilter = ctx.createBiquadFilter();
        darkFilter.type = "lowpass";
        darkFilter.frequency.setValueAtTime(260, now);
        darkFilter.Q.setValueAtTime(2.2, now);
        darkFilter.connect(droneGain);
        droneNodes.push(darkFilter);

        [110.0, 164.8].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = (idx === 0) ? "triangle" : "sine";
            osc.frequency.setValueAtTime(freq, now);

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.24, now);

            osc.connect(oscGain);
            oscGain.connect(darkFilter);
            osc.start(now);

            droneNodes.push(osc, oscGain);
        });

        // 3. Slow Leviathan breathing filter sweep
        const filterLfo = ctx.createOscillator();
        const filterLfoGain = ctx.createGain();
        filterLfo.frequency.setValueAtTime(0.08, now);
        filterLfoGain.gain.setValueAtTime(90, now);
        filterLfo.connect(darkFilter.frequency);
        filterLfo.start(now);
        droneNodes.push(filterLfo, filterLfoGain);
    }

    function stopHellDrone() {
        if (!droneGain || !ctx) return;
        const now = ctx.currentTime;
        droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        setTimeout(() => {
            droneNodes.forEach(node => {
                try {
                    if (typeof node.stop === 'function') node.stop();
                    if (typeof node.disconnect === 'function') node.disconnect();
                } catch (e) {}
            });
            droneNodes = [];
            droneGain = null;
        }, 550);
    }

    // Auto-suspend Web Audio when tab is hidden to save battery
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (!ctx) return;
            if (document.hidden) {
                if (ctx.state === 'running') ctx.suspend();
            } else {
                if (!isMuted && ctx.state === 'suspended') ctx.resume();
            }
        });
    }

    // Multi-tooth Brass Gear Ratchet Twist sound
    function playRatchetTwist(rate = 1.0) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        playWoodSlide();
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                playClockworkTick(1.1 + i * 0.18 * rate);
            }, i * 65);
        }
    }

    // High-pitched cold steel/brass shear scrape for razor blades
    function playBladeSlide() {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.exponentialRampToValueAtTime(2800, now + 0.18);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1200, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        if (convolver) gain.connect(convolver);

        osc.start(now);
        osc.stop(now + 0.23);
    }

    // Kirsty Banishment Ritual Sound - Reverse sweeping harmonics, receding void, and heavy lock clunk
    function playBanish(rootFreq = 523.25) {
        if (isMuted) return;
        ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Receding harmonic sweep (reverse octave cascade)
        const sweepOsc = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweepOsc.type = "sine";
        sweepOsc.frequency.setValueAtTime(rootFreq * 2.0, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(rootFreq * 0.45, now + 0.65);

        sweepGain.gain.setValueAtTime(0.35, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.70);

        sweepOsc.connect(sweepGain);
        sweepGain.connect(masterGain);
        if (convolver) sweepGain.connect(convolver);
        sweepOsc.start(now);
        sweepOsc.stop(now + 0.72);

        // 2. Chime resolution
        setTimeout(() => {
            playBellChime(rootFreq, 2.2);
        }, 120);

        // 3. Resounding solid locking catch thud
        setTimeout(() => {
            playWoodSlide();
            playClockworkTick(0.85);
            playResistanceClunk();
        }, 320);
    }

    return {
        initAudio,
        ensureContext,
        toggleMute,
        setMute,
        isMuted: () => isMuted,
        playClockworkTick,
        playWoodSlide,
        playBellChime,
        playChainRattle,
        playSolveWhoosh,
        playFaceTone,
        playResistanceClunk,
        playTumblerClick,
        playFaceHover,
        playWhisperHarmonic,
        playRatchetTwist,
        playBladeSlide,
        playBanish,
        startHellDrone,
        stopHellDrone
    };
}));
