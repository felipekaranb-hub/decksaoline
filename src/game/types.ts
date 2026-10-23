/** Tags de arma: definem combos e a classe emergente do jogador. */
export type Tag = 'espada' | 'florete' | 'machado' | 'escudo' | 'adaga';

export type StatusId =
  | 'strength'
  | 'dexterity'
  | 'vulnerable'
  | 'weak'
  | 'bleed'
  | 'delay'
  | 'switch'
  | 'ritual'
  | 'thorns'
  | 'guard'
  | 'regen'
  | 'swordDance'
  | 'flow'
  | 'rage'
  | 'drawUp'
  | 'noDelay';

export type Statuses = Partial<Record<StatusId, number>>;

export type CardType = 'attack' | 'swordskill' | 'skill' | 'power' | 'curse';
/** Tiers de raridade estilo PokeRogue (cores na UI). */
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'curse';
export type DropRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Target = 'self' | 'enemy' | 'allEnemies';

export type Effect =
  | { k: 'dmg'; n: number; times?: number; all?: boolean }
  | { k: 'dmgBlock' }
  | { k: 'block'; n: number }
  | { k: 'draw'; n: number }
  | { k: 'energy'; n: number }
  | { k: 'status'; s: StatusId; n: number; to: Target }
  | { k: 'heal'; n: number }
  | { k: 'loseHp'; n: number }
  | { k: 'addCard'; id: string; to: 'hand' | 'draw' | 'discard'; n?: number }
  /** +Mult aditivo (estilo Balatro) */
  | { k: 'mult'; n: number }
  /** ×Mult multiplicativo */
  | { k: 'xmult'; n: number }
  /** +Mult por tag distinta jogada neste turno */
  | { k: 'multPerTag'; n: number }
  /** Multiplica o Sangramento do alvo */
  | { k: 'bleedMult'; n: number };

export interface CardStats {
  /** null = injogável */
  cost: number | null;
  effects: Effect[];
  /** Atraso pós-movimento das Sword Skills */
  delay?: number;
  exhaust?: boolean;
}

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  tags: Tag[];
  base: CardStats;
  up: Partial<CardStats>;
  /** Maldições: perde HP se estiver na mão no fim do turno */
  endTurnLoseHp?: number;
  /** Só entra no pool de drops depois de liberada por uma side quest */
  questLocked?: boolean;
  /** Carta evoluída (não aparece em drops) */
  evolved?: boolean;
  flavor?: string;
}

export interface CardInst {
  uid: number;
  id: string;
  up: boolean;
}

export type EnemyAction =
  | { k: 'attack'; n: number; times?: number }
  | { k: 'block'; n: number }
  | { k: 'status'; s: StatusId; n: number; to: 'self' | 'player' | 'allies' }
  | { k: 'addCard'; id: string; n: number }
  | { k: 'heal'; n: number }
  | { k: 'summon'; id: string };

export interface EnemyMove {
  name: string;
  actions: EnemyAction[];
}

export type EnemyKind = 'normal' | 'elite' | 'boss';

export interface AiCtx {
  turn: number;
  history: string[];
  rand: () => number;
  enemy: EnemyState;
  allies: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  sprite: string;
  hp: [number, number];
  kind: EnemyKind;
  moves: Record<string, EnemyMove>;
  pick: (ctx: AiCtx) => string;
  start?: Statuses;
  phase2?: { at: number; status?: Statuses; msg: string; moves?: Record<string, EnemyMove>; pick?: (ctx: AiCtx) => string };
}

export interface EnemyState {
  uid: number;
  id: string;
  hp: number;
  maxHp: number;
  block: number;
  st: Statuses;
  intent: string;
  history: string[];
  phase: number;
  dead: boolean;
  turn: number;
}

export interface Fx {
  target: 'player' | 'mult' | number;
  text: string;
  kind: 'dmg' | 'block' | 'heal' | 'status' | 'combo' | 'loot';
}

/** Loot que cai durante o combate (entregue na vitória). */
export interface Loot {
  kind: 'col' | 'potion';
  id?: string;
  n?: number;
}

