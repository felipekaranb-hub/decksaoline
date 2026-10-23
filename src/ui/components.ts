import { cardDef, cardName, cardStats, describe, fmtMult, RARITY_LABEL, TAGS, TYPE_LABEL, type DescribeCtx } from '../game/cards';
import { computeClass, HYBRID_THRESHOLD, PURE_THRESHOLD, tagCounts } from '../game/classes';
import { dropName, RARITY_INFO } from '../game/drops';
import { POTIONS, RELICS } from '../game/items';
import { questDef } from '../game/quests';
import { SKILLS, MAX_SKILL_LEVEL, EVOLUTIONS } from '../game/skills';
import { STATUSES } from '../game/statuses';
import type { CardInst, Drop, RunState, Statuses, StatusId, Tag } from '../game/types';

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export function hpBar(hp: number, max: number, block = 0): string {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const color = pct > 50 ? 'green' : pct > 25 ? 'yellow' : 'red';
  return `<div class="hpbar ${color}">
    <div class="hpbar-fill" style="width:${pct}%"></div>
    <span class="hpbar-text">${hp}/${max}</span>
    ${block > 0 ? `<span class="hpbar-block">🛡️${block}</span>` : ''}
  </div>`;
}

export function statusIcons(st: Statuses): string {
  return `<div class="statuses">${(Object.entries(st) as [StatusId, number][])
    .filter(([, n]) => n !== 0)
    .map(([s, n]) => {
      const info = STATUSES[s];
      return `<span class="status ${info.debuff ? 'debuff' : 'buff'}" title="${esc(info.name + ': ' + info.desc(n))}">${info.icon}<b>${n}</b></span>`;
    })
    .join('')}</div>`;
}

export function tagChips(tags: Tag[]): string {
  return tags
    .map((t) => `<span class="tag" style="--tag:${TAGS[t].color}" title="${TAGS[t].name}">${TAGS[t].icon} ${TAGS[t].name}</span>`)
    .join('');
}

export interface CardOpts {
  action?: string;
  data?: Record<string, string | number>;
  playable?: boolean;
  selected?: boolean;
  ctx?: DescribeCtx;
  extraClass?: string;
}

export function cardHtml(inst: Pick<CardInst, 'id' | 'up'>, o: CardOpts = {}): string {
  const d = cardDef(inst.id);
  const s = cardStats(inst);
  const data = Object.entries(o.data ?? {})
    .map(([k, v]) => `data-${k}="${v}"`)
    .join(' ');
  const cls = [
    'card',
    `t-${d.type}`,
    `r-${d.rarity}`,
    inst.up ? 'upgraded' : '',
    o.playable === false ? 'unplayable' : '',
    o.selected ? 'selected' : '',
    o.extraClass ?? '',
  ].join(' ');
  return `<div class="${cls}" ${o.action ? `data-action="${o.action}"` : ''} ${data}>
    <div class="card-cost">${s.cost === null ? '—' : s.cost}</div>
    <div class="card-name">${esc(cardName(inst))}</div>
    <div class="card-type">${TYPE_LABEL[d.type]}${d.rarity !== 'starter' && d.rarity !== 'curse' ? ` · ${RARITY_LABEL[d.rarity]}` : ''}</div>
    <div class="card-tags">${tagChips(d.tags)}</div>
    <div class="card-text">${describe(inst, o.ctx)}</div>
    ${d.flavor ? `<div class="card-flavor">${esc(d.flavor)}</div>` : ''}
  </div>`;
}

