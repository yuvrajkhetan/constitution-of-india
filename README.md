# Constitution of India

An interactive reader for the Constitution of India: every article in the official words, with plain-English summaries, themes, amendment history, clause links, read-aloud and an estimate of what the basic structure protects.

**Live site:** see the GitHub Pages link in this repository's About panel.

## Source

The article text, headings, Schedules, Appendices and footnotes come from *The Constitution of India [As on 10th September, 2026]*, published by the Legislative Department, Ministry of Law and Justice, Government of India. Only the layout has changed. For any legal purpose, rely on the official publication.

Everything else (summaries, themes, connections, the history timelines, the glossary grouping, facts and the basic structure estimates) was added to help readers and is not part of the legal text. The site's *How this was made* page explains each part and its sources. Settled basic structure law is drawn only from official sources: Supreme Court judgments and publications, the official footnotes, the Lok Sabha Secretariat and the National Judicial Academy.

This is an independent reader, not a Government website, and not legal advice.

## What's here

| Path | What it is |
|---|---|
| `index.html`, `text.json`, `fonts/` | The site itself, served by GitHub Pages |
| `favicon.*`, `apple-touch-icon.png`, `og.png` | Icons and the link-preview image, made by `src/make_icons.js` |
| `src/source/` | Text extracted from the official PDF |
| `src/data/` | Parsed text, themes, glossary, amendments and basic structure data |
| `src/sum/` | Plain-English summaries and amendment notes |
| `src/audit/` | The November 2026 clause-by-clause check of every summary, and what was changed |
| `src/tpl/` | Page template, styles and app code |
| `src/*.py` | Build scripts |

## Rebuilding

Needs Python 3, plus `csso-cli` and `terser` from npm.

```
cd src
python3 make_data.py     # data + summaries -> site/core.json, site/text.json
python3 build_site.py    # minify and assemble; copies the page, data and icons to the repo root
node make_icons.js       # favicons and the share image (then run build_site.py again)
```

`./serve.sh` serves `src/site` locally on ports 8765 and 8766, and `python3 test.py` runs the regression checks (needs Playwright).

## Fonts

The text is set in Palatino where the device has it, otherwise TeX Gyre Pagella, included in `fonts/` under the GUST Font License (`fonts/GUST-FONT-LICENSE.txt`).
