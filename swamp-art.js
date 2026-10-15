// Swamp map (沼澤) art. Load after art.js (+ desert-art.js for sandSplash-style helpers not required). 16x16, R() on `o`, Endesga 32.
// Lily pads: safe = bright green + flower; sinking = yellowed + bubble ripples (shape stays the same so it's fair, colour+ripples differ).
const SWAMP_THEME={name:'沼澤',style:'swamp',
 water:['#3f9483','#367f71','#2a6a5c','#9fd8c4'],     // base / mid / dark / ripple highlight
 mud:['#948f45','#7a7539','#b0aa58'],                  // olive ground / shade / light
 reed:[E32.green2,E32.green3,E32.brown2,E32.brown1],
 pad:[E32.green1,E32.green2,E32.pink,E32.yellow],
 padSink:['#b7b04a','#8c8a3a',E32.orange1],
 outline:E32.ink};
const SH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
function swampWater(px,py,x,y,frame){const W=SWAMP_THEME.water;R(px,py,16,16,W[0]);R(px,py+10,16,6,W[1]);
 const f=frame?2:0;R(px+2+f,py+4,4,1,W[3]);R(px+9-f,py+11,5,1,W[3]);if(SH(x,y,1)<.3)R(px+11,py+6,1,1,W[3])}
function swampMud(px,py,x,y){const M=SWAMP_THEME.mud;R(px,py,16,16,M[0]);
 for(let i=0;i<4;i++)R(px+1+Math.floor(SH(x,y,i)*13),py+1+Math.floor(SH(x,y,i+5)*13),3,1,M[1]);
 for(let i=0;i<2;i++)R(px+2+Math.floor(SH(x,y,i+9)*12),py+2+Math.floor(SH(x,y,i+11)*12),1,1,M[2])}
// reeds / cattails: blocking decoration on mud
function swampReeds(px,py,x,y,frame){swampMud(px,py,x,y);const D=SWAMP_THEME.reed,sw=frame?1:0;
 [[3,3],[7,1],[11,4]].forEach(([a,b],i)=>{const s=i===1?sw:0;R(px+a+s,py+b+4,1,12-b,D[0]);R(px+a+s,py+b,2,5,D[2]);R(px+a+s,py+b,1,4,D[3]);R(px+a+s,py+b-1,1,1,D[1])});
 R(px+1,py+13,3,3,D[1]);R(px+12,py+12,3,4,D[0]);R(px+5,py+11,2,5,D[1])}
// lily pad over water. sinking=true -> yellowed with bubble ripples; sinkT 0..1 = how far it has sunk after you stepped on it
function lilyPad(px,py,x,y,frame,sinking,sinkT){swampWater(px,py,x,y,frame);const P=sinking?SWAMP_THEME.padSink:SWAMP_THEME.pad,O=SWAMP_THEME.outline;
 const d=Math.round((sinkT||0)*4);o.globalAlpha=1-(sinkT||0)*.7;
 R(px+2,py+3+d,12,10,SWAMP_THEME.water[2]);R(px+3,py+2+d,10,12,SWAMP_THEME.water[2]);
 R(px+3,py+3+d,10,10,P[0]);R(px+2,py+4+d,12,8,P[0]);R(px+8,py+4+d,1,4,P[1]);R(px+8,py+7+d,5,1,P[1]);R(px+9,py+3+d,4,3,SWAMP_THEME.water[0]); // notch
 o.globalAlpha=1;
 if(!sinking){R(px+4,py+5+d,3,3,SWAMP_THEME.pad[2]);R(px+5,py+6+d,1,1,SWAMP_THEME.pad[3])}               // flower = safe
 else{const f=frame?1:0;R(px+1,py+14-f,2,2,SWAMP_THEME.water[3]);R(px+13,py+1+f,2,2,SWAMP_THEME.water[3]);R(px+4,py+8,1,1,P[2]);R(px+11,py+11,1,1,P[2]); // bubbles + brown spots
  R(px,py+14,16,1,SWAMP_THEME.water[3])}}
function swampBubbles(px,py,t){const k=Math.min(3,Math.floor(t*4)),W=SWAMP_THEME.water;o.globalAlpha=k===3?.5:1;
 const r=[2,4,6,7][k];R(px+8-r,py+10,r*2,1,W[3]);R(px+8-r+1,py+12,r*2-2,1,W[3]);[[3,-k*2],[11,-k*2-1],[7,-k*3]].forEach(([a,b])=>R(px+a,py+8+b,2,2,W[3]));o.globalAlpha=1}
