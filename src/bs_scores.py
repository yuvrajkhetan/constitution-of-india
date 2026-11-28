"""Layer 2 and 3 of the basic structure feature: features -> articles, and a band for every provision.

Question answered for each provision: could Parliament repeal or substantially change this provision by a constitutional
amendment without breaching a basic feature recognised by the Supreme Court?

Bands: held | vlikely (>90%) | likely (60-90%) | open (40-60%) | unlikely (10-40%) | vunlikely (<10%).
'held' = the Supreme Court has itself ruled this provision's core part of the basic structure (or struck down an amendment to it) on basic structure grounds.
Everything else is our estimate, made with the rubric in METHOD below, and is labelled as such on the site.
"""
import json, re

c = json.load(open('data/core.json')); t = json.load(open('data/text.json'))
S = json.load(open('data/bs_settled.json'))
ORDER = [a[0] for a in c['arts']]
OMIT = {n for n in ORDER if t['a'][n].get('st')}

# ---------- features (layer 2). status: rec = recognised by a majority or later bench; op = named by some judges, not a majority; ls = listed by Lok Sabha Secretariat only
FEAT = {
 'amend':    dict(t='Limited amending power', st='rec', c='Minerva Mills (1980)', s='Parliament can amend any part of the Constitution, but cannot use that power to destroy its identity or make the power unlimited.'),
 'jr':       dict(t='Judicial review', st='rec', c='L. Chandra Kumar (1997); I.R. Coelho (2007)', s='The High Courts and the Supreme Court must be able to test laws and government action against the Constitution.'),
 'indep':    dict(t='Independence of the judiciary', st='rec', c='SC Advocates-on-Record (NJAC, 2015)', s='Judges must be appointed, and do their work, free of control by the executive.'),
 'rol':      dict(t='Rule of law', st='rec', c='P. Sambamurthy (1986); I.R. Coelho (2007); Raj Narain (1975)', s='Government acts under law, and its decisions can be tested by independent courts.'),
 'equality': dict(t='Equality and the core of fundamental rights', st='rec', c='Minerva Mills (1980); I.R. Coelho (2007)', s='The core of Articles 14, 19 and 21, and of each fundamental right, cannot be taken away.'),
 'balance':  dict(t='Balance between Fundamental Rights and Directive Principles', st='rec', c='Minerva Mills (1980)', s='Parts III and IV must be kept in harmony; neither may be made to swallow the other.'),
 'democracy':dict(t='Democracy and republican government', st='rec', c='Kesavananda Bharati (1973, Sikri CJ); S.R. Bommai (1994)', s='Government by elected representatives, with an elected head of state.'),
 'elections':dict(t='Free and fair elections', st='op', c='Indira Gandhi v Raj Narain (1975, Khanna J)', s='Elections must be free and fair, and their results open to lawful challenge.'),
 'secular':  dict(t='Secularism', st='rec', c='Kesavananda Bharati (1973, Sikri CJ); S.R. Bommai (1994); I.R. Coelho (2007); Balram Singh (2024)', s='The State treats all religions equally and has no religion of its own.'),
 'federal':  dict(t='Federalism', st='rec', c='Kesavananda Bharati (1973, Sikri CJ); S.R. Bommai (1994)', s='Power is divided between the Union and the States, and the States are not mere agents of the Centre.'),
 'sop':      dict(t='Separation of powers', st='rec', c='Kesavananda Bharati (1973, Sikri CJ); I.R. Coelho (2007)', s='Legislature, executive and judiciary each keep their own sphere.'),
 'supremacy':dict(t='Supremacy of the Constitution', st='op', c='Kesavananda Bharati (1973, Sikri CJ)', s='Every organ of the State is bound by the Constitution.'),
 'sovereign':dict(t='Sovereignty, unity and integrity', st='op', c='Kesavananda Bharati (1973; Shelat and Grover JJ, Hegde and Mukherjea JJ)', s='India is a sovereign Union; its unity and integrity are part of the framework.'),
 'parl':     dict(t='Parliamentary democracy', st='op', c='Kesavananda Bharati (1973, Jaganmohan Reddy J)', s='Ministers are drawn from and answerable to an elected legislature.'),
 'access':   dict(t='Effective access to justice', st='rec', c='I.R. Coelho (2007)', s='People must be able to reach a court to enforce their rights. The right to go to the Supreme Court under Article 32 is itself part of the basic structure.'),
}

