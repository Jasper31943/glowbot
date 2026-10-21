// Core (核心) art: 故障核心 3x3 boss + lighthouse ending sprite. Load after art.js. Endesga 32.
const CORE_THEME={name:'核心',style:'core',floor:['#4b4a7a','#3e3d6a','#62619a'],wall:['#2f2d58',E32.purple||'#68386c',E32.ink],
 stolen:[E32.green1,E32.cyan,E32.amber,E32.orange,E32.magenta],   // grass, ice, desert, volcano, factory... 5 drained colours
 outline:E32.ink};
function coreFloor(px,py,x,y){const F=CORE_THEME.floor;R(px,py,16,16,F[0]);R(px,py,16,1,F[2]);R(px,py,1,16,F[2]);if((x+y)%3===0)R(px+7,py+7,2,2,F[1])}
function coreWall(px,py,x,y,t){const W=CORE_THEME.wall;R(px,py,16,16,W[0]);R(px+1,py+1,14,13,W[1]);R(px,py+14,16,2,W[2]);
 o.globalAlpha=.5+.3*Math.sin((t||0)*3+x+y);R(px+2,py+7,12,1,CORE_THEME.stolen[(x+y)%5]);o.globalAlpha=1}
// 故障核心 Ω (final boss + ending sprite): 48x48 (3x3 tiles).
// phase 0..5 = colours freed = 5 − remaining HP (phase 0 = 5 HP full power; phase 5 = defeated/smiling reboot).
// hit=true -> white flash. Used by ending-art.js reboot sequence — do not change signature.
// Combat: engine passes phase from HP; optional glitchCoreDefeat after phase reaches 5.
function glitchCore(px,py,phase,hit,t){const C=CORE_THEME.stolen,O=E32.ink,body=hit?E32.white:E32.grey3,dark=hit?E32.grey1:E32.grey4,tt=t||0,sm=phase>=5;
 const left=C.slice(phase);               // colours still inside
 // cables pulling coloured light in (one per remaining colour)
 left.forEach((c,i)=>{const a=i/5*Math.PI*2+.4,ex=px+24+Math.round(Math.cos(a)*34),ey=py+24+Math.round(Math.sin(a)*30),N=34;
  for(let k=0;k<=N;k++){const q=k/N,xx=Math.round(ex+(px+24-ex)*q),yy=Math.round(ey+(py+24-ey)*q);R(xx-1,yy-1,4,4,E32.ink);}
  for(let k=0;k<=N;k++){const q=k/N,xx=Math.round(ex+(px+24-ex)*q),yy=Math.round(ey+(py+24-ey)*q);R(xx,yy,2,2,c)}
  R(ex-2,ey-2,5,5,E32.ink);R(ex-1,ey-1,3,3,c);
  for(let n=0;n<2;n++){const p=(tt*1.2+i*.17+n*.5)%1,xx=Math.round(ex+(px+24-ex)*p),yy=Math.round(ey+(py+24-ey)*p);R(xx-1,yy-1,4,4,c);R(xx,yy,2,2,E32.white)}});
 // body (sibling of 小光 — grey/damaged, never clean white unless hit-flash)
 R(px+8,py+6,32,36,O);R(px+6,py+10,36,28,O);R(px+9,py+7,30,34,body);R(px+7,py+11,34,26,body);R(px+9,py+36,30,4,dark);
 R(px+12,py+42,6,5,O);R(px+30,py+42,6,5,O);
 // magenta glitch pixels / scuffs on body (always)
 [[10,14],[14,20],[35,16],[38,28],[12,32],[33,34],[20,38]].forEach(([a,b],i)=>R(px+a,py+b,2,1,i%2?E32.magenta:E32.cyan));
 // torn cable stubs on shoulders (always — freed colours leave stubs)
 [[6,16],[40,18],[8,28],[38,30]].forEach(([a,b],i)=>{R(px+a,py+b,4,3,O);R(px+a+1,py+b+1,2,1,i<left.length?left[i%Math.max(1,left.length)]:E32.grey4)});
 // crooked / bent antenna (NOT straight cyan like 小光)
 R(px+19,py+1,3,5,O);R(px+20,py+2,1,3,E32.grey2);
 R(px+21,py-1,4,3,O);R(px+22,py,2,1,E32.grey3); // bent right
 R(px+24,py-3,5,4,O);R(px+25,py-2,3,2,sm?E32.green1:(Math.floor(tt*5)%2?E32.red3:E32.magenta)); // strobe bulb, not calm cyan
 R(px+26,py-4,1,1,E32.magenta);R(px+23,py-1,1,1,E32.cyan); // spark flecks on antenna
 // core gem row
 for(let i=0;i<5;i++)R(px+10+i*6,py+33,5,2,i<left.length?left[i]:E32.grey4);
 // cracked screen face
 R(px+12,py+11,24,18,O);R(px+13,py+12,22,16,E32.navy);
 // crack lines on glass (all phases including smile)
 [[14,13,8,1],[22,14,1,6],[18,18,6,1],[30,16,1,5],[16,22,10,1],[28,20,4,1]].forEach(([a,b,w,h])=>R(px+a,py+b,w,h,E32.grey3));
 [[15,14,1,1],[23,17,1,1],[19,19,1,1],[31,18,1,1]].forEach(([a,b])=>R(px+a,py+b,1,1,E32.ink));
 // static noise flicker (t-driven) — overlays face briefly
 if(Math.floor(tt*7+phase)%3===0){for(let j=0;j<14;j+=2){const ox=((j*5+Math.floor(tt*17))%8);R(px+14+ox,py+13+j,6+(j%3),1,E32.grey2);R(px+16+ox,py+14+j,3,1,E32.magenta)}}
 if(sm){
  // warm smile but asymmetric eyes + still cracked
  R(px+15,py+15,3,3,E32.cyan);R(px+30,py+17,3,2,E32.cyan); // eyes offset (asymmetric)
  R(px+16,py+16,1,1,E32.white);R(px+31,py+17,1,1,E32.white);
  R(px+18,py+23,12,2,E32.cyan);R(px+17,py+22,2,1,E32.cyan);R(px+29,py+22,2,1,E32.cyan);
  R(px+27,py+15,1,1,E32.magenta); // glitch freckle on smile face
 }else if(Math.floor(tt*5+phase)%4!==0){
  // hostile: asymmetric red eyes
  R(px+14,py+14,5,2,E32.red3);R(px+15,py+15,3,3,E32.red3);
  R(px+28,py+16,6,2,E32.red3);R(px+29,py+17,4,3,E32.red3); // lower/right eye
  R(px+18,py+24,12,1,E32.red3);R(px+17,py+25,2,1,E32.red3);R(px+29,py+25,2,1,E32.red3);
 }}
