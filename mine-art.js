// Mine map (礦坑) art. Load after art.js. 16x16, R() on `o`, Endesga 32.
const MINE_THEME={name:'礦坑',style:'mine',
 rock:[E32.brown1,E32.brown2,E32.plum,E32.tan],      // warm brown wall
 floor:['#7e5444','#684436','#9a6a54'],            // dark dirt floor
 beam:[E32.tan,E32.brown1,E32.brown2],
 rail:[E32.grey2,E32.grey3],tie:[E32.brown1,E32.brown2],
 gem:[E32.magenta,E32.blue2,E32.green1],
 lamp:[E32.amber,E32.yellow,E32.grey3],
 outline:E32.ink};
const MH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
function mineFloor(px,py,x,y){const F=MINE_THEME.floor;R(px,py,16,16,F[0]);for(let i=0;i<4;i++)R(px+1+Math.floor(MH(x,y,i)*14),py+1+Math.floor(MH(x,y,i+5)*14),2,1,F[1]);R(px+2+Math.floor(MH(x,y,9)*10),py+4+Math.floor(MH(x,y,8)*8),1,1,F[2])}
// rock wall; gem sparkle on some tiles (pass t)
function mineRock(px,py,x,y,t){const K=MINE_THEME.rock;R(px,py,16,16,K[2]);R(px+1,py+1,14,14,K[0]);
 R(px+1,py+7,7,1,K[1]);R(px+8,py+10,7,1,K[1]);R(px+6,py+1,1,6,K[1]);R(px+11,py+3,3,2,K[3]);
 if(MH(x,y,3)<.35){const g=MINE_THEME.gem[Math.floor(MH(x,y,4)*3)],gx=px+3+Math.floor(MH(x,y,5)*8),gy=py+9+Math.floor(MH(x,y,6)*3);R(gx,gy,3,2,g);R(gx+1,gy-1,1,1,g);
  if(Math.floor((t||0)*3+MH(x,y,7)*9)%5===0){R(gx+1,gy-2,1,1,E32.grey1);R(gx,gy-1,3,1,E32.grey1)}}}
// wall with wooden support frame
function mineBeam(px,py,x,y){mineRock(px,py,x,y,0);const B=MINE_THEME.beam;R(px+1,py,3,16,B[2]);R(px+12,py,3,16,B[2]);R(px+1,py+1,14,3,B[2]);
 R(px+2,py,1,16,B[1]);R(px+13,py,1,16,B[1]);R(px+1,py+2,14,1,B[0]);R(px+2,py+5,1,1,E32.grey2);R(px+13,py+5,1,1,E32.grey2)}
function mineLantern(px,py,t){const L=MINE_THEME.lamp,fl=Math.floor((t||0)*6)%2;o.globalAlpha=.25;R(px+3,py+3,10,10,L[0]);o.globalAlpha=1;
 R(px+7,py+1,2,2,L[2]);R(px+5,py+3,6,8,E32.ink);R(px+6,py+4,4,6,L[0]);R(px+7,py+5+fl,2,3,L[1]);R(px+5,py+11,6,1,L[2])}
