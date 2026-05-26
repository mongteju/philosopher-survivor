import { PHILOSOPHY_DB, EVOLUTION_STAGES, TIMELINE, AURA_DB } from '../db.js';
import { sfx } from '../audio.js';
import {
  Enemy,
  Boss,
  Idol,
  XPFrag,
  Particle,
  DamageText,
  Player
} from '../entities.js';

export function selectLineage(lineage) {
  if (!this.player) this.player = new Player(lineage); // Wait, Player needs to be imported or referenced. But wait, Player is in entities.js. Let's make sure Player is imported or we can use: new window.gameInstance.player's class, or just import Player from '../entities.js'.
  else this.player.lineage = lineage;
  document.getElementById('start-game-btn').disabled = false;
  document.getElementById('start-game-btn').textContent = '게임 시작!';
  const cards = document.querySelectorAll('.lineage-card');
  cards.forEach(c => c.classList.remove('keyboard-selected'));
  const sel = document.getElementById(lineage === 'idealism' ? 'card-idealism' : 'card-empiricism');
  if (sel) sel.classList.add('keyboard-selected');
}

export function showMenuScreen() {
  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.classList.remove('active');
  const menuScreen = document.getElementById('menu-screen');
  if (menuScreen) {
    menuScreen.classList.add('active');
    this.menuSelectedIndex = 0;
    this.selectLineage('idealism');
    this.updateMenuKeyboardSelection();
  }
  if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
}

export function startGame() {
  if (!this.player || !this.player.lineage) return;
  const firstSkillId = this.player.lineage === 'idealism' ? 'fire_projectile' : 'ice_projectile';
  this.player.activeSkills[firstSkillId] = 1;
  document.getElementById('menu-screen').classList.remove('active');
  document.getElementById('tutorial-screen').classList.add('active');
  this.tutorialSelectedIndex = 0;
  this.updateTutorialKeyboardSelection();
}

export function acceptTutorial(accepted) {
  if (!accepted) {
    this.tutorialRefusalCount = (this.tutorialRefusalCount || 0) + 1;
    const dialogues = [
      "자네가 모든 것을 알고 있다면, 이미 이 미궁에 들어설 필요도 없었을 터인데... 정말로 다 알고 있단 말인가?",
      "자신의 무지를 모르는 것이야말로 가장 큰 무지라네. 다시 한번 생각해보게. 진정 아는가?",
      "허허, 자만심이 하늘을 찌르는군! 진정한 지혜는 아무것도 모른다는 것을 아는 것에서 시작하네.",
      "진정 '아니요'를 고집할 셈인가? 배움이 없는 지식은 위험한 법이라네.",
      "나는 단 한 가지만을 안다네. 그것은 내가 아무것도 모른다는 사실이지. 자네도 이를 인정하게!",
      "진리의 길은 오직 무지를 인정하는 자에게만 열린다네. 다시 대답해보게!"
    ];
    const socratesDialogue = document.getElementById('socrates-dialogue');
    if (socratesDialogue) {
      socratesDialogue.textContent = dialogues[(this.tutorialRefusalCount - 1) % dialogues.length];
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    }
    this.player.hp = Math.max(1, this.player.hp - 5);
    this.tutorialSelectedIndex = 0;
    this.updateTutorialKeyboardSelection();
    return;
  }

  document.getElementById('tutorial-screen').classList.remove('active');
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('hud').style.flexDirection = 'column';
  document.getElementById('hud').style.alignItems = 'center';
  
  // Show controls guide on game start
  const guideEl = document.getElementById('guide-panel');
  if (guideEl) {
    guideEl.style.display = 'block';
    guideEl.style.opacity = '1';
    const phase1 = document.getElementById('guide-phase-1');
    const phase2 = document.getElementById('guide-phase-2');
    if (phase1) phase1.style.display = 'block';
    if (phase2) phase2.style.display = 'none';
  }
  this.guideTimer = 30000; // 30 seconds total (15s Phase 1 + 15s Phase 2)
  this.gimmickActive = false;
  this.gimmickTimer = 0;
  
  this.resetFocus();
  this.spawnInitialEnemies();
  this.isPlaying = true;
  this.lastTime = performance.now();
  if (this.bgm) {
    try { this.bgm.play().catch(() => {}); } catch (err) {}
  }
  requestAnimationFrame(t => this.loop(t));
}

export function spawnInitialEnemies() {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * 200;
    this.enemies.push(new Enemy(
      this.player.x + Math.cos(angle) * dist,
      this.player.y + Math.sin(angle) * dist,
      this.player.level, this.stage.mobType));
  }
}

export function spawnRandomMob() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 600 + Math.random() * 250;
  const ex = this.player.x + Math.cos(angle) * dist;
  const ey = this.player.y + Math.sin(angle) * dist;
  this.enemies.push(new Enemy(ex, ey, this.player.level, this.stage.mobType));
}

export function spawnBossImmediate() {
  this.enemies = this.enemies.filter(e => e.type === 'boss');
  this.bossBullets = []; this.warningZones = [];
  this.activeIdols.clear();

  const bounds = this.bounds || 5000;
  const padding = 150;
  const spawnX = Math.max(-bounds + padding, Math.min(bounds - padding, this.player.x + 400));
  const spawnY = Math.max(-bounds + padding, Math.min(bounds - padding, this.player.y));

  const boss = new Boss(
    spawnX, spawnY,
    this.player.level, this.stage.bossName, this.stageIndex
  );
  this.currentBoss = boss;
  this.enemies.push(boss);
  this.bossFightStartTime = this.realSurvivalTimer;
  this.medievalDarkness = false;

  this.addDamageText(this.player.x, this.player.y - 80, `⚠ ${this.stage.bossName} 등장!`, '#ff4757', 22);
  sfx.playAlert();
}

export function onBossDefeated(boss) {
  this.currentBoss = null;
  this.medievalDarkness = false;
  this.kantRule = null;
  this.kantDutyLine = null;
  this.ataraxiaZone = null; // 아파테이아 평정 구역 안전지대 즉시 제거
  this.nietzscheArenaActive = false;
  this.nietzscheArenaCenter = null;
  this.nietzscheSafeZone = null;
  this.bossBullets = []; this.warningZones = [];
  
  // Clear gimmick overlays and state
  this.gimmickActive = false;
  this.gimmickTimer = 0;
  this.gridLines = [];
  this.candlesticks = [];
  if (this.bgm) {
    try { this.bgm.volume = this.bgmMuted ? 0 : 0.4; } catch (err) {}
  }
  
  this.lastBossKillTime = this.realSurvivalTimer - this.bossFightStartTime;
  this.spawnXpFrags(boss.x, boss.y, 30);
  this.spawnParticles(boss.x, boss.y, '#ffd200', 20, 15, -4);
  sfx.playEvolve();

  if (this.stageIndex >= TIMELINE.length - 1) {
    this.finalBossKillTime = this.lastBossKillTime;
    this.triggerEnding();
  } else {
    this.spawnAuraGacha();
  }
}

