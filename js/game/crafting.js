// crafting.js — Crafting system for GRIDLOCK (blacksmith Gus)

import { ITEMS } from '../data/items.js';
import { MATERIAL_DEFS } from '../data/materials.js';

export const RECIPES = {
  flame_bat_craft: {
    id: 'flame_bat_craft',
    result: 'flame_bat_craft',
    name: 'Flame Bat',
    materials: { scrap_metal: 1, fuel_cell: 3 },
    gold: 80,
  },
  cryo_blade: {
    id: 'cryo_blade',
    result: 'cryo_blade',
    name: 'Cryo Blade',
    materials: { scrap_metal: 2, cryo_core: 2 },
    gold: 90,
  },
  shock_staff: {
    id: 'shock_staff',
    result: 'shock_staff',
    name: 'Shock Staff',
    materials: { scrap_metal: 1, spark_plug: 3 },
    gold: 85,
  },
  beast_armor: {
    id: 'beast_armor',
    result: 'beast_armor',
    name: 'Beast Armor',
    materials: { beast_hide: 4, scrap_metal: 2 },
    gold: 100,
  },
  circuit_crown: {
    id: 'circuit_crown',
    result: 'circuit_crown',
    name: 'Circuit Crown',
    materials: { circuit_board: 2, spark_plug: 1 },
    gold: 150,
  },
  bio_helm: {
    id: 'bio_helm',
    result: 'bio_helm',
    name: 'Bio Helm',
    materials: { bio_sample: 3, toxic_goo: 2 },
    gold: 70,
  },
  toxic_shiv: {
    id: 'toxic_shiv',
    result: 'toxic_shiv',
    name: 'Toxic Shiv',
    materials: { toxic_goo: 3, scrap_metal: 1 },
    gold: 60,
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
