# GRIDLOCK

A retro tile-based RPG built with vanilla JavaScript and HTML5 Canvas. No frameworks, no build tools, no dependencies.

## Play

Serve the directory with any static HTTP server:

```bash
python3 -m http.server 8080
```

Open http://localhost:8080 in your browser. That's it.

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move (one tile per press) |
| Click | Move toward clicked tile |
| Enter / Space | Confirm / advance dialogue |
| Up / Down | Browse menus |
| Left / Right | Switch panels (character menu) / navigate perks / switch target (boss fights) |
| Escape / Backspace | Back / close menu |
| Tab | Toggle buy/sell in shops |
| I | Open character menu |
| J | Open journal (quests, NFT drives, princesses) |

### Character Menu Shortcuts

| Key | Action |
|---|---|
| C | Open monster compendium |
| D | Open debug menu (temp) |
| Q | Quit to title screen |

## Getting Started

The game starts at a **title screen**. Choose "New Game" to begin or "Continue" to load a saved game.

When you start a new game, you'll choose one of three classes. Each plays very differently.

### Classes

**Bruiser** - The tank. High HP and DEF, hits hard. Builds **Pump** resource by using Flex and taking damage, then spends it on devastating abilities like Protein Slam and Suplex.

**Fixer** - The rogue. Fastest class with high crit chance. Builds **Combo Points** with every attack, then burns them on finishers like Eviscerate and the gold-generating Payday.

**Hacker** - The mage. Fragile but powerful. Spells scale off **INT** stat. The **Overclock** system rewards using same-element spells in sequence for bonus damage. Chain Lightning and System Crash deal massive late-game damage.

### Your First Steps

1. Pick a class at the start screen
2. You begin in **Grymhold Town Center** - a safe zone where danger resets
3. The **Convenience Store** (teal NPC) sells food and status cures
4. Head right to the **East Quarter** for the **Pawn Shop** (weapons/armor) and **Hack Shop** (utility spells)
5. Continue right into **Cave 1** - your first dungeon
6. Bump into enemies to fight them. Bump into NPCs/shops to interact.

## Combat

Combat is **tick-based** - speed determines how often each combatant acts, not just who goes first. A fast Fixer might get 2-3 turns for every 1 turn a Cave Troll gets.

The **turn order bar** at the top shows the next 8 upcoming actions.

### Actions

| Action | Effect |
|---|---|
| **Attack** | Basic weapon attack. Can proc elemental status effects from your weapon. |
| **Abilities** | Class-specific skills (free to use, no resource cost for most). |
| **Spells** | Utility magic bought from the Hack Shop (costs MP). |
| **Items** | Use consumables from inventory. |
| **Defend** | Reduces incoming damage by 35%. Bruiser's Flex variant blocks 50% and builds Pump. |
| **Flee** | Always succeeds. Costs 10% of your current gold. |

### Damage Types

Weapons and abilities deal one of four damage types: **Physical**, **Fire**, **Ice**, or **Lightning**.

Enemies have resistances to each type:
- **Weak** (arrow down) - takes 50% extra damage
- **Normal** (dash) - standard damage
- **Resistant** (arrow up) - takes 50% less damage
- **Immune** (shield) - takes no damage

You discover resistances by hitting enemies with each element. After **5 kills** of the same enemy type, all resistances are revealed. Use a **Scanner** item for instant reveal.

Elemental attacks can inflict status effects:
- Fire attacks have a 25% chance to apply **Burn** (DOT + DEF down)
- Ice attacks have a 25% chance to apply **Chill** (SPD down)
- Lightning attacks have a 20% chance to apply **Paralyze** (skip turn)

### The Exploit System

Hitting enemy weaknesses fills an **Exploit Meter**:
- At 3: your next attack is an automatic critical hit
- At 6: you get a free extra action
- At 10: all your damage is doubled for 2 turns

Matching your weapon's element to enemy weaknesses is key to winning tough fights.

### Boss Fights

Bosses are powerful enemies with **multiple phases**. As you damage them, they unlock new abilities and become more dangerous.

- **Phase transitions** trigger at HP thresholds (e.g., 60% HP) with a visual "PHASE SHIFT!" flash
- Bosses can **summon minions** — use Left/Right arrows to switch targets between the boss and its minions
- Some bosses can **submerge** or go untargetable — attack minions while waiting, or you'll waste your turn
- You **cannot flee** from boss fights
- Defeating a boss sets a permanent quest flag, clears all remaining minions, and drops an **NFT Drive** quest item
- Bosses appear as **2×2 tiles** on the overworld and render larger in combat

### Bosses

