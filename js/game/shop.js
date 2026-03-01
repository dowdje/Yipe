// shop.js — Shop state and buy/sell logic (General Store, Gear Shop, Spell Shop)

import { SHOP_TYPES } from '../config.js';
import { getPlayer, addToInventory, removeFromInventory } from './player.js';
import { ITEMS } from '../data/items.js';

let _spellsModule = null;
export function initShopSpellsRef(mod) { _spellsModule = mod; }

const shop = {
  active: false,
  type: null,
  name: '',
  mode: 'buy',       // 'buy' | 'sell'
  items: [],          // buy-mode items (shop inventory)
  sellItems: [],      // sell-mode items (player inventory)
  menuIndex: 0,
  message: null,
  messageTimer: 0,
};

const MESSAGE_MS = 1500;
const SELL_RATIO = 0.5;

export function getShopState() {
  return shop;
}

export function startShop(shopDef) {
  shop.active = true;
  shop.type = shopDef.type;
  shop.name = SHOP_TYPES[shopDef.type].name;
  shop.mode = 'buy';

  if (shopDef.type === 'spell_shop') {
    const player = getPlayer();
    const SPELLS = _spellsModule ? _spellsModule.SPELLS : {};
    shop.items = SHOP_TYPES[shopDef.type].inventory.map(id => {
      const spellDef = SPELLS[id];
      if (!spellDef) return null;
      const alreadyKnown = player.spells && player.spells.some(s => s.id === id);
      const levelLocked = player.level < spellDef.learnLevel;
      return {
        id,
        name: spellDef.name,
        cost: spellDef.cost || 0,
        desc: spellDef.desc,
        isSpell: true,
        alreadyKnown,
        levelLocked,
        learnLevel: spellDef.learnLevel,
      };
    }).filter(Boolean);
  } else {
    shop.items = SHOP_TYPES[shopDef.type].inventory.map(id => {
      const itemDef = ITEMS[id];
      return {
        id,
        name: itemDef.name,
        cost: itemDef.cost,
        desc: itemDef.desc,
      };
    });
  }

  refreshSellItems();
  shop.menuIndex = 0;
  shop.message = null;
  shop.messageTimer = 0;
}

function refreshSellItems() {
  const player = getPlayer();
  shop.sellItems = player.inventory.map(invItem => {
    const def = ITEMS[invItem.id];
    if (!def) return null;
    const sellPrice = Math.floor((def.cost || 0) * SELL_RATIO);
    return {
      id: invItem.id,
      name: def.name,
      desc: def.desc,
      qty: invItem.qty || 1,
      sellPrice,
      rarity: def.rarity || 'common',
    };
  }).filter(Boolean);
}

export function toggleShopMode() {
  // Spell shops don't have sell mode
  if (shop.type === 'spell_shop') return;

  shop.mode = shop.mode === 'buy' ? 'sell' : 'buy';
  shop.menuIndex = 0;
  shop.message = null;

  if (shop.mode === 'sell') {
    refreshSellItems();
  }
}

export function buyItem(index) {
  const shopItem = shop.items[index];
  if (!shopItem) return;

  const player = getPlayer();

  // Spell shop purchase
  if (shopItem.isSpell) {
    if (shopItem.alreadyKnown) {
      shop.message = 'Already learned!';
      shop.messageTimer = performance.now();
      return;
    }
    if (shopItem.levelLocked) {
      shop.message = `Need Lv ${shopItem.learnLevel}!`;
      shop.messageTimer = performance.now();
      return;
    }
    if (player.gold < shopItem.cost) {
      shop.message = 'Not enough gold!';
      shop.messageTimer = performance.now();
      return;
    }

    player.gold -= shopItem.cost;
    if (!player.spells) player.spells = [];
    player.spells.push({ id: shopItem.id, name: shopItem.name });
    shopItem.alreadyKnown = true;
    shop.message = `Learned ${shopItem.name}!`;
    shop.messageTimer = performance.now();
    return;
  }

  // Normal item purchase
  if (player.gold < shopItem.cost) {
    shop.message = 'Not enough gold!';
    shop.messageTimer = performance.now();
    return;
  }

  const itemDef = ITEMS[shopItem.id];
  if (!itemDef) return;

  player.gold -= shopItem.cost;
  addToInventory(player, itemDef);
  shop.message = `Got ${itemDef.name}!`;
  shop.messageTimer = performance.now();

  // Refresh sell list in case they switch
  refreshSellItems();
}

export function sellItem(index) {
  const sellEntry = shop.sellItems[index];
  if (!sellEntry) return;

  const player = getPlayer();

  if (sellEntry.sellPrice <= 0) {
    shop.message = "Can't sell that!";
    shop.messageTimer = performance.now();
    return;
  }

  // Check if item is currently equipped
  for (const equipped of Object.values(player.equipment)) {
    if (equipped && equipped.id === sellEntry.id) {
      shop.message = 'Unequip it first!';
      shop.messageTimer = performance.now();
      return;
    }
  }

  player.gold += sellEntry.sellPrice;
  removeFromInventory(player, sellEntry.id);
  shop.message = `Sold for ${sellEntry.sellPrice}G!`;
  shop.messageTimer = performance.now();

  // Refresh sell list
  refreshSellItems();

  // Adjust menu index if needed
  if (shop.sellItems.length === 0) {
    shop.menuIndex = 0;
  } else if (shop.menuIndex >= shop.sellItems.length) {
    shop.menuIndex = shop.sellItems.length - 1;
  }
}

export function updateShopMessage(now) {
  if (shop.message && now - shop.messageTimer >= MESSAGE_MS) {
    shop.message = null;
  }
}

export function endShop() {
  shop.active = false;
  shop.type = null;
  shop.mode = 'buy';
  shop.items = [];
  shop.sellItems = [];
  shop.message = null;
}
