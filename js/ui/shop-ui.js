// shop-ui.js — Shop screen rendering (General Store, Gear Shop, Spell Shop) with Buy/Sell

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { getShopState } from '../game/shop.js';
import { getPlayer } from '../game/player.js';
import { ITEMS as ITEM_DEFS } from '../data/items.js';
import { getEffectiveStats } from '../game/stats.js';

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

  // Shop name
  ctx.fillStyle = c.text;
  ctx.font = '14px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText(shop.name, CANVAS_WIDTH / 2, 4);

  // Buy/Sell tab indicator (not for spell shop)
  if (shop.type !== 'spell_shop') {
    ctx.font = '11px monospace';
    const buyColor = shop.mode === 'buy' ? c.menuSelect : c.textDim;
    const sellColor = shop.mode === 'sell' ? c.menuSelect : c.textDim;
    ctx.textAlign = 'center';
    ctx.fillStyle = buyColor;
    ctx.fillText('BUY', CANVAS_WIDTH / 2 - 30, 22);
    ctx.fillStyle = c.textDim;
    ctx.fillText('/', CANVAS_WIDTH / 2, 22);
    ctx.fillStyle = sellColor;
    ctx.fillText('SELL', CANVAS_WIDTH / 2 + 30, 22);
  }
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

  if (shop.mode === 'sell') {
    renderSellMode(ctx, shop, player, c, listX, listY, listW, listH);
  } else {
    renderBuyMode(ctx, shop, player, c, listX, listY, listW, listH);
  }

  // Message feedback
  if (shop.message) {
    const msgY = listY + listH - 24;
    const isError = shop.message === 'Not enough gold!'
      || shop.message.startsWith('Need Lv')
      || shop.message === "Can't sell that!"
      || shop.message === 'Unequip it first!';
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
  ctx.fillText(`LCK  ${player.lck}`, sx, sy); sy += 16;
  ctx.fillText(`INT  ${player.int || 2}`, sx, sy); sy += 24;

  // Controls hint
  ctx.fillStyle = c.textDim;
  ctx.font = '10px monospace';
  ctx.fillText('↑↓ Browse', sx, statsY + statsH - 46);
  const actionHint = shop.mode === 'sell' ? 'Enter Sell' : 'Enter Buy';
  ctx.fillText(actionHint, sx, statsY + statsH - 32);
  if (shop.type !== 'spell_shop') {
    ctx.fillText('Tab Buy/Sell', sx, statsY + statsH - 18);
  }
  ctx.fillText('Esc Exit', sx + 80, statsY + statsH - 32);
}

