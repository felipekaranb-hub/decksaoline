# Deck SAO Line — Documento de Design (v0.1)

Roguelite deckbuilder web ambientado na primeira temporada de Sword Art Online (Aincrad, 2022).
Projeto de fã, sem fins comerciais. Personagens, nomes e arte originais da obra pertencem aos seus detentores.

## Premissa

Você é um dos 10.000 jogadores presos em Aincrad. **Não escolhe classe**: começa como Novato,
com um baralho genérico, e a sua classe **emerge** das cartas e habilidades que coleta.
Se o HP chega a zero, o personagem morre de verdade: o nome é riscado no **Monumento da Vida**.

## Pilares

| Pilar | Inspiração | Como aparece |
| --- | --- | --- |
| Combos multiplicativos | Balatro | Mult do turno, padrões de tags (Conexão, Trinca, Arsenal, Skill Chain), cartas com +Mult e ×Mult |
| Combate por turnos com intenções | Slay the Spire | Energia, mão de 5, inimigos mostram a próxima ação, mapa com caminhos |
| Drops aleatórios com raridade | PokeRogue | Escolha 1 de 3 drops com tiers coloridos, reroll pago em col, sorte |
| Evolução de build | Vampire Survivors | Habilidades passivas com nível, evoluções carta + habilidade, baús de elite, loot que cai dos inimigos |
| Identidade emergente | — | Classe calculada pelas tags do baralho, muda ao longo da run |
| Side quests de combo | — | Quests liberam cartas específicas, que ficam desbloqueadas para sempre |

## Loop da run

1. **Loja de armas da Cidade do Início**: escolha 1 de 3 cartas de arma (tags diferentes) e, opcionalmente, 1 side quest.
2. **Mapa do andar**: 9 linhas de salas até a sala do chefe. Tipos: Monstros, Elite, Evento, Cidade (loja + quadro de missões), Pousada (descansar/treinar), Baú, Chefe.
3. **Combate** → **Drops** (escolha, reroll, pular) → mapa.
4. Chefe do andar → tesouro de chefe → próximo andar (cura 60% do HP perdido).
5. Morte ou vitória → registro no Monumento + desbloqueios permanentes.

A versão atual tem 3 andares (Illfang, Asterius, Nerius).

## Sistema de combos (Mult)

- Todo turno começa com **Mult ×1** (mais bônus de Foco / Cristal de Ressonância).
- Dano de ataque = `(base + Força + bônus fixos) × Fraco/Vulnerável × Mult × bônus de tag`.
- Bloqueio de cartas com tag **Escudo** também é multiplicado pelo Mult (é assim que builds defensivas escalam).
- Padrões, avaliados ao jogar uma carta (a própria carta já se beneficia):

| Padrão | Condição | Bônus |
| --- | --- | --- |
| Conexão | compartilha tag com a carta anterior | +0,5 |
| Trinca | 3ª carta da mesma tag no turno | +1 |
| Full Combo | 5ª carta da mesma tag no turno | ×1,5 |
| Arsenal | 3 tags diferentes no turno | +1 |
| Arsenal Completo | as 5 tags no turno | ×2 |
| Skill Chain | Sword Skill logo após outra Sword Skill | ×1,5 |

- **Slot de Preparo**: no fim do turno a mão é descartada, exceto as cartas marcadas com *Guardar*.
  Começa com 1 slot; Quick Change (+1 a cada 2 níveis) e Bainha Dupla (+1) aumentam. Serve para segurar
  a peça que fecha o combo do turno seguinte, com o custo de não jogá-la agora.
- **Sword Skills** são fortes, mas causam **Atraso** (pós-movimento): menos Energia no próximo turno.
  Skill Connect, Pós-movimento Curto e Skill Chain mitigam isso.

## Tags e classe emergente

