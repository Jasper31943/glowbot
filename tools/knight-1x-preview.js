// node tools/knight-1x-preview.js -> shots/knight_1x_2x.png (1x crop next to 2x)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.replace('SC=4','SC=1');src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(16*8,48),s=sandbox(c);vm.runInContext("for(let y=0;y<3;y++)for(let x=0;x<8;x++)castleFloor(x*16,y*16,x,y);armorKnightKing(4,20,0,3,0,false);armorKnightKing(24,20,1,3,1,true);armorKnightKing(44,20,0,2,2,false);armorKnightKing(64,20,0,3,0,false,true);littleKnight(84,24,false);robot(104,24,'n','down',0,0,1)",s);png(c,'/tmp/k1x.png');`;eval(src);
execSync('python3 -',{input:`from PIL import Image
a=Image.open('/tmp/k1x.png');W,H=a.size;im=Image.new('RGB',(W*3+8,H*2),(24,20,37));im.paste(a,(0,0));im.paste(a.resize((W*2,H*2),Image.NEAREST),(W+8,0));im.save('${path.join(__dirname,'..','shots','knight_1x_2x.png')}')`});
