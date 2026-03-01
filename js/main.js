// main.js — Game initialization and loop

import { GAME_STATES, TRANSITION_MS, xpForLevel, ENEMY_TYPES, GRID_COLS, GRID_ROWS } from './config.js';
import { initRenderer, clear, drawTileGrid, drawPlayer, drawPlayerLerp, drawEntity, drawBossEntity, drawFade, ENEMY_SPRITE_MAP, SHOP_SPRITE_MAP } from './engine/renderer.js';
import { initInput, consumeInput, setInputEnabled } from './engine/input.js';
import { loadTileDefs, getTileDefs, loadRoom, getCurrentRoom, isWalkable, getExit, getEntryPosition, getActiveShops, getActiveNpcs, getActiveCampfires, isSafeRoom, initWorldPlayerRef, getShopAt, getNpcAt, getCampfireAt, getChestAt } from './game/world.js';
import { getPlayer, setPlayerPos, tryMove, updateMovement, getMoveTween, equipItem, unequipSlot, removeFromInventory, initClass, grantAbilitiesUpToLevel, addToInventory } from './game/player.js';
import { getActiveEnemies, getEnemyAt, spawnRandomEnemy, moveRoamingEnemies, getRoamingEnemyCount, RANDOM_SPAWN_CHANCE, MAX_RANDOM_ENEMIES, MIN_SPAWN_DISTANCE } from './game/enemies.js';
import { getCombat, startCombat, selectAction, updateCombatAnim, endCombat, getActions, getTopActions, closeSubMenu, navigateSubMenu, initItemsRef, initSpellsRef, initPlayerRef, initBossAiRef, cycleTarget } from './game/combat.js';
import * as BOSS_AI from './game/boss-ai.js';
import { startShop, getShopState, buyItem, sellItem, toggleShopMode, updateShopMessage, endShop, initShopSpellsRef } from './game/shop.js';
import { drawHud } from './ui/hud.js';
import { renderCombat } from './ui/combat-ui.js';
import { renderShop } from './ui/shop-ui.js';
import { renderCharacter, getCharMenu, resetCharMenu, getEquipableItemsForSlot, getConsumableItems, getPanelCount, initCharItemsRef } from './ui/character-ui.js';
import { renderDeath, applyDeathPenalty } from './ui/death-ui.js';
import { getChestPopup, showChestLoot, hideChestLoot, renderChestPopup } from './ui/chest-ui.js';
import { getActiveChests, openChest, setOpenedChests } from './game/chests.js';
import { saveGame, loadSave, clearSave } from './engine/save.js';
import * as ITEMS_MODULE from './data/items.js';
import * as PLAYER_MODULE from './game/player.js';
import { CLASSES } from './data/classes.js';
import { renderClassSelect, getClassSelectIndex, setClassSelectIndex, getSelectedClassId } from './ui/class-select-ui.js';
import { initTitle, renderTitle, getTitleMenuIndex, setTitleMenuIndex, getSelectedTitleOption } from './ui/title-ui.js';
import { sfxSelect, sfxNavigate } from './engine/audio.js';
import { initEnding, renderEnding, advanceEnding } from './ui/ending-ui.js';
// Phase 5-6 imports
import { NPC_DEFS } from './data/npcs.js';
import { getDialogueState, startDialogue, endDialogue, advanceDialogue, navigateDialogueChoice, renderDialogue } from './ui/dialogue-ui.js';
import { addDanger, reduceDanger, resetDanger } from './game/danger.js';
import { getKnownRecipes, canCraft, craft } from './game/crafting.js';
import { openCrafting, closeCrafting, getCraftState, navigateCraft, setCraftMessage, renderCrafting } from './ui/crafting-ui.js';
import { getAvailablePerks, applyPerk, isPerkLevel } from './game/perks.js';
import { openPerkSelection, closePerkSelection, getPerkState, navigatePerk, selectPerk, cancelPerkConfirm, renderPerkSelection } from './ui/perk-ui.js';
import { openCompendium, closeCompendium, getCompendiumState, navigateCompendium, renderCompendium } from './ui/compendium-ui.js';
import { openControls, closeControls, navigateControls, renderControls } from './ui/controls-ui.js';
import { startQuest, checkObjective, isQuestActive, isQuestComplete, isQuestDone, completeQuest } from './game/quests.js';
import { openDebug, closeDebug, getDebugState, navigateDebug, getSelectedDebugOption, setDebugMessage, renderDebug } from './ui/debug-ui.js';
import { MATERIAL_DEFS } from './data/materials.js';
import { applyExpGain } from './game/leveling.js';
import { openJournal, closeJournal, getJournalState, navigateJournal, renderJournal } from './ui/journal-ui.js';

const START_ROOM = 'grymhold/town_1';

let state = GAME_STATES.TITLE;
let transition = null; // { phase: 'out'|'in', start, targetRoom, fromDir }
let saveLoaded = false; // tracks whether a save has been restored into player state
let previousRoomId = null; // tracks last room for zone-change danger reduction

async function init() {
  const canvas = document.getElementById('game');
  initRenderer(canvas);
  initInput(canvas);

  // Wire cross-module references
  initItemsRef(ITEMS_MODULE);
  initPlayerRef(PLAYER_MODULE);
  initCharItemsRef(ITEMS_MODULE);
  initWorldPlayerRef(() => getPlayer().level);
  initBossAiRef(BOSS_AI);

  // Dynamically load spells module if available
  try {
    const spellsModule = await import('./data/spells.js');
    initSpellsRef(spellsModule);
    initShopSpellsRef(spellsModule);
    // Connect real ability tables to leveling (spells are now bought from Wizard)
    const { setAbilityTable } = await import('./game/leveling.js');
    setAbilityTable(spellsModule.ABILITIES);
  } catch (e) {
    // Spells module not yet created — stubs will be used
  }

  await loadTileDefs();

  // Show title screen first — room loading happens on menu selection
  initTitle();
  requestAnimationFrame(loop);
}

