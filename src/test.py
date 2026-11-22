import asyncio
from playwright.async_api import async_playwright
URL="http://localhost:8766/preview.html"
Q=["Article 21","21a","voting age","money bill","who appoints the governor","freedom of religion","election of president","anti-defection","seventh schedule","42nd amendment","part ixa","\"equal protection\"","GST","citizenship","Keralam","privacy"]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":1280,"height":900})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(1500)
    await pg.keyboard.press("/")
    for q in Q:
      await pg.fill("#sq", q); await pg.wait_for_timeout(120)
      r=await pg.eval_on_selector_all(".res", "els=>els.slice(0,3).map(e=>e.querySelector('.k').textContent+' | '+e.querySelector('.t').textContent.slice(0,45))")
      print(f"{q!r:28} ->", r)
    await pg.keyboard.press("Escape")
    n=await pg.evaluate("""async()=>{const C=JSON.parse(document.getElementById('core').textContent);const bad=[];const go=async h=>{location.hash=h;await new Promise(r=>setTimeout(r,0));};
      for(const a of C.arts){await go('#art-'+a[0]);if(!document.querySelector('.ahead h1'))bad.push(a[0]); if(!a[3]&&!document.querySelector('.plain'))bad.push('nosum-'+a[0]);}
      for(const s of C.sch){await go('#sch-'+s.k);if(!document.querySelector('.blocks'))bad.push(s.k)}
      for(const p of C.parts){await go('#part-'+p.n);if(!document.querySelector('.lt'))bad.push('part'+p.n)}
      for(const t of C.themes){await go('#theme-'+t.id);if(!document.querySelector('.lt'))bad.push('th'+t.id)}
      for(const h of ['#glossary','#amendments','#amend-42','#saved','#contents','#preamble','#next-amendment','#']){await go(h);if(!document.querySelector('#view .view'))bad.push(h)}
      return [C.arts.length,bad]}""")
    print("routes", n, "errors", errs)
    # theme flow
    await pg.goto(URL+"#theme-rights"); await pg.wait_for_timeout(300)
    await pg.click(".group a.row >> nth=2"); await pg.wait_for_timeout(200)
    print("themebar:", await pg.inner_text(".themebar") if await pg.query_selector(".themebar") else None)
    await pg.click("[data-save]"); await pg.goto(URL+"#saved"); await pg.wait_for_timeout(200)
    print("saved:", await pg.eval_on_selector_all("#view .row .num","e=>e.map(x=>x.textContent)"))
    await pg.goto(URL+"#contents"); await pg.fill("#cfilter","election"); await pg.wait_for_timeout(150)
    print("filter:", await pg.eval_on_selector_all(".trow:not([hidden]) b","e=>e.map(x=>x.textContent)"))
    print("errors", errs)
    await b.close()
asyncio.run(main())
