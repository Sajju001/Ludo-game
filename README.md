# 🎲 Ludo Game

A polished, responsive and fully offline **Classic Ludo Game** built with **HTML, CSS and Vanilla JavaScript**.

Play Ludo locally with friends or against computer players — no internet connection, backend, database, login or server required.

## ✨ Features

* 🎲 Classic Ludo gameplay
* 👥 Supports **2, 3 and 4 players**
* 👤 Human vs Human support
* 🤖 Human vs Computer support
* 🤖 Up to 3 Computer players
* 🚫 Computer-only games are blocked
* 🎯 4 tokens per player
* 🔴 Red, 🟢 Green, 🟡 Yellow and 🔵 Blue players
* 🎲 Animated dice with values 1–6
* ⭐ Safe cells
* ⚔️ Token capture / kill system
* 🏠 Home paths
* 🏆 Token finishing system
* 👑 Winner detection
* 🔄 Extra turn on rolling a 6
* 6️⃣ Three consecutive sixes rule
* 🤖 Easy / Medium / Hard AI difficulty
* 💾 Automatic game saving with `localStorage`
* ▶️ Resume unfinished games
* 🆕 Start a new game
* 🔊 Sound effects using Web Audio API
* 🎵 Music settings
* ✨ Animation controls
* 🎨 Classic, Dark and Neon themes
* 📱 Fully responsive design
* 🖱️ Desktop support
* 📱 Mobile and touch support
* ♿ Accessible controls and readable UI
* 🌐 Works completely offline
* ⚡ No external dependencies required

---

## 🎮 Game Modes

The game supports exactly three player configurations:

| Mode      | Available |
| --------- | --------- |
| 2 Players | ✅         |
| 3 Players | ✅         |
| 4 Players | ✅         |
| 1 Player  | ❌         |

At least **one Human player** is always required.

### Example Configurations

**2 Players**

* Human vs Human
* Human vs Computer

**3 Players**

* Human vs Human vs Human
* Human vs Human vs Computer
* Human vs Computer vs Computer

**4 Players**

* Human vs Human vs Human vs Human
* Human vs Human vs Human vs Computer
* Human vs Human vs Computer vs Computer
* Human vs Computer vs Computer vs Computer

Computer vs Computer games are never allowed.

---

## 🤖 AI Difficulty

### 🟢 Easy

The Easy AI makes simple legal decisions.

* Moves any legal token
* Prefers getting tokens out of base
* Occasionally captures opponents
* Makes relatively random choices

### 🟡 Medium

The Medium AI provides a balanced challenge.

* Prioritizes captures
* Gets tokens out of base
* Moves tokens toward home
* Prefers safe cells
* Avoids unnecessary risks

### 🔴 Hard

The Hard AI uses more strategic decision-making.

* Looks for valuable captures
* Avoids dangerous positions
* Prioritizes progress toward home
* Considers multiple legal moves
* Makes better use of dice rolls
* Attempts to maintain strategically strong positions

The Hard AI is designed to be challenging while remaining beatable.

---

## 🎲 Gameplay Rules

Each player starts with **4 tokens inside their base**.

### Getting a Token Out

A token can leave the base only when the player rolls:

**6**

### Rolling a 6

When a player rolls a 6, they can:

* Bring a token out of base
* Move an active token by 6 spaces

After completing the move, the player receives another turn.

### Token Movement

Tokens move across the board **cell-by-cell** with animation rather than teleporting directly to their destination.

### Capturing

If a token lands on an opponent's token on a non-safe cell:

* The opponent's token is captured
* The captured token returns to its base
* A capture animation is displayed
* A sound effect can be played when sound is enabled

### Safe Cells

Tokens positioned on safe cells cannot be captured.

### Home Path

Tokens enter their corresponding colored home path near the end of the board.

The final home position requires an **exact dice roll**.

### Winning

The first player to move all four tokens into the final home position wins.

---

## 6️⃣ Three Sixes Rule

The game implements the traditional **three consecutive sixes** rule.

If a player rolls three consecutive sixes during the same turn sequence, the appropriate move/turn is cancelled and play passes to the next player.

---

## 💾 Save & Resume

The game automatically stores unfinished game progress using browser `localStorage`.

Saved information includes:

* Player configuration
* Player types
* Current turn
* Token positions
* AI difficulty
* Game progress
* Settings

When the page is reopened, an unfinished game can be resumed from the Home screen.

If saved data becomes corrupted, the game safely ignores the invalid save instead of crashing.

---

## ⚙️ Settings

The game includes a dedicated settings system.

### 🔊 Sound

Toggle game sound effects on or off.

### 🎵 Music

Toggle background music on or off.

### ✨ Animations

Enable or disable non-essential animations.

### 🎨 Themes

