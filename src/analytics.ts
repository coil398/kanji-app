import AsyncStorage from '@react-native-async-storage/async-storage';
import { ANALYTICS_ENDPOINT, ANALYTICS_PROVIDER, ANALYTICS_SITE_ID } from './config';
import { normalizeSource, type TrafficSource } from './attribution';

export type AnalyticsEvent = 'visit' | 'kanji_learned' | 'review_return' | 'quiz_answer' | 'waitlist_submit';
export type AnalyticsProps = Record<string, unknown>;
export type LocalEvent = { event: AnalyticsEvent; props: AnalyticsProps; ts: number; device_id?: string };
type Attribution = { source: TrafficSource; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_content: string | null; referrer: string | null; raw_utm: Record<string, string>; referrer_host: string | null; landing_path: string };
type EventSource = { session: TrafficSource; first_touch: TrafficSource };

const buffer: LocalEvent[] = [];
const MAX_EVENTS = 100;
let visitStarted = false;
const key = '@kanji-origins';
const sessionAttributionKey = `${key}/attribution`;

function readBrowserAttribution(): Attribution {
  if (typeof window === 'undefined' || typeof document === 'undefined') return { source: 'direct', utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, referrer: null, raw_utm: {}, referrer_host: null, landing_path: '/' };
  const params = new URLSearchParams(window.location.search);
  const value = (name: string) => params.get(name)?.trim().slice(0, 200) || null;
  const utm_source = value('utm_source');
  const utm_medium = value('utm_medium');
  const utm_campaign = value('utm_campaign');
  const utm_content = value('utm_content');
  const referrer = document.referrer || null;
  const raw_utm = Object.fromEntries([...params.entries()].filter(([name]) => name.toLowerCase().startsWith('utm_')));
  let referrer_host: string | null = null;
  try { referrer_host = referrer ? new URL(referrer).hostname.toLowerCase() : null; } catch { referrer_host = null; }
  return { source: normalizeSource(utm_source, referrer), utm_source, utm_medium, utm_campaign, utm_content, referrer, raw_utm, referrer_host, landing_path: `${window.location.pathname}${window.location.search}` };
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
    await AsyncStorage.setItem(`${key}/first-touch-landing-path`, typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`);
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

type AnalyticsRequest = { url: string; init: RequestInit };

export function buildAnalyticsRequest(event: LocalEvent, endpoint: string | null, siteId: string | null, device: string, context: { url: string; hostname: string; referrer: string; title: string; language: string; screen: string }): AnalyticsRequest | null {
  if (ANALYTICS_PROVIDER === 'none') return null;
  const source = event.props.source;
  const first_touch = event.props.first_touch;
  const props = { ...event.props, device_id: device };
  const json = (url: string, body: unknown, headers: Record<string, string> = { 'Content-Type': 'application/json' }): AnalyticsRequest => ({ url, init: { method: 'POST', headers, body: JSON.stringify(body) } });
  if (ANALYTICS_PROVIDER === 'plausible') {
    if (!siteId) return null;
    const url = endpoint ?? 'https://plausible.io/api/event';
    return json(url, { name: event.event, domain: siteId, url: context.url, referrer: context.referrer, props: { ...props, first_touch } });
  }
  if (ANALYTICS_PROVIDER === 'umami') {
    if (!siteId) return null;
    const url = endpoint ?? 'https://gateway.umami.is/api/send';
    return json(url, { type: 'event', payload: { website: siteId, hostname: context.hostname, language: context.language, referrer: context.referrer, screen: context.screen, title: context.title, url: context.url, name: event.event, id: device, data: { ...props, first_touch } } });
  }
  if (ANALYTICS_PROVIDER === 'goatcounter') {
    if (!endpoint) return null;
    const url = new URL(endpoint);
    url.searchParams.set('p', `${event.event}:${String(source ?? 'direct')}:first_touch=${String(first_touch ?? 'direct')}`);
    url.searchParams.set('t', event.event);
    url.searchParams.set('e', '1');
    if (context.referrer) url.searchParams.set('r', context.referrer);
    url.searchParams.set('rnd', String(event.ts));
    return { url: url.toString(), init: { method: 'GET', mode: 'no-cors' } };
  }
  if (ANALYTICS_PROVIDER === 'posthog') {
    const url = endpoint ?? 'https://us.i.posthog.com/i/v1/analytics/events';
    let uuid: string;
    const webCrypto = typeof globalThis.crypto === 'undefined' ? null : globalThis.crypto;
    if (webCrypto?.randomUUID) uuid = webCrypto.randomUUID();
    else {
      const bytes = new Uint8Array(16);
      if (webCrypto) webCrypto.getRandomValues(bytes);
      else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    return json(url, { created_at: new Date().toISOString(), batch: [{ event: event.event, uuid, distinct_id: device, timestamp: new Date(event.ts).toISOString(), properties: { ...props, source, first_touch, $current_url: context.url } }] }, { 'Content-Type': 'application/json', ...(siteId ? { Authorization: `Bearer ${siteId}` } : {}) });
  }
  if (!endpoint) return null;
  return json(endpoint, { ...event, props, source, first_touch, device_id: device });
}

export async function track(event: AnalyticsEvent, props: AnalyticsProps = {}): Promise<void> {
  const requiresSource = event === 'visit' || event === 'kanji_learned' || event === 'review_return' || event === 'waitlist_submit';
  const captured = requiresSource ? await captureAttribution() : null;
  const device = await deviceId();
  const sourceProps = captured ? { source: captured.source.session, session: captured.source.session, first_touch: captured.source.first_touch } : {};
  const entry: LocalEvent = { event, props: { ...props, ...sourceProps }, ts: Date.now(), device_id: device };
  buffer.push(entry);
  if (buffer.length > MAX_EVENTS) buffer.splice(0, buffer.length - MAX_EVENTS);
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.debug('[analytics:local]', entry);
  const context = {
    url: typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`,
    hostname: typeof window === 'undefined' ? '' : window.location.hostname,
    referrer: typeof document === 'undefined' ? '' : document.referrer,
    title: typeof document === 'undefined' ? '' : document.title,
    language: typeof navigator === 'undefined' ? '' : navigator.language,
    screen: typeof window === 'undefined' ? '' : `${window.screen.width}x${window.screen.height}`,
  };
  const request = buildAnalyticsRequest(entry, ANALYTICS_ENDPOINT, ANALYTICS_SITE_ID, device, context);
  if (request) await fetch(request.url, request.init);
}

export function getLocalEvents(): LocalEvent[] { return buffer.slice(); }

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
  await track('visit');
}

function localDateKey(time: number): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function recordReviewReturn(now = Date.now()): Promise<void> {
  const firstVisit = await AsyncStorage.getItem(`${key}/first-visit`);
  if (!firstVisit) return;
  const firstVisitTime = Number(firstVisit);
  const dayNumber = (time: number) => { const date = new Date(time); return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000; };
  const days = dayNumber(now) - dayNumber(firstVisitTime);
  if (days < 1) return;
  const today = localDateKey(now);
  if (await AsyncStorage.getItem(`${key}/review-return/${today}`)) return;
  await AsyncStorage.setItem(`${key}/review-return/${today}`, '1');
  await track('review_return', { days_since_first_visit: days });
}