/** Load a saved game into player state and room */
async function loadSavedGame() {
  const save = loadSave();
  if (!save) return false;

  // Restore opened chests before loading rooms
  if (save.chestsOpened) {
    setOpenedChests(save.chestsOpened);
  }

  const room = await loadRoom(save.roomId || START_ROOM);
  previousRoomId = save.roomId || START_ROOM;
  setPlayerPos(save.playerX, save.playerY);

  if (save.playerState) {
    const player = getPlayer();
    const ps = save.playerState;
    player.hp = ps.hp;
    player.maxHp = ps.maxHp;
    player.mp = ps.mp;
    player.maxMp = ps.maxMp;
    player.atk = ps.atk;
    player.def = ps.def;
    player.spd = ps.spd;
    player.lck = ps.lck;
    player.gold = ps.gold;
    player.level = ps.level;
    player.exp = ps.exp;
    player.inventory = ps.inventory || [];
    player.spells = ps.spells || [];
    player.abilities = ps.abilities || [];
    player.classId = ps.classId || null;

    // INT migration for old saves
    if (ps.int !== undefined) {
      player.int = ps.int;
    } else {
      if (ps.classId === 'hacker') {
        player.int = 8 + (ps.level - 1) * 5;
      } else if (ps.classId === 'fixer') {
        player.int = 3 + (ps.level - 1) * 1;
      } else if (ps.classId === 'bruiser') {
        player.int = 2;
      } else {
        player.int = 2;
      }
    }

    // Phase 5-6 fields
    player.materials = ps.materials || {};
    player.questFlags = ps.questFlags || {};
    player.activeQuests = ps.activeQuests || [];
    player.completedQuests = ps.completedQuests || [];
    player.questProgress = ps.questProgress || {};
    player.perks = ps.perks || [];
    player.compendium = ps.compendium || {};
    player.dangerMeter = ps.dangerMeter || 0;
    player.knownRecipes = ps.knownRecipes || [];
    player.lastSafeRoom = ps.lastSafeRoom || null;
    player.difficulty = ps.difficulty || 1.0;
    player.playtime = ps.playtime || 0;
    player.bossesDefeated = ps.bossesDefeated || [];
    // Restore equipment — rehydrate from item IDs
    if (ps.equipment) {
      for (const [slot, ref] of Object.entries(ps.equipment)) {
        if (ref && ref.id && ITEMS_MODULE.ITEMS[ref.id]) {
          player.equipment[slot] = ITEMS_MODULE.ITEMS[ref.id];
        } else {
          player.equipment[slot] = null;
        }
      }
    }
    // If old save without class, prompt class selection
    if (!player.classId) {
      return false; // needs class select
    }
  }
  return true;
}

/** Start a new game — load start room and go to class select */
async function startNewGame() {
  clearSave();
  const { resetStats } = PLAYER_MODULE;
  resetStats();
  setOpenedChests([]);
  const room = await loadRoom(START_ROOM);
  previousRoomId = START_ROOM;
  setPlayerPos(room.playerStart.x, room.playerStart.y);
}

function loop(now) {
  requestAnimationFrame(loop);

  switch (state) {
    case GAME_STATES.TITLE:
      updateTitleState(now);
      renderTitle(now);
      break;
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
    case GAME_STATES.MENU:
      renderMenuState();
      break;
    case GAME_STATES.DEATH:
      renderDeathState();
      break;
    case GAME_STATES.CLASS_SELECT:
      updateClassSelectState();
      renderClassSelect();
      break;
    case GAME_STATES.DIALOGUE:
      renderOverworld(now);
      renderDialogue(now);
      break;
    case GAME_STATES.CRAFTING:
      renderCrafting(getPlayer());
      break;
    case GAME_STATES.PERK:
      renderPerkSelection();
      break;
    case GAME_STATES.COMPENDIUM:
      renderCompendium(getPlayer());
      break;
    case GAME_STATES.CONTROLS:
      renderControls();
      break;
    case GAME_STATES.JOURNAL:
      renderJournal(getPlayer());
      break;
    case GAME_STATES.DEBUG:
      renderDebug();
      break;
    case GAME_STATES.ENDING:
      renderEnding(now);
      break;
  }
}

