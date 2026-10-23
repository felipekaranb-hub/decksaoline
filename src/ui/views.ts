import { cardDef, fmtMult, needsTarget } from '../game/cards';
import { computeClass } from '../game/classes';
import { aliveEnemies, canPlay, canUsePotion, currentMove, intentDamage, previewCtx, reserveSlots } from '../game/combat';
import { canTakeDrop } from '../game/drops';
import { enemyDef } from '../game/enemies';
import { eventDef } from '../game/events';
import { floorDef, LAST_FLOOR } from '../game/floors';
import { POTIONS, RELICS } from '../game/items';
import { BOSS_ID, reachable } from '../game/map';
import { activeQuests, MAX_ACTIVE_QUESTS, questDef } from '../game/quests';
import { selectableCards } from '../game/run';
import { SKILLS } from '../game/skills';
import type { EnemyState, MetaState, NodeType, RunState } from '../game/types';
import { sceneUrl } from './pixel/scenes';
import { spriteUrl } from './pixel/sprites';
import { cardHtml, classPanel, dropHtml, esc, hpBar, questList, skillsList, statusIcons } from './components';
import { EVENT_ICON, gi, giNested, IC, NODE_ICON, POTION_ICON, RELIC_ICON, SKILL_ICON, UI_ICON } from './icons';

/** Sprite em pixel art ampliado (o tamanho final vem do CSS via --w). */
function spriteImg(id: string, phase = 0): string {
  const { url, w, h } = spriteUrl(id, phase);
  return `<img class="sprite px" src="${url}" style="--w:${w}" width="${w * 4}" height="${h * 4}" alt="" draggable="false">`;
}

export type Overlay = null | 'deck' | 'draw' | 'discard' | 'build';

export interface UiState {
  view: 'title' | 'create' | 'monument' | 'run';
  selected: number | null;
  potionSelected: number | null;
  overlay: Overlay;
  busy: boolean;
  starterCard: string | null;
  starterQuest: string | null;
  showLog: boolean;
}

// ───────────────────────── Telas fora da run ─────────────────────────

export function titleView(meta: MetaState, hasRun: boolean): string {
  return `<div class="screen title-screen" style="background-image:url(${sceneUrl('title')})">
    <div class="title-hero" aria-hidden="true">${spriteImg('hero')}</div>
    <div class="title-logo">
      <div class="title-small">SWORD ART ONLINE · FAN GAME</div>
      <h1>DECK<span>·</span>SAO<span>·</span>LINE</h1>
      <div class="title-sub">Aincrad · 6 de novembro de 2022</div>
    </div>
    <div class="menu">
      ${hasRun ? '<button class="btn primary" data-action="continue">Continuar run</button>' : ''}
      <button class="btn ${hasRun ? '' : 'primary'}" data-action="go-create">Link Start</button>
      <button class="btn" data-action="go-monument">Monumento da Vida</button>
    </div>
    <div class="title-stats">
      Runs: ${meta.runs} · Andares limpos: ${meta.wins} · Maior andar: ${meta.highestFloor} · Cartas de quest liberadas: ${meta.unlockedCards.length}
    </div>
    <div class="title-credits">Ícones: game-icons.net (Lorc, Delapouite e outros) · CC BY 3.0</div>
  </div>`;
}

export function createView(): string {
  return `<div class="screen create-screen">
    <div class="panel narrative">
      <p>Você colocou o NerveGear pela primeira vez há poucas horas. Ainda nem sabe a diferença entre um florete e uma adaga.</p>
      <p>Então todos foram teleportados para a praça da Cidade do Início. Uma figura gigante de capa vermelha anunciou:
      <b>não há botão de logout. Se seu HP chegar a zero aqui, você morre lá fora.</b> A única saída é limpar os 100 andares.</p>
      <p>Você é só mais um novato. A sua classe vai ser aquilo que você se tornar.</p>
    </div>
    <label class="field">Nome do seu avatar
      <input id="player-name" maxlength="16" placeholder="Ex.: Kazuto, Asuna... ou o seu" autocomplete="off" />
    </label>
    <div class="menu">
      <button class="btn primary" data-action="start-run">Entrar em Aincrad</button>
      <button class="btn ghost" data-action="go-title">Voltar</button>
    </div>
  </div>`;
}

