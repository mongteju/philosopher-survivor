import { TIMELINE, EVOLUTION_STAGES } from './db.js';
import { sfx } from './audio.js';
import { initRankingSystem } from './game/ranking.js';
import {
  gameUpdate,
  handleWeaponTriggers,
  getNearestEnemy,
  fireWeapon,
  handleCombatCollisions,
  dealDamageToEnemy
} from './game/update.js';
import { gameDraw, drawStageBackground } from './game/draw.js';

// Polyfill roundRect to avoid silent failures or canvas freezes on older/incompatible browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'undefined') r = 0;
    if (typeof r === 'number') {
      r = { tl: r, tr: r, br: r, bl: r };
    } else if (Array.isArray(r)) {
      r = { tl: r[0] || 0, tr: r[1] || 0, br: r[2] || 0, bl: r[3] || 0 };
    } else {
      r = {
        tl: r.tl || 0,
        tr: r.tr || 0,
        br: r.br || 0,
        bl: r.bl || 0
      };
    }
    const maxR = Math.min(w / 2, h / 2);
    const tl = Math.min(maxR, r.tl);
    const tr = Math.min(maxR, r.tr);
    const br = Math.min(maxR, r.br);
    const bl = Math.min(maxR, r.bl);

    this.beginPath();
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.arcTo(x + w, y, x + w, y + h, tr);
    this.lineTo(x + w, y + h - br);
    this.arcTo(x + w, y + h, x, y + h, br);
    this.lineTo(x + bl, y + h);
    this.arcTo(x, y + h, x, y, bl);
    this.lineTo(x, y + tl);
    this.arcTo(x, y, x + w, y, tl);
    this.closePath();
    return this;
  };
}

// ─── 각성 확인 인게임 모달 헬퍼 ─────────────────────────────────────────
window.showAwakeningConfirm = function(skillName, onConfirm) {
  const modal = document.getElementById('awakening-confirm-modal');
  const skillNameEl = document.getElementById('awakening-modal-skill-name');
  const okBtn = document.getElementById('awakening-confirm-ok');
  const cancelBtn = document.getElementById('awakening-confirm-cancel');
  if (!modal || !okBtn || !cancelBtn) {
    if (window.confirm('이 스킬을 각성하시겠습니까?')) onConfirm();
    return;
  }
  if (skillNameEl) skillNameEl.textContent = `「${skillName}」을(를) 각성합니다`;

  // 중복 리스너 방지: 버튼 교체
  const newOk = okBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  function closeModal() { modal.style.display = 'none'; }

  newOk.addEventListener('click', () => { closeModal(); onConfirm(); });
  newCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', function bgClick(e) {
    if (e.target === modal) { closeModal(); modal.removeEventListener('click', bgClick); }
  });

  modal.style.display = 'flex';
};

import {
  gameEvents,
  updatePauseKeyboardSelection,
  updateMenuKeyboardSelection,
  updateTutorialKeyboardSelection,
  updateKeyboardCardSelection
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
  triggerEnding,
  _applyAuraUpgrade,
  _applyAuraChange,
  _updateAuraChoiceSelection,
  triggerNietzscheQuiz,
  renderNietzscheQuizQuestion,
  updateNietzscheQuizSelection,
  selectNietzscheQuizOption,
  endNietzscheQuiz,
  applyUniqueHitAction,
  retryCurrentStageOrBoss
} from './game/mechanics.js';

