// Звуки синтезируются через Web Audio API, файлы не нужны.
// AudioContext создаётся лениво по первому жесту пользователя: браузеры блокируют автозапуск.

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Вызывать из обработчика пользовательского ввода. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) this.ctx = new Ctx();
  }

  setMuted(muted) {
    this.muted = muted;
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Проигрывает один тон.
   * @param {object} opts
   * @param {OscillatorType} opts.type
   * @param {number} opts.from - начальная частота, Гц
   * @param {number} opts.to - конечная частота, Гц
   * @param {number} opts.duration - длительность, с
   * @param {number} opts.volume - громкость от 0 до 1
   * @param {number} [opts.delay] - задержка старта, с
   */
  tone({ type, from, to, duration, volume, delay = 0 }) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), start + duration);

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  playJump() {
    this.tone({ type: 'square', from: 320, to: 640, duration: 0.12, volume: 0.08 });
  }

  playHit() {
    this.tone({ type: 'sawtooth', from: 220, to: 40, duration: 0.35, volume: 0.15 });
  }

  playLevelUp() {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      this.tone({ type: 'triangle', from: freq, to: freq, duration: 0.15, volume: 0.1, delay: i * 0.1 });
    });
  }
}

export { AudioManager };
