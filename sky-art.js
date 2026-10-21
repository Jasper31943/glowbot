// Sky island map (天空島) art. Load after art.js. 16x16, R() on `o`, Endesga 32. Pale sky, bright grass.
const SKY_THEME={name:'天空島',style:'sky',
 sky:['#9fdcf5','#b6e5f8','#cdeefb'],                 // gradient by world row band
 cloud:['#eef6fb',E32.grey1,'#dfeaf3'],
 grass:[E32.green1,E32.green2,'#8be06d'],
 dirt:[E32.brown1,E32.brown2,E32.tan],
 wind:[E32.white,'#e6f6fc'],
 outline:E32.ink};
const SKH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
// sky: colour depends only on world y band (bands of 4 tiles) -> no seams; soft clouds via world-coord hash on 3x2 clusters
function skyBg(px,py,x,y){const S=SKY_THEME.sky;R(px,py,16,16,S[Math.min(2,Math.max(0,Math.floor(y/4)))]);
 // soft clouds: cluster anchored on a 4x3 world grid, drawn per-pixel from world coords -> seamless rounded puffs
 const C=SKY_THEME.cloud;for(let j=0;j<16;j+=1)for(let k=0;k<16;k+=2){const wx=x*16+k,wy=y*16+j,cx0=Math.floor(wx/64),cy0=Math.floor(wy/48);
  if(SKH(cx0,cy0,1)>.45)continue;const ccx=cx0*64+20+Math.floor(SKH(cx0,cy0,2)*20),ccy=cy0*48+20;
  const dx=(wx-ccx)/18,dy=(wy-ccy)/6,d1=dx*dx+dy*dy,d2=((wx-ccx-6)/9)**2+((wy-ccy+5)/6)**2;
  const d=Math.min(d1,d2);if(d<1){o.globalAlpha=d>.7?.25:d>.45?.45:.6;R(px+k,py+j,2,1,'#f4fafd');o.globalAlpha=1}}}
// island ground; edges: object {n,s,e,w} true where neighbour is sky -> grass lip / dirt underside
function skyGround(px,py,x,y,edge){const G=SKY_THEME.grass,D=SKY_THEME.dirt;edge=edge||{};R(px,py,16,16,G[0]);
 for(let i=0;i<4;i++){const sx=px+1+Math.floor(SKH(x,y,i)*13),sy=py+2+Math.floor(SKH(x,y,i+5)*11);R(sx,sy,1,2,G[1]);R(sx+1,sy-1,1,2,G[2])}
 if(edge.n)R(px,py,16,2,G[2]);if(edge.w)R(px,py,1,16,G[1]);if(edge.e)R(px+15,py,1,16,G[1]);
 if(edge.s){R(px,py+11,16,5,D[0]);R(px,py+11,16,1,G[1]);R(px+3,py+14,3,2,D[1]);R(px+10,py+13,2,3,D[1]);R(px+7,py+12,1,1,D[2])}}
// hanging island underside (tile below an edge.s tile): tapering rock
function skyUnderside(px,py,x,y){skyBg(px,py,x,y);const D=SKY_THEME.dirt; // continuous jagged rock: depth per world column
 for(let k=0;k<16;k+=2){const wx=x*16+k,d=4+Math.round(Math.abs(Math.sin(wx*.11))*6+Math.sin(wx*.37)*2);R(px+k,py,2,d,D[0]);R(px+k,py+d-2,2,2,D[1])}
 R(px,py,16,1,D[1]);if(SKH(x,y,3)<.5)R(px+6,py+3,2,2,D[2])}
// cloud platform, frame 0/1 bob 1px
function cloudPlatform(px,py,frame){const C=SKY_THEME.cloud,b=frame?1:0,OL=E32.grey2;py+=b;
 o.globalAlpha=.35;R(px+2,py+14,12,2,E32.grey3);o.globalAlpha=1;                       // drop shadow below
 R(px,py+5,16,9,OL);R(px+2,py+3,7,3,OL);R(px+8,py+2,6,4,OL);                            // thin outline
 R(px+1,py+6,14,7,C[0]);R(px+3,py+4,5,3,C[0]);R(px+9,py+3,4,4,C[0]);
 R(px+1,py+10,14,3,C[1]);R(px+2,py+13,12,0,C[1]);R(px+3,py+5,2,1,E32.white);R(px+10,py+4,2,1,E32.white)}
// wind: dir 0..3, t (s) drives streak drift; streak positions use world coords -> continuous across tiles
function skyWind(px,py,x,y,dir,t){skyBg(px,py,x,y);const W=SKY_THEME.wind,s=Math.floor((t||0)*20),hz=dir>=2,fw=dir===1||dir===3;
 for(let k=0;k<2;k++){const lane=4+k*7;let p=((s+k*9+(hz?x:y)*16)%16+16)%16;
  for(let i=0;i<8;i++){const q=((fw?p-i:p+i)%16+16)%16;const c=i<2?W[0]:W[1];if(hz)R(px+q,py+lane,1,2,c);else R(px+lane,py+q,2,1,c)}}
 // drifting leaf
 const lp=((s*1.3+(x*7+y*3))%16+16)%16|0,lq=((fw?lp:15-lp)),wob=Math.round(Math.sin((t||0)*6+x)*1.5);
 const lx=hz?lq:8+wob,ly=hz?8+wob:lq;R(px+lx,py+ly,3,2,E32.green1);R(px+lx+1,py+ly,1,1,'#8be06d');R(px+lx+2,py+ly+1,1,1,E32.green2)}
