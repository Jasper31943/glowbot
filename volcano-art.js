// Volcano map (火山) art. Load after art.js. 16x16, R() on `o`, Endesga 32. Lava stays orange/red (no yellow-white), below robot brightness.
const VOLCANO_THEME={name:'火山',style:'volcano',
 basalt:['#7a5048','#643f3a','#9a6a58','#3e2628'],
 ground:['#6e4840','#5c3a35','#a07060'],
 lava:[E32.red2,E32.orange,E32.red3,E32.amber],
 crust:['#9a7a6c','#8a6a5e',E32.orange,E32.amber,'#b08e7e'],
 smoke:[E32.grey2,E32.grey3,E32.grey4],
 outline:E32.ink};
const VH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
function volcanoGround(px,py,x,y,t){const G=VOLCANO_THEME.ground;R(px,py,16,16,G[0]);for(let i=0;i<4;i++)R(px+1+Math.floor(VH(x,y,i)*14),py+1+Math.floor(VH(x,y,i+5)*14),2,1,G[1]);
 for(let i=0;i<3;i++)R(px+2+Math.floor(VH(x,y,i+9)*12),py+2+Math.floor(VH(x,y,i+12)*12),1,1,G[2]);
 if(VH(x,y,20)<.35){const g=.25+.15*Math.sin((t||0)*2+x*1.3+y);o.globalAlpha=g;const cx=px+3+Math.floor(VH(x,y,21)*8),cy=py+4+Math.floor(VH(x,y,22)*8);R(cx,cy,3,1,E32.orange);R(cx+2,cy+1,1,2,E32.orange);R(cx+3,cy+2,2,1,E32.orange);o.globalAlpha=1}}
function volcanoRock(px,py,x,y,t){const B=VOLCANO_THEME.basalt;R(px,py,16,16,B[3]);R(px+1,py+1,14,14,B[0]);
 R(px+1,py+1,6,7,B[2]);R(px+2,py+2,4,5,B[0]);R(px+8,py+1,7,7,B[1]);R(px+1,py+9,8,6,B[1]);R(px+10,py+9,5,6,B[0]);R(px+2,py+1,3,1,'#b88a74');R(px+11,py+11,1,1,'#b88a74');R(px+4,py+12,2,1,'#b88a74');
 o.globalAlpha=.3+.15*Math.sin((t||0)*2+x+y*.7);R(px+7,py+1,1,7,E32.red3);R(px+1,py+8,14,1,E32.red3);R(px+9,py+9,1,6,E32.red3);o.globalAlpha=1}
// lava flow, frame 0/1; dir: 0 up 1 down 2 left 3 right (stripes scroll that way)
function lavaFlow(px,py,frame,dir){const L=VOLCANO_THEME.lava;o.save();o.beginPath();o.rect(px,py,16,16);o.clip();R(px,py,16,16,L[0]);const s=frame?4:0,hz=dir>=2,sg=(dir===1||dir===3)?1:-1;
 for(let i=0;i<4;i++){const k=((i*5+s*sg)%16+16)%16;if(hz){R(px+k,py+2+i*4%12,5,2,L[1]);R(px+k+1,py+3+i*4%12,2,1,L[2])}else{R(px+2+i*4%12,py+k,2,5,L[1]);R(px+3+i*4%12,py+k+1,1,2,L[2])}}
 R(px+(frame?11:4),py+(frame?4:10),2,2,L[3]);R(px,py,16,1,L[2]);o.restore()}
function lavaPool(px,py,frame){lavaFlow(px,py,frame,1);const L=VOLCANO_THEME.lava;R(px+5,py+6+(frame?1:0),3,3,L[1]);R(px+6,py+6+(frame?1:0),1,1,L[3])}
// cooled lava: walkable dark crust, faint red cracks
function cooledLava(px,py,x,y,t){const C=VOLCANO_THEME.crust;R(px,py,16,16,C[0]); // flat, lighter than walls -> reads as floor
 R(px,py,16,1,C[4]);R(px+2,py+3,5,1,C[4]);R(px+9,py+11,4,1,C[4]);R(px+1,py+15,16,1,C[1]);
 const g=.55+.25*Math.sin((t||0)*3+x*2+y);o.globalAlpha=g;R(px+7,py+2,1,5,C[2]);R(px+7,py+7,5,1,C[2]);R(px+3,py+10,4,1,C[2]);R(px+12,py+8,1,3,C[2]);
 R(px+7,py+7,1,1,C[3]);R(px+4,py+10,1,1,C[3]);o.globalAlpha=1}
