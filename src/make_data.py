import json, re, os, collections
c=json.load(open('data/core.json')); t=json.load(open('data/text.json'))
S=json.load(open('sum/all.json')); H=json.load(open('sum/out/amend.json'))
raw=json.load(open('data/amend_raw.json')); themes=json.load(open('data/themes.json')); gl=json.load(open('data/glossary.json'))
plain=lambda s: re.sub(r'\s+',' ',re.sub(r'\{\d+\}','',s)).strip()
# The Appendices printed with the official edition are not part of the Constitution, and the owner asked for every
# reference to them to go. The official footnotes mention them six times; those phrases are removed here, so the
# source data in data/text.json stays exactly as published.
def _cut(fs, old, new, n):
    hits = sum(f.count(old) for f in fs); assert hits == n, (old, hits)
    return [f.replace(old, new) for f in fs]
A367, A370, F1 = t['a']['367'], t['a']['370'], t['s']['FIRST']
A367['f'] = _cut(A367['f'], ', for the text of this C.O., see Appendix II.', '.', 1)
A370['f'] = _cut(A370['f'], '\u201d. (See Appendix III) (C.O. 273)', '\u201d. (C.O. 273)', 1)
F1['f'] = _cut(F1['f'], ' For the text of the Act, see Appendix I.', '', 3)
# Article 370's third footnote says only "See Appendix II.": drop it and its marker, and renumber the one after it
assert A370['f'][2] == 'See Appendix II.' and A370['h'] == [1, 2]
del A370['f'][2]
for p in A370['p']:
    assert p[1].count('{3}') <= 1
    p[1] = re.sub(r'\{(\d+)\}', lambda m: '' if m.group(1) == '3' else '{%d}' % (int(m.group(1)) - (int(m.group(1)) > 3)), p[1])
assert 'Appendi' not in json.dumps([t['a'], t['s']], ensure_ascii=False)

ORDER=[a[0] for a in c['arts']]; KEY={n.upper().replace('-',''):n for n in ORDER}
RX=re.compile(r'\b(articles?|arts?\.)(\s+)(\d+[A-Z]{0,3}(?:-I)?(?:\s*\([^)]{1,6}\))*(?:(?:,\s*|\s+(?:and|or|to)\s+)(?:article\s+)?\d+[A-Z]{0,3}(?:-I)?(?:\s*\([^)]{1,6}\))*)*)')
refs={}; back=collections.defaultdict(set)
for n in ORDER:
    a=t['a'][n]
    if a.get('st'): continue
    txt=' '.join(p[1] for p in a['p'])
    out=[]
    for m in RX.finditer(txt):
        for num in re.findall(r'\d+[A-Z]{0,3}(?:-I)?', re.sub(r'\([^)]*\)',' ',m.group(3))):
            k=KEY.get(num.upper().replace('-',''))
            if k and k!=n and k not in out: out.append(k)
    refs[n]=out
    for k in out: back[k].add(n)
TA={}
for n in ORDER:
    a=dict(t['a'][n]); s=S.get('art-'+n)
    if s: a['s']=s['s']; a['k']=s['k']
    if refs.get(n): a['r']=refs[n]
    if back.get(n): a['b']=[k for k in ORDER if k in back[n]]
    TA[n]=a
TS={}
for k,v in t['s'].items():
    v=dict(v); s=S.get('sch-'+k)
    if s: v['s']=s['s']; v['k']=s['k']
    TS[k]=v
# core
parts=[]
for P in c['parts']:
    P=dict(P); s=S.get('part-'+P['n']); P['s']=s['s'] if s else ''; P['k']=s['k'] if s else []; parts.append(P)
sch=[dict(x, s=S.get('sch-'+x['k'],{}).get('s','')) for x in c['sch']]
# Footnotes with a misspelt "Constitution" (Constitition / Constitutiton) were missed by the extractor.
for a in raw:
    if a['n']==7 and 'a:342' not in a['refs']:
        a['refs'].insert(a['refs'].index('a:341')+1,'a:342')
# The 23rd Act (1969) changed "twenty years" to "thirty years" in Article 334. Later Acts rewrote those words, so no footnote cites it;
# the 45th Act's footnote records the next step, from "thirty" to "forty".
for a in raw:
    if a['n']==23 and 'a:334' not in a['refs']: a['refs'].append('a:334')
if not any(a['n']==72 for a in raw):
    raw.append({"n":72,"y":1992,"wef":"1992-12-05","refs":["a:332"]})
