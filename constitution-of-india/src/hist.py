"""Structured history from the official footnotes: Act, change type, old words, date."""
import re
U="zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
T={"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90}
ORD={"first":1,"second":2,"third":3,"fourth":4,"fifth":5,"sixth":6,"seventh":7,"eighth":8,"ninth":9,"tenth":10,"eleventh":11,"twelfth":12,"thirteenth":13,"fourteenth":14,"fifteenth":15,"sixteenth":16,"seventeenth":17,"eighteenth":18,"nineteenth":19,"twentieth":20,"thirtieth":30,"fortieth":40,"fiftieth":50,"sixtieth":60,"seventieth":70,"eightieth":80,"ninetieth":90,"hundredth":100}
def ordnum(s):
    s=s.lower().replace('-',' ').replace(' and ',' ')
    n=0
    for w in s.split():
        if w=='one' : n+=1
        elif w=='hundred': n=n*100 if n else 100
        elif w in T: n+=T[w]
        elif w in ORD: n+=ORD[w] if ORD[w]!=100 else (0 if n>=100 else 100)
    return n
RX_C=re.compile(r'Consti\w*\s*\(\s*([A-Za-z\- ]+?)\s+Amendment\)\s*Act,?\s*(\d{4})')
RX_O=re.compile(r'\b(?:by|vide) the ((?:[A-Z][\w\'.,()&-]*\s+)(?:(?:[A-Z(][\w\'.,()&-]*|and|of|the|\w+\))\s+)*?Act,?\s*(\d{4}))')
RX_W=re.compile(r'w\.?\s*e\.?\s*f\.?\s*(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})')
RX_Q=re.compile(r'(?:for|words?[^"“]{0,40}?)\s*["“]([^"”]{1,400})["”]')
def verb(f):
    l=f.lower()
    if 'shall stand' in l: return 'pend'
    if re.search(r'\bre-?(?:numbered|lettered)\b',l): return 'renum'
    if re.search(r'struck down|declared (?:cl|invalid|void)',l) and not re.search(r'\b(ins|subs)\.|omitted|added',l): return 'inv'
    if re.match(r'^see\b|^in exercise|^now\b',l): return 'see'
    m=re.search(r'\b(ins\.|inserted|subs\.|substituted|omitted|added)',l)
    if m: return {'ins.':'ins','inserted':'ins','subs.':'subs','substituted':'subs','omitted':'omit','added':'add'}[m.group(1)]
    if re.match(r'^see\b|^in exercise|^now\b',l): return 'see'
    if re.search(r'\bre-?numbered\b',l): return 'renum'
    if re.search(r'^(the |certain |cl\.|cls\.|sub-?cl|proviso|explanation|clause|paragraph|art\.?|arts\.?)[^.]{0,200}?\bomitted\b',l) or l.startswith('omitted'): return 'omit'
    if l.startswith('subs') : return 'subs'
    if l.startswith('ins') or re.match(r'^arts?\.?\s*[\w, ]+\s+ins\.',l): return 'ins'
    if l.startswith('added'): return 'add'
    if 'ins.' in l[:60] : return 'ins'
    if 'subs.' in l[:60]: return 'subs'
    return 'other'
def parse_all(seq):
    """seq: list of footnote strings in document order. Returns list of dicts."""
    last=None; out=[]
    for f in seq:
        act=None
        m=RX_C.search(f)
        if m: act=ordnum(m.group(1))
        else:
            m2=RX_O.search(f)
            if m2 and 'Constitution' not in m2.group(1): act=re.sub(r'\s*\(\d+ of \d{4}\)','',m2.group(1)).strip()
        if act is None:
            mo=re.search(r'(Constitution \([^)]+\) Order(?:,? No\. [IVX]+)?(?:,\s*\d{4})?)',f) or re.search(r'\b(C\.O\. \d+)',f)
            if mo and re.match(r'^(Added|Subs|Ins|Omitted|Paragraph)',f): act=mo.group(1)
        if act is None and re.search(r'\bibid\b',f): act=last
        if act is not None: last=act
        w=RX_W.search(f)
        d=f"{w.group(3)}-{int(w.group(2)):02d}-{int(w.group(1)):02d}" if w else ''
        v=verb(f)
        old=''
        q=RX_Q.search(f)
        if q and v in ('subs','omit'): old=q.group(1).strip().rstrip(',')
        inv=''
        if re.search(r'struck down|declared (?:cl|invalid|void|unconstitutional)',f,re.I) and 'Supreme Court' in f:
            k=f.find('Supreme Court'); ya=re.findall(r'\b(19[5-9]\d|20[0-2]\d)\b',f[k:]); yb=re.findall(r'\b(19[5-9]\d|20[0-2]\d)\b',f[:k])
            inv=ya[0] if ya else (yb[-1] if yb else '')
        pend=1 if re.search(r'to be notified|not notif|yet to be notified',f,re.I) else 0
        out.append({'a':act,'v':v,'o':old,'d':d,'r':1 if re.search(r'retrospective',f,re.I) else 0,'i':inv,'n':pend})
    return out
