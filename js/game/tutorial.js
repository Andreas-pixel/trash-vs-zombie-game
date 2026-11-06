// Trash Vs. Nazi-Zombies - Tutorial (Bad und Kueche)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ TUTORIAL (bathroom: move, dash, pick up trash, fight, deposit, exit) ============ */
const Tut = {
  step: 0, target: null, spawned: false,
  OBJ: ['', 'BEWEGE DICH MIT WASD ZUM LEUCHTKREIS', 'WEICH MIT SPACE AUS (DASH)', 'HEB DEN MÜLL MIT F AUF (2 STÜCK)', 'BESIEGE DEN ZOMBIE: LINKE MAUSTASTE  ·  VON HINTEN +50 %', 'GIB DEN MÜLL AM CONTAINER AB (F)  ·  I: RUCKSACK', 'GEH DURCH DIE TÜR IN DIE KÜCHE'],
  start() {
    Game.mode = 'tut'; Game.ui = null; Story.phase = ''; Story.hidePlayer = false;
    Skills.resetRun(); Skills.apply(); Run.room = 1; Run.boss = false; Run.biome = CFG.biomes[2]; Object.assign(CFG.col, Run.biome.col);
    Room.load(TUT_ROOM); Object.assign(Room.furn, { '3,1': 0, '7,1': 1, '11,2': 2, '3,7': 3, '4,7': 2 });   // vanity, WC, tub, washer, tub
    Run.locked = true; Run.state = 'tut'; Run.trans = null; Combat.reset(); Trash.items = []; Trash.carry = []; Trash.secured = 0;
    Player.spawn(Room.spawn.x, Room.spawn.y); Camera.snap(Player.x, Player.y); Tut.step = 0; Tut.target = null; Tut.spawned = false;
    Dialog.start(STORY.tut.start, () => Tut.go(1));
  },
  go(n) {
    Tut.step = n; Snd.sfx('buy'); Tut.target = null;
    if (n === 1) Tut.target = { x: 7.5, y: 4.5 };
    if (n === 2) Dialog.start(STORY.tut.dash);
    if (n === 3) { Trash.drop(6.5, 5.6, 'bag', 0); Trash.drop(8.6, 3.4, 'bag', 0); Dialog.start(STORY.tut.trash); }
    if (n === 4) Dialog.start(STORY.tut.fight, () => { const e = Abilities.make('walker', 10.4, 4.5, null); e.stun = 0.8; e.cd = 1.6; Tut.spawned = true; });
    if (n === 5) { if (!Trash.carry.length && !Trash.items.length) Trash.drop(Player.x + 0.8, Player.y, 'bag', 0); Dialog.start(STORY.tut.deposit); }
    if (n === 6) { Run.locked = false; Snd.sfx('door'); Dialog.start(STORY.tut.done); }
  },
  update(dt) {
    const P = Player;
    if (P.hp < P.maxHp * 0.5) P.hp = P.maxHp * 0.5;                    // nobody dies in the tutorial
    if (Tut.step === 1 && Math.hypot(P.x - Tut.target.x, P.y - Tut.target.y) < 0.8) Tut.go(2);
    else if (Tut.step === 2 && P.dash.active) Tut.go(3);
    else if (Tut.step === 3 && Trash.weight() >= 2) Tut.go(4);
    else if (Tut.step === 4 && Tut.spawned && !Combat.enemies.length) Tut.go(5);
    else if (Tut.step === 5 && Trash.secured > 0) Tut.go(6);
    else if (Tut.step === 6 && Room.door && Math.floor(P.x) === Room.door.x && Math.floor(P.y) === Room.door.y) { Save.flags.tutBath = true; Save.save(); Run.trans = { phase: 'out', t: 0, to: 'tuthub' }; }
  },
  // kitchen part: fridge (skill tree) -> wardrobe -> weapon rack. hub: 1 go fridge, 2 skill menu open, 3 go wardrobe, 4 wardrobe menu open, 5 go rack, 6 try E, 0 done
  hub: 0, sel0: 0, busy: false,
  HOBJ: { 1: 'GEH ZUM KÜHLSCHRANK', 3: 'GEH ZUR GARDEROBE (LINKS HINTEN)', 5: 'GEH ZUM WAFFENREGAL (RECHTS HINTEN)', 6: 'BLÄTTERE MIT E DURCH DIE WAFFEN' },
  hubBegin() {
    Tut.hub = 1; Tut.busy = true; Tut.target = { x: 8.5, y: 2.5 };
    Dialog.start(STORY.tutHub.intro, () => { Tut.busy = false; });
  },
  near(o) { return o && Math.hypot(o.x - Player.x, o.y - Player.y) < 1.6; },
  hubUpdate() {
    if (Tut.busy || Game.ui) return;
    const H = Tut.hub;
    if (H === 1 && Tut.near(Room.terminal)) { Tut.busy = true; Tut.target = null; Dialog.start(STORY.tutHub.skills, () => { Trash.bank += 6; Save.save(); Tut.busy = false; Tut.hub = 2; Menu.open(2); }); }
    else if (H === 2) { Tut.hub = 3; Tut.target = { x: 5.6, y: 1.6 }; Snd.sfx('buy'); }                 // skill menu was closed
    else if (H === 3 && Tut.near(Room.wardrobe)) { Tut.busy = true; Tut.target = null; Dialog.start(STORY.tutHub.wardrobe, () => { Trash.bank += 4; Save.save(); Tut.busy = false; Tut.hub = 4; Shop.open(); }); }
    else if (H === 4) { Tut.hub = 5; Tut.target = { x: 12.5, y: 2.5 }; Snd.sfx('buy'); }
    else if (H === 5 && Tut.near(Room.rack)) { Tut.busy = true; Tut.target = null; Dialog.start(STORY.tutHub.rack, () => { Tut.busy = false; Tut.hub = 6; Rack.open(); }); }
    else if (H === 6) { Tut.busy = true; Dialog.start(STORY.tutHub.done, () => { Tut.busy = false; Tut.hub = 0; Save.flags.tut = true; Save.save(); Snd.sfx('door'); }); }
  },
  menuHint(ctx) {   // coaching line under the menu while the tutorial opened it
    const t = Tut.hub === 2 ? 'TUTORIAL: KLICK AUF EIN LEUCHTENDES QUADRAT, UM EINE FÄHIGKEIT ZU KAUFEN  ·  ESC: WEITER' : Tut.hub === 4 ? 'TUTORIAL: KLICK AUF EIN TEIL ZUM KAUFEN. LEERE SLOTS ZIEHST DU SOFORT AN  ·  ESC: WEITER' : '';
    if (t) UI.glow(ctx, t, CFG.view.w / 2, CFG.view.h - 11, PAL.uiInteract, 'bold 7px monospace', 'center', 6);
  },
  drawFloor(ctx, cam) {   // pulsing target ring for the movement step (cyan = player)
    if (!Tut.target) return;
    const s = Iso.toScreen(Tut.target.x, Tut.target.y, cam), k = 0.5 + 0.5 * Math.sin(Game.time * 5);
    ctx.save(); ctx.shadowColor = PAL.uiPlayer; ctx.shadowBlur = 12; ctx.strokeStyle = 'rgba(35,227,219,' + (0.5 + 0.4 * k) + ')'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 13 + k * 2, 6.5 + k, 0, 0, 6.3); ctx.stroke(); ctx.restore();
  },
  banner(ctx, txt) {   // current objective, top center
    const W = CFG.view.w, t = txt || Tut.OBJ[Tut.step]; if (!t) return;
    ctx.font = 'bold 8px monospace'; const w = ctx.measureText(t).width + 24;
    UI.box(ctx, W / 2 - w / 2, 48, w, 16, PAL.uiInteract, 'rgba(8,11,18,.9)'); UI.glow(ctx, t, W / 2, 52, PAL.uiInteract, 'bold 8px monospace', 'center', 8);
  }
};
