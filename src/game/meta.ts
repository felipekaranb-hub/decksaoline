import type { MetaState, MonumentEntry, RunState } from './types';
import { RUN_VERSION } from './run';

const META_KEY = 'decksaoline.meta.v1';
const RUN_KEY = 'decksaoline.run.v1';

export function emptyMeta(): MetaState {
  return { monument: [], runs: 0, wins: 0, kills: 0, highestFloor: 0, unlockedCards: [], questsCompleted: [], classesSeen: [] };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadMeta(): MetaState {
  try {
    const raw = storage()?.getItem(META_KEY);
    return raw ? { ...emptyMeta(), ...JSON.parse(raw) } : emptyMeta();
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(meta: MetaState) {
  try {
    storage()?.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* armazenamento indisponível: segue sem salvar */
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = storage()?.getItem(RUN_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    if (run.version !== RUN_VERSION) return null;
    // Saves anteriores ao Slot de Preparo
    if (run.combat && !run.combat.reserved) run.combat.reserved = [];
    return run;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState | null) {
  try {
    if (run) storage()?.setItem(RUN_KEY, JSON.stringify(run));
    else storage()?.removeItem(RUN_KEY);
  } catch {
    /* ignore */
  }
}

/** Registra o fim de uma run no meta (Monumento da Vida, desbloqueios de quest). */
export function recordRunEnd(meta: MetaState, run: RunState, entry: Omit<MonumentEntry, 'date'>): MetaState {
  const next: MetaState = {
    ...meta,
    monument: [{ ...entry, date: new Date().toISOString() }, ...meta.monument].slice(0, 100),
    runs: meta.runs + 1,
    wins: meta.wins + (entry.cleared ? 1 : 0),
    kills: meta.kills + run.stats.kills,
    highestFloor: Math.max(meta.highestFloor, run.floor),
    unlockedCards: [...new Set([...meta.unlockedCards, ...run.unlocked])],
    questsCompleted: [...new Set([...meta.questsCompleted, ...run.quests.filter((q) => q.done).map((q) => q.id)])],
    classesSeen: [...new Set([...meta.classesSeen, entry.className])],
  };
  return next;
}
