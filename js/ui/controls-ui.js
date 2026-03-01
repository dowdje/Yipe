// controls-ui.js — Controls reference screen

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';

const CATEGORIES = [
  {
    name: 'Overworld',
    bindings: [
      ['Move', 'WASD / Arrows'],
      ['Interact', 'Walk into NPC/enemy'],
      ['Inventory', 'I'],
      ['Click Move', 'Click on tile'],
    ],
  },
  {
    name: 'Combat',
    bindings: [
      ['Select Action', 'Up / Down'],
      ['Confirm', 'Enter'],
      ['Cycle Targets', 'Left / Right'],
      ['Back', 'Esc'],
    ],
  },
  {
    name: 'Menus',
    bindings: [
      ['Switch Panel', 'Left / Right'],
      ['Select', 'Up / Down'],
      ['Act', 'Enter'],
      ['Close', 'Esc'],
    ],
  },
  {
    name: 'Shops',
    bindings: [
      ['Browse', 'Up / Down'],
      ['Buy / Sell', 'Enter'],
      ['Toggle Mode', 'Tab'],
      ['Exit', 'Esc'],
    ],
  },
  {
    name: 'General',
    bindings: [
      ['Inventory', 'I'],
      ['Compendium', 'C'],
      ['Controls', 'K'],
      ['Quit to Title', 'Q'],
      ['Debug', 'D'],
    ],
  },
];

const controlsState = {
  active: false,
  selectedIndex: 0,
};

export function openControls() {
  controlsState.active = true;
  controlsState.selectedIndex = 0;
}

export function closeControls() {
  controlsState.active = false;
}

export function navigateControls(dy) {
  const len = CATEGORIES.length;
  controlsState.selectedIndex = (controlsState.selectedIndex + dy + len) % len;
}

export function renderControls() {
  if (!controlsState.active) return;
  const ctx = getCtx();
  const c = COLORS.combat;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '24px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('CONTROLS', CANVAS_WIDTH / 2, 16);
  ctx.textAlign = 'left';

  const listX = 24;
  const listY = 60;
  const listW = 240;
  const listH = CANVAS_HEIGHT - 84;

  // Left panel: category list
  ctx.fillStyle = c.panel;
  ctx.fillRect(listX, listY, listW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

  for (let i = 0; i < CATEGORIES.length; i++) {
    const ey = listY + 24 + i * 40;
    const selected = i === controlsState.selectedIndex;

    ctx.fillStyle = selected ? '#FFD700' : c.text;
    ctx.font = '18px monospace';
    const prefix = selected ? '▸ ' : '  ';
    ctx.fillText(`${prefix}${CATEGORIES[i].name}`, listX + 8, ey);
  }

  // Right panel: bindings for selected category
  const detX = listX + listW + 16;
  const detW = CANVAS_WIDTH - detX - 24;

  ctx.fillStyle = c.panel;
  ctx.fillRect(detX, listY, detW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.strokeRect(detX + 0.5, listY + 0.5, detW - 1, listH - 1);

  const cat = CATEGORIES[controlsState.selectedIndex];

  // Category header
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(cat.name.toUpperCase(), detX + 20, listY + 28);

  // Bindings
  let dy = listY + 72;
  ctx.font = '16px monospace';
  for (const [action, key] of cat.bindings) {
    ctx.fillStyle = c.text;
    ctx.fillText(action, detX + 20, dy);
    ctx.fillStyle = c.textDim;
    ctx.fillText(key, detX + 260, dy);
    dy += 36;
  }

  // Bottom hint
  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ Browse  Esc Close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
  ctx.textAlign = 'left';
}
