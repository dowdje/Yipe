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
  ctx.font = '14px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('COMPENDIUM', CANVAS_WIDTH / 2, 8);
  ctx.textAlign = 'left';

  const listX = 12;
  const listY = 30;
  const listW = 160;
  const listH = CANVAS_HEIGHT - 42;

  // Left: monster list
  ctx.fillStyle = c.panel;
  ctx.fillRect(listX, listY, listW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

  if (compState.entries.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('No entries yet', listX + 8, listY + 16);
  } else {
    for (let i = 0; i < compState.entries.length; i++) {
      const entry = compState.entries[i];
      const ey = listY + 10 + i * 18;
      const selected = i === compState.selectedIndex;

      ctx.fillStyle = selected ? '#FFD700' : c.text;
      ctx.font = '11px monospace';
      const prefix = selected ? '▸ ' : '  ';
      ctx.fillText(`${prefix}${entry.def.name}`, listX + 4, ey);

      ctx.fillStyle = c.textDim;
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`×${entry.data.kills}`, listX + listW - 6, ey);
      ctx.textAlign = 'left';
    }
  }

  // Right: selected monster details
  const detX = listX + listW + 8;
  const detW = CANVAS_WIDTH - detX - 12;

  ctx.fillStyle = c.panel;
  ctx.fillRect(detX, listY, detW, listH);
  ctx.strokeStyle = c.panelBorder;
  ctx.strokeRect(detX + 0.5, listY + 0.5, detW - 1, listH - 1);

  if (compState.entries.length > 0 && compState.selectedIndex < compState.entries.length) {
    const entry = compState.entries[compState.selectedIndex];
    const { def, data, id } = entry;
    let dy = listY + 14;

    ctx.fillStyle = def.color;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(def.name, detX + 10, dy);
    dy += 20;

    ctx.fillStyle = c.text;
    ctx.font = '10px monospace';
    ctx.fillText(`Kills: ${data.kills}`, detX + 10, dy);
    dy += 14;
    ctx.fillText(`HP: ${def.maxHp}  ATK: ${def.atk}  DEF: ${def.def}`, detX + 10, dy);
    dy += 14;
    ctx.fillText(`SPD: ${def.spd}  Gold: ${def.gold}  EXP: ${def.exp}`, detX + 10, dy);
    dy += 20;

    // Resistances
    ctx.fillStyle = c.textDim;
    ctx.fillText('Resistances:', detX + 10, dy);
    dy += 16;

    const types = ['physical', 'fire', 'ice', 'lightning'];
    const labels = ['PHY', 'FIR', 'ICE', 'LTN'];
    const fully = isFullyDiscovered(player, id);

    for (let i = 0; i < types.length; i++) {
      const known = fully || isResistanceKnown(player, id, types[i]);
      const resist = def.resistances[types[i]];
      const info = RESISTANCE_LABELS[resist] || RESISTANCE_LABELS[0];

      ctx.fillStyle = DAMAGE_TYPE_COLORS[types[i]];
      ctx.font = '10px monospace';
      ctx.fillText(labels[i], detX + 10 + i * 60, dy);

      if (known) {
        ctx.fillStyle = info.color;
        ctx.fillText(info.symbol + ' ' + info.label, detX + 36 + i * 60, dy);
      } else {
        ctx.fillStyle = c.textDim;
        ctx.fillText('???', detX + 36 + i * 60, dy);
      }
    }
    dy += 16;

    if (fully) {
      ctx.fillStyle = '#44CC44';
      ctx.font = '9px monospace';
      ctx.fillText('Fully discovered!', detX + 10, dy);
    } else {
      ctx.fillStyle = c.textDim;
      ctx.font = '9px monospace';
      ctx.fillText(`${5 - data.kills} more kills to discover all`, detX + 10, dy);
    }
  }

  ctx.fillStyle = c.textDim;
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ Browse  Esc Close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 6);
  ctx.textAlign = 'left';
}
