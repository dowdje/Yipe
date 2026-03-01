// main.js — Game initialization and loop

import { GAME_STATES, TRANSITION_MS } from './config.js';
import { initRenderer, clear, drawTileGrid, drawPlayer, drawPlayerLerp, drawEntity, drawFade } from './engine/renderer.js';
import { initInput, consumeInput, setInputEnabled } from './engine/input.js';
import { loadTileDefs, getTileDefs, loadRoom, getCurrentRoom, isWalkable, getExit, getEntryPosition, getActiveShops } from './game/world.js';
import { getPlayer, setPlayerPos, tryMove, updateMovement, getMoveTween } from './game/player.js';
import { getActiveEnemies } from './game/enemies.js';
import { getCombat, startCombat, selectAction, updateCombatAnim, endCombat, getActions } from './game/combat.js';
import { startShop, getShopState, buyItem, updateShopMessage, endShop } from './game/shop.js';
import { drawHud } from './ui/hud.js';
import { renderCombat } from './ui/combat-ui.js';
import { renderShop } from './ui/shop-ui.js';
import { saveGame, loadSave } from './engine/save.js';

const START_ROOM = 'grymhold/town_1';

let state = GAME_STATES.OVERWORLD;
let transition = null; // { phase: 'out'|'in', start, targetRoom, fromDir }

async function init() {
  const canvas = document.getElementById('game');
  initRenderer(canvas);
  initInput(canvas);

  await loadTileDefs();

  // Check for saved game
  const save = loadSave();
  const roomId = save?.roomId || START_ROOM;
  const room = await loadRoom(roomId);

  if (save) {
    setPlayerPos(save.playerX, save.playerY);
  } else {
    setPlayerPos(room.playerStart.x, room.playerStart.y);
  }

  requestAnimationFrame(loop);
}

function loop(now) {
  requestAnimationFrame(loop);

  switch (state) {
    case GAME_STATES.OVERWORLD:
      updateOverworld(now);
      renderOverworld(now);
      break;
    case GAME_STATES.TRANSITION:
      updateTransition(now);
      renderTransition(now);
      break;
    case GAME_STATES.COMBAT:
      updateCombatState(now);
      renderCombatState(now);
      break;
    case GAME_STATES.SHOP:
      updateShopState(now);
      renderShopState();
      break;
  }
}

function updateOverworld(now) {
  updateMovement(now);

  const player = getPlayer();
  if (player.moving) return;

  const input = consumeInput();
  if (!input) return;

  const result = tryMove(input.dx, input.dy, isWalkable);

  if (result === 'moved') {
    // Save after each move
    const room = getCurrentRoom();
    // Save will use the destination position after tween completes
    setTimeout(() => {
      const pp = getPlayer();
      saveGame(room.id, pp.x, pp.y);
    }, 120);
  } else if (result && result.type === 'shop') {
    // Shop NPC collision — enter shop
    startShop(result.shop);
    state = GAME_STATES.SHOP;
    setInputEnabled(false);
    setTimeout(() => setInputEnabled(true), 200);
  } else if (result && result.type === 'combat') {
    // Enemy collision — start combat
    startCombat(result.enemy);
    state = GAME_STATES.COMBAT;
    setInputEnabled(false);
    // Re-enable input for combat menu after brief delay
    setTimeout(() => setInputEnabled(true), 300);
  } else if (result === 'left' || result === 'right' || result === 'up' || result === 'down') {
    const targetRoom = getExit(result);
    if (targetRoom) {
      startTransition(targetRoom, result);
    }
  }
}

function renderOverworld(now) {
  const room = getCurrentRoom();
  if (!room) return;

  clear();
  drawTileGrid(room.tiles, getTileDefs());

  // Draw shop NPCs
  const shops = getActiveShops();
  for (const shop of shops) {
    drawEntity(shop.x, shop.y, shop.color);
  }

  // Draw enemies
  const enemies = getActiveEnemies();
  for (const enemy of enemies) {
    drawEntity(enemy.x, enemy.y, enemy.color);
  }

  const tween = getMoveTween(now);
  if (tween) {
    drawPlayerLerp(tween.fromX, tween.fromY, tween.toX, tween.toY, tween.t);
  } else {
    const p = getPlayer();
    drawPlayer(p.x, p.y);
  }

  const p = getPlayer();
  drawHud(p, room.name);
}

