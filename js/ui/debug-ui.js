// debug-ui.js — Temporary debug/cheat menu for playtesting

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';

const DEBUG_OPTIONS = [
  { id: 'level1',   label: '+1 Level' },
  { id: 'level5',   label: '+5 Levels' },
  { id: 'level10',  label: '+10 Levels' },
  { id: 'gold100',  label: '+100 Gold' },
  { id: 'gold1000', label: '+1000 Gold' },
  { id: 'fullheal', label: 'Full Heal' },
  { id: 'maxstats', label: '+10 All Stats' },
  { id: 'allmat',   label: '+10 All Materials' },
  { id: 'danger0',  label: 'Reset Danger' },
];

const debugState = {
  active: false,
  selectedIndex: 0,
  message: null,
  messageTimer: 0,
};

export function getDebugState() {
  return debugState;
}

export function openDebug() {
  debugState.active = true;
  debugState.selectedIndex = 0;
  debugState.message = null;
}

export function closeDebug() {
  debugState.active = false;
}

export function navigateDebug(dy) {
  const len = DEBUG_OPTIONS.length;
  debugState.selectedIndex = (debugState.selectedIndex + dy + len) % len;
}

export function getSelectedDebugOption() {
  return DEBUG_OPTIONS[debugState.selectedIndex];
}

export function setDebugMessage(msg) {
  debugState.message = msg;
  debugState.messageTimer = performance.now();
}

export function renderDebug() {
  if (!debugState.active) return;
  const ctx = getCtx();

  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FF4444';
  ctx.font = 'bold 14px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('DEBUG MENU (TEMP)', CANVAS_WIDTH / 2, 12);
  ctx.textAlign = 'left';

  // Options
  const startY = 42;
  for (let i = 0; i < DEBUG_OPTIONS.length; i++) {
    const opt = DEBUG_OPTIONS[i];
    const y = startY + i * 22;
    const selected = i === debugState.selectedIndex;

    if (selected) {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.15)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 100, y - 4, 200, 20);
      ctx.fillStyle = '#FF6666';
    } else {
      ctx.fillStyle = '#AAAAAA';
    }

    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    const prefix = selected ? '▸ ' : '  ';
    ctx.fillText(`${prefix}${opt.label}`, CANVAS_WIDTH / 2, y);
  }

  // Message
  if (debugState.message && performance.now() - debugState.messageTimer < 1500) {
    ctx.fillStyle = '#44FF44';
    ctx.font = '11px monospace';
    ctx.fillText(debugState.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  // Controls
  ctx.fillStyle = '#666666';
  ctx.font = '9px monospace';
  ctx.fillText('↑↓ Select   Enter Apply   Esc Close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  ctx.textAlign = 'left';
}