export function spawnAuraGacha() {
  this.isPlaying = false;
  
  const titleEl = document.querySelector('#gacha-screen h2');
  const descEl = document.querySelector('#gacha-screen p');
  
  if (!this.activeAura) {
    // First stage clear - 8 Ora Gacha spin
    if (titleEl) titleEl.textContent = '✨ 사상의 오라 소환 ✨';
    if (descEl) {
      descEl.style.display = 'block';
      descEl.textContent = '보스를 격파하여 획득한 영혼 에너지로 첫 번째 오라를 소환합니다.';
    }
    
    const spinArea = document.getElementById('gacha-spin-area');
    if (spinArea) spinArea.style.display = 'block';
    const reelWrap = document.getElementById('gacha-reel-container');
    if (reelWrap) reelWrap.style.display = 'block';
    const resultEl = document.getElementById('gacha-result');
    if (resultEl) resultEl.style.display = 'none';
    const choiceArea = document.getElementById('gacha-choice-area');
    if (choiceArea) choiceArea.style.display = 'none';
    
    this._gachaChoiceMode = false;
    this._gachaSpun = false;
    
    const spinBtn = document.getElementById('gacha-spin-btn');
    if (spinBtn) spinBtn.classList.add('keyboard-selected');
    const closeBtn = document.getElementById('gacha-close-btn');
    if (closeBtn) closeBtn.classList.remove('keyboard-selected');
  } else {
    // Subsequent stage clears - Upgrade (+1) or Change choice
    if (titleEl) titleEl.textContent = '⚡ 오라 강화 및 변경 ⚡';
    if (descEl) {
      descEl.style.display = 'block';
      descEl.textContent = '현재 장착한 오라를 더욱 강화하거나, 새로운 오라로 형태를 교체하십시오.';
    }
    
    const spinArea = document.getElementById('gacha-spin-area');
    if (spinArea) spinArea.style.display = 'none';
    const reelWrap = document.getElementById('gacha-reel-container');
    if (reelWrap) reelWrap.style.display = 'none';
    const resultEl = document.getElementById('gacha-result');
    if (resultEl) resultEl.style.display = 'none';
    const choiceArea = document.getElementById('gacha-choice-area');
    if (choiceArea) choiceArea.style.display = 'block';
    
    this._gachaChoiceMode = true;
    this._gachaChoiceIndex = 0; // Default: Upgrade
    this._updateAuraChoiceSelection();
    
    // Roll/pre-roll the change aura immediately!
    const auraKeys = Object.keys(AURA_DB);
    const filtered = auraKeys.filter(k => k !== this.activeAura);
    const preRolledChangeAura = filtered[Math.floor(Math.random() * filtered.length)];
    this._gachaPreRolledChangeAura = preRolledChangeAura;
    
    const curA = AURA_DB[this.activeAura];
    const changeA = AURA_DB[preRolledChangeAura];
    
    const currentLvlText = this.activeAuraLevel === 1 ? '' : ` +${this.activeAuraLevel - 1}강`;
    const nextLvlText = `+${this.activeAuraLevel}강`;
    
    const upDesc = document.getElementById('gacha-upgrade-desc');
    if (upDesc) {
      upDesc.innerHTML = `<span style="font-size: 21px; font-weight: 900; color: ${curA.color}; display: block; margin-bottom: 12px; text-shadow: 0 0 6px ${curA.color}55;">${curA.icon} ${curA.name}${currentLvlText} (강화)</span>` +
                         `<span style="color: #b7791f; font-weight: 900; font-size: 19px;">성능 강화하여 ${nextLvlText} 만들기</span><br>` +
                         `<span style="font-size: 16.5px; color: #231F20; font-weight: 900; display: inline-block; margin-top: 12px;">[${curA.statsDesc}] 수치가 한 단계 영구 증폭됩니다.</span>`;
    }
    const chDesc = document.getElementById('gacha-change-desc');
    if (chDesc) {
      chDesc.innerHTML = `<span style="font-size: 21px; font-weight: 900; color: ${changeA.color}; display: block; margin-bottom: 12px; text-shadow: 0 0 6px ${changeA.color}55;">${changeA.icon} ${changeA.name}로 교체</span>` +
                         `<span style="color: #b7791f; font-weight: 900; font-size: 19px;">현재 강화 등급 유지${currentLvlText}</span><br>` +
                         `<span style="font-size: 16.5px; color: #231F20; font-weight: 900; display: inline-block; margin-top: 12px;">[${changeA.statsDesc}] 효과를 획득합니다.</span>`;
    }
  }
  
  document.getElementById('gacha-screen').classList.add('active');
  sfx.playLevelUp();
}

export function triggerGachaSpin() {
  if (this._gachaSpun) return;
  this._gachaSpun = true;
  
  const auraKeys = Object.keys(AURA_DB);
  const rolledKey = auraKeys[Math.floor(Math.random() * auraKeys.length)];
  this._gachaPendingAura = rolledKey;
  
  const reel = document.getElementById('gacha-reel');
  if (!reel) { this._showGachaResult(rolledKey); return; }
  
  const itemH = 72;
  const totalItems = 48;
  
  reel.innerHTML = '';
  for (let i = 0; i < totalItems; i++) {
    const k = auraKeys[i % auraKeys.length];
    const item = AURA_DB[k];
    const el = document.createElement('div');
    el.className = 'gacha-reel-item';
    el.style.color = item.color;
    el.style.fontWeight = 'bold';
    el.style.textShadow = `0 0 4px ${item.color}44`;
    el.textContent = `${item.icon} ${item.name}`;
    reel.appendChild(el);
  }
  
  let targetIdx = 40;
  for (let j = 40; j < totalItems; j++) {
    if (auraKeys[j % auraKeys.length] === rolledKey) targetIdx = j;
  }
  
  const finalOffset = -(targetIdx * itemH);
  reel.style.transition = 'none'; reel.style.transform = 'translateY(0)';
  void reel.offsetWidth;
  reel.style.transition = 'transform 2.5s cubic-bezier(0.12, 0.04, 0.04, 1)';
  reel.style.transform = `translateY(${finalOffset}px)`;
  
  const spinArea = document.getElementById('gacha-spin-area');
  if (spinArea) spinArea.style.display = 'none';
  sfx.playEvolve();
  
  setTimeout(() => this._showGachaResult(rolledKey), 2700);
}

export function _showGachaResult(rolledKey) {
  const item = AURA_DB[rolledKey];
  
  this.activeAura = rolledKey;
  this.activeAuraLevel = 1;
  this.applyAuraStats();
  
  const reelWrap = document.getElementById('gacha-reel-container');
  if (reelWrap) reelWrap.style.display = 'none';
  
  const descEl = document.querySelector('#gacha-screen p');
  if (descEl) descEl.style.display = 'none'; // Hide the subtitle only after gacha result is shown!
  
  const gVisual = document.getElementById('gacha-aura-visual');
  if (gVisual) {
    gVisual.textContent = item.icon;
    gVisual.style.color = item.color;
    gVisual.style.textShadow = `0 0 20px ${item.color}`;
  }
  const gTier = document.getElementById('gacha-tier');
  if (gTier) {
    gTier.textContent = `[신규 소환] ${item.name}`;
    gTier.style.color = item.color;
  }
  const gDesc = document.getElementById('gacha-desc');
  if (gDesc) {
    gDesc.textContent = `효과: ${item.desc}`;
    gDesc.style.fontSize = '18.5px';
    gDesc.style.fontWeight = 'bold';
    gDesc.style.color = '#ffffff';
    gDesc.style.background = 'none';
    gDesc.style.border = 'none';
    gDesc.style.boxShadow = 'none';
    gDesc.style.padding = '0';
  }
  const gStatus = document.getElementById('gacha-status');
  if (gStatus) {
    gStatus.textContent = '';
    gStatus.style.display = 'none';
  }
  
  const resultEl = document.getElementById('gacha-result');
  if (resultEl) resultEl.style.display = 'block';
  
  sfx.playLevelUp();
  
  const spinBtn = document.getElementById('gacha-spin-btn');
  if (spinBtn) spinBtn.classList.remove('keyboard-selected');
  const closeBtn = document.getElementById('gacha-close-btn');
  if (closeBtn) closeBtn.classList.add('keyboard-selected');
}

