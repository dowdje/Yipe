// quests.js — Quest tracking and objective checking for GRIDLOCK

import { QUEST_DEFS } from '../data/quests.js';

export function startQuest(player, questId) {
  if (!player.activeQuests) player.activeQuests = [];
  if (!player.completedQuests) player.completedQuests = [];
  if (player.activeQuests.includes(questId)) return false;
  if (player.completedQuests.includes(questId)) return false;
  player.activeQuests.push(questId);
  return true;
}

export function checkObjective(player, type, targetId) {
  if (!player.activeQuests) return [];
  const messages = [];
  for (const questId of player.activeQuests) {
    const def = QUEST_DEFS[questId];
    if (!def) continue;
    for (const obj of def.objectives) {
      if (obj.type === type && obj.target === targetId) {
        if (!player.questProgress) player.questProgress = {};
        if (!player.questProgress[questId]) player.questProgress[questId] = {};
        const key = `${obj.type}_${obj.target}`;
        player.questProgress[questId][key] = (player.questProgress[questId][key] || 0) + 1;
        const current = player.questProgress[questId][key];
        const needed = obj.count || 1;
        if (current <= needed) {
          messages.push(`Quest "${def.name}": ${obj.desc} (${Math.min(current, needed)}/${needed})`);
        }
      }
    }
  }
  return messages;
}

export function isQuestComplete(player, questId) {
  const def = QUEST_DEFS[questId];
  if (!def) return false;
  if (!player.questProgress || !player.questProgress[questId]) return false;
  for (const obj of def.objectives) {
    const key = `${obj.type}_${obj.target}`;
    const current = player.questProgress[questId]?.[key] || 0;
    const needed = obj.count || 1;
    if (current < needed) return false;
  }
  return true;
}

export function completeQuest(player, questId) {
  if (!player.activeQuests) return null;
  const idx = player.activeQuests.indexOf(questId);
  if (idx === -1) return null;
  const def = QUEST_DEFS[questId];
  if (!def) return null;
  player.activeQuests.splice(idx, 1);
  if (!player.completedQuests) player.completedQuests = [];
  player.completedQuests.push(questId);
  return def.reward;
}

export function isQuestActive(player, questId) {
  return player.activeQuests && player.activeQuests.includes(questId);
}

export function isQuestDone(player, questId) {
  return player.completedQuests && player.completedQuests.includes(questId);
}

export function getActiveQuests(player) {
  if (!player.activeQuests) return [];
  return player.activeQuests.map(id => QUEST_DEFS[id]).filter(Boolean);
}
