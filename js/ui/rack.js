// Trash Vs. Nazi-Zombies - Waffenregal
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ RACK (weapon overview: all weapons side by side with their stats) ============ */
const Rack = {
  i: 0, lm: { x: -1, y: -1 },
  SPEC: { shockwave: 'Schockwelle stößt alle weg. Gut für Wall Slams.', slam: 'Bodenschlag betäubt und bricht Panzer doppelt.', throw: 'Wurfmesser durchbohrt alle in einer Linie.' },
  open() { Rack.i = Math.max(0, Weapons.ids.indexOf(Weapons.cur)); Game.ui = 'rack'; Snd.sfx('ui'); ['KeyF', 'KeyE'].forEach(k => Input.pressed.delete(k)); },
  X(i) { return 38 + i * 138; },
  stat(id) { const w = Object.assign({}, Weapons.defaults, CFG.weapons[id]); return w; },
  update() {
    const m = Input.mouse, n = Weapons.ids.length;
    if (Input.hit('Escape', 'KeyE', 'KeyI', 'Tab')) { Game.ui = null; Snd.sfx('ui'); return; }
    if (Input.hit('KeyA', 'ArrowLeft')) { Rack.i = (Rack.i + n - 1) % n; Snd.sfx('ui'); }
    if (Input.hit('KeyD', 'ArrowRight')) { Rack.i = (Rack.i + 1) % n; Snd.sfx('ui'); }
    let hov = -1; for (let i = 0; i < n; i++) if (m.x >= Rack.X(i) && m.x < Rack.X(i) + 130 && m.y >= 42 && m.y < 236) hov = i;
    if (hov >= 0 && (m.x !== Rack.lm.x || m.y !== Rack.lm.y)) Rack.i = hov; Rack.lm = { x: m.x, y: m.y };
    if (Input.hit('Enter', 'Space', 'KeyF') || (Input.hit('Mouse0') && hov >= 0)) Weapons.choose(Weapons.ids[Rack.i]);
  },
  draw(ctx) {
    const W = CFG.view.w, H = CFG.view.h, ids = Weapons.ids, all = ids.map(Rack.stat), mx = k => Math.max(...all.map(w => k === 'speed' ? 1 / w.cd : w[k]));
    UI.panel(ctx, 'WAFFENREGAL', 'MUELL ' + Trash.bank);
    ids.forEach((id, i) => {
      const w = all[i], x = Rack.X(i), y = 42, on = i === Rack.i, eq = id === Weapons.cur, own = Weapons.unlocked[id];
      UI.box(ctx, x, y, 130, 192, on ? PAL.uiInteract : null, null, { vines: false });
      ctx.save(); ctx.translate(x + 65, y + 44); ctx.scale(2.6, 2.6); Renderer.weapon(ctx, 0, 8, { aim: { x: -0.28, y: -0.96 }, atk: null }, id); ctx.restore();
      UI.head(ctx, w.name.toUpperCase(), x + 65, y + 62, 'center', 9);
      const st = eq ? ['AUSGERÜSTET', PAL.uiInteract] : own ? ['F / KLICK: NEHMEN', PAL.uiText] : ['KAUFEN: ' + w.cost + ' MÜLL', Trash.bank >= w.cost ? PAL.uiLoot : '#c06070'];
      UI.text(ctx, st[0], x + 65, y + 80, st[1], 'bold 7px monospace', 'center');
      [['SCHADEN', w.base, 'base'], ['TEMPO', +(1 / w.cd).toFixed(1), 'speed'], ['REICHWEITE', w.range, 'range'], ['CRIT', Math.round(w.critP * 100), 'critP']].forEach(([l, v, k], j) => {
        const yy = y + 94 + j * 15, f = (k === 'speed' ? 1 / w.cd : w[k]) / mx(k);
        UI.text(ctx, l, x + 8, yy, PAL.uiDim, '7px monospace'); UI.text(ctx, String(v) + (k === 'critP' ? ' %' : k === 'speed' ? ' /s' : ''), x + 122, yy, PAL.uiText, '7px monospace', 'right');
        ctx.fillStyle = '#1b1f25'; ctx.fillRect(x + 8, yy + 9, 114, 2); ctx.fillStyle = on ? PAL.uiInteract : PAL.uiBrass; ctx.fillRect(x + 8, yy + 9, 114 * f, 2);
      });
      UI.text(ctx, 'SPEZIAL (RMB): ' + (w.special ? w.special.name.toUpperCase() : '-'), x + 8, y + 156, PAL.uiHead, 'bold 7px monospace');
      ctx.font = '7px monospace'; Dialog.wrap(ctx, Rack.SPEC[w.special && w.special.type] || '', 114).slice(0, 2).forEach((ln, j) => UI.text(ctx, ln, x + 8, y + 166 + j * 9, PAL.uiDim, '7px monospace'));
      UI.text(ctx, w.desc || '', x + 65, y + 184, PAL.uiDim, 'italic 6px monospace', 'center');
    });
    UI.text(ctx, 'A / D: WÄHLEN  ·  F ODER KLICK: NEHMEN / KAUFEN  ·  ESC: ZU', W / 2, H - 22, PAL.uiDim, '7px monospace', 'center');
  }
};