function updateTitleState(now) {
  const input = consumeInput();
  if (!input) return;
  // Navigation handled in keydown listener
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
      saveGame(room.id, pp.x, pp.y, pp);
    }, 120);

    // Roaming enemy logic (non-safe rooms only)
    if (!isSafeRoom()) {
      // Helper: returns any blocking entity at (x,y) excluding player
      const entityAt = (x, y) =>
        getEnemyAt(x, y) || getShopAt(x, y) || getNpcAt(x, y) || getCampfireAt(x, y) || getChestAt(x, y);

      // Move existing roaming enemies toward player
      const chaser = moveRoamingEnemies(player.x, player.y, isWalkable, entityAt);
      if (chaser) {
        // A roaming enemy reached the player — start combat
        startCombat(chaser);
        state = GAME_STATES.COMBAT;
        setInputEnabled(false);
        setTimeout(() => setInputEnabled(true), 300);
        return;
      }

      // Roll for a new random spawn
      if (Math.random() < RANDOM_SPAWN_CHANCE && getRoamingEnemyCount() < MAX_RANDOM_ENEMIES) {
        const exits = room.exits || {};
        const validTiles = [];
        for (let ty = 0; ty < GRID_ROWS; ty++) {
          for (let tx = 0; tx < GRID_COLS; tx++) {
            // Must be walkable
            if (!isWalkable(tx, ty)) continue;
            // Must be far enough from player
            const dist = Math.abs(tx - player.x) + Math.abs(ty - player.y);
            if (dist < MIN_SPAWN_DISTANCE) continue;
            // Must not be occupied
            if (entityAt(tx, ty)) continue;
            // Must not be on an exit edge
            if ((tx === 0 && exits.left) || (tx === GRID_COLS - 1 && exits.right) ||
                (ty === 0 && exits.up) || (ty === GRID_ROWS - 1 && exits.down)) continue;
            validTiles.push({ x: tx, y: ty });
          }
        }
        if (validTiles.length > 0) {
          const tile = validTiles[Math.floor(Math.random() * validTiles.length)];
          spawnRandomEnemy(player.level, tile.x, tile.y);
        }
      }
    }
  } else if (result && result.type === 'shop') {
    // Shop NPC collision — enter shop
    startShop(result.shop);
    state = GAME_STATES.SHOP;
    setInputEnabled(false);
    setTimeout(() => setInputEnabled(true), 200);
  } else if (result && result.type === 'chest') {
    // Chest collision — open it
    handleChestOpen(result.chest);
  } else if (result && result.type === 'npc') {
    // NPC collision — start dialogue
    handleNpcInteraction(result.npc);
  } else if (result && result.type === 'campfire') {
    // Campfire — rest, reduce danger, heal
    handleCampfireRest(result.campfire);
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
    drawEntity(shop.x, shop.y, shop.color, 6, SHOP_SPRITE_MAP[shop.type]);
  }

  // Draw chests (unopened only — opened ones are just floor tiles)
  const chests = getActiveChests();
  for (const chest of chests) {
    if (!chest.opened) {
      drawEntity(chest.x, chest.y, '#CC8833', 4, 'tile_chest');
    }
  }

  // Draw NPCs
  const npcs = getActiveNpcs();
  for (const npc of npcs) {
    drawEntity(npc.x, npc.y, '#FFD700', 6, null);
  }

  // Draw campfires
  const campfires = getActiveCampfires();
  for (const cf of campfires) {
    drawEntity(cf.x, cf.y, '#FF6633', 5, null);
  }

  // Draw enemies
  const enemies = getActiveEnemies();
  for (const enemy of enemies) {
    if (enemy.size === 2) {
      drawBossEntity(enemy.x, enemy.y, enemy.color, ENEMY_SPRITE_MAP[enemy.type]);
    } else {
      drawEntity(enemy.x, enemy.y, enemy.color, 6, ENEMY_SPRITE_MAP[enemy.type]);
    }
  }

  const tween = getMoveTween(now);
  if (tween) {
    const pl = getPlayer();
    drawPlayerLerp(tween.fromX, tween.fromY, tween.toX, tween.toY, tween.t, pl.classId);
  } else {
    const p = getPlayer();
    drawPlayer(p.x, p.y, p.classId);
  }

  const p = getPlayer();
  drawHud(p, room.name);

  // Chest loot popup overlay
  const popup = getChestPopup();
  if (popup.active) {
    renderChestPopup();
  }
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

    // Danger: increment for non-safe rooms, reset for safe rooms
    const p = getPlayer();
    if (isSafeRoom()) {
      resetDanger(p);
      p.lastSafeRoom = transition.targetRoom;
    } else {
      addDanger(p, 1);
    }

    // Reduce danger when changing zones (e.g., leaving sewers → sprawl)
    const prevArea = previousRoomId ? previousRoomId.split('/')[0] : null;
    const newArea = transition.targetRoom.split('/')[0];
    if (prevArea && newArea && prevArea !== newArea) {
      reduceDanger(p, 20);
    }
    previousRoomId = transition.targetRoom;

    // Save
    saveGame(transition.targetRoom, pos.x, pos.y, p);

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
    drawEntity(shop.x, shop.y, shop.color, 6, SHOP_SPRITE_MAP[shop.type]);
  }

  // Draw NPCs
  const tNpcs = getActiveNpcs();
  for (const npc of tNpcs) {
    drawEntity(npc.x, npc.y, '#FFD700', 6, null);
  }

  // Draw campfires
  const tCampfires = getActiveCampfires();
  for (const cf of tCampfires) {
    drawEntity(cf.x, cf.y, '#FF6633', 5, null);
  }

  // Draw enemies
  const enemies = getActiveEnemies();
  for (const enemy of enemies) {
    if (enemy.size === 2) {
      drawBossEntity(enemy.x, enemy.y, enemy.color, ENEMY_SPRITE_MAP[enemy.type]);
    } else {
      drawEntity(enemy.x, enemy.y, enemy.color, 6, ENEMY_SPRITE_MAP[enemy.type]);
    }
  }

  const p = getPlayer();
  drawPlayer(p.x, p.y, p.classId);
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

  if (combat.result) {
    // Any input after result → exit combat
    if (input.dir === 'up' || input.dir === 'down') return;
    exitCombat();
    return;
  }

  if (combat.turn !== 'player' || combat.animating) return;

  const actions = getActions();

  // Left/right for target cycling (boss fights with minions)
  if (!combat.subMenu && combat.minions && combat.minions.length > 0) {
    if (input.dx === -1) {
      cycleTarget(-1);
      return;
    } else if (input.dx === 1) {
      cycleTarget(1);
      return;
    }
  }

  // Menu navigation
  if (combat.subMenu) {
    if (input.dy === -1) {
      navigateSubMenu(-1);
    } else if (input.dy === 1) {
      navigateSubMenu(1);
    }
  } else {
    if (input.dy === -1) {
      combat.menuIndex = (combat.menuIndex - 1 + actions.length) % actions.length;
    } else if (input.dy === 1) {
      combat.menuIndex = (combat.menuIndex + 1) % actions.length;
    }
  }
}

