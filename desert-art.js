// Desert map (沙漠) art for big-map mode. Load after art.js (same conventions as ice-art.js):
// 16x16 tiles, R(x,y,w,h,color) on ctx `o`, Endesga 32 colours (E32). Time-based pieces take an explicit
// frame or t (seconds) so the engine decides timing. Robot (white/cyan) stays the brightest thing: no pure white here
// except the 1-frame hit flash and tiny glints.
const DESERT_THEME={name:'沙漠',style:'desert',
 sand:[E32.tan,E32.orange1,'#efb985'],               // floor base / ripple shade / light speckle
 rock:[E32.sand,'#cfb58c',E32.brown1,E32.brown2],    // light beige rock wall
 quick:[E32.orange1,E32.red1,E32.brown1],            // quicksand base / spiral / deep centre
 bridge:[E32.sand,'#cfb58c',E32.brown1],             // sand bridge (walkable, wood grain)
 dune:[E32.tan,E32.amber,E32.orange1,E32.brown1],
 cactus:[E32.green2,E32.green1,E32.green3],bone:[E32.grey1,E32.grey2],
 outline:E32.brown2};
const DH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
function desertSand(px,py,x,y){const S=DESERT_THEME.sand;R(px,py,16,16,S[0]);
 const off=Math.floor(DH(x,y,1)*4);R(px+1+off,py+5,6,1,S[1]);R(px+7+off,py+4,3,1,S[1]);R(px+3,py+11+off%2,7,1,S[1]); // wind ripples
 for(let i=0;i<3;i++)R(px+1+Math.floor(DH(x,y,i+5)*14),py+1+Math.floor(DH(x,y,i+9)*14),1,1,S[2])}
function desertRock(px,py,x,y,top){const K=DESERT_THEME.rock;R(px,py,16,16,K[3]);R(px+1,py+1,14,14,K[0]);
 R(px+1,py+6,14,1,K[1]);R(px+1,py+11,14,1,K[1]);R(px+5+Math.floor(DH(x,y,2)*5),py+7,1,4,K[1]);R(px+3,py+2,1,4,K[1]);
 R(px+11,py+12,2,2,K[2]);if(top)R(px,py,16,2,'#f3e2c0')}
function desertCactus(px,py,x,y){desertSand(px,py,x,y);const C=DESERT_THEME.cactus,O=DESERT_THEME.outline;
 R(px+6,py+2,4,13,O);R(px+7,py+3,2,12,C[0]);R(px+7,py+3,1,10,C[1]);
 R(px+2,py+6,4,6,O);R(px+3,py+7,2,4,C[0]);R(px+3,py+10,4,2,C[0]);R(px+10,py+4,4,6,O);R(px+11,py+5,2,3,C[0]);R(px+9,py+7,4,2,C[0]);
 R(px+5,py+15,6,1,DESERT_THEME.sand[1]);if(DH(x,y,4)<.5)R(px+7,py+2,2,1,E32.pink)} // little flower on top
function desertBone(px,py,x,y){desertSand(px,py,x,y);const B=DESERT_THEME.bone;
 R(px+4,py+8,8,2,B[0]);R(px+3,py+7,2,2,B[0]);R(px+3,py+10,2,2,B[0]);R(px+11,py+7,2,2,B[0]);R(px+11,py+10,2,2,B[0]);R(px+4,py+10,8,1,B[1]);
 R(px+5,py+12,6,1,DESERT_THEME.sand[1])}
// quicksand: frame 0/1 rotates the inward spiral one quarter
function quicksand(px,py,frame){const Q=DESERT_THEME.quick;R(px,py,16,16,Q[0]);R(px+1,py+1,14,14,Q[0]);
 const arms=frame?[[3,3,10,1],[12,3,1,9],[4,11,9,1],[4,6,1,5],[5,6,6,1],[10,7,1,3],[7,9,3,1]]
                 :[[3,12,10,1],[3,3,1,9],[3,4,9,1],[11,4,1,6],[5,10,6,1],[6,7,1,3],[6,7,3,1]];
 arms.forEach(([a,b,w,h])=>R(px+a,py+b,w,h,Q[1]));R(px+7,py+7,2,2,Q[2])}
