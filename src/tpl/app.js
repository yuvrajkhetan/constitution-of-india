(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("coi2." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("coi2." + k, JSON.stringify(v)); } catch (e) {} }
};

/* ================= data ================= */
const CORE = JSON.parse($("#core").textContent);
const PARTS = CORE.parts, SCH = CORE.sch, AMD = CORE.amd, THEMES = CORE.themes;
const ORDER = [], ART = new Map();
CORE.arts.forEach(([n, t, p, o, c], i) => { ART.set(n, { n, t, p, o: !!o, c, i }); ORDER.push(n); });
const ARTKEY = new Map(ORDER.map(n => [n.toUpperCase().replace(/[-\s]/g, ""), n]));
const findArt = s => ARTKEY.get(String(s).toUpperCase().replace(/[-\s]/g, ""));
const LOC = new Map();
PARTS.forEach((P, pi) => P.ch.forEach((C, ci) => C.s.forEach((S, si) => S.a.forEach(n => LOC.set(n, { pi, ci, si })))));
const PART_BY = new Map(PARTS.map((p, i) => [p.n, i]));
const SCH_BY = new Map(SCH.map((s, i) => [s.k, i]));
const AMD_BY = new Map(AMD.map(a => [a.n, a]));
const THEME_BY = new Map(THEMES.map(t => [t.id, t]));
const THEMES_OF = new Map();
THEMES.forEach(t => t.i.forEach(id => { if (!THEMES_OF.has(id)) THEMES_OF.set(id, []); THEMES_OF.get(id).push(t); }));
const ORDW = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth"];
const TENW = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function ordw(n) {
  if (n === 100) return "One Hundredth";
  if (n > 100) return "One Hundred and " + ordw(n - 100);
  if (n < 20) return ORDW[n];
  const t = Math.floor(n / 10), u = n % 10;
  return u ? TENW[t] + "-" + ORDW[u].toLowerCase() : TENW[t].replace(/y$/, "ieth");
}
const nth = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const AMD_BY_NAME = new Map();
for (let n = 1; n <= 120; n++) AMD_BY_NAME.set(ordw(n).toLowerCase().replace(/[^a-z]/g, ""), n);
const schName = k => k.charAt(0) + k.slice(1).toLowerCase() + " Schedule";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = d => d ? `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : "";
const PCT = ["var(--saffron)", "var(--navy)", "var(--green)"];
const partText = i => PCT[i % 3];
function partRange(P) {
  const nums = P.ch.flatMap(c => c.s.flatMap(s => s.a));
  return { nums, live: nums.filter(n => !ART.get(n).o), range: nums.length ? (nums.length === 1 ? "Article " + nums[0] : "Articles " + nums[0] + "–" + nums[nums.length - 1]) : "" };
}

/* ================= icons ================= */
const P = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  chev: P('<path d="m9 6 6 6-6 6"/>'),
  close: P('<path d="M6 6l12 12M18 6 6 18"/>'),
  book: P('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'),
  explore: P('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  grid: P('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  abc: P('<path d="M4 18 8 6l4 12M5.3 14h5.4M14 6h4a2.5 2.5 0 0 1 0 5h-4zM14 11h4.5a3.5 3.5 0 0 1 0 7H14z"/>'),
  bookmark: P('<path d="M7 4h10v16l-5-3.5L7 20z"/>'),
  bookmarkF: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3.5L7 20z" fill="currentColor"/></svg>',
  copy: P('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'),
  quote: P('<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>'),
  text: P('<path d="M4 18 9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.9 16h4.2"/>'),
  sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: P('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
  list: P('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  shuffle: P('<path d="M4 7h3c4 0 6 10 10 10h3M17 4l3 3-3 3M4 17h3c1.6 0 2.8-1.6 3.9-3.6M13.1 9.6C14.2 8 15.4 7 17 7h3M17 14l3 3-3 3"/>'),
  info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  alertc: P('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  gauge: P('<path d="M12 14l4-4"/><path d="M3.3 19a9 9 0 1 1 17.4 0"/>'),
  gavel: P('<path d="M14 13l-7.5 7.5a2.1 2.1 0 01-3-3L11 10"/><path d="M16 16l6-6"/><path d="M8 8l6-6"/><path d="M9 7l8 8"/><path d="M21 11l-8-8"/>'),
  arrow: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  // theme icons
  venus: P('<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>'),
  child: P('<circle cx="9" cy="7" r="2.5"/><path d="M5 21v-5a4 4 0 0 1 8 0v5"/><circle cx="17.5" cy="6.5" r="2.5"/><path d="M17.5 9v4"/>'),
  lamp: P('<path d="M12 3c2 2.5 2 5 0 7-2-2-2-4.5 0-7z"/><path d="M4 13c3 0 6 1 8 4 2-3 5-4 8-4-1 4-4 7-8 7s-7-3-8-7z"/>'),
  leaf: P('<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 13 11"/>'),
  mountain: P('<path d="M3 20 9.5 8l4 7 2.5-4L21 20z"/>'),
  eye: P('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  lock: P('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  mega: P('<path d="M3 10v4h4l7 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>'),
  cap: P('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>'),
  tool: P('<path d="M14.5 6.5a4 4 0 0 0-5.5 5.2L3 17.7 6.3 21l6-6a4 4 0 0 0 5.2-5.5l-2.6 2.6-2.5-.5-.5-2.5z"/>'),
  fence: P('<path d="M4 21V8l2-3 2 3v13M16 21V8l2-3 2 3v13M10 21V8l2-3 2 3v13M3 11h18M3 17h18"/>'),
  shield: P('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>'),
  hand: P('<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L4 14.5a1.6 1.6 0 0 1 2.6-1.8L8 14"/>'),
  person: P('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  compass: P('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  doc: P('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  building: P('<path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M12 3 3 8h18z"/>'),
  scales: P('<path d="M12 4v16M8 20h8M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>'),
  ballot: P('<path d="M4 12h16v8H4z"/><path d="m8 10 3-6 6 3-2 5M8 16h8"/>'),
  split: P('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h9"/>'),
  coin: P('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  alert: P('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  more: P('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.15" fill="currentColor" stroke="none"/>'),
  auto: P('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>'),
  check: P('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  cal: P('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  home: P('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>'),
  people: P('<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>'),
  pen: P('<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M14 7l3 3"/>'),
  chat: P('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'),
  map: P('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  briefcase: P('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>'),
  share: P('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
  link: P('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
  speaker: P('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  stop: P('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  pin: P('<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>')
};
const CHAKRA = (() => {
  let s = "", d = "";
  for (let i = 0; i < 24; i++) { s += `<path d="M50 50 L48.6 14 L50 7.5 L51.4 14 Z" transform="rotate(${i * 15} 50 50)"/>`; d += `<circle cx="50" cy="5.4" r="1.5" transform="rotate(${i * 15 + 7.5} 50 50)"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none"><symbol id="chakra" viewBox="0 0 100 100"><g fill="currentColor">${s}${d}<circle cx="50" cy="50" r="7"/></g><circle cx="50" cy="50" r="45.5" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="11" fill="none" stroke="currentColor" stroke-width="2"/></symbol></svg>`;
})();
document.body.insertAdjacentHTML("afterbegin", CHAKRA);
const chakra = cls => `<svg class="${cls || ""}" viewBox="0 0 100 100" aria-hidden="true"><use href="#chakra"/></svg>`;


