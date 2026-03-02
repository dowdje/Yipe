// perk-ui.js — Perk selection modal overlay for GRIDLOCK

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';

const perkState = {
  active: false,
  options: [],
  selectedIndex: 0,
  confirming: false,
  callback: null,
};

export function getPerkState() {
  return perkState;
}

export function openPerkSelection(options, callback) {
  perkState.active = true;
  perkState.options = options;
  perkState.selectedIndex = 0;
  perkState.confirming = false;
  perkState.callback = callback;
}

export function closePerkSelection() {
  perkState.active = false;
  perkState.callback = null;
}

export function navigatePerk(dy) {
  if (perkState.confirming) return;
  const len = perkState.options.length;
  perkState.selectedIndex = (perkState.selectedIndex + dy + len) % len;
}

export function selectPerk() {
  if (perkState.confirming) {
    // Confirm
    const selected = perkState.options[perkState.selectedIndex];
    if (perkState.callback) perkState.callback(selected);
    closePerkSelection();
    return true;
  }
  perkState.confirming = true;
  return false;
}

export function cancelPerkConfirm() {
  if (perkState.confirming) {
    perkState.confirming = false;
    return true;
  }
  return false;
}

export function renderPerkSelection() {
  if (!perkState.active) return;
  const ctx = getCtx();

  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('CHOOSE A PERK', CANVAS_WIDTH / 2, 60);

  ctx.fillStyle = '#AABBCC';
  ctx.font = '16px monospace';
  ctx.fillText('This choice is permanent', CANVAS_WIDTH / 2, 104);

  // Perk options as cards
  const cardW = 280;
  const cardH = 360;
  const gap = 24;
  const totalW = perkState.options.length * cardW + (perkState.options.length - 1) * gap;
  const startX = (CANVAS_WIDTH - totalW) / 2;
  const cardY = 160;

  for (let i = 0; i < perkState.options.length; i++) {
    const perk = perkState.options[i];
    const cx = startX + i * (cardW + gap);
    const selected = i === perkState.selectedIndex;

    // Card background
    ctx.fillStyle = selected ? '#1e2d4a' : '#16213e';
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.strokeStyle = selected ? '#FFD700' : '#0f3460';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeRect(cx + 0.5, cardY + 0.5, cardW - 1, cardH - 1);

    // Perk name
    ctx.fillStyle = selected ? '#FFD700' : '#FFFFFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(perk.name, cx + cardW / 2, cardY + 32);

    // Description with word wrap
    ctx.fillStyle = '#CCDDEE';
    ctx.font = '16px monospace';
    const words = perk.desc.split(' ');
    let line = '';
    let ly = cardY + 80;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > cardW - 32 && line) {
        ctx.fillText(line, cx + cardW / 2, ly);
        line = word;
        ly += 28;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx + cardW / 2, ly);

    // Class requirement
    if (perk.classReq) {
      ctx.fillStyle = '#888899';
      ctx.font = '14px monospace';
      ctx.fillText(`(${perk.classReq} only)`, cx + cardW / 2, cardY + cardH - 32);
    }

    // Selection indicator
    if (selected) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '16px monospace';
      ctx.fillText('▸ SELECT ◂', cx + cardW / 2, cardY + cardH - 8);
    }
  }

  // Confirmation overlay
  if (perkState.confirming) {
    const boxW = 500;
    const boxH = 120;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = cardY + cardH + 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    const selected = perkState.options[perkState.selectedIndex];
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px monospace';
    ctx.fillText(`Choose "${selected.name}"?`, CANVAS_WIDTH / 2, boxY + 36);
    ctx.fillStyle = '#AABBCC';
    ctx.font = '16px monospace';
    ctx.fillText('Enter: Confirm   Esc: Cancel', CANVAS_WIDTH / 2, boxY + 80);
  }

  ctx.textAlign = 'left';
}
