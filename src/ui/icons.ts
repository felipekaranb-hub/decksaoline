import type { NodeType, StatusId } from '../game/types';
import { GAME_ICONS } from './gameIcons';

/** Ícone do game-icons.net como SVG inline (herda a cor via currentColor). */
export function gi(name: string, cls = ''): string {
  const icon = GAME_ICONS[name];
  if (!icon) return '';
  return `<svg class="gi ${cls}" viewBox="0 0 512 512" aria-hidden="true"><path d="${icon[1]}"/></svg>`;
}

/** Mesma coisa, mas para usar dentro de outro <svg> (mapa). */
export function giNested(name: string, size: number): string {
  const icon = GAME_ICONS[name];
  if (!icon) return '';
  return `<svg class="gi" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" viewBox="0 0 512 512"><path d="${icon[1]}"/></svg>`;
}

export const CARD_ICON: Record<string, string> = {
  golpe: 'broadsword', defender: 'checked-shield', golpe_carregado: 'sword-brandish',
  golpe_rapido: 'saber-slash', concentracao: 'eye-target', ritmo: 'energise', switch: 'back-forth',
  respirar: 'meditation', postura: 'shield-reflect', sonic_leap: 'sprint', aparar: 'sword-clash',
  analise: 'magnifying-glass', adrenalina: 'lightning-arc', coragem: 'biceps', percepcao: 'radar-sweep',
  determinacao: 'fire-ring', battle_healing: 'heart-plus',
  corte_cruzado: 'crossed-swords', slant: 'saber-slash', vertical: 'rune-sword', horizontal: 'sword-spin',
  rage_spike: 'sword-wound', vorpal_strike: 'spinning-sword', horizontal_square: 'star-swirl', savage_fulcrum: 'bloody-sword',
  estocada: 'fencer', linear: 'arrow-dunk', parallel_sting: 'stiletto', passo_leve: 'dodge', leitura: 'eye-target',
  shooting_star: 'star-swirl', pos_movimento: 'hourglass', star_splash: 'sparkles', danca_lamina: 'sword-spin',
  flashing_penetrator: 'lightning-trio',
  machadada: 'battle-axe', whirlwind: 'whirlwind', golpe_ombro: 'shield-bash', esmagador: 'flat-hammer', furia: 'biceps',
  avalanche: 'heavy-fall', pele_ferro: 'armor-vest', berserker: 'explosion-rays', grand_destruct: 'axe-swing',
  bloqueio_escudo: 'round-shield', muralha: 'shield-echoes', investida_escudo: 'shield-bash', fortaleza: 'castle',
  guarda_firme: 'checked-shield', parede_escudos: 'shield-echoes',
  adaga_rapida: 'plain-dagger', corte_venenoso: 'dripping-sword', rapid_bite: 'thrown-daggers', furtividade: 'hood',
  armor_piercer: 'stiletto', mil_agulhas: 'thrown-daggers',
  golpe_escudo: 'slashed-shield', lamina_dupla: 'crossed-swords', estocada_pesada: 'fencer', escudo_espinhos: 'thorny-vine',
  apice: 'crystal-growth', skill_chain: 'swirl-string', mestre_armas: 'sword-in-stone', presa_lobo: 'wolf-head',
  hemorragia: 'bleeding-wound', contra_escudo: 'shield-reflect', golpe_unico: 'two-handed-sword', guarda_perfeita: 'shining-heart',
  vertical_arc: 'rune-sword', linear_estelar: 'star-swirl', ciclone: 'tornado', egide: 'shield-reflect', mil_cortes: 'sword-wound',
  trauma: 'broken-heart', remorso: 'pierced-heart',
};

export const STATUS_ICON: Record<StatusId, string> = {
  strength: 'biceps', dexterity: 'dodge', vulnerable: 'cracked-shield', weak: 'broken-shield', bleed: 'drop',
  delay: 'hourglass', switch: 'back-forth', ritual: 'fire-ring', thorns: 'thorny-vine', guard: 'checked-shield',
  regen: 'heart-plus', swordDance: 'sword-spin', flow: 'swirl-string', rage: 'explosion-rays', drawUp: 'radar-sweep',
  noDelay: 'sparkles',
};

export const NODE_ICON: Record<NodeType, string> = {
  mob: 'crossed-swords', elite: 'skull-crossed-bones', event: 'treasure-map', town: 'village', inn: 'bed',
  chest: 'open-treasure-chest', boss: 'crowned-skull',
};

export const RELIC_ICON: Record<string, string> = {
  escudo_redondo: 'round-shield', cota_malha: 'chain-mail', pedra_afiar: 'sword-in-stone', bolsa_mercador: 'two-coins',
  anel_forca: 'ring', amuleto_sorte: 'clover', sobretudo_negro: 'cloak', cristal_ressonancia: 'crystal-wand',
  talwar_kobold: 'two-handed-sword', bainha_dupla: 'crossed-swords', coroa_taurus: 'sharp-crown', cristal_vida: 'heart-bottle',
};

export const POTION_ICON: Record<string, string> = {
  pocao_cura: 'health-potion', cristal_cura: 'heart-bottle', cristal_teleporte: 'magic-swirl', pocao_forca: 'potion-ball',
  bomba_fumaca: 'smoke-bomb', faca_arremesso: 'thrown-daggers',
};

export const SKILL_ICON: Record<string, string> = {
  mestria_espada: 'broadsword', mestria_florete: 'fencer', mestria_machado: 'battle-axe', mestria_escudo: 'round-shield',
  mestria_adaga: 'plain-dagger', harmonia: 'swirl-string', polivalente: 'sword-clash', foco: 'eye-target',
  skill_connect: 'lightning-trio', quick_change: 'back-forth', battle_healing: 'heart-plus', deteccao: 'radar-sweep', fortuna: 'clover', vigor: 'shining-heart',
};

export const UI_ICON = {
  coin: 'two-coins', floor: 'castle', deck: 'card-draw', build: 'spell-book', quest: 'scroll-unfurled',
  draw: 'card-draw', discard: 'trash-can', attack: 'broadsword', block: 'checked-shield', debuff: 'skull-crossed-bones',
  buff: 'biceps', summon: 'magic-swirl', heal: 'heart-plus', curse: 'broken-heart',
};

export const EVENT_ICON: Record<string, string> = {
  npc_quest: 'scroll-unfurled', beater: 'magnifying-glass', orange: 'hood', trap_chest: 'open-treasure-chest',
  campfire: 'fire-ring', help: 'sword-clash', monument: 'broken-heart', merchant: 'two-coins', fountain: 'heart-bottle',
};
