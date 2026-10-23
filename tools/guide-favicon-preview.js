// node tools/guide-favicon-preview.js -> favicon.ico, favicon-32.png, shots/guide_arrow_favicon.png
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.replace('SC=4','SC=(global.SCALE||4)');src=src.slice(0,src.indexOf('// ---- desert sheet'));
global.SCALE=1;eval(src+`
{const c=makeCtx(16,16),s=sandbox(c);vm.runInContext("R(0,0,16,16,'#ff00ff');R(1,0,14,16,E32.navy);R(0,1,16,14,E32.navy);T=0.5;robot(0,1,'n','down',0,0,1)",s);png(c,'/tmp/fav16.png')}
{const c=makeCtx(16*9,16*3),s=sandbox(c);vm.runInContext(fs.readFileSync(path.join(ROOT,'ice-art.js'),'utf8').replace(/^const /gm,'var '),s);
 vm.runInContext("for(let y=0;y<3;y++)for(let x=0;x<9;x++)iceNormal(x*16,y*16,x,y);[0,1,2,3].forEach(d=>{guideArrow(8+d*32,4,d,0);guideArrow(8+d*32,26,d,.3)});",s);png(c,'/tmp/arrows.png')}`);
const R=path.join(__dirname,'..');
execSync('python3 -',{input:`from PIL import Image
a=Image.open('/tmp/fav16.png').convert('RGBA');px=a.load()
for y in range(16):
  for x in range(16):
    if px[x,y][:3]==(255,0,255):px[x,y]=(0,0,0,0)
a32=a.resize((32,32),Image.NEAREST);a32.save('${R}/favicon-32.png')
a32.save('${R}/favicon.ico',sizes=[(16,16),(32,32)],append_images=[a])
ar=Image.open('/tmp/arrows.png');W,H=ar.size;ar4=ar.resize((W*4,H*4),Image.NEAREST)
sheet=Image.new('RGBA',(W*4+16+16+128+16,H*4),(24,20,37,255));sheet.paste(ar4,(0,0))
sheet.paste(a,(W*4+16,8),a);sheet.paste(a.resize((128,128),Image.NEAREST),(W*4+48,8),a.resize((128,128),Image.NEAREST))
sheet.convert('RGB').save('${R}/shots/guide_arrow_favicon.png')
print(Image.open('${R}/favicon.ico').info, Image.open('${R}/favicon.ico').ico.sizes())`});
