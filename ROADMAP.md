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
| 5 | **"How the courts read it"** on 30 to 40 heavily litigated articles (14, 19, 21, 32, 356 and so on): two or three points from landmark judgments, each checked against the judges' own words and cited by S.C.R. and page | Feature | L, **needs mockups** | Builds on the basic structure work; readers' most likely next question after the summary |
| 6 | **Hindi**: the official Hindi text (authoritative under Article 394A), then summaries | Feature | L, **needs mockups** | Biggest step up in reach. Needs the edition's Hindi text as a source; `src/source/` has only English |
| 7 | **Check the amendment one-liners against the Acts themselves**: Courrt holds only 3 of 106 Acts, so use the Legislative Department's official Act texts | Improvement | M | 8 one-liners were corrected from the official notes; the rest have not been read against their Acts |

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
| 13 | **2025 Presidential Reference** on assent to Bills: check against the Supreme Court's own PDF and, if it holds, add it back to "Separation of powers" | Improvement | S | Dropped because Courrt lacks it |
| 14 | **Neutral citations** (for example 2015 INSC 285) beside the S.C.R. citations, once confirmed on the Supreme Court's own site | Improvement | S | Most came only from Courrt's records, so they were left out |
| 15 | **Preamble row chevron** in Contents is a shade lighter than the Part rows' | Improvement | S | Cosmetic |

## Parked

- **Manuscript-inspired design** (frames, teal, lotus in the border; mockups made 23 November 2026). Owner: "do nothing for now".

## Done

- **24 November 2026**: basic structure counts made clear. The home page bar says what it counts and shows each level's share; on the basic structure page the level buttons and the bar became one card, and both pages count the same 481 provisions (articles in force, the Preamble and the Schedules). The top level is now "Decided by the Supreme Court".
- **24 November 2026**: theme page ending. The four large "More themes" cards gave way to previous and next theme buttons and up to three related themes (chosen by shared provisions) as compact rows, with an "All themes" link.
- **24 November 2026**: the official PDF saved in `src/source/`. Third Schedule Form IV checked against the printed page: the edition misprints "true faith and faith and allegiance"; with the owner's approval we show "true faith and allegiance", and CLAUDE.md records the exception. The 106th Amendment notes confirmed against print.
- **24 November 2026**: smoother animations (home quilt, search, basic structure map, toasts, touch hovers); facts row alignment and shadows.
- **23 to 24 November 2026**: text check added to the tests (`check_text.py`); Schedule and Article 368 summaries re-checked; Preamble removed from the More sheet and given a badge in Contents; About added to the desktop top bar.
- **23 November 2026**: basic structure rulings and features checked against the judgments and cited by S.C.R. and page; glossary writ explanations corrected; amendment one-liners and link lists fixed.
- **23 November 2026**: official text fixes. Seven States restored to the First Schedule; Third Schedule oath forms; about 20 missing or merged official notes; broken entries in the Schedules and six articles; table headings and layout.
