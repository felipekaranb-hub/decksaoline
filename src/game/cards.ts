import { STATUSES } from './statuses';
import type { CardDef, CardInst, CardStats, Rarity, Tag } from './types';

const C = (d: CardDef) => d;

export const TAGS: Record<Tag, { name: string; icon: string; color: string }> = {
  espada: { name: 'Espada', icon: '🗡️', color: '#5fa8ff' },
  florete: { name: 'Florete', icon: '🤺', color: '#ff7ad9' },
  machado: { name: 'Machado', icon: '🪓', color: '#ff7a45' },
  escudo: { name: 'Escudo', icon: '🛡️', color: '#ffd166' },
  adaga: { name: 'Adaga', icon: '🔪', color: '#7dffa8' },
};
export const ALL_TAGS = Object.keys(TAGS) as Tag[];

export const CARDS: Record<string, CardDef> = Object.fromEntries(
  [
    // ───────────── Iniciais (sem tag: você ainda é um novato) ─────────────
    C({ id: 'golpe', name: 'Golpe', type: 'attack', rarity: 'starter', tags: [],
      base: { cost: 1, effects: [{ k: 'dmg', n: 6 }] }, up: { effects: [{ k: 'dmg', n: 9 }] } }),
    C({ id: 'defender', name: 'Defender', type: 'skill', rarity: 'starter', tags: [],
      base: { cost: 1, effects: [{ k: 'block', n: 5 }] }, up: { effects: [{ k: 'block', n: 8 }] } }),
    C({ id: 'golpe_carregado', name: 'Golpe Carregado', type: 'swordskill', rarity: 'starter', tags: [],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 10 }] }, up: { effects: [{ k: 'dmg', n: 14 }] },
      flavor: 'Você ainda não sabe o nome da técnica. Mas o sistema sabe.' }),

    // ───────────── Neutras ─────────────
    C({ id: 'golpe_rapido', name: 'Golpe Rápido', type: 'attack', rarity: 'common', tags: [],
      base: { cost: 0, effects: [{ k: 'dmg', n: 4 }] }, up: { effects: [{ k: 'dmg', n: 7 }] } }),
    C({ id: 'concentracao', name: 'Concentração', type: 'skill', rarity: 'common', tags: [],
      base: { cost: 1, effects: [{ k: 'mult', n: 1 }, { k: 'draw', n: 1 }] },
      up: { effects: [{ k: 'mult', n: 1.5 }, { k: 'draw', n: 1 }] } }),
    C({ id: 'ritmo', name: 'Ritmo', type: 'skill', rarity: 'common', tags: [],
      base: { cost: 0, effects: [{ k: 'mult', n: 0.5 }] }, up: { effects: [{ k: 'mult', n: 1 }] } }),
    C({ id: 'switch', name: 'Switch!', type: 'skill', rarity: 'common', tags: [],
      base: { cost: 1, effects: [{ k: 'block', n: 4 }, { k: 'status', s: 'switch', n: 1, to: 'self' }] },
      up: { effects: [{ k: 'block', n: 7 }, { k: 'status', s: 'switch', n: 1, to: 'self' }] },
      flavor: 'Troca de posição com o parceiro no meio da luta.' }),
    C({ id: 'respirar', name: 'Respirar Fundo', type: 'skill', rarity: 'common', tags: [],
      base: { cost: 1, effects: [{ k: 'draw', n: 2 }] }, up: { effects: [{ k: 'draw', n: 3 }] } }),
    C({ id: 'postura', name: 'Postura Defensiva', type: 'skill', rarity: 'common', tags: [],
      base: { cost: 1, effects: [{ k: 'block', n: 8 }] }, up: { effects: [{ k: 'block', n: 11 }] } }),
    C({ id: 'sonic_leap', name: 'Sonic Leap', type: 'swordskill', rarity: 'common', tags: [],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 12 }] }, up: { effects: [{ k: 'dmg', n: 16 }] } }),
    C({ id: 'aparar', name: 'Aparar', type: 'attack', rarity: 'uncommon', tags: [],
      base: { cost: 1, effects: [{ k: 'block', n: 6 }, { k: 'dmg', n: 4 }] },
      up: { effects: [{ k: 'block', n: 8 }, { k: 'dmg', n: 7 }] } }),
    C({ id: 'analise', name: 'Análise de Padrões', type: 'skill', rarity: 'uncommon', tags: [],
      base: { cost: 1, effects: [{ k: 'status', s: 'vulnerable', n: 2, to: 'enemy' }, { k: 'draw', n: 1 }] },
      up: { effects: [{ k: 'status', s: 'vulnerable', n: 3, to: 'enemy' }, { k: 'draw', n: 1 }] },
      flavor: 'Todo mob segue um algoritmo. Todo algoritmo tem uma brecha.' }),
    C({ id: 'adrenalina', name: 'Adrenalina', type: 'skill', rarity: 'uncommon', tags: [],
      base: { cost: 0, exhaust: true, effects: [{ k: 'energy', n: 1 }, { k: 'draw', n: 1 }] },
      up: { effects: [{ k: 'energy', n: 2 }, { k: 'draw', n: 1 }] } }),
    C({ id: 'coragem', name: 'Grito de Coragem', type: 'skill', rarity: 'uncommon', tags: [],
      base: { cost: 1, exhaust: true, effects: [{ k: 'status', s: 'strength', n: 2, to: 'self' }] },
      up: { effects: [{ k: 'status', s: 'strength', n: 3, to: 'self' }] } }),
    C({ id: 'percepcao', name: 'Percepção', type: 'power', rarity: 'uncommon', tags: [],
      base: { cost: 1, effects: [{ k: 'status', s: 'drawUp', n: 1, to: 'self' }] }, up: { cost: 0 } }),
    C({ id: 'determinacao', name: 'Determinação', type: 'power', rarity: 'rare', tags: [],
      base: { cost: 2, effects: [{ k: 'status', s: 'ritual', n: 1, to: 'self' }] }, up: { cost: 1 },
      flavor: 'Não vou morrer neste castelo.' }),
    C({ id: 'battle_healing', name: 'Battle Healing', type: 'power', rarity: 'rare', tags: [],
      base: { cost: 2, effects: [{ k: 'status', s: 'regen', n: 2, to: 'self' }] },
      up: { effects: [{ k: 'status', s: 'regen', n: 3, to: 'self' }] } }),

    // ───────────── Espada (uma mão) ─────────────
    C({ id: 'corte_cruzado', name: 'Corte Cruzado', type: 'attack', rarity: 'common', tags: ['espada'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 4, times: 2 }] }, up: { effects: [{ k: 'dmg', n: 6, times: 2 }] } }),
    C({ id: 'slant', name: 'Slant', type: 'swordskill', rarity: 'common', tags: ['espada'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 10 }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'dmg', n: 13 }, { k: 'mult', n: 0.5 }] },
      flavor: 'A primeira Sword Skill que todo espadachim aprende.' }),
    C({ id: 'vertical', name: 'Vertical', type: 'swordskill', rarity: 'common', tags: ['espada'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 11 }, { k: 'block', n: 3 }] },
      up: { effects: [{ k: 'dmg', n: 15 }, { k: 'block', n: 4 }] } }),
    C({ id: 'horizontal', name: 'Horizontal', type: 'swordskill', rarity: 'common', tags: ['espada'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 7, all: true }] },
      up: { effects: [{ k: 'dmg', n: 10, all: true }] } }),
    C({ id: 'rage_spike', name: 'Rage Spike', type: 'swordskill', rarity: 'common', tags: ['espada'],
      base: { cost: 0, delay: 1, effects: [{ k: 'dmg', n: 6 }] }, up: { effects: [{ k: 'dmg', n: 9 }] } }),
    C({ id: 'vorpal_strike', name: 'Vorpal Strike', type: 'swordskill', rarity: 'rare', tags: ['espada'],
      base: { cost: 2, delay: 2, effects: [{ k: 'dmg', n: 28 }] }, up: { effects: [{ k: 'dmg', n: 38 }] } }),
    C({ id: 'horizontal_square', name: 'Horizontal Square', type: 'swordskill', rarity: 'rare', tags: ['espada'],
      base: { cost: 2, delay: 2, effects: [{ k: 'dmg', n: 5, times: 4 }, { k: 'mult', n: 1 }] },
      up: { effects: [{ k: 'dmg', n: 7, times: 4 }, { k: 'mult', n: 1 }] } }),
    C({ id: 'savage_fulcrum', name: 'Savage Fulcrum', type: 'swordskill', rarity: 'epic', tags: ['espada'],
      base: { cost: 2, delay: 2, effects: [{ k: 'dmg', n: 8, times: 3 }, { k: 'status', s: 'vulnerable', n: 2, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 10, times: 3 }, { k: 'status', s: 'vulnerable', n: 3, to: 'enemy' }] } }),

    // ───────────── Florete ─────────────
    C({ id: 'estocada', name: 'Estocada', type: 'attack', rarity: 'common', tags: ['florete'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 5 }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'dmg', n: 7 }, { k: 'mult', n: 0.5 }] } }),
    C({ id: 'linear', name: 'Linear', type: 'swordskill', rarity: 'common', tags: ['florete'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 8 }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'dmg', n: 11 }, { k: 'mult', n: 0.5 }] },
      flavor: 'Tão rápida que deixa um rastro de luz.' }),
    C({ id: 'parallel_sting', name: 'Parallel Sting', type: 'swordskill', rarity: 'common', tags: ['florete'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 5, times: 2 }] },
      up: { effects: [{ k: 'dmg', n: 7, times: 2 }] } }),
    C({ id: 'passo_leve', name: 'Passo Leve', type: 'skill', rarity: 'common', tags: ['florete'],
      base: { cost: 0, effects: [{ k: 'block', n: 3 }, { k: 'draw', n: 1 }] },
      up: { effects: [{ k: 'block', n: 5 }, { k: 'draw', n: 1 }] } }),
    C({ id: 'leitura', name: 'Leitura de Movimento', type: 'skill', rarity: 'uncommon', tags: ['florete'],
      base: { cost: 1, effects: [{ k: 'block', n: 7 }, { k: 'draw', n: 1 }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'block', n: 10 }, { k: 'draw', n: 1 }, { k: 'mult', n: 0.5 }] } }),
    C({ id: 'shooting_star', name: 'Shooting Star', type: 'swordskill', rarity: 'uncommon', tags: ['florete'],
      base: { cost: 1, delay: 1, effects: [{ k: 'mult', n: 1 }, { k: 'dmg', n: 8 }] },
      up: { effects: [{ k: 'mult', n: 1.5 }, { k: 'dmg', n: 10 }] } }),
    C({ id: 'pos_movimento', name: 'Pós-movimento Curto', type: 'power', rarity: 'uncommon', tags: ['florete'],
      base: { cost: 1, effects: [{ k: 'status', s: 'flow', n: 1, to: 'self' }] }, up: { cost: 0 } }),
    C({ id: 'star_splash', name: 'Star Splash', type: 'swordskill', rarity: 'rare', tags: ['florete'],
      base: { cost: 2, delay: 2, effects: [{ k: 'dmg', n: 3, times: 8 }] },
      up: { effects: [{ k: 'dmg', n: 4, times: 8 }] } }),
    C({ id: 'danca_lamina', name: 'Dança da Lâmina', type: 'power', rarity: 'rare', tags: ['florete'],
      base: { cost: 1, effects: [{ k: 'status', s: 'swordDance', n: 4, to: 'self' }] },
      up: { effects: [{ k: 'status', s: 'swordDance', n: 6, to: 'self' }] } }),
    C({ id: 'flashing_penetrator', name: 'Flashing Penetrator', type: 'swordskill', rarity: 'epic', tags: ['florete'],
      base: { cost: 2, delay: 2, effects: [{ k: 'xmult', n: 1.5 }, { k: 'dmg', n: 20 }] },
      up: { effects: [{ k: 'xmult', n: 2 }, { k: 'dmg', n: 22 }] } }),

    // ───────────── Machado (duas mãos) ─────────────
    C({ id: 'machadada', name: 'Machadada', type: 'attack', rarity: 'common', tags: ['machado'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 8 }] }, up: { effects: [{ k: 'dmg', n: 11 }] } }),
    C({ id: 'whirlwind', name: 'Whirlwind', type: 'swordskill', rarity: 'common', tags: ['machado'],
      base: { cost: 2, delay: 1, effects: [{ k: 'dmg', n: 9, all: true }] },
      up: { effects: [{ k: 'dmg', n: 13, all: true }] } }),
    C({ id: 'golpe_ombro', name: 'Golpe de Ombro', type: 'attack', rarity: 'common', tags: ['machado'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 8 }, { k: 'block', n: 4 }] },
      up: { effects: [{ k: 'dmg', n: 10 }, { k: 'block', n: 6 }] } }),
    C({ id: 'esmagador', name: 'Golpe Esmagador', type: 'attack', rarity: 'common', tags: ['machado'],
      base: { cost: 2, effects: [{ k: 'dmg', n: 14 }, { k: 'status', s: 'vulnerable', n: 2, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 18 }, { k: 'status', s: 'vulnerable', n: 3, to: 'enemy' }] } }),
    C({ id: 'furia', name: 'Fúria', type: 'skill', rarity: 'uncommon', tags: ['machado'],
      base: { cost: 1, effects: [{ k: 'loseHp', n: 3 }, { k: 'status', s: 'strength', n: 2, to: 'self' }] },
      up: { effects: [{ k: 'loseHp', n: 3 }, { k: 'status', s: 'strength', n: 3, to: 'self' }] } }),
    C({ id: 'avalanche', name: 'Avalanche', type: 'swordskill', rarity: 'uncommon', tags: ['machado'],
      base: { cost: 2, delay: 1, effects: [{ k: 'dmg', n: 22 }] }, up: { effects: [{ k: 'dmg', n: 29 }] } }),
    C({ id: 'pele_ferro', name: 'Pele de Ferro', type: 'power', rarity: 'uncommon', tags: ['machado'],
      base: { cost: 1, effects: [{ k: 'status', s: 'thorns', n: 3, to: 'self' }] },
      up: { effects: [{ k: 'status', s: 'thorns', n: 5, to: 'self' }] } }),
    C({ id: 'berserker', name: 'Berserker', type: 'power', rarity: 'rare', tags: ['machado'],
      base: { cost: 2, effects: [{ k: 'status', s: 'rage', n: 1, to: 'self' }] }, up: { cost: 1 } }),
    C({ id: 'grand_destruct', name: 'Grand Destruct', type: 'swordskill', rarity: 'epic', tags: ['machado'],
      base: { cost: 3, delay: 2, effects: [{ k: 'dmg', n: 40 }] }, up: { effects: [{ k: 'dmg', n: 52 }] } }),

    // ───────────── Escudo ─────────────
    C({ id: 'bloqueio_escudo', name: 'Bloqueio com Escudo', type: 'skill', rarity: 'common', tags: ['escudo'],
      base: { cost: 1, effects: [{ k: 'block', n: 7 }, { k: 'status', s: 'weak', n: 1, to: 'enemy' }] },
      up: { effects: [{ k: 'block', n: 10 }, { k: 'status', s: 'weak', n: 1, to: 'enemy' }] } }),
    C({ id: 'muralha', name: 'Muralha', type: 'skill', rarity: 'common', tags: ['escudo'],
      base: { cost: 1, effects: [{ k: 'mult', n: 0.5 }, { k: 'block', n: 6 }] },
      up: { effects: [{ k: 'mult', n: 0.5 }, { k: 'block', n: 9 }] } }),
    C({ id: 'investida_escudo', name: 'Investida de Escudo', type: 'attack', rarity: 'uncommon', tags: ['escudo'],
      base: { cost: 1, effects: [{ k: 'dmgBlock' }] }, up: { cost: 0 } }),
    C({ id: 'fortaleza', name: 'Fortaleza', type: 'skill', rarity: 'uncommon', tags: ['escudo'],
      base: { cost: 2, effects: [{ k: 'block', n: 15 }] }, up: { effects: [{ k: 'block', n: 20 }] } }),
    C({ id: 'guarda_firme', name: 'Guarda Firme', type: 'power', rarity: 'uncommon', tags: ['escudo'],
      base: { cost: 1, effects: [{ k: 'status', s: 'guard', n: 3, to: 'self' }] },
      up: { effects: [{ k: 'status', s: 'guard', n: 5, to: 'self' }] } }),
    C({ id: 'parede_escudos', name: 'Parede de Escudos', type: 'skill', rarity: 'rare', tags: ['escudo'],
      base: { cost: 2, effects: [{ k: 'mult', n: 1 }, { k: 'block', n: 12 }] },
      up: { effects: [{ k: 'mult', n: 1.5 }, { k: 'block', n: 14 }] } }),

    // ───────────── Adaga ─────────────
    C({ id: 'adaga_rapida', name: 'Adaga Rápida', type: 'attack', rarity: 'common', tags: ['adaga'],
      base: { cost: 0, effects: [{ k: 'dmg', n: 3 }, { k: 'status', s: 'bleed', n: 2, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 4 }, { k: 'status', s: 'bleed', n: 3, to: 'enemy' }] } }),
    C({ id: 'corte_venenoso', name: 'Corte Venenoso', type: 'attack', rarity: 'common', tags: ['adaga'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 4 }, { k: 'status', s: 'bleed', n: 4, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 5 }, { k: 'status', s: 'bleed', n: 6, to: 'enemy' }] } }),
    C({ id: 'rapid_bite', name: 'Rapid Bite', type: 'swordskill', rarity: 'common', tags: ['adaga'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 5, times: 2 }, { k: 'status', s: 'bleed', n: 2, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 6, times: 2 }, { k: 'status', s: 'bleed', n: 3, to: 'enemy' }] } }),
    C({ id: 'furtividade', name: 'Furtividade', type: 'skill', rarity: 'common', tags: ['adaga'],
      base: { cost: 1, effects: [{ k: 'block', n: 6 }, { k: 'draw', n: 1 }] },
      up: { effects: [{ k: 'block', n: 9 }, { k: 'draw', n: 1 }] } }),
    C({ id: 'armor_piercer', name: 'Armor Piercer', type: 'swordskill', rarity: 'uncommon', tags: ['adaga'],
      base: { cost: 1, delay: 1, effects: [{ k: 'dmg', n: 9 }, { k: 'status', s: 'vulnerable', n: 2, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 12 }, { k: 'status', s: 'vulnerable', n: 2, to: 'enemy' }] } }),
    C({ id: 'mil_agulhas', name: 'Mil Agulhas', type: 'attack', rarity: 'rare', tags: ['adaga'],
      base: { cost: 2, effects: [{ k: 'dmg', n: 2, times: 6 }, { k: 'status', s: 'bleed', n: 6, to: 'enemy' }] },
      up: { effects: [{ k: 'dmg', n: 3, times: 6 }, { k: 'status', s: 'bleed', n: 8, to: 'enemy' }] } }),

    // ───────────── Híbridas (pontes entre builds) ─────────────
    C({ id: 'golpe_escudo', name: 'Espada e Escudo', type: 'attack', rarity: 'uncommon', tags: ['espada', 'escudo'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 6 }, { k: 'block', n: 5 }] },
      up: { effects: [{ k: 'dmg', n: 8 }, { k: 'block', n: 7 }] } }),
    C({ id: 'lamina_dupla', name: 'Lâmina Dupla', type: 'attack', rarity: 'uncommon', tags: ['espada', 'adaga'],
      base: { cost: 1, effects: [{ k: 'dmg', n: 4, times: 3 }] }, up: { effects: [{ k: 'dmg', n: 5, times: 3 }] } }),
    C({ id: 'estocada_pesada', name: 'Estocada Pesada', type: 'attack', rarity: 'uncommon', tags: ['florete', 'machado'],
      base: { cost: 2, effects: [{ k: 'dmg', n: 15 }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'dmg', n: 20 }, { k: 'mult', n: 0.5 }] } }),
    C({ id: 'escudo_espinhos', name: 'Escudo de Espinhos', type: 'skill', rarity: 'uncommon', tags: ['escudo', 'adaga'],
      base: { cost: 1, effects: [{ k: 'block', n: 6 }, { k: 'status', s: 'bleed', n: 3, to: 'enemy' }] },
      up: { effects: [{ k: 'block', n: 8 }, { k: 'status', s: 'bleed', n: 5, to: 'enemy' }] } }),

    // ───────────── Cartas de Side Quest (liberam combos) ─────────────
    C({ id: 'apice', name: 'Ápice', type: 'skill', rarity: 'epic', tags: [], questLocked: true,
      base: { cost: 1, exhaust: true, effects: [{ k: 'xmult', n: 2 }] }, up: { exhaust: false },
      flavor: 'Quando tudo se encaixa, o sistema parece desacelerar.' }),
    C({ id: 'skill_chain', name: 'Skill Chain', type: 'skill', rarity: 'epic', tags: [], questLocked: true,
      base: { cost: 1, effects: [{ k: 'xmult', n: 1.5 }, { k: 'status', s: 'noDelay', n: 1, to: 'self' }] },
      up: { cost: 0 } }),
    C({ id: 'mestre_armas', name: 'Mestre de Armas', type: 'skill', rarity: 'epic', tags: [], questLocked: true,
      base: { cost: 0, effects: [{ k: 'multPerTag', n: 0.5 }] }, up: { effects: [{ k: 'multPerTag', n: 0.75 }] } }),
    C({ id: 'presa_lobo', name: 'Presa de Lobo', type: 'attack', rarity: 'epic', tags: ['adaga'], questLocked: true,
      base: { cost: 1, effects: [{ k: 'dmg', n: 3, times: 2 }, { k: 'status', s: 'bleed', n: 3, to: 'enemy' }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'dmg', n: 4, times: 2 }, { k: 'status', s: 'bleed', n: 5, to: 'enemy' }, { k: 'mult', n: 0.5 }] } }),
    C({ id: 'hemorragia', name: 'Hemorragia', type: 'skill', rarity: 'epic', tags: ['adaga'], questLocked: true,
      base: { cost: 1, exhaust: true, effects: [{ k: 'bleedMult', n: 2 }] }, up: { exhaust: false } }),
    C({ id: 'contra_escudo', name: 'Contra-golpe de Escudo', type: 'attack', rarity: 'epic', tags: ['escudo'], questLocked: true,
      base: { cost: 1, effects: [{ k: 'block', n: 5 }, { k: 'dmgBlock' }] },
      up: { effects: [{ k: 'block', n: 9 }, { k: 'dmgBlock' }] } }),
    C({ id: 'golpe_unico', name: 'Um Golpe Só', type: 'swordskill', rarity: 'epic', tags: ['machado'], questLocked: true,
      base: { cost: 2, delay: 2, effects: [{ k: 'xmult', n: 2 }, { k: 'dmg', n: 18 }] },
      up: { effects: [{ k: 'xmult', n: 2.5 }, { k: 'dmg', n: 20 }] } }),
    C({ id: 'guarda_perfeita', name: 'Guarda Perfeita', type: 'skill', rarity: 'epic', tags: ['escudo', 'florete'], questLocked: true,
      base: { cost: 1, effects: [{ k: 'block', n: 8 }, { k: 'energy', n: 1 }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'block', n: 11 }, { k: 'energy', n: 1 }, { k: 'mult', n: 0.5 }] } }),

    // ───────────── Evoluções (estilo Vampire Survivors) ─────────────
    C({ id: 'vertical_arc', name: 'Vertical Arc', type: 'swordskill', rarity: 'legendary', tags: ['espada'], evolved: true,
      base: { cost: 1, delay: 1, effects: [{ k: 'mult', n: 1 }, { k: 'dmg', n: 12, times: 2 }, { k: 'block', n: 6 }] },
      up: { effects: [{ k: 'mult', n: 1.5 }, { k: 'dmg', n: 15, times: 2 }, { k: 'block', n: 8 }] } }),
    C({ id: 'linear_estelar', name: 'Linear Estelar', type: 'swordskill', rarity: 'legendary', tags: ['florete'], evolved: true,
      base: { cost: 1, delay: 1, effects: [{ k: 'mult', n: 1 }, { k: 'dmg', n: 5, times: 4 }] },
      up: { effects: [{ k: 'mult', n: 1.5 }, { k: 'dmg', n: 6, times: 4 }] } }),
    C({ id: 'ciclone', name: 'Ciclone Sangrento', type: 'swordskill', rarity: 'legendary', tags: ['machado'], evolved: true,
      base: { cost: 2, delay: 1, effects: [{ k: 'xmult', n: 1.5 }, { k: 'dmg', n: 14, all: true }] },
      up: { effects: [{ k: 'xmult', n: 1.5 }, { k: 'dmg', n: 18, all: true }] } }),
    C({ id: 'egide', name: 'Égide', type: 'skill', rarity: 'legendary', tags: ['escudo'], evolved: true,
      base: { cost: 1, effects: [{ k: 'mult', n: 1 }, { k: 'block', n: 12 }, { k: 'status', s: 'weak', n: 2, to: 'allEnemies' }] },
      up: { effects: [{ k: 'mult', n: 1.5 }, { k: 'block', n: 15 }, { k: 'status', s: 'weak', n: 2, to: 'allEnemies' }] } }),
    C({ id: 'mil_cortes', name: 'Mil Cortes', type: 'attack', rarity: 'legendary', tags: ['adaga'], evolved: true,
      base: { cost: 0, effects: [{ k: 'dmg', n: 3, times: 3 }, { k: 'status', s: 'bleed', n: 4, to: 'enemy' }, { k: 'mult', n: 0.5 }] },
      up: { effects: [{ k: 'dmg', n: 4, times: 3 }, { k: 'status', s: 'bleed', n: 6, to: 'enemy' }, { k: 'mult', n: 0.5 }] } }),

    // ───────────── Maldições ─────────────
    C({ id: 'trauma', name: 'Trauma', type: 'curse', rarity: 'curse', tags: [],
      base: { cost: null, effects: [] }, up: {},
      flavor: 'A barra de HP de alguém chegando a zero. De novo e de novo.' }),
    C({ id: 'remorso', name: 'Remorso', type: 'curse', rarity: 'curse', tags: [], endTurnLoseHp: 2,
      base: { cost: null, effects: [] }, up: {},
      flavor: 'Você poderia ter ajudado.' }),
  ].map((c) => [c.id, c]),
);

