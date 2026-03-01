// quests.js — Quest definitions for GRIDLOCK

export const QUEST_DEFS = {
  main_nft_drives: {
    id: 'main_nft_drives',
    name: 'The NFT Drives',
    type: 'main',
    desc: 'Recover all 5 NFT drives from the dungeon bosses.',
    objectives: [
      { type: 'collect', target: 'nft_drive', count: 5, desc: 'NFT drives recovered' },
    ],
    reward: { gold: 500, unlocks: 'consultants_island' },
    giver: 'mayor',
  },
  destiny_rescue: {
    id: 'destiny_rescue',
    name: 'Princess in Distress',
    type: 'side',
    desc: 'Help Princess Destiny escape the HOA enforcer.',
    objectives: [
      { type: 'interact', target: 'destiny', desc: 'Help Princess Destiny' },
    ],
    reward: { gold: 50 },
    giver: 'destiny',
  },
  jasmine_samples: {
    id: 'jasmine_samples',
    name: 'Bio Research',
    type: 'side',
    desc: 'Collect 3 Bio Samples for Princess Jasmine.',
    objectives: [
      { type: 'collect_material', target: 'bio_sample', count: 3, desc: 'Bio Samples collected' },
    ],
    reward: { gold: 75, recipe: 'bio_helm' },
    giver: 'jasmine',
  },
  crystal_keycard: {
    id: 'crystal_keycard',
    name: 'Security Clearance',
    type: 'side',
    desc: 'Find the security keycard to free Princess Crystal.',
    objectives: [
      { type: 'collect', target: 'retail_keycard', count: 1, desc: 'Security keycard found' },
    ],
    reward: { gold: 100 },
    giver: 'crystal',
  },
  tiffany_antidote: {
    id: 'tiffany_antidote',
    name: 'Antidote Required',
    type: 'side',
    desc: 'Craft an Antidote for Princess Tiffany using Bio Samples and Toxic Goo.',
    objectives: [
      { type: 'craft', target: 'antidote', count: 1, desc: 'Antidote crafted' },
    ],
    reward: { gold: 250 },
    giver: 'tiffany',
  },
  angelica_rescue: {
    id: 'angelica_rescue',
    name: 'Underworld Princess',
    type: 'side',
    desc: 'Free Princess Angelica from Marvin\'s domain.',
    objectives: [
      { type: 'interact', target: 'angelica', desc: 'Free Princess Angelica' },
    ],
    reward: { gold: 200 },
    giver: 'angelica',
  },
  mercedes_champion: {
    id: 'mercedes_champion',
    name: 'Gym Champion',
    type: 'side',
    desc: 'Defeat The Alpha to free Princess Mercedes.',
    objectives: [
      { type: 'defeat_boss', target: 'the_alpha', desc: 'Defeat The Alpha' },
    ],
    reward: { gold: 150 },
    giver: 'mercedes',
  },
};
