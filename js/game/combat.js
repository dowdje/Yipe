// combat.js — Turn-based combat engine (Phase 4: tick timeline, status effects, defend/flee rework)

import { getPlayer, addToInventory } from './player.js';
import { removeEnemy } from './enemies.js';
import { applyExpGain } from './leveling.js';
import { getEffectiveStats, getEnemyEffectiveStats, getCritChance } from './stats.js';
import { rollLoot, ITEMS } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { CLASS_ABILITIES } from '../data/class-abilities.js';
import { getResistanceMultiplier, DAMAGE_TYPE_COLORS, ENEMY_TYPES } from '../config.js';
const ENEMY_TYPES_REF = ENEMY_TYPES;
import {
  applyStatus, tickStatuses, removeStatus, hasStatus,
  clearAllStatuses, STATUS_DEFS,
} from './status-effects.js';
import { checkProcs } from './procs.js';
import { recordKill, recordResistanceDiscovery } from './compendium.js';
import { getDangerLevel, addDanger } from './danger.js';
import { MATERIAL_DEFS } from '../data/materials.js';
import { getAllPerkModifiers as _getAllPerkModifiers } from './perks.js';

// Status application chances on elemental damage
const STATUS_APPLY_CHANCE = {
  fire: { statusId: 'burn', chance: 0.25 },
  ice: { statusId: 'chill', chance: 0.25 },
  lightning: { statusId: 'paralyze', chance: 0.20 },
};

const combat = {
  active: false,
  enemy: null,
  turn: 'player', // 'player' | 'enemy'
  log: [],
  playerAction: null,
  defending: false,
  result: null, // null | 'victory' | 'defeat' | 'fled'
  menuIndex: 0,
  animating: false,
  animStart: 0,
  animType: null, // 'playerHit' | 'enemyHit' | 'miss' | 'weakness'
  levelUpResults: null,
  lootDrops: null,
  lootRarity: null,
  // Sub-menu state
  subMenu: null,      // null | 'spell' | 'ability' | 'item'
  subMenuIndex: 0,
  subMenuItems: [],
  // Buff flags (legacy + new)
  _parrying: false,
  _evasion: false,
  _warCryTurns: 0,
  _shieldAura: 0,
  _invisible: false,
  _resurrectReady: false,
  // Class resource state
  classResource: 0,         // Pump (bruiser) or Combo (fixer)
  _overclockElement: null,   // Hacker overclock element
  _overclockTurns: 0,        // Hacker overclock remaining turns
  // Exploit system
  exploitMeter: 0,
  exploitAutoCrit: false,
  exploitFreeAction: false,
  exploitDoubleTurns: 0,
  // Class-specific combat flags
  _smokeBombUsed: false,
  _rebootUsed: false,
  _noPainBonus: 0,
  _noPainDamageTaken: 0,
  _roidRageTurns: 0,
  _deathMarkTurns: 0,
  _ironSkinTurns: 0,
  _flexRetaliating: false,
  _enemyStunned: false,
  _exploitOpening: false,
  _scanned: false,
  _enemyHasActed: false, // tracks whether enemy has taken a turn (for Backstab)
  _backstabUsed: false,  // Backstab is once per combat
  // Weakness flash
  _weaknessFlash: false,
  _weaknessFlashStart: 0,
  // Last damage type (for UI coloring)
  _lastDamageType: null,
  // Phase 4: Timeline system
  timeline: [],           // precomputed upcoming turns [{entity: 'player'|'enemy', ticks}]
  playerTicks: 0,
  enemyTicks: 0,
  // Phase 4: Status effects
  playerStatuses: [],     // status effects on player (proxy — real data lives on player._statusObj)
  enemyStatuses: [],      // status effects on enemy (proxy — real data lives on enemy)
  // MP recovery flash
  _mpFlash: false,
  _mpFlashStart: 0,
  // Boss fight state
  _bossUntargetable: false,
  _bossSubmergedTurns: 0,
  _bossPhase: 1,
  _bossTurnCount: 0,
  _phaseTransitionFlash: false,
  _phaseTransitionStart: 0,
  minions: [],
  targetIndex: -1,  // -1 = boss, 0+ = minion index
};

const ANIM_MS = 300;
const WEAKNESS_FLASH_MS = 500;
const MP_FLASH_MS = 400;

export function getCombat() {
  return combat;
}

export function getActions() {
  return combat.subMenu ? combat.subMenuItems : getTopActions();
}

export function getTopActions() {
  const player = getPlayer();
  // Class-specific basic attack replaces generic Attack
  let basicAttack = 'Attack';
  if (player.classId === 'bruiser') basicAttack = 'Strike';
  else if (player.classId === 'fixer') basicAttack = 'Shiv';

  const actions = [basicAttack];

  // Bruiser: Flex replaces Defend
  if (player.classId === 'bruiser') {
    actions.push('Spell', 'Ability', 'Item', 'Flex', 'Flee');
  } else {
    actions.push('Spell', 'Ability', 'Item', 'Defend', 'Flee');
  }

  return actions;
}

/**
 * Get the flee gold cost for display purposes.
 */
export function getFleeCost() {
  const player = getPlayer();
  return Math.max(1, Math.floor(player.gold * 0.10));
}

// --- Timeline System ---

/**
 * Compute ticks needed for an entity to act based on effective SPD.
 */
function ticksToAct(effectiveSpd) {
  // SPD 3 = 26, SPD 4 = 20, SPD 6 = 13, SPD 8 = 10, SPD 10 = 8, SPD 12 = 7
  // Fast characters get meaningfully more turns, but no one acts every tick
  return Math.max(5, Math.floor(80 / Math.max(1, effectiveSpd)));
}

/**
 * Get the player's status source object for stat calculations.
 */
function getPlayerStatusSource() {
  return { statuses: combat.playerStatuses };
}

/**
 * Compute upcoming turn order (next `count` turns).
 */
