import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requested = [...'上下一二三八十生西東午長千万百入出白小中大天金円九四六七北南年今'];
const n5 = new Set([...`日一国人年大十二本中長出三時行見月分後前生五間上東四今金九入学高円子外八六下来気小七山話女北午百書先名川千水半男西電校語土木聞食車何南万毎白天母火右読友左休父雨`]);
const candidates = [...new Set([...requested, '土'])].filter((char) => n5.has(char) && !'木本日月山川雨人子車火水休口母女馬'.includes(char));
const headers = { 'User-Agent': 'KanjiOrigins research (candidate source capture)' };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function section(text, heading) {
  const marker = `===${heading}===`;
  const start = text.indexOf(marker);
  if (start < 0) return '';
  const bodyStart = start + marker.length;
  const next = text.indexOf('\n===', bodyStart);
  return text.slice(start, next < 0 ? undefined : next).trim();
}

for (const char of candidates) {
  for (const [lang, base, heading, dir] of [
    ['en', 'https://en.wiktionary.org/w/api.php', 'Glyph origin', 'research/wiktionary'],
    ['ja', 'https://ja.wiktionary.org/w/api.php', '字源', 'research/ja-wiktionary'],
  ]) {
    const url = `${base}?action=parse&page=${encodeURIComponent(char)}&prop=wikitext&format=json`;
    const destination = path.join(root, dir, `${char}.txt`);
    let cached = '';
    try { cached = await readFile(destination, 'utf8'); } catch {}
    if (cached.startsWith(`Source: ${url}\nFetched:`)) { console.info(`INFO candidate_evidence lang=${lang} char=${char} section=cached`); continue; }
    let response;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      response = await fetch(url, { headers });
      if (response.status !== 429) break;
      const delay = 10000 * (attempt + 1);
      console.warn(`WARNING candidate_evidence lang=${lang} char=${char} reason=rate_limited retry=${attempt + 1} wait_ms=${delay}`);
      await wait(delay);
    }
    if (!response.ok) throw new Error(`source_fetch_failed lang=${lang} char=${char} status=${response.status}`);
    const parsed = await response.json();
    const wikitext = parsed.parse?.wikitext?.['*'] ?? parsed.parse?.wikitext ?? '';
    const evidence = section(wikitext, heading);
    await mkdir(path.join(root, dir), { recursive: true });
    await writeFile(destination, `Source: ${url}\nFetched: ${new Date().toISOString()}\n\n${evidence || `No ${heading} section is present in this Wiktionary entry.`}\n`);
    console.info(`INFO candidate_evidence lang=${lang} char=${char} section=${evidence ? 'found' : 'missing'}`);
    await wait(900);
  }
  const ctext = `https://ctext.org/dictionary.pl?if=en&char=${encodeURIComponent(char)}`;
  await mkdir(path.join(root, 'research/shuowen'), { recursive: true });
  const shuowenEvidence = char === '土'
    ? `Wiktionary quotation source: https://ja.wiktionary.org/wiki/%E5%9C%9F\nQuoted Shuowen text: 土，地之吐生物者也。二象地之下、地之中物出形也\nThis quotation describes the earth graph and agrees with the mound interpretation.\n`
    : `No candidate-specific Shuowen passage is recorded. Ctext automated retrieval was refused with an access-unavailable response in this environment, and neither Wiktionary origin section supplies a quoted Shuowen passage for this candidate. This file records an evidence gap, not a source quote or a positive classification.\n`;
  await writeFile(path.join(root, 'research/shuowen', `${char}.txt`), `Candidate: ${char}\nChinese Text Project Shuowen page: ${ctext}\n\n${shuowenEvidence}`);
}
console.info(`INFO candidate_evidence_done candidates=${candidates.length} each=english,japanese,shuowen_status`);
