// Trash Vs. Nazi-Zombies - Waffen ausruesten und kaufen
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ WEAPONS ============ */
const Weapons = {
  ids: ['broom', 'pan', 'knife'], cur: 'broom', unlocked: { broom: true }, defaults: JSON.parse(JSON.stringify(CFG.weapon)),
  equip(id) { Object.assign(CFG.weapon, Weapons.defaults, CFG.weapons[id]); Weapons.cur = id; },
  choose(id) {
    const w = CFG.weapons[id], P = Player;
    if (Weapons.unlocked[id]) { Weapons.equip(id); Snd.sfx('ui'); Save.save(); Combat.text(P.x, P.y - 0.5, w.name.toUpperCase(), '#ffd34a', true); }
    else if (Trash.bank >= w.cost) {
      Trash.bank -= w.cost; Weapons.unlocked[id] = true; Weapons.equip(id); Snd.sfx('buy'); Save.save();
      Combat.text(P.x, P.y - 0.5, 'FREIGESCHALTET', PAL.uiLoot, true);
    } else Combat.text(P.x, P.y - 0.5, w.cost + ' MUELL NOETIG', '#ff7080', false);
  }
};