function renderCombatState(now) {
  const player = getPlayer();
  renderCombat(now, player);
}

function exitCombat() {
  const combat = getCombat();
  const result = combat.result;
  const levelUpResults = combat.levelUpResults;
  const defeatedBossId = combat.enemy?.bossId || null;

  endCombat();

  if (result === 'defeat') {
    // Enter death screen instead of immediate respawn
    state = GAME_STATES.DEATH;
    setInputEnabled(false);
    setTimeout(() => setInputEnabled(true), 500);
  } else {
    // Check for boss weapon reward (Sewer King)
    const player = getPlayer();
    if (defeatedBossId === 'sewer_king' && !player.questFlags?.sewer_king_weapon_chosen) {
      if (!player.questFlags) player.questFlags = {};
      startDialogue('Sewer King\'s Hoard', 'Among the Sewer King\'s spoils, you find three elemental weapons. Choose one:', [
        { label: 'Welding Torch (Fire)', action: 'reward_weapon', weaponId: 'welding_torch' },
        { label: 'Cryo Spray (Ice)', action: 'reward_weapon', weaponId: 'cryo_spray' },
        { label: 'Taser (Lightning)', action: 'reward_weapon', weaponId: 'taser' },
      ], (choice) => {
        if (choice && choice.action === 'reward_weapon') {
          const weaponDef = ITEMS_MODULE.ITEMS[choice.weaponId];
          if (weaponDef) {
            addToInventory(player, weaponDef);
            player.questFlags.sewer_king_weapon_chosen = true;
            startDialogue('Sewer King\'s Hoard', `You take the ${weaponDef.name}!`, null, () => {
              state = GAME_STATES.OVERWORLD;
              setInputEnabled(true);
              saveAfterDelay();
            });
            state = GAME_STATES.DIALOGUE;
          }
        }
      });
      state = GAME_STATES.DIALOGUE;
      setInputEnabled(false);
      setTimeout(() => setInputEnabled(true), 200);
      return;
    }

    let perkShown = false;
    if (levelUpResults && levelUpResults.length > 0) {
      for (const lr of levelUpResults) {
        if (isPerkLevel(lr.newLevel)) {
          const options = getAvailablePerks(lr.newLevel, player.perks || [], player.classId);
          if (options && options.length > 0) {
            openPerkSelection(options, (selected) => {
              applyPerk(selected.id, player);
              state = GAME_STATES.OVERWORLD;
              setInputEnabled(true);
              saveAfterDelay();
            });
            state = GAME_STATES.PERK;
            setInputEnabled(true);
            perkShown = true;
            break;
          }
        }
      }
    }
    if (!perkShown) {
      state = GAME_STATES.OVERWORLD;
      setInputEnabled(true);
    }
    saveAfterDelay();
  }
}

// --- Death state ---

function renderDeathState() {
  renderDeath();
}

function revivePlayer() {
  applyDeathPenalty();
  // Send to underworld instead of instant respawn
  startTransition('underworld/gate', 'up');
}

// --- Chest interaction ---

function handleChestOpen(chest) {
  const player = getPlayer();
  const lootResults = openChest(chest);

  if (!lootResults) return;

  // Add loot to player
  for (const r of lootResults) {
    if (r.gold) {
      player.gold += r.gold;
    } else {
      const { addToInventory } = PLAYER_MODULE;
      addToInventory(player, r.item, r.qty);
    }
  }

  // Show popup
  showChestLoot(lootResults);
  setInputEnabled(false);

  // Save
  const room = getCurrentRoom();
  setTimeout(() => {
    saveGame(room.id, player.x, player.y, player);
  }, 50);
}

// --- NPC interaction ---

function handleNpcInteraction(npc) {
  const player = getPlayer();
  const npcDef = NPC_DEFS[npc.npcId];
  if (!npcDef) return;

  // Determine which dialogue to use based on quest state
  let dialogueKey = 'default';
  if (npc.npcId === 'jasmine') {
    if (isQuestDone(player, 'jasmine_samples')) dialogueKey = 'done';
    else if (isQuestComplete(player, 'jasmine_samples')) dialogueKey = 'quest_complete';
    else if (isQuestActive(player, 'jasmine_samples')) dialogueKey = 'quest_active';
  } else if (npc.npcId === 'destiny') {
    if (isQuestDone(player, 'destiny_rescue')) dialogueKey = 'done';
    else if (player.questFlags?.destiny_rescued) dialogueKey = 'rescued';
  } else if (npc.npcId === 'crystal') {
    if (isQuestDone(player, 'crystal_keycard')) dialogueKey = 'done';
    else if (isQuestComplete(player, 'crystal_keycard')) dialogueKey = 'quest_complete';
    else if (isQuestActive(player, 'crystal_keycard')) dialogueKey = 'quest_active';
  } else if (npc.npcId === 'mercedes') {
    if (player.questFlags?.mercedes_rewarded) dialogueKey = 'done';
    else if (player.bossesDefeated?.includes('the_alpha')) dialogueKey = 'boss_defeated';
  } else if (npc.npcId === 'tiffany') {
    if (isQuestDone(player, 'tiffany_antidote')) dialogueKey = 'done';
    else if (isQuestComplete(player, 'tiffany_antidote')) dialogueKey = 'quest_complete';
    else if (isQuestActive(player, 'tiffany_antidote')) dialogueKey = 'quest_active';
  } else if (npc.npcId === 'angelica') {
    if (player.questFlags?.angelica_rescued) dialogueKey = 'done';
  } else if (npc.npcId === 'brianna') {
    if (player.questFlags?.brianna_met) dialogueKey = 'done';
  } else if (npc.npcId === 'valentina') {
    if (player.questFlags?.valentina_freed) dialogueKey = 'done';
  } else if (npc.npcId === 'mayor') {
    const driveCount = (player.inventory || []).filter(i => i.id && i.id.startsWith('nft_drive_')).length;
    if (driveCount >= 5 && player.questFlags?.boss_the_consultant_defeated) {
      // Trigger ending sequence
      const princesses = countRescuedPrincesses(player);
      initEnding(princesses);
      state = GAME_STATES.ENDING;
      setInputEnabled(true);
      return;
    } else if (driveCount > 0) dialogueKey = 'quest_active';
  } else if (npc.npcId === 'gus') {
    const recipes = getKnownRecipes(player);
    if (recipes.length === 0) dialogueKey = 'no_recipes';
  }

  const dialogue = npcDef.dialogue[dialogueKey] || npcDef.dialogue.default;

  startDialogue(npcDef.name, dialogue.text, dialogue.choices, (choice) => {
    handleDialogueChoice(npc, npcDef, dialogue, choice);
  });

  state = GAME_STATES.DIALOGUE;
  setInputEnabled(false);
  setTimeout(() => setInputEnabled(true), 200);
}

