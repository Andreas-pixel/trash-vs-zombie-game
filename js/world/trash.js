// Trash Vs. Nazi-Zombies - Muell: aufheben, tragen, abgeben
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ TRASH (carry / drop / deliver) ============ */
const Trash = {
  items: [], carry: [], secured: 0, bank: 0, t: 0, near: null, atContainer: false,
  weight() { return Trash.carry.reduce((a, k) => a + CFG.trash.kinds[k].w, 0); },
  value()  { return Trash.carry.reduce((a, k) => a + CFG.trash.kinds[k].v, 0); },
  // slows movement only (dash + attack untouched): up to -25% at full load
  cap() { return CFG.trash.cap + Skills.v('cap'); },
  speedMul() { return 1 - CFG.trash.slow * (1 - Skills.v('carry')) * Math.min(1, Trash.weight() / Trash.cap()); },
  newRun() {   // secured trash is banked (becomes hub currency in M5); carried trash was already lost on death
    Trash.bank += Trash.secured; Trash.secured = 0; Trash.carry = []; Trash.items = [];
  },
  scatter(kind) {
    for (let i = 0; i < 60; i++) {
      const x = 1.5 + Math.random() * (Room.w - 3), y = 1.5 + Math.random() * (Room.h - 3);
      if (Room.boxBlocked(x, y, 0.4) || Math.hypot(x - Player.x, y - Player.y) < 3) continue;
      Trash.drop(x, y, kind, 0); return;
    }
  },
  drop(x, y, kind, delay) {   // 'bag' / 'crate' are drop categories: they become a can, bottle, banana peel or a cardboard box
    if (kind === 'bag') kind = ['can', 'bottle', 'banana'][Math.floor(Math.random() * 3)]; else if (kind === 'crate') kind = 'box';
    Trash.items.push({ x, y, kind, delay });
  },
  maybeDrop(e) {
    if (e.elite) Trash.drop(e.x, e.y, 'crate', 0.3);   // elites always drop a crate
    const d = CFG.trash.drops[e.type]; if (!d || Math.random() >= d[1]) return;
    for (let i = 0; i < (d[2] || 1); i++) Trash.drop(e.x + (Math.random() - .5) * 1.2, e.y + (Math.random() - .5) * 1.2, d[0], 0.3);
  },
  roomLoot(boss) { Trash.items = []; for (let i = 0; i < (boss ? 3 : 2); i++) Trash.scatter('bag'); if (Math.random() < 0.45) Trash.scatter('crate'); },
  // on hit: partial drop = last picked item falls out, re-collectable after a short delay
  hurtDrop() {
    const k = Trash.carry.pop(); if (!k) return;
    const a = Math.random() * 6.28; let x = Player.x + Math.cos(a) * 0.7, y = Player.y + Math.sin(a) * 0.7;
    if (Room.boxBlocked(x, y, 0.3)) { x = Player.x; y = Player.y; }
    Trash.drop(x, y, k, CFG.trash.hitDelay); Combat.text(Player.x, Player.y - 0.6, 'VERLOREN!', PAL.uiLoot, true);
  },
  onDeath() {   // death: everything carried is lost
    const v = Trash.value(); Trash.carry = []; Trash.lost = v;
    if (v) Combat.text(Player.x, Player.y - 0.6, v + ' MUELL VERLOREN', PAL.uiLoot, true);
  },
  update(dt) {
    const T = CFG.trash; Trash.t += dt; Trash.near = null; Trash.atContainer = false;
    for (const it of Trash.items) it.delay = Math.max(0, it.delay - dt);
    if (Player.dead) return;
    let best = 1e9;
    for (const it of Trash.items) {
      const d = Math.hypot(it.x - Player.x, it.y - Player.y);
      if (d < T.pickR && d < best && it.delay <= 0 && Trash.weight() + T.kinds[it.kind].w <= Trash.cap()) { best = d; Trash.near = it; }
    }
    const cont = Room.containers.find(c => Math.hypot(c.x - Player.x, c.y - Player.y) < T.depositR);
    const full = !Trash.near && Trash.items.some(it => it.delay <= 0 && Math.hypot(it.x - Player.x, it.y - Player.y) < T.pickR);
    if (full && Input.hit('KeyF', 'KeyE') && !(cont && Trash.carry.length)) Combat.text(Player.x, Player.y - 0.5, 'RUCKSACK VOLL', '#ff7080', false);
    Trash.atContainer = !!cont && Trash.carry.length > 0;
    if (Input.hit('KeyF', 'KeyE')) {
      if (Trash.atContainer) {                                           // deposit everything -> secured
        Trash.deposit(cont);
      } else if (Trash.near) {                                           // pick up nearest fitting item
        Particles.burst(Trash.near.x, Trash.near.y, 4, 6, { col: '#9fe070', speed: 1.5, up: 40, life: 0.4, size: 1, grav: 80 }); Snd.sfx('pickup'); Trash.carry.push(Trash.near.kind); Trash.items.splice(Trash.items.indexOf(Trash.near), 1); Trash.near = null;
      }
    }
  },
  deposit(cont) {   // everything in the pack -> secured (survives death)
    const v = Trash.value(); Trash.secured += v; Trash.carry = [];
    Particles.burst(cont.x, cont.y, 14, 16, { col: '#9fe070', speed: 2.5, up: 60, life: 0.6, size: 1, grav: 90 });
    Snd.sfx('deposit'); Combat.text(cont.x, cont.y, '+' + v + ' GESICHERT', PAL.uiLoot, true); Camera.shake(1.5);
  },
  label(ctx, x, y, str, col) {   // neon world prompt: ink shadow + glowing text
    ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(5,7,12,.85)'; ctx.fillText(str, x + 0.6, y + 0.6);
    ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(5,7,12,.9)'; ctx.strokeText(str, x, y);
    ctx.shadowColor = col; ctx.shadowBlur = 4; ctx.fillStyle = col; ctx.fillText(str, x, y); ctx.shadowBlur = 0;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  },
  sprite(ctx, x, y, kind) {
    if (Sprites.draw(ctx, kind, 'idle', Game.time, x, y, null)) return;   // a dropped PNG with this name wins
    const id = kind === 'crate' ? 'box' : kind === 'bag' ? 'can' : kind, i = Math.max(0, Env.TRASH.indexOf(id)), K = CFG.view.ss;
    if (Env.imgs.trash) ctx.drawImage(Env.imgs.trash, i * 24 * K, 0, 24 * K, 22 * K, x - 12, y - 20, 24, 22);
  },
  drawItem(ctx, it, cam) {
    const s = Iso.toScreen(it.x, it.y, cam), x = Math.round(s.x), y = Math.round(s.y);
    const hop = it.delay > 0 ? Math.round(Math.abs(Math.sin(Trash.t * 10)) * 2) : 0;   // freshly dropped items hop
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(x, y, 6, 2.8, 0, 0, 7); ctx.fill();
    if (it.delay <= 0) {                                                   // neon = information: green ring only while it can be picked up
      const pu = 0.5 + 0.5 * Math.sin(Trash.t * 4 + it.x * 2);
      ctx.save(); ctx.shadowColor = PAL.uiLoot; ctx.shadowBlur = 8; ctx.strokeStyle = 'rgba(67,224,138,' + (0.45 + 0.4 * pu) + ')'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(x, y, 8, 3.6, 0, 0, 7); ctx.stroke(); ctx.restore();
    }
    Trash.sprite(ctx, x, y - hop, it.kind);
    if (Trash.near === it) Trash.label(ctx, x, y - 15, 'F', PAL.uiLoot);
  },
  drawContainer(ctx, c, cam) {
    const s = Iso.toScreen(c.x, c.y, cam), x = Math.round(s.x), y = Math.round(s.y);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 4.5, 0, 0, 7); ctx.fill();
    if (!Sprites.draw(ctx, 'container', 'idle', Game.time, x, y, null)) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 10, y - 18, 20, 18); ctx.fillStyle = '#2f5a3c'; ctx.fillRect(x - 9, y - 17, 18, 16);
    ctx.fillStyle = '#244a30'; ctx.fillRect(x - 9, y - 9, 18, 1); ctx.fillRect(x - 3, y - 17, 1, 16); ctx.fillRect(x + 3, y - 17, 1, 16);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 11, y - 22, 22, 6); ctx.fillStyle = '#4a8a60'; ctx.fillRect(x - 10, y - 21, 20, 4);
    }
    if (Trash.atContainer) Trash.label(ctx, x, y - 27, 'F: ABGEBEN', PAL.uiLoot);
  },
  drawCarry(ctx, cam) {
    const s = Iso.toScreen(Player.x, Player.y, cam), x = Math.round(s.x), y = Math.round(s.y) - 16;
    let off = 0; Trash.carry.forEach(k => { Trash.sprite(ctx, x, y - off, k); off += k === 'crate' ? 9 : 7; });
  }
};
