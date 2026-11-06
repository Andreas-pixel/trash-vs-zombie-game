// Trash Vs. Nazi-Zombies - Zeichnen: Boden, Waende, Licht, Reihenfolge
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ RENDERER ============ */
const Renderer = {
  cv: null, ctx: null,
  init(cv) {
    Renderer.cv = cv; cv.width = CFG.view.w * CFG.view.ss; cv.height = CFG.view.h * CFG.view.ss;
    Renderer.lm = document.createElement('canvas'); Renderer.lm.width = CFG.view.w; Renderer.lm.height = CFG.view.h;   // offscreen light map
    Renderer.ctx = cv.getContext('2d'); Renderer.ctx.imageSmoothingEnabled = true; Renderer.ctx.imageSmoothingQuality = 'high';
    const c2 = Renderer.ctx, ft = c2.fillText.bind(c2), st = c2.strokeText.bind(c2), mt = c2.measureText.bind(c2);   // every UI string passes the German text layer
    c2.fillText = (t, x, y, m) => m === undefined ? ft(Text.de(t), x, y) : ft(Text.de(t), x, y, m);
    c2.strokeText = (t, x, y, m) => m === undefined ? st(Text.de(t), x, y) : st(Text.de(t), x, y, m);
    c2.measureText = t => mt(Text.de(t));
    const fd = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');   // every 'monospace' in the code becomes UI.FONT
    Object.defineProperty(c2, 'font', { get() { return fd.get.call(c2); }, set(v) { fd.set.call(c2, String(v).replace(/monospace/g, UI.FONT)); } });
    addEventListener('resize', Renderer.fit); Renderer.fit();
  },
  fit() {
    let s = Math.min(innerWidth / CFG.view.w, innerHeight / CFG.view.h);
    /* painted art scales smoothly: no integer snapping */
    Renderer.cv.style.width = CFG.view.w * s + 'px'; Renderer.cv.style.height = CFG.view.h * s + 'px';
  },
  poly(ctx, pts, fill) {
    ctx.beginPath(); ctx.moveTo(Math.round(pts[0][0]), Math.round(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.round(pts[i][0]), Math.round(pts[i][1]));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = CFG.col.outline; ctx.lineWidth = 1; ctx.stroke();
  },
  // tile corners in view space: top, right, bottom, left
  corners(x, y, cam, lift = 0) {
    const t = Iso.toScreen(x, y, cam), r = Iso.toScreen(x + 1, y, cam), b = Iso.toScreen(x + 1, y + 1, cam), l = Iso.toScreen(x, y + 1, cam);
    return [[t.x, t.y - lift], [r.x, r.y - lift], [b.x, b.y - lift], [l.x, l.y - lift]];
  },
  floor(ctx, cam) {
    if (Game.mode === 'roof') { Roof.floor(ctx, cam); return; }
    for (let y = 0; y < Room.h; y++) for (let x = 0; x < Room.w; x++) {
      const tl = Room.tiles[y][x]; if (tl === 1 || (tl === 2 && Run.locked)) continue;
      if (tl === 0 && Sprites.tile(ctx, 'floor', x, y, cam)) continue;
      Renderer.poly(ctx, Renderer.corners(x, y, cam), tl === 2 ? '#3f8a55' : (x + y) % 2 ? CFG.col.floorA : CFG.col.floorB);
      if (tl !== 2) Renderer.floorDetail(ctx, x, y, cam);
    }
    Env.drawDeco(ctx, cam);
    if (Tut.target) Tut.drawFloor(ctx, cam);
  },
  wall(ctx, x, y, cam) {
    if (Game.mode === 'roof') return Roof.wall(ctx, x, y, cam);
    if (Room.tiles[y][x] === 1 && (Env.drawWall(ctx, x, y, cam) || Sprites.tile(ctx, 'wall', x, y, cam))) return;
    const H = CFG.tile.wallH, base = Renderer.corners(x, y, cam), top = Renderer.corners(x, y, cam, H);
    Renderer.poly(ctx, [top[3], top[2], base[2], base[3]], CFG.col.wallL);   // left face
    Renderer.poly(ctx, [top[2], top[1], base[1], base[2]], CFG.col.wallR);   // right face
    Renderer.poly(ctx, top, Room.tiles[y][x] === 2 ? '#8a2a2a' : CFG.col.wallTop);   // locked door = red
    Renderer.wallDetail(ctx, top, base);                                // top face
  },
  hash(x, y, k) {   // deterministic per-tile noise
    let h = (x * 374761393 + y * 668265263 + k * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  },
  floorDetail(ctx, x, y, cam) {   // speckles, stains, cracks
    const c = Iso.toScreen(x + 0.5, y + 0.5, cam), r1 = Renderer.hash(x, y, 1), r2 = Renderer.hash(x, y, 2), r3 = Renderer.hash(x, y, 3);
    if (r1 < 0.5) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(Math.round(c.x + (r2 - 0.5) * 14), Math.round(c.y + (r3 - 0.5) * 6), 2, 1); }
    if (r1 > 0.93) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(c.x + (r2 - 0.5) * 8, c.y + (r3 - 0.5) * 3, 5, 2.2, 0, 0, 7); ctx.fill(); }
    if (r1 > 0.45 && r1 < 0.52) { ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.moveTo(c.x - 4, c.y - 1); ctx.lineTo(c.x, c.y + 1); ctx.lineTo(c.x + 3, c.y); ctx.stroke(); }
  },
  wallDetail(ctx, top, base) {    // brick joints, top-edge highlight, grime at the foot
    const L = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    for (const [i, j] of [[3, 2], [2, 1]]) {
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      for (const f of [0.33, 0.66]) { const a = L(top[i], base[i], f), b = L(top[j], base[j], f); ctx.beginPath(); ctx.moveTo(Math.round(a[0]), Math.round(a[1])); ctx.lineTo(Math.round(b[0]), Math.round(b[1])); ctx.stroke(); }
      const a = L(top[i], base[i], 0.75), b = L(top[j], base[j], 0.75);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(base[j][0], base[j][1]); ctx.lineTo(base[i][0], base[i][1]); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(top[3][0], top[3][1]); ctx.lineTo(top[2][0], top[2][1]); ctx.lineTo(top[1][0], top[1][1]); ctx.stroke();
  },
  player(ctx, cam) {
    if (Story.hidePlayer) return;
    const P = Player, s = Iso.toScreen(P.x, P.y, cam), px = Math.round(s.x), py = Math.round(s.y), t = Game.time;
    // procedural animation: walk bob, dash stretch, attack lean
    const walk = P.moving && !P.dash.active ? Math.abs(Math.sin(t * 14)) : 0;
    let sx = 1, sy = 1 + walk * 0.08;
    if (P.dash.active) { sx = 1.35; sy = 0.75; } else if (P.atk) { sx = 1.15; sy = 0.9; }
    const body = (x, y, col, a = 1) => {
      const hw = Math.round(4 * sx), h = Math.round(13 * sy), lift = Math.round(walk * 2), top = y - h - 1 - lift;
      ctx.globalAlpha = a; ctx.fillStyle = CFG.col.outline; ctx.fillRect(x - hw - 1, top - 1, hw * 2 + 2, h + 2);   // outline
      ctx.fillStyle = col; ctx.fillRect(x - hw, top, hw * 2, h);
      ctx.fillStyle = CFG.col.playerHi; ctx.fillRect(x - hw, top, hw * 2, 3);                                         // hotspot
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x - hw, top + h - 4, hw * 2, 4);                               // core shadow
      ctx.globalAlpha = 1;
    };
    for (const g of P.ghosts) { const gs = Iso.toScreen(g.x, g.y, cam); if (!Sprites.draw(ctx, 'player_' + P.look, 'dash', 0, gs.x, gs.y, P.aim, { alpha: g.a * 0.6 })) body(Math.round(gs.x), Math.round(gs.y), CFG.col.iframe, g.a * 0.6); }
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(px, py, 7 * sx, 3.5, 0, 0, 7); ctx.fill();
    const an = P.dead ? 'die' : P.dash.active ? 'dash' : P.atk ? 'attack' : P.hurtT > CFG.hurt.iframes - 0.25 ? 'hurt' : P.moving ? 'walk' : 'idle';
    const nm = 'player_' + P.look, behind = P.aim.y < -0.35;
    if (Sprites.ok[nm]) {                                   // painted resident + procedural weapon (swing follows the attack timing)
      if (behind && !P.dead) Renderer.weapon(ctx, px, py, P);
      Sprites.draw(ctx, nm, an, Sprites.track(P, an), px, py, P.aim, { flash: P.flashT > 0, alpha: P.invuln && Math.floor(performance.now() / 40) % 2 ? 0.55 : 1 });
      if (!behind && !P.dead) Renderer.weapon(ctx, px, py, P);
      return;
    }
    let col = CFG.col.player;
    if (P.flashT > 0) col = '#fff';                                       // 1-frame white hit-flash
    else if (P.invuln) col = (Math.floor(performance.now() / 40) % 2) ? CFG.col.iframe : '#fff';
    body(px, py, col, P.dash.active && !P.invuln ? 0.85 : 1);
    const wx = px + P.aim.x * 9, wy = py - 8 + P.aim.y * 9;
    ctx.fillStyle = CFG.col.outline; ctx.fillRect(Math.round(wx) - 2, Math.round(wy) - 2, 5, 5);
    ctx.fillStyle = '#d8d2c4'; ctx.fillRect(Math.round(wx) - 1, Math.round(wy) - 1, 3, 3);
  },
  weapon(ctx, px, py, P, idOver) {
    const id = idOver || Weapons.cur, a = Math.atan2(P.aim.y, P.aim.x), W = CFG.weapon;
    let ang = a + 0.95; if (P.atk) ang = a + (0.5 - Math.min(1, P.atk.t / W.dur)) * 2.4;
    const hx = px + P.aim.x * 3, hy = py - 10 + P.aim.y * 1.5, c = Math.cos(ang), s = Math.sin(ang);
    const seg = (a0, a1, w, col) => { ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + c * a0, hy + s * a0); ctx.lineTo(hx + c * a1, hy + s * a1); ctx.strokeStyle = PAL.ink; ctx.lineWidth = w + 1.6; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
    if (id === 'broom') { seg(-2, 12, 1.5, '#8a6a40'); ctx.save(); ctx.translate(hx + c * 12, hy + s * 12); ctx.rotate(ang); ctx.fillStyle = PAL.ink; ctx.fillRect(-1, -3.5, 6, 7); ctx.fillStyle = '#d8b860'; ctx.fillRect(-0.2, -2.7, 4.4, 5.4); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-0.2, -2.7, 4.4, 1.2); ctx.restore(); }
    else if (id === 'pan') { seg(-1, 8, 1.8, '#3a3d44'); const ex = hx + c * 11, ey = hy + s * 11; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(ex, ey, 5.3, 0, 7); ctx.fill(); ctx.fillStyle = '#4a505a'; ctx.beginPath(); ctx.arc(ex, ey, 4.4, 0, 7); ctx.fill(); ctx.strokeStyle = PAL.neonCyan + '99'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(ex, ey, 3.7, -0.9, 0.5); ctx.stroke(); }
    else { seg(-1, 2.5, 2.2, '#26262e'); seg(2.5, 11, 1.7, '#dfe8ee'); }
  },
  AMB: { KUECHE: '8,12,24', FLUR: '14,10,30', BAD: '4,16,22', KELLER: '22,8,18', BUNKER: '30,10,4', DACH: '12,14,34' },
  lights() {
    const L = [], T = Game.time, fl = 1 + Math.sin(T * 11) * 0.03 + Math.sin(T * 23) * 0.02;
    L.push({ x: Player.x, y: Player.y, z: 8, r: 150 * fl, a: 1, col: '110,225,235', g: 0.10 });                       // player torch (flickers)
    if (Player.atk) L.push({ x: Player.x + Player.atk.dir.x, y: Player.y + Player.atk.dir.y, z: 8, r: 70, a: 0.8, col: '255,230,180', g: 0.18 });
    for (const sh of Combat.shots) L.push({ x: sh.x, y: sh.y, z: 8, r: 45, a: 0.9, col: '255,150,60', g: 0.25 });
    for (const e of Combat.enemies) {
      if (e.state === 'windup') L.push({ x: e.x, y: e.y, z: 10, r: 40, a: 0.6, col: '255,60,40', g: 0.2 });
      if (e.type === 'boss') L.push({ x: e.x, y: e.y, z: 14, r: 90, a: 0.7, col: '180,60,150', g: 0.12 });
    }
    for (const h of Combat.hazards) if (h.lava) L.push({ x: h.x, y: h.y, z: 2, r: 75, a: 0.9, col: '255,110,30', g: 0.22 });
    {
    }
    for (const g of Gear.drops) if (g.item.r >= 1) L.push({ x: g.x, y: g.y, z: 8, r: 45, a: 0.7, col: Gear.rgb(CFG.gear.rarities[g.item.r].col), g: 0.25 });
    for (const c of Room.containers) L.push({ x: c.x, y: c.y, z: 12, r: 55, a: 0.8, col: '120,230,130', g: 0.12 });
    if (Room.terminal) L.push({ x: Room.terminal.x, y: Room.terminal.y, z: 14, r: 70, a: 0.9, col: '110,200,255', g: 0.16 });
    if (Room.wardrobe) L.push({ x: Room.wardrobe.x, y: Room.wardrobe.y, z: 14, r: 55, a: 0.8, col: '35,227,219', g: 0.12 });
    if (Room.rack) L.push({ x: Room.rack.x, y: Room.rack.y, z: 14, r: 55, a: 0.8, col: '35,227,219', g: 0.12 });
    if (Room.envLights) for (const l of Room.envLights) {                  // neon signs flicker, windows stay steady
      const f = l.fl >= 0 ? 0.8 + 0.2 * Math.sin(T * 7 + l.fl) * Math.sin(T * 1.7 + l.fl * 2) : 1;
      L.push({ x: l.x, y: l.y, z: l.z, r: l.r, a: l.a * f, col: l.col, g: l.g * f });
    }
    if (Room.door && !Run.locked) L.push({ x: Room.door.x + 0.5, y: Room.door.y + 0.5, z: 4, r: 65, a: 0.9, col: '110,255,150', g: 0.14 });
    return L;
  },
  lighting(ctx) {   // chiaroscuro: dark ambient light map, lights punch holes, additive glow on top
    const W = CFG.view.w, H = CFG.view.h, g = Renderer.lm.getContext('2d'), v = Camera.view(), Ls = Renderer.lights();
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(' + (Renderer.AMB[Run.biome.name] || '8,6,14') + ',' + (Game.mode === 'roof' ? 0.5 : 0.86) + ')'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    for (const l of Ls) {
      const p = Iso.toScreen(l.x, l.y, v), y = p.y - l.z, gr = g.createRadialGradient(p.x, y, 0, p.x, y, l.r);
      gr.addColorStop(0, 'rgba(0,0,0,' + l.a + ')'); gr.addColorStop(0.5, 'rgba(0,0,0,' + l.a * 0.45 + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(p.x - l.r, y - l.r, l.r * 2, l.r * 2);
    }
    ctx.drawImage(Renderer.lm, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const l of Ls) {
      const p = Iso.toScreen(l.x, l.y, v), y = p.y - l.z, r = l.r * 0.6, gr = ctx.createRadialGradient(p.x, y, 0, p.x, y, r);
      gr.addColorStop(0, 'rgba(' + l.col + ',' + l.g + ')'); gr.addColorStop(1, 'rgba(' + l.col + ',0)');
      ctx.fillStyle = gr; ctx.fillRect(p.x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (Player.hurtT > 0 && !Player.dead) {   // red hurt vignette
      const a = Player.hurtT / CFG.hurt.iframes * 0.4, gr = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 280);
      gr.addColorStop(0, 'rgba(160,0,20,0)'); gr.addColorStop(1, 'rgba(160,0,20,' + a + ')'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
  },
  hud(ctx, fps) {
    if (Game.ui === 'title' || Game.ui === 'select' || Story.phase === 'intro') return;
    UI.hud(ctx);
    if (Game.debug) {                                                      // debug info only on F3
      UI.text(ctx, 'FPS ' + fps + '  I-FRAME ' + (Player.invuln ? 'ON' : '--') + '  ENEMIES ' + Combat.enemies.length, 6, 44, PAL.uiDim, '7px monospace');
      if (Sprites.msg && performance.now() - Sprites.msgAt < 4000) UI.text(ctx, Sprites.msg, 6, 53, PAL.armor, '7px monospace');
    }
  },
  debug(ctx, cam) {
    for (let y = 0; y < Room.h; y++) for (let x = 0; x < Room.w; x++) if (Room.tiles[y][x]) {
      const c = Renderer.corners(x, y, cam); ctx.strokeStyle = 'rgba(255,0,0,.6)';
      ctx.beginPath(); c.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    }
    const s = Iso.toScreen(Player.x, Player.y, cam); ctx.strokeStyle = '#0f0'; ctx.strokeRect(s.x - 2, s.y - 2, 4, 4);
  },
  frame(fps, debug) {
    const ctx = Renderer.ctx, v = Camera.view(), cam = { x: v.x, y: v.y };
    ctx.setTransform(CFG.view.ss, 0, 0, CFG.view.ss, 0, 0);   // all drawing code keeps using logical 480x270 units
    ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, CFG.view.w, CFG.view.h);
    if (Game.mode === 'roof') { Roof.sky(ctx, cam); Roof.building(ctx, cam); }
    Renderer.floor(ctx, cam);
    Particles.drawDecals(ctx, cam);
    Boss.drawHazards(ctx, cam);
    // depth-sorted pass (painter's algorithm): depth = x + y
    const list = [];
    for (let y = 0; y < Room.h; y++) for (let x = 0; x < Room.w; x++) if (Room.tiles[y][x] === 1 || (Room.tiles[y][x] === 2 && Run.locked)) list.push({ d: x + y + 1, f: () => Renderer.wall(ctx, x, y, cam) });
    list.push({ d: Player.x + Player.y, f: () => Renderer.player(ctx, cam) });
    for (const e of Combat.enemies) list.push({ d: e.x + e.y, f: () => Combat.drawEnemy(ctx, e, cam) });
    for (const s of Combat.shots) list.push({ d: s.x + s.y, f: () => Combat.drawShot(ctx, s, cam) });
    for (const c of Combat.corpses) list.push({ d: c.x + c.y - 0.3, f: () => Combat.drawCorpse(ctx, c, cam) });
    for (const q of Combat.pshots) list.push({ d: q.x + q.y, f: () => Combat.drawKnife(ctx, q, cam) });
    for (const g of Gear.drops) list.push({ d: g.x + g.y, f: () => Gear.drawDrop(ctx, g, cam) });
    for (const it of Trash.items) list.push({ d: it.x + it.y, f: () => Trash.drawItem(ctx, it, cam) });
    for (const c of Room.containers) list.push({ d: c.x + c.y, f: () => Trash.drawContainer(ctx, c, cam) });
    if (Room.terminal) list.push({ d: Room.terminal.x + Room.terminal.y, f: () => Hub.drawTerminal(ctx, cam) });
    if (Room.rack) list.push({ d: Room.rack.x + Room.rack.y, f: () => Hub.drawRack(ctx, cam) });
    if (Room.wardrobe) list.push({ d: Room.wardrobe.x + Room.wardrobe.y, f: () => Hub.drawWardrobe(ctx, cam) });
    if (Game.mode === 'hub' && Room.door) list.push({ d: Room.door.x + Room.door.y + 2, f: () => Hub.drawDoorLabel(ctx, cam) });
    if (Game.mode === 'tut' && Room.door && !Run.locked) list.push({ d: 99, f: () => { const s = Iso.toScreen(Room.door.x + 0.5, Room.door.y + 0.5, cam); Trash.label(ctx, Math.round(s.x), Math.round(s.y) - 14, 'IN DIE KÜCHE >>', PAL.uiInteract); } });
    for (const n of Hub.npcs()) list.push({ d: n.x + n.y, f: () => Game.mode === 'roof' ? Roof.drawNpc(ctx, n, cam) : Hub.drawNpc(ctx, n, cam) });
    if (Game.mode === 'roof') Roof.objects(list, ctx, cam);
    list.sort((a, b) => a.d - b.d).forEach(o => o.f());
    if (Game.mode === 'roof') Roof.strands(ctx, cam);
    Combat.drawFx(ctx, cam);
    Combat.drawRing(ctx, cam);
    Abilities.drawTel(ctx, cam); Boss.drawTel(ctx, cam);
    Particles.draw(ctx, cam);
    Renderer.lighting(ctx);
    Combat.drawText(ctx, cam);
    if (debug) Renderer.debug(ctx, cam);
    Renderer.hud(ctx, fps);
    if (Game.mode === 'roof') Roof.drawOverlay(ctx);
    if (Game.ui === 'menu') Menu.draw(ctx);
    UI.overlays(ctx);
    Run.drawFade(ctx);
  }
};
