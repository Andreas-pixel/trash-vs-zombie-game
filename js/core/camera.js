// Trash Vs. Nazi-Zombies - Kamera mit Lerp und Shake
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ CAMERA ============ */
const Camera = {
  x: 0, y: 0, shakeMag: 0, ox: 0, oy: 0,
  snap(wx, wy) { const p = Iso.proj(wx, wy); Camera.x = p.x; Camera.y = p.y; },
  shake(mag) { Camera.shakeMag = Math.max(Camera.shakeMag, mag * (UI.shakeFull ? 1 : 0.3)); },   // reduced option in the pause menu
  update(dt, target) {
    const p = Iso.proj(target.x, target.y), m = Input.mouse;
    const tx = p.x + (m.x - CFG.view.w / 2) * CFG.cam.look;      // look-ahead toward mouse
    const ty = p.y + (m.y - CFG.view.h / 2) * CFG.cam.look;
    const k = 1 - Math.exp(-CFG.cam.lerp * dt);                   // frame-rate independent lerp
    Camera.x += (tx - Camera.x) * k; Camera.y += (ty - Camera.y) * k;
    Camera.shakeMag *= Math.exp(-CFG.cam.shakeDecay * dt);        // exponential decay
    if (Camera.shakeMag < 0.05) Camera.shakeMag = 0;
    Camera.ox = (Math.random() * 2 - 1) * Camera.shakeMag;
    Camera.oy = (Math.random() * 2 - 1) * Camera.shakeMag;
  },
  // final integer view position (pixel-perfect)
  view() { return { x: Math.round(Camera.x + Camera.ox), y: Math.round(Camera.y + Camera.oy) }; }
};
