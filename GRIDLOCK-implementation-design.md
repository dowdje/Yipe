# GRIDLOCK — Implementation Design Document
## For Claude Code — Starting at Phase 3

**This document is the single source of truth for all gameplay systems and implementation.**
**For narrative, character voices, item descriptions, and story structure, see: GRIDLOCK-tone-bible-v2.md**

---

## Status

| Phase | Status | Summary |
|-------|--------|---------|
| Phase 1: Core Engine | ✅ COMPLETE | Canvas, tiles, movement, rooms, transitions, collision, HUD |
| Phase 2: Base Combat | ✅ COMPLETE | Monster spawns, encounters, turn-based combat, attack/flee, damage, rewards, leveling |
| Phase 3: Classes & Damage Types | ✅ COMPLETE | Class selection, unique mechanics, 4 elements, Exploit system |
| Phase 4: Turn Order & Status Effects | ✅ COMPLETE | SPD timeline, statuses, Defend action, flee rework |
| Phase 5: Equipment, Items & Shops | ✅ COMPLETE | Rarity, elemental weapons, procs, shops, inventory |
| Phase 6: World, Quests & Crafting | ✅ COMPLETE | NPCs, dialogue, quests, crafting, Danger Meter, Underworld |
| Phase 7: Bosses & Content | 🔜 IN PROGRESS | Boss engine + Sewer King done. 4 bosses, 6 regions, princesses remain |
| Phase 8: Polish & Ship | ⬜ | First 5 minutes, title screen, save/load, SFX, balance pass |

---

## 1. Game Overview

**Title:** GRIDLOCK
**Genre:** 2D grid-based adventure RPG
**Engine:** HTML5 Canvas, vanilla JavaScript
**Resolution:** 512×384 internal (16×12 tiles at 32×32), CSS-scaled to viewport
**Target playtime:** 6-10 hours
**Tone:** Comedic dystopian parody on the surface. Occult conspiracy thriller underneath. See tone bible.

**Core loop:** Explore grid rooms → fight visible monsters (turn-based) → loot gold/materials/gear → push deeper (Danger rises) or return to town (shop, heal, craft, turn in quests).

---

## 2. World Structure

### 2.1 Regions

| Region | Role | Room Count | Unlock Condition |
|--------|------|------------|-----------------|
| **Grymhold City** | Hub. Shops, Mayor, quest NPCs. Safe zone. | 8-10 | Start |
| **The Sprawl** | Suburban overworld connecting regions. Tutorial area. | 10-12 | Start |
| **Sewer Network** | First dungeon. Boss: The Sewer King. | 10-12 | Start |
| **Retail Ruins** | Second dungeon. Boss: The Manager. | 10-12 | After Sewer clear |
| **Gym District** | Third dungeon. Boss: The Alpha. | 10-12 | After Retail clear |
| **The Labs** | Fourth dungeon. Boss: The Specimen. Sub-basement introduces conspiracy. | 10-12 | After Gym clear |
| **Consultant's Island** | Final dungeon + temple below. Boss: The Consultant. | 12-15 | After all 5 NFT drives |
| **The Underworld** | Death zone. Gatekeeper NPC. DMV-themed purgatory. | 3-4 | On player death |

**Total: ~80-90 rooms. No filler. Every room has a purpose (enemy, chest, NPC, hazard, shortcut, or secret).**

### 2.2 Room Data Format

```json
{
  "id": "sewer_04",
  "region": "sewer",
  "width": 16,
  "height": 12,
  "tiles": [[]],
  "exits": {
    "north": "sewer_02",
    "east": "sewer_05",
    "south": null,
    "west": "sewer_03"
  },
  "entities": [
    { "type": "monster", "monsterId": "toxic_slime", "x": 8, "y": 5, "respawn": true },
    { "type": "chest", "lootTable": "sewer_loot", "x": 14, "y": 2, "oneTime": true },
    { "type": "npc", "npcId": "sewer_hermit", "x": 3, "y": 9 }
  ],
  "hazards": [
    { "type": "toxic_puddle", "x": 6, "y": 4, "damage": 5 },
    { "type": "pit", "x": 10, "y": 7, "destination": "sewer_08" }
  ],
  "campfire": false,
  "locked": null,
  "symbols": []
}
```

**Note: The `symbols` array is for narrative. Rooms in mid/late game can contain `"eye"`, `"owl"`, `"circle"`, `"horns"` — these are background decoration tiles that carry no gameplay effect but build the conspiracy throughline. See tone bible for usage.**

### 2.3 Room Transitions

Walking off a screen edge loads the adjacent room. Some transitions are gated:
- **Keycard locks** — find keycards in chests or from NPCs
- **Quest locks** — complete a quest flag to open
- **Level locks** — a bouncer NPC blocks passage below a level threshold

---

## 3. Player Character

### 3.1 Character Creation Flow

Character creation happens IN the world, not on a menu screen. After the forced intro fight (see Section 14), the Mayor asks the player's specialty. Three options:

```
"Bruiser: Hit things. Get hit. Hit harder."
"Fixer: Fast. Deadly. Expensive taste."
"Hacker: Why punch it when you can fry it?"
```

Player also enters a name (text input, max 12 chars). Difficulty is selected on the title screen before gameplay begins: Easy / Normal / Hard.

### 3.2 Base Stats

All classes share the same stat categories:

| Stat | Abbreviation | Effect |
|------|-------------|--------|
| **HP** | HP | Health. 0 = death → Underworld |
| **MP** | MP | Mana for spells/abilities that cost MP |
| **ATK** | ATK | Base physical/ability damage |
| **DEF** | DEF | Flat damage reduction from incoming hits |
| **SPD** | SPD | Determines turn frequency in combat timeline |
| **LCK** | LCK | Crit chance, loot quality, some ability interactions |

**Starting stats (Level 1):**

| Stat | Bruiser | Fixer | Hacker |
|------|---------|-------|--------|
| HP | 50 | 30 | 25 |
| MP | 10 | 15 | 30 |
| ATK | 8 | 10 | 5 |
| DEF | 8 | 4 | 4 |
| SPD | 4 | 10 | 7 |
| LCK | 3 | 8 | 6 |

### 3.3 Leveling

- **XP curve:** `xpForLevel(n) = Math.floor(50 * n * 1.5)`
- **Max level:** 50
- **Per-level stat growth:**

| Stat | Bruiser | Fixer | Hacker |
|------|---------|-------|--------|
| HP | +8 | +4 | +3 |
| MP | +2 | +3 | +7 |
| ATK | +2 | +3 | +1 |
| DEF | +3 | +1 | +1 |
| SPD | +1 | +3 | +2 |
| LCK | +1 | +3 | +2 |

- **Every 5 levels (5, 10, 15, 20, 25, 30, 35, 40, 45, 50):** Player chooses 1 of 3 perks. See Section 9.

---

## 4. The Three Classes

Each class has a **unique combat resource** and a distinct set of **abilities**. The resource resets to 0 at the end of each combat.

