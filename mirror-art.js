// Mirror maze (鏡子迷宮) art. Load after art.js. 16x16, R() on `o`, Endesga 32. Lilac/silver, bright baseline.
const MIRROR_THEME={name:'鏡子迷宮',style:'mirror',
 floor:['#c9c3e6','#b5aed8','#ddd8f2'],wall:[E32.purple||'#68386c','#8a6fb8','#a995d6',E32.ink],
 glass:['#d6f2fa',E32.grey1,E32.white,E32.grey2],beam:[E32.yellow,E32.amber],outline:E32.ink};
const MIH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
function mirrorFloor(px,py,x,y){const F=MIRROR_THEME.floor;R(px,py,16,16,(x+y)%2?F[0]:F[2]);R(px,py+15,16,1,F[1]);R(px+15,py,1,16,F[1])}
function mirrorWall(px,py,x,y){const W=MIRROR_THEME.wall;R(px,py,16,16,W[1]);R(px,py,16,3,W[2]);R(px+2,py+5,12,8,W[2]);R(px+3,py+6,10,6,MIRROR_THEME.glass[0]);R(px+4,py+7,3,1,E32.white);R(px,py+15,16,1,W[3])}
// mirror: kind '/' or '\\'. t for glint sweep
function mirror(px,py,kind,t){const G=MIRROR_THEME.glass;R(px+6,py+13,4,2,E32.grey3);
 for(let i=0;i<12;i++){const xx=kind==='/'?px+13-i:px+2+i,yy=py+1+i;R(xx-1,yy,3,1,E32.grey3);R(xx,yy,2,1,G[0])}
 const g=Math.floor(((t||0)*6)%16);if(g<12){const xx=kind==='/'?px+13-g:px+2+g;R(xx,py+1+g,2,1,G[2])}}
// light/fire beam segment through a tile: axis 'h'|'v', color 'light'|'fire'
function beam(px,py,axis,color,t){const c=color==='fire'?[E32.orange,E32.red3]:[E32.yellow,E32.amber],p=Math.floor((t||0)*10)%4;
 if(axis==='h'){R(px,py+6,16,4,c[1]);R(px,py+7,16,2,c[0]);for(let i=p;i<16;i+=4)R(px+i,py+7,1,2,E32.white)}else{R(px+6,py,4,16,c[1]);R(px+7,py,2,16,c[0]);for(let i=p;i<16;i+=4)R(px+7,py+i,2,1,E32.white)}}
// light receiver / target: lit bool
function lightTarget(px,py,lit){R(px+2,py+2,12,12,E32.ink);R(px+3,py+3,10,10,lit?E32.amber:'#9a7a3c');R(px+5,py+5,6,6,lit?E32.yellow:E32.grey2);R(px+7,py+7,2,2,lit?E32.white:E32.grey4)}
// light door ▤: open=false solid shutter, open=true recessed glowing frame
function lightDoor(px,py,open,t){R(px,py,16,16,E32.ink);R(px+1,py+1,14,14,E32.grey3);
 if(open){R(px+3,py+2,10,12,E32.navy);R(px+4,py+3,8,10,E32.yellow);o.globalAlpha=.4;R(px+5,py+4,6,8,E32.white);o.globalAlpha=1}
 else{R(px+2,py+2,12,12,E32.purple);R(px+3,py+3,10,10,E32.grey2);R(px+4,py+4,8,8,'#8a6fb8');for(const bx of [4,7,10])R(px+bx,py+3,2,10,E32.ink)}} // closed: shutter bars (no amber dot, so it no longer looks like a lamp/target)
// ---- 鏡影王 ¶: 16x16 (crown +2 above). frame 0/1 mirror-step, dir 2/3, hit 0..1 (2 HP), flash
// v2 contrast: 1px grey4 halo outside the ink line + soft navy floor shadow so it pops on the pale lilac floor;
// body toned slightly cool and no pure-white highlights (小光 stays the brightest thing on screen).
const MK_DIAMOND=[[7,0,2],[5,1,6],[3,2,10],[2,3,12],[1,4,14],[1,5,14],[1,6,14],[1,7,14],[1,8,14],[2,9,12],[3,10,10],[4,11,8],[5,12,6],[6,13,4]],
 MK_CROWN=[[2,-3],[5,-5],[8,-4],[11,-3]];