export function monumentView(meta: MetaState): string {
  const rows = meta.monument.length
    ? meta.monument
        .map(
          (m) => `<div class="mon-row ${m.cleared ? 'cleared' : ''}">
            <span class="mon-name">${m.cleared ? '' : '<s>'}${esc(m.name)}${m.cleared ? '' : '</s>'}</span>
            <span>${esc(m.className)}</span>
            <span>Andar ${m.floor}</span>
            <span class="muted">${esc(m.cause)}</span>
          </div>`,
        )
        .join('')
    : '<p class="muted">Nenhum nome riscado... ainda.</p>';
  return `<div class="screen monument-screen">
    <h2>Monumento da Vida</h2>
    <p class="muted">Cada personagem que cai tem o nome riscado aqui. Cartas liberadas por side quests ficam para sempre.</p>
    <div class="mon-list">${rows}</div>
    <h3>Cartas de combo liberadas</h3>
    <div class="card-grid small">${meta.unlockedCards.map((id) => cardHtml({ id, up: false })).join('') || '<p class="muted">Complete side quests para liberar cartas no pool de drops.</p>'}</div>
    <div class="menu"><button class="btn" data-action="go-title">Voltar</button></div>
  </div>`;
}

// ───────────────────────── HUD ─────────────────────────

function hud(run: RunState): string {
  const cls = computeClass(run.deck, run.skills);
  const pots = run.potions
    .map((p, i) =>
      p
        ? `<button class="potion ${canUsePotion(run, i) ? '' : 'disabled'}" data-action="potion" data-idx="${i}" title="${esc(POTIONS[p].name + ': ' + POTIONS[p].desc)}">${gi(POTION_ICON[p], '', IC.purple)}</button>`
        : `<span class="potion empty"></span>`,
    )
    .join('');
  const relics = run.relics.map((r) => `<span class="relic" title="${esc(RELICS[r].name + ': ' + RELICS[r].desc)}">${gi(RELIC_ICON[r], '', IC.gold)}</span>`).join('');
  const skills = Object.entries(run.skills)
    .map(([id, lv]) => `<span class="skill-chip" title="${esc(SKILLS[id].name + ' Lv ' + lv + ': ' + SKILLS[id].desc(lv))}">${gi(SKILL_ICON[id], '', IC.blue)}<sub>${lv}</sub></span>`)
    .join('');
  return `<header class="hud">
    <div class="hud-left">
      <div class="hud-name">${esc(run.name)} <span class="cursor-green">▼</span></div>
      <div class="hud-class" data-action="overlay" data-overlay="build" title="Ver build">${esc(cls.name)}</div>
    </div>
    <div class="hud-hp">${hpBar(run.hp, run.maxHp)}</div>
    <div class="hud-info">
      <span class="stat" title="Col">${gi(UI_ICON.coin, '', IC.gold)}${run.col}</span>
      <span class="stat" title="Andar">${gi(UI_ICON.floor, '', IC.steel)}${run.floor}</span>
      <span class="potions">${pots}</span>
    </div>
    <div class="hud-items">${skills}${relics}</div>
    <div class="hud-buttons">
      <button class="btn small" data-action="overlay" data-overlay="build">${gi(UI_ICON.build)}Build${activeQuests(run).length ? ` <b class="badge">${activeQuests(run).length}</b>` : ''}</button>
      <button class="btn small" data-action="overlay" data-overlay="deck">${gi(UI_ICON.deck)}Baralho <b class="badge">${run.deck.length}</b></button>
      <button class="btn small ghost" data-action="quit">Menu</button>
    </div>
  </header>`;
}

