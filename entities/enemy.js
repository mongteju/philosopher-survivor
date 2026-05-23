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
