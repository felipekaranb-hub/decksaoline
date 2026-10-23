import { hash, toDataUrl } from './raster';

/**
 * Cenários em pixel art (320×180), gerados por código e ampliados sem suavização.
 * Cada andar tem o "teto" de pedra do andar de cima no lugar do céu, como em Aincrad.
 */

export const SCENE_W = 320;
export const SCENE_H = 180;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

class Buf {
  px: string[] = new Array(SCENE_W * SCENE_H).fill('#000000');
  set(x: number, y: number, c: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < SCENE_W && y < SCENE_H) this.px[y * SCENE_W + x] = c;
  }
  /** Gradiente vertical em faixas com dithering ordenado */
  gradient(y0: number, y1: number, colors: string[]) {
    const n = colors.length - 1;
    for (let y = y0; y < y1; y++) {
      const t = ((y - y0) / Math.max(1, y1 - y0 - 1)) * n;
      const i = Math.min(n - 1, Math.floor(t));
      const f = t - i;
      for (let x = 0; x < SCENE_W; x++) this.set(x, y, f * 16 > BAYER[y % 4][x % 4] ? colors[i + 1] : colors[i]);
    }
  }
  /** Preenche abaixo de uma linha de horizonte h(x) */
  below(h: (x: number) => number, color: string | ((x: number, y: number) => string), yMax = SCENE_H) {
    for (let x = 0; x < SCENE_W; x++) {
      const top = Math.round(h(x));
      for (let y = Math.max(0, top); y < yMax; y++) this.set(x, y, typeof color === 'string' ? color : color(x, y));
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
  rgba(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(SCENE_W * SCENE_H * 4);
    this.px.forEach((c, i) => {
      out[i * 4] = parseInt(c.slice(1, 3), 16);
      out[i * 4 + 1] = parseInt(c.slice(3, 5), 16);
      out[i * 4 + 2] = parseInt(c.slice(5, 7), 16);
      out[i * 4 + 3] = 255;
    });
    return out;
  }
}

const wave = (x: number, seed: number, amp: number, freq: number) =>
  Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.3 + seed * 1.7) * amp * 0.45 + Math.sin(x * freq * 5.1 + seed * 0.3) * amp * 0.15;

/** Teto de pedra do andar de cima, com pilares de luz e estalactites */
function ceiling(b: Buf, stone: string[], light: string) {
  const edge = (x: number) => 18 + wave(x, 4, 3, 0.09) + (hash(x >> 3, 1, 5) < 0.25 ? 5 * hash(x, 2, 6) : 0);
  for (let x = 0; x < SCENE_W; x++) {
    const e = edge(x);
    for (let y = 0; y < e; y++) {
      const n = hash(x >> 2, y >> 2, 21);
      const c = y > e - 2 ? stone[0] : n < 0.2 ? stone[2] : n < 0.6 ? stone[1] : stone[0];
      b.set(x, y, c);
    }
  }
  // Juntas de pedra
  for (let y = 4; y < 16; y += 6) for (let x = (y * 7) % 23; x < SCENE_W; x += 23) b.rect(x, y, 10, 1, stone[0]);
  // Pilares de sustentação com luz
  for (const px of [36, 140, 252]) {
    b.rect(px, 0, 6, 22, stone[2]);
    b.rect(px + 1, 0, 1, 22, light);
  }
}

function stars(b: Buf, y0: number, y1: number, color: string, density = 0.006) {
  for (let y = y0; y < y1; y++) for (let x = 0; x < SCENE_W; x++) if (hash(x, y, 77) < density) b.set(x, y, color);
}

function grass(b: Buf, top: (x: number) => number, ramp: string[], seed: number) {
  b.below(top, (x, y) => {
    const d = y - top(x);
    const n = hash(x, y, seed);
    if (d < 1) return ramp[3];
    if (d < 3) return n < 0.5 ? ramp[2] : ramp[3];
    const m = hash(x >> 2, y >> 1, seed + 1);
    return n < 0.04 ? ramp[3] : m < 0.35 ? ramp[1] : n < 0.03 ? ramp[0] : ramp[2];
  });
  // Tufos
  for (let x = 0; x < SCENE_W; x += 3) {
    if (hash(x, 3, seed) < 0.4) {
      const t = Math.round(top(x));
      b.set(x, t - 1, ramp[3]);
      if (hash(x, 4, seed) < 0.4) b.set(x, t - 2, ramp[3]);
    }
  }
}

