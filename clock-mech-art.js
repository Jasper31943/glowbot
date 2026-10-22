// Clock tower (鐘塔) mechanisms v2 — DRAFT final art for 齒輪門 (gear gate ¤/¢) and 鐘擺 (pendulum n/s).
// Load after art.js (uses o, R, E32). 16x16 per tile, Endesga 32 only. Helper prefix CMA_ (checked unique).
// Every state is told apart by SHAPE first and colour second, so colour-weak players can read it at ~50px/tile.
// Preview: node tools/clock-mech-preview.js -> shots/t5/clock_mech_design.png
const CMA={O:E32.ink,brass:[E32.amber,E32.orange1,E32.yellow,E32.brown2],wood:[E32.brown1,E32.brown2],back:E32.plum,
 floor:['#d8a878','#c4935f',E32.tan],go:E32.green1,stop:E32.red3,warn:E32.hot,mark:E32.yellow};
function CMA_floor(px,py,x0,y0,w,h){const F=CMA.floor;R(px+x0,py+y0,w,h,F[0]);if(y0<=7&&y0+h>7)R(px+x0,py+7,w,1,F[1]);if(y0+h>=16)R(px+x0,py+15,w,1,F[1])}
function CMA_disc(cx,cy,r,c){for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j+r*.6));if(w>0)R(cx-w,cy+j,w*2,1,c)}}
// which of ticks 0..3 the gate is open, derived from (state,tick) for the standard 2-open/2-shut gate
function CMA_cycle(state,tick){const k=((tick|0)%4+4)%4,c=[0,0,0,0],set=(i,v)=>c[(i+4)%4]=v;
 if(state==='open'){set(k,1);set(k+1,1)}else if(state==='closing'){set(k,1);set(k-1,1)}else if(state==='closed'){set(k+2,1);set(k+3,1)}else{set(k+1,1);set(k+2,1)}return c}
// gear relief on the shutter: 7x7, 8 teeth, dark brass (so it can never read as a yellow sun). hub notch moves with the tick.
const CMA_GEAR=['..#.#..','.#####.','##ooo##','.#o.o#.','##ooo##','.#####.','..#.#..'];
function CMA_cog(gx,gy,rot,y0,y1){const B=CMA.brass,O=CMA.O,ok=y=>y>=y0&&y<y1;
 CMA_GEAR.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch!=='.'&&ok(gy+j)){R(gx+i-1,gy+j,3,1,O)}}));
 CMA_GEAR.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch!=='.'&&ok(gy+j-1))R(gx+i,gy+j-1,1,1,O);if(ch!=='.'&&ok(gy+j+1)&&(CMA_GEAR[j+1]||'.......')[i]==='.')R(gx+i,gy+j+1,1,1,O)}));
 CMA_GEAR.forEach((r,j)=>[...r].forEach((ch,i)=>{if(!ok(gy+j))return;if(ch==='#')R(gx+i,gy+j,1,1,B[3]);else if(ch==='o')R(gx+i,gy+j,1,1,E32.brown1);else if(j===3&&i===3)R(gx+i,gy+j,1,1,O)}));
 const m=[[3,2],[4,3],[3,4],[2,3]][(rot|0)%4];if(ok(gy+m[1]))R(gx+m[0],gy+m[1],1,1,B[0])}
// 4-tick rhythm strip on the lintel. open tick = green ring with a light hole (a doorway), shut tick = solid block with a bar. current tick: full bright + yellow brackets.
function CMA_pips(px,py,cyc,tick){const k=((tick|0)%4+4)%4;
 for(let i=0;i<4;i++){const x=px+1+i*4,y=py+1,cur=i===k;o.globalAlpha=cur?1:.55;
  if(cyc[i]){R(x,y,3,3,CMA.go);R(x+1,y+1,1,1,E32.sand)}else{R(x,y,3,3,CMA.stop);R(x,y+1,3,1,E32.ink)}
  o.globalAlpha=1;if(cur){const w=Math.min(5,px+16-(x-1));R(x-1,y-1,w,1,CMA.mark);R(x-1,y+3,w,1,CMA.mark);R(x-1,y,1,3,CMA.mark);if(x+3<px+16)R(x+3,y,1,3,CMA.mark)}}}