H.setdefault('72',{"h":"Added clause (3B) to Article 332, fixing how many seats in the Tripura Legislative Assembly are reserved for Scheduled Tribes until the next readjustment.","tags":["reservation","elections"]})
amd=[]
for a in raw:
    h=H[str(a['n'])]
    amd.append({"n":a['n'],"y":a['y'],"wef":a['wef'],"h":h['h'],"tags":h['tags'],"refs":a['refs'],**({"wl":a['wl']} if a.get('wl') else {})})
# Acts this edition no longer cites in any footnote, because what they changed was later replaced or lapsed.
# Only official Government of India / Parliament sources are used; gaps are stated, not filled.
LD="Legislative Department, Ministry of Law and Justice"
amd+=[
 {"wl":"In force","n":2,"y":1952,"wef":"1953-05-01","nc":1,"tags":["elections"],"refs":["a:81"],
  "h":"Struck out the words \u201cnot less than one member for every 750,000 of the population and\u201d from Article 81(1)(b), on how Lok Sabha seats were allotted, so constituencies could be re-adjusted after the census without breaching that limit.",
  "what":"Articles 81 and 82 were later replaced as a whole by the Seventh Amendment Act, 1956 (in force 1 November 1956), so the wording it changed no longer exists. Today's Article 81 is that later version.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/38ef0247f825a631d62ae585a9bf529c.pdf"]]},
 {"wl":"In force","n":8,"y":1959,"wef":"1960-01-05","nc":1,"tags":["reservation","elections"],"refs":["a:334"],
  "h":"Changed \u201cten years\u201d to \u201ctwenty years\u201d in Article 334, the time limit on reserved seats for Scheduled Castes and Scheduled Tribes and on Anglo-Indian nomination.",
  "what":"Later Acts kept extending the limit and rewrote the words it inserted. Article 334 now reads eighty years for reserved seats and seventy years for Anglo-Indian nomination, set by the 104th Amendment (2019).",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/0cf16c3f1479074a87011e066396733e.pdf"]]},
 {"wl":"In force","n":12,"y":1962,"wef":"1961-12-20","nc":1,"tags":["union territories","territory"],"refs":["a:240","s:FIRST"],
  "h":"Added Goa, Daman and Diu as a Union territory in the First Schedule and in Article 240(1), with effect from 20 December 1961, after they were acquired by India.",
  "what":"Goa became a State under the Goa, Daman and Diu Reorganisation Act, 1987, which rewrote the First Schedule entry. Daman and Diu stayed a Union territory until it merged with Dadra and Nagar Haveli in 2020, when entry (d) of Article 240(1) was omitted.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/90f537a2f96e5304e088b723b665d426.pdf"],["Act and objects, National Portal of India","https://www.india.gov.in/my-government/constitution-india/amendments/constitution-india-twelfth-amendment-act-196"]]},
 {"wl":"In force","n":37,"y":1975,"wef":"1975-05-03","nc":1,"tags":["union territories","legislature"],"refs":["a:239A","a:240"],
  "h":"Added Arunachal Pradesh to Article 239A, so the Union territory could have a Legislative Assembly and a Council of Ministers, and limited the President's power under Article 240 to make regulations for it once an Assembly existed.",
  "what":"Arunachal Pradesh became a full State under the State of Arunachal Pradesh Act, 1986 (in force 20 February 1987), so neither article applies to it any more. Article 239A now names only Puducherry, and the official note to Article 240 records Arunachal Pradesh's entry being removed by that Act.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/e758d6fb56d08150e4359287a75266c1.pdf"]]},
 {"wl":"In force","n":48,"y":1984,"wef":"1984-08-26","nc":1,"tags":["president's rule","punjab"],"refs":["a:356"],
  "h":"Let President's Rule in Punjab, proclaimed on 6 October 1983, continue for up to two years instead of one by adding a condition to Article 356(5).",
  "what":"It applied to one Proclamation only and stopped mattering once that Proclamation ended. That condition in Article 356(5) has since been removed and rewritten by later Acts; it now refers to the Punjab Proclamation of 11 May 1987.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/1b65d89d6107c526d5dc2102f3dcf479.pdf"],["National Portal of India","https://www.india.gov.in/my-government/constitution-india/amendments/constitution-india-forty-eighth-amendment-act-1984"]]},
]
amd.sort(key=lambda a:a['n'])
assert [a['n'] for a in amd]==list(range(1,107)), [a['n'] for a in amd]
# facts
words={n:len(re.findall(r"[A-Za-z']+",' '.join(plain(p[1]) for p in TA[n]['p']))) for n in ORDER if not TA[n].get('st')}
longest=max(words,key=words.get); shortest=min(words,key=words.get)
most_notes=max(ORDER,key=lambda n:len(TA[n]['f']))
most_ref=max(ORDER,key=lambda n:len(back.get(n,())))
live=[n for n in ORDER if not TA[n].get('st')]
partcount=max(parts,key=lambda P:sum(1 for ch in P['ch'] for s in ch['s'] for a in s['a'] if a in live))
CIT=[a for a in amd if not a.get('nc')]
big=max(CIT,key=lambda a:len(a['refs']))
newest=None;nd=''
WEF=re.compile(r'Ins\..{0,200}?w\.e\.f\.\s*(\d{1,2})-(\d{1,2})-(\d{4})')
for n in ORDER:
    for i,f in enumerate(TA[n]['f']):
        m=WEF.search(f)
        if m and re.match(r'^(Ins\.|Arts?\.? .*ins)',f) and (i+1) in TA[n].get('h',[]):
            d=f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
            if d>nd: nd=d; newest=n
