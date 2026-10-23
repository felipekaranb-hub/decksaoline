import { ALL_TAGS, canUpgrade, FIRST_WEAPON, STARTER_DECK } from './cards';
import { startCombat } from './combat';
import { applyDrop, applyEvolutions, canTakeDrop, luckOf, rollChoices, rollDrop, rollRarity } from './drops';
import { eventDef, EVENTS } from './events';
import { floorDef, LAST_FLOOR } from './floors';
import { MAX_POTIONS, POTIONS, RELICS } from './items';
import { BOSS_ID, generateMap, reachable } from './map';
import { acceptQuest, availableQuests, questDef } from './quests';
import { pick, rand, randInt, shuffle } from './rng';
import { addCard, gainCol, heal, removeCard, upgradeCard } from './runutil';
import { SKILLS } from './skills';
import type { CardSelectPurpose, Drop, DropRarity, EnemyKind, RunState, ShopItem } from './types';

export const RUN_VERSION = 2;
export const START_HP = 75;

export function newRun(name: string, seed: number, unlocked: string[]): RunState {
  const run: RunState = {
    version: RUN_VERSION,
    seed,
    rng: seed,
    name,
    hp: START_HP,
    maxHp: START_HP,
    col: 60,
    deck: [],
    nextCardUid: 1,
    skills: {},
    relics: [],
    potions: Array(MAX_POTIONS).fill(null),
    floor: 1,
    map: { rows: 0, cols: 0, nodes: {} },
    nodeId: null,
    visited: [],
    screen: 'starter',
    starterChoices: [],
    starterQuests: [],
    seenEvents: [],
    combat: null,
    reward: null,
    shop: null,
    event: null,
    cardSelect: null,
    quests: [],
    stats: { kills: 0, combats: 0, elites: 0, bosses: 0, colEarned: 0, maxMult: 1, biggestHit: 0 },
    deathCause: null,
    removeCount: 0,
    unlocked: [...unlocked],
  };
  for (const id of STARTER_DECK) addCard(run, id);
  run.map = generateMap(run);
  run.starterChoices = shuffle(run, [...ALL_TAGS]).slice(0, 3).map((t) => FIRST_WEAPON[t]);
  run.starterQuests = shuffle(run, availableQuests(run)).slice(0, 2);
  return run;
}

/** Primeira escolha: uma arma (nudge de build, não classe) e uma side quest opcional. */
export function chooseStarter(run: RunState, cardId: string, questId: string | null) {
  if (!run.starterChoices.includes(cardId)) return;
  addCard(run, cardId);
  if (questId && run.starterQuests.includes(questId)) acceptQuest(run, questId);
  run.screen = 'map';
}

// ───────────────────────── Mapa ─────────────────────────

export function canTravel(run: RunState, nodeId: string): boolean {
  return run.screen === 'map' && reachable(run.map, run.nodeId).includes(nodeId);
}

function mobsFoughtThisFloor(run: RunState): number {
  return run.visited.filter((id) => run.map.nodes[id]?.type === 'mob').length;
}

export function travel(run: RunState, nodeId: string) {
  if (!canTravel(run, nodeId)) return;
  const node = run.map.nodes[nodeId];
  run.nodeId = nodeId;
  run.visited.push(nodeId);
  const f = floorDef(run.floor);
  switch (node.type) {
    case 'mob': {
      const pool = mobsFoughtThisFloor(run) <= 2 ? f.easy : f.normal;
      beginCombat(run, pick(run, pool), 'normal');
      break;
    }
    case 'elite':
      beginCombat(run, pick(run, f.elite), 'elite');
      break;
    case 'boss':
      beginCombat(run, f.boss, 'boss');
      break;
    case 'event': {
      const fresh = EVENTS.filter((e) => !run.seenEvents.includes(e.id));
      const ev = pick(run, fresh.length ? fresh : EVENTS);
      run.seenEvents.push(ev.id);
      run.event = { id: ev.id, result: null };
      run.screen = 'event';
      break;
    }
    case 'town':
      run.shop = generateShop(run);
      run.screen = 'shop';
      break;
    case 'inn':
      run.screen = 'inn';
      break;
    case 'chest':
      openChest(run);
      break;
  }
}

export function beginCombat(run: RunState, enemies: string[], kind: EnemyKind) {
  startCombat(run, enemies, kind);
  run.screen = 'combat';
}

// ───────────────────────── Fim de combate / recompensas ─────────────────────────

function colMultiplier(run: RunState): number {
  return (run.relics.includes('bolsa_mercador') ? 1.3 : 1) * (1 + 0.1 * (run.skills.fortuna ?? 0));
}

/** Entrega recompensas de side quests concluídas. Retorna os ids recém-reivindicados. */
export function claimQuests(run: RunState): string[] {
  const out: string[] = [];
  for (const q of run.quests) {
    if (!q.done || q.claimed) continue;
    q.claimed = true;
    const reward = questDef(q.id).reward;
    addCard(run, reward);
    if (!run.unlocked.includes(reward)) run.unlocked.push(reward);
    out.push(q.id);
  }
  return out;
}

