// Baseball bat (棒球棒) ability + mine cave bat (礦坑蝙蝠) art. Load after art.js. 16x16 tiles, R() on `o`, Endesga 32.
// Naming: baseballBat* / batSwing = the wooden bat (tool); mineBat* = the animal. Helpers are prefixed BBA_ to avoid global clashes.
// dir everywhere: 0 up, 1 down, 2 left, 3 right (also 'up'/'down'/'left'/'right'), same as guideArrow. t = seconds.
const BBA_THEME={wood:[E32.tan,E32.orange1,E32.brown1,E32.sand],   // face / mid / shade / highlight
 grip:[E32.navy,E32.grey4],                                        // tape / wrap stripe (dark, so it never reads as a sword hilt)
 batBody:[E32.purple,E32.magenta,E32.plum,E32.brown1,E32.brown2],  // wing / bone+ear / membrane shade / chest fur / fur shade
 eye:[E32.yellow,E32.amber],outline:E32.ink};
const BBA_dir=d=>typeof d==='string'?({up:0,down:1,left:2,right:3})[d]:d;
// diagonal bat shape (knob bottom-left -> barrel top-right). pts: [cx,cy,w,kind] kind 0 knob,1 grip,2 wood
function BBA_stick(ox,oy,pts){const W=BBA_THEME.wood,G=BBA_THEME.grip,O=BBA_THEME.outline;
 const sq=([cx,cy,w])=>[cx-((w-1)>>1),cy-((w-1)>>1),w];
 pts.forEach(p=>{const[x,y,w]=sq(p);R(ox+x-1,oy+y-1,w+2,w+2,O)});
 pts.forEach((p,i)=>{const[x,y,w]=sq(p),k=p[3];
  if(k===1){R(ox+x,oy+y,w,w,i%2?G[0]:G[1]);return}
  if(k===0){R(ox+x,oy+y,w,w,E32.brown2);R(ox+x,oy+y,1,1,W[2]);return}
  R(ox+x,oy+y,w,w,W[0]);if(w>1){R(ox+x+w-1,oy+y,1,w,W[1]);R(ox+x,oy+y+w-1,w,1,W[2]);R(ox+x,oy+y,1,1,W[3])}});}
// 1) map pickup, 1 tile. Bobs 1px, soft amber glow pulse, blinking sparkle. Dark outline reads on any floor.
function baseballBatItem(px,py,t){const tt=t||0,b=Math.round(Math.sin(tt*3)),pu=.5+.5*Math.sin(tt*4);
 o.globalAlpha=.2+.22*pu;for(let y=1;y<15;y++){const c=15-y,hw=y<3||y>12?3:5;R(px+Math.max(0,c-hw),py+y+b,Math.min(16,c+hw+1)-Math.max(0,c-hw),1,E32.amber)}o.globalAlpha=.3;R(px+5,py+14,7,1,E32.ink);o.globalAlpha=1; // glow + ground shadow
 const pts=[[2,13,2,0],[3,12,1,1],[4,11,1,1],[5,10,1,1],[6,9,1,2],[7,8,2,2],[8,7,2,2],[9,6,2,2],[10,5,3,2],[11,4,3,2],[12,3,3,2]];
 BBA_stick(px,py+b,pts);
 const ph=(tt*1.5)%1;if(ph<.35){const s=ph<.17?1:2,sx=px+13,sy=py+1+b;R(sx-s,sy,s*2+1,1,E32.yellow);R(sx,sy-s,1,s*2+1,E32.yellow);R(sx,sy,1,1,E32.white)} // twinkle at barrel tip
 else if(ph>.6&&ph<.75){R(px+3,py+6+b,1,1,E32.yellow)}}
// 2) HUD icon. size 10 (default, drawn in a 10x10 box at px,py) or 16 (full tile, no bob/glow). Static.
function baseballBatIcon(px,py,size){if(size===16){BBA_stick(px,py,[[2,13,2,0],[3,12,1,1],[4,11,1,1],[5,10,1,1],[6,9,1,2],[7,8,2,2],[8,7,2,2],[9,6,2,2],[10,5,3,2],[11,4,3,2],[12,3,3,2]]);return}
 BBA_stick(px,py,[[1,8,2,0],[2,7,1,1],[3,6,1,1],[4,5,1,2],[5,4,2,2],[6,3,2,2],[7,2,2,2]]);R(px+8,py+1,1,1,E32.sand)}
