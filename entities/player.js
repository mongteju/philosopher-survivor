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
        ctx.arc(rx, ry, radius);
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
