/* ═══════════════════════════════════════════════════════════════
   HAWKINS DIMENSIONAL TERMINAL - Main Application Controller
   Upside Down Communicator v1.983
   ═══════════════════════════════════════════════════════════════ */

const App = {
    currentMode: 'morse',
    isBooted: false,
    temperature: 68, // Starting temperature
    psiStrain: 0, // Eleven's power strain
    transmissionLog: [],

    // DOM Elements
    elements: {},

    init: function () {
        this.cacheElements();
        this.setupBootSequence();
        this.setupEventListeners();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    },

    // Cache DOM elements
    cacheElements: function () {
        this.elements = {
            bootScreen: document.getElementById('boot-screen'),
            terminal: document.getElementById('terminal-container'),
            messageInput: document.getElementById('message-input'),
            transmitBtn: document.getElementById('transmit-btn'),
            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value'),
            modeRadios: document.querySelectorAll('input[name="mode"]'),
            datetime: document.getElementById('datetime'),
            warningText: document.getElementById('warning-text'),
            // New creative elements
            tempValue: document.getElementById('temp-value'),
            tempFill: document.getElementById('temp-fill'),
            strainValue: document.getElementById('strain-value'),
            strainFill: document.getElementById('strain-fill'),
            nosebleedWarning: document.getElementById('nosebleed-warning'),
            dialNeedle: document.getElementById('dial-needle'),
            radioStatic: document.getElementById('radio-static'),
            clockChime: document.getElementById('clock-chime'),
            vecnaClock: document.getElementById('vecna-clock'),
            logEntries: document.getElementById('log-entries'),
            powerFlicker: document.getElementById('power-flicker-overlay'),
            audioIndicator: document.getElementById('audio-indicator')
        };
    },

    // Setup boot sequence animation
    setupBootSequence: function () {
        const bootLines = document.querySelectorAll('.boot-line');

        bootLines.forEach(line => {
            const delay = parseInt(line.dataset.delay) || 0;
            setTimeout(() => {
                line.style.animationDelay = '0s';
                line.style.animationPlayState = 'running';
            }, delay);
        });

        // Wait for key press to continue
        const bootHandler = (e) => {
            if (!this.isBooted) {
                this.completeBoot();
                document.removeEventListener('keydown', bootHandler);
                document.removeEventListener('click', bootHandler);
            }
        };

        // Auto-boot after 4 seconds or on input
        setTimeout(() => {
            document.addEventListener('keydown', bootHandler);
            document.addEventListener('click', bootHandler);
        }, 3000);

        // Force boot after 6 seconds
        setTimeout(() => {
            if (!this.isBooted) {
                this.completeBoot();
            }
        }, 6000);
    },

    // Complete boot sequence
    completeBoot: function () {
        if (this.isBooted) return;
        this.isBooted = true;

        // Initialize audio
        AudioController.init();
        AudioController.playBootSound();

        // Hide boot screen, show terminal
        this.elements.bootScreen.classList.add('hidden');
        this.elements.terminal.classList.remove('hidden');
        this.elements.terminal.classList.add('power-on');

        // Initialize components
        setTimeout(() => {
            OscilloscopeRenderer.init();
            SanityController.init();
            RecoveryController.init();

            // Focus input
            this.elements.messageInput?.focus();

            // Remove power-on class
            this.elements.terminal.classList.remove('power-on');

            // Start environmental systems
            this.startEnvironmentalSystems();
        }, 500);

        // Start random glitches
        this.startRandomGlitches();
    },

    // Setup event listeners
    setupEventListeners: function () {
        // Transmit button
        this.elements.transmitBtn?.addEventListener('click', () => {
            this.handleTransmit();
        });

        // Enter key to transmit
        this.elements.messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleTransmit();
            }
        });

        // Mode selection
        this.elements.modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentMode = e.target.value;
                Transmitter.resetAllDisplays();
            });
        });

        // Speed slider
        this.elements.speedSlider?.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            Transmitter.speed = speed;
            this.elements.speedValue.textContent = speed;
        });

        // Audio indicator click
        this.elements.audioIndicator?.addEventListener('click', () => {
            AudioController.resume();
            this.elements.audioIndicator.classList.add('hidden');
        });

        // Initialize audio on first interaction
        document.addEventListener('click', () => AudioController.resume(), { once: true });
        document.addEventListener('keydown', () => AudioController.resume(), { once: true });

        // Listen for incoming messages from receiver page (bidirectional communication)
        window.addEventListener('storage', (e) => {
            if (e.key === 'upsidedown_transmission') {
                try {
                    const data = JSON.parse(e.newValue);
                    // Only receive if sent from the receiver page (not our own transmissions)
                    if (data.sender === 'receiver') {
                        this.handleIncomingMessage(data);
                    }
                } catch (err) {
                    console.error('Error parsing incoming transmission:', err);
                }
            }
        });
    },

    // Handle incoming messages from the Upside Down (receiver page)
    handleIncomingMessage: function (transmission) {
        const message = transmission.message;

        // Show warning that we're receiving
        this.showWarning('⚡ INCOMING FROM UPSIDE DOWN ⚡');

        // Trigger power flicker
        this.triggerPowerFlicker();

        // Play static sound
        AudioController.playStatic(500);

        // Update receive signal indicator
        const signalIcon = document.getElementById('receive-signal');
        const receiveStatus = document.getElementById('receive-status');
        if (signalIcon) {
            signalIcon.classList.add('active');
            setTimeout(() => signalIcon.classList.remove('active'), 2000);
        }
        if (receiveStatus) {
            receiveStatus.textContent = '⚡ RECEIVING TRANSMISSION ⚡';
            receiveStatus.classList.add('active');
            setTimeout(() => {
                receiveStatus.textContent = 'LISTENING FOR SIGNALS...';
                receiveStatus.classList.remove('active');
            }, 3000);
        }

        // Update received message display
        const messageDisplay = document.getElementById('received-message-display');
        if (messageDisplay) {
            messageDisplay.innerHTML = `<span class="received-message">${message}</span>`;
        }

        // Add to received history
        this.addToReceivedHistory(message);

        // Log the received message
        this.logTransmission('← ' + message);

        // Display on the Christmas lights (visual feedback)
        this.displayIncomingMessage(message);
    },

    // Add message to received history
    addToReceivedHistory: function (message) {
        const historyEntries = document.getElementById('received-entries');
        if (!historyEntries) return;

        // Remove "no messages" text if present
        const noMessages = historyEntries.querySelector('.no-messages');
        if (noMessages) noMessages.remove();

        // Create new entry
        const entry = document.createElement('div');
        entry.className = 'received-entry';
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `
            <span class="msg-text">← ${message}</span>
            <span class="msg-time">${time}</span>
        `;

        // Add to top
        historyEntries.insertBefore(entry, historyEntries.firstChild);

        // Keep only last 10 entries
        while (historyEntries.children.length > 10) {
            historyEntries.removeChild(historyEntries.lastChild);
        }
    },

    // Display incoming message via Christmas lights animation
    displayIncomingMessage: async function (message) {
        const lights = document.querySelectorAll('.light-bulb');

        for (let i = 0; i < message.length; i++) {
            const char = message[i].toUpperCase();

            // Clear all lights
            lights.forEach(l => l.classList.remove('active'));

            // Light up the correct letter
            const targetLight = document.querySelector(`.light-bulb[data-letter="${char}"]`);
            if (targetLight) {
                targetLight.classList.add('active');
                AudioController.playTone(400 + (i * 25), 150);
            }

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Clear all lights at end
        lights.forEach(l => l.classList.remove('active'));

        // Show completion message
        this.showWarning('MESSAGE RECEIVED: ' + message.substring(0, 15) + (message.length > 15 ? '...' : ''));
    },

    // Handle transmit action
    handleTransmit: function () {
        const message = this.elements.messageInput?.value.trim();

        if (!message) {
            this.showWarning('NO MESSAGE TO TRANSMIT');
            AudioController.playErrorBeep();
            return;
        }

        if (Transmitter.isTransmitting) {
            Transmitter.abort();
            return;
        }

        // Decrease sanity on each transmission (dimensional strain)
        SanityController.decrease(5);

        // Increase PSI strain (Eleven's effort)
        this.increasePsiStrain(15);

        // Temperature drop during transmission
        this.dropTemperature(5);

        // Log the transmission
        this.logTransmission(message);

        // Random chance of power flicker
        if (Math.random() > 0.7) {
            this.triggerPowerFlicker();
        }

        // Check if possessed - corrupt the message
        let transmitMessage = message;
        if (SanityController.isPossessed) {
            transmitMessage = Encoder.corruptMessage(message);
        }

        // Transmit
        Transmitter.transmit(transmitMessage, this.currentMode);

        // Update button
        this.elements.transmitBtn.querySelector('.btn-text').textContent = 'ABORT';

        // Reset button after transmission completes
        const checkComplete = setInterval(() => {
            if (!Transmitter.isTransmitting) {
                this.elements.transmitBtn.querySelector('.btn-text').textContent = 'TRANSMIT';
                clearInterval(checkComplete);
            }
        }, 100);
    },

    // Show warning message
    showWarning: function (text) {
        if (this.elements.warningText) {
            const original = this.elements.warningText.textContent;
            this.elements.warningText.textContent = text;
            setTimeout(() => {
                this.elements.warningText.textContent = original;
            }, 2000);
        }
    },

    // Update date/time display (1983 format)
    updateDateTime: function () {
        const now = new Date();
        const date = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const time = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        if (this.elements.datetime) {
            this.elements.datetime.textContent = `${date} ${time}`;
        }

        // Update Vecna's clock hands
        this.updateVecnaClock(now);
    },

    // ═══════════════════════════════════════════════════════════════
    // NEW CREATIVE FEATURES
    // ═══════════════════════════════════════════════════════════════

    // Start environmental monitoring systems
    startEnvironmentalSystems: function () {
        // Temperature recovery over time
        setInterval(() => {
            if (this.temperature < 68) {
                this.temperature = Math.min(68, this.temperature + 1);
                this.updateTemperatureDisplay();
            }
        }, 3000);

        // PSI strain recovery over time
        setInterval(() => {
            if (this.psiStrain > 0) {
                this.psiStrain = Math.max(0, this.psiStrain - 5);
                this.updatePsiStrainDisplay();
            }
        }, 2000);

        // Random radio dial scanning
        setInterval(() => {
            this.scanRadioDial();
        }, 150);

        // Random Vecna clock activation (rare)
        setInterval(() => {
            if (Math.random() > 0.98 && SanityController.sanity < 50) {
                this.triggerVecnaClock();
            }
        }, 10000);
    },

    // Temperature drop effect
    dropTemperature: function (amount) {
        this.temperature = Math.max(32, this.temperature - amount);
        this.updateTemperatureDisplay();
    },

    // Update temperature display
    updateTemperatureDisplay: function () {
        if (this.elements.tempValue) {
            this.elements.tempValue.textContent = Math.round(this.temperature) + '°F';
            // Color based on temperature
            if (this.temperature < 40) {
                this.elements.tempValue.style.color = '#00ccff';
            } else if (this.temperature < 55) {
                this.elements.tempValue.style.color = '#66ff66';
            } else {
                this.elements.tempValue.style.color = '#00ff00';
            }
        }
        if (this.elements.tempFill) {
            const percent = ((this.temperature - 32) / 68) * 100;
            this.elements.tempFill.style.width = percent + '%';
        }
    },

    // Increase PSI strain (Eleven's power meter)
    increasePsiStrain: function (amount) {
        this.psiStrain = Math.min(100, this.psiStrain + amount);
        this.updatePsiStrainDisplay();
    },

    // Update PSI strain display
    updatePsiStrainDisplay: function () {
        if (this.elements.strainValue) {
            this.elements.strainValue.textContent = Math.round(this.psiStrain) + '%';
        }
        if (this.elements.strainFill) {
            this.elements.strainFill.style.width = this.psiStrain + '%';
        }
        // Show nosebleed warning at high strain
        if (this.elements.nosebleedWarning) {
            if (this.psiStrain > 70) {
                this.elements.nosebleedWarning.classList.add('visible');
            } else {
                this.elements.nosebleedWarning.classList.remove('visible');
            }
        }
    },

    // Radio dial scanning effect
    scanRadioDial: function () {
        if (this.elements.dialNeedle) {
            // Random movement with occasional spikes
            const basePosition = 30 + (Math.sin(Date.now() / 500) * 20);
            const jitter = (Math.random() - 0.5) * 10;
            const spike = Math.random() > 0.95 ? (Math.random() * 30 - 15) : 0;

            const position = Math.max(5, Math.min(95, basePosition + jitter + spike));
            this.elements.dialNeedle.style.left = position + '%';

            // Update static text on spikes
            if (this.elements.radioStatic && Math.abs(spike) > 10) {
                const statics = ['▓▒░ SIGNAL ░▒▓', '░▒▓ VOID ▓▒░', '▓▓▓ ??? ▓▓▓', '░░░ HELP ░░░'];
                this.elements.radioStatic.textContent = statics[Math.floor(Math.random() * statics.length)];
            }
        }
    },

    // Update Vecna's clock
    updateVecnaClock: function (date) {
        const hours = date.getHours() % 12;
        const minutes = date.getMinutes();

        const hourAngle = (hours * 30) + (minutes * 0.5);
        const minuteAngle = minutes * 6;

        const hourHand = document.querySelector('.hour-hand');
        const minuteHand = document.querySelector('.minute-hand');

        if (hourHand) hourHand.style.transform = `rotate(${hourAngle}deg)`;
        if (minuteHand) minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    },

    // Trigger Vecna's clock effect
    triggerVecnaClock: function () {
        if (this.elements.vecnaClock) {
            this.elements.vecnaClock.classList.add('active');
            if (this.elements.clockChime) {
                this.elements.clockChime.classList.add('active');
            }

            // Play ominous sound
            AudioController.playStatic(500);

            // Decrease sanity
            SanityController.decrease(10);

            setTimeout(() => {
                this.elements.vecnaClock.classList.remove('active');
                if (this.elements.clockChime) {
                    this.elements.clockChime.classList.remove('active');
                }
            }, 3000);
        }
    },

    // Log transmission
    logTransmission: function (message) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        this.transmissionLog.unshift({ time: timestamp, msg: message.substring(0, 20) });

        // Keep only last 5
        if (this.transmissionLog.length > 5) {
            this.transmissionLog = this.transmissionLog.slice(0, 5);
        }

        this.updateTransmissionLog();
    },

    // Update transmission log display
    updateTransmissionLog: function () {
        if (this.elements.logEntries) {
            if (this.transmissionLog.length === 0) {
                this.elements.logEntries.innerHTML = '<div class="log-entry">-- NO TRANSMISSIONS LOGGED --</div>';
            } else {
                this.elements.logEntries.innerHTML = this.transmissionLog.map((entry, i) =>
                    `<div class="log-entry">[${entry.time}] ${entry.msg}${entry.msg.length >= 20 ? '...' : ''}</div>`
                ).join('');
            }
        }
    },

    // Trigger power flicker
    triggerPowerFlicker: function () {
        if (this.elements.powerFlicker) {
            this.elements.powerFlicker.classList.add('flicker');
            AudioController.playStatic(200);

            setTimeout(() => {
                this.elements.powerFlicker.classList.remove('flicker');
            }, 500);
        }
    },

    // Random CRT glitches for authenticity
    startRandomGlitches: function () {
        setInterval(() => {
            if (Math.random() > 0.95 && !SanityController.isPossessed) {
                this.triggerGlitch();
            }
        }, 2000);
    },

    // Trigger a random glitch effect
    triggerGlitch: function () {
        const glitches = ['jitter', 'hsync-issue', 'tracking-issue'];
        const glitch = glitches[Math.floor(Math.random() * glitches.length)];

        this.elements.terminal?.classList.add(glitch);
        AudioController.playStatic(100);

        setTimeout(() => {
            this.elements.terminal?.classList.remove(glitch);
        }, 200);
    },

    // Trigger signal fluctuation
    fluctuateSignal: function () {
        const signalFill = document.getElementById('signal-fill');
        const signalValue = document.getElementById('signal-value');

        if (signalFill && signalValue) {
            const value = 60 + Math.floor(Math.random() * 40);
            signalFill.style.width = value + '%';
            signalValue.textContent = value + '%';
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();

    // Fluctuate signal strength periodically
    setInterval(() => App.fluctuateSignal(), 3000);
});

// Export for debugging
window.App = App;