// 3) swing smear around the robot at tile (px,py). 3 frames over dur (default .2s): wind-up arc -> full sweep -> fade + impact spark
//    on the tile in front. Reaches ~20px from robot centre so it covers the near half of the front tile. Draw after the robot.
function batSwing(px,py,dir,t,dur){const D=dur||.2;if(t==null||t<0||t>=D)return;const d=BBA_dir(dir),fr=Math.min(2,Math.floor(t/D*3));
 const face=[-90,90,180,0][d]??0,s=d===2?-1:1,cx=px+8,cy=py+8;
 const head=[-20,45,75][fr],tail=[-75,-55,5][fr],fade=[.85,.8,.45][fr],r0=10,r1=20;
 const ha=(face+s*head)*Math.PI/180,hx=Math.cos(ha),hy=Math.sin(ha);
 for(let y=-r1-1;y<=r1+1;y++)for(let x=-r1-1;x<=r1+1;x++){const r=Math.hypot(x+.5,y+.5);if(r<r0||r>r1)continue;
  let a=Math.atan2(y+.5,x+.5)*180/Math.PI-face;a=((a+540)%360)-180;a*=s;if(a<tail||a>head)continue;
  const k=(a-tail)/(head-tail);                                   // 0 at tail -> 1 at head
  if(r<r0+1+(1-k)*4)continue;                                       // tapering crescent: thin at the tail
  const c=r>r1-2?E32.white:r>r1-5?E32.yellow:E32.amber;o.globalAlpha=fade*(.25+.75*k);R(cx+x,cy+y,1,1,c)}
 o.globalAlpha=1;
 if(fr<2){for(let y=-r1;y<=r1;y++)for(let x=-r1;x<=r1;x++){const qx=x+.5,qy=y+.5,u=qx*hx+qy*hy;if(u<6||u>17)continue;const dd=Math.abs(qx*hy-qy*hx),w=u>12?1.6:1;
   if(dd<=w)R(cx+x,cy+y,1,1,u<10?BBA_THEME.grip[0]:dd<.8&&u>12?BBA_THEME.wood[3]:BBA_THEME.wood[0]);else if(dd<=w+1)R(cx+x,cy+y,1,1,BBA_THEME.outline)}}
 else{const v=[[0,-1],[0,1],[-1,0],[1,0]][d],ix=cx+v[0]*16,iy=cy+v[1]*16,g=Math.floor((t/D*3-2)*3); // impact spark, grows 1..3
  const L=2+g;R(ix-L,iy,L*2+1,1,E32.yellow);R(ix,iy-L,1,L*2+1,E32.yellow);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>R(ix+a*(L-1),iy+b*(L-1),1,1,E32.amber));R(ix-1,iy,3,1,E32.white);R(ix,iy-1,1,3,E32.white)}}
