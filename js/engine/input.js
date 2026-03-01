// input.js — Keyboard and click-to-move input handling

import { DIRECTIONS, TILE_SIZE } from '../config.js';

let pendingDir = null;
let enabled = true;

const KEY_MAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
};

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (!enabled) return;
    const dir = KEY_MAP[e.key];
    if (dir) {
      e.preventDefault();
      pendingDir = dir;
    }
  });

  canvas.addEventListener('click', (e) => {
    if (!enabled) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = Math.floor((e.clientX - rect.left) * scaleX / TILE_SIZE);
    const clickY = Math.floor((e.clientY - rect.top) * scaleY / TILE_SIZE);

    // Import player position at call time to avoid circular dependency
    import('../game/player.js').then(({ getPlayer }) => {
      const p = getPlayer();
      const dx = clickX - p.x;
      const dy = clickY - p.y;

      if (dx === 0 && dy === 0) return;

      // Move one step in the dominant axis
      if (Math.abs(dx) >= Math.abs(dy)) {
        pendingDir = dx > 0 ? 'right' : 'left';
      } else {
        pendingDir = dy > 0 ? 'down' : 'up';
      }
    });
  });
}

export function consumeInput() {
  const dir = pendingDir;
  pendingDir = null;
  return dir ? DIRECTIONS[dir] ? { dir, ...DIRECTIONS[dir] } : null : null;
}

export function setInputEnabled(val) {
  enabled = val;
  if (!val) pendingDir = null;
}