function overlayView(run: RunState, ui: UiState): string {
  if (!ui.overlay) return '';
  let title = '';
  let body = '';
  if (ui.overlay === 'build') {
    title = 'Sua build';
    body = `${classPanel(run, true)}
      <h3>Habilidades</h3>${skillsList(run)}
      <h3>Side quests (${activeQuests(run).length}/${MAX_ACTIVE_QUESTS} ativas)</h3>${questList(run)}
      <h3>Como funcionam os combos</h3>
      <ul class="rules">
        <li><b>Mult</b>: todo dano de ataque é multiplicado pelo Mult do turno (reinicia em ×1 a cada turno). Bloqueio de cartas <b>Escudo</b> também.</li>
        <li><b>Conexão</b> (+0,5): jogar uma carta que compartilha tag com a anterior.</li>
        <li><b>Trinca</b> (+1): 3ª carta da mesma tag no turno. <b>Full Combo</b> (×1,5): 5ª.</li>
        <li><b>Arsenal</b> (+1): 3 tags diferentes no turno. <b>Arsenal Completo</b> (×2): todas as 5.</li>
        <li><b>Skill Chain</b> (×1,5): Sword Skill logo após outra Sword Skill. Cuidado com o Atraso!</li>
        <li><b>Slot de Preparo</b>: no fim do turno a mão é descartada, mas as cartas marcadas com <b>Guardar</b> continuam com você (1 slot; mais com Quick Change e Bainha Dupla). Use para segurar a peça que fecha o combo do próximo turno.</li>
      </ul>`;
  } else {
    const c = run.combat;
    const cards = ui.overlay === 'deck' ? run.deck : ui.overlay === 'draw' ? [...(c?.draw ?? [])].sort((a, b) => a.id.localeCompare(b.id)) : (c?.discard ?? []);
    title = ui.overlay === 'deck' ? `Baralho (${cards.length})` : ui.overlay === 'draw' ? `Pilha de compra (${cards.length})` : `Descarte (${cards.length})`;
    body = `<div class="card-grid">${cards.map((x) => cardHtml(x)).join('') || '<p class="muted">Vazio.</p>'}</div>`;
  }
  return `<div class="overlay" data-action="close-overlay">
    <div class="overlay-box" data-stop="1">
      <div class="overlay-head"><h2>${title}</h2><button class="btn small" data-action="close-overlay">Fechar ✕</button></div>
      ${body}
    </div>
  </div>`;
}

// ───────────────────────── Telas da run ─────────────────────────

export function runView(run: RunState, ui: UiState): string {
  let body = '';
  switch (run.screen) {
    case 'starter': body = starterView(run, ui); break;
    case 'map': body = mapView(run); break;
    case 'combat': body = combatView(run, ui); break;
    case 'reward': body = rewardView(run); break;
    case 'shop': body = shopView(run); break;
    case 'inn': body = innView(run); break;
    case 'event': body = eventView(run); break;
    case 'cardSelect': body = cardSelectView(run); break;
    case 'floorClear': body = floorClearView(run); break;
    case 'dead': body = deadView(run); break;
    case 'victory': body = victoryView(run); break;
    default: body = mapView(run);
  }
  return `${hud(run)}<main class="run-main screen-${run.screen}">${body}</main>${overlayView(run, ui)}`;
}

function starterView(run: RunState, ui: UiState): string {
  return `<div class="screen-inner">
    <h2>Cidade do Início — Loja de Armas</h2>
    <p class="narrative">O vendedor NPC sorri como se nada tivesse acontecido. "Primeira arma? Escolha uma. Por conta da casa."
    Isso <b>não</b> define sua classe — é só um começo.</p>
    <div class="card-row">${run.starterChoices
      .map((id) => cardHtml({ id, up: false }, { action: 'starter-card', data: { id }, selected: ui.starterCard === id }))
      .join('')}</div>
    <h3>Quadro de missões ❗</h3>
    <p class="muted">Side quests liberam cartas de combo específicas — e as deixam disponíveis para sempre nas próximas runs.</p>
    <div class="quest-pick">${run.starterQuests
      .map((id) => {
        const q = questDef(id);
        return `<div class="quest-card ${ui.starterQuest === id ? 'selected' : ''}" data-action="starter-quest" data-id="${id}">
          <b>${esc(q.title)}</b><span class="muted">${esc(q.giver)}</span>
          <p>${esc(q.text)}</p><div class="goal">${gi('eye-target', '', IC.gold, 12)}${esc(q.goalText)}</div>
          <div class="goal">${gi('open-treasure-chest', '', IC.gold, 12)}${cardDef(q.reward).name}</div></div>`;
      })
      .join('')}</div>
    <div class="menu"><button class="btn primary ${ui.starterCard ? '' : 'disabled'}" data-action="starter-confirm">Partir para as planícies</button></div>
  </div>`;
}