function computeTimeline(count = 8) {
  const player = getPlayer();
  const playerStats = getEffectiveStats(player, getPlayerStatusSource());
  const enemyStats = getEnemyEffectiveStats(combat.enemy);

  const pTickRate = ticksToAct(playerStats.spd);
  const eTickRate = ticksToAct(enemyStats.spd);

  let pTicks = combat.playerTicks;
  let eTicks = combat.enemyTicks;

  const timeline = [];

  for (let i = 0; i < count; i++) {
    // Whoever reaches their tick threshold first acts next
    const pNext = pTicks + pTickRate;
    const eNext = eTicks + eTickRate;

    if (pNext <= eNext) {
      timeline.push({ entity: 'player', ticks: pNext });
      pTicks = pNext;
    } else {
      timeline.push({ entity: 'enemy', ticks: eNext });
      eTicks = eNext;
    }
  }

  combat.timeline = timeline;
}

/**
 * Determine the next actor from the timeline and advance ticks.
 * Returns 'player' or 'enemy'.
 */
function advanceTimeline() {
  const player = getPlayer();
  const playerStats = getEffectiveStats(player, getPlayerStatusSource());
  const enemyStats = getEnemyEffectiveStats(combat.enemy);

  const pTickRate = ticksToAct(playerStats.spd);
  const eTickRate = ticksToAct(enemyStats.spd);

  const pNext = combat.playerTicks + pTickRate;
  const eNext = combat.enemyTicks + eTickRate;

  if (pNext <= eNext) {
    combat.playerTicks = pNext;
    computeTimeline();
    return 'player';
  } else {
    combat.enemyTicks = eNext;
    computeTimeline();
    return 'enemy';
  }
}

// --- Combat Start ---

export function startCombat(enemy) {
  const player = getPlayer();
  const stats = getEffectiveStats(player);

  combat.active = true;
  combat.enemy = { ...enemy, _ref: enemy };
  combat.log = [`A wild ${enemy.name} appears!`];
  combat.playerAction = null;
  combat.defending = false;
  combat.result = null;
  combat.menuIndex = 0;
  combat.animating = false;
  combat.levelUpResults = null;
  combat.lootDrops = null;
  combat.lootRarity = null;
  combat.subMenu = null;
  combat.subMenuIndex = 0;
  combat.subMenuItems = [];

  // Reset buffs
  combat._parrying = false;
  combat._evasion = false;
  combat._warCryTurns = 0;
  combat._shieldAura = 0;
  combat._invisible = false;
  combat._resurrectReady = false;

  // Reset class resource
  combat.classResource = 0;
  combat._overclockElement = null;
  combat._overclockTurns = 0;

  // Reset exploit
  combat.exploitMeter = 0;
  combat.exploitAutoCrit = false;
  combat.exploitFreeAction = false;
  combat.exploitDoubleTurns = 0;

  // Reset class flags
  combat._smokeBombUsed = false;
  combat._rebootUsed = false;
  combat._noPainBonus = 0;
  combat._noPainDamageTaken = 0;
  combat._roidRageTurns = 0;
  combat._deathMarkTurns = 0;
  combat._ironSkinTurns = 0;
  combat._flexRetaliating = false;
  combat._enemyStunned = false;
  combat._exploitOpening = false;
  combat._scanned = false;
  combat._enemyHasActed = false;
  combat._backstabUsed = false;
  combat._weaknessFlash = false;
  combat._lastDamageType = null;

  // Phase 4: Reset timeline and status effects
  combat.playerTicks = 0;
  combat.enemyTicks = 0;
  combat.playerStatuses = [];
  combat.enemyStatuses = [];
  combat.enemy.statuses = combat.enemyStatuses;
  combat.enemy._paralyzeImmunityTurns = 0;
  combat._mpFlash = false;

  // Reset boss fight state
  combat._bossUntargetable = false;
  combat._bossSubmergedTurns = 0;
  combat._bossPhase = 1;
  combat._bossTurnCount = 0;
  combat._phaseTransitionFlash = false;
  combat._phaseTransitionStart = 0;
  combat.minions = [];
  combat.targetIndex = -1;

  // Apply danger stat mods to enemy
  const dangerLevel = getDangerLevel(player.dangerMeter || 0);
  if (dangerLevel.statMod > 0) {
    combat.enemy.atk = Math.floor(combat.enemy.atk * (1 + dangerLevel.statMod));
    combat.enemy.def = Math.floor(combat.enemy.def * (1 + dangerLevel.statMod));
    combat.enemy.spd = Math.max(1, Math.floor(combat.enemy.spd * (1 + dangerLevel.statMod)));
  }

  // Increment danger on combat start
  addDanger(player, enemy.isBoss ? 5 : 2);

  // Record elemental resistance discovery when player attacks with elemental damage
  // (handled in applyDamageTypeEffects)

  // Determine first turn via timeline
  const enemySpd = combat.enemy.spd;
  combat.turn = stats.spd >= enemySpd ? 'player' : 'enemy';

  // Set initial ticks so the faster entity is at 0
  // and compute the timeline
  computeTimeline();

  if (combat.turn === 'enemy') {
    combat.log.push(`${enemy.name} is faster!`);
    // Advance enemy ticks for first turn
    combat.enemyTicks += ticksToAct(enemySpd);
    computeTimeline();
    setTimeout(() => executeEnemyTurn(), 500);
  }
}

// --- Action Selection ---

export function selectAction(index) {
  if (combat.animating || combat.turn !== 'player' || combat.result) return;

  if (combat.subMenu) {
    executeSubMenuAction(index);
    return;
  }

  const actions = getTopActions();
  const action = actions[index];
  combat.defending = false;

  if (action === 'Attack' || action === 'Strike' || action === 'Shiv') {
    executePlayerAttack(action);
  } else if (action === 'Defend') {
    executePlayerDefend();
  } else if (action === 'Flex') {
    executeFlex();
  } else if (action === 'Flee') {
    executePlayerFlee();
  } else if (action === 'Spell') {
    openSubMenu('spell');
  } else if (action === 'Ability') {
    openSubMenu('ability');
  } else if (action === 'Item') {
    openSubMenu('item');
  }
}

