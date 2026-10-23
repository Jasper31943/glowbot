// node test-hitfx.js — hit feel table: every boss id + default × every hit type gives finite numbers (with the real spec, no spec, and a broken spec)
global.window=global;require('./hit-fx-spec.js');require('./hit-feel.js');const H=window.HitFeel;let n=0,bad=[];
const ok=(c,msg)=>{n++;if(!c)bad.push(msg)};
const chk=(T,lab)=>{for(const w of H.BOSSES.concat('default'))for(const h of H.TYPES){const c=T[w]&&T[w][h];ok(c,lab+' '+w+' '+h+' missing');if(!c)continue;
 for(const f of ['hitStopMs','shakePx','shakeMs','count','spread','grav'])ok(typeof c[f]==='number'&&isFinite(c[f]),lab+' '+w+'.'+h+'.'+f+'='+c[f]);
 ok(c.shakePx<=3&&c.shakePx>=0,lab+' shake cap '+w+h);c.speed.concat(c.life,...c.size).forEach(v=>ok(isFinite(v),lab+' '+w+h+' arr'));
 ok(c.colors.length&&c.colors.every(x=>!/^#f{3}(f{3})?$/i.test(x)),lab+' white/empty colors '+w+h);
 const b=H.burst(c,12345,[1,0]);ok(b.length===c.count&&b.every(p=>[p.vx,p.vy,p.life,p.w,p.h].every(isFinite)),lab+' burst '+w+h)}};
chk(H.table,'spec');chk(H.build(undefined),'nospec');chk(H.build({tree:{hitStopMs:'x',count:{bat:NaN},speed:[1],colors:['#ffffff','nope'],size:[[9,9]]},default:null}),'broken');
const S=window.HIT_FX_SPEC;for(const w in S)ok(H.BOSSES.indexOf(w)>=0||w==='default','unknown spec id '+w);
for(const w of H.BOSSES)ok(S[w],'spec lacks '+w);
const T=H.table;ok(T.tree.bat.hitStopMs===75&&T.tree.bat.shakePx===1,'bat 75/1');ok(T.tree.bomb.hitStopMs===110&&T.tree.bomb.shakePx===2,'bomb 110/2');
ok(T.tree.ko.hitStopMs===140&&T.golem.ko.shakePx===3,'ko 140 / ≤3');ok(H.build().default.ko.shakePx===3&&H.build().default.bat.hitStopMs===75,'placeholder values');
ok(JSON.stringify(H.burst(T.tree.bat,7,[0,1]))===JSON.stringify(H.burst(T.tree.bat,7,[0,1])),'deterministic');
if(bad.length){console.log('FAIL\n'+bad.slice(0,20).join('\n'));process.exit(1)}console.log(n+' hit-fx checks passed');
