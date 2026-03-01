// world.js — Room loading, transitions, tile collision

import { GRID_COLS, GRID_ROWS, SHOP_TYPES } from '../config.js';
import { spawnEnemies } from './enemies.js';

let tileDefs = {};
let currentRoom = null;
const roomCache = {};
let activeShops = [];

// Map room IDs to file paths
function roomIdToPath(id) {
  return `data/rooms/${id}.json`;
}

export async function loadTileDefs() {
  const res = await fetch('data/tiles.json');
  tileDefs = await res.json();
}

export function getTileDefs() {
  return tileDefs;
}

export async function loadRoom(roomId) {
  if (roomCache[roomId]) {
    currentRoom = roomCache[roomId];
  } else {
    const res = await fetch(roomIdToPath(roomId));
    const room = await res.json();
    roomCache[roomId] = room;
    currentRoom = room;
  }

  // Re-spawn enemies each time a room is loaded (caves stay dangerous)
  spawnEnemies(currentRoom.enemies);

  // Load shop NPCs
  activeShops = (currentRoom.shops || []).map(def => ({
    ...def,
    color: SHOP_TYPES[def.type]?.color || '#FFFFFF',
    name: SHOP_TYPES[def.type]?.name || 'Shop',
  }));

  return currentRoom;
}

export function getCurrentRoom() {
  return currentRoom;
}

export function isWalkable(x, y) {
  if (!currentRoom) return false;
  if (y < 0 || y >= GRID_ROWS || x < 0 || x >= GRID_COLS) return false;
  const tileId = currentRoom.tiles[y][x];
  const def = tileDefs[tileId];
  return def ? def.walkable : false;
}

export function getExit(direction) {
  if (!currentRoom || !currentRoom.exits) return null;
  return currentRoom.exits[direction] || null;
}

// Returns the spawn position when entering from the given direction
export function getEntryPosition(fromDirection) {
  const opposites = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const enterFrom = opposites[fromDirection];

  switch (enterFrom) {
    case 'left':
      return findWalkableEdge('left');
    case 'right':
      return findWalkableEdge('right');
    case 'up':
      return findWalkableEdge('up');
    case 'down':
      return findWalkableEdge('down');
    default:
      return currentRoom.playerStart;
  }
}

function findWalkableEdge(edge) {
  const room = currentRoom;
  if (!room) return { x: 0, y: 0 };

  if (edge === 'left') {
    for (let y = 0; y < GRID_ROWS; y++) {
      if (tileDefs[room.tiles[y][0]]?.walkable) return { x: 0, y };
    }
  } else if (edge === 'right') {
    const col = GRID_COLS - 1;
    for (let y = 0; y < GRID_ROWS; y++) {
      if (tileDefs[room.tiles[y][col]]?.walkable) return { x: col, y };
    }
  } else if (edge === 'up') {
    for (let x = 0; x < GRID_COLS; x++) {
      if (tileDefs[room.tiles[0][x]]?.walkable) return { x, y: 0 };
    }
  } else if (edge === 'down') {
    const row = GRID_ROWS - 1;
    for (let x = 0; x < GRID_COLS; x++) {
      if (tileDefs[room.tiles[row][x]]?.walkable) return { x, y: row };
    }
  }

  return room.playerStart;
}

export function getActiveShops() {
  return activeShops;
}

export function getShopAt(x, y) {
  return activeShops.find(s => s.x === x && s.y === y) || null;
}
