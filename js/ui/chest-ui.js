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

  const popW = 440;
  const lineH = 36;
  const popH = 80 + items.length * lineH + 40;
  const popX = (CANVAS_WIDTH - popW) / 2;
  const popY = (CANVAS_HEIGHT - popH) / 2;

  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Popup box
  ctx.fillStyle = '#16213e';
  ctx.fillRect(popX, popY, popW, popH);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.strokeRect(popX + 2, popY + 2, popW - 4, popH - 4);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '22px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('TREASURE!', popX + popW / 2, popY + 20);

  // Items
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';
  let ly = popY + 68;

  if (items.length === 0) {
    ctx.fillStyle = COLORS.combat.textDim;
    ctx.fillText('The chest is empty...', popX + 28, ly);
  } else {
    for (const item of items) {
      if (item.isGold) {
        ctx.fillStyle = COLORS.hud.gold;
        ctx.fillText(`+ ${item.name}`, popX + 28, ly);
      } else {
        const isUnique = item.rarity === 'unique';
        ctx.fillStyle = isUnique ? COLORS.item.unique : '#FFFFFF';
        let label = `+ ${item.name}`;
        if (item.qty > 1) label += ` x${item.qty}`;
        ctx.fillText(label, popX + 28, ly);
      }
      ly += lineH;
    }
  }

  // Hint
  ctx.fillStyle = COLORS.combat.textDim;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press Enter', popX + popW / 2, popY + popH - 32);
  ctx.textAlign = 'left';
}
