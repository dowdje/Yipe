// compendium-ui.js — Monster compendium viewer for GRIDLOCK

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, ENEMY_TYPES, DAMAGE_TYPE_COLORS, RESISTANCE_LABELS } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { isFullyDiscovered, isResistanceKnown } from '../game/compendium.js';

const compState = {
  active: false,
  selectedIndex: 0,
  entries: [],
};

export function getCompendiumState() {
  return compState;
}

export function openCompendium(player) {
  compState.active = true;
  compState.selectedIndex = 0;
  // Build entries from player's compendium
  compState.entries = [];
  if (player.compendium) {
    for (const [monsterId, data] of Object.entries(player.compendium)) {
      const def = ENEMY_TYPES[monsterId];
      if (def) {
        compState.entries.push({ id: monsterId, def, data });
      }
    }
  }
}

export function closeCompendium() {
  compState.active = false;
}

export function navigateCompendium(dy) {
  if (compState.entries.length === 0) return;
  const len = compState.entries.length;
  compState.selectedIndex = (compState.selectedIndex + dy + len) % len;
}

export function renderCompendium(player) {
  if (!compState.active) return;
  const ctx = getCtx();
  const c = COLORS.combat;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = '24px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('COMPENDIUM', CANVAS_WIDTH / 2, 16);
  ctx.textAlign = 'left';

  const listX = 24;
  const listY = 60;
  const listW = 320;
  const listH = CANVAS_HEIGHT - 84;

  // Left: monster list
  ctx.fillStyle = c.panel;
  ctx.fillRect(listX, listY, listW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

  if (compState.entries.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '18px monospace';
    ctx.fillText('No entries yet', listX + 16, listY + 32);
  } else {
    for (let i = 0; i < compState.entries.length; i++) {
      const entry = compState.entries[i];
      const ey = listY + 20 + i * 36;
      const selected = i === compState.selectedIndex;

      ctx.fillStyle = selected ? '#FFD700' : c.text;
      ctx.font = '18px monospace';
      const prefix = selected ? '▸ ' : '  ';
      ctx.fillText(`${prefix}${entry.def.name}`, listX + 8, ey);

      ctx.fillStyle = c.textDim;
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`×${entry.data.kills}`, listX + listW - 12, ey);
      ctx.textAlign = 'left';
    }
  }

  // Right: selected monster details
  const detX = listX + listW + 16;
  const detW = CANVAS_WIDTH - detX - 24;

  ctx.fillStyle = c.panel;
  ctx.fillRect(detX, listY, detW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.strokeRect(detX + 0.5, listY + 0.5, detW - 1, listH - 1);

  if (compState.entries.length > 0 && compState.selectedIndex < compState.entries.length) {
    const entry = compState.entries[compState.selectedIndex];
    const { def, data, id } = entry;
    let dy = listY + 28;

    ctx.fillStyle = def.color;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(def.name, detX + 20, dy);
    dy += 40;

    ctx.fillStyle = c.text;
    ctx.font = '16px monospace';
    ctx.fillText(`Kills: ${data.kills}`, detX + 20, dy);
    dy += 28;
    ctx.fillText(`HP: ${def.maxHp}  ATK: ${def.atk}  DEF: ${def.def}`, detX + 20, dy);
    dy += 28;
    ctx.fillText(`SPD: ${def.spd}  Gold: ${def.gold}  EXP: ${def.exp}`, detX + 20, dy);
    dy += 40;

    // Resistances
    ctx.fillStyle = c.textDim;
    ctx.fillText('Resistances:', detX + 20, dy);
    dy += 32;

    const types = ['physical', 'fire', 'ice', 'lightning'];
    const labels = ['PHY', 'FIR', 'ICE', 'LTN'];
    const fully = isFullyDiscovered(player, id);

    for (let i = 0; i < types.length; i++) {
      const known = fully || isResistanceKnown(player, id, types[i]);
      const resist = def.resistances[types[i]];
      const info = RESISTANCE_LABELS[resist] || RESISTANCE_LABELS[0];

      ctx.fillStyle = DAMAGE_TYPE_COLORS[types[i]];
      ctx.font = '16px monospace';
      ctx.fillText(labels[i], detX + 20 + i * 120, dy);

      if (known) {
        ctx.fillStyle = info.color;
        ctx.fillText(info.symbol + ' ' + info.label, detX + 72 + i * 120, dy);
      } else {
        ctx.fillStyle = c.textDim;
        ctx.fillText('???', detX + 72 + i * 120, dy);
      }
    }
    dy += 32;

    if (fully) {
      ctx.fillStyle = '#44CC44';
      ctx.font = '14px monospace';
      ctx.fillText('Fully discovered!', detX + 20, dy);
    } else {
      ctx.fillStyle = c.textDim;
      ctx.font = '14px monospace';
      ctx.fillText(`${5 - data.kills} more kills to discover all`, detX + 20, dy);
    }
  }

  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ Browse  Esc Close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
  ctx.textAlign = 'left';
}
