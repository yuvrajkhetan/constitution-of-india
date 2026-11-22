import json, re, os, collections
c=json.load(open('data/core.json')); t=json.load(open('data/text.json'))
S=json.load(open('sum/all.json')); H=json.load(open('sum/out/amend.json'))
raw=json.load(open('data/amend_raw.json')); themes=json.load(open('data/themes.json')); gl=json.load(open('data/glossary.json'))
plain=lambda s: re.sub(r'\s+',' ',re.sub(r'\{\d+\}','',s)).strip()
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
    amd.append({"n":a['n'],"y":a['y'],"wef":a['wef'],"h":h['h'],"tags":h['tags'],"refs":a['refs']})
# Acts this edition no longer cites in any footnote, because what they changed was later replaced or lapsed.
# Only official Government of India / Parliament sources are used; gaps are stated, not filled.
LD="Legislative Department, Ministry of Law and Justice"
amd+=[
 {"wl":"In force","n":2,"y":1952,"wef":"1953-05-01","nc":1,"tags":["elections"],"refs":["a:81"],
  "h":"Struck out the words \u201cnot less than one member for every 750,000 of the population and\u201d from Article 81(1)(b), on how Lok Sabha seats were allotted, so constituencies could be re-adjusted after the census without breaching that limit.",
  "what":"Articles 81 and 82 were later replaced as a whole by the Seventh Amendment Act, 1956 (in force 1 November 1956), so the wording it changed no longer exists. Today's Article 81 is that later version.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/38ef0247f825a631d62ae585a9bf529c.pdf"]]},
 {"wl":"Assent","n":8,"y":1959,"wef":"1960-01-05","nc":1,"tags":["reservation","elections"],"refs":["a:334"],
  "h":"Changed \u201cten years\u201d to \u201ctwenty years\u201d in Article 334, the time limit on reserved seats for Scheduled Castes and Scheduled Tribes and on Anglo-Indian nomination.",
  "what":"Later Acts kept extending the limit and rewrote the words it inserted. Article 334 now reads eighty years for reserved seats and seventy years for Anglo-Indian nomination, set by the 104th Amendment (2019).",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/0cf16c3f1479074a87011e066396733e.pdf"]]},
 {"wl":"In force","n":12,"y":1962,"wef":"1961-12-20","nc":1,"tags":["union territories","territory"],"refs":["a:240","s:FIRST"],
  "h":"Added Goa, Daman and Diu as a Union territory in the First Schedule and in Article 240(1), with effect from 20 December 1961, after they were acquired by India.",
  "what":"Goa became a State under the Goa, Daman and Diu Reorganisation Act, 1987, which rewrote the First Schedule entry. Daman and Diu stayed a Union territory until it merged with Dadra and Nagar Haveli in 2020, when entry (d) of Article 240(1) was omitted.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/90f537a2f96e5304e088b723b665d426.pdf"],["Act and objects, National Portal of India","https://www.india.gov.in/my-government/constitution-india/amendments/constitution-india-twelfth-amendment-act-196"]]},
 {"wl":"Assent","n":37,"y":1975,"wef":"1975-05-03","nc":1,"tags":["union territories","legislature"],"refs":["a:239A","a:240"],
  "h":"Added Arunachal Pradesh to Article 239A, so the Union territory could have a Legislative Assembly and a Council of Ministers, and limited the President's power under Article 240 to make regulations for it once an Assembly existed.",
  "what":"Arunachal Pradesh became a full State under the State of Arunachal Pradesh Act, 1986 (in force 20 February 1987), so neither article applies to it any more. Article 239A now names only Puducherry, and this edition's footnote to Article 240 records Arunachal Pradesh's entry being removed by that Act.",
  "src":[["Act text, "+LD,"https://www.legislative.gov.in/static/uploads/2025/07/e758d6fb56d08150e4359287a75266c1.pdf"]]},
 {"wl":"Assent","n":48,"y":1984,"wef":"1984-08-26","nc":1,"tags":["president's rule","punjab"],"refs":["a:356"],
  "h":"Let President's Rule in Punjab, proclaimed on 6 October 1983, continue for up to two years instead of one by adding a proviso to Article 356(5).",
  "what":"It applied to one Proclamation only and stopped mattering once that Proclamation ended. The proviso to Article 356(5) has since been removed and rewritten by later Acts; it now refers to the Punjab Proclamation of 11 May 1987.",
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
 {"v":f"{total_words:,}","l":"words in the articles in force","x":f"Across {len(live)} articles, not counting Schedules or footnotes.","h":"#contents"},
 {"v":f"Article {longest}","l":"is the longest article","x":f"{T[longest].rstrip('.')}: {words[longest]:,} words.","h":"#art-"+longest},
 {"v":f"Article {shortest}","l":"is the shortest","x":f"{T[shortest].rstrip('.')}: just {words[shortest]} words.","h":"#art-"+shortest},
 {"v":f"Article {most_ref}","l":"is cited by the most other articles","x":f"{T[most_ref].rstrip('.')}: referred to in {len(back[most_ref])} articles.","h":"#art-"+most_ref},
 {"v":f"Article {most_notes}","l":"carries the most amendment notes","x":f"{T[most_notes].rstrip('.')}: {len(TA[most_notes]['f'])} notes.","h":"#art-"+most_notes},
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
 {"v":f"The {dec[0]}s","l":"saw the most amendment Acts cited here","x":f"{dec[1]} of the Acts in this edition's footnotes date from that decade.","h":"#amendments"},
 {"v":f"{len(gl)} terms","l":"are defined by the Constitution itself","x":f"Article 366 alone defines {sum(1 for g in gl if any(a=='366' for a,_ in g[1]))} of them, from \"agricultural income\" onwards.","h":"#glossary"},
 {"v":"Sixth Schedule","l":"carries the most amendment notes of any Schedule","x":"It governs tribal areas in Assam, Meghalaya, Tripura and Mizoram.","h":"#sch-SIXTH"},
]
core=dict(parts=parts,arts=c['arts'],pre=c['pre'],sch=sch,apx=c['apx'],amd=amd,themes=themes,facts=facts,meta=c['meta'])
# forecast of the next amendment (data/next.json); check every article, Schedule and Act it points to exists
NX=json.load(open('data/next.json')); NX.pop('_note',None)
_arts={x[0] for x in c['arts']}; _sch={x['k'] for x in c['sch']}; _amd={a['n'] for a in amd}
for x in NX['cands']+NX['clocks']:
    for r in x.get('arts',[]): assert r in _arts, ('next.json: no article',r)
    for r in x.get('sch',[]): assert r in _sch, ('next.json: no schedule',r)
    for r in x.get('amds',[]): assert r in _amd, ('next.json: no amendment',r)
for _t in NX['times']: assert _t['n'] in _amd and _t['intro']<=_t['passed']<=_t['assent'], _t
core['next']={k:NX[k] for k in ('asOn','asOnIso','headline','when')}  # the Amendments page teaser; the full forecast loads with text.json
BS=json.load(open('data/bs.json'))
import collections as _co
_bc=_co.Counter(v[0] for v in BS['art'].values() if v[0]>=0)
core['bsc']=[_bc.get(i,0) for i in range(6)]
from hist import parse_all
_seq=[('P',i) for i in range(len(c['pre']['f']))]+[(n,i) for n in ORDER for i in range(len(TA[n]['f']))]
_res=parse_all([c['pre']['f'][i] if n=='P' else TA[n]['f'][i] for n,i in _seq])
_fh={}
for (n,i),x in zip(_seq,_res): _fh.setdefault(n,[]).append([x['a'],x['v'],x['o'],x['d'],x['r'],x['i'],x['n']])
for n in ORDER:
    if n in _fh: TA[n]['fh']=_fh[n]
if 'P' in _fh: core['pre']=dict(c['pre'],fh=_fh['P'])
text=dict(a=TA,s=TS,x=t['x'],g=gl,bs=BS,next=NX)
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
