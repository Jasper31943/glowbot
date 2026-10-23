// 球棒木板牆 (bat-only boarded-up wall, v2). A NEW tile type — the existing bomb-breakable '%' cracked wall art (world.js v2Tile) is untouched.
// Load after art.js, the theme *-art.js files, and (optional) hit-fx-spec.js (window.HIT_FX_SPEC). 16x16, R() on `o`, Endesga 32 only. Helpers CWA_.
// Look: the theme's normal wall around a DARK GAP, with three WOODEN PLANKS nailed across it (top + bottom slightly askew, one diagonal brace),
// grey nail heads at every plank end, and a fresh round BAT DENT/scuff in the middle of the brace (crushed wood, light inner wood, splinter lines)
// → reads as "whack this". The '%' wall is a whole wall tile with thin crack lines; this one is an opening with boards — different silhouette,
// also in greyscale (light planks over a black gap). Planks are tinted per theme so they fit each zone. No yellow (#fee761), no white,
// no red, no grey iron frame (bomb-only iron walls keep ironBands). One slow glint slides along the top plank every 2.4 s (movement, not a blink).
const CWA_THEMES={ // base = the theme's normal wall fn (drawn around the gap); face/lit/shade = plank wood; acc = theme accent (moss, barnacle, paint…); mat = HIT_FX_SPEC key for counts/speeds
 forest: {base:'forestCanopy',face:'#b86f50',lit:'#e4a672',shade:'#733e39',acc:'#3e8948',mat:'tree'},
 swamp:  {base:'swampReeds',  face:'#733e39',lit:'#b86f50',shade:'#3e2731',acc:'#3e8948',mat:'tree'},
 mine:   {base:'mineRock',    face:'#b86f50',lit:'#e4a672',shade:'#733e39',acc:null,     mat:'tree'},
 volcano:{base:'volcanoRock', face:'#733e39',lit:'#b86f50',shade:'#3e2731',acc:'#f77622',mat:'tree'}, // charred, ember on the ends
 sea:    {base:'seaCoral',    face:'#8b9bb4',lit:'#c0cbdc',shade:'#5a6988',acc:'#ead4aa',mat:'tree'}, // driftwood + barnacles
 castle: {base:'castleBrick', face:'#733e39',lit:'#b86f50',shade:'#3e2731',acc:null,     mat:'tree'}, // dark oak
 sky:    {base:'skyUnderside',face:'#e4a672',lit:'#ead4aa',shade:'#b86f50',acc:'#63c74d',mat:'tree'}, // pale wood + vine
 mirror: {base:'mirrorWall',  face:'#68386c',lit:'#b55088',shade:'#3e2731',acc:null,     mat:'tree'}, // plum-painted
 power:  {base:'powerWall',   face:'#b86f50',lit:'#e4a672',shade:'#733e39',acc:'#5a6988',mat:'tree'}, // crate wood, stencil
 clock:  {base:'clockWall',   face:'#d77643',lit:'#e4a672',shade:'#733e39',acc:null,     mat:'tree'},
 factory:{base:'factoryWall', face:'#733e39',lit:'#b86f50',shade:'#3e2731',acc:'#b55088',mat:'tree'}, // pallet wood, magenta paint stripe
 core:   {base:'coreWall',    face:'#68386c',lit:'#b55088',shade:'#3e2731',acc:'#63c74d',mat:'tree'},
 generic:{base:null,          face:'#b86f50',lit:'#e4a672',shade:'#733e39',acc:null,     mat:'tree'}};
