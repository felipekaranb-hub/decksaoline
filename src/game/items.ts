export interface RelicDef {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  desc: string;
}

const R = (d: RelicDef) => d;

/** Equipamentos/habilidades passivas (as "relíquias" do jogo). */
export const RELICS: Record<string, RelicDef> = Object.fromEntries(
  [
    R({ id: 'escudo_redondo', name: 'Escudo Redondo', icon: '🔰', rarity: 'common', desc: 'Começa cada combate com 6 de Bloqueio.' }),
    R({ id: 'cota_malha', name: 'Cota de Malha', icon: '⛓️', rarity: 'uncommon', desc: 'Começa cada combate com 10 de Bloqueio.' }),
    R({ id: 'pedra_afiar', name: 'Pedra de Afiar', icon: '🪨', rarity: 'common', desc: 'O primeiro ataque de cada combate causa +8 de dano.' }),
    R({ id: 'bolsa_mercador', name: 'Bolsa do Mercador', icon: '👛', rarity: 'common', desc: 'Ganha 30% a mais de col nos combates.' }),
    R({ id: 'anel_forca', name: 'Anel de Força', icon: '💍', rarity: 'uncommon', desc: 'Começa cada combate com 1 de Força.' }),
    R({ id: 'amuleto_sorte', name: 'Amuleto da Sorte', icon: '🧿', rarity: 'uncommon', desc: 'Telas de drop oferecem 4 opções e o primeiro reroll é grátis.' }),
    R({ id: 'bainha_dupla', name: 'Bainha Dupla', icon: '⚔️', rarity: 'uncommon', desc: '+1 slot de Preparo: guarda mais uma carta na mão entre turnos.' }),
    R({ id: 'sobretudo_negro', name: 'Sobretudo Negro', icon: '🧥', rarity: 'rare', desc: 'Começa cada combate com 1 de Destreza.' }),
    R({ id: 'cristal_ressonancia', name: 'Cristal de Ressonância', icon: '🔮', rarity: 'rare', desc: 'Começa cada turno com +0,5 Mult.' }),

    R({ id: 'talwar_kobold', name: 'Nodachi do Senhor Kobold', icon: '🗡️', rarity: 'boss', desc: '+1 de Energia por turno. Começa cada combate com 1 de Atraso.' }),
    R({ id: 'coroa_taurus', name: 'Coroa do Rei Taurus', icon: '👑', rarity: 'boss', desc: '+1 de Energia por turno. Inimigos começam com 1 de Força.' }),
    R({ id: 'cristal_vida', name: 'Fragmento de Cristal Vital', icon: '💎', rarity: 'boss', desc: '+15 de HP máximo e recupera todo o HP.' }),
  ].map((r) => [r.id, r]),
);

export interface PotionDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  combatOnly: boolean;
  /** Pode ser usada fora de combate (mapa) */
  outOfCombat: boolean;
  needsTarget?: boolean;
  price: number;
  rarity: 'common' | 'uncommon';
}

/** Consumíveis. Cristais de teleporte não funcionam em salas de chefe (área anti-cristal). */
export const POTIONS: Record<string, PotionDef> = {
  pocao_cura: { id: 'pocao_cura', name: 'Poção de Cura', icon: '🧪', desc: 'Recupera 15 HP.', combatOnly: false, outOfCombat: true, price: 40, rarity: 'common' },
  cristal_cura: { id: 'cristal_cura', name: 'Cristal de Cura', icon: '💠', desc: 'Recupera 35% do HP máximo.', combatOnly: false, outOfCombat: true, price: 75, rarity: 'uncommon' },
  cristal_teleporte: { id: 'cristal_teleporte', name: 'Cristal de Teleporte', icon: '🔷', desc: 'Foge de um combate (exceto chefes). Sem recompensas.', combatOnly: true, outOfCombat: false, price: 60, rarity: 'uncommon' },
  pocao_forca: { id: 'pocao_forca', name: 'Poção de Força', icon: '🍷', desc: 'Ganha 2 de Força neste combate.', combatOnly: true, outOfCombat: false, price: 50, rarity: 'common' },
  bomba_fumaca: { id: 'bomba_fumaca', name: 'Bomba de Fumaça', icon: '💨', desc: 'Aplica 2 de Fraco a todos os inimigos.', combatOnly: true, outOfCombat: false, price: 45, rarity: 'common' },
  faca_arremesso: { id: 'faca_arremesso', name: 'Facas de Arremesso', icon: '🔪', desc: 'Causa 12 de dano a um inimigo.', combatOnly: true, outOfCombat: false, needsTarget: true, price: 45, rarity: 'common' },
};

export const MAX_POTIONS = 3;
