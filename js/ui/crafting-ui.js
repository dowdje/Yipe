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
  ctx.font = '24px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText("GUS'S FORGE", CANVAS_WIDTH / 2, 16);
  ctx.textAlign = 'left';

  // Gold
  ctx.fillStyle = COLORS.hud.gold;
  ctx.font = '18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Gold: ${player.gold}G`, CANVAS_WIDTH - 24, 20);
  ctx.textAlign = 'left';

  const listX = 24;
  const listY = 64;
  const listW = CANVAS_WIDTH * 0.5 - 32;
  const listH = CANVAS_HEIGHT - 88;

  // Left panel: recipe list
  ctx.fillStyle = c.panel;
  ctx.fillRect(listX, listY, listW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText('RECIPES', listX + 16, listY + 20);

  if (craftState.recipes.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '18px monospace';
    ctx.fillText('No recipes known', listX + 16, listY + 60);
  } else {
    for (let i = 0; i < craftState.recipes.length; i++) {
      const recipe = craftState.recipes[i];
      const iy = listY + 56 + i * 36;
      const affordable = canCraft(recipe.id, player);

      if (i === craftState.selectedIndex) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(listX + 4, iy - 8, listW - 8, 36);
        ctx.fillStyle = '#FFD700';
      } else {
        ctx.fillStyle = affordable ? c.text : c.textDim;
      }
      ctx.font = '18px monospace';
      const prefix = i === craftState.selectedIndex ? '▸ ' : '  ';
      ctx.fillText(`${prefix}${recipe.name}`, listX + 12, iy);

      ctx.textAlign = 'right';
      ctx.fillStyle = player.gold >= recipe.gold ? COLORS.hud.gold : '#CC3333';
      ctx.fillText(`${recipe.gold}G`, listX + listW - 16, iy);
      ctx.textAlign = 'left';
    }
  }

  // Right panel: selected recipe details
  const detX = CANVAS_WIDTH * 0.5 + 8;
  const detW = CANVAS_WIDTH * 0.5 - 32;

  ctx.fillStyle = c.panel;
  ctx.fillRect(detX, listY, detW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.strokeRect(detX + 0.5, listY + 0.5, detW - 1, listH - 1);

  if (craftState.recipes.length > 0 && craftState.selectedIndex < craftState.recipes.length) {
    const recipe = craftState.recipes[craftState.selectedIndex];
    const item = ITEMS[recipe.result];
    let dy = listY + 24;

    // Result item name
    ctx.fillStyle = item ? (COLORS.rarity[item.rarity] || c.text) : c.text;
    ctx.font = '20px monospace';
    ctx.fillText(recipe.name, detX + 16, dy);
    dy += 36;

    // Item stats
    if (item) {
      ctx.fillStyle = c.textDim;
      ctx.font = '16px monospace';
      if (item.power) { ctx.fillText(`ATK +${item.power}`, detX + 16, dy); dy += 28; }
      if (item.defense) { ctx.fillText(`DEF +${item.defense}`, detX + 16, dy); dy += 28; }
      if (item.bonus) {
        for (const [stat, val] of Object.entries(item.bonus)) {
          ctx.fillText(`${stat.toUpperCase()} +${val}`, detX + 16, dy); dy += 28;
        }
      }
      if (item.damageType && item.damageType !== 'physical') {
        ctx.fillStyle = COLORS.combat.text;
        ctx.fillText(`Type: ${item.damageType}`, detX + 16, dy); dy += 28;
      }
      if (item.desc) {
        ctx.fillStyle = c.textDim;
        ctx.font = '14px monospace';
        ctx.fillText(item.desc, detX + 16, dy, detW - 32); dy += 28;
      }
    }

    dy += 12;
    ctx.fillStyle = c.text;
    ctx.font = '16px monospace';
    ctx.fillText('Materials:', detX + 16, dy);
    dy += 28;

    for (const [matId, needed] of Object.entries(recipe.materials)) {
      const have = (player.materials && player.materials[matId]) || 0;
      const enough = have >= needed;
      ctx.fillStyle = enough ? '#44CC44' : '#CC3333';
      ctx.font = '16px monospace';
      ctx.fillText(`${getMaterialName(matId)}: ${have}/${needed}`, detX + 24, dy);
      dy += 28;
    }
  }

  // Message
  if (craftState.message && performance.now() - craftState.messageTimer < 2000) {
    ctx.fillStyle = '#22CC44';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(craftState.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 36);
    ctx.textAlign = 'left';
  }

  // Controls
  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ Browse  Enter Craft  Esc Exit', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
  ctx.textAlign = 'left';
}