function renderBuyMode(ctx, shop, player, c, listX, listY, listW, listH) {
  ctx.font = '11px monospace';
  ctx.fillStyle = c.textDim;
  ctx.fillText(shop.type === 'spell_shop' ? 'SPELLS' : 'ITEMS', listX + 10, listY + 10);

  for (let i = 0; i < shop.items.length; i++) {
    const item = shop.items[i];
    const iy = listY + 30 + i * LINE_H;
    const canAfford = player.gold >= item.cost;

    if (item.isSpell) {
      if (i === shop.menuIndex) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(listX + 2, iy - 4, listW - 4, LINE_H);
      }

      if (item.alreadyKnown) {
        ctx.fillStyle = c.bought;
      } else if (item.levelLocked) {
        ctx.fillStyle = c.noGold;
      } else if (i === shop.menuIndex) {
        ctx.fillStyle = c.menuSelect;
      } else {
        ctx.fillStyle = canAfford ? c.menuNormal : c.textDim;
      }

      ctx.font = '12px monospace';
      const prefix = i === shop.menuIndex ? '▸ ' : '  ';
      ctx.fillText(`${prefix}${item.name}`, listX + 10, iy);

      ctx.textAlign = 'right';
      if (item.alreadyKnown) {
        ctx.fillStyle = c.bought;
        ctx.fillText('Learned', listX + listW - 10, iy);
      } else if (item.levelLocked) {
        ctx.fillStyle = c.noGold;
        ctx.fillText(`Lv ${item.learnLevel}`, listX + listW - 10, iy);
      } else {
        ctx.fillStyle = canAfford ? c.gold : c.noGold;
        ctx.fillText(`${item.cost}G`, listX + listW - 10, iy);
      }
      ctx.textAlign = 'left';
    } else {
      if (i === shop.menuIndex) {
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

      ctx.textAlign = 'right';
      ctx.fillStyle = canAfford ? c.gold : c.noGold;
      ctx.fillText(`${item.cost}G`, listX + listW - 10, iy);
      ctx.textAlign = 'left';
    }
  }

  // Selected item description + stat comparison
  const selected = shop.items[shop.menuIndex];
  if (selected) {
    const descY = listY + 30 + shop.items.length * LINE_H + 16;
    ctx.fillStyle = c.panelBorder;
    ctx.fillRect(listX + 8, descY - 4, listW - 16, 1);

    // Rarity color for name
    const itemDef = ITEM_DEFS[selected.id];
    if (itemDef && itemDef.rarity && COLORS.rarity[itemDef.rarity]) {
      ctx.fillStyle = COLORS.rarity[itemDef.rarity];
    } else {
      ctx.fillStyle = c.textDim;
    }
    ctx.font = '11px monospace';
    ctx.fillText(selected.desc, listX + 10, descY + 8);

    // Stat comparison vs equipped
    if (itemDef && itemDef.slot && !selected.isSpell) {
      let compY = descY + 22;
      const equipped = player.equipment[itemDef.slot === 'accessory1' ? 'accessory1' : itemDef.slot];
      const diffs = [];
      const newAtk = (itemDef.power || 0) + (itemDef.bonus?.atk || 0);
      const oldAtk = equipped ? ((equipped.power || 0) + (equipped.bonus?.atk || 0)) : 0;
      if (newAtk - oldAtk !== 0) diffs.push({ stat: 'ATK', diff: newAtk - oldAtk });
      const newDef = (itemDef.defense || 0) + (itemDef.bonus?.def || 0);
      const oldDef = equipped ? ((equipped.defense || 0) + (equipped.bonus?.def || 0)) : 0;
      if (newDef - oldDef !== 0) diffs.push({ stat: 'DEF', diff: newDef - oldDef });
      const newInt = itemDef.bonus?.int || 0;
      const oldInt = equipped?.bonus?.int || 0;
      if (newInt - oldInt !== 0) diffs.push({ stat: 'INT', diff: newInt - oldInt });
      const newSpd = itemDef.bonus?.spd || 0;
      const oldSpd = equipped?.bonus?.spd || 0;
      if (newSpd - oldSpd !== 0) diffs.push({ stat: 'SPD', diff: newSpd - oldSpd });

      ctx.font = '10px monospace';
      let cx = listX + 10;
      for (const d of diffs) {
        ctx.fillStyle = d.diff > 0 ? '#44CC44' : '#CC4444';
        const label = `${d.stat} ${d.diff > 0 ? '+' : ''}${d.diff}  `;
        ctx.fillText(label, cx, compY);
        cx += ctx.measureText(label).width;
      }
    }
  }
}

function renderSellMode(ctx, shop, player, c, listX, listY, listW, listH) {
  ctx.font = '11px monospace';
  ctx.fillStyle = c.textDim;
  ctx.fillText('YOUR ITEMS', listX + 10, listY + 10);

  const items = shop.sellItems;

  if (items.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('Nothing to sell', listX + 10, listY + 36);
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const iy = listY + 30 + i * LINE_H;
    const isUnique = item.rarity === 'unique';

    if (i === shop.menuIndex) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.fillRect(listX + 2, iy - 4, listW - 4, LINE_H);
      ctx.fillStyle = c.menuSelect;
      ctx.font = '12px monospace';
      let label = `▸ ${item.name}`;
      if (item.qty > 1) label += ` x${item.qty}`;
      ctx.fillText(label, listX + 10, iy);
    } else {
      ctx.fillStyle = isUnique ? COLORS.item.unique : c.menuNormal;
      ctx.font = '12px monospace';
      let label = `  ${item.name}`;
      if (item.qty > 1) label += ` x${item.qty}`;
      ctx.fillText(label, listX + 10, iy);
    }

    // Sell price right-aligned
    ctx.textAlign = 'right';
    ctx.fillStyle = item.sellPrice > 0 ? c.gold : c.textDim;
    ctx.fillText(item.sellPrice > 0 ? `${item.sellPrice}G` : '---', listX + listW - 10, iy);
    ctx.textAlign = 'left';
  }

  // Selected item description
  const selected = items[shop.menuIndex];
  if (selected) {
    const descY = listY + 30 + items.length * LINE_H + 16;
    ctx.fillStyle = c.panelBorder;
    ctx.fillRect(listX + 8, descY - 4, listW - 16, 1);
    ctx.fillStyle = c.textDim;
    ctx.font = '11px monospace';
    ctx.fillText(selected.desc, listX + 10, descY + 8);
  }
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
