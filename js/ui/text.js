// Trash Vs. Nazi-Zombies - Umlaute in der Anzeige
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ TEXT (German text layer: strings in code stay ASCII, the screen shows umlauts / sz) ============ */
const Text = {
  // word stems -> correct spelling; case of the original is kept (all-caps stays all-caps, sz becomes SS in caps)
  STEMS: [['KUECH', 'KÜCH'], ['PLAETZ', 'PLÄTZ'], ['AUSRUEST', 'AUSRÜST'], ['GEWOEHNL', 'GEWÖHNL'], ['LEGENDAER', 'LEGENDÄR'], ['MUELL', 'MÜLL'], ['RUECK', 'RÜCK'],
    ['GLUECK', 'GLÜCK'], ['ZAEH', 'ZÄH'], ['UEBER', 'ÜBER'], ['UEBR', 'ÜBR'], ['NAECHST', 'NÄCHST'], ['FUER', 'FÜR'], ['GGUE.', 'GGÜ.'], ['VERSTAERK', 'VERSTÄRK'], ['WUET', 'WÜT'],
    ['KUEHL', 'KÜHL'], ['HAERT', 'HÄRT'], ['HAELT', 'HÄLT'], ['FAELLT', 'FÄLLT'], ['TRAEG', 'TRÄG'], ['KAEMPF', 'KÄMPF'], ['STAERK', 'STÄRK'], ['KOENIG', 'KÖNIG'],
    ['GROESS', 'GRÖSS'], ['ERHOEH', 'ERHÖH'], ['OEFFN', 'ÖFFN'], ['TUER', 'TÜR'], ['DRUECK', 'DRÜCK'], ['FUEHR', 'FÜHR'], ['WAEHL', 'WÄHL'], ['SPAET', 'SPÄT'],
    ['FUSSBALL', 'FUßBALL'], ['SCHLIESS', 'SCHLIEß'], ['ABHAENG', 'ABHÄNG'], ['WAESCH', 'WÄSCH'], ['RAEUM', 'RÄUM'], ['MENUE', 'MENÜ'], ['NOETIG', 'NÖTIG'], ['AUSRUEST', 'AUSRÜST']],
  cache: new Map(),
  de(t) {
    if (typeof t !== 'string') return t;
    let r = Text.cache.get(t); if (r !== undefined) return r;
    r = t;
    for (const [a, b] of Text.STEMS) {
      if (r.toUpperCase().indexOf(a) < 0) continue;
      r = r.replace(new RegExp(a.replace('.', '\\.'), 'gi'), m => m === m.toUpperCase() ? b.toUpperCase() : m[0] === m[0].toUpperCase() ? b[0] + b.slice(1).toLowerCase() : b.toLowerCase());
    }
    if (Text.cache.size < 4000) Text.cache.set(t, r);
    return r;
  }
};
