// Ending scene (10s, no credits). Logical canvas 256x144; engine scales.
// Requires (load first): art.js (R, E32, robot, T, TH), core-art.js (glitchCore, lighthouse, lighthouseLampOn, litLamps, LAMP_COLORS),
// swamp-art.js (smallFrog), ice-art.js (snowBunny), volcano-art.js (rockBuddy), mine-art.js (smallMole), power-art.js (firefly), castle-art.js (castleBat).
const ENDING_DURATION=10;
// fallback so desert-art.js isn't required
const _robotShadow=typeof robotShadow==='function'?robotShadow:function(px,py){o.globalAlpha=.3;R(px+1,py+14,14,3,E32.cyan);R(px+3,py+13,10,5,E32.cyan);o.globalAlpha=.45;R(px+3,py+14,10,3,E32.cyan);R(px+5,py+15,6,1,E32.blue2);o.globalAlpha=1};
// camera: scale z around focus (fx,fy) placed at screen centre; needs ctx.save/translate/scale (canvas imageSmoothing irrelevant for fillRect)
function _cam(w,h,z,fx,fy){o.save();o.translate(Math.round(w/2),Math.round(h/2));o.scale(z,z);o.translate(-fx,-fy)}
const _E={W:256,H:144,LX:184,LY:46};
// lamp ignite times (s): accelerating, 3.0 -> ~6.9; engine plays a ding at each
const ENDING_LAMP_TIMES=Array.from({length:15},(_,i)=>+(3+3.9*(1-Math.pow(1-i/14,1.8))).toFixed(3));
// share button on the final held panel (logical coords); engine hit-tests and calls Share.clear()
const ENDING_SHARE_BUTTON={x:172,y:121,w:72,h:17};
const _DIG={'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111','/':'001001010100100'};
function _ptext(x,y,str,c,sc){sc=sc||1;let cx=x;for(const ch of str){const g=_DIG[ch];if(g)for(let i=0;i<15;i++)if(g[i]==='1')R(cx+(i%3)*sc,y+Math.floor(i/3)*sc,sc,sc,c);cx+=4*sc}}
function _endPanel(w,h,a){const B=ENDING_SHARE_BUTTON;o.globalAlpha=a;
 // left pill: lighthouse icon + 15/15
 R(12,120,92,19,E32.ink);R(13,119,90,21,E32.ink);R(14,121,88,17,E32.navy);R(14,121,88,1,E32.grey4);
 R(20,123,6,2,E32.red3);R(19,125,8,3,E32.yellow);R(19,128,8,2,E32.grey1);R(18,130,10,2,E32.red3);R(18,132,10,2,E32.grey1);R(17,134,12,2,E32.red3);
 _ptext(36,124,'15/15',E32.yellow,2);
 // share button: cyan pill + share icon (3 nodes) + arrow
 R(B.x+1,B.y,B.w-2,B.h,E32.ink);R(B.x,B.y+1,B.w,B.h-2,E32.ink);R(B.x+2,B.y+2,B.w-4,B.h-4,E32.cyan);R(B.x+2,B.y+2,B.w-4,1,E32.white);R(B.x+2,B.y+B.h-4,B.w-4,2,E32.blue2);
 const ix=B.x+B.w/2-7,iy=B.y+2;[[0,5],[10,0],[10,9]].forEach(([a,b])=>{R(ix+a,iy+b,4,4,E32.ink);R(ix+a+1,iy+b+1,1,1,E32.white)});for(let k=0;k<10;k++){const d=Math.round(k*.5);R(ix+3+k,iy+6-d,1,2,E32.ink);R(ix+3+k,iy+7+d,1,2,E32.ink)}
 o.globalAlpha=1}