export function dropHtml(run: RunState, d: Drop, o: { action?: string; idx?: number; price?: number; disabled?: boolean; sold?: boolean } = {}): string {
  const r = RARITY_INFO[d.rarity];
  const attrs = `${o.action ? `data-action="${o.action}"` : ''} ${o.idx !== undefined ? `data-idx="${o.idx}"` : ''}`;
  let body = '';
  let kindLabel = '';
  if (d.kind === 'card') {
    kindLabel = 'Carta';
    body = cardHtml({ id: d.id, up: !!d.up }, { extraClass: 'in-drop' });
  } else if (d.kind === 'skill') {
    const s = SKILLS[d.id];
    const lv = run.skills[d.id] ?? 0;
    kindLabel = lv ? `Habilidade · Lv ${lv} → ${lv + 1}` : 'Habilidade · NOVA';
    body = `<div class="drop-icon">${s.icon}</div><div class="drop-name">${esc(s.name)}</div>
      ${s.tag ? `<div class="card-tags">${tagChips([s.tag])}</div>` : ''}
      <div class="drop-desc">${s.desc(Math.min(MAX_SKILL_LEVEL, lv + 1))}</div>`;
  } else if (d.kind === 'relic') {
    const rel = RELICS[d.id];
    kindLabel = 'Equipamento';
    body = `<div class="drop-icon">${rel.icon}</div><div class="drop-name">${esc(rel.name)}</div><div class="drop-desc">${rel.desc}</div>`;
  } else {
    const p = POTIONS[d.id];
    kindLabel = 'Consumível';
    body = `<div class="drop-icon">${p.icon}</div><div class="drop-name">${esc(p.name)}</div><div class="drop-desc">${p.desc}</div>`;
  }
  return `<div class="drop ${o.disabled ? 'disabled' : ''} ${o.sold ? 'sold' : ''}" style="--rar:${r.color}" ${attrs} title="${esc(dropName(d))}">
    <div class="drop-rarity">${r.name} · ${kindLabel}</div>
    ${body}
    ${o.price !== undefined ? `<div class="price">${o.sold ? 'VENDIDO' : `🪙 ${o.price}`}</div>` : ''}
  </div>`;
}

export function classPanel(run: RunState, full = false): string {
  const cls = computeClass(run.deck, run.skills);
  const counts = tagCounts(run.deck, run.skills);
  const bars = (Object.keys(TAGS) as Tag[])
    .map((t) => {
      const pct = Math.min(100, (counts[t] / PURE_THRESHOLD) * 100);
      return `<div class="aff" title="${TAGS[t].name}: ${counts[t]}">
        <span>${TAGS[t].icon}</span>
        <div class="aff-bar"><div style="width:${pct}%;background:${TAGS[t].color}"></div>
        <i style="left:${(HYBRID_THRESHOLD / PURE_THRESHOLD) * 100}%"></i></div>
        <b>${counts[t]}</b></div>`;
    })
    .join('');
  return `<div class="class-panel ${full ? 'full' : ''}">
    <div class="class-name">${esc(cls.name)}</div>
    ${full ? `<div class="class-desc">${cls.desc}</div>` : ''}
    <div class="affinities">${bars}</div>
  </div>`;
}

export function skillsList(run: RunState): string {
  const ids = Object.keys(run.skills);
  if (!ids.length) return '<p class="muted">Nenhuma habilidade ainda. Elas caem como drops e sobem de nível ao pegar de novo.</p>';
  return ids
    .map((id) => {
      const s = SKILLS[id];
      const lv = run.skills[id];
      const evo = EVOLUTIONS.filter((e) => e.skill === id)
        .map((e) => `<div class="evo-hint">✨ Evolução: ${cardDef(e.card).name} + Lv ${e.level} → <b>${cardDef(e.into).name}</b></div>`)
        .join('');
      return `<div class="skill-row"><span class="skill-icon">${s.icon}</span>
        <div><b>${esc(s.name)}</b> <span class="lv">Lv ${lv}/${MAX_SKILL_LEVEL}</span><div class="muted">${s.desc(lv)}</div>${evo}</div></div>`;
    })
    .join('');
}

export function questList(run: RunState): string {
  if (!run.quests.length) return '<p class="muted">Nenhuma side quest. Procure NPCs com ❗ nas cidades e eventos.</p>';
  return run.quests
    .map((q) => {
      const d = questDef(q.id);
      const pct = Math.min(100, (q.progress / d.goal) * 100);
      return `<div class="quest ${q.done ? 'done' : ''}">
        <div><b>${q.done ? '✅' : '❗'} ${esc(d.title)}</b> <span class="muted">— ${esc(d.giver)}</span></div>
        <div class="muted">${esc(d.goalText)} · Recompensa: <b>${cardDef(d.reward).name}</b></div>
        <div class="qbar"><div style="width:${pct}%"></div><span>${fmtMult(q.progress)}/${d.goal}</span></div>
      </div>`;
    })
    .join('');
}