function openSubMenu(type) {
  const player = getPlayer();
  let items = [];

  if (type === 'spell') {
    items = (player.spells || []).map(s => ({ ...s, type: 'spell' }));
  } else if (type === 'ability') {
    // Use class abilities filtered by level; hide opener-only after enemy has acted
    if (player.classId) {
      const classAbilities = CLASS_ABILITIES[player.classId] || [];
      items = classAbilities
        .filter(a => !a.passive && a.learnLevel <= player.level && !(a.openerOnly && (combat._enemyHasActed || combat._backstabUsed)))
        .map(a => ({ id: a.id, name: a.name, type: 'ability' }));
    } else {
      items = (player.abilities || []).map(a => ({ ...a, type: 'ability' }));
    }
  } else if (type === 'item') {
    items = player.inventory
      .filter(i => {
        const def = ITEMS[i.id];
        return def && def.type === 'consumable';
      })
      .map(i => ({ ...i, type: 'item' }));
  }

  if (items.length === 0) {
    addLog(`No ${type}s available!`);
    return;
  }

  combat.subMenu = type;
  combat.subMenuIndex = 0;
  combat.subMenuItems = items;
}

function executeSubMenuAction(index) {
  const item = combat.subMenuItems[index];
  if (!item) return;

  const player = getPlayer();

  if (item.type === 'spell') {
    if (!_spellsModule) {
      addLog('Spells not available!');
      closeSubMenu();
      return;
    }
    const spellDef = _spellsModule.SPELLS[item.id];
    if (!spellDef) return;
    if (player.mp < spellDef.mpCost) {
      addLog(`Not enough MP! (Need ${spellDef.mpCost})`);
      return;
    }
    // Untargetable guard for offensive spells
    if (combat._bossUntargetable && combat.targetIndex === -1 && !spellDef.selfTarget) {
      addLog(`${combat.enemy.name} is untargetable!`);
      closeSubMenu();
      endPlayerTurn();
      return;
    }
    player.mp -= spellDef.mpCost;
    const spellTarget = spellDef.selfTarget ? combat.enemy : getCurrentTarget();
    spellDef.execute(player, spellTarget, addLog, combat);
    closeSubMenu();

    // Phase transition check for boss
    if (combat.enemy.bossId && _bossAiModule && spellTarget === combat.enemy) {
      _bossAiModule.checkPhaseTransition(combat.enemy, combat, addLog);
    }

    if (checkVictory()) return;
    endPlayerTurn();
  } else if (item.type === 'ability') {
    executeClassAbility(item.id);
  } else if (item.type === 'item') {
    const itemDef = ITEMS[item.id];
    if (!itemDef || !itemDef.use) return;
    const msg = itemDef.use(player, combat);
    addLog(msg);
    const { removeFromInventory } = getPlayerModule();
    removeFromInventory(player, item.id);
    // Update sub-menu items
    combat.subMenuItems = player.inventory
      .filter(i => {
        const def = ITEMS[i.id];
        return def && def.type === 'consumable';
      })
      .map(i => ({ ...i, type: 'item' }));
    if (combat.subMenuItems.length === 0) {
      closeSubMenu();
    } else if (combat.subMenuIndex >= combat.subMenuItems.length) {
      combat.subMenuIndex = combat.subMenuItems.length - 1;
    }

    endPlayerTurn();
  }
}

function executeClassAbility(abilityId) {
  const player = getPlayer();
  if (!player.classId) return;

  const classAbilities = CLASS_ABILITIES[player.classId] || [];
  const abilityDef = classAbilities.find(a => a.id === abilityId);
  if (!abilityDef) return;

  // Check MP cost
  if (abilityDef.mpCost > 0 && player.mp < abilityDef.mpCost) {
    addLog(`Not enough MP! (Need ${abilityDef.mpCost})`);
    return;
  }

  // Check resource cost
  const resourceCost = abilityDef.resourceCost;
  if (resourceCost > 0 && (combat.classResource || 0) < resourceCost) {
    const cls = CLASSES[player.classId];
    addLog(`Not enough ${cls.resource.name}! (Need ${resourceCost})`);
    return;
  }

  // Special: Eviscerate requires min 2 CP
  if (resourceCost === -1 && (combat.classResource || 0) < 2) {
    addLog('Need at least 2 Combo Points!');
    return;
  }

  // Deduct MP
  if (abilityDef.mpCost > 0) {
    player.mp -= abilityDef.mpCost;
  }

  // Deduct resource (except -1 which is handled inside execute)
  if (resourceCost > 0) {
    combat.classResource -= resourceCost;
  }

  // Untargetable guard for offensive abilities
  const abilityTarget = abilityDef.selfTarget ? combat.enemy : getCurrentTarget();
  if (combat._bossUntargetable && combat.targetIndex === -1 && !abilityDef.selfTarget && !abilityDef.isDefend) {
    addLog(`${combat.enemy.name} is untargetable!`);
    closeSubMenu();
    endPlayerTurn();
    return;
  }

  const result = abilityDef.execute(player, abilityTarget, addLog, combat, getEffectiveStats);
  closeSubMenu();

  if (result && result.failed) return; // Don't end turn on failed ability

  // Apply damage type multipliers if ability did damage
  if (result && result.damage > 0 && result.damageType) {
    applyDamageTypeEffects(result.damage, result.damageType);
    // Try to apply status effect from elemental damage
    tryApplyStatusFromDamage(abilityTarget, result.damageType);
  }

  // Check if we killed a minion
  if (abilityTarget.isMinion && abilityTarget.hp <= 0) {
    addLog(`${abilityTarget.name} defeated!`);
    combat.minions = combat.minions.filter(m => m !== abilityTarget);
    combat.targetIndex = -1;
    endPlayerTurn();
    return;
  }

  // Phase transition check for boss
  if (combat.enemy.bossId && _bossAiModule && abilityTarget === combat.enemy) {
    _bossAiModule.checkPhaseTransition(combat.enemy, combat, addLog);
  }

  // Flex is a defend action — enemy acts next
  if (abilityDef.isDefend) {
    endPlayerTurn();
    return;
  }

  if (combat.enemy.hp <= 0) {
    startAnim('playerHit');
    if (checkVictory()) return;
  } else {
    startAnim('playerHit');
  }

  endPlayerTurn();
}

