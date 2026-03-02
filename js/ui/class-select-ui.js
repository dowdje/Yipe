// class-select-ui.js — Class selection screen rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { getCtx } from '../engine/renderer.js';

const classIds = ['bruiser', 'fixer', 'hacker'];
let selectedIndex = 0;

export function getClassSelectIndex() {
  return selectedIndex;
}

export function setClassSelectIndex(idx) {
  selectedIndex = ((idx % classIds.length) + classIds.length) % classIds.length;
}

export function getSelectedClassId() {
  return classIds[selectedIndex];
}

export function renderClassSelect() {
  const ctx = getCtx();

  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CHOOSE YOUR CLASS', CANVAS_WIDTH / 2, 32);

  // Draw 3 class panels side by side
  const panelW = 304;
  const panelH = 560;
  const panelY = 100;
  const gap = 16;
  const totalW = panelW * 3 + gap * 2;
  const startX = (CANVAS_WIDTH - totalW) / 2;

  for (let i = 0; i < classIds.length; i++) {
    const cls = CLASSES[classIds[i]];
    const px = startX + i * (panelW + gap);
    const isSelected = i === selectedIndex;

    // Panel background
    ctx.fillStyle = isSelected ? '#1a1a3e' : '#111122';
    ctx.fillRect(px, panelY, panelW, panelH);

    // Panel border
    ctx.strokeStyle = isSelected ? cls.color : '#333355';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(px + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    let y = panelY + 24;

    // Class name
    ctx.fillStyle = cls.color;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(cls.name.toUpperCase(), px + panelW / 2, y);
    y += 40;

    // Description
    ctx.fillStyle = '#AABBCC';
    ctx.font = '16px monospace';
    ctx.fillText(cls.desc, px + panelW / 2, y);
    y += 40;

    // Resource type
    ctx.fillStyle = '#FFD740';
    ctx.font = '16px monospace';
    ctx.fillText(`Resource: ${cls.resource.name}`, px + panelW / 2, y);
    y += 36;

    // Divider
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 20, y);
    ctx.lineTo(px + panelW - 20, y);
    ctx.stroke();
    y += 20;

    // Stats
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    const stats = cls.startingStats;
    const statList = [
      ['HP', stats.hp, '#22CC44'],
      ['MP', stats.mp, '#4488FF'],
      ['ATK', stats.atk, '#FF6644'],
      ['DEF', stats.def, '#AABBCC'],
      ['SPD', stats.spd, '#44DDAA'],
      ['LCK', stats.lck, '#DDAA44'],
    ];

    for (const [label, val, color] of statList) {
      ctx.fillStyle = '#888899';
      ctx.fillText(label, px + 24, y);
      ctx.fillStyle = color;
      ctx.fillText(String(val), px + 96, y);

      // Stat bar
      const barX = px + 136;
      const barW = 140;
      const barH = 16;
      const maxVal = 50; // visual max for bars
      ctx.fillStyle = '#222233';
      ctx.fillRect(barX, y - 4, barW, barH);
      ctx.fillStyle = color;
      ctx.fillRect(barX, y - 4, barW * Math.min(val / maxVal, 1), barH);

      y += 32;
    }

    y += 16;

    // Growth header
    ctx.fillStyle = '#666688';
    ctx.font = '14px monospace';
    ctx.fillText('Per Level:', px + 24, y);
    y += 28;

    const growth = cls.statGrowth;
    const growthList = [
      ['HP', growth.hp], ['MP', growth.mp], ['ATK', growth.atk],
      ['DEF', growth.def], ['SPD', growth.spd], ['LCK', growth.lck],
    ];
    ctx.font = '14px monospace';
    ctx.fillStyle = '#556677';
    let gx = px + 24;
    for (let g = 0; g < growthList.length; g++) {
      const [label, val] = growthList[g];
      ctx.fillText(`${label}+${val}`, gx, y);
      gx += 90;
      if (g === 2) { // wrap after 3
        y += 24;
        gx = px + 24;
      }
    }

    // Selection indicator
    if (isSelected) {
      ctx.fillStyle = cls.color;
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▸ SELECT ◂', px + panelW / 2, panelY + panelH - 28);
    }
  }

  // Controls hint
  ctx.fillStyle = '#556677';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('← → Choose    Enter Confirm', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28);
  ctx.textAlign = 'left';
}
