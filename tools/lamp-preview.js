// node tools/lamp-preview.js -> shots/lighthouse_lamp_on_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(48*6,80*2),s=sandbox(c);vm.runInContext(\`
R(0,0,288,160,'#5a9bd8');R(0,76,288,4,E32.green2);R(0,156,288,4,E32.green2);
[0,.3,.6,.9,1.2,1.5].forEach((t,i)=>{lighthouseLampOn(8+i*48,10,0,0,t);lighthouseLampOn(8+i*48,90,7,7,t)});\`,s);
png(c,path.join(ROOT,'shots/lighthouse_lamp_on_preview.png'));`;
eval(src);
