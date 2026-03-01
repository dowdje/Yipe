// classes.js — Class definitions for GRIDLOCK (Bruiser, Fixer, Hacker)

export const CLASSES = {
  bruiser: {
    id: 'bruiser',
    name: 'Bruiser',
    desc: 'Hit things. Get hit. Hit harder.',
    color: '#FF4444',
    resource: { type: 'pump', name: 'Pump', max: 10 },
    startingWeapon: 'lead_pipe',
    startingStats: {
      hp: 45, maxHp: 45,
      mp: 10, maxMp: 10,
      atk: 6, def: 5, spd: 4, lck: 3, int: 2,
    },
    statGrowth: {
      hp: 7, mp: 2, atk: 2, def: 2, spd: 1, lck: 1, int: 0,
    },
  },
  fixer: {
    id: 'fixer',
    name: 'Fixer',
    desc: 'Fast. Deadly. Expensive taste.',
    color: '#44DD44',
    resource: { type: 'combo', name: 'Combo', max: 5 },
    startingWeapon: 'rusty_shiv',
    startingStats: {
      hp: 28, maxHp: 28,
      mp: 15, maxMp: 15,
      atk: 7, def: 2, spd: 8, lck: 6, int: 3,
    },
    statGrowth: {
      hp: 3, mp: 3, atk: 2, def: 1, spd: 2, lck: 2, int: 1,
    },
  },
  hacker: {
    id: 'hacker',
    name: 'Hacker',
    desc: 'Why punch it when you can fry it?',
    color: '#4488FF',
    resource: { type: 'overclock', name: 'Overclock', max: 0 }, // state-based, no numeric max
    startingWeapon: 'basic_tablet',
    startingStats: {
      hp: 22, maxHp: 22,
      mp: 25, maxMp: 25,
      atk: 3, def: 2, spd: 6, lck: 5, int: 7,
    },
    statGrowth: {
      hp: 2, mp: 5, atk: 1, def: 1, spd: 1, lck: 2, int: 4,
    },
  },
};
