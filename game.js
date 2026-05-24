import { TIMELINE } from './db.js';
import { sfx } from './audio.js';
import {
  gameUpdate,
  handleWeaponTriggers,
  getNearestEnemy,
  fireWeapon,
  handleCombatCollisions,
  dealDamageToEnemy
} from './game/update.js';
import { gameDraw, drawStageBackground } from './game/draw.js';
import {
  gameEvents,
  updatePauseKeyboardSelection,
  updateMenuKeyboardSelection,
  updateTutorialKeyboardSelection,
  updateKeyboardCardSelection,
  updateExamKeyboardSelection
} from './game/events.js';
import {
  selectLineage,
  showMenuScreen,
  startGame,
  acceptTutorial,
  spawnInitialEnemies,
  spawnRandomMob,
  spawnBossImmediate,
  onBossDefeated,
  spawnAuraGacha,
  triggerGachaSpin,
  _showGachaResult,
  applyAuraStats,
  resumeFromGacha,
  triggerEpicEvolutionUpgrade,
  triggerLevelUp,
  applyCardSelection,
  closeLevelUp,
  showLearnedSkillsPopup,
  togglePause,
  updatePauseStatusPanel,
  addDamageText,
  spawnParticles,
  spawnXpFrags,
  spawnExistentialWords,
  gameOver,
  triggerEnding
} from './game/mechanics.js';

