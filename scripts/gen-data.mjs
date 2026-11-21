import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const order = JSON.parse(await readFile(path.join(root, 'data/kanji/index.json'), 'utf8'));
const records = await Promise.all(order.map(async (char) => JSON.parse(await readFile(path.join(root, 'data/kanji', `${char}.json`), 'utf8'))));
const source = records.map((item) => {
  const slug = item.char.codePointAt(0).toString(16);
  const { planning_raw: _planningRaw, ...runtimeRecord } = item;
  return `  { ...${JSON.stringify(runtimeRecord)}, videoAsset: require('../../assets/anim/${slug}.mp4'), posterAsset: require('../../assets/anim/${slug}.png') },`;
}).join('\n');
await mkdir(path.join(root, 'src/generated'), { recursive: true });
await writeFile(path.join(root, 'src/generated/kanji.ts'), `import type { QuizKanji } from '../quiz';\n\nexport type KanjiRecord = QuizKanji & {\n  jlpt: string; jlpt_source: string; readings_source: string; videoAsset: number | string; posterAsset: number | string; origin: { type: string; liushu_zh: string; summary_en: string; sources: { title: string; url: string; quote?: string; accessed: string }[] }; animation: { video: string; poster: string; manim: { strokes_hint: string; picture: string } };\n};\n\nexport const kanji: KanjiRecord[] = [\n${source}\n];\n`);
console.log(`Generated src/generated/kanji.ts from ${records.length} JSON files.`);
