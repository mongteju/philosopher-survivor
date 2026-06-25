// ─── XP FRAGMENT ────────────────────────────────────────────────────
export class XPFrag {
  constructor(x, y, val) {
    this.x = x; this.y = y; this.val = val;
    this.size = Math.min(8, 4 + val * 0.5);
    this.hp = 1; this.magnet = false;
    this.vx = (Math.random() - 0.5) * 3; this.vy = (Math.random() - 0.5) * 3;
    // Three-tier color scale based on XP value
    this.color = val >= 20 ? '#ff7675' : (val >= 5 ? '#ffd200' : '#2ed573');
  }
  update(dt, player) {
    const dx = player.x - this.x, dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;
    if (this.magnet) {
      const d = Math.sqrt(distSq) || 1;
      this.x += (dx / d) * 12 * dt * 0.06;
      this.y += (dy / d) * 12 * dt * 0.06;
    } else {
      if (distSq < 19600) { // 140 * 140
        const d = Math.sqrt(distSq) || 1;
        this.x += (dx / d) * 5 * dt * 0.06;
        this.y += (dy / d) * 5 * dt * 0.06;
      }
      this.vx *= 0.93; this.vy *= 0.93;
      this.x += this.vx * dt * 0.06; this.y += this.vy * dt * 0.06;
    }
  }
  draw(ctx, camera) {
    const rx = this.x - camera.x + ctx.canvas.width / 2;
    const ry = this.y - camera.y + ctx.canvas.height / 2;
    ctx.save();
    
    // Draw vertical diamond crystal shape
    ctx.beginPath();
    ctx.moveTo(rx, ry - this.size);
    ctx.lineTo(rx + this.size * 0.75, ry);
    ctx.lineTo(rx, ry + this.size);
    ctx.lineTo(rx - this.size * 0.75, ry);
    ctx.closePath();
    
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw high-contrast black border to separate color from background
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    
    // Add white reflection glint to make it look shiny and raise visibility
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx - this.size * 0.2, ry - this.size * 0.2, this.size * 0.24, 0, Math.PI * 2);
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
