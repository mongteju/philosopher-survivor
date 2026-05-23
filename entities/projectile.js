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
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.life -= dt;
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const t = Date.now();
    ctx.save();
    
    ctx.shadowBlur = 16;
    ctx.shadowColor = this.color;

    if (this.type === 'fire_explosion') {
      // 1. 이데아의 불꽃: Blazing solar vortex (spinning fire petals)
      ctx.translate(rx, ry);
      
      const radialGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
      radialGrd.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      radialGrd.addColorStop(0.3, 'rgba(255, 71, 87, 0.55)');
      radialGrd.addColorStop(1, 'rgba(255, 71, 87, 0)');
      ctx.fillStyle = radialGrd;
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();

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
      const bladeGrd = ctx.createLinearGradient(0, 0, 0, bladeLen);
      bladeGrd.addColorStop(0, '#ffffff');
      bladeGrd.addColorStop(0.3, '#ff4757');
      bladeGrd.addColorStop(1, 'rgba(255, 71, 87, 0)');
      
      ctx.fillStyle = bladeGrd;
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(-2, bladeLen - 4);
      ctx.lineTo(0, bladeLen);
      ctx.lineTo(2, bladeLen - 4);
      ctx.lineTo(2.5, 0);
      ctx.closePath();
      ctx.fill();
    }
    else if (this.type === 'ice_pierce') {
      // 3. 중용의 얼음 송곳: Faceted crystal icicle spike
      ctx.translate(rx, ry);
      const travelAngle = Math.atan2(this.vy, this.vx);
      ctx.rotate(travelAngle);

      const iceGrd = ctx.createLinearGradient(-this.size, 0, this.size, 0);
      iceGrd.addColorStop(0, '#ffffff');
      iceGrd.addColorStop(0.4, '#a8e6f0');
      iceGrd.addColorStop(1, '#00d2d3');
      
      ctx.fillStyle = iceGrd;
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.3, -this.size * 0.45);
      ctx.lineTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.3, this.size * 0.45);
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
    else {
      const grid = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
      grid.addColorStop(0, '#fff');
      grid.addColorStop(0.4, this.color);
      grid.addColorStop(1, 'transparent');
      ctx.fillStyle = grid;
      ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.restore();
  }
}
