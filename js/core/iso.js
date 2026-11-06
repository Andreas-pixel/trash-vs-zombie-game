// Trash Vs. Nazi-Zombies - Isometrische Projektion (Welt <-> Bildschirm)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ ISO MATH ============ */
const Iso = {
  // world (tile units) -> unscrolled projected px
  proj(wx, wy) { return { x: (wx - wy) * CFG.tile.w / 2, y: (wx + wy) * CFG.tile.h / 2 }; },
  // screen px delta -> world delta (inverse of proj)
  vecToWorld(sx, sy) {
    const a = sx / (CFG.tile.w / 2), b = sy / (CFG.tile.h / 2);
    return { x: (a + b) / 2, y: (b - a) / 2 };
  },
  // world -> view px: screenX = (wx-wy)*tw/2 + viewCenterX (minus camera)
  toScreen(wx, wy, cam) {
    const p = Iso.proj(wx, wy);
    return { x: p.x + CFG.view.w / 2 - cam.x, y: p.y + CFG.view.h / 2 - cam.y };
  },
  toWorld(sx, sy, cam) {
    return Iso.vecToWorld(sx - CFG.view.w / 2 + cam.x, sy - CFG.view.h / 2 + cam.y);
  }
};
