// Trash Vs. Nazi-Zombies - Intro und NPC-Gespraeche
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ STORY FLOW (intro once, then character choice, then the tutorial) ============ */
const Story = {
  phase: '', hidePlayer: false,
  afterTitle() {
    if (Game.mode !== 'hub') return;
    if (!Save.flags.intro) Story.intro(); else if (!Save.flags.tut && !Save.flags.tutBath) Tut.start(); else if (!Save.flags.tut) Tut.hubBegin();
  },
  intro() {
    Story.phase = 'intro'; Story.hidePlayer = true; Combat.texts = [];
    Dialog.start(STORY.intro, () => Select.open(() => {
      Story.phase = ''; Story.hidePlayer = false; Save.flags.intro = true; Save.save();
      Dialog.start([['player', STORY.chosen[Player.look]]], () => Tut.start());
    }));
  },
  talk(name) {
    const f = Save.flags, n = f.talk[name] || 0; let line;
    if (Save.stats.runs > 0 && f.back[name] !== Save.stats.runs) { line = STORY.back[name]; f.back[name] = Save.stats.runs; }
    else { line = STORY.talk[name][n % STORY.talk[name].length]; f.talk[name] = n + 1; }
    Save.save(); Dialog.start([[name, line]]);
  }
};
