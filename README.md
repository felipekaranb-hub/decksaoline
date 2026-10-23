# Deck SAO Line

Roguelite deckbuilder web (fan game) ambientado em Aincrad, na primeira temporada de Sword Art Online.
Você é um novato sem classe: sua build — e sua classe — surgem das cartas que você coleta.

- Combos estilo **Balatro** (Mult do turno, padrões de tags)
- Combate estilo **Slay the Spire**
- Drops com raridade e reroll estilo **PokeRogue**
- Habilidades com nível e evoluções estilo **Vampire Survivors**
- **Side quests** que liberam cartas de combo permanentemente

Design completo em [`docs/GDD.md`](docs/GDD.md).

## Rodando

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm test           # testes do motor (inclui runs simuladas completas)
npm run build      # build estático em dist/ (hospedável em qualquer lugar)
```

Galeria de sprites e cenários para desenvolvimento: rode `npm run dev` e abra `/lab.html`.

Atalhos no combate: `1`–`9` jogam cartas, `E` encerra o turno, `Esc` cancela.

## Estrutura

```
src/game/   motor puro (sem DOM): cartas, inimigos, combate, mapa, drops, quests, classes
src/ui/     renderização e controle (TypeScript + DOM, sem framework)
tests/      testes Vitest do motor
```

Ícones de game-icons.net (CC BY 3.0) — veja [`CREDITS.md`](CREDITS.md).

Projeto de fã, sem fins comerciais. Sword Art Online pertence a Reki Kawahara / Kadokawa / Aniplex.
