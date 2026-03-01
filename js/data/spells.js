// spells.js — Utility spells available to all classes (bought from Hack Shop)
// Damage spells removed — Hacker class has its own elemental abilities
// Generic abilities removed — each class has CLASS_ABILITIES

import { getEffectiveStats } from '../game/stats.js';

export const SPELLS = {
  heal: {
    id: 'heal',
    name: 'Heal',
    learnLevel: 5,
    cost: 80,
    mpCost: 5,
    type: 'heal',
    power: 15,
    desc: 'Restore HP (scales with INT).',
    execute(player, enemy, log) {
      const stats = getEffectiveStats(player);
      const amount = 10 + stats.int;
      const healed = Math.min(amount, player.maxHp - player.hp);
      player.hp += healed;
      log(`Healed for ${healed} HP!`);
    },
  },
  health_siphon: {
    id: 'health_siphon',
    name: 'Health Siphon',
    learnLevel: 10,
    cost: 200,
    mpCost: 7,
    type: 'drain',
    power: 10,
    desc: 'Drain HP from enemy (scales with INT).',
    execute(player, enemy, log) {
      const stats = getEffectiveStats(player);
      const damage = 8 + stats.int + Math.floor(Math.random() * 4);
      enemy.hp = Math.max(0, enemy.hp - damage);
      const healed = Math.min(Math.floor(damage / 2), player.maxHp - player.hp);
      player.hp += healed;
      log(`Siphon drains ${damage} dmg, heals ${healed} HP!`);
    },
  },
  shield_aura: {
    id: 'shield_aura',
    name: 'Shield Aura',
    learnLevel: 12,
    cost: 250,
    mpCost: 6,
    type: 'buff',
    power: 0,
    desc: 'Reduce damage for 3 turns.',
    execute(player, enemy, log, combat) {
      combat._shieldAura = 3;
      log('Shield Aura activated! DEF up for 3 turns.');
    },
  },
  invisibility: {
    id: 'invisibility',
    name: 'Invisibility',
    learnLevel: 18,
    cost: 400,
    mpCost: 8,
    type: 'buff',
    power: 0,
    desc: 'Next attack is a guaranteed crit.',
    execute(player, enemy, log, combat) {
      combat._invisible = true;
      log('You fade from sight... Next attack will crit!');
    },
  },
  resurrect: {
    id: 'resurrect',
    name: 'Resurrect',
    learnLevel: 28,
    cost: 800,
    mpCost: 18,
    type: 'buff',
    power: 0,
    desc: 'Auto-revive once if killed.',
    execute(player, enemy, log, combat) {
      combat._resurrectReady = true;
      log('Resurrect prepared! You will cheat death once.');
    },
  },
};

// Legacy ABILITIES export (empty — class abilities are in class-abilities.js)
export const ABILITIES = {};
