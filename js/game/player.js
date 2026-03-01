// player.js — Player state and movement logic

import { PLAYER_DEFAULTS, GRID_COLS, GRID_ROWS, MOVE_TWEEN_MS } from '../config.js';
import { getEnemyAt } from './enemies.js';
import { getShopAt } from './world.js';

const player = {
  x: 0,
  y: 0,
  // Tween state
  moving: false,
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  moveStart: 0,
  // Stats
  ...structuredClone(PLAYER_DEFAULTS),
};

export function getPlayer() {
  return player;
}

export function setPlayerPos(x, y) {
  player.x = x;
  player.y = y;
  player.moving = false;
}

export function tryMove(dx, dy, isWalkable) {
  if (player.moving) return null;

  const nx = player.x + dx;
  const ny = player.y + dy;

  // Check for room exit
  if (nx < 0) return 'left';
  if (nx >= GRID_COLS) return 'right';
  if (ny < 0) return 'up';
  if (ny >= GRID_ROWS) return 'down';

  // Check collision
  if (!isWalkable(nx, ny)) return null;

  // Check for shop NPC at destination
  const shop = getShopAt(nx, ny);
  if (shop) {
    return { type: 'shop', shop };
  }

  // Check for enemy at destination
  const enemy = getEnemyAt(nx, ny);
  if (enemy) {
    return { type: 'combat', enemy };
  }

  // Start tween
  player.moving = true;
  player.fromX = player.x;
  player.fromY = player.y;
  player.toX = nx;
  player.toY = ny;
  player.moveStart = performance.now();

  return 'moved';
}

export function updateMovement(now) {
  if (!player.moving) return;

  const elapsed = now - player.moveStart;
  if (elapsed >= MOVE_TWEEN_MS) {
    player.x = player.toX;
    player.y = player.toY;
    player.moving = false;
  }
}

export function getMoveTween(now) {
  if (!player.moving) return null;
  const t = Math.min((now - player.moveStart) / MOVE_TWEEN_MS, 1);
  return { fromX: player.fromX, fromY: player.fromY, toX: player.toX, toY: player.toY, t };
}

export function resetStats() {
  Object.assign(player, structuredClone(PLAYER_DEFAULTS));
}
