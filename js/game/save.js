// Trash Vs. Nazi-Zombies - Spielstand (localStorage)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ SAVE (localStorage, fails soft) ============ */
const Save = {
  reset() {   // delete the save: progress, currency, gear, story flags (sound and shake settings stay)
    try { localStorage.removeItem(Save.KEY); } catch (e) {}
    Trash.bank = 0; Trash.secured = 0; Trash.carry = []; Skills.levels = {}; Skills.resetRun();
    Gear.eq = { helm: null, vest: null, boots: null }; Gear.stash = []; Weapons.unlocked = { broom: true }; Weapons.equip('broom');
    Save.stats = { runs: 0, bestRoom: 0 }; Save.flags = { intro: false, tut: false, tutBath: false, talk: {}, back: {} };
    Player.look = 'coole'; Run.last = null; Tut.hub = 0; Tut.target = null; Skills.apply(); Hub.enter(); Save.save();
  },
  KEY: 'zombieWG.save.v1', ok: true, stats: { runs: 0, bestRoom: 0 }, flags: { intro: false, tut: false, tutBath: false, talk: {}, back: {} },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(Save.KEY) || 'null');
      if (d && d.v === 1) {
        Snd.muted = !!d.mute; UI.shakeFull = d.shake !== false; Save.flags = Object.assign({ intro: false, tut: false, tutBath: false, talk: {}, back: {} }, d.flags); if (Paint.NAMES.includes(d.look)) Player.look = d.look; Weapons.unlocked = Object.assign({ broom: true }, d.wu); Weapons.equip(CFG.weapons[d.we] ? d.we : 'broom');
        Trash.bank = d.bank | 0;
        if (d.gear) { Gear.eq = Object.assign({ helm: null, vest: null, boots: null }, d.gear.eq); Gear.stash = d.gear.st || []; Gear.uid = 1 + Math.max(0, ...Gear.stash.map(i => i.id), ...Object.values(Gear.eq).map(i => i ? i.id : 0)); } Skills.levels = d.skills || {}; Save.stats = Object.assign(Save.stats, d.stats); }
    } catch (e) { Save.ok = false; }
  },
  save() {
    try { localStorage.setItem(Save.KEY, JSON.stringify({ v: 1, flags: Save.flags, shake: UI.shakeFull, bank: Trash.bank, skills: Skills.levels, stats: Save.stats, mute: Snd.muted, wu: Weapons.unlocked, we: Weapons.cur, look: Player.look, gear: { eq: Gear.eq, st: Gear.stash } })); }
    catch (e) { Save.ok = false; }
  }
};
