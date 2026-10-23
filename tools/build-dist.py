#!/usr/bin/env python3
# Build dist/ for GitHub Pages: index.html = big map adventure (the only mode; the old 30-level mode was removed 2026-10-23,
# levels.html is now just a redirect stub to the big map for old links). Test hooks stripped.
# index.html/game.js stay in the source tree only as the art source for art.js (tools/extract-art.py) and the og meta tags.
import os,re,shutil
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
shutil.rmtree('dist',ignore_errors=True);os.makedirs('dist/fonts');os.makedirs('dist/world')
ERR=b'<script>window.__errs=[];addEventListener("error",e=>__errs.push(e.message))</script>'
meta=re.search(r'<title>.*?twitter:card" content="summary_large_image">',open('index.html').read(),re.S).group(0)
w=open('world.js').read();open('dist/world.js','w').write(w[:w.index('// --- test hook')])
wh=open('world.html').read();assert 'levels.html' not in wh and '關卡模式' not in wh
wh=re.sub(r'<title>.*?</title>',meta,wh,flags=re.S);open('dist/index.html','w').write(wh)
open('dist/levels.html','w').write('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>Glowbot 小光</title><meta http-equiv="refresh" content="0;url=./"><link rel="canonical" href="./"><script>location.replace(\'./\')</script></head><body><a href="./">Glowbot 小光</a></body></html>\n')
for f in ['logic.js','art.js','world-engine.js','music.js','ice-art.js','desert-art.js','forest-art.js','bomb-range-art.js','treant-guard-art.js','hit-fx-spec.js','hit-feel.js','share.js','ending-art.js','core-art.js','swamp-art.js','volcano-art.js','mine-art.js','sea-art.js','sky-art.js','power-art.js','castle-art.js','mirror-art.js','clock-art.js','clock-mech-art.js','factory-art.js','bat-art.js','og.png','og-clear.png','share-clear.html','fonts/Cubic_11.woff2','fonts/OFL.txt','world/world-def.js']:shutil.copy(f,'dist/'+f)
for f in ['index.html','levels.html']:
  t=open('dist/'+f,'rb').read().replace(ERR,b'');open('dist/'+f,'wb').write(t)
  assert b'URLSearchParams' not in t
for f in ['world.js']:assert 'URLSearchParams' not in open('dist/'+f).read()
for f in ['favicon.ico','favicon-32.png']:shutil.copy(f,'dist/'+f)
os.makedirs('dist/assets',exist_ok=True)
for f in ['assets/baseball_bat_icon_16.png','assets/baseball_bat_icon_32.png']:shutil.copy(f,'dist/'+f) # HUD/hint bat icon (⚾ has no glyph in the game font) # by 美術監督
# cache-busting: Pages serves max-age=600, so stamp every local script with a content hash (index.html + dynamic art loads via window.ASSET_V)
import hashlib
H={}
for d,_,fs in os.walk('dist'):
  for x in fs:
    if x.endswith('.js'):r=os.path.relpath(os.path.join(d,x),'dist');H[r]=hashlib.md5(open('dist/'+r,'rb').read()).hexdigest()[:8]
for f in ['index.html']:
  t=open('dist/'+f).read()
  t=re.sub(r'<script src="([^"?:]+\.js)"></script>',lambda m:'<script src="%s?v=%s"></script>'%(m.group(1),H[m.group(1)]) if m.group(1) in H else m.group(0),t)
  if f=='index.html':
    import json;t=t.replace('<script src="logic.js?v=','<script>window.ASSET_V='+json.dumps(H,sort_keys=True,separators=(',',':'))+'</script><script src="logic.js?v=',1);assert 'window.ASSET_V=' in t
  open('dist/'+f,'w').write(t)
print('\n'.join(sorted(os.path.relpath(os.path.join(d,x),'dist') for d,_,fs in os.walk('dist') for x in fs)))