---

### 4.1 BRUISER

**Unique Resource: PUMP** (max 10)
- Gain 1 Pump when taking damage (per hit received)
- Gain 2 Pump when using the Defend action
- Spent on powerful counterattacks and defensive moves

**Abilities:**

| Ability | Unlock Level | Resource Cost | Damage Type | Effect |
|---------|-------------|---------------|-------------|--------|
| Shoulder Check | 1 | — | Physical | ATK damage + 30% chance to stun 1 turn |
| Flex | 1 | — (replaces Defend) | — | Reduce damage 50%, gain 2 Pump, attackers take small Physical retaliation |
| Protein Slam | 1 | 3 Pump | Physical | 150% ATK damage. If target <30% HP, instant kill |
| Roid Rage | 8 | — | — | Self-buff: ATK +30% for 3 turns. Cannot Defend while active |
| Suplex | 14 | 4 Pump | Physical | Massive damage, ignores 50% of target DEF |
| Iron Skin | 20 | 5 Pump | — | Negate ALL damage for 1 full turn |
| No Pain No Gain | 28 | Passive | — | +1 ATK per 50 damage taken this combat (caps at +10) |

**Design intent:** Easiest class. Forgiving. Absorb damage → build Pump → hit hard. High HP/DEF means high Danger Meter tolerance.

---

### 4.2 FIXER

**Unique Resource: COMBO** (max 5)
- Gain 1 Combo Point (CP) per attack action (basic attack or ability that generates CP)
- Crits generate 1 bonus CP
- Spent on Finishers that scale with CP consumed

**Abilities:**

| Ability | Unlock Level | Resource Cost | Damage Type | Effect |
|---------|-------------|---------------|-------------|--------|
| Shiv | 1 | Generates 1 CP | Physical | Fast attack. Always acts first in turn order |
| Backstab | 1 | Generates 1 CP | Physical | 1.5x damage if player acts before target this turn |
| Eviscerate | 1 | Consumes all CP (min 2) | Physical | Deal (CP × 50% ATK) damage |
| Smoke Bomb | 6 | — | — | Guaranteed free flee OR skip all enemy turns this round. Once per fight |
| Exploit Opening | 10 | 2 CP (Finisher) | — | Mark target: next hit auto-crits + triggers Exploit if weakness exists |
| Death Mark | 18 | 4 CP (Finisher) | — | Target takes 2x damage from ALL sources for 2 turns |
| Payday | 26 | 5 CP (Finisher) | Physical | Massive damage + bonus gold drop = 50% of damage dealt |

**Design intent:** High skill ceiling. Fragile but fastest. Best boss killer. Best Exploit chainer (high SPD → acts first → Backstab → build CP → Exploit Opening → crit weakness). Rewards knowing enemy types.

---

### 4.3 HACKER

**Unique Resource: OVERCLOCK** (state, not points)
- Casting an elemental spell Overclocks you to that element for 2 turns
- While Overclocked: same-element spells cost 25% less MP and deal 20% more damage
- Opposing element spells cost 50% more MP and deal 20% less damage
- **Oppositions:** Fire ↔ Ice. Lightning has no opposition (flexible).
- Untyped spells (Zap) and Physical don't trigger or interact with Overclock

**Abilities:**

| Ability | Unlock Level | MP Cost | Damage Type | Effect |
|---------|-------------|---------|-------------|--------|
| Zap | 1 | 3 | Untyped magic | Reliable damage. No Overclock interaction |
| Firewall | 1 | 5 | Fire | Single target Fire damage |
| System Freeze | 4 | 5 | Ice | Single target Ice damage + 20% Chill chance |
| Power Surge | 7 | 6 | Lightning | Single target Lightning damage + 15% Paralyze chance |
| Overheat | 12 | 10 | Fire | AOE Fire damage to all enemies + 25% Burn chance each |
| Blizzard Protocol | 18 | 12 | Ice | AOE Ice damage to all enemies + 25% Chill chance each |
| Chain Lightning | 24 | 14 | Lightning | Hit 1 enemy, bounce to up to 2 more at 60% damage |
| System Crash | 32 | 25 | Overclocked element | Requires active Overclock. Massive AOE of Overclocked element. Ends Overclock |
| Reboot | 38 | 20 | — | Full HP self-heal. Once per combat |

**Design intent:** Highest damage ceiling. MP-dependent and fragile. Interacts most with the damage type system — Overclock + Exploit = devastating. Poor MP management = useless. Good MP management = unstoppable. Best AOE clear for high-Danger multi-enemy encounters.

---

## 5. Damage Types & Exploit System

### 5.1 Four Damage Types

| Type | Color Code (UI) | Intuitive Strengths |
|------|-----------------|---------------------|
| **Physical** | Gray `#AAAAAA` | Neutral baseline. No special advantages |
| **Fire** | Orange-Red `#FF6B35` | Good vs organic (beasts, plants, mutants), ice-types, undead |
| **Ice** | Cyan `#4FC3F7` | Good vs fire-types, fast enemies, reptilian |
| **Lightning** | Yellow `#FFD740` | Good vs robots, water/wet enemies, armored/metal enemies |

### 5.2 Resistance Scale

Every monster has a resistance value per type. Players start at 0 for all types; equipment modifies.

| Resistance Value | Label | Damage Multiplier | UI Display |
|-----------------|-------|-------------------|------------|
| **-50** | Vulnerable | **×1.5** | Red down-arrow |
| **0** | Normal | ×1.0 | Gray dash |
| **50** | Resistant | ×0.5 | Blue up-arrow |
| **100** | Immune | ×0.0 | Shield icon |

### 5.3 The Exploit System

**Triggering an Exploit:**
When an attack hits an enemy's **Vulnerability** (resistance = -50):
1. Damage gets an extra ×1.5 multiplier on top of the vulnerability's ×1.5 → **effective ×2.25 total damage**
2. **"WEAKNESS!"** text flashes large on screen + distinct satisfying SFX
3. **Exploit Meter** fills +1 point

**Exploit Meter** (visible bar in combat UI, persists across entire combat, resets at end of combat):

| Tier | Cumulative Points | Reward |
|------|-------------------|--------|
| **Tier 1** | 3 | Next attack is a **guaranteed critical hit** |
| **Tier 2** | 6 | Player gets a **bonus free action** this turn |
| **Tier 3** | 10 | **All damage doubled for 2 turns.** Meter resets to 0 |

Tier rewards are consumed when triggered (Tier 1 consumes 3 points, Tier 2 consumes 3 more, etc.). After Tier 3 fires and resets the meter, the cycle begins again.

### 5.4 Weakness Discovery

Weaknesses are **hidden by default** (shown as `???` in combat UI).

| Discovery Method | Details |
|-----------------|---------|
| **Hit and discover** | Use an element; result is shown and permanently recorded |
| **Scanner** (consumable) | Reveals all resistances for one monster type |
| **Kill count** | Defeating a monster type 5× reveals all resistances in Compendium |
| **NPC hints** | Town NPCs drop tips about nearby regions |

