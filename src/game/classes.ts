import { ALL_TAGS, cardDef } from './cards';
import { SKILLS } from './skills';
import type { CardInst, Tag } from './types';

/**
 * Classe emergente: não se escolhe classe. Ela é calculada a partir das tags
 * das cartas no baralho e das Mestrias aprendidas, e muda conforme a build evolui.
 */

export const PURE_THRESHOLD = 5;
export const HYBRID_THRESHOLD = 4;

export interface ClassInfo {
  id: string;
  name: string;
  /** Tags que definem a classe (0, 1 ou 2) */
  tags: Tag[];
  /** Força do bônus: classe pura é mais forte, híbrida divide em duas */
  power: number;
  desc: string;
}

const PURE: Record<Tag, string> = {
  espada: 'Espadachim',
  florete: 'Esgrimista',
  machado: 'Machadeiro',
  escudo: 'Guardião',
  adaga: 'Assassino',
};

const HYBRID: Record<string, string> = {
  'espada+florete': 'Mestre de Lâminas',
  'espada+machado': 'Guerreiro',
  'escudo+espada': 'Cavaleiro',
  'adaga+espada': 'Lâmina Dupla',
  'florete+machado': 'Gladiador',
  'escudo+florete': 'Sentinela',
  'adaga+florete': 'Duelista',
  'escudo+machado': 'Tanque',
  'adaga+machado': 'Saqueador',
  'adaga+escudo': 'Batedor',
};

/** Bônus de classe por tag, escalado por `power` (1 = híbrida, 1.5 = pura). */
export const TAG_BONUS_DESC: Record<Tag, (p: number) => string> = {
  espada: (p) => `Cartas Espada causam +${Math.round(2 * p)} de dano.`,
  florete: (p) => `Conexões dão +${fmt(0.5 * p)} Mult extra.`,
  machado: (p) => `Cartas Machado causam ×${fmt(1 + 0.25 * p)} de dano.`,
  escudo: (p) => `Começa cada turno com ${Math.round(3 * p)} de Bloqueio.`,
  adaga: (p) => `O 1º ataque de cada turno aplica ${Math.round(2 * p)} de Sangramento.`,
};

function fmt(n: number) {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

export function tagCounts(deck: CardInst[], skills: Record<string, number>): Record<Tag, number> {
  const counts = Object.fromEntries(ALL_TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  for (const c of deck) for (const t of cardDef(c.id).tags) counts[t]++;
  // Cada Mestria conta como 1 carta da tag por nível
  for (const [id, lv] of Object.entries(skills)) {
    const tag = SKILLS[id]?.tag;
    if (tag) counts[tag] += lv;
  }
  return counts;
}

export function computeClass(deck: CardInst[], skills: Record<string, number>): ClassInfo {
  const counts = tagCounts(deck, skills);
  const sorted = [...ALL_TAGS].sort((a, b) => counts[b] - counts[a]);
  const [a, b] = sorted;

  if (counts[a] >= HYBRID_THRESHOLD && counts[b] >= HYBRID_THRESHOLD) {
    const key = [a, b].sort().join('+');
    const name = HYBRID[key];
    return {
      id: key,
      name,
      tags: [a, b],
      power: 1,
      desc: `${TAG_BONUS_DESC[a](1)} ${TAG_BONUS_DESC[b](1)}`,
    };
  }
  if (counts[a] >= PURE_THRESHOLD) {
    return { id: a, name: PURE[a], tags: [a], power: 1.5, desc: TAG_BONUS_DESC[a](1.5) };
  }
  const spread = ALL_TAGS.filter((t) => counts[t] >= 2).length;
  if (spread >= 4) {
    return { id: 'polivalente', name: 'Aventureiro', tags: [], power: 0, desc: 'Arsenal dá +1 Mult extra.' };
  }
  return {
    id: 'novato',
    name: 'Novato',
    tags: [],
    power: 0,
    desc: `Sem classe. Reúna ${PURE_THRESHOLD} cartas/Mestrias de uma tag (ou ${HYBRID_THRESHOLD}+${HYBRID_THRESHOLD} de duas) para despertar uma classe.`,
  };
}