// ---- 1) 齒輪門 gear gate ----
// state: 'closed' | 'opening' (shut now, opens after your next step) | 'open' | 'closing' (open now, slams shut on your next step)
// tick: 0..3 current clock tick (S.zt%4). t: seconds (blink). cyc (optional): [open?]x4 per tick, default = standard 2/2 gate.
// Engine mapping (for ¤/¢): now=!gateShut({zt},c), next=!gateShut({zt:zt+1},c) -> state = now?(next?'open':'closing'):(next?'opening':'closed').
// Layout: lintel y0-5 (pips) · posts x0-1 / x14-15 · doorway x2-13: ribbed brass shutter with a dark gear relief + steel teeth.
function gearGateV2(px,py,state,tick,t,cyc){const B=CMA.brass,O=CMA.O,tt=t||0,blink=Math.floor(tt*2)%2,k=((tick|0)%4+4)%4,C=cyc||CMA_cycle(state,k);
 const bottom={closed:16,opening:12,closing:11,open:7}[state]??16,top=bottom-10,warn=state==='closing',wc=blink?CMA.warn:CMA.stop;
 R(px,py,16,16,O);CMA_floor(px,py,2,6,12,10);                                                  // doorway floor (walkable look)
 for(let y=Math.max(6,top);y<bottom;y++){const ry=y-top;                                       // shutter, row by row
  if(ry===9){for(let x=2;x<14;x++)R(px+x,py+y,1,1,(x%2)?(warn?wc:E32.grey1):O);continue}        // teeth
  if(ry===8){R(px+2,py+y,12,1,O);continue}
  if(warn&&(ry===6||ry===7)){for(let x=2;x<14;x++)R(px+x,py+y,1,1,((x+ry+(blink?1:0))%4)<2?E32.amber:O);continue}   // hazard stripes
  R(px+2,py+y,12,1,B[1]);[2,5,10,13].forEach(x=>R(px+x,py+y,1,1,x%2?E32.brown1:B[0]))}
 if(bottom>8)CMA_cog(px+5,py+top+1,k,py+6,py+bottom-(warn?4:2));
 if(bottom<16){o.globalAlpha=.35;R(px+2,py+bottom,12,1,O);o.globalAlpha=1}                    // shadow under the teeth
 // ▲ opening (in the floor slit)  ▼ closing (on the floor it will crush)
 if(state==='opening'){const A=[[7,2],[6,4],[5,6]];A.forEach(([x,w],j)=>R(px+x-1,py+13+j-1,w+2,2,O));A.forEach(([x,w],j)=>R(px+x,py+13+j,w,1,CMA.go))}
 if(warn){const A=[[4,8],[5,6],[6,4],[7,2]];A.forEach(([x,w],j)=>R(px+x-1,py+12+j,w+2,j<3?2:1,O));A.forEach(([x,w],j)=>R(px+x,py+12+j,w,1,wc))}
 // posts (flash + stripes when closing)
 for(const sx of[0,14]){for(let y=6;y<16;y++)R(px+sx,py+y,2,1,warn?(((y+(blink?1:0))%3)?wc:O):(sx?B[3]:B[1]));if(!warn)R(px+sx+(sx?0:1),py+6,1,10,sx?E32.brown1:B[0])}
 // lintel with the rhythm pips
 R(px,py,16,6,O);R(px,py+1,16,4,B[3]);CMA_pips(px,py,C,k)}
// ---- 2) 鐘擺 pendulum ----
// The bob swings across the tile it hangs on (WE.pendAt hits the n/s tile itself); pendulumDanger marks that tile's floor.
// phase in [0,2):  0 = READY TO HIT: cocked up on the `side` side, red blade edge, white swoosh arrow down to the floor centre
//                  0→1 = the swing: passes the centre (the hit, sparks) at ~0.4, flies up the other side
//                  1 = SAFE: parked high in the opposite top corner, held by a latch hook, floor clean
//                  1→2 = drops back to READY on the other side (phase 2 ≡ phase 0 with side flipped)
// side: -1 = cocked on the left (default), +1 = on the right. t: seconds (blink).
// Engine mapping for n/s (hit when WE.pendAt): idle phase = clockNext(x,y,c)?0:1; side flips every hit: side=(Math.floor((zt+(c==='n'?1:0))/2)%2)?1:-1;
// during a step tween phase += fraction (0..1).
function CMA_pendAngle(phase,side){const s=side||-1,p=((phase%2)+2)%2,e=x=>x*x*(3-2*x);   // degrees, + = bob to the right
 if(p<1)return s*(50-125*e(p));return -s*(75-25*e(p-1))}
