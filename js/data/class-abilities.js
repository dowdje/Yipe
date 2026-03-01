// class-abilities.js — All class-specific abilities for GRIDLOCK

export const CLASS_ABILITIES = {
  // ===== BRUISER =====
  // Strike is now the Bruiser's basic attack (replaces Attack in menu), not an ability.
  // Strike builds 1 Pump and has a 15% stun chance.
  bruiser: [
    {
      id: 'flex',
      name: 'Flex',
      desc: 'Reduce damage 50%, gain 2 Pump, retaliate on hit.',
      learnLevel: 1,
      resourceCost: 0,
      mpCost: 0,
      damageType: null,
      isDefend: true,
      execute(player, enemy, log, combat) {
        combat.defending = true;
        combat._flexRetaliating = true;
        combat.classResource = Math.min((combat.classResource || 0) + 2, 10);
        log(`You flex! Pump +2 (${combat.classResource}/10). Braced!`);
        return { damage: 0 };
      },
    },
    {
      id: 'protein_slam',
      name: 'Protein Slam',
      desc: '150% ATK damage. If target <30% HP, instant kill.',
      learnLevel: 1,
      resourceCost: 3,
      mpCost: 0,
      damageType: 'physical',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        const damage = Math.floor(Math.max(1, stats.atk - enemy.def) * 1.5) + Math.floor(Math.random() * 3);
        if (enemy.hp / enemy.maxHp < 0.3) {
          enemy.hp = 0;
          log(`PROTEIN SLAM! Instant KO!`);
        } else {
          enemy.hp = Math.max(0, enemy.hp - damage);
          log(`Protein Slam! ${damage} damage!`);
        }
        return { damage, damageType: 'physical' };
      },
    },
    {
      id: 'roid_rage',
      name: 'Roid Rage',
      desc: 'ATK +30% for 3 turns. Cannot Defend while active.',
      learnLevel: 8,
      resourceCost: 0,
      mpCost: 0,
      damageType: null,
      execute(player, enemy, log, combat) {
        combat._roidRageTurns = 3;
        log('ROID RAGE! ATK boosted for 3 turns!');
        return { damage: 0 };
      },
    },
    {
      id: 'suplex',
      name: 'Suplex',
      desc: 'Massive damage, ignores 50% of target DEF.',
      learnLevel: 14,
      resourceCost: 4,
      mpCost: 0,
      damageType: 'physical',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        const effectiveDef = Math.floor(enemy.def * 0.5);
        const damage = Math.max(1, stats.atk * 2 - effectiveDef) + Math.floor(Math.random() * 4);
        enemy.hp = Math.max(0, enemy.hp - damage);
        log(`SUPLEX! ${damage} damage!`);
        return { damage, damageType: 'physical' };
      },
    },
    {
      id: 'iron_skin',
      name: 'Iron Skin',
      desc: 'Negate ALL damage for 1 full turn.',
      learnLevel: 20,
      resourceCost: 5,
      mpCost: 0,
      damageType: null,
      execute(player, enemy, log, combat) {
        combat._ironSkinTurns = 1;
        log('Iron Skin! Invulnerable this turn!');
        return { damage: 0 };
      },
    },
    {
      id: 'no_pain_no_gain',
      name: 'No Pain No Gain',
      desc: 'Passive: +1 ATK per 50 damage taken (caps at +10).',
      learnLevel: 28,
      resourceCost: 0,
      mpCost: 0,
      damageType: null,
      passive: true,
      execute() {
        // Passive — handled in combat damage hooks
        return { damage: 0 };
      },
    },
  ],

  // ===== FIXER =====
  // Shiv is now the Fixer's basic attack (replaces Attack in menu), not an ability.
  fixer: [
    {
      id: 'backstab',
      name: 'Backstab',
      desc: 'Opening strike: 2x damage. Only before enemy acts.',
      learnLevel: 1,
      resourceCost: 0,
      mpCost: 0,
      damageType: 'physical',
      openerOnly: true, // only usable before enemy's first action
      execute(player, enemy, log, combat, getEffectiveStats) {
        if (combat._enemyHasActed || combat._backstabUsed) {
          log('Too late! Backstab only works as an opener.');
          return { damage: 0, failed: true };
        }
        combat._backstabUsed = true;
        const stats = getEffectiveStats(player);
        const weaponPower = (player.equipment?.weapon?.power) || 0;
        const damage = Math.floor(Math.max(1, stats.atk + weaponPower - enemy.def) * 2.0) + Math.floor(Math.random() * 3);
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat.classResource = Math.min((combat.classResource || 0) + 1, 5);
        log(`Backstab! ${damage} damage! CP ${combat.classResource}/5`);
        return { damage, damageType: 'physical' };
      },
    },
    {
      id: 'eviscerate',
      name: 'Eviscerate',
      desc: 'Consume all CP (min 2). Deal CP × 50% ATK.',
      learnLevel: 1,
      resourceCost: -1, // special: consumes all, min 2
      mpCost: 0,
      damageType: 'physical',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const cp = combat.classResource || 0;
        if (cp < 2) {
          log('Need at least 2 Combo Points!');
          return { damage: 0, failed: true };
        }
        const stats = getEffectiveStats(player);
        const damage = Math.floor(cp * stats.atk * 0.5) + Math.floor(Math.random() * 3);
        enemy.hp = Math.max(0, enemy.hp - damage);
        log(`Eviscerate (${cp} CP)! ${damage} damage!`);
        combat.classResource = 0;
        return { damage, damageType: 'physical' };
      },
    },
    {
      id: 'smoke_bomb',
      name: 'Smoke Bomb',
      desc: 'Guaranteed flee OR skip enemy turns. Once per fight.',
      learnLevel: 6,
      resourceCost: 0,
      mpCost: 0,
      damageType: null,
      execute(player, enemy, log, combat) {
        if (combat._smokeBombUsed) {
          log('Already used Smoke Bomb this fight!');
          return { damage: 0, failed: true };
        }
        combat._smokeBombUsed = true;
        combat._enemyStunned = true;
        log('Smoke Bomb! Enemy skips their turn!');
        return { damage: 0 };
      },
    },
    {
      id: 'exploit_opening',
      name: 'Exploit Opening',
      desc: 'Mark: next hit auto-crits + triggers Exploit.',
      learnLevel: 10,
      resourceCost: 2,
      mpCost: 0,
      damageType: null,
      execute(player, enemy, log, combat) {
        combat._exploitOpening = true;
        log('Marked enemy! Next hit auto-crits!');
        return { damage: 0 };
      },
    },
    {
      id: 'death_mark',
      name: 'Death Mark',
      desc: 'Target takes 2x damage from ALL sources for 2 turns.',
      learnLevel: 18,
      resourceCost: 4,
      mpCost: 0,
      damageType: null,
      execute(player, enemy, log, combat) {
        combat._deathMarkTurns = 2;
        log('Death Mark! Enemy takes double damage for 2 turns!');
        return { damage: 0 };
      },
    },
    {
      id: 'payday',
      name: 'Payday',
      desc: 'Massive damage + bonus gold = 50% of damage dealt.',
      learnLevel: 26,
      resourceCost: 5,
      mpCost: 0,
      damageType: 'physical',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        const damage = Math.floor(stats.atk * 2.5) + Math.floor(Math.random() * 5);
        enemy.hp = Math.max(0, enemy.hp - damage);
        const bonusGold = Math.floor(damage * 0.5);
        player.gold += bonusGold;
        combat.classResource = 0;
        log(`PAYDAY! ${damage} damage! +${bonusGold}G bonus!`);
        return { damage, damageType: 'physical' };
      },
    },
  ],

  // ===== HACKER =====
  hacker: [
    {
      id: 'zap',
      name: 'Zap',
      desc: 'Basic spell. Untyped magic damage.',
      learnLevel: 1,
      resourceCost: 0,
      mpCost: 3,
      damageType: 'physical', // untyped, uses physical as fallback
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        const damage = Math.max(1, stats.int + 4 - Math.floor(enemy.def * 0.5)) + Math.floor(Math.random() * 4);
        enemy.hp = Math.max(0, enemy.hp - damage);
        log(`Zap! ${damage} damage!`);
        return { damage, damageType: 'physical' };
      },
    },
    {
      id: 'firewall',
      name: 'Firewall',
      desc: 'Fire damage. Sets Overclock (Fire).',
      learnLevel: 1,
      resourceCost: 0,
      mpCost: 5,
      damageType: 'fire',
      setsOverclock: 'fire',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        let damage = Math.max(1, stats.int + 6 - Math.floor(enemy.def * 0.5)) + Math.floor(Math.random() * 4);
        // Overclock bonus
        if (combat._overclockElement === 'fire' && combat._overclockTurns > 0) {
          damage = Math.floor(damage * 1.2);
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = 'fire';
        combat._overclockTurns = 2;
        log(`Firewall! ${damage} fire damage! Overclock: Fire`);
        return { damage, damageType: 'fire' };
      },
    },
    {
      id: 'system_freeze',
      name: 'System Freeze',
      desc: 'Ice damage. Sets Overclock (Ice).',
      learnLevel: 4,
      resourceCost: 0,
      mpCost: 5,
      damageType: 'ice',
      setsOverclock: 'ice',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        let damage = Math.max(1, stats.int + 6 - Math.floor(enemy.def * 0.5)) + Math.floor(Math.random() * 4);
        if (combat._overclockElement === 'ice' && combat._overclockTurns > 0) {
          damage = Math.floor(damage * 1.2);
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = 'ice';
        combat._overclockTurns = 2;
        log(`System Freeze! ${damage} ice damage! Overclock: Ice`);
        return { damage, damageType: 'ice' };
      },
    },
    {
      id: 'power_surge',
      name: 'Power Surge',
      desc: 'Lightning damage. Sets Overclock (Lightning).',
      learnLevel: 7,
      resourceCost: 0,
      mpCost: 6,
      damageType: 'lightning',
      setsOverclock: 'lightning',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        let damage = Math.max(1, stats.int + 8 - Math.floor(enemy.def * 0.5)) + Math.floor(Math.random() * 5);
        if (combat._overclockElement === 'lightning' && combat._overclockTurns > 0) {
          damage = Math.floor(damage * 1.2);
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = 'lightning';
        combat._overclockTurns = 2;
        log(`Power Surge! ${damage} lightning damage! Overclock: Lightning`);
        return { damage, damageType: 'lightning' };
      },
    },
    {
      id: 'overheat',
      name: 'Overheat',
      desc: 'Fire AOE. Heavy fire damage.',
      learnLevel: 12,
      resourceCost: 0,
      mpCost: 10,
      damageType: 'fire',
      setsOverclock: 'fire',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        let damage = Math.max(1, stats.int + 14 - Math.floor(enemy.def * 0.3)) + Math.floor(Math.random() * 6);
        if (combat._overclockElement === 'fire' && combat._overclockTurns > 0) {
          damage = Math.floor(damage * 1.2);
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = 'fire';
        combat._overclockTurns = 2;
        log(`Overheat! ${damage} fire damage!`);
        return { damage, damageType: 'fire' };
      },
    },
    {
      id: 'blizzard_protocol',
      name: 'Blizzard Protocol',
      desc: 'Heavy ice damage.',
      learnLevel: 18,
      resourceCost: 0,
      mpCost: 12,
      damageType: 'ice',
      setsOverclock: 'ice',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        let damage = Math.max(1, stats.int + 18 - Math.floor(enemy.def * 0.3)) + Math.floor(Math.random() * 8);
        if (combat._overclockElement === 'ice' && combat._overclockTurns > 0) {
          damage = Math.floor(damage * 1.2);
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = 'ice';
        combat._overclockTurns = 2;
        log(`Blizzard Protocol! ${damage} ice damage!`);
        return { damage, damageType: 'ice' };
      },
    },
    {
      id: 'chain_lightning',
      name: 'Chain Lightning',
      desc: 'Heavy lightning damage.',
      learnLevel: 24,
      resourceCost: 0,
      mpCost: 14,
      damageType: 'lightning',
      setsOverclock: 'lightning',
      execute(player, enemy, log, combat, getEffectiveStats) {
        const stats = getEffectiveStats(player);
        let damage = Math.max(1, stats.int + 22 - Math.floor(enemy.def * 0.3)) + Math.floor(Math.random() * 10);
        if (combat._overclockElement === 'lightning' && combat._overclockTurns > 0) {
          damage = Math.floor(damage * 1.2);
        }
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = 'lightning';
        combat._overclockTurns = 2;
        log(`Chain Lightning! ${damage} lightning damage!`);
        return { damage, damageType: 'lightning' };
      },
    },
    {
      id: 'system_crash',
      name: 'System Crash',
      desc: 'Massive damage. Requires active Overclock.',
      learnLevel: 32,
      resourceCost: 0,
      mpCost: 25,
      damageType: 'physical',
      requiresOverclock: true,
      execute(player, enemy, log, combat, getEffectiveStats) {
        if (!combat._overclockElement || combat._overclockTurns <= 0) {
          log('Need active Overclock to use System Crash!');
          return { damage: 0, failed: true };
        }
        const stats = getEffectiveStats(player);
        const damage = Math.max(1, stats.int * 3 + 30) + Math.floor(Math.random() * 15);
        enemy.hp = Math.max(0, enemy.hp - damage);
        combat._overclockElement = null;
        combat._overclockTurns = 0;
        log(`SYSTEM CRASH! ${damage} massive damage!`);
        return { damage, damageType: 'physical' };
      },
    },
    {
      id: 'reboot',
      name: 'Reboot',
      desc: 'Full self-heal. Once per combat.',
      learnLevel: 38,
      resourceCost: 0,
      mpCost: 20,
      damageType: null,
      execute(player, enemy, log, combat) {
        if (combat._rebootUsed) {
          log('Reboot already used this combat!');
          return { damage: 0, failed: true };
        }
        combat._rebootUsed = true;
        const healed = player.maxHp - player.hp;
        player.hp = player.maxHp;
        log(`REBOOT! Restored ${healed} HP!`);
        return { damage: 0 };
      },
    },
  ],
};
