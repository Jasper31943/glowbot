// node tools/boss-preview-1415.js -> shots/bosses_1415_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(16*14,16*12),s=sandbox(c);vm.runInContext(\`
for(let y=0;y<5;y++)for(let x=0;x<14;x++)factoryFloor(x*16,y*16,x,y);
for(let y=5;y<12;y++)for(let x=0;x<14;x++)coreFloor(x*16,y*16,x,y);
glitchKing(12,24,0,3,0,false);glitchKing(44,24,1,3,0,true);glitchKing(76,24,0,2,1,false);glitchKing(108,24,0,3,2,false);glitchKing(140,24,0,3,0,false,true);
[.3,1.0,1.4].forEach((t,i)=>glitchKingDefeat(12+i*28,56,t,3));
friendlyBot(8,48,false);glitchBot(32,48,0,false,0);conveyor(56,48,3,1);robot(200,48,'n','down',0,0,1);
// core row: glitchCore is 48x48 — place with room
[0,1,3,5].forEach((ph,i)=>glitchCore(8+i*56,96,ph,false,.4));
glitchCore(8,160,2,true,.4);
[.4,1.1,1.5].forEach((t,i)=>glitchCoreDefeat(80+i*56,160,t,3));
coreBuddy(8,210,false);robot(200,210,'n','down',0,0,1);\`,s);
png(c,path.join(ROOT,'shots/bosses_1415_preview.png'));`;eval(src);
