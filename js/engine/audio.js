// audio.js — Web Audio API sound effects for GRIDLOCK

let audioCtx = null;
let masterGain = null;
let sfxVolume = 0.4;

function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = sfxVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSfxVolume(vol) {
  sfxVolume = Math.max(0, Math.min(1, vol));
  if (masterGain) masterGain.gain.value = sfxVolume;
}

function playTone(freq, duration, type = 'square', rampDown = true) {
  const ctx = ensureCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.3;
  if (rampDown) {
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, filterFreq = 2000) {
  const ctx = ensureCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = 0.15;
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start();
}

// --- Sound effect library ---

/** WEAKNESS! flash — the most important 0.5s in the game */
export function sfxWeakness() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  // Rising arpeggio + shimmer
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.25;
    gain.gain.linearRampToValueAtTime(0, t + 0.12 * (i + 1) + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + 0.08 * i);
    osc.stop(t + 0.12 * (i + 1) + 0.15);
  });
}

/** Attack hit */
export function sfxHit() {
  playNoise(0.08, 1500);
  playTone(200, 0.06, 'square');
}

/** Critical hit */
export function sfxCritHit() {
  playNoise(0.1, 2500);
  playTone(400, 0.05, 'square');
  setTimeout(() => playTone(600, 0.05, 'square'), 50);
}

/** Boss phase transition */
export function sfxPhaseTransition() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  // Low rumble + ascending tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 80;
  osc.frequency.linearRampToValueAtTime(400, t + 0.6);
  gain.gain.value = 0.2;
  gain.gain.linearRampToValueAtTime(0, t + 0.8);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.8);
  playNoise(0.5, 800);
}

/** Level up jingle */
export function sfxLevelUp() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  [262, 330, 392, 523].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.3;
    gain.gain.linearRampToValueAtTime(0, t + 0.15 * (i + 1) + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + 0.12 * i);
    osc.stop(t + 0.15 * (i + 1) + 0.2);
  });
}

/** Menu select */
export function sfxSelect() {
  playTone(440, 0.06, 'square');
}

/** Menu navigate / back */
export function sfxNavigate() {
  playTone(330, 0.04, 'square');
}

/** Enemy death */
export function sfxEnemyDeath() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 300;
  osc.frequency.linearRampToValueAtTime(60, t + 0.3);
  gain.gain.value = 0.2;
  gain.gain.linearRampToValueAtTime(0, t + 0.3);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.3);
}

/** Player takes damage */
export function sfxDamageTaken() {
  playTone(150, 0.1, 'sawtooth');
  playNoise(0.06, 1000);
}

/** Status effect applied */
export function sfxStatus() {
  playTone(220, 0.08, 'triangle');
  setTimeout(() => playTone(180, 0.08, 'triangle'), 80);
}

/** Healing sound */
export function sfxHeal() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  [392, 494, 587].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.2;
    gain.gain.linearRampToValueAtTime(0, t + 0.1 * (i + 1) + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + 0.08 * i);
    osc.stop(t + 0.1 * (i + 1) + 0.1);
  });
}

/** Boss defeat fanfare */
export function sfxBossDefeat() {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  // Triumphant fanfare
  const notes = [262, 330, 392, 523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 3 ? 'triangle' : 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.25;
    gain.gain.linearRampToValueAtTime(0.15, t + 0.1 * i + 0.15);
    gain.gain.linearRampToValueAtTime(0, t + 0.1 * i + 0.4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + 0.1 * i);
    osc.stop(t + 0.1 * i + 0.4);
  });
}
