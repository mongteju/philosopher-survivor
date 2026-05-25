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
    
    // Scale HP and speed based on stage (mobType)
    let hpMultiplier = 1;
    let speedMultiplier = 1;
    if (mobType === 'beast') { hpMultiplier = 2; speedMultiplier = 1.3; }
    else if (mobType === 'undead') { hpMultiplier = 3; speedMultiplier = 1.3; }
    else if (mobType === 'golem') { hpMultiplier = 4; speedMultiplier = 1.3; }
    else if (mobType === 'steam') { hpMultiplier = 5; speedMultiplier = 1.3; }
    else if (mobType === 'machine') { hpMultiplier = 6; speedMultiplier = 1.3; }
    
    this.maxHp = Math.floor(d.hp * lvMul * hpMultiplier);
    this.hp = this.maxHp; this.speed = d.spd * speedMultiplier; this.size = d.sz;
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
    
    const dx = player.x - this.x, dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;

    // 플레이어의 지배/영생 아우라로 인한 근접 적 25% 감속 및 파란색 시각 효과 처리
    if (player.auraEnemySlowAura && distSq < 32400) { // 180 * 180 = 32400
      currentSlowMul = Math.min(currentSlowMul, 0.75);
      this.slowTimer = Math.max(this.slowTimer, 100); // 파란색 표시 유지를 위해 slowTimer 연장
    }

    const d = Math.sqrt(distSq) || 1;
    const spd = this.speed * currentSlowMul;
    this.vx = (dx / d) * spd; this.vy = (dy / d) * spd;
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.angle = Math.atan2(dy, dx);
    if (!player.isInvincible && distSq < (this.size + player.size) * (this.size + player.size)) {
      player.takeDamage(12, window.gameInstance);
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    let baseColor = this.color;
    let isFrozen = this.frozenTime > 0;
    let isSlowed = this.slowMul < 1;
    
    if (isFrozen) {
      ctx.fillStyle = '#a8e6f0';
    } else if (isSlowed) {
      ctx.fillStyle = '#54a0ff';
    } else {
      ctx.fillStyle = baseColor;
    }

    const t = Date.now();
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(this.angle);

    if (this.mobType === 'orc') {
      // Orc: Purple Shadow Demon
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.7, -this.size * 0.5);
      ctx.lineTo(-this.size * 0.4, -this.size * 0.8);
      ctx.lineTo(0, -this.size);
      ctx.lineTo(this.size * 0.5, -this.size * 0.7);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(this.size * 0.5, this.size * 0.7);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.4, this.size * 0.8);
      ctx.lineTo(-this.size * 0.7, this.size * 0.5);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = isFrozen ? '#a8e6f0' : (isSlowed ? '#54a0ff' : '#8854d0');
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.3, -this.size * 0.8);
      ctx.lineTo(-this.size * 0.8, -this.size * 1.3);
      ctx.lineTo(-this.size * 0.1, -this.size * 0.9);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.3, this.size * 0.8);
      ctx.lineTo(-this.size * 0.8, this.size * 1.3);
      ctx.lineTo(-this.size * 0.1, this.size * 0.9);
      ctx.closePath(); ctx.fill();
      
      ctx.fillStyle = isFrozen ? '#ffffff' : '#ff4757';
      ctx.beginPath();
      ctx.arc(this.size * 0.35, -this.size * 0.25, 3.5, 0, Math.PI * 2);
      ctx.arc(this.size * 0.35, this.size * 0.25, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } 
    else if (this.mobType === 'beast') {
      // Beast: Orange Shadow Wolf
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.quadraticCurveTo(-this.size * 0.5, -this.size * 0.8, 0, -this.size * 0.7);
      ctx.lineTo(this.size * 0.6, -this.size * 0.3);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(this.size * 0.6, this.size * 0.3);
      ctx.lineTo(0, this.size * 0.7);
      ctx.quadraticCurveTo(-this.size * 0.5, this.size * 0.8, -this.size, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = isFrozen ? '#a8e6f0' : (isSlowed ? '#54a0ff' : '#e58e26');
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.4, -this.size * 0.6);
      ctx.lineTo(-this.size * 0.9, -this.size * 1.1);
      ctx.lineTo(-this.size * 0.1, -this.size * 0.7);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.4, this.size * 0.6);
      ctx.lineTo(-this.size * 0.9, this.size * 1.1);
      ctx.lineTo(-this.size * 0.1, this.size * 0.7);
      ctx.closePath(); ctx.fill();
      
      ctx.fillStyle = isFrozen ? '#ffffff' : '#ffd200';
      ctx.beginPath();
      ctx.arc(this.size * 0.3, -this.size * 0.22, 3.5, 0, Math.PI * 2);
      ctx.arc(this.size * 0.3, this.size * 0.22, 3.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Fangs
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.size * 0.65, -this.size * 0.1); ctx.lineTo(this.size * 0.8, -this.size * 0.2);
      ctx.moveTo(this.size * 0.65, this.size * 0.1); ctx.lineTo(this.size * 0.8, this.size * 0.2);
      ctx.stroke();
      
      // Swaying tail
      ctx.save();
      ctx.strokeStyle = isFrozen ? '#a8e6f0' : (isSlowed ? '#54a0ff' : baseColor);
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.8, 0);
      const tailSway = Math.sin(t * 0.015) * 8;
      ctx.quadraticCurveTo(-this.size * 1.4, tailSway, -this.size * 1.8, tailSway * 0.5);
      ctx.stroke();
      ctx.restore();
    }
    else if (this.mobType === 'undead') {
      // Undead: Grey Hooded Wraith
      ctx.beginPath();
      ctx.moveTo(this.size, 0);
      ctx.quadraticCurveTo(0, -this.size, -this.size * 0.7, -this.size * 0.8);
      ctx.quadraticCurveTo(-this.size * 1.2, 0, -this.size * 0.7, this.size * 0.8);
      ctx.quadraticCurveTo(0, this.size, this.size, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.arc(this.size * 0.2, 0, this.size * 0.52, -Math.PI/2, Math.PI/2);
      ctx.fill();
      
      ctx.fillStyle = isFrozen ? '#a8e6f0' : '#ffffff';
      ctx.beginPath();
      ctx.arc(this.size * 0.35, -this.size * 0.18, 3, 0, Math.PI * 2);
      ctx.arc(this.size * 0.35, this.size * 0.18, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Wraith sway tail
      ctx.save();
      ctx.strokeStyle = isFrozen ? '#a8e6f0' : (isSlowed ? '#54a0ff' : baseColor);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.8, 0);
      const ghostSway = Math.sin(t * 0.01) * 6;
      ctx.quadraticCurveTo(-this.size * 1.3, ghostSway, -this.size * 1.7, -ghostSway);
      ctx.stroke();
      ctx.restore();
    }
    else if (this.mobType === 'golem') {
      // Golem: Cracked rocky stone giant
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.6, -this.size * 0.8);
      ctx.lineTo(0, -this.size);
      ctx.lineTo(this.size * 0.6, -this.size * 0.8);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(this.size * 0.6, this.size * 0.8);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.6, this.size * 0.8);
      ctx.closePath();
      ctx.fill();
      
      // Rocky cracks
      ctx.strokeStyle = isFrozen ? '#a8e6f0' : '#ff7675'; ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.5, -this.size * 0.3); ctx.lineTo(this.size * 0.3, this.size * 0.4);
      ctx.moveTo(-this.size * 0.2, this.size * 0.5); ctx.lineTo(this.size * 0.5, -this.size * 0.2);
      ctx.stroke();
      
      // Monocle red light
      ctx.fillStyle = isFrozen ? '#ffffff' : '#ff7675';
      ctx.beginPath();
      ctx.arc(this.size * 0.5, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    else if (this.mobType === 'steam') {
      // Steam: Steampunk Copper Gear Mech
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.9, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (this.size * 0.75), Math.sin(a) * (this.size * 0.75), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = isFrozen ? '#ffffff' : '#ff9f43';
      ctx.beginPath();
      ctx.arc(this.size * 0.4, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1.8;
      ctx.stroke();
      
      // Rotating gear
      ctx.save();
      ctx.rotate(t * 0.002);
      ctx.strokeStyle = isFrozen ? '#a8e6f0' : '#fdcb6e'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.6, 0, Math.PI*2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        ctx.fillStyle = isFrozen ? '#a8e6f0' : '#fdcb6e';
        ctx.fillRect(Math.cos(a) * (this.size * 0.58) - 2.5, Math.sin(a) * (this.size * 0.58) - 2.5, 5, 5);
      }
      ctx.restore();
    }
    else if (this.mobType === 'machine') {
      // Machine: Glitched cyber cube
      const glitchX = Math.sin(t * 0.05) * 2;
      ctx.translate(glitchX, 0);
      ctx.fillRect(-this.size * 0.8, -this.size * 0.8, this.size * 1.6, this.size * 1.6);
      
      ctx.strokeStyle = isFrozen ? '#a8e6f0' : '#00d2d3'; ctx.lineWidth = 1.2;
      ctx.strokeRect(-this.size * 0.6, -this.size * 0.6, this.size * 1.2, this.size * 1.2);
      
      // Slit eyes
      ctx.fillStyle = isFrozen ? '#ffffff' : '#00d2d3';
      ctx.fillRect(this.size * 0.35, -this.size * 0.4, 3, 7);
      ctx.fillRect(this.size * 0.35, this.size * 0.1, 3, 7);
    }
    else {
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
    // HP bar
    if (this.hp < this.maxHp) {
      const bw = this.size * 2, bh = 4, bx = rx - this.size, by = ry - this.size - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#2ed573'; ctx.fillRect(bx, by, bw * this.hp / this.maxHp, bh);
    }
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

    const dx = player.x - this.x, dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (player.auraEnemySlowAura && distSq < 32400) { // 180 * 180 = 32400
      currentSlowMul = Math.min(currentSlowMul, 0.75);
      this.slowTimer = Math.max(this.slowTimer, 100);
    }

    const d = Math.sqrt(distSq) || 1;
    const spd = 1.0 * currentSlowMul;
    this.x += (dx / d) * spd * dt * 0.06;
    this.y += (dy / d) * spd * dt * 0.06;
    if (!player.isInvincible && distSq < (this.size + player.size) * (this.size + player.size)) {
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
    } else if (this.slowMul < 1) {
      renderColor = '#54a0ff';
    }
    
    ctx.fillStyle = renderColor;
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(rx, ry - this.size); ctx.lineTo(rx + this.size, ry);
    ctx.lineTo(rx, ry + this.size); ctx.lineTo(rx - this.size, ry);
    ctx.closePath(); ctx.fill();
    // Label
    ctx.font = '10px Outfit, sans-serif'; ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, rx, ry - this.size - 6);
    // HP bar
    const bw = this.size * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(rx - this.size, ry + this.size + 2, bw, 4);
    ctx.fillStyle = renderColor; ctx.fillRect(rx - this.size, ry + this.size + 2, bw * this.hp / this.maxHp, 4);
    ctx.restore();
  }
}