const CWA_PHYS={tree:[70,260,.25,.45],default:[80,320,.2,.4]}; // [spreadDeg, gravity px/s², lifeMin, lifeMax] (not in HIT_FX_SPEC; see shots/t8/hitfx_spec.md)
const CWA_FALLBACK_MAT={colors:['#b86f50','#733e39','#e4a672','#3e8948'],size:[[2,1],[1,1]],count:{bat:6},speed:[40,90]};
const CWA_th=th=>CWA_THEMES[th]||CWA_THEMES.generic;
const CWA_FRESH='#e4a672'; // freshly split inner wood
// planks: centre (cx,cy), length L, angle a (rad). top / diagonal brace / bottom.
const CWA_PLANKS=[{cx:8,cy:3.5,L:14,a:-.05},{cx:8,cy:8,L:14,a:.34},{cx:8,cy:12.5,L:14,a:.05}];
// one plank (rotation-safe scanline): ink outline, lit top row, face, shade bottom row, grain. clip = [x0,y0,x1,y1] screen box or null.
function CWA_plank(cx,cy,L,a,T0,clip,half){const c=Math.cos(a),s=Math.sin(a),h=L/2,ext=Math.ceil(h)+3;
 const x0=Math.floor(cx-ext),x1=Math.ceil(cx+ext),y0=Math.floor(cy-ext),y1=Math.ceil(cy+ext);
 for(let pass=0;pass<2;pass++)for(let Y=y0;Y<=y1;Y++)for(let X=x0;X<=x1;X++){if(clip&&(X<clip[0]||Y<clip[1]||X>clip[2]||Y>clip[3]))continue;
  const dx=X+.5-cx,dy=Y+.5-cy,u=dx*c+dy*s,v=-dx*s+dy*c;
  if(pass===0){if(Math.abs(u)<=h+1&&Math.abs(v)<=2.5)R(X,Y,1,1,E32.ink);continue}
  if(Math.abs(u)>h||Math.abs(v)>1.5)continue;
  let col=v<-.5?T0.lit:v>.5?T0.shade:T0.face;
  if(v>-.5&&v<=.5&&((Math.floor(u+h)%6)===2))col=T0.shade;                        // grain
  if(half&&((half>0&&u>h-1.2)||(half<0&&u<-h+1.2)))col=Math.floor(v*2)%2?CWA_FRESH:T0.shade; // splintered end
  R(X,Y,1,1,col)}}
function CWA_nail(X,Y){R(X,Y,1,1,E32.grey1);R(X+1,Y,1,1,E32.ink);R(X,Y+1,1,1,E32.ink)}
// the boarded wall drawn at an offset (ox,oy) — gap + planks + nails + dent
function CWA_boards(px,py,T0,t,ox,oy,ph,clip){ox=ox||0;oy=oy||0;const X=px+ox,Y=py+oy,cl=clip||[px,py,px+15,py+15];
 R(X+3,Y+1,10,14,E32.ink);R(X+4,Y+2,8,1,'#262b44');R(X+3,Y+2,1,12,'#262b44');                   // dark gap with a hint of depth
 CWA_PLANKS.forEach(P=>CWA_plank(X+P.cx,Y+P.cy,P.L,P.a,T0,cl));
 // nails at both ends of each plank (on the wall side of the gap)
 CWA_PLANKS.forEach(P=>{const c=Math.cos(P.a),s=Math.sin(P.a),d=P.L/2-2.2;[-d,d].forEach(u=>CWA_nail(Math.floor(X+P.cx+u*c-.5),Math.floor(Y+P.cy+u*s-.5)))});
 // accent: moss / barnacle / ember / paint on the top plank
 if(T0.acc){R(X+4,Y+3,2,1,T0.acc);R(X+11,Y+5,1,1,T0.acc);R(X+11,Y+13,2,1,T0.acc)}
 // bat dent on the brace: round crushed hollow (shade, ink core) ringed by fresh light wood, two splinter cracks running out of it
 R(X+6,Y+7,4,2,CWA_FRESH);R(X+7,Y+6,2,4,CWA_FRESH);R(X+7,Y+7,2,2,T0.shade);R(X+7,Y+7,1,1,E32.ink);
 R(X+4,Y+6,2,1,E32.ink);R(X+5,Y+5,1,1,E32.ink);R(X+10,Y+9,2,1,E32.ink);R(X+11,Y+10,1,1,E32.ink);
 // glint along the top plank (once per 2.4 s, 0.4 s pass, per-cell phase)
 if(t!=null){const g=((((t||0)+(ph||0))%2.4+2.4)%2.4)/.4;if(g<1){const gx=3+Math.floor(g*9);R(X+gx,Y+3,2,1,E32.sand)}}}
// px,py = tile top-left on screen. theme = map theme ('swamp','mine',…). t = seconds (T). x,y = map cell (optional, base wall hashing + glint phase).
function crackWall(px,py,theme,t,x,y){const T0=CWA_th(theme),f=T0.base&&typeof globalThis[T0.base]==='function'?globalThis[T0.base]:null;
 if(f)f(px,py,x||0,y||0,t||0);else R(px,py,16,16,E32.grey4);
 CWA_boards(px,py,T0,t,0,0,(x|0)*.7+(y|0)*1.3)}
const batWall=crackWall; // alias: the tile is a boarded "bat wall", not a crack
// deterministic debris (seeded mulberry32) from window.HIT_FX_SPEC (if loaded) — the engine may replace this with its own debris drawer.
function CWA_rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function CWA_mat(key){const S=typeof window!=='undefined'&&window.HIT_FX_SPEC,M=S&&(S[key]||S.default)||CWA_FALLBACK_MAT,P=CWA_PHYS[key]||CWA_PHYS.default;
 return{colors:M.colors,size:M.size,count:M.count,speed:M.speed,spreadDeg:P[0],gravity:P[1],life:[P[2],P[3]]}}
