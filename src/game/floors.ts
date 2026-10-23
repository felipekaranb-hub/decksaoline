export interface FloorDef {
  floor: number;
  name: string;
  intro: string;
  /** Primeiros combates do andar (mais fáceis) */
  easy: string[][];
  normal: string[][];
  elite: string[][];
  boss: string[];
  bossRelic: string;
}

export const FLOORS: FloorDef[] = [
  {
    floor: 1,
    name: 'Andar 1 — Planícies da Cidade do Início',
    intro:
      'Um mês se passou. Dois mil jogadores já morreram, e ninguém encontrou a sala do chefe do primeiro andar. ' +
      'Hoje, uma reunião em Tolbana decidiu: vamos avançar. Você aperta o cabo da arma e segue para as planícies.',
    easy: [['javali'], ['lobo'], ['nepente']],
    normal: [['kobold_sentinela', 'lobo'], ['javali', 'javali'], ['nepente', 'lobo'], ['kobold_sentinela', 'kobold_sentinela'], ['lobo', 'lobo', 'javali']],
    elite: [['kobold_tenente'], ['lobo_alfa', 'lobo']],
    boss: ['illfang', 'kobold_sentinela'],
    bossRelic: 'talwar_kobold',
  },
  {
    floor: 2,
    name: 'Andar 2 — Planaltos de Urbus',
    intro:
      'O portão de teleporte do segundo andar se abre. Mesas de pedra, campos de vacas gigantes e o eco de cascos nas montanhas. ' +
      'Dizem que o rei dos Taurus espera no topo do labirinto.',
    easy: [['vespa', 'vespa'], ['touro_menor'], ['boi_tremulo']],
    normal: [['touro_menor', 'vespa'], ['boi_tremulo', 'vespa'], ['touro_menor', 'touro_menor'], ['vespa', 'vespa', 'vespa']],
    elite: [['nato'], ['vespa_rainha']],
    boss: ['asterius'],
    bossRelic: 'coroa_taurus',
  },
  {
    floor: 3,
    name: 'Andar 3 — Floresta da Névoa',
    intro:
      'Árvores tão altas que escondem o andar de cima. Elfos patrulham trilhas cobertas de névoa, e alguns jogadores ' +
      'começaram a exibir cursores laranja. No coração da floresta, algo muito velho está acordado.',
    easy: [['aranha'], ['elfo_floresta'], ['treant']],
    normal: [['elfo_floresta', 'aranha'], ['treant', 'aranha'], ['elfo_floresta', 'elfo_floresta'], ['aranha', 'aranha', 'aranha']],
    elite: [['cavaleiro_negro'], ['jogador_laranja', 'aranha']],
    boss: ['nerius'],
    bossRelic: 'cristal_vida',
  },
];

export const LAST_FLOOR = FLOORS.length;

export function floorDef(floor: number): FloorDef {
  return FLOORS[Math.min(floor, FLOORS.length) - 1];
}
