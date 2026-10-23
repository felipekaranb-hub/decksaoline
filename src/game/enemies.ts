import type { AiCtx, EnemyDef } from './types';

const E = (d: EnemyDef) => d;

/** Repete uma sequência fixa de movimentos. */
const cycle = (...ids: string[]) => (c: AiCtx) => ids[c.turn % ids.length];

/** Escolha aleatória ponderada, sem repetir o mesmo movimento mais de `max` vezes seguidas. */
const randomNoRepeat =
  (weights: Record<string, number>, max = 2, first?: string) =>
  (c: AiCtx) => {
    if (c.turn === 0 && first) return first;
    const last = c.history.slice(-max);
    const blocked = last.length === max && last.every((m) => m === last[0]) ? last[0] : null;
    const entries = Object.entries(weights).filter(([id]) => id !== blocked);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = c.rand() * total;
    for (const [id, w] of entries) {
      r -= w;
      if (r < 0) return id;
    }
    return entries[entries.length - 1][0];
  };

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    // ═════════════ Andar 1 ═════════════
    E({ id: 'javali', name: 'Javali Frenético', sprite: '🐗', hp: [12, 15], kind: 'normal',
      moves: {
        investida: { name: 'Investida', actions: [{ k: 'attack', n: 6 }] },
        bufar: { name: 'Bufar', actions: [{ k: 'status', s: 'strength', n: 2, to: 'self' }, { k: 'block', n: 3 }] },
      },
      pick: randomNoRepeat({ investida: 65, bufar: 35 }, 2, 'investida') }),
    E({ id: 'lobo', name: 'Lobo da Planície', sprite: '🐺', hp: [11, 14], kind: 'normal',
      moves: {
        mordida: { name: 'Mordida Dupla', actions: [{ k: 'attack', n: 3, times: 2 }] },
        uivo: { name: 'Uivo', actions: [{ k: 'status', s: 'strength', n: 1, to: 'allies' }, { k: 'block', n: 4 }] },
      },
      pick: randomNoRepeat({ mordida: 70, uivo: 30 }, 2, 'mordida') }),
    E({ id: 'nepente', name: 'Nepente Pequeno', sprite: '🌱', hp: [18, 22], kind: 'normal',
      moves: {
        chicote: { name: 'Chicote de Vinha', actions: [{ k: 'attack', n: 7 }] },
        acido: { name: 'Seiva Ácida', actions: [{ k: 'attack', n: 3 }, { k: 'status', s: 'weak', n: 2, to: 'player' }] },
      },
      pick: cycle('acido', 'chicote', 'chicote') }),
    E({ id: 'kobold_sentinela', name: 'Kobold Sentinela', sprite: '👺', hp: [22, 26], kind: 'normal',
      moves: {
        alabarda: { name: 'Golpe de Alabarda', actions: [{ k: 'attack', n: 8 }] },
        guarda: { name: 'Guarda Kobold', actions: [{ k: 'block', n: 7 }, { k: 'attack', n: 4 }] },
      },
      pick: randomNoRepeat({ alabarda: 55, guarda: 45 }) }),
    E({ id: 'kobold_tenente', name: 'Kobold Tenente', sprite: '👹', hp: [48, 52], kind: 'elite',
      moves: {
        cutelo: { name: 'Cutelo', actions: [{ k: 'attack', n: 12 }] },
        grito: { name: 'Grito de Guerra', actions: [{ k: 'status', s: 'strength', n: 2, to: 'self' }, { k: 'block', n: 8 }] },
        dupla: { name: 'Golpe Duplo', actions: [{ k: 'attack', n: 6, times: 2 }] },
      },
      pick: cycle('grito', 'cutelo', 'dupla') }),
    E({ id: 'lobo_alfa', name: 'Lobo Alfa', sprite: '🐺', hp: [42, 46], kind: 'elite',
      moves: {
        dilacerar: { name: 'Dilacerar', actions: [{ k: 'attack', n: 5, times: 2 }, { k: 'status', s: 'bleed', n: 2, to: 'player' }] },
        uivo_alfa: { name: 'Uivo do Alfa', actions: [{ k: 'status', s: 'strength', n: 3, to: 'self' }] },
        bote: { name: 'Bote', actions: [{ k: 'attack', n: 14 }] },
      },
      pick: cycle('dilacerar', 'uivo_alfa', 'bote', 'dilacerar') }),
    E({ id: 'illfang', name: 'Illfang, o Senhor Kobold', sprite: '👹', hp: [110, 110], kind: 'boss',
      moves: {
        machado: { name: 'Machado de Osso', actions: [{ k: 'attack', n: 12 }] },
        broquel: { name: 'Erguer Broquel', actions: [{ k: 'block', n: 12 }, { k: 'status', s: 'strength', n: 1, to: 'self' }] },
        giro: { name: 'Golpe Giratório', actions: [{ k: 'attack', n: 7, times: 2 }] },
        convocar: { name: 'Convocar Sentinela', actions: [{ k: 'summon', id: 'kobold_sentinela' }, { k: 'block', n: 6 }] },
      },
      pick: (c) => (c.turn % 4 === 3 && c.allies < 2 ? 'convocar' : cycle('machado', 'broquel', 'giro')(c)),
      phase2: {
        at: 0.5,
        status: { strength: 3 },
        msg: 'Illfang joga fora o machado e o broquel e saca uma lâmina curva — não é um talwar! É um nodachi!',
        moves: {
          nodachi: { name: 'Corte de Nodachi', actions: [{ k: 'attack', n: 6, times: 3 }] },
          salto: { name: 'Salto Aéreo', actions: [{ k: 'attack', n: 16 }, { k: 'status', s: 'delay', n: 1, to: 'player' }] },
          rasgo: { name: 'Rasgo', actions: [{ k: 'attack', n: 10 }, { k: 'status', s: 'vulnerable', n: 2, to: 'player' }] },
        },
        pick: cycle('salto', 'nodachi', 'rasgo'),
      } }),

    // ═════════════ Andar 2 ═════════════
    E({ id: 'touro_menor', name: 'Taurus Golpeador', sprite: '🐂', hp: [30, 34], kind: 'normal',
      moves: {
        marreta: { name: 'Marreta', actions: [{ k: 'attack', n: 11 }] },
        bufo: { name: 'Bufo', actions: [{ k: 'status', s: 'strength', n: 2, to: 'self' }] },
        pisada: { name: 'Pisada', actions: [{ k: 'attack', n: 6 }, { k: 'status', s: 'weak', n: 1, to: 'player' }] },
      },
      pick: randomNoRepeat({ marreta: 45, bufo: 20, pisada: 35 }, 2, 'pisada') }),
    E({ id: 'vespa', name: 'Vespa do Vento', sprite: '🐝', hp: [16, 19], kind: 'normal',
      moves: {
        ferrao: { name: 'Ferrão', actions: [{ k: 'attack', n: 4 }, { k: 'status', s: 'bleed', n: 2, to: 'player' }] },
        zumbido: { name: 'Rasante', actions: [{ k: 'attack', n: 3, times: 2 }] },
      },
      pick: randomNoRepeat({ ferrao: 50, zumbido: 50 }) }),
    E({ id: 'boi_tremulo', name: 'Boi Trêmulo', sprite: '🐃', hp: [38, 42], kind: 'normal',
      moves: {
        chifrada: { name: 'Chifrada', actions: [{ k: 'attack', n: 13 }] },
        investida: { name: 'Investida Blindada', actions: [{ k: 'attack', n: 8 }, { k: 'block', n: 7 }] },
      },
      pick: randomNoRepeat({ chifrada: 50, investida: 50 }, 2, 'investida') }),
    E({ id: 'nato', name: 'Nato, o Coronel Taurus', sprite: '🐂', hp: [72, 76], kind: 'elite',
      moves: {
        marreta: { name: 'Marreta de Guerra', actions: [{ k: 'attack', n: 16 }] },
        raio: { name: 'Sopro Paralisante', actions: [{ k: 'attack', n: 8 }, { k: 'status', s: 'delay', n: 1, to: 'player' }] },
        furia: { name: 'Fúria Taurina', actions: [{ k: 'status', s: 'strength', n: 3, to: 'self' }, { k: 'block', n: 10 }] },
      },
      pick: cycle('raio', 'marreta', 'furia', 'marreta') }),
    E({ id: 'vespa_rainha', name: 'Vespa Rainha', sprite: '🐝', hp: [55, 60], kind: 'elite',
      moves: {
        enxame: { name: 'Chamar Enxame', actions: [{ k: 'summon', id: 'vespa' }] },
        veneno: { name: 'Ferrão Real', actions: [{ k: 'attack', n: 9 }, { k: 'status', s: 'bleed', n: 4, to: 'player' }] },
        rasante: { name: 'Rasante', actions: [{ k: 'attack', n: 5, times: 3 }] },
      },
      pick: (c) => (c.turn % 3 === 0 && c.allies < 3 ? 'enxame' : randomNoRepeat({ veneno: 50, rasante: 50 })(c)) }),
    E({ id: 'asterius', name: 'Asterius, o Rei Taurus', sprite: '👑', hp: [200, 200], kind: 'boss',
      moves: {
        marreta: { name: 'Marreta Real', actions: [{ k: 'attack', n: 18 }] },
        trovao: { name: 'Sopro de Trovão', actions: [{ k: 'attack', n: 9 }, { k: 'status', s: 'delay', n: 2, to: 'player' }] },
        pisoteio: { name: 'Pisoteio', actions: [{ k: 'attack', n: 6, times: 3 }] },
        rugido: { name: 'Rugido do Rei', actions: [{ k: 'status', s: 'strength', n: 3, to: 'self' }, { k: 'block', n: 15 }] },
      },
      pick: cycle('pisoteio', 'trovao', 'marreta', 'rugido'),
      phase2: {
        at: 0.5,
        status: { ritual: 1 },
        msg: 'A coroa de Asterius brilha. Ele entra em fúria — fica mais forte a cada turno!',
      } }),

    // ═════════════ Andar 3 ═════════════
    E({ id: 'elfo_floresta', name: 'Elfo da Floresta', sprite: '🧝', hp: [36, 40], kind: 'normal',
      moves: {
        lamina: { name: 'Lâmina Élfica', actions: [{ k: 'attack', n: 10 }] },
        parede: { name: 'Bloqueio Élfico', actions: [{ k: 'block', n: 10 }, { k: 'status', s: 'strength', n: 1, to: 'self' }] },
        flechas: { name: 'Chuva de Flechas', actions: [{ k: 'attack', n: 4, times: 3 }] },
      },
      pick: randomNoRepeat({ lamina: 40, parede: 25, flechas: 35 }) }),
    E({ id: 'aranha', name: 'Aranha da Névoa', sprite: '🕷️', hp: [28, 32], kind: 'normal',
      moves: {
        picada: { name: 'Picada Venenosa', actions: [{ k: 'attack', n: 5 }, { k: 'status', s: 'bleed', n: 3, to: 'player' }] },
        teia: { name: 'Teia', actions: [{ k: 'status', s: 'weak', n: 2, to: 'player' }, { k: 'status', s: 'vulnerable', n: 1, to: 'player' }] },
      },
      pick: cycle('teia', 'picada', 'picada') }),
    E({ id: 'treant', name: 'Treant Jovem', sprite: '🌳', hp: [45, 50], kind: 'normal',
      moves: {
        galho: { name: 'Galhada', actions: [{ k: 'attack', n: 12 }] },
        raizes: { name: 'Enraizar', actions: [{ k: 'block', n: 12 }, { k: 'status', s: 'thorns', n: 2, to: 'self' }] },
      },
      pick: randomNoRepeat({ galho: 60, raizes: 40 }, 2, 'raizes') }),
    E({ id: 'cavaleiro_negro', name: 'Cavaleiro Elfo Negro', sprite: '🗡️', hp: [92, 96], kind: 'elite',
      moves: {
        lamina: { name: 'Lâmina Sombria', actions: [{ k: 'attack', n: 15 }] },
        dupla: { name: 'Corte Duplo', actions: [{ k: 'attack', n: 8, times: 2 }] },
        foco: { name: 'Concentração', actions: [{ k: 'status', s: 'strength', n: 2, to: 'self' }, { k: 'block', n: 12 }] },
      },
      pick: cycle('foco', 'dupla', 'lamina') }),
    E({ id: 'jogador_laranja', name: 'Jogador Laranja', sprite: '🟠', hp: [55, 60], kind: 'elite',
      moves: {
        adaga: { name: 'Adaga Envenenada', actions: [{ k: 'attack', n: 6 }, { k: 'status', s: 'bleed', n: 3, to: 'player' }] },
        paralisia: { name: 'Veneno Paralisante', actions: [{ k: 'status', s: 'delay', n: 2, to: 'player' }, { k: 'block', n: 6 }] },
        golpe_baixo: { name: 'Golpe Baixo', actions: [{ k: 'attack', n: 13 }] },
      },
      pick: cycle('adaga', 'paralisia', 'golpe_baixo') }),
    E({ id: 'nerius', name: 'Nerius, o Treant Maligno', sprite: '🌲', hp: [260, 260], kind: 'boss',
      moves: {
        esmagar: { name: 'Esmagar', actions: [{ k: 'attack', n: 22 }] },
        raizes: { name: 'Raízes Perfurantes', actions: [{ k: 'attack', n: 7, times: 3 }] },
        esporos: { name: 'Esporos', actions: [{ k: 'status', s: 'weak', n: 2, to: 'player' }, { k: 'status', s: 'vulnerable', n: 2, to: 'player' }, { k: 'addCard', id: 'trauma', n: 1 }] },
        regenerar: { name: 'Seiva Antiga', actions: [{ k: 'heal', n: 18 }, { k: 'block', n: 18 }] },
      },
      pick: cycle('esporos', 'raizes', 'esmagar', 'regenerar'),
      phase2: {
        at: 0.4,
        status: { thorns: 4, strength: 2 },
        msg: 'A casca de Nerius racha e espinhos negros brotam por todo o tronco!',
      } }),
  ].map((e) => [e.id, e]),
);

export function enemyDef(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Inimigo desconhecido: ${id}`);
  return d;
}