Available themes:

* Classic
* Dark
* Neon

Settings are stored locally in the browser.

---

## 🔊 Offline Audio

No external audio URLs are required.

Game sounds are generated using the browser's **Web Audio API**, allowing the game to remain completely offline.

Sound effects can be used for:

* Button clicks
* Dice rolls
* Token movement
* Captures
* Reaching home
* Victory

---

## 📱 Responsive Design

The game is designed for:

* 💻 Desktop
* 💻 Laptop
* 📱 Mobile
* 📲 Tablet

On mobile devices:

* The board automatically fits the viewport
* Buttons are touch-friendly
* Tokens remain easy to select
* No horizontal scrolling is required
* Dice controls remain accessible

---

## 🧠 Game Architecture

The JavaScript is organized into reusable game systems rather than relying on one large function.

Major systems include:

* Game State
* Player State
* Token State
* Board Coordinates
* Dice System
* Move Validation
* Turn Management
* AI Decision Making
* Rendering
* Animation System
* Sound System
* Local Storage
* UI Navigation

Each token has a **logical board position** independent of its visual DOM position.

This allows game rules and visual rendering to remain separate and reliable.

---

## 📁 Project Structure

```text
ludo-game/
│
├── index.html
├── style.css
├── script.js
│
└── assets/
    └── sounds/
```

The game can function without external assets when Web Audio API sounds are used.

---

## 🛠️ Technologies

* HTML5
* CSS3
* Vanilla JavaScript
* CSS Grid
* Web Audio API
* Browser LocalStorage
* Responsive Web Design

No frameworks or backend services are required.

---

## 🚫 No Backend Required

This project intentionally does **not** use:

* ❌ Firebase
* ❌ Supabase
* ❌ Database
* ❌ API
* ❌ WebSocket
* ❌ Server
* ❌ Authentication
* ❌ Login / Signup
* ❌ Online multiplayer

Everything runs directly inside the browser.

---

## ▶️ How to Run

No installation is required.

### Option 1 — Open Directly

Download or clone the repository and open:

```text
index.html
```

in any modern browser.

### Option 2 — Clone Repository

```bash
git clone https://github.com/Sajju001/ludo-game.git
```

Then open the project folder and launch:

```text
index.html
```

The game works without an internet connection.

---

## 🎮 Game Flow

```text
HOME
  ↓
PLAY LUDO
  ↓
SELECT PLAYERS
  ↓
2 / 3 / 4 PLAYERS
  ↓
SELECT HUMAN / COMPUTER
  ↓
SELECT AI DIFFICULTY
  ↓
START GAME
  ↓
PLAY LUDO
  ↓
WIN SCREEN
```

---

## 🏆 Victory Screen

When a player gets all four tokens home, the game displays a victory screen.

Example:

```text
🏆 RED WINS!

All 4 tokens reached home!
```

Human and Computer victories are displayed differently.

Players can then choose:

* **PLAY AGAIN**
* **MAIN MENU**

The game does not automatically start another match.

---

## 🛡️ Game Safety & Validation

The game prevents invalid state transitions such as:

* Double dice rolls
* Double token movement
* Selecting illegal tokens
* Moving during AI turns
* Moving after a turn has ended
* Multiple simultaneous animations
* Duplicate turns
* Invalid captures
* Invalid home movement
* Computer-only matches

All token movement is validated against the internal game state before execution.

---

## 👥 Local Multiplayer

Multiple Human players can play on the **same device**.

This is a local pass-and-play experience.

Example:

```text
🔴 RED'S TURN
```

After Red finishes:

```text
🟢 GREEN'S TURN
```

No online functionality is required.

---

## 🎨 UI Design

The interface is designed as a premium casual board game experience with:

* Modern cards
* Rounded components
* Soft shadows
* Polished dice
* Game-piece style tokens
* Smooth transitions
* Turn indicators
* Player progress
* Responsive board
* Visual feedback
* Celebration effects

The design prioritizes:

**FUN + CLARITY + RESPONSIVENESS + CORRECT GAMEPLAY**

---

## 👨‍💻 Developer

### Vibe Coded by SAJJAD ALI

Built with creativity, vanilla web technologies and a focus on polished gameplay.

<p align="center">
  <a href="https://github.com/Sajju001" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/GitHub-Sajju001-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <a href="https://sajju-folio.netlify.app/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Portfolio-Sajjad%20Ali-0A0A0A?style=for-the-badge&logo=googlechrome" alt="Portfolio">
  </a>
</p>

---

## 📄 License

This project is available for personal and educational use.

---

<p align="center">
  🎲 <strong>Have Fun Playing Ludo!</strong> 🎲
</p>

<p align="center">
  Made with ❤️ by <strong>SAJJAD ALI</strong>
</p>