export function applyAuraStats() {
  if (!this.player) return;
  
  this.player.auraSpeedBonus = 0;
  this.player.auraCooldownReduction = 0;
  this.player.auraLifesteal = 0;
  this.player.auraProjSpeedBonus = 0;
  this.player.auraDamageBonus = 0;
  this.player.auraDamageReduction = 0;
  this.player.auraRegenBonus = 0;
  this.player.auraThornsReflection = 0;
  this.player.auraCritChance = 0;
  
  if (!this.activeAura || this.activeAuraLevel <= 0) return;
  
  const lvl = this.activeAuraLevel;
  const key = this.activeAura;
  
  if (key === 'brilliance') {
    this.player.auraCooldownReduction = lvl * 0.10;
  } else if (key === 'devotion') {
    this.player.auraDamageReduction = Math.min(0.75, lvl * 0.10);
  } else if (key === 'endurance') {
    this.player.auraSpeedBonus = lvl * 0.10;
    this.player.auraProjSpeedBonus = lvl * 0.10;
  } else if (key === 'warsong') {
    this.player.auraDamageBonus = lvl * 0.15;
  } else if (key === 'unholy') {
    this.player.auraSpeedBonus = lvl * 0.08;
    this.player.auraRegenBonus = lvl * 1.5;
  } else if (key === 'vampiric') {
    this.player.auraLifesteal = lvl * 0.06;
  } else if (key === 'thorns') {
    this.player.auraThornsReflection = lvl * 0.25;
  } else if (key === 'trueshot') {
    this.player.auraCritChance = lvl * 0.12;
  }
}

export function _applyAuraUpgrade() {
  if (!this.activeAura) return;
  
  const item = AURA_DB[this.activeAura];
  const isBlessed = Math.random() < 0.20;
  
  if (isBlessed) {
    this.activeAuraLevel += 2;
    this.applyAuraStats();
    
    // Play celebratory sound effects
    if (typeof sfx !== 'undefined') {
      if (sfx.playEvolve) sfx.playEvolve();
      if (sfx.playLevelUp) sfx.playLevelUp();
    }
    
    // Massive colorful fireworks particles around the player
    const colors = ['#ffd200', '#ff9f43', '#ff4757', '#54a0ff', '#2ed573', '#a55eea'];
    colors.forEach(col => {
      this.spawnParticles(this.player.x, this.player.y, col, 15, 15, -3);
    });
    
    // Gorgeous congratulations text scrolling above player's head
    this.addDamageText(this.player.x, this.player.y - 120, "🎆 소크라테스의 축복! (+2강 추가 획득) 🎆", "#ffd200", 24, true);
  } else {
    this.activeAuraLevel += 1;
    this.applyAuraStats();
    if (typeof sfx !== 'undefined' && sfx.playEvolve) sfx.playEvolve();
  }
  
  // Transition to Result Screen
  this._gachaChoiceMode = false;
  this._gachaSpun = true; // Safety guard for event handler!
  
  const choiceArea = document.getElementById('gacha-choice-area');
  if (choiceArea) choiceArea.style.display = 'none';
  
  const titleEl = document.querySelector('#gacha-screen h2');
  if (titleEl) titleEl.textContent = '✨ 오라 강화 완료! ✨';
  
  const descEl = document.querySelector('#gacha-screen p');
  if (descEl) descEl.style.display = 'none';
  
  const gVisual = document.getElementById('gacha-aura-visual');
  if (gVisual) {
    gVisual.textContent = item.icon;
    gVisual.style.color = item.color;
    gVisual.style.textShadow = `0 0 20px ${item.color}`;
  }
  
  const gTier = document.getElementById('gacha-tier');
  if (gTier) {
    if (isBlessed) {
      gTier.textContent = `🎆 [소크라테스의 축복!] ${item.name} +${this.activeAuraLevel - 1}강`;
      gTier.style.color = '#ffd200';
    } else {
      gTier.textContent = `[강화 성공] ${item.name} +${this.activeAuraLevel - 1}강`;
      gTier.style.color = item.color;
    }
  }
  
  const gDesc = document.getElementById('gacha-desc');
  if (gDesc) {
    gDesc.textContent = `효과: ${item.desc} (현재 +${this.activeAuraLevel - 1}강)`;
    gDesc.style.fontSize = '18.5px';
    gDesc.style.fontWeight = 'bold';
    gDesc.style.color = '#ffffff';
    gDesc.style.background = 'none';
    gDesc.style.border = 'none';
    gDesc.style.boxShadow = 'none';
    gDesc.style.padding = '0';
  }
  
  const resultEl = document.getElementById('gacha-result');
  if (resultEl) resultEl.style.display = 'block';
  
  const closeBtn = document.getElementById('gacha-close-btn');
  if (closeBtn) {
    closeBtn.textContent = '오라 수락 [Enter]';
    closeBtn.classList.add('keyboard-selected');
  }
  
  const upBtn = document.getElementById('gacha-upgrade-btn');
  if (upBtn) upBtn.classList.remove('keyboard-selected');
  const chBtn = document.getElementById('gacha-change-btn');
  if (chBtn) chBtn.classList.remove('keyboard-selected');
}

export function _applyAuraChange() {
  if (!this.activeAura || !this._gachaPreRolledChangeAura) return;
  
  this.activeAura = this._gachaPreRolledChangeAura;
  this.applyAuraStats();
  
  if (typeof sfx !== 'undefined' && sfx.playEvolve) sfx.playEvolve();
  
  const item = AURA_DB[this.activeAura];
  
  // Transition to Result Screen
  this._gachaChoiceMode = false;
  this._gachaSpun = true; // Safety guard for event handler!
  
  const choiceArea = document.getElementById('gacha-choice-area');
  if (choiceArea) choiceArea.style.display = 'none';
  
  const titleEl = document.querySelector('#gacha-screen h2');
  if (titleEl) titleEl.textContent = '✨ 오라 교체 완료! ✨';
  
  const descEl = document.querySelector('#gacha-screen p');
  if (descEl) descEl.style.display = 'none';
  
  const gVisual = document.getElementById('gacha-aura-visual');
  if (gVisual) {
    gVisual.textContent = item.icon;
    gVisual.style.color = item.color;
    gVisual.style.textShadow = `0 0 20px ${item.color}`;
  }
  
  const gTier = document.getElementById('gacha-tier');
  if (gTier) {
    const lvlText = this.activeAuraLevel === 1 ? '' : ` +${this.activeAuraLevel - 1}강`;
    gTier.textContent = `[교체 성공] ${item.name}${lvlText}`;
    gTier.style.color = item.color;
  }
  
  const gDesc = document.getElementById('gacha-desc');
  if (gDesc) {
    const lvlText = this.activeAuraLevel === 1 ? '' : ` +${this.activeAuraLevel - 1}강`;
    gDesc.textContent = `효과: ${item.desc} (현재${lvlText})`;
    gDesc.style.fontSize = '18.5px';
    gDesc.style.fontWeight = 'bold';
    gDesc.style.color = '#ffffff';
    gDesc.style.background = 'none';
    gDesc.style.border = 'none';
    gDesc.style.boxShadow = 'none';
    gDesc.style.padding = '0';
  }
  
  const resultEl = document.getElementById('gacha-result');
  if (resultEl) resultEl.style.display = 'block';
  
  const closeBtn = document.getElementById('gacha-close-btn');
  if (closeBtn) {
    closeBtn.textContent = '오라 수락 [Enter]';
    closeBtn.classList.add('keyboard-selected');
  }
  
  const upBtn = document.getElementById('gacha-upgrade-btn');
  if (upBtn) upBtn.classList.remove('keyboard-selected');
  const chBtn = document.getElementById('gacha-change-btn');
  if (chBtn) chBtn.classList.remove('keyboard-selected');
}

