// Forest map (森林) art for big-map mode. Load after art.js (and desert-art.js for hpPips/robotShadow, else local fallbacks).
// 16x16 tiles, R() on ctx `o`, Endesga 32. Fire is capped at yellow/orange/red (never white) so the robot stays brightest.
const FOREST_THEME={name:'森林',style:'forest',
 ground:[E32.green2,E32.green3,'#7fd36a'],          // floor / shade / dappled light spot
 canopy:[E32.green3,E32.green2,E32.teal,E32.brown2],// two greens + dark edge + trunk
 vine:[E32.teal,E32.green3,E32.green2],
 burnt:[E32.plum,E32.ink,E32.brown2],
 fire:[E32.yellow,E32.orange,E32.red3],
 beetle:[E32.blue1,E32.navy,E32.grey2],
 outline:E32.ink};
const FH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
// ground with dappled light; t (seconds) gently drifts the spots
function forestGround(px,py,x,y,t){const G=FOREST_THEME.ground;R(px,py,16,16,G[0]);
 for(let i=0;i<4;i++)R(px+1+Math.floor(FH(x,y,i)*14),py+1+Math.floor(FH(x,y,i+5)*14),1,1,G[1]);
 if(FH(x,y,9)<.4){const d=Math.round(Math.sin((t||0)*.8+x)*1);const sx=px+3+Math.floor(FH(x,y,10)*7)+d,sy=py+3+Math.floor(FH(x,y,11)*7);
  o.globalAlpha=.55;R(sx,sy,4,3,G[2]);R(sx+1,sy-1,2,5,G[2]);o.globalAlpha=1}}
// canopy wall (two greens)
function forestCanopy(px,py,x,y){const C=FOREST_THEME.canopy;R(px,py,16,16,C[2]);
 const o2=Math.floor(FH(x,y,1)*3);R(px+1,py+1+o2,14,12,C[0]);R(px+2,py+2+o2,7,5,C[1]);R(px+9,py+5,5,4,C[1]);R(px+3,py+3+o2,2,1,E32.green1);
 if(FH(x,y,3)<.3)R(px+7,py+13,2,3,C[3])}
// vine: blocks path, burnable
function vine(px,py,x,y){const V=FOREST_THEME.vine,D=E32.ink,M='#1f4a33';R(px,py,16,16,V[0]);
 // two thick twisted trunks crossing, darker than ground
 for(let j=0;j<16;j++){const a=Math.round(Math.sin(j*.45)*3),b=Math.round(Math.sin(j*.45+3.1)*3);
  R(px+3+a,py+j,4,1,D);R(px+4+a,py+j,2,1,M);R(px+9+b,py+j,4,1,D);R(px+10+b,py+j,2,1,M);if(j%4===1){R(px+4+a,py+j,1,1,V[2]);R(px+10+b,py+j,1,1,V[2])}}
 // big leaves
 [[1,2,0],[10,5,1],[2,10,1],[11,12,0]].forEach(([lx,ly,f])=>{R(px+lx,py+ly,5,3,D);R(px+lx+1,py+ly-1,3,5,D);R(px+lx+1,py+ly,3,3,V[2]);R(px+lx+(f?3:1),py+ly,1,1,E32.green1);R(px+lx+2,py+ly+1,1,2,V[1])});
 R(px,py+15,16,1,D)}
// burnt vine: stepsLeft until regrowth (6..1). last 2 steps sprout grows & flashes (pass t for flashing)
function vineBurnt(px,py,stepsLeft,t){const B=FOREST_THEME.burnt;R(px,py,16,16,B[0]);R(px+2,py+3,4,2,B[1]);R(px+9,py+10,5,2,B[1]);R(px+11,py+4,2,1,B[2]);
 const big=stepsLeft<=2,fl=big&&Math.floor((t||0)*6)%2;const c=fl?E32.green1:E32.green2;
 R(px+7,py+(big?7:10),1,big?6:3,c);R(px+5,py+(big?7:10),2,1,c);R(px+8,py+(big?6:9),2,1,c);if(big){R(px+4,py+6,2,1,c);R(px+9,py+5,2,1,c)}}
