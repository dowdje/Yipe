// combat-ui.js — Combat screen rendering (Phase 4: timeline, status effects, defend/flee rework)

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, xpForLevel, DAMAGE_TYPE_COLORS, RESISTANCE_LABELS } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { getCtx, drawCombatSprite, drawBossCombatSprite, ENEMY_SPRITE_MAP } from '../engine/renderer.js';
import { getCombat, getActions, getTopActions, getAnimProgress, getFleeCost, getCurrentTarget } from '../game/combat.js';
import { STATUS_DEFS } from '../game/status-effects.js';
import { getRandomTip } from '../data/tips.js';

const PANEL_PAD = 24;
const LINE_H = 28;
let combatTip = '';
let lastResultState = null;
const TURN_BAR_H = 40;

export function renderCombat(now, player) {
  const ctx = getCtx();
  const combat = getCombat();
  const enemy = combat.enemy;
  if (!enemy) return;

  const c = COLORS.combat;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // --- Turn Order Bar (top) ---
  renderTurnOrderBar(ctx, combat, player, c);

  // --- Top area: enemy + player display (shifted down by turn bar) ---
  const topY = TURN_BAR_H + 16;
  const topH = 348;

  // Enemy panel (left half)
  const enemyPanelX = PANEL_PAD;
  const enemyPanelY = topY;
  const enemyPanelW = CANVAS_WIDTH / 2 - PANEL_PAD * 1.5;
  const enemyPanelH = topH;

  drawPanel(ctx, enemyPanelX, enemyPanelY, enemyPanelW, enemyPanelH, c);

  // Enemy sprite — bosses render larger (128px vs 96px)
  const isBoss = !!enemy.bossId;
  const spriteSize = isBoss ? 128 : 96;
  let spriteX = enemyPanelX + enemyPanelW / 2 - spriteSize / 2;
  let spriteY = isBoss ? enemyPanelY + 12 : enemyPanelY + 32;

  // Shake animation when player hits enemy
  const anim = getAnimProgress(now);
  if (anim && anim.type === 'playerHit') {
    const shake = Math.sin(anim.t * Math.PI * 6) * 8 * (1 - anim.t);
    spriteX += shake;
  }

  // Submerged: dim sprite
  if (combat._bossUntargetable) {
    ctx.globalAlpha = 0.3;
  }

  const enemySpriteId = ENEMY_SPRITE_MAP[enemy.type];
  if (isBoss) {
    if (!enemySpriteId || !drawBossCombatSprite(enemySpriteId, spriteX, spriteY)) {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
    }
  } else {
    if (!enemySpriteId || !drawCombatSprite(enemySpriteId, spriteX, spriteY)) {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
    }
  }

  ctx.globalAlpha = 1.0;

  // Submerged text overlay
  if (combat._bossUntargetable) {
    ctx.save();
    ctx.fillStyle = '#4488AA';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUBMERGED', spriteX + spriteSize / 2, spriteY + spriteSize / 2);
    ctx.restore();
  }

  // Enemy name + target indicator
  ctx.fillStyle = c.text;
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const hasMinions = combat.minions && combat.minions.length > 0;
  const bossTargeted = combat.targetIndex === -1;
  const namePrefix = (hasMinions && bossTargeted) ? '▸ ' : '';
  ctx.fillText(namePrefix + enemy.name, enemyPanelX + enemyPanelW / 2, spriteY + spriteSize + 8);

  // Enemy HP bar
  const ehpY = spriteY + spriteSize + 32;
  const ehpW = enemyPanelW - 80;
  const ehpX = enemyPanelX + 40;
  drawHpBar(ctx, ehpX, ehpY, ehpW, 18, enemy.hp, enemy.maxHp, c.enemyHp, c.enemyHpBg);
  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, enemyPanelX + enemyPanelW / 2, ehpY + 24);

  // Enemy status icons (below HP)
  if (combat.enemyStatuses && combat.enemyStatuses.length > 0) {
    renderStatusIcons(ctx, combat.enemyStatuses, enemyPanelX + enemyPanelW / 2, ehpY + 45, true);
  }

  // Resistance indicators (below HP bar + status icons)
  const resYBase = ehpY + (combat.enemyStatuses && combat.enemyStatuses.length > 0 ? 70 : 50);
  if (enemy.resistances) {
    const resY = resYBase;
    ctx.font = '14px monospace';
    const types = ['physical', 'fire', 'ice', 'lightning'];
    const labels = ['PHY', 'FIR', 'ICE', 'LTN'];
    const resW = enemyPanelW - 80;
    const segW = resW / 4;

    for (let i = 0; i < types.length; i++) {
      const rx = ehpX + i * segW;
      const resist = enemy.resistances[types[i]];
      const show = combat._scanned || true;

      if (show) {
        const info = RESISTANCE_LABELS[resist] || RESISTANCE_LABELS[0];
        ctx.fillStyle = DAMAGE_TYPE_COLORS[types[i]];
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], rx + segW / 2, resY);
        ctx.fillStyle = info.color;
        ctx.fillText(info.symbol, rx + segW / 2, resY + 18);
      } else {
        ctx.fillStyle = c.textDim;
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], rx + segW / 2, resY);
        ctx.fillText('???', rx + segW / 2, resY + 18);
      }
    }
  }

  // Exploit meter (below resistance indicators)
  if (combat.exploitMeter > 0 || combat.exploitDoubleTurns > 0) {
    const emY = resYBase + 44;
    const emW = enemyPanelW - 80;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#CC9933';
    ctx.font = '14px monospace';
    ctx.fillText('EXPLOIT', ehpX, emY);

    // Segmented bar: 10 segments
    const barX = ehpX + 90;
    const barW = emW - 90;
    const segCount = 10;
    const segW = barW / segCount;
    for (let i = 0; i < segCount; i++) {
      const sx = barX + i * segW;
      ctx.fillStyle = i < combat.exploitMeter ? '#FFAA33' : '#332211';
      ctx.fillRect(sx, emY - 4, segW - 2, 14);
      // Threshold markers at 3, 6, 10
      if (i === 2 || i === 5 || i === 9) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + segW - 3, emY - 5, 2, 18);
      }
    }
  }

  // Minion list (below enemy panel when minions exist)
  if (combat.minions && combat.minions.length > 0) {
    let minionY = resYBase + 76;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#CC6644';
    ctx.font = '14px monospace';
    ctx.fillText('MINIONS:', ehpX, minionY);
    minionY += 22;

    for (let mi = 0; mi < combat.minions.length; mi++) {
      const minion = combat.minions[mi];
      const targeted = combat.targetIndex === mi;
      const prefix = targeted ? '▸' : ' ';

      ctx.fillStyle = targeted ? '#FFD700' : c.textDim;
      ctx.font = '14px monospace';
      ctx.fillText(`${prefix}${minion.name}`, ehpX, minionY);

      // Small HP bar for minion
      const mhpW = 80;
      const mhpX = ehpX + 140;
      drawHpBar(ctx, mhpX, minionY - 6, mhpW, 10, minion.hp, minion.maxHp, '#CC6644', '#331111');
      minionY += 22;
    }
  }

  // Target hint
  if (combat.minions && combat.minions.length > 0 && combat.turn === 'player' && !combat.result) {
    ctx.fillStyle = c.textDim;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('← → Switch Target', enemyPanelX + enemyPanelW / 2, enemyPanelY + enemyPanelH - 12);
  }

  ctx.textAlign = 'left';

  // Player panel (right half)
  const playerPanelX = CANVAS_WIDTH / 2 + PANEL_PAD * 0.5;
  const playerPanelY = topY;
  const playerPanelW = CANVAS_WIDTH / 2 - PANEL_PAD * 1.5;
  const playerPanelH = topH;

  drawPanel(ctx, playerPanelX, playerPanelY, playerPanelW, playerPanelH, c);

  // Player info
  let infoY = playerPanelY + 20;
  const infoX = playerPanelX + 24;

  // Class name
  const cls = player.classId ? CLASSES[player.classId] : null;
  const className = cls ? cls.name.toUpperCase() : 'Hero';
  ctx.fillStyle = cls ? cls.color : c.text;
  ctx.font = '20px monospace';
  ctx.fillText(`Lv ${player.level}  ${className}`, infoX, infoY);
  infoY += 32;

  // Player HP
  ctx.fillStyle = c.text;
  ctx.font = '18px monospace';
  ctx.fillText('HP', infoX, infoY);
  const phpW = playerPanelW - 110;
  drawHpBar(ctx, infoX + 40, infoY - 4, phpW, 18, player.hp, player.maxHp, COLORS.hud.hp, COLORS.hud.hpBg);
  ctx.fillText(`${player.hp}/${player.maxHp}`, infoX + 44 + phpW + 4, infoY);
  infoY += 28;

  // Player MP (with flash on defend)
  ctx.fillText('MP', infoX, infoY);
  const mpBarX = infoX + 40;
  const mpBarY = infoY - 4;
  drawHpBar(ctx, mpBarX, mpBarY, phpW, 18, player.mp, player.maxMp, COLORS.hud.mp, COLORS.hud.mpBg);
  ctx.fillText(`${player.mp}/${player.maxMp}`, infoX + 44 + phpW + 4, infoY);

  // MP flash overlay
  if (combat._mpFlash) {
    const elapsed = now - combat._mpFlashStart;
    const flashT = Math.min(elapsed / 400, 1);
    const alpha = (1 - flashT) * 0.6;
    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(68, 255, 68, ${alpha})`;
      ctx.fillRect(mpBarX, mpBarY, phpW, 18);
    }
  }
  infoY += 30;

  // Player status icons (below MP bar)
  if (combat.playerStatuses && combat.playerStatuses.length > 0) {
    ctx.textAlign = 'left';
    renderStatusIcons(ctx, combat.playerStatuses, infoX, infoY, false);
    infoY += 26;
  }

  // Class resource display
  if (cls) {
    const resType = cls.resource.type;
    if (resType === 'pump') {
      ctx.fillStyle = '#FF6644';
      ctx.font = '16px monospace';
      ctx.fillText('PUMP', infoX, infoY);
      const pumpW = phpW;
      const segCount = 10;
      const segW = pumpW / segCount;
      for (let i = 0; i < segCount; i++) {
        const sx = infoX + 72 + i * segW;
        ctx.fillStyle = i < (combat.classResource || 0) ? '#FF4444' : '#331111';
        ctx.fillRect(sx, infoY - 4, segW - 2, 14);
      }
      ctx.fillStyle = '#FF6644';
      ctx.fillText(`${combat.classResource || 0}/10`, infoX + 76 + pumpW + 4, infoY);
      infoY += 26;
    } else if (resType === 'combo') {
      ctx.fillStyle = '#44DD44';
      ctx.font = '16px monospace';
      ctx.fillText('COMBO', infoX, infoY);
      for (let i = 0; i < 5; i++) {
        const cx = infoX + 86 + i * 30;
        const cy2 = infoY + 4;
        ctx.beginPath();
        ctx.arc(cx, cy2, 9, 0, Math.PI * 2);
        ctx.fillStyle = i < (combat.classResource || 0) ? '#44FF44' : '#113311';
        ctx.fill();
        ctx.strokeStyle = '#44DD44';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      infoY += 26;
    } else if (resType === 'overclock') {
      ctx.font = '16px monospace';
      if (combat._overclockElement && combat._overclockTurns > 0) {
        const ocColor = DAMAGE_TYPE_COLORS[combat._overclockElement] || '#FFFFFF';
        ctx.fillStyle = ocColor;
        const elName = combat._overclockElement.charAt(0).toUpperCase() + combat._overclockElement.slice(1);
        ctx.fillText(`OC: ${elName} (${combat._overclockTurns}t)`, infoX, infoY);
      } else {
        ctx.fillStyle = c.textDim;
        ctx.fillText('OC: ---', infoX, infoY);
      }
      infoY += 26;
    }
  }

  // Stats
  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText(`ATK ${player.atk}  DEF ${player.def}  INT ${player.int || 2}`, infoX, infoY);
  infoY += 24;
  ctx.fillText(`SPD ${player.spd}  LCK ${player.lck}`, infoX, infoY);
  infoY += 26;

  // EXP bar
  const expNeeded = xpForLevel(player.level);
  ctx.fillStyle = c.textDim;
  ctx.font = '16px monospace';
  ctx.fillText('EXP', infoX, infoY);
  drawHpBar(ctx, infoX + 52, infoY - 4, phpW - 12, 14, player.exp, expNeeded, '#9944CC', '#332244');

  // Flash overlay when enemy hits player
  if (anim && anim.type === 'enemyHit') {
    const alpha = (1 - anim.t) * 0.4;
    ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
    ctx.fillRect(playerPanelX, playerPanelY, playerPanelW, playerPanelH);
  }

  // --- WEAKNESS flash overlay ---
  if (combat._weaknessFlash) {
    const elapsed = now - combat._weaknessFlashStart;
    const flashT = Math.min(elapsed / 500, 1);
    const alpha = (1 - flashT) * 0.8;
    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WEAKNESS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.restore();
    }
  }

  // --- Phase transition flash ---
  if (combat._phaseTransitionFlash) {
    const elapsed = now - combat._phaseTransitionStart;
    const flashT = Math.min(elapsed / 800, 1);
    const alpha = (1 - flashT) * 0.7;
    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(200, 50, 50, ${alpha * 0.3})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PHASE SHIFT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.restore();
    }
  }

  // --- Bottom area: log + action menu ---
  const bottomY = topY + topH + PANEL_PAD;

  // Log panel (left)
  const logPanelX = PANEL_PAD;
  const logPanelW = CANVAS_WIDTH * 0.6 - PANEL_PAD;
  const logPanelH = CANVAS_HEIGHT - bottomY - PANEL_PAD;

  drawPanel(ctx, logPanelX, bottomY, logPanelW, logPanelH, c);

  ctx.font = '18px monospace';
  const logLines = combat.log.slice(-4);
  for (let i = 0; i < logLines.length; i++) {
    // Color-code damage type mentions
    ctx.fillStyle = c.logText;
    const line = logLines[i];
    if (line.includes('WEAKNESS')) {
      ctx.fillStyle = '#FFAA33';
    } else if (line.includes('CRITICAL') || line.includes('auto-crit')) {
      ctx.fillStyle = '#FFD700';
    } else if (line.includes('fire damage')) {
      ctx.fillStyle = DAMAGE_TYPE_COLORS.fire;
    } else if (line.includes('ice damage')) {
      ctx.fillStyle = DAMAGE_TYPE_COLORS.ice;
    } else if (line.includes('lightning damage')) {
      ctx.fillStyle = DAMAGE_TYPE_COLORS.lightning;
    } else if (line.includes('IMMUNE')) {
      ctx.fillStyle = '#888888';
    } else if (line.includes('Burn') || line.includes('\u{1F525}')) {
      ctx.fillStyle = '#FF6B35';
    } else if (line.includes('Chill') || line.includes('\u{2744}')) {
      ctx.fillStyle = '#4FC3F7';
    } else if (line.includes('Paralyze') || line.includes('paralyzed')) {
      ctx.fillStyle = '#FFD740';
    } else if (line.includes('Poison') || line.includes('\u{2620}')) {
      ctx.fillStyle = '#88CC22';
    } else if (line.includes('Regen') || line.includes('\u{1F49A}')) {
      ctx.fillStyle = '#44CC44';
    } else if (line.includes('wore off')) {
      ctx.fillStyle = c.textDim;
    } else if (line.includes('Found:')) {
      ctx.fillStyle = '#4CAF50';
    }
    ctx.textAlign = 'left';
    ctx.fillText(line, logPanelX + 16, bottomY + 26 + i * LINE_H, logPanelW - 32);
  }

  // Action menu (right)
  const menuX = CANVAS_WIDTH * 0.6 + PANEL_PAD * 0.5;
  const menuW = CANVAS_WIDTH * 0.4 - PANEL_PAD * 1.5;
  const menuH = logPanelH;

  drawPanel(ctx, menuX, bottomY, menuW, menuH, c);

  if (combat.turn === 'player' && !combat.result && !combat.animating) {
    if (combat.subMenu) {
      // Sub-menu rendering
      const items = combat.subMenuItems;
      ctx.font = '16px monospace';
      ctx.fillStyle = c.textDim;
      const label = combat.subMenu.charAt(0).toUpperCase() + combat.subMenu.slice(1) + 's';
      ctx.fillText(label + ':', menuX + 16, bottomY + 20);

      ctx.font = '18px monospace';
      const maxVisible = Math.floor((menuH - 56) / 30);
      const start = Math.max(0, combat.subMenuIndex - maxVisible + 1);
      const visible = items.slice(start, start + maxVisible);

      for (let i = 0; i < visible.length; i++) {
        const item = visible[i];
        const realIdx = start + i;
        const ay = bottomY + 44 + i * 30;
        let dispLabel = item.name;
        if (item.type === 'item' && item.qty > 1) dispLabel += ` x${item.qty}`;

        if (realIdx === combat.subMenuIndex) {
          ctx.fillStyle = c.menuSelect;
          ctx.fillText(`\u25B8${dispLabel}`, menuX + 12, ay);
        } else {
          ctx.fillStyle = c.menuNormal;
          ctx.fillText(` ${dispLabel}`, menuX + 12, ay);
        }
      }

      ctx.fillStyle = c.textDim;
      ctx.font = '14px monospace';
      ctx.fillText('Esc: Back', menuX + 16, bottomY + menuH - 16);
    } else {
      // Top-level actions
      const actions = getTopActions();
      ctx.font = '18px monospace';
      for (let i = 0; i < actions.length; i++) {
        const ay = bottomY + 22 + i * 32;
        let actionLabel = actions[i];

        // Show flee gold cost
        if (actionLabel === 'Flee') {
          const cost = getFleeCost();
          if (i === combat.menuIndex) {
            ctx.fillStyle = c.menuSelect;
            ctx.fillText(`\u25B8 ${actionLabel}`, menuX + 16, ay);
            ctx.fillStyle = '#CC9933';
            ctx.fillText(`(-${cost}g)`, menuX + 120, ay);
          } else {
            ctx.fillStyle = c.menuNormal;
            ctx.fillText(`  ${actionLabel}`, menuX + 16, ay);
            ctx.fillStyle = '#887744';
            ctx.fillText(`(-${cost}g)`, menuX + 120, ay);
          }
          continue;
        }

        // Show weapon damage type next to Attack
        if (actionLabel === 'Attack' && player.equipment.weapon && player.equipment.weapon.damageType) {
          const dt = player.equipment.weapon.damageType;
          const dtColor = DAMAGE_TYPE_COLORS[dt] || '#AAAAAA';
          if (i === combat.menuIndex) {
            ctx.fillStyle = c.menuSelect;
            ctx.fillText(`\u25B8 ${actionLabel}`, menuX + 16, ay);
            ctx.fillStyle = dtColor;
            ctx.fillText(`[${dt.slice(0, 3).toUpperCase()}]`, menuX + 150, ay);
          } else {
            ctx.fillStyle = c.menuNormal;
            ctx.fillText(`  ${actionLabel}`, menuX + 16, ay);
            ctx.fillStyle = dtColor;
            ctx.fillText(`[${dt.slice(0, 3).toUpperCase()}]`, menuX + 150, ay);
          }
        } else {
          if (i === combat.menuIndex) {
            ctx.fillStyle = c.menuSelect;
            ctx.fillText(`\u25B8 ${actionLabel}`, menuX + 16, ay);
          } else {
            ctx.fillStyle = c.menuNormal;
            ctx.fillText(`  ${actionLabel}`, menuX + 16, ay);
          }
        }
      }
    }
  } else if (combat.result) {
    ctx.fillStyle = c.text;
    ctx.font = '20px monospace';
    let ly = bottomY + 26;

    // Show loot drops
    if (combat.lootDrops && combat.lootDrops.length > 0) {
      const isUnique = combat.lootRarity === 'unique';
      ctx.fillStyle = isUnique ? COLORS.item.unique : c.text;
      ctx.font = '18px monospace';
      const prefix = isUnique ? 'RARE: ' : 'Got: ';
      ctx.fillText(`${prefix}${combat.lootDrops[0]}`, menuX + 20, ly);
      ly += 30;
    }

    if (combat.levelUpResults && combat.levelUpResults.length > 0) {
      const lr = combat.levelUpResults[0];
      ctx.fillStyle = '#FFD700';
      ctx.font = '20px monospace';
      ctx.fillText('LEVEL UP!', menuX + 20, ly);
      ctx.fillStyle = c.text;
      ctx.font = '16px monospace';
      ly += 30;
      const g = lr.statGains;
      if (g.hp) { ctx.fillText(`HP +${g.hp}`, menuX + 20, ly); ly += 24; }
      if (g.mp) { ctx.fillText(`MP +${g.mp}`, menuX + 20, ly); ly += 24; }
      if (g.atk) { ctx.fillText(`ATK +${g.atk}`, menuX + 20, ly); ly += 24; }
      if (g.def) { ctx.fillText(`DEF +${g.def}`, menuX + 20, ly); ly += 24; }
      if (g.spd) { ctx.fillText(`SPD +${g.spd}`, menuX + 20, ly); ly += 24; }
      if (g.lck) { ctx.fillText(`LCK +${g.lck}`, menuX + 20, ly); ly += 24; }
      if (g.int) { ctx.fillText(`INT +${g.int}`, menuX + 20, ly); ly += 24; }
    }

    // Show a random tip
    if (combat.result !== lastResultState) {
      lastResultState = combat.result;
      combatTip = getRandomTip();
    }
    if (combatTip && combat.result === 'victory') {
      ctx.fillStyle = '#445566';
      ctx.font = '14px monospace';
      ctx.fillText(`TIP: ${combatTip}`, menuX + 20, ly + 8);
      ly += 26;
    }

    ctx.fillStyle = c.textDim;
    ctx.font = '16px monospace';
    ctx.fillText('Press Enter', menuX + 20, ly + 8);
  } else {
    ctx.fillStyle = c.textDim;
    ctx.font = '18px monospace';
    ctx.fillText('Waiting...', menuX + 20, bottomY + 26);
  }
}

// --- Turn Order Bar ---

function renderTurnOrderBar(ctx, combat, player, c) {
  const barY = 4;
  const barH = TURN_BAR_H;
  const barX = PANEL_PAD;
  const barW = CANVAS_WIDTH - PANEL_PAD * 2;

  // Background
  ctx.fillStyle = 'rgba(15, 20, 40, 0.8)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = c.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

  // Label
  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('TURN', barX + 8, barY + 12);

  const timeline = combat.timeline || [];
  const slotW = 100;
  const slotH = 26;
  const startX = barX + 68;
  const slotY = barY + 7;
  const maxSlots = Math.min(timeline.length, 8);

  // Get class color for player
  const cls = player.classId ? CLASSES[player.classId] : null;
  const playerColor = cls ? cls.color : '#FFD700';
  const enemyColor = combat.enemy ? combat.enemy.color : '#CC3333';

  for (let i = 0; i < maxSlots; i++) {
    const entry = timeline[i];
    const sx = startX + i * (slotW + 8);
    const isPlayer = entry.entity === 'player';
    const isCurrent = i === 0;

    // Slot background
    ctx.fillStyle = isPlayer ? 'rgba(255, 215, 0, 0.15)' : 'rgba(200, 50, 50, 0.15)';
    ctx.fillRect(sx, slotY, slotW, slotH);

    // Current actor gold border
    if (isCurrent) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, slotY, slotW, slotH);
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = 'rgba(100, 100, 140, 0.4)';
      ctx.strokeRect(sx + 0.5, slotY + 0.5, slotW - 1, slotH - 1);
    }

    // Color indicator square
    const indicatorSize = 14;
    ctx.fillStyle = isPlayer ? playerColor : enemyColor;
    ctx.fillRect(sx + 5, slotY + 6, indicatorSize, indicatorSize);

    // Label
    ctx.fillStyle = isCurrent ? '#FFFFFF' : c.textDim;
    ctx.font = isCurrent ? 'bold 14px monospace' : '14px monospace';
    ctx.textAlign = 'left';
    const label = isPlayer ? 'You' : (combat.enemy ? combat.enemy.name.slice(0, 5) : '???');
    ctx.fillText(label, sx + 24, slotY + 6);
  }

  ctx.textAlign = 'left';
}

// --- Status Icons ---

function renderStatusIcons(ctx, statuses, x, y, centered) {
  if (!statuses || statuses.length === 0) return;

  ctx.font = '16px monospace';
  const iconSpacing = 50;
  const totalW = statuses.length * iconSpacing;
  let startX = centered ? x - totalW / 2 : x;

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const def = STATUS_DEFS[status.id];
    if (!def) continue;

    const ix = startX + i * iconSpacing;

    // Icon
    ctx.textAlign = 'left';
    ctx.fillStyle = def.type === 'buff' ? '#44CC44' : '#CC4444';
    ctx.fillText(`${def.icon}${status.turnsLeft}`, ix, y);
  }

  ctx.textAlign = 'left';
}

// --- Helpers ---

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
