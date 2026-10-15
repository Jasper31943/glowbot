// Ice map (冰原) art for big-map mode. Loaded by world.html after art.js (source draft: tools/ice-art-draft.js).
// Same conventions as art.js: 16x16 tiles, R(x,y,w,h,color) on ctx `o`, Endesga 32 colours (E32), hash(x,y,i) for per-tile variation.
// Palette goal: bright like grass. White snow floor, light-blue ice, dark-blue hard ice with diamonds, snowy rock walls, snowy pines outside the map.
const ICE_THEME={name:'冰原',style:'ice',
 snow:[E32.white,E32.grey1,'#dfe8f2'],             // floor base / speckle / soft shade
 ice:[E32.cyan,E32.blue2,E32.white,'#9fe9f5'],      // normal ice I: light blue + white glints
 hard:[E32.blue1,E32.navy,E32.blue2,E32.cyan],      // hard ice J: dark blue, diamond lattice
 rock:[E32.grey1,E32.grey2,E32.grey3,E32.white],    // snowy rock wall, white snow cap
 pine:[E32.green3,E32.teal,E32.white,E32.brown2],
 outline:E32.grey3};                               // softer outline than grass (keeps it bright)
const IH=(x,y,i)=>{const h=Math.sin(x*127.1+y*311.7+i*74.7)*43758.5453;return h-Math.floor(h)};
function iceSnow(px,py,x,y){const S=ICE_THEME.snow;R(px,py,16,16,S[0]);
 for(let i=0;i<4;i++)R(px+1+Math.floor(IH(x,y,i)*14),py+1+Math.floor(IH(x,y,i+7)*14),2,1,S[1]);
 if(IH(x,y,20)<.25)R(px+3+Math.floor(IH(x,y,21)*9),py+10,4,1,S[2])}
function iceNormal(px,py,x,y){const I=ICE_THEME.ice;R(px,py,16,16,I[3]);R(px,py+12,16,4,I[0]);
 R(px+2,py+3,5,1,I[2]);R(px+3,py+4,2,1,I[2]);R(px+10,py+9,3,1,I[2]);R(px,py+15,16,1,I[1])}
function iceHard(px,py,x,y){const J=ICE_THEME.hard;R(px,py,16,16,J[0]);
 // diamond lattice: one full diamond centred + quarter diamonds in corners
 for(let i=0;i<8;i++){R(px+8-i,py+i,1,1,J[2]);R(px+7+i,py+i,1,1,J[2]);R(px+8-i,py+15-i,1,1,J[2]);R(px+7+i,py+15-i,1,1,J[2])}
 R(px+6,py+6,4,4,J[1]);R(px+7,py+7,2,2,J[3]);
 const t=(typeof T==='number'?T:0);if(((t*2+x*3+y*5)|0)%7===0)R(px+3,py+3,1,1,E32.white)} // occasional sparkle
function iceRock(px,py,x,y,snowTop){const K=ICE_THEME.rock;R(px,py,16,16,ICE_THEME.outline);R(px+1,py+1,14,14,K[0]);
 R(px+1,py+8,14,1,K[1]);R(px+8,py+1,1,7,K[1]);R(px+4,py+9,1,6,K[1]);R(px+1,py+14,14,1,K[1]);R(px+12,py+11,2,2,K[2]);
 if(snowTop){R(px,py,16,4,K[3]);R(px+2,py+4,4,1,K[3]);R(px+9,py+4,5,1,K[3]);R(px+11,py+5,2,1,K[3])}} // white snow on the top row of a wall mass
function icePine(px,py,x,y){iceSnow(px,py,x,y);const P=ICE_THEME.pine,o=Math.floor(IH(x,y,3)*3)-1;
 R(px+7+o,py+12,2,3,P[3]);
 [[7,1,2],[6,3,4],[5,5,6],[4,7,8],[3,9,10]].forEach(([a,b,w])=>R(px+a+o,py+b,w,2,P[0]));
 R(px+6+o,py+3,2,1,P[2]);R(px+4+o,py+7,3,1,P[2]);R(px+9+o,py+5,2,1,P[2]);R(px+3+o,py+11,10,1,P[1])}
