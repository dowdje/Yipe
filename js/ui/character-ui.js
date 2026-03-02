// character-ui.js — Character menu screen (4-panel layout: Equip | Stats | Items | Abilities)

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, xpForLevel } from '../config.js';
import { ITEMS as ITEM_DEFS } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { getCtx } from '../engine/renderer.js';
import { getEffectiveStats } from '../game/stats.js';

const EQUIPMENT_SLOTS = ['weapon', 'shield', 'helm', 'chest', 'boots', 'accessory1', 'accessory2'];
const SLOT_LABELS = {
  weapon: 'Weapon',
  shield: 'Shield',
  helm: 'Helm',
  chest: 'Chest',
  boots: 'Boots',
  accessory1: 'Acc 1',
  accessory2: 'Acc 2',
};

const PANEL_COUNT = 4; // equipment, stats, items, abilities

const charMenu = {
  activePanel: 0,  // 0=equipment, 1=stats, 2=items, 3=abilities
  selectedIndex: 0,
  inventoryMode: false,  // true when selecting from inventory to equip
  inventoryIndex: 0,
  confirmingQuit: false,
  useMessage: null,       // feedback message when using an item
  useMessageTimer: 0,
};

export function getCharMenu() {
  return charMenu;
}

export function resetCharMenu() {
  charMenu.activePanel = 0;
  charMenu.selectedIndex = 0;
  charMenu.inventoryMode = false;
  charMenu.inventoryIndex = 0;
  charMenu.confirmingQuit = false;
  charMenu.useMessage = null;
  charMenu.useMessageTimer = 0;
}

export function getPanelCount() {
  return PANEL_COUNT;
}

/**
 * Get consumable items from player inventory.
 */
export function getConsumableItems(player) {
  return player.inventory.filter(i => {
    const def = ITEM_DEFS[i.id];
    return def && def.type === 'consumable';
  });
}

