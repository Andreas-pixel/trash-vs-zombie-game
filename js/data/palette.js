// Trash Vs. Nazi-Zombies - Farbpalette (Rollen statt Farbnamen)
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ PALETTE (all new art uses these tokens; measured from the style sheet + logo) ============ */
const PAL = {
  night: '#101319', slate: '#1c2736', steel: '#2a4057', indigo: '#3e4890', petrol: '#357079', mint: '#49ac95', pink: '#da5784', rose: '#8e4869', lavender: '#6d72a5', ice: '#cfe0e6',
  neonPurple: '#a455e8', neonCyan: '#23e3db', neonGreen: '#43e08a',   // logo colors
  armor: '#ffd34a', ink: '#0a0c12'
};
Object.assign(PAL, {                                     // UI roles
  uiPlayer: PAL.neonCyan, uiInteract: PAL.neonCyan, uiLoot: PAL.neonGreen, uiWorld: PAL.neonPurple, uiEnemy: PAL.neonPurple,
  uiHp: PAL.pink, uiArmor: PAL.armor, uiDanger: '#ff5a3c', uiText: '#e6dcc6', uiDim: '#8e887c', uiHead: '#ecdcb8', uiBrass: '#7a6544', uiBrassDark: '#4e4332', uiPanel: '#0d121b', uiPanel2: '#141b28'
});
