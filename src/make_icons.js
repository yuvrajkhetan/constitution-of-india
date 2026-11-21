// Makes the favicon set and the share image from the built page.
// Run after build_site.py, then run build_site.py again so the files reach the repo root:
//   python3 make_data.py && python3 build_site.py && node make_icons.js && python3 build_site.py
// Outputs to site/: favicon.svg, favicon.ico (16, 32, 48), apple-touch-icon.png (180), og.png (1200x630).
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const here = __dirname, out = path.join(here, "site");
const page = "file://" + path.join(out, "preview.html");

/* an .ico that wraps PNG images (supported by every browser in use) */
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach(([s, buf], i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(s >= 256 ? 0 : s, e); head.writeUInt8(s >= 256 ? 0 : s, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += buf.length;
  });
  return Buffer.concat([head, ...pngs.map(p => p[1])]);
}

(async () => {
  const b = await chromium.launch();

  /* favicon: the hand-drawn small mark */
  const fav = fs.readFileSync(path.join(here, "tpl/favicon.svg"), "utf8");
  fs.writeFileSync(path.join(out, "favicon.svg"), fav);
  const ip = await b.newPage({ deviceScaleFactor: 1 });
  const shot = async (svg, s) => {
    await ip.setViewportSize({ width: s, height: s });
    await ip.setContent(`<style>*{margin:0}body{background:transparent}img{display:block}</style><img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="${s}" height="${s}">`);
    await ip.waitForFunction(() => document.images[0].complete);
    return ip.screenshot({ omitBackground: true });
  };
  const pngs = [];
  for (const s of [16, 32, 48]) pngs.push([s, await shot(fav, s)]);
  fs.writeFileSync(path.join(out, "favicon.ico"), ico(pngs));

  /* the page in light mode with motion off, so the quilt is drawn at once */
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });
  await p.goto(page); await p.waitForSelector(".hero .mark svg");
  await p.evaluate(() => document.fonts.ready);

  /* home-screen icon: the full site mark, square and edge to edge (iOS rounds the corners) */
  const mark = await p.evaluate(() => {
    const m = document.querySelector(".hero .mark svg").cloneNode(true);
    m.querySelectorAll(".qb-p").forEach(g => { g.removeAttribute("class"); g.removeAttribute("style"); });
    m.lastElementChild.remove(); /* the outline drawn for the rounded page version */
    m.removeAttribute("class"); m.removeAttribute("aria-hidden");
    m.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    m.insertAdjacentHTML("afterbegin", "<defs>" + document.querySelector("#chakra").outerHTML + "</defs>");
    return m.outerHTML;
  });
  fs.writeFileSync(path.join(out, "apple-touch-icon.png"), await shot(mark, 180));

  /* share image: the home hero, cut down to the mark, the title and one line */
  await p.addStyleTag({ content: `
    .tri,.bar,.tabs,.qstrip,.foot,.spot,.hero .pills,.hero~*{display:none!important}
    body{padding:0!important}
    .hero{height:630px!important;display:grid!important;place-items:center}
    .hero-in{padding:0!important}
    #heroquilt{opacity:.5!important}
    .hero .mark{width:120px!important;margin-bottom:26px!important}
    .hero h1{font-size:86px!important}
    .hero .lede{font-size:31px!important;max-width:none!important;margin-top:18px!important;color:var(--label-2)!important}
    .hero .asof{font-size:20px!important;margin-top:24px!important;color:var(--label-2)!important}` });
  await p.evaluate(() => {
    const a = document.querySelector(".hero .asof");
    a.textContent = a.textContent.split(" · ")[0] + " · Themes, amendments and the basic structure";
    document.querySelector(".hero .lede").innerHTML = "Every article in the official words,<br>with a plain-English summary to help you understand it.";
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, "og.png") });

  await b.close();
  for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "og.png"]) console.log(f, fs.statSync(path.join(out, f)).size);
})();
