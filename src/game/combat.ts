import { cardDef, cardName, cardStats, fmtMult, type DescribeCtx } from './cards';
import { computeClass } from './classes';
import { enemyDef } from './enemies';
import { POTIONS } from './items';
import { questSignal, type QuestSignal } from './quests';
import { pick, rand, randInt, shuffle } from './rng';
import { STATUSES } from './statuses';
import type {
  CardDef,
  CardInst,
  CombatState,
  EnemyAction,
  EnemyKind,
  EnemyMove,
  EnemyState,
  RunState,
  Statuses,
  StatusId,
  Tag,
} from './types';

export const BASE_ENERGY = 3;
export const HAND_SIZE = 5;
export const MAX_HAND = 10;
export const MAX_ENEMIES = 4;

const has = (run: RunState, relic: string) => run.relics.includes(relic);
export const skillLv = (run: RunState, id: string) => run.skills[id] ?? 0;

function addSt(st: Statuses, s: StatusId, n: number) {
  const v = (st[s] ?? 0) + n;
  // Força/Destreza podem ficar negativas; os demais status somem ao chegar a 0
  const canBeNegative = s === 'strength' || s === 'dexterity';
  if (v === 0 || (v < 0 && !canBeNegative)) delete st[s];
  else st[s] = v;
}

function log(c: CombatState, msg: string) {
  c.log.push(msg);
  if (c.log.length > 40) c.log.shift();
}

function signal(run: RunState, sig: QuestSignal) {
  for (const id of questSignal(run, sig)) {
    run.combat?.fx.push({ target: 'mult', text: '📜 QUEST CONCLUÍDA!', kind: 'loot' });
    run.combat && log(run.combat, `Side quest concluída! (${id})`);
  }
}

// ───────────────────────── Inimigos ─────────────────────────

export function enemyMoves(e: EnemyState): Record<string, EnemyMove> {
  const d = enemyDef(e.id);
  return e.phase > 0 && d.phase2?.moves ? d.phase2.moves : d.moves;
}

export function currentMove(e: EnemyState): EnemyMove {
  return enemyMoves(e)[e.intent];
}

function chooseIntent(run: RunState, c: CombatState, e: EnemyState) {
  const d = enemyDef(e.id);
  const picker = e.phase > 0 && d.phase2?.pick ? d.phase2.pick : d.pick;
  e.intent = picker({
    turn: e.turn,
    history: e.history,
    rand: () => rand(run),
    enemy: e,
    allies: c.enemies.filter((o) => !o.dead && o !== e).length,
  });
}

function spawnEnemy(run: RunState, c: CombatState, id: string): EnemyState {
  const d = enemyDef(id);
  const hp = randInt(run, d.hp[0], d.hp[1]);
  const e: EnemyState = {
    uid: c.nextUid++,
    id,
    hp,
    maxHp: hp,
    block: 0,
    st: { ...(d.start ?? {}) },
    intent: '',
    history: [],
    phase: 0,
    dead: false,
    turn: 0,
  };
  if (has(run, 'coroa_taurus')) addSt(e.st, 'strength', 1);
  c.enemies.push(e);
  chooseIntent(run, c, e);
  return e;
}

export function aliveEnemies(c: CombatState): EnemyState[] {
  return c.enemies.filter((e) => !e.dead);
}

// ───────────────────────── Combos (estilo Balatro) ─────────────────────────

export interface ComboBonus {
  label: string;
  add?: number;
  x?: number;
}

const classBonus = (c: CombatState, tag: Tag) => (c.classTags.includes(tag) ? c.classPower : 0);

/**
 * Padrões detectados ao jogar uma carta, com base nas cartas já jogadas neste turno.
 * Função pura: usada tanto para aplicar quanto para pré-visualizar.
 */
