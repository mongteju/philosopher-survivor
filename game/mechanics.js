import { PHILOSOPHY_DB, EVOLUTION_STAGES, TIMELINE } from '../db.js';
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
  this.resetFocus();
  this.spawnInitialEnemies();
  this.isPlaying = true;
  this.lastTime = performance.now();
  this.bgm.play().catch(() => {});
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

  const boss = new Boss(
    this.player.x + 400, this.player.y,
    this.player.level, this.stage.bossName, this.stageIndex
  );
  this.currentBoss = boss;
  this.enemies.push(boss);
  this.bossFightStartTime = this.realSurvivalTimer;
  this.medievalDarkness = false;

  if (this.stageIndex === 3) {
    const idolTypes = ['cave', 'tribe', 'market', 'theater'];
    idolTypes.forEach((type, i) => {
      const a = (Math.PI * 2 / 4) * i;
      const idol = new Idol(
        this.player.x + Math.cos(a) * 300,
        this.player.y + Math.sin(a) * 300,
        type, boss
      );
      this.activeIdols.set(type, idol);
      this.enemies.push(idol);
    });
  }

  this.addDamageText(this.player.x, this.player.y - 80, `⚠ ${this.stage.bossName} 등장!`, '#ff4757', 22);
  sfx.playAlert();
}

export function onBossDefeated(boss) {
  this.currentBoss = null;
  this.medievalDarkness = false;
  this.kantRule = null;
  this.bossBullets = []; this.warningZones = [];
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
  const rVal = Math.random() * 100;
  let rolledTier = rVal < 5 ? 4 : rVal < 15 ? 3 : rVal < 45 ? 2 : 1;

  const tierNames = ['', '[보통] 신속의 아우라', '[레어] 광풍의 아우라', '[유니크] 지배의 아우라', '[에픽] 영생의 아우라'];
  const tierDescs = ['',
    '효과: 이동 속도 +15%',
    '효과: 이동 속도 +15%, 공격 속도 +15%',
    '효과: 이동 속도 +15%, 공격 속도 +15%, 주변 적 이동 속도 -25%',
    '효과: 이동 속도 +15%, 공격 속도 +15%, 주변 적 이동 속도 -25%, 흡혈 +10%'
  ];
  const tierColors = ['', '#2ed573', '#54a0ff', '#a55eea', '#ffd200'];
  const tierIcons = ['', '👣', '⚡', '🌀', '🩸'];

  let statusText = '';
  if (rolledTier > this.activeAuraTier) {
    statusText = '상위 등급 아우라를 장착했습니다!';
  } else {
    statusText = '현재 아우라가 더 강력합니다. 유지합니다.';
  }

  this._gachaPendingTier = rolledTier;
  this._gachaTierNames = tierNames;
  this._gachaTierDescs = tierDescs;
  this._gachaTierColors = tierColors;
  this._gachaAuraIcons = tierIcons;
  this._gachaStatusText = statusText;
  this._gachaSpun = false;

  const resultEl = document.getElementById('gacha-result');
  if (resultEl) { resultEl.style.display = 'none'; }
  const spinArea = document.getElementById('gacha-spin-area');
  if (spinArea) spinArea.style.display = 'block';
  const reelWrap = document.getElementById('gacha-reel-container');
  if (reelWrap) { reelWrap.style.display = 'block'; }
  const reel = document.getElementById('gacha-reel');
  if (reel) { reel.style.transition = 'none'; reel.style.transform = 'translateY(0)'; }

  document.getElementById('gacha-screen').classList.add('active');
  sfx.playLevelUp();

  const spinBtn = document.getElementById('gacha-spin-btn');
  if (spinBtn) spinBtn.classList.add('keyboard-selected');
  const closeBtn = document.getElementById('gacha-close-btn');
  if (closeBtn) closeBtn.classList.remove('keyboard-selected');
}

export function triggerGachaSpin() {
  if (this._gachaSpun) return;
  this._gachaSpun = true;
  const rolledTier = this._gachaPendingTier;
  const reel = document.getElementById('gacha-reel');
  if (!reel) { this._showGachaResult(rolledTier); return; }

  const itemH = 72;
  const tierCycle = [1, 2, 3, 4];
  const labels = { 1: '⚡ 보통', 2: '💎 레어', 3: '🌟 유니크', 4: '👑 에픽' };
  const attrs = { 1: 'common', 2: 'rare', 3: 'unique', 4: 'epic' };
  const totalItems = 48;
  reel.innerHTML = '';
  for (let i = 0; i < totalItems; i++) {
    const t = tierCycle[i % 4];
    const el = document.createElement('div');
    el.className = 'gacha-reel-item';
    el.setAttribute('data-tier', attrs[t]);
    el.textContent = labels[t];
    reel.appendChild(el);
  }
  let targetIdx = 40;
  for (let j = 40; j < totalItems; j++) {
    if (tierCycle[j % 4] === rolledTier) targetIdx = j;
  }
  const finalOffset = -(targetIdx * itemH);
  reel.style.transition = 'none'; reel.style.transform = 'translateY(0)';
  void reel.offsetWidth;
  reel.style.transition = 'transform 2.5s cubic-bezier(0.12, 0.04, 0.04, 1)';
  reel.style.transform = `translateY(${finalOffset}px)`;
  const spinArea = document.getElementById('gacha-spin-area');
  if (spinArea) spinArea.style.display = 'none';
  sfx.playEvolve();
  setTimeout(() => this._showGachaResult(rolledTier), 2700);
}

