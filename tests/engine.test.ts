import { describe, expect, it } from 'vitest';
import { computeClass } from '../src/game/classes';
import { canPlay, endTurn, playCard, startCombat } from '../src/game/combat';
import { canTakeDrop } from '../src/game/drops';
import { generateMap, reachable, BOSS_ID } from '../src/game/map';
import { questSignal } from '../src/game/quests';
import { rand } from '../src/game/rng';
import {
  chooseEvent,
  chooseStarter,
  finishCombat,
  leaveEvent,
  leaveReward,
  newRun,
  nextFloor,
  restAtInn,
  takeBossRelic,
  takeChoice,
  travel,
  chooseCard,
  selectableCards,
} from '../src/game/run';
import type { CardInst, RunState } from '../src/game/types';

const deckOf = (ids: string[]): CardInst[] => ids.map((id, i) => ({ uid: i + 1, id, up: false }));

function freshRun(seed = 42): RunState {
  const run = newRun('Teste', seed, []);
  chooseStarter(run, run.starterChoices[0], run.starterQuests[0] ?? null);
  return run;
}

/** Coloca cartas específicas na mão para testar combos. */
function setupHand(run: RunState, ids: string[]) {
  startCombat(run, ['illfang'], 'boss');
  const c = run.combat!;
  c.hand = deckOf(ids).map((x) => ({ ...x, uid: x.uid + 500 }));
  c.energy = 10;
  return c;
}

describe('rng', () => {
  it('é determinístico pela seed', () => {
    const a = { rng: 123 };
    const b = { rng: 123 };
    expect([rand(a), rand(a), rand(a)]).toEqual([rand(b), rand(b), rand(b)]);
  });
});

describe('mapa', () => {
  it('todo nó alcança o chefe', () => {
    for (let seed = 1; seed < 30; seed++) {
      const map = generateMap({ rng: seed });
      const seen = new Set<string>();
      const stack = reachable(map, null);
      while (stack.length) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...map.nodes[id].next);
      }
      expect(seen.has(BOSS_ID)).toBe(true);
      expect(Object.values(map.nodes).some((n) => n.type === 'town')).toBe(true);
    }
  });
});

describe('combos estilo Balatro', () => {
  it('Conexão soma Mult quando a carta compartilha tag com a anterior', () => {
    const run = freshRun();
    const c = setupHand(run, ['corte_cruzado', 'corte_cruzado']);
    playCard(run, 0, c.enemies[0].uid);
    expect(c.mult).toBe(1);
    playCard(run, 0, c.enemies[0].uid);
    expect(c.mult).toBe(1.5);
  });

  it('Trinca dá +1 Mult na 3ª carta da mesma tag', () => {
    const run = freshRun();
    const c = setupHand(run, ['corte_cruzado', 'corte_cruzado', 'corte_cruzado']);
    for (let i = 0; i < 3; i++) playCard(run, 0, c.enemies[0].uid);
    // 1 + 0,5 (conexão) + 0,5 (conexão) + 1 (trinca)
    expect(c.mult).toBe(3);
  });

  it('Skill Chain multiplica o Mult em Sword Skills seguidas', () => {
    const run = freshRun();
    const c = setupHand(run, ['sonic_leap', 'sonic_leap']);
    playCard(run, 0, c.enemies[0].uid);
    playCard(run, 0, c.enemies[0].uid);
    expect(c.mult).toBe(1.5);
    expect(c.st.delay).toBe(2);
  });

  it('Mult multiplica o dano', () => {
    const run = freshRun();
    const c = setupHand(run, ['ritmo', 'golpe']);
    c.enemies[0].block = 0;
    const hp = c.enemies[0].hp;
    playCard(run, 0); // +0,5 Mult
    playCard(run, 0, c.enemies[0].uid); // 6 × 1,5 = 9
    expect(hp - c.enemies[0].hp).toBe(9);
  });

  it('Bloqueio de cartas Escudo escala com o Mult', () => {
    const run = freshRun();
    const c = setupHand(run, ['ritmo', 'ritmo', 'bloqueio_escudo']);
    const before = c.block;
    playCard(run, 0);
    playCard(run, 0);
    playCard(run, 0, c.enemies[0].uid);
    expect(c.block - before).toBe(14); // 7 × 2
  });
});

