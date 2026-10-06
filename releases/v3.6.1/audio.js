export const SOUNDS = Object.freeze({
  'ruan-select':'assets/audio/ruan-select-br-v1.wav','ruan-special':'assets/audio/ruan-special-br-v1.wav','ruan-uppercut':'assets/audio/ruan-uppercut-br-v1.wav','ruan-super':'assets/audio/ruan-super-br-v1.wav',
  'marcelo-select': 'assets/audio/marcelo-select-br-v1.wav',
  'rafael-select': 'assets/audio/rafael-select-br-v1.wav',
  'gustavo-select': 'assets/audio/gustavo-select-br-v1.wav',
  'gelton-select': 'assets/audio/gelton-select-br-v1.wav',
  'marcelino-select': 'assets/audio/marcelino-select-br-v1.wav',
  'marcos-select': 'assets/audio/marcos-select-br-v1.wav',
  'joao-select': 'assets/audio/joao-select-br-v1.wav',

  'marcelo-special': 'assets/audio/marcelo-special.wav', 'marcelo-uppercut': 'assets/audio/marcelo-uppercut.wav', 'marcelo-super': 'assets/audio/marcelo-enxame-v2.wav',
  'marcelo-drone': 'assets/audio/marcelo-sentinela-v1.wav',
  'rafael-special': 'assets/audio/rafael-special.wav', 'rafael-uppercut': 'assets/audio/rafael-uppercut.wav', 'rafael-super': 'assets/audio/rafael-super.wav',
  'gustavo-special': 'assets/audio/gustavo-fumaca-v1.wav', 'gustavo-uppercut': 'assets/audio/gustavo-uppercut.wav', 'gustavo-super': 'assets/audio/gustavo-super.wav',
  'gelton-special':'assets/audio/gelton-special-br-v4.wav','gelton-uppercut':'assets/audio/gelton-uppercut-br-v4.wav','gelton-super':'assets/audio/gelton-super-br-v4.wav',
  'marcelino-special':'assets/audio/marcelino-special-br-v1.wav','marcelino-uppercut':'assets/audio/marcelino-uppercut-br-v1.wav','marcelino-super':'assets/audio/marcelino-super-br-v1.wav',
  'joao-special':'assets/audio/joao-special-br-v1.wav','joao-uppercut':'assets/audio/joao-uppercut-br-v1.wav','joao-super':'assets/audio/joao-super-br-v1.wav',
  'marcos-special':'assets/audio/marcos-special-fluid-br-v1.wav','marcos-uppercut':'assets/audio/marcos-uppercut-fluid-br-v1.wav','marcos-super':'assets/audio/marcos-super-fluid-br-v1.wav',
  grunt1: 'assets/audio/grunt-1.wav', grunt2: 'assets/audio/grunt-2.wav', grunt3: 'assets/audio/grunt-3.wav',
  light: 'assets/audio/hit-light.wav', heavy: 'assets/audio/hit-heavy.wav', special: 'assets/audio/hit-special.wav', ko: 'assets/audio/ko.wav',
});

