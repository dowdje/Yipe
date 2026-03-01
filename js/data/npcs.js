// npcs.js — NPC definitions and dialogue trees for GRIDLOCK

export const NPC_DEFS = {
  mayor: {
    name: 'The Mayor',
    sprite: 'npc_mayor',
    dialogue: {
      default: {
        text: "Those NFT drives won't find themselves. Check the sewers.",
        choices: null,
      },
      quest_active: {
        text: "Still looking for those drives? Keep at it.",
        choices: null,
      },
      quest_complete: {
        text: "All 5 drives! You're a real contractor.",
        choices: null,
      },
    },
  },
  gus: {
    name: 'Gus',
    sprite: 'npc_gear',
    dialogue: {
      default: {
        text: "Got materials? I can make something useful.",
        choices: [
          { label: 'Craft', action: 'openCraft' },
          { label: 'Nevermind', action: 'close' },
        ],
      },
      no_recipes: {
        text: "Come back when you've got something worth working with.",
        choices: null,
      },
    },
  },
  destiny: {
    name: 'Princess Destiny',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "Help! The HOA enforcer won't let me leave!",
        choices: [
          { label: 'Fight the enforcer', action: 'startFight', target: 'hoa_enforcer' },
          { label: 'Pay them off (50g)', action: 'payGold', amount: 50 },
          { label: 'Not now', action: 'close' },
        ],
      },
      rescued: {
        text: "Thank you! Take this as a reward.",
        choices: null,
        reward: { gold: 50 },
      },
      done: {
        text: "You're the best contractor in Grymhold!",
        choices: null,
      },
    },
  },
  jasmine: {
    name: 'Princess Jasmine',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "I need 3 Bio Samples for my research. Can you help?",
        choices: [
          { label: 'Sure!', action: 'startQuest', questId: 'jasmine_samples' },
          { label: 'Not now', action: 'close' },
        ],
      },
      quest_active: {
        text: "Still need those Bio Samples. Check the slimes!",
        choices: null,
      },
      quest_complete: {
        text: "Perfect! Here's your payment.",
        choices: null,
        reward: { gold: 75 },
      },
      done: {
        text: "The research is going well. Thanks again!",
        choices: null,
      },
    },
  },
  marvin: {
    name: 'Marvin the Gatekeeper',
    sprite: 'npc_mayor',
    dialogue: {
      default: {
        text: "Welcome to the Underworld. Pay the fee or fight me.",
        choices: [
          { label: 'Pay', action: 'payDeathFee' },
          { label: 'Fight', action: 'startFight', target: 'gatekeeper' },
          { label: 'Wander', action: 'close' },
        ],
      },
      cant_pay: {
        text: "No gold? Fight me or grind the ghost interns.",
        choices: [
          { label: 'Fight', action: 'startFight', target: 'gatekeeper' },
          { label: 'Wander', action: 'close' },
        ],
      },
    },
  },
};
