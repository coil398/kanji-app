import { describe, expect, it } from 'vitest';
import { mergePlanningRecord } from '../scripts/import-planning.mjs';
import base from '../data/kanji/木.json';
import fixture from './fixtures/planning/木.json';

describe('mergePlanningRecord', () => {
  it('lets planning origin fields win and preserves unknown planning fields', () => {
    const merged = mergePlanningRecord(base, fixture);
    expect(merged.origin.summary_en).toBe('Planning source summary.');
    expect(merged.origin.sources).toEqual(fixture.sources);
    expect(merged.meanings).toEqual(['tree']);
    expect(merged.on).toEqual(['モク']);
    expect(merged.examples).toEqual(fixture.examples);
    expect(merged.planning_raw.review_note).toBe('Preserved unknown planning field.');
  });

  it('accepts summary_en and string URL source variants', () => {
    const merged = mergePlanningRecord(base, { summary_en: 'Variant summary.', sources: ['https://example.com/source'] });
    expect(merged.origin.summary_en).toBe('Variant summary.');
    expect(merged.origin.sources[0].url).toBe('https://example.com/source');
  });
});