// 4) mine cave bat. frame 0 wings up / 1 wings down (body bobs 1px). dir 0 away (no face) 1 front, 2/3 eyes look left/right.
//    hit>=1: torn notch in a wing. flash=true: white hit flash (outline stays). Dark outline + floor shadow for the brown mine floor.
const BBA_WING=[{3:[1,2],4:[1,3],5:[1,5],6:[2,5],7:[3,5],8:[4,5]},{7:[3,5],8:[1,5],9:[0,5],10:[0,4],11:[0,0]}];
const BBA_BODY={5:[5,10],6:[5,10],7:[5,10],8:[6,9],9:[6,9],10:[7,8]};
function mineBat(px,py,frame,dir,hit,flash){const f=frame?1:0,b=f,C=BBA_THEME.batBody,O=BBA_THEME.outline,d=BBA_dir(dir),FL=flash?E32.white:null,yy=py+b;
 o.globalAlpha=.3;R(px+5,py+14,6,1,E32.ink);R(px+6,py+15,4,1,E32.ink);o.globalAlpha=1;           // shadow on the floor
 const spans=[];Object.entries(BBA_WING[f]).forEach(([y,[a,c]])=>{spans.push([a,+y,c-a+1,'w']);spans.push([15-c,+y,c-a+1,'w'])});
 if(f)spans.push([2,11,1,1,'w'],[13,11,1,1,'w']);
 Object.entries(BBA_BODY).forEach(([y,[a,c]])=>spans.push([a,+y,c-a+1,'b']));spans.push([5,4,1,'b'],[10,4,1,'b'],[5,3,1,'b'],[10,3,1,'b']); // ears
 spans.forEach(([x,y,w])=>R(px+x-1,yy+y-1,w+2,3,O));
 spans.forEach(([x,y,w,k])=>R(px+x,yy+y,w,1,FL||(k==='w'?(y>=(f?10:7)?C[2]:C[0]):C[0])));
 if(!FL){R(px+5,yy+4,1,1,C[1]);R(px+10,yy+4,1,1,C[1]);                                              // inner ears
  if(f){R(px+1,yy+9,4,1,C[1]);R(px+11,yy+9,4,1,C[1]);R(px+3,yy+10,1,1,C[1]);R(px+12,yy+10,1,1,C[1])} // wing bones
  else{R(px+2,yy+4,1,1,C[1]);R(px+3,yy+5,2,1,C[1]);R(px+13,yy+4,1,1,C[1]);R(px+11,yy+5,2,1,C[1])}
  R(px+6,yy+5,4,1,'#8a4f8e');                                                                         // head highlight
  if(d!==0){R(px+7,yy+8,2,2,C[3]);R(px+7,yy+9,2,1,C[4])}else R(px+7,yy+8,2,2,C[2])}                // chest fur / back
 if(d!==0){const ex=d===2?-1:d===3?1:0;o.globalAlpha=.35;R(px+5+ex,yy+5,3,3,BBA_THEME.eye[1]);R(px+8+ex,yy+5,3,3,BBA_THEME.eye[1]);o.globalAlpha=1;
  R(px+6+ex,yy+6,1,1,flash?E32.ink:BBA_THEME.eye[0]);R(px+9+ex,yy+6,1,1,flash?E32.ink:BBA_THEME.eye[0]);if(!flash){R(px+7+ex,yy+7,1,1,E32.grey1);R(px+8+ex,yy+7,1,1,O)}} // glowing eyes + fang
 if(hit>=1){const nx=f?12:12,ny=f?10:6;R(px+nx,yy+ny,2,1,O);R(px+nx+1,yy+ny+1,1,1,O)}}
// stunned: dropped to the floor, wings folded and drooping, swirl eyes, 3 dizzy stars orbiting. Loop with t (s).
function mineBatStunned(px,py,t){const tt=t||0,w=Math.round(Math.sin(tt*8)),C=BBA_THEME.batBody,O=BBA_THEME.outline;
 o.globalAlpha=.3;R(px+1,py+14,14,1,E32.ink);o.globalAlpha=1;
 const sp=[[5,6,1],[10,6,1],[5,7,6],[5,8,6],[5,9,6],[6,10,4],[6,11,4],[1,10,4],[11,10,4],[0,11,6],[10,11,6],[0,12,1],[2,12,1],[4,12,1],[11,12,1],[13,12,1],[15,12,1]]; // body + wings spread flat on the floor
 sp.forEach(([x,y,ww])=>R(px+x+w-1,py+y-1,ww+2,3,O));sp.forEach(([x,y,ww])=>R(px+x+w,py+y,ww,1,y>=11&&(x<5||x>10)?C[2]:C[0]));
 R(px+5+w,py+6,1,1,C[1]);R(px+10+w,py+6,1,1,C[1]);R(px+2+w,py+10,3,1,C[1]);R(px+11+w,py+10,3,1,C[1]);R(px+6+w,py+7,4,1,'#8a4f8e');R(px+7+w,py+10,2,2,C[3]);
 const sw=Math.floor(tt*6)%2,E=BBA_THEME.eye[1];if(sw){R(px+6+w,py+8,1,1,E);R(px+9+w,py+8,1,1,E)}else{R(px+6+w,py+8,1,1,C[2]);R(px+9+w,py+8,1,1,C[2])}R(px+7+w,py+9,2,1,O); // dazed blinking eyes + open mouth
 for(let i=0;i<3;i++){const a=tt*6+i*2.094,sx=px+7+Math.round(Math.cos(a)*6),sy=py+2+Math.round(Math.sin(a)*1.5);
  R(sx,sy,2,2,E32.yellow);R(sx-1,sy,1,1,E32.amber);R(sx+2,sy+1,1,1,E32.amber)}}
if(typeof module!=='undefined')module.exports={BBA_THEME,baseballBatItem,baseballBatIcon,batSwing,mineBat,mineBatStunned};
