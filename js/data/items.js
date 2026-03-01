// items.js — Centralized item database, loot tables, unique items (GRIDLOCK themed)

import { removeStatus } from '../game/status-effects.js';

export const ITEMS = {
  // --- Consumables (food/drink) ---
  gas_station_burrito: {
    id: 'gas_station_burrito',
    name: 'Gas Station Burrito',
    type: 'consumable',
    slot: null,
    cost: 5,
    desc: 'Restore 10 HP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const healed = Math.min(10, player.maxHp - player.hp);
      player.hp += healed;
      return healed > 0 ? `Restored ${healed} HP!` : 'HP already full!';
    },
  },
  lukewarm_pizza: {
    id: 'lukewarm_pizza',
    name: 'Lukewarm Pizza',
    type: 'consumable',
    slot: null,
    cost: 15,
    desc: 'Restore 25 HP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const healed = Math.min(25, player.maxHp - player.hp);
      player.hp += healed;
      return healed > 0 ? `Restored ${healed} HP!` : 'HP already full!';
    },
  },
  double_gridlock_burger: {
    id: 'double_gridlock_burger',
    name: 'Double Gridlock Burger',
    type: 'consumable',
    slot: null,
    cost: 35,
    desc: 'Restore 60 HP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const healed = Math.min(60, player.maxHp - player.hp);
      player.hp += healed;
      return healed > 0 ? `Restored ${healed} HP!` : 'HP already full!';
    },
  },
  protein_shake: {
    id: 'protein_shake',
    name: 'Protein Shake',
    type: 'consumable',
    slot: null,
    cost: 60,
    desc: 'Restore 100 HP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const healed = Math.min(100, player.maxHp - player.hp);
      player.hp += healed;
      return healed > 0 ? `Restored ${healed} HP!` : 'HP already full!';
    },
  },
  artisanal_kale_wrap: {
    id: 'artisanal_kale_wrap',
    name: 'Artisanal Kale Wrap',
    type: 'consumable',
    slot: null,
    cost: 100,
    desc: 'Restore 180 HP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const healed = Math.min(180, player.maxHp - player.hp);
      player.hp += healed;
      return healed > 0 ? `Restored ${healed} HP!` : 'HP already full!';
    },
  },
  full_spread_feast: {
    id: 'full_spread_feast',
    name: 'Full Spread Feast',
    type: 'consumable',
    slot: null,
    cost: 400,
    desc: 'Fully restore HP and MP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const hpHealed = player.maxHp - player.hp;
      const mpHealed = player.maxMp - player.mp;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      return (hpHealed + mpHealed) > 0 ? `Fully restored!` : 'Already full!';
    },
  },
  cheap_energy_drink: {
    id: 'cheap_energy_drink',
    name: 'Cheap Energy Drink',
    type: 'consumable',
    slot: null,
    cost: 15,
    desc: 'Restore 10 MP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const restored = Math.min(10, player.maxMp - player.mp);
      player.mp += restored;
      return restored > 0 ? `Restored ${restored} MP!` : 'MP already full!';
    },
  },
  name_brand_energy_drink: {
    id: 'name_brand_energy_drink',
    name: 'Name Brand Energy Drink',
    type: 'consumable',
    slot: null,
    cost: 50,
    desc: 'Restore 35 MP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const restored = Math.min(35, player.maxMp - player.mp);
      player.mp += restored;
      return restored > 0 ? `Restored ${restored} MP!` : 'MP already full!';
    },
  },
  dubious_nootropic: {
    id: 'dubious_nootropic',
    name: 'Dubious Nootropic',
    type: 'consumable',
    slot: null,
    cost: 180,
    desc: 'Fully restore MP',
    rarity: 'common',
    stackable: true,
    use(player) {
      const restored = player.maxMp - player.mp;
      player.mp = player.maxMp;
      return restored > 0 ? `Restored ${restored} MP!` : 'MP already full!';
    },
  },

  // --- Status cure items ---
  antidote_gummy: {
    id: 'antidote_gummy',
    name: 'Antidote Gummy',
    type: 'consumable',
    slot: null,
    cost: 20,
    desc: 'Cure Poison & Enfeeble',
    rarity: 'common',
    stackable: true,
    use(player, combat) {
      if (!combat || !combat.playerStatuses) return 'No effect!';
      const src = { statuses: combat.playerStatuses };
      const curedPoison = removeStatus(src, 'poison');
      const curedEnfeeble = removeStatus(src, 'enfeeble');
      combat.playerStatuses = src.statuses;
      if (curedPoison && curedEnfeeble) return 'Poison and Enfeeble cured!';
      if (curedPoison) return 'Poison cured!';
      if (curedEnfeeble) return 'Enfeeble cured!';
      return 'No status to cure!';
    },
  },
  ice_pack: {
    id: 'ice_pack',
    name: 'Ice Pack',
    type: 'consumable',
    slot: null,
    cost: 20,
    desc: 'Cure Burn',
    rarity: 'common',
    stackable: true,
    use(player, combat) {
      if (!combat || !combat.playerStatuses) return 'No effect!';
      const src = { statuses: combat.playerStatuses };
      const cured = removeStatus(src, 'burn');
      combat.playerStatuses = src.statuses;
      return cured ? 'Burn cured!' : 'No Burn to cure!';
    },
  },
  hand_warmer: {
    id: 'hand_warmer',
    name: 'Hand Warmer',
    type: 'consumable',
    slot: null,
    cost: 20,
    desc: 'Cure Chill & Paralyze',
    rarity: 'common',
    stackable: true,
    use(player, combat) {
      if (!combat || !combat.playerStatuses) return 'No effect!';
      const src = { statuses: combat.playerStatuses };
      const curedChill = removeStatus(src, 'chill');
      const curedParalyze = removeStatus(src, 'paralyze');
      combat.playerStatuses = src.statuses;
      if (curedChill && curedParalyze) return 'Chill and Paralyze cured!';
      if (curedChill) return 'Chill cured!';
      if (curedParalyze) return 'Paralyze cured!';
      return 'No status to cure!';
    },
  },

  // --- Utility items ---
  scanner: {
    id: 'scanner',
    name: 'Scanner',
    type: 'consumable',
    slot: null,
    cost: 40,
    desc: 'Reveal monster resistances',
    rarity: 'common',
    stackable: true,
    use(player, combat) {
      if (combat && combat.enemy && combat.enemy.resistances) {
        combat._scanned = true;
        return 'Resistances revealed!';
      }
      return 'Nothing to scan!';
    },
  },

  // --- Weapons ---
  lead_pipe: {
    id: 'lead_pipe',
    name: 'Lead Pipe',
    type: 'weapon',
    slot: 'weapon',
    power: 3,
    damageType: 'physical',
    cost: 30,
    desc: 'A heavy lead pipe. ATK +3',
    rarity: 'common',
    stackable: false,
  },
  baseball_bat: {
    id: 'baseball_bat',
    name: 'Baseball Bat',
    type: 'weapon',
    slot: 'weapon',
    power: 2,
    damageType: 'physical',
    cost: 25,
    desc: 'Aluminum. Dented. ATK +2',
    rarity: 'common',
    stackable: false,
  },
  rusty_shiv: {
    id: 'rusty_shiv',
    name: 'Rusty Shiv',
    type: 'weapon',
    slot: 'weapon',
    power: 2,
    damageType: 'physical',
    cost: 20,
    desc: 'Quick and dirty. ATK +2',
    rarity: 'common',
    stackable: false,
  },
  basic_tablet: {
    id: 'basic_tablet',
    name: 'Basic Tablet',
    type: 'weapon',
    slot: 'weapon',
    power: 1,
    damageType: 'physical',
    cost: 15,
    desc: 'Cracked screen, still compiles. ATK +1',
    rarity: 'common',
    stackable: false,
  },

  // --- Shields ---
  wooden_shield: {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    type: 'shield',
    slot: 'shield',
    defense: 1,
    cost: 20,
    desc: 'A basic wooden shield. DEF +1',
    rarity: 'common',
    stackable: false,
  },

  // --- Armor ---
  leather_helm: {
    id: 'leather_helm',
    name: 'Leather Helm',
    type: 'armor',
    slot: 'helm',
    defense: 1,
    cost: 15,
    desc: 'Light head protection. DEF +1',
    rarity: 'common',
    stackable: false,
  },
  chain_mail: {
    id: 'chain_mail',
    name: 'Chain Mail',
    type: 'armor',
    slot: 'chest',
    defense: 2,
    cost: 40,
    desc: 'Linked metal rings. DEF +2',
    rarity: 'common',
    stackable: false,
  },
  iron_boots: {
    id: 'iron_boots',
    name: 'Iron Boots',
    type: 'armor',
    slot: 'boots',
    defense: 1,
    cost: 18,
    desc: 'Heavy iron boots. DEF +1',
    rarity: 'common',
    stackable: false,
  },
  swift_boots: {
    id: 'swift_boots',
    name: 'Swift Boots',
    type: 'armor',
    slot: 'boots',
    defense: 0,
    bonus: { spd: 1 },
    cost: 28,
    desc: 'Light and quick. SPD +1',
    rarity: 'common',
    stackable: false,
  },

  // --- Elemental Weapons ---
  welding_torch: {
    id: 'welding_torch',
    name: 'Welding Torch',
    type: 'weapon',
    slot: 'weapon',
    power: 8,
    damageType: 'fire',
    cost: 45,
    desc: 'Burns on contact. ATK +8',
    rarity: 'uncommon',
    stackable: false,
  },
  cryo_spray: {
    id: 'cryo_spray',
    name: 'Cryo Spray',
    type: 'weapon',
    slot: 'weapon',
    power: 8,
    damageType: 'ice',
    cost: 45,
    desc: 'Flash-freezes anything. ATK +8',
    rarity: 'uncommon',
    stackable: false,
  },
  taser: {
    id: 'taser',
    name: 'Taser',
    type: 'weapon',
    slot: 'weapon',
    power: 8,
    damageType: 'lightning',
    cost: 45,
    desc: 'High voltage persuasion. ATK +8',
    rarity: 'uncommon',
    stackable: false,
  },
  sledgehammer: {
    id: 'sledgehammer',
    name: 'Sledgehammer',
    type: 'weapon',
    slot: 'weapon',
    power: 12,
    damageType: 'physical',
    cost: 80,
    desc: 'Heavy and decisive. ATK +12',
    rarity: 'uncommon',
    stackable: false,
  },
  overclocked_tablet: {
    id: 'overclocked_tablet',
    name: 'Overclocked Tablet',
    type: 'weapon',
    slot: 'weapon',
    power: 2,
    damageType: 'physical',
    bonus: { int: 5 },
    cost: 80,
    desc: 'Hacker upgrade. ATK +2, INT +5',
    rarity: 'uncommon',
    stackable: false,
  },

  // --- INT Armor ---
  hacker_hoodie: {
    id: 'hacker_hoodie',
    name: 'Hacker Hoodie',
    type: 'armor',
    slot: 'chest',
    defense: 1,
    bonus: { int: 3 },
    cost: 50,
    desc: 'Comfy and smart. DEF +1, INT +3',
    rarity: 'uncommon',
    stackable: false,
  },
  circuit_board_helm: {
    id: 'circuit_board_helm',
    name: 'Circuit Board Helm',
    type: 'armor',
    slot: 'helm',
    defense: 2,
    bonus: { int: 2 },
    cost: 60,
    desc: 'Looks ridiculous. Works great. DEF +2, INT +2',
    rarity: 'uncommon',
    stackable: false,
  },

  // --- Accessories ---
  focus_chip: {
    id: 'focus_chip',
    name: 'Focus Chip',
    type: 'accessory',
    slot: 'accessory1',
    bonus: { int: 3 },
    cost: 40,
    desc: 'Sharpens the mind. INT +3',
    rarity: 'uncommon',
    stackable: false,
  },
  neural_link: {
    id: 'neural_link',
    name: 'Neural Link',
    type: 'accessory',
    slot: 'accessory1',
    bonus: { int: 5, lck: 1 },
    cost: 100,
    desc: 'Direct brain interface. INT +5, LCK +1',
    rarity: 'rare',
    stackable: false,
  },
  atk_ring: {
    id: 'atk_ring',
    name: 'ATK Ring',
    type: 'accessory',
    slot: 'accessory1',
    bonus: { atk: 1 },
    cost: 25,
    desc: 'A ring of strength. ATK +1',
    rarity: 'common',
    stackable: false,
  },
  luck_charm: {
    id: 'luck_charm',
    name: 'Luck Charm',
    type: 'accessory',
    slot: 'accessory2',
    bonus: { lck: 2 },
    cost: 22,
    desc: 'A lucky trinket. LCK +2',
    rarity: 'common',
    stackable: false,
  },

  // --- Crafted Items ---
  flame_bat_craft: {
    id: 'flame_bat_craft',
    name: 'Flame Bat',
    type: 'weapon',
    slot: 'weapon',
    power: 15,
    damageType: 'fire',
    cost: 120,
    desc: 'A bat wreathed in fire. ATK +15',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.15, effect: 'applyStatus', status: 'burn' },
  },
  cryo_blade: {
    id: 'cryo_blade',
    name: 'Cryo Blade',
    type: 'weapon',
    slot: 'weapon',
    power: 14,
    damageType: 'ice',
    cost: 110,
    desc: 'Freezing edge. ATK +14',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.15, effect: 'applyStatus', status: 'chill' },
  },
  shock_staff: {
    id: 'shock_staff',
    name: 'Shock Staff',
    type: 'weapon',
    slot: 'weapon',
    power: 13,
    damageType: 'lightning',
    bonus: { int: 3 },
    cost: 100,
    desc: 'Crackling with power. ATK +13, INT +3',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.12, effect: 'applyStatus', status: 'paralyze' },
  },
  beast_armor: {
    id: 'beast_armor',
    name: 'Beast Armor',
    type: 'armor',
    slot: 'chest',
    defense: 5,
    bonus: { atk: 2 },
    cost: 130,
    desc: 'Primal protection. DEF +5, ATK +2',
    rarity: 'rare',
    stackable: false,
  },
  circuit_crown: {
    id: 'circuit_crown',
    name: 'Circuit Crown',
    type: 'armor',
    slot: 'helm',
    defense: 3,
    bonus: { int: 6 },
    cost: 180,
    desc: 'Neural amplifier. DEF +3, INT +6',
    rarity: 'rare',
    stackable: false,
  },
  bio_helm: {
    id: 'bio_helm',
    name: 'Bio Helm',
    type: 'armor',
    slot: 'helm',
    defense: 2,
    bonus: { def: 1, int: 3 },
    cost: 90,
    desc: 'Organic-tech hybrid. DEF +2(+1), INT +3',
    rarity: 'uncommon',
    stackable: false,
  },
  toxic_shiv: {
    id: 'toxic_shiv',
    name: 'Toxic Shiv',
    type: 'weapon',
    slot: 'weapon',
    power: 7,
    damageType: 'physical',
    cost: 70,
    desc: 'Coated in nasty stuff. ATK +7',
    rarity: 'uncommon',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.25, effect: 'applyStatus', status: 'poison' },
  },

  // --- Unique Items (Tier 1: Lv 1-5) ---
  goblins_fang: {
    id: 'goblins_fang',
    name: "Goblin's Fang",
    type: 'weapon',
    slot: 'weapon',
    power: 3,
    damageType: 'physical',
    cost: 0,
    desc: 'A crude dagger ripped from a goblin chief. ATK +3',
    flavorText: 'Still warm from the kill.',
    rarity: 'unique',
    stackable: false,
  },
  slime_shield: {
    id: 'slime_shield',
    name: 'Slime Shield',
    type: 'shield',
    slot: 'shield',
    defense: 2,
    cost: 0,
    desc: 'A shield coated in hardened slime. DEF +2',
    flavorText: 'Smells terrible, works great.',
    rarity: 'unique',
    stackable: false,
  },

  // --- Unique Items (Tier 2: Lv 6-10) ---
  frostbite_ring: {
    id: 'frostbite_ring',
    name: 'Frostbite Ring',
    type: 'accessory',
    slot: 'accessory1',
    bonus: { atk: 2, lck: 1 },
    cost: 0,
    desc: 'A ring of bitter cold. ATK +2, LCK +1',
    flavorText: 'Your fingers go numb, but your strikes ring true.',
    rarity: 'unique',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.15, effect: 'applyStatus', status: 'chill' },
  },
  shadow_cloak: {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    type: 'armor',
    slot: 'chest',
    defense: 3,
    bonus: { spd: 1 },
    cost: 0,
    desc: 'A cloak woven from darkness. DEF +3, SPD +1',
    flavorText: 'The shadows cling to you like old friends.',
    rarity: 'unique',
    stackable: false,
  },

  // --- Unique Items (Tier 3: Lv 11-15) ---
  flame_brand: {
    id: 'flame_brand',
    name: 'Flame Brand',
    type: 'weapon',
    slot: 'weapon',
    power: 6,
    damageType: 'fire',
    cost: 0,
    desc: 'A sword wreathed in eternal flame. ATK +6',
    flavorText: 'The blade hungers for battle.',
    rarity: 'unique',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.20, effect: 'applyStatus', status: 'burn' },
  },
  crystal_helm: {
    id: 'crystal_helm',
    name: 'Crystal Helm',
    type: 'armor',
    slot: 'helm',
    defense: 3,
    bonus: { lck: 2 },
    cost: 0,
    desc: 'A helm of living crystal. DEF +3, LCK +2',
    flavorText: 'It hums with a frequency only the lucky can hear.',
    rarity: 'unique',
    stackable: false,
  },

  // --- Unique Items (Tier 4: Lv 16-20) ---
  void_blade: {
    id: 'void_blade',
    name: 'Void Blade',
    type: 'weapon',
    slot: 'weapon',
    power: 9,
    damageType: 'lightning',
    cost: 0,
    desc: 'A blade crackling with dark energy. ATK +9',
    flavorText: 'It cuts through reality itself.',
    rarity: 'unique',
    stackable: false,
    proc: { trigger: 'onCrit', chance: 0.30, effect: 'bonusDamage', value: 15 },
  },
  aegis_of_valor: {
    id: 'aegis_of_valor',
    name: 'Aegis of Valor',
    type: 'shield',
    slot: 'shield',
    defense: 5,
    bonus: { def: 2 },
    cost: 0,
    desc: 'A legendary shield. DEF +5(+2)',
    flavorText: 'Those who carry it know no fear.',
    rarity: 'unique',
    stackable: false,
  },

  // --- Unique Items (Tier 5: Lv 21+) ---
  doombringer: {
    id: 'doombringer',
    name: 'Doombringer',
    type: 'weapon',
    slot: 'weapon',
    power: 14,
    damageType: 'physical',
    cost: 0,
    desc: 'The world-ender. ATK +14',
    flavorText: 'Every swing echoes with the screams of fallen kingdoms.',
    rarity: 'unique',
    stackable: false,
  },
  crown_of_eternity: {
    id: 'crown_of_eternity',
    name: 'Crown of Eternity',
    type: 'armor',
    slot: 'helm',
    defense: 5,
    bonus: { lck: 5, spd: 2 },
    cost: 0,
    desc: 'A crown worn by immortal kings. DEF +5, LCK +5, SPD +2',
    flavorText: 'Time bows before its wearer.',
    rarity: 'unique',
    stackable: false,
  },

  // --- Additional Crafted Items ---
  lightning_rod: {
    id: 'lightning_rod',
    name: 'Lightning Rod',
    type: 'weapon',
    slot: 'weapon',
    power: 16,
    damageType: 'lightning',
    bonus: { spd: 2 },
    cost: 150,
    desc: 'Channels pure electricity. ATK +16, SPD +2',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.18, effect: 'applyStatus', status: 'paralyze' },
  },
  bio_armor: {
    id: 'bio_armor',
    name: 'Bio Armor',
    type: 'armor',
    slot: 'chest',
    defense: 6,
    bonus: { int: 3, def: 1 },
    cost: 170,
    desc: 'Living armor that adapts. DEF +6(+1), INT +3',
    rarity: 'rare',
    stackable: false,
  },
  plasma_blade: {
    id: 'plasma_blade',
    name: 'Plasma Blade',
    type: 'weapon',
    slot: 'weapon',
    power: 18,
    damageType: 'fire',
    cost: 200,
    desc: 'Superheated plasma edge. ATK +18',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.20, effect: 'applyStatus', status: 'burn' },
  },
  cryo_shield: {
    id: 'cryo_shield',
    name: 'Cryo Shield',
    type: 'shield',
    slot: 'shield',
    defense: 4,
    bonus: { def: 2 },
    cost: 140,
    desc: 'Freezing cold defense. DEF +4(+2)',
    rarity: 'rare',
    stackable: false,
  },
  speed_boots: {
    id: 'speed_boots',
    name: 'Speed Boots',
    type: 'armor',
    slot: 'boots',
    defense: 1,
    bonus: { spd: 3 },
    cost: 120,
    desc: 'Lightning-fast footwork. DEF +1, SPD +3',
    rarity: 'rare',
    stackable: false,
  },
  fortified_mail: {
    id: 'fortified_mail',
    name: 'Fortified Mail',
    type: 'armor',
    slot: 'chest',
    defense: 7,
    bonus: { atk: 1 },
    cost: 160,
    desc: 'Reinforced chain links. DEF +7, ATK +1',
    rarity: 'rare',
    stackable: false,
  },
  neural_helm: {
    id: 'neural_helm',
    name: 'Neural Helm',
    type: 'armor',
    slot: 'helm',
    defense: 4,
    bonus: { int: 8 },
    cost: 210,
    desc: 'Brain-computer interface. DEF +4, INT +8',
    rarity: 'rare',
    stackable: false,
  },
  venom_blade: {
    id: 'venom_blade',
    name: 'Venom Blade',
    type: 'weapon',
    slot: 'weapon',
    power: 10,
    damageType: 'physical',
    cost: 130,
    desc: 'Drips with lethal toxin. ATK +10',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.30, effect: 'applyStatus', status: 'poison' },
  },
  inferno_gauntlets: {
    id: 'inferno_gauntlets',
    name: 'Inferno Gauntlets',
    type: 'armor',
    slot: 'boots',
    defense: 2,
    bonus: { atk: 3 },
    cost: 120,
    desc: 'Flaming fists. DEF +2, ATK +3',
    rarity: 'rare',
    stackable: false,
  },
  frost_armor: {
    id: 'frost_armor',
    name: 'Frost Armor',
    type: 'armor',
    slot: 'chest',
    defense: 6,
    bonus: { def: 2, spd: -1 },
    cost: 180,
    desc: 'Encased in ice. DEF +6(+2), SPD -1',
    rarity: 'rare',
    stackable: false,
  },
  circuit_blade: {
    id: 'circuit_blade',
    name: 'Circuit Blade',
    type: 'weapon',
    slot: 'weapon',
    power: 14,
    damageType: 'lightning',
    bonus: { int: 4 },
    cost: 170,
    desc: 'Digital edge. ATK +14, INT +4',
    rarity: 'rare',
    stackable: false,
  },
  mutagen_vial: {
    id: 'mutagen_vial',
    name: 'Mutagen Vial',
    type: 'consumable',
    slot: null,
    cost: 220,
    desc: 'Permanently increases a random stat by 2.',
    rarity: 'rare',
    stackable: true,
    use(player) {
      const stats = ['atk', 'def', 'spd', 'lck', 'int'];
      const stat = stats[Math.floor(Math.random() * stats.length)];
      player[stat] += 2;
      return `${stat.toUpperCase()} permanently increased by 2!`;
    },
  },

  // --- NFT Drive Quest Items ---
  nft_drive_1: {
    id: 'nft_drive_1',
    name: 'NFT Drive #1',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A corrupted data drive from the Sewer King.',
    rarity: 'legendary',
    stackable: false,
  },
  nft_drive_2: {
    id: 'nft_drive_2',
    name: 'NFT Drive #2',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A corrupted data drive from The Manager.',
    rarity: 'legendary',
    stackable: false,
  },
  nft_drive_3: {
    id: 'nft_drive_3',
    name: 'NFT Drive #3',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A corrupted data drive from The Alpha.',
    rarity: 'legendary',
    stackable: false,
  },
  nft_drive_4: {
    id: 'nft_drive_4',
    name: 'NFT Drive #4',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A corrupted data drive from The Specimen.',
    rarity: 'legendary',
    stackable: false,
  },
  nft_drive_5: {
    id: 'nft_drive_5',
    name: 'NFT Drive #5',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A corrupted data drive from The Consultant.',
    rarity: 'legendary',
    stackable: false,
  },

  // --- Key Items ---
  retail_keycard: {
    id: 'retail_keycard',
    name: 'Security Keycard',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A security keycard from the Retail Ruins electronics dept.',
    rarity: 'rare',
    stackable: false,
  },
  lab_access_card: {
    id: 'lab_access_card',
    name: 'Lab Access Card',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'Grants access to restricted lab areas.',
    rarity: 'rare',
    stackable: false,
  },
  island_pass: {
    id: 'island_pass',
    name: 'Island Pass',
    type: 'quest',
    slot: null,
    cost: 0,
    desc: 'A pass to the Consultant\'s private island.',
    rarity: 'rare',
    stackable: false,
  },

  // --- Crafted: Antidote ---
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    type: 'consumable',
    slot: null,
    cost: 80,
    desc: 'Cures all status effects and restores 50 HP.',
    rarity: 'rare',
    stackable: true,
    use(player, combat) {
      if (combat && combat.playerStatuses) {
        const src = { statuses: combat.playerStatuses };
        combat.playerStatuses = [];
      }
      const healed = Math.min(50, player.maxHp - player.hp);
      player.hp += healed;
      return `Cured all statuses! Restored ${healed} HP!`;
    },
  },

  // --- Legendary Accessories ---
  worlds_greatest_contractor: {
    id: 'worlds_greatest_contractor',
    name: "World's Greatest Contractor",
    type: 'accessory',
    slot: 'accessory1',
    bonus: { atk: 5, def: 5, spd: 3, lck: 5, int: 3 },
    cost: 0,
    desc: 'The ultimate reward for rescuing all 8 princesses.',
    flavorText: 'Your business card glows with cosmic power.',
    rarity: 'legendary',
    stackable: false,
  },
  consultants_bane: {
    id: 'consultants_bane',
    name: "Consultant's Bane",
    type: 'accessory',
    slot: 'accessory2',
    bonus: { atk: 8, def: 3, spd: 2 },
    cost: 0,
    desc: 'Wrested from The Consultant\'s defeated mech.',
    flavorText: 'It hums with corporate malice.',
    rarity: 'legendary',
    stackable: false,
  },

  // --- Underworld Merchant Items (damned items) ---
  soul_cleaver: {
    id: 'soul_cleaver',
    name: 'Soul Cleaver',
    type: 'weapon',
    slot: 'weapon',
    power: 20,
    damageType: 'physical',
    bonus: { def: -3 },
    cost: 200,
    desc: 'Devastating ATK but weakens defense. ATK +20, DEF -3',
    rarity: 'rare',
    stackable: false,
  },
  cursed_crown: {
    id: 'cursed_crown',
    name: 'Cursed Crown',
    type: 'armor',
    slot: 'helm',
    defense: 8,
    bonus: { spd: -2 },
    cost: 180,
    desc: 'Incredible defense, but slows you down. DEF +8, SPD -2',
    rarity: 'rare',
    stackable: false,
  },
  vampiric_ring: {
    id: 'vampiric_ring',
    name: 'Vampiric Ring',
    type: 'accessory',
    slot: 'accessory1',
    bonus: { atk: 4, lck: 3 },
    cost: 250,
    desc: 'Drains life from enemies. ATK +4, LCK +3',
    rarity: 'rare',
    stackable: false,
    proc: { trigger: 'onHit', chance: 0.20, effect: 'lifesteal', value: 5 },
  },
  glass_cannon_charm: {
    id: 'glass_cannon_charm',
    name: 'Glass Cannon Charm',
    type: 'accessory',
    slot: 'accessory2',
    bonus: { atk: 6, int: 4, def: -4 },
    cost: 220,
    desc: 'Maximum offense, paper defense. ATK +6, INT +4, DEF -4',
    rarity: 'rare',
    stackable: false,
  },
  phantom_boots: {
    id: 'phantom_boots',
    name: 'Phantom Boots',
    type: 'armor',
    slot: 'boots',
    defense: 0,
    bonus: { spd: 5, def: -2 },
    cost: 190,
    desc: 'Blazing speed, no protection. SPD +5, DEF -2',
    rarity: 'rare',
    stackable: false,
  },
};

