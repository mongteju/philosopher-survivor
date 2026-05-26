import { PHILOSOPHY_DB, EVOLUTION_STAGES } from '../db.js';

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

  const isGrayscale = !!(this.stageIndex === 5 && this.currentBoss && !this.currentBoss.dragonActive && !this.uberMenschMode);
  if (isGrayscale) {
    ctx.filter = 'grayscale(100%) contrast(110%)';
  }

  // Full grayscale/contrast filter for Stage 6 and Prejudice Wave using GPU-accelerated CSS filters
  const canvasEl = this.canvas;
  if (canvasEl) {
    const isPrejudice = !!(this.prejudiceWave === 3);

    if (canvasEl.classList.contains('grayscale-filter')) {
      canvasEl.classList.remove('grayscale-filter');
    }
    if (canvasEl.classList.contains('prejudice-filter') !== isPrejudice) {
      canvasEl.classList.toggle('prejudice-filter', isPrejudice);
    }
  }

  // Draw stage background
  this.drawStageBackground(camX, camY, W, H);

  // Draw map bounds and outside shaded area
  const bounds = this.bounds || 5000;
  const left = -bounds - camX + W / 2;
  const right = bounds - camX + W / 2;
  const top = -bounds - camY + H / 2;
  const bottom = bounds - camY + H / 2;

  // 1. Draw a semi-transparent dark shade outside the boundary
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  // Outer rectangle is clockwise, inner is counter-clockwise to subtract (evenodd rule)
  ctx.rect(left, top, right - left, bottom - top);
  ctx.closePath();
  ctx.fill('evenodd');
  ctx.restore();

  // 2. Draw a beautiful glowing border
  const stages = EVOLUTION_STAGES ? EVOLUTION_STAGES[this.player.lineage] : null;
  const ev = stages ? stages[Math.min(this.player.evolutionIndex, stages.length - 1)] : null;
  const themeColor = ev ? ev.color : '#ffd200';

  ctx.save();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.stroke();

  // Draw inner dashed line to give a modern "barrier grid" warning effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.rect(left + 8, top + 8, right - left - 16, bottom - top - 16);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw a border label at the top and bottom
  ctx.fillStyle = themeColor;
  ctx.font = 'bold 16px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚧 진리의 경계선 (LIMIT OF TRUTH) 🚧', (left + right) / 2, top - 15);
  ctx.fillText('🚧 진리의 경계선 (LIMIT OF TRUTH) 🚧', (left + right) / 2, bottom + 30);
  ctx.restore();

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

  // Ice floors (Rendered first so safe zones and characters draw on top of them)
  this.iceFloors.forEach(f => {
    const rx = f.x - camX + W / 2, ry = f.y - camY + H / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(168, 230, 240, 0.35)';
    ctx.strokeStyle = '#00d2d3'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(rx, ry, f.size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  });

  // Ataraxia safe zone
  if (this.ataraxiaZone) {
    const rx = this.ataraxiaZone.x - camX + W / 2, ry = this.ataraxiaZone.y - camY + H / 2;
    const radius = this.ataraxiaZone.radius || 110;
    
    // Check if player is inside the safe zone
    const dZone = Math.hypot(this.player.x - this.ataraxiaZone.x, this.player.y - this.ataraxiaZone.y);
    const isInside = dZone < radius;
    
    ctx.save();
    
    // 1. Draw glowing background gradient
    const grad = ctx.createRadialGradient(rx, ry, radius * 0.3, rx, ry, radius);
    if (isInside) {
      // Warm, safe glowing emerald green fill
      grad.addColorStop(0, 'rgba(46, 213, 115, 0.32)');
      grad.addColorStop(0.65, 'rgba(46, 213, 115, 0.16)');
      grad.addColorStop(1, 'rgba(46, 213, 115, 0.01)');
    } else {
      // Slightly more alert, dimmer green/teal fill
      grad.addColorStop(0, 'rgba(46, 213, 115, 0.18)');
      grad.addColorStop(0.7, 'rgba(46, 213, 115, 0.08)');
      grad.addColorStop(1, 'rgba(46, 213, 115, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(rx, ry, radius, 0, Math.PI * 2); ctx.fill();
    
    // 2. Draw outer pulsing boundary stroke with high-end glow
    const p = (Math.sin(Date.now() * 0.005) + 1) * 0.5; // pulsing variable 0 to 1
    ctx.strokeStyle = isInside ? 'rgba(46, 213, 115, 0.95)' : 'rgba(46, 213, 115, 0.7)';
    ctx.lineWidth = isInside ? 5 : 3;
    ctx.shadowColor = '#2ed573';
    ctx.shadowBlur = isInside ? 16 + p * 8 : 8 + p * 4;
    ctx.beginPath();
    ctx.arc(rx, ry, radius + p * 6, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reset shadow for inner elements
    ctx.shadowBlur = 0;
    
    // 3. Draw a spinning dashed inner ring to emphasize the zone's "active" state
    ctx.strokeStyle = isInside ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 12]);
    const rotSpeed = isInside ? 0.0012 : 0.0006;
    const rot = (Date.now() * rotSpeed) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(rx, ry, radius - 8, rot, rot + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 4. Draw label with dark outline/shadow for ultimate readability
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillStyle = '#2ed573';
    ctx.textAlign = 'center';
    
    // Add text shadow manual drop-effect for maximum readability over bright textures
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    const statusText = isInside ? '🟢 아파테이아 [안전 (SAFE)]' : '🟢 아파테이아 (Apatheia)';
    ctx.fillText(statusText, rx, ry - radius - 18);
    
    // 5. Draw countdown timer if gimmick is active
    if (this.gimmickActive && this.gimmickTimer > 0) {
      ctx.fillStyle = isInside ? '#ffffff' : '#ff4757';
      ctx.font = 'bold 18px Share Tech Mono, monospace, sans-serif';
      
      // Flash red timer when running out (under 2 seconds)
      if (this.gimmickTimer < 2000) {
        ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? '#ff4757' : '#ffffff';
      }
      
      ctx.fillText(`${(this.gimmickTimer / 1000).toFixed(1)}s`, rx, ry + 6);
      
      // Draw subtext
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillStyle = isInside ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 71, 87, 0.85)';
      ctx.fillText(isInside ? '평정 유지 중' : '영역 안으로 대피!', rx, ry + 24);
    }
    
    ctx.restore();
  }

  // Nietzsche Arena Boundary & 5x5 Grid
  if (this.nietzscheArenaActive && this.nietzscheArenaCenter) {
    ctx.save();
    const rx = this.nietzscheArenaCenter.x - camX + W / 2;
    const ry = this.nietzscheArenaCenter.y - camY + H / 2;
    const arenaW = this.nietzscheArenaWidth || 1200;
    const arenaH = this.nietzscheArenaHeight || 800;
    
    const left = rx - arenaW / 2;
    const top = ry - arenaH / 2;
    
    // Draw 5x5 grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      // vertical
      ctx.moveTo(left + i * (arenaW / 5), top);
      ctx.lineTo(left + i * (arenaW / 5), top + arenaH);
      // horizontal
      ctx.moveTo(left, top + i * (arenaH / 5));
      ctx.lineTo(left + arenaW, top + i * (arenaH / 5));
    }
    ctx.stroke();

    // Draw Inaccessible rows (Row 1)
    ctx.fillStyle = 'rgba(255, 71, 87, 0.2)';
    ctx.fillRect(left, top, arenaW, arenaH * (1 / 5));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(left, top, arenaW, arenaH * (1 / 5));
    
    // Boundary line for Inaccessible rows
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(left, top + arenaH * (1 / 5));
    ctx.lineTo(left + arenaW, top + arenaH * (1 / 5));
    ctx.stroke();
    
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ 절대 접근 금지 구역 ⚡', rx, top + arenaH * 0.1);

    // Draw Nietzsche Safe Column
    if (this.nietzscheSafeColumn !== undefined && this.nietzscheSafeColumn !== null) {
      const col = this.nietzscheSafeColumn;
      const colLeft = left + col * (arenaW / 5);
      const colWidth = arenaW / 5;
      
      // Glowing gold safe zone
      const p = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
      const alpha = 0.3 + p * 0.3;
      
      const grad = ctx.createLinearGradient(colLeft, top, colLeft + colWidth, top);
      grad.addColorStop(0, `rgba(255, 215, 0, 0)`);
      grad.addColorStop(0.2, `rgba(255, 215, 0, ${alpha})`);
      grad.addColorStop(0.8, `rgba(255, 215, 0, ${alpha})`);
      grad.addColorStop(1, `rgba(255, 215, 0, 0)`);
      
      ctx.fillStyle = grad;
      ctx.fillRect(colLeft, top, colWidth, arenaH);
      
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 3;
      ctx.strokeRect(colLeft, top, colWidth, arenaH);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Share Tech Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('👑 SAFE ZONE 👑', colLeft + colWidth / 2, top + arenaH * 0.6);
      ctx.fillText('초인 각성', colLeft + colWidth / 2, top + arenaH * 0.6 + 30);
    }
    
    ctx.restore();
  }

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

  // Draw Kantian Traffic Light System (정언명령 신호등)
  if (this.stageIndex === 4 && this.currentBoss && this.currentBoss.isPatternActive && this.kantTrafficLight) {
    ctx.save();
    
    // Draw traffic light box at top center (under the boss health bar)
    const boxW = 160;
    const boxH = 50;
    const boxX = W / 2 - boxW / 2;
    const boxY = 185; // safe distance from boss HP bar at top center (Y=110)
    
    // Draw background panel
    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();
    
    // Light centers
    const cy = boxY + boxH / 2;
    const r = 11;
    const spacing = 38;
    const redX = W / 2 - spacing;
    const yellowX = W / 2;
    const greenX = W / 2 + spacing;
    
    const curLight = this.kantTrafficLight; // 'red', 'yellow', 'green'
    
    // 1. Red Light
    ctx.save();
    if (curLight === 'red') {
      ctx.shadowColor = 'rgba(255, 71, 87, 1)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff4757';
    } else {
      ctx.fillStyle = 'rgba(255, 71, 87, 0.18)';
    }
    ctx.beginPath(); ctx.arc(redX, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    
    // 2. Yellow Light
    ctx.save();
    if (curLight === 'yellow') {
      ctx.shadowColor = 'rgba(255, 210, 0, 1)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffd200';
    } else {
      ctx.fillStyle = 'rgba(255, 210, 0, 0.18)';
    }
    ctx.beginPath(); ctx.arc(yellowX, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    
    // 3. Green Light
    ctx.save();
    if (curLight === 'green') {
      ctx.shadowColor = 'rgba(46, 213, 115, 1)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#2ed573';
    } else {
      ctx.fillStyle = 'rgba(46, 213, 115, 0.18)';
    }
    ctx.beginPath(); ctx.arc(greenX, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    
    // Draw label "KANTIAN TRAFFIC RULES"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚖️ KANTIAN IMPERATIVE LIGHT ⚖️', W / 2, boxY - 8);
    ctx.restore();
  }

  // Draw Kantian Golden Line (도덕의 선) - Kept fallback just in case
  if (this.kantDutyLine) {
    ctx.save();
    const ry = this.kantDutyLine.y - camY + H / 2;
    ctx.strokeStyle = 'rgba(255, 210, 0, 0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.lineTo(W, ry);
    ctx.stroke();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.lineTo(W, ry);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
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

  // Draw Cave Idol Blindness & Gimmick Failure Blindness Overlay
  if (this.prejudiceWave === 3 || (this.player && this.player.blindedTimer > 0)) {
    ctx.save();
    ctx.fillStyle = 'rgba(12, 6, 0, 0.9)';
    ctx.fillRect(0, 0, W, H);
    const prx = W / 2, pry = H / 2;
    const radius = 65;
    const grad = ctx.createRadialGradient(prx, pry, 0, prx, pry, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Draw Kantian Traffic Light Screen-wide Vignette Indicator (정언명령 화면 신호등 비네트)
  if (this.stageIndex === 4 && this.currentBoss && this.currentBoss.isPatternActive && this.kantTrafficLight) {
    ctx.save();
    const curLight = this.kantTrafficLight;
    let baseColor = '';
    let pulseSpeed = 0.003;
    let minAlpha = 0.05;
    let maxAlpha = 0.15;
    
    if (curLight === 'green') {
      baseColor = '46, 213, 115'; // Green
      pulseSpeed = 0.005;
      minAlpha = 0.25;
      maxAlpha = 0.45; // much stronger green
    } else if (curLight === 'yellow') {
      baseColor = '255, 210, 0'; // Yellow
      pulseSpeed = 0.01; // slightly faster pulse
      minAlpha = 0.30;
      maxAlpha = 0.50;
    } else if (curLight === 'red') {
      baseColor = '255, 71, 87'; // Red
      pulseSpeed = 0.015; // intense fast pulse
      minAlpha = 0.35;
      maxAlpha = 0.60;
    }
    
    const wave = (Math.sin(Date.now() * pulseSpeed) + 1) * 0.5; // 0 to 1
    const currentAlpha = minAlpha + wave * maxAlpha;
    
    // Draw a vignette gradient around the screen edges (darker outer band for intense glow)
    const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.30, W / 2, H / 2, Math.max(W, H) * 0.65);
    grad.addColorStop(0, `rgba(${baseColor}, 0)`);
    grad.addColorStop(0.7, `rgba(${baseColor}, ${currentAlpha * 0.5})`);
    grad.addColorStop(1, `rgba(${baseColor}, ${currentAlpha})`);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    
    // Draw a thick glowing border around the canvas for maximum readability
    ctx.strokeStyle = `rgba(${baseColor}, ${0.50 + wave * 0.50})`;
    ctx.lineWidth = 36; // significantly thicker border
    ctx.strokeRect(0, 0, W, H);
    
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
      const count = (stats.count || 1) * (isAwakening ? 2 : 1) * 2;
      const radius = (stats.radius || 65) * this.player.areaMultiplier;
      const prx = W / 2, pry = H / 2;
      for (let i = 0; i < count; i++) {
        const a = this.orbitAngle + (Math.PI * 2 / count) * i;
        const ox = prx + Math.cos(a) * radius, oy = pry + Math.sin(a) * radius;
        
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(1.8, 1.8);
        ctx.rotate(this.orbitAngle * 2.5 + i); // Spinning individual snowflakes
        
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 1.8;

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
  if (isGrayscale) {
    ctx.filter = 'none';
  }
  this.bossBullets.forEach(b => b.draw(ctx, this.camera));
  if (isGrayscale) {
    ctx.filter = 'grayscale(100%) contrast(110%)';
  }

  // Particles
  this.particles.forEach(p => p.draw(ctx, this.camera));

  // Player
  this.player.draw(ctx, this.camera);

  // Damage texts - Pre-setting base values to avoid canvas overhead
  ctx.save();
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 3;
  this.damageTexts.forEach(t => t.draw(ctx, this.camera));
  ctx.restore();

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
    // 근대 초기 - 하늘
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
    // 근대 후기 - 우주
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
    const isNietzschePhase1 = !!(this.stageIndex === 5 && this.currentBoss && !this.currentBoss.dragonActive && !this.uberMenschMode);
    ctx.fillStyle = isNietzschePhase1 ? '#0a0a0f' : '#000208';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = isNietzschePhase1 ? 'rgba(255,255,255,0.04)' : 'rgba(0,200,255,0.06)';
    ctx.lineWidth = 1;
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