export function comboBonuses(run: RunState, c: CombatState, def: CardDef): ComboBonus[] {
  const out: ComboBonus[] = [];
  const tags = def.tags;
  const prev = c.playedTags[c.playedTags.length - 1];

  if (tags.length && prev && tags.some((t) => prev.includes(t))) {
    const add = 0.5 + 0.25 * skillLv(run, 'harmonia') + 0.5 * classBonus(c, 'florete');
    out.push({ label: 'CONEXÃO', add });
  }
  for (const t of tags) {
    const count = c.playedTags.filter((ts) => ts.includes(t)).length + 1;
    if (count === 3) out.push({ label: 'TRINCA', add: 1 });
    if (count === 5) out.push({ label: 'FULL COMBO', x: 1.5 });
  }
  const distinctBefore = new Set(c.playedTags.flat());
  const distinctAfter = new Set([...distinctBefore, ...tags]);
  if (distinctBefore.size < 3 && distinctAfter.size >= 3) {
    const add = 1 + 0.5 * skillLv(run, 'polivalente') + (c.classId === 'polivalente' ? 1 : 0);
    out.push({ label: 'ARSENAL', add });
  }
  if (distinctBefore.size < 5 && distinctAfter.size >= 5) out.push({ label: 'ARSENAL COMPLETO', x: 2 });
  if (def.type === 'swordskill' && c.lastType === 'swordskill') {
    const lv = skillLv(run, 'skill_connect');
    out.push({ label: 'SKILL CHAIN', x: lv ? 1.5 + 0.25 * (lv - 1) : 1.5 });
  }
  const fl = skillLv(run, 'mestria_florete');
  if (fl && tags.includes('florete')) out.push({ label: 'MESTRIA', add: 0.2 * fl });
  return out;
}

function applyBonuses(c: CombatState, bonuses: ComboBonus[]) {
  for (const b of bonuses) {
    if (b.add) c.mult += b.add;
    if (b.x) c.mult *= b.x;
    c.fx.push({ target: 'mult', text: `${b.label} ${b.add ? `+${fmtMult(b.add)}` : `×${fmtMult(b.x!)}`}`, kind: 'combo' });
  }
}

/** Mult previsto se a carta for jogada agora (inclui bônus de padrão e +Mult da própria carta antes do dano). */
function projectedMult(run: RunState, c: CombatState, def: CardDef, effectsBeforeDmg: CardDef['base']['effects']): number {
  let m = c.mult;
  for (const b of comboBonuses(run, c, def)) {
    if (b.add) m += b.add;
    if (b.x) m *= b.x;
  }
  for (const e of effectsBeforeDmg) {
    if (e.k === 'mult') m += e.n;
    if (e.k === 'xmult') m *= e.n;
    if (e.k === 'multPerTag') m += e.n * new Set([...c.playedTags.flat(), ...def.tags]).size;
  }
  return m;
}

// ───────────────────────── Cálculos ─────────────────────────

export function attackDamage(base: number, attacker: Statuses, defender: Statuses): number {
  let d = base + (attacker.strength ?? 0);
  if (attacker.weak) d *= 0.75;
  if (defender.vulnerable) d *= 1.5;
  return Math.max(0, Math.floor(d));
}

/** Bônus fixo de dano por tag (Mestria de Espada, classe Espadachim). */
function flatBonus(run: RunState, c: CombatState, def: CardDef): number {
  if (!def.tags.includes('espada')) return 0;
  return 2 * skillLv(run, 'mestria_espada') + Math.round(2 * classBonus(c, 'espada'));
}

/** Multiplicador de dano por tag (Mestria de Machado, classe Machadeiro). */
function tagDamageMult(run: RunState, c: CombatState, def: CardDef): number {
  if (!def.tags.includes('machado')) return 1;
  return (1 + 0.1 * skillLv(run, 'mestria_machado')) * (1 + 0.25 * classBonus(c, 'machado'));
}

function finalDamage(run: RunState, c: CombatState, def: CardDef, base: number, mult: number, defender: Statuses): number {
  const sw = c.st.switch ? 1.5 : 1;
  const raw = attackDamage(base + flatBonus(run, c, def), c.st, defender);
  return Math.floor(raw * mult * tagDamageMult(run, c, def) * sw);
}

function finalBlock(run: RunState, c: CombatState, def: CardDef, base: number, mult: number): number {
  let n = base + (c.st.dexterity ?? 0);
  if (def.tags.includes('escudo')) n = (n + 2 * skillLv(run, 'mestria_escudo')) * mult;
  return Math.max(0, Math.floor(n));
}

