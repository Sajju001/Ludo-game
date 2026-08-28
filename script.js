/**
 * LUDO MASTER OFFLINE - ENGINE & LOGIC
 * Complete classic Ludo implementation in Vanilla JavaScript
 * Zero external dependencies, 100% offline functionality
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. SOUND & AUDIO SYNTHESIZER (Web Audio API - 100% Offline)
  // =========================================================================

  class SoundFX {
    constructor() {
      this.ctx = null;
      this.soundEnabled = true;
      this.musicEnabled = false;
      this.bgmTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type, duration, gainStart = 0.15, gainEnd = 0.001) {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play error', e);
      }
    }

    click() {
      this.playTone(600, 'triangle', 0.06, 0.1, 0.01);
    }

    diceRattle() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const freq = 200 + Math.random() * 250;
          this.playTone(freq, 'square', 0.04, 0.08, 0.01);
        }, i * 70);
      }
    }

    diceResult(val) {
      const baseFreq = 400 + val * 60;
      this.playTone(baseFreq, 'sine', 0.15, 0.2, 0.01);
    }

    hop() {
      this.playTone(520, 'sine', 0.08, 0.15, 0.01);
    }

    capture() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      // Dramatic crunch
      this.playTone(280, 'sawtooth', 0.15, 0.3, 0.01);
      setTimeout(() => this.playTone(180, 'triangle', 0.25, 0.35, 0.01), 100);
    }

    homeChime() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.25, 0.2, 0.01);
        }, idx * 90);
      });
    }

    victory() {
      if (!this.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      const fanfare = [
        { f: 523.25, d: 0.15, delay: 0 },
        { f: 659.25, d: 0.15, delay: 150 },
        { f: 783.99, d: 0.15, delay: 300 },
        { f: 1046.50, d: 0.4, delay: 450 },
        { f: 880.00, d: 0.2, delay: 850 },
        { f: 1046.50, d: 0.6, delay: 1050 }
      ];
      fanfare.forEach(note => {
        setTimeout(() => this.playTone(note.f, 'triangle', note.d, 0.25, 0.01), note.delay);
      });
    }

    alert() {
      this.playTone(320, 'sawtooth', 0.2, 0.15, 0.01);
    }

    toggleBGM(enable) {
      this.musicEnabled = enable;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
      if (enable) {
        this.init();
        let step = 0;
        const melody = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
        this.bgmTimer = setInterval(() => {
          if (!this.musicEnabled) return;
          const note = melody[step % melody.length];
          this.playTone(note, 'sine', 0.35, 0.03, 0.001);
          step++;
        }, 600);
      }
    }
  }

  const audio = new SoundFX();

  // =========================================================================
  // 2. LUDO BOARD 15x15 COORDINATE MAPPING
  // =========================================================================

  /**
   * 15x15 Coordinates: row (0..14), col (0..14)
   * Track has 52 cells (index 0..51) moving clockwise:
   * Red starts at track index 0: [6, 1]
   * Green starts at track index 13: [1, 8]
   * Yellow starts at track index 26: [8, 13]
   * Blue starts at track index 39: [13, 6]
   */

  const TRACK_COORDS = [
    // 0..4: Left arm upper row moving right
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    // 5..10: Top arm left column moving up
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    // 11..12: Top turn
    [0, 7], [0, 8],
    // 13..17: Top arm right column moving down (13 is Green start)
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    // 18..23: Right arm upper row moving right
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    // 24..25: Right turn
    [7, 14], [8, 14],
    // 26..30: Right arm lower row moving left (26 is Yellow start)
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    // 31..36: Bottom arm right column moving down
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    // 37..38: Bottom turn
    [14, 7], [14, 6],
    // 39..43: Bottom arm left column moving up (39 is Blue start)
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    // 44..49: Left arm lower row moving left
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    // 50..51: Left turn
    [7, 0], [6, 0]
  ];

  // Standard safe star cells on main track
  const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

  const COLOR_CONFIGS = {
    red: {
      name: 'RED',
      startOffset: 0,
      startCoord: [6, 1],
      homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
      centerGoal: [7, 6],
      baseSlots: [
        [1.8, 1.8], [1.8, 3.8], [3.8, 1.8], [3.8, 3.8]
      ]
    },
    green: {
      name: 'GREEN',
      startOffset: 13,
      startCoord: [1, 8],
      homePath: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
      centerGoal: [6, 7],
      baseSlots: [
        [1.8, 10.8], [1.8, 12.8], [3.8, 10.8], [3.8, 12.8]
      ]
    },
    yellow: {
      name: 'YELLOW',
      startOffset: 26,
      startCoord: [8, 13],
      homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
      centerGoal: [7, 8],
      baseSlots: [
        [10.8, 10.8], [10.8, 12.8], [12.8, 10.8], [12.8, 12.8]
      ]
    },
    blue: {
      name: 'BLUE',
      startOffset: 39,
      startCoord: [13, 6],
      homePath: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
      centerGoal: [8, 7],
      baseSlots: [
        [10.8, 1.8], [10.8, 3.8], [12.8, 1.8], [12.8, 3.8]
      ]
    }
  };

  /**
   * Convert logical step to board coordinates [row, col]
   * step = -1: in Base
   * step = 0: on Start cell
   * step = 1..50: around track
   * step = 51..55: on Home Path (0..4)
   * step = 56: Finished in Center Goal
   */
  function getCoordinatesForStep(color, step, tokenIndex = 0) {
    const config = COLOR_CONFIGS[color];
    if (step === -1) {
      return config.baseSlots[tokenIndex];
    }
    if (step >= 0 && step <= 50) {
      const trackIdx = (config.startOffset + step) % 52;
      return TRACK_COORDS[trackIdx];
    }
    if (step >= 51 && step <= 55) {
      const homePathIdx = step - 51;
      return config.homePath[homePathIdx];
    }
    if (step >= 56) {
      return config.centerGoal;
    }
    return config.baseSlots[tokenIndex];
  }

  function isSafeCell(color, step) {
    if (step < 0) return true; // in base is safe
    if (step >= 51) return true; // home path & finish are 100% safe
    const config = COLOR_CONFIGS[color];
    const trackIdx = (config.startOffset + step) % 52;
    return SAFE_TRACK_INDICES.includes(trackIdx);
  }

  function getTrackIndex(color, step) {
    if (step < 0 || step > 50) return -1;
    return (COLOR_CONFIGS[color].startOffset + step) % 52;
  }

  // =========================================================================
  // 3. GAME STATE & SETUP
  // =========================================================================

  const STORAGE_KEY = 'ludo_master_save_v1';
  const SETTINGS_KEY = 'ludo_master_settings_v1';

  let diceAngles = { x: -12, y: 18, z: 0 };

  const FACE_ROTATIONS = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 0, y: 180 }
  };

  let gameState = {
    inProgress: false,
    playerCount: 4,
    aiDifficulty: 'medium', // easy | medium | hard
    players: [], // Array of { id: 'red', name: 'RED', type: 'human'|'computer', hasCaptured: false, kills: 0, tokens: [{id, step}] }
    currentTurnIndex: 0,
    diceValue: 1,
    hasRolled: false,
    isRolling: false,
    isMovingToken: false,
    consecutiveSixes: 0,
    rankings: [],
    winner: null
  };

  let appSettings = {
    sound: true,
    music: false,
    animations: true,
    theme: 'classic' // classic | dark | neon
  };

  // Load Settings
  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        appSettings = Object.assign(appSettings, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load settings', e);
    }
    applySettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
    } catch (e) {}
  }

  function applySettings() {
    document.body.setAttribute('data-theme', appSettings.theme);
    audio.soundEnabled = appSettings.sound;
    audio.toggleBGM(appSettings.music);

    // Update settings modal UI toggles
    updateToggleUI('setting-sound', appSettings.sound ? 'on' : 'off');
    updateToggleUI('setting-music', appSettings.music ? 'on' : 'off');
    updateToggleUI('setting-anim', appSettings.animations ? 'on' : 'off');
    updateToggleUI('setting-theme', appSettings.theme);
  }

  function updateToggleUI(groupId, activeVal) {
    const group = document.getElementById(groupId);
    if (!group) return;
    const btns = group.querySelectorAll('.toggle-opt');
    btns.forEach(b => {
      if (b.dataset.val === activeVal) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // =========================================================================
  // 4. SCREEN NAVIGATION & UI HELPERS
  // =========================================================================

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }
    checkResumeButtonVisibility();
  }

  function showToast(msg, duration = 2000) {
    const toast = document.getElementById('game-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function checkResumeButtonVisibility() {
    const resumeBtn = document.getElementById('btn-resume-game');
    if (!resumeBtn) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.inProgress && !parsed.winner) {
          resumeBtn.style.display = 'inline-flex';
          return;
        }
      }
    } catch (e) {}
    resumeBtn.style.display = 'none';
  }

  // =========================================================================
  // 5. SETUP SCREEN CONFIGURATION
  // =========================================================================

  let setupConfig = {
    count: 4,
    playerTypes: {
      red: 'human',
      green: 'computer',
      yellow: 'computer',
      blue: 'computer'
    },
    difficulty: 'medium'
  };

  const COLOR_ORDER = ['red', 'green', 'yellow', 'blue'];

  function initSetupScreen() {
    // Select Player count cards
    document.querySelectorAll('.count-card').forEach(card => {
      card.addEventListener('click', () => {
        audio.click();
        const count = parseInt(card.dataset.count, 10);
        setupConfig.count = count;
        document.querySelectorAll('.count-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        renderSetupPlayerSlots();
      });
    });

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.click();
        setupConfig.difficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    renderSetupPlayerSlots();
  }

  function getActiveColorsForCount(count) {
    if (count === 2) return ['red', 'blue'];
    if (count === 3) return ['red', 'green', 'blue'];
    return ['red', 'green', 'yellow', 'blue'];
  }

  function renderSetupPlayerSlots() {
    const container = document.getElementById('setup-player-slots');
    if (!container) return;
    container.innerHTML = '';

    const activeColors = getActiveColorsForCount(setupConfig.count);

    let hasComputer = false;

    activeColors.forEach((color, idx) => {
      const slot = document.createElement('div');
      slot.className = 'player-slot-card';
      const pNum = idx + 1;
      const type = setupConfig.playerTypes[color] || (idx === 0 ? 'human' : 'computer');
      setupConfig.playerTypes[color] = type;
      if (type === 'computer') hasComputer = true;

      slot.innerHTML = `
        <div class="player-slot-info">
          <div class="color-dot ${color}"></div>
          <div>
            <div class="player-slot-name">PLAYER ${pNum}</div>
            <div class="player-slot-color-tag">${COLOR_CONFIGS[color].name}</div>
          </div>
        </div>
        <div class="type-toggle-group">
          <button class="type-btn ${type === 'human' ? 'active' : ''}" data-color="${color}" data-type="human">
            👤 Human
          </button>
          <button class="type-btn ${type === 'computer' ? 'active' : ''}" data-color="${color}" data-type="computer">
            🤖 Computer
          </button>
        </div>
      `;

      const typeBtns = slot.querySelectorAll('.type-btn');
      typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          audio.click();
          const targetColor = btn.dataset.color;
          const targetType = btn.dataset.type;
          setupConfig.playerTypes[targetColor] = targetType;
          renderSetupPlayerSlots();
        });
      });

      container.appendChild(slot);
    });

    // Toggle AI Difficulty visibility
    const diffSection = document.getElementById('setup-difficulty-section');
    if (diffSection) {
      diffSection.style.display = hasComputer ? 'block' : 'none';
    }

    // Hide any previous alert
    const alertBox = document.getElementById('setup-alert');
    if (alertBox) alertBox.style.display = 'none';
  }

  function validateAndStartGame() {
    const activeColors = getActiveColorsForCount(setupConfig.count);
    const humanCount = activeColors.filter(c => setupConfig.playerTypes[c] === 'human').length;

    const alertBox = document.getElementById('setup-alert');

    if (humanCount === 0) {
      audio.alert();
      if (alertBox) {
        alertBox.textContent = 'At least 1 player must be Human.';
        alertBox.style.display = 'block';
      }
      return;
    }

    if (alertBox) alertBox.style.display = 'none';

    // Initialize Game State
    startNewGameWithConfig(setupConfig.count, setupConfig.playerTypes, setupConfig.difficulty);
  }

  // =========================================================================
  // 6. GAME INITIALIZATION & BOARD GENERATION
  // =========================================================================

  function startNewGameWithConfig(count, playerTypes, difficulty) {
    const activeColors = getActiveColorsForCount(count);

    const players = activeColors.map(color => {
      return {
        id: color,
        name: COLOR_CONFIGS[color].name,
        type: playerTypes[color] || 'computer',
        hasCaptured: false,
        kills: 0,
        tokens: [
          { id: 0, step: -1 },
          { id: 1, step: -1 },
          { id: 2, step: -1 },
          { id: 3, step: -1 }
        ]
      };
    });

    gameState = {
      inProgress: true,
      playerCount: count,
      aiDifficulty: difficulty,
      players: players,
      currentTurnIndex: 0,
      diceValue: 1,
      hasRolled: false,
      isRolling: false,
      isMovingToken: false,
      consecutiveSixes: 0,
      rankings: [],
      winner: null
    };

    diceAngles = { x: -12, y: 18, z: 0 };
    saveGameState();
    buildBoardDOM();
    renderAll();
    showScreen('game');
    updateTurnUI();

    // Trigger AI if first player is computer
    checkAndTriggerAI();
  }

  function saveGameState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {}
  }

  function resumeSavedGame() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.inProgress && !parsed.winner) {
          gameState = parsed;
          // Ensure hasCaptured and kills exist for legacy saves
          gameState.players.forEach(p => {
            if (p.hasCaptured === undefined) p.hasCaptured = false;
            if (p.kills === undefined) p.kills = 0;
          });
          buildBoardDOM();
          renderAll();
          showScreen('game');
          updateTurnUI();
          if (gameState.hasRolled) {
            highlightLegalMoves();
          }
          checkAndTriggerAI();
          return;
        }
      }
    } catch (e) {
      console.error('Failed to resume game', e);
    }
    showToast('No valid saved game found.');
  }

  // Build the 15x15 board cells and token overlay
  function buildBoardDOM() {
    const board = document.getElementById('ludo-board-grid');
    if (!board) return;
    board.innerHTML = '';

    // 1. Quadrant Bases
    // Red Base (Top-Left)
    board.appendChild(createBaseDOM('red'));
    // Green Base (Top-Right)
    board.appendChild(createBaseDOM('green'));
    // Yellow Base (Bottom-Right)
    board.appendChild(createBaseDOM('yellow'));
    // Blue Base (Bottom-Left)
    board.appendChild(createBaseDOM('blue'));

    // 2. Center Goal (3x3: Rows 7-9, Cols 7-9)
    board.appendChild(createCenterGoalDOM());

    // 3. Grid Cells for the Cross Arms
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip base areas
        if (r < 6 && c < 6) continue; // Red base
        if (r < 6 && c > 8) continue; // Green base
        if (r > 8 && c > 8) continue; // Yellow base
        if (r > 8 && c < 6) continue; // Blue base
        // Skip center goal (rows 6..8, cols 6..8)
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.gridRow = `${r + 1} / ${r + 2}`;
        cell.style.gridColumn = `${c + 1} / ${c + 2}`;
        cell.dataset.row = r;
        cell.dataset.col = c;

        decorateCell(cell, r, c);
        board.appendChild(cell);
      }
    }

    // 4. Tokens Layer
    let tokenLayer = document.getElementById('tokens-layer');
    if (!tokenLayer) {
      tokenLayer = document.createElement('div');
      tokenLayer.id = 'tokens-layer';
      tokenLayer.className = 'tokens-layer';
      const wrapper = document.getElementById('ludo-board-wrapper');
      if (wrapper) wrapper.appendChild(tokenLayer);
    }
    tokenLayer.innerHTML = '';

    // Create 3D Pawn token DOM elements for active players
    gameState.players.forEach(player => {
      player.tokens.forEach(tok => {
        const tokenElem = document.createElement('div');
        tokenElem.id = `token-${player.id}-${tok.id}`;
        tokenElem.className = `ludo-token ${player.id}`;
        tokenElem.dataset.color = player.id;
        tokenElem.dataset.tokenId = tok.id;

        // Authentic 3D Pawn / Goti Structure
        tokenElem.innerHTML = `
          <div class="pawn-shadow"></div>
          <div class="pawn-visual">
            <div class="pawn-head"></div>
            <div class="pawn-body"></div>
            <div class="pawn-ring"></div>
            <div class="pawn-base"></div>
          </div>
        `;

        tokenElem.addEventListener('click', () => onTokenClicked(player.id, tok.id));
        tokenLayer.appendChild(tokenElem);
      });
    });
  }

  function createBaseDOM(color) {
    const quadrant = document.createElement('div');
    quadrant.className = `base-quadrant ${color}`;

    const yard = document.createElement('div');
    yard.className = 'base-yard';

    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = `base-slot ${color}`;
      yard.appendChild(slot);
    }

    quadrant.appendChild(yard);
    return quadrant;
  }

  function createCenterGoalDOM() {
    const center = document.createElement('div');
    center.className = 'center-goal';

    center.innerHTML = `
      <svg class="center-goal-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="0,0 50,50 0,100" fill="var(--red-main)" />
        <polygon points="0,0 50,50 100,0" fill="var(--green-main)" />
        <polygon points="100,0 50,50 100,100" fill="var(--yellow-main)" />
        <polygon points="0,100 50,50 100,100" fill="var(--blue-main)" />
      </svg>
      <div class="center-trophy-icon">🏆</div>
    `;
    return center;
  }

  function decorateCell(cell, r, c) {
    // Red Start: [6, 1]
    if (r === 6 && c === 1) {
      cell.classList.add('start-red');
      cell.innerHTML = '<span class="start-arrow">➔</span>';
      return;
    }
    // Green Start: [1, 8]
    if (r === 1 && c === 8) {
      cell.classList.add('start-green');
      cell.innerHTML = '<span class="start-arrow">➔</span>';
      return;
    }
    // Yellow Start: [8, 13]
    if (r === 8 && c === 13) {
      cell.classList.add('start-yellow');
      cell.innerHTML = '<span class="start-arrow">➔</span>';
      return;
    }
    // Blue Start: [13, 6]
    if (r === 13 && c === 6) {
      cell.classList.add('start-blue');
      cell.innerHTML = '<span class="start-arrow">➔</span>';
      return;
    }

    // Home paths
    // Red Home Column: r=7, c=1..5
    if (r === 7 && c >= 1 && c <= 5) {
      cell.classList.add('home-path-red');
      return;
    }
    // Green Home Column: c=7, r=1..5
    if (c === 7 && r >= 1 && r <= 5) {
      cell.classList.add('home-path-green');
      return;
    }
    // Yellow Home Column: r=7, c=9..13
    if (r === 7 && c >= 9 && c <= 13) {
      cell.classList.add('home-path-yellow');
      return;
    }
    // Blue Home Column: c=7, r=9..13
    if (c === 7 && r >= 9 && r <= 13) {
      cell.classList.add('home-path-blue');
      return;
    }

    // Star Safe Cells
    // Track 8: [2, 6]
    // Track 21: [6, 12]
    // Track 34: [12, 8]
    // Track 47: [8, 2]
    if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
      cell.innerHTML = '<span class="star-marker">⭐</span>';
    }
  }

  // =========================================================================
  // 7. TOKEN RENDERING & POSITION CALCULATION
  // =========================================================================

  function renderAll() {
    renderTokenPositions();
    renderSideboards();
    renderDice();
  }

  /**
   * Group tokens occupying the same grid position so they don't overlap completely
   */
  function renderTokenPositions() {
    const posMap = {}; // 'r,c' -> [ { color, tokenId, elem } ]

    gameState.players.forEach(player => {
      player.tokens.forEach(tok => {
        const coords = getCoordinatesForStep(player.id, tok.step, tok.id);
        const key = `${coords[0].toFixed(1)},${coords[1].toFixed(1)}`;
        if (!posMap[key]) posMap[key] = [];
        posMap[key].push({
          color: player.id,
          tokenId: tok.id,
          step: tok.step,
          coords: coords
        });
      });
    });

    const cellSizePercent = 100 / 15;

    Object.values(posMap).forEach(cluster => {
      const count = cluster.length;
      cluster.forEach((item, idx) => {
        const tokenElem = document.getElementById(`token-${item.color}-${item.tokenId}`);
        if (!tokenElem) return;

        let [row, col] = item.coords;
        let leftPercent = (col + 0.5) * cellSizePercent;
        let topPercent = (row + 0.5) * cellSizePercent;

        // Offset when multiple tokens are in the same cell
        if (count > 1 && item.step >= 0 && item.step < 56) {
          const offsets = [
            [-1.1, -1.1],
            [1.1, 1.1],
            [-1.1, 1.1],
            [1.1, -1.1]
          ];
          const [offY, offX] = offsets[idx % offsets.length];
          leftPercent += offX;
          topPercent += offY;
        }

        tokenElem.style.top = `${topPercent}%`;
        tokenElem.style.left = `${leftPercent}%`;

        if (item.step === 56) {
          tokenElem.classList.add('finished');
        } else {
          tokenElem.classList.remove('finished');
        }
      });
    });
  }

  function renderSideboards() {
    const leftPanel = document.getElementById('side-panel-left');
    const rightPanel = document.getElementById('side-panel-right');
    if (!leftPanel || !rightPanel) return;

    leftPanel.innerHTML = '';
    rightPanel.innerHTML = '';

    const currentPlayer = getCurrentPlayer();

    gameState.players.forEach((p, idx) => {
      const finishedCount = p.tokens.filter(t => t.step === 56).length;
      const isTurn = currentPlayer && currentPlayer.id === p.id;

      const card = document.createElement('div');
      card.className = `player-status-card ${p.id} ${isTurn ? 'active-turn' : ''}`;

      let dotsHTML = '';
      for (let i = 0; i < 4; i++) {
        dotsHTML += `<div class="token-indicator-dot ${i < finishedCount ? 'home' : ''}"></div>`;
      }

      // Kill status badge indicator
      const killBadgeHTML = p.hasCaptured
        ? `<span class="status-kill-badge unlocked" title="Home Path Unlocked!">🔓 Kill: Done (${p.kills || 1} ⚔️)</span>`
        : `<span class="status-kill-badge locked" title="Must capture an opponent to enter home path">🔒 Kill: Needed</span>`;

      card.innerHTML = `
        <div class="status-card-header">
          <div style="display:flex; align-items:center; gap:6px;">
            <span>${p.name}</span>
            ${killBadgeHTML}
          </div>
          <span class="status-card-badge">${p.type === 'human' ? '👤' : '🤖'}</span>
        </div>
        <div class="status-progress-text">${finishedCount} / 4 HOME</div>
        <div class="status-tokens-dots">${dotsHTML}</div>
      `;

      if (idx % 2 === 0) {
        leftPanel.appendChild(card);
      } else {
        rightPanel.appendChild(card);
      }
    });
  }

  function renderDice() {
    const diceCube = document.getElementById('dice-3d-cube');
    if (!diceCube) return;
    const target = FACE_ROTATIONS[gameState.diceValue] || FACE_ROTATIONS[1];
    diceCube.style.transform = `rotateX(${target.x}deg) rotateY(${target.y}deg) rotateZ(0deg)`;
  }

  // =========================================================================
  // 8. GAME FLOW, TURNS & 3D ROTATING DICE LOGIC
  // =========================================================================

  function getCurrentPlayer() {
    if (!gameState.players || gameState.players.length === 0) return null;
    return gameState.players[gameState.currentTurnIndex % gameState.players.length];
  }

  function updateTurnUI() {
    const cur = getCurrentPlayer();
    if (!cur) return;

    const banner = document.getElementById('turn-player-banner');
    if (banner) {
      const lockInfo = cur.hasCaptured ? '🔓 [UNLOCKED]' : '🔒 [KILL REQUIRED]';
      banner.innerHTML = `<span class="turn-pill" style="color: var(--${cur.id}-main); background: var(--${cur.id}-main);"></span> ${cur.name}'S TURN ${cur.type === 'computer' ? '🤖' : '👤'} <small style="font-size:0.75rem; opacity:0.85; margin-left:4px;">${lockInfo}</small>`;
    }

    const msg = document.getElementById('dice-message');
    const rollBtn = document.getElementById('btn-roll-dice');

    if (cur.type === 'human') {
      if (!gameState.hasRolled && !gameState.isRolling && !gameState.isMovingToken) {
        if (msg) msg.textContent = 'Roll the dice!';
        if (rollBtn) rollBtn.disabled = false;
      } else if (gameState.hasRolled && !gameState.isMovingToken) {
        if (msg) msg.textContent = `Rolled a ${gameState.diceValue}! Select a token`;
        if (rollBtn) rollBtn.disabled = true;
      }
    } else {
      if (msg) msg.textContent = '🤖 Computer is thinking...';
      if (rollBtn) rollBtn.disabled = true;
    }

    renderSideboards();
  }

  function onRollDiceClicked() {
    const cur = getCurrentPlayer();
    if (!cur || cur.type !== 'human') return;
    if (gameState.hasRolled || gameState.isRolling || gameState.isMovingToken) return;

    performDiceRoll();
  }

  function performDiceRoll(callback) {
    if (gameState.isRolling || gameState.isMovingToken) return;

    gameState.isRolling = true;
    const rollBtn = document.getElementById('btn-roll-dice');
    if (rollBtn) rollBtn.disabled = true;

    audio.diceRattle();

    const diceScene = document.getElementById('dice-3d-scene');
    const diceCube = document.getElementById('dice-3d-cube');

    if (diceScene) diceScene.classList.add('rolling');
    if (diceCube) diceCube.classList.add('is-rolling');

    let rollTumbles = 0;
    const totalTumbles = 10;

    const rollInterval = setInterval(() => {
      // Rotate 3D cube with tumbling angular velocity
      diceAngles.x += (Math.random() > 0.5 ? 90 : -90) + (Math.random() * 60 - 30);
      diceAngles.y += (Math.random() > 0.5 ? 90 : -90) + (Math.random() * 60 - 30);
      diceAngles.z = Math.random() * 40 - 20;

      if (diceCube) {
        diceCube.style.transform = `rotateX(${diceAngles.x}deg) rotateY(${diceAngles.y}deg) rotateZ(${diceAngles.z}deg) translateY(-8px)`;
      }

      rollTumbles++;
      if (rollTumbles >= totalTumbles) {
        clearInterval(rollInterval);

        const finalVal = Math.floor(Math.random() * 6) + 1;
        gameState.diceValue = finalVal;
        gameState.hasRolled = true;
        gameState.isRolling = false;

        // Clean final 3D orientation aligned to the target face
        const targetRot = FACE_ROTATIONS[finalVal] || FACE_ROTATIONS[1];
        const snappedX = Math.round(diceAngles.x / 360) * 360;
        const snappedY = Math.round(diceAngles.y / 360) * 360;

        diceAngles.x = snappedX + targetRot.x;
        diceAngles.y = snappedY + targetRot.y;
        diceAngles.z = 0;

        if (diceCube) {
          diceCube.classList.remove('is-rolling');
          diceCube.style.transform = `rotateX(${diceAngles.x}deg) rotateY(${diceAngles.y}deg) rotateZ(0deg) translateY(0)`;
        }
        if (diceScene) diceScene.classList.remove('rolling');

        audio.diceResult(finalVal);
        handlePostRoll(callback);
      }
    }, 55);
  }

  function handlePostRoll(callback) {
    const cur = getCurrentPlayer();
    if (!cur) return;

    // Handle 3 consecutive sixes rule
    if (gameState.diceValue === 6) {
      gameState.consecutiveSixes++;
      if (gameState.consecutiveSixes >= 3) {
        audio.alert();
        showToast('3 Sixes in a row! Turn forfeited.', 2500);
        gameState.consecutiveSixes = 0;
        setTimeout(() => {
          advanceToNextPlayer();
        }, 1500);
        return;
      }
    } else {
      gameState.consecutiveSixes = 0;
    }

    // Check legal moves
    const legalTokens = getLegalTokens(cur, gameState.diceValue);

    if (legalTokens.length === 0) {
      showToast('No valid move.');
      setTimeout(() => {
        advanceToNextPlayer();
      }, 1200);
      return;
    }

    updateTurnUI();

    if (cur.type === 'human') {
      highlightLegalMoves(legalTokens);
    } else {
      if (callback) callback(legalTokens);
    }
  }

  // =========================================================================
  // 9. MOVE VALIDATION & KILL-TO-UNLOCK HOME PATH RULE
  // =========================================================================

  function getLegalTokens(player, dice) {
    const legal = [];
    const hasUnlockedHome = !!player.hasCaptured;

    player.tokens.forEach(tok => {
      // 1. If token in base yard: needs a 6 to exit
      if (tok.step === -1) {
        if (dice === 6) legal.push(tok);
      } else if (tok.step >= 0 && tok.step < 56) {
        // 2. Token already on the board or in home path
        if (hasUnlockedHome) {
          // Home path is unlocked: normal movement up to goal (step 56)
          const newStep = tok.step + dice;
          if (newStep <= 56) {
            legal.push(tok);
          }
        } else {
          // Home path is LOCKED until at least 1 opponent token is captured!
          // Token is on main track (0..50). It CANNOT enter colored home path (51..56).
          // Instead, it continues advancing on the outer 52-cell track looping to hunt opponents!
          if (tok.step <= 50) {
            legal.push(tok);
          }
        }
      }
    });
    return legal;
  }

  function highlightLegalMoves(legalTokens) {
    clearHighlights();
    const cur = getCurrentPlayer();
    if (!cur) return;

    const tokensToHighlight = legalTokens || getLegalTokens(cur, gameState.diceValue);

    tokensToHighlight.forEach(tok => {
      const elem = document.getElementById(`token-${cur.id}-${tok.id}`);
      if (elem) {
        elem.classList.add('selectable');
      }
    });
  }

  function clearHighlights() {
    document.querySelectorAll('.ludo-token').forEach(t => t.classList.remove('selectable'));
  }

  // =========================================================================
  // 10. TOKEN MOVEMENT & SEQUENTIAL ANIMATION
  // =========================================================================

  function onTokenClicked(color, tokenId) {
    const cur = getCurrentPlayer();
    if (!cur || cur.type !== 'human') return;
    if (!gameState.hasRolled || gameState.isMovingToken || gameState.isRolling) return;
    if (cur.id !== color) return;

    const token = cur.tokens.find(t => t.id === tokenId);
    if (!token) return;

    const legalTokens = getLegalTokens(cur, gameState.diceValue);
    if (!legalTokens.some(t => t.id === tokenId)) {
      return; // Illegal move click ignored
    }

    executeMove(cur, token, gameState.diceValue);
  }

  function executeMove(player, token, dice, onComplete) {
    gameState.isMovingToken = true;
    clearHighlights();

    const startStep = token.step;
    let targetStep = 0;
    const pathSteps = [];

    if (startStep === -1) {
      targetStep = 0; // Exit base to start cell
      pathSteps.push(0);
    } else {
      if (player.hasCaptured) {
        // Player has made a kill: normal entrance into home path (step 51..55) and finish (step 56)
        targetStep = startStep + dice;
        for (let s = startStep + 1; s <= targetStep; s++) {
          pathSteps.push(s);
        }
      } else {
        // Player has NOT made a kill yet: Stay on outer 52-cell track to keep hunting!
        let curr = startStep;
        for (let i = 0; i < dice; i++) {
          curr = (curr + 1) % 52;
          pathSteps.push(curr);
        }
        targetStep = curr;
      }
    }

    const tokenElem = document.getElementById(`token-${player.id}-${token.id}`);
    if (tokenElem) tokenElem.classList.add('moving');

    let stepIdx = 0;
    const stepDuration = appSettings.animations ? 160 : 20;

    function moveNextStep() {
      if (stepIdx < pathSteps.length) {
        token.step = pathSteps[stepIdx];
        renderTokenPositions();
        audio.hop();
        stepIdx++;
        setTimeout(moveNextStep, stepDuration);
      } else {
        // Finished moving along path
        if (tokenElem) tokenElem.classList.remove('moving');
        token.step = targetStep;
        renderTokenPositions();
        handlePostMove(player, token, dice, onComplete);
      }
    }

    moveNextStep();
  }

  function handlePostMove(player, token, dice, onComplete) {
    let grantExtraTurn = false;

    // 1. Check if token finished (step 56)
    if (token.step === 56) {
      audio.homeChime();
      showToast(`${player.name} got a token HOME! 🌟`);

      const allHome = player.tokens.every(t => t.step === 56);
      if (allHome) {
        handlePlayerWon(player);
        return;
      }
      grantExtraTurn = true; // Award extra turn for getting token home!
    }

    // 2. Check for Capture (only on non-safe track cells 0..50)
    if (token.step >= 0 && token.step <= 50) {
      const isSafe = isSafeCell(player.id, token.step);
      const landedTrackIdx = getTrackIndex(player.id, token.step);

      if (!isSafe) {
        // Find any opponent tokens on this same track cell
        gameState.players.forEach(otherPlayer => {
          if (otherPlayer.id !== player.id) {
            otherPlayer.tokens.forEach(oppTok => {
              if (oppTok.step >= 0 && oppTok.step <= 50) {
                const oppTrackIdx = getTrackIndex(otherPlayer.id, oppTok.step);
                if (oppTrackIdx === landedTrackIdx) {
                  // Capture!
                  oppTok.step = -1; // return to base
                  audio.capture();
                  grantExtraTurn = true;

                  if (!player.hasCaptured) {
                    player.hasCaptured = true;
                    player.kills = 1;
                    showToast(`⚔️ ${player.name} MADE A KILL! Home Path Unlocked! 🔓`, 2500);
                  } else {
                    player.kills = (player.kills || 0) + 1;
                    showToast(`💥 ${player.name} captured ${otherPlayer.name}! (+1 Roll)`, 2000);
                  }

                  const oppElem = document.getElementById(`token-${otherPlayer.id}-${oppTok.id}`);
                  if (oppElem) oppElem.classList.add('captured-anim');
                  setTimeout(() => {
                    if (oppElem) oppElem.classList.remove('captured-anim');
                    renderTokenPositions();
                  }, 500);
                }
              }
            });
          }
        });
      }
    }

    // 3. Rolling a 6 also grants extra turn
    if (dice === 6) {
      grantExtraTurn = true;
    }

    gameState.isMovingToken = false;
    saveGameState();
    renderSideboards();

    if (grantExtraTurn) {
      gameState.hasRolled = false;
      showToast(`${player.name} gets another roll! 🎲`, 1500);
      setTimeout(() => {
        updateTurnUI();
        checkAndTriggerAI();
        if (onComplete) onComplete();
      }, 600);
    } else {
      setTimeout(() => {
        advanceToNextPlayer();
        if (onComplete) onComplete();
      }, 400);
    }
  }

  function advanceToNextPlayer() {
    gameState.hasRolled = false;
    gameState.isMovingToken = false;
    gameState.isRolling = false;
    gameState.consecutiveSixes = 0;

    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.players.length;

    saveGameState();
    updateTurnUI();
    checkAndTriggerAI();
  }

  // =========================================================================
  // 11. SMART AI ENGINE (Easy / Medium / Hard)
  // =========================================================================

  function checkAndTriggerAI() {
    const cur = getCurrentPlayer();
    if (!cur || cur.type !== 'computer' || gameState.winner || !gameState.inProgress) return;

    const thinkTime = 800 + Math.random() * 400;

    setTimeout(() => {
      if (getCurrentPlayer()?.id !== cur.id) return;
      performDiceRoll((legalTokens) => {
        setTimeout(() => {
          if (getCurrentPlayer()?.id !== cur.id) return;
          const chosenToken = chooseAIToken(cur, legalTokens, gameState.diceValue, gameState.aiDifficulty);
          if (chosenToken) {
            executeMove(cur, chosenToken, gameState.diceValue);
          } else {
            advanceToNextPlayer();
          }
        }, 500);
      });
    }, thinkTime);
  }

  function chooseAIToken(player, legalTokens, dice, difficulty) {
    if (legalTokens.length === 1) return legalTokens[0];

    // EASY AI: Mostly random with slight base exit preference
    if (difficulty === 'easy') {
      if (dice === 6) {
        const baseTok = legalTokens.find(t => t.step === -1);
        if (baseTok && Math.random() > 0.4) return baseTok;
      }
      return legalTokens[Math.floor(Math.random() * legalTokens.length)];
    }

    // Score each candidate move
    let bestToken = legalTokens[0];
    let bestScore = -Infinity;

    legalTokens.forEach(token => {
      let score = 0;
      const startStep = token.step;
      let targetStep = 0;

      if (startStep === -1) {
        targetStep = 0;
      } else if (player.hasCaptured) {
        targetStep = startStep + dice;
      } else {
        targetStep = (startStep + dice) % 52;
      }

      // 1. Finishing home (Huge reward)
      if (targetStep === 56 && player.hasCaptured) {
        score += 200;
      } else if (targetStep >= 51 && player.hasCaptured) {
        score += 100 + (targetStep - 50) * 8; // Reaching safe home path
      }

      // 2. Base Exit on 6
      if (startStep === -1) {
        score += (difficulty === 'hard') ? 80 : 70;
      }

      // 3. Capturing Opponent (CRITICAL to unlock home path if not captured yet!)
      if (targetStep >= 0 && targetStep <= 50) {
        const targetTrackIdx = getTrackIndex(player.id, targetStep);
        const isSafe = isSafeCell(player.id, targetStep);

        if (!isSafe) {
          gameState.players.forEach(other => {
            if (other.id !== player.id) {
              other.tokens.forEach(oppTok => {
                if (oppTok.step >= 0 && oppTok.step <= 50) {
                  if (getTrackIndex(other.id, oppTok.step) === targetTrackIdx) {
                    // Huge reward for capture! Especially if home path is still locked
                    const lockMultiplier = !player.hasCaptured ? 280 : 130;
                    score += lockMultiplier + oppTok.step * 2;
                  }
                }
              });
            }
          });
        }

        // 4. Reaching a Safe Spot
        if (isSafe) {
          score += 35;
        }

        // 5. Hard AI: Threat & Vulnerability Analysis
        if (difficulty === 'hard') {
          // Check if leaving current spot escapes danger
          if (startStep >= 0 && startStep <= 50 && !isSafeCell(player.id, startStep)) {
            const curTrackIdx = getTrackIndex(player.id, startStep);
            const inDanger = isThreatened(curTrackIdx, player.id);
            if (inDanger) {
              score += 45; // Great to run away!
            }
          }

          // Check if target spot would be vulnerable to opponents behind
          if (!isSafe) {
            const wouldBeThreatened = isThreatened(targetTrackIdx, player.id);
            if (wouldBeThreatened) {
              score -= 40; // Penalty for moving into crossfire
            }
          }
        }
      }

      // 6. Natural progress weight
      score += (startStep >= 0 ? targetStep * 1.1 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestToken = token;
      }
    });

    return bestToken;
  }

  function isThreatened(trackIdx, myColor) {
    let threatened = false;
    gameState.players.forEach(other => {
      if (other.id !== myColor) {
        other.tokens.forEach(oppTok => {
          if (oppTok.step >= 0 && oppTok.step <= 50) {
            const oppTrackIdx = getTrackIndex(other.id, oppTok.step);
            // Distance from opponent to trackIdx
            const dist = (trackIdx - oppTrackIdx + 52) % 52;
            if (dist >= 1 && dist <= 6) {
              threatened = true;
            }
          }
        });
      }
    });
    return threatened;
  }

  // =========================================================================
  // 12. WINNER DETECTION & CELEBRATION
  // =========================================================================

  function handlePlayerWon(player) {
    gameState.winner = player;
    gameState.inProgress = false;
    audio.victory();

    // Calculate final rankings
    const rankings = [...gameState.players].sort((a, b) => {
      const aScore = a.tokens.filter(t => t.step === 56).length * 100 + a.tokens.reduce((acc, t) => acc + (t.step > 0 ? t.step : 0), 0);
      const bScore = b.tokens.filter(t => t.step === 56).length * 100 + b.tokens.reduce((acc, t) => acc + (t.step > 0 ? t.step : 0), 0);
      return bScore - aScore;
    });
    gameState.rankings = rankings;
    saveGameState();

    const winModal = document.getElementById('modal-victory');
    const winTitle = document.getElementById('win-title');
    const winDesc = document.getElementById('win-desc');
    const winRankings = document.getElementById('win-rankings');

    if (winTitle) {
      winTitle.textContent = (player.type === 'human') ? '🏆 YOU WIN!' : `🤖 ${player.name} WINS!`;
    }
    if (winDesc) {
      winDesc.textContent = `All 4 ${player.name} tokens reached home! Congratulations!`;
    }

    if (winRankings) {
      winRankings.innerHTML = '';
      rankings.forEach((p, idx) => {
        const homeCount = p.tokens.filter(t => t.step === 56).length;
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
          <span>#${idx + 1} ${p.name} ${p.type === 'human' ? '👤' : '🤖'}</span>
          <span>${homeCount}/4 HOME</span>
        `;
        winRankings.appendChild(item);
      });
    }

    showModal('modal-victory');
    startConfetti();
  }

  // Particle Confetti
  function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#e53935', '#2e7d32', '#f59e0b', '#1976d2', '#ff4081', '#00e676'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: -2 + Math.random() * 4,
        speedY: 2 + Math.random() * 5,
        rotation: Math.random() * 360,
        rotSpeed: -3 + Math.random() * 6
      });
    }

    let animFrame;
    function renderParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (document.getElementById('modal-victory')?.classList.contains('active')) {
        animFrame = requestAnimationFrame(renderParticles);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    renderParticles();
  }

  // =========================================================================
  // 13. EVENT LISTENERS & INITIALIZATION
  // =========================================================================

  function setupEventListeners() {
    // Home Screen buttons
    document.getElementById('btn-play-ludo')?.addEventListener('click', () => {
      audio.click();
      showScreen('setup');
    });

    document.getElementById('btn-resume-game')?.addEventListener('click', () => {
      audio.click();
      resumeSavedGame();
    });

    document.getElementById('btn-new-game-home')?.addEventListener('click', () => {
      audio.click();
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      showScreen('setup');
    });

    document.getElementById('btn-home-settings')?.addEventListener('click', () => {
      audio.click();
      showModal('modal-settings');
    });

    // Setup Screen buttons
    document.getElementById('btn-setup-back')?.addEventListener('click', () => {
      audio.click();
      showScreen('home');
    });

    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      audio.click();
      validateAndStartGame();
    });

    // In-game buttons & 3D Dice interaction
    document.getElementById('btn-roll-dice')?.addEventListener('click', () => {
      onRollDiceClicked();
    });

    document.getElementById('dice-3d-scene')?.addEventListener('click', () => {
      onRollDiceClicked();
    });

    document.getElementById('btn-game-menu')?.addEventListener('click', () => {
      audio.click();
      showModal('modal-pause');
    });

    document.getElementById('btn-game-sound-toggle')?.addEventListener('click', () => {
      appSettings.sound = !appSettings.sound;
      audio.soundEnabled = appSettings.sound;
      audio.click();
      saveSettings();
      applySettings();
      showToast(appSettings.sound ? 'Sound On 🔊' : 'Sound Muted 🔇');
    });

    // Pause Modal buttons
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      audio.click();
      hideModal('modal-pause');
    });

    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      audio.click();
      hideModal('modal-pause');
      startNewGameWithConfig(gameState.playerCount, setupConfig.playerTypes, gameState.aiDifficulty);
    });

    document.getElementById('btn-pause-main-menu')?.addEventListener('click', () => {
      audio.click();
      hideModal('modal-pause');
      showScreen('home');
    });

    // Victory Modal buttons
    document.getElementById('btn-victory-play-again')?.addEventListener('click', () => {
      audio.click();
      hideModal('modal-victory');
      startNewGameWithConfig(gameState.playerCount, setupConfig.playerTypes, gameState.aiDifficulty);
    });

    document.getElementById('btn-victory-main-menu')?.addEventListener('click', () => {
      audio.click();
      hideModal('modal-victory');
      showScreen('home');
    });

    // Settings Modal Toggles
    setupSettingToggles();
  }

  function setupSettingToggles() {
    // Sound
    document.querySelectorAll('#setting-sound .toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        appSettings.sound = (btn.dataset.val === 'on');
        audio.click();
        saveSettings();
        applySettings();
      });
    });

    // Music
    document.querySelectorAll('#setting-music .toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        appSettings.music = (btn.dataset.val === 'on');
        audio.click();
        saveSettings();
        applySettings();
      });
    });

    // Animations
    document.querySelectorAll('#setting-anim .toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        appSettings.animations = (btn.dataset.val === 'on');
        audio.click();
        saveSettings();
        applySettings();
      });
    });

    // Theme
    document.querySelectorAll('#setting-theme .toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        appSettings.theme = btn.dataset.val;
        audio.click();
        saveSettings();
        applySettings();
      });
    });

    // Modal Close
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.click();
        const targetModal = btn.closest('.modal-backdrop');
        if (targetModal) targetModal.classList.remove('active');
      });
    });
  }

  // Window resize handler for canvas & board alignment
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });

  // App bootstrap
  window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initSetupScreen();
    setupEventListeners();
    showScreen('home');
  });

})();
