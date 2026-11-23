"""Check the parsed official text (data/text.json, data/core.json) against the edition's own text in source/.

Run from src/:  python3 check_text.py      (test.py runs it first)
Exits 1 if anything new turns up. Known, explained differences live in audit/text_check_known.json with the reason
for each; add to that file only after checking the source by hand.

1. Coverage: every line of the source body (Preamble to the end of the Twelfth Schedule) is in our data.
2. Notes: in every article and Schedule, each official note is marked once in the text ({n}), markers run in order,
   and no note shows signs of two notes run together or an old date left under a new one.
3. Articles: each article's words, compared in order with its own stretch of the source; any source words missing from ours.
"""
import json, re, sys, difflib

T = json.load(open('data/text.json')); C = json.load(open('data/core.json'))
KNOWN = json.load(open('audit/text_check_known.json'))
L = [l.rstrip('\r\n') for l in open('source/Constitution_of_India_10.9.2026.pdf.txt', encoding='utf-8')]
W = lambda s: re.findall(r'[a-z]+', re.sub(r'\{\d+\}', ' ', s).lower())
N = lambda s: ''.join(W(s))
problems = []

start = next(i for i, l in enumerate(L) if l.strip().startswith('WE, THE PEOPLE OF INDIA') and i > 1040)
end = next(i for i, l in enumerate(L) if l.strip() == 'APPENDIX I' and i > 15000)
sch_start = next(i for i, l in enumerate(L) if l.strip() == '[FIRST SCHEDULE' and i > 11000)
furniture = lambda l: l == 'IndiaCode' or re.match(r'^\d+( THE CONSTITUTION OF INDIA)?$', l) or (re.match(r'^\(.*\)$', l) and len(l) < 70 and ('Part' in l or 'Schedule' in l))

# ---------- 1. coverage
parts = [r[0] + ' ' + r[1] for r in C['arts']]
for p in C['parts']:
    parts += [p['t']] + [x for f in p['f'] for x in f]
    for ch in p['ch']: parts += [ch.get('t') or ''] + [s.get('t') or '' for s in ch['s']]
parts += [x for _, x in C['pre']['p']] + C['pre']['f']
for s in C['sch']: parts += [s['t'], s['ref']]
for a in T['a'].values(): parts += [x for _, x in a['p']] + a['f'] + [a.get('st', '')]
for s in T['s'].values(): parts += [b.get('h') or b.get('p') or b.get('ref') or ' '.join(b.get('r', [])) for b in s['b']] + s['f']
big = N(' '.join(parts))
for i in range(start, end):
    l = L[i].strip()
    if furniture(l): continue
    n = N(l)
    if len(n) < 18 or n in big: continue
    if all(len(N(x)) < 10 or N(x) in big for x in re.split(r'—|––', l)): continue
    h = len(n) // 2
    if n[:h] in big and n[h:] in big: continue
    if l in KNOWN['coverage']: continue
    problems.append(f'coverage: source line {i + 1} is not in our data: {l[:100]}')

# ---------- 2. notes
def notes_ok(name, texts, fs, heading=()):
    seq = [int(m) for x in texts for m in re.findall(r'\{(\d+)\}', x)]
    first = []
    for n in seq:
        if n not in first: first.append(n)
    used = set(seq) | set(heading)
    missing = [i for i in range(1, len(fs) + 1) if i not in used]
    if [n for n in used if n < 1 or n > len(fs)]: problems.append(f'notes: {name} has a marker with no note')
    if missing and missing != [1]: problems.append(f'notes: {name} has notes with no marker: {missing}')
    if first != sorted(first): problems.append(f'notes: {name} markers out of order: {first}')
    for k, f in enumerate(fs, 1):
        if re.search(r'\)\.\s+\d+\s+(Ins|Subs|Omitted|Added)\b', f) or re.search(r'date yet.{0,20}\(w\.e\.f\.', f):
            if f'{name}:{k}' not in KNOWN['notes']: problems.append(f'notes: {name} note {k} looks like two notes run together: {f[:90]}')
    for x in texts:
        if re.search(r'[a-z.,;]\d\*\*\*|[a-z.,;]\d\[', x): problems.append(f'notes: {name} has a note number printed as text: {x[:80]}')
