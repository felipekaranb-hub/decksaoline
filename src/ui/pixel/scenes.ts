import { hash, hexToRgb, toDataUrl } from './raster';

/**
 * Cenários em pixel art (320×180), no estilo de cores chapadas e formas grandes:
 * céu em faixas, nuvens planas, copas em camadas, grama em manchas (sem ruído pixel a pixel).
 * Ao fundo, os pilares que sustentam o andar de cima de Aincrad.
 */

export const SCENE_W = 320;
export const SCENE_H = 180;

class Buf {
  px: string[] = new Array(SCENE_W * SCENE_H).fill('#000000');
  set(x: number, y: number, c: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < SCENE_W && y < SCENE_H) this.px[y * SCENE_W + x] = c;
  }
  /** Faixas horizontais de cor chapada */
  bands(y0: number, stops: [number, string][]) {
    for (let y = y0; y < SCENE_H; y++) {
      let c = stops[0][1];
      for (const [sy, sc] of stops) if (y >= sy) c = sc;
      for (let x = 0; x < SCENE_W; x++) this.set(x, y, c);
    }
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  disc(cx: number, cy: number, rx: number, ry: number, c: string | ((x: number, y: number, dx: number, dy: number) => string)) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'string' ? c : c(x, y, dx, dy));
      }
    }
  }
  /** Preenche abaixo de uma linha h(x) */
  below(h: (x: number) => number, c: string, yMax = SCENE_H) {
    for (let x = 0; x < SCENE_W; x++) for (let y = Math.max(0, Math.round(h(x))); y < yMax; y++) this.set(x, y, c);
  }
  rgba(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(SCENE_W * SCENE_H * 4);
    this.px.forEach((c, i) => {
      const [r, g, b] = hexToRgb(c);
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    });
    return out;
  }
}

const wave = (x: number, seed: number, amp: number, freq: number) =>
  Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.3 + seed * 1.7) * amp * 0.4;

interface Theme {
  sky: [number, string][];
  cloud: [string, string];
  pillar: [string, string, string];
  farHill: string;
  hill: string;
  hillLight: string;
  grass: [string, string, string];
  canopy: [string, string, string];
  trunk: [string, string];
  path?: [string, string];
}

/** Nuvem chapada: união de discos, sombra só na base */
function cloud(b: Buf, x: number, y: number, w: number, [light, shade]: [string, string]) {
  const n = Math.max(3, Math.round(w / 10));
  for (let i = 0; i < n; i++) {
    const cx = x + (i + 0.5) * (w / n);
    const r = 5 + hash(i, x, 3) * 6;
    b.disc(cx, y - r * 0.4, r, r * 0.8, light);
  }
  b.rect(x, y, w, 3, light);
  b.rect(x + 2, y + 3, w - 4, 2, shade);
}

/** Pilar de Aincrad ao fundo, sumindo no céu */
function pillar(b: Buf, x: number, w: number, [base, light, dark]: [string, string, string]) {
  b.rect(x, 0, w, 120, base);
  b.rect(x, 0, 2, 120, light);
  b.rect(x + w - 3, 0, 3, 120, dark);
  for (let y = 10; y < 120; y += 22) b.rect(x + 2, y, w - 5, 1, dark);
}

/** Árvore com copa em camadas (escuro embaixo, claro em cima à esquerda) */
function tree(b: Buf, x: number, ground: number, size: number, t: Theme) {
  const [c0, c1, c2] = t.canopy;
  b.rect(x - Math.round(size * 0.12), ground - size * 1.2, Math.round(size * 0.24), size * 1.2, t.trunk[0]);
  b.rect(x - Math.round(size * 0.12), ground - size * 1.2, 2, size * 1.2, t.trunk[1]);
  const top = ground - size * 1.45;
  const blobs: [number, number, number][] = [
    [-0.55, 0.15, 0.55], [0.55, 0.15, 0.55], [0, -0.2, 0.7], [-0.3, -0.55, 0.5], [0.35, -0.5, 0.5], [0, 0.3, 0.6],
  ];
  for (const [dx, dy, r] of blobs) b.disc(x + dx * size, top + dy * size, r * size, r * size * 0.85, c0);
  for (const [dx, dy, r] of blobs) b.disc(x + dx * size - 2, top + dy * size - 3, r * size * 0.82, r * size * 0.7, c1);
  for (const [dx, dy, r] of blobs.slice(2)) b.disc(x + dx * size - 4, top + dy * size - 5, r * size * 0.45, r * size * 0.35, c2);
}

