// Sea map (海底) art. Load after art.js. 16x16, R() on `o`, Endesga 32. Bright aqua, robot stays brightest.
const SEA_THEME={name:'海底',style:'sea',
 water:['#3fb6d8','#56c4e0','#8ad8ec',E32.blue2],    // base / light / ray & streak / deep
 sand:[E32.sand,E32.tan,'#f3e2c0'],
 coral:[E32.pink,E32.orange,E32.red3],
 weed:[E32.green1,E32.green2],
 bubble:['#bfeef8',E32.cyan,E32.blue2],
 outline:E32.ink};
const SEH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
// open water; diagonal light rays repeat every 8 tiles so neighbouring tiles join without seams
function seaWater(px,py,x,y){const W=SEA_THEME.water;R(px,py,16,16,W[0]);
 o.globalAlpha=.35;for(let j=0;j<16;j++){const gx=((x*16+y*16+j)%32+32)%32,gy=py+j;for(let k=0;k<16;k++){if(((x*16+k)-(y*16+j)+256)%48<6)R(px+k,gy,1,1,W[2])}}o.globalAlpha=1;
 if(SEH(x,y,1)<.2)R(px+3+Math.floor(SEH(x,y,2)*9),py+3+Math.floor(SEH(x,y,3)*9),1,1,W[2])}
function seaSand(px,py,x,y){const S=SEA_THEME.sand;R(px,py,16,16,S[0]);for(let i=0;i<4;i++)R(px+1+Math.floor(SEH(x,y,i)*14),py+1+Math.floor(SEH(x,y,i+5)*14),2,1,S[1]);R(px+2+Math.floor(SEH(x,y,9)*12),py+8,1,1,S[2])}
// coral: blocking decoration on sand
function seaCoral(px,py,x,y){seaSand(px,py,x,y);const C=SEA_THEME.coral,c=C[Math.floor(SEH(x,y,4)*2)],O=E32.red2;
 R(px+7,py+5,2,10,O);R(px+7,py+5,1,10,c);R(px+3,py+3,2,7,O);R(px+3,py+3,1,7,c);R(px+3,py+9,5,2,c);R(px+11,py+2,2,8,O);R(px+11,py+2,1,8,c);R(px+8,py+8,4,2,c);
 [[3,2],[7,4],[11,1]].forEach(([a,b])=>R(px+a,py+b,2,1,C[0]))}
function seaweed(px,py,x,y,frame){seaSand(px,py,x,y);const G=SEA_THEME.weed,s=frame?1:-1;
 [[4,0],[9,1],[12,0]].forEach(([a,ph])=>{for(let j=2;j<15;j++){const dx=Math.round(Math.sin(j*.6+ph*2)*1.2*s);R(px+a+dx,py+j,2,1,j%3?G[1]:G[0])}R(px+a,py+15,2,1,G[1])})}
// current: dir 0 up 1 down 2 left 3 right, frame 0/1 scrolls chevrons
function seaCurrent(px,py,x,y,dir,frame){const W=SEA_THEME.water,off=frame?4:0;R(px,py,16,16,'#1f7fb8');R(px,py,16,1,'#2a90c8');R(px,py+15,16,1,'#1a6ea3');
 for(let k=0;k<2;k++){const t=(k*8+off)%16;for(let j=0;j<4;j++){
  let a,b,c,d;if(dir===3){a=t+j;b=4+j;c=t+j;d=11-j}else if(dir===2){a=15-t-j;b=4+j;c=15-t-j;d=11-j}else if(dir===1){a=4+j;b=t+j;c=11-j;d=t+j}else{a=4+j;b=15-t-j;c=11-j;d=15-t-j}
  const th=dir>=2?[1,2]:[2,1];[[a,b],[c,d]].forEach(([u,v])=>{if(u>=0&&u<16&&v>=0&&v<16)R(px+u,py+v,Math.min(th[0],16-u),Math.min(th[1],16-v),j===0?E32.white:W[2])})}}}
// air bubble pickup / platform; t (s) for bob
function airBubble(px,py,t){const B=SEA_THEME.bubble,b=Math.round(Math.sin((t||0)*3));py+=b;
 const disc=(r,c)=>{for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j+r*.6));R(px+8-w,py+8+j,w*2,1,c)}};
 disc(6,B[2]);o.globalAlpha=.55;disc(5,B[0]);o.globalAlpha=1;R(px+4,py+4,2,2,E32.white);R(px+6,py+3,2,1,E32.white);R(px+10,py+11,1,1,B[1])}
// bubble helmet drawn over the robot (call after robot())
function robotBubbleHelmet(px,py){const B=SEA_THEME.bubble; // outline + glints only, so the robot underneath stays full brightness
 R(px+3,py-4,10,1,B[1]);R(px+1,py-3,2,1,B[1]);R(px+13,py-3,2,1,B[1]);R(px,py-2,1,14,B[1]);R(px+15,py-2,1,14,B[1]);R(px+1,py+12,1,1,B[1]);R(px+14,py+12,1,1,B[1]);
 R(px+2,py-2,2,1,E32.white);R(px+1,py-1,1,3,E32.white);R(px+13,py+8,1,2,B[0])}
