// Trash Vs. Nazi-Zombies - Story- und Dialogtexte, Tutorial-Raum
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ STORY (ENTWURF: alle Texte hier hat Claude geschrieben, zum Ersetzen gedacht)
   Sprecher: 'narrator', 'coole', 'schuechtern', 'nerdig', 'zombie', 'player' (= gewaehlte Figur), 'a' / 'b' (= die zwei anderen Bewohner) ============ */
const STORY = {
  intro: [
    ['narrator', 'Die Welt liegt in Schutt und Asche. Die Apokalypse ist in vollem Gange. Wieder zum Leben erweckte Soldaten des Dritten Reiches treiben ihr dunkles Unwesen.'],
    ['narrator', 'Ihr Ziel ist es, die Erde zu verdrecken und mit Müll zu überfluten, um neuen Boden für die Wiederauferstehung des unheilvollen Regimes des schlimmsten Mannes aller Zeiten vorzubereiten …'],
    ['narrator', 'Adolf Hitler.'],
    ['narrator', 'Aber wir werden ihnen zuvorkommen!'],
    ['narrator', 'Gemeinsam werden wir unser sicheres Umfeld verlassen und die Welt wieder vom Müll befreien.'],
    ['narrator', 'Je mehr Müll wir sammeln, desto besser werden wir.'],
    ['narrator', 'Das Ziel ist also klar …'],
    ['narrator', 'Müll entsorgen …'],
    ['narrator', 'Nazis enthaupten …'],
    ['narrator', '… diesen Bastarden den FÜHRERschein entziehen.']
  ],
  chosen: { coole: 'Tell Hitler I said hi!', schuechtern: 'Heil Hitler? Heil Hell!', nerdig: 'You want more space? I’ll give you Six Feet Under.' },
  select: { coole: 'Nazis esse ich zum Frühstück!', schuechtern: 'I’m a Chef! My favorite Dish? Knuckle-Sandwich.', nerdig: 'Ähhm … excuse me? Fuck you, Mr. Nazi!' },
  tut: {
    start: [['a', 'Im Bad haben sie schon angefangen. Fang da an.'], ['b', 'Und mach die Tür hinter dir zu. Der Geruch soll nicht in die Küche.']],
    dash: [['a', 'Wenn es eng wird: ausweichen. Ganz kurz bist du dabei unverwundbar.']],
    trash: [['b', 'Da liegt ihr Dreck. Heb ihn auf. Ja, mit den Händen.']],
    fight: [['zombie', 'MEHR DRECK! DIE ERDE MUSS STINKEN!'], ['a', 'Er dreht sich langsam. Triff ihn von hinten, das tut ihm mehr weh.'], ['zombie', 'Wer hat ... hier ... aufgeräumt ...']],
    deposit: [['b', 'Bring den Müll zum Container. Was drin ist, ist entsorgt und zählt für uns. Was du trägst, verlierst du, wenn sie dich erwischen.']],
    done: [['a', 'Ein Raum sauber. Fehlen nur noch ungefähr 510 Millionen Quadratkilometer.'], ['b', 'Komm in die Küche. Wir planen den Rest.']]
  },
  tutHub: {
    intro: [['a', 'Willkommen zurück. Bevor du wieder losziehst: drei Dinge in der Küche.'], ['b', 'Erst der Kühlschrank. Komm.']],
    skills: [['b', 'Der Kühlschrank ist unser Skilltree. Jeder Zettel ist eine Fähigkeit.'], ['a', 'Die Quadrate sind Dauer-Fähigkeiten. Die kaufst du hier mit entsorgtem Müll, und sie bleiben für immer.'],
      ['b', 'Die Rauten gibt es nur unterwegs. Für Erfahrung bekommst du Skillpunkte, und nach dem Run sind sie wieder weg.'], ['a', 'Die Linien zeigen, was du zuerst brauchst. Mit K kommst du auch im Run an den Baum.'],
      ['b', 'Hier, sechs Müll aus dem Notvorrat. Kauf dir was. Zur Probe.']],
    wardrobe: [['a', 'Der Schrank da ist die Garderobe. Helm, Weste, Schuhe.'], ['b', 'Panzer sorgt dafür, dass weniger Schaden durchkommt. Gute Teile lassen die Zombies fallen, die Grundausstattung kaufst du hier.'],
      ['a', 'Was du kaufst, ziehst du sofort an, wenn der Platz frei ist. Sonst im Menü unter Kleidung. Hier sind noch vier Müll. Gönn dir einen Fahrradhelm.']],
    rack: [['b', 'Und das Waffenregal. Besen, Pfanne, Messer.'], ['a', 'Mit F öffnest du das Regal. Da stehen alle Waffen nebeneinander, mit Schaden, Tempo und Spezialangriff. Klick drauf zum Nehmen oder Kaufen.'], ['b', 'Jede Waffe hat einen Spezialangriff auf der rechten Maustaste. Die Pfanne macht Lärm. Viel Lärm.']],
    done: [['a', 'Das war es. Die Tür rechts führt raus. Komm mit Müll zurück, nicht ohne.'], ['b', 'Und falls du je neu anfangen willst: Escape, Spielstand löschen. Aber warum solltest du.']]
  },
  talk: {
    coole: ['Ich bin für die Moral zuständig. Und für Snacks. Die Snacks haben sie vermüllt.', 'Am Waffenregal hängt eine Pfanne. Schwer, laut, ehrlich. Wie ich.', 'Je mehr Müll du entsorgst, desto mehr Fähigkeiten kaufen wir. Recycling, nur mit Gewalt.'],
    schuechtern: ['Ich habe den Putzplan überarbeitet. Jetzt steht da: alles. Jeden Tag.', 'Am Kühlschrank kannst du Fähigkeiten freischalten. Ich habe Zettel drangeklebt. Bunte.', 'Wenn sie dich treffen, fällt dir Müll aus dem Rucksack. Heb ihn wieder auf. Bitte.'],
    nerdig: ['Beobachtung: Die Untoten drehen sich langsam. Von hinten triffst du härter.', 'Der Container entsorgt deinen Müll. Was du nicht abgibst, ist beim Tod weg. Und liegt wieder bei denen.', 'Ich habe ihre Uniformen analysiert. Komplett ausgedacht. Wie der Rest ihrer Weltanschauung.']
  },
  firstRun: [['a', 'Erster Einsatz überlebt. Mehr oder weniger. Jetzt kommt der Teil, der dich stärker macht.'],
    ['b', 'Wir haben jetzt {bank} entsorgten Müll auf dem Konto. Das ist unsere Währung. Am Kühlschrank kaufst du davon Fähigkeiten, und die bleiben für immer.'],
    ['a', 'Und zieh dir was Vernünftiges an. Im Schrank gibt es Helm, Weste und Schuhe. Was du unterwegs findest, liegt im Menü unter Kleidung. Taste C.'],
    ['b', 'Mit Panzer kommt weniger Schaden durch. Mit Fähigkeiten teilst du mehr aus. Beides zusammen: Die Erde wird sauber.']],
  back: { coole: 'Da bist du ja wieder. Du riechst nach Badezimmer. Und nach Niederlage.', schuechtern: 'Du lebst! Also, so halb. Setz dich kurz.', nerdig: 'Zurück aus dem Feld. Zwischenstand: Die Erde ist noch dreckig. Aber weniger.' },
  roof: {
    arrive: [['a', 'Na endlich! Wir dachten schon, du putzt da unten noch die Lava weg.'],
      ['b', 'Wir haben den Grill angeworfen. Das Fass war vorher Müll. Jetzt ist es Party.'],
      ['player', 'Ist das ... die ganze Stadt?'],
      ['a', 'Alles, was davon übrig ist. Kaputt, verwachsen und ab heute ein bisschen sauberer.'],
      ['b', 'Und nirgends ein Nazi-Zombie. Nur Ratten. Die räumen wenigstens hinter sich auf.'],
      ['narrator', 'Unter ihnen schläft die Stadt. Über ihnen knallt das Feuerwerk. Für eine Nacht ist die Welt nicht vermüllt.']],
    talk: ['Die Erde riecht schon fast wieder nach Erde.', 'Ich hab die Musik ausgesucht. Beschwerden bitte an den Container.', 'Morgen gehen wir wieder runter. Irgendwo liegt immer Dreck.', 'Die Würstchen sind aus dem Notvorrat. Frag nicht, wie alt.'],
    credits: ['DIE ERDE IST SAUBER', 'Für den Moment.', 'DANKE FÜRS SPIELEN', 'FEIER WEITER ODER NIMM DIE TREPPE ZURÜCK IN DIE KÜCHE']
  },
  finalBoss: {
    intro: [['boss', 'Ah. Der Putzdienst. Ihr kommt spät.'], ['player', 'Wir kommen genau richtig. Zum Rausbringen.'],
      ['boss', 'Mein Plan ist perfekt: eine Welt, die stinkt. Ordentlich vermüllt, bis in die letzte Ecke.'],
      ['boss', 'Und dieser Bunker hat sogar Lava. Habe ich extra einbauen lassen.'], ['player', 'Klar. Was soll schon schiefgehen.']],
    outro: [['boss', 'Das ... war nicht ... eingeplant ...'], ['player', 'Müll gehört in den Container. Du auch.'], ['narrator', 'Der Bunker ist sauber. Die Erde atmet auf. Für den Moment.']]
  },
  names: { coole: 'DER COOLE', schuechtern: 'DER SCHÜCHTERNE', nerdig: 'DER NERDIGE', zombie: 'NAZI-ZOMBIE', boss: 'ADOLFI HITLER', narrator: '' }
};
const TUT_ROOM = [   // tutorial bathroom (furniture fixed in Tut.start): '#' wall/furniture, 'P' spawn, 'C' container, 'D' door to the kitchen
  "#############",
  "#..#...#....#",
  "#..........##",
  "#.P.........#",
  "#...........#",
  "#...........#",
  "#........C..D",
  "#..##.......#",
  "#...........#",
  "#############"
];