const NODE_COLOR: Record<NodeType, string> = { mob: '#f4f1e8', elite: IC.purple, event: IC.blue, town: IC.green, inn: IC.green, chest: IC.gold, boss: IC.red };
const NODE_LABEL: Record<NodeType, string> = { mob: 'Monstros', elite: 'Elite', event: 'Evento', town: 'Cidade', inn: 'Pousada', chest: 'Baú', boss: 'Chefe do andar' };

function mapView(run: RunState): string {
  const { map } = run;
  const W = 520;
  const rowH = 78;
  const H = (map.rows + 1) * rowH + 40;
  const pos = (id: string) => {
    const n = map.nodes[id];
    if (id === BOSS_ID) return { x: W / 2, y: 40 };
    const jitter = ((n.row * 7 + n.col * 13) % 5) * 4 - 8;
    return { x: 60 + n.col * ((W - 120) / (map.cols - 1)) + jitter, y: H - 40 - n.row * rowH };
  };
  const avail = new Set(reachable(map, run.nodeId));
  const lines: string[] = [];
  const nodes: string[] = [];
  for (const n of Object.values(map.nodes)) {
    const a = pos(n.id);
    for (const next of n.next) {
      const b = pos(next);
      const walked = run.visited.includes(n.id) && run.visited.includes(next);
      lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${walked ? 'walked' : ''}"/>`);
    }
  }
  for (const n of Object.values(map.nodes)) {
    const p = pos(n.id);
    const cls = ['node', `n-${n.type}`, avail.has(n.id) ? 'available' : '', run.visited.includes(n.id) ? 'visited' : '', run.nodeId === n.id ? 'current' : ''].join(' ');
    const r = n.type === 'boss' ? 30 : 20;
    nodes.push(`<g class="${cls}" ${avail.has(n.id) ? `data-action="travel" data-id="${n.id}"` : ''} transform="translate(${p.x},${p.y})">
      <title>${NODE_LABEL[n.type]}</title>
      <rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}"/>${giNested(NODE_ICON[n.type], n.type === 'boss' ? 40 : 28, NODE_COLOR[n.type])}</g>`);
  }
  const f = floorDef(run.floor);
  return `<div class="map-layout" data-floor="${run.floor}" style="--scene:url(${sceneUrl(String(run.floor))})">
    <aside class="map-side panel">
      <h2>${esc(f.name)}</h2>
      <p class="narrative">${esc(f.intro)}</p>
      <div class="legend">${(Object.keys(NODE_ICON) as NodeType[]).map((t) => `<span>${gi(NODE_ICON[t], '', NODE_COLOR[t])}${NODE_LABEL[t]}</span>`).join('')}</div>
      ${classPanel(run)}
      <h3>Side quests</h3>${questList(run)}
    </aside>
    <div class="map-scroll"><svg class="map" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${lines.join('')}${nodes.join('')}</svg></div>
  </div>`;
}

