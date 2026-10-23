// 王被球棒打昏 (stunned boss overlay) — castle 騎士王 'knight', power plant 電火花王 'spark' (+ factory 故障機器人 'glitch', the third STUNBOSS).
// Load after art.js + castle-art.js / power-art.js / factory-art.js. 16x16 tiles, R() on `o`, Endesga 32 only. Helpers prefixed BSA_.
// Rules kept: no white (#ffffff) and no red added here; nothing toggles faster than 2 Hz (Math.floor(t*2)); stars / eyes MOVE, they don't blink.
// Reads as "炸彈的時機": orbiting stars like mineBatStunned / stunStars (same 2x2 yellow + amber tips, same T*6 orbit) + a step counter above the head
// with a tiny bomb icon in front of it (= bombs work NOW). Last step: one drooping slower amber star, the single pip goes orange and pulses at 1 Hz.
// The existing boss draw function is called UNMODIFIED (same args the engine uses, frame 0, 1 px lower = slumped), then the overlay goes on top.
const BSA_THEME={pip:E32.sand,pipLast:E32.orange,pipLast2:E32.amber,pipOff:E32.navy,star:E32.yellow,starTip:E32.amber,eyeRing:E32.grey1,spark:E32.amber,
 bomb:'#3a4466',bombHi:E32.grey3,fuse:E32.brown1};
// per kind: anchor of the head for the stars (orbit centre, tile-relative) and the counter row; base(px,py,frame,O) calls the existing art.
const BSA_KIND={
 knight:{starY:-13,pipY:-20,base:(px,py,f,O)=>armorKnightKing(px,py,0,O.dir,O.hurt,false,!!O.flash)},
 spark: {starY:-7, pipY:-15,base:(px,py,f,O)=>sparkKing(px,py,0,O.dir,O.hurt,false,O.powered!==false,!!O.flash)},
 glitch:{starY:-4, pipY:-12,base:(px,py,f,O)=>glitchKing(px,py,0,O.dir,O.hurt,false,!!O.flash)}};
const BSA_r=(px,py,fl)=>(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c);
// swirl ("dizzy") eye: 3x3 grey ring, one ink dot travelling round it (motion, 8 positions/s — not a blink)
function BSA_eye(r,x,y,t,rev){const RING=[[0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1]],k=(Math.floor((t||0)*8)*(rev?-1:1)%8+8)%8;
 r(x,y,3,3,BSA_THEME.eyeRing);r(x+1,y+1,1,1,E32.ink);const q=RING[k];r(x+q[0],y+q[1],1,1,E32.ink)}
// orbiting stars (same look as world.js stunStars / bat-art mineBatStunned). last = 1 slow, low, amber star.
function BSA_stars(px,py,cy,n,t,last){const tt=t||0;
 if(last){const a=tt*3,sx=px+7+Math.round(Math.cos(a)*6),sy=py+cy+2+Math.round(Math.sin(a)*1.5);R(sx-1,sy-1,4,4,E32.ink);R(sx,sy,2,2,E32.amber);R(sx+2,sy+1,1,1,E32.orange);return}
 for(let i=0;i<n;i++){const a=tt*6+i*2.094,sx=px+7+Math.round(Math.cos(a)*6),sy=py+cy+Math.round(Math.sin(a)*1.5);
  R(sx-1,sy-1,4,4,E32.ink);R(sx,sy,2,2,BSA_THEME.star);R(sx-1,sy,1,1,BSA_THEME.starTip);R(sx+2,sy+1,1,1,BSA_THEME.starTip)}}
// 3x5 digits for long stuns (max > 5)
const BSA_DIG=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
function BSA_digit(x,y,d,c){const g=BSA_DIG[d%10];for(let i=0;i<15;i++)if(g[i]==='1')R(x+i%3,y+Math.floor(i/3),1,1,c)}
// tiny bomb icon (7x7): "bombs hurt it now"
function BSA_bombIcon(x,y,t){const T0=BSA_THEME;R(x+1,y+2,5,5,E32.ink);R(x,y+3,7,3,E32.ink);R(x+1,y+3,5,3,T0.bomb);R(x+2,y+2,3,5,T0.bomb);R(x+2,y+3,1,1,T0.bombHi);
 R(x+4,y+1,1,1,T0.fuse);R(x+5,y,1,1,E32.amber)}
