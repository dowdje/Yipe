// crafting-ui.js — Blacksmith crafting interface for GRIDLOCK

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { RECIPES, canCraft, getMaterialName } from '../game/crafting.js';
import { ITEMS } from '../data/items.js';
import { MATERIAL_DEFS } from '../data/materials.js';

const craftState = {
  active: false,
  recipes: [],
  selectedIndex: 0,
  message: null,
  messageTimer: 0,
};

export function getCraftState() {
  return craftState;
}

export function openCrafting(knownRecipes) {
  craftState.active = true;
  craftState.recipes = knownRecipes;
  craftState.selectedIndex = 0;
  craftState.message = null;
}

export function closeCrafting() {
  craftState.active = false;
}

export function navigateCraft(dy) {
  if (craftState.recipes.length === 0) return;
  const len = craftState.recipes.length;
  craftState.selectedIndex = (craftState.selectedIndex + dy + len) % len;
}

export function setCraftMessage(msg) {
  craftState.message = msg;
  craftState.messageTimer = performance.now();
}

export function renderCrafting(player) {
  if (!craftState.active) return;
  const ctx = getCtx();
  const c = COLORS.combat;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '14px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText("GUS'S FORGE", CANVAS_WIDTH / 2, 8);
  ctx.textAlign = 'left';

  // Gold
  ctx.fillStyle = COLORS.hud.gold;
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Gold: ${player.gold}G`, CANVAS_WIDTH - 12, 10);
  ctx.textAlign = 'left';

  const listX = 12;
  const listY = 32;
  const listW = CANVAS_WIDTH * 0.5 - 16;
  const listH = CANVAS_HEIGHT - 44;

  // Left panel: recipe list
  ctx.fillStyle = c.panel;
  ctx.fillRect(listX, listY, listW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

  ctx.fillStyle = c.textDim;
  ctx.font = '10px monospace';
  ctx.fillText('RECIPES', listX + 8, listY + 10);

  if (craftState.recipes.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('No recipes known', listX + 8, listY + 30);
  } else {
    for (let i = 0; i < craftState.recipes.length; i++) {
      const recipe = craftState.recipes[i];
      const iy = listY + 28 + i * 18;
      const affordable = canCraft(recipe.id, player);

      if (i === craftState.selectedIndex) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(listX + 2, iy - 4, listW - 4, 18);
        ctx.fillStyle = '#FFD700';
      } else {
        ctx.fillStyle = affordable ? c.text : c.textDim;
      }
      ctx.font = '11px monospace';
      const prefix = i === craftState.selectedIndex ? '▸ ' : '  ';
      ctx.fillText(`${prefix}${recipe.name}`, listX + 6, iy);

      ctx.textAlign = 'right';
      ctx.fillStyle = player.gold >= recipe.gold ? COLORS.hud.gold : '#CC3333';
      ctx.fillText(`${recipe.gold}G`, listX + listW - 8, iy);
      ctx.textAlign = 'left';
    }
  }

  // Right panel: selected recipe details
  const detX = CANVAS_WIDTH * 0.5 + 4;
  const detW = CANVAS_WIDTH * 0.5 - 16;

  ctx.fillStyle = c.panel;
  ctx.fillRect(detX, listY, detW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.strokeRect(detX + 0.5, listY + 0.5, detW - 1, listH - 1);

  if (craftState.recipes.length > 0 && craftState.selectedIndex < craftState.recipes.length) {
    const recipe = craftState.recipes[craftState.selectedIndex];
    const item = ITEMS[recipe.result];
    let dy = listY + 12;

    // Result item name
    ctx.fillStyle = item ? (COLORS.rarity[item.rarity] || c.text) : c.text;
    ctx.font = '12px monospace';
    ctx.fillText(recipe.name, detX + 8, dy);
    dy += 18;

    // Item stats
    if (item) {
      ctx.fillStyle = c.textDim;
      ctx.font = '10px monospace';
      if (item.power) { ctx.fillText(`ATK +${item.power}`, detX + 8, dy); dy += 14; }
      if (item.defense) { ctx.fillText(`DEF +${item.defense}`, detX + 8, dy); dy += 14; }
      if (item.bonus) {
        for (const [stat, val] of Object.entries(item.bonus)) {
          ctx.fillText(`${stat.toUpperCase()} +${val}`, detX + 8, dy); dy += 14;
        }
      }
      if (item.damageType && item.damageType !== 'physical') {
        ctx.fillStyle = COLORS.combat.text;
        ctx.fillText(`Type: ${item.damageType}`, detX + 8, dy); dy += 14;
      }
      if (item.desc) {
        ctx.fillStyle = c.textDim;
        ctx.font = '9px monospace';
        ctx.fillText(item.desc, detX + 8, dy, detW - 16); dy += 14;
      }
    }

    dy += 6;
    ctx.fillStyle = c.text;
    ctx.font = '10px monospace';
    ctx.fillText('Materials:', detX + 8, dy);
    dy += 14;

    for (const [matId, needed] of Object.entries(recipe.materials)) {
      const have = (player.materials && player.materials[matId]) || 0;
      const enough = have >= needed;
      ctx.fillStyle = enough ? '#44CC44' : '#CC3333';
      ctx.font = '10px monospace';
      ctx.fillText(`${getMaterialName(matId)}: ${have}/${needed}`, detX + 12, dy);
      dy += 14;
    }
  }

  // Message
  if (craftState.message && performance.now() - craftState.messageTimer < 2000) {
    ctx.fillStyle = '#22CC44';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(craftState.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 18);
    ctx.textAlign = 'left';
  }

  // Controls
  ctx.fillStyle = c.textDim;
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ Browse  Enter Craft  Esc Exit', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 6);
  ctx.textAlign = 'left';
}
