import { needsTarget } from '../game/cards';
import { computeClass } from '../game/classes';
import { aliveEnemies, canPlay, enemyTakeTurn, endPlayerTurn, playCard, startNextRound, usePotion } from '../game/combat';
import { enemyDef } from '../game/enemies';
import { eventDef } from '../game/events';
import { POTIONS } from '../game/items';
import { loadMeta, loadRun, recordRunEnd, saveMeta, saveRun } from '../game/meta';
import { newSeed } from '../game/rng';
import * as R from '../game/run';
import type { MetaState, RunState } from '../game/types';
import { createView, monumentView, runView, titleView, type UiState } from './views';

const ENEMY_STEP_MS = 420;
const RESULT_DELAY_MS = 750;

export class App {
  private root: HTMLElement;
  private meta: MetaState = loadMeta();
  private run: RunState | null = loadRun();
  private ui: UiState = {
    view: 'title',
    selected: null,
    potionSelected: null,
    overlay: null,
    busy: false,
    starterCard: null,
    starterQuest: null,
    showLog: false,
  };

  constructor(root: HTMLElement) {
    this.root = root;
    root.addEventListener('click', (e) => this.onClick(e));
    document.addEventListener('keydown', (e) => this.onKey(e));
    this.render();
  }

  // ───────────────────────── Render ─────────────────────────

  private render() {
    const { ui } = this;
    let html = '';
    if (ui.view === 'title') html = titleView(this.meta, !!this.run && !this.run.recorded);
    else if (ui.view === 'create') html = createView();
    else if (ui.view === 'monument') html = monumentView(this.meta);
    else if (this.run) html = runView(this.run, ui);
    this.root.innerHTML = html;
    if (ui.view === 'create') (this.root.querySelector('#player-name') as HTMLInputElement | null)?.focus();
    if (this.run?.screen === 'map' && ui.view === 'run' && !ui.overlay) {
      // O mapa sobe de baixo para cima: centraliza nas salas disponíveis
      this.root.querySelector('.node.available')?.scrollIntoView({ block: 'center' });
    }
    this.flushFx();
  }

  /** Mostra números flutuantes (dano, bloqueio, combos) gerados pelo motor. */
  private flushFx() {
    const c = this.run?.combat;
    if (!c || !c.fx.length) return;
    const perTarget = new Map<string, number>();
    for (const fx of c.fx) {
      const key = String(fx.target);
      const el = this.root.querySelector(`[data-fx="${key}"]`) as HTMLElement | null;
      if (!el) continue;
      const n = perTarget.get(key) ?? 0;
      perTarget.set(key, n + 1);
      const f = document.createElement('div');
      f.className = `floater fx-${fx.kind}`;
      f.textContent = fx.text;
      f.style.animationDelay = `${n * 110}ms`;
      f.style.left = `${50 + ((n % 3) - 1) * 18}%`;
      el.appendChild(f);
      if (fx.kind === 'dmg') {
        el.classList.remove('hit');
        void el.offsetWidth;
        el.classList.add('hit');
      }
    }
    c.fx = [];
  }

  private save() {
    saveRun(this.run && !this.run.recorded ? this.run : null);
  }

  /** Registra morte/vitória no Monumento uma única vez. */
  private checkRunEnd() {
    const run = this.run;
    if (!run || run.recorded || (run.screen !== 'dead' && run.screen !== 'victory')) return;
    run.recorded = true;
    let cause = 'Andar limpo';
    if (run.screen === 'dead') {
      try {
        cause = `Morto por ${enemyDef(run.deathCause ?? '').name}`;
      } catch {
        try {
          cause = `Morreu em: ${eventDef(run.deathCause ?? '').title}`;
        } catch {
          cause = 'Morreu em Aincrad';
        }
      }
    }
    this.meta = recordRunEnd(this.meta, run, {
      name: run.name,
      className: computeClass(run.deck, run.skills).name,
      floor: run.floor,
      cause,
      cleared: run.screen === 'victory',
    });
    saveMeta(this.meta);
    saveRun(null);
  }

