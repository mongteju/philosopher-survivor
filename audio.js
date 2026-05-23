// ─── AUDIO ENGINE ────────────────────────────────────────────────────
export class PhilosophyAudio {
  constructor() { this.ctx = null; }
  init() { if (this.ctx) return; this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  isSfxMuted() { return window.gameInstance && window.gameInstance.sfxMuted; }
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
  playTick() { this._play('sine', 800, null, 0.05, 0.05); }
  playHit() { this._play('triangle', 150, 40, 0.15, 0.1); }
  playExplosion() {
    // Layer 1: Bass combustion rumble (Triangle, deep low slide)
    this._play('triangle', 130, 20, 0.35, 0.5);
    // Layer 2: Mid crackling combustion (Sawtooth, punchy slide)
    this._play('sawtooth', 180, 40, 0.22, 0.3);
    // Layer 3: High fire pop (Sine, fast heat sweep)
    this._play('sine', 350, 80, 0.15, 0.15);
  }
  playFreeze() {
    // Layer 1: Sparkling high glass chime 1 (Sine glide)
    this._play('sine', 880, 1500, 0.1, 0.25);
    // Layer 2: Sparkling high glass chime 2 (Delayed sine glide)
    this._play('sine', 1200, 2200, 0.08, 0.3, 0.02);
    // Layer 3: Frost crystal crackle 3 (Delayed high triangle glide)
    this._play('triangle', 1500, 3000, 0.05, 0.35, 0.04);
    // Layer 4: Low freeze presence (Sine slide)
    this._play('sine', 300, 900, 0.12, 0.25);
  }
  playAlert() { this._play('sawtooth', 220, null, 0.2, 0.85); }
  playLevelUp() {
    this.init(); if (!this.ctx) return;
    [[261.63,0],[329.63,0.1],[392,0.2],[523.25,0.3]].forEach(([f,d]) => this._play('sine',f,null,0.15,0.5,d));
  }
  playEvolve() {
    this.init(); if (!this.ctx) return;
    this._play('triangle', 200, 1200, 0.2, 0.6);
    [880,1320,1760].forEach((f,i) => this._play('sine',f,null,0.15,0.5,0.4+i*0.1));
  }
  playExamBell() { this._play('sine', 180, null, 0.4, 2.0); }
}

export const sfx = new PhilosophyAudio();
