// boss-ai.js — Boss definitions, AI, phase system, minion spawning

import { ENEMY_TYPES, getResistanceMultiplier } from '../config.js';

// --- Boss Definitions ---

export const BOSS_DEFS = {
  sewer_king: {
    name: 'Sewer King',
    phases: [
      { threshold: 0.60, message: 'The Sewer King shrieks! The water churns violently!' },
    ],
    abilities: [
      {
        id: 'bite',
        name: 'Bite',
        weight: 3,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 4);
          addLog(`Sewer King bites for ${damage} damage!`);
          return { damage, damageType: 'physical' };
        },
      },
      {
        id: 'tail_whip',
        name: 'Tail Whip',
        weight: 2,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 1.2) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 3);
          // 20% chance to apply chill
          let appliedChill = false;
          if (Math.random() < 0.20) {
            appliedChill = true;
          }
          addLog(`Sewer King lashes its tail for ${damage} damage!${appliedChill ? ' ❄️ Chilling!' : ''}`);
          return { damage, damageType: 'physical', applyStatus: appliedChill ? 'chill' : null };
        },
      },
      {
        id: 'submerge',
        name: 'Submerge',
        weight: 1,
        phases: [1, 2],
        cooldown: 3,
        _lastUsedTurn: -99,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          combat._bossUntargetable = true;
          combat._bossSubmergedTurns = 1;
          addLog('Sewer King submerges beneath the murky water!');
          return { damage: 0, damageType: 'physical', submerged: true };
        },
      },
      {
        id: 'summon_rats',
        name: 'Summon Rats',
        weight: 2,
        phases: [2],
        cooldown: 4,
        _lastUsedTurn: -99,
        damageType: null,
        execute(boss, player, combat, addLog, helpers) {
          const maxMinions = 3;
          const current = combat.minions ? combat.minions.length : 0;
          if (current >= maxMinions) {
            addLog('Sewer King screeches but no more rats come!');
            return { damage: 0, damageType: null };
          }
          const count = Math.min(2, maxMinions - current);
          for (let i = 0; i < count; i++) {
            helpers.spawnMinion('sewer_rat', combat, addLog);
          }
          addLog(`Sewer King summons ${count} Sewer Rat${count > 1 ? 's' : ''}!`);
          return { damage: 0, damageType: null };
        },
      },
      {
        id: 'toxic_spray',
        name: 'Toxic Spray',
        weight: 2,
        phases: [2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 0.8) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 3);
          addLog(`Sewer King sprays toxic sludge for ${damage} damage! ☠️ Poisoned!`);
          return { damage, damageType: 'physical', applyStatus: 'poison' };
        },
      },
    ],
  },
};

// --- Phase System ---

export function getBossPhase(boss) {
  const bossDef = BOSS_DEFS[boss.bossId];
  if (!bossDef) return 1;

  const hpRatio = boss.hp / boss.maxHp;
  let phase = 1;
  for (let i = 0; i < bossDef.phases.length; i++) {
    if (hpRatio <= bossDef.phases[i].threshold) {
      phase = i + 2;
    }
  }
  return phase;
}

// --- Ability Selection ---

export function selectBossAbility(bossDef, phase, combat) {
  const turnCount = combat._bossTurnCount || 0;
  const eligible = bossDef.abilities.filter(a => {
    if (!a.phases.includes(phase)) return false;
    if (a.cooldown > 0) {
      const lastUsed = a._lastUsedTurn;
      if (lastUsed !== undefined && lastUsed >= 0 && (turnCount - lastUsed) < a.cooldown) {
        return false;
      }
    }
    return true;
  });

  if (eligible.length === 0) {
    // Fallback to bite
    return bossDef.abilities.find(a => a.id === 'bite') || bossDef.abilities[0];
  }

  // Weighted random
  const totalWeight = eligible.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const ability of eligible) {
    roll -= ability.weight;
    if (roll <= 0) return ability;
  }
  return eligible[eligible.length - 1];
}

// --- Boss Turn Execution ---

export function executeBossTurn(boss, player, combat, addLog, helpers) {
  const bossDef = BOSS_DEFS[boss.bossId];
  if (!bossDef) return null;

  combat._bossTurnCount = (combat._bossTurnCount || 0) + 1;

  // Handle submerge resurface
  if (combat._bossUntargetable && combat._bossSubmergedTurns > 0) {
    combat._bossSubmergedTurns--;
    if (combat._bossSubmergedTurns <= 0) {
      combat._bossUntargetable = false;
      // Resurface lunge
      const raw = Math.max(1, Math.floor(boss.atk * 1.5) - Math.floor(player.def * 0.8));
      const damage = raw + Math.floor(Math.random() * 5);
      addLog(`Sewer King lunges from the water for ${damage} damage!`);
      // Handle minion attacks after boss
      executeMinionAttacks(combat, player, addLog);
      return { damage, damageType: 'physical' };
    }
    addLog('The water ripples ominously...');
    executeMinionAttacks(combat, player, addLog);
    return { damage: 0, damageType: null };
  }

  // Select and execute ability
  const phase = getBossPhase(boss);
  const ability = selectBossAbility(bossDef, phase, combat);

  // Track cooldown
  if (ability.cooldown > 0) {
    ability._lastUsedTurn = combat._bossTurnCount;
  }

  const result = ability.execute(boss, player, combat, addLog, helpers);

  // Handle minion attacks after boss (unless just submerged)
  if (!result.submerged) {
    executeMinionAttacks(combat, player, addLog);
  }

  return result;
}

// --- Minion Attacks ---

function executeMinionAttacks(combat, player, addLog) {
  if (!combat.minions || combat.minions.length === 0) return;

  for (const minion of combat.minions) {
    if (minion.hp <= 0) continue;
    const raw = Math.max(1, minion.atk - Math.floor(player.def * 0.8));
    const damage = raw + Math.floor(Math.random() * 2);
    addLog(`${minion.name} bites for ${damage}!`);
    player.hp = Math.max(0, player.hp - damage);
  }
}

// --- Phase Transition ---

export function checkPhaseTransition(boss, combat, addLog) {
  const bossDef = BOSS_DEFS[boss.bossId];
  if (!bossDef) return false;

  const newPhase = getBossPhase(boss);
  if (newPhase > (combat._bossPhase || 1)) {
    combat._bossPhase = newPhase;
    const phaseInfo = bossDef.phases[newPhase - 2];
    if (phaseInfo && phaseInfo.message) {
      addLog(phaseInfo.message);
    }
    combat._phaseTransitionFlash = true;
    combat._phaseTransitionStart = performance.now();
    return true;
  }
  return false;
}

// --- Minion Spawning ---

export function spawnMinion(minionType, combat, addLog) {
  const template = ENEMY_TYPES[minionType];
  if (!template) return;

  if (!combat.minions) combat.minions = [];

  const minion = {
    ...structuredClone(template),
    type: minionType,
    isMinion: true,
  };

  combat.minions.push(minion);
}