export function _updateAuraChoiceSelection() {
  const upBtn = document.getElementById('gacha-upgrade-btn');
  const chBtn = document.getElementById('gacha-change-btn');
  if (upBtn && chBtn) {
    upBtn.classList.toggle('keyboard-selected', this._gachaChoiceIndex === 0);
    chBtn.classList.toggle('keyboard-selected', this._gachaChoiceIndex === 1);
  }
}

export function resumeFromGacha() {
  this.resetFocus();
  const closeBtn = document.getElementById('gacha-close-btn');
  if (closeBtn) closeBtn.classList.remove('keyboard-selected');
  document.getElementById('gacha-screen').classList.remove('active');
  this.stageIndex = Math.min(this.stageIndex + 1, TIMELINE.length - 1);
  this.stage = TIMELINE[this.stageIndex];
  this.eraSurvivalTime = 0;
  this.enemies = []; this.bossBullets = []; this.warningZones = [];
  this.iceFloors = []; this.projectiles = [];
  this.activeIdols.clear();
  this.medievalDarkness = false; this.kantRule = null;
  this.player.evolutionIndex = Math.min(this.stageIndex, EVOLUTION_STAGES[this.player.lineage].length - 1);
  this.addDamageText(this.player.x, this.player.y - 80, `✨ ${EVOLUTION_STAGES[this.player.lineage][this.player.evolutionIndex].title} 전직!`, '#ffd200', 22);
  for (let i = 0; i < 5; i++) { this.spawnRandomMob(); }
  
  // Trigger Epic Promotion reward which will handle healing and pause screen
  this.triggerEpicEvolutionUpgrade();
}

export function triggerEpicEvolutionUpgrade() {
  this.isPlaying = false;
  
  // 1. Heal 30% of max HP
  let healAmt = 0;
  if (this.player) {
    healAmt = Math.floor(this.player.maxHp * 0.3);
    this.player.heal(healAmt);
    this.addDamageText(this.player.x, this.player.y - 40, `💚 체력 회복 +${healAmt} (30%)`, '#2ed573', 20);
  }

  // 2. Setup the levelup screen visual with Epic Promotion styling
  const ribbonTitle = document.querySelector('#levelup-screen .levelup-ribbon-title');
  if (ribbonTitle) {
    ribbonTitle.textContent = '✨ 전직 보상 ✨';
    ribbonTitle.classList.add('promotion-reward-title');
  }

  const instructionsEl = document.querySelector('#levelup-screen .levelup-instructions');
  if (instructionsEl) {
    const stages = EVOLUTION_STAGES[this.player.lineage];
    const ev = stages[Math.min(this.player.evolutionIndex, stages.length - 1)];
    const classTitle = ev ? ev.title : '학자';
    instructionsEl.innerHTML = `<span style="font-size:19px; color:#c0392b; font-weight:900; text-shadow: 1px 1px 0px rgba(0,0,0,0.15);">👑 [${classTitle}] 전직 완료! 👑</span><br>` +
                               `<span style="font-size:14px; color:#2ed573; font-weight:bold; display:inline-block; margin: 4px 0 6px;">💚 체력 30% 회복 완료 (+${healAmt} HP)</span><br>` +
                               `<span style="font-size:14px; color:#231F20; font-weight:700;">🎁 전직 기념 특별 에픽 등급 스킬 카드 중 하나를 선택하십시오!</span>`;
  }

  const linCards = PHILOSOPHY_DB[this.player.lineage];
  
  // Check if player has already awakened any weapon (active skill)
  const hasAwakenedWeapon = Object.entries(this.player.activeSkills).some(([id, lvl]) => {
    const card = linCards.find(c => c.id === id);
    return card && card.type === 'weapon' && lvl >= card.maxLevel;
  });

  const available = linCards.filter(c => {
    const curLvl = this.player.activeSkills[c.id] || 0;
    const effectiveMaxLvl = (c.type === 'weapon' && hasAwakenedWeapon) ? Math.min(c.maxLevel, 3) : c.maxLevel;
    return curLvl < effectiveMaxLvl;
  });

  available.sort(() => Math.random() - 0.5);
  this.levelChoices = available.slice(0, 3);
  this.cardSelectedIndex = 0;
  const grid = document.getElementById('card-choices-container');
  grid.innerHTML = '';

  if (this.levelChoices.length === 0) {
    // If no skills are available to upgrade, offer a huge sage's blessing stats boost!
    const el = document.createElement('div');
    el.className = 'choice-card choice-card-horizontal keyboard-selected epic-card';
    el.innerHTML = `
      <div class="card-left-section">
        <div class="card-icon-box epic">
          <div class="tier-ribbon epic">에픽</div>
          <span class="card-skill-icon">👑</span>
        </div>
      </div>
      <div class="card-right-section">
        <div class="card-title-row">
          <span class="card-skill-name">대현자의 지혜 (기본 능력치 증가)</span>
          <span class="card-lv-badge">즉시</span>
        </div>
        <div class="card-skill-desc">모든 능력치를 대폭 증폭시킵니다. (대미지, 공격 범위, 이동 속도 증가)</div>
      </div>
    `;
    el.onclick = () => {
      this.player.dmgMultiplier += 0.30;
      this.player.areaMultiplier += 0.30;
      this.player.speed += 0.64;
      this.player.recalculateStats();
      this.closeLevelUp();
    };
    grid.appendChild(el);
  } else {
    this.levelChoices.forEach((upgrade, idx) => {
      const curLvl = this.player.activeSkills[upgrade.id] || 0;
      const nextLvl = curLvl + 1;
      const isAwakening = nextLvl >= upgrade.maxLevel;

      // Force to Epic tier!
      const tier = 'epic';
      upgrade.rolledTier = tier;

      const categoryClass = upgrade.type === 'weapon' ? 'choice-card-weapon' : 'choice-card-passive';
      const el = document.createElement('div');
      el.className = `choice-card choice-card-horizontal ${categoryClass} ${this.player.lineage}-card ${tier}-card${isAwakening ? ' awakening-card' : ''}`;
      if (idx === 0) el.classList.add('keyboard-selected');

      el.addEventListener('mouseenter', () => {
        this.cardSelectedIndex = idx;
        this.updateKeyboardCardSelection();
      });

      const bonusSpan = `<span class="rarity-bonus-pill epic">+90% 보너스 스텟</span>`;
      const lvLabel = isAwakening ? '각성' : `Lv.${nextLvl}`;
      
      el.innerHTML = `
        <div class="card-left-section">
          <div class="card-icon-box epic">
            <div class="tier-ribbon epic">에픽</div>
            <span class="card-skill-icon">${upgrade.icon || (upgrade.type === 'weapon' ? '⚔️' : '🧠')}</span>
          </div>
        </div>
        <div class="card-right-section">
          <div class="card-title-row">
            <span class="card-skill-name">${upgrade.name}</span>
            <div class="card-right-badge-stack">
              <span class="card-lv-badge ${isAwakening ? 'awakening' : ''}">${lvLabel}</span>
              ${bonusSpan}
            </div>
          </div>
          <div class="card-skill-desc">${upgrade.desc || ''}</div>
          ${isAwakening ? '<div class="awakening-badge-line">🔥 각성 특수 효과 발현!</div>' : ''}
        </div>
      `;
      el.onclick = () => {
        if (isAwakening && upgrade.type === 'weapon') {
          const confirmAwake = confirm("🔥 정말로 이 스킬을 각성하시겠습니까?\n\n(한 번 각성하면 다른 액티브 스킬은 각성할 수 없으며 최대 레벨이 3으로 제한됩니다!)");
          if (!confirmAwake) return;
        }
        this.applyCardSelection(upgrade, isAwakening);
        this.closeLevelUp();
      };
      grid.appendChild(el);
    });
  }

  // Focus and trigger UI active state
  document.getElementById('levelup-screen').classList.add('active');
  sfx.playLevelUp();
}

