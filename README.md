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

Origin claims and short quotations are sourced from each English Wiktionary glyph-origin page. Candidate selection evidence and excluded-candidate reasons are in [research/SELECTION.md](research/SELECTION.md). Kanji readings and meanings use KanjiAPI's KANJIDIC-derived records. Example words, readings, and meanings have individual Jisho sources in their JSON records.

## Origin animations

`manim/origins.py` defines per-kanji scenes and reads each JSON record. Render with:

```sh
npm run render:anim
```

The renderer creates 720×720, 24 fps H.264 videos with no audio and PNG posters in `assets/anim/`, using the source drawing description and data caption. Manim Community Edition is the intended renderer. This environment does not include Cairo/Pango development headers and does not allow system package installation, so the checked-in renderer uses the same JSON records and scene drawings to produce the MP4s with SVG rasterization and ffmpeg. Install the Manim system prerequisites before using the Python Manim scenes directly.

## Waitlist and analytics

`src/config.ts` contains the only endpoints. `WAITLIST_ENDPOINT` defaults to `null`; with that value, validated emails are saved in local device storage and the app shows “Thanks — saved.” Setting a URL makes the app POST `{ email, ts }` there. `ANALYTICS_ENDPOINT` defaults to `null`; events stay in a bounded local ring buffer and dev console. The adapter sends events plus a locally stored anonymous device ID when an endpoint is configured. `ANALYTICS_PROVIDER` names the adapter target.

## GitHub Pages

The app uses Expo Router's single-page web export with `/kanji-app` as its base URL. The workflow runs `npm ci`, tests, data validation, TypeScript, and `npx expo export -p web`, adds `.nojekyll` and an SPA `404.html`, and deploys `dist/` to Pages. Videos are committed assets; CI does not render them.
