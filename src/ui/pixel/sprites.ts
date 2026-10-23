import { GLOW, P } from './palette';
import { Sprite, TEX, toDataUrl } from './raster';

/**
 * Sprites em pixel art. Inimigos são desenhados olhando para a esquerda (na direção
 * do jogador); o herói olha para a direita. Inspirados nos mobs de Aincrad, mas com
 * desenho próprio.
 */

interface SpriteDef {
  size: number;
  draw: (s: Sprite) => void;
}

// ───────────────────────── Quadrúpedes ─────────────────────────

const boar: SpriteDef = {
  size: 56,
  draw: (s) => {
    s.rect(34, 40, 4, 11, P.fur, { tone: 1 }).rect(44, 39, 4, 12, P.fur, { tone: 1 });
    s.line(52, 30, 54, 26, 1.5, P.bristle);
    s.ellipse(32, 34, 20, 12, P.fur, { tex: TEX.fur });
    s.poly([16, 27, 19, 19, 22, 25, 25, 17, 28, 24, 32, 16, 35, 23, 39, 17, 42, 24, 46, 20, 48, 27, 30, 30], P.bristle, { tex: TEX.fur });
    s.ellipse(14, 36, 10, 9, P.fur, { tex: TEX.fur });
    s.poly([15, 29, 18, 21, 22, 30], P.fur);
    s.ellipse(6, 40, 5, 4, P.pink);
    s.glow(3, 39, '#4a1a24').glow(5, 40, '#4a1a24');
    s.poly([5, 43, 1, 34, 8, 41], P.bone);
    s.poly([10, 44, 8, 38, 12, 43], P.bone);
    s.rect(14, 43, 4, 9, P.fur).rect(26, 44, 4, 8, P.fur);
    s.rect(14, 51, 4, 2, P.hoof).rect(26, 51, 4, 2, P.hoof);
    s.glow(11, 33, GLOW.red, 2, 2).glow(11, 33, GLOW.redHot);
  },
};

const ox: SpriteDef = {
  size: 56,
  draw: (s) => {
    s.rect(36, 40, 5, 11, P.hideDark).rect(46, 39, 5, 12, P.hideDark);
    s.line(53, 28, 55, 34, 1.5, P.hideDark);
    s.ellipse(34, 32, 20, 13, P.hide, { tex: TEX.fur });
    s.ellipse(26, 24, 11, 7, P.hide, { tex: TEX.fur });
    s.poly([24, 34, 46, 34, 44, 44, 26, 44], P.leather);
    s.rect(24, 36, 22, 2, P.bronze);
    s.ellipse(12, 34, 9, 9, P.hide);
    s.ellipse(7, 39, 5, 4, P.pink);
    s.glow(4, 39, '#3a1a20');
    s.poly([13, 27, 6, 23, 3, 15, 8, 20, 15, 25], P.bone);
    s.poly([18, 27, 22, 19, 21, 11, 25, 18, 22, 28], P.bone);
    s.rect(13, 42, 5, 9, P.hide).rect(27, 43, 5, 8, P.hide);
    s.rect(13, 50, 5, 3, P.hoof).rect(27, 50, 5, 3, P.hoof);
    s.glow(9, 31, GLOW.red, 2, 1);
  },
};

const wolf = (alpha: boolean): SpriteDef => ({
  size: alpha ? 64 : 56,
  draw: (s) => {
    const k = alpha ? 64 / 56 : 1;
    const fur = alpha ? P.wolfAlpha : P.wolf;
    const X = (v: number) => v * k;
    s.line(X(38), X(36), X(40), X(50), X(3), fur, { tone: 1 }).line(X(46), X(35), X(49), X(50), X(3), fur, { tone: 1 });
    s.poly([X(44), X(28), X(52), X(18), X(55), X(20), X(50), X(30)], fur, { tex: TEX.fur });
    s.ellipse(X(34), X(32), X(15), X(8), fur, { tex: TEX.fur });
    s.ellipse(X(32), X(38), X(10), X(3), P.wolfLight);
    if (alpha) s.poly([X(16), X(22), X(24), X(16), X(30), X(22), X(28), X(34), X(18), X(34)], P.wolf, { tex: TEX.fur });
    s.poly([X(17), X(24), X(26), X(26), X(26), X(36), X(19), X(37)], fur, { tex: TEX.fur });
    s.ellipse(X(15), X(26), X(7), X(6), fur, { tex: TEX.fur });
    s.poly([X(2), X(29), X(9), X(24), X(13), X(29), X(11), X(32), X(4), X(32)], fur);
    s.poly([X(14), X(21), X(15), X(13), X(19), X(20)], fur).poly([X(18), X(21), X(21), X(14), X(22), X(22)], fur, { tone: 1 });
    s.glow(X(3), X(29), '#16121e', 2, 1);
    s.glow(X(5), X(32), GLOW.white).glow(X(8), X(32), GLOW.white);
    s.line(X(22), X(38), X(20), X(50), X(3), fur).line(X(28), X(38), X(28), X(50), X(3), fur);
    s.glow(X(11), X(25), alpha ? GLOW.red : GLOW.yellow, 2, 1);
    if (alpha) s.line(X(30), X(29), X(36), X(35), 1, P.pink, { flat: true, tone: 1 });
  },
});

