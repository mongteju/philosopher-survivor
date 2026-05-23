import { PHILOSOPHY_DB } from '../db.js';

export function gameDraw() {
  const ctx = this.ctx;
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  const camX = this.camera.x, camY = this.camera.y;
  const W = this.canvas.width, H = this.canvas.height;

  ctx.save();
  if (this.screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    this.screenShake *= 0.8; if (this.screenShake < 0.5) this.screenShake = 0;
  }

  // Full grayscale filter for Stage 6 (Nietzsche)
  if (this.stageIndex === 5 && this.currentBoss && !this.uberMenschMode) {
    ctx.filter = 'grayscale(100%)';
  } else if (this.prejudiceWave === 3) {
    ctx.filter = 'contrast(140%) sepia(85%)';
  } else {
    ctx.filter = 'none';
  }

  // Draw stage background
  this.drawStageBackground(camX, camY, W, H);

  // Medieval darkness overlay
  if (this.medievalDarkness && this.currentBoss) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
    // Light circle around player
    const prx = W / 2, pry = H / 2;
    const grad = ctx.createRadialGradient(prx, pry, 0, prx, pry, 180);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  }

  // Ataraxia safe zone
  if (this.ataraxiaZone) {
    const rx = this.ataraxiaZone.x - camX + W / 2, ry = this.ataraxiaZone.y - camY + H / 2;
    const radius = this.ataraxiaZone.radius || 110;
    ctx.save();
    ctx.strokeStyle = 'rgba(46, 213, 115, 0.8)'; ctx.lineWidth = 4;
    const p = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
    ctx.shadowColor = '#2ed573'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(rx, ry, radius + p * 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(46, 213, 115, 0.08)'; ctx.fill();
    
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#2ed573';
    ctx.textAlign = 'center';
    ctx.fillText('🟢 아파테이아 (Apatheia)', rx, ry - radius - 15);
    ctx.restore();
  }

  // Ice floors
  this.iceFloors.forEach(f => {
    const rx = f.x - camX + W / 2, ry = f.y - camY + H / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(168, 230, 240, 0.35)';
    ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(rx, ry, f.size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  });

  // Warning zones
  this.warningZones.forEach(w => w.draw(ctx, this.camera));

  // Draw Candlesticks
  if (this.candlesticks) {
    this.candlesticks.forEach(c => c.draw(ctx, this.camera));
  }

  // Draw Nietzsche relics
  if (this.nietzcheRelics) {
    this.nietzcheRelics.forEach(r => r.draw(ctx, this.camera));
  }

  // Draw Rhythmic Grid Lines
  if (this.gridLines) {
    this.gridLines.forEach(l => l.draw(ctx, this.camera, W, H));
  }

  // Draw Stage 4 Theater Idol ghost shadow trails
  if (this.prejudiceWave === 1 && this.playerHistory && this.playerHistory.length > 10) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    const trails = [8, 16, 24];
    for (let tIdx = 0; tIdx < trails.length; tIdx++) {
      const idx = trails[tIdx];
      const hist = this.playerHistory[this.playerHistory.length - 1 - idx];
      if (hist) {
        ctx.fillStyle = tIdx === 0 ? 'rgba(0, 210, 211, 0.45)' : (tIdx === 1 ? 'rgba(232, 67, 147, 0.45)' : 'rgba(255, 192, 72, 0.45)');
        const gx = hist.x - camX + W / 2;
        const gy = hist.y - camY + H / 2;
        ctx.beginPath();
        ctx.arc(gx, gy, this.player.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Draw Cave Idol Blindness Overlay
  if (this.prejudiceWave === 3) {
    ctx.save();
    ctx.fillStyle = 'rgba(12, 6, 0, 0.88)';
    ctx.fillRect(0, 0, W, H);
    const prx = W / 2, pry = H / 2;
    const grad = ctx.createRadialGradient(prx, pry, 0, prx, pry, 75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // XP frags
  this.xpFrags.forEach(f => f.draw(ctx, this.camera));

  // Magnet items
  this.magnetItems.forEach(m => m.draw(ctx, this.camera));

  // Ice ring visual
  const iceRingData = PHILOSOPHY_DB[this.player.lineage].find(c => c.id === 'ice_ring');
  if (iceRingData) {
    const lvl = this.player.activeSkills['ice_ring'] || 0;
    if (lvl > 0) {
      const stats = iceRingData.stats[lvl - 1];
      const isAwakening = lvl >= iceRingData.maxLevel;
      const count = (stats.count || 1) * (isAwakening ? 2 : 1);
      const radius = (stats.radius || 65) * this.player.areaMultiplier;
      const prx = W / 2, pry = H / 2;
      for (let i = 0; i < count; i++) {
        const a = this.orbitAngle + (Math.PI * 2 / count) * i;
        const ox = prx + Math.cos(a) * radius, oy = pry + Math.sin(a) * radius;
        
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(this.orbitAngle * 2.5 + i); // Spinning individual snowflakes
        
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#00d2d3';
        ctx.shadowBlur = 12;

        // Draw delicate 6-pointed snowflake barbs
        for (let k = 0; k < 6; k++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 9.5);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, 4.5);
          ctx.lineTo(-3, 7.5);
          ctx.moveTo(0, 4.5);
          ctx.lineTo(3, 7.5);
          ctx.stroke();
        }
        
        // Inner shining ice core
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }
  }

  // Enemies
  this.enemies.forEach(e => e.draw(ctx, this.camera));

  // Projectiles
  this.projectiles.forEach(p => p.draw(ctx, this.camera));

  // Boss bullets
  this.bossBullets.forEach(b => b.draw(ctx, this.camera));

  // Particles
  this.particles.forEach(p => p.draw(ctx, this.camera));

  // Player
  this.player.draw(ctx, this.camera);

  // Damage texts
  this.damageTexts.forEach(t => t.draw(ctx, this.camera));

  // Kant rule display
  if (this.kantRule) {
    ctx.save();
    ctx.fillStyle = 'rgba(214,48,49,0.18)'; ctx.fillRect(0, H / 2 - 80, W, 80);
    ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillStyle = '#ffd200';
    ctx.textAlign = 'center'; ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
    ctx.fillText(this.kantRule.text, W / 2, H / 2 - 42);
    ctx.font = 'bold 24px Share Tech Mono, monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(`의무이행 기한: ${(this.kantTimer / 1000).toFixed(1)}초`, W / 2, H / 2 - 10);
    ctx.restore();
  }

  ctx.restore();
}

export function drawStageBackground(camX, camY, W, H) {
  const ctx = this.ctx;
  const s = this.scroll;

  ctx.save();
  if (this.stageIndex === 0) {
    // 고대 그리스 - 숲
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a3a1a'); grad.addColorStop(1, '#0d2010');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(34,85,34,0.25)';
    for (let i = 0; i < 6; i++) {
      const tx = ((i * 240 - s * 0.1) % (W + 200) + W + 200) % (W + 200) - 100;
      ctx.beginPath(); ctx.moveTo(tx, H); ctx.lineTo(tx - 30, H * 0.4); ctx.lineTo(tx + 30, H * 0.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx, H * 0.55); ctx.lineTo(tx - 24, H * 0.25); ctx.lineTo(tx + 24, H * 0.25); ctx.closePath(); ctx.fill();
    }
  } else if (this.stageIndex === 1) {
    // 헬레니즘 - 바다
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a1a3a'); grad.addColorStop(0.6, '#0a3060'); grad.addColorStop(1, '#051530');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,180,255,0.15)'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const wy = H * 0.4 + i * 40 + Math.sin(s * 0.003 + i) * 15;
      ctx.beginPath(); ctx.moveTo(0, wy);
      for (let x = 0; x < W; x += 40) ctx.lineTo(x, wy + Math.sin((x + s * 0.5) * 0.02) * 12);
      ctx.stroke();
    }
  } else if (this.stageIndex === 2) {
    // 중세 - 사막
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#2a1a0a'); grad.addColorStop(1, '#3d2510');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(180,120,60,0.15)';
    for (let i = 0; i < 5; i++) {
      const dx = ((i * 300 + s * 0.08) % (W + 300)) - 150;
      ctx.beginPath(); ctx.ellipse(dx, H * 0.65, 150, 40, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (this.stageIndex === 3) {
    // 근대 시작 - 하늘
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#101035'); grad.addColorStop(0.5, '#1a2060'); grad.addColorStop(1, '#0d1540');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,220,255,0.12)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 350 + s * 0.06) % (W + 300)) - 100;
      ctx.beginPath(); ctx.ellipse(cx, H * 0.3, 120, 40, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx - 70, H * 0.35, 80, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 80, H * 0.28, 90, 30, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (this.stageIndex === 4) {
    // 근대 성숙 - 우주
    ctx.fillStyle = '#010208'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const sx = (Math.sin(i * 127.1 + s * 0.001) * 0.5 + 0.5) * W;
      const sy = (Math.cos(i * 311.7 + s * 0.0005) * 0.5 + 0.5) * H;
      ctx.globalAlpha = 0.4 + Math.sin(i + s * 0.002) * 0.3;
      ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // 현대 - 사이버
    ctx.fillStyle = '#000208'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,200,255,0.06)'; ctx.lineWidth = 1;
    const cg = 60;
    for (let x = 0; x < W + cg; x += cg) {
      const gx = ((x - s * 0.3) % (W + cg) + W + cg) % (W + cg);
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let y = 0; y < H + cg; y += cg) {
      const gy = ((y - s * 0.2) % (H + cg) + H + cg) % (H + cg);
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
  }
  ctx.restore();
}
