// Trash Vs. Nazi-Zombies - Rucksack
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ INVENTORY MENU (backpack with fixed slots: bag = 1, crate = 2) ============ */
const Inv = {
  hover: -1,
  layout() { let s = 0; return Trash.carry.map((k, idx) => { const w = CFG.trash.kinds[k].w, r = { kind: k, slot: s, w, idx }; s += w; return r; }); },
  geom() { const cap = Trash.cap(), cw = 44; return { cap, cw, x0: Math.round((CFG.view.w - cap * cw) / 2) + 2, y: 62 }; },
  cont() { return Room.containers.find(c => Math.hypot(c.x - Player.x, c.y - Player.y) < CFG.trash.depositR); },
  canDeposit() { return !!Inv.cont() && Trash.carry.length > 0; },
  update() {
    if (Input.hit('Escape', 'KeyI', 'Tab')) { Game.ui = null; Snd.sfx('ui'); return; }
    const m = Input.mouse, g = Inv.geom(); Inv.hover = -1;
    for (const it of Inv.layout()) if (m.x >= g.x0 + it.slot * g.cw && m.x < g.x0 + (it.slot + it.w) * g.cw - 4 && m.y >= g.y && m.y < g.y + 40) Inv.hover = it.idx;
    if (Input.hit('Mouse0')) {
      if (Inv.hover >= 0) {                                              // click an item = drop it at the feet
        const k = Trash.carry.splice(Inv.hover, 1)[0];
        Trash.drop(Player.x + (Math.random() - 0.5) * 0.8, Player.y + (Math.random() - 0.5) * 0.8, k, 0.5); Snd.sfx('ui'); Inv.hover = -1;
      } else if (Inv.canDeposit() && m.x > 170 && m.x < 310 && m.y > 200 && m.y < 222) Trash.deposit(Inv.cont());
    }
  },
  draw(ctx) {
    const W = CFG.view.w, H = CFG.view.h, g = Inv.geom(), K = CFG.trash.kinds;
    UI.panel(ctx, 'RUCKSACK', Trash.weight() + ' / ' + g.cap + ' PLAETZE', PAL.uiLoot); ctx.font = '8px monospace';
    for (let s = 0; s < g.cap; s++) { ctx.fillStyle = '#000'; ctx.fillRect(g.x0 + s * g.cw - 1, g.y - 1, 42, 42); ctx.fillStyle = '#1f1b28'; ctx.fillRect(g.x0 + s * g.cw, g.y, 40, 40); }
    for (const it of Inv.layout()) {                                      // items; a crate spans two slots
      const x = g.x0 + it.slot * g.cw, w = it.w * g.cw - 4;
      ctx.fillStyle = Inv.hover === it.idx ? '#3a3350' : '#2c2738'; ctx.fillRect(x, g.y, w, 40);
      ctx.save(); ctx.translate(x + w / 2, g.y + 33); ctx.scale(2, 2); Trash.sprite(ctx, 0, 0, it.kind); ctx.restore();
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8dcc8';
    const h = Inv.hover >= 0 ? Trash.carry[Inv.hover] : null;
    if (h) { ctx.fillText(K[h].name.toUpperCase() + '  |  ' + K[h].w + ' PLATZ  |  WERT ' + K[h].v, W / 2, 116); ctx.fillStyle = '#8f8a98'; ctx.fillText('KLICK = FALLEN LASSEN', W / 2, 128); }
    else { ctx.fillStyle = '#8f8a98'; ctx.fillText(Trash.carry.length ? 'ITEMS ' + Trash.carry.length + '  |  GESAMTWERT ' + Trash.value() : 'RUCKSACK IST LEER', W / 2, 116); }
    ctx.textAlign = 'left'; ctx.fillStyle = '#cfc6b8';
    ctx.fillText('TEMPO  -' + Math.round((1 - Trash.speedMul()) * 100) + '%', 40, 150); ctx.fillText('GESICHERT  ' + Trash.secured, 40, 162); ctx.fillText('BANK  ' + Trash.bank, 40, 174);
    ctx.fillStyle = '#8f8a98'; ctx.fillText('TOD = Rucksack weg, Gesichertes bleibt', 190, 150); ctx.fillText('Treffer = 1 Item faellt raus', 190, 162);
    ctx.textAlign = 'center';
    if (Inv.canDeposit()) { ctx.fillStyle = '#000'; ctx.fillRect(169, 199, 142, 24); ctx.fillStyle = '#2f5a3c'; ctx.fillRect(170, 200, 140, 22); ctx.fillStyle = '#e8f6e0'; ctx.fillText('ABGEBEN  +' + Trash.value(), 240, 207); }
    else { ctx.fillStyle = '#8f8a98'; ctx.fillText(Inv.cont() ? 'NICHTS ZUM ABGEBEN' : Game.mode === 'hub' ? '' : (Room.containers.length ? 'CONTAINER IM RAUM' : 'NAECHSTER CONTAINER: RAUM ' + Run.nextContainer()), 240, 207); }
    ctx.fillText('I / TAB / ESC: SCHLIESSEN', 240, H - 30); ctx.textAlign = 'left';
  }
};
