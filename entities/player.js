import { PHILOSOPHY_DB, AURA_DB, EVOLUTION_STAGES } from '../db.js';

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
    this.auraSpeedBonus = 0;
    this.auraCooldownReduction = 0;
    this.auraProjSpeedBonus = 0;
    this.auraDamageBonus = 0;
    this.auraDamageReduction = 0;
    this.auraRegenBonus = 0;
    this.auraLifesteal = 0;
    this.auraThornsReflection = 0;
    this.auraCritChance = 0;
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
    
    this.auraSpeedBonus = 0;
    this.auraCooldownReduction = 0;
    this.auraProjSpeedBonus = 0;
    this.auraDamageBonus = 0;
    this.auraDamageReduction = 0;
    this.auraRegenBonus = 0;
    this.auraLifesteal = 0;
    this.auraThornsReflection = 0;
    this.auraCritChance = 0;
    
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
    
    if (window.gameInstance && typeof window.gameInstance.applyAuraStats === 'function') {
      window.gameInstance.applyAuraStats();
    }
  }
  get effectiveSpeed() { return this.speed * (1 + this.auraSpeedBonus); }
  takeDamage(dmg, game) {
    if (this.isInvincible) return;
    const reduced = Math.max(1, Math.floor(dmg * (1 - this.armorReduction) * (1 - (this.auraDamageReduction || 0))));
    this.hp = Math.max(0, this.hp - reduced);
    game.addDamageText(this.x, this.y - 40, reduced, '#ff6b81', 16, false);
    this.isInvincible = true; this.invincibilityFlash = 800;
    setTimeout(() => { this.isInvincible = false; this.invincibilityFlash = 0; }, 800);
    
    // Thorns Aura reflection
    if (this.auraThornsReflection > 0 && game && game.enemies) {
      const reflectDmg = Math.ceil(reduced * this.auraThornsReflection);
      game.enemies.forEach(e => {
        if (Math.hypot(e.x - this.x, e.y - this.y) < 180 && e.hp > 0) {
          game.dealDamageToEnemy(e, reflectDmg);
          game.spawnParticles(e.x, e.y, '#1dd1a1', 3, 5, -2);
        }
      });
    }
    
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
    const bounds = (window.gameInstance && window.gameInstance.bounds) ? window.gameInstance.bounds : 5000;
    this.x = Math.max(-bounds, Math.min(bounds, this.x));
    this.y = Math.max(-bounds, Math.min(bounds, this.y));
    const totalRegen = this.regenHp + (this.auraRegenBonus || 0);
    if (totalRegen > 0) {
      this.regenAccumulator += dt;
      if (this.regenAccumulator >= 1000) { this.heal(totalRegen); this.regenAccumulator = 0; }
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
    const game = window.gameInstance;
    if (game && game.activeAura && game.activeAuraLevel > 0) {
      const auraKey = game.activeAura;
      const lvl = game.activeAuraLevel;
      const time = performance.now();
      const radius = 60 + lvl * 10;
      
      ctx.save();
      ctx.shadowBlur = 15 + Math.sin(time * 0.005) * 5;
      
      // 1. BRILLIANCE AURA (푸른색 마법진 회전 + 푸른빛 아지랑이)
      if (auraKey === 'brilliance') {
        ctx.strokeStyle = 'rgba(84, 160, 255, 0.75)';
        ctx.shadowColor = '#54a0ff';
        
        // Rotating outer circle
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(time * 0.0006);
        ctx.lineWidth = 2.5;
        
        // Inner complex star
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 / 8) * i;
          const r = i % 2 === 0 ? radius : radius * 0.5;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Geometric rings
        ctx.beginPath();
        ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Rising blue hazes
        ctx.fillStyle = 'rgba(84, 160, 255, 0.6)';
        for (let i = 0; i < 4; i++) {
          const seed = i * 250;
          const pct = ((time + seed) % 1500) / 1500;
          const x = rx + Math.sin(time * 0.002 + i) * 15;
          const y = ry + this.size - pct * 55;
          ctx.beginPath();
          ctx.arc(x, y, (1 - pct) * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // 2. DEVOTION AURA (하얀색 방패 문양 마법진 + 노란색 원형 이펙트)
      else if (auraKey === 'devotion') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowColor = '#ffffff';
        
        // Outer rotating shielding rings
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(-time * 0.0004);
        
        // Draw 3 shield emblems along the ring
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 / 3) * i;
          ctx.save();
          ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.rotate(a + Math.PI / 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(4, 2); ctx.lineTo(0, 6); ctx.lineTo(-4, 2);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        
        // Concentric white line
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        
        // Yellow feet ring pulsing
        ctx.strokeStyle = 'rgba(255, 210, 0, 0.8)';
        ctx.shadowColor = '#ffd200';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pulseR = radius - 15 + Math.sin(time * 0.01) * 6;
        ctx.arc(rx, ry, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // 3. ENDURANCE AURA (붉은색 부족 문양 소용돌이 + 붉은색 원형 이펙트)
      else if (auraKey === 'endurance') {
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.8)';
        ctx.shadowColor = '#ff4757';
        
        // Rapid rotating tribal swirl
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(time * 0.0015);
        ctx.lineWidth = 3;
        
        // Draw 6 claw-like tribal curves
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(radius * 0.3, 0);
          ctx.quadraticCurveTo(radius * 0.6, radius * 0.4, radius, 0);
          ctx.stroke();
        }
        ctx.restore();
        
        // Pulsing red feet circle
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rx, ry, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // 4. WARSONG BATTLE DRUM (주황색 작은 원형 이펙트 + 소리 파동)
      else if (auraKey === 'warsong') {
        ctx.strokeStyle = 'rgba(255, 159, 67, 0.8)';
        ctx.shadowColor = '#ff9f43';
        
        // Pulsing small orange circles
        const rSmall = 35 + Math.sin(time * 0.008) * 8;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(rx, ry, rSmall, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(rx, ry, rSmall + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Soundwave rings expanding
        ctx.save();
        ctx.translate(rx, ry);
        const waveProgress = (time % 1200) / 1200;
        ctx.strokeStyle = `rgba(255, 159, 67, ${1 - waveProgress})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * waveProgress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      
      // 5. UNHOLY AURA (녹색 역오각형 소용돌이 + 녹색 원형 이펙트)
      else if (auraKey === 'unholy') {
        ctx.strokeStyle = 'rgba(46, 213, 115, 0.85)';
        ctx.shadowColor = '#2ed573';
        
        // Reverse pentagram
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(-time * 0.0005);
        ctx.lineWidth = 2.2;
        
        ctx.beginPath();
        const pentRadius = radius * 0.95;
        for (let i = 0; i < 5; i++) {
          const starIdx = (i * 2) % 5;
          const a = (Math.PI * 2 / 5) * starIdx - Math.PI / 2 + Math.PI; // Reverse rotation
          ctx.lineTo(Math.cos(a) * pentRadius, Math.sin(a) * pentRadius);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Outer concentric ring
        ctx.beginPath();
        ctx.arc(0, 0, pentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Healing green sparkles rising
        ctx.fillStyle = 'rgba(46, 213, 115, 0.6)';
        for (let i = 0; i < 3; i++) {
          const seed = i * 400;
          const pct = ((time + seed) % 1800) / 1800;
          const px = rx + Math.cos(time * 0.001 + i * 2) * (radius * 0.5);
          const py = ry + this.size - pct * 45;
          ctx.beginPath();
          ctx.arc(px, py, (1 - pct) * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // 6. VAMPIRIC AURA (보라색 박쥐 문양 + 흡혈)
      else if (auraKey === 'vampiric') {
        ctx.strokeStyle = 'rgba(165, 94, 234, 0.85)';
        ctx.shadowColor = '#a55eea';
        
        // Rotating bats ring
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(time * 0.0004);
        
        // Draw 4 bat designs
        ctx.fillStyle = 'rgba(165, 94, 234, 0.7)';
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI / 2) * i;
          ctx.save();
          ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.rotate(a + Math.PI / 2);
          
          // Small procedural bat shape
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.quadraticCurveTo(-6, -10, -12, -4);
          ctx.quadraticCurveTo(-8, 4, 0, 1);
          ctx.quadraticCurveTo(8, 4, 12, -4);
          ctx.quadraticCurveTo(6, -10, 0, -4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        
        // Center ring
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      
      // 7. THORNS AURA (초록색 가시나무 덩굴 + 가시덤불 이펙트)
      else if (auraKey === 'thorns') {
        ctx.strokeStyle = 'rgba(29, 209, 161, 0.85)';
        ctx.shadowColor = '#1dd1a1';
        
        // Thorny vine winding
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(time * 0.0003);
        ctx.lineWidth = 2.5;
        
        // Draw thorny spikes protruding outward
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 / 16) * i;
          const isSpike = i % 2 === 0;
          const r = isSpike ? radius + 10 : radius - 5;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Concentric vine line
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      
      // 8. TRUESHOT AURA (하늘색 깃털과 화살촉 + 크리티컬)
      else if (auraKey === 'trueshot') {
        ctx.strokeStyle = 'rgba(72, 219, 251, 0.85)';
        ctx.shadowColor = '#48dbfb';
        
        // Feathers and arrowheads rotating ring
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(time * 0.0005);
        
        // Draw 4 arrowheads pointing outward
        ctx.fillStyle = 'rgba(72, 219, 251, 0.7)';
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI / 2) * i;
          ctx.save();
          ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.rotate(a);
          
          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(8, 0); ctx.lineTo(-4, -5); ctx.lineTo(-1, 0); ctx.lineTo(-4, 5);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        
        // Fine cyan lines
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      
      ctx.restore();
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

    // ─── CUSTOM PROCEDURAL CHARACTER DRAWING ────────────────────────────
    const evIdx = Math.min(this.evolutionIndex, 5);
    
    // Bounce/bobbing effect
    const bounce = isMoving ? Math.abs(Math.sin(t * 0.015)) * 3.5 : Math.sin(t * 0.003) * 1.5;
    
    ctx.save();
    ctx.translate(rx, ry + bounce);
    
    // Face direction mirroring: If player is looking left, mirror horizontally
    const faceDir = (this.facing === 'left') ? -1 : 1;
    ctx.scale(faceDir, 1);
    
    // 1. Draw back wings or floating particles for final stages
    if (this.lineage === 'idealism' && evIdx === 5) {
      // Sartre (Idealism 5): Spectacular Fire Wings
      ctx.save();
      ctx.fillStyle = 'rgba(255, 71, 87, 0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ff4757';
      // Left wing (drawn relative to mirrored space)
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.quadraticCurveTo(-45, -35, -55, -12);
      ctx.quadraticCurveTo(-32, 8, -8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.quadraticCurveTo(-38, -8, -42, 12);
      ctx.quadraticCurveTo(-22, 22, -8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (this.lineage === 'empiricism' && evIdx === 5) {
      // Dewey (Empiricism 5): Elegant Cyan Digital Wings
      ctx.save();
      ctx.fillStyle = 'rgba(0, 210, 211, 0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00d2d3';
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-48, -22);
      ctx.lineTo(-38, -4);
      ctx.lineTo(-52, 6);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    
    // 2. Legs/Feet with walking sway
    ctx.fillStyle = '#2d3436';
    const footOffset = isMoving ? Math.sin(t * 0.015) * 7 : 0;
    ctx.beginPath();
    ctx.ellipse(-5 + footOffset, 20 - bounce, 4.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5 - footOffset, 20 - bounce, 4.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Robe/Coat
    ctx.save();
    let bodyColor = '#c0392b';
    let stripeColor = 'rgba(255,255,255,0.2)';
    let beltColor = themeColor;
    
    if (this.lineage === 'idealism') {
      if (evIdx === 0) bodyColor = '#c0392b'; // Plato: Classic Red
      else if (evIdx === 1) bodyColor = '#e67e22'; // Stoic: Orange
      else if (evIdx === 2) { bodyColor = '#d35400'; beltColor = '#ffd200'; } // Augustine: Divine Orange & Gold
      else if (evIdx === 3) bodyColor = '#2c3e50'; // Descartes: Dark Rose coat style
      else if (evIdx === 4) bodyColor = '#2c003e'; // Kant: Imperial Clockwork Dark Purple
      else if (evIdx === 5) bodyColor = '#1e0505'; // Sartre: Heavy existentialist black-red coat
    } else {
      if (evIdx === 0) bodyColor = '#2471a3'; // Aristotle: Pure Blue
      else if (evIdx === 1) bodyColor = '#16a085'; // Epicurus: Forest Greenish-Teal
      else if (evIdx === 2) { bodyColor = '#2980b9'; beltColor = '#bdc3c7'; } // Aquinas: Sacred White/Silver-Blue
      else if (evIdx === 3) bodyColor = '#27ae60'; // Bacon: Rich Emerald Scholar
      else if (evIdx === 4) bodyColor = '#130f40'; // Bentham/Mill: Deep Indigo Utilitarian robe
      else if (evIdx === 5) bodyColor = '#0f172a'; // Dewey: Infinite Cosmos Slate Navy
    }
    
    ctx.shadowBlur = evIdx >= 3 ? 12 : 0;
    ctx.shadowColor = themeColor;
    ctx.fillStyle = bodyColor;
    
    ctx.beginPath();
    ctx.moveTo(-16, 16);
    ctx.quadraticCurveTo(-14, -10, -10, -10);
    ctx.lineTo(10, -10);
    ctx.quadraticCurveTo(14, -10, 16, 16);
    ctx.closePath();
    ctx.fill();
    
    // Robe golden/silver outer trims
    ctx.strokeStyle = evIdx >= 2 ? themeColor : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = evIdx >= 3 ? 2.5 : 1.5;
    ctx.stroke();
    
    // Belt
    ctx.fillStyle = beltColor;
    ctx.fillRect(-12, 3, 24, 4);
    
    // Robe vertical stripe
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.restore();
    
    // 4. Head & Face
    ctx.fillStyle = '#f0c080'; // Skin
    ctx.beginPath();
    ctx.arc(0, -20, 11, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair & Facial features (Beards, Specs, Hats) - REDESIGNED FOR YOUTHFUL VERSIONS (No beards, rich colors)
    if (this.lineage === 'idealism') {
      if (evIdx === 0) {
        // Plato: curly philosopher hair (shaved beard) - rich dark brown
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.arc(-8, -26, 5, 0, Math.PI*2); ctx.arc(8, -26, 5, 0, Math.PI*2);
        ctx.arc(-11, -21, 4.5, 0, Math.PI*2); ctx.arc(11, -21, 4.5, 0, Math.PI*2);
        ctx.arc(0, -29, 5.5, 0, Math.PI*2);
        ctx.fill();
      } else if (evIdx === 1) {
        // Stoic: orange bandana headband, sporty dark cyan hair (no beard)
        ctx.fillStyle = '#e67e22'; ctx.fillRect(-10, -26, 20, 3.5);
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(-8, -22, 4, 0, Math.PI*2); ctx.arc(8, -22, 4, 0, Math.PI*2);
        // Spiky hair tufts on top
        ctx.moveTo(-7, -26); ctx.lineTo(-10, -32); ctx.lineTo(-3, -27);
        ctx.moveTo(7, -26); ctx.lineTo(10, -32); ctx.lineTo(3, -27);
        ctx.closePath();
        ctx.fill();
      } else if (evIdx === 2) {
        // Augustine: golden bishop cowl/hood, sleek royal violet hair (no beard)
        ctx.fillStyle = '#ffd200';
        ctx.beginPath(); ctx.moveTo(-9, -27); ctx.lineTo(0, -40); ctx.lineTo(9, -27); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a1a4a';
        ctx.beginPath();
        ctx.arc(-9, -22, 5, 0, Math.PI*2); ctx.arc(9, -22, 5, 0, Math.PI*2);
        ctx.fillRect(-13, -22, 4, 11); ctx.fillRect(9, -22, 4, 11);
        ctx.fill();
      } else if (evIdx === 3) {
        // Descartes: wavy navy blue hair, clean shaved face (no mustache)
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(-9, -22, 5.5, 0, Math.PI*2); ctx.arc(-11, -16, 4.5, 0, Math.PI*2);
        ctx.arc(9, -22, 5.5, 0, Math.PI*2); ctx.arc(11, -16, 4.5, 0, Math.PI*2);
        ctx.arc(-12, -10, 4, 0, Math.PI*2); ctx.arc(12, -10, 4, 0, Math.PI*2);
        ctx.fill();
      } else if (evIdx === 4) {
        // Kant: romantic light golden blonde dandy cut, wire specs (no wig)
        ctx.fillStyle = '#fed330';
        ctx.beginPath();
        ctx.arc(-9, -23, 5, 0, Math.PI*2); ctx.arc(9, -23, 5, 0, Math.PI*2);
        ctx.arc(0, -28, 6.5, 0, Math.PI*2);
        ctx.arc(-4, -26, 4, 0, Math.PI*2); ctx.arc(4, -26, 4, 0, Math.PI*2);
        ctx.fill();
        // Wire spectacles
        ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(3.5, -20, 2.5, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(1, -20); ctx.stroke();
      } else if (evIdx === 5) {
        // Sartre: spiky dark ash grey volume cut, thick black specs (no goatee)
        ctx.fillStyle = '#57606f';
        ctx.beginPath();
        ctx.arc(-9, -26, 5, 0, Math.PI*2); ctx.arc(9, -26, 5, 0, Math.PI*2);
        ctx.arc(0, -29, 6.5, 0, Math.PI*2);
        ctx.arc(-11, -21, 4, 0, Math.PI*2); ctx.arc(11, -21, 4, 0, Math.PI*2);
        ctx.fill();
        // Heavy horn-rimmed specs
        ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 2;
        ctx.strokeRect(2, -22, 5.5, 4.5);
      }
    } else {
      if (evIdx === 0) {
        // Aristotle: smart brown baby perm coils (no beard)
        ctx.fillStyle = '#6f4e37';
        ctx.beginPath();
        ctx.arc(-8, -25, 4.5, 0, Math.PI*2); ctx.arc(8, -25, 4.5, 0, Math.PI*2);
        ctx.arc(0, -27, 5, 0, Math.PI*2);
        ctx.fill();
      } else if (evIdx === 1) {
        // Epicurus: laurel leaf crown, warm milk chocolate wavy hair (no beard)
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath(); ctx.arc(-7, -29, 3.5, 0, Math.PI*2); ctx.arc(0, -31, 3.5, 0, Math.PI*2); ctx.arc(7, -29, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#7f5f40';
        ctx.beginPath();
        ctx.arc(-9, -23, 5, 0, Math.PI*2); ctx.arc(9, -23, 5, 0, Math.PI*2);
        ctx.fillRect(-12, -22, 3.5, 8); ctx.fillRect(8.5, -22, 3.5, 8);
        ctx.fill();
      } else if (evIdx === 2) {
        // Aquinas: full rich chocolate brown pageboy cut (tonsure cured! no beard)
        ctx.fillStyle = '#543a20';
        ctx.beginPath();
        ctx.arc(-9, -24, 5, 0, Math.PI*2); ctx.arc(9, -24, 5, 0, Math.PI*2);
        ctx.arc(0, -27, 6, 0, Math.PI*2);
        ctx.fillRect(-12.5, -23, 4, 11); ctx.fillRect(8.5, -23, 4, 11);
        ctx.fill();
      } else if (evIdx === 3) {
        // Bacon: Elizabethan velvet cap, sharp dark brown short crop (no beard)
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-12, -30, 24, 3.5); ctx.beginPath(); ctx.ellipse(0, -31, 8.5, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#211810';
        ctx.beginPath();
        ctx.arc(-9, -23, 4.5, 0, Math.PI*2); ctx.arc(9, -23, 4.5, 0, Math.PI*2);
        ctx.fill();
      } else if (evIdx === 4) {
        // Bentham/Mill: soft platinum silver-blonde dandy curls (balding cured!)
        ctx.fillStyle = '#d1d8e0';
        ctx.beginPath();
        ctx.arc(-8, -25, 5, 0, Math.PI*2); ctx.arc(8, -25, 5, 0, Math.PI*2);
        ctx.arc(0, -28, 6, 0, Math.PI*2);
        ctx.arc(-10, -20, 4.5, 0, Math.PI*2); ctx.arc(10, -20, 4.5, 0, Math.PI*2);
        ctx.fill();
      } else if (evIdx === 5) {
        // Dewey: solid black modern slicked back pompadour (mustache shaved!)
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-8, -26, 4.5, 0, Math.PI*2); ctx.arc(8, -26, 4.5, 0, Math.PI*2);
        ctx.arc(0, -28, 6, 0, Math.PI*2);
        ctx.fillRect(-10, -25, 20, 4);
        ctx.fill();
      }
    }
    
    // Single forward-facing dark eye
    ctx.fillStyle = '#2d3436';
    ctx.beginPath(); ctx.arc(4, -20, 1.5, 0, Math.PI * 2); ctx.fill();
    
    // 5. Halos & Crowns (evIdx >= 2)
    if (evIdx >= 2) {
      ctx.save();
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = themeColor;
      ctx.beginPath();
      ctx.ellipse(0, -32, 10, 3, 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (evIdx >= 4) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 16;
      ctx.shadowColor = themeColor;
      ctx.beginPath();
      ctx.ellipse(0, -35, 14, 4, -0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    
    // 6. Draw Arms & Weapons
    // Back arm (swinging)
    ctx.strokeStyle = this.lineage === 'idealism' ? '#c0392b' : '#2471a3';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-14 + (isMoving ? Math.sin(t * 0.015) * 4.5 : 0), 5);
    ctx.stroke();
    
    // Front arm (holding weapon, slightly extended)
    const armSwing = isMoving ? Math.sin(t * 0.015) * 3 : 0;
    const handX = 12 + armSwing;
    const handY = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    
    // Hand
    ctx.fillStyle = '#f0c080';
    ctx.beginPath();
    ctx.arc(handX, handY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw holding weapon
    ctx.save();
    ctx.translate(handX, handY);
    
    // Weapon dynamic bobbing rotation: change to positive PI/4 to point top-right
    const weaponSway = Math.sin(t * 0.005) * 0.08;
    ctx.rotate(Math.PI / 4 + weaponSway);
    
    if (this.lineage === 'idealism') {
      // ─── SWORDS ───
      ctx.shadowBlur = evIdx >= 2 ? 10 + evIdx * 3.5 : 0;
      ctx.shadowColor = themeColor;
      
      // Hilt / Crossguard (drawn downward locally, towards +Y)
      ctx.strokeStyle = evIdx >= 2 ? themeColor : '#8e7054';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
      ctx.moveTo(0, 0); ctx.lineTo(0, 4);
      ctx.stroke();
      
      // Pommel
      ctx.fillStyle = evIdx >= 2 ? themeColor : '#8e7054';
      ctx.beginPath(); ctx.arc(0, 4, 1.5, 0, Math.PI * 2); ctx.fill();
      
      let bladeLen = 22 + evIdx * 3.5;
      let bladeWidth = 3 + evIdx * 0.5;
      
      if (evIdx === 3) {
        // Descartes: Sleek energizing pink laser rapier (pointing upward locally, towards -Y)
        ctx.strokeStyle = '#ff9ff3';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -bladeLen - 6);
        ctx.stroke();
        // Protective basket hilt (pointing downward clockwise)
        ctx.fillStyle = 'rgba(255, 159, 243, 0.45)';
        ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI, false); ctx.fill();
      } 
      else if (evIdx === 5) {
        // Sartre (Ultimate): Floating red existentialist crystal claymore shards (pointing upward locally, towards -Y)
        ctx.fillStyle = 'rgba(255, 71, 87, 0.82)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        // Base crystal shard
        ctx.beginPath(); ctx.moveTo(-4.5, -2); ctx.lineTo(4.5, -2); ctx.lineTo(3.5, -10); ctx.lineTo(-3.5, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
        // Mid crystal shard
        ctx.beginPath(); ctx.moveTo(-4, -13); ctx.lineTo(4, -13); ctx.lineTo(2.8, -24); ctx.lineTo(-2.8, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
        // Tip shard
        ctx.beginPath(); ctx.moveTo(-2.5, -27); ctx.lineTo(2.5, -27); ctx.lineTo(0, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
        
        // Neon core path linking the shards
        ctx.strokeStyle = '#ff4757'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -38); ctx.stroke();
      }
      else {
        // Progression swords (pointing upward locally, towards -Y)
        const grad = ctx.createLinearGradient(-bladeWidth, 0, bladeWidth, 0);
        if (evIdx === 0) { grad.addColorStop(0, '#cd7f32'); grad.addColorStop(1, '#8c5a2b'); } // Bronze
        else if (evIdx === 1) { grad.addColorStop(0, '#dfe4ea'); grad.addColorStop(1, '#707070'); } // Steel
        else if (evIdx === 2) { grad.addColorStop(0, '#ffd200'); grad.addColorStop(1, '#ffa502'); } // Golden
        else if (evIdx === 4) { grad.addColorStop(0, '#c56cf0'); grad.addColorStop(1, '#7d5fff'); } // Clockwork Purple
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-bladeWidth/2, 0);
        ctx.lineTo(-bladeWidth/2, -bladeLen + 4);
        ctx.lineTo(0, -bladeLen);
        ctx.lineTo(bladeWidth/2, -bladeLen + 4);
        ctx.lineTo(bladeWidth/2, 0);
        ctx.closePath();
        ctx.fill();
        
        if (evIdx === 4) {
          // Kant Guard: Golden gear
          ctx.fillStyle = '#ffd200';
          ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
      // ─── STAVES ───
      // Staff shaft (pointing upward locally, towards -Y)
      ctx.strokeStyle = evIdx >= 2 ? '#ced6e0' : '#8e7054';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, -24);
      ctx.stroke();
      
      ctx.save();
      ctx.translate(0, -24); // Move to head (upward locally, towards -Y)
      ctx.shadowBlur = 10 + evIdx * 3.5;
      ctx.shadowColor = themeColor;
      
      if (evIdx === 0) {
        // Aristotle: Wooden staff with glowing cyan orb
        ctx.fillStyle = '#00d2d3';
        ctx.beginPath(); ctx.arc(0, -3, 5, 0, Math.PI*2); ctx.fill();
      }
      else if (evIdx === 1) {
        // Epicurus: Vine staff with glowing emerald leaf gem
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-6, -4, 0, -10);
        ctx.quadraticCurveTo(6, -4, 0, 0);
        ctx.closePath(); ctx.fill();
      }
      else if (evIdx === 2) {
        // Aquinas: Silver-cross sacred staff
        ctx.strokeStyle = '#48dbfb'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(0, -10);
        ctx.moveTo(-4, -7); ctx.lineTo(4, -7);
        ctx.stroke();
      }
      else if (evIdx === 3) {
        // Bacon: Concentric astrolabe/gyro rings
        ctx.strokeStyle = '#fdcb6e'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -4, 3, 0, Math.PI * 2); ctx.stroke();
      }
      else if (evIdx === 4) {
        // Bentham/Mill: Dual balance scale staff head
        ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -5); ctx.lineTo(6, -5);
        ctx.moveTo(0, 0); ctx.lineTo(0, -5);
        ctx.stroke();
        ctx.fillStyle = '#ffd200';
        ctx.beginPath(); ctx.arc(-6, -1.5, 2.5, 0, Math.PI*2); ctx.arc(6, -1.5, 2.5, 0, Math.PI*2); ctx.fill();
      }
      else if (evIdx === 5) {
        // Dewey (Ultimate): Cosmic swirling nebula orb & dust rings
        const time = performance.now();
        const coreGrd = ctx.createRadialGradient(0, -6, 0, 0, -6, 7.5);
        coreGrd.addColorStop(0, '#ffffff');
        coreGrd.addColorStop(0.5, '#00d2d3');
        coreGrd.addColorStop(1, 'rgba(0, 210, 211, 0)');
        ctx.fillStyle = coreGrd;
        ctx.beginPath(); ctx.arc(0, -6, 7.5, 0, Math.PI*2); ctx.fill();
        
        ctx.strokeStyle = 'rgba(84, 160, 255, 0.85)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -6, 12, 3, time * 0.003, 0, Math.PI*2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0, 210, 211, 0.65)';
        ctx.beginPath();
        ctx.ellipse(0, -6, 10, 2.5, -time * 0.002, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore(); // Weapon restore
    
    ctx.restore(); // Character base restore
    ctx.restore(); // HP bar alignment restore (balance translation)

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
    // Set dynamic name color based on evolution stage
    let nameColor = '#fff';
    if (evIdx === 0) nameColor = '#ffffff';
    else if (evIdx === 1 || evIdx === 2) nameColor = '#54a0ff'; // 2,3차 파란색
    else if (evIdx === 3) nameColor = '#c56cf0'; // 4차 보라색
    else if (evIdx === 4) nameColor = '#ff9ff3'; // 5차 분홍색
    else if (evIdx === 5) nameColor = '#ffd200'; // 6차 노란색
    
    ctx.fillStyle = nameColor; ctx.shadowBlur = 0;
    ctx.fillText(name, rx + sway * 0.2, ry - 36);
    ctx.restore();
  }
}
