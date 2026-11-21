#!/bin/bash
URL=${1:-http://localhost:8766/preview.html}
for ff in mobile desktop; do CHROME_PATH=/opt/pw-browsers/chromium timeout 300 lighthouse "$URL" --quiet --chrome-flags="--headless=new --no-sandbox --proxy-server=direct://" $( [ $ff = desktop ] && echo --preset=desktop ) --output=json --output-path=lh/$ff.json >/dev/null 2>&1; python3 -c "
import json;r=json.load(open('lh/$ff.json'))
print('$ff', {k:round(v['score']*100) for k,v in r['categories'].items()})
for a in r['audits'].values():
  if a.get('score') is not None and a['score']<0.9 and a.get('scoreDisplayMode') in ('binary','numeric','metricSavings'): print('  ',a['id'],a.get('score'),a.get('displayValue',''))
print('  FCP',r['audits']['first-contentful-paint']['displayValue'],'LCP',r['audits']['largest-contentful-paint']['displayValue'],'TBT',r['audits']['total-blocking-time']['displayValue'],'CLS',r['audits']['cumulative-layout-shift']['displayValue'],'SI',r['audits']['speed-index']['displayValue'])
"; done