/** Contexto para a UI mostrar o dano/bloqueio previsto de uma carta na mão. */
export function previewCtx(run: RunState, inst: CardInst): DescribeCtx | undefined {
  const c = run.combat;
  if (!c) return undefined;
  const def = cardDef(inst.id);
  const effects = cardStats(inst).effects;
  const firstDmg = effects.findIndex((e) => e.k === 'dmg' || e.k === 'dmgBlock');
  const before = firstDmg < 0 ? effects : effects.slice(0, firstDmg);
  const m = projectedMult(run, c, def, before);
  const blockBefore = before.reduce((s, e) => (e.k === 'block' ? s + finalBlock(run, c, def, e.n, m) : s), 0);
  return {
    dmg: (b) => finalDamage(run, c, def, b, m, {}),
    blk: (b) => finalBlock(run, c, def, b, m),
    block: c.block + blockBefore,
  };
}

/** Dano total previsto da intenção do inimigo (para exibir na UI). */
export function intentDamage(c: CombatState, e: EnemyState): { per: number; times: number } | null {
  const move = currentMove(e);
  if (!move) return null;
  const atk = move.actions.find((a): a is Extract<EnemyAction, { k: 'attack' }> => a.k === 'attack');
  if (!atk) return null;
  return { per: attackDamage(atk.n, e.st, c.st), times: atk.times ?? 1 };
}

// ───────────────────────── Dano / cura ─────────────────────────

function damagePlayer(run: RunState, c: CombatState, amount: number, fromAttack: boolean) {
  let rest = amount;
  if (c.block > 0) {
    const absorbed = Math.min(c.block, rest);
    c.block -= absorbed;
    rest -= absorbed;
  }
  c.fx.push({ target: 'player', text: rest > 0 ? `-${rest}` : 'Bloqueado', kind: rest > 0 ? 'dmg' : 'block' });
  if (rest > 0) {
    run.hp = Math.max(0, run.hp - rest);
    c.tookDamage = true;
    if (fromAttack && c.st.rage) addSt(c.st, 'strength', c.st.rage);
  }
  if (run.hp <= 0) c.result = 'lose';
}

function rollLoot(run: RunState, c: CombatState, e: EnemyState) {
  if (enemyDef(e.id).kind === 'boss' || rand(run) > 0.3) return;
  if (rand(run) < 0.7) {
    const n = randInt(run, 5, 15);
    c.loot.push({ kind: 'col', n });
    c.fx.push({ target: e.uid, text: `🪙 +${n}`, kind: 'loot' });
  } else {
    const id = pick(run, Object.keys(POTIONS));
    c.loot.push({ kind: 'potion', id });
    c.fx.push({ target: e.uid, text: `🎁 ${POTIONS[id].icon}`, kind: 'loot' });
  }
}

function damageEnemy(run: RunState, c: CombatState, e: EnemyState, amount: number) {
  if (e.dead) return;
  let rest = amount;
  if (e.block > 0) {
    const absorbed = Math.min(e.block, rest);
    e.block -= absorbed;
    rest -= absorbed;
  }
  e.hp = Math.max(0, e.hp - rest);
  c.fx.push({ target: e.uid, text: rest > 0 ? `-${rest}` : 'Bloqueado', kind: rest > 0 ? 'dmg' : 'block' });
  if (e.hp <= 0) {
    e.dead = true;
    e.block = 0;
    c.fx.push({ target: e.uid, text: '', kind: 'death' });
    run.stats.kills++;
    log(c, `${enemyDef(e.id).name} se desfez em polígonos.`);
    signal(run, { k: 'kill', enemy: e.id });
    rollLoot(run, c, e);
    if (enemyDef(e.id).kind === 'boss') {
      // Lacaios somem quando o chefe cai
      for (const o of c.enemies) if (!o.dead) { o.dead = true; o.hp = 0; }
    }
    if (aliveEnemies(c).length === 0) c.result = 'win';
    return;
  }
  const d = enemyDef(e.id);
  if (d.phase2 && e.phase === 0 && e.hp <= e.maxHp * d.phase2.at) {
    e.phase = 1;
    for (const [s, n] of Object.entries(d.phase2.status ?? {})) addSt(e.st, s as StatusId, n);
    log(c, d.phase2.msg);
    c.fx.push({ target: e.uid, text: 'FASE 2', kind: 'status' });
    if (d.phase2.moves) {
      e.history = [];
      chooseIntent(run, c, e);
    }
  }
}

