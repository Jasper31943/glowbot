// Desert/forest: the real engine (world-engine.js stepV2 + mstep) must behave exactly like the design checker world/check-new.js.
// Per zone: (1) replay check-new's shortest route through the engine -> must end on the exit, no fail (and pick up the lamp in boss zones);
// (2) lock-step: walk the checker's whole reachable state graph; for every state x action, the engine's result projected into the
//     checker's state format must equal the checker's (or both must fail). Only difference allowed: the checker treats cells
//     outside the zone as wall, the engine lets the robot walk back out into the corridor.
// Plus: tunnels ice 2 <-> desert 2, desert 3 <-> forest 3, tunnel 4 forest <-> swamp; v3 saves upgrade. usage: node test-v2.js [desert|forest]
const fs=require('fs'),path=require('path'),Mod=require('module');
const E=require('./world-engine.js');E.setBossMoves(false); // check-new.js models the original boss rules; the boss moves (stage 2) are checked engine-side in test-bat.js + the per-room solver
const src=fs.readFileSync(path.join(__dirname,'world/check-new.js'),'utf8').replace(' // BFS 正向列舉',' if(inv0.expose)return{step,s0,key,W,H,Q};\n // BFS 正向列舉');
const cm=new Mod(path.join(__dirname,'world/check-new.js'));cm.filename=cm.id;cm.paths=Mod._nodeModulePaths(path.join(__dirname,'world'));cm._compile(src,cm.filename);const C=cm.exports;
const W=E.parseWorld(require('./world/world-def.js'));if(W.errors.length){console.log('world errors',W.errors);process.exit(1)}
const only=process.argv[2]||null;
const A={'↑':'up','↓':'down','←':'left','→':'right','按':'act','等':'wait'},ACT=['up','down','left','right','act','wait'],DN=['up','down','left','right'];
const BAD=['fail','noop','tired','fall'];let fails=0;const ok=(c,msg)=>{if(!c){fails++;console.log('  FAIL '+msg)}return c};
const lampAt=(m,k)=>E.base(W,m,...k.split(':')[1].split(',').map(Number))==='L';
for(const m of only?[only]:['desert','forest']){const M=C.parseMap(path.join(__dirname,'world',m+'.txt'));console.log(`== ${m}`);let fire=false,bat=false;
 for(const cz of M.zones){const Z=W.maps[m].zones.find(z=>z.id===m+'#'+cz.id);const f0=cz.note.includes('拿火')?false:fire;if(cz.note.includes('球棒'))bat=true;
  const r=C.solveZone(M.grid,cz,{fire:f0,bat});if(r.fireOut)fire=true;const X=C.solveZone(M.grid,cz,{fire:f0,bat,expose:1});
  const inZ=s=>s.m===m&&s.x>=Z.x&&s.y>=Z.y&&s.x<Z.x+Z.w&&s.y<Z.y+Z.h;
  const s0=E.initState(W);s0.m=m;[s0.x,s0.y]=Z.entry;s0.f='right';s0.inv=(f0?'F':'')+(bat?'Q':'');s0.zone=Z.id;s0.zoneEntry=Z.entry.slice();s0.left=null;
  // (1) replay
  let s=s0,bad=null,i=0;for(const ch of r.route){const x=E.mstep(W,s,A[ch]);if(BAD.indexOf(x.result)>=0){bad=`${x.result} at action ${i} (${ch}) ev=${x.ev}`;break}s=x.state;i++}
  ok(!bad&&s.x===Z.exit[0]&&s.y===Z.exit[1],`${cz.id} replay of check-new route: ${bad||'did not end on the exit'}`);
  if(cz.note.includes('燈'))ok(s.got.some(k=>lampAt(m,k)),`${cz.id} lamp not picked up`);
  // (2) lock-step
  const q=(x,y)=>(y-Z.y)*X.W+(x-Z.x),fromK=k=>{const [x,y]=k.split(':')[1].split(',').map(Number);return [x,y]},inK=k=>{const [x,y]=fromK(k);return k.startsWith(m+':')&&x>=Z.x&&y>=Z.y&&x<Z.x+Z.w&&y<Z.y+Z.h},qk=k=>q(...fromK(k));
  const g0=[];for(let y=0;y<Z.h;y++)for(let x=0;x<Z.w;x++)g0.push(M.grid[Z.y+y][Z.x+x]);
  const proj=s=>{const ch={};for(const k in s.ch)if(inK(k))ch[qk(k)]=s.ch[k];for(const k of s.broken.concat(s.got))if(inK(k))ch[qk(k)]='.';
   const b=s.bosses.find(o=>o.zone===Z.id&&o.hp>0);
   return{p:q(s.x,s.y),d:DN.indexOf(s.f),carry:s.held,fire:E.hasInv(s,'F')?1:0,lamp:s.got.some(k=>inK(k)&&lampAt(m,k))?1:0,bombs:s.bombs.filter(o=>o.m===m).map(o=>[q(o.x,o.y),o.t]),boxes:s.boxes.filter(inK).map(qk),
    dunes:s.dunes.filter(o=>o.zone===Z.id).map(o=>[q(o.x,o.y),o.d]),bugs:s.bugs.filter(o=>o.zone===Z.id).map(o=>[q(o.x,o.y),o.d,o.fr]),boss:b?{q:q(b.x,b.y),d:b.d,hp:b.hp}:null,ch,vt:Object.fromEntries(Object.entries(s.vt).filter(([k])=>inK(k)).map(([k,v])=>[qk(k),v]))}};
  const norm=st=>{const c={...st,ch:{...st.ch}};for(const k in c.ch)if(c.ch[k]==='.'&&!/[K%fT*L]/.test(g0[k]))delete c.ch[k];return X.key(c)};
  const EXq=X.Q(Z.exit[0]-Z.x,Z.exit[1]-Z.y),seen=new Set([X.key(X.s0)]),Qe=[[X.s0,s0]];let diffs=0,first='';
  for(let h=0;h<Qe.length;h++){const [cs,es]=Qe[h];if(cs.p===EXq)continue;
   for(let a=0;a<6;a++){const ct=X.step(cs,a),er=E.mstep(W,es,ACT[a]),ebad=BAD.indexOf(er.result)>=0||er.state===es;
    if(!ebad&&!inZ(er.state))continue; // walked back out into the corridor (checker: wall)
    if(!ct&&ebad)continue;
    if(!ct||ebad||norm(proj(er.state))!==norm(ct)){if(!diffs++)first=`state #${h} action ${ACT[a]}: checker ${ct?norm(ct):'fail'} / engine ${ebad?er.result:norm(proj(er.state))}`;continue}
    const k=X.key(ct);if(!seen.has(k)){seen.add(k);Qe.push([ct,er.state])}}}
  ok(!diffs,`${cz.id} ${diffs} lock-step differences, first: ${first}`);
  console.log(`${cz.id.padEnd(4)} route ${String(r.min).padStart(3)} replay ${bad?'FAIL':'ok'}  lock-step ${seen.size} states, ${diffs} differences`)}}
{const t2=W.tunnels['2'],t3=W.tunnels['3'];ok(t2&&t2.length===2&&t2.some(p=>p.m==='ice')&&t2.some(p=>p.m==='desert'),'tunnel 2 must join ice and desert');
 ok(t3&&t3.length===2&&t3.some(p=>p.m==='desert')&&t3.some(p=>p.m==='forest'),'tunnel 3 must join desert and forest');ok(W.pending.indexOf('4')<0&&W.tunnels['4'].length===2&&W.tunnels['4'].some(p=>p.m==='forest')&&W.tunnels['4'].some(p=>p.m==='swamp'),'tunnel 4 must join forest and swamp (was pending before scene 5 existed)');
 const s=E.initState(W);const d=t2.find(p=>p.m==='desert');s.m='desert';s.x=d.x+1;s.y=d.y;s.zone=null;const r=E.step(W,s,'left');ok(r.result==='tunnel'&&r.state.m==='ice','desert tunnel 2 leads back to ice');
 const s2=E.initState(W);const i2=t2.find(p=>p.m==='ice');s2.m='ice';s2.x=i2.x;s2.y=i2.y+1;s2.zone=null;const r2=E.step(W,s2,'up');ok(r2.result==='tunnel'&&r2.state.m==='desert','ice tunnel 2 leads to desert');
 const d3=t3.find(p=>p.m==='desert');const s3=E.initState(W);s3.m='desert';s3.x=d3.x+1;s3.y=d3.y;s3.zone=null;const r3=E.step(W,s3,'left');ok(r3.result==='tunnel'&&r3.state.m==='forest','desert tunnel 3 leads to forest')}
{const s=E.initState(W);['dunes','bugs','bosses','ch','vt'].forEach(k=>delete s[k]);const n=E.initMovers(W,JSON.parse(JSON.stringify(s)));ok(n.dunes.length===W.dunes0.length&&n.bugs.length===W.bugs0.length&&n.bosses.length===W.bosses0.length&&n.bosses.filter(b=>b.m==='desert'||b.m==='forest').length===2&&n.clouds.length===W.clouds0.length,'v3 save upgrade fills movers')}
// reset restores the zone's movers and changed tiles
{const Z=W.maps.desert.zones.find(z=>z.id==='desert#D5');let s=E.initState(W);s.m='desert';[s.x,s.y]=Z.entry;s.zone=Z.id;s.zoneEntry=Z.entry.slice();s.left=null;
 for(let i=0;i<12;i++){const r=E.step(W,s,i%2?'up':'down');s=r.state}const r=E.step(W,s,'reset');ok(JSON.stringify(r.state.dunes)===JSON.stringify(W.dunes0)&&!Object.keys(r.state.ch).length,'reset restores dunes and tiles')}
console.log(fails?`${fails} FAILED`:'ALL PASS');process.exit(fails?1:0)
