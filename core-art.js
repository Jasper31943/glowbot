// Core (核心) art: 故障核心 3x3 boss + lighthouse ending sprite. Load after art.js. Endesga 32.
const CORE_THEME={name:'核心',style:'core',floor:['#4b4a7a','#3e3d6a','#62619a'],wall:['#2f2d58',E32.purple||'#68386c',E32.ink],
 stolen:[E32.green1,E32.cyan,E32.amber,E32.orange,E32.magenta],   // grass, ice, desert, volcano, factory... 5 drained colours
 outline:E32.ink};
function coreFloor(px,py,x,y){const F=CORE_THEME.floor;R(px,py,16,16,F[0]);R(px,py,16,1,F[2]);R(px,py,1,16,F[2]);if((x+y)%3===0)R(px+7,py+7,2,2,F[1])}
function coreWall(px,py,x,y,t){const W=CORE_THEME.wall;R(px,py,16,16,W[0]);R(px+1,py+1,14,13,W[1]);R(px,py+14,16,2,W[2]);
 o.globalAlpha=.5+.3*Math.sin((t||0)*3+x+y);R(px+2,py+7,12,1,CORE_THEME.stolen[(x+y)%5]);o.globalAlpha=1}
// 故障核心: 48x48 (3x3 tiles). phase 0..5 = number of colours already freed (0 = full power, 5 = rebooted/smiling). hit -> white flash.
function glitchCore(px,py,phase,hit,t){const C=CORE_THEME.stolen,O=E32.ink,body=hit?E32.white:E32.grey3,dark=hit?E32.grey1:E32.grey4,tt=t||0;
 const left=C.slice(phase);               // colours still inside
 // cables pulling coloured light in (one per remaining colour)
 left.forEach((c,i)=>{const a=i/5*Math.PI*2+.4,ex=px+24+Math.round(Math.cos(a)*34),ey=py+24+Math.round(Math.sin(a)*30),N=34;
  for(let k=0;k<=N;k++){const q=k/N,xx=Math.round(ex+(px+24-ex)*q),yy=Math.round(ey+(py+24-ey)*q);R(xx-1,yy-1,4,4,E32.ink);}
  for(let k=0;k<=N;k++){const q=k/N,xx=Math.round(ex+(px+24-ex)*q),yy=Math.round(ey+(py+24-ey)*q);R(xx,yy,2,2,c)}   // 2px saturated cable
  R(ex-2,ey-2,5,5,E32.ink);R(ex-1,ey-1,3,3,c);                                                                           // plug end
  for(let n=0;n<2;n++){const p=(tt*1.2+i*.17+n*.5)%1,xx=Math.round(ex+(px+24-ex)*p),yy=Math.round(ey+(py+24-ey)*p);R(xx-1,yy-1,4,4,c);R(xx,yy,2,2,E32.white)}}); // pulses flow inward
 // body
 R(px+8,py+6,32,36,O);R(px+6,py+10,36,28,O);R(px+9,py+7,30,34,body);R(px+7,py+11,34,26,body);R(px+9,py+36,30,4,dark);
 R(px+12,py+42,6,5,O);R(px+30,py+42,6,5,O);R(px+20,py+1,8,6,O);R(px+22,py+2,4,4,phase>=5?E32.green1:(Math.floor(tt*4)%2?E32.red3:E32.magenta));
 // core gem shows remaining colour stack
 for(let i=0;i<5;i++)R(px+10+i*6,py+33,5,2,i<left.length?left[i]:E32.grey4);
 // screen face
 R(px+12,py+11,24,18,O);R(px+13,py+12,22,16,E32.navy);
 if(phase>=5){R(px+16,py+16,3,3,E32.cyan);R(px+29,py+16,3,3,E32.cyan);R(px+17,py+23,14,2,E32.cyan);R(px+16,py+22,2,1,E32.cyan);R(px+30,py+22,2,1,E32.cyan)}
 else if(Math.floor(tt*5+phase)%4===0){for(let j=0;j<16;j+=2)R(px+13+((j*7+Math.floor(tt*20))%10),py+12+j,8+(j%3)*3,1,C[(j/2)%5]===undefined?E32.grey2:E32.grey2)} // static
 else{R(px+15,py+15,6,1,E32.red3);R(px+17,py+16,4,1,E32.red3);R(px+27,py+15,6,1,E32.red3);R(px+27,py+16,4,1,E32.red3);
  R(px+16,py+18,4,3,E32.red3);R(px+28,py+18,4,3,E32.red3);R(px+18,py+24,12,1,E32.red3);R(px+17,py+25,2,1,E32.red3);R(px+29,py+25,2,1,E32.red3)}}
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
if(typeof module!=='undefined')module.exports={CORE_THEME,coreFloor,coreWall,glitchCore,lighthouse,LAMP_COLORS,lighthouseLampOn,litLamps,lampWin};
