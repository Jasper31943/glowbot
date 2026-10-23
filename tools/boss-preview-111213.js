// node tools/boss-preview-111213.js -> shots/bosses_111213_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(16*12,16*12),s=sandbox(c);vm.runInContext(\`
for(let y=0;y<4;y++)for(let x=0;x<12;x++)mirrorFloor(x*16,y*16,x,y);
for(let y=4;y<8;y++)for(let x=0;x<12;x++)powerFloor(x*16,y*16,x,y);
for(let y=8;y<12;y++)for(let x=0;x<12;x++)clockFloor(x*16,y*16,x,y);
mirrorKing(8,16,0,3,0,0);mirrorKing(32,16,1,3,0,0);mirrorKing(56,16,0,2,1,0);mirrorKing(80,16,0,3,0,0,true);
[.3,1.0,1.4].forEach((t,i)=>mirrorKingDefeat(104+i*22,16,t,3));glassBuddy(8,40,false);
lightDoor(40,40,false,0);lightDoor(60,40,true,0);robot(170,16,'n','down',0,0,1);
sparkKing(8,80,0,3,0,false,true);sparkKing(32,80,1,3,0,true,true);sparkKing(56,80,0,2,1,false,true);sparkKing(80,80,0,3,2,false,false);sparkKing(104,80,0,3,0,false,true,true);
[.3,1.0,1.4].forEach((t,i)=>sparkKingDefeat(128+i*20,80,t,3));
wireGap(8,112,0,0,false,0);wireGap(28,112,0,0,true,.3);powerDoor(48,112,false,0);powerDoor(68,112,true,0);robot(170,112,'n','down',0,0,1);
clockGuard(8,144,0,.5);clockGuard(36,144,1,.5);clockGuard(64,144,2,.5);clockGuard(92,144,0,.5,true);
[.3,1.0,1.4].forEach((t,i)=>clockGuardDefeat(120+i*22,144,t,3));littleGear(8,176,false);
gearGate(32,176,false,0,0);gearGate(52,176,true,0,0);robot(170,176,'n','down',0,0,1);\`,s);
png(c,path.join(ROOT,'shots/bosses_111213_preview.png'));`;eval(src);
