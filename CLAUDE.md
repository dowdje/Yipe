# Claude Rules for GRIDLOCK

## Overview

GRIDLOCK is a retro tile-based RPG built with vanilla JS + HTML5 Canvas. No build step, no npm, no frameworks. Serve the root directory with any HTTP server and open `index.html`.

The game has 3 classes (Bruiser, Fixer, Hacker), tick-based combat, equipment with proc effects, a crafting system, NPC dialogue, quests, a danger meter, perks every 5 levels, an underworld death system, a monster compendium, Web Audio SFX, and an ending sequence.

**Current state:** All phases (1–8B) complete. ~70 rooms across 8 regions (Grymhold, Caves, Underworld, Sewer, Sprawl, Retail Ruins, Gym District, Labs, Consultant's Island). 5 bosses, ~40 enemy types, 8 princess quests, title screen, ending sequence with multiple endings based on princess rescue count.

## How to Run

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Save data is in localStorage under key `gridlock_save_v1`.

## Architecture

### State Machine
`main.js` has a single `state` variable switching on `GAME_STATES`. 14 states: `TITLE`, `OVERWORLD`, `TRANSITION`, `COMBAT`, `DIALOGUE`, `MENU`, `SHOP`, `DEATH`, `CLASS_SELECT`, `CRAFTING`, `PERK`, `COMPENDIUM`, `DEBUG`, `ENDING`. Each state has its own update + render path in the game loop, and key handlers in `initExtraInput()`. Game starts at `TITLE`.

### Module Pattern
All state is in module-level variables (not classes). Modules export getter functions (`getPlayer()`, `getCombat()`, etc.) returning mutable objects. No build step — ES modules loaded directly by browser.

### Circular Dependency Handling
Cross-module refs are wired via init functions called in `main.js`: `initItemsRef()`, `initPlayerRef()`, `initSpellsRef()`, `initShopSpellsRef()`, `initCharItemsRef()`, `initWorldPlayerRef()`, `initBossAiRef()`.

### Canvas Rendering
- Native resolution: 512x384 (16 cols × 12 rows, 32px tiles)
- CSS scales to 1024x768 / 1536x1152 based on viewport
- All drawing through `renderer.js` primitives; UI modules draw directly via `getCtx()`
- 8×8 pixel art sprites defined inline in `js/data/sprites.js`, pre-rendered to offscreen canvases at 4× (overworld) and 6× (combat)

### Room Format
Room JSON files live in `data/rooms/{region}/{room}.json`. Regions: `grymhold`, `caves`, `underworld`, `sewer`, `sprawl`, `retail`, `gym`, `labs`, `island`. Fields:
- `id` — matches file path (e.g., `"grymhold/town_1"`)
- `name` — display name in HUD
- `tiles` — 12×16 2D array of tile IDs (rows × cols)
- `exits` — `{ left?, right?, up?, down? }` → target room ID string, or `{ target, locked }` object for key/lock doors
- `playerStart` — `{x, y}` spawn position
- `enemies` — `[{ type, x, y }]`
- `shops` — `[{ type, x, y }]` (types: `general_store`, `gear_shop`, `spell_shop`, `underworld_shop`)
- `chests` — `[{ x, y, loot: [{ itemId, qty }], gold }]`
- `npcs` — `[{ npcId, x, y }]`
- `campfires` — `[{ x, y }]`
- `safe` — boolean (towns reset danger meter)
- `fixedEnemies` — boolean (use exact enemy types from room JSON instead of level-scaled spawns)

### Entity Interaction
Bump-to-interact: `tryMove()` in `player.js` checks destination tile for shops, NPCs, campfires, chests, enemies. Returns `{ type: 'combat'|'shop'|'npc'|'campfire'|'chest' }`. `main.js` handles the result.

### Combat System
Tick-based timeline: `ticksToAct = floor(80/SPD)`. Faster entities act more frequently. 8 upcoming turns pre-computed and displayed.

**Boss fights:** Boss AI dispatched from `boss-ai.js` via `executeBossTurn()`. Bosses have HP-threshold phases, weighted ability selection with cooldowns, submerge (untargetable) state, and can summon minions. Target cycling (left/right arrows) lets player choose between boss and minions. Boss definitions in `BOSS_DEFS` table.

Key formulas:
- Player attack: `max(1, ATK + weaponPower + rand(0-4) - 2 - enemyDEF) × resistMult × exploitMult × critMult`
- Enemy attack: `max(1, enemyATK - playerDEF) + 1 + floor(rand × 4)`
- Defend: 35% DR (regular), 50% DR (Bruiser Flex)
- Crit: base 5% + 0.5% per LCK, ×1.75 damage
- Flee: always succeeds, costs 10% gold

### Save System
Auto-saves to localStorage after each movement. Key: `gridlock_save_v1`. Saves full player state including materials, quests, perks, compendium, danger, recipes, equipment (as item IDs), difficulty, playtime, bossesDefeated.

## Key Files

### Config & Data
| File | Purpose |
|---|---|
| `js/config.js` | All constants: tile size, game states, ~40 enemy types across 8 regions, player defaults, colors, shop inventories (incl. underworld_shop), damage types, resistances, rarity colors, danger thresholds, level scaling |
| `js/data/classes.js` | 3 classes: Bruiser (Pump resource), Fixer (Combo Points), Hacker (Overclock) |
| `js/data/class-abilities.js` | All class combat abilities with damage formulas. Hacker abilities use `stats.int` |
| `js/data/items.js` | Full item DB: consumables, weapons, armor, accessories, crafted, uniques, key items, NFT drives, damned items, legendary accessories. Also `rollLoot()` and `rollUniqueLoot()` |
| `js/data/spells.js` | 5 utility spells (Heal, Health Siphon, Shield Aura, Invisibility, Resurrect) |
| `js/data/perks.js` | Perk table: 10 milestones (Lv 5–50), 3-4 options each |
| `js/data/quests.js` | Quest definitions (main + 7 princess quests) |
| `js/data/npcs.js` | NPC definitions + dialogue trees (~15 NPCs incl. 8 princesses, innkeeper, guild master, merchants) |
| `js/data/materials.js` | 8 crafting materials |
| `js/data/sprites.js` | 8×8 inline pixel art + palettes for all enemies, tiles, NPCs |
| `js/data/tips.js` | 25 rotating gameplay tips shown on combat victory |

### Engine
| File | Purpose |
|---|---|
| `js/main.js` | Game loop, all state transitions, cross-module wiring, input routing, NPC dialogue handlers (~1300 lines) |
| `js/engine/input.js` | Keyboard (WASD/arrows) + click-to-move |
| `js/engine/renderer.js` | Canvas primitives, sprite cache, tile/entity/player drawing |
| `js/engine/save.js` | localStorage save/load with migration support. Exports `hasSave()`, `getSaveInfo()` for title screen |
| `js/engine/audio.js` | Web Audio API SFX: weakness flash, hit, crit, phase transition, level up, enemy death, boss defeat, damage taken, menu select/navigate, heal, status |

### Game Logic
| File | Purpose |
|---|---|
| `js/game/player.js` | Player state, movement tween, inventory, equip/unequip |
| `js/game/world.js` | Room loading/caching, tile collision, exits (incl. key/lock doors via isExitLocked), NPC/campfire/shop tracking, room hazards |
| `js/game/combat.js` | Full combat engine (~1400 lines): timeline, damage calc, abilities, status effects, procs, material drops, compendium recording, boss target system, minion management, phase transitions |
| `js/game/boss-ai.js` | Boss definitions (BOSS_DEFS) for 5 bosses (Sewer King, The Manager, The Alpha, The Specimen, The Consultant), phase system, weighted ability selection, cooldowns, minion spawning, wave system, multi-head system, executeBossTurn() |
| `js/game/enemies.js` | Enemy spawning with level-based scaling + fixedEnemies mode for dungeons + difficulty multiplier (setDifficulty/getDifficulty/applyDifficultyScaling) |
| `js/game/stats.js` | Effective stat computation: base + equipment + status effects + perk multipliers |
| `js/game/leveling.js` | EXP gain, level-up with class-specific stat growth |
| `js/game/status-effects.js` | 10 status effects (burn, chill, paralyze, poison, enfeeble, ATK/DEF up, haste, regen, shield) |
| `js/game/shop.js` | Shop state, buy/sell logic |
| `js/game/chests.js` | Chest loot + persistent opened-chest tracking |
| `js/game/danger.js` | Danger meter: 5 thresholds, enemy stat/loot modifiers |
| `js/game/procs.js` | Equipment proc framework: 6 effect types (applyStatus, bonusDamage, healPercent, healFlat, damageReflect, selfBuff) |
| `js/game/crafting.js` | ~20 recipes, material checking, recipe discovery |
| `js/game/perks.js` | Perk selection, application, stat modifier queries |
| `js/game/quests.js` | Quest tracking, objective checking |
| `js/game/compendium.js` | Monster kill tracking, resistance discovery, region completion tracking, classified conspiracy notes (unlocked at 100% region discovery) |
| `js/game/underworld.js` | Death fee calculation |

### UI (all render via canvas, no DOM)
| File | Purpose |
|---|---|
| `js/ui/hud.js` | Overworld HUD: HP/MP bars, gold, level, EXP bar, danger meter |
| `js/ui/combat-ui.js` | Combat screen: sprites, timeline bar, actions, log, status icons |
| `js/ui/shop-ui.js` | Shop screen: buy/sell, item comparison, rarity colors |
| `js/ui/character-ui.js` | 4-panel menu: Equipment, Stats, Items, Abilities |
| `js/ui/title-ui.js` | Title screen with animated background, New Game / Continue menu, save info preview |
| `js/ui/class-select-ui.js` | New game class picker |
| `js/ui/chest-ui.js` | Chest loot popup |
| `js/ui/death-ui.js` | Death screen with rotating flavor messages |
| `js/ui/ending-ui.js` | 3-phase ending sequence (story → princess count → credits scroll) with 9 ending variants |
| `js/ui/dialogue-ui.js` | NPC dialogue with typewriter text + choices |
| `js/ui/crafting-ui.js` | Blacksmith crafting interface |
| `js/ui/perk-ui.js` | Perk selection modal |
| `js/ui/compendium-ui.js` | Monster compendium viewer |
| `js/ui/debug-ui.js` | TEMP: cheat menu for playtesting (+level, +gold, etc.) |

## Conventions

### Adding New Enemies
1. Add to `ENEMY_TYPES` in `config.js` (name, color, hp, maxHp, atk, def, spd, gold, exp, resistances, materialDrops)
2. Add to `ENEMY_SCALING` if it should appear in level-scaled spawns
3. Add sprite data to `sprites.js` + mapping to `ENEMY_SPRITE_MAP`
4. Place in room JSON `enemies` array

### Adding New Bosses
1. Add to `ENEMY_TYPES` in `config.js` with `isBoss: true, bossId: 'boss_id'`
2. Add boss definition to `BOSS_DEFS` in `js/game/boss-ai.js` with phases, abilities, transition callbacks
3. Add sprite data to `sprites.js` + mapping to `ENEMY_SPRITE_MAP`
4. Create boss room JSON with the boss as sole enemy and `fixedEnemies: true`
5. Boss rooms should have no flee option (handled in combat.js via `isBoss` flag)

### Adding New Items
1. Add to `ITEMS` object in `js/data/items.js`
2. Required fields: `id`, `name`, `type` (consumable/weapon/helm/chest/boots/shield/accessory), `cost`, `desc`
3. Equipment: add `slot`, `power`/`defense`, optional `bonus: { atk, def, spd, lck, int }`, `damageType`, `rarity`, `proc`
4. Add to shop inventory in `config.js` `SHOP_TYPES` if purchasable
5. Stackable consumables: `stackable: true`, `use: (player) => string`

### Adding New Rooms
1. Create JSON in `data/rooms/{region}/{name}.json`
2. Link via `exits` in adjacent rooms (bidirectional)
3. Tile IDs: 0=void, 1=grass, 2=wall, 3=water, 4=path, 5=door, 6=floor, 7=cave_wall, 8=cave_floor, 9=chest, 10=stone_wall, 11=sewer_wall, 12=sewer_floor, 13=sewer_water, 14=sprawl_road, 15=sprawl_fence, 16=sprawl_grass, 17=retail_floor, 18=retail_wall, 19=retail_shelf, 20=gym_floor, 21=gym_wall, 22=gym_equipment, 23=lab_floor, 24=lab_wall, 25=lab_tank, 26=island_floor, 27=island_wall, 28=temple_floor, 29=temple_wall
4. Grid is 16 cols × 12 rows

### Adding New NPCs
1. Add definition to `js/data/npcs.js` with dialogue tree
2. Place in room JSON `npcs` array: `{ npcId, x, y }`
3. Handle dialogue callbacks in `handleDialogueChoice()` in `main.js`

### Adding New Quests
1. Add to `QUEST_DEFS` in `js/data/quests.js`
2. Add NPC dialogue triggers (quest start/progress/complete variants)
3. Wire objective checking in combat.js (defeat) or main.js (interact/collect)

### Adding New Crafting Recipes
1. Add to `RECIPES` in `js/game/crafting.js`
2. Add result item to `js/data/items.js`
3. Ensure required materials exist in `js/data/materials.js`

## Important Notes

- **No build step** — serve directory, open in browser
- **No npm** — do not create package.json or suggest installing packages
- **INT stat** — boosts Hacker ability damage and spell scaling (not Bruiser/Fixer abilities)
- **Abilities are free** — no MP cost. Balance comes from enemy pressure, not resource management
- **Equipment serialization** — save stores equipment as `{ id }` refs, rehydrated from `ITEMS` on load
- **Danger meter** — increments on room transitions (+1) and combat (+2/+5), resets in safe rooms, reduced by campfires (-15)
- **Death flow** — defeat → death screen → underworld/gate → pay fee (level×10 gold) or fight Marvin or grind ghost interns → revive at last safe room with full heal
- **Perk selection** — triggers after combat victory if player leveled to a perk milestone (5, 10, 15…50). Cannot be skipped.
- **Recipe discovery** — recipes appear in crafting UI when player has ≥1 of any required material
- **Compendium** — resistance revealed per-element on hit. Full reveal at 5 kills. Classified notes unlock at 100% region discovery.
- **Difficulty scaling** — enemies.js applies a difficulty multiplier (0.75/1.0/1.5) to enemy HP/ATK/DEF on spawn
- **Key/lock doors** — exits can be `{ target, locked: "key_item_id" }`, checked against player inventory in world.js
- **Boss tracking** — `player.bossesDefeated` array tracks bossId strings; quest flags set as `boss_{bossId}_defeated`
- **Ending trigger** — Mayor NPC with 5 NFT drives + Consultant defeated → ending sequence with princess-count variants
- **Audio** — Web Audio API, lazy-initialized on first user interaction. All SFX are synthesized (no audio files).
- `debug-ui.js` is a temporary playtesting tool. Remove before release.
