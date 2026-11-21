# Kanji Origins

Kanji Origins is a free, English-language study app for Japanese learners. It pairs a short glyph-origin animation with meanings, readings, verified example words, a small quiz, and on-device spaced repetition. There is no account or known-kanji skip test.

## Run locally

```sh
npm install
npm run gen:data
npm run validate:data
npm start
```

Press `w` in Expo's terminal UI to open the web app. Progress and a disabled-endpoint waitlist are stored on the device; web storage uses local storage.

## Kanji data

See [data/SCHEMA.md](data/SCHEMA.md) and [data/kanji.schema.json](data/kanji.schema.json). Add one `<character>.json` file under `data/kanji/` and add its character at the desired position in `data/kanji/index.json`, then run `npm run gen:data`. The generated module is `src/generated/kanji.ts`; edit the JSON source files, not the generated module. `npm run validate:data` checks the index and all entries.

Origin summaries are based on the English and Japanese Wiktionary glyph-origin entries, with source links to both entries and the corresponding Shuowen page. Candidate selection evidence and excluded-candidate reasons are in [research/SELECTION.md](research/SELECTION.md). Kanji readings and meanings use KanjiAPI's KANJIDIC-derived records. Example words, readings, and meanings have individual Jisho sources in their JSON records.

## Origin animations

`manim/origins.py` defines per-kanji scenes and reads each JSON record. Render with:

```sh
npm run render:anim
```

The renderer requires Manim Community Edition in `.venv-manim` and creates 720×720, 24 fps H.264 videos with no audio and PNG posters in `assets/anim/`. It post-processes Manim output with ffmpeg using H.264, `yuv420p`, fast-start metadata, and CRF 28. Set up the renderer with `uv venv -p 3.12 .venv-manim && VIRTUAL_ENV=.venv-manim uv pip install manim`.

## Waitlist and analytics

`src/config.ts` contains the only endpoints. `WAITLIST_ENDPOINT` is `null`; validated emails are saved in local device storage and the app shows “Thanks — saved.” `ANALYTICS_ENDPOINT` is `null`; events stay in a bounded local ring buffer and dev console, with no network requests. `ANALYTICS_PROVIDER` names the adapter target.

The analytics adapter records `visit`, `quiz_answer`, `kanji_learned`, and `review_return`. Event props include event-specific kanji, answer correctness, or days since first visit. `visit`, `kanji_learned`, and `review_return` also include `source: { session, first_touch }`; each value is normalized to `tiktok`, `instagram`, `youtube`, `other`, or `direct`. Session attribution captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `document.referrer`; `utm_source` takes precedence. The normalized first-touch source and its attribution details stay on the device.

Each kanji is available at `/kanji/<character>` and the short route `/k/<character>`. For example, `/kanji-app/k/木?utm_source=tiktok` opens the same learning page and preserves campaign parameters for attribution.

## GitHub Pages

The app uses Expo Router's single-page web export with `/kanji-app` as its base URL. The workflow runs `npm ci`, tests, data validation, TypeScript, and `npx expo export -p web`, adds `.nojekyll` and an SPA `404.html`, and deploys `dist/` to Pages. Videos are committed assets; CI does not render them.
