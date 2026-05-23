import { PHILOSOPHY_DB, AURA_DB, EVOLUTION_STAGES } from './db.js';
import { sfx } from './audio.js';

// ─── BOSS BULLET ────────────────────────────────────────────────────
export class BossBullet {
  constructor(x, y, angle, speed, type) {
    this.x = x; this.y = y; this.angle = angle; this.speed = speed;
    this.type = type; this.size = 10; this.life = 7000; this.time = 0;
    this.baseAngle = angle; this.spawnX = x; this.spawnY = y;
    this.color = type === 'spiral' ? '#ff6b81' : type === 'curve' ? '#a29bfe' : '#ff4757';
  }
  update(dt, player) {
    this.time += dt;
    if (this.type === 'spiral') {
      this.angle = this.baseAngle + this.time * 0.002;
    } else if (this.type === 'curve') {
      this.angle = this.baseAngle + Math.sin(this.time * 0.003) * 1.2;
    }
    this.x += Math.cos(this.angle) * this.speed * dt * 0.06;
    this.y += Math.sin(this.angle) * this.speed * dt * 0.06;
    this.life -= dt;
    const dx = this.x - player.x, dy = this.y - player.y;
    if (Math.hypot(dx, dy) < this.size + player.size && !player.isInvincible) {
      const dmg = 18;
      player.takeDamage(dmg, window.gameInstance);
      this.life = 0;
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}

// ─── WARNING ZONE ────────────────────────────────────────────────────
export class WarningZone {
  constructor(x, y, radius, damage, delay) {
    this.x = x; this.y = y; this.radius = radius; this.damage = damage;
    this.delay = delay; this.timer = 0; this.life = delay + 400;
    this.hasDetonated = false;
  }
  update(dt, game) {
    this.timer += dt;
    if (this.timer >= this.delay && !this.hasDetonated) {
      this.hasDetonated = true;
      const p = game.player;
      if (Math.hypot(p.x - this.x, p.y - this.y) < this.radius && !p.isInvincible) {
        p.takeDamage(this.damage, game);
      }
      game.spawnParticles(this.x, this.y, '#ff4757', 6, 15, -3);
      this.life = 0;
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const pct = Math.min(this.timer / this.delay, 1);
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,71,87,${0.3 + pct * 0.5})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,71,87,${pct * 0.15})`;
    ctx.fill();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

// ─── PARTICLE ───────────────────────────────────────────────────────
export class Particle {
  constructor(x, y, color, size, vx, vy, life, gravity=0, mode='normal') {
    this.x = x; this.y = y; this.color = color; this.size = size;
    this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life;
    this.gravity = gravity; this.mode = mode; this.wordText = ''; this.hp = life;
  }
  update(dt) {
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.vy += this.gravity * dt * 0.06;
    this.life -= dt; this.hp = this.life;
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.mode === 'word') {
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = this.color; ctx.shadowBlur = 8;
      ctx.fillText(this.wordText, rx, ry);
    } else {
      ctx.beginPath();
      ctx.arc(rx, ry, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color; ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();
  }
}

// ─── DAMAGE TEXT ────────────────────────────────────────────────────
export class DamageText {
  constructor(x, y, val, color, size, isCrit=false) {
    this.x = x; this.y = y; this.val = val; this.color = color;
    this.size = size || 16; this.isCrit = isCrit;
    this.life = isCrit ? 1200 : 900; this.maxLife = this.life;
    this.vy = isCrit ? -2.5 : -1.8;
  }
  update(dt) { this.life -= dt; this.y += this.vy * dt * 0.06; }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.isCrit ? this.size * 1.4 : this.size}px Outfit, sans-serif`;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.shadowColor = this.color; ctx.shadowBlur = this.isCrit ? 12 : 4;
    ctx.strokeText(String(this.val), rx, ry);
    ctx.fillText(String(this.val), rx, ry);
    ctx.restore();
  }
}

// ─── XP FRAGMENT ────────────────────────────────────────────────────
export class XPFrag {
  constructor(x, y, val) {
    this.x = x; this.y = y; this.val = val;
    this.size = Math.min(8, 4 + val * 0.5);
    this.hp = 1; this.magnet = false;
    this.vx = (Math.random() - 0.5) * 3; this.vy = (Math.random() - 0.5) * 3;
    this.color = val >= 5 ? '#ffd200' : '#2ed573';
  }
  update(dt, player) {
    if (this.magnet) {
      const dx = player.x - this.x, dy = player.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      this.x += (dx / d) * 12 * dt * 0.06;
      this.y += (dy / d) * 12 * dt * 0.06;
    } else {
      const dx = player.x - this.x, dy = player.y - this.y;
      if (Math.hypot(dx, dy) < 140) {
        this.x += (dx / Math.hypot(dx, dy)) * 5 * dt * 0.06;
        this.y += (dy / Math.hypot(dx, dy)) * 5 * dt * 0.06;
      }
      this.vx *= 0.93; this.vy *= 0.93;
      this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

// ─── MAGNET ITEM ────────────────────────────────────────────────────
export class MagnetItem {
  constructor(x, y) {
    this.x = x; this.y = y; this.size = 16; this.life = 15000;
    this.pulse = 0;
  }
  update(dt) { this.life -= dt; this.pulse += dt * 0.005; }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const s = this.size + Math.sin(this.pulse) * 3;
    ctx.save();
    ctx.font = `${s * 2}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f368e0'; ctx.shadowBlur = 12;
    ctx.fillText('🧲', rx, ry);
    ctx.restore();
  }
}

// ─── ENEMY ──────────────────────────────────────────────────────────
export class Enemy {
  constructor(x, y, playerLevel, mobType) {
    this.x = x; this.y = y; this.type = 'enemy';
    this.isIdol = false; this.isClone = false;
    const lvMul = 1 + (playerLevel - 1) * 0.12;
    const mobDefs = {
      orc:    {hp:55,spd:1.7,sz:16,col:'#a55eea',xp:2},
      beast:  {hp:70,spd:2.1,sz:15,col:'#ff9f43',xp:2},
      undead: {hp:90,spd:1.4,sz:18,col:'#576574',xp:3},
      golem:  {hp:130,spd:1.2,sz:22,col:'#747d8c',xp:3},
      steam:  {hp:110,spd:1.8,sz:17,col:'#57606f',xp:3},
      machine:{hp:150,spd:2.2,sz:16,col:'#2f3542',xp:4}
    };
    const d = mobDefs[mobType] || mobDefs.orc;
    this.maxHp = Math.floor(d.hp * lvMul);
    this.hp = this.maxHp; this.speed = d.spd; this.size = d.sz;
    this.color = d.col; this.xpVal = d.xp; this.mobType = mobType;
    this.frozenTime = 0; this.slowMul = 1; this.slowTimer = 0; this.iceFloorDmgTimer = 0;
    this.vx = 0; this.vy = 0;
    this.angle = 0;
  }
  update(dt, player) {
    if (this.frozenTime > 0) { this.frozenTime -= dt; return; }
    if (this.iceFloorDmgTimer > 0) this.iceFloorDmgTimer -= dt;
    
    let currentSlowMul = this.slowMul;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMul = 1;
        currentSlowMul = 1;
      }
    } else {
      this.slowMul = 1;
      currentSlowMul = 1;
    }
    
    // 플레이어의 지배/영생 아우라로 인한 근접 적 25% 감속 및 파란색 시각 효과 처리
    if (player.auraEnemySlowAura && Math.hypot(player.x - this.x, player.y - this.y) < 180) {
      currentSlowMul = Math.min(currentSlowMul, 0.75);
      this.slowTimer = Math.max(this.slowTimer, 100); // 파란색 표시 유지를 위해 slowTimer 연장
    }

    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const spd = this.speed * currentSlowMul;
    this.vx = (dx / d) * spd; this.vy = (dy / d) * spd;
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.angle = Math.atan2(dy, dx);
    if (!player.isInvincible && Math.hypot(this.x - player.x, this.y - player.y) < this.size + player.size) {
      player.takeDamage(12, window.gameInstance);
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    if (this.frozenTime > 0) {
      ctx.fillStyle = '#a8e6f0'; ctx.shadowColor = '#00d2d3'; ctx.shadowBlur = 10;
    } else if (this.slowMul < 1) {
      ctx.fillStyle = '#54a0ff'; ctx.shadowColor = '#00d2d3'; ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = this.color;
    }
    ctx.beginPath(); ctx.arc(rx, ry, this.size, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    const ex = Math.cos(this.angle) * this.size * 0.5;
    const ey = Math.sin(this.angle) * this.size * 0.5;
    ctx.beginPath(); ctx.arc(rx + ex, ry + ey, 3, 0, Math.PI * 2); ctx.fill();
    // HP bar
    if (this.hp < this.maxHp) {
      const bw = this.size * 2, bh = 4, bx = rx - this.size, by = ry - this.size - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#2ed573'; ctx.fillRect(bx, by, bw * this.hp / this.maxHp, bh);
    }
    ctx.restore();
  }
}

// ─── CANDLESTICK (Stage 3 Pattern) ──────────────────────────────────
export class Candlestick {
  constructor(x, y, label) {
    this.x = x; this.y = y; this.label = label;
    this.lit = false; this.size = 20;
  }
  update(player, game) {
    if (!this.lit && Math.hypot(player.x - this.x, player.y - this.y) < this.size + player.size) {
      this.lit = true;
      game.spawnParticles(this.x, this.y, '#ffd200', 15, 8, -3);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    ctx.shadowColor = this.lit ? '#ffd200' : '#7f8c8d';
    ctx.shadowBlur = this.lit ? 15 : 4;
    ctx.fillStyle = this.lit ? '#ffd200' : '#4b6584';
    ctx.beginPath(); ctx.arc(rx, ry, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, rx, ry + 35);
    ctx.font = '16px sans-serif';
    ctx.fillText(this.lit ? '🔥' : '🕯️', rx, ry + 5);
    ctx.restore();
  }
}

// ─── RHYTHMIC GRID LINE (Stage 5 Pattern) ───────────────────────────
export class RhythmicGridLine {
  constructor(isVertical, coord, game) {
    this.isVertical = isVertical;
    this.coord = coord;
    this.tickCount = 0;
    this.timer = 0;
    this.flash = false;
    this.detonated = false;
    this.life = 4000;
  }
  update(dt, game) {
    this.timer += dt;
    if (this.timer >= 1000) {
      this.timer -= 1000;
      this.tickCount++;
      this.flash = true;
      setTimeout(() => { this.flash = false; }, 150);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      
      if (this.tickCount >= 4 && !this.detonated) {
        this.detonate(game);
      }
    }
  }
  detonate(game) {
    this.detonated = true;
    this.life = 0;
    if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
    
    const W = game.canvas.width;
    if (this.isVertical) {
      game.spawnParticles(this.coord, game.player.y, '#ff4757', 15, 12, -4);
      if (Math.abs(game.player.x - this.coord) < 25) {
        game.player.takeDamage(20, game, null);
        game.addDamageText(game.player.x, game.player.y - 60, '⚡ 정언명령 충격!', '#ff4757', 18);
      }
    } else {
      game.spawnParticles(game.player.x, this.coord, '#ff4757', 15, 12, -4);
      if (Math.abs(game.player.y - this.coord) < 25) {
        game.player.takeDamage(20, game, null);
        game.addDamageText(game.player.x, game.player.y - 60, '⚡ 정언명령 충격!', '#ff4757', 18);
      }
    }
  }
  draw(ctx, camera, W, H) {
    ctx.save();
    const rx = this.isVertical ? this.coord - camera.x + W / 2 : 0;
    const ry = this.isVertical ? 0 : this.coord - camera.y + H / 2;
    
    if (this.flash) {
      ctx.strokeStyle = 'rgba(255, 210, 0, 0.9)';
      ctx.lineWidth = 8;
    } else {
      ctx.strokeStyle = `rgba(255, 71, 87, ${0.3 + (this.tickCount / 5) * 0.5})`;
      ctx.lineWidth = 3;
    }
    
    ctx.beginPath();
    if (this.isVertical) {
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, H);
    } else {
      ctx.moveTo(0, ry);
      ctx.lineTo(W, ry);
    }
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Outfit, sans-serif';
    if (this.isVertical) {
      ctx.fillText(`TICK ${this.tickCount}/4`, rx + 10, H / 2 + 50);
    } else {
      ctx.fillText(`TICK ${this.tickCount}/4`, W / 2 + 50, ry - 10);
    }
    ctx.restore();
  }
}

// ─── NIETZSCHE RELIC (Stage 6 Pattern) ─────────────────────────────
export class NietzscheRelic {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type;
    this.collected = false;
    this.size = 20;
  }
  update(player, game) {
    if (!this.collected && Math.hypot(player.x - this.x, player.y - this.y) < this.size + player.size) {
      this.collected = true;
      game.spawnParticles(this.x, this.y, this.type === 'freedom' ? '#ff9f43' : '#54a0ff', 15, 8, -3);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      
      const relics = game.nietzcheRelics;
      if (relics && relics.every(r => r.collected)) {
        game.triggerUbermenschMode();
      }
    }
  }
  draw(ctx, camera) {
    if (this.collected) return;
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    const isFreedom = this.type === 'freedom';
    ctx.shadowColor = isFreedom ? '#ff9f43' : '#54a0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = isFreedom ? '#ff9f43' : '#54a0ff';
    ctx.beginPath(); ctx.arc(rx, ry, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isFreedom ? '🗽 자유' : '⚖️ 책임', rx, ry + 32);
    ctx.font = '16px sans-serif';
    ctx.fillText(isFreedom ? '🗽' : '⚖️', rx, ry + 6);
    ctx.restore();
  }
}

// ─── BOSS ───────────────────────────────────────────────────────────
export class Boss {
  constructor(x, y, playerLevel, name, stageIndex) {
    this.x = x; this.y = y; this.type = 'boss'; this.isIdol = false;
    this.name = name; this.stageIndex = stageIndex;
    const baseHps = [3000, 5000, 8000, 12000, 18000, 42000];
    this.maxHp = (baseHps[stageIndex] || 5000) * (1 + (playerLevel - 1) * 0.1);
    this.hp = this.maxHp; this.size = 38; this.speed = 1.2;
    this.color = '#e84393'; this.xpVal = 50;
    this.attackTimer = 0; this.attackCd = 1800;
    this.phase2 = false; this.angle = 0; this.time = 0;
    this.clones = [];
    this.vx = 0; this.vy = 0;
    this.frozenTime = 0; this.slowMul = 1; this.slowTimer = 0;

    // Pattern & Vulnerability States
    this.isPatternActive = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.isClone = false;
  }

  update(dt, player, game) {
    if (this.frozenTime > 0) { this.frozenTime -= dt; return; }

    // Stun logic
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        // Stage-specific recovery
        if (this.stageIndex === 5 && this.hp > 0 && !game.uberMenschMode) {
          this.isPatternActive = true;
          game.spawnNietzcheRelics();
          game.showBossTooltip("🦅 니체: 허무주의의 잿빛 심연 속에서, 자유와 책임의 유물(🔥)을 다시 모으십시오!");
        } else {
          game.showBossTooltip(null);
        }
      }
      if (Math.random() < 0.12) {
        game.spawnParticles(this.x, this.y, '#ffd200', 1, 4, -2);
      }
      return; // Do not move or attack while stunned
    }

    let currentSlowMul = this.slowMul;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMul = 1;
        currentSlowMul = 1;
      }
    } else {
      this.slowMul = 1;
      currentSlowMul = 1;
    }

    if (player.auraEnemySlowAura && Math.hypot(player.x - this.x, player.y - this.y) < 180) {
      currentSlowMul = Math.min(currentSlowMul, 0.75);
      this.slowTimer = Math.max(this.slowTimer, 100);
    }

    this.time += dt;

    // Phase 2 transition
    if (this.hp < this.maxHp * 0.5 && !this.phase2) {
      this.phase2 = true;
      this.attackCd = Math.max(800, this.attackCd * 0.65);
      game.addDamageText(this.x, this.y - 60, '⚠ 광분 돌입!', '#ff4757', 22);
    }

    // ─── STAGE SPECIFIC MECHANICS ────────────────────────────────────
    
    // Stage 1 (Sophist): Clones split
    if (this.stageIndex === 0 && !this.isClone) {
      if (!this.splitMilestones) {
        this.splitMilestones = [0.70, 0.40, 0.10];
        this.milestonesTriggered = [false, false, false];
        this.clonesList = [];
      }
      for (let i = 0; i < this.splitMilestones.length; i++) {
        const milestone = this.splitMilestones[i];
        if (this.hp / this.maxHp <= milestone && !this.milestonesTriggered[i]) {
          this.milestonesTriggered[i] = true;
          this.triggerSophistSplit(game);
          break;
        }
      }
    }

    // Stage 2 (Apatheia): Safe quiet zone
    if (this.stageIndex === 1 && !this.isClone) {
      if (!this.apatheiaInitialized) {
        this.apatheiaInitialized = true;
        this.apatheiaTimer = 8000;
        this.apatheiaActive = false;
        this.apatheiaTimeLeft = 0;
      }

      if (this.apatheiaActive) {
        this.apatheiaTimeLeft -= dt;
        this.speed = 0;
        if (this.apatheiaTimeLeft <= 0) {
          this.apatheiaActive = false;
          this.isPatternActive = false;
          this.speed = 1.2;
          
          if (game.ataraxiaZone) {
            const dZone = Math.hypot(player.x - game.ataraxiaZone.x, player.y - game.ataraxiaZone.y);
            if (dZone < game.ataraxiaZone.radius) {
              this.isStunned = true;
              this.stunTimer = 6000;
              game.showBossTooltip("🛡️ 평정 달성! 격정의 아바타가 이성적인 고요함 속에 침묵했습니다!");
              game.addDamageText(this.x, this.y - 70, "✨ 평정 달성! 그로기!", "#2ed573", 24);
              if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
            } else {
              player.takeDamage(50, game, this);
              game.showBossTooltip("💥 격정 폭발! 감정에 휩쓸려 치명적인 피해를 받았습니다!");
            }
            game.ataraxiaZone = null;
            game.bgm.volume = game.bgmMuted ? 0 : 0.4;
          }
          this.apatheiaTimer = 16000;
        }
        return; // Channeling safe zone
      } else {
        this.apatheiaTimer -= dt;
        if (this.apatheiaTimer <= 0) {
          this.apatheiaActive = true;
          this.isPatternActive = true;
          this.apatheiaTimeLeft = 5000;
          
          const angle = Math.random() * Math.PI * 2;
          const dist = 120 + Math.random() * 100;
          game.ataraxiaZone = {
            x: player.x + Math.cos(angle) * dist,
            y: player.y + Math.sin(angle) * dist,
            radius: 110
          };
          game.showBossTooltip("🟢 아파테이아: 모든 격정에서 벗어난 고요한 영역(🟢)을 찾으십시오! BGM이 멈추는 평정 속에 안식처가 있습니다.");
          if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
        }
      }
    }

    // Stage 3 (Dogmatism): Medieval Darkness & Candlesticks
    if (this.stageIndex === 2 && !this.isClone) {
      if (!this.dogmatismInitialized) {
        this.dogmatismInitialized = true;
        this.dogmatismMilestones = [1.0, 0.45];
        this.dogmatismMilestonesTriggered = [false, false];
      }
      for (let i = 0; i < this.dogmatismMilestones.length; i++) {
        const milestone = this.dogmatismMilestones[i];
        if (this.hp / this.maxHp <= milestone && !this.dogmatismMilestonesTriggered[i]) {
          this.dogmatismMilestonesTriggered[i] = true;
          this.isPatternActive = true;
          game.medievalDarkness = true;
          game.showBossTooltip("🕯️ 교조주의: 교리가 세상을 어둠으로 덮었습니다! 신앙과 이성의 촛대(🕯️)를 활성화하여 빛을 찾으십시오!");
          game.candlesticks = [
            new Candlestick(this.x - 220, this.y - 100, "신앙의 촛대 (Faith)"),
            new Candlestick(this.x + 220, this.y + 100, "이성의 촛대 (Reason)")
          ];
          break;
        }
      }
      if (this.isPatternActive && game.candlesticks && game.candlesticks.length > 0) {
        const allLit = game.candlesticks.every(c => c.lit);
        if (allLit) {
          this.isPatternActive = false;
          game.medievalDarkness = false;
          game.candlesticks = [];
          this.isStunned = true;
          this.stunTimer = 8000;
          game.showBossTooltip("🛡️ 어둠 극복! 신앙과 이성의 조화로 교독의 환각을 비추었습니다!");
          game.addDamageText(this.x, this.y - 70, "✨ 교조 파괴! 보스 무력화!", "#ffd200", 24);
          if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
        }
      }
    }

    // Stage 4 (Idols of Prejudice): Scrambled sensory waves
    if (this.stageIndex === 3 && !this.isClone) {
      if (!this.prejudiceInitialized) {
        this.prejudiceInitialized = true;
        this.isPatternActive = true;
        this.prejudiceTimer = 0;
        game.prejudiceWave = 0;
        game.showBossTooltip("🗿 편견의 우상: 4대 우상이 활성화되었습니다! 우상을 먼저 모두 제거하십시오! 편견의 왜곡이 지속됩니다!");
      }
      if (this.isPatternActive) {
        let allDead = true;
        game.activeIdols.forEach((idol) => { if (idol.hp > 0) allDead = false; });
        if (allDead && game.activeIdols.size > 0) {
          game.activeIdols.clear();
          this.isPatternActive = false;
          game.prejudiceWave = 0;
          game.restoreHUD();
          this.isStunned = true;
          this.stunTimer = 8000;
          game.showBossTooltip("🛡️ 우상 타파! 편견의 장벽이 무너지고 거인이 무력화되었습니다!");
          game.addDamageText(this.x, this.y - 70, "✨ 편견 해방! 그로기!", "#2ed573", 24);
          if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
        } else {
          this.prejudiceTimer += dt;
          if (this.prejudiceTimer >= 10000) {
            this.prejudiceTimer = 0;
            const nextWave = (game.prejudiceWave % 3) + 1;
            game.prejudiceWave = nextWave;
            game.restoreHUD();
            if (nextWave === 1) {
              game.showBossTooltip("🎭 극장의 우상: 연극 무대의 허상! 잔상(🎭)이 당신의 눈을 어지럽힙니다!");
            } else if (nextWave === 2) {
              game.showBossTooltip("🏪 시장의 우상: 언어의 왜곡! 이성 정보 창(🏪)이 해킹되고 변조됩니다!");
            } else if (nextWave === 3) {
              game.showBossTooltip("🕳️ 동굴의 우상: 개인적인 왜곡! 어둠 속 시야(🕳️)가 고립됩니다!");
            }
            if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
          }
        }
      }
    }

    // Stage 5 (Kant Clock): Rhythmic blast cycles
    if (this.stageIndex === 4 && !this.isClone) {
      if (!this.kantInitialized) {
        this.kantInitialized = true;
        this.isPatternActive = true;
        this.kantCycle = 1;
        this.kantTimer = 0;
        this.kantCycleDuration = 8000;
        this.spawnedGridLines = false;
        game.showBossTooltip("⏰ 도덕적 정언명령: 절대 법칙의 리듬에 맞추어 격자 경고선(💥)을 회피하십시오! 3사이클 생존 시 약화됩니다.");
      }

      if (this.isPatternActive) {
        this.speed = 0.3; // Stays mostly centered like a ticking clock
        this.kantTimer += dt;

        if (!this.spawnedGridLines) {
          this.spawnedGridLines = true;
          game.gridLines = [];
          const px = player.x, py = player.y;
          if (this.kantCycle === 1) {
            game.gridLines.push(new RhythmicGridLine(false, py - 120, game));
            game.gridLines.push(new RhythmicGridLine(false, py, game));
            game.gridLines.push(new RhythmicGridLine(false, py + 120, game));
          } else if (this.kantCycle === 2) {
            game.gridLines.push(new RhythmicGridLine(true, px - 120, game));
            game.gridLines.push(new RhythmicGridLine(true, px, game));
            game.gridLines.push(new RhythmicGridLine(true, px + 120, game));
          } else {
            game.gridLines.push(new RhythmicGridLine(false, py - 90, game));
            game.gridLines.push(new RhythmicGridLine(false, py + 90, game));
            game.gridLines.push(new RhythmicGridLine(true, px - 90, game));
            game.gridLines.push(new RhythmicGridLine(true, px + 90, game));
          }
        }

        if (this.kantTimer >= this.kantCycleDuration) {
          this.kantTimer = 0;
          this.kantCycle++;
          this.spawnedGridLines = false;

          if (this.kantCycle > 3) {
            this.isPatternActive = false;
            this.speed = 1.2;
            game.gridLines = [];
            this.isStunned = true;
            this.stunTimer = 8000;
            game.showBossTooltip("🛡️ 실천이성 달성! 의무론의 원칙에 따라 칸트가 무력화되었습니다!");
            game.addDamageText(this.x, this.y - 70, "✨ 실천 완료! 보스 무력화!", "#2ed573", 24);
            if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
          } else {
            game.showBossTooltip(`⏰ 도덕적 정언명령: [사이클 ${this.kantCycle}/3] 절대 법칙의 기하학적 리듬이 거세집니다!`);
          }
        }
      }
    }

    // Stage 6 (Nietzsche Relics): Nihilism grayscale relief
    if (this.stageIndex === 5 && !this.isClone) {
      if (!this.nietzcheInitialized) {
        this.nietzcheInitialized = true;
        this.isPatternActive = true;
        game.spawnNietzcheRelics = () => {
          game.nietzcheRelics = [
            new NietzscheRelic(player.x - 180, player.y - 80, 'freedom'),
            new NietzscheRelic(player.x + 180, player.y + 80, 'responsibility')
          ];
        };
        game.spawnNietzcheRelics();
        game.showBossTooltip("🦅 니체: 허무주의의 잿빛 심연 속에서, 자유와 책임의 유물(🔥)을 쟁취하여 초인(Übermensch)으로 각성하십시오!");
      }
    }

    // Clone animation sway
    if (this.isClone) {
      this.swayPhase = (this.swayPhase || 0) + (this.swaySpeed || 0.05) * dt;
    }

    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const spd = (this.phase2 ? this.speed * 1.5 : this.speed) * currentSlowMul;
    this.vx = (dx / d) * spd; this.vy = (dy / d) * spd;
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.angle = Math.atan2(dy, dx);
    if (!player.isInvincible && d < this.size + player.size) {
      player.takeDamage(22, game, this);
    }
    this.attackTimer += dt;
    if (this.attackTimer >= this.attackCd) {
      this.attackTimer = 0;
      this.fireAttack(player, game);
    }
  }

  triggerSophistSplit(game) {
    this.isPatternActive = true;
    this.isStunned = false;
    game.showBossTooltip("⚖️ 소피스트: 모든 진리는 상대적이다! 흔들리는 거짓 저울들 속에서, 흔들림 없는 진짜 저울(⚖️)을 찾으십시오!");
    
    this.clonesList = [];
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
      const cx = this.x + Math.cos(angle) * 150;
      const cy = this.y + Math.sin(angle) * 150;
      const clone = new Boss(cx, cy, game.player.level, "소피스트의 분신", 0);
      clone.isClone = true;
      clone.maxHp = this.maxHp * 0.2;
      clone.hp = clone.maxHp;
      clone.size = this.size;
      clone.parentBoss = this;
      clone.swayPhase = Math.random() * Math.PI * 2;
      clone.swaySpeed = 0.003 + Math.random() * 0.002;
      game.enemies.push(clone);
      this.clonesList.push(clone);
    }
    game.addDamageText(this.x, this.y - 70, "🌀 궤변의 분신 소환!", "#e84393", 22);
  }

  fireAttack(player, game) {
    const si = this.stageIndex;
    if (si === 0) { // 소피스트: spiral burst
      for (let i = 0; i < (this.phase2 ? 12 : 8); i++) {
        const a = (Math.PI * 2 / (this.phase2 ? 12 : 8)) * i + this.time * 0.001;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 3.5, 'spiral'));
      }
    } else if (si === 1) { // 아파테이아: warning zones
      for (let i = 0; i < 3; i++) {
        const wx = player.x + (Math.random() - 0.5) * 300;
        const wy = player.y + (Math.random() - 0.5) * 300;
        game.warningZones.push(new WarningZone(wx, wy, 100, 35, 1500));
      }
    } else if (si === 2) { // 교조주의: curve shots
      for (let i = 0; i < (this.phase2 ? 6 : 4); i++) {
        const a = Math.atan2(player.y - this.y, player.x - this.x) + (i - 1.5) * 0.35;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 4, 'curve'));
        if (!game.medievalDarkness) game.medievalDarkness = true;
      }
    } else if (si === 3) { // 편견의 거인: warning zones + spiral
      const cnt = this.phase2 ? 5 : 3;
      for (let i = 0; i < cnt; i++) {
        const a = (Math.PI * 2 / cnt) * i;
        game.warningZones.push(new WarningZone(
          this.x + Math.cos(a) * 180, this.y + Math.sin(a) * 180, 90, 30, 1200));
      }
    } else if (si === 4) { // 칸트: moral rule
      for (let i = 0; i < (this.phase2 ? 12 : 7); i++) {
        const a = (Math.PI * 2 / (this.phase2 ? 12 : 7)) * i + this.time * 0.001;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 3, 'straight'));
      }
    } else { // 허무주의: heavy spiral
      const cnt = this.phase2 ? 20 : 12;
      for (let i = 0; i < cnt; i++) {
        const a = (Math.PI * 2 / cnt) * i + this.time * 0.002;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 4.5, 'spiral'));
      }
    }
    if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
  }

  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const t = Date.now();
    ctx.save();
    
    // Glow
    const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, this.size * 2.5);
    if (this.frozenTime > 0) {
      grd.addColorStop(0, 'rgba(168,230,240,0.4)');
      grd.addColorStop(1, 'rgba(168,230,240,0)');
    } else if (this.slowMul < 1) {
      grd.addColorStop(0, 'rgba(84,160,255,0.4)');
      grd.addColorStop(1, 'rgba(84,160,255,0)');
    } else if (this.isPatternActive && !this.isStunned) {
      grd.addColorStop(0, 'rgba(164,176,190,0.4)');
      grd.addColorStop(1, 'rgba(164,176,190,0)');
    } else {
      grd.addColorStop(0, 'rgba(232,67,147,0.4)');
      grd.addColorStop(1, 'rgba(232,67,147,0)');
    }
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(rx, ry, this.size * 2.5, 0, Math.PI * 2); ctx.fill();
    
    // Body
    if (this.frozenTime > 0) {
      ctx.fillStyle = '#a8e6f0'; ctx.shadowColor = '#00d2d3'; ctx.shadowBlur = 20;
    } else if (this.slowMul < 1) {
      ctx.fillStyle = '#54a0ff'; ctx.shadowColor = '#00d2d3'; ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = this.isStunned ? '#2e86de' : (this.phase2 ? '#ff0000' : this.color);
      ctx.shadowColor = this.isStunned ? '#54a0ff' : this.color; ctx.shadowBlur = 20;
    }
    ctx.beginPath(); ctx.arc(rx, ry, this.size, 0, Math.PI * 2); ctx.fill();
    
    // Pattern active border
    if (this.isPatternActive && !this.isStunned) {
      ctx.strokeStyle = '#a4b0be';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(rx, ry, this.size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Inner ring
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(rx, ry, this.size * 0.65, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Horns
    ctx.fillStyle = '#2d3436';
    ctx.beginPath(); ctx.moveTo(rx - 12, ry - this.size); ctx.lineTo(rx - 18, ry - this.size - 16); ctx.lineTo(rx - 4, ry - this.size); ctx.fill();
    ctx.beginPath(); ctx.moveTo(rx + 12, ry - this.size); ctx.lineTo(rx + 18, ry - this.size - 16); ctx.lineTo(rx + 4, ry - this.size); ctx.fill();
    
    // Sophist Scale indicator
    if (this.stageIndex === 0) {
      let scaleSize = 21;
      let angleOffset = 0;
      let yOffset = -this.size - 26;
      
      if (this.isClone) {
        scaleSize = 20 + Math.sin(this.swayPhase) * 6;
        angleOffset = Math.sin(this.swayPhase * 1.5) * 0.4;
      }
      
      ctx.save();
      ctx.font = `${scaleSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.translate(rx, ry + yOffset);
      ctx.rotate(angleOffset);
      ctx.fillText('⚖️', 0, 0);
      ctx.restore();
    }
    
    // Guard shield indicator
    if (this.isPatternActive && !this.isStunned) {
      ctx.fillStyle = '#fff';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', rx, ry - this.size - 48);
    }
    
    // Name
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
    ctx.fillText(this.isClone ? "궤변의 분신" : this.name, rx, ry - this.size - 22);
    
    // HP bar
    const displayHp = this.isClone ? this.maxHp * (0.22 + Math.sin(t * 0.005) * 0.4) : this.hp;
    const bw = 120, bh = 8, bx = rx - 60, by = ry - this.size - 38;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(bx-2, by-2, bw+4, bh+4, 4); ctx.fill();
    ctx.fillStyle = this.isClone ? '#7f8c8d' : '#ff4757';
    ctx.fillRect(bx, by, bw * displayHp / this.maxHp, bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
  }
}

// ─── IDOL ───────────────────────────────────────────────────────────
export class Idol {
  constructor(x, y, idolType, boss) {
    this.x = x; this.y = y;
    this.idolType = idolType; // cave/tribe/market/theater
    this.type = 'idol'; this.isIdol = true;
    this.boss = boss; this.size = 20;
    this.maxHp = 200; this.hp = this.maxHp;
    this.vx = 0; this.vy = 0;
    const defs = {
      cave:   {color:'#81ecec', label:'동굴의 우상'},
      tribe:  {color:'#ff7675', label:'종족의 우상'},
      market: {color:'#fdcb6e', label:'시장의 우상'},
      theater:{color:'#a29bfe', label:'극장의 우상'}
    };
    const d = defs[idolType] || defs.cave;
    this.color = d.color; this.label = d.label;
    this.frozenTime = 0; this.slowMul = 1; this.slowTimer = 0; this.iceFloorDmgTimer = 0;
  }
  update(dt, player, game) {
    if (this.frozenTime > 0) { this.frozenTime -= dt; return; }
    if (this.iceFloorDmgTimer > 0) this.iceFloorDmgTimer -= dt;
    
    let currentSlowMul = this.slowMul;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMul = 1;
        currentSlowMul = 1;
      }
    } else {
      this.slowMul = 1;
      currentSlowMul = 1;
    }

    if (player.auraEnemySlowAura && Math.hypot(player.x - this.x, player.y - this.y) < 180) {
      currentSlowMul = Math.min(currentSlowMul, 0.75);
      this.slowTimer = Math.max(this.slowTimer, 100);
    }

    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const spd = 1.0 * currentSlowMul;
    this.x += (dx / d) * spd * dt * 0.06;
    this.y += (dy / d) * spd * dt * 0.06;
    if (Math.hypot(this.x - player.x, this.y - player.y) < this.size + player.size && !player.isInvincible) {
      player.takeDamage(10, game);
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    
    let renderColor = this.color;
    if (this.frozenTime > 0) {
      renderColor = '#a8e6f0';
      ctx.shadowColor = '#00d2d3';
      ctx.shadowBlur = 20;
    } else if (this.slowMul < 1) {
      renderColor = '#54a0ff';
      ctx.shadowColor = '#00d2d3';
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
    }
    
    ctx.fillStyle = renderColor;
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(rx, ry - this.size); ctx.lineTo(rx + this.size, ry);
    ctx.lineTo(rx, ry + this.size); ctx.lineTo(rx - this.size, ry);
    ctx.closePath(); ctx.fill();
    // Label
    ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.shadowBlur = 4; ctx.shadowColor = '#000';
    ctx.fillText(this.label, rx, ry - this.size - 6);
    // HP bar
    const bw = this.size * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(rx - this.size, ry + this.size + 2, bw, 4);
    ctx.fillStyle = renderColor; ctx.fillRect(rx - this.size, ry + this.size + 2, bw * this.hp / this.maxHp, 4);
    ctx.restore();
  }
}

// ─── PROJECTILE ──────────────────────────────────────────────────────
export class Projectile {
  constructor(x, y, tx, ty, speed, size, dmg, color, type) {
    this.x = x; this.y = y; this.size = size; this.dmg = dmg;
    this.color = color; this.type = type;
    const ang = Math.atan2(ty - y, tx - x);
    this.vx = Math.cos(ang) * speed; this.vy = Math.sin(ang) * speed;
    this.life = 3000; this.pierceLeft = 99; this.hitEnemy = new Set();
  }
  update(dt, game) {
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.life -= dt;
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, this.size);
    grd.addColorStop(0, '#fff');
    grd.addColorStop(0.4, this.color);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.shadowColor = this.color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(rx, ry, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ─── PLAYER CLASS ────────────────────────────────────────────────────
export class Player {
  constructor(lineage) {
    this.lineage = lineage; this.x = 0; this.y = 0;
    this.size = 18; this.speed = 3.2;
    this.maxHp = 120; this.hp = 120; this.level = 1; this.xp = 0;
    this.maxXp = 12; this.evolutionIndex = 0;
    this.activeSkills = {}; this.skillTiers = {}; this.faceAngle = 0;
    this.vx = 0; this.vy = 0; this.isInvincible = false;
    this.invincibilityFlash = 0;
    this.dmgMultiplier = 1; this.areaMultiplier = 1;
    this.cooldownReduction = 0; this.regenHp = 0; this.regenAccumulator = 0;
    this.xpMultiplier = 1; this.armorReduction = 0; this.critMultiplier = 1;
    this.slowBonus = 0;
    this.auraSpeedBonus = 0; this.auraCooldownReduction = 0; this.auraLifesteal = 0;
    this.auraTier = 0;
    this.lastDirection = 'down';
    this.facing = 'left';
  }
  recalculateStats() {
    this.dmgMultiplier = 1;
    this.areaMultiplier = 1;
    this.speed = 3.2;
    this.cooldownReduction = 0;
    this.regenHp = 0;
    this.slowBonus = 0;
    this.xpMultiplier = 1;
    this.armorReduction = 0;
    this.critMultiplier = 1;
    
    let baseMaxHp = 120;
    const tierMuls = { 'normal': 1.0, 'rare': 1.25, 'unique': 1.55, 'epic': 1.9 };
    
    for (const [id, lvl] of Object.entries(this.activeSkills)) {
      if (lvl <= 0) continue;
      const tier = this.skillTiers[id] || 'normal';
      const tm = tierMuls[tier] || 1.0;
      
      if (id === 'passive_idealism_dmg') this.dmgMultiplier = 1 + lvl * 0.15 * tm;
      if (id === 'passive_idealism_area') this.areaMultiplier = 1 + lvl * 0.15 * tm;
      if (id === 'passive_speed') this.speed = 3.2 * (1 + lvl * 0.15 * tm);
      if (id === 'passive_cooldown') this.cooldownReduction = lvl * 0.12 * tm;
      if (id === 'passive_regen') this.regenHp = lvl * tm;
      if (id === 'passive_empiricism_slow') this.slowBonus = lvl * 0.15 * tm;
      if (id === 'passive_empiricism_xp') this.xpMultiplier = 1 + lvl * 0.15 * tm;
      if (id === 'passive_max_hp') baseMaxHp += lvl * 25 * tm;
      if (id === 'passive_armor') this.armorReduction = lvl * 0.15 * tm;
      if (id === 'passive_crit_dmg') this.critMultiplier = 1 + lvl * 0.25 * tm;
    }
    
    const hpDiff = baseMaxHp - this.maxHp;
    this.maxHp = baseMaxHp;
    if (hpDiff > 0) this.heal(hpDiff);

    if (window.gameInstance && window.gameInstance.uberMenschMode) {
      this.dmgMultiplier *= 5;
    }
  }
  get effectiveSpeed() { return this.speed * (1 + this.auraSpeedBonus); }
  takeDamage(dmg, game) {
    if (this.isInvincible) return;
    const reduced = Math.max(1, Math.floor(dmg * (1 - this.armorReduction)));
    this.hp = Math.max(0, this.hp - reduced);
    game.addDamageText(this.x, this.y - 40, reduced, '#ff6b81', 16, false);
    this.isInvincible = true; this.invincibilityFlash = 800;
    setTimeout(() => { this.isInvincible = false; this.invincibilityFlash = 0; }, 800);
    if (this.hp <= 0) game.gameOver();
  }
  heal(amt) { this.hp = Math.min(this.maxHp, this.hp + amt); }
  gainXp(val, game) {
    this.xp += val * this.xpMultiplier;
    while (this.xp >= this.maxXp) {
      this.xp -= this.maxXp; this.level++;
      this.maxXp = Math.floor(this.maxXp * 1.55 + 6);
      game.triggerLevelUp();
    }
    document.getElementById('hud-xp-fill').style.width = `${(this.xp / this.maxXp) * 100}%`;
  }
  update(dt, keys, joystickAngle, joystickStrength) {
    if (this.invincibilityFlash > 0) this.invincibilityFlash -= dt;
    this.animTime = (this.animTime || 0) + dt;
    let dx = 0, dy = 0;
    if (joystickStrength > 0) {
      dx = Math.cos(joystickAngle) * joystickStrength;
      dy = Math.sin(joystickAngle) * joystickStrength;
    } else {
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
    }
    if (window.gameInstance && window.gameInstance.activeIdols && window.gameInstance.activeIdols.has('tribe')) {
      dx = -dx; dy = -dy;
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.vx = (dx / len) * this.effectiveSpeed;
      this.vy = (dy / len) * this.effectiveSpeed;
      this.faceAngle = Math.atan2(dy, dx);
      // Determine movement direction state without diagonal jitter
      if (Math.abs(this.vx) >= Math.abs(this.vy) * 0.7) {
        this.lastDirection = 'side';
        this.facing = this.vx > 0 ? 'right' : 'left';
      } else {
        this.lastDirection = this.vy > 0 ? 'down' : 'up';
      }
    } else { this.vx = 0; this.vy = 0; }
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    const bounds = 1800;
    this.x = Math.max(-bounds, Math.min(bounds, this.x));
    this.y = Math.max(-bounds, Math.min(bounds, this.y));
    if (this.regenHp > 0) {
      this.regenAccumulator += dt;
      if (this.regenAccumulator >= 1000) { this.heal(this.regenHp); this.regenAccumulator = 0; }
    }
  }
  draw(ctx, camera) {
    if (!Player.spriteImagePlato) {
      Player.spriteImagePlato = new Image();
      Player.spriteImagePlato.src = 'sprite/plato_sprite_sheet_clean.png';
    }
    if (!Player.spriteImageAristotle) {
      Player.spriteImageAristotle = new Image();
      Player.spriteImageAristotle.src = 'sprite/aristotle_clean.png';
    }

    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const stages = EVOLUTION_STAGES[this.lineage];
    const ev = stages[Math.min(this.evolutionIndex, stages.length - 1)];
    const name = ev ? ev.title : '학자';
    const themeColor = ev ? ev.color : '#fff';
    const t = Date.now();
    const isMoving = Math.hypot(this.vx, this.vy) > 0.1;
    const sway = isMoving ? Math.sin(t * 0.012) * 4 : 0;
    ctx.save();
    const flashVisible = this.invincibilityFlash > 0 && Math.floor(this.invincibilityFlash / 80) % 2 === 0;
    if (flashVisible) ctx.globalAlpha = 0.35;


    // ─── Drawing active auras at player's feet ─────────────────────────────
    if (this.auras) {
      const time = performance.now();
      for (const [key, lvl] of Object.entries(this.auras)) {
        if (lvl <= 0) continue;
        
        const db = AURA_DB[key];
        if (!db) continue;
        
        ctx.save();
        const radius = 80 + lvl * 15;
        ctx.strokeStyle = db.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = db.color;
        ctx.shadowBlur = 10 + Math.sin(time * 0.005) * 4;
        
        // Soft pulsing fill
        ctx.fillStyle = db.color + "11";
        ctx.beginPath();
        ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Decorative concentric dashed ring
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(rx, ry, radius, time * 0.0005, time * 0.0005 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Geometric motifs
        if (key === 'brilliance') {
          ctx.beginPath();
          const rotateAngle = time * 0.0008;
          for (let i = 0; i < 6; i++) {
            const angle = rotateAngle + (Math.PI * 2 / 6) * i;
            const x = rx + Math.cos(angle) * (radius - 12);
            const y = ry + Math.sin(angle) * (radius - 12);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = rotateAngle + (Math.PI * 2 / 6) * i + Math.PI / 3;
            const x = rx + Math.cos(angle) * (radius - 12);
            const y = ry + Math.sin(angle) * (radius - 12);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        } 
        else if (key === 'unholy') {
          ctx.beginPath();
          const rotateAngle = -time * 0.0006;
          for (let i = 0; i < 5; i++) {
            const starIdx = (i * 2) % 5;
            const angle = rotateAngle + (Math.PI * 2 / 5) * starIdx;
            const x = rx + Math.cos(angle) * (radius - 10);
            const y = ry + Math.sin(angle) * (radius - 10);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        else if (key === 'thorns') {
          const spikeCount = 18;
          ctx.beginPath();
          const rotateAngle = time * 0.0003;
          for (let i = 0; i < spikeCount * 2; i++) {
            const angle = rotateAngle + (Math.PI * 2 / (spikeCount * 2)) * i;
            const isSpike = i % 2 === 0;
            const r = isSpike ? radius + 8 : radius - 6;
            const x = rx + Math.cos(angle) * r;
            const y = ry + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        else if (key === 'warsong') {
          const pulse = Math.sin(time * 0.015) * 6;
          ctx.strokeStyle = db.color;
          ctx.beginPath();
          ctx.arc(rx, ry, radius - 15 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(rx, ry, radius - 30 - pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
        else if (key === 'devotion') {
          ctx.beginPath();
          ctx.arc(rx, ry, radius - 15, 0, Math.PI * 2);
          ctx.stroke();
          
          const rotateAngle = time * 0.0004;
          for (let i = 0; i < 4; i++) {
            const angle = rotateAngle + (Math.PI / 2) * i;
            const cx = rx + Math.cos(angle) * radius;
            const cy = ry + Math.sin(angle) * radius;
            ctx.fillStyle = db.color;
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        else if (key === 'trueshot') {
          const rotateAngle = time * 0.0005;
          for (let i = 0; i < 4; i++) {
            const angle = rotateAngle + (Math.PI / 2) * i;
            const x1 = rx + Math.cos(angle) * (radius - 16);
            const y1 = ry + Math.sin(angle) * (radius - 16);
            const x2 = rx + Math.cos(angle) * (radius + 16);
            const y2 = ry + Math.sin(angle) * (radius + 16);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            const tipAngle1 = angle + Math.PI - 0.4;
            const tipAngle2 = angle + Math.PI + 0.4;
            ctx.beginPath();
            ctx.moveTo(x2 + Math.cos(tipAngle1) * 10, y2 + Math.sin(tipAngle1) * 10);
            ctx.lineTo(x2);
            ctx.lineTo(x2 + Math.cos(tipAngle2) * 10, y2 + Math.sin(tipAngle2) * 10);
            ctx.stroke();
          }
        }
        else if (key === 'endurance') {
          const rotateAngle = time * 0.0015;
          for (let i = 0; i < 3; i++) {
            const angle = rotateAngle + (Math.PI * 2 / 3) * i;
            const lx = rx + Math.cos(angle) * radius;
            const ly = ry + Math.sin(angle) * radius;
            ctx.beginPath();
            ctx.moveTo(lx - 5, ly - 8);
            ctx.lineTo(lx + 2, ly - 2);
            ctx.lineTo(lx - 4, ly + 2);
            ctx.lineTo(lx + 5, ly + 8);
            ctx.stroke();
          }
        }
        else if (key === 'vampiric') {
          const rotateAngle = time * 0.0007;
          for (let i = 0; i < 2; i++) {
            const angle = rotateAngle + Math.PI * i;
            const mx = rx + Math.cos(angle) * radius;
            const my = ry + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(mx, my, 8, angle - 1.2, angle + 1.2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(mx - Math.cos(angle)*4, my - Math.sin(angle)*4, 10, angle - 0.8, angle + 0.8);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    // ─── Drawing Reason's Aura Glowing Red Ring of Fire ───────────────────
    const fireAuraLvl = this.activeSkills && this.activeSkills['fire_aura'];
    if (fireAuraLvl && fireAuraLvl > 0) {
      const dbAura = PHILOSOPHY_DB.idealism.find(c => c.id === 'fire_aura');
      if (dbAura && dbAura.stats) {
        const stat = dbAura.stats[fireAuraLvl - 1];
        if (stat) {
          const time = performance.now();
          const baseRadius = stat.radius;
          const actualRadius = baseRadius * this.areaMultiplier;
          
          ctx.save();
          ctx.shadowBlur = 12 + Math.sin(time * 0.006) * 4;
          ctx.shadowColor = '#ff4d4d';
          ctx.strokeStyle = 'rgba(255, 77, 77, 0.75)';
          ctx.lineWidth = 3;
          
          ctx.fillStyle = 'rgba(255, 77, 77, 0.035)';
          ctx.beginPath();
          ctx.arc(rx, ry, actualRadius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(rx, ry, actualRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(255, 168, 1, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([8, 12]);
          ctx.beginPath();
          ctx.arc(rx, ry, actualRadius - 6, -time * 0.0003, -time * 0.0003 + Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 등급별 특수 아우라 그리기
    if (this.auraTier && this.auraTier > 0) {
      ctx.save();
      const time = performance.now();
      ctx.shadowBlur = 15 + Math.sin(time * 0.003) * 5;
      
      const colors = {
        1: { stroke: 'rgba(46, 213, 115, 0.5)', shadow: '#2ed573' },  // Common (Green)
        2: { stroke: 'rgba(52, 152, 219, 0.6)', shadow: '#3498db' },   // Rare (Blue)
        3: { stroke: 'rgba(155, 89, 182, 0.7)', shadow: '#9b59b6' },  // Unique (Purple)
        4: { stroke: 'rgba(241, 196, 15, 0.8)', shadow: '#f1c40f' }   // Epic (Gold)
      };
      
      const cfg = colors[this.auraTier] || { stroke: 'rgba(255,255,255,0.5)', shadow: '#fff' };
      ctx.strokeStyle = cfg.stroke;
      ctx.shadowColor = cfg.shadow;
      
      const pulseRadius = this.size * 1.6 + Math.sin(time * 0.004) * 4;
      
      if (this.auraTier === 1) {
        // Tier 1: 보통 (Emerald Green Pulse + Small Rising Bubbles)
        ctx.fillStyle = 'rgba(46, 213, 115, 0.6)';
        ctx.shadowBlur = 6;
        for (let i = 0; i < 3; i++) {
          const seed = i * 45;
          const progress = ((time + seed) % 1200) / 1200;
          const px = rx + Math.sin(progress * Math.PI * 2 + seed) * (this.size * 0.8);
          const py = ry + this.size - progress * (this.size * 2);
          ctx.beginPath();
          ctx.arc(px, py, (1 - progress) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      else if (this.auraTier === 2) {
        // Tier 2: 레어 (Azure Blue Ring + Inner Dashed Orbit + Ice Crystals)
        ctx.fillStyle = '#54a0ff';
        ctx.shadowBlur = 6;
        for (let i = 0; i < 4; i++) {
          const seed = i * 90;
          const progress = ((time + seed) % 1500) / 1500;
          const angle = progress * Math.PI * 2 + seed;
          const px = rx + Math.cos(angle) * (pulseRadius - 2.5);
          const py = ry + Math.sin(angle) * (pulseRadius - 2.5);
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      else if (this.auraTier === 3) {
        // Tier 3: 유니크 (Amethyst Purple + Outer Expanding Shockwave + 3 Orbiting Spheres)
        ctx.fillStyle = '#a55eea';
        ctx.shadowBlur = 8;
        for (let i = 0; i < 3; i++) {
          const orbitAngle = time * 0.0018 + i * (Math.PI * 2 / 3);
          const ox = rx + Math.cos(orbitAngle) * pulseRadius;
          const oy = ry + Math.sin(orbitAngle) * (pulseRadius * 0.6); // 3D Tilt Effect
          ctx.beginPath();
          ctx.arc(ox, oy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      else if (this.auraTier === 4) {
        // Tier 4: 에픽 (Radiant Gold Double Rotating Rings + Sparkling Star Shower)
        ctx.fillStyle = '#ffd200';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 6; i++) {
          const seed = i * 137.5;
          const progress = ((time + seed) % 1600) / 1600;
          const py = ry + this.size + 12 - progress * (this.size * 3.5);
          const wobble = Math.sin(progress * Math.PI * 4 + seed) * (this.size * 0.85);
          const px = rx + wobble;
          const pSize = (1 - progress) * 4.5;
          
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    const drawImg = this.lineage === 'idealism' ? Player.spriteImagePlato : Player.spriteImageAristotle;
    const spriteLoaded = drawImg && drawImg.complete && drawImg.naturalWidth !== 0;

    if (spriteLoaded) {
      // 12x8 RPG Maker VX grid calculation (precise floating-point coordinates)
      const cellW = drawImg.naturalWidth / 12;
      const cellH = drawImg.naturalHeight / 8;

      // Map evolution stage (0 to 5) to 6 dedicated character slots
      const EVOL_CHAR_MAP = {
        0: 1, // slot 1
        1: 2, // slot 2
        2: 3, // slot 3
        3: 5, // slot 5
        4: 6, // slot 6
        5: 7  // slot 7
      };

      const charId = EVOL_CHAR_MAP[Math.min(this.evolutionIndex, 5)] || 1;
      const colOffset = (charId % 4) * 3;
      const rowOffset = Math.floor(charId / 4) * 4;

      let dirRow = 0;
      if (this.lastDirection === 'down') {
        dirRow = 0;
      } else if (this.lastDirection === 'up') {
        dirRow = 3;
      } else {
        dirRow = (this.facing === 'right') ? 2 : 1;
      }

      const row = rowOffset + dirRow;

      let colIdx = colOffset + 1;
      if (this.hp > 0 && isMoving) {
        const walkCycle = [0, 1, 2, 1];
        const frameRate = 120;
        const idx = Math.floor((this.animTime || 0) / frameRate) % 4;
        colIdx = colOffset + walkCycle[idx];
      }

      // Add defensive 0.5px margin to prevent sub-pixel bleeding
      const sx = colIdx * cellW + 0.5;
      const sy = row * cellH + 0.5;
      const sw = cellW - 1.0;
      const sh = cellH - 1.0;
      const dw = 72;
      const dh = Math.round(72 * (cellH / cellW));

      ctx.save();
      ctx.translate(rx, ry);
      if (this.hp <= 0) {
        ctx.rotate(Math.PI / 2);
        ctx.translate(0, 10);
      }
      ctx.drawImage(drawImg, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      // Render Halo / Crowns over Sprite sheet based on evolution
      if (this.evolutionIndex >= 2) {
        ctx.save();
        ctx.fillStyle = '#f9ca24';
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI + (i / 4) * Math.PI;
          ctx.beginPath();
          ctx.ellipse(rx + Math.cos(a) * 10, ry - 31 + Math.sin(a) * 2, 4, 6, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (this.evolutionIndex >= 4) {
        ctx.save();
        ctx.strokeStyle = themeColor; ctx.lineWidth = 2.5;
        ctx.shadowColor = themeColor; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(rx, ry - 22, 18, -Math.PI, 0); ctx.stroke();
        ctx.restore();
      }

    } else {
      // Fallback original vector art
      // Legs
      ctx.fillStyle = '#8B6914';
      ctx.beginPath(); ctx.ellipse(rx - 5 + sway * 0.4, ry + 20, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(rx + 5 - sway * 0.4, ry + 20, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Robe
      ctx.fillStyle = this.lineage === 'idealism' ? '#c0392b' : '#2471a3';
      ctx.beginPath();
      ctx.moveTo(rx - 15 + sway, ry + 14); ctx.lineTo(rx + 15 + sway, ry + 14);
      ctx.lineTo(rx + 12, ry - 8); ctx.lineTo(rx - 12, ry - 8); ctx.closePath(); ctx.fill();
      // Robe stripe
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(rx + sway * 0.4, ry - 6); ctx.lineTo(rx + sway * 0.4, ry + 13); ctx.stroke();
      // Belt
      ctx.fillStyle = themeColor; ctx.globalAlpha *= 0.8;
      ctx.fillRect(rx - 13 + sway, ry + 2, 26, 5);
      ctx.globalAlpha = flashVisible ? 0.35 : 1;
      // Arms
      const armSwing = isMoving ? Math.sin(t * 0.015) * 10 : 0;
      ctx.strokeStyle = this.lineage === 'idealism' ? '#c0392b' : '#2471a3';
      ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(rx - 10 + sway, ry - 3); ctx.lineTo(rx - 17 + sway + armSwing, ry + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx + 10 + sway, ry - 3); ctx.lineTo(rx + 17 + sway - armSwing, ry + 8); ctx.stroke();
      // Hands
      ctx.fillStyle = '#f0c080';
      ctx.beginPath(); ctx.arc(rx - 17 + sway + armSwing, ry + 8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx + 17 + sway - armSwing, ry + 8, 4, 0, Math.PI * 2); ctx.fill();
      // Neck
      ctx.fillStyle = '#f0c080';
      ctx.beginPath(); ctx.ellipse(rx + sway * 0.2, ry - 10, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
      // Head
      ctx.fillStyle = '#f0c080'; ctx.shadowColor = themeColor; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(rx + sway * 0.2, ry - 22, 13, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      const eyeDir = Math.cos(this.faceAngle) >= 0 ? 1 : -1;
      ctx.fillStyle = '#2d3436';
      ctx.beginPath(); ctx.arc(rx + sway * 0.2 + eyeDir * 4, ry - 22, 2, 0, Math.PI * 2); ctx.fill();
      // Beard
      ctx.fillStyle = this.evolutionIndex >= 3 ? '#fff' : '#8B7355';
      ctx.beginPath(); ctx.ellipse(rx + sway * 0.2, ry - 12, 7, 5, 0, 0, Math.PI); ctx.fill();
      // Laurel crown (ev >= 2)
      if (this.evolutionIndex >= 2) {
        ctx.fillStyle = '#f9ca24';
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI + (i / 4) * Math.PI;
          ctx.beginPath();
          ctx.ellipse(rx + Math.cos(a) * 10 + sway * 0.2, ry - 31 + Math.sin(a) * 2, 4, 6, a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Halo (ev >= 4)
      if (this.evolutionIndex >= 4) {
        ctx.strokeStyle = themeColor; ctx.lineWidth = 2.5;
        ctx.shadowColor = themeColor; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(rx + sway * 0.2, ry - 22, 18, -Math.PI, 0); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // HP bar below
    const bw = 40, bh = 5, bx = rx - 20, by = ry + 34;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, bh);
    const hpPct = this.hp / this.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#2ed573' : hpPct > 0.25 ? '#ffd200' : '#ff4757';
    ctx.fillRect(bx, by, bw * hpPct, bh);
    // Name + Level overhead
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Share Tech Mono, monospace';
    ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 3;
    ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
    ctx.strokeText('Lv.' + this.level, rx + sway * 0.2, ry - 64);
    ctx.fillStyle = '#ffc048';
    ctx.fillText('Lv.' + this.level, rx + sway * 0.2, ry - 64);
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 5;
    ctx.strokeText(name, rx + sway * 0.2, ry - 36);
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
    ctx.fillText(name, rx + sway * 0.2, ry - 36);
    ctx.restore();
  }
}
