// Design sheet for hit-fx-spec.js (打擊手感規格, data) + crack-wall-art.js (球棒裂牆).
// Run: node tools/hitfx-crackwall-preview.js -> shots/t8/hitfx_crackwall_design.png (+ shots/t8/crops/*_2x.png)
// The spark / debris / shake drawing here is a PREVIEW MOCK of the spec only (the engine implements its own); crack walls use the real art file.
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1');
const body=fs.readFileSync(__filename,'utf8').split('/*@@'+'BODY')[1].split('@@'+'END*/')[0];eval(src+body);
/*@@BODY
const OUT='/tmp/hitfx';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});const panels=[];
// physics that is not in HIT_FX_SPEC (documented in shots/t8/hitfx_spec.md): [spreadDeg, gravity, lifeMin, lifeMax]
const PHYS={tree:[70,260,.25,.45],golem:[90,180,.3,.55],mole:[80,380,.22,.4],phantom:[100,320,.2,.38],guard:[60,340,.2,.4],knight:[60,340,.2,.4],crab:[100,-60,.35,.6],spark:[120,0,.12,.25],worm:[90,300,.2,.4],frog:[70,360,.2,.4],bird:[100,90,.35,.6],glitch:[90,0,.18,.35],core:[120,0,.18,.35],default:[80,320,.2,.4]};
const MOCK=`
var PHYS=${JSON.stringify(PHYS)};
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function debris(cx,cy,tt,key,kind,dirA,seed,al){const M=window.HIT_FX_SPEC[key]||window.HIT_FX_SPEC.default,P=PHYS[key]||PHYS.default,r=rng(seed),n=M.count[kind];
 for(let i=0;i<n;i++){const a=dirA+(r()-.5)*P[0]*Math.PI/180,v=M.speed[0]+r()*(M.speed[1]-M.speed[0]),life=P[2]+r()*(P[3]-P[2]),sz=M.size[Math.floor(r()*M.size.length)],col=M.colors[Math.floor(r()*M.colors.length)];
  if(tt<0||tt>=life)continue;const X=Math.round(cx+Math.cos(a)*v*tt),Y=Math.round(cy+Math.sin(a)*v*tt+.5*P[1]*tt*tt),f=tt>life*.7?1-(tt-life*.7)/(life*.3):1;o.globalAlpha=f*(al==null?1:al);
  if(sz[0]>=2&&sz[1]>=2)R(X+1,Y+1,sz[0],sz[1],E32.ink);R(X,Y,sz[0],sz[1],col)}o.globalAlpha=1}
// bat spark: 3 frames .03/.04/.05 s. (X,Y)=impact point, (bx,by)=unit vector back toward the attacker
function batSpark(X,Y,f,bx,by){const C={core:'#ead4aa',rim:'#feae34',edge:'#181425'};
 if(f===0){R(X-3,Y-1,7,3,C.edge);R(X-1,Y-3,3,7,C.edge);R(X-2,Y,5,1,C.rim);R(X,Y-2,1,5,C.rim);R(X,Y,1,1,C.core);return}
 if(f===1){[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{for(let k=3;k<=5;k++)R(X+a*k,Y+b*k,1,1,k===5?C.rim:C.core)});
  for(let i=-3;i<=3;i++){const ax=bx?X+bx*(4-Math.abs(i)>>1)+bx*2:X+i,ay=by?Y+by*(4-Math.abs(i)>>1)+by*2:Y+i;R(ax,ay,1,1,C.rim)}return}
 [[4,-3],[-2,5],[5,3]].forEach(([a,b])=>R(X+a+(bx?-bx*2:0),Y+b,1,1,C.rim))}
// bomb spark: 3 frames .04/.06/.08 s, centred on the boss tile edge nearest the bomb
function bombSpark(X,Y,f){const C={core:'#feae34',ring:'#f77622',edge:'#be4a2f',smoke:'#8b9bb4',smokeDark:'#5a6988'};
 if(f===0){R(X-4,Y-3,9,7,'#181425');R(X-3,Y-4,7,9,'#181425');R(X-3,Y-2,7,5,C.ring);R(X-2,Y-3,5,7,C.ring);R(X-2,Y-1,5,3,C.core);R(X-1,Y-2,3,5,C.core);return}
 if(f===1){for(let a=0;a<16;a++){const t=a/16*Math.PI*2,x=Math.round(X+Math.cos(t)*6),y=Math.round(Y+Math.sin(t)*6);R(Math.round(X+Math.cos(t)*7),Math.round(Y+Math.sin(t)*7),1,1,'#181425');R(x,y,1,1,C.ring);R(Math.round(X+Math.cos(t)*5),Math.round(Y+Math.sin(t)*5),1,1,C.edge)}
  [[-5,-5],[5,-5],[-5,5],[5,5]].forEach(([a,b])=>R(X+a-1,Y+b-1,3,3,C.smoke));return}
 o.globalAlpha=.6;[[-7,-5],[6,-6],[-6,6],[7,5],[0,-8]].forEach(([a,b],i)=>R(X+a-2,Y+b-2,4+(i%2),4,i%2?C.smokeDark:C.smoke));o.globalAlpha=1}`;
function panel(name,tw,th,code,tt){const c=makeCtx(tw*16,th*16),s=sandbox(c);s.T=tt==null?0.1:tt;
 for(const f of['bat-art.js','hit-fx-spec.js','crack-wall-art.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8').replace(/^const /gm,'var '),s);
 vm.runInContext(MOCK,s);
 vm.runInContext('var Bot=(x,y,d)=>{robotShadow(x*16,y*16);robot(x*16,y*16,"n",d||"right",0,0,1)};var FL={forest:forestGround,swamp:swampMud,mine:mineFloor,volcano:volcanoGround,sea:seaSand,castle:castleFloor,sky:(a,b,c,d)=>skyGround(a,b,c,d,{}),mirror:mirrorFloor,power:powerFloor,clock:clockFloor,factory:factoryFloor,core:coreFloor,desert:desertSand};'+
  'var Room=(th,w,h,f)=>{const W=CWA_THEMES[th],wf=globalThis[W.base];for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(f?f(x,y):(x===0||y===0||x===w-1||y===h-1))wf(x*16,y*16,x,y,0);else FL[th](x*16,y*16,x,y,0)}};'+code,s);
 png(c,path.join(OUT,name+'.png'));panels.push(name)}
// ---- A1 bat sequence: forest, 小光 at (1,2) facing right, treant boss tile (3,2) → elderTree at (40,16). impact point = trunk left edge (48,40)
const seqT=[0,.07,.10,.14,.19,.30,.45];
seqT.forEach((t,i)=>{const ti=t-.07;let fx='';
 if(ti>=0&&ti<.03)fx='batSpark(48,40,0,-1,0);';else if(ti>=.03&&ti<.07)fx='batSpark(48,40,1,-1,0);';else if(ti>=.07&&ti<.12)fx='batSpark(48,40,2,-1,0);';
 const hs=ti>=0&&ti<.075;panel('bat_'+i,5,4,'Room("forest",5,4);elderTree(40,16,0,'+(ti>=0&&ti<.12)+',3,3);Bot(1,2,"right");if(typeof batSwing==="function"&&'+t+'<.24)batSwing(16,32,3,'+t+',.24);'+fx+'debris(50,40,'+(ti-.02)+',"tree","bat",0,1234);',t)});
// ---- A1 bomb sequence: volcano, bomb at (2,2) next to lava giant at (3,2) (lavaGiant(px,py)), boom at t=0
const bseq=[0,.04,.10,.18,.30,.45];
bseq.forEach((t,i)=>{let fx='';if(t<.04)fx='bombSpark(40,44,0);';else if(t<.10)fx='bombSpark(40,44,1);';else if(t<.18)fx='bombSpark(40,44,2);';
 panel('bomb_'+i,5,4,'Room("volcano",5,4);lavaGiant(48,32,1,0.1);Bot(0+1,1,"right");'+fx+'debris(44,40,'+(t-.02)+',"golem","bomb",-1.9,777);',t)});
// ---- A2 debris per material: boss floor, 4x2 tiles, impact at left-middle, flying right. ghost trail at 3 times
const MAT=[['tree','forest'],['golem','volcano'],['mole','mine'],['phantom','mirror'],['guard','clock'],['knight','castle'],['crab','sea'],['spark','power'],['worm','desert'],['frog','swamp'],['bird','sky'],['glitch','factory'],['core','core'],['default','castle']];
MAT.forEach(([k,th])=>panel('mat_'+k,4,2,'for(let y=0;y<2;y++)for(let x=0;x<4;x++)FL["'+th+'"](x*16,y*16,x,y,0);[.06,.14,.24].forEach((t,i)=>debris(10,14,t,"'+k+'","ko",0,4242+i*0,[.35,.6,1][i]));'));
// ---- B crack walls: every theme, 5x3 room, 小光 (1,1) facing right, crack wall (2,1), normal wall (3,1)
const TH=['forest','swamp','mine','volcano','sea','castle','sky','mirror','power','clock','factory','core'];
TH.forEach(th=>panel('cw_'+th,5,3,'Room("'+th+'",5,3,(x,y)=>y!==1||x===0||x===4||x===3);crackWall(32,16,"'+th+'",1.0,2,1);Bot(1,1,"right")',1.0));
panel('cw_glint',5,3,'Room("mine",5,3,(x,y)=>y!==1||x===0||x===4||x===3);crackWall(32,16,"mine",2.3,2,1);Bot(1,1,"right")',.2);
// break frames (mine, swamp, volcano, mirror): floor under the broken cell, then crackWallBreak
const BT=[0,.03,.09,.15,.22,.30,.36];
['mine','swamp','volcano','mirror'].forEach(th=>BT.forEach((t,i)=>panel('br_'+th+'_'+i,5,3,'Room("'+th+'",5,3,(x,y)=>y!==1||x===0||x===4||x===3);'+(t===0?'crackWall(32,16,"'+th+'",1.0,2,1);':'FL["'+th+'"](32,16,2,1,0);crackWallBreak(32,16,"'+th+'",'+(t-.03)+',3,57);')+'Bot(1,1,"right")',t)));
fs.writeFileSync(path.join(OUT,'panels.json'),JSON.stringify(panels));
require('child_process').execFileSync('python3',[path.join(__dirname,'hitfx-crackwall-sheet.py'),OUT,path.join(ROOT,'shots/t8/hitfx_crackwall_design.png'),path.join(ROOT,'shots/t8/crops'),path.join(ROOT,'hit-fx-spec.js')],{stdio:'inherit'});
@@END*/
