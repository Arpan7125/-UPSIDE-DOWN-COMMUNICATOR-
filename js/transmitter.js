

const Transmitter = {
    isTransmitting: false,
    currentMode: 'morse',
    speed: 3, // 1-5 scale
    abortController: null,

    getSpeedMultiplier: function () {
        return Math.max(50, (6 - this.speed) * 100); // Ensure minimum delay
    },

    // Broadcast message to other pages via localStorage
    broadcastMessage: function (message, mode) {
        const transmission = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            message: message,
            mode: mode,
            speed: this.speed,
            sender: 'sender', // Identify which page sent it
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('upsidedown_transmission', JSON.stringify(transmission));
    },

    // Start transmission
    async transmit(message, mode) {
        if (this.isTransmitting) {
            this.abort();
            await this.sleep(300);
        }

        this.isTransmitting = true;
        this.abortController = { aborted: false };
        this.highlightActiveMode(mode);
        document.body.classList.add('transmitting');

        // Broadcast to receiver page
        this.broadcastMessage(message, mode);

        try {
            switch (mode) {
                case 'morse':
                    await this.transmitMorse(message);
                    break;
                case 'christmas':
                    await this.transmitChristmas(message);
                    break;
                case 'binary':
                    await this.transmitBinary(message);
                    break;
                case 'audio':
                    await this.transmitAudio(message);
                    break;
                case 'glyphs':
                    await this.transmitGlyphs(message);
                    break;
                case 'pulse':
                    await this.transmitPulse(message);
                    break;
            }
        } catch (e) {
            console.log('Transmission interrupted');
        }

        this.isTransmitting = false;
        document.body.classList.remove('transmitting');
    },

    // Abort current transmission
    abort: function () {
        if (this.abortController) {
            this.abortController.aborted = true;
        }
        this.resetAllDisplays();
    },

    // Sleep utility with abort check
    async sleep(ms) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, ms);
            if (this.abortController?.aborted) {
                clearTimeout(timeout);
                reject('Aborted');
            }
        });
    },

    // Check if aborted
    checkAbort: function () {
        if (this.abortController?.aborted) {
            throw new Error('Aborted');
        }
    },

    // ═══ MORSE CODE TRANSMISSION ═══
    async transmitMorse(message) {
        const morse = Encoder.toMorse(message);
        const morseOutput = document.getElementById('morse-output');
        const morseLamp = document.getElementById('morse-lamp');
        const unit = this.getSpeedMultiplier();

        morseOutput.textContent = morse;

        for (const char of morse) {
            this.checkAbort();

            if (char === '.') {
                morseLamp.classList.add('on');
                AudioController.playTone(800, unit);
                await this.sleep(unit);
                morseLamp.classList.remove('on');
                await this.sleep(unit);
            } else if (char === '-') {
                morseLamp.classList.add('on');
                AudioController.playTone(800, unit * 3);
                await this.sleep(unit * 3);
                morseLamp.classList.remove('on');
                await this.sleep(unit);
            } else if (char === ' ') {
                await this.sleep(unit * 2);
            } else if (char === '/') {
                await this.sleep(unit * 4);
            }
        }
    },

    // ═══ CHRISTMAS LIGHTS TRANSMISSION ═══
    async transmitChristmas(message) {
        const sequence = Encoder.toAlphabetSequence(message);
        const lights = document.querySelectorAll('.light-bulb');
        const duration = this.getSpeedMultiplier() * 3;

        for (const item of sequence) {
            this.checkAbort();

            // Clear all lights
            lights.forEach(l => l.classList.remove('active'));

            // Light up the correct letter
            const targetLight = document.querySelector(`.light-bulb[data-letter="${item.char}"]`);
            if (targetLight) {
                targetLight.classList.add('active');
                AudioController.playTone(300 + (item.index * 30), 150);
            }

            await this.sleep(duration);
        }

        // Clear all lights at end
        lights.forEach(l => l.classList.remove('active'));
    },

    // ═══ BINARY TRANSMISSION ═══
    async transmitBinary(message) {
        const binaryArray = Encoder.toBinaryArray(message);
        const binaryLights = document.querySelectorAll('.binary-light');
        const binaryValue = document.getElementById('binary-value');
        const duration = this.getSpeedMultiplier() * 2;

        for (const binary of binaryArray) {
            this.checkAbort();

            binaryValue.textContent = binary;

            // Update lights
            binary.split('').forEach((bit, index) => {
                if (bit === '1') {
                    binaryLights[index].classList.add('on');
                } else {
                    binaryLights[index].classList.remove('on');
                }
            });

            // Play corresponding tone
            const value = parseInt(binary, 2);
            AudioController.playTone(200 + value * 2, 100);

            await this.sleep(duration);
        }

        // Reset
        binaryLights.forEach(l => l.classList.remove('on'));
        binaryValue.textContent = '00000000';
    },

    // ═══ AUDIO WAVEFORM TRANSMISSION ═══
    async transmitAudio(message) {
        const frequencies = Encoder.toFrequencyData(message);
        const duration = this.getSpeedMultiplier() * 2;

        for (const freq of frequencies) {
            this.checkAbort();

            AudioController.playTone(freq, duration - 50);
            OscilloscopeRenderer.setFrequency(freq);

            await this.sleep(duration);
        }

        OscilloscopeRenderer.setFrequency(0);
    },

    // Highlight active mode panel
    highlightActiveMode: function (mode) {
        document.querySelectorAll('.display-panel').forEach(p => {
            p.classList.remove('active-mode');
        });

        const panelMap = {
            'morse': '.morse-panel',
            'christmas': null,
            'binary': '.binary-panel',
            'audio': '.oscilloscope-panel',
            'glyphs': '.glyph-panel'
        };

        if (panelMap[mode]) {
            document.querySelector(panelMap[mode])?.classList.add('active-mode');
        }
        if (mode === 'christmas') {
            document.querySelector('.christmas-lights')?.classList.add('active-mode');
        }
    },

    // Reset all displays
    resetAllDisplays: function () {
        document.querySelectorAll('.light-bulb').forEach(l => l.classList.remove('active'));
        document.getElementById('morse-lamp')?.classList.remove('on');
        document.querySelectorAll('.binary-light').forEach(l => l.classList.remove('on'));
        document.getElementById('binary-value').textContent = '00000000';
        document.getElementById('morse-output').textContent = '';
        document.getElementById('glyph-display').textContent = '_';
        OscilloscopeRenderer.setFrequency(0);
    },

    async transmitGlyphs(message) {
        const glyphs = Encoder.toGlyphs(message);
        const display = document.getElementById('glyph-display');
        const duration = Math.max(200, this.getSpeedMultiplier() * 4);

        for (let i = 0; i < glyphs.length; i++) {
            this.checkAbort();
            const char = glyphs[i];

            display.textContent = char;
            display.classList.add('active');

            AudioController.playTone(150 + (i * 10), 200);

            await this.sleep(duration);
            display.classList.remove('active');
        }

        display.textContent = '_';
    },

    async transmitPulse(message) {
        const pulseSequence = Encoder.toColorPulse(message);
        const overlay = document.getElementById('portal-pulse-overlay');
        const duration = this.getSpeedMultiplier() * 5;

        for (const color of pulseSequence) {
            this.checkAbort();

            overlay.style.backgroundColor = color;
            overlay.classList.add('active');

            AudioController.playTone(50, 300);

            await this.sleep(duration);
            overlay.classList.remove('active');
            await this.sleep(100);
        }
    }
};

// Oscilloscope Canvas Renderer
const OscilloscopeRenderer = {
    canvas: null,
    ctx: null,
    frequency: 0,
    animationId: null,
    phase: 0,

    init: function () {
        this.canvas = document.getElementById('oscilloscope');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.animate();
    },

    setFrequency: function (freq) {
        this.frequency = freq;
    },

    animate: function () {
        if (!this.ctx) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        // Clear
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, width, height);

        // Draw waveform
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ff00';
        this.ctx.beginPath();

        if (this.frequency > 0) {
            const cycles = this.frequency / 100;
            for (let x = 0; x < width; x++) {
                const y = centerY + Math.sin((x / width) * cycles * Math.PI * 2 + this.phase) * (height * 0.35);
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.phase += 0.2;
        } else {
            // Flatline with slight noise
            for (let x = 0; x < width; x++) {
                const noise = (Math.random() - 0.5) * 4;
                const y = centerY + noise;
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }

        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        this.animationId = requestAnimationFrame(() => this.animate());
    }
};

window.Transmitter = Transmitter;
window.OscilloscopeRenderer = OscilloscopeRenderer;