function CMA_bobAt(a){const ar=a*Math.PI/180,L=9.5-3*Math.pow(Math.min(1,Math.abs(a)/75),2);
 return[Math.round(Math.max(4,Math.min(12,8+Math.sin(ar)*L))),Math.round(Math.max(5,2+Math.cos(ar)*L))]}
function pendulumV2(px,py,phase,t,side){const B=CMA.brass,O=CMA.O,s=side||-1,a=CMA_pendAngle(phase,s),tt=t||0,blink=Math.floor(tt*2)%2;
 const p=((phase%2)+2)%2,ready=p<.05||p>1.95,parked=Math.abs(p-1)<.05,[cx,cy]=CMA_bobAt(a);
 // motion ghost while it moves
 if(!ready&&!parked){const[gx,gy]=CMA_bobAt(CMA_pendAngle(phase-.15,s));o.globalAlpha=.4;CMA_disc(px+gx,py+gy,3,E32.sand);o.globalAlpha=1}
 // ceiling bracket + pivot
 R(px+4,py,8,3,O);R(px+5,py,6,2,B[3]);R(px+7,py,2,2,B[1]);R(px+7,py+2,2,1,E32.grey2);
 // rod (2px: ink + steel)
 for(let i=1;i<=12;i++){const x=Math.round(8+(cx-8)*i/12),y=Math.round(2+(cy-2)*i/12);R(px+x-1,py+y,2,1,O);R(px+x,py+y,1,1,E32.grey2)}
 // bob: heavy brass weight, crescent blade underneath
 CMA_disc(px+cx,py+cy,4,O);CMA_disc(px+cx,py+cy,3,B[0]);R(px+cx-2,py+cy-2,2,1,B[2]);R(px+cx-2,py+cy-1,1,1,B[2]);R(px+cx+1,py+cy+1,2,1,B[1]);R(px+cx-1,py+cy-1,2,2,B[3]);
 const edge=ready?(blink?CMA.warn:CMA.stop):E32.grey1;R(px+cx-3,py+cy+3,7,1,O);R(px+cx-2,py+cy+3,5,1,edge);R(px+cx-3,py+cy+2,1,1,edge);R(px+cx+3,py+cy+2,1,1,edge);R(px+cx-2,py+cy+4,5,1,O);
 // READY: two white "about to swing" ticks on the inner side of the bob (toward the tile centre)
 if(ready){const W=blink?E32.white:E32.grey1,es=p>1?-s:s,ix=cx-es*6;[[0,-2],[1,0],[0,2]].forEach(([dx,dy])=>{const x=Math.max(0,Math.min(14,ix-es*dx));R(px+x,py+cy+dy,2,1,W)})}
 // HIT: sparks on the floor
 if(Math.abs(a)<14){[[2,14],[13,14],[1,12],[14,12],[4,15],[11,15]].forEach(([x,y])=>R(px+x,py+y,1,1,E32.yellow));R(px+3,py+13,1,1,E32.white);R(px+12,py+13,1,1,E32.white)}
 // SAFE: latch hook in the corner holding it
 if(parked){const hx=px+(cx>8?15:0);R(hx,py+2,1,7,O);R(hx+(cx>8?-1:1),py+8,1,1,O);R(hx+(cx>8?-1:1),py+7,1,1,E32.grey2)}}
// red strike zone on the floor of the tile that gets hit NEXT step. Draw on the floor, before pendulumV2 / the robot.
// shape cue: marching hazard-stripe border + a bold X, so it reads without the red. Pulses with t.
function pendulumDanger(px,py,t){const tt=t||0,pu=.45+.25*(Math.sin(tt*8)*.5+.5),m=Math.floor(tt*2)%4;
 o.globalAlpha=pu;R(px+1,py+5,14,10,CMA.stop);o.globalAlpha=1;
 for(let x=0;x<16;x++){const c=((x+m)%4)<2?CMA.stop:E32.ink;R(px+x,py+4,1,1,c);R(px+x,py+15,1,1,c)}
 for(let y=5;y<15;y++){const c=((y+m)%4)<2?CMA.stop:E32.ink;R(px,py+y,1,1,c);R(px+15,py+y,1,1,c)}
 for(let i=0;i<7;i++){R(px+4+i,py+8+i,2,1,E32.ink);R(px+10-i,py+8+i,2,1,E32.ink)}}            // bold X (2px strokes)
if(typeof module!=='undefined')module.exports={CMA,CMA_cycle,CMA_pendAngle,gearGateV2,pendulumV2,pendulumDanger};
