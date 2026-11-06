// Trash Vs. Nazi-Zombies - Spielwerte: Waffen, Gegner, Skills, Biome, Balancing
// Klassisches Skript: alle Dateien teilen sich die globalen Objekte; die Reihenfolge in index.html zaehlt.
/* ============ DATA / CONFIG (data-driven) ============ */
const CFG = {
  view:   { w: 480, h: 270, ss: 2 },   // logical size; the canvas is rendered at ss x for smooth painted art
  _v:     0,                 // internal low-res buffer (pixel-art look)
  tile:   { w: 32, h: 16, wallH: 14 },        // 2:1 dimetric
  player: { radius: 0.28, speed: 95 },        // speed in SCREEN px/s (constant visual speed)
  dash:   { speed: 400, dur: 0.18, iframes: 0.14, cd: 0.45, ghostEvery: 0.025 },
  cam:    { lerp: 7, look: 0.18, shakeDecay: 10 },
  weapon: { base: 20, add: 0, range: 1.6, arc: 150, windup: 0.06, dur: 0.22, cd: 0.32, kb: 7,
            critP: 0.12, critMult: 2, backstabMult: 1.5, dashAtkAdd: 0.35, moveMul: 0.5,
            sfx: 'swing', trail: '255,245,215', slamMul: 1 },   // defaults; overridden by CFG.weapons[id]
  weapons: {   // unlock cost in banked trash; any CFG.weapon key can be overridden
    broom: { name: 'Besenstiel',     cost: 0, desc: 'Ausgewogen. Gut zum Lernen.', special: { type: 'shockwave', name: 'Fegen', cd: 6, r: 2.4, dmgMul: 0.6, kb: 11 } },
    pan:   { name: 'Bratpfanne',     cost: 12, desc: 'Langsam und wuchtig. Wall Slam x1.6.', base: 38, range: 1.4, arc: 110, windup: 0.16, dur: 0.34, cd: 0.55, kb: 12, critP: 0.08, moveMul: 0.35, slamMul: 1.6, sfx: 'swingHeavy', trail: '255,200,120',
             special: { type: 'slam', name: 'Scheppern', cd: 8, r: 2.0, dmgMul: 1.0, stun: 1.1, armorMul: 2 } },
    knife: { name: 'Kuechenmesser',  cost: 10, desc: 'Schnell, oft kritisch. Rücken-Treffer x2.', base: 11, range: 1.1, arc: 90,  windup: 0.03, dur: 0.14, cd: 0.17, kb: 3,  critP: 0.20, moveMul: 0.8, backstabMult: 2.0, sfx: 'swingFast', trail: '200,230,255',
             special: { type: 'throw', name: 'Wurfmesser', cd: 4, dmgMul: 1.3, speed: 12, range: 7 } }
  },
  slam:   { minSpeed: 3, base: 12, perSpeed: 1.2, stun: 0.6 },         // wall slam bonus damage
  hurt:   { iframes: 0.6, kb: 5 },
  enemies: {                                                           // speed in tiles/s, turn in rad/s
    walker:  { hp: 45, armor: 0,  speed: 1.7, turn: 5, r: .3,  kbMul: 1,  color: '#6f9a52', melee:  { range: .85, windup: .45, dmg: 10, rec: .5, cd: .8 } },
    runner:  { hp: 22, armor: 0, speed: 3.1, turn: 8, r: .25, kbMul: 1.4, color: '#c0603a', melee: { range: .8, windup: .25, dmg: 7, rec: .4, cd: .6 } },
    bloater: { hp: 60, armor: 0, speed: 1.0, turn: 3, r: .4, kbMul: .8, color: '#8fa03a', melee: { range: 1.0, windup: .6, dmg: 12, rec: .6, cd: 1 } },
    hexer:   { hp: 38, armor: 0, speed: 1.3, turn: 5, r: .3, kbMul: 1.1, color: '#7a4ab0', ranged: { min: 4, max: 7, windup: .7, dmg: 7, speed: 4.5, cd: 2.6 } },
    brute:   { hp: 70, armor: 50, speed: 1.1, turn: 3, r: .38, kbMul: .6, color: '#8a4a3a', melee:  { range: 1.0, windup: .7,  dmg: 20, rec: .8, cd: 1.1 } },
    spitter: { hp: 30, armor: 0,  speed: 1.5, turn: 6, r: .28, kbMul: 1.2, color: '#b49a3c', ranged: { min: 3.5, max: 6, windup: .55, dmg: 9, speed: 5.5, cd: 1.9 } },
    boss:    { hp: 450, armor: 160, speed: 1.2, turn: 2.5, r: .55, kbMul: .3, color: '#7a2d5a',
               melee: { range: 1.4, windup: .8, dmg: 25, rec: .7, cd: 1.0 }, burst: { every: 4, n: 10, dmg: 8, speed: 4.5 } }
  },
  sprites: {   // optional art layer: a PNG named like the key replaces the procedural drawing
    // sheet layout: rows = animations (in key order) x direction rows, columns = frames; dirs 8 order S,SE,E,NE,N,NW,W,SW (mirror: only S..N stored)
    player:    { fw: 32, fh: 32, ax: 16, ay: 29, bar: 34, dirs: 8, mirror: true, anims: { idle: { n: 4, fps: 6 }, walk: { n: 6, fps: 12 }, attack: { n: 4, fps: 18, loop: false }, dash: { n: 2, fps: 10 }, hurt: { n: 2, fps: 10, loop: false }, die: { n: 6, fps: 10, loop: false } } },
    walker:    { fw: 32, fh: 32, ax: 16, ay: 29, bar: 34, dirs: 4, mirror: true, anims: { idle: { n: 4, fps: 5 }, walk: { n: 6, fps: 9 }, windup: { n: 3, fps: 8, loop: false }, attack: { n: 3, fps: 12, loop: false }, hurt: { n: 2, fps: 10, loop: false }, die: { n: 6, fps: 10, loop: false } } },
    runner:    { fw: 32, fh: 32, ax: 16, ay: 29, bar: 34, dirs: 4, mirror: true, anims: { idle: { n: 4, fps: 6 }, walk: { n: 6, fps: 14 }, windup: { n: 2, fps: 10, loop: false }, attack: { n: 3, fps: 14, loop: false }, hurt: { n: 2, fps: 10, loop: false }, die: { n: 5, fps: 10, loop: false } } },
    spitter:   { fw: 32, fh: 32, ax: 16, ay: 29, bar: 34, dirs: 4, mirror: true, anims: { idle: { n: 4, fps: 5 }, walk: { n: 6, fps: 9 }, windup: { n: 3, fps: 8, loop: false }, attack: { n: 3, fps: 12, loop: false }, hurt: { n: 2, fps: 10, loop: false }, die: { n: 6, fps: 10, loop: false } } },
    brute:     { fw: 40, fh: 40, ax: 20, ay: 36, bar: 42, dirs: 4, mirror: true, anims: { idle: { n: 4, fps: 4 }, walk: { n: 6, fps: 7 }, windup: { n: 4, fps: 6, loop: false }, attack: { n: 4, fps: 12, loop: false }, hurt: { n: 2, fps: 10, loop: false }, die: { n: 6, fps: 8, loop: false } } },
    boss:      { fw: 64, fh: 64, ax: 32, ay: 58, bar: 68, dirs: 4, mirror: true, anims: { idle: { n: 4, fps: 4 }, walk: { n: 6, fps: 6 }, windup: { n: 4, fps: 6, loop: false }, attack: { n: 5, fps: 12, loop: false }, hurt: { n: 2, fps: 10, loop: false }, die: { n: 8, fps: 8, loop: false } } },
    bag:       { fw: 16, fh: 16, ax: 8,  ay: 15, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    crate:     { fw: 20, fh: 20, ax: 10, ay: 19, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    container: { fw: 32, fh: 40, ax: 16, ay: 33, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    terminal:  { fw: 32, fh: 48, ax: 16, ay: 41, dirs: 1, anims: { idle: { n: 2, fps: 3 } } },
    rack:      { fw: 32, fh: 40, ax: 16, ay: 34, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    wardrobe:  { fw: 32, fh: 48, ax: 16, ay: 41, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    portrait_coole: { fw: 96, fh: 128, ax: 48, ay: 128, dirs: 1, anims: { idle: { n: 1, fps: 1 } } }, portrait_schuechtern: { fw: 96, fh: 128, ax: 48, ay: 128, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    portrait_nerdig: { fw: 96, fh: 128, ax: 48, ay: 128, dirs: 1, anims: { idle: { n: 1, fps: 1 } } }, portrait_zombie: { fw: 96, fh: 128, ax: 48, ay: 128, dirs: 1, anims: { idle: { n: 1, fps: 1 } } },
    floor:     { tile: true, fw: 32, fh: 16, ox: 16, oy: 0,  variants: 4 },   // rows = biomes, columns = variants
    wall:      { tile: true, fw: 32, fh: 30, ox: 16, oy: 14, variants: 2 }    // 16px top diamond + 14px wall height
  },
  gear: {   // 3 armor slots; items are generated from bases x rarity (+ random affixes)
    slots: ['helm', 'vest', 'boots'], names: { helm: 'HELM', vest: 'WESTE', boots: 'SCHUHE' }, stash: 12, armorK: 60,   // damage reduction = armor / (armor + armorK), max 75%
    rarities: [
      { name: 'GEWOEHNLICH',   col: '#a8a8a8', w: 60,  mult: 1.0,  aff: 0 }, { name: 'UNGEWOEHNLICH', col: '#5fbf5a', w: 28, mult: 1.25, aff: 1 },
      { name: 'SELTEN',        col: '#4aa0ff', w: 10,  mult: 1.55, aff: 2 }, { name: 'EPISCH',        col: '#b060ff', w: 2.5, mult: 1.9, aff: 3 },
      { name: 'LEGENDAER',     col: '#ffa030', w: 0.5, mult: 2.4,  aff: 3 } ],
    bases: {
      helm:  [{ name: 'Fahrradhelm', armor: 3 }, { name: 'Topfdeckel-Helm', armor: 5 }, { name: 'Motorradhelm', armor: 8 }],
      vest:  [{ name: 'Regenjacke', armor: 4, hp: 5 }, { name: 'Lederjacke', armor: 7, hp: 8 }, { name: 'Schutzweste', armor: 11, hp: 12 }],
      boots: [{ name: 'Flip-Flops', armor: 1, speed: 0.04 }, { name: 'Turnschuhe', armor: 2, speed: 0.06 }, { name: 'Gummistiefel', armor: 4, speed: 0.03 }, { name: 'Arbeitsstiefel', armor: 6, speed: 0.02 }] },
    affixes: { dmg: 0.04, crit: 0.02, speed: 0.02, dash: 0.03, hp: 6, armor: 2 },                  // per-affix base value (x rarity mult)
    labels: { armor: 'PANZER', hp: 'LEBEN', speed: 'TEMPO', dmg: 'SCHADEN', crit: 'CRIT', dash: 'DASH-CD', cap: 'RUCKSACK' },
    drops: { walker: 0.04, runner: 0.04, bloater: 0.06, hexer: 0.15, spitter: 0.08, brute: 0.3, boss: 1 },                      // drop chance per kill (boss: 2 items, min. uncommon)
    shop: [ { slot: 'helm', base: 0, cost: 4 }, { slot: 'helm', base: 1, cost: 9 }, { slot: 'vest', base: 0, cost: 4 }, { slot: 'vest', base: 1, cost: 10 },
            { slot: 'boots', base: 0, cost: 3 }, { slot: 'boots', base: 1, cost: 6 }, { slot: 'boots', base: 2, cost: 9 } ] },
  bosses: {   // random per boss room (never the same twice in a row). phase i starts at 100% / 66% / 33% HP
    // atk = attack pool of the phase, gap = pause between attacks, arena = 'pillars' | 'clear' | 'hazards', add = [type, count] spawned on entering the phase
    janitor:  { name: 'DER HAUSMEISTER',  hp: 520, armor: 180, speed: 1.6, r: 0.55, color: '#7a6a3a', keep: 1.3, phases: [
      { atk: ['charge', 'slam'], gap: 1.6 }, { atk: ['charge', 'slam', 'rain'], gap: 1.3, arena: 'pillars', add: ['runner', 2] }, { atk: ['charge', 'rain', 'slam', 'summon'], gap: 1.0, arena: 'clear', add: ['walker', 3] } ] },
    landlady: { name: 'DIE VERMIETERIN',  hp: 440, armor: 140, speed: 1.4, r: 0.45, color: '#b04a7a', keep: 5.5, phases: [
      { atk: ['fan', 'ring'], gap: 1.5 }, { atk: ['fan', 'spiral', 'blink'], gap: 1.3, arena: 'pillars', add: ['hexer', 1] }, { atk: ['spiral', 'ring', 'blink', 'rain'], gap: 1.0, arena: 'clear', add: ['runner', 3] } ] },
    mold:     { name: 'DER SCHIMMEL',     hp: 560, armor: 120, speed: 1.0, r: 0.60, color: '#4f8a3a', keep: 3.5, phases: [
      { atk: ['pools', 'fan'], gap: 1.6 }, { atk: ['trail', 'pools', 'ring'], gap: 1.3, arena: 'hazards', add: ['bloater', 2] }, { atk: ['trail', 'pools', 'rain', 'spiral'], gap: 1.0, arena: 'hazards', add: ['bloater', 2] } ] },
    golem:    { name: 'DER MUELLBERG',    hp: 700, armor: 260, speed: 0.9, r: 0.75, color: '#5a5a62', keep: 1.5, phases: [
      { atk: ['slam', 'rain'], gap: 1.8 }, { atk: ['slam', 'leap', 'summon'], gap: 1.5, arena: 'pillars', add: ['bloater', 2] }, { atk: ['leap', 'slam', 'rain', 'ring'], gap: 1.1, arena: 'clear', add: ['bloater', 2] } ] },
    dj:       { name: 'DJ BASSDROP',      hp: 460, armor: 150, speed: 1.3, r: 0.50, color: '#3a6ac0', keep: 4.5, phases: [
      { atk: ['ring', 'fan'], gap: 1.4 }, { atk: ['spiral', 'ring', 'slam'], gap: 1.2, arena: 'pillars', add: ['runner', 2] }, { atk: ['spiral', 'ring', 'rain', 'blink'], gap: 0.9, arena: 'clear', add: ['spitter', 2] } ] },
    grossvermueller: { name: 'ADOLFI HITLER', hp: 950, armor: 320, speed: 1.3, r: 0.6, color: '#2b2a2e', keep: 3, final: true, phases: [   // final boss of the bunker (fictional)
      { atk: ['charge', 'rain', 'fan'], gap: 1.4 }, { atk: ['slam', 'spiral', 'rain', 'charge'], gap: 1.15, arena: 'lava', add: ['brute', 1] }, { atk: ['spiral', 'ring', 'leap', 'rain', 'summon'], gap: 0.85, arena: 'lava', add: ['hexer', 1] } ] },
    rat:      { name: 'DER RATTENKOENIG', hp: 420, armor: 100, speed: 2.2, r: 0.45, color: '#8a5a4a', keep: 2.5, phases: [
      { atk: ['leap', 'fan'], gap: 1.2 }, { atk: ['leap', 'trail', 'summon'], gap: 1.0, arena: 'pillars', add: ['runner', 3] }, { atk: ['leap', 'leap', 'trail', 'rain', 'summon'], gap: 0.8, arena: 'clear', add: ['runner', 3] } ] }
  },
  abilitySets: { walker: ['enrage'], runner: ['pounce'], spitter: ['spread', 'backstep'], brute: ['charge', 'pound'], bloater: ['deathBlast'], hexer: ['summon'], boss: [] },
  xp: { walker: 8, runner: 6, spitter: 10, brute: 22, boss: 120, room: 10, base: 48, grow: 30 },   // slower levels in the run
  skillCostMul: 2,                                                                                     // permanent skills cost 2x the listed trash; run skills cost +1 SP per level   // run XP -> levels -> skill points (SP)
  skills: [   // tree nodes. kind 'perm' = paid with banked trash in the kitchen; 'run' = paid with SP from XP in a run (reset every run)
    // KAMPF (north)
    { id: 'dmg',   branch: 'combat', kind: 'perm', gx: 0,  gy: -1, ic: 'DMG', name: 'Besenstiel+',     desc: '+10% Schaden',            max: 5, cost: [4, 6, 9, 13, 19], stat: 'dmg',   per: 0.10 },
    { id: 'r_fury', branch: 'combat', kind: 'run',  gx: 0,  gy: -2, ic: 'WUT', name: 'Wutanfall',       desc: '+15% Schaden (Run)',      max: 3, cost: [1, 1, 2],         stat: 'dmg',   per: 0.15, req: [['dmg', 1]] },
    { id: 'crit',  branch: 'combat', kind: 'perm', gx: -1, gy: -2, ic: 'CRT', name: 'Glueckstreffer',  desc: '+4% Crit-Chance',         max: 4, cost: [5, 8, 12, 17],    stat: 'crit',  per: 0.04, req: [['dmg', 2]] },
    { id: 'back',  branch: 'combat', kind: 'perm', gx: 1,  gy: -2, ic: 'HIN', name: 'Hinterhaeltig',   desc: '+10% Backstab-Schaden',   max: 3, cost: [5, 9, 14],        stat: 'back',  per: 0.10, req: [['dmg', 2]] },
    { id: 'r_eye', branch: 'combat', kind: 'run',  gx: -1, gy: -3, ic: 'AUG', name: 'Scharfe Augen',   desc: '+6% Crit (Run)',          max: 3, cost: [1, 1, 2],         stat: 'crit',  per: 0.06, req: [['crit', 1]] },
    { id: 'r_slam', branch: 'combat', kind: 'run', gx: 1,  gy: -3, ic: 'WND', name: 'Wandbrecher',     desc: '+30% Wall-Slam (Run)',    max: 3, cost: [1, 1, 2],         stat: 'slam',  per: 0.30, req: [['back', 1]] },
    // BEWEGUNG (east)
    { id: 'speed', branch: 'move', kind: 'perm', gx: 1, gy: 0, ic: 'TMP', name: 'Flinke Socken',     desc: '+5% Tempo',               max: 4, cost: [4, 7, 11, 16],    stat: 'speed', per: 0.05 },
    { id: 'dash',  branch: 'move', kind: 'perm', gx: 2, gy: 0, ic: 'DSH', name: 'Rutschige Fliesen', desc: '-8% Dash-Cooldown',       max: 4, cost: [4, 7, 11, 16],    stat: 'dash',  per: 0.08, req: [['speed', 2]] },
    { id: 'iframe', branch: 'move', kind: 'perm', gx: 3, gy: 0, ic: 'IFR', name: 'Reaktion',         desc: '+0.02s Dash-I-Frames',    max: 3, cost: [5, 9, 14],        stat: 'iframe', per: 0.02, req: [['dash', 2]] },
    { id: 'r_sprint', branch: 'move', kind: 'run', gx: 2, gy: 1, ic: 'ADR', name: 'Adrenalin',       desc: '+8% Tempo (Run)',         max: 3, cost: [1, 1, 2],         stat: 'speed', per: 0.08, req: [['speed', 1]] },
    { id: 'r_cd',  branch: 'move', kind: 'run',  gx: 3, gy: 1, ic: 'FUS', name: 'Fussballer',        desc: '-10% Dash-CD (Run)',      max: 3, cost: [1, 1, 2],         stat: 'dash',  per: 0.10, req: [['dash', 1]] },
    // TRANSPORT (south)
    { id: 'cap',   branch: 'carry', kind: 'perm', gx: 0,  gy: 1, ic: 'RCK', name: 'Starker Ruecken',  desc: '+1 Rucksack-Platz',       max: 3, cost: [6, 10, 16],       stat: 'cap',   per: 1 },
    { id: 'carry', branch: 'carry', kind: 'perm', gx: 0,  gy: 2, ic: 'ROL', name: 'Rollwagen',        desc: '-20% Muell-Verlangsamung', max: 3, cost: [5, 9, 14],       stat: 'carry', per: 0.2, req: [['cap', 1]] },
    { id: 'luck',  branch: 'carry', kind: 'perm', gx: -1, gy: 2, ic: 'GLK', name: 'Glueckspilz',      desc: '+15% Ausruestungs-Drops', max: 3, cost: [6, 10, 16],       stat: 'luck',  per: 0.15, req: [['carry', 1]] },
    { id: 'r_pack', branch: 'carry', kind: 'run', gx: 1,  gy: 2, ic: 'GRT', name: 'Tragegurt',        desc: '+1 Rucksack-Platz (Run)', max: 2, cost: [1, 2],            stat: 'cap',   per: 1, req: [['cap', 2]] },
    // UEBERLEBEN (west)
    { id: 'hp',    branch: 'surv', kind: 'perm', gx: -1, gy: 0,  ic: 'LEB', name: 'Zaeher Magen',     desc: '+15 Max HP',              max: 5, cost: [3, 5, 8, 12, 18], stat: 'hp',    per: 15 },
    { id: 'armor', branch: 'surv', kind: 'perm', gx: -2, gy: 0,  ic: 'PNZ', name: 'Abgehaertet',      desc: '+3 Panzer',               max: 4, cost: [4, 7, 11, 16],    stat: 'armor', per: 3,    req: [['hp', 2]] },
    { id: 'heal',  branch: 'surv', kind: 'perm', gx: -3, gy: 0,  ic: 'HEI', name: 'Erholung',         desc: '+4 HP pro Raum',          max: 3, cost: [5, 9, 14],        stat: 'heal',  per: 4,    req: [['armor', 1]] },
    { id: 'r_vamp', branch: 'surv', kind: 'run', gx: -2, gy: -1, ic: 'BLU', name: 'Blutdurst',        desc: '+2 HP pro Kill (Run)',    max: 3, cost: [1, 1, 2],         stat: 'vamp',  per: 2,    req: [['hp', 1]] },
    { id: 'r_tough', branch: 'surv', kind: 'run', gx: -3, gy: -1, ic: 'ZAE', name: 'Zaehigkeit',      desc: '+12 Max HP (Run)',        max: 3, cost: [1, 1, 2],         stat: 'hp',    per: 12,   req: [['armor', 1]] }
  ],
  run:    { bossEvery: 5, biomeOrder: [1, 2, 3, 4], tierHp: 0.45, tierDmg: 0.25, roomHp: 0.06, roomDmg: 0.03,   // biome order: Flur, Bad, Keller, Bunker (the hub stays our kitchen)
            healRoom: 15, healBoss: 40, hpScale: 0.08, hpBase: 1.5, dmgScale: 0.04, fade: 0.3,
            boss: { hp: [1.2, 2.4, 3.6, 4.6], dmg: [1.1, 1.5, 1.95, 2.45], gap: [1, 0.9, 0.82, 0.75], loopHp: 0.8, loopDmg: 0.25 },   // per boss number: boss 1 is fair, boss 4 needs a well-upgraded character
            winBonus: 40 },                                                                     // extra trash for beating the final boss   // endless run, boss + container every 5th room
  biomes: [                                                                         // biome changes after each boss
    { name: 'KUECHE', col: { floorA: '#2a2733', floorB: '#242130', wallTop: '#4a4458', wallL: '#2c2836', wallR: '#1c1924' } },
    { name: 'FLUR',   col: { floorA: '#2d2a22', floorB: '#26231c', wallTop: '#5a4f3a', wallL: '#352f22', wallR: '#211d15' } },
    { name: 'BAD',    col: { floorA: '#223034', floorB: '#1c282c', wallTop: '#3f6068', wallL: '#233a40', wallR: '#16262a' } },
    { name: 'KELLER', col: { floorA: '#2a2224', floorB: '#231c1e', wallTop: '#58393f', wallL: '#33202a', wallR: '#1f1318' } },
    { name: 'BUNKER', col: { floorA: '#3a3634', floorB: '#322e2c', wallTop: '#5a524c', wallL: '#2a2522', wallR: '#3c3530' } } ],
  trash: { cap: 6, slow: 0.25, pickR: 1.0, depositR: 1.4, hitDelay: 0.8,   // cap in weight units; slow = max move penalty
           kinds: { bag:   { name: 'Muellsack', w: 1, v: 1, col: '#3b4a3a', hi: '#7ba06a' },
                    crate: { name: 'Muellkiste', w: 2, v: 3, col: '#6a5030', hi: '#b08a50' },
                    can:    { name: 'Dose', w: 1, v: 1 }, bottle: { name: 'Flasche', w: 1, v: 1 }, banana: { name: 'Bananenschale', w: 1, v: 1 },   // look of the 1-slot trash
                    box:    { name: 'Pappkarton', w: 2, v: 3 } },                                                                         // look of the 2-slot trash
           start: ['bag', 'bag', 'bag', 'crate'],
           drops: { walker: ['bag', 0.3], runner: ['bag', 0.2], bloater: ['bag', 0.5], hexer: ['bag', 0.5], spitter: ['bag', 0.3], brute: ['crate', 0.7], boss: ['crate', 1, 3] } },   // [kind, chance, count]
  col:    { outline:'#000', floorA:'#2a2733', floorB:'#242130', wallTop:'#4a4458', wallL:'#2c2836', wallR:'#1c1924',
            player:'#c9553b', playerHi:'#f08a4b', iframe:'#8fe9ff' }
};
const ROOM_KITCHEN = [   // hub: 'P' spawn (Pool of Styx), 'T' skill terminal, 'D' run door
  "##################",
  "#...G...T...W....#",
  "#..##........##..#",
  "#..#..........#..#",
  "#................#",
  "#......####......#",
  "#.......P........D",
  "#......####......#",
  "#................#",
  "#..#..........#..#",
  "#..##........##..#",
  "#................#",
  "#................#",
  "##################"
];
