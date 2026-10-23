import { cardDef } from './cards';
import { POTIONS, RELICS } from './items';
import { pick, rand } from './rng';
import { acceptQuest, activeQuests, availableQuests, MAX_ACTIVE_QUESTS, questDef } from './quests';
import { addCard, addPotion, addRelic, gainCol, heal, loseHp, randomPotion, randomRelic, upgradeRandom } from './runutil';
import type { CardSelectPurpose, EnemyKind, RunState } from './types';

export interface EventOutcome {
  text: string;
  combat?: { enemies: string[]; kind: EnemyKind };
  cardSelect?: CardSelectPurpose;
}

export interface EventChoice {
  label: string;
  desc: string;
  available?: (run: RunState) => boolean;
  apply: (run: RunState) => EventOutcome;
}

export interface EventDef {
  id: string;
  title: string;
  icon: string;
  text: string;
  /** Andares onde pode aparecer (vazio = todos) */
  floors?: number[];
  choices: EventChoice[];
}

const leave: EventChoice = { label: 'Seguir em frente', desc: 'Nada acontece.', apply: () => ({ text: 'Você segue seu caminho.' }) };

export const EVENTS: EventDef[] = [
  {
    id: 'npc_quest',
    title: 'Um Pedido no Caminho',
    icon: '❗',
    text: 'Um NPC com um ponto de exclamação dourado flutuando sobre a cabeça acena para você. "Aventureiro! Tenho um trabalho... e uma técnica secreta como pagamento."',
    choices: [
      {
        label: 'Aceitar a missão',
        desc: 'Recebe uma side quest aleatória (libera uma carta de combo ao concluir).',
        available: (r) => activeQuests(r).length < MAX_ACTIVE_QUESTS && availableQuests(r).length > 0,
        apply: (r) => {
          const id = pick(r, availableQuests(r));
          acceptQuest(r, id);
          const q = questDef(id);
          return { text: `Nova side quest: “${q.title}” — ${q.goalText}. Recompensa: ${cardDef(q.reward).name}.` };
        },
      },
      leave,
    ],
  },
  {
    id: 'beater',
    title: 'O Ex-Beta Tester',
    icon: '🧑‍💻',
    text:
      'Um jogador encolhido atrás de uma rocha admite, quase sussurrando, que participou do beta fechado. ' +
      '"Eu sei como os mobs daqui se movem... mas se os outros descobrirem, vão me chamar de beater."',
    choices: [
      {
        label: 'Pagar 50 col por dicas',
        desc: 'Melhora 2 cartas aleatórias.',
        available: (r) => r.col >= 50,
        apply: (r) => {
          r.col -= 50;
          const ups = upgradeRandom(r, 2);
          return { text: ups.length ? `Ele te ensina os padrões de ataque. Melhoradas: ${ups.join(', ')}.` : 'Você já sabia tudo que ele sabia.' };
        },
      },
      {
        label: 'Treinar Switch com ele',
        desc: 'Ganha a carta Switch!. Perde 6 HP.',
        apply: (r) => {
          loseHp(r, 6);
          addCard(r, 'switch');
          return { text: 'Horas de treino e alguns hematomas depois, vocês trocam de posição como uma dupla veterana.' };
        },
      },
      leave,
    ],
  },
  {
    id: 'orange',
    title: 'Cursor Laranja',
    icon: '🟠',
    text:
      'Um jogador de capuz bloqueia a trilha. O cursor sobre a cabeça dele é laranja — ele já atacou alguém. ' +
      '"Passa o col, e ninguém precisa sumir do Monumento hoje."',
    choices: [
      {
        label: 'Lutar',
        desc: 'Combate de elite. Recompensa de elite.',
        apply: () => ({ text: 'Você saca a arma. Ele sorri.', combat: { enemies: ['jogador_laranja'], kind: 'elite' } }),
      },
      {
        label: 'Entregar metade do seu col',
        desc: 'Perde 50% do col.',
        apply: (r) => {
          const lost = Math.floor(r.col / 2);
          r.col -= lost;
          return { text: `Você entrega ${lost} col. Ele some na névoa, rindo.` };
        },
      },
    ],
  },
  {
    id: 'trap_chest',
    title: 'Baú Suspeito',
    icon: '🧰',
    text: 'No fim de um corredor sem saída do labirinto há um baú solitário, brilhante demais. Seus instintos gritam "armadilha".',
    choices: [
      {
        label: 'Abrir o baú',
        desc: '50%: equipamento. 50%: alarme e emboscada.',
        apply: (r) => {
          if (rand(r) < 0.5) {
            const relic = randomRelic(r);
            if (relic) {
              addRelic(r, relic);
              return { text: `O baú estava limpo! Dentro: ${RELICS[relic].icon} ${RELICS[relic].name}.` };
            }
            gainCol(r, 80);
            return { text: 'O baú estava limpo! Dentro: 80 col.' };
          }
          const pack = r.floor === 1 ? ['kobold_sentinela', 'lobo', 'lobo'] : r.floor === 2 ? ['touro_menor', 'vespa', 'vespa'] : ['elfo_floresta', 'aranha', 'aranha'];
          return { text: 'Um alarme ensurdecedor dispara, as portas se fecham e monstros surgem das paredes!', combat: { enemies: pack, kind: 'normal' } };
        },
      },
      leave,
    ],
  },
  {
    id: 'campfire',
    title: 'Fogueira de Jogadores',
    icon: '🔥',
    text: 'Um pequeno grupo divide pão duro em volta de uma fogueira. "Senta aí. Ninguém deveria lutar sozinho aqui."',
    choices: [
      {
        label: 'Descansar com eles',
        desc: 'Recupera 20 HP.',
        apply: (r) => {
          heal(r, 20);
          return { text: 'Pela primeira vez em dias, você dorme sem a mão na espada.' };
        },
      },
      {
        label: 'Trocar técnicas',
        desc: 'Remove uma carta do seu baralho.',
        available: (r) => r.deck.length > 5,
        apply: () => ({ text: 'Vocês trocam dicas até tarde. Você abandona um hábito ruim.', cardSelect: 'remove' }),
      },
    ],
  },
  {
    id: 'help',
    title: 'Pedido de Socorro',
    icon: '🆘',
    text: 'Gritos ecoam: um jogador com a barra de HP no vermelho está cercado. Se você entrar, a luta é sua também.',
    choices: [
      {
        label: 'Ajudar',
        desc: 'Combate. Ele te dá um equipamento como agradecimento.',
        apply: (r) => {
          const relic = randomRelic(r);
          if (relic) addRelic(r, relic);
          const pack = r.floor === 1 ? ['javali', 'lobo', 'lobo'] : r.floor === 2 ? ['boi_tremulo', 'vespa'] : ['treant', 'aranha'];
          return {
            text: `Você se joga entre ele e os monstros.${relic ? ` (Ele te entrega: ${RELICS[relic].icon} ${RELICS[relic].name})` : ''}`,
            combat: { enemies: pack, kind: 'normal' },
          };
        },
      },
      {
        label: 'Fingir que não ouviu',
        desc: 'Ganha a maldição Remorso.',
        apply: (r) => {
          addCard(r, 'remorso');
          return { text: 'Os gritos param. Você não olha para trás. Mas vai lembrar.' };
        },
      },
    ],
  },
  {
    id: 'monument',
    title: 'Notícias da Cidade do Início',
    icon: '📜',
    text: 'Um mensageiro passa com a lista atualizada do Monumento da Vida. Mais nomes riscados. Alguns você conhecia.',
    choices: [
      {
        label: 'Ler todos os nomes',
        desc: `Ganha ${cardDef('determinacao').name} (Poder raro) e a maldição Trauma.`,
        apply: (r) => {
          addCard(r, 'determinacao');
          addCard(r, 'trauma');
          return { text: 'Você lê cada nome em voz baixa. Dói. Mas agora você tem um motivo para continuar.' };
        },
      },
      leave,
    ],
  },
  {
    id: 'merchant',
    title: 'Mercador Ambulante',
    icon: '🎒',
    text: 'Um mercador com uma mochila do tamanho dele oferece "itens raros, quase sem uso".',
    choices: [
      {
        label: 'Comprar item misterioso (35 col)',
        desc: 'Ganha um consumível aleatório.',
        available: (r) => r.col >= 35 && r.potions.some((p) => p === null),
        apply: (r) => {
          r.col -= 35;
          const p = randomPotion(r);
          addPotion(r, p);
          return { text: `Ele te entrega ${POTIONS[p].icon} ${POTIONS[p].name}.` };
        },
      },
      {
        label: 'Vender suprimentos (+40 col)',
        desc: 'Perde 7 HP de cansaço carregando tudo até aqui.',
        apply: (r) => {
          loseHp(r, 7);
          gainCol(r, 40);
          return { text: 'Negócio fechado. Suas costas reclamam.' };
        },
      },
      leave,
    ],
  },
  {
    id: 'fountain',
    title: 'Fonte de Cristal',
    icon: '⛲',
    text: 'Uma fonte de água cristalina brilha numa clareira escondida. Dizem que ela "lava o que pesa na alma".',
    choices: [
      {
        label: 'Beber',
        desc: 'Recupera 12 HP e +4 HP máximo.',
        apply: (r) => {
          r.maxHp += 4;
          heal(r, 12);
          return { text: 'A água é gelada e doce. Você se sente mais forte.' };
        },
      },
      {
        label: 'Mergulhar as mãos',
        desc: 'Remove uma maldição do baralho.',
        available: (r) => r.deck.some((c) => cardDef(c.id).type === 'curse'),
        apply: (r) => {
          const i = r.deck.findIndex((c) => cardDef(c.id).type === 'curse');
          const name = cardDef(r.deck[i].id).name;
          r.deck.splice(i, 1);
          return { text: `${name} se dissolve na água.` };
        },
      },
      leave,
    ],
  },
];

export function eventDef(id: string): EventDef {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`Evento desconhecido: ${id}`);
  return e;
}
