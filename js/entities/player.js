// Trash Vs. Nazi-Zombies - Spielfigur: Bewegung, Dash, Treffer
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ PLAYER ============ */
const Player = {
  x: 0, y: 0, radius: CFG.player.radius, aim: { x: 1, y: 0 }, moving: false,
  dash: { active: false, t: 0, cd: 0, dir: { x: 1, y: 0 }, ghostT: 0 },
  invuln: false, flashT: 0, ghosts: [],
  hp: 100, maxHp: 100, look: 'coole', specCd: 0, hurtT: 0, atk: null, atkCd: 0, dashEnd: -9, kx: 0, ky: 0, dead: false,
  spawn(x, y) { Player.x = x; Player.y = y; Player.ghosts.length = 0; Player.dash.active = false; Player.dash.cd = 0;
    Player.hp = Player.maxHp; Player.dead = false; Player.atk = null; Player.kx = Player.ky = 0; Player.hurtT = 0; Player.specCd = 0; },
  // returns true if damage landed; dash I-frames and post-hit I-frames negate it
  hurt(dmg, fx, fy) {
    if (Player.dead || Player.invuln || Player.hurtT > 0) return false;
    dmg = Math.max(1, Math.round(dmg * (1 - Gear.reduction())));   // armor
    Run.dmg += dmg; Player.hp -= dmg; Player.hurtT = CFG.hurt.iframes; Player.flashT = 1 / 30; Trash.hurtDrop();
    const dx = Player.x - fx, dy = Player.y - fy, l = Math.hypot(dx, dy) || 1;
    Player.kx = dx / l * CFG.hurt.kb; Player.ky = dy / l * CFG.hurt.kb;
    Camera.shake(3); Game.hitstop = 0.05; Snd.sfx('hurt'); Particles.burst(Player.x, Player.y, 8, 10, { col: '#c0202c', speed: 3, up: 50, life: 0.5, size: 2, decal: true }); Combat.text(Player.x, Player.y, '-' + dmg, '#ff7080', false);
    if (Player.hp <= 0) { Player.dead = true; Snd.sfx('death'); Player.hp = 0; Player.atk = null; Trash.onDeath(); }
    return true;
  },
  update(dt) {
    if (Player.dead) { Player.flashT = Math.max(0, Player.flashT - dt); return; }
    const D = Player.dash, mv = Input.moveVec();
    Player.moving = !!(mv.x || mv.y);
    // aim direction in screen space (player screen pos -> mouse)
    const sp = Iso.toScreen(Player.x, Player.y, Camera), ax = Input.mouse.x - sp.x, ay = Input.mouse.y - (sp.y - 8), al = Math.hypot(ax, ay);
    if (al > 2) Player.aim = { x: ax / al, y: ay / al };

    D.cd = Math.max(0, D.cd - dt);
    if (!D.active && D.cd <= 0 && Input.hit('Space', 'ShiftLeft', 'ShiftRight')) {
      D.active = true; D.t = 0; D.ghostT = 0; D.cd = Skills.dashCd(); Snd.sfx('dash'); Particles.puff(Player.x, Player.y, 8);
      D.dir = Player.moving ? mv : Player.aim;                   // dash toward input, else aim
      Camera.shake(1.5);
    }
    let vx = 0, vy = 0;
    if (D.active) {
      D.t += dt;
      vx = D.dir.x * CFG.dash.speed; vy = D.dir.y * CFG.dash.speed;
      D.ghostT -= dt;
      if (D.ghostT <= 0) { D.ghostT = CFG.dash.ghostEvery; Player.ghosts.push({ x: Player.x, y: Player.y, a: 0.55 }); }
      if (D.t >= CFG.dash.dur) { D.active = false; Player.dashEnd = Game.time; }
    } else {
      const sm = Player.atk ? CFG.weapon.moveMul : 1;   // slowed while swinging
      const tm = Trash.speedMul() * (1 + Skills.v('speed'));                       // carrying trash slows movement only (not dash/attack)
      vx = mv.x * CFG.player.speed * sm * tm; vy = mv.y * CFG.player.speed * sm * tm;
    }
    Player.invuln = D.active && D.t < CFG.dash.iframes + Skills.v('iframe');          // I-frames: first 0.14s of dash
    const w = Iso.vecToWorld(vx * dt, vy * dt);                  // screen px -> world tiles
    const hit = Room.move(Player, w.x, w.y);
    if (D.active && (hit.hitX || hit.hitY) && D.t > 0.04) D.active = false;  // dash ends on wall
    if (Math.hypot(Player.kx, Player.ky) > 0.1) {                            // knockback / lunge velocity
      Room.move(Player, Player.kx * dt, Player.ky * dt);
      const f = Math.exp(-9 * dt); Player.kx *= f; Player.ky *= f;
    } else Player.kx = Player.ky = 0;
    Combat.updatePlayer(dt);
    for (const g of Player.ghosts) g.a -= dt * 3.2;
    Player.ghosts = Player.ghosts.filter(g => g.a > 0);
    Player.flashT = Math.max(0, Player.flashT - dt);
  }
};