| Boss | Location | Phases | Weakness |
|---|---|---|---|
| **The Sewer King** | Sewer Throne | P1: bite, tail whip, submerge. P2: rat summons, toxic spray | Lightning |
| **The Manager** | Retail Ruins | P1: summons Retail Bots. P2: SALE MODE (double attacks). P3: scans your most-used element → immune to it | Lightning |
| **The Alpha** | Gym District | P1: slow devastator (high ATK/DEF). P2: SUPERSET MODE (SPD doubles, DEF drops) | Ice |
| **The Specimen** | Labs | P1: 3 independent heads (Fire/Ice/Lightning). P2: heads merge, coordinate AOE charges | Mixed |
| **The Consultant** | Island | P1: untargetable, sends Elite Guard waves. P2: mech suit with exploit shield. P3: dirty fighting, hidden Physical weakness | Physical (P3) |

## Progression

### Leveling Up

Defeat enemies to earn EXP. When you level up:
- Stats increase based on your class
- HP and MP are fully restored
- New abilities unlock at specific levels
- At levels **5, 10, 15, 20, 25, 30, 35, 40, 45, 50** you choose a permanent **Perk**

### Equipment

Equipment comes in five rarities:
- **Common** (white)
- **Uncommon** (green)
- **Rare** (blue)
- **Legendary** (gold)
- **Unique** (red) - rare drops from enemies (2% chance)

Some equipment has **proc effects** - special abilities that trigger on hit, on crit, or when taking damage.

Open the character menu (I) to manage equipment across 7 slots: weapon, shield, helm, chest, boots, and 2 accessories.

### Shops

| Shop | Location | Sells |
|---|---|---|
| Convenience Store | Town Center | Food (HP restore), energy drinks (MP restore), status cures, Scanner |
| Pawn Shop | East Quarter | Weapons (physical + elemental), armor, accessories |
| Hack Shop | East Quarter | Utility spells (Heal, Health Siphon, Shield Aura, Invisibility, Resurrect) |
| Brianna's Gear Shop | Grymhold Residential | Mid-to-late game gear (Brianna is also Princess #7) |
| Damned Merchant | Underworld Intern Halls | Powerful cursed items with stat tradeoffs |

### Crafting

Find **Gus the Blacksmith** NPC to access the forge. Craft powerful equipment from materials dropped by enemies.

Materials drop from specific enemies - Slimes drop Toxic Goo, Goblins drop Scrap Metal, Cave Trolls drop Beast Hide, etc. Recipes are automatically discovered when you collect at least one of any required material.

### The Danger Meter

The **Danger Meter** in the HUD tracks how long you've been away from town.

| Level | Color | Enemy Buff | Loot Bonus |
|---|---|---|---|
| Safe | Green | None | None |
| Sketchy | Yellow | None | +10% |
| Dangerous | Orange | +10% stats | +20% |
| Critical | Red | +20% stats | +35% |
| Meltdown | Dark Red | +30% stats | +50% |

Danger increases when entering rooms (+1) and fighting (+2). It **resets to 0** when you return to town. **Campfires** reduce danger by 15 and restore 50% HP/MP. **Changing zones** (e.g., leaving the sewers for the sprawl) reduces danger by 20.

Higher danger means tougher enemies but better loot. Push your luck or play it safe.

### Roaming Enemies

In non-safe rooms, enemies can **spawn randomly** as you explore. Each step you take has a chance to spawn a roaming enemy at least 4 tiles away. These enemies **chase you** — moving one tile toward you with each step you take. If one catches you (or you walk into it), combat begins.

- Up to 3 roaming enemies can be alive at once
- They scale with your level, so higher-level players face tougher roaming spawns
- Safe rooms (towns, camps) never have random spawns
- Static enemies placed in rooms still behave as before — they don't move

## Death & The Underworld

When you die, you don't just respawn - you're sent to **The Underworld**.

