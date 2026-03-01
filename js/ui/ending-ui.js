// ending-ui.js — Ending sequence and credits for GRIDLOCK

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';
import { getCtx } from '../engine/renderer.js';

let endingPhase = 0; // 0: story, 1: princess count, 2: credits scroll
let endingStart = 0;
let princessCount = 0;
let scrollY = 0;

const CREDITS = [
  'GRIDLOCK',
  '',
  'A Dungeon Contracting RPG',
  '',
  '- - - - - - - - - -',
  '',
  'Design & Programming',
  'The Development Team',
  '',
  'Boss AI & Combat Design',
  'Phase 7 Engine',
  '',
  'Sprite Art',
  '8x8 Pixel Mastery',
  '',
  '- - - - - - - - - -',
  '',
  'Special Thanks',
  'All the princesses who waited patiently',
  'The Mayor (for questionable leadership)',
  'Gus (for crafting miracles from scrap)',
  'The Gatekeeper (for reasonable fees)',
  '',
  '- - - - - - - - - -',
  '',
  'THE CONSPIRACY CONTINUES...',
  '',
  '',
  'Thanks for playing!',
];

export function initEnding(princesses) {
  endingPhase = 0;
  endingStart = performance.now();
  princessCount = princesses || 0;
  scrollY = 0;
}

const ENDINGS = {
  0: { title: "The Bare Minimum", desc: "You saved nobody. The conspiracy wins." },
  1: { title: "A Start", desc: "One princess freed. Seven remain trapped." },
  2: { title: "Getting There", desc: "A few princesses saved. Progress, at least." },
  3: { title: "Halfway Hero", desc: "Half the princesses freed. Not bad, contractor." },
  4: { title: "Almost There", desc: "Most princesses saved. So close..." },
  5: { title: "Almost There", desc: "Five princesses freed. The conspiracy trembles." },
  6: { title: "Nearly Perfect", desc: "Six princesses saved. Two still wait." },
  7: { title: "So Close", desc: "Seven of eight. One princess remains." },
  8: { title: "World's Greatest Contractor", desc: "All 8 princesses freed! The conspiracy is shattered!" },
};

export function renderEnding(now) {
  const ctx = getCtx();
  const elapsed = (now - endingStart) / 1000;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';

  if (endingPhase === 0) {
    // Story conclusion
    const alpha = Math.min(elapsed / 2, 1);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('CONTRACT COMPLETE', CANVAS_WIDTH / 2, 60);

    ctx.fillStyle = '#AABBCC';
    ctx.font = '12px monospace';
    ctx.fillText('The NFT drives have been recovered.', CANVAS_WIDTH / 2, 110);
    ctx.fillText("The Consultant's operation is dismantled.", CANVAS_WIDTH / 2, 130);
    ctx.fillText('Grymhold can breathe again.', CANVAS_WIDTH / 2, 150);

    ctx.globalAlpha = 1;

    if (elapsed > 5) {
      endingPhase = 1;
      endingStart = now;
    }

    ctx.fillStyle = '#556677';
    ctx.font = '10px monospace';
    ctx.fillText('Press Enter to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  } else if (endingPhase === 1) {
    // Princess count and ending title
    const alpha = Math.min(elapsed / 1.5, 1);
    ctx.globalAlpha = alpha;

    const ending = ENDINGS[Math.min(princessCount, 8)] || ENDINGS[0];

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Ending: ${ending.title}`, CANVAS_WIDTH / 2, 60);

    ctx.fillStyle = '#AABBCC';
    ctx.font = '12px monospace';
    ctx.fillText(ending.desc, CANVAS_WIDTH / 2, 100);

    ctx.fillStyle = '#88AACC';
    ctx.font = '14px monospace';
    ctx.fillText(`Princesses rescued: ${princessCount} / 8`, CANVAS_WIDTH / 2, 150);

    ctx.globalAlpha = 1;

    if (elapsed > 5) {
      endingPhase = 2;
      endingStart = now;
      scrollY = CANVAS_HEIGHT;
    }

    ctx.fillStyle = '#556677';
    ctx.font = '10px monospace';
    ctx.fillText('Press Enter to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  } else if (endingPhase === 2) {
    // Credits scroll
    scrollY = CANVAS_HEIGHT - elapsed * 30;

    ctx.font = '12px monospace';
    for (let i = 0; i < CREDITS.length; i++) {
      const y = scrollY + i * 24;
      if (y < -20 || y > CANVAS_HEIGHT + 20) continue;

      if (CREDITS[i] === 'GRIDLOCK') {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px monospace';
      } else if (CREDITS[i].startsWith('- ')) {
        ctx.fillStyle = '#334455';
        ctx.font = '12px monospace';
      } else if (CREDITS[i] === 'THE CONSPIRACY CONTINUES...') {
        ctx.fillStyle = '#CC2222';
        ctx.font = 'bold 14px monospace';
      } else if (CREDITS[i] === 'Thanks for playing!') {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px monospace';
      } else {
        ctx.fillStyle = '#8899AA';
        ctx.font = '12px monospace';
      }

      ctx.fillText(CREDITS[i], CANVAS_WIDTH / 2, y);
    }

    // End of credits
    const lastLineY = scrollY + CREDITS.length * 24;
    if (lastLineY < -40) {
      ctx.fillStyle = '#556677';
      ctx.font = '10px monospace';
      ctx.fillText('Press Enter to return to title', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  ctx.textAlign = 'left';
}

export function advanceEnding() {
  if (endingPhase === 0) {
    endingPhase = 1;
    endingStart = performance.now();
    return false;
  } else if (endingPhase === 1) {
    endingPhase = 2;
    endingStart = performance.now();
    scrollY = CANVAS_HEIGHT;
    return false;
  } else {
    // Credits done or skipped
    return true; // signal to return to title
  }
}
