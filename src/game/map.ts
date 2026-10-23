import { rand, randInt, weighted, type RngHolder } from './rng';
import type { FloorMap, MapNode, NodeType } from './types';

export const MAP_ROWS = 9;
export const MAP_COLS = 5;
const PATHS = 5;

const nid = (row: number, col: number) => `${row}-${col}`;
export const BOSS_ID = 'boss';

/**
 * Gera o mapa de um andar no estilo "caminhos que se cruzam":
 * várias trilhas sobem do início até a sala do chefe, e cada nó vira um tipo de sala.
 */
export function generateMap(h: RngHolder): FloorMap {
  const nodes: Record<string, MapNode> = {};
  const ensure = (row: number, col: number) =>
    (nodes[nid(row, col)] ??= { id: nid(row, col), row, col, type: 'mob', next: [] });

  const starts = new Set<number>();
  for (let p = 0; p < PATHS; p++) {
    let col = randInt(h, 0, MAP_COLS - 1);
    // Garante pelo menos 2 pontos de partida distintos
    if (p === 1 && starts.size === 1 && starts.has(col)) col = (col + 2) % MAP_COLS;
    starts.add(col);
    ensure(0, col);
    for (let row = 0; row < MAP_ROWS - 1; row++) {
      const nextCol = Math.max(0, Math.min(MAP_COLS - 1, col + randInt(h, -1, 1)));
      const a = ensure(row, col);
      ensure(row + 1, nextCol);
      if (!a.next.includes(nid(row + 1, nextCol))) a.next.push(nid(row + 1, nextCol));
      col = nextCol;
    }
  }
  for (const n of Object.values(nodes)) if (n.row === MAP_ROWS - 1) n.next = [BOSS_ID];
  nodes[BOSS_ID] = { id: BOSS_ID, row: MAP_ROWS, col: Math.floor(MAP_COLS / 2), type: 'boss', next: [] };

  assignTypes(h, nodes);
  return { rows: MAP_ROWS, cols: MAP_COLS, nodes };
}

function assignTypes(h: RngHolder, nodes: Record<string, MapNode>) {
  const parents: Record<string, MapNode[]> = {};
  for (const n of Object.values(nodes)) for (const id of n.next) (parents[id] ??= []).push(n);

  const ordered = Object.values(nodes)
    .filter((n) => n.type !== 'boss')
    .sort((a, b) => a.row - b.row || a.col - b.col);

  for (const n of ordered) {
    if (n.row === 0) n.type = 'mob';
    else if (n.row === 4) n.type = 'chest';
    else if (n.row === MAP_ROWS - 1) n.type = 'inn';
    else {
      const parentTypes = new Set((parents[n.id] ?? []).map((p) => p.type));
      const table: [NodeType, number][] = [
        ['mob', 45],
        ['event', 22],
        ['elite', n.row >= 3 ? 14 : 0],
        ['town', n.row >= 2 ? 9 : 0],
        ['inn', n.row >= 3 && n.row <= MAP_ROWS - 3 ? 8 : 0],
      ];
      // Evita salas especiais repetidas em sequência
      const filtered = table.filter(([t]) => t === 'mob' || !parentTypes.has(t));
      n.type = weighted(h, filtered);
    }
  }

  // Garante ao menos uma cidade (loja) no andar
  if (!ordered.some((n) => n.type === 'town')) {
    const candidates = ordered.filter((n) => n.row >= 2 && n.row <= 6 && n.row !== 4 && (n.type === 'mob' || n.type === 'event'));
    if (candidates.length) candidates[Math.floor(rand(h) * candidates.length)].type = 'town';
  }
}

export function startNodes(map: FloorMap): MapNode[] {
  return Object.values(map.nodes).filter((n) => n.row === 0);
}

export function reachable(map: FloorMap, current: string | null): string[] {
  if (current === null) return startNodes(map).map((n) => n.id);
  return map.nodes[current]?.next ?? [];
}
