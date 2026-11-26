// Checks that highlightable rows inside rounded cards sit flush with the card's top and bottom edges, so a row's hover or
// tap highlight fills the card's rounded corners instead of showing as a rectangle with a strip above or below it.
//   node rows_flush.js            (site served on :8766)
const { chromium } = require('playwright');
const ROUTES = ['#', '#contents', '#part-III', '#schedules', '#themes', '#theme-rights', '#basic-structure', '#glossary', '#saved', '#amendments', '#art-21'];
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  let bad = 0;
  await p.goto('http://localhost:8766/preview.html#art-21'); await p.waitForTimeout(2500);   // leaves something in "Recently read" and Saved
  for (const r of ROUTES) {
    await p.goto('http://localhost:8766/preview.html' + r); await p.waitForTimeout(r === '#' ? 4000 : 2500);
    const res = await p.evaluate(() => {
      const out = [];
      const ROWS = 'a.row, .bfr > summary, details.pt-g > summary, .mrow, a.trow';
      const cards = new Set([...document.querySelectorAll(ROWS)].map(e => e.parentElement.closest('.card, .group')).filter(Boolean));
      cards.forEach(c => {
        const rad = parseFloat(getComputedStyle(c).borderTopLeftRadius); if (!rad) return;
        const rows = [...c.querySelectorAll(ROWS)].filter(e => e.getBoundingClientRect().height > 0);
        if (!rows.length) return;
        const cr = c.getBoundingClientRect(), first = rows[0].getBoundingClientRect(), last = rows[rows.length - 1].getBoundingClientRect();
        const top = Math.round(first.top - cr.top), bot = Math.round(cr.bottom - last.bottom);
        const clips = getComputedStyle(c).overflow === 'hidden';
        if (top > 1 || bot > 1 || !clips) out.push(`${c.className.slice(0, 30)}: top gap ${top}px, bottom gap ${bot}px, clips corners ${clips}`);
      });
      return out;
    });
    res.forEach(x => { bad++; console.log(r.padEnd(18), x); });
  }
  console.log(bad ? `${bad} card(s) where rows are not flush` : 'all row cards flush');
  await b.close();
})();
