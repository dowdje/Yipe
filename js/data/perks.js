// perks.js — Perk definitions for GRIDLOCK (choose 1 of 3 every 5 levels)

export const PERK_TABLE = [
  {
    level: 5,
    options: [
      { id: 'raw_power', name: 'Raw Power', desc: '+15% ATK', effect: { type: 'statMult', stat: 'atk', value: 1.15 } },
      { id: 'keen_eye', name: 'Keen Eye', desc: '+10% crit chance', effect: { type: 'critBonus', value: 0.10 } },
      { id: 'exploit_master', name: 'Exploit Master', desc: 'Exploits deal +25% bonus damage', effect: { type: 'exploitDmg', value: 1.25 } },
    ],
  },
  {
    level: 10,
    options: [
      { id: 'thick_skin', name: 'Thick Skin', desc: '+15% DEF', effect: { type: 'statMult', stat: 'def', value: 1.15 } },
      { id: 'quick_feet', name: 'Quick Feet', desc: '+10% SPD', effect: { type: 'statMult', stat: 'spd', value: 1.10 } },
      { id: 'lucky_break', name: 'Lucky Break', desc: '+20% LCK', effect: { type: 'statMult', stat: 'lck', value: 1.20 } },
    ],
  },
  {
    level: 15,
    options: [
      { id: 'hp_surge', name: 'HP Surge', desc: '+20% max HP', effect: { type: 'hpMult', value: 1.20 } },
      { id: 'mp_surge', name: 'MP Surge', desc: '+20% max MP', effect: { type: 'mpMult', value: 1.20 } },
      { id: 'scavenger', name: 'Scavenger', desc: '+30% material drop rate', effect: { type: 'dropBonus', value: 0.30 } },
    ],
  },
  {
    level: 20,
    options: [
      { id: 'berserker', name: 'Berserker', desc: '+25% ATK when below 50% HP', effect: { type: 'lowHpAtk', value: 1.25 } },
      { id: 'iron_wall', name: 'Iron Wall', desc: 'Defend blocks 50% (all classes)', effect: { type: 'defendBoost', value: 0.50 } },
      { id: 'mind_over_matter', name: 'Mind Over Matter', desc: '+20% INT', effect: { type: 'statMult', stat: 'int', value: 1.20 } },
    ],
  },
  {
    level: 25,
    options: [
      { id: 'gold_magnet', name: 'Gold Magnet', desc: '+50% gold from enemies', effect: { type: 'goldBonus', value: 0.50 } },
      { id: 'exp_boost', name: 'EXP Boost', desc: '+25% EXP from enemies', effect: { type: 'expBonus', value: 0.25 } },
      { id: 'danger_junkie', name: 'Danger Junkie', desc: '+50% loot bonus from danger', effect: { type: 'dangerLoot', value: 0.50 } },
    ],
  },
  {
    level: 30,
    options: [
      { id: 'bruiser_mastery', name: 'Bruiser Mastery', desc: 'Pump max +5, Flex gives +3', classReq: 'bruiser', effect: { type: 'classMastery', classId: 'bruiser' } },
      { id: 'fixer_mastery', name: 'Fixer Mastery', desc: 'Combo max +2, crits give +2 CP', classReq: 'fixer', effect: { type: 'classMastery', classId: 'fixer' } },
      { id: 'hacker_mastery', name: 'Hacker Mastery', desc: 'Overclock lasts +1 turn, +10% spell dmg', classReq: 'hacker', effect: { type: 'classMastery', classId: 'hacker' } },
      { id: 'all_rounder', name: 'All-Rounder', desc: '+10% all stats', effect: { type: 'allStats', value: 1.10 } },
    ],
  },
  {
    level: 35,
    options: [
      { id: 'life_steal', name: 'Life Steal', desc: 'Heal 10% of damage dealt', effect: { type: 'lifeSteal', value: 0.10 } },
      { id: 'mana_steal', name: 'Mana Steal', desc: 'Restore 5% MP on hit', effect: { type: 'manaSteal', value: 0.05 } },
      { id: 'counter_strike', name: 'Counter Strike', desc: '15% chance to counter attacks', effect: { type: 'counter', value: 0.15 } },
    ],
  },
  {
    level: 40,
    options: [
      { id: 'elemental_mastery', name: 'Elemental Mastery', desc: '+30% elemental damage', effect: { type: 'elemDmg', value: 1.30 } },
      { id: 'fortress', name: 'Fortress', desc: '+30% DEF, -10% SPD', effect: { type: 'fortress', defMult: 1.30, spdMult: 0.90 } },
      { id: 'glass_cannon', name: 'Glass Cannon', desc: '+30% ATK, -20% DEF', effect: { type: 'glassCannon', atkMult: 1.30, defMult: 0.80 } },
    ],
  },
  {
    level: 45,
    options: [
      { id: 'second_wind', name: 'Second Wind', desc: 'Auto-heal 25% HP once per fight at 0 HP', effect: { type: 'secondWind', value: 0.25 } },
      { id: 'executioner', name: 'Executioner', desc: '+50% damage to enemies below 25% HP', effect: { type: 'executioner', value: 1.50 } },
      { id: 'adrenaline', name: 'Adrenaline', desc: 'Free action after killing an enemy', effect: { type: 'adrenaline' } },
    ],
  },
  {
    level: 50,
    options: [
      { id: 'transcendence', name: 'Transcendence', desc: 'All stats +25%', effect: { type: 'allStats', value: 1.25 } },
      { id: 'doom_bringer', name: 'Doom Bringer', desc: 'All damage +40%', effect: { type: 'allDmg', value: 1.40 } },
      { id: 'immortal', name: 'Immortal', desc: 'Survive lethal damage 3 times per fight', effect: { type: 'immortal', charges: 3 } },
    ],
  },
];
