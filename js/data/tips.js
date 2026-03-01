// tips.js — Loading/combat tips for GRIDLOCK

export const TIPS = [
  "Hit enemy weaknesses to build your Exploit meter.",
  "At Exploit 3: auto-crit. At 6: free action. At 10: double damage!",
  "Campfires restore HP/MP and reduce your Danger level.",
  "Higher Danger means tougher enemies but better loot.",
  "Check the Compendium (C key) to track monster weaknesses.",
  "Kill 5 of any monster type to fully discover it.",
  "Craft gear at Gus's workshop using materials from enemies.",
  "Bosses have multiple phases — watch for the transition flash.",
  "The Fixer class excels at exploit combos and status effects.",
  "The Bruiser's high HP makes them ideal for boss endurance fights.",
  "The Hacker's spells can target enemy weaknesses from any range.",
  "Defend to halve incoming damage and gain a speed boost next turn.",
  "Equipment with proc effects can trigger powerful bonuses.",
  "Visit the Inn to fully restore HP and MP for free.",
  "Symbols hidden in dungeons hint at a larger conspiracy.",
  "Each region has a classified note — discover all its monsters to unlock it.",
  "Some doors require key items. Explore thoroughly!",
  "The Underworld merchant sells powerful but cursed items.",
  "Collect all 5 NFT drives from bosses to unlock the ending.",
  "8 princesses are scattered across Grymhold. Can you find them all?",
  "Status effects stack — Poison + Burn deals serious damage over time.",
  "Speed determines turn order. Faster characters act first.",
  "Luck increases critical hit chance and rare loot drops.",
  "INT boosts spell damage. Hackers scale INT the fastest.",
  "Perks are offered every 5 levels. Choose wisely!",
];

let tipIndex = Math.floor(Math.random() * TIPS.length);

export function getRandomTip() {
  tipIndex = (tipIndex + 1) % TIPS.length;
  return TIPS[tipIndex];
}