// ---- 風暴鳥 `?`: 1 tile, drawn 24x16 (wings extend 4px each side: px-4..px+20). frame 0 wings up / 1 wings down, dir 2 left/3 right,
// hit = damage taken 0..1 (2 HP), t for sparks, flash=true white hit flash.
function stormBird(px,py,frame,dir,hit,t,flash){const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 const B=flash?E32.white:E32.purple,B2=flash?E32.grey1:E32.navy,BL=flash?E32.white:E32.magenta,Y=E32.yellow,tt=t||0,bob=frame?1:0;
 // wings
 if(!frame){r(-4,-1,9,7,O);r(-3,0,7,5,B);r(-3,0,3,1,BL);r(11,-1,9,7,O);r(12,0,7,5,B);r(16,0,3,1,BL);r(-4,-2,2,2,O);r(18,-2,2,2,O)}
 else{r(-4,7,9,6,O);r(-3,8,7,4,B);r(-3,11,7,1,B2);r(11,7,9,6,O);r(12,8,7,4,B);r(12,11,7,1,B2)}
 // body
 r(3,3+bob,11,10,O);r(4,4+bob,9,8,B);r(5,8+bob,6,3,E32.grey1);r(4,4+bob,3,1,BL);
 // storm crest
 r(5,0+bob,2,4,O);r(8,-1+bob,2,5,O);r(6,1+bob,1,2,Y);r(9,0+bob,1,3,Y);
 // head side: eye + beak (facing right by default)
 r(10,5+bob,3,3,O);r(10,6+bob,2,1,E32.white);r(11,6+bob,1,1,E32.red3);r(9,5+bob,4,1,O);
 r(13,6+bob,3,4,O);r(16,7+bob,2,2,O);r(18,8+bob,1,1,O);r(14,7+bob,2,2,Y);r(16,8+bob,2,1,Y); // sharp yellow beak
 // tail + talons
 r(0,9+bob,4,3,O);r(1,10+bob,2,1,B2);r(6,13+bob,2,2,O);r(9,13+bob,2,2,O);
 // zigzag lightning streaks on wingtips
 const zz=(x,y)=>{r(x,y,1,2,E32.white);r(x+1,y+1,1,2,Y);r(x,y+3,1,1,E32.white)};
 if(!frame){zz(-3,1);zz(18,1)}else{zz(-3,8);zz(18,8)}
 // storm cloud hovering above with flickering bolt
 const cy=-9+Math.round(Math.sin(tt*3)),cx=1;r(cx+1,cy,10,4,O);r(cx,cy+1,12,3,O);r(cx+3,cy-1,5,1,O);r(cx+2,cy+1,8,2,E32.grey3);r(cx+3,cy,5,1,E32.grey3);r(cx+3,cy,2,1,E32.grey2);
 if(Math.floor(tt*6)%3!==2){r(cx+6,cy+4,2,1,Y);r(cx+5,cy+5,2,1,Y);r(cx+6,cy+6,1,1,E32.white);r(cx+5,cy+7,1,1,Y)}
 if(hit>=1){r(6,5+bob,1,2,O);r(7,6+bob,1,2,O);r(14,1,2,1,E32.grey2)}}
function skySparrow(px,py,fl,f){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 r(4,6,8,6,O);r(5,7,6,4,E32.tan);r(5,9,4,2,E32.white);r(9,7,2,2,O);r(9,7,1,1,E32.white);r(11,8,2,1,E32.amber);r(2,8,3,2,O);
 if(f){r(5,3,4,4,O);r(6,4,2,2,E32.brown1)}else{r(5,10,5,3,O);r(6,10,3,1,E32.brown1)}}
const cloudChick=skySparrow;
function stormBirdDefeat(px,py,t,awayDir){
 if(t<.8){stormBird(px,py+Math.round(t*4),1,awayDir===2?3:2,1,0,false);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py+-6+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)};return}
 const k=Math.min(1,(t-.8)/.8);if(k<.2){[[0,4],[8,1],[14,6],[5,10]].forEach(([a,c])=>{R(px+a-1,py+c-1,6,6,E32.grey2);R(px+a,py+c,4,4,E32.white)});return}
 skySparrow(px+(awayDir===2?-1:1)*Math.round(k*26),py-Math.round(k*18),awayDir===2,Math.floor(t*12)%2)}
if(typeof module!=='undefined')module.exports={SKY_THEME,skyBg,skyGround,skyUnderside,cloudPlatform,skyWind};
if(typeof module!=='undefined')Object.assign(module.exports,{stormBird,stormBirdDefeat,skySparrow,cloudChick});