# ---------- notes on clauses struck down (from layer 1)
NOTE = {
 '200': 'In an advisory opinion of 20 November 2025 (Special Reference No. 1 of 2025, under Article 143; 2025 INSC 1333, para 165), the Supreme Court said a Governor has three options on a Bill: assent, reserve it for the President, or withhold assent and return it with comments (not for a Money Bill). Courts cannot review that choice or set deadlines, but where inaction is prolonged, unexplained and indefinite a court can order the Governor to decide within a reasonable time. There is no "deemed assent".',
 '201': 'In an advisory opinion of 20 November 2025 (Special Reference No. 1 of 2025, under Article 143; 2025 INSC 1333, para 165), the Supreme Court said the President\'s decision under this article cannot be reviewed by courts, and courts cannot set deadlines for it. The President need not ask the Court for its opinion every time a Governor reserves a Bill.',
 '300A': 'Kesavananda Bharati (Khanna J) held that the right to property is not part of the basic structure.',
 '356': 'S.R. Bommai (1994) held that a Proclamation under this article is open to judicial review.',
 '370': 'In re Article 370 (2023) upheld the 2019 decision that it no longer applies, and called it a temporary provision.',
 '31B': 'I.R. Coelho (2007): laws added to the Ninth Schedule on or after 24 April 1973 get no blanket protection and are tested against the basic structure.',
 '21A': 'Pramati (2014) held that inserting this article did not alter the basic structure.',
 '15': 'Coelho (2007) named Article 15 as one of the fundamental rights that form part of the basic structure. Clauses (5) and (6) were upheld in Pramati (2014) and Janhit Abhiyan (2022).',
 '16': 'Clause (6), the EWS quota, was upheld 3:2 in Janhit Abhiyan (2022).',
}
SCH_NOTE = {
 'NINTH': NOTE['31B'],
 'SEVENTH': 'The three Lists are entrenched: changing them needs ratification by half the States under Article 368(2).',
 'FOURTH': 'Representation of the States in Parliament is entrenched: changing it needs ratification by half the States under Article 368(2).',
}
ENTRENCHED = {'54', '55', '73', '162', '241', '279A', '368'} | {a for a in ORDER if re.fullmatch(r'(12[4-9][A-C]?|13\d[A]?|14[0-7][A]?)', a)} | {a for a in ORDER if re.fullmatch(r'(21[4-9]|22\d[A]?|23[01])', a)} | {a for a in ORDER if re.fullmatch(r'(24[5-9]|25[0-5])', a)}

# ---------- bands. Each entry: articles, band, reason, features
R = []
def r(arts, band, why, feats, cases=''):
    R.append(dict(a=arts.split(), b=band, w=why, f=feats.split(), cs=cases))