**Marvin the Gatekeeper** offers three options:
1. **Pay the fee** (your level x 10 gold) to leave immediately
2. **Fight Marvin** (he's tough - 200 HP, 35 ATK) to earn your way out
3. **Wander deeper** and grind Ghost Interns for gold to pay the fee

Leaving the Underworld fully heals you, resets your danger meter, and returns you to the last safe room you visited.

## Monster Compendium

Every enemy you fight is recorded in the **Compendium** (press C in the character menu). It tracks:
- Kill count per enemy type
- Discovered elemental resistances (revealed one by one as you attack with each element)
- Full stat reveal at 5 kills

## Journal

Press **J** during overworld exploration to open the Journal. It has three tabs:
- **Quests** — active and completed quests with progress bars
- **NFT Drives** — 5 collection slots showing which bosses you've defeated
- **Princesses** — tracks all 8 princess rescue statuses

## Quests

Talk to NPCs to receive quests.

### Main Quest
| Quest | Giver | Objective |
|---|---|---|
| The NFT Drives | The Mayor | Collect 5 NFT drives from bosses (one per boss) |

### Princess Quests (8 total)
| Princess | Location | Quest |
|---|---|---|
| Destiny | Sprawl Park | Fight the HOA Enforcer or pay 50G |
| Jasmine | Sewer Entrance | Collect 3 Bio Samples |
| Crystal | Retail Security | Find the security keycard |
| Mercedes | Gym Training Hall | Defeat The Alpha boss |
| Angelica | Underworld | Pay Marvin 200G or defeat him |
| Tiffany | Lab Holding Cells | Craft an Antidote (3 Bio Samples + 2 Toxic Goo) |
| Brianna | Grymhold Shop | Talk to her (she's the gear shop vendor!) |
| Valentina | Island Archives | Freed during Consultant fight |

Rescuing all 8 princesses and collecting all 5 NFT drives unlocks the best ending when you return to the Mayor.

## Enemy Reference

### Tier 1 (Level 1+)
| Enemy | HP | ATK | SPD | Drops |
|---|---|---|---|---|
| Bat | 20 | 8 | 7 | - |
| Slime | 28 | 9 | 4 | Toxic Goo (40%) |

### Tier 2 (Level 3+)
| Enemy | HP | ATK | SPD | Drops |
|---|---|---|---|---|
| Shadow Bat | 36 | 13 | 9 | - |
| Poison Slime | 44 | 12 | 5 | Toxic Goo (50%), Bio Sample (15%) |
| Goblin | 38 | 14 | 6 | Scrap Metal (35%) |

### Tier 3 (Level 8+)
| Enemy | HP | ATK | SPD | Drops |
|---|---|---|---|---|
| Cave Troll | 75 | 22 | 3 | Beast Hide (40%), Scrap Metal (25%) |
| Fire Imp | 55 | 25 | 9 | Fuel Cell (30%) |

### Tier 4 (Level 12+)
| Enemy | HP | ATK | SPD | Drops |
|---|---|---|---|---|
| Dark Knight | 110 | 32 | 6 | Scrap Metal (40%), Circuit Board (10%) |
| Crystal Spider | 90 | 27 | 12 | Cryo Core (25%), Spark Plug (20%) |

### Tier 5 (Level 18+)
| Enemy | HP | ATK | SPD | Drops |
|---|---|---|---|---|
| Ancient Golem | 180 | 42 | 3 | Circuit Board (30%), Scrap Metal (50%) |
| Chaos Wraith | 140 | 44 | 13 | Circuit Board (25%), Spark Plug (30%) |

### Sewer Enemies
| Enemy | HP | ATK | SPD | Notes |
|---|---|---|---|---|
| Sewer Rat | 15 | 8 | 6 | Fire-weak. Also spawned as boss minions |
| Toxic Slime | 35 | 12 | 5 | Fire-weak. Drops Toxic Goo |

### Sprawl Enemies
| Enemy | HP | ATK | SPD | Notes |
|---|---|---|---|---|
| Feral Dog | 25 | 10 | 7 | Fire-weak |
| Feral Rat | 18 | 7 | 8 | Fire-weak |
| Goblin Archer | 32 | 15 | 7 | Lightning-weak. Drops Scrap Metal |
| HOA Enforcer | 80 | 18 | 5 | Physical-weak. Quest-only fight |

### Retail Enemies
| Enemy | HP | ATK | SPD | Notes |
|---|---|---|---|---|
| Retail Bot | 30 | 13 | 5 | Lightning-weak. Drops Scrap Metal |
| Price Scanner | 25 | 10 | 9 | Ice-weak. Drops Spark Plug |
| Shopping Cart Golem | 60 | 18 | 3 | Fire-weak. Drops Scrap Metal |
| Corrupted Cashier | 45 | 16 | 6 | Physical-weak |

### Gym Enemies
| Enemy | HP | ATK | SPD | Notes |
|---|---|---|---|---|
| Protein Junkie | 50 | 18 | 5 | Physical-weak |
| Swole Beast | 70 | 24 | 4 | Ice-weak. Drops Beast Hide |
| Gym Bro | 55 | 20 | 6 | Lightning-weak |
| Treadmill Monster | 40 | 14 | 12 | Fire-weak |

### Lab Enemies
| Enemy | HP | ATK | SPD | Notes |
|---|---|---|---|---|
| Lab Chimera | 80 | 22 | 5 | Fire-weak. Drops Bio Sample |
| Bio-Mutant | 65 | 20 | 6 | Ice-weak. Drops Bio Sample |
| Experiment Pod | 50 | 15 | 3 | Lightning-weak. Drops Circuit Board |
| Rogue AI | 55 | 25 | 8 | Lightning-weak. Drops Spark Plug |

### Island Enemies
| Enemy | HP | ATK | SPD | Notes |
|---|---|---|---|---|
| Elite Guard | 90 | 28 | 6 | Lightning-weak |
| Security Drone | 60 | 22 | 10 | Lightning-weak. Drops Spark Plug |
| Cult Acolyte | 45 | 18 | 7 | Fire-weak |
| Void Wraith | 120 | 35 | 8 | Physical-weak. Drops Circuit Board |

### Bosses
| Boss | HP | ATK | DEF | Weakness | Drops |
|---|---|---|---|---|---|
| The Sewer King | 300 | 22 | 14 | Lightning | NFT Drive #1, Beast Hide |
| The Manager | 400 | 25 | 18 | Lightning | NFT Drive #2, Scrap Metal |
| The Alpha | 500 | 35 | 16 | Ice | NFT Drive #3, Beast Hide |
| The Specimen | 600 | 28 | 12 | Mixed | NFT Drive #4, Circuit Board, Bio Sample |
| The Consultant | 800 | 40 | 20 | Physical (P3) | NFT Drive #5, Legendary accessory |

## World Map

```
                        Grymhold (8 rooms)
                    ┌─ Town Center ── East Quarter ── Cave Entrance
                    │  (Store)       (Pawn/Hack)          |
                    │      |                          Deep Passage ── Dead End
 Inn ── Guild ──────┘      | (down)
 Mayor ── Blacksmith       |
 Residential ── Outskirts  |
  (Brianna shop)           |
                    Sewer Entrance ─── Sewer Tunnel 1 ──── Junction
                      (campfire)            |                  |
                                      Sewer Tunnel 2        Waterway
                                            |                  |
                                        Rat's Nest ──── Sewer Throne ──── Deep Sewers
                                                      (BOSS: Sewer King)

Sprawl (10 rooms) ── accessed from Town Center (down)
  Entrance ── Streets ── Park (Destiny) ── Alley
                |                              |
             Houses ── Dead End       Crossroads ── Bridge ── Retail Entrance
                |                        |
              Camp (campfire)          (locked until Sewer King defeated)

Retail Ruins (10 rooms) ── Clothing, Electronics, Food Court, Security (Crystal),
                           Checkouts, Escalator, Storage, Manager's Office (BOSS)

Gym District (10 rooms) ── Locker Room (campfire), Main Floor, Weight Room, Cardio,
                           Sauna, Pool, Training Hall (Mercedes), Alpha Arena (BOSS)

The Labs (10 rooms) ── Entrance, Corridor (campfire), Holding Cells (Tiffany),
                       Surgery, Server Room, Genetic Vault, Sub-Basement,
                       Secret Lab, Antechamber, Containment (BOSS)

Consultant's Island (12 rooms) ── Dock, Lobby, Lounge (campfire), Executive Hall,
                                   Penthouse, Office (BOSS P1), Descent, Ritual Chamber,
                                   Mech Bay (P2), Inner Sanctum (P3), Archives (Valentina),
                                   Treasure

On death:  Underworld Gate ── Intern Halls ── The Depths
           (Marvin, Angelica)  (Ghost Interns, Merchant)
```

## Endings

Collect all **5 NFT drives** (one from each boss) and defeat **The Consultant**, then return to the Mayor to trigger the ending sequence. Your ending title depends on how many of the 8 princesses you rescued — from "The Bare Minimum" (0 rescued) to "World's Greatest Contractor" (all 8).

## Sound

All sound effects are synthesized using the **Web Audio API** — no audio files needed. Sound highlights:
- **WEAKNESS!** flash has a distinctive rising arpeggio (the most important 0.5s in the game)
- Boss phase transitions get a dramatic rumble
- Level ups play a triumphant jingle
- Boss defeats get a full fanfare

## Technical Details

- **16x12 tile grid**, 64px per tile, 1024x768 native canvas (scales via CSS)
- **~70 rooms** across 8 regions + underworld
- **~40 enemy types** and **5 bosses** with unique multi-phase AI
- **Bosses render as 2×2 tiles** on the overworld (128px) and at 8× scale in combat (128px)
- **ES modules** loaded directly by the browser - no bundler, no transpiler
- **16×16 pixel art sprites** defined inline as palette + pixel-index arrays, pre-rendered to offscreen canvases at 4× (overworld), 6× (combat), and 8× (boss combat)
- **localStorage** save system, auto-saves after every movement
- **Web Audio API** for all sound effects (synthesized, no audio files)
- **Tick-based combat** where SPD determines action frequency (ticks to act = floor(80/SPD))
- All rendering is canvas 2D - no DOM elements for gameplay