/* ================= patchwork quilt ================= */
const QPAL = {
  light: ["#ff9933", "#f4b266", "#138808", "#7cb860", "#1f3fae", "#2e3a78", "#a8382c", "#e9a0a0", "#f3e7d3", "#ffffff", "#e0a526", "#c96a3a"],
  dark: ["#ff9f40", "#b5743a", "#30d158", "#2f7a3a", "#8aa4ff", "#3c4aa0", "#e0675c", "#7a3a36", "#5a5040", "#2c2c2e", "#d9a43a", "#a65a34"]
};
const isDark = () => curTheme() === "dark";
/* the quilt is kept quiet: colours are washed toward the page background and neutral patches are added */
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
function softPal(k) {
  const dk = isDark(), bg = hx(dk ? "#0b0a09" : "#f6f4ef"), base = QPAL[dk ? "dark" : "light"];
  const mix = c => "#" + hx(c).map((v, i) => Math.round(v + (bg[i] - v) * k).toString(16).padStart(2, "0")).join("");
  return [...base.map(mix), ...(dk ? ["#1c1b1a", "#252321", "#1c1b1a"] : ["#ffffff", "#fbfaf7", "#f3eee3"])];
}
function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
function newPatch(R, pal) {
  const pick = () => pal[Math.floor(R() * pal.length)];
  let a = pick(), b = pick(); while (b === a) b = pick();
  let c = pick(); while (c === a) c = pick();
  return { t: Math.floor(R() * 8), a, b, c, rot: Math.floor(R() * 4) };
}
/* patches drawn from Indian textile traditions, on a 60-unit square: [path, colour role] (a = ground, b = motif, c = accent) */
const f1 = n => +n.toFixed(1);
const circ = (x, y, r) => `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
const rect = (x, y, w, h) => `M${f1(x)} ${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`;
const poly = pts => "M" + pts.map(([x, y]) => f1(x) + " " + f1(y)).join("L") + "Z";
const paisley = (cx, cy, k) => { const P = (x, y) => `${f1(cx + x * k)} ${f1(cy + y * k)}`; return `M${P(8, -28)}C${P(0, -22)} ${P(-16, -14)} ${P(-16, 0)}A${f1(16 * k)} ${f1(16 * k)} 0 0 0 ${P(16, 0)}C${P(16, -12)} ${P(10, -20)} ${P(8, -28)}Z`; };
function patchPaths(t) {
  let b = "", c = "", a = "";
  if (t === 0) { /* bandhani: tie-dye dots, a diamond of accent dots at the heart */
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) { const x = 5 + i * 10 + (j % 2 ? 5 : 0), y = 5 + j * 10; if (x < 58) b += circ(x, y, 1.7); }
    [[30, 21], [21, 30], [39, 30], [30, 39], [30, 30]].forEach(([x, y]) => c += circ(x, y, 2.6));
  } else if (t === 1) { /* leheriya: waves of colour */
    [6, 20, 34, 48].forEach((y0, n) => { const top = [], bot = []; for (let i = 0; i <= 8; i++) { const x = i * 7.5, y = y0 + (i % 2 ? 5 : 0); top.push([x, y]); bot.unshift([x, y + 5]); } const d = poly(top.concat(bot)); n % 2 ? c += d : b += d; });
  } else if (t === 2) { /* ikat: a stepped diamond */
    for (let j = 0; j < 8; j++) { const y = 6 + j * 6, hw = 27 - Math.abs(y + 3 - 30); b += rect(30 - hw, y, hw * 2, 6); }
    for (let j = 0; j < 4; j++) { const y = 18 + j * 6, hw = 15 - Math.abs(y + 3 - 30); a += rect(30 - hw, y, hw * 2, 6); }
    c += circ(30, 30, 3.2);
  } else if (t === 3) { /* ajrakh: an eight-pointed star with corner points */
    b += rect(14, 14, 32, 32) + poly([[30, 7], [53, 30], [30, 53], [7, 30]]);
    a += circ(30, 30, 9); c += circ(30, 30, 4) + poly([[0, 0], [10, 0], [0, 10]]) + poly([[60, 0], [60, 10], [50, 0]]) + poly([[0, 60], [0, 50], [10, 60]]) + poly([[60, 60], [50, 60], [60, 50]]);
  } else if (t === 4) { /* block print: four small butis */
    [[15, 15], [45, 15], [15, 45], [45, 45]].forEach(([x, y]) => { [[0, -4], [4, 0], [0, 4], [-4, 0]].forEach(([dx, dy]) => b += circ(x + dx, y + dy, 3.4)); c += circ(x, y, 2); });
    b += circ(30, 30, 1.8);
  } else if (t === 5) { /* paisley (boteh) */
    b += paisley(30, 38, 1); a += paisley(30.5, 37, .55); c += circ(29.5, 39, 2.6);
  } else if (t === 6) { /* kantha: rows of running stitch */
    for (let j = 0; j < 7; j++) { const y = 6.5 + j * 8; let d = ""; for (let x = j % 2 ? 4.5 : 0; x < 60; x += 9) d += rect(x, y, Math.min(5, 60 - x), 1.6); j === 3 ? c += d : b += d; }
  } else { /* mirror work (shisha): a ringed mirror with four studs */
    b += circ(30, 30, 14); c += circ(30, 30, 9); a += circ(30, 30, 4);
    [[30, 8], [52, 30], [30, 52], [8, 30]].forEach(([x, y]) => b += circ(x, y, 3));
  }
  return [[b, "b"], [a, "a"], [c, "c"]].filter(x => x[0]);
}
const PP = [];
const patchP2D = t => PP[t] || (PP[t] = patchPaths(t).map(([d, r]) => [new Path2D(d), r]));
const patchSVG = p => patchPaths(p.t).map(([d, r]) => `<path d="${d}" fill="${p[r]}"/>`).join("");
/* draw one patch (square of size s at x,y) on a 2D context */
function drawPatch(g, p, x, y, s, stitch) {
  g.save(); g.translate(x + s / 2, y + s / 2); g.rotate(p.rot * Math.PI / 2); g.scale(s / 60, s / 60); g.translate(-30, -30);
  g.fillStyle = p.a; g.fillRect(0, 0, 60, 60);
  for (const [P, r] of patchP2D(p.t)) { g.fillStyle = p[r]; g.fill(P); }
  g.restore();
  if (stitch) { g.save(); g.strokeStyle = stitch; g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeRect(x + 3.5, y + 3.5, s - 7, s - 7); g.restore(); }
}
/* static SVG strip used as a CSS background (footer, dividers) */
function quiltSVG(cols, rows, s, seed) {
  const R = rng(seed), pal = softPal(.45);
  let out = "";
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const p = newPatch(R, pal), x = i * s, y = j * s;
    out += `<g transform="translate(${x} ${y}) rotate(${p.rot * 90} ${s / 2} ${s / 2}) scale(${f1(s / 60)})"><rect width="60" height="60" fill="${p.a}"/>${patchSVG(p)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * s}" height="${rows * s}" viewBox="0 0 ${cols * s} ${rows * s}">${out}</svg>`;
}
function setQuiltVars() {
  const strip = quiltSVG(24, 1, 16, 11);
  document.documentElement.style.setProperty("--quilt-strip", `url("data:image/svg+xml,${encodeURIComponent(strip)}")`);
}
/* the hero quilt: canvas, assembles from the centre, then a patch quietly re-stitches now and then */
let heroQuilt = null, quiltDone = null;
function startHeroQuilt() {
  if (heroQuilt) heroQuilt.stop();
  const cv = $("#heroquilt"); if (!cv) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const g = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  const pal = softPal(.35), R = rng(2026), stitch = isDark() ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.6)";
  let W, H, S, cols, rows, P = [], t0 = performance.now(), raf = 0, timer = 0, alive = true, visible = true, flip = null;
  function layout() {
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    S = W < 640 ? 48 : 60; cols = Math.ceil(W / S) + 1; rows = Math.ceil(H / S) + 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const ox = Math.round((W - cols * S) / 2), oy = Math.round((H - rows * S) / 2), cx = W / 2, cy = H / 2;
    P = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = ox + i * S, y = oy + j * S, d = Math.hypot(x + S / 2 - cx, (y + S / 2 - cy) * 1.6);
      P.push({ x, y, d, p: newPatch(R, pal) });
    }
  }
  const ease = k => 1 - Math.pow(1 - k, 3);
  /* each patch is drawn once into its own small image; frames then only redraw the patches that are moving */
  const sprite = q => {
    if (q.img && q.imgP === q.p) return q.img;
    const c = document.createElement("canvas"), n = Math.ceil(S * dpr); c.width = c.height = n;
    const x = c.getContext("2d"); x.scale(n / S, n / S); drawPatch(x, q.p, 0, 0, S, stitch);
    q.img = c; q.imgP = q.p; return c;
  };
  function frame(now) {
    if (!alive) return;
    const el = reduce ? 1e9 : now - t0; let busy = false;
    for (const q of P) {
      const flipping = flip && flip.q === q;
      if (q.done && !flipping) continue;
      const k = Math.max(0, Math.min(1, (el - q.d * 1.1) / 700));
      if (k < 1) busy = true;
      if (k <= 0) continue;
      let sx = ease(k), sy = sx;
      if (flipping) { const f = Math.min(1, (now - flip.t) / 1100); sx *= Math.abs(Math.cos(f * Math.PI)); if (f >= .5 && !flip.done) { q.p = flip.np; flip.done = true; } if (f < 1) busy = true; else flip = null; }
      g.clearRect(q.x, q.y, S, S);
      if (sx > .002) g.drawImage(sprite(q), q.x + S * (1 - sx) / 2, q.y + S * (1 - sy) / 2, S * sx, S * sy);
      if (k >= 1 && !flipping) q.done = true;
    }
    raf = busy ? requestAnimationFrame(frame) : 0;
  }
  function tick() {
    if (!alive || reduce) return;
    if (visible && !document.hidden && P.length) { flip = { q: P[Math.floor(Math.random() * P.length)], np: newPatch(R, pal), t: performance.now() }; if (!raf) raf = requestAnimationFrame(frame); }
    timer = setTimeout(tick, 5000 + Math.random() * 4000);
  }
  layout(); if (!reduce) P.forEach(sprite); raf = requestAnimationFrame(frame); timer = setTimeout(tick, 5000);
  const introMs = reduce ? 0 : Math.max(0, ...P.map(q => q.d)) * 1.1 + 750;
  setTimeout(() => { if (quiltDone) { const f = quiltDone; quiltDone = null; f(); } }, introMs);
  const ro = new ResizeObserver(() => { const w = cv.getBoundingClientRect().width; if (Math.abs(w - W) > 8) { layout(); t0 = performance.now() - 1e6; if (!raf) raf = requestAnimationFrame(frame); } });
  ro.observe(cv);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(cv);
  heroQuilt = { stop() { alive = false; cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); io.disconnect(); } };
}
/* small quilt block used as the site mark: 3x3 patches with the Chakra at its heart */
function quiltBlock(seed) {
  const R = rng(seed), bg = hx("#f6f4ef"), pal = QPAL.light.filter(c => c !== "#ffffff" && c !== "#f3e7d3").map(c => "#" + hx(c).map((v, i) => Math.round(v + (bg[i] - v) * .22).toString(16).padStart(2, "0")).join(""));
  let h = "", n = 0;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const x = i * 32, y = j * 32, d = (i + j) * 60;
    if (i === 1 && j === 1) { h += `<g class="qb-p" style="animation-delay:${d}ms"><rect x="${x}" y="${y}" width="32" height="32" fill="#fff"/><g transform="translate(${x + 3} ${y + 3}) scale(.26)" color="#1f3fae"><use href="#chakra"/></g></g>`; continue; }
    const p = newPatch(R, pal); p.t = n++;
    h += `<g class="qb-p" style="animation-delay:${d}ms"><g transform="translate(${x} ${y}) rotate(${p.rot * 90} 16 16) scale(${32 / 60})"><rect width="60" height="60" fill="${p.a}"/>${patchSVG(p)}</g></g>`;
  }
  for (let k = 1; k < 3; k++) h += `<path d="M${k * 32} 0V96M0 ${k * 32}H96" stroke="rgba(255,255,255,.9)" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  return `<svg class="qblock" viewBox="0 0 96 96" aria-hidden="true">${h}<rect x="1" y="1" width="94" height="94" rx="10" fill="none" stroke="rgba(0,0,0,.08)"/></svg>`;
}

/* ================= full text (loaded after first paint) ================= */
let TEXT = null, textErr = false, bsJumped = null;
/* On a first visit straight to an article, its Part's small file (t/PART.json) can arrive before the full text.
   Until then the article page reads from it; every other page waits for the full text. */
let EARLY = null, earlyFor = null;
const artText = n => TEXT ? TEXT.a[n] : EARLY && EARLY.a[n];
const bsData = () => TEXT ? TEXT.bs : EARLY && EARLY.bs;
/* the full text loads once. On the home page it waits until the quilt has assembled, so the two don't compete
   for the same frames; opening search or leaving the page starts it straight away */
let textStarted = false;
const ensureText = () => { if (!textStarted) { textStarted = true; loadText(); } };
function loadText() {
  textStarted = true; textErr = false;
  /* the build stamps the address with a fingerprint of the file, so a new page never gets an old cached copy;
     if that address fails (some hosts ignore or refuse it), fall back to the plain file */
  const getJSON = u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
  getJSON("text.json?v=__TEXTV__").catch(() => getJSON("text.json")).then(j => {
    TEXT = j; DOCS = null;
    const drawn = route.name === "art" && earlyFor === route.id; EARLY = earlyFor = null;
    if (needsText() && !drawn) render(true);
    if (dlgOpen()) runSearch();
  }).catch(() => { textErr = true; if (needsText()) render(true); if (dlgOpen()) runSearch(); });
}

/* ================= text rendering ================= */
const SW = "First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth";
const RX_ART = /\b(articles?|arts?\.)(\s+)(\d+[A-Z]{0,3}(?:-I)?(?:\s*\([^)]{1,6}\))*(?:(?:,\s*|\s+(?:and|or|to)\s+)(?:article\s+)?\d+[A-Z]{0,3}(?:-I)?(?:\s*\([^)]{1,6}\))*)*)/g;
const RX_SCH = new RegExp("\\b(" + SW + ") Schedule\\b", "g");
const RX_PART = new RegExp("\\bPart (X{0,3}(?:IX|IV|V?I{0,3})[A-C]?)\\b(?! of the (?:" + SW + ") Schedule| of the (?:said )?table| of (?:this|the said) Schedule)", "g");
const RX_AMD = /(Consti\w*\s*\()([A-Za-z\- ]+?)( Amendment\)\s*Act,?\s*\d{4})/g;
function linkArts(h) {
  return h.replace(RX_ART, (m, w, sp, list) => w + sp + list.split(/(\([^)]*\))/).map(seg => seg.startsWith("(") ? seg : seg.replace(/\d+[A-Z]{0,3}(?:-I)?/g, num => {
    const k = findArt(num); return k ? `<a class="xr" href="#art-${k}">${num}</a>` : num;
  })).join(""));
}
function linkify(h, ctx) {
  h = linkArts(h);
  h = h.replace(RX_SCH, (m, w) => `<a class="xr" href="#sch-${w.toUpperCase()}">${m}</a>`);
  if (ctx === "art") h = h.replace(RX_PART, (m, r) => PART_BY.has(r) ? `<a class="xr" href="#part-${r}">${m}</a>` : m);
  return h;
}
/* Plain explanations of terms readers may not know (data/terms.json). In our own text (never the official text),
   the first use of each term on a page becomes a button that opens its explanation. */
let termSeen = new Set();
const TERMS = CORE.terms || [], TERM_BY = new Map(TERMS.map(x => [x.id, x]));
const TERM_RX = TERMS.length ? new RegExp("\\b(?:" + TERMS.map(x => "(" + x.m + ")").join("|") + ")\\b", "gi") : null;
function markTerms(h) {
  if (!TERM_RX) return h;
  let inside = 0;
  return h.split(/(<[^>]+>)/).map(seg => {
    if (seg[0] === "<") { if (/^<(a|button)\b/i.test(seg)) inside++; else if (/^<\/(a|button)>/i.test(seg)) inside--; return seg; }
    if (inside) return seg;
    return seg.replace(TERM_RX, (m, ...g) => {
      const x = TERMS[g.findIndex((v, j) => j < TERMS.length && v !== undefined)];
      if (!x || termSeen.has(x.id)) return m;
      termSeen.add(x.id);
      return `<button type="button" class="term" data-term="${x.id}" aria-haspopup="dialog" aria-expanded="false">${m}</button>`;
    });
  }).join("");
}
const lx = s => markTerms(linkAmd(linkify(esc(s || ""), "art")));
function linkAmd(h) {
  return h.replace(RX_AMD, (m, a, name, b) => {
    const n = AMD_BY_NAME.get(name.toLowerCase().replace(/[^a-z]/g, ""));
    return n && AMD_BY.has(n) ? `<a href="#amend-${n}">${a}${name}${b}</a>` : m;
  });
}
function highlight(html, terms) {
  if (!terms || !terms.length) return html;
  const rx = new RegExp("\\b(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length).join("|") + ")\\b", "gi");
  return html.split(/(<[^>]+>)/).map(p => p.startsWith("<") ? p : p.replace(rx, "<mark>$1</mark>")).join("");
}
function rich(s, ctx, hl) {
  let h = linkify(esc(s), ctx);
  h = h.replace(/\{(\d+)\}/g, (m, k) => `<button class="fn" type="button" data-fn="${k}" aria-label="Official note ${k}" aria-expanded="false">${k}</button>`);
  h = h.replace(/^((?:<button[^>]*>\d+<\/button>)?\[?)(Provided(?: further| also)?(?: that)?|Explanation(?: [IVX]+)?\.?(?=—)|Explanation\.)/, '$1<span class="lbl">$2</span>');
  return hl ? highlight(h, hl) : h;
}
const plain = s => s.replace(/\{\d+\}/g, "").replace(/\s+/g, " ").trim();
const fnBtns = (h) => (h || []).map(k => `<button class="fn" type="button" data-fn="${k}" aria-label="Official note ${k}" aria-expanded="false">${k}</button>`).join("");

/* ================= search ================= */
/* Everything runs on the reader's device. Words are split properly and reduced to their stem (Porter), so "dismissed" finds
   "dismissal". Results are ranked with BM25 across fields (title, keywords, summary, text, notes), so rare words count for more
   than common ones and a long question does not need every word in one article. Typos and half-typed words are matched, common
   abbreviations are expanded, and a few everyday words are bridged to the Constitution's own. Article hits open the clause that
   matched. Tested by search_eval.js against audit/search_queries.json. */
let DOCS = null, IDX = null;
const SCH_NUM = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };
const norm = s => s.toLowerCase().replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, " ");
function buildDocs() {
  const d = [];
  ORDER.forEach(n => {
    const a = ART.get(n), t = TEXT && TEXT.a[n];
    const body = t ? t.p.map(p => plain(p[1])).join(" ") + (t.st ? " " + t.st : "") : "";
    d.push({ k: "a", id: n, title: a.t, tl: norm(a.t), sum: t && t.s || "", sl: norm(t && t.s || ""), kw: norm((t && t.k || []).join(" | ")), body, bl: norm(body), nl: t ? norm(t.f.join(" ")) : "", o: a.o, paras: t ? t.p : null, nb: t && t.b ? t.b.length : 0 });
  });
  THEMES.forEach(t => d.push({ k: "t", id: t.id, title: t.t, tl: norm(t.t + " " + t.q), sum: t.d, sl: norm(t.d), kw: "", body: "", bl: "", nl: "" }));
  PARTS.forEach(p => d.push({ k: "p", id: p.n, title: "Part " + p.n + " · " + p.t, tl: norm(p.t), sum: p.s, sl: norm(p.s || ""), kw: norm((p.k || []).join(" | ")), body: "", bl: "", nl: "" }));
  if (TEXT) {
    TEXT.g.forEach(([term, defs]) => d.push({ k: "g", id: term, title: term, tl: norm(term), sum: defs[0][1], sl: "", kw: "", body: defs[0][1], bl: norm(defs[0][1]), nl: "", a: defs[0][0] }));
    SCH.forEach(s => {
      const T = TEXT.s[s.k];
      d.push({ k: "s0", id: s.k, title: schName(s.k) + " · " + s.t, tl: norm(schName(s.k) + " " + s.t), sum: T.s || s.s, sl: norm(T.s || ""), kw: norm((T.k || []).join(" | ")), body: "", bl: "", nl: "" });
      T.b.forEach((b, i) => { const txt = b.th ? "" : plain(b.p || b.h || b.ref || (b.r ? b.r.join(" · ") : "")); if (txt.length > 2) d.push({ k: "s", id: s.k, b: i, title: schName(s.k), tl: "", sum: "", sl: "", kw: "", body: txt, bl: norm(txt), nl: "" }); });
    });
  }
  AMD.forEach(a => d.push({ k: "m", id: a.n, title: `${nth(a.n)} Amendment (${a.y})`, tl: norm(`${nth(a.n)} amendment ${ordw(a.n)} amendment ${a.y}`), sum: a.h, sl: norm(a.h + " " + a.tags.join(" ")), kw: "", body: "", bl: "", nl: "" }));
  return d;
}
// Porter stemmer (M. F. Porter, 1980), after the public reference implementation.
const stem = (() => {
  const s2 = { ational: "ate", tional: "tion", enci: "ence", anci: "ance", izer: "ize", bli: "ble", alli: "al", entli: "ent", eli: "e", ousli: "ous", ization: "ize", ation: "ate", ator: "ate", alism: "al", iveness: "ive", fulness: "ful", ousness: "ous", aliti: "al", iviti: "ive", biliti: "ble", logi: "log" };
  const s3 = { icate: "ic", ative: "", alize: "al", iciti: "ic", ical: "ic", ful: "", ness: "" };
  const c = "[^aeiou]", v = "[aeiouy]", C = c + "[^aeiouy]*", V = v + "[aeiou]*";
  const mgr0 = new RegExp("^(" + C + ")?" + V + C), meq1 = new RegExp("^(" + C + ")?" + V + C + "(" + V + ")?$"), mgr1 = new RegExp("^(" + C + ")?" + V + C + V + C), sv = new RegExp("^(" + C + ")?" + v);
  const cvc = new RegExp("^" + C + v + "[^aeiouwxy]$"), dbl = /([^aeiouylsz])\1$/, cache = new Map();
  return w0 => {
    if (w0.length < 3 || /\d/.test(w0)) return w0;
    const hit = cache.get(w0); if (hit) return hit;
    let w = w0, m, st;
    const y = w[0] === "y"; if (y) w = "Y" + w.slice(1);
    if ((m = /^(.+?)(ss|i)es$/.exec(w))) w = m[1] + m[2]; else if ((m = /^(.+?)([^s])s$/.exec(w))) w = m[1] + m[2];
    if ((m = /^(.+?)eed$/.exec(w))) { if (mgr0.test(m[1])) w = w.slice(0, -1); }
    else if ((m = /^(.+?)(ed|ing)$/.exec(w)) && sv.test(m[1])) { w = m[1]; if (/(at|bl|iz)$/.test(w)) w += "e"; else if (dbl.test(w)) w = w.slice(0, -1); else if (cvc.test(w)) w += "e"; }
    if ((m = /^(.+?)y$/.exec(w)) && sv.test(m[1])) w = m[1] + "i";
    if ((m = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/.exec(w)) && mgr0.test(m[1])) w = m[1] + s2[m[2]];
    if ((m = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/.exec(w)) && mgr0.test(m[1])) w = m[1] + s3[m[2]];
    if ((m = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/.exec(w))) { if (mgr1.test(m[1])) w = m[1]; }
    else if ((m = /^(.+?)(s|t)(ion)$/.exec(w)) && mgr1.test(st = m[1] + m[2])) w = st;
    if ((m = /^(.+?)e$/.exec(w)) && (mgr1.test(st = m[1]) || (meq1.test(st) && !cvc.test(st)))) w = st;
    if (/ll$/.test(w) && mgr1.test(w)) w = w.slice(0, -1);
    if (y) w = "y" + w.slice(1);
    cache.set(w0, w); return w;
  };
})();
// words in a text: possessives dropped; a hyphenated word gives its parts and the joined form ("co-operative" also "cooperative")
function toks(s) {
  const out = [];
  for (const m of norm(s).replace(/'s\b/g, "").matchAll(/[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
    const w = m[0];
    if (w.includes("-")) { w.split("-").forEach(x => x && out.push(x)); out.push(w.replace(/-/g, "")); } else out.push(w);
  }
  return out;
}
const FW = [3, 2.2, 1.5, 1, .15], FB = [.3, .5, .6, .75, .75], K1 = 1.2;   // field weights and length normalisation: title, keywords, summary, text, notes
function buildIdx(D) {
  const post = new Map(), len = [], avg = [0, 0, 0, 0, 0], vocab = new Map(), pairs = [];
  D.forEach((d, i) => {
    const L = [0, 0, 0, 0, 0], P = new Set();
    [d.tl, d.kw, d.sl, d.bl, d.nl].forEach((txt, f) => {
      if (!txt) return;
      const ws = toks(txt); L[f] = ws.length; avg[f] += ws.length;
      let prev = null;
      ws.forEach(w => {
        vocab.set(w, (vocab.get(w) || 0) + 1);
        const s = stem(w); let p = post.get(s); if (!p) post.set(s, p = new Map());
        let e = p.get(i); if (!e) p.set(i, e = [0, 0, 0, 0, 0]); e[f]++;
        if (f < 4 && prev) P.add(prev + " " + s); prev = s;
      });
    });
    len.push(L); pairs.push(P);
  });
  const N = D.length; for (let f = 0; f < 5; f++) avg[f] = avg[f] / N || 1;
  const forms = new Map(), byFirst = new Map();
  vocab.forEach((n, w) => {
    const s = stem(w); (forms.get(s) || forms.set(s, []).get(s)).push(w);
    if (/^[a-z]{3,}$/.test(w)) (byFirst.get(w[0]) || byFirst.set(w[0], []).get(w[0])).push(w);
  });
  return { N, post, len, avg, vocab, forms, byFirst, pairs };
}
// optimal string alignment distance, giving up past `max`
function osa(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let p2 = null, p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const r = [i]; let lo = i;
    for (let j = 1; j <= b.length; j++) {
      let x = Math.min(p[j] + 1, r[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) x = Math.min(x, p2[j - 2] + 1);
      r.push(x); if (x < lo) lo = x;
    }
    if (lo > max) return max + 1;
    p2 = p; p = r;
  }
  return p[b.length];
}
const STOP = new Set("the of and to in a an or for by on with as is be any such that this what who whom whose which when where why how can could will would should shall may might must does do did done is are was were been being i me my myself you your we our us it its there their they them he she his her get gets got has have had about from at into onto over than then so just also only very much many some all each every happens happen happened mean means meaning explain tell about want need".split(" "));
// common abbreviations, read as their full words (the abbreviation itself still counts as a word, since summaries use some)
const ABBR = [[/\bsc\s*(?:\/|and|&)?\s*st\b/g, "scheduled castes and scheduled tribes"], [/\bj\s*(?:&|and)\s*k\b/g, "jammu and kashmir"], [/\bsc\b(?=.*\b(?:reserv|quota|caste|seat|commission))/g, "scheduled castes"],
  ...Object.entries({ cji: "chief justice of india", cag: "comptroller and auditor general", cec: "chief election commissioner", eci: "election commission", ec: "election commission", mp: "member of parliament", mps: "members of parliament", mla: "member of the legislative assembly", mlas: "members of the legislative assembly", mlc: "member of the legislative council", ut: "union territory", uts: "union territories", nct: "national capital territory", upsc: "union public service commission", psc: "public service commission", obc: "backward classes", obcs: "backward classes", dpsp: "directive principles of state policy", fr: "fundamental rights", frs: "fundamental rights", gst: "goods and services tax", hc: "high court", sc: "supreme court", st: "scheduled tribes", pm: "prime minister", cm: "chief minister", vp: "vice president", rs: "rajya sabha", ls: "lok sabha" }).map(([a, b]) => [new RegExp("\\b" + a + "\\b", "g"), b])];
// everyday names for two-word terms the Constitution words differently: each word may match its counterpart
const PAIR = { "lok sabha": ["house", "people"], "rajya sabha": ["council", "states"], "vidhan sabha": ["legislative", "assembly"], "state assembly": ["legislative", "assembly"], "armed forces": ["defence", "forces"] };
// a word that means something else next to another word: removing the President is impeachment
const CTX = [[/^president/, /^(remov|sack|dismiss|fire|oust)/, "impeachment"]];
// everyday words and the Constitution's own words for them
const SYNW = { fire: "dismiss remove", fired: "dismiss remove", firing: "dismiss remove", sack: "dismiss remove", sacked: "dismiss remove", jail: "detention custody arrest", jailed: "detention custody arrest", prison: "detention custody", imprison: "detention custody", crime: "offence", crimes: "offence", sign: "assent", signs: "assent", signed: "assent", signature: "assent", salary: "salaries emoluments allowances", pay: "salaries emoluments", job: "services post appointment", jobs: "services post appointment", kids: "children", land: "property estate", lawyer: "legal practitioner", leave: "secede", centre: "union", center: "union", preside: "chairman speaker", presides: "chairman speaker", presiding: "chairman speaker", central: "union", army: "defence", military: "defence", rename: "alter name" };
function search(qraw) {
  const q0 = norm(qraw.trim()), out = { direct: [], hits: [], terms: [], total: 0, fix: "" };
  if (!q0) return out;
  if (!DOCS || (TEXT && !DOCS.full)) { DOCS = buildDocs(); DOCS.full = !!TEXT; IDX = buildIdx(DOCS); }
  const I = IDX, typing = !/\s$/.test(qraw);
  // typo fixes and the completion of a half-typed last word, used for the "Go to" jumps and shown as "Showing results for"
  const raw = q0.replace(/[^a-z0-9'&\-\/ ]/g, " ").split(/\s+/).filter(Boolean);
  const fixWord = (w, last) => {
    if (w.length < 3 || /\d/.test(w) || STOP.has(w) || I.vocab.has(w) || SYNW[w] || I.post.has(stem(w))) return null;
    if (last && typing) { let best = null; for (const c of I.byFirst.get(w[0]) || []) if (c.length > w.length && c.startsWith(w) && (!best || I.vocab.get(c) > I.vocab.get(best))) best = c; if (best) return { w: best, how: "prefix" }; }
    const max = w.length >= 8 ? 2 : w.length >= 5 ? 1 : 0; if (!max) return null;
    let best = null, bd = max + 1;
    for (const c of I.byFirst.get(w[0]) || []) { const d = osa(w, c, max); if (d < bd || (d === bd && best && I.vocab.get(c) > I.vocab.get(best))) { bd = d; best = c; } }
    return best && bd <= max ? { w: best, how: "typo" } : null;
  };
  const fixes = raw.map((w, i) => fixWord(w, i === raw.length - 1));
  const qc = raw.map((w, i) => fixes[i] ? fixes[i].w : w).join(" ");
  if (fixes.some(f => f && f.how === "typo")) out.fix = qc;
  // "Go to": article numbers, Parts, Schedules, amendments and the hand-made list of synonyms, on the query as typed or as fixed
  const boost = new Set();
  const jumps = q => {
    const D = []; let m;
    if ((m = q.match(/^(?:art[a-z]*\.?\s*)?(\d{1,3}\s*[a-z]{0,3}(?:-i)?)\s*((?:\(\s*[0-9a-z]{1,4}\s*\))*)$/))) { const k = findArt(m[1]); if (k) D.push({ type: "art", id: k, c: m[2] ? m[2].replace(/[()\s]+/g, " ").trim().split(" ").map(x => /^\d/.test(x) ? x.toUpperCase() : x).join(".") : null }); }
    if ((m = q.match(/^part\s+([ivxl]+[a-c]?)$/))) { const r = m[1].toUpperCase(); if (PART_BY.has(r)) D.push({ type: "part", id: r }); }
    if ((m = q.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+sch/)) || (m = q.match(/\bsch(?:edule)?\.?\s+(\d{1,2}|[ivx]+)\b/)) || (m = q.match(/^(\d{1,2})(?:st|nd|rd|th)\s+sch/))) {
      const v = m[1], n = SCH_NUM[v] || ROMAN[v] || parseInt(v, 10); if (n >= 1 && n <= 12) D.push({ type: "sch", id: SCH[n - 1].k });
    }
    if ((m = q.match(/\b(\d{1,3})(?:st|nd|rd|th)?\s+amend/)) || (m = q.match(/^amendment\s+(\d{1,3})$/))) { const n = +m[1]; if (AMD_BY.has(n)) D.push({ type: "amd", id: n }); }
    else if ((m = q.match(/([a-z\- ]+?)\s+amendment/))) { const n = AMD_BY_NAME.get(m[1].replace(/^the\s+/, "").replace(/[^a-z]/g, "")); if (n && AMD_BY.has(n)) D.push({ type: "amd", id: n }); }
    if (/^preamble/.test(q)) D.push({ type: "pre" });
    if (/basic (structure|feature)|kesavananda|amend(ing)? power|can parliament amend/.test(q)) D.push({ type: "bs" });
    if (/next amendment|pending (bill|amendment)|amendment bill|forecast|one nation,? one election|simultaneous election|delimitation|seat freeze/.test(q)) D.push({ type: "next" });
    const sm = synMatch(q), cov = new Set(sm.flatMap(([p]) => p.split(" ")));
    const left = q.replace(/[^a-z0-9'\- ]/g, " ").split(/\s+/).filter(w => w.length > 1 && !STOP.has(w) && !cov.has(w));
    const tg = [...new Set(sm.flatMap(([, t]) => t))];
    if (!left.length) tg.slice(0, 5).map(synTarget).forEach(d => { if (!D.some(y => y.type === d.type && y.id === d.id)) D.push(d); });
    else tg.forEach(x => boost.add(x.startsWith("t:") ? "t:" + x.slice(2) : x.startsWith("s:") ? "s0:" + x.slice(2) : x === "P" ? "" : "a:" + x));
    return D;
  };
  out.direct = jumps(q0); if (!out.direct.length && qc !== q0) out.direct = jumps(qc);
  // the words to rank on, after abbreviations; each word may also match its everyday synonyms, typo fix or completion
  const phrase = (q0.match(/"([^"]+)"/) || [])[1];
  let qx = " " + (phrase || q0) + " "; const extra = [];
  for (const [rx, full] of ABBR) qx = qx.replace(rx, m => { extra.push(m.replace(/[^a-z]/g, "")); return full; });
  const words = [...new Set(toks(qx).filter(w => w.length > 1 && !STOP.has(w)))];
  if (!words.length) return out;
  const lastW = words[words.length - 1];
  const groups = words.map((w, k) => {
    const alts = [[stem(w), 1]];
    (SYNW[w] || "").split(" ").filter(Boolean).forEach(x => alts.push([stem(x), .85]));
    const pr = PAIR[w + " " + words[k + 1]], pl = PAIR[words[k - 1] + " " + w];
    if (pr) alts.push([stem(pr[0]), .9]); if (pl) alts.push([stem(pl[1]), .9]);
    CTX.forEach(([a, b, add]) => { if (b.test(w) && words.some(x => a.test(x))) alts.push([stem(add), .9]); });
    // word forms the stemmer keeps apart ("suspended", "suspension"): longer words also match others that share all but their last two letters
    if (w.length >= 7) { const pre = w.slice(0, w.length - 2), s0 = stem(w); (I.byFirst.get(w[0]) || []).filter(x => x.startsWith(pre) && stem(x) !== s0).sort((a, b) => I.vocab.get(b) - I.vocab.get(a)).slice(0, 4).forEach(x => alts.push([stem(x), .75])); }
    const f = fixWord(w, w === lastW);
    if (f) { if (f.how === "prefix") { const c = (I.byFirst.get(w[0]) || []).filter(x => x.length > w.length && x.startsWith(w)).sort((a, b) => I.vocab.get(b) - I.vocab.get(a)).slice(0, 6); c.forEach(x => alts.push([stem(x), .8])); } else alts.push([stem(f.w), .9]); }
    return alts.filter(([s]) => I.post.has(s));
  });
  const known = groups.filter(g => g.length);
  extra.forEach(w => { if (!STOP.has(w)) { const s = stem(w); if (I.post.has(s)) known.push(Object.assign([[s, .6]], { bonus: true })); } });
  if (!known.length) return out;
  out.terms = [...new Set(known.flatMap(g => g.flatMap(([s]) => I.forms.get(s) || [])))].filter(w => w.length > 2 || /\d/.test(w)).slice(0, 60);
  const need = known.filter(g => !g.bonus).length;
  const sc = new Map(), hitc = new Map();
  known.forEach(g => {
    const best = new Map();
    g.forEach(([s, wt]) => {
      const P = I.post.get(s), idf = Math.log(1 + (I.N - P.size + .5) / (P.size + .5));
      P.forEach((tf, i) => {
        let x = 0; for (let f = 0; f < 5; f++) if (tf[f]) x += FW[f] * tf[f] / (1 - FB[f] + FB[f] * I.len[i][f] / I.avg[f]);
        const v = wt * idf * x * (K1 + 1) / (x + K1);
        if (v > (best.get(i) || 0)) best.set(i, v);
      });
    });
    best.forEach((v, i) => { sc.set(i, (sc.get(i) || 0) + v); if (!g.bonus) hitc.set(i, (hitc.get(i) || 0) + 1); });
  });
  const full = (phrase || qc).replace(/[^a-z0-9'\- ]/g, " ").replace(/\s+/g, " ").trim();
  const st = words.map(stem), res = [], gs = known.filter(g => !g.bonus).map(g => new Set(g.map(([x]) => x)));
  sc.forEach((s, i) => {
    const d = DOCS[i];
    if (phrase && !(d.tl + " " + d.kw + " " + d.sl + " " + d.bl).includes(phrase)) return;
    const cov = need ? (hitc.get(i) || 0) / need : 1;
    if (!cov && need) return;
    s *= .25 + .75 * cov * cov;
    let adj = 0; for (let k = 1; k < st.length; k++) if (I.pairs[i].has(st[k - 1] + " " + st[k])) adj++;
    s *= 1 + Math.min(.4, .12 * adj);
    if (full.includes(" ")) { if (d.tl.includes(full)) s *= 1.35; else if (d.kw.includes(full) || d.sl.includes(full)) s *= 1.15; }
    const tt = d.tl.replace(/[.\s]+$/, "").replace(/^the /, "");
    if (tt === full) s *= 1.6; else if (tt.startsWith(full)) s *= 1.2;
    // a title that is about the query: the share of its own words the query matches, times the share of the query found in it
    if (d.tl && gs.length) { const tw = [...new Set(toks(d.tl).filter(w => !STOP.has(w)).map(stem))]; if (tw.length) { const inT = gs.filter(G => tw.some(x => G.has(x))).length; s *= 1 + .6 * (tw.filter(x => gs.some(G => G.has(x))).length / tw.length) * (inT / gs.length); } }
    if (d.o) s *= .35;
    if (d.k === "s") s *= .6;
    if (d.k === "m") s *= .8;
    if (d.k === "a") s *= 1 + .05 * Math.log2(1 + d.nb);
    if (boost.has(d.k + ":" + d.id)) s *= 1.3;
    res.push([s, d]);
  });
  res.sort((a, b) => b[0] - a[0]);
  out.total = res.length; out.hits = res.slice(0, 60).map(r => r[1]); out.score = new Map(res.slice(0, 60).map(([s, d]) => [d, s]));
  return out;
}
// the paragraph of an article that best matches, with its clause id (for the link) when it has one
function bestPara(d, terms) {
  if (!d.paras || !d.paras.length) return null;
  const T = new Set(terms.map(stem)), ids = clauseIds(d.paras);
  let bi = -1, bs = 0;
  d.paras.forEach(([, s], i) => { const ws = toks(plain(s)); let n = 0; new Set(ws.map(stem)).forEach(x => { if (T.has(x)) n++; }); if (n > bs) { bs = n; bi = i; } });
  if (bi < 0) return null;
  let id = ""; for (let i = bi; i >= 0 && !id; i--) id = ids[i];
  return { i: bi, txt: plain(d.paras[bi][1]), c: d.paras.length > 1 ? id : "" };
}
function snippet(d, terms, src0) {
  const src = src0 || d.body; if (!src) return "";
  const low = norm(src); let i = -1;
  for (const t of terms) { const m = new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").exec(low); if (m) { i = m.index; break; } }
  if (i < 0) return esc(src.slice(0, 150)) + (src.length > 150 ? "…" : "");
  const s = Math.max(0, i - 60), e = Math.min(src.length, i + 120);
  return (s ? "…" : "") + highlight(esc(src.slice(s, e)), terms) + (e < src.length ? "…" : "");
}

/* ================= router ================= */
const view = $("#view");
let route = { name: "home" }, HL = null, themeCtx = null, lastKey = "";
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ""));
  let m;
  if (!h) return { name: "home" };
  const simple = { preamble: "pre", contents: "contents", schedules: "contents", themes: "themes", amendments: "amend", "next-amendment": "next", glossary: "glossary", saved: "saved", about: "about" };
  if (simple[h]) return { name: simple[h], tab: h === "schedules" ? "sch" : null };
  if ((m = h.match(/^amend-(\d+)$/))) return { name: "amend", id: +m[1] };
  if ((m = h.match(/^basic-structure(?:-([a-z]+))?$/))) return { name: "bs", f: m[1] || null };
  if ((m = h.match(/^theme-([a-z]+)$/))) return THEME_BY.has(m[1]) ? { name: "theme", id: m[1] } : { name: "themes" };
  if ((m = h.match(/^part-([IVXL]+[A-C]?)$/))) return PART_BY.has(m[1]) ? { name: "part", id: m[1] } : { name: "contents" };
  if ((m = h.match(/^art-([^.]+)(?:\.([0-9A-Za-z.]+))?$/))) { const k = findArt(m[1]); return k ? { name: "art", id: k, c: m[2] || null } : { name: "contents" }; }
  if ((m = h.match(/^sch-([A-Z]+)(?:-b(\d+))?$/))) return SCH_BY.has(m[1]) ? { name: "sch", id: m[1], b: m[2] ? +m[2] : null } : { name: "contents" };
  if (/^apx-/.test(h)) return { name: "contents", tab: "sch" }; /* the Appendices were removed; old links land on the Schedules */
  if ((m = h.match(/^g-(.+)$/))) return { name: "glossary", term: m[1] };
  return { name: "home" };
}
const needsText = () => ["art", "sch", "part", "theme", "glossary", "pre", "bs", "next"].includes(route.name);
const NAVKEY = { home: "home", contents: "contents", part: "contents", art: "contents", pre: "contents", sch: "contents", themes: "themes", theme: "themes", amend: "amend", next: "amend", bs: "bs", glossary: "glossary", saved: "saved", about: "about" };
const TITLES = { home: "Constitution of India", contents: "Contents", themes: "Themes", amend: "Amendments", next: "The next amendment", bs: "The basic structure", glossary: "Glossary", saved: "Saved", pre: "Preamble", about: "How this was made" };

/* each history entry gets a number; going back or forward to one restores where you were on it */
let POS = {}, NAVI = 0, pendingFrom = null, wantY = null, savePosT = 0;
try { POS = JSON.parse(sessionStorage.getItem("pos") || "{}"); NAVI = +sessionStorage.getItem("navi") || 0; } catch (e) {}
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
const routeLabel = r => r.name === "art" ? "Article " + r.id : r.name === "sch" ? schName(r.id) : r.name === "pre" ? "the Preamble" : "";
function render(keepScroll) {
  if (needsText() && !TEXT) ensureText();
  if (!keepScroll) {
    const st = history.state;
    if (!st || st.i == null) { history.replaceState({ i: ++NAVI, from: pendingFrom }, ""); wantY = null; }
    else wantY = POS[st.i] != null ? POS[st.i] : null;
    pendingFrom = null;
  }
  route = parseHash();
  closePop(); closeSide(); closeMenu(); closeMore(false); stopSpeak(); selClause = null; $("#cbar").hidden = true; const kb = $("#kbd"); if (kb) kb.remove();
  const r = route, key = location.hash;
  if (r.name === "home") themeCtx = null;
  const V = { home: vHome, contents: vContents, part: vPart, art: vArt, pre: vPre, sch: vSch, themes: vThemes, theme: vTheme, amend: vAmend, next: vNext, bs: vBS, glossary: vGlossary, saved: vSaved, about: vAbout }[r.name] || vHome;
  const y = window.scrollY;
  termSeen = new Set();
  view.innerHTML = `<div class="view">${V(r)}</div>`;
  $$("[data-nav]").forEach(a => a.setAttribute("aria-current", a.dataset.nav === NAVKEY[r.name] ? "page" : "false"));
  $("#morebtn").setAttribute("aria-current", MORE.some(m => m[0] === NAVKEY[r.name]) ? "true" : "false");
  document.title = (r.name === "art" ? `Article ${r.id}: ${ART.get(r.id).t.replace(/\.$/, "")}` : r.name === "part" ? `Part ${r.id}: ${PARTS[PART_BY.get(r.id)].t}` : r.name === "sch" ? schName(r.id) : r.name === "theme" ? THEME_BY.get(r.id).t : TITLES[r.name] || "Constitution of India") + (r.name === "home" ? "" : " · Constitution of India");
  after(r, keepScroll ? y : null, key !== lastKey);
  lastKey = key;
  const fr = history.state && history.state.from, bc = $("#backchip");
  if (fr) { bc.querySelector("span").textContent = "Back to " + fr.l; bc.hidden = !$("#cbar").hidden; } else bc.hidden = true;
}

/* ================= views ================= */
function vHome() {
  const recent = store.get("recent", []).filter(n => ART.has(n)).slice(0, 6);
  const saved = savedList();
  const popular = [["art-14", "Equality before law"], ["art-19", "Freedom of speech"], ["art-21", "Life and liberty"], ["art-326", "Voting age"], ["theme-lawmaking", "How laws are made"], ["art-356", "President's rule"], ["art-51A", "Fundamental duties"], ["art-279A", "GST Council"]];
  return `
  <section class="hero"><canvas id="heroquilt" aria-hidden="true"></canvas><div class="wrap hero-in">
    <div class="mark">${quiltBlock(7)}</div>
    <h1>The Constitution of India</h1>
    <p class="lede">Every article in the official words, with a plain-English summary to help you understand it.</p>
    <button class="spot" type="button" data-search>${I.search}<span>Search articles, topics or questions</span><kbd>/</kbd></button>
    <div class="pills">${popular.map(([h, t]) => `<a class="pill" href="#${h}">${esc(t)}</a>`).join("")}</div>
    <p class="asof">Text as on ${esc(CORE.meta.asOn)} · includes amendments up to the ${esc(CORE.meta.upTo.replace(/^Constitution \(/, "").replace(/\) Act/, " Act"))}</p>
  </div></section>
  ${recent.length || saved.length ? `<section class="wrap"><div class="card" style="padding:14px 18px"><div class="resume">${saved.length ? `<span class="eyebrow">Saved</span>${saved.slice(0, 6).map(n => `<a class="pill" href="#art-${n}">Article ${n}</a>`).join("")}` : ""}${recent.length ? `<span class="eyebrow" style="margin-left:${saved.length ? 10 : 0}px">Continue reading</span>${recent.map(n => `<a class="pill" href="#art-${n}">Article ${n}</a>`).join("")}` : ""}</div></div></section>` : ""}
  <section class="wrap sec">
    <div class="sh"><div><h2>Start with a question</h2><p>The articles on one subject, in reading order, each with a plain-English summary.</p></div><a class="more" href="#themes">All ${THEMES.length} themes ${I.chev}</a></div>
    <div class="themes home-themes">${THEMES.slice(0, 8).map(themeCard).join("")}</div>
  </section>
  <section class="wrap sec">
    <div class="card preamble">
      ${chakra("bg")}
      <div class="eyebrow">The Preamble</div>
      <div class="pt">${preHTML(false)}</div>
      <a class="btn" href="#preamble" style="margin-top:14px">Read with official notes ${I.chev}</a>
    </div>
  </section>
  <section class="wrap sec">
    <div class="sh"><div><h2>Did you know?</h2><p>Facts worked out from the text itself.</p></div><div class="fnav" role="group" aria-label="Scroll the facts"><button type="button" data-fscroll="-1" aria-label="Previous facts" disabled>${I.chev}</button><button type="button" data-fscroll="1" aria-label="More facts">${I.chev}</button></div></div>
    <div class="factwrap">
      <button class="fact shuffle" type="button" data-random>${I.shuffle.replace("<svg", '<svg width="28" height="28"')}<b>Surprise me</b><small>Open a random article in force.</small></button>
      <div class="facts" role="region" aria-label="Facts about the Constitution" tabindex="0">${CORE.facts.map(f => `<a class="fact" href="${f.h}"><b>${esc(f.v)}</b><span>${esc(f.l)}</span><small>${esc(f.x)}</small></a>`).join("")}</div>
    </div>
  </section>
  <section class="wrap sec">
    <div class="sh"><div><h2>Browse by Part</h2><p>The Constitution is arranged in Parts, each covering one area of government.</p></div><a class="more" href="#contents">Full contents ${I.chev}</a></div>
    ${cols2(PARTS.map(p => partRow(p)))}
  </section>
  <section class="wrap sec">
    <div class="sh"><div><h2>Schedules</h2><p>Lists, tables and forms at the end of the Constitution.</p></div><a class="more" href="#schedules">All Schedules ${I.chev}</a></div>
    ${cols2(SCH.map((s, i) => schRow(s, i)))}
  </section>
  <section class="wrap sec">
    <div class="sh"><div><h2>How the text has changed</h2><p>Each bar is a Constitution Amendment Act mentioned in the official notes. Taller bars changed more provisions.</p></div><a class="more" href="#amendments">All amendments ${I.chev}</a></div>
    <div class="card chart" id="homechart" style="min-height:260px"></div>
    <h3 class="subhd">Most amended articles</h3>
    ${(() => { const top = ORDER.filter(n => !ART.get(n).o).sort((x, y) => ART.get(y).c - ART.get(x).c || ART.get(x).i - ART.get(y).i).slice(0, 10); return cols2(top.map(n => { const a = ART.get(n); return `<a class="row" href="#art-${n}"><span class="num">${n}</span><span><span class="tt">${esc(a.t.replace(/\.$/, ""))}</span><span class="ss" style="-webkit-line-clamp:1">Part ${PARTS[a.p].n} · ${esc(PARTS[a.p].t)}</span></span><span class="aux">${a.c} official notes ${I.chev}</span></a>`; })); })()}
  </section>
  <section class="wrap sec">
    <div class="sh"><div><h2>The basic structure</h2><p>What Parliament cannot change even by amending the Constitution, as the Supreme Court has held since 1973, with our estimate for every provision.</p></div><a class="more" href="#basic-structure">Explore ${I.chev}</a></div>
    <a class="card bshome" href="#basic-structure">${ANA}${bsCap()}<div class="bsbar" aria-hidden="true">${CORE.bsc.map((n, i) => `<span class="b${i}" style="flex:${n}"></span>`).join("")}</div>${bsLegend(CORE.bsc)}</a>
  </section>
  </section>`;
}
function themeCard(t) {
  const n = t.i.length;
  return `<a class="theme" href="#theme-${t.id}"><span class="ico c-${t.c}">${I[t.ic] || I.book}</span><div><h3>${esc(t.q)}</h3><p>${esc(t.t)}</p></div><div class="ft">${anaTheme(t) ? ANA : ""}<span>${n} provisions</span>${I.chev.replace("<svg", '<svg width="14" height="14"')}</div></a>`;
}
/* a two-column list whose rows line up across the columns: it fills the first column, then the second,
   and each row is as tall as the taller of its two items. Stacks into one list on narrow screens. */
function cols2(rows) {
  const R = Math.ceil(rows.length / 2);
  return `<div class="cgrid" style="grid-template-rows:repeat(${R},auto)">${rows.map((h, i) => {
    const c = [i === 0 && "t1", i === R - 1 && "b1", i === R && "t2", i === rows.length - 1 && "b2"].filter(Boolean).join(" ");
    return c ? h.replace('class="row', 'class="row ' + c) : h;
  }).join("")}</div>`;
}
function partRow(p) {
  const i = PART_BY.get(p.n), r = partRange(p);
  return `<a class="row${p.o ? " o" : ""}" href="#part-${p.n}"><span class="num tile" style="--pc:${partText(i)}">${p.n}</span><span><span class="tt">${esc(p.t)}</span><span class="ss" style="-webkit-line-clamp:1">${p.o ? "Omitted" : r.range}</span></span><span class="aux">${I.chev}</span></a>`;
}
function schRow(s, i) {
  return `<a class="row" href="#sch-${s.k}"><span class="num">${i + 1}</span><span><span class="tt">${esc(s.t)}</span><span class="ss" style="-webkit-line-clamp:1">${schName(s.k)}</span></span><span class="aux">${I.chev}</span></a>`;
}
function preHTML(notes) {
  return CORE.pre.p.map(([, t]) => {
    let h = notes ? rich(t, "pre", HL) : esc(plain(t));
    h = h.replace(/^(JUSTICE|LIBERTY|EQUALITY|FRATERNITY)/, '<span class="cap">$1</span>');
    return `<p>${h}</p>`;
  }).join("");
}

function amdChart(sel) {
  const compact = document.documentElement.clientWidth < 640;
  const W = compact ? 360 : 1000, H = compact ? 230 : 260, L = compact ? 24 : 36, R = compact ? 4 : 8, T = 30, B = 40, maxN = 106, CAP = 20;
  const bw = (W - L - R) / maxN;
  const x = n => L + (n - 1) * bw, y = v => T + (H - T - B) * (1 - Math.min(v, CAP) / CAP);
  let g = "", ax = "", lab = "";
  for (let v = 0; v <= CAP; v += 5) { g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`; ax += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }
  (compact ? [1, 25, 50, 75, 106] : [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 106]).forEach(n => { const a = AMD_BY.get(n), cx = n === 106 ? x(n) + bw : x(n) + bw / 2, an = n === 106 ? "end" : "middle"; ax += `<text x="${cx}" y="${H - B + 17}" text-anchor="${an}">${nth(n)}</text>`; if (a) ax += `<text x="${cx}" y="${H - B + 33}" text-anchor="${an}" style="font-size:11px">${a.y}</text>`; });
  const outs = AMD.filter(a => a.refs.length > CAP).map(a => a.n);
  const bars = AMD.map(a => {
    if (a.nc) { const cx = x(a.n) + bw / 2; return `<circle class="nc${sel === a.n ? " on" : ""}" data-n="${a.n}" cx="${cx.toFixed(1)}" cy="${(y(0) - 5).toFixed(1)}" r="${compact ? 1.8 : 3}"><title>${nth(a.n)} Amendment, ${a.y}: no longer mentioned in the official notes</title></circle>`; }
    const v = a.refs.length, gap = compact ? .6 : 2, bx = x(a.n) + gap / 2, w = Math.max(1, bw - gap), top = y(v);
    let extra = "";
    if (v > CAP) {
      const cx = bx + w / 2;
      extra = `<path class="brk" d="M${bx - 2} ${top + 12} l${w / 2 + 2} -4 l${w / 2 + 2} 4" />`;
      const i = outs.indexOf(a.n), near = n2 => n2 != null && Math.abs(n2 - a.n) < (compact ? 14 : 8);
      const anchor = near(outs[i + 1]) ? "end" : near(outs[i - 1]) ? "start" : "middle";
      const lx = anchor === "end" ? cx + w / 2 : anchor === "start" ? cx - w / 2 : cx;
      lab += `<text class="ol" x="${lx}" y="${top - 6}" text-anchor="${anchor}">${nth(a.n)}: ${v}</text>`;
    }
    return `<rect class="b${sel === a.n ? " on" : ""}" data-n="${a.n}" x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(y(0) - top).toFixed(1)}" rx="1.5"><title>${nth(a.n)} Amendment, ${a.y}: ${v} provision${v === 1 ? "" : "s"}</title></rect>${extra}`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Number of provisions changed by each amendment Act. Scale capped at ${CAP}; three Acts go beyond it."><g class="gl">${g}</g><g class="ax">${ax}</g>${bars}<g class="ax">${lab}</g></svg><p class="chart-note">Scale stops at ${CAP} so smaller amendments stay visible. Broken bars go beyond it and show their real totals. Hollow dots are Acts no official note mentions any more.</p>`;
}

/* ---- contents ---- */
function vContents(r) {
  const tab = r.tab || "parts";
  return `<section class="wrap">
    <div class="ph"><h1 class="lt">Contents</h1><p class="sub">The whole Constitution in its own order. Type to filter by number or title.</p></div>
    <div class="toolbar">
      <label class="filter" style="flex:1 1 300px">${I.search}<span class="sr">Filter articles</span><input id="cfilter" type="search" placeholder="Filter, e.g. 21 or election" autocomplete="off"></label>
      <div class="seg" role="group" aria-label="Show"><button type="button" data-ctab="parts" aria-pressed="${tab === "parts"}">Parts</button><button type="button" data-ctab="sch" aria-pressed="${tab === "sch"}">Schedules</button></div>
      <button class="btn" type="button" data-expand>Expand all</button>
    </div>
    <div id="ctree">${tab === "sch" ? schTree() : partTree()}</div>
  </section>`;
}
function partTree(openAll) {
  let h = `<div class="group" style="margin-bottom:10px"><a class="row pre-row" href="#preamble"><span class="num tile" style="--pc:var(--saffron)" aria-hidden="true">${I.quote}</span><span><span class="tt">Preamble</span><span class="ss">We, the People of India</span></span><span class="aux">${I.chev}</span></a></div>`;
  PARTS.forEach((P, i) => {
    const r = partRange(P);
    let inner = "";
    P.ch.forEach(C => {
      if (C.n) inner += `<div class="chh">Chapter ${C.n} · ${esc(C.t || "")}</div>`;
      C.s.forEach(S => {
        if (S.t) inner += `<div class="subh">${esc(S.t)}</div>`;
        S.a.forEach(n => { const a = ART.get(n); inner += `<a class="trow${a.o ? " o" : ""}" href="#art-${n}" data-f="${esc((n + " " + a.t).toLowerCase())}"><b>${n}</b><span>${esc(a.t)}${a.o ? ' <span class="tag o">Omitted</span>' : ""}</span></a>`; });
      });
    });
    if (!r.nums.length) inner = `<div class="empty">This Part has been omitted.</div>`;
    h += `<details class="pt-g" style="--pc:${partText(i)}"${openAll ? " open" : ""}><summary><span class="pn">${P.n}</span><span><span class="tt">${esc(P.t)}</span><span class="ss">${P.o ? "Omitted" : r.range + " · " + r.live.length + " in force"}</span></span>${I.chev.replace("<svg", '<svg class="chev"')}</summary><div class="inner"><a class="trow" href="#part-${P.n}" style="color:var(--navy)"><b></b><span>Overview of Part ${P.n} ${I.chev.replace("<svg", '<svg width="12" height="12"')}</span></a>${inner}</div></details>`;
  });
  return h;
}
function schTree() {
  return `<div class="group">${SCH.map((s, i) => `<a class="row" href="#sch-${s.k}" data-f="${esc((schName(s.k) + " " + s.t).toLowerCase())}"><span class="num">${i + 1}</span><span><span class="tt">${esc(schName(s.k))}</span><span class="ss">${esc(s.t)}</span></span><span class="aux">${I.chev}</span></a>`).join("")}</div>
`;
}
function filterContents(q) {
  q = q.trim().toLowerCase();
  const tree = $("#ctree"); if (!tree) return;
  let shown = 0;
  $$("details.pt-g", tree).forEach(d => {
    let any = false;
    $$(".trow[data-f]", d).forEach(a => { const ok = !q || a.dataset.f.includes(q) || a.dataset.f.split(" ")[0] === q; a.hidden = !ok; if (ok) any = true; });
    $$(".subh,.chh,.trow:not([data-f])", d).forEach(e => e.hidden = !!q);
    const title = d.querySelector("summary .tt").textContent.toLowerCase();
    const match = !q || any || title.includes(q);
    d.hidden = !match;
    if (q && any) d.open = true;
    if (match) shown++;
  });
  $$(".row[data-f]", tree).forEach(a => { const ok = !q || a.dataset.f.includes(q); a.hidden = !ok; if (ok) shown++; });
  let e = $("#cempty"); if (!e) { tree.insertAdjacentHTML("beforeend", '<div id="cempty" class="empty" hidden></div>'); e = $("#cempty"); }
  e.hidden = shown > 0; e.innerHTML = `Nothing matches “${esc(q)}”. <button class="btn" type="button" data-search-q="${esc(q)}">Search the full text instead</button>`;
}

/* ---- part ---- */
function vPart(r) {
  const i = PART_BY.get(r.id), P = PARTS[i], pr = partRange(P), prev = PARTS[i - 1], next = PARTS[i + 1];
  let body = "";
  P.ch.forEach(C => {
    if (C.n) body += `<h2 style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin:28px 0 10px">Chapter ${C.n} · ${esc(C.t || "")}</h2>`;
    C.s.forEach(S => {
      if (S.t) body += `<div class="eyebrow" style="margin:20px 0 8px 4px">${esc(S.t)}</div>`;
      body += `<div class="group" style="margin-bottom:10px">${S.a.map(n => artRow(n)).join("")}</div>`;
    });
  });
  if (!pr.nums.length) body = `<div class="status">${I.info}<div>This Part has been omitted. ${P.f.map(f => esc(f[1])).join(" ")}</div></div>`;
  return `<section class="wrap col">
    <div class="ph">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#contents">Contents</a>${I.chev}<span>Part ${P.n}</span></nav>
      <div class="eyebrow" style="color:${partText(i)};font-size:15px">Part ${P.n}</div>
      <h1 class="lt">${esc(P.t)}</h1>
      <p class="sub">${pr.range}${pr.nums.length ? ` · ${pr.live.length} in force${pr.nums.length - pr.live.length ? `, ${pr.nums.length - pr.live.length} omitted` : ""}` : ""}</p>
    </div>
    ${P.s && !P.o ? `<div class="plain"><div class="lb"><span>In plain words</span><small>Summary, not the legal text</small></div><p>${lx(P.s)}</p></div>` : ""}
    ${P.f.length && pr.nums.length ? `<div class="notice">${I.info}<div><b>From the official notes</b>${P.f.map(f => `${esc(f[0])}: ${linkAmd(esc(f[1]))}`).join("<br>")}</div></div>` : ""}
    ${body}
    <nav class="pager">${prev ? `<a href="#part-${prev.n}"><small>← Part ${prev.n}</small><span>${esc(prev.t)}</span></a>` : `<a href="#preamble"><small>← Preamble</small><span>We, the people of India</span></a>`}${next ? `<a class="nx" href="#part-${next.n}"><small>Part ${next.n} →</small><span>${esc(next.t)}</span></a>` : `<a class="nx" href="#sch-FIRST"><small>Schedules →</small><span>First Schedule</span></a>`}</nav>
  </section>`;
}
function artRow(n, sumOverride) {
  const a = ART.get(n), t = TEXT && TEXT.a[n];
  const s = sumOverride || (t && t.s) || "";
  return `<a class="row${a.o ? " o" : ""}" href="#art-${n}"><span class="num">${n}</span><span><span class="tt">${esc(a.t)}</span>${a.o ? `<span class="ss">Omitted</span>` : s ? `<span class="ss">${esc(s)}</span>` : ""}</span><span class="aux">${I.chev}</span></a>`;
}

/* ---- article ---- */
function sidebar(curId, kind) {
  const cur = kind === "art" ? LOC.get(curId) : null;
  let h = `<label class="filter">${I.search}<span class="sr">Filter contents</span><input id="sfilter" type="search" placeholder="Jump to article" autocomplete="off"></label>`;
  h += `<a class="top" href="#preamble"${kind === "pre" ? ' aria-current="page"' : ""}>Preamble</a>`;
  PARTS.forEach((P, pi) => {
    const open = cur && cur.pi === pi;
    const rg = partRange(P).range;
    h += `<details${open ? " open" : ""} data-p="${pi}"><summary><b>${P.n}</b><span>${esc(P.t)}<small>${P.o ? "Omitted" : rg}</small></span>${I.chev}</summary>${open ? sideItems(pi, curId) : ""}</details>`;
  });
  h += `<details${kind === "sch" ? " open" : ""}><summary><b>§</b><span>Schedules<small>First to Twelfth</small></span>${I.chev}</summary>${SCH.map((s, i) => `<a class="sl" href="#sch-${s.k}" data-f="${esc(schName(s.k).toLowerCase())}"${kind === "sch" && curId === s.k ? ' aria-current="page"' : ""}><b>${i + 1}</b><span>${esc(schName(s.k))}</span></a>`).join("")}</details>`;
  return `<aside class="side" id="side" aria-label="Contents">${h}</aside>`;
}
function sideItems(pi, curId) {
  let inner = "";
  PARTS[pi].ch.forEach(C => C.s.forEach(S => {
    if (S.t) inner += `<div class="sg">${esc(S.t)}</div>`;
    S.a.forEach(n => { const a = ART.get(n); inner += `<a class="sl${a.o ? " o" : ""}" href="#art-${n}" data-f="${esc((n + " " + a.t).toLowerCase())}"${n === curId ? ' aria-current="page"' : ""}><b>${n}</b><span>${esc(a.t)}</span></a>`; });
  }));
  return inner;
}
function fillSide(all) { $$("#side details[data-p]").forEach(d => { if (!d.dataset.filled && (all || d.open) && !d.querySelector(".sl")) { d.insertAdjacentHTML("beforeend", sideItems(+d.dataset.p)); } d.dataset.filled = d.querySelector(".sl") ? 1 : ""; }); }
document.addEventListener("toggle", e => { if (e.target.matches && e.target.matches("#side details[data-p]") && e.target.open) fillSide(false); }, true);
/* where each amendment note applies: the passages its bracketed span covers, and a readable label */
const nwords = s => { const w = plain(s).replace(/[\[\]]/g, "").split(" ").filter(Boolean); return w.length > 8 ? w.slice(0, 8).join(" ") + "…" : w.join(" "); };
function scopeNotes(texts, loc, notes, whole) {
  const sc = {}, span = {}, stack = [];
  texts.forEach((s, i) => {
    const re = /\{(\d+)\}(\[)?|\[|\]/g; let m;
    stack.forEach(e => e.k && (sc[e.k] = sc[e.k] || new Set()).add(i));
    while ((m = re.exec(s))) {
      if (m[1]) { (sc[m[1]] = sc[m[1]] || new Set()).add(i); if (m[2]) stack.push({ k: m[1], i, at: re.lastIndex }); else span[m[1]] = { i, txt: "" }; }
      else if (m[0] === "[") stack.push({ k: 0 });
      else { const e = stack.pop(); if (e && e.k && e.i === i && !span[e.k]) span[e.k] = { i, txt: s.slice(e.at, m.index) }; }
    }
  });
  const flat = s => plain(s).replace(/[\[\]]/g, "").trim();
  const out = {};
  Object.entries(sc).forEach(([k, set]) => {
    const idx = [...set].sort((a, b) => a - b), sp = span[k];
    let where;
    if (idx.length === 1 && sp && flat(texts[idx[0]]) !== flat(sp.txt)) {
      const l = loc(idx[0]), w = nwords(sp.txt), raw = flat(sp.txt), ent = /^(entry|paragraph) /.test(l);
      let m;
      if (ent && (m = raw.match(/^(\d+[A-Z]*)\.\s/))) where = l.replace(/^(entry|paragraph) \S+/, "$1 " + m[1]);
      else if (ent && (m = raw.match(/^(\d+[A-Z]*)\s*\*/))) where = "the omitted " + l.replace(/^(entry|paragraph) \S+/, "$1 " + m[1]);
      else if ((m = raw.match(/^\(([a-z]{1,3}|\d+[A-Z]*)\)/)) && l.endsWith("(" + m[1] + ")")) where = l;
      else where = (!w ? "an omission" : /^[\d,]+$/.test(raw) ? `the number “${w}”` : `the words “${w}”`) + (l ? " in " + l : "");
    } else {
      let ls = [...new Set(idx.map(loc))].filter(Boolean);
      ls = ls.filter(l => !ls.some(o => o !== l && l.startsWith(o + "(")) && !(l.startsWith(PROV) && ls.includes(l.slice(PROV.length))));
      const G = new Map(), rest = [];
      const rows = ls.filter(l => l.startsWith("the row for ")).map(l => l.slice(12));
      if (rows.length) ls = ls.filter(l => !l.startsWith("the row for ") && l !== "the table");
      if (rows.length) rest.push(rows.length === 1 ? "the row for " + rows[0] : rows.length <= 3 ? "the rows for " + rows.join(rows.length > 2 ? ", " : " and ").replace(/, ([^,]*)$/, " and $1") : rows.length <= 6 ? `${rows.length} rows, from ${rows[0]} to ${rows[rows.length - 1]}` : "?");
      ls.forEach(l => { const m = l.match(/^(clause|paragraph|entry) (\(?\w+\)?(?:\(\w+\))?)$/); if (m) { if (!G.has(m[1])) G.set(m[1], []); G.get(m[1]).push(m[2]); } else rest.push(l); });
      const pl = k => k === "entry" ? "entries" : k + "s";
      const parts = [...G].map(([k, v]) => v.length === 1 ? k + " " + v[0] : v.length > 4 ? `${pl(k)} ${v[0]} to ${v[v.length - 1]}` : pl(k) + " " + v.join(v.length > 2 ? ", " : " and ").replace(/, ([^,]*)$/, " and $1")).concat(rest);
      where = parts.includes("?") ? "" : parts.length ? parts.join(" and ") : texts.length === 1 ? whole : `the words “${nwords(texts[idx[0]])}”`;
    }
    out[k] = { idx, where };
  });
  (notes || []).forEach((f, i) => { if (!out[i + 1] && /^(The )?[A-Z][a-z]+ Schedule\b.*\b(added|ins|subs)/i.test(f)) out[i + 1] = { idx: [], where: "the whole Schedule", none: 1 }; });
  return out;
}
function noteScopes(t) {
  const head = i => plain(t.p[i][1]).replace(/^[\[\]*\s]+/, "");
  const num = i => (head(i).match(/^\((\d+[A-Z]*)\)/) || [])[1];
  const sub = i => (head(i).match(/^\(([a-z]{1,3})\)/) || [])[1];
  const loc = i => {
    const x = head(i);
    if (num(i)) return "clause (" + num(i) + ")";
    let clause = "", prov = false;
    for (let j = i - 1; j >= 0; j--) { if (/^Provided/.test(head(j))) prov = true; if (num(j)) { clause = num(j); break; } }
    if (/^Provided/.test(x)) return clause ? PROV + "clause (" + clause + ")" : "the \u201cProvided that\u201d part";
    if (/^Explanation/.test(x)) return "the Explanation";
    if (sub(i)) return prov ? (clause ? PROV + "clause (" + clause + ")" : "the \u201cProvided that\u201d part") : clause ? `clause (${clause})(${sub(i)})` : "clause (" + sub(i) + ")";
    return clause ? "clause (" + clause + ")" : "";
  };
  const out = scopeNotes(t.p.map(p => p[1]), loc, t.f, "the article");
  (t.h || []).forEach(k => out[k] = { idx: [], where: "the heading" });
  return out;
}
function blockScopes(blocks, notes, noun = "paragraph") {
  const txt = b => b.h != null ? b.h : b.ref != null ? b.ref : b.p != null ? b.p : (b.r || []).join(" ");
  const head = i => plain(txt(blocks[i])).replace(/^[\[\]*\s]+/, "");
  const loc = i => {
    const b = blocks[i];
    if (b.r) { const nm = nwords(plain(b.r[0]).replace(/^[\d.\s\[\]*]+/, "")); return nm && nm.split(" ").length <= 6 ? `the row for ${nm}` : "the table"; }
    let para = "", sub = "", list = "";
    for (let j = i; j >= 0; j--) {
      const bj = blocks[j], x = head(j);
      if (!sub && j === i && !bj.h) { const m = x.match(/^\((\d+|[a-z]{1,3})\)/); if (m) sub = m[1]; }
      if (!para && !bj.h && !bj.r) { const m = x.match(/^(\d+[A-Z]*)\.\s/); if (m) para = m[1]; }
      if (bj.h != null && /^(PART|List)\b/i.test(x)) { list = x.match(/^((?:PART|List)\s+[A-Z0-9IVX]+)/i)?.[1] || ""; break; }
    }
    if (b.h != null) return "";
    if (list && /^List/i.test(list) && para) return `entry ${para} of ${list}`;
    return para ? `${noun} ${para}${sub ? "(" + sub + ")" : ""}` : "";
  };
  return scopeNotes(blocks.map(txt), loc, notes, "the text");
}
const isNotice = f => /struck down|declared void|unconstitutional and void|cease to be operative|shall cease|held to be|declared invalid/i.test(f);
/* Words the Supreme Court has declared invalid (data/struck.json, checked against each judgment): one box near the top of the page
   and a label on the paragraphs themselves. The official text is shown unchanged. */
const sdList = (kind, key) => (CORE.struck && CORE.struck[kind + ":" + key]) || [];
function sdMarks(L) {
  const tag = {}, set = new Set();
  L.forEach(e => e.i.forEach((i, j) => { set.add(i); if (e.tag && (j === 0 || e.i[j - 1] !== i - 1)) (tag[i] = tag[i] || []).includes(e.tag) || (tag[i] = (tag[i] || []).concat(e.tag)); }));
  return { set, tag: Object.fromEntries(Object.entries(tag).map(([i, t]) => [i, `<span class="sdtag">${esc(t.length > 1 && t.every(x => x.replace(/ \d{4}$/, "") === t[0].replace(/ \d{4}$/, "")) ? t[0].replace(/ \d{4}$/, "") + " " + t.map(x => x.slice(-4)).join(" and ") : t.join(" · "))}</span>`])) };
}
const sdBox = L => !L.length ? "" : `<div class="notice sd" role="note">${I.gavel}<div><b class="k">${L.every(e => e.part) ? "Struck down in part by the Supreme Court" : "Struck down by the Supreme Court"}</b>${L.map(e => `<p>${lx(e.say)}</p>${e.why ? `<p class="why"><b>Why:</b> ${lx(e.why)}</p>` : ""}<p class="src">Source: ${esc(e.src.join("; "))}</p>`).join("")}<p class="sdl">${L.some(e => e.i.length) ? `<button class="lnk" type="button" data-goto-p="${Math.min(...L.flatMap(e => e.i))}">Show in the text</button>` : ""}<a class="lnk" href="#basic-structure-struck">All amendments the Court has struck down</a></p></div></div>`;
function gotoPara(i) {
  const el = document.querySelector(`#text [data-i="${i}"], #view .blocks #b-${i}`); if (!el) return;
  const tg = el.previousElementSibling && el.previousElementSibling.classList.contains("sdtag") ? el.previousElementSibling : el;
  tg.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  let done = false; const fl = () => { if (done) return; done = true; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); };
  addEventListener("scrollend", fl, { once: true }); setTimeout(fl, 1500);
}
function vArt(r) {
  const n = r.id, a = ART.get(n), loc = LOC.get(n), Pt = PARTS[loc.pi], C = Pt.ch[loc.ci], S = C.s[loc.si];
  const prev = ORDER[a.i - 1], next = ORDER[a.i + 1];
  pushRecent(n);
  const t = artText(n);
  const saved = savedList().includes(n);
  let main;
  if (!t) main = textErr ? errBox() : loadBox();
  else {
    const SD = sdList("a", n), SDM = sdMarks(SD);
    const notices = t.f.map((f, i) => [i + 1, f]).filter(([, f]) => isNotice(f) && !(SD.length && /struck down|invalid|void|unconstitutional/i.test(f)));
    const SC = noteScopes(t), pin = {};
    notices.forEach(([k]) => (SC[k] ? SC[k].idx : []).forEach(i => pin[i] = (pin[i] || []).concat(k)));
    const th = themeCtx && THEME_BY.get(themeCtx);
    const ti = th ? th.i.indexOf("art-" + n) : -1;
    main = "";
    if (th && ti >= 0) {
      const nx = th.i[ti + 1];
      main += `<div class="themebar"><span>Theme: <a href="#theme-${th.id}">${esc(th.t)}</a> · ${ti + 1} of ${th.i.length}</span>${nx ? `<a href="${itemHref(nx)}">Next: ${esc(itemLabel(nx))} →</a>` : `<a href="#theme-${th.id}">Back to theme</a>`}</div>`;
    }
    if (t.s) main += `<div class="plain"><div class="lb"><span>In plain words</span><small>Summary, not the legal text · <a href="#about">How this was made</a></small></div><p>${lx(t.s)}</p></div>`;
    main += bsChip("art", n);
    main += sdBox(SD);
    if (notices.length) main += notices.map(([k, f]) => { const w = SC[k] && SC[k].where; return `<div class="notice">${I.alertc}<div><b>${w ? `Note on ${esc(w)}` : "Official note"}</b>${linkAmd(esc(f))}${w && !t.st ? `<br><button class="lnk" type="button" data-goto-fn="${k}">Show in the text</button>` : ""}</div></div>`; }).join("");
    if (t.st) main += `<div class="status">${I.info}<div><b>Omitted.</b> ${linkAmd(esc(t.st.replace(/^Omitted\.?\s*/, "")))}</div></div>`;
    else { const CID = clauseIds(t.p), anyC = CID.some(Boolean); main += `<section class="block" aria-labelledby="ot" style="margin-top:20px"><h2 id="ot">Official text${anyC ? `<small class="chint">Select a clause to link to it or cite it</small>` : ""}</h2>${t.f && t.f.length ? `<p class="nhint">The numbers in the text open its official notes. Most record when and how it was changed.</p>` : ""}<div class="text" id="text">${t.p.map(([l, s], i) => `${SDM.tag[i] || ""}<p class="l${Math.min(4, l)}${pin[i] || SDM.set.has(i) ? " noted" : ""}${CID[i] ? " hc" : ""}" data-i="${i}" data-l="${l}"${CID[i] ? ` data-c="${CID[i]}" id="c-${CID[i]}"` : ""} data-s="${SC ? Object.keys(SC).filter(k => SC[k].idx.includes(i)).join(" ") : ""}">${CID[i] ? `<button class="clk" type="button" data-clause="${CID[i]}" aria-label="Select ${clauseCite(n, CID[i])}">${I.link}</button>` : ""}${rich(s, "art", HL)}</p>`).join("")}</div></section>`; }
    main += bsBox("art", n);
    main += timelineHTML(t.f, SC, t.fh, t.h, "art");
    const themes = THEMES_OF.get("art-" + n) || [];
    if ((t.r && t.r.length) || (t.b && t.b.length) || themes.length) {
      main += `<section class="block"><h2>Connections</h2><div class="card links" style="padding:18px">`;
      if (themes.length) main += `<div><h3>In themes</h3><div class="pills">${themes.map(x => `<a class="pill" href="#theme-${x.id}" data-theme-link="${x.id}">${esc(x.t)}</a>`).join("")}</div></div>`;
      if (t.r && t.r.length) main += `<div><h3>This article refers to</h3><div class="pills">${t.r.map(k => `<a class="pill" href="#art-${k}" title="${esc(ART.get(k).t)}">Article ${k}</a>`).join("")}</div></div>`;
      if (t.b && t.b.length) main += `<div><h3>Referred to by</h3><div class="pills">${t.b.map(k => `<a class="pill" href="#art-${k}" title="${esc(ART.get(k).t)}">Article ${k}</a>`).join("")}</div></div>`;
      main += `</div></section>`;
    }
  }
  return `<div class="wrap reader">${sidebar(n, "art")}
    <article class="art">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#contents">Contents</a>${I.chev}<a href="#part-${Pt.n}">Part ${Pt.n}</a>${C.n ? I.chev + `<span>Chapter ${C.n}</span>` : ""}${S.t ? I.chev + `<span>${esc(S.t)}</span>` : ""}</nav>
      <header class="ahead">
        <div class="an art-n"><span class="anl">Article</span><span class="ann">${n}</span>${a.o ? '<span class="tag o">Omitted</span>' : ""}</div>
        <h1>${esc(a.t.replace(/\.$/, ""))}${t && t.h && t.h.length ? `<span class="hfn">${fnBtns(t.h)}</span>` : ""}</h1>
        <div class="acts">
          <button class="btn sidebtn" type="button" data-side>${I.list} Contents</button>
          <button class="btn" type="button" data-save="${esc(n)}" aria-pressed="${saved}" aria-label="${saved ? "Saved" : "Save"}">${saved ? I.bookmarkF : I.bookmark}<span class="bl">${saved ? "Saved" : "Save"}</span></button>
          ${a.o ? "" : listenBtn() + shareBtn()}
          <button class="btn" type="button" data-fs aria-label="Change text size">${I.text}<span class="bl">Text size</span></button>
        </div>
      </header>
      ${main}
      ${!t ? "" : `<nav class="pager" aria-label="Previous and next">
        ${prev ? `<a href="#art-${prev}"><small>← Article ${prev}</small><span>${esc(ART.get(prev).t)}</span></a>` : `<a href="#preamble"><small>← Preamble</small><span>We, the people of India</span></a>`}
        ${next ? `<a class="nx" href="#art-${next}"><small>Article ${next} →</small><span>${esc(ART.get(next).t)}</span></a>` : `<a class="nx" href="#sch-FIRST"><small>First Schedule →</small><span>${esc(SCH[0].t)}</span></a>`}
      </nav>`}
    </article></div>`;
}
function histHTML(f, sc) {
  if (!f || !f.length) return "";
  return `<section class="block" aria-labelledby="hh"><h2 id="hh">Amendment history <small>${f.length} official note${f.length > 1 ? "s" : ""}</small></h2><ol class="hist">${f.map((x, i) => {
    const m = x.match(/w\.?\s*e\.?\s*f\.?\s*(\d{1,2})-(\d{1,2})-(\d{4})/);
    const when = m ? `In force from ${+m[1]} ${MONTHS[+m[2] - 1] || ""} ${m[3]}` : /retrospective/i.test(x) ? "With retrospective effect" : "";
    const w = sc && sc[i + 1] && sc[i + 1].where, has = sc && sc[i + 1];
    return `<li id="fn-${i + 1}"><span>${i + 1}</span><div><span class="when">${when}${when && has ? " · " : ""}${!sc || !sc[i + 1] ? "" : !w ? `<button class="lnk" type="button" data-goto-fn="${i + 1}">Show where</button>` : sc[i + 1].none ? `<span class="whr">Applies to ${esc(w)}</span>` : `<button class="lnk" type="button" data-goto-fn="${i + 1}">${esc(w.charAt(0).toUpperCase() + w.slice(1))}</button>`}</span>${linkAmd(linkArts(esc(x)))}</div></li>`;
  }).join("")}</ol></section>`;
}
const loadBox = () => `<div class="status" style="min-height:calc(100vh - 120px);align-items:flex-start"><span class="qload" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div>Stitching the text together…</div></div>`;
const errBox = () => `<div class="status">${I.info}<div>The text didn't load. Check your connection and <button class="btn" type="button" data-retry>try again</button></div></div>`;
function itemHref(id) { const [k, v] = id.split(/-(.+)/); return k === "art" ? "#art-" + v : "#sch-" + v; }
function itemLabel(id) { const [k, v] = id.split(/-(.+)/); return k === "art" ? "Article " + v : schName(v); }

function vPre() {
  return `<div class="wrap reader">${sidebar(null, "pre")}<article class="art">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#contents">Contents</a>${I.chev}<span>Preamble</span></nav>
    <header class="ahead"><div class="an">Preamble</div><h1>We, the People of India</h1><div class="acts"><button class="btn sidebtn" type="button" data-side>${I.list} Contents</button>${listenBtn()}${shareBtn()}<button class="btn" type="button" data-fs aria-label="Change text size">${I.text}<span class="bl">Text size</span></button></div></header>
    <div class="plain"><div class="lb"><span>In plain words</span><small>Summary, not the legal text</small></div><p>The people of India give themselves this Constitution, adopted on 26 November 1949. They resolve to make India a sovereign, socialist, secular, democratic republic and to secure justice, liberty, equality and fraternity for all citizens.</p></div>${TEXT ? bsChip("art", "Preamble") : ""}
    <section class="block" style="margin-top:20px"><h2>Official text</h2>${CORE.pre.f.length ? `<p class="nhint">The numbers in the text open its official notes. Most record when and how it was changed.</p>` : ""}<div class="text pre-t" style="text-align:center">${preHTML(true)}</div></section>
    ${TEXT ? bsBox("art", "Preamble") : ""}
    ${timelineHTML(CORE.pre.f, scopeNotes(CORE.pre.p.map(p => p[1]), () => "", CORE.pre.f, "the Preamble"), CORE.pre.fh, [], "pre")}
    <nav class="pager"><span class="ph0"></span><a class="nx" href="#art-1"><small>Article 1 →</small><span>${esc(ART.get("1").t)}</span></a></nav>
  </article></div>`;
}

/* ---- schedules ---- */
function blocksHTML(blocks, ctx, hlBlock, title, SDM) {
  let h = "", rows = [];
  const tn = title ? title.toLowerCase().replace(/[^a-z]/g, "") : null;
  /* a table: the source's column headings (th), entries, and omitted entries ("* * * * *") as one full-width cell */
  const flush = () => {
    if (!rows.length) return;
    const head = rows[0][2] ? rows.shift() : null;
    h += `<div class="tbl"><table>${head ? `<thead><tr>${head[1].map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>` : ""}<tbody>${rows.map(([i, r]) => {
      if (r.length === 1) return `<tr id="b-${i}" class="om"><td colspan="2">${rich(r[0], ctx)}</td></tr>`;
      const num = /^[\d\[\]\{\}\s\*]+$/.test(r[1]) && r[1].length < 16;
      return `<tr id="b-${i}"><td>${rich(r[0], ctx)}</td><td${num ? ' class="n"' : ""}>${rich(r[1], ctx, hlBlock === i ? HL : null)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
    rows = [];
  };
  blocks.forEach((b, i) => {
    if (b.r) { if (b.th) flush(); rows.push([i, b.r, b.th]); return; }
    flush();
    const hl = hlBlock === i ? HL : null, cls = (hlBlock === i ? " blk-hl" : "") + (SDM && SDM.set.has(i) ? " noted" : "");
    if (SDM && SDM.tag[i]) h += SDM.tag[i];
    if (b.h != null && tn && i < 4 && b.h.toLowerCase().replace(/[^a-z]/g, "") === tn) return;
    if (b.h != null) h += `<h3 class="h${/^(\{\d+\})?\[?(PART|List)\b|^[IVX]+\./.test(b.h) ? " big" : /^(\{\d+\})*\[?([IVX]+|[A-Z])$/.test(b.h) ? " c" : ""}${cls}" id="b-${i}">${rich(b.h, ctx, hl)}</h3>`;
    else if (b.ref != null) h += `<p class="ref${cls}" id="b-${i}">${rich(b.ref, ctx, hl)}</p>`;
    else h += `<p class="l${Math.min(4, b.l || 0)}${cls}" id="b-${i}">${rich(b.p, ctx, hl)}</p>`;
  });
  flush();
  return `<div class="text blocks">${h}</div>`;
}
function vSch(r) {
  const k = r.id, i = SCH_BY.get(k), s = SCH[i], prev = SCH[i - 1], next = SCH[i + 1], T = TEXT && TEXT.s[k];
  const content = !T ? (textErr ? errBox() : loadBox()) : (T.f && T.f.length ? `<p class="nhint">The numbers in the text open its official notes. Most record when and how it was changed.</p>` : "") + blocksHTML(T.b, "sch", r.b, s.t, sdMarks(sdList("s", k))) + bsBox("sch", k) + histHTML(T.f, blockScopes(T.b, T.f, k === "NINTH" ? "entry" : "paragraph"));
  return `<div class="wrap reader">${sidebar(k, "sch")}<article class="art">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#schedules">Schedules</a>${I.chev}<span>${schName(k)}</span></nav>
    <header class="ahead"><div class="an">${schName(k)}</div><h1>${esc(s.t)}</h1><p class="sub" style="font-size:15px">${linkArts(esc(s.ref))}</p>
      <div class="acts"><button class="btn sidebtn" type="button" data-side>${I.list} Contents</button><button class="btn" type="button" data-fs aria-label="Change text size">${I.text}<span class="bl">Text size</span></button></div>
      ${s.sec.length ? `<div class="pills scrollrow" style="margin-top:6px">${s.sec.map(([b, l]) => `<a class="pill" href="#sch-${k}-b${b}">${esc(l)}</a>`).join("")}</div>` : ""}</header>
    ${(T && T.s) || s.s ? `<div class="plain"><div class="lb"><span>In plain words</span><small>Summary, not the legal text</small></div><p>${lx((T && T.s) || s.s)}</p></div>` : ""}${T ? bsChip("sch", k) + sdBox(sdList("s", k)) : ""}
    ${T ? `<section class="block" style="margin-top:20px"><h2>Official text</h2>${content}</section>` : content}
    <nav class="pager">${prev ? `<a href="#sch-${prev.k}"><small>← ${schName(prev.k)}</small><span>${esc(prev.t)}</span></a>` : `<a href="#art-395"><small>← Article 395</small><span>Repeals.</span></a>`}${next ? `<a class="nx" href="#sch-${next.k}"><small>${schName(next.k)} →</small><span>${esc(next.t)}</span></a>` : `<span class="ph0"></span>`}</nav>
  </article></div>`;
}

/* ---- themes ---- */
function vThemes() {
  const GO = ["Your rights and duties", "People and communities", "How government works", "Centre, States and places", "The Constitution itself"], groups = [...new Set(THEMES.map(t => t.g))].sort((a, b) => GO.indexOf(a) - GO.indexOf(b));
  return `<section class="wrap"><div class="ph"><h1 class="lt">Themes</h1><p class="sub">Start from a question. Each of the ${THEMES.length} themes collects the provisions on one subject in reading order, with a short summary of each.</p></div>
    <nav class="pills scrollrow" aria-label="Theme groups" style="margin-bottom:8px">${groups.map((g, i) => `<a class="pill" href="#themes" data-jump="tg-${i}">${esc(g)}</a>`).join("")}</nav>
    ${groups.map((g, i) => `<section class="tgrp" aria-labelledby="tg-${i}"><h2 class="tgh" id="tg-${i}">${esc(g)}</h2><div class="themes">${THEMES.filter(t => t.g === g).map(themeCard).join("")}</div></section>`).join("")}</section>`;
}
function vTheme(r) {
  const t = THEME_BY.get(r.id);
  themeCtx = t.id;
  const rows = t.i.map(id => {
    const [k, v] = id.split(/-(.+)/);
    if (k === "art") return artRow(v);
    const s = SCH[SCH_BY.get(v)], T = TEXT && TEXT.s[v];
    return `<a class="row" href="#sch-${v}"><span class="num">Sch.</span><span><span class="tt">${esc(schName(v))}: ${esc(s.t)}</span><span class="ss">${esc((T && T.s) || s.s || "")}</span></span><span class="aux">${I.chev}</span></a>`;
  }).join("");
  /* related themes: the ones sharing the most provisions with this one; the previous and next themes sit in the pager */
  const ti = THEMES.indexOf(t), prevT = THEMES[ti - 1], nextT = THEMES[ti + 1], mine = new Set(t.i);
  const related = THEMES.filter(x => x !== t && x !== prevT && x !== nextT).map(x => [x, x.i.filter(i => mine.has(i)).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([x]) => x);
  const themeRow = x => `<a class="row trow-th" href="#theme-${x.id}"><span class="ico c-${x.c}">${I[x.ic] || I.book}</span><span><span class="tt">${esc(x.q)}</span><span class="ss">${esc(x.t)} · ${x.i.length} provisions</span></span><span class="aux">${I.chev}</span></a>`;
  return `<section class="wrap col">
    <div class="ph"><nav class="crumbs" aria-label="Breadcrumb"><a href="#themes">Themes</a>${I.chev}<span>${esc(t.t)}</span></nav>
      <span class="ico c-${t.c}" style="width:52px;height:52px;border-radius:14px">${I[t.ic]}</span>${anaTheme(t) ? ANA : ""}
      <h1 class="lt">${esc(t.q)}</h1><p class="sub">${lx(t.d)}</p>
      <div class="acts"><a class="btn primary" href="${itemHref(t.i[0])}">Read in order ${I.arrow}</a>${shareBtn()}</div></div>
    ${!TEXT && !textErr ? `<p class="eyebrow" style="margin:0 0 10px">Loading summaries…</p>` : ""}
    <div class="group">${rows}</div>
    <nav class="pager pq" aria-label="Previous and next theme">${prevT ? `<a href="#theme-${prevT.id}"><small>← Previous theme</small><span>${esc(prevT.q)}</span></a>` : `<span class="ph0"></span>`}${nextT ? `<a class="nx" href="#theme-${nextT.id}"><small>Next theme →</small><span>${esc(nextT.q)}</span></a>` : `<span class="ph0"></span>`}</nav>
    ${related.length ? `<div class="sh" style="margin-top:32px"><div><h2 style="font-size:20px">Related themes</h2></div><a class="more" href="#themes">All themes ${I.chev}</a></div>
    <div class="group">${related.map(themeRow).join("")}</div>` : `<p style="margin-top:20px"><a class="more" href="#themes">All themes ${I.chev}</a></p>`}
  </section>`;
}

/* ---- amendments ---- */
let amdFilter = "all";
function vAmend(r) {
  const tagCount = {};
  AMD.forEach(a => a.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
  const decs = [...new Set(AMD.map(a => Math.floor(a.y / 10) * 10))];
  const list = AMD.filter(a => amdFilter === "all" || a.tags.includes(amdFilter) || String(Math.floor(a.y / 10) * 10) === amdFilter).slice().reverse();
  const NC = AMD.filter(a => a.nc).length;
  return `<section class="wrap col" style="--col:920px">
    <div class="ph"><h1 class="lt">Amendments</h1><p class="sub">The official text records each change in a note under the provision it changed. Parliament has passed ${AMD.length} Constitution Amendment Acts. The official notes mention ${AMD.length - NC} of them. The other ${NC} made changes that were later replaced or ran out, so no official note mentions them; they are marked below with what happened and the official source used.</p></div>
    ${nextTeaser()}
    <div class="seg2" role="group" aria-label="Chart view"><button type="button" data-amv="year" aria-pressed="${amdView === "year"}">By year</button><button type="button" data-amv="size" aria-pressed="${amdView === "size"}">By size</button></div>
    <div class="card chart" style="margin-bottom:18px">${amdChartNow(r.id)}</div>
    <div class="pills scrollrow" role="group" aria-label="Filter amendments" style="margin-bottom:8px"><button class="pill" type="button" data-af="all" aria-pressed="${amdFilter === "all"}">All</button>${tags.map(t => `<button class="pill" type="button" data-af="${esc(t)}" aria-pressed="${amdFilter === t}">${esc(t.charAt(0).toUpperCase() + t.slice(1))}</button>`).join("")}</div>
    <div class="pills scrollrow" role="group" aria-label="Filter by decade" style="margin-bottom:18px">${decs.map(d => `<button class="pill" type="button" data-af="${d}" aria-pressed="${amdFilter === String(d)}">${d}s</button>`).join("")}</div>
    <div class="alist">${list.map(a => `<article class="arow${r.id === a.n ? " hl" : ""}" id="amd-${a.n}">
      <div class="no">${nth(a.n)}<small>${a.y}</small></div>
      <div><h2>The Constitution (${ordw(a.n)} Amendment) Act, ${a.y}</h2><p>${lx(a.h)}</p>
        ${a.nc ? `<div class="gone"><b>What happened to it</b><p>${lx(a.what)}</p><p class="src">Source: ${a.src.map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join(" · ")}</p></div>` : ""}
        <div class="meta">${a.nc ? `<span class="tag nc">Not in the official notes</span>` : ""}${a.wef ? `<span class="tag g">${a.wl || "In force"} ${fmtDate(a.wef)}</span>` : ""}${a.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}${a.nc ? "" : `<span class="tag n">${a.refs.length} provision${a.refs.length > 1 ? "s" : ""}</span>`}</div>
        <details data-amd="${a.n}"${r.id === a.n ? " open" : ""}><summary>${a.nc ? "Where to look today" : "Provisions changed"}</summary>${r.id === a.n ? amdRefs(a) : ""}</details>
      </div></article>`).join("") || `<div class="empty">No amendments match this filter.</div>`}</div>
  </section>`;
}

function amdRefs(a) {
  const label = x => x === "P" ? ["Preamble", "#preamble"] : (([k, v]) => k === "a" ? ["Article " + v, "#art-" + v] : k === "s" ? [schName(v), "#sch-" + v] : ["Part " + v, "#part-" + v])(x.split(":"));
  return `<div class="pills">${a.refs.map(x => { const [l, h] = label(x); return `<a class="pill" href="${h}">${esc(l)}</a>`; }).join("")}</div>`;
}
document.addEventListener("toggle", e => { const d = e.target; if (d.matches && d.matches("details[data-amd]") && d.open && !d.querySelector(".pills")) d.insertAdjacentHTML("beforeend", amdRefs(AMD_BY.get(+d.dataset.amd))); }, true);
/* Three kinds of content: the official text (no label), our plain-words help ("In plain words") and our analysis, the
   basic structure estimates and the next-amendment forecast, which always carries this label. Rulings are not labelled. */
const ANA = `<span class="ana">${I.gauge}Analysis</span>`;
const anaTheme = t => t.id === "core";   // the basic structure theme mixes rulings with our estimates
/* ---- the next amendment: a forecast (data/next.json) ---- */
function nextTeaser() {
  const N = CORE.next; if (!N) return "";
  return `<a class="card nxt" href="#next-amendment"><span class="nxt-h"><span class="eyebrow">What might come next</span>${ANA}</span><p>${esc(N.headline)}</p>
    <span class="nxw">${N.when.map(w => `<span><i class="sw b${w.band}" aria-hidden="true"></i>${esc(w.by.replace(/,.*$/, ""))}: <b>${BAND[w.band].t}</b></span>`).join("")}</span>
    <span class="more">See the forecast ${I.chev}</span></a>`;
}
/* "when", as a timeline: to scale on wide screens, a list on narrow ones (the list is also what screen readers get) */
function nextTimeline(N) {
  const t0 = Date.parse(N.asOnIso), t1 = Date.parse(N.when[N.when.length - 1].until), x = d => 100 * (Date.parse(d) - t0) / (t1 - t0);
  const evs = [{ iso: N.asOnIso, d: N.asOnIso.slice(0, 4), short: "Last reviewed", note: "" }].concat(N.clocks.filter(k => k.iso).map(k => ({ iso: k.iso, d: k.d, short: k.short, note: k.note || "" })));
  const evIso = new Set(evs.map(e => e.iso));
  let prev = 0;
  const segs = N.when.map(w => { const a = prev, b = x(w.until); prev = b; return `<span class="seg b${w.band}" style="flex:${(b - a).toFixed(2)}">${BAND[w.band].t}</span>`; }).join("");
  const ticks = N.when.filter(w => !evIso.has(w.until)).map(w => `<div class="ev dn c tick" style="--x:${x(w.until).toFixed(2)}"><span class="lb"><b>${esc(w.short.replace(/^By /, "").replace(/^./, c => c.toUpperCase()))}</b></span></div>`).join("");
  const marks = evs.map((e, i) => { const p = x(e.iso), al = p < 15 ? "l" : p > 70 ? "r" : "c"; return `<div class="ev ${i % 2 ? "dn" : "up"} ${al}" style="--x:${p.toFixed(2)}"><i></i><span class="lb"><b>${esc(e.d)}</b><span>${esc(e.short)}</span>${e.note ? `<small>${esc(e.note)}</small>` : ""}</span></div>`; }).join("");
  const list = evs.map(e => ({ ...e, k: "e" })).concat(N.when.map(w => ({ iso: w.until, k: "h", w }))).sort((a, b) => a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.k === "e" ? -1 : 1);
  return `<div class="tlh" aria-hidden="true"><div class="bar">${segs}</div>${marks}${ticks}</div>
    <ol class="tlv">${list.map(it => it.k === "e" ? `<li class="e"><i aria-hidden="true"></i><b>${esc(it.d)}</b> <span>${esc(it.short)}</span>${it.note ? `<small>${esc(it.note)}</small>` : ""}</li>` : `<li class="h"><span class="sw b${it.w.band}" aria-hidden="true"></span>${esc(it.w.short)}: <b>${BAND[it.w.band].t}</b> <small>${BAND[it.w.band].r}</small></li>`).join("")}</ol>`;
}
/* "on what", as tiles from most to least likely; each jumps to its details below */
function nextTiles(N) {
  return `<div class="nxtiles">${N.cands.slice().sort((a, b) => a.band - b.band).map(c => `<a class="card nxtile" href="#next-amendment" data-jump="nx-${c.id}"><span class="t">${esc(c.s)}</span><span class="m">${bsScale(c.band)}<span>${BAND[c.band].t}</span></span><span class="stg">${esc(c.tag)}</span></a>`).join("")}</div>`;
}
function vNext() {
  const head = `<div class="ph"><nav class="crumbs" aria-label="Breadcrumb"><a href="#amendments">Amendments</a>${I.chev}<span>The next amendment</span></nav>${ANA}<h1 class="lt">The next amendment</h1><p class="sub">When the Constitution may next be amended, and on what. Our estimate as on ${new Date(CORE.next.asOnIso + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}, built from the Bills now in Parliament, the deadlines the Constitution sets itself and the record of past amendments.</p></div>`;
  if (!TEXT || !TEXT.next) return `<section class="wrap col nx" style="--col:920px">${head}${textErr || TEXT ? errBox() : loadBox()}</section>`;
  const N = TEXT.next, sw = b => `<span class="sw b${b}" aria-hidden="true"></span>`;
  const srcs = list => list && list.length ? `<p class="src">Source: ${list.map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join("; ")}</p>` : "";
  const chips = x => { const p = (x.arts || []).map(n => `<a class="pill" href="#art-${n}">Art. ${n}</a>`).concat((x.sch || []).map(k => `<a class="pill" href="#sch-${k}">${schName(k)}</a>`), (x.amds || []).map(n => `<a class="pill" href="#amend-${n}">${nth(n)} Amendment</a>`)); return p.length ? `<div class="pills">${p.join("")}</div>` : ""; };
  const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const fd = d => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const med = xs => { const v = xs.slice().sort((a, b) => a - b), m = v.length >> 1; return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2); };
  const T = N.times.map(t => ({ ...t, d: days(t.intro, t.assent), w: days(t.intro, t.passed) }));
  const withC = T.filter(t => t.cttee).map(t => t.d), noC = T.filter(t => !t.cttee).map(t => t.d), quick = T.filter(t => t.w <= 7).length;
  const dec = {}; AMD.forEach(a => { const k = Math.floor(a.y / 10) * 10; dec[k] = (dec[k] || 0) + 1; });
  const peak = Math.max(...Object.values(dec)), lastDec = Math.max(...Object.keys(dec).map(Number)), O = N.outcomes;
  return `<section class="wrap col nx" style="--col:920px">${head}
    <div class="card nxlead"><p>${esc(N.headline)}</p><p class="fine">This is analysis for readers, not a ruling or a prediction of any party's plans, and it takes no side on any proposal. <a href="#next-amendment" data-jump="nx-method">How this works</a></p></div>

    <section class="sec" aria-labelledby="nx-when"><div class="sh"><div><h2 id="nx-when">When</h2><p>How likely it is that at least one Amendment Act is passed by the end of each stretch.</p></div></div>
      ${nextTimeline(N)}
      <h3 class="subhd">Why</h3>
      <div class="nxwhen">${N.when.map(w => `<div class="card"><span class="k">${sw(w.band)}${BAND[w.band].t}${BAND[w.band].r ? ` <small>${BAND[w.band].r}</small>` : ""}</span><h3>${esc(w.by)}</h3><p>${markTerms(esc(w.why))}</p></div>`).join("")}</div></section>

    <section class="sec" aria-labelledby="nx-what"><div class="sh"><div><h2 id="nx-what">On what</h2><p>Each Government Bill to amend the Constitution now in Parliament, the deadlines that will need one, and how likely each is to become law. Select one for the details.</p></div></div>
      ${nextTiles(N)}
      <h3 class="subhd">In detail</h3>
      ${N.cands.slice().sort((a, b) => a.band - b.band).map(c => `<article class="card nxc" id="nx-${c.id}"><div class="bsb-h">${sw(c.band)}<div><b>${esc(c.t)}</b><small>${BAND[c.band].t}${c.bill ? " · " + esc(c.bill) : ""}</small></div></div>
        <p><b>Where it stands.</b> ${markTerms(esc(c.stage))}</p><p><b>What it would do.</b> ${markTerms(esc(c.what))}</p><p><b>Why we think so.</b> ${markTerms(esc(c.why))}</p>${chips(c)}${srcs(c.src)}</article>`).join("")}</section>

    <section class="sec" aria-labelledby="nx-clocks"><div class="sh"><div><h2 id="nx-clocks">The dates in detail</h2><p>Dates set by the Constitution or already fixed, that shape when the next amendments may come.</p></div></div>
      <ol class="nxclk">${N.clocks.map(k => `<li><span class="d">${esc(k.d)}</span><div><h3>${esc(k.t)}</h3><p>${markTerms(esc(k.s))}</p>${chips(k)}${srcs(k.src)}</div></li>`).join("")}</ol></section>

    <section class="sec" aria-labelledby="nx-record"><div class="sh"><div><h2 id="nx-record">The track record</h2><p>What past amendments tell us about pace, timing and which deadlines Parliament keeps.</p></div></div>
      <div class="nxrec">
        <div class="card"><h3>Amendment Acts by decade</h3><p>The pace has slowed: ${dec[2010] || 0} in the 2010s and ${dec[lastDec] || 0} so far in the ${lastDec}s.</p>
          <div class="nxpace" role="img" aria-label="${Object.entries(dec).map(([k, v]) => `${k}s: ${v}`).join(", ")}">${Object.entries(dec).map(([k, v]) => `<div><span>${k}s${+k === lastDec ? " so far" : ""}</span><i style="width:${(100 * v / peak).toFixed(1)}%"></i><b>${v}</b></div>`).join("")}</div></div>
        <div class="card"><h3>How long Bills take</h3><p>For the last ${T.length} Acts, the median time from a Bill's introduction to the President's assent was ${med(T.map(t => t.d))} days. The ${withC.length} sent to a committee took a median of ${med(withC)} days; the other ${noC.length}, ${med(noC)} days. ${quick} of ${T.length} passed both Houses within a week of being introduced.</p></div>
        <div class="card"><h3>Deadlines Parliament keeps</h3><p>Reserved seats for Scheduled Castes and Scheduled Tribes (Article 334) have been extended before every deadline, seven times out of seven. The freeze on seat shares was set or changed each time it came up: in 1976, 2001 and 2003.</p></div>
        <div class="card"><h3>Not every Bill passes</h3><p>Of ${O.total} Government Bills to amend the Constitution introduced since ${O.since}, ${O.law} became law, ${O.lapsed} lapsed, ${O.defeated} were defeated and ${O.pending} are still pending. The two defeated were in 2011 and 2026.</p>${srcs([O.src])}</div>
      </div>
      <details class="card nxtimes"><summary>The last ${T.length} Acts, Bill by Bill</summary><div class="tscroll"><table class="stbl"><thead><tr><th scope="col">Act</th><th scope="col">Introduced</th><th scope="col">Passed both Houses</th><th scope="col">Assent</th><th scope="col">Days</th></tr></thead><tbody>${T.slice().reverse().map(t => `<tr><th scope="row"><a href="#amend-${t.n}">${nth(t.n)}</a><small>${esc(t.bill)} · <a href="${esc(t.src)}" target="_blank" rel="noopener">source</a>${t.cttee ? " · committee" : ""}</small></th><td>${fd(t.intro)}</td><td>${fd(t.passed)}</td><td>${fd(t.assent)}</td><td>${t.d}</td></tr>`).join("")}</tbody></table></div></details>
    </section>

    <section class="sec" aria-labelledby="nx-method" id="nx-method"><div class="sh"><div><h2 id="nx-method">How this works</h2></div></div>
      <div class="card bsmeth">
        <p>We ask two questions: when will the Constitution next be amended, and on what? We start from the Government's Bills to amend the Constitution now in Parliament, taken from Parliament's own bill records, and add the deadlines the Constitution sets itself. Then we use the record of past amendments: how often they pass, how long Bills take, which deadlines Parliament has always met, and which subjects come up most.</p>
        <p>An amendment needs a majority of each House's total membership and two-thirds of the members present and voting (Article 368). Changes to some provisions, such as how States are represented in Parliament, also need the approval of half the State Legislatures.</p>
        <p>The labels, from Very likely to Very unlikely, are the same rough guides used on the <a href="#basic-structure">basic structure</a> page. They show how confident we are, not calculated odds. Private Members' Bills are left out, as they rarely come to a vote. Changes made by ordinary law, such as renaming a State under Article 4, are not amendments under Article 368 and are not counted.</p>
        <p class="fine">Reviewed ${esc(N.asOn)}. We review this after each session of Parliament, and whenever a Bill moves to its next stage. Facts come from Parliament's bill records, Press Information Bureau releases, the Gazette of India and the official text. The estimates are an analysis for readers, not legal advice.</p>
      </div></section>
  </section>`;
}

/* ---- basic structure ---- */
// What the basic structure counts cover (home page and basic structure page).
const bsCap = () => `<p class="bscap"><b>${CORE.bsn[0]} articles in force, the Preamble and the ${CORE.bsn[1]} Schedules</b>, grouped by how likely each is to be part of the basic structure</p>`;
// Legend for a basic structure share bar: swatch, count, level and whole-number share (home page and basic structure page).
const bsLegend = ns => { const pc = pct100(ns); return `<div class="bslg">${BAND.map((b, i) => `<span><i class="sw b${i}"></i><span><b>${ns[i]}</b> ${b.t[0].toLowerCase() + b.t.slice(1)} <span class="pc">${pc[i]}%</span></span></span>`).join("")}</div>`; };
// Whole-number shares that add up to 100 (largest remainder), so a legend never totals 99% or 101%.
function pct100(ns) {
  const t = ns.reduce((a, b) => a + b, 0) || 1, raw = ns.map(n => 100 * n / t), out = raw.map(Math.floor);
  raw.map((r, i) => [r - out[i], i]).sort((a, b) => b[0] - a[0]).slice(0, 100 - out.reduce((a, b) => a + b, 0)).forEach(([, i]) => out[i]++);
  return out;
}
const BAND = [
  { k: "held", t: "Decided by the Supreme Court", r: "" },
  { k: "vlikely", t: "Very likely", r: "over 90%" },
  { k: "likely", t: "Likely", r: "60–90%" },
  { k: "open", t: "Open question", r: "40–60%" },
  { k: "unlikely", t: "Unlikely", r: "10–40%" },
  { k: "vunlikely", t: "Very unlikely", r: "under 10%" }
];
const FST = { rec: "Recognised by the Court", op: "Named by some judges", ls: "Listed by the Lok Sabha Secretariat" };
let bsSel = 0, bsPick = false;
const bsOf = (kind, id) => { const B = bsData(); if (!B) return null; const v = kind === "sch" ? B.sch[id] : B.art[id]; const note = kind === "sch" ? B.schnote[id] : B.note[id]; return v || note ? { b: v ? v[0] : null, why: v ? B.why[v[1]][0] : "", f: v ? B.why[v[1]][1] : [], note } : null; };
const featChips = (f, b) => f.length ? `<p class="fl">${b != null && b >= 4 ? "Related feature" + (f.length > 1 ? "s" : "") : "Basic feature" + (f.length > 1 ? "s" : "") + " involved"}</p><div class="pills">${f.map(x => `<a class="pill" href="#basic-structure-${x}">${esc(bsData().feat[x].t)}</a>`).join("")}</div>` : "";
/* six-step scale, filled from "very unlikely" (1 step) up to "held" (all 6) */
const bsScale = b => `<span class="bscale l${6 - b}${b === 0 ? " held" : ""}" role="img" aria-label="${BAND[b].t}: step ${6 - b} of 6">${[5, 4, 3, 2, 1, 0].map(i => `<i class="${i >= b ? "on" : ""}"></i>`).join("")}</span>`;
function bsChip(kind, id) {
  const v = bsOf(kind, id); if (!v || v.b == null) return "";
  const B = BAND[v.b];
  return `<a class="bschip b${v.b}" href="#bsbox" data-jump="bsbox"><span class="bsc-l">Basic structure</span>${bsScale(v.b)}<span class="bsc-t"><b>${B.t}</b>${v.b ? ` <span class="rng">${B.r}</span>${ANA}` : ""}</span>${I.chev}</a>`;
}
function bsBox(kind, id) {
  const v = bsOf(kind, id); if (!v) return "";
  const B = v.b == null ? null : BAND[v.b];
  return `<section class="block" aria-labelledby="bsbox-h"><h2 id="bsbox-h">Basic structure</h2><div class="card bsbox" id="bsbox">
    ${B ? `<div class="bsb-h"><span class="sw b${v.b}" aria-hidden="true"></span><div><b>${B.t}</b>${v.b ? `<small>Our estimate: ${B.r}</small>` : ""}</div>${v.b ? ANA : ""}</div>
    <p class="q">Could Parliament repeal or substantially change this ${kind === "sch" ? "Schedule" : "provision"} by amendment without breaching the basic structure?</p>
    <p>${lx(v.why)}</p>${featChips(v.f, v.b)}` : ""}
    ${v.note ? `<p class="bsn">${I.info}<span>${lx(v.note)}</span></p>` : ""}
    <p class="fine">${B && v.b ? "This is an estimate made with a published method, not a ruling. Courts decide each challenge on its own facts." : "From the Supreme Court's judgments, as listed on the basic structure page."} <a href="#basic-structure-method">How this works</a></p>
  </div></section>`;
}
function bsMap() {
  const B = TEXT.bs;
  const cell = (href, id, label, b, sch) => `<a class="bcell b${b}${bsPick && bsSel !== b ? " dim" : ""}" href="${href}" data-bs="${sch ? "s:" : "a:"}${esc(id)}" aria-label="${esc(label)}: ${BAND[b].t}"></a>`;
  let h = `<div class="bmrow"><span class="bml">Preamble</span><div class="bmc">${B.art.Preamble ? cell("#preamble", "Preamble", "Preamble", B.art.Preamble[0]) : ""}</div></div>`;
  PARTS.forEach(P => {
    if (P.o) return;
    const ids = []; P.ch.forEach(C => C.s.forEach(S => S.a.forEach(n => { if (B.art[n]) ids.push(n); })));
    if (!ids.length) return;
    h += `<div class="bmrow"><a class="bml" href="#part-${P.n}">Part ${P.n}<small>${esc(P.t)}</small></a><div class="bmc">${ids.map(n => cell("#art-" + n, n, "Article " + n + ", " + ART.get(n).t.replace(/\.$/, ""), B.art[n][0])).join("")}</div></div>`;
  });
  h += `<div class="bmrow"><a class="bml" href="#schedules">Schedules<small>First to Twelfth</small></a><div class="bmc">${SCH.map(s => B.sch[s.k] ? cell("#sch-" + s.k, s.k, schName(s.k), B.sch[s.k][0], 1) : "").join("")}</div></div>`;
  return h;
}
function bsList() {
  const B = TEXT.bs, g = new Map();
  const add = (wi, html) => { if (!g.has(wi)) g.set(wi, []); g.get(wi).push(html); };
  if (B.art.Preamble && B.art.Preamble[0] === bsSel) add(B.art.Preamble[1], `<a class="pill" href="#preamble">Preamble</a>`);
  ORDER.forEach(n => { const v = B.art[n]; if (v && v[0] === bsSel) add(v[1], `<a class="pill" href="#art-${n}" title="${esc(ART.get(n).t)}">Article ${n}</a>`); });
  SCH.forEach(s => { const v = B.sch[s.k]; if (v && v[0] === bsSel) add(v[1], `<a class="pill" href="#sch-${s.k}">${schName(s.k)}</a>`); });
  return [...g].map(([wi, items]) => `<div class="bgrp"><p>${lx(B.why[wi][0])}</p><div class="pills">${items.join("")}</div></div>`).join("") || `<p class="sub">Nothing at this level.</p>`;
}
function vBS(r) {
  if (!TEXT) return `<section class="wrap"><div class="ph"><h1 class="lt">The basic structure</h1></div>${textErr ? errBox() : loadBox()}</section>`;
  const B = TEXT.bs, S = B.settled, src = S.sources;
  const counts = BAND.map((_, i) => Object.values(B.art).filter(v => v[0] === i).length + Object.values(B.sch).filter(v => v[0] === i).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const yr = s => (s.match(/\((\d{4})\)/) || [])[1] || "";
  const provs = p => p.map(x => { const [k, v] = x.split(":"); return k === "a" ? `<a class="pill" href="#art-${v}">Art. ${v}</a>` : `<a class="pill" href="#sch-${v}">${schName(v)}</a>`; }).join("");
  const carriers = id => { const out = []; if (B.art.Preamble && B.art.Preamble[0] <= 2 && B.why[B.art.Preamble[1]][1].includes(id)) out.push(["#preamble", "Preamble", B.art.Preamble[0]]); ORDER.forEach(n => { const v = B.art[n]; if (v && v[0] <= 2 && B.why[v[1]][1].includes(id)) out.push(["#art-" + n, "Art. " + n, v[0]]); }); SCH.forEach(s => { const v = B.sch[s.k]; if (v && v[0] <= 2 && B.why[v[1]][1].includes(id)) out.push(["#sch-" + s.k, schName(s.k), v[0]]); }); return out; };
  /* a source, with the page or paragraph relied on (at) when given */
  const srcLink = (k, at) => { const s = src[k] || k, u = (s.match(/https?:\/\/\S+/) || [])[0]; const label = s.replace(/,?\s*https?:\/\/\S+/, ""); return (u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}</a>` : esc(label)) + (at ? `, ${esc(at)}` : ""); };
  const srcLine = o => o.src && o.src.length ? `<p class="src">Source: ${o.src.map(k => srcLink(k, o.at && o.at[k])).join("; ")}</p>` : "";
  return `<section class="wrap bs col" style="--col:920px">
    <div class="ph"><h1 class="lt">The basic structure</h1><p class="sub">Parliament can amend almost any part of the Constitution. Since 1973, though, the Supreme Court has held that an amendment cannot destroy the Constitution's <em>basic structure</em>.</p></div>

    <section class="sec" aria-labelledby="bs-feat"><div class="sh"><div><h2 id="bs-feat">The basic features</h2><p>The ${Object.keys(B.feat).length} features the Court has named so far. It has never given a closed list.</p></div></div>
      ${["rec", "op", "ls"].map(st => { const L = Object.entries(B.feat).filter(([, f]) => f.st === st); return L.length ? `<h3 class="bfg">${FST[st]} <span>${L.length}</span></h3><div class="card bfl">${L.map(([id, f]) => { const cs = carriers(id); return `<details class="bfr" id="f-${id}"><summary><span class="bfr-t"><span class="bfr-h"><b>${esc(f.t)}</b></span><span class="one">${lx(f.s)}</span></span>${I.chev}</summary><div class="bfr-b">${f.q ? `<blockquote class="bq"><p>“${esc(f.q.t)}”</p><cite>${esc(f.q.by)}, ${srcLink(f.q.src, f.q.at)}</cite></blockquote>` : ""}${cs.length ? `<p class="bfk">Carried most directly by ${ANA}</p><div class="pills bfp">${cs.map(([h, l, b]) => `<a class="pill" href="${h}"><span class="sw b${b}" aria-hidden="true"></span>${esc(l)}</a>`).join("")}</div>` : ""}${f.sb ? `<p class="bfk">Struck down for breaching it</p><ul class="bfs">${f.sb.map(s => `<li>${lx(s.what)}. <span>${esc(s.case)}</span></li>`).join("")}</ul>` : ""}${(() => { const rest = f.q ? (f.src || []).filter(k => k !== f.q.src) : f.src || []; return rest.length ? `<p class="src">${f.q ? "Also: " : "Source: "}${rest.map(k => srcLink(k, f.at && f.at[k])).join("; ")}</p>` : ""; })()}</div></details>`; }).join("")}</div>` : ""; }).join("")}
    </section>


    <section class="sec" aria-labelledby="bs-map"><div class="sh"><div><h2 id="bs-map">Every provision, estimated</h2>${ANA}<p>How likely each provision is to be part of the basic structure, using the features above and the Court's rulings. Only "Decided by the Supreme Court" is the Court's own word; every other level is our estimate.</p></div></div>
      ${bsSum()}
      <p class="bsmap-h">Each square below is an article in force, grouped by Part, plus the Preamble and the twelve Schedules (${total} in all). The darker the square, the more likely it is part of the basic structure. Select a level above, such as Likely, to pick it out; the list below shows its provisions and why.</p>
      <div class="card bsmap">${bsMap()}</div>
      <div class="bslist" id="bslist"><h3>${BAND[bsSel].t}${BAND[bsSel].r ? ` <small>${BAND[bsSel].r}</small>` : ""}</h3>${bsList()}</div>
    </section>

    <section class="sec" aria-labelledby="bs-settled"><div class="sh"><div><h2 id="bs-settled">Amendments the Court has struck down</h2><p>Each time the Supreme Court has struck down an amendment for breaching the basic structure, oldest first. After them come the amendments struck down on other grounds, and the ones the Court upheld.</p></div></div>
      <ol class="bstl">${S.struck_bs.map(s => `<li><span class="y">${yr(s.case)}</span><div><h3>${esc(s.case.replace(/\s*\(\d{4}\)/, ""))}</h3><p><b>Struck down:</b> ${lx(s.what)}.</p><p><b>Why:</b> ${lx(s.ground)}.</p><div class="pills">${provs(s.prov.filter((x, i, a) => a.indexOf(x) === i).slice(0, 6))}${s.prov.length > 6 ? `<span class="pill">+${s.prov.length - 6} more</span>` : ""}</div>${srcLine(s)}</div></li>`).join("")}</ol>
      <div class="card bsother"><h3>Struck down on other grounds</h3>${S.struck_other.map(s => `<p><b>${esc(s.case)}:</b> ${lx(s.what)}. ${lx(s.ground)}.</p>${srcLine(s)}`).join("")}</div>
      <div class="card bsother"><h3>Upheld, or held to be outside the basic structure</h3><ul>${S.outside_or_upheld.map(o => `<li>${lx(o.what)}. <span class="c">${esc(o.case)}</span>${srcLine(o)}</li>`).join("")}</ul></div>
    </section>


    <section class="sec" aria-labelledby="bs-method" id="bs-method-s"><div class="sh"><div><h2 id="bs-method">How the estimates work</h2></div></div>
      <div class="card bsmeth">
        <p>For every provision we ask one question: <b>could Parliament repeal or substantially change it by a constitutional amendment without breaching a basic feature the Supreme Court has recognised?</b> The basic structure is made up of features, not article numbers, so an article's details can be amended even when its core cannot.</p>
        <p><b>Decided by the Supreme Court</b> means the Court has itself ruled the provision's core part of the basic structure, or struck down an amendment to it on basic structure grounds. Every other level is our estimate, using these factors:</p>
        <ul><li>Has a court ruled this provision, or something it depends on, part of the basic structure?</li><li>Is it the main home of a recognised feature, or a supporting detail?</li><li>Does Article 368(2) already require half the States to ratify changes to it, a sign of the federal core?</li><li>Is it procedural, transitional, a number or a list, and has it been changed before without objection?</li></ul>
        <p>The ranges are rough guides to confidence, not calculated probabilities. A feature named only by some judges, not a majority, counts for less than one recognised by a majority, or by a later and larger group of judges. Omitted articles are not shown.</p>
        <p class="fine">The Court's rulings, and the provisions marked Decided by the Supreme Court, come from the Supreme Court's judgments themselves, checked against the judges' own words, and from the official notes. Each cites the report and page. The estimates are an analysis for readers, not legal advice; for any legal purpose rely on the judgments themselves.</p>
        <details><summary>Sources</summary><ul class="srcs">${Object.keys(src).map(k => `<li>${srcLink(k)}</li>`).join("")}</ul></details>
      </div>
    </section>
  </section>`;
}
/* ---- glossary ---- */
const gref = a => { const m = a.match(/^s:([A-Z]+):(\d+)$/); return m ? `<a href="#sch-${m[1]}-b${m[2]}">${schName(m[1])}</a>` : `<a href="#art-${a}">Article ${a}</a>`; };
function vGlossary(r) {
  if (!TEXT) return `<section class="wrap"><div class="ph"><h1 class="lt">Glossary</h1></div>${textErr ? errBox() : loadBox()}</section>`;
  const G = TEXT.g, letters = [...new Set(G.map(([t]) => t.replace(/^(the|an?)\s+/i, "").charAt(0).toUpperCase()))].sort();
  const byL = {};
  G.forEach(g => { const L = g[0].replace(/^(the|an?)\s+/i, "").charAt(0).toUpperCase(); (byL[L] = byL[L] || []).push(g); });
  return `<section class="wrap col">
    <div class="ph"><h1 class="lt">Glossary</h1><p class="sub">${G.length} terms the Constitution defines for itself, in its Articles and Schedules, with the definition in its own words and where it appears.</p></div>
    <div class="toolbar"><label class="filter" style="flex:1">${I.search}<span class="sr">Filter terms</span><input id="gfilter" type="search" placeholder="Filter terms" autocomplete="off"></label></div>
    <nav class="az" aria-label="Jump to letter">${TERMS.length ? `<a href="#glossary" data-jump="gl-terms" class="azw">Plain words</a>` : ""}${letters.map(L => `<a href="#glossary" data-jump="gl-${L}">${L}</a>`).join("")}</nav>
    <div id="gl">${TERMS.length ? `<h2 class="gl-letter" id="gl-terms">Explained in plain words</h2><div class="group">${TERMS.map(x => `<div class="gterm" id="term-${x.id}" data-f="${esc(x.t.toLowerCase())}"><h3>${esc(x.t)}</h3><p class="gplain">${esc(x.d)}</p>${x.list ? `<dl class="tl">${x.list.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>` : ""}<p class="tsrc">${termSrc(x)}. Our wording, not the Constitution's.</p></div>`).join("")}</div>` : ""}${letters.map(L => `<h2 class="gl-letter" id="gl-${L}">${L}</h2><div class="group">${byL[L].map(([t, defs]) => { const grp = new Map(); defs.forEach(([a, d]) => { const k = d.toLowerCase().replace(/[^a-z]/g, ""); if (!grp.has(k)) grp.set(k, [d, []]); grp.get(k)[1].push(a); }); return `<div class="gterm" data-f="${esc(t.toLowerCase())}" id="g-${esc(t.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}"><h3>${esc(t)}</h3>${[...grp.values()].map(([d, refs]) => `<div class="gdef"><div class="grefs">${refs.map(gref).join("")}</div><p>${linkArts(esc(d))}</p></div>`).join("")}</div>`; }).join("")}</div>`).join("")}</div>
  </section>`;
}

/* ---- saved ---- */
function savedList() { return store.get("saved", []).filter(n => ART.has(n)); }
function vSaved() {
  const s = savedList();
  return `<section class="wrap col"><div class="ph"><h1 class="lt">Saved</h1><p class="sub">Articles you save stay here on this device.</p></div>
    ${s.length ? `<div class="group">${s.map(n => artRow(n)).join("")}</div>` : `<div class="card" style="padding:28px;text-align:center"><p class="sub" style="margin:0 auto">Nothing saved yet. Open any article and select <b>Save</b> to keep it here.</p><a class="btn" href="#theme-rights" style="margin-top:14px">Start with your Fundamental Rights</a></div>`}</section>`;
}

/* ================= clause addresses: (1), (a), (i) give each clause a link like #art-19.1.a ================= */
function clauseIds(paras) {
  const st = [], seen = new Set();
  return paras.map(([l, s]) => {
    const x = plain(s).replace(/^[\[\]*\s]+/, ""), m = x.match(/^\((\d+[A-Z]*|[a-z]{1,4})\)/);
    if (!m) return "";
    st.length = l; st[l] = m[1];
    const id = st.filter(Boolean).join(".");
    if (seen.has(id)) return "";
    seen.add(id); return id;
  });
}
const clauseCite = (n, id) => "Article " + n + (id ? id.split(".").map(x => `(${x})`).join("") : "");
function clauseSpan(ps, i) {
  const L = +ps[i].dataset.l, out = [ps[i]];
  for (let j = i + 1; j < ps.length; j++) { const p = ps[j], l = +p.dataset.l; if (l < L || (l === L && p.dataset.c)) break; out.push(p); }
  return out;
}
let selClause = null;
function selectClause(id, scroll) {
  const ps = $$("#text p"), i = ps.findIndex(p => p.dataset.c === id);
  $$("#text p.csel").forEach(p => p.classList.remove("csel"));
  if (i < 0) { clearClause(true); return; }
  clauseSpan(ps, i).forEach(p => p.classList.add("csel"));
  selClause = id;
  const n = route.id, h = "#art-" + n + "." + id;
  if (location.hash !== h) { history.replaceState(history.state, "", h); lastKey = location.hash; }
  const bar = $("#cbar");
  bar.querySelector("b").textContent = clauseCite(n, id);
  bar.hidden = false; $("#backchip").hidden = true;
  if (scroll) ps[i].scrollIntoView({ block: "center" });
}
function clearClause(silent) {
  $$("#text p.csel").forEach(p => p.classList.remove("csel"));
  selClause = null; $("#cbar").hidden = true;
  const fr = history.state && history.state.from; if (fr) $("#backchip").hidden = false;
  if (!silent && route.name === "art" && location.hash !== "#art-" + route.id) { history.replaceState(history.state, "", "#art-" + route.id); lastKey = location.hash; }
}
function clauseFor(p) {
  const ps = $$("#text p"), i = ps.indexOf(p);
  for (let j = i; j >= 0; j--) if (ps[j].dataset.c && clauseSpan(ps, j).includes(p)) return ps[j].dataset.c;
  return null;
}

/* ================= links, citations, sharing ================= */
/* inside the claude.ai frame the page's own address is a private sandbox, so links point at the public artifact URL */
const SITE = "https://claude.ai/artifact/EaLJZMpbA6nN1fSAYEZJw9";
const framed = (() => { try { return window.top !== window; } catch (e) { return true; } })();
const pageURL = h => (framed || !/^https?:$/.test(location.protocol) || /claudeusercontent|claude\.site/.test(location.hostname) ? SITE : location.href.split("#")[0]) + (h || location.hash);
function citeText(kind, id, cl) {
  const tail = `Text as on ${CORE.meta.asOn}, Legislative Department, Ministry of Law and Justice, Government of India.`;
  if (kind === "art") { const a = ART.get(id); return `Constitution of India, ${clauseCite(id, cl)} (${a.t.replace(/\.$/, "")}), Part ${PARTS[a.p].n}. ${tail}`; }
  if (kind === "pre") return `Constitution of India, Preamble. ${tail}`;
  if (kind === "sch") return `Constitution of India, ${schName(id)} (${SCH[SCH_BY.get(id)].t}). ${tail}`;
  return "";
}
function shareTarget() {
  const r = route, cl = r.name === "art" ? selClause : null;
  const title = r.name === "art" ? clauseCite(r.id, cl) + ": " + ART.get(r.id).t.replace(/\.$/, "") : document.title.replace(/ · Constitution of India$/, "");
  return { title, url: pageURL(r.name === "art" ? "#art-" + r.id + (cl ? "." + cl : "") : location.hash), cite: ["art", "pre", "sch"].includes(r.name) ? citeText(r.name, r.id, cl) : "" };
}
function doShare() {
  const s = shareTarget();
  if (navigator.share) navigator.share({ title: s.title + " · Constitution of India", text: s.title, url: s.url }).catch(e => { if (!e || e.name !== "AbortError") copy(s.url, "Sharing isn't available here, so the link was copied"); });
  else copy(s.url, "Link copied");
}
let menu = null, menuBtn = null;
function closeMenu(restore) { const b = menuBtn; if (menu) { menu.remove(); menu = null; } if (menuBtn) { menuBtn.setAttribute("aria-expanded", "false"); menuBtn = null; } if (restore && b) b.focus({ preventScroll: true }); }
function showMenu(btn, label, html) {
  closeMenu(); closePop();
  menuBtn = btn; btn.setAttribute("aria-expanded", "true");
  menu = document.createElement("div"); menu.className = "pop menu"; menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", label);
  menu.innerHTML = html;
  document.body.appendChild(menu);
  const rc = btn.getBoundingClientRect(), pw = menu.offsetWidth;
  menu.style.left = Math.max(16 + scrollX, Math.min(rc.right + scrollX - pw, scrollX + document.documentElement.clientWidth - pw - 16)) + "px";
  menu.style.top = (rc.bottom + scrollY + 8) + "px";
  (menu.querySelector('[aria-checked="true"]') || menu.querySelector("button")).focus({ preventScroll: true });
}
/* appearance: Auto follows the device; the button shows the current choice */
const THEME_MODES = [["auto", "auto", "Auto"], ["light", "sun", "Light"], ["dark", "moon", "Dark"]];
function openThemeMenu(btn) {
  const m = themeMode();
  showMenu(btn, "Appearance", `<p class="mlab" aria-hidden="true">Appearance</p>` + THEME_MODES.map(([k, ic, l]) => `<button type="button" role="menuitemradio" aria-checked="${k === m}" data-tmode="${k}">${I[ic]}<span>${l}</span>${k === m ? `<span class="tick">${I.check}</span>` : ""}</button>`).join(""));
}
function openMenu(btn) {
  const r = route, items = [];
  if (navigator.share) items.push(["share", I.share, "Share…"]);
  items.push(["link", I.link, "Copy link"]);
  if (["art", "pre", "sch"].includes(r.name)) items.push(["cite", I.quote, "Copy citation"]);
  if (r.name === "art" || r.name === "pre") items.push(["text", I.copy, "Copy text"]);
  showMenu(btn, "Share", items.map(([k, ic, l]) => `<button type="button" role="menuitem" data-sact="${k}">${ic}<span>${l}</span></button>`).join(""));
}
function shareAct(k) {
  const s = shareTarget(), r = route;
  if (k === "share") doShare();
  else if (k === "link") copy(s.url, "Link copied");
  else if (k === "cite") copy(s.cite, "Citation copied");
  else if (k === "text") {
    if (r.name === "pre") copy(`Preamble\n\n${CORE.pre.p.map(p => plain(p[1])).join("\n")}\n\nThe Constitution of India (as on ${CORE.meta.asOn})`, "Copied the Preamble");
    else { const n = r.id, a = ART.get(n), x = artText(n); if (!x) return; let ps = x.p, lab = "Article " + n; if (selClause) { const dom = $$("#text p.csel").map(p => +p.dataset.i); ps = dom.map(i => x.p[i]); lab = clauseCite(n, selClause); } copy(`${lab}. ${a.t}\n\n${ps.map(p => plain(p[1])).join("\n")}\n\nThe Constitution of India (as on ${CORE.meta.asOn})`, `Copied ${lab}`); }
  }
  closeMenu();
}

/* ================= read aloud ================= */
const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
let speaking = false;
const sayable = s => plain(s).replace(/[\[\]*]/g, "").replace(/\barts?\.\s*/gi, m => /s/i.test(m[3]) ? "articles " : "article ").replace(/\bcls?\.\s*/gi, "clause ").replace(/[—–]/g, ", ").replace(/\s+/g, " ").trim();
function setListen(on) { $$("[data-listen]").forEach(b => { b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Stop reading aloud" : "Read aloud"); b.innerHTML = `${on ? I.stop : I.speaker}<span class="bl">${on ? "Stop" : "Listen"}</span>`; }); }
/* Safari on iPhone has known speech quirks: a speak() straight after cancel() can be dropped, the end event
   sometimes never fires, and speech can be left paused after an interruption such as a call. The queue below
   allows for each. iPhones also mute speech when Silent mode is on, and no web page can change that, so the
   first Listen on an iPhone or iPad says so. */
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let speakGen = 0, watch = 0, silentHint = false;
function stopSpeak() {
  if (!canSpeak) return;
  speaking = false; speakGen++; restartSpeak = null; clearInterval(watch);
  if (curU) { curU.onend = curU.onerror = curU.onstart = null; curU = null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  $$(".speaking").forEach(e => e.classList.remove("speaking")); setListen(false);
}
function pickVoice() { const v = speechSynthesis.getVoices(); return v.find(x => /^en[-_]IN/i.test(x.lang)) || v.find(x => /^en[-_]GB/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null; }
function chunks(s) { const out = []; s.replace(/([.;:])\s+/g, "$1\n").split("\n").forEach(p => { if (out.length && (out[out.length - 1] + " " + p).length < 220) out[out.length - 1] += " " + p; else if (p) out.push(p); }); return out; }
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
let rate = RATES.includes(+store.get("rate", 1)) ? +store.get("rate", 1) : 1, curU = null, restartSpeak = null;
function setRate(r) {
  rate = r; store.set("rate", r);
  $$("[data-rate]").forEach(el => { el.value = String(r); });
  if (speaking && restartSpeak) restartSpeak();
}
function speak(items) {
  if (!canSpeak) return;
  const busy = speechSynthesis.speaking || speechSynthesis.pending;
  stopSpeak();
  try { if (speechSynthesis.paused) speechSynthesis.resume(); } catch (e) {}
  speaking = true; setListen(true);
  if (isIOS && !silentHint) { silentHint = true; toast("No sound? Turn off Silent mode"); }
  const q = []; let i = 0, v = pickVoice(), gen = speakGen, fin = null, started = 0, fails = 0;
  items.forEach(([el, tx]) => chunks(tx).forEach(c => q.push([el, c])));
  const say = () => {
    if (!speaking || gen !== speakGen) return;
    $$(".speaking").forEach(e => e.classList.remove("speaking"));
    if (i >= q.length) { stopSpeak(); return; }
    const [el, tx] = q[i++];
    if (el) { el.classList.add("speaking"); const rc = el.getBoundingClientRect(); if (rc.top < 70 || rc.bottom > innerHeight - 90) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    if (!v) v = pickVoice(); /* voices can arrive after the first tap */
    const u = new SpeechSynthesisUtterance(tx); if (v) u.voice = v; u.lang = v ? v.lang : "en-IN"; u.rate = rate;
    let done = false;
    fin = ok => { if (done || gen !== speakGen) return; done = true; fails = ok ? 0 : fails + 1; if (fails >= 3) { stopSpeak(); toast("Read aloud isn't working on this device"); return; } say(); };
    u.onstart = () => { started = Date.now(); };
    u.onend = () => fin(true);
    u.onerror = e => { if (e && (e.error === "interrupted" || e.error === "canceled")) return; fin(false); };
    curU = u; started = Date.now();
    speechSynthesis.speak(u);
  };
  /* change speed mid-way: restart the current sentence after the cancel has settled */
  restartSpeak = () => {
    if (curU) curU.onend = curU.onerror = curU.onstart = null;
    gen = ++speakGen; try { speechSynthesis.cancel(); } catch (e) {}
    i = Math.max(0, i - 1); setTimeout(say, 150);
  };
  /* if an end event never comes, move on once the engine has gone quiet; if speech was paused, resume it */
  watch = setInterval(() => {
    if (!speaking || gen !== speakGen || !fin) return;
    try {
      if (speechSynthesis.paused && !document.hidden) speechSynthesis.resume();
      else if (!speechSynthesis.speaking && !speechSynthesis.pending && Date.now() - started > 700) fin(true);
    } catch (e) {}
  }, 250);
  /* the first speak must happen inside the tap; only wait if something was still speaking */
  if (busy) setTimeout(say, 150); else say();
}
function listen() {
  if (speaking) { stopSpeak(); return; }
  const r = route;
  if (r.name === "art" && artText(r.id)) { const n = r.id, t = artText(n), ps = $$("#text p"); speak([[$(".ahead h1"), `Article ${n}. ${ART.get(n).t}`]].concat(t.p.map((p, i) => [ps[i] || null, sayable(p[1])]))); }
  else if (r.name === "pre") { const ps = $$(".pre-t p"); speak([[null, "The Preamble."]].concat(CORE.pre.p.map((p, i) => [ps[i] || null, sayable(p[1])]))); }
}
if (canSpeak) {
  try { speechSynthesis.getVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener("voiceschanged", () => {}); } catch (e) {}
  document.addEventListener("visibilitychange", () => { try { if (!document.hidden && speaking && speechSynthesis.paused) speechSynthesis.resume(); } catch (e) {} });
}
const listenBtn = () => canSpeak ? `<span class="lgrp"><button class="btn" type="button" data-listen aria-pressed="false" aria-label="Read aloud">${I.speaker}<span class="bl">Listen</span></button><label class="spd"><span class="sr">Reading speed</span><select data-rate>${RATES.map(r => `<option value="${r}"${r === rate ? " selected" : ""}>${r}×</option>`).join("")}</select></label></span>` : "";
const shareBtn = () => `<button class="btn" type="button" data-share aria-haspopup="menu" aria-expanded="false" aria-label="Share, copy link or cite">${I.share}<span class="bl">Share</span></button>`;

/* ================= keyboard shortcuts ================= */
const KEYS = [["/", "Search (or ⌘K / Ctrl K)"], ["← →", "Previous or next article"], ["S", "Save or unsave this article"], ["C", "Copy the citation"], ["L", "Read aloud, or stop"], ["Esc", "Close, or clear a selected clause"], ["?", "Show these shortcuts"]];
function toggleKeys(force) {
  let d = $("#kbd");
  if (d && force !== true) { d.remove(); return; }
  if (d) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="kbd" id="kbd" role="dialog" aria-modal="true" aria-labelledby="kbd-h"><div class="kbdp"><div class="kbdt"><h2 id="kbd-h">Keyboard shortcuts</h2><button class="ib" type="button" data-kbd-close aria-label="Close">${I.close}</button></div><dl>${KEYS.map(([k, l]) => `<div><dt>${k.split(" ").map(x => `<kbd>${x}</kbd>`).join(" ")}</dt><dd>${l}</dd></div>`).join("")}</dl></div></div>`);
  $("#kbd [data-kbd-close]").focus();
}

/* ================= history from the official footnotes ================= */
const VERB = { ins: "Added", add: "Added", subs: "Replaced", omit: "Removed", renum: "Renumbered", pend: "Not yet in force", inv: "Declared invalid", other: "Changed" };
/* the part of a clause that begins "Provided that" (lawyers call it a proviso) */
const PROV = "the \u201cProvided that\u201d part of ";
const actLabel = a => typeof a === "number" ? `<a href="#amend-${a}">${nth(a)} Amendment Act</a>` : a ? esc(String(a).replace(/^C\.O\. (\d+)$/, "Constitution Order $1")) : "Not stated in the note";
function timelineHTML(f, sc, fh, hn, kind) {
  if (!f || !f.length || !fh) return histHTML(f, sc);
  const ev = new Map(), other = [];
  const where = k => { const s = sc && sc[k]; if (!s || !s.where) return ""; const w = esc(s.where.replace(/^an omission in /, "in ").replace(/^an omission$/, "")); if (!w) return ""; return s.none ? `<span class="whr">${w}</span>` : `<button class="lnk" type="button" data-goto-fn="${k}">${w}</button>`; };
  let added = null;
  fh.forEach((x, i) => {
    const k = i + 1, [a, v, o, d, r, inv, pend, fix] = x;
    if (v === "see" || v === "other" && a == null) { other.push(k); return; }
    const amd = typeof a === "number" ? AMD_BY.get(a) : null;
    const yr = d ? d.slice(0, 4) : amd ? String(amd.y) : (String(a || "").match(/\d{4}/) || [""])[0];
    const sort = pend ? "9999" : d || (amd && amd.wef) || (yr ? yr + "-12-31" : "0000");
    const when = pend ? "Date not yet notified" : d ? "In force from " + fmtDate(d) : r ? "With retrospective effect" : yr;
    if (v !== "inv") {
      const key = (a == null ? "?" : a) + "|" + when;
      if (!ev.has(key)) ev.set(key, { sort, yr: pend ? "" : yr, when, act: a, items: [] });
      const isHead = hn && hn.includes(k) && (v === "ins" || v === "add") && kind === "art";
      if (isHead) added = key;
      ev.get(key).items.push({ k, v: isHead ? "art" : v, o, fix });
    }
    if (inv) {
      const key = "court|" + inv + "|" + k;
      ev.set(key, { sort: inv + "-12-31", yr: inv, when: "Supreme Court, " + inv, court: true, items: [{ k, v: "inv", o: "" }] });
    }
  });
  const list = [...ev.values()].sort((a, b) => a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0);
  const item = it => {
    const lab = it.v === "art" ? (kind === "art" ? "This article was added" : "Added") : VERB[it.v] || "Changed";
    const old = (it.o ? `<span class="old">${it.v === "omit" ? "Removed wording" : "Earlier wording"}: “${esc(it.o)}”</span>` : "") + (it.fix ? `<span class="old">${esc(it.fix)}</span>` : "");
    return `<li><span class="vb v-${it.v}">${lab}</span>${it.v === "art" ? "" : where(it.k)}<button class="fn" type="button" data-fn="${it.k}" aria-label="Official note ${it.k}" aria-expanded="false">${it.k}</button>${old}</li>`;
  };
  const root = added ? "" : `<li class="ev root"><span class="yr">1949</span><div><div class="eh"><b>In the Constitution as adopted</b><span>26 November 1949</span></div></div></li>`;
  return `<section class="block" aria-labelledby="hh"><h2 id="hh">History <small>Built from the ${f.length} official note${f.length > 1 ? "s" : ""}</small></h2>
    <ol class="tline">${root}${list.map(e => `<li class="ev${e.court ? " court" : ""}"><span class="yr">${e.yr || "·"}</span><div><div class="eh"><b>${e.court ? "Declared invalid by the Supreme Court" : actLabel(e.act)}</b><span>${e.court ? "" : esc(e.when)}</span></div><ul>${e.items.map(item).join("")}</ul></div></li>`).join("")}</ol>
    ${other.length ? `<p class="tl-other">Other official notes: ${other.map(k => `<button class="fn" type="button" data-fn="${k}" aria-label="Official note ${k}" aria-expanded="false">${k}</button>`).join(" ")}</p>` : ""}
    <details class="allnotes"><summary>All official notes, word for word</summary>${histHTML(f, sc).replace(/^<section[^>]*><h2[^>]*>.*?<\/h2>/, "").replace(/<\/section>$/, "")}</details>
  </section>`;
}

/* ================= charts ================= */
let amdView = "year";
function amdYearChart(sel) {
  const compact = document.documentElement.clientWidth < 640;
  const Y0 = 1950, Y1 = 2026, by = {};
  AMD.forEach(a => (by[a.y] = by[a.y] || []).push(a));
  const maxS = Math.max(...Object.values(by).map(v => v.length));
  const W = compact ? 360 : 1000, L = compact ? 10 : 18, R = compact ? 10 : 18, step = (W - L - R) / (Y1 - Y0 + 1);
  const rr = Math.min(step * .42, 7), gap = rr * 2 + (compact ? 1 : 3), T = 14, B = 34, H = T + B + maxS * gap;
  const match = a => amdFilter === "all" || a.tags.includes(amdFilter) || String(Math.floor(a.y / 10) * 10) === amdFilter;
  let ax = "", g = "", dots = "";
  for (let y = Y0; y <= Y1; y += 10) { const x = L + (y - Y0 + .5) * step; g += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - B}"/>`; ax += `<text x="${x.toFixed(1)}" y="${H - B + 18}" text-anchor="middle">${y}</text>`; }
  Object.entries(by).forEach(([y, arr]) => arr.forEach((a, i) => {
    const cx = L + (+y - Y0 + .5) * step, cy = H - B - rr - 2 - i * gap;
    dots += `<circle class="yd${a.nc ? " ncd" : ""}${match(a) ? "" : " dim"}${sel === a.n ? " on" : ""}" data-n="${a.n}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}"><title>${nth(a.n)} Amendment, ${a.y}: ${esc(a.h)}</title></circle>`;
  }));
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Constitution Amendment Acts by year, 1950 to 2026. Each dot is one Act."><g class="gl">${g}</g><line class="base" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><g class="ax">${ax}</g>${dots}</svg><p class="chart-note">Each dot is one Amendment Act, stacked in the year it was passed. ${compact ? "Tap" : "Hover over"} a dot to see what it did; select it to open. Hollow dots are Acts no official note mentions any more.${amdFilter !== "all" ? " Faded dots don't match the filter." : ""}</p>`;
}
const amdChartNow = sel => (amdView === "year" ? amdYearChart(sel) : amdChart(sel));
// The levels card at the top of the basic structure page: what is counted, the bar, a button per level (count, share, range;
// a button picks its provisions out of the map below) and the same numbers as a table. Counts come from CORE.bsc, as on the home page.
function bsSum() {
  const A = CORE.bsc, tA = A.reduce((a, b) => a + b, 0), pc = pct100(A), p1 = v => (100 * v / tA).toFixed(1) + "%";
  return `<div class="card bs-sum">${bsCap()}<div class="shbar" aria-hidden="true">${A.map((v, i) => v ? `<span class="sx b${i}" style="flex:${v}" data-tip="${esc(BAND[i].t)}: ${v} (${p1(v)})"></span>` : "").join("")}</div>
    <div class="bss-g">${BAND.map((b, i) => `<button type="button" class="bss" data-bsel="${i}" aria-pressed="${bsPick && bsSel === i}"><span class="sw b${i}" aria-hidden="true"></span><span class="n"><b>${A[i]}</b> <span class="pc">${pc[i]}%</span></span><span class="lv">${b.t}</span>${b.r ? `<small>${b.r}</small>` : ""}</button>`).join("")}</div>
    <details><summary>Show as a table</summary><table class="stbl"><thead><tr><th scope="col">Likelihood</th><th scope="col">Provisions</th><th scope="col">Share</th></tr></thead><tbody>${BAND.map((b, i) => `<tr><th scope="row"><span class="sw b${i}" aria-hidden="true"></span>${b.t}</th><td>${A[i]}</td><td>${p1(A[i])}</td></tr>`).join("")}<tr class="tot"><th scope="row">Total</th><td>${tA}</td><td>100%</td></tr></tbody></table></details></div>`;
}

/* ================= how this was made ================= */
function vAbout() {
  const NC = AMD.filter(a => a.nc).length;
  return `<section class="wrap about col" style="--col:700px">
    <div class="ph"><h1 class="lt">How this was made</h1><p class="sub">What on this site is the official text, what we added to help you read it, and where everything comes from.</p><p class="asof">Created by <a href="https://www.linkedin.com/in/yuvrajkhetan" target="_blank" rel="noopener">Yuvraj Khetan</a> · Last updated __UPDATED__</p></div>
    <div class="card prose">
      <h2>The official text</h2>
      <p>Every article, heading, Schedule and official note comes from <b>The Constitution of India [As on ${esc(CORE.meta.asOn)}]</b>, published by the Legislative Department, Ministry of Law and Justice, Government of India. It includes every amendment up to the ${esc(CORE.meta.upTo)}. We changed only the layout, so it reads well on a screen. Where the official text marks a later change in square brackets with an official note, we keep both. For any legal purpose, rely on the official publication.</p>
      <h2>What we added</h2>
      <p>These are not part of the Constitution. They are there to help you read it, and are labelled where they appear. There are three kinds of content here:</p>
      <ul>
        <li><b>The official text</b>, exactly as published. It carries no label.</li>
        <li><b>Our plain-words help</b>: summaries, themes, the glossary and the history of each article. It is marked <i>In plain words</i> where it sits next to the text.</li>
        <li><b>Our analysis</b>: the basic structure estimates and the forecast of the next amendment. It is built from official sources and cites them, but it is our judgement, so it always carries the label ${ANA}. The Supreme Court's own rulings on those pages are not our analysis, and are not labelled.</li>
      </ul>
      <p>The details:</p>
      <ul>
        <li><b>Plain-language summaries</b> of every article, Part and Schedule, written from the official text. In November 2026 each summary was checked clause by clause against that text, and corrected where needed.</li>
        <li><b>Themes</b>, which group related provisions by subject. The grouping is ours.</li>
        <li><b>Connections</b> between articles, found by reading where one article's text names another.</li>
        <li><b>History</b> on each article, built from its official notes: which Act changed what, when, and the earlier wording where the note gives it. The full notes are always one tap away. We don't yet show the whole 1950 text side by side, because we haven't found an official copy of it that can be read reliably by machine. We will add it if one becomes available.</li>
        <li><b>The glossary</b> quotes the Constitution's own definitions. Only the grouping and links are ours.</li>
        <li><b>Facts and charts</b>, counted directly from the official text.</li>
        <li><b>The next amendment</b>, our estimate of when the Constitution may next be amended and on what, from the Bills in Parliament, the Constitution's own deadlines and the record of past amendments. <a href="#next-amendment">See the forecast and its method</a>.</li>
      </ul>
      <h2>Amendments</h2>
      <p>Parliament has passed ${AMD.length} Constitution Amendment Acts. Dates and changes come from the official notes. ${NC} Acts are no longer mentioned in any official note, because what they changed was later replaced or ran out. For those we used the Legislative Department's own Act texts and the National Portal of India, linked on the <a href="#amendments">Amendments</a> page. The one-line descriptions are ours.</p>
      <h2>The basic structure</h2>
      <p>The Supreme Court's rulings, and the provisions marked Decided by the Supreme Court, come only from the Court's judgments themselves, checked against the judges' own words, and from the official notes. Each ruling and feature cites the judgment's official law report (Supreme Court Reports) and the page or paragraph relied on. The likelihood given to every other provision is our own estimate, not a ruling, and the <a href="#basic-structure-method">method is set out in full</a>. It is analysis for readers, not legal advice.</p>
      <h2>What stays on your device</h2>
      <p>There is no account or sign-in. The articles you save, what you read recently, and your text size, reading speed and appearance are kept in this browser on this device only. Clearing your browser's data removes them.</p>
      <h2>What this is not</h2>
      <p>This is an independent reader, not a Government website, and not legal advice. If something here seems to differ from the official publication, the official publication is right.</p>
      <h2>Design</h2>
      <p>The type is Palatino, chosen for its likeness to the hand-lettering of the original 1950 manuscript. Devices without it get TeX Gyre Pagella, a free version of the same design. The quilt patches draw on Indian textiles: bandhani, leheriya, ikat, ajrakh, block print, paisley, kantha and mirror work.</p>
      <h2>With thanks</h2>
      <p>This reader was inspired by the work of <a href="https://www.constitutionofindia.net/" target="_blank" rel="noopener">Constitution of India</a>, which has done much to make the Constitution open and easy to explore. This site is independent and not affiliated with it.</p>
    </div>
  </section>`;
}

/* ================= everyday words → where to look ================= */
const SYN = [
  ["free speech|freedom of speech|freedom of expression|free expression|press freedom|freedom of the press|right to protest|protest|peaceful assembly", "19 t:speech"],
  ["arrest|arrested|detention|detained|preventive detention|custody|police custody", "22 21 t:arrest"],
  ["right to life|life and liberty|personal liberty|privacy|right to privacy", "21"],
  ["equality|equal treatment|equal before law|equality before law|discrimination", "14 15 16 t:justice"],
  ["untouchability|caste discrimination", "17 15"],
  ["reservation|reservations|quota|quotas", "15 16 330 332"],
  ["job reservation|reservation in jobs|government jobs|public employment|reservation in promotion|promotions", "16"],
  ["college admission|admissions|reservation in education", "15"],
  ["ews|economically weaker sections", "15 16"],
  ["obc|backward classes|other backward classes", "15 16 340 342A"],
  ["scheduled castes|sc st", "341 15 46 338"],
  ["scheduled tribes|adivasi|tribals|tribal rights", "342 338A 244 t:tribal"],
  ["women's reservation|women reservation|seats for women", "330A 332A 243D 243T"],
  ["women|gender equality|gender", "15 39 51A t:women"],
  ["religion|freedom of religion|religious freedom|conversion|worship", "25 26 27 28 t:religion"],
  ["minorities|minority rights|minority institutions|minority schools", "29 30"],
  ["right to education|free education|school education|schooling", "21A 45 t:education"],
  ["child labour|children working", "24 t:children"],
  ["children|child rights", "21A 24 39 45 t:children"],
  ["trafficking|forced labour|bonded labour|begar", "23"],
  ["writ|writs|habeas corpus|mandamus|certiorari|constitutional remedies|go to the supreme court|approach the supreme court", "32 226"],
  ["fundamental duties|duties of citizens|citizens duties", "51A t:duties"],
  ["fundamental rights", "12 13 32 t:rights"],
  ["directive principles", "37 38 t:dpsp"],
  ["citizenship|citizen|nationality", "5 11 t:citizenship"],
  ["voting age|right to vote|vote|voters|voter|adult suffrage|universal adult franchise", "326"],
  ["election commission|chief election commissioner|election commissioners", "324 t:elections"],
  ["elections|election", "324 326 327 t:elections"],
  ["delimitation|constituency boundaries|constituencies", "82 170 327"],
  ["president election|electing the president|how is the president elected", "54 55"],
  ["impeachment|impeach the president|remove the president", "61"],
  ["remove a judge|removal of judges|impeach a judge", "124 217"],
  ["pardon|pardons|mercy petition|clemency", "72 161"],
  ["ordinance|ordinances", "123 213"],
  ["governor|governors", "153 155 163"],
  ["chief minister", "164 163"],
  ["prime minister|pm", "75 74 78"],
  ["council of ministers|cabinet", "74 75 163 164"],
  ["no confidence|no-confidence|collective responsibility", "75 164"],
  ["money bill|money bills", "110 199"],
  ["budget|annual financial statement", "112 202"],
  ["gst|goods and services tax", "246A 269A 279A"],
  ["tax|taxes|taxation", "265 246 t:money"],
  ["finance commission", "280"],
  ["national emergency", "352 358 359"],
  ["president's rule|presidents rule|state emergency|failure of constitutional machinery", "356"],
  ["financial emergency", "360"],
  ["anti-defection|anti defection|defection|defections|switching parties", "s:TENTH 102 191"],
  ["union list|state list|concurrent list|who makes laws|division of powers|centre state relations|centre-state relations", "246 s:SEVENTH t:federal"],
  ["new state|creating a state|forming a new state|state boundaries|rename a state", "3 4"],
  ["official language|hindi|english|languages|language", "343 345 348 s:EIGHTH t:language"],
  ["judges|judiciary|courts", "124 214 t:courts"],
  ["contempt of court|contempt", "129 215"],
  ["panchayat|panchayats|village council|gram sabha|gram panchayat", "243A 243B 243G t:local"],
  ["municipality|municipalities|municipal corporation|urban local body|city government", "243Q 243W t:local"],
  ["cag|comptroller and auditor general|auditor general", "148 149 t:watchdogs"],
  ["upsc|public service commission|civil services", "315 320 t:services"],
  ["attorney general", "76"],
  ["speaker|lok sabha speaker", "93 94"],
  ["rajya sabha|upper house", "80"],
  ["lok sabha|lower house", "81 83"],
  ["vice president|vice-president", "63 66"],
  ["amend the constitution|amendment procedure|how to amend the constitution", "368 t:amending"],
  ["right to property|property", "300A t:property"],
  ["equal pay|equal pay for equal work", "39"],
  ["uniform civil code|ucc", "44"],
  ["cow slaughter|cow protection|cattle", "48"],
  ["environment|pollution|forests|wildlife", "48A 51A t:environment"],
  ["alcohol|liquor|prohibition", "47"],
  ["legal aid|free legal aid", "39A"],
  ["workers|labour|minimum wage|living wage", "39 41 43 t:workers"],
  ["kashmir|jammu and kashmir", "370"],
  ["delhi|national capital territory", "239AA"],
  ["tribal areas|scheduled areas", "244 s:FIFTH s:SIXTH"],
  ["mla|mlas|state legislature|vidhan sabha|state assembly", "168 170"],
  ["legislative council|vidhan parishad", "169 171"],
  ["mp|mps|members of parliament", "79 84 102"],
  ["tribunal|tribunals", "323A 323B"],
  ["cooperative|co-operative|cooperative societies|co-operative societies", "43B 243ZH"],
  ["secular|secularism|socialist|sovereign|republic|we the people", "P"],
  ["national anthem|national flag", "51A"],
  ["freedom to move|move freely|travel within india|settle anywhere|live anywhere", "19"],
  ["trade union|trade unions|form a union|form an association", "19"],
  ["double jeopardy|self-incrimination|self incrimination|retrospective punishment|ex post facto", "20"],
  ["titles|foreign titles", "18"],
  ["bharat|india that is bharat|name of india|name of the country", "1"],
  ["river water|water disputes|inter-state water", "262"],
  ["inter-state trade|trade between states|freedom of trade", "301"],
  ["assent|assent to bills|governor's assent|president's assent", "111 200 201"],
  ["joint sitting", "108"],
  ["oath|oaths|oath of office", "s:THIRD 60 159"],
  ["salary|salaries|pay and allowances", "s:SECOND 106 195"],
  ["north east|northeast|north-east", "371A 371B 371C 371G 371H s:SIXTH"],
  ["judicial review", "13 32 226 t:core"]
];
const SYNX = [];
SYN.forEach(([ph, tg]) => ph.split("|").forEach(p => SYNX.push([p, tg.split(" ")])));
SYNX.sort((a, b) => b[0].length - a[0].length);
function synMatch(q) {
  const s = q.replace(/[^a-z0-9'\- ]/g, " ").replace(/\s+/g, " ").trim(), S = " " + s + " ", out = [];
  if (!s || /\d/.test(s)) return out;
  for (const [p, tg] of SYNX) if (p.length <= 3 ? s === p : S.includes(" " + p + " ")) out.push([p, tg]);
  return out;
}
const synTarget = x => x.startsWith("t:") ? { type: "theme", id: x.slice(2) } : x.startsWith("s:") ? { type: "sch", id: x.slice(2) } : x === "P" ? { type: "pre" } : { type: "art", id: x };
function synHits(q) {
  const s = q.replace(/[^a-z0-9'\- ]/g, " ").replace(/\s+/g, " ").trim(), S = " " + s + " ", out = [];
  if (!s || /\d/.test(s)) return out;
  for (const [p, tg] of SYNX) {
    if (p.length <= 3 ? s !== p : !S.includes(" " + p + " ")) continue;
    tg.forEach(x => { if (!out.includes(x)) out.push(x); });
    if (out.length >= 5) break;
  }
  return out.slice(0, 5).map(x => x.startsWith("t:") ? { type: "theme", id: x.slice(2) } : x.startsWith("s:") ? { type: "sch", id: x.slice(2) } : x === "P" ? { type: "pre" } : { type: "art", id: x });
}

/* ================= after render ================= */
/* on short pages the contents sidebar should not stretch the page */
function fitSide() { const sd = $("#side"), ar = $(".art"); if (!sd || !ar) return; sd.style.maxHeight = ""; if (getComputedStyle(sd).position !== "sticky") return; const lim = innerHeight - 92; if (ar.offsetHeight < lim) sd.style.maxHeight = Math.max(ar.offsetHeight, 360) + "px"; }
let fitT = 0; addEventListener("resize", () => { clearTimeout(fitT); fitT = setTimeout(fitSide, 150); });
function after(r, keepY, changed) {
  if (r.name === "home") { lazyChart(); (window.requestIdleCallback || (f => setTimeout(f, 200)))(() => { if (route.name === "home") startHeroQuilt(); }, { timeout: 1200 }); } else if (heroQuilt) { heroQuilt.stop(); heroQuilt = null; }
  applyFs();
  updateSavedDot();
  fitSide();
  const side = $("#side .sl[aria-current='page']");
  if (side) { const sd = $("#side"); sd.scrollTop = side.offsetTop - sd.clientHeight / 2; }
  if (wantY != null && (TEXT || textErr || !needsText() || (r.name === "art" && artText(r.id)))) { window.scrollTo(0, wantY); wantY = null; return; }
  if (wantY != null) { window.scrollTo(0, 0); return; }
  if (r.name === "art" && r.c && artText(r.id) && $(`#text p[data-c="${r.c}"]`)) { selectClause(r.c, true); return; }
  // a link to one basic feature (#basic-structure-jr) opens and scrolls to it once its row exists, even if the text arrives later
  if (r.name === "bs" && r.f && bsJumped !== location.hash) { const e = document.getElementById(r.f === "method" ? "bs-method-s" : r.f === "struck" ? "bs-settled" : "f-" + r.f); if (e) { bsJumped = location.hash; if (e.tagName === "DETAILS") e.open = true; e.scrollIntoView({ block: "start" }); return; } }
  if (keepY != null && !changed) { window.scrollTo(0, keepY); return; }
  const mk = HL && $("#view mark");
  if (mk) mk.scrollIntoView({ block: "center" });
  else if (r.name === "sch" && r.b != null && $("#b-" + r.b)) $("#b-" + r.b).scrollIntoView({ block: "start" });
  else if (r.name === "amend" && r.id && $("#amd-" + r.id)) $("#amd-" + r.id).scrollIntoView({ block: "center" });
  else if (r.name === "bs" && r.f) { const e = document.getElementById(r.f === "method" ? "bs-method-s" : r.f === "struck" ? "bs-settled" : "f-" + r.f); if (e && e.tagName === "DETAILS") e.open = true; if (e) e.scrollIntoView({ block: "start" }); }
  else if (r.name === "glossary" && r.term) { const e = document.getElementById("g-" + r.term); if (e) e.scrollIntoView({ block: "center" }); }
  else window.scrollTo(0, 0);
  if (TEXT) HL = null;
}
function lazyChart() {
  const c = $("#homechart"); if (!c) return;
  const build = () => { if (!c.childElementCount) { c.innerHTML = amdChart(); c.style.aspectRatio = ""; } };
  if (!("IntersectionObserver" in window)) return build();
  const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { build(); o.disconnect(); } }, { rootMargin: "300px" });
  o.observe(c);
}
let fsIdx = store.get("fs", 1);
const FS = ["18px", "20px", "22px", "24px"];
function applyFs() { document.documentElement.style.setProperty("--fs", FS[fsIdx] || "20px"); }
function pushRecent(n) { const r = store.get("recent", []).filter(x => x !== n); r.unshift(n); store.set("recent", r.slice(0, 8)); }
/* store the saved list and bring every Save button, the count and the Saved page up to date */
function setSaved(n, list) {
  store.set("saved", list); const on = list.includes(n);
  $$(`[data-save="${n}"]`).forEach(b => { b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? "Saved" : "Save"); b.innerHTML = `${on ? I.bookmarkF : I.bookmark}<span class="bl">${on ? "Saved" : "Save"}</span>`; });
  updateSavedDot(); if (route.name === "saved") render(true);
}
function updateSavedDot() { const n = savedList().length; $$("[data-saved-dot]").forEach(e => { e.textContent = n || ""; e.hidden = !n; }); }


/* ================= article previews: hover on desktop, long-press on touch ================= */
const peek = document.createElement("div"); peek.className = "peek"; peek.hidden = true; document.body.appendChild(peek);
let peekT = 0, peekA = null, lpT = 0, lpFired = false, lpXY = null;
const peekLink = t => { const a = t && t.closest && t.closest('a[href^="#art-"]'); return a && !a.closest(".row, .bcell, .peek, .res") ? a : null; };
function peekHTML(k, touch) {
  const a = ART.get(k), T = artText(k), P = PARTS[a.p];
  const sum = a.o ? "This article has been omitted." : T && T.s ? T.s : TEXT ? "" : "Loading summary…";
  return `<div class="pk-k">Article ${esc(k)} · Part ${P.n}</div><div class="pk-t">${esc(a.t.replace(/\.$/, ""))}</div>${sum ? `<p class="pk-s">${esc(sum)}</p>` : ""}${touch ? `<div class="pk-acts"><a class="btn primary" href="#art-${k}">Open Article ${esc(k)}</a><button class="btn" type="button" data-peek-close>Close</button></div>` : ""}`;
}
function showPeek(link, touch) {
  const k = findArt(decodeURIComponent(link.getAttribute("href").slice(5))); if (!k || !ART.has(k)) return;
  peekA = link; peek.innerHTML = peekHTML(k, touch); peek.className = "peek" + (touch ? " sheet" : ""); peek.hidden = false;
  peek.setAttribute("role", touch ? "dialog" : "tooltip"); if (touch) peek.setAttribute("aria-label", "Article " + k); else peek.removeAttribute("aria-label");
  if (touch) { peek.style.left = peek.style.top = ""; return; }
  const r = link.getBoundingClientRect(), pw = peek.offsetWidth, ph = peek.offsetHeight, vw = document.documentElement.clientWidth;
  peek.style.left = Math.max(12, Math.min(r.left + r.width / 2 - pw / 2, vw - pw - 12)) + "px";
  peek.style.top = (r.bottom + 10 + ph > innerHeight && r.top - ph - 10 > 8 ? r.top - ph - 10 : r.bottom + 10) + "px";
}
function hidePeek() { clearTimeout(peekT); peek.hidden = true; peekA = null; }
document.addEventListener("pointerover", e => {
  if (e.pointerType !== "mouse") return;
  const a = peekLink(e.target); if (!a || a === peekA) return;
  clearTimeout(peekT); peekT = setTimeout(() => showPeek(a, false), 380);
});
document.addEventListener("pointerout", e => {
  if (e.pointerType !== "mouse") return;
  const a = peekLink(e.target); if (!a) return;
  if (e.relatedTarget && a.contains(e.relatedTarget)) return;
  hidePeek();
});
document.addEventListener("focusin", e => { const a = peekLink(e.target); if (a && a.matches(":focus-visible")) showPeek(a, false); else if (!peek.classList.contains("sheet")) hidePeek(); });
document.addEventListener("touchstart", e => {
  const a = peekLink(e.target); lpFired = false; if (!a) return;
  const t0 = e.touches[0]; lpXY = [t0.clientX, t0.clientY];
  clearTimeout(lpT); lpT = setTimeout(() => { lpFired = true; showPeek(a, true); if (navigator.vibrate) navigator.vibrate(8); }, 450);
}, { passive: true });
document.addEventListener("touchmove", e => { if (!lpXY) return; const t0 = e.touches[0]; if (Math.hypot(t0.clientX - lpXY[0], t0.clientY - lpXY[1]) > 10) { clearTimeout(lpT); lpXY = null; } }, { passive: true });
document.addEventListener("touchend", () => { clearTimeout(lpT); lpXY = null; }, { passive: true });
document.addEventListener("contextmenu", e => { if (peekLink(e.target)) e.preventDefault(); });
document.addEventListener("click", e => {
  if (lpFired && peekLink(e.target)) { e.preventDefault(); e.stopPropagation(); lpFired = false; return; }
  if (e.target.closest("[data-peek-close]")) { hidePeek(); return; }
  if (peek.classList.contains("sheet") && !peek.hidden && !e.target.closest(".peek")) hidePeek();
  else if (e.target.closest(".peek a")) hidePeek();
}, true);
addEventListener("scroll", () => { if (!peek.classList.contains("sheet")) hidePeek(); }, { passive: true });
addEventListener("hashchange", hidePeek);
document.addEventListener("keydown", e => { if (e.key === "Escape") hidePeek(); });
/* ================= popover ================= */
let pop = null, popBtn = null;
function closePop() { if (pop) { pop.remove(); pop = null; } if (popBtn) { popBtn.setAttribute("aria-expanded", "false"); popBtn = null; } }
function notesFor() {
  if (route.name === "art" && artText(route.id)) return artText(route.id).f;
  if (route.name === "pre") return CORE.pre.f;
  if (route.name === "sch" && TEXT) return TEXT.s[route.id].f;
  return null;
}
function gotoNote(k) {
  const b = document.querySelector(`#view .fn[data-fn="${k}"]`); if (!b) return;
  const ps = [...document.querySelectorAll(`#text p[data-s~="${k}"]`)], tgt = ps[0] || b;
  tgt.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  let done = false;
  const fl = () => { if (done) return; done = true; (ps.length ? ps : [b.closest("p,h3,tr,div,li") || b]).forEach(el => { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }); };
  addEventListener("scrollend", fl, { once: true }); setTimeout(fl, 1500);
  b.focus({ preventScroll: true });
}
function openPop(btn) {
  const k = +btn.dataset.fn, notes = notesFor();
  if (!notes || !notes[k - 1]) return;
  showPop(btn, "Official note " + k, `<b>Official note ${k}</b>${linkAmd(linkArts(esc(notes[k - 1])))}`);
}
function openTerm(btn) {
  const x = TERM_BY.get(btn.dataset.term); if (!x) return;
  showPop(btn, x.t, `<b>${esc(x.t)}</b><span class="td">${esc(x.d)}</span>${x.list ? `<dl class="tl">${x.list.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>` : ""}<span class="tsrc">${termSrc(x)}</span>`);
}
const termSrc = x => "Based on " + x.src.map(([l, h]) => /^#/.test(h) ? `<a href="${h}">${esc(l)}</a>` : `<a href="${esc(h)}" target="_blank" rel="noopener">${esc(l)}</a>`).join(" · ");
function showPop(btn, label, html) {
  closePop(); popBtn = btn; btn.setAttribute("aria-expanded", "true");
  pop = document.createElement("div"); pop.className = "pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", label);
  pop.innerHTML = html;
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(), pw = pop.offsetWidth;
  pop.style.left = Math.max(16 + scrollX, Math.min(r.left + scrollX + r.width / 2 - pw / 2, scrollX + document.documentElement.clientWidth - pw - 16)) + "px";
  pop.style.top = (r.bottom + scrollY + 8) + "px";
}

/* ================= More sheet (phones and tablets) ================= */
/* sections without a tab of their own: [nav key, href, icon, colour, title, one line] */
const MORE = [
  ["bs", "#basic-structure", "shield", "navy", "Basic structure", "What no amendment can destroy"],
  ["amend", "#amendments", "clock", "saffron", "Amendments", `All ${AMD.length} and what they changed`],
  ["next", "#next-amendment", "cal", "green", "What might come next", "Our forecast of the next amendment"],
  ["glossary", "#glossary", "abc", "navy", "Glossary", "Legal words in plain English"],
  ["about", "#about", "info", "green", "How this was made", "Sources, methods and limits"]
];
const moreEl = $("#more"), morePanel = $("#more .mpanel"), moreBtn = $("#morebtn");
let moreFocus = null, moreT = 0;
const moreOpen = () => !moreEl.hidden;
const themeMode = () => document.documentElement.getAttribute("data-theme") || "auto";
function fillMore() {
  const cur = route.name === "pre" || route.name === "next" ? route.name : NAVKEY[route.name];
  morePanel.innerHTML = `<div class="grab" aria-hidden="true"></div>
    <div class="mhead"><h2 id="more-h">More</h2><button class="ib" type="button" data-more-close aria-label="Close">${I.close}</button></div>
    <nav class="group mlist" aria-label="More sections">${MORE.map(([k, h, ic, c, t, d]) => `<a class="mrow" href="${h}"${k === cur ? ' aria-current="page"' : ""}><span class="ico c-${c}">${I[ic]}</span><span><b>${t}</b><small>${esc(d)}</small></span>${I.chev}</a>`).join("")}</nav>`;
}
function openMore() {
  if (moreOpen()) return;
  clearTimeout(moreT); closePop(); closeSide(); closeMenu();
  moreFocus = document.activeElement; fillMore();
  moreEl.hidden = false; morePanel.style.transform = "";
  void moreEl.offsetWidth; /* so the sheet slides up from below */
  moreEl.classList.add("open"); moreBtn.setAttribute("aria-expanded", "true");
  document.documentElement.style.overflow = "hidden";
  morePanel.focus({ preventScroll: true });
}
function closeMore(restore = true) {
  if (!moreOpen()) return;
  moreEl.classList.remove("open"); moreBtn.setAttribute("aria-expanded", "false");
  document.documentElement.style.overflow = "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  clearTimeout(moreT); moreT = setTimeout(() => { moreEl.hidden = true; morePanel.style.transform = ""; }, reduce ? 0 : 300);
  if (restore && moreFocus && moreFocus.focus) moreFocus.focus({ preventScroll: true });
}
moreEl.addEventListener("click", e => {
  if (e.target === moreEl || e.target.closest("[data-more-close]")) { closeMore(); return; }
  const row = e.target.closest(".mrow"); if (row && row.getAttribute("href") === location.hash) closeMore(false);
});
moreEl.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.stopPropagation(); closeMore(); return; }
  if (e.key !== "Tab") return;
  const f = $$("a[href], button", morePanel), first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === morePanel)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
/* swipe the sheet down to close it */
{
  let y0 = null, dy = 0;
  morePanel.addEventListener("touchstart", e => { y0 = morePanel.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; morePanel.style.transition = ""; }, { passive: true });
  morePanel.addEventListener("touchmove", e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy) { morePanel.style.transition = "none"; morePanel.style.transform = `translateY(${dy}px)`; } }, { passive: true });
  morePanel.addEventListener("touchend", () => { if (y0 == null) return; morePanel.style.transition = ""; if (dy > 90) closeMore(); else morePanel.style.transform = ""; y0 = null; });
}
/* tapping the tab you are already on takes you back to the top */
$(".tabs").addEventListener("click", e => {
  const a = e.target.closest("a[data-nav]");
  if (a && a.getAttribute("aria-current") === "page" && (location.hash || "#") === a.getAttribute("href")) {
    e.preventDefault(); scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
});

/* ================= search sheet ================= */
const dlg = $("#sdlg"), sq = $("#sq"), sres = $("#sres"), sfoot = $("#sfoot");
let sel = 0, items = [], lastFocus = null;
const dlgOpen = () => !dlg.hidden;
function openSearch(q) {
  ensureText();
  lastFocus = document.activeElement;
  dlg.hidden = false; document.documentElement.style.overflow = "hidden";
  if (q != null) sq.value = q;
  sq.focus(); sq.select(); runSearch();
  setTimeout(prepIdx, 300);   // build the search index while the reader starts typing, after the box has opened
}
function prepIdx() { if (TEXT && (!DOCS || !DOCS.full)) { DOCS = buildDocs(); DOCS.full = true; IDX = buildIdx(DOCS); } }
function closeSearch() { dlg.hidden = true; document.documentElement.style.overflow = ""; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
let st = 0;
sq.addEventListener("input", () => { clearTimeout(st); st = setTimeout(runSearch, 50); });
function runSearch() {
  const q = sq.value, r = search(q);
  items = []; let h = "";
  const add = (href, k, t, s, terms) => { items.push({ href, terms }); return `<a class="res" href="${href}" data-i="${items.length - 1}" role="option"><div class="k">${esc(k).replace(/^(Art\. [0-9A-Z-]+)(\(.+)$/, '$1<span class="kc">$2</span>')}</div><div><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ""}</div></a>`; };
  if (!q.trim()) {
    h = `<div class="sempty">Type an article number, a word, or a question in your own words.<div class="pills">${["Article 21", "voting age", "freedom of religion", "money bill", '"Finance Commission"', "Seventh Schedule", "42nd Amendment", "emergency"].map(s => `<button class="pill" type="button" data-try="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`;
    const rec = store.get("recent", []).filter(n => ART.has(n)).slice(0, 4);
    if (rec.length) { h += `<div class="sgrp">Recently read</div>`; rec.forEach(n => h += add("#art-" + n, "Art. " + n, esc(ART.get(n).t))); }
  } else {
    if (r.direct.length) {
      h += `<div class="sgrp">Go to</div>`;
      r.direct.forEach(d => {
        if (d.type === "art") { const a = ART.get(d.id); h += add("#art-" + d.id + (d.c ? "." + d.c : ""), "Art. " + d.id + (d.c ? d.c.split(".").map(x => `(${x})`).join("") : ""), esc(a.t), esc(TEXT && TEXT.a[d.id].s || `Part ${PARTS[a.p].n} · ${PARTS[a.p].t}`)); }
        else if (d.type === "part") { const Pp = PARTS[PART_BY.get(d.id)]; h += add("#part-" + d.id, "Part " + d.id, esc(Pp.t), esc(Pp.s || partRange(Pp).range)); }
        else if (d.type === "sch") { const s = SCH[SCH_BY.get(d.id)]; h += add("#sch-" + d.id, "Sch. " + (SCH_BY.get(d.id) + 1), esc(schName(d.id) + ": " + s.t), esc(s.s || s.ref)); }
        else if (d.type === "amd") { const a = AMD_BY.get(d.id); h += add("#amend-" + d.id, nth(d.id), `The Constitution (${ordw(d.id)} Amendment) Act, ${a.y}`, esc(a.h)); }
        else if (d.type === "theme") { const t = THEME_BY.get(d.id); h += add("#theme-" + d.id, "Theme", esc(t.t), esc(t.q)); }
        else if (d.type === "bs") h += add("#basic-structure", "Explainer", "The basic structure", "What Parliament cannot change by amendment, and an estimate for every provision");
        else if (d.type === "next") h += add("#next-amendment", "Forecast", "The next amendment", "When the Constitution may next be amended, and on what, with the Bills now in Parliament");
        else h += add("#preamble", "Preamble", "We, the People of India", "");
      });
    }
    const seen = new Set(items.map(i => i.href.replace(/^(#art-[^.]+)\..*/, "$1")));
    const groups = { a: [], t: [], p: [], g: [], s0: [], s: [], m: [] };
    const T = r.terms;
    const hl = s => highlight(esc(s), T);
    const one = d => {
      if (d.k === "a") { const bp = TEXT && bestPara(d, T), c = bp && bp.c; return add("#art-" + d.id + (c ? "." + c : ""), "Art. " + d.id + (c ? c.split(".").map(x => `(${x})`).join("") : ""), hl(d.title) + (d.o ? ' <span class="tag o">Omitted</span>' : ""), (d.sl && T.some(t => new RegExp("\\b" + t + "\\b").test(d.sl))) || !d.bl ? hl(d.sum) : snippet(d, T, bp && bp.txt), T); }
      if (d.k === "t") return add("#theme-" + d.id, "Theme", hl(d.title), hl(d.sum));
      if (d.k === "p") return add("#part-" + d.id, "Part " + d.id, hl(d.title.replace(/^Part \S+ · /, "")), hl(d.sum || ""));
      if (d.k === "s0") return add("#sch-" + d.id, "Sch. " + (SCH_BY.get(d.id) + 1), hl(d.title), hl(d.sum || ""));
      if (d.k === "s") return add(`#sch-${d.id}-b${d.b}`, "Sch. " + (SCH_BY.get(d.id) + 1), esc(d.title), snippet(d, T), T);
      if (d.k === "g") return add("#g-" + d.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "Term", hl(d.title), snippet(d, T));
      return add("#amend-" + d.id, nth(d.id), hl(d.title), hl(d.sum));
    };
    const key = d => d.k === "a" ? "#art-" + d.id : d.k === "s0" ? "#sch-" + d.id : d.k === "p" ? "#part-" + d.id : d.k === "t" ? "#theme-" + d.id : d.k === "m" ? "#amend-" + d.id : "";
    // a Part, theme or Schedule that outranks every article is shown first, not under the articles
    const top = r.hits[0], firstArt = r.hits.find(d => d.k === "a");
    let bestD = null;
    if (top && top.k !== "a" && !(top.k === "s" ? seen.has("#sch-" + top.id) : seen.has(key(top))) && (!firstArt || r.score.get(top) >= r.score.get(firstArt))) { bestD = top; h += `<div class="sgrp">Best match</div>` + one(top); seen.add(key(top)); }
    r.hits.forEach(d => d !== bestD && groups[d.k] && !seen.has(key(d)) && groups[d.k].push(d));
    const arts = groups.a;
    if (arts.length) { h += `<div class="sgrp">Articles${TEXT ? "" : " (titles while the text loads)"}</div>`; arts.slice(0, 25).forEach(d => h += one(d)); }
    if (groups.t.length || groups.p.length) { h += `<div class="sgrp">Themes and Parts</div>`; groups.t.slice(0, 3).forEach(d => h += one(d)); groups.p.slice(0, 3).forEach(d => h += one(d)); }
    if (groups.s0.length || groups.s.length) { h += `<div class="sgrp">Schedules</div>`; groups.s0.slice(0, 3).forEach(d => h += one(d)); groups.s.slice(0, 8).forEach(d => h += one(d)); }
    if (groups.g.length) { h += `<div class="sgrp">Glossary</div>`; groups.g.slice(0, 4).forEach(d => h += one(d)); }
    if (groups.m.length) { h += `<div class="sgrp">Amendments</div>`; groups.m.slice(0, 4).forEach(d => h += one(d)); }
    if (r.fix && items.length) h = `<div class="snote">Showing results for “${esc(r.fix)}”</div>` + h;
    if (!items.length) h = `<div class="sempty">No results for “${esc(q)}”. Try fewer or different words, or one of these.<div class="pills">${["Fundamental Rights", "President", "Election Commission", "Governor", "Seventh Schedule"].map(s => `<button class="pill" type="button" data-try="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`;
  }
  sres.innerHTML = h; sel = 0; markSel();
  sfoot.innerHTML = TEXT ? `<span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span><span style="margin-left:auto">Put a phrase in quotes for an exact match</span>`
    : textErr ? `<span>Searching titles only. The full text didn't load.</span>` : `<span style="display:inline-flex;gap:8px;align-items:center"><svg class="spin" viewBox="0 0 100 100" aria-hidden="true"><use href="#chakra"/></svg>Loading the full text…</span>`;
}
function markSel() { const els = $$(".res", sres); els.forEach((el, i) => el.setAttribute("aria-selected", i === sel)); if (els[sel]) els[sel].scrollIntoView({ block: "nearest" }); }
function go(i) { const it = items[i]; if (!it) return; HL = it.terms || null; closeSearch(); if (location.hash === it.href) render(); else location.hash = it.href; }
sq.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); markSel(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); markSel(); }
  else if (e.key === "Enter") { e.preventDefault(); go(sel); }
  else if (e.key === "Escape") closeSearch();
});
sres.addEventListener("click", e => {
  const t = e.target.closest("[data-try]"); if (t) { sq.value = t.dataset.try; runSearch(); sq.focus(); return; }
  const a = e.target.closest(".res"); if (a) { e.preventDefault(); go(+a.dataset.i); }
});
dlg.addEventListener("mousedown", e => { if (e.target === dlg) closeSearch(); });
$("#sclose").addEventListener("click", closeSearch);

/* ================= global events ================= */
const tip = $("#tip");
function openSide() { const s = $("#side"); if (!s) return; s.classList.add("open"); document.body.insertAdjacentHTML("beforeend", '<div class="scrim" data-scrim></div>'); }
function closeSide() { const s = $("#side"); if (s) s.classList.remove("open"); $$(".scrim").forEach(x => x.remove()); }
let tt = 0;
let toastUndo = null;
function toast(m, undo) {
  const t = $("#toast"); toastUndo = undo || null;
  t.innerHTML = esc(m) + (undo ? ' <button type="button" class="tbtn" data-undo>Undo</button>' : "");
  t.classList.toggle("act", !!undo); t.classList.add("on");
  clearTimeout(tt); tt = setTimeout(() => { t.classList.remove("on", "act"); toastUndo = null; }, undo ? 5000 : 1700);
}
function copy(text, msg) {
  const done = () => toast(msg);
  const fb = () => { const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) {} ta.remove(); ok ? done() : toast("Couldn't copy. Select the text instead."); };
  try { navigator.clipboard.writeText(text).then(done, fb); } catch (e) { fb(); }
}
document.addEventListener("click", e => {
  const t = e.target;
  const al = t.closest && t.closest('a[href^="#"]');
  if (al && ["art", "sch", "pre"].includes(route.name) && (al.closest("#view") || al.closest(".pop") || al.closest(".peek")) && !al.closest(".pager, .crumbs, .side, .acts") && al.getAttribute("href") !== location.hash) pendingFrom = { h: location.hash, l: routeLabel(route) }; else if (al) pendingFrom = null;
  if (menu && !t.closest(".menu") && !t.closest("[data-share]") && !t.closest("#theme")) closeMenu();
  const tmo = t.closest("[data-tmode]"); if (tmo) { setThemeMode(tmo.dataset.tmode); closeMenu(true); return; }
  const sa = t.closest("[data-sact]"); if (sa) { shareAct(sa.dataset.sact); return; }
  const shb = t.closest("[data-share]"); if (shb) { menuBtn === shb ? closeMenu() : openMenu(shb); return; }
  if (t.closest("[data-listen]")) { listen(); return; }
  if (t.closest("[data-kbd-open]")) { toggleKeys(true); return; }
  if (t.closest("[data-kbd-close]") || t.id === "kbd") { toggleKeys(); return; }
  const ca = t.closest("[data-cact]"); if (ca) { const k = ca.dataset.cact; if (k === "x") clearClause(); else if (k === "share") doShare(); else if (k === "link") copy(shareTarget().url, "Link copied"); else if (k === "cite") copy(shareTarget().cite, "Citation copied"); return; }
  const ck = t.closest("[data-clause]"); if (ck) { selClause === ck.dataset.clause ? clearClause() : selectClause(ck.dataset.clause); return; }
  const amv = t.closest("[data-amv]"); if (amv) { amdView = amv.dataset.amv; render(true); return; }
  const yd = t.closest(".chart .yd"); if (yd) { amdFilter = "all"; location.hash = "#amend-" + yd.dataset.n; return; }
  if (route.name === "art" && !t.closest("a, button, .fn") && t.closest("#text p") && !(getSelection && String(getSelection()).trim())) { const cid = clauseFor(t.closest("#text p")); if (cid) { selClause === cid ? clearClause() : selectClause(cid); return; } }
  if (t.closest("[data-search]")) { openSearch(); return; }
  if (t.closest("[data-more]")) { moreOpen() ? closeMore() : openMore(); return; }
  const sqq = t.closest("[data-search-q]"); if (sqq) { openSearch(sqq.dataset.searchQ); return; }
  const go = t.closest("[data-goto-fn]"); if (go) { gotoNote(go.dataset.gotoFn); return; }
  const gp = t.closest("[data-goto-p]"); if (gp) { gotoPara(+gp.dataset.gotoP); return; }
  const fn = t.closest(".fn"); if (fn) { e.preventDefault(); popBtn === fn ? closePop() : openPop(fn); return; }
  const tm = t.closest(".term"); if (tm) { e.preventDefault(); popBtn === tm ? closePop() : openTerm(tm); return; }
  if (pop && !t.closest(".pop")) closePop();
  const fsb = t.closest("[data-fscroll]"); if (fsb) { const row = $(".factwrap .facts"); row.scrollBy({ left: +fsb.dataset.fscroll * (row.clientWidth - 40), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  if (t.closest("[data-random]")) { const live = ORDER.filter(n => !ART.get(n).o); location.hash = "#art-" + live[Math.floor(Math.random() * live.length)]; return; }
  const bar = t.closest(".chart .b, .chart .nc"); if (bar) { amdFilter = "all"; location.hash = "#amend-" + bar.dataset.n; return; }
  const af = t.closest("[data-af]"); if (af) { amdFilter = af.dataset.af === amdFilter && amdFilter !== "all" ? "all" : af.dataset.af; render(true); return; }
  const ct = t.closest("[data-ctab]"); if (ct) { const tab = ct.dataset.ctab; $("#ctree").innerHTML = tab === "sch" ? schTree() : partTree(); $$("[data-ctab]").forEach(b => b.setAttribute("aria-pressed", b === ct)); filterContents($("#cfilter").value); return; }
  const ex = t.closest("[data-expand]"); if (ex) { const ds = $$("details.pt-g"); const open = !ds.every(d => d.open); ds.forEach(d => d.open = open); ex.textContent = open ? "Collapse all" : "Expand all"; return; }
  const bsl = t.closest("[data-bsel]"); if (bsl) { const nb = +bsl.dataset.bsel; if (bsPick && nb === bsSel) { bsPick = false; bsSel = 0; } else { bsPick = true; bsSel = nb; } $$("[data-bsel]").forEach(b => b.setAttribute("aria-pressed", String(bsPick && +b.dataset.bsel === bsSel))); $$(".bcell").forEach(c => c.classList.toggle("dim", bsPick && !c.classList.contains("b" + bsSel))); $("#bslist").innerHTML = `<h3>${BAND[bsSel].t}${BAND[bsSel].r ? ` <small>${BAND[bsSel].r}</small>` : ""}</h3>` + bsList(); return; }
  const jp = t.closest("[data-jump]"); if (jp) { e.preventDefault(); const el = document.getElementById(jp.dataset.jump); if (el) el.scrollIntoView({ block: "start" }); return; }
  if (t.closest("[data-fs]")) { fsIdx = (fsIdx + 1) % FS.length; store.set("fs", fsIdx); applyFs(); toast(`Text size ${fsIdx + 1} of ${FS.length}`); return; }
  if (t.closest("[data-retry]")) { loadText(); render(true); return; }
  if (t.closest("[data-side]")) { openSide(); return; }
  if (t.closest("[data-scrim]")) { closeSide(); return; }
  const tl = t.closest("[data-theme-link]"); if (tl) themeCtx = tl.dataset.themeLink;
  const sv = t.closest("[data-save]");
  if (sv) {
    const n = sv.dataset.save, before = savedList(), on = !before.includes(n);
    setSaved(n, on ? [n, ...before] : before.filter(x => x !== n));
    toast(on ? `Saved Article ${n}` : `Removed Article ${n}`, on ? null : () => { setSaved(n, before); toast(`Saved Article ${n}`); });
    return;
  }
  if (t.closest("[data-undo]")) { const u = toastUndo; toastUndo = null; clearTimeout(tt); $("#toast").classList.remove("on", "act"); if (u) u(); return; }
  const cp = t.closest("[data-copy]");
  if (cp) { const n = cp.dataset.copy, a = ART.get(n), x = artText(n); if (x) copy(`Article ${n}. ${a.t}\n\n${x.p.map(p => plain(p[1])).join("\n")}\n\nThe Constitution of India (as on ${CORE.meta.asOn})`, `Copied Article ${n}`); return; }
  const ci = t.closest("[data-cite]");
  if (ci) { const n = ci.dataset.cite, a = ART.get(n), Pp = PARTS[a.p]; copy(`Constitution of India, Article ${n} (${a.t.replace(/\.$/, "")}), Part ${Pp.n}. Text as on ${CORE.meta.asOn}, Legislative Department, Ministry of Law and Justice, Government of India.`, "Citation copied"); return; }
  const thb = t.closest("#theme"); if (thb) { menuBtn === thb ? closeMenu() : openThemeMenu(thb); return; }
  const link = t.closest("a[href^='#']");
  if (link && themeCtx) { const h = link.getAttribute("href"); const th = THEME_BY.get(themeCtx); if (th && !(h.startsWith("#theme-") || th.i.some(id => itemHref(id) === h))) themeCtx = null; }
});
document.addEventListener("change", e => { if (e.target.matches && e.target.matches("[data-rate]")) setRate(+e.target.value); });
document.addEventListener("input", e => {
  if (e.target.id === "cfilter") filterContents(e.target.value);
  if (e.target.id === "sfilter") {
    fillSide(true);
    const q = e.target.value.trim().toLowerCase(), side = $("#side");
    $$("details", side).forEach(d => { let any = false; $$(".sl", d).forEach(a => { const ok = !q || (a.dataset.f || "").includes(q) || (a.dataset.f || "").split(" ")[0] === q; a.hidden = !ok; if (ok) any = true; }); $$(".sg", d).forEach(g => g.hidden = !!q); d.hidden = !!q && !any; if (q && any) d.open = true; });
  }
  if (e.target.id === "gfilter") { const q = e.target.value.trim().toLowerCase(); $$(".gterm").forEach(g => g.hidden = !!q && !g.dataset.f.includes(q)); $$(".gl-letter").forEach(h => { const grp = h.nextElementSibling; const any = $$(".gterm", grp).some(g => !g.hidden); h.hidden = grp.hidden = !any; }); }
});
document.addEventListener("keydown", e => {
  const typing = /input|textarea|select/i.test(e.target.tagName);
  if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); dlgOpen() ? closeSearch() : openSearch(); return; }
  if (e.key === "Escape") { closePop(); closeSide(); closeMenu(true); if ($("#kbd")) { toggleKeys(); return; } if (selClause) clearClause(); }
  if (e.key === "Enter" && e.target.id === "sfilter") { const first = $$("#side .sl").find(a => !a.hidden); if (first) location.hash = first.getAttribute("href"); }
  if (typing || dlgOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "?") { toggleKeys(); return; }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const fw = e.key === "ArrowRight";
    if (route.name === "art") { const n = ORDER[ART.get(route.id).i + (fw ? 1 : -1)]; location.hash = n ? "#art-" + n : fw ? "#sch-FIRST" : "#preamble"; }
    else if (route.name === "pre" && fw) location.hash = "#art-1";
    else if (route.name === "sch") { const i = SCH_BY.get(route.id) + (fw ? 1 : -1); location.hash = i < 0 ? "#art-" + ORDER[ORDER.length - 1] : i < SCH.length ? "#sch-" + SCH[i].k : location.hash; }
    return;
  }
  const k1 = e.key.toLowerCase();
  if (k1 === "l" && (route.name === "art" || route.name === "pre")) { listen(); return; }
  if (route.name === "art" && k1 === "s") { const b = $("[data-save]"); if (b) b.click(); return; }
  if (route.name === "art" && k1 === "c") { copy(shareTarget().cite, "Citation copied"); return; }
});
function showTip(e) {
  const sg = e.target.closest && e.target.closest(".sx[data-tip]");
  if (sg) { tip.innerHTML = `<b>${esc(sg.dataset.tip)}</b>`; const r = sg.getBoundingClientRect(); tip.classList.add("on"); const tw = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, document.documentElement.clientWidth - tw - 8)) + "px"; tip.style.top = (r.top - tip.offsetHeight - 8) + "px"; return; }
  const c = e.target.closest && e.target.closest(".bcell");
  if (!c) { tip.classList.remove("on"); return; }
  const [k, id] = c.dataset.bs.split(/:(.+)/), v = bsOf(k === "s" ? "sch" : "art", id);
  const name = k === "s" ? schName(id) : id === "Preamble" ? "Preamble" : "Article " + id, title = k === "s" ? SCH[SCH_BY.get(id)].t : id === "Preamble" ? "" : ART.get(id).t;
  tip.innerHTML = `<b>${esc(name)} · ${BAND[v.b].t}${v.b ? " (" + BAND[v.b].r + ")" : ""}</b>${esc(title)}`;
  const r = c.getBoundingClientRect(); tip.classList.add("on");
  const tw = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, document.documentElement.clientWidth - tw - 8)) + "px";
  tip.style.top = (r.top - tip.offsetHeight - 8 < 8 ? r.bottom + 8 : r.top - tip.offsetHeight - 8) + "px";
}
document.addEventListener("pointerover", showTip);
document.addEventListener("focusin", showTip);
addEventListener("scroll", () => tip.classList.remove("on"), { passive: true });
/* the facts row: dim the previous/next buttons at either end */
document.addEventListener("scroll", e => {
  const row = e.target; if (!row.classList || !row.classList.contains("facts")) return;
  const [prev, next] = $$("[data-fscroll]"); if (!prev) return;
  prev.disabled = row.scrollLeft < 4; next.disabled = row.scrollLeft > row.scrollWidth - row.clientWidth - 4;
}, { capture: true, passive: true });

/* theme */
const curTheme = () => document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
function setThemeIcon() { const b = $("#theme"), m = THEME_MODES.find(x => x[0] === themeMode()); b.innerHTML = I[m[1]]; b.setAttribute("aria-label", `Appearance: ${m[2]}`); }
function setThemeMode(m) {
  if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m);
  store.set("theme", m === "auto" ? null : m); setThemeIcon(); setQuiltVars(); if (route.name === "home") startHeroQuilt();
}
const savedTheme = store.get("theme", null); if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

