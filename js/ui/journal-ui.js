// journal-ui.js — Quest journal, NFT drives, and princess tracking

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';
import { QUEST_DEFS } from '../data/quests.js';

const journalState = {
  active: false,
  tab: 0, // 0=Quests, 1=NFT Drives, 2=Princesses
  scrollIndex: 0,
};

const TABS = ['Quests', 'NFT Drives', 'Princesses'];

const PRINCESS_DEFS = [
  { name: 'Destiny',   flag: 'destiny_rescued',  quest: null },
  { name: 'Jasmine',   flag: null,               quest: 'jasmine_samples' },
  { name: 'Crystal',   flag: null,               quest: 'crystal_keycard' },
  { name: 'Mercedes',  flag: 'mercedes_rewarded', quest: null },
  { name: 'Tiffany',   flag: null,               quest: 'tiffany_antidote' },
  { name: 'Angelica',  flag: 'angelica_rescued',  quest: null },
  { name: 'Brianna',   flag: 'brianna_met',       quest: null },
  { name: 'Valentina', flag: 'valentina_freed',   quest: null },
];

export function getJournalState() {
  return journalState;
}

export function openJournal() {
  journalState.active = true;
  journalState.tab = 0;
  journalState.scrollIndex = 0;
}

export function closeJournal() {
  journalState.active = false;
}

export function navigateJournal(dx, dy) {
  if (dx !== 0) {
    journalState.tab = (journalState.tab + dx + TABS.length) % TABS.length;
    journalState.scrollIndex = 0;
  }
  if (dy !== 0) {
    journalState.scrollIndex = Math.max(0, journalState.scrollIndex + dy);
  }
}

function isPrincessRescued(player, princess) {
  if (princess.quest) {
    return player.completedQuests && player.completedQuests.includes(princess.quest);
  }
  if (princess.flag) {
    return player.questFlags && player.questFlags[princess.flag];
  }
  return false;
}

export function renderJournal(player) {
  if (!journalState.active) return;
  const ctx = getCtx();
  const c = COLORS.combat;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('JOURNAL', CANVAS_WIDTH / 2, 12);

  // Tabs
  const tabY = 48;
  const tabW = Math.floor((CANVAS_WIDTH - 48) / TABS.length);
  for (let i = 0; i < TABS.length; i++) {
    const tx = 24 + i * tabW;
    const selected = i === journalState.tab;
    ctx.fillStyle = selected ? c.panel : 'rgba(10, 10, 24, 0.5)';
    ctx.fillRect(tx, tabY, tabW, 28);
    ctx.strokeStyle = selected ? '#FFD700' : c.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, tabY + 0.5, tabW - 1, 27);
    ctx.fillStyle = selected ? '#FFD700' : c.textDim;
    ctx.font = selected ? 'bold 16px monospace' : '16px monospace';
    ctx.fillText(TABS[i], tx + tabW / 2, tabY + 6);
  }

  // Content area
  const contentY = 88;
  const contentH = CANVAS_HEIGHT - contentY - 28;
  ctx.fillStyle = c.panel;
  ctx.fillRect(24, contentY, CANVAS_WIDTH - 48, contentH);
  ctx.strokeStyle = c.panelBorder;
  ctx.strokeRect(24.5, contentY + 0.5, CANVAS_WIDTH - 49, contentH - 1);

  ctx.textAlign = 'left';

  if (journalState.tab === 0) {
    renderQuestsTab(ctx, c, player, contentY, contentH);
  } else if (journalState.tab === 1) {
    renderNFTTab(ctx, c, player, contentY, contentH);
  } else {
    renderPrincessTab(ctx, c, player, contentY, contentH);
  }

  // Footer
  ctx.fillStyle = c.textDim;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('←→ Tabs  ↑↓ Scroll  Esc Close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
  ctx.textAlign = 'left';
}

