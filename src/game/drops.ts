import { cardDef, dropPool } from './cards';
import { POTIONS, RELICS } from './items';
import { pick, rand, weighted } from './rng';
import { addCard, addPotion, addRelic, canLearnSkill, learnSkill } from './runutil';
import { EVOLUTIONS, SKILLS } from './skills';
import type { Drop, DropKind, DropRarity, RunState } from './types';

/**
 * Drops aleatórios estilo PokeRogue: cada opção tem um tier de raridade (cor),
 * a sorte (Fortuna, elites, chefes, andar) empurra as chances para cima,
 * e dá para pagar col para rerrolar.
 */

export const RARITY_ORDER: DropRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const RARITY_INFO: Record<DropRarity, { name: string; color: string }> = {
  common: { name: 'Comum', color: '#d7dde8' },
  uncommon: { name: 'Incomum', color: '#5fe08a' },
  rare: { name: 'Raro', color: '#4fa3ff' },
  epic: { name: 'Épico', color: '#b86bff' },
  legendary: { name: 'Lendário', color: '#ff9f1c' },
};

export function luckOf(run: RunState, bonus = 0): number {
  return (run.skills.fortuna ?? 0) + (run.floor - 1) * 0.5 + bonus;
}

export function rollRarity(run: RunState, luck: number, min: DropRarity = 'common'): DropRarity {
  const w: [DropRarity, number][] = [
    ['common', Math.max(5, 55 - 7 * luck)],
    ['uncommon', 28 + 2 * luck],
    ['rare', 12 + 3 * luck],
    ['epic', 4 + 1.5 * luck],
    ['legendary', 1 + 0.5 * luck],
  ];
  const minIdx = RARITY_ORDER.indexOf(min);
  return weighted(run, w.filter(([r]) => RARITY_ORDER.indexOf(r) >= minIdx));
}

const rIdx = (r: DropRarity) => RARITY_ORDER.indexOf(r);

function skillCandidates(run: RunState, rarity: DropRarity): string[] {
  return Object.values(SKILLS)
    .filter((s) => rIdx(s.rarity) <= rIdx(rarity) && canLearnSkill(run, s.id))
    .map((s) => s.id);
}

/** Gera um drop de uma raridade, evitando duplicatas da mesma tela. */
export function rollDrop(run: RunState, rarity: DropRarity, avoid: Drop[] = []): Drop {
  const taken = (kind: DropKind, id: string) => avoid.some((d) => d.kind === kind && d.id === id);
  const kinds: [DropKind, number][] =
    rarity === 'common' ? [['card', 60], ['skill', 25], ['potion', 15]]
    : rarity === 'uncommon' ? [['card', 50], ['skill', 35], ['potion', 15]]
    : rarity === 'rare' ? [['card', 45], ['skill', 30], ['relic', 25]]
    : rarity === 'epic' ? [['card', 50], ['relic', 30], ['skill', 20]]
    : [['card', 50], ['relic', 50]];

  for (let attempt = 0; attempt < 20; attempt++) {
    const kind = weighted(run, kinds);
    if (kind === 'card') {
      const cardRarity = rarity === 'legendary' ? 'epic' : rarity;
      const pool = dropPool(cardRarity, run.unlocked).filter((id) => !taken('card', id));
      if (pool.length) return { kind, id: pick(run, pool), rarity, up: rarity === 'legendary' };
    } else if (kind === 'skill') {
      // Habilidades que você já tem aparecem com mais frequência (para subir de nível)
      const pool = skillCandidates(run, rarity).filter((id) => !taken('skill', id));
      if (pool.length) {
        const owned = pool.filter((id) => run.skills[id]);
        const id = owned.length && rand(run) < 0.5 ? pick(run, owned) : pick(run, pool);
        return { kind, id, rarity };
      }
    } else if (kind === 'relic') {
      const allowed = rarity === 'rare' ? ['common', 'uncommon'] : ['uncommon', 'rare'];
      const pool = Object.values(RELICS)
        .filter((r) => allowed.includes(r.rarity) && !run.relics.includes(r.id) && !taken('relic', r.id))
        .map((r) => r.id);
      if (pool.length) return { kind, id: pick(run, pool), rarity };
    } else {
      const pool = Object.values(POTIONS)
        .filter((p) => rIdx(p.rarity) <= rIdx(rarity) && !taken('potion', p.id))
        .map((p) => p.id);
      if (pool.length) return { kind, id: pick(run, pool), rarity };
    }
  }
  // Fallback garantido
  return { kind: 'potion', id: 'pocao_cura', rarity: 'common' };
}

export function rollChoices(run: RunState, n: number, luck: number): Drop[] {
  const out: Drop[] = [];
  for (let i = 0; i < n; i++) out.push(rollDrop(run, rollRarity(run, luck), out));
  return out;
}

export function canTakeDrop(run: RunState, d: Drop): boolean {
  if (d.kind === 'skill') return canLearnSkill(run, d.id);
  if (d.kind === 'potion') return run.potions.some((p) => p === null);
  if (d.kind === 'relic') return !run.relics.includes(d.id);
  return true;
}

export function applyDrop(run: RunState, d: Drop) {
  switch (d.kind) {
    case 'card':
      addCard(run, d.id, !!d.up);
      break;
    case 'skill':
      learnSkill(run, d.id);
      break;
    case 'relic':
      addRelic(run, d.id);
      break;
    case 'potion':
      addPotion(run, d.id);
      break;
  }
}

export function dropName(d: Drop): string {
  switch (d.kind) {
    case 'card':
      return cardDef(d.id).name + (d.up ? '+' : '');
    case 'skill':
      return SKILLS[d.id].name;
    case 'relic':
      return RELICS[d.id].name;
    case 'potion':
      return POTIONS[d.id].name;
  }
}

/** Aplica evoluções disponíveis (carta + habilidade no nível). Retorna as que ocorreram. */
export function applyEvolutions(run: RunState): { from: string; to: string }[] {
  const done: { from: string; to: string }[] = [];
  for (const ev of EVOLUTIONS) {
    if ((run.skills[ev.skill] ?? 0) < ev.level) continue;
    const card = run.deck.find((c) => c.id === ev.card);
    if (!card) continue;
    card.id = ev.into;
    done.push({ from: ev.card, to: ev.into });
  }
  return done;
}
