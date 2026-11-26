// Spacing check: walks the main column of each page and prints the vertical gap between every pair of neighbouring blocks
// (and inside each section), on desktop and phone, so uneven or oversized gaps stand out. Site served on :8766.
//   node gaps.js [routes...]
const { chromium, devices } = require('playwright');
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ['#', '#contents', '#part-III', '#art-21', '#art-368', '#sch-TENTH', '#schedules', '#themes', '#theme-rights', '#amendments', '#amend-42', '#next-amendment', '#basic-structure', '#glossary', '#about', '#preamble', '#saved'];
(async () => {
  const b = await chromium.launch();
  for (const [dev, o] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['phone', { ...devices['iPhone 13'] }]]) {
    const p = await (await b.newContext(o)).newPage();
    console.log(`\n===== ${dev}`);
    for (const r of ROUTES) {
      await p.goto('http://localhost:8766/preview.html' + r); await p.waitForTimeout(r === '#' ? 4500 : 2500);
      const rows = await p.evaluate(() => {
        const vis = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return r.height > 1 && s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed'; };
        const name = e => { const c = typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : e.tagName.toLowerCase(); const h = e.querySelector && e.querySelector('h1,h2,h3'); return c + (h && /^(SECTION|DIV|H\d)$/.test(e.tagName) ? ' [' + h.textContent.trim().slice(0, 22) + ']' : ''); };
        const roots = [...document.querySelectorAll('#view article.art, #view > section, #view > div > section, #view .reader > article')].filter(vis);
        const root = roots[0] || document.querySelector('#view');
        const out = [];
        const walk = (C, depth) => {
          const kids = [...C.children].filter(vis);
          for (let i = 0; i < kids.length; i++) {
            const k = kids[i];
            if (i) { const a = kids[i - 1].getBoundingClientRect(), c = k.getBoundingClientRect(); out.push([depth, Math.round(c.top - a.bottom), name(kids[i - 1]), name(k)]); }
            if (depth < 2 && (k.tagName === 'SECTION' || k.classList.contains('col'))) walk(k, depth + 1);
          }
        };
        walk(root, 0);
        return out;
      });
      console.log(`--- ${r}`);
      rows.forEach(([d, g, a, c]) => console.log(`  ${'  '.repeat(d)}${String(g).padStart(4)}px  ${a.slice(0, 46).padEnd(46)} -> ${c.slice(0, 52)}`));
    }
  }
  await b.close();
})();