// ─── GAME CLASS ──────────────────────────────────────────────────────
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.player = null;
    this.enemies = []; this.projectiles = []; this.particles = [];
    this.damageTexts = []; this.xpFrags = []; this.magnetItems = [];
    this.bossBullets = []; this.warningZones = [];
    this.iceFloors = []; this.iceRings = [];

    this.camera = { x: 0, y: 0 };
    this.keys = {};
    this.joystick = { active: false, angle: 0, strength: 0, startX: 0, startY: 0, curX: 0, curY: 0 };

    this.isPlaying = false; this.isPaused = false;
    this.lastTime = 0; this.timeScale = 1;
    this.realSurvivalTimer = 0; this.cumulativeSurvivalTime = 0;
    this.eraSurvivalTime = 0;

    this.stageIndex = 0; this.stage = TIMELINE[0];
    this.currentBoss = null; this.activeAuraTier = 0;
    this.weaponTimers = {}; this.orbitAngle = 0;
    this.screenShake = 0;
    this.levelChoices = []; this.cardSelectedIndex = 0;
    this.menuSelectedIndex = -1; this.tutorialSelectedIndex = 0;
    this.pauseSelectedIndex = 0;
    this.examScore = 0;
    this.currentQuestionIndex = 1;
    this.examSelectedIndex = 0;

    this.activeIdols = new Map();
    this.medievalDarkness = false;
    this.kantRule = null; this.kantTimer = 0;
    this.existentialWords = [];
    this.doubtGlassTimer = 0;
    this.ataraxiaZone = null; this.ataraxiaTimer = 0;
    this.bossFightStartTime = 0; this.lastBossKillTime = 0;
    this.finalBossKillTime = 0;
    this.magnetTimer = 0;

    // BGM
    this.bgm = new Audio('music1.mp3');
    this.bgm.loop = true; this.bgm.volume = 0.35;
    this.bgmMuted = false; this.sfxMuted = false;
    this.bounds = 5000;
    this.bgm.play().catch(() => {});

    // Start BGM on first interaction (fail-safe for browser autoplay policies)
    const playBgmOnce = () => {
      if (this.bgm && this.bgm.paused && !this.bgmMuted) {
        this.bgm.play().catch(() => {});
      }
      window.removeEventListener('click', playBgmOnce);
      window.removeEventListener('keydown', playBgmOnce);
    };
    window.addEventListener('click', playBgmOnce);
    window.addEventListener('keydown', playBgmOnce);

    this._gachaSpun = false; this._gachaPendingTier = 1;
    this._gachaTierNames = []; this._gachaTierDescs = []; this._gachaTierColors = [];
    this._gachaAuraIcons = []; this._gachaStatusText = '';

    this.scroll = 0;
    window.gameInstance = this;

    // Custom Stage pattern helpers
    this.candlesticks = [];
    this.nietzcheRelics = [];
    this.gridLines = [];
    this.uberMenschMode = false;
    this.prejudiceWave = 0;
    this.playerHistory = [];

    this.showBossTooltip = function(text) {
      const banner = document.getElementById('boss-tooltip');
      if (banner) {
        if (text) {
          banner.textContent = text;
          banner.classList.add('active');
        } else {
          banner.classList.remove('active');
        }
      }
    };

    this.restoreHUD = function() {
      const totalSecs = Math.floor(this.realSurvivalTimer);
      const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
      const s = String(totalSecs % 60).padStart(2, '0');
      const timerEl = document.getElementById('hud-timer');
      if (timerEl) timerEl.textContent = `${m}:${s}`;
      const lvlEl = document.getElementById('hud-level');
      if (lvlEl) lvlEl.textContent = this.player.level;
      const xpEl = document.getElementById('hud-xp-fill');
      if (xpEl) xpEl.style.width = `${(this.player.xp / this.player.maxXp) * 100}%`;
    };

    this.triggerUbermenschMode = function() {
      this.uberMenschMode = true;
      this.uberMenschTimer = 10000;
      if (this.currentBoss) {
        this.currentBoss.isPatternActive = false;
        this.currentBoss.isStunned = true;
        this.currentBoss.stunTimer = 10000;
      }
      this.player.recalculateStats();
      this.showBossTooltip("👑 초인 각성! 신은 죽었다! 당신 자신의 가치를 창조하며 허무주의를 심판하십시오!");
      this.addDamageText(this.player.x, this.player.y - 80, "👑 Übermensch 초인 각성!", "#ffd200", 26, true);
      this.spawnParticles(this.player.x, this.player.y, '#ffd200', 35, 15, -4);
      if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
    };

    this.initEvents();
    this.resetFocus();
    
    // Highlight title screen start button by default on load
    const titleBtn = document.getElementById('title-start-btn');
    if (titleBtn) {
      titleBtn.classList.add('keyboard-selected');
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  resetFocus() {
    this.keys = {};
    window.focus();
    if (document.activeElement && document.activeElement !== document.body) {
      try { document.activeElement.blur(); } catch (err) {}
    }
  }

  loop(timestamp) {
    if (!this.isPlaying) return;
    let dt = timestamp - this.lastTime;
    if (dt > 100) dt = 16;
    this.lastTime = timestamp;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) { gameUpdate.call(this, dt); }
  handleWeaponTriggers(dt) { handleWeaponTriggers.call(this, dt); }
  getNearestEnemy() { return getNearestEnemy.call(this); }
  fireWeapon(id, lvl, stats, awakening) { fireWeapon.call(this, id, lvl, stats, awakening); }
  handleCombatCollisions() { handleCombatCollisions.call(this); }
  dealDamageToEnemy(e, dmg, proj) { dealDamageToEnemy.call(this, e, dmg, proj); }
  draw() { gameDraw.call(this); }
  drawStageBackground(cx, cy, w, h) { drawStageBackground.call(this, cx, cy, w, h); }
  initEvents() { gameEvents.call(this); }

  updatePauseKeyboardSelection(btns) { updatePauseKeyboardSelection.call(this, btns); }
  updateMenuKeyboardSelection() { updateMenuKeyboardSelection.call(this); }
  updateTutorialKeyboardSelection() { updateTutorialKeyboardSelection.call(this); }
  updateKeyboardCardSelection() { updateKeyboardCardSelection.call(this); }
  updateExamKeyboardSelection() { updateExamKeyboardSelection.call(this); }

  selectLineage(lineage) { selectLineage.call(this, lineage); }
  showMenuScreen() { showMenuScreen.call(this); }
  startGame() { startGame.call(this); }
  acceptTutorial(accepted) { acceptTutorial.call(this, accepted); }
  spawnInitialEnemies() { spawnInitialEnemies.call(this); }
  spawnRandomMob() { spawnRandomMob.call(this); }
  spawnBossImmediate() { spawnBossImmediate.call(this); }
  onBossDefeated(boss) { onBossDefeated.call(this, boss); }
  spawnAuraGacha() { spawnAuraGacha.call(this); }
  triggerGachaSpin() { triggerGachaSpin.call(this); }
  _showGachaResult(rolledTier) { _showGachaResult.call(this, rolledTier); }
  applyAuraStats() { applyAuraStats.call(this); }
  resumeFromGacha() { resumeFromGacha.call(this); }
  triggerEpicEvolutionUpgrade() { triggerEpicEvolutionUpgrade.call(this); }
  triggerLevelUp() { triggerLevelUp.call(this); }
  applyCardSelection(upgrade, isAwakening) { applyCardSelection.call(this, upgrade, isAwakening); }
  closeLevelUp() { closeLevelUp.call(this); }
  showLearnedSkillsPopup() { showLearnedSkillsPopup.call(this); }
  togglePause() { togglePause.call(this); }
  updatePauseStatusPanel() { updatePauseStatusPanel.call(this); }
  addDamageText(x, y, val, color, size, isCrit) { addDamageText.call(this, x, y, val, color, size, isCrit); }
  spawnParticles(x, y, color, count, speed, vy) { spawnParticles.call(this, x, y, color, count, speed, vy); }
  spawnXpFrags(x, y, total) { spawnXpFrags.call(this, x, y, total); }
  spawnExistentialWords() { spawnExistentialWords.call(this); }
  gameOver() { gameOver.call(this); }
  triggerEnding() { triggerEnding.call(this); }
}

// ─── BOOT ────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
  });
} else {
  window.gameInstance = new Game();
}
