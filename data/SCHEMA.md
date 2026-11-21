# Kanji data

Each character has one JSON file named after the character in `data/kanji/`. `data/kanji/index.json` is the sole ordering source. Run `npm run gen:data` after editing the files to regenerate the Metro-compatible TypeScript module.

`data/kanji.schema.json` defines every field. `jlpt_source` points to the JLPT Sensei N5 list used to confirm membership. `readings_source` points to the KANJIDIC-derived [KanjiAPI](https://kanjiapi.dev/) record; the first three on and kun readings are kept in source order. `origin.sources` links to the English and Japanese Wiktionary origin entries and the corresponding Shuowen page. `quote` is optional and is included only for text fetched verbatim. Example words, exact readings, and meanings were checked through the [Jisho word API](https://jisho.org/api/v1/search/words?keyword=WORD); every example stores its corresponding Jisho search page.

`animation.video` and `animation.poster` name the rendered H.264 video and PNG poster in `assets/anim/`. `animation.manim.picture` describes the source drawing consumed by `manim/origins.py`.

Run `npm run validate:data` to validate the index and every record against the JSON Schema.
