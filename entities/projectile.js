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
    if (this.homing && game && game.enemies) {
      let nearest = null, minDistSq = 999999999;
      game.enemies.forEach(e => {
        if (e.hp <= 0) return;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          nearest = e;
        }
      });
      if (nearest) {
        const targetAng = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        const speed = Math.hypot(this.vx, this.vy);
        const currentAng = Math.atan2(this.vy, this.vx);
        let diff = targetAng - currentAng;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const turnSpeed = 0.09 * dt * 0.06; // Slightly faster turning for responsive feel
        const nextAng = currentAng + Math.max(-turnSpeed, Math.min(turnSpeed, diff));
        this.vx = Math.cos(nextAng) * speed;
        this.vy = Math.sin(nextAng) * speed;
      }
    }
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.life -= dt;
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const t = Date.now();
    ctx.save();

    if (this.type === 'fire_explosion') {
      // 1. 이데아의 불꽃: Blazing solar vortex (spinning fire petals)
      ctx.translate(rx, ry);
      
      // OPTIMIZED: Pre-calculated nested solid circles to replicate radial glow at 100x speed
      ctx.fillStyle = 'rgba(255, 71, 87, 0.16)';
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 71, 87, 0.45)';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.22, 0, Math.PI * 2); ctx.fill();

      ctx.rotate(t * 0.006);
      ctx.fillStyle = '#ff7675';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(this.size * 0.5, -this.size * 0.5, this.size * 0.8, 0);
        ctx.quadraticCurveTo(this.size * 0.4, this.size * 0.3, 0, 0);
        ctx.fill();
      }
      
      ctx.rotate(-t * 0.012);
      ctx.fillStyle = '#ffd200';
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(this.size * 0.3, -this.size * 0.3, this.size * 0.5, 0);
        ctx.quadraticCurveTo(this.size * 0.2, this.size * 0.2, 0, 0);
        ctx.fill();
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    else if (this.type === 'fire_sword') {
      // 2. 코기토의 검: Glowing crystal sword & sweeping energy arc trail
      ctx.translate(rx, ry);
      
      const travelAngle = Math.atan2(this.vy, this.vx);
      ctx.rotate(travelAngle + t * 0.015);

      ctx.strokeStyle = 'rgba(255, 71, 87, 0.22)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.7, Math.PI, Math.PI * 1.6);
      ctx.stroke();

      ctx.strokeStyle = '#ffd200'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, 0); ctx.lineTo(0, -5);
      ctx.stroke();

      ctx.fillStyle = '#ffd200';
      ctx.beginPath(); ctx.arc(0, -5, 2, 0, Math.PI*2); ctx.fill();

      const bladeLen = this.size * 1.1;
      // OPTIMIZED: Draw inner blade with high contrast colors to replicate glowing gradient
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(-2, bladeLen - 4);
      ctx.lineTo(0, bladeLen);
      ctx.lineTo(2, bladeLen - 4);
      ctx.lineTo(2.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-1.2, 0);
      ctx.lineTo(-1, bladeLen * 0.6);
      ctx.lineTo(0, bladeLen * 0.65);
      ctx.lineTo(1, bladeLen * 0.6);
      ctx.lineTo(1.2, 0);
      ctx.closePath();
      ctx.fill();
    }
    else if (this.type === 'ice_pierce') {
      // 3. 중용의 얼음 송곳: Faceted crystal icicle spike
      ctx.translate(rx, ry);
      const travelAngle = Math.atan2(this.vy, this.vx);
      ctx.rotate(travelAngle);

      // OPTIMIZED: Fast solid ice color with outer borders for maximum clarity
      ctx.fillStyle = '#a8e6f0';
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.3, -this.size * 0.45);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.3, this.size * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.3, -this.size * 0.15);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.3, this.size * 0.15);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.moveTo(-this.size * 0.3, -this.size * 0.45);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.stroke();
      
      if (Math.random() < 0.25) {
        ctx.fillStyle = 'rgba(168, 230, 240, 0.6)';
        ctx.fillRect(-this.size * 1.5, (Math.random()-0.5)*8, 3, 3);
      }
    }
    else if (this.type === 'wind_vortex') {
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.012);
      ctx.strokeStyle = 'rgba(46, 213, 115, 0.4)'; // green wind outer
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#54a0ff'; // blue wind inner
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 30; i++) {
        const angle = 0.2 * i;
        const r = (this.size * 0.8) * (i / 30);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const seedAngle = (Math.PI * 2 / 3) * i + t * 0.005;
        ctx.beginPath();
        ctx.arc(Math.cos(seedAngle) * (this.size * 0.85), Math.sin(seedAngle) * (this.size * 0.85), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (this.type === 'lightning_sword') {
      // 의의 뇌검: 날카로운 직선 전격 검기
      ctx.translate(rx, ry);
      const travelAngle = Math.atan2(this.vy, this.vx);
      ctx.rotate(travelAngle);
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffd200';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      
      // 번개 형상의 칼날
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.2, -this.size * 0.25);
      ctx.lineTo(0, -this.size * 0.08);
      ctx.lineTo(this.size * 0.5, -this.size * 0.3);
      ctx.lineTo(this.size * 1.3, 0);
      ctx.lineTo(this.size * 0.5, this.size * 0.3);
      ctx.lineTo(0, this.size * 0.08);
      ctx.lineTo(-this.size * 0.2, this.size * 0.25);
      ctx.closePath();
      ctx.stroke();
      
      ctx.fillStyle = '#ffd200';
      ctx.fill();
    }
    else if (this.type === 'lightning_orb') {
      // 지의 혜안: 지혜의 전격 추적 구체
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.008);
      
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#c56cf0';
      
      // 구체 몸체
      const orbRad = this.size * 0.8;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRad);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#c56cf0');
      grad.addColorStop(1, 'rgba(197, 108, 240, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, orbRad, 0, Math.PI * 2);
      ctx.fill();
      
      // 주위를 도는 작은 전격 불꽃들
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        ctx.moveTo(Math.cos(a) * (orbRad * 0.5), Math.sin(a) * (orbRad * 0.5));
        ctx.lineTo(Math.cos(a + 0.4) * (orbRad * 1.1), Math.sin(a + 0.4) * (orbRad * 1.1));
      }
      ctx.stroke();
    }
    else if (this.type === 'wind_blade') {
      // 물아일체의 풍도: 반원 모양의 날카로운 바람 칼날
      ctx.translate(rx, ry);
      const travelAngle = Math.atan2(this.vy, this.vx);
      ctx.rotate(travelAngle);
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#55efc4';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillStyle = 'rgba(85, 239, 196, 0.45)';
      ctx.lineWidth = 2.5;
      
      // 반원 아크 모양
      ctx.beginPath();
      ctx.arc(0, 0, this.size, -Math.PI / 3, Math.PI / 3, false);
      ctx.quadraticCurveTo(this.size * 0.6, 0, Math.cos(-Math.PI / 3) * this.size, Math.sin(-Math.PI / 3) * this.size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    else if (this.type === 'earth_barrier') {
      // 해탈의 금강막: 단단한 대지 바위 파편
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.005 + (this.x * 0.01));
      
      ctx.fillStyle = '#7f8c8d';
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      
      // 다각형 바위 그리기
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.8, -this.size * 0.2);
      ctx.lineTo(-this.size * 0.3, -this.size * 0.85);
      ctx.lineTo(this.size * 0.5, -this.size * 0.7);
      ctx.lineTo(this.size * 0.85, 0);
      ctx.lineTo(this.size * 0.3, this.size * 0.8);
      ctx.lineTo(-this.size * 0.5, this.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // 바위 질감 빗금
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.3, -this.size * 0.3);
      ctx.lineTo(this.size * 0.3, this.size * 0.3);
      ctx.stroke();
    }
    else if (this.type === 'metal_beads') {
      // 번뇌의 염주: 갈색 나무 질감의 신통한 염주알
      ctx.translate(rx, ry);
      
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#e67e22';
      
      // 나무 염주 질감 (그라데이션)
      const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, this.size);
      grad.addColorStop(0, '#f39c12');
      grad.addColorStop(0.7, '#d35400');
      grad.addColorStop(1, '#5d4037');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // 염주 가운데에 검은색 신성한 문자나 장식 묘사
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${this.size * 0.9}px Noto Sans KR`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('卍', 0, 0);
    }
    else {
      // OPTIMIZED: Simple nested circles for generic generic projectiles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.35, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
  }
}