describe('classe emergente', () => {
  it('começa Novato e vira classe com 5 cartas de uma tag', () => {
    expect(computeClass(deckOf(['golpe', 'defender']), {}).name).toBe('Novato');
    expect(computeClass(deckOf(['slant', 'vertical', 'horizontal', 'corte_cruzado', 'rage_spike']), {}).name).toBe('Espadachim');
  });
  it('híbrida com 4+4', () => {
    const deck = deckOf(['slant', 'vertical', 'horizontal', 'corte_cruzado', 'bloqueio_escudo', 'muralha', 'fortaleza', 'guarda_firme']);
    expect(computeClass(deck, {}).name).toBe('Cavaleiro');
  });
  it('Mestrias contam para a classe', () => {
    expect(computeClass(deckOf(['adaga_rapida', 'corte_venenoso']), { mestria_adaga: 3 }).name).toBe('Assassino');
  });
});

describe('side quests', () => {
  it('completa e entrega a carta, liberando no pool', () => {
    const run = freshRun();
    run.quests = [{ id: 'algoritmo', progress: 0, done: false, claimed: false }];
    expect(questSignal(run, { k: 'mult', value: 4.5 })).toEqual(['algoritmo']);
    startCombat(run, ['javali'], 'normal');
    run.combat!.result = 'win';
    finishCombat(run);
    expect(run.deck.some((c) => c.id === 'apice')).toBe(true);
    expect(run.unlocked).toContain('apice');
    expect(run.reward?.questsDone).toEqual(['algoritmo']);
  });
});

/** Joga uma run inteira com uma IA boba para pegar exceções e estados inválidos. */
function autoplay(seed: number): RunState {
  const run = newRun('Bot', seed, []);
  chooseStarter(run, run.starterChoices[0], run.starterQuests[0]);
  for (let step = 0; step < 3000; step++) {
    switch (run.screen) {
      case 'map': {
        const next = reachable(run.map, run.nodeId);
        travel(run, next[0]);
        break;
      }
      case 'combat': {
        const c = run.combat!;
        if (c.result) {
          finishCombat(run);
          break;
        }
        let played = false;
        for (let i = 0; i < c.hand.length; i++) {
          if (canPlay(run, i)) {
            playCard(run, i, c.enemies.find((e) => !e.dead)?.uid);
            played = true;
            break;
          }
        }
        if (!played) endTurn(run);
        break;
      }
      case 'reward': {
        const r = run.reward!;
        if (r.bossRelics?.length) takeBossRelic(run, r.bossRelics[0]);
        const idx = r.choices?.findIndex((d) => canTakeDrop(run, d)) ?? -1;
        if (r.choices && idx >= 0 && r.picks > 0) takeChoice(run, idx);
        else leaveReward(run);
        break;
      }
      case 'event':
        if (run.event!.result) leaveEvent(run);
        else chooseEvent(run, 0);
        if (run.screen === 'event' && !run.event?.result) chooseEvent(run, 1);
        break;
      case 'cardSelect': {
        const cards = selectableCards(run);
        if (cards.length) chooseCard(run, cards[0].uid);
        else run.screen = run.cardSelect!.back;
        break;
      }
      case 'shop':
        run.screen = 'map';
        break;
      case 'inn':
        restAtInn(run);
        break;
      case 'floorClear':
        nextFloor(run);
        break;
      case 'dead':
      case 'victory':
        return run;
      default:
        throw new Error(`Tela inesperada: ${run.screen}`);
    }
    expect(Number.isFinite(run.hp)).toBe(true);
    expect(run.hp).toBeLessThanOrEqual(run.maxHp);
  }
  throw new Error('Run não terminou');
}

describe('simulação', () => {
  it('runs automáticas terminam sem erros', () => {
    const results = Array.from({ length: 25 }, (_, i) => autoplay(i + 1));
    for (const r of results) expect(['dead', 'victory']).toContain(r.screen);
  });
});
