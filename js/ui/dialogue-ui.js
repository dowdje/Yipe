// dialogue-ui.js — NPC dialogue box rendering for GRIDLOCK

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config.js';
import { getCtx } from '../engine/renderer.js';

const DIALOGUE_HEIGHT = 90;
const TYPEWRITER_SPEED = 30; // ms per character

const dialogueState = {
  active: false,
  npcName: '',
  text: '',
  choices: null,
  choiceIndex: 0,
  displayedChars: 0,
  lastCharTime: 0,
  callback: null,
  fullTextShown: false,
};

export function getDialogueState() {
  return dialogueState;
}

export function startDialogue(npcName, text, choices, callback) {
  dialogueState.active = true;
  dialogueState.npcName = npcName;
  dialogueState.text = text;
  dialogueState.choices = choices;
  dialogueState.choiceIndex = 0;
  dialogueState.displayedChars = 0;
  dialogueState.lastCharTime = performance.now();
  dialogueState.callback = callback;
  dialogueState.fullTextShown = false;
}

export function endDialogue() {
  dialogueState.active = false;
  dialogueState.callback = null;
}

export function advanceDialogue() {
  if (!dialogueState.active) return null;

  // If text isn't fully shown, show it all
  if (!dialogueState.fullTextShown) {
    dialogueState.displayedChars = dialogueState.text.length;
    dialogueState.fullTextShown = true;
    return null;
  }

  // If there are choices, return the selected choice
  if (dialogueState.choices && dialogueState.choices.length > 0) {
    const choice = dialogueState.choices[dialogueState.choiceIndex];
    endDialogue();
    return choice;
  }

  // Auto-dismiss
  endDialogue();
  return { action: 'close' };
}

export function navigateDialogueChoice(dy) {
  if (!dialogueState.choices || dialogueState.choices.length === 0) return;
  const len = dialogueState.choices.length;
  dialogueState.choiceIndex = (dialogueState.choiceIndex + dy + len) % len;
}

export function renderDialogue(now) {
  if (!dialogueState.active) return;

  const ctx = getCtx();
  const boxY = CANVAS_HEIGHT - DIALOGUE_HEIGHT - 8;
  const boxX = 8;
  const boxW = CANVAS_WIDTH - 16;
  const boxH = DIALOGUE_HEIGHT;

  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  // NPC name
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 12px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(dialogueState.npcName, boxX + 10, boxY + 8);

  // Typewriter text
  const elapsed = now - dialogueState.lastCharTime;
  if (!dialogueState.fullTextShown && elapsed > TYPEWRITER_SPEED && dialogueState.displayedChars < dialogueState.text.length) {
    dialogueState.displayedChars++;
    dialogueState.lastCharTime = now;
    if (dialogueState.displayedChars >= dialogueState.text.length) {
      dialogueState.fullTextShown = true;
    }
  }

  const displayText = dialogueState.text.slice(0, dialogueState.displayedChars);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '11px monospace';

  // Word wrap
  const maxWidth = boxW - 20;
  const words = displayText.split(' ');
  let line = '';
  let lineY = boxY + 26;
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, boxX + 10, lineY);
      line = word;
      lineY += 14;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, boxX + 10, lineY);

  // Choices (if text fully shown)
  if (dialogueState.fullTextShown && dialogueState.choices && dialogueState.choices.length > 0) {
    const choiceStartY = boxY + boxH - 6 - dialogueState.choices.length * 16;
    ctx.font = '11px monospace';
    for (let i = 0; i < dialogueState.choices.length; i++) {
      const cy = choiceStartY + i * 16;
      if (i === dialogueState.choiceIndex) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`▸ ${dialogueState.choices[i].label}`, boxX + 20, cy);
      } else {
        ctx.fillStyle = '#AAAABB';
        ctx.fillText(`  ${dialogueState.choices[i].label}`, boxX + 20, cy);
      }
    }
  } else if (dialogueState.fullTextShown && !dialogueState.choices) {
    // Show dismiss hint
    ctx.fillStyle = '#888888';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Press Enter', boxX + boxW - 10, boxY + boxH - 8);
    ctx.textAlign = 'left';
  }
}
