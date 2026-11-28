# Roadmap

A running, prioritised list of new features and improvements to existing things. Updated as we go: new ideas are
added where they rank, finished items move to **Done** with the date, and anything the owner parks stays under
**Parked** with the reason.

Size: **S** (an hour or two), **M** (a day or so), **L** (several days). Items marked **needs mockups** change a
page, a feature or navigation, so they get phone and desktop screenshots and the owner's yes before going live.

Last updated: 24 November 2026.

## Next up

| # | Item | Type | Size | Why it ranks here |
|---|---|---|---|---|
| 1 | **Refresh the next amendment forecast** after the Winter Session of Parliament ends (due late December 2026): re-check pending Bills on sansad.in and update `asOn` | Improvement | S | Our own rule; the forecast goes stale otherwise |
| 2 | **Corrections note** on the About page: what was fixed in the official text and when (for example, November 2026: seven States restored to the First Schedule, Third Schedule oaths, missing official notes), and the one misprint we correct (Form IV) | Feature | S | Being open about fixes builds trust in an unofficial reader |
| 3 | **"Report an error" link** on every article and Schedule page (pre-filled email or GitHub issue naming the page) | Feature | S | Turns readers into a second line of checking |

## High value, bigger

| # | Item | Type | Size | Notes |
|---|---|---|---|---|
| 4a | **Search: plain-language questions per provision** (doc2query): 5 to 10 everyday questions each article and Schedule answers, written at build time and searched alongside the text, never shown as content | Improvement | M | Targets the misses left after the November search work, such as "can a law make something a crime after I did it" and "rights of the accused". Measure with `search_eval.js` on both sets |
| 4b | **Search: index section headings** ("Right against Exploitation", "Right to Freedom") into the articles under them, and add common Hindi and Hinglish terms (maulik adhikar, rashtrapati, anuchchhed) | Improvement | S | Held-out miss "right against exploitation"; Hindi left out of the first pass at the owner's request |
| 5 | **"How the courts read it"** on 30 to 40 heavily litigated articles (14, 19, 21, 32, 356 and so on): two or three points from landmark judgments, each checked against the judges' own words and cited by S.C.R. and page. Same data feeds a **landmark cases page** (25 to 40 judgments: question, holding, articles, citation, link to the Court's own copy), case-name search ("Kesavananda", "Puttaswamy") and **key cases on theme pages** | Feature | L, **needs mockups** | Readers' most likely next question after the summary. Courrt's subject tags are incomplete (only 221 reportable judgments tagged under Article 21), so choose articles and cases from the judgments and official sources, not from Courrt counts |
| 5a | **Glossary terms the Court has defined**: "procedure established by law" (Maneka Gandhi), "the State" in Article 12, "reasonable restrictions", "creamy layer" (Indra Sawhney), each cited to the judgment | Improvement | S to M | Extends terms.json, which already allows a judgment as the source |
| 5b | **"Why this amendment happened"** on amendment pages: amendments that answered a judgment (1st after Champakam Dorairajan, 24th after Golak Nath, 77th onwards after Indra Sawhney, 105th after the Maratha reservation case) and the Court's later ruling on them, from the judgments and official Act texts | Feature | M, **needs mockups** | Makes the history of amendments readable as a conversation between Parliament and the Court |
| 6 | **Hindi**: the official Hindi text (authoritative under Article 394A), then summaries | Feature | L, **needs mockups** | Biggest step up in reach. Needs the edition's Hindi text as a source; `src/source/` has only English |

## Worth doing

| # | Item | Type | Size | Notes |
|---|---|---|---|---|
| 8 | **Learning mode for students**: short question cards per Part or theme, built from the summaries | Feature | M, **needs mockups** | Brings students back |
| 9 | **"What this article looked like before"**: earlier wording where the official notes quote it (for example Article 31C before Minerva Mills) | Feature | M, **needs mockups** | Only from the official notes |
| 10 | **Laws made under an article** (Article 3 to the State Reorganisation Acts, 21A to the Right to Education Act), linking the Legislative Department's copies | Feature | M, **needs mockups** | Courrt can help find them; never link to Courrt |
| 11 | **Offline reading**: installable, readable without a connection | Feature | M | Helps readers with patchy data; parked earlier, no cost concerns found |
| 12 | **Shorter pause when large pages open on slow phones** (basic structure, articles with the Contents sidebar): build below-the-fold parts after the first paint | Improvement | M | The fade-in itself is smooth; the pause is up to a few hundred ms on slow phones. Needs care with scroll positions and in-page links |

## Small polish

| # | Item | Type | Size | Notes |
|---|---|---|---|---|
| 15 | **Preamble row chevron** in Contents is a shade lighter than the Part rows' | Improvement | S | Cosmetic |

## Watch list