/**
 * Apply damage type effects: resistance check, exploit meter, weakness flash.
 * Note: actual damage was already applied by the ability's execute function.
 * This function handles exploit meter and visual feedback.
 */
function applyDamageTypeEffects(damage, damageType) {
  if (!combat.enemy || !combat.enemy.resistances) return;
  const resist = combat.enemy.resistances[damageType];
  if (resist === undefined) return;

  // Record resistance discovery in compendium
  if (damageType !== 'physical') {
    const player = getPlayer();
    recordResistanceDiscovery(player, combat.enemy.type, damageType);
  }

  if (resist < 0) {
    // Vulnerability hit — increment exploit meter
    combat.exploitMeter++;
    combat._weaknessFlash = true;
    combat._weaknessFlashStart = performance.now();
    checkExploitThresholds();
  }
}

/**
 * Try to apply a status effect from elemental damage to a target.
 */
function tryApplyStatusFromDamage(target, damageType) {
  const rule = STATUS_APPLY_CHANCE[damageType];
  if (!rule) return;

  if (Math.random() < rule.chance) {
    const applied = applyStatus(target, rule.statusId);
    const def = STATUS_DEFS[rule.statusId];
    if (applied) {
      addLog(`${def.icon} ${target.name || 'Target'} is ${def.name}ed!`);
    } else if (target.isBoss) {
      addLog(`${target.name} resisted ${def.name}!`);
    }
  }
}

/**
 * New damage formula per design doc.
 * Now uses enemy effective stats (with status mods) for defense.
 */
function calcDamageWithType(attacker, target, weaponPower, damageType, playerRef) {
  // Use status-modified defense for enemy targets
  const targetDef = (target.statuses && target.statuses.length > 0)
    ? getEnemyEffectiveStats(target).def
    : target.def;

  const base = attacker.atk + weaponPower + Math.floor(Math.random() * 5) - 2;
  let raw = Math.max(1, base - targetDef);

  // Resistance multiplier
  let typeMult = 1.0;
  if (target.resistances && target.resistances[damageType] !== undefined) {
    typeMult = getResistanceMultiplier(target.resistances[damageType]);
  }

  // Exploit multiplier — vulnerability bonus
  let exploitMult = 1.0;
  if (target.resistances && target.resistances[damageType] < 0) {
    exploitMult = 1.5;
    // Perk: Exploit Master boosts exploit damage
    if (playerRef) {
      const exploitPerks = _getAllPerkModifiers(playerRef, 'exploitDmg');
      for (const perk of exploitPerks) {
        exploitMult *= perk.value;
      }
    }
  }

  // Crit
  const critChance = getCritChance(attacker, playerRef);
  let isCrit = false;
  if (combat._invisible) {
    isCrit = true;
    combat._invisible = false;
  } else if (combat.exploitAutoCrit) {
    isCrit = true;
    combat.exploitAutoCrit = false;
    addLog('Exploit: Auto-crit!');
  } else if (combat._exploitOpening) {
    isCrit = true;
    combat._exploitOpening = false;
  } else {
    isCrit = Math.random() < critChance;
  }
  const critMult = isCrit ? 1.75 : 1.0;

  // Overclock multiplier (Hacker)
  let overclockMult = 1.0;
  if (combat._overclockElement && combat._overclockTurns > 0) {
    if (damageType === combat._overclockElement) {
      overclockMult = 1.2;
    }
  }

  // Roid Rage
  if (combat._roidRageTurns > 0) {
    raw = Math.floor(raw * 1.3);
  }

  // War Cry (legacy support)
  if (combat._warCryTurns > 0) {
    raw = Math.floor(raw * 1.3);
  }

  // Death Mark on target
  let deathMarkMult = 1.0;
  if (combat._deathMarkTurns > 0) {
    deathMarkMult = 2.0;
  }

  // Exploit double turns
  let doubleMult = 1.0;
  if (combat.exploitDoubleTurns > 0) {
    doubleMult = 2.0;
  }

  // No Pain No Gain bonus (Bruiser passive)
  const noPainBonus = combat._noPainBonus || 0;

  let final = Math.floor((raw + noPainBonus) * typeMult * exploitMult * critMult * overclockMult * deathMarkMult * doubleMult);
  final = Math.max(typeMult > 0 ? 1 : 0, final);

  return { damage: final, isCrit, typeMult, isVulnerable: typeMult > 1.0, isImmune: typeMult === 0 };
}

// --- Player Actions ---