function mirrorKing(px,py,frame,dir,hit,t,flash){const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink,f=frame?1:0;
 const B=flash?E32.white:'#d3e9f4',B2=flash?E32.grey1:'#9ec4dc',P=flash?E32.white:E32.purple,HL=flash?E32.white:'#eef8fc',HA=E32.grey4;
 // soft dark floor shadow (two stacked alphas = rounded ellipse)
 o.globalAlpha=.28;r(1,14,14,3,E32.navy);o.globalAlpha=.3;r(3,15,10,2,E32.navy);o.globalAlpha=1;
 // silhouette rects (ink layer); halo = same rects grown 1px in grey4, drawn first
 const sil=[...MK_DIAMOND.map(([a,b,w])=>[a,b+f,w,1]),...MK_CROWN.map(([a,b])=>[a,b+f,3,5]),[3,14-f,4,2+f],[9,13+f,4,3-f]];
 sil.forEach(([a,b,w,h])=>r(a-1,b-1,w+2,h+2,HA));
 sil.forEach(([a,b,w,h])=>r(a,b,w,h,O));
 // tall diamond crystal body
 [[7,1,2],[5,2,6],[3,3,10],[2,4,12],[2,5,12],[2,6,12],[2,7,12],[2,8,12],[3,9,10],[4,10,8],[5,11,6],[6,12,4]].forEach(([a,b,w])=>{r(a,b+f,w,1,B)});
 r(3,3+f,3,1,HL);r(2,5+f,2,3,HL);r(2,5+f,1,2,B2);
 r(1,4+f,1,5,P);r(14,4+f,1,5,P);
 // mismatched eyes: cyan left, magenta right (mirror self)
 r(3,5+f,4,4,O);r(4,6+f,2,2,E32.cyan);r(4,6+f,1,1,HL);
 r(9,5+f,4,4,O);r(10,6+f,2,2,E32.magenta);r(10,6+f,1,1,HL);
 r(5,10+f,6,1,O);r(6,9+f,4,1,P);
 // jagged shard crown
 MK_CROWN.forEach(([a,b],i)=>{r(a+1,b+1+f,1,3,i%2?HL:B);r(a+1,b+f,1,1,P)});
 // crystal feet
 r(3,14-f,4,2+f,O);r(9,13+f,4,3-f,O);r(4,14-f,2,1,B2);r(10,13+f,2,1,B2);
 if(hit>=1){r(8,3+f,1,5,O);r(9,5+f,2,1,O);r(11,4+f,1,4,O);r(4,11+f,2,1,P);r(12,2+f,1,1,P)}}
function glassBuddy(px,py,fl){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 [[7,4,2],[5,5,6],[4,6,8],[4,7,8],[5,8,6],[6,9,4]].forEach(([a,b,w])=>r(a,b,w,1,O));
 [[7,5,2],[5,6,6],[5,7,6],[6,8,4]].forEach(([a,b,w])=>r(a,b,w,1,'#e8f6fc'));
 r(5,6,2,1,E32.white);r(6,7,1,1,E32.cyan);r(9,7,1,1,E32.magenta);r(3,4,2,2,O);r(11,4,2,2,O);r(4,4,1,1,'#e8f6fc');r(11,4,1,1,E32.white)}
function mirrorKingDefeat(px,py,t,awayDir){const O=E32.ink;
 if(t<.8){mirrorKing(px,py,0,awayDir===2?3:2,1,0,false);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py+-6+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)};return}
 const k=Math.min(1,(t-.8)/.8);
 [[-1,-1],[1,-1],[0,-1.5],[-1.2,1],[1.2,1],[0,1.4]].forEach(([dx,dy],i)=>{const x=px+6+Math.round(dx*k*16),y=py+5+Math.round(dy*k*12+k*k*10);R(x-1,y-1,4,4,O);R(x,y,2,2,i%2?'#d6f2fa':E32.purple);R(x,y,1,1,E32.white)});
 if(k>.35)glassBuddy(px+(awayDir===2?-1:1)*Math.round((k-.35)/.65*24),py-((t*10|0)%2),awayDir===2)}
if(typeof module!=='undefined')module.exports={MIRROR_THEME,mirrorFloor,mirrorWall,mirror,beam,lightTarget,lightDoor,mirrorKing,mirrorKingDefeat,glassBuddy};

