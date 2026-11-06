// Trash Vs. Nazi-Zombies - Tastatur und Maus
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ INPUT ============ */
const Input = {
  keys: new Set(), pressed: new Set(), wheel: 0, mouse: { x: CFG.view.w / 2, y: CFG.view.h / 2, l: false, r: false },
  init(canvas) {
    addEventListener('keydown', e => {
      if (!e.repeat) Input.pressed.add(e.code);
      Input.keys.add(e.code);
      if (['Space','ArrowUp','ArrowDown','Tab'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => Input.keys.delete(e.code));
    addEventListener('blur', () => Input.keys.clear());
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      Input.mouse.x = (e.clientX - r.left) * CFG.view.w / r.width;
      Input.mouse.y = (e.clientY - r.top) * CFG.view.h / r.height;
    });
    canvas.addEventListener('mousedown', e => { if (e.button === 0) { Input.mouse.l = true; Input.pressed.add('Mouse0'); } if (e.button === 2) { Input.mouse.r = true; Input.pressed.add('Mouse2'); } });
    addEventListener('mouseup', e => { if (e.button === 0) Input.mouse.l = false; if (e.button === 2) Input.mouse.r = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { Input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  },
  down(c) { return Input.keys.has(c); },
  hit(...codes) { return codes.some(c => Input.pressed.has(c)); },
  endFrame() { Input.pressed.clear(); Input.wheel = 0; },
  // screen-space move vector (W = screen-up), normalized
  moveVec() {
    let x = (Input.down('KeyD') ? 1 : 0) - (Input.down('KeyA') ? 1 : 0);
    let y = (Input.down('KeyS') ? 1 : 0) - (Input.down('KeyW') ? 1 : 0);
    const l = Math.hypot(x, y);
    return l ? { x: x / l, y: y / l } : { x: 0, y: 0 };
  }
};
