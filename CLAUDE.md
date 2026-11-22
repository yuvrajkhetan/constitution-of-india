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
- `data/next.json`: the forecast of the next amendment (`#next-amendment`): pending Bills, the Constitution's own deadlines, recent Bill timings and outcomes, with official sources. Re-check it against Parliament's bill records (sansad.in) after each session of Parliament and update `asOn`. Leave out facts that rest only on news or broadcast reports.
- `tpl/app.js`, `tpl/style.css`, `tpl/shell.html`: the app (hash routes such as `#art-19.1.a`, `#sch-SIXTH-b12`, `#basic-structure`, `#about`).
- `audit/`: the November 2026 clause-by-clause summary audit.

## Build and test

```
npm i -g csso-cli terser      # once
cd src
python3 make_data.py && python3 build_site.py   # also copies index.html, text.json and the icons to the repo root
node make_icons.js && python3 build_site.py     # only when the mark, favicon (tpl/favicon.svg) or home hero changes
./serve.sh                    # serves src/site on 8765 and 8766
python3 test.py               # Playwright regression; also run qa_crawl.js for every route on 5 devices
bash lh.sh "http://localhost:8766/preview.html#art-21"   # Lighthouse
```

Before pushing: tests pass, no console errors, no horizontal scroll at 320px, Lighthouse accessibility 100.

## Shipping changes

- Put every finished change live as soon as it passes the checks above. Commit on the working branch and push it, then push the same commit to `main`, which GitHub Pages serves. The owner has asked for this, so it needs no further approval.
- After each change, update the claude.ai artifact "Constitution of India" (https://claude.ai/artifact/EaLJZMpbA6nN1fSAYEZJw9) from `src/site/index.html`. When `text.json` changed too, publish it alongside as `text.json`, with the per-Part files in `src/site/t/` as `t/<Part>.json`.
- For big changes (a new page or feature, a redesign, or a change to navigation or layout), show the owner screenshots on a phone and on desktop and wait for a yes before putting it live. Small fixes go live straight away, with screenshots afterwards where they help.

## Gotchas

- `pageURL()` in `app.js` points copied links at the claude.ai artifact URL only when the page runs inside a frame. On GitHub Pages it uses the page's own address.
- `text.json` loads after first paint. Code that needs it must handle the loading state. On a first visit straight to an article, the page also fetches that Part's small file (`t/<Part>.json`, written by `make_data.py`) and draws the article from it; read article text through `artText()` and basic structure data through `bsData()`, which use whichever has arrived.
- Commit both the `src/` change and the rebuilt root files.
- `make_icons.js` makes `favicon.svg`/`.ico`, `apple-touch-icon.png` and the 1200x630 `og.png` share image from the built page. The share tags use absolute GitHub Pages URLs (`SITE` in `build_site.py`); the artifact ignores them.
- `test.py` needs Python Playwright at the same version as the Node one: `pip install playwright==$(node -p "require('playwright/package.json').version")`.
