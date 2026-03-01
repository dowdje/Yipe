// enemies.js — Enemy state management per room with level scaling

import { ENEMY_TYPES, ENEMY_SCALING } from '../config.js';

let activeEnemies = [];

/**
 * Resolve a random enemy type from the level-appropriate pool.
 * Higher tiers are weighted more heavily as the player levels.
 */
function resolveEnemyType(playerLevel) {
  const eligible = ENEMY_SCALING.filter(tier => playerLevel >= tier.minLevel);
  if (eligible.length === 0) return 'bat';

  // Build weighted pool
  const weightedPool = [];
  for (const tier of eligible) {
    for (const type of tier.pool) {
      for (let w = 0; w < tier.weight; w++) {
        weightedPool.push(type);
      }
    }
  }

  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

export function spawnEnemies(enemyDefs, playerLevel = 1, useFixedTypes = false) {
  activeEnemies = (enemyDefs || []).map((def, i) => {
    // If fixedEnemies is set, use the room-defined type directly
    const type = useFixedTypes ? def.type : resolveEnemyType(playerLevel);
    const template = ENEMY_TYPES[type];
    if (!template) {
      // Fallback to room-defined type
      return {
        ...structuredClone(ENEMY_TYPES[def.type] || ENEMY_TYPES.bat),
        type: def.type,
        x: def.x,
        y: def.y,
        index: i,
      };
    }
    return {
      ...structuredClone(template),
      type,
      x: def.x,
      y: def.y,
      index: i,
    };
  });
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
