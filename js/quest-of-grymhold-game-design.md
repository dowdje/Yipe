# Quest of Grymhold — Game Design Document

## 1. Overview & Vision

**Working Title:** Quest of Grymhold
**Genre:** 2D Grid-Based Adventure RPG
**Platform:** Web (HTML5 Canvas / JavaScript) — playable in browser
**Inspiration:** Quest of Yipe! III by Kevin Kinell (1997)
**Tone:** Light-hearted, humorous, and self-aware — parody RPG with charm

### Vision Statement
A single-player, grid-based RPG where you explore an interconnected world of towns, caves, forests, and dungeons. Movement is tile-by-tile on a 2D grid. Combat is turn-based and encounter-driven (touching a monster sprite on the map initiates a fight). The game has a retro pixel-art aesthetic reminiscent of early Mac shareware RPGs, but with modern quality-of-life improvements and deeper systems than its inspiration.

### What Made Yipe III Special (Core Pillars to Preserve)
- **Simplicity of movement**: Click or arrow-key to move one tile at a time on a grid
- **Monsters visible on the map**: No random encounters — you see enemies on the grid and walk into them to fight
- **Screen-by-screen exploration**: The world is divided into discrete screens/rooms that you transition between by walking off an edge
- **Humorous tone**: Silly items (cheeseburgers as healing items), absurd quests (finding a stamp collection), quirky NPC dialogue
- **Addictive loop**: Explore → fight → loot gold → buy better gear → explore further → repeat
- **Multiple quest threads**: Main quest + side quests (rescue princesses, collect stamps, etc.)
- **Death is not permanent**: Sent to an underworld/afterlife, pay a fee or fight the gatekeeper to return
- **Difficulty modes**: Easy, Normal, Hard (+ a "Silly" mode that renames all items)
- **Casino/minigames**: A fun diversion from the main adventure
- **Level-scaled encounters**: Higher player level = tougher monsters start appearing, but weak ones never disappear
- **Food-based healing**: Cheeseburgers, pizza, etc. instead of generic potions
- **Treasure chests scattered throughout the world**
- **Spell shop**: Learn new spells upon reaching certain levels by visiting a wizard
- **Equipment progression**: Buy/find better weapons and armor from shops and chests

---

## 2. Core Gameplay Systems

### 2.1 World Structure

The game world is composed of **discrete screen-sized rooms** arranged on a grid. Each room is a tile grid (suggested: **16×12 tiles**, each tile 32×32 pixels, giving a 512×384 play area that scales well).

**Region Types:**
| Region | Description | Visual Theme |
|--------|-------------|--------------|
| **Towns** | Safe zones with shops, NPCs, quest givers, inns | Stone buildings, market stalls, cobblestone |
| **Overworld** | Open terrain connecting towns and dungeons | Grass, paths, trees, rivers, bridges |
| **Caves** | Multi-room dungeons with monsters and loot | Dark stone walls, torches, underground water |
| **Forests** | Dense outdoor areas with hidden paths | Trees, underbrush, clearings, stumps |
| **Mountains** | High-altitude areas, late-game content | Snow, rocky terrain, narrow passes |
| **Underworld (Hell)** | Where you go when you die — gatekeeper resides here | Fire, brimstone, dark red palette |
| **Special** | Casino, wizard tower, throne room, etc. | Unique per location |

**Room Transitions:** Walking off the edge of a screen transitions to the adjacent room. Some transitions require keys or quest flags.

**Room Data Format (JSON):**
```json
{
  "id": "cave_1_room_3",
  "region": "cave_1",
  "width": 16,
  "height": 12,
  "tiles": [[...]], // 2D array of tile IDs
  "exits": {
    "north": "cave_1_room_1",
    "east": null,
    "south": "cave_1_room_5",
    "west": "cave_1_room_2"
  },
  "entities": [
    { "type": "monster", "monsterId": "goblin", "x": 8, "y": 5, "respawn": true },
    { "type": "chest", "lootTable": "cave_1_loot", "x": 14, "y": 2, "oneTime": true },
    { "type": "npc", "npcId": "lost_miner", "x": 3, "y": 9 }
  ],
  "hazards": [
    { "type": "spike", "x": 6, "y": 4, "damage": 5 },
    { "type": "pit", "x": 10, "y": 7, "destination": "cave_1_room_8" },
    { "type": "warp", "x": 2, "y": 2, "destination": "cave_2_room_1" }
  ],
  "locked": { "direction": "north", "requires": "silver_key" }
}
```