export function triggerLevelUp() {
  this.isPlaying = false;
  const linCards = PHILOSOPHY_DB[this.player.lineage];
  
  // Check if player has already awakened any weapon (active skill)
  const hasAwakenedWeapon = Object.entries(this.player.activeSkills).some(([id, lvl]) => {
    const card = linCards.find(c => c.id === id);
    return card && card.type === 'weapon' && lvl >= card.maxLevel;
  });

  const available = linCards.filter(c => {
    const curLvl = this.player.activeSkills[c.id] || 0;
    const effectiveMaxLvl = (c.type === 'weapon' && hasAwakenedWeapon) ? Math.min(c.maxLevel, 3) : c.maxLevel;
    return curLvl < effectiveMaxLvl;
  });

  available.sort(() => Math.random() - 0.5);
  this.levelChoices = available.slice(0, 3);
  this.cardSelectedIndex = 0;
  const grid = document.getElementById('card-choices-container');
  grid.innerHTML = '';

  if (this.levelChoices.length === 0) {
    const el = document.createElement('div');
    el.className = 'choice-card choice-card-horizontal keyboard-selected heal-card';
    el.innerHTML = `
      <div class="card-left-section">
        <div class="card-icon-box normal">
          <div class="tier-ribbon normal">기본</div>
          <span class="card-skill-icon">💚</span>
        </div>
      </div>
      <div class="card-right-section">
        <div class="card-title-row">
          <span class="card-skill-name">체력 회복</span>
          <span class="card-lv-badge">즉시</span>
        </div>
        <div class="card-skill-desc">즉시 최대 체력의 일부를 회복합니다. 배움의 길 끝에 잠시 휴식을 취합니다.</div>
      </div>
    `;
    el.onclick = () => { this.player.heal(Math.floor(this.player.maxHp * 0.4)); this.closeLevelUp(); };
    grid.appendChild(el);
  } else {
    this.levelChoices.forEach((upgrade, idx) => {
      const curLvl = this.player.activeSkills[upgrade.id] || 0;
      const nextLvl = curLvl + 1;
      const isAwakening = nextLvl >= upgrade.maxLevel;

      const r = Math.random() * 100;
      let tier = 'normal';
      if (r < 5) tier = 'epic';
      else if (r < 15) tier = 'unique';
      else if (r < 45) tier = 'rare';
      else tier = 'normal';
      upgrade.rolledTier = tier;

      const tierNames = { normal: '보통', rare: '레어', unique: '유니크', epic: '에픽' };
      const tierName = tierNames[tier];
      const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
      const tm = tierMuls[tier];

      const curTier = this.player.skillTiers[upgrade.id] || 'normal';
      const curTm = tierMuls[curTier];

      const categoryClass = upgrade.type === 'weapon' ? 'choice-card-weapon' : 'choice-card-passive';
      const el = document.createElement('div');
      el.className = `choice-card choice-card-horizontal ${categoryClass} ${this.player.lineage}-card ${tier}-card${isAwakening ? ' awakening-card' : ''}`;
      if (idx === 0) el.classList.add('keyboard-selected');

      el.addEventListener('mouseenter', () => {
        this.cardSelectedIndex = idx;
        this.updateKeyboardCardSelection();
      });

      const percentMap = { rare: '+25% 보너스 스텟', unique: '+55% 보너스 스텟', epic: '+90% 보너스 스텟' };
      const bonusSpan = tier !== 'normal' ? `<span class="rarity-bonus-pill ${tier}">${percentMap[tier]}</span>` : '';

      const lvLabel = isAwakening ? '각성' : `Lv.${nextLvl}`;
      el.innerHTML = `
        <div class="card-left-section">
          <div class="card-icon-box ${tier}">
            <div class="tier-ribbon ${tier}">${tierName}</div>
            <span class="card-skill-icon">${upgrade.icon || (upgrade.type === 'weapon' ? '⚔️' : '🧠')}</span>
          </div>
        </div>
        <div class="card-right-section">
          <div class="card-title-row">
            <span class="card-skill-name">${upgrade.name}</span>
            <div class="card-right-badge-stack">
              <span class="card-lv-badge ${isAwakening ? 'awakening' : ''}">${lvLabel}</span>
              ${bonusSpan}
            </div>
          </div>
          <div class="card-skill-desc">${upgrade.desc || ''}</div>
          ${isAwakening ? '<div class="awakening-badge-line">🔥 각성 특수 효과 발현!</div>' : ''}
        </div>
      `;
      el.onclick = () => {
        if (isAwakening && upgrade.type === 'weapon') {
          const confirmAwake = confirm("🔥 정말로 이 스킬을 각성하시겠습니까?\n\n(한 번 각성하면 다른 액티브 스킬은 각성할 수 없으며 최대 레벨이 3으로 제한됩니다!)");
          if (!confirmAwake) return;
        }
        this.applyCardSelection(upgrade, isAwakening);
        this.closeLevelUp();
      };
      grid.appendChild(el);
    });
  }
  document.getElementById('levelup-screen').classList.add('active');
  sfx.playLevelUp();
}

export function applyCardSelection(upgrade, isAwakening) {
  const curLvl = this.player.activeSkills[upgrade.id] || 0;
  this.player.activeSkills[upgrade.id] = curLvl + 1;

  const tierPriority = { normal: 1, rare: 2, unique: 3, epic: 4 };
  const rolledTier = upgrade.rolledTier || 'normal';
  const existingTier = this.player.skillTiers[upgrade.id] || 'normal';

  if (tierPriority[rolledTier] > tierPriority[existingTier] || !this.player.skillTiers[upgrade.id]) {
    this.player.skillTiers[upgrade.id] = rolledTier;
  }

  this.player.recalculateStats();
}

export function closeLevelUp() {
  this.resetFocus();
  const ribbonTitle = document.querySelector('#levelup-screen .levelup-ribbon-title');
  if (ribbonTitle) {
    ribbonTitle.textContent = '스킬 선택';
    ribbonTitle.classList.remove('promotion-reward-title');
  }
  const instructionsEl = document.querySelector('#levelup-screen .levelup-instructions');
  if (instructionsEl) {
    instructionsEl.textContent = '방향키 [↑]/[↓]로 이동하고 [Enter]/[Space]로 선택하십시오.';
  }
  document.getElementById('levelup-screen').classList.remove('active');
  this.isPlaying = true; this.lastTime = performance.now();
  requestAnimationFrame(t => this.loop(t));
}

