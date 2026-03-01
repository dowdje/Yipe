# Claude Rules for Quest of Grymhold

## Architecture

### Game State Machine
The game loop in `main.js` switches on state: `OVERWORLD`, `TRANSITION`, `COMBAT`, `SHOP`. Each state has its own update and render function. State transitions happen via direct assignment to `state` variable.

### Module Pattern
All game modules are ES modules with no build step. State is stored in module-level variables (not classes). Modules export getter functions (e.g., `getPlayer()`, `getCombat()`, `getShopState()`) that return mutable state objects.

### Room Format
Room JSON files live in `data/rooms/{region}/{room}.json`. Each room has:
- `id` — room identifier matching file path (e.g., `"grymhold/town_1"`)
- `name` — display name shown in HUD
- `tiles` — 12x16 2D array of tile IDs (rows x cols)
- `exits` — object mapping direction (`left`/`right`/`up`/`down`) to target room ID
- `playerStart` — `{x, y}` spawn position
- `enemies` (optional) — array of `{ type, x, y }` enemy spawn definitions
- `shops` (optional) — array of `{ type, x, y }` shop NPC definitions

### Entity Interaction Pattern
Enemies and shop NPCs use the same bump-to-interact model:
1. Entity is placed at a tile position in room JSON
2. `tryMove()` in `player.js` checks for entity at destination tile
3. Returns `{ type: 'combat'|'shop', ... }` on collision
4. `main.js` handles the result by entering the appropriate state

### Canvas Rendering
- Native resolution: 512x384 (16 cols x 12 rows, 32px tiles)
- All drawing goes through `renderer.js` primitives
- UI overlays (combat, shop) draw directly via `getCtx()` — full canvas replacement, not DOM

## Conventions

### Adding New Enemies
1. Add type definition to `ENEMY_TYPES` in `config.js` (name, color, stats, gold, exp)
2. Add spawn entry to room JSON `enemies` array

### Adding New Shop Items
1. Add item definition to `SHOP_ITEMS` in `shop.js` (name, cost, desc, apply callback)
2. Add item ID to the relevant `SHOP_TYPES` inventory array in `config.js`

### Adding New Rooms
1. Create JSON file in `data/rooms/{region}/{name}.json`
2. Link it via `exits` in adjacent rooms
3. Add `enemies` and/or `shops` arrays as needed

### Adding New Tile Types
1. Add entry to `data/tiles.json` with next available numeric ID
2. Use the ID in room tile grids

## Important Notes

- **No build step** — just serve the directory with any static HTTP server
- **Save data** is in localStorage under key `grymhold_save` — clear it to reset
- `START_ROOM` constant in `main.js` controls the spawn point and death-respawn destination
- Combat log keeps last 4 messages (see `addLog()` in `combat.js`)
- Shop message feedback auto-clears after 1500ms
- Death penalty: 50% gold loss (rounded down), HP/MP fully restored, transition to town_1
