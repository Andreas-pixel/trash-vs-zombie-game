// Trash Vs. Nazi-Zombies - Ruestung: Erzeugen, Drops, Anlegen
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ GEAR (armor items: generation, drops, equip) ============ */
const Gear = {
  eq: { helm: null, vest: null, boots: null }, stash: [], drops: [], uid: 1,
  rgb(hex) { return parseInt(hex.slice(1, 3), 16) + ',' + parseInt(hex.slice(3, 5), 16) + ',' + parseInt(hex.slice(5, 7), 16); },
  stat(k) { let t = 0; for (const sl of CFG.gear.slots) { const it = Gear.eq[sl]; if (it && it.stats[k]) t += it.stats[k]; } return t; },
  reduction() { const a = Skills.v('armor'); return Math.min(0.75, a / (a + CFG.gear.armorK)); },
  make(slot, bi, ri) {
    const G = CFG.gear, base = G.bases[slot][bi], R = G.rarities[ri], stats = {};
    for (const k in base) if (k !== 'name') stats[k] = k === 'armor' || k === 'hp' ? Math.round(base[k] * R.mult) : +(base[k] * R.mult).toFixed(3);
    const pool = Object.keys(G.affixes).sort(() => Math.random() - 0.5);
    for (let i = 0; i < R.aff; i++) { const k = pool[i], v = G.affixes[k] * R.mult * (0.8 + Math.random() * 0.4); stats[k] = (stats[k] || 0) + (k === 'hp' || k === 'armor' ? Math.max(1, Math.round(v)) : +v.toFixed(3)); }
    if (ri === 4) stats.cap = 1;                                       // legendary: +1 backpack slot
    return { id: Gear.uid++, slot, base: bi, r: ri, name: base.name, stats };
  },
  roll(room, minR) {                                                    // deeper rooms: better bases and rarities
    const G = CFG.gear, slot = G.slots[Math.floor(Math.random() * 3)], bi = Math.min(G.bases[slot].length - 1, Math.floor(Math.random() * (1 + room / 5)));
    const w = G.rarities.map((r, i) => r.w * (1 + i * room / 12)); let x = Math.random() * w.reduce((a, b) => a + b, 0), ri = 0;
    for (; ri < w.length - 1 && x >= w[ri]; ri++) x -= w[ri];
    return Gear.make(slot, bi, Math.max(ri, minR || 0));
  },
  maybeDrop(e) {
    const c = CFG.gear.drops[e.type] || 0; if (Math.random() >= c * (e.elite ? 3 : 1) * (1 + Skills.v('luck'))) return;
    for (let i = 0; i < (e.type === 'boss' ? 2 : 1); i++) Gear.drops.push({ x: e.x + (Math.random() - 0.5) * 1.2, y: e.y + (Math.random() - 0.5) * 1.2, item: Gear.roll(Run.room, e.type === 'boss' ? 1 : 0), delay: 0.5 });
  },
  recalc() { Skills.apply(); Player.hp = Math.min(Player.hp, Player.maxHp); Save.save(); },
  equip(it) {
    const i = Gear.stash.findIndex(x => x.id === it.id); if (i < 0) return;
    Gear.stash.splice(i, 1); const old = Gear.eq[it.slot]; Gear.eq[it.slot] = it; if (old) Gear.stash.push(old);
    Snd.sfx('ui'); Gear.recalc();
  },
  unequip(slot) {
    if (!Gear.eq[slot]) return;
    if (Gear.stash.length >= CFG.gear.stash) { Combat.text(Player.x, Player.y - 0.5, 'LAGER VOLL', '#ff7080', false); return; }
    Gear.stash.push(Gear.eq[slot]); Gear.eq[slot] = null; Snd.sfx('ui'); Gear.recalc();
  },
  update(dt) {
    for (const d of Gear.drops) d.delay -= dt;
    if (Player.dead) return;
    for (const d of Gear.drops) if (d.delay <= 0 && Math.hypot(d.x - Player.x, d.y - Player.y) < 0.8) {   // auto-pickup
      if (Gear.stash.length >= CFG.gear.stash) { if (!d.warned) { d.warned = true; Combat.text(Player.x, Player.y - 0.5, 'LAGER VOLL', '#ff7080', false); } continue; }
      Gear.stash.push(d.item); d.got = true; Snd.sfx('pickup'); Save.save();
      Combat.text(Player.x, Player.y - 0.6, d.item.name.toUpperCase(), CFG.gear.rarities[d.item.r].col, d.item.r >= 2);
    }
    Gear.drops = Gear.drops.filter(d => !d.got);
  },
  drawDrop(ctx, d, cam) {
    const s = Iso.toScreen(d.x, d.y, cam), x = Math.round(s.x), y = Math.round(s.y), R = CFG.gear.rarities[d.item.r], bob = Math.round(Math.sin(Game.time * 4 + d.x) * 1.5);
    if (d.item.r >= 1) { const gr = ctx.createLinearGradient(0, y - 34, 0, y); gr.addColorStop(0, 'rgba(' + Gear.rgb(R.col) + ',0)'); gr.addColorStop(1, 'rgba(' + Gear.rgb(R.col) + ',0.45)'); ctx.fillStyle = gr; ctx.fillRect(x - 2, y - 34, 4, 34); }   // loot beam
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(x, y, 5, 2.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(x - 5, y - 11 + bob, 10, 10); ctx.fillStyle = R.col; ctx.fillRect(x - 4, y - 10 + bob, 8, 8);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(x - 4, y - 10 + bob, 8, 2);
  },
  lines(it) {   // tooltip stat lines
    return Object.keys(it.stats).map(k => CFG.gear.labels[k] + ' ' + (k === 'armor' || k === 'hp' || k === 'cap' ? '+' + it.stats[k] : (k === 'dash' ? '-' : '+') + Math.round(it.stats[k] * 100) + '%'));
  }
};
