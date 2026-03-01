// death-ui.js — Death screen with Gatekeeper dialog

import { CANVAS_WIDTH, CANVAS_HEIGHT, DEATH_FEE_PER_LEVEL } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { getPlayer } from '../game/player.js';

export function renderDeath() {
  const ctx = getCtx();
  const player = getPlayer();
  const fee = DEATH_FEE_PER_LEVEL * player.level;
  const canPay = player.gold >= fee;

  // Dark red overlay
  ctx.fillStyle = '#1a0a0a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Vignette border
  ctx.strokeStyle = '#441111';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

  // Title
  ctx.fillStyle = '#CC2222';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('YOU HAVE FALLEN', CANVAS_WIDTH / 2, 40);

  // Gatekeeper dialog
  ctx.fillStyle = '#887766';
  ctx.font = '12px monospace';
  ctx.fillText('The Gatekeeper appears before you...', CANVAS_WIDTH / 2, 80);

  ctx.fillStyle = '#CCBBAA';
  ctx.font = '13px monospace';

  if (canPay) {
    ctx.fillText(`"I can return you to the living..."`, CANVAS_WIDTH / 2, 120);
    ctx.fillText(`"...for a fee of ${fee} gold."`, CANVAS_WIDTH / 2, 142);

    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.fillText(`Your gold: ${player.gold}G`, CANVAS_WIDTH / 2, 180);
    ctx.fillStyle = '#CC3333';
    ctx.fillText(`Fee: ${fee}G`, CANVAS_WIDTH / 2, 200);
  } else {
    ctx.fillText(`"You cannot afford my fee of ${fee} gold..."`, CANVAS_WIDTH / 2, 120);
    ctx.fillText(`"I'll take everything you have."`, CANVAS_WIDTH / 2, 142);

    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.fillText(`Your gold: ${player.gold}G`, CANVAS_WIDTH / 2, 180);
    ctx.fillStyle = '#CC3333';
    ctx.fillText(`Lost: ALL gold`, CANVAS_WIDTH / 2, 200);
  }

  // Prompt
  ctx.fillStyle = '#888888';
  ctx.font = '11px monospace';
  ctx.fillText('Press Enter to revive', CANVAS_WIDTH / 2, 260);

  ctx.textAlign = 'left';
}

export function applyDeathPenalty() {
  const player = getPlayer();
  const fee = DEATH_FEE_PER_LEVEL * player.level;

  if (player.gold >= fee) {
    player.gold -= fee;
  } else {
    player.gold = 0;
  }

  // Restore HP/MP
  player.hp = player.maxHp;
  player.mp = player.maxMp;
}
