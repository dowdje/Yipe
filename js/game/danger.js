// danger.js — Danger Meter system for GRIDLOCK

export const DANGER_THRESHOLDS = [
  { name: 'Safe',      min: 0,  max: 10, statMod: 0,    lootMod: 0,    color: '#4CAF50' },
  { name: 'Sketchy',   min: 11, max: 25, statMod: 0,    lootMod: 0.10, color: '#FFEB3B' },
  { name: 'Dangerous', min: 26, max: 40, statMod: 0.30, lootMod: 0.20, color: '#FF9800' },
  { name: 'Critical',  min: 41, max: 60, statMod: 0.60, lootMod: 0.35, color: '#F44336' },
  { name: 'Meltdown',  min: 61, max: 999,statMod: 0.90, lootMod: 0.50, color: '#D50000' },
];

export function getDangerLevel(meter) {
  for (const threshold of DANGER_THRESHOLDS) {
    if (meter >= threshold.min && meter <= threshold.max) {
      return threshold;
    }
  }
  return DANGER_THRESHOLDS[DANGER_THRESHOLDS.length - 1];
}

export function addDanger(player, amount) {
  if (!player.dangerMeter) player.dangerMeter = 0;
  player.dangerMeter += amount;
}

export function resetDanger(player) {
  player.dangerMeter = 0;
}

export function reduceDanger(player, amount) {
  if (!player.dangerMeter) player.dangerMeter = 0;
  player.dangerMeter = Math.max(0, player.dangerMeter - amount);
}
