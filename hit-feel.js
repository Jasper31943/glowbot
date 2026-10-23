// 打擊手感 (2026-10-23): numbers → per-boss, per-hit table + deterministic debris. Pure data/maths, no drawing (world.js draws).
// Input: window.HIT_FX_SPEC from hit-fx-spec.js (美術監督, numbers only). Format:
//   HIT_FX_SPEC = { <boss kind>: { colors:[hex…], size:[[w,h]…], count:{bat,bomb,ko,fire}, speed:[min,max] px/s,
//                                 hitStopMs:{bat,bomb,ko,fire}, shakePx:{bat,bomb,ko,fire}, shakeMs }, default:{…} }
// Output (HitFeel.table): table[<boss kind>|default][bat|bomb|fire|ko] = {hitStopMs,shakePx,shakeMs,count,speed,size,colors,spread,grav,life}
// Every value is finite (missing / bad numbers fall back to the placeholder defaults below), shakePx ≤ 3, no white (#fff = clock tower 'now' marker).
(function(G){
const BOSSES=['worm','tree','frog','mole','golem','crab','knight','bird','phantom','spark','guard','glitch','core'],TYPES=['bat','bomb','fire','ko'];
// placeholder defaults (used when hit-fx-spec.js is missing or a field is bad): bat 75 ms / 1 px, bomb 110 ms / 2 px, boss down 140 ms / 3 px
const DEF={colors:['#8b9bb4','#5a6988','#c0cbdc','#3a4466'],size:[[1,1],[2,1]],count:{bat:5,bomb:8,fire:3,ko:12},speed:[35,80],
 hitStopMs:{bat:75,bomb:110,fire:60,ko:140},shakePx:{bat:1,bomb:2,fire:1,ko:3},shakeMs:200};
// physics not in the spec file (shots/t8/hitfx_spec.md): spread ° around the hit direction, gravity px/s², life [min,max] s
const PHYS={tree:[70,260,.25,.45],golem:[90,180,.30,.55],mole:[80,380,.22,.40],phantom:[100,320,.20,.38],guard:[60,340,.20,.40],knight:[60,340,.20,.40],
 crab:[100,-60,.35,.60],spark:[120,0,.12,.25],worm:[90,300,.20,.40],frog:[70,360,.20,.40],bird:[100,90,.35,.60],glitch:[90,0,.18,.35],core:[120,0,.18,.35],default:[80,320,.20,.40]};
const fin=(v,d)=>typeof v==='number'&&isFinite(v)?v:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const WHITE=/^#(f{3}|f{6})$/i,HEX=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function build(spec){spec=spec&&typeof spec==='object'?spec:{};const T={};
 // 美術監督's converter (hitfx_spec.md), widened to ko + the debris fields and guarded so nothing is NaN:
 for(const w of BOSSES.concat('default')){const s=Object.assign({},spec.default||{},spec[w]||{}),p=PHYS[w]||PHYS.default;T[w]={};
  const cols=(Array.isArray(s.colors)?s.colors:[]).filter(c=>typeof c==='string'&&HEX.test(c)&&!WHITE.test(c)),
   sizes=(Array.isArray(s.size)?s.size:[]).filter(z=>Array.isArray(z)&&z.length===2&&z.every(n=>fin(n,0)>=1&&n<=4)),
   sp=Array.isArray(s.speed)&&s.speed.length===2?[fin(s.speed[0],DEF.speed[0]),fin(s.speed[1],DEF.speed[1])]:DEF.speed.slice();
  TYPES.forEach(h=>{const pick=(f,lo,hi)=>clamp(fin(s[f]&&typeof s[f]==='object'?s[f][h]:undefined,DEF[f][h]),lo,hi);
   T[w][h]={hitStopMs:pick('hitStopMs',0,200),shakePx:pick('shakePx',0,3),shakeMs:clamp(fin(s.shakeMs,DEF.shakeMs),0,400),count:Math.round(pick('count',0,24)),
    speed:[clamp(Math.min(sp[0],sp[1]),0,300),clamp(Math.max(sp[0],sp[1]),0,300)],size:sizes.length?sizes:DEF.size,colors:cols.length?cols:DEF.colors,
    spread:p[0],grav:p[1],life:[p[2],p[3]]}})}
 return T}
function cfg(table,type,who){const t=TYPES.indexOf(type)>=0?type:'fire';return (table[who]||table.default)[t]}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// debris for one hit: dir = [dx,dy] unit (way the hit travels) or null = 360°. Same seed → same burst.
function burst(c,seed,dir,n){const r=mulberry32(seed>>>0),out=[],base=dir?Math.atan2(dir[1],dir[0]):0,spr=dir?c.spread*Math.PI/180:2*Math.PI;n=n==null?c.count:n;
 for(let i=0;i<n;i++){const a=base+(r()-.5)*spr,v=c.speed[0]+r()*(c.speed[1]-c.speed[0]),z=c.size[Math.floor(r()*c.size.length)];
  out.push({vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:c.life[0]+r()*(c.life[1]-c.life[0]),c:c.colors[Math.floor(r()*c.colors.length)],w:z[0],h:z[1]})}
 return out}
G.HitFeel={BOSSES,TYPES,DEF,PHYS,build,cfg,burst,table:build(G.HIT_FX_SPEC)};
})(typeof window!=='undefined'?window:globalThis);