Once discovered → permanently visible in combat UI for that monster type. Stored in Monster Compendium.

### 5.5 Damage Formula

```javascript
function calculateDamage(attacker, target, attackElement, weapon) {
  // Base damage
  const base = attacker.atk + weapon.power + randomInt(-2, 2);

  // Defense reduction
  const defense = target.def + (target.armor ? target.armor.defense : 0);
  const raw = Math.max(1, base - defense);

  // Type multiplier from target resistance
  const resistance = target.resistances[attackElement] || 0;
  let typeMult = 1.0;
  if (resistance === -50) typeMult = 1.5;
  else if (resistance === 50) typeMult = 0.5;
  else if (resistance === 100) typeMult = 0.0;

  // Exploit bonus (only on Vulnerable hits)
  const isExploit = resistance === -50;
  const exploitMult = isExploit ? 1.5 : 1.0;

  // Critical hit
  const critChance = 5 + attacker.lck * 0.5; // base 5% + LCK scaling
  const isCrit = randomInt(0, 100) < critChance;
  const critMult = isCrit ? 1.75 : 1.0;

  // Overclock bonus (Hacker only)
  let overclockMult = 1.0;
  if (attacker.overclockElement === attackElement) overclockMult = 1.2;
  else if (isOpposingElement(attacker.overclockElement, attackElement)) overclockMult = 0.8;

  // Final
  const final = Math.floor(raw * typeMult * exploitMult * critMult * overclockMult);

  return { damage: final, isCrit, isExploit, attackElement };
}
```

---

## 6. Combat System

### 6.1 Encounter Trigger

Player walks into a monster sprite on the grid map. Screen transitions to combat overlay (map dims, combat UI appears). **No random encounters** — monsters are always visible.

A single sprite can be 1-3 enemies (revealed on combat start). Groups can be mixed types.

### 6.2 Turn Order (Speed Timeline)

**Visible turn order bar at the top of the combat screen.** Shows the next 6-8 actions in order.

```
TURN ORDER: [Player] → [Rat A] → [Slime] → [Player] → [Rat A] → [Rat B] → [Player] ...
```

Calculated from SPD. Higher SPD = more frequent turns. Recalculated when SPD changes (Haste, Chill, etc.).

**Implementation:** Use a tick-based system. Each combatant has a timer that counts down based on SPD. When it hits 0, that combatant acts and the timer resets. Preview the next N turns for the timeline display.

```javascript
// Simplified turn order calculation
function getNextTurns(combatants, count) {
  const timers = combatants.map(c => ({ entity: c, ticks: c.currentTicks }));
  const order = [];
  for (let i = 0; i < count; i++) {
    // Find lowest ticks
    timers.sort((a, b) => a.ticks - b.ticks);
    const next = timers[0];
    const elapsed = next.ticks;
    // Subtract elapsed from all
    timers.forEach(t => t.ticks -= elapsed);
    // Record this turn
    order.push(next.entity);
    // Reset actor's timer based on SPD (lower = faster)
    next.ticks = Math.floor(100 / next.entity.spd);
  }
  return order;
}
```

### 6.3 Player Actions

| Action | Effect | Notes |
|--------|--------|-------|
| **Attack** | Basic attack with equipped weapon. Damage type = weapon type | All classes |
| **Ability** | Class-specific ability. May cost Pump/CP/MP | See class tables |
| **Item** | Use a consumable from inventory | Costs the turn |
| **Defend** | Reduce incoming damage 50% until next turn. Recover 5% max MP. Bruiser: also gain 2 Pump | All classes |
| **Flee** | Always succeeds. Drop 10% of current gold (min 1). Fixer Smoke Bomb: flee free | Cannot flee bosses |

### 6.4 Enemy AI Behaviors

| Behavior | Logic | Used By |
|----------|-------|---------|
| `basic` | Attack every turn | Trash mobs (rats, raccoons, slimes) |
| `aggressive` | Attack, power move every 3rd turn | Mid-tier enemies |
| `defensive` | Alternate attack and DEF buff | Armored enemies |
| `support` | Buff/heal allies. Heal lowest HP ally. Attack if alone | Support enemies in groups |
| `boss` | Phase-scripted. See Section 11 | All bosses |

Enemies deal damage of their innate `damageType`. They do NOT exploit player weaknesses at launch.

### 6.5 Multi-Monster Encounters

A single monster sprite on the map can represent 1-3 enemies. Defined per monster:

```json
"groupSize": [1, 2]  // random between 1 and 2 enemies from this sprite
```

Groups can be mixed types when a room has multiple monster entities near each other. Player uses arrow keys or clicks to switch targets. Turn order bar shows all combatants.

### 6.6 Combat Rewards

| Reward | Details |
|--------|---------|
| **Gold** | Random range per monster. Modified by Danger level and LCK |
| **XP** | Flat per monster. Small bonus/penalty for level difference |
| **Loot** | % chance per item in monster's loot table. Modified by Danger and LCK |
| **Compendium** | Kill count increments. Resistances discovered through hits |
| **Exploit Meter** | Resets, but discovered weaknesses persist permanently |

### 6.7 Combat UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ TURN ORDER: [You] → [Rat] → [Slime] → [You] → ...     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│         [Monster sprites + names + HP bars]             │
│         Resistances: ??? / 🔥↓ / ❄️— / ⚡—             │
│                                                         │
│   EXPLOIT METER: [████████░░░░░░░░░░░░] 4/10           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Player Name]  Lv.12  BRUISER                          │
│  HP: ████████░░ 80/100    PUMP: ●●●○○○○○○○ (3/10)      │
│  MP: ██████░░░░ 45/80                                   │
│                                                         │
│  > Attack    Ability    Item    Defend    Flee           │
│                                                         │
│  ┌─ COMBAT LOG ────────────────────────────────────┐    │
│  │ You hit Toxic Slime with Flame Bat for 34! 🔥    │    │
│  │ WEAKNESS! Exploit Meter +1                       │    │
│  │ Toxic Slime attacks for 8 damage!                │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Status Effects

### 7.1 Negative Statuses

| Status | Duration | Effect | Caused By | Cure |
|--------|----------|--------|-----------|------|
| **Burn** | 3 turns | 5% max HP/turn + DEF -20% | Fire attacks | Ice Pack item, wait |
| **Chill** | 3 turns | SPD halved | Ice attacks | Hand Warmer item, wait |
| **Paralyze** | 1 turn | Skip next turn. **3-turn immunity after** (no stun-lock) | Lightning attacks | Auto-clears |
| **Poison** | 4 turns | 8% max HP/turn. Cannot kill (min 1 HP) | Poison sources, traps | Antidote Gummy, wait |
| **Enfeeble** | 3 turns | ATK -30% | Monster abilities | Wait |

### 7.2 Positive Statuses (Buffs)