/** Baralho do novato: sem tags, sem classe. */
export const STARTER_DECK = ['golpe', 'golpe', 'golpe', 'golpe', 'golpe', 'defender', 'defender', 'defender', 'defender', 'golpe_carregado'];

/** Opções de "primeira arma" oferecidas no início (uma por tag). */
export const FIRST_WEAPON: Record<Tag, string> = {
  espada: 'slant',
  florete: 'linear',
  machado: 'whirlwind',
  escudo: 'bloqueio_escudo',
  adaga: 'rapid_bite',
};

export function cardDef(id: string): CardDef {
  const d = CARDS[id];
  if (!d) throw new Error(`Carta desconhecida: ${id}`);
  return d;
}

export function cardStats(inst: Pick<CardInst, 'id' | 'up'>): CardStats {
  const d = cardDef(inst.id);
  return inst.up ? { ...d.base, ...d.up } : d.base;
}

export function cardName(inst: Pick<CardInst, 'id' | 'up'>): string {
  return cardDef(inst.id).name + (inst.up ? '+' : '');
}

export function canUpgrade(inst: Pick<CardInst, 'id' | 'up'>): boolean {
  return !inst.up && Object.keys(cardDef(inst.id).up).length > 0;
}

/** Cartas disponíveis em drops para uma raridade. */
export function dropPool(rarity: Rarity, unlocked: string[]): string[] {
  return Object.values(CARDS)
    .filter((c) => c.rarity === rarity && !c.evolved && (!c.questLocked || unlocked.includes(c.id)))
    .map((c) => c.id);
}

