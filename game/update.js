import { PHILOSOPHY_DB } from '../db.js';
import { sfx } from '../audio.js';
import { Projectile, MagnetItem } from '../entities.js';

export function gameUpdate(dt) {
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
      this.addDamageText(this.player.x, this.player.y - 60, '규율 위반!', '#ffd200', 18);
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
  let nearest = null, minDist = 99999;
  this.enemies.forEach(e => {
    const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
    if (d < minDist) { minDist = d; nearest = e; }
  });
  return nearest;
}

export function fireWeapon(id, lvl, stats, awakening) {
  const skillTier = this.player.skillTiers[id] || 'normal';
  const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
  const tierMul = tierMuls[skillTier] || 1.0;

  const sizeM = (awakening ? 1.1 : 1.0) * this.player.areaMultiplier * (1 + (tierMul - 1) * 0.5);
  const dmgM = (awakening ? 1.5 : 1.0) * this.player.dmgMultiplier * tierMul * (1 + (this.player.auraDamageBonus || 0));

  if (id === 'fire_projectile') {
    const target = this.getNearestEnemy();
    const tx = target ? target.x : this.player.x + Math.cos(this.player.faceAngle) * 300;
    const ty = target ? target.y : this.player.y + Math.sin(this.player.faceAngle) * 300;
    const sz = (stats.size || 50) * sizeM;
    const dmg = (stats.dmg || 35) * dmgM;
    this.projectiles.push(new Projectile(this.player.x, this.player.y, tx, ty, 6 * (1 + (this.player.auraProjSpeedBonus || 0)), sz, dmg, '#ff4757', 'fire_explosion'));
    sfx.playFireShoot();
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
    const spd = (stats.speed || 6) * (1 + (this.player.auraProjSpeedBonus || 0));
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
    const p = new Projectile(this.player.x, this.player.y, tx, ty, (stats.speed || 8) * (1 + (this.player.auraProjSpeedBonus || 0)), sz, dmg, '#00d2d3', 'ice_pierce');
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

export function handleCombatCollisions() {
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

export function dealDamageToEnemy(e, dmg, proj) {
  if (e.isClone) {
    this.addDamageText(e.x, e.y - e.size - 10, "Miss (궤변)", "#7f8c8d", 14, false);
    return;
  }

  const isCrit = Math.random() < (0.15 + (this.player.auraCritChance || 0));
  const finalDmg = Math.floor(dmg * (isCrit ? (1.5 * this.player.critMultiplier) : 1));
  e.hp -= finalDmg;
  this.addDamageText(e.x, e.y - e.size - 10, finalDmg, isCrit ? '#ffd200' : '#fff', isCrit ? 20 : 14, isCrit);
  if (this.player.auraLifesteal > 0) {
    this.player.heal(Math.ceil(finalDmg * this.player.auraLifesteal));
    this.spawnParticles(e.x, e.y, '#e84118', 4, 6, -3);
  }
}