Developments to act on when they happen, checked 27 November 2026. Official sources only (sansad.in, PIB, the Gazette, the Supreme Court's own site).

- **Winter Session 2026** (expected early December, not yet summoned): if the Government brings back a delimitation amendment (the 131st Amendment Bill was defeated on 17 April 2026), update the forecast at once, not only after the session.
- **Ladakh, proposed Article 371K** (Home Ministry proposal, September 2026): add to the forecast if a Bill is introduced.
- **Jammu and Kashmir statehood** (Assembly resolution, 28 September 2026): a Reorganisation Act would change the First Schedule and Fourth Schedule by ordinary law, and the next official edition would carry it.
- **Supreme Court**: the challenge to the Election Commission appointments law sent to a Constitution Bench (23 September 2026; touches "free and fair elections"); the Sabarimala nine-judge reference (reserved 14 May 2026; Articles 25 and 26); the plea against delaying women's reservation (Article 334A). Any ruling striking down an amendment goes into `struck.json` and `bs_settled.json`.
- **L. Chandra Kumar link**: https://api.sci.gov.in/jonew/judis/19912.pdf is the Supreme Court's own copy (owner confirmed, 28 November 2026) but the PDF does not load yet. Recheck now and then; when it loads, add it to `LCK` in `bs_settled.json`.
- **Next English edition**: the Legislative Department's 26 November 2026 release covered the 22 Eighth Schedule languages only; the latest English edition is still "As on 10th September, 2026".

## Parked

- **Basic features by strength**: a first group of features the Court has used to strike down an amendment (each checked against the majority reasoning; Raj Narain's judges gave different reasons). Owner, 26 November 2026: "stick to two groups for now".
- **Manuscript-inspired design** (frames, teal, lotus in the border; mockups made 23 November 2026). Owner: "do nothing for now".

## Done

- **28 November 2026**: neutral citations on all 17 cited judgments, from the Supreme Court's e-S.C.R. records (they match every citation printed on the official PDFs).
- **28 November 2026**: all 106 amendment summaries and dates checked against the Acts themselves (evidence in `src/audit/amendments_2026-11-28/`): 40 summaries corrected or made specific, 12 dates fixed or filled in (the 10th Amendment showed 2020 instead of 1961; eight had none), 19 missing references added. The 88th Amendment is now shown as never brought into force.
- **28 November 2026**: official sources saved (`src/source/SOURCES.md`): the 1949 Gazette publishing the Constitution as passed, official copies of all 106 Amendment Acts, the 2025 assent opinion. Every cited judgment except L. Chandra Kumar now links to the Supreme Court's own copy; printed neutral citations added; the 2025 assent opinion noted on Articles 200 and 201.
- **26 November 2026**: basic features open to the judges' own words: one quote per feature from its leading judgment, read from the printed S.C.R. page and cited by page; every provision that carries it with its level; and, for six features, the amendment struck down for breaching it. Even spacing across the site (`gaps.js`).
- **26 November 2026**: basic structure page reorganised. The basic features open the page as compact rows grouped "Recognised by the Court" and "Named by some judges", in reading order, each opening to its provisions and judgments; the estimates follow as one section under the Analysis label.
- **26 November 2026**: an "Analysis" label on our estimates and forecast (the basic structure levels, chip and card, the next-amendment page and teaser, the basic structure theme, retitled "The basic structure"), never on rulings; the About page now names the three kinds of content.
- **26 November 2026**: smarter search. BM25 ranking over stemmed words, typo and half-typed word matching, abbreviations, Lok Sabha / Rajya Sabha bridges, clause-level results, "Best match" and "Showing results for". Measured with 170 test questions written first (top 3: 69% to 98%; no results: 35 to 0) and 42 held-out ones (top 1: 38% to 69%; top 3: 52% to 83%); both now run in `test.py`.
- **24 November 2026**: struck down by the Supreme Court. All 106 amendments checked against the judgments; the nine rulings that struck down words of the Constitution now show as one box and clause labels on 31 article and Schedule pages (`data/struck.json`), and Part IXB (Rajendra N. Shah, 2021) joined the basic structure page. Corrected: Raj Narain struck down Article 329A(4) only (one judge also held clause (5) void), and the NJAC Order of the Court citation. Not yet checked: Supreme Court judgments from May to November 2026, which Courrt lacks.
- **24 November 2026**: basic structure counts made clear. The home page bar says what it counts and shows each level's share; on the basic structure page the level buttons and the bar became one card, and both pages count the same 481 provisions (articles in force, the Preamble and the Schedules). The top level is now "Decided by the Supreme Court".
- **24 November 2026**: theme page ending. The four large "More themes" cards gave way to previous and next theme buttons and up to three related themes (chosen by shared provisions) as compact rows, with an "All themes" link.
- **24 November 2026**: the official PDF saved in `src/source/`. Third Schedule Form IV checked against the printed page: the edition misprints "true faith and faith and allegiance"; with the owner's approval we show "true faith and allegiance", and CLAUDE.md records the exception. The 106th Amendment notes confirmed against print.
- **24 November 2026**: smoother animations (home quilt, search, basic structure map, toasts, touch hovers); facts row alignment and shadows.
- **23 to 24 November 2026**: text check added to the tests (`check_text.py`); Schedule and Article 368 summaries re-checked; Preamble removed from the More sheet and given a badge in Contents; About added to the desktop top bar.
- **23 November 2026**: basic structure rulings and features checked against the judgments and cited by S.C.R. and page; glossary writ explanations corrected; amendment one-liners and link lists fixed.
- **23 November 2026**: official text fixes. Seven States restored to the First Schedule; Third Schedule oath forms; about 20 missing or merged official notes; broken entries in the Schedules and six articles; table headings and layout.