| Status | Duration | Effect | Source |
|--------|----------|--------|--------|
| **ATK Up** | 3 turns | ATK +25% | Roid Rage, items |
| **DEF Up** | 3 turns | DEF +25% | Items, equipment |
| **Haste** | 2 turns | SPD doubled | Rare items, procs |
| **Regen** | 4 turns | 5% max HP/turn | Equipment procs, items |
| **Shield** | Until broken | Absorb X damage then break | Iron Skin, gear |

### 7.3 Boss Resistance

Bosses: **70% chance to resist Paralyze. 40% chance to resist other statuses.** Statuses are NOT useless against bosses — just unreliable. Players who build status strategies are rewarded when they land.

---

## 8. Items & Equipment

### 8.1 Consumables

**Healing (food-based):**

| Item | HP Restored | Buy Price | Region Available |
|------|-------------|-----------|-----------------|
| Gas Station Burrito | 10 | 5g | Start |
| Lukewarm Pizza | 25 | 15g | Start |
| Double Gridlock Burger | 60 | 35g | Start |
| Protein Shake | 100 | 60g | Mid-game shop |
| Artisanal Kale Wrap | 180 | 100g | Mid-game shop |
| Full Spread Feast | Full HP+MP | 400g | Late-game shop |

**MP Recovery:**

| Item | MP Restored | Buy Price |
|------|-------------|-----------|
| Cheap Energy Drink | 10 | 15g |
| Name-Brand Energy Drink | 35 | 50g |
| Dubious Nootropic | Full MP | 180g |

**Status Cures:**

| Item | Effect | Buy Price |
|------|--------|-----------|
| Antidote Gummy | Cure Poison | 20g |
| Ice Pack | Cure Burn | 20g |
| Hand Warmer | Cure Chill | 20g |

**Utility:**

| Item | Effect | Buy Price |
|------|--------|-----------|
| Scanner | Reveal all resistances for 1 monster type | 40g (or craft) |

### 8.2 Equipment Slots

| Slot | Primary Stat | Secondary |
|------|-------------|-----------|
| **Weapon** | ATK + damage type | Proc effects (Rare+) |
| **Armor** | DEF + HP bonus | Resistances, proc effects |
| **Off-hand** | DEF or MP bonus | Resistances |
| **Accessory** | Special effects | LCK, unique abilities |

### 8.3 Weapon Damage Types

Every weapon has an inherent element for basic attacks:

| Category | Damage Type | Early Example | Mid Example | Late Example |
|----------|------------|---------------|-------------|--------------|
| Blunt/Sharp | Physical | Lead Pipe (5 ATK) | Baseball Bat (12 ATK) | Sledgehammer (22 ATK) |
| Incendiary | Fire | Welding Torch (8 ATK) | Flame Bat (15 ATK) | Magma Core Hammer (25 ATK) |
| Cryo | Ice | Cryo Spray (8 ATK) | Frost Knuckles (15 ATK) | Absolute Zero Rod (25 ATK) |
| Electric | Lightning | Taser (8 ATK) | Cattle Prod (15 ATK) | Tesla Coil Bat (25 ATK) |

### 8.4 Equipment Rarity

| Tier | Color | Source | Properties |
|------|-------|--------|------------|
| **Common** | White `#FFFFFF` | Shops, common drops | Stats only |
| **Uncommon** | Green `#4CAF50` | Chests, uncommon drops | Stats + 1 minor bonus |
| **Rare** | Blue `#2196F3` | Boss drops, hidden chests, crafting | Stats + 1 proc effect |
| **Legendary** | Gold `#FFD700` | 1 per slot, unique quest/location | Named item, unique effect |

### 8.5 Proc Effects

Procs trigger on specific conditions. Defined in equipment data:

```json
{
  "id": "vampire_shiv",
  "name": "Vampire Shiv",
  "slot": "weapon",
  "rarity": "rare",
  "atk": 14,
  "damageType": "physical",
  "proc": {
    "trigger": "onHit",
    "chance": 0.15,
    "effect": "healPercent",
    "value": 0.2,
    "description": "15% chance on hit: heal for 20% of damage dealt"
  }
}
```

**Proc trigger types:** `onHit`, `onCrit`, `onKill`, `onExploit`, `onHitReceived`, `onBelowHPPercent`, `onDodge`

**Proc effect types:** `healPercent`, `healFlat`, `bonusDamage`, `bonusDamageAOE`, `applyStatus`, `selfBuff`, `damageReflect`

**Implementation: 6-8 proc effects at launch. Add more as content is built out.**

### 8.6 Equipment Data Format

```json
{
  "id": "flame_bat",
  "name": "Flame Bat",
  "slot": "weapon",
  "rarity": "uncommon",
  "atk": 15,
  "damageType": "fire",
  "bonus": { "lck": 2 },
  "proc": null,
  "craftable": true,
  "recipe": { "materials": { "lead_pipe": 1, "fuel_cell": 3 }, "gold": 80 },
  "description": "A baseball bat with a fuel cell duct-taped to it. Gus called it 'elegant.' Gus is wrong. But it works."
}
```

---

## 9. Perk System

Every **5 levels**, the player chooses **1 of 3 perks.** The unchosen 2 are permanently locked for that slot. 10 choices across a full playthrough (levels 5 through 50).

### 9.1 Perk Table

| Level | Category | Option A | Option B | Option C |
|-------|----------|----------|----------|----------|
| 5 | Offense | +15% ATK | +10% crit chance | Exploits deal +25% bonus damage |
| 10 | Defense | +20% DEF | +100 max HP | Defend restores 10% HP |
| 15 | Utility | +20% gold | +15% XP | Scanners are free (unlimited) |
| 20 | Offense | Basic attacks hit twice (50% dmg each) | Crits restore 5% MP | Exploit Meter +1 bonus per Exploit |
| 25 | Defense | -15% damage at Dangerous+ Danger | Immune to Poison | Auto-Regen below 30% HP |
| 30 | **Class** | *See below* | *See below* | *See below* |
| 35 | Utility | Monster drops +1 material | Shops 15% cheaper | Campfires fully heal |
| 40 | Offense | Exploit Tier 1 at 2 pts (not 3) | Status effects +1 turn | Kills below 10% HP: AOE explosion |
| 45 | Defense | Auto-revive 1×/dungeon at 25% HP | +30% all elemental resistance | Defend reflects 25% blocked damage |
| 50 | Capstone | All damage +20% | All damage taken -20% | Gold, XP, loot all +30% |

**Level 30 class perks:**

| Class | Option A | Option B | Option C |
|-------|----------|----------|----------|
| Bruiser | +2 Pump per hit taken | Protein Slam hits all enemies | Start combat with 3 Pump |
| Fixer | +1 CP per crit | Eviscerate ignores DEF | Start combat with 2 CP |
| Hacker | Overclock lasts +1 turn | AOE spells cost 25% less MP | Start combat Overclocked (random element) |

### 9.2 Perk Data Format

