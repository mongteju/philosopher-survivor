import { sfx } from '../audio.js';
import { Idol } from './enemy.js';

// ─── BOSS QUOTES DATABASE ───────────────────────────────────────────
const BOSS_QUOTES = {
  0: [ // 소피스트 (Sophist)
    "당신이 아는 진리가 절대적이라고 확신하는가?",
    "상대방을 설득하지 못한다면 그것이 무슨 소용인가?",
    "이 세상에 과연 보편적인 진리라는 게 존재하는가?",
    "말재주조차 진리의 일부분이 아니란 말인가?"
  ],
  1: [ // 평정의 감시관 (Apatheia Guardian / Stoic)
    "왜 외부의 사소한 자극에 흔들리고 고통받는가?",
    "그대가 제어할 수 없는 운명을 겸허히 받아들일 수 있는가?",
    "일시적인 격정에 휘둘리는 그대의 이성은 온전한가?",
    "어째서 내면의 고요함을 찾으려 하지 않는가?"
  ],
  2: [ // 교조주의의 망령 (Dogmatism Ghost / Medieval)
    "그대는 왜 성스러운 교리를 의심하려 드는가?",
    "맹목적인 믿음이 없이 어찌 구원의 빛을 얻으려 하는가?",
    "절대적인 신념보다 인간의 얄팍한 이성이 앞서는가?",
    "진리의 경계를 넘는 이단적 사상을 품고 있진 않은가?"
  ],
  3: [ // 우상의 거인 (Prejudice Giant / Empiricism)
    "그대의 선입견과 마음속 우상을 완전히 비워내었는가?",
    "그대 스스로 보고 믿는 동굴 속 그림자가 진짜 세상인가?",
    "시장의 뜬소문과 왜곡된 언어에 현혹되지 않을 자신이 있는가?",
    "경험하지 않은 지식을 어찌 참된 힘이라 부를 수 있겠는가?"
  ],
  4: [ // 도덕의 심판관 (Morality Judge)
    "그대의 행동 준칙은 보편적 법칙이 될 자격이 있는가?",
    "그대는 타인의 인격을 목적 그 자체로 대하고 있는가?",
    "정당한 의무가 아닌 순간의 동정심으로 선을 행하는가?",
    "도덕적 결단을 성실히 실천하고 있는가?"
  ],
  5: [ // 허무의 그림자 / 종말룡 (Nihilism Shadow / Dragon)
    "신이 사라진 세상에서 스스로의 가치를 창조했는가?",
    "그대 영혼을 무겁게 짓누르는 고통의 삶을 진정 사랑할 수 있는가?",
    "절망의 심연 속에서 허무를 극복할 창조적 불꽃을 보았는가?",
    "그대는 잿빛 파멸을 딛고 일어설 참된 초인(Übermensch)인가?"
  ]
};

