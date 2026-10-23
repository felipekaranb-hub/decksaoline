import type { StatusId } from './types';

export interface StatusInfo {
  name: string;
  icon: string;
  debuff: boolean;
  /** Diminui 1 no fim do turno do portador */
  decays: boolean;
  desc: (n: number) => string;
}

export const STATUSES: Record<StatusId, StatusInfo> = {
  strength: { name: 'Força', icon: '💪', debuff: false, decays: false, desc: (n) => `Ataques causam +${n} de dano.` },
  dexterity: { name: 'Destreza', icon: '🌀', debuff: false, decays: false, desc: (n) => `Ganha +${n} de Bloqueio das cartas.` },
  vulnerable: { name: 'Vulnerável', icon: '💔', debuff: true, decays: true, desc: (n) => `Recebe 50% a mais de dano de ataques por ${n} turno(s).` },
  weak: { name: 'Fraco', icon: '🥀', debuff: true, decays: true, desc: (n) => `Causa 25% a menos de dano com ataques por ${n} turno(s).` },
  bleed: { name: 'Sangramento', icon: '🩸', debuff: true, decays: false, desc: (n) => `Perde ${n} HP no início do turno, depois diminui em 1.` },
  delay: { name: 'Atraso', icon: '⏳', debuff: true, decays: false, desc: (n) => `Atraso pós-movimento: começa o próximo turno com ${n} de Energia a menos.` },
  switch: { name: 'Switch', icon: '🔁', debuff: false, decays: false, desc: () => `O próximo ataque causa 50% a mais de dano.` },
  ritual: { name: 'Determinação', icon: '🔥', debuff: false, decays: false, desc: (n) => `Ganha ${n} de Força no início de cada turno.` },
  thorns: { name: 'Espinhos', icon: '🌵', debuff: false, decays: false, desc: (n) => `Quem atacar recebe ${n} de dano.` },
  guard: { name: 'Guarda Firme', icon: '🛡️', debuff: false, decays: false, desc: (n) => `Ganha ${n} de Bloqueio no fim do turno.` },
  regen: { name: 'Battle Healing', icon: '💚', debuff: false, decays: false, desc: (n) => `Recupera ${n} HP no fim do turno.` },
  swordDance: { name: 'Dança da Lâmina', icon: '⚔️', debuff: false, decays: false, desc: (n) => `Ganha ${n} de Bloqueio ao usar uma Sword Skill.` },
  flow: { name: 'Pós-movimento Curto', icon: '🌊', debuff: false, decays: false, desc: (n) => `Reduz o Atraso em ${n} no início do turno.` },
  rage: { name: 'Berserker', icon: '😤', debuff: false, decays: false, desc: (n) => `Ganha ${n} de Força ao perder HP por ataques.` },
  drawUp: { name: 'Percepção', icon: '👁️', debuff: false, decays: false, desc: (n) => `Compra +${n} carta(s) por turno.` },
  noDelay: { name: 'Fluxo Perfeito', icon: '✨', debuff: false, decays: true, desc: () => `Sword Skills não causam Atraso neste turno.` },
};
