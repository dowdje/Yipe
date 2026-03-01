// renderer.js — Canvas drawing primitives + sprite rendering

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { PALETTES, SPRITE_DATA, TILE_SPRITE_MAP, ENEMY_SPRITE_MAP, SHOP_SPRITE_MAP } from '../data/sprites.js';

let ctx = null;

// Pre-rendered sprite canvases: { spriteId: { scale: offscreenCanvas } }
const spriteCache = {};

export function initRenderer(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Pre-render sprites
  loadSprites();
}

function loadSprites() {
  // Pre-render at common scales: 4x (64px tiles/overworld), 6x (96px combat), 8x (128px boss combat)
  const scales = [4, 6, 8];

  for (const [spriteId, data] of Object.entries(SPRITE_DATA)) {
    spriteCache[spriteId] = {};

    // Determine which palette to use
    let palette;
    if (spriteId.startsWith('tile_')) {
      palette = PALETTES.tile;
    } else if (PALETTES[spriteId]) {
      palette = PALETTES[spriteId];
    } else {
      palette = PALETTES.player;
    }

    for (const scale of scales) {
      const size = 16 * scale;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const octx = offscreen.getContext('2d');

      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
          const palIdx = data[row][col];
          if (palIdx === 0) continue; // transparent
          const [r, g, b, a] = palette[palIdx] || [255, 0, 255, 255];
          octx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
          octx.fillRect(col * scale, row * scale, scale, scale);
        }
      }

      spriteCache[spriteId][scale] = offscreen;
    }
  }
}

function drawSprite(spriteId, x, y, scale = 4) {
  const cached = spriteCache[spriteId];
  if (!cached || !cached[scale]) {
    // Fallback: render on the fly
    return false;
  }
  ctx.drawImage(cached[scale], x, y);
  return true;
}

export function clear() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawTileGrid(tiles, tileDefs) {
  for (let row = 0; row < tiles.length; row++) {
    for (let col = 0; col < tiles[row].length; col++) {
      const tileId = tiles[row][col];
      const spriteKey = TILE_SPRITE_MAP[tileId];
      const px = col * TILE_SIZE;
      const py = row * TILE_SIZE;

      if (spriteKey && drawSprite(spriteKey, px, py, 4)) {
        continue; // sprite drawn successfully
      }

      // Fallback to color rect
      const def = tileDefs[tileId];
      if (def) {
        ctx.fillStyle = def.color;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

export function drawPlayer(x, y, classId) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const spriteId = classId ? `player_${classId}` : 'player';

  if (!drawSprite(spriteId, px, py, 4)) {
    if (!drawSprite('player', px, py, 4)) {
      // Fallback
      ctx.fillStyle = COLORS.player;
      const inset = 8;
      ctx.fillRect(px + inset, py + inset, TILE_SIZE - inset * 2, TILE_SIZE - inset * 2);
    }
  }
}

export function drawPlayerLerp(fromX, fromY, toX, toY, t, classId) {
  const x = fromX + (toX - fromX) * t;
  const y = fromY + (toY - fromY) * t;
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const spriteId = classId ? `player_${classId}` : 'player';

  if (!drawSprite(spriteId, px, py, 4)) {
    if (!drawSprite('player', px, py, 4)) {
      ctx.fillStyle = COLORS.player;
      const inset = 8;
      ctx.fillRect(px + inset, py + inset, TILE_SIZE - inset * 2, TILE_SIZE - inset * 2);
    }
  }
}

export function drawEntity(x, y, color, inset = 6, spriteId = null) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  if (spriteId && drawSprite(spriteId, px, py, 4)) {
    return;
  }

  ctx.fillStyle = color;
  ctx.fillRect(px + inset, py + inset, TILE_SIZE - inset * 2, TILE_SIZE - inset * 2);
}

export function drawCombatSprite(spriteId, x, y) {
  if (spriteId && drawSprite(spriteId, x, y, 6)) {
    return true;
  }
  return false;
}

export function drawBossEntity(x, y, color, spriteId = null) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const size = TILE_SIZE * 2; // 2×2 tiles

  if (spriteId) {
    const cached = spriteCache[spriteId];
    if (cached && cached[8]) {
      ctx.drawImage(cached[8], px, py);
      return;
    }
  }

  ctx.fillStyle = color;
  const inset = 8;
  ctx.fillRect(px + inset, py + inset, size - inset * 2, size - inset * 2);
}

export function drawBossCombatSprite(spriteId, x, y) {
  if (spriteId && drawSprite(spriteId, x, y, 8)) {
    return true;
  }
  return false;
}

export function drawFade(alpha) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function getCtx() {
  return ctx;
}

// Export sprite map lookups for use by other modules
export { ENEMY_SPRITE_MAP, SHOP_SPRITE_MAP };
