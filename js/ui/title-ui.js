// title-ui.js — Title screen rendering for GRIDLOCK

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { hasSave, getSaveInfo } from '../engine/save.js';
import { CLASSES } from '../data/classes.js';

let menuIndex = 0;
let fadeAlpha = 1.0; // Start fully black, fade in
let fadeStart = null;
let titleAnimT = 0;

const FADE_IN_MS = 800;

export function initTitle() {
  menuIndex = 0;
  fadeAlpha = 1.0;
  fadeStart = null;
  titleAnimT = 0;
}

export function getTitleMenuIndex() {
  return menuIndex;
}

export function setTitleMenuIndex(idx) {
  const count = hasSave() ? 2 : 1;
  menuIndex = ((idx % count) + count) % count;
}

export function getMenuOptionCount() {
  return hasSave() ? 2 : 1;
}

/** Returns 'new_game' or 'continue' */
export function getSelectedTitleOption() {
  if (hasSave()) {
    return menuIndex === 0 ? 'continue' : 'new_game';
  }
  return 'new_game';
}

export function renderTitle(now) {
  const ctx = getCtx();

  // Fade in on first render
  if (fadeStart === null) fadeStart = now;
  const fadeElapsed = now - fadeStart;
  if (fadeElapsed < FADE_IN_MS) {
    fadeAlpha = 1.0 - (fadeElapsed / FADE_IN_MS);
  } else {
    fadeAlpha = 0;
  }

  titleAnimT = now * 0.001; // seconds

  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Animated background grid lines (subtle)
  ctx.strokeStyle = 'rgba(30, 40, 80, 0.3)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  const offset = (titleAnimT * 8) % gridSize;
  for (let x = -gridSize + offset; x < CANVAS_WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = -gridSize + offset; y < CANVAS_HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Title text with glow
  const titleY = 80;
  const pulse = 0.8 + 0.2 * Math.sin(titleAnimT * 2);

  // Glow
  ctx.shadowColor = `rgba(255, 215, 0, ${0.4 * pulse})`;
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GRIDLOCK', CANVAS_WIDTH / 2, titleY);

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#556688';
  ctx.font = '12px monospace';
  ctx.fillText('A Dungeon Contracting RPG', CANVAS_WIDTH / 2, titleY + 30);

  // Menu options
  const menuY = 200;
  const saveExists = hasSave();
  const options = [];

  if (saveExists) {
    options.push({ label: 'Continue', id: 'continue' });
  }
  options.push({ label: 'New Game', id: 'new_game' });

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const y = menuY + i * 32;
    const selected = i === menuIndex;

    if (selected) {
      // Selection highlight
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 80, y - 10, 160, 24);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`▸ ${opt.label} ◂`, CANVAS_WIDTH / 2, y + 2);
    } else {
      ctx.fillStyle = '#667799';
      ctx.font = '16px monospace';
      ctx.fillText(opt.label, CANVAS_WIDTH / 2, y + 2);
    }
  }

  // Save info preview (if continuing)
  if (saveExists && menuIndex === 0) {
    const info = getSaveInfo();
    if (info) {
      const previewY = menuY + options.length * 32 + 20;
      ctx.fillStyle = '#1a1a3e';
      ctx.fillRect(CANVAS_WIDTH / 2 - 100, previewY - 4, 200, 52);
      ctx.strokeStyle = '#333366';
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 100, previewY - 4, 200, 52);

      const cls = CLASSES[info.classId];
      const className = cls ? cls.name : 'Unknown';
      const playmins = Math.floor((info.playtime || 0) / 60);

      ctx.fillStyle = cls ? cls.color : '#AABBCC';
      ctx.font = '11px monospace';
      ctx.fillText(`${className} Lv.${info.level}`, CANVAS_WIDTH / 2, previewY + 10);

      ctx.fillStyle = '#556677';
      ctx.font = '10px monospace';
      ctx.fillText(`${playmins}m played`, CANVAS_WIDTH / 2, previewY + 26);
    }
  }

  // Controls hint
  ctx.fillStyle = '#3a3a5a';
  ctx.font = '10px monospace';
  ctx.fillText('↑↓ Choose    Enter Select', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

  // Fade overlay
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}