export function showLearnedSkillsPopup() {
  const list = document.getElementById('learned-skills-list');
  list.innerHTML = '';
  const active = this.player.activeSkills;
  const linCards = PHILOSOPHY_DB[this.player.lineage];

  let count = 0;
  Object.keys(active).forEach(id => {
    const lvl = active[id];
    if (lvl <= 0) return;
    count++;
    const data = linCards.find(c => c.id === id);
    if (!data) return;

    const tier = this.player.skillTiers[id] || 'normal';
    const tierMuls = { normal: 1.0, rare: 1.25, unique: 1.55, epic: 1.9 };
    const tm = tierMuls[tier];

    const tierNames = { normal: '보통', rare: '레어', unique: '유니크', epic: '에픽' };
    const tierName = tierNames[tier];

    const item = document.createElement('div');
    item.className = `learned-skill-item`;

    const isAwakening = lvl >= data.maxLevel;
    const lvLabel = isAwakening ? '각성' : `Lv.${lvl}`;

    item.innerHTML = `
      <div class="learned-skill-icon-box ${tier}">
        <span>${data.icon || '🧠'}</span>
      </div>
      <div class="learned-skill-details">
        <div class="learned-skill-name-row">
          <span class="learned-skill-name">${data.name} [${tierName}]</span>
          <span class="learned-skill-lvl">${lvLabel}</span>
        </div>
        <div class="learned-skill-desc">${data.desc || ''}</div>
      </div>
    `;
    list.appendChild(item);
  });

  if (count === 0) {
    list.innerHTML = '<div style="text-align: center; color: #7f6040; font-size: 13px; padding: 12px 0;">아직 학습한 스킬이 없습니다.</div>';
  }

  document.getElementById('learned-skills-popup').classList.add('active');
}

export function togglePause() {
  if (!this.isPlaying && !this.isPaused) return;
  this.isPaused = !this.isPaused;
  this.isPlaying = !this.isPaused;
  const ps = document.getElementById('pause-screen');
  if (this.isPaused) {
    ps.classList.add('active');
    this.pauseSelectedIndex = 0;
    this.updatePauseKeyboardSelection(['pause-resume-btn', 'pause-restart-btn', 'pause-bgm-btn', 'pause-sfx-btn', 'pause-status-toggle-btn']);
    this.updatePauseStatusPanel();
  } else {
    this.resetFocus();
    ps.classList.remove('active');
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }
}

export function updatePauseStatusPanel() {
  if (!this.player) return;

  if (this.player.auraTier !== undefined) {
    this.activeAuraTier = this.player.auraTier;
  }

  const stages = EVOLUTION_STAGES[this.player.lineage];
  const ev = stages[Math.min(this.player.evolutionIndex, stages.length - 1)];
  const className = `철학자: ${ev ? ev.title : '학자'}`;
  const eraName = this.stage ? this.stage.name : '고대 그리스';

  const statClassName = document.getElementById('stat-class-name');
  if (statClassName) statClassName.textContent = className;
  const statEraName = document.getElementById('stat-era-name');
  if (statEraName) statEraName.textContent = eraName;

  const statLevel = document.getElementById('stat-level');
  if (statLevel) statLevel.textContent = this.player.level;

  const totalSecs = Math.floor(this.realSurvivalTimer);
  const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const s = String(totalSecs % 60).padStart(2, '0');
  const statTime = document.getElementById('stat-time');
  if (statTime) statTime.textContent = `${m}:${s}`;

  const statHp = document.getElementById('stat-hp');
  if (statHp) statHp.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

  const auraEl = document.getElementById('stat-aura');
  if (auraEl) {
    if (!this.activeAura || this.activeAuraLevel <= 0) {
      auraEl.innerHTML = '<span style="color: #95a5a6;">없음</span>';
    } else {
      const a = AURA_DB[this.activeAura];
      if (a) {
        const lvlText = this.activeAuraLevel === 1 ? '' : ` +${this.activeAuraLevel - 1}강`;
        auraEl.innerHTML = `<span style="color: ${a.color}; text-shadow: 0 0 6px ${a.color}; font-weight:bold;">${a.icon} ${a.name}${lvlText}</span>`;
      } else {
        auraEl.innerHTML = '<span style="color: #95a5a6;">없음</span>';
      }
    }
  }

  const statValDmg = document.getElementById('stat-val-dmg');
  if (statValDmg) statValDmg.textContent = `${Math.round(this.player.dmgMultiplier * 100)}%`;
  const statValArea = document.getElementById('stat-val-area');
  if (statValArea) statValArea.textContent = `${Math.round(this.player.areaMultiplier * 100)}%`;
  const cdVal = Math.round((this.player.cooldownReduction + this.player.auraCooldownReduction) * 100);
  const statValCd = document.getElementById('stat-val-cd');
  if (statValCd) statValCd.textContent = `${cdVal}%`;
  const statValSpeed = document.getElementById('stat-val-speed');
  if (statValSpeed) statValSpeed.textContent = this.player.effectiveSpeed.toFixed(1);

  const skillsListEl = document.getElementById('stat-skills-list');
  if (skillsListEl) {
    skillsListEl.innerHTML = '';
    const linCards = PHILOSOPHY_DB[this.player.lineage];

    let hasSkills = false;
    for (const [skillId, lvl] of Object.entries(this.player.activeSkills)) {
      if (lvl > 0) {
        const card = linCards.find(c => c.id === skillId);
        if (card) {
          hasSkills = true;
          const skillDiv = document.createElement('div');
          skillDiv.style.display = 'flex';
          skillDiv.style.justifyContent = 'space-between';
          skillDiv.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
          skillDiv.style.padding = '3px 0';

          const nameSpan = document.createElement('span');
          nameSpan.innerHTML = `<span style="margin-right:6px;">${card.icon || ''}</span>${card.name}`;
          nameSpan.style.color = '#fff';

          const lvlSpan = document.createElement('span');
          lvlSpan.textContent = lvl >= card.maxLevel ? '각성' : `Lv.${lvl}`;
          lvlSpan.style.color = lvl >= card.maxLevel ? '#ffd200' : 'var(--xp-color)';
          lvlSpan.style.fontWeight = 'bold';

          skillDiv.appendChild(nameSpan);
          skillDiv.appendChild(lvlSpan);
          skillsListEl.appendChild(skillDiv);
        }
      }
    }

    if (!hasSkills) {
      skillsListEl.textContent = '습득한 스킬 없음';
    }
  }
}

export function addDamageText(x, y, val, color, size, isCrit) {
  // Cap the damage texts count to prevent rendering overhead when many hits occur
  if (this.damageTexts.length > 40) {
    this.damageTexts.shift(); // remove oldest
  }
  if (typeof val === 'number') {
    val = Math.floor(val);
  } else if (typeof val === 'string') {
    val = val.replace(/\b(\d+)\.\d+\b/g, '$1');
  }
  this.damageTexts.push(new DamageText(x, y, val, color, size, isCrit));
}

export function spawnParticles(x, y, color, count, speed, vy) {
  // Hard cap on active particles to avoid lag
  if (this.particles.length > 180) {
    count = Math.max(1, Math.floor(count * 0.3)); // reduce count to 30% if screen is crowded
  }
  if (this.particles.length > 250) {
    return; // Completely ignore particle spawning if count is extremely high
  }
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.5 + Math.random() * 0.5);
    this.particles.push(new Particle(x, y, color, 4 + Math.random() * 4, Math.cos(a) * s, Math.sin(a) * s + vy, 600, 0.05));
  }
}

export function spawnXpFrags(x, y, total) {
  const count = Math.min(total, 8);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 20 + Math.random() * 40;
    this.xpFrags.push(new XPFrag(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.ceil(total / count)));
  }
}

export function spawnExistentialWords() {
  const words = ['자유', '책임', '성장', '실존', '선택'];
  words.forEach(w => {
    const a = Math.random() * Math.PI * 2;
    const d = 150 + Math.random() * 200;
    const p = new Particle(this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d, '#a29bfe', 12, 0, 0, 8000, 0, 'word');
    p.wordText = w;
    this.particles.push(p);
    this.existentialWords.push(p);
  });
}

