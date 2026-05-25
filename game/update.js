import { PHILOSOPHY_DB } from '../db.js';
import { sfx } from '../audio.js';
import { Projectile, MagnetItem } from '../entities.js';

export function gameUpdate(dt) {
  if (isNaN(dt) || dt <= 0) {
    dt = 16.666;
  }
  dt *= this.timeScale;
  this.realSurvivalTimer += dt / 1000;
  this.cumulativeSurvivalTime += dt / 1000;
  if (!this.currentBoss) this.eraSurvivalTime += dt / 1000;

  // Update Guide Panel timer
  if (this.guideTimer && this.guideTimer > 0) {
    this.guideTimer -= dt;
    const guideEl = document.getElementById('guide-panel');
    if (guideEl) {
      if (this.guideTimer <= 15000) {
        const phase1 = document.getElementById('guide-phase-1');
        const phase2 = document.getElementById('guide-phase-2');
        if (phase1 && phase1.style.display !== 'none') {
          phase1.style.display = 'none';
        }
        if (phase2 && phase2.style.display !== 'block') {
          phase2.style.display = 'block';
        }
      }
      if (this.guideTimer <= 500) {
        guideEl.style.opacity = Math.max(0, this.guideTimer / 500);
      }
      if (this.guideTimer <= 0) {
        guideEl.style.display = 'none';
      }
    }
  }

  // Auto-hide guide panel when boss appears
  if (this.currentBoss) {
    const guideEl = document.getElementById('guide-panel');
    if (guideEl && guideEl.style.display !== 'none') {
      guideEl.style.display = 'none';
      this.guideTimer = 0;
    }
  }

  // Update Boss HP Bar Overlay
  const bossHpContainer = document.getElementById('boss-hp-container');
  if (bossHpContainer) {
    if (this.currentBoss && this.currentBoss.hp > 0) {
      bossHpContainer.style.display = 'block';
      const nameEl = document.getElementById('boss-hp-name');
      const valEl = document.getElementById('boss-hp-value');
      const fillEl = document.getElementById('boss-hp-fill');
      const shieldEl = document.getElementById('boss-hp-shield');

      if (nameEl) nameEl.textContent = this.currentBoss.name;
      const displayHp = Math.max(0, this.currentBoss.hp);
      const displayMax = this.currentBoss.maxHp;
      const pct = (displayHp / displayMax) * 100;
      if (fillEl) fillEl.style.width = `${pct}%`;
      if (valEl) valEl.textContent = `${Math.ceil(displayHp)} / ${Math.ceil(displayMax)} (${Math.ceil(pct)}%)`;

      // Invincibility shield animation overlay
      if (shieldEl) {
        shieldEl.style.display = this.currentBoss.isPatternActive ? 'block' : 'none';
      }
    } else {
      bossHpContainer.style.display = 'none';
    }
  }

  // Update Side Gimmick Panel
  const gimmickPanel = document.getElementById('boss-gimmick-panel');
  if (gimmickPanel) {
    if (this.gimmickActive && this.gimmickTimer > 0) {
      gimmickPanel.style.display = 'block';
      const instrEl = document.getElementById('gimmick-instruction');
      const fillEl = document.getElementById('gimmick-timer-fill');

      if (instrEl) instrEl.textContent = this.gimmickInstruction;
      const pct = (this.gimmickTimer / this.gimmickMaxTime) * 100;
      if (fillEl) fillEl.style.width = `${pct}%`;
    } else {
      gimmickPanel.style.display = 'none';
    }
  }

  // Update and tick down global Gimmick timer
  if (this.gimmickActive) {
    if (this.stageIndex === 4 || this.stageIndex === 5) {
      // Stage 5 (Kant) traffic light is persistent.
      // Stage 6 (Nietzsche) safe zone logic is handled in boss.js.
      // We still tick the timer for UI, but skip default failure penalty.
      if (this.stageIndex === 5 && this.gimmickTimer > 0) {
         this.gimmickTimer -= dt;
         if (this.gimmickTimer <= 0) this.gimmickTimer = 0;
      }
    } else {
      this.gimmickTimer -= dt;
      if (this.gimmickTimer <= 0) {
        this.gimmickActive = false;
        this.gimmickTimer = 0;
        
        if (this.player && this.currentBoss) {
        const b = this.currentBoss;
        
        // 2단계 아파테이아 기믹 성공 여부 판정
        if (this.stageIndex === 1) {
          const zone = this.ataraxiaZone;
          const inside = zone && ((this.player.x - zone.x) * (this.player.x - zone.x) + (this.player.y - zone.y) * (this.player.y - zone.y)) < zone.radius * zone.radius;
          if (inside) {
            // SUCCESS!
            b.apatheiaActive = false;
            b.speed = 1.2;
            this.ataraxiaZone = null;
            
            if (this.bgm) {
              try { this.bgm.volume = this.bgmMuted ? 0 : 0.4; } catch (err) {}
            }
            
            b.isPatternActive = false;
            b.isStunned = true;
            b.stunTimer = 8000;
            this.showBossTooltip("🛡️ 평정 달성! 아파테이아의 고요 속에서 보스가 무력화되었습니다!");
            this.addDamageText(b.x, b.y - 70, "✨ 평정 완성! 그로기!", "#2ed573", 24);
            if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
            
            b.apatheiaTimer = 16000;
            return;
          }
        }
        
        // Trigger Gimmick Failure!
        if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
        
        // Take 50% max HP damage
        const penaltyDmg = Math.ceil(this.player.maxHp * 0.5);
        this.player.takeDamage(penaltyDmg, this, b);
        this.addDamageText(this.player.x, this.player.y - 80, `💥 기믹 실패! -${penaltyDmg} HP`, '#ff4757', 24, true);
        this.showBossTooltip("💥 기믹 실패: 제한 시간 내에 공략하지 못해 치명적인 대미지(최대 체력의 50%)를 입었습니다!");
        
        // Apply Stage-specific Gimmick Failure Hit Action
        this.applyUniqueHitAction(this.stageIndex);
        
        b.isPatternActive = false;
        
        if (this.stageIndex === 0) {
          // Sophist split: Clear all clones from enemies array
          this.enemies = this.enemies.filter(e => !(e.isClone && e.parentBoss === b));
          b.clonesList = [];
        } else if (this.stageIndex === 1) {
          // Apatheia: Clear safe zone and resume speed
          b.apatheiaActive = false;
          b.speed = 1.2;
          this.ataraxiaZone = null;
          if (this.bgm) {
            try { this.bgm.volume = this.bgmMuted ? 0 : 0.4; } catch (err) {}
          }
          b.apatheiaTimer = 16000;
        } else if (this.stageIndex === 2) {
          // Dogmatism: Clear candlesticks and darkness
          this.candlesticks = [];
          this.medievalDarkness = false;
          b.dogmatismTimer = 10000;
        } else if (this.stageIndex === 3) {
          // Prejudice: Clear idols
          this.enemies = this.enemies.filter(e => !e.isIdol);
          this.activeIdols.clear();
          this.prejudiceWave = 0;
          this.restoreHUD();
        } else if (this.stageIndex === 4) {
          // Kant: Clear grid lines
          this.gridLines = [];
          this.kantDutyLine = null;
          b.speed = 1.2;
        } else if (this.stageIndex === 5) {
          // Nietzsche: Clear relics
          this.nietzcheRelics = [];
          b.isPatternActive = false;
        }
      }
    }
  }
}

  // Kantian moral rules verification: Traffic Light System
  if (this.stageIndex === 4 && this.currentBoss && this.currentBoss.isPatternActive && this.gimmickActive) {
    const b = this.currentBoss;
    const playerVel = Math.hypot(this.player.vx, this.player.vy);
    const isMoving = playerVel > 0.45; // slightly higher threshold to prevent micro-drift triggers
    
    if (this.kantTrafficLight === 'red' && isMoving && !this.kantViolatedInThisRedTurn) {
      this.kantViolatedInThisRedTurn = true; // prevent multiple damage ticks in same red light turn
      
      if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
      
      const penaltyDmg = Math.ceil(this.player.maxHp * 0.5);
      this.player.takeDamage(penaltyDmg, this, b);
      this.addDamageText(this.player.x, this.player.y - 80, `💥 신호 위반! -${penaltyDmg} HP`, '#ff4757', 24, true);
      this.showBossTooltip(`💥 신호 위반: 빨간불에 움직여 정언명령을 위배하고 시간 속에 속박됩니다!`);
      
      // Apply unique hit action (5단계 칸트: 시간 속박)
      this.applyUniqueHitAction(4);
    }
  }

  // Ataraxia safe zone BGM volume drop
  if (this.ataraxiaZone && this.bgm) {
    const dxZone = this.player.x - this.ataraxiaZone.x;
    const dyZone = this.player.y - this.ataraxiaZone.y;
    const distSq = dxZone * dxZone + dyZone * dyZone;
    try {
      if (distSq < this.ataraxiaZone.radius * this.ataraxiaZone.radius) {
        this.bgm.volume = 0;
      } else {
        this.bgm.volume = this.bgmMuted ? 0 : 0.4;
      }
    } catch (err) {}
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
    let spawnLimit = 50 + this.player.level * 3;
    let spawnChance = 0.08;
    
    if (this.stageIndex >= 5) { // 6단계
      spawnLimit *= 3;
      spawnChance *= 3;
    } else if (this.stageIndex >= 2) { // 3단계 이상 (3, 4, 5단계)
      spawnLimit *= 2;
      spawnChance *= 2;
    }
    
    if (normalEnemyCount < spawnLimit) {
      if (Math.random() < spawnChance * (dt * 0.06)) {
        this.spawnRandomMob();
      }
    }
  }

  this.player.update(dt, this.keys, this.joystick.angle, this.joystick.strength);
  if (this.cameraLocked && this.nietzscheArenaCenter) {
    this.camera.x = this.nietzscheArenaCenter.x;
    this.camera.y = this.nietzscheArenaCenter.y;
  } else {
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
  }
  this.orbitAngle += 0.20 * dt * 0.06;
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
      this.addDamageText(this.player.x, this.player.y - 60, '규율 위반!', '#ffd200', 18);
      this.kantRule = null;
    }
    if (this.kantTimer <= 0) this.kantRule = null;
  }

  // Update enemies (boss first)
  this.enemies.forEach(e => {
    if (e.iceRingDmgTimer > 0) e.iceRingDmgTimer -= dt;
    if (e.type === 'boss' && e.iceFloorDmgTimer > 0) e.iceFloorDmgTimer -= dt;
    
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
    
    // Check for success immediately in the same frame
    if (this.candlesticks.length > 0 && this.candlesticks.every(c => c.lit)) {
      const b = this.currentBoss;
      if (b && b.stageIndex === 2) {
        b.isPatternActive = false;
        this.medievalDarkness = false;
        this.candlesticks = [];
        
        // Clear global gimmick
        this.gimmickActive = false;
        this.gimmickTimer = 0;
        
        b.isStunned = true;
        b.stunTimer = 8000;
        this.showBossTooltip("🛡️ 어둠 극복! 신앙과 이성의 조화로 교독의 환각을 비추었습니다!");
        this.addDamageText(b.x, b.y - 70, "✨ 교조 파괴! 보스 무력화!", "#ffd200", 24);
        if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
        
        // Reward player with a permanent +25% attack bonus
        this.player.dmgMultiplier += 0.25;
        this.addDamageText(this.player.x, this.player.y - 100, "공격력 보너스 +25%!", "#ffd200", 20);
        
        // Reset repeating timer
        b.dogmatismTimer = 16000;
      }
    }
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
        this.showBossTooltip("🦅 허무주의의 그림자: 허무의 잿빛 심연 속에서, 자유와 책임의 유물(🔥)을 다시 모으십시오!");
      } else {
        this.showBossTooltip(null);
      }
    }
  }

  // XP frags
  this.xpFrags.forEach(f => f.update(dt, this.player));
  // Pickup
  const px = this.player.x, py = this.player.y;
  this.xpFrags = this.xpFrags.filter(f => {
    const dx = f.x - px, dy = f.y - py;
    if (dx * dx + dy * dy < 400) { // 20 * 20 = 400
      this.player.gainXp(f.val, this);
      return false;
    }
    return f.hp > 0;
  });

  // Magnet items
  this.magnetItems = this.magnetItems.filter(m => {
    m.update(dt);
    const dx = m.x - px, dy = m.y - py;
    if (dx * dx + dy * dy < 900) { // 30 * 30 = 900
      this.xpFrags.forEach(f => f.magnet = true);
      this.addDamageText(px, py - 60, '자석 활성화!', '#f368e0', 18);
      return false;
    }
    return m.life > 0;
  });

  // Ice floors
  this.iceFloors = this.iceFloors.filter(f => {
    f.life -= dt;
    const fSizeSq = f.size * f.size;
    this.enemies.forEach(e => {
      if (e.hp > 0) {
        const dx = e.x - f.x, dy = e.y - f.y;
        if (dx * dx + dy * dy < fSizeSq) {
          e.slowMul = 0.5;
          e.slowTimer = 100; // 빙판 위 매 프레임 감속 연장
          if (!e.iceFloorDmgTimer || e.iceFloorDmgTimer <= 0) {
            this.dealDamageToEnemy(e, f.dmg);
            e.iceFloorDmgTimer = 1000;
          }
        }
      }
    });
    return f.life > 0;
  });

  // 귀납의 고리 (Ice Ring) - 매 프레임 충돌 검사 및 개별 쿨다운 적용
  const iceRingData = PHILOSOPHY_DB[this.player.lineage].find(c => c.id === 'ice_ring');
  if (iceRingData) {
    const lvl = this.player.activeSkills['ice_ring'] || 0;
    if (lvl > 0) {
      const stats = iceRingData.stats[lvl - 1];
      const isAwakening = lvl >= iceRingData.maxLevel;
      const count = (stats.count || 1) * (isAwakening ? 2 : 1) * 2;
      
      const skillTier = this.player.skillTiers['ice_ring'] || 'normal';
      const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
      const tierMul = tierMuls[skillTier] || 1.0;
      const sizeM = (isAwakening ? 1.1 : 1.0) * this.player.areaMultiplier * (1 + (tierMul - 1) * 0.5);
      const isEmpiricism = this.player.lineage === 'empiricism';
      const dmgM = (isAwakening ? (isEmpiricism ? 4.5 : 1.5) : 1.0) * this.player.dmgMultiplier * tierMul * (1 + (this.player.auraDamageBonus || 0));

      const radius = (stats.radius || 65) * sizeM;
      const dmg = (stats.dmg || 30) * dmgM;

      this.enemies.forEach(e => {
        if (e.hp > 0 && (!e.iceRingDmgTimer || e.iceRingDmgTimer <= 0)) {
          let hit = false;
          const checkLimit = 20 + e.size;
          const checkLimitSq = checkLimit * checkLimit;
          for (let i = 0; i < count; i++) {
            const angle = this.orbitAngle + (Math.PI * 2 / count) * i;
            const ox = px + Math.cos(angle) * radius;
            const oy = py + Math.sin(angle) * radius;
            const dx = e.x - ox, dy = e.y - oy;
            if (dx * dx + dy * dy < checkLimitSq) {
              hit = true;
              break;
            }
          }
          if (hit) {
            this.dealDamageToEnemy(e, dmg);
            e.iceRingDmgTimer = 300; // 0.3초당 1회 타격
          }
        }
      });
    }
  }

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
    if (e.isClone && e.parentBoss && !e.parentBoss.isPatternActive) {
      return false;
    }

    if (e.hp <= 0) {
      if (e.type === 'boss') {
        if (e.isClone) {
          this.spawnXpFrags(e.x, e.y, 10);
          this.spawnParticles(e.x, e.y, '#e84393', 8, 10, -3);
          if (e.parentBoss) {
            if (e.isRealClone) {
              const pb = e.parentBoss;
              pb.isPatternActive = false;
              pb.isStunned = true;
              pb.stunTimer = 6000;
              pb.clonesList.forEach(c => {
                if (c !== e) c.hp = 0;
              });
              pb.clonesList = [];
              this.gimmickActive = false;
              this.gimmickTimer = 0;
              this.showBossTooltip("🛡️ 궤변 극복! 소피스트가 부끄러움에 빠져 방어력이 극도로 감소했습니다!");
              this.addDamageText(pb.x, pb.y - 70, "✨ 논박 완료! 보스 그로기!", "#2ed573", 24);
            } else {
              e.parentBoss.clonesList = e.parentBoss.clonesList.filter(c => c !== e);
              if (e.parentBoss.clonesList.length === 0) {
                e.parentBoss.isPatternActive = false;
                e.parentBoss.isStunned = true;
                e.parentBoss.stunTimer = 6000;
                this.gimmickActive = false;
                this.gimmickTimer = 0;
                this.showBossTooltip("🛡️ 궤변 극복! 소피스트가 부끄러움에 빠져 방어력이 극도로 감소했습니다!");
                this.addDamageText(e.parentBoss.x, e.parentBoss.y - 70, "✨ 논박 완료! 보스 그로기!", "#2ed573", 24);
              }
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

export function handleWeaponTriggers(dt) {
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

export function getNearestEnemy() {
  let nearest = null, minDistSq = 999999999;
  const px = this.player.x, py = this.player.y;
  this.enemies.forEach(e => {
    if (e.hp <= 0) return;
    const dx = e.x - px;
    const dy = e.y - py;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) { minDistSq = dSq; nearest = e; }
  });
  return nearest;
}

export function fireWeapon(id, lvl, stats, awakening) {
  const skillTier = this.player.skillTiers[id] || 'normal';
  const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
  const tierMul = tierMuls[skillTier] || 1.0;

  const sizeM = (awakening ? 1.1 : 1.0) * this.player.areaMultiplier * (1 + (tierMul - 1) * 0.5);
  const isEmpiricism = this.player.lineage === 'empiricism';
  const dmgM = (awakening ? (isEmpiricism ? 4.5 : 1.5) : 1.0) * this.player.dmgMultiplier * tierMul * (1 + (this.player.auraDamageBonus || 0));

  if (id === 'fire_projectile') {
    const target = this.getNearestEnemy();
    const tx = target ? target.x : this.player.x + Math.cos(this.player.faceAngle) * 300;
    const ty = target ? target.y : this.player.y + Math.sin(this.player.faceAngle) * 300;
    const sz = (stats.size || 50) * sizeM * 0.5;
    const dmg = (stats.dmg || 35) * dmgM;
    this.projectiles.push(new Projectile(this.player.x, this.player.y, tx, ty, 6 * (1 + (this.player.auraProjSpeedBonus || 0)), sz, dmg, '#ff4757', 'fire_explosion'));
    sfx.playFireShoot();
  }

  if (id === 'fire_aura') {
    const radius = (stats.radius || 95) * sizeM;
    const radiusSq = radius * radius;
    const dmg = (stats.dmg || 16) * dmgM;
    const px = this.player.x, py = this.player.y;
    this.enemies.forEach(e => {
      if (e.hp > 0) {
        const dx = e.x - px, dy = e.y - py;
        if (dx * dx + dy * dy < radiusSq) {
          this.dealDamageToEnemy(e, dmg);
          this.spawnParticles(e.x, e.y, '#ff4757', 3, 5, -2);
        }
      }
    });
    this.spawnParticles(px, py, '#ff6b35', 6, 8, -3);
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
    const spd = (stats.speed || 6) * (1 + (this.player.auraProjSpeedBonus || 0));
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const p = new Projectile(
        this.player.x, this.player.y,
        this.player.x + Math.cos(angle), this.player.y + Math.sin(angle),
        spd, (20 + (lvl * 5)) * sizeM * 0.5, dmg, '#ff4757', 'fire_sword');
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
    const p = new Projectile(this.player.x, this.player.y, tx, ty, (stats.speed || 8) * (1 + (this.player.auraProjSpeedBonus || 0)), sz, dmg, '#00d2d3', 'ice_pierce');
    p.pierceLeft = awakening ? 999 : (stats.pierce || 2);
    p.slowAmount = (stats.slow || 0.35) * (1 + this.player.slowBonus);
    this.projectiles.push(p);
    sfx.playFreeze();
  }

  if (id === 'ice_floor') {
    const sz = (stats.size || 100) * sizeM;
    this.iceFloors.push({ x: this.player.x, y: this.player.y, size: sz, life: stats.duration || 3500,
      dmg: (stats.dmg || 10) * dmgM * 10 });
    this.spawnParticles(this.player.x, this.player.y, '#00d2d3', 8, 6, -2);
    sfx.playFreeze();
  }

  if (id === 'ice_freeze') {
    const radius = (stats.radius || 170) * sizeM;
    const radiusSq = radius * radius;
    const dmg = (stats.dmg || 50) * dmgM;
    const px = this.player.x, py = this.player.y;
    this.enemies.forEach(e => {
      if (e.hp > 0) {
        const dx = e.x - px, dy = e.y - py;
        if (dx * dx + dy * dy < radiusSq) {
          if (e.type !== 'boss' && !e.isClone) {
            e.frozenTime = stats.freezeTime || 2000;
          }
          this.dealDamageToEnemy(e, dmg);
        }
      }
    });
    this.spawnParticles(px, py, '#a8e6f0', 12, 10, -3);
    sfx.playFreeze();
  }

  if (id === 'ice_ring') {
    // Handled dynamically every frame in gameUpdate
  }
}

export function handleCombatCollisions() {
  const projectiles = this.projectiles;
  const enemies = this.enemies;
  const numProj = projectiles.length;
  const numEnemies = enemies.length;
  
  for (let i = 0; i < numProj; i++) {
    const proj = projectiles[i];
    if (proj.life <= 0) continue;
    const px = proj.x;
    const py = proj.y;
    const pSize = proj.size;
    
    for (let j = 0; j < numEnemies; j++) {
      const e = enemies[j];
      if (e.hp <= 0 || proj.hitEnemy.has(e)) continue;
      
      const dx = e.x - px;
      const dy = e.y - py;
      const distSq = dx * dx + dy * dy;
      const limit = pSize + e.size;
      
      if (distSq < limit * limit) {
        proj.hitEnemy.add(e);
        this.dealDamageToEnemy(e, proj.dmg, proj);
        if (proj.slowAmount && e.frozenTime <= 0) {
          e.slowMul = 1 - proj.slowAmount;
          e.slowTimer = 3000; // 3초 감속
        }
        if (proj.type === 'fire_explosion') {
          const expRadius = pSize * 1.4;
          const expRadiusSq = expRadius * expRadius;
          for (let k = 0; k < numEnemies; k++) {
            const e2 = enemies[k];
            if (e2 !== e && e2.hp > 0) {
              const dx2 = e2.x - px;
              const dy2 = e2.y - py;
              if (dx2 * dx2 + dy2 * dy2 < expRadiusSq) {
                this.dealDamageToEnemy(e2, proj.dmg * 0.6);
              }
            }
          }
          this.spawnParticles(px, py, '#ff4757', 10, 10, -3);
          proj.life = 0;
        } else if (proj.type !== 'fire_sword' && proj.type !== 'ice_pierce') {
          proj.life = 0;
        } else {
          proj.pierceLeft = (proj.pierceLeft || 1) - 1;
          if (proj.pierceLeft <= 0) proj.life = 0;
        }
        if (proj.life <= 0) break;
      }
    }
  }
}

export function dealDamageToEnemy(e, dmg, proj) {
  if (e.isClone && !e.isRealClone) {
    this.addDamageText(e.x, e.y - e.size - 10, "Miss (궤변)", "#7f8c8d", 14, false);
    return;
  }

  if (e.type === 'boss' && e.isPatternActive && e.stageIndex !== 4) {
    this.addDamageText(e.x, e.y - e.size - 10, "🛡️ 무적 (기믹 진행 중)", "#a4b0be", 14, false);
    this.spawnParticles(e.x, e.y, '#ffffff', 3, 5, -2);
    return;
  }

  const isCrit = Math.random() < (0.15 + (this.player.auraCritChance || 0));
  let baseMultiplier = isCrit ? (1.5 * this.player.critMultiplier) : 1;
  
  // Double damage against groggy (stunned) boss
  if (e.type === 'boss' && e.isStunned) {
    baseMultiplier *= 2;
  }
  
  const finalDmg = Math.floor(dmg * baseMultiplier);
  e.hp -= finalDmg;
  
  const dmgColor = (e.type === 'boss' && e.isStunned) ? '#ff9f43' : (isCrit ? '#ffd200' : '#fff');
  const dmgSize = (e.type === 'boss' && e.isStunned) ? 22 : (isCrit ? 20 : 14);
  this.addDamageText(e.x, e.y - e.size - 10, (e.type === 'boss' && e.isStunned ? "🔥 2x!! " : "") + finalDmg, dmgColor, dmgSize, isCrit || (e.type === 'boss' && e.isStunned));
  
  if (this.player.auraLifesteal > 0) {
    this.player.heal(Math.ceil(finalDmg * this.player.auraLifesteal));
    this.spawnParticles(e.x, e.y, '#e84118', 4, 6, -3);
  }
}
