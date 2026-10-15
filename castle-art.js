// Castle map (古堡) art. Load after art.js. 16x16, R() on `o`, Endesga 32. Cool dark-grey ashlar stone (rethemed 2026-10-15), bright baseline.
const CASTLE_THEME={name:'古堡',style:'castle',
 brick:[E32.grey3,E32.grey4,'#4a5272',E32.navy],     // face / mortar / shade / dark edge
 floor:['#605c74','#3e3a50','#76718a','#4f4b62'],   // face / mortar / top highlight / shade
 carpet:[E32.purple,E32.red2,E32.amber],
 banner:[E32.red3,E32.red2,E32.amber],
 torch:[E32.orange,E32.amber,E32.yellow],
 metal:[E32.grey1,E32.grey2,E32.grey3],
 ghost:[E32.grey1,E32.grey2,E32.grey3,E32.blue2],
 outline:E32.ink};
const CH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
// brick pattern aligned to world coords (rows of 4px, bricks 8px, offset alternate rows) -> seamless
function castleBrick(px,py,x,y){const B=CASTLE_THEME.brick;R(px,py,16,16,B[1]);
 for(let r=0;r<4;r++){const off=r%2?4:0;for(let c=-1;c<3;c++){const bx=c*8+off;const x0=Math.max(0,bx),x1=Math.min(16,bx+7);if(x1>x0){R(px+x0,py+r*4,x1-x0,3,B[0]);R(px+x0,py+r*4+2,x1-x0,1,B[2])}}}}
function castleFloor(px,py,x,y){const F=CASTLE_THEME.floor;R(px,py,16,16,F[1]);
 // large ashlar: 8px-tall rows of 12px stones, offset per row in world coords -> seamless
 for(let r=0;r<2;r++){const wy=y*2+r,off=(wy%2)*6,wx0=x*16;for(let sx=-12;sx<28;sx+=12){const gx=Math.floor((wx0+sx-off)/12)*12+off-wx0;const x0=Math.max(0,gx),x1=Math.min(16,gx+11);if(x1<=x0)continue;
  const k=CH(Math.floor((wx0+gx)/12),wy,3);R(px+x0,py+r*8,x1-x0,7,k<.5?F[0]:F[3]);R(px+x0,py+r*8,x1-x0,1,F[2]);
  if(k<.08){R(px+x0+2,py+r*8+3,3,1,F[1]);R(px+x0+4,py+r*8+4,2,1,F[1]);R(px+x0+5,py+r*8+5,1,1,F[1])}           // crack
  else if(k>.93){R(px+x0,py+r*8+5,Math.min(4,x1-x0),2,E32.green3);R(px+x0+1,py+r*8+4,2,1,E32.green2)}}}}  // moss at a corner
// optional carpet runner accent (engine may draw on top of castleFloor along the main hall); horizontal when dir!==1
function castleCarpet(px,py,x,y,vertical){const C=CASTLE_THEME.carpet;castleFloor(px,py,x,y);
 if(vertical){R(px+3,py,10,16,C[1]);R(px+4,py,8,16,C[0]);R(px+5,py,1,16,C[2]);R(px+10,py,1,16,C[2])}else{R(px,py+3,16,10,C[1]);R(px,py+4,16,8,C[0]);R(px,py+5,16,1,C[2]);R(px,py+10,16,1,C[2])}}
function castleBanner(px,py,x,y,t){castleBrick(px,py,x,y);const B=CASTLE_THEME.banner,w=Math.round(Math.sin((t||0)*2+x)*.6);
 R(px+3,py+1,10,1,E32.brown2);R(px+4,py+2,8,10,B[1]);R(px+5,py+2,6,10,B[0]);R(px+4+w,py+12,3,2,B[1]);R(px+9+w,py+12,3,2,B[1]);R(px+7,py+5,2,3,B[2]);R(px+6,py+6,4,1,B[2])}
function castleTorch(px,py,x,y,t){castleBrick(px,py,x,y);const T3=CASTLE_THEME.torch,f=Math.floor((t||0)*8)%2;
 o.globalAlpha=.25;R(px+3,py+1,10,10,T3[1]);o.globalAlpha=1;R(px+7,py+7,2,6,E32.brown2);R(px+6,py+6,4,2,E32.grey3);
 R(px+6,py+3,4,3,T3[0]);R(px+7,py+1+f,2,4-f,T3[1]);R(px+7,py+4,1,1,T3[2])}
function lever(px,py,on){const M=CASTLE_THEME.metal;R(px+4,py+11,8,3,E32.ink);R(px+5,py+11,6,2,M[1]);
 const tx=on?10:5;R(px+7,py+10,2,2,M[2]);R(px+(on?8:6),py+7,2,4,M[0]);R(px+tx-1,py+4,3,3,E32.ink);R(px+tx,py+5,2,2,on?E32.green1:E32.red3)}
