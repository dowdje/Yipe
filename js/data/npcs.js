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
      post_rescue: {
        text: "The Royal Court is lovely! I've been organizing the other princesses. We're stronger together.",
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
      post_rescue: {
        text: "My research is thriving here at court. Did you know Toxic Goo has medicinal properties? Fascinating!",
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
  crystal: {
    name: 'Princess Crystal',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "I'm locked in this security office! Find the keycard to free me!",
        choices: [
          { label: 'I\'ll find it', action: 'startQuest', questId: 'crystal_keycard' },
          { label: 'Not now', action: 'close' },
        ],
      },
      quest_active: {
        text: "Did you find the security keycard? Check the electronics department!",
        choices: null,
      },
      quest_complete: {
        text: "You found it! Thank you, brave contractor!",
        choices: null,
        reward: { gold: 100 },
      },
      done: {
        text: "Freedom feels amazing! Good luck out there!",
        choices: null,
      },
      post_rescue: {
        text: "I've been cracking the security codes around here. The deeper you go, the more encrypted things get.",
        choices: null,
      },
    },
  },
  mercedes: {
    name: 'Princess Mercedes',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "The Alpha terrorizes this gym. Defeat him and I'll reward you handsomely.",
        choices: [
          { label: 'On it', action: 'close' },
        ],
      },
      boss_defeated: {
        text: "You defeated The Alpha! Take this reward, champion!",
        choices: null,
        reward: { gold: 150 },
      },
      done: {
        text: "The gym is safe again. You're stronger than you look!",
        choices: null,
      },
      post_rescue: {
        text: "I've been training the others in self-defense. A princess should know how to throw a punch!",
        choices: null,
      },
    },
  },
  tiffany: {
    name: 'Princess Tiffany',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "I've been exposed to mutagens! I need an Antidote — craft one from Bio Samples and Toxic Goo!",
        choices: [
          { label: 'I\'ll craft one', action: 'startQuest', questId: 'tiffany_antidote' },
          { label: 'Not now', action: 'close' },
        ],
      },
      quest_active: {
        text: "Please hurry with that Antidote! I need 3 Bio Samples and 2 Toxic Goo!",
        choices: null,
      },
      quest_complete: {
        text: "The Antidote works! You saved my life!",
        choices: null,
        reward: { gold: 250 },
      },
      done: {
        text: "Feeling much better now. Science is terrifying.",
        choices: null,
      },
      post_rescue: {
        text: "I've set up a small lab in the corner. The mutagen exposure gave me... insights. Don't worry, I'm fine. Mostly.",
        choices: null,
      },
    },
  },
  angelica: {
    name: 'Princess Angelica',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "Marvin won't let me leave! Pay his 200g fee or defeat him for me!",
        choices: [
          { label: 'Pay 200g', action: 'payGold', amount: 200 },
          { label: 'Fight Marvin', action: 'startFight', target: 'gatekeeper' },
          { label: 'Not now', action: 'close' },
        ],
      },
      rescued: {
        text: "Thank you! Take this for your trouble.",
        choices: null,
        reward: { gold: 200 },
      },
      done: {
        text: "The Underworld gives me the creeps. Stay safe.",
        choices: null,
      },
      post_rescue: {
        text: "After what I saw down there... the surface world feels like paradise. Thank you for bringing me back.",
        choices: null,
      },
    },
  },
  brianna: {
    name: 'Princess Brianna',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "Welcome to my shop! ...Wait, you're collecting princesses? I AM a princess — Princess Brianna! Been running this place to fund our escape.",
        choices: [
          { label: 'Browse shop', action: 'openShop', shopType: 'gear_shop' },
          { label: 'Noted!', action: 'close' },
        ],
      },
      done: {
        text: "Still running the shop! A princess has to earn a living.",
        choices: [
          { label: 'Browse shop', action: 'openShop', shopType: 'gear_shop' },
          { label: 'Bye', action: 'close' },
        ],
        reward: { gold: 300 },
      },
      post_rescue: {
        text: "Business is booming at the Royal Court! I've been sourcing rare materials. Check the shops for new stock!",
        choices: null,
      },
    },
  },
  valentina: {
    name: 'Princess Valentina',
    sprite: 'npc_princess',
    dialogue: {
      default: {
        text: "You freed me from The Consultant's prison! The conspiracy goes deeper than you know...",
        choices: null,
        reward: { gold: 0 },
      },
      done: {
        text: "Be careful. They're watching everything.",
        choices: null,
      },
      post_rescue: {
        text: "The conspiracy runs deep. But here, surrounded by the others, I feel safer. You should know — The Consultant wasn't working alone.",
        choices: null,
      },
    },
  },
  underworld_merchant: {
    name: 'Damned Merchant',
    sprite: 'npc_gear',
    dialogue: {
      default: {
        text: "These items carry a curse... but power comes at a price. Interested?",
        choices: [
          { label: 'Browse', action: 'openShop', shopType: 'underworld_shop' },
          { label: 'No thanks', action: 'close' },
        ],
      },
    },
  },
  innkeeper: {
    name: 'Innkeeper',
    sprite: 'npc_potion',
    dialogue: {
      default: {
        text: "Rest here? I'll patch you up for free.",
        choices: [
          { label: 'Rest', action: 'heal' },
          { label: 'No thanks', action: 'close' },
        ],
      },
    },
  },
  guild_master: {
    name: 'Guild Master',
    sprite: 'npc_wizard',
    dialogue: {
      default: {
        text: "Welcome to the Contractors Guild. I can train your stats — for a price.",
        choices: [
          { label: 'Train ATK', action: 'trainStat', stat: 'atk' },
          { label: 'Train DEF', action: 'trainStat', stat: 'def' },
          { label: 'Train SPD', action: 'trainStat', stat: 'spd' },
          { label: 'Train INT', action: 'trainStat', stat: 'int' },
        ],
      },
      default2: {
        text: "More training? Or perhaps a different stat?",
        choices: [
          { label: 'Train LCK', action: 'trainStat', stat: 'lck' },
          { label: 'Nevermind', action: 'close' },
        ],
      },
    },
  },
};