export function finishCombat(run: RunState) {
  const c = run.combat;
  if (!c || !c.result) return;
  if (c.result === 'lose') {
    const alive = c.enemies.filter((e) => !e.dead).map((e) => e.id);
    run.deathCause = alive.length ? alive[0] : 'desconhecido';
    run.screen = 'dead';
    return;
  }
  if (c.result === 'fled') {
    run.combat = null;
    run.screen = 'map';
    return;
  }
  const kind = c.kind;
  if (kind === 'elite') run.stats.elites++;
  if (kind === 'boss') run.stats.bosses++;

  const auto: Drop[] = [];
  for (const l of c.loot) {
    if (l.kind === 'col') gainCol(run, l.n ?? 0);
    else if (l.id) auto.push({ kind: 'potion', id: l.id, rarity: POTIONS[l.id].rarity });
  }
  // Baú de elite estilo Vampire Survivors: 1 item garantido (às vezes 3)
  if (kind === 'elite') {
    const n = rand(run) < 0.15 ? 3 : 1;
    for (let i = 0; i < n; i++) auto.push(rollDrop(run, rollRarity(run, luckOf(run, 2), 'uncommon'), auto));
  }
  const cleanWin = !c.tookDamage;
  run.combat = null;

  const [lo, hi] = kind === 'boss' ? [80, 100] : kind === 'elite' ? [28, 38] : [12, 20];
  const col = Math.round(randInt(run, lo, hi) * colMultiplier(run));
  gainCol(run, col);

  for (const d of auto) if (canTakeDrop(run, d)) applyDrop(run, d);
  if (cleanWin) {
    // sinal de "vitória limpa" para side quests
    for (const q of run.quests) {
      if (!q.done && questDef(q.id).track.k === 'cleanWin') {
        q.progress++;
        if (q.progress >= questDef(q.id).goal) q.done = true;
      }
    }
  }
  const questsDone = claimQuests(run);
  const evolutions = applyEvolutions(run);

  const luck = luckOf(run, kind === 'boss' ? 2 : kind === 'elite' ? 1 : 0);
  const nChoices = run.relics.includes('amuleto_sorte') ? 4 : 3;
  const f = floorDef(run.floor);
  run.reward = {
    source: kind === 'boss' ? 'boss' : kind === 'elite' ? 'elite' : 'combat',
    col,
    choices: rollChoices(run, nChoices, luck),
    picks: kind === 'boss' ? 2 : 1,
    rerollCost: run.relics.includes('amuleto_sorte') ? 0 : 10,
    auto,
    evolutions,
    questsDone,
    bossRelics: kind === 'boss' ? [f.bossRelic, 'cristal_vida'].filter((id, i, a) => a.indexOf(id) === i && !run.relics.includes(id)) : null,
  };
  run.screen = 'reward';
}

function openChest(run: RunState) {
  const col = Math.round(randInt(run, 25, 45) * colMultiplier(run));
  gainCol(run, col);
  const luck = luckOf(run, 1);
  const auto = [rollDrop(run, rollRarity(run, luck, 'rare'))];
  for (const d of auto) if (canTakeDrop(run, d)) applyDrop(run, d);
  run.reward = {
    source: 'chest',
    col,
    choices: rollChoices(run, 3, luck),
    picks: 1,
    rerollCost: 10,
    auto,
    evolutions: applyEvolutions(run),
    questsDone: [],
    bossRelics: null,
  };
  run.screen = 'reward';
}

export function takeChoice(run: RunState, idx: number) {
  const r = run.reward;
  const d = r?.choices?.[idx];
  if (!r || !d || r.picks <= 0 || !canTakeDrop(run, d)) return;
  applyDrop(run, d);
  r.choices = r.choices!.filter((_, i) => i !== idx);
  r.picks--;
  r.evolutions.push(...applyEvolutions(run));
  if (r.picks <= 0) r.choices = null;
}

export function reroll(run: RunState) {
  const r = run.reward;
  if (!r || !r.choices || run.col < r.rerollCost) return;
  run.col -= r.rerollCost;
  r.rerollCost = r.rerollCost === 0 ? 10 : r.rerollCost + 10;
  const luck = luckOf(run, r.source === 'boss' ? 2 : r.source === 'combat' ? 0 : 1);
  r.choices = rollChoices(run, r.choices.length, luck);
}

export function skipChoices(run: RunState) {
  if (run.reward) run.reward.choices = null;
}

export function takeBossRelic(run: RunState, id: string) {
  const r = run.reward;
  if (!r?.bossRelics?.includes(id)) return;
  applyDrop(run, { kind: 'relic', id, rarity: 'legendary' });
  r.bossRelics = null;
}

export function leaveReward(run: RunState) {
  const r = run.reward;
  run.reward = null;
  if (r?.source === 'boss') {
    run.screen = run.floor >= LAST_FLOOR ? 'victory' : 'floorClear';
  } else {
    run.screen = 'map';
  }
}