function healPlayer(run: RunState, c: CombatState | null, n: number) {
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + n);
  if (c && run.hp > before) c.fx.push({ target: 'player', text: `+${run.hp - before}`, kind: 'heal' });
}

function applyEnemyStatus(run: RunState, c: CombatState, t: EnemyState, s: StatusId, n: number) {
  addSt(t.st, s, n);
  c.fx.push({ target: t.uid, text: `${STATUSES[s].icon} ${n}`, kind: 'status' });
  if (s === 'bleed') signal(run, { k: 'bleed', value: t.st.bleed ?? 0 });
}

// ───────────────────────── Cartas ─────────────────────────

function drawCards(run: RunState, c: CombatState, n: number) {
  for (let i = 0; i < n; i++) {
    if (c.hand.length >= MAX_HAND) return;
    if (c.draw.length === 0) {
      if (c.discard.length === 0) return;
      c.draw = shuffle(run, c.discard);
      c.discard = [];
    }
    c.hand.push(c.draw.pop()!);
  }
}

export function canPlay(run: RunState, handIdx: number): boolean {
  const c = run.combat;
  if (!c || c.result) return false;
  const card = c.hand[handIdx];
  if (!card) return false;
  const s = cardStats(card);
  return s.cost !== null && s.cost <= c.energy;
}

