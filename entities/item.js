// ─── XP FRAGMENT ────────────────────────────────────────────────────
export class XPFrag {
  constructor(x, y, val) {
    this.x = x; this.y = y; this.val = val;
    this.size = Math.min(8, 4 + val * 0.5);
    this.hp = 1; this.magnet = false;
    this.vx = (Math.random() - 0.5) * 3; this.vy = (Math.random() - 0.5) * 3;
    this.color = val >= 5 ? '#ffd200' : '#2ed573';
  }
  update(dt, player) {
    if (this.magnet) {
      const dx = player.x - this.x, dy = player.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      this.x += (dx / d) * 12 * dt * 0.06;
      this.y += (dy / d) * 12 * dt * 0.06;
    } else {
      const dx = player.x - this.x, dy = player.y - this.y;
      if (Math.hypot(dx, dy) < 140) {
        this.x += (dx / Math.hypot(dx, dy)) * 5 * dt * 0.06;
        this.y += (dy / Math.hypot(dx, dy)) * 5 * dt * 0.06;
      }
      this.vx *= 0.93; this.vy *= 0.93;
      this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

// ─── MAGNET ITEM ────────────────────────────────────────────────────
export class MagnetItem {
  constructor(x, y) {
    this.x = x; this.y = y; this.size = 16; this.life = 15000;
    this.pulse = 0;
  }
  update(dt) { this.life -= dt; this.pulse += dt * 0.005; }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const s = this.size + Math.sin(this.pulse) * 3;
    ctx.save();
    ctx.font = `${s * 2}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f368e0'; ctx.shadowBlur = 12;
    ctx.fillText('🧲', rx, ry);
    ctx.restore();
  }
}
