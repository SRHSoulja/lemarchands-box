/**
 * Lemarchand's Box - Puzzle Lifecycle Manager
 * Controls the 5 authentic kinematic stages, audio cues, and Cenobite proclamations.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.LemarchandPuzzle = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const STAGE_HINTS = [
        "Stage 0 (Lament): The relic is dormant. Depress the Zenith Rosette to begin the incision.",
        "Stage 1 (Flanged Shift): Simon Sayce 1987 horizontal tier split. Dovetails expose internal gear clockwork.",
        "Stage 2 (Stepped Ziggurat): Frank Cotton attic staircase. Diagonal blocks step into 3D terraced labyrinth.",
        "Stage 3 (Pinwheel Swirl): Tiffany Hellbound 1988 windmill aperture. Edges whirl tangentially around the core.",
        "Stage 4 (Octagram Star): Hellbound 45° axial twist. Interlocking star prism with exposed brass flanges.",
        "Stage 5 (Dovetail Drawers): Secret corner key drawers telescope outward along diagonal dovetails.",
        "Stage 6 (Lauder Star Bloom): Central locks release. The 16 blocks bloom outward into 8 fluted star chasms.",
        "Stage 7 (Liminal Monolith): The pillar elongates into the tesseract monolith as 4 razor brass blades extend.",
        "Stage 8 (Lazarus Rhombus): The geometric matrix folds into the occult diamond of Leviathan's labyrinth.",
        "Stage 9 (Gateway Climax): THE GATEWAY IS OPEN. Living hooked chains erupt into mortal space. 'We came.'"
    ];

    const FACE_POETIC_CLUES = [
        "Seek the Zenith Rosette watching the northern stars",
        "Turn the Nadir Astrolabe charting the abyss beneath",
        "Untangle the Concentric Labyrinth where the minotaur dreams",
        "Disengage the Clockwork Escapement counting mortal seconds",
        "Align the Golden Quadrant Cross of the Four Elements",
        "Follow the Radiating Chevrons into the prism void"
    ];

    const CENOBITE_PROCLAMATIONS = [
        "“The box. You opened it. We came.”",
        "“We have such sights to show you.”",
        "“Demons to some, angels to others.”",
        "“Explorers in the further regions of experience.”",
        "“It is not hands that call us. It is desire.”",
        "“No tears, please. It is a waste of good suffering.”"
    ];

    const FACE_NAMES = [
        "Top Rosette (Zenith)",
        "Bottom Astrolabe (Nadir)",
        "Front Labyrinth (Chamber)",
        "Back Escapement (Clockwork)",
        "Right Cross (Quadrant)",
        "Left Chevrons (Prism)"
    ];

    const STAGE_LORE = [
        {
            title: "Configuration 0: Lament (Dormant Cube)",
            quote: "“The box rests as a silent cube of lacquered rosewood and etched brass. It awaits the touch of one whose hunger exceeds mortal measure.”",
            source: "— Philip Lemarchand, Workshop Journal (Paris, 1784)"
        },
        {
            title: "Configuration 1: Flanged Shift (Simon Sayce 1987)",
            quote: "“The first depression releases the internal catch. The upper hemisphere slides smoothly along the dovetail groove, revealing the dark iron chassis and the heart of the escapement.”",
            source: "— Frank Cotton, Attic Notebook (Hellraiser, 1987)"
        },
        {
            title: "Configuration 2: Stepped Ziggurat (Frank Cotton Attic)",
            quote: "“Staggered along diagonal vectors, the planes step downward like the terraces of Babylon. Each level locks into the next with a distinct dry click of 200-year-old French clockwork.”",
            source: "— Frank Cotton, Attic Notebook (Hellraiser, 1987)"
        },
        {
            title: "Configuration 3: Pinwheel Swirl (Hellbound 1988)",
            quote: "“The lateral plates revolve tangentially around the core in counter-rotation. A four-bladed windmill of brass teeth, opening an aperture that hungers for the void.”",
            source: "— Dr. Channard, Case Studies in Compulsion (Hellbound, 1988)"
        },
        {
            title: "Configuration 4: 45° Octagram Star Prism (Hellbound 1988)",
            quote: "“A forty-five degree twist along the vertical axis transforms the square into an eight-pointed star prism. The interlocking teeth hold fast, defying Euclidean geometry.”",
            source: "— The Channard Memorial Records (Hellbound, 1988)"
        },
        {
            title: "Configuration 5: Dovetail Drawers (Secret Chambers)",
            quote: "“Secret corner keys pull outward along internal sliding tracks. Hidden chambers within the wood reveal the central brass bell cylinder rising from the shadows.”",
            source: "— Philip Lemarchand, Architectural Compendium (1784)"
        },
        {
            title: "Configuration 6: Lauder Star Bloom (8 Fluted Chasms)",
            quote: "“The central locks release entirely. The sixteen facets bloom outward like the petals of a metallic flower, revealing the eight fluted chasms where blinding golden light bleeds through.”",
            source: "— Occult Treatise on Lemarchand’s Geometries"
        },
        {
            title: "Configuration 7: Liminal Monolith & Blades (2022 Offering)",
            quote: "“The box elongates into a soaring tesseract pillar. From the midsection incision, four sacrificial brass razor blades shoot outward. The puzzle demands its price: blood must flow before the threshold opens.”",
            source: "— The Priest’s Covenant (Hellraiser, 2022)"
        },
        {
            title: "Configuration 8: Lazarus Leviathan Diamond (The God of Hell)",
            quote: "“The facets stretch and contract into the elongated rhombus of Leviathan—the black geometric diamond rotating eternally in the cold skies above Hell’s labyrinth.”",
            source: "— Kirsty Cotton’s Testimony (Hellbound, 1988)"
        },
        {
            title: "Configuration 9: Cenobite Gateway Climax (Living Chains)",
            quote: "“‘The box. You opened it. We came. Now you must come with us, taste our pleasures.’ Living hooked chains erupt from the rift, tearing through the veil of mortal space.”",
            source: "— The Hell Priest (Pinhead)"
        }
    ];

    class PuzzleManager {
        constructor(engine, audio) {
            this.engine = engine;
            this.audio = audio;
            this.currentStage = 0; // 0 to 9
            this.totalStages = 9;
            this.isSolvingCinematic = false;
            this.onStateChange = null;

            // Interactive Solving Combination State
            this.tokenData = null;
            this.solvedSteps = 0;
            this.totalSteps = 3;
            this.sequence = [];
            this.sequenceClues = [];
            this.lastFeedback = "";
        }

        get isGatewayOpen() {
            return this.currentStage >= 9;
        }

        getFaceName(faceIndex) {
            return FACE_NAMES[faceIndex] || `Face ${faceIndex}`;
        }

        loadToken(tokenData) {
            this.tokenData = tokenData;
            this.currentStage = 0;
            this.isSolvingCinematic = false;
            this.solvedSteps = 0;
            this.totalSteps = (tokenData && tokenData.puzzle && tokenData.puzzle.steps) ? tokenData.puzzle.steps : 3;
            this.sequence = (tokenData && tokenData.puzzle && tokenData.puzzle.sequence) ? tokenData.puzzle.sequence : [0, 4, 2];
            this.sequenceClues = (tokenData && tokenData.puzzle && tokenData.puzzle.sequenceClues) ? tokenData.puzzle.sequenceClues : [];
            this.lastFeedback = "The relic rests dormant. Decipher Philip Lemarchand's ciphers or listen to the harmonic whisper.";

            this.engine.setLifecycleStage(0);
            this.notify();
        }

        getRootFreq() {
            return (this.tokenData && this.tokenData.visualParameters && this.tokenData.visualParameters.keyFreq)
                ? this.tokenData.visualParameters.keyFreq
                : 523.25;
        }

        getHint() {
            if (this.currentStage >= 6) {
                return STAGE_HINTS[this.currentStage] || "THE GATEWAY IS OPEN. 'We have such sights to show you.'";
            }
            if (this.sequence && this.sequence[this.solvedSteps] !== undefined) {
                const targetFace = this.sequence[this.solvedSteps];
                const clue = FACE_POETIC_CLUES[targetFace] || this.sequenceClues[this.solvedSteps] || "";
                return `Cipher ${this.solvedSteps + 1} of ${this.totalSteps}: ${clue}`;
            }
            return STAGE_HINTS[this.currentStage] || "";
        }

        // Auditory clue: sounds the harmonic resonance pitch of the target face
        playCurrentClueTone() {
            if (this.currentStage >= 6) return;
            const expectedFace = this.sequence[this.solvedSteps];
            const rootFreq = this.getRootFreq();
            if (this.audio && this.audio.playWhisperHarmonic) {
                this.audio.playWhisperHarmonic(expectedFace, rootFreq);
            }
            this.lastFeedback = `Harmonic whisper chimed for Cipher ${this.solvedSteps + 1}. Listen to the pitch to locate the matching face!`;
            this.notify();
        }

        notify() {
            if (typeof this.onStateChange === 'function') {
                const isGatewayOpen = (this.currentStage >= 9);
                let proclamation = "";
                if (isGatewayOpen) {
                    const idx = (this.tokenData ? this.tokenData.tokenId : 1) % CENOBITE_PROCLAMATIONS.length;
                    proclamation = CENOBITE_PROCLAMATIONS[idx];
                }

                // Construct visual tumbler state array with Fog of War on future steps
                const tumblerStates = [];
                for (let i = 0; i < this.totalSteps; i++) {
                    const targetFaceIdx = this.sequence[i];
                    let status = "locked";
                    let displayName = "??? [SEALED CATCH]";
                    let clueText = "Locked behind preceding tumblers";

                    if (i < this.solvedSteps) {
                        status = "solved";
                        displayName = this.getFaceName(targetFaceIdx);
                        clueText = "Engaged & aligned";
                    } else if (i === this.solvedSteps) {
                        status = "active";
                        displayName = "Active Catch";
                        clueText = FACE_POETIC_CLUES[targetFaceIdx] || this.sequenceClues[i] || "";
                    }

                    tumblerStates.push({
                        index: i,
                        faceIndex: targetFaceIdx,
                        faceName: displayName,
                        clue: clueText,
                        status: status
                    });
                }

                this.onStateChange({
                    stage: this.currentStage,
                    totalStages: this.totalStages,
                    solvedSteps: this.solvedSteps,
                    totalSteps: this.totalSteps,
                    tumblerStates,
                    isGatewayOpen,
                    hint: this.getHint(),
                    feedback: this.lastFeedback,
                    proclamation,
                    stageLore: STAGE_LORE[this.currentStage] || STAGE_LORE[0]
                });
            }
        }

        // Direct user 3D face dial input (solving by hand with mechanical resistance)
        handleDialInput(faceIndex) {
            if (this.isSolvingCinematic) return;
            if (this.currentStage >= 6) return; // Beyond mechanical puzzle phase

            const expectedFace = this.sequence[this.solvedSteps];
            const rootFreq = this.getRootFreq();

            if (faceIndex === expectedFace) {
                // Correct face in the combination!
                this.engine.rotateDial(faceIndex);

                if (this.audio) {
                    this.audio.playFaceTone(faceIndex, rootFreq);
                    this.audio.playTumblerClick(this.solvedSteps, this.totalSteps, rootFreq);
                }

                this.solvedSteps++;
                const isComplete = (this.solvedSteps >= this.sequence.length);

                if (isComplete) {
                    // Seamless Climax: direct transition to Stage 9 Gateway Climax
                    this.currentStage = 9;
                    this.engine.setLifecycleStage(9.0);
                    this.lastFeedback = "Final tumbler clicked! The Schism unseals!";
                    if (this.audio) {
                        this.audio.playSolveWhoosh(rootFreq);
                        this.audio.playChainRattle();
                    }
                    this.notify();
                } else {
                    const progressRatio = this.solvedSteps / this.sequence.length;
                    // Map across the 5 mechanical puzzle stages (1.0 to 5.0) while solving steps
                    const targetStageProg = Math.min(5.5, progressRatio * 5.5);
                    const newStage = Math.min(5, Math.floor(targetStageProg));
                    if (newStage > this.currentStage) {
                        this.currentStage = newStage;
                    }
                    this.engine.setLifecycleStage(targetStageProg);

                    if (this.currentStage === 1 && this.audio) { this.audio.playWoodSlide(); this.audio.playClockworkTick(1.2); }
                    if (this.currentStage === 2 && this.audio) { this.audio.playWoodSlide(); this.audio.playClockworkTick(1.3); }
                    if (this.currentStage === 3 && this.audio) { if (this.audio.playRatchetTwist) this.audio.playRatchetTwist(1.0); else this.audio.playClockworkTick(1.4); }
                    if (this.currentStage === 4 && this.audio) { if (this.audio.playRatchetTwist) this.audio.playRatchetTwist(1.2); else this.audio.playClockworkTick(1.5); }
                    if (this.currentStage === 5 && this.audio) { this.audio.playWoodSlide(); this.audio.playTumblerClick(this.solvedSteps, this.totalSteps, rootFreq); }

                    const nextTargetFace = this.sequence[this.solvedSteps];
                    const nextClue = FACE_POETIC_CLUES[nextTargetFace] || this.sequenceClues[this.solvedSteps];
                    this.lastFeedback = `Tumbler ${this.solvedSteps}/${this.totalSteps} engaged! Next: ${nextClue}`;
                    this.notify();
                }
                return { success: true, solvedSteps: this.solvedSteps, complete: isComplete };
            } else {
                // Mechanically locked! Recoil jiggle & dull resistance clunk
                this.engine.jiggleFaceDial(faceIndex);
                if (this.audio && this.audio.playResistanceClunk) {
                    this.audio.playResistanceClunk();
                }
                const currentClue = FACE_POETIC_CLUES[expectedFace] || this.sequenceClues[this.solvedSteps];
                this.lastFeedback = `⚠️ The tumblers resist on ${this.getFaceName(faceIndex)}. Lemarchand demands: ${currentClue}`;
                this.notify();
                return { success: false, expectedFace: expectedFace };
            }
        }

        // Direct kinematic transform to any of the 10 configurations (0 to 9)
        setStage(stageNum) {
            this.isSolvingCinematic = false;
            this.currentStage = Math.max(0, Math.min(9, stageNum));
            this.engine.setLifecycleStage(this.currentStage);
            const rootFreq = this.getRootFreq();

            if (this.audio) {
                if (this.currentStage === 0) {
                    this.audio.playWoodSlide();
                } else if (this.currentStage === 1) {
                    this.audio.playWoodSlide();
                    this.audio.playClockworkTick(1.2);
                } else if (this.currentStage === 2) {
                    this.audio.playWoodSlide();
                    this.audio.playClockworkTick(1.3);
                } else if (this.currentStage === 3) {
                    if (this.audio.playRatchetTwist) this.audio.playRatchetTwist(1.0);
                    else this.audio.playClockworkTick(1.4);
                } else if (this.currentStage === 4) {
                    if (this.audio.playRatchetTwist) this.audio.playRatchetTwist(1.2);
                    else this.audio.playClockworkTick(1.5);
                } else if (this.currentStage === 5) {
                    this.audio.playWoodSlide();
                    this.audio.playClockworkTick(1.5);
                } else if (this.currentStage === 6) {
                    this.audio.playWoodSlide();
                    this.audio.playBellChime(rootFreq, 2.2);
                } else if (this.currentStage === 7) {
                    if (this.audio.playBladeSlide) this.audio.playBladeSlide();
                    this.audio.playBellChime(rootFreq * 1.189, 2.5);
                } else if (this.currentStage === 8) {
                    this.audio.playBellChime(rootFreq * 1.335, 2.8);
                } else if (this.currentStage === 9) {
                    this.audio.playSolveWhoosh(rootFreq);
                    this.audio.playChainRattle();
                }
            }

            this.lastFeedback = STAGE_HINTS[this.currentStage] || "";
            this.notify();
        }

        // Advance one stage through the 10-stage lifecycle (0 -> 1 -> 2 -> ... -> 9)
        stepForward() {
            if (this.currentStage >= 9) return;
            const nextSt = this.currentStage + 1;
            this.setStage(nextSt);
            this.solvedSteps = Math.min(this.totalSteps, Math.round((this.currentStage / 9) * this.totalSteps));
            this.notify();
        }

        // Full Cinematic Solving Ritual across all 10 stages
        solve() {
            if (this.isSolvingCinematic) return;
            this.isSolvingCinematic = true;
            this.solvedSteps = this.totalSteps;

            const stagesTimeline = [
                { stage: 1, delay: 0 },
                { stage: 2, delay: 550 },
                { stage: 3, delay: 1100 },
                { stage: 4, delay: 1650 },
                { stage: 5, delay: 2200 },
                { stage: 6, delay: 2850 },
                { stage: 7, delay: 3550 },
                { stage: 8, delay: 4250 },
                { stage: 9, delay: 5050 }
            ];

            stagesTimeline.forEach(({ stage, delay }) => {
                setTimeout(() => {
                    this.setStage(stage);
                    if (stage === 9) {
                        this.isSolvingCinematic = false;
                        this.notify();
                    }
                }, delay);
            });
        }

        // Direct kinematic transform to Stage 6 (Star Bloom)
        bloom() {
            this.setStage(6);
            this.lastFeedback = "The star chasms part; internal dovetails expand.";
            this.notify();
        }

        // Direct kinematic transform to Stage 9 (Cenobite Gateway & Chains)
        summon() {
            this.setStage(9);
            this.lastFeedback = "The Cenobite gateway opens. The Leviathan summons.";
            this.notify();
        }

        // Reverse Kirsty Banishment Protocol - Smoothly collapse back to Stage 0
        banish() {
            this.setStage(0);
            this.solvedSteps = 0;
            if (this.audio && this.audio.playBanish) {
                this.audio.playBanish(this.getRootFreq());
            }
            this.lastFeedback = "The mortal threshold is restored. The Lament Configuration seals flush.";
            this.notify();
        }

        reset() {
            this.banish();
        }
    }

    return PuzzleManager;
}));
