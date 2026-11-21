import { afterEach, describe, expect, it, vi } from 'vitest';
const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => { storage.set(key, value); },
  },
}));
import { getLocalEvents, track } from '../src/analytics';

describe('analytics defaults', () => {
  afterEach(() => { vi.restoreAllMocks(); storage.clear(); });

  it('keeps source attribution locally and makes no fetch calls when provider is none', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    await track('kanji_learned', { kanji: '木' });
    const entry = getLocalEvents().at(-1);
    expect(entry?.props.source).toBe('direct');
    expect(entry?.props.first_touch).toBe('direct');
    expect(entry?.device_id).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