export function playCard(run: RunState, handIdx: number, targetUid?: number): boolean {
  const c = run.combat;
  if (!c || !canPlay(run, handIdx)) return false;
  const card = c.hand[handIdx];
  const def = cardDef(card.id);
  const s = cardStats(card);
  const target = c.enemies.find((e) => e.uid === targetUid && !e.dead) ?? aliveEnemies(c)[0];

  c.energy -= s.cost!;
  c.hand.splice(handIdx, 1);
  log(c, `Você usou ${cardName(card)}.`);

  // 1) Padrões de combo do turno
  applyBonuses(c, comboBonuses(run, c, def));
  c.playedTags.push([...def.tags]);
  c.lastType = def.type;
  signal(run, { k: 'tagsTurn', value: new Set(c.playedTags.flat()).size });

  const isAttack = def.type === 'attack' || def.type === 'swordskill';
  let bonus = isAttack && !c.firstAttackUsed && has(run, 'pedra_afiar') ? 8 : 0;
  let dealtDamage = false;

  if (def.type === 'swordskill') {
    // Rastro de luz da Sword Skill (cor da tag na UI)
    const hitsAll = s.effects.some((e) => e.k === 'dmg' && e.all);
    for (const t of hitsAll ? aliveEnemies(c) : [target].filter(Boolean)) {
      c.fx.push({ target: t.uid, text: def.tags[0] ?? 'none', kind: 'slash' });
    }
  }

  // 2) Efeitos da carta, em ordem
  for (const eff of s.effects) {
    if (c.result) break;
    switch (eff.k) {
      case 'dmg': {
        const times = eff.times ?? 1;
        for (let i = 0; i < times && !c.result; i++) {
          const targets = eff.all ? aliveEnemies(c) : [target].filter((t) => t && !t.dead);
          for (const t of targets) {
            const dmg = finalDamage(run, c, def, eff.n + bonus, c.mult, t.st);
            damageEnemy(run, c, t, dmg);
            signal(run, { k: 'hit', value: dmg });
            run.stats.biggestHit = Math.max(run.stats.biggestHit, dmg);
            if (t.st.thorns && !t.dead) damagePlayer(run, c, t.st.thorns, false);
            dealtDamage = true;
          }
          bonus = 0;
        }
        break;
      }
      case 'dmgBlock':
        if (target && !target.dead) {
          const dmg = finalDamage(run, c, def, c.block + bonus, c.mult, target.st);
          damageEnemy(run, c, target, dmg);
          signal(run, { k: 'hit', value: dmg });
          run.stats.biggestHit = Math.max(run.stats.biggestHit, dmg);
          dealtDamage = true;
        }
        bonus = 0;
        break;
      case 'block': {
        const n = finalBlock(run, c, def, eff.n, c.mult);
        c.block += n;
        c.blockGainedThisTurn += n;
        c.fx.push({ target: 'player', text: `+${n} 🛡️`, kind: 'block' });
        signal(run, { k: 'blockTurn', value: c.blockGainedThisTurn });
        break;
      }
      case 'draw':
        drawCards(run, c, eff.n);
        break;
      case 'energy':
        c.energy += eff.n;
        break;
      case 'mult':
        c.mult += eff.n;
        c.fx.push({ target: 'mult', text: `+${fmtMult(eff.n)} Mult`, kind: 'combo' });
        break;
      case 'xmult':
        c.mult *= eff.n;
        c.fx.push({ target: 'mult', text: `×${fmtMult(eff.n)} Mult`, kind: 'combo' });
        break;
      case 'multPerTag': {
        const add = eff.n * new Set(c.playedTags.flat()).size;
        c.mult += add;
        c.fx.push({ target: 'mult', text: `+${fmtMult(add)} Mult`, kind: 'combo' });
        break;
      }
      case 'bleedMult':
        if (target && target.st.bleed) applyEnemyStatus(run, c, target, 'bleed', target.st.bleed * (eff.n - 1));
        break;
      case 'status': {
        if (eff.to === 'self') addSt(c.st, eff.s, eff.n);
        else {
          const ts = eff.to === 'allEnemies' ? aliveEnemies(c) : [target].filter((t) => t && !t.dead);
          for (const t of ts) applyEnemyStatus(run, c, t, eff.s, eff.n);
        }
        break;
      }
      case 'heal':
        healPlayer(run, c, eff.n);
        break;
      case 'loseHp':
        run.hp = Math.max(0, run.hp - eff.n);
        c.fx.push({ target: 'player', text: `-${eff.n}`, kind: 'dmg' });
        if (run.hp <= 0) c.result = 'lose';
        break;
      case 'addCard':
        for (let i = 0; i < (eff.n ?? 1); i++) {
          const inst: CardInst = { uid: c.nextUid++, id: eff.id, up: false };
          if (eff.to === 'hand' && c.hand.length < MAX_HAND) c.hand.push(inst);
          else if (eff.to === 'draw') c.draw.splice(Math.floor(rand(run) * (c.draw.length + 1)), 0, inst);
          else c.discard.push(inst);
        }
        break;
    }
  }

  // 3) Efeitos pós-carta
  if (dealtDamage && target && !target.dead && !c.result) {
    const adaga = def.tags.includes('adaga') ? skillLv(run, 'mestria_adaga') : 0;
    if (adaga) applyEnemyStatus(run, c, target, 'bleed', adaga);
    if (c.attacksThisTurn === 0 && c.classTags.includes('adaga')) {
      applyEnemyStatus(run, c, target, 'bleed', Math.round(2 * c.classPower));
    }
  }
  if (isAttack) {
    c.attacksThisTurn++;
    c.firstAttackUsed = true;
    if (c.st.switch) delete c.st.switch;
  }
  if (def.type === 'swordskill') {
    const free = (c.ssThisTurn === 0 && skillLv(run, 'skill_connect') > 0) || !!c.st.noDelay;
    if (s.delay && !free) addSt(c.st, 'delay', s.delay);
    c.ssThisTurn++;
    signal(run, { k: 'ssTurn', value: c.ssThisTurn });
    if (c.st.swordDance) {
      c.block += c.st.swordDance;
      c.fx.push({ target: 'player', text: `+${c.st.swordDance} 🛡️`, kind: 'block' });
    }
  }
  signal(run, { k: 'mult', value: c.mult });
  run.stats.maxMult = Math.max(run.stats.maxMult, Math.round(c.mult * 100) / 100);

  if (def.type === 'power') {
    // Poderes saem do baralho de combate depois de usados
  } else if (s.exhaust) c.exhaust.push(card);
  else c.discard.push(card);
  return true;
}

// ───────────────────────── Turnos ─────────────────────────

