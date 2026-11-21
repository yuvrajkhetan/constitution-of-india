import subprocess, os
shell = open("tpl/shell.html").read()
css = subprocess.run(["csso", "tpl/style.css"], capture_output=True, text=True, check=True).stdout
js = subprocess.run(["terser", "tpl/app.js", "-c", "-m", "--ecma", "2020"], capture_output=True, text=True, check=True).stdout
core = open("site/core.json").read().replace("</", "<\\/")
page = shell.replace("/*CSS*/", css).replace("/*CORE*/", core).replace("/*JS*/", js)
open("site/index.html", "w").write(page)
open("site/preview.html", "w").write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Constitution of India</title><meta name="description" content="Read and search the Constitution of India: every article in the official words, with plain-English summaries, themes, amendment history and the basic structure."><meta name="theme-color" content="#f5f5f7"><meta property="og:title" content="Constitution of India"><meta property="og:description" content="Every article in the official words, with plain-English summaries, themes, amendment history and the basic structure."><meta property="og:type" content="website"><link rel="icon" href="data:,"><style>[hidden]{display:none!important}</style></head><body>' + page + "</body></html>")
for f in ("index.html", "text.json"): print(f, os.path.getsize("site/" + f))

# GitHub Pages copy: the standalone page and its data go to the repository root
import shutil
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
shutil.copy("site/preview.html", os.path.join(root, "index.html"))
shutil.copy("site/text.json", os.path.join(root, "text.json"))
