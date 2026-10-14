import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ArcadeAudio, SOUNDS } from '../src/audio.js';
import {createHash} from 'node:crypto';

const fileBytes = path => readFile(new URL(`../${path}`, import.meta.url));
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime(value) { this.value = value; } });
class AudioContextStub {
  constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; this.started = []; }
  resume() { return Promise.resolve(); }
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
  createDynamicsCompressor() { return { threshold: param(), knee: param(), ratio: param(), connect() {} }; }
  createOscillator() {return {frequency:param(),connect(){},disconnect(){},start(){},stop(){this.onended?.();}};}
  decodeAudioData(bytes) {
    const data=Buffer.from(bytes);let rate=1,size=0;
    for(let at=12;at+8<=data.length;){const n=data.readUInt32LE(at+4),tag=data.toString('ascii',at,at+4);if(tag==='fmt ')rate=data.readUInt32LE(at+16);if(tag==='data')size=n;at+=8+n+(n%2);}
    return Promise.resolve({ bytes: bytes.byteLength,duration:size/rate });
  }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  createBufferSource() {
    const source = { connect() {}, disconnect() {}, stopped: false,
      start: at => {source.scheduledAt=at;this.started.push(source);}, stop() { this.stopped = true; this.onended?.(); } };
    return source;
  }
}
function prepare(t) {
  t.mock.method(globalThis, 'fetch', async path => new Response(await fileBytes(path)));
  const oldWindow = globalThis.window;
  globalThis.window = { AudioContext: AudioContextStub };
  t.after(() => { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; });
  return new ArcadeAudio();
}

test('todos os clipes locais são WAV PCM válidos, curtos e com amostras audíveis', async () => {
  for (const path of Object.values(SOUNDS)) {
    const bytes = await fileBytes(path); assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
    assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
    let format, data;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const id = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4);
      assert.ok(offset + 8 + length <= bytes.length);
      if (id === 'fmt ') format = bytes.subarray(offset + 8, offset + 8 + length);
      if (id === 'data') data = bytes.subarray(offset + 8, offset + 8 + length);
      offset += 8 + length + (length % 2);
    }
    assert.ok(format && data); assert.equal(format.readUInt16LE(0), 1);
    const channels = format.readUInt16LE(2), rate = format.readUInt32LE(4), bits = format.readUInt16LE(14);
    assert.ok(channels >= 1 && channels <= 2); assert.ok(rate >= 8000); assert.ok(bits === 8 || bits === 16);
    const duration = data.length / (rate * channels * bits / 8); assert.ok(duration >= .1 && duration < 7);
    let peak = 0;
    for (let i = 0; i < data.length; i += bits / 8) peak = Math.max(peak, bits === 8 ? Math.abs(data[i] - 128) / 128 : Math.abs(data.readInt16LE(i)) / 32768);
    assert.ok(peak > .03, `${path} não deve conter apenas silêncio`);
  }
});
test('pré-carregamento prepara todos os clipes do elenco e reutiliza as mesmas promessas', async t => {
  const audio = prepare(t), load = audio.load(); assert.equal(audio.load(), load); assert.equal(await load, true);
  audio.unlock(); assert.equal(await audio.decode(), true); assert.equal(audio.buffers.size, Object.keys(SOUNDS).length);
  assert.equal(audio.decode(), audio.decodePromise); assert.equal(globalThis.fetch.mock.callCount(), Object.keys(SOUNDS).length);
});
test('cada poder usa seu clipe e esforços não interrompem sua fala', async t => {
  const audio = prepare(t); await audio.load(); audio.unlock(); await audio.decode();
  for (const id of ['marcelo', 'rafael', 'gustavo', 'gelton', 'marcelino', 'marcos', 'joao']) for (const slot of [0, 1]) for (const move of id === 'marcelo' ? ['special', 'uppercut', 'super', 'drone'] : ['special', 'uppercut', 'super']) {
    const engine = { fighters: [{ character: { id }, hp: 1000 }, { character: { id }, hp: 1000 }] };
    audio.event({ type: 'special', fighter: slot, move }, engine);
    const channel = `quote:${slot}`, phrase = audio.voices.get(channel);
    assert.equal(phrase.buffer, audio.buffers.get(`${id}-${move}`));
    audio.event({ type: 'swing', fighter: slot, move: 'punch' }, engine);
    audio.event({ type: 'hit', fighter: 1-slot, target: slot, move: 'punch' }, engine);
    assert.equal(phrase.stopped, false); assert.equal(audio.voices.get(channel), phrase);
  }
  assert.equal(Object.hasOwn(SOUNDS, 'hadouken'), false);
});
test('repetir o mesmo poder não reinicia a fala; outro poder substitui a fala anterior', async t => {
  const audio = prepare(t); await audio.load(); audio.unlock(); await audio.decode();
  const engine = { fighters: [{ character: { id: 'marcelo' } }] };
  audio.event({type:'special',fighter:0,move:'special'},engine);const first=audio.voices.get('quote:0');
  audio.event({type:'special',fighter:0,move:'special'},engine);assert.equal(audio.voices.get('quote:0'),first);assert.equal(first.stopped,false);
  audio.event({type:'special',fighter:0,move:'uppercut'},engine);assert.equal(first.stopped,true);assert.equal(audio.voices.get('quote:0').buffer,audio.buffers.get('marcelo-uppercut'));
});
test('desligar som ou pausar encerra clipes em reprodução', async t => {
  const audio = prepare(t); await audio.load(); audio.unlock(); await audio.decode();
  audio.sample('marcelo-special', 1, 0); const first = audio.voices.get(0);
  assert.equal(audio.toggle(), false); assert.equal(first.stopped, true); assert.equal(audio.sources.size, 0); assert.equal(audio.sample('grunt1'), false);
  audio.toggle(); audio.sample('marcelo-special', 1, 1); const second = audio.voices.get(1);
  audio.event({ type: 'pause', paused: true }); assert.equal(second.stopped, true); assert.equal(audio.voices.size, 0);
});
test('falha de download é informada e não cria uma voz de substituição', async t => {
  const audio = prepare(t); t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await audio.load(), false); audio.unlock(); assert.equal(await audio.decode(), false);
  assert.equal(audio.sample('marcelo-special'), false); assert.equal(audio.sources.size, 0); assert.equal(typeof audio.say, 'undefined');
});

