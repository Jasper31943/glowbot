// 老樹精「打不到」狀態 (elder tree boss, invulnerable for N steps after a hit). Load after art.js + forest-art.js. Helpers prefixed TGA_.
// Wraps the untouched elderTree() and overlays bark armour: shingled bark plates over the canopy, bark shutters beside the face, squinting
// eyes, a darker/desaturated tint, and a small bark-shield glyph next to the HP pips. stepsLeft 2 = fresh armour,
// 1 = cracked armour (plates split, one fell off, shield cracked, tint lighter). treantDeflect() = metal "ping" spark when hit while armoured.
// Colours: browns + ink + grey; no red (boss telegraph), no white fills (clock "current" frame), no cyan/yellow glow → 小光 stays brightest.
const TGA_THEME={plate:[E32.brown2,E32.brown1,E32.tan],tint:E32.navy,shield:[E32.brown1,E32.brown2,E32.tan],spark:[E32.grey1,E32.grey2,E32.white],outline:E32.ink};
// one bark plate: w x h with ink outline, dark body, lit top edge, glint, bark grain. cracked → zig-zag split
function TGA_plate(x,y,w,h,cracked){const P=TGA_THEME.plate,O=TGA_THEME.outline;
 R(x+1,y,w-2,h,O);R(x,y+1,w,h-2,O);R(x+1,y+1,w-2,h-2,P[0]);R(x+2,y+1,w-4,1,P[1]);R(x+1,y+2,1,h-4,P[1]);R(x+2,y+2,1,1,P[2]); // rounded scale, lit top-left
 R(x+3,y+3,w-5,1,O);R(x+2,y+h-3,w-4,1,E32.plum);                                                                 // bark grain + lower shade
 if(cracked){const m=x+(w>>1);R(m,y,1,2,O);R(m+1,y+2,1,2,O);R(m,y+4,1,h-4,O)}}
// bark shutter beside the face (tall plate)
function TGA_shutter(x,y,h,cracked){const P=TGA_THEME.plate,O=TGA_THEME.outline;R(x,y,4,h,O);R(x+1,y+1,2,h-2,P[0]);R(x+1,y+1,2,1,P[1]);R(x+1,y+1,1,1,P[2]);
 for(let j=4;j<h-1;j+=4)R(x+1,y+j,2,1,O);if(cracked){R(x+1,y+(h>>1),2,1,O);R(x+2,y+(h>>1)+1,1,2,O)}}
