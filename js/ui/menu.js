// Trash Vs. Nazi-Zombies - Menue: Kleidung, Inventar, Skilltree
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ MENU (tabs: Charakter, Rucksack, Ausruestung, Skills, Garderobe [hub only]) ============ */
const Menu = {
  tab: 0, last: 1, TABS: ['KLEIDUNG', 'INVENTAR', 'SKILLTREE'], hover: -1, hoverS: -1,
  tabs() { return 3; },
  open(t) {
    Game.ui = 'menu'; Menu.tab = Math.max(0, Math.min(t, Menu.tabs() - 1)); Menu.hover = -1; Inv.hover = -1; Skills.hover = null; Skills.drag = null; Snd.sfx('ui');
    ['KeyI', 'Tab', 'KeyC', 'KeyK', 'KeyF', 'KeyE'].forEach(k => Input.pressed.delete(k));
  },
  update() {
    const n = Menu.tabs(), m = Input.mouse;
    if (Input.hit('Escape', 'KeyI', 'Tab', 'KeyC', 'KeyK')) { Game.ui = null; Menu.last = Math.min(Menu.tab, 2); Snd.sfx('ui'); return; }
    const nav = Menu.tab !== 2;   // the skill tab uses WASD / arrows to pan; Q/E always switch tabs
    if (Input.hit('KeyE') || (nav && Input.hit('KeyD', 'ArrowRight'))) { Menu.tab = (Menu.tab + 1) % n; Snd.sfx('ui'); }
    if (Input.hit('KeyQ') || (nav && Input.hit('KeyA', 'ArrowLeft'))) { Menu.tab = (Menu.tab + n - 1) % n; Snd.sfx('ui'); }
    if (Input.hit('Mouse0') && m.y < 13) { const i = Math.floor((m.x - 24) / Math.floor(432 / n)); if (i >= 0 && i < n) { Menu.tab = i; Snd.sfx('ui'); } }
    if (Menu.tab >= n) Menu.tab = 0;
    [Menu.updWear, Inv.update, Skills.update][Menu.tab]();
  },
  draw(ctx) {
    if (!(Menu.tab >= 0 && Menu.tab < Menu.tabs())) Menu.tab = 0;
    [Menu.drawWear, Inv.draw, Skills.draw][Menu.tab](ctx);
    Tut.menuHint(ctx);
    const n = Menu.tabs(), tw = Math.floor(432 / n);
    for (let i = 0; i < n; i++) {                                         // tabs as small neon signs
      const x = 24 + i * tw, on = i === Menu.tab;
      if (on) { UI.box(ctx, x, 0, tw - 2, 13, PAL.uiInteract, null, { vines: false }); UI.text(ctx, Menu.TABS[i], x + tw / 2, 3, PAL.uiHead, 'bold 8px monospace', 'center'); }
      else { ctx.fillStyle = 'rgba(12,14,17,.92)'; ctx.fillRect(x, 1, tw - 2, 12); ctx.fillStyle = PAL.uiBrassDark; ctx.fillRect(x, 12.4, tw - 2, 0.6); UI.text(ctx, Menu.TABS[i], x + tw / 2, 3, PAL.uiDim, 'bold 8px monospace', 'center'); }
    }
    ctx.textAlign = 'left';
  },
  panel(ctx, title, right) { UI.panel(ctx, title, right); },
  tip(ctx, it, x, y) {   // item tooltip (+ comparison with the equipped item of the same slot)
    const R = CFG.gear.rarities[it.r], cur = Gear.eq[it.slot], lines = Gear.lines(it), cmp = cur && cur.id !== it.id, h = 24 + lines.length * 11 + (cmp ? 11 : 0);
    x = Math.max(30, Math.min(x, CFG.view.w - 214)); y = Math.max(20, Math.min(y, CFG.view.h - h - 24));
    UI.box(ctx, x - 6, y - 6, 196, h + 8, null, null, { vines: false });
    ctx.font = 'bold 8px monospace'; ctx.textBaseline = 'top'; ctx.fillStyle = R.col; ctx.fillText(it.name.toUpperCase() + '  ' + CFG.gear.names[it.slot], x, y); ctx.font = '7px monospace'; ctx.fillText(R.name, x, y + 10);
    ctx.font = '8px monospace'; ctx.fillStyle = PAL.uiText; lines.forEach((l, i) => ctx.fillText(l, x, y + 21 + i * 11));
    if (cmp) { const d = (it.stats.armor || 0) - (cur.stats.armor || 0); ctx.fillStyle = d >= 0 ? '#9fe070' : '#ff7080'; ctx.fillText('PANZER ' + (d >= 0 ? '+' : '') + d + ' ggue. angelegt', x, y + 21 + lines.length * 11); }
  },
  wearCell(i) { return { x: 284 + (i % 2) * 82, y: 132 + Math.floor(i / 2) * 15, w: 78, h: 13 }; },
  updWear() {   // KLEIDUNG: slots, figure, stats and the stash in one view
    const m = Input.mouse, fx = 214; Menu.hover = -1; Menu.hoverS = -1;
    for (let i = 0; i < 4; i++) { const r = Menu.slotRect(i); if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) Menu.hover = i; }
    for (let i = 0; i < Gear.stash.length; i++) { const c = Menu.wearCell(i); if (m.x >= c.x && m.x < c.x + c.w && m.y >= c.y && m.y < c.y + c.h) Menu.hoverS = i; }
    if (Input.hit('Mouse0') && m.y >= 194 && m.y <= 214 && (Math.abs(m.x - (fx - 46)) < 10 || Math.abs(m.x - (fx + 46)) < 10)) {   // switch resident
      const i = Paint.NAMES.indexOf(Player.look), n = Paint.NAMES.length; Player.look = Paint.NAMES[(i + (m.x < fx ? n - 1 : 1)) % n]; Snd.sfx('ui'); Save.save(); return;
    }
    if (Input.hit('Mouse0')) { if (Menu.hover >= 0 && Menu.hover < 3) Gear.unequip(CFG.gear.slots[Menu.hover]); else if (Menu.hoverS >= 0) { Gear.equip(Gear.stash[Menu.hoverS]); Menu.hoverS = -1; } }
    else if (Input.hit('Mouse2') && Menu.hoverS >= 0) { Gear.stash.splice(Menu.hoverS, 1); Snd.sfx('ui'); Save.save(); Menu.hoverS = -1; }
  },
  drawWear(ctx) {
    Menu.panel(ctx, 'KLEIDUNG', 'PANZER ' + Math.round(Skills.v('armor')) + '  (-' + Math.round(Gear.reduction() * 100) + '% SCHADEN)');
    const G = CFG.gear, W = CFG.weapon, wn = CFG.weapons[Weapons.cur].name, m = Input.mouse, fx = 214, fy = 186;
    for (let i = 0; i < 4; i++) {                                           // slots: helm, vest, boots, weapon
      const r = Menu.slotRect(i), it = i < 3 ? Gear.eq[G.slots[i]] : null, col = it ? G.rarities[it.r].col : '#3a3544';
      ctx.fillStyle = PAL.ink; ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2); ctx.fillStyle = Menu.hover === i ? '#222831' : '#15181d'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = PAL.uiBrassDark; ctx.lineWidth = 0.6; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      if (i === 3) { ctx.save(); ctx.translate(r.x + 18, r.y + 20); ctx.scale(1.6, 1.6); Renderer.weapon(ctx, 0, 6, { aim: { x: -0.28, y: -0.96 }, atk: null }); ctx.restore(); }
      else if (it) { ctx.fillStyle = col; ctx.fillRect(r.x + 9, r.y + 9, r.w - 18, r.h - 18); }
      UI.text(ctx, i < 3 ? G.names[G.slots[i]] : 'WAFFE', r.x + 42, r.y + 6, PAL.uiText, 'bold 8px monospace');
      UI.text(ctx, i < 3 ? (it ? it.name : '- leer -') : wn, r.x + 42, r.y + 18, it ? col : i === 3 ? PAL.uiInteract : PAL.uiDim, '8px monospace');
    }
    ctx.save(); ctx.translate(fx, fy); ctx.scale(2.6, 2.6); Sprites.draw(ctx, 'player_' + Player.look, 'idle', Game.time, 0, 0, { x: 0, y: 1 }, {}); ctx.restore();
    UI.text(ctx, Paint.TITLES[Player.look], fx, fy + 10, PAL.uiText, 'bold 8px monospace', 'center');
    UI.glow(ctx, '<', fx - 46, fy + 9, PAL.uiInteract, 'bold 10px monospace', 'center', 6); UI.glow(ctx, '>', fx + 46, fy + 9, PAL.uiInteract, 'bold 10px monospace', 'center', 6);
    const st = [['LEBEN', Math.round(Player.maxHp)], ['SCHADEN', '+' + Math.round(Skills.v('dmg') * 100) + '%'], ['CRIT', Math.round((W.critP + Skills.v('crit')) * 100) + '%'], ['TEMPO', '+' + Math.round(Skills.v('speed') * 100) + '%'],
      ['DASH-CD', Skills.dashCd().toFixed(2) + 's'], ['RUCKSACK', Trash.cap() + ' PLAETZE'], ['WAFFE', Math.round(W.base) + ' SCHADEN']];
    st.forEach((l, i) => { UI.text(ctx, l[0], 286, 42 + i * 11, PAL.uiDim, '8px monospace'); UI.text(ctx, String(l[1]), 444, 42 + i * 11, PAL.uiText, '8px monospace', 'right'); });
    UI.head(ctx, 'LAGER  ' + Gear.stash.length + ' / ' + G.stash, 286, 119, 'left', 7);
    for (let i = 0; i < G.stash; i++) {
      const c = Menu.wearCell(i), it = Gear.stash[i];
      ctx.fillStyle = it && Menu.hoverS === i ? '#222831' : '#121519'; ctx.fillRect(c.x, c.y, c.w, c.h);
      if (!it) continue; const R = G.rarities[it.r];
      ctx.fillStyle = R.col; ctx.fillRect(c.x, c.y, 2, c.h); UI.text(ctx, it.name, c.x + 5, c.y + 3, R.col, '7px monospace');
    }
    if (!Gear.stash.length) UI.text(ctx, 'LEER - RÜSTUNG FÄLLT VON GEGNERN', 286, 134, PAL.uiDim, '7px monospace');
    if (Menu.hoverS >= 0 && Gear.stash[Menu.hoverS]) Menu.tip(ctx, Gear.stash[Menu.hoverS], m.x - 200, m.y - 30);
    else if (Menu.hover >= 0 && Menu.hover < 3 && Gear.eq[G.slots[Menu.hover]]) Menu.tip(ctx, Gear.eq[G.slots[Menu.hover]], m.x + 14, m.y - 10);
    else if (Menu.hover === 3) UI.text(ctx, (W.special ? 'SPEZIAL: ' + W.special.name.toUpperCase() + '  ·  ' : '') + 'WECHSELN AM WAFFENREGAL IN DER KÜCHE', 36, 222, PAL.uiDim, '7px monospace');
    UI.text(ctx, 'SLOT KLICKEN = ABLEGEN  ·  LAGER: LMB ANLEGEN, RMB WEGWERFEN  ·  Q/E: TAB  ·  ESC: ZU', CFG.view.w / 2, CFG.view.h - 30, PAL.uiDim, '7px monospace', 'center');
  },
  slotRect(i) { return { x: 36, y: 40 + i * 44, w: 36, h: 36 }; },
  updChar() {
    const m = Input.mouse; Menu.hover = -1;
    for (let i = 0; i < 4; i++) { const r = Menu.slotRect(i); if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) Menu.hover = i; }
    if (Input.hit('Mouse0') && m.y >= 205 && m.y <= 224) {                   // switch resident
      const i = Paint.NAMES.indexOf(Player.look), n = Paint.NAMES.length;
      if (m.x >= 168 && m.x <= 192) Player.look = Paint.NAMES[(i + n - 1) % n]; else if (m.x >= 264 && m.x <= 290) Player.look = Paint.NAMES[(i + 1) % n]; else return;
      Snd.sfx('ui'); Save.save(); return;
    }
    if (Input.hit('Mouse0') && Menu.hover >= 0 && Menu.hover < 3) Gear.unequip(CFG.gear.slots[Menu.hover]);
  },
  drawChar(ctx) {
    Menu.panel(ctx, 'CHARAKTER', 'PANZER ' + Math.round(Skills.v('armor')) + '  (-' + Math.round(Gear.reduction() * 100) + '% SCHADEN)');
    const G = CFG.gear, W = CFG.weapon, wn = CFG.weapons[Weapons.cur].name;
    for (let i = 0; i < 4; i++) {                                         // slot boxes: helm, vest, boots, weapon
      const r = Menu.slotRect(i), it = i < 3 ? Gear.eq[G.slots[i]] : null, col = it ? G.rarities[it.r].col : '#3a3544';
      ctx.fillStyle = '#000'; ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2); ctx.fillStyle = Menu.hover === i ? '#2c2738' : '#1f1b28'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = col; if (it || i === 3) ctx.fillRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
      ctx.fillStyle = '#e8dcc8'; ctx.fillText(i < 3 ? G.names[G.slots[i]] : 'WAFFE', r.x + 42, r.y + 6);
      ctx.fillStyle = it ? col : '#5a5560'; ctx.fillText(i < 3 ? (it ? it.name : '- leer -') : wn, r.x + 42, r.y + 18);
    }
    const fx = 228, fy = 200;                                              // painted resident + selector
    ctx.save(); ctx.translate(fx, fy); ctx.scale(3, 3); Sprites.draw(ctx, 'player_' + Player.look, 'idle', Game.time, 0, 0, { x: 0, y: 1 }, {}); ctx.restore();
    ctx.fillStyle = '#e8dcc8'; ctx.textAlign = 'center'; ctx.fillText(Paint.TITLES[Player.look], fx, fy + 14);
    ctx.fillStyle = PAL.neonCyan; ctx.fillText('<', fx - 52, fy + 14); ctx.fillText('>', fx + 52, fy + 14); ctx.textAlign = 'left';
    const st = [['LEBEN', Math.round(Player.maxHp)], ['SCHADEN', '+' + Math.round(Skills.v('dmg') * 100) + '%'], ['CRIT', Math.round((W.critP + Skills.v('crit')) * 100) + '%'], ['TEMPO', '+' + Math.round(Skills.v('speed') * 100) + '%'],
      ['DASH-CD', Skills.dashCd().toFixed(2) + 's'], ['RUCKSACK', Trash.cap() + ' PLAETZE'], ['WAFFE', wn.toUpperCase() + ' ' + Math.round(W.base) + ' DMG']];
    st.forEach((l, i) => { ctx.fillStyle = '#8f8a98'; ctx.fillText(l[0], 290, 40 + i * 13); ctx.fillStyle = '#e8dcc8'; ctx.fillText(String(l[1]), 350, 40 + i * 13); });
    if (Menu.hover >= 0 && Menu.hover < 3 && Gear.eq[G.slots[Menu.hover]]) { Menu.tip(ctx, Gear.eq[G.slots[Menu.hover]], 270, 150); ctx.fillStyle = '#8f8a98'; ctx.fillText('KLICK = ABLEGEN', 270, 212); }
    else if (Menu.hover === 3) { ctx.fillStyle = '#e8dcc8'; ctx.fillText(wn.toUpperCase() + '  |  SPECIAL: ' + (W.special ? W.special.name.toUpperCase() : '-'), 270, 150); ctx.fillStyle = '#8f8a98'; ctx.fillText('WECHSELN AM WAFFENREGAL', 270, 162); }
    else { ctx.fillStyle = '#8f8a98'; ctx.fillText('SLOT ANKLICKEN = ABLEGEN', 270, 150); ctx.fillText('ANLEGEN IM TAB AUSRUESTUNG', 270, 162); }
    ctx.fillStyle = '#8f8a98'; ctx.textAlign = 'center'; ctx.fillText('Q/E: TAB WECHSELN  |  I / TAB / ESC: SCHLIESSEN', CFG.view.w / 2, CFG.view.h - 30); ctx.textAlign = 'left';
  },
  cell(i) { return { x: i % 2 ? 242 : 36, y: 40 + Math.floor(i / 2) * 22, w: 200, h: 20 }; },
  updGear() {
    const m = Input.mouse; Menu.hover = -1;
    Gear.stash.forEach((it, i) => { const c = Menu.cell(i); if (m.x >= c.x && m.x < c.x + c.w && m.y >= c.y && m.y < c.y + c.h) Menu.hover = i; });
    if (Menu.hover >= 0 && Input.hit('Mouse0')) { Gear.equip(Gear.stash[Menu.hover]); Menu.hover = -1; }
    else if (Menu.hover >= 0 && Input.hit('Mouse2')) { Gear.stash.splice(Menu.hover, 1); Snd.sfx('ui'); Save.save(); Menu.hover = -1; }
  },
  drawGear(ctx) {
    Menu.panel(ctx, 'AUSRUESTUNG', Gear.stash.length + ' / ' + CFG.gear.stash + ' LAGER');
    for (let i = 0; i < CFG.gear.stash; i++) {
      const c = Menu.cell(i), it = Gear.stash[i]; ctx.fillStyle = it && Menu.hover === i ? '#2c2738' : '#1f1b28'; ctx.fillRect(c.x, c.y, c.w, c.h);
      if (!it) continue; const R = CFG.gear.rarities[it.r];
      ctx.fillStyle = R.col; ctx.fillRect(c.x, c.y, 3, c.h); ctx.fillText(it.name, c.x + 8, c.y + 6);
      ctx.fillStyle = '#8f8a98'; ctx.textAlign = 'right'; ctx.fillText(CFG.gear.names[it.slot] + '  ARM ' + (it.stats.armor || 0), c.x + c.w - 4, c.y + 6); ctx.textAlign = 'left';
    }
    if (Menu.hover >= 0 && Gear.stash[Menu.hover]) Menu.tip(ctx, Gear.stash[Menu.hover], 36, 176);
    else { ctx.fillStyle = '#8f8a98'; ctx.fillText(Gear.stash.length ? 'ITEM ZEIGEN FUER DETAILS' : 'LAGER LEER - RUESTUNG DROPPT VON GEGNERN, BOSSEN UND GIBT ES IN DER GARDEROBE', 36, 176); }
    ctx.fillStyle = '#8f8a98'; ctx.textAlign = 'center'; ctx.fillText('LMB: ANLEGEN  |  RMB: WEGWERFEN', CFG.view.w / 2, CFG.view.h - 30); ctx.textAlign = 'left';
  },
  shopRect(i) { return { x: 36, y: 40 + i * 26, w: 408, h: 22 }; },
  updShop() {
    const m = Input.mouse; Menu.hover = -1;
    CFG.gear.shop.forEach((s, i) => { const r = Menu.shopRect(i); if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) Menu.hover = i; });
    if (Menu.hover >= 0 && Input.hit('Mouse0')) {
      const s = CFG.gear.shop[Menu.hover];
      if (Gear.stash.length >= CFG.gear.stash) Combat.text(Player.x, Player.y - 0.5, 'LAGER VOLL', '#ff7080', false);
      else if (Trash.bank >= s.cost) { Trash.bank -= s.cost; const it = Gear.make(s.slot, s.base, 0); Gear.stash.push(it); if (!Gear.eq[s.slot]) Gear.equip(it); Snd.sfx('buy'); Save.save(); }
    }
  },
  drawShop(ctx) {
    Menu.panel(ctx, 'GARDEROBE (GRUNDAUSSTATTUNG)', 'MUELL ' + Trash.bank);
    CFG.gear.shop.forEach((s, i) => {
      const r = Menu.shopRect(i), b = CFG.gear.bases[s.slot][s.base], can = Trash.bank >= s.cost && Gear.stash.length < CFG.gear.stash;
      ctx.fillStyle = Menu.hover === i ? '#2c2738' : '#1f1b28'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#e8dcc8'; ctx.fillText(b.name, r.x + 6, r.y + 7); ctx.fillStyle = '#8f8a98'; ctx.fillText(CFG.gear.names[s.slot], r.x + 130, r.y + 7);
      ctx.fillText(Gear.lines({ stats: Object.fromEntries(Object.entries(b).filter(([k]) => k !== 'name')) }).join('  '), r.x + 190, r.y + 7);
      ctx.textAlign = 'right'; ctx.fillStyle = can ? '#ffd34a' : '#7a4a4a'; ctx.fillText(String(s.cost), r.x + r.w - 6, r.y + 7); ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#8f8a98'; ctx.textAlign = 'center'; ctx.fillText('LEERE SLOTS WERDEN SOFORT ANGEZOGEN  ·  ANDERES IM MENÜ (I) UNTER KLEIDUNG  ·  ESC: ZU', CFG.view.w / 2, CFG.view.h - 30); ctx.textAlign = 'left';
  }
};
