// Trash Vs. Nazi-Zombies - Gemalte Figuren und Kacheln (prozedural)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ PAINT (procedural painted art: vector rigs with gradients, rim light, ink outline and grain, pre-rendered to sheets) ============ */
const Paint = {
  NAMES: ['coole', 'schuechtern', 'nerdig'], TITLES: { coole: 'DER COOLE', schuechtern: 'DER SCHÜCHTERNE', nerdig: 'DER NERDIGE' },
  LOOKS: {
    coole:       { kind: 'res', skin: '#8c5a3c', hair: '#17100e', top: '#2c2029', jacket: '#3a2d36', fur: '#b8935c', pants: '#1f2a3d', shoes: '#cfc8bc', style: 'curls', face: 'grin' },
    schuechtern: { kind: 'res', skin: '#e4b595', hair: '#d9ad5c', top: '#5d6b2d', pants: '#2c3d5e', shoes: '#4a3b2e', style: 'short', face: 'shy', folded: true },
    nerdig:      { kind: 'res', skin: '#dba885', hair: '#241712', top: '#7e2c33', pants: '#2b2b3a', shoes: '#2c2c30', style: 'messy', face: 'glasses' },
    walker:      { kind: 'zom', skin: '#8fa88c', hair: '#2a2622', top: '#585b47', pants: '#6d6853', shoes: '#15161a', strap: '#3a2e24', belt: '#1b1a18', cap: '#4b4e3e', band: PAL.neonPurple, glow: '#b8ff7c' }
  },
  VIEWS: { S: { side: 0, back: false }, SE: { side: 0.5, back: false }, E: { side: 1, back: false }, NE: { side: 0.5, back: true }, N: { side: 0, back: true } },
  mix(a, b, t) { const q = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = q(a), B = q(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); },
  rng(seed) { let s = seed | 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) | 0) >>> 0) / 4294967296; },
  canvas(w, h) { const K = CFG.view.ss, c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const g = c.getContext('2d'); g.scale(K, K); return { c, g }; },
  shape(g, draw, fill, b, rim) {   // gradient fill, rim light on the right (neon side), dark ink outline
    g.beginPath(); draw(g);
    const gr = g.createLinearGradient(0, b[1], 0, b[3]); gr.addColorStop(0, Paint.mix(fill, '#ffffff', 0.16)); gr.addColorStop(1, Paint.mix(fill, PAL.night, 0.42));
    g.fillStyle = gr; g.fill();
    g.save(); g.clip(); const rg = g.createLinearGradient(b[2], 0, b[2] - 2.4, 0); rg.addColorStop(0, rim || PAL.neonCyan + 'a0'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(b[0] - 1, b[1] - 1, b[2] - b[0] + 2, b[3] - b[1] + 2); g.restore();
    g.lineWidth = 0.9; g.lineJoin = 'round'; g.strokeStyle = PAL.ink; g.stroke();
  },
  rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
  limb(g, x0, y0, x1, y1, w, col) {   // thick painted limb: ink, base, shade, rim
    g.lineCap = 'round';
    const ln = (dx, lw, c) => { g.beginPath(); g.moveTo(x0 + dx, y0); g.lineTo(x1 + dx, y1); g.lineWidth = lw; g.strokeStyle = c; g.stroke(); };
    ln(0, w + 1.7, PAL.ink); ln(0, w, col); ln(-w * 0.2, w * 0.4, Paint.mix(col, PAL.night, 0.35)); ln(w * 0.32, 0.7, PAL.neonCyan + '80');
  },
  blobs(g, cs, col) {   // union of circles with one outline (hair curls, fur)
    g.fillStyle = PAL.ink; for (const [x, y, r] of cs) { g.beginPath(); g.arc(x, y, r + 0.9, 0, 6.3); g.fill(); }
    g.fillStyle = col; for (const [x, y, r] of cs) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
    g.fillStyle = Paint.mix(col, '#ffffff', 0.22); for (const [x, y, r] of cs) { g.beginPath(); g.arc(x - r * 0.25, y - r * 0.3, r * 0.45, 0, 6.3); g.fill(); }
  },
  grain(g, rnd, x, y, w, h, n) {   // paint grain, only where there is already paint
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < n; i++) { g.fillStyle = rnd() < 0.55 ? 'rgba(8,10,18,0.11)' : 'rgba(210,235,240,0.08)'; g.fillRect(x + rnd() * w, y + rnd() * h, 0.5 + rnd() * 0.9, 0.5 + rnd() * 0.9); }
    g.restore();
  },
  rig(g, L, view, anim, f, n) {   // one frame; origin = feet
    const S = view.side, bk = view.back, zom = L.kind === 'zom', ph = n > 1 ? f / n * 6.2832 : 0, p1 = n > 1 ? f / (n - 1) : 1;
    let bob = 0, lean = 0, legA = 0, arm = 0, rot = 0, al = 1, hx = 0, raise = false;
    switch (anim) {
      case 'idle': bob = Math.sin(ph) * 0.3; arm = Math.sin(ph) * 0.5; break;
      case 'walk': bob = -Math.abs(Math.sin(ph)) * (zom ? 0.6 : 0.9); legA = Math.sin(ph); arm = -legA; lean = zom ? 0.5 : 0.7; break;
      case 'windup': lean = -p1 * 1.4; arm = 2.2; raise = true; break;
      case 'attack': lean = Math.sin(p1 * 3.14) * 2.4; arm = 3.5; legA = 0.5; raise = true; break;
      case 'dash': lean = 2.8; legA = f ? -1.2 : 1.2; arm = 2.5; raise = true; break;
      case 'hurt': lean = -1.8; hx = -1; arm = 1.5; break;
      case 'die': rot = p1 * 1.5; al = 1 - Math.max(0, p1 - 0.75) * 3.2; bob = p1 * 1.2; break;
    }
    g.save(); g.globalAlpha = Math.max(0, al);
    if (rot) { if (S > 0.45) g.rotate(-rot); else g.scale(1 + p1 * 0.2, 1 - p1 * 0.62); }
    const hipY = -8.2 + bob, shY = -16.6 + bob, tw = 9.4 - S * 3.4, hdx = lean * 0.6 + (zom ? 1.4 : 0) + hx, hdy = -21.8 + bob + (zom ? 0.9 : 0), skew = zom ? 0.9 : 0;
    const eyesX = S > 0.7 ? [1.2] : [-1.5 + S * 1.8, 1.5 + S * 1.8];
    // far arm (side views), then legs
    const arm_ = (near) => {
      const dir = near ? 1 : -1, sx = S > 0.5 ? (near ? 0.5 : -0.9) : dir * tw / 2, sy = shY + 1.3 + (!near ? skew : 0);
      let ax = sx + (S > 0.5 ? 0 : dir * 0.7) + S * arm * dir * 1.7 + lean * 0.5, ay = sy + 6.3 - Math.abs(arm) * 0.25;
      if (zom) { ax = sx + S * 4.2 + (S > 0.5 ? 0 : dir * 1.4) + lean * 0.4; ay = sy + 4.4 + Math.sin(ph + dir) * 0.5; }
      if (raise && near) { ax = sx + 1.6 + S * 3.6 + lean; ay = sy + 1.2; }
      const sleeve = L.jacket || L.top;
      if (L.folded && S < 0.6 && !bk && !raise) { ax = -dir * 3.4; ay = shY + 5.4; Paint.limb(g, sx, sy, ax, ay, 2.4, sleeve); }
      else Paint.limb(g, sx, sy, ax, ay, 2.5, sleeve);
      if (zom && near) { const mx = (sx + ax) / 2, my = (sy + ay) / 2 - 1; g.fillStyle = L.band; g.fillRect(mx - 1.6, my - 0.9, 3.2, 1.8); g.fillStyle = PAL.ink; g.strokeStyle = PAL.ink; g.lineWidth = 0.4; g.strokeRect(mx - 1.6, my - 0.9, 3.2, 1.8); g.beginPath(); g.arc(mx, my, 0.55, 0, 6.3); g.stroke(); }   // armband with an invented ring emblem
      g.fillStyle = PAL.ink; g.beginPath(); g.arc(ax, ay, 1.9, 0, 6.3); g.fill(); g.fillStyle = L.skin; g.beginPath(); g.arc(ax, ay, 1.2, 0, 6.3); g.fill();
    };
    if (S > 0.5) arm_(false);
    for (const far of [true, false]) {   // legs: far first
      const ph2 = legA * (far ? -1 : 1), lx = (far ? -1 : 1) * (S > 0.7 ? 0.3 : 2.1 - S * 1.5), fx = lx + S * ph2 * 2.7 * (zom ? 0.7 : 1) + lean * 0.3, lift = Math.max(0, ph2 * (far ? -1 : 1) * -1 + 0) * 0;
      const fl = Math.max(0, (far ? -ph2 : ph2)) * 1.5 * (1 - S * 0.4), fy = -0.9 - fl;
      const pc = far ? Paint.mix(L.pants, PAL.night, 0.3) : L.pants;
      Paint.limb(g, lx * 0.8, hipY, fx, fy, zom ? 3.6 : 3.0, pc);
      if (zom) Paint.limb(g, lx * 0.85 + (fx - lx * 0.85) * 0.55, -5.2, fx, fy, 3.3, L.shoes);   // tall boots
      g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(fx + S * 1.0, fy + 0.2, 2.9 + S * 0.8, 1.9, 0, 0, 6.3); g.fill(); g.fillStyle = zom ? Paint.mix(L.shoes, PAL.slate, 0.3) : L.shoes; g.beginPath(); g.ellipse(fx + S * 1.0, fy, 2.2 + S * 0.8, 1.3, 0, 0, 6.3); g.fill();
    }
    // torso
    const tx = -tw / 2 + lean * 0.5, bot = hipY + (zom ? 2.6 : 1.3);
    Paint.shape(g, gg => {
      if (zom) { gg.moveTo(tx, shY + skew); gg.lineTo(tx + tw, shY); gg.lineTo(tx + tw + 0.5, bot - 1); for (let i = 0; i <= 5; i++) gg.lineTo(tx + tw + 0.5 - (tw + 1) * i / 5, bot + (i % 2 ? 1.1 : -0.3)); gg.closePath(); }   // ragged coat hem
      else Paint.rr(gg, tx, shY, tw, bot - shY, 2.2);
    }, L.jacket || L.top, [tx, shY, tx + tw, bot]);
    g.save(); g.beginPath(); g.rect(tx, shY, tw, bot - shY + 2); g.clip();
    if (L.fur) { /* fur collar drawn with the head */ }
    if (L.jacket && !bk && S < 0.8) { g.fillStyle = L.top; g.fillRect(-1.6 + lean * 0.5, shY + 1, 3.2, bot - shY - 1); g.fillStyle = '#c5424a'; g.fillRect(-1.6 + lean * 0.5, hipY - 1.6, 3.2, 1.2); }   // open jacket over a shirt
    if (L.kind === 'res' && !L.jacket && L.style === 'short') { g.fillStyle = Paint.mix(L.top, PAL.night, 0.35); g.fillRect(tx, bot - 1.8, tw, 1.8); }   // ribbed sweater hem
    if (zom) {
      g.strokeStyle = L.strap; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tx + 0.4, shY + 0.4); g.lineTo(tx + tw - 0.4, hipY + 0.8); g.stroke();   // shoulder strap
      g.fillStyle = L.belt; g.fillRect(tx - 0.3, hipY - 1.7, tw + 0.6, 1.5); if (!bk) { g.fillStyle = PAL.ice; g.fillRect(-0.7 + lean * 0.5, hipY - 1.6, 1.4, 1.2); }   // belt with buckle
      g.fillStyle = 'rgba(10,12,18,.45)'; for (const dx of [-1.6, 1.4]) g.fillRect(tx + tw / 2 + dx + lean * 0.5, shY + 3, 0.9, 0.9);                       // buttons / pocket
    }
    g.restore();
    // neck + head
    Paint.limb(g, 0 + lean * 0.4, shY + 0.5, hdx * 0.7, hdy + 2.6, 2.4, L.skin);
    if (L.fur) Paint.blobs(g, [[-3.6, shY + 0.3, 2.0], [-1.8, shY - 0.4, 2.1], [0, shY - 0.6, 2.1], [1.8, shY - 0.4, 2.1], [3.6, shY + 0.3, 2.0]].map(([x, y, r]) => [x * (1 - S * 0.55) + lean * 0.5, y, r]), L.fur);
    Paint.shape(g, gg => gg.ellipse(hdx, hdy, 3.7, 4.1, 0, 0, 6.3), L.skin, [hdx - 3.7, hdy - 4.1, hdx + 3.7, hdy + 4.1]);
    const fx0 = hdx + S * 1.9;
    if (!bk) {
      if (zom) { for (const ex of eyesX) { g.fillStyle = 'rgba(10,12,18,.55)'; g.beginPath(); g.ellipse(hdx + ex + S * 1.3, hdy + 0.2, 1.3, 1.1, 0, 0, 6.3); g.fill(); }
        g.save(); g.globalCompositeOperation = 'lighter'; for (const ex of eyesX) { const x = hdx + ex + S * 1.3, gr = g.createRadialGradient(x, hdy + 0.2, 0, x, hdy + 0.2, 3); gr.addColorStop(0, L.glow); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 3, hdy - 2.8, 6, 6); } g.restore();
        g.fillStyle = L.glow; for (const ex of eyesX) { g.beginPath(); g.arc(hdx + ex + S * 1.3, hdy + 0.2, 0.7, 0, 6.3); g.fill(); }
        g.fillStyle = '#2a0f14'; g.beginPath(); g.ellipse(fx0 * 0.9 + hdx * 0.1, hdy + 2.4, 1.4, 1.0, 0, 0, 6.3); g.fill();   // open mouth
        g.strokeStyle = 'rgba(70,20,30,.7)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(hdx - 2, hdy - 0.5 + S); g.lineTo(hdx - 0.6, hdy + 1.6); g.stroke(); }
      else for (const ex of eyesX) {
        const x = hdx + ex + S * 1.3; g.strokeStyle = PAL.ink; g.fillStyle = PAL.ink; g.lineWidth = 0.6;
        if (L.face === 'shy') { g.beginPath(); g.arc(x, hdy + 0.2, 0.9, 0.2, 2.9); g.stroke(); } else { g.beginPath(); g.ellipse(x, hdy + 0.3, 0.55, 0.75, 0, 0, 6.3); g.fill(); }
        if (L.face === 'glasses') { g.lineWidth = 0.55; g.beginPath(); g.arc(x, hdy + 0.3, 1.5, 0, 6.3); g.stroke(); }
      }
      if (L.face === 'glasses' && S < 0.7) { g.strokeStyle = PAL.ink; g.lineWidth = 0.5; g.beginPath(); g.moveTo(hdx + eyesX[0] + S * 1.3 + 1.5, hdy + 0.3); g.lineTo(hdx + eyesX[1] + S * 1.3 - 1.5, hdy + 0.3); g.stroke(); }
      if (L.face === 'grin') { g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(fx0 * 0.8 + hdx * 0.2, hdy + 2.3, 1.9 - S * 0.4, 1.1, 0, 0, 3.15); g.fill(); g.fillStyle = '#f2ece0'; g.fillRect(fx0 * 0.8 + hdx * 0.2 - 1.3 + S * 0.3, hdy + 1.9, 2.6 - S * 0.6, 0.7); }
      else if (L.face === 'shy') { g.strokeStyle = 'rgba(40,20,20,.8)'; g.lineWidth = 0.5; g.beginPath(); g.arc(fx0 * 0.8 + hdx * 0.2, hdy + 1.9, 1.1, 0.3, 2.8); g.stroke(); g.fillStyle = 'rgba(220,90,90,.28)'; for (const ex of eyesX) { g.beginPath(); g.ellipse(hdx + ex + S * 1.3, hdy + 1.7, 1, 0.6, 0, 0, 6.3); g.fill(); } }
      else if (L.face === 'glasses') { g.strokeStyle = 'rgba(40,20,20,.8)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(fx0 * 0.8 + hdx * 0.2 - 0.9, hdy + 2.3); g.lineTo(fx0 * 0.8 + hdx * 0.2 + 0.9, hdy + 2.3); g.stroke(); }
    }
    // hair / cap
    const H = [hdx, hdy];
    if (zom) {
      Paint.blobs(g, [[H[0] - 3.4, H[1] + 0.8, 1.2], [H[0] + 3.4, H[1] + 0.8, 1.2]], L.hair);
      Paint.shape(g, gg => Paint.rr(gg, H[0] - 4.4, H[1] - 6.4, 8.8, 4.4, 2), L.cap, [H[0] - 4.4, H[1] - 6.4, H[0] + 4.4, H[1] - 2]);
      if (!bk) { Paint.shape(g, gg => gg.ellipse(H[0] + S * 2.6, H[1] - 1.8, 4.6 - S * 1.2, 1.3, 0, 0, 6.3), '#16171a', [H[0] - 3, H[1] - 3.1, H[0] + 6, H[1] - 0.5]);
        g.fillStyle = L.band; g.fillRect(H[0] - 4.2, H[1] - 3.7, 8.4, 0.9); g.strokeStyle = PAL.ink; g.lineWidth = 0.45; g.beginPath(); g.arc(H[0] + S * 2, H[1] - 4.6, 0.8, 0, 6.3); g.stroke(); }
    } else if (L.style === 'curls') {
      const cs = [[-3.3, -2.2, 2.0], [-1.6, -3.6, 2.1], [0.4, -4.1, 2.2], [2.3, -3.4, 2.1], [3.6, -1.8, 1.9], [-3.9, 0.2, 1.7], [3.9, 0.4, 1.6]];
      Paint.blobs(g, cs.map(([x, y, r]) => [H[0] + x * (1 - S * 0.25) - S * (bk ? 0 : 0.6), H[1] + y, r]).concat(bk ? [[H[0] - 2, H[1] + 1.4, 2.2], [H[0] + 2, H[1] + 1.4, 2.2], [H[0], H[1] + 2.6, 2.0]] : []), L.hair);
    } else if (L.style === 'short') {
      Paint.shape(g, gg => { gg.moveTo(H[0] - 3.9, H[1] + (bk ? 2 : 0)); gg.quadraticCurveTo(H[0] - 4.4, H[1] - 5.6, H[0] + 0.4, H[1] - 5.2); gg.quadraticCurveTo(H[0] + 4.6, H[1] - 4.8, H[0] + 3.9, H[1] + (bk ? 2 : 0)); gg.lineTo(H[0] + 3.2, H[1] - (bk ? 0 : 2.2)); gg.quadraticCurveTo(H[0] - 0.2 + S * 1.4, H[1] - 3.4, H[0] - 3.2, H[1] - 1.6); gg.closePath(); }, L.hair, [H[0] - 4, H[1] - 5.4, H[0] + 4.4, H[1] + 2]);
    } else {
      Paint.blobs(g, [[-3, -2.6, 1.7], [-1, -4.2, 1.8], [1.2, -4.4, 1.7], [3, -3, 1.8], [3.7, -0.8, 1.4], [-3.6, -0.6, 1.4]].map(([x, y, r]) => [H[0] + x * (1 - S * 0.2), H[1] + y, r]).concat(bk ? [[H[0], H[1] + 1.2, 3.2]] : []), L.hair);
    }
    if (S <= 0.5) arm_(false);
    arm_(true);
    g.restore();   // arms are part of the (rotated / faded) figure
  },
  sheet(name, defName, L, seed) {
    const d = CFG.sprites[defName], ks = Object.keys(d.anims), rows = d.dirs === 8 ? ['S', 'SE', 'E', 'NE', 'N'] : ['S', 'E', 'N'], rnd = Paint.rng(seed);
    const cols = Math.max(...ks.map(k => d.anims[k].n)), { c, g } = Paint.canvas(cols * d.fw, ks.length * rows.length * d.fh);
    ks.forEach((an, ai) => rows.forEach((dir, ri) => { for (let f = 0; f < d.anims[an].n; f++) {
      const x0 = f * d.fw, y0 = (ai * rows.length + ri) * d.fh;
      g.save(); g.beginPath(); g.rect(x0, y0, d.fw, d.fh); g.clip(); g.translate(x0 + d.ax, y0 + d.ay);
      Paint.rig(g, L, Paint.VIEWS[dir], an, f, d.anims[an].n); Paint.grain(g, rnd, -d.ax, -d.ay, d.fw, d.fh, 90);
      g.restore();
    } }));
    Sprites.imgs[name] = c; Sprites.ok[name] = true;
  },
  THEME: [   // per biome: floor tones, grout, stain, wall top/left/right, accent
    { f: ['#2e4960', '#274055'], grout: '#0f1a24', stain: PAL.petrol,   wt: '#456a88', wl: '#1d3043', wr: '#2b4a63', ac: PAL.neonCyan },
    { f: ['#313a78', '#292f64'], grout: '#10132b', stain: PAL.lavender, wt: '#4f559e', wl: '#1f2352', wr: '#323a82', ac: PAL.neonPurple },
    { f: ['#34808a', '#2d6e77'], grout: '#12303a', stain: PAL.mint,     wt: '#5aaaa8', wl: '#1f4f58', wr: '#2e7580', ac: PAL.neonGreen },
    { f: ['#322838', '#2a2130'], grout: '#120d16', stain: PAL.rose,     wt: '#5a4663', wl: '#1e1626', wr: '#322540', ac: PAL.pink }
  ],
  tiles() {
    const B = CFG.biomes.length, rnd = Paint.rng(77), T = Paint.THEME;
    { const fl = CFG.sprites.floor, { c, g } = Paint.canvas(fl.fw * fl.variants, fl.fh * B);
      for (let b = 0; b < B; b++) for (let v = 0; v < fl.variants; v++) {
        const th = T[b % T.length], ox = v * fl.fw, oy = b * fl.fh, P = (u, w) => [ox + 16 + (u - w) * 16, oy + (u + w) * 8];
        g.save(); g.beginPath(); g.moveTo(ox + 16, oy - 0.4); g.lineTo(ox + 32.4, oy + 8); g.lineTo(ox + 16, oy + 16.4); g.lineTo(ox - 0.4, oy + 8); g.closePath(); g.clip();
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
          const c0 = Paint.mix(th.f[(i + j) % 2], rnd() < 0.5 ? '#ffffff' : PAL.night, 0.04 + rnd() * 0.09), pts = [P(i / 2, j / 2), P((i + 1) / 2, j / 2), P((i + 1) / 2, (j + 1) / 2), P(i / 2, (j + 1) / 2)];
          const gr = g.createLinearGradient(0, oy, 0, oy + 16); gr.addColorStop(0, Paint.mix(c0, '#ffffff', 0.1)); gr.addColorStop(1, Paint.mix(c0, PAL.night, 0.25));
          g.beginPath(); pts.forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fillStyle = gr; g.fill();
        }
        g.strokeStyle = th.grout; g.lineWidth = 0.6; g.globalAlpha = 0.85;
        for (const [a, bb] of [[P(0.5, 0), P(0.5, 1)], [P(0, 0.5), P(1, 0.5)]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo((a[0] + bb[0]) / 2 + (rnd() - 0.5) * 0.7, (a[1] + bb[1]) / 2 + (rnd() - 0.5) * 0.5); g.lineTo(bb[0], bb[1]); g.stroke(); }
        g.globalAlpha = 1;
        if (rnd() < 0.55) { g.fillStyle = th.stain + '30'; g.beginPath(); g.ellipse(ox + 8 + rnd() * 16, oy + 5 + rnd() * 6, 2 + rnd() * 4, 1 + rnd() * 2, 0, 0, 6.3); g.fill(); }   // stains
        if (rnd() < 0.3) { g.strokeStyle = 'rgba(8,12,18,.55)'; g.lineWidth = 0.5; g.beginPath(); let x = ox + 6 + rnd() * 18, y = oy + 4 + rnd() * 8; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.4) * 3; y += (rnd() - 0.5) * 1.5; g.lineTo(x, y); } g.stroke(); }   // cracks
        for (let k = 0; k < 5; k++) if (rnd() < 0.5) { const q = rnd() < 0.5 ? P(0.5, rnd()) : P(rnd(), 0.5); Decay.blob(g, q[0], q[1], 0.5 + rnd() * 0.9); }   // moss in the grout
        if (rnd() < 0.18) { const q = P(0.2 + rnd() * 0.6, 0.2 + rnd() * 0.6); Decay.weeds(g, rnd, q[0], q[1] + 1, 2 + Math.floor(rnd() * 3)); }
        Paint.grain(g, rnd, ox, oy, 32, 16, 40); g.restore();
      }
      Sprites.imgs.floor = c; Sprites.ok.floor = true; }
    { const wl = CFG.sprites.wall, { c, g } = Paint.canvas(wl.fw * wl.variants, wl.fh * B);
      for (let b = 0; b < B; b++) for (let v = 0; v < wl.variants; v++) {
        const th = T[b % T.length], ox = v * wl.fw, oy = b * wl.fh, X = (x, y) => [ox + x, oy + y];
        g.save(); g.beginPath(); g.rect(ox, oy, 32, 30); g.clip();
        const face = (pts, col) => { const gr = g.createLinearGradient(0, oy + pts[0][1], 0, oy + pts[2][1]); gr.addColorStop(0, Paint.mix(col, '#ffffff', 0.1)); gr.addColorStop(1, Paint.mix(col, PAL.night, 0.4)); g.beginPath(); pts.forEach((q, k) => { const p = X(q[0], q[1]); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fillStyle = gr; g.fill(); };
        face([[0, 8], [16, 16], [16, 30], [0, 22]], th.wl); face([[16, 16], [32, 8], [32, 22], [16, 30]], th.wr); face([[16, 0], [32, 8], [16, 16], [0, 8]], th.wt);
        g.strokeStyle = 'rgba(8,12,18,.4)'; g.lineWidth = 0.5;   // tile courses + joints on both faces
        for (const [x0, y0, x1, y1] of [[0, 8, 16, 16], [16, 16, 32, 8]]) for (const k of [0.38, 0.7]) { g.beginPath(); g.moveTo(ox + x0, oy + y0 + 14 * k); g.lineTo(ox + x1, oy + y1 + 14 * k); g.stroke(); }
        for (const x of [4, 8, 12, 20, 24, 28]) { const yy = x < 16 ? 8 + x / 2 : 16 - (x - 16) / 2; g.beginPath(); g.moveTo(ox + x, oy + yy + (x % 8 ? 0 : 5.3)); g.lineTo(ox + x, oy + yy + 5.3 + (x % 8 ? 0 : 5.4)); g.stroke(); }
        const gr = g.createLinearGradient(0, oy + 18, 0, oy + 30); gr.addColorStop(0, 'rgba(8,10,16,0)'); gr.addColorStop(1, 'rgba(8,10,16,.5)'); g.fillStyle = gr; g.fillRect(ox, oy + 18, 32, 12);   // grime at the foot
        if (rnd() < 0.7) { g.fillStyle = th.stain + '26'; g.beginPath(); g.ellipse(ox + 6 + rnd() * 20, oy + 14 + rnd() * 10, 2 + rnd() * 3, 1.5 + rnd() * 3, 0, 0, 6.3); g.fill(); }   // damp / mold
        g.strokeStyle = th.ac + '99'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(ox + 16, oy + 0.4); g.lineTo(ox + 31.6, oy + 8); g.stroke();   // neon rim on the lit edge
        g.strokeStyle = PAL.ink; g.lineWidth = 0.9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(ox, oy + 8); g.lineTo(ox + 16, oy); g.lineTo(ox + 32, oy + 8); g.lineTo(ox + 32, oy + 22); g.lineTo(ox + 16, oy + 30); g.lineTo(ox, oy + 22); g.closePath(); g.stroke();
        g.lineWidth = 0.7; g.beginPath(); g.moveTo(ox, oy + 8); g.lineTo(ox + 16, oy + 16); g.lineTo(ox + 32, oy + 8); g.moveTo(ox + 16, oy + 16); g.lineTo(ox + 16, oy + 30); g.stroke();
        for (let k = 0; k < 6; k++) { const u = rnd(), v = rnd(); Decay.blob(g, ox + 16 + (u - v) * 16, oy + (u + v) * 8, 0.7 + rnd() * 1.3); }   // moss on the low walls
        if (rnd() < 0.5) { const u = 0.2 + rnd() * 0.6; Decay.vine(g, rnd, ox + 16 + (u - 1) * 16, oy + (u + 1) * 8, 4 + rnd() * 6, 0.8, 1); }
        Paint.grain(g, rnd, ox, oy, 32, 30, 70); g.restore();
      }
      Sprites.imgs.wall = c; Sprites.ok.wall = true; }
  },
  init() {
    const D = CFG.sprites;
    for (const k of Paint.NAMES) D['player_' + k] = D.player;                    // one sheet per resident (same layout as 'player')
    Paint.NAMES.forEach((k, i) => Paint.sheet('player_' + k, 'player', Paint.LOOKS[k], 11 + i * 7));
    Paint.sheet('walker', 'walker', Paint.LOOKS.walker, 5);
    Paint.tiles(); Env.init();                                                    // dropped PNGs (Sprites.set) still override these procedural sheets
  }
};
