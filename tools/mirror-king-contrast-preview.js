// node tools/mirror-king-contrast-preview.js -> shots/mirror_king_contrast_preview.png
// before (tools/mirror-art-before-ref.js) vs after (mirror-art.js) mirrorKing on real mirror floor, at 1x and 3x.
const fs=require('fs'),path=require('path'),cp=require('child_process');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1')+`
const c=makeCtx(16*10,16*6);
const scene=y0=>\`for(let y=0;y<3;y++)for(let x=0;x<10;x++){if(y===0)mirrorWall(x*16,\${y0},x,0);else mirrorFloor(x*16,\${y0}+y*16,x,y)}
robot(8,\${y0}+28,'n','right',0,0,1);mirrorKing(28,\${y0}+28,0,2,0,0);mirrorKing(48,\${y0}+28,1,2,0,0);mirrorKing(68,\${y0}+28,0,3,1,0);
mirrorKing(88,\${y0}+28,0,3,0,0,true);mirrorKingDefeat(108,\${y0}+28,.3,3);mirrorKingDefeat(130,\${y0}+28,1.2,3);\`;
const sb=sandbox(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'mirror-art-before-ref.js'),'utf8').replace(/^const /gm,'var '),sb);vm.runInContext(scene(0),sb);
const sa=sandbox(c);vm.runInContext(scene(48),sa);
png(c,'/tmp/mk_1x.png');
cp.execFileSync('python3',['-c',\`
from PIL import Image,ImageDraw,ImageFont
im=Image.open('/tmp/mk_1x.png');w,h=im.size;S=3;pad=10;lab=14
try:f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',12)
except Exception:f=ImageFont.load_default()
out=Image.new('RGB',(pad*3+w+w*S,pad*2+lab+h*S),'#181425');d=ImageDraw.Draw(out)
out.paste(im,(pad,pad+lab));out.paste(im.resize((w*S,h*S),Image.NEAREST),(pad*2+w,pad+lab))
d.text((pad,pad-4),'1x',fill='#c0cbdc',font=f);d.text((pad*2+w,pad-4),'3x   top: before   bottom: after (grey4 halo + navy shadow)',fill='#c0cbdc',font=f)
out.save('\${path.join(ROOT,'shots/mirror_king_contrast_preview.png')}')\`]);`;eval(src);
