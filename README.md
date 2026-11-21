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

Planning data can be merged with `npm run import:planning`. It reads matching `<character>.json` files from `/workspace/jp-learning/kanji-data/`, prints changed fields, preserves unknown fields under `planning_raw`, and validates the resulting dataset. If that directory is absent, the command reports the missing directory and exits successfully.

## Origin animations

`manim/origins.py` defines per-kanji scenes and reads each JSON record. Render with:

```sh
npm run render:anim
```

The renderer requires Manim Community Edition in `.venv-manim` and creates 720×720, 24 fps H.264 videos with no audio and PNG posters in `assets/anim/`. It post-processes Manim output with ffmpeg using H.264, `yuv420p`, fast-start metadata, and CRF 28. Set up the renderer with `uv venv -p 3.12 .venv-manim && VIRTUAL_ENV=.venv-manim uv pip install manim`.

## Waitlist and analytics

`src/config.ts` contains the endpoint and provider settings. `WAITLIST_ENDPOINT` is `null` by default, so validated email, optional pay intent, UTM parameters, source, referrer host, first-touch source, landing path, and timestamp are saved locally. The success message is “Thanks — you're on the list.” Set `WAITLIST_PROVIDER` to `webhook`, `formspree`, or `google-apps-script` when enabling a JSON endpoint. Formspree accepts a form ID or full form URL; Apps Script uses the deployed web-app URL.

`ANALYTICS_PROVIDER` defaults to `none`, which keeps events in a bounded local ring buffer and makes no network requests. Set it to `plausible`, `umami`, `goatcounter`, `posthog`, or `webhook` to enable that adapter. `ANALYTICS_ENDPOINT` overrides the provider URL and `ANALYTICS_SITE_ID` supplies its domain/site/project identifier. The adapter records `visit`, `quiz_answer`, `kanji_learned`, `review_return`, and `waitlist_submit`. Source metrics use the normalized `source` (session), `first_touch`, and a stable anonymous `device_id`; review returns are sent once per local calendar day and include `days_since_first_visit` only from the next day onward. UTM source aliases `tt`, `ig`, and `yt` map to TikTok, Instagram, and YouTube; other non-empty values map to `other`.

Each kanji is available at `/kanji/<character>` and the short route `/k/<character>`. For example, `/kanji-app/k/木?utm_source=tiktok` opens the same learning page and preserves campaign parameters for attribution.

## GitHub Pages

The app uses Expo Router's single-page web export with `/kanji-app` as its base URL. The workflow runs `npm ci`, tests, data validation, TypeScript, and `npx expo export -p web`, adds `.nojekyll` and an SPA `404.html`, and deploys `dist/` to Pages. Videos are committed assets; CI does not render them.

## Current deployment (gh-pages branch)
The box's GitHub token has no `workflow` scope, so the Actions workflow is kept at `docs/github-pages-workflow.yml` (move it back to `.github/workflows/deploy.yml` once a token with `workflow` scope is available). Until then the site is published from the `gh-pages` branch: run `npx expo export -p web && npm run finalize:web`, then push the contents of `dist/` (plus `.nojekyll`) to `gh-pages`.
