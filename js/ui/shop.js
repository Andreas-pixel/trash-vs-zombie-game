// Trash Vs. Nazi-Zombies - Garderobe
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ SHOP (Garderobe in the kitchen) ============ */
const Shop = {
  open() { Game.ui = 'shop'; Menu.hover = -1; Snd.sfx('ui'); ['KeyF', 'KeyE'].forEach(k => Input.pressed.delete(k)); },
  update() { if (Input.hit('Escape', 'KeyF', 'KeyE', 'KeyI', 'Tab')) { Game.ui = null; Snd.sfx('ui'); return; } Menu.updShop(); },
  draw(ctx) { Menu.drawShop(ctx); Tut.menuHint(ctx); }
};
