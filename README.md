# Trash Vs. Nazi-Zombies

Browser-Roguelike in HTML5 und JavaScript. Keine Bibliotheken, keine Engine, kein Build-Schritt.

## Starten

- `index.html` doppelklicken. Das Spiel läuft direkt im Browser, auch ohne Internet.
- Zum Veröffentlichen den ganzen Ordner hochladen (zum Beispiel als ZIP auf itch.io, per Netlify Drop oder über GitHub Pages). Wichtig ist, dass `index.html`, `css/` und `js/` zusammenbleiben.

## Wie es im Browser läuft

- **Canvas 2D:** `index.html` enthält nur ein `<canvas>`. Alles, was man sieht, zeichnet JavaScript mit der Canvas-2D-Schnittstelle des Browsers. Es gibt kein 3D und keine Bibliothek wie three.js.
- **2.5D durch Rechnung:** Der 3D-Eindruck entsteht durch die isometrische Projektion in `js/core/iso.js`. Die Spiellogik rechnet in Weltkoordinaten, erst beim Zeichnen werden sie in schräge Bildschirmpositionen umgerechnet.
- **Spielschleife:** `js/main.js` ruft über `requestAnimationFrame` etwa 60-mal pro Sekunde `update` (Logik, feste Zeitschritte) und `Renderer.frame` (Zeichnen) auf.
- **Grafik ohne Bilddateien:** Figuren, Möbel, Wände und Müll werden beim Start per Code gemalt (`js/art/`) und in unsichtbare Zwischen-Canvases gespeichert. Danach werden sie nur noch kopiert, das spart Rechenzeit.
- **Sound ohne Audiodateien:** Effekte und Musik erzeugt die Web-Audio-Schnittstelle des Browsers (`js/audio/sound.js`).
- **Spielstand:** wird im `localStorage` des Browsers gespeichert (`js/game/save.js`). Jeder Spieler hat seinen eigenen.

## Ordner

| Ordner | Inhalt |
|---|---|
| `css/` | Seitenlayout (nur Hintergrund und Canvas-Größe) |
| `js/data/` | Palette, Story-Texte, alle Spielwerte (`config.js`) |
| `js/core/` | Projektion, Eingabe, Kamera |
| `js/entities/` | Spielfigur |
| `js/combat/` | Kampf, Gegner-Fähigkeiten, Bosse, Waffen |
| `js/world/` | Räume, Zufallsräume, Müll, Küche (Hub), Siegesfeier auf dem Dach |
| `js/game/` | Run-Ablauf, Spielstand, Skills, Rüstung, Story-Ablauf, Tutorial |
| `js/art/` | Gemalte Grafik, Bewuchs, Partikel, optionale PNG-Sprites |
| `js/audio/` | Sound und Musik |
| `js/ui/` | Menüs, Dialoge, HUD, Texte |
| `js/render/` | Zeichenreihenfolge, Licht |
| `js/main.js` | Spielschleife und Start |

## Wichtig beim Bearbeiten

- Die Dateien sind klassische Skripte, keine ES-Module. Sie teilen sich ihre Objekte (zum Beispiel `CFG`, `Player`, `UI`) über den globalen Bereich. Deshalb funktioniert das Spiel auch per Doppelklick ohne Server.
- Die **Reihenfolge der `<script>`-Zeilen in `index.html` muss bleiben**: `config.js` muss zum Beispiel vor `weapons.js` geladen werden, weil dort beim Laden schon Werte aus `CFG` gelesen werden.
- Texte ändern: `js/data/story.js`. Balancing ändern: `js/data/config.js`. Farben: `js/data/palette.js`. Schrift: `UI.FONT` in `js/ui/ui.js`.
