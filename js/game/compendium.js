// compendium.js — Monster compendium tracking for GRIDLOCK

export function recordKill(player, monsterId) {
  if (!player.compendium) player.compendium = {};
  if (!player.compendium[monsterId]) {
    player.compendium[monsterId] = { kills: 0, resistancesKnown: {} };
  }
  player.compendium[monsterId].kills++;
  // Auto-reveal all at 5 kills
  if (player.compendium[monsterId].kills >= 5) {
    player.compendium[monsterId].fullyDiscovered = true;
  }
}

export function recordResistanceDiscovery(player, monsterId, element) {
  if (!player.compendium) player.compendium = {};
  if (!player.compendium[monsterId]) {
    player.compendium[monsterId] = { kills: 0, resistancesKnown: {} };
  }
  player.compendium[monsterId].resistancesKnown[element] = true;
}

export function getEntry(player, monsterId) {
  if (!player.compendium) return null;
  return player.compendium[monsterId] || null;
}

export function isFullyDiscovered(player, monsterId) {
  const entry = getEntry(player, monsterId);
  return entry ? entry.fullyDiscovered === true : false;
}

export function isResistanceKnown(player, monsterId, element) {
  const entry = getEntry(player, monsterId);
  if (!entry) return false;
  if (entry.fullyDiscovered) return true;
  return entry.resistancesKnown[element] === true;
}

export function getAllEntries(player) {
  if (!player.compendium) return {};
  return player.compendium;
}