/* boot */
$(".brand").insertAdjacentHTML("afterbegin", chakra());
$(".sbtn").insertAdjacentHTML("afterbegin", I.search);
$("#sbar-ic").outerHTML = I.search;
$("#sclose").innerHTML = I.close;
const TAB_IC = { home: I.explore, contents: I.book, themes: I.grid, saved: I.bookmark, more: I.more };
$$(".tabs [data-ic]").forEach(el => el.insertAdjacentHTML("afterbegin", TAB_IC[el.dataset.ic]));
$$("[data-icon]").forEach(el => el.insertAdjacentHTML("afterbegin", I[el.dataset.icon]));
setThemeIcon();
{ const qs = $(".qstrip"); if ("IntersectionObserver" in window && qs) { const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setQuiltVars(); o.disconnect(); } }, { rootMargin: "600px" }); o.observe(qs); } else setQuiltVars(); }
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { setQuiltVars(); if (route.name === "home") startHeroQuilt(); });
addEventListener("hashchange", () => render());
addEventListener("scroll", () => { if (savePosT) return; savePosT = requestAnimationFrame(() => { savePosT = 0; const st = history.state; if (st && st.i != null) POS[st.i] = Math.round(scrollY); }); }, { passive: true });
const savePos = () => { try { sessionStorage.setItem("pos", JSON.stringify(POS)); sessionStorage.setItem("navi", String(NAVI)); } catch (e) {} };
addEventListener("pagehide", savePos); document.addEventListener("visibilitychange", () => { if (document.hidden) savePos(); });
$("#backchip").addEventListener("click", () => history.back());
let wasCompact = document.documentElement.clientWidth < 640;
addEventListener("resize", () => { const c = document.documentElement.clientWidth < 640; if (c !== wasCompact) { wasCompact = c; $$(".chart").forEach(el => { if (el.childElementCount) el.innerHTML = amdChartNow(route.name === "amend" ? route.id : undefined); }); } }, { passive: true });
render();
/* visit counts (GoatCounter), public site only: not in the claude.ai frame or on local test servers. Each hash route counts as its own page. */
if (!framed && location.protocol === "https:" && !/claudeusercontent|claude\.(site|ai)$/.test(location.hostname)) {
  const gcCount = () => { const g = window.goatcounter; if (g && g.count) g.count({ path: location.pathname + (location.hash || "#home"), title: document.title }); };
  window.goatcounter = { no_onload: true };
  const s = document.createElement("script");
  s.async = true; s.src = "https://gc.zgo.at/count.js"; s.dataset.goatcounter = "https://constitutionofindia.goatcounter.com/count";
  s.onload = gcCount; document.head.appendChild(s);
  addEventListener("hashchange", gcCount);
}
if (route.name === "art") {
  const P = PARTS[ART.get(route.id).p];
  fetch(`t/${P.n}.json?v=__TEXTV__`).then(r => r.ok ? r.json() : null).then(j => { if (j && !TEXT && route.name === "art" && j.a[route.id]) { EARLY = j; earlyFor = route.id; render(true); } }).catch(() => {});
}
if (needsText()) ensureText();
else if (route.name === "home") { quiltDone = ensureText; setTimeout(ensureText, 3500); }
else (window.requestIdleCallback || (f => setTimeout(f, 1)))(ensureText, { timeout: 600 });
})();