export function startCombat(run: RunState, enemyIds: string[], kind: EnemyKind) {
  const cls = computeClass(run.deck, run.skills);
  const c: CombatState = {
    enemies: [],
    draw: [],
    hand: [],
    discard: [],
    exhaust: [],
    energy: 0,
    maxEnergy: BASE_ENERGY + (has(run, 'talwar_kobold') ? 1 : 0) + (has(run, 'coroa_taurus') ? 1 : 0),
    block: 0,
    st: {},
    turn: 0,
    mult: 1,
    playedTags: [],
    lastType: null,
    attacksThisTurn: 0,
    ssThisTurn: 0,
    blockGainedThisTurn: 0,
    firstAttackUsed: false,
    tookDamage: false,
    classId: cls.id,
    classTags: cls.tags,
    classPower: cls.power,
    kind,
    result: null,
    loot: [],
    log: [],
    fx: [],
    nextUid: 1000,
  };
  run.combat = c;
  for (const id of enemyIds) spawnEnemy(run, c, id);
  c.draw = shuffle(run, run.deck.map((card) => ({ ...card })));

  if (has(run, 'anel_forca')) addSt(c.st, 'strength', 1);
  if (has(run, 'sobretudo_negro')) addSt(c.st, 'dexterity', 1);
  if (has(run, 'talwar_kobold')) addSt(c.st, 'delay', 1);
  run.stats.combats++;
  log(c, `Combate iniciado! Classe: ${cls.name}.`);
  startPlayerTurn(run);
  // Bloqueio inicial de equipamentos vem depois do reset de bloqueio do turno
  if (has(run, 'escudo_redondo')) c.block += 6;
  if (has(run, 'cota_malha')) c.block += 10;
}

export function startPlayerTurn(run: RunState) {
  const c = run.combat!;
  c.turn++;
  c.block = 0;
  c.mult = 1 + 0.25 * skillLv(run, 'foco') + (has(run, 'cristal_ressonancia') ? 0.5 : 0);
  c.playedTags = [];
  c.lastType = null;
  c.attacksThisTurn = 0;
  c.ssThisTurn = 0;
  c.blockGainedThisTurn = 0;

  if (c.st.bleed) {
    const n = c.st.bleed;
    run.hp = Math.max(0, run.hp - n);
    c.tookDamage = true;
    c.fx.push({ target: 'player', text: `-${n} 🩸`, kind: 'dmg' });
    addSt(c.st, 'bleed', -1);
    if (run.hp <= 0) {
      c.result = 'lose';
      return;
    }
  }
  if (c.st.ritual) addSt(c.st, 'strength', c.st.ritual);
  if (c.st.flow && c.st.delay) addSt(c.st, 'delay', -Math.min(c.st.flow, c.st.delay));
  if (c.classTags.includes('escudo')) c.block += Math.round(3 * c.classPower);

  const delay = c.st.delay ?? 0;
  delete c.st.delay;
  c.energy = Math.max(0, c.maxEnergy - delay);
  if (delay > 0) log(c, `Atraso pós-movimento: -${delay} de Energia.`);

  let n = HAND_SIZE + (c.st.drawUp ?? 0);
  if (c.turn === 1) n += skillLv(run, 'deteccao');
  drawCards(run, c, n);
}

/** Fase 1 do fim de turno: efeitos de fim de turno do jogador e descarte da mão. */
export function endPlayerTurn(run: RunState) {
  const c = run.combat!;
  if (c.result) return;
  if (c.st.guard) c.block += c.st.guard;
  if (c.st.regen) healPlayer(run, c, c.st.regen);
  const bh = skillLv(run, 'battle_healing');
  if (bh) healPlayer(run, c, bh);
  for (const card of c.hand) {
    const lose = cardDef(card.id).endTurnLoseHp;
    if (lose) {
      run.hp = Math.max(0, run.hp - lose);
      c.tookDamage = true;
      c.fx.push({ target: 'player', text: `-${lose}`, kind: 'dmg' });
      log(c, `${cardDef(card.id).name} te atormenta (-${lose} HP).`);
    }
  }
  if (run.hp <= 0) {
    c.result = 'lose';
    return;
  }
  c.discard.push(...c.hand);
  c.hand = [];
  decay(c.st);
}

function decay(st: Statuses) {
  for (const s of Object.keys(st) as StatusId[]) {
    if (STATUSES[s].decays) addSt(st, s, -1);
  }
}

