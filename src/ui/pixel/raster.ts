/** Utilidades compartilhadas da pixel art: ruído determinístico e conversão para data URL. */

export const OUTLINE = '#2b2440';

export function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
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
  canvas.getContext('2d')!.putImageData(new ImageData(make(), w, h), 0, 0);
  const url = canvas.toDataURL('image/png');
  urlCache.set(key, url);
  return url;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