// ─── GAME CLASS ──────────────────────────────────────────────────────
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Also listen to visualViewport resize (mobile browser address bar hide/show)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
    }


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

    this.activeIdols = new Map();
    this.medievalDarkness = false;
    this.kantRule = null; this.kantTimer = 0;
    this.existentialWords = [];
    this.doubtGlassTimer = 0;
    this.ataraxiaZone = null; this.ataraxiaTimer = 0;
    this.bossFightStartTime = 0; this.lastBossKillTime = 0;
    this.finalBossKillTime = 0;
    this.magnetTimer = 0;
    this.frostTrails = [];
    this.windVortexes = [];
    this.firePuddles = [];
    this.chainLightnings = [];

    // BGM
    this.bgm = new Audio('music1.mp3');
    this.bgm.loop = true; this.bgm.volume = 0.35;
    this.bgmMuted = false; this.sfxMuted = false;
    this.bounds = 10000;
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

    this.activeAura = null; this.activeAuraLevel = 0;
    this._gachaSpun = false; this._gachaPendingTier = 1;
    this._gachaTierNames = []; this._gachaTierDescs = []; this._gachaTierColors = [];
    this._gachaAuraIcons = []; this._gachaStatusText = '';

    this.scroll = 0;
    this.usedDebugCheat = false;
    window.gameInstance = this;

    // ─── POWERFUL DEBUGGER SYSTEM ──────────────────────────────────────
    window.gameDebug = {
      instance: this,
      status: () => {
        console.table({
          "isPlaying": this.isPlaying,
          "isPaused": this.isPaused,
          "stageIndex": this.stageIndex,
          "stageName": this.stage ? this.stage.name : 'Unknown',
          "playerLevel": this.player ? this.player.level : 'N/A',
          "playerHp": this.player ? `${this.player.hp}/${this.player.maxHp}` : 'N/A',
          "playerPos": this.player ? `(${Math.round(this.player.x)}, ${Math.round(this.player.y)})` : 'N/A',
          "cameraPos": `(${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`,
          "enemiesCount": this.enemies.length,
          "currentBoss": this.currentBoss ? this.currentBoss.name : 'None',
          "gimmickActive": this.gimmickActive,
          "gimmickTimer": this.gimmickTimer,
          "gimmickInstruction": this.gimmickInstruction,
          "lastError": window.gameDebug.lastError || "None"
        });
      },
      resume: () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        console.log("[Debug] Game forced to play! Loop state reset.");
        const alertBox = document.getElementById('debug-visual-alert');
        if (alertBox) alertBox.style.display = 'none';
      },
      skipStage: () => {
        console.log("[Debug] Skipping current stage...");
        this.usedDebugCheat = true;
        if (this.currentBoss) this.currentBoss.hp = 0;
        else this.eraSurvivalTime = 60;
      },
      killBoss: () => {
        this.usedDebugCheat = true;
        if (this.currentBoss) {
          if (this.stageIndex === 5 && !this.currentBoss.dragonActive) {
            this.currentBoss.hp = this.currentBoss.maxHp * 0.5;
            console.log("[Debug] Stage 6 boss HP dropped to 50% for quiz transition.");
          } else {
            this.currentBoss.hp = 0;
            console.log("[Debug] Boss instantly killed.");
          }
        } else {
          console.log("[Debug] No active boss to kill.");
        }
      },
      heal: () => {
        this.usedDebugCheat = true;
        if (this.player) {
          this.player.hp = this.player.maxHp;
          console.log("[Debug] Player healed to full.");
        }
      },
      spawnBoss: () => {
        this.usedDebugCheat = true;
        const input = prompt("몇 번째 보스를 소환하시겠습니까? (1~6)\n1: 소피스트\n2: 아파테이아 수호자\n3: 교조주의의 망령\n4: 편견의 거인\n5: 도덕의 심판관(정언명령)\n6: 허무주의의 그림자");
        const idx = parseInt(input);
        if (!isNaN(idx) && idx >= 1 && idx <= 6) {
          this.stageIndex = idx - 1;
          this.stage = TIMELINE[this.stageIndex];
          this.eraSurvivalTime = 60;
          
          // Clear all current entities and visual states
          this.enemies = []; 
          this.bossBullets = []; 
          this.warningZones = [];
          this.gridLines = []; 
          this.candlesticks = []; 
          this.nietzcheRelics = [];
          this.activeIdols.clear();
          this.medievalDarkness = false; 
          this.kantRule = null;
          this.kantDutyLine = null;
          this.ataraxiaZone = null;
          this.nietzscheArenaActive = false;
          this.nietzscheArenaCenter = null;
          this.nietzscheSafeZone = null;
          
          // Align player evolution styling
          if (this.player) {
            this.player.evolutionIndex = Math.min(this.stageIndex, EVOLUTION_STAGES[this.player.lineage].length - 1);
            this.addDamageText(this.player.x, this.player.y - 80, `✨ ${EVOLUTION_STAGES[this.player.lineage][this.player.evolutionIndex].title} 전직!`, '#ffd200', 22);
          }
          
          this.currentBoss = null;
          this.spawnBossImmediate();
          this.restoreHUD();
          console.log(`[Debug] Teleported to stage ${idx} and spawned boss.`);
        }
      }
    };

    // Global Error Catcher to expose silent JavaScript exceptions
    window.onerror = function(message, source, lineno, colno, error) {
      const errStr = `${message} at ${source}:${lineno}:${colno}`;
      window.gameDebug.lastError = errStr;
      console.error("[Silent Intercept Error]:", errStr, error);
      
      let alertBox = document.getElementById('debug-visual-alert');
      if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'debug-visual-alert';
        alertBox.style.cssText = 'position:fixed; bottom:20px; left:20px; background:rgba(255, 71, 87, 0.95); border:2px solid #ff6b81; border-radius:12px; color:#fff; padding:15px; font-family:sans-serif; z-index:999999; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-size:12px; word-break:break-all;';
        document.body.appendChild(alertBox);
      }
      alertBox.style.display = 'block';
      alertBox.innerHTML = `<strong>⚠️ 런타임 에러 감지 (Debug Alert)</strong><br><span style="color:#ffeaa7;">${errStr}</span><br><br><small>F12 콘솔창에서 window.gameDebug.status()를 입력해보십시오.</small>`;
      return false;
    };

    window.onunhandledrejection = function(event) {
      const errStr = `Unhandled promise rejection: ${event.reason}`;
      window.gameDebug.lastError = errStr;
      console.error("[Silent Intercept Promise]:", errStr);
      return false;
    };

    // Heartbeat loop checker
    let lastPulseTime = Date.now();
    this._heartbeatPulse = 0;
    this._lastCheckedPulse = 0;
    
    setInterval(() => {
      const now = Date.now();
      lastPulseTime = now;
      
      const curPulse = this._heartbeatPulse;
      if (this.isPlaying && this._lastCheckedPulse === curPulse) {
        console.warn("[Debug Heartbeat] WARNING: Game update loop is FROZEN! Automatically resuming...");
        
        // Show auto-resume notice briefly
        let alertBox = document.getElementById('debug-visual-alert');
        if (!alertBox) {
          alertBox = document.createElement('div');
          alertBox.id = 'debug-visual-alert';
          alertBox.style.cssText = 'position:fixed; bottom:20px; left:20px; background:rgba(46, 213, 115, 0.95); border:2px solid #2ed573; border-radius:12px; color:#fff; padding:15px; font-family:sans-serif; z-index:999999; max-width:400px; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-size:12px; transition: opacity 0.5s;';
          document.body.appendChild(alertBox);
        }
        alertBox.style.display = 'block';
        alertBox.style.opacity = '1';
        alertBox.innerHTML = `<strong>🔄 루프 자동 복구 완료!</strong><br><span style="color:#f1f2f6;">멈춤 현상이 감지되어 자동으로 루프를 재시작했습니다.</span>`;
        
        setTimeout(() => { alertBox.style.opacity = '0'; }, 2000);
        
        if (window.gameDebug && typeof window.gameDebug.resume === 'function') {
           window.gameDebug.resume();
        }
      }
      this._lastCheckedPulse = curPulse;
    }, 3000);

    // Custom Stage pattern helpers
    this.candlesticks = [];
    this.nietzcheRelics = [];
    this.nietzscheArenaActive = false;
    this.nietzscheArenaCenter = null;
    this.nietzscheArenaRadius = 450;
    this.nietzscheSafeZone = null;
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
      this.gimmickActive = false;
      this.gimmickTimer = 0;
      this.player.recalculateStats();
      this.showBossTooltip("👑 초인 각성! 신은 죽었다! 당신 자신의 가치를 창조하며 허무주의를 심판하십시오!");
      this.addDamageText(this.player.x, this.player.y - 80, "👑 Übermensch 초인 각성!", "#ffd200", 26, true);
      this.spawnParticles(this.player.x, this.player.y, '#ffd200', 35, 15, -4);
      if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
    };

    this.initEvents();
    initRankingSystem(this);
    this.resetFocus();
    
    // Highlight title screen start button by default on load
    const titleBtn = document.getElementById('title-start-btn');
    if (titleBtn) {
      titleBtn.classList.add('keyboard-selected');
    }
  }

  resize() {
    // Use visualViewport when available (accounts for mobile browser chrome: address bar, nav bar)
    const vv = window.visualViewport;
    const W = vv ? vv.width : window.innerWidth;
    const H = vv ? vv.height : window.innerHeight;
    this.canvas.width = W;
    this.canvas.height = H;
    // Store camera zoom: zoom out more on narrow screens for wider view
    const isMobile = W < 768;
    this.cameraZoom = isMobile ? 0.72 : 1.0;
  }


  resetFocus() {
    this.keys = {};
    window.focus();
    if (document.activeElement && document.activeElement !== document.body) {
      try { document.activeElement.blur(); } catch (err) {}
    }
  }

  loop(timestamp) {
    this._heartbeatPulse = (this._heartbeatPulse || 0) + 1;
    
    // Abort duplicate ticks in the exact same animation frame to prevent loops from terminating permanently
    if (this._lastLoopFrameId && this._lastLoopFrameId === timestamp) {
      return;
    }
    this._lastLoopFrameId = timestamp;

    let dt = timestamp - this.lastTime;
    if (isNaN(dt) || dt <= 0) dt = 16.666;
    if (dt > 100) dt = 16.666;
    this.lastTime = timestamp;

    if (this.isPlaying) {
      this.update(dt);
      this.draw();
    } else {
      // While paused or in modal, only animate particles and damage texts
      if (this.particles) {
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);
      }
      if (this.damageTexts) {
        this.damageTexts.forEach(d => d.update(dt));
        this.damageTexts = this.damageTexts.filter(d => d.life > 0);
      }
      this.draw();
    }
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
  _applyAuraUpgrade() { _applyAuraUpgrade.call(this); }
  _applyAuraChange() { _applyAuraChange.call(this); }
  _updateAuraChoiceSelection() { _updateAuraChoiceSelection.call(this); }
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
  triggerNietzscheQuiz(boss) { triggerNietzscheQuiz.call(this, boss); }
  renderNietzscheQuizQuestion() { renderNietzscheQuizQuestion.call(this); }
  updateNietzscheQuizSelection() { updateNietzscheQuizSelection.call(this); }
  selectNietzscheQuizOption() { selectNietzscheQuizOption.call(this); }
  endNietzscheQuiz() { endNietzscheQuiz.call(this); }
  applyUniqueHitAction(stageIndex) { applyUniqueHitAction.call(this, stageIndex); }
  retryCurrentStageOrBoss() { retryCurrentStageOrBoss.call(this); }
}

// ─── BOOT ────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
  });
} else {
  window.gameInstance = new Game();
}