```json
{
  "id": "atk_15",
  "name": "Raw Power",
  "description": "+15% ATK",
  "level": 5,
  "category": "offense",
  "effect": { "type": "statMultiplier", "stat": "atk", "value": 1.15 }
}
```

### 9.3 Perk Selection UI

On level up to a perk level, a modal appears showing the 3 options. Each shows: name, description, and an icon. Player clicks one. Confirmation prompt: "This choice is permanent. Are you sure?" Then locked.

---

## 10. Danger Meter

### 10.1 Mechanics

A visible bar on the HUD that fills as the player pushes deeper from town.

**Fills:**
- +1 per non-safe room entered
- +2 per combat encounter
- +5 per boss fight

**Thresholds:**

| Level | Points | Monster Stat Mod | Loot Quality Mod | Extra |
|-------|--------|-----------------|-------------------|-------|
| **Safe** | 0-10 | Normal | Normal | — |
| **Sketchy** | 11-25 | +1 extra enemy possible | +10% | — |
| **Dangerous** | 26-40 | Stats +10% | +20% | Rare drops more common |
| **Critical** | 41-60 | Stats +20% | +35% | Danger-only unique loot |
| **Meltdown** | 61+ | Stats +30% | +50% | Healing items 50% less effective |

**Resets:**
- Return to Grymhold City: reset to 0
- Campfire (found in dungeons): reduce by 15, heal 50% HP/MP
- Die (Underworld): reset to 0

### 10.2 Implementation

```javascript
// dangerMeter is a simple integer on the game state
const DANGER_THRESHOLDS = [
  { name: "Safe",      min: 0,  max: 10, statMod: 0,    lootMod: 0,    extraEnemy: false, healNerf: false },
  { name: "Sketchy",   min: 11, max: 25, statMod: 0,    lootMod: 0.10, extraEnemy: true,  healNerf: false },
  { name: "Dangerous", min: 26, max: 40, statMod: 0.10, lootMod: 0.20, extraEnemy: true,  healNerf: false },
  { name: "Critical",  min: 41, max: 60, statMod: 0.20, lootMod: 0.35, extraEnemy: true,  healNerf: false },
  { name: "Meltdown",  min: 61, max: 999,statMod: 0.30, lootMod: 0.50, extraEnemy: true,  healNerf: true  },
];

function getDangerLevel(meter) {
  return DANGER_THRESHOLDS.find(t => meter >= t.min && meter <= t.max);
}
```

### 10.3 HUD Display

Show the Danger bar below the HP/MP bars. Color-coded by threshold: green → yellow → orange → red → pulsing red.

---

## 11. Boss Fights

5 bosses, each with 2-3 phases triggered at HP thresholds. Cannot flee. Room seals on entry.

### 11.1 Boss Data Format

```json
{
  "id": "sewer_king",
  "name": "The Sewer King",
  "boss": true,
  "hp": 200,
  "atk": 15,
  "def": 8,
  "spd": 5,
  "xp": 150,
  "gold": [80, 150],
  "damageType": "physical",
  "resistances": { "physical": 50, "fire": 0, "ice": 0, "lightning": -50 },
  "phases": [
    {
      "hpPercent": 100,
      "behavior": "standard",
      "abilities": ["bite", "submerge"],
      "message": null
    },
    {
      "hpPercent": 60,
      "behavior": "summoner",
      "abilities": ["bite", "submerge_and_summon"],
      "summons": ["sewer_rat", "sewer_rat"],
      "message": "The Sewer King roars and calls for backup!"
    }
  ],
  "loot": [
    { "item": "nft_drive_1", "chance": 1.0 },
    { "item": "sewer_crown", "chance": 1.0 }
  ],
  "description": "A mutant alligator wearing a crown made of shopping carts. Long live the king."
}
```

### 11.2 The Five Bosses

**Boss 1: THE SEWER KING** (Sewer Network)
- Phase 1 (100-60%): Physical attacks + submerge (untargetable 1 turn, then bite)
- Phase 2 (60-0%): Summons 2 Sewer Rats per submerge. Rats are Fire-vulnerable.
- Weakness: Lightning. Resistant to Physical. Immune to Poison.
- Design lesson: Teaches turn prediction (submerge telegraph) and AOE/type coverage.

**Boss 2: THE MANAGER** (Retail Ruins)
- Phase 1 (100-60%): Summons 1 Retail Bot/turn (max 3). High DEF. Tests add management.
- Phase 2 (60-30%): "Sale Mode" — attacks hit twice. Stops summoning. DPS race.
- Phase 3 (30-0%): Scans player's most-used element from prior phases → becomes Immune to it. Must switch.
- Weakness: Lightning. Resistant to Ice.
- Design lesson: Adaptation. The game punishes one-element spam.

**Boss 3: THE ALPHA** (Gym District)
- Phase 1 (100-50%): Extremely high ATK, low SPD. Slow but devastating. Tests defensive play.
- Phase 2 (50-0%): "SUPERSET MODE" — SPD doubles, ATK up, DEF drops to near-0. Glass cannon. Tests burst damage.
- Weakness: Ice. Resistant to Fire and Physical.
- Design lesson: Phase shift. Fight flips from defense to offense.

**Boss 4: THE SPECIMEN** (The Labs)
- Phase 1 (100-60%): Three heads (Fire Head, Ice Head, Lightning Head), each with own HP and opposing weakness.
- Phase 2 (60-0%): Heads coordinate. One charges while others defend. Must identify and burst the charging head before AOE fires.
- Weakness: Per-head (Fire Head → Ice-vulnerable, etc.)
- Design lesson: Elemental mastery. Multi-target prioritization.

