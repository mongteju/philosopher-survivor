import { PHILOSOPHY_DB, EVOLUTION_STAGES, TIMELINE, AURA_DB } from './db.js';
import { sfx } from './audio.js';
import {
  BossBullet,
  WarningZone,
  Particle,
  DamageText,
  XPFrag,
  MagnetItem,
  Enemy,
  Candlestick,
  RhythmicGridLine,
  NietzscheRelic,
  Boss,
  Idol,
  Projectile,
  Player
} from './entities.js';
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

  selectLineage(lineage) {
    if (!this.player) this.player = new Player(lineage);
    else this.player.lineage = lineage;
    document.getElementById('start-game-btn').disabled = false;
    document.getElementById('start-game-btn').textContent = '게임 시작!';
    const cards = document.querySelectorAll('.lineage-card');
    cards.forEach(c => c.classList.remove('keyboard-selected'));
    const sel = document.getElementById(lineage === 'idealism' ? 'card-idealism' : 'card-empiricism');
    if (sel) sel.classList.add('keyboard-selected');
  }
  showMenuScreen() {
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen) titleScreen.classList.remove('active');
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) {
      menuScreen.classList.add('active');
      this.menuSelectedIndex = 0;
      this.selectLineage('idealism');
      this.updateMenuKeyboardSelection();
    }
    if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
  }

  startGame() {
    if (!this.player || !this.player.lineage) return;
    const firstSkillId = this.player.lineage === 'idealism' ? 'fire_projectile' : 'ice_projectile';
    this.player.activeSkills[firstSkillId] = 1;
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('tutorial-screen').classList.add('active');
    this.tutorialSelectedIndex = 0;
    this.updateTutorialKeyboardSelection();
  }

  acceptTutorial(accepted) {
    if (!accepted) {
      this.tutorialRefusalCount = (this.tutorialRefusalCount || 0) + 1;
      const dialogues = [
        "자네가 모든 것을 알고 있다면, 이미 이 미궁에 들어설 필요도 없었을 터인데... 정말로 다 알고 있단 말인가?",
        "자신의 무지를 모르는 것이야말로 가장 큰 무지라네. 다시 한번 생각해보게. 진정 아는가?",
        "허허, 자만심이 하늘을 찌르는군! 진정한 지혜는 아무것도 모른다는 것을 아는 것에서 시작하네.",
        "진정 '아니요'를 고집할 셈인가? 배움이 없는 지식은 위험한 법이라네.",
        "나는 단 한 가지만을 안다네. 그것은 내가 아무것도 모른다는 사실이지. 자네도 이를 인정하게!",
        "진리의 길은 오직 무지를 인정하는 자에게만 열린다네. 다시 대답해보게!"
      ];
      const socratesDialogue = document.getElementById('socrates-dialogue');
      if (socratesDialogue) {
        socratesDialogue.textContent = dialogues[(this.tutorialRefusalCount - 1) % dialogues.length];
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      }
      this.player.hp = Math.max(1, this.player.hp - 5);
      this.tutorialSelectedIndex = 0;
      this.updateTutorialKeyboardSelection();
      return;
    }

    document.getElementById('tutorial-screen').classList.remove('active');
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('hud').style.flexDirection = 'column';
    document.getElementById('hud').style.alignItems = 'center';
    this.resetFocus();
    this.spawnInitialEnemies();
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.bgm.play().catch(() => {});
    requestAnimationFrame(t => this.loop(t));
  }

  spawnInitialEnemies() {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 400 + Math.random() * 200;
      this.enemies.push(new Enemy(
        this.player.x + Math.cos(angle) * dist,
        this.player.y + Math.sin(angle) * dist,
        this.player.level, this.stage.mobType));
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

  update(dt) {
    dt *= this.timeScale;
    this.realSurvivalTimer += dt / 1000;
    this.cumulativeSurvivalTime += dt / 1000;
    if (!this.currentBoss) this.eraSurvivalTime += dt / 1000;

    // Ataraxia safe zone BGM volume drop
    if (this.ataraxiaZone) {
      const dZone = Math.hypot(this.player.x - this.ataraxiaZone.x, this.player.y - this.ataraxiaZone.y);
      if (dZone < this.ataraxiaZone.radius) {
        this.bgm.volume = 0;
      } else {
        this.bgm.volume = this.bgmMuted ? 0 : 0.4;
      }
    }

    // Update HUD timer
    const totalSecs = Math.floor(this.realSurvivalTimer);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${m}:${s}`;
    const stageEl = document.getElementById('hud-stage');
    if (stageEl && this.stage) stageEl.textContent = this.stage.name;
    document.getElementById('hud-level').textContent = this.player.level;
    document.getElementById('hud-xp-fill').style.width = `${(this.player.xp / this.player.maxXp) * 100}%`;

    // Boss spawn at 60s per era
    if (this.eraSurvivalTime >= 60 && !this.currentBoss) {
      this.eraSurvivalTime = 60;
      this.spawnBossImmediate();
    }

    // Enemy spawn
    if (!this.currentBoss) {
      const normalEnemyCount = this.enemies.filter(e => e.type !== 'boss' && !e.isIdol).length;
      if (normalEnemyCount < 50 + this.player.level * 3) {
        if (Math.random() < 0.08 * (dt * 0.06)) {
          this.spawnRandomMob();
        }
      }
    }

    this.player.update(dt, this.keys, this.joystick.angle, this.joystick.strength);
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.orbitAngle += 0.05 * dt * 0.06;
    this.scroll += dt * 0.05;

    // Magnet timer
    this.magnetTimer += dt;
    if (this.magnetTimer >= 25000) {
      this.magnetTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 250 + Math.random() * 200;
      this.magnetItems.push(new MagnetItem(this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist));
    }

    // Kant rule timer
    if (this.kantRule && this.kantTimer > 0) {
      this.kantTimer -= dt;
      if (!this.kantRule.check(this.player)) {
        this.player.takeDamage(40, this);
        game_addDamageText_local(this, this.player.x, this.player.y - 60, '규율 위반!', '#ffd200', 18);
        this.kantRule = null;
      }
      if (this.kantTimer <= 0) this.kantRule = null;
    }

    // Update enemies (boss first)
    this.enemies.forEach(e => {
      if (e.type === 'boss') e.update(dt, this.player, this);
      else if (e.isIdol) e.update(dt, this.player, this);
      else e.update(dt, this.player);
    });

    // Update boss bullets / warning zones
    this.bossBullets.forEach(b => b.update(dt, this.player));
    this.bossBullets = this.bossBullets.filter(b => b.life > 0);
    this.warningZones.forEach(w => w.update(dt, this));
    this.warningZones = this.warningZones.filter(w => w.life > 0);

    // Projectiles
    this.projectiles.forEach(p => p.update(dt, this));
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    // Particles / damage texts
    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => p.life > 0);
    this.damageTexts.forEach(t => t.update(dt));
    this.damageTexts = this.damageTexts.filter(t => t.life > 0);

    // Update candlesticks
    if (this.candlesticks) {
      this.candlesticks.forEach(c => c.update(this.player, this));
    }

    // Update Nietzsche relics
    if (this.nietzcheRelics) {
      this.nietzcheRelics.forEach(r => r.update(this.player, this));
    }

    // Update grid lines
    if (this.gridLines) {
      this.gridLines.forEach(l => l.update(dt, this));
      this.gridLines = this.gridLines.filter(l => l.life > 0);
    }

    // Player position history for Stage 4 glitch trails
    if (this.stageIndex === 3 && this.currentBoss) {
      if (!this.playerHistory) this.playerHistory = [];
      this.playerHistory.push({ x: this.player.x, y: this.player.y });
      if (this.playerHistory.length > 30) this.playerHistory.shift();
    }

    // Wave 2 Market Idol HUD scrambling
    if (this.currentBoss && this.prejudiceWave === 2) {
      const timerEl = document.getElementById('hud-timer');
      if (timerEl) timerEl.textContent = "⚙️" + Math.floor(Math.random()*99) + ":" + Math.floor(Math.random()*99);
      const lvlEl = document.getElementById('hud-level');
      if (lvlEl) lvlEl.textContent = String.fromCharCode(33 + Math.floor(Math.random()*90));
      const xpEl = document.getElementById('hud-xp-fill');
      if (xpEl) xpEl.style.width = `${Math.random()*100}%`;
    }

    // Ubermensch timer
    if (this.uberMenschMode) {
      this.uberMenschTimer -= dt;
      if (Math.random() < 0.2) {
        this.spawnParticles(this.player.x, this.player.y, '#ffd200', 3, 6, -3);
      }
      if (this.uberMenschTimer <= 0) {
        this.uberMenschMode = false;
        this.player.recalculateStats();
        if (this.currentBoss && this.currentBoss.hp > 0) {
          this.currentBoss.isPatternActive = true;
          this.currentBoss.isStunned = false;
          this.spawnNietzcheRelics();
          this.showBossTooltip("🦅 니체: 허무주의의 잿빛 심연 속에서, 자유와 책임의 유물(🔥)을 다시 모으십시오!");
        } else {
          this.showBossTooltip(null);
        }
      }
    }

    // XP frags
    this.xpFrags.forEach(f => f.update(dt, this.player));
    // Pickup
    this.xpFrags = this.xpFrags.filter(f => {
      if (Math.hypot(f.x - this.player.x, f.y - this.player.y) < 20) {
        this.player.gainXp(f.val, this);
        return false;
      }
      return f.hp > 0;
    });

    // Magnet items
    this.magnetItems = this.magnetItems.filter(m => {
      m.update(dt);
      if (Math.hypot(m.x - this.player.x, m.y - this.player.y) < 30) {
        this.xpFrags.forEach(f => f.magnet = true);
        this.addDamageText(this.player.x, this.player.y - 60, '자석 활성화!', '#f368e0', 18);
        return false;
      }
      return m.life > 0;
    });

    // Ice floors
    this.iceFloors = this.iceFloors.filter(f => {
      f.life -= dt;
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - f.x, e.y - f.y) < f.size) {
          e.slowMul = 0.5;
          e.slowTimer = 100; // 빙판 위 매 프레임 감속 연장
          if (!e.iceFloorDmgTimer || e.iceFloorDmgTimer <= 0) {
            this.dealDamageToEnemy(e, f.dmg);
            e.iceFloorDmgTimer = 1000;
          }
        }
      });
      return f.life > 0;
    });

    // Weapon triggers
    this.handleWeaponTriggers(dt);

    // Combat collisions
    this.handleCombatCollisions();

    // Check idols all dead → spawn boss phase2
    if (this.activeIdols.size > 0) {
      let allDead = true;
      this.activeIdols.forEach((idol) => { if (idol.hp > 0) allDead = false; });
      if (allDead) {
        this.activeIdols.clear();
        if (this.currentBoss && this.currentBoss.hp > 0) {
          this.currentBoss.hp *= 0.5;
          this.addDamageText(this.currentBoss.x, this.currentBoss.y - 60, '우상 파괴! 보스 약화!', '#ffd200', 20);
        }
      }
    }

    // Remove dead enemies & handle drops
    this.enemies = this.enemies.filter(e => {
      if (e.hp <= 0) {
        if (e.type === 'boss') {
          if (e.isClone) {
            this.spawnXpFrags(e.x, e.y, 10);
            this.spawnParticles(e.x, e.y, '#e84393', 8, 10, -3);
            if (e.parentBoss) {
              e.parentBoss.clonesList = e.parentBoss.clonesList.filter(c => c !== e);
              if (e.parentBoss.clonesList.length === 0) {
                e.parentBoss.isPatternActive = false;
                e.parentBoss.isStunned = true;
                e.parentBoss.stunTimer = 6000;
                this.showBossTooltip("🛡️ 궤변 극복! 소피스트가 부끄러움에 빠져 방어력이 극도로 감소했습니다!");
                this.addDamageText(e.parentBoss.x, e.parentBoss.y - 70, "✨ 논박 완료! 보스 그로기!", "#2ed573", 24);
              }
            }
          } else {
            this.onBossDefeated(e);
          }

        } else if (e.isIdol) {
          this.activeIdols.delete(e.idolType);
          this.spawnXpFrags(e.x, e.y, 8);
        } else {
          this.spawnXpFrags(e.x, e.y, e.xpVal);
          this.spawnParticles(e.x, e.y, e.color, 5, 8, -2);
        }
        return false;
      }
      return true;
    });
  }

  handleWeaponTriggers(dt) {
    const active = this.player.activeSkills;
    Object.keys(active).forEach(id => {
      const lvl = active[id];
      if (!lvl) return;
      if (!this.weaponTimers[id]) this.weaponTimers[id] = 0;
      this.weaponTimers[id] += dt;
      const linCards = PHILOSOPHY_DB[this.player.lineage];
      const wData = linCards.find(w => w.id === id);
      if (!wData || wData.type !== 'weapon') return;
      const stats = wData.stats[lvl - 1];
      if (!stats) return;
      let cooldown = stats.cd || stats.interval || 2000;
      const awakening = lvl >= wData.maxLevel;
      cooldown *= awakening ? 0.5 : 1;
      cooldown *= (1 - this.player.cooldownReduction - this.player.auraCooldownReduction);
      if (this.weaponTimers[id] >= cooldown) {
        this.weaponTimers[id] = 0;
        this.fireWeapon(id, lvl, stats, awakening);
      }
    });
  }

  getNearestEnemy() {
    let nearest = null, minDist = 99999;
    this.enemies.forEach(e => {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < minDist) { minDist = d; nearest = e; }
    });
    return nearest;
  }

  fireWeapon(id, lvl, stats, awakening) {
    const skillTier = this.player.skillTiers[id] || 'normal';
    const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
    const tierMul = tierMuls[skillTier] || 1.0;

    const sizeM = (awakening ? 1.1 : 1.0) * this.player.areaMultiplier * (1 + (tierMul - 1) * 0.5);
    const dmgM = (awakening ? 1.5 : 1.0) * this.player.dmgMultiplier * tierMul;

    if (id === 'fire_projectile') {
      const target = this.getNearestEnemy();
      const tx = target ? target.x : this.player.x + Math.cos(this.player.faceAngle) * 300;
      const ty = target ? target.y : this.player.y + Math.sin(this.player.faceAngle) * 300;
      const sz = (stats.size || 50) * sizeM;
      const dmg = (stats.dmg || 35) * dmgM;
      this.projectiles.push(new Projectile(this.player.x, this.player.y, tx, ty, 6, sz, dmg, '#ff4757', 'fire_explosion'));
      sfx.playExplosion();
    }

    if (id === 'fire_aura') {
      const radius = (stats.radius || 95) * sizeM;
      const dmg = (stats.dmg || 16) * dmgM;
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < radius) {
          this.dealDamageToEnemy(e, dmg);
          this.spawnParticles(e.x, e.y, '#ff4757', 3, 5, -2);
        }
      });
      this.spawnParticles(this.player.x, this.player.y, '#ff6b35', 6, 8, -3);
    }

    if (id === 'fire_pillar') {
      const count = (stats.count || 1) * (awakening ? 2 : 1);
      const dmg = (stats.dmg || 75) * dmgM;
      for (let i = 0; i < count; i++) {
        const target = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        if (!target) continue;
        const px = target.x + (Math.random() - 0.5) * 40;
        const py = target.y + (Math.random() - 0.5) * 40;
        setTimeout(() => {
          this.dealDamageToEnemy(target, dmg);
          this.spawnParticles(px, py, '#ffd200', 10, 8, -4);
          this.addDamageText(px, py - 30, dmg, '#ffd200', 20, false);
        }, i * 150);
      }
      sfx.playExplosion();
    }

    if (id === 'fire_sword') {
      const count = (stats.count || 3) * (awakening ? 2 : 1);
      const dmg = (stats.dmg || 55) * dmgM;
      const spd = stats.speed || 6;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const p = new Projectile(
          this.player.x, this.player.y,
          this.player.x + Math.cos(angle), this.player.y + Math.sin(angle),
          spd, (20 + (lvl * 5)) * sizeM, dmg, '#ff4757', 'fire_sword');
        p.pierceLeft = 99;
        this.projectiles.push(p);
      }
      sfx.playExplosion();
    }

    if (id === 'ice_projectile') {
      const target = this.getNearestEnemy();
      const tx = target ? target.x : this.player.x + Math.cos(this.player.faceAngle) * 300;
      const ty = target ? target.y : this.player.y + Math.sin(this.player.faceAngle) * 300;
      const dmg = (stats.dmg || 25) * dmgM;
      const sz = (20 + lvl * 6) * sizeM;
      const p = new Projectile(this.player.x, this.player.y, tx, ty, stats.speed || 8, sz, dmg, '#00d2d3', 'ice_pierce');
      p.pierceLeft = awakening ? 999 : (stats.pierce || 2);
      p.slowAmount = (stats.slow || 0.35) * (1 + this.player.slowBonus);
      this.projectiles.push(p);
      sfx.playFreeze();
    }

    if (id === 'ice_floor') {
      const sz = (stats.size || 100) * sizeM;
      this.iceFloors.push({ x: this.player.x, y: this.player.y, size: sz, life: stats.duration || 3500,
        dmg: (stats.dmg || 10) * dmgM });
      this.spawnParticles(this.player.x, this.player.y, '#00d2d3', 8, 6, -2);
      sfx.playFreeze();
    }

    if (id === 'ice_freeze') {
      const radius = (stats.radius || 170) * sizeM;
      const dmg = (stats.dmg || 50) * dmgM;
      this.enemies.forEach(e => {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < radius) {
          e.frozenTime = stats.freezeTime || 2000;
          this.dealDamageToEnemy(e, dmg);
        }
      });
      this.spawnParticles(this.player.x, this.player.y, '#a8e6f0', 12, 10, -3);
      sfx.playFreeze();
    }

    if (id === 'ice_ring') {
      // Handled in draw via orbitAngle
      const count = (stats.count || 1) * (awakening ? 2 : 1);
      const radius = (stats.radius || 65) * sizeM;
      const dmg = (stats.dmg || 30) * dmgM;
      this.enemies.forEach(e => {
        for (let i = 0; i < count; i++) {
          const angle = this.orbitAngle + (Math.PI * 2 / count) * i;
          const ox = this.player.x + Math.cos(angle) * radius;
          const oy = this.player.y + Math.sin(angle) * radius;
          if (Math.hypot(e.x - ox, e.y - oy) < 20) {
            this.dealDamageToEnemy(e, dmg);
          }
        }
      });
    }
  }

  handleCombatCollisions() {
    this.projectiles.forEach(proj => {
      this.enemies.forEach(e => {
        if (proj.hitEnemy.has(e)) return;
        const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
        if (dist < proj.size + e.size) {
          proj.hitEnemy.add(e);
          this.dealDamageToEnemy(e, proj.dmg, proj);
          if (proj.slowAmount && e.frozenTime <= 0) {
            e.slowMul = 1 - proj.slowAmount;
            e.slowTimer = 3000; // 3초 감속
          }
          if (proj.type === 'fire_explosion') {
            const expRadius = proj.size * 1.4;
            this.enemies.forEach(e2 => {
              if (e2 !== e && Math.hypot(e2.x - proj.x, e2.y - proj.y) < expRadius) {
                this.dealDamageToEnemy(e2, proj.dmg * 0.6);
              }
            });
            this.spawnParticles(proj.x, proj.y, '#ff4757', 10, 10, -3);
            proj.life = 0;
          } else if (proj.type !== 'fire_sword' && proj.type !== 'ice_pierce') {
            proj.life = 0;
          } else {
            proj.pierceLeft = (proj.pierceLeft || 1) - 1;
            if (proj.pierceLeft <= 0) proj.life = 0;
          }
        }
      });
    });
  }

  dealDamageToEnemy(e, dmg, proj) {
    if (e.isClone) {
      this.addDamageText(e.x, e.y - e.size - 10, "Miss (궤변)", "#7f8c8d", 14, false);
      return;
    }

    const isCrit = Math.random() < 0.15;
    const finalDmg = Math.floor(dmg * (isCrit ? (1.5 * this.player.critMultiplier) : 1));
    e.hp -= finalDmg;
    this.addDamageText(e.x, e.y - e.size - 10, finalDmg, isCrit ? '#ffd200' : '#fff', isCrit ? 20 : 14, isCrit);
    if (this.player.auraLifesteal > 0) {
      this.player.heal(Math.ceil(finalDmg * this.player.auraLifesteal));
    }
  }

  spawnRandomMob() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 250;
    const ex = this.player.x + Math.cos(angle) * dist;
    const ey = this.player.y + Math.sin(angle) * dist;
    this.enemies.push(new Enemy(ex, ey, this.player.level, this.stage.mobType));
  }

  spawnBossImmediate() {
    // Clear normal enemies
    this.enemies = this.enemies.filter(e => e.type === 'boss');
    this.bossBullets = []; this.warningZones = [];
    this.activeIdols.clear();

    const boss = new Boss(
      this.player.x + 400, this.player.y,
      this.player.level, this.stage.bossName, this.stageIndex
    );
    this.currentBoss = boss;
    this.enemies.push(boss);
    this.bossFightStartTime = this.realSurvivalTimer;
    this.medievalDarkness = false;

    // Stage 3: Spawn Idols
    if (this.stageIndex === 3) {
      const idolTypes = ['cave', 'tribe', 'market', 'theater'];
      idolTypes.forEach((type, i) => {
        const a = (Math.PI * 2 / 4) * i;
        const idol = new Idol(
          this.player.x + Math.cos(a) * 300,
          this.player.y + Math.sin(a) * 300,
          type, boss
        );
        this.activeIdols.set(type, idol);
        this.enemies.push(idol);
      });
    }

    this.addDamageText(this.player.x, this.player.y - 80, `⚠ ${this.stage.bossName} 등장!`, '#ff4757', 22);
    sfx.playAlert();
  }

  onBossDefeated(boss) {
    this.currentBoss = null;
    this.medievalDarkness = false;
    this.kantRule = null;
    this.bossBullets = []; this.warningZones = [];
    this.lastBossKillTime = this.realSurvivalTimer - this.bossFightStartTime;
    this.spawnXpFrags(boss.x, boss.y, 30);
    this.spawnParticles(boss.x, boss.y, '#ffd200', 20, 15, -4);
    sfx.playEvolve();

    if (this.stageIndex >= TIMELINE.length - 1) {
      this.finalBossKillTime = this.lastBossKillTime;
      this.triggerEnding();
    } else {
      this.spawnAuraGacha();
    }
  }

  spawnAuraGacha() {
    this.isPlaying = false;
    const rVal = Math.random() * 100;
    let rolledTier = rVal < 5 ? 4 : rVal < 15 ? 3 : rVal < 45 ? 2 : 1;

    const tierNames = ['', '[보통] 신속의 아우라', '[레어] 광풍의 아우라', '[유니크] 지배의 아우라', '[에픽] 영생의 아우라'];
    const tierDescs = ['',
      '효과: 이동 속도 +15%',
      '효과: 이동 속도 +15%, 공격 속도 +15%',
      '효과: 이동 속도 +15%, 공격 속도 +15%, 주변 적 이동 속도 -25%',
      '효과: 이동 속도 +15%, 공격 속도 +15%, 주변 적 이동 속도 -25%, 흡혈 +10%'
    ];
    const tierColors = ['', '#2ed573', '#54a0ff', '#a55eea', '#ffd200'];
    const tierIcons = ['', '👣', '⚡', '🌀', '🩸'];

    let statusText = '';
    if (rolledTier > this.activeAuraTier) {
      statusText = '상위 등급 아우라를 장착했습니다!';
    } else {
      statusText = '현재 아우라가 더 강력합니다. 유지합니다.';
    }

    this._gachaPendingTier = rolledTier;
    this._gachaTierNames = tierNames;
    this._gachaTierDescs = tierDescs;
    this._gachaTierColors = tierColors;
    this._gachaAuraIcons = tierIcons;
    this._gachaStatusText = statusText;
    this._gachaSpun = false;

    // Reset gacha UI
    const resultEl = document.getElementById('gacha-result');
    if (resultEl) { resultEl.style.display = 'none'; }
    const spinArea = document.getElementById('gacha-spin-area');
    if (spinArea) spinArea.style.display = 'block';
    const reelWrap = document.getElementById('gacha-reel-container');
    if (reelWrap) { reelWrap.style.display = 'block'; }
    const reel = document.getElementById('gacha-reel');
    if (reel) { reel.style.transition = 'none'; reel.style.transform = 'translateY(0)'; }

    document.getElementById('gacha-screen').classList.add('active');
    sfx.playLevelUp();

    // Set Gacha spin button highlighted by default
    const spinBtn = document.getElementById('gacha-spin-btn');
    if (spinBtn) spinBtn.classList.add('keyboard-selected');
    const closeBtn = document.getElementById('gacha-close-btn');
    if (closeBtn) closeBtn.classList.remove('keyboard-selected');
  }

  triggerGachaSpin() {
    if (this._gachaSpun) return;
    this._gachaSpun = true;
    const rolledTier = this._gachaPendingTier;
    const reel = document.getElementById('gacha-reel');
    if (!reel) { this._showGachaResult(rolledTier); return; }

    const itemH = 72;
    const tierCycle = [1, 2, 3, 4];
    const labels = { 1: '⚡ 보통', 2: '💎 레어', 3: '🌟 유니크', 4: '👑 에픽' };
    const attrs = { 1: 'common', 2: 'rare', 3: 'unique', 4: 'epic' };
    const totalItems = 48;
    reel.innerHTML = '';
    for (let i = 0; i < totalItems; i++) {
      const t = tierCycle[i % 4];
      const el = document.createElement('div');
      el.className = 'gacha-reel-item';
      el.setAttribute('data-tier', attrs[t]);
      el.textContent = labels[t];
      reel.appendChild(el);
    }
    let targetIdx = 40;
    for (let j = 40; j < totalItems; j++) {
      if (tierCycle[j % 4] === rolledTier) targetIdx = j;
    }
    const finalOffset = -(targetIdx * itemH);
    reel.style.transition = 'none'; reel.style.transform = 'translateY(0)';
    void reel.offsetWidth;
    reel.style.transition = 'transform 2.5s cubic-bezier(0.12, 0.04, 0.04, 1)';
    reel.style.transform = `translateY(${finalOffset}px)`;
    const spinArea = document.getElementById('gacha-spin-area');
    if (spinArea) spinArea.style.display = 'none';
    sfx.playEvolve();
    setTimeout(() => this._showGachaResult(rolledTier), 2700);
  }

  _showGachaResult(rolledTier) {
    if (rolledTier > this.activeAuraTier) {
      this.activeAuraTier = rolledTier;
      this.applyAuraStats();
    }
    const reelWrap = document.getElementById('gacha-reel-container');
    if (reelWrap) reelWrap.style.display = 'none';
    const gVisual = document.getElementById('gacha-aura-visual');
    if (gVisual) gVisual.textContent = this._gachaAuraIcons[rolledTier];
    const gTier = document.getElementById('gacha-tier');
    if (gTier) { gTier.textContent = this._gachaTierNames[rolledTier]; gTier.style.color = this._gachaTierColors[rolledTier]; }
    const gDesc = document.getElementById('gacha-desc');
    if (gDesc) gDesc.textContent = this._gachaTierDescs[rolledTier];
    const gStatus = document.getElementById('gacha-status');
    if (gStatus) gStatus.textContent = this._gachaStatusText;
    const resultEl = document.getElementById('gacha-result');
    if (resultEl) resultEl.style.display = 'block';
    sfx.playLevelUp();

    // Highlight close button when spin result is shown
    const spinBtn = document.getElementById('gacha-spin-btn');
    if (spinBtn) spinBtn.classList.remove('keyboard-selected');
    const closeBtn = document.getElementById('gacha-close-btn');
    if (closeBtn) closeBtn.classList.add('keyboard-selected');
  }

  applyAuraStats() {
    this.player.auraSpeedBonus = 0; this.player.auraCooldownReduction = 0;
    this.player.auraLifesteal = 0; this.player.auraEnemySlowAura = false;
    this.player.auraTier = this.activeAuraTier;
    if (this.activeAuraTier >= 1) this.player.auraSpeedBonus = 0.15;
    if (this.activeAuraTier >= 2) this.player.auraCooldownReduction = 0.15;
    if (this.activeAuraTier >= 3) this.player.auraEnemySlowAura = true;
    if (this.activeAuraTier >= 4) this.player.auraLifesteal = 0.10;
  }

  resumeFromGacha() {
    this.resetFocus();
    const closeBtn = document.getElementById('gacha-close-btn');
    if (closeBtn) closeBtn.classList.remove('keyboard-selected');
    document.getElementById('gacha-screen').classList.remove('active');
    this.stageIndex = Math.min(this.stageIndex + 1, TIMELINE.length - 1);
    this.stage = TIMELINE[this.stageIndex];
    this.eraSurvivalTime = 0;
    this.enemies = []; this.bossBullets = []; this.warningZones = [];
    this.iceFloors = []; this.projectiles = [];
    this.activeIdols.clear();
    this.medievalDarkness = false; this.kantRule = null;
    this.player.evolutionIndex = Math.min(this.stageIndex, EVOLUTION_STAGES[this.player.lineage].length - 1);
    this.addDamageText(this.player.x, this.player.y - 80, `✨ ${EVOLUTION_STAGES[this.player.lineage][this.player.evolutionIndex].title} 전직!`, '#ffd200', 22);
    for (let i = 0; i < 5; i++) { this.spawnRandomMob(); }
    this.isPlaying = true;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  triggerLevelUp() {
    this.isPlaying = false;
    const linCards = PHILOSOPHY_DB[this.player.lineage];
    const available = linCards.filter(c => (this.player.activeSkills[c.id] || 0) < c.maxLevel);
    available.sort(() => Math.random() - 0.5);
    this.levelChoices = available.slice(0, 3);
    this.cardSelectedIndex = 0;
    const grid = document.getElementById('card-choices-container');
    grid.innerHTML = '';

    if (this.levelChoices.length === 0) {
      const el = document.createElement('div');
      el.className = 'choice-card choice-card-horizontal keyboard-selected heal-card';
      el.innerHTML = `
        <div class="card-left-section">
          <div class="card-icon-box normal">
            <div class="tier-ribbon normal">기본</div>
            <span class="card-skill-icon">💚</span>
          </div>
        </div>
        <div class="card-right-section">
          <div class="card-title-row">
            <span class="card-skill-name">체력 회복</span>
            <span class="card-lv-badge">즉시</span>
          </div>
          <div class="card-skill-desc">즉시 최대 체력의 40%를 회복합니다. 배움의 길 끝에 잠시 휴식을 취합니다.</div>
          <div class="stat-compare">
            <div class="stat-compare-row">
              <span class="stat-label-item">회복량</span>
              <span class="stat-val-new highlight">HP +40%</span>
            </div>
          </div>
        </div>
      `;
      el.onclick = () => { this.player.heal(Math.floor(this.player.maxHp * 0.4)); this.closeLevelUp(); };
      grid.appendChild(el);
    } else {
      this.levelChoices.forEach((upgrade, idx) => {
        const curLvl = this.player.activeSkills[upgrade.id] || 0;
        const nextLvl = curLvl + 1;
        const isAwakening = nextLvl >= upgrade.maxLevel;

        // 등급 독립시행 부여 (보통 55% / 레어 30% / 유니크 10% / 에픽 5%)
        const r = Math.random() * 100;
        let tier = 'normal';
        if (r < 5) tier = 'epic';          // 5%
        else if (r < 15) tier = 'unique';  // 10%
        else if (r < 45) tier = 'rare';    // 30%
        else tier = 'normal';              // 55%
        upgrade.rolledTier = tier;

        const tierNames = { normal: '보통', rare: '레어', unique: '유니크', epic: '에픽' };
        const tierName = tierNames[tier];
        const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
        const tm = tierMuls[tier];

        const curTier = this.player.skillTiers[upgrade.id] || 'normal';
        const curTm = tierMuls[curTier];

        const el = document.createElement('div');
        el.className = `choice-card choice-card-horizontal ${this.player.lineage}-card ${tier}-card${isAwakening ? ' awakening-card' : ''}`;
        if (idx === 0) el.classList.add('keyboard-selected');

        let statBlock = '<div class="stat-compare">';
        if (upgrade.type === 'weapon' && upgrade.stats) {
          const cur = curLvl > 0 ? upgrade.stats[curLvl - 1] : null;
          const nxt = upgrade.stats[nextLvl - 1];
          if (nxt && nxt.dmg !== undefined) {
            const prevEffDmg = cur ? Math.floor(cur.dmg * (curLvl >= upgrade.maxLevel ? 1.5 : 1.0) * curTm) : 0;
            const nextEffDmg = Math.floor(nxt.dmg * (isAwakening ? 1.5 : 1.0) * tm);
            statBlock += `<div class="stat-compare-row"><span class="stat-label-item">공격력</span><span><span class="stat-val-old">${prevEffDmg}</span><span class="stat-val-arrow">→</span><span class="stat-val-new highlight">${nextEffDmg}</span></span></div>`;
          }
          if (nxt && (nxt.cd || nxt.interval)) {
            const cd = nxt.cd || nxt.interval;
            const curCd = cur ? (cur.cd || cur.interval) : 0;
            const prevEffCd = cur ? (curCd * (curLvl >= upgrade.maxLevel ? 0.5 : 1.0) * (1 - this.player.cooldownReduction - this.player.auraCooldownReduction)) : 0;
            const nextEffCd = cd * (isAwakening ? 0.5 : 1.0) * (1 - this.player.cooldownReduction - this.player.auraCooldownReduction);
            statBlock += `<div class="stat-compare-row"><span class="stat-label-item">쿨타임</span><span><span class="stat-val-old">${cur ? (prevEffCd / 1000).toFixed(1) + 's' : '-'}</span><span class="stat-val-arrow">→</span><span class="stat-val-new">${(nextEffCd / 1000).toFixed(1)}s</span></span></div>`;
          }
        } else if (upgrade.type === 'passive') {
          const steps = {
            passive_idealism_dmg: [15, '%', '공격력'],
            passive_idealism_area: [15, '%', '범위'],
            passive_speed: [15, '%', '이동속도'],
            passive_cooldown: [12, '%', '쿨감소'],
            passive_regen: [1, 'HP', '초당회복'],
            passive_empiricism_slow: [15, '%', '적감속'],
            passive_empiricism_xp: [15, '%', '경험치'],
            passive_max_hp: [25, 'HP', '최대체력'],
            passive_armor: [15, '%', '피해감쇄'],
            passive_crit_dmg: [25, '%', '크리배율']
          };
          const info = steps[upgrade.id];
          if (info) {
            const [step, suffix, label] = info;
            const prevVal = curLvl * step * curTm;
            const nextVal = nextLvl * step * tm;
            statBlock += `<div class="stat-compare-row"><span class="stat-label-item">${label}</span><span><span class="stat-val-old">+${Math.round(prevVal)}${suffix}</span><span class="stat-val-arrow">→</span><span class="stat-val-new highlight">+${Math.round(nextVal)}${suffix}</span></span></div>`;
          }
        }
        statBlock += '</div>';

        const lvLabel = isAwakening ? '각성' : `Lv.${nextLvl}`;
        const typeLabel = upgrade.type === 'weapon' ? '무기' : '패시브';
        el.innerHTML = `
          <div class="card-left-section">
            <div class="card-icon-box ${tier}">
              <div class="tier-ribbon ${tier}">${tierName}</div>
              <span class="card-skill-icon">${upgrade.icon || (upgrade.type === 'weapon' ? '⚔️' : '🧠')}</span>
            </div>
          </div>
          <div class="card-right-section">
            <div class="card-title-row">
              <span class="card-skill-name">${upgrade.name}</span>
              <span class="card-type-badge ${upgrade.type}">${typeLabel}</span>
              <span class="card-lv-badge ${isAwakening ? 'awakening' : ''}">${lvLabel}</span>
            </div>
            <div class="card-skill-desc">${upgrade.desc || ''}</div>
            ${statBlock}
            ${isAwakening ? '<div class="awakening-badge-line">🔥 각성 특수 효과 발현!</div>' : ''}
          </div>
        `;
        el.onclick = () => { this.applyCardSelection(upgrade, isAwakening); this.closeLevelUp(); };
        grid.appendChild(el);
      });
    }
    document.getElementById('levelup-screen').classList.add('active');
    sfx.playLevelUp();
  }

  applyCardSelection(upgrade, isAwakening) {
    const curLvl = this.player.activeSkills[upgrade.id] || 0;
    this.player.activeSkills[upgrade.id] = curLvl + 1;

    const tierPriority = { normal: 1, rare: 2, unique: 3, epic: 4 };
    const rolledTier = upgrade.rolledTier || 'normal';
    const existingTier = this.player.skillTiers[upgrade.id] || 'normal';

    if (tierPriority[rolledTier] > tierPriority[existingTier] || !this.player.skillTiers[upgrade.id]) {
      this.player.skillTiers[upgrade.id] = rolledTier;
    }

    this.player.recalculateStats();
  }

  closeLevelUp() {
    this.resetFocus();
    document.getElementById('levelup-screen').classList.remove('active');
    document.getElementById('learned-skills-popup').classList.remove('active');
    this.isPlaying = true; this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  showLearnedSkillsPopup() {
    const list = document.getElementById('learned-skills-list');
    list.innerHTML = '';
    const active = this.player.activeSkills;
    const linCards = PHILOSOPHY_DB[this.player.lineage];
    
    let count = 0;
    Object.keys(active).forEach(id => {
      const lvl = active[id];
      if (lvl <= 0) return;
      count++;
      const data = linCards.find(c => c.id === id);
      if (!data) return;
      
      const tier = this.player.skillTiers[id] || 'normal';
      const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
      const tm = tierMuls[tier];
      
      const tierNames = { normal: '보통', rare: '레어', unique: '유니크', epic: '에픽' };
      const tierName = tierNames[tier];
      
      const item = document.createElement('div');
      item.className = `learned-skill-item`;
      
      const isAwakening = lvl >= data.maxLevel;
      const lvLabel = isAwakening ? '각성' : `Lv.${lvl}`;
      
      item.innerHTML = `
        <div class="learned-skill-icon-box ${tier}">
          <span>${data.icon || '🧠'}</span>
        </div>
        <div class="learned-skill-details">
          <div class="learned-skill-name-row">
            <span class="learned-skill-name">${data.name} [${tierName}]</span>
            <span class="learned-skill-lvl">${lvLabel}</span>
          </div>
          <div class="learned-skill-desc">${data.desc || ''}</div>
        </div>
      `;
      list.appendChild(item);
    });
    
    if (count === 0) {
      list.innerHTML = '<div style="text-align: center; color: #7f6040; font-size: 13px; padding: 12px 0;">아직 학습한 스킬이 없습니다.</div>';
    }
    
    document.getElementById('learned-skills-popup').classList.add('active');
  }

  togglePause() {
    if (!this.isPlaying && !this.isPaused) return;
    this.isPaused = !this.isPaused;
    this.isPlaying = !this.isPaused;
    const ps = document.getElementById('pause-screen');
    if (this.isPaused) {
      ps.classList.add('active');
      this.pauseSelectedIndex = 0;
      this.updatePauseKeyboardSelection(['pause-resume-btn', 'pause-restart-btn', 'pause-bgm-btn', 'pause-sfx-btn', 'pause-status-toggle-btn']);
      this.updatePauseStatusPanel();
    } else {
      this.resetFocus();
      ps.classList.remove('active');
      this.lastTime = performance.now();
      requestAnimationFrame(t => this.loop(t));
    }
  }

  updatePauseStatusPanel() {
    if (!this.player) return;
    
    if (this.player.auraTier !== undefined) {
      this.activeAuraTier = this.player.auraTier;
    }
    
    const stages = EVOLUTION_STAGES[this.player.lineage];
    const ev = stages[Math.min(this.player.evolutionIndex, stages.length - 1)];
    const className = `철학자: ${ev ? ev.title : '학자'}`;
    const eraName = this.stage ? this.stage.name : '고대 그리스';
    
    const statClassName = document.getElementById('stat-class-name');
    if (statClassName) statClassName.textContent = className;
    const statEraName = document.getElementById('stat-era-name');
    if (statEraName) statEraName.textContent = eraName;
    
    const statLevel = document.getElementById('stat-level');
    if (statLevel) statLevel.textContent = this.player.level;
    
    const totalSecs = Math.floor(this.realSurvivalTimer);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    const statTime = document.getElementById('stat-time');
    if (statTime) statTime.textContent = `${m}:${s}`;
    
    const statHp = document.getElementById('stat-hp');
    if (statHp) statHp.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    
    const auraEl = document.getElementById('stat-aura');
    if (auraEl) {
      if (this.activeAuraTier === 0) {
        auraEl.innerHTML = '<span style="color: #95a5a6;">없음</span>';
      } else if (this.activeAuraTier === 1) {
        auraEl.innerHTML = '<span style="color: #2ed573; text-shadow: 0 0 4px rgba(46,213,115,0.4); font-weight:bold;">👣 보통 (이속 +15%)</span>';
      } else if (this.activeAuraTier === 2) {
        auraEl.innerHTML = '<span style="color: #54a0ff; text-shadow: 0 0 4px rgba(84,160,255,0.4); font-weight:bold;">⚡ 레어 (이속+15%, 쿨감-15%)</span>';
      } else if (this.activeAuraTier === 3) {
        auraEl.innerHTML = '<span style="color: #a55eea; text-shadow: 0 0 4px rgba(165,94,234,0.4); font-weight:bold;">🌀 유니크 (이속+쿨감+적감속)</span>';
      } else if (this.activeAuraTier === 4) {
        auraEl.innerHTML = '<span style="color: #ffd200; text-shadow: 0 0 6px rgba(255,210,0,0.6); font-weight:bold;">👑 에픽 (이속+쿨감+적감속+흡혈)</span>';
      }
    }
    
    const statValDmg = document.getElementById('stat-val-dmg');
    if (statValDmg) statValDmg.textContent = `${Math.round(this.player.dmgMultiplier * 100)}%`;
    const statValArea = document.getElementById('stat-val-area');
    if (statValArea) statValArea.textContent = `${Math.round(this.player.areaMultiplier * 100)}%`;
    const cdVal = Math.round((this.player.cooldownReduction + this.player.auraCooldownReduction) * 100);
    const statValCd = document.getElementById('stat-val-cd');
    if (statValCd) statValCd.textContent = `${cdVal}%`;
    const statValSpeed = document.getElementById('stat-val-speed');
    if (statValSpeed) statValSpeed.textContent = this.player.effectiveSpeed.toFixed(1);
    
    const skillsListEl = document.getElementById('stat-skills-list');
    if (skillsListEl) {
      skillsListEl.innerHTML = '';
      const linCards = PHILOSOPHY_DB[this.player.lineage];
      
      let hasSkills = false;
      for (const [skillId, lvl] of Object.entries(this.player.activeSkills)) {
        if (lvl > 0) {
          const card = linCards.find(c => c.id === skillId);
          if (card) {
            hasSkills = true;
            const skillDiv = document.createElement('div');
            skillDiv.style.display = 'flex';
            skillDiv.style.justifyContent = 'space-between';
            skillDiv.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            skillDiv.style.padding = '3px 0';
            
            const nameSpan = document.createElement('span');
            nameSpan.innerHTML = `<span style="margin-right:6px;">${card.icon || ''}</span>${card.name}`;
            nameSpan.style.color = '#fff';
            
            const lvlSpan = document.createElement('span');
            lvlSpan.textContent = lvl >= card.maxLevel ? '각성' : `Lv.${lvl}`;
            lvlSpan.style.color = lvl >= card.maxLevel ? '#ffd200' : 'var(--xp-color)';
            lvlSpan.style.fontWeight = 'bold';
            
            skillDiv.appendChild(nameSpan);
            skillDiv.appendChild(lvlSpan);
            skillsListEl.appendChild(skillDiv);
          }
        }
      }
      
      if (!hasSkills) {
        skillsListEl.textContent = '습득한 스킬 없음';
      }
    }
  }

  addDamageText(x, y, val, color, size, isCrit) {
    this.damageTexts.push(new DamageText(x, y, val, color, size, isCrit));
  }

  spawnParticles(x, y, color, count, speed, vy) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.5 + Math.random() * 0.5);
      this.particles.push(new Particle(x, y, color, 4 + Math.random() * 4, Math.cos(a) * s, Math.sin(a) * s + vy, 600, 0.05));
    }
  }

  spawnXpFrags(x, y, total) {
    const count = Math.min(total, 8);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 20 + Math.random() * 40;
      this.xpFrags.push(new XPFrag(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.ceil(total / count)));
    }
  }

  spawnExistentialWords() {
    const words = ['자유', '책임', '성장', '실존', '선택'];
    words.forEach(w => {
      const a = Math.random() * Math.PI * 2;
      const d = 150 + Math.random() * 200;
      const p = new Particle(this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d, '#a29bfe', 12, 0, 0, 8000, 0, 'word');
      p.wordText = w;
      this.particles.push(p);
      this.existentialWords.push(p);
    });
  }

  gameOver() {
    this.isPlaying = false;
    const stages = EVOLUTION_STAGES[this.player.lineage];
    const ev = stages[Math.min(this.player.evolutionIndex, stages.length - 1)];
    const totalSecs = Math.floor(this.realSurvivalTimer);
    const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    document.getElementById('go-philosopher').textContent = ev ? ev.title : '학자';
    document.getElementById('go-era').textContent = ev ? ev.era : '고대';
    document.getElementById('go-time').textContent = `${m}:${s}`;
    document.getElementById('gameover-screen').classList.add('active');
    sfx.playAlert();

    // Highlight retry button on game over
    const retryBtn = document.getElementById('gameover-retry-btn');
    if (retryBtn) retryBtn.classList.add('keyboard-selected');
  }

  triggerEnding() {
    this.isPlaying = false;
    this.examScore = 0;
    this.currentQuestionIndex = 1;
    this.examSelectedIndex = 0;

    // Deactivate other overlay screens to prevent overlay clashes!
    document.querySelectorAll('.overlay-screen').forEach(scr => scr.classList.remove('active'));

    // Reset quiz visibility states
    document.querySelectorAll('.quiz-question').forEach(q => q.classList.remove('active'));
    const q1 = document.getElementById('q1');
    if (q1) q1.classList.add('active');
    const examResult = document.getElementById('exam-result');
    if (examResult) examResult.style.display = 'none';

    const overlay = document.getElementById('exam-overlay-visual');
    if (overlay) {
      overlay.textContent = this.player && this.player.lineage === 'idealism' ? '🔥' : '❄️';
    }

    const secs = Math.floor(this.finalBossKillTime);
    const totalSecs = Math.floor(this.realSurvivalTimer);
    document.getElementById('exam-boss-kill-time').textContent = `${secs}초`;
    document.getElementById('exam-total-clear-time').textContent = `${Math.floor(totalSecs / 60)}분 ${totalSecs % 60}초`;
    document.getElementById('ending-screen').classList.add('active');
    
    // Highlight the first keyboard option
    this.updateExamKeyboardSelection();
    sfx.playExamBell();
  }

  updatePauseKeyboardSelection(btns) {
    btns.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('keyboard-selected', i === this.pauseSelectedIndex);
    });
  }
  updateMenuKeyboardSelection() {
    document.getElementById('card-idealism').classList.toggle('keyboard-selected', this.menuSelectedIndex === 0);
    document.getElementById('card-empiricism').classList.toggle('keyboard-selected', this.menuSelectedIndex === 1);
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.classList.toggle('keyboard-selected', this.menuSelectedIndex === 2);
    }
  }
  updateTutorialKeyboardSelection() {
    const yesBtn = document.getElementById('tutorial-yes-btn');
    const noBtn = document.getElementById('tutorial-no-btn');
    if (yesBtn) yesBtn.classList.toggle('keyboard-selected', this.tutorialSelectedIndex === 0);
    if (noBtn) noBtn.classList.toggle('keyboard-selected', this.tutorialSelectedIndex === 1);
  }
  updateKeyboardCardSelection() {
    document.querySelectorAll('.choice-card').forEach((c, i) => {
      c.classList.toggle('keyboard-selected', i === this.cardSelectedIndex);
    });
    const learnedBtn = document.getElementById('learned-skills-btn');
    if (learnedBtn) {
      learnedBtn.classList.toggle('keyboard-selected', this.cardSelectedIndex === (this.levelChoices.length || 1));
    }
  }

  updateExamKeyboardSelection() {
    const currentQ = document.getElementById(`q${this.currentQuestionIndex}`);
    if (!currentQ) return;
    const btns = currentQ.querySelectorAll('.quiz-option-btn');
    btns.forEach((btn, i) => {
      btn.classList.toggle('keyboard-selected', i === this.examSelectedIndex);
    });
  }

  initEvents() {
    window.addEventListener('keydown', e => {
      let keyStr = (e.key || '').toLowerCase();
      let codeStr = (e.code || '').toLowerCase();
      
      // Normalize legacy arrow keys
      if (keyStr === 'right' || codeStr === 'arrowright') keyStr = 'arrowright';
      if (keyStr === 'left' || codeStr === 'arrowleft') keyStr = 'arrowleft';
      if (keyStr === 'up' || codeStr === 'arrowup') keyStr = 'arrowup';
      if (keyStr === 'down' || codeStr === 'arrowdown') keyStr = 'arrowdown';

      if (keyStr) this.keys[keyStr] = true;
      if (codeStr) this.keys[codeStr] = true;
      
      // Title screen Enter/Space to start
      const titleScreen = document.getElementById('title-screen');
      if (titleScreen && titleScreen.classList.contains('active')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.showMenuScreen();
        }
        return;
      }

      const k = keyStr;

      // Gameover screen Space/Enter restart
      const gameoverScreen = document.getElementById('gameover-screen');
      if (gameoverScreen && gameoverScreen.classList.contains('active')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const retryBtn = document.getElementById('gameover-retry-btn');
          if (retryBtn) retryBtn.click();
        }
        return;
      }

      // Ending screen keyboard navigation
      const endingScreen = document.getElementById('ending-screen');
      if (endingScreen && endingScreen.classList.contains('active')) {
        const currentQ = document.getElementById(`q${this.currentQuestionIndex}`);
        const isFinished = document.getElementById('exam-result').style.display === 'block';
        if (currentQ && !isFinished) {
          const btns = currentQ.querySelectorAll('.quiz-option-btn');
          const total = btns.length;
          if (k === 'arrowup' || k === 'w') {
            e.preventDefault();
            this.examSelectedIndex = (this.examSelectedIndex - 1 + total) % total;
            this.updateExamKeyboardSelection();
            if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
          } else if (k === 'arrowdown' || k === 's') {
            e.preventDefault();
            this.examSelectedIndex = (this.examSelectedIndex + 1) % total;
            this.updateExamKeyboardSelection();
            if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (btns[this.examSelectedIndex]) {
              btns[this.examSelectedIndex].click();
            }
          }
        } else {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const restartBtn = document.getElementById('restart-game-btn');
            if (restartBtn) restartBtn.click();
          }
        }
        return;
      }

      // ESC: pause
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.isPlaying || this.isPaused) this.togglePause();
        return;
      }

      // Pause screen navigation
      if (this.isPaused) {
        const pauseBtns = ['pause-resume-btn', 'pause-restart-btn', 'pause-bgm-btn', 'pause-sfx-btn', 'pause-status-toggle-btn'];
        if (k === 'arrowup' || k === 'w') { e.preventDefault(); this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + pauseBtns.length) % pauseBtns.length; this.updatePauseKeyboardSelection(pauseBtns); sfx.playTick(); }
        else if (k === 'arrowdown' || k === 's') { e.preventDefault(); this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % pauseBtns.length; this.updatePauseKeyboardSelection(pauseBtns); sfx.playTick(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const btn = document.getElementById(pauseBtns[this.pauseSelectedIndex]); if (btn) btn.click(); }
        return;
      }

      // Menu screen
      const menuScreen = document.getElementById('menu-screen');
      if (menuScreen.classList.contains('active')) {
        if (k === 'arrowleft' || k === 'a') {
          e.preventDefault();
          this.menuSelectedIndex = 0;
          this.selectLineage('idealism');
          this.updateMenuKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        } else if (k === 'arrowright' || k === 'd') {
          e.preventDefault();
          this.menuSelectedIndex = 1;
          this.selectLineage('empiricism');
          this.updateMenuKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        } else if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') {
          e.preventDefault();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (this.player && this.player.lineage) {
            this.startGame();
          }
        }
        return;
      }

      // Tutorial screen
      const tutScreen = document.getElementById('tutorial-screen');
      if (tutScreen.classList.contains('active')) {
        if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') { e.preventDefault(); this.tutorialSelectedIndex = this.tutorialSelectedIndex === 0 ? 1 : 0; this.updateTutorialKeyboardSelection(); sfx.playTick(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (this.tutorialSelectedIndex === 0) document.getElementById('tutorial-yes-btn').click(); else document.getElementById('tutorial-no-btn').click(); }
        return;
      }

      // Global Learned Skills popup close check (Space / Escape)
      const learnedSkillsPopup = document.getElementById('learned-skills-popup');
      if (learnedSkillsPopup && learnedSkillsPopup.classList.contains('active')) {
        if (e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          const closeBtn = document.getElementById('learned-skills-popup-close');
          if (closeBtn) closeBtn.click();
          if (document.getElementById('levelup-screen').classList.contains('active')) {
            this.cardSelectedIndex = this.levelChoices.length || 1;
            this.updateKeyboardCardSelection();
          }
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
          return;
        }
      }

      // Level up card selection
      const lvlScreen = document.getElementById('levelup-screen');
      if (lvlScreen.classList.contains('active')) {
        const popup = document.getElementById('learned-skills-popup');
        if (popup && popup.classList.contains('active')) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            const closeBtn = document.getElementById('learned-skills-popup-close');
            if (closeBtn) closeBtn.click();
            this.cardSelectedIndex = this.levelChoices.length || 1;
            this.updateKeyboardCardSelection();
            sfx.playTick();
          }
          return;
        }

        const totalChoices = this.levelChoices.length || 1;
        const totalItems = totalChoices + 1;

        if (k === 'arrowup' || k === 'w') {
          e.preventDefault();
          this.cardSelectedIndex = (this.cardSelectedIndex - 1 + totalItems) % totalItems;
          this.updateKeyboardCardSelection();
          sfx.playTick();
        } else if (k === 'arrowdown' || k === 's') {
          e.preventDefault();
          this.cardSelectedIndex = (this.cardSelectedIndex + 1) % totalItems;
          this.updateKeyboardCardSelection();
          sfx.playTick();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (this.cardSelectedIndex === totalChoices) {
            document.getElementById('learned-skills-btn').click();
            const closeBtn = document.getElementById('learned-skills-popup-close');
            if (closeBtn) closeBtn.classList.add('keyboard-selected');
            sfx.playTick();
          } else {
            const cards = document.querySelectorAll('.choice-card');
            if (cards[this.cardSelectedIndex]) cards[this.cardSelectedIndex].click();
          }
        }
        return;
      }

      // Gacha screen
      const gachaScreen = document.getElementById('gacha-screen');
      if (gachaScreen && gachaScreen.classList.contains('active')) {
        if (this._gachaChoiceMode) {
          if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') {
            e.preventDefault();
            this._gachaChoiceIndex = this._gachaChoiceIndex === 0 ? 1 : 0;
            this._updateAuraChoiceSelection();
            if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (this._gachaChoiceIndex === 0) {
              this._applyAuraUpgrade();
            } else {
              this._applyAuraChange();
            }
          }
          return;
        }

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!this._gachaSpun) {
            this.triggerGachaSpin();
          } else {
            const closeBtn = document.getElementById('gacha-close-btn');
            if (closeBtn && document.getElementById('gacha-result').style.display !== 'none') {
              closeBtn.click();
            }
          }
        }
        return;
      }

      // Pedia screen
      const pediaScreen = document.getElementById('pedia-screen');
      if (pediaScreen && pediaScreen.classList.contains('active')) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const pediaClose = document.getElementById('pedia-close-btn');
          if (pediaClose) pediaClose.click();
        }
        return;
      }

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) e.preventDefault();
    });

    window.addEventListener('keyup', e => {
      let keyStr = (e.key || '').toLowerCase();
      let codeStr = (e.code || '').toLowerCase();
      
      // Normalize legacy arrow keys
      if (keyStr === 'right' || codeStr === 'arrowright') keyStr = 'arrowright';
      if (keyStr === 'left' || codeStr === 'arrowleft') keyStr = 'arrowleft';
      if (keyStr === 'up' || codeStr === 'arrowup') keyStr = 'arrowup';
      if (keyStr === 'down' || codeStr === 'arrowdown') keyStr = 'arrowdown';

      if (keyStr) this.keys[keyStr] = false;
      if (codeStr) this.keys[codeStr] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      if (this.joystick) {
        this.joystick.active = false;
        this.joystick.strength = 0;
      }
    });

    // Bind UI buttons
    const titleScr = document.getElementById('title-screen');
    if (titleScr) {
      titleScr.addEventListener('click', () => this.showMenuScreen());
    }
    const titleBtn = document.getElementById('title-start-btn');
    if (titleBtn) {
      titleBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.showMenuScreen();
      });
    }
    document.getElementById('card-idealism').addEventListener('click', () => { this.menuSelectedIndex = 0; this.selectLineage('idealism'); this.updateMenuKeyboardSelection(); });
    document.getElementById('card-empiricism').addEventListener('click', () => { this.menuSelectedIndex = 1; this.selectLineage('empiricism'); this.updateMenuKeyboardSelection(); });
    document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
    document.getElementById('tutorial-yes-btn').addEventListener('click', () => this.acceptTutorial(true));
    document.getElementById('tutorial-no-btn').addEventListener('click', () => this.acceptTutorial(false));
    document.getElementById('gacha-close-btn').addEventListener('click', () => this.resumeFromGacha());
    const spinBtn = document.getElementById('gacha-spin-btn');
    if (spinBtn) spinBtn.addEventListener('click', () => this.triggerGachaSpin());
    document.getElementById('gameover-retry-btn').addEventListener('click', () => location.reload());
    document.getElementById('restart-game-btn').addEventListener('click', () => location.reload());
    document.getElementById('pause-resume-btn').addEventListener('click', () => this.togglePause());
    document.getElementById('pause-restart-btn').addEventListener('click', () => location.reload());
    document.getElementById('pause-bgm-btn').addEventListener('click', () => {
      this.bgmMuted = !this.bgmMuted; this.bgm.muted = this.bgmMuted;
      document.getElementById('pause-bgm-btn').textContent = this.bgmMuted ? '음악: 꺼짐' : '음악: 켜짐'; sfx.playTick();
    });
    document.getElementById('pause-sfx-btn').addEventListener('click', () => {
      this.sfxMuted = !this.sfxMuted;
      document.getElementById('pause-sfx-btn').textContent = this.sfxMuted ? '효과음: 꺼짐' : '효과음: 켜짐'; sfx.playTick();
    });
    document.getElementById('pause-status-toggle-btn').addEventListener('click', () => {
      const panel = document.getElementById('pause-status-panel');
      if (panel) {
        const isOpening = panel.style.display === 'none';
        panel.style.display = isOpening ? 'block' : 'none';
        if (isOpening) {
          this.updatePauseStatusPanel();
        }
      }
    });

    document.getElementById('learned-skills-btn').addEventListener('click', () => {
      const popup = document.getElementById('learned-skills-popup');
      if (popup.classList.contains('active')) {
        popup.classList.remove('active');
      } else {
        this.showLearnedSkillsPopup();
      }
    });
    document.getElementById('learned-skills-popup-close').addEventListener('click', () => {
      document.getElementById('learned-skills-popup').classList.remove('active');
    });

    // Final ending quiz option buttons
    document.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const isCorrect = e.currentTarget.getAttribute('data-correct') === 'true';
        if (isCorrect) {
          this.examScore += 1;
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        } else {
          if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
        }

        const currentQ = document.getElementById(`q${this.currentQuestionIndex}`);
        if (currentQ) {
          currentQ.classList.remove('active');
          const btns = currentQ.querySelectorAll('.quiz-option-btn');
          btns.forEach(b => b.classList.remove('keyboard-selected'));
        }

        this.currentQuestionIndex++;
        const nextQ = document.getElementById(`q${this.currentQuestionIndex}`);
        if (nextQ) {
          nextQ.classList.add('active');
          this.examSelectedIndex = 0;
          this.updateExamKeyboardSelection();
        } else {
          let finalScore = 0;
          if (this.examScore === 3) finalScore = 100;
          else if (this.examScore === 2) finalScore = 66;
          else if (this.examScore === 1) finalScore = 33;

          const scoreStamp = document.getElementById('score-stamp');
          if (scoreStamp) {
            scoreStamp.textContent = finalScore;
            if (finalScore === 100) {
              scoreStamp.style.color = '#ff4757';
              scoreStamp.style.borderColor = '#ff4757';
            } else if (finalScore >= 60) {
              scoreStamp.style.color = '#ffa502';
              scoreStamp.style.borderColor = '#ffa502';
            } else {
              scoreStamp.style.color = '#7f8c8d';
              scoreStamp.style.borderColor = '#7f8c8d';
            }
          }

          const examResult = document.getElementById('exam-result');
          if (examResult) examResult.style.display = 'block';
          if (typeof sfx !== 'undefined' && sfx.playExamBell) sfx.playExamBell();

          // Highlight the restart button when the exam result displays
          const restartBtn = document.getElementById('restart-game-btn');
          if (restartBtn) restartBtn.classList.add('keyboard-selected');
        }
      });
    });
    const pediaOpen = document.getElementById('pedia-open-btn');
    if (pediaOpen) pediaOpen.addEventListener('click', () => { this.isPlaying = false; document.getElementById('pedia-screen').classList.add('active'); });
    const pediaClose = document.getElementById('pedia-close-btn');
    if (pediaClose) pediaClose.addEventListener('click', () => { 
      document.getElementById('pedia-screen').classList.remove('active'); 
      this.resetFocus();
      this.isPlaying = true; 
      this.lastTime = performance.now(); 
      requestAnimationFrame(t => this.loop(t)); 
    });

    // Developer Debug Panel Bindings
    const dbgInvinc = document.getElementById('dbg-invinc');
    if (dbgInvinc) {
      dbgInvinc.addEventListener('click', () => {
        if (!this.player) return;
        this.player.isInvincible = !this.player.isInvincible;
        dbgInvinc.textContent = '무적: ' + (this.player.isInvincible ? 'ON' : 'OFF');
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      });
    }

    const dbgSpeed = document.getElementById('dbg-speed');
    if (dbgSpeed) {
      dbgSpeed.addEventListener('click', () => {
        this.timeScale = this.timeScale === 1 ? 5 : this.timeScale === 5 ? 10 : 1;
        dbgSpeed.textContent = '배속: ' + this.timeScale + 'x';
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      });
    }

    const dbgLvlup = document.getElementById('dbg-lvlup');
    if (dbgLvlup) {
      dbgLvlup.addEventListener('click', () => {
        if (!this.player) return;
        this.player.gainXp(this.player.maxXp - this.player.xp, this);
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      });
    }

    const dbgEvolve = document.getElementById('dbg-evolve');
    if (dbgEvolve) {
      dbgEvolve.addEventListener('click', () => {
        if (!this.player) return;
        this.player.evolutionIndex = Math.min(this.player.evolutionIndex + 1, 5);
        this.addDamageText(this.player.x, this.player.y - 80, '즉시 전직!', '#ffd200', 20);
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      });
    }

    const dbgBoss = document.getElementById('dbg-boss');
    if (dbgBoss) {
      dbgBoss.addEventListener('click', () => {
        if (!this.player) return;
        if (!this.currentBoss) {
          this.spawnBossImmediate();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        }
      });
    }

    const dbgClear = document.getElementById('dbg-clear');
    if (dbgClear) {
      dbgClear.addEventListener('click', () => {
        if (this.currentBoss) {
          this.currentBoss.hp = 0;
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        }
      });
    }

    // Touch Joystick
    const container = document.getElementById('game-container');
    container.addEventListener('touchstart', e => {
      if (!this.isPlaying) return;
      const touch = e.touches[0];
      this.joystick.active = true; this.joystick.startX = touch.clientX; this.joystick.startY = touch.clientY;
      const jz = document.getElementById('joystick-zone');
      jz.style.display = 'flex'; jz.style.left = `${touch.clientX - 60}px`; jz.style.top = `${touch.clientY - 60}px`;
    });
    container.addEventListener('touchmove', e => {
      if (!this.joystick.active) return; e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - this.joystick.startX, dy = touch.clientY - this.joystick.startY;
      const dist = Math.min(Math.hypot(dx, dy), 60);
      this.joystick.angle = Math.atan2(dy, dx);
      this.joystick.strength = dist / 60;
      const handle = document.getElementById('joystick-handle');
      handle.style.transform = `translate(${(dx / Math.hypot(dx || 1, dy || 1)) * dist}px, ${(dy / Math.hypot(dx || 1, dy || 1)) * dist}px)`;
    }, { passive: false });
    container.addEventListener('touchend', () => {
      this.joystick.active = false; this.joystick.strength = 0;
      document.getElementById('joystick-zone').style.display = 'none';
      document.getElementById('joystick-handle').style.transform = 'translate(0,0)';
    });

    this.canvas.addEventListener('click', () => {
      this.resetFocus();
    });

    // Global click listener to prevent focus stealing by buttons
    document.addEventListener('click', e => {
      if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
        const btn = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
        btn.blur();
        window.focus();
      }
    });

    // Reset keys when window loses focus
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  // ─── DRAW ────────────────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const camX = this.camera.x, camY = this.camera.y;
    const W = this.canvas.width, H = this.canvas.height;

    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
      this.screenShake *= 0.8; if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Full grayscale filter for Stage 6 (Nietzsche)
    if (this.stageIndex === 5 && this.currentBoss && !this.uberMenschMode) {
      ctx.filter = 'grayscale(100%)';
    } else if (this.prejudiceWave === 3) {
      ctx.filter = 'contrast(140%) sepia(85%)';
    } else {
      ctx.filter = 'none';
    }

    // Draw stage background
    this.drawStageBackground(camX, camY, W, H);

    // Medieval darkness overlay
    if (this.medievalDarkness && this.currentBoss) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      // Light circle around player
      const prx = W / 2, pry = H / 2;
      const grad = ctx.createRadialGradient(prx, pry, 0, prx, pry, 180);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }

    // Ataraxia safe zone
    if (this.ataraxiaZone) {
      const rx = this.ataraxiaZone.x - camX + W / 2, ry = this.ataraxiaZone.y - camY + H / 2;
      const radius = this.ataraxiaZone.radius || 110;
      ctx.save();
      ctx.strokeStyle = 'rgba(46, 213, 115, 0.8)'; ctx.lineWidth = 4;
      const p = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
      ctx.shadowColor = '#2ed573'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(rx, ry, radius + p * 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(46, 213, 115, 0.08)'; ctx.fill();
      
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#2ed573';
      ctx.textAlign = 'center';
      ctx.fillText('🟢 아파테이아 (Apatheia)', rx, ry - radius - 15);
      ctx.restore();
    }

    // Ice floors
    this.iceFloors.forEach(f => {
      const rx = f.x - camX + W / 2, ry = f.y - camY + H / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(168, 230, 240, 0.35)';
      ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rx, ry, f.size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    });

    // Warning zones
    this.warningZones.forEach(w => w.draw(ctx, this.camera));

    // Draw Candlesticks
    if (this.candlesticks) {
      this.candlesticks.forEach(c => c.draw(ctx, this.camera));
    }

    // Draw Nietzsche relics
    if (this.nietzcheRelics) {
      this.nietzcheRelics.forEach(r => r.draw(ctx, this.camera));
    }

    // Draw Rhythmic Grid Lines
    if (this.gridLines) {
      this.gridLines.forEach(l => l.draw(ctx, this.camera, W, H));
    }

    // Draw Stage 4 Theater Idol ghost shadow trails
    if (this.prejudiceWave === 1 && this.playerHistory && this.playerHistory.length > 10) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      const trails = [8, 16, 24];
      trails.forEach((idx, tIdx) => {
        const hist = this.playerHistory[this.playerHistory.length - 1 - idx];
        if (hist) {
          ctx.fillStyle = tIdx === 0 ? 'rgba(0, 210, 211, 0.45)' : (tIdx === 1 ? 'rgba(232, 67, 147, 0.45)' : 'rgba(255, 192, 72, 0.45)');
          const gx = hist.x - camX + W / 2;
          const gy = hist.y - camY + H / 2;
          ctx.beginPath();
          ctx.arc(gx, gy, this.player.size * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // Draw Cave Idol Blindness Overlay
    if (this.prejudiceWave === 3) {
      ctx.save();
      ctx.fillStyle = 'rgba(12, 6, 0, 0.88)';
      ctx.fillRect(0, 0, W, H);
      const prx = W / 2, pry = H / 2;
      const grad = ctx.createRadialGradient(prx, pry, 0, prx, pry, 75);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.96)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }


    // XP frags
    this.xpFrags.forEach(f => f.draw(ctx, this.camera));

    // Magnet items
    this.magnetItems.forEach(m => m.draw(ctx, this.camera));

    // Ice ring visual
    const iceRingData = PHILOSOPHY_DB[this.player.lineage].find(c => c.id === 'ice_ring');
    if (iceRingData) {
      const lvl = this.player.activeSkills['ice_ring'] || 0;
      if (lvl > 0) {
        const stats = iceRingData.stats[lvl - 1];
        const isAwakening = lvl >= iceRingData.maxLevel;
        const count = (stats.count || 1) * (isAwakening ? 2 : 1);
        const radius = (stats.radius || 65) * this.player.areaMultiplier;
        const prx = W / 2, pry = H / 2;
        for (let i = 0; i < count; i++) {
          const a = this.orbitAngle + (Math.PI * 2 / count) * i;
          const ox = prx + Math.cos(a) * radius, oy = pry + Math.sin(a) * radius;
          ctx.save();
          ctx.fillStyle = '#a8e6f0'; ctx.shadowColor = '#00d2d3'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(ox, oy, 10, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
    }

    // Enemies
    this.enemies.forEach(e => e.draw(ctx, this.camera));

    // Projectiles
    this.projectiles.forEach(p => p.draw(ctx, this.camera));

    // Boss bullets
    this.bossBullets.forEach(b => b.draw(ctx, this.camera));

    // Particles
    this.particles.forEach(p => p.draw(ctx, this.camera));

    // Player
    this.player.draw(ctx, this.camera);

    // Damage texts
    this.damageTexts.forEach(t => t.draw(ctx, this.camera));

    // Kant rule display
    if (this.kantRule) {
      ctx.save();
      ctx.fillStyle = 'rgba(214,48,49,0.18)'; ctx.fillRect(0, H / 2 - 80, W, 80);
      ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillStyle = '#ffd200';
      ctx.textAlign = 'center'; ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
      ctx.fillText(this.kantRule.text, W / 2, H / 2 - 42);
      ctx.font = 'bold 24px Share Tech Mono, monospace'; ctx.fillStyle = '#fff';
      ctx.fillText(`의무이행 기한: ${(this.kantTimer / 1000).toFixed(1)}초`, W / 2, H / 2 - 10);
      ctx.restore();
    }

    ctx.restore();
  }

  drawStageBackground(camX, camY, W, H) {
    const ctx = this.ctx;
    const s = this.scroll;

    ctx.save();
    if (this.stageIndex === 0) {
      // 고대 그리스 - 숲
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a3a1a'); grad.addColorStop(1, '#0d2010');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(34,85,34,0.25)';
      for (let i = 0; i < 6; i++) {
        const tx = ((i * 240 - s * 0.1) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.moveTo(tx, H); ctx.lineTo(tx - 30, H * 0.4); ctx.lineTo(tx + 30, H * 0.4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx, H * 0.55); ctx.lineTo(tx - 24, H * 0.25); ctx.lineTo(tx + 24, H * 0.25); ctx.closePath(); ctx.fill();
      }
    } else if (this.stageIndex === 1) {
      // 헬레니즘 - 바다
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a1a3a'); grad.addColorStop(0.6, '#0a3060'); grad.addColorStop(1, '#051530');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,180,255,0.15)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const wy = H * 0.4 + i * 40 + Math.sin(s * 0.003 + i) * 15;
        ctx.beginPath(); ctx.moveTo(0, wy);
        for (let x = 0; x < W; x += 40) ctx.lineTo(x, wy + Math.sin((x + s * 0.5) * 0.02) * 12);
        ctx.stroke();
      }
    } else if (this.stageIndex === 2) {
      // 중세 - 사막
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#2a1a0a'); grad.addColorStop(1, '#3d2510');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(180,120,60,0.15)';
      for (let i = 0; i < 5; i++) {
        const dx = ((i * 300 + s * 0.08) % (W + 300)) - 150;
        ctx.beginPath(); ctx.ellipse(dx, H * 0.65, 150, 40, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (this.stageIndex === 3) {
      // 근대 시작 - 하늘
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#101035'); grad.addColorStop(0.5, '#1a2060'); grad.addColorStop(1, '#0d1540');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(200,220,255,0.12)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 350 + s * 0.06) % (W + 300)) - 100;
        ctx.beginPath(); ctx.ellipse(cx, H * 0.3, 120, 40, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - 70, H * 0.35, 80, 30, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 80, H * 0.28, 90, 30, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (this.stageIndex === 4) {
      // 근대 성숙 - 우주
      ctx.fillStyle = '#010208'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 80; i++) {
        const sx = (Math.sin(i * 127.1 + s * 0.001) * 0.5 + 0.5) * W;
        const sy = (Math.cos(i * 311.7 + s * 0.0005) * 0.5 + 0.5) * H;
        ctx.globalAlpha = 0.4 + Math.sin(i + s * 0.002) * 0.3;
        ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // 현대 - 사이버
      ctx.fillStyle = '#000208'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,200,255,0.06)'; ctx.lineWidth = 1;
      const cg = 60;
      for (let x = 0; x < W + cg; x += cg) {
        const gx = ((x - s * 0.3) % (W + cg) + W + cg) % (W + cg);
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let y = 0; y < H + cg; y += cg) {
        const gy = ((y - s * 0.2) % (H + cg) + H + cg) % (H + cg);
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function game_addDamageText_local(game, x, y, val, color, size) {
  game.addDamageText(x, y, val, color, size, false);
}

// ─── BOOT ────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
  });
} else {
  window.gameInstance = new Game();
}