export function gameOver() {
  this.isPlaying = false;
  const stages = EVOLUTION_STAGES[this.player.lineage];
  const ev = stages[Math.min(this.player.evolutionIndex, stages.length - 1)];
  const totalSecs = Math.floor(this.realSurvivalTimer);
  const m = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const s = String(totalSecs % 60).padStart(2, '0');
  document.getElementById('go-philosopher').textContent = ev ? ev.title : '학자';
  document.getElementById('go-era').textContent = ev ? ev.era : '고대';
  document.getElementById('go-time').textContent = `${m}:${s}`;
  document.getElementById('gameover-screen').classList.add('active');
  sfx.playAlert();

  const retryBtn = document.getElementById('gameover-retry-btn');
  if (retryBtn) retryBtn.classList.add('keyboard-selected');
}

export function triggerEnding() {
  this.isPlaying = false;
  
  // Hide all screens
  document.querySelectorAll('.overlay-screen').forEach(scr => scr.classList.remove('active'));
  
  // Show the true cinematic ending screen
  const endingScreen = document.getElementById('true-ending-screen');
  if (endingScreen) endingScreen.classList.add('active');
  
  const typingContainer = document.getElementById('typing-container');
  const creditsContainer = document.getElementById('credits-container');
  
  // Update playtime display
  const totalSecs = Math.floor(this.realSurvivalTimer);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  const playtimeStr = `${m}분 ${s}초${this.usedDebugCheat ? ' (개발자)' : ''}`;
  const playtimeEl = document.getElementById('true-ending-playtime');
  if (playtimeEl) playtimeEl.textContent = `플레이타임: ${playtimeStr}`;
  
  // Hide return to menu button initially
  const menuBtn = document.getElementById('end-to-menu-btn');
  if (menuBtn) {
    menuBtn.style.display = 'none';
    menuBtn.style.opacity = '0';
  }
  
  if (typingContainer) {
    typingContainer.innerHTML = '';
    if (creditsContainer) creditsContainer.style.opacity = '0';
    
    const text = "소피스트의 궤변에서 시작하여...\n에피쿠로스의 평정심과 아우구스티누스의 맹목적인 믿음을 거쳐,\n데카르트의 회의와 칸트의 정언명령,\n그리고 마침내 니체의 심연과 마주하였다.\n\n수많은 사상의 소용돌이 속에서\n진정한 초인(Übermensch)으로 각성한 당신은,\n이제 찬란한 깨달음을 안고\n현실로 돌아간다.";
    
    // Play typing sfx loop while typing is ongoing
    const keyboardSound = (typeof sfx !== 'undefined' && sfx.sounds) ? sfx.sounds.keyboard : null;
    if (keyboardSound) {
      keyboardSound.loop = true;
      keyboardSound.volume = 0.35;
      keyboardSound.currentTime = 0;
      keyboardSound.play().catch(err => console.warn("Failed to play keyboard loop:", err));
    }

    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        if (text[i] === '\n') {
          typingContainer.innerHTML += '<br>';
        } else {
          typingContainer.innerHTML += text[i];
        }
        i++;
      } else {
        clearInterval(typingInterval);
        
        // Stop typing loop when typing ends
        if (keyboardSound) {
          keyboardSound.pause();
          keyboardSound.currentTime = 0;
          keyboardSound.loop = false;
        }

        setTimeout(() => {
          if (creditsContainer) creditsContainer.style.opacity = '1';
          
          // Show the menu return button 1.0s after credits fade in
          setTimeout(() => {
            const restartBtn = document.getElementById('end-to-menu-btn');
            if (restartBtn) {
              restartBtn.style.display = 'block';
              void restartBtn.offsetWidth; // trigger reflow
              restartBtn.style.opacity = '1';
              restartBtn.focus();
            }
          }, 1000);
        }, 1500);
      }
    }, 154); // Increased speed by 1.3x (200 / 1.3 ≈ 154ms)
  }
  
  if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
}

// ─── NIETZSCHE CHECKPOINT QUIZ & UNIQUE DEBUFF ACTIONS ────────────────

const NIETZSCHE_QUIZ_DATA = [
  {
    q: "Q1. 소피스트들의 상대주의적 진리관에 맞서, 대화를 통해 스스로 모름을 깨닫는 '무지의 자각'을 강조하고 보편적 진리를 추구한 철학자는 누구인가?",
    options: ["1) 프로타고라스", "2) 소크라테스", "3) 플라톤", "4) 데모크리토스"],
    correct: 1
  },
  {
    q: "Q2. 모든 격정과 외적인 감정 동요에서 완전히 벗어나 마음의 평정(부동심)을 이루고자 한 스토아학파의 이상적 경지는 무엇인가?",
    options: ["1) 아타락시아 (Ataraxia)", "2) 아파테이아 (Apatheia)", "3) 카타르시스 (Catharsis)", "4) 유다이모니아 (Eudaimonia)"],
    correct: 1
  },
  {
    q: "Q3. 중세의 맹목적인 믿음을 넘어 신앙과 이성의 조화를 강조하며, 학문적으로 신학을 체계화한 스콜라 철학의 거장은 누구인가?",
    options: ["1) 아우구스티누스", "2) 토마스 아퀴나스", "3) 윌리엄 오브 오캄", "4) 안셀무스"],
    correct: 1
  },
  {
    q: "Q4. 본 모험(게임) 중에 플레이어가 읊조린 철학적 명언 중 '마음속 네 가지 우상(종족, 동굴, 시장, 극장)을 깨뜨려라.'라고 말하며 아는 것이 힘임을 강조한 철학자는 누구인가?",
    options: ["1) 데카르트", "2) 아리스토텔레스", "3) 칸트", "4) 베이컨"],
    correct: 3
  },
  {
    q: "Q5. 임마누엘 칸트의 윤리학에서, 결과나 조건에 상관없이 인간이 마땅히 지켜야 할 절대적이고 무조건적인 도덕적 명령은 무엇인가?",
    options: ["1) 정언 명령 (Categorical Imperative)", "2) 가언 명령 (Hypothetical Imperative)", "3) 실용 명령 (Pragmatic Imperative)", "4) 자연 명령 (Natural Imperative)"],
    correct: 0
  }
];

export function triggerNietzscheQuiz(boss) {
  this.isPlaying = false;
  this.nietzscheQuizActive = true;
  this.nietzscheQuizBoss = boss;
  this.nietzscheQuizIndex = 0;
  this.nietzscheQuizScore = 0;
  this.nietzscheQuizSelection = 0;

  document.getElementById('nietzsche-quiz-screen').classList.add('active');
  this.renderNietzscheQuizQuestion();
  if (this.bgm) {
    try { this.bgm.pause(); } catch (err) {}
  }
  sfx.playExamBell();
}

export function renderNietzscheQuizQuestion() {
  const qData = NIETZSCHE_QUIZ_DATA[this.nietzscheQuizIndex];
  if (!qData) return;

  const numEl = document.getElementById('quiz-question-number');
  const txtEl = document.getElementById('quiz-question-text');
  if (numEl) numEl.textContent = `실존적 질문 ${this.nietzscheQuizIndex + 1} / 5`;
  if (txtEl) txtEl.textContent = qData.q;

  const container = document.getElementById('quiz-options-container');
  if (container) {
    container.innerHTML = '';
    qData.options.forEach((opt, idx) => {
      const btn = document.createElement('div');
      btn.className = 'quiz-option-btn';
      btn.style = 'background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #fff; cursor: pointer; transition: all 0.2s; font-weight: bold; margin-bottom: 4px;';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        this.nietzscheQuizSelection = idx;
        this.selectNietzscheQuizOption();
      });
      btn.addEventListener('mouseenter', () => {
        this.nietzscheQuizSelection = idx;
        this.updateNietzscheQuizSelection();
      });
      container.appendChild(btn);
    });
  }

  this.updateNietzscheQuizSelection();
}