function intentHtml(run: RunState, e: EnemyState): string {
  const c = run.combat!;
  const move = currentMove(e);
  if (!move) return '';
  const dmg = intentDamage(c, e);
  const icons: string[] = [];
  if (dmg) icons.push(`<span class="intent-atk">${gi(UI_ICON.attack, '', IC.red)}${dmg.per}${dmg.times > 1 ? `<small>×${dmg.times}</small>` : ''}</span>`);
  for (const a of move.actions) {
    if (a.k === 'block') icons.push(`<span class="intent-def">${gi(UI_ICON.block, '', IC.blue)}</span>`);
    if (a.k === 'status') icons.push(a.to === 'player' ? `<span class="intent-debuff">${gi(UI_ICON.debuff, '', IC.purple)}</span>` : `<span class="intent-buff">${gi(UI_ICON.buff, '', IC.gold)}</span>`);
    if (a.k === 'summon') icons.push(`<span class="intent-buff">${gi(UI_ICON.summon, '', IC.gold)}</span>`);
    if (a.k === 'heal') icons.push(`<span class="intent-heal">${gi(UI_ICON.heal, '', IC.green)}</span>`);
    if (a.k === 'addCard') icons.push(`<span class="intent-debuff">${gi(UI_ICON.curse, '', IC.purple)}</span>`);
  }
  return `<div class="intent" title="${esc(move.name)}"><div class="intent-icons">${[...new Set(icons)].join('')}</div><small>${esc(move.name)}</small></div>`;
}

function combatView(run: RunState, ui: UiState): string {
  const c = run.combat!;
  const targeting = ui.selected !== null || ui.potionSelected !== null;
  const enemies = c.enemies
    .map((e) => {
      const d = enemyDef(e.id);
      return `<div class="enemy k-${d.kind} ${e.dead ? 'dead' : ''} ${targeting && !e.dead ? 'targetable' : ''}" data-action="target" data-uid="${e.uid}" data-fx="${e.uid}">
        ${e.dead ? '' : intentHtml(run, e)}
        <div class="fighter"><div class="enemy-sprite">${spriteImg(e.id, e.phase)}</div><div class="stand"></div></div>
        <div class="cursor-mark ${d.kind}">▼</div>
        <div class="enemy-name">${esc(d.name)}${e.phase ? ' <b class="phase">FÚRIA</b>' : ''}</div>
        ${hpBar(e.hp, e.maxHp, e.block)}
        ${statusIcons(e.st)}
      </div>`;
    })
    .join('');
  const mid = (c.hand.length - 1) / 2;
  const slots = reserveSlots(run);
  const slotsFull = c.reserved.length >= slots;
  const hand = c.hand
    .map((card, i) => {
      const playable = canPlay(run, i) && !ui.busy;
      const off = i - mid;
      const style = `--rot:${(off * 2.5).toFixed(1)}deg;--lift:${(off * off * 2.2).toFixed(1)}px`;
      const kept = c.reserved.includes(card.uid);
      const pin = `<button class="reserve-btn ${kept ? 'on' : ''} ${!kept && slotsFull ? 'full' : ''}" data-action="reserve" data-idx="${i}"
        title="${kept ? 'Tirar do Slot de Preparo' : 'Guardar no Slot de Preparo: fica na mão no próximo turno'}">${gi('back-forth', '', '#ffffff', 12)}${kept ? 'Guardada' : 'Guardar'}</button>`;
      return cardHtml(card, {
        action: 'card', data: { idx: i }, playable, selected: ui.selected === i, ctx: previewCtx(run, card), style,
        extraClass: kept ? 'reserved' : '', prefix: pin,
      });
    })
    .join('');
  const slotPips = Array.from({ length: slots }, (_, i) => `<i class="${i < c.reserved.length ? 'on' : ''}"></i>`).join('');
  const tagsPlayed = c.playedTags.map((ts) => (ts.length ? ts.map((t) => `<i class="pt pt-${t}"></i>`).join('') : '<i class="pt pt-none"></i>')).join('');
  const resultBanner =
    c.result === 'win' ? '<div class="banner win">VITÓRIA</div>' : c.result === 'lose' ? '<div class="banner lose">HP ZERADO</div>' : c.result === 'fled' ? '<div class="banner">TELEPORTE!</div>' : '';
  return `<div class="combat">
    <div class="arena" data-floor="${run.floor}" style="background-image:url(${sceneUrl(String(run.floor))})">
      <div class="player-side" data-fx="player">
        <div class="fighter"><div class="player-avatar">${spriteImg('hero')}</div><div class="stand"></div></div>
        <div class="cursor-mark player">▼</div>
        <div class="enemy-name">${esc(run.name)}</div>
        ${hpBar(run.hp, run.maxHp, c.block)}
        ${statusIcons(c.st)}
      </div>
      <div class="mult-panel" data-fx="mult">
        <div class="mult-label">MULT</div>
        <div class="mult-value ${c.mult >= 4 ? 'hot' : c.mult >= 2 ? 'warm' : ''}">×${fmtMult(Math.round(c.mult * 100) / 100)}</div>
        <div class="played-tags">${tagsPlayed}</div>
      </div>
      <div class="enemies">${enemies}</div>
      ${resultBanner}
    </div>
    <div class="hand-area">
      <div class="pile" data-action="overlay" data-overlay="draw">${gi(UI_ICON.draw)}<b>${c.draw.length}</b><small>Compra</small></div>
      <div class="energy" title="Energia"><span>${c.energy}<small>/${c.maxEnergy}</small></span></div>
      <div class="hand">${hand}</div>
      <div class="pile" data-action="overlay" data-overlay="discard">${gi(UI_ICON.discard)}<b>${c.discard.length}</b><small>Descarte</small></div>
      <div class="turn-box">
        <div class="reserve-slots" title="Slot de Preparo: cartas guardadas continuam na mão no próximo turno">
          <span>Preparo</span><span class="pips">${slotPips}</span>
        </div>
        <button class="btn primary end-turn ${ui.busy || c.result ? 'disabled' : ''}" data-action="end-turn">Fim do turno</button>
      </div>
    </div>
    ${ui.selected !== null ? '<div class="hint">Escolha um alvo (ou clique na carta de novo para cancelar)</div>' : ''}
    <button class="log-toggle btn small ghost" data-action="toggle-log">Log</button>
    ${ui.showLog ? `<div class="log">${c.log.slice(-14).map((l) => `<div>${esc(l)}</div>`).join('')}</div>` : ''}
  </div>`;
}

