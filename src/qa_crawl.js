const { chromium, devices } = require('playwright');
const core = require('./site/core.json');
const text = require('./site/text.json');
const norm = s => s.toUpperCase().replace(/[-\s]/g, '');
const ARTS = new Set(core.arts.map(a => norm(a[0])));
const GL = new Set(text.g.map(([t]) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-')));
const FEAT = new Set(Object.keys(text.bs.feat).concat(['method']));
function valid(h) {
  const x = decodeURIComponent(h.slice(1)); let m;
  if (['', 'contents', 'schedules', 'themes', 'amendments', 'glossary', 'saved', 'about', 'preamble', 'basic-structure', 'next-amendment'].includes(x)) return true;
  if ((m = x.match(/^art-([^.]+)(?:\.(.+))?$/))) return ARTS.has(norm(m[1]));
  if ((m = x.match(/^sch-([A-Z]+)(?:-b(\d+))?$/))) { const s = text.s[m[1]]; return !!s && (!m[2] || +m[2] < s.b.length); }
  if ((m = x.match(/^part-(.+)$/))) return core.parts.some(p => p.n === m[1]);
  if ((m = x.match(/^theme-(.+)$/))) return core.themes.some(t => t.id === m[1]);
  if ((m = x.match(/^amend-(\d+)$/))) return +m[1] >= 1 && +m[1] <= 106;
  if ((m = x.match(/^basic-structure-(.+)$/))) return FEAT.has(m[1]);
  if ((m = x.match(/^g-(.+)$/))) return GL.has(m[1]);
  return false;
}
(async () => {
  const routes = ['', '#contents', '#schedules', '#themes', '#amendments', '#glossary', '#saved', '#about', '#preamble', '#basic-structure', '#basic-structure-method', '#next-amendment'];
  core.arts.forEach(a => routes.push('#art-' + a[0]));
  core.parts.forEach(p => routes.push('#part-' + p.n));
  core.sch.forEach(s => routes.push('#sch-' + s.k));
  core.themes.forEach(t => routes.push('#theme-' + t.id));
  [1, 7, 42, 44, 99, 106].forEach(n => routes.push('#amend-' + n));
  const b = await chromium.launch();
  const envs = [['desktop', { viewport: { width: 1366, height: 860 } }], ['iphone', devices['iPhone 13']], ['android', devices['Pixel 7']], ['small', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }], ['tablet', devices['iPad (gen 7)']]];
  const report = {};
  for (const [name, ctx] of envs) {
    const c = await b.newContext({ ...ctx, colorScheme: name === 'android' ? 'dark' : 'light' });
    const p = await c.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(['pageerror', p.url().split('#')[1], e.message]));
    p.on('console', m => { if (m.type() === 'error') errs.push(['console', p.url().split('#')[1], m.text()]); });
    p.on('requestfailed', r => errs.push(['reqfail', r.url()]));
    await p.goto('http://localhost:8766/preview.html#art-1'); await p.waitForSelector('#text', { timeout: 15000 });
    const over = [], bad = [], hrefs = new Set();
    const list = routes;
    for (const r of list) {
      await p.evaluate(h => { location.hash = h || '#'; }, r); await p.waitForTimeout(25);
      const res = await p.evaluate(() => {
        const v = document.querySelector('#view');
        const txt = v.innerText;
        const o = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        const wide = o ? [...document.querySelectorAll('#view *')].filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 3).map(e => e.tagName + '.' + e.className) : [];
        const hs = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href'));
        return { o, wide, junk: /undefined|NaN|\[object|null\b(?! and void)/.test(txt) ? (txt.match(/.{0,40}(undefined|NaN|\[object|null\b).{0,40}/) || [''])[0] : '', empty: txt.trim().length < 40, hs };
      });
      if (res.o) over.push([r, res.wide]);
      if (res.junk || res.empty) bad.push([r, res.junk, res.empty]);
      res.hs.forEach(h => hrefs.add(h));
    }
    let broken = [];
    if (name === 'desktop') broken = [...hrefs].filter(h => !valid(h));
    report[name] = { routes: list.length, errs: errs.slice(0, 10), nerr: errs.length, over: over.slice(0, 10), nover: over.length, bad: bad.slice(0, 10), broken: broken.slice(0, 20), nhrefs: hrefs.size };
    console.log(name, JSON.stringify(report[name]));
    await c.close();
  }
  await b.close();
})();
