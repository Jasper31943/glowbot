// Power plant (發電廠) art. Load after art.js. 16x16, Endesga 32. Spark monster defeat turns into a firefly.
const POWER_THEME={name:'發電廠',style:'power',floor:[E32.grey1,'#adb9cc',E32.grey2],wall:[E32.grey2,E32.grey3,E32.amber,E32.ink],
 wire:[E32.grey4,E32.amber,E32.yellow],spark:[E32.yellow,E32.amber,E32.blue2],outline:E32.ink};
function powerFloor(px,py,x,y){const F=POWER_THEME.floor;R(px,py,16,16,F[0]);R(px,py,16,1,F[1]);R(px,py,1,16,F[1]);[[2,2],[13,2],[2,13],[13,13]].forEach(([a,b])=>R(px+a,py+b,1,1,F[2]))}
function powerWall(px,py,x,y){const W=POWER_THEME.wall;R(px,py,16,16,W[1]);R(px+1,py+1,14,10,W[0]);for(let i=0;i<16;i+=4){R(px+i,py+12,2,3,W[2]);R(px+i+2,py+12,2,3,W[3])}R(px+3,py+3,10,1,E32.grey1)}
// wire tile: axis 'h'|'v'; powered -> pulse dot travels (t)
function wire(px,py,x,y,axis,powered,t,arms){if(arms&&arms.some(Boolean)){powerFloor(px,py,x,y);wireArms(px,py,arms,powered,t,0);return}powerFloor(px,py,x,y);const Wr=POWER_THEME.wire,p=Math.floor((t||0)*16+(axis==='h'?x:y)*16)%16;
 if(axis==='h'){R(px,py+7,16,3,Wr[0]);R(px,py+8,16,1,powered?Wr[1]:E32.grey3);if(powered)R(px+p,py+7,2,3,Wr[2])}else{R(px+7,py,3,16,Wr[0]);R(px+8,py,1,16,powered?Wr[1]:E32.grey3);if(powered)R(px+7,py+p,3,2,Wr[2])}}
// wire arms: arms=[up,down,left,right] (true = a wire/gap/generator/door is next to it on that side), so the cable bends and joins exactly where the power can flow.
// live = this piece carries power (amber core + running spark); gap>0 stops each arm that many px short of the centre (the break of a ┊).
function wireArms(px,py,arms,live,t,gap){const Wr=POWER_THEME.wire,core=live?Wr[1]:E32.grey3,g=gap||0,p=Math.floor((t||0)*14)%8;
 const seg=[[7,0,3,7-g],[7,9+g,3,7-g],[0,7,7-g,3],[9+g,7,7-g,3]];
 arms.forEach((a,i)=>{if(!a)return;const [sx,sy,w,h]=seg[i];R(px+sx,py+sy,w,h,Wr[0]);if(w===3)R(px+sx+1,py+sy,1,h,core);else R(px+sx,py+sy+1,w,1,core);
  if(live&&w*h>3){const k=Math.min(p,(w===3?h:w)-2);if(w===3)R(px+sx,py+sy+(i===0?h-2-k:k),3,2,Wr[2]);else R(px+sx+(i===2?w-2-k:k),py+sy,2,3,Wr[2])}});
 if(!g){R(px+7,py+7,3,3,Wr[0]);R(px+8,py+8,1,1,core)}}
function generator(px,py,on,t){R(px+1,py+2,14,13,E32.ink);R(px+2,py+3,12,11,on?E32.grey2:E32.grey3);R(px+4,py+4,8,8,E32.ink);
 const f=Math.floor((t||0)*8)%2,b=on?(f?E32.yellow:E32.amber):E32.grey2; // lightning bolt = generator (grey when off, glowing when on)
 R(px+8,py+5,2,1,b);R(px+7,py+6,2,1,b);R(px+6,py+7,4,1,b);R(px+7,py+8,2,1,b);R(px+6,py+9,2,1,b);R(px+6,py+10,1,1,b);
 R(px+3,py+12,10,2,E32.ink);R(px+4,py+12,8,1,on?E32.green1:E32.red3);if(on){o.globalAlpha=.25;R(px,py+1,16,15,E32.yellow);o.globalAlpha=1}}
