# 📟 UPSIDE DOWN COMMUNICATOR

[![GitHub stars](https://img.shields.io/github/stars/Arpan7125/-UPSIDE-DOWN-COMMUNICATOR-?style=for-the-badge)](https://github.com/Arpan7125/-UPSIDE-DOWN-COMMUNICATOR-/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An immersive, "Stranger Things" themed tactical communication interface. Built for encrypted terminal-to-terminal transmissions, this project features a premium military HUD aesthetic with CRT effects and multiple supernatural-inspired signal modes.

![HUD Preview](https://github.com/Arpan7125/-UPSIDE-DOWN-COMMUNICATOR-/raw/main/assets/preview.webp) *(Replace with actual asset URL if available)*

---

## 🌌 The Overworld & The Upside Down

The interface is split into two specialized terminals:
1. **The Sender Terminal (`index.html`)**: Used to encode and broadcast messages.
2. **The Receiver Terminal (`receiver.html`)**: Used to intercept and decode incoming transmissions.

Both terminals communicate in real-time using `localStorage` for cross-tab synchronization.

---

## 📡 Specialized Communication Modes

The communicator supports 6 distinct transmission methods:

### 1. 🟢 Morse Code
Traditional tactical transmission using a signal lamp and acoustic tones.

### 2. 🎄 Christmas Lights
The iconic Joyce Byers method. Encodes messages into a sequence of flashing Christmas bulbs on a 26-character board.

### 3. 💾 Binary Grid
Digital encoding that converts characters into a flickering 8-bit visual matrix.

### 4. 📈 Audio Waveform
An acoustic-visual mode that generates frequency-modulated tones mapped to character codes.

### 5. ᚠ Ancient Glyphs (GLYPHS)
**[NEW]** Tactical symbols inspired by Elder Futhark. Transmits cryptic runes for high-security supernatural communications.

### 6. 🌈 Portal Pulse (PULSE)
**[NEW]** Screen-wide color signal sequences. Uses intense chromatic flashes to bridge the gap between dimensions.

---

## 🛠️ Technical Stack & Features

- **Core**: Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Communication**: Inter-page message bus via `window.localStorage`.
- **Aesthetics**:
    - **CRT Effects**: Scanlines, chromatic aberration, and frequency jitter.
    - **Animations**: CSS keyframes for "possessed" overlays and fading signal panels.
    - **Typography**: Optimized tactical fonts including `Orbitron` and `Black Ops One`.
- **Audio Logic**: Web Audio API for generating tactical feedback tones.

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, or Edge).
- A local web server (Recommended: `npx http-server`).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Arpan7125/-UPSIDE-DOWN-COMMUNICATOR-.git
   cd -UPSIDE-DOWN-COMMUNICATOR-
   ```

2. **Run a local server**:
   ```bash
   npx http-server -p 8080
   ```

3. **Open the interface**:
   - Open `http://localhost:8080/index.html` (Sender)
   - Open `http://localhost:8080/receiver.html` (Receiver) in another window.

---

## 🎞️ Walkthrough & Documentation

Detailed implementation notes and manual verification steps are available in the internal [walkthrough.md](./walkthrough.md).

## 📽️ Project Presentation
View the official project presentation on Canva: [**Upside Down Communicator Slides**](https://www.canva.com/design/DAHAnvmqWys/MOMNqJn8Phm4NgDrLRlPtA/view?utm_content=DAHAnvmqWys&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h9e8be5d885)

## ⚖️ License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*“Friends don’t lie.”* 🧇
