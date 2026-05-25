import { sfx } from '../audio.js';

export function updatePauseKeyboardSelection(btns) {
  btns.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('keyboard-selected', i === this.pauseSelectedIndex);
  });
}

export function updateMenuKeyboardSelection() {
  document.getElementById('card-idealism').classList.toggle('keyboard-selected', this.menuSelectedIndex === 0);
  document.getElementById('card-empiricism').classList.toggle('keyboard-selected', this.menuSelectedIndex === 1);
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.classList.toggle('keyboard-selected', this.menuSelectedIndex === 2);
  }
}

export function updateTutorialKeyboardSelection() {
  const yesBtn = document.getElementById('tutorial-yes-btn');
  const noBtn = document.getElementById('tutorial-no-btn');
  if (yesBtn) yesBtn.classList.toggle('keyboard-selected', this.tutorialSelectedIndex === 0);
  if (noBtn) noBtn.classList.toggle('keyboard-selected', this.tutorialSelectedIndex === 1);
}

export function updateKeyboardCardSelection() {
  document.querySelectorAll('.choice-card').forEach((c, i) => {
    c.classList.toggle('keyboard-selected', i === this.cardSelectedIndex);
  });
}

export function updateExamKeyboardSelection() {
  const currentQ = document.getElementById(`q${this.currentQuestionIndex}`);
  if (!currentQ) return;
  const btns = currentQ.querySelectorAll('.quiz-option-btn');
  btns.forEach((btn, i) => {
    btn.classList.toggle('keyboard-selected', i === this.examSelectedIndex);
  });
}