/** Grama com manchas claras e escuras em aglomerados */
function grass(b: Buf, top: (x: number) => number, [dark, base, light]: [string, string, string], seed: number) {
  b.below(top, base);
  for (let i = 0; i < 70; i++) {
    const x = hash(i, 1, seed) * SCENE_W;
    const y = top(x) + 6 + hash(i, 2, seed) * (SCENE_H - top(x) - 6);
    const w = 6 + hash(i, 3, seed) * 18;
    b.disc(x, y, w, w * 0.28, i % 3 === 0 ? light : dark);
  }
  for (let x = 0; x < SCENE_W; x++) b.set(x, top(x), light);
  // Tufos
  for (let i = 0; i < 40; i++) {
    const x = Math.round(hash(i, 4, seed) * SCENE_W);
    const y = Math.round(top(x) + 8 + hash(i, 5, seed) * 50);
    b.set(x, y, light);
    b.set(x - 1, y + 1, light);
    b.set(x + 1, y + 1, light);
  }
}

const THEMES: Record<string, Theme> = {
  '1': {
    sky: [[0, '#8ccdf0'], [40, '#a4d8f2'], [70, '#bfe3f4'], [92, '#d6eef6']],
    cloud: ['#ffffff', '#d4e8f6'],
    pillar: ['#b4c8e6', '#d8e6f6', '#94a8cc'],
    farHill: '#9cc8a6',
    hill: '#7cbb64',
    hillLight: '#94cc72',
    grass: ['#5ea547', '#74ba52', '#92cf66'],
    canopy: ['#4f9a44', '#6eb653', '#94cf6a'],
    trunk: ['#7a5a3c', '#9a7650'],
    path: ['#d8bf8a', '#c4a874'],
  },
  '2': {
    sky: [[0, '#f2b98c'], [40, '#f6c99a'], [70, '#f8d8ae'], [92, '#fae6c6']],
    cloud: ['#fff6ea', '#f2d6b8'],
    pillar: ['#d8b8a8', '#ecd2c4', '#b8988c'],
    farHill: '#d49a76',
    hill: '#c88a5c',
    hillLight: '#d8a06a',
    grass: ['#b8944a', '#cca85a', '#dcbe72'],
    canopy: ['#8a9a44', '#a2b456', '#bccc6a'],
    trunk: ['#7a5a3c', '#9a7650'],
  },
  '3': {
    sky: [[0, '#6aa8a4'], [40, '#82bab2'], [70, '#9cccc0'], [92, '#b6dcd0']],
    cloud: ['#e4f4ee', '#bcdcd2'],
    pillar: ['#9cbcc0', '#bcd6d6', '#7c9ca4'],
    farHill: '#5e9488',
    hill: '#4a8274',
    hillLight: '#5a9482',
    grass: ['#3c7a5c', '#4c8c68', '#64a47a'],
    canopy: ['#2e6a52', '#428462', '#5ea078'],
    trunk: ['#5a4434', '#76604a'],
  },
};