for k, a in T['a'].items(): notes_ok('art ' + k, [x for _, x in a['p']], a['f'], a.get('h') or ())
for k, s in T['s'].items(): notes_ok('sch ' + k, [b.get('h') or b.get('p') or b.get('ref') or ' '.join(b.get('r', [])) for b in s['b']], s['f'])

# ---------- 3. articles, word by word
NB = ' ' + ' '.join(' '.join(W(f)) for a in T['a'].values() for f in a['f'] + [a.get('st', '')]) + ' ' + ' '.join(' '.join(W(x[1])) for p in C['parts'] for x in p['f']) + ' '
NOTE = re.compile(r'^(?:\d+\s*\.?\s*|+\s*|\*+\s*)(Ins\.|Subs\.|Sub\.|Omitted|The words|The word|Added|Cl\.|Cls\.|Renumbered|Re-lettered|Certain|Rep\.|Arts?\.? ?\d|Art\.|See |Now |Entry |Entries |Sub-clause|Sub-cl|Paragraph \d|Item|Clause|Proviso|This amendment|The brackets|Brackets|Original|Inserted|Amended|Corrected|S\. \d|In exercise|The first proviso|The proviso)')
body = []
for i in range(start, sch_start):
    l = L[i].strip()
    if furniture(l) or l == '': continue
    w = W(l)
    if NOTE.match(l) and '.—' not in l: continue
    if len(w) >= 4 and ' ' + ' '.join(w) + ' ' in NB and not re.match(r'^[\[\d]*\d+[A-Z]*\. ', l): continue
    body.append((i + 1, l))
title = {r[0]: r[1] for r in C['arts']}
ids, pos, j = [r[0] for r in C['arts']], {}, 0
for a in ids:
    rx = re.compile(r'^[\d\[\]\*]*\s*' + re.escape(a).replace('\\-', '-?').replace('-I', '-?I') + r'\s?\.\s*(\d*\[|[A-Z])')
    j0 = j
    while j < len(body) and not rx.match(body[j][1]): j += 1
    if j >= len(body):
        j = j0
        if a not in KNOWN['no_heading']: problems.append(f'articles: heading of Article {a} not found in the source')
        continue
    pos[a] = j; j += 1
ids = [a for a in ids if a in pos]
heads = set()
for p in C['parts']:
    heads |= set(W('PART ' + p['n'] + ' ' + p['t']))
    for ch in p['ch']:
        heads |= set(W(ch.get('t') or '')) | set(W('CHAPTER ' + (ch.get('n') or '')))
        for s in ch['s']: heads |= set(W(s.get('t') or ''))
skip = {'w', 'e', 'f', 's', 'sch', 'ibid', 'air', 'sc', 'notified', 'effect', 'indiacode'}
for k, a in enumerate(ids):
    lo, hi = pos[a], (pos[ids[k + 1]] if k + 1 < len(ids) else len(body))
    sw = W(' '.join(x for _, x in body[lo:hi]))
    d = T['a'][a]
    dw = W(title[a] + ' ' + ' '.join(x for _, x in d['p']) + ' ' + d.get('st', ''))
    for op, a1, a2, b1, b2 in difflib.SequenceMatcher(None, sw, dw, autojunk=False).get_opcodes():
        miss, extra = sw[a1:a2], dw[b1:b2]
        if op == 'equal' or not miss or ''.join(miss) == ''.join(extra): continue
        if all(len(w) == 1 for w in miss + extra): continue
        mj = ' '.join(miss)
        if ' ' + mj + ' ' in NB or all(w in heads or w in skip or (len(w) <= 2 and a.lower().endswith(w)) for w in miss): continue
        if f'{a}:{mj[:120]}' in KNOWN['articles']: continue
        problems.append(f'articles: Article {a}: source words missing from ours: "{mj[:120]}" (near source line {body[lo][0]})')

if problems:
    print(f'TEXT CHECK FAILED: {len(problems)} problem(s)')
    for p in problems: print('  ' + p)
    sys.exit(1)
print(f'text check ok: {end - start} source lines covered, notes in {len(T["a"]) + len(T["s"])} articles and Schedules, {len(ids)} articles compared word by word')
