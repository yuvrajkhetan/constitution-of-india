# Constitution of India reader

Public, unbranded reader of the Constitution of India for citizens and students. Live on GitHub Pages from this repo's root (`index.html`, `text.json`, `fonts/`). A copy is also published as a claude.ai artifact.

## Rules

- No em dashes in anything we write (summaries, UI text, notes). The official text keeps its own.
- The official text comes only from *The Constitution of India [As on 10th September, 2026]*, Legislative Department. Never edit its wording, except to fix extraction errors against `src/source/`. Owner-approved exceptions: (1) the edition's three Appendices are not part of the Constitution and are left out, and `make_data.py` removes the six footnote phrases that point to them (the source data stays as published); (2) one obvious misprint is corrected: Third Schedule Form IV prints "true faith and faith and allegiance" (page 270), and we show "true faith and allegiance", as in every other form. Correct any other misprint only with the owner's approval, and add it here.
- Anything added (summaries, themes, notes, basic structure calls) must rest on official, sound sources: Supreme Court judgments and publications, Legislative Department Act texts, Lok Sabha/Rajya Sabha documents, the National Portal of India. Cite them.
- Plain English, short sentences, no legal jargon. Summaries must not start with "This article".
- Three kinds of content, always marked the same way: the official text (no label); our plain-words help (summaries, themes, glossary, history: "In plain words"); and our analysis (the basic structure estimates, the next-amendment forecast and the basic structure theme), which always carries the "Analysis" label (`ANA` in `app.js`). The Supreme Court's own rulings are never labelled as analysis. Anything new that is our estimate or forecast gets the label.
- Apple-style design, a subtle patchwork quilt drawn from Indian textiles, and the Palatino font stack (TeX Gyre Pagella as fallback). It must work on phones down to 320px wide.

## Where things live (`src/`)

- `data/text.json`, `data/core.json`: the parsed official text (source of truth for the text).
- `source/Constitution_of_India_10.9.2026.pdf` is the official edition itself, and `source/...pdf.txt` its text copy. When the text copy looks wrong, check the printed page in the PDF (`pdftoppm -f N -l N -png`; printed page 270 is PDF page 301). Keep the edition's wording; misprints are corrected only with the owner's approval (see Rules). The PDF also holds some hidden leftover text (for example old "date yet to be notified" under newer dates) that the text copy picks up but the printed page does not show.
- `sum/all.json`: summaries, keyed `art-N`, `part-X` and `sch-KEY`. `sum/out/amend.json`: amendment one-liners.
- `data/themes.json`, `data/glossary.json`: glossary refs to Schedules look like `s:SIXTH:50`, which is a block index. If you add or remove Schedule blocks, update these refs.
- `data/bs_settled.json` (settled law with sources) and `bs_scores.py` (generates `data/bs.json`, the basic structure bands). Every ruling and feature cites the judgment itself by its Supreme Court Reports (S.C.R.) citation and page or paragraph (`at`), checked against the judges' own words, not headnotes or summaries. The Courrt connector gives the verbatim text for checking; never link to it, and never rely on its summaries or tags.
- `data/struck.json`: words of the Constitution the Supreme Court has declared invalid (nine rulings, from a check of all 106 amendments on 24 November 2026), shown as a box and clause labels on 31 pages. Each entry cites the judgment by S.C.R. page; `make_data.py` checks every label still lands on the right paragraph. The same rulings are listed in `bs_settled.json` (`struck_bs`, `struck_other`): change both together. Courrt lacks most judgments after about May 2026, so check later rulings on the Supreme Court's own site.
- `hist.py`: parses footnotes into the History timeline.
- `data/next.json`: the forecast of the next amendment (`#next-amendment`): pending Bills, the Constitution's own deadlines, recent Bill timings and outcomes, with official sources. Re-check it against Parliament's bill records (sansad.in) after each session of Parliament and update `asOn`. Leave out facts that rest only on news or broadcast reports.
- `data/terms.json`: plain explanations of terms used in our own text, shown on tap (first use per page) and in the Glossary. Each cites the article that creates or defines it; terms the Constitution does not define cite a Supreme Court judgment on the Court's own server. `make_data.py` checks every cited article and Schedule exists.
- `tpl/app.js`, `tpl/style.css`, `tpl/shell.html`: the app (hash routes such as `#art-19.1.a`, `#sch-SIXTH-b12`, `#basic-structure`, `#about`).
- `audit/`: the November 2026 clause-by-clause summary audit.
- Search (`tpl/app.js`, "search" block): on-device BM25 over stemmed words, with typo and half-word matching, abbreviations (`ABBR`), everyday-word bridges (`SYNW`, `PAIR`) and the hand-made `SYN` jumps (shown first only when they cover the whole query). `search_eval.js` types `audit/search_queries.json` (170 questions) and `audit/search_heldout.json` (42, never tuned against) into the real search box and scores the rank of the first correct answer; `test.py` fails below 95% and 80% in the top 3, or if any query finds nothing. Check both sets after any search change, and never tune against the held-out set.
- `check_text.py` and `audit/text_check_known.json`: checks every source line, every official note and every article's words against `src/source`. Add to the known list only after checking the source by hand, with the reason.

## Build and test

```
npm i -g csso-cli terser      # once
cd src
python3 make_data.py && python3 build_site.py   # also copies index.html, text.json and the icons to the repo root
node make_icons.js && python3 build_site.py     # only when the mark, favicon (tpl/favicon.svg) or home hero changes
./serve.sh                    # serves src/site on 8765 and 8766
python3 test.py               # runs check_text.py (official text vs src/source), then the Playwright regression; also run qa_crawl.js for every route on 5 devices
bash lh.sh "http://localhost:8766/preview.html#art-21"   # Lighthouse
node gaps.js                  # spacing: the gap between neighbouring blocks on each page, desktop and phone
node rows_flush.js            # rows in rounded cards sit flush with the card edges, so highlights fill the corners
```

Before pushing: tests pass, no console errors, no horizontal scroll at 320px, Lighthouse accessibility 100.

## Roadmap

- `ROADMAP.md` is the running, prioritised list of feature ideas and improvements. Keep it current as we work: add new ideas where they rank (with size and whether they need mockups), move finished items to Done with the date, and keep parked items with the owner's reason. Show the owner the top of the list when they ask what's next.

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
