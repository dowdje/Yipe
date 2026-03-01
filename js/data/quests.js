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
};
