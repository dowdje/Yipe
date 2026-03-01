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

// --- Region monster lists for classified notes ---
const REGION_MONSTERS = {
  caves: ['bat', 'slime', 'shadow_bat', 'poison_slime', 'goblin', 'cave_troll', 'fire_imp'],
  sewer: ['sewer_rat', 'toxic_slime', 'sewer_king'],
  sprawl: ['feral_dog', 'feral_rat', 'goblin_archer', 'hoa_enforcer'],
  retail: ['retail_bot', 'price_scanner', 'shopping_cart_golem', 'corrupted_cashier', 'the_manager'],
  gym: ['protein_junkie', 'swole_beast', 'gym_bro', 'treadmill_monster', 'the_alpha'],
  labs: ['lab_chimera', 'bio_mutant', 'experiment_pod', 'rogue_ai', 'the_specimen'],
  island: ['elite_guard', 'security_drone', 'cult_acolyte', 'void_wraith', 'the_consultant'],
};

const CLASSIFIED_NOTES = {
  caves: "CLASSIFIED: The cave systems beneath Grymhold were not always infested. Something drove the creatures here. Markings on the deepest walls match no known language.",
  sewer: "CLASSIFIED: The Sewer King wasn't always a monster. Old municipal records list a 'sanitation superintendent' who disappeared the same week the sewers went dark. His employee badge was never recovered.",
  sprawl: "CLASSIFIED: The HOA was dissolved by city council order 12 years ago. So who is issuing the enforcement notices? The letterhead bears a symbol — an eye within a triangle.",
  retail: "CLASSIFIED: Before closure, the Retail Ruins manager filed 47 consecutive 'incident reports' about 'employees exhibiting mechanical behavior.' All reports were suppressed by corporate.",
  gym: "CLASSIFIED: The Alpha's protein supplements were sourced from a lab with no public registration. The compound matches nothing in pharmaceutical databases. Side effects include 'unprecedented cellular mutation.'",
  labs: "CLASSIFIED: The Specimen was created by splicing three distinct genome templates. The funding trail leads to a shell company: GRIDLOCK CONSULTING LLC. Filed in the same week as four other shell companies.",
  island: "CLASSIFIED: The Consultant is not one person. 'The Consultant' is a title passed between operatives of an organization older than the city itself. Their symbol: an all-seeing eye above five pillars. The NFT drives contain the membership roster.",
};

export function getRegionCompletion(player, regionId) {
  const monsters = REGION_MONSTERS[regionId];
  if (!monsters) return 0;
  let discovered = 0;
  for (const id of monsters) {
    if (isFullyDiscovered(player, id)) discovered++;
  }
  return discovered / monsters.length;
}

export function getUnlockedClassifiedNotes(player) {
  const notes = [];
  for (const [regionId, text] of Object.entries(CLASSIFIED_NOTES)) {
    if (getRegionCompletion(player, regionId) >= 1.0) {
      notes.push({ regionId, text });
    }
  }
  return notes;
}

export function getRegionMonsters(regionId) {
  return REGION_MONSTERS[regionId] || [];
}
