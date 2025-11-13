const AudioCtx = window.AudioContext || window.webkitAudioContext;

export default class AudioSystem {
  constructor(scene) {
    this.scene = scene;
    this.ctx = AudioSystem.ctx || (AudioCtx ? new AudioCtx() : null);
    AudioSystem.ctx = this.ctx;
  }

  async ensureUnlocked() {
    if (!this.ctx || this.ctx.state === 'running') return;
    try { await this.ctx.resume(); } catch (err) { /* ignore resume errors */ }
  }

  playTone({ frequency = 440, duration = 0.12, type = 'square', volume = 0.2 }) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  async playHit() {
    await this.ensureUnlocked();
    this.playTone({ frequency: 180, duration: 0.24, type: 'sawtooth', volume: 0.25 });
  }

  async playScore() {
    await this.ensureUnlocked();
    this.playTone({ frequency: 920, duration: 0.1, type: 'triangle', volume: 0.18 });
  }

  async playJump() {
    await this.ensureUnlocked();
    this.playTone({ frequency: 620, duration: 0.08, type: 'square', volume: 0.22 });
  }

  async playButton() {
    await this.ensureUnlocked();
    this.playTone({ frequency: 500, duration: 0.12, type: 'triangle', volume: 0.18 });
  }

  startBgm() {}
  stopBgm() {}
}