# HELD: the Court has itself ruled the core of these provisions part of the basic structure
r('14 19 21', 'held', 'Minerva Mills (1980) held that setting aside Articles 14 and 19 for a whole class of laws destroys the basic structure; Coelho (2007) treats the core of Articles 14, 19 and 21 as the test for Ninth Schedule laws.', 'equality balance rol')
r('32', 'held', 'Coelho (2007) called Article 32 "an important and integral part of the basic structure", and L. Chandra Kumar (1997) held that judicial review under it cannot be ousted.', 'jr access')
r('226 227', 'held', 'L. Chandra Kumar (1997) held that the High Courts\' power of judicial review under Article 226, and their superintendence under Article 227, are part of the inviolable basic structure.', 'jr access')
r('368', 'held', 'Minerva Mills (1980) held that a limited amending power is itself a basic feature, so Parliament cannot amend this article to make its power unlimited.', 'amend supremacy')
r('124 217', 'held', 'The NJAC case (2015) struck down the Ninety-ninth Amendment\'s new method of appointing judges as a breach of judicial independence, so the core of how judges are appointed is part of the basic structure.', 'indep sop')
# VERY LIKELY
r('1', 'vlikely', 'Names India as a Union of States. Abolishing the Union or the States would undo federalism and India\'s sovereignty, both part of the framework.', 'federal sovereign')
r('13', 'vlikely', 'This is the hook for testing laws against fundamental rights. Courts have said the power to test legislation "can never be ousted".', 'jr equality')
r('15 17', 'vlikely', 'Core guarantees against discrimination and untouchability. Coelho (2007) named Article 15 among the rights forming part of the basic structure.', 'equality')
r('25', 'vlikely', 'Freedom of religion is the main textual home of secularism, which the Court has repeatedly called a basic feature.', 'secular equality')
r('214', 'vlikely', 'Judicial review by the High Courts, held to be basic, depends on the High Courts existing.', 'jr indep')
r('326', 'vlikely', 'Adult suffrage is the foundation of democracy and free and fair elections.', 'democracy elections')
r('Preamble', 'vlikely', 'Kesavananda Bharati (Khanna J) held that, apart from the part that relates to the basic structure, the Preamble does not limit the power to amend. Balram Singh (2024) rejected a challenge to adding "socialist" and "secular" in 1976.', 'democracy secular sovereign equality')
# LIKELY
r('12', 'likely', 'Defines "the State" against which fundamental rights are enforced; gutting it would hollow out the rights.', 'equality jr')
r('16', 'likely', 'Equality of opportunity in public employment is part of the equality code, though clauses on reservation have been changed and upheld.', 'equality')
r('20 22', 'likely', 'Basic protections of personal liberty and fair criminal process, closely tied to Article 21.', 'equality rol')
r('23 24', 'likely', 'Bans on forced labour and child labour in hazardous work relate to human dignity; no case has tested their repeal.', 'equality')
r('26 27 28', 'likely', 'Religious freedom of groups and the bar on State religious instruction carry secularism into practice.', 'secular')
r('29 30', 'likely', 'Minority rights to culture and to run educational institutions support pluralism and secularism.', 'secular equality')
r('50', 'likely', 'The Directive to separate the judiciary from the executive expresses separation of powers and judicial independence.', 'sop indep')
r('52 53', 'likely', 'An elected President as head of state is part of the republican form of government.', 'democracy')
r('54 55', 'likely', 'How the President is elected. Entrenched: changing it needs ratification by half the States.', 'democracy federal')
r('73', 'likely', 'Extent of Union executive power, one half of the federal balance. Entrenched under Article 368(2).', 'federal')
r('74 75', 'likely', 'Ministers advise the President and answer collectively to the Lok Sabha: the core of parliamentary government.', 'parl democracy')
r('79 80 81', 'likely', 'An elected Parliament, with the States represented in it. Representation of the States is entrenched.', 'democracy federal')
r('83', 'likely', 'Fixed terms for the Houses guarantee periodic elections.', 'democracy elections')
r('121', 'likely', 'Parliament cannot discuss a judge\'s conduct except on a motion for removal, a rule tied to judicial independence.', 'indep sop')
r('125 221', 'likely', 'Judges\' salaries cannot be cut to their disadvantage while in office, a guard on judicial independence.', 'indep')
r('129 215', 'likely', 'Courts of record with power to punish contempt, part of the courts\' ability to make their orders effective.', 'jr indep')
r('131', 'likely', 'The Supreme Court settles disputes between the Union and the States, a federal safeguard.', 'federal jr')
r('136', 'likely', 'Special leave to appeal lets the Supreme Court correct any court or tribunal, central to access to justice.', 'jr access')
r('153 154', 'likely', 'Each State has its own executive, part of the federal structure.', 'federal')
r('162', 'likely', 'Extent of State executive power. Entrenched under Article 368(2).', 'federal')
r('163 164', 'likely', 'State ministers advise the Governor and answer to the Assembly: parliamentary government at State level.', 'parl federal democracy')
r('168 170 172', 'likely', 'An elected State Legislature with fixed terms, needed for both democracy and federalism.', 'democracy federal elections')
r('222', 'likely', 'Transfers of High Court judges. The NJAC case struck down the 2014 change to this article as part of the same scheme.', 'indep')
r('235', 'likely', 'High Court control over the subordinate courts keeps the district judiciary independent of the executive.', 'indep sop')
r('245 246', 'likely', 'The division of law-making power between Parliament and the States. Entrenched under Article 368(2).', 'federal')
r('265', 'likely', 'No tax without the authority of law, a basic rule-of-law guarantee.', 'rol')
r('324', 'likely', 'An independent Election Commission conducts elections; without it free and fair elections would be at risk.', 'elections democracy')
r('325', 'likely', 'A single electoral roll with no exclusion on grounds of religion, race, caste or sex.', 'elections equality secular')
# OPEN
r('21A', 'open', 'The right to education. Its insertion was upheld, but no case says whether removing it would breach the basic structure.', 'equality balance')
r('38 39', 'open', 'The welfare-state directives most closely tied to the balance between Parts III and IV. Removing them might upset that balance; untested.', 'balance')
r('122 212', 'open', 'Courts cannot question the validity of legislative proceedings on grounds of procedure. Touches both separation of powers and judicial review.', 'sop jr')
r('141 142', 'open', 'Binding precedent and the power to do complete justice. Important to the Court\'s role, but not tested as basic.', 'jr')
r('148 149', 'open', 'An independent auditor of public accounts supports the rule of law and accountability; untested.', 'rol sop')
r('228 216', 'open', 'Organisational rules for the High Courts. Some core is needed for judicial review, but the details can change.', 'jr indep')
r('356', 'open', 'President\'s Rule. Its use is reviewable (Bommai), and abuse can damage federalism and democracy, but the article itself is not part of the basic structure.', 'federal democracy jr')
r('359', 'open', 'Suspension of rights during emergency. Since 1978, Articles 20 and 21 cannot be suspended; widening this power again could touch the core of rights.', 'equality rol')
# UNLIKELY (no recognised feature depends on the provision itself)
r('2 3 4', 'unlikely', 'Parliament already changes State boundaries by ordinary law; the federal structure survives individual changes.', 'federal')
r('5 6 7 8 9 10 11', 'vunlikely', 'Citizenship rules. Parliament already controls citizenship by law under Article 11.', '')
r('31A 31B 31C', 'vunlikely', 'These shield certain laws from fundamental rights challenges. Removing them would restore rights, not damage the structure.', 'equality')
r('33 34 35', 'vunlikely', 'Powers to adapt or restrict rights for armed forces and martial law; administrative in nature.', '')
r('36 37 40 41 42 43 43A 43B 44 45 46 47 48 48A 49 51', 'unlikely', 'Individual Directive Principles. The balance between Parts III and IV is basic, but no single directive has been held essential.', 'balance')
r('51A', 'vunlikely', 'Fundamental duties were added in 1976 and are not enforceable in court.', '')
r('56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 77 78 76', 'vunlikely', 'Detailed rules on the President, Vice-President and conduct of business. Can change without touching a basic feature.', 'democracy')
r('82 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100 101 102 103 104 105', 'vunlikely', 'Detailed rules on Parliament\'s membership, officers and procedure.', 'democracy')
r('107 108 109 110 111 112 113 114 115 116 117 123', 'unlikely', 'Legislative and financial procedure, and ordinances. Can be redesigned without damaging democracy itself.', 'democracy sop')
r('126 127 128 130 132 133 134 134A 135 137 138 139 139A 140 143 144 145 146 147', 'unlikely', 'Organisation and jurisdiction of the Supreme Court beyond its core review power. Many have been amended before.', 'jr')
r('150 151', 'vunlikely', 'Form and reporting of public accounts.', '')
r('152 155 156 157 158 159 160 161 165 166 167', 'vunlikely', 'Detailed rules on Governors and State executive business.', 'federal')
r('169 171 173 174 175 176 177 178 179 180 181 182 183 184 185 186 187 188 189 190 191 192 193 194 195', 'vunlikely', 'Detailed rules on State Legislatures, their officers and members.', 'democracy federal')
r('196 197 198 199 200 201 202 203 204 205 206 207 208 209 210 211 213', 'vunlikely', 'State legislative and financial procedure, assent to Bills and ordinances.', 'federal')
r('218 219 220 223 224 224A 225 229 230 231', 'unlikely', 'Detailed rules on High Court judges and jurisdiction beyond the core review power.', 'indep')
r('233 233A 234 236 237', 'unlikely', 'Appointment and rules for district judges and subordinate courts.', 'indep')
r('239 239A 239AA 239AB 239B 240 241', 'vunlikely', 'How Union territories are governed. Parliament has changed this often.', 'federal')
r('243 243A 243B 243C 243D 243E 243F 243G 243H 243-I 243J 243K 243L 243M 243N 243O', 'unlikely', 'Panchayats, added in 1992. Local democracy, but not part of the original framework or any holding.', 'democracy')
r('243P 243Q 243R 243S 243T 243U 243V 243W 243X 243Y 243Z 243ZA 243ZB 243ZC 243ZD 243ZE 243ZF 243ZG', 'unlikely', 'Municipalities, added in 1992.', 'democracy')
r('244 244A', 'vunlikely', 'Administration of Scheduled and Tribal Areas.', '')
r('247 248 249 250 251 252 253 254 255', 'unlikely', 'Specific rules within the division of legislative power. Entrenched where in Chapter I of Part XI, but individually changeable.', 'federal')
r('256 257 258 258A 260 261 262 263', 'unlikely', 'Administrative relations between the Union and the States.', 'federal')
r('266 267 268 269 269A 270 271 273 274 275 276 277 279 279A 280 281', 'vunlikely', 'Distribution of revenues and the Finance Commission. Revised many times, including by GST in 2016.', 'federal')
r('282 283 284 285 286 287 288 289 290 290A 292 293 294 295 296 297 298 299 300', 'vunlikely', 'Borrowing, property, contracts and suits.', '')
r('301 302 303 304 305 307', 'unlikely', 'Freedom of trade within India and its exceptions.', 'sovereign')
r('308 309 310 311 312 312A 313 315 316 317 318 319 320 321 322 323', 'vunlikely', 'Civil services and Public Service Commissions.', 'rol')
r('323A 323B', 'unlikely', 'Tribunals may exist; what is part of the basic structure is the High Courts\' and Supreme Court\'s review over them, not these articles.', 'jr')
r('327 328 329', 'unlikely', 'Election law-making and the bar on courts during elections.', 'elections')
r('330 330A 331 332 332A 333 334 334A 335 336 337 338 338A 338B 339 340 341 342 342A', 'unlikely', 'Reservations in legislatures and services, commissions and lists. Many have sunset clauses or have been amended; upheld when changed.', 'equality')
r('350A 350B 351', 'unlikely', 'Linguistic minority protections and the Hindi directive.', '')
r('352 353 354 355 357 358 360', 'unlikely', 'Emergency powers. The articles themselves are not part of the basic structure.', 'federal')
r('361 361A 361B 363 363A 364 365', 'unlikely', 'Immunities and miscellaneous provisions.', 'rol')
r('372 372A 373 374 375 376 377 378 378A 392', 'vunlikely', 'Transitional provisions continuing earlier laws, courts and officers.', '')
r('300A', 'vunlikely', 'The right to property. Kesavananda Bharati (Khanna J) held it is not part of the basic structure.', '')
r('369 370 371 371A 371B 371C 371D 371E 371F 371G 371H 371-I 371J', 'vunlikely', 'Temporary and special provisions for particular States. Several have been changed or ended, and the changes upheld.', 'federal')
r('343 344 345 346 347 348 349 350', 'vunlikely', 'Official language rules.', '')
r('18', 'unlikely', 'Abolition of titles. An equality measure, but minor; no case suggests it is essential.', 'equality')
r('39A', 'open', 'Equal justice and free legal aid, the directive most closely tied to effective access to justice.', 'access equality balance')
r('246A', 'unlikely', 'Concurrent power over GST, added in 2016. A specific fiscal arrangement within federalism.', 'federal')
r('264', 'vunlikely', 'Interpretation clause for the Part on finance.', '')
r('243ZH 243Z-I 243ZJ 243ZK 243ZL 243ZM 243ZN 243ZO 243ZP 243ZQ 243ZR 243ZS 243ZT', 'vunlikely', 'Co-operative societies, added in 2011. Detailed regulatory rules.', '')
r('106 118 119 120 120A', 'vunlikely', 'Salaries of members and rules of procedure and language in Parliament.', '')
r('366 367 393 394 394A 395', 'vunlikely', 'Definitions, interpretation, short title, commencement, the Hindi text and repeals.', '')

