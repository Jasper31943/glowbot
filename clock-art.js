// Clock tower (時鐘塔) art. Load after art.js. 16x16, Endesga 32. Brass + warm wood, bright baseline.
const CLOCK_THEME={name:'時鐘塔',style:'clock',floor:['#d8a878','#c4935f',E32.tan],wall:[E32.brown1,E32.brown2,E32.tan],
 brass:[E32.amber,E32.orange1,E32.yellow,E32.brown2],outline:E32.ink};
function clockFloor(px,py,x,y){const F=CLOCK_THEME.floor;R(px,py,16,16,F[0]);R(px,py+7,16,1,F[1]);R(px,py+15,16,1,F[1]);R(px+((x+y)%2?4:11),py,1,7,F[1]);R(px+((x+y)%2?11:4),py+8,1,7,F[1]);R(px+2,py+2,3,1,F[2])}
function clockWall(px,py,x,y){const W=CLOCK_THEME.wall;R(px,py,16,16,W[1]);R(px+1,py+1,14,13,W[0]);R(px+1,py+1,14,1,W[2]);R(px+7,py+1,1,13,W[1]);R(px+1,py+14,14,2,E32.plum)}
// gear: rot 0..7 (one step per player step = 45°/... visually 8 teeth), size 'big' fills tile
function gear(px,py,rot){const B=CLOCK_THEME.brass,cx=px+8,cy=py+8;
 for(let i=0;i<8;i++){const a=(i+rot*.5)*Math.PI/4,tx=Math.round(cx+Math.cos(a)*6.2)-1,ty=Math.round(cy+Math.sin(a)*6.2)-1;R(tx,ty,3,3,B[3]);R(tx+.5,ty+.5,2,2,B[0])}
 for(let j=-5;j<=5;j++){const w=Math.round(Math.sqrt(30-j*j));R(cx-w,cy+j,w*2,1,B[3])}for(let j=-4;j<=4;j++){const w=Math.round(Math.sqrt(19-j*j));R(cx-w,cy+j,w*2,1,B[0])}
 R(cx-4,cy-3,3,1,B[2]);R(cx-2,cy-2,4,4,B[1]);R(cx-1,cy-1,2,2,E32.ink);
 const a=rot*Math.PI/8;R(cx+Math.round(Math.cos(a)*3)-1,cy+Math.round(Math.sin(a)*3)-1,2,2,B[1])}
// clock face decoration (wall): hand angle from t
function clockFace(px,py,x,y,t){clockWall(px,py,x,y);R(px+2,py+2,12,12,E32.brown2);R(px+3,py+3,10,10,E32.sand);[[7,3],[12,7],[7,12],[3,7]].forEach(([a,b])=>R(px+a,py+b,2,1,E32.brown2));
 const a=(t||0)*.6;for(let r=0;r<4;r++)R(px+8+Math.round(Math.sin(a)*r)-1,py+8-Math.round(Math.cos(a)*r)-1,1,1,E32.ink);R(px+7,py+7,2,2,E32.red3)}
// pendulum blade hazard: phase 0..3 position across tile
// pendulum n/s: a heavy brass bob on a rod hanging from a ceiling bracket. info.danger = the bob sweeps THIS tile on the next tick (stepping or staying here now = hit):
// bob hangs over the middle with a red shadow on the floor; otherwise it is swung up to the side (safe to step on). Old 3-arg calls keep the side-swing look by phase.
function pendulum(px,py,phase,info){const dang=info?!!info.danger:false,side=info?(info.side?1:-1):(phase%4===0?-1:1);
 const bx=dang?8:8+side*5,by=dang?10:6;
 if(dang){o.globalAlpha=.45;R(px+2,py+11,12,4,E32.red3);R(px+4,py+10,8,6,E32.red3);o.globalAlpha=1;R(px+1,py+13,2,1,E32.red3);R(px+13,py+13,2,1,E32.red3)}
 R(px+5,py,6,2,E32.ink);R(px+6,py,4,1,E32.grey3); // bracket
 const n=8;for(let i=0;i<=n;i++){const x=Math.round(8+(bx-8)*i/n),y=Math.round(2+(by-2)*i/n);R(px+x-1,py+y,2,1,E32.grey3)} // rod
 R(px+bx-4,py+by-3,8,8,E32.ink);R(px+bx-3,py+by-2,6,6,dang?E32.red3:CLOCK_THEME.brass[0]);R(px+bx-2,py+by-1,2,2,dang?E32.orange1:CLOCK_THEME.brass[2]); // bob
 if(dang){R(px+bx-6,py+by-1,1,3,E32.white);R(px+bx+5,py+by-1,1,3,E32.white)}} // swish lines