// lighthouse ending sprite: 32x64. lit 0..15 lamps (ring of windows up the tower); rainbow=true -> secret ending beam.
function lighthouse(px,py,lit,rainbow,t){const tt=t||0,W=E32.white,Rd=E32.red3;
 for(let j=0;j<40;j++){const w=Math.round(8+j*.18),y=py+20+j,band=Math.floor(j/8)%2;R(px+16-w-1,y,w*2+2,1,E32.ink);R(px+16-w,y,w*2,1,band?Rd:E32.grey1);R(px+16-w,y,2,1,band?E32.red2:E32.grey2)}
 R(px+4,py+60,24,4,E32.grey3);R(px+2,py+62,28,2,E32.grey4);
 // 15 lamps: 3 columns x 5 rows of small windows
 for(let i=0;i<15;i++){const r=Math.floor(i/3),c=i%3,wx=px+10+c*5,wy=py+54-r*7;R(wx,wy,3,3,E32.ink);R(wx+1,wy+1,1,1,i<lit?(rainbow?CORE_THEME.stolen[i%5]:E32.yellow):E32.grey4)}
 // lantern room
 R(px+8,py+9,16,11,E32.ink);R(px+9,py+10,14,9,lit>=15?E32.yellow:E32.grey3);R(px+10,py+11,3,7,lit>=15?E32.amber:E32.grey4);R(px+6,py+19,20,2,E32.ink);R(px+10,py+4,12,5,Rd);R(px+12,py+2,8,2,E32.red2);R(px+15,py,2,2,E32.ink);
 if(lit>=15){const a=Math.sin(tt*1.2);for(let k=1;k<6;k++){const bc=rainbow?CORE_THEME.stolen[k%5]:E32.yellow;o.globalAlpha=.45-k*.06;R(px+16+(a>0?8:-8-k*6),py+11+(k%2),k*6,4+k,bc)}o.globalAlpha=1}}