// sand bridge: box sank -> stays here permanently (no fade). light beige planks with wood grain
function sandBridge(px,py){const B=DESERT_THEME.bridge;R(px,py,16,16,DESERT_THEME.quick[0]);R(px+1,py+1,14,14,B[2]);
 for(let i=0;i<3;i++){R(px+1,py+1+i*5,14,4,B[0]);R(px+2+i*3,py+2+i*5,5,1,B[1]);R(px+9-i,py+3+i*5,4,1,B[1])}
 [[2,2],[13,2],[2,12],[13,12]].forEach(([a,b])=>R(px+a,py+b,1,1,B[2]))}
// dune: pushable-ish sand pile that moves with the robot's steps. frame 0/1 wobble. onSwitch: switch rim glows amber.
function dune(px,py,frame,onSwitch){const D=DESERT_THEME.dune,w=frame?1:0;
 if(onSwitch){R(px+1,py+11,14,4,E32.amber);R(px+2,py+12,12,2,E32.orange)}
 R(px+2-w,py+8,12+w*2,6,D[3]);R(px+3-w,py+7,10+w*2,6,D[2]);R(px+4,py+5+w,8,6-w,D[0]);R(px+5,py+4+w,6,2,D[1]);R(px+6,py+4+w,2,1,'#ffd9a0');
 R(px+3,py+12,10,1,D[3])}
// shared sand splash puff, t in [0,1] (box sinking & robot sinking)
function sandSplash(px,py,t){const k=Math.min(3,Math.floor(t*4)),sp=[2,4,6,7][k],c=[E32.sand,E32.tan,E32.orange1,E32.orange1][k];
 o.globalAlpha=k===3?.5:1;[[-1,-1],[1,-1],[-1.4,0],[1.4,0],[0,-1.4]].forEach(([a,b])=>R(px+7+Math.round(a*sp),py+9+Math.round(b*sp),2,2,c));
 R(px+5,py+10,6,2,c);o.globalAlpha=1}
// box sinking into quicksand, t in [0,1]: crate drops, splash, ends on sandBridge (call sandBridge after t>=1)
function boxSink(px,py,t){quicksand(px,py,0);const d=Math.round(Math.min(1,t/.7)*12);
 o.save();o.beginPath();o.rect(px,py,16,14);o.clip();if(typeof crate==='function')crate(px,py+d,false,0);o.restore();
 if(t>.5){o.globalAlpha=Math.min(1,(t-.5)*2);sandBridge(px,py);o.globalAlpha=1}sandSplash(px,py,t)}
// robot quicksand fail: t in [0,1] s, 4 frames (sink / head+antenna / blink+wave / splash). Engine pauses bombs & dunes meanwhile.
function robotQuicksand(px,py,t){const f=Math.min(3,Math.floor(t*4));quicksand(px,py,Math.floor(t*4)%2);
 const d=[4,9,9,12][f];o.save();o.beginPath();o.rect(px,py-6,16,6+10);o.clip();
 if(typeof robot==='function')robot(px,py+d,'x','down',0,0,f===3?.6:1);o.restore();
 if(f===2&&Math.floor(t*16)%2)R(px+6,py+d-1,4,4,E32.red3);                     // panic blink on antenna bulb
 if(f===2){const wv=Math.floor(t*12)%2;R(px+12,py+6-wv*2,2,4,E32.white);R(px+13,py+4-wv*2,2,2,E32.white)} // waving hand
 R(px+1,py+10,14,2,DESERT_THEME.quick[1]);if(f>=2)sandSplash(px,py,(t-.5)*2)}
