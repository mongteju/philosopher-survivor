import { sfx } from '../audio.js';
import { TIMELINE, EVOLUTION_STAGES } from '../db.js';


export function updatePauseKeyboardSelection(btns) {
  btns.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('keyboard-selected', i === this.pauseSelectedIndex);
  });
}

export function updateMenuKeyboardSelection() {
  document.getElementById('card-idealism').classList.toggle('keyboard-selected', this.menuSelectedIndex === 0);
  document.getElementById('card-empiricism').classList.toggle('keyboard-selected', this.menuSelectedIndex === 1);
  
  const cardConfucianism = document.getElementById('card-confucianism');
  if (cardConfucianism) cardConfucianism.classList.toggle('keyboard-selected', this.menuSelectedIndex === 2);
  
  const cardTaoism = document.getElementById('card-taoism');
  if (cardTaoism) cardTaoism.classList.toggle('keyboard-selected', this.menuSelectedIndex === 3);
  
  const cardBuddhism = document.getElementById('card-buddhism');
  if (cardBuddhism) cardBuddhism.classList.toggle('keyboard-selected', this.menuSelectedIndex === 4);
  
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.classList.toggle('keyboard-selected', this.menuSelectedIndex === 5);
  }
  
  const menuRankingBtn = document.getElementById('menu-ranking-btn');
  if (menuRankingBtn) {
    menuRankingBtn.classList.toggle('keyboard-selected', this.menuSelectedIndex === 6);
  }
}

