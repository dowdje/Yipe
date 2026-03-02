// crafting.js — Crafting system for GRIDLOCK (blacksmith Gus)

import { ITEMS } from '../data/items.js';
import { MATERIAL_DEFS } from '../data/materials.js';

export const RECIPES = {
  flame_bat_craft: {
    id: 'flame_bat_craft',
    result: 'flame_bat_craft',
    name: 'Flame Bat',
    materials: { scrap_metal: 1, fuel_cell: 3 },
    gold: 240,
  },
  cryo_blade: {
    id: 'cryo_blade',
    result: 'cryo_blade',
    name: 'Cryo Blade',
    materials: { scrap_metal: 2, cryo_core: 2 },
    gold: 270,
  },
  shock_staff: {
    id: 'shock_staff',
    result: 'shock_staff',
    name: 'Shock Staff',
    materials: { scrap_metal: 1, spark_plug: 3 },
    gold: 255,
  },
  beast_armor: {
    id: 'beast_armor',
    result: 'beast_armor',
    name: 'Beast Armor',
    materials: { beast_hide: 4, scrap_metal: 2 },
    gold: 300,
  },
  circuit_crown: {
    id: 'circuit_crown',
    result: 'circuit_crown',
    name: 'Circuit Crown',
    materials: { circuit_board: 2, spark_plug: 1 },
    gold: 450,
  },
  bio_helm: {
    id: 'bio_helm',
    result: 'bio_helm',
    name: 'Bio Helm',
    materials: { bio_sample: 3, toxic_goo: 2 },
    gold: 210,
  },
  toxic_shiv: {
    id: 'toxic_shiv',
    result: 'toxic_shiv',
    name: 'Toxic Shiv',
    materials: { toxic_goo: 3, scrap_metal: 1 },
    gold: 180,
  },
  antidote: {
    id: 'antidote',
    result: 'antidote',
    name: 'Antidote',
    materials: { bio_sample: 3, toxic_goo: 2 },
    gold: 150,
  },
  // New recipes for expanded content
  lightning_rod: {
    id: 'lightning_rod',
    result: 'lightning_rod',
    name: 'Lightning Rod',
    materials: { spark_plug: 4, scrap_metal: 2 },
    gold: 360,
  },
  bio_armor: {
    id: 'bio_armor',
    result: 'bio_armor',
    name: 'Bio Armor',
    materials: { bio_sample: 4, beast_hide: 3 },
    gold: 420,
  },
  plasma_blade: {
    id: 'plasma_blade',
    result: 'plasma_blade',
    name: 'Plasma Blade',
    materials: { fuel_cell: 3, circuit_board: 2 },
    gold: 480,
  },
  cryo_shield: {
    id: 'cryo_shield',
    result: 'cryo_shield',
    name: 'Cryo Shield',
    materials: { cryo_core: 3, scrap_metal: 2 },
    gold: 330,
  },
  speed_boots: {
    id: 'speed_boots',
    result: 'speed_boots',
    name: 'Speed Boots',
    materials: { spark_plug: 2, beast_hide: 2 },
    gold: 270,
  },
  fortified_mail: {
    id: 'fortified_mail',
    result: 'fortified_mail',
    name: 'Fortified Mail',
    materials: { scrap_metal: 5, beast_hide: 3 },
    gold: 390,
  },
  neural_helm: {
    id: 'neural_helm',
    result: 'neural_helm',
    name: 'Neural Helm',
    materials: { circuit_board: 3, spark_plug: 2 },
    gold: 510,
  },
  venom_blade: {
    id: 'venom_blade',
    result: 'venom_blade',
    name: 'Venom Blade',
    materials: { toxic_goo: 4, bio_sample: 2 },
    gold: 300,
  },
  inferno_gauntlets: {
    id: 'inferno_gauntlets',
    result: 'inferno_gauntlets',
    name: 'Inferno Gauntlets',
    materials: { fuel_cell: 4, scrap_metal: 1 },
    gold: 285,
  },
  frost_armor: {
    id: 'frost_armor',
    result: 'frost_armor',
    name: 'Frost Armor',
    materials: { cryo_core: 4, beast_hide: 2 },
    gold: 450,
  },
  circuit_blade: {
    id: 'circuit_blade',
    result: 'circuit_blade',
    name: 'Circuit Blade',
    materials: { circuit_board: 2, scrap_metal: 3 },
    gold: 405,
  },
  mutagen_vial: {
    id: 'mutagen_vial',
    result: 'mutagen_vial',
    name: 'Mutagen Vial',
    materials: { bio_sample: 5, toxic_goo: 3 },
    gold: 540,
  },
  // Masterwork recipes (expensive, rare materials)
  omega_edge: {
    id: 'omega_edge',
    result: 'omega_edge',
    name: 'Omega Edge',
    materials: { cryo_core: 2, circuit_board: 2, scrap_metal: 3 },
    gold: 500,
  },
  colossus_armor: {
    id: 'colossus_armor',
    result: 'colossus_armor',
    name: 'Colossus Armor',
    materials: { circuit_board: 2, cryo_core: 2, beast_hide: 4 },
    gold: 400,
  },
};

export function canCraft(recipeId, player) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  if (player.gold < recipe.gold) return false;
  for (const [matId, needed] of Object.entries(recipe.materials)) {
    const have = (player.materials && player.materials[matId]) || 0;
    if (have < needed) return false;
  }
  return true;
}

export function craft(recipeId, player) {
  const recipe = RECIPES[recipeId];
  if (!recipe || !canCraft(recipeId, player)) return null;
  player.gold -= recipe.gold;
  for (const [matId, needed] of Object.entries(recipe.materials)) {
    player.materials[matId] -= needed;
    if (player.materials[matId] <= 0) delete player.materials[matId];
  }
  const item = ITEMS[recipe.result];
  return item || null;
}

export function getKnownRecipes(player) {
  // Player discovers recipes when they have at least 1 of any required material
  return Object.values(RECIPES).filter(recipe => {
    if (player.knownRecipes && player.knownRecipes.includes(recipe.id)) return true;
    for (const matId of Object.keys(recipe.materials)) {
      if (player.materials && player.materials[matId] > 0) return true;
    }
    return false;
  });
}

export function discoverRecipe(player, recipeId) {
  if (!player.knownRecipes) player.knownRecipes = [];
  if (!player.knownRecipes.includes(recipeId)) {
    player.knownRecipes.push(recipeId);
  }
}

export function getMaterialName(matId) {
  const def = MATERIAL_DEFS[matId];
  return def ? def.name : matId;
}
