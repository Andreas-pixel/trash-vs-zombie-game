// Trash Vs. Nazi-Zombies - Raum laden, Kollision
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ ROOM / MAP ============ */
const Room = {
  w: 0, h: 0, tiles: [], containers: [], spawn: { x: 2, y: 2 },
  load(layout) {
    Room.h = layout.length; Room.w = layout[0].length; Room.tiles = []; Room.containers = []; Room.terminal = null; Room.rack = null; Room.wardrobe = null; Room.door = null;
    for (let y = 0; y < Room.h; y++) {
      Room.tiles[y] = [];
      for (let x = 0; x < Room.w; x++) {
        const ch = layout[y][x];
        Room.tiles[y][x] = ch === '#' ? 1 : ch === 'D' ? 2 : 0;   // 1 wall, 2 exit door
        if (ch === 'P') Room.spawn = { x: x + 0.5, y: y + 0.5 };
        if (ch === 'D') Room.door = { x, y };
        if (ch === 'T') Room.terminal = { x: x + 0.5, y: y + 0.5 };
        if (ch === 'W') Room.rack = { x: x + 0.5, y: y + 0.5 };
        if (ch === 'G') Room.wardrobe = { x: x + 0.5, y: y + 0.5 };
        if (ch === 'C') Room.containers.push({ x: x + 0.5, y: y + 0.5 });   // trash container
      }
    }
    Env.prepare();                                                        // furniture, wall decor, neon signs, floor decor
  },
  solid(x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    return tx < 0 || ty < 0 || tx >= Room.w || ty >= Room.h || Room.tiles[ty][tx] === 1 || (Room.tiles[ty][tx] === 2 && Run.locked);
  },
  boxBlocked(x, y, r) {
    return Room.solid(x - r, y - r) || Room.solid(x + r, y - r) || Room.solid(x - r, y + r) || Room.solid(x + r, y + r);
  },
  // axis-separated movement with wall collision; returns {hitX, hitY} (used later for Wall Slam)
  move(ent, dx, dy) {
    const r = ent.radius, res = { hitX: false, hitY: false };
    if (!Room.boxBlocked(ent.x + dx, ent.y, r)) ent.x += dx; else res.hitX = true;
    if (!Room.boxBlocked(ent.x, ent.y + dy, r)) ent.y += dy; else res.hitY = true;
    return res;
  }
};