BANDS = ['held', 'vlikely', 'likely', 'open', 'unlikely', 'vunlikely']
out = {}
for e in R:
    if not e['w']: continue
    for a in e['a']:
        if a != 'Preamble' and a not in ORDER: continue
        out[a] = [BANDS.index(e['b']), len(set(x['w'] for x in R[:R.index(e)] if x['w'])) ]
# reason table
WHY = []
for e in R:
    if e['w'] and e['w'] not in [w for w, _ in WHY]: WHY.append((e['w'], e['f']))
wi = {w: i for i, (w, _) in enumerate(WHY)}
art = {}
for e in R:
    if not e['w']: continue
    for a in e['a']:
        if a != 'Preamble' and a not in ORDER: continue
        art[a] = [BANDS.index(e['b']), wi[e['w']]]
missing = [a for a in ORDER if a not in art and a not in OMIT]
SCH_BAND = {'FIRST': ('unlikely', 'Lists the States and Union territories. Parliament changes it by ordinary law under Articles 3 and 4.', 'federal'),
 'SECOND': ('vunlikely', 'Salaries and allowances of constitutional office-holders.', ''),
 'THIRD': ('unlikely', 'Forms of oaths, including the oath to uphold the Constitution.', 'supremacy'),
 'FOURTH': ('unlikely', 'Allocation of Rajya Sabha seats. Entrenched, but the numbers change by amendment.', 'federal'),
 'FIFTH': ('unlikely', 'Administration of Scheduled Areas.', ''),
 'SIXTH': ('unlikely', 'Autonomous districts in the North-East; amended many times.', 'federal'),
 'SEVENTH': ('likely', 'The Union, State and Concurrent Lists as a scheme are the core of federalism. Individual entries are changed often.', 'federal'),
 'EIGHTH': ('vunlikely', 'Languages recognised in the Constitution.', ''),
 'NINTH': ('unlikely', 'Laws shielded from fundamental rights challenges. Removing the shield would not damage the structure.', 'equality'),
 'TENTH': ('unlikely', 'The anti-defection law, upheld in Kihoto Hollohan. Repealing it would not breach a basic feature.', 'democracy'),
 'ELEVENTH': ('vunlikely', 'Matters for Panchayats.', ''),
 'TWELFTH': ('vunlikely', 'Matters for Municipalities.', '')}
