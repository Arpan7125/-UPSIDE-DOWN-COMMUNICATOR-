/* ═══════════════════════════════════════════════════════════════
   AUDIO CONTROLLER - Web Audio API Sound Effects
   Retro beeps, tones, and eerie ambient sounds
   ═══════════════════════════════════════════════════════════════ */

const AudioController = {
    audioContext: null,
    masterGain: null,
    isInitialized: false,

    init: function () {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            this.isInitialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    },

    resume: function () {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    // Play a simple tone
    playTone: function (frequency, duration, type = 'square') {
        if (!this.isInitialized) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration / 1000);
    },

    // Boot up sound
    playBootSound: function () {
        if (!this.isInitialized) this.init();

        const notes = [200, 300, 400, 500, 600, 800];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 100), i * 100);
        });
    },

    // Error/warning beep
    playErrorBeep: function () {
        this.playTone(150, 200, 'sawtooth');
        setTimeout(() => this.playTone(100, 300, 'sawtooth'), 250);
    },

    // Possessed mode sounds
    playPossessedSound: function () {
        if (!this.isInitialized) return;
        this.resume();

        // Create eerie noise
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.value = 50;
        osc2.type = 'square';
        osc2.frequency.value = 53;

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 2);
        osc2.stop(this.audioContext.currentTime + 2);
    },

    // Recovery sound
    playRecoverySound: function () {
        const notes = [400, 500, 600, 800, 1000];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 150, 'sine'), i * 80);
        });
    },

    // Static noise
    playStatic: function (duration) {
        if (!this.isInitialized) return;
        this.resume();

        const bufferSize = this.audioContext.sampleRate * duration / 1000;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();

        noise.buffer = buffer;
        gain.gain.value = 0.1;

        noise.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    },

    // Demogorgon warning
    playDemogorgonWarning: function () {
        this.playTone(80, 500, 'sawtooth');
        setTimeout(() => this.playTone(60, 700, 'sawtooth'), 300);
    }
};

window.AudioController = AudioController;
