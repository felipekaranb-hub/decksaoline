/**
 * Pequeno "pintor" de pixel art.
 *
 * Os sprites são compostos por partes (elipses, polígonos, linhas grossas...) numa grade
 * de baixa resolução. Cada parte tem uma rampa de 4 tons; o render aplica luz vinda do
 * canto superior esquerdo, sombra de forma com dithering, textura opcional, linha interna
 * entre partes e contorno escuro. Assim todos os sprites saem com o mesmo acabamento.
 */

export type Ramp = readonly [string, string, string, string];

export const OUTLINE = '#140f1c';

export interface PartOpts {
  /** Tom base (0–3). Padrão 2. */
  tone?: number;
  /** Sem sombreamento (cor chapada no tom base) */
  flat?: boolean;
  /** Textura: retorna -1, 0 ou +1 para escurecer/clarear o pixel */
  tex?: (x: number, y: number) => number;
  /** Não desenha linha interna contra partes de trás */
  noEdge?: boolean;
  /** Junta com a parte anterior (mesma forma para sombreamento) */
  merge?: boolean;
}

interface Part {
  ramp: Ramp | null;
  emit: string | null;
  opts: PartOpts;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Texturas prontas */
export const TEX = {
  fur: (x: number, y: number) => (hash(x, y, 7) < 0.16 ? -1 : hash(x, y, 9) < 0.06 ? 1 : 0),
  scales: (x: number, y: number) => ((x + (y % 2) * 2) % 4 === 0 && y % 2 === 0 ? -1 : 0),
  bark: (x: number, y: number) => ((x + Math.floor(hash(0, y >> 2, 3) * 3)) % 4 === 0 ? -1 : 0),
  stripes: (period: number) => (x: number, _y: number) => (Math.floor(x / period) % 2 === 0 ? -1 : 0),
  noise: (x: number, y: number) => (hash(x, y, 11) < 0.12 ? -1 : 0),
};

export class Sprite {
  readonly w: number;
  readonly h: number;
  private grid: Int16Array;
  private parts: Part[] = [];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.grid = new Int16Array(w * h).fill(-1);
  }

  private newPart(ramp: Ramp | null, emit: string | null, opts: PartOpts): number {
    if (opts.merge && this.parts.length) return this.parts.length - 1;
    this.parts.push({ ramp, emit, opts, minX: 1e9, minY: 1e9, maxX: -1, maxY: -1 });
    return this.parts.length - 1;
  }

  private paint(test: (x: number, y: number) => boolean, ramp: Ramp | null, emit: string | null, opts: PartOpts, box?: [number, number, number, number]) {
    const id = this.newPart(ramp, emit, opts);
    const p = this.parts[id];
    const [x0, y0, x1, y1] = box ?? [0, 0, this.w - 1, this.h - 1];
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.w - 1, Math.ceil(x1)); x++) {
        if (!test(x + 0.5, y + 0.5)) continue;
        this.grid[y * this.w + x] = id;
        p.minX = Math.min(p.minX, x);
        p.minY = Math.min(p.minY, y);
        p.maxX = Math.max(p.maxX, x);
        p.maxY = Math.max(p.maxY, y);
      }
    }
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, ramp: Ramp, opts: PartOpts = {}) {
    return this.paint((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, ramp, null, opts, [cx - rx, cy - ry, cx + rx, cy + ry]);
  }

  rect(x: number, y: number, w: number, h: number, ramp: Ramp, opts: PartOpts = {}) {
    return this.paint((px, py) => px >= x && px <= x + w && py >= y && py <= y + h, ramp, null, opts, [x, y, x + w, y + h]);
  }

  /** Polígono com pontos [x0,y0,x1,y1,...] */
  poly(pts: number[], ramp: Ramp, opts: PartOpts = {}) {
    const xs = pts.filter((_, i) => i % 2 === 0);
    const ys = pts.filter((_, i) => i % 2 === 1);
    const test = (x: number, y: number) => {
      let inside = false;
      for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) {
        if (ys[i] > y !== ys[j] > y && x < ((xs[j] - xs[i]) * (y - ys[i])) / (ys[j] - ys[i]) + xs[i]) inside = !inside;
      }
      return inside;
    };
    return this.paint(test, ramp, null, opts, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]);
  }

  /** Segmento grosso (braços, cabos, pernas finas) */
  line(x0: number, y0: number, x1: number, y1: number, width: number, ramp: Ramp, opts: PartOpts = {}) {
    const r = width / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1;
    const test = (x: number, y: number) => {
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
      return (x - x0 - t * dx) ** 2 + (y - y0 - t * dy) ** 2 <= r * r;
    };
    return this.paint(test, ramp, null, opts, [Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r]);
  }

  /** Pixels de cor fixa que brilham (olhos, gemas) */
  glow(x: number, y: number, color: string, w = 1, h = 1) {
    return this.paint((px, py) => px >= x && px < x + w && py >= y && py < y + h, null, color, { noEdge: true }, [x, y, x + w, y + h]);
  }

  /** Renderiza para RGBA. `flip` espelha horizontalmente. */
  render(flip = false): Uint8ClampedArray {
    const { w, h, grid, parts } = this;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : grid[y * w + x]);
    const colors: (string | null)[] = new Array(w * h).fill(null);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const id = at(x, y);
        if (id < 0) continue;
        const p = parts[id];
        if (p.emit) {
          colors[y * w + x] = p.emit;
          continue;
        }
        const same = (dx: number, dy: number) => at(x + dx, y + dy) === id;
        let t = p.opts.tone ?? 2;
        if (!p.opts.flat) {
          // Luz do canto superior esquerdo
          if (!same(0, -1) || !same(-1, 0)) t += 1;
          if (!same(0, 1) || !same(1, 0)) t -= 1;
          if (!same(0, 2) && same(0, 1)) t -= 1;
          // Sombra de forma na parte de baixo, com transição em xadrez
          const ph = p.maxY - p.minY + 1;
          if (ph >= 6) {
            const rel = (y - p.minY) / ph;
            if (rel > 0.72 || (rel > 0.62 && (x + y) % 2 === 0)) t -= 1;
          }
        }
        if (p.opts.tex) t += p.opts.tex(x, y);
        // Linha interna contra partes que ficam atrás
        if (!p.opts.noEdge) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const o = at(x + dx, y + dy);
            if (o >= 0 && o < id && !parts[o].emit) {
              t = 0;
              break;
            }
          }
        }
        colors[y * w + x] = p.ramp![Math.max(0, Math.min(3, t))];
      }
    }

    // Contorno externo
    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let c = colors[y * w + x];
        if (!c && (at(x + 1, y) >= 0 || at(x - 1, y) >= 0 || at(x, y + 1) >= 0 || at(x, y - 1) >= 0)) c = OUTLINE;
        if (!c) continue;
        const ox = flip ? w - 1 - x : x;
        const i = (y * w + ox) * 4;
        out[i] = parseInt(c.slice(1, 3), 16);
        out[i + 1] = parseInt(c.slice(3, 5), 16);
        out[i + 2] = parseInt(c.slice(5, 7), 16);
        out[i + 3] = 255;
      }
    }
    return out;
  }
}

const urlCache = new Map<string, string>();

/** Converte RGBA em data URL (cacheado por chave). Só funciona no navegador. */
export function toDataUrl(key: string, w: number, h: number, make: () => Uint8ClampedArray): string {
  const hit = urlCache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(make(), w, h), 0, 0);
  const url = canvas.toDataURL('image/png');
  urlCache.set(key, url);
  return url;
}
