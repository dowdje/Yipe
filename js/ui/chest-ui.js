// chest-ui.js — Chest loot popup overlay

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';

const chestPopup = {
  active: false,
  items: [],   // [{ name, qty, rarity }] or [{ gold }]
  timer: 0,
};

export function getChestPopup() {
  return chestPopup;
}

export function showChestLoot(lootResults) {
  chestPopup.active = true;
  chestPopup.items = lootResults.map(r => {
    if (r.gold) return { name: `${r.gold} Gold`, isGold: true };
    return {
      name: r.item.name,
      qty: r.qty,
      rarity: r.item.rarity || 'common',
    };
  });
  chestPopup.timer = performance.now();
}

export function hideChestLoot() {
  chestPopup.active = false;
  chestPopup.items = [];
}

export function renderChestPopup() {
  if (!chestPopup.active) return;

  const ctx = getCtx();
  const items = chestPopup.items;

  const popW = 220;
  const lineH = 18;
  const popH = 40 + items.length * lineH + 20;
  const popX = (CANVAS_WIDTH - popW) / 2;
  const popY = (CANVAS_HEIGHT - popH) / 2;

  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Popup box
  ctx.fillStyle = '#16213e';
  ctx.fillRect(popX, popY, popW, popH);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.strokeRect(popX + 1, popY + 1, popW - 2, popH - 2);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '13px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('TREASURE!', popX + popW / 2, popY + 10);

  // Items
  ctx.textAlign = 'left';
  ctx.font = '11px monospace';
  let ly = popY + 34;

  if (items.length === 0) {
    ctx.fillStyle = COLORS.combat.textDim;
    ctx.fillText('The chest is empty...', popX + 14, ly);
  } else {
    for (const item of items) {
      if (item.isGold) {
        ctx.fillStyle = COLORS.hud.gold;
        ctx.fillText(`+ ${item.name}`, popX + 14, ly);
      } else {
        const isUnique = item.rarity === 'unique';
        ctx.fillStyle = isUnique ? COLORS.item.unique : '#FFFFFF';
        let label = `+ ${item.name}`;
        if (item.qty > 1) label += ` x${item.qty}`;
        ctx.fillText(label, popX + 14, ly);
      }
      ly += lineH;
    }
  }

  // Hint
  ctx.fillStyle = COLORS.combat.textDim;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press Enter', popX + popW / 2, popY + popH - 16);
  ctx.textAlign = 'left';
}
