/* ═══════════════════════════════════════════════════════════════
   UPSIDE DOWN RECEIVER - Signal Detection & Display
   Receives transmissions from the sender terminal
   ═══════════════════════════════════════════════════════════════ */

const Receiver = {
    isConnected: false,
    currentMessage: '',
    messageHistory: [],
    checkInterval: null,
    lastMessageId: null,
    pageId: 'receiver', // Identify this page

    // DOM Elements
    elements: {},

    init: function () {
        this.cacheElements();
        this.setupEventListeners();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        this.startIdleAnimations();

        // Auto-connect on load
        setTimeout(() => this.connect(), 1000);
    },

    cacheElements: function () {
        this.elements = {
            connectBtn: document.getElementById('connect-btn'),
            connectionStatus: document.getElementById('connection-status'),
            receiverStatus: document.getElementById('receiver-status'),
            signalStatus: document.getElementById('signal-status'),
            signalBars: document.querySelectorAll('.signal-bar'),
            decodedMessage: document.getElementById('decoded-message'),
            messageHistory: document.getElementById('message-history'),
            receiverLights: document.getElementById('receiver-lights'),
            morseLamp: document.getElementById('receiver-morse-lamp'),
            morseOutput: document.getElementById('receiver-morse-output'),
            binaryGrid: document.getElementById('receiver-binary-grid'),
            binaryValue: document.getElementById('receiver-binary-value'),
            binaryChar: document.getElementById('receiver-binary-char'),
            oscilloscope: document.getElementById('receiver-oscilloscope'),
            demogorgonAlert: document.getElementById('demogorgon-alert'),
            datetime: document.getElementById('datetime'),
            tempDisplay: document.getElementById('temp-display'),
            // Send elements
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            modeSelect: document.querySelector('input[name="mode"]:checked')
        };

        // Initialize oscilloscope
        if (this.elements.oscilloscope) {
            this.oscCtx = this.elements.oscilloscope.getContext('2d');
        }
    },

    setupEventListeners: function () {
        this.elements.connectBtn?.addEventListener('click', () => {
            if (this.isConnected) {
                this.disconnect();
            } else {
                this.connect();
            }
        });

        // Send button
        this.elements.sendBtn?.addEventListener('click', () => this.sendMessage());

        // Enter key to send
        this.elements.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Listen for storage events (real-time updates from sender)
        window.addEventListener('storage', (e) => {
            if (e.key === 'upsidedown_transmission' && this.isConnected) {
                const data = JSON.parse(e.newValue);
                // Only receive if sent from the other page
                if (data.sender !== this.pageId) {
                    this.receiveTransmission(e.newValue);
                }
            }
        });
    },

    // Send a message to the sender page
    sendMessage: function () {
        if (!this.isConnected) {
            alert('Open portal first to transmit!');
            return;
        }

        const message = this.elements.messageInput?.value.trim();
        if (!message) return;

        const modeInput = document.querySelector('input[name="mode"]:checked');
        const mode = modeInput?.value || 'christmas';

        // Broadcast via localStorage
        const transmission = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            message: message,
            mode: mode,
            sender: this.pageId,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('upsidedown_transmission', JSON.stringify(transmission));

        // Show in our own display
        this.displaySentMessage(message);

        // Clear input
        this.elements.messageInput.value = '';
    },

    displaySentMessage: function (message) {
        if (this.elements.receiverStatus) {
            this.elements.receiverStatus.textContent = 'TRANSMITTING...';
        }

        // Add to history as sent
        this.addToHistory('→ ' + message, 'sent');

        setTimeout(() => {
            if (this.elements.receiverStatus) {
                this.elements.receiverStatus.textContent = 'PORTAL OPEN';
            }
        }, 1500);
    },

    connect: function () {
        this.isConnected = true;

        // Update UI
        this.elements.connectBtn.querySelector('.btn-text').textContent = 'CLOSE PORTAL';
        this.elements.connectBtn.classList.add('connected');

        const statusDot = this.elements.connectionStatus?.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus?.querySelector('.status-text');
        if (statusDot) statusDot.classList.add('connected');
        if (statusText) statusText.textContent = 'CONNECTED';

        if (this.elements.receiverStatus) {
            this.elements.receiverStatus.textContent = 'PORTAL OPEN';
        }

        // Start checking for messages
        this.startMessageCheck();

        // Update signal bars
        this.updateSignalStrength(3);
    },

    disconnect: function () {
        this.isConnected = false;

        // Update UI
        this.elements.connectBtn.querySelector('.btn-text').textContent = 'OPEN PORTAL';
        this.elements.connectBtn.classList.remove('connected');

        const statusDot = this.elements.connectionStatus?.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus?.querySelector('.status-text');
        if (statusDot) statusDot.classList.remove('connected');
        if (statusText) statusText.textContent = 'DISCONNECTED';

        if (this.elements.receiverStatus) {
            this.elements.receiverStatus.textContent = 'PORTAL CLOSED';
        }

        // Stop checking
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Reset signal
        this.updateSignalStrength(0);
    },

    startMessageCheck: function () {
        // Check localStorage periodically for new messages
        this.checkInterval = setInterval(() => {
            const transmission = localStorage.getItem('upsidedown_transmission');
            if (transmission) {
                try {
                    const data = JSON.parse(transmission);
                    if (data.id !== this.lastMessageId) {
                        this.lastMessageId = data.id;
                        this.receiveTransmission(transmission);
                    }
                } catch (e) {
                    // Invalid data
                }
            }

            // Random signal fluctuation
            if (this.isConnected) {
                const strength = 2 + Math.floor(Math.random() * 3);
                this.updateSignalStrength(strength);
            }
        }, 500);
    },

    receiveTransmission: function (data) {
        try {
            const transmission = typeof data === 'string' ? JSON.parse(data) : data;
            const message = transmission.message;
            const mode = transmission.mode || 'christmas';

            // Update status
            if (this.elements.receiverStatus) {
                this.elements.receiverStatus.textContent = 'RECEIVING...';
            }
            if (this.elements.signalStatus) {
                this.elements.signalStatus.textContent = 'SIGNAL DETECTED';
            }

            // Max signal during reception
            this.updateSignalStrength(5);

            // Play receiving animation based on mode
            this.playReceiveAnimation(message, mode);

            // Random Demogorgon alert (rare)
            if (Math.random() > 0.9) {
                setTimeout(() => this.triggerDemogorgonAlert(), 2000);
            }

        } catch (e) {
            console.error('Error receiving transmission:', e);
        }
    },

    playReceiveAnimation: async function (message, mode) {
        // Add receiving class
        document.body.classList.add('receiving-active');

        // Animate based on mode
        for (let i = 0; i < message.length; i++) {
            const char = message[i].toUpperCase();

            // Update decoded message progressively
            this.updateDecodedMessage(message.substring(0, i + 1));

            // Christmas lights
            if (mode === 'christmas' || mode === 'all') {
                this.lightUpLetter(char);
            }

            // Morse lamp
            if (mode === 'morse' || mode === 'all') {
                await this.flashMorseLamp(char);
            }

            // Binary
            if (mode === 'binary' || mode === 'all') {
                this.displayBinaryChar(char);
            }

            // Glyphs
            if (mode === 'glyphs' || mode === 'all') {
                this.displayGlyph(char);
            }

            // Pulse
            if (mode === 'pulse' || mode === 'all') {
                this.triggerColorPulse(char);
            }

            // Oscilloscope pulse
            this.pulseOscilloscope();

            // Wait between characters
            await this.sleep(300);
        }

        // Complete
        document.body.classList.remove('receiving-active');

        if (this.elements.receiverStatus) {
            this.elements.receiverStatus.textContent = 'TRANSMISSION COMPLETE';
        }
        if (this.elements.signalStatus) {
            this.elements.signalStatus.textContent = 'AWAITING SIGNAL';
        }

        // Add to history
        this.addToHistory(message);

        // Reset after delay
        setTimeout(() => {
            if (this.elements.receiverStatus) {
                this.elements.receiverStatus.textContent = 'PORTAL OPEN';
            }
            this.updateSignalStrength(3);
        }, 3000);
    },

    updateDecodedMessage: function (text) {
        if (this.elements.decodedMessage) {
            this.elements.decodedMessage.innerHTML = `<span class="received-text">${text}</span>`;
        }
    },

    lightUpLetter: function (letter) {
        // Reset all
        const allBulbs = this.elements.receiverLights?.querySelectorAll('.light-bulb');
        allBulbs?.forEach(b => b.classList.remove('active'));

        // Light up the letter
        const bulb = this.elements.receiverLights?.querySelector(`[data-letter="${letter}"]`);
        if (bulb) {
            bulb.classList.add('active');
        }
    },

    flashMorseLamp: async function (char) {
        // Simple morse flash (simplified)
        const morse = this.getMorseCode(char);

        if (this.elements.morseOutput) {
            this.elements.morseOutput.textContent = morse;
        }

        for (const symbol of morse) {
            if (symbol === '.') {
                this.elements.morseLamp?.classList.add('on');
                await this.sleep(100);
                this.elements.morseLamp?.classList.remove('on');
                await this.sleep(50);
            } else if (symbol === '-') {
                this.elements.morseLamp?.classList.add('on');
                await this.sleep(250);
                this.elements.morseLamp?.classList.remove('on');
                await this.sleep(50);
            }
        }
    },

    getMorseCode: function (char) {
        const codes = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
            'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
            'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
            'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
            'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
            'Z': '--..'
        };
        return codes[char] || '';
    },

    displayBinaryChar: function (char) {
        const code = char.charCodeAt(0);
        const binary = code.toString(2).padStart(8, '0');

        if (this.elements.binaryValue) {
            this.elements.binaryValue.textContent = binary;
        }
        if (this.elements.binaryChar) {
            this.elements.binaryChar.textContent = char;
        }

        // Light up binary lights
        const lights = this.elements.binaryGrid?.querySelectorAll('.binary-light');
        lights?.forEach((light, i) => {
            const bit = 7 - i;
            if (binary[i] === '1') {
                light.classList.add('on');
            } else {
                light.classList.remove('on');
            }
        });
    },

    displayGlyph: function (char) {
        const glyph = Encoder.glyphMap[char] || char;
        const display = document.getElementById('receiver-glyph-display');
        if (display) {
            display.textContent = glyph;
            display.classList.add('active');
            setTimeout(() => display.classList.remove('active'), 200);
        }
    },

    triggerColorPulse: function (char) {
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ffffff', '#ff8800'
        ];
        const code = char.charCodeAt(0);
        const color = colors[code % colors.length];
        const overlay = document.getElementById('portal-pulse-overlay');

        if (overlay) {
            overlay.style.backgroundColor = color;
            overlay.classList.add('active');
            setTimeout(() => overlay.classList.remove('active'), 300);
        }
    },

    pulseOscilloscope: function () {
        if (!this.oscCtx) return;

        const canvas = this.elements.oscilloscope;
        const ctx = this.oscCtx;
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.fillStyle = '#000a00';
        ctx.fillRect(0, 0, width, height);

        // Draw spike
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x < width; x++) {
            const spike = x > width * 0.3 && x < width * 0.7
                ? Math.sin((x - width * 0.3) * 0.1) * 30 * Math.random()
                : 0;
            ctx.lineTo(x, height / 2 + spike);
        }

        ctx.stroke();
    },

    updateSignalStrength: function (level) {
        this.elements.signalBars?.forEach(bar => {
            const barLevel = parseInt(bar.dataset.level);
            if (barLevel <= level) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    },

    addToHistory: function (message) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        this.messageHistory.unshift({ time: timestamp, message: message });

        // Keep only last 10
        if (this.messageHistory.length > 10) {
            this.messageHistory = this.messageHistory.slice(0, 10);
        }

        this.renderHistory();
    },

    renderHistory: function () {
        if (!this.elements.messageHistory) return;

        if (this.messageHistory.length === 0) {
            this.elements.messageHistory.innerHTML = '<div class="history-entry placeholder">NO MESSAGES RECEIVED YET</div>';
            return;
        }

        this.elements.messageHistory.innerHTML = this.messageHistory.map((entry, i) => `
            <div class="history-entry ${i === 0 ? 'new-message-flash' : ''}">
                <span class="history-time">[${entry.time}]</span>
                <span class="history-message">${entry.message}</span>
            </div>
        `).join('');
    },

    triggerDemogorgonAlert: function () {
        if (this.elements.demogorgonAlert) {
            this.elements.demogorgonAlert.classList.add('active');

            // Auto-dismiss after 3 seconds
            setTimeout(() => {
                this.elements.demogorgonAlert.classList.remove('active');
            }, 3000);
        }
    },

    updateDateTime: function () {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        if (this.elements.datetime) {
            this.elements.datetime.textContent = time;
        }

        // Random temperature fluctuation (always cold in the Upside Down)
        if (this.elements.tempDisplay) {
            const temp = -40 + Math.floor(Math.random() * 10);
            this.elements.tempDisplay.textContent = temp + '°F';
        }
    },

    startIdleAnimations: function () {
        // Idle oscilloscope
        setInterval(() => {
            if (!document.body.classList.contains('receiving-active')) {
                this.drawIdleOscilloscope();
            }
        }, 100);
    },

    drawIdleOscilloscope: function () {
        if (!this.oscCtx) return;

        const canvas = this.elements.oscilloscope;
        const ctx = this.oscCtx;
        const width = canvas.width;
        const height = canvas.height;

        // Clear with slight trail
        ctx.fillStyle = 'rgba(0, 10, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Draw noise line
        ctx.strokeStyle = '#003300';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x < width; x++) {
            const noise = (Math.random() - 0.5) * 10;
            ctx.lineTo(x, height / 2 + noise);
        }

        ctx.stroke();
    },

    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Receiver.init();
});

// Export for debugging
window.Receiver = Receiver;
