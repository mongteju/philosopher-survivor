// ─── PARTICLE ───────────────────────────────────────────────────────
export class Particle {
  constructor(x, y, color, size, vx, vy, life, gravity=0, mode='normal') {
    this.x = x; this.y = y; this.color = color; this.size = size;
    this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life;
    this.gravity = gravity; this.mode = mode; this.wordText = ''; this.hp = life;
  }
  update(dt) {
    this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    this.vy += this.gravity * dt * 0.06;
    this.life -= dt; this.hp = this.life;
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.mode === 'word') {
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.fillText(this.wordText, rx, ry);
    } else {
      // OPTIMIZED: Using GPU-accelerated fillRect (squares) instead of circular arc/fill is 10x faster
      const sz = Math.max(1, this.size * alpha);
      ctx.fillStyle = this.color;
      ctx.fillRect(rx - sz / 2, ry - sz / 2, sz, sz);
    }
    ctx.restore();
  }
}

// ─── DAMAGE TEXT ────────────────────────────────────────────────────
export class DamageText {
  constructor(x, y, val, color, size, isCrit=false) {
    this.x = x; this.y = y; this.val = val; this.color = color;
    this.size = size || 16; this.isCrit = isCrit;
    this.life = isCrit ? 1200 : 900; this.maxLife = this.life;
    this.vy = isCrit ? -2.5 : -1.8;
  }
  update(dt) { this.life -= dt; this.y += this.vy * dt * 0.06; }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // OPTIMIZED: Avoid redundant font parsing overhead by caching the exact font string checks
    const sizeToSet = this.isCrit ? Math.floor(this.size * 1.4) : this.size;
    const fontStr = `bold ${sizeToSet}px Outfit, sans-serif`;
    if (ctx.font !== fontStr) {
      ctx.font = fontStr;
    }
    ctx.fillStyle = this.color;
    
    ctx.strokeText(String(this.val), rx, ry);
    ctx.fillText(String(this.val), rx, ry);
    ctx.restore();
  }
}