// ───────────────────────── Plantas e árvores ─────────────────────────

const nepenthes: SpriteDef = {
  size: 56,
  draw: (s) => {
    s.line(28, 52, 26, 30, 3, P.plant);
    s.poly([27, 46, 14, 40, 6, 46, 16, 48], P.plant, { tex: TEX.noise });
    s.poly([28, 42, 40, 35, 50, 40, 40, 44], P.plant, { tex: TEX.noise });
    s.poly([22, 53, 34, 53, 31, 49, 25, 49], P.plant, { tone: 1 });
    s.ellipse(27, 22, 12, 11, P.pitcher, { tex: TEX.stripes(3) });
    s.poly([13, 15, 26, 9, 42, 13, 38, 17, 26, 14, 16, 18], P.plant);
    s.glow(19, 19, GLOW.green, 16, 3).glow(21, 20, '#e8ffb0', 12, 1);
    for (const x of [18, 22, 26, 30, 34]) s.glow(x, 18, P.bone[3]).glow(x + 1, 22, P.bone[2]);
  },
};

const tree = (big: boolean, thorns: boolean): SpriteDef => ({
  size: big ? 88 : 64,
  draw: (s) => {
    const k = big ? 88 / 64 : 1;
    const X = (v: number) => v * k;
    const leaf = big ? P.leafDark : P.leaf;
    const bark = big ? P.barkDark : P.bark;
    s.ellipse(X(16), X(18), X(12), X(10), leaf, { tex: TEX.noise });
    s.ellipse(X(48), X(16), X(13), X(10), leaf, { tex: TEX.noise });
    s.ellipse(X(32), X(10), X(15), X(9), leaf, { tex: TEX.noise });
    s.line(X(26), X(30), X(12), X(16), X(4), bark).line(X(38), X(30), X(52), X(14), X(4), bark).line(X(32), X(28), X(33), X(10), X(3), bark);
    s.poly([X(20), X(62), X(23), X(40), X(22), X(26), X(42), X(26), X(41), X(40), X(44), X(62)], bark, { tex: TEX.bark });
    s.poly([X(14), X(63), X(22), X(56), X(26), X(63)], bark, { tone: 1 }).poly([X(40), X(63), X(44), X(55), X(52), X(63)], bark, { tone: 1 });
    s.ellipse(X(27), X(38), X(3), X(3), ['#0a060c', '#140c16', '#140c16', '#1c121e'], { flat: true, tone: 0 });
    s.ellipse(X(37), X(38), X(3), X(3), ['#0a060c', '#140c16', '#140c16', '#1c121e'], { flat: true, tone: 0 });
    const eye = big ? GLOW.violet : GLOW.yellow;
    s.glow(X(26), X(37), eye, 2, 2).glow(X(36), X(37), eye, 2, 2);
    s.poly([X(26), X(46), X(38), X(46), X(36), X(50), X(28), X(50)], ['#0a060c', '#140c16', '#140c16', '#1c121e'], { flat: true, tone: 0 });
    s.glow(X(29), X(47), eye, X(6), 1);
    s.ellipse(X(14), X(30), X(8), X(5), leaf, { tex: TEX.noise }).ellipse(X(50), X(28), X(8), X(5), leaf, { tex: TEX.noise });
    if (thorns) {
      for (const [x0, y0, x1, y1] of [[20, 34, 13, 31], [44, 34, 51, 30], [21, 48, 13, 50], [43, 46, 51, 49], [24, 28, 19, 22], [40, 28, 45, 22]]) {
        s.line(X(x0), X(y0), X(x1), X(y1), 2, P.spiderMark);
      }
    }
  },
});