// small shield glyph (9x11 incl. outline). stepsLeft 2: intact. 1: crack + chipped corner.
function TGA_shield(x,y,stepsLeft){const S=TGA_THEME.shield,O=TGA_THEME.outline,cr=stepsLeft<2;
 R(x-1,y-1,9,8,O);R(x,y+7,7,1,O);R(x+1,y+8,5,1,O);R(x+2,y+9,3,1,O);                     // outline (heater shield)
 R(x,y,7,6,S[0]);R(x+1,y+6,5,1,S[0]);R(x+2,y+7,3,1,S[0]);R(x+3,y+8,1,1,S[0]);
 R(x,y,7,1,S[2]);R(x,y,1,5,S[2]);R(x+3,y+1,1,7,S[1]);R(x+1,y+3,5,1,S[1]);                  // rim light + bark cross
 if(cr){R(x+5,y,2,2,O);R(x+6,y+2,1,1,O);R(x+4,y+2,1,2,O);R(x+5,y+4,1,2,O);R(x+4,y+6,1,1,O)} // chipped corner + crack
}
// px,py = same anchor as elderTree (engine: px-8, py-16 of the boss tile). frame/hp/max = same as elderTree. stepsLeft = 2 or 1 (0 → plain tree).
// t = seconds (global T). deflectT (optional) = seconds since an attack bounced off (≥0.35 or null = none). fromDir = side the attack came from
// (0 up,1 down,2 left,3 right or 'up'/'down'/'left'/'right'). Never pass hit=true while armoured (no white damage flash: nothing got through).
function treantGuard(px,py,frame,hp,max,stepsLeft,t,deflectT,fromDir){const sl=Math.max(0,Math.min(2,stepsLeft|0));
 elderTree(px,py,frame,false,hp,max);if(!sl)return;
 const sw=frame?1:0,O=TGA_THEME.outline,cr=sl<2,ga=o.globalAlpha;
 // 1) darker, desaturated tint over canopy + trunk (it "hardens")
 o.globalAlpha=cr?.22:.34;R(px+2+sw,py+2,28,13,TGA_THEME.tint);R(px+9,py+15,14,15,TGA_THEME.tint);o.globalAlpha=ga;
 // 2) shingled bark plates over the canopy (2 rows, offset). cracked: split plates + one missing (green shows through) + chip on the ground
 const rowA=[2,12,22],rowB=[7,17];
 rowA.forEach((x,i)=>{if(cr&&i===2)return;TGA_plate(px+x+sw,py+1,9,8,cr&&i===0)});
 rowB.forEach((x,i)=>TGA_plate(px+x+sw,py+7,9,8,cr&&i===1));
 if(cr){R(px+27,py+27,4,3,O);R(px+28,py+28,2,1,TGA_THEME.plate[1])} // fallen chip by the roots
 // 3) bark shutters beside the face + a brow plate; eyes squint (top rows lidded)
 TGA_shutter(px+8,py+16,13,cr);TGA_shutter(px+20,py+16,13,false);
 R(px+10,py+15,12,2,O);R(px+11,py+15,10,1,TGA_THEME.plate[1]);
 R(px+11,py+18,3,2,O);R(px+18,py+18,3,2,O);R(px+12,py+20,1,1,E32.brown1);R(px+19,py+20,1,1,E32.brown1); // lids down, eye glow dimmed
 R(px+13,py+24,6,1,O);                                                                                      // mouth set in a hard line
 // 4) shield glyph + step pips, top-right next to the HP pips
 TGA_shield(px+25,py-10,sl);
 if(deflectT!=null&&deflectT>=0&&deflectT<.35)treantDeflect(px,py,deflectT,fromDir);
 o.globalAlpha=ga}
// metal "ping" when an attack bounces off the armour. 3 frames over .35s at the impact side. Draw after treantGuard (it already does if deflectT given).
function treantDeflect(px,py,dt,fromDir){if(dt==null||dt<0||dt>=.35)return;const d=typeof fromDir==='string'?({up:0,down:1,left:2,right:3})[fromDir]:(fromDir==null?3:fromDir);
 const [cx,cy,ox,oy]=[[16,2,0,-1],[16,30,0,1],[8,22,-1,0],[23,22,1,0]][d]||[23,22,1,0],X=px+cx,Y=py+cy,S=TGA_THEME.spark,O=TGA_THEME.outline,f=dt<.1?0:dt<.22?1:2;
 if(f===0){R(X-4,Y-1,9,3,O);R(X-1,Y-4,3,9,O);R(X-2,Y-2,5,5,O);R(X-3,Y,7,1,S[0]);R(X,Y-3,1,7,S[0]);R(X-1,Y-1,3,3,S[0]);R(X,Y,1,1,S[2]);return} // impact star
 if(f===1){[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{R(X+a*3,Y+b*3,1,1,S[0]);R(X+a*4,Y+b*4,1,1,S[0]);R(X+a*5,Y+b*5,1,1,S[1])});
  R(X-5,Y,2,1,S[1]);R(X+4,Y,2,1,S[1]);R(X,Y-5,1,2,S[1]);R(X,Y+4,1,2,S[1]);R(X,Y,1,1,S[0]);return} // ring of rays flying outward (no dark boxes)
 const k=Math.round((dt-.22)/.13*3);[-1,1].forEach(i=>{const x=X+ox*(4+k)+(ox?0:i*(3+k)),y=Y+oy*(4+k)+(oy?0:i*(3+k))-(ox?1:0)+(ox&&i>0?k:0);R(x-1,y-1,4,3,O);R(x,y,2,1,TGA_THEME.plate[1])})} // two bark chips bounce back toward the attacker
if(typeof module!=='undefined')module.exports={TGA_THEME,treantGuard,treantDeflect};
