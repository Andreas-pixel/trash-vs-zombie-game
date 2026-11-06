// Trash Vs. Nazi-Zombies - Kampf, Schadensformel, Gegner-KI
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ COMBAT & ENEMIES ============ */
const Combat = {
  enemies: [], shots: [], pshots: [], corpses: [], blasts: [], hazards: [], ring: null, texts: [], trail: null, clearT: -1,
  reset() { Particles.reset(); Gear.drops = []; Combat.pshots = []; Combat.corpses = []; Combat.blasts = []; Combat.hazards = []; Boss.reset(); Combat.ring = null; Combat.enemies = []; Combat.shots = []; Combat.texts = []; Combat.trail = null; Combat.clearT = -1; },
  // Damage = (Base * (1 + Additive)) * (Crit ? CritMult : 1) * (Backstab ? 1.5 : 1)
  calc(base, add, crit, back) {
    return Math.round(base * (1 + add) * (crit ? CFG.weapon.critMult : 1) * (back ? CFG.weapon.backstabMult + Skills.v('back') : 1));
  },
  text(x, y, s, col, big) { Combat.texts.push({ x, y, s, col, big, t: 0 }); },
  startWave(spec) {
    for (const [type, n, na] of spec) for (let i = 0; i < n; i++) for (let tries = 0; tries < 50; tries++) {
      const x = 1.5 + Math.random() * (Room.w - 3), y = 1.5 + Math.random() * (Room.h - 3);
      if (Room.boxBlocked(x, y, 0.4) || Math.hypot(x - Player.x, y - Player.y) < 5) continue;
      const d = CFG.enemies[type], ang = Math.random() * 6.28, m = Run.hpMul(type);
      Combat.enemies.push({ type, def: d, x, y, radius: d.r, hp: Math.round(d.hp * m), armor: Math.round(d.armor * m), maxHp: Math.round(d.hp * m), maxArmor: Math.round(d.armor * m), ang, face: { x: Math.cos(ang), y: Math.sin(ang) },
        state: d.ranged ? 'kite' : 'chase', t: 0, cd: 1, kx: 0, ky: 0, stun: 0, flashT: 0 });
      Abilities.init(Combat.enemies[Combat.enemies.length - 1], na || 0);
      break;
    }
  },
  // attacker inside the 120deg cone behind the enemy (+-60deg around -facing)
  isBackstab(e, ax, ay) {
    const dx = ax - e.x, dy = ay - e.y, l = Math.hypot(dx, dy) || 1;
    return -(e.face.x * dx + e.face.y * dy) / l >= Math.cos(Math.PI / 3);
  },
  hitEnemy(e, dmg, dx, dy, kb, label, col, big) {
    if (e.phaseLock > 0) { Snd.sfx('clink'); return; }                   // bosses are immune while changing phase
    e.hitAt = Game.time; e.flashT = 1 / 30; Game.hitstop = 0.045; Camera.shake(1.2); Snd.sfx(e.armor > 0 ? 'clink' : label ? 'backstab' : big ? 'crit' : 'hit');
    Particles.burst(e.x, e.y, 8, 7, { col: '#fff3c0', speed: 3.5, up: 30, life: 0.25, size: 1, grav: 0 });                 // hit sparks
    Particles.burst(e.x, e.y, 8, 6, { col: e.def.color, speed: 2.5, up: 50, life: 0.6, size: 2, decal: true });           // ichor
    if (e.armor > 0) {                       // armor absorbs damage, blocks stun + knockback until broken
      e.armor = Math.max(0, e.armor - dmg);
      if (e.armor === 0) { e.stun = 0.8; Camera.shake(3.5); Snd.sfx('break'); Particles.burst(e.x, e.y, 10, 18, { col: '#ffd34a', speed: 4, up: 60, life: 0.5, size: 1, grav: 120 }); Combat.text(e.x, e.y - 0.5, 'ARMOR BREAK', '#ffd34a', true); }
    } else { e.hp -= dmg; if (!e.boss) e.stun = Math.max(e.stun, 0.3); }   // bosses are only staggered by armor breaks / wall crashes
    if (e.armor <= 0) { e.kx = dx * kb * e.def.kbMul; e.ky = dy * kb * e.def.kbMul; }
    Combat.text(e.x, e.y, label + dmg, col, big);
    if (e.hp <= 0) Combat.kill(e);
  },
  kill(e) { e.dead = true; Combat.corpse(e); Gear.maybeDrop(e); Skills.onKill(e); Abilities.onDeath(e); Snd.sfx('kill'); Camera.shake(3); Game.hitstop = 0.07; Trash.maybeDrop(e); Particles.burst(e.x, e.y, 8, 22, { col: e.def.color, speed: 4, up: 70, life: 0.8, size: 2, decal: true }); },
  swingHit(a) {
    const P = Player, W = CFG.weapon;
    for (const e of Combat.enemies) {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 0.001;
      if (d > W.range + e.radius) continue;
      const cos = (dx * a.dir.x + dy * a.dir.y) / d;
      if (Math.acos(Math.max(-1, Math.min(1, cos))) > W.arc * Math.PI / 360) continue;
      const crit = Math.random() < W.critP + Skills.v('crit'), back = Combat.isBackstab(e, P.x, P.y);
      const dmg = Combat.calc(W.base, W.add + Skills.v('dmg') + (a.dashAtk ? W.dashAtkAdd : 0), crit, back);
      Combat.hitEnemy(e, dmg, dx / d, dy / d, W.kb * (a.dashAtk ? 1.4 : 1), back ? 'BACKSTAB ' : '', back ? '#ffd34a' : crit ? '#ff5040' : '#fff', back || crit);
    }
    Combat.trail = { t: 0, dir: a.dir };
  },
  updatePlayer(dt) {
    const P = Player, W = CFG.weapon;
    P.hurtT = Math.max(0, P.hurtT - dt); P.atkCd = Math.max(0, P.atkCd - dt); P.specCd = Math.max(0, P.specCd - dt);
    if (Input.hit('Mouse2') && P.specCd <= 0 && !P.atk && !P.dead) Combat.special();
    if (!P.atk && P.atkCd <= 0 && Input.mouse.l) {
      const w = Iso.vecToWorld(P.aim.x, P.aim.y), l = Math.hypot(w.x, w.y) || 1;     // screen aim -> world dir
      const dashAtk = P.dash.active || Game.time - P.dashEnd < 0.25;                   // dash-attack window
      P.atk = { t: 0, dir: { x: w.x / l, y: w.y / l }, dashAtk, done: false }; P.atkCd = W.cd; Snd.sfx(W.sfx);
      if (dashAtk) { P.kx += P.atk.dir.x * 4; P.ky += P.atk.dir.y * 4; }              // lunge
    }
    if (P.atk) {
      P.atk.t += dt;
      if (!P.atk.done && P.atk.t >= W.windup) { P.atk.done = true; Combat.swingHit(P.atk); }
      if (P.atk.t >= W.dur) P.atk = null;
    }
  },
  special() {   // RMB: weapon-specific special (data in CFG.weapons[id].special)
    const P = Player, S = CFG.weapon.special; if (!S) return;
    P.specCd = S.cd; Camera.shake(3); Snd.sfx('special');
    const base = CFG.weapon.base * S.dmgMul;
    if (S.type === 'throw') {                                           // piercing projectile along the aim direction
      const w = Iso.vecToWorld(P.aim.x, P.aim.y), l = Math.hypot(w.x, w.y) || 1;
      Combat.pshots.push({ x: P.x, y: P.y, ox: P.x, oy: P.y, dx: w.x / l, dy: w.y / l, v: S.speed, left: S.range, dmg: base, hit: new Set() });
      return;
    }
    Combat.ring = { t: 0, x: P.x, y: P.y, r: S.r, type: S.type };         // shockwave / slam: area around the player
    for (const e of Combat.enemies) {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 0.001;
      if (d > S.r + e.radius) continue;
      if (S.type === 'slam') {                                          // extra damage to armor, long stun, no knockback
        Combat.hitEnemy(e, Math.round(base * (e.armor > 0 ? S.armorMul : 1)), dx / d, dy / d, 0, 'SLAM ', '#ffd34a', true);
        if (!e.dead && e.armor <= 0 && !e.boss) e.stun = Math.max(e.stun, S.stun);
      } else Combat.hitEnemy(e, Math.round(base), dx / d, dy / d, S.kb, '', '#fff', false);   // pushes enemies -> wall slams
    }
  },
  updateEnemy(e, dt) {
    const P = Player, def = e.def;
    e.flashT = Math.max(0, e.flashT - dt); e.cd -= dt;
    const spd = Math.hypot(e.kx, e.ky);                                   // knockback + wall slam
    if (spd > 0.2) {
      const r = Room.move(e, e.kx * dt, e.ky * dt);
      if ((r.hitX || r.hitY) && spd > CFG.slam.minSpeed) {
        const dmg = Math.round((CFG.slam.base + CFG.slam.perSpeed * spd) * CFG.weapon.slamMul * (1 + Skills.v('slam')));
        e.hp -= dmg; e.flashT = 1 / 30; e.stun = CFG.slam.stun; e.kx = e.ky = 0;
        Camera.shake(4); Game.hitstop = 0.07; Snd.sfx('slam'); Particles.burst(e.x, e.y, 8, 14, { col: '#9ad8ff', speed: 4, up: 40, life: 0.4, size: 1, grav: 60 }); Combat.text(e.x, e.y, 'WALL SLAM ' + dmg, '#6fd0ff', true);
        if (e.hp <= 0) Combat.kill(e);
      } else { if (r.hitX) e.kx = 0; if (r.hitY) e.ky = 0; }
      const f = Math.exp(-7 * dt); e.kx *= f; e.ky *= f;
    } else e.kx = e.ky = 0;
    if (e.dead) return;
    if (e.stun > 0) { e.stun -= dt; e.ab = null; if (e.bs) { e.bs.st = 'idle'; e.bs.atk = null; e.bs.t = 0.8; } e.state = def.ranged ? 'kite' : 'chase'; return; }
    if (def.burst && !P.dead) {                                          // boss: radial projectile burst
      const B = def.burst; e.bt = (e.bt === undefined ? B.every : e.bt) - dt;
      if (e.bt <= 0) {
        e.bt = B.every; Camera.shake(2); Snd.sfx('burst');
        for (let i = 0; i < B.n; i++) { const a = e.ang + i / B.n * 6.283; Combat.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * B.speed, vy: Math.sin(a) * B.speed, life: 3, dmg: Math.round(B.dmg * Run.dmgMul()) }); }
      }
    }
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 0.001;
    if ((e.state === 'chase' || e.state === 'kite') && !e.ab) {                      // limited turn rate = backstab window
      let diff = Math.atan2(dy, dx) - e.ang; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const m = def.turn * dt; e.ang += Math.max(-m, Math.min(m, diff));
    }
    e.face = { x: Math.cos(e.ang), y: Math.sin(e.ang) };
    if (P.dead) return;
    if (e.boss) { Boss.update(e, dt, dx, dy, d); return; }              // boss pattern machine replaces the normal AI
    if (Abilities.update(e, dt, dx, dy, d)) return;                     // special abilities take over while active
    const step = (ux, uy, sp) => {                                        // move + separation from other enemies
      let sx = ux, sy = uy;
      for (const o of Combat.enemies) if (o !== e && !o.dead) {
        const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy);
        if (od < 0.7 && od > 0.001) { sx += ox / od * 0.8; sy += oy / od * 0.8; }
      }
      const l = Math.hypot(sx, sy) || 1; Room.move(e, sx / l * sp * dt, sy / l * sp * dt);
    };
    if (def.melee) {
      const m = def.melee;
      if (e.state === 'chase') {
        step(dx / d, dy / d, Abilities.speed(e));
        if (d <= m.range + 0.15 && e.cd <= 0) { e.state = 'windup'; e.t = m.windup * Abilities.windMul(e); Snd.sfx('tell'); }
      } else if (e.state === 'windup') {
        e.t -= dt;
        if (e.t <= 0) {
          if (d <= m.range + P.radius + 0.1) Abilities.strike(e, m.dmg);
          e.state = 'recover'; e.t = m.rec; e.cd = m.cd; Camera.shake(0.8);
        }
      } else { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
    } else {
      const r = def.ranged;
      if (e.state === 'kite') {
        if (d < r.min) step(-dx / d, -dy / d, Abilities.speed(e)); else if (d > r.max) step(dx / d, dy / d, Abilities.speed(e));
        if (d <= r.max + 1 && e.cd <= 0) { e.state = 'windup'; e.t = r.windup; Snd.sfx('tell'); }
      } else if (e.state === 'windup') {
        e.t -= dt;
        if (e.t <= 0) {
          Abilities.fire(e, r);
          e.state = 'recover'; e.t = 0.35; e.cd = r.cd;
        }
      } else { e.t -= dt; if (e.t <= 0) e.state = 'kite'; }
    }
  },
  update(dt) {
    for (const e of Combat.enemies) Combat.updateEnemy(e, dt);
    Combat.enemies = Combat.enemies.filter(e => !e.dead);
    for (const s of Combat.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (Room.solid(s.x, s.y)) s.life = 0;
      else if (Math.hypot(s.x - Player.x, s.y - Player.y) < Player.radius + 0.12 && Player.hurt(s.dmg, s.x - s.vx * 0.1, s.y - s.vy * 0.1)) s.life = 0;
    }
    Combat.shots = Combat.shots.filter(s => s.life > 0);
    for (const q of Combat.pshots) {                                       // thrown knives pierce every enemy once
      const st = q.v * dt; q.x += q.dx * st; q.y += q.dy * st; q.left -= st;
      if (Room.solid(q.x, q.y)) q.left = 0;
      for (const e of Combat.enemies) if (!q.hit.has(e) && Math.hypot(e.x - q.x, e.y - q.y) < e.radius + 0.2) {
        q.hit.add(e); const back = Combat.isBackstab(e, q.ox, q.oy);
        Combat.hitEnemy(e, Combat.calc(q.dmg, Skills.v('dmg'), false, back), q.dx, q.dy, 4, back ? 'BACKSTAB ' : '', back ? '#ffd34a' : '#fff', back);
      }
    }
    Combat.pshots = Combat.pshots.filter(q => q.left > 0);
    Abilities.updateBlasts(dt); Boss.updateHazards(dt);
    if (Combat.ring) { Combat.ring.t += dt; if (Combat.ring.t > 0.25) Combat.ring = null; }
    Combat.corpses = Combat.corpses.filter(c => Game.time - c.t0 < 4);
    for (const t of Combat.texts) t.t += dt;
    Combat.texts = Combat.texts.filter(t => t.t < 0.8);
    if (Combat.trail) { Combat.trail.t += dt; if (Combat.trail.t > 0.18) Combat.trail = null; }
    if (!Combat.enemies.length && Run.state === 'fight' && !Run.trans) Run.cleared();   // room cleared -> door opens
  },
  /* ---- drawing ---- */
  drawEnemy(ctx, e, cam) {
    const s = Iso.toScreen(e.x, e.y, cam), x = Math.round(s.x), y = Math.round(s.y), sname = e.bd && e.bd.final ? 'boss_final' : e.type, boss = e.type === 'boss', big = e.type === 'brute' || e.type === 'bloater', h = Sprites.ok[sname] ? CFG.sprites[sname].bar : boss ? 26 : big ? 18 : 14, hw = boss ? 9 : big ? 6 : 5;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(x, y, hw + 2, 3.5, 0, 0, 7); ctx.fill();
    const bob = (e.state === 'chase' || e.state === 'kite') ? Math.round(Math.abs(Math.sin(Game.time * 8 + e.x * 3)) * 1.5) * (Sprites.ok[e.type] ? 0 : 1) : 0;
    ctx.save(); ctx.translate(0, -bob);   // walk bob
    const an = e.stun > 0 ? 'hurt' : e.state === 'windup' ? 'windup' : e.state === 'recover' ? 'attack' : (e.state === 'chase' || e.state === 'kite') ? 'walk' : 'idle';
    const spr = Sprites.draw(ctx, sname, an, Sprites.track(e, an), x, y, { x: e.face.x - e.face.y, y: (e.face.x + e.face.y) * 0.5 }, { flash: e.flashT > 0 });
    let col = e.def.color;
    if (e.flashT > 0) col = '#fff';                                                  // 1-frame white hit-flash
    else if (e.state === 'windup') col = (Math.floor(Game.time * 30) % 2) ? '#ff3030' : col;
    if (!spr) {
    ctx.fillStyle = CFG.col.outline; ctx.fillRect(x - hw - 1, y - h - 1, hw * 2 + 2, h + 1);
    ctx.fillStyle = col; ctx.fillRect(x - hw, y - h, hw * 2, h - 1);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - hw, y - h, hw * 2, 3);
    const fx = e.face.x - e.face.y, fy = (e.face.x + e.face.y) * 0.5, fl = Math.hypot(fx, fy) || 1;   // eyes follow facing
    ctx.fillStyle = '#ff2a2a'; ctx.fillRect(Math.round(x + fx / fl * 3) - 1, Math.round(y - h + 4 + fy / fl * 2), 2, 2);
    }
    if (e.elite) { ctx.strokeStyle = PAL.uiEnemy; ctx.strokeRect(x - hw - 2.5, y - h - 2.5, hw * 2 + 5, h + 3); }   // elite frame
    const bw = 16, bx = x - 8; let by = y - h - 5;
    ctx.fillStyle = PAL.ink; ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = '#2a1640'; ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = PAL.uiEnemy; ctx.fillRect(bx, by, bw * Math.max(0, e.hp) / def_hp(e), 2);
    if (e.armor > 0) {                                                                // yellow armor bar (stun immunity), with shield notch as a shape cue
      by -= 4; ctx.fillStyle = PAL.ink; ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
      ctx.fillStyle = PAL.uiArmor; ctx.fillRect(bx, by, bw * e.armor / e.maxArmor, 2);
      ctx.fillStyle = PAL.ink; for (let i = 1; i < 4; i++) ctx.fillRect(bx + bw * i / 4, by, 0.6, 2);
    }
    if (e.state === 'windup') { ctx.fillStyle = '#ff3030'; ctx.fillRect(x - 1, y - h - 18, 2, 5); ctx.fillRect(x - 1, y - h - 12, 2, 2); }
    if (e.elite) Trash.label(ctx, x, y - h - (e.armor > 0 ? 18 : 14), e.tag, PAL.uiEnemy);
    ctx.restore();  // "!" telegraph
  },
  drawShot(ctx, s, cam) {
    const p = Iso.toScreen(s.x, s.y, cam), x = Math.round(p.x), y = Math.round(p.y) - 8;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#ff9a3a'; ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 2, 2);
  },
  drawFx(ctx, cam) {                                                                  // weapon trail (sweeping arc)
    const T = Combat.trail; if (!T) return;
    const W = CFG.weapon, a0 = Math.atan2(T.dir.y, T.dir.x), half = W.arc * Math.PI / 360, k = 1 - T.t / 0.18, pts = [];
    const end = -half + 2 * half * Math.min(1, T.t / 0.08);
    const pt = (a, r) => { const p = Iso.toScreen(Player.x + Math.cos(a0 + a) * r, Player.y + Math.sin(a0 + a) * r, cam); return [Math.round(p.x), Math.round(p.y - 8)]; };
    for (let i = 0; i <= 10; i++) pts.push(pt(-half + (end + half) * i / 10, W.range));
    for (let i = 10; i >= 0; i--) pts.push(pt(-half + (end + half) * i / 10, W.range * 0.45));
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.fillStyle = 'rgba(' + W.trail + ',' + (0.75 * k) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,' + (0.6 * k) + ')'; ctx.stroke();
  },
  corpse(e) { if (Sprites.ok[e.type]) Combat.corpses.push({ type: e.type, x: e.x, y: e.y, face: { x: e.face.x - e.face.y, y: (e.face.x + e.face.y) * 0.5 }, t0: Game.time }); },
  drawCorpse(ctx, c, cam) {   // 'die' animation, holds the last frame, fades out after 3s
    const p = Iso.toScreen(c.x, c.y, cam), age = Game.time - c.t0;
    Sprites.draw(ctx, c.type, 'die', age, p.x, p.y, c.face, { alpha: Math.max(0, Math.min(1, 4 - age)) });
  },
  drawRing(ctx, cam) {
    const R = Combat.ring; if (!R) return; const k = R.t / 0.25, r = R.r * (0.3 + 0.7 * k);
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.283, p = Iso.toScreen(R.x + Math.cos(a) * r, R.y + Math.sin(a) * r, cam); i ? ctx.lineTo(Math.round(p.x), Math.round(p.y)) : ctx.moveTo(Math.round(p.x), Math.round(p.y)); }
    ctx.strokeStyle = (R.type === 'slam' ? 'rgba(255,210,90,' : 'rgba(255,255,255,') + (1 - k) + ')'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
  },
  drawKnife(ctx, q, cam) {
    const p = Iso.toScreen(q.x, q.y, cam), x = Math.round(p.x), y = Math.round(p.y) - 8;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 2, 7, 4); ctx.fillStyle = '#e8f0f6'; ctx.fillRect(x - 2, y - 1, 5, 2);
  },
  drawText(ctx, cam) {
    if (Player.dead && Game.mode === 'run') return;   // the death screen owns the center of the screen
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const t of Combat.texts) {
      ctx.font = (t.big ? 'bold ' : '') + '8px monospace';
      const p = Iso.toScreen(t.x, t.y, cam), x = Math.round(p.x), y = Math.round(p.y - 22 - t.t * 22);
      ctx.fillStyle = '#000'; ctx.fillText(t.s, x + 1, y + 1); ctx.fillStyle = t.col; ctx.fillText(t.s, x, y);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  }
};
const def_hp = e => e.maxHp;