// ───────────────────────── Insetos ─────────────────────────

const wasp = (queen: boolean): SpriteDef => ({
  size: queen ? 64 : 56,
  draw: (s) => {
    const k = queen ? 64 / 56 : 1;
    const X = (v: number) => v * k;
    s.ellipse(X(28), X(14), X(12), X(5), P.wing, { flat: true, tone: 2 }).ellipse(X(36), X(16), X(10), X(4), P.wing, { flat: true, tone: 1 });
    s.line(X(22), X(34), X(18), X(46), 1.5, P.waspK).line(X(27), X(35), X(26), X(48), 1.5, P.waspK).line(X(32), X(34), X(36), X(46), 1.5, P.waspK);
    s.ellipse(X(39), X(32), X(13), X(8), P.waspY, { tex: TEX.stripes(4) });
    s.poly([X(50), X(33), X(56), X(38), X(49), X(37)], P.waspK);
    s.ellipse(X(25), X(28), X(8), X(7), P.waspK, { tex: TEX.fur });
    s.ellipse(X(13), X(29), X(6), X(6), P.waspK);
    s.line(X(10), X(24), X(5), X(17), 1, P.waspK).line(X(13), X(23), X(11), X(16), 1, P.waspK);
    s.poly([X(7), X(33), X(3), X(37), X(9), X(35)], P.waspY);
    s.glow(X(9), X(27), GLOW.orange, 3, 3).glow(X(9), X(27), GLOW.white);
    if (queen) {
      s.poly([X(9), X(21), X(10), X(15), X(13), X(19), X(15), X(13), X(17), X(19), X(20), X(15), X(20), X(22)], P.gold);
      s.glow(X(15), X(18), GLOW.red);
    }
  },
});

const spider: SpriteDef = {
  size: 56,
  draw: (s) => {
    const legs = [[24, 30, 16, 16, 6, 40], [27, 31, 22, 14, 13, 46], [32, 31, 36, 13, 44, 46], [35, 30, 44, 16, 53, 42]];
    for (const [x0, y0, kx, ky, fx, fy] of legs) s.line(x0, y0, kx, ky, 2.5, P.spider, { tone: 1 }).line(kx, ky, fx, fy, 2, P.spider, { tone: 1 });
    s.ellipse(37, 33, 15, 11, P.spider, { tex: TEX.fur });
    s.poly([33, 26, 41, 26, 38, 32, 41, 39, 33, 39, 36, 32], P.spiderMark);
    s.ellipse(18, 35, 8, 7, P.spider);
    const front = [[20, 32, 10, 22, 2, 44], [16, 36, 8, 30, 4, 50], [22, 38, 22, 44, 16, 52]];
    for (const [x0, y0, kx, ky, fx, fy] of front) s.line(x0, y0, kx, ky, 2.5, P.spider).line(kx, ky, fx, fy, 2, P.spider);
    s.glow(12, 33, GLOW.red, 2, 2).glow(15, 31, GLOW.red).glow(12, 37, GLOW.red).glow(16, 35, GLOW.red);
    s.glow(11, 41, P.bone[2]).glow(14, 42, P.bone[2]);
  },
};

// ───────────────────────── Humanoides ─────────────────────────

type KoboldKind = 'sentinela' | 'tenente' | 'lorde' | 'lorde2';

