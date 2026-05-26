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



export function gameEvents() {
  window.addEventListener('keydown', e => {
    let keyStr = (e.key || '').toLowerCase();
    let codeStr = (e.code || '').toLowerCase();

    // Secret backdoor to toggle debug panel: Backtick (`) key
    if (e.key === '`' || e.key === '₩' || codeStr === 'backquote') {
      e.preventDefault();
      const dbg = document.getElementById('debug-panel');
      if (dbg) {
        const isHidden = dbg.style.display === 'none';
        dbg.style.display = isHidden ? 'block' : 'none';
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      }
      return;
    }
    
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

    // True ending screen Space/Enter return to menu
    const trueEndingScreen = document.getElementById('true-ending-screen');
    if (trueEndingScreen && trueEndingScreen.classList.contains('active')) {
      const endToMenuBtn = document.getElementById('end-to-menu-btn');
      if (endToMenuBtn && endToMenuBtn.style.display === 'block') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          endToMenuBtn.click();
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

  // Helper to trigger Fullscreen mode on user gesture (Universal Compatibility Upgrade)
  const enterFullscreen = () => {
    try {
      const doc = document.documentElement;
      const requestFS = doc.requestFullscreen || 
                        doc.webkitRequestFullscreen || 
                        doc.mozRequestFullScreen || 
                        doc.msRequestFullscreen;
      if (requestFS) {
        requestFS.call(doc).catch(err => {
          console.warn("[Fullscreen API Blocked/Not Allowed]", err);
        });
      }
    } catch (err) {}
  };

  // Bind UI buttons
  const titleScr = document.getElementById('title-screen');
  if (titleScr) {
    titleScr.addEventListener('click', () => {
      enterFullscreen();
      this.showMenuScreen();
    });
  }
  const titleBtn = document.getElementById('title-start-btn');
  if (titleBtn) {
    titleBtn.addEventListener('click', () => {
      enterFullscreen();
      this.showMenuScreen();
    });
  }
  const cardIdealism = document.getElementById('card-idealism');
  if (cardIdealism) {
    cardIdealism.addEventListener('click', () => { this.menuSelectedIndex = 0; this.selectLineage('idealism'); this.updateMenuKeyboardSelection(); });
    cardIdealism.addEventListener('mouseenter', () => { this.menuSelectedIndex = 0; this.updateMenuKeyboardSelection(); });
  }

  const cardEmpiricism = document.getElementById('card-empiricism');
  if (cardEmpiricism) {
    cardEmpiricism.addEventListener('click', () => { this.menuSelectedIndex = 1; this.selectLineage('empiricism'); this.updateMenuKeyboardSelection(); });
    cardEmpiricism.addEventListener('mouseenter', () => { this.menuSelectedIndex = 1; this.updateMenuKeyboardSelection(); });
  }

  const startGameBtn = document.getElementById('start-game-btn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => this.startGame());
    startGameBtn.addEventListener('mouseenter', () => { this.menuSelectedIndex = 2; this.updateMenuKeyboardSelection(); });
  }

  const tutYesBtn = document.getElementById('tutorial-yes-btn');
  if (tutYesBtn) {
    tutYesBtn.addEventListener('click', () => this.acceptTutorial(true));
    tutYesBtn.addEventListener('mouseenter', () => { this.tutorialSelectedIndex = 0; this.updateTutorialKeyboardSelection(); });
  }

  const tutNoBtn = document.getElementById('tutorial-no-btn');
  if (tutNoBtn) {
    tutNoBtn.addEventListener('click', () => this.acceptTutorial(false));
    tutNoBtn.addEventListener('mouseenter', () => { this.tutorialSelectedIndex = 1; this.updateTutorialKeyboardSelection(); });
  }

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
  const endToMenu = document.getElementById('end-to-menu-btn');
  if (endToMenu) {
    endToMenu.addEventListener('click', () => location.reload());
  }
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
      this.usedDebugCheat = true;
      this.player.isInvincible = !this.player.isInvincible;
      dbgInvinc.textContent = '무적: ' + (this.player.isInvincible ? 'ON' : 'OFF');
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgSpeed = document.getElementById('dbg-speed');
  if (dbgSpeed) {
    dbgSpeed.addEventListener('click', () => {
      this.usedDebugCheat = true;
      this.timeScale = this.timeScale === 1 ? 5 : this.timeScale === 5 ? 10 : 1;
      dbgSpeed.textContent = '배속: ' + this.timeScale + 'x';
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgLvlup = document.getElementById('dbg-lvlup');
  if (dbgLvlup) {
    dbgLvlup.addEventListener('click', () => {
      if (!this.player) return;
      this.usedDebugCheat = true;
      this.player.gainXp(this.player.maxXp - this.player.xp, this);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgEvolve = document.getElementById('dbg-evolve');
  if (dbgEvolve) {
    dbgEvolve.addEventListener('click', () => {
      if (!this.player) return;
      this.usedDebugCheat = true;
      this.player.evolutionIndex = Math.min(this.player.evolutionIndex + 1, 5);
      this.addDamageText(this.player.x, this.player.y - 80, '즉시 전직!', '#ffd200', 20);
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  const dbgBoss = document.getElementById('dbg-boss');
  if (dbgBoss) {
    dbgBoss.addEventListener('click', () => {
      if (!this.player) return;
      this.usedDebugCheat = true;
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
      this.usedDebugCheat = true;
      if (this.currentBoss) {
        if (this.stageIndex === 5 && !this.currentBoss.dragonActive) {
          this.currentBoss.hp = this.currentBoss.maxHp * 0.5;
        } else {
          this.currentBoss.hp = 0;
        }
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