function rewardView(run: RunState): string {
  const r = run.reward!;
  const title = r.source === 'boss' ? 'Chefe derrotado!' : r.source === 'elite' ? 'Elite derrotado!' : r.source === 'chest' ? 'Baú aberto!' : 'Vitória!';
  const autos = r.auto.length
    ? `<h3>Drops automáticos</h3><div class="drop-row">${r.auto.map((d) => dropHtml(run, d)).join('')}</div>`
    : '';
  const evo = r.evolutions.length
    ? `<div class="evolution">✨ EVOLUÇÃO! ${r.evolutions.map((e) => `${cardDef(e.from).name} → <b>${cardDef(e.to).name}</b>`).join(', ')}</div>`
    : '';
  const quests = r.questsDone.length
    ? `<div class="quest-done">📜 Side quest concluída: ${r.questsDone.map((id) => `<b>${esc(questDef(id).title)}</b> → ${cardDef(questDef(id).reward).name} adicionada ao baralho e liberada para sempre!`).join('<br>')}</div>`
    : '';
  const boss = r.bossRelics?.length
    ? `<h3>Tesouro do chefe (escolha 1)</h3><div class="drop-row">${r.bossRelics
        .map((id) => `<div class="drop" style="--rar:#ff9f1c" data-action="boss-relic" data-id="${id}"><div class="drop-rarity">Lendário · Equipamento</div>
          <div class="drop-icon">${RELICS[id].icon}</div><div class="drop-name">${esc(RELICS[id].name)}</div><div class="drop-desc">${RELICS[id].desc}</div></div>`)
        .join('')}</div>`
    : '';
  const choices = r.choices
    ? `<h3>Escolha ${r.picks > 1 ? `${r.picks} drops` : '1 drop'}</h3>
      <div class="drop-row">${r.choices.map((d, i) => dropHtml(run, d, { action: 'take-drop', idx: i, disabled: !canTakeDrop(run, d) })).join('')}</div>
      <div class="menu row">
        <button class="btn ${run.col < r.rerollCost ? 'disabled' : ''}" data-action="reroll">${gi('back-forth')}Rerrolar · ${r.rerollCost ? `${gi(UI_ICON.coin, '', IC.gold)}${r.rerollCost}` : 'grátis'}</button>
        <button class="btn ghost" data-action="skip-drops">Pular</button>
      </div>`
    : '';
  return `<div class="screen-inner reward">
    <h2>${title}</h2>
    <div class="col-gain">${gi(UI_ICON.coin, '', IC.gold, 16)} +${r.col} col</div>
    ${quests}${evo}${autos}${boss}${choices}
    ${!r.choices ? `<div class="menu"><button class="btn primary" data-action="leave-reward">Continuar</button></div>` : ''}
  </div>`;
}

