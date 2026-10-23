// Gera dist/artifact.html: uma página única (CSS e JS embutidos) a partir do build do Vite,
// para publicar o jogo como Artifact ou abrir sem servidor.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const assets = readdirSync(join(dist, 'assets'));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8')).join('\n');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, 'assets', f), 'utf8')).join('\n');

const html = `<title>Deck SAO Line</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
<style>${css}</style>
<div id="app"></div>
<script type="module">${js.replaceAll('</script', '<\\/script')}</script>
`;
writeFileSync(join(dist, 'artifact.html'), html);
console.log(`dist/artifact.html (${(html.length / 1024).toFixed(1)} kB)`);
