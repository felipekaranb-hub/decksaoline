import SHEET from './sprites.px?raw';
import { hexToRgb, toDataUrl } from './raster';

/**
 * Sprites em pixel art desenhados à mão em `sprites.px` (um caractere por pixel, paleta
 * compartilhada). Inimigos olham para a esquerda, o herói para a direita.
 */

interface PixMap {
  w: number;
  h: number;
  rows: string[];
}

function parse(text: string): { palette: Record<string, string>; sprites: Record<string, PixMap> } {
  const palette: Record<string, string> = {};
  const sprites: Record<string, PixMap> = {};
  let mode: 'pal' | 'sprite' | null = null;
  let name = '';
  let rows: string[] = [];
  for (const line of text.split('\n')) {
    if (mode !== 'sprite' && line.startsWith('#')) continue;
    if (line.startsWith('@palette')) mode = 'pal';
    else if (line.startsWith('@sprite')) {
      mode = 'sprite';
      name = line.split(/\s+/)[1];
      rows = [];
    } else if (line.startsWith('@end')) {
      if (mode === 'sprite') sprites[name] = { w: rows[0]?.length ?? 0, h: rows.length, rows };
      mode = null;
    } else if (mode === 'pal' && line.trim()) {
      const [k, v] = line.trim().split(/\s+/);
      palette[k] = v;
    } else if (mode === 'sprite') rows.push(line);
  }
  return { palette, sprites };
}

const { palette: PALETTE, sprites: SPRITES } = parse(SHEET);

/** Qual mapa usar para cada inimigo (e fase). */
function mapName(id: string, phase: number): string {
  if (phase > 0 && SPRITES[`${id}_2`]) return `${id}_2`;
  return SPRITES[id] ? id : 'javali';
}

export function spriteUrl(id: string, phase = 0): { url: string; w: number; h: number } {
  const name = mapName(id, phase);
  const map = SPRITES[name];
  const url = toDataUrl(`px:${name}`, map.w, map.h, () => {
    const out = new Uint8ClampedArray(map.w * map.h * 4);
    map.rows.forEach((row, y) => {
      for (let x = 0; x < map.w; x++) {
        const hex = PALETTE[row[x]];
        if (!hex) continue;
        const [r, g, b] = hexToRgb(hex);
        const i = (y * map.w + x) * 4;
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }
    });
    return out;
  });
  return { url, w: map.w, h: map.h };
}

export const SPRITE_IDS = Object.keys(SPRITES);
