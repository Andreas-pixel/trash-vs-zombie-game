// Trash Vs. Nazi-Zombies - Skilltree und Erfahrung
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ SKILLTREE (one tree, 4 branches; permanent nodes cost trash, run nodes cost SP) ============ */
const Skills = {
  levels: {}, run: {}, xp: 0, level: 1, sp: 0, pan: { x: 0, y: 0 }, zoom: 1, hover: null, drag: null,
  SX: 64, SY: 31, CX: 240, CY: 136, BR: { combat: '#e0605a', move: '#5ab0e0', carry: '#9fe070', surv: '#e0c050' },
  BN: { combat: 'KAMPF', move: 'BEWEGUNG', carry: 'TRANSPORT', surv: 'UEBERLEBEN' },
  node(id) { return CFG.skills.find(k => k.id === id); },
  lvOf(k) { return (k.kind === 'run' ? Skills.run[k.id] : Skills.levels[k.id]) || 0; },
  lv(id) { const k = Skills.node(id); return k ? Skills.lvOf(k) : 0; },
  v(stat) { let t = Gear.stat(stat); for (const k of CFG.skills) if (k.stat === stat) t += Skills.lvOf(k) * k.per; return t; },   // tree + gear
  dashCd() { return CFG.dash.cd * Math.max(0.3, 1 - Skills.v('dash')); },
  apply() { Player.maxHp = 100 + Skills.v('hp'); },
  price(k, l) { return k.kind === 'run' ? k.cost[l] + l : Math.round(k.cost[l] * CFG.skillCostMul); },
  locked(k) { return !!k.req && k.req.some(r => Skills.lv(r[0]) < r[1]); },
  need() { return CFG.xp.base + CFG.xp.grow * (Skills.level - 1); },
  resetRun() { Skills.run = {}; Skills.xp = 0; Skills.level = 1; Skills.sp = 0; },
  gainXp(n) {   // XP only counts inside a run; every level = 1 skill point
    if (Game.mode !== 'run') return;
    Skills.xp += n;
    while (Skills.xp >= Skills.need()) {
      Skills.xp -= Skills.need(); Skills.level++; Skills.sp++; Snd.sfx('door');
      Combat.text(Player.x, Player.y - 0.8, 'LEVEL UP!  [K]', '#4fd0ff', true);
      Particles.burst(Player.x, Player.y, 8, 16, { col: '#4fd0ff', speed: 3, up: 70, life: 0.6, size: 1, grav: 60 });
    }
  },
  onKill(e) {
    Skills.gainXp((CFG.xp[e.type] || 8) * (e.elite ? 2 : 1));
    const h = Skills.v('vamp'); if (h > 0 && Game.mode === 'run' && !Player.dead) Player.hp = Math.min(Player.maxHp, Player.hp + h);
  },
  status(k) {
    const l = Skills.lvOf(k); if (l >= k.max) return { can: false, why: 'MAX' };
    if (Skills.locked(k)) return { can: false, why: 'BRAUCHT ' + k.req.map(r => Skills.node(r[0]).name + ' ' + r[1]).join(', ') };
    if (k.kind === 'run') { if (Game.mode !== 'run') return { can: false, why: 'NUR IM RUN (SP AUS LEVEL-UPS)' }; if (Skills.sp < Skills.price(k, l)) return { can: false, why: 'ZU WENIG SP' }; }
    else { if (Game.mode !== 'hub') return { can: false, why: 'NUR IN DER KUECHE' }; if (Trash.bank < Skills.price(k, l)) return { can: false, why: 'ZU WENIG MUELL' }; }
    return { can: true, why: 'KLICK = KAUFEN' };
  },
  buy(k) {
    if (!Skills.status(k).can) return;
    const c = Skills.price(k, Skills.lvOf(k)), old = Player.maxHp;
    if (k.kind === 'run') { Skills.sp -= c; Skills.run[k.id] = Skills.lvOf(k) + 1; } else { Trash.bank -= c; Skills.levels[k.id] = Skills.lvOf(k) + 1; Save.save(); }
    Skills.apply(); if (Game.mode === 'run') Player.hp += Math.max(0, Player.maxHp - old);
    Snd.sfx('buy');
  },
  pos(k) { return { x: Skills.CX + Skills.pan.x + k.gx * Skills.SX * Skills.zoom, y: Skills.CY + Skills.pan.y + k.gy * Skills.SY * Skills.zoom }; },
  update() {
    const S = Skills, m = Input.mouse, sp = 4;
    if (Input.down('KeyW') || Input.down('ArrowUp')) S.pan.y += sp; if (Input.down('KeyS') || Input.down('ArrowDown')) S.pan.y -= sp;
    if (Input.down('KeyA') || Input.down('ArrowLeft')) S.pan.x += sp; if (Input.down('KeyD') || Input.down('ArrowRight')) S.pan.x -= sp;
    if (Input.wheel) S.zoom -= Input.wheel * 0.1;
    if (Input.hit('Equal', 'NumpadAdd')) S.zoom += 0.15; if (Input.hit('Minus', 'NumpadSubtract')) S.zoom -= 0.15;
    S.zoom = Math.max(0.6, Math.min(1.6, S.zoom)); S.pan.x = Math.max(-260, Math.min(260, S.pan.x)); S.pan.y = Math.max(-200, Math.min(200, S.pan.y));
    if (Input.hit('KeyZ')) { S.pan.x = 0; S.pan.y = 0; S.zoom = 1; }
    S.hover = null; const r = 11 * S.zoom + 2;
    for (const k of CFG.skills) { const p = S.pos(k); if (Math.abs(m.x - p.x) < r && Math.abs(m.y - p.y) < r && m.y > 36 && m.y < 226) S.hover = k; }
    if (Input.hit('Mouse0') && m.y > 30) { if (S.hover) S.buy(S.hover); else S.drag = { x: m.x, y: m.y }; }
    if (S.drag) { if (m.l) { S.pan.x += m.x - S.drag.x; S.pan.y += m.y - S.drag.y; S.drag.x = m.x; S.drag.y = m.y; } else S.drag = null; }   // drag empty space to pan
  },
  draw(ctx) {
    const S = Skills, W = CFG.view.w, H = CFG.view.h, z = S.zoom, run = Game.mode === 'run';
    Menu.panel(ctx, 'SKILLTREE', run ? 'LV ' + S.level + '  SP ' + S.sp + '  EP ' + S.xp + '/' + S.need() : 'MUELL ' + Trash.bank);
    ctx.save(); ctx.beginPath(); ctx.rect(26, 36, W - 52, 190); ctx.clip();
    const c0 = { x: S.CX + S.pan.x, y: S.CY + S.pan.y };
    ctx.lineWidth = 2;
    for (const k of CFG.skills) {                                                     // edges: bright once the requirements are met
      const p = S.pos(k), open = !S.locked(k);
      for (const r of (k.req || [['root']])) {
        const q = r[0] === 'root' ? c0 : S.pos(S.node(r[0]));
        ctx.strokeStyle = open ? S.BR[k.branch] : '#3a3544'; ctx.globalAlpha = open ? 0.9 : 0.6;
        ctx.beginPath(); ctx.moveTo(Math.round(q.x), Math.round(q.y)); ctx.lineTo(Math.round(p.x), Math.round(p.y)); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(c0.x, c0.y, 13 * z + 2, 0, 7); ctx.fill(); ctx.fillStyle = '#2c2738'; ctx.beginPath(); ctx.arc(c0.x, c0.y, 13 * z, 0, 7); ctx.fill();
    ctx.fillStyle = CFG.col.player; ctx.fillRect(c0.x - 3 * z, c0.y - 6 * z, 6 * z, 10 * z);
    ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const k of CFG.skills) {
      const p = S.pos(k), r = 10 * z, l = S.lvOf(k), st = S.status(k), col = S.BR[k.branch], lock = S.locked(k);
      const shape = (rr, fill) => {
        ctx.fillStyle = fill; ctx.beginPath();
        if (k.kind === 'run') { ctx.moveTo(p.x, p.y - rr * 1.15); ctx.lineTo(p.x + rr * 1.15, p.y); ctx.lineTo(p.x, p.y + rr * 1.15); ctx.lineTo(p.x - rr * 1.15, p.y); ctx.closePath(); } else ctx.rect(p.x - rr, p.y - rr, rr * 2, rr * 2);
        ctx.fill();
      };
      shape(r + 2, l >= k.max ? '#ffd34a' : '#000'); shape(r, l > 0 ? col : lock ? '#25212d' : '#3a3544');
      if (st.can) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * Math.sin(Game.time * 6)) + ')'; ctx.strokeRect(Math.round(p.x - r - 3), Math.round(p.y - r - 3), r * 2 + 6, r * 2 + 6); }
      if (z >= 0.8) { ctx.fillStyle = l > 0 ? '#0c0a10' : '#8f8a98'; ctx.fillText(k.ic, p.x, p.y + 1); }
      for (let n = 0; n < k.max; n++) { ctx.fillStyle = n < l ? '#fff' : '#4a4454'; ctx.fillRect(Math.round(p.x - k.max * 2 + n * 4), Math.round(p.y + r + 5), 3, 3); }
    }
    ctx.restore(); ctx.textBaseline = 'top';
    const h = S.hover;
    if (h) {                                                                           // tooltip
      const l = S.lvOf(h), st = S.status(h), m = Input.mouse, lines = [h.desc, (h.kind === 'run' ? 'RUN-SKILL (SP)' : 'DAUER-SKILL (MUELL)') + '  STUFE ' + l + '/' + h.max, l < h.max ? 'NAECHSTE STUFE: ' + S.price(h, l) + (h.kind === 'run' ? ' SP' : ' MUELL') : 'VOLL AUSGEBAUT', st.why];
      const x = Math.min(m.x + 12, W - 214), y = Math.max(34, Math.min(m.y + 8, 238 - 56));
      ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, 204, 59); ctx.fillStyle = '#211c2b'; ctx.fillRect(x - 2, y - 2, 202, 57);
      ctx.textAlign = 'left'; ctx.font = 'bold 8px monospace'; ctx.fillStyle = S.BR[h.branch]; ctx.fillText(h.name.toUpperCase() + '  [' + S.BN[h.branch] + ']', x, y);
      ctx.font = '8px monospace'; ctx.fillStyle = '#e8dcc8'; ctx.fillText(lines[0], x, y + 11); ctx.fillStyle = '#8f8a98'; ctx.fillText(lines[1], x, y + 22); ctx.fillText(lines[2], x, y + 33);
      ctx.fillStyle = st.can ? '#9fe070' : '#ff7080'; ctx.fillText(lines[3], x, y + 44);
    }
    ctx.textAlign = 'left'; let fx = 36; ctx.font = 'bold 8px monospace';
    for (const b in S.BR) { ctx.fillStyle = S.BR[b]; ctx.fillText(S.BN[b], fx, H - 42); fx += ctx.measureText(S.BN[b]).width + 12; }
    ctx.font = '8px monospace'; ctx.fillStyle = PAL.uiDim; ctx.fillText('QUADRAT = DAUER (MUELL, KUECHE)   RAUTE = RUN (SP, NUR IM RUN)', 36, H - 32);
    ctx.fillText('WASD / ZIEHEN: BEWEGEN   RAD, + -: ZOOM   Z: ZURUECK   Q/E: TAB', 36, H - 23);
  }
};