function handleDialogueChoice(npc, npcDef, dialogue, choice) {
  const player = getPlayer();

  if (!choice || choice.action === 'close') {
    // Give reward if dialogue has one
    if (dialogue.reward) {
      if (dialogue.reward.gold) player.gold += dialogue.reward.gold;
      if (!player.questFlags) player.questFlags = {};
      // Mark quest/flag as done after giving reward
      if (npc.npcId === 'jasmine') completeQuest(player, 'jasmine_samples');
      else if (npc.npcId === 'destiny') player.questFlags.destiny_rescued = true;
      else if (npc.npcId === 'crystal') completeQuest(player, 'crystal_keycard');
      else if (npc.npcId === 'mercedes') player.questFlags.mercedes_rewarded = true;
      else if (npc.npcId === 'tiffany') completeQuest(player, 'tiffany_antidote');
      else if (npc.npcId === 'brianna') player.questFlags.brianna_met = true;
      else if (npc.npcId === 'valentina') player.questFlags.valentina_freed = true;
    }
    state = GAME_STATES.OVERWORLD;
    setInputEnabled(true);
    saveAfterDelay();
    return;
  }

  if (choice.action === 'heal') {
    // Innkeeper: full heal
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    startDialogue('Innkeeper', 'You feel fully rested. HP and MP restored!', null, () => {
      state = GAME_STATES.OVERWORLD;
      setInputEnabled(true);
      saveAfterDelay();
    });
    state = GAME_STATES.DIALOGUE;
    return;
  }

  if (choice.action === 'openShop') {
    const shopType = choice.shopType || 'gear_shop';
    startShop(shopType);
    state = GAME_STATES.SHOP;
    setInputEnabled(false);
    setTimeout(() => setInputEnabled(true), 200);
    return;
  }

  if (choice.action === 'startFight') {
    // Spawn a specific enemy for an NPC-triggered fight
    const enemyDef = ENEMY_TYPES[choice.target];
    if (enemyDef) {
      const enemy = {
        ...enemyDef,
        type: choice.target,
        hp: enemyDef.hp,
        maxHp: enemyDef.hp,
      };
      startCombat(enemy);
      state = GAME_STATES.COMBAT;
      setInputEnabled(false);
      setTimeout(() => setInputEnabled(true), 300);
    } else {
      state = GAME_STATES.OVERWORLD;
      setInputEnabled(true);
    }
    return;
  }

  if (choice.action === 'openCraft') {
    const recipes = getKnownRecipes(player);
    openCrafting(recipes);
    state = GAME_STATES.CRAFTING;
    setInputEnabled(true);
    return;
  }

  if (choice.action === 'startQuest') {
    startQuest(player, choice.questId);
    state = GAME_STATES.OVERWORLD;
    setInputEnabled(true);
    saveAfterDelay();
    return;
  }

  if (choice.action === 'payGold') {
    if (player.gold >= choice.amount) {
      player.gold -= choice.amount;
      if (!player.questFlags) player.questFlags = {};
      // Set rescue flag based on NPC
      if (npc.npcId === 'destiny') player.questFlags.destiny_rescued = true;
      if (npc.npcId === 'angelica') player.questFlags.angelica_rescued = true;
      // Show reward dialogue
      const rewDialogue = npcDef.dialogue.rescued;
      if (rewDialogue) {
        startDialogue(npcDef.name, rewDialogue.text, rewDialogue.choices, () => {
          if (rewDialogue.reward?.gold) player.gold += rewDialogue.reward.gold;
          state = GAME_STATES.OVERWORLD;
          setInputEnabled(true);
          saveAfterDelay();
        });
        state = GAME_STATES.DIALOGUE;
      } else {
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
        saveAfterDelay();
      }
    } else {
      startDialogue(npcDef.name, "You don't have enough gold.", null, () => {
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      });
      state = GAME_STATES.DIALOGUE;
    }
    return;
  }

  if (choice.action === 'payDeathFee') {
    const fee = player.level * 10;
    if (player.gold >= fee) {
      player.gold -= fee;
      reviveFromUnderworldFlow();
    } else {
      startDialogue(npcDef.name, "No gold? Fight me or grind the ghost interns.", npcDef.dialogue.cant_pay?.choices || null, (c) => {
        handleDialogueChoice(npc, npcDef, npcDef.dialogue.cant_pay || {}, c);
      });
      state = GAME_STATES.DIALOGUE;
    }
    return;
  }

  // Default: return to overworld
  state = GAME_STATES.OVERWORLD;
  setInputEnabled(true);
}

