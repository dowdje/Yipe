// combat-ui.js — Combat screen rendering and menu input

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { getCombat, getActions, getAnimProgress } from '../game/combat.js';

const PANEL_PAD = 12;
const LINE_H = 16;

export function renderCombat(now, player) {
  const ctx = getCtx();
  const combat = getCombat();
  const enemy = combat.enemy;
  if (!enemy) return;

  const c = COLORS.combat;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // --- Top area: enemy + player display ---
  const topH = 180;

  // Enemy panel (left half)
  const enemyPanelX = PANEL_PAD;
  const enemyPanelY = PANEL_PAD;
  const enemyPanelW = CANVAS_WIDTH / 2 - PANEL_PAD * 1.5;
  const enemyPanelH = topH;

  drawPanel(ctx, enemyPanelX, enemyPanelY, enemyPanelW, enemyPanelH, c);

  // Enemy sprite (colored rectangle)
  const spriteSize = 48;
  let spriteX = enemyPanelX + enemyPanelW / 2 - spriteSize / 2;
  let spriteY = enemyPanelY + 30;

  // Shake animation when player hits enemy
  const anim = getAnimProgress(now);
  if (anim && anim.type === 'playerHit') {
    const shake = Math.sin(anim.t * Math.PI * 6) * 4 * (1 - anim.t);
    spriteX += shake;
  }

  ctx.fillStyle = enemy.color;
  ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);

  // Enemy name
  ctx.fillStyle = c.text;
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(enemy.name, enemyPanelX + enemyPanelW / 2, spriteY + spriteSize + 8);

  // Enemy HP bar
  const ehpY = spriteY + spriteSize + 26;
  const ehpW = enemyPanelW - 40;
  const ehpX = enemyPanelX + 20;
  drawHpBar(ctx, ehpX, ehpY, ehpW, 10, enemy.hp, enemy.maxHp, c.enemyHp, c.enemyHpBg);
  ctx.fillStyle = c.textDim;
  ctx.font = '10px monospace';
  ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, enemyPanelX + enemyPanelW / 2, ehpY + 13);

  ctx.textAlign = 'left';

  // Player panel (right half)
  const playerPanelX = CANVAS_WIDTH / 2 + PANEL_PAD * 0.5;
  const playerPanelY = PANEL_PAD;
  const playerPanelW = CANVAS_WIDTH / 2 - PANEL_PAD * 1.5;
  const playerPanelH = topH;

  drawPanel(ctx, playerPanelX, playerPanelY, playerPanelW, playerPanelH, c);

  // Player info
  let infoY = playerPanelY + 14;
  const infoX = playerPanelX + 14;

  ctx.fillStyle = c.text;
  ctx.font = '13px monospace';
  ctx.fillText(`Lv ${player.level}  Hero`, infoX, infoY);
  infoY += 22;

  // Player HP
  ctx.fillStyle = c.text;
  ctx.font = '11px monospace';
  ctx.fillText('HP', infoX, infoY);
  const phpW = playerPanelW - 60;
  drawHpBar(ctx, infoX + 22, infoY - 2, phpW, 10, player.hp, player.maxHp, COLORS.hud.hp, COLORS.hud.hpBg);
  ctx.fillText(`${player.hp}/${player.maxHp}`, infoX + 24 + phpW + 2, infoY);
  infoY += 18;

  // Player MP
  ctx.fillText('MP', infoX, infoY);
  drawHpBar(ctx, infoX + 22, infoY - 2, phpW, 10, player.mp, player.maxMp, COLORS.hud.mp, COLORS.hud.mpBg);
  ctx.fillText(`${player.mp}/${player.maxMp}`, infoX + 24 + phpW + 2, infoY);
  infoY += 22;

  // Stats
  ctx.fillStyle = c.textDim;
  ctx.font = '10px monospace';
  ctx.fillText(`ATK ${player.atk}  DEF ${player.def}`, infoX, infoY);
  infoY += 14;
  ctx.fillText(`SPD ${player.spd}  LCK ${player.lck}`, infoX, infoY);

  // Flash overlay when enemy hits player
  if (anim && anim.type === 'enemyHit') {
    const alpha = (1 - anim.t) * 0.4;
    ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
    ctx.fillRect(playerPanelX, playerPanelY, playerPanelW, playerPanelH);
  }

  // --- Bottom area: log + action menu ---
  const bottomY = topH + PANEL_PAD * 2;

  // Log panel (left)
  const logPanelX = PANEL_PAD;
  const logPanelW = CANVAS_WIDTH * 0.6 - PANEL_PAD;
  const logPanelH = CANVAS_HEIGHT - bottomY - PANEL_PAD;

  drawPanel(ctx, logPanelX, bottomY, logPanelW, logPanelH, c);

  ctx.fillStyle = c.logText;
  ctx.font = '11px monospace';
  const logLines = combat.log.slice(-4);
  for (let i = 0; i < logLines.length; i++) {
    ctx.fillText(logLines[i], logPanelX + 8, bottomY + 14 + i * LINE_H, logPanelW - 16);
  }

  // Action menu (right) - only show if player's turn and no result
  const menuX = CANVAS_WIDTH * 0.6 + PANEL_PAD * 0.5;
  const menuW = CANVAS_WIDTH * 0.4 - PANEL_PAD * 1.5;
  const menuH = logPanelH;

  drawPanel(ctx, menuX, bottomY, menuW, menuH, c);

  const actions = getActions();
  if (combat.turn === 'player' && !combat.result && !combat.animating) {
    ctx.font = '12px monospace';
    for (let i = 0; i < actions.length; i++) {
      const ay = bottomY + 14 + i * 20;
      if (i === combat.menuIndex) {
        ctx.fillStyle = c.menuSelect;
        ctx.fillText(`▸ ${actions[i]}`, menuX + 10, ay);
      } else {
        ctx.fillStyle = c.menuNormal;
        ctx.fillText(`  ${actions[i]}`, menuX + 10, ay);
      }
    }
  } else if (combat.result) {
    ctx.fillStyle = c.text;
    ctx.font = '12px monospace';
    ctx.fillText('Press Enter', menuX + 10, bottomY + 14);
    ctx.fillText('to continue', menuX + 10, bottomY + 34);
  } else {
    ctx.fillStyle = c.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('Waiting...', menuX + 10, bottomY + 14);
  }
}

function drawPanel(ctx, x, y, w, h, c) {
  ctx.fillStyle = c.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawHpBar(ctx, x, y, w, h, current, max, fg, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const ratio = Math.max(0, Math.min(1, current / max));
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w * ratio, h);
}
