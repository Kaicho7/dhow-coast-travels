#!/usr/bin/env python3
"""Convert a Netlify build (dist/) into a GitHub Pages-safe export.

Strips Netlify Image CDN wrappers in every form they appear:
  /.netlify/images?url=/images/x.jpg&fm=webp&q=85[&w=...]
  /.netlify/images?url=%2Fimages%2Fx.jpg&fm=webp&q=85[&w=...]

Also repairs the half-stripped leftover bug:
  /images/x.jpg&fm=webp&q=85        -> /images/x.jpg
  /images/x.jpg&fm=webp&q=85&w=600  -> /images/x.jpg
"""
import re, glob, os, sys, shutil

src = sys.argv[1] if len(sys.argv) > 1 else "dist"
out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/opencode/ghdist"

if os.path.exists(out):
    shutil.rmtree(out)
shutil.copytree(src, out)

# 1) full CDN prefix + all trailing query params (up to closing quote)
full = re.compile(r'((?:src|href)=")/\.netlify/images\?url=(?:%2F/?)?(?:%2F)?(images/[^"?]*?)(?:&[^"]*)?(")')
# 2) half-stripped leftovers: src="/images/x.jpg&whatever" (only inside src attributes)
half = re.compile(r'(src=")(/[\w\-.]+(?:/[\w\-.]+)*\.(?:jpg|jpeg|png|JPG|PNG|webp))(?:&[^"]*)?(")')
# 3) other attributes referencing CDN query fragments in CSS/JS strings
attr_other = re.compile(r'(/\.\.?netlify/images\?url=)')

n_files = 0; n_subs = 0
attr = re.compile(r'((?:src|href)=")([^"]+)(")')
def fix_attr(m):
    global n_subs
    v = m.group(2)
    if "/.netlify/images?url=" in v:
        v = v.replace("/.netlify/images?url=/", "/")
        v = v.replace("/.netlify/images?url=%2Fimages%2F", "/images/")
    if v.startswith("/images/"):
        cut = v.find("&")
        if cut > -1:
            v = v[:cut]; n_subs += 1
    return m.group(1) + v + m.group(3)

for h in glob.glob(os.path.join(out, "**", "*.html"), recursive=True):
    t = open(h, encoding="utf8", errors="ignore").read()
    if "/.netlify/images?url=" in t or re.search(r'src="/images/[^"]*&', t):
        t2, subs_modified = attr.subn(fix_attr, t)
        if t2 != t:
            open(h, "w", encoding="utf8", errors="ignore").write(t2)
            n_files += 1
            

print(f"export_ghpages: {n_files} files rewritten, {n_subs} substitutions")
resid = 0
for h in glob.glob(os.path.join(out, "**", "*.html"), recursive=True):
    t = open(h, encoding="utf8", errors="ignore").read()
    resid += len(re.findall(r'netlify/images\?url=', t)) + len(re.findall(r'(?:src|href)="[^"]*\.jpg&', t))
print("residual CDN/refbad references:", resid)
