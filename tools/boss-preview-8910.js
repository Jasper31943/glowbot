// node tools/boss-preview-8910.js -> shots/bosses_8910_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const c=makeCtx(16*12,16*12),s=sandbox(c);vm.runInContext(\`
for(let y=0;y<4;y++)for(let x=0;x<12;x++)seaWater(x*16,y*16,x,y);
for(let y=4;y<8;y++)for(let x=0;x<12;x++)(y===7&&x<6?castleCarpet:castleFloor)(x*16,y*16,x,y);
for(let y=8;y<12;y++)for(let x=0;x<12;x++)skyBg(x*16,y*16,x,y);
crabKing(8,12,0,3,0,0);crabKing(36,12,1,3,0,0);crabKing(64,12,0,2,1,0);crabKing(92,12,0,3,0,0,true);
[.3,1.0,1.4].forEach((t,i)=>crabKingDefeat(118+i*20,12,t,3));smallCrab(8,40,false);robot(170,12,'n','down',0,0,1);
armorKnightKing(8,84,0,3,0,false);armorKnightKing(34,84,1,3,1,true);armorKnightKing(60,84,0,2,2,false);armorKnightKing(86,84,0,3,0,false,true);
[.3,.9,1.4].forEach((t,i)=>armorKnightKingDefeat(110+i*22,84,t,3));littleKnight(8,108,false);robot(172,108,'n','down',0,0,1);
stormBird(8,144,0,3,0,0);stormBird(38,144,1,3,0,.3);stormBird(68,144,0,2,1,0);stormBird(98,144,0,3,0,0,true);
[.3,1.0,1.4].forEach((t,i)=>stormBirdDefeat(122+i*22,144,t,3));skySparrow(8,170,false,0);robot(172,170,'n','down',0,0,1);\`,s);
png(c,path.join(ROOT,'shots/bosses_8910_preview.png'));`;eval(src);
