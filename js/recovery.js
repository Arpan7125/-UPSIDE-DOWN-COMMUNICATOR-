
const RecoveryController = {
    // Konami Code sequence: ↑↑↓↓←→←→BA
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'],
    konamiIndex: 0,

    // Hidden pixel click counter
    hiddenPixelClicks: 0,
    hiddenPixelRequired: 5,
    hiddenPixelTimeout: null,

    // Pattern tracking
    patternBuffer: [],
    secretPattern: ['H', 'E', 'L', 'P'],

    init: function () {
        this.setupKonamiListener();
        this.setupHiddenPixel();
        this.setupPatternListener();
    },

    // ═══ KONAMI CODE LISTENER ═══
    setupKonamiListener: function () {
        document.addEventListener('keydown', (e) => {
            // Check if key matches next in sequence
            if (e.code === this.konamiCode[this.konamiIndex]) {
                this.konamiIndex++;

                // Visual feedback
                this.showKonamiProgress();

                // Check if complete
                if (this.konamiIndex === this.konamiCode.length) {
                    this.triggerRecovery('Konami Code');
                    this.konamiIndex = 0;
                }
            } else if (e.code === this.konamiCode[0]) {
                // Reset but count this as first key
                this.konamiIndex = 1;
            } else {
                // Wrong key, reset
                this.konamiIndex = 0;
            }
        });
    },

    // Show Konami code progress
    showKonamiProgress: function () {
        const progress = this.konamiIndex;
        const total = this.konamiCode.length;

        if (progress > 0 && SanityController.isPossessed) {
            // Flash recovery hint
            const hint = document.getElementById('recovery-hint');
            if (hint) {
                hint.style.opacity = '1';
                hint.style.color = '#00ff00';
                setTimeout(() => {
                    hint.style.opacity = '0.3';
                    hint.style.color = '';
                }, 200);
            }
        }
    },

    // ═══ HIDDEN PIXEL LISTENER ═══
    setupHiddenPixel: function () {
        const pixel = document.getElementById('hidden-pixel');
        if (!pixel) return;

        pixel.addEventListener('click', () => {
            this.hiddenPixelClicks++;

            // Reset counter after 2 seconds of inactivity
            clearTimeout(this.hiddenPixelTimeout);
            this.hiddenPixelTimeout = setTimeout(() => {
                this.hiddenPixelClicks = 0;
            }, 2000);

            // Flash the pixel
            pixel.style.background = '#00ff00';
            setTimeout(() => {
                pixel.style.background = '';
            }, 100);

            // Check if enough clicks
            if (this.hiddenPixelClicks >= this.hiddenPixelRequired) {
                this.triggerRecovery('Hidden Pixel');
                this.hiddenPixelClicks = 0;
            }
        });
    },

    // ═══ PATTERN INPUT LISTENER ═══
    setupPatternListener: function () {
        document.addEventListener('keypress', (e) => {
            if (!SanityController.isPossessed) return;

            const char = e.key.toUpperCase();
            if (/[A-Z]/.test(char)) {
                this.patternBuffer.push(char);

                // Keep buffer limited
                if (this.patternBuffer.length > this.secretPattern.length) {
                    this.patternBuffer.shift();
                }

                // Check for pattern match
                if (this.patternBuffer.join('') === this.secretPattern.join('')) {
                    this.triggerRecovery('Secret Pattern (HELP)');
                    this.patternBuffer = [];
                }
            }
        });
    },

    // ═══ TRIGGER RECOVERY ═══
    triggerRecovery: function (method) {
        if (!SanityController.isPossessed) return;

        console.log(`Recovery triggered via: ${method}`);

        // Add dramatic effect
        document.body.classList.add('recovery-flash-active');

        // End possession
        SanityController.endPossession(true);

        // Log recovery
        this.logRecovery(method);
    },

    // Log recovery method (for debugging/achievements)
    logRecovery: function (method) {
        const recoveries = JSON.parse(localStorage.getItem('udc_recoveries') || '[]');
        recoveries.push({
            method: method,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('udc_recoveries', JSON.stringify(recoveries.slice(-10)));
    },

    // Get recovery stats
    getStats: function () {
        return JSON.parse(localStorage.getItem('udc_recoveries') || '[]');
    }
};

window.RecoveryController = RecoveryController;
