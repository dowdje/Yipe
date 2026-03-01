// underworld.js — Death and Underworld system for GRIDLOCK

import { DEATH_FEE_PER_LEVEL } from '../config.js';

export function getDeathFee(player) {
  return DEATH_FEE_PER_LEVEL * player.level;
}

export function canPayDeathFee(player) {
  return player.gold >= getDeathFee(player);
}

export function payDeathFee(player) {
  const fee = getDeathFee(player);
  if (player.gold >= fee) {
    player.gold -= fee;
  } else {
    player.gold = 0;
  }
}

export function reviveFromUnderworld(player) {
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.dangerMeter = 0;
}
