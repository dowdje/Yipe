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

// Difficulty multiplier: 0.75 (Easy), 1.0 (Normal), 1.5 (Hard)
let _difficultyMultiplier = 1.0;

export function setDifficulty(mult) { _difficultyMultiplier = mult; }
export function getDifficulty() { return _difficultyMultiplier; }

function applyDifficultyScaling(enemy) {
  if (_difficultyMultiplier === 1.0) return enemy;
  enemy.hp = Math.floor(enemy.hp * _difficultyMultiplier);
  enemy.maxHp = Math.floor(enemy.maxHp * _difficultyMultiplier);
  enemy.atk = Math.floor(enemy.atk * _difficultyMultiplier);
  enemy.def = Math.floor(enemy.def * _difficultyMultiplier);
  return enemy;
}

export function spawnEnemies(enemyDefs, playerLevel = 1, useFixedTypes = false) {
  activeEnemies = (enemyDefs || []).map((def, i) => {
    // If fixedEnemies is set, use the room-defined type directly
    const type = useFixedTypes ? def.type : resolveEnemyType(playerLevel);
    const template = ENEMY_TYPES[type];
    if (!template) {
      // Fallback to room-defined type
      const enemy = {
        ...structuredClone(ENEMY_TYPES[def.type] || ENEMY_TYPES.bat),
        type: def.type,
        x: def.x,
        y: def.y,
        index: i,
      };
      return applyDifficultyScaling(enemy);
    }
    const enemy = {
      ...structuredClone(template),
      type,
      x: def.x,
      y: def.y,
      index: i,
    };
    return applyDifficultyScaling(enemy);
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