function shopView(run: RunState): string {
  const s = run.shop!;
  return `<div class="screen-inner shop">
    <h2>Cidade — Mercado e Quadro de Missões</h2>
    <div class="drop-row wrap">${s.items
      .map((it, i) => dropHtml(run, it.drop, { action: 'buy', idx: i, price: it.price, sold: it.sold, disabled: it.sold || run.col < it.price || !canTakeDrop(run, it.drop) }))
      .join('')}</div>
    <div class="menu row">
      <button class="btn ${s.removeUsed || run.col < s.removePrice ? 'disabled' : ''}" data-action="shop-remove">${gi(UI_ICON.discard)}Remover uma carta · ${gi(UI_ICON.coin, '', IC.gold)}${s.removePrice}</button>
    </div>
    <h3>Quadro de missões ❗ (${activeQuests(run).length}/${MAX_ACTIVE_QUESTS})</h3>
    <div class="quest-pick">${s.quests
      .map((id) => {
        const q = questDef(id);
        const full = activeQuests(run).length >= MAX_ACTIVE_QUESTS;
        return `<div class="quest-card ${full ? 'disabled' : ''}" data-action="shop-quest" data-id="${id}">
          <b>${esc(q.title)}</b><span class="muted">${esc(q.giver)}</span><p>${esc(q.text)}</p>
          <div class="goal">${gi('eye-target', '', IC.gold, 12)}${esc(q.goalText)}</div><div class="goal">${gi('open-treasure-chest', '', IC.gold, 12)}${cardDef(q.reward).name}</div>
          <div class="accept">${full ? 'Limite de quests ativas' : 'Aceitar'}</div></div>`;
      })
      .join('') || '<p class="muted">Nenhuma missão nova aqui.</p>'}</div>
    <div class="menu"><button class="btn primary" data-action="leave-shop">Sair da cidade</button></div>
  </div>`;
}

function innView(run: RunState): string {
  return `<div class="screen-inner inn">
    <h2>Pousada</h2>
    <p class="narrative">Uma cama de verdade, um prato quente e uma porta trancada. Por uma noite, Aincrad parece quase um lugar normal.</p>
    <div class="choice-row">
      <div class="choice" data-action="rest"><div class="choice-icon">${gi('bed', '', '#ffffff', 24)}</div><b>Descansar</b><p>Recupera ${Math.round(run.maxHp * 0.3)} HP.</p></div>
      <div class="choice" data-action="train"><div class="choice-icon">${gi('sword-brandish', '', '#ffffff', 24)}</div><b>Treinar</b><p>Melhora uma carta.</p></div>
    </div>
  </div>`;
}

