// Power plant (發電廠) art. Load after art.js. 16x16, Endesga 32. Spark monster defeat turns into a firefly.
const POWER_THEME={name:'發電廠',style:'power',floor:[E32.grey1,'#adb9cc',E32.grey2],wall:[E32.grey2,E32.grey3,E32.amber,E32.ink],
 wire:[E32.grey4,E32.amber,E32.yellow],spark:[E32.yellow,E32.amber,E32.blue2],outline:E32.ink};
function powerFloor(px,py,x,y){const F=POWER_THEME.floor;R(px,py,16,16,F[0]);R(px,py,16,1,F[1]);R(px,py,1,16,F[1]);[[2,2],[13,2],[2,13],[13,13]].forEach(([a,b])=>R(px+a,py+b,1,1,F[2]))}
function powerWall(px,py,x,y){const W=POWER_THEME.wall;R(px,py,16,16,W[1]);R(px+1,py+1,14,10,W[0]);for(let i=0;i<16;i+=4){R(px+i,py+12,2,3,W[2]);R(px+i+2,py+12,2,3,W[3])}R(px+3,py+3,10,1,E32.grey1)}
// wire tile: axis 'h'|'v'; powered -> pulse dot travels (t)
function wire(px,py,x,y,axis,powered,t){powerFloor(px,py,x,y);const Wr=POWER_THEME.wire,p=Math.floor((t||0)*16+(axis==='h'?x:y)*16)%16;
 if(axis==='h'){R(px,py+7,16,3,Wr[0]);R(px,py+8,16,1,powered?Wr[1]:E32.grey3);if(powered)R(px+p,py+7,2,3,Wr[2])}else{R(px+7,py,3,16,Wr[0]);R(px+8,py,1,16,powered?Wr[1]:E32.grey3);if(powered)R(px+7,py+p,3,2,Wr[2])}}
function generator(px,py,on,t){R(px+1,py+2,14,13,E32.ink);R(px+2,py+3,12,11,E32.grey2);R(px+4,py+5,8,6,E32.ink);
 const f=Math.floor((t||0)*8)%2;R(px+5,py+6,6,4,on?(f?E32.amber:E32.yellow):E32.grey4);R(px+3,py+12,10,1,on?E32.green1:E32.red3)}
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
if(typeof module!=='undefined')module.exports={POWER_THEME,powerFloor,powerWall,wire,generator,sparkMon,sparkDefeat,firefly};
