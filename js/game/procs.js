// procs.js — Equipment proc effect trigger/execute framework for GRIDLOCK

import { ITEMS } from '../data/items.js';
import { applyStatus, STATUS_DEFS } from './status-effects.js';

export const PROC_TRIGGERS = {
  onHit: 'onHit',
  onCrit: 'onCrit',
  onKill: 'onKill',
  onHitReceived: 'onHitReceived',
};

/**
 * Check equipped items for proc effects matching the given trigger.
 * Returns array of { message, effect } results.
 */
export function checkProcs(trigger, context) {
  const { player, enemy, damage, combat } = context;
  const results = [];

  if (!player || !player.equipment) return results;

  for (const item of Object.values(player.equipment)) {
    if (!item || !item.proc) continue;
    const proc = item.proc;
    if (proc.trigger !== trigger) continue;
    if (Math.random() >= proc.chance) continue;

    const result = executeProc(proc, item, context);
    if (result) results.push(result);
  }

  return results;
}

function executeProc(proc, item, context) {
  const { player, enemy, damage, combat } = context;

  switch (proc.effect) {
    case 'applyStatus': {
      if (!enemy || enemy.hp <= 0) return null;
      const applied = applyStatus(enemy, proc.status);
      const def = STATUS_DEFS[proc.status];
      if (applied && def) {
        return { message: `${item.name}: ${def.name}!`, type: 'proc' };
      }
      return null;
    }
    case 'bonusDamage': {
      if (!enemy) return null;
      const bonus = proc.value || 10;
      enemy.hp = Math.max(0, enemy.hp - bonus);
      return { message: `${item.name}: +${bonus} bonus damage!`, type: 'proc' };
    }
    case 'healPercent': {
      if (!damage || damage <= 0) return null;
      const healAmount = Math.max(1, Math.floor(damage * (proc.value || 0.10)));
      const actual = Math.min(healAmount, player.maxHp - player.hp);
      if (actual > 0) {
        player.hp += actual;
        return { message: `${item.name}: Healed ${actual} HP!`, type: 'proc' };
      }
      return null;
    }
    case 'healFlat': {
      const amount = proc.value || 10;
      const actual = Math.min(amount, player.maxHp - player.hp);
      if (actual > 0) {
        player.hp += actual;
        return { message: `${item.name}: Healed ${actual} HP!`, type: 'proc' };
      }
      return null;
    }
    case 'damageReflect': {
      if (!enemy || !damage) return null;
      const reflected = Math.max(1, Math.floor(damage * (proc.value || 0.20)));
      enemy.hp = Math.max(0, enemy.hp - reflected);
      return { message: `${item.name}: Reflected ${reflected} damage!`, type: 'proc' };
    }
    case 'selfBuff': {
      // Simple ATK buff for a few turns
      if (combat) {
        combat._procAtkBuff = (combat._procAtkBuff || 0) + (proc.value || 5);
        combat._procAtkBuffTurns = proc.duration || 2;
      }
      return { message: `${item.name}: ATK boosted!`, type: 'proc' };
    }
    default:
      return null;
  }
}
