// Trash Vs. Nazi-Zombies - Figurenwahl
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ SELECT (character choice: three residents side by side) ============ */
const Select = {
  i: 0, onEnd: null, lm: { x: -1, y: -1 }, XS: [130, 240, 350],
  open(onEnd) { Select.i = Math.max(0, Paint.NAMES.indexOf(Player.look)); Select.onEnd = onEnd || null; Game.ui = 'select'; },
  update() {
    const m = Input.mouse, n = Paint.NAMES.length;
    if (Input.hit('KeyA', 'ArrowLeft')) { Select.i = (Select.i + n - 1) % n; Snd.sfx('ui'); }
    if (Input.hit('KeyD', 'ArrowRight')) { Select.i = (Select.i + 1) % n; Snd.sfx('ui'); }
    let hov = -1; Select.XS.forEach((x, i) => { if (Math.abs(m.x - x) < 42 && m.y > 70 && m.y < 200) hov = i; });
    if (hov >= 0 && (m.x !== Select.lm.x || m.y !== Select.lm.y) && hov !== Select.i) { Select.i = hov; Snd.sfx('ui'); }
    Select.lm = { x: m.x, y: m.y };
    if (Input.hit('Enter', 'Space') || (Input.hit('Mouse0') && hov >= 0)) {
      Player.look = Paint.NAMES[Select.i]; Save.save(); Snd.sfx('door'); Game.ui = null;
      const f = Select.onEnd; Select.onEnd = null; if (f) f();
    }
  },
  draw(ctx) {
    const W = CFG.view.w, H = CFG.view.h;
    ctx.fillStyle = 'rgba(4,6,11,.86)'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(Decay.screen(), 0, 0, W, H);
    UI.head(ctx, 'WER GEHT VOR?', W / 2, 26, 'center', 15);
    Paint.NAMES.forEach((n, i) => {
      const x = Select.XS[i], on = i === Select.i, fy = 172;
      if (on) { ctx.save(); ctx.shadowColor = PAL.uiPlayer; ctx.shadowBlur = 14; ctx.strokeStyle = PAL.uiPlayer; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, fy, 30, 9, 0, 0, 6.3); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.globalAlpha = on ? 1 : 0.4; ctx.translate(x, fy - (on ? Math.abs(Math.sin(Game.time * 3)) * 2 : 0)); ctx.scale(3.4, 3.4);
      Sprites.draw(ctx, 'player_' + n, on ? 'walk' : 'idle', Game.time + i, 0, 0, { x: 0.3, y: 1 }, {}); ctx.restore();
      if (on) UI.glow(ctx, STORY.names[n], x, fy + 10, PAL.uiPlayer, 'bold 8px monospace', 'center', 10); else UI.text(ctx, STORY.names[n], x, fy + 10, PAL.uiDim, 'bold 8px monospace', 'center');
    });
    UI.text(ctx, STORY.select[Paint.NAMES[Select.i]], W / 2, 202, PAL.uiText, '8px monospace', 'center');
    UI.text(ctx, 'ALLE SPIELEN SICH GLEICH, NUR DER LOOK UNTERSCHEIDET SICH', W / 2, 216, PAL.uiDim, '7px monospace', 'center');
    UI.glow(ctx, 'A / D: WÄHLEN   ·   SPACE: LOS', W / 2, H - 28, PAL.uiInteract, 'bold 8px monospace', 'center', 8);
  }
};
