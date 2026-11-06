// Trash Vs. Nazi-Zombies - WG-Kueche (Hub), NPCs, Props
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ HUB (WG-Kueche = start + respawn "Pool of Styx") ============ */
const Hub = {
  nearT: false, nearR: false, nearW: false, sel: 0,
  enter() {
    const fromRun = Game.mode === 'run';
    Game.mode = 'hub'; Game.ui = null; Skills.resetRun(); Skills.apply();
    Trash.bank += Trash.secured; Trash.secured = 0; Trash.carry = []; Trash.items = [];          // secured trash becomes currency; carried is gone
    if (fromRun) {
      Save.stats.bestRoom = Math.max(Save.stats.bestRoom, Run.room);
      const L = Run.log, n = L.length || 1;
      Run.last = 'LETZTER RUN: ' + Run.room + ' RAEUME | SCHNITT ' + Math.round(L.reduce((a, r) => a + r.t, 0) / n) + 's | SCHADEN ' + Math.round(L.reduce((a, r) => a + r.dmg, 0) / n) + ' HP';
    }
    Save.save();
    Object.assign(CFG.col, CFG.biomes[0].col); Room.load(ROOM_KITCHEN);
    Hub.sel = Weapons.ids.indexOf(Weapons.cur);
    Run.locked = false; Run.state = 'hub'; Run.boss = false; Run.biome = CFG.biomes[0]; Run.deadT = 0;
    Player.spawn(Room.spawn.x, Room.spawn.y); Camera.snap(Player.x, Player.y); Combat.reset();
    Combat.text(Player.x, Player.y - 0.5, 'WG-KUECHE', '#ffd34a', true);
  },
  update() {
    Hub.nearN = null; for (const n of Hub.npcs()) if (Math.hypot(n.x - Player.x, n.y - Player.y) < 1.4) Hub.nearN = n;
    if (Hub.nearN && Input.hit('KeyF', 'KeyE')) { Story.talk(Hub.nearN.n); return; }
    const T = Room.terminal, D = Room.door;
    Hub.nearT = !!T && Math.hypot(T.x - Player.x, T.y - Player.y) < 1.6;
    if (Hub.nearT && Input.hit('KeyF', 'KeyE')) Menu.open(2);
    Hub.nearW = !!Room.wardrobe && Math.hypot(Room.wardrobe.x - Player.x, Room.wardrobe.y - Player.y) < 1.6;
    if (Hub.nearW && Input.hit('KeyF', 'KeyE')) Shop.open();
    Hub.nearR = !!Room.rack && Math.hypot(Room.rack.x - Player.x, Room.rack.y - Player.y) < 1.6;
    if (Hub.nearR && Input.hit('KeyF', 'KeyE')) Rack.open();               // weapon rack: overview of all weapons
    if (D && Math.floor(Player.x) === D.x && Math.floor(Player.y) === D.y) Run.trans = { phase: 'out', t: 0, to: 'run' };
  },
  drawTerminal(ctx, cam) {                                                 // fridge = skill terminal
    const s = Iso.toScreen(Room.terminal.x, Room.terminal.y, cam), x = Math.round(s.x), y = Math.round(s.y);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 10, 4, 0, 0, 7); ctx.fill();
    if (!Sprites.draw(ctx, 'terminal', 'idle', Game.time, x, y, null)) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 8, y - 26, 16, 26); ctx.fillStyle = '#9aa4ac'; ctx.fillRect(x - 7, y - 25, 14, 24);
    ctx.fillStyle = '#c8d0d6'; ctx.fillRect(x - 7, y - 25, 14, 3); ctx.fillStyle = '#000'; ctx.fillRect(x - 7, y - 15, 14, 1); ctx.fillRect(x + 4, y - 22, 1, 5);
    ctx.fillStyle = (Math.floor(Game.time * 3) % 2) ? '#6fd0ff' : '#3a90b0'; ctx.fillRect(x - 5, y - 12, 8, 5);
    }
    if (Hub.nearT) Trash.label(ctx, x, y - 38, 'F: SKILLS', PAL.uiInteract);
  },
  drawRack(ctx, cam) {
    const s = Iso.toScreen(Room.rack.x, Room.rack.y, cam), x = Math.round(s.x), y = Math.round(s.y);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 4, 0, 0, 7); ctx.fill();
    if (!Sprites.draw(ctx, 'rack', 'idle', Game.time, x, y, null)) {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 11, y - 24, 22, 24); ctx.fillStyle = '#5a4028'; ctx.fillRect(x - 10, y - 23, 20, 22);
    ctx.fillStyle = '#c8b080'; ctx.fillRect(x - 7, y - 20, 2, 14); ctx.fillStyle = '#8a6a40'; ctx.fillRect(x - 8, y - 7, 4, 4);        // broom
    ctx.fillStyle = '#444'; ctx.beginPath(); ctx.ellipse(x + 1, y - 12, 3.5, 3, 0, 0, 7); ctx.fill(); ctx.fillRect(x + 3, y - 13, 6, 2);   // pan
    ctx.fillStyle = '#c8d0d6'; ctx.fillRect(x + 8, y - 21, 1, 8);
    }                                                                       // knife
    if (Hub.nearR) Trash.label(ctx, x, y - 38, 'F: WAFFENREGAL', PAL.uiInteract);
  },
  npcs() {   // the two residents you did not pick hang out in the kitchen (all three during the intro)
    if (Game.mode !== 'hub') return [];
    if (Story.phase === 'intro' || Game.ui === 'select') return Paint.NAMES.map((n, i) => ({ n, x: [6.6, 9, 11.4][i], y: [4.6, 3.7, 4.6][i] }));
    return Paint.NAMES.filter(n => n !== Player.look).map((n, i) => ({ n, x: [6.6, 11.4][i], y: 4.6 }));
  },
  drawNpc(ctx, n, cam) {
    const s = Iso.toScreen(n.x, n.y, cam), p = Iso.toScreen(Player.x, Player.y, cam), x = Math.round(s.x), y = Math.round(s.y);
    const face = Story.phase === 'intro' ? { x: 0, y: 1 } : { x: p.x - s.x, y: p.y - s.y + 0.01 };
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3.5, 0, 0, 7); ctx.fill();
    Sprites.draw(ctx, 'player_' + n.n, 'idle', Game.time + n.x, x, y, face, {});
    if (Hub.nearN === n && !Game.ui) Trash.label(ctx, x, y - 34, 'F: REDEN', PAL.uiInteract);
  },
  drawWardrobe(ctx, cam) {
    const s = Iso.toScreen(Room.wardrobe.x, Room.wardrobe.y, cam), x = Math.round(s.x), y = Math.round(s.y);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 4, 0, 0, 7); ctx.fill();
    Sprites.draw(ctx, 'wardrobe', 'idle', Game.time, x, y, null);
    if (Hub.nearW) Trash.label(ctx, x, y - 41, 'F: GARDEROBE', PAL.uiInteract);
  },
  drawDoorLabel(ctx, cam) { const s = Iso.toScreen(Room.door.x + 0.5, Room.door.y + 0.5, cam); Trash.label(ctx, Math.round(s.x), Math.round(s.y) - 14, 'RUN STARTEN >>', PAL.uiInteract); }
};