function startTransition(targetRoom, fromDir) {
  state = GAME_STATES.TRANSITION;
  setInputEnabled(false);
  transition = {
    phase: 'out',
    start: performance.now(),
    targetRoom,
    fromDir,
  };
}

async function updateTransition(now) {
  if (!transition) return;

  const elapsed = now - transition.start;

  if (transition.phase === 'out' && elapsed >= TRANSITION_MS) {
    // Load new room
    await loadRoom(transition.targetRoom);
    const pos = getEntryPosition(transition.fromDir);
    setPlayerPos(pos.x, pos.y);

    // Save
    saveGame(transition.targetRoom, pos.x, pos.y);

    // Start fade in
    transition.phase = 'in';
    transition.start = performance.now();
  }

  if (transition.phase === 'in' && elapsed >= TRANSITION_MS) {
    transition = null;
    state = GAME_STATES.OVERWORLD;
    setInputEnabled(true);
  }
}

function renderTransition(now) {
  const room = getCurrentRoom();
  if (!room) return;

  clear();
  drawTileGrid(room.tiles, getTileDefs());

  // Draw shop NPCs
  const tShops = getActiveShops();
  for (const shop of tShops) {
    drawEntity(shop.x, shop.y, shop.color);
  }

  // Draw enemies
  const enemies = getActiveEnemies();
  for (const enemy of enemies) {
    drawEntity(enemy.x, enemy.y, enemy.color);
  }

  const p = getPlayer();
  drawPlayer(p.x, p.y);
  drawHud(p, room.name);

  const elapsed = now - transition.start;
  let alpha;

  if (transition.phase === 'out') {
    alpha = Math.min(elapsed / TRANSITION_MS, 1);
  } else {
    alpha = 1 - Math.min(elapsed / TRANSITION_MS, 1);
  }

  drawFade(alpha);
}

// --- Combat state ---

function updateCombatState(now) {
  const combat = getCombat();
  updateCombatAnim(now);

  const input = consumeInput();
  if (!input) return;

  const actions = getActions();

  if (combat.result) {
    // Any input after result → exit combat
    if (input.dir === 'up' || input.dir === 'down') return; // only Enter/Space via dx=0,dy=0 would work, but let's accept any
    exitCombat();
    return;
  }

  if (combat.turn !== 'player' || combat.animating) return;

  // Menu navigation
  if (input.dy === -1) {
    // Up
    combat.menuIndex = (combat.menuIndex - 1 + actions.length) % actions.length;
  } else if (input.dy === 1) {
    // Down
    combat.menuIndex = (combat.menuIndex + 1) % actions.length;
  }
}

function renderCombatState(now) {
  const player = getPlayer();
  renderCombat(now, player);
}

function exitCombat() {
  const combat = getCombat();
  const result = combat.result;

  endCombat();

  if (result === 'defeat') {
    // Death penalty: lose 50% gold, respawn at town_1
    const player = getPlayer();
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    // Gold loss already calculated in combat.js and shown in log
    startTransition(START_ROOM, 'up');
  } else {
    state = GAME_STATES.OVERWORLD;
    setInputEnabled(true);
  }
}

// --- Shop state ---

function updateShopState(now) {
  updateShopMessage(now);

  const input = consumeInput();
  if (!input) return;

  const shop = getShopState();

  // Up/down to browse
  if (input.dy === -1) {
    shop.menuIndex = (shop.menuIndex - 1 + shop.items.length) % shop.items.length;
  } else if (input.dy === 1) {
    shop.menuIndex = (shop.menuIndex + 1) % shop.items.length;
  }
}

function renderShopState() {
  renderShop();
}

// Listen for Enter/Space/Escape to handle combat and shop actions
function initExtraInput() {
  window.addEventListener('keydown', (e) => {
    if (state === GAME_STATES.COMBAT) {
      const combat = getCombat();

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (combat.result) {
          exitCombat();
        } else if (combat.turn === 'player' && !combat.animating) {
          selectAction(combat.menuIndex);
        }
      }
    } else if (state === GAME_STATES.SHOP) {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        endShop();
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const shop = getShopState();
        buyItem(shop.menuIndex);
      }
    }
  });
}

initExtraInput();
init();