for k, (b, w, f) in SCH_BAND.items():
    if w not in wi: wi[w] = len(WHY); WHY.append((w, f.split()))
sch = {k: [BANDS.index(b), wi[w]] for k, (b, w, f) in SCH_BAND.items()}
for k, v in S['features'].items(): FEAT[k].update(src=v['src'], at=v['at'])
for k, v in S['features'].items():
    if v.get('q'): FEAT[k]['q'] = v['q']   # what the Court said, verbatim from the printed S.C.R. page
# amendments struck down for breaching a feature: only where the majority's own reasoning names it (bs_settled.json "feat")
for s in S['struck_bs']:
    for k in s.get('feat', []): FEAT[k].setdefault('sb', []).append({'what': s['what'], 'case': s['case']})
assert all('src' in f for f in FEAT.values()), [k for k, f in FEAT.items() if 'src' not in f]
# reading order for the basic features: the kind of State, how power is divided, people's rights, the courts that protect them,
# and last the limit on amendment that guards them all; within each status group (the page groups by status)
FEAT_ORDER = ['democracy', 'secular', 'federal', 'sop', 'rol', 'equality', 'balance', 'jr', 'indep', 'access', 'amend',
              'sovereign', 'parl', 'elections', 'supremacy']
assert sorted(FEAT_ORDER) == sorted(FEAT), set(FEAT) ^ set(FEAT_ORDER)
FEAT = {k: FEAT[k] for k in FEAT_ORDER}
data = dict(feat=FEAT, why=[[w, f] for w, f in WHY], art=art, sch=sch, note=NOTE, schnote=SCH_NOTE, settled=S)
json.dump(data, open('data/bs.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import collections
print('missing (not omitted):', missing)
print(collections.Counter(BANDS[v[0]] for v in art.values()), len(art))
print('size', len(json.dumps(data, ensure_ascii=False, separators=(',', ':'))))