total_words=sum(words.values())
T={a[0]:a[1] for a in c['arts']}
facts=[
 {"v":f"{total_words:,}","l":"words in the articles in force","x":f"Across {len(live)} articles, not counting Schedules or official notes.","h":"#contents"},
 {"v":f"Article {longest}","l":"is the longest article","x":f"{T[longest].rstrip('.')}: {words[longest]:,} words.","h":"#art-"+longest},
 {"v":f"Article {shortest}","l":"is the shortest","x":f"{T[shortest].rstrip('.')}: just {words[shortest]} words.","h":"#art-"+shortest},
 {"v":f"Article {most_ref}","l":"is cited by the most other articles","x":f"{T[most_ref].rstrip('.')}: referred to in {len(back[most_ref])} articles.","h":"#art-"+most_ref},
 {"v":f"Article {most_notes}","l":"carries the most official notes","x":f"{T[most_notes].rstrip('.')}: {len(TA[most_notes]['f'])} notes.","h":"#art-"+most_notes},
 {"v":f"{len(ORDER)-len(live)}","l":"articles have been omitted","x":"Their numbers are kept, so later articles were never renumbered. New ones get letters, like 21A.","h":"#contents"},
 {"v":f"Part {partcount['n']}","l":"has the most articles","x":f"{partcount['t']}.","h":"#part-"+partcount['n']},
 {"v":f"The {['','First','Second','Third','Fourth','Fifth','Sixth','Seventh'][big['n']] if big['n']<8 else big['n']} Amendment","l":"touched the most provisions","x":f"Cited in the notes to {len(big['refs'])} provisions ({big['y']}).","h":f"#amend-{big['n']}"},
]
if newest: facts.insert(2,{"v":f"Article {newest}","l":"is among the newest additions","x":f"{T[newest].rstrip('.')}: in force from {int(nd[8:])} {['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(nd[5:7])]} {nd[:4]}.","h":"#art-"+newest})
lettered=[n for n in live if re.search(r'[A-Z]',n)]
run243=[n for n in ORDER if n.startswith('243') and n!='243']
def cnt_word(w): return sum(1 for n in live if re.search(r'\b'+w+r'\b',' '.join(plain(p[1]) for p in TA[n]['p'])))
pre_words=len(re.findall(r"[A-Za-z']+",' '.join(plain(p[1]) for p in c['pre']['p'])))
dec=collections.Counter(a['y']//10*10 for a in CIT).most_common(1)[0]
facts+=[
 {"v":f"{pre_words} words","l":"make up the Preamble","x":"From \"We, the people of India\" to \"give to ourselves this Constitution\".","h":"#preamble"},
 {"v":"India, that is Bharat","l":"are the opening words of Article 1","x":"Article 1 names the country and calls it a Union of States.","h":"#art-1"},
 {"v":f"{len(lettered)} articles","l":"carry a letter, like 21A","x":"Each was slotted in later between existing numbers, so nothing had to be renumbered.","h":"#art-21A"},
 {"v":f"Article {run243[0]} to {run243[-1]}","l":"is the longest lettered run","x":f"{len(run243)} articles for Panchayats, Municipalities and co-operative societies all hang off Article 243.","h":"#part-IX"},
 {"v":"22 languages","l":"are listed in the Eighth Schedule","x":"From Assamese to Urdu.","h":"#sch-EIGHTH"},
 {"v":"97 · 66 · 47","l":"entries in the Union, State and Concurrent Lists","x":"The Seventh Schedule numbering for who can make laws on what.","h":"#sch-SEVENTH"},
 {"v":"Entry 284","l":"is the last in the Ninth Schedule","x":"The list of laws protected under Article 31B.","h":"#sch-NINTH"},
 {"v":f"{cnt_word('Parliament')} articles","l":"mention Parliament","x":f"The President appears in {cnt_word('President')}, a Governor in {cnt_word('Governor')}.","h":"#theme-lawmaking"},
 {"v":"3 Parts","l":"have just one article each","x":"Part IVA (Fundamental Duties) and Part XX (Amendment) still in force, plus Part VII, which is omitted.","h":"#part-XX"},
 {"v":f"The {dec[0]}s","l":"saw the most amendment Acts cited here","x":f"{dec[1]} of the Acts in the official notes date from that decade.","h":"#amendments"},
 {"v":f"{len(gl)} terms","l":"are defined by the Constitution itself","x":f"Article 366 alone defines {sum(1 for g in gl if any(a=='366' for a,_ in g[1]))} of them, from \"agricultural income\" onwards.","h":"#glossary"},
 {"v":"Sixth Schedule","l":"carries the most official notes of any Schedule","x":"It governs tribal areas in Assam, Meghalaya, Tripura and Mizoram.","h":"#sch-SIXTH"},
]
# the Appendices printed with the official edition are not part of the Constitution, so they are left out
core=dict(parts=parts,arts=c['arts'],pre=c['pre'],sch=sch,amd=amd,themes=themes,facts=facts,meta=c['meta'])
# forecast of the next amendment (data/next.json); check every article, Schedule and Act it points to exists
NX=json.load(open('data/next.json')); NX.pop('_note',None)
_arts={x[0] for x in c['arts']}; _sch={x['k'] for x in c['sch']}; _amd={a['n'] for a in amd}
for x in NX['cands']+NX['clocks']:
    for r in x.get('arts',[]): assert r in _arts, ('next.json: no article',r)
    for r in x.get('sch',[]): assert r in _sch, ('next.json: no schedule',r)
    for r in x.get('amds',[]): assert r in _amd, ('next.json: no amendment',r)
for _t in NX['times']: assert _t['n'] in _amd and _t['intro']<=_t['passed']<=_t['assent'], _t
# plain explanations of terms used in our own text (data/terms.json); check every source link resolves
TERMS = json.load(open('data/terms.json'))['terms']
for x in TERMS:
    assert '(' not in x['m'].replace('(?:', ''), ('terms.json: use (?:...) groups only', x['id'])
    for l, h in x['src']:
        if h.startswith('#art-'): assert h[5:] in _arts, ('terms.json: no article', h)
        if h.startswith('#sch-'): assert h[5:] in _sch, ('terms.json: no schedule', h)
    if x.get('pending'): print('terms.json: still waiting for an official source:', x['id'])
core['terms'] = [{k: v for k, v in x.items() if k != 'pending'} for x in TERMS]
core['next']={k:NX[k] for k in ('asOn','asOnIso','headline','when')}  # the Amendments page teaser; the full forecast loads with text.json
BS=json.load(open('data/bs.json'))
import collections as _co
_bc=_co.Counter(v[0] for v in list(BS['art'].values())+list(BS['sch'].values()) if v[0]>=0)
core['bsc']=[_bc.get(i,0) for i in range(6)]  # every provision on the basic structure map: articles in force, the Preamble, the Schedules
core['bsn']=[sum(1 for k,v in BS['art'].items() if k!='Preamble' and v[0]>=0), sum(1 for v in BS['sch'].values() if v[0]>=0)]
assert sum(core['bsc'])==core['bsn'][0]+core['bsn'][1]+1, ('basic structure counts', core['bsc'], core['bsn'])
# Words the Supreme Court has declared invalid (data/struck.json): a box and clause labels on each page. Every mark is
# checked here against the text, so a change to text.json that moves a paragraph fails the build instead of labelling the wrong one.
_SK=json.load(open('data/struck.json')); _SS=json.load(open('data/bs_settled.json'))['sources']
core['struck']={}
for it in _SK['items']:
    for pv in it['p']:
        kind,key=pv.split(':')
        paras=[x[1] for x in TA[key]['p']] if kind=='a' else [b.get('h') or b.get('p') or '' for b in TS[key]['b']]
        assert paras or kind=='a' and TA[key].get('st'), ('struck.json: nothing to show for', pv)
        m=it.get('mark',{}).get(pv)
        if m=='all': idx=list(range(len(paras)))
        elif isinstance(m,str) and m.startswith('notes:'):
            ks=[int(k) for k in m[6:].split(',')]
            idx=[i for i,s in enumerate(paras) if any('{%d}'%k in s for k in ks)]
            assert len(idx)>=1, ('struck.json: no paragraph carries notes', pv, ks)
        elif m:
            idx=[]
            for i,pre in m:
                assert paras[i].startswith(pre), ('struck.json: paragraph moved', pv, i, pre, paras[i][:40])
                idx.append(i)
        else: idx=[]
        for k in it['src']: assert k in _SS, ('struck.json: unknown source', k)
        say=it['say'][pv] if isinstance(it['say'],dict) else it['say']
        assert '—' not in say, ('struck.json: em dash', pv)
        assert '\u2014' not in it['why'], ('struck.json: em dash', pv)
        core['struck'].setdefault(pv,[]).append({'y':it['year'],'part':bool(it.get('part')),'tag':it.get('tag',''),'i':idx,'say':say,'why':it['why'],
            'src':[_SS[k].split(', http')[0] + (', ' + it['at'][k] if k in it.get('at',{}) else '') for k in it['src']]})
from hist import parse_all
_seq=[('P',i) for i in range(len(c['pre']['f']))]+[(n,i) for n in ORDER for i in range(len(TA[n]['f']))]
_res=parse_all([c['pre']['f'][i] if n=='P' else TA[n]['f'][i] for n,i in _seq])
_fh={}
for (n,i),x in zip(_seq,_res): _fh.setdefault(n,[]).append([x['a'],x['v'],x['o'],x['d'],x['r'],x['i'],x['n']])
for n in ORDER:
    if n in _fh: TA[n]['fh']=_fh[n]
if 'P' in _fh: core['pre']=dict(c['pre'],fh=_fh['P'])
# Official notes that record several changes in a row ("subs. by the 42nd ... and further subs. by the 44th ...").
# data/hist_chain.json lists each step; it replaces the single row the parser makes for that note. Every Act, earlier
# wording and date must be in the note itself, unless the step carries its own explanation (x), as the 102nd's date does.
from hist import RX_C, ordnum
def _nth(n): return f"{n}{'th' if 10<=n%100<=20 else {1:'st',2:'nd',3:'rd'}.get(n%10,'th')}"
def _dmy(d): y,m,dd=d.split('-'); return f"{int(dd)}-{int(m)}-{y}"
_CH=json.load(open('data/hist_chain.json')); _CH.pop('_about')
for key,steps in _CH.items():
    art,k=key.split(':'); k=int(k); note=TA[art]['f'][k-1]; old=TA[art]['fh'][k-1]
    acts={ordnum(m.group(1)) for m in RX_C.finditer(note)}
    if 'ibid' in note: acts|={ordnum(m.group(1)) for m in RX_C.finditer(TA[art]['f'][k-2])}  # ibid. points back to the note before
    rows=[]
    for i,st in enumerate(steps):
        a=st['a']
        assert (a in acts) if isinstance(a,int) else (a in note), ('hist_chain: Act not in note', key, a)
        for w in ('o','nw'):
            if st.get(w): assert ('“%s”'%st[w] in note or '"%s"'%st[w] in note or '“%s"'%st[w] in note or '"%s”'%st[w] in note), ('hist_chain: words not in note', key, st[w])
        if st.get('d') and not st.get('x'): assert re.search(r'w\.?\s*e\.?\s*f\.?\s*0?%s\b'%re.escape(_dmy(st['d'])).replace('\\-','\\s*-\\s*0?'),note), ('hist_chain: date not in note', key, st['d'])
        if st.get('r'): assert 'retrospective' in note, ('hist_chain: not retrospective', key)
        if st.get('n')==2: assert re.search(r'not (?:notified|enforced)|to be notified',note), ('hist_chain: note does not say never in force', key)
        x=st.get('x','')
        if st['v']=='undo': x=x or f"Cancelled the {_nth(steps[i-1]['a'])} Amendment's change, which never came into force."
        if st.get('n')==2 and not x: x=f"Never brought into force. The {_nth(steps[i+1]['a'])} Amendment cancelled it." if i+1<len(steps) and steps[i+1]['v']=='undo' else "Never brought into force."
        assert '—' not in x
        nw=st.get('nw','') or (steps[i+1].get('o','') if st['v']=='subs' and i+1<len(steps) and steps[i+1]['v']=='subs' else '')
        # the last flag marks an earlier step: the timeline then leaves out today's wording from its place label
        rows.append([a,st['v'],st.get('o',''),st.get('d',''),st.get('r',0),'',st.get('n',0),x,st.get('w',''),nw,1 if i<len(steps)-1 else 0])
    TA[art]['fh'][k-1]=rows
# Changes the official notes leave out, from the Amendment Acts themselves (data/hist_acts.json). Each step's amending
# words must be in the Act's text (source/acts/text), and its date must come from the Act or from an official note.
_MON={m:i+1 for i,m in enumerate('January February March April May June July August September October November December'.split())}
def _nz(t): return re.sub(r'\s+',' ',t.replace('“','"').replace('”','"').replace('‘',"'").replace('’',"'")).strip()
_ACT_T={}
def _act_text(k):
    if k not in _ACT_T: _ACT_T[k]=_nz(open(f'source/acts/text/{k:03d}.txt').read())
    return _ACT_T[k]
def _act_dates(k):
    out=set()
    for dd,mm,yy in re.findall(r'(\d{1,2})(?:st|nd|rd|th)?\s*(?:day of\s*)?(January|February|March|April|May|June|July|August|September|October|November|December),?\s*(\d{4})',_act_text(k)):
        out.add(f"{yy}-{_MON[mm]:02d}-{int(dd):02d}")
    return out
_note_dates=collections.defaultdict(set)
for _n,_x in TA.items():
    for _r in _x.get('fh',[]):
        for _rr in (_r if _r and isinstance(_r[0],list) else [_r]):
            if isinstance(_rr[0],int) and _rr[3]: _note_dates[_rr[0]].add(_rr[3])
_HA=json.load(open('data/hist_acts.json'))
for st in _HA['steps']:
    art,k=st['art'],st['act']; assert art in TA, ('hist_acts: no such article', art)
    t=_act_text(k); q=_nz(st['q'])
    assert q in t, ('hist_acts: amending words not in the Act', k, st['sec'], q[:80])
    for w in ('o','nw'):
        if st.get(w): assert _nz(st[w]) in t, ('hist_acts: words not in the Act', k, st[w])
    d=st.get('d','')
    if d:
        src=st['dsrc']
        if src in ('act','assent'): assert d in _act_dates(k), ('hist_acts: date not in the Act', k, d)
        else: assert src=='note' and d in _note_dates[k], ('hist_acts: no official note gives this date', k, d)
    x=st.get('x',''); assert '—' not in x
    TA[art].setdefault('fa',[]).append([k,st['v'],st.get('o',''),d,st.get('r',0),'',st.get('n',0),x,st.get('w',''),st.get('nw',''),0,st['sec']])
text=dict(a=TA,s=TS,g=gl,bs=BS,next=NX)
os.makedirs('site',exist_ok=True)
json.dump(core,open('site/core.json','w'),ensure_ascii=False,separators=(',',':'))
json.dump(text,open('site/text.json','w'),ensure_ascii=False,separators=(',',':'))
# one small file per Part (its articles, plus the basic structure data an article page shows), so a first visit
# straight to an article can draw it before the full text.json arrives
import glob
os.makedirs('site/t', exist_ok=True)
for f in glob.glob('site/t/*.json'): os.remove(f)
BS_ART = {k: BS[k] for k in ('why', 'feat')}
for P in c['parts']:
    ids = [n for C in P['ch'] for S in C['s'] for n in S['a'] if n in TA]
    if not ids: continue
    bs = dict(BS_ART, art={n: BS['art'][n] for n in ids if n in BS['art']}, note={n: BS['note'][n] for n in ids if n in BS['note']}, sch={}, schnote={})
    json.dump(dict(a={n: TA[n] for n in ids}, bs=bs), open(f"site/t/{P['n']}.json", 'w'), ensure_ascii=False, separators=(',', ':'))
print('core',os.path.getsize('site/core.json'),'text',os.path.getsize('site/text.json'))
for f in facts: print(f)
