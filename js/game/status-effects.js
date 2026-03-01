// status-effects.js — Status effect definitions, application, ticking, removal

export const STATUS_DEFS = {
  // Debuffs
  burn:     { name: 'Burn',     icon: '\u{1F525}', type: 'debuff', dur: 3, dot: 0.05, statMod: { def: -0.20 }, cure: 'ice_pack' },
  chill:    { name: 'Chill',    icon: '\u{2744}\u{FE0F}', type: 'debuff', dur: 3, statMod: { spd: -0.50 }, cure: 'hand_warmer' },
  paralyze: { name: 'Paralyze', icon: '\u{26A1}', type: 'debuff', dur: 1, skipTurn: true, immunityAfter: 3 },
  poison:   { name: 'Poison',   icon: '\u{2620}\u{FE0F}', type: 'debuff', dur: 4, dot: 0.08, cantKill: true, cure: 'antidote_gummy' },
  enfeeble: { name: 'Enfeeble', icon: '\u{2193}',  type: 'debuff', dur: 3, statMod: { atk: -0.30 } },
  // Buffs
  atk_up:   { name: 'ATK Up',  icon: '\u{2694}\u{FE0F}', type: 'buff', dur: 3, statMod: { atk: 0.25 } },
  def_up:   { name: 'DEF Up',  icon: '\u{1F6E1}\u{FE0F}', type: 'buff', dur: 3, statMod: { def: 0.25 } },
  haste:    { name: 'Haste',   icon: '\u{1F4A8}', type: 'buff', dur: 2, statMod: { spd: 1.0 } },
  regen:    { name: 'Regen',   icon: '\u{1F49A}', type: 'buff', dur: 4, hot: 0.05 },
  shield:   { name: 'Shield',  icon: '\u{1F537}', type: 'buff', dur: 99, absorb: true },
};

// Boss resistance chances
const BOSS_RESIST_CHANCE = {
  paralyze: 0.70,
  _default: 0.40,
};

/**
 * Apply a status effect to a target entity.
 * target.statuses must be an array (initialized by combat).
 * Returns true if applied, false if resisted/immune.
 */
export function applyStatus(target, statusId, extras = {}) {
  const def = STATUS_DEFS[statusId];
  if (!def) return false;

  if (!target.statuses) target.statuses = [];

  // Check paralyze immunity window
  if (statusId === 'paralyze') {
    const immunity = target._paralyzeImmunityTurns || 0;
    if (immunity > 0) return false;
  }

  // Boss resistance
  if (target.isBoss) {
    const resistChance = BOSS_RESIST_CHANCE[statusId] || BOSS_RESIST_CHANCE._default;
    if (def.type === 'debuff' && Math.random() < resistChance) {
      return false; // resisted
    }
  }

  // Don't stack same status — refresh duration instead
  const existing = target.statuses.find(s => s.id === statusId);
  if (existing) {
    existing.turnsLeft = extras.duration || def.dur;
    if (extras.shieldHp !== undefined) existing.shieldHp = extras.shieldHp;
    return true;
  }

  const entry = {
    id: statusId,
    turnsLeft: extras.duration || def.dur,
  };

  if (statusId === 'shield' && extras.shieldHp !== undefined) {
    entry.shieldHp = extras.shieldHp;
  }

  target.statuses.push(entry);
  return true;
}

/**
 * Process DOT/HOT, decrement durations, expire statuses.
 * Called at the start of an entity's turn.
 * Returns array of log messages.
 */
export function tickStatuses(target) {
  if (!target.statuses || target.statuses.length === 0) return [];

  const messages = [];
  const toRemove = [];

  for (const status of target.statuses) {
    const def = STATUS_DEFS[status.id];
    if (!def) continue;

    // DOT (damage over time)
    if (def.dot && target.maxHp) {
      let dmg = Math.max(1, Math.floor(target.maxHp * def.dot));
      if (def.cantKill && target.hp - dmg <= 0) {
        dmg = Math.max(0, target.hp - 1);
      }
      if (dmg > 0) {
        target.hp = Math.max(def.cantKill ? 1 : 0, target.hp - dmg);
        messages.push(`${def.icon} ${def.name} deals ${dmg} to ${target.name || 'you'}!`);
      }
    }

    // HOT (heal over time)
    if (def.hot && target.maxHp) {
      const heal = Math.max(1, Math.floor(target.maxHp * def.hot));
      const actual = Math.min(heal, target.maxHp - target.hp);
      if (actual > 0) {
        target.hp += actual;
        messages.push(`${def.icon} Regen heals ${actual}!`);
      }
    }

    // Decrement duration
    status.turnsLeft--;
    if (status.turnsLeft <= 0) {
      toRemove.push(status.id);
      messages.push(`${def.name} wore off.`);

      // Paralyze immunity window
      if (status.id === 'paralyze' && def.immunityAfter) {
        target._paralyzeImmunityTurns = def.immunityAfter;
      }
    }
  }

  // Decrement paralyze immunity
  if (target._paralyzeImmunityTurns > 0) {
    target._paralyzeImmunityTurns--;
  }

  // Remove expired
  for (const id of toRemove) {
    target.statuses = target.statuses.filter(s => s.id !== id);
  }

  return messages;
}

/**
 * Remove a specific status from target (cure).
 */
export function removeStatus(target, statusId) {
  if (!target.statuses) return false;
  const idx = target.statuses.findIndex(s => s.id === statusId);
  if (idx === -1) return false;
  target.statuses.splice(idx, 1);
  return true;
}

/**
 * Check if target has a specific status.
 */
export function hasStatus(target, statusId) {
  if (!target.statuses) return false;
  return target.statuses.some(s => s.id === statusId);
}

/**
 * Get aggregate stat multiplier modifiers from all active statuses.
 * Returns { atk: number, def: number, spd: number } where each is the sum
 * of all status modifiers (e.g., -0.30 from enfeeble + 0.25 from atk_up = -0.05).
 */
export function getStatusMods(target) {
  const mods = { atk: 0, def: 0, spd: 0 };
  if (!target.statuses) return mods;

  for (const status of target.statuses) {
    const def = STATUS_DEFS[status.id];
    if (!def || !def.statMod) continue;
    for (const [stat, value] of Object.entries(def.statMod)) {
      if (mods[stat] !== undefined) {
        mods[stat] += value;
      }
    }
  }

  return mods;
}

/**
 * Clear all statuses from target (combat end cleanup).
 */
export function clearAllStatuses(target) {
  if (target) {
    target.statuses = [];
    target._paralyzeImmunityTurns = 0;
  }
}