function handleCampfireRest(campfire) {
  const player = getPlayer();
  // Heal 50% HP/MP
  player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.5));
  player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * 0.5));
  // Reduce danger by 15
  reduceDanger(player, 15);

  // Show rest message via dialogue
  startDialogue('Campfire', 'You rest by the fire. HP and MP restored. Danger reduced.', null, () => {
    state = GAME_STATES.OVERWORLD;
    setInputEnabled(true);
    saveAfterDelay();
  });
  state = GAME_STATES.DIALOGUE;
  setInputEnabled(false);
  setTimeout(() => setInputEnabled(true), 200);
}

function reviveFromUnderworldFlow() {
  const player = getPlayer();
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  resetDanger(player);
  const returnRoom = player.lastSafeRoom || START_ROOM;
  startTransition(returnRoom, 'up');
}

// --- Debug/cheat ---

function applyDebugOption() {
  const opt = getSelectedDebugOption();
  const player = getPlayer();

  switch (opt.id) {
    case 'level1':
      forceLevel(player, 1);
      setDebugMessage(`Level ${player.level}!`);
      break;
    case 'level5':
      forceLevel(player, 5);
      setDebugMessage(`Level ${player.level}!`);
      break;
    case 'level10':
      forceLevel(player, 10);
      setDebugMessage(`Level ${player.level}!`);
      break;
    case 'gold100':
      player.gold += 100;
      setDebugMessage(`Gold: ${player.gold}`);
      break;
    case 'gold1000':
      player.gold += 1000;
      setDebugMessage(`Gold: ${player.gold}`);
      break;
    case 'fullheal':
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      setDebugMessage('Fully healed!');
      break;
    case 'maxstats':
      player.atk += 10;
      player.def += 10;
      player.spd += 10;
      player.lck += 10;
      player.int = (player.int || 2) + 10;
      player.maxHp += 50;
      player.hp += 50;
      player.maxMp += 30;
      player.mp += 30;
      setDebugMessage('+10 all stats, +50 HP, +30 MP');
      break;
    case 'allmat':
      if (!player.materials) player.materials = {};
      for (const matId of Object.keys(MATERIAL_DEFS)) {
        player.materials[matId] = (player.materials[matId] || 0) + 10;
      }
      setDebugMessage('+10 all materials');
      break;
    case 'danger0':
      player.dangerMeter = 0;
      setDebugMessage('Danger reset to 0');
      break;
  }
  saveAfterDelay();
}

function forceLevel(player, count) {
  for (let i = 0; i < count; i++) {
    if (player.level >= 50) break;
    const needed = xpForLevel(player.level) - player.exp;
    applyExpGain(player, needed);
  }
}

function countRescuedPrincesses(player) {
  let count = 0;
  const flags = player.questFlags || {};
  if (flags.destiny_rescued) count++;
  if (isQuestDone(player, 'jasmine_samples')) count++;
  if (isQuestDone(player, 'crystal_keycard')) count++;
  if (flags.mercedes_rewarded) count++;
  if (flags.angelica_rescued) count++;
  if (isQuestDone(player, 'tiffany_antidote')) count++;
  if (flags.brianna_met) count++;
  if (flags.valentina_freed) count++;
  return count;
}

function saveAfterDelay() {
  setTimeout(() => {
    const room = getCurrentRoom();
    const p = getPlayer();
    if (room) saveGame(room.id, p.x, p.y, p);
  }, 50);
}

// --- Shop state ---

function updateShopState(now) {
  updateShopMessage(now);

  const input = consumeInput();
  if (!input) return;

  const shop = getShopState();
  const list = shop.mode === 'sell' ? shop.sellItems : shop.items;
  if (list.length === 0) return;

  // Up/down to browse
  if (input.dy === -1) {
    shop.menuIndex = (shop.menuIndex - 1 + list.length) % list.length;
  } else if (input.dy === 1) {
    shop.menuIndex = (shop.menuIndex + 1) % list.length;
  }
}

function renderShopState() {
  renderShop();
}

// --- Menu (Character) state ---

const EQUIPMENT_SLOTS = ['weapon', 'shield', 'helm', 'chest', 'boots', 'accessory1', 'accessory2'];

function renderMenuState() {
  const player = getPlayer();
  renderCharacter(player);
}