export interface CombatState {
  enemies: EnemyState[];
  draw: CardInst[];
  hand: CardInst[];
  discard: CardInst[];
  exhaust: CardInst[];
  energy: number;
  maxEnergy: number;
  block: number;
  st: Statuses;
  turn: number;
  /** Mult do turno (estilo Balatro). Reseta a cada turno. */
  mult: number;
  /** Tags das cartas jogadas neste turno, em ordem */
  playedTags: Tag[][];
  /** Tipo da última carta jogada neste turno */
  lastType: CardType | null;
  attacksThisTurn: number;
  ssThisTurn: number;
  blockGainedThisTurn: number;
  firstAttackUsed: boolean;
  tookDamage: boolean;
  /** Classe emergente calculada no início do combate */
  classId: string;
  classTags: Tag[];
  classPower: number;
  kind: EnemyKind;
  result: null | 'win' | 'lose' | 'fled';
  loot: Loot[];
  log: string[];
  fx: Fx[];
  nextUid: number;
}

export type NodeType = 'mob' | 'elite' | 'event' | 'town' | 'inn' | 'chest' | 'boss';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  next: string[];
}

export interface FloorMap {
  rows: number;
  cols: number;
  nodes: Record<string, MapNode>;
}

export type DropKind = 'card' | 'skill' | 'relic' | 'potion';

export interface Drop {
  kind: DropKind;
  id: string;
  rarity: DropRarity;
  /** Carta já vem melhorada */
  up?: boolean;
}

export interface Reward {
  source: 'combat' | 'elite' | 'boss' | 'chest';
  col: number;
  /** Opções de drop (escolha 1) */
  choices: Drop[] | null;
  picks: number;
  rerollCost: number;
  /** Itens ganhos automaticamente (baú de elite, loot do combate) */
  auto: Drop[];
  evolutions: { from: string; to: string }[];
  questsDone: string[];
  bossRelics: string[] | null;
}

export interface ShopItem {
  drop: Drop;
  price: number;
  sold: boolean;
}

export interface ShopState {
  items: ShopItem[];
  removePrice: number;
  removeUsed: boolean;
  quests: string[];
}

export interface EventState {
  id: string;
  result: string | null;
}

export type CardSelectPurpose = 'upgrade' | 'remove';

export interface CardSelectState {
  purpose: CardSelectPurpose;
  title: string;
  back: RunScreen;
  cancelable: boolean;
  price?: number;
}

export type RunScreen =
  | 'starter'
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'inn'
  | 'event'
  | 'chest'
  | 'cardSelect'
  | 'floorClear'
  | 'dead'
  | 'victory';

export interface RunStats {
  kills: number;
  combats: number;
  elites: number;
  bosses: number;
  colEarned: number;
  maxMult: number;
  biggestHit: number;
}

export interface QuestProgress {
  id: string;
  progress: number;
  done: boolean;
  /** Recompensa já entregue */
  claimed: boolean;
}

export interface RunState {
  version: number;
  seed: number;
  rng: number;
  name: string;
  hp: number;
  maxHp: number;
  col: number;
  deck: CardInst[];
  nextCardUid: number;
  /** Habilidades passivas com nível (id → nível) */
  skills: Record<string, number>;
  relics: string[];
  potions: (string | null)[];
  floor: number;
  map: FloorMap;
  nodeId: string | null;
  visited: string[];
  screen: RunScreen;
  starterChoices: string[];
  starterQuests: string[];
  seenEvents: string[];
  combat: CombatState | null;
  reward: Reward | null;
  shop: ShopState | null;
  event: EventState | null;
  cardSelect: CardSelectState | null;
  quests: QuestProgress[];
  stats: RunStats;
  deathCause: string | null;
  removeCount: number;
  /** Cartas de quest já liberadas no meta (para o pool de drops desta run) */
  unlocked: string[];
  /** Fim de run já registrado no Monumento */
  recorded?: boolean;
}

export interface MonumentEntry {
  name: string;
  className: string;
  floor: number;
  cause: string;
  cleared: boolean;
  date: string;
}

export interface MetaState {
  monument: MonumentEntry[];
  runs: number;
  wins: number;
  kills: number;
  highestFloor: number;
  /** Cartas liberadas permanentemente por side quests */
  unlockedCards: string[];
  questsCompleted: string[];
  classesSeen: string[];
}