const kobold = (kind: KoboldKind): SpriteDef => {
  const big = kind === 'lorde' || kind === 'lorde2';
  const size = big ? 88 : kind === 'tenente' ? 64 : 56;
  return {
    size,
    draw: (s) => {
      const k = size / 56;
      const X = (v: number) => v * k;
      const skin = big ? P.illfang : P.kobold;
      // Arma de trás
      if (kind === 'sentinela') {
        s.line(X(13), X(4), X(15), X(54), X(2), P.wood);
        s.poly([X(13), X(5), X(5), X(8), X(4), X(15), X(13), X(13)], P.steel);
        s.poly([X(12), X(5), X(13), X(0), X(15), X(5)], P.steel);
      }
      if (kind === 'lorde') {
        s.line(X(48), X(8), X(46), X(54), X(2.5), P.wood);
        s.poly([X(48), X(8), X(56), X(6), X(56), X(22), X(48), X(18)], P.bone, { tex: TEX.noise });
        s.poly([X(47), X(10), X(40), X(9), X(41), X(19), X(47), X(17)], P.bone, { tex: TEX.noise });
      }
      // Pernas
      s.line(X(28), X(40), X(24), X(52), X(4), skin, { tone: 1 }).line(X(34), X(40), X(37), X(52), X(4), skin);
      s.rect(X(21), X(51), X(6), X(2.5), P.leather).rect(X(35), X(51), X(6), X(2.5), P.leather);
      // Corpo
      s.ellipse(X(31), X(33), X(10), X(10), skin, { tex: TEX.fur });
      s.poly([X(22), X(29), X(40), X(29), X(39), X(41), X(23), X(41)], big ? P.crimson : P.leather);
      s.rect(X(22), X(38), X(18), X(2.5), big ? P.gold : P.leather, { tone: big ? 2 : 1 });
      if (kind === 'sentinela' || kind === 'tenente') s.poly([X(24), X(29), X(36), X(29), X(35), X(36), X(25), X(36)], P.steel);
      if (kind === 'tenente' || big) s.ellipse(X(38), X(27), X(5), X(3.5), big ? P.gold : P.steel);
      // Cabeça
      s.ellipse(X(27), X(19), X(7), X(6.5), skin, { tex: TEX.fur });
      s.poly([X(21), X(18), X(12), X(20), X(13), X(24), X(22), X(25)], skin);
      s.glow(X(12), X(20), '#1a0e14', 2, 1);
      s.glow(X(15), X(23), P.bone[3]).glow(X(18), X(24), P.bone[3]);
      s.poly([X(27), X(14), X(29), X(5), X(32), X(14)], skin).poly([X(23), X(14), X(23), X(6), X(27), X(13)], skin, { tone: 1 });
      if (kind === 'sentinela') s.poly([X(20), X(16), X(25), X(11), X(33), X(12), X(34), X(17)], P.steel);
      if (big) s.poly([X(20), X(14), X(22), X(8), X(25), X(12), X(28), X(6), X(31), X(12), X(34), X(8), X(35), X(14)], P.gold);
      s.glow(X(22), X(18), GLOW.red, 2, 1).glow(X(22), X(18), GLOW.redHot);
      // Braço e arma da frente
      if (kind === 'sentinela') s.line(X(25), X(31), X(15), X(29), X(3), skin);
      if (kind === 'tenente') {
        s.line(X(36), X(30), X(45), X(23), X(3), skin);
        s.line(X(45), X(23), X(46), X(16), X(2), P.wood);
        s.poly([X(44), X(17), X(55), X(3), X(56), X(14), X(48), X(19)], P.steel);
      }
      if (kind === 'lorde') {
        s.line(X(36), X(30), X(46), X(24), X(3.5), skin);
        s.line(X(25), X(31), X(17), X(36), X(3.5), skin);
        s.ellipse(X(14), X(37), X(7), X(8), P.leather, { tex: TEX.noise });
        s.ellipse(X(14), X(37), X(2.5), X(2.5), P.steel);
      }
      if (kind === 'lorde2') {
        s.line(X(25), X(31), X(16), X(25), X(3.5), skin);
        s.line(X(16), X(25), X(13), X(21), X(2.5), P.leather);
        s.poly([X(13), X(21), X(2), X(1), X(4), X(0), X(15), X(19)], P.blade);
        s.glow(X(6), X(5), GLOW.white);
      }
    },
  };
};

type TaurusKind = 'golpeador' | 'coronel' | 'rei';

