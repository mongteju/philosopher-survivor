import { sfx } from '../audio.js';

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
    
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    
    if (this.type === 'spiral') {
      // Spinning dark magic vortex
      ctx.translate(rx, ry);
      ctx.rotate(this.time * 0.008);
      ctx.fillStyle = this.color;
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(this.size * 1.1, -this.size * 0.6, this.size * 1.5, 0);
        ctx.quadraticCurveTo(this.size * 0.7, this.size * 0.5, 0, 0);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    else if (this.type === 'curve') {
      // Comet-like wavy bullet with long tail aligned with movement angle
      ctx.translate(rx, ry);
      ctx.rotate(this.angle);
      
      const grd = ctx.createLinearGradient(-this.size * 2, 0, 0, 0);
      grd.addColorStop(0, 'rgba(162, 155, 254, 0)');
      grd.addColorStop(1, this.color);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(-this.size * 2.5, 0);
      ctx.lineTo(0, -this.size * 0.85);
      ctx.lineTo(0, this.size * 0.85);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2); ctx.fill();
    }
    else {
      // Straight: moral razor needle (golden/crimson shard)
      ctx.translate(rx, ry);
      ctx.rotate(this.angle);
      
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(-this.size * 1.5, 0);
      ctx.lineTo(0, -this.size * 0.4);
      ctx.lineTo(this.size * 1.5, 0); // sharp tip
      ctx.lineTo(0, this.size * 0.4);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    }
    
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
    const baseHps = [1500, 5000, 8000, 12000, 18000, 42000];
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
    
    // ─── STAGE SPECIFIC BOSS VISUALS ────────────────────────────────────
    let baseColor = this.color;
    let isFrozen = this.frozenTime > 0;
    let isSlowed = this.slowMul < 1;
    
    ctx.save();
    ctx.translate(rx, ry);

    let mainColor = this.isStunned ? '#2e86de' : (this.phase2 ? '#ff4757' : this.color);
    if (isFrozen) mainColor = '#a8e6f0';
    else if (isSlowed) mainColor = '#54a0ff';

    ctx.fillStyle = mainColor;
    ctx.shadowBlur = this.isStunned ? 10 : 25;
    ctx.shadowColor = mainColor;

    const si = this.stageIndex;

    if (si === 0) {
      // 1. Sophist: Purple Sophistic scholar & giant floating scales
      ctx.beginPath();
      ctx.moveTo(-this.size, this.size);
      ctx.quadraticCurveTo(-this.size * 0.4, -this.size * 0.8, 0, -this.size);
      ctx.quadraticCurveTo(this.size * 0.4, -this.size * 0.8, this.size, this.size);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#ffd200'; ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      const tilt = this.isClone ? Math.sin(this.swayPhase * 1.2) * 0.35 : Math.sin(t * 0.003) * 0.15;
      ctx.translate(0, -this.size - 22);
      ctx.rotate(tilt);
      
      ctx.strokeStyle = '#ffd200'; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-28, 6); ctx.lineTo(28, 6);
      ctx.moveTo(0, -12); ctx.lineTo(0, 6);
      ctx.stroke();
      
      ctx.fillStyle = '#ff7675';
      ctx.beginPath(); ctx.arc(-28, 16, 6, 0, Math.PI*2); ctx.arc(28, 16, 6, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    else if (si === 1) {
      // 2. Guardian of Apatheia: Tranquil teal crystal knight & wings
      ctx.save();
      ctx.fillStyle = 'rgba(76, 209, 149, 0.4)';
      ctx.shadowBlur = 15; ctx.shadowColor = '#4cd137';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.quadraticCurveTo(-45, -45, -65, -15); ctx.quadraticCurveTo(-35, 15, 0, 10); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.quadraticCurveTo(45, -45, 65, -15); ctx.quadraticCurveTo(35, 15, 0, 10); ctx.closePath(); ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.4, -this.size * 0.9);
      ctx.lineTo(0, -this.size * 1.1);
      ctx.lineTo(this.size * 0.4, -this.size * 0.9);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();

      const shieldAngle = t * 0.0035;
      const shieldDist = this.size * 1.55;
      ctx.fillStyle = 'rgba(76, 209, 149, 0.75)';
      ctx.shadowBlur = 10; ctx.shadowColor = '#4cd137';
      for (let i = 0; i < 2; i++) {
        const a = shieldAngle + i * Math.PI;
        const sx = Math.cos(a) * shieldDist;
        const sy = Math.sin(a) * shieldDist;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a + Math.PI/2);
        ctx.beginPath();
        ctx.moveTo(-7, -4); ctx.lineTo(7, -4); ctx.lineTo(5, 6); ctx.lineTo(0, 10); ctx.lineTo(-5, 6);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    else if (si === 2) {
      // 3. Specter of Dogmatism: Dark bishop lich & purple magic book
      ctx.beginPath();
      ctx.moveTo(-this.size, this.size);
      ctx.quadraticCurveTo(-this.size * 1.1, -this.size, 0, -this.size * 1.1);
      ctx.quadraticCurveTo(this.size * 1.1, -this.size, this.size, this.size);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#1e272e';
      ctx.beginPath(); ctx.arc(0, -this.size*0.3, this.size*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#a55eea';
      ctx.beginPath(); ctx.arc(-5, -this.size*0.3, 3.5, 0, Math.PI*2); ctx.arc(5, -this.size*0.3, 3.5, 0, Math.PI*2); ctx.fill();

      ctx.save();
      const bookBob = Math.sin(t * 0.004) * 5;
      ctx.translate(0, this.size * 0.8 + bookBob);
      ctx.rotate(Math.sin(t * 0.002) * 0.1);
      ctx.fillStyle = '#4b6584';
      ctx.shadowBlur = 15; ctx.shadowColor = '#a55eea';
      ctx.beginPath();
      ctx.roundRect(-22, -14, 44, 28, 3);
      ctx.fill();
      ctx.fillStyle = '#ffd200';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    else if (si === 3) {
      // 4. Giant of Prejudice: Rocky titan with 4 idol gems & fists
      ctx.beginPath();
      ctx.moveTo(-this.size * 1.1, 0);
      ctx.lineTo(-this.size * 0.8, -this.size * 0.8);
      ctx.lineTo(0, -this.size * 1.1);
      ctx.lineTo(this.size * 0.8, -this.size * 0.8);
      ctx.lineTo(this.size * 1.1, 0);
      ctx.lineTo(this.size * 0.7, this.size * 1.0);
      ctx.lineTo(-this.size * 0.7, this.size * 1.0);
      ctx.closePath();
      ctx.fill();

      const gemColors = ['#81ecec', '#ff7675', '#fdcb6e', '#a29bfe'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = gemColors[i];
        ctx.shadowBlur = 8; ctx.shadowColor = gemColors[i];
        ctx.beginPath();
        ctx.arc(-15 + i * 10, -this.size * 0.4, 3.5, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.save();
      const fistBob = Math.sin(t * 0.006) * 6;
      ctx.fillStyle = mainColor;
      ctx.shadowBlur = 10; ctx.shadowColor = mainColor;
      ctx.beginPath(); ctx.roundRect(-this.size * 1.7, -10 + fistBob, 14, 20, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(this.size * 1.7 - 14, -10 - fistBob, 14, 20, 4); ctx.fill();
      ctx.restore();
    }
    else if (si === 4) {
      // 5. Judge of Morality (Kant): Clockwork categorical imperative
      ctx.save();
      ctx.rotate(-t * 0.001);
      ctx.strokeStyle = '#ffd200'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.95, 0, Math.PI*2); ctx.stroke();
      
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.65, 0, Math.PI*2); ctx.stroke();
      
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-2, -this.size * 0.9, 4, this.size * 1.8);
      ctx.fillRect(-this.size * 0.9, -2, this.size * 1.8, 4);
      ctx.restore();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
    }
    else if (si === 5) {
      // 6. Nietzsche Relic/Shadow: Void Blackhole sphere absorbing static
      ctx.save();
      ctx.shadowBlur = 30; ctx.shadowColor = '#000000';
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
      
      ctx.strokeStyle = 'rgba(220, 220, 220, 0.7)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 1.35, this.size * 0.5, t * 0.002, 0, Math.PI*2);
      ctx.stroke();
      
      ctx.fillStyle = '#ff4757'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff4757';
      ctx.beginPath();
      ctx.ellipse(-8, -4, 4, 2, 0.1, 0, Math.PI*2);
      ctx.ellipse(8, -4, 4, 2, -0.1, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    else {
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Pattern active border
    if (this.isPatternActive && !this.isStunned) {
      ctx.strokeStyle = '#a4b0be';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(rx, ry, this.size + 3, 0, Math.PI * 2);
      ctx.stroke();
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