function CWA_debris(cx,cy,tt,M,dirA,seed,n){if(tt<0)return;const r=CWA_rng(seed),ga=o.globalAlpha;
 for(let i=0;i<n;i++){const a=dirA+(r()-.5)*M.spreadDeg*Math.PI/180,v=M.speed[0]+r()*(M.speed[1]-M.speed[0]),life=M.life[0]+r()*(M.life[1]-M.life[0]),
  sz=M.size[Math.floor(r()*M.size.length)],col=M.colors[Math.floor(r()*M.colors.length)];if(tt>=life)continue;
  const X=cx+Math.cos(a)*v*tt,Y=cy+Math.sin(a)*v*tt+.5*M.gravity*tt*tt,fade=tt>life*.7?1-(tt-life*.7)/(life*.3):1;o.globalAlpha=ga*fade;
  if(sz[0]>=2&&sz[1]>=2)R(Math.round(X)+1,Math.round(Y)+1,sz[0],sz[1],E32.ink);R(Math.round(X),Math.round(Y),sz[0],sz[1],col)}o.globalAlpha=ga}

// Shatter, ~0.35 s: planks splinter. Draw AFTER the floor of the (now open) cell, at the same px,py. t = seconds since the bat's impact frame.
// dir = direction the swing travels (0 up,1 down,2 left,3 right or 'up'…) → pieces fly away from 小光. seed = any int (e.g. x*31+y).
// 0–.05 s: whole board set jolts 1px along dir, gap still dark. .05–.26: each plank snaps at the dent into two halves that spin away and drop;
// nails pop up and fall; the gap fades out .05–.15. .05–.35: wood splinters (HIT_FX_SPEC 'tree' counts/speeds, theme wood colours); .15–.35: dust.
const CWA_DUR=.35;
function crackWallBreak(px,py,theme,t,dir,seed){if(t==null||t<0||t>=CWA_DUR)return;const T0=CWA_th(theme),d=typeof dir==='string'?({up:0,down:1,left:2,right:3})[dir]:(dir==null?3:dir),
 [dx,dy]=[[0,-1],[0,1],[-1,0],[1,0]][d]||[1,0],sd=seed==null?1:seed,ga=o.globalAlpha,r=CWA_rng(sd*7+3);
 if(t<.05){CWA_boards(px,py,T0,null,dx,dy,0,[px-2,py-2,px+17,py+17]);R(px+7+dx,py+7+dy,3,3,E32.ink);return}
 const p=Math.min(1,(t-.05)/.21);
 if(t<.15){o.globalAlpha=ga*(1-(t-.05)/.1);R(px+3,py+1,10,14,E32.ink);o.globalAlpha=ga}
 if(p<1)CWA_PLANKS.forEach((P,i)=>{[-1,1].forEach(sg=>{const c=Math.cos(P.a),s=Math.sin(P.a),q=P.L/4,spin=(sg*(i===1?-1:1))*(.9+r()*.6)*p*2.2,
   fly=4+r()*4,cx=px+P.cx+sg*q*c+dx*fly*p+sg*c*p*5,cy=py+P.cy+sg*q*s+dy*fly*p-(3+i)*p+p*p*14;
   CWA_plank(cx,cy,P.L/2-.5,P.a+spin,T0,null,sg);
   if(p<.6)CWA_nail(Math.round(cx+sg*(P.L/4-2)*Math.cos(P.a+spin)),Math.round(cy+sg*(P.L/4-2)*Math.sin(P.a+spin)))})});
 // popped nails
 for(let i=0;i<3;i++){const k=t-.05,nx=px+[3,12,8][i]+Math.round((i-1)*k*40),ny=py+[4,12,8][i]-Math.round(k*60)+Math.round(k*k*500);if(k<.25)R(nx,ny,1,1,E32.grey1)}
 if(t>=.15){const u=(t-.15)/.2;o.globalAlpha=ga*.45*(1-u);const z=3+Math.round(u*6);[[-4,5],[4,4],[0,7]].forEach(([a,b])=>R(px+8+a-z/2,py+8+b-z/2-Math.round(u*3),z,z,E32.grey3));o.globalAlpha=ga}
 const M=CWA_mat(T0.mat);M.colors=[T0.face,T0.lit,T0.shade,CWA_FRESH];CWA_debris(px+8+dx*3,py+8+dy*3,t-.05,M,Math.atan2(dy,dx),sd,(M.count&&M.count.bat||6)+6)}
const batWallBreak=crackWallBreak;
if(typeof module!=='undefined')module.exports={CWA_THEMES,CWA_DUR,crackWall,crackWallBreak,batWall,batWallBreak};
