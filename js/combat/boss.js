// Trash Vs. Nazi-Zombies - Bosse mit Phasen
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ BOSSES (phases at 66% / 33% HP, attack library, arena changes) ============ */
const Boss = {
  last: '', pillars: [],
  reset() { Boss.pillars = []; },
  cur() { return Combat.enemies.find(x => x.boss); },
  pick() { const ids = Object.keys(CFG.bosses).filter(k => k !== Boss.last); return ids[Math.floor(Math.random() * ids.length)]; },
  init(e) {
    const id = Boss.pick(), B = CFG.bosses[id], m = Run.hpMul('boss'); Boss.last = id;
    e.boss = true; e.bid = id; e.bd = B; e.abs = []; e.aff = {}; e.acd = {};
    e.def = Object.assign({}, e.def, { color: B.color, speed: B.speed, r: B.r, burst: null, kbMul: 0.1 }); e.radius = B.r;
    e.maxHp = e.hp = Math.round(B.hp * m); e.maxArmor = e.armor = Math.round(B.armor * m);
    e.bs = { ph: 0, st: 'idle', t: 2.2, atk: null, spin: 0, lastAtk: '' };
    Combat.text(Player.x, Player.y - 1.2, B.name, '#ffd34a', true); Snd.sfx('burst');
  },
  hit(e, dmg) { return Player.hurt(Math.round(dmg * Run.dmgMul()), e.x, e.y); },
  shot(e, a, sp, dmg) { Combat.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 4, dmg: Math.round(dmg * Run.dmgMul()) }); },
  ringShots(e, n, off, sp, dmg) { for (let i = 0; i < n; i++) Boss.shot(e, off + i / n * 6.283, sp, dmg); },
  free(x, y, r) { return !Room.boxBlocked(x, y, r || 0.4); },
  spot(cx, cy, minR, maxR) {   // random free floor point around (cx, cy)
    for (let i = 0; i < 25; i++) { const a = Math.random() * 6.283, r = minR + Math.random() * (maxR - minR), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (Boss.free(x, y)) return { x, y }; }
    return { x: cx, y: cy };
  },
  // attack library: wind (telegraph) -> act -> rec (recovery). start/begin/tick/end may use the attack state A
  ATK: {
    charge: { wind: 0.85, act: 0.75, rec: 0.5, tel: 'line', len: 9,
      tick(e, A, dt) {
        const r = Room.move(e, A.dir.x * 12 * dt, A.dir.y * 12 * dt);
        if (!A.hit && Math.hypot(Player.x - e.x, Player.y - e.y) < e.radius + Player.radius + 0.1) { A.hit = true; Boss.hit(e, 24); Player.kx += A.dir.x * 8; Player.ky += A.dir.y * 8; }
        if (r.hitX || r.hitY) {   // wall crash: the boss is stunned and loses armor = the damage window
          e.stun = 1.5; e.armor = Math.max(0, e.armor - 60); Camera.shake(6); Game.hitstop = 0.08; Snd.sfx('slam'); Combat.text(e.x, e.y - 0.6, 'BENOMMEN!', '#ffd34a', true);
          Particles.burst(e.x, e.y, 8, 18, { col: '#ffd34a', speed: 4, up: 50, life: 0.5, size: 1, grav: 120 });
        }
      } },
    slam: { wind: 0.8, act: 0.1, rec: 0.7, tel: 'ring', r: 2.6,
      begin(e, A) {
        Camera.shake(5); Snd.sfx('slam'); Particles.burst(e.x, e.y, 4, 16, { col: '#9a8a7a', speed: 3.5, up: 30, life: 0.4, size: 2, grav: 40 });
        if (Math.hypot(Player.x - e.x, Player.y - e.y) < 2.6 + Player.radius) Boss.hit(e, 22);
        if (e.bs.ph >= 1) Boss.ringShots(e, 8, Math.random() * 6.28, 4, 9);
      } },
    rain: { wind: 0.5, act: 0.1, rec: 0.9,
      begin(e) { const n = 4 + e.bs.ph * 2; for (let i = 0; i < n; i++) { const p = Boss.spot(Player.x, Player.y, 0, 5); Combat.blasts.push({ x: p.x, y: p.y, r: 1.5, dmg: 14, t: 0.9 + i * 0.22, max: 0.9 + i * 0.22 }); } Snd.sfx('tell'); } },
    ring: { wind: 0.6, act: 0.5, rec: 0.7,
      begin(e) { Snd.sfx('burst'); Boss.ringShots(e, 12 + e.bs.ph * 4, 0, 4.2, 9); },
      tick(e, A) { if (!A.k2 && A.t < 0.25 && e.bs.ph >= 1) { A.k2 = true; Boss.ringShots(e, 12 + e.bs.ph * 4, Math.PI / (12 + e.bs.ph * 4), 4.2, 9); Snd.sfx('shot'); } } },
    fan: { wind: 0.5, act: 0.9, rec: 0.6,
      tick(e, A) { const k = Math.floor((0.9 - A.t) / 0.3); if (k > (A.v || -1)) { A.v = k; const n = 5 + e.bs.ph * 2, base = Math.atan2(Player.y - e.y, Player.x - e.x); for (let i = 0; i < n; i++) Boss.shot(e, base + (i - (n - 1) / 2) * 0.2, 5, 9); Snd.sfx('shot'); } } },
    spiral: { wind: 0.6, act: 2.0, rec: 0.8,
      tick(e, A, dt) { A.c = (A.c || 0) - dt; if (A.c <= 0) { A.c = 0.09; e.bs.spin += 0.55; Boss.shot(e, e.bs.spin, 4, 8); if (e.bs.ph >= 2) Boss.shot(e, e.bs.spin + Math.PI, 4, 8); if (Math.floor(e.bs.spin * 2) % 4 === 0) Snd.sfx('shot'); } } },
    leap: { wind: 0.7, act: 0.5, rec: 0.8, tel: 'target', r: 2.0,
      begin(e, A) { A.sx = e.x; A.sy = e.y; },
      tick(e, A) { const k = 1 - Math.max(0, A.t) / 0.5, x = A.sx + (A.tx - A.sx) * k, y = A.sy + (A.ty - A.sy) * k; if (Boss.free(x, y, 0.3)) { e.x = x; e.y = y; } },
      end(e, A) { Camera.shake(6); Snd.sfx('slam'); Particles.burst(e.x, e.y, 4, 18, { col: '#9a8a7a', speed: 4, up: 40, life: 0.5, size: 2, grav: 60 }); if (Math.hypot(Player.x - e.x, Player.y - e.y) < 2.0 + Player.radius) Boss.hit(e, 20); } },
    trail: { wind: 0.6, act: 1.1, rec: 0.7, tel: 'line', len: 8,
      tick(e, A, dt) {
        const r = Room.move(e, A.dir.x * 7 * dt, A.dir.y * 7 * dt); A.c = (A.c || 0) - dt;
        if (A.c <= 0) { A.c = 0.22; Combat.hazards.push({ x: e.x, y: e.y, r: 0.9, t: 6, max: 6, dps: 8 }); }
        if (r.hitX || r.hitY) A.t = Math.min(A.t, 0.05);
      } },
    pools: { wind: 0.7, act: 0.1, rec: 0.8,
      begin(e) { const n = 4 + e.bs.ph; for (let i = 0; i < n; i++) { const p = Boss.spot(Player.x, Player.y, 0, 4.5); Combat.blasts.push({ x: p.x, y: p.y, r: 1.3, dmg: 0, t: 0.8 + i * 0.12, max: 0.8 + i * 0.12, pool: true }); } Snd.sfx('tell'); } },
    summon: { wind: 0.9, act: 0.1, rec: 0.7, tel: 'ring', r: 1.4, purple: true,
      begin(e) { const a = e.bd.phases[e.bs.ph].add; if (a) Boss.adds(e, a); Snd.sfx('burst'); } },
    blink: { wind: 0.5, act: 0.15, rec: 0.4, tel: 'ring', r: 1.0, purple: true,
      begin(e) {
        Particles.burst(e.x, e.y, 8, 14, { col: '#d0a0ff', speed: 3, up: 40, life: 0.4, size: 2, grav: 30 });
        const p = Boss.spot(Player.x, Player.y, 3.5, 5); e.x = p.x; e.y = p.y; Snd.sfx('dash');
        Particles.burst(e.x, e.y, 8, 14, { col: '#d0a0ff', speed: 3, up: 40, life: 0.4, size: 2, grav: 30 });
        const n = 5, base = Math.atan2(Player.y - e.y, Player.x - e.x); for (let i = 0; i < n; i++) Boss.shot(e, base + (i - 2) * 0.22, 5, 9);   // arrival volley
      } }
  },
  update(e, dt, dx, dy, d) {
    const B = e.bd, S = e.bs, f = e.hp / e.maxHp;
    if (S.ph === 0 && f < 0.66) Boss.phase(e, 1); else if (S.ph === 1 && f < 0.33) Boss.phase(e, 2);
    if (e.phaseLock > 0) { e.phaseLock -= dt; e.state = 'windup'; return; }
    if (Player.dead) return;
    const spd = B.speed * (1 + 0.12 * S.ph);
    if (S.st === 'idle') {
      e.state = 'chase';
      if (d > B.keep + 1) Room.move(e, dx / d * spd * dt, dy / d * spd * dt); else if (d < B.keep - 1) Room.move(e, -dx / d * spd * 0.8 * dt, -dy / d * spd * 0.8 * dt);
      S.t -= dt; if (S.t <= 0) Boss.start(e, dx, dy, d);
      return;
    }
    const A = S.atk, T = Boss.ATK[A.id]; A.t -= dt;
    if (A.ph === 'wind') {
      e.state = 'windup';
      if (A.t <= 0) { A.ph = 'act'; A.t = T.act; e.state = 'chase'; if (T.begin) T.begin(e, A); }
    } else if (A.ph === 'act') {
      if (T.tick) T.tick(e, A, dt);
      if (S.st !== 'idle' && A.t <= 0) { A.ph = 'rec'; A.t = T.rec; if (T.end) T.end(e, A); }
    } else if (A.t <= 0) { S.st = 'idle'; S.atk = null; S.t = B.phases[S.ph].gap; e.state = 'chase'; }
  },
  start(e, dx, dy, d) {
    const S = e.bs, L = e.bd.phases[S.ph].atk; let id;
    do id = L[Math.floor(Math.random() * L.length)]; while (id === S.lastAtk && L.length > 1);
    S.lastAtk = id; const T = Boss.ATK[id];
    S.atk = { id, ph: 'wind', t: T.wind, dir: { x: dx / d, y: dy / d }, tx: Player.x, ty: Player.y, hit: false }; S.st = 'atk';
    e.ang = Math.atan2(dy, dx); Snd.sfx('tell');
  },
  phase(e, ph) {   // phase change: roar, brief immunity, fresh armor, arena change, adds
    const S = e.bs, P = e.bd.phases[ph];
    S.ph = ph; S.st = 'idle'; S.atk = null; S.t = 1.8; e.phaseLock = 1.6; e.ab = null;
    e.armor = Math.max(e.armor, Math.round(e.maxArmor * 0.5));
    Combat.shots = []; Combat.blasts = []; Camera.shake(7); Game.hitstop = 0.12; Snd.sfx('burst');
    Combat.text(e.x, e.y - 1, 'PHASE ' + (ph + 1), '#ff7a5a', true); Combat.ring = { t: 0, x: e.x, y: e.y, r: 3.2, type: 'slam' };
    Particles.burst(e.x, e.y, 8, 26, { col: e.def.color, speed: 5, up: 70, life: 0.7, size: 2, grav: 80 });
    const dx = Player.x - e.x, dy = Player.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d < 3.2) { Player.kx += dx / d * 8; Player.ky += dy / d * 8; }                    // shockwave pushes you away (no damage)
    Boss.arena(P.arena); if (P.add) Boss.adds(e, P.add);
  },
  adds(e, a) {
    const alive = Combat.enemies.filter(m => m.owner === e).length;
    for (let i = 0; i < a[1] && alive + i < 5; i++) Abilities.near(e, a[0]);
  },
  arena(kind) {
    if (!kind) return;
    if (kind === 'pillars' || kind === 'clear') Boss.clearArena();
    if (kind === 'pillars') {   // temporary cover pillars around the room center
      const cx = Math.floor(Room.w / 2), cy = Math.floor(Room.h / 2);
      for (const [ox, oy] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) {
        const x = cx + ox, y = cy + oy;
        if (Room.tiles[y] && Room.tiles[y][x] === 0 && Math.hypot(x + 0.5 - Player.x, y + 0.5 - Player.y) > 2 && !Combat.enemies.some(m => Math.hypot(x + 0.5 - m.x, y + 0.5 - m.y) < 1.8)) {
          Room.tiles[y][x] = 1; Boss.pillars.push([x, y]); Particles.burst(x + 0.5, y + 0.5, 4, 14, { col: '#7a7a82', speed: 2.5, up: 40, life: 0.5, size: 2, grav: 80 });
        }
      }
    }
    if (kind === 'hazards') for (let i = 0; i < 5; i++) { const p = Boss.spot(Room.w / 2, Room.h / 2, 1, 5); Combat.hazards.push({ x: p.x, y: p.y, r: 1.1, t: 14, max: 14, dps: 7 }); }
    Camera.shake(3);
  },
  clearArena() { for (const [x, y] of Boss.pillars) if (Room.tiles[y]) Room.tiles[y][x] = 0; Boss.pillars = []; },
  onDeath(e) {
    Boss.clearArena(); Combat.hazards = []; Combat.shots = []; Combat.blasts = [];
    for (const m of Combat.enemies) if (m.owner === e) m.dead = true;                       // adds vanish with the boss
    Camera.shake(9); Game.hitstop = 0.25; Snd.sfx('door');
    Particles.burst(e.x, e.y, 8, 40, { col: e.def.color, speed: 6, up: 90, life: 1, size: 2, grav: 80, decal: true });
    Particles.burst(e.x, e.y, 10, 30, { col: '#ffd34a', speed: 5, up: 80, life: 0.8, size: 1, grav: 60 });
    Combat.text(e.x, e.y - 1, 'BOSS BESIEGT: ' + e.bd.name, '#ffd34a', true);
  },
  updateHazards(dt) {   // poison pools hurt while you stand in them
    for (const h of Combat.hazards) {
      h.t -= dt; h.tick = (h.tick || 0) - dt;
      if (h.tick <= 0 && !Player.dead && Math.hypot(Player.x - h.x, Player.y - h.y) < h.r + Player.radius * 0.5) { h.tick = 0.6; Player.hurt(Math.max(1, Math.round(h.dps * 0.6 * Run.dmgMul())), h.x, h.y); }
    }
    Combat.hazards = Combat.hazards.filter(h => h.t > 0);
  },
  drawHazards(ctx, cam) {
    ctx.lineWidth = 1;
    for (const h of Combat.hazards) { const a = Math.min(1, h.t / 1.5); ctx.globalAlpha = a; Abilities.ring(ctx, cam, h.x, h.y, h.r, 'rgba(140,220,70,.9)', 'rgba(90,170,40,.42)', 1); ctx.globalAlpha = 1; }
  },
  drawTel(ctx, cam) {
    const e = Boss.cur(); if (!e || !e.bs || !e.bs.atk || e.bs.atk.ph !== 'wind') return;
    const A = e.bs.atk, T = Boss.ATK[A.id], k = 1 - A.t / T.wind; if (!T.tel) return;
    ctx.lineWidth = 3;
    if (T.tel === 'line') {
      const a = Iso.toScreen(e.x, e.y, cam), b = Iso.toScreen(e.x + A.dir.x * T.len, e.y + A.dir.y * T.len, cam), m = Iso.toScreen(e.x + A.dir.x * T.len * k, e.y + A.dir.y * T.len * k, cam);
      ctx.strokeStyle = 'rgba(255,60,50,.28)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,90,60,.85)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke();
    } else {
      const x = T.tel === 'target' ? A.tx : e.x, y = T.tel === 'target' ? A.ty : e.y;
      Abilities.ring(ctx, cam, x, y, T.r, T.purple ? 'rgba(170,90,255,.9)' : 'rgba(255,60,50,.9)', T.purple ? 'rgba(150,80,255,.25)' : 'rgba(255,50,40,.28)', k);
    }
    ctx.lineWidth = 1;
  },
  drawHud(ctx) {   // boss bar, bottom center: purple neon sign (enemy), yellow armor, phase marks
    const e = Boss.cur(); if (!e) return;
    const W = CFG.view.w, H = CFG.view.h, x = 140, w = 200, y = H - 16, ph = e.bs.ph;
    UI.glow(ctx, e.bd.name, W / 2, y - 13, PAL.uiEnemy, 'bold 8px monospace', 'center', 10);
    UI.text(ctx, 'PHASE ' + (ph + 1) + '/3', x + w, y - 12, PAL.uiDim, '7px monospace', 'right');
    UI.bar(ctx, x, y, w, 6, Math.max(0, e.hp) / e.maxHp, e.phaseLock > 0 ? '#ffffff' : PAL.uiEnemy, '#1e1030', true);
    if (e.armor > 0) { ctx.fillStyle = PAL.uiArmor; ctx.fillRect(x, y + 4, w * e.armor / Math.max(1, e.maxArmor), 2); }
    ctx.fillStyle = PAL.ink; ctx.fillRect(x + w * 0.33, y - 1, 1, 8); ctx.fillRect(x + w * 0.66, y - 1, 1, 8);
  }
};
