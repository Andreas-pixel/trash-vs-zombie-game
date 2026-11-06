// Trash Vs. Nazi-Zombies - Spielschleife und Start
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ GAME LOOP (fixed timestep) ============ */
const Game = {
  debug: false, mode: 'boot', ui: null, time: 0, hitstop: 0, acc: 0, last: 0, fps: 0, fpsN: 0, fpsT: 0,
  init() {
    const cv = document.getElementById('c');
    Renderer.init(cv); Input.init(cv); Sprites.init(cv); Paint.init();
    ['keydown', 'mousedown'].forEach(ev => addEventListener(ev, () => Snd.init()));   // browsers need a user gesture for audio
    Save.load(); Hub.enter(); UI.init(); Game.ui = 'title'; Combat.texts = [];
    requestAnimationFrame(t => { Game.last = t; requestAnimationFrame(Game.tick); });
  },
  update(dt) {
    if (Input.hit('F3')) Game.debug = !Game.debug;
    if (Input.hit('KeyM')) Snd.toggle();
    if (Input.hit('KeyG')) Sprites.clear();
    Snd.update();
    if (Input.hit('KeyR') && Game.mode === 'run' && !Run.trans && !Game.ui) { Trash.onDeath(); Run.trans = { phase: 'out', t: 0, to: 'hub' }; }   // abandon run
    if (Game.hitstop > 0) {                                  // hit-stop: brief freeze on impact
      Game.hitstop -= dt; Input.pressed.delete('F3'); Input.pressed.delete('KeyR'); Camera.update(dt, Player); return;
    }
    Game.time += dt;
    if (!Game.ui && Input.hit('KeyI', 'Tab', 'KeyC', 'KeyK') && !Run.trans && !Player.dead) Menu.open(Input.hit('KeyC') ? 0 : Input.hit('KeyK') ? 2 : Menu.last);
    if (!Game.ui && Input.hit('Escape') && !Run.trans && !Player.dead) { Game.ui = 'pause'; UI.sel = 0; Input.pressed.delete('Escape'); Snd.sfx('ui'); }
    if (Game.ui) { UI.update(); Input.endFrame(); return; }   // menus, pause and title pause the world
    Run.update(dt);
    if (Run.trans) { Camera.update(dt, Player); Input.endFrame(); return; }   // world frozen during room transition
    if (Game.mode === 'roof') Roof.tick(dt);
    Player.update(dt); Combat.update(dt); Trash.update(dt); Gear.update(dt); Particles.update(dt); Camera.update(dt, Player); Input.endFrame();
  },
  tick(t) {
    const STEP = 1 / 60;
    Game.acc = Math.min(Game.acc + (t - Game.last) / 1000, 0.25); Game.last = t;
    while (Game.acc >= STEP) { Game.update(STEP); Game.acc -= STEP; }
    Game.fpsN++; Game.fpsT += 1 / 60 * 0 + 0;
    if (!Game.fpsStart) Game.fpsStart = t;
    if (t - Game.fpsStart >= 500) { Game.fps = Math.round(Game.fpsN * 1000 / (t - Game.fpsStart)); Game.fpsN = 0; Game.fpsStart = t; }
    Renderer.frame(Game.fps, Game.debug);
    requestAnimationFrame(Game.tick);
  }
};
Game.init();