// spark monster: frame 0/1 crackle; spotted '!'
function sparkMon(px,py,frame,spotted){const S=POWER_THEME.spark,b=frame?1:0;
 R(px+4,py+4+b,8,8,E32.blue1);R(px+5,py+5+b,6,6,S[2]);R(px+6,py+6+b,4,4,S[1]);R(px+6,py+7+b,1,1,E32.ink);R(px+9,py+7+b,1,1,E32.ink);
 const z=frame?[[2,3],[13,5],[3,12],[12,13]]:[[3,5],[12,3],[2,11],[13,11]];z.forEach(([a,c])=>{R(px+a,py+c,1,2,S[0]);R(px+a+1,py+c+1,1,1,S[0])});
 if(spotted){R(px+7,py-6,3,7,E32.ink);R(px+8,py-5,1,3,E32.amber);R(px+8,py-1,1,1,E32.amber)}}
// defeat t 0..1.6: dizzy stars, pop, then a firefly floats away
function sparkDefeat(px,py,t,awayDir){if(t<.8){sparkMon(px,py,0,false);for(let i=0;i<3;i++){const a=t*9+i*2.094;R(px+7+Math.round(Math.cos(a)*6),py+1+Math.round(Math.sin(a)*2),2,2,E32.yellow)}return}
 const k=(t-.8)/.8;if(k<.2){R(px+4,py+4,8,8,E32.amber);R(px+6,py+6,4,4,E32.yellow);return}
 firefly(px+(awayDir===2?-1:1)*Math.round(k*22),py-Math.round(k*12)+Math.round(Math.sin(k*20)*2),t)}
function firefly(px,py,t){const g=Math.floor((t||0)*6)%2;o.globalAlpha=.35;R(px+5,py+7,6,6,E32.yellow);o.globalAlpha=1;
 R(px+7,py+7,3,2,E32.ink);R(px+7,py+9,3,3,g?E32.yellow:E32.amber);R(px+6,py+6,2,2,E32.grey1);R(px+9,py+6,2,2,E32.grey1)}
// wire gap ┊: empty slot; bridged=true when a box sits on it
function wireGap(px,py,x,y,bridged,t,arms,live){powerFloor(px,py,x,y);
 if(arms){wireArms(px,py,arms,live,t,3); // cable ends stop short: the break in the middle needs a crate on it
  if(bridged){R(px+4,py+4,8,8,E32.ink);R(px+5,py+5,6,6,live?E32.amber:E32.grey3)}
  else{R(px+4,py+4,8,8,E32.ink);R(px+5,py+5,6,6,E32.grey1);for(let i=0;i<4;i++){R(px+5+i,py+5+i,2,1,E32.red3);R(px+9-i,py+5+i,2,1,E32.red3)}} // empty socket with a red ✕ = "push a crate here"
  return}
 R(px+6,py,4,5,E32.ink);R(px+6,py+11,4,5,E32.ink);R(px+7,py,2,5,E32.grey4);R(px+7,py+11,2,5,E32.grey4);
 if(bridged){R(px+6,py+5,4,6,E32.ink);R(px+7,py+5,2,6,E32.amber);const p=Math.floor((t||0)*8)%6;R(px+7,py+5+p,2,1,E32.yellow)}
 else{R(px+7,py+6,2,1,E32.red3);R(px+7,py+9,2,1,E32.red3)}}
// power door ▣: open when powered
function powerDoor(px,py,open,t){R(px,py,16,16,E32.ink);R(px+1,py+1,14,14,E32.grey3);
 if(open){R(px+3,py+2,10,12,E32.navy);R(px+4,py+3,8,10,E32.amber);o.globalAlpha=.35;R(px+5,py+4,6,8,E32.yellow);o.globalAlpha=1}
 else{R(px+2,py+2,12,12,E32.navy);for(const bx of [3,7,11])R(px+bx,py+2,2,12,E32.grey2); // shut: a barred door (not a box), opens when power reaches it
  R(px+5,py+5,6,6,E32.ink);R(px+6,py+6,4,4,E32.red3);R(px+7,py+7,2,2,E32.grey1)}}
