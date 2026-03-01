// shop.js — Shop state and buy logic

import { SHOP_TYPES } from '../config.js';
import { getPlayer } from './player.js';

const SHOP_ITEMS = {
  hp_potion: {
    name: 'HP Potion',
    cost: 8,
    desc: 'Restore 10 HP',
    apply(player) {
      const healed = Math.min(10, player.maxHp - player.hp);
      player.hp += healed;
      return healed > 0 ? `Restored ${healed} HP!` : 'HP already full!';
    },
  },
  mp_potion: {
    name: 'MP Potion',
    cost: 8,
    desc: 'Restore 5 MP',
    apply(player) {
      const restored = Math.min(5, player.maxMp - player.mp);
      player.mp += restored;
      return restored > 0 ? `Restored ${restored} MP!` : 'MP already full!';
    },
  },
  atk_ring: {
    name: 'ATK Ring',
    cost: 25,
    desc: 'Permanent +1 ATK',
    apply(player) {
      player.atk += 1;
      return 'ATK increased by 1!';
    },
  },
  def_shield: {
    name: 'DEF Shield',
    cost: 25,
    desc: 'Permanent +1 DEF',
    apply(player) {
      player.def += 1;
      return 'DEF increased by 1!';
    },
  },
  spd_boots: {
    name: 'SPD Boots',
    cost: 25,
    desc: 'Permanent +1 SPD',
    apply(player) {
      player.spd += 1;
      return 'SPD increased by 1!';
    },
  },
};

const shop = {
  active: false,
  type: null,
  name: '',
  items: [],
  menuIndex: 0,
  message: null,
  messageTimer: 0,
};

const MESSAGE_MS = 1500;

export function getShopState() {
  return shop;
}

export function startShop(shopDef) {
  shop.active = true;
  shop.type = shopDef.type;
  shop.name = SHOP_TYPES[shopDef.type].name;
  shop.items = SHOP_TYPES[shopDef.type].inventory.map(id => ({
    id,
    ...SHOP_ITEMS[id],
  }));
  shop.menuIndex = 0;
  shop.message = null;
  shop.messageTimer = 0;
}

export function buyItem(index) {
  const item = shop.items[index];
  if (!item) return;

  const player = getPlayer();
  if (player.gold < item.cost) {
    shop.message = 'Not enough gold!';
    shop.messageTimer = performance.now();
    return;
  }

  player.gold -= item.cost;
  const result = item.apply(player);
  shop.message = result;
  shop.messageTimer = performance.now();
}

export function updateShopMessage(now) {
  if (shop.message && now - shop.messageTimer >= MESSAGE_MS) {
    shop.message = null;
  }
}

export function endShop() {
  shop.active = false;
  shop.type = null;
  shop.items = [];
  shop.message = null;
}
