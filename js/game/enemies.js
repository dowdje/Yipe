// enemies.js — Enemy state management per room

import { ENEMY_TYPES } from '../config.js';

let activeEnemies = [];

export function spawnEnemies(enemyDefs) {
  activeEnemies = (enemyDefs || []).map((def, i) => ({
    ...structuredClone(ENEMY_TYPES[def.type]),
    type: def.type,
    x: def.x,
    y: def.y,
    index: i,
  }));
}

export function getActiveEnemies() {
  return activeEnemies;
}

export function getEnemyAt(x, y) {
  return activeEnemies.find(e => e.x === x && e.y === y) || null;
}

export function removeEnemy(enemy) {
  activeEnemies = activeEnemies.filter(e => e !== enemy);
}

export function clearEnemies() {
  activeEnemies = [];
}
