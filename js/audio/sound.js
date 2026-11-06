// Trash Vs. Nazi-Zombies - Soundeffekte und Musik (Web Audio)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ SOUND (procedural Web Audio: SFX + generative music, no asset files) ============ */
const Snd = {
  ctx: null, master: null, sfxG: null, mus: null, nb: null, muted: false, last: {}, mode: '', step: 0, nextT: 0,
  init() {
    if (Snd.ctx) { if (Snd.ctx.state === 'suspended') Snd.ctx.resume(); return; }
    try {
      const c = Snd.ctx = new (window.AudioContext || window.webkitAudioContext)();
      Snd.master = c.createGain(); Snd.master.gain.value = Snd.muted ? 0 : 0.5; Snd.master.connect(c.destination);
      Snd.sfxG = c.createGain(); Snd.sfxG.gain.value = 0.9; Snd.sfxG.connect(Snd.master);
      Snd.mus = c.createGain(); Snd.mus.gain.value = 0.55; Snd.mus.connect(Snd.master);
      Snd.nb = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = Snd.nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;                                  // 1s white noise buffer
    } catch (e) { Snd.ctx = null; }
  },
  toggle() { Snd.muted = !Snd.muted; if (Snd.master) Snd.master.gain.value = Snd.muted ? 0 : 0.5; Save.save(); },
  tone(f, d, type, v, f2, t0, dest) {
    const c = Snd.ctx; if (!c) return; t0 = t0 || c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(dest || Snd.sfxG); o.start(t0); o.stop(t0 + d + 0.02);
  },
  noise(d, v, f0, f1, type, t0, dest) {
    const c = Snd.ctx; if (!c) return; t0 = t0 || c.currentTime;
    const src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); src.buffer = Snd.nb;
    fl.type = type || 'bandpass'; fl.frequency.setValueAtTime(f0, t0); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(fl); fl.connect(g); g.connect(dest || Snd.sfxG); src.start(t0, Math.random() * 0.7); src.stop(t0 + d + 0.02);
  },
  SFX: {
    swing:      () => Snd.noise(0.14, 0.22, 600, 2600),
    swingHeavy: () => { Snd.noise(0.24, 0.3, 300, 1400); Snd.tone(90, 0.2, 'sine', 0.25, 50); },
    swingFast:  () => Snd.noise(0.09, 0.2, 1500, 4500),
    hit:      () => { Snd.noise(0.09, 0.35, 1800, 300, 'lowpass'); Snd.tone(160, 0.1, 'square', 0.2, 60); },
    crit:     () => { Snd.noise(0.12, 0.4, 2500, 400, 'lowpass'); Snd.tone(300, 0.15, 'square', 0.25, 80); Snd.tone(900, 0.1, 'triangle', 0.15, 1400); },
    backstab: () => { Snd.noise(0.12, 0.4, 2500, 400, 'lowpass'); Snd.tone(300, 0.15, 'square', 0.25, 80); Snd.tone(1200, 0.2, 'sine', 0.2, 2200); },
    clink:    () => { Snd.tone(1800, 0.08, 'square', 0.12, 1500); Snd.tone(2700, 0.06, 'triangle', 0.1); },
    break:    () => { Snd.noise(0.3, 0.4, 3000, 200, 'lowpass'); Snd.tone(500, 0.25, 'sawtooth', 0.2, 90); },
    kill:     () => { Snd.noise(0.22, 0.35, 900, 120, 'lowpass'); Snd.tone(110, 0.2, 'sine', 0.4, 45); },
    slam:     () => { Snd.tone(140, 0.25, 'sine', 0.6, 35); Snd.noise(0.2, 0.4, 1200, 150, 'lowpass'); },
    hurt:     () => { Snd.tone(220, 0.25, 'sawtooth', 0.28, 70); Snd.noise(0.1, 0.2, 600, 200, 'lowpass'); },
    death:    () => { Snd.tone(300, 0.9, 'sawtooth', 0.3, 40); Snd.noise(0.5, 0.2, 800, 100, 'lowpass'); },
    dash:     () => Snd.noise(0.2, 0.25, 400, 3000),
    tell:     () => Snd.tone(700, 0.06, 'square', 0.05),
    shot:     () => Snd.tone(700, 0.15, 'sawtooth', 0.12, 180),
    burst:    () => { Snd.tone(90, 0.5, 'sawtooth', 0.3, 50); Snd.noise(0.4, 0.2, 500, 2000); },
    pickup:   () => { const t = Snd.ctx.currentTime; Snd.tone(440, 0.07, 'square', 0.12, null, t); Snd.tone(660, 0.09, 'square', 0.12, null, t + 0.06); },
    deposit:  () => { const t = Snd.ctx.currentTime; [523, 659, 784, 1047].forEach((f, i) => Snd.tone(f, 0.12, 'triangle', 0.16, null, t + i * 0.06)); },
    door:     () => { const t = Snd.ctx.currentTime; [392, 494, 587].forEach((f, i) => Snd.tone(f, 0.25, 'triangle', 0.14, null, t + i * 0.09)); },
    special:  () => { Snd.tone(200, 0.3, 'sawtooth', 0.3, 60); Snd.noise(0.25, 0.3, 2000, 300, 'lowpass'); },
    ui:       () => Snd.tone(900, 0.04, 'square', 0.08),
    type:     () => Snd.tone(620 + Math.random() * 160, 0.025, 'square', 0.025),
    buy:      () => { const t = Snd.ctx.currentTime; Snd.tone(988, 0.07, 'square', 0.12, null, t); Snd.tone(1319, 0.18, 'square', 0.12, null, t + 0.07); }
  },
  sfx(n) {   // rate-limited so rapid hits do not stack into noise
    if (!Snd.ctx || Snd.muted || !Snd.SFX[n]) return;
    const now = performance.now(); if (Snd.last[n] && now - Snd.last[n] < 35) return; Snd.last[n] = now; Snd.SFX[n]();
  },
  // music: each mode = tempo + 16-step patterns ('x' = hit, number = scale degree, -1 = rest)
  MUSIC: {
    hub:   { bpm: 66,  root: 110, scale: [0, 3, 5, 7, 10], prog: [0, -4, -2, -5], pad: true, bassWave: 'triangle', bv: 0.2, arpWave: 'triangle',
             bass: [0,-1,-1,-1,-1,-1,-1,-1,2,-1,-1,-1,-1,-1,-1,-1], arp: [-1,-1,4,-1,-1,-1,2,-1,-1,-1,3,-1,-1,1,-1,-1] },
    calm:  { bpm: 58,  root: 110, scale: [0, 3, 5, 7, 10], prog: [0, -2, -4, -2], pad: true, bassWave: 'triangle', bv: 0.18, arpWave: 'sine',
             bass: [0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1], arp: [-1,-1,-1,-1,4,-1,-1,-1,-1,-1,2,-1,-1,-1,-1,-1] },
    fight: { bpm: 112, root: 82.4, scale: [0, 3, 5, 7, 10], prog: [0, 0, -2, -4], bassWave: 'sawtooth', bv: 0.12, arpWave: 'square',
             kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.',
             bass: [0,-1,0,-1,0,-1,3,-1,0,-1,0,-1,4,-1,3,-1], arp: [0,-1,2,-1,4,-1,2,-1,0,-1,2,-1,3,-1,4,-1] },
    boss:  { bpm: 132, root: 73.4, scale: [0, 1, 5, 6, 7], prog: [0, 0, 1, -1], bassWave: 'sawtooth', bv: 0.16, arpWave: 'square',
             kick: 'x..x..x...x.x...', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.xx',
             bass: [0,0,-1,0,1,-1,0,-1,0,0,-1,3,-1,1,-1,0], arp: [-1,-1,4,-1,-1,3,-1,-1,4,-1,-1,2,-1,-1,3,-1] }
  },
  pickMode() {
    if (Game.mode === 'hub' || Game.mode === 'roof') return 'hub';
    if (Game.mode === 'tut') return Tut.step === 4 && Combat.enemies.length ? 'fight' : 'calm';
    if (Player.dead) return '';
    if (Run.state === 'cleared') return 'calm';
    return Run.boss ? 'boss' : 'fight';
  },
  update() {   // look-ahead scheduler: queue 16th notes ~0.2s ahead of the audio clock
    const c = Snd.ctx; if (!c || c.state !== 'running') return;
    const m = Snd.pickMode();
    if (m !== Snd.mode) { Snd.mode = m; Snd.step = 0; Snd.nextT = c.currentTime + 0.05; }
    const M = Snd.MUSIC[m]; if (!M) return;
    const sd = 60 / M.bpm / 4;
    while (Snd.nextT < c.currentTime + 0.2) { Snd.play(M, Snd.step, Snd.nextT, sd); Snd.step++; Snd.nextT += sd; }
  },
  play(M, step, t, sd) {
    const i = step % 16, bar = Math.floor(step / 16) % 4, sh = M.prog[bar], n = M.scale.length, mu = Snd.mus;
    const f = (deg, oct) => M.root * Math.pow(2, (sh + M.scale[deg % n] + 12 * (oct + Math.floor(deg / n))) / 12);
    if (M.kick && M.kick[i] === 'x') Snd.tone(130, 0.14, 'sine', 0.55, 42, t, mu);
    if (M.snare && M.snare[i] === 'x') Snd.noise(0.12, 0.2, 1800, 900, 'bandpass', t, mu);
    if (M.hat && M.hat[i] === 'x') Snd.noise(0.04, 0.07, 7000, null, 'highpass', t, mu);
    if (M.bass[i] >= 0) Snd.tone(f(M.bass[i], 0), sd * 1.8, M.bassWave, M.bv, null, t, mu);
    if (M.arp[i] >= 0) Snd.tone(f(M.arp[i], 2), sd * 1.1, M.arpWave, 0.05, null, t, mu);
    if (M.pad && i === 0) [0, 2, 4].forEach(k => Snd.tone(f(k, 1), sd * 16, 'triangle', 0.035, null, t, mu));
  }
};