function trapdoor(px,py,x,y,open){castleFloor(px,py,x,y);if(open){R(px+1,py+1,14,14,E32.ink);R(px+2,py+2,12,2,E32.plum);R(px+1,py+1,14,1,E32.brown2);return}
 R(px+1,py+1,14,14,E32.brown2);R(px+2,py+2,12,12,E32.brown1);for(let i=5;i<14;i+=4)R(px+i,py+2,1,12,E32.brown2);R(px+2,py+4,12,1,E32.grey2);R(px+2,py+11,12,1,E32.grey2);R(px+7,py+7,2,2,E32.grey3)}
function spikeTrap(px,py,x,y,up){castleFloor(px,py,x,y);const M=CASTLE_THEME.metal;R(px+2,py+2,12,12,M[2]);
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){const sx=px+3+i*4,sy=py+3+j*4;if(up){R(sx,sy+1,3,2,M[0]);R(sx+1,sy-1,1,2,E32.white)}else R(sx+1,sy+1,1,1,E32.ink)}}
// armor ghost: frame 0/1 walk, dir 0..3, spotted -> '!'
function armorGhost(px,py,frame,dir,spotted){const G=CASTLE_THEME.ghost,O=E32.grey4,b=frame?1:0;
 R(px+4,py+1+b,8,7,O);R(px+5,py+2+b,6,5,G[0]);R(px+5,py+4+b,6,1,G[2]);if(dir!==0){R(px+6+(dir===2?-1:dir===3?1:0),py+4+b,1,1,E32.cyan);R(px+9+(dir===2?-1:dir===3?1:0),py+4+b,1,1,E32.cyan)}
 R(px+7,py+b,2,2,E32.red3);
 R(px+3,py+8,10,5,O);R(px+4,py+8,8,4,G[1]);R(px+7,py+9,2,2,G[0]);
 o.globalAlpha=.6;R(px+4,py+13,8,2,G[3]);R(px+5+(frame?1:0),py+15,2,1,G[3]);R(px+9-(frame?1:0),py+15,2,1,G[3]);o.globalAlpha=1; // ghostly fade-out legs
 if(spotted){R(px+7,py-7,3,7,E32.ink);R(px+8,py-6,1,3,E32.amber);R(px+8,py-2,1,1,E32.amber)}}
// defeat t 0..1.6: dazed stars, puff, small bat flies off
function armorGhostDefeat(px,py,t,awayDir){if(t<.8){armorGhost(px,py,0,1,false);R(px+5,py+4,6,1,E32.grey2);
  for(let i=0;i<3;i++){const a=t*9+i*2.094;R(px+7+Math.round(Math.cos(a)*6),py-2+Math.round(Math.sin(a)*2),2,2,E32.yellow)}return}
 const k=(t-.8)/.8;if(k<.2){o.globalAlpha=.8;R(px+3,py+4,10,9,E32.grey1);R(px+5,py+2,6,13,E32.grey2);o.globalAlpha=1;return}
 const dx=(awayDir===2?-1:1)*Math.round(k*24),dy=-Math.round(k*14),f=Math.floor(t*10)%2;castleBat(px+dx,py+dy,f)}
function castleBat(px,py,f){const O=E32.ink,B=E32.purple,H=E32.magenta;
 const parts=f?[[6,7,4,4],[7,6,2,1],[2,6,4,2],[10,6,4,2],[1,5,1,1],[14,5,1,1]]:[[6,7,4,4],[7,6,2,1],[3,8,3,3],[10,8,3,3]];
 parts.forEach(([a,b,w,h])=>R(px+a-1,py+b-1,w+2,h+2,O));parts.forEach(([a,b,w,h])=>R(px+a,py+b,w,h,B));
 R(px+6,py+7,4,1,H);R(px+6,py+5,1,2,O);R(px+9,py+5,1,2,O);R(px+7,py+8,1,1,E32.yellow);R(px+8,py+8,1,1,E32.yellow)}