export function renderCharacter(player) {
  const ctx = getCtx();
  const c = COLORS.combat;

  // Clear use message after 1.5s
  if (charMenu.useMessage && performance.now() - charMenu.useMessageTimer > 1500) {
    charMenu.useMessage = null;
  }

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '24px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('CHARACTER', CANVAS_WIDTH / 2, 16);
  ctx.textAlign = 'left';

  const panelY = 56;
  const panelH = CANVAS_HEIGHT - panelY - 44;
  const gap = 6;

  // --- Panel 0: Equipment (260px) ---
  const eqW = 260;
  const eqX = 8;
  drawPanel(ctx, eqX, panelY, eqW, panelH, c, charMenu.activePanel === 0);

  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText('EQUIPMENT', eqX + 12, panelY + 16);

  let ey = panelY + 44;
  for (let i = 0; i < EQUIPMENT_SLOTS.length; i++) {
    const slot = EQUIPMENT_SLOTS[i];
    const item = player.equipment[slot];
    const selected = charMenu.activePanel === 0 && charMenu.selectedIndex === i && !charMenu.inventoryMode;

    ctx.font = '14px monospace';
    ctx.fillStyle = c.textDim;
    ctx.fillText(SLOT_LABELS[slot], eqX + 12, ey);

    ctx.font = '16px monospace';
    const isUnique = item && ITEM_DEFS[item.id] && ITEM_DEFS[item.id].rarity === 'unique';
    if (selected) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`▸${item ? item.name : '---'}`, eqX + 12, ey + 24);
    } else {
      ctx.fillStyle = item ? (isUnique ? COLORS.item.unique : c.text) : c.textDim;
      ctx.fillText(` ${item ? item.name : '---'}`, eqX + 12, ey + 24);
    }
    ey += 56;
  }

  // Equip overlay — show only items valid for the selected slot
  if (charMenu.inventoryMode) {
    const currentSlot = EQUIPMENT_SLOTS[charMenu.selectedIndex];
    const equipable = getEquipableItemsForSlot(player, currentSlot);
    const invX = eqX + 16;
    const invY = panelY + 44;
    const invW = eqW - 32;
    const invH = Math.min(panelH - 64, (equipable.length + 1) * 36 + 32);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(invX, invY, invW, invH);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(invX + 0.5, invY + 0.5, invW - 1, invH - 1);

    ctx.fillStyle = '#FFD700';
    ctx.font = '14px monospace';
    ctx.fillText(`EQUIP ${SLOT_LABELS[currentSlot].toUpperCase()}`, invX + 8, invY + 20);

    if (equipable.length === 0) {
      ctx.fillStyle = c.textDim;
      ctx.font = '16px monospace';
      ctx.fillText('No items', invX + 8, invY + 56);
    } else {
      ctx.font = '16px monospace';
      for (let i = 0; i < equipable.length; i++) {
        const iy = invY + 52 + i * 36;
        if (i === charMenu.inventoryIndex) {
          ctx.fillStyle = '#FFD700';
          ctx.fillText(`▸${equipable[i].name}`, invX + 8, iy);
        } else {
          ctx.fillStyle = c.text;
          ctx.fillText(` ${equipable[i].name}`, invX + 8, iy);
        }
      }
    }

    // Hint
    ctx.fillStyle = c.textDim;
    ctx.font = '13px monospace';
    ctx.fillText('Enter:Equip Esc:Back', invX + 4, invY + invH - 12);
  }

  // --- Panel 1: Stats (280px) ---
  const stW = 280;
  const stX = eqX + eqW + gap;
  drawPanel(ctx, stX, panelY, stW, panelH, c, charMenu.activePanel === 1);

  const stats = getEffectiveStats(player);
  let sy = panelY + 16;
  const sx = stX + 16;

  const cls = player.classId ? CLASSES[player.classId] : null;
  const className = cls ? cls.name.toUpperCase() : 'Hero';
  ctx.fillStyle = cls ? cls.color : c.text;
  ctx.font = '20px monospace';
  ctx.fillText(`Lv ${player.level} ${className}`, sx, sy);
  sy += 40;

  // HP bar
  ctx.fillStyle = c.text;
  ctx.font = '16px monospace';
  ctx.fillText('HP', sx, sy);
  drawBar(ctx, sx + 40, sy - 4, 140, 18, player.hp, player.maxHp, COLORS.hud.hp, COLORS.hud.hpBg);
  ctx.fillText(`${player.hp}/${player.maxHp}`, sx + 188, sy);
  sy += 32;

  // MP bar
  ctx.fillText('MP', sx, sy);
  drawBar(ctx, sx + 40, sy - 4, 140, 18, player.mp, player.maxMp, COLORS.hud.mp, COLORS.hud.mpBg);
  ctx.fillText(`${player.mp}/${player.maxMp}`, sx + 188, sy);
  sy += 32;

  // EXP bar
  const expNeeded = xpForLevel(player.level);
  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.fillText('EXP', sx, sy);
  drawBar(ctx, sx + 52, sy - 4, 128, 14, player.exp, expNeeded, '#9944CC', '#332244');
  ctx.fillText(`${player.exp}/${expNeeded}`, sx + 188, sy);
  sy += 36;

  // Stats with bonuses
  ctx.font = '16px monospace';
  const statLines = [
    ['ATK', player.atk, stats._atkBonus],
    ['DEF', player.def, stats._defBonus],
    ['SPD', player.spd, stats._spdBonus],
    ['LCK', player.lck, stats._lckBonus],
    ['INT', player.int || 2, stats._intBonus],
  ];

  for (const [label, base, bonus] of statLines) {
    ctx.fillStyle = c.text;
    ctx.fillText(`${label} ${base}`, sx, sy);
    if (bonus > 0) {
      ctx.fillStyle = '#44CC44';
      ctx.fillText(`(+${bonus})`, sx + 100, sy);
    }
    sy += 30;
  }

  sy += 12;
  ctx.fillStyle = COLORS.hud.gold;
  ctx.font = '16px monospace';
  ctx.fillText(`Gold: ${player.gold}`, sx, sy);

  // --- Panel 2: Items (220px) ---
  const itW = 220;
  const itX = stX + stW + gap;
  drawPanel(ctx, itX, panelY, itW, panelH, c, charMenu.activePanel === 2);

  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText('ITEMS', itX + 12, panelY + 16);

  const consumables = getConsumableItems(player);
  let iy2 = panelY + 44;

  if (consumables.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '16px monospace';
    ctx.fillText('None', itX + 12, iy2);
  } else {
    const maxVisible = Math.floor((panelH - 68) / 28);
    const scrollOffset = Math.max(0, charMenu.selectedIndex - maxVisible + 1);
    const visible = consumables.slice(
      charMenu.activePanel === 2 ? scrollOffset : 0,
      (charMenu.activePanel === 2 ? scrollOffset : 0) + maxVisible
    );

    for (let i = 0; i < visible.length; i++) {
      const item = visible[i];
      const realIdx = (charMenu.activePanel === 2 ? scrollOffset : 0) + i;
      const selected = charMenu.activePanel === 2 && charMenu.selectedIndex === realIdx;

      ctx.font = '16px monospace';
      let label = item.name;
      // Truncate long names
      if (label.length > 11) label = label.slice(0, 10) + '...';
      if (item.qty > 1) label += ` x${item.qty}`;

      if (selected) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`▸${label}`, itX + 8, iy2);
      } else {
        ctx.fillStyle = c.text;
        ctx.fillText(` ${label}`, itX + 8, iy2);
      }
      iy2 += 28;
    }
  }

  // Use message feedback
  if (charMenu.useMessage) {
    ctx.fillStyle = '#22CC44';
    ctx.font = '14px monospace';
    ctx.fillText(charMenu.useMessage, itX + 8, panelY + panelH - 16);
  }

  // --- Panel 3: Abilities + Spells (remaining width) ---
  const abX = itX + itW + gap;
  const abW = CANVAS_WIDTH - abX - 8;
  drawPanel(ctx, abX, panelY, abW, panelH, c, charMenu.activePanel === 3);

  let ry = panelY + 16;
  const rx = abX + 12;

  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText('ABILITIES', rx, ry);
  ry += 28;

  if (!player.abilities || player.abilities.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '14px monospace';
    ctx.fillText('None yet', rx, ry);
    ry += 28;
  } else {
    for (const ability of player.abilities) {
      ctx.fillStyle = c.text;
      ctx.font = '14px monospace';
      ctx.fillText(` ${ability.name}`, rx, ry);
      ry += 26;
    }
  }

  ry += 16;
  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText('SPELLS', rx, ry);
  ry += 28;

  if (!player.spells || player.spells.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '14px monospace';
    ctx.fillText('None yet', rx, ry);
  } else {
    for (const spell of player.spells) {
      ctx.fillStyle = c.text;
      ctx.font = '14px monospace';
      ctx.fillText(` ${spell.name}`, rx, ry);
      ry += 26;
    }
  }

  // Controls hint
  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('←→ Panel  ↑↓ Select  Enter Act  C Comp  K Ctrl  D Debug  I/Esc Close  Q Quit', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16);
  ctx.textAlign = 'left';

  // Quit confirmation overlay
  if (charMenu.confirmingQuit) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boxW = 560;
    const boxH = 160;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = (CANVAS_HEIGHT - boxH) / 2;

    ctx.fillStyle = '#16213e';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('START NEW GAME?', CANVAS_WIDTH / 2, boxY + 44);

    ctx.fillStyle = '#AABBCC';
    ctx.font = '18px monospace';
    ctx.fillText('All progress will be lost.', CANVAS_WIDTH / 2, boxY + 84);

    ctx.fillStyle = '#FFD700';
    ctx.font = '18px monospace';
    ctx.fillText('Enter: Confirm    Esc: Cancel', CANVAS_WIDTH / 2, boxY + 124);
    ctx.textAlign = 'left';
  }
}

export function getEquipableItemsForSlot(player, slot) {
  return player.inventory.filter(i => {
    const def = ITEM_DEFS[i.id];
    if (!def) return false;
    if (def.type === 'consumable') return false;
    // Accessories can go in either slot
    if (slot === 'accessory1' || slot === 'accessory2') {
      return def.type === 'accessory';
    }
    return def.slot === slot;
  });
}

let _itemsRef = null;
export function initCharItemsRef(items) {
  _itemsRef = items;
}

function drawPanel(ctx, x, y, w, h, c, active) {
  ctx.fillStyle = c.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = active ? '#FFD700' : c.panelBorder;
  ctx.lineWidth = active ? 2 : 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawBar(ctx, x, y, w, h, current, max, fg, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const ratio = Math.max(0, Math.min(1, current / max));
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w * ratio, h);
}
