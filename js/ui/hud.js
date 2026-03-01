// hud.js — HUD overlay with player stats

import { CANVAS_WIDTH, COLORS, TILE_SIZE, xpForLevel } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { getCtx } from '../engine/renderer.js';
import { getDangerLevel } from '../game/danger.js';

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

  // Level + class
  const cls = player.classId ? CLASSES[player.classId] : null;
  const clsAbbr = cls ? cls.name.slice(0, 3).toUpperCase() : '';
  ctx.fillStyle = cls ? cls.color : COLORS.hud.text;
  ctx.fillText(`Lv:${player.level}`, x, cy);
  x += 38;
  if (clsAbbr) {
    ctx.fillText(clsAbbr, x, cy);
    x += 30;
  } else {
    x += 4;
  }

  // EXP
  const expNeeded = xpForLevel(player.level);
  ctx.fillStyle = '#9944CC';
  ctx.fillText(`EXP`, x, cy);
  x += 26;
  drawBar(ctx, x, cy - BAR_HEIGHT / 2, 40, BAR_HEIGHT, player.exp, expNeeded, '#9944CC', '#332244');
  x += 44;

  // Danger meter (compact)
  const dangerLevel = getDangerLevel(player.dangerMeter || 0);
  if (player.dangerMeter > 0) {
    ctx.fillStyle = dangerLevel.color;
    ctx.font = '9px monospace';
    ctx.fillText(dangerLevel.name.slice(0, 4).toUpperCase(), x, cy - 2);
    x += 30;
    // Small bar
    const dangerW = 24;
    const dangerRatio = Math.min(1, (player.dangerMeter || 0) / 60);
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, cy - BAR_HEIGHT / 2, dangerW, BAR_HEIGHT);
    ctx.fillStyle = dangerLevel.color;
    ctx.fillRect(x, cy - BAR_HEIGHT / 2, dangerW * dangerRatio, BAR_HEIGHT);
    x += dangerW + 6;
  }

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
