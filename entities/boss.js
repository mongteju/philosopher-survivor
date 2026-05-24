import { sfx } from '../audio.js';
import { Idol } from './enemy.js';

// ─── BOSS QUOTES DATABASE ───────────────────────────────────────────
const BOSS_QUOTES = {
  0: [ // 소피스트 (Sophist)
    "인간은 만물의 척도라네.",
    "진리는 절대적이지 않고, 상대적이지.",
    "말재주만 있으면 어떤 학설이든 설파할 수 있어.",
    "의견이 다를 뿐, 틀린 진리는 없다네.",
    "유창한 웅변으로 세상을 논박하겠네!"
  ],
  1: [ // 아파테이아 수호자 (Apatheia Guardian / Stoic)
    "운명을 사랑하라 (Amor Fati).",
    "그대가 제어할 수 없는 것에 마음을 빼앗기지 마라.",
    "모든 마음의 격정을 잠재우고 고요를 찾으라.",
    "외부의 자극은 무의미하다, 내면의 이성에 복종하라.",
    "평정(Ataraxia)만이 그대를 진정 자유롭게 하리니."
  ],
  2: [ // 교조주의의 망령 (Dogmatism Ghost / Medieval)
    "믿기 위해 알라, 알기 위해 믿으라.",
    "신앙과 이성의 조화만이 구원을 가져오리라.",
    "절대적인 교리는 세상의 어둠을 비추는 횃불이다.",
    "의심하지 마라, 맹목적인 믿음이야말로 진리이니.",
    "교리의 수호자가 되어 이단을 척결하겠노라!"
  ],
  3: [ // 편견의 거인 (Francis Bacon / Empiricism)
    "아는 것이 힘이다 (Knowledge is Power)!",
    "인간의 마음속 네 가지 우상을 타파하라!",
    "동굴의 어둠에 갇혀 세상을 편협하게 보지 마라.",
    "시장의 뜬소문과 왜곡된 언어가 세상을 병들게 한다.",
    "편견의 안개를 걷어내고 경험적 사실을 직시하라!"
  ],
  4: [ // 도덕의 심판자 (Kant / Deontology)
    "네 의지의 준칙이 항상 보편적 법칙이 되게 하라!",
    "인격을 결코 수단으로 대하지 말고 목적으로 대하라.",
    "하늘에는 별, 내 안에는 도덕 법칙!",
    "의무는 실천이성의 절대적인 도덕적 명령이다.",
    "사변적 집착에서 벗어나 실천을 통해 원칙을 증명하라!"
  ],
  5: [ // 허무주의의 그림자 (Nietzsche / Existentialism)
    "신은 죽었다! 그리고 우리가 그를 죽였다!",
    "나를 죽이지 못하는 고통은 나를 더 강하게 만든다.",
    "영원회귀의 삶을 사랑하고 극복하여 초인(Übermensch)이 되라!",
    "괴물과 싸우는 자는 스스로 괴물이 되지 않도록 경계해야 한다.",
    "기존의 모든 가치를 재평가하고 허무를 창조로 극복하라!"
  ]
};

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
    try {
      if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
      
      if (!game || !game.player || !game.canvas || isNaN(this.coord)) return;
      
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
    } catch (err) {
      console.error("[RhythmicGridLine Detonate Error]", err);
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
    const baseHps = [1500, 5000, 40000, 120000, 360000, 1260000];
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

    // Dialogue properties
    this.dialogueTimer = 3000 + Math.random() * 2000;
    this.dialogueDisplayTimer = 0;
    this.activeDialogue = "";
  }

  update(dt, player, game) {
    if (this.frozenTime > 0) { this.frozenTime -= dt; return; }

    // Dialogue update
    if (this.dialogueDisplayTimer > 0) {
      this.dialogueDisplayTimer -= dt;
      if (this.dialogueDisplayTimer <= 0) {
        this.activeDialogue = "";
      }
    }
    if (this.isStunned) {
      this.activeDialogue = "";
      this.dialogueDisplayTimer = 0;
    } else if (!this.isClone) {
      this.dialogueTimer -= dt;
      if (this.dialogueTimer <= 0) {
        const quotes = BOSS_QUOTES[this.stageIndex];
        if (quotes && quotes.length > 0) {
          this.activeDialogue = quotes[Math.floor(Math.random() * quotes.length)];
          this.dialogueDisplayTimer = 2500; // Display for 2.5s
        }
        this.dialogueTimer = 7000 + Math.random() * 4000; // Trigger every 7-11 seconds
      }
    }

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
        this.speed = 0;
        return; // Channeling safe zone
      } else {
        this.apatheiaTimer -= dt;
        if (this.apatheiaTimer <= 0) {
          this.apatheiaActive = true;
          this.isPatternActive = true;
          
          // Setup global gimmick
          game.gimmickActive = true;
          game.gimmickTimer = 5000;
          game.gimmickMaxTime = 5000;
          game.gimmickInstruction = "공략법: 5초 이내에 초록색 아파테이아(🟢) 영역 안으로 대피하십시오!";
          
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
            new Candlestick(this.x - 220, this.y - 220, "제1교조: 무조건적 신앙 (Faith)"),
            new Candlestick(this.x + 220, this.y - 220, "제2교조: 편협한 신념 (Dogma)"),
            new Candlestick(this.x - 220, this.y + 220, "제3교조: 맹목적 추종 (Conformity)"),
            new Candlestick(this.x + 220, this.y + 220, "제4교조: 독단적 확신 (Certainty)")
          ];
          
          // Setup global gimmick
          game.gimmickActive = true;
          game.gimmickTimer = 20000; // Increased to 20 seconds for 4 candlesticks
          game.gimmickMaxTime = 20000;
          game.gimmickInstruction = "공략법: 20초 이내에 촛대(🕯️) 4개를 몸으로 터치하여 모두 활성화하십시오!";
          break;
        }
      }
      if (this.isPatternActive && game.candlesticks && game.candlesticks.length > 0) {
        // Spawn lightning WarningZones near unlit candlesticks periodically to increase difficulty
        if (!this.thunderTimer) this.thunderTimer = 0;
        this.thunderTimer += dt;
        if (this.thunderTimer >= 1500) {
          this.thunderTimer = 0;
          const unlit = game.candlesticks.filter(c => !c.lit);
          if (unlit.length > 0) {
            const targetCandle = unlit[Math.floor(Math.random() * unlit.length)];
            const wx = targetCandle.x + (Math.random() - 0.5) * 100;
            const wy = targetCandle.y + (Math.random() - 0.5) * 100;
            game.warningZones.push(new WarningZone(wx, wy, 80, 25, 1200));
            if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
          }
        }

        const allLit = game.candlesticks.every(c => c.lit);
        if (allLit) {
          this.isPatternActive = false;
          game.medievalDarkness = false;
          game.candlesticks = [];
          
          // Clear global gimmick
          game.gimmickActive = false;
          game.gimmickTimer = 0;
          
          this.isStunned = true;
          this.stunTimer = 8000;
          game.showBossTooltip("🛡️ 어둠 극복! 신앙과 이성의 조화로 교독의 환각을 비추었습니다!");
          game.addDamageText(this.x, this.y - 70, "✨ 교조 파괴! 보스 무력화!", "#ffd200", 24);
          if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
        }
      }
    }

    // Stage 4 (Idols of Prejudice): Scrambled sensory waves
    if ((this.stageIndex === 3 || this.name.includes("편견")) && !this.isClone) {
      if (!this.prejudiceInitialized) {
        this.prejudiceInitialized = true;
        this.isPatternActive = true;
        this.prejudiceTimer = 0;
        game.prejudiceWave = 0;
        game.showBossTooltip("🗿 편견의 우상: 4대 우상이 활성화되었습니다! 우상을 먼저 모두 제거하십시오! 편견의 왜곡이 지속됩니다!");
        
        console.log("[Prejudice Gimmick] Spawning Idols of Prejudice. Boss name:", this.name, "StageIndex:", this.stageIndex);
        
        // Spawn the 4 Idols directly to guarantee they always appear
        const idolTypes = ['cave', 'tribe', 'market', 'theater'];
        game.activeIdols.clear();
        idolTypes.forEach((type, i) => {
          const a = (Math.PI * 2 / 4) * i;
          const idol = new Idol(
            player.x + Math.cos(a) * 300,
            player.y + Math.sin(a) * 300,
            type, this
          );
          game.activeIdols.set(type, idol);
          game.enemies.push(idol);
        });

        // Setup global gimmick
        game.gimmickActive = true;
        game.gimmickTimer = 25000; // 25 seconds
        game.gimmickMaxTime = 25000;
        game.gimmickInstruction = "공략법: 25초 이내에 보스 주위의 4대 우상(Idols)을 모두 파괴하십시오!";
      }
      if (this.isPatternActive) {
        let allDead = true;
        game.activeIdols.forEach((idol) => { if (idol.hp > 0) allDead = false; });
        if (allDead && game.activeIdols.size > 0) {
          game.activeIdols.clear();
          this.isPatternActive = false;
          game.prejudiceWave = 0;
          game.restoreHUD();
          
          // Clear global gimmick
          game.gimmickActive = false;
          game.gimmickTimer = 0;
          
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
        this.kantCycleDuration = 12000; // Increased to 12s
        this.spawnedGridLines = false;
        game.showBossTooltip("⏰ 도덕적 정언명령: 절대 법칙의 리듬에 맞추어 격자 경고선(💥)을 회피하십시오! 3사이클 생존 시 약화됩니다.");
        
        // Setup global gimmick
        game.gimmickActive = true;
        game.gimmickTimer = 36000; // 3 cycles * 12 seconds = 36 seconds
        game.gimmickMaxTime = 36000;
        game.gimmickInstruction = "공략법: 3단계의 정언명령 의무를 완수하며 격자 폭발을 피하십시오!";
        
        // Reset Kantian rules state
        game.kantRuleViolation = false;
        game.kantStillTimer = 0;
        game.kantMoveTimer = 0;
        
        // Register Golden Line (도덕의 선)
        game.kantDutyLine = { y: player.y };
      }

      if (this.isPatternActive) {
        this.speed = 0.3; // Stays mostly centered like a ticking clock
        this.kantTimer += dt;
        
        // Synchronize global gimmickTimer with kantTimer and kantCycle
        game.gimmickTimer = Math.max(0, 36000 - ((this.kantCycle - 1) * 12000 + this.kantTimer));
        
        // Update instructions based on cycle
        if (this.kantCycle === 1) {
          game.gimmickInstruction = "정언명령 1단계: 황금빛 도덕의 선을 벗어나지 않고 횡이동하십시오!";
        } else if (this.kantCycle === 2) {
          game.gimmickInstruction = "정언명령 2단계: 보스 주변 영역에 머무르십시오!";
        } else if (this.kantCycle === 3) {
          game.gimmickInstruction = "정언명령 3단계: 움직이지 말고 제자리에 멈춰 서십시오!";
        }

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
          
          if (this.kantCycle === 2) {
            game.kantDutyLine = null; // Clear line for cycle 2
          }

          if (this.kantCycle > 3) {
            this.isPatternActive = false;
            this.speed = 1.2;
            game.gridLines = [];
            game.kantDutyLine = null;
            
            // Clear global gimmick
            game.gimmickActive = false;
            game.gimmickTimer = 0;
            
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

    // Stage 6 (Nietzsche): Phase 1 & 2
    if (this.stageIndex === 5 && !this.isClone) {
      if (!this.nietzcheInitialized) {
        this.nietzcheInitialized = true;
        this.isPatternActive = false;
        this.dragonActive = false;
        this.nietzscheQuizTriggered = false;
        game.showBossTooltip("🦅 니체: 신은 죽었다! 허무의 심연(Phase 1) 속에서 그의 그림자를 극복하십시오!");
      }

      // Check for Quiz at 50% HP
      if (this.hp <= this.maxHp * 0.5 && !this.nietzscheQuizTriggered && !this.dragonActive) {
        this.nietzscheQuizTriggered = true;
        this.vx = 0;
        this.vy = 0;
        game.triggerNietzscheQuiz(this);
        return;
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
    
    // Setup global gimmick
    game.gimmickActive = true;
    game.gimmickTimer = 20000; // 20 seconds
    game.gimmickMaxTime = 20000;
    game.gimmickInstruction = "공략법: 흔들림 없는 진짜 저울(분신)을 공격해 처치하십시오!";
    
    this.clonesList = [];
    const realIndex = Math.floor(Math.random() * 3);
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
      
      if (i === realIndex) {
        clone.isRealClone = true;
        clone.swayPhase = 0;
        clone.swaySpeed = 0;
      } else {
        clone.isRealClone = false;
        clone.swayPhase = Math.random() * Math.PI * 2;
        clone.swaySpeed = 0.003 + Math.random() * 0.002;
      }
      
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
      if (si === 5 && this.dragonActive) {
        if (!this.dragonPatternIndex) this.dragonPatternIndex = 0;
        this.dragonPatternIndex = (this.dragonPatternIndex + 1) % 3;
        
        if (this.dragonPatternIndex === 0) {
          // Spiral Barrage
          const cnt = 24;
          for (let i = 0; i < cnt; i++) {
            const a = (Math.PI * 2 / cnt) * i + this.time * 0.0035;
            game.bossBullets.push(new BossBullet(this.x, this.y, a, 5.0, 'spiral'));
          }
        } else if (this.dragonPatternIndex === 1) {
          // Targeted Flame Warning Zones
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 200;
            const wx = player.x + Math.cos(angle) * dist;
            const wy = player.y + Math.sin(angle) * dist;
            game.warningZones.push(new WarningZone(wx, wy, 120, 40, 1000));
          }
        } else {
          // Curved Wave Streams
          for (let i = 0; i < 8; i++) {
            const a = Math.atan2(player.y - this.y, player.x - this.x) + (i - 3.5) * 0.25;
            game.bossBullets.push(new BossBullet(this.x, this.y, a, 5.5, 'curve'));
          }
        }
      } else {
        const cnt = this.phase2 ? 20 : 12;
        for (let i = 0; i < cnt; i++) {
          const a = (Math.PI * 2 / cnt) * i + this.time * 0.002;
          game.bossBullets.push(new BossBullet(this.x, this.y, a, 4.5, 'spiral'));
        }
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
        ctx.beginPath();
        ctx.arc(-15 + i * 10, -this.size * 0.4, 3.5, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.save();
      const fistBob = Math.sin(t * 0.006) * 6;
      ctx.fillStyle = mainColor;
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
      if (this.dragonActive) {
        // Draw the Giant Black Dragon (허무의 종말룡)
        ctx.save();
        const angle = this.angle;
        ctx.rotate(angle + Math.PI / 2);
        
        // 1. Giant Wings
        const wingSway = Math.sin(t * 0.004) * 0.25;
        ctx.fillStyle = '#1e1b26';
        ctx.strokeStyle = '#8c7ae6';
        ctx.lineWidth = 3.5;
        
        // Left Wing
        ctx.save();
        ctx.translate(-15, -10);
        ctx.rotate(-wingSway - 0.2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-90, -80, -120, -20);
        ctx.quadraticCurveTo(-70, 20, 0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-40, -30); ctx.lineTo(-110, -20);
        ctx.moveTo(-30, -10); ctx.lineTo(-90, 0);
        ctx.stroke();
        ctx.restore();
        
        // Right Wing
        ctx.save();
        ctx.translate(15, -10);
        ctx.rotate(wingSway + 0.2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(90, -80, 120, -20);
        ctx.quadraticCurveTo(70, 20, 0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(40, -30); ctx.lineTo(110, -20);
        ctx.moveTo(30, -10); ctx.lineTo(90, 0);
        ctx.stroke();
        ctx.restore();
        
        // 2. Tail
        const tailSway = Math.sin(t * 0.005) * 0.4;
        ctx.save();
        ctx.translate(0, 45);
        ctx.rotate(tailSway);
        ctx.fillStyle = '#2f2a3f';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-15, 40, -5, 75);
        ctx.lineTo(0, 90);
        ctx.lineTo(5, 75);
        ctx.quadraticCurveTo(15, 40, 10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8c7ae6';
        ctx.stroke();
        
        const fl = 10 + Math.sin(t * 0.02) * 5;
        const tailTipGrd = ctx.createRadialGradient(0, 90, 0, 0, 90, fl);
        tailTipGrd.addColorStop(0, '#ff4757');
        tailTipGrd.addColorStop(0.5, '#ffd200');
        tailTipGrd.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = tailTipGrd;
        ctx.beginPath();
        ctx.arc(0, 90, fl, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 3. Main Body
        ctx.fillStyle = '#0f0c1b';
        ctx.strokeStyle = '#8c7ae6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#ff4757';
        for (let i = 0; i < 5; i++) {
          const sy = -30 + i * 15;
          ctx.beginPath();
          ctx.moveTo(-6, sy);
          ctx.lineTo(0, sy - 12);
          ctx.lineTo(6, sy);
          ctx.closePath();
          ctx.fill();
        }
        
        // 4. Head
        ctx.save();
        ctx.translate(0, -52);
        ctx.fillStyle = '#0f0c1b';
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, 15);
        ctx.lineTo(-25, -15);
        ctx.lineTo(0, -35);
        ctx.lineTo(25, -15);
        ctx.lineTo(20, 15);
        ctx.quadraticCurveTo(0, 25, -20, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-15, -10);
        ctx.quadraticCurveTo(-25, -35, -35, -40);
        ctx.moveTo(15, -10);
        ctx.quadraticCurveTo(25, -35, 35, -40);
        ctx.stroke();
        
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.ellipse(-8, -8, 5, 2.5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(8, -8, 5, 2.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 5. Chest Energy Core
        const corePulse = 18 + Math.sin(t * 0.015) * 5;
        const coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, corePulse);
        coreGrd.addColorStop(0, '#ffffff');
        coreGrd.addColorStop(0.3, '#ff4757');
        coreGrd.addColorStop(0.7, '#8c7ae6');
        coreGrd.addColorStop(1, 'rgba(140, 122, 230, 0)');
        ctx.fillStyle = coreGrd;
        ctx.beginPath();
        ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else {
        // Nietzsche Relic/Shadow: Void Blackhole sphere absorbing static
        ctx.save();
        ctx.fillStyle = '#0a0a0c';
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = 'rgba(220, 220, 220, 0.7)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.35, this.size * 0.5, t * 0.002, 0, Math.PI*2);
        ctx.stroke();
        
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.ellipse(-8, -4, 4, 2, 0.1, 0, Math.PI*2);
        ctx.ellipse(8, -4, 4, 2, -0.1, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
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
    
    // Name & HP bar (Only for clones, main boss is displayed on screen HUD top)
    if (this.isClone) {
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
      ctx.fillText("소피스트의 분신", rx, ry - this.size - 22);
      
      let displayHp;
      if (this.isRealClone) {
        displayHp = this.hp;
      } else {
        displayHp = this.maxHp * (0.22 + Math.sin(t * 0.005) * 0.4);
      }
      const bw = 120, bh = 8, bx = rx - 60, by = ry - this.size - 38;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(bx-2, by-2, bw+4, bh+4, 4); ctx.fill();
      ctx.fillStyle = this.isRealClone ? '#ff4757' : '#7f8c8d';
      ctx.fillRect(bx, by, bw * Math.max(0, displayHp) / this.maxHp, bh);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    }
    
    // Draw Dialogue Speech Bubble
    if (!this.isClone && this.activeDialogue && this.dialogueDisplayTimer > 0) {
      ctx.save();
      ctx.font = '12px Outfit, sans-serif';
      const textWidth = ctx.measureText(this.activeDialogue).width;
      const padX = 14;
      const padY = 8;
      const rectW = textWidth + padX * 2;
      const rectH = 14 + padY * 2;
      
      const bubbleX = rx - rectW / 2;
      const bubbleY = ry - this.size - 50 - rectH;
      
      ctx.fillStyle = 'rgba(15, 18, 30, 0.88)';
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, rectW, rectH, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(15, 18, 30, 0.88)';
      ctx.beginPath();
      ctx.moveTo(rx - 6, bubbleY + rectH);
      ctx.lineTo(rx + 6, bubbleY + rectH);
      ctx.lineTo(rx, bubbleY + rectH + 6);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - 6, bubbleY + rectH);
      ctx.lineTo(rx, bubbleY + rectH + 6);
      ctx.lineTo(rx + 6, bubbleY + rectH);
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.activeDialogue, rx, bubbleY + rectH / 2);
      
      ctx.restore();
    }

    ctx.restore();
  }
}
