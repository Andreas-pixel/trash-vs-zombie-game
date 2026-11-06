// Trash Vs. Nazi-Zombies - Siegesfeier auf dem Dach (Stadtpanorama, Feuerwerk)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ ROOFTOP (victory party after the final boss: ruined city panorama, fireworks, residents) ============ */
const ROOM_ROOF = [   // 'P' spawn, 'D' stairwell back down to the kitchen; props are added as solid cells in Roof.PROPS
  "##############",
  "#............#",
  "#............#",
  "#............#",
  "#............#",
  "#............D",
  "#.......P....#",
  "#............#",
  "#............#",
  "#............#",
  "##############"
];
const Roof = {
  BIOME: { name: 'DACH', col: { floorA: '#2b2c33', floorB: '#26272e', wallTop: '#6a6660', wallL: '#3a3734', wallR: '#2a2826' } },
  PROPS: [ { id: 'grill', x: 3, y: 2 }, { id: 'table', x: 6, y: 2, w: 2 }, { id: 'bins', x: 9, y: 1, w: 3 }, { id: 'speaker', x: 2, y: 7 },
           { id: 'couch', x: 5, y: 8, w: 2 }, { id: 'tank', x: 1, y: 9 }, { id: 'antenna', x: 12, y: 9 } ],
  POLES: [[1.35, 1.35], [12.65, 1.35], [1.35, 9.65], [12.65, 9.65]],
  STRANDS: [[0, 1], [0, 2], [1, 2], [1, 3]],                                         // string lights between poles
  img: null, pending: false, creditsT: -99, bonus: 0, fw: [], smoke: [], fwT: 0, talkN: 0,
  enter() {
    Game.mode = 'roof'; Game.ui = null; Run.boss = false; Run.locked = false; Run.state = 'roof'; Run.biome = Roof.BIOME;
    Trash.secured += Trash.value(); Trash.carry = []; Trash.items = [];                 // carried trash counts on a win
    Roof.bonus = CFG.run.winBonus; Trash.bank += Trash.secured + Roof.bonus; Trash.secured = 0; Save.save();
    Object.assign(CFG.col, Roof.BIOME.col); Room.load(ROOM_ROOF);
    for (const p of Roof.PROPS) for (let i = 0; i < (p.w || 1); i++) Room.tiles[p.y][p.x + i] = 1;
    Room.wdeco = {}; Room.furn = {}; Room.deco = []; Room.envLights = Roof.lights();
    Combat.reset(); Particles.reset(); Gear.drops = []; Player.spawn(Room.spawn.x, Room.spawn.y); Player.hp = Player.maxHp; { const c = Iso.proj(Room.w / 2, Room.h / 2), q = Iso.proj(Player.x, Player.y); Camera.x = c.x * 0.6 + q.x * 0.4; Camera.y = c.y * 0.55 + q.y * 0.45 - 44; }
    Roof.fw = []; Roof.smoke = []; Roof.creditsT = -99; Roof.pending = true; Roof.talkN = 0;
    if (!Roof.img) Roof.paint();
  },
  arrive() { Dialog.start(STORY.roof.arrive, () => { Roof.creditsT = Game.time; Snd.sfx('buy'); }); },
  npcs() { return Paint.NAMES.filter(n => n !== Player.look).map((n, i) => ({ n, x: [4.6, 3.7][i], y: [3.9, 6.6][i], dance: i === 1 })); },
  update(dt) {
    Hub.nearN = null; for (const n of Roof.npcs()) if (Math.hypot(n.x - Player.x, n.y - Player.y) < 1.4) Hub.nearN = n;
    if (Hub.nearN && Input.hit('KeyF', 'KeyE')) { const L = STORY.roof.talk; Dialog.start([[Hub.nearN.n, L[Roof.talkN++ % L.length]]]); return; }
    const D = Room.door;
    if (D && Math.floor(Player.x) === D.x && Math.floor(Player.y) === D.y) Run.trans = { phase: 'out', t: 0, to: 'hub' };
  },
  tick(dt) {                                                                         // fireworks + grill smoke (also while dialogs are open)
    Roof.fwT -= dt;
    if (Roof.fwT <= 0) { Roof.fwT = 0.7 + Math.random() * 1.1; Roof.fw.push({ x: 40 + Math.random() * 400, y: 200, vy: -150 - Math.random() * 50, top: 30 + Math.random() * 70, col: ['35,227,219', '159,224,112', '176,108,255', '255,211,74', '255,120,160'][Math.floor(Math.random() * 5)], parts: null }); }
    for (const f of Roof.fw) {
      if (!f.parts) { f.y += f.vy * dt; if (f.y <= f.top) { f.parts = []; f.t = 0; Snd.sfx('hit'); for (let i = 0; i < 46; i++) { const a = Math.random() * 6.283, s = 25 + Math.random() * 45; f.parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s }); } } }
      else { f.t += dt; for (const p of f.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy = p.vy * 0.97 + 22 * dt; } }
    }
    Roof.fw = Roof.fw.filter(f => !f.parts || f.t < 1.6);
    if (Math.random() < dt * 5) Roof.smoke.push({ x: 3.5 + (Math.random() - 0.5) * 0.4, y: 2.5, z: 18, a: 0.35, s: 2 + Math.random() * 2, t: 0 });
    for (const s of Roof.smoke) { s.t += dt; s.z += 14 * dt; s.x += 0.25 * dt; s.s += 3 * dt; s.a = 0.35 * (1 - s.t / 3); }
    Roof.smoke = Roof.smoke.filter(s => s.t < 3);
  },
  lights() {
    const L = [{ x: 3.5, y: 2.6, z: 10, r: 90, a: 0.95, col: '255,140,50', g: 0.22, fl: 1.3 }, { x: 2.5, y: 7.5, z: 16, r: 60, a: 0.8, col: '176,108,255', g: 0.18, fl: 2.1 },
               { x: 13.4, y: 5.5, z: 14, r: 70, a: 0.9, col: '35,227,219', g: 0.14, fl: -1 }, { x: 10.5, y: 1.5, z: 14, r: 55, a: 0.8, col: '120,230,130', g: 0.12, fl: -1 }];
    for (const [a, b] of Roof.STRANDS) for (const q of Roof.bulbs(a, b)) if (q.i % 2 === 0) L.push({ x: q.x, y: q.y, z: q.z, r: 34, a: 0.6, col: q.col, g: 0.16, fl: q.i });
    return L;
  },
  bulbs(a, b) {                                                                       // sagging strand: bulb positions in world + height
    const A = Roof.POLES[a], B = Roof.POLES[b], n = Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 0.75), out = [];
    const C = ['255,216,140', '35,227,219', '255,216,140', '176,108,255'];
    for (let i = 1; i < n; i++) { const t = i / n; out.push({ i, x: A[0] + (B[0] - A[0]) * t, y: A[1] + (B[1] - A[1]) * t, z: 36 - Math.sin(t * Math.PI) * 12, col: C[i % 4] }); }
    return out;
  },

  // ---------- background: sky, moon, two layers of a ruined, overgrown city (painted once into canvases) ----------
  paint() {
    const W = 680, H = 270, rnd = Paint.rng(4711), I = {};
    { const { c, g } = Paint.canvas(W, H);                                           // sky
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#070a1a'); gr.addColorStop(0.45, '#151a38'); gr.addColorStop(0.72, '#3a2446'); gr.addColorStop(0.86, '#6a3a3a'); gr.addColorStop(1, '#2a1a22');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {                                                   // soft cloud bands, lit from below by the fires
        const y = 70 + rnd() * 90, x = rnd() * W, w = 120 + rnd() * 220, cg = g.createRadialGradient(x, y, 0, x, y, w / 2);
        cg.addColorStop(0, 'rgba(120,70,90,.18)'); cg.addColorStop(1, 'rgba(120,70,90,0)'); g.save(); g.scale(1, 0.22); g.fillStyle = cg; g.beginPath(); g.arc(x, y / 0.22, w / 2, 0, 7); g.fill(); g.restore();
      }
      const mx = 150, my = 46, mg = g.createRadialGradient(mx, my, 6, mx, my, 70);  // moon with halo
      mg.addColorStop(0, 'rgba(220,225,240,.35)'); mg.addColorStop(1, 'rgba(220,225,240,0)'); g.fillStyle = mg; g.fillRect(mx - 70, my - 70, 140, 140);
      g.fillStyle = '#d8dcea'; g.beginPath(); g.arc(mx, my, 13, 0, 7); g.fill();
      g.fillStyle = 'rgba(150,155,175,.55)'; for (const [dx, dy, r] of [[-4, -3, 3], [3, 2, 4], [-1, 6, 2], [6, -5, 1.6]]) { g.beginPath(); g.arc(mx + dx, my + dy, r, 0, 7); g.fill(); }
      Paint.grain(g, rnd, 0, 0, W, H, 900); I.sky = c; }
    Roof.stars = []; for (let i = 0; i < 90; i++) Roof.stars.push([rnd() * W, rnd() * 130, rnd()]);
    const layer = (seed, y0, hMin, hMax, body, rim, winP, holes) => {               // one row of ruined towers
      const r = Paint.rng(seed), { c, g } = Paint.canvas(W, H), fires = [], neon = [];
      let x = -10;
      while (x < W + 10) {
        const w = 18 + r() * 34, h = hMin + r() * (hMax - hMin), top = y0 - h, lean = (r() - 0.5) * (r() < 0.2 ? 6 : 0);
        const broken = r() < 0.45, pts = [[x, H], [x, top + 4], [x + lean, top]];
        if (broken) { const k = 3 + Math.floor(r() * 4); for (let i = 1; i < k; i++) pts.push([x + lean + w * i / k, top + r() * 14 * (i % 2 ? 1 : 0.3)]); }
        pts.push([x + w + lean, top + (broken ? r() * 10 : 0)], [x + w, H]);
        g.fillStyle = body; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
        g.strokeStyle = rim; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 0.5, H); g.lineTo(x + 0.5, top + 4); g.lineTo(x + lean + 0.5, top); g.stroke();   // moonlit edge
        const cols = Math.floor(w / 5), rows = Math.floor(h / 7);
        for (let cx = 0; cx < cols; cx++) for (let ry = 1; ry < rows; ry++) {
          const v = r(), wx = x + 3 + cx * 5, wy = top + 6 + ry * 7; if (wy > y0 + 30) continue;
          if (v < winP) { g.fillStyle = r() < 0.7 ? 'rgba(255,190,110,.85)' : 'rgba(170,210,255,.6)'; g.fillRect(wx, wy, 2, 3); }
          else if (v < 0.5) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(wx, wy, 2, 3); }
        }
        if (holes && r() < 0.35) { g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(x + w * (0.3 + r() * 0.4), top + h * (0.2 + r() * 0.3), 3 + r() * 6, 2 + r() * 5, r(), 0, 7); g.fill(); g.restore(); }
        for (let i = 0; i < 2 + r() * 4; i++) {                                    // overgrowth on the roof edge + hanging vines
          const vx = x + r() * w, vy = top + r() * 4; g.fillStyle = r() < 0.5 ? 'rgba(40,70,38,.95)' : 'rgba(28,52,30,.95)'; g.beginPath(); g.ellipse(vx, vy, 3 + r() * 5, 2 + r() * 2.5, 0, 0, 7); g.fill();
          if (r() < 0.6) { g.strokeStyle = 'rgba(36,64,34,.9)'; g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo(vx + (r() - 0.5) * 4, vy + 10, vx + (r() - 0.5) * 3, vy + 8 + r() * 26); g.stroke(); }
        }
        if (r() < 0.12) { g.strokeStyle = rim; g.beginPath(); g.moveTo(x + w / 2, top); g.lineTo(x + w / 2, top - 10 - r() * 14); g.stroke(); }   // antenna
        if (r() < 0.24) fires.push([x + w * r(), top + h * 0.25 * r(), 0.6 + r() * 0.8]);
        if (r() < 0.08) neon.push([x + 3 + r() * (w - 14), top + 8 + r() * 20, r() < 0.5 ? '176,108,255' : '35,227,219']);
        x += w + (r() < 0.3 ? r() * 10 : -2);
      }
      if (seed === 2) {                                                               // a collapsed crane over the mid layer
        g.strokeStyle = rim; g.lineWidth = 1; const bx = 470, by = y0 - 112;
        g.beginPath(); g.moveTo(bx, H); g.lineTo(bx, by); g.lineTo(bx + 70, by + 26); g.moveTo(bx, by); g.lineTo(bx - 24, by + 8); g.stroke();
        for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(bx - 3, by + i * 10); g.lineTo(bx + 3, by + i * 10 + 5); g.stroke(); }
        g.beginPath(); g.moveTo(bx + 60, by + 22); g.lineTo(bx + 60, by + 60); g.stroke();
      }
      const fog = g.createLinearGradient(0, y0 - 30, 0, H); fog.addColorStop(0, 'rgba(40,24,40,0)'); fog.addColorStop(0.55, 'rgba(46,26,40,.75)'); fog.addColorStop(1, 'rgba(14,10,18,1)');
      g.fillStyle = fog; g.fillRect(0, y0 - 30, W, H);
      Paint.grain(g, r, 0, 0, W, H, 1400);
      return { c, fires, neon };
    };
    I.far = layer(1, 186, 20, 70, '#2a2742', '#45406a', 0.07, false);              // we stand on the tallest tower: most roofs lie below us
    I.mid = layer(2, 240, 40, 120, '#191626', '#3a3660', 0.05, true);
    Roof.img = I;
  },
  sky(ctx, cam) {
    if (!Roof.img) Roof.paint();
    const I = Roof.img, T = Game.time, c = Iso.proj(ROOM_ROOF[0].length / 2, ROOM_ROOF.length / 2);
    const dx = c.x - cam.x, dy = c.y - cam.y, off = (par, base) => [Math.max(-200, Math.min(0, -100 + dx * par)), base + dy * par];
    let [ox, oy] = off(0.05, 0); ctx.drawImage(I.sky, ox, oy - 6, 680, 270 + 12);
    for (const [x, y, p] of Roof.stars) { const a = 0.35 + 0.35 * Math.sin(T * (1 + p * 3) + p * 20); ctx.fillStyle = 'rgba(230,235,255,' + a + ')'; ctx.fillRect(ox + x, oy + y, p > 0.85 ? 1.5 : 1, p > 0.85 ? 1.5 : 1); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of Roof.fw) {                                                       // fireworks behind the city
      if (!f.parts) { ctx.fillStyle = 'rgba(' + f.col + ',.9)'; ctx.fillRect(ox + 100 + f.x - 100, f.y, 1, 3); continue; }
      const a = Math.max(0, 1 - f.t / 1.6);
      if (f.t < 0.25) { const gr = ctx.createRadialGradient(ox + f.x, f.y, 0, ox + f.x, f.y, 60); gr.addColorStop(0, 'rgba(' + f.col + ',' + 0.25 * (1 - f.t / 0.25) + ')'); gr.addColorStop(1, 'rgba(' + f.col + ',0)'); ctx.fillStyle = gr; ctx.fillRect(ox + f.x - 60, f.y - 60, 120, 120); }
      ctx.fillStyle = 'rgba(' + f.col + ',' + a + ')'; for (const p of f.parts) ctx.fillRect(ox + p.x, p.y, 1.4, 1.4);
    }
    ctx.restore();
    for (const [L, par, base] of [[I.far, 0.1, 6], [I.mid, 0.2, 14]]) {
      [ox, oy] = off(par, base); ctx.drawImage(L.c, ox, oy, 680, 270);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, s] of L.fires) {                                             // flickering fires + their glow
        const fl = 0.75 + 0.25 * Math.sin(T * 9 + x) * Math.sin(T * 3.3 + y), r = 26 * s, gr = ctx.createRadialGradient(ox + x, oy + y, 0, ox + x, oy + y, r);
        gr.addColorStop(0, 'rgba(255,150,60,' + 0.5 * fl + ')'); gr.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = gr; ctx.fillRect(ox + x - r, oy + y - r, r * 2, r * 2);
        ctx.fillStyle = 'rgba(255,200,110,' + 0.8 * fl + ')'; ctx.fillRect(ox + x - 1, oy + y - 2 * s, 2, 2 * s);
      }
      for (const [x, y, col] of L.neon) {
        const on = Math.sin(T * 13 + x) > -0.85 ? 1 : 0.25;
        ctx.fillStyle = 'rgba(' + col + ',' + 0.9 * on + ')'; ctx.fillRect(ox + x, oy + y, 9, 2); ctx.fillRect(ox + x, oy + y + 4, 6, 1);
        const gr = ctx.createRadialGradient(ox + x + 4, oy + y + 2, 0, ox + x + 4, oy + y + 2, 16); gr.addColorStop(0, 'rgba(' + col + ',' + 0.3 * on + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gr; ctx.fillRect(ox + x - 12, oy + y - 14, 32, 32);
      }
      ctx.restore();
    }
    for (const [x, y, s] of I.mid.fires) {                                           // slow smoke columns from the near fires
      [ox, oy] = off(0.2, 14);
      for (let i = 0; i < 4; i++) { const k = ((T * 0.12 + i / 4 + x) % 1), sx = ox + x + k * 14, sy = oy + y - k * 60; ctx.fillStyle = 'rgba(40,34,44,' + 0.35 * (1 - k) + ')'; ctx.beginPath(); ctx.ellipse(sx, sy, 4 + k * 12 * s, 3 + k * 7 * s, 0, 0, 7); ctx.fill(); }
    }
  },
  building(ctx, cam) {                                                               // the high-rise below the roof: two facades falling into the dark
    const w = Room.w, h = Room.h, L = Iso.toScreen(0, h, cam), B = Iso.toScreen(w, h, cam), R = Iso.toScreen(w, 0, cam), D = 420;
    const face = (a, b, col0, col1, lit) => {
      const gr = ctx.createLinearGradient(0, Math.min(a.y, b.y), 0, Math.max(a.y, b.y) + D); gr.addColorStop(0, col0); gr.addColorStop(0.5, col1); gr.addColorStop(1, '#06050a');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y + D); ctx.lineTo(a.x, a.y + D); ctx.closePath(); ctx.fill();
      const n = Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 18);
      for (let fl = 0; fl < 14; fl++) for (let i = 0; i < n; i++) {                  // window grid, mostly dead, some broken
        const t = (i + 0.3) / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t + 14 + fl * 22, v = Renderer.hash(i, fl, lit ? 7 : 9);
        const sk = (b.y - a.y) / (b.x - a.x) * 8;
        ctx.fillStyle = v < 0.05 ? 'rgba(255,190,110,.7)' : v < 0.65 ? 'rgba(8,8,14,.75)' : 'rgba(30,34,52,.6)';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + sk); ctx.lineTo(x + 8, y + sk + 11); ctx.lineTo(x, y + 11); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(38,66,36,.85)';                                            // ivy creeping up from below
      for (let i = 0; i < n * 2; i++) { const t = Renderer.hash(i, 3, lit ? 1 : 2), x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; const len = 20 + Renderer.hash(i, 4, 1) * 70; ctx.fillRect(x, y + 4, 1.5, len); ctx.beginPath(); ctx.ellipse(x, y + 4 + len, 3, 2, 0, 0, 7); ctx.fill(); }
    };
    face(L, B, '#3a3836', '#1c1a1e', false); face(B, R, '#4a4642', '#242226', true);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(B.x, B.y + D); ctx.stroke();
  },
  floor(ctx, cam) {                                                                  // tar roof: bitumen sheets, gravel, puddles with neon reflections, moss
    for (let y = 0; y < Room.h; y++) for (let x = 0; x < Room.w; x++) {
      const tl = Room.tiles[y][x], c = Renderer.corners(x, y, cam), h1 = Renderer.hash(x, y, 11);
      Renderer.poly(ctx, c, tl === 2 ? '#2f4a44' : h1 < 0.5 ? '#2c2d34' : '#28292f');
      const m = Iso.toScreen(x + 0.5, y + 0.5, cam);
      if (h1 > 0.82) { ctx.fillStyle = 'rgba(46,78,40,.55)'; ctx.beginPath(); ctx.ellipse(m.x + (h1 - 0.9) * 30, m.y, 7, 3, 0, 0, 7); ctx.fill(); }
      else if (h1 > 0.72) { const gr = ctx.createLinearGradient(m.x - 8, m.y, m.x + 8, m.y); gr.addColorStop(0, 'rgba(110,90,170,.25)'); gr.addColorStop(1, 'rgba(35,227,219,.18)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(m.x, m.y + 1, 9, 3.4, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let k = 0; k < 3; k++) ctx.fillRect(Math.round(m.x + (Renderer.hash(x, y, k + 20) - 0.5) * 18), Math.round(m.y + (Renderer.hash(x, y, k + 30) - 0.5) * 7), 1, 1);
      if (x % 3 === 0) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); ctx.lineTo(c[3][0], c[3][1]); ctx.stroke(); }   // sheet seams
    }
  },
  box(ctx, cam, x0, y0, x1, y1, z0, h, top, left, right) {                            // flat-shaded iso box
    const S = (x, y, z) => { const p = Iso.toScreen(x, y, cam); return [p.x, p.y - z]; };
    const t = [S(x0, y0, z0 + h), S(x1, y0, z0 + h), S(x1, y1, z0 + h), S(x0, y1, z0 + h)], b = [S(x0, y0, z0), S(x1, y0, z0), S(x1, y1, z0), S(x0, y1, z0)];
    ctx.lineJoin = 'round';
    Renderer.poly(ctx, [t[3], t[2], b[2], b[3]], left); Renderer.poly(ctx, [t[2], t[1], b[1], b[2]], right); Renderer.poly(ctx, t, top);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(t[3][0], t[3][1]); ctx.lineTo(t[2][0], t[2][1]); ctx.lineTo(t[1][0], t[1][1]); ctx.stroke();
    return t;
  },
  wall(ctx, x, y, cam) {                                                             // low parapet around the edge; interior solid cells are props
    if (x > 0 && y > 0 && x < Room.w - 1 && y < Room.h - 1) return;
    const far = x === 0 || y === 0, hgt = far ? 10 : 6;
    Roof.box(ctx, cam, x, y, x + 1, y + 1, 0, hgt, '#77736c', '#45413d', '#34312e');
    if (Renderer.hash(x, y, 5) < 0.35) { const p = Iso.toScreen(x + 0.5, y + 0.5, cam); ctx.fillStyle = 'rgba(52,86,44,.9)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - hgt, 6, 2.5, 0, 0, 7); ctx.fill(); ctx.fillRect(p.x - 1, p.y - hgt, 1.4, 6 + Renderer.hash(x, y, 6) * 8); }
  },
  drawProp(ctx, p, cam) {
    const T = Game.time, x = p.x, y = p.y, w = p.w || 1, B = (a, b, c, d, z, h, t, l, r) => Roof.box(ctx, cam, a, b, c, d, z, h, t, l, r), S = (a, b) => Iso.toScreen(a, b, cam);
    if (p.id === 'grill') {                                                          // oil-drum barbecue
      const s = S(x + 0.5, y + 0.5); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 10, 4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = PAL.ink; ctx.fillRect(s.x - 8, s.y - 15, 16, 15); const gr = ctx.createLinearGradient(s.x - 8, 0, s.x + 8, 0); gr.addColorStop(0, '#3a2a22'); gr.addColorStop(0.6, '#6a4a34'); gr.addColorStop(1, '#2a1e18');
      ctx.fillStyle = gr; ctx.fillRect(s.x - 7, s.y - 14, 14, 13); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(s.x - 7, s.y - 9, 14, 1); ctx.fillRect(s.x - 7, s.y - 5, 14, 1);
      ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(s.x, s.y - 15, 8.5, 3.4, 0, 0, 7); ctx.fill();
      const fl = 0.7 + 0.3 * Math.sin(T * 17) * Math.sin(T * 5); ctx.fillStyle = 'rgba(255,' + Math.round(120 + 60 * fl) + ',40,1)'; ctx.beginPath(); ctx.ellipse(s.x, s.y - 15, 7, 2.6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 0.6; for (let i = -6; i <= 6; i += 2) { ctx.beginPath(); ctx.moveTo(s.x + i, s.y - 17); ctx.lineTo(s.x + i, s.y - 13); ctx.stroke(); }
      ctx.fillStyle = '#a0402c'; ctx.fillRect(s.x - 4, s.y - 17, 3, 1.5); ctx.fillRect(s.x + 2, s.y - 16.5, 3, 1.5); ctx.lineWidth = 1;   // sausages
      for (let i = 0; i < 4; i++) { const k = (T * 2 + i / 4) % 1; ctx.fillStyle = 'rgba(255,200,90,' + (1 - k) + ')'; ctx.fillRect(s.x - 3 + Math.sin(T * 3 + i * 2) * 3, s.y - 18 - k * 14, 1, 1); }   // sparks
    } else if (p.id === 'table') {                                                   // pallet table with pizza boxes and cans
      B(x + 0.1, y + 0.15, x + w - 0.1, y + 0.85, 0, 7, '#7a6448', '#4a3a2a', '#3a2e22');
      B(x + 0.25, y + 0.3, x + 0.9, y + 0.8, 7, 1.6, '#c8b088', '#8a7656', '#6e5c42'); B(x + 0.3, y + 0.32, x + 0.85, y + 0.75, 8.6, 1.4, '#d6c098', '#9a8460', '#7a6648');
      for (const [cx, cy, col] of [[1.3, 0.4, '#3aa0a8'], [1.5, 0.6, '#b06cff'], [1.65, 0.35, '#9fe070'], [1.2, 0.7, '#d0d0d0']]) { const s = S(x + cx, y + cy); ctx.fillStyle = PAL.ink; ctx.fillRect(s.x - 1.5, s.y - 12, 3, 5); ctx.fillStyle = col; ctx.fillRect(s.x - 1, s.y - 11.5, 2, 4); }
    } else if (p.id === 'bins') {                                                    // the three recycling containers, full: proof of the work
      const cols = [['#2e8a4a', '#1f5e34', '#174628'], ['#1f8a86', '#16605e', '#104846'], ['#6a4aa0', '#4a3474', '#382658']];
      for (let i = 0; i < w; i++) { const c = cols[i % 3]; const t = B(x + i + 0.12, y + 0.15, x + i + 0.88, y + 0.85, 0, 13, c[0], c[1], c[2]);
        ctx.fillStyle = '#2b2a28'; ctx.beginPath(); ctx.ellipse((t[0][0] + t[2][0]) / 2, (t[0][1] + t[2][1]) / 2 - 2, 7, 3, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#3b4a3a'; ctx.beginPath(); ctx.ellipse((t[0][0] + t[2][0]) / 2 - 2, (t[0][1] + t[2][1]) / 2 - 3, 4, 2.4, 0, 0, 7); ctx.fill(); }
    } else if (p.id === 'speaker') {                                                 // speaker stack pulsing to the beat
      const k = 1 + 0.06 * Math.max(0, Math.sin(T * 13.8)); B(x + 0.15, y + 0.15, x + 0.85, y + 0.85, 0, 22, '#2a2a30', '#1a1a20', '#141418');
      const s = S(x + 0.5, y + 0.85); for (const [dy, r] of [[-15, 3.6], [-7, 2.4]]) { ctx.fillStyle = '#0a0a0e'; ctx.beginPath(); ctx.ellipse(s.x - 4, s.y + dy, r * k, r * k * 1.1, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(176,108,255,.8)'; ctx.beginPath(); ctx.ellipse(s.x - 4, s.y + dy, r * k * 0.6, r * k * 0.66, 0, 0, 7); ctx.stroke(); }
    } else if (p.id === 'couch') {                                                   // rescued couch, a bit mouldy
      B(x + 0.1, y + 0.25, x + w - 0.1, y + 0.9, 0, 6, '#6a3a40', '#4a262c', '#3a1e22'); B(x + 0.1, y + 0.75, x + w - 0.1, y + 0.95, 6, 7, '#7a4a50', '#5a3036', '#46242a');
      B(x + 0.1, y + 0.25, x + 0.3, y + 0.95, 6, 4, '#7a4a50', '#5a3036', '#46242a'); B(x + w - 0.3, y + 0.25, x + w - 0.1, y + 0.95, 6, 4, '#7a4a50', '#5a3036', '#46242a');
      const s = S(x + 1, y + 0.5); ctx.fillStyle = 'rgba(70,110,50,.6)'; ctx.beginPath(); ctx.ellipse(s.x + 6, s.y - 7, 4, 1.6, 0, 0, 7); ctx.fill();
    } else if (p.id === 'tank') {                                                    // water tank on stilts
      for (const [a, b] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) { const s = S(x + a, y + b); ctx.fillStyle = '#2a2826'; ctx.fillRect(s.x - 0.8, s.y - 14, 1.6, 14); }
      const s = S(x + 0.5, y + 0.5); ctx.fillStyle = PAL.ink; ctx.fillRect(s.x - 11, s.y - 38, 22, 25); const gr = ctx.createLinearGradient(s.x - 10, 0, s.x + 10, 0); gr.addColorStop(0, '#3e3a34'); gr.addColorStop(0.65, '#6a6258'); gr.addColorStop(1, '#2e2a26');
      ctx.fillStyle = gr; ctx.fillRect(s.x - 10, s.y - 37, 20, 23); ctx.fillStyle = '#7a7268'; ctx.beginPath(); ctx.ellipse(s.x, s.y - 37, 10, 3.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(40,74,36,.9)'; ctx.fillRect(s.x - 9, s.y - 36, 2, 18); ctx.fillRect(s.x + 5, s.y - 37, 1.5, 10); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(s.x - 10, s.y - 27, 20, 1);
    } else if (p.id === 'antenna') {                                                 // bent antenna mast with a blinking red light
      const s = S(x + 0.5, y + 0.5); ctx.strokeStyle = '#5a5650'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 34); ctx.lineTo(s.x + 6, s.y - 46); ctx.stroke();
      ctx.lineWidth = 0.8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(s.x - 5 + i, s.y - 12 - i * 7); ctx.lineTo(s.x + 5 - i, s.y - 12 - i * 7); ctx.stroke(); } ctx.lineWidth = 1;
      if (Math.sin(T * 3) > 0.3) { ctx.fillStyle = '#ff4a3a'; ctx.fillRect(s.x + 5, s.y - 48, 2, 2); }
    }
  },
  drawStairs(ctx, cam) {                                                             // stairwell hut on the right edge, door lit in cyan
    const d = Room.door, t = Roof.box(ctx, cam, d.x + 0.05, d.y - 0.6, d.x + 1.4, d.y + 1.6, 0, 30, '#5e5a54', '#3c3936', '#2c2a28');
    const a = Iso.toScreen(d.x + 0.05, d.y + 0.15, cam), b = Iso.toScreen(d.x + 0.05, d.y + 0.85, cam);
    ctx.fillStyle = '#0a1a1c'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y - 20); ctx.lineTo(a.x, a.y - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(35,227,219,.35)'; ctx.fill();
    const m = Iso.toScreen(d.x + 0.5, d.y + 0.5, cam); Trash.label(ctx, Math.round(m.x) - 10, Math.round(m.y) - 40, 'TREPPE: KÜCHE', PAL.uiInteract);
  },
  drawNpc(ctx, n, cam) {
    const s = Iso.toScreen(n.x, n.y, cam), p = Iso.toScreen(Player.x, Player.y, cam), x = Math.round(s.x), hop = n.dance ? Math.abs(Math.sin(Game.time * 6.9)) * 3 : 0, y = Math.round(s.y);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 7 - hop * 0.6, 3.5, 0, 0, 7); ctx.fill();
    const face = n.dance ? { x: Math.sin(Game.time * 1.7), y: 1 } : { x: p.x - s.x, y: p.y - s.y + 0.01 };
    Sprites.draw(ctx, 'player_' + n.n, n.dance ? 'walk' : 'idle', Game.time + n.x, x, y - hop, face, {});
    if (Hub.nearN && Hub.nearN.n === n.n && !Game.ui) Trash.label(ctx, x, y - 34, 'F: REDEN', PAL.uiInteract);
  },
  objects(list, ctx, cam) {                                                          // feeds the depth-sorted render list
    for (const p of Roof.PROPS) list.push({ d: p.x + (p.w || 1) - 1 + p.y + 1, f: () => Roof.drawProp(ctx, p, cam) });
    for (const [px, py] of Roof.POLES) list.push({ d: px + py, f: () => { const s = Iso.toScreen(px, py, cam); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - 37); ctx.stroke(); ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 1; } });
    list.push({ d: Room.door.x + Room.door.y + 1.5, f: () => Roof.drawStairs(ctx, cam) });
    for (const s of Roof.smoke) list.push({ d: 99, f: () => { const p = Iso.toScreen(s.x, s.y, cam); ctx.fillStyle = 'rgba(70,64,70,' + Math.max(0, s.a) + ')'; ctx.beginPath(); ctx.ellipse(p.x, p.y - s.z, s.s, s.s * 0.7, 0, 0, 7); ctx.fill(); } });
  },
  strands(ctx, cam) {                                                                // string lights over everything
    for (const [a, b] of Roof.STRANDS) {
      const A = Roof.POLES[a], Bp = Roof.POLES[b], q = Roof.bulbs(a, b), s0 = Iso.toScreen(A[0], A[1], cam), s1 = Iso.toScreen(Bp[0], Bp[1], cam);
      ctx.strokeStyle = 'rgba(10,10,14,.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(s0.x, s0.y - 36);
      for (const o of q) { const s = Iso.toScreen(o.x, o.y, cam); ctx.lineTo(s.x, s.y - o.z); } ctx.lineTo(s1.x, s1.y - 36); ctx.stroke(); ctx.lineWidth = 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const o of q) { const s = Iso.toScreen(o.x, o.y, cam), on = 0.75 + 0.25 * Math.sin(Game.time * 4 + o.i); ctx.fillStyle = 'rgba(' + o.col + ',' + 0.25 * on + ')'; ctx.beginPath(); ctx.arc(s.x, s.y - o.z + 1.5, 4, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(' + o.col + ',' + on + ')'; ctx.fillRect(s.x - 1, s.y - o.z + 0.5, 2, 2.4); }
      ctx.restore();
    }
  },
  drawOverlay(ctx) {                                                                 // closing credits card after the party dialog
    const k = Game.time - Roof.creditsT; if (k < 0 || k > 14 || Game.ui) return;
    const W = CFG.view.w, a = Math.max(0, Math.min(1, k * 1.5, (14 - k) * 0.8)), C = STORY.roof.credits;
    ctx.globalAlpha = a; UI.box(ctx, W / 2 - 140, 52, 280, 118, PAL.uiWorld);
    UI.head(ctx, C[0], W / 2, 60, 'center', 12); UI.text(ctx, C[1], W / 2, 82, PAL.uiDim, '8px monospace', 'center');
    UI.text(ctx, 'SIEGE ' + Save.stats.wins + '   ·   RUNS ' + Save.stats.runs + '   ·   MÜLL AUF DEM KONTO ' + Trash.bank, W / 2, 100, PAL.uiText, '8px monospace', 'center');
    UI.glow(ctx, 'SIEGESBONUS +' + Roof.bonus + ' MÜLL', W / 2, 114, PAL.uiLoot, 'bold 8px monospace', 'center', 8);
    UI.glow(ctx, C[2], W / 2, 134, PAL.uiPlayer, 'bold 9px monospace', 'center', 10);
    UI.text(ctx, C[3], W / 2, 152, PAL.uiDim, '7px monospace', 'center'); ctx.globalAlpha = 1;
  }
};