// ───────────────────────── Andares ─────────────────────────

function floor1(): Buf {
  const b = new Buf();
  b.gradient(0, 120, ['#0b1430', '#13234a', '#1e3a66', '#2e5a82', '#4a7e96', '#7aa6a0']);
  ceiling(b, ['#0a0d18', '#151a2a', '#22283c'], '#6fa8ff');
  // Colinas distantes
  b.below((x) => 92 + wave(x, 1, 6, 0.03), '#2a4a5a', 122);
  b.below((x) => 100 + wave(x, 3, 5, 0.045), '#24463a', 122);
  // Tolbana no horizonte
  for (const [x, w, h] of [[214, 8, 10], [224, 6, 7], [232, 4, 16], [238, 9, 9], [249, 6, 6]]) {
    b.rect(x, 101 - h, w, h, '#1c3530');
    if (h > 8) b.set(x + 2, 101 - h + 3, '#ffd27a');
  }
  b.rect(233, 81, 2, 3, '#1c3530');
  // Árvores esparsas
  for (let x = 6; x < SCENE_W; x += 17) {
    if (hash(x, 1, 3) < 0.45) {
      const y = 104 + wave(x, 3, 5, 0.045);
      b.disc(x, y - 4, 4, 5, (px, py) => (hash(px, py, 8) < 0.3 ? '#2d5a40' : '#1d3d2c'));
      b.rect(x, y, 1, 3, '#1a2a22');
    }
  }
  grass(b, (x) => 118 + wave(x, 7, 2, 0.05), ['#16301e', '#24502a', '#3a7434', '#62a046'], 31);
  // Caminho de terra
  for (let y = 124; y < SCENE_H; y++) {
    const cx = 160 + (y - 124) * 0.9;
    const half = 6 + (y - 124) * 0.55;
    for (let x = Math.floor(cx - half); x <= cx + half; x++) b.set(x, y, hash(x, y, 4) < 0.15 ? '#5a4a34' : '#6e5a3e');
  }
  // Flores
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i, 1, 90) * SCENE_W);
    const y = 126 + Math.floor(hash(i, 2, 90) * 52);
    b.set(x, y, ['#ffe07a', '#ff9ab8', '#d8f0ff'][i % 3]);
  }
  return b;
}

function floor2(): Buf {
  const b = new Buf();
  b.gradient(0, 122, ['#160e22', '#2a1636', '#4a2340', '#7a3a3c', '#b8603a', '#e0944a']);
  ceiling(b, ['#120a10', '#1e1218', '#2c1c22'], '#ffb46a');
  // Mesas (planaltos de topo plano)
  const mesa = (x0: number, w: number, top: number, c: string, lit: string) => {
    for (let x = x0; x < x0 + w; x++) {
      const slope = Math.min(x - x0, x0 + w - x, 8);
      const t = top + (8 - slope) * 1.6;
      for (let y = Math.round(t); y < 124; y++) b.set(x, y, (y - top) % 7 === 0 ? lit : c);
    }
  };
  mesa(10, 70, 70, '#3a1e22', '#4e2a2a');
  mesa(110, 90, 56, '#2e181e', '#422426');
  mesa(230, 60, 78, '#3a1e22', '#4e2a2a');
  b.below((x) => 106 + wave(x, 2, 4, 0.05), '#4a2a22', 124);
  grass(b, (x) => 120 + wave(x, 5, 2, 0.04), ['#2a1a12', '#4e3018', '#7a4e22', '#b0782e'], 41);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(hash(i, 3, 50) * SCENE_W);
    const y = 130 + Math.floor(hash(i, 4, 50) * 44);
    b.disc(x, y, 3, 2, (_px, py) => (py < y ? '#8a7a6a' : '#5a4a42'));
  }
  return b;
}

