// Trash Vs. Nazi-Zombies - Optionale PNG-Sprites (Drag & Drop)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ SPRITES (optional art layer; every draw falls back to the procedural look) ============ */
const Sprites = {
  imgs: {}, ok: {}, msg: '', msgAt: 0, sc: null,
  note(m) { Sprites.msg = m; Sprites.msgAt = performance.now(); },
  dirRows(d) { return d.dirs === 1 ? 1 : d.dirs === 4 ? (d.mirror ? 3 : 4) : (d.mirror ? 5 : 8); },
  need(name) {   // minimum sheet size in px
    const d = CFG.sprites[name];
    const K = CFG.view.ss;   // sheets are authored at ss x the logical frame size
    if (d.tile) return { w: d.fw * d.variants * K, h: d.fh * CFG.biomes.length * K };
    const ks = Object.keys(d.anims);
    return { w: d.fw * K * Math.max(...ks.map(k => d.anims[k].n)), h: d.fh * K * ks.length * Sprites.dirRows(d) };
  },
  set(name, src, blob) {
    if (!CFG.sprites[name]) return;
    const img = new Image();
    img.onload = () => {
      const n = Sprites.need(name);
      if (img.width < n.w || img.height < n.h) { Sprites.note('BAD SIZE ' + name + ': NEED ' + n.w + 'x' + n.h + ' GOT ' + img.width + 'x' + img.height); return; }
      Sprites.imgs[name] = img; Sprites.ok[name] = true; Sprites.note('SPRITE LOADED: ' + name);
      if (blob) Sprites.put(name, blob);
    };
    img.onerror = () => Sprites.note('CANNOT READ ' + name);
    img.src = src;
  },
  track(o, name) { if (o._an !== name) { o._an = name; o._at = Game.time; } return Game.time - o._at; },   // seconds since animation start
  // draw one frame; x,y = feet position; face = screen-space facing vector. returns false if no sprite loaded
  draw(ctx, name, anim, t, x, y, face, o) {
    const d = CFG.sprites[name], img = Sprites.imgs[name]; if (!d || !img || d.tile) return false;
    o = o || {}; const K = CFG.view.ss;
    const ks = Object.keys(d.anims), ai = Math.max(0, ks.indexOf(anim in d.anims ? anim : 'idle')), A = d.anims[ks[ai]];
    const f = A.loop === false ? Math.min(A.n - 1, Math.floor(t * A.fps)) : Math.floor(t * A.fps) % A.n;
    let row = 0, flip = false;
    if (d.dirs > 1 && face) {
      const k = d.dirs; let i = Math.round((Math.PI / 2 - Math.atan2(face.y, face.x)) / (2 * Math.PI / k)); i = ((i % k) + k) % k;   // 0 = S, then counter-clockwise
      if (d.mirror && i > k / 2) { row = k - i; flip = true; } else row = i;                                                        // W/NW/SW = mirrored E/NE/SE
    }
    const sx = f * d.fw * K, sy = (ai * Sprites.dirRows(d) + row) * d.fh * K, px = Math.round(x * K) / K;
    let src = img, cx = sx, cy = sy;
    if (o.flash) {                                                                   // white hit-flash: tint the frame's opaque pixels
      const c = Sprites.sc || (Sprites.sc = document.createElement('canvas')); c.width = d.fw * K; c.height = d.fh * K;
      const g = c.getContext('2d'); g.drawImage(img, sx, sy, d.fw * K, d.fh * K, 0, 0, d.fw * K, d.fh * K);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, d.fw * K, d.fh * K);
      src = c; cx = 0; cy = 0;
    }
    ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    if (flip) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.translate(-px, 0); }      // mirrored sheets need ax = fw / 2
    ctx.drawImage(src, cx, cy, d.fw * K, d.fh * K, px - d.ax, Math.round(y * K) / K - d.ay, d.fw, d.fh);
    ctx.restore(); return true;
  },
  tile(ctx, name, x, y, cam) {   // floor / wall cell from a tileset (row = biome, column = hash variant)
    const d = CFG.sprites[name], img = Sprites.imgs[name]; if (!img) return false;
    const rows = Math.floor(img.height / (d.fh * CFG.view.ss)), row = Math.min(Math.max(0, CFG.biomes.indexOf(Run.biome)), rows - 1);
    const col = Math.floor(Renderer.hash(x, y, 9) * d.variants), p = Iso.toScreen(x, y, cam);
    const K = CFG.view.ss; ctx.drawImage(img, col * d.fw * K, row * d.fh * K, d.fw * K, d.fh * K, Math.round(p.x - d.ox), Math.round(p.y - d.oy), d.fw, d.fh);
    return true;
  },
  /* persistence of dropped sprites (IndexedDB, fails soft) */
  db(cb) { try { const r = indexedDB.open('zombieWG-sprites', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => cb(r.result); } catch (e) {} },
  put(name, blob) { Sprites.db(d => d.transaction('s', 'readwrite').objectStore('s').put(blob, name)); },
  clear() { Sprites.db(d => d.transaction('s', 'readwrite').objectStore('s').clear()); Sprites.imgs = {}; Sprites.ok = {}; Sprites.note('SPRITES RESET (PROCEDURAL ART)'); },
  init(cv) {
    for (const k in EMBEDDED_ASSETS) Sprites.set(k, EMBEDDED_ASSETS[k]);
    Sprites.db(d => { const q = d.transaction('s').objectStore('s').openCursor(); q.onsuccess = () => { const c = q.result; if (c) { Sprites.set(c.key, URL.createObjectURL(c.value)); c.continue(); } }; });
    cv.addEventListener('dragover', e => e.preventDefault());
    cv.addEventListener('drop', e => {                                  // drop PNGs named like the sprite keys (player.png, walker.png, floor.png, ...)
      e.preventDefault();
      for (const f of e.dataTransfer.files) {
        const name = f.name.replace(/\.[^.]+$/, '').toLowerCase();
        if (!CFG.sprites[name]) { Sprites.note('UNKNOWN SPRITE NAME: ' + name); continue; }
        Sprites.set(name, URL.createObjectURL(f), f);
      }
    });
    Sprites.note('DROP SPRITE PNGS ON THE GAME | G = RESET SPRITES');
  }
};
