// hud.js — HUD overlay with player stats

import { CANVAS_WIDTH, COLORS, TILE_SIZE } from '../config.js';
import { getCtx } from '../engine/renderer.js';

const HUD_HEIGHT = 28;
const BAR_WIDTH = 60;
const BAR_HEIGHT = 10;

export function drawHud(player, locationName) {
  const ctx = getCtx();
  const y = 0;

  // Background bar
  ctx.fillStyle = COLORS.hud.bg;
  ctx.fillRect(0, y, CANVAS_WIDTH, HUD_HEIGHT);

  ctx.font = '11px monospace';
  ctx.textBaseline = 'middle';
  const cy = y + HUD_HEIGHT / 2;

  let x = 8;

  // HP
  ctx.fillStyle = COLORS.hud.text;
  ctx.fillText('HP', x, cy);
  x += 20;
  drawBar(ctx, x, cy - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, player.hp, player.maxHp, COLORS.hud.hp, COLORS.hud.hpBg);
  x += BAR_WIDTH + 4;
  ctx.fillStyle = COLORS.hud.text;
  ctx.fillText(`${player.hp}/${player.maxHp}`, x, cy);
  x += 50;

  // MP
  ctx.fillStyle = COLORS.hud.text;
  ctx.fillText('MP', x, cy);
  x += 20;
  drawBar(ctx, x, cy - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, player.mp, player.maxMp, COLORS.hud.mp, COLORS.hud.mpBg);
  x += BAR_WIDTH + 4;
  ctx.fillStyle = COLORS.hud.text;
  ctx.fillText(`${player.mp}/${player.maxMp}`, x, cy);
  x += 50;

  // Gold
  ctx.fillStyle = COLORS.hud.gold;
  ctx.fillText(`G:${player.gold}`, x, cy);
  x += 50;

  // Level
  ctx.fillStyle = COLORS.hud.text;
  ctx.fillText(`Lv:${player.level}`, x, cy);

  // Location name — right-aligned
  ctx.fillStyle = COLORS.hud.text;
  ctx.textAlign = 'right';
  ctx.fillText(locationName || '', CANVAS_WIDTH - 8, cy);
  ctx.textAlign = 'left';
}

function drawBar(ctx, x, y, w, h, current, max, fgColor, bgColor) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  const ratio = Math.max(0, Math.min(1, current / max));
  ctx.fillStyle = fgColor;
  ctx.fillRect(x, y, w * ratio, h);
}
