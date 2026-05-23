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
  playExplosion() { this._play('sawtooth', 100, 20, 0.3, 0.4); }
  playFreeze() { this._play('sine', 600, 2000, 0.1, 0.3); }
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