export class ArcadeAudio {
  constructor() {
    this.enabled = true; this.playing = false; this.context = null; this.musicTime = 0; this.beat = 0;
    this.bytes = new Map(); this.buffers = new Map(); this.sources = new Set(); this.voices = new Map();
    this.quoteMoves = new Map();
    this.loadPromise = null; this.decodePromise = null;
  }
  load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = Promise.allSettled(Object.entries(SOUNDS).map(async ([id, path]) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Áudio ${path}: HTTP ${response.status}`);
      this.bytes.set(id, await response.arrayBuffer());
    })).then(results => {
      for (const result of results) if (result.status === 'rejected') console.warn('Não foi possível carregar um som de combate.', result.reason);
      return results.every(result => result.status === 'fulfilled');
    });
    return this.loadPromise;
  }
  loadFighters(ids) {
    this.clipLoads??=new Map();
    const paths=Object.entries(SOUNDS).filter(([key])=>!key.includes('-')||ids.some(id=>key.startsWith(`${id}-`)));
    return Promise.all(paths.map(([key,path])=>{
      if(!this.clipLoads.has(key)) {
        const task=(async()=>{
          if(!this.bytes.has(key)){const response=await fetch(path);if(!response.ok)throw new Error(`Áudio ${path}: HTTP ${response.status}`);this.bytes.set(key,await response.arrayBuffer());}
          if(this.context&&!this.buffers.has(key))this.buffers.set(key,await this.context.decodeAudioData(this.bytes.get(key).slice(0)));
        })();
        this.clipLoads.set(key,task);task.catch(()=>this.clipLoads.delete(key));
      }
      return this.clipLoads.get(key);
    }));
  }
  async confirmSelection(id) {
    const token=this.selectionToken=(this.selectionToken??0)+1;
    this.unlock();
    const previous=this.voices.get('selection');if(previous){try{previous.stop();}catch{}}
    if(!this.enabled||!this.context)return;
    const key=`${id}-select`,path=SOUNDS[key];if(!path)return;
    if(!this.bytes.has(key)){const response=await fetch(path);if(!response.ok)throw new Error('Fala de seleção indisponível');this.bytes.set(key,await response.arrayBuffer());}
    if(!this.buffers.has(key))this.buffers.set(key,await this.context.decodeAudioData(this.bytes.get(key).slice(0)));
    if(token===this.selectionToken)this.sample(key,1.45,'selection');
  }
  async decodeAvailable() {
    if(!this.context)return;
    await Promise.allSettled([...this.bytes].filter(([key])=>!this.buffers.has(key)).map(async([key,bytes])=>{
      this.buffers.set(key,await this.context.decodeAudioData(bytes.slice(0)));
    }));
  }
  decode() {
    if (!this.context) return Promise.resolve(false);
    if (this.decodePromise) return this.decodePromise;
    this.decodePromise = this.load().then(async () => {
      const results = await Promise.allSettled([...this.bytes].map(async ([id, bytes]) => {
        this.buffers.set(id, await this.context.decodeAudioData(bytes.slice(0)));
      }));
      for (const result of results) if (result.status === 'rejected') console.warn('Não foi possível preparar um som de combate.', result.reason);
      const ready = results.every(result => result.status === 'fulfilled') && this.buffers.size === Object.keys(SOUNDS).length;
      if (ready) console.info('Sons de combate prontos.');
      return ready;
    });
    return this.decodePromise;
  }
  unlock() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    if (!this.context) {
      this.context = new Context(); this.master = this.context.createGain(); this.master.gain.value = this.enabled ? .42 : 0;
      const limiter = this.context.createDynamicsCompressor(); limiter.threshold.value = -8; limiter.knee.value = 12; limiter.ratio.value = 6;
      this.master.connect(limiter); limiter.connect(this.context.destination);
    }
    this.context.resume().catch(() => {}); this.loadPromise?this.decode():this.decodeAvailable();
  }
  stopSamples() {
    this.selectionToken=(this.selectionToken??0)+1;
    for (const source of this.sources) { try { source.stop(); } catch {} }
    this.sources.clear(); this.voices.clear(); this.quoteMoves.clear();
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.setTargetAtTime(this.enabled ? .42 : 0, this.context.currentTime, .02);
    if (!this.enabled) this.stopSamples();
    return this.enabled;
  }
  sample(id, volume = 1, voice = null) {
    const buffer = this.buffers.get(id);
    if (!buffer || !this.context || !this.enabled || this.context.state !== 'running') return false;
    if (voice !== null) {
      const previous = this.voices.get(voice); if (previous) { try { previous.stop(); } catch {} }
    }
    const ctx = this.context, source = ctx.createBufferSource(), amp = ctx.createGain();
    source.buffer = buffer; amp.gain.value = volume; source.connect(amp); amp.connect(this.master);
    this.sources.add(source); if (voice !== null) this.voices.set(voice, source);
    source.onended = () => { source.disconnect(); amp.disconnect(); this.sources.delete(source); if (this.voices.get(voice) === source) this.voices.delete(voice); };
    source.start(); return true;
  }
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
    this.tone(notes[this.beat % notes.length], .13, 'triangle', .10);
    if (this.beat % 4 === 0) this.tone(105, .12, 'sine', .16, 38);
    if (this.beat % 4 === 2) this.noise(.09, .04);
    if (this.beat % 2 === 1) this.noise(.022, .02);
    if (this.beat % 8 === 3 || this.beat % 8 === 6) this.tone(notes[this.beat % 16] * 4, .11, 'square', .025);
    this.beat++;
  }
  event(e, engine) {
    switch (e.type) {
      case 'swing': {
        const id = engine.fighters[e.fighter].character.id;
        this.sample(['kick', 'sweep', 'airKick'].includes(e.move) ? 'grunt3' : id === 'marcelo' ? 'grunt1' : 'grunt2', .7, e.fighter);
        this.noise(.05, .04); break;
      }
      case 'jump': this.sample(e.fighter === 0 ? 'grunt1' : 'grunt2', .5, e.fighter); break;
      case 'land': this.noise(.04, .035); break;
      case 'clash': this.sample('special', .4); break;
      case 'droneDeploy': this.tone(320, .12, 'triangle', .08, 640); break;
      case 'droneFire': this.tone(1250, .09, 'sawtooth', .09, 420); break;
      case 'droneDestroyed': this.noise(.08, .09); break;
      case 'block': if (!this.sample('light', .35)) this.noise(.05, .08); break;
      case 'hit':
        if (!this.sample(['special', 'uppercut', 'super'].includes(e.move) ? 'special' : e.strength === 2 || ['kick', 'sweep', 'airKick', 'throw'].includes(e.move) ? 'heavy' : 'light', .8)) this.noise(.12, .3);
        if(e.strength===2||e.region==='body')this.tone(85,.09,'sine',.14,32);
        if (engine.fighters[e.target].hp > 0) this.sample('grunt3', .55, e.target);
        break;
      case 'special': {
        const channel = `quote:${e.fighter}`;
        const clip = `${engine.fighters[e.fighter].character.id}-${e.move}`;
        if (!this.voices.has(channel) || this.quoteMoves.get(channel) !== clip) {
          if (this.sample(clip, 1.45, channel)) this.quoteMoves.set(channel, clip);
        }
        break;
      }
      case 'round': this.stopSamples(); this.musicTime = 0; this.beat = 0; this.tone(440, .14, 'square', .12); break;
      case 'fight': this.tone(660, .22, 'square', .19, 880); break;
      case 'customStart': this.tone(260,.25,'triangle',.15,780); break;
      case 'guardCounter': this.tone(780,.13,'triangle',.12,260); break;
      case 'roundEnd':
        if (e.winner !== null && !e.timeout) this.sample('ko', .65, 1 - e.winner);
        this.tone(220, .30, 'triangle', .12, 55); break;
      case 'result': this.tone(523.25, .4, 'triangle', .2, 1046.5); break;
      case 'pause': if (e.paused) this.stopSamples(); break;
    }
  }
}
