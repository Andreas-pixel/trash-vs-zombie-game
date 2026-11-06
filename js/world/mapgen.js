// Trash Vs. Nazi-Zombies - Zufaellige Raeume
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ MAPGEN ============ */
const MapGen = {
  // '#' wall, '.' floor, 'P' spawn (west), 'D' exit (east wall), 'C' container (boss rooms only)
  generate(n, boss) {
    const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    for (let tries = 0; tries < 40; tries++) {
      const w = boss ? 20 : R(14, 18), h = boss ? 14 : R(11, 14);
      const g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? '#' : '.'));
      const sy = R(2, h - 3), dy = R(2, h - 3); g[sy][2] = 'P'; g[dy][w - 1] = 'D';
      if (boss || n % 2 === 0) g[Math.max(1, Math.min(h - 2, dy + (dy < h / 2 ? 2 : -2)))][w - 3] = 'C';   // container next to the exit
      for (let i = boss ? 4 : R(3, 7); i > 0; i--) {                       // random pillar blocks
        const bx = R(5, w - 5), by = R(1, h - 3), sx = R(1, 2), sy2 = R(1, 2);
        for (let y = by; y < by + sy2; y++) for (let x = bx; x < bx + sx; x++) if (g[y] && g[y][x] === '.') g[y][x] = '#';
      }
      if (MapGen.connected(g)) return g.map(r => r.join(''));
    }
    return ROOM_KITCHEN;
  },
  connected(g) {   // flood fill: every non-wall cell (incl. door) must be reachable from spawn
    let sx, sy, total = 0;
    g.forEach((r, y) => r.forEach((c, x) => { if (c === 'P') { sx = x; sy = y; } if (c !== '#') total++; }));
    const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (g[ny] && g[ny][nx] && g[ny][nx] !== '#' && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    return seen.size === total;
  }
};
