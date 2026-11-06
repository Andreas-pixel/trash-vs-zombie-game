// Trash Vs. Nazi-Zombies - Run-Ablauf, Biome, Schwierigkeit
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ RUN (endless rooms, boss every 5th) ============ */
const Run = {
  room: 1, boss: false, locked: true, state: 'fight', trans: null, biome: CFG.biomes[0],
  tier() { return Math.floor((Run.room - 1) / CFG.run.bossEvery); },        // 0 = first biome, +1 after every boss
  step() { return (Run.room - 1) % CFG.run.bossEvery; },                    // room inside the biome (0..4, 4 = boss)
  hpMul(type) { const R = CFG.run; return (type === 'boss' ? 1 : R.hpBase) * (1 + R.tierHp * Run.tier()) * (1 + R.roomHp * Run.step()); },
  dmgMul() { const R = CFG.run; return (1 + R.tierDmg * Run.tier()) * (1 + R.roomDmg * Run.step()); },
  biomeName() { const c = Math.floor(Run.tier() / 4); return Run.biome.name + (c ? ' ' + ['', 'II', 'III', 'IV', 'V'][Math.min(4, c)] : ''); },
  card: null,
  spec(n, boss) {   // 2-4 enemies per room; from room 3 a chance for an elite (2 affixes from room 8)
    const R = Math.random;
    if (boss) return [['boss', 1]];                                       // the boss brings its own adds per phase
    const t = Run.tier(), i0 = Run.step(), total = Math.min(4, 2 + t + Math.floor(i0 / 2)), list = [];   // more enemies and tougher types per biome
    const pool = [['walker', Math.max(2, 5 - t)], ['runner', i0 >= 1 || t ? 3 : 0], ['spitter', i0 >= 2 || t ? 3 : 0], ['brute', t ? 2 + t : i0 >= 3 ? 1 : 0], ['bloater', t >= 1 ? 2 : 0], ['hexer', t >= 2 ? 2 : 0]];
    for (let i = 0; i < total; i++) {
      const w = pool.map(q => q[0] === 'hexer' && list.includes('hexer') ? 0 : q[1]); let x = R() * w.reduce((a, b) => a + b, 0), j = 0;   // max 1 hexer per room
      for (; j < w.length - 1 && x >= w[j]; j++) x -= w[j]; list.push(pool[j][0]);
    }
    const aff = t >= 2 ? 2 : 1, el = new Set(), ch = t === 0 ? (i0 >= 2 ? 0.25 : 0) : Math.min(0.9, 0.35 + 0.15 * t);
    if (R() < ch) el.add(Math.floor(R() * total));
    if (t >= 3 && R() < 0.5) el.add(Math.floor(R() * total));
    return list.map((t, i) => [t, 1, el.has(i) ? aff : 0]);
  },
  deadT: 0, log: [], roomT: 0, dmg: 0, last: null,
  hasContainer(n) { return n % 2 === 0 || n % CFG.run.bossEvery === 0; },     // container in every 2nd room and every boss room
  nextContainer() { let n = Run.room; while (!Run.hasContainer(n)) n++; return n; },
  start() { Game.mode = 'run'; Run.won = false; Save.stats.runs++; Skills.resetRun(); Skills.apply(); Run.room = 1; Run.trans = null; Run.log = []; Trash.newRun(); Run.load(true); },
  load(full) {
    const n = Run.room; Run.boss = n % CFG.run.bossEvery === 0;
    const R = CFG.run; Run.biome = CFG.biomes[R.biomeOrder[Run.tier() % R.biomeOrder.length]];
    if (Run.step() === 0) Run.card = { t0: Game.time, a: 'BIOM ' + (Run.tier() + 1) + '  ·  ' + Run.biomeName(),
      b: Run.tier() ? 'GEGNER  +' + Math.round(R.tierHp * Run.tier() * 100) + ' % LEBEN   +' + Math.round(R.tierDmg * Run.tier() * 100) + ' % SCHADEN' : 'ERSTER BOSS IN RAUM ' + R.bossEvery };
    Object.assign(CFG.col, Run.biome.col);
    Room.load(MapGen.generate(n, Run.boss));
    const hp = Player.hp; Player.spawn(Room.spawn.x, Room.spawn.y); if (!full) Player.hp = hp;   // HP carries over between rooms
    Camera.snap(Player.x, Player.y);
    Combat.reset(); Trash.roomLoot(Run.boss); Combat.startWave(Run.spec(n, Run.boss));        // carried trash stays with the player
    Run.locked = true; Run.state = 'fight'; Run.deadT = 0; Run.roomT = Game.time; Run.dmg = 0;
    if (Run.biome.name === 'BUNKER') Env.lava(Run.boss ? 2 : 3);
    Combat.text(Player.x, Player.y - 0.5, Run.boss ? 'BOSSRAUM' : 'RAUM ' + n, PAL.uiWorld, true);
    if (Run.boss && Run.biome.name === 'BUNKER') Dialog.start(STORY.finalBoss.intro);
  },
  cleared() {
    Run.state = 'cleared'; Run.locked = false; Camera.shake(2); Snd.sfx('door');
    Run.log.push({ n: Run.room, t: Game.time - Run.roomT, dmg: Run.dmg });   // balance telemetry
    Skills.gainXp(CFG.xp.room);
    Player.hp = Math.min(Player.maxHp, Player.hp + (Run.boss ? CFG.run.healBoss : CFG.run.healRoom) + Skills.v('heal'));
    Combat.text(Player.x, Player.y - 0.5, Run.boss ? 'BIOM GESCHAFFT' : 'RAUM FREI  ·  AUSGANG OFFEN', PAL.uiInteract, true);
  },
  update(dt) {
    if (Run.trans) {                                            // fade out -> load next room -> fade in
      Run.trans.t += dt;
      if (Run.trans.phase === 'out' && Run.trans.t >= CFG.run.fade) {
        const to = Run.trans.to;
        if (to === 'roof') Roof.enter(); else if (to === 'hub') { const real = Game.mode === 'run' || Game.mode === 'roof'; Hub.enter(); Story.pendingFirst = real && Save.flags.tut && !Save.flags.firstRun; } else if (to === 'tuthub') { Hub.enter(); Tut.hubBegin(); } else if (to === 'run') Run.start(); else { Run.room++; Run.load(false); }
        Run.trans = { phase: 'in', t: 0 };
      }
      else if (Run.trans.phase === 'in' && Run.trans.t >= CFG.run.fade) { Run.trans = null; if (Roof.pending) { Roof.pending = false; Roof.arrive(); } if (Story.pendingFirst) { Story.pendingFirst = false; Story.firstRun(); } }   // dialogs only after the fade, never during it
      return;
    }
    if (Game.mode === 'hub') { if (Tut.hub) Tut.hubUpdate(dt); if (!Game.ui) Hub.update(); return; }
    if (Game.mode === 'tut') { Tut.update(dt); return; }
    if (Game.mode === 'roof') { if (!Game.ui) Roof.update(dt); return; }
    if (Player.dead) { Run.deadT += dt; if (Run.deadT > 1.6) Run.trans = { phase: 'out', t: 0, to: 'hub' }; return; }   // death -> back to kitchen
    if (Run.state === 'cleared' && Room.door && Math.floor(Player.x) === Room.door.x && Math.floor(Player.y) === Room.door.y)
      Run.trans = Run.won ? { phase: 'out', t: 0, to: 'roof' } : { phase: 'out', t: 0 };
  },
  drawFade(ctx) {
    if (!Run.trans) return;
    const k = Math.min(1, Run.trans.t / CFG.run.fade), a = Run.trans.phase === 'out' ? k : 1 - k;
    ctx.fillStyle = 'rgba(0,0,0,' + a + ')'; ctx.fillRect(0, 0, CFG.view.w, CFG.view.h);
  }
};
