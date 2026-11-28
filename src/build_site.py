import subprocess, os
shell = open("tpl/shell.html").read()
css = subprocess.run(["csso", "tpl/style.css"], capture_output=True, text=True, check=True).stdout
js = subprocess.run(["terser", "tpl/app.js", "-c", "-m", "--ecma", "2020"], capture_output=True, text=True, check=True).stdout
# stamp the data address with a fingerprint of text.json, so browsers never pair a new page with an old cached copy
import hashlib
assert js.count("__TEXTV__") == 2  # text.json and the per-Part files are versioned together
js = js.replace("__TEXTV__", hashlib.sha1(open("site/text.json", "rb").read()).hexdigest()[:10])
core = open("site/core.json").read().replace("</", "<\\/")
# when the site's content last changed: shown in the footer and on the About page. Change it by hand whenever readers
# would see something new (text, notes, summaries, analysis, features), not for purely technical rebuilds.
UPDATED = "28 November 2026"
assert shell.count("__UPDATED__") == 1 and js.count("__UPDATED__") == 1, "last-updated placeholders"
shell = shell.replace("__UPDATED__", UPDATED); js = js.replace("__UPDATED__", UPDATED)
page = shell.replace("/*CSS*/", css).replace("/*CORE*/", core).replace("/*JS*/", js)
open("site/index.html", "w").write(page)
# share tags for the GitHub Pages copy; link previews need absolute URLs
SITE = "https://yuvrajkhetan.github.io/constitution-of-india/"
HEAD = (f'<meta property="og:url" content="{SITE}"><meta property="og:image" content="{SITE}og.png">'
        '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
        '<meta property="og:image:alt" content="The Constitution of India: every article in the official words, with a plain-English summary. A patchwork quilt of Indian textiles frames the title.">'
        '<meta name="twitter:card" content="summary_large_image">')
open("site/preview.html", "w").write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Constitution of India</title><meta name="description" content="Read and search the Constitution of India: every article in the official words, with plain-English summaries, themes, amendment history and the basic structure."><meta name="theme-color" content="#f5f5f7"><meta property="og:title" content="Constitution of India"><meta property="og:description" content="Every article in the official words, with plain-English summaries, themes, amendment history and the basic structure."><meta property="og:type" content="website">' + HEAD + '<link rel="icon" href="favicon.ico" sizes="32x32"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><style>[hidden]{display:none!important}</style></head><body>' + page + "</body></html>")
for f in ("index.html", "text.json"): print(f, os.path.getsize("site/" + f))

# GitHub Pages copy: the standalone page and its data go to the repository root
import shutil
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
shutil.copy("site/preview.html", os.path.join(root, "index.html"))
shutil.copy("site/text.json", os.path.join(root, "text.json"))
# the per-Part files, mirrored exactly (stale ones removed)
os.makedirs(os.path.join(root, "t"), exist_ok=True)
for f in os.listdir(os.path.join(root, "t")):
    if not os.path.exists(os.path.join("site/t", f)): os.remove(os.path.join(root, "t", f))
for f in os.listdir("site/t"): shutil.copy(os.path.join("site/t", f), os.path.join(root, "t", f))
# favicons and share image, made by make_icons.js
for f in ("favicon.svg", "favicon.ico", "apple-touch-icon.png", "og.png"):
    if os.path.exists("site/" + f): shutil.copy("site/" + f, os.path.join(root, f))
