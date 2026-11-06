// Trash Vs. Nazi-Zombies - Dialoge mit Portrait
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ DIALOG (Hades-like: big bust, name plate, typewriter text box) ============ */
const Dialog = {
  lines: [], i: 0, t0: 0, onEnd: null, wrapCache: new Map(), lastN: 0,
  who(w) { if (w === 'player') return Player.look; if (w === 'a' || w === 'b') { const o = Paint.NAMES.filter(n => n !== Player.look); return o[w === 'a' ? 0 : 1]; } return w; },
  start(lines, onEnd) { Dialog.lines = lines.map(([w, t]) => ({ w: Dialog.who(w), t })); Dialog.i = 0; Dialog.t0 = performance.now(); Dialog.onEnd = onEnd || null; Dialog.lastN = 0; Game.ui = 'dialog'; },
  shown() { return Math.floor((performance.now() - Dialog.t0) / 1000 * 55); },
  end() { Game.ui = null; const f = Dialog.onEnd; Dialog.onEnd = null; Dialog.lines = []; if (f) f(); },
  update() {
    if (Input.hit('Escape')) { Dialog.end(); return; }                  // skip the whole conversation
    if (Input.hit('Space', 'Enter', 'Mouse0', 'KeyF', 'KeyE')) {
      const L = Dialog.lines[Dialog.i]; if (!L) { Dialog.end(); return; }
      if (Dialog.shown() < L.t.length) { Dialog.t0 = -1e9; return; }    // first press completes the line
      Dialog.i++; Dialog.t0 = performance.now(); Dialog.lastN = 0; Snd.sfx('ui');
      if (Dialog.i >= Dialog.lines.length) Dialog.end();
    }
  },
  wrap(ctx, text, w) {
    const k = text + '|' + w; let r = Dialog.wrapCache.get(k); if (r) return r;
    r = []; let line = '';
    for (const word of text.split(' ')) { const t = line ? line + ' ' + word : word; if (ctx.measureText(t).width > w && line) { r.push(line); line = word; } else line = t; }
    if (line) r.push(line); Dialog.wrapCache.set(k, r); return r;
  },
  portrait(ctx, who, x, mirror) {
    const H = CFG.view.h, pn = 'portrait_' + who;
    if (Sprites.ok[pn] && Sprites.imgs[pn]) { Sprites.draw(ctx, pn, 'idle', 0, x, H - 6, null, {}); return; }   // dropped portrait PNG
    const spr = who === 'zombie' ? 'walker' : who === 'boss' ? 'boss_final' : 'player_' + who; if (!Sprites.ok[spr]) return;
    const sc = who === 'boss' ? 2.4 : 4; ctx.save(); ctx.translate(x, H + 36); ctx.scale(mirror ? -sc : sc, sc);                                       // placeholder: the painted figure as a big bust
    Sprites.draw(ctx, spr, 'idle', Game.time, 0, 0, { x: 0.45, y: 1 }, {}); ctx.restore();
  },
  draw(ctx) {
    const W = CFG.view.w, H = CFG.view.h, L = Dialog.lines[Dialog.i]; if (!L) return;
    const narr = L.w === 'narrator', left = L.w === Player.look && Story.phase !== 'intro', zom = L.w === 'zombie' || L.w === 'boss', col = zom ? PAL.uiEnemy : narr ? PAL.uiDim : PAL.uiPlayer;
    const gr = ctx.createLinearGradient(0, H - 130, 0, H); gr.addColorStop(0, 'rgba(4,6,11,0)'); gr.addColorStop(1, 'rgba(4,6,11,.85)'); ctx.fillStyle = gr; ctx.fillRect(0, H - 130, W, 130);
    const bx = 16, by = H - 66, bw = W - 32, bh = 56;
    UI.box(ctx, bx, by, bw, bh, col, 'rgba(8,11,18,.94)');
    if (!narr) Dialog.portrait(ctx, L.w, left ? 70 : W - 70, !left);
    ctx.font = narr ? 'italic 10px monospace' : '10px monospace';
    const tx = narr ? bx + 24 : left ? 132 : bx + 16, tw = narr ? bw - 48 : bw - 132 - 16 + (left ? 0 : 0), lines = Dialog.wrap(ctx, L.t, narr ? bw - 48 : W - 132 - 32);
    if (!narr) {                                                         // name plate on the speaker's side
      const name = STORY.names[L.w] || L.w.toUpperCase(); ctx.font = 'bold 8px monospace'; const nw = ctx.measureText(name).width + 18, nx = left ? 126 : W - 126 - nw;
      UI.box(ctx, nx, by - 12, nw, 13, col, null, { vines: false }); UI.glow(ctx, name, nx + nw / 2, by - 9, col, 'bold 8px monospace', 'center', 8);
    }
    let n = Dialog.shown(); const total = lines.join(' ').length; if (n > Dialog.lastN && n < total && n % 3 === 0) Snd.sfx('type'); Dialog.lastN = n;
    ctx.font = narr ? 'italic 10px monospace' : '10px monospace'; ctx.textBaseline = 'top'; ctx.fillStyle = narr ? '#d4c8ae' : PAL.uiText;
    lines.forEach((ln, i) => { if (n <= 0) return; const part = ln.slice(0, n); n -= ln.length + 1; ctx.textAlign = narr ? 'center' : 'left'; ctx.fillText(part, narr ? W / 2 : tx, by + 9 + i * 13); });
    ctx.textAlign = 'left';
    if (Dialog.shown() >= L.t.length && Math.floor(performance.now() / 400) % 2) UI.text(ctx, '▼', left || narr ? bx + bw - 14 : 132 + W - 132 - 46, by + bh - 12, col, 'bold 8px monospace');
    UI.text(ctx, 'SPACE: WEITER  ·  ESC: ÜBERSPRINGEN', left ? 132 : bx + 14, by + bh - 11, PAL.uiDim, '6px monospace');
  }
};
