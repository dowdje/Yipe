// leveling.js — EXP gain and level-up logic (class-aware)

import { MAX_LEVEL, xpForLevel, LEVEL_STAT_GROWTH } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { CLASS_ABILITIES } from '../data/class-abilities.js';

// Legacy spell/ability tables for fallback
let SPELLS = {};
let ABILITIES = {};

export function setSpellTable(table) { SPELLS = table; }
export function setAbilityTable(table) { ABILITIES = table; }

/**
 * Adds EXP to player, processes any level-ups.
 * Returns array of { newLevel, statGains, newSpells[], newAbilities[] }
 */
export function applyExpGain(player, expAmount) {
  player.exp += expAmount;
  const results = [];

  while (player.level < MAX_LEVEL && player.exp >= xpForLevel(player.level)) {
    player.exp -= xpForLevel(player.level);
    player.level++;

    const gains = {};
    const cls = player.classId ? CLASSES[player.classId] : null;

    if (cls) {
      // Class-specific deterministic growth
      const growth = cls.statGrowth;
      for (const stat of ['hp', 'mp', 'atk', 'def', 'spd', 'lck', 'int']) {
        const val = growth[stat] || 0;
        if (val > 0) {
          gains[stat] = val;
          if (stat === 'hp') {
            player.maxHp += val;
          } else if (stat === 'mp') {
            player.maxMp += val;
          } else {
            player[stat] += val;
          }
        }
      }
    } else {
      // Fallback: random growth from LEVEL_STAT_GROWTH
      for (const [stat, [min, max]] of Object.entries(LEVEL_STAT_GROWTH)) {
        const roll = min + Math.floor(Math.random() * (max - min + 1));
        if (roll > 0) {
          gains[stat] = roll;
          if (stat === 'hp') {
            player.maxHp += roll;
          } else if (stat === 'mp') {
            player.maxMp += roll;
          } else {
            player[stat] += roll;
          }
        }
      }
    }

    // Restore HP/MP on level-up
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    // Check for new abilities
    const newSpells = [];
    const newAbilities = [];

    if (player.classId) {
      // Learn from class abilities
      const classAbilities = CLASS_ABILITIES[player.classId] || [];
      for (const ability of classAbilities) {
        if (ability.passive) continue;
        if (ability.learnLevel === player.level) {
          if (!player.abilities) player.abilities = [];
          if (!player.abilities.find(a => a.id === ability.id)) {
            player.abilities.push({ id: ability.id, name: ability.name });
            newAbilities.push(ability.name);
          }
        }
      }
    } else {
      // Fallback: legacy abilities
      for (const ability of Object.values(ABILITIES)) {
        if (ability.learnLevel === player.level) {
          if (!player.abilities) player.abilities = [];
          if (!player.abilities.find(a => a.id === ability.id)) {
            player.abilities.push({ id: ability.id, name: ability.name });
            newAbilities.push(ability.name);
          }
        }
      }
    }

    results.push({ newLevel: player.level, statGains: gains, newSpells, newAbilities });
  }

  // Cap EXP at max level
  if (player.level >= MAX_LEVEL) {
    player.exp = 0;
  }

  return results;
}
