import AsyncStorage from '@react-native-async-storage/async-storage';
import { ANALYTICS_ENDPOINT } from './config';

export type AnalyticsEvent = 'visit' | 'kanji_learned' | 'review_return' | 'quiz_answer';
export type AnalyticsProps = Record<string, string | number | boolean>;
export type LocalEvent = { event: AnalyticsEvent; props: AnalyticsProps; ts: number };

const buffer: LocalEvent[] = [];
const MAX_EVENTS = 100;
let visitStarted = false;
const key = '@kanji-origins';

export async function deviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(`${key}/device-id`);
  if (saved) return saved;
  const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(`${key}/device-id`, created);
  return created;
}

export async function track(event: AnalyticsEvent, props: AnalyticsProps = {}): Promise<void> {
  const entry = { event, props, ts: Date.now() };
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
