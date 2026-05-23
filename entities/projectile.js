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
    ctx.save();
    const grid = ctx.createRadialGradient(rx, ry, 0, rx, ry, this.size);
    grid.addColorStop(0, '#fff');
    grid.addColorStop(0.4, this.color);
    grid.addColorStop(1, 'transparent');
    ctx.fillStyle = grid;
    ctx.shadowColor = this.color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(rx, ry, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