export function nextFloor(run: RunState) {
  run.floor++;
  run.map = generateMap(run);
  run.nodeId = null;
  run.visited = [];
  heal(run, (run.maxHp - run.hp) * 0.6);
  run.screen = 'map';
}

// ───────────────────────── Cidade (loja + quadro de missões) ─────────────────────────

const PRICE: Record<DropRarity, number> = { common: 45, uncommon: 70, rare: 115, epic: 175, legendary: 260 };

function priceOf(d: Drop): number {
  if (d.kind === 'potion') return POTIONS[d.id].price;
  if (d.kind === 'relic') return RELICS[d.id].rarity === 'rare' ? 230 : RELICS[d.id].rarity === 'uncommon' ? 180 : 140;
  return PRICE[d.rarity] + (d.kind === 'skill' ? 15 : 0);
}

function generateShop(run: RunState): ShopState {
  const luck = luckOf(run, 0.5);
  const items: ShopItem[] = [];
  const add = (d: Drop) => items.push({ drop: d, price: priceOf(d), sold: false });
  const all = () => items.map((i) => i.drop);
  for (let i = 0; i < 3; i++) {
    let d = rollDrop(run, rollRarity(run, luck), all());
    for (let t = 0; t < 10 && d.kind !== 'card'; t++) d = rollDrop(run, rollRarity(run, luck), all());
    add(d);
  }
  for (let i = 0; i < 2; i++) {
    const ids = Object.values(SKILLS).filter((s) => !all().some((x) => x.id === s.id)).map((s) => s.id);
    if (ids.length) {
      const id = pick(run, ids);
      add({ kind: 'skill', id, rarity: SKILLS[id].rarity });
    }
  }
  add(rollDrop(run, 'rare', all()));
  for (let i = 0; i < 2; i++) {
    const ids = Object.keys(POTIONS).filter((id) => !all().some((x) => x.id === id));
    const id = pick(run, ids);
    add({ kind: 'potion', id, rarity: POTIONS[id].rarity });
  }
  return {
    items,
    removePrice: 75 + 25 * run.removeCount,
    removeUsed: false,
    quests: shuffle(run, availableQuests(run)).slice(0, 2),
  };
}

type ShopState = NonNullable<RunState['shop']>;

export function buy(run: RunState, idx: number) {
  const item = run.shop?.items[idx];
  if (!item || item.sold || run.col < item.price || !canTakeDrop(run, item.drop)) return;
  run.col -= item.price;
  item.sold = true;
  applyDrop(run, item.drop);
  applyEvolutions(run);
}

export function takeShopQuest(run: RunState, id: string) {
  if (!run.shop?.quests.includes(id)) return;
  if (acceptQuest(run, id)) run.shop.quests = run.shop.quests.filter((q) => q !== id);
}

export function openCardSelect(run: RunState, purpose: CardSelectPurpose, back: RunState['screen'], price?: number) {
  run.cardSelect = {
    purpose,
    title: purpose === 'upgrade' ? 'Treinar: escolha uma carta para melhorar' : 'Escolha uma carta para remover do baralho',
    back,
    cancelable: true,
    price,
  };
  run.screen = 'cardSelect';
}

export function selectableCards(run: RunState) {
  const cs = run.cardSelect;
  if (!cs) return [];
  return cs.purpose === 'upgrade' ? run.deck.filter(canUpgrade) : run.deck;
}

export function chooseCard(run: RunState, uid: number) {
  const cs = run.cardSelect;
  if (!cs) return;
  if (cs.purpose === 'upgrade') upgradeCard(run, uid);
  else {
    if (cs.price) {
      if (run.col < cs.price) return;
      run.col -= cs.price;
      run.removeCount++;
      if (run.shop) run.shop.removeUsed = true;
    }
    removeCard(run, uid);
  }
  run.cardSelect = null;
  run.screen = cs.back;
}

export function cancelCardSelect(run: RunState) {
  const cs = run.cardSelect;
  if (!cs?.cancelable) return;
  run.cardSelect = null;
  run.screen = cs.back;
}

// ───────────────────────── Pousada ─────────────────────────

export function restAtInn(run: RunState) {
  heal(run, run.maxHp * 0.3);
  run.screen = 'map';
}

// ───────────────────────── Eventos ─────────────────────────

export function chooseEvent(run: RunState, idx: number) {
  if (!run.event || run.event.result) return;
  const choice = eventDef(run.event.id).choices[idx];
  if (!choice || (choice.available && !choice.available(run))) return;
  const out = choice.apply(run);
  run.event.result = out.text;
  if (run.hp <= 0) {
    run.deathCause = run.event.id;
    run.screen = 'dead';
    return;
  }
  if (out.combat) beginCombat(run, out.combat.enemies, out.combat.kind);
  else if (out.cardSelect) {
    openCardSelect(run, out.cardSelect, 'map');
    run.cardSelect!.cancelable = false;
  }
}

export function leaveEvent(run: RunState) {
  run.event = null;
  run.screen = 'map';
}

export function isBossNode(id: string) {
  return id === BOSS_ID;
}