export function gameEvents() {
  window.addEventListener('keydown', e => {
    let keyStr = (e.key || '').toLowerCase();
    let codeStr = (e.code || '').toLowerCase();
    
    // Normalize legacy arrow keys
    if (keyStr === 'right' || codeStr === 'arrowright') keyStr = 'arrowright';
    if (keyStr === 'left' || codeStr === 'arrowleft') keyStr = 'arrowleft';
    if (keyStr === 'up' || codeStr === 'arrowup') keyStr = 'arrowup';
    if (keyStr === 'down' || codeStr === 'arrowdown') keyStr = 'arrowdown';

    if (keyStr) this.keys[keyStr] = true;
    if (codeStr) this.keys[codeStr] = true;
    
    // Title screen Enter/Space to start
    const titleScreen = document.getElementById('title-screen');
    if (titleScreen && titleScreen.classList.contains('active')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.showMenuScreen();
      }
      return;
    }

    const k = keyStr;

    // Gameover screen Space/Enter restart
    const gameoverScreen = document.getElementById('gameover-screen');
    if (gameoverScreen && gameoverScreen.classList.contains('active')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const retryBtn = document.getElementById('gameover-retry-btn');
        if (retryBtn) retryBtn.click();
      }
      return;
    }

    // Ending screen keyboard navigation
    const endingScreen = document.getElementById('ending-screen');
    if (endingScreen && endingScreen.classList.contains('active')) {
      const currentQ = document.getElementById(`q${this.currentQuestionIndex}`);
      const isFinished = document.getElementById('exam-result').style.display === 'block';
      if (currentQ && !isFinished) {
        const btns = currentQ.querySelectorAll('.quiz-option-btn');
        const total = btns.length;
        if (k === 'arrowup' || k === 'w') {
          e.preventDefault();
          this.examSelectedIndex = (this.examSelectedIndex - 1 + total) % total;
          this.updateExamKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        } else if (k === 'arrowdown' || k === 's') {
          e.preventDefault();
          this.examSelectedIndex = (this.examSelectedIndex + 1) % total;
          this.updateExamKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (btns[this.examSelectedIndex]) {
            btns[this.examSelectedIndex].click();
          }
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const restartBtn = document.getElementById('restart-game-btn');
          if (restartBtn) restartBtn.click();
        }
      }
      return;
    }

    // Nietzsche Checkpoint Quiz keyboard navigation
    if (this.nietzscheQuizActive) {
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        this.nietzscheQuizSelection = (this.nietzscheQuizSelection - 1 + 4) % 4;
        this.updateNietzscheQuizSelection();
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        this.nietzscheQuizSelection = (this.nietzscheQuizSelection + 1) % 4;
        this.updateNietzscheQuizSelection();
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.selectNietzscheQuizOption();
      }
      return;
    }

    // ESC: pause
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.isPlaying || this.isPaused) this.togglePause();
      return;
    }

    // Pause screen navigation
    if (this.isPaused) {
      const pauseBtns = ['pause-resume-btn', 'pause-restart-btn', 'pause-bgm-btn', 'pause-sfx-btn', 'pause-status-toggle-btn'];
      if (k === 'arrowup' || k === 'w') { e.preventDefault(); this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + pauseBtns.length) % pauseBtns.length; this.updatePauseKeyboardSelection(pauseBtns); sfx.playTick(); }
      else if (k === 'arrowdown' || k === 's') { e.preventDefault(); this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % pauseBtns.length; this.updatePauseKeyboardSelection(pauseBtns); sfx.playTick(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const btn = document.getElementById(pauseBtns[this.pauseSelectedIndex]); if (btn) btn.click(); }
      return;
    }

    // Menu screen
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen.classList.contains('active')) {
      if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        this.menuSelectedIndex = 0;
        this.selectLineage('idealism');
        this.updateMenuKeyboardSelection();
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        this.menuSelectedIndex = 1;
        this.selectLineage('empiricism');
        this.updateMenuKeyboardSelection();
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      } else if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') {
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.player && this.player.lineage) {
          this.startGame();
        }
      }
      return;
    }

    // Tutorial screen
    const tutScreen = document.getElementById('tutorial-screen');
    if (tutScreen.classList.contains('active')) {
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') { e.preventDefault(); this.tutorialSelectedIndex = this.tutorialSelectedIndex === 0 ? 1 : 0; this.updateTutorialKeyboardSelection(); sfx.playTick(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (this.tutorialSelectedIndex === 0) document.getElementById('tutorial-yes-btn').click(); else document.getElementById('tutorial-no-btn').click(); }
      return;
    }

    // Level up card selection
    const lvlScreen = document.getElementById('levelup-screen');
    if (lvlScreen.classList.contains('active')) {
      const totalChoices = this.levelChoices.length || 1;

      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        if (this.cardSelectedIndex > 0) {
          this.cardSelectedIndex--;
          this.updateKeyboardCardSelection();
          sfx.playTick();
        }
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        if (this.cardSelectedIndex < totalChoices - 1) {
          this.cardSelectedIndex++;
          this.updateKeyboardCardSelection();
          sfx.playTick();
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cards = document.querySelectorAll('.choice-card');
        if (cards[this.cardSelectedIndex]) cards[this.cardSelectedIndex].click();
      }
      return;
    }

    // Gacha screen
    const gachaScreen = document.getElementById('gacha-screen');
    if (gachaScreen && gachaScreen.classList.contains('active')) {
      if (this._gachaChoiceMode) {
        if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's' || k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') {
          e.preventDefault();
          this._gachaChoiceIndex = this._gachaChoiceIndex === 0 ? 1 : 0;
          this._updateAuraChoiceSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (this._gachaChoiceIndex === 0) {
            this._applyAuraUpgrade();
          } else {
            this._applyAuraChange();
          }
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!this._gachaSpun) {
          this.triggerGachaSpin();
        } else {
          const closeBtn = document.getElementById('gacha-close-btn');
          if (closeBtn && document.getElementById('gacha-result').style.display !== 'none') {
            closeBtn.click();
          }
        }
      }
      return;
    }

    // Pedia screen
    const pediaScreen = document.getElementById('pedia-screen');
    if (pediaScreen && pediaScreen.classList.contains('active')) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const pediaClose = document.getElementById('pedia-close-btn');
        if (pediaClose) pediaClose.click();
      }
      return;
    }

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) e.preventDefault();
  });

  window.addEventListener('keyup', e => {
    let keyStr = (e.key || '').toLowerCase();
    let codeStr = (e.code || '').toLowerCase();
    
    // Normalize legacy arrow keys
    if (keyStr === 'right' || codeStr === 'arrowright') keyStr = 'arrowright';
    if (keyStr === 'left' || codeStr === 'arrowleft') keyStr = 'arrowleft';
    if (keyStr === 'up' || codeStr === 'arrowup') keyStr = 'arrowup';
    if (keyStr === 'down' || codeStr === 'arrowdown') keyStr = 'arrowdown';

    if (keyStr) this.keys[keyStr] = false;
    if (codeStr) this.keys[codeStr] = false;
  });

  window.addEventListener('blur', () => {
    this.keys = {};
    if (this.joystick) {
      this.joystick.active = false;
      this.joystick.strength = 0;
    }
  });

  // Bind UI buttons
  const titleScr = document.getElementById('title-screen');
  if (titleScr) {
    titleScr.addEventListener('click', () => this.showMenuScreen());
  }
  const titleBtn = document.getElementById('title-start-btn');
  if (titleBtn) {
    titleBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.showMenuScreen();
    });
  }
  document.getElementById('card-idealism').addEventListener('click', () => { this.menuSelectedIndex = 0; this.selectLineage('idealism'); this.updateMenuKeyboardSelection(); });
  document.getElementById('card-empiricism').addEventListener('click', () => { this.menuSelectedIndex = 1; this.selectLineage('empiricism'); this.updateMenuKeyboardSelection(); });
  document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
  document.getElementById('tutorial-yes-btn').addEventListener('click', () => this.acceptTutorial(true));
  document.getElementById('tutorial-no-btn').addEventListener('click', () => this.acceptTutorial(false));
  document.getElementById('gacha-close-btn').addEventListener('click', () => this.resumeFromGacha());
  const spinBtn = document.getElementById('gacha-spin-btn');
  if (spinBtn) spinBtn.addEventListener('click', () => this.triggerGachaSpin());
  const upgradeBtn = document.getElementById('gacha-upgrade-btn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      this._gachaChoiceIndex = 0;
      this._updateAuraChoiceSelection();
      this._applyAuraUpgrade();
    });
  }
  const changeBtn = document.getElementById('gacha-change-btn');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      this._gachaChoiceIndex = 1;
      this._updateAuraChoiceSelection();
      this._applyAuraChange();
    });
  }
  document.getElementById('gameover-retry-btn').addEventListener('click', () => location.reload());
  document.getElementById('restart-game-btn').addEventListener('click', () => location.reload());
  document.getElementById('pause-resume-btn').addEventListener('click', () => this.togglePause());
  document.getElementById('pause-restart-btn').addEventListener('click', () => location.reload());
  document.getElementById('pause-bgm-btn').addEventListener('click', () => {
    this.bgmMuted = !this.bgmMuted; this.bgm.muted = this.bgmMuted;
    document.getElementById('pause-bgm-btn').textContent = this.bgmMuted ? '음악: 꺼짐' : '음악: 켜짐'; sfx.playTick();
  });
  document.getElementById('pause-sfx-btn').addEventListener('click', () => {
    this.sfxMuted = !this.sfxMuted;
    document.getElementById('pause-sfx-btn').textContent = this.sfxMuted ? '효과음: 꺼짐' : '효과음: 켜짐'; sfx.playTick();
  });
  document.getElementById('pause-status-toggle-btn').addEventListener('click', () => {
    const panel = document.getElementById('pause-status-panel');
    if (panel) {
      const isOpening = panel.style.display === 'none';
      panel.style.display = isOpening ? 'block' : 'none';
      if (isOpening) {
        this.updatePauseStatusPanel();
      }
    }
  });


  // Final ending quiz option buttons
  document.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const isCorrect = e.currentTarget.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        this.examScore += 1;
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      } else {
        if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
      }

      const currentQ = document.getElementById(`q${this.currentQuestionIndex}`);
      if (currentQ) {
        currentQ.classList.remove('active');
        const btns = currentQ.querySelectorAll('.quiz-option-btn');
        btns.forEach(b => b.classList.remove('keyboard-selected'));
      }

      this.currentQuestionIndex++;
      const nextQ = document.getElementById(`q${this.currentQuestionIndex}`);
      if (nextQ) {
        nextQ.classList.add('active');
        this.examSelectedIndex = 0;
        this.updateExamKeyboardSelection();
      } else {
        let finalScore = 0;
        if (this.examScore === 3) finalScore = 100;
        else if (this.examScore === 2) finalScore = 66;
        else if (this.examScore === 1) finalScore = 33;

        const scoreStamp = document.getElementById('score-stamp');
        if (scoreStamp) {
          scoreStamp.textContent = finalScore;
          if (finalScore === 100) {
            scoreStamp.style.color = '#ff4757';
            scoreStamp.style.borderColor = '#ff4757';
          } else if (finalScore >= 60) {
            scoreStamp.style.color = '#ffa502';
            scoreStamp.style.borderColor = '#ffa502';
          } else {
            scoreStamp.style.color = '#7f8c8d';
            scoreStamp.style.borderColor = '#7f8c8d';
          }
        }

        const examResult = document.getElementById('exam-result');
        if (examResult) examResult.style.display = 'block';
        if (typeof sfx !== 'undefined' && sfx.playExamBell) sfx.playExamBell();

        // Highlight the restart button when the exam result displays
        const restartBtn = document.getElementById('restart-game-btn');
        if (restartBtn) restartBtn.classList.add('keyboard-selected');
      }
    });
  });
  const pediaOpen = document.getElementById('pedia-open-btn');
  if (pediaOpen) pediaOpen.addEventListener('click', () => { this.isPlaying = false; document.getElementById('pedia-screen').classList.add('active'); });
  const pediaClose = document.getElementById('pedia-close-btn');
  if (pediaClose) pediaClose.addEventListener('click', () => { 
    document.getElementById('pedia-screen').classList.remove('active'); 
    this.resetFocus();
    this.isPlaying = true; 
    this.lastTime = performance.now(); 
    requestAnimationFrame(t => this.loop(t)); 
  });

  // Developer Debug Panel Bindings
  const dbgInvinc = document.getElementById('dbg-invinc');
  if (dbgInvinc) {
    dbgInvinc.addEventListener('click', () => {
      if (!this.player) return;
      this.player.isInvincible = !this.player.isInvincible;
      dbgInvinc.textContent = '무적: ' + (this.player.isInvincible ? 'ON' : 'OFF');
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgSpeed = document.getElementById('dbg-speed');
  if (dbgSpeed) {
    dbgSpeed.addEventListener('click', () => {
      this.timeScale = this.timeScale === 1 ? 5 : this.timeScale === 5 ? 10 : 1;
      dbgSpeed.textContent = '배속: ' + this.timeScale + 'x';
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgLvlup = document.getElementById('dbg-lvlup');
  if (dbgLvlup) {
    dbgLvlup.addEventListener('click', () => {
      if (!this.player) return;
      this.player.gainXp(this.player.maxXp - this.player.xp, this);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgEvolve = document.getElementById('dbg-evolve');
  if (dbgEvolve) {
    dbgEvolve.addEventListener('click', () => {
      if (!this.player) return;
      this.player.evolutionIndex = Math.min(this.player.evolutionIndex + 1, 5);
      this.addDamageText(this.player.x, this.player.y - 80, '즉시 전직!', '#ffd200', 20);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgBoss = document.getElementById('dbg-boss');
  if (dbgBoss) {
    dbgBoss.addEventListener('click', () => {
      if (!this.player) return;
      if (window.gameDebug && typeof window.gameDebug.spawnBoss === 'function') {
        window.gameDebug.spawnBoss();
      } else {
        this.spawnBossImmediate();
      }
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgClear = document.getElementById('dbg-clear');
  if (dbgClear) {
    dbgClear.addEventListener('click', () => {
      if (this.currentBoss) {
        this.currentBoss.hp = 0;
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      }
    });
  }

  // Touch Joystick
  const container = document.getElementById('game-container');
  container.addEventListener('touchstart', e => {
    if (!this.isPlaying) return;
    const touch = e.touches[0];
    this.joystick.active = true; this.joystick.startX = touch.clientX; this.joystick.startY = touch.clientY;
    const jz = document.getElementById('joystick-zone');
    jz.style.display = 'flex'; jz.style.left = `${touch.clientX - 60}px`; jz.style.top = `${touch.clientY - 60}px`;
  });
  container.addEventListener('touchmove', e => {
    if (!this.joystick.active) return; e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - this.joystick.startX, dy = touch.clientY - this.joystick.startY;
    const dist = Math.min(Math.hypot(dx, dy), 60);
    this.joystick.angle = Math.atan2(dy, dx);
    this.joystick.strength = dist / 60;
    const handle = document.getElementById('joystick-handle');
    handle.style.transform = `translate(${(dx / Math.hypot(dx || 1, dy || 1)) * dist}px, ${(dy / Math.hypot(dx || 1, dy || 1)) * dist}px)`;
  }, { passive: false });
  container.addEventListener('touchend', () => {
    this.joystick.active = false; this.joystick.strength = 0;
    document.getElementById('joystick-zone').style.display = 'none';
    document.getElementById('joystick-handle').style.transform = 'translate(0,0)';
  });

  this.canvas.addEventListener('click', () => {
    this.resetFocus();
  });

  // Global click listener to prevent focus stealing by buttons
  document.addEventListener('click', e => {
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
      const btn = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
      btn.blur();
      window.focus();
    }
  });
}
