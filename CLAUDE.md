# Constitution of India reader

Public, unbranded reader of the Constitution of India for citizens and students. Live on GitHub Pages from this repo's root (`index.html`, `text.json`, `fonts/`). A copy is also published as a claude.ai artifact.

## Rules

- No em dashes in anything we write (summaries, UI text, notes). The official text keeps its own.
- The official text comes only from *The Constitution of India [As on 10th September, 2026]*, Legislative Department. Never edit its wording, except to fix extraction errors against `src/source/`.
- Anything added (summaries, themes, notes, basic structure calls) must rest on official, sound sources: Supreme Court judgments and publications, Legislative Department Act texts, Lok Sabha/Rajya Sabha documents, the National Portal of India. Cite them.
- Plain English, short sentences, no legal jargon. Summaries must not start with "This article".
- Apple-style design, a subtle patchwork quilt drawn from Indian textiles, and the Palatino font stack (TeX Gyre Pagella as fallback). It must work on phones down to 320px wide.

## Where things live (`src/`)

- `data/text.json`, `data/core.json`: the parsed official text (source of truth for the text).
- `sum/all.json`: summaries, keyed `art-N`, `part-X` and `sch-KEY`. `sum/out/amend.json`: amendment one-liners.
- `data/themes.json`, `data/glossary.json`: glossary refs to Schedules look like `s:SIXTH:50`, which is a block index. If you add or remove Schedule blocks, update these refs.
- `data/bs_settled.json` (settled law with sources) and `bs_scores.py` (generates `data/bs.json`, the basic structure bands).
- `hist.py`: parses footnotes into the History timeline.
- `tpl/app.js`, `tpl/style.css`, `tpl/shell.html`: the app (hash routes such as `#art-19.1.a`, `#sch-SIXTH-b12`, `#basic-structure`, `#about`).
- `audit/`: the November 2026 clause-by-clause summary audit.

## Build and test

```
npm i -g csso-cli terser      # once
cd src
python3 make_data.py && python3 build_site.py   # also copies index.html and text.json to the repo root
./serve.sh                    # serves src/site on 8765 and 8766
python3 test.py               # Playwright regression; also run qa_crawl.js for every route on 5 devices
bash lh.sh "http://localhost:8766/preview.html#art-21"   # Lighthouse
```

Before pushing: tests pass, no console errors, no horizontal scroll at 320px, Lighthouse accessibility 100.

## Gotchas

- `pageURL()` in `app.js` points copied links at the claude.ai artifact URL only when the page runs inside a frame. On GitHub Pages it uses the page's own address.
- `text.json` loads after first paint. Code that needs it must handle the loading state.
- Commit both the `src/` change and the rebuilt root files.
