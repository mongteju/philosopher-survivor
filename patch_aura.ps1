$file = "game.js"
$content = [System.IO.File]::ReadAllText($file)
$startMarker = "    // 등급별 특수 아우라 그리기"
$endMarker = "    const drawImg = this.lineage === 'idealism' ? Player.spriteImagePlato : Player.spriteImageAristotle;"
$startIndex = $content.IndexOf($startMarker)
$endIndex = $content.IndexOf($endMarker)

if ($startIndex -ne -1 -and $endIndex -ne -1) {
    $replacement = @"
    // 8-Aura System Drawing (concentric, level-based scaling)
    Object.entries(this.auras).forEach(([auraId, lvl]) => {
      if (lvl <= 0) return;
      const db = AURA_DB[auraId];
      if (!db) return;
      ctx.save();
      const radius = 80 + lvl * 15;
      const color = db.color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 + Math.sin(t * 0.003) * 4;
      ctx.globalAlpha = 0.6;
      
      ctx.translate(rx, ry);
      ctx.rotate(t * 0.0005 * (auraId === 'endurance' ? 2.2 : 1));
      
      if (auraId === 'brilliance') {
        // Blue dashed hexagram-like pattern
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Hexagram shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (auraId === 'unholy') {
        // Green toxic ring with pentagram star inside
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * (i * 2) + Math.PI;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (auraId === 'thorns') {
        // Green spiky thorns ring
        ctx.beginPath();
        const spikes = 16;
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? radius : radius - 10;
          const angle = (Math.PI / spikes) * i;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (auraId === 'warsong') {
        // Double orange drums ring
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
        ctx.stroke();
        // Drum ticks
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          const x = [Math.cos(angle) * (radius - 8), Math.sin(angle) * (radius - 8)];
          ctx.beginPath();
          ctx.moveTo(x[0], x[1]);
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          ctx.stroke();
        }
      } else if (auraId === 'trueshot') {
        // Cyan ring with arrow ticks
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          const tx = Math.cos(angle) * radius;
          const ty = Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.moveTo(tx - Math.cos(angle - 0.3) * 10, ty - Math.sin(angle - 0.3) * 10);
          ctx.lineTo(tx, ty);
          ctx.lineTo(tx - Math.cos(angle + 0.3) * 10, ty - Math.sin(angle + 0.3) * 10);
          ctx.stroke();
        }
      } else {
        // Devotion (white), Endurance (pink), Vampiric (purple) basic dashed rings
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw Reason's Aura (fire_aura) glowing red fire ring if active
    if (this.fireAuraRadius > 0) {
      ctx.save();
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.55;
      ctx.translate(rx, ry);
      ctx.rotate(-t * 0.0003);
      
      ctx.beginPath();
      ctx.arc(0, 0, this.fireAuraRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.setLineDash([12, 12]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.fireAuraRadius - 6, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#ff7675';
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (t * 0.001);
        const fx = Math.cos(angle) * this.fireAuraRadius;
        const fy = Math.sin(angle) * this.fireAuraRadius;
        ctx.beginPath();
        ctx.arc(fx, fy, 4 + Math.sin(t * 0.01 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
"@
    $newContent = $content.Substring(0, $startIndex) + $replacement + $content.Substring($endIndex)
    [System.IO.File]::WriteAllText($file, $newContent)
    Write-Host "Success!"
} else {
    Write-Host "Error: Markers not found."
}
