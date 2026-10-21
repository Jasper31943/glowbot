// Night factory (夜晚工廠) art. Load after art.js. 16x16, Endesga 32. Night but readable: mid blue-violet, neon accents.
const FACTORY_THEME={name:'夜晚工廠',style:'factory',floor:['#5a5f8a','#4a4e78','#6e74a2'],wall:['#3e3a66',E32.plum,E32.magenta,E32.ink],
 belt:[E32.grey4,E32.grey3,E32.amber],neon:[E32.magenta,E32.pink],outline:E32.ink};
function factoryFloor(px,py,x,y){const F=FACTORY_THEME.floor;R(px,py,16,16,F[0]);R(px,py,16,1,F[2]);R(px,py,1,16,F[2]);R(px,py+15,16,1,F[1]);if((x*3+y)%5===0)R(px+4,py+7,8,1,F[1])}
function factoryWall(px,py,x,y,t){const W=FACTORY_THEME.wall;R(px,py,16,16,W[0]);R(px+1,py+1,14,6,W[1]);R(px+2,py+2,5,4,'#2c2a50');R(px+9,py+2,5,4,'#2c2a50');
 o.globalAlpha=.7+.3*Math.sin((t||0)*4+x);R(px,py+10,16,1,W[2]);R(px,py+11,16,1,FACTORY_THEME.neon[1]);o.globalAlpha=1;R(px,py+14,16,2,W[3])}
// conveyor: dir 0..3, frame 0..3 scroll (one step per player step if engine prefers)
function conveyor(px,py,dir,frame){const B=FACTORY_THEME.belt,hz=dir>=2,fw=dir===1||dir===3,s=(frame||0)*4;
 if(hz){R(px,py+2,16,12,E32.ink);R(px,py+3,16,10,B[0]);for(let i=0;i<16;i+=4){const q=((fw?i+s:i-s)%16+16)%16;R(px+q,py+3,1,10,B[1])}}
 else{R(px+2,py,12,16,E32.ink);R(px+3,py,10,16,B[0]);for(let i=0;i<16;i+=4){const q=((fw?i+s:i-s)%16+16)%16;R(px+3,py+q,10,1,B[1])}}
 // amber chevron pointing along the belt
 for(let j=0;j<4;j++){const d=fw?j:3-j;
  if(hz){R(px+6+d,py+4+j,2,1,B[2]);R(px+6+d,py+11-j,2,1,B[2])}else{R(px+4+j,py+6+d,1,2,B[2]);R(px+11-j,py+6+d,1,2,B[2])}}}
// glitched robot enemy: frame 0/1; glitch offsets rows; spotted '!'
function glitchBot(px,py,frame,spotted,t){const g=Math.floor((t||0)*12)%5===0;const sh=g?(frame?2:-2):0;
 R(px+3,py+3,10,11,E32.ink);R(px+4,py+4,8,9,E32.grey3);R(px+4+sh,py+6,8,4,E32.navy);R(px+5+sh,py+7,2,2,E32.magenta);R(px+9+sh,py+7,2,2,E32.magenta);
 R(px+7,py+1,2,2,E32.grey4);R(px+7,py,2,1,frame?E32.red3:E32.magenta);R(px+4,py+14,3,2,E32.ink);R(px+9,py+14,3,2,E32.ink);
 if(g){o.globalAlpha=.6;R(px+2,py+8,12,1,E32.cyan);R(px+5,py+11,8,1,E32.magenta);o.globalAlpha=1}
 if(spotted){R(px+7,py-7,3,7,E32.ink);R(px+8,py-6,1,3,E32.amber);R(px+8,py-2,1,1,E32.amber)}}
// defeat t 0..1.6: sparks, screen reboots to a smile (friendly bot)
function glitchBotDefeat(px,py,t){if(t<.8){glitchBot(px,py,Math.floor(t*10)%2,false,t);for(let i=0;i<3;i++){const a=t*9+i*2.094;R(px+7+Math.round(Math.cos(a)*6),py-1+Math.round(Math.sin(a)*2),2,2,E32.yellow)}return}
 R(px+3,py+3,10,11,E32.ink);R(px+4,py+4,8,9,E32.grey1);R(px+4,py+6,8,4,E32.navy);R(px+5,py+7,1,1,E32.green1);R(px+10,py+7,1,1,E32.green1);R(px+6,py+8,4,1,E32.green1);R(px+7,py,2,1,E32.green1);R(px+4,py+14,3,2,E32.ink);R(px+9,py+14,3,2,E32.ink)}