export function _showGachaResult(rolledTier) {
  if (rolledTier > this.activeAuraTier) {
    this.activeAuraTier = rolledTier;
    this.applyAuraStats();
  }
  const reelWrap = document.getElementById('gacha-reel-container');
  if (reelWrap) reelWrap.style.display = 'none';
  const gVisual = document.getElementById('gacha-aura-visual');
  if (gVisual) gVisual.textContent = this._gachaAuraIcons[rolledTier];
  const gTier = document.getElementById('gacha-tier');
  if (gTier) { gTier.textContent = this._gachaTierNames[rolledTier]; gTier.style.color = this._gachaTierColors[rolledTier]; }
  const gDesc = document.getElementById('gacha-desc');
  if (gDesc) gDesc.textContent = this._gachaTierDescs[rolledTier];
  const gStatus = document.getElementById('gacha-status');
  if (gStatus) gStatus.textContent = this._gachaStatusText;
  const resultEl = document.getElementById('gacha-result');
  if (resultEl) resultEl.style.display = 'block';
  sfx.playLevelUp();

  const spinBtn = document.getElementById('gacha-spin-btn');
  if (spinBtn) spinBtn.classList.remove('keyboard-selected');
  const closeBtn = document.getElementById('gacha-close-btn');
  if (closeBtn) closeBtn.classList.add('keyboard-selected');
}

export function applyAuraStats() {
  this.player.auraSpeedBonus = 0; this.player.auraCooldownReduction = 0;
  this.player.auraLifesteal = 0; this.player.auraEnemySlowAura = false;
  this.player.auraTier = this.activeAuraTier;
  if (this.activeAuraTier >= 1) this.player.auraSpeedBonus = 0.15;
  if (this.activeAuraTier >= 2) this.player.auraCooldownReduction = 0.15;
  if (this.activeAuraTier >= 3) this.player.auraEnemySlowAura = true;
  if (this.activeAuraTier >= 4) this.player.auraLifesteal = 0.10;
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
  this.isPlaying = true;
  this.lastTime = performance.now();
  requestAnimationFrame(t => this.loop(t));
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
        <div class="card-skill-desc">즉시 최대 체력의 40%를 회복합니다. 배움의 길 끝에 잠시 휴식을 취합니다.</div>
      </div>
      <div class="card-glitter-overlay"></div>
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
        <div class="card-glitter-overlay"></div>
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
    if (this.activeAuraTier === 0) {
      auraEl.innerHTML = '<span style="color: #95a5a6;">없음</span>';
    } else if (this.activeAuraTier === 1) {
      auraEl.innerHTML = '<span style="color: #2ed573; text-shadow: 0 0 4px rgba(46,213,115,0.4); font-weight:bold;">👣 보통 (이속 +15%)</span>';
    } else if (this.activeAuraTier === 2) {
      auraEl.innerHTML = '<span style="color: #54a0ff; text-shadow: 0 0 4px rgba(84,160,255,0.4); font-weight:bold;">⚡ 레어 (이속+15%, 쿨감-15%)</span>';
    } else if (this.activeAuraTier === 3) {
      auraEl.innerHTML = '<span style="color: #a55eea; text-shadow: 0 0 4px rgba(165,94,234,0.4); font-weight:bold;">🌀 유니크 (이속+쿨감+적감속)</span>';
    } else if (this.activeAuraTier === 4) {
      auraEl.innerHTML = '<span style="color: #ffd200; text-shadow: 0 0 6px rgba(255,210,0,0.6); font-weight:bold;">👑 에픽 (이속+쿨감+적감속+흡혈)</span>';
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
  this.damageTexts.push(new DamageText(x, y, val, color, size, isCrit));
}

export function spawnParticles(x, y, color, count, speed, vy) {
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
  this.examScore = 0;
  this.currentQuestionIndex = 1;
  this.examSelectedIndex = 0;

  document.querySelectorAll('.overlay-screen').forEach(scr => scr.classList.remove('active'));

  document.querySelectorAll('.quiz-question').forEach(q => q.classList.remove('active'));
  const q1 = document.getElementById('q1');
  if (q1) q1.classList.add('active');
  const examResult = document.getElementById('exam-result');
  if (examResult) examResult.style.display = 'none';

  const overlay = document.getElementById('exam-overlay-visual');
  if (overlay) {
    overlay.textContent = this.player && this.player.lineage === 'idealism' ? '🔥' : '❄️';
  }

  const secs = Math.floor(this.finalBossKillTime);
  const totalSecs = Math.floor(this.realSurvivalTimer);
  document.getElementById('exam-boss-kill-time').textContent = `${secs}초`;
  document.getElementById('exam-total-clear-time').textContent = `${Math.floor(totalSecs / 60)}분 ${totalSecs % 60}초`;
  document.getElementById('ending-screen').classList.add('active');
  
  this.updateExamKeyboardSelection();
  sfx.playExamBell();
}