function eventView(run: RunState): string {
  const ev = run.event!;
  const d = eventDef(ev.id);
  const choices = ev.result
    ? `<p class="event-result">${esc(ev.result)}</p><div class="menu"><button class="btn primary" data-action="leave-event">Continuar</button></div>`
    : `<div class="event-choices">${d.choices
        .map((ch, i) => {
          const ok = !ch.available || ch.available(run);
          return `<button class="btn event-choice ${ok ? '' : 'disabled'}" data-action="event-choice" data-idx="${i}"><b>${esc(ch.label)}</b><span>${esc(ch.desc)}</span></button>`;
        })
        .join('')}</div>`;
  return `<div class="screen-inner event">
    <div class="event-icon">${gi(EVENT_ICON[d.id] ?? 'treasure-map', '', '#ffffff', 24)}</div>
    <h2>${esc(d.title)}</h2>
    <p class="narrative">${esc(d.text)}</p>
    ${choices}
  </div>`;
}

function cardSelectView(run: RunState): string {
  const cs = run.cardSelect!;
  const cards = selectableCards(run);
  return `<div class="screen-inner">
    <h2>${esc(cs.title)}</h2>
    ${cs.price ? `<p class="muted">Custo: ${gi(UI_ICON.coin, '', IC.gold)}${cs.price}</p>` : ''}
    <div class="card-grid">${cards.map((c) => cardHtml(cs.purpose === 'upgrade' ? { id: c.id, up: true } : c, { action: 'select-card', data: { uid: c.uid } })).join('') || '<p class="muted">Nenhuma carta disponível.</p>'}</div>
    ${cs.cancelable || !cards.length ? '<div class="menu"><button class="btn ghost" data-action="cancel-select">Cancelar</button></div>' : ''}
  </div>`;
}

function floorClearView(run: RunState): string {
  return `<div class="screen-inner center">
    <div class="big-banner">ANDAR ${run.floor} LIBERADO</div>
    <p class="narrative">O portão de teleporte do andar ${run.floor + 1} foi ativado. Jogadores na Cidade do Início comemoram — pela primeira vez em semanas, há esperança.</p>
    <p class="muted">Você recupera parte do HP ao subir.</p>
    <div class="menu"><button class="btn primary" data-action="next-floor">Subir para o andar ${run.floor + 1}</button></div>
  </div>`;
}

function runSummary(run: RunState): string {
  const cls = computeClass(run.deck, run.skills);
  return `<div class="summary">
    <div>Classe final: <b>${esc(cls.name)}</b></div>
    <div>Andar alcançado: <b>${run.floor}</b> · Inimigos derrotados: <b>${run.stats.kills}</b></div>
    <div>Maior Mult: <b>×${fmtMult(run.stats.maxMult)}</b> · Maior golpe: <b>${run.stats.biggestHit}</b></div>
    <div>Side quests concluídas: <b>${run.quests.filter((q) => q.done).length}</b></div>
  </div>`;
}

function deadView(run: RunState): string {
  const killer = run.deathCause && (() => { try { return enemyDef(run.deathCause!).name; } catch { return null; } })();
  return `<div class="screen-inner center dead">
    <div class="big-banner red">YOU ARE DEAD</div>
    <p class="narrative">Seu avatar se desfaz em fragmentos de luz azul. Na Cidade do Início, uma linha é traçada sobre um nome no Monumento da Vida:
    <b><s>${esc(run.name)}</s></b>${killer ? ` — ${esc(killer)}` : ''}.</p>
    ${runSummary(run)}
    <p class="muted">As cartas que você liberou em side quests continuarão no pool das próximas runs.</p>
    <div class="menu"><button class="btn primary" data-action="end-run">Voltar ao título</button></div>
  </div>`;
}

function victoryView(run: RunState): string {
  return `<div class="screen-inner center">
    <div class="big-banner gold">ANDAR ${LAST_FLOOR} LIBERADO</div>
    <p class="narrative">Você chegou mais longe que a maioria. Ainda faltam ${100 - LAST_FLOOR} andares — mas esta versão de Aincrad termina aqui (por enquanto).</p>
    ${runSummary(run)}
    <div class="menu"><button class="btn primary" data-action="end-run">Voltar ao título</button></div>
  </div>`;
}

export function aliveCount(run: RunState) {
  return run.combat ? aliveEnemies(run.combat).length : 0;
}

export { needsTarget };