function renderQuestsTab(ctx, c, player, contentY, contentH) {
  const quests = player.activeQuests || [];
  const completed = player.completedQuests || [];
  const progress = player.questProgress || {};

  let y = contentY + 16;
  const x = 40;

  if (quests.length === 0 && completed.length === 0) {
    ctx.fillStyle = c.textDim;
    ctx.font = '18px monospace';
    ctx.fillText('No quests yet. Talk to NPCs!', x, y);
    return;
  }

  // Active quests
  if (quests.length > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Active Quests', x, y);
    y += 28;

    for (const questId of quests) {
      const def = QUEST_DEFS[questId];
      if (!def || y > contentY + contentH - 16) continue;

      ctx.fillStyle = c.text;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(def.name, x, y);
      y += 22;

      ctx.fillStyle = c.textDim;
      ctx.font = '14px monospace';
      ctx.fillText(def.desc, x + 8, y);
      y += 20;

      // Objectives with progress
      for (const obj of def.objectives) {
        const key = `${obj.type}_${obj.target}`;
        const current = progress[questId]?.[key] || 0;
        const needed = obj.count || 1;
        const pct = Math.min(current / needed, 1);

        // Progress bar
        const barX = x + 8;
        const barW = 200;
        const barH = 10;
        ctx.fillStyle = '#1a2244';
        ctx.fillRect(barX, y + 2, barW, barH);
        ctx.fillStyle = pct >= 1 ? '#00ff88' : '#00aaff';
        ctx.fillRect(barX, y + 2, barW * pct, barH);
        ctx.strokeStyle = c.panelBorder;
        ctx.strokeRect(barX + 0.5, y + 2.5, barW - 1, barH - 1);

        ctx.fillStyle = c.text;
        ctx.font = '13px monospace';
        ctx.fillText(`${obj.desc} (${Math.min(current, needed)}/${needed})`, barX + barW + 12, y + 4);
        y += 22;
      }
      y += 8;
    }
  }

  // Completed quests
  if (completed.length > 0 && y < contentY + contentH - 40) {
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Completed', x, y);
    y += 28;

    for (const questId of completed) {
      const def = QUEST_DEFS[questId];
      if (!def || y > contentY + contentH - 16) continue;
      ctx.fillStyle = c.textDim;
      ctx.font = '15px monospace';
      ctx.fillText(`✓ ${def.name}`, x + 8, y);
      y += 22;
    }
  }
}

function renderNFTTab(ctx, c, player, contentY, contentH) {
  const inventory = player.inventory || [];
  const x = 40;
  let y = contentY + 20;

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('NFT Drive Collection', x, y);
  y += 36;

  const driveNames = [
    { id: 'nft_drive_1', name: 'NFT Drive #1', boss: 'Sewer King' },
    { id: 'nft_drive_2', name: 'NFT Drive #2', boss: 'The Manager' },
    { id: 'nft_drive_3', name: 'NFT Drive #3', boss: 'The Alpha' },
    { id: 'nft_drive_4', name: 'NFT Drive #4', boss: 'The Specimen' },
    { id: 'nft_drive_5', name: 'NFT Drive #5', boss: 'The Consultant' },
  ];

  let collected = 0;
  for (const drive of driveNames) {
    const has = inventory.some(item => item.id === drive.id);
    if (has) collected++;

    // Slot box
    const slotW = CANVAS_WIDTH - 96;
    const slotH = 44;
    ctx.fillStyle = has ? 'rgba(0, 255, 136, 0.1)' : 'rgba(30, 30, 50, 0.5)';
    ctx.fillRect(x, y, slotW, slotH);
    ctx.strokeStyle = has ? '#00ff88' : c.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1);

    // Icon area
    ctx.fillStyle = has ? '#FFD700' : c.textDim;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(has ? '◆' : '◇', x + 12, y + 12);

    // Name
    ctx.fillStyle = has ? c.text : c.textDim;
    ctx.font = '16px monospace';
    ctx.fillText(drive.name, x + 40, y + 8);

    // Boss source
    ctx.fillStyle = c.textDim;
    ctx.font = '13px monospace';
    ctx.fillText(has ? `Dropped by ${drive.boss}` : `Defeat ${drive.boss}`, x + 40, y + 26);

    y += slotH + 6;
  }

  // Summary
  y += 12;
  ctx.fillStyle = collected >= 5 ? '#00ff88' : '#FFD700';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`${collected}/5 Drives Collected`, x, y);
  if (collected >= 5) {
    ctx.fillStyle = '#00ff88';
    ctx.font = '14px monospace';
    ctx.fillText('Return to the Mayor!', x, y + 22);
  }
}

function renderPrincessTab(ctx, c, player, contentY, contentH) {
  const x = 40;
  let y = contentY + 20;

  ctx.fillStyle = '#ff69b4';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('Princesses', x, y);
  y += 36;

  let rescued = 0;
  for (const princess of PRINCESS_DEFS) {
    const saved = isPrincessRescued(player, princess);
    if (saved) rescued++;

    const slotW = CANVAS_WIDTH - 96;
    const slotH = 32;
    ctx.fillStyle = saved ? 'rgba(255, 105, 180, 0.1)' : 'rgba(30, 30, 50, 0.5)';
    ctx.fillRect(x, y, slotW, slotH);
    ctx.strokeStyle = saved ? '#ff69b4' : c.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1);

    ctx.fillStyle = saved ? '#ff69b4' : c.textDim;
    ctx.font = '18px monospace';
    ctx.fillText(saved ? '♥' : '♡', x + 10, y + 7);

    ctx.fillStyle = saved ? c.text : c.textDim;
    ctx.font = '16px monospace';
    ctx.fillText(`Princess ${princess.name}`, x + 36, y + 8);

    if (saved) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Rescued!', x + slotW - 10, y + 9);
      ctx.textAlign = 'left';
    }

    y += slotH + 6;
  }

  y += 12;
  ctx.fillStyle = rescued >= 8 ? '#ff69b4' : c.textDim;
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`${rescued}/8 Princesses Rescued`, x, y);
}