// gear door ¤/¢: a door that a clock gear opens and shuts by itself every 2 of your steps.
// info: {now:open now, next:open after your next step, cyc:[open at tick 0..3], k:current tick 0..3}
// shut = barred shutter with the gear lock (lamp green if it opens on the next step, else red); open = dark doorway with a green frame,
// red blinking frame + teeth sliding down when it shuts on the next step (don't step in / get out). 4 pips on top = the door's rhythm, white ring = now.
function gearGate(px,py,open,phase,t,info){const B=CLOCK_THEME.brass,nx=info?info.next:open;R(px,py,16,16,E32.ink);R(px+1,py+1,14,14,E32.brown2);
 if(open){R(px+3,py+4,10,11,E32.plum);R(px+4,py+5,8,10,E32.ink);
  const closing=!nx,bl=Math.floor((t||0)*6)%2;const fc=closing?(bl?E32.red3:E32.orange1):E32.green1;R(px+2,py+3,12,1,fc);R(px+2,py+3,1,12,fc);R(px+13,py+3,1,12,fc);
  if(closing){for(let i=0;i<3;i++)R(px+4+i*3,py+4,2,3,B[0])}} // teeth peeking down = about to shut
 else{R(px+2,py+4,12,11,E32.brown1);for(let yy=5;yy<15;yy+=3)R(px+2,py+yy,12,1,E32.brown2); // shutter slats
  const rot=(phase|0)%8;for(let i=0;i<6;i++){const a=(i+rot*.5)*Math.PI/3,tx=px+8+Math.round(Math.cos(a)*4)-1,ty=py+10+Math.round(Math.sin(a)*4)-1;R(tx,ty,3,3,E32.ink);R(tx+1,ty+1,1,1,B[0])}
  R(px+5,py+7,6,6,E32.ink);R(px+6,py+8,4,4,B[0]);R(px+7,py+9,2,2,nx?E32.green1:E32.red3)} // gear lock, centre lamp: green = opens next step
 if(info&&info.cyc){for(let i=0;i<4;i++){const x=px+2+i*3+(i>1?1:0);R(x,py+1,2,2,info.cyc[i]?E32.green1:E32.red3);if(i===info.k){R(x-1,py,4,1,E32.white);R(x-1,py+3,4,1,E32.white)}}}}
