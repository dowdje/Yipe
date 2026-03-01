// combat.js — Turn-based combat engine

import { getPlayer } from './player.js';
import { removeEnemy } from './enemies.js';

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
  animType: null, // 'playerHit' | 'enemyHit' | 'miss'
};

const ACTIONS = ['Attack', 'Defend', 'Flee'];
const ANIM_MS = 300;

export function getCombat() {
  return combat;
}

export function getActions() {
  return ACTIONS;
}

export function startCombat(enemy) {
  combat.active = true;
  combat.enemy = { ...enemy, _ref: enemy }; // clone stats, keep ref for removal
  combat.turn = getPlayer().spd >= enemy.spd ? 'player' : 'enemy';
  combat.log = [`A wild ${enemy.name} appears!`];
  combat.playerAction = null;
  combat.defending = false;
  combat.result = null;
  combat.menuIndex = 0;
  combat.animating = false;

  // If enemy goes first, queue enemy turn
  if (combat.turn === 'enemy') {
    combat.log.push(`${enemy.name} is faster!`);
    setTimeout(() => executeEnemyTurn(), 500);
  }
}

export function selectAction(index) {
  if (combat.animating || combat.turn !== 'player' || combat.result) return;

  const action = ACTIONS[index];
  combat.defending = false;

  if (action === 'Attack') {
    executePlayerAttack();
  } else if (action === 'Defend') {
    executePlayerDefend();
  } else if (action === 'Flee') {
    executePlayerFlee();
  }
}

function executePlayerAttack() {
  const player = getPlayer();
  const enemy = combat.enemy;
  const damage = calcDamage(player.atk, enemy.def);

  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(`You attack for ${damage} damage!`);
  startAnim('playerHit');

  if (enemy.hp <= 0) {
    combat.result = 'victory';
    addLog(`${enemy.name} defeated! +${enemy.gold}G +${enemy.exp}EXP`);
    player.gold += enemy.gold;
    player.exp += enemy.exp;
    removeEnemy(enemy._ref);
    return;
  }

  // Enemy turn next
  combat.turn = 'enemy';
  setTimeout(() => executeEnemyTurn(), 600);
}

function executePlayerDefend() {
  combat.defending = true;
  addLog('You brace for impact!');

  combat.turn = 'enemy';
  setTimeout(() => executeEnemyTurn(), 600);
}

function executePlayerFlee() {
  const player = getPlayer();
  const fleeChance = 0.4 + (player.spd - combat.enemy.spd) * 0.1;
  if (Math.random() < Math.max(0.1, Math.min(0.9, fleeChance))) {
    combat.result = 'fled';
    addLog('You escaped!');
  } else {
    addLog('Failed to flee!');
    combat.turn = 'enemy';
    setTimeout(() => executeEnemyTurn(), 600);
  }
}

function executeEnemyTurn() {
  if (combat.result) return;

  const player = getPlayer();
  const enemy = combat.enemy;
  const rawDamage = calcDamage(enemy.atk, player.def);
  const damage = combat.defending ? Math.max(1, Math.floor(rawDamage / 2)) : rawDamage;

  player.hp = Math.max(0, player.hp - damage);

  if (combat.defending) {
    addLog(`${enemy.name} attacks for ${damage} (blocked)!`);
  } else {
    addLog(`${enemy.name} attacks for ${damage} damage!`);
  }

  startAnim('enemyHit');
  combat.defending = false;

  if (player.hp <= 0) {
    combat.result = 'defeat';
    const goldLost = Math.floor(player.gold / 2);
    player.gold -= goldLost;
    addLog('You have been defeated...');
    if (goldLost > 0) {
      addLog(`You lost ${goldLost} gold...`);
    }
    return;
  }

  combat.turn = 'player';
}

function calcDamage(atk, def) {
  return Math.max(1, atk - def) + Math.floor(Math.random() * 3);
}

function addLog(msg) {
  combat.log.push(msg);
  // Keep last 4 messages
  if (combat.log.length > 4) {
    combat.log.shift();
  }
}

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
}
