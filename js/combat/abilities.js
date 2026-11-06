// Trash Vs. Nazi-Zombies - Gegner-Faehigkeiten und Elite-Affixe
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ ENEMY ABILITIES + ELITE AFFIXES ============ */
const Abilities = {
  AFF: ['swift', 'armored', 'vampiric', 'explosive', 'shielded', 'berserk', 'splitter'],
  TAGS: { swift: 'SCHNELL', armored: 'GEPANZERT', vampiric: 'VAMPIR', explosive: 'EXPLOSIV', shielded: 'SCHILD', berserk: 'WUETEND', splitter: 'TEILER' },
  PARAM: {   // wind = telegraph time, go = action time, sp = tiles/s, rec = recovery, cd = cooldown, min/max = trigger distance, len/r = telegraph size
    pounce:   { wind: 0.35, go: 0.38, sp: 11, rec: 0.5, dmg: 10, cd: 4, min: 2.0, max: 4.4, len: 4.2 },   // go * sp ~ len: the telegraph shows the real reach
    charge:   { wind: 0.85, go: 0.75, sp: 10, rec: 0.4, dmg: 22, cd: 7, min: 3, max: 7.5, len: 7 },
    pound:    { wind: 0.7, rec: 0.6, r: 2.0, dmg: 18, cd: 5, max: 1.9 },
    backstep: { go: 0.22, sp: 9, rec: 0.1, cd: 5, max: 2.3 },
    summon:   { wind: 0.9, rec: 0.5, r: 1.2, cd: 9, min: 2 }
  },
  has(e, a) { return e.abs.includes(a); },
  init(e, na) {
    if (e.type === 'boss') { Boss.init(e); return; }
    e.abs = CFG.abilitySets[e.type] || []; e.aff = {}; e.acd = {}; e.shotN = 0; e.ab = null; e.hitAt = 0;
    if (!na) return;
    const pool = Abilities.AFF.slice().sort(() => Math.random() - 0.5).slice(0, na);
    pool.forEach(a => { e.aff[a] = true; }); e.elite = true; e.tag = pool.map(a => Abilities.TAGS[a]).join(' ');
    e.maxHp = e.hp = Math.round(e.maxHp * 1.6);
    if (e.aff.armored) { e.armor += Math.round(40 * Run.hpMul(e.type)); e.maxArmor = Math.max(e.maxArmor, e.armor); }
    if (e.aff.shielded) { e.maxArmor = Math.max(e.maxArmor, Math.round(30 * Run.hpMul(e.type))); e.armor = Math.max(e.armor, e.maxArmor); }
  },
  speed(e) { return e.def.speed * (e.aff.swift ? 1.35 : 1) * (e.enraged ? 1.4 : 1); },
  dmgMul(e) { return e.aff.berserk ? 1.4 : 1; },
  windMul(e) { return (e.aff.berserk ? 0.7 : 1) * (e.enraged ? 0.75 : 1); },
  strike(e, dmg) {   // melee / ability hit on the player, scaled by depth and affixes; vampiric elites heal
    const v = Math.round(dmg * Run.dmgMul() * Abilities.dmgMul(e));
    if (Player.hurt(v, e.x, e.y) && e.aff.vampiric) { e.hp = Math.min(e.maxHp, e.hp + Math.round(v * 0.5)); Combat.text(e.x, e.y - 0.4, '+HP', '#e05080', false); }
  },
  fire(e, r) {       // ranged attack; spitters fire a 3-shot fan every third shot
    e.shotN++; Snd.sfx('shot');
    const n = Abilities.has(e, 'spread') && e.shotN % 3 === 0 ? 3 : 1, base = Math.atan2(e.face.y, e.face.x), dm = Run.dmgMul() * Abilities.dmgMul(e);
    for (let i = 0; i < n; i++) { const a = base + (n === 1 ? 0 : (i - 1) * 0.32); Combat.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * r.speed, vy: Math.sin(a) * r.speed, life: 3, dmg: Math.round(r.dmg * dm) }); }
  },
  make(type, x, y, owner) {   // spawn a minion
    const d = CFG.enemies[type], m = Run.hpMul(type), ang = Math.random() * 6.28, hp = Math.round(d.hp * m);
    const e = { type, def: d, x, y, radius: d.r, hp, armor: Math.round(d.armor * m), maxHp: hp, maxArmor: Math.round(d.armor * m), ang, face: { x: Math.cos(ang), y: Math.sin(ang) }, state: d.ranged ? 'kite' : 'chase', t: 0, cd: 1.2, kx: 0, ky: 0, stun: 0.4, flashT: 0, owner };
    Abilities.init(e, 0); Combat.enemies.push(e); return e;
  },
  near(e, type) {   // free spot next to e
    for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28, x = e.x + Math.cos(a) * 1.1, y = e.y + Math.sin(a) * 1.1; if (!Room.boxBlocked(x, y, 0.35)) return Abilities.make(type, x, y, e); }
    return Abilities.make(type, e.x, e.y, e);
  },
  blast(x, y, r, dmg) { Combat.blasts.push({ x, y, r, dmg, t: 0.8, max: 0.8 }); Snd.sfx('tell'); },
  onDeath(e) {
    if (e.boss) Boss.onDeath(e);
    if (Abilities.has(e, 'deathBlast') || e.aff.explosive) Abilities.blast(e.x, e.y, 2.0, 18);
    if (e.aff.splitter) for (let i = 0; i < 2; i++) { const m = Abilities.near(e, 'walker'); m.hp = m.maxHp = Math.round(m.maxHp * 0.5); }
    if (e.elite) Combat.text(e.x, e.y - 0.8, 'ELITE ERLEGT', '#ffd34a', true);
  },
  updateBlasts(dt) {
    for (const b of Combat.blasts) {
      b.t -= dt; if (b.t > 0) continue;
      b.done = true; if (b.pool) Combat.hazards.push({ x: b.x, y: b.y, r: b.r, t: 6, max: 6, dps: 8 }); Camera.shake(4); Snd.sfx('slam'); Particles.burst(b.x, b.y, 6, 20, { col: '#ff8a3a', speed: 4, up: 60, life: 0.5, size: 2, grav: 100 });
      if (Math.hypot(Player.x - b.x, Player.y - b.y) < b.r + Player.radius) Player.hurt(Math.round(b.dmg * Run.dmgMul()), b.x, b.y);
    }
    Combat.blasts = Combat.blasts.filter(b => !b.done);
  },
  update(e, dt, dx, dy, d) {   // returns true while an ability controls the enemy this frame
    const P = Player;
    for (const k in e.acd) e.acd[k] -= dt;
    if (e.aff.shielded && e.armor <= 0 && Game.time - e.hitAt > 4) { e.armor = e.maxArmor; Combat.text(e.x, e.y - 0.5, 'SCHILD', '#9ad8ff', false); }   // regenerating shield
    if (Abilities.has(e, 'enrage') && !e.enraged && e.hp < e.maxHp * 0.4) { e.enraged = true; Combat.text(e.x, e.y - 0.5, 'WUT!', '#ff5040', true); Camera.shake(2); Snd.sfx('tell'); }
    if (!e.ab && !P.dead && (e.state === 'chase' || e.state === 'kite')) {
      for (const id of e.abs) {
        const p = Abilities.PARAM[id]; if (!p || (e.acd[id] || 0) > 0) continue;
        const ok = id === 'summon' ? d > p.min && Combat.enemies.filter(m => m.owner === e).length < 3
                 : id === 'pound' || id === 'backstep' ? d < p.max : d > p.min && d < p.max;
        if (!ok) continue;
        const dir = id === 'backstep' ? { x: -dx / d, y: -dy / d } : { x: dx / d, y: dy / d };
        e.ang = Math.atan2(dir.y, dir.x) + (id === 'backstep' ? Math.PI : 0); e.acd[id] = p.cd;
        e.ab = { id, ph: p.wind ? 'wind' : 'go', t: p.wind || p.go, dir, hit: false }; if (p.wind) Snd.sfx('tell');
        break;
      }
    }
    const A = e.ab; if (!A) return false;
    const p = Abilities.PARAM[A.id]; A.t -= dt;
    if (A.ph === 'wind') {
      if (A.t <= 0) {
        if (A.id === 'pound') {
          Camera.shake(3); Snd.sfx('slam'); Particles.burst(e.x, e.y, 4, 14, { col: '#9a8a7a', speed: 3, up: 30, life: 0.4, size: 2, grav: 40 });
          if (Math.hypot(P.x - e.x, P.y - e.y) < p.r + P.radius) Abilities.strike(e, p.dmg);
          A.ph = 'rec'; A.t = p.rec;
        } else if (A.id === 'summon') {
          for (let i = 0; i < 2; i++) Abilities.near(e, 'runner'); Combat.text(e.x, e.y - 0.6, 'RUFT VERSTAERKUNG', '#b080ff', false); Snd.sfx('burst');
          A.ph = 'rec'; A.t = p.rec;
        } else { A.ph = 'go'; A.t = p.go; Snd.sfx('dash'); }
      }
    } else if (A.ph === 'go') {
      const r = Room.move(e, A.dir.x * p.sp * dt, A.dir.y * p.sp * dt);
      if (!A.hit && p.dmg && !P.dead && Math.hypot(P.x - e.x, P.y - e.y) < e.radius + P.radius + 0.1) {
        A.hit = true; Abilities.strike(e, p.dmg);
        if (A.id === 'charge') { P.kx += A.dir.x * 8; P.ky += A.dir.y * 8; }
      }
      if (r.hitX || r.hitY) {
        if (A.id === 'charge') {                                           // crashing into a wall: stunned + armor broken
          e.stun = 1.6; e.armor = 0; e.ab = null; Camera.shake(5); Game.hitstop = 0.08; Snd.sfx('slam');
          Combat.text(e.x, e.y - 0.5, 'BENOMMEN!', '#ffd34a', true); Particles.burst(e.x, e.y, 8, 16, { col: '#ffd34a', speed: 4, up: 50, life: 0.5, size: 1, grav: 120 });
          return true;
        }
        A.t = 0;
      }
      if (A.t <= 0) { A.ph = 'rec'; A.t = p.rec || 0.3; }
    } else if (A.t <= 0) { if (A.id === 'backstep') e.cd = 0; e.ab = null; }
    return true;
  },
  ring(ctx, cam, x, y, r, stroke, fill, k) {
    const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.283, q = Iso.toScreen(x + Math.cos(a) * r, y + Math.sin(a) * r, cam); pts.push([Math.round(q.x), Math.round(q.y)]); }
    const path = (pp) => { ctx.beginPath(); pp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
    const c = Iso.toScreen(x, y, cam); path(pts); ctx.strokeStyle = stroke; ctx.stroke();
    path(pts.map(q => [Math.round(c.x + (q[0] - c.x) * k), Math.round(c.y + (q[1] - c.y) * k)])); ctx.fillStyle = fill; ctx.fill();
  },
  drawTel(ctx, cam) {   // telegraphs: lines (pounce, charge), rings (pound, summon, blasts)
    ctx.lineWidth = 3;
    for (const e of Combat.enemies) {
      const A = e.ab; if (!A || A.ph !== 'wind') continue;
      const p = Abilities.PARAM[A.id], k = 1 - A.t / p.wind;
      if (p.len) {
        const a = Iso.toScreen(e.x, e.y, cam), b = Iso.toScreen(e.x + A.dir.x * p.len, e.y + A.dir.y * p.len, cam), m = Iso.toScreen(e.x + A.dir.x * p.len * k, e.y + A.dir.y * p.len * k, cam);
        ctx.strokeStyle = 'rgba(255,60,50,.28)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,90,60,.8)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(m.x, m.y); ctx.stroke();
      } else Abilities.ring(ctx, cam, e.x, e.y, p.r, A.id === 'summon' ? 'rgba(170,90,255,.9)' : 'rgba(255,60,50,.9)', A.id === 'summon' ? 'rgba(150,80,255,.25)' : 'rgba(255,50,40,.28)', k);
    }
    ctx.lineWidth = 1;
    for (const b of Combat.blasts) Abilities.ring(ctx, cam, b.x, b.y, b.r, 'rgba(255,150,50,.9)', 'rgba(255,120,30,.3)', 1 - b.t / b.max);
  }
};
