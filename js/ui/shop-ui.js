// shop-ui.js — Shop screen rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { getShopState } from '../game/shop.js';
import { getPlayer } from '../game/player.js';

const PAD = 12;
const LINE_H = 20;

export function renderShop() {
  const ctx = getCtx();
  const shop = getShopState();
  const player = getPlayer();
  const c = COLORS.shop;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title bar
  ctx.fillStyle = c.panel;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 36);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, 35);

  ctx.fillStyle = c.text;
  ctx.font = '14px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText(shop.name, CANVAS_WIDTH / 2, 10);
  ctx.textAlign = 'left';

  // Gold display
  ctx.fillStyle = c.gold;
  ctx.font = '12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Gold: ${player.gold}G`, CANVAS_WIDTH - PAD, 12);
  ctx.textAlign = 'left';

  // --- Left panel: item list ---
  const listX = PAD;
  const listY = 48;
  const listW = CANVAS_WIDTH * 0.55 - PAD;
  const listH = CANVAS_HEIGHT - listY - PAD;

  drawPanel(ctx, listX, listY, listW, listH, c);

  ctx.font = '11px monospace';
  ctx.fillStyle = c.textDim;
  ctx.fillText('ITEMS', listX + 10, listY + 10);

  for (let i = 0; i < shop.items.length; i++) {
    const item = shop.items[i];
    const iy = listY + 30 + i * LINE_H;
    const canAfford = player.gold >= item.cost;

    if (i === shop.menuIndex) {
      // Highlight bar
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.fillRect(listX + 2, iy - 4, listW - 4, LINE_H);

      ctx.fillStyle = c.menuSelect;
      ctx.font = '12px monospace';
      ctx.fillText(`▸ ${item.name}`, listX + 10, iy);
    } else {
      ctx.fillStyle = canAfford ? c.menuNormal : c.textDim;
      ctx.font = '12px monospace';
      ctx.fillText(`  ${item.name}`, listX + 10, iy);
    }

    // Price right-aligned
    ctx.textAlign = 'right';
    ctx.fillStyle = canAfford ? c.gold : c.noGold;
    ctx.fillText(`${item.cost}G`, listX + listW - 10, iy);
    ctx.textAlign = 'left';
  }

  // Selected item description
  const selected = shop.items[shop.menuIndex];
  if (selected) {
    const descY = listY + 30 + shop.items.length * LINE_H + 16;
    ctx.fillStyle = c.panelBorder;
    ctx.fillRect(listX + 8, descY - 4, listW - 16, 1);

    ctx.fillStyle = c.textDim;
    ctx.font = '11px monospace';
    ctx.fillText(selected.desc, listX + 10, descY + 8);
  }

  // Message feedback
  if (shop.message) {
    const msgY = listY + listH - 24;
    const isError = shop.message === 'Not enough gold!';
    ctx.fillStyle = isError ? c.noGold : c.bought;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(shop.message, listX + listW / 2, msgY);
    ctx.textAlign = 'left';
  }

  // --- Right panel: player stats ---
  const statsX = CANVAS_WIDTH * 0.55 + PAD * 0.5;
  const statsY = 48;
  const statsW = CANVAS_WIDTH * 0.45 - PAD * 1.5;
  const statsH = listH;

  drawPanel(ctx, statsX, statsY, statsW, statsH, c);

  ctx.font = '11px monospace';
  ctx.fillStyle = c.textDim;
  ctx.fillText('STATS', statsX + 10, statsY + 10);

  let sy = statsY + 32;
  const sx = statsX + 10;

  ctx.font = '12px monospace';
  ctx.fillStyle = c.text;
  ctx.fillText(`Lv ${player.level}  Hero`, sx, sy);
  sy += 24;

  // HP bar
  ctx.fillStyle = c.text;
  ctx.font = '11px monospace';
  ctx.fillText('HP', sx, sy);
  drawBar(ctx, sx + 22, sy - 2, statsW - 70, 10, player.hp, player.maxHp, COLORS.hud.hp, COLORS.hud.hpBg);
  ctx.fillText(`${player.hp}/${player.maxHp}`, sx + statsW - 44, sy);
  sy += 18;

  // MP bar
  ctx.fillText('MP', sx, sy);
  drawBar(ctx, sx + 22, sy - 2, statsW - 70, 10, player.mp, player.maxMp, COLORS.hud.mp, COLORS.hud.mpBg);
  ctx.fillText(`${player.mp}/${player.maxMp}`, sx + statsW - 44, sy);
  sy += 24;

  // Stat values
  ctx.fillStyle = c.textDim;
  ctx.font = '11px monospace';
  ctx.fillText(`ATK  ${player.atk}`, sx, sy); sy += 16;
  ctx.fillText(`DEF  ${player.def}`, sx, sy); sy += 16;
  ctx.fillText(`SPD  ${player.spd}`, sx, sy); sy += 16;
  ctx.fillText(`LCK  ${player.lck}`, sx, sy); sy += 24;

  // Controls hint
  ctx.fillStyle = c.textDim;
  ctx.font = '10px monospace';
  ctx.fillText('↑↓ Browse', sx, statsY + statsH - 32);
  ctx.fillText('Enter Buy', sx, statsY + statsH - 18);
  ctx.fillText('Esc Exit', sx + 80, statsY + statsH - 18);
}

function drawPanel(ctx, x, y, w, h, c) {
  ctx.fillStyle = c.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawBar(ctx, x, y, w, h, current, max, fg, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const ratio = Math.max(0, Math.min(1, current / max));
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w * ratio, h);
}