// ---- 故障機王 ¥: 16x20 (extends ~4px up). Enlarged corrupted machine (NOT 小光-like). frame 0/1 walk, dir 2/3,
// hit 0..2 (3 HP), spotted "!", flash. Defeat -> friendlyBot (smiling reboot buddy, same spirit as glitchBotDefeat).
function glitchKing(px,py,frame,dir,hit,spotted,flash){const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink,f=frame?1:0;
 const B=flash?E32.white:E32.grey4,B2=flash?E32.grey1:'#2c2a50',M=flash?E32.white:E32.magenta,P=flash?E32.white:E32.pink,C=flash?E32.white:E32.cyan;
 o.globalAlpha=.45;r(0,14,16,2,E32.plum);o.globalAlpha=1;
 // wide industrial chassis (crate/press look — not a biped robot)
 r(0,5+f,16,9,O);r(1,6+f,14,7,B);r(1,6+f,14,2,B2);r(2,8+f,12,4,B);
 // neon hazard stripes
 r(1,12+f,14,1,M);r(2,12+f,2,1,E32.yellow);r(6,12+f,2,1,E32.yellow);r(10,12+f,2,1,E32.yellow);
 // corrupt display panel (static bars, mismatched — never white body)
 r(4,7+f,8,4,O);r(5,8+f,6,2,E32.navy);
 if(f){r(5,8+f,2,1,M);r(8,9+f,3,1,C)}else{r(5,8+f,4,1,C);r(7,9+f,2,1,M)}
 r(5,8+f,1,1,P);r(10,8+f,1,1,C); // glitch "eyes" as pixels only
 // smokestack / vent crown (not antenna bulb)
 r(6,1,4,5,O);r(7,2,2,3,B2);r(7,0+f,2,2,Math.floor((hit||0)+f)%2?E32.red3:M);r(5,2,1,2,O);r(10,2,1,2,O);
 // piston arms / claws
 r(-4,6+f,5,4,O);r(-3,7+f,3,2,B);r(-5,9+f,4,4,O);r(-4,10+f,2,2,M);r(-3,11+f,1,1,P);
 r(15,6+f,5,4,O);r(16,7+f,3,2,B);r(17,9+f,4,4,O);r(18,10+f,2,2,C);r(18,11+f,1,1,P);
 // tread feet
 r(1,14-f,6,2+f,O);r(2,14-f,4,1,B);r(9,13+f,6,3-f,O);r(10,13+f,4,1,B);
 o.globalAlpha=.5;r(2,10+f,12,1,C);r(3,8+f,10,1,M);o.globalAlpha=1;
 if(hit>=1){r(11,6+f,1,3,O);r(3,9+f,2,1,O);r(13,4+f,1,1,M)}
 if(hit>=2){r(7,2,1,2,O);r(5,8+f,1,2,O);r(12,8+f,1,2,O);r(-2,5,1,1,C);r(17,5,1,1,M);r(8,0,1,1,E32.yellow)}
 if(spotted){R(px+6,py-11,5,9,O);R(px+7,py-10,3,5,E32.amber);R(px+7,py-4,3,1,E32.amber)}}
function friendlyBot(px,py,fl){const r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink;
 r(4,4,8,10,O);r(5,5,6,8,E32.grey1);r(5,7,6,3,E32.navy);r(6,8,1,1,E32.green1);r(9,8,1,1,E32.green1);r(6,9,4,1,E32.green1);
 r(7,2,2,2,O);r(7,1,2,1,E32.green1);r(5,14,2,2,O);r(9,14,2,2,O)}
function glitchKingDefeat(px,py,t,awayDir){
 if(t<.8){glitchKing(px,py,Math.floor(t*8)%2,awayDir===2?3:2,2,false,false);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py-6+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)}return}
 const k=Math.min(1,(t-.8)/.8);if(k<.25){[[2,4],[9,3],[5,9],[11,10]].forEach(([a,c])=>{R(px+a-1,py+c-1,6,6,E32.magenta);R(px+a,py+c,4,4,E32.cyan)});return}
 friendlyBot(px+(awayDir===2?-1:1)*Math.round(k*24),py-((t*10|0)%2),awayDir===2)}
if(typeof module!=='undefined')module.exports={FACTORY_THEME,factoryFloor,factoryWall,conveyor,glitchBot,glitchBotDefeat,glitchKing,glitchKingDefeat,friendlyBot};

