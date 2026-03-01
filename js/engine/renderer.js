// renderer.js — Canvas drawing primitives

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';

let ctx = null;

export function initRenderer(canvas) {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
}

export function clear() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawTileGrid(tiles, tileDefs) {
  for (let row = 0; row < tiles.length; row++) {
    for (let col = 0; col < tiles[row].length; col++) {
      const tileId = tiles[row][col];
      const def = tileDefs[tileId];
      if (def) {
        ctx.fillStyle = def.color;
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

export function drawPlayer(x, y) {
  ctx.fillStyle = COLORS.player;
  const inset = 4;
  ctx.fillRect(
    x * TILE_SIZE + inset,
    y * TILE_SIZE + inset,
    TILE_SIZE - inset * 2,
    TILE_SIZE - inset * 2,
  );
}

export function drawPlayerLerp(fromX, fromY, toX, toY, t) {
  const x = fromX + (toX - fromX) * t;
  const y = fromY + (toY - fromY) * t;
  ctx.fillStyle = COLORS.player;
  const inset = 4;
  ctx.fillRect(
    x * TILE_SIZE + inset,
    y * TILE_SIZE + inset,
    TILE_SIZE - inset * 2,
    TILE_SIZE - inset * 2,
  );
}

export function drawEntity(x, y, color, inset = 6) {
  ctx.fillStyle = color;
  ctx.fillRect(
    x * TILE_SIZE + inset,
    y * TILE_SIZE + inset,
    TILE_SIZE - inset * 2,
    TILE_SIZE - inset * 2,
  );
}

export function drawFade(alpha) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function getCtx() {
  return ctx;
}