**Boss 5: THE CONSULTANT** (Consultant's Island / Temple)
- Phase 1 (100-70%): Sends Elite Guard waves. Consultant untargetable, drinks and commentates. Endurance test.
- Phase 2 (70-40%): Mech suit. High all-around stats. Shield absorbs damage until 3 Exploits break it. Tests Exploit system mastery.
- Phase 3 (40-0%): Mech damaged. Fights dirty — self-heals, applies statuses. Secretly Physical-vulnerable all along (mech covered his weakness). Rewards players who kept a Physical option.
- Design lesson: Everything you've learned. Endurance + Exploit mastery + adaptation + preparation.

---

## 12. Crafting System

### 12.1 Blacksmith NPC: Gus

Located in Grymhold City (shipping container behind convenience store). Bring materials + gold → get items.

### 12.2 Materials (~12 types)

| Material | Primary Sources |
|----------|----------------|
| Scrap Metal | Robots, constructs, Retail Ruins |
| Beast Hide | Feral animals, Sprawl/Sewer |
| Toxic Goo | Slimes, mutants, Sewer |
| Fuel Cell | Fire enemies, incendiary sources |
| Cryo Core | Ice enemies |
| Spark Plug | Electric enemies, robots |
| Circuit Board | Advanced robots, Lab enemies |
| Protein Powder | Gym enemies |
| Silk Wire | Spiders, trap rooms |
| Bio Sample | Lab chimeras, experiments |
| Reinforced Plate | Mini-bosses, armored enemies |
| Void Core | Final dungeon enemies only |

Materials drop alongside normal loot. Stored in a separate materials inventory (not mixed with consumables).

### 12.3 Recipe Data Format

```json
{
  "id": "flame_bat",
  "result": { "item": "flame_bat", "quantity": 1 },
  "materials": { "lead_pipe": 1, "fuel_cell": 3 },
  "gold": 80,
  "discovered": false
}
```

Recipes discovered by: finding recipe notes in chests, buying from NPCs, or auto-unlock when all required materials are held.

---

## 13. Quests

### 13.1 Main Quest: The NFT Drives

5 encrypted hard drives stolen from the Mayor. Each is in a boss's dungeon. Defeating the boss yields the drive. After all 5 → Consultant's Island unlocks.

**Quest flag:** `nftDrives: [false, false, false, false, false]`

The drives contain blackmail files. The Mayor thinks they're NFTs. The player discovers the truth progressively. See tone bible for narrative arc.

### 13.2 Side Quest: The Princesses (Baby Mamas)

8 women scattered across the map. Each is a self-contained mini-story. See tone bible for narrative details.

| # | Name | Region | Type | Reward |
|---|------|--------|------|--------|
| 1 | Destiny | The Sprawl | Combat (fight HOA enforcer or pay) | 50g |
| 2 | Jasmine | Sewer entrance | Fetch (3 Bio Samples) | 75g + recipe |
| 3 | Crystal | Retail Ruins | Dungeon item (security keycard) | 100g |
| 4 | Mercedes | Gym District | Story (available after Alpha defeated) | 150g |
| 5 | Angelica | The Underworld | Pay her fee or fight Gatekeeper | 200g |
| 6 | Tiffany | The Labs | Craft (Antidote: Bio Sample ×3 + Toxic Goo ×2) | 250g + rare item |
| 7 | Brianna | Grymhold City | Dialogue reveal (she's the shop NPC) | 300g |
| 8 | Valentina | Consultant's Island | Story (freed during main quest) | Legendary accessory |

**Quest flag:** `princessesFound: []` (array of indices)

**All 8 returned:** Mayor gives Legendary accessory ("World's Greatest Contractor" lanyard).

**Design note from tone bible:** The princess encounters escalate from comedic (early) to unsettling (late). The final ones hint at the trafficking ring. The player can choose not to return some of them to the Mayor. See tone bible for story details.

### 13.3 Quest Data Format

```json
{
  "id": "princess_1_destiny",
  "type": "side",
  "name": "Destiny's HOA Problem",
  "description": "The Mayor's 'princess' Destiny is being harassed by an HOA enforcer in the Sprawl.",
  "region": "sprawl",
  "prerequisites": [],
  "objectives": [
    { "type": "interact", "npcId": "destiny", "roomId": "sprawl_07" },
    { "type": "defeat_or_pay", "monsterId": "hoa_enforcer", "payCost": 100, "roomId": "sprawl_07" },
    { "type": "interact", "npcId": "destiny", "roomId": "sprawl_07" }
  ],
  "rewards": { "gold": 50 },
  "flags": { "set": "princess_1_complete" }
}
```

---

## 14. The First 5 Minutes

**This is the single most important section for player retention.**

```
0:00  TITLE SCREEN: "GRIDLOCK" in distorted text. Difficulty select (Easy/Normal/Hard).
      "Press any key."

0:10  SMASH CUT: Player sprite is in a room. A feral raccoon is charging.
      TEXT BOX: "Oh. You're awake. And there's a raccoon. Great."

0:15  FORCED COMBAT TUTORIAL:
      - Game teaches Attack action (raccoon has 5 HP, player has a Lead Pipe)
      - After killing raccoon, it drops Gas Station Burrito
      - Game teaches Item action (eat burrito to heal)
      - Player wins. Gets 3 gold and 5 XP.

0:40  Player walks 1 room south. Arrives at Mayor's office (trailer with "CITY HALL" banner).

1:00  MAYOR DIALOGUE: 3-4 lines. Establishes tone. Asks specialty.

1:20  CLASS SELECTION: Three buttons with 1-line descriptions.
      Player picks a class. Stats are assigned. Starting weapon changes:
      - Bruiser: Lead Pipe (Physical)
      - Fixer: Rusty Shiv (Physical)
      - Hacker: Zap ability + basic tablet (Physical fallback)

1:40  Mayor gives quest: NFT drives stolen. Check the sewers. Gives 50 gold.
      ALSO: Mentions "my princesses" offhand — seeds side quest.

2:00  Player is in GRYMHOLD CITY. Can visit:
      - Shop (buy elemental weapon + food)
      - 2-3 NPCs (1-liners, establish world tone)
      - Then head toward Sewer entrance via The Sprawl

3:00  Enter THE SPRAWL. First real enemy: Feral Dog.
      CRITICAL: The starting elemental weapon from the shop should have type
      advantage against Sprawl enemies. First Exploit trigger happens here.
      "WEAKNESS!" flash. Player feels the system immediately.

4:00  Enter SEWER. Darker tileset. Tougher enemies (Toxic Slime).
      Player starts making real combat decisions.

5:00  Player has fought 3-4 enemies, leveled up once, used a heal,
      and is deciding whether to push deeper or go back.
      THE HOOK IS SET.
```

---

## 15. Death & The Underworld

On HP reaching 0:

1. Death message displays (see tone bible for messages)
2. Screen transitions to The Underworld (3-4 rooms, DMV theme)
3. **The Gatekeeper (Marvin)** offers options:
   - **Pay fee:** Gold cost = `playerLevel * 10`. Full heal. Return to last town.
   - **Fight Marvin:** He scales with player level. If you win: leave free, HP NOT restored.
   - **Can't pay/fight:** Grind ghost interns in the back rooms until you can pay.
4. Underworld also has a unique merchant selling "damned" items (powerful but with tradeoffs)
5. Danger Meter resets to 0

---

## 16. Monster Compendium

Accessible from pause menu. Tracks all discovered monsters.

**Per monster entry:**
- Name + sprite
- Region
- Kill count
- Resistances (progressive reveal: per-element on hit, full at 5 kills)
- Loot table (revealed at 5 kills)
- Description text
- Compendium hint (cryptic weakness hint before full reveal)

**Compendium data stored in save file per monster ID.**

**Late-game addition (see tone bible):** Completing all entries in a region unlocks a hidden "classified" note that adds one more piece of the conspiracy puzzle.

---

## 17. Monster Data Format

```json
{
  "id": "toxic_slime",
  "name": "Toxic Slime",
  "hp": 25,
  "atk": 8,
  "def": 2,
  "spd": 3,
  "xp": 15,
  "gold": [8, 18],
  "damageType": "poison",
  "resistances": {
    "physical": 0,
    "fire": -50,
    "ice": 0,
    "lightning": 50
  },
  "statusOnHit": { "type": "poison", "chance": 0.15 },
  "loot": [
    { "item": "toxic_goo", "chance": 0.5 },
    { "item": "gas_station_burrito", "chance": 0.15 }
  ],
  "behavior": "basic",
  "region": "sewer",
  "levelRange": [1, 12],
  "groupSize": [1, 2],
  "description": "It used to be water. Then it got opinions.",
  "compendiumHint": "Dissolves quickly when heated."
}
```

---

## 18. Save System

**Auto-save on room transition + at campfires.** Manual save at inns/safe zones.

```json
{
  "version": 1,
  "player": {
    "name": "string",
    "class": "bruiser|fixer|hacker",
    "level": 12,
    "xp": 2450,
    "hp": 85, "maxHp": 100,
    "mp": 30, "maxMp": 40,
    "stats": { "atk": 22, "def": 18, "spd": 10, "lck": 8 },
    "gold": 1234,
    "perks": ["atk_15", "def_20", "gold_20"],
    "classResource": 0
  },
  "equipment": {
    "weapon": "flame_bat",
    "armor": "kevlar_vest",
    "offhand": "riot_shield",
    "accessory": "counterfeit_watch"
  },
  "inventory": [{ "id": "double_gridlock_burger", "qty": 3 }],
  "materials": { "scrap_metal": 7, "fuel_cell": 3 },
  "recipesKnown": ["flame_bat", "mega_burger"],
  "questFlags": {
    "nftDrives": [true, true, false, false, false],
    "princessesFound": [1, 2, 3],
    "mainQuestStage": "post_gym"
  },
  "compendium": {
    "toxic_slime": {
      "kills": 8,
      "resistancesKnown": { "physical": true, "fire": true, "ice": true, "lightning": true }
    }
  },
  "currentRoom": "gym_04",
  "dangerMeter": 28,
  "chestsOpened": ["sewer_chest_01", "sprawl_chest_03"],
  "difficulty": "normal",
  "playTime": 8523
}
```

---

## 19. File Structure

```
/gridlock/
├── index.html
├── css/style.css
├── js/
│   ├── main.js              # Game loop, state machine, init
│   ├── config.js             # Constants, balance values, thresholds
│   ├── engine/
│   │   ├── renderer.js       # Canvas drawing, tiles, sprites, scaling
│   │   ├── input.js          # Keyboard + mouse/touch
│   │   ├── audio.js          # SFX via Web Audio API
│   │   └── save.js           # localStorage save/load
│   ├── game/
│   │   ├── world.js          # Room loading, transitions, hazards, campfires
│   │   ├── player.js         # Stats, leveling, class resource, perks, movement
│   │   ├── combat.js         # Turn order, actions, damage calc, Exploit meter
│   │   ├── monsters.js       # Monster DB, AI behaviors, boss phases
│   │   ├── items.js          # Item DB, equipment, procs, rarity
│   │   ├── crafting.js       # Recipe system, materials
│   │   ├── quests.js         # Quest tracking, flags, objectives
│   │   ├── npcs.js           # Dialogue trees, shops, interactions
│   │   ├── compendium.js     # Monster compendium tracking + UI
│   │   ├── danger.js         # Danger Meter logic + scaling
│   │   └── underworld.js     # Death handling, Gatekeeper
│   └── ui/
│       ├── hud.js            # HP, MP, Gold, Level, Danger, class resource
│       ├── menu.js           # Pause menu, inventory, equipment, perks, compendium
│       ├── dialogue.js       # Text boxes, branching choices
│       ├── combat-ui.js      # Combat overlay, turn bar, Exploit meter, log
│       └── shop-ui.js        # Buy/sell interface
├── data/
│   ├── rooms/                # JSON per region subfolder
│   │   ├── grymhold/
│   │   ├── sprawl/
│   │   ├── sewer/
│   │   ├── retail/
│   │   ├── gym/
│   │   ├── labs/
│   │   ├── island/
│   │   └── underworld/
│   ├── monsters.json
│   ├── items.json
│   ├── equipment.json
│   ├── recipes.json
│   ├── npcs.json
│   ├── quests.json
│   ├── perks.json
│   └── loot-tables.json
├── assets/
│   ├── sprites/              # Player, monsters, NPCs, items
│   ├── tiles/                # Tilesets per region
│   ├── ui/                   # HUD elements, combat backgrounds, menus
│   └── audio/sfx/            # Sound effects
└── docs/
    ├── DESIGN.md             # This document
    └── TONE-BIBLE.md         # Narrative, voice, descriptions
```

---

## 20. Implementation Phases (Detailed Tasklists)

### Phase 3: Classes & Damage Types ✅

**The goal: by the end of this phase, picking a class feels meaningful and hitting a weakness feels amazing.**

```
STEP 1 — Class Selection
  [x] Add class selection UI after intro fight (3 buttons + descriptions)
  [x] Store selected class in player state
  [x] Apply class-specific starting stats (see Section 3.2)
  [x] Apply class-specific stat growth table on level up
  [x] Change starting weapon based on class

STEP 2 — Class Resources
  [x] Add classResource field to player state (integer, starts at 0)
  [x] BRUISER: increment classResource (Pump) by 1 when taking damage
  [x] FIXER: increment classResource (Combo) by 1 on attack actions
  [x] HACKER: add overclockElement field (null or "fire"/"ice"/"lightning")
  [x] HACKER: set overclockElement when casting elemental spell, set overclockTurns = 2
  [x] HACKER: decrement overclockTurns each turn, clear when 0
  [x] Reset classResource to 0 at end of each combat

STEP 3 — Abilities
  [x] Create ability data structure: { id, name, class, level, cost, damageType, effect }
  [x] Implement Ability action in combat menu (shows only current class abilities at/below player level)
  [x] Implement level 1 abilities first for all classes (6 total — 2 per class)
  [x] Implement remaining abilities incrementally by level

STEP 4 — Damage Types
  [x] Add damageType enum: "physical", "fire", "ice", "lightning"
  [x] Add damageType field to all weapons
  [x] Add resistances object to all monsters: { physical, fire, ice, lightning }
  [x] Modify damage calculation to apply type multiplier
  [x] Basic attacks use weapon's damageType
  [x] Abilities/spells use their defined damageType

STEP 5 — Exploit System
  [x] Add exploitMeter to combat state (integer, starts at 0, resets end of combat)
  [x] On Vulnerable hit (resistance === -50): apply 1.5x exploit bonus, increment meter
  [x] "WEAKNESS!" text flash (large, centered, distinct color, 0.5s display)
  [ ] Exploit SFX (satisfying crunch/pop sound) — deferred to Phase 8 (SFX pass)
  [x] Tier 1 (3 pts): flag next attack as auto-crit, consume 3 pts
  [x] Tier 2 (6 pts): grant bonus action this turn, consume 3 pts
  [x] Tier 3 (10 pts): set 2-turn damage doubler, reset meter to 0

STEP 6 — Combat UI Updates
  [x] Show weapon damage type icon next to Attack option
  [x] Show monster resistance indicators (???, red↓, gray—, blue↑, shield)
  [x] Show Exploit Meter bar below monster area
  [x] Show class resource counter (Pump/Combo/Overclock status) on player HUD
  [x] Color-code damage numbers by type (gray/red/blue/yellow)
  [x] Animate "WEAKNESS!" text
```

### Phase 4: Turn Order & Status Effects ✅

```
  [x] Replace simple turn alternation with SPD-based tick system
  [x] Render turn order bar at top of combat screen (next 6-8 actions)
  [x] Update turn order display in real-time as SPD changes
  [x] Implement status effect system:
      [x] Status data structure: { type, duration, tickEffect, statMod }
      [x] Apply/tick/expire/cure framework
      [x] Visual: status icons on affected entities
      [x] Burn, Chill, Paralyze, Poison, Enfeeble (negative)
      [x] ATK Up, DEF Up, Haste, Regen, Shield (positive)
  [x] Paralyze: 3-turn-per-target cooldown (no stun-lock)
  [x] Boss status resistance: 70% Paralyze, 40% other
  [x] Implement Defend action for all classes (50% DR, 5% MP regen, class bonuses)
  [x] Implement Flee rework (always succeeds, costs 10% gold, Fixer Smoke Bomb free)
```

### Phase 5: Equipment, Items & Shops ✅

```
  [x] Equipment rarity system (Common/Uncommon/Rare/Legendary) with color UI
  [x] Equipment with damageType (elemental weapons)
  [x] Proc effect framework: trigger → chance → effect
  [x] 6-8 initial proc effects on Rare items
  [x] Populate items.json and equipment.json with all planned items
  [x] Shop UI: buy/sell, shows rarity colors, equipment comparison
  [x] Shop inventory varies by game progression
  [x] Treasure chests on map: rarity-weighted loot tables
  [x] Inventory UI: consumables tab, equipment tab, materials tab
  [x] Equip/unequip with stat preview
  [x] Scanner item: reveals all resistances for targeted monster type
```

### Phase 6: World, Quests & Crafting ✅

```
  [x] NPC dialogue system: text boxes, portraits, branching choices
  [x] Populate npcs.json with all NPC dialogue (reference tone bible)
  [x] Quest tracking system: objectives, flags, completion checks
  [x] Main quest: track 5 NFT drives
  [ ] Side quest: track 8 princesses with individual objectives — deferred to Phase 7
  [x] Crafting UI at Gus NPC: select recipe, show materials needed, craft
  [x] Material drops integrated into monster loot tables
  [x] Recipe discovery (chest notes, NPC purchases, auto-unlock)
  [x] Populate recipes.json
  [x] Danger Meter: HUD bar, threshold logic, scaling modifiers
  [x] Campfire interactable: reduce Danger by 15, heal 50% HP/MP
  [x] Perk system: selection UI every 5 levels, permanent passive application
  [x] Death → Underworld transition: Gatekeeper dialogue, pay/fight/grind
  [ ] Underworld merchant (unique damned items) — deferred to Phase 7
  [ ] Key/lock doors, hazards (toxic puddles, pits, warps) — deferred to Phase 7
  [x] Monster Compendium UI in pause menu
```

### Phase 7: Bosses & Content

```
  [x] Boss phase system: HP threshold triggers, behavior switching, summons
  [x] Boss 1: The Sewer King (submerge + summon rats)
  [x] Sewer Network rooms (8 rooms: entrance, tunnel_1, junction, tunnel_2, waterway, rats_nest, deep, throne)
  [x] Fixed enemy spawning system (rooms can force specific enemy types)
  [x] Boss AI module (boss-ai.js): weighted abilities, cooldowns, minion spawning, phase transitions
  [x] Combat target cycling (boss + minions), untargetable state, phase transition UI
  [x] Sewer enemy types: sewer_king, sewer_rat, toxic_slime + sprites + tiles (11-13)
  [ ] Boss 2: The Manager (add management + element adaptation)
  [ ] Boss 3: The Alpha (slow tank → fast glass cannon phase flip)
  [ ] Boss 4: The Specimen (multi-head + charge detection)
  [ ] Boss 5: The Consultant (guard waves + mech shield + dirty fighting)
  [ ] Build all rooms for all regions (80-90 total)
  [ ] Populate all monster types per region with proper resistances/loot
  [ ] Populate all equipment (early/mid/late tiers per element per slot)
  [ ] All crafting recipes implemented
  [ ] All 8 princess encounters scripted with dialogue
  [ ] All NPC dialogue populated (reference tone bible heavily)
  [ ] Conspiracy breadcrumbs: symbols in rooms, item descriptions, NPC hints
  [ ] Difficulty scaling: Easy (0.75x enemy stats), Normal (1x), Hard (1.5x)
  [ ] Balance pass: test all 3 classes against all 5 bosses
```

### Phase 8: Polish & Ship

```
  [ ] First 5 minutes experience (Section 14) — tutorial flow
  [ ] Title screen + difficulty select
  [ ] Ending sequence (reference tone bible for narrative)
  [ ] Save/load: auto-save on room transition, manual at campfires/inns
  [ ] Load game from title screen
  [ ] SFX: attack, hit, crit, Exploit, level up, menu, boss phase transition
  [ ] Death messages (rotating, tone bible reference)
  [ ] Combat flavor text (tone bible reference)
  [ ] Loading screen tips (tone bible reference)
  [ ] Monster Compendium classified notes (late-game conspiracy reveals)
  [ ] Final balance and playtest pass
  [ ] Deploy to web (static hosting)
```

---

## 21. Design Commandments

1. **The Exploit "WEAKNESS!" flash is the most important 0.5 seconds in the game.** Make it feel incredible. Test it first. Polish it first.

2. **Every fight should be completable in under 60 seconds.** If it takes longer, the enemy has too much HP.

3. **Each class should feel different by fight #2.** The Bruiser should be taking hits on purpose. The Fixer should be chaining Combos. The Hacker should be Overclocking. If they all feel the same, the resource system isn't working.

4. **The first Exploit should trigger within the first 4 fights.** Design early shop inventory so the player buys an elemental weapon, and design Sprawl enemies to be weak to it.

5. **Defend is never a wasted turn.** The MP regen alone makes it meaningful for the Hacker. The Pump gain makes it a strategy for the Bruiser.

6. **The turn order bar is the biggest combat UX upgrade.** Prioritize it in Phase 4. Planning around the timeline is what makes combat feel strategic rather than reactive.

7. **Humor is in the data files, not the code.** Tone bible content goes into monsters.json, items.json, npcs.json. The engine is clean and serious.

8. **Test each class against Boss 1 before building more content.** If all 3 classes can beat the Sewer King with different strategies, the core systems work.

9. **Every room exists for a reason.** Enemy, chest, NPC, hazard, shortcut, secret, or conspiracy symbol. No empty hallways.

10. **Ship a game you'd play on your phone at lunch.** That's the bar.