// ---- 盔甲騎士王 `@`: 16x24, plume extends 8px above (py-8..py+16). frame 0/1 walk, dir 2 left/3 right, spotted -> "!" above plume,
// hit = damage taken 0..2 (3 HP: 0 pristine, 1 dented+pauldron lost, 2 cracked visor+plume broken), flash=true white hit flash.
function armorKnightKing(px,py,frame,dir,hit,spotted,flash){const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 const A=flash?E32.white:E32.grey2,A2=flash?E32.white:E32.grey3,A3=flash?E32.grey1:E32.grey4,G=E32.amber,f=frame?1:0;
 o.globalAlpha=.45;r(2,14,12,3,E32.ink);r(0,15,16,1,E32.ink);o.globalAlpha=.6;r(4,15,8,1,E32.ink);o.globalAlpha=1;
 // plume
 if(hit<2){r(5,-8,6,7,O);r(6,-7,4,5,E32.red3);r(9,-8,2,3,O);r(9,-7,1,2,E32.red3);r(6,-7,1,2,E32.pink)}else{r(6,-4,4,3,O);r(7,-3,2,2,E32.red2)}
 // helmet
 r(3,-2,10,8,O);r(4,-1,8,6,A);r(4,-1,3,1,flash?E32.white:E32.grey1);r(4,2,8,2,O);r(9,2,3,1,E32.red3);r(6,2,2,1,E32.red3);r(5,4,6,1,A2);
 // crown band
 r(4,-2,8,1,G);r(5,-3,1,1,G);r(8,-3,1,1,G);r(11,-3,1,1,G);
 // body
 r(2,6,12,7,O);r(3,7,10,5,A);r(3,10,10,2,A3);r(6,7,4,5,O);r(7,7,2,5,E32.blue2);r(6,8,4,2,G); // tabard + emblem
 // pauldrons
 r(0,6,4,4,O);r(1,7,2,2,A2);if(hit<1){r(12,6,4,4,O);r(13,7,2,2,A2)}
 // sword arm forward, shield back
 r(13,8,3,4,O);r(14,9,1,2,A2);r(15,2,2,9,O);r(15,3,1,7,E32.white);r(14,10,4,2,O);r(15,10,2,1,G);
 r(-2,7,4,7,O);r(-1,8,2,5,E32.blue2);r(-1,8,1,4,E32.cyan);r(-1,10,2,1,G);
 // legs
 r(4,13-f,3,3+f,O);r(9,12+f,3,4-f,O);r(5,13-f,1,2,A2);r(10,12+f,1,3,A2);
 const RIM=flash?E32.white:E32.grey1;r(4,-1,8,1,RIM);r(3,7,4,1,RIM);r(9,7,4,1,RIM);r(1,7,2,1,RIM);if(hit<1)r(13,7,2,1,RIM);r(4,0,1,4,RIM);r(3,8,1,3,RIM);
 if(hit>=1){r(10,0,2,1,O);r(5,8,1,2,O);r(11,9,1,1,O)}
 if(hit>=2){r(6,0,1,2,O);r(7,1,1,2,O);r(4,11,2,1,O);r(12,7,1,1,O);r(3,9,1,1,O)}
 if(spotted){R(px+6,py-17,5,9,E32.ink);R(px+7,py-16,3,5,E32.amber);R(px+7,py-10,3,1,E32.amber)}}
// defeat t 0..1.6: wobble+stars, armor pieces fly apart, a swarm of bats flies off
function armorKnightKingDefeat(px,py,t,awayDir){const O=E32.ink;
 if(t<.6){armorKnightKing(px+(Math.floor(t*12)%2),py,0,awayDir===2?3:2,2,false,false);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py+-12+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)};return}
 const k=Math.min(1,(t-.6)/1);
 [[-1,-1,3],[1,-1,2],[-1,1,1],[1,1,0],[0,-1.4,4]].forEach(([dx,dy,i])=>{const x=px+6+Math.round(dx*k*14),y=py+4+Math.round(dy*k*10+k*k*14);R(x-1,y-1,5,5,O);R(x,y,3,3,i===4?E32.red3:E32.grey1);R(x,y,1,1,E32.white)});
 for(let i=0;i<5;i++){const a=(awayDir===2?Math.PI:0)+(i-2)*.35,d=k*28,x=px+Math.round(Math.cos(a)*d),y=py-4-Math.round(k*16)+Math.round(Math.sin(a)*d*.5)+i%2*3;castleBat(x,y,Math.floor(t*10+i)%2)}}
// friendly buddy for ending: little knight
function littleKnight(px,py,fl){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 o.globalAlpha=.45;r(3,14,10,2,O);o.globalAlpha=1;
 r(6,1,4,3,O);r(7,2,2,1,E32.red3);r(4,4,8,6,O);r(5,5,6,4,E32.grey2);r(5,5,6,1,E32.grey1);r(5,6,1,2,E32.grey1);r(5,7,6,1,O);r(9,7,1,1,E32.red3);
 r(4,10,8,4,O);r(5,11,6,2,E32.blue2);r(5,11,6,1,E32.cyan);r(7,11,2,1,E32.amber);r(5,14,2,2,O);r(9,14,2,2,O);r(12,6,1,7,O);r(12,6,1,1,E32.grey1)}
if(typeof module!=='undefined')module.exports={CASTLE_THEME,castleBrick,castleFloor,castleBanner,castleTorch,lever,trapdoor,spikeTrap,armorGhost,armorGhostDefeat,castleBat};
if(typeof module!=='undefined')Object.assign(module.exports,{castleCarpet,armorKnightKing,armorKnightKingDefeat,littleKnight});