// robot sinking in swamp water: t 0..1, 4 frames (same beats as robotQuicksand)
function robotSwampSink(px,py,x,y,t){const f=Math.min(3,Math.floor(t*4));swampWater(px,py,x,y,f%2);
 const d=[4,9,9,12][f];o.save();o.beginPath();o.rect(px,py-6,16,16);o.clip();if(typeof robot==='function')robot(px,py+d,'x','down',0,0,f===3?.6:1);o.restore();
 if(f===2&&Math.floor(t*16)%2)R(px+6,py+d-1,4,4,E32.red3);
 if(f===2){const wv=Math.floor(t*12)%2;R(px+12,py+6-wv*2,2,4,E32.white)}
 R(px+1,py+10,14,1,SWAMP_THEME.water[3]);if(f>=1)swampBubbles(px,py,(t-.25)/.75)}
if(typeof module!=='undefined')module.exports={SWAMP_THEME,swampWater,swampMud,swampReeds,lilyPad,swampBubbles,robotSwampSink};
// ---- 泥巴蛙王 mini-boss: 1 tile, draws up to 8px above (py-8..py+16). dir 2=left,3=right. hit 0..2
function mudFrogKing(px,py,frame,dir,hit,t){const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c);
 const O=E32.ink,G=E32.green1,D=E32.green2,B=E32.sand,M=E32.brown1,up=frame?-5:0;
 if(frame)r(3,14,10,2,E32.teal);else r(1,14,14,2,E32.teal); // shadow stays on ground
 const y=up;
 // legs
 if(frame){r(-3,10+y,5,3,O);r(-2,11+y,3,1,D);r(-4,12+y,3,4,O);r(-3,13+y,1,2,D);r(14,10+y,5,3,O);r(15,11+y,3,1,D);r(17,12+y,3,4,O);r(18,13+y,1,2,D)}else{r(-1,11,5,5,O);r(0,12,4,3,D);r(12,11,5,5,O);r(13,12,3,3,D)}
 // body
 r(1,3+y,14,11,O);r(2,4+y,12,9,G);r(0,6+y,16,6,O);r(1,7+y,14,4,G);r(4,8+y,8,5,B);r(5,12+y,6,1,B);
 r(3,5+y,2,1,E32.yellow);r(10,6+y,2,2,M);r(4,11+y,2,1,M); // highlight + mud spots
 // eyes bulging on top
 [[2,0],[9,0]].forEach(([a,b])=>{r(a,b+y,5,5,O);r(a+1,b+1+y,3,3,E32.white);r(a+2,b+2+y,2,2,O)});
 r(2,0+y,5,1,O);r(9,0+y,5,1,O);r(3,1+y,2,1,D);r(10,1+y,2,1,D); // angry lids
 r(4,6+y,8,1,O);r(5,7+y,1,1,E32.red3); // mouth + tongue
 // crown (above tile)
 r(4,-6+y,8,6,O);r(5,-3+y,6,3,E32.amber);r(5,-5+y,1,2,E32.amber);r(7,-6+y,2,3,E32.amber);r(10,-5+y,1,2,E32.amber);r(7,-2+y,2,1,E32.red3);r(5,-3+y,1,1,E32.yellow);
 if(hit>=1){r(11,4+y,1,3,O);r(12,6+y,1,2,O);r(2,9+y,2,1,M)} // crack + soot
 if(hit>=2){r(3,5+y,1,3,O);r(4,7+y,1,2,O);r(8,-6+y,1,2,O);r(11,9+y,2,2,M);r(14,-1+y,1,1,E32.grey2);r(15,-2+y,1,1,E32.grey2)}
 if(hit&&(t*6|0)%2)r(1,3+y,14,1,E32.white)}
function mudFrogKingDefeat(px,py,t,awayDir){
 if(t<.8){mudFrogKing(px,py,0,awayDir===2?3:2,2,0);R(px+4,py+2,2,2,E32.ink);R(px+11,py+2,2,2,E32.ink);
  for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py-9+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)}return}
 const k=Math.min(1,(t-.8)/.8);if(k<.2){[[3,8],[9,6],[6,11]].forEach(([a,c])=>{R(px+a-1,py+c-1,6,6,E32.green3);R(px+a,py+c,4,4,E32.green1)});return}
 smallFrog(px+(awayDir===2?-1:1)*Math.round(k*24),py-Math.round(Math.abs(Math.sin(k*Math.PI*3))*4),awayDir===2)}
function smallFrog(px,py,fl){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 r(4,8,8,6,O);r(5,9,6,4,E32.green1);r(4,6,3,3,O);r(9,6,3,3,O);r(5,7,1,1,E32.white);r(10,7,1,1,E32.white);r(6,11,4,2,E32.sand);r(3,12,2,2,O);r(11,12,2,2,O)}
if(typeof module!=='undefined')Object.assign(module.exports,{mudFrogKing,mudFrogKingDefeat,smallFrog});
