import { createElement } from 'react';
import type { CSSProperties } from 'react';

export default function OriginVideo({ source, poster, label }: { source: number | string; poster: number | string; label: string }) {
  return createElement('video', {
    src: source,
    poster,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    preload: 'metadata',
    'aria-label': label,
    style: { display: 'block', width: '100%', maxWidth: 520, aspectRatio: '1 / 1', objectFit: 'cover', alignSelf: 'center', borderRadius: 20, background: '#e1eee7' } satisfies CSSProperties,
  });
}