function executePlayerAttack(action) {
  const player = getPlayer();
  const target = getCurrentTarget();

  // Untargetable guard (boss submerged)
  if (combat._bossUntargetable && combat.targetIndex === -1) {
    addLog(`${combat.enemy.name} is untargetable!`);
    endPlayerTurn();
    return;
  }

  const enemy = target;
  const stats = getEffectiveStats(player, getPlayerStatusSource());

  // Determine weapon damage type
  const weapon = player.equipment.weapon;
  const weaponPower = weapon ? (weapon.power || 0) : 0;
  const damageType = weapon && weapon.damageType ? weapon.damageType : 'physical';

  const result = calcDamageWithType(stats, enemy, weaponPower, damageType, player);

  enemy.hp = Math.max(0, enemy.hp - result.damage);
  combat._lastDamageType = damageType;

  // Build log message based on class action
  let msg = '';
  const attackVerb = action === 'Shiv' ? 'Shiv' : action === 'Strike' ? 'Strike' : 'Attack';
  if (result.isImmune) {
    msg = `${enemy.name} is IMMUNE!`;
  } else if (result.isCrit) {
    msg = `CRITICAL ${attackVerb}! ${result.damage} damage!`;
  } else {
    msg = `${attackVerb}! ${result.damage} damage!`;
  }

  if (result.isVulnerable && !result.isImmune) {
    combat.exploitMeter++;
    combat._weaknessFlash = true;
    combat._weaknessFlashStart = performance.now();
    msg += ' WEAKNESS!';
    checkExploitThresholds();
  }

  // Fixer Shiv: +1 Combo (crits give +2)
  if (action === 'Shiv') {
    combat.classResource = Math.min((combat.classResource || 0) + 1, 5);
    if (result.isCrit) {
      combat.classResource = Math.min(combat.classResource + 1, 5);
    }
    msg += ` CP ${combat.classResource}/5`;
  }

  // Bruiser Strike: +1 Pump, 30% stun
  if (action === 'Strike') {
    combat.classResource = Math.min((combat.classResource || 0) + 1, 10);
    msg += ` Pump ${combat.classResource}/10`;
    if (Math.random() < 0.15) {
      combat._enemyStunned = true;
      msg += ' Stunned!';
    }
  }

  addLog(msg);
  startAnim('playerHit');

  // Try to apply status from elemental weapon damage
  if (result.damage > 0 && !result.isImmune) {
    tryApplyStatusFromDamage(enemy, damageType);
  }

  // Proc effects on hit
  const procContext = { player, enemy, damage: result.damage, combat };
  const procs = checkProcs('onHit', procContext);
  if (result.isCrit) {
    procs.push(...checkProcs('onCrit', procContext));
  }
  for (const proc of procs) {
    addLog(proc.message);
  }

  // Bruiser: decrement roid rage
  if (combat._roidRageTurns > 0) combat._roidRageTurns--;
  if (combat._warCryTurns > 0) combat._warCryTurns--;

  // Hacker: decrement overclock
  if (combat._overclockTurns > 0) combat._overclockTurns--;

  // Death mark decrement
  if (combat._deathMarkTurns > 0) combat._deathMarkTurns--;

  // Exploit double turns decrement
  if (combat.exploitDoubleTurns > 0) combat.exploitDoubleTurns--;

  // Check if we killed a minion
  if (enemy.isMinion && enemy.hp <= 0) {
    addLog(`${enemy.name} defeated!`);
    combat.minions = combat.minions.filter(m => m !== enemy);
    combat.targetIndex = -1; // Revert target to boss
    endPlayerTurn();
    return;
  }

  // Phase transition check for boss
  if (combat.enemy.bossId && _bossAiModule && enemy === combat.enemy) {
    _bossAiModule.checkPhaseTransition(combat.enemy, combat, addLog);
  }

  if (checkVictory()) return;
  endPlayerTurn();
}

function executePlayerDefend() {
  combat.defending = true;
  const player = getPlayer();

  // MP recovery: 5% of max MP
  const mpRecovery = Math.max(1, Math.floor(player.maxMp * 0.05));
  const actualMp = Math.min(mpRecovery, player.maxMp - player.mp);
  if (actualMp > 0) {
    player.mp += actualMp;
    combat._mpFlash = true;
    combat._mpFlashStart = performance.now();
    addLog(`You brace! (+${actualMp} MP)`);
  } else {
    addLog('You brace for impact!');
  }

  endPlayerTurn();
}

function executeFlex() {
  // Bruiser's Flex: 50% DR, +2 Pump, retaliation on hit + MP recovery
  combat.defending = true;
  combat._flexRetaliating = true;
  combat.classResource = Math.min((combat.classResource || 0) + 2, 10);

  const player = getPlayer();
  const mpRecovery = Math.max(1, Math.floor(player.maxMp * 0.05));
  const actualMp = Math.min(mpRecovery, player.maxMp - player.mp);
  if (actualMp > 0) {
    player.mp += actualMp;
    combat._mpFlash = true;
    combat._mpFlashStart = performance.now();
  }

  addLog(`You flex! Pump +2 (${combat.classResource}/10). Braced!${actualMp > 0 ? ` (+${actualMp} MP)` : ''}`);
  endPlayerTurn();
}

function executePlayerFlee() {
  const enemy = combat.enemy;

  // Can't flee bosses
  if (enemy.isBoss) {
    addLog("Can't flee from a boss!");
    return;
  }

  const player = getPlayer();

  // Smoke bomb free escape
  if (combat._smokeBombUsed) {
    combat.result = 'fled';
    addLog('Smoke Bomb: free escape!');
    return;
  }

  // Always succeeds, costs 10% gold
  const cost = Math.max(1, Math.floor(player.gold * 0.10));
  player.gold = Math.max(0, player.gold - cost);
  combat.result = 'fled';
  addLog(`You fled! Lost ${cost} gold.`);
}

// --- Turn Management (Timeline-based) ---

function endPlayerTurn() {
  if (combat.result) return;

  // Check for exploit free action
  if (combat.exploitFreeAction) {
    combat.exploitFreeAction = false;
    addLog('Exploit: Free action! Enemy stunned!');
    combat.turn = 'player';
    return;
  }

  // Advance timeline to determine next actor
  const nextActor = advanceTimeline();

  if (nextActor === 'player') {
    combat.turn = 'player';
    // Tick player statuses at start of consecutive player turn
    processPlayerStatusTick();
  } else {
    combat.turn = 'enemy';
    setTimeout(() => executeEnemyTurn(), 600);
  }
}