Tags: 🗡️ Espada · 🤺 Florete · 🪓 Machado · 🛡️ Escudo · 🔪 Adaga. Cada carta conta 1 por tag; cada nível de Mestria conta 1.

- **Classe pura**: 5+ de uma tag → Espadachim, Esgrimista, Machadeiro, Guardião, Assassino (bônus ×1,5).
- **Classe híbrida**: 4+ em duas tags → 10 combinações (Cavaleiro, Duelista, Lâmina Dupla, Tanque, Gladiador...).
- **Aventureiro**: 4+ tags com 2+ cartas cada (bônus no Arsenal).

Bônus por tag: Espada +dano fixo · Florete +Mult na Conexão · Machado ×dano · Escudo bloqueio no início do turno · Adaga sangramento no 1º ataque.

## Drops (estilo PokeRogue)

- Tiers: Comum (branco), Incomum (verde), Raro (azul), Épico (roxo), Lendário (laranja).
- Tipos: carta, habilidade (nova ou +1 nível), equipamento, consumível.
- Sorte = Fortuna + (andar−1)×0,5 + bônus de elite/chefe; desloca as chances para tiers altos.
- Reroll: 10 col, +10 a cada uso na mesma tela.
- Elites deixam um baú com 1 item (15% de chance de 3). Inimigos comuns têm 30% de chance de soltar col ou consumível.

## Habilidades e evoluções (estilo Vampire Survivors)

Até 6 habilidades, nível máximo 5. Pegar de novo sobe o nível.
Evoluções (checadas após cada combate/compra): carta base + Mestria Lv 3 →

| Carta | Mestria | Evolui para |
| --- | --- | --- |
| Vertical | Espada | Vertical Arc |
| Linear | Florete | Linear Estelar |
| Whirlwind | Machado | Ciclone Sangrento |
| Bloqueio com Escudo | Escudo | Égide |
| Adaga Rápida | Adaga | Mil Cortes |

## Side quests

Até 3 ativas. Fontes: loja inicial, quadro de missões das cidades, evento "Um Pedido no Caminho".
Ao concluir, a carta-recompensa entra no baralho **e** é liberada para sempre no pool de drops.

| Quest | Objetivo | Libera | Combo que habilita |
| --- | --- | --- | --- |
| Caçador de Lobos | Derrotar 5 lobos | Presa de Lobo | Adaga/sangramento com Mult |
| O Algoritmo | Mult ×4 em um turno | Ápice (×2 Mult) | Qualquer build de Mult |
| Encadeamento | 3 Sword Skills em um turno | Skill Chain (×1,5 e sem Atraso) | Cadeias de Sword Skill |
| Muralha de Tolbana | 25 de bloqueio em um turno | Contra-golpe de Escudo | Escudo: bloqueio × Mult vira dano |
| Arsenal Ambulante | 3 tags num turno | Mestre de Armas | Builds híbridas |
| Sangue na Névoa | 12 de sangramento em um inimigo | Hemorragia (dobra sangramento) | Adaga |
| Um Golpe Só | 40 de dano em um golpe | Um Golpe Só (×2 Mult) | Machado/burst |
| Sem Arranhões | 2 vitórias sem perder HP | Guarda Perfeita | Escudo + Florete |

## Meta-progressão

- Monumento da Vida (histórico de personagens, classe final, andar e causa da morte).
- Cartas de side quest liberadas permanentemente.
- Save automático da run em andamento (localStorage).

## Próximos passos sugeridos

- Arte (sprites, cartas) e áudio; animações de Sword Skill.
- Mais andares (4–10), chefes com mecânicas (Kirito/Asuna como NPCs de evento, Laughing Coffin).
- Skills únicas raras (Dual Blades como evolução secreta, Holy Sword etc.).
- Mais quests encadeadas (cadeias de 2–3 etapas, NPCs recorrentes).
- Balanceamento com simulações (o teste de autoplay já roda runs inteiras).
- Modo "ascensão" / dificuldade crescente.