const _lerp=(a,b,k)=>a+(b-a)*Math.max(0,Math.min(1,k));
const _ease=k=>{k=Math.max(0,Math.min(1,k));return k*k*(3-2*k)};
const _hex=(c)=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const _mix=(a,b,k)=>{const A=_hex(a),B=_hex(b);return'#'+A.map((v,i)=>Math.round(_lerp(v,B[i],k)).toString(16).padStart(2,'0')).join('')};
function _disc(cx,cy,r,c,a){if(r<1)return;o.globalAlpha=a;for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j));R(cx-w,cy+j,w*2,1,c)}o.globalAlpha=1}
function _night(w,h,dawn,t){
 const top=_mix('#181830',E32.blue1,dawn),mid=_mix('#2b2c5c','#b55088',dawn),bot=_mix('#3d3a78',E32.amber,dawn);
 for(let y=0;y<h;y++){const k=y/h;R(0,y,w,1,k<.5?_mix(top,mid,k*2):_mix(mid,bot,(k-.5)*2))}
 for(let i=0;i<50;i++){const x=(i*73)%w,y=(i*37)%70,tw=(Math.floor(t*3+i)%5)?1:.4;o.globalAlpha=tw*(1-dawn);R(x,y,1,1,i%6?E32.grey1:E32.white)}o.globalAlpha=1;
 if(dawn>0){_disc(60,118,Math.round(10+dawn*6),E32.yellow,.5*dawn);_disc(60,118,Math.round(28+dawn*10),E32.amber,.18*dawn)}
 // sea + hill
 R(0,112,w,h-112,_mix(E32.blue1,E32.blue2,dawn*.6));for(let x=0;x<w;x+=7)R(x+(Math.floor(t*2)+x/7)%3,116+(x/7%2)*4,3,1,_mix(E32.blue2,E32.white,dawn*.5));
 for(let x=0;x<w;x++){const hh=Math.max(0,Math.round(30-Math.abs(x-190)*.22));if(x>40){R(x,112-hh+8,1,hh+40,_mix(E32.green3,E32.green2,dawn));R(x,112-hh+8,1,1,_mix(E32.green2,E32.green1,dawn))}}
 for(let x=40;x<w;x++)R(x,110,1,h-110,_mix(E32.green3,E32.green2,dawn));R(40,110,w,1,_mix(E32.green2,E32.green1,dawn))}
function _beam(n,ang,a){const sx=_E.LX+16,sy=_E.LY+14,dx=Math.cos(ang),dy=Math.sin(ang),px=-dy,py=dx;
 for(let d=6;d<240;d++){const bw=(1+d*.03)*Math.min(1,6/n),tot=bw*n,f=a*Math.min(1,d/10)*(d>180?(240-d)/60:1);
  for(let i=0;i<n;i++){const off=-tot/2+(i+.5)*bw;o.globalAlpha=.7*f;R(Math.round(sx+dx*d+px*off),Math.round(sy+dy*d+py*off),2,Math.ceil(bw)+1,LAMP_COLORS[i].hex)}}o.globalAlpha=1}
