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
      ctx.fillStyle = this.synergy ? 'rgba(165, 94, 234, 0.16)' : 'rgba(255, 71, 87, 0.16)';
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = this.synergy ? 'rgba(165, 94, 234, 0.45)' : 'rgba(255, 71, 87, 0.45)';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.22, 0, Math.PI * 2); ctx.fill();

      // OPTIMIZED: Combine 4 draw calls into 1 path/fill operation
      ctx.rotate(t * 0.006);
      ctx.fillStyle = this.synergy ? '#d6a2e8' : '#ff7675';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(this.size * 0.5, -this.size * 0.5, this.size * 0.8, 0);
        ctx.quadraticCurveTo(this.size * 0.4, this.size * 0.3, 0, 0);
      }
      ctx.fill();
      
      // OPTIMIZED: Combine 3 draw calls into 1 path/fill operation
      ctx.rotate(-t * 0.012);
      ctx.fillStyle = this.synergy ? '#a55eea' : '#ffd200';
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(this.size * 0.3, -this.size * 0.3, this.size * 0.5, 0);
        ctx.quadraticCurveTo(this.size * 0.2, this.size * 0.2, 0, 0);
      }
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2); ctx.fill();
    }

    else if (this.type === 'fire_sword') {
      // 2. 코기토의 검: Glowing crystal sword & sweeping energy arc trail
      ctx.translate(rx, ry);
      
      const travelAngle = Math.atan2(this.vy, this.vx);
      ctx.rotate(travelAngle + t * 0.015);

      ctx.strokeStyle = this.synergy ? 'rgba(165, 94, 234, 0.22)' : 'rgba(255, 71, 87, 0.22)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.7, Math.PI, Math.PI * 1.6);
      ctx.stroke();

      ctx.strokeStyle = this.synergy ? '#d6a2e8' : '#ffd200'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, 0); ctx.lineTo(0, -5);
      ctx.stroke();

      ctx.fillStyle = this.synergy ? '#d6a2e8' : '#ffd200';
      ctx.beginPath(); ctx.arc(0, -5, 2, 0, Math.PI*2); ctx.fill();

      const bladeLen = this.size * 1.1;
      // OPTIMIZED: Draw inner blade with high contrast colors to replicate glowing gradient
      ctx.fillStyle = this.synergy ? '#a55eea' : '#ff4757';
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
      ctx.fillStyle = this.synergy ? '#00b894' : '#a8e6f0';
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

      ctx.strokeStyle = this.synergy ? 'rgba(0, 210, 211, 0.7)' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.moveTo(-this.size * 0.3, -this.size * 0.45);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.stroke();
      
      if (Math.random() < 0.25) {
        ctx.fillStyle = this.synergy ? 'rgba(0, 184, 148, 0.6)' : 'rgba(168, 230, 240, 0.6)';
        ctx.fillRect(-this.size * 1.5, (Math.random()-0.5)*8, 3, 3);
      }
    }

    else if (this.type === 'wind_vortex') {
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.012);
      ctx.strokeStyle = this.synergy ? 'rgba(0, 184, 148, 0.55)' : 'rgba(46, 213, 115, 0.4)'; // green/jade wind outer
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = this.synergy ? '#2ecc71' : '#54a0ff'; // blue/emerald wind inner
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0); // Explicitly set starting point to prevent drawing artifacts
      for (let i = 0; i < 30; i++) {
        const angle = 0.2 * i;
        const r = (this.size * 0.8) * (i / 30);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.stroke();

      // FIXED: Separate draw calls to prevent unintended line connections inside single path fill
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
      
      // OPTIMIZED: Replaced expensive shadowBlur with layered outline glow (100x faster)
      ctx.strokeStyle = this.synergy ? 'rgba(255, 159, 67, 0.35)' : 'rgba(255, 210, 0, 0.35)';
      ctx.lineWidth = 9;
      
      const drawBladePath = () => {
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
      };
      
      drawBladePath();
      ctx.stroke();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      drawBladePath();
      ctx.stroke();
      
      ctx.fillStyle = this.synergy ? '#ff9f43' : '#ffd200';
      ctx.fill();
    }

    else if (this.type === 'lightning_orb') {
      // 지의 혜안: 지혜의 전격 추적 구체
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.008);
      
      const orbRad = this.size * 0.8;
      
      // OPTIMIZED: Replaced expensive shadowBlur with a larger solid glow fill
      ctx.fillStyle = this.synergy ? 'rgba(255, 210, 0, 0.18)' : 'rgba(197, 108, 240, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, orbRad * 1.3, 0, Math.PI * 2);
      ctx.fill();
      
      // 구체 몸체
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRad);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, this.synergy ? '#ffd200' : '#c56cf0');
      grad.addColorStop(1, this.synergy ? 'rgba(255, 210, 0, 0)' : 'rgba(197, 108, 240, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, orbRad, 0, Math.PI * 2);
      ctx.fill();
      
      // 주위를 도는 작은 전격 불꽃들
      ctx.strokeStyle = this.synergy ? '#ff9f43' : '#ffd200';
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
      
      // OPTIMIZED: Replaced expensive shadowBlur with layered outline glow
      ctx.strokeStyle = this.synergy ? 'rgba(46, 204, 113, 0.35)' : 'rgba(85, 239, 196, 0.35)';
      ctx.lineWidth = 6;
      
      const drawWindBladePath = () => {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, -Math.PI / 3, Math.PI / 3, false);
        ctx.quadraticCurveTo(this.size * 0.6, 0, Math.cos(-Math.PI / 3) * this.size, Math.sin(-Math.PI / 3) * this.size);
        ctx.closePath();
      };
      
      drawWindBladePath();
      ctx.stroke();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillStyle = this.synergy ? 'rgba(46, 204, 113, 0.45)' : 'rgba(85, 239, 196, 0.45)';
      ctx.lineWidth = 2.5;
      drawWindBladePath();
      ctx.fill();
      ctx.stroke();
    }

    else if (this.type === 'earth_barrier') {
      // 해탈의 금강막: 단단한 대지 바위 파편
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.005 + (this.x * 0.01));
      
      ctx.fillStyle = this.synergy ? '#f39c12' : '#7f8c8d';
      ctx.strokeStyle = this.synergy ? '#ffd700' : '#2c3e50';
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
      ctx.strokeStyle = this.synergy ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.3, -this.size * 0.3);
      ctx.lineTo(this.size * 0.3, this.size * 0.3);
      ctx.stroke();
    }

    else if (this.type === 'metal_beads') {
      // 번뇌의 염주: 갈색 나무 질감의 신통한 염주알
      ctx.translate(rx, ry);
      
      // OPTIMIZED: Replaced expensive shadowBlur with solid low-opacity outer ring
      ctx.fillStyle = this.synergy ? 'rgba(255, 210, 0, 0.18)' : 'rgba(230, 126, 34, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 1.3, 0, Math.PI * 2);
      ctx.fill();
      
      // 나무 염주 질감 (그라데이션)
      const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, this.size);
      if (this.synergy) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#ffd200');
        grad.addColorStop(1, '#d35400');
      } else {
        grad.addColorStop(0, '#f39c12');
        grad.addColorStop(0.7, '#d35400');
        grad.addColorStop(1, '#5d4037');
      }
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // 염주 가운데에 검은색 신성한 문자나 장식 묘사
      ctx.fillStyle = this.synergy ? '#d35400' : '#ffffff';
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