/**
 * Process status ticks for the player at the start of their turn.
 */
function processPlayerStatusTick() {
  const player = getPlayer();
  const statusSource = { statuses: combat.playerStatuses, maxHp: player.maxHp, hp: player.hp, name: 'you' };
  const messages = tickStatuses(statusSource);
  // Sync HP back
  player.hp = statusSource.hp;
  // Sync statuses back
  combat.playerStatuses = statusSource.statuses;

  for (const msg of messages) {
    addLog(msg);
  }

  // Check paralyze skip
  if (hasStatus(statusSource, 'paralyze')) {
    addLog('You are paralyzed!');
    // Skip player turn
    const nextActor = advanceTimeline();
    if (nextActor === 'enemy') {
      combat.turn = 'enemy';
      setTimeout(() => executeEnemyTurn(), 600);
    } else {
      combat.turn = 'player';
      // Another player turn — will tick again next action
    }
    return;
  }

  if (player.hp <= 0) {
    if (combat._resurrectReady) {
      combat._resurrectReady = false;
      player.hp = Math.floor(player.maxHp * 0.3);
      addLog('Resurrect activates! You rise again!');
    } else {
      combat.result = 'defeat';
      addLog('You have been defeated...');
    }
  }
}

function executeEnemyTurn() {
  if (combat.result) return;
  combat._enemyHasActed = true;

  const player = getPlayer();
  const enemy = combat.enemy;

  // Tick enemy statuses at start of enemy turn
  const enemyMessages = tickStatuses(enemy);
  combat.enemyStatuses = enemy.statuses;
  for (const msg of enemyMessages) {
    addLog(msg);
  }

  // Check if enemy died from DOT
  if (enemy.hp <= 0) {
    if (checkVictory()) return;
  }

  // Check paralyze skip
  if (hasStatus(enemy, 'paralyze')) {
    addLog(`${enemy.name} is paralyzed!`);
    // Advance to next actor
    const nextActor = advanceTimeline();
    if (nextActor === 'player') {
      combat.turn = 'player';
      processPlayerStatusTick();
    } else {
      combat.turn = 'enemy';
      setTimeout(() => executeEnemyTurn(), 600);
    }
    return;
  }

  // Stun check (Shoulder Check, Smoke Bomb, etc.)
  if (combat._enemyStunned) {
    combat._enemyStunned = false;
    addLog(`${enemy.name} is stunned and can't act!`);
    const nextActor = advanceTimeline();
    if (nextActor === 'player') {
      combat.turn = 'player';
      processPlayerStatusTick();
    } else {
      combat.turn = 'enemy';
      setTimeout(() => executeEnemyTurn(), 600);
    }
    return;
  }

  // Evasion check
  if (combat._evasion) {
    combat._evasion = false;
    addLog(`${enemy.name} attacks but you dodge!`);
    startAnim('miss');
    scheduleNextTurn();
    return;
  }

  // Iron Skin (Bruiser): negate all damage
  if (combat._ironSkinTurns > 0) {
    combat._ironSkinTurns--;
    addLog(`${enemy.name} attacks but Iron Skin blocks everything!`);
    startAnim('miss');
    // Bruiser: +1 Pump on being targeted
    if (player.classId === 'bruiser') {
      combat.classResource = Math.min((combat.classResource || 0) + 1, 10);
    }
    scheduleNextTurn();
    return;
  }

  // Boss AI dispatch
  if (enemy.bossId && _bossAiModule) {
    const helpers = { spawnMinion: _bossAiModule.spawnMinion };
    const bossResult = _bossAiModule.executeBossTurn(enemy, player, combat, addLog, helpers);

    if (bossResult && bossResult.damage > 0) {
      let bossDmg = bossResult.damage;

      // Apply defend/flex DR
      if (combat.defending) {
        if (combat._flexRetaliating) {
          bossDmg = Math.max(1, Math.floor(bossDmg / 2));
        } else {
          bossDmg = Math.max(1, Math.floor(bossDmg * 0.65));
        }
      }
      if (combat._shieldAura > 0) {
        bossDmg = Math.max(1, Math.floor(bossDmg * 0.7));
        combat._shieldAura--;
      }

      player.hp = Math.max(0, player.hp - bossDmg);

      // Apply status from boss ability
      if (bossResult.applyStatus) {
        const applied = applyStatus({ statuses: combat.playerStatuses, name: 'you' }, bossResult.applyStatus);
        if (applied) {
          combat.playerStatuses = combat.playerStatuses.concat().filter(() => true); // force re-reference
        }
      }
    } else if (bossResult && bossResult.applyStatus) {
      const applied = applyStatus({ statuses: combat.playerStatuses, name: 'you' }, bossResult.applyStatus);
      if (applied) {
        combat.playerStatuses = combat.playerStatuses.concat().filter(() => true);
      }
    }

    startAnim('enemyHit');
    combat.defending = false;
    combat._flexRetaliating = false;

    // Bruiser: +1 Pump when taking damage from boss
    if (player.classId === 'bruiser' && bossResult && bossResult.damage > 0) {
      combat.classResource = Math.min((combat.classResource || 0) + 1, 10);
    }

    if (player.hp <= 0) {
      if (combat._resurrectReady) {
        combat._resurrectReady = false;
        player.hp = Math.floor(player.maxHp * 0.3);
        addLog('Resurrect activates! You rise again!');
        scheduleNextTurn();
        return;
      }
      combat.result = 'defeat';
      addLog('You have been defeated...');
      return;
    }

    scheduleNextTurn();
    return;
  }

  const rawDamage = calcEnemyDamage(enemy, player);
  let damage = rawDamage;

  // Defend: 35% DR (Flex stays 50% via _flexRetaliating flag already being set alongside defending)
  if (combat.defending) {
    if (combat._flexRetaliating) {
      damage = Math.max(1, Math.floor(damage / 2)); // Flex: 50% DR (Bruiser identity)
    } else {
      damage = Math.max(1, Math.floor(damage * 0.65)); // Regular Defend: 35% DR
    }
  }

  // Shield Aura reduces damage further
  if (combat._shieldAura > 0) {
    damage = Math.max(1, Math.floor(damage * 0.7));
    combat._shieldAura--;
  }

  // Shield status absorb
  if (hasStatus({ statuses: combat.playerStatuses }, 'shield')) {
    const shieldEntry = combat.playerStatuses.find(s => s.id === 'shield');
    if (shieldEntry && shieldEntry.shieldHp > 0) {
      const absorbed = Math.min(damage, shieldEntry.shieldHp);
      shieldEntry.shieldHp -= absorbed;
      damage -= absorbed;
      if (shieldEntry.shieldHp <= 0) {
        removeStatus({ statuses: combat.playerStatuses }, 'shield');
        combat.playerStatuses = combat.playerStatuses.filter(s => s.id !== 'shield');
        addLog('Shield shattered!');
      }
      if (damage <= 0) {
        addLog(`Shield absorbed all damage!`);
        scheduleNextTurn();
        return;
      }
    }
  }

  // Parry reflects damage
  if (combat._parrying) {
    combat._parrying = false;
    const reflected = Math.floor(damage * 0.5);
    enemy.hp = Math.max(0, enemy.hp - reflected);
    addLog(`You parry! ${enemy.name} takes ${reflected} reflected damage!`);
    startAnim('playerHit');

    if (enemy.hp <= 0) {
      if (checkVictory()) return;
    }

    scheduleNextTurn();
    return;
  }

  player.hp = Math.max(0, player.hp - damage);

  if (combat.defending) {
    addLog(`${enemy.name} attacks for ${damage} (blocked)!`);
  } else {
    addLog(`${enemy.name} attacks for ${damage} damage!`);
  }

  // Proc effects on hit received
  const hitProcs = checkProcs('onHitReceived', { player, enemy, damage, combat });
  for (const proc of hitProcs) {
    addLog(proc.message);
  }

  startAnim('enemyHit');

  // Flex retaliation
  if (combat._flexRetaliating) {
    combat._flexRetaliating = false;
    const retDmg = Math.max(1, Math.floor(player.atk * 0.3));
    enemy.hp = Math.max(0, enemy.hp - retDmg);
    addLog(`Flex retaliation: ${retDmg} damage!`);
    if (enemy.hp <= 0) {
      if (checkVictory()) return;
    }
  }

  combat.defending = false;

  // Bruiser: +1 Pump when taking damage
  if (player.classId === 'bruiser' && damage > 0) {
    combat.classResource = Math.min((combat.classResource || 0) + 1, 10);
    // No Pain No Gain passive check
    const abilities = CLASS_ABILITIES.bruiser || [];
    const noPainAbility = abilities.find(a => a.id === 'no_pain_no_gain');
    if (noPainAbility && player.abilities.find(a => a.id === 'no_pain_no_gain')) {
      combat._noPainDamageTaken = (combat._noPainDamageTaken || 0) + damage;
      const newBonus = Math.min(10, Math.floor(combat._noPainDamageTaken / 50));
      if (newBonus > combat._noPainBonus) {
        combat._noPainBonus = newBonus;
        addLog(`No Pain No Gain! ATK +${newBonus}`);
      }
    }
  }

  if (player.hp <= 0) {
    // Resurrect check
    if (combat._resurrectReady) {
      combat._resurrectReady = false;
      player.hp = Math.floor(player.maxHp * 0.3);
      addLog('Resurrect activates! You rise again!');
      scheduleNextTurn();
      return;
    }

    combat.result = 'defeat';
    addLog('You have been defeated...');
    return;
  }

  scheduleNextTurn();
}

