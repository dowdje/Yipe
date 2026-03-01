// enemies.js — Enemy state management per room with level scaling

import { ENEMY_TYPES, ENEMY_SCALING } from '../config.js';

let activeEnemies = [];

// Random roaming enemy config
export const RANDOM_SPAWN_CHANCE = 0.12;
export const MAX_RANDOM_ENEMIES = 3;
export const MIN_SPAWN_DISTANCE = 4;

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

/**
 * Spawn a single roaming enemy at the given position, scaled to player level.
 */
export function spawnRandomEnemy(playerLevel, x, y) {
  const type = resolveEnemyType(playerLevel);
  const template = ENEMY_TYPES[type];
  const enemy = {
    ...structuredClone(template || ENEMY_TYPES.bat),
    type: template ? type : 'bat',
    x,
    y,
    index: activeEnemies.length,
    roaming: true,
  };
  applyDifficultyScaling(enemy);
  activeEnemies.push(enemy);
  return enemy;
}

/**
 * Count roaming enemies currently alive.
 */
export function getRoamingEnemyCount() {
  return activeEnemies.filter(e => e.roaming).length;
}

/**
 * Move each roaming enemy one tile toward the player using greedy Manhattan chase.
 * Returns the first enemy that lands on the player tile (for immediate combat), or null.
 */
export function moveRoamingEnemies(playerX, playerY, isWalkableFn, getEntityAt) {
  const pendingMoves = new Set(); // track "nx,ny" to prevent two roamers moving to same tile
  let collider = null;

  for (const enemy of activeEnemies) {
    if (!enemy.roaming) continue;

    const dx = Math.sign(playerX - enemy.x);
    const dy = Math.sign(playerY - enemy.y);

    // Determine primary/secondary axis (prefer the axis with larger distance)
    const absDx = Math.abs(playerX - enemy.x);
    const absDy = Math.abs(playerY - enemy.y);
    const candidates = absDx >= absDy
      ? [{ nx: enemy.x + dx, ny: enemy.y }, { nx: enemy.x, ny: enemy.y + dy }]
      : [{ nx: enemy.x, ny: enemy.y + dy }, { nx: enemy.x + dx, ny: enemy.y }];

    for (const { nx, ny } of candidates) {
      // Skip zero-movement
      if (nx === enemy.x && ny === enemy.y) continue;

      const key = `${nx},${ny}`;

      // Landing on the player is valid — triggers combat
      if (nx === playerX && ny === playerY) {
        enemy.x = nx;
        enemy.y = ny;
        pendingMoves.add(key);
        if (!collider) collider = enemy;
        break;
      }

      if (isWalkableFn(nx, ny) && !getEntityAt(nx, ny) && !pendingMoves.has(key)) {
        enemy.x = nx;
        enemy.y = ny;
        pendingMoves.add(key);
        break;
      }
    }
  }

  return collider;
}
