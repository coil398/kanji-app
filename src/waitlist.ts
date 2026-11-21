import AsyncStorage from '@react-native-async-storage/async-storage';
import { WAITLIST_ENDPOINT, WAITLIST_PROVIDER } from './config';
import { landingAttribution, type LandingAttribution } from './attribution';

const storageKey = '@kanji-origins/waitlist';
const firstTouchKey = '@kanji-origins/first-touch';

export type WaitlistSubmission = {
  email: string;
  pay_intent: 'yes' | 'maybe' | 'no' | null;
  source: LandingAttribution['source'];
  raw_utm: Record<string, string>;
  referrer_host: string | null;
  first_touch_source: LandingAttribution['source'];
  landing_path: string;
  timestamp: string;
};

export function waitlistRequest(endpoint: string, provider: string, payload: WaitlistSubmission): { url: string; init: RequestInit } {
  let url = endpoint;
  if (provider === 'formspree') url = endpoint.startsWith('http') ? endpoint : `https://formspree.io/f/${endpoint}`;
  const contentType = provider === 'google-apps-script' ? 'text/plain;charset=UTF-8' : 'application/json';
  return { url, init: { method: 'POST', headers: { 'Content-Type': contentType, ...(provider === 'formspree' ? { Accept: 'application/json' } : {}) }, body: JSON.stringify(payload) } };
}

export async function createWaitlistSubmission(email: string, payIntent: WaitlistSubmission['pay_intent'], now = new Date()): Promise<WaitlistSubmission> {
  let attribution: LandingAttribution;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const saved = sessionStorage.getItem(`${firstTouchKey}/landing-attribution`) ?? sessionStorage.getItem('@kanji-origins/attribution');
    if (saved) attribution = JSON.parse(saved) as LandingAttribution;
    else {
      attribution = landingAttribution(window.location.search, document.referrer || null, `${window.location.pathname}${window.location.search}`);
      sessionStorage.setItem(`${firstTouchKey}/landing-attribution`, JSON.stringify(attribution));
    }
  } else attribution = landingAttribution('', null, '/');

  const source = await AsyncStorage.getItem('@kanji-origins/first-touch-source');
  const firstAttribution = await AsyncStorage.getItem('@kanji-origins/first-touch-attribution');
  if (firstAttribution) {
    const original = JSON.parse(firstAttribution) as { utm_source?: string | null; referrer?: string | null; raw_utm?: Record<string, string>; referrer_host?: string | null };
    attribution.raw_utm = original.raw_utm ?? {};
    attribution.referrer_host = original.referrer_host ?? (original.referrer ? new URL(original.referrer).hostname.toLowerCase() : null);
  }
  const landingPath = await AsyncStorage.getItem('@kanji-origins/first-touch-landing-path');
  return {
    email: email.trim(), pay_intent: payIntent, source: attribution.source, raw_utm: attribution.raw_utm,
    referrer_host: attribution.referrer_host, first_touch_source: (source as LandingAttribution['source'] | null) ?? attribution.source,
    landing_path: landingPath ?? attribution.landing_path, timestamp: now.toISOString(),
  };
}

export async function submitWaitlist(payload: WaitlistSubmission): Promise<'local' | 'remote'> {
  if (!WAITLIST_ENDPOINT) {
    const stored = JSON.parse((await AsyncStorage.getItem(storageKey)) ?? '[]') as WaitlistSubmission[];
    const existing = stored.findIndex((entry) => entry.email.toLowerCase() === payload.email.toLowerCase());
    if (existing >= 0) stored[existing] = payload;
    else stored.push(payload);
    await AsyncStorage.setItem(storageKey, JSON.stringify(stored));
    return 'local';
  }
  const request = waitlistRequest(WAITLIST_ENDPOINT, WAITLIST_PROVIDER, payload);
  const response = await fetch(request.url, request.init);
  if (!response.ok) throw new Error(`Waitlist endpoint returned ${response.status}`);
  return 'remote';
}
