import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planningDir = '/workspace/jp-learning/kanji-data';
const dataDir = path.join(root, 'data/kanji');
const knownRoot = new Set(['char', 'kanji', 'jlpt', 'jlpt_source', 'readings_source', 'meanings', 'meaning', 'meaning_en', 'on', 'kun', 'onyomi', 'kunyomi', 'readings', 'origin', 'origin_summary', 'summary', 'summary_en', 'origin_en', 'sources', 'origin_sources', 'examples', 'example_words', 'animation', 'planning_raw']);

function present(value) { return value !== undefined && value !== null; }
function asStrings(value) {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'object' && item ? item.kana : item).filter((item) => typeof item === 'string');
  if (typeof value === 'string') return value.split(/\s*[;,]\s*/).filter(Boolean);
  return undefined;
}
function normalizedSources(value) {
  if (!Array.isArray(value)) return undefined;
  return value.map((entry) => {
    if (typeof entry === 'string') return { title: entry, url: entry, accessed: new Date().toISOString().slice(0, 10) };
    if (!entry || typeof entry !== 'object') return entry;
    const url = entry.url ?? entry.source_url ?? entry.href;
    const checkedDate = typeof entry.checked === 'string' ? entry.checked.match(/\d{4}-\d{2}-\d{2}/)?.[0] : undefined;
    const known = { title: entry.title ?? entry.name ?? url, url, accessed: entry.accessed ?? checkedDate ?? new Date().toISOString().slice(0, 10), ...(entry.quote ? { quote: entry.quote } : {}) };
    return known;
  });
}

function normalizedExamples(value) {
  if (!Array.isArray(value)) return undefined;
  return value.map((example) => {
    const word = example.word ?? example.expression;
    return {
      word,
      reading: example.reading ?? example.kana,
      meaning: example.meaning ?? example.meaning_en ?? example.gloss,
      source_url: example.source_url ?? example.jisho_url ?? `https://jisho.org/search/${encodeURIComponent(word)}`,
    };
  });
}

export function mergePlanningRecord(base, planning) {
  const result = structuredClone(base);
  const origin = planning.origin && typeof planning.origin === 'object' ? planning.origin : {};
  const summary = origin.summary_en ?? origin.summary ?? origin.origin_en ?? planning.summary_en ?? planning.summary ?? planning.origin_en ?? planning.origin_summary;
  if (present(summary)) result.origin = { ...result.origin, summary_en: summary };
  const sourceValue = origin.sources ?? planning.sources ?? planning.origin_sources;
  const sources = normalizedSources(sourceValue);
  if (sources) result.origin = { ...result.origin, sources };
  const meanings = asStrings(planning.meanings ?? planning.meaning ?? planning.meaning_en);
  if (meanings) result.meanings = meanings;
  const readings = planning.readings && typeof planning.readings === 'object' ? planning.readings : {};
  const on = asStrings(readings.on ?? planning.on ?? planning.onyomi);
  const kun = asStrings(readings.kun ?? planning.kun ?? planning.kunyomi);
  if (on) result.on = on;
  if (kun) result.kun = kun;
  const exampleValues = normalizedExamples(planning.examples ?? planning.example_words);
  if (exampleValues) result.examples = exampleValues;

  const raw = { ...(base.planning_raw ?? {}), ...(planning.planning_raw ?? {}) };
  for (const [key, value] of Object.entries(planning)) if (!knownRoot.has(key)) raw[key] = value;
  const unknownOrigin = Object.fromEntries(Object.entries(origin).filter(([key]) => !['summary', 'summary_en', 'origin_en', 'sources', 'type', 'liushu_zh'].includes(key)));
  if (Object.keys(unknownOrigin).length) raw.origin = { ...(raw.origin ?? {}), ...unknownOrigin };
  if (Array.isArray(sourceValue)) {
    const sourceMetadata = sourceValue.map((source) => source && typeof source === 'object' ? Object.fromEntries(Object.entries(source).filter(([key]) => !['title', 'name', 'url', 'source_url', 'href', 'accessed', 'checked', 'quote'].includes(key))) : {}).filter((extra) => Object.keys(extra).length);
    if (sourceMetadata.length) raw.source_metadata = sourceMetadata;
  }
  if (Object.keys(raw).length) result.planning_raw = raw;
  return result;
}

export async function importPlanning(sourceDir = planningDir, targetDir = dataDir, validate = true) {
  let entries;
  try { entries = await readdir(sourceDir, { withFileTypes: true }); }
  catch (error) {
    if (error?.code === 'ENOENT') { console.info(`INFO import-planning skipped reason=directory_missing path=${sourceDir}`); return { imported: 0, skipped: 0 }; }
    throw error;
  }
  const names = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('_')).map((entry) => entry.name).sort();
  const ignored = entries.filter((entry) => entry.isDirectory() || (entry.isFile() && entry.name.startsWith('_'))).length;
  let imported = 0;
  let skipped = 0;
  for (const name of names) {
    const char = path.basename(name, '.json');
    const target = path.join(targetDir, name);
    try {
      const base = JSON.parse(await readFile(target, 'utf8'));
      const planning = JSON.parse(await readFile(path.join(sourceDir, name), 'utf8'));
      if ((planning.char ?? planning.kanji ?? char) !== char) throw new Error(`record character does not match filename: ${planning.char ?? planning.kanji}`);
      const merged = mergePlanningRecord(base, planning);
      const changed = Object.keys(merged).filter((key) => JSON.stringify(merged[key]) !== JSON.stringify(base[key]));
      if (!changed.length) { skipped += 1; console.info(`INFO import-planning item=${char} action=unchanged`); continue; }
      await writeFile(target, `${JSON.stringify(merged, null, 2)}\n`);
      imported += 1;
      console.info(`INFO import-planning item=${char} action=merged fields=${changed.join(',')}`);
    } catch (error) {
      console.error(`ERROR import-planning item=${char} reason=${error.message}`);
      throw error;
    }
  }
  console.info(`INFO import-planning done files=${names.length} imported=${imported} unchanged=${skipped} ignored_metadata=${ignored}`);
  if (validate) {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/validate-data.mjs')], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`data validation failed with status ${result.status}`);
  }
  return { imported, skipped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await importPlanning();
