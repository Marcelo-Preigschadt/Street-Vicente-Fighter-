import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ArcadeAudio, SOUNDS } from '../src/audio.js';

const fileBytes = path => readFile(new URL(`../${path}`, import.meta.url));
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime(value) { this.value = value; } });
class AudioContextStub {
  constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; this.started = []; }
  resume() { return Promise.resolve(); }
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
  createDynamicsCompressor() { return { threshold: param(), knee: param(), ratio: param(), connect() {} }; }
  decodeAudioData(bytes) { return Promise.resolve({ bytes: bytes.byteLength }); }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  createBufferSource() {
    const source = { connect() {}, disconnect() {}, stopped: false,
      start: () => this.started.push(source), stop() { this.stopped = true; this.onended?.(); } };
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
    const duration = data.length / (rate * channels * bits / 8); assert.ok(duration >= .1 && duration < 3);
    let peak = 0;
    for (let i = 0; i < data.length; i += bits / 8) peak = Math.max(peak, bits === 8 ? Math.abs(data[i] - 128) / 128 : Math.abs(data.readInt16LE(i)) / 32768);
    assert.ok(peak > .03, `${path} não deve conter apenas silêncio`);
  }
});
test('pré-carregamento prepara os oito clipes e reutiliza as mesmas promessas', async t => {
  const audio = prepare(t), load = audio.load(); assert.equal(audio.load(), load); assert.equal(await load, true);
  audio.unlock(); assert.equal(await audio.decode(), true); assert.equal(audio.buffers.size, 8);
  assert.equal(audio.decode(), audio.decodePromise); assert.equal(globalThis.fetch.mock.callCount(), 8);
});
test('especial reproduz o clipe Hadouken e outro som do mesmo lutador interrompe sua voz', async t => {
  const audio = prepare(t); await audio.load(); audio.unlock(); await audio.decode();
  const engine = { fighters: [{ character: { id: 'marcelo' } }, { character: { id: 'rafael' } }] };
  audio.event({ type: 'special', fighter: 0, quote: 'Bora NIT' }, engine);
  const special = audio.voices.get(0); assert.equal(special.buffer, audio.buffers.get('hadouken'));
  audio.event({ type: 'swing', fighter: 0, move: 'punch' }, engine);
  assert.equal(special.stopped, true); assert.equal(audio.voices.get(0).buffer, audio.buffers.get('grunt1'));
  audio.event({ type: 'special', fighter: 1, quote: 'No meu tempo não era assim' }, engine);
  assert.equal(audio.voices.get(1).buffer, audio.buffers.get('hadouken'));
});
test('desligar som ou pausar encerra clipes em reprodução', async t => {
  const audio = prepare(t); await audio.load(); audio.unlock(); await audio.decode();
  audio.sample('hadouken', 1, 0); const first = audio.voices.get(0);
  assert.equal(audio.toggle(), false); assert.equal(first.stopped, true); assert.equal(audio.sources.size, 0); assert.equal(audio.sample('grunt1'), false);
  audio.toggle(); audio.sample('hadouken', 1, 1); const second = audio.voices.get(1);
  audio.event({ type: 'pause', paused: true }); assert.equal(second.stopped, true); assert.equal(audio.voices.size, 0);
});
test('falha de download é informada e não cria uma voz de substituição', async t => {
  const audio = prepare(t); t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await audio.load(), false); audio.unlock(); assert.equal(await audio.decode(), false);
  assert.equal(audio.sample('hadouken'), false); assert.equal(audio.sources.size, 0); assert.equal(typeof audio.say, 'undefined');
});