### 2.2 Player Character

**Creation:** At game start, the player chooses:
- **Name** (text input)
- **Appearance** (select from 6-8 sprite options — knight, mage, rogue, ranger, etc.)
- **Difficulty** (Easy / Normal / Hard)
- **Mode** (Normal / Silly — silly mode renames items humorously)

**Core Stats:**
| Stat | Description | Growth |
|------|-------------|--------|
| **HP** | Health points — reach 0 and you go to the Underworld | +3-8 per level (varies by difficulty) |
| **MP** | Mana for casting spells | +2-5 per level |
| **ATK** | Base physical attack power | +1-3 per level |
| **DEF** | Damage reduction from physical attacks | +1-2 per level |
| **SPD** | Determines turn order and dodge chance | +0-1 per level |
| **LCK** | Affects critical hit chance, loot quality, casino games | +0-1 per level |

**Level Progression:**
- XP required per level follows a curve: `xpForLevel(n) = Math.floor(50 * n * 1.5)`
- Max level: 50
- Each level: stats increase, and at certain levels new spells become available at the spell shop

**Equipment Slots:**
- Weapon (sword, axe, staff, dagger, etc.)
- Armor (body)
- Shield (off-hand)
- Accessory (ring, amulet — new vs Yipe III for added depth)

### 2.3 Combat System

**Encounter Trigger:** Player walks into a monster sprite on the grid map. The screen transitions to a **combat overlay** (the map dims and a combat UI appears, showing the player and monster(s) face-to-face — similar to classic Yipe).

**Turn-Based Flow:**
1. **Player turn** — choose an action:
   - **Attack** — basic physical attack using equipped weapon
   - **Spell** — cast a learned spell (costs MP)
   - **Ability** — use a special combat ability (Backstab, Invisibility, etc.)
   - **Item** — use a consumable from inventory (food to heal, etc.)
   - **Flee** — attempt to run (chance based on SPD vs monster SPD)
2. **Enemy turn** — each enemy acts (attack, special ability, etc.)
3. Repeat until all enemies are dead or player flees/dies.

**Multi-Monster Encounters (inherited from Yipe III):**
- A single monster sprite on the map can turn out to be 1-3 enemies
- Enemies in a group can be of different types (e.g., goblin + bat)
- Player uses arrow keys or clicks to switch between targets
- **New complexity:** Some enemies have synergy effects (e.g., a Shaman buffs adjacent allies)

**Damage Formula:**
```
baseDamage = attacker.ATK + weapon.power + random(-2, 2)
defense = defender.DEF + armor.defense
finalDamage = max(1, baseDamage - defense)
critChance = 5% + (attacker.LCK * 0.5%)
critMultiplier = 1.5x
```

