// node tools/boss-preview-567.js -> shots/bosses_567_preview.png (4x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.replace('SC=4','SC='+(process.env.SC||4));src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const sheet=(name,code)=>{const c=makeCtx(16*12,16*12),s=sandbox(c);vm.runInContext(code,s);png(c,path.join(ROOT,'shots/'+name))};
sheet((process.env.OUT||'bosses_567_preview.png'),\`
for(let y=0;y<4;y++)for(let x=0;x<12;x++)swampMud(x*16,y*16,x,y,0);
for(let y=4;y<8;y++)for(let x=0;x<12;x++)mineFloor(x*16,y*16,x,y);
for(let y=8;y<12;y++)for(let x=0;x<12;x++)volcanoGround(x*16,y*16,x,y);
[[0,2,0],[1,2,0],[0,3,1],[1,3,2]].forEach(([f,d,h],i)=>mudFrogKing(8+i*24,16,f,d,h,.1));
[0,.4,.9,1.1,1.3].forEach((t,i)=>mudFrogKingDefeat(104+i*16,40,t,3));
robotShadow(170,16);robot(170,16,'n','down',0,0,1);
[[0,3,0],[1,3,0],[0,2,1],[1,2,2]].forEach(([f,d,h],i)=>moleKing(8+i*24,80,f,d,h,.3));
[0,.4,.95,1.1,1.3].forEach((t,i)=>moleKingDefeat(90+i*18,104,t,3));
robotShadow(170,80);robot(170,80,'n','down',0,0,1);
[0,1,2,3].forEach(s=>lavaGiant(8+s*28,144,s,.5));
[.3,.7,1.2].forEach((t,i)=>lavaGiantDefeat(124+i*22,144,t));
bossCheckpointFlame(8,168,false,0);bossCheckpointFlame(28,168,true,.05);bossCheckpointFlame(48,168,true,1);
robotShadow(170,168);robot(170,168,'n','down',0,0,1);\`);`;
eval(src);
