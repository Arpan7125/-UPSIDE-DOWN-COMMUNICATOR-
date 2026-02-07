/* ═══════════════════════════════════════════════════════════════
   MESSAGE ENCODER - Cryptic Transmission Protocols
   Converts text to visual/audio signals
   ═══════════════════════════════════════════════════════════════ */

const Encoder = {
    // Morse Code mapping
    morseMap: {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', ' ': '/'
    },

    // Encode message to Morse code
    toMorse: function (message) {
        return message.toUpperCase().split('').map(char => {
            return this.morseMap[char] || '';
        }).join(' ');
    },

    // Encode character to binary (8-bit ASCII)
    toBinary: function (char) {
        const code = char.toUpperCase().charCodeAt(0);
        return code.toString(2).padStart(8, '0');
    },

    // Encode message to binary array
    toBinaryArray: function (message) {
        return message.toUpperCase().split('').map(char => this.toBinary(char));
    },

    // Get letter index for Christmas lights (A=0, B=1, etc.)
    toAlphabetIndex: function (char) {
        const upper = char.toUpperCase();
        const code = upper.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            return code - 65;
        }
        return -1; // Not a letter
    },

    // Encode message to alphabet indices
    toAlphabetSequence: function (message) {
        return message.split('').map(char => ({
            char: char.toUpperCase(),
            index: this.toAlphabetIndex(char)
        })).filter(item => item.index >= 0);
    },

    // Generate frequency data for audio waveform
    toFrequencyData: function (message) {
        const baseFreq = 200;
        const freqRange = 600;
        return message.toUpperCase().split('').map(char => {
            const code = char.charCodeAt(0);
            // Map ASCII to frequency range
            return baseFreq + ((code % 26) / 26) * freqRange;
        });
    },

    // Parse Morse timing (dots, dashes, spaces)
    parseMorseTiming: function (morseString) {
        const timing = [];
        const chars = morseString.split('');

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            if (char === '.') {
                timing.push({ type: 'dot', duration: 1 });
            } else if (char === '-') {
                timing.push({ type: 'dash', duration: 3 });
            } else if (char === ' ') {
                // Check if it's a letter space or word space
                if (chars[i - 1] === '/' || chars[i + 1] === '/') {
                    // Word space
                    continue;
                }
                timing.push({ type: 'letterSpace', duration: 3 });
            } else if (char === '/') {
                timing.push({ type: 'wordSpace', duration: 7 });
            }
        }
        return timing;
    },

    // Glyph mapping (Cryptic symbols)
    glyphMap: {
        'A': 'ᚠ', 'B': 'ᚦ', 'C': 'ᚱ', 'D': 'ᚲ', 'E': 'ᚷ', 'F': 'ᚹ',
        'G': 'ᚻ', 'H': 'ᚾ', 'I': 'ᛁ', 'J': 'ᛄ', 'K': 'ᛈ', 'L': 'ᛇ',
        'M': 'ᛉ', 'N': 'ᛊ', 'O': 'ᛏ', 'P': 'ᛒ', 'Q': 'ᛖ', 'R': 'ᛗ',
        'S': 'ᛚ', 'T': 'ᛜ', 'U': 'ᛟ', 'V': 'ᛑ', 'W': 'ᚫ', 'X': 'ᚬ',
        'Y': 'ᚭ', 'Z': 'ᚮ', ' ': ' ', '0': '⓪', '1': '①', '2': '②',
        '3': '③', '4': '④', '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨'
    },

    // Encode message to Glyphs
    toGlyphs: function (message) {
        return message.toUpperCase().split('').map(char => {
            return this.glyphMap[char] || char;
        }).join('');
    },

    // Encode message to Color Pulse Sequence
    // Each character is mapped to a color based on its position in alphabet or value
    toColorPulse: function (message) {
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ffffff', '#ff8800'
        ];
        return message.toUpperCase().split('').map(char => {
            const code = char.charCodeAt(0);
            return colors[code % colors.length];
        });
    },

    // Corrupted encoding for possessed mode
    corruptMessage: function (message) {
        const corruptions = ['▓', '░', '█', '▒', '╳', '◈', '◉', '⌀', '☠', '⚠'];
        return message.split('').map(char => {
            if (Math.random() > 0.5) {
                return corruptions[Math.floor(Math.random() * corruptions.length)];
            }
            return char;
        }).join('');
    },

    // Reverse/invert message for possessed mode
    invertMessage: function (message) {
        return message.split('').reverse().join('');
    }
};

// Export for use
window.Encoder = Encoder;