/** Fase 2: um inimigo age. Retorna false se não havia o que fazer. */
export function enemyTakeTurn(run: RunState, index: number): boolean {
  const c = run.combat!;
  const e = c.enemies[index];
  if (!e || e.dead || c.result) return false;
  e.block = 0;
  if (e.st.bleed) {
    damageEnemy(run, c, e, e.st.bleed);
    addSt(e.st, 'bleed', -1);
    if (e.dead || c.result) return true;
  }
  const move = currentMove(e);
  const name = enemyDef(e.id).name;
  log(c, `${name}: ${move.name}.`);
  for (const a of move.actions) {
    if (c.result || e.dead) break;
    switch (a.k) {
      case 'attack':
        for (let i = 0; i < (a.times ?? 1) && !c.result && !e.dead; i++) {
          damagePlayer(run, c, attackDamage(a.n, e.st, c.st), true);
          if (c.st.thorns) damageEnemy(run, c, e, c.st.thorns);
        }
        break;
      case 'block':
        e.block += a.n;
        c.fx.push({ target: e.uid, text: `+${a.n} 🛡️`, kind: 'block' });
        break;
      case 'status':
        if (a.to === 'self') addSt(e.st, a.s, a.n);
        else if (a.to === 'player') {
          addSt(c.st, a.s, a.n);
          c.fx.push({ target: 'player', text: `${STATUSES[a.s].icon} ${a.n}`, kind: 'status' });
        } else for (const o of aliveEnemies(c)) addSt(o.st, a.s, a.n);
        break;
      case 'addCard':
        for (let i = 0; i < a.n; i++) c.discard.push({ uid: c.nextUid++, id: a.id, up: false });
        log(c, `${cardDef(a.id).name} foi adicionado ao seu descarte.`);
        break;
      case 'heal':
        e.hp = Math.min(e.maxHp, e.hp + a.n);
        c.fx.push({ target: e.uid, text: `+${a.n}`, kind: 'heal' });
        break;
      case 'summon':
        if (aliveEnemies(c).length < MAX_ENEMIES) {
          const s = spawnEnemy(run, c, a.id);
          log(c, `${enemyDef(s.id).name} entrou na batalha!`);
        }
        break;
    }
  }
  e.history.push(e.intent);
  e.turn++;
  if (e.st.ritual) addSt(e.st, 'strength', e.st.ritual);
  decay(e.st);
  return true;
}

/** Fase 3: inimigos escolhem novas intenções e começa o turno do jogador. */
export function startNextRound(run: RunState) {
  const c = run.combat!;
  if (c.result) return;
  // Remove mortos só aqui, para manter índices estáveis durante a fase dos inimigos
  c.enemies = c.enemies.filter((e) => !e.dead);
  for (const e of c.enemies) chooseIntent(run, c, e);
  startPlayerTurn(run);
}

/** Fim de turno completo e síncrono (usado em testes e como fallback). */
export function endTurn(run: RunState) {
  endPlayerTurn(run);
  const n = run.combat!.enemies.length;
  for (let i = 0; i < n; i++) enemyTakeTurn(run, i);
  startNextRound(run);
}

// ───────────────────────── Consumíveis ─────────────────────────

export function canUsePotion(run: RunState, slot: number): boolean {
  const id = run.potions[slot];
  if (!id) return false;
  const p = POTIONS[id];
  const inCombat = !!run.combat && !run.combat.result && run.screen === 'combat';
  if (inCombat) return !(id === 'cristal_teleporte' && run.combat!.kind === 'boss');
  return p.outOfCombat && run.hp < run.maxHp;
}

export function usePotion(run: RunState, slot: number, targetUid?: number): boolean {
  if (!canUsePotion(run, slot)) return false;
  const id = run.potions[slot]!;
  const c = run.screen === 'combat' ? run.combat : null;
  run.potions[slot] = null;
  switch (id) {
    case 'pocao_cura':
      healPlayer(run, c, 15);
      break;
    case 'cristal_cura':
      healPlayer(run, c, Math.round(run.maxHp * 0.35));
      break;
    case 'cristal_teleporte':
      if (c) {
        c.result = 'fled';
        log(c, 'Teleporte! Você escapou do combate.');
      }
      break;
    case 'pocao_forca':
      if (c) addSt(c.st, 'strength', 2);
      break;
    case 'bomba_fumaca':
      if (c) for (const e of aliveEnemies(c)) applyEnemyStatus(run, c, e, 'weak', 2);
      break;
    case 'faca_arremesso':
      if (c) {
        const t = c.enemies.find((e) => e.uid === targetUid && !e.dead) ?? aliveEnemies(c)[0];
        if (t) damageEnemy(run, c, t, 12);
      }
      break;
  }
  return true;
}
