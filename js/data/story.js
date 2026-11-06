// Trash Vs. Nazi-Zombies - Story- und Dialogtexte, Tutorial-Raum
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ STORY (ENTWURF: alle Texte hier hat Claude geschrieben, zum Ersetzen gedacht)
   Sprecher: 'narrator', 'coole', 'schuechtern', 'nerdig', 'zombie', 'player' (= gewaehlte Figur), 'a' / 'b' (= die zwei anderen Bewohner) ============ */
const STORY = {
  intro: [
    ['narrator', 'Tag 23 der Apokalypse. Aus dem Keller der WG sind Untote gekrochen. In erfundenen Uniformen. Mit einem einzigen Ziel.'],
    ['narrator', 'Sie wollen die Erde verdrecken. Zimmer für Zimmer. Erst die WG, dann den Rest der Welt.'],
    ['coole', 'Okay. Krisensitzung. Die schmeißen ihren Müll einfach überall hin.'],
    ['nerdig', 'Nicht einfach so. Systematisch. Die haben einen Plan, und der heißt: alles vermüllen.'],
    ['schuechtern', 'Ich hab gestern im Bad aufgeräumt. Heute liegt da wieder alles voll.'],
    ['coole', 'Dann machen wir es andersrum. Wir räumen auf. Und die raus.'],
    ['nerdig', 'Jedes Stück Müll, das wir einsammeln und entsorgen, fehlt ihnen für ihren Plan.'],
    ['schuechtern', 'Und der Müll im Container ... ist der was wert?'],
    ['nerdig', 'Für uns schon. Wir tauschen ihn gegen bessere Ausrüstung. Pfandsystem, nur ehrlicher.'],
    ['coole', 'Also: Zombies verkloppen, Müll entsorgen, Planet retten. Wer geht vor?']
  ],
  chosen: { coole: 'Ich. Natürlich ich. Einer muss ja gut dabei aussehen.', schuechtern: 'Ich. Bevor ich es mir anders überlege.', nerdig: 'Ich. Ich hab den Plan erklärt, ich zieh ihn auch durch.' },
  select: { coole: 'Fellkragen, große Klappe, gute Laune. Meistens.', schuechtern: 'Hat den Putzplan geschrieben. Hält sich als Einziger dran.', nerdig: 'Hat zu allem eine Theorie. Auch zu dir.' },
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
  back: { coole: 'Da bist du ja wieder. Du riechst nach Badezimmer. Und nach Niederlage.', schuechtern: 'Du lebst! Also, so halb. Setz dich kurz.', nerdig: 'Zurück aus dem Feld. Zwischenstand: Die Erde ist noch dreckig. Aber weniger.' },
  names: { coole: 'DER COOLE', schuechtern: 'DER SCHÜCHTERNE', nerdig: 'DER NERDIGE', zombie: 'NAZI-ZOMBIE', narrator: '' }
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
