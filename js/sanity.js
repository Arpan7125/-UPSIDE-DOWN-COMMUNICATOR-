

const SanityController = {
    sanity: 100,
    maxSanity: 100,
    isPossessed: false,
    possessedDuration: 30000, // 30 seconds
    decreaseRate: 1, // Points per second
    decreaseInterval: null,
    possessedTimeout: null,
    warningThreshold: 30,
    criticalThreshold: 15,

    // DOM Elements
    elements: {
        sanityFill: null,
        sanityValue: null,
        sanityBar: null,
        sanityWarning: null,
        possessedOverlay: null,
        demogorgonWarning: null
    },

    init: function () {
        this.elements.sanityFill = document.getElementById('sanity-fill');
        this.elements.sanityValue = document.getElementById('sanity-value');
        this.elements.sanityBar = document.getElementById('sanity-bar');
        this.elements.sanityWarning = document.getElementById('sanity-warning');
        this.elements.possessedOverlay = document.getElementById('possessed-overlay');
        this.elements.demogorgonWarning = document.getElementById('demogorgon-warning');

        this.updateDisplay();
        this.startDecay();
    },

    // Start sanity decay
    startDecay: function () {
        this.decreaseInterval = setInterval(() => {
            if (!this.isPossessed) {
                this.decrease(this.decreaseRate);
            }
        }, 1000);
    },

    // Decrease sanity
    decrease: function (amount) {
        this.sanity = Math.max(0, this.sanity - amount);
        this.updateDisplay();

        if (this.sanity <= 0 && !this.isPossessed) {
            this.triggerPossession();
        }
    },

    // Increase sanity
    increase: function (amount) {
        this.sanity = Math.min(this.maxSanity, this.sanity + amount);
        this.updateDisplay();
    },

    // Reset sanity to max
    reset: function () {
        this.sanity = this.maxSanity;
        this.updateDisplay();
    },

    // Update UI display
    updateDisplay: function () {
        const percentage = (this.sanity / this.maxSanity) * 100;

        if (this.elements.sanityFill) {
            this.elements.sanityFill.style.width = percentage + '%';
        }
        if (this.elements.sanityValue) {
            this.elements.sanityValue.textContent = Math.round(percentage) + '%';
        }

        // Update warning states
        if (this.elements.sanityBar) {
            this.elements.sanityBar.classList.remove('warning', 'critical');

            if (percentage <= this.criticalThreshold) {
                this.elements.sanityBar.classList.add('critical');
                this.elements.sanityWarning?.classList.add('visible');
                this.showDemogorgonWarning();
            } else if (percentage <= this.warningThreshold) {
                this.elements.sanityBar.classList.add('warning');
                this.elements.sanityWarning?.classList.remove('visible');
                this.hideDemogorgonWarning();
            } else {
                this.elements.sanityWarning?.classList.remove('visible');
                this.hideDemogorgonWarning();
            }
        }
    },

    // Show Demogorgon warning
    showDemogorgonWarning: function () {
        if (this.elements.demogorgonWarning) {
            this.elements.demogorgonWarning.classList.add('active');
            AudioController.playDemogorgonWarning();
        }
    },

    // Hide Demogorgon warning
    hideDemogorgonWarning: function () {
        if (this.elements.demogorgonWarning) {
            this.elements.demogorgonWarning.classList.remove('active');
        }
    },

    // Trigger possessed mode
    triggerPossession: function () {
        if (this.isPossessed) return;

        this.isPossessed = true;
        document.body.classList.add('possessed');

        if (this.elements.possessedOverlay) {
            this.elements.possessedOverlay.classList.add('active');
        }

        AudioController.playPossessedSound();
        AudioController.playStatic(1000);

        // Invert controls
        this.invertControls(true);

        // Add countdown
        this.startPossessedCountdown();

        console.log('POSSESSED MODE ACTIVATED - Find the escape sequence!');
    },

    // Start countdown during possessed mode
    startPossessedCountdown: function () {
        let remaining = this.possessedDuration / 1000;

        const countdownEl = document.createElement('div');
        countdownEl.className = 'recovery-countdown';
        countdownEl.id = 'possession-countdown';
        document.body.appendChild(countdownEl);

        const updateCountdown = () => {
            if (!this.isPossessed) {
                countdownEl.remove();
                return;
            }
            countdownEl.textContent = `${remaining}s`;
            remaining--;

            if (remaining < 0) {
                this.endPossession(false);
            } else {
                setTimeout(updateCountdown, 1000);
            }
        };

        updateCountdown();
    },

    // End possessed mode
    endPossession: function (recovered = true) {
        if (!this.isPossessed) return;

        this.isPossessed = false;
        document.body.classList.remove('possessed');

        if (this.elements.possessedOverlay) {
            this.elements.possessedOverlay.classList.remove('active');
        }

        // Remove countdown
        document.getElementById('possession-countdown')?.remove();

        // Restore controls
        this.invertControls(false);

        if (recovered) {
            // Successful recovery
            AudioController.playRecoverySound();
            this.showRecoveryFlash();
            this.sanity = 50; // Partial recovery
        } else {
            // Timed out - restart sanity
            this.sanity = 30;
        }

        this.updateDisplay();
        console.log(recovered ? 'SYSTEM RESTORED!' : 'Possession timeout - partial recovery');
    },

    // Show recovery flash effect
    showRecoveryFlash: function () {
        const flash = document.getElementById('recovery-flash');
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 1000);
        }
    },

    // Invert controls (for possessed mode)
    invertControls: function (invert) {
        if (invert) {
            document.addEventListener('keydown', this.invertKeyHandler);
        } else {
            document.removeEventListener('keydown', this.invertKeyHandler);
        }
    },

    // Inverted key handler
    invertKeyHandler: function (e) {
        const input = document.getElementById('message-input');
        if (document.activeElement === input) {
            // Scramble input
            if (e.key.length === 1 && Math.random() > 0.5) {
                e.preventDefault();
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
                input.value += chars[Math.floor(Math.random() * chars.length)];
            }
        }
    },

    // Get current status
    getStatus: function () {
        return {
            sanity: this.sanity,
            percentage: (this.sanity / this.maxSanity) * 100,
            isPossessed: this.isPossessed,
            isWarning: this.sanity <= this.warningThreshold,
            isCritical: this.sanity <= this.criticalThreshold
        };
    }
};

window.SanityController = SanityController;