// tracks. kind: 'h','v', corner 'ne','nw','se','sw' (connects those sides), junction 'j' + state 0/1 (which branch)
function mineTrack(px,py,x,y,kind,state,noFloor){if(!noFloor)mineFloor(px,py,x,y);const Rl=MINE_THEME.rail,T2=MINE_THEME.tie;
 const H=()=>{for(let i=1;i<16;i+=4)R(px+i,py+4,2,8,T2[1]);R(px,py+5,16,1,Rl[0]);R(px,py+10,16,1,Rl[0])};
 const V=()=>{for(let i=1;i<16;i+=4)R(px+4,py+i,8,2,T2[1]);R(px+5,py,1,16,Rl[0]);R(px+10,py,1,16,Rl[0])};
 if(kind==='h')return H();if(kind==='v')return V();
 if(kind==='j'){H();for(let i=1;i<6;i+=4)R(px+4,py+i,8,2,T2[1]);
  const c=state?E32.green1:E32.red3;if(state){R(px+5,py,1,6,Rl[0]);R(px+10,py,1,6,Rl[0])}else{R(px+5,py,1,3,Rl[1]);R(px+10,py,1,3,Rl[1])}
  R(px+13,py+1,2,3,E32.ink);R(px+13+(state?0:1),py+1,1,2,c);return}
 // corners: quarter-circle rails centred on the shared corner, clipped to the tile
 const n=kind.includes('n'),e=kind.includes('e'),cx=px+(e?16:0),cy=py+(n?0:16);o.save();o.beginPath();o.rect(px,py,16,16);o.clip();
 for(let a=0;a<=4;a++){const th=(a+.5)/5*Math.PI/2,sx=e?-1:1,sy=n?1:-1;for(let r=4;r<=12;r++)R(cx+sx*Math.cos(th)*r-.5,cy+sy*Math.sin(th)*r-.5,2,2,T2[1])}
 for(let a=0;a<=60;a++){const th=a/60*Math.PI/2,sx=e?-1:1,sy=n?1:-1;[5.5,10.5].forEach(r=>R(cx+sx*Math.cos(th)*r-.5,cy+sy*Math.sin(th)*r-.5,1,1,Rl[0]))}
 o.restore()}
// minecart, dir 0 up 1 down 2 left 3 right
function minecart(px,py,dir,frame){const O=MINE_THEME.outline,G=E32.grey2,D=E32.grey3,B=E32.brown1,b=frame?1:0;
 if(dir>=2){R(px+2,py+4,12,9,O);R(px+3,py+5,10,7,G);R(px+3,py+5,10,2,E32.grey1);R(px+4,py+8,8,1,D);R(px+4,py+3,8,2,B);R(px+5,py+2,3,1,E32.amber);
  R(px+3,py+12,3,3,O);R(px+10,py+12,3,3,O);R(px+4+b,py+13,1,1,G);R(px+11+b,py+13,1,1,G);R(dir===2?px+1:px+14,py+7,1,2,D)}
 else{R(px+3,py+3,10,11,O);R(px+4,py+4,8,9,G);R(px+5,py+5,6,6,B);R(px+6,py+6,2,1,E32.amber);R(px+4,py+4,8,1,E32.grey1);
  R(px+2,py+4+b,1,3,O);R(px+13,py+4+b,1,3,O);R(px+2,py+10-b,1,3,O);R(px+13,py+10-b,1,3,O);R(px+7,dir===0?py+2:py+14,2,1,D)}}
// crumbling floor: stage 0 intact cracked, 1 & 2 warning (cracks grow, debris), 3 hole
function crumbleFloor(px,py,x,y,stage){const F=MINE_THEME.floor;
 if(stage>=3){R(px,py,16,16,F[0]);R(px+1,py+1,14,14,E32.ink);R(px+2,py+2,12,3,E32.plum);R(px+3,py+12,2,1,F[1]);return}
 mineFloor(px,py,x,y);R(px+1,py+1,14,14,F[2]);R(px+2,py+2,12,12,F[0]);const C=E32.ink;
 R(px+5,py+4,1,3,C);R(px+6,py+7,3,1,C);R(px+9,py+8,1,3,C);
 if(stage>=1){R(px+3,py+10,3,1,C);R(px+9,py+4,3,1,C);R(px+11,py+5,1,2,C);R(px+4,py+11,1,2,F[1])}
 if(stage>=2){R(px+2,py+7,4,1,C);R(px+10,py+11,4,1,C);R(px+7,py+2,1,3,C);R(px+6,py+12,2,1,C);R(px+12,py+2,1,1,F[2]);o.globalAlpha=.4;R(px+5,py+5,6,6,E32.ink);o.globalAlpha=1}}
