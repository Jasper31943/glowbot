# builds shots/bossmoves/sheet.html (markers drawn by the REAL bossMark code from world.js + room screenshots) → screenshot = new_visuals.png
import re,json,sys
src=open('/workspace/robot-maze/world.js',encoding='utf-8').read()
a=src.index('function bossMarkFrame');b=src.index('function bossWarnFx')
fn=src[a:b]
items=json.loads(sys.argv[1]);OUT=sys.argv[2] if len(sys.argv)>2 else 'sheet.html';TITLE=sys.argv[3] if len(sys.argv)>3 else '王戰更新：新畫面（打昏星星沿用小怪的；以下是新增的預告記號）'  # [[kind,label,desc,roomimg|null],...]
html='''<!doctype html><meta charset=utf-8><style>@font-face{font-family:C;src:url(../../fonts/Cubic_11.woff2)}body{margin:0;background:#262b44;color:#fff;font-family:C,sans-serif;width:1160px}
h1{font-size:30px;margin:16px 20px 4px}p.s{margin:0 20px 12px;color:#c0cbdc;font-size:18px}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:0 20px 20px}
.c{background:#181425;border-radius:8px;padding:10px}.c h2{font-size:22px;margin:0 0 4px;color:#fee761}.c div{font-size:16px;color:#c0cbdc;margin-bottom:8px;min-height:40px}.row{display:flex;gap:8px;align-items:flex-end}
canvas{image-rendering:pixelated}img{width:120px;image-rendering:pixelated;border-radius:4px}</style>
<h1>'''+TITLE+'''</h1><p class=s>每格放大約 5 倍；左右兩格是動畫的兩個影格。紅框＝下一步會被打到，藍框＝不會受傷的變化</p><div class=g id=g></div>
<script src="../../art.js"></script><script>let o;let T=0;'''+fn+'''
const IT='''+json.dumps(items,ensure_ascii=False)+''';
const g=document.getElementById('g');for(const [kind,label,desc,img] of IT){const c=document.createElement('div');c.className='c';c.innerHTML='<h2>'+label+'</h2><div>'+desc+'</div>';const r=document.createElement('div');r.className='row';
 for(const t of [0,.3]){const cv=document.createElement('canvas');cv.width=16;cv.height=16;cv.style.width='84px';cv.style.height='84px';o=cv.getContext('2d');R(0,0,16,16,'#5a6988');R(0,0,16,1,'#3a4466');R(0,15,16,1,'#3a4466');bossMark(0,0,kind,t,1);r.appendChild(cv)}
 if(img){const im=document.createElement('img');im.src=img;r.appendChild(im)}c.appendChild(r);g.appendChild(c)}
</script>'''
open('/workspace/robot-maze/shots/bossmoves/'+OUT,'w',encoding='utf-8').write(html)