// ---- 電火花王 §: 16x16 (sparks ±2). frame 0/1 crackle/walk, dir 2/3, hit 0..2 (3 HP), spotted "!".
// powered=true (generator ON): charged look, engine may patrol + bombs deal damage.
// powered=false (generator OFF): visually dimmed overlay; invulnerable (bombs do nothing). Art only dims — engine enforces damage.
// flash=true white hit flash. Also accepts 7-arg form (...,hit,spotted,flash) defaulting powered=true.
function sparkKing(px,py,frame,dir,hit,spotted,powered,flash){
 if(arguments.length===7&&typeof powered!=='boolean'){flash=powered;powered=true}
 const fl=dir===2,r=(a,b,w,h,c)=>R(fl?px+16-a-w:px+a,py+b,w,h,c),O=E32.ink,f=frame?1:0,on=powered!==false;
 const C=flash?E32.white:(on?E32.yellow:E32.grey2),C2=flash?E32.grey1:(on?E32.amber:E32.grey3),C3=flash?E32.white:(on?E32.blue2:E32.navy);
 o.globalAlpha=.4;r(2,14,12,2,on?E32.amber:E32.ink);o.globalAlpha=1;
 // wild crackle bolts (identity)
 const bolts=f?[[-2,1],[16,3],[-1,8],[17,11],[4,-3],[11,-2],[1,13],[14,13]]:[[-1,3],[15,1],[0,10],[16,8],[6,-3],[10,-4],[-1,12],[15,14]];
 bolts.forEach(([a,b])=>{r(a,b,1,2,C);r(a+(a<8?1:-1),b+1,1,1,C2);r(a,b+2,1,1,E32.white)});
 // plasma orb body (round, not box)
 const disc=(cx,cy,rx,ry,col)=>{for(let j=-ry;j<=ry;j++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(j*j)/((ry+.5)*(ry+.5)))));r(cx-w,cy+j,w*2,1,col)}};
 disc(8,8+f,7,6,O);disc(8,8+f,6,5,C3);disc(8,8+f,4,4,C2);disc(8,8+f,2,2,C);r(6,6+f,1,1,E32.white);
 // angry arc eyes
 r(4,7+f,3,2,O);r(9,7+f,3,2,O);r(5,7+f,1,1,E32.white);r(10,7+f,1,1,E32.white);r(4,6+f,3,1,O);r(9,6+f,3,1,O);
 // storm crown spikes
 r(5,-1+f,2,4,O);r(7,-3+f,2,5,O);r(9,-1+f,2,4,O);r(6,0+f,1,2,C);r(8,-2+f,1,3,C);r(10,0+f,1,2,C);
 // spark feet
 r(3,13+f,4,2,O);r(4,13+f,2,1,C3);r(9,13+f,4,2,O);r(10,13+f,2,1,C3);
 if(hit>=1){r(10,5+f,1,3,O);r(4,10+f,2,1,O);r(-1,4,1,1,C2)}
 if(hit>=2){r(7,3+f,1,2,O);r(11,8+f,1,2,O);r(7,-3+f,1,2,O);r(16,6,1,1,C2);r(0,9,1,1,C)}
 if(!on){o.globalAlpha=.45;disc(8,8+f,6,5,E32.grey4);o.globalAlpha=1} // dim when unpowered (invulnerable)
 if(spotted){R(px+6,py-12,5,9,O);R(px+7,py-11,3,5,E32.amber);R(px+7,py-5,3,1,E32.amber)}}
function sparkKingDefeat(px,py,t,awayDir){
 if(t<.8){sparkKing(px,py,0,awayDir===2?3:2,2,false,false,false);for(let i=0;i<3;i++){const a=t*9+i*2.094,x=px+7+Math.round(Math.cos(a)*7),y=py+-6+Math.round(Math.sin(a)*2);R(x-1,y-1,4,4,E32.ink);R(x,y,2,2,E32.yellow)};return}
 const k=Math.min(1,(t-.8)/.8);if(k<.2){[[3,4],[9,3],[5,9],[11,10]].forEach(([a,c])=>{R(px+a-1,py+c-1,6,6,E32.amber);R(px+a,py+c,4,4,E32.yellow)});return}
 firefly(px+(awayDir===2?-1:1)*Math.round(k*24),py-Math.round(k*14)+Math.round(Math.sin(k*20)*2),t)}
if(typeof module!=='undefined')module.exports={POWER_THEME,powerFloor,powerWall,wire,generator,sparkMon,sparkDefeat,firefly,wireGap,powerDoor,sparkKing,sparkKingDefeat};

