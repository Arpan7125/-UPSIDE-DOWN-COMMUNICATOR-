
const App = {
    currentMode: 'morse',
    isBooted: false,
    temperature: 68, 
    psiStrain: 0, 
    transmissionLog: [],

    elements: {},

    init: function () {
        this.cacheElements();
        this.setupBootSequence();
        this.setupEventListeners();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    },

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

    setupBootSequence: function () {
        const bootLines = document.querySelectorAll('.boot-line');

        bootLines.forEach(line => {
            const delay = parseInt(line.dataset.delay) || 0;
            setTimeout(() => {
                line.style.animationDelay = '0s';
                line.style.animationPlayState = 'running';
            }, delay);
        });

        const bootHandler = (e) => {
            if (!this.isBooted) {
                this.completeBoot();
                document.removeEventListener('keydown', bootHandler);
                document.removeEventListener('click', bootHandler);
            }
        };

        setTimeout(() => {
            document.addEventListener('keydown', bootHandler);
            document.addEventListener('click', bootHandler);
        }, 3000);

        setTimeout(() => {
            if (!this.isBooted) {
                this.completeBoot();
            }
        }, 6000);
    },

    completeBoot: function () {
        if (this.isBooted) return;
        this.isBooted = true;

        AudioController.init();
        AudioController.playBootSound();

        this.elements.bootScreen.classList.add('hidden');
        this.elements.terminal.classList.remove('hidden');
        this.elements.terminal.classList.add('power-on');

        setTimeout(() => {
            OscilloscopeRenderer.init();
            SanityController.init();
            RecoveryController.init();

            this.elements.messageInput?.focus();

            this.elements.terminal.classList.remove('power-on');

            this.startEnvironmentalSystems();
        }, 500);

        this.startRandomGlitches();
    },

    setupEventListeners: function () {
        this.elements.transmitBtn?.addEventListener('click', () => {
            this.handleTransmit();
        });

        this.elements.messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleTransmit();
            }
        });

        this.elements.modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentMode = e.target.value;
                Transmitter.resetAllDisplays();
            });
        });

        this.elements.speedSlider?.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            Transmitter.speed = speed;
            this.elements.speedValue.textContent = speed;
        });

        this.elements.audioIndicator?.addEventListener('click', () => {
            AudioController.resume();
            this.elements.audioIndicator.classList.add('hidden');
        });

        document.addEventListener('click', () => AudioController.resume(), { once: true });
        document.addEventListener('keydown', () => AudioController.resume(), { once: true });

        window.addEventListener('storage', (e) => {
            if (e.key === 'upsidedown_transmission') {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data.sender === 'receiver') {
                        this.handleIncomingMessage(data);
                    }
                } catch (err) {
                    console.error('Error parsing incoming transmission:', err);
                }
            }
        });
    },

    handleIncomingMessage: function (transmission) {
        const message = transmission.message;

        this.showWarning('⚡ INCOMING FROM UPSIDE DOWN ⚡');

        this.triggerPowerFlicker();

        AudioController.playStatic(500);

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

        const messageDisplay = document.getElementById('received-message-display');
        if (messageDisplay) {
            messageDisplay.innerHTML = `<span class="received-message">${message}</span>`;
        }

        this.addToReceivedHistory(message);

        this.logTransmission('← ' + message);

        this.displayIncomingMessage(message);
    },

    addToReceivedHistory: function (message) {
        const historyEntries = document.getElementById('received-entries');
        if (!historyEntries) return;

        const noMessages = historyEntries.querySelector('.no-messages');
        if (noMessages) noMessages.remove();

        const entry = document.createElement('div');
        entry.className = 'received-entry';
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `
            <span class="msg-text">← ${message}</span>
            <span class="msg-time">${time}</span>
        `;

        historyEntries.insertBefore(entry, historyEntries.firstChild);

        while (historyEntries.children.length > 10) {
            historyEntries.removeChild(historyEntries.lastChild);
        }
    },

    displayIncomingMessage: async function (message) {
        const lights = document.querySelectorAll('.light-bulb');

        for (let i = 0; i < message.length; i++) {
            const char = message[i].toUpperCase();

            lights.forEach(l => l.classList.remove('active'));

            const targetLight = document.querySelector(`.light-bulb[data-letter="${char}"]`);
            if (targetLight) {
                targetLight.classList.add('active');
                AudioController.playTone(400 + (i * 25), 150);
            }

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        lights.forEach(l => l.classList.remove('active'));

        this.showWarning('MESSAGE RECEIVED: ' + message.substring(0, 15) + (message.length > 15 ? '...' : ''));
    },

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

        SanityController.decrease(5);

        this.increasePsiStrain(15);

        this.dropTemperature(5);

        this.logTransmission(message);

        if (Math.random() > 0.7) {
            this.triggerPowerFlicker();
        }

        let transmitMessage = message;
        if (SanityController.isPossessed) {
            transmitMessage = Encoder.corruptMessage(message);
        }

        
        Transmitter.transmit(transmitMessage, this.currentMode);

        this.elements.transmitBtn.querySelector('.btn-text').textContent = 'ABORT';

        const checkComplete = setInterval(() => {
            if (!Transmitter.isTransmitting) {
                this.elements.transmitBtn.querySelector('.btn-text').textContent = 'TRANSMIT';
                clearInterval(checkComplete);
            }
        }, 100);
    },

    showWarning: function (text) {
        if (this.elements.warningText) {
            const original = this.elements.warningText.textContent;
            this.elements.warningText.textContent = text;
            setTimeout(() => {
                this.elements.warningText.textContent = original;
            }, 2000);
        }
    },

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

        this.updateVecnaClock(now);
    },

    startEnvironmentalSystems: function () {
        setInterval(() => {
            if (this.temperature < 68) {
                this.temperature = Math.min(68, this.temperature + 1);
                this.updateTemperatureDisplay();
            }
        }, 3000);

        setInterval(() => {
            if (this.psiStrain > 0) {
                this.psiStrain = Math.max(0, this.psiStrain - 5);
                this.updatePsiStrainDisplay();
            }
        }, 2000);

        setInterval(() => {
            this.scanRadioDial();
        }, 150);

        setInterval(() => {
            if (Math.random() > 0.98 && SanityController.sanity < 50) {
                this.triggerVecnaClock();
            }
        }, 10000);
    },

    dropTemperature: function (amount) {
        this.temperature = Math.max(32, this.temperature - amount);
        this.updateTemperatureDisplay();
    },

    updateTemperatureDisplay: function () {
        if (this.elements.tempValue) {
            this.elements.tempValue.textContent = Math.round(this.temperature) + '°F';
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

    increasePsiStrain: function (amount) {
        this.psiStrain = Math.min(100, this.psiStrain + amount);
        this.updatePsiStrainDisplay();
    },

    updatePsiStrainDisplay: function () {
        if (this.elements.strainValue) {
            this.elements.strainValue.textContent = Math.round(this.psiStrain) + '%';
        }
        if (this.elements.strainFill) {
            this.elements.strainFill.style.width = this.psiStrain + '%';
        }
        if (this.elements.nosebleedWarning) {
            if (this.psiStrain > 70) {
                this.elements.nosebleedWarning.classList.add('visible');
            } else {
                this.elements.nosebleedWarning.classList.remove('visible');
            }
        }
    },

    scanRadioDial: function () {
        if (this.elements.dialNeedle) {
            const basePosition = 30 + (Math.sin(Date.now() / 500) * 20);
            const jitter = (Math.random() - 0.5) * 10;
            const spike = Math.random() > 0.95 ? (Math.random() * 30 - 15) : 0;

            const position = Math.max(5, Math.min(95, basePosition + jitter + spike));
            this.elements.dialNeedle.style.left = position + '%';

            if (this.elements.radioStatic && Math.abs(spike) > 10) {
                const statics = ['▓▒░ SIGNAL ░▒▓', '░▒▓ VOID ▓▒░', '▓▓▓ ??? ▓▓▓', '░░░ HELP ░░░'];
                this.elements.radioStatic.textContent = statics[Math.floor(Math.random() * statics.length)];
            }
        }
    },

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

    triggerVecnaClock: function () {
        if (this.elements.vecnaClock) {
            this.elements.vecnaClock.classList.add('active');
            if (this.elements.clockChime) {
                this.elements.clockChime.classList.add('active');
            }

            AudioController.playStatic(500);

            SanityController.decrease(10);

            setTimeout(() => {
                this.elements.vecnaClock.classList.remove('active');
                if (this.elements.clockChime) {
                    this.elements.clockChime.classList.remove('active');
                }
            }, 3000);
        }
    },

    logTransmission: function (message) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        this.transmissionLog.unshift({ time: timestamp, msg: message.substring(0, 20) });

        if (this.transmissionLog.length > 5) {
            this.transmissionLog = this.transmissionLog.slice(0, 5);
        }

        this.updateTransmissionLog();
    },

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

    triggerPowerFlicker: function () {
        if (this.elements.powerFlicker) {
            this.elements.powerFlicker.classList.add('flicker');
            AudioController.playStatic(200);

            setTimeout(() => {
                this.elements.powerFlicker.classList.remove('flicker');
            }, 500);
        }
    },

    startRandomGlitches: function () {
        setInterval(() => {
            if (Math.random() > 0.95 && !SanityController.isPossessed) {
                this.triggerGlitch();
            }
        }, 2000);
    },

    triggerGlitch: function () {
        const glitches = ['jitter', 'hsync-issue', 'tracking-issue'];
        const glitch = glitches[Math.floor(Math.random() * glitches.length)];

        this.elements.terminal?.classList.add(glitch);
        AudioController.playStatic(100);

        setTimeout(() => {
            this.elements.terminal?.classList.remove(glitch);
        }, 200);
    },

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

document.addEventListener('DOMContentLoaded', () => {
    App.init();

    setInterval(() => App.fluctuateSignal(), 3000);
});

window.App = App;