// fire breath has no effect here: grey smoke puff, frame 0..2
function noEffectPuff(px,py,frame){const S=VOLCANO_THEME.smoke,r=[3,4,5][frame];o.globalAlpha=[1,.85,.55][frame];
 const disc=(cx,cy,rr,c)=>{for(let j=-rr;j<=rr;j++){const w=Math.round(Math.sqrt(rr*rr-j*j+rr*.6));R(px+cx-w,py+cy+j,w*2,1,c)}};
 disc(6,9-frame,r-1,S[1]);disc(10,9-frame,r-1,S[1]);disc(8,7-frame,r,S[0]);disc(8,6-frame,Math.max(1,r-2),E32.grey1);
 if(frame===2){R(px+3,py+2,2,2,S[1]);R(px+12,py+1,1,1,S[1])}o.globalAlpha=1;
 if(frame>=1){R(px+12,py+10,3,1,E32.grey1);R(px+13,py+9,1,3,E32.grey1)}} // little "fizzle" tick
// robot face while noEffectPuff plays: draw robot normally, then this overlay (front-facing).
function robotDumbfounded(px,py,t){if(typeof robot==='function')robot(px,py,'n','down',0,0,1);
 R(px+4,py+7,8,4,E32.navy);R(px+5,py+7,2,2,E32.cyan);R(px+9,py+7,2,2,E32.cyan);R(px+5,py+7,1,1,E32.white);R(px+9,py+7,1,1,E32.white);R(px+7,py+10,2,1,E32.cyan);
 const n=1+Math.floor((t||0)*4)%3;for(let i=0;i<n;i++)R(px+11+i*2,py-1,1,1,E32.white)} // '...' dots
if(typeof module!=='undefined')module.exports={robotDumbfounded,VOLCANO_THEME,volcanoGround,volcanoRock,lavaFlow,lavaPool,cooledLava,noEffectPuff};
// ---- 熔岩巨人 mini-boss: 16x24, draws 8px above tile (py-8..py+16). stage 0 intact,1,2 cracked,3 final (heavily cracked, nearly cooled)
function lavaGiant(px,py,stage,t){const O=E32.ink,b=Math.sin(t*3),fin=stage>=3;
 const RK=fin?E32.grey3:E32.navy,HI=fin?E32.grey1:E32.grey3,HI2=fin?E32.white:E32.grey2,SH=fin?E32.grey4:E32.ink;
 const CORE=fin?E32.orange:(b>0?E32.yellow:E32.amber),EDGE=fin?E32.red2:E32.orange;
 R(px-2,py+13,20,4,E32.orange);R(px,py+14,16,2,E32.yellow);
 const disc=(cx,cy,rx,ry,col)=>{for(let j=-ry;j<=ry;j++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(j*j)/((ry+.5)*(ry+.5)))));R(px+cx-w,py+cy+j,w*2,1,col)}};
 const L=[[8,7,6,6],[3,1,5,4],[13,2,4,4],[0,7,3,5],[17,6,2,4],[-1,12,3,2],[17,11,3,3],[5,13,3,2],[11,13,3,2]],H=[7,-5,4,3];
 const off=fin?1:0; // stage 3: chunks drift apart
 L.forEach(([x,y,rx,ry],i)=>disc(x+(fin?(i%2?off:-off):0),y,rx+1,ry+1,O));
 L.forEach(([x,y,rx,ry],i)=>{x+=fin?(i%2?off:-off):0;disc(x,y,rx,ry,RK);R(px+x-rx+1,py+y+ry-1,rx*2-2,1,SH);R(px+x-rx+2,py+y-ry,Math.max(2,rx*2-5),1,HI);R(px+x-rx+2,py+y-ry,2,1,HI2)});
 disc(H[0],H[1],H[2]+1,H[3]+1,O);disc(H[0],H[1],H[2],H[3],RK);R(px+4,py-8,6,1,HI);R(px+5,py-8,2,1,HI2);
 const seam=(pts,w)=>{pts.forEach(([x,y],i)=>{const d=i%2?1:-1;for(let k=0;k<3;k++)R(px+x+k*d,py+y+k*2,w,2,EDGE)});pts.forEach(([x,y],i)=>{const d=i%2?1:-1;for(let k=0;k<3;k++)R(px+x+k*d,py+y+k*2,w-1,2,CORE)})};
 const S=[[[7,6],[9,9]],[[3,1],[13,2],[5,10],[11,4]],[[0,7],[15,8],[8,1],[11,11],[2,4],[14,-1]],[[6,12],[16,5],[-1,10],[9,-1]]];
 const n=stage>=3?4:stage+1;
 if(stage===2){o.globalAlpha=.3;for(let i=0;i<3;i++)S[i].forEach(([x,y])=>R(px+x-2,py+y-1,5,7,E32.amber));o.globalAlpha=1}
 const wd=stage===0?2:3;for(let i=0;i<n;i++)seam(S[i],wd);
 // face: big glowing eyes
 R(px+3,py-8,10,1,O);[[2,-8],[8,-8]].forEach(([x,y])=>{R(px+x,py+y,6,5,O);R(px+x+1,py+y+1,4,3,E32.yellow);R(px+x+1,py+y+1,2,1,E32.white)});
 R(px+5,py-2,5,1,O);
 if(stage===2&&b>.3){R(px-2,py-3,1,1,E32.yellow);R(px+18,py,1,1,E32.yellow);R(px+8,py-11,1,1,E32.amber)}
 if(fin){o.globalAlpha=.8;R(px+1,py-11+Math.round(b),3,2,E32.grey1);R(px+12,py-12-Math.round(b),3,2,E32.grey1);R(px+7,py-14,2,2,E32.grey2);o.globalAlpha=1}}