function handleMenuInput(key) {
  const player = getPlayer();
  const menu = getCharMenu();
  const panelCount = getPanelCount();

  // --- Equip overlay mode ---
  if (menu.inventoryMode) {
    const equipable = getEquipableItemsForSlot(player, EQUIPMENT_SLOTS[menu.selectedIndex]);
    if (key === 'Escape' || key === 'Backspace') {
      menu.inventoryMode = false;
      return;
    }
    if (key === 'ArrowUp') {
      if (equipable.length > 0) {
        menu.inventoryIndex = (menu.inventoryIndex - 1 + equipable.length) % equipable.length;
      }
      return;
    }
    if (key === 'ArrowDown') {
      if (equipable.length > 0) {
        menu.inventoryIndex = (menu.inventoryIndex + 1) % equipable.length;
      }
      return;
    }
    if (key === 'Enter' || key === ' ') {
      if (equipable.length > 0 && menu.inventoryIndex < equipable.length) {
        const invItem = equipable[menu.inventoryIndex];
        const itemDef = ITEMS_MODULE.ITEMS[invItem.id];
        if (itemDef) {
          equipItem(player, itemDef);
        }
      }
      menu.inventoryMode = false;
      return;
    }
    return;
  }

  // --- Panel navigation ---
  if (key === 'ArrowLeft') {
    menu.activePanel = (menu.activePanel - 1 + panelCount) % panelCount;
    menu.selectedIndex = 0;
  } else if (key === 'ArrowRight') {
    menu.activePanel = (menu.activePanel + 1) % panelCount;
    menu.selectedIndex = 0;
  } else if (key === 'ArrowUp') {
    if (menu.activePanel === 0) {
      // Equipment panel
      menu.selectedIndex = (menu.selectedIndex - 1 + EQUIPMENT_SLOTS.length) % EQUIPMENT_SLOTS.length;
    } else if (menu.activePanel === 2) {
      // Items panel
      const consumables = getConsumableItems(player);
      if (consumables.length > 0) {
        menu.selectedIndex = (menu.selectedIndex - 1 + consumables.length) % consumables.length;
      }
    }
  } else if (key === 'ArrowDown') {
    if (menu.activePanel === 0) {
      menu.selectedIndex = (menu.selectedIndex + 1) % EQUIPMENT_SLOTS.length;
    } else if (menu.activePanel === 2) {
      const consumables = getConsumableItems(player);
      if (consumables.length > 0) {
        menu.selectedIndex = (menu.selectedIndex + 1) % consumables.length;
      }
    }
  } else if (key === 'Enter' || key === ' ') {
    if (menu.activePanel === 0) {
      // Equipment panel: equip/unequip
      const slot = EQUIPMENT_SLOTS[menu.selectedIndex];
      if (player.equipment[slot]) {
        unequipSlot(player, slot);
      } else {
        const equipable = getEquipableItemsForSlot(player, slot);
        if (equipable.length > 0) {
          menu.inventoryMode = true;
          menu.inventoryIndex = 0;
        }
      }
    } else if (menu.activePanel === 2) {
      // Items panel: use consumable
      const consumables = getConsumableItems(player);
      if (consumables.length > 0 && menu.selectedIndex < consumables.length) {
        const invItem = consumables[menu.selectedIndex];
        const itemDef = ITEMS_MODULE.ITEMS[invItem.id];
        if (itemDef && itemDef.use) {
          const msg = itemDef.use(player);
          menu.useMessage = msg;
          menu.useMessageTimer = performance.now();
          removeFromInventory(player, invItem.id);
          // Adjust index if list shrunk
          const remaining = getConsumableItems(player);
          if (menu.selectedIndex >= remaining.length && remaining.length > 0) {
            menu.selectedIndex = remaining.length - 1;
          }
        }
      }
    }
  }
}

// --- Class Select state ---

function updateClassSelectState() {
  const input = consumeInput();
  if (!input) return;

  if (input.dx === -1) {
    setClassSelectIndex(getClassSelectIndex() - 1);
  } else if (input.dx === 1) {
    setClassSelectIndex(getClassSelectIndex() + 1);
  }
}

function confirmClassSelection() {
  const classId = getSelectedClassId();
  const player = getPlayer();
  const isExistingSave = player.level > 1 || player.gold > 0;

  if (isExistingSave) {
    // Migration: keep stats but assign class and grant abilities retroactively
    player.classId = classId;
    grantAbilitiesUpToLevel(player, player.level);
  } else {
    // New game: full init
    initClass(classId);
    // Equip starting weapon
    const cls = CLASSES[classId];
    const weaponDef = ITEMS_MODULE.ITEMS[cls.startingWeapon];
    if (weaponDef) {
      player.equipment.weapon = weaponDef;
    }
  }

  state = GAME_STATES.OVERWORLD;
  setInputEnabled(true);

  // Save immediately
  const room = getCurrentRoom();
  if (room) {
    saveGame(room.id, player.x, player.y, player);
  }
}

