// Trash Vs. Nazi-Zombies - Bewuchs und Verwitterung (Welt und UI)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ DECAY (overgrowth and weathering shared by the world art and the UI frames) ============ */
const Decay = {
  M: 14, cache: new Map(), scr: null, LEAF: ['#2f4d36', '#3d6346', '#4f7a55', '#36584a'],
  hash(...a) { let h = 2166136261; for (const v of a) { h ^= Math.round(v * 10); h = Math.imul(h, 16777619); } return h >>> 0; },
  leaf(g, x, y, a, s, col) {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.5, -s * 0.45, s, 0); g.quadraticCurveTo(s * 0.5, s * 0.45, 0, 0); g.closePath();
    g.fillStyle = col; g.fill(); g.lineWidth = 0.35; g.strokeStyle = PAL.ink; g.stroke();
    g.beginPath(); g.moveTo(s * 0.12, 0); g.lineTo(s * 0.8, 0); g.strokeStyle = 'rgba(200,230,190,.3)'; g.lineWidth = 0.25; g.stroke(); g.restore();
  },
  vine(g, rnd, x, y, len, sway, dir) {   // drooping ivy with leaves, grows from (x, y)
    const pts = [], ph = rnd() * 6;
    for (let i = 0; i <= len; i += 1.2) pts.push([x + Math.sin(i * 0.18 + ph) * sway * Math.min(1, i / 6), y + i * dir]);
    const stroke = (w, c) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = c; g.stroke(); };
    stroke(1.4, PAL.ink); stroke(0.75, '#4a5a3a');
    for (let i = 2; i < pts.length; i += 2 + Math.floor(rnd() * 2)) { const p = pts[i], side = (i >> 1) % 2 ? 1 : -1; Decay.leaf(g, p[0], p[1], (side > 0 ? 0.5 : Math.PI - 0.5) + (rnd() - 0.5) * 0.7, 2.2 + rnd() * 1.6, Decay.LEAF[Math.floor(rnd() * 4)]); }
  },
  blob(g, x, y, r) { g.fillStyle = 'rgba(40,66,46,.7)'; g.beginPath(); g.ellipse(x, y, r * 1.4, r * 0.9, 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(92,138,90,.55)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.25, r * 0.7, r * 0.45, 0, 0, 6.3); g.fill(); },
  weeds(g, rnd, x, y, n) {
    for (let i = 0; i < n; i++) {
      const bx = x + (rnd() - 0.5) * 6, h = 2 + rnd() * 4, lean = (rnd() - 0.5) * 2.5;
      g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + lean * 0.3, y - h * 0.6, bx + lean, y - h);
      g.lineCap = 'round'; g.lineWidth = 0.9; g.strokeStyle = PAL.ink; g.stroke(); g.lineWidth = 0.5; g.strokeStyle = ['#4f7a55', '#6a9a62', '#3d6346'][i % 3]; g.stroke();
    }
  },
  panel(w, h, vines) {   // cached weathered slab for UI.box (logical size + margin for overhanging plants)
    const key = w + 'x' + h + (vines ? 'v' : ''); let c = Decay.cache.get(key); if (c) return c;
    if (Decay.cache.size > 160) Decay.cache.clear();
    const M = Decay.M, K = CFG.view.ss; c = document.createElement('canvas'); c.width = (w + M * 2) * K; c.height = (h + M * 2) * K;
    const g = c.getContext('2d'); g.scale(K, K); g.translate(M, M); const rnd = Paint.rng(Decay.hash(w, h, 7));
    const pts = [], jag = (a, b, n) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 0.9, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 0.9]); } };
    const ch = Math.min(3, h / 4), nx = Math.max(3, Math.round(w / 14)), ny = Math.max(2, Math.round(h / 14));
    jag([ch, 0], [w - ch, 0], nx); jag([w - ch, 0], [w, ch], 1); jag([w, ch], [w, h - ch], ny); jag([w, h - ch], [w - ch, h], 1); jag([w - ch, h], [ch, h], nx); jag([ch, h], [0, h - ch], 1); jag([0, h - ch], [0, ch], ny); jag([0, ch], [ch, 0], 1);
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(23,27,32,.95)'); gr.addColorStop(1, 'rgba(10,12,15,.97)'); g.fillStyle = gr; g.fill();
    g.save(); g.clip();                                                        // painted texture: strokes, grime, damp patches
    for (let i = 0; i < w * h / 30; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,240,210,.03)' : 'rgba(0,0,0,.2)'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 0.5 + rnd() * 0.8); }
    for (let i = 0; i < Math.max(2, w / 60); i++) { const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 12, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(60,84,56,.16)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.restore();
    g.lineWidth = 1.2; g.strokeStyle = PAL.ink; g.stroke();
    const ins = 2.2, seg = (x0, y0, x1, y1) => { let t = 0; while (t < 1) { const t1 = Math.min(1, t + 0.2 + rnd() * 0.5); g.beginPath(); g.moveTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); g.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1); g.stroke(); t = t1 + (rnd() < 0.3 ? 0.03 + rnd() * 0.05 : 0); } };
    if (h > 8) {                                                               // tarnished brass inlay with gaps, rivets with verdigris
      g.strokeStyle = PAL.uiBrass; g.lineWidth = 0.7; seg(ins + 2, ins, w - ins - 2, ins); seg(w - ins, ins + 2, w - ins, h - ins - 2); seg(w - ins - 2, h - ins, ins + 2, h - ins); seg(ins, h - ins - 2, ins, ins + 2);
      g.strokeStyle = 'rgba(236,210,160,.22)'; g.lineWidth = 0.35; seg(ins + 2, ins - 0.6, w - ins - 2, ins - 0.6);
      if (h > 16) for (const [cx, cy] of [[ins, ins], [w - ins, ins], [ins, h - ins], [w - ins, h - ins]]) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(cx, cy, 1.9, 0, 6.3); g.fill(); g.fillStyle = '#8a7350'; g.beginPath(); g.arc(cx, cy, 1.25, 0, 6.3); g.fill(); g.fillStyle = 'rgba(73,172,149,.6)'; g.beginPath(); g.arc(cx + 0.4, cy + 0.3, 0.6, 0, 6.3); g.fill(); }
      for (let i = 0; i < Math.max(2, w / 45); i++) { g.fillStyle = 'rgba(73,150,125,.32)'; g.beginPath(); g.ellipse(ins + rnd() * (w - ins * 2), rnd() < 0.5 ? ins : h - ins, 1 + rnd() * 2, 0.5 + rnd() * 0.5, 0, 0, 6.3); g.fill(); }
    }
    if (vines) {                                                               // ivy over one corner, moss and weeds on the edges (kept clear of the text)
      const left = rnd() < 0.5, vx = left ? 3 + rnd() * 5 : w - 3 - rnd() * 5;
      Decay.vine(g, rnd, vx, -1.5, Math.min(h * 0.6, 14 + rnd() * 24), 1.8, 1);
      for (let i = 0; i < 9; i++) Decay.blob(g, (left ? 0 : w - 20) + rnd() * 20, -1 + rnd() * 2.5, 0.7 + rnd() * 1.2);
      if (w > 120) { const x = w * (0.3 + rnd() * 0.4); for (let i = 0; i < 4; i++) Decay.leaf(g, x + (rnd() - 0.5) * 10, -0.5, -Math.PI / 2 + (rnd() - 0.5) * 2.2, 2.5 + rnd() * 2, Decay.LEAF[i % 4]); for (let i = 0; i < 5; i++) Decay.blob(g, x + (rnd() - 0.5) * 14, rnd() * 1.5, 0.6 + rnd()); }
      if (rnd() < 0.7) { const x = rnd() < 0.5 ? 6 + rnd() * 20 : w - 6 - rnd() * 20; Decay.weeds(g, rnd, x, h + 0.5, 4); for (let i = 0; i < 6; i++) Decay.blob(g, x + (rnd() - 0.5) * 16, h - 0.5 + rnd(), 0.6 + rnd()); }
    }
    Decay.cache.set(key, c); return c;
  },
  screen() {   // overgrown frame around the title and character choice
    if (Decay.scr) return Decay.scr;
    const W = CFG.view.w, H = CFG.view.h, K = CFG.view.ss, c = document.createElement('canvas'); c.width = W * K; c.height = H * K;
    const g = c.getContext('2d'); g.scale(K, K); const rnd = Paint.rng(4242);
    for (let i = 0; i < 10; i++) { const x = i < 5 ? rnd() * 110 : W - rnd() * 110, near = Math.min(x, W - x) < 40; Decay.vine(g, rnd, x, -2, (near ? 50 : 14) + rnd() * (near ? 90 : 40), 3, 1); }
    for (let i = 0; i < 3; i++) Decay.vine(g, rnd, 60 + rnd() * (W - 120), -2, 6 + rnd() * 12, 1.5, 1);
    for (const [x0, dir] of [[0, 1], [W, -1]]) {
      for (let i = 0; i < 30; i++) { const d = rnd() * 80, x = x0 + dir * d, y = H + 1 - rnd() * 26 * (1 - d / 90); Decay.leaf(g, x, y, -Math.PI / 2 + (rnd() - 0.5) * 1.9, 4 + rnd() * 5, Decay.LEAF[Math.floor(rnd() * 4)]); }
      Decay.weeds(g, rnd, x0 + dir * 25, H, 9); Decay.weeds(g, rnd, x0 + dir * 55, H, 6);
      for (let i = 0; i < 18; i++) Decay.blob(g, x0 + dir * rnd() * 70, H - rnd() * 4, 0.8 + rnd() * 1.6);
    }
    return (Decay.scr = c);
  }
};
