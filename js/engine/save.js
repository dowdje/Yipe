// save.js — localStorage save/load (Phase 1 stub)

const SAVE_KEY = 'grymhold_save';

export function saveGame(roomId, playerX, playerY) {
  const data = { roomId, playerX, playerY, timestamp: Date.now() };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Load failed:', e);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