function lavaGiantDefeat(px,py,t){
 if(t<.6){lavaGiant(px,py,3,t);const k=t/.6;for(let i=0;i<4;i++)R(px+2+i*4,py-10-Math.round(k*8)-i%2*2,2,2,E32.grey1);return}
 const k=Math.min(1,(t-.6)/.6);if(k<.3){[[2,4],[8,2],[5,9],[10,9]].forEach(([a,c])=>{R(px+a-1,py+c-1,6,6,E32.grey3);R(px+a,py+c,4,4,E32.grey1)});return}
 rockBuddy(px,py-Math.round(Math.abs(Math.sin(t*6))*2))}
function rockBuddy(px,py){const r=(a,c,w,h,col)=>R(px+a,py+c,w,h,col),O=E32.ink;
 r(2,5,12,10,O);r(3,6,10,8,E32.grey2);r(4,6,3,2,E32.grey1);r(5,9,2,2,O);r(9,9,2,2,O);r(5,9,1,1,E32.white);r(9,9,1,1,E32.white);
 r(6,12,4,1,O);r(4,11,1,1,E32.pink);r(11,11,1,1,E32.pink);r(7,4,2,2,O);r(7,3,2,1,E32.amber);r(2,14,3,2,O);r(11,14,3,2,O)}
// checkpoint brazier: 16x16, lit flame pops for ~0.3s from lit-time (t = seconds since lit for the pop; flame animates on)
function bossCheckpointFlame(px,py,lit,t){const O=E32.ink,r=(a,c,w,h,col)=>R(px+a,py+c,w,h,col);
 if(lit&&t<.3){const rad=5+Math.round((1-t/.3)*4),cx=8,cy=5;[[rad,.25],[rad-2,.35],[rad-4,.45]].forEach(([q,a])=>{if(q<1)return;o.globalAlpha=a;for(let j=-q;j<=q;j++){const w=Math.round(Math.sqrt(q*q-j*j));r(cx-w,cy+j,w*2,1,E32.yellow)}});o.globalAlpha=1}
 r(3,9,10,4,O);r(4,10,8,2,E32.grey2);r(4,10,8,1,E32.grey1);r(6,13,4,3,O);r(7,13,2,2,E32.grey3);r(4,15,8,1,O);
 if(!lit){r(5,8,6,2,O);r(6,8,4,1,E32.grey3);return}
 const f=(t*8|0)%2;r(5,2-f,6,8,O);r(6,3-f,4,6,E32.orange);r(7,1-f,2,2,O);r(7,2-f,2,2,E32.amber);r(7,5,2,3,E32.yellow);r(7,6,1,1,E32.white);r(4,6+f,1,1,E32.amber);r(11,5-f,1,1,E32.yellow)}
if(typeof module!=='undefined')Object.assign(module.exports,{lavaGiant,lavaGiantDefeat,rockBuddy,bossCheckpointFlame});