const taurus = (kind: TaurusKind): SpriteDef => {
  const size = kind === 'rei' ? 88 : kind === 'coronel' ? 64 : 56;
  return {
    size,
    draw: (s) => {
      const k = size / 56;
      const X = (v: number) => v * k;
      const metal = kind === 'rei' ? P.gold : P.steel;
      if (kind === 'rei') s.poly([X(26), X(18), X(46), X(18), X(52), X(50), X(20), X(50)], P.royal, { tex: TEX.noise });
      // Martelo atrás (cabo)
      s.line(X(12), X(8), X(16), X(50), X(2.5), P.wood);
      s.rect(X(4), X(2), X(16), X(9), metal);
      // Pernas
      s.line(X(28), X(40), X(26), X(51), X(5), P.hide, { tone: 1 }).line(X(36), X(40), X(38), X(51), X(5), P.hide);
      s.rect(X(22), X(50), X(7), X(3), P.hoof).rect(X(35), X(50), X(7), X(3), P.hoof);
      // Tronco
      s.poly([X(20), X(20), X(44), X(20), X(42), X(36), X(24), X(36)], P.hide, { tex: TEX.fur });
      s.poly([X(24), X(35), X(42), X(35), X(40), X(44), X(26), X(44)], kind === 'rei' ? P.royal : P.leather);
      s.rect(X(23), X(34), X(20), X(2.5), kind === 'rei' ? P.gold : P.leather, { tone: 1 });
      if (kind !== 'golpeador') {
        s.ellipse(X(21), X(21), X(6), X(4), kind === 'rei' ? P.gold : P.bronze);
        s.ellipse(X(43), X(21), X(6), X(4), kind === 'rei' ? P.gold : P.bronze);
        s.poly([X(26), X(22), X(38), X(22), X(36), X(30), X(28), X(30)], kind === 'rei' ? P.gold : P.bronze);
      }
      // Cabeça
      s.ellipse(X(31), X(14), X(7), X(7), P.hide, { tex: TEX.fur });
      s.ellipse(X(28), X(18), X(5), X(4), P.hideDark);
      s.poly([X(25), X(10), X(16), X(8), X(12), X(1), X(19), X(5), X(26), X(7)], P.bone);
      s.poly([X(36), X(10), X(44), X(8), X(48), X(1), X(42), X(5), X(35), X(7)], P.bone);
      s.glow(X(25), X(19), '#1a0e10').glow(X(28), X(19), '#1a0e10');
      s.glow(X(26), X(21), P.gold[3], 2, 1);
      const eye = kind === 'coronel' ? GLOW.yellow : kind === 'rei' ? GLOW.orange : GLOW.red;
      s.glow(X(27), X(12), eye, 2, 1).glow(X(32), X(12), eye, 2, 1);
      if (kind === 'rei') s.poly([X(24), X(8), X(25), X(2), X(28), X(6), X(31), X(0), X(34), X(6), X(37), X(2), X(38), X(8)], P.gold);
      // Braço segurando o martelo
      s.line(X(22), X(24), X(14), X(30), X(4), P.hide);
      s.line(X(41), X(24), X(46), X(34), X(4), P.hide, { tone: 1 });
    },
  };
};

const elf = (dark: boolean): SpriteDef => {
  const size = dark ? 64 : 56;
  return {
    size,
    draw: (s) => {
      const k = size / 56;
      const X = (v: number) => v * k;
      const cloth = dark ? P.darkArmor : P.forest;
      if (dark) s.poly([X(30), X(18), X(40), X(18), X(46), X(50), X(28), X(50)], P.crimson, { tex: TEX.noise });
      else s.poly([X(31), X(16), X(38), X(18), X(40), X(46), X(30), X(46)], P.elfHair, { tex: TEX.stripes(2) });
      s.line(X(29), X(38), X(26), X(52), X(3), cloth, { tone: 1 }).line(X(33), X(38), X(36), X(52), X(3), cloth);
      s.rect(X(23), X(50), X(5), X(3), P.leather).rect(X(34), X(50), X(5), X(3), P.leather);
      s.poly([X(25), X(20), X(37), X(20), X(39), X(42), X(23), X(42)], cloth, { tex: dark ? undefined : TEX.noise });
      s.rect(X(24), X(32), X(14), X(2), dark ? P.steel : P.leather);
      if (dark) {
        s.ellipse(X(25), X(21), X(5), X(3.5), P.darkArmor);
        s.poly([X(27), X(24), X(35), X(24), X(33), X(31), X(29), X(31)], P.steel);
      }
      s.ellipse(X(31), X(13), X(5), X(6), dark ? P.darkArmor : P.elfSkin);
      if (dark) {
        s.poly([X(26), X(9), X(36), X(9), X(37), X(15), X(26), X(15)], P.darkArmor);
        s.glow(X(27), X(12), GLOW.violet, X(4), 1);
        s.line(X(34), X(7), X(42), X(2), X(2), P.crimson);
      } else {
        s.poly([X(27), X(8), X(36), X(7), X(38), X(14), X(34), X(10), X(28), X(11)], P.elfHair);
        s.poly([X(35), X(12), X(43), X(8), X(36), X(15)], P.elfSkin);
        s.glow(X(28), X(13), GLOW.teal);
      }
      // Braço e espada
      s.line(X(26), X(23), X(19), X(30), X(3), cloth);
      s.line(X(19), X(30), X(4), X(14), X(2), P.blade);
      s.line(X(17), X(27), X(22), X(32), X(1.5), dark ? P.royal : P.gold);
      s.glow(X(9), X(19), GLOW.white);
    },
  };
};