// ---- 鐘塔守衛 £: 16x24 (extends 8px up). stationary, hit 0..2 (3 HP), t for gear tick, flash
function clockGuard(px,py,hit,t,flash){const O=E32.ink,B=flash?E32.white:E32.amber,B2=flash?E32.grey1:E32.orange1,B3=flash?E32.grey2:E32.brown2,tt=t||0,tick=Math.floor(tt*2)%2;
 o.globalAlpha=.4;R(px+1,py+14,14,2,E32.brown2);o.globalAlpha=1;
 // planted legs
 R(px+2,py+11,5,5,O);R(px+9,py+11,5,5,O);R(px+3,py+12,3,3,B3);R(px+10,py+12,3,3,B3);R(px+3,py+12,3,1,B);
 // big gear torso with clear teeth
 const cx=px+8,cy=py+5;
 for(let i=0;i<8;i++){const a=(i+tick*.5)*Math.PI/4,tx=Math.round(cx+Math.cos(a)*8)-2,ty=Math.round(cy+Math.sin(a)*8)-2;R(tx,ty,5,5,O);R(tx+1,ty+1,3,3,B);R(tx+1,ty+1,1,1,E32.yellow)}
 for(let j=-6;j<=6;j++){const w=Math.round(Math.sqrt(42-j*j));R(cx-w,cy+j,w*2,1,O)}
 for(let j=-5;j<=5;j++){const w=Math.round(Math.sqrt(30-j*j));R(cx-w,cy+j,w*2,1,flash?E32.grey2:E32.plum)}
 for(let j=-3;j<=3;j++){const w=Math.round(Math.sqrt(14-j*j));R(cx-w,cy+j,w*2,1,B)};R(cx-4,cy-4,3,1,E32.yellow);R(cx+1,cy-4,3,1,E32.yellow)
 R(cx-2,cy-2,4,4,B2);R(cx-1,cy-1,2,2,O);R(cx-2,cy-2,2,1,E32.yellow);
 // clock-face head (extends above tile)
 R(px+3,py-8,10,8,O);R(px+4,py-7,8,6,E32.sand);R(px+4,py-7,8,1,E32.white);
 [[5,-6],[11,-6],[5,-3],[11,-3],[8,-7],[8,-2]].forEach(([a,b])=>R(px+a,py+b,1,1,E32.brown2)); // hour marks
 R(px+7,py-5,1,3,O);R(px+7,py-4,3,1,O); // hands
 R(px+5,py-6,2,2,E32.red3);R(px+9,py-6,2,2,E32.red3); // angry eyes on dial
 R(px+6,py-2,4,1,O); // frown
 // winding key crown
 R(px+6,py-11,4,4,O);R(px+7,py-10,2,2,B);R(px+5,py-11,2,2,O);R(px+9,py-11,2,2,O);
 if(hit>=1){R(px+11,py-3,1,3,O);R(px+3,py+3,2,1,O);R(px+13,py+6,1,1,B3)}
 if(hit>=2){R(px+5,py-7,1,2,O);R(px+8,py+2,1,3,O);R(px+12,py-1,2,2,O);R(px+1,py+5,1,1,B2);R(px+14,py+4,1,1,B2)}}
function littleGear(px,py,fl){const O=E32.ink,B=E32.amber,cx=px+8,cy=py+9;
 for(let i=0;i<6;i++){const a=i*Math.PI/3,tx=Math.round(cx+Math.cos(a)*4)-1,ty=Math.round(cy+Math.sin(a)*4)-1;R(tx,ty,3,3,O);R(tx+1,ty+1,1,1,B)}
 R(cx-3,cy-2,6,5,O);R(cx-2,cy-1,4,3,B);R(cx-1,cy,2,1,E32.yellow);R(cx-1,cy,1,1,E32.white)}
function clockGuardDefeat(px,py,t,awayDir){const O=E32.ink,B=E32.amber;
 if(t<.7){clockGuard(px+(Math.floor(t*10)%2),py,2,t,false);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py+-10+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)};return}
 const k=Math.min(1,(t-.7)/.9);
 [[-1,-1],[1,-1],[0,-1.3],[-1.3,.8],[1.3,.8],[0,1.2],[-.5,-.2]].forEach(([dx,dy],i)=>{const x=px+6+Math.round(dx*k*18),y=py+2+Math.round(dy*k*14+k*k*12);R(x-1,y-1,5,5,O);R(x,y,3,3,i%2?B:E32.orange1);R(x+1,y+1,1,1,E32.yellow)});
 if(k>.4)littleGear(px+(awayDir===2?-1:1)*Math.round((k-.4)/.6*24),py-((t*8|0)%2),awayDir===2)}
if(typeof module!=='undefined')module.exports={CLOCK_THEME,clockFloor,clockWall,gear,clockFace,pendulum,gearGate,clockGuard,clockGuardDefeat,littleGear};

