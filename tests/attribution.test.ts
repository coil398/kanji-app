import { describe, expect, it } from 'vitest';
import { normalizeSource } from '../src/attribution';

describe('normalizeSource', () => {
  it('prefers campaign source and accepts platform aliases', () => {
    expect(normalizeSource('tt', 'https://youtube.com/watch?v=x')).toBe('tiktok');
    expect(normalizeSource('ig')).toBe('instagram');
    expect(normalizeSource('YT')).toBe('youtube');
    expect(normalizeSource('newsletter')).toBe('other');
  });

  it('normalizes supported referrer domains and direct visits', () => {
    expect(normalizeSource(null, 'https://www.tiktok.com/@user/video/1')).toBe('tiktok');
    expect(normalizeSource(null, 'https://l.instagram.com/')).toBe('instagram');
    expect(normalizeSource(null, 'https://m.youtube.com/watch?v=x')).toBe('youtube');
    expect(normalizeSource(null, 'https://youtu.be/x')).toBe('youtube');
    expect(normalizeSource(null, 'https://example.com')).toBe('other');
    expect(normalizeSource(null, null)).toBe('direct');
  });
});