/**
 * Schedule the next turn based on the timeline.
 */
function scheduleNextTurn() {
  const nextActor = advanceTimeline();

  if (nextActor === 'player') {
    combat.turn = 'player';
    processPlayerStatusTick();
  } else {
    combat.turn = 'enemy';
    setTimeout(() => executeEnemyTurn(), 600);
  }
}

function calcEnemyDamage(enemy, player) {
  const stats = getEffectiveStats(player, getPlayerStatusSource());
  const enemyStats = getEnemyEffectiveStats(enemy);
  // DEF blocks 80% of its value — armor helps but doesn't fully wall damage
  const effectiveDef = Math.floor(stats.def * 0.8);
  return Math.max(1, enemyStats.atk - effectiveDef) + 1 + Math.floor(Math.random() * 3);
}

// --- Exploit system ---

function checkExploitThresholds() {
  if (combat.exploitMeter >= 10) {
    combat.exploitDoubleTurns = 2;
    combat.exploitMeter = 0;
    addLog('EXPLOIT MAX! All damage x2 for 2 turns!');
  } else if (combat.exploitMeter >= 6 && !combat.exploitFreeAction) {
    combat.exploitFreeAction = true;
    addLog('Exploit: Free action charged!');
  } else if (combat.exploitMeter >= 3 && !combat.exploitAutoCrit) {
    combat.exploitAutoCrit = true;
    addLog('Exploit: Auto-crit charged!');
  }
}

// --- Victory ---