// 沙蟲王 boss: 2x2 (32x32). frame 0/1 sway, hit=true -> white flash, hp/max pips above.
function sandwormKing(px,py,frame,hit,hp,max){const O=DESERT_THEME.outline,B=hit?E32.white:E32.sand,S=hit?E32.grey1:'#cfb58c',HL=hit?E32.white:'#f3e2c0',sw=frame?1:0;
 R(px+1,py+26,30,5,DESERT_THEME.quick[1]);R(px+3,py+25,24,7,DESERT_THEME.quick[1]);R(px+5,py+27,20,2,DESERT_THEME.quick[0]); // sand ring
 const disc=(cx,cy,rx,ry,col)=>{for(let j=-ry;j<=ry;j++){const w=Math.round(rx*Math.sqrt(1-(j*j)/((ry+.5)*(ry+.5))));R(px+cx-w,py+cy+j,w*2,1,col)}};
 // C/S-curve: base leans left, middle bulges right, head tilts forward-left; tapering segments
 const seg=[[12,25,7,3],[16,21,7,3],[19+sw,17,6,3],[19+sw,13,6,3],[16+sw,9,5,3]];
 seg.forEach(([x,y,rx,ry])=>disc(x,y,rx+1,ry+1,O));
 seg.forEach(([x,y,rx,ry])=>{disc(x,y,rx,ry,B);R(px+x-rx+2,py+y+ry-1,rx*2-4,1,S);R(px+x-rx+2,py+y-ry+1,3,1,HL)});
 // head tilted forward (left), big
 const hx=10+sw,hy=7;disc(hx,hy,8,6,O);disc(hx,hy,7,5,B);R(px+hx-4,py+hy-4,4,1,HL);
 // round mouth on the front-low side with teeth ring
 disc(hx-3,hy+3,3,2,O);disc(hx-3,hy+3,2,1,E32.plum);[[-5,3],[-3,1],[-1,3],[-3,5]].forEach(([a,b])=>R(px+hx+a,py+hy+b,1,1,E32.white));
 // two big eyes with angry brows
 [[-4,-2],[2,-2]].forEach(([a,b])=>{R(px+hx+a,py+hy+b,4,4,E32.ink);R(px+hx+a+1,py+hy+b,2,4,E32.white);R(px+hx+a,py+hy+b+1,4,2,E32.white);R(px+hx+a+(a<0?0:1)+1,py+hy+b+1,2,2,E32.ink)});
 R(px+hx-5,py+hy-4,2,1,E32.ink);R(px+hx-3,py+hy-3,2,1,E32.ink);R(px+hx+4,py+hy-4,2,1,E32.ink);R(px+hx+2,py+hy-3,2,1,E32.ink);
 hpPips(px+16,py-6,hp,max)}
function hpPips(cx,y,hp,max){const w=max*4;R(cx-w/2-1,y-1,w+1,5,E32.ink);for(let i=0;i<max;i++)R(cx-w/2+i*4,y,3,3,i<hp?E32.red3:E32.grey4)}
// boarded "即將開放" tunnel mouth (same wood as the rune-stone sign / minimap)
function boardedTunnel(px,py){R(px,py,16,16,E32.ink);R(px+2,py+2,12,14,E32.plum);
 [[3],[8],[12]].forEach(([b])=>{R(px,py+b,16,3,E32.brown2);R(px,py+b,16,2,E32.brown1);R(px+1,py+b,6,1,E32.tan);R(px+2,py+b+1,1,1,E32.grey2);R(px+13,py+b+1,1,1,E32.grey2)})}
function comingSoonSign(px,py){R(px+7,py+9,2,6,E32.brown2);R(px+2,py+2,12,8,E32.plum);R(px+3,py+3,10,6,E32.brown1);R(px+3,py+3,10,1,E32.tan);
 [[4,5,6],[4,7,4],[9,7,3]].forEach(([a,b,w])=>R(px+a,py+b,w,1,E32.brown2))}
// robot soft cyan shadow (draw BEFORE robot); helps on white snow / light sand
function robotShadow(px,py){o.globalAlpha=.3;R(px+1,py+14,14,3,E32.cyan);R(px+3,py+13,10,5,E32.cyan);o.globalAlpha=.45;R(px+3,py+14,10,3,E32.cyan);R(px+5,py+15,6,1,E32.blue2);o.globalAlpha=1}
if(typeof module!=='undefined')module.exports={DESERT_THEME,desertSand,desertRock,desertCactus,desertBone,quicksand,sandBridge,dune,sandSplash,boxSink,robotQuicksand,sandwormKing,hpPips,boardedTunnel,comingSoonSign,robotShadow};
