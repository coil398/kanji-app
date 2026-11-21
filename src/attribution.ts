export type TrafficSource = 'tiktok' | 'instagram' | 'youtube' | 'other' | 'direct';

const aliases: Record<string, TrafficSource> = {
  tiktok: 'tiktok', tt: 'tiktok',
  instagram: 'instagram', ig: 'instagram',
  youtube: 'youtube', yt: 'youtube',
};

export function normalizeSource(utmSource?: string | null, referrer?: string | null): TrafficSource {
  const campaignSource = utmSource?.trim().toLowerCase();
  if (campaignSource) return aliases[campaignSource] ?? 'other';
  if (!referrer) return 'direct';
  try {
    const hostname = new URL(referrer).hostname.toLowerCase().replace(/\.$/, '');
    if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) return 'tiktok';
    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) return 'instagram';
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') return 'youtube';
    return 'other';
  } catch {
    return 'other';
  }
}
