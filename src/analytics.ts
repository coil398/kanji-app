import AsyncStorage from '@react-native-async-storage/async-storage';
import { ANALYTICS_ENDPOINT } from './config';
import { normalizeSource, type TrafficSource } from './attribution';

export type AnalyticsEvent = 'visit' | 'kanji_learned' | 'review_return' | 'quiz_answer';
export type AnalyticsProps = Record<string, unknown>;
export type LocalEvent = { event: AnalyticsEvent; props: AnalyticsProps; ts: number };

type Attribution = { source: TrafficSource; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null; referrer: string | null };
type EventSource = { session: TrafficSource; first_touch: TrafficSource };

const buffer: LocalEvent[] = [];
const MAX_EVENTS = 100;
let visitStarted = false;
const key = '@kanji-origins';
const sessionAttributionKey = `${key}/attribution`;

function readBrowserAttribution(): Attribution {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { source: 'direct', utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, referrer: null };
  }
  const params = new URLSearchParams(window.location.search);
  const value = (name: string) => params.get(name)?.trim().slice(0, 200) || null;
  const utm_source = value('utm_source');
  const utm_medium = value('utm_medium');
  const utm_campaign = value('utm_campaign');
  const utm_content = value('utm_content');
  const referrer = document.referrer || null;
  return { source: normalizeSource(utm_source, referrer), utm_source, utm_medium, utm_campaign, utm_content, referrer };
}

async function captureAttribution(): Promise<{ attribution: Attribution; source: EventSource }> {
  const browserValue = readBrowserAttribution();
  let attribution = browserValue;
  if (typeof sessionStorage !== 'undefined') {
    const saved = sessionStorage.getItem(sessionAttributionKey);
    if (saved) attribution = JSON.parse(saved) as Attribution;
    else sessionStorage.setItem(sessionAttributionKey, JSON.stringify(browserValue));
  }
  let firstTouch = await AsyncStorage.getItem(`${key}/first-touch-source`);
  if (!firstTouch) {
    firstTouch = attribution.source;
    await AsyncStorage.setItem(`${key}/first-touch-source`, firstTouch);
    await AsyncStorage.setItem(`${key}/first-touch-attribution`, JSON.stringify(attribution));
  }
  return { attribution, source: { session: attribution.source, first_touch: firstTouch as TrafficSource } };
}

export async function deviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(`${key}/device-id`);
  if (saved) return saved;
  const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(`${key}/device-id`, created);
  return created;
}

export async function track(event: AnalyticsEvent, props: AnalyticsProps = {}): Promise<void> {
  const withSource = event === 'visit' || event === 'kanji_learned' || event === 'review_return';
  const captured = withSource ? await captureAttribution() : null;
  const entry = { event, props: captured ? { ...props, source: captured.source } : props, ts: Date.now() };
  buffer.push(entry);
  if (buffer.length > MAX_EVENTS) buffer.splice(0, buffer.length - MAX_EVENTS);
  if (__DEV__) console.debug('[analytics:local]', entry);
  if (ANALYTICS_ENDPOINT) {
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, device_id: await deviceId() }),
    });
  }
}

export function getLocalEvents(): LocalEvent[] {
  return buffer.slice();
}

export async function recordVisit(): Promise<void> {
  if (visitStarted) return;
  visitStarted = true;
  let isNewSession = true;
  if (typeof sessionStorage !== 'undefined') {
    isNewSession = sessionStorage.getItem(`${key}/visited`) !== '1';
    sessionStorage.setItem(`${key}/visited`, '1');
  }
  if (!isNewSession) return;
  const firstVisit = await AsyncStorage.getItem(`${key}/first-visit`);
  if (!firstVisit) await AsyncStorage.setItem(`${key}/first-visit`, String(Date.now()));
  await deviceId();
  await track('visit');
}

function localDateKey(time: number): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function recordReviewReturn(now = Date.now()): Promise<void> {
  const firstVisit = await AsyncStorage.getItem(`${key}/first-visit`);
  if (!firstVisit || localDateKey(now) === localDateKey(Number(firstVisit))) return;
  const today = localDateKey(now);
  if (await AsyncStorage.getItem(`${key}/review-return/${today}`)) return;
  const dayNumber = (time: number) => { const date = new Date(time); return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000; };
  const days = dayNumber(now) - dayNumber(Number(firstVisit));
  await AsyncStorage.setItem(`${key}/review-return/${today}`, '1');
  await track('review_return', { days_since_first_visit: days });
}