// --- Unique loot table (level range → pool) ---
const UNIQUE_LOOT_TABLE = [
  { minLevel: 1,  maxLevel: 5,  items: ['goblins_fang', 'slime_shield'] },
  { minLevel: 6,  maxLevel: 10, items: ['frostbite_ring', 'shadow_cloak'] },
  { minLevel: 11, maxLevel: 15, items: ['flame_brand', 'crystal_helm'] },
  { minLevel: 16, maxLevel: 20, items: ['void_blade', 'aegis_of_valor'] },
  { minLevel: 21, maxLevel: 999, items: ['doombringer', 'crown_of_eternity'] },
];

function rollUnique(playerLevel) {
  const eligible = UNIQUE_LOOT_TABLE.filter(t => playerLevel >= t.minLevel);
  if (eligible.length === 0) return null;
  const tier = eligible[eligible.length - 1];
  const pick = tier.items[Math.floor(Math.random() * tier.items.length)];
  return ITEMS[pick] || null;
}

// --- Loot tables (balanced drop rates) ---
const LOOT_TABLES = {
  bat: [
    { itemId: null, weight: 85 },
    { itemId: 'gas_station_burrito', weight: 13 },
    { itemId: 'cheap_energy_drink', weight: 2 },
  ],
  slime: [
    { itemId: null, weight: 78 },
    { itemId: 'gas_station_burrito', weight: 12 },
    { itemId: 'cheap_energy_drink', weight: 5 },
    { itemId: 'leather_helm', weight: 5 },
  ],
  goblin: [
    { itemId: null, weight: 70 },
    { itemId: 'lukewarm_pizza', weight: 10 },
    { itemId: 'cheap_energy_drink', weight: 7 },
    { itemId: 'iron_boots', weight: 5 },
    { itemId: 'baseball_bat', weight: 5 },
    { itemId: 'atk_ring', weight: 3 },
  ],
  shadow_bat: [
    { itemId: null, weight: 75 },
    { itemId: 'lukewarm_pizza', weight: 12 },
    { itemId: 'cheap_energy_drink', weight: 8 },
    { itemId: 'swift_boots', weight: 5 },
  ],
  poison_slime: [
    { itemId: null, weight: 72 },
    { itemId: 'lukewarm_pizza', weight: 13 },
    { itemId: 'name_brand_energy_drink', weight: 8 },
    { itemId: 'luck_charm', weight: 7 },
  ],
  cave_troll: [
    { itemId: null, weight: 65 },
    { itemId: 'double_gridlock_burger', weight: 15 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'chain_mail', weight: 5 },
    { itemId: 'lead_pipe', weight: 5 },
  ],
  fire_imp: [
    { itemId: null, weight: 68 },
    { itemId: 'double_gridlock_burger', weight: 12 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'atk_ring', weight: 5 },
    { itemId: 'wooden_shield', weight: 5 },
  ],
  dark_knight: [
    { itemId: null, weight: 60 },
    { itemId: 'protein_shake', weight: 15 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'chain_mail', weight: 8 },
    { itemId: 'lead_pipe', weight: 7 },
  ],
  crystal_spider: [
    { itemId: null, weight: 62 },
    { itemId: 'protein_shake', weight: 13 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'luck_charm', weight: 8 },
    { itemId: 'swift_boots', weight: 7 },
  ],
  ancient_golem: [
    { itemId: null, weight: 55 },
    { itemId: 'artisanal_kale_wrap', weight: 15 },
    { itemId: 'dubious_nootropic', weight: 10 },
    { itemId: 'chain_mail', weight: 10 },
    { itemId: 'lead_pipe', weight: 10 },
  ],
  chaos_wraith: [
    { itemId: null, weight: 55 },
    { itemId: 'artisanal_kale_wrap', weight: 12 },
    { itemId: 'dubious_nootropic', weight: 13 },
    { itemId: 'luck_charm', weight: 10 },
    { itemId: 'atk_ring', weight: 10 },
  ],
};

  // Sprawl enemies
  feral_dog: [
    { itemId: null, weight: 82 },
    { itemId: 'gas_station_burrito', weight: 15 },
    { itemId: 'cheap_energy_drink', weight: 3 },
  ],
  feral_rat: [
    { itemId: null, weight: 85 },
    { itemId: 'gas_station_burrito', weight: 13 },
    { itemId: 'cheap_energy_drink', weight: 2 },
  ],
  goblin_archer: [
    { itemId: null, weight: 68 },
    { itemId: 'lukewarm_pizza', weight: 12 },
    { itemId: 'cheap_energy_drink', weight: 8 },
    { itemId: 'iron_boots', weight: 5 },
    { itemId: 'baseball_bat', weight: 5 },
    { itemId: 'atk_ring', weight: 2 },
  ],
  hoa_enforcer: [
    { itemId: null, weight: 50 },
    { itemId: 'double_gridlock_burger', weight: 20 },
    { itemId: 'name_brand_energy_drink', weight: 15 },
    { itemId: 'chain_mail', weight: 10 },
    { itemId: 'lead_pipe', weight: 5 },
  ],
  // Retail enemies
  retail_bot: [
    { itemId: null, weight: 72 },
    { itemId: 'lukewarm_pizza', weight: 12 },
    { itemId: 'cheap_energy_drink', weight: 8 },
    { itemId: 'scanner', weight: 5 },
    { itemId: 'atk_ring', weight: 3 },
  ],
  price_scanner: [
    { itemId: null, weight: 75 },
    { itemId: 'gas_station_burrito', weight: 12 },
    { itemId: 'cheap_energy_drink', weight: 8 },
    { itemId: 'luck_charm', weight: 5 },
  ],
  shopping_cart_golem: [
    { itemId: null, weight: 60 },
    { itemId: 'double_gridlock_burger', weight: 15 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'chain_mail', weight: 8 },
    { itemId: 'lead_pipe', weight: 7 },
  ],
  corrupted_cashier: [
    { itemId: null, weight: 70 },
    { itemId: 'lukewarm_pizza', weight: 12 },
    { itemId: 'name_brand_energy_drink', weight: 8 },
    { itemId: 'swift_boots', weight: 5 },
    { itemId: 'luck_charm', weight: 5 },
  ],
  // Gym enemies
  protein_junkie: [
    { itemId: null, weight: 70 },
    { itemId: 'protein_shake', weight: 15 },
    { itemId: 'cheap_energy_drink', weight: 8 },
    { itemId: 'atk_ring', weight: 5 },
    { itemId: 'iron_boots', weight: 2 },
  ],
  swole_beast: [
    { itemId: null, weight: 62 },
    { itemId: 'protein_shake', weight: 15 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'chain_mail', weight: 8 },
    { itemId: 'lead_pipe', weight: 5 },
  ],
  gym_bro: [
    { itemId: null, weight: 68 },
    { itemId: 'protein_shake', weight: 12 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'swift_boots', weight: 5 },
    { itemId: 'atk_ring', weight: 5 },
  ],
  treadmill_monster: [
    { itemId: null, weight: 72 },
    { itemId: 'lukewarm_pizza', weight: 12 },
    { itemId: 'cheap_energy_drink', weight: 8 },
    { itemId: 'swift_boots', weight: 5 },
    { itemId: 'luck_charm', weight: 3 },
  ],
  // Labs enemies
  lab_chimera: [
    { itemId: null, weight: 60 },
    { itemId: 'artisanal_kale_wrap', weight: 15 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'chain_mail', weight: 8 },
    { itemId: 'luck_charm', weight: 7 },
  ],
  bio_mutant: [
    { itemId: null, weight: 65 },
    { itemId: 'double_gridlock_burger', weight: 15 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'swift_boots', weight: 5 },
    { itemId: 'atk_ring', weight: 5 },
  ],
  experiment_pod: [
    { itemId: null, weight: 65 },
    { itemId: 'artisanal_kale_wrap', weight: 15 },
    { itemId: 'dubious_nootropic', weight: 10 },
    { itemId: 'scanner', weight: 5 },
    { itemId: 'luck_charm', weight: 5 },
  ],
  rogue_ai: [
    { itemId: null, weight: 60 },
    { itemId: 'artisanal_kale_wrap', weight: 12 },
    { itemId: 'dubious_nootropic', weight: 13 },
    { itemId: 'luck_charm', weight: 8 },
    { itemId: 'atk_ring', weight: 7 },
  ],
  // Island enemies
  elite_guard: [
    { itemId: null, weight: 55 },
    { itemId: 'artisanal_kale_wrap', weight: 15 },
    { itemId: 'dubious_nootropic', weight: 12 },
    { itemId: 'chain_mail', weight: 10 },
    { itemId: 'lead_pipe', weight: 8 },
  ],
  security_drone: [
    { itemId: null, weight: 60 },
    { itemId: 'artisanal_kale_wrap', weight: 13 },
    { itemId: 'dubious_nootropic', weight: 10 },
    { itemId: 'swift_boots', weight: 10 },
    { itemId: 'luck_charm', weight: 7 },
  ],
  cult_acolyte: [
    { itemId: null, weight: 65 },
    { itemId: 'double_gridlock_burger', weight: 13 },
    { itemId: 'name_brand_energy_drink', weight: 10 },
    { itemId: 'luck_charm', weight: 7 },
    { itemId: 'atk_ring', weight: 5 },
  ],
  void_wraith: [
    { itemId: null, weight: 50 },
    { itemId: 'full_spread_feast', weight: 15 },
    { itemId: 'dubious_nootropic', weight: 13 },
    { itemId: 'luck_charm', weight: 12 },
    { itemId: 'atk_ring', weight: 10 },
  ],
};

const UNIQUE_DROP_CHANCE = 0.02;

export function rollLoot(enemyType, playerLevel = 1) {
  if (Math.random() < UNIQUE_DROP_CHANCE) {
    const unique = rollUnique(playerLevel);
    if (unique) return { item: unique, rarity: 'unique' };
  }

  const table = LOOT_TABLES[enemyType];
  if (!table) return null;

  const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      if (!entry.itemId) return null;
      return { item: ITEMS[entry.itemId], rarity: 'common' };
    }
  }
  return null;
}
