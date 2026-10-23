import { GAME_ICONS } from '../gameIcons';
import { OUTLINE } from './raster';

/**
 * Ícones do game-icons.net reduzidos para pixel art: o traçado vetorial é rasterizado
 * numa grade pequena, binarizado e ganha contorno escuro e sombra embaixo.
 */

const cache = new Map<string, string>();

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function pixelIconUrl(name: string, size: number, fill: string): string {
  const key = `${name}:${size}:${fill}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const icon = GAME_ICONS[name];
  if (!icon || typeof document === 'undefined') return '';

  // Rasteriza o traçado em alta resolução e reduz para a grade (cobertura → limiar)
  const inner = size - 2;
  const hi = document.createElement('canvas');
  hi.width = hi.height = inner * 8;
  const hctx = hi.getContext('2d')!;
  hctx.scale((inner * 8) / 512, (inner * 8) / 512);
  hctx.fill(new Path2D(icon[1]));
  const lo = document.createElement('canvas');
  lo.width = lo.height = inner;
  const lctx = lo.getContext('2d')!;
  lctx.imageSmoothingEnabled = true;
  lctx.drawImage(hi, 0, 0, inner, inner);
  const cov = lctx.getImageData(0, 0, inner, inner).data;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < inner && y < inner && cov[(y * inner + x) * 4 + 3] > 100;

  const out = document.createElement('canvas');
  out.width = out.height = size;
  const ctx = out.getContext('2d')!;
  for (let y = -1; y <= inner; y++) {
    for (let x = -1; x <= inner; x++) {
      let color: string | null = null;
      if (on(x, y)) color = !on(x, y + 1) ? shade(fill, 0.72) : fill;
      else if (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1)) color = OUTLINE;
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  const url = out.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