// per-scene lamp colours, scene order 1..15
const LAMP_COLORS=[{name:'草原',hex:E32.green1},{name:'冰原',hex:E32.cyan},{name:'沙漠',hex:E32.amber},{name:'森林',hex:'#b5c43a'},{name:'沼澤',hex:E32.brown1},{name:'礦坑',hex:E32.grey2},{name:'火山',hex:E32.red3},{name:'海底',hex:E32.blue2},{name:'古堡',hex:E32.magenta},{name:'天空島',hex:'#c3a6f0'},{name:'鏡子迷宮',hex:E32.pink},{name:'發電廠',hex:E32.yellow},{name:'時鐘塔',hex:E32.orange},{name:'夜間工廠',hex:'#9d5cf0'},{name:'核心',hex:E32.white}];
function litLamps(px,py,n){for(let i=0;i<Math.min(n,15);i++){const[wx,wy]=lampWin(px,py,i);R(wx-1,wy-1,5,5,E32.ink);R(wx,wy,3,3,LAMP_COLORS[i].hex);R(wx,wy,1,1,E32.white)}}
function lampWin(px,py,i){const r=Math.floor(i/3),c=i%3;return[px+10+c*5,py+54-r*7]}
function lampRing(cx,cy,rad,col,a){if(rad<1)return;o.globalAlpha=a;for(let j=-rad;j<=rad;j++){const w=Math.round(Math.sqrt(rad*rad-j*j)),w2=Math.round(Math.sqrt(Math.max(0,(rad-1.5)*(rad-1.5)-j*j)));R(cx-w,cy+j,w-w2,1,col);R(cx+w2,cy+j,w-w2,1,col)}o.globalAlpha=1}
function lampDisc(cx,cy,rad,col,a){o.globalAlpha=a;for(let j=-rad;j<=rad;j++){const w=Math.round(Math.sqrt(rad*rad-j*j));R(cx-w,cy+j,w*2,1,col)}o.globalAlpha=1}
// celebration after a mini-boss: lighthouse with `lit` lamps already on, lamp idx igniting over t in [0,1.5]
function lighthouseLampOn(px,py,lit,idx,t){const tt=Math.max(0,t||0),C=LAMP_COLORS[idx%15].hex;
 lighthouse(px,py,Math.min(lit,idx),false,tt);
 for(let i=0;i<Math.min(lit,15);i++){if(i===idx)continue;const[wx,wy]=lampWin(px,py,i);R(wx-1,wy-1,5,5,E32.ink);R(wx,wy,3,3,LAMP_COLORS[i].hex);R(wx,wy,1,1,E32.white)}
 const[wx,wy]=lampWin(px,py,idx),cx=wx+1,cy=wy+1;
 if(tt<.4){const k=tt/.4,sy=Math.round(py+66+(cy-py-66)*k),sx=cx+Math.round(Math.sin(k*9)*2);
  for(let q=1;q<5;q++)R(sx-1+(q%2),sy+q*2,2,2,q<3?E32.white:C);lampDisc(sx,sy,3,C,.4);R(sx-1,sy-2,3,5,E32.white);R(sx-2,sy-1,5,3,E32.white);R(sx,sy,1,1,C);return}
 const k=tt-.4;
 if(k<.15)lampDisc(cx,cy,7,E32.white,.9); // pop flash
 if(k<.8){const rr=Math.round(4+k/.8*12);lampRing(cx,cy,rr,C,1-k/.8*.7);lampRing(cx,cy,rr-2,E32.white,.7*(1-k/.8))}
 const pulse=k>.8?Math.round(Math.sin(tt*8)):0;lampDisc(cx,cy,6+pulse,C,.3);lampDisc(cx,cy,4,C,.45);lampDisc(cx,cy,3,E32.white,.3); // settled soft glow
 R(wx-1,wy-1,5,5,E32.ink);R(wx,wy,3,3,C);R(wx,wy,1,1,E32.white);
 if(k<.9){const d=k/.9;[[1,-1],[-1,-1],[1,1],[-1,1],[0,-1.4],[1.4,0],[-1.4,0]].forEach(([a,b],i)=>{if((i+Math.floor(k*10))%3===0&&d>.6)return;const x=Math.round(cx+a*(3+d*9)),y=Math.round(cy+b*(3+d*9));R(x-1,y,3,1,i%2?C:E32.white);R(x,y-1,1,3,i%2?C:E32.white);R(x,y,1,1,E32.white)})}
 else{const f=Math.floor(tt*6)%2;R(cx-7+f,cy-6,1,3,E32.white);R(cx-8+f,cy-5,3,1,E32.white);R(cx+7-f,cy+4,1,3,C);R(cx+6-f,cy+5,3,1,C)}}
// defeat after final hit: hold smiling glitchCore(phase=5), then a tiny core buddy rolls away (ending still uses glitchCore directly)
function coreBuddy(px,py,fl){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 r(4,5,8,9,O);r(5,6,6,7,E32.grey2);r(5,7,6,3,E32.navy);
 r(5,7,3,1,E32.grey3);r(8,8,2,1,E32.grey3); // screen cracks
 r(6,8,1,1,E32.cyan);r(9,9,1,1,E32.cyan); // asymmetric eyes
 r(6,10,4,1,E32.cyan);r(10,7,1,1,E32.magenta);
 r(7,2,2,3,O);r(8,1,2,2,O);r(9,0,2,2,E32.magenta); // crooked antenna
 r(5,14,2,1,O);r(9,14,2,1,O);r(3,9,2,2,CORE_THEME.stolen[0]);r(11,9,2,2,E32.grey4)} // stub
function glitchCoreDefeat(px,py,t,awayDir){
 // px,py = top-left of the 48x48 boss footprint (same as glitchCore)
 if(t<.9){glitchCore(px,py,5,false,t);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+24+Math.round(Math.cos(a)*14),y=py+4+Math.round(Math.sin(a)*3);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)}return}
 const k=Math.min(1,(t-.9)/.7);if(k<.3){[[10,12],[28,10],[16,28],[30,30]].forEach(([a,c],i)=>{R(px+a,py+c,8,8,E32.grey2);R(px+a+2,py+c+2,4,4,CORE_THEME.stolen[i%5])});return}
 coreBuddy(px+16+(awayDir===2?-1:1)*Math.round(k*28),py+28-((t*8|0)%2),awayDir===2)}
if(typeof module!=='undefined')module.exports={CORE_THEME,coreFloor,coreWall,glitchCore,glitchCoreDefeat,coreBuddy,lighthouse,LAMP_COLORS,lighthouseLampOn,litLamps,lampWin};

