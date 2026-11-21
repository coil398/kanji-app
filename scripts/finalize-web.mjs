import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const indexHtml = path.resolve('dist/index.html');
const html = await readFile(indexHtml);
await copyFile(indexHtml, path.resolve('dist/404.html'));
await writeFile(path.resolve('dist/.nojekyll'), '');
const chars = JSON.parse(await readFile('data/kanji/index.json', 'utf8'));
for (const char of chars) {
  const route = path.resolve('dist/kanji', char);
  await mkdir(route, { recursive: true });
  await writeFile(path.join(route, 'index.html'), html);
}
console.log(`Prepared Pages fallback and ${chars.length} direct kanji routes.`);
