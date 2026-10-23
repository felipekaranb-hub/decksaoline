import { canUpgrade, cardDef } from './cards';
import { POTIONS, RELICS, type RelicDef } from './items';
import { MAX_SKILL_LEVEL, MAX_SKILLS } from './skills';
import { pick, shuffle, weighted } from './rng';
import type { CardInst, RunState } from './types';

export function addCard(run: RunState, id: string, up = false): CardInst {
  const inst = { uid: run.nextCardUid++, id, up };
  run.deck.push(inst);
  return inst;
}

export function removeCard(run: RunState, uid: number) {
  run.deck = run.deck.filter((c) => c.uid !== uid);
}

export function upgradeCard(run: RunState, uid: number) {
  const c = run.deck.find((x) => x.uid === uid);
  if (c && canUpgrade(c)) c.up = true;
}

export function upgradeRandom(run: RunState, n: number): string[] {
  const options = shuffle(run, run.deck.filter(canUpgrade));
  return options.slice(0, n).map((c) => {
    c.up = true;
    return cardDef(c.id).name;
  });
}

export function heal(run: RunState, n: number) {
  run.hp = Math.min(run.maxHp, run.hp + Math.max(0, Math.round(n)));
}

export function loseHp(run: RunState, n: number) {
  run.hp = Math.max(0, run.hp - n);
}

export function gainCol(run: RunState, n: number) {
  run.col += n;
  run.stats.colEarned += n;
}

export function addRelic(run: RunState, id: string) {
  if (run.relics.includes(id)) return;
  run.relics.push(id);
  if (id === 'cristal_vida') {
    run.maxHp += 15;
    run.hp = run.maxHp;
  }
}

export function canLearnSkill(run: RunState, id: string): boolean {
  const lv = run.skills[id];
  if (lv !== undefined) return lv < MAX_SKILL_LEVEL;
  return Object.keys(run.skills).length < MAX_SKILLS;
}

/** Aprende ou sobe de nível uma habilidade passiva. */
export function learnSkill(run: RunState, id: string) {
  if (!canLearnSkill(run, id)) return;
  run.skills[id] = (run.skills[id] ?? 0) + 1;
  if (id === 'vigor') {
    run.maxHp += 6;
    run.hp += 6;
  }
}

export function randomRelic(run: RunState, rarities: RelicDef['rarity'][] = ['common', 'uncommon', 'rare']): string | null {
  const pool = Object.values(RELICS).filter((r) => rarities.includes(r.rarity) && !run.relics.includes(r.id));
  if (!pool.length) return null;
  const weights: [RelicDef, number][] = pool.map((r) => [r, r.rarity === 'common' ? 50 : r.rarity === 'uncommon' ? 33 : 17]);
  return weighted(run, weights).id;
}

export function addPotion(run: RunState, id: string): boolean {
  const slot = run.potions.findIndex((p) => p === null);
  if (slot < 0) return false;
  run.potions[slot] = id;
  return true;
}

export function randomPotion(run: RunState): string {
  return pick(run, Object.keys(POTIONS));
}
