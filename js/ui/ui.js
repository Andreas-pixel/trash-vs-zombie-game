// Trash Vs. Nazi-Zombies - HUD, Titel, Pause, Tod, Rahmen
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ UI (neon-sign HUD, title, pause, death; colors from PAL roles) ============ */
const UI = {
  logo: null, logoGlow: null, shakeFull: true, sel: 0, hover: -1, confirm: false,
  FONT: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",   // [Vorschlag] system serif, nothing to download; change here
  init() {   // background removal for the logo (near-black JPEG background -> alpha); the artwork itself is unchanged
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const m = Math.max(p[i], p[i + 1], p[i + 2]), a = Math.max(0, Math.min(1, (m - 28) / 140));
        if (a <= 0) { p[i + 3] = 0; continue; }
        p[i + 3] = Math.round(a * 255);
      }
      g.putImageData(d, 0, 0); UI.logo = c;
    };
    img.src = LOGO_SRC;
  },
  text(ctx, s, x, y, col, font, align) { ctx.font = font || '8px monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.textAlign = 'left'; },
  glow(ctx, s, x, y, col, font, align, blur) {   // lit text: ink drop shadow + soft colored halo (no white core)
    ctx.font = font || 'bold 8px monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillText(s, x + 0.5, y + 0.7);
    ctx.shadowColor = col; ctx.shadowBlur = Math.min(6, (blur || 10) * 0.45); ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  },
  head(ctx, s, x, y, align, size) {   // engraved heading: bone-white text, brass underline with a small diamond
    const sz = size || 9; ctx.font = 'bold ' + sz + 'px monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillText(s, x + 0.6, y + 0.8); ctx.fillStyle = PAL.uiHead; ctx.fillText(s, x, y);
    const w = ctx.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, yy = y + sz + 2.5;
    ctx.fillStyle = PAL.uiBrass; ctx.fillRect(x0, yy, w, 0.6); ctx.save(); ctx.translate(x0 + w / 2, yy + 0.3); ctx.rotate(Math.PI / 4); ctx.fillRect(-1.3, -1.3, 2.6, 2.6); ctx.restore();
    ctx.textAlign = 'left';
  },
  box(ctx, x, y, w, h, col, fill, o) {   // weathered panel: chipped slab, tarnished brass frame, half-dead neon tube, overgrowth
    w = Math.round(w); h = Math.round(h); o = o || {};
    const vines = o.vines !== undefined ? o.vines : (w >= 80 && h >= 24), c = Decay.panel(w, h, vines), M = Decay.M;
    ctx.drawImage(c, x - M, y - M, w + M * 2, h + M * 2);
    if (col && o.tube !== false) {                                         // only part of the tube still works, and it stutters now and then
      const sd = Decay.hash(w, h, 3), s0 = 0.08 + (sd % 40) / 100, len = 0.28 + (sd % 17) / 100, t = Game.time, dead = Math.sin(t * 11 + sd) > 0.985;
      const xa = x + w * s0, xb = x + w * Math.min(0.94, s0 + len), yy = y + 0.7;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = '#2b3036'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xa - 4, yy); ctx.lineTo(xb + 4, yy); ctx.stroke();
      ctx.globalAlpha = dead ? 0.2 : 0.8 + 0.2 * Math.sin(t * 3 + sd);
      ctx.shadowColor = col; ctx.shadowBlur = 7; ctx.strokeStyle = col; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xb, yy); ctx.stroke();
      ctx.restore();
    }
  },
  bar(ctx, x, y, w, h, f, col, back, glow) {
    ctx.fillStyle = PAL.ink; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
    if (glow) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
    ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, f)), h); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, f)), Math.max(1, h * 0.3));
    ctx.strokeStyle = PAL.uiBrassDark; ctx.lineWidth = 0.6; ctx.strokeRect(x - 1.6, y - 1.6, w + 3.2, h + 3.2);   // brass rim
  },
  icon(ctx, kind, x, y, r, col) {   // shape cues so information never depends on color alone
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8; ctx.beginPath();
    if (kind === 'heart') { ctx.moveTo(0, r * 0.9); ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.4); ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9); }
    else if (kind === 'shield') { ctx.moveTo(0, -r); ctx.lineTo(r * 0.9, -r * 0.6); ctx.lineTo(r * 0.75, r * 0.3); ctx.lineTo(0, r); ctx.lineTo(-r * 0.75, r * 0.3); ctx.lineTo(-r * 0.9, -r * 0.6); ctx.closePath(); }
    else if (kind === 'bag') { ctx.moveTo(-r * 0.8, -r * 0.2); ctx.quadraticCurveTo(-r, r, 0, r); ctx.quadraticCurveTo(r, r, r * 0.8, -r * 0.2); ctx.lineTo(r * 0.35, -r * 0.55); ctx.lineTo(r * 0.5, -r); ctx.lineTo(-r * 0.5, -r); ctx.lineTo(-r * 0.35, -r * 0.55); ctx.closePath(); }
    else if (kind === 'dash') { for (const o of [-r * 0.6, r * 0.2]) { ctx.moveTo(o, -r * 0.7); ctx.lineTo(o + r * 0.6, 0); ctx.lineTo(o, r * 0.7); ctx.lineTo(o + r * 0.25, r * 0.7); ctx.lineTo(o + r * 0.85, 0); ctx.lineTo(o + r * 0.25, -r * 0.7); ctx.closePath(); } }
    else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
    ctx.fill(); ctx.stroke(); ctx.restore();
  },
  dial(ctx, x, y, r, f, kind, key, col) {   // round cooldown gauge
    const ready = f >= 1;
    ctx.fillStyle = 'rgba(9,13,21,.85)'; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, 6.3); ctx.fill();
    ctx.strokeStyle = PAL.uiBrassDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.stroke();
    if (ready) { ctx.shadowColor = col; ctx.shadowBlur = 10; }
    ctx.strokeStyle = ready ? col : PAL.uiDim; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 6.2832 * Math.max(0, Math.min(1, f))); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
    UI.icon(ctx, kind, x, y, r * 0.55, ready ? col : PAL.uiDim);
    UI.text(ctx, key, x, y + r + 3, ready ? PAL.uiText : PAL.uiDim, '7px monospace', 'center');
  },
  portrait(ctx, x, y, r) {   // resident head in a neon ring (player = cyan)
    ctx.fillStyle = PAL.uiPanel; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 0.5, 0, 6.3); ctx.clip(); ctx.translate(x, y + 21.8 * 1.5); ctx.scale(1.5, 1.5);
    Sprites.draw(ctx, 'player_' + Player.look, 'idle', Game.time, 0, 0, { x: 0, y: 1 }, { flash: Player.flashT > 0 }); ctx.restore();
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, 6.3); ctx.stroke();                 // brass ring with a short neon arc
    ctx.strokeStyle = PAL.uiBrass; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, 6.3); ctx.stroke();
    ctx.shadowColor = PAL.uiPlayer; ctx.shadowBlur = 6; ctx.strokeStyle = PAL.uiPlayer; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x, y, r + 0.5, 2.3, 4.0); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
  },
  hud(ctx) {
    const W = CFG.view.w, H = CFG.view.h, run = Game.mode === 'run';
    // player panel, top left: portrait, HP (heart), armor (shield), XP
    UI.portrait(ctx, 20, 20, 12);
    const hx = 46, hp = Math.max(0, Player.hp), lowHp = hp / Player.maxHp < 0.3;
    UI.icon(ctx, 'heart', hx - 6, 11.5, 4, PAL.uiHp);
    UI.bar(ctx, hx, 8, 92, 7, hp / Player.maxHp, lowHp && Math.floor(Game.time * 4) % 2 ? '#ff9ab8' : PAL.uiHp, '#2a1220', true);
    UI.text(ctx, Math.ceil(hp) + '/' + Math.round(Player.maxHp), hx + 96, 8.5, PAL.uiText, 'bold 7px monospace');
    const arm = Math.round(Skills.v('armor'));
    UI.icon(ctx, 'shield', hx - 6, 22, 3.8, arm > 0 ? PAL.uiArmor : '#4a4a3a');
    UI.text(ctx, arm > 0 ? 'PANZER ' + arm + '  -' + Math.round(Gear.reduction() * 100) + '%' : 'PANZER 0', hx, 18.5, arm > 0 ? PAL.uiArmor : PAL.uiDim, '7px monospace');
    if (run) {
      UI.bar(ctx, hx, 29, 92, 2, Skills.xp / Skills.need(), PAL.uiPlayer, '#0e2a33', false);
      UI.text(ctx, 'LV ' + Skills.level, hx, 33, PAL.uiPlayer, '7px monospace');
      if (Skills.sp > 0) UI.glow(ctx, 'SP ' + Skills.sp + '  [K]', hx + 92, 33, PAL.uiPlayer, 'bold 7px monospace', 'right', 8);
    }
    // room sign, top right (world = purple)
    const title = Game.mode === 'tut' ? 'TUTORIAL  ·  BAD' : run ? 'RAUM ' + Run.room + '  ·  ' + Run.biomeName() + (Run.boss ? '  ·  BOSS' : '') : Game.mode === 'roof' ? 'DACH  ·  SIEGESFEIER' : 'WG-KUECHE';
    ctx.font = 'bold 8px monospace'; const tw = Math.max(110, ctx.measureText(title).width + 16);
    UI.box(ctx, W - tw - 8, 6, tw, run ? 35 : 26, PAL.uiWorld);
    UI.glow(ctx, title, W - 8 - tw / 2, 9, PAL.uiWorld, 'bold 8px monospace', 'center', 10);
    if (run) {
      const st = Run.locked ? 'AUSGANG GESPERRT' : 'AUSGANG OFFEN', cont = Room.containers.length ? 'CONTAINER HIER' : 'CONTAINER: RAUM ' + Run.nextContainer();
      UI.text(ctx, st, W - 8 - tw / 2, 20, Run.locked ? PAL.uiDim : PAL.uiInteract, '7px monospace', 'center');
      UI.text(ctx, cont, W - 8 - tw / 2, 29, Room.containers.length ? PAL.uiLoot : PAL.uiDim, '7px monospace', 'center');
    } else if (Game.mode === 'tut') UI.text(ctx, 'SCHRITT ' + Math.max(1, Tut.step) + ' / 6', W - 8 - tw / 2, 20, PAL.uiDim, '7px monospace', 'center');
    else UI.text(ctx, 'RUNS ' + Save.stats.runs + '  ·  REKORD RAUM ' + Save.stats.bestRoom, W - 8 - tw / 2, 20, PAL.uiDim, '7px monospace', 'center');
    if (!run && Run.last) UI.text(ctx, Run.last, W - 8, 36, PAL.uiDim, '7px monospace', 'right');
    // abilities, bottom left (player = cyan)
    const sp = CFG.weapon.special;
    UI.text(ctx, CFG.weapons[Weapons.cur].name.toUpperCase(), 10, H - 44, PAL.uiText, 'bold 7px monospace');
    UI.dial(ctx, 22, H - 24, 9, 1 - Player.dash.cd / Skills.dashCd(), 'dash', 'SPACE', PAL.uiPlayer);
    UI.dial(ctx, 52, H - 24, 9, sp ? 1 - Player.specCd / sp.cd : 0, 'star', 'RMB', PAL.uiPlayer);
    // trash, bottom right (loot = green): backpack slots, secured, bank
    const cap = Trash.cap(), sw = 9, sx = W - 10 - cap * (sw + 2), sy = H - 34;
    UI.icon(ctx, 'bag', sx - 9, sy + 4.5, 4.5, PAL.uiLoot);
    for (let i = 0; i < cap; i++) { ctx.fillStyle = PAL.ink; ctx.fillRect(sx + i * (sw + 2) - 1, sy - 1, sw + 2, sw + 2); ctx.fillStyle = '#10241c'; ctx.fillRect(sx + i * (sw + 2), sy, sw, sw); }
    ctx.shadowColor = PAL.uiLoot; ctx.shadowBlur = 6;
    for (const it of Inv.layout()) { ctx.fillStyle = PAL.uiLoot; ctx.fillRect(sx + it.slot * (sw + 2) + 1, sy + 1, it.w * (sw + 2) - 4, sw - 2); if (it.w > 1) { ctx.fillStyle = PAL.ink; ctx.fillRect(sx + it.slot * (sw + 2) + sw / 2 + 4, sy + 2, 1, sw - 4); } }
    ctx.shadowBlur = 0;
    const tm = Trash.weight() ? '-' + Math.round((1 - Trash.speedMul()) * 100) + '% TEMPO  ' : '';
    UI.text(ctx, tm + '[I]', W - 10, sy - 10, PAL.uiDim, '7px monospace', 'right');
    UI.glow(ctx, 'GESICHERT ' + Trash.secured + '   BANK ' + Trash.bank, W - 10, sy + 14, PAL.uiLoot, 'bold 7px monospace', 'right', 6);
    Boss.drawHud(ctx);
    if (run && Run.card && Game.time - Run.card.t0 < 3.6) {                  // new biome card
      const k = Game.time - Run.card.t0, a = Math.min(1, k * 3, (3.6 - k) * 2); ctx.globalAlpha = Math.max(0, a);
      UI.box(ctx, W / 2 - 130, 74, 260, 44, PAL.uiWorld); UI.head(ctx, Run.card.a, W / 2, 80, 'center', 11); UI.text(ctx, Run.card.b, W / 2, 101, PAL.uiDim, '8px monospace', 'center');
      ctx.globalAlpha = 1;
    }
  },
  panel(ctx, title, right, rcol) {   // neon menu panel used by every menu tab
    const W = CFG.view.w, H = CFG.view.h;
    ctx.fillStyle = 'rgba(4,6,11,.86)'; ctx.fillRect(0, 0, W, H);
    const gr = ctx.createLinearGradient(0, 14, 0, H - 14); gr.addColorStop(0, PAL.uiPanel2); gr.addColorStop(1, PAL.uiPanel);
    UI.box(ctx, 24, 14, W - 48, H - 28, PAL.uiInteract, gr);
    UI.head(ctx, title, 36, 20, 'left', 9);
    const r = right || '', col = rcol || (/^MUELL/.test(r) ? PAL.uiLoot : PAL.uiText);
    UI.glow(ctx, r, W - 36, 22, col, 'bold 8px monospace', 'right', 6);
    ctx.fillStyle = 'rgba(122,101,68,.35)'; ctx.fillRect(36, 34, W - 72, 0.5);
    ctx.font = '8px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  },
  drawLogo(ctx, cx, cy, w) {
    if (!UI.logo) return;
    const h = w * UI.logo.height / UI.logo.width, fl = 0.9 + 0.1 * Math.sin(Game.time * 9) * Math.sin(Game.time * 2.3);   // subtle neon flicker
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 * fl; ctx.filter = 'blur(6px)'; ctx.drawImage(UI.logo, cx - w / 2, cy - h / 2, w, h); ctx.filter = 'none';
    ctx.globalAlpha = fl; ctx.drawImage(UI.logo, cx - w / 2, cy - h / 2, w, h); ctx.restore();
  },
  PAUSE() {
    const L = [['resume', 'WEITER'], ['snd', 'TON: ' + (Snd.muted ? 'AUS' : 'AN')], ['shake', 'KAMERA-WACKELN: ' + (UI.shakeFull ? 'VOLL' : 'REDUZIERT')]];
    if (UI.confirm) return [['no', 'NEIN, ZURÜCK'], ['yes', 'JA, SPIELSTAND LÖSCHEN']];
    if (Game.mode === 'run') L.push(['abandon', 'RUN ABBRECHEN']); else if (Game.mode === 'roof') {} else if (Game.mode === 'tut' || Tut.hub) L.push(['skip', 'TUTORIAL ÜBERSPRINGEN']); else L.push(['tut', 'TUTORIAL STARTEN']);
    if (Game.mode === 'hub') L.push(['title', 'TITELBILDSCHIRM'], ['reset', 'SPIELSTAND LÖSCHEN']);
    return L;
  },
  CONTROLS: [['WASD', 'BEWEGEN'], ['MAUS', 'ZIELEN'], ['LMB', 'ANGRIFF'], ['RMB', 'SPEZIAL'], ['SPACE', 'DASH'], ['F / E', 'BENUTZEN'], ['I / TAB', 'INVENTAR'], ['K', 'SKILLTREE'], ['C', 'KLEIDUNG'], ['M', 'TON'], ['ESC', 'PAUSE'], ['F3', 'DEBUG']],
  rowRect(i) { return { x: 56, y: 100 + i * 22, w: 170, h: 18 }; },
  update() {
    if (Game.ui === 'menu') { Menu.update(); return; }
    const m = Input.mouse;
    if (Game.ui === 'dialog') { Dialog.update(); return; }
    if (Game.ui === 'select') { Select.update(); return; }
    if (Game.ui === 'shop') { Shop.update(); return; }
    if (Game.ui === 'rack') { Rack.update(); return; }
    if (Game.ui === 'title') { if (Input.hit('Space', 'Enter', 'Mouse0')) { Game.ui = null; Snd.sfx('door'); Story.afterTitle(); } return; }
    if (Game.ui === 'pause') {
      const items = UI.PAUSE(); UI.hover = -1; UI.sel = Math.min(UI.sel, items.length - 1);
      items.forEach((_, i) => { const r = UI.rowRect(i); if (m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h) UI.hover = i; });
      if (UI.hover >= 0) UI.sel = UI.hover;
      if (Input.hit('KeyW', 'ArrowUp')) { UI.sel = (UI.sel + items.length - 1) % items.length; Snd.sfx('ui'); }
      if (Input.hit('KeyS', 'ArrowDown')) { UI.sel = (UI.sel + 1) % items.length; Snd.sfx('ui'); }
      if (Input.hit('Escape')) { if (UI.confirm) { UI.confirm = false; UI.sel = 0; } else Game.ui = null; Snd.sfx('ui'); return; }
      if (Input.hit('Enter', 'Space') || (Input.hit('Mouse0') && UI.hover >= 0)) {
        const id = items[UI.sel][0]; Snd.sfx('ui');
        if (id === 'resume') Game.ui = null;
        else if (id === 'snd') Snd.toggle();
        else if (id === 'shake') { UI.shakeFull = !UI.shakeFull; Save.save(); if (UI.shakeFull) Camera.shake(3); }
        else if (id === 'abandon') { Game.ui = null; Trash.onDeath(); Run.trans = { phase: 'out', t: 0, to: 'hub' }; }
        else if (id === 'skip') { Game.ui = null; Save.flags.tut = true; Save.flags.tutBath = true; Save.save(); if (Game.mode === 'tut') Run.trans = { phase: 'out', t: 0, to: 'hub' }; else { Tut.hub = 0; Tut.target = null; Tut.busy = false; } }
        else if (id === 'reset') { UI.confirm = true; UI.sel = 0; }
        else if (id === 'no') { UI.confirm = false; UI.sel = 0; }
        else if (id === 'yes') { UI.confirm = false; UI.sel = 0; Save.reset(); Game.ui = 'title'; Combat.texts = []; }
        else if (id === 'tut') { Game.ui = null; Tut.start(); }
        else Game.ui = 'title';
      }
    }
  },
  overlays(ctx) {
    const W = CFG.view.w, H = CFG.view.h;
    if (Game.ui === 'select') Select.draw(ctx);
    if (Game.ui === 'shop') Shop.draw(ctx);
    if (Game.ui === 'rack') Rack.draw(ctx);
    if (Game.ui === 'dialog') Dialog.draw(ctx);
    if (Game.mode === 'tut' && Tut.step > 0 && !Game.ui) Tut.banner(ctx);
    if (Game.mode === 'hub' && Tut.hub && !Game.ui) Tut.banner(ctx, Tut.HOBJ[Tut.hub]);
    if (Player.dead && Game.mode === 'run' && !Game.ui) {                   // death screen
      const k = Math.min(1, Run.deadT / 0.6);
      ctx.fillStyle = 'rgba(20,4,12,' + (0.55 * k) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = k; UI.glow(ctx, 'GESTORBEN', W / 2, H / 2 - 26, PAL.uiHp, 'bold 16px monospace', 'center', 16);
      UI.text(ctx, 'RAUM ' + Run.room + '   ·   MUELL VERLOREN: ' + (Trash.lost || 0) + '   ·   GESICHERT: ' + Trash.secured, W / 2, H / 2 + 0, PAL.uiText, '8px monospace', 'center');
      UI.text(ctx, Run.boss ? 'ZU STARK? KAUF DIR AM KÜHLSCHRANK FÄHIGKEITEN UND HOL DIR BESSERE KLEIDUNG.' : 'ZURUECK IN DIE KUECHE ...', W / 2, H / 2 + 14, Run.boss ? PAL.uiInteract : PAL.uiDim, '7px monospace', 'center'); ctx.globalAlpha = 1;
    }
    if (Game.ui === 'title') {
      const gr = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 300); gr.addColorStop(0, 'rgba(6,8,14,.72)'); gr.addColorStop(1, 'rgba(3,4,8,.96)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(Decay.screen(), 0, 0, W, H);   // overgrown frame around the title
      UI.drawLogo(ctx, W / 2, H / 2 - 22, 210);
      if (Math.floor(Game.time * 2) % 2 === 0 || true) { ctx.globalAlpha = 0.65 + 0.35 * Math.sin(performance.now() / 300); UI.glow(ctx, '[ SPACE ]  SPIELEN', W / 2, H - 52, PAL.uiInteract, 'bold 9px monospace', 'center', 12); ctx.globalAlpha = 1; }
      UI.text(ctx, 'ESC IM SPIEL: PAUSE  ·  M: TON', W / 2, H - 30, PAL.uiDim, '7px monospace', 'center');
    }
    if (Game.ui === 'pause') {
      ctx.fillStyle = 'rgba(4,6,11,.8)'; ctx.fillRect(0, 0, W, H);
      if (!UI.confirm) UI.drawLogo(ctx, W / 2, 50, 96);
      const nItems = UI.PAUSE().length, bh = 14 + nItems * 22; UI.box(ctx, 40, 92, 200, bh, UI.confirm ? PAL.uiHp : PAL.uiInteract, 'rgba(10,14,22,.9)'); UI.box(ctx, 252, 92, 188, 156, PAL.uiWorld, 'rgba(10,14,22,.9)');
      UI.head(ctx, UI.confirm ? 'SPIELSTAND LÖSCHEN?' : 'PAUSE', 56, 72, 'left', 11);
      if (UI.confirm) { UI.text(ctx, 'Müll, Skills, Ausrüstung, Waffen und Story-Fortschritt', 140, 92 + bh + 6, PAL.uiHp, '7px monospace', 'center'); UI.text(ctx, 'werden gelöscht. Ton und Kamera bleiben.', 140, 92 + bh + 16, PAL.uiHp, '7px monospace', 'center'); }
      UI.PAUSE().forEach((t, i) => {
        const r = UI.rowRect(i), on = i === UI.sel;
        if (on) { ctx.fillStyle = 'rgba(35,227,219,.12)'; ctx.fillRect(r.x - 8, r.y, r.w, r.h); UI.glow(ctx, '> ' + t[1], r.x, r.y + 5, PAL.uiInteract, 'bold 8px monospace', 'left', 8); }
        else UI.text(ctx, '  ' + t[1], r.x, r.y + 5, PAL.uiText, '8px monospace');
      });
      UI.head(ctx, 'STEUERUNG', 264, 99, 'left', 8);
      UI.CONTROLS.forEach(([k, v], i) => { UI.text(ctx, k, 264, 114 + i * 11, PAL.uiText, 'bold 7px monospace'); UI.text(ctx, v, 330, 114 + i * 11, PAL.uiDim, '7px monospace'); });
      if (!UI.confirm) UI.text(ctx, 'W/S + ENTER ODER MAUS  ·  ESC: WEITER', 140, Math.min(92 + bh + 6, H - 12), PAL.uiDim, '7px monospace', 'center');
    }
  }
};