// fire breath puff, frame 0..2 = yellow -> orange -> red, growing then breaking up
function firePuff(px,py,frame){const F=FOREST_THEME.fire,c=F[frame],core=[E32.yellow,E32.amber,E32.orange][frame],t0=[E32.amber,E32.yellow,E32.orange][frame];
 const blobs=[[[8,9,3]],[[6,9,3],[10,9,3],[8,7,3]],[[5,10,3],[11,10,3],[8,7,4],[8,11,3]]][frame];
 const disc=(cx,cy,r,col)=>{for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j+r*.6));R(px+cx-w,py+cy+j,w*2,1,col)}};
 blobs.forEach(([x,y,r])=>disc(x,y,r+1,c));blobs.forEach(([x,y,r])=>disc(x,y-1,Math.max(1,r-2),core));
 [[[8,4]],[[7,2],[11,4]],[[6,2],[10,1],[13,5]]][frame].forEach(([a,b])=>{R(px+a,py+b,1,2,c);R(px+a,py+b-1,1,1,t0)});
 if(frame===2){R(px+3,py+4,2,2,F[1]);R(px+13,py+13,1,1,F[1])}}
// beetle; stunStars 0..3 drawn as stars above head (engine decrements per step)
function beetle(px,py,frame,stunStars,t){const B=FOREST_THEME.beetle,O=FOREST_THEME.outline,b=stunStars?0:(frame?1:0);
 R(px+3,py+4+b,10,10,O);R(px+4,py+5+b,8,8,B[0]);R(px+8,py+5+b,1,8,O);R(px+5,py+6+b,2,1,B[2]);
 R(px+6,py+3+b,4,2,O);R(px+5,py+2+b,1,1,O);R(px+10,py+2+b,1,1,O);
 for(let i=0;i<3;i++){R(px+2,py+6+i*3+(frame&&!stunStars?1:0),1,1,O);R(px+13,py+6+i*3+(frame&&!stunStars?0:1),1,1,O)}
 for(let i=0;i<stunStars;i++){const a=(t||0)*6+i*2.094,sx=px+7+Math.round(Math.cos(a)*5),sy=py-1+Math.round(Math.sin(a)*1.5);
  R(sx,sy,2,2,E32.yellow);R(sx-1,sy+0,1,1,E32.amber);R(sx+2,sy+1,1,1,E32.amber)}}
// 老樹精 boss: 2x2 dark-green tree with face on the trunk; hit -> white flash; hp pips above
function elderTree(px,py,frame,hit,hp,max){const C=FOREST_THEME.canopy,O=FOREST_THEME.outline,sw=frame?1:0;
 const L0=hit?E32.white:C[0],L1=hit?E32.grey1:C[1],TR=hit?E32.white:E32.brown1;
 R(px+1+sw,py+1,30,15,O);R(px+2+sw,py+2,28,13,L0);R(px+4+sw,py+3,10,5,L1);R(px+17+sw,py+6,10,5,L1);
 R(px+8,py+14,16,17,O);R(px+9,py+15,14,15,TR);R(px+9,py+15,2,15,hit?E32.grey1:E32.brown2);
 R(px+11,py+18,3,3,E32.ink);R(px+18,py+18,3,3,E32.ink);R(px+12,py+19,1,1,E32.amber);R(px+19,py+19,1,1,E32.amber); // eyes
 R(px+10,py+17,5,1,E32.brown2);R(px+17,py+17,5,1,E32.brown2);R(px+13,py+24,6,2,E32.plum);                  // brows, mouth
 R(px+4,py+29,6,2,E32.brown2);R(px+22,py+29,6,2,E32.brown2);                                              // roots
 (typeof hpPips==='function'?hpPips:function(cx,y,hp,max){const w=max*4;R(cx-w/2-1,y-1,w+1,5,E32.ink);for(let i=0;i<max;i++)R(cx-w/2+i*4,y,3,3,i<hp?E32.red3:E32.grey4)})(px+16,py-5,hp,max)}
if(typeof module!=='undefined')module.exports={FOREST_THEME,forestGround,forestCanopy,vine,vineBurnt,firePuff,beetle,elderTree};