// --- snowball patrol monster (tile 'P' in ice.txt). frame 0/1 bounce; dir 0 up 1 down 2 left 3 right.
// Light grey-blue outline so the white/cyan robot stays the most visible thing on screen.
function snowball(px,py,frame,dir,spotted){const OL=E32.grey2,B=E32.white,SH=E32.grey1,EY=E32.ink,BL=E32.blue2;
 const b=frame?1:0,sq=frame?1:0;           // bounce: frame 1 squashes 1px
 const y0=py+3+b,rows=sq?[4,8,10,12,12,12,12,10,6]:[4,8,10,12,12,12,12,12,10,6];  // round body, row widths
 rows.forEach((w,j)=>R(px+8-w/2-1,y0+j-1,w+2,1,OL));R(px+8-2-1,y0+rows.length-1,6,1,OL);
 rows.forEach((w,j)=>R(px+8-w/2,y0+j,w,1,j>=rows.length-2?SH:B));R(px+5,y0+1,2,1,E32.white);R(px+4,y0+2,1,2,E32.white);
 const ex=dir===2?-2:dir===3?2:0,ey=dir===0?-1:dir===1?1:0;      // eyes look where it walks
 if(dir!==0){R(px+5+ex,y0+4+ey,2,2,EY);R(px+9+ex,y0+4+ey,2,2,EY);R(px+5+ex,y0+4+ey,1,1,E32.white);R(px+9+ex,y0+4+ey,1,1,E32.white)}
 else{R(px+5,y0+2,6,1,SH)}                                       // walking away: no face, just a highlight
 if(dir!==0){R(px+3+ex,y0+7,2,1,BL);R(px+11+ex,y0+7,2,1,BL)}     // blue blush
 R(px+4,py+14,3,1,OL);R(px+9,py+14,3,1,OL);if(frame){R(px+3,py+14,3,1,OL)}else{R(px+10,py+14,3,1,OL)} // little feet alternate
 if(spotted){R(px+7,py-6,3,7,E32.ink);R(px+8,py-5,1,3,E32.amber);R(px+8,py-1,1,1,E32.amber)}}    // '!' when it spots the robot
// defeat: t in [0,1.6] s. 0–0.8 dizzy with three yellow spinning stars; 0.8–1.6 turns into a snow bunny that hops away (no pixel shatter).
function snowballDefeat(px,py,t,awayDir){
 if(t<.8){snowball(px,py,0,1,false);R(px+5,py+7,2,2,E32.grey1);R(px+9,py+7,2,2,E32.grey1); // closed swirly eyes
  for(let i=0;i<3;i++){const a=t*9+i*2.094;R(px+7+Math.round(Math.cos(a)*6),py+1+Math.round(Math.sin(a)*2),2,2,E32.yellow);R(px+7+Math.round(Math.cos(a)*6),py+1+Math.round(Math.sin(a)*2),1,1,E32.white)}
  return}
 const k=(t-.8)/.8,dx=(awayDir===2?-1:1)*Math.round(k*24),hop=Math.round(Math.abs(Math.sin(k*Math.PI*3))*4);
 if(k<.2){const g=Math.round(k*20);[[2,7],[9,5],[6,10],[11,10],[4,3]].forEach(([a,c])=>{R(px+a-1-g,py+c-1,6+g,6,E32.grey2);R(px+a-g,py+c,4+g,4,E32.grey1);R(px+a-g,py+c,2,1,E32.white)});return} // grey-blue puff, visible on snow
 snowBunny(px+dx,py-hop,awayDir===2)}
function snowBunny(px,py,flip){const OL=E32.grey2,W=E32.white,P=E32.pink;const X=a=>flip?px+15-a:px+a;const r=(a,b,w,h,c)=>R(flip?px+16-a-w:px+a,py+b,w,h,c);
 r(5,2,2,6,OL);r(8,2,2,6,OL);r(6,3,1,4,P);r(9,3,1,4,P);           // ears
 r(4,7,8,7,OL);r(5,8,6,5,W);r(11,10,2,2,W);r(12,9,1,1,OL);        // body + tail
 r(6,9,1,1,E32.ink);r(5,11,1,1,P)}
// world.js uses these for theme 'snow'
if(typeof module!=='undefined')module.exports={ICE_THEME,iceSnow,iceNormal,iceHard,iceRock,icePine,snowball,snowballDefeat,snowBunny};