// ─── BOSS BULLET ────────────────────────────────────────────────────
export class BossBullet {
  constructor(x, y, angle, speed, type, color, stageIndex = null) {
    this.x = x; this.y = y; this.angle = angle; this.speed = stageIndex === 5 ? speed * 1.8 : speed;
    this.type = type; this.size = 10; this.life = 7000; this.time = 0;
    this.baseAngle = angle; this.spawnX = x; this.spawnY = y;
    this.color = color || (type === 'spiral' ? '#ff6b81' : type === 'curve' ? '#a29bfe' : '#ff4757');
    this.stageIndex = stageIndex;
    
    const baseDmg = 18;
    if (stageIndex === 5) {
      this.dmg = baseDmg * 20; // 360
    } else if (stageIndex !== null && stageIndex !== undefined) {
      this.dmg = baseDmg * 10; // 180
    } else {
      this.dmg = baseDmg; // normal fallback
    }
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
    const distSq = dx * dx + dy * dy;
    const limit = this.size + player.size;
    if (!player.isInvincible && distSq < limit * limit) {
      const dmg = this.dmg !== undefined ? this.dmg : 18;
      player.takeDamage(dmg, window.gameInstance);
      this.life = 0;
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    
    // Apply a harsh shadow/glow specific to boss projectiles
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    if (this.type === 'spiral') {
      // Distinct Boss Spiral: A dark, pulsating saw-blade instead of flower petals
      ctx.translate(rx, ry);
      ctx.rotate(this.time * 0.012);
      
      const pulse = 1 + Math.sin(this.time * 0.01) * 0.2;
      const s = this.size * 1.6 * pulse;
      
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // Black jagged spikes
      ctx.fillStyle = '#1e272e';
      const spikes = 8;
      for (let i = 0; i < spikes; i++) {
        ctx.rotate((Math.PI * 2) / spikes);
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, s * 0.5);
        ctx.lineTo(0, s);
        ctx.lineTo(s * 0.2, s * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    }
    else if (this.type === 'curve') {
      // Distinct Boss Comet: Evil ghostly phantom shape with dark borders
      ctx.translate(rx, ry);
      ctx.rotate(this.angle);
      
      const grd = ctx.createLinearGradient(-this.size * 3, 0, this.size, 0);
      grd.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grd.addColorStop(0.5, this.color);
      grd.addColorStop(1, '#ffffff');
      
      ctx.fillStyle = grd;
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(-this.size * 2.5, 0);
      ctx.lineTo(-this.size * 0.5, -this.size * 1.2);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.5, this.size * 1.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // Add black border to differentiate from player's borderless magic
    }
    else {
      // Distinct Boss Straight: Aggressive spiked diamond with dark core
      ctx.translate(rx, ry);
      ctx.rotate(this.angle);
      
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.moveTo(-this.size * 1.5, 0);
      ctx.lineTo(0, -this.size * 0.8);
      ctx.lineTo(this.size * 2, 0); // Very long sharp tip
      ctx.lineTo(0, this.size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Dark evil core instead of white dot
      ctx.fillStyle = '#1e272e';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2); ctx.fill();
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
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      if (!p.isInvincible && (dx * dx + dy * dy) < this.radius * this.radius) {
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
    if (!this.lit) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const limit = this.size + player.size;
      if ((dx * dx + dy * dy) < limit * limit) {
        this.lit = true;
        game.spawnParticles(this.x, this.y, '#ffd200', 15, 8, -3);
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      }
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
          game.player.takeDamage(200, game, null);
          game.addDamageText(game.player.x, game.player.y - 60, '⚡ 정언명령 충격!', '#ff4757', 18);
        }
      } else {
        game.spawnParticles(game.player.x, this.coord, '#ff4757', 15, 12, -4);
        if (Math.abs(game.player.y - this.coord) < 25) {
          game.player.takeDamage(200, game, null);
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
    if (!this.collected) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const limit = this.size + player.size;
      if ((dx * dx + dy * dy) < limit * limit) {
        this.collected = true;
        game.spawnParticles(this.x, this.y, this.type === 'freedom' ? '#ff9f43' : '#54a0ff', 15, 8, -3);
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        
        const relics = game.nietzcheRelics;
        if (relics && relics.every(r => r.collected)) {
          game.triggerUbermenschMode();
        }
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
    this.hp = this.maxHp; this.size = 38; this.speed = (stageIndex === 3 || stageIndex === 4) ? 2.4 : 1.2;
    this.color = '#e84393'; this.xpVal = 50;
    this.attackTimer = 0; this.attackCd = stageIndex >= 2 ? 900 : 1800;
    this.phase2 = false; this.angle = 0; this.time = 0;
    this.clones = [];
    this.vx = 0; this.vy = 0;
    this.frozenTime = 0; this.slowMul = 1; this.slowTimer = 0;

    // Pattern & Vulnerability States
    this.isPatternActive = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.isClone = false;
    this.prejudiceInitialized = false;

    // Dialogue properties
    this.dialogueTimer = 3000 + Math.random() * 2000;
    this.dialogueDisplayTimer = 0;
    this.activeDialogue = "";
  }

  update(dt, player, game) {
    this.frozenTime = 0; // Bosses are completely immune to freezing

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
          this.dialogueDisplayTimer = 7500; // Display for 7.5s
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
          game.showBossTooltip("🦅 허무주의의 그림자: 허무의 잿빛 심연 속에서, 자유와 책임의 유물(🔥)을 다시 모으십시오!");
        } else if (this.stageIndex === 4 && this.hp > 0) {
          this.isPatternActive = true;
          this.kantTrafficLight = 'green';
          this.kantTrafficTimer = 2500;
          game.kantTrafficLight = 'green';
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

    const dx = player.x - this.x, dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (player.auraEnemySlowAura && distSq < 32400) { // 180 * 180 = 32400
      currentSlowMul = Math.min(currentSlowMul, 0.75);
      this.slowTimer = Math.max(this.slowTimer, 100);
    }

    this.time += dt;

    // Phase 2 transition
    if (this.hp < this.maxHp * 0.5 && !this.phase2) {
      this.phase2 = true;
      this.attackCd = Math.max(this.stageIndex >= 2 ? 400 : 800, this.attackCd * 0.65);
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
          const bounds = (game && game.bounds) ? game.bounds : 5000;
          const pad = 110;
          const zoneX = Math.max(-bounds + pad, Math.min(bounds - pad, player.x + Math.cos(angle) * dist));
          const zoneY = Math.max(-bounds + pad, Math.min(bounds - pad, player.y + Math.sin(angle) * dist));
          game.ataraxiaZone = {
            x: zoneX,
            y: zoneY,
            radius: 110
          };
          game.showBossTooltip("🟢 아파테이아: 모든 격정에서 벗어난 고요한 영역(🟢)을 찾으십시오! BGM이 멈추는 평정 속에 안식처가 있습니다.");
          if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
        }
      }
    }

    // Stage 3 (Dogmatism): Medieval Darkness & Candlesticks (Repeating Gimmick)
    if (this.stageIndex === 2 && !this.isClone) {
      if (!this.dogmatismInitialized) {
        this.dogmatismInitialized = true;
        this.dogmatismTimer = 6000; // Trigger first time after 6 seconds
      }
      
      if (!this.isPatternActive && !this.isStunned) {
        this.dogmatismTimer -= dt;
        if (this.dogmatismTimer <= 0) {
          this.isPatternActive = true;
          game.medievalDarkness = true;
          game.showBossTooltip("🕯️ 교조주의: 교리가 세상을 어둠으로 덮었습니다! 신앙과 이성의 촛대(🕯️)를 활성화하여 빛을 찾으십시오!");
          const bounds = (game && game.bounds) ? game.bounds : 5000;
          const pad = 100;
          const cX = this.x;
          const cY = this.y;
          game.candlesticks = [
            new Candlestick(Math.max(-bounds + pad, Math.min(bounds - pad, cX - 220)), Math.max(-bounds + pad, Math.min(bounds - pad, cY - 220)), "제1교조: 무조건적 신앙 (Faith)"),
            new Candlestick(Math.max(-bounds + pad, Math.min(bounds - pad, cX + 220)), Math.max(-bounds + pad, Math.min(bounds - pad, cY - 220)), "제2교조: 편협한 신념 (Dogma)"),
            new Candlestick(Math.max(-bounds + pad, Math.min(bounds - pad, cX - 220)), Math.max(-bounds + pad, Math.min(bounds - pad, cY + 220)), "제3교조: 맹목적 추종 (Conformity)"),
            new Candlestick(Math.max(-bounds + pad, Math.min(bounds - pad, cX + 220)), Math.max(-bounds + pad, Math.min(bounds - pad, cY + 220)), "제4교조: 독단적 확신 (Certainty)")
          ];
          
          // Setup global gimmick
          game.gimmickActive = true;
          game.gimmickTimer = 20000; // 20 seconds for 4 candlesticks
          game.gimmickMaxTime = 20000;
          game.gimmickInstruction = "공략법: 20초 이내에 촛대(🕯️) 4개를 몸으로 터치하여 모두 활성화하십시오!";
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
            game.warningZones.push(new WarningZone(wx, wy, 80, 250, 1200));
            if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
          }
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
        // If all active idols are destroyed (size becomes 0)
        if (game.activeIdols.size === 0) {
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

    // Stage 5 (Kant Clock): Traffic Light Gimmick (Kantian Imperative)
    if (this.stageIndex === 4 && !this.isClone) {
      if (!this.kantInitialized) {
        this.kantInitialized = true;
        this.isPatternActive = true;
        this.kantTrafficLight = 'green';
        this.kantTrafficTimer = 2500;
        
        // Setup global gimmick
        game.gimmickActive = true;
        game.gimmickTimer = 2500;
        game.gimmickMaxTime = 2500;
        game.gimmickInstruction = "🟢 초록불: 자유롭게 이동하며 보스를 공격하십시오!";
        
        game.kantTrafficLight = 'green';
        game.kantViolatedInThisRedTurn = false;
        
        // Clear old grid/line variables
        game.gridLines = [];
        game.kantDutyLine = null;
      }

      if (this.isPatternActive) {
        this.speed = (this.stageIndex === 4) ? 0.9 : 0.45; // Walk slowly like a clock hand
        this.kantTrafficTimer -= dt;
        game.gimmickTimer = Math.max(0, this.kantTrafficTimer);
        
        if (this.kantTrafficTimer <= 0) {
          if (this.kantTrafficLight === 'green') {
            this.kantTrafficLight = 'yellow';
            this.kantTrafficTimer = 2000;
            game.gimmickMaxTime = 2000;
            game.gimmickInstruction = "🟡 노란불: 곧 빨간불이 켜집니다! 정지할 준비를 하십시오!";
            if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
          } else if (this.kantTrafficLight === 'yellow') {
            this.kantTrafficLight = 'red';
            this.kantTrafficTimer = 3000;
            game.gimmickMaxTime = 3000;
            game.gimmickInstruction = "🔴 빨간불: 정지하십시오! 움직이면 최대 체력의 50% 피해!";
            game.kantViolatedInThisRedTurn = false; // Reset violation flag for this red turn
            if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
          } else {
            this.kantTrafficLight = 'green';
            this.kantTrafficTimer = 2500;
            game.gimmickMaxTime = 2500;
            game.gimmickInstruction = "🟢 초록불: 자유롭게 이동하며 보스를 공격하십시오!";
          }
          game.kantTrafficLight = this.kantTrafficLight;
        }

        // Show warning text as a boss tooltip
        if (this.kantTrafficLight === 'green') {
          game.showBossTooltip("🟢 신호등 [초록불]: 자유롭게 이동 가능");
        } else if (this.kantTrafficLight === 'yellow') {
          game.showBossTooltip("🟡 신호등 [노란불]: 경고! 곧 정지하십시오!");
        } else {
          game.showBossTooltip("🔴 신호등 [빨간불]: 정지! 움직임 감지 시 치명상!");
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
        game.showBossTooltip("🦅 허무주의의 그림자: 신은 죽었다! 허무의 심연(Phase 1) 속에서 그의 그림자를 극복하십시오!");
      }

      // Check for Quiz at 50% HP
      if (this.hp <= this.maxHp * 0.5 && !this.nietzscheQuizTriggered && !this.dragonActive) {
        this.nietzscheQuizTriggered = true;
        this.vx = 0;
        this.vy = 0;
        game.triggerNietzscheQuiz(this);
        return;
      }

      if (this.dragonActive) {
        if (this.dragonBreathTimer === undefined) {
          this.dragonBreathTimer = 10000; // 10 seconds before first breath
          this.dragonBreathState = 'none'; // 'none', 'warning', 'firing'
          this.dragonBreathDuration = 0;
        }

        if (this.dragonBreathState === 'none') {
          this.dragonBreathTimer -= dt;
          if (this.dragonBreathTimer <= 0) {
            this.dragonBreathState = 'warning';
            this.dragonBreathDuration = 7000; // 7 seconds safe zone duration (3s + 4s)
            
            game.nietzscheSafeZone = null;
            game.nietzscheSafeColumn = Math.floor(Math.random() * 5); // 0 to 4
            
            game.gimmickActive = true;
            game.gimmickTimer = 7000;
            game.gimmickMaxTime = 7000;
            game.gimmickInstruction = "공략법: 7초 내에 빛나는 거대 안전 구역(열)으로 진입하십시오!";
            game.showBossTooltip("🐉 허무의 종말룡: 7초 뒤 전멸기가 발동됩니다! 🟢안전 구역에서 초인으로 각성하십시오!");
            if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
          }
        } else if (this.dragonBreathState === 'warning') {
          this.dragonBreathDuration -= dt;
          
          // Move to C2 (Center of Row 2)
          const center = game.nietzscheArenaCenter || { x: player.x, y: player.y };
          const H = game.nietzscheArenaHeight || 800;
          const targetX = center.x;
          const targetY = center.y - H/2 + H * 0.3; // Center of Row 2
          
          const dx = targetX - this.x;
          const dy = targetY - this.y;
          const distSqMove = dx * dx + dy * dy;
          
          if (distSqMove > 100) { // 10 * 10 = 100
            const dist = Math.sqrt(distSqMove) || 1;
            this.vx = (dx / dist) * this.speed * 2.5;
            this.vy = (dy / dist) * this.speed * 2.5;
            this.x += this.vx * dt * 0.06;
            this.y += this.vy * dt * 0.06;
          } else {
            this.vx = 0;
            this.vy = 0;
            this.x = targetX;
            this.y = targetY;
          }
          this.angle = Math.atan2(player.y - this.y, player.x - this.x);
          
          if (this.dragonBreathDuration <= 0) {
            this.dragonBreathState = 'firing';
            this.dragonBreathDuration = 1500; // 1.5 seconds explosion
            game.gimmickInstruction = "💥 파멸의 심연 브레스 발동!";
            game.showBossTooltip("🔥 허무의 종말룡: 거대한 불길이 투기장을 휩씁니다!");
            if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
            
            // Execute the massive attack!
            if (!player.superInvincible && !player.isInvincible) {
              player.takeDamage(9999, game); // Insta-kill if not in safe zone
              game.addDamageText(player.x, player.y - 60, "💥 파멸!", "#ff4757", 30, true);
            }
          }
        } else if (this.dragonBreathState === 'firing') {
          this.dragonBreathDuration -= dt;
          this.vx = 0;
          this.vy = 0;
          
          // Face the player
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          this.angle = Math.atan2(dy, dx);
          
          // Spawn massive particles everywhere except the safe column
          const center = game.nietzscheArenaCenter || { x: player.x, y: player.y };
          const W = game.nietzscheArenaWidth || 1200;
          const H = game.nietzscheArenaHeight || 800;
          
          for (let i = 0; i < 8; i++) {
            const px = center.x - W/2 + Math.random() * W;
            const py = center.y - H/2 + Math.random() * H;
            const col = game.nietzscheSafeColumn;
            if (col !== undefined && col !== null && px >= center.x - W/2 + col*(W/5) && px <= center.x - W/2 + (col+1)*(W/5)) {
               continue; // safe column
            }
            game.spawnParticles(px, py, Math.random() < 0.5 ? '#ff4757' : '#2d3436', 2, 10, -2);
          }
          
          if (this.dragonBreathDuration <= 0) {
            this.dragonBreathState = 'none';
            this.dragonBreathTimer = 15000; // 15s cooldown
            game.nietzscheSafeColumn = null;
            player.superInvincible = false;
            game.gimmickActive = false;
            game.showBossTooltip("🐉 허무의 종말룡: 심연 브레스 종료. 투기장에 적막이 흐릅니다...");
          }
          return;
        }
      }
    }

    // Clone animation sway
    if (this.isClone) {
      this.swayPhase = (this.swayPhase || 0) + (this.swaySpeed || 0.05) * dt;
    }

    if (this.stageIndex === 5 && this.dragonActive) {
      const center = game.nietzscheArenaCenter || { x: player.x, y: player.y };
      const H = game.nietzscheArenaHeight || 800;
      const targetX = center.x;
      const targetY = center.y - H/2 + H * 0.3; // Center of Row 2 (C2)
      const dxTarget = targetX - this.x;
      const dyTarget = targetY - this.y;
      const distSqTarget = dxTarget * dxTarget + dyTarget * dyTarget;
      
      if (distSqTarget > 100) { // 10 * 10 = 100
        const dist = Math.sqrt(distSqTarget) || 1;
        this.vx = (dxTarget / dist) * this.speed * 2.5;
        this.vy = (dyTarget / dist) * this.speed * 2.5;
        this.x += this.vx * dt * 0.06;
        this.y += this.vy * dt * 0.06;
      } else {
        this.vx = 0;
        this.vy = 0;
        this.x = targetX;
        this.y = targetY;
      }
      
      const dxP = player.x - this.x, dyP = player.y - this.y;
      this.angle = Math.atan2(dyP, dxP);
      
      // Removed collision damage since boss is in Row 1 and player in Row 3-5, they shouldn't collide
      
      this.attackTimer += dt;
      if (this.attackTimer >= this.attackCd) {
        this.attackTimer = 0;
        this.fireAttack(player, game);
      }
      return; // Skip normal chasing movement
    }

    const d = Math.sqrt(distSq) || 1;
    const spd = (this.phase2 ? this.speed * 1.5 : this.speed) * currentSlowMul;
    this.vx = (dx / d) * spd; this.vy = (dy / d) * spd;
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.angle = Math.atan2(dy, dx);
    if (!player.isInvincible && distSq < (this.size + player.size) * (this.size + player.size)) {
      const collisionDmg = 22 * (this.stageIndex === 5 ? 20 : 10);
      player.takeDamage(collisionDmg, game, this);
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
    let fired = false;
    if (si === 0) { // 소피스트: spiral burst
      for (let i = 0; i < (this.phase2 ? 12 : 8); i++) {
        const a = (Math.PI * 2 / (this.phase2 ? 12 : 8)) * i + this.time * 0.001;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 3.5, 'spiral', null, this.stageIndex));
      }
      fired = true;
    } else if (si === 1) { // 아파테이아: warning zones
      for (let i = 0; i < 3; i++) {
        const wx = player.x + (Math.random() - 0.5) * 300;
        const wy = player.y + (Math.random() - 0.5) * 300;
        game.warningZones.push(new WarningZone(wx, wy, 100, 350, 1500));
      }
    } else if (si === 2) { // 교조주의: curve shots
      for (let i = 0; i < (this.phase2 ? 6 : 4); i++) {
        const a = Math.atan2(player.y - this.y, player.x - this.x) + (i - 1.5) * 0.35;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 4, 'curve', null, this.stageIndex));
        if (!game.medievalDarkness) game.medievalDarkness = true;
      }
      fired = true;
    } else if (si === 3) { // 편견의 거인: warning zones + spiral
      const cnt = this.phase2 ? 5 : 3;
      for (let i = 0; i < cnt; i++) {
        const a = (Math.PI * 2 / cnt) * i;
        game.warningZones.push(new WarningZone(
          this.x + Math.cos(a) * 180, this.y + Math.sin(a) * 180, 90, 300, 1200));
      }
    } else if (si === 4) { // 칸트: moral rule
      for (let i = 0; i < (this.phase2 ? 12 : 7); i++) {
        const a = (Math.PI * 2 / (this.phase2 ? 12 : 7)) * i + this.time * 0.001;
        game.bossBullets.push(new BossBullet(this.x, this.y, a, 3, 'straight', null, this.stageIndex));
      }
      fired = true;
    } else { // 허무주의: heavy spiral
      if (si === 5 && this.dragonActive) {
        if (!this.dragonPatternIndex) this.dragonPatternIndex = 0;
        this.dragonPatternIndex = (this.dragonPatternIndex + 1) % 3;
        
        if (this.dragonPatternIndex === 0) {
          // Spiral Barrage
          const cnt = 24;
          for (let i = 0; i < cnt; i++) {
            const a = (Math.PI * 2 / cnt) * i + this.time * 0.0035;
            game.bossBullets.push(new BossBullet(this.x, this.y, a, 5.0, 'spiral', '#54a0ff', this.stageIndex));
          }
          fired = true;
        } else if (this.dragonPatternIndex === 1) {
          // Targeted Flame Warning Zones
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 200;
            const wx = player.x + Math.cos(angle) * dist;
            const wy = player.y + Math.sin(angle) * dist;
            game.warningZones.push(new WarningZone(wx, wy, 120, 800, 1000));
          }
        } else {
          // Curved Wave Streams
          for (let i = 0; i < 8; i++) {
            const a = Math.atan2(player.y - this.y, player.x - this.x) + (i - 3.5) * 0.25;
            game.bossBullets.push(new BossBullet(this.x, this.y, a, 5.5, 'curve', '#54a0ff', this.stageIndex));
          }
          fired = true;
        }
      } else {
        const cnt = this.phase2 ? 20 : 12;
        for (let i = 0; i < cnt; i++) {
          const a = (Math.PI * 2 / cnt) * i + this.time * 0.002;
          game.bossBullets.push(new BossBullet(this.x, this.y, a, 4.5, 'spiral', '#54a0ff', this.stageIndex));
        }
        fired = true;
      }
    }
    
    if (fired) {
      if (typeof sfx !== 'undefined' && sfx.playEnemyShoot) sfx.playEnemyShoot();
    }
  }

  draw(ctx, camera) {
    this.frozenTime = 0; // Bosses are immune to freeze visual effects
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
        
        let t_mod = t;
        let flyOffset = 0;
        if (this.dragonBreathState === 'warning' || this.dragonBreathState === 'firing') {
          flyOffset = -15 - Math.sin(t * 0.005) * 10;
          
          // Draw ground shadow under dragon
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.scale(1.2, 0.8);
          ctx.beginPath();
          ctx.arc(0, 30 / 0.8, 38, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          
          ctx.translate(0, flyOffset);
          t_mod = t * 2.0; // speed up wing flap when flying
        }
        
        // 1. Giant Wings
        const wingSway = Math.sin(t_mod * 0.004) * 0.25;
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
        const tailSway = Math.sin(t_mod * 0.005) * 0.4;
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
        
        // 6. Dragon Breath Flame Spewing
        if (this.dragonBreathState === 'firing') {
          ctx.save();
          const breathLength = 320 + Math.sin(t * 0.06) * 40;
          const breathWidth = 90 + Math.sin(t * 0.04) * 15;
          
          const flameGrad = ctx.createLinearGradient(0, -52, 0, -52 - breathLength);
          flameGrad.addColorStop(0, '#ffffff');
          flameGrad.addColorStop(0.15, '#ffd200');
          flameGrad.addColorStop(0.55, '#ff4757');
          flameGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');
          
          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(0, -52);
          ctx.quadraticCurveTo(-breathWidth / 2, -52 - breathLength / 2, -breathWidth, -52 - breathLength);
          ctx.lineTo(breathWidth, -52 - breathLength);
          ctx.quadraticCurveTo(breathWidth / 2, -52 - breathLength / 2, 0, -52);
          ctx.closePath();
          ctx.fill();
          
          // Flame sparks
          ctx.fillStyle = 'rgba(255, 210, 0, 0.5)';
          for (let i = 0; i < 6; i++) {
            const rx = (Math.random() - 0.5) * breathWidth * 1.5;
            const ry = -52 - Math.random() * breathLength;
            ctx.beginPath();
            ctx.arc(rx, ry, 4 + Math.random() * 8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        
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