// step counter: `max` pips (filled = steps left). Last step: single orange pip, pulses orange/amber at 1 Hz (Math.floor(t*2)).
function BSA_counter(px,py,cy,left,max,t,bombOk){const T0=BSA_THEME,n=Math.max(1,max|0),last=left<=1,X=px+8,Y=py+cy;
 if(n<=5){const w=n*5+1+(bombOk?9:0);let x=X-Math.floor(w/2);
  if(bombOk){BSA_bombIcon(x,Y-1,t);x+=9}
  R(x,Y,n*5+1,5,E32.ink);
  for(let i=0;i<n;i++){const on=i<left,c=!on?T0.pipOff:last?(Math.floor((t||0)*2)%2?T0.pipLast2:T0.pipLast):T0.pip;R(x+1+i*5,Y+1,4,3,c)}
  if(last){R(x-1,Y-1,n*5+3,1,E32.ink);R(x-1,Y+5,n*5+3,1,E32.ink);R(x-1,Y,1,5,T0.pipLast);R(x+n*5+1,Y,1,5,T0.pipLast)}return}
 const s=String(Math.max(0,left|0)),w=s.length*4+3+(bombOk?9:0);let x=X-Math.floor(w/2);if(bombOk){BSA_bombIcon(x,Y-1,t);x+=9}
 R(x,Y-1,s.length*4+3,7,E32.ink);[...s].forEach((d,i)=>BSA_digit(x+2+i*4,Y,+d,last?T0.pipLast:T0.pip))}
// ---- per-boss themed overlays (tile-relative, mirrored with dir like the base art)
function BSA_knight(px,py,t,O){const r=BSA_r(px,py,O.dir===2),Ink=E32.ink,A=E32.grey2,RIM=E32.grey1,G=E32.amber,tt=t||0;
 // helmet knocked askew: redraw a slightly bigger helmet over the original in 3 slices stepping up left→right (tilted ~10°), visor slid down
 [[2,4,1],[6,4,0],[10,4,-1]].forEach(([x,w,d],i)=>{r(x,-3+d+1,w,10,Ink);r(x+(i?0:1),-2+d+1,w-(i===2?1:0)-(i?0:1),8,A);r(x+(i?0:1),-2+d+1,w-(i===2?1:0)-(i?0:1),1,RIM);
  r(x+(i?0:1),-3+d+1,w-(i===2?1:0)-(i?0:1),1,G);r(x+(i?0:1),2+d,w-(i===2?1:0)-(i?0:1),4,Ink);r(x+(i?0:1),6+d,w-(i===2?1:0)-(i?0:1),1,E32.grey3)});
 r(3,-1,1,3,RIM);r(4,-3,1,1,G);r(8,-4,1,1,G);r(12,-5,1,1,G);                                               // rim + crown points, tilted
 BSA_eye(r,3,3,tt,false);BSA_eye(r,9,2,tt,true);                                                         // swirl eyes inside the slit
 // visor sparks: 2 short amber sparks drifting out of the visor corners (each 0.5 s life, moving — no flashing)
 for(let i=0;i<2;i++){const p=((tt+i*.25)%.5)/.5,sx=i?14+Math.round(p*3):1-Math.round(p*3),sy=(i?2:3)-Math.round(p*3);r(sx,sy,1,1,p<.6?E32.amber:E32.orange);if(p<.3)r(sx+(i?-1:1),sy+1,1,1,E32.sand)}}
function BSA_spark(px,py,t,O){const r=BSA_r(px,py,O.dir===2),tt=t||0,on=O.powered!==false,dim=Math.floor(tt*2)%2;
 const disc=(cx,cy,rx,ry,col)=>{for(let j=-ry;j<=ry;j++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(j*j)/((ry+.5)*(ry+.5)))));r(cx-w,cy+j,w*2,1,col)}};
 // power drained: navy wash over the orb, core sputters between amber and dim navy at 1 Hz (≤ 2 changes/s)
 o.globalAlpha=.5;disc(8,8,6,5,E32.navy);o.globalAlpha=1;disc(8,8,2,2,dim?'#3a4466':(on?E32.amber:E32.grey3));
 r(3,6,10,4,E32.ink);BSA_eye(r,4,6,tt,false);BSA_eye(r,9,6,tt,true);                                      // dizzy eyes over the angry arcs
 // fizzling electricity: 3 little dim blue sparks sliding DOWN off the crown (drained), fading out
 for(let i=0;i<3;i++){const p=((tt*1.5+i/3)%1),sx=[5,8,11][i]+(i===1?0:(i?1:-1))*Math.round(p*2),sy=-2+Math.round(p*7);o.globalAlpha=1-p;r(sx,sy,1,1,p<.5?E32.blue2:E32.grey3);o.globalAlpha=1}}