function floorScene(key: string): Buf {
  const t = THEMES[key] ?? THEMES['1'];
  const b = new Buf();
  b.bands(0, t.sky);
  pillar(b, 250, 22, t.pillar);
  pillar(b, 40, 12, t.pillar);
  cloud(b, 70, 30, 60, t.cloud);
  cloud(b, 170, 18, 44, t.cloud);
  cloud(b, 280, 46, 34, t.cloud);
  // Colinas distantes e próximas
  b.below((x) => 96 + wave(x, 1, 6, 0.025), t.farHill, 130);
  b.below((x) => 106 + wave(x, 3, 5, 0.035), t.hill, 130);
  for (let x = 0; x < SCENE_W; x++) b.set(x, Math.round(106 + wave(x, 3, 5, 0.035)), t.hillLight);
  if (key === '1') {
    // Tolbana: muros brancos e telhados vermelhos
    for (const [x, w, h] of [[200, 12, 7], [214, 9, 10], [226, 14, 8], [243, 8, 12], [254, 12, 7]] as const) {
      const base = 104;
      b.rect(x, base - h, w, h, '#f4f0e6');
      b.rect(x - 1, base - h - 3, w + 2, 3, '#d4604c');
      b.rect(x - 1, base - h - 1, w + 2, 1, '#a8443a');
      b.rect(x + 2, base - h + 2, 2, 2, '#8a7a6a');
    }
    b.rect(196, 102, 76, 3, '#e4ddd0');
  }
  if (key === '2') {
    // Platôs de topo plano
    for (const [x, w, top] of [[10, 70, 70], [118, 80, 62], [236, 60, 78]] as const) {
      for (let i = 0; i < w; i++) {
        const slope = Math.min(i, w - i, 8);
        const y0 = top + (8 - slope) * 1.4;
        for (let y = Math.round(y0); y < 108; y++) b.set(x + i, y, y < y0 + 2 ? '#e4ae7e' : (y - top) % 9 < 1 ? '#b87850' : '#cc8e62');
      }
    }
  }
  if (key === '3') {
    for (let i = 0; i < 7; i++) tree(b, 20 + i * 48 + hash(i, 1, 9) * 14, 108, 26 + hash(i, 2, 9) * 8, t);
  }
  // Chão
  const groundTop = (x: number) => 122 + wave(x, 7, 2, 0.04);
  grass(b, groundTop, t.grass, Number(key) * 17);
  if (t.path) {
    for (let y = 124; y < SCENE_H; y++) {
      const cx = 170 + (y - 124) * 0.8;
      const half = 7 + (y - 124) * 0.45;
      for (let x = Math.floor(cx - half); x <= cx + half; x++) b.set(x, y, Math.abs(x - cx) > half - 2 ? t.path[1] : t.path[0]);
    }
  }
  // Árvore grande à esquerda (moldura)
  if (key !== '3') tree(b, 24, 128, 30, t);
  // Flores
  for (let i = 0; i < 26; i++) {
    const x = Math.round(hash(i, 6, 3) * SCENE_W);
    const y = Math.round(130 + hash(i, 7, 3) * 46);
    b.set(x, y, ['#ffffff', '#ffe27a', '#ff9ab8'][i % 3]);
  }
  return b;
}

function title(): Buf {
  const b = new Buf();
  b.bands(0, [[0, '#7cc4ee'], [36, '#94d0f2'], [66, '#acdcf4'], [90, '#c6e8f6']]);
  const t = THEMES['1'];
  // Aincrad flutuando ao longe
  const cx = 236;
  for (let k = 0; k < 9; k++) {
    const y = 92 - k * 8;
    const rx = 50 - k * 5;
    b.disc(cx, y, rx, 4.5, (_x, _y, dx, dy) => (dy < -0.3 ? '#e8f0fa' : dx < -0.4 ? '#c4d4ea' : '#a8bcdc'));
  }
  b.disc(cx, 98, 32, 4, '#94a8cc');
  cloud(b, 160, 96, 110, ['#ffffff', '#d4e8f6']);
  cloud(b, 20, 34, 70, ['#ffffff', '#d4e8f6']);
  cloud(b, 120, 20, 40, ['#ffffff', '#d4e8f6']);
  b.below((x) => 120 + wave(x, 2, 5, 0.02), t.farHill);
  b.below((x) => 132 + wave(x, 5, 4, 0.03), t.hill);
  grass(b, (x) => 146 + wave(x, 8, 2, 0.05), t.grass, 99);
  tree(b, 296, 150, 34, t);
  return b;
}

const MAKERS: Record<string, () => Buf> = { title, '1': () => floorScene('1'), '2': () => floorScene('2'), '3': () => floorScene('3') };

/** Data URL do cenário (andar 1–3 ou "title"). */
export function sceneUrl(key: string): string {
  const make = MAKERS[key] ?? MAKERS['1'];
  return toDataUrl(`scene2:${key}`, SCENE_W, SCENE_H, () => make().rgba());
}