function floor3(): Buf {
  const b = new Buf();
  b.gradient(0, 124, ['#03090c', '#071418', '#0c2226', '#163a38', '#285a50', '#3e7a64']);
  ceiling(b, ['#05080a', '#0c1214', '#141c1e'], '#7affd8');
  // Troncos altíssimos
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(hash(i, 1, 60) * SCENE_W);
    const w = 8 + Math.floor(hash(i, 2, 60) * 10);
    const shade = i % 2 ? '#0a1a18' : '#0e2420';
    b.rect(x, 18, w, 106, shade);
    b.rect(x + 1, 18, 1, 106, '#18322c');
  }
  // Copas penduradas
  for (let x = 0; x < SCENE_W; x += 12) b.disc(x + 6, 26 + hash(x, 1, 2) * 8, 12, 9, (px, py) => (hash(px, py, 3) < 0.25 ? '#16402e' : '#0c281e'));
  // Névoa em faixas
  for (const yy of [70, 96, 112]) for (let y = yy; y < yy + 6; y++) for (let x = 0; x < SCENE_W; x++) {
    if ((x + y) % 3 === 0 && hash(x >> 3, y, 13) < 0.7) b.set(x, y, '#5e9a8a');
  }
  grass(b, (x) => 122 + wave(x, 9, 2, 0.05), ['#06120e', '#0e241a', '#173a26', '#2a5a36'], 51);
  // Cogumelos brilhantes
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(hash(i, 5, 70) * SCENE_W);
    const y = 128 + Math.floor(hash(i, 6, 70) * 48);
    b.set(x, y, '#e8fff4');
    b.set(x - 1, y, '#7affd8');
    b.set(x + 1, y, '#7affd8');
    b.set(x, y + 1, '#2a5a46');
  }
  // Vaga-lumes
  for (let i = 0; i < 30; i++) b.set(hash(i, 7, 80) * SCENE_W, 40 + hash(i, 8, 80) * 80, '#c8ffa0');
  return b;
}

function title(): Buf {
  const b = new Buf();
  b.gradient(0, 150, ['#04060e', '#080e22', '#0e1a3a', '#182a56', '#26406e']);
  stars(b, 0, 110, '#cfe0ff', 0.008);
  stars(b, 0, 80, '#ffe9b0', 0.002);
  // Aincrad: andares empilhados flutuando
  const cx = 228;
  for (let k = 0; k < 10; k++) {
    const y = 104 - k * 9;
    const rx = 64 - k * 5.6;
    b.disc(cx, y, rx, 5, (x, yy, dx, dy) => {
      const lit = dx < -0.2 && dy < 0.3;
      if (dy < -0.45) return lit ? '#c8d8f0' : '#8ea4c8';
      if (dy < 0.2) return hash(x, yy, k) < 0.06 ? '#ffe08a' : lit ? '#5a7096' : '#3a4c70';
      return '#1e2a46';
    });
  }
  b.disc(cx, 112, 40, 4, '#121a30');
  // Nuvens com dithering
  for (const [x0, y0, w] of [[150, 118, 90], [190, 74, 60], [20, 60, 70]]) {
    for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + w; x++) if ((x + y) % 2 === 0 && hash(x >> 2, y, 4) < 0.8) b.set(x, y, '#2e4470');
  }
  // Colina e Cidade do Início
  b.below((x) => 146 + wave(x, 2, 4, 0.02), '#0a0f1e');
  for (const [x, w, h] of [[20, 10, 12], [32, 6, 18], [40, 12, 9], [56, 8, 14], [66, 14, 8], [90, 7, 20]]) {
    b.rect(x, 146 - h, w, h + 2, '#0a0f1e');
    if (h > 10) b.set(x + 2, 146 - h + 4, '#ffd27a');
  }
  b.rect(92, 120, 3, 6, '#0a0f1e');
  return b;
}

const MAKERS: Record<string, () => Buf> = { '1': floor1, '2': floor2, '3': floor3, title };

/** Data URL do cenário (andar 1–3 ou "title"). */
export function sceneUrl(key: string): string {
  const make = MAKERS[key] ?? floor1;
  return toDataUrl(`scene:${key}`, SCENE_W, SCENE_H, () => make().rgba());
}
