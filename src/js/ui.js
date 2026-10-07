/**
 * Lemarchand's Box - High-Fidelity UI Controller & Lifecycle HUD
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.LemarchandUI = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    class UIController {
        constructor(engine, puzzle, audio, traitsEngine) {
            this.audio = audio || (typeof LemarchandAudio !== 'undefined' ? LemarchandAudio : null);
            this.traitsEngine = traitsEngine || (typeof LemarchandTraits !== 'undefined' ? LemarchandTraits : null);
            this.engine = engine || (typeof LemarchandEngine !== 'undefined' ? new LemarchandEngine(document.getElementById('webglCanvas')) : null);
            this.puzzle = puzzle || (typeof LemarchandPuzzle !== 'undefined' ? new LemarchandPuzzle(this.engine, this.audio) : null);

            this.currentTokenId = 1;
            this.droneActive = false;

            this.dom = {
                tokenInput: document.getElementById('tokenInput'),
                prevBtn: document.getElementById('prevTokenBtn'),
                nextBtn: document.getElementById('nextTokenBtn'),
                randomBtn: document.getElementById('randomTokenBtn'),
                tokenTitle: document.getElementById('tokenTitle'),
                rarityBadge: document.getElementById('rarityBadge'),
                rarityScore: document.getElementById('rarityScore'),
                traitList: document.getElementById('traitList'),
                journalEntry: document.getElementById('journalEntry'),
                puzzleHint: document.getElementById('puzzleHint'),
                puzzleProgress: document.getElementById('puzzleProgress'),
                tumblerTray: document.getElementById('tumblerTray'),
                faceHoverPill: document.getElementById('faceHoverPill'),
                btnKeyHelp: document.getElementById('btnKeyHelp'),
                btnWhisper: document.getElementById('btnWhisper'),
                faceJumpBar: document.getElementById('faceJumpBar'),
                stageSelect: document.getElementById('stageSelect'),

                // 6551 Reliquary & Automaton HUD
                vaultAddressText: document.getElementById('vaultAddressText'),
                btnCopyVaultAddress: document.getElementById('btnCopyVaultAddress'),
                btnToggleCopilot: document.getElementById('btnToggleCopilot'),
                maxSpendSlider: document.getElementById('maxSpendSlider'),
                maxSpendVal: document.getElementById('maxSpendVal'),
                vaultEthBal: document.getElementById('vaultEthBal'),
                enshrinedCount: document.getElementById('enshrinedCount'),
                vaultYieldBal: document.getElementById('vaultYieldBal'),
                enshrinedThumbnails: document.getElementById('enshrinedThumbnails'),
                btnAddSampleRelic: document.getElementById('btnAddSampleRelic'),

                // Dock Buttons
                btnStep: document.getElementById('btnStep'),
                btnSolve: document.getElementById('btnSolve'),
                btnBanish: document.getElementById('btnBanish') || document.getElementById('btnReset'),
                btnResetCam: document.getElementById('btnResetCam'),
                btnMagic: document.getElementById('btnMagic'),
                btnCapture: document.getElementById('btnCapture'),
                btnRotate: document.getElementById('btnRotate'),
                btnAudio: document.getElementById('btnAudio'),
                btnDrone: document.getElementById('btnDrone')
            };

            this.init();
        }

        init() {
            const params = new URLSearchParams(window.location.search);
            const idParam = parseInt(params.get('id') || window.location.hash.replace('#', ''));
            if (idParam && idParam >= 1 && idParam <= 1000) {
                this.currentTokenId = idParam;
            }

            this.bindEvents();
            this.loadToken(this.currentTokenId);

            // Hook 3D face hover feedback
            this.engine.onFaceHover = (faceIndex) => {
                if (this.dom.faceHoverPill) {
                    const faceNames = ["Top Rosette (Zenith)", "Bottom Astrolabe (Nadir)", "Front Labyrinth (Chamber)", "Back Escapement (Clockwork)", "Right Cross (Quadrant)", "Left Chevrons (Prism)"];
                    const name = faceNames[faceIndex] || `Face ${faceIndex}`;
                    const expectedFace = (this.puzzle && this.puzzle.sequence) ? this.puzzle.sequence[this.puzzle.solvedSteps] : -1;
                    let prefix = "✨";
                    let action = "Click Dial to Turn";
                    if (faceIndex === expectedFace && this.puzzle.currentStage < 6) {
                        prefix = "🔑 ACTIVE CIPHER •";
                        action = "Turn Dial to Engage";
                    }
                    this.dom.faceHoverPill.textContent = `${prefix} ${name.toUpperCase()} • ${action}`;
                    this.dom.faceHoverPill.classList.add('visible');
                }
            };

            this.engine.onFaceUnhover = () => {
                if (this.dom.faceHoverPill) {
                    this.dom.faceHoverPill.classList.remove('visible');
                }
            };

            // Hook puzzle state changes
            this.puzzle.onStateChange = (stateInfo) => {
                if (this.dom.puzzleHint) {
                    this.dom.puzzleHint.textContent = stateInfo.feedback ? `${stateInfo.feedback}` : stateInfo.hint;
                }
                if (this.dom.puzzleProgress) {
                    this.dom.puzzleProgress.textContent = `Tumbler: ${stateInfo.solvedSteps || 0} / ${stateInfo.totalSteps || 3} • Stage: ${stateInfo.stage} / 9 ${stateInfo.isGatewayOpen ? '• GATEWAY UNSEALED' : ''}`;
                }
                if (this.dom.stageSelect) {
                    this.dom.stageSelect.value = `${Math.min(9, Math.round(stateInfo.stage))}`;
                }

                // Highlight active pattern button
                document.querySelectorAll('.pattern-btn').forEach(btn => {
                    const st = parseInt(btn.getAttribute('data-stage'));
                    btn.classList.toggle('active', st === Math.round(stateInfo.stage));
                });

                // Render Mechanical Tumbler Tray
                if (this.dom.tumblerTray && stateInfo.tumblerStates) {
                    this.dom.tumblerTray.innerHTML = stateInfo.tumblerStates.map((ts, idx) => {
                        let icon = "🔒";
                        let tag = "LOCKED";
                        let title = "Cipher Locked • Solve preceding tumblers";
                        let dataFace = "-1";

                        if (ts.status === "solved") {
                            icon = "✔";
                            tag = "DISENGAGED";
                            title = `Click to inspect ${ts.faceName} in 3D`;
                            dataFace = `${ts.faceIndex}`;
                        } else if (ts.status === "active") {
                            icon = "🔑";
                            tag = "ACTIVE CIPHER";
                            title = "Active Catch • Decipher poetic clue or listen to Whisper Clue";
                        }

                        return `
                            <div class="tumbler-chip status-${ts.status}" data-face="${dataFace}" title="${title}">
                                <div class="tumbler-info">
                                    <span class="tumbler-icon">${icon}</span>
                                    <span class="tumbler-name">Tumbler ${idx + 1}: ${ts.faceName}</span>
                                </div>
                                <span class="tumbler-tag">${tag}</span>
                            </div>
                        `;
                    }).join('');

                    // Add click handlers on chips to inspect corresponding face in 3D (only for solved tumblers)
                    this.dom.tumblerTray.querySelectorAll('.tumbler-chip').forEach(chip => {
                        chip.addEventListener('click', () => {
                            const faceId = parseInt(chip.getAttribute('data-face'));
                            if (!isNaN(faceId) && faceId >= 0) this.engine.focusFace(faceId);
                        });
                    });
                }

                // Render Dynamic Occult Journal Lore tailored to active configuration
                if (this.dom.journalEntry && stateInfo.stageLore) {
                    if (stateInfo.isGatewayOpen && stateInfo.proclamation) {
                        this.dom.journalEntry.innerHTML = `
                            <div class="journal-title" style="color: #ff7788; font-weight: bold; font-size: 0.78rem; margin-bottom: 4px; letter-spacing: 0.5px;">${stateInfo.stageLore.title}</div>
                            <div class="journal-quote" style="color: #ff99aa; font-style: italic; font-size: 0.95rem; margin-bottom: 4px; line-height: 1.35;">${stateInfo.proclamation}</div>
                            <div class="journal-source" style="color: var(--text-muted); font-size: 0.70rem; text-align: right;">— Cenobite Summoning Rite</div>
                        `;
                    } else {
                        this.dom.journalEntry.innerHTML = `
                            <div class="journal-title" style="color: var(--brass-bright); font-weight: bold; font-size: 0.78rem; margin-bottom: 4px; letter-spacing: 0.5px;">${stateInfo.stageLore.title}</div>
                            <div class="journal-quote" style="color: var(--text-main); font-style: italic; margin-bottom: 4px; line-height: 1.35;">${stateInfo.stageLore.quote}</div>
                            <div class="journal-source" style="color: var(--text-muted); font-size: 0.70rem; text-align: right;">${stateInfo.stageLore.source}</div>
                        `;
                    }
                }

                if (this.dom.btnSolve) this.dom.btnSolve.classList.toggle('active', stateInfo.isGatewayOpen);
                if (this.dom.btnBanish) this.dom.btnBanish.classList.toggle('active', stateInfo.stage > 0);
            };

            // Direct 3D box dial interaction (interactive playable solving)
            this.engine.onDialClick = (faceIndex) => {
                this.puzzle.handleDialInput(faceIndex);
            };

            if (this.dom.btnAudio) {
                this.dom.btnAudio.textContent = "🔊 Sound: Active";
                this.dom.btnAudio.classList.add('active');
            }

            if (this.dom.btnMagic) {
                this.dom.btnMagic.textContent = "✨ Magic FX: ON";
                this.dom.btnMagic.classList.add('active');
            }
        }

        bindEvents() {
            const awakenAudio = () => {
                if (this.audio) this.audio.ensureContext();
            };
            window.addEventListener('click', awakenAudio, { once: true });
            window.addEventListener('touchstart', awakenAudio, { once: true });

            // Token Navigation
            if (this.dom.prevBtn) {
                this.dom.prevBtn.addEventListener('click', () => {
                    this.loadToken(this.currentTokenId > 1 ? this.currentTokenId - 1 : 1000);
                });
            }

            if (this.dom.nextBtn) {
                this.dom.nextBtn.addEventListener('click', () => {
                    this.loadToken(this.currentTokenId < 1000 ? this.currentTokenId + 1 : 1);
                });
            }

            if (this.dom.randomBtn) {
                this.dom.randomBtn.addEventListener('click', () => {
                    const rnd = Math.floor(Math.random() * 1000) + 1;
                    this.loadToken(rnd);
                });
            }

            if (this.dom.tokenInput) {
                this.dom.tokenInput.addEventListener('change', (e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 1;
                    val = Math.max(1, Math.min(1000, val));
                    this.loadToken(val);
                });
            }

            // Mechanical Actions
            if (this.dom.btnStep) {
                this.dom.btnStep.addEventListener('click', () => this.puzzle.stepForward());
            }

            if (this.dom.btnSolve) {
                this.dom.btnSolve.addEventListener('click', () => this.puzzle.solve());
            }

            if (this.dom.btnBanish) {
                this.dom.btnBanish.addEventListener('click', () => this.puzzle.banish());
            }

            // Magic FX Toggle
            if (this.dom.btnMagic) {
                this.dom.btnMagic.addEventListener('click', () => {
                    this.engine.magicEnabled = !this.engine.magicEnabled;
                    this.dom.btnMagic.textContent = this.engine.magicEnabled ? "✨ Magic FX: ON" : "✨ Magic FX: OFF";
                    this.dom.btnMagic.classList.toggle('active', this.engine.magicEnabled);
                });
            }

            // HD Snapshot Capture
            if (this.dom.btnCapture) {
                this.dom.btnCapture.addEventListener('click', () => {
                    const dataUrl = this.engine.captureSnapshot();
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = `Lemarchands-Box-#${this.currentTokenId}.png`;
                    a.click();
                });
            }

            // Stage Selector Dropdown
            if (this.dom.stageSelect) {
                this.dom.stageSelect.addEventListener('change', (e) => {
                    const st = parseInt(e.target.value);
                    if (!isNaN(st)) this.puzzle.setStage(st);
                });
            }

            // Movie Configurations Pattern Buttons
            document.querySelectorAll('.pattern-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const st = parseInt(btn.getAttribute('data-stage'));
                    if (!isNaN(st)) this.puzzle.setStage(st);
                });
            });

            // Keyboard Help Guide
            if (this.dom.btnKeyHelp) {
                this.dom.btnKeyHelp.addEventListener('click', () => {
                    if (this.dom.puzzleHint) {
                        this.dom.puzzleHint.textContent = "⌨️ [1-6] Inspect Faces • [Shift+0-9] Jump Config • [ [ / ] ] Prev/Next • [S] Step • [B] Banish • [W] Whisper • [R] Center • [Space] Orbit";
                    }
                });
            }

            // Whisper Clue
            if (this.dom.btnWhisper) {
                this.dom.btnWhisper.addEventListener('click', () => {
                    this.puzzle.playCurrentClueTone();
                });
            }

            // Camera Reset / Center Relic
            if (this.dom.btnResetCam) {
                this.dom.btnResetCam.addEventListener('click', () => {
                    this.engine.resetCamera();
                });
            }

            // Face Jump Bar
            if (this.dom.faceJumpBar) {
                this.dom.faceJumpBar.querySelectorAll('.face-jump-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const faceIdx = parseInt(btn.getAttribute('data-face'));
                        if (!isNaN(faceIdx)) this.engine.focusFace(faceIdx);
                    });
                });
            }

            // Keyboard Navigation (1-6 for faces, Shift+0-9 for stages, S for step, B for banish, R to center, W for whisper, Space for orbit)
            window.addEventListener('keydown', (e) => {
                if (e.target && e.target.tagName === 'INPUT') return;

                const key = e.key;
                if (e.shiftKey && key >= '0' && key <= '9') {
                    // Shift + 0-9: Jump directly to Configuration 0 to 9!
                    this.puzzle.setStage(parseInt(key));
                } else if (key >= '1' && key <= '6') {
                    const faceIdx = parseInt(key) - 1;
                    this.engine.focusFace(faceIdx);
                } else if (key === 's' || key === 'S') {
                    if (this.dom.btnStep) this.dom.btnStep.click();
                } else if (key === 'b' || key === 'B') {
                    if (this.dom.btnBanish) this.dom.btnBanish.click();
                } else if (key === '[') {
                    this.puzzle.setStage(this.puzzle.currentStage - 1);
                } else if (key === ']') {
                    this.puzzle.setStage(this.puzzle.currentStage + 1);
                } else if (key === 'r' || key === 'R') {
                    this.engine.resetCamera();
                } else if (key === 'w' || key === 'W') {
                    this.puzzle.playCurrentClueTone();
                } else if (key === ' ') {
                    e.preventDefault();
                    if (this.dom.btnRotate) this.dom.btnRotate.click();
                }
            });

            // Camera Orbit
            if (this.dom.btnRotate) {
                this.dom.btnRotate.addEventListener('click', () => {
                    this.engine.autoRotate = !this.engine.autoRotate;
                    this.dom.btnRotate.classList.toggle('active', this.engine.autoRotate);
                    this.dom.btnRotate.textContent = this.engine.autoRotate ? "🔁 Auto-Orbit: ON" : "⏸️ Auto-Orbit: OFF";
                });
            }

            // Audio Controls
            if (this.dom.btnAudio) {
                this.dom.btnAudio.addEventListener('click', () => {
                    const muted = this.audio.toggleMute();
                    this.dom.btnAudio.textContent = muted ? "🔇 Muted" : "🔊 Sound: Active";
                    this.dom.btnAudio.classList.toggle('active', !muted);
                });
            }

            if (this.dom.btnDrone) {
                this.dom.btnDrone.addEventListener('click', () => {
                    this.droneActive = !this.droneActive;
                    if (this.droneActive) {
                        if (this.audio) {
                            this.audio.ensureContext();
                            this.audio.startHellDrone();
                        }
                        this.dom.btnDrone.textContent = "🌀 Hell Drone: ON";
                        this.dom.btnDrone.classList.add('active');
                        if (this.dom.puzzleHint) {
                            this.dom.puzzleHint.textContent = "🌀 Leviathan's Hell Drone active: 55Hz/110Hz sub-harmonic pulse echoing from the Cenobite labyrinth.";
                        }
                    } else {
                        if (this.audio) {
                            this.audio.stopHellDrone();
                        }
                        this.dom.btnDrone.textContent = "🌀 Hell Drone: OFF";
                        this.dom.btnDrone.classList.remove('active');
                        if (this.dom.puzzleHint) {
                            this.dom.puzzleHint.textContent = "🌀 Hell Drone silenced.";
                        }
                    }
                });
            }

            // 6551 Reliquary & Automaton Copilot Events
            if (this.dom.btnToggleCopilot) {
                this.dom.btnToggleCopilot.addEventListener('click', () => {
                    const state = this.getReliquaryState(this.currentTokenId);
                    state.copilotEnabled = !state.copilotEnabled;
                    this.saveReliquaryState(this.currentTokenId, state);

                    this.dom.btnToggleCopilot.textContent = state.copilotEnabled ? "ON" : "OFF";
                    this.dom.btnToggleCopilot.classList.toggle('active', state.copilotEnabled);

                    if (this.audio && this.audio.playTumblerClick) {
                        this.audio.playTumblerClick(state.copilotEnabled ? 0 : 3);
                    }
                    if (this.dom.puzzleHint) {
                        this.dom.puzzleHint.textContent = state.copilotEnabled
                            ? "🤖 Automaton Copilot ACTIVE: Ready to mint drops via pre-simulated batch dispatcher."
                            : "⏸️ Automaton Copilot PAUSED: Box will not participate in automated mints.";
                    }
                });
            }

            if (this.dom.maxSpendSlider) {
                this.dom.maxSpendSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (this.dom.maxSpendVal) {
                        this.dom.maxSpendVal.textContent = `${val.toFixed(3)} ETH`;
                    }
                });
                this.dom.maxSpendSlider.addEventListener('change', (e) => {
                    const val = parseFloat(e.target.value);
                    const state = this.getReliquaryState(this.currentTokenId);
                    state.maxSpendETH = val;
                    this.saveReliquaryState(this.currentTokenId, state);
                    if (this.audio && this.audio.playFaceHover) {
                        this.audio.playFaceHover(2, 600);
                    }
                });
            }

            if (this.dom.btnCopyVaultAddress) {
                this.dom.btnCopyVaultAddress.addEventListener('click', () => {
                    const fullAddr = this.computeTBAAddress(this.currentTokenId);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(fullAddr).then(() => {
                            const orig = this.dom.btnCopyVaultAddress.textContent;
                            this.dom.btnCopyVaultAddress.textContent = "✓ Copied!";
                            setTimeout(() => { if (this.dom.btnCopyVaultAddress) this.dom.btnCopyVaultAddress.textContent = orig; }, 1800);
                        }).catch(() => {});
                    }
                });
            }

            if (this.dom.btnAddSampleRelic) {
                this.dom.btnAddSampleRelic.addEventListener('click', () => {
                    const state = this.getReliquaryState(this.currentTokenId);
                    const sampleRelics = [
                        { theme: "CUCKS", name: "STRAY CUCK #527" },
                        { theme: "OCCULT", name: "LEVIATHAN SEAL #42" },
                        { theme: "CUCKS", name: "CROWNED ORANGE TABBY" },
                        { theme: "OCCULT", name: "OBSIDIAN LABYRINTH" }
                    ];
                    const nextRelic = sampleRelics[state.relics.length % sampleRelics.length];
                    if (state.relics.length >= 4) {
                        state.relics = [nextRelic];
                    } else {
                        state.relics.push(nextRelic);
                    }
                    this.saveReliquaryState(this.currentTokenId, state);
                    this.renderReliquaryHUD(this.currentTokenId);

                    if (this.audio && this.audio.playSolveChime) {
                        this.audio.playSolveChime();
                    }
                    if (this.dom.puzzleHint) {
                        this.dom.puzzleHint.textContent = `✨ Relic [${nextRelic.name}] enshrined into 6551 vault and assembled into cube interior!`;
                    }
                });
            }
        }

        loadToken(id) {
            this.currentTokenId = id;
            if (this.dom.tokenInput) this.dom.tokenInput.value = id;

            try {
                if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                    window.history.replaceState(null, null, `?id=${id}`);
                }
            } catch (e) {
                // Ignore SecurityError on file:// protocol
            }

            const data = this.traitsEngine.resolveTraits(id);
            this.engine.buildBox(data);
            this.puzzle.loadToken(data);
            this.renderHUD(data);
        }

        renderHUD(data) {
            if (this.dom.tokenTitle) {
                this.dom.tokenTitle.textContent = data.title;
            }

            if (this.dom.rarityBadge) {
                this.dom.rarityBadge.textContent = data.rarityTier;
                this.dom.rarityBadge.className = `rarity-badge tier-${data.rarityTier.toLowerCase().replace(/\s+/g, '-')}`;
            }

            if (this.dom.rarityScore) {
                this.dom.rarityScore.textContent = `Rarity Score: ${data.rarityScore}`;
            }

            if (this.dom.journalEntry) {
                this.dom.journalEntry.textContent = `“${data.lore.journalEntry}”`;
            }

            if (this.dom.puzzleHint) {
                this.dom.puzzleHint.textContent = this.puzzle.getHint();
            }

            if (this.dom.puzzleProgress) {
                this.dom.puzzleProgress.textContent = `Tumbler: 0 / ${this.puzzle.totalSteps} • Stage: 0 / 5 (DORMANT)`;
            }

            if (this.dom.traitList) {
                const entries = [
                    { label: "Configuration", val: data.traits.configuration },
                    { label: "Base Wood", val: data.traits.baseWood },
                    { label: "Filigree Metal", val: data.traits.filigreeMetal },
                    { label: "Aperture Core", val: data.traits.innerApertureCore },
                    { label: "Occult Circle", val: data.traits.occultMagicCircle },
                    { label: "Summoned Patron", val: data.traits.summonedPatron },
                    { label: "Atmosphere", val: data.traits.atmosphere },
                    { label: "Harmonics", val: data.traits.acousticHarmonics },
                    { label: "Difficulty", val: data.traits.solvingComplexity }
                ];

                this.dom.traitList.innerHTML = entries.map(item => `
                    <div class="trait-row">
                        <span class="trait-label">${item.label}</span>
                        <span class="trait-val" title="${item.val}">${item.val}</span>
                    </div>
                `).join('');
            }

            this.renderReliquaryHUD(this.currentTokenId);
        }

        computeTBAAddress(tokenId) {
            const hexId = tokenId.toString(16).padStart(4, '0');
            return `0x6551${hexId}9a7b24C8F0024E09117841784${hexId}`;
        }

        getReliquaryState(tokenId) {
            const key = `lemarchand_6551_${tokenId}`;
            try {
                const saved = localStorage.getItem(key);
                if (saved) return JSON.parse(saved);
            } catch (e) {}

            return {
                copilotEnabled: true,
                maxSpendETH: 0.05,
                dailySpendLimit: 0.20,
                vaultETH: 0.10,
                vaultUSDC: 500,
                relics: [
                    { theme: "CUCKS", name: "STRAY CUCK #527" },
                    { theme: "OCCULT", name: `LEVIATHAN SEAL #${tokenId}` }
                ]
            };
        }

        saveReliquaryState(tokenId, state) {
            const key = `lemarchand_6551_${tokenId}`;
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (e) {}
        }

        renderReliquaryHUD(tokenId) {
            const vaultAddr = this.computeTBAAddress(tokenId);
            if (this.dom.vaultAddressText) {
                this.dom.vaultAddressText.textContent = `${vaultAddr.substring(0, 6)}...${vaultAddr.substring(38)}`;
                this.dom.vaultAddressText.title = vaultAddr;
            }

            const state = this.getReliquaryState(tokenId);

            if (this.dom.btnToggleCopilot) {
                this.dom.btnToggleCopilot.textContent = state.copilotEnabled ? "ON" : "OFF";
                this.dom.btnToggleCopilot.classList.toggle('active', state.copilotEnabled);
            }

            if (this.dom.maxSpendSlider) {
                this.dom.maxSpendSlider.value = state.maxSpendETH;
            }
            if (this.dom.maxSpendVal) {
                this.dom.maxSpendVal.textContent = `${Number(state.maxSpendETH).toFixed(3)} ETH`;
            }

            if (this.dom.vaultEthBal) {
                this.dom.vaultEthBal.textContent = `${Number(state.vaultETH).toFixed(2)} ETH`;
            }
            if (this.dom.enshrinedCount) {
                this.dom.enshrinedCount.textContent = `${state.relics.length} NFTs`;
            }
            if (this.dom.vaultYieldBal) {
                this.dom.vaultYieldBal.textContent = `${state.vaultUSDC} USDC`;
            }

            this.renderRelicThumbnails(state.relics);

            if (this.engine && this.engine.setEnshrinedRelics) {
                this.engine.setEnshrinedRelics(state.relics);
            }
        }

        renderRelicThumbnails(relics) {
            if (!this.dom.enshrinedThumbnails) return;
            this.dom.enshrinedThumbnails.innerHTML = '';

            relics.forEach((r, idx) => {
                const item = document.createElement('div');
                item.className = 'enshrined-thumb-item';
                item.title = `Enshrined Relic #${idx + 1}: ${r.name}`;

                if (typeof LemarchandTextures !== 'undefined' && LemarchandTextures.generateReliquaryCameoTexture) {
                    const tex = LemarchandTextures.generateReliquaryCameoTexture(r);
                    if (tex && tex.canvas) {
                        item.appendChild(tex.canvas);
                    } else {
                        item.textContent = "NFT";
                    }
                } else {
                    item.textContent = "NFT";
                }

                item.addEventListener('click', () => {
                    if (this.dom.puzzleHint) {
                        this.dom.puzzleHint.textContent = `👁️ Enshrined Relic: [${r.name}] held safely in 6551 vault. Assembled into cube drawer #${idx + 1}.`;
                    }
                    if (this.audio && this.audio.playFaceHover) {
                        this.audio.playFaceHover(idx % 6, 700);
                    }
                });

                this.dom.enshrinedThumbnails.appendChild(item);
            });
        }
    }

    return UIController;
}));
