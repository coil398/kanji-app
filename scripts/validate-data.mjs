import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(await readFile(path.join(root, 'data/kanji.schema.json'), 'utf8'));
const order = JSON.parse(await readFile(path.join(root, 'data/kanji/index.json'), 'utf8'));
const files = (await readdir(path.join(root, 'data/kanji'))).filter((name) => name.endsWith('.json') && name !== 'index.json').sort();
const expectedFiles = order.map((char) => `${char}.json`).sort();
if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) throw new Error('index.json does not exactly match the kanji JSON files.');
if (new Set(order).size !== order.length) throw new Error('index.json contains duplicate kanji.');

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
for (const char of order) {
  const record = JSON.parse(await readFile(path.join(root, 'data/kanji', `${char}.json`), 'utf8'));
  if (!validate(record)) throw new Error(`${char}.json: ${ajv.errorsText(validate.errors, { separator: '\n' })}`);
  if (record.char !== char) throw new Error(`${char}.json has mismatched char field.`);
  if (record.examples.some((example) => !example.word.includes(char))) throw new Error(`${char}.json has an example that does not contain its kanji.`);
}
console.log(`Validated ${order.length} kanji entries against data/kanji.schema.json.`);