export function updateNietzscheQuizSelection() {
  const container = document.getElementById('quiz-options-container');
  if (!container) return;
  const buttons = container.querySelectorAll('.quiz-option-btn');
  buttons.forEach((btn, idx) => {
    if (idx === this.nietzscheQuizSelection) {
      btn.style.background = 'rgba(255, 210, 0, 0.2)';
      btn.style.borderColor = '#ffd200';
      btn.style.boxShadow = '0 0 10px rgba(255, 210, 0, 0.4)';
    } else {
      btn.style.background = 'rgba(255,255,255,0.05)';
      btn.style.borderColor = 'rgba(255,255,255,0.15)';
      btn.style.boxShadow = 'none';
    }
  });
}

export function selectNietzscheQuizOption() {
  const qData = NIETZSCHE_QUIZ_DATA[this.nietzscheQuizIndex];
  if (this.nietzscheQuizSelection === qData.correct) {
    this.nietzscheQuizScore++;
    sfx.playTick();
  } else {
    if (sfx.playHit) sfx.playHit();
  }

  this.nietzscheQuizIndex++;
  if (this.nietzscheQuizIndex >= 5) {
    this.endNietzscheQuiz();
  } else {
    this.nietzscheQuizSelection = 0;
    this.renderNietzscheQuizQuestion();
  }
}

export function endNietzscheQuiz() {
  document.getElementById('nietzsche-quiz-screen').classList.remove('active');
  this.nietzscheQuizActive = false;

  const boss = this.nietzscheQuizBoss;

  if (this.nietzscheQuizScore >= 3) {
    // 1. Stop/pause existing BGM
    if (this.bgm) {
      try { this.bgm.pause(); } catch (err) {}
    }
    
    // 2. Freeze the screen (isPlaying = false keeps drawing particles/damage text but freezes core logic)
    this.isPlaying = false;
    
    // 3. Play dragon roar sound
    if (typeof sfx !== 'undefined') {
      sfx.playFile('dragonRoar', 0.6);
      
      const roarSound = sfx.sounds.dragonRoar;
      const onRoarEnd = () => {
        // Change BGM to ending song
        if (this.bgm) {
          try { this.bgm.pause(); } catch (err) {}
        }
        this.bgm = new Audio('sound/ending.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.35;
        this.bgm.muted = this.bgmMuted;
        if (!this.bgmMuted) {
          this.bgm.play().catch(err => console.warn(err));
        }
        
        // SUCCESS: Phase 2 Giant Dragon!
        boss.dragonActive = true;
        boss.size = 85;
        boss.maxHp = boss.maxHp * 1.5;
        boss.hp = boss.maxHp;
        boss.speed = 1.8;
        boss.isPatternActive = false;
        this.nietzcheRelics = [];
        
        // Confine player and display boundaries
        this.nietzscheArenaActive = true;
        this.nietzscheArenaCenter = { x: this.player.x, y: this.player.y };
        this.nietzscheArenaWidth = window.innerWidth || 1200;
        this.nietzscheArenaHeight = window.innerHeight || 800;
        this.cameraLocked = true; // Lock camera to center
        this.nietzscheSafeZone = null;
        
        // Trigger Mirror Shatter Effect
        const flashEl = document.getElementById('flash-overlay');
        if (flashEl) {
          flashEl.classList.remove('mirror-shatter');
          void flashEl.offsetWidth; // trigger reflow
          flashEl.classList.add('mirror-shatter');
        }
        
        // Remove grayscale after the shatter effect peaks (0.5s)
        setTimeout(() => {
          const canvasEl = document.getElementById('game-canvas');
          if (canvasEl) {
            canvasEl.classList.remove('grayscale-filter');
          }
        }, 500);

        if (sfx.playExplosion) sfx.playExplosion();
        
        this.addDamageText(boss.x, boss.y - 120, '🔥 허무의 종말룡 각성!! 🔥', '#ffd200', 30, true);
        this.showBossTooltip("🐉 허무의 종말룡: 허무주의의 지배자! 거대한 암흑룡의 불꽃 세례를 극복하고 진리에 도달하십시오!");
        
        // Resume game loop
        this.isPlaying = true;
        this.lastTime = performance.now();
      };
      
      let triggered = false;
      const triggerTransition = () => {
        if (triggered) return;
        triggered = true;
        roarSound.removeEventListener('ended', triggerTransition);
        onRoarEnd();
      };
      
      roarSound.addEventListener('ended', triggerTransition);
      // Fallback timeout of 3.5s in case audio ended event does not fire
      setTimeout(triggerTransition, 3500);
    } else {
      // Fallback if sfx is undefined
      this.isPlaying = true;
      this.lastTime = performance.now();
    }
  } else {
    this.isPlaying = true;
    this.lastTime = performance.now();
    
    if (this.bgm) {
      try { this.bgm.play().catch(err => console.warn(err)); } catch (e) {}
    }
    
    // FAILURE: Take 50% damage, restore boss HP to 55%, apply blind & slow debuff
    const penaltyDmg = Math.floor(this.player.maxHp * 0.5);
    this.player.takeDamage(penaltyDmg, this);
    
    boss.hp = boss.maxHp * 0.55;
    boss.nietzscheQuizTriggered = false; // retry
    
    this.player.blindedTimer = 3000;
    this.player.nietzscheVortexTimer = 3000;
    
    this.addDamageText(this.player.x, this.player.y - 80, '❌ 시험 낙제! 50% 피해 & 심연의 저주!', '#ff4757', 24);
    this.showBossTooltip("🦅 허무주의의 그림자: 그대의 깨달음이 부족하군. 잿빛의 심연 속에서 다시 한 번 진리를 갈구해라!");
    sfx.playAlert();
  }
}

export function applyUniqueHitAction(stageIndex) {
  if (!this.player) return;
  
  if (stageIndex === 0) {
    this.player.confusedTimer = 3000;
    this.addDamageText(this.player.x, this.player.y - 110, "🌀 혼란 (Sophist Chaos)!", "#a55eea", 16);
  } else if (stageIndex === 1) {
    this.player.stunnedTimer = 2500;
    this.addDamageText(this.player.x, this.player.y - 110, "❄️ 결빙 (Apatheia Freeze)!", "#74b9ff", 16);
  } else if (stageIndex === 2) {
    this.player.blindedTimer = 3000;
    this.addDamageText(this.player.x, this.player.y - 110, "👁️ 실명 (Dogmatic Blindness)!", "#2c3e50", 16);
  } else if (stageIndex === 3) {
    const boss = this.currentBoss;
    if (boss) {
      let dx = this.player.x - boss.x;
      let dy = this.player.y - boss.y;
      if (isNaN(dx)) dx = 0;
      if (isNaN(dy)) dy = 0;
      const dist = Math.hypot(dx, dy) || 1;
      this.player.knockbackTimer = 600;
      this.player.knockbackX = isNaN(dx / dist) ? 0 : (dx / dist) * 18;
      this.player.knockbackY = isNaN(dy / dist) ? 0 : (dy / dist) * 18;
    }
    this.screenShake = 35;
    this.addDamageText(this.player.x, this.player.y - 110, "💥 충격 넉백 (Idol Impact)!", "#ff7675", 16);
  } else if (stageIndex === 4) {
    this.player.kantStunnedTimer = 2000;
    this.addDamageText(this.player.x, this.player.y - 110, "⏰ 시간 속박 (Kantian Stasis)!", "#ffd200", 16);
  } else if (stageIndex === 5) {
    this.player.nietzscheVortexTimer = 3000;
    this.player.blindedTimer = 3000;
    this.addDamageText(this.player.x, this.player.y - 110, "🦅 중력 속박 (Nietzschean Abyss)!", "#0a0a0c", 16);
  }
}
