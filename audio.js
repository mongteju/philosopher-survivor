// ─── AUDIO ENGINE ────────────────────────────────────────────────────
export class PhilosophyAudio {
  constructor() {
    this.ctx = null;
    this.sounds = {
      button: new Audio('sound/button.mp3'),
      dragonRoar: new Audio('sound/dragon-roar.mp3'),
      ending: new Audio('sound/ending.mp3'),
      enemy: new Audio('sound/enemy.mp3'),
      fireball: new Audio('sound/fireball.mp3'),
      ice: new Audio('sound/ice.mp3'),
      levelUp: new Audio('sound/level-up.mp3'),
      keyboard: new Audio('sound/keyboard.mp3')
    };
  }
  init() { if (this.ctx) return; this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  isSfxMuted() { return window.gameInstance && window.gameInstance.sfxMuted; }
  
  playFile(key, volume = 0.5) {
    if (this.isSfxMuted()) return;
    const sound = this.sounds[key];
    if (!sound) return;
    try {
      if (key === 'keyboard') {
        sound.volume = volume;
        sound.currentTime = 0;
        sound.play().catch(err => console.warn(`Failed to play sfx ${key}:`, err));
      } else {
        const clone = sound.cloneNode();
        clone.volume = volume;
        clone.play().catch(err => console.warn(`Failed to play sfx ${key}:`, err));
      }
    } catch (e) {
      console.warn(e);
    }
  }

  _play(type, freq, endFreq, gain, dur, delay=0) {
    if (this.isSfxMuted()) return; this.init(); if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);
    osc.type = type; const t = this.ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur);
  }
  playTick() { this.playFile('button', 0.4); }
  playHit() { this._play('triangle', 150, 40, 0.15, 0.1); }
  playExplosion() {
    // Layer 1: Bass combustion rumble (Triangle, deep low slide)
    this._play('triangle', 130, 20, 0.35, 0.5);
    // Layer 2: Mid crackling combustion (Sawtooth, punchy slide)
    this._play('sawtooth', 180, 40, 0.22, 0.3);
    // Layer 3: High fire pop (Sine, fast heat sweep)
    this._play('sine', 350, 80, 0.15, 0.15);
  }
  playFireShoot() {
    this.playFile('fireball', 0.2);
  }
  playFreeze() {
    this.playFile('ice', 0.2);
  }
  playEnemyShoot() {
    this.playFile('enemy', 0.2);
  }
  playAlert() { this._play('sawtooth', 220, null, 0.2, 0.85); }
  playLevelUp() {
    this.playFile('levelUp', 0.5);
  }
  playEvolve() {
    this.init(); if (!this.ctx) return;
    this._play('triangle', 200, 1200, 0.2, 0.6);
    [880,1320,1760].forEach((f,i) => this._play('sine',f,null,0.15,0.5,0.4+i*0.1));
  }
  playExamBell() { this._play('sine', 180, null, 0.4, 2.0); }
}

export const sfx = new PhilosophyAudio();
