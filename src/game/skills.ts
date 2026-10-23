import type { DropRarity, Tag } from './types';

/**
 * Habilidades passivas com nível (estilo Vampire Survivors / jokers do Balatro).
 * Pegar a mesma habilidade de novo sobe o nível até MAX_SKILL_LEVEL.
 */
export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  rarity: DropRarity;
  /** Tag de arma associada (conta para a classe emergente) */
  tag?: Tag;
  desc: (lv: number) => string;
}

export const MAX_SKILL_LEVEL = 5;
export const MAX_SKILLS = 6;

const S = (d: SkillDef) => d;

export const SKILLS: Record<string, SkillDef> = Object.fromEntries(
  [
    S({ id: 'mestria_espada', name: 'Mestria: Espada', icon: '🗡️', rarity: 'common', tag: 'espada',
      desc: (lv) => `Cartas Espada causam +${2 * lv} de dano.` }),
    S({ id: 'mestria_florete', name: 'Mestria: Florete', icon: '🤺', rarity: 'common', tag: 'florete',
      desc: (lv) => `Cartas Florete dão +${fmt(0.2 * lv)} Mult ao serem jogadas.` }),
    S({ id: 'mestria_machado', name: 'Mestria: Machado', icon: '🪓', rarity: 'common', tag: 'machado',
      desc: (lv) => `Cartas Machado causam ×${fmt(1 + 0.1 * lv)} de dano.` }),
    S({ id: 'mestria_escudo', name: 'Mestria: Escudo', icon: '🛡️', rarity: 'common', tag: 'escudo',
      desc: (lv) => `Cartas Escudo dão +${2 * lv} de Bloqueio.` }),
    S({ id: 'mestria_adaga', name: 'Mestria: Adaga', icon: '🔪', rarity: 'common', tag: 'adaga',
      desc: (lv) => `Cartas Adaga aplicam +${lv} de Sangramento ao causar dano.` }),
    S({ id: 'harmonia', name: 'Harmonia', icon: '🎼', rarity: 'uncommon',
      desc: (lv) => `Conexões dão +${fmt(0.25 * lv)} Mult extra.` }),
    S({ id: 'polivalente', name: 'Polivalente', icon: '🧰', rarity: 'uncommon',
      desc: (lv) => `Arsenal dá +${fmt(0.5 * lv)} Mult extra.` }),
    S({ id: 'foco', name: 'Foco', icon: '🎯', rarity: 'uncommon',
      desc: (lv) => `Começa cada turno com +${fmt(0.25 * lv)} Mult.` }),
    S({ id: 'skill_connect', name: 'Skill Connect', icon: '🔗', rarity: 'rare',
      desc: (lv) => `A 1ª Sword Skill do turno não causa Atraso. Skill Chain dá ×${fmt(1.5 + 0.25 * (lv - 1))} (em vez de ×1,5).` }),
    S({ id: 'battle_healing', name: 'Battle Healing', icon: '💚', rarity: 'uncommon',
      desc: (lv) => `Recupera ${lv} HP no fim de cada turno.` }),
    S({ id: 'deteccao', name: 'Detecção', icon: '📡', rarity: 'common',
      desc: (lv) => `Compra +${lv} carta(s) no primeiro turno de cada combate.` }),
    S({ id: 'fortuna', name: 'Fortuna', icon: '🍀', rarity: 'uncommon',
      desc: (lv) => `+${10 * lv}% de col e drops de raridade maior.` }),
    S({ id: 'vigor', name: 'Vigor', icon: '❤️', rarity: 'common',
      desc: (lv) => `+${6 * lv} de HP máximo.` }),
  ].map((s) => [s.id, s]),
);

function fmt(n: number) {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

export function skillDef(id: string): SkillDef {
  const d = SKILLS[id];
  if (!d) throw new Error(`Habilidade desconhecida: ${id}`);
  return d;
}

/** Evoluções: carta + habilidade no nível mínimo → carta lendária (checado ao fim de cada combate). */
export interface Evolution {
  card: string;
  skill: string;
  level: number;
  into: string;
}

export const EVOLUTIONS: Evolution[] = [
  { card: 'vertical', skill: 'mestria_espada', level: 3, into: 'vertical_arc' },
  { card: 'linear', skill: 'mestria_florete', level: 3, into: 'linear_estelar' },
  { card: 'whirlwind', skill: 'mestria_machado', level: 3, into: 'ciclone' },
  { card: 'bloqueio_escudo', skill: 'mestria_escudo', level: 3, into: 'egide' },
  { card: 'adaga_rapida', skill: 'mestria_adaga', level: 3, into: 'mil_cortes' },
];