// Listen for Enter/Space/Escape to handle combat, shop, menu, and death actions
function initExtraInput() {
  window.addEventListener('keydown', (e) => {
    if (state === GAME_STATES.COMBAT) {
      const combat = getCombat();

      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (combat.subMenu) {
          e.preventDefault();
          closeSubMenu();
          return;
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (combat.result) {
          exitCombat();
        } else if (combat.turn === 'player' && !combat.animating) {
          if (combat.subMenu) {
            selectAction(combat.subMenuIndex);
          } else {
            selectAction(combat.menuIndex);
          }
        }
      }
    } else if (state === GAME_STATES.SHOP) {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        endShop();
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        toggleShopMode();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const shop = getShopState();
        if (shop.mode === 'sell') {
          sellItem(shop.menuIndex);
        } else {
          buyItem(shop.menuIndex);
        }
      }
    } else if (state === GAME_STATES.DEATH) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        revivePlayer();
      }
    } else if (state === GAME_STATES.MENU) {
      e.preventDefault();
      const menu = getCharMenu();

      if (menu.confirmingQuit) {
        // Quit confirmation is active
        if (e.key === 'Enter' || e.key === ' ') {
          // Confirm: clear save and return to title
          menu.confirmingQuit = false;
          resetCharMenu();
          clearSave();
          const { resetStats } = PLAYER_MODULE;
          resetStats();
          setOpenedChests([]);
          initTitle();
          state = GAME_STATES.TITLE;
          setInputEnabled(true);
        } else if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'q' || e.key === 'Q') {
          menu.confirmingQuit = false;
        }
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        menu.confirmingQuit = true;
      } else if (e.key === 'd' || e.key === 'D') {
        // Open debug menu
        openDebug();
        state = GAME_STATES.DEBUG;
      } else if (e.key === 'c' || e.key === 'C') {
        // Open compendium
        openCompendium(getPlayer());
        state = GAME_STATES.COMPENDIUM;
      } else if (e.key === 'k' || e.key === 'K') {
        // Open controls
        openControls();
        state = GAME_STATES.CONTROLS;
      } else if (e.key === 'i' || e.key === 'I' || e.key === 'Escape') {
        // Close character menu
        resetCharMenu();
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      } else {
        handleMenuInput(e.key);
      }
    } else if (state === GAME_STATES.CLASS_SELECT) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sfxSelect();
        confirmClassSelection();
      }
    } else if (state === GAME_STATES.DIALOGUE) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        navigateDialogueChoice(-1);
      } else if (e.key === 'ArrowDown') {
        navigateDialogueChoice(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        const dlg = getDialogueState();
        const cb = dlg.callback; // capture before advance clears it
        const result = advanceDialogue();
        if (result) {
          if (cb) {
            cb(result);
          } else {
            state = GAME_STATES.OVERWORLD;
            setInputEnabled(true);
          }
        }
      } else if (e.key === 'Escape') {
        endDialogue();
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      }
    } else if (state === GAME_STATES.CRAFTING) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        navigateCraft(-1);
      } else if (e.key === 'ArrowDown') {
        navigateCraft(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        const cs = getCraftState();
        if (cs.recipes.length > 0 && cs.selectedIndex < cs.recipes.length) {
          const recipe = cs.recipes[cs.selectedIndex];
          const player = getPlayer();
          if (canCraft(recipe.id, player)) {
            const item = craft(recipe.id, player);
            if (item) {
              addToInventory(player, item);
              setCraftMessage(`Crafted ${item.name}!`);
              saveAfterDelay();
            }
          } else {
            setCraftMessage("Missing materials or gold.");
          }
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        closeCrafting();
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      }
    } else if (state === GAME_STATES.PERK) {
      e.preventDefault();
      if (e.key === 'ArrowLeft') {
        navigatePerk(-1);
      } else if (e.key === 'ArrowRight') {
        navigatePerk(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        const done = selectPerk();
        if (done) {
          state = GAME_STATES.OVERWORLD;
          setInputEnabled(true);
          saveAfterDelay();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        if (!cancelPerkConfirm()) {
          // Can't escape perk selection — must choose
        }
      }
    } else if (state === GAME_STATES.COMPENDIUM) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        navigateCompendium(-1);
      } else if (e.key === 'ArrowDown') {
        navigateCompendium(1);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        closeCompendium();
        state = GAME_STATES.MENU;
        setInputEnabled(false);
      }
    } else if (state === GAME_STATES.JOURNAL) {
      e.preventDefault();
      if (e.key === 'ArrowLeft') {
        navigateJournal(-1, 0);
      } else if (e.key === 'ArrowRight') {
        navigateJournal(1, 0);
      } else if (e.key === 'ArrowUp') {
        navigateJournal(0, -1);
      } else if (e.key === 'ArrowDown') {
        navigateJournal(0, 1);
      } else if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'j' || e.key === 'J') {
        closeJournal();
        state = GAME_STATES.OVERWORLD;
        setInputEnabled(true);
      }
    } else if (state === GAME_STATES.CONTROLS) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        navigateControls(-1);
      } else if (e.key === 'ArrowDown') {
        navigateControls(1);
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        closeControls();
        state = GAME_STATES.MENU;
        setInputEnabled(false);
      }
    } else if (state === GAME_STATES.DEBUG) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        navigateDebug(-1);
      } else if (e.key === 'ArrowDown') {
        navigateDebug(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        applyDebugOption();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        closeDebug();
        state = GAME_STATES.MENU;
      }
    } else if (state === GAME_STATES.ENDING) {
      e.preventDefault();
      if (e.key === 'Enter' || e.key === ' ') {
        const done = advanceEnding();
        if (done) {
          initTitle();
          state = GAME_STATES.TITLE;
          setInputEnabled(true);
        }
      }
    } else if (state === GAME_STATES.TITLE) {
      e.preventDefault();
      if (e.key === 'ArrowUp') {
        setTitleMenuIndex(getTitleMenuIndex() - 1);
        sfxNavigate();
      } else if (e.key === 'ArrowDown') {
        setTitleMenuIndex(getTitleMenuIndex() + 1);
        sfxNavigate();
      } else if (e.key === 'Enter' || e.key === ' ') {
        sfxSelect();
        const option = getSelectedTitleOption();
        if (option === 'continue') {
          setInputEnabled(false);
          loadSavedGame().then(success => {
            if (success) {
              state = GAME_STATES.OVERWORLD;
            } else {
              state = GAME_STATES.CLASS_SELECT;
            }
            setInputEnabled(true);
          });
        } else {
          setInputEnabled(false);
          startNewGame().then(() => {
            state = GAME_STATES.CLASS_SELECT;
            setInputEnabled(true);
          });
        }
      }
    } else if (state === GAME_STATES.OVERWORLD) {
      // Chest popup dismiss
      const popup = getChestPopup();
      if (popup.active) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          hideChestLoot();
          setInputEnabled(true);
        }
        return;
      }

      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        state = GAME_STATES.MENU;
        setInputEnabled(false);
        resetCharMenu();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        openJournal();
        state = GAME_STATES.JOURNAL;
        setInputEnabled(false);
      }
    }
  });
}

initExtraInput();
init();
