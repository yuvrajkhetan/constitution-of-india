// Search test: types each query in audit/search_queries.json into the real search box (preview.html on :8766) and scores
// the rank of the first correct result in the list the reader sees. Run from src/ with the site served (bash serve.sh).
//   node search_eval.js [out.json] [compare-with.json]
// Prints Hit@1, Hit@3, Hit@10, MRR and "no results", overall and per group; with a second file, lists queries that moved.
const { chromium } = require('playwright');
const fs = require('fs');
const Q = JSON.parse(fs.readFileSync(process.env.SET || 'audit/search_queries.json', 'utf8'));
const [OUT, BASE] = process.argv.slice(2);
const tok = h => {
  let m;
  if ((m = h.match(/^#art-([^.]+)/))) return 'a:' + m[1];
  if ((m = h.match(/^#part-(.+)$/))) return 'p:' + m[1];
  if ((m = h.match(/^#sch-([A-Z]+)/))) return 's:' + m[1];
  if ((m = h.match(/^#theme-(.+)$/))) return 't:' + m[1];
  if ((m = h.match(/^#amend-(\d+)$/))) return 'm:' + m[1];
  if (h === '#preamble') return 'pre';
  if (h.startsWith('#basic-structure')) return 'bs';
  if (h === '#next-amendment') return 'next';
  if ((m = h.match(/^#g-(.+)$/))) return 'g:' + m[1];
  return h;
};
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto('http://localhost:8766/preview.html#'); await p.waitForTimeout(2500);
  await p.click('.sbtn');
  await p.waitForFunction(() => { const f = document.querySelector('#sfoot') || document.body; return !/Loading the full text/.test(f.textContent); }, null, { timeout: 30000 });
  const rows = [];
  for (const G of Q.groups) for (const it of G.q) {
    await p.fill('#sq', ''); await p.fill('#sq', it.q); await p.waitForTimeout(160);
    const hrefs = await p.$$eval('#sres a.res', els => els.map(e => e.getAttribute('href')));
    const toks = hrefs.map(tok);
    const rank = toks.findIndex(t => it.ok.includes(t)) + 1;   // 0 = not found
    rows.push({ g: G.g, q: it.q, rank, n: hrefs.length, top: toks.slice(0, 3) });
  }
  await b.close();
  const stat = R => { const n = R.length, h = k => R.filter(r => r.rank && r.rank <= k).length;
    return { n, hit1: h(1), hit3: h(3), hit10: h(10), mrr: +(R.reduce((s, r) => s + (r.rank && r.rank <= 10 ? 1 / r.rank : 0), 0) / n).toFixed(3), none: R.filter(r => !r.n).length }; };
  const pc = (a, n) => String(Math.round(100 * a / n)).padStart(3) + '%';
  const line = (name, s) => `${name.padEnd(26)} ${String(s.n).padStart(3)}  top1 ${pc(s.hit1, s.n)}  top3 ${pc(s.hit3, s.n)}  top10 ${pc(s.hit10, s.n)}  MRR ${s.mrr.toFixed(2)}  no results ${s.none}`;
  const all = stat(rows);
  console.log(line('All queries', all));
  for (const G of Q.groups) console.log(line('  ' + G.g, stat(rows.filter(r => r.g === G.g))));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ summary: all, rows }, null, 1));
  if (BASE) {
    const B = Object.fromEntries(JSON.parse(fs.readFileSync(BASE, 'utf8')).rows.map(r => [r.q, r]));
    const lab = r => r ? (r.rank ? '#' + r.rank : (r.n ? 'missed' : 'none')) : '?';
    const better = [], worse = [];
    rows.forEach(r => { const o = B[r.q]; if (!o) return; const a = o.rank || 99, c = r.rank || 99; if (c < a) better.push(r); else if (c > a) worse.push(r); });
    console.log(`\nBetter: ${better.length}   Worse: ${worse.length}`);
    worse.forEach(r => console.log(`  WORSE  ${r.q.padEnd(48)} ${lab(B[r.q])} -> ${lab(r)}   now top: ${r.top.join(' ')}`));
  }
  const miss = rows.filter(r => !r.rank || r.rank > 3);
  console.log(`\nNot in the top 3 (${miss.length}):`);
  miss.forEach(r => console.log(`  ${r.q.padEnd(48)} ${r.rank ? '#' + r.rank : (r.n ? 'missed' : 'NO RESULTS')}   top: ${r.top.join(' ')}`));
})();
