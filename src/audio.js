export class ArcadeAudio {
  constructor() { this.enabled = true; this.playing = false; this.context = null; this.musicTime = 0; this.beat = 0; this.lastSpeech = 0; }
  unlock() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    if (!this.context) {
      this.context = new Context(); this.master = this.context.createGain(); this.master.gain.value = .28; this.master.connect(this.context.destination);
    }
    this.context.resume().catch(() => {});
  }
  toggle() { this.enabled = !this.enabled; if (this.master) this.master.gain.setTargetAtTime(this.enabled ? .28 : 0, this.context.currentTime, .03); if (!this.enabled) window.speechSynthesis?.cancel(); return this.enabled; }
  tone(frequency, duration, type = 'square', volume = .2, endFrequency = frequency) {
    if (!this.context || !this.enabled || this.context.state !== 'running') return;
    const ctx = this.context, t = ctx.currentTime, osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, t); osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), t + duration);
    amp.gain.setValueAtTime(.001, t); amp.gain.linearRampToValueAtTime(volume, t + .008); amp.gain.exponentialRampToValueAtTime(.001, t + duration);
    osc.connect(amp); amp.connect(this.master); osc.start(t); osc.stop(t + duration + .02); osc.onended = () => { osc.disconnect(); amp.disconnect(); };
  }
  noise(duration = .13, volume = .2) {
    if (!this.context || !this.enabled || this.context.state !== 'running') return;
    const ctx = this.context, length = Math.ceil(ctx.sampleRate * duration), buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0); for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    const source = ctx.createBufferSource(), amp = ctx.createGain(); source.buffer = buffer; amp.gain.value = volume; source.connect(amp); amp.connect(this.master); source.start(); source.onended = () => { source.disconnect(); amp.disconnect(); };
  }
  tick(dt) {
    if (!this.playing || !this.enabled || !this.context) return;
    this.musicTime += dt; if (this.musicTime < .165) return; this.musicTime -= .165;
    const notes = [110, 110, 164.81, 110, 130.81, 130.81, 196, 130.81, 98, 98, 146.83, 98, 82.41, 123.47, 164.81, 123.47];
    this.tone(notes[this.beat % notes.length], .13, 'triangle', .15);
    if (this.beat % 4 === 0) this.tone(105, .12, 'sine', .25, 38);
    if (this.beat % 4 === 2) this.noise(.09, .06);
    if (this.beat % 2 === 1) this.noise(.022, .025);
    if (this.beat % 8 === 3 || this.beat % 8 === 6) this.tone(notes[this.beat % 16] * 4, .11, 'square', .035);
    this.beat++;
  }
  say(phrase, slot = 0) {
    if (!this.enabled || !window.speechSynthesis || Date.now() - this.lastSpeech < 1200) return;
    this.lastSpeech = Date.now(); speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase); utterance.lang = 'pt-BR'; utterance.rate = slot === 0 ? 1.14 : .97; utterance.pitch = slot === 0 ? .85 : .98; utterance.volume = .75;
    const voices = speechSynthesis.getVoices(); utterance.voice = voices.find(v => v.lang.toLowerCase() === 'pt-br') || voices.find(v => v.lang.toLowerCase().startsWith('pt')) || null;
    speechSynthesis.speak(utterance);
  }
  event(e, engine) {
    switch (e.type) {
      case 'swing': this.noise(.085, .07); break;
      case 'jump': this.tone(120, .09, 'triangle', .12, 300); break;
      case 'block': this.tone(800, .07, 'square', .16, 280); this.noise(.05, .08); break;
      case 'hit': this.noise(e.move === 'special' ? .23 : .12, .38); this.tone(155, .13, 'sine', .45, 40); break;
      case 'special': this.tone(150, .32, 'sawtooth', .13, 850); this.say(e.quote, e.fighter); break;
      case 'round': this.musicTime = 0; this.beat = 0; this.tone(440, .14, 'square', .12); break;
      case 'fight': this.tone(660, .22, 'square', .19, 880); break;
      case 'roundEnd': this.tone(220, .45, 'triangle', .35, 55); if (e.winner !== null) this.say(e.quote, e.winner); break;
      case 'result': this.tone(523.25, .4, 'triangle', .2, 1046.5); break;
      case 'pause': if (e.paused) window.speechSynthesis?.cancel(); break;
    }
  }
}
