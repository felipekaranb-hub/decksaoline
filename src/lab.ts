import { sceneUrl } from './ui/pixel/scenes';
import { SPRITE_IDS, spriteUrl } from './ui/pixel/sprites';

// Galeria de desenvolvimento com todos os sprites e cenários (lab.html)
const grid = document.getElementById('grid')!;
const scale = Number(new URLSearchParams(location.search).get('scale') ?? 4);
for (const id of SPRITE_IDS) {
  const { url, w, h } = spriteUrl(id);
  grid.insertAdjacentHTML('beforeend', `<figure><img src="${url}" width="${w * scale}" height="${h * scale}"><figcaption>${id}</figcaption></figure>`);
}
for (const key of ['title', '1', '2', '3']) {
  grid.insertAdjacentHTML('beforeend', `<figure><img src="${sceneUrl(key)}" width="640" height="360"><figcaption>cenário ${key}</figcaption></figure>`);
}
