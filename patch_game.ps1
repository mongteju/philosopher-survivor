$filePath = '.\game.js'
$code = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 1. Pattern Helper Classes
$helperClasses = @'

// ─── CANDLESTICK (Stage 3 Pattern) ──────────────────────────────────
class Candlestick {
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
class RhythmicGridLine {
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
    ctx.font = 'Outfit, bold 12px sans-serif';
    if (this.isVertical) {
      ctx.fillText(`TICK ${this.tickCount}/4`, rx + 10, H / 2 + 50);
    } else {
      ctx.fillText(`TICK ${this.tickCount}/4`, W / 2 + 50, ry - 10);
    }
    ctx.restore();
  }
}

// ─── NIETZSCHE RELIC (Stage 6 Pattern) ─────────────────────────────
class NietzscheRelic {
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
'@

$bossClass = @'
class Boss {
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
'@

# Locate and replace class Boss
$bossRegex = '(?s)class Boss\s*\{.*?\}\r?\n\}'
$code = [System.Text.RegularExpressions.Regex]::Replace($code, $bossRegex, $bossClass)

# 3. dealDamageToEnemy modifications
$dealDmgTarget = 'dealDamageToEnemy(e, dmg, proj) {'
$dealDmgReplacement = @'
dealDamageToEnemy(e, dmg, proj) {
    if (e.isClone) {
      this.addDamageText(e.x, e.y - e.size - 10, "Miss (궤변)", "#7f8c8d", 14, false);
      return;
    }
'@
if (-not $code.Contains('if (e.isClone) {')) {
    $code = $code.Replace($dealDmgTarget, $dealDmgReplacement)
}

# 4. Remove dead enemies & clone stage clear filter
$filterTarget = "        if (e.type === 'boss') {`r`n          this.onBossDefeated(e);"
$filterTargetLF = "        if (e.type === 'boss') {`n          this.onBossDefeated(e);"
$filterReplacement = @'
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
'@
$code = $code.Replace($filterTarget, $filterReplacement)
$code = $code.Replace($filterTargetLF, $filterReplacement)

# 5. Recalculate stats boost for Ubermensch
$recalcTarget = '    // Recalculate aura bonuses'
$recalcReplacement = @'
    if (window.gameInstance && window.gameInstance.uberMenschMode) {
      this.dmgMultiplier *= 5;
    }

    // Recalculate aura bonuses
'@
if (-not $code.Contains('window.gameInstance.uberMenschMode')) {
    $code = $code.Replace($recalcTarget, $recalcReplacement)
}

# 6. Game constructor helper declarations
$constructTarget = "    this.scroll = 0;`r`n    window.gameInstance = this;"
$constructTargetLF = "    this.scroll = 0;`n    window.gameInstance = this;"
$constructReplacement = @'
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
'@
$code = $code.Replace($constructTarget, $constructReplacement)
$code = $code.Replace($constructTargetLF, $constructReplacement)

# 7. Game.update(dt) updates
$updateTarget = "    // XP frags`r`n    this.xpFrags.forEach(f => f.update(dt, this.player));"
$updateTargetLF = "    // XP frags`n    this.xpFrags.forEach(f => f.update(dt, this.player));"
$updateReplacement = @'
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
'@
$code = $code.Replace($updateTarget, $updateReplacement)
$code = $code.Replace($updateTargetLF, $updateReplacement)

# 8. Render safe zone green & graphics inside Game.draw()
$drawZoneReplacement = @'
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
'@
# Delete original drawing block
$origBlock = "(?s)if \(this\.ataraxiaZone\) \{.*?\}\r?\n    \}"
$code = [System.Text.RegularExpressions.Regex]::Replace($code, $origBlock, "")
$code = $code.Replace("// Medieval darkness overlay`r`n    if (this.medievalDarkness && this.currentBoss) {", $drawZoneReplacement + "`n`n    // Medieval darkness overlay`r`n    if (this.medievalDarkness && this.currentBoss) {")
$code = $code.Replace("// Medieval darkness overlay`n    if (this.medievalDarkness && this.currentBoss) {", $drawZoneReplacement + "`n`n    // Medieval darkness overlay`n    if (this.medievalDarkness && this.currentBoss) {")

# 9. Draw candlesticks, relics, grid lines, blind cave overlay, glitch trails inside Game.draw()
$drawWarningTarget = "    // Warning zones`r`n    this.warningZones.forEach(w => w.draw(ctx, this.camera));"
$drawWarningTargetLF = "    // Warning zones`n    this.warningZones.forEach(w => w.draw(ctx, this.camera));"
$drawWarningReplacement = @'
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
'@
$code = $code.Replace($drawWarningTarget, $drawWarningReplacement)
$code = $code.Replace($drawWarningTargetLF, $drawWarningReplacement)

# 10. Grayscale filter and Sepia shift inside Game.draw()
$drawSaveReplacement = @'
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
'@
$shakeBlock = "(?s)ctx\.save\(\);`r`n    if \(this\.screenShake > 0\) \{.*?\}"
$code = [System.Text.RegularExpressions.Regex]::Replace($code, $shakeBlock, $drawSaveReplacement)
$shakeBlockLF = "(?s)ctx\.save\(\);`n    if \(this\.screenShake > 0\) \{.*?\}"
$code = [System.Text.RegularExpressions.Regex]::Replace($code, $shakeBlockLF, $drawSaveReplacement)

# 11. Recalculate safe zone player BGM silencing in Game.update()
$updateBgmTarget = '    // Update HUD timer'
$updateBgmReplacement = @'
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
'@
$code = $code.Replace($updateBgmTarget, $updateBgmReplacement)

# 12. Recalculate Player Draw active Auras and Glowing ring of fire
$drawAuraTarget = '    // 등급별 특수 아우라 그리기'
$drawAuraReplacement = @'
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
'@
$code = $code.Replace($drawAuraTarget, $drawAuraReplacement)

# 13. Global Close Key Interception for Learned Skills Popup and Keyboard Aura choice navigation
$globalKeydownTarget = '      // Level up card selection' + "`r`n" + '      const lvlScreen = document.getElementById(\'levelup-screen\');'
$globalKeydownTargetLF = '      // Level up card selection' + "`n" + '      const lvlScreen = document.getElementById(\'levelup-screen\');'
$globalKeydownReplacement = @'
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
'@
$code = $code.Replace($globalKeydownTarget, $globalKeydownReplacement)
$code = $code.Replace($globalKeydownTargetLF, $globalKeydownReplacement)

$gachaKeyboardReplacement = @'
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
'@
$cleanGachaTarget = '(?s)// Gacha screen.*?return;`r?\n      \}'
$code = [System.Text.RegularExpressions.Regex]::Replace($code, $cleanGachaTarget, $gachaKeyboardReplacement)

# Double check 은총의 불기둥 rename
$code = $code.Replace("'은총의 불기둥'", "'은총의 스파크'")
$code = $code.Replace('\"은총의 불기둥\"', '\"은총의 스파크\"')

[System.IO.File]::WriteAllText($filePath, $code, [System.Text.Encoding]::UTF8)
Write-Host "Successfully patched game.js natively using PowerShell!"
