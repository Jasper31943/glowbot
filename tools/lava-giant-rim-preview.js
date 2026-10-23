// node tools/lava-giant-rim-preview.js -> shots/lava_giant_rim_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(16*10,16*4),s=sandbox(c);vm.runInContext(\`
for(let y=0;y<4;y++)for(let x=0;x<10;x++){volcanoGround(x*16,y*16,x,y);if(y===2)lavaPool(x*16,y*16,(x+y)%2)}
[0,1,2,3].forEach(st=>lavaGiant(8+st*36,20,st,.6));
lavaGiantDefeat(8,48,.4);lavaGiantDefeat(44,48,1.2);rockBuddy(80,52);robot(140,28,'n','down',0,0,1);\`,s);
png(c,path.join(ROOT,'shots/lava_giant_rim_preview.png'));`;eval(src);