test('super de Marcelo conserva as mesmas amostras PCM do Bora NIT original', async () => {
  const pcm = bytes => {
    for (let offset=12;offset+8<=bytes.length;) {
      const id=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4);
      if(id==='data')return bytes.subarray(offset+8,offset+8+length);
      offset+=8+length+(length%2);
    }
    throw new Error('Bloco PCM não encontrado');
  };
  const original=pcm(await fileBytes('assets/audio/bora-nit-original.wav'));
  const superClip=pcm(await fileBytes(SOUNDS['marcelo-super']));
  assert.deepEqual(superClip.subarray(0,original.length),original);
  assert.ok(superClip.length>original.length);
});

test('locutor usa os 16 WAV originais de SFII documentados, preservados byte a byte e carregados com cada dupla',async t=>{
 const proof=JSON.parse(await fileBytes('assets/audio/announcer-sf2-sources-v1.json'));
 assert.equal(proof.clips.length,16);
 for(const clip of proof.clips){const bytes=await fileBytes(clip.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);assert.equal(SOUNDS['announcer-'+clip.id],clip.path);}
 const audio=prepare(t);await audio.loadFighters(['adriano','rafael']);
 for(const clip of proof.clips)assert.ok(audio.bytes.has('announcer-'+clip.id));
 assert.equal(audio.bytes.has('marcelo-special'),false);
});
test('Round One, Final Round e Fight usam chamadas originais sequenciais sem sobreposição',async t=>{
 const audio=prepare(t);await audio.loadFighters(['adriano','rafael']);audio.unlock();await audio.decodeAvailable();
 for(const e of [{type:'round',round:1,final:false},{type:'round',round:3,final:true}]){
  audio.event(e,{fighters:[]});const sources=[...audio.voices].filter(([k])=>k.startsWith('announcer:')).map(([,s])=>s);
  const words=e.final?['final','round']:['round','1'];assert.deepEqual(sources.map(s=>s.buffer),words.map(w=>audio.buffers.get('announcer-'+w)));
  assert.ok(sources[1].scheduledAt>=sources[0].scheduledAt+sources[0].buffer.duration);assert.ok(sources[1].scheduledAt+sources[1].buffer.duration<2.35);
 }
 audio.event({type:'fight'});assert.equal(audio.voices.get('announcer:0').buffer,audio.buffers.get('announcer-fight'));
});
test('You Win e Perfect terminam antes do próximo round; pausa cancela também os clipes agendados',async t=>{
 const audio=prepare(t);await audio.loadFighters(['adriano','rafael']);audio.unlock();await audio.decodeAvailable();
 audio.event({type:'roundEnd',winner:0,perfect:true,timeout:false});
 const sources=[...audio.voices].filter(([k])=>typeof k==='string'&&k.startsWith('announcer:')).map(([,s])=>s);
 assert.deepEqual(sources.map(s=>s.buffer),['you','win','perfect'].map(w=>audio.buffers.get('announcer-'+w)));
 assert.ok(sources[2].scheduledAt>=sources[1].scheduledAt+sources[1].buffer.duration);assert.ok(sources[2].scheduledAt+sources[2].buffer.duration<3);
 audio.event({type:'pause',paused:true});assert.ok(sources.every(s=>s.stopped));assert.equal(audio.sources.size,0);
 audio.playerSlot=1;audio.event({type:'roundEnd',winner:0,perfect:false,timeout:true});assert.equal(audio.voices.get('announcer:1').buffer,audio.buffers.get('announcer-lose'));
});
