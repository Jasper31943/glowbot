// node tools/stuck-box-preview.js -> shots/stuck_box_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(16*9,16*3),s=sandbox(c);
vm.runInContext(fs.readFileSync(path.join(ROOT,'ice-art.js'),'utf8').replace(/^const /gm,'var '),s);
vm.runInContext(\`for(let y=0;y<3;y++)for(let x=0;x<9;x++)iceNormal(x*16,y*16,x,y);
[0,.25,.5,.75].forEach((t,i)=>{crate(8+i*32,24,false,0);stuckBoxMark(8+i*32,24,t)});\`,s);
png(c,path.join(ROOT,'shots/stuck_box_preview.png'));`;eval(src);