  private commit() {
    this.checkRunEnd();
    this.save();
    this.render();
  }

  // ───────────────────────── Entrada ─────────────────────────

  private onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.ui.selected = null;
      this.ui.potionSelected = null;
      this.ui.overlay = null;
      this.render();
    }
    if (this.ui.view === 'create' && e.key === 'Enter') this.handle('start-run', {});
    if (this.run?.screen === 'combat' && this.ui.view === 'run' && !this.ui.overlay) {
      if (e.key === 'e' || e.key === 'E') this.handle('end-turn', {});
      const n = Number(e.key);
      if (n >= 1 && n <= 9) this.handle('card', { idx: String(n - 1) });
    }
  }

  private onClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const el = target.closest('[data-action]') as HTMLElement | null;
    if (!el) return;
    // Cliques dentro da caixa do overlay não fecham o overlay
    if (el.dataset.action === 'close-overlay' && target.closest('[data-stop]') && !target.closest('button')) return;
    if (el.classList.contains('disabled')) return;
    this.handle(el.dataset.action!, el.dataset as Record<string, string>);
  }

  private handle(action: string, d: Record<string, string | undefined>) {
    const run = this.run;
    const ui = this.ui;
    switch (action) {
      // ── Menus ──
      case 'go-title':
        ui.view = 'title';
        break;
      case 'go-create':
        ui.view = 'create';
        break;
      case 'go-monument':
        ui.view = 'monument';
        break;
      case 'continue':
        if (run) ui.view = 'run';
        break;
      case 'quit':
        ui.view = 'title';
        ui.overlay = null;
        break;
      case 'start-run': {
        const input = this.root.querySelector('#player-name') as HTMLInputElement | null;
        const name = (input?.value.trim() || 'Novato').slice(0, 16);
        this.run = R.newRun(name, newSeed(), this.meta.unlockedCards);
        Object.assign(ui, { view: 'run', starterCard: null, starterQuest: null, overlay: null, selected: null });
        break;
      }
      case 'end-run':
        this.run = null;
        ui.view = 'title';
        break;
      case 'overlay':
        ui.overlay = (d.overlay as UiState['overlay']) ?? null;
        break;
      case 'close-overlay':
        ui.overlay = null;
        break;
      case 'toggle-log':
        ui.showLog = !ui.showLog;
        break;
    }
    if (!run || ui.view !== 'run') return this.commit();

    switch (action) {
      // ── Início ──
      case 'starter-card':
        ui.starterCard = d.id ?? null;
        break;
      case 'starter-quest':
        ui.starterQuest = ui.starterQuest === d.id ? null : (d.id ?? null);
        break;
      case 'starter-confirm':
        if (ui.starterCard) R.chooseStarter(run, ui.starterCard, ui.starterQuest);
        break;

      // ── Mapa ──
      case 'travel':
        R.travel(run, d.id!);
        ui.selected = null;
        break;

      // ── Combate ──
      case 'card':
        return this.onCard(Number(d.idx));
      case 'target':
        return this.onTarget(Number(d.uid));
      case 'end-turn':
        return this.onEndTurn();
      case 'potion':
        return this.onPotion(Number(d.idx));

      // ── Recompensas ──
      case 'take-drop':
        R.takeChoice(run, Number(d.idx));
        break;
      case 'reroll':
        R.reroll(run);
        break;
      case 'skip-drops':
        R.skipChoices(run);
        break;
      case 'boss-relic':
        R.takeBossRelic(run, d.id!);
        break;
      case 'leave-reward':
        R.leaveReward(run);
        break;
      case 'next-floor':
        R.nextFloor(run);
        break;

      // ── Cidade ──
      case 'buy':
        R.buy(run, Number(d.idx));
        break;
      case 'shop-remove':
        if (run.shop && !run.shop.removeUsed) R.openCardSelect(run, 'remove', 'shop', run.shop.removePrice);
        break;
      case 'shop-quest':
        R.takeShopQuest(run, d.id!);
        break;
      case 'leave-shop':
        run.shop = null;
        run.screen = 'map';
        break;

      // ── Pousada ──
      case 'rest':
        R.restAtInn(run);
        break;
      case 'train':
        R.openCardSelect(run, 'upgrade', 'map');
        run.cardSelect!.cancelable = false;
        break;

      // ── Eventos / seleção de carta ──
      case 'event-choice':
        R.chooseEvent(run, Number(d.idx));
        break;
      case 'leave-event':
        R.leaveEvent(run);
        break;
      case 'select-card':
        R.chooseCard(run, Number(d.uid));
        break;
      case 'cancel-select':
        if (run.cardSelect) {
          run.cardSelect.cancelable = true;
          R.cancelCardSelect(run);
        }
        break;
    }
    this.commit();
  }

  // ───────────────────────── Combate ─────────────────────────

  private onCard(idx: number) {
    const run = this.run!;
    const c = run.combat;
    if (!c || this.ui.busy || c.result) return;
    const card = c.hand[idx];
    if (!card) return;
    this.ui.potionSelected = null;
    if (this.ui.selected === idx) {
      this.ui.selected = null;
      return this.render();
    }
    if (!canPlay(run, idx)) {
      this.shake(idx);
      return;
    }
    if (needsTarget(card) && aliveEnemies(c).length > 1) {
      this.ui.selected = idx;
      return this.render();
    }
    playCard(run, idx, aliveEnemies(c)[0]?.uid);
    this.afterAction();
  }

  private onTarget(uid: number) {
    const run = this.run!;
    const c = run.combat;
    if (!c || this.ui.busy) return;
    if (this.ui.potionSelected !== null) {
      usePotion(run, this.ui.potionSelected, uid);
      this.ui.potionSelected = null;
      return this.afterAction();
    }
    if (this.ui.selected === null) return;
    playCard(run, this.ui.selected, uid);
    this.ui.selected = null;
    this.afterAction();
  }

  private onPotion(slot: number) {
    const run = this.run!;
    const id = run.potions[slot];
    if (!id || this.ui.busy) return;
    const inCombat = run.screen === 'combat' && run.combat && !run.combat.result;
    if (inCombat && POTIONS[id].needsTarget && aliveEnemies(run.combat!).length > 1) {
      this.ui.potionSelected = slot;
      this.ui.selected = null;
      return this.render();
    }
    usePotion(run, slot, inCombat ? aliveEnemies(run.combat!)[0]?.uid : undefined);
    if (inCombat) this.afterAction();
    else this.commit();
  }

  private shake(idx: number) {
    const el = this.root.querySelectorAll('.hand .card')[idx] as HTMLElement | undefined;
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  /** Depois de qualquer ação no combate: verifica fim de combate. */
  private afterAction() {
    const run = this.run!;
    const c = run.combat;
    this.save();
    this.render();
    if (c?.result) {
      this.ui.busy = true;
      setTimeout(() => {
        this.ui.busy = false;
        R.finishCombat(run);
        this.ui.selected = null;
        this.commit();
      }, RESULT_DELAY_MS);
    }
  }

  /** Fim de turno animado: cada inimigo age em sequência. */
  private onEndTurn() {
    const run = this.run!;
    const c = run.combat;
    if (!c || this.ui.busy || c.result) return;
    this.ui.busy = true;
    this.ui.selected = null;
    endPlayerTurn(run);
    this.render();
    const n = c.enemies.length;
    let i = 0;
    const step = () => {
      if (c.result || i >= n) {
        startNextRound(run);
        this.ui.busy = false;
        return this.afterAction();
      }
      const acted = enemyTakeTurn(run, i++);
      if (acted) {
        this.render();
        setTimeout(step, ENEMY_STEP_MS);
      } else step();
    };
    setTimeout(step, ENEMY_STEP_MS);
  }
}
