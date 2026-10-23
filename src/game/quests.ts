import type { RunState } from './types';

/**
 * Side quests. Cada uma libera uma carta de combo específica:
 * na primeira vez que é concluída, a carta entra no seu baralho E é liberada
 * permanentemente no pool de drops das próximas runs.
 */
export type QuestTrack =
  /** Acumulativo: derrotar inimigos com estes ids */
  | { k: 'kill'; enemies: string[] }
  /** Melhor valor: Mult atingido em um turno */
  | { k: 'mult' }
  /** Melhor valor: Sword Skills em um turno */
  | { k: 'ssTurn' }
  /** Melhor valor: Bloqueio ganho em um turno */
  | { k: 'blockTurn' }
  /** Melhor valor: Sangramento em um único inimigo */
  | { k: 'bleed' }
  /** Melhor valor: tags diferentes em um turno */
  | { k: 'tagsTurn' }
  /** Melhor valor: dano em um único golpe */
  | { k: 'hit' }
  /** Acumulativo: vitórias sem perder HP */
  | { k: 'cleanWin' };

export interface QuestDef {
  id: string;
  title: string;
  giver: string;
  text: string;
  goalText: string;
  goal: number;
  track: QuestTrack;
  reward: string;
  /** Andar mínimo para aparecer */
  minFloor?: number;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'cacador_lobos',
    title: 'Caçador de Lobos',
    giver: 'Fazendeira de Horunka',
    text: 'Lobos estão atacando as plantações. "Traga paz pra minha fazenda e eu te ensino a lutar como eles."',
    goalText: 'Derrote 5 lobos',
    goal: 5,
    track: { k: 'kill', enemies: ['lobo', 'lobo_alfa'] },
    reward: 'presa_lobo',
  },
  {
    id: 'algoritmo',
    title: 'O Algoritmo',
    giver: 'Analista do Fórum',
    text: '"Todo combo tem uma fórmula. Me mostre um turno perfeito e eu te mostro a próxima variável."',
    goalText: 'Atinja ×4 de Mult em um turno',
    goal: 4,
    track: { k: 'mult' },
    reward: 'apice',
  },
  {
    id: 'encadeamento',
    title: 'Encadeamento',
    giver: 'Instrutor do Coliseu',
    text: '"Uma Sword Skill termina, o corpo trava. Mas e se a próxima começar antes de travar?"',
    goalText: 'Use 3 Sword Skills em um turno',
    goal: 3,
    track: { k: 'ssTurn' },
    reward: 'skill_chain',
  },
  {
    id: 'muralha_tolbana',
    title: 'Muralha de Tolbana',
    giver: 'Capitão da Guarda',
    text: '"Defesa não é esperar. Defesa é preparar o contra-ataque."',
    goalText: 'Ganhe 25 de Bloqueio em um turno',
    goal: 25,
    track: { k: 'blockTurn' },
    reward: 'contra_escudo',
  },
  {
    id: 'arsenal_ambulante',
    title: 'Arsenal Ambulante',
    giver: 'Ferreiro Itinerante',
    text: '"Você carrega tudo quanto é arma... sabe usar todas ao mesmo tempo?"',
    goalText: 'Jogue 3 tags diferentes em um turno',
    goal: 3,
    track: { k: 'tagsTurn' },
    reward: 'mestre_armas',
  },
  {
    id: 'sangue_nevoa',
    title: 'Sangue na Névoa',
    giver: 'Informante de Capuz',
    text: '"Feridas pequenas, muitas. É assim que os grandes caem."',
    goalText: 'Acumule 12 de Sangramento em um inimigo',
    goal: 12,
    track: { k: 'bleed' },
    reward: 'hemorragia',
  },
  {
    id: 'um_golpe',
    title: 'Um Golpe Só',
    giver: 'Veterano de Duas Mãos',
    text: '"Por que bater dez vezes se dá pra bater uma?"',
    goalText: 'Cause 40 de dano em um único golpe',
    goal: 40,
    track: { k: 'hit' },
    reward: 'golpe_unico',
    minFloor: 1,
  },
  {
    id: 'sem_arranhoes',
    title: 'Sem Arranhões',
    giver: 'Curandeira da Igreja',
    text: '"Cada ponto de HP é uma vida. Volte inteiro."',
    goalText: 'Vença 2 combates sem perder HP',
    goal: 2,
    track: { k: 'cleanWin' },
    reward: 'guarda_perfeita',
  },
];

export const MAX_ACTIVE_QUESTS = 3;

export function questDef(id: string): QuestDef {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Quest desconhecida: ${id}`);
  return q;
}

export type QuestSignal =
  | { k: 'kill'; enemy: string }
  | { k: 'mult' | 'ssTurn' | 'blockTurn' | 'bleed' | 'tagsTurn' | 'hit'; value: number }
  | { k: 'cleanWin' };

/** Atualiza o progresso; retorna ids de quests que acabaram de ser concluídas. */
export function questSignal(run: RunState, sig: QuestSignal): string[] {
  const done: string[] = [];
  for (const q of run.quests) {
    if (q.done) continue;
    const d = questDef(q.id);
    if (d.track.k !== sig.k) continue;
    if (sig.k === 'kill') {
      if (d.track.k === 'kill' && d.track.enemies.includes(sig.enemy)) q.progress++;
    } else if (sig.k === 'cleanWin') q.progress++;
    else q.progress = Math.max(q.progress, sig.value);
    if (q.progress >= d.goal) {
      q.progress = d.goal;
      q.done = true;
      done.push(q.id);
    }
  }
  return done;
}

export function availableQuests(run: RunState): string[] {
  const taken = new Set(run.quests.map((q) => q.id));
  return QUESTS.filter((q) => !taken.has(q.id) && (q.minFloor ?? 1) <= run.floor).map((q) => q.id);
}

export function activeQuests(run: RunState) {
  return run.quests.filter((q) => !q.done);
}

export function acceptQuest(run: RunState, id: string): boolean {
  if (activeQuests(run).length >= MAX_ACTIVE_QUESTS || run.quests.some((q) => q.id === id)) return false;
  run.quests.push({ id, progress: 0, done: false, claimed: false });
  return true;
}
