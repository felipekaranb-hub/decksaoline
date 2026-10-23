import { sceneUrl } from './ui/pixel/scenes';
import { SPRITE_IDS, spriteUrl } from './ui/pixel/sprites';

// Galeria de desenvolvimento com todos os sprites (lab.html)
const grid = document.getElementById('grid')!;
const scale = Number(new URLSearchParams(location.search).get('scale') ?? 3);
for (const id of SPRITE_IDS) {
  for (const phase of id === 'illfang' || id === 'nerius' ? [0, 1] : [0]) {
    const { url, size } = spriteUrl(id, phase);
    grid.insertAdjacentHTML('beforeend', `<figure><img src="${url}" width="${size * scale}" height="${size * scale}"><figcaption>${id}${phase ? ' (2)' : ''}</figcaption></figure>`);
  }
}
for (const key of ['title', '1', '2', '3']) {
  grid.insertAdjacentHTML('beforeend', `<figure><img src="${sceneUrl(key)}" width="640" height="360"><figcaption>cenário ${key}</figcaption></figure>`);
}