if(typeof module!=='undefined')module.exports={MINE_THEME,mineFloor,mineRock,mineBeam,mineLantern,mineTrack,minecart,crumbleFloor};
// ---- 鼴鼠王 mini-boss: 16x16, helmet lamp draws up to 4px above (py-4). dir 0..3 (2 left,3 right; 0/1 face front). hit 0..2
function moleKing(px,py,frame,dir,hit,t){const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink,F=E32.grey1,F2=E32.white,P=E32.pink;
 r(1,14,14,2,E32.brown2);
 // dirt flying behind
 [[0,6],[1,3],[-2,9]].forEach(([a,b],i)=>{const k=((t*3+i*.33+frame*.5)%1);r(a-Math.round(k*4),b-Math.round(k*3),3,3,O);r(a-Math.round(k*4),b-Math.round(k*3),2,2,E32.brown1)});
 r(2,4,13,11,O);r(3,5,11,9,F);r(4,6,3,2,F2);r(5,10,7,4,E32.grey2); // body/belly
 r(12,8,5,4,O);r(13,9,3,2,P);r(16,9,1,1,E32.red3); // snout
 r(9,7,2,2,O);r(10,6,1,1,E32.white); // eye
 // big claws, alternate dig
 const c=frame?1:0;r(9,11-c,6,4,O);r(10,12-c,4,2,P);[10,12,14].forEach(a=>r(a,15-c,1,1,E32.white));
 r(1,11+c,5,4,O);r(2,12+c,3,2,P);
 // miner helmet + lamp + crown spikes
 r(3,0,11,5,O);r(4,1,9,3,E32.amber);r(5,1,3,1,E32.yellow);r(3,-3,2,3,O);r(6,-4,2,4,O);r(9,-3,2,3,O);r(3,-2,1,2,E32.yellow);r(6,-3,1,3,E32.yellow);r(9,-2,1,2,E32.yellow);
 r(11,-1,5,5,O);r(12,0,3,3,E32.yellow);r(13,1,1,1,E32.white);r(12,0,1,1,E32.white); // lamp
 o.globalAlpha=.35;r(16,0,2,3,E32.yellow);r(18,-1,2,5,E32.yellow);r(20,-2,2,7,E32.yellow);o.globalAlpha=1;
 if(hit>=1){r(6,1,1,3,O);r(4,8,2,1,O)}if(hit>=2){r(10,1,1,2,O);r(7,11,2,1,O);r(13,10,1,1,O);r(1,0,1,1,E32.yellow);r(15,-1,1,1,E32.yellow)}
 if(hit&&(t*6|0)%2)r(3,5,11,1,E32.white)}
function moleKingDefeat(px,py,t,awayDir){
 if(t<.8){moleKing(px,py,0,awayDir===2?3:2,2,0);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py-6+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)}return}
 const k=Math.min(1,(t-.8)/.8),fl=awayDir===2,dx=(fl?-1:1)*Math.round(k*24),x=px+dx;
 R(px+3,py+12,10,3,E32.ink);R(px+4,py+12,8,2,E32.brown2); // hole
 if(k<.3){const pop=Math.round(k/.3*6);smallMole(px,py+6-pop,fl);R(px+3,py+12,10,3,E32.ink);R(px+4,py+12,8,2,E32.brown2);return}
 smallMole(px+(fl?-1:1)*Math.round((k-.3)/.7*24),py-1-((t*12|0)%2),fl)}
function smallMole(px,py,fl){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 r(3,7,9,7,O);r(4,8,7,5,E32.grey1);r(5,8,3,1,E32.white);r(10,8,4,5,O);r(11,9,2,3,E32.grey1);r(13,10,2,2,O);r(13,10,1,1,E32.pink);r(14,10,1,1,E32.pink);
 r(11,9,1,1,O);r(4,13,3,2,O);r(5,13,1,1,E32.pink);r(9,13,3,2,O);r(10,13,1,1,E32.pink);r(2,10,1,1,O)}
if(typeof module!=='undefined')Object.assign(module.exports,{moleKing,moleKingDefeat,smallMole});
