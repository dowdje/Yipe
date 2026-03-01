# Quest of Grymhold

A retro-style tile-based RPG built with vanilla JavaScript and HTML5 Canvas. No frameworks, no build tools — just open `index.html` and play.

## Play

Serve the directory with any static server:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move |
| Click | Move toward tile |
| Enter / Space | Confirm (combat action, buy item) |
| Up / Down | Browse menu (combat, shop) |
| Escape / Backspace | Exit shop |

## Game Overview

You start in **Grymhold**, a small town with two screens. Head east to find the **Cave** dungeon with three rooms of increasing difficulty. Fight enemies, earn gold, buy upgrades, and survive.

### Combat
- Turn-based, speed determines who goes first
- Actions: **Attack**, **Defend** (halves incoming damage), **Flee**
- Victory awards gold and EXP
- Defeat costs **50% of your gold** and respawns you at Grymhold Town Center

### Shops
- **Potion Shop** (Town Center) — HP Potion (8G), MP Potion (8G)
- **Gear Shop** (East Quarter) — ATK Ring (25G), DEF Shield (25G), SPD Boots (25G)
- Bump into the colored NPC squares to open the shop

### Enemies
| Enemy | HP | ATK | DEF | SPD | Gold | EXP |
|---|---|---|---|---|---|---|
| Bat | 8 | 3 | 1 | 6 | 3 | 5 |
| Slime | 12 | 4 | 2 | 2 | 5 | 8 |
| Goblin | 18 | 6 | 3 | 4 | 10 | 15 |

### World Map
```
town_1 ←→ town_2 ←→ cave room_1
                          ↕
                     cave room_2
                          ↕
                     cave room_3
```

## Project Structure

```
├── index.html              # Entry point
├── css/style.css            # Canvas sizing and layout
├── data/
│   ├── tiles.json           # Tile definitions (color, walkable)
│   └── rooms/
│       ├── grymhold/        # Town rooms
│       │   ├── town_1.json
│       │   └── town_2.json
│       └── cave_1/          # Dungeon rooms
│           ├── room_1.json
│           ├── room_2.json
│           └── room_3.json
└── js/
    ├── main.js              # Game loop, state machine, input routing
    ├── config.js            # Constants: tile size, colors, enemy/shop types, player defaults
    ├── engine/
    │   ├── renderer.js      # Canvas drawing primitives
    │   ├── input.js         # Keyboard + click input handling
    │   └── save.js          # localStorage save/load
    ├── game/
    │   ├── player.js        # Player state, movement tweening, collision
    │   ├── world.js         # Room loading, tile collision, exits, shop NPC tracking
    │   ├── enemies.js       # Enemy spawning and per-room tracking
    │   ├── combat.js        # Turn-based combat engine
    │   └── shop.js          # Shop state, item definitions, buy logic
    └── ui/
        ├── hud.js           # Overworld HUD (HP/MP bars, gold, level)
        ├── combat-ui.js     # Combat screen rendering
        └── shop-ui.js       # Shop screen rendering
```

## Technical Details

- **16x12 tile grid**, 32px per tile, 512x384 native canvas (scales up via CSS)
- **ES modules** — no bundler, loaded directly with `<script type="module">`
- **Game state machine**: OVERWORLD, TRANSITION, COMBAT, SHOP
- **Room format**: JSON files with tile grid (2D array of tile IDs), exits, enemy/shop spawn points
- **Save system**: localStorage, saves room + player position on each move
- **No sprites**: Everything is colored rectangles — player (gold), enemies (per-type color), shop NPCs (per-shop color)
