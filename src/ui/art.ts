/**
 * Arte vetorial do jogo: silhuetas com contorno de luz e olhos brilhando,
 * no espírito dos mobs de Aincrad vistos contra o céu. Tudo em SVG inline,
 * sem arquivos externos. O corpo usa um gradiente por andar (g-sil-1..3) e o
 * contorno, os olhos e os detalhes vêm de variáveis CSS (--rim, --eye, --acc).
 */

/** Definições compartilhadas (gradientes e brilho), inseridas uma única vez no documento. */
export const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="g-sil-1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#34456b"/>
      <stop offset="1" stop-color="#0a0f1d"/>
    </linearGradient>
    <linearGradient id="g-sil-2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a342b"/>
      <stop offset="1" stop-color="#120b08"/>
    </linearGradient>
    <linearGradient id="g-sil-3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#24463f"/>
      <stop offset="1" stop-color="#06100d"/>
    </linearGradient>
    <linearGradient id="g-hero" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2c3d63"/>
      <stop offset="1" stop-color="#0d1426"/>
    </linearGradient>
    <linearGradient id="g-blade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#9fd8ff"/>
    </linearGradient>
    <filter id="f-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
</svg>`;

const svg = (body: string, cls = '') =>
  `<svg class="art ${cls}" viewBox="0 0 200 200" aria-hidden="true">${body}</svg>`;

const sil = (d: string) => `<path class="sil" d="${d}"/>`;
const eye = (x: number, y: number, r = 3) => `<circle class="eye" cx="${x}" cy="${y}" r="${r}"/>`;
const acc = (d: string) => `<path class="acc" d="${d}"/>`;
const crown = (x: number, y: number, s = 1) =>
  `<path class="crown" transform="translate(${x} ${y}) scale(${s})" d="M-16 6 L-18 -10 L-9 -2 L0 -16 L9 -2 L18 -10 L16 6 Z"/>`;

// ───────────────────────── Quadrúpedes ─────────────────────────

function boar(opts: { horns?: boolean; bristles?: boolean } = {}) {
  const bristles = opts.bristles !== false
    ? sil('M84 92 l6 -12 l5 10 l6 -13 l5 12 l6 -12 l5 12 l6 -10 l5 11 l6 -8 l4 10 Z')
    : '';
  const horns = opts.horns
    ? acc('M60 98 C46 84 44 70 52 60 C55 74 63 84 74 92 Z M78 92 C74 76 78 64 88 58 C86 72 88 82 92 90 Z')
    : acc('M38 140 q-11 -3 -15 -14 q9 5 17 7 Z');
  return svg(`
    ${bristles}
    ${sil('M28 138 C26 116 48 94 84 90 C110 72 150 80 170 102 C184 118 182 144 170 154 L168 176 L156 176 L152 158 C130 162 100 162 80 158 L76 176 L64 176 L62 154 C50 152 38 150 28 138 Z')}
    ${sil('M68 100 l-6 -16 l14 10 Z')}
    ${horns}
    ${eye(52, 118)}
  `);
}

function wolf(alpha = false) {
  const mane = alpha ? sil('M56 82 C62 62 82 58 96 70 C90 86 78 98 62 100 Z') : '';
  return svg(`
    ${mane}
    ${sil('M40 104 L52 82 L58 98 L66 80 L74 100 C92 98 130 102 150 110 C166 114 178 120 192 112 C188 126 174 132 160 130 L158 138 L160 176 L150 176 L144 144 C125 148 100 148 86 144 L82 176 L72 176 L70 138 C64 132 58 126 52 126 L30 130 L20 124 L34 114 Z')}
    ${acc('M30 129 l2 6 l3 -5 Z M38 128 l2 6 l3 -5 Z')}
    ${eye(50, 110, alpha ? 3.6 : 3)}
  `);
}

// ───────────────────────── Plantas e árvores ─────────────────────────

function nepenthes() {
  return svg(`
    ${sil('M96 186 C92 156 104 136 98 112 L106 112 C112 136 100 158 106 186 Z')}
    ${sil('M98 168 C70 156 50 164 36 178 C62 178 80 176 98 174 Z')}
    ${sil('M104 152 C130 136 152 142 166 154 C142 158 124 160 104 160 Z')}
    ${sil('M68 78 C64 46 138 46 134 80 C132 104 116 116 102 116 C86 116 70 104 68 78 Z')}
    ${sil('M60 76 C78 58 124 58 144 72 L134 80 C118 70 88 70 70 80 Z')}
    <ellipse class="eye" cx="101" cy="82" rx="22" ry="5"/>
    ${acc('M74 80 l4 8 l4 -8 Z M86 79 l4 9 l4 -9 Z M98 79 l4 9 l4 -9 Z M110 79 l4 9 l4 -9 Z M122 80 l4 8 l4 -8 Z')}
  `);
}

function tree(big = false, thorns = false) {
  const leaves = [
    [54, 46, 28], [96, 28, 32], [142, 44, 30], [122, 66, 24], [72, 68, 24], [104, 56, 26],
  ].map(([x, y, r]) => `<circle class="leaf" cx="${x}" cy="${y}" r="${r}"/>`).join('');
  const spikes = thorns
    ? acc('M74 120 l-12 -4 l12 -4 Z M128 112 l12 -4 l-10 10 Z M80 150 l-12 2 l10 -8 Z M124 146 l12 4 l-12 2 Z')
    : '';
  return svg(`
    ${leaves}
    ${sil('M68 190 C74 150 70 120 76 92 C68 72 48 66 32 52 C54 56 68 62 80 74 C82 58 78 42 68 30 C86 40 94 56 96 74 C102 56 114 42 130 36 C118 52 110 66 110 82 C124 70 144 68 162 74 C142 78 126 88 118 102 C122 132 120 160 130 190 Z')}
    ${sil('M52 190 C60 176 70 172 80 176 L84 190 Z M118 190 L122 176 C134 172 144 176 152 190 Z')}
    ${spikes}
    ${eye(88, 118, big ? 4 : 3.4)}${eye(110, 118, big ? 4 : 3.4)}
    <path class="mouth" d="M88 140 Q100 ${big ? 150 : 146} 112 138"/>
  `, big ? 'big' : '');
}

// ───────────────────────── Insetos ─────────────────────────

function wasp(queen = false) {
  return svg(`
    <ellipse class="wing" cx="92" cy="74" rx="36" ry="14" transform="rotate(-24 92 74)"/>
    <ellipse class="wing" cx="116" cy="72" rx="32" ry="12" transform="rotate(18 116 72)"/>
    ${sil('M58 128 l-8 22 M70 132 l-2 24 M88 128 l6 22')}
    <path class="leg" d="M60 120 l-10 26 M74 124 l-4 28 M92 120 l8 24"/>
    <ellipse class="sil" cx="98" cy="108" rx="24" ry="19"/>
    <circle class="sil" cx="70" cy="110" r="14"/>
    ${sil('M118 104 C142 92 172 104 178 126 C164 136 138 132 120 120 Z')}
    <path class="acc-line" d="M134 98 C138 108 138 120 134 128 M150 100 C154 110 154 122 150 130 M164 108 C167 116 167 124 164 132"/>
    ${acc('M178 126 L194 136 L176 132 Z')}
    ${eye(64, 108, 4.2)}
    ${queen ? crown(72, 92, 0.8) : ''}
  `);
}

function spider() {
  const legs: string[] = [];
  const anchors = [82, 94, 106, 118];
  anchors.forEach((x, i) => {
    const dir = i < 2 ? -1 : 1;
    const kx = x + dir * (18 + i * 4);
    const fx = x + dir * (40 + i * 8);
    legs.push(`M${x} 110 L${kx} ${62 + i * 4} L${fx} 168`);
    legs.push(`M${x + 4} 112 L${kx + dir * 10} ${76 + i * 3} L${fx + dir * 14} 170`);
  });
  return svg(`
    <path class="leg thick" d="${legs.join(' ')}"/>
    <ellipse class="sil" cx="112" cy="112" rx="38" ry="26"/>
    <circle class="sil" cx="70" cy="118" r="18"/>
    ${acc('M108 98 L118 112 L108 126 L124 126 L114 112 L124 98 Z')}
    ${eye(60, 112, 2.6)}${eye(66, 106, 2.2)}${eye(58, 122, 2.2)}${eye(66, 120, 2.6)}
  `);
}

// ───────────────────────── Humanoides ─────────────────────────

function kobold(weapon: 'halberd' | 'cleaver' | 'axe' | 'nodachi', king = false) {
  const weapons = {
    halberd: `<rect class="sil" x="140" y="22" width="5" height="166"/>${acc('M145 28 C166 32 170 54 156 66 L145 60 Z')}${acc('M140 22 L142 8 L145 22 Z')}`,
    cleaver: `${sil('M128 96 L144 92 L150 104 L134 110 Z')}${acc('M140 64 C166 60 178 84 168 112 L146 104 Z')}`,
    axe: `<rect class="sil" x="140" y="40" width="6" height="130"/>${acc('M146 40 C176 42 184 76 160 96 L146 88 Z M140 44 C116 48 112 72 132 86 L140 80 Z')}`,
    nodachi: `${acc('M132 112 L188 18 L194 22 L140 118 Z')}${sil('M126 108 L144 120 L140 126 L122 114 Z')}`,
  } as const;
  const buckler = weapon === 'axe' ? `<circle class="sil" cx="64" cy="112" r="20"/><circle class="acc" cx="64" cy="112" r="6"/>` : '';
  return svg(`
    ${weapons[weapon]}
    ${sil('M80 58 L70 34 L86 48 L96 34 L98 52 C110 54 118 62 116 72 L132 78 L114 84 C108 90 92 94 82 86 C72 78 74 66 80 58 Z')}
    ${sil('M80 88 C66 106 62 130 70 148 L120 148 C126 126 122 104 110 88 Z')}
    ${sil('M74 146 L66 190 L82 190 L92 152 L100 152 L106 190 L122 190 L116 146 Z')}
    ${sil('M110 100 L138 120 L132 128 L104 110 Z')}
    ${buckler}
    ${eye(100, 66, king ? 3.6 : 3)}
    ${king ? crown(92, 40, 0.9) : ''}
  `, king ? 'big' : '');
}

function taurus(opts: { king?: boolean; armored?: boolean } = {}) {
  return svg(`
    ${sil('M150 110 L158 112 L180 38 L172 36 Z')}
    ${sil('M160 12 L196 24 L188 50 L152 38 Z')}
    ${acc('M160 12 L196 24 L194 30 L158 18 Z')}
    ${sil('M70 44 C56 38 48 24 50 10 C58 24 70 30 84 32 Z M130 44 C144 38 152 24 150 10 C142 24 130 30 116 32 Z')}
    ${sil('M84 32 C90 26 110 26 116 32 L118 56 C114 68 106 72 100 72 C94 72 86 68 82 56 Z')}
    <circle class="ring" cx="100" cy="66" r="4.5"/>
    ${sil('M56 70 C68 62 132 62 144 70 L156 110 L132 114 L126 140 L74 140 L68 114 L44 110 Z')}
    ${opts.armored ? acc('M60 72 C72 66 84 68 90 76 L70 92 Z M140 72 C128 66 116 68 110 76 L130 92 Z') : ''}
    ${sil('M76 138 L68 186 L92 186 L96 148 L104 148 L108 186 L132 186 L124 138 Z')}
    ${eye(91, 48)}${eye(109, 48)}
    ${opts.king ? crown(100, 22, 1.1) : ''}
  `, opts.king ? 'big' : '');
}

function elf(armored = false) {
  return svg(`
    ${sil('M86 32 C78 40 76 60 82 74 L92 52 Z')}
    ${sil('M90 34 C90 20 112 20 112 34 L132 24 L114 42 C112 50 106 56 100 56 C94 56 90 48 90 42 Z')}
    ${armored ? sil('M88 30 C88 14 114 14 114 30 L114 40 L88 40 Z') : ''}
    ${sil('M86 58 C74 80 66 120 60 160 L140 160 C132 120 124 80 116 58 Z')}
    ${armored ? acc('M80 64 C90 56 112 56 122 64 L118 76 C108 70 94 70 84 76 Z') : ''}
    ${sil('M80 158 L78 190 L92 190 L98 160 Z M104 160 L110 190 L124 190 L120 158 Z')}
    ${sil('M114 66 L136 74 L134 80 L112 76 Z')}
    <path class="blade" d="M134 70 L180 22 L185 27 L140 76 Z"/>
    <path class="acc-line" d="M128 66 L142 80"/>
    ${eye(103, 40, 2.6)}
  `);
}

function hooded() {
  return svg(`
    ${sil('M84 32 C86 12 118 12 120 32 L124 56 C112 64 92 64 80 56 Z')}
    ${sil('M78 58 C66 84 60 124 56 166 L146 166 C140 124 134 84 122 58 C112 66 90 66 78 58 Z')}
    ${sil('M82 164 L80 190 L94 190 L98 166 Z M106 166 L110 190 L124 190 L120 164 Z')}
    ${sil('M118 82 L142 98 L138 104 L114 92 Z')}
    <path class="blade" d="M138 96 L164 112 L161 117 L135 101 Z"/>
    ${eye(96, 42, 2.2)}${eye(108, 42, 2.2)}
  `);
}

/** O seu avatar: casaco longo, cabelo bagunçado e espada em mãos, olhando para os inimigos. */
export function heroArt(): string {
  return `<svg class="art hero" viewBox="0 0 200 200" aria-hidden="true">
    <path class="hero-body" d="M92 24 L100 10 L104 22 L113 8 L115 23 L126 18 L121 32 C123 42 117 52 107 52 C97 52 90 44 90 36 L82 36 Z"/>
    <path class="hero-body" d="M94 52 C84 60 80 72 80 88 L74 158 L86 166 L96 124 L104 124 L114 166 L128 158 L120 88 C120 72 116 60 108 52 Z"/>
    <path class="hero-body" d="M88 156 L86 190 L98 190 L100 158 Z M106 158 L110 190 L122 190 L116 156 Z"/>
    <path class="hero-body" d="M114 64 L136 86 L130 92 L110 74 Z"/>
    <path class="hero-blade" d="M132 90 L182 124 L177 131 L127 97 Z"/>
    <path class="hero-guard" d="M124 84 L138 100"/>
    <path class="hero-scarf" d="M96 52 C104 56 112 56 118 52 L132 60 L114 62 Z"/>
  </svg>`;
}

const ART: Record<string, (phase: number) => string> = {
  javali: () => boar(),
  boi_tremulo: () => boar({ horns: true, bristles: false }),
  lobo: () => wolf(),
  lobo_alfa: () => wolf(true),
  nepente: () => nepenthes(),
  kobold_sentinela: () => kobold('halberd'),
  kobold_tenente: () => kobold('cleaver'),
  illfang: (phase) => kobold(phase > 0 ? 'nodachi' : 'axe', true),
  touro_menor: () => taurus(),
  nato: () => taurus({ armored: true }),
  asterius: () => taurus({ king: true, armored: true }),
  vespa: () => wasp(),
  vespa_rainha: () => wasp(true),
  elfo_floresta: () => elf(),
  cavaleiro_negro: () => elf(true),
  aranha: () => spider(),
  treant: () => tree(),
  nerius: (phase) => tree(true, phase > 0),
  jogador_laranja: () => hooded(),
};

/** Cor dos olhos/brilho por inimigo (o resto vem do andar). */
const PALETTE: Record<string, { eye?: string; acc?: string }> = {
  javali: { acc: '#f1e6c8' },
  boi_tremulo: { acc: '#e9dcc0' },
  lobo_alfa: { eye: '#ff2d55' },
  nepente: { eye: '#c6ff5c', acc: '#f4f1d0' },
  kobold_tenente: { acc: '#c9d4e6' },
  illfang: { eye: '#ff3b3b', acc: '#ffd27a' },
  nato: { eye: '#ffd400', acc: '#c79a52' },
  asterius: { eye: '#ff7a1a', acc: '#ffcc4d' },
  vespa: { eye: '#ffcf33', acc: '#ffcf33' },
  vespa_rainha: { eye: '#ff9f1c', acc: '#ffcf33' },
  elfo_floresta: { eye: '#6ff7d8', acc: '#bdf5ea' },
  cavaleiro_negro: { eye: '#b77bff', acc: '#9d7bff' },
  aranha: { eye: '#ff3b6b', acc: '#ff6b8b' },
  treant: { eye: '#ffd166' },
  nerius: { eye: '#c86bff', acc: '#7dff9a' },
  jogador_laranja: { eye: '#ff9f1c', acc: '#ffb347' },
};

export function enemyArt(id: string, phase = 0): string {
  const draw = ART[id];
  if (!draw) return svg(eye(100, 100, 8));
  const p = PALETTE[id] ?? {};
  const style = [p.eye ? `--eye:${p.eye}` : '', p.acc ? `--acc:${p.acc}` : ''].filter(Boolean).join(';');
  return `<div class="art-wrap" style="${style}">${draw(phase)}</div>`;
}