const hooded: SpriteDef = {
  size: 56,
  draw: (s) => {
    s.line(29, 38, 26, 52, 3, P.cloakGrey, { tone: 1 }).line(33, 38, 36, 52, 3, P.cloakGrey);
    s.rect(23, 50, 5, 3, P.leather).rect(34, 50, 5, 3, P.leather);
    s.poly([24, 20, 38, 20, 42, 46, 20, 46], P.cloakOrange, { tex: TEX.noise });
    s.rect(23, 33, 16, 2, P.leather);
    s.glow(29, 33, P.gold[3], 2, 2);
    s.poly([24, 8, 30, 4, 37, 8, 39, 22, 23, 22], P.cloakOrange);
    s.ellipse(29, 15, 5, 5, ['#0c080c', '#160e14', '#160e14', '#1e141a'], { flat: true, tone: 0 });
    s.glow(26, 14, GLOW.orange).glow(30, 14, GLOW.orange);
    s.line(24, 26, 16, 31, 3, P.cloakOrange);
    s.line(16, 31, 8, 35, 2, P.steel);
    s.glow(9, 34, GLOW.green);
  },
};

/** Seu avatar: cabelo bagunçado, casaco escuro longo, cachecol e espada. Olha para a direita. */
const hero: SpriteDef = {
  size: 56,
  draw: (s) => {
    s.poly([22, 20, 34, 20, 38, 46, 30, 42, 26, 46, 18, 44], P.coat, { tex: TEX.noise });
    s.line(25, 38, 24, 51, 3, P.coat, { tone: 1 }).line(31, 38, 33, 51, 3, P.coat);
    s.rect(21, 50, 5, 3, P.leather).rect(31, 50, 5, 3, P.leather);
    s.poly([22, 20, 34, 20, 33, 36, 23, 36], P.coat);
    s.rect(23, 32, 11, 2, P.leather);
    s.glow(28, 32, P.steel[3], 2, 2);
    s.ellipse(29, 13, 5.5, 6, P.skin);
    s.poly([20, 15, 21, 4, 25, 6, 27, 0, 30, 5, 33, 1, 34, 7, 37, 6, 35, 10, 31, 8, 28, 9, 26, 13, 24, 18], P.heroHair, { tex: TEX.stripes(2) });
    s.glow(31, 12, '#1a1630').glow(32, 12, '#2a2448');
    s.glow(31, 16, P.skin[1], 2, 1);
    s.poly([23, 19, 33, 19, 35, 23, 26, 24, 20, 30, 19, 25], P.scarf);
    // Braço da espada
    s.line(31, 23, 37, 30, 3, P.coat);
    s.line(37, 31, 54, 22, 2, P.blade);
    s.line(35, 28, 39, 33, 1.5, P.gold);
    s.glow(50, 23, GLOW.white);
  },
};

const DEFS: Record<string, (phase: number) => SpriteDef> = {
  hero: () => hero,
  javali: () => boar,
  boi_tremulo: () => ox,
  lobo: () => wolf(false),
  lobo_alfa: () => wolf(true),
  nepente: () => nepenthes,
  kobold_sentinela: () => kobold('sentinela'),
  kobold_tenente: () => kobold('tenente'),
  illfang: (phase) => kobold(phase > 0 ? 'lorde2' : 'lorde'),
  touro_menor: () => taurus('golpeador'),
  nato: () => taurus('coronel'),
  asterius: () => taurus('rei'),
  vespa: () => wasp(false),
  vespa_rainha: () => wasp(true),
  elfo_floresta: () => elf(false),
  cavaleiro_negro: () => elf(true),
  aranha: () => spider,
  treant: () => tree(false, false),
  nerius: (phase) => tree(true, phase > 0),
  jogador_laranja: () => hooded,
};

/** Retorna a data URL do sprite e o tamanho nativo (pixels). */
export function spriteUrl(id: string, phase = 0): { url: string; size: number } {
  const def = (DEFS[id] ?? DEFS.javali)(phase);
  const url = toDataUrl(`${id}:${phase}`, def.size, def.size, () => {
    const s = new Sprite(def.size, def.size);
    def.draw(s);
    return s.render();
  });
  return { url, size: def.size };
}

export const SPRITE_IDS = Object.keys(DEFS);