function endingScene(w,h,t){w=w||_E.W;h=h||_E.H;const tt=Math.max(0,Math.min(ENDING_DURATION,t));T=tt;
 // 0-2s: glitch core reboots into calm white light
 if(tt<2){R(0,0,w,h,E32.ink);for(let i=0;i<30;i++)R((i*53)%w,(i*29)%h,1,1,E32.grey4);
  const cx=w/2-24,cy=h/2-28,ph=Math.min(5,Math.floor(tt*5));
  _cam(w,h,2,w/2,h/2-4);if(tt<1.1){const j=tt<.9&&Math.floor(tt*20)%3===0?1:0;glitchCore(cx+j,cy+4,ph,0,tt)}else glitchCore(cx,cy+4,5,1,tt);o.restore();
  if(tt>1){const k=(tt-1)/1;_disc(w/2,h/2-4,Math.round(4+k*k*150),E32.white,Math.min(1,k*1.3));_disc(w/2,h/2-4,Math.round(2+k*90),E32.cyan,.25)}
  return}
 const dawn=_ease((tt-8)/1.6),zk=_ease((tt-8)/1.4),zoomed=zk>0;
 if(zoomed)_cam(w,h,1+zk*1.1,_lerp(w/2,158,zk),_lerp(h/2,92,zk));
 _night(w,h,dawn,tt);
 // lighthouse + lamps
 const LX=_E.LX,LY=_E.LY;let n=0;
 const LT=ENDING_LAMP_TIMES;n=LT.filter(x=>tt>=x).length;
 if(n===0)lighthouse(LX,LY,0,false,tt);
 else if(tt<7.4){const i=n-1;lighthouseLampOn(LX,LY,i,i,tt-LT[i])}
 else{lighthouse(LX,LY,14,false,tt);R(LX+9,LY+10,14,9,E32.yellow);R(LX+10,LY+11,3,7,E32.amber);litLamps(LX,LY,15)}
 for(let k=0;k<n;k++){const[wx,wy]=lampWin(LX,LY,k);_disc(wx+1,wy+1,4,LAMP_COLORS[k].hex,.18)}
 // per-lamp colour burst across the sky
 for(let k=0;k<n;k++){const d=tt-LT[k];if(d>.6)continue;const[wx,wy]=lampWin(LX,LY,k),C=LAMP_COLORS[k].hex,q=d/.6;
  o.globalAlpha=.22*(1-q);R(0,0,w,112,C);o.globalAlpha=1;
  const rr=Math.round(6+q*150);for(let j=-rr;j<=rr;j++){const ww=Math.round(Math.sqrt(rr*rr-j*j)),w2=Math.round(Math.sqrt(Math.max(0,(rr-3)*(rr-3)-j*j)));o.globalAlpha=.55*(1-q);R(wx+1-ww,wy+1+j,ww-w2,1,C);R(wx+1+w2,wy+1+j,ww-w2,1,C)}o.globalAlpha=1;
  _disc(wx+1,wy+1,Math.round(8*(1-q))+2,E32.white,.6*(1-q))}
 if(tt>=7.2){const k=_ease((tt-7.2)/.8),ang=_lerp(-Math.PI/2,-Math.PI*0.85,k);_beam(15,ang,_ease((tt-7.2)/.3));_disc(LX+16,LY+14,10,E32.yellow,.25)}
 if(tt>=7.2&&tt<7.5){o.globalAlpha=.5*(1-(tt-7.2)/.3);R(0,0,w,h,E32.white);o.globalAlpha=1}
 // 小光 walks 2-5s
 const walkK=_ease((tt-2)/1),rx=Math.round(_lerp(10,132,walkK)),ry=96+Math.round(Math.max(0,(rx-130))*-0.0),fr=tt<3?(Math.floor(tt*10)%3):0;
 if(tt<2.4){o.globalAlpha=1-(tt-2)/.4;R(0,0,w,h,E32.white);o.globalAlpha=1}
 const ground=rx>44?Math.round(112-Math.max(0,30-Math.abs(rx+8-190)*.22)+8)-2:110;
 _robotShadow(rx,ground-16);robot(rx,ground-16,tt>=8?'heart':'n',tt<3?'right':(tt<8?'up':'right'),fr,0,1);
 // 8-10s: friends gather
 if(tt>=8){const fr2=[['frog',-16,0],['bunny',-31,0],['rock',16,0],['mole',30,2],['fly',-10,-22],['bat',6,-28],['fly',22,-22]];
  fr2.forEach(([kind,dx,dy],i)=>{const k=_ease((tt-8-i*.12)/.7);if(k<=0)return;const from=dx<0?-40:w+20,x=Math.round(_lerp(from,rx+dx,k)),y=ground-16+dy+(k<1?-Math.round(Math.abs(Math.sin(k*Math.PI*3))*4):0),bob=tt>=9.5?Math.round(Math.sin(tt*6+i)):0;
   if(kind==='frog')smallFrog(x,y+bob,dx>0);else if(kind==='bunny')snowBunny(x,y+bob,false);else if(kind==='rock')rockBuddy(x,y+bob);else if(kind==='mole')smallMole(x,y,true);else if(kind==='fly')firefly(x,y+bob*2,tt+i);else castleBat(x,y+bob*2,Math.floor(tt*6)%2)});
  if(tt>9.2)[[rx-6,ground-30],[rx+20,ground-34],[rx+6,ground-40]].forEach(([x,y],i)=>{if((Math.floor(tt*5)+i)%2)R(x,y,1,3,E32.white),R(x-1,y+1,3,1,E32.white)})}
 if(zoomed)o.restore();
 if(tt>=9.4)_endPanel(w,h,_ease((tt-9.4)/.4))}
if(typeof module!=='undefined')module.exports={endingScene,ENDING_DURATION,ENDING_LAMP_TIMES,ENDING_SHARE_BUTTON};
