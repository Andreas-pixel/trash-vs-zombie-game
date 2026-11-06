// Trash Vs. Nazi-Zombies - Partikel und Flecken
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ PARTICLES & DECALS ============ */
const Particles = {
  list: [], decals: [], stepT: 0,
  reset() { Particles.list = []; Particles.decals = []; },
  burst(x, y, z, n, o) {    // z = height above floor in px; grav 0 = floats
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, sp = (o.speed || 3) * (0.4 + Math.random() * 0.6), life = o.life || 0.5;
      Particles.list.push({ x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: (o.up || 40) * (0.5 + Math.random()),
        life, max: life, col: o.col, size: o.size || 1, grav: o.grav === undefined ? 160 : o.grav, decal: o.decal });
    }
  },
  puff(x, y, n) { Particles.burst(x, y, 1, n, { col: 'rgba(200,190,170,.55)', speed: 1.2, up: 14, life: 0.35, size: 2, grav: 20 }); },
  update(dt) {
    for (const p of Particles.list) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= p.grav * dt; p.z += p.vz * dt;
      if (p.grav > 0 && p.z <= 0) { if (p.decal && Particles.decals.length < 140) Particles.decals.push({ x: p.x, y: p.y, col: p.col, s: p.size }); p.life = 0; }
      if (Room.solid(p.x, p.y)) { p.vx = p.vy = 0; }
    }
    Particles.list = Particles.list.filter(p => p.life > 0);
    if (Player.moving && !Player.dash.active && !Player.dead && (Particles.stepT -= dt) <= 0) { Particles.stepT = 0.16; Particles.puff(Player.x, Player.y, 1); }   // footstep dust
    if (Room.w && Math.random() < dt * 5)                                                                                                                     // ambient dust motes
      Particles.list.push({ x: 1 + Math.random() * (Room.w - 2), y: 1 + Math.random() * (Room.h - 2), z: 6 + Math.random() * 20, vx: 0.1, vy: 0.05, vz: 2, life: 4, max: 4, col: 'rgba(230,210,170,.6)', size: 1, grav: 0 });
  },
  drawDecals(ctx, cam) {
    ctx.globalAlpha = 0.55;
    for (const d of Particles.decals) { const p = Iso.toScreen(d.x, d.y, cam); ctx.fillStyle = d.col; ctx.fillRect(Math.round(p.x) - d.s, Math.round(p.y), d.s * 2, Math.max(1, d.s)); }
    ctx.globalAlpha = 1;
  },
  draw(ctx, cam) {
    for (const p of Particles.list) {
      const s = Iso.toScreen(p.x, p.y, cam); ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      ctx.fillStyle = p.col; ctx.fillRect(Math.round(s.x), Math.round(s.y - p.z), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
};