**Rewards:**
- Gold (always)
- XP (always)
- Item drop (% chance from monster's loot table)

### 2.4 Spells & Abilities

**Spells** are learned by visiting the Wizard (named "Dlohmyrg" — the town name backwards, a nod to Yipe's wizard "Epiy"). Spells unlock at specific levels and cost gold to learn.

| Spell | Level Req | MP Cost | Effect |
|-------|-----------|---------|--------|
| Spark | 3 | 4 | Light damage to one enemy |
| Heal | 5 | 6 | Restore moderate HP |
| Flame Burst | 10 | 10 | Medium fire damage to one enemy |
| Shield Aura | 14 | 8 | Increase DEF for 3 turns |
| Frost Wave | 18 | 14 | Damage all enemies (ice) |
| Health Siphon | 22 | 12 | Drain HP from enemy, heal self |
| Lightning Storm | 28 | 20 | Heavy damage to all enemies |
| Invisibility | 34 | 18 | Avoid enemy attacks for 2 turns |
| Resurrect | 40 | 30 | Revive with 50% HP if you die (pre-cast) |
| Cataclysm | 46 | 40 | Massive damage to all enemies |

**Abilities** (non-magical skills, separate from spells):
| Ability | Level Req | Effect |
|---------|-----------|--------|
| Backstab | 8 | Double damage if you attack first |
| Parry | 12 | Block next incoming attack |
| War Cry | 16 | Increase ATK for 3 turns |
| Double Strike | 24 | Attack twice in one turn |
| Evasion | 30 | Greatly increase dodge for 1 turn |

### 2.5 Items & Economy

**Consumables (Food-Based Healing — Core Yipe Identity):**
| Item | HP Restored | Cost | Silly Mode Name |
|------|-------------|------|-----------------|
| Stale Bread | 10 | 5g | "Cardboard Slice" |
| Apple | 20 | 12g | "Suspicious Orb" |
| Cheeseburger | 50 | 30g | "Meat Disc Deluxe" |
| Pizza Slice | 80 | 55g | "Triangle of Power" |
| Gourmet Feast | 150 | 100g | "Fancy Pants Dinner" |
| Elixir of Life | Full HP + MP | 500g | "Sparkling Juice Box" |

**MP Recovery:**
| Item | MP Restored | Cost |
|------|-------------|------|
| Weak Tea | 10 | 15g |
| Strong Coffee | 30 | 40g |
| Wizard's Brew | Full MP | 200g |

**Key Items (Quest-Related):**
- Stamps (collectible set for main quest)
- Keys (Silver, Gold, Rainbow — unlock specific doors)
- Princess Tokens (proof of princess rescue)
- Raft Pass (allows water traversal)
- Waterproof Shoe Spray (prevents pit damage — nod to Yipe)

**Shops:**
- **Weapon Shop** — progressively better weapons
- **Armor Shop** — progressively better armor and shields
- **General Store** — consumables, keys, accessories
- **Spell Shop (Wizard)** — learn spells for gold (level-gated)
- **Inn** — full HP/MP restoration for a fee

### 2.6 Death & The Underworld

When HP reaches 0:
1. Screen transitions to **The Underworld** — a small area with the Gatekeeper
2. The Gatekeeper offers a deal: pay a gold fee (scales with level) to be revived and returned to the last town visited
3. **Alternative:** Fight the Gatekeeper — if you win, you leave for free but HP is NOT restored (risky)
4. If you can't pay and can't win the fight — you remain in the Underworld (can grind low-level underworld monsters for gold, then pay to leave)
5. **New addition:** A merchant in the Underworld sells unique "cursed" items not available elsewhere

### 2.7 Level Scaling

Monsters are placed on specific room tiles and always exist there. However, the VARIANT of monster that appears scales with player level:

```
Example for a "forest" room monster spawn:
- Level 1-5: Rabbit (very weak)
- Level 3-10: Forest Imp
- Level 8-15: Wild Boar
- Level 12-20: Forest Troll
- Level 18+: Ancient Treant
```

Low-level monsters never stop appearing — there is always a chance of encountering an easy fight, preserving the casual feel. Higher-level monsters are added to the pool, not replacing lower ones.

---

## 3. Quest & Story Structure

### 3.1 Main Quest: The King's Stamps

The King of Grymhold has had his prized stamp collection stolen. The stamps are scattered across the world, each guarded by a **Boss Monster** in a different dungeon. Defeating each boss yields a stamp. Collecting all stamps and returning them to the King triggers the final chapter.

**Stamp Locations (7 total):**
1. **Cave of Beginnings** — Boss: Giant Spider (tutorial dungeon)
2. **Darkwood Hollow** — Boss: Shadow Wolves Alpha
3. **Sunken Mines** — Boss: Crystal Golem
4. **Frost Peak Cavern** — Boss: Ice Wyrm
5. **Volcanic Depths** — Boss: Magma Lord
6. **The Forbidden Library** — Boss: Cursed Librarian
7. **The Void Rift** — Boss: Chaos Entity (final stamp)

After all 7 stamps: The King reveals the true villain — his own court jester, who orchestrated everything. Final dungeon unlocks: **The Jester's Domain**, leading to the **Final Boss**.

### 3.2 Side Quest: The Missing Princesses

The King has **12 daughters** (yes, twelve). They've gone missing — some kidnapped, some lost, some ran away intentionally. Each princess is found in a different location and has a unique personality/mini-story.

**Example Princesses:**
| # | Name | Location | Situation |
|---|------|----------|-----------|
| 1 | Elara | Cave of Beginnings | Trapped behind a locked door |
| 2 | Mira | Darkwood Hollow | Living with forest creatures, doesn't want to leave |
| 3 | Tessa | Town of Millbrook | Working at the inn under a fake name |
| 4 | Nyx | The Underworld | Made a deal with the Gatekeeper |
| 5 | Coral | Sunken Mines | Turned to stone, needs a specific item |
| 6-12 | ... | Various | Each has a unique puzzle or requirement |

**Reward:** Increasing gold rewards per princess returned + a unique accessory after all 12.

### 3.3 Side Quest: Monster Compendium

**New addition for complexity:** A scholar in town asks you to catalog every monster type. Defeating a monster adds it to your compendium. Completing tiers of the compendium unlocks rewards.

### 3.4 Side Quest: The Casino

A building in the main town (or a dedicated location) contains **4 minigames:**
- **Darts** — Skill-based targeting game
- **Slots** — Luck-based, themed with monster faces
- **Card Match** — Memory/matching card game
- **Monster Arena** — Bet on simulated monster fights

Casino winnings are paid in gold. Some unique items are ONLY purchasable with "Casino Tokens" earned from big wins.

---

## 4. World Map & Region Layout

```
                    [Frost Peak]
                        |
    [Volcanic      [Mountain Pass]    [Forbidden
     Depths]            |              Library]
        \          [Highlands]          /
         \             |               /
  [Western    ---[GRYMHOLD]---    [Eastern
   Wilds]     |    (Main Town)  |   Forest]
              |        |        |
         [Darkwood  [River     [Sunken
          Hollow]   Crossing]   Mines]
                       |
                 [Southern
                  Plains]
                       |
                 [The Void Rift]
```

Each named region contains **4-15 room screens** with interconnected exits. Total world size target: **~120-150 rooms**.

---

## 5. Technical Architecture

### 5.1 Tech Stack
- **Language:** JavaScript (ES6+)
- **Rendering:** HTML5 Canvas (2D context)
- **No framework required** — vanilla JS for simplicity and portability
- **Asset format:** PNG spritesheets for tiles, characters, monsters, items
- **Data format:** JSON for all room definitions, monster stats, item databases, dialogue
- **Save system:** localStorage (auto-save on room transition + manual save at inns)
- **Sound:** Web Audio API for SFX, optional chiptune BGM

### 5.2 Project File Structure
```
/quest-of-grymhold/
├── index.html              # Entry point
├── css/
│   └── style.css           # Minimal styling for canvas wrapper and UI
├── js/
│   ├── main.js             # Game loop, initialization
│   ├── config.js           # Constants, game settings
│   ├── engine/
│   │   ├── renderer.js     # Canvas drawing, camera, tile rendering
│   │   ├── input.js        # Keyboard and mouse/touch input handling
│   │   ├── audio.js        # Sound effects and music manager
│   │   └── save.js         # Save/load system (localStorage)
│   ├── game/
│   │   ├── world.js        # Room loading, transitions, tile collision
│   │   ├── player.js       # Player state, stats, movement, inventory
│   │   ├── combat.js       # Turn-based combat system
│   │   ├── monsters.js     # Monster definitions, AI, scaling
│   │   ├── items.js        # Item definitions, equipment, consumables
│   │   ├── spells.js       # Spell and ability definitions, effects
│   │   ├── quests.js       # Quest state tracking, flags, progression
│   │   ├── npcs.js         # NPC dialogue, shops, interactions
│   │   ├── casino.js       # Minigame implementations
│   │   └── underworld.js   # Death handling, gatekeeper logic
│   └── ui/
│       ├── hud.js          # Health bar, gold, level display
│       ├── menu.js         # Pause menu, inventory, equipment, spells
│       ├── dialogue.js     # Text box system for NPC conversations
│       ├── combat-ui.js    # Combat overlay interface
│       └── shop-ui.js      # Shop interaction interface
├── data/
│   ├── rooms/              # JSON files for each room
│   │   ├── grymhold/       # Main town rooms
│   │   ├── cave_1/         # Cave of Beginnings
│   │   ├── darkwood/       # Darkwood Hollow
│   │   └── ...             # One folder per region
│   ├── monsters.json       # All monster definitions
│   ├── items.json          # All item definitions
│   ├── spells.json         # Spell and ability data
│   ├── npcs.json           # NPC dialogue trees
│   ├── quests.json         # Quest definitions and conditions
│   └── loot-tables.json    # Loot drop tables
├── assets/
│   ├── sprites/
│   │   ├── player/         # Player character sprite sheets
│   │   ├── monsters/       # Monster sprites (static images, like Yipe)
│   │   ├── npcs/           # NPC sprites
│   │   └── items/          # Item icons
│   ├── tiles/
│   │   ├── overworld.png   # Overworld tileset
│   │   ├── cave.png        # Cave/dungeon tileset
│   │   ├── town.png        # Town tileset
│   │   └── interior.png    # Building interior tileset
│   ├── ui/
│   │   ├── combat-bg.png   # Combat overlay backgrounds
│   │   ├── hud.png         # HUD elements
│   │   └── menu.png        # Menu backgrounds/frames
│   └── audio/
│       ├── sfx/            # Sound effects
│       └── music/          # Background music (optional)
└── tools/
    └── room-editor.html    # Simple visual room editor (optional dev tool)
```

### 5.3 Game Loop

```javascript
// Core game loop structure
const TICK_RATE = 1000 / 60; // 60 FPS target

function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    switch (gameState) {
        case 'TITLE':       updateTitle(); break;
        case 'OVERWORLD':   updateOverworld(delta); break;
        case 'COMBAT':      updateCombat(delta); break;
        case 'DIALOGUE':    updateDialogue(); break;
        case 'MENU':        updateMenu(); break;
        case 'SHOP':        updateShop(); break;
        case 'CASINO':      updateCasino(delta); break;
        case 'TRANSITION':  updateTransition(delta); break;
    }

    render(gameState);
    requestAnimationFrame(gameLoop);
}
```

### 5.4 Tile & Rendering System

Each room is a 2D grid rendered tile-by-tile onto the canvas. Tiles have properties:
```json
{
  "0": { "name": "grass", "walkable": true, "sprite": [0, 0] },
  "1": { "name": "wall", "walkable": false, "sprite": [1, 0] },
  "2": { "name": "water", "walkable": false, "sprite": [2, 0], "raftable": true },
  "3": { "name": "door", "walkable": true, "sprite": [3, 0], "interactable": true },
  "4": { "name": "spike", "walkable": true, "sprite": [4, 0], "damage": 5 }
}
```

Sprites are static (like Yipe — no animation frames required, though idle bobbing is a nice touch). Monsters, NPCs, chests, and the player are drawn as entity layers on top of the tile grid.

### 5.5 Save System

```javascript
const saveData = {
    player: { name, level, xp, hp, maxHp, mp, maxMp, stats, gold },
    equipment: { weapon, armor, shield, accessory },
    inventory: [ { id, quantity } ],
    spellsLearned: ['spark', 'heal'],
    abilitiesLearned: ['backstab'],
    questFlags: { stamps: [true, false, ...], princessesRescued: [1, 3, 5] },
    currentRoom: 'grymhold_town_1',
    visitedRooms: ['grymhold_town_1', 'cave_1_room_1', ...],
    chestsOpened: ['cave_1_chest_1'],
    monsterCompendium: ['rabbit', 'goblin'],
    difficulty: 'normal',
    sillyMode: false,
    playTime: 14523 // seconds
};
```

---

## 6. Art Direction & Visual Style

### 6.1 Aesthetic
- **Pixel art, 32×32 tile grid** — clean, readable sprites
- **Limited color palette per region** (e.g., forest = greens/browns, cave = grays/blues, underworld = reds/blacks)
- **Static sprites** for monsters (like Yipe) — charming and simple
- **Minimal animation** — player has 4 directional sprites, idle bob. Combat has simple hit flash effects
- **UI is clean and functional** — health/mana bars, gold counter, simple text boxes with borders
- **The feel of a game you'd find on a 1990s Mac** but with slightly more polish

### 6.2 Combat Screen Layout
```
┌──────────────────────────────────────┐
│  [Monster Area - centered sprites]   │
│                                      │
│     🐺  👹  🦇                       │
│         Monster Name(s) + HP bars    │
│                                      │
│──────────────────────────────────────│
│  [Player Area]                       │
│  Player Name  HP: ████░░ 65/100      │
│               MP: ███░░░ 30/60       │
│                                      │
│  > Attack    Spell    Ability        │
│    Item      Flee                    │
│                                      │
│  [Combat Log - scrolling text]       │
│  "You dealt 12 damage to Goblin!"   │
│  "Goblin attacks for 5 damage!"     │
└──────────────────────────────────────┘
```

### 6.3 HUD Layout (Overworld)
```
┌──────────────────────────────────────┐
│ HP: ████████░░ 80/100   Gold: 1,234 │
│ MP: ██████░░░░ 45/80    Lv: 12      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │      [16×12 TILE GRID]        │  │
│  │      Room play area            │  │
│  │                                │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│ [Location Name]    [Menu] [Save]     │
└──────────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1: Core Engine (Foundation)
- [ ] HTML5 Canvas setup with proper scaling
- [ ] Game loop (requestAnimationFrame)
- [ ] Tile rendering from 2D array data
- [ ] Player sprite rendering and grid movement (arrow keys + click)
- [ ] Room transition system (walk off edge → load adjacent room)
- [ ] Collision detection (non-walkable tiles)
- [ ] Basic HUD (HP, MP, Gold, Level)
- [ ] Simple placeholder art (colored rectangles are fine initially)

### Phase 2: Combat System
- [ ] Monster entity spawning on map tiles
- [ ] Encounter trigger (walk into monster)
- [ ] Combat state machine (player turn → enemy turn → repeat)
- [ ] Attack action with damage formula
- [ ] Enemy AI (basic: attack, occasional special)
- [ ] Combat rewards (gold, XP)
- [ ] Level up system with stat increases
- [ ] Combat UI overlay
- [ ] Flee mechanic

### Phase 3: Items, Equipment & Shops
- [ ] Inventory system (consumables + equipment)
- [ ] Equipment slots and stat modifiers
- [ ] Shop UI (buy/sell)
- [ ] Weapon, armor, and item databases (JSON)
- [ ] Food-based healing items
- [ ] Item drops from monsters (loot tables)
- [ ] Treasure chests on map

### Phase 4: Spells, Abilities & Depth
- [ ] Spell system (MP cost, effects, targeting)
- [ ] Ability system (non-magical combat skills)
- [ ] Wizard NPC and spell shop (level-gated)
- [ ] Multi-monster encounters
- [ ] Status effects (poison, buff, debuff)
- [ ] Monster level scaling

### Phase 5: World Building & Quests
- [ ] NPC dialogue system (text boxes, branching choices)
- [ ] Quest tracking system (flags, conditions)
- [ ] Main quest: stamp collection + boss fights
- [ ] Side quest: princess rescue
- [ ] Death → Underworld → Gatekeeper system
- [ ] Key/lock door mechanics
- [ ] Hazards (spikes, pits, warps)
- [ ] Raft/water traversal

### Phase 6: Content & Polish
- [ ] All regions built out (120-150 rooms)
- [ ] All monsters, items, spells populated
- [ ] Casino minigames
- [ ] Monster compendium
- [ ] Silly mode item renaming
- [ ] Difficulty balancing
- [ ] Save/load system
- [ ] Sound effects
- [ ] Title screen and game over screen
- [ ] Final boss encounter

### Phase 7: Quality of Life & Extras
- [ ] Minimap or area map
- [ ] Quest log UI
- [ ] Monster compendium UI
- [ ] Auto-save on room transition
- [ ] Keyboard shortcuts for combat
- [ ] Touch/mobile support
- [ ] Optional background music
- [ ] Room editor tool (for creating content faster)

---

## 8. Monster Database (Sample)

```json
{
  "rabbit": {
    "name": "Fluffy Rabbit",
    "sillyName": "Dust Bunny of Doom",
    "hp": 5, "atk": 1, "def": 0, "spd": 2,
    "xp": 3, "gold": [1, 3],
    "loot": { "stale_bread": 0.2 },
    "sprite": "rabbit.png",
    "levelRange": [1, 99],
    "description": "It looks harmless. It probably is."
  },
  "goblin": {
    "name": "Cave Goblin",
    "sillyName": "Grumpy Green Guy",
    "hp": 20, "atk": 6, "def": 2, "spd": 4,
    "xp": 12, "gold": [5, 15],
    "loot": { "apple": 0.15, "rusty_dagger": 0.05 },
    "sprite": "goblin.png",
    "levelRange": [3, 15],
    "abilities": ["scratch"],
    "description": "Small, green, and perpetually annoyed."
  },
  "crystal_golem": {
    "name": "Crystal Golem",
    "sillyName": "Fancy Rock Man",
    "hp": 500, "atk": 35, "def": 25, "spd": 3,
    "xp": 300, "gold": [200, 500],
    "loot": { "crystal_shard": 1.0, "stamp_3": 1.0 },
    "sprite": "crystal_golem.png",
    "boss": true,
    "abilities": ["crystal_slam", "reflect_shield"],
    "description": "A massive golem made of living crystal. It guards the third stamp."
  }
}
```

---

## 9. Dialogue System Format

```json
{
  "npc_king": {
    "name": "King Aldric",
    "portrait": "king.png",
    "dialogue": {
      "initial": {
        "text": "Ah, you must be the adventurer! My precious stamps have been stolen, and my daughters are all missing. Terrible business, really.",
        "choices": [
          { "text": "I'll find your stamps!", "next": "accept_quest", "setFlag": "main_quest_started" },
          { "text": "How many daughters do you have?", "next": "daughters_info" },
          { "text": "What's in it for me?", "next": "reward_info" }
        ]
      },
      "accept_quest": {
        "text": "Splendid! Start with the cave just east of town. And do watch out for the monsters — they bite.",
        "choices": [{ "text": "On my way!", "next": null }]
      },
      "daughters_info": {
        "text": "Twelve. Yes, twelve. I know what you're thinking, and yes, naming them was the hardest part of being king.",
        "choices": [{ "text": "...", "next": "initial" }]
      }
    }
  }
}
```

---

## 10. Key Design Principles for Claude Code

When implementing this game with Claude Code, follow these principles:

1. **Start with Phase 1 and get it playable ASAP.** A player moving on a grid with room transitions is the foundation everything else builds on. Use colored rectangles as placeholder graphics.

2. **Data-driven everything.** Rooms, monsters, items, spells, NPCs, and quests should all be defined in JSON files. The game engine reads data — it doesn't hardcode content. This makes it trivially easy to add content later.

3. **State machine architecture.** The game should have clear states (OVERWORLD, COMBAT, DIALOGUE, MENU, SHOP, CASINO, TRANSITION) and only one active at a time. Each state handles its own input and rendering.

4. **Keep the combat system simple but extensible.** Start with Attack + Flee. Add spells and abilities once the base works. The damage formula should be in one place so balancing is easy.

5. **Test with 3-5 rooms first.** Don't build 150 rooms before the engine works. Create a tiny playable loop: town → cave → fight monster → get loot → return to town → buy better gear → go deeper into cave.

6. **Humor is in the data, not the code.** The comedy comes from item names, NPC dialogue, and quest descriptions. The engine itself should be clean and serious. Silly mode is just an alternate string lookup.

7. **The canvas should scale.** Use a fixed internal resolution (512×384 or similar) and CSS-scale the canvas to fit the browser window while maintaining aspect ratio.

8. **Save early, save often.** Implement localStorage saves in Phase 1 so testing doesn't require replaying from scratch.

9. **Pixel art sprites can be generated procedurally or with AI image generation** for prototyping. 32×32 PNGs with transparency. Keep a consistent palette.

10. **Each phase should produce a playable build.** Never have a phase where the game is broken at the end. Each phase adds features to a working game.