// Detect touch device and update UI accordingly
function applyMobileUI() {
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  
  // Title screen text
  const titleText = document.getElementById('title-start-text');
  if (titleText) {
    titleText.textContent = isTouchDevice ? '화면을 터치하여 시작' : '스페이스 눌러 시작';
  }
  
  // Menu screen hints
  const menuKeyHint = document.getElementById('menu-keyboard-hint');
  const menuTouchHint = document.getElementById('menu-touch-hint');
  if (menuKeyHint) menuKeyHint.style.display = isTouchDevice ? 'none' : 'block';
  if (menuTouchHint) menuTouchHint.style.display = isTouchDevice ? 'block' : 'none';
  
  // Tutorial hints
  const tutKeyHint = document.getElementById('tutorial-keyboard-hint');
  const tutTouchHint = document.getElementById('tutorial-touch-hint');
  if (tutKeyHint) tutKeyHint.style.display = isTouchDevice ? 'none' : 'block';
  if (tutTouchHint) tutTouchHint.style.display = isTouchDevice ? 'block' : 'none';
  
  // Levelup hints
  const lvlKeyHint = document.getElementById('levelup-keyboard-hint');
  const lvlTouchHint = document.getElementById('levelup-touch-hint');
  if (lvlKeyHint) lvlKeyHint.style.display = isTouchDevice ? 'none' : 'block';
  if (lvlTouchHint) lvlTouchHint.style.display = isTouchDevice ? 'block' : 'none';
  
  // ESC pause instruction - hide on mobile
  const escHint = document.querySelector('#hud [style*="font-size: 10px"]');
  if (escHint && isTouchDevice) escHint.style.display = 'none';

  return isTouchDevice;
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
  let debugInputBuffer = '';

  window.addEventListener('keydown', e => {
    // If user is focused on an input element, do not capture key events for game navigation
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

    let keyStr = (e.key || '').toLowerCase();
    let codeStr = (e.code || '').toLowerCase();

    // Check for secret debug panel passcode: "philosopher"
    if (e.key && e.key.length === 1) {
      debugInputBuffer += e.key.toLowerCase();
      if (debugInputBuffer.length > 20) {
        debugInputBuffer = debugInputBuffer.slice(-20);
      }
      if (debugInputBuffer.endsWith('philosopher')) {
        const dbg = document.getElementById('debug-panel');
        if (dbg) {
          const isHidden = dbg.style.display === 'none';
          dbg.style.display = isHidden ? 'block' : 'none';
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
          console.log("[Secret] Debug panel toggled via secret command!");

          // Refresh the ranking board rendering to show/hide individual delete buttons
          if (typeof window.renderRankingsGlobal === 'function') {
            window.renderRankingsGlobal();
          }
        }
        debugInputBuffer = '';
        return;
      }
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

    // ESC: close ranking/registration if active, otherwise pause
    if (e.key === 'Escape') {
      e.preventDefault();
      const rankingScreen = document.getElementById('ranking-screen');
      if (rankingScreen && rankingScreen.classList.contains('active')) {
        document.getElementById('ranking-close-btn').click();
        return;
      }
      const rankRegisterModal = document.getElementById('rank-register-modal');
      if (rankRegisterModal && rankRegisterModal.classList.contains('active')) {
        document.getElementById('rank-cancel-btn').click();
        return;
      }
      if (this.isPlaying || this.isPaused) this.togglePause();
      return;
    }

    // Pause screen navigation
    if (this.isPaused) {
      const pauseBtns = ['pause-resume-btn', 'pause-restart-btn', 'pause-bgm-btn', 'pause-sfx-btn', 'pause-status-toggle-btn', 'pause-ranking-btn'];
      if (k === 'arrowup' || k === 'w') { e.preventDefault(); this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + pauseBtns.length) % pauseBtns.length; this.updatePauseKeyboardSelection(pauseBtns); sfx.playTick(); }
      else if (k === 'arrowdown' || k === 's') { e.preventDefault(); this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % pauseBtns.length; this.updatePauseKeyboardSelection(pauseBtns); sfx.playTick(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const btn = document.getElementById(pauseBtns[this.pauseSelectedIndex]); if (btn) btn.click(); }
      return;
    }

    // Menu screen (Flattened single-column list navigation)
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen.classList.contains('active')) {
      const lineages = ['idealism', 'empiricism', 'confucianism', 'taoism', 'buddhism'];
      
      // Up / Left: Move Up in the list
      if (k === 'arrowup' || k === 'w' || k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        if (this.menuSelectedIndex > 0) {
          this.menuSelectedIndex--;
          if (this.menuSelectedIndex !== 5 && this.menuSelectedIndex !== 6) {
            this.selectLineage(lineages[this.menuSelectedIndex]);
          }
          this.updateMenuKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        }
      }
      // Down / Right: Move Down in the list
      else if (k === 'arrowdown' || k === 's' || k === 'arrowright' || k === 'd') {
        e.preventDefault();
        if (this.menuSelectedIndex < 6) {
          this.menuSelectedIndex++;
          if (this.menuSelectedIndex !== 5 && this.menuSelectedIndex !== 6) {
            this.selectLineage(lineages[this.menuSelectedIndex]);
          }
          this.updateMenuKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
        }
      }
      // Enter / Space: Select / Start Game / Open Rankings
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.menuSelectedIndex === 5) {
          if (this.player && this.player.lineage) {
            this.startGame();
          }
        } else if (this.menuSelectedIndex === 6) {
          const rankBtn = document.getElementById('menu-ranking-btn');
          if (rankBtn) rankBtn.click();
        } else {
          this.selectLineage(lineages[this.menuSelectedIndex]);
          this.menuSelectedIndex = 5;
          this.updateMenuKeyboardSelection();
          if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
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
    // If user is focused on an input element, do not capture key events for game navigation
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

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

  // ── Mobile UI detection ──────────────────────────────────────────────
  const isTouchDevice = applyMobileUI();

  // Bind UI buttons
  const titleScr = document.getElementById('title-screen');
  if (titleScr) {
    titleScr.addEventListener('click', () => {
      enterFullscreen();
      this.showMenuScreen();
    });
    titleScr.addEventListener('touchstart', (e) => {
      e.preventDefault();
      enterFullscreen();
      this.showMenuScreen();
    }, { passive: false });
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
    const selectIdealism = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.menuSelectedIndex = 0; 
      this.selectLineage('idealism'); 
      this.updateMenuKeyboardSelection();
      // On touch: auto-highlight start button after selection
      if (isTouchDevice) this._flashStartButton();
    };
    cardIdealism.addEventListener('click', selectIdealism);
    cardIdealism.addEventListener('touchstart', selectIdealism, { passive: false });
    cardIdealism.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.menuSelectedIndex = 0; 
        this.updateMenuKeyboardSelection();
      }
    });
  }

  const cardEmpiricism = document.getElementById('card-empiricism');
  if (cardEmpiricism) {
    const selectEmpiricism = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.menuSelectedIndex = 1; 
      this.selectLineage('empiricism'); 
      this.updateMenuKeyboardSelection();
      if (isTouchDevice) this._flashStartButton();
    };
    cardEmpiricism.addEventListener('click', selectEmpiricism);
    cardEmpiricism.addEventListener('touchstart', selectEmpiricism, { passive: false });
    cardEmpiricism.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.menuSelectedIndex = 1; 
        this.updateMenuKeyboardSelection();
      }
    });
  }

  const cardConfucianism = document.getElementById('card-confucianism');
  if (cardConfucianism) {
    const selectConfucianism = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.menuSelectedIndex = 2; 
      this.selectLineage('confucianism'); 
      this.updateMenuKeyboardSelection();
      if (isTouchDevice) this._flashStartButton();
    };
    cardConfucianism.addEventListener('click', selectConfucianism);
    cardConfucianism.addEventListener('touchstart', selectConfucianism, { passive: false });
    cardConfucianism.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.menuSelectedIndex = 2; 
        this.updateMenuKeyboardSelection();
      }
    });
  }

  const cardTaoism = document.getElementById('card-taoism');
  if (cardTaoism) {
    const selectTaoism = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.menuSelectedIndex = 3; 
      this.selectLineage('taoism'); 
      this.updateMenuKeyboardSelection();
      if (isTouchDevice) this._flashStartButton();
    };
    cardTaoism.addEventListener('click', selectTaoism);
    cardTaoism.addEventListener('touchstart', selectTaoism, { passive: false });
    cardTaoism.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.menuSelectedIndex = 3; 
        this.updateMenuKeyboardSelection();
      }
    });
  }

  const cardBuddhism = document.getElementById('card-buddhism');
  if (cardBuddhism) {
    const selectBuddhism = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.menuSelectedIndex = 4; 
      this.selectLineage('buddhism'); 
      this.updateMenuKeyboardSelection();
      if (isTouchDevice) this._flashStartButton();
    };
    cardBuddhism.addEventListener('click', selectBuddhism);
    cardBuddhism.addEventListener('touchstart', selectBuddhism, { passive: false });
    cardBuddhism.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.menuSelectedIndex = 4; 
        this.updateMenuKeyboardSelection();
      }
    });
  }

  // ── Helper: flash start button on mobile after lineage selection ─────
  this._flashStartButton = () => {
    const startBtn = document.getElementById('start-game-btn');
    if (!startBtn) return;
    // Scroll start button into view and pulse-animate it
    startBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    startBtn.classList.remove('mobile-pulse');
    void startBtn.offsetWidth; // force reflow
    startBtn.classList.add('mobile-pulse');
  };

  const startGameBtn = document.getElementById('start-game-btn');
  if (startGameBtn) {
    const handleStartGame = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.startGame();
    };
    startGameBtn.addEventListener('click', handleStartGame);
    startGameBtn.addEventListener('touchstart', handleStartGame, { passive: false });
    startGameBtn.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.menuSelectedIndex = 5; 
        this.updateMenuKeyboardSelection();
      }
    });
  }

  const tutYesBtn = document.getElementById('tutorial-yes-btn');
  if (tutYesBtn) {
    const handleYes = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.acceptTutorial(true);
    };
    tutYesBtn.addEventListener('click', handleYes);
    tutYesBtn.addEventListener('touchstart', handleYes, { passive: false });
    tutYesBtn.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.tutorialSelectedIndex = 0; 
        this.updateTutorialKeyboardSelection();
      }
    });
  }

  const tutNoBtn = document.getElementById('tutorial-no-btn');
  if (tutNoBtn) {
    const handleNo = (e) => {
      if (e && e.type === 'touchstart') e.preventDefault();
      this.acceptTutorial(false);
    };
    tutNoBtn.addEventListener('click', handleNo);
    tutNoBtn.addEventListener('touchstart', handleNo, { passive: false });
    tutNoBtn.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        this.tutorialSelectedIndex = 1; 
        this.updateTutorialKeyboardSelection();
      }
    });
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
  document.getElementById('gameover-retry-btn').addEventListener('click', () => this.retryCurrentStageOrBoss());
  const goRestart = document.getElementById('gameover-restart-btn');
  if (goRestart) {
    goRestart.addEventListener('click', () => location.reload());
  }

  // Mobile pause button binding (only shown on touch devices during gameplay)
  const mobilePauseBtn = document.getElementById('mobile-pause-btn');
  if (mobilePauseBtn && isTouchDevice) {
    mobilePauseBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.isPlaying || this.isPaused) this.togglePause();
    }, { passive: false });
    mobilePauseBtn.addEventListener('click', () => {
      if (this.isPlaying || this.isPaused) this.togglePause();
    });
    // Show this button when game starts (hook into acceptTutorial flow)
    const origAcceptTutorial = this.acceptTutorial.bind(this);
    this._showMobilePauseOnStart = () => {
      mobilePauseBtn.style.display = 'flex';
    };
  }

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

      const stageSelect = document.getElementById('dbg-boss-stage');
      const idx = stageSelect ? parseInt(stageSelect.value) : 1;

      if (!isNaN(idx) && idx >= 1 && idx <= 6) {
        this.stageIndex = idx - 1;
        this.stage = TIMELINE[this.stageIndex];
        this.eraSurvivalTime = 60;

        this.enemies = [];
        this.bossBullets = [];
        this.warningZones = [];
        this.gridLines = [];
        this.candlesticks = [];
        this.nietzcheRelics = [];
        this.activeIdols.clear();
        this.medievalDarkness = false;
        this.kantRule = null;
        this.kantDutyLine = null;
        this.ataraxiaZone = null;
        this.nietzscheArenaActive = false;
        this.nietzscheArenaCenter = null;
        this.nietzscheSafeZone = null;

        if (this.player) {
          this.player.evolutionIndex = Math.min(this.stageIndex, EVOLUTION_STAGES[this.player.lineage].length - 1);
          this.addDamageText(this.player.x, this.player.y - 80,
            `✨ ${EVOLUTION_STAGES[this.player.lineage][this.player.evolutionIndex].title} 전직!`, '#ffd200', 22);
        }

        this.currentBoss = null;
        this.spawnBossImmediate();
        this.restoreHUD();
        console.log(`[Debug] Spawned boss for stage ${idx}.`);
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
    // Ignore taps on UI overlay buttons (pause btn etc.)
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.overlay-screen.active'))) return;
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