// ---- 巨蟹王 mini-boss `$`: 16x16, claws extend 4px each side (px-4..px+20). frame 0/1 sidestep, dir 2 left/3 right (claw raised on facing side),
// hit = damage taken 0..1 (2 HP), flash=true for the white hit flash.
function crabKing(px,py,frame,dir,hit,t,flash){const O=E32.ink,S=flash?E32.white:E32.red3,D=flash?E32.grey1:E32.red2,L=flash?E32.white:E32.pink,f=frame?1:0,up=dir===3?1:0;
 o.globalAlpha=.35;R(px,py+14,16,2,E32.navy);o.globalAlpha=1;
 // legs (sidestep alternates)
 for(let k=0;k<3;k++){R(px+1-f+k*0,py+9+k*2,3,2,O);R(px+12+f,py+9+k*2,3,2,O);R(px+2-f,py+10+k*2,2,1,D);R(px+12+f,py+10+k*2,2,1,D)}
 // shell
 R(px+2,py+4,12,9,O);R(px+1,py+6,14,6,O);R(px+3,py+5,10,7,S);R(px+2,py+7,12,4,S);R(px+3,py+10,10,2,D);R(px+4,py+5,4,1,L);R(px+3,py+6,1,2,L);
 // crown
 R(px+4,py,8,4,O);R(px+5,py+1,6,2,E32.amber);R(px+5,py,1,1,E32.amber);R(px+7,py,2,1,E32.amber);R(px+10,py,1,1,E32.amber);R(px+7,py+2,2,1,E32.cyan);
 // eye stalks + angry eyes
 [[4,3],[10,3]].forEach(([a,b])=>{R(px+a-1,py+b,4,3,O);R(px+a,py+b+1,2,1,E32.white);R(px+a+(dir===2?0:1),py+b+1,1,1,O)});R(px+4,py+3,3,1,O);R(px+9,py+3,3,1,O);
 R(px+6,py+9,4,1,O); // mouth
 // claws: facing side raised high, other low
 const claw=(x,y,open)=>{R(x-1,y-1,7,6,O);R(x,y,5,4,S);R(x,y,2,1,L);if(open){R(x+2,y-1,2,3,O)}else R(x+2,y+1,3,1,O)};
 if(!hit){claw(px-4,py+(up?6:1)-(dir===2&&frame?1:0),dir===2);claw(px+15,py+(up?1:6)-(dir===3&&frame?1:0),dir===3);R(px,py+(up?8:4),3,2,O);R(px+13,py+(up?4:8),3,2,O)}
 else{ // hurt: left claw droops limp to the floor, right claw chipped & shorter
  R(px-1,py+9,3,3,O);R(px-3,py+11,6,5,O);R(px-2,py+12,4,3,S);R(px-2,py+14,4,1,D);
  R(px+14,py+5,5,4,O);R(px+15,py+6,3,2,S);R(px+17,py+5,2,1,E32.ink);R(px+13,py+7,3,2,O)}
 if(hit>=1){R(px+9,py+5,1,3,O);R(px+10,py+7,1,2,O);R(px+5,py+10,2,1,O)}}
function smallCrab(px,py,fl){const O=E32.ink,S=E32.red3;R(px+4,py+8,8,5,O);R(px+5,py+9,6,3,S);R(px+5,py+9,2,1,E32.pink);R(px+1,py+7,4,4,O);R(px+2,py+8,2,2,S);R(px+11,py+7,4,4,O);R(px+12,py+8,2,2,S);
 R(px+6,py+6,1,3,O);R(px+9,py+6,1,3,O);R(px+6,py+6,1,1,E32.white);R(px+9,py+6,1,1,E32.white);R(px+4,py+13,1,2,O);R(px+11,py+13,1,2,O)}
function crabKingDefeat(px,py,t,awayDir){
 if(t<.8){crabKing(px,py,0,1,1,t);R(px+3,py+4,3,1,O_ink());R(px+10,py+4,3,1,O_ink());for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py+-6+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)};return}
 const k=Math.min(1,(t-.8)/.8);if(k<.2){[[2,5],[9,4],[5,10],[11,10]].forEach(([a,c])=>{R(px+a-1,py+c-1,6,6,E32.blue1);R(px+a,py+c,4,4,E32.grey1)});return}
 smallCrab(px+(awayDir===2?-1:1)*Math.round(k*24),py-((t*12|0)%2),awayDir===2)}
function O_ink(){return E32.ink}
if(typeof module!=='undefined')module.exports={SEA_THEME,seaWater,seaSand,seaCoral,seaweed,seaCurrent,airBubble,robotBubbleHelmet};
if(typeof module!=='undefined')Object.assign(module.exports,{crabKing,crabKingDefeat,smallCrab});
