// boss-ai.js — Boss definitions, AI, phase system, minion spawning

import { ENEMY_TYPES, getResistanceMultiplier } from '../config.js';
import { sfxPhaseTransition } from '../engine/audio.js';

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
  the_manager: {
    name: 'The Manager',
    phases: [
      { threshold: 0.60, message: 'The Manager slams the desk! "SALE MODE ACTIVATED!"' },
      { threshold: 0.30, message: 'The Manager scans your tactics! "I\'ve analyzed your performance review!"' },
    ],
    abilities: [
      {
        id: 'memo_strike',
        name: 'Memo Strike',
        weight: 3,
        phases: [1, 2, 3],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 4);
          addLog(`The Manager strikes with a rolled-up memo for ${damage} damage!`);
          return { damage, damageType: 'physical' };
        },
      },
      {
        id: 'performance_review',
        name: 'Performance Review',
        weight: 2,
        phases: [1, 2, 3],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 1.1) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 3);
          const applyEnfeeble = Math.random() < 0.25;
          addLog(`The Manager delivers a scathing review for ${damage} damage!${applyEnfeeble ? ' 📉 Enfeebled!' : ''}`);
          return { damage, damageType: 'physical', applyStatus: applyEnfeeble ? 'enfeeble' : null };
        },
      },
      {
        id: 'summon_retail_bot',
        name: 'Summon Retail Bot',
        weight: 3,
        phases: [1],
        cooldown: 2,
        _lastUsedTurn: -99,
        damageType: null,
        execute(boss, player, combat, addLog, helpers) {
          const maxMinions = 3;
          const current = combat.minions ? combat.minions.length : 0;
          if (current >= maxMinions) {
            addLog('The Manager calls for backup but the store is full!');
            return { damage: 0, damageType: null };
          }
          helpers.spawnMinion('retail_bot', combat, addLog);
          addLog('The Manager summons a Retail Bot!');
          return { damage: 0, damageType: null };
        },
      },
      {
        id: 'double_strike',
        name: 'Double Strike',
        weight: 3,
        phases: [2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const hit1 = raw + Math.floor(Math.random() * 3);
          const hit2 = raw + Math.floor(Math.random() * 3);
          const total = hit1 + hit2;
          addLog(`The Manager attacks twice! ${hit1} + ${hit2} = ${total} damage!`);
          return { damage: total, damageType: 'physical' };
        },
      },
      {
        id: 'element_scan',
        name: 'Element Scan',
        weight: 2,
        phases: [3],
        cooldown: 4,
        _lastUsedTurn: -99,
        damageType: null,
        execute(boss, player, combat, addLog) {
          const usage = combat._playerElementUsage || {};
          let maxElement = 'physical';
          let maxCount = 0;
          for (const [elem, count] of Object.entries(usage)) {
            if (count > maxCount) { maxCount = count; maxElement = elem; }
          }
          boss.resistances[maxElement] = 2; // immune
          addLog(`The Manager becomes IMMUNE to ${maxElement}! "Your strategy has been documented!"`);
          return { damage: 0, damageType: null };
        },
      },
      {
        id: 'power_trip',
        name: 'Power Trip',
        weight: 3,
        phases: [3],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 1.3) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 5);
          addLog(`The Manager goes on a power trip for ${damage} damage!`);
          return { damage, damageType: 'physical' };
        },
      },
    ],
  },
  the_alpha: {
    name: 'The Alpha',
    phases: [
      { threshold: 0.50, message: 'The Alpha roars! "SUPERSET MODE!" Speed surges!' },
    ],
    _onPhaseChange(boss, newPhase, combat) {
      if (newPhase === 2) {
        boss.spd = 10;
        boss.atk += 10;
        boss.def = 2;
      }
    },
    abilities: [
      {
        id: 'power_slam',
        name: 'Power Slam',
        weight: 3,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 5);
          addLog(`The Alpha slams down for ${damage} damage!`);
          return { damage, damageType: 'physical' };
        },
      },
      {
        id: 'flex_crush',
        name: 'Flex Crush',
        weight: 2,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 1.2) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 4);
          addLog(`The Alpha flexes with crushing force for ${damage} damage!`);
          return { damage, damageType: 'physical' };
        },
      },
      {
        id: 'intimidate',
        name: 'Intimidate',
        weight: 2,
        phases: [1],
        cooldown: 3,
        _lastUsedTurn: -99,
        damageType: null,
        execute(boss, player, combat, addLog) {
          addLog('The Alpha roars! Your defenses falter!');
          return { damage: 0, damageType: null, applyStatus: 'enfeeble' };
        },
      },
      {
        id: 'rapid_combo',
        name: 'Rapid Combo',
        weight: 3,
        phases: [2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const hits = 2 + Math.floor(Math.random() * 2); // 2-3 hits
          let total = 0;
          for (let i = 0; i < hits; i++) {
            total += Math.max(1, Math.floor(boss.atk * 0.6) - Math.floor(player.def * 0.8)) + Math.floor(Math.random() * 2);
          }
          addLog(`The Alpha unleashes a ${hits}-hit combo for ${total} total damage!`);
          return { damage: total, damageType: 'physical' };
        },
      },
    ],
  },
  the_specimen: {
    name: 'The Specimen',
    phases: [
      { threshold: 0.60, message: 'The Specimen\'s heads coordinate! They charge in unison!' },
    ],
    _initHeads(combat) {
      combat._bossHeads = [
        { id: 'fire_head', name: 'Fire Head', hp: 100, maxHp: 100, weakness: 'ice' },
        { id: 'ice_head', name: 'Ice Head', hp: 100, maxHp: 100, weakness: 'fire' },
        { id: 'lightning_head', name: 'Lightning Head', hp: 100, maxHp: 100, weakness: 'physical' },
      ];
      combat._bossHeadTarget = 0;
    },
    abilities: [
      {
        id: 'fire_breath',
        name: 'Fire Breath',
        weight: 2,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'fire',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 4);
          addLog(`Fire Head breathes flame for ${damage} damage!`);
          return { damage, damageType: 'fire', applyStatus: Math.random() < 0.2 ? 'burn' : null };
        },
      },
      {
        id: 'ice_blast',
        name: 'Ice Blast',
        weight: 2,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'ice',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 4);
          addLog(`Ice Head fires a frozen blast for ${damage} damage!`);
          return { damage, damageType: 'ice', applyStatus: Math.random() < 0.2 ? 'chill' : null };
        },
      },
      {
        id: 'lightning_strike',
        name: 'Lightning Strike',
        weight: 2,
        phases: [1, 2],
        cooldown: 0,
        damageType: 'lightning',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 4);
          addLog(`Lightning Head sends a bolt for ${damage} damage!`);
          return { damage, damageType: 'lightning', applyStatus: Math.random() < 0.15 ? 'paralyze' : null };
        },
      },
      {
        id: 'coordinated_assault',
        name: 'Coordinated Assault',
        weight: 3,
        phases: [2],
        cooldown: 2,
        _lastUsedTurn: -99,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 1.5) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 6);
          addLog(`All heads attack in unison for ${damage} massive damage!`);
          return { damage, damageType: 'physical' };
        },
      },
    ],
  },
  the_consultant: {
    name: 'The Consultant',
    phases: [
      { threshold: 0.70, message: 'The Consultant steps into a mech suit! "Let me consult my POWER!"' },
      { threshold: 0.40, message: 'The mech sparks and sputters! The Consultant fights dirty!' },
    ],
    _initWaves(combat) {
      combat._bossWaves = [
        [{ type: 'elite_guard' }, { type: 'elite_guard' }],
        [{ type: 'elite_guard' }, { type: 'security_drone' }, { type: 'cult_acolyte' }],
        [{ type: 'void_wraith' }, { type: 'security_drone' }],
      ];
      combat._bossWaveIndex = 0;
      combat._bossUntargetable = true;
    },
    abilities: [
      {
        id: 'command',
        name: 'Command',
        weight: 3,
        phases: [1],
        cooldown: 0,
        damageType: null,
        execute(boss, player, combat, addLog, helpers) {
          // During wave phase, spawn current wave if no minions remain
          if (!combat.minions || combat.minions.length === 0) {
            if (combat._bossWaveIndex < combat._bossWaves.length) {
              const wave = combat._bossWaves[combat._bossWaveIndex];
              for (const def of wave) {
                helpers.spawnMinion(def.type, combat, addLog);
              }
              combat._bossWaveIndex++;
              addLog(`The Consultant sends in wave ${combat._bossWaveIndex}!`);
            } else {
              // All waves defeated
              combat._bossUntargetable = false;
              addLog('All guards defeated! The Consultant is exposed!');
            }
          } else {
            addLog('The Consultant watches from the shadows...');
          }
          return { damage: 0, damageType: null };
        },
      },
      {
        id: 'mech_strike',
        name: 'Mech Strike',
        weight: 3,
        phases: [2],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 1.2) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 5);
          // Shield absorbs damage
          if (combat._bossShieldHP > 0) {
            const absorbed = Math.floor(damage * 0.3);
            const actual = damage - absorbed;
            addLog(`Mech strikes for ${damage}! Shield absorbs ${absorbed}! (${actual} damage)`);
            return { damage: actual, damageType: 'physical' };
          }
          addLog(`Mech smashes for ${damage} damage!`);
          return { damage, damageType: 'physical' };
        },
      },
      {
        id: 'shield_pulse',
        name: 'Shield Pulse',
        weight: 1,
        phases: [2],
        cooldown: 5,
        _lastUsedTurn: -99,
        damageType: 'lightning',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, Math.floor(boss.atk * 0.8) - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 3);
          addLog(`Shield emits a pulse for ${damage} lightning damage!`);
          return { damage, damageType: 'lightning', applyStatus: Math.random() < 0.3 ? 'paralyze' : null };
        },
      },
      {
        id: 'dirty_strike',
        name: 'Dirty Strike',
        weight: 3,
        phases: [3],
        cooldown: 0,
        damageType: 'physical',
        execute(boss, player, combat, addLog) {
          const raw = Math.max(1, boss.atk - Math.floor(player.def * 0.8));
          const damage = raw + Math.floor(Math.random() * 5);
          const status = Math.random() < 0.3 ? 'poison' : null;
          addLog(`The Consultant fights dirty for ${damage} damage!${status ? ' ☠️ Poisoned!' : ''}`);
          return { damage, damageType: 'physical', applyStatus: status };
        },
      },
      {
        id: 'self_heal',
        name: 'Self Heal',
        weight: 2,
        phases: [3],
        cooldown: 3,
        _lastUsedTurn: -99,
        damageType: null,
        execute(boss, player, combat, addLog) {
          const heal = Math.floor(boss.maxHp * 0.05);
          boss.hp = Math.min(boss.maxHp, boss.hp + heal);
          addLog(`The Consultant patches up, healing ${heal} HP!`);
          return { damage: 0, damageType: null };
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
    // Call boss-specific phase change handler
    if (bossDef._onPhaseChange) {
      bossDef._onPhaseChange(boss, newPhase, combat);
    }
    combat._phaseTransitionFlash = true;
    combat._phaseTransitionStart = performance.now();
    sfxPhaseTransition();
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