function BSA_glitch(px,py,t,O){const r=BSA_r(px,py,O.dir===2),tt=t||0;
 r(4,7,8,4,E32.ink);r(5,8,6,2,E32.navy);                                                                  // display panel off…
 const k=Math.floor(tt*8)%6;r(5+k,8,1,1,E32.cyan);r(10-k,9,1,1,E32.magenta);                              // …only a lost scan dot sweeping each row
 for(let i=0;i<2;i++){const p=((tt*.8+i*.5)%1);o.globalAlpha=.6*(1-p);r(7+i-Math.round(p*2),-1-Math.round(p*6),2+Math.round(p*2),2,E32.grey3);o.globalAlpha=1}} // smoke puffs from the vent
// ===== public =====
// kind = boss kind ('knight' | 'spark' | 'glitch'). Unknown kinds draw only stars + counter (caller draws the boss itself).
// px,py = screen top-left of the boss tile (same as the engine passes to the base draw: mpos('bosses',o)). frame = animation frame (sway).
// stepsLeft = o.fr (1..N). t = seconds (T). opt = {max: stun length (default 3 = WE.BATSTUN), dir: o.d===2?2:3, hurt: o.max-o.hp,
//   powered: !!S.gen (spark), flash: boss hit flash, bombOk: true when bombs hurt it now (default true; pass false for fire / crash stuns)}.
function bossStunned(kind,px,py,frame,stepsLeft,t,opt){const O=Object.assign({max:3,dir:3,hurt:0,powered:true,flash:false,bombOk:true},opt||{}),K=BSA_KIND[kind],left=Math.max(0,stepsLeft|0),last=left<=1;
 const sw=frame?1:0,bx=px+(last?0:sw?1:0),by=py+1;                                                        // slumped 1px; sways 1px while dizzy, settles on the last step
 if(K){K.base(bx,by,frame,O);({knight:BSA_knight,spark:BSA_spark,glitch:BSA_glitch})[kind](bx,by,t,O)}
 const cy=K?K.starY:-4,pc=K?K.pipY:-12;
 BSA_stars(bx,by,cy,Math.min(3,left),t,last);
 BSA_counter(px,py,pc,left,Math.max(O.max,left),t,O.bombOk)}
// Stun-ended frame (show for ~0.2 s on the step fr goes 1→0): boss drawn normally 1px HIGHER (snaps upright), stars flung outward and fading,
// two ink shake-off lines either side of the head, no counter. Spark: a soft amber re-ignite ring; knight: helmet straight again (base art).
function bossStunEnd(kind,px,py,t,opt){const O=Object.assign({dir:3,hurt:0,powered:true,flash:false},opt||{}),K=BSA_KIND[kind],tt=t||0,k=Math.min(1,tt/.2),cy=K?K.starY:-4;
 if(K)K.base(px,py-1,0,O);
 if(kind==='spark'){o.globalAlpha=.45*(1-k);for(let a=0;a<20;a++){const q=a/20*Math.PI*2;R(px+8+Math.round(Math.cos(q)*(9+k*2)),py+7+Math.round(Math.sin(q)*(8+k*2)),1,1,E32.amber)}o.globalAlpha=1}
 for(let i=0;i<3;i++){const a=i*2.094+.5,d=7+k*7,sx=px+7+Math.round(Math.cos(a)*d),sy=py+cy-1+Math.round(Math.sin(a)*d*.5)-Math.round(k*3);o.globalAlpha=1-k*.7;R(sx,sy,2,2,BSA_THEME.star);R(sx+2,sy+1,1,1,BSA_THEME.starTip);o.globalAlpha=1}
 const hy=py+cy+8;[[-3,0],[-4,3],[18,0],[19,3]].forEach(([x,y])=>R(px+x,hy+y,2,1,E32.ink))}
if(typeof module!=='undefined')module.exports={BSA_THEME,BSA_KIND,bossStunned,bossStunEnd};
