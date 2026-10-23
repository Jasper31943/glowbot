// 炸彈範圍預告 (bomb blast-range preview). Load after art.js. 16x16 tiles, R() on `o`, Endesga 32. Helpers prefixed BRA_.
// Yellow = "your own bomb" (player-made danger); red solid frames stay reserved for boss telegraphs (bossMark/bossMarkFrame),
// white stays reserved for the clock tower's "current step" frame. Kept dim so 小光 (white/cyan) is still the brightest thing.
// Look: soft yellow fill over every blast tile + ONE dashed caution-tape outline (yellow dash / dark gap, 2px on 2px off) around the whole
// cross, plus a small outward chevron in each arm tile = "the blast travels this way". Boss marks are per-tile SOLID 2px red frames → never confused.
// Static (no blinking) while fuseLeft > 1s; in the last second it toggles at 2 Hz (Math.floor(t*2)) between dim and strong.
const BRA_THEME={fill:E32.yellow,dash:E32.yellow,gap:E32.ink,chev:E32.amber};
const BRA_CROSS=[{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]; // world-engine.js blast = radius-1 cross
// Arm lengths → tile list. arms = {up,down,left,right} (tiles, 0 = blocked right next to the bomb). Missing keys default to 1.
function BRA_tiles(arms){const a=arms||{},T=[{dx:0,dy:0}],D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 for(const k in D){const n=a[k]==null?1:a[k];for(let i=1;i<=n;i++)T.push({dx:D[k][0]*i,dy:D[k][1]*i})}return T}
const BRA_norm=tiles=>{if(!tiles)return BRA_CROSS;if(!Array.isArray(tiles))return BRA_tiles(tiles);return tiles.map(q=>Array.isArray(q)?{dx:q[0],dy:q[1]}:q)};
// Visual levels for a fuse time. Exported so the engine/preview can reason about it; blink only when fuseLeft<=1.
function BRA_level(fuseLeft,t){const fl=fuseLeft==null?3:fuseLeft;if(fl<=0)return null;
 if(fl>1)return{fill:fl>2?.15:.18,line:fl>2?.65:.75,chev:fl>2?.5:.65,last:false,on:false};
 const on=Math.floor((t||0)*2)%2===0;return on?{fill:.27,line:1,chev:1,last:true,on:true}:{fill:.15,line:.65,chev:.5,last:true,on:false}}
// px,py = top-left of the BOMB tile on screen. tiles = [{dx,dy}] (or [[dx,dy]] or {up,down,left,right} arm lengths; null = standard cross).
// fuseLeft = seconds until boom (3 → 0; e.g. (WE.FUSE_MS-b.ms)/1000). t = seconds (global T). Draw AFTER floor/walls, BEFORE bomb sprite + 小光.
function bombRange(px,py,tiles,fuseLeft,t){const lv=BRA_level(fuseLeft,t);if(!lv)return;const Ts=BRA_norm(tiles),C=BRA_THEME,set=new Set(Ts.map(q=>q.dx+','+q.dy)),has=(x,y)=>set.has(x+','+y);
 const ga=o.globalAlpha;
 o.globalAlpha=lv.fill;Ts.forEach(q=>R(px+q.dx*16,py+q.dy*16,16,16,C.fill));
 // chevrons: in every non-centre tile, pointing away from the bomb (3 px tall), drawn dim amber so it never reads as a boss icon
 o.globalAlpha=lv.chev;Ts.forEach(q=>{if(!q.dx&&!q.dy)return;const sx=Math.sign(q.dx),sy=Math.sign(q.dy),cx=px+q.dx*16+8,cy=py+q.dy*16+8;
  for(let i=-2;i<=2;i++){const b=2-Math.abs(i);if(sx)R(cx-1+b*sx,cy+i,2,1,C.chev);else R(cx+i,cy-1+b*sy,1,2,C.chev)}});
 // dashed outline around the union: pattern is relative to the bomb tile so it doesn't shimmer when the camera scrolls
 const dot=(x,y)=>{const lx=x-px,ly=y-py,on=(((lx+ly+64)>>1)&1)===0;o.globalAlpha=on?lv.line:lv.line*.55;R(x,y,1,1,on?C.dash:C.gap)};
 Ts.forEach(q=>{const x0=px+q.dx*16,y0=py+q.dy*16;
  if(!has(q.dx,q.dy-1))for(let i=0;i<16;i++)dot(x0+i,y0);
  if(!has(q.dx,q.dy+1))for(let i=0;i<16;i++)dot(x0+i,y0+15);
  if(!has(q.dx-1,q.dy))for(let i=1;i<15;i++)dot(x0,y0+i);
  if(!has(q.dx+1,q.dy))for(let i=1;i<15;i++)dot(x0+15,y0+i)});
 o.globalAlpha=ga}
if(typeof module!=='undefined')module.exports={BRA_THEME,BRA_CROSS,BRA_tiles,BRA_level,bombRange};