export function needsTarget(inst: Pick<CardInst, 'id' | 'up'>): boolean {
  return cardStats(inst).effects.some(
    (e) => (e.k === 'dmg' && !e.all) || e.k === 'dmgBlock' || e.k === 'bleedMult' || (e.k === 'status' && e.to === 'enemy'),
  );
}

export const fmtMult = (n: number) => (Math.round(n * 100) / 100).toString().replace('.', ',');

/** Contexto opcional para mostrar números já modificados durante o combate. */
export interface DescribeCtx {
  dmg: (base: number) => number;
  blk: (base: number) => number;
  block: number;
}

function num(base: number, final?: number): string {
  if (final === undefined || final === base) return String(base);
  return `<b class="${final > base ? 'buffed' : 'nerfed'}">${final}</b>`;
}

export function describe(inst: Pick<CardInst, 'id' | 'up'>, ctx?: DescribeCtx): string {
  const d = cardDef(inst.id);
  const s = cardStats(inst);
  const lines: string[] = [];
  for (const e of s.effects) {
    switch (e.k) {
      case 'dmg': {
        const times = e.times && e.times > 1 ? ` ${e.times}x` : '';
        lines.push(`Causa ${num(e.n, ctx?.dmg(e.n))} de dano${times}${e.all ? ' a TODOS' : ''}.`);
        break;
      }
      case 'dmgBlock':
        lines.push(`Causa dano igual ao seu Bloqueio${ctx ? ` (${ctx.dmg(ctx.block)})` : ''}.`);
        break;
      case 'block':
        lines.push(`Ganha ${num(e.n, ctx?.blk(e.n))} de Bloqueio.`);
        break;
      case 'draw':
        lines.push(`Compra ${e.n} carta${e.n > 1 ? 's' : ''}.`);
        break;
      case 'energy':
        lines.push(`Ganha ${e.n} de Energia.`);
        break;
      case 'mult':
        lines.push(`<span class="kw-mult">+${fmtMult(e.n)} Mult</span>`);
        break;
      case 'xmult':
        lines.push(`<span class="kw-xmult">×${fmtMult(e.n)} Mult</span>`);
        break;
      case 'multPerTag':
        lines.push(`<span class="kw-mult">+${fmtMult(e.n)} Mult</span> por tag diferente jogada neste turno.`);
        break;
      case 'bleedMult':
        lines.push(`Multiplica o Sangramento do alvo por ${e.n}.`);
        break;
      case 'status': {
        const info = STATUSES[e.s];
        if (e.to === 'self') {
          if (d.type === 'power' || e.s === 'switch' || e.s === 'noDelay') lines.push(info.desc(e.n));
          else lines.push(`Ganha ${e.n} de ${info.name}.`);
        } else {
          lines.push(`Aplica ${e.n} de ${info.name}${e.to === 'allEnemies' ? ' a TODOS' : ''}.`);
        }
        break;
      }
      case 'heal':
        lines.push(`Recupera ${e.n} HP.`);
        break;
      case 'loseHp':
        lines.push(`Perde ${e.n} HP.`);
        break;
      case 'addCard':
        lines.push(`Adiciona ${e.n ?? 1} ${cardDef(e.id).name} ao baralho.`);
        break;
    }
  }
  if (s.cost === null) lines.push('Injogável.');
  if (d.endTurnLoseHp) lines.push(`No fim do turno, se estiver na mão, perde ${d.endTurnLoseHp} HP.`);
  if (s.delay) lines.push(`<span class="kw-delay">Atraso ${s.delay}</span>`);
  if (s.exhaust) lines.push('<span class="kw">Exaurir</span>');
  return lines.join('<br>');
}

export const TYPE_LABEL: Record<CardDef['type'], string> = {
  attack: 'Ataque',
  swordskill: 'Sword Skill',
  skill: 'Habilidade',
  power: 'Poder',
  curse: 'Maldição',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  starter: 'Inicial',
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  curse: 'Maldição',
};