export function checkVictory() {
  const enemy = combat.enemy;
  if (!enemy || enemy.hp > 0) return false;

  const player = getPlayer();
  combat.result = 'victory';

  // Boss victory: clear minions, set quest flag
  if (enemy.bossId) {
    combat.minions = [];
    combat.targetIndex = -1;
    if (!player.questFlags) player.questFlags = {};
    player.questFlags[`boss_${enemy.bossId}_defeated`] = true;
    addLog(`BOSS DEFEATED! ${enemy.name} is vanquished! +${enemy.gold}G +${enemy.exp}EXP`);
  } else {
    addLog(`${enemy.name} defeated! +${enemy.gold}G +${enemy.exp}EXP`);
  }
  player.gold += enemy.gold;

  // Compendium recording
  recordKill(player, enemy.type);

  // Proc effects on kill
  const killProcs = checkProcs('onKill', { player, enemy, damage: 0, combat });
  for (const proc of killProcs) {
    addLog(proc.message);
  }

  // Material drops
  const enemyDef = ENEMY_TYPES_REF ? ENEMY_TYPES_REF[enemy.type] : null;
  if (enemyDef && enemyDef.materialDrops) {
    if (!player.materials) player.materials = {};
    for (const drop of enemyDef.materialDrops) {
      if (Math.random() < drop.chance) {
        player.materials[drop.material] = (player.materials[drop.material] || 0) + 1;
        const matDef = MATERIAL_DEFS[drop.material];
        const matName = matDef ? matDef.name : drop.material;
        addLog(`Found: ${matName}!`);
      }
    }
  }

  // Loot drops
  const lootResult = rollLoot(enemy.type, player.level);
  if (lootResult) {
    addToInventory(player, lootResult.item);
    combat.lootDrops = [lootResult.item.name];
    combat.lootRarity = lootResult.rarity;
    if (lootResult.rarity === 'unique') {
      addLog(`RARE FIND: ${lootResult.item.name}!`);
    } else {
      addLog(`Found: ${lootResult.item.name}!`);
    }
  }

  const levelResults = applyExpGain(player, enemy.exp);
  if (levelResults.length > 0) {
    combat.levelUpResults = levelResults;
    for (const lr of levelResults) {
      addLog(`LEVEL UP! You are now level ${lr.newLevel}!`);
      for (const spell of lr.newSpells) {
        addLog(`Learned spell: ${spell}!`);
      }
      for (const ability of lr.newAbilities) {
        addLog(`Learned ability: ${ability}!`);
      }
    }
  }

  // Cleanup statuses
  clearAllStatuses(enemy);
  clearAllStatuses({ statuses: combat.playerStatuses, _paralyzeImmunityTurns: 0 });
  combat.playerStatuses = [];
  combat.enemyStatuses = [];

  removeEnemy(enemy._ref);
  return true;
}

// --- Logging ---

function addLog(msg) {
  combat.log.push(msg);
  if (combat.log.length > 4) {
    combat.log.shift();
  }
}

export { addLog as combatLog };

// --- Animation ---

function startAnim(type) {
  combat.animating = true;
  combat.animType = type;
  combat.animStart = performance.now();
}

export function updateCombatAnim(now) {
  if (!combat.animating) return;
  if (now - combat.animStart >= ANIM_MS) {
    combat.animating = false;
    combat.animType = null;
  }
  // Weakness flash timer
  if (combat._weaknessFlash && now - combat._weaknessFlashStart >= WEAKNESS_FLASH_MS) {
    combat._weaknessFlash = false;
  }
  // MP flash timer
  if (combat._mpFlash && now - combat._mpFlashStart >= MP_FLASH_MS) {
    combat._mpFlash = false;
  }
  // Phase transition flash timer
  if (combat._phaseTransitionFlash && now - combat._phaseTransitionStart >= 800) {
    combat._phaseTransitionFlash = false;
  }
}

export function getAnimProgress(now) {
  if (!combat.animating) return null;
  const t = Math.min((now - combat.animStart) / ANIM_MS, 1);
  return { type: combat.animType, t };
}

export function endCombat() {
  combat.active = false;
  combat.enemy = null;
  combat.result = null;
  combat.subMenu = null;
  combat.subMenuItems = [];
  combat.playerStatuses = [];
  combat.enemyStatuses = [];
  combat.timeline = [];
  combat.minions = [];
  combat.targetIndex = -1;
  combat._bossUntargetable = false;
  combat._bossSubmergedTurns = 0;
  combat._bossPhase = 1;
  combat._bossTurnCount = 0;
  combat._phaseTransitionFlash = false;
}

// --- Sub-menu navigation ---

export function navigateSubMenu(dy) {
  if (!combat.subMenu) return;
  const len = combat.subMenuItems.length;
  combat.subMenuIndex = (combat.subMenuIndex + dy + len) % len;
}

export function closeSubMenu() {
  combat.subMenu = null;
  combat.subMenuIndex = 0;
  combat.subMenuItems = [];
}

// --- Target System (Boss fights) ---

export function getCurrentTarget() {
  if (combat.targetIndex === -1 || !combat.minions || combat.minions.length === 0) {
    return combat.enemy;
  }
  if (combat.targetIndex >= 0 && combat.targetIndex < combat.minions.length) {
    return combat.minions[combat.targetIndex];
  }
  return combat.enemy;
}

export function cycleTarget(dir) {
  if (!combat.minions || combat.minions.length === 0) return;
  if (combat.turn !== 'player' || combat.result || combat.animating) return;

  // Total targets: boss (-1) + minions (0, 1, 2, ...)
  const totalTargets = 1 + combat.minions.length;
  // Map targetIndex from -1-based to 0-based for cycling
  const current = combat.targetIndex + 1; // 0 = boss, 1+ = minions
  const next = (current + dir + totalTargets) % totalTargets;
  combat.targetIndex = next - 1;
}

// --- Lazy module refs ---

let _spellsModule = null;
export function initSpellsRef(spellsModule) {
  _spellsModule = spellsModule;
}

let _itemsModule = null;
export function initItemsRef(itemsModule) {
  _itemsModule = itemsModule;
}

let _bossAiModule = null;
export function initBossAiRef(mod) { _bossAiModule = mod; }

let _playerModule = null;
function getPlayerModule() {
  if (!_playerModule) {
    _playerModule = { removeFromInventory: () => false };
  }
  return _playerModule;
}
export function initPlayerRef(mod) {
  _playerModule = mod;
}
