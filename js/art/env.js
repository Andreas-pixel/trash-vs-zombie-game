// Trash Vs. Nazi-Zombies - Moebel, Waende, Deko, Props, Muell-Grafik
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ ENV (painted environment: furniture per biome, tall back walls with decor, floor decor, props, trash) ============ */
const Env = {
  FURN: [['counter', 'stove', 'table', 'cabinet'], ['dresser', 'shoes', 'coat', 'plant'], ['vanity', 'wc', 'tub', 'washer'], ['mshelf', 'boiler', 'washer', 'sofa'], ['sandbags', 'console', 'maptable', 'generator']],   // per biome
  DECO: [['rug', 'crack', 'stain'], ['runner', 'mat', 'stain'], ['puddle', 'bathmat', 'drain'], ['cables', 'drain', 'oil'], ['rubble', 'cables', 'oil']],
  TRASH: ['can', 'bottle', 'banana', 'box'],
  WH: 40, imgs: {},                                                     // WH = height of the back walls in logical px
  biome() { return Math.max(0, CFG.biomes.indexOf(Run.biome)) % Env.FURN.length; },
  P(u, v, z) { return [(u - v) * 16, (u + v) * 8 - z]; },             // tile-local iso point (origin = top corner of the tile)
  path(g, pts) { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); },
  fillPts(g, pts, col, stroke) { Env.path(g, pts); g.fillStyle = col; g.fill(); if (stroke !== false) { g.lineWidth = 0.6; g.lineJoin = 'round'; g.strokeStyle = PAL.ink; g.stroke(); } },
  line(g, a, b, w, col) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = w; g.lineCap = 'round'; g.strokeStyle = col; g.stroke(); },
  poly(g, pts, w, col) { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.stroke(); },
  ell(g, c, rx, ry, col, stroke) { g.beginPath(); g.ellipse(c[0], c[1], rx, ry, 0, 0, 6.3); g.fillStyle = col; g.fill(); if (stroke) { g.lineWidth = 0.6; g.strokeStyle = stroke; g.stroke(); } },
  isoEll(cu, cv, r, z) { const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832; pts.push(Env.P(cu + Math.cos(a) * r, cv + Math.sin(a) * r, z || 0)); } return pts; },
  quad(F, s0, t0, s1, t1) { return [F(s0, t1), F(s1, t1), F(s1, t0), F(s0, t0)]; },
  FL(u0, u1, v, z0, z1) { return (s, t) => Env.P(u0 + (u1 - u0) * s, v, z0 + (z1 - z0) * t); },        // point on a left face (v = const)
  FR(u, v0, v1, z0, z1) { return (s, t) => Env.P(u, v1 - (v1 - v0) * s, z0 + (z1 - z0) * t); },        // point on a right face (u = const), left to right
  face(g, pts, col, dark) {
    Env.path(g, pts); const ys = pts.map(q => q[1]), gr = g.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
    gr.addColorStop(0, Paint.mix(col, '#ffffff', 0.07)); gr.addColorStop(1, Paint.mix(col, PAL.night, dark));
    g.fillStyle = gr; g.fill(); g.lineWidth = 0.7; g.lineJoin = 'round'; g.strokeStyle = PAL.ink; g.stroke();
  },
  box(g, u0, v0, u1, v1, z0, h, col, o) {   // painted iso box: dark left face, lit right face, light top, cyan rim on the lit edge
    o = o || {}; const P = Env.P, t = z0 + h;
    Env.face(g, [P(u0, v1, t), P(u1, v1, t), P(u1, v1, z0), P(u0, v1, z0)], o.l || Paint.mix(col, PAL.night, 0.3), 0.4);
    Env.face(g, [P(u1, v0, t), P(u1, v1, t), P(u1, v1, z0), P(u1, v0, z0)], o.r || col, 0.3);
    Env.face(g, [P(u0, v0, t), P(u1, v0, t), P(u1, v1, t), P(u0, v1, t)], o.t || Paint.mix(col, '#ffffff', 0.14), 0.12);
    if (o.rim !== false) Env.line(g, P(u1, v0, t), P(u1, v0, z0), 0.6, (o.rimCol || PAL.neonCyan) + '66');
  },
  star(g, c, r, col) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? g.lineTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr) : g.moveTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 0.4; g.strokeStyle = PAL.ink; g.stroke(); },
  glowLine(g, pts, col, w) { g.save(); g.shadowColor = col; g.shadowBlur = 6; Env.poly(g, pts, w || 1, col); g.restore(); },
  shadow(g) { Env.fillPts(g, Env.isoEll(0.5, 0.5, 0.5), 'rgba(4,6,10,.38)', false); },
  overgrow(g, rnd) {   // weeds pushing up around the furniture
    for (let i = 0; i < 2; i++) if (rnd() < 0.55) { const q = Env.P(0.1 + rnd() * 0.8, 0.96, 0); Decay.weeds(g, rnd, q[0], q[1], 2 + Math.floor(rnd() * 3)); }
    if (rnd() < 0.35) { const q = Env.P(0.96, 0.15 + rnd() * 0.7, 0); Decay.weeds(g, rnd, q[0], q[1], 3); }
  },   // contact shadow under furniture
  plinth(g, col) { Env.box(g, .06, .06, .94, .94, 0, 2, col || '#262a33', { rim: false }); },   // slim props stand on a full-tile base: the hitbox is visible

  /* ---- furniture (interior obstacles keep their full-tile hitbox; only the look changes) ---- */
  FD: {
    counter(g) { const E = Env, P = E.P; E.box(g, .08, .1, .92, .9, 0, 14, '#4b5866');
      const F = E.FL(.08, .92, .9, 0, 14); for (const s of [1 / 3, 2 / 3]) E.line(g, F(s, .12), F(s, .9), .5, PAL.ink); for (const s of [.27, .73]) E.line(g, F(s, .74), F(s, .56), .8, '#b8c4cc');
      E.box(g, .04, .06, .96, .94, 14, 2, '#c3ced4');
      E.ell(g, P(.5, .46, 16), 5, 2.4, '#3b4954', PAL.ink); E.ell(g, P(.52, .48, 16), 3.6, 1.6, '#24303a');
      E.line(g, P(.5, .2, 16), P(.5, .2, 21), 1, '#d6dde2'); E.line(g, P(.5, .2, 21), P(.5, .34, 21), 1, '#d6dde2'); },
    stove(g) { const E = Env, P = E.P; E.box(g, .1, .1, .9, .9, 0, 14, '#3a3f48');
      const F = E.FL(.1, .9, .9, 0, 14); E.fillPts(g, E.quad(F, .15, .2, .85, .64), '#141820'); E.line(g, F(.2, .57), F(.8, .57), .5, 'rgba(160,190,200,.35)'); E.line(g, F(.2, .82), F(.8, .82), .9, '#9aa3ad');
      E.box(g, .08, .08, .92, .92, 14, 1.5, '#1d2128');
      for (const [u, v] of [[.3, .3], [.7, .3], [.3, .7], [.7, .7]]) { E.ell(g, P(u, v, 15.5), 3, 1.5, '#2b3038', '#5a626e'); E.ell(g, P(u, v, 15.5), 1.4, .7, '#141820'); } },
    table(g) { const E = Env, P = E.P;
      for (const [u, v] of [[.12, .12], [.8, .12], [.12, .8], [.8, .8]]) E.box(g, u, v, u + .08, v + .08, 0, 12, '#4e3a2a', { rim: false });
      E.box(g, .06, .06, .94, .94, 12, 2, '#7a5a3e');
      E.ell(g, P(.38, .45, 14), 2.8, 1.4, '#cfd8dc', PAL.ink); E.ell(g, P(.38, .45, 14), 1.6, .7, '#9aa8b0');
      E.line(g, P(.66, .64, 14), P(.66, .64, 17), 2.6, PAL.ink); E.line(g, P(.66, .64, 14), P(.66, .64, 17), 1.8, '#b05a6a'); },
    cabinet(g) { const E = Env; E.box(g, .14, .2, .86, .8, 0, 30, '#3f4f5e');
      const F = E.FL(.14, .86, .8, 0, 30); E.line(g, F(.5, .04), F(.5, .96), .5, PAL.ink); E.line(g, F(.02, .5), F(.98, .5), .5, PAL.ink);
      E.fillPts(g, E.quad(F, .08, .56, .44, .92), 'rgba(140,190,210,.16)', false); E.fillPts(g, E.quad(F, .56, .56, .92, .92), 'rgba(140,190,210,.16)', false);
      for (const s of [.18, .3, .7, .82]) E.ell(g, F(s, .63), 1.5, .7, '#cfd8dc', PAL.ink);
      for (const s of [.44, .56]) E.line(g, F(s, .32), F(s, .2), .8, '#b8c4cc'); },
    dresser(g) { const E = Env, P = E.P; E.box(g, .08, .18, .92, .82, 0, 14, '#6b4a35');
      const F = E.FL(.08, .92, .82, 0, 14); for (const t of [.36, .68]) E.line(g, F(.03, t), F(.97, t), .5, PAL.ink);
      for (const t of [.18, .52, .84]) for (const s of [.3, .7]) E.ell(g, F(s, t), .8, .6, '#d8c080');
      E.line(g, P(.3, .4, 14), P(.3, .4, 21), .9, '#2a2620'); E.fillPts(g, [P(.2, .4, 27), P(.4, .4, 27), P(.45, .4, 20.5), P(.15, .4, 20.5)], '#8e4869'); },
    shoes(g) { const E = Env, P = E.P; E.box(g, .1, .14, .9, .86, 0, 7, '#3d3a40');
      const F = E.FL(.1, .9, .86, 0, 7); E.line(g, F(.02, .5), F(.98, .5), .5, PAL.ink);
      [['#cfc8bc', .28], ['#6d72a5', .5], ['#8e4869', .72]].forEach(([c, u]) => { E.ell(g, P(u, .44, 7.6), 2.4, 1.2, c, PAL.ink); E.ell(g, P(u + .05, .56, 7.6), 2.4, 1.2, Paint.mix(c, PAL.night, .2), PAL.ink); }); },
    coat(g) { const E = Env, P = E.P; E.box(g, .08, .1, .92, .9, 0, 7, '#4a3a2c');   // bench with a coat stand
      E.ell(g, P(.5, .5, 7), 4.5, 2.2, '#24221e', PAL.ink);
      E.line(g, P(.5, .5, 7), P(.5, .5, 38), 2.6, PAL.ink); E.line(g, P(.5, .5, 7), P(.5, .5, 38), 1.5, '#5a4632');
      for (const [dx, c] of [[-3.6, '#357079'], [3.3, '#8e4869']]) { const a = P(.5, .5, 34); g.save(); g.translate(a[0] + dx, a[1]); Paint.shape(g, gg => Paint.rr(gg, -2.7, 0, 5.4, 14, 2.2), c, [-2.7, 0, 2.7, 14]); g.restore(); }
      E.ell(g, P(.5, .5, 38), 2.2, 1, '#5a4632', PAL.ink); },
    plant(g) { const E = Env, P = E.P; E.box(g, .1, .1, .9, .9, 0, 8, '#6a3f30');   // large planter box
      E.fillPts(g, [P(.16, .16, 8), P(.84, .16, 8), P(.84, .84, 8), P(.16, .84, 8)], '#2a1c16', false);
      const c = P(.5, .5, 8); for (const [x, y, r] of [[-5, -7, 2.6], [5, -9, 2.8], [-5, -14, 3.2], [4, -16, 3.4], [1, -12, 3.6], [-1, -21, 3.6]]) { E.ell(g, [c[0] + x, c[1] + y], r, r * .7, '#2c5a44', PAL.ink); E.ell(g, [c[0] + x - .8, c[1] + y - .6], r * .45, r * .3, '#4f8a64'); } },
    vanity(g) { const E = Env, P = E.P; E.box(g, .12, .14, .88, .86, 0, 13, '#c9d4d8');
      const F = E.FL(.12, .88, .86, 0, 13); E.line(g, F(.5, .1), F(.5, .9), .5, PAL.ink); for (const s of [.42, .58]) E.ell(g, F(s, .6), .7, .7, '#7d8a90');
      E.ell(g, P(.5, .5, 13), 6, 3, '#eef4f5', PAL.ink); E.ell(g, P(.52, .52, 13), 4.2, 2, '#8fa8b0'); E.ell(g, P(.53, .53, 13), 1, .5, '#2c3c42');
      E.line(g, P(.5, .22, 13), P(.5, .22, 17), 1.1, '#dfe6ea'); E.line(g, P(.5, .22, 17), P(.5, .32, 17), 1.1, '#dfe6ea'); },
    wc(g) { const E = Env, P = E.P; E.plinth(g, '#9fb0b6'); E.box(g, .28, .14, .72, .38, 0, 21, '#e3ebee');
      E.box(g, .33, .36, .67, .82, 0, 8, '#d6e0e3');
      E.ell(g, P(.5, .6, 8.5), 4.4, 2.4, '#f2f6f7', PAL.ink); E.ell(g, P(.5, .62, 8.5), 2.8, 1.4, '#3e5a62');
      E.line(g, P(.64, .2, 21), P(.64, .2, 22.6), 1.4, '#b8c4cc'); },
    tub(g) { const E = Env, P = E.P; E.box(g, .06, .08, .94, .92, 0, 12, '#dfe8eb');
      const c = P(.5, .5, 12); E.ell(g, c, 10.5, 5, '#c6d2d6', PAL.ink); E.ell(g, [c[0] + .5, c[1] + .6], 8.6, 3.8, '#2d5058'); E.ell(g, [c[0] - 2.5, c[1] - .4], 3, .7, 'rgba(160,220,230,.5)');
      E.line(g, P(.16, .5, 12), P(.16, .5, 16), 1, '#d0d8dc'); E.line(g, P(.16, .5, 16), P(.24, .5, 16), 1, '#d0d8dc'); },
    washer(g) { const E = Env; E.box(g, .12, .12, .88, .88, 0, 18, '#c5ced2');
      const F = E.FL(.12, .88, .88, 0, 18), c = F(.5, .42); E.ell(g, c, 4.2, 4.6, '#8e9ca2', PAL.ink); E.ell(g, c, 3, 3.3, '#253038'); E.ell(g, [c[0] - 1, c[1] - 1.2], 1, .6, 'rgba(200,230,240,.5)');
      E.line(g, F(.06, .84), F(.94, .84), .5, PAL.ink); E.ell(g, F(.8, .92), .7, .5, '#357079'); },
    sandbags(g) { const E = Env, P = E.P, cols = ['#8a7a5a', '#7a6c50', '#968660'];
      for (let r = 0; r < 3; r++) for (const v of [.36, .66]) for (let i = 0; i < 3; i++) { const u = .2 + i * .3 + (r % 2) * .1; if (u > .86) continue; const c = P(u, v, 3 + r * 4.4); E.ell(g, c, 4.4, 2.5, cols[(i + r) % 3], PAL.ink); E.line(g, [c[0] - 2.6, c[1] - .6], [c[0] + 1.6, c[1] - 1.2], .4, 'rgba(255,240,200,.25)'); } },
    console(g) { const E = Env, P = E.P; E.box(g, .1, .2, .9, .8, 0, 12, '#3a3f3a');
      E.fillPts(g, [P(.1, .2, 12), P(.9, .2, 12), P(.9, .55, 18), P(.1, .55, 18)], '#2c312c');
      for (const u of [.2, .5]) E.fillPts(g, [P(u, .28, 13.5), P(u + .24, .28, 13.5), P(u + .24, .48, 16.8), P(u, .48, 16.8)], '#1d2a22');
      E.line(g, P(.24, .4, 15.2), P(.4, .4, 15.2), .4, 'rgba(90,150,110,.6)'); E.line(g, P(.54, .36, 14.6), P(.68, .44, 15.8), .4, 'rgba(90,150,110,.6)');
      for (const [u, c] of [[.3, '#7a2a22'], [.45, '#a07a30'], [.6, '#7a2a22'], [.75, '#4a6a4a']]) E.ell(g, P(u, .66, 12), 1, .6, c, PAL.ink); },
    maptable(g) { const E = Env, P = E.P;
      for (const [u, v] of [[.12, .12], [.8, .12], [.12, .8], [.8, .8]]) E.box(g, u, v, u + .08, v + .08, 0, 12, '#3a3028', { rim: false });
      E.box(g, .06, .06, .94, .94, 12, 2, '#5a4a38');
      E.fillPts(g, [P(.14, .14, 14), P(.86, .14, 14), P(.86, .86, 14), P(.14, .86, 14)], '#b8a882');
      Env.poly(g, [P(.2, .3, 14), P(.35, .42, 14), P(.5, .36, 14), P(.62, .55, 14), P(.8, .5, 14)], .6, 'rgba(70,60,45,.8)');
      for (const [u, v] of [[.36, .42], [.6, .55], [.48, .7]]) E.ell(g, P(u, v, 14), .9, .6, '#a03020', PAL.ink); },
    generator(g) { const E = Env, P = E.P; E.box(g, .12, .18, .88, .82, 0, 14, '#4a4f4a');
      const F = E.FL(.12, .88, .82, 0, 14); for (let i = 1; i < 6; i++) E.line(g, F(.1, i / 6.5), F(.6, i / 6.5), .5, PAL.ink);
      E.fillPts(g, E.quad(F, .68, .5, .9, .78), '#c8a030'); E.line(g, F(.7, .64), F(.88, .64), .4, PAL.ink);
      E.line(g, P(.7, .3, 14), P(.7, .3, 24), 2.4, PAL.ink); E.line(g, P(.7, .3, 14), P(.7, .3, 24), 1.4, '#5a5550'); E.ell(g, P(.7, .3, 25), 1.6, 1, 'rgba(30,30,30,.6)'); },
    mshelf(g) { const E = Env, cols = ['#6d72a5', '#8e4869', '#357079', '#a07a50', '#cfd8dc'];
      for (const [u, v] of [[.12, .22], [.82, .22]]) E.box(g, u, v, u + .06, v + .06, 0, 30, '#5d6670', { rim: false });
      for (const z of [0, 10, 20]) {
        E.box(g, .1, .2, .9, .8, z + 1, 1.2, '#7d8790', { rim: false });
        for (let i = 0; i < 3; i++) { const u = .17 + i * .24 + ((z / 10 + i) % 2) * .04; E.box(g, u, .32, u + .14, .58, z + 2.2, 4 + ((i + z / 10) % 3) * 1.5, cols[(i + z / 10) % 5], { rim: false }); }
      }
      for (const [u, v] of [[.12, .72], [.82, .72]]) E.box(g, u, v, u + .06, v + .06, 0, 30, '#5d6670', { rim: false });
      E.box(g, .1, .2, .9, .8, 30, 1.2, '#7d8790'); },
    boiler(g) { const E = Env; E.plinth(g, '#3a3f46'); const c = E.P(.5, .5, 2), r = 8, h = 30;
      const gr = g.createLinearGradient(c[0] - r, 0, c[0] + r, 0); gr.addColorStop(0, '#3e444c'); gr.addColorStop(.62, '#8e979f'); gr.addColorStop(1, '#c8d0d6');
      g.beginPath(); g.ellipse(c[0], c[1], r, r / 2, 0, 0, Math.PI); g.lineTo(c[0] - r, c[1] - h); g.ellipse(c[0], c[1] - h, r, r / 2, 0, Math.PI, 2 * Math.PI); g.closePath();
      g.fillStyle = gr; g.fill(); g.lineWidth = .7; g.strokeStyle = PAL.ink; g.stroke();
      E.ell(g, [c[0], c[1] - h], r, r / 2, '#b8c0c6', PAL.ink);
      for (const z of [8, 22]) { g.beginPath(); g.ellipse(c[0], c[1] - z, r, r / 2, 0, 0, Math.PI); g.strokeStyle = 'rgba(10,12,18,.5)'; g.lineWidth = .6; g.stroke(); }
      E.line(g, [c[0] - 2.5, c[1] - h], [c[0] - 2.5, c[1] - h - 9], 1.6, '#b0703a'); E.line(g, [c[0] + 3, c[1] - h - 1], [c[0] + 3, c[1] - h - 9], 1.6, '#b0703a');
      E.ell(g, [c[0] + 1.5, c[1] - 14], 2, 2, '#e8eef0', PAL.ink); E.line(g, [c[0] + 1.5, c[1] - 14], [c[0] + 2.4, c[1] - 15.2], .5, PAL.ink); },
    sofa(g) { const E = Env; E.box(g, .08, .16, .92, .34, 0, 17, '#4e4062');
      E.box(g, .08, .32, .92, .86, 0, 8, '#5a4a6e');
      E.box(g, .08, .3, .2, .86, 8, 4, '#4e4062', { rim: false }); E.box(g, .8, .3, .92, .86, 8, 4, '#4e4062');
      E.line(g, E.P(.5, .34, 8), E.P(.5, .86, 8), .5, PAL.ink); E.ell(g, E.P(.62, .6, 8.2), 2.6, 1.2, 'rgba(10,12,18,.35)'); }
  },

  /* ---- interactable props (origin = feet) ---- */
  PD: {
    container(g) { const E = Env, P = E.P;
      for (const [u, v] of [[.2, .8], [.8, .8]]) E.ell(g, P(u, v, 0), 1.5, 1, '#111', PAL.ink);
      E.box(g, .12, .2, .88, .8, 1, 14, '#2c5a46');
      const F = E.FL(.12, .88, .8, 1, 15); for (const s of [.33, .66]) E.line(g, F(s, .08), F(s, .82), .5, 'rgba(10,12,18,.5)');
      E.box(g, .1, .18, .9, .82, 15, 2.4, '#21483a');
      E.glowLine(g, [P(.12, .82, 16), P(.9, .82, 16)], PAL.neonGreen, 1); },                     // trash = green
    terminal(g, f) { const E = Env; E.box(g, .2, .22, .8, .78, 0, 29, '#c5d0d6');
      const F = E.FL(.2, .8, .78, 0, 29); E.line(g, F(.03, .62), F(.97, .62), .6, PAL.ink);
      E.line(g, F(.86, .9), F(.86, .7), 1.2, '#7d8a90'); E.line(g, F(.86, .5), F(.86, .14), 1.2, '#7d8a90');
      [['#da5784', .2, .82], ['#ffd34a', .4, .76], ['#49ac95', .24, .14]].forEach(([c, s, t]) => E.ell(g, F(s, t), 1, .9, c, PAL.ink));
      g.save(); g.shadowColor = PAL.neonCyan; g.shadowBlur = f ? 10 : 5; E.fillPts(g, E.quad(F, .3, .26, .7, .5), f ? '#6ff4ee' : '#2fb8b3'); g.restore();   // skill note = interaction cyan
      E.line(g, F(.36, .42), F(.62, .42), .5, '#0d3a3a'); E.line(g, F(.36, .34), F(.54, .34), .5, '#0d3a3a'); },
    rack(g) { const E = Env;
      for (const u of [.24, .7]) E.box(g, u, .42, u + .07, .6, 0, 3, '#3a2a1e', { rim: false });
      E.box(g, .2, .46, .8, .56, 3, 21, '#6a4a32');
      const F = E.FL(.2, .8, .56, 3, 24);
      E.line(g, F(.2, .12), F(.2, .92), 1.2, '#8a6a40'); E.fillPts(g, E.quad(F, .1, .04, .3, .22), '#d8b860');
      E.ell(g, F(.52, .62), 3.2, 3.2, '#4a505a', PAL.ink); E.line(g, F(.52, .45), F(.52, .1), 1.3, '#2a2d33');
      E.line(g, F(.8, .86), F(.8, .46), 1, '#dfe8ee'); E.line(g, F(.8, .46), F(.8, .28), 1.5, '#26262e');
      E.glowLine(g, [F(.05, .98), F(.95, .98)], PAL.neonCyan, .8); },
    wardrobe(g) { const E = Env; E.box(g, .18, .26, .82, .74, 0, 30, '#5e4632');
      const F = E.FL(.18, .82, .74, 0, 30); E.line(g, F(.5, .04), F(.5, .96), .6, PAL.ink); for (const s of [.44, .56]) E.ell(g, F(s, .5), .7, .9, '#d8c080');
      E.box(g, .16, .24, .84, .76, 30, 2, '#4e3a28');
      const h = F(.25, .78); E.glowLine(g, [[h[0] - 2.2, h[1] + 1.6], [h[0], h[1]], [h[0] + 2.2, h[1] + 1.6], [h[0] - 2.2, h[1] + 1.6]], PAL.neonCyan, .7); E.glowLine(g, [[h[0], h[1]], [h[0], h[1] - 1.4]], PAL.neonCyan, .7); }
  },

  /* ---- trash (frames 24x22, origin = feet) ---- */
  TD: {
    can(g) { const body = [[-3.5, 0], [3.5, 0], [4, -3], [2.6, -5], [4.2, -7.5], [3.2, -10], [-3.2, -10], [-4.2, -7.6], [-2.4, -5.2], [-4, -2.8]];
      Paint.shape(g, gg => { body.forEach((q, i) => i ? gg.lineTo(q[0], q[1]) : gg.moveTo(q[0], q[1])); gg.closePath(); }, '#4f62c8', [-4.2, -10, 4.2, 0], 'rgba(0,0,0,0)');
      g.fillStyle = 'rgba(218,87,132,.75)'; g.fillRect(-2.6, -8.6, 3.2, 2.6); g.fillRect(-1, -3.4, 3, 2); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(1.4, -9.2, .8, 7.6);
      Env.poly(g, [[-3.6, -5], [-1, -4.4], [1.6, -5.4], [3.4, -4.8]], .5, 'rgba(10,12,18,.55)');
      Env.ell(g, [0, -10], 3.3, 1.2, '#49ac95', PAL.ink); Env.ell(g, [1.3, -10.6], 1.3, .55, '#c8d0f0', PAL.ink); },
    bottle(g) { g.save(); g.translate(0, -1); g.rotate(-0.45);
      Paint.shape(g, gg => { gg.moveTo(-6.5, 0); gg.lineTo(2, 0); gg.quadraticCurveTo(4, 0, 4.6, .7); gg.lineTo(8, .7); gg.lineTo(8, -2.9); gg.lineTo(4.6, -2.9); gg.quadraticCurveTo(4, -4.4, 2, -4.4); gg.lineTo(-6.5, -4.4); gg.closePath(); }, '#7a4a1e', [-6.5, -4.4, 8, 0], 'rgba(0,0,0,0)');
      g.fillStyle = '#c9b98a'; g.fillRect(-4.4, -4.1, 3.6, 3.8); g.fillStyle = 'rgba(255,220,170,.45)'; g.fillRect(-6, -3.9, 7.5, .8); g.restore(); },
    banana(g) { for (const [x, y] of [[-6.5, -1.2], [6.5, -1], [-2.6, -6.5], [3.4, -6]]) {
        Paint.shape(g, gg => { gg.moveTo(0, -2.6); gg.quadraticCurveTo(x * .5 - y * .2, y * .5 - 1.8, x, y); gg.quadraticCurveTo(x * .5 + y * .2, y * .5 + .4, 0, -1.2); gg.closePath(); }, '#c9a640', [Math.min(0, x), Math.min(-2.6, y), Math.max(0, x), 0], 'rgba(0,0,0,0)');
        Env.ell(g, [x, y], 1, .75, '#5a3a1e'); }
      Env.ell(g, [0, -2.2], 1.7, 1.25, '#e8d070', PAL.ink); Env.line(g, [0, -3], [.5, -5.4], 1.3, '#5a3a1e'); },
    box(g) { const E = Env, P = E.P; g.translate(0, -8);
      E.box(g, .2, .2, .8, .8, 0, 10, '#b8935c', { rim: false, t: '#d2b07a' });
      E.line(g, P(.5, .2, 10), P(.5, .8, 10), 1.3, '#e2cf9e');
      E.fillPts(g, [P(.2, .8, 10), P(.5, .8, 10), P(.44, 1.02, 13), P(.12, 1, 12.5)], '#a8824e');
      const F = E.FL(.2, .8, .8, 0, 10); E.star(g, F(.3, .5), 1.5, '#d24b4b'); E.star(g, F(.74, .62), 1.3, '#4a6ad0');
      E.star(g, E.FR(.8, .2, .8, 0, 10)(.55, .45), 1.3, '#e8c040'); }
  },

  /* ---- back walls: room-facing face with biome surface + decor (0 plain, 1 window, 2 poster, 3 neon sign) ---- */
  wallFrame(g, b, idx) {
    const E = Env, th = Paint.THEME[b], WH = E.WH, vv = idx % 4, F = idx < 4 ? E.FL(0, 1, 1, 0, WH) : E.FR(1, 0, 1, 0, WH), rnd = Paint.rng(b * 31 + idx * 7 + 3);
    E.box(g, 0, 0, 1, 1, 0, WH, th.wr, { l: th.wl, r: th.wr, t: '#0c0f16', rim: false });
    const P = E.P; E.line(g, P(0, 1, WH), P(1, 1, WH), .7, th.ac + '55'); E.line(g, P(1, 0, WH), P(1, 1, WH), .7, th.ac + '55');
    const ln = (s0, t0, s1, t1, c, w) => E.line(g, F(s0, t0), F(s1, t1), w || .45, c || 'rgba(8,10,16,.4)');
    if (b === 0) { E.fillPts(g, E.quad(F, 0, .07, 1, .46), Paint.mix(th.wr, '#cfe0e6', .12), false); for (let i = 1; i < 6; i++) ln(0, .07 + i * .065, 1, .07 + i * .065); for (let i = 1; i < 6; i++) ln(i / 6, .07, i / 6, .46); ln(0, .46, 1, .46, PAL.ink, .6); }
    if (b === 1) { for (let i = 0; i < 8; i++) E.fillPts(g, E.quad(F, i / 8, .4, i / 8 + .06, 1), 'rgba(207,224,230,.07)', false); ln(0, .4, 1, .4, 'rgba(207,224,230,.25)', .9); ln(0, .38, 1, .38, PAL.ink, .5); }
    if (b === 2) { for (let i = 1; i < 10; i++) ln(0, .07 + i * .093, 1, .07 + i * .093); for (let i = 1; i < 4; i++) ln(i / 4, .07, i / 4, 1); }
    if (b === 3) { for (let r = 0; r < 6; r++) { const t = .07 + r * .155; ln(0, t, 1, t); for (let i = 0; i < 2; i++) { const s = (i + (r % 2) * .5) / 2 + .25; ln(s, t, s, t + .155); } } }
    if (b === 4) {   // bunker: concrete panels with rivets and a pipe
      for (const t of [.38, .7]) ln(0, t, 1, t, 'rgba(8,8,8,.5)', .6); ln(.5, .07, .5, 1, 'rgba(8,8,8,.5)', .6);
      for (const [rs, rt] of [[.08, .34], [.92, .34], [.08, .66], [.92, .66], [.42, .5], [.58, .5]]) E.ell(g, F(rs, rt), .5, .5, '#8a827a', PAL.ink);
      E.line(g, F(0, .84), F(1, .84), 2.6, PAL.ink); E.line(g, F(0, .84), F(1, .84), 1.6, '#4a423a'); E.line(g, F(0, .865), F(1, .865), .4, 'rgba(255,200,150,.25)');
      for (const bs of [.25, .75]) E.line(g, F(bs, .8), F(bs, .89), 1, '#2a2522');
      if (vv === 1) { E.fillPts(g, E.quad(F, .3, .36, .7, .6), '#141210'); for (let i = 1; i < 5; i++) ln(.32, .36 + i * .048, .68, .36 + i * .048, '#3a3530', .7); }
      if (vv === 2) { E.fillPts(g, E.quad(F, .26, .3, .74, .74), 'rgba(160,140,100,.75)'); Env.poly(g, [F(.32, .4), F(.4, .5), F(.5, .46), F(.58, .6), F(.68, .55)], .5, 'rgba(60,50,40,.7)'); for (const [ps, pt] of [[.4, .5], [.6, .62], [.5, .38]]) E.ell(g, F(ps, pt), .7, .7, '#a03020'); }
      if (vv === 3) { const c = F(.5, .7); g.save(); g.shadowColor = '#ff4a1a'; g.shadowBlur = 8; E.ell(g, c, 2.6, 2.2, '#ff5a2a', PAL.ink); g.restore(); for (const dx of [-1.3, 0, 1.3]) E.line(g, [c[0] + dx, c[1] - 2], [c[0] + dx, c[1] + 2], .4, PAL.ink); E.fillPts(g, E.quad(F, .42, .6, .58, .64), '#2a2522'); }
    }
    E.fillPts(g, E.quad(F, 0, 0, 1, .07), Paint.mix(th.wl, PAL.night, .45));                       // baseboard: wall clearly ends at the floor
    if (rnd() < .7) E.fillPts(g, E.quad(F, .1 + rnd() * .5, .1 + rnd() * .3, .4 + rnd() * .5, .2 + rnd() * .4), th.stain + '24', false);   // damp stains
    if (vv === 1 && b !== 4) {   // window with cold light
      const pts = E.quad(F, .2, .4, .8, .88), gr = g.createLinearGradient(0, pts[0][1], 0, pts[3][1]); gr.addColorStop(0, '#a8d8e8'); gr.addColorStop(1, '#2f5f74');
      E.path(g, pts); g.fillStyle = gr; g.fill(); g.lineWidth = .9; g.strokeStyle = PAL.ink; g.stroke();
      ln(.5, .4, .5, .88, PAL.ink, .8); ln(.2, .66, .8, .66, PAL.ink, .8); E.line(g, F(.16, .38), F(.84, .38), 1.3, '#cfe0e6');
      for (let i = 0; i < 4; i++) { const s = .25 + rnd() * .5, t = .5 + rnd() * .3; E.line(g, F(s, t), F(s + .05, t - .03), .4, 'rgba(255,255,255,.5)'); }
    }
    if (vv === 2 && b !== 4) {   // poster (abstract, no text)
      const cols = [PAL.rose, PAL.indigo, PAL.petrol, '#a07a50'], c = cols[(b + idx) % 4];
      E.fillPts(g, E.quad(F, .28, .34, .72, .82), c); E.fillPts(g, E.quad(F, .34, .4, .66, .54), Paint.mix(c, PAL.night, .4), false);
      const cc = F(.5, .66); E.ell(g, cc, 2.4, 2.8, Paint.mix(c, '#ffffff', .35)); E.fillPts(g, [F(.62, .82), F(.72, .82), F(.72, .74)], Paint.mix(th.wr, PAL.night, .2), false);
    }
    if (vv === 3 && b !== 4) {   // neon sign: dark back plate + tube (purple = world); the glow is added at runtime as a light
      E.fillPts(g, E.quad(F, .18, .44, .82, .86), '#141824');
      const k = (b + idx) % 4, pts = [];
      if (k === 0) for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.2832; pts.push(F(.5 + .2 * Math.cos(a), .65 + .13 * Math.sin(a))); }
      if (k === 1) [[.28, .56], [.4, .76], [.52, .56], [.64, .76], [.74, .58]].forEach(([s, t]) => pts.push(F(s, t)));
      if (k === 2) for (let i = 0; i <= 20; i++) { const s = .26 + i / 20 * .48; pts.push(F(s, .65 + .08 * Math.sin(i / 20 * 9.4))); }
      if (k === 3) [[.3, .58], [.5, .78], [.7, .58], [.3, .58]].forEach(([s, t]) => pts.push(F(s, t)));
      E.glowLine(g, pts, PAL.neonPurple, 1.1); Env.poly(g, pts, .4, '#f0d8ff');
      const k0 = Math.floor(pts.length * (0.3 + rnd() * 0.4)), dead = pts.slice(k0, k0 + Math.max(2, Math.floor(pts.length * 0.25)));   // a dead piece of tube
      Env.poly(g, dead, 1.4, '#26222e'); Env.poly(g, dead, 0.5, '#4a4458');
    }
    if (rnd() < 0.65) { const a = F(0.15 + rnd() * 0.7, 1); Decay.vine(g, rnd, a[0], a[1], 10 + rnd() * 22, 1.6, 1); }   // ivy hanging from the wall top
    if (rnd() < 0.3) { const a = F(0.1 + rnd() * 0.8, 1); Decay.vine(g, rnd, a[0], a[1], 6 + rnd() * 10, 1.2, 1); }
    for (let i = 0; i < 7; i++) { const q = F(rnd(), 0.02 + rnd() * 0.1); Decay.blob(g, q[0], q[1], 0.8 + rnd() * 1.4); }   // moss along the baseboard
    if (rnd() < 0.6) { const q = F(0.1 + rnd() * 0.8, 0.04); Decay.weeds(g, rnd, q[0], q[1], 3 + Math.floor(rnd() * 3)); }
    for (let i = 0; i < 5; i++) { const q = P(rnd(), rnd(), WH); Decay.blob(g, q[0], q[1], 0.8 + rnd() * 1.6); }        // moss on the wall top
    Paint.grain(g, rnd, -16, -WH, 32, WH + 16, 120);
  },

  /* ---- flat floor decor: no height, no glow, never looks like loot or danger ---- */
  decoFrame(g, b, id) {
    const E = Env, P = E.P, Q = (u0, v0, u1, v1) => [P(u0, v0, 0), P(u1, v0, 0), P(u1, v1, 0), P(u0, v1, 0)], k = E.DECO[b][id], rnd = Paint.rng(b * 13 + id * 5 + 1);
    g.save(); E.path(g, [P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)]); g.clip();
    if (k === 'rug') { E.fillPts(g, E.isoEll(.5, .5, .44), 'rgba(62,72,144,.85)'); E.poly(g, E.isoEll(.5, .5, .34).concat([E.P(.84, .5, 0)]), .6, 'rgba(109,114,165,.9)'); }
    if (k === 'crack' || k === 'cables') { for (let j = 0; j < (k === 'cables' ? 2 : 3); j++) { const pts = []; let u = .15 + rnd() * .2, v = .2 + rnd() * .6; for (let i = 0; i < 6; i++) { pts.push(P(u, v, 0)); u += .12 + rnd() * .05; v += (rnd() - .5) * .25; } if (k === 'cables') { E.poly(g, pts, 1.8, PAL.ink); E.poly(g, pts, 1, ['#202228', '#3a2a50'][j]); } else E.poly(g, pts, .6, 'rgba(6,8,12,.75)'); } }
    if (k === 'stain') E.fillPts(g, E.isoEll(.56, .5, .2), 'rgba(70,48,34,.5)', false);
    if (k === 'runner') { E.fillPts(g, Q(.08, .28, .92, .72), 'rgba(142,72,105,.85)'); E.path(g, Q(.14, .34, .86, .66)); g.lineWidth = .6; g.strokeStyle = 'rgba(218,140,170,.7)'; g.stroke(); }
    if (k === 'mat') { E.fillPts(g, Q(.3, .3, .7, .7), '#4a3b2e'); for (let i = 1; i < 6; i++) E.line(g, P(.3 + i * .067, .3, 0), P(.3 + i * .067, .7, 0), .3, 'rgba(10,8,6,.45)'); }
    if (k === 'puddle') { E.fillPts(g, E.isoEll(.5, .5, .3), 'rgba(73,172,149,.35)', false); E.line(g, P(.35, .45, 0), P(.55, .4, 0), .6, 'rgba(207,224,230,.55)'); }
    if (k === 'bathmat') { E.fillPts(g, Q(.25, .32, .75, .68), 'rgba(218,87,132,.55)'); for (let i = 0; i < 8; i++) E.line(g, P(.25 + i * .07, .68, 0), P(.25 + i * .07, .74, 0), .35, 'rgba(218,87,132,.6)'); }
    if (k === 'drain') { E.fillPts(g, E.isoEll(.5, .5, .13), '#151a20'); for (let i = -1; i <= 1; i++) E.line(g, P(.42, .5 + i * .05, 0), P(.58, .5 + i * .05, 0), .4, '#7d8790'); }
    if (k === 'rubble') for (let i = 0; i < 7; i++) { const c = P(.2 + rnd() * .6, .2 + rnd() * .6, 0), r = .8 + rnd() * 1.6; E.fillPts(g, [[c[0] - r, c[1]], [c[0] - r * .3, c[1] - r * .8], [c[0] + r, c[1] - r * .3], [c[0] + r * .6, c[1] + r * .5]], ['#5a524c', '#6a625a', '#48423e'][i % 3]); }
    if (k === 'oil') { E.fillPts(g, E.isoEll(.5, .5, .26), 'rgba(8,8,12,.6)', false); E.fillPts(g, E.isoEll(.44, .46, .08), 'rgba(109,114,165,.35)', false); }
    g.restore();
  },

  lava(n) {   // lava pools in bunker rooms: away from spawn, door and container
    for (let k = 0, tries = 0; k < n && tries < 80; tries++) {
      const x = 2 + Math.random() * (Room.w - 4), y = 2 + Math.random() * (Room.h - 4);
      if (Room.boxBlocked(x, y, 0.9) || Math.hypot(x - Room.spawn.x, y - Room.spawn.y) < 3 || (Room.door && Math.hypot(x - Room.door.x - 0.5, y - Room.door.y - 0.5) < 2.5)) continue;
      if (Room.containers.some(c => Math.hypot(x - c.x, y - c.y) < 2) || Combat.hazards.some(h => Math.hypot(x - h.x, y - h.y) < 2.2)) continue;
      Combat.hazards.push({ x, y, r: 0.8 + Math.random() * 0.35, t: 1e9, max: 1e9, dps: 10, lava: true }); k++;
    }
  },
  prepare() {   // called by Room.load: decor for back walls, neon/window lights, furniture choice, floor decor
    const R = Room, cells = [];
    for (let x = 1; x < R.w - 1; x++) if (R.tiles[0][x] === 1) cells.push([x, 0]);
    for (let y = 1; y < R.h - 1; y++) if (R.tiles[y][0] === 1) cells.push([0, y]);
    R.wdeco = {}; R.envLights = []; R.furn = {}; R.deco = [];
    cells.sort(() => Math.random() - 0.5); let neon = 0, win = 0, post = 0;
    for (const [x, y] of cells) {
      const r = Math.random(); let v = 0;
      if (neon < 2 && r < 0.22) { v = 3; neon++; } else if (win < 2 && r < 0.42) { v = 1; win++; } else if (post < 3 && r < 0.62) { v = 2; post++; }
      R.wdeco[x + ',' + y] = v;
      const lx = y === 0 ? x + 0.5 : 1.02, ly = y === 0 ? 1.02 : y + 0.5;
      const bunker = Env.biome() === 4;
      if (v === 3) R.envLights.push({ x: lx, y: ly, z: 26, r: 85, a: 0.85, col: bunker ? '255,70,30' : '164,85,232', g: bunker ? 0.26 : 0.24, fl: Math.random() * 6 });
      if (v === 1 && !bunker) R.envLights.push({ x: lx, y: ly, z: 24, r: 70, a: 0.5, col: '150,205,230', g: 0.06, fl: -1 });
    }
    for (let y = 1; y < R.h - 1; y++) for (let x = 1; x < R.w - 1; x++) if (R.tiles[y][x] === 1) R.furn[x + ',' + y] = Math.floor(Math.random() * 4);
    const free = [];
    for (let y = 2; y < R.h - 2; y++) for (let x = 2; x < R.w - 2; x++)
      if (R.tiles[y][x] === 0 && Math.hypot(x + 0.5 - R.spawn.x, y + 0.5 - R.spawn.y) > 2 && !(R.door && Math.abs(x - R.door.x) < 3 && Math.abs(y - R.door.y) < 2)) free.push([x, y]);
    free.sort(() => Math.random() - 0.5); free.slice(0, 2 + Math.floor(Math.random() * 3)).forEach(([x, y]) => R.deco.push({ x, y, id: Math.floor(Math.random() * 3) }));
  },
  drawWall(ctx, x, y, cam) {   // returns true when the env art handled this wall cell
    const R = Room, I = Env.imgs, b = Env.biome(), K = CFG.view.ss, k = x + ',' + y; if (!I.furn) return false;
    const p = Iso.toScreen(x, y, cam), px = Math.round(p.x * K) / K - 16, py = Math.round(p.y * K) / K - 40;
    if (R.furn && k in R.furn) { ctx.drawImage(I.furn, R.furn[k] * 32 * K, b * 56 * K, 32 * K, 56 * K, px, py, 32, 56); return true; }
    if (x === 0 || y === 0) {
      const v = (R.wdeco && R.wdeco[k]) || 0, col = y === 0 && x > 0 ? v : x === 0 && y > 0 ? 4 + v : 0;
      ctx.drawImage(I.wall, col * 32 * K, b * 56 * K, 32 * K, 56 * K, px, py, 32, 56); return true;
    }
    return false;
  },
  drawDeco(ctx, cam) {
    if (!Room.deco || !Env.imgs.deco) return; const b = Env.biome(), K = CFG.view.ss;
    for (const d of Room.deco) { const p = Iso.toScreen(d.x, d.y, cam); ctx.drawImage(Env.imgs.deco, d.id * 32 * K, b * 16 * K, 32 * K, 16 * K, Math.round(p.x) - 16, Math.round(p.y), 32, 16); }
  },
  init() {
    const K = CFG.view.ss, rnd = Paint.rng(99);
    { const { c, g } = Paint.canvas(32 * 4, 56 * Env.FURN.length);                      // furniture: rows = biomes, columns = props
      for (let b = 0; b < Env.FURN.length; b++) Env.FURN[b].forEach((id, i) => { g.save(); g.beginPath(); g.rect(i * 32, b * 56, 32, 56); g.clip(); g.translate(i * 32 + 16, b * 56 + 40); Env.shadow(g); Env.FD[id](g); Env.overgrow(g, rnd); Paint.grain(g, rnd, -16, -40, 32, 56, 90); g.restore(); });
      Env.imgs.furn = c; }
    { const { c, g } = Paint.canvas(32 * 8, 56 * Env.FURN.length);                      // back walls: columns 0-3 decor on the left face (top row), 4-7 on the right face (left column)
      for (let b = 0; b < Env.FURN.length; b++) for (let i = 0; i < 8; i++) { g.save(); g.beginPath(); g.rect(i * 32, b * 56, 32, 56); g.clip(); g.translate(i * 32 + 16, b * 56 + 40); Env.wallFrame(g, b, i); g.restore(); }
      Env.imgs.wall = c; }
    { const { c, g } = Paint.canvas(32 * 3, 16 * Env.FURN.length);
      for (let b = 0; b < Env.FURN.length; b++) for (let i = 0; i < 3; i++) { g.save(); g.translate(i * 32 + 16, b * 16); Env.decoFrame(g, b, i); g.restore(); }
      Env.imgs.deco = c; }
    { const { c, g } = Paint.canvas(24 * 4, 22);
      Env.TRASH.forEach((id, i) => { g.save(); g.beginPath(); g.rect(i * 24, 0, 24, 22); g.clip(); g.translate(i * 24 + 12, 20); Env.TD[id](g); g.restore(); });
      Env.imgs.trash = c; }
    const prop = (name, frames) => {                                        // interactable props as sprite sheets (same layout as CFG.sprites)
      const d = CFG.sprites[name], { c, g } = Paint.canvas(d.fw * frames, d.fh);
      for (let f = 0; f < frames; f++) { g.save(); g.beginPath(); g.rect(f * d.fw, 0, d.fw, d.fh); g.clip(); g.translate(f * d.fw + d.ax, d.ay - 8); Env.PD[name](g, f); Paint.grain(g, rnd, -d.ax, 8 - d.ay, d.fw, d.fh, 70); g.restore(); }
      Sprites.imgs[name] = c; Sprites.ok[name] = true;
    };
    prop('container', 1); prop('terminal', 2); prop('rack', 1); prop('wardrobe', 1);
  }
};
