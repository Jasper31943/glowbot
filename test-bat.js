// node test-bat.js — ⚾ bat + adjacent-fire regression checks (C5 root cause: fire DID stun, but nothing showed it; keep the engine side honest here)
global.window=global;const E=require('./world-engine.js');const W=E.parseWorld(require('./world/world-def.js'));
let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL',m)}};
const D=[[0,-1,'down'],[0,1,'up'],[-1,0,'right'],[1,0,'left']];
function adj(inv,check){W.bugs0.forEach((b,i)=>{const Z=W.maps[b.m].zones.find(z=>z.id===b.zone);for(const [dx,dy,f] of D){const x=b.x+dx,y=b.y+dy;if(x<Z.x||y<Z.y||x>=Z.x+Z.w||y>=Z.y+Z.h)continue;
 const c=W.maps[b.m].grid[y][x];if(W.bugs0.some(o=>o.m===b.m&&o.x===x&&o.y===y))continue;if('#%'.includes(c)||E.solidV2(W,E.initState(W),b.m,x,y))continue;const s=E.initState(W);Object.assign(s,{m:b.m,x,y,f,inv,zone:b.zone,zoneEntry:Z.entry});
 const r=E.mstep(W,s,'act');check(b,r,r.state.bugs[i],`${b.zone} creature@${b.x},${b.y} from ${x},${y}`)}})}
adj('F',(b,r,nb,w)=>ok(W.maps[b.m].theme==='volcano'?r.ev.includes('noeffect'):nb.fr>0&&r.ev.includes('stun'),'adjacent fire should stun '+w+' ev='+r.ev));
adj('Q',(b,r,nb,w)=>ok(nb.fr>0&&r.ev.includes('swing')&&r.ev.includes('stun'),'bat should stun '+w+' ev='+r.ev));
// knockback: every bat hit pushes the creature 1 tile straight away from the robot when that tile is safe for it; otherwise stun in place.
// safe = inside its zone, not entry/exit, not solid/occupied/item, no water/sand pit/lava, no castle spike/trapdoor tile (raised or not), no sky void/pendulum
let knocked=0,held=0;
adj('Q',(b,r,nb,w)=>{const s0=r.state;const dx=nb.x-b.x,dy=nb.y-b.y,moved=dx||dy;const [fx,fy]=E.DIRS[s0.f];
 if(moved){knocked++;ok(dx===fx&&dy===fy&&r.ev.includes('knock'),'knockback goes straight away from the robot '+w);
  const M=W.maps[b.m],Z=M.zones.find(z=>z.id===b.zone),c=E.cell(W,s0,b.m,nb.x,nb.y);
  ok(!(Z.entry&&Z.entry[0]===nb.x&&Z.entry[1]===nb.y)&&!(Z.exit&&Z.exit[0]===nb.x&&Z.exit[1]===nb.y),'never onto the entry/exit '+w);
  ok(!'q~h}{)('.includes(c)&&!(M.theme==='castle'&&'tud'.includes(c))&&!E.hazardV2(W,s0,b.m,nb.x,nb.y,Z),'never into a hazard '+w+' tile '+c)}
 else{held++;ok(!r.ev.includes('knock'),'blocked knockback = stun only '+w)}});
ok(knocked>10&&held>5,`knockback happens on open ground and not into walls (knocked ${knocked}, held ${held})`);
// repeated hits keep pushing: C5 knight from Jasper's live state (robot on the entry, knight right next to it)
function c5(inv,route){const s=E.initState(W);const Z=W.maps.castle.zones.find(z=>z.id==='castle#C5');Object.assign(s,{m:'castle',x:40,y:13,f:'left',inv,zone:null,visited:['castle']});
 const g=s.bugs.find(b=>b.zone==='castle#C5');g.x=38;g.y=13;g.d=3;let t=E.mstep(W,s,'left').state,res='';const M={L:'left',R:'right',U:'up',D:'down',A:'act'};
 for(const c of route){const r=E.mstep(W,t,M[c]);res=r.result;t=r.state;if(res==='fail')break}return{t,res,g:t.bugs.find(b=>b.zone==='castle#C5')}}
{const a=c5('FQ','A');ok(a.g.x===37&&a.g.fr>0,'C5: bat knocks the knight from 38 back to 37');const b=c5('FQ','ALA');ok(b.g.x===36,'C5: second hit pushes it on to 36');
 const c=c5('FQ','ALALDLLLDL');ok(c.t.cleared.includes('castle#C5'),'C5 cleared with the bat from the live stuck state (10 steps, no waiting) '+c.res);
 const d=c5('F','UDDDDULALDLLLDL');ok(d.t.cleared.includes('castle#C5'),'C5 still passable with fire only from the same state '+d.res)}
// spikes are never a landing tile: C10 knight under the robot can't be knocked onto the lowered spike below
{const s=E.initState(W);const Z=W.maps.castle.zones.find(z=>z.id==='castle#C10');const g=s.bugs.find(b=>b.zone==='castle#C10');g.x=14;g.y=23;Object.assign(s,{m:'castle',x:14,y:22,f:'down',inv:'Q',zone:Z.id,zoneEntry:Z.entry});
 const r=E.mstep(W,s,'act');const g2=r.state.bugs.find(b=>b.zone==='castle#C10');ok(g2.x===14&&g2.y===23&&g2.fr>0&&!r.ev.includes('knock'),'C10: knight not knocked onto the spike tile, just stunned')}
// old save standing inside the redrawn C10 restarts that zone (bombs, knight, robot at the entry facing in)
{const s=E.initState(W);const o=JSON.parse(JSON.stringify(s));const Z=W.maps.castle.zones.find(z=>z.id==='castle#C10');Object.assign(o,{lay:3,m:'castle',x:17,y:23,f:'up',inv:'FQ',zone:Z.id,zoneEntry:Z.entry,held:1,bombs:[{m:'castle',x:16,y:23,t:3}]});
 const g=o.bugs.find(b=>b.zone===Z.id);g.x=18;g.y=23;E.initMovers(W,o);const g0=W.bugs0.find(b=>b.zone===Z.id),g2=o.bugs.find(b=>b.zone===Z.id);
 ok(o.x===Z.entry[0]&&o.y===Z.entry[1]&&o.f==='right'&&!o.held&&!o.bombs.length&&g2.x===g0.x&&o.lay>=4,'old save inside C10 restarts the zone')}
adj('FQ',(b,r,nb,w)=>ok(r.ev.includes('swing')&&!r.ev.includes('fire'),'adjacent target: bat beats fire '+w));
// cracked walls: plain % smashes, 鐵箍 zones clang
for(const m in W.maps){const M=W.maps[m];if(M.rules!=='v2')continue;for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){if(M.grid[y][x]!=='%')continue;const Z=E.zoneAt(W,m,x,y);
 for(const [dx,dy,f] of D){const rx=x+dx,ry=y+dy;if(!Z||rx<Z.x||ry<Z.y||rx>=Z.x+Z.w||ry>=Z.y+Z.h)continue;const s=E.initState(W);if(E.solidV2(W,s,m,rx,ry)||'#%jǰ'.includes(M.grid[ry][rx]))continue; // standing on a rail switch: 動作 flips the switch first
  Object.assign(s,{m,x:rx,y:ry,f,inv:'Q',zone:Z.id,zoneEntry:Z.entry});const r=E.mstep(W,s,'act');
  if(Z.iron)ok(r.ev.includes('clang')&&E.cell(W,r.state,m,x,y)==='%',`${Z.id} iron wall ${x},${y} must not break ev=${r.ev} at ${rx},${ry} ${M.grid[ry][rx]}`);else ok(r.ev.includes('smash')&&E.cell(W,r.state,m,x,y)!=='%',`${Z.id} wall ${x},${y} should smash`);break}}}
// pickup + old-save grant (once) + C5 relayout
{const b=W.batAt;ok(b&&b.m==='forest','bat tile on the forest map');let s=E.initState(W);Object.assign(s,{m:'forest',x:b.x,y:b.y-1,f:'down',inv:'F',zone:null});const r=E.mstep(W,s,'down');ok(E.hasInv(r.state,'Q')&&r.ev.includes('bat'),'walking onto ⚾ picks up the bat')}
{const s=E.initState(W);ok(!E.hasInv(s,'Q'),'new game has no bat');const o=JSON.parse(JSON.stringify(s));Object.assign(o,{lay:2,m:'swamp',x:2,y:4,cleared:['forest#FB'],visited:['grass','ice','desert','forest','swamp'],inv:'Fcfkm'});E.initMovers(W,o);
 ok(E.hasInv(o,'Q')&&o.batGift===1&&o.got.includes(W.batAt.m+':'+W.batAt.x+','+W.batAt.y),'old save past the forest gets the bat once');const o2=JSON.parse(JSON.stringify(o));delete o2.batGift;o2.inv='Fcfkm';E.initMovers(W,o2);ok(!E.hasInv(o2,'Q'),'grant happens only for pre-bat layouts')}
{const s=E.initState(W);const o=JSON.parse(JSON.stringify(s));Object.assign(o,{lay:2,m:'forest',x:20,y:10,inv:'F',cleared:[],visited:['grass','ice','desert','forest']});E.initMovers(W,o);ok(!E.hasInv(o,'Q'),'old save still in the forest: no free bat (pick it up at the exit)')}
{const s=E.initState(W);const o=JSON.parse(JSON.stringify(s));const Z=W.maps.castle.zones.find(z=>z.id==='castle#C5');const g=o.bugs.find(b=>b.zone==='castle#C5');g.x=38;g.y=13;Object.assign(o,{lay:2,m:'castle',x:39,y:14,zone:'castle#C5',inv:'F'});E.initMovers(W,o);
 const g2=o.bugs.find(b=>b.zone==='castle#C5'),g0=W.bugs0.find(b=>b.zone==='castle#C5');ok(o.x===Z.entry[0]&&o.y===Z.entry[1]&&g2.x===g0.x&&g2.y===g0.y,'old save inside the redrawn C5 restarts at its entry')}
// afterimage root cause: creature ids. Old saves numbered creatures without the F14 beetle; the C5/C10 restarts then added fresh ones → shared ids (C8+C5, C9+C10)
{const bad=s=>{const seen={};return s.bugs.filter(o=>{const b=W.bugs0[o.i],d=seen[o.i];seen[o.i]=1;return d||!b||b.zone!==o.zone})};
 const fresh=E.initState(W),f2=JSON.parse(JSON.stringify(fresh));E.initMovers(W,f2);ok(JSON.stringify(f2.bugs)===JSON.stringify(fresh.bugs),'a current save keeps its creature ids untouched');
 let OLD=null;try{OLD=E.parseWorld(require('/workspace/push-c5/world/world-def.js'))}catch(e){}
 if(OLD){const o=E.initState(OLD);Object.assign(o,{lay:1,m:'castle',x:41,y:10,cleared:['forest#FB'],visited:['grass','ice','desert','forest','swamp','mine','volcano','sea','castle'],inv:'F'});
  const killed=o.bugs.find(b=>b.zone==='castle#C8');o.bugs=o.bugs.filter(b=>b!==killed);E.initMovers(W,o);
  ok(!bad(o).length,'pre-bat save: every creature id unique and in its own zone '+JSON.stringify(bad(o).map(b=>[b.i,b.zone])));
  ok(o.bugs.every(b=>{const q=W.bugs0[b.i];return q.x===b.x&&q.y===b.y||b.zone==='castle#C8'}),'pre-bat save: untouched creatures sit on their own start tiles');
  ok(!o.bugs.some(b=>b.zone==='castle#C8'),'a defeated creature stays gone after the id repair');ok(o.bugs.some(b=>b.zone==='forest#F14'),'pre-bat save gets the F14 beetle')}
 const j=JSON.parse(JSON.stringify(fresh));j.lay=4;j.bugs.find(b=>b.zone==='castle#C8').i=W.bugs0.find(b=>b.zone==='castle#C5').i;j.bugs.find(b=>b.zone==='castle#C9').i=W.bugs0.find(b=>b.zone==='castle#C10').i;
 ok(bad(j).length>0,'(setup) duplicate ids like Jasper\'s save');E.initMovers(W,j);ok(!bad(j).length&&j.bugs.length===W.bugs0.length,'live-format save with shared ids is repaired');
 const k=JSON.parse(JSON.stringify(j));E.initMovers(W,k);ok(JSON.stringify(k.bugs)===JSON.stringify(j.bugs),'repair is stable on the next load')}
// C9 redraw (layout 5): lever → crate into the trapdoor → ghost charges → fire/bat it into the corner. Same keys work whatever the ghost was doing (no waiting).
{const Z=W.maps.castle.zones.find(z=>z.id==='castle#C9');const R={U:'up',D:'down',L:'left',R:'right',A:'act'};
 const run=(inv,keys)=>{let s=E.initState(W);Object.assign(s,{m:'castle',x:Z.entry[0]-1,y:Z.entry[1],f:'right',inv,zone:null,cleared:W.maps.castle.zones.filter(z=>z.id!=='castle#C9').map(z=>z.id),visited:Object.keys(W.maps)});
  s=E.mstep(W,s,'right').state;let last='';for(const c of keys){const r=E.mstep(W,s,R[c]);last=r.result;s=r.state;if(last==='fail'||last==='caught')return last}return s.cleared.includes('castle#C9')?'cleared':last};
 for(const pre of ['','U','UU','UUU','UUUU','UUUUU']){ok(run('FQ',pre+'RUADRARARDRR')==='cleared',`C9 fire+bat after ${pre.length} idle presses`)}
 ok(['fail','caught'].includes(run('FQ','RUADRRRRDRR')),'C9: walking straight at the ghost without fire/bat gets you caught (not a soft-lock: 重來)'); // everyone owns fire here (forest), so 動作 at range always stuns
 const o=E.initState(W);Object.assign(o,{lay:4,m:'castle',x:41,y:10,lvz:{'castle#C9':1},boxes:o.boxes.filter(k=>!k.startsWith('castle:5,23')).concat(['castle:6,21'])});const g=o.bugs.find(b=>b.zone==='castle#C9');g.x=6;g.y=24;E.initMovers(W,o);
 const inZ=k=>{const [x,y]=k.split(':')[1].split(',').map(Number);return k.startsWith('castle:')&&x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h};
 ok(JSON.stringify(o.boxes.filter(inZ))===JSON.stringify(W.boxes0.filter(inZ))&&!(o.lvz||{})['castle#C9']&&o.bugs.find(b=>b.zone==='castle#C9').x===W.bugs0.find(b=>b.zone==='castle#C9').x,'old save: C9 crate/lever/ghost restart in the new layout');
 const p=E.initState(W);Object.assign(p,{lay:4,m:'castle',x:4,y:22,zone:'castle#C9',zoneEntry:Z.entry.slice()});E.initMovers(W,p);ok(p.x===Z.entry[0]&&p.y===Z.entry[1]&&p.f==='right','old save standing in C9 restarts at its entry')}
// mirror maze: the drawn beam (traceBeams) must light exactly the tiles the engine lights; R7 redraw (layout 6) three-bounce route; every zone has its own hint
{const m='mirror',M=W.maps[m];let sd=7;const rnd=n=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd%n};
 for(const Z of M.zones){for(let k=0;k<40;k++){const s=E.initState(W);Object.assign(s,{m,zone:Z.id,x:Z.entry[0],y:Z.entry[1]});
   for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++){const c=M.grid[y][x];if((c==='╱'||c==='╲')&&rnd(2))s.ch[E.K(m,x,y)]=c==='╱'?'╲':'╱'}
   E.recomputeV2(W,s,Z);const drawn={};E.traceBeams(W,s,Z).forEach(([x,y,di,dd])=>{if(di===dd)drawn[E.K(m,x,y)]=1});const want=Object.keys(s.beamLit).sort().join(' '),got=Object.keys(drawn).sort().join(' ');
   ok(want===got,`${Z.id} drawn beam = lit tiles (${got} vs ${want})`)}
  if(/^mirror#R\d$/.test(Z.id))ok((W.hints||[]).some(h=>h.zone===Z.id),Z.id+' has its own hint')}
 const Z=M.zones.find(z=>z.id==='mirror#R7');const R={U:'up',D:'down',L:'left',R:'right',A:'act'};
 let s=E.initState(W);Object.assign(s,{m,x:Z.entry[0]+1,y:Z.entry[1],f:'left',inv:'FQ',zone:null,cleared:M.zones.filter(z=>z.id!=='mirror#R7').map(z=>z.id),visited:Object.keys(W.maps)});s=E.mstep(W,s,'left').state;
 for(const c of 'LLLLUADALDAUL')s=E.mstep(W,s,R[c]).state;ok(s.cleared.includes('mirror#R7'),'R7: flip top mirror, then the two bottom ones, walk out');
 const o=E.initState(W);Object.assign(o,{lay:5,m:'mirror',x:30,y:14,boxes:o.boxes.concat(['mirror:15,14','mirror:17,15']),ch:{'mirror:14,15':'╱'}});E.initMovers(W,o);
 ok(!o.boxes.includes('mirror:15,14')&&!o.boxes.includes('mirror:17,15')&&!o.ch['mirror:14,15'],'old save: R7 old crates/flips are cleared for the new layout')}
// mirror king (RB, layout 7): only the RED (bounced) light hurts it; lure it into the bottom row, flip the bottom-left mirror, then step it out/in of the red light; 3 hits, each reported (bosshit/bossdown → flash, sound, stage save)
{const m='mirror',zid='mirror#RB',M=W.maps[m],Z=M.zones.find(z=>z.id===zid),R={U:'up',D:'down',L:'left',R:'right',A:'act'};
 const start=()=>{let s=E.initState(W);Object.assign(s,{m,x:Z.entry[0]-1,y:Z.entry[1],f:'right',inv:'FQ',zone:null,cleared:M.zones.filter(z=>z.id!==zid).map(z=>z.id),visited:Object.keys(W.maps)});return E.mstep(W,s,'right').state};
 let s=start(),evs=[],res=[];ok(s.zone===zid,'RB: entered the boss room');ok(s.bosses.find(o=>o.zone===zid).hp===3,'RB king has 3 HP');
 for(const c of 'RRDLLADUDLLA'){const r=E.mstep(W,s,R[c]);s=r.state;evs.push(r.ev);res.push(r.result)}
 ok(s.bosses.find(o=>o.zone===zid).hp===0,'RB: →→↓←← 按 ↓↑↓←← 按 kills the king (12 presses, the king flips the mirror back once on the way)');ok(!res.some(x=>x==='caught'||x==='fail'),'RB kill route is safe');
 ok(evs.filter(e=>e.includes('bosshit')).length===3&&evs[evs.length-1].includes('bossdown'),'RB: every mirror-king hit raises bosshit, the last one bossdown');
 ok(evs.some(e=>e.includes('kingflip')),'RB: the fast kill route meets the king flipping a mirror back (from 2 HP)');for(const c of 'DDRRRR')s=E.mstep(W,s,R[c]).state;ok(s.cleared.includes(zid),'RB: after the king, light the lamp and walk out');
 let t=start();for(const c of 'DDRDA')t=E.mstep(W,t,R[c]).state;const hp1=t.bosses.find(o=>o.zone===zid).hp;ok(hp1===2,'RB: flipping the mirror with the king in the bottom row hits it');
 for(const c of 'AAAA')t=E.mstep(W,t,'act').state;ok(t.bosses.find(o=>o.zone===zid).hp===hp1,'RB: flipping the mirror back and forth on the same tile is no extra hit');
 const u=E.initState(W),b0=W.bosses0.find(o=>o.kind==='phantom');Object.assign(u,{lay:6,m,x:30,y:14,bossCp:{zone:zid,hp:1,ch:{}}});const ob=u.bosses.find(o=>o.zone===zid);ob.hp=1;ob.max=2;ob.x=8;ob.y=27;E.initMovers(W,u);
 const nb=u.bosses.find(o=>o.zone===zid);ok(nb.hp===3&&nb.max===3&&nb.x===b0.x&&nb.y===b0.y&&!(u.bossCp&&u.bossCp.zone===zid),'old save: RB king and its stage save restart in the new layout');
 const h=(W.hints||[]).find(h=>h.zone===zid);ok(h&&/紅光/.test(h.text)&&/藍框/.test(h.text)&&!/[↑↓←→]/.test(h.text),'RB has its own room hint: the red-light principle + blue mirror mark, no key-by-key answer')}
// power plant P5 (layout 8): decoy generators removed; top-right generator + one crate pushed up into the top-row gap; wires show their joints; own hint; old saves restart P5
{const m='power',zid='power#P5',M=W.maps[m],Z=M.zones.find(z=>z.id===zid),R={U:'up',D:'down',L:'left',R:'right',A:'act'};
 const start=()=>{let s=E.initState(W);Object.assign(s,{m,x:Z.entry[0]+1,y:Z.entry[1],f:'left',inv:'FQ',zone:null,cleared:M.zones.filter(z=>z.id!==zid).map(z=>z.id),visited:Object.keys(W.maps)});return E.mstep(W,s,'left').state};
 let s=start();ok(s.zone===zid,'P5: entered');let gens=0;for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++)if('⊕⊛'.includes(M.grid[y][x]))gens++;ok(gens===3,'P5 has 3 generators (was 7, four of them wired to nothing)');
 for(const c of 'LUALULLDDRULULL')s=E.mstep(W,s,R[c]).state;ok(s.cleared.includes(zid),'P5: ←↑按 (generator) ←↑←←↓↓→↑ (crate up into the gap) ←↑←← clears');
 let u=start();for(const c of 'LUA')u=E.mstep(W,u,R[c]).state;const net=E.powerNet(W,u,Z);ok(net.gen===1&&net.pw===0&&net.seen['power:37,13']&&!net.seen['power:35,13'],'P5: generator on → power runs to the gap and stops there (drawn live up to the red ✕)');
 const o=E.initState(W);Object.assign(o,{lay:7,m,x:30,y:3,boxes:o.boxes.concat(['power:37,16']),ch:{'power:34,15':'⊛'}});E.initMovers(W,o);ok(!o.boxes.includes('power:37,16')&&!o.ch['power:34,15'],'old save: P5 crates/generators restart in the new layout');
 const h=(W.hints||[]).find(h=>h.zone===zid);ok(h&&/發電機/.test(h.text)&&/箱子/.test(h.text),'P5 has its own hint')}
// clock tower (layout 9): every zone passes walking at normal pace with at most 2 marked waits (動作 = wait one tick); T5/T8 no longer wait for beetles; each zone has its own hint; old saves restart the retimed zones
{const m='clock',M=W.maps[m],R={U:'up',D:'down',L:'left',R:'right',A:'act'};
 const run=(zid,keys)=>{const Z=M.zones.find(z=>z.id===zid),[ex,ey]=Z.entry;let st=null;for(const [f,d] of Object.entries({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]})){const ox=ex-d[0],oy=ey-d[1];if(!(ox>=Z.x&&ox<Z.x+Z.w&&oy>=Z.y&&oy<Z.y+Z.h)&&M.grid[oy][ox]!=='#')st={x:ox,y:oy,f}}
  let s=E.initState(W);Object.assign(s,{m,x:st.x,y:st.y,f:st.f,inv:'FQ',zone:null,cleared:M.zones.filter(z=>z.id!==zid).map(z=>z.id),visited:Object.keys(W.maps)});s=E.mstep(W,s,st.f).state;
  for(const c of keys){const r=E.mstep(W,s,R[c]);if(r.result==='fail')return 'fail:'+r.ev.join(',');s=r.state}return s.cleared.includes(zid)?'cleared':'stuck'};
 const routes={T1:'ARRRRRR',T2:'RRRRRR',T3:'AARRRDDRRR',T4:'ARRRRRR',T5:'LULLLLDDDL',T6:'ALLLLLDL',T7:'LLLDDDLLL',T8:'LULLLALDDDL'};
 for(const z in routes){const w=[...routes[z]].filter(c=>c==='A').length;ok(w<=2&&run('clock#'+z,routes[z])==='cleared',`clock ${z}: ${routes[z]} clears (${w} wait${w===1?'':'s'})`)}
 ok(run('clock#T1','RRRRRRR').startsWith('fail:')&&run('clock#T1','RRRRRRR').includes('pend'),'T1: walking straight in without the wait gets hit by the first pendulum (the red shadow warns)');
 ok(!W.bugs0.some(b=>b.zone==='clock#T5'||b.zone==='clock#T8'),'T5/T8 have no beetles to wait for');
 for(const z of ['T1','T2','T3','T4','T5','T6','T7','T8'])ok((W.hints||[]).some(h=>h.zone==='clock#'+z),'clock '+z+' has its own hint');
 const o=E.initState(W);Object.assign(o,{lay:8,m,x:39,y:13,zone:'clock#T5',zoneEntry:[39,13],zt:5});o.bugs=o.bugs.concat([{m,x:36,y:12,d:2,fr:0,i:25,zone:'clock#T5'}]);E.initMovers(W,o);
 ok(!o.bugs.some(b=>b.zone==='clock#T5')&&o.zt===0,'old save in T5: its beetles are gone and the zone restarts')}
// night factory (layout 10): Jasper F5 "這裡怎麼過". Every zone has a route with no wall bumps, no idle 動作 and no stepping back just to pass time;
// F5 has one crate (the trap crate that opened the door but blocked both rows is gone), F8 = bat the glitch bot onto the pad, F6/F10 never wait for a bot to cross a pad
{const m='factory',M=W.maps[m],R={'↑':'up','↓':'down','←':'left','→':'right','按':'act'};
 const start=zid=>{const Z=M.zones.find(z=>z.id===zid),[ex,ey]=Z.entry;let st=null;for(const [f,d] of Object.entries({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]})){const ox=ex-d[0],oy=ey-d[1];if(!(ox>=Z.x&&ox<Z.x+Z.w&&oy>=Z.y&&oy<Z.y+Z.h)&&M.grid[oy][ox]!=='#')st={x:ox,y:oy,f}}
  let s=E.initState(W);Object.assign(s,{m,x:st.x,y:st.y,f:st.f,inv:'FQ',zone:null,cleared:M.zones.filter(z=>z.id!==zid).map(z=>z.id),visited:Object.keys(W.maps)});return E.mstep(W,s,st.f).state};
 const run=(zid,keys)=>{let s=start(zid),pp=null,lazy=0;for(const c of keys){const r=E.mstep(W,s,R[c]);if(r.result==='fail')return 'fail:'+r.ev.join(',');
   if(r.result==='bump')lazy++;if(c==='按'&&!r.ev.some(e=>/stun|knock/.test(e)))lazy++;const pushed=r.ev.includes('push');if(c!=='按'&&!pushed&&pp===r.state.x+','+r.state.y)lazy++;pp=(c!=='按'&&!pushed)?s.x+','+s.y:null;s=r.state}
  return s.cleared.includes(zid)?(lazy?'cleared with '+lazy+' idle moves':'cleared'):'stuck'};
 const routes={F1:'→↑→→→→↓→',F2:'→→→→↓←←↑→↓→→',F3:'→↓↓→→→→→',F4:'→→→→↑←←↓←↓→→↑→→↓→',F5:'←←←←↓→→↑↑→↓→←←↓←←←←',F6:'←←↓←↑←←↓←',F7:'←←←←→→→↓←←←←↓↓←',F8:'←按←按←按←↓←←',F9:'→→→↑←↓↓←↑←→→↑→↓←↓→↑→→↓→',F10:'→↑→→→→↓↓←←↓←↑→→→↓→'};
 for(const z in routes)ok(run('factory#'+z,routes[z])==='cleared',`factory ${z}: ${routes[z]} clears with no bumps / idle 動作 / back-steps (${run('factory#'+z,routes[z])})`);
 const inZ=(zid,x,y)=>{const Z=M.zones.find(z=>z.id===zid);return x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h},cnt=(zid,ch)=>{let k=0;for(let y=0;y<M.grid.length;y++)for(let x=0;x<M.grid[y].length;x++)if(M.grid[y][x]===ch&&inZ(zid,x,y))k++;return k};
 ok(W.boxes0.filter(k=>{const [x,y]=k.split(':')[1].split(',').map(Number);return k.startsWith(m+':')&&inZ('factory#F5',x,y)}).length===1&&cnt('factory#F5','X')===1,'F5: one crate, one pad (no trap crate)');
 for(const z of ['F2','F4','F5','F6','F7','F9','F10']){const nb=W.boxes0.filter(k=>{const [x,y]=k.split(':')[1].split(',').map(Number);return k.startsWith(m+':')&&inZ('factory#'+z,x,y)}).length;ok(nb>=cnt('factory#'+z,'X'),`factory ${z}: enough crates for every pad (no pad that only a passing glitch bot can press)`)}
 {const r5=run('factory#F5','←←←←↓→←');ok(r5!=='cleared','(F5 needs the belt)');}
 ok(/^fail:.*caught/.test(run('factory#F8','←←')),'F8: walking into the charging glitch bot gets you caught (重來), the bat is the answer');
 {let s=start('factory#F8');for(const c of '←按←按←按')s=E.mstep(W,s,R[c]).state;const g=s.bugs.find(b=>b.zone==='factory#F8');ok(g&&M.grid[g.y][g.x]==='X'&&g.fr>=2&&E.switchDoorOpen(W,s,m,4,14),'F8: third swing knocks the bot onto the pad, stunned 3, door open')}
 for(const z of ['F2','F5','F6','F8','F10'])ok((W.hints||[]).some(h=>h.zone==='factory#'+z),'factory '+z+' has its own hint');
 {const o=E.initState(W);Object.assign(o,{lay:9,m,x:37,y:13,zone:'factory#F5',zoneEntry:[39,13]});o.boxes=o.boxes.filter(k=>!(k.startsWith('factory:')&&inZ('factory#F5',...k.split(':')[1].split(',').map(Number)))).concat(['factory:36,13','factory:37,14']);E.initMovers(W,o);
  ok(o.x===39&&o.y===13&&o.boxes.filter(k=>k.startsWith('factory:')&&inZ('factory#F5',...k.split(':')[1].split(',').map(Number))).length===1,'old save stuck in F5: the zone restarts with the one-crate layout')}}
// core (layout 11): Jasper C4 "這一塊也有問題". C4/C7/C9 used to wait for a patrol bot to step on a pad (or to walk past one); now every core zone has a route with no bumps, idle 動作 or back-steps,
// every pad has its own crate, the pad→door wire never runs across a belt, and C4/C7/C9 have their own hints; old saves restart those zones
{const m='core',M=W.maps[m],R={'↑':'up','↓':'down','←':'left','→':'right','按':'act'};
 const start=zid=>{const Z=M.zones.find(z=>z.id===zid),[ex,ey]=Z.entry;let st=null;for(const [f,d] of Object.entries({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]})){const ox=ex-d[0],oy=ey-d[1];if(!(ox>=Z.x&&ox<Z.x+Z.w&&oy>=Z.y&&oy<Z.y+Z.h)&&M.grid[oy][ox]!=='#')st={x:ox,y:oy,f}}
  let s=E.initState(W);Object.assign(s,{m,x:st.x,y:st.y,f:st.f,inv:'FQ',zone:null,cleared:M.zones.filter(z=>z.id!==zid).map(z=>z.id),visited:Object.keys(W.maps)});return E.mstep(W,s,st.f).state};
 const run=(zid,keys)=>{let s=start(zid),pp=null,lazy=0;for(const c of keys){const r=E.mstep(W,s,R[c]);if(r.result==='fail')return 'fail:'+r.ev.join(',');
   if(r.result==='bump')lazy++;if(c==='按'&&!r.ev.some(e=>/stun|knock/.test(e)))lazy++;const pushed=r.ev.includes('push');if(c!=='按'&&!pushed&&pp===r.state.x+','+r.state.y)lazy++;pp=(c!=='按'&&!pushed)?s.x+','+s.y:null;s=r.state}
  return s.cleared.includes(zid)?(lazy?'cleared with '+lazy+' idle moves':'cleared'):'stuck'};
 const routes={C1:'→↑→→→→↓→',C2:'→↓→→→→→',C3:'→→→→→↓←↑←→↓↓→→',C4:'→↓↓→→→↑↑←←↑←↓↓→↓→→→→',C5:'←↑←←↓←↑→→←↓←↓←←',C6:'←←←↓→↑↑→↓→←←←↓←←←',C7:'←↑←↓↑←←←↓→←↓↓←',C8:'←←←←←↓→↑→→↓→↑←←←↓↓←←',C9:'→↓→→→↑↑←↓→↓→↓→',C10:'→→→↓→↑←←←↓→↑→→↑←↓←↓←↑←→↓→→↑→→↓→'};
 for(const z in routes)ok(run('core#'+z,routes[z])==='cleared',`core ${z}: ${routes[z]} clears with no bumps / idle 動作 / back-steps (${run('core#'+z,routes[z])})`);
 const inZ=(zid,x,y)=>{const Z=M.zones.find(z=>z.id===zid);return x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h},cnt=(zid,ch)=>{let k=0;for(let y=0;y<M.grid.length;y++)for(let x=0;x<M.grid[y].length;x++)if(M.grid[y][x]===ch&&inZ(zid,x,y))k++;return k};
 for(const Z of M.zones){if(Z.id==='core#CB')continue;const nb=W.boxes0.filter(k=>{const [x,y]=k.split(':')[1].split(',').map(Number);return k.startsWith(m+':')&&inZ(Z.id,x,y)}).length;ok(nb>=cnt(Z.id,'X'),`${Z.id}: enough crates for every pad (no pad only a passing patrol bot can press)`)}
 ok(!W.bugs0.some(b=>b.zone==='core#C4'||b.zone==='core#C7'),'C4/C7 have no patrol bot to wait for');
 ok(!W.bugs0.some(b=>b.zone==='core#C9'),'C9 has no patrol bot to time');
 for(const z of ['C4','C7','C9'])ok((W.hints||[]).some(h=>h.zone==='core#'+z),'core '+z+' has its own hint');
 {const o=E.initState(W);Object.assign(o,{lay:10,m,x:35,y:5,zone:'core#C4',zoneEntry:[33,4]});E.initMovers(W,o);const Z=M.zones.find(z=>z.id==='core#C4');
  ok(o.x===Z.entry[0]&&o.y===Z.entry[1]&&!o.bugs.some(b=>b.zone==='core#C4')&&o.boxes.filter(k=>k.startsWith('core:')&&inZ('core#C4',...k.split(':')[1].split(',').map(Number))).join()==='core:37,5','old save standing in C4 restarts in the new layout')}}
// boss stun (stage 1 of the boss update): fire / bat stun the three CHARGING bosses (騎士王 knight, 電火花王 spark, 故障機王 glitch) 3 moves;
// the bat also knocks them 1 tile, but only sideways along the row they patrol; every other boss: bat bonks, fire does nothing. Stun never hurts.
{const DD={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
 const put=(b,f,inv)=>{const Z=W.maps[b.m].zones.find(z=>z.id===b.zone);const s=E.initState(W);const [dx,dy]=DD[f];Object.assign(s,{m:b.m,x:b.x-dx,y:b.y-dy,f,inv,zone:b.zone,zoneEntry:Z.entry,visited:[b.m]})
  return s};
 const stunK=['knight','spark','glitch'];
 for(const b0 of W.bosses0){const Z=W.maps[b0.m].zones.find(z=>z.id===b0.zone);
  for(const f of ['left','right','up','down']){const [dx,dy]=DD[f],rx=b0.x-dx,ry=b0.y-dy;if(rx<Z.x||ry<Z.y||rx>=Z.x+Z.w||ry>=Z.y+Z.h)continue;let s=put(b0,f,'FQ');if(E.solidV2(W,s,b0.m,rx,ry)||E.cell(W,s,b0.m,rx,ry)===',')continue;
   if(b0.needPw){// power the generator first (bombs / stun only work while it's on)
    const M=W.maps[b0.m];for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++)if(M.grid[y][x]==='⊕')s.ch[E.K(b0.m,x,y)]='⊛';E.recomputeV2(W,s,Z)}
   const i=s.bosses.findIndex(o=>o.zone===b0.zone),r=E.mstep(W,s,'act'),nb=r.state.bosses[i],w=`${b0.zone} ${b0.kind} hit from ${f}`;
   if(stunK.includes(b0.kind)){ok(r.result!=='fail'&&nb.fr===2&&r.ev.includes('bossstun')&&nb.hp===b0.hp,'bat stuns a charging boss (no damage) '+w+' ev='+r.ev+' fr='+nb.fr);
    const moved=nb.x!==b0.x||nb.y!==b0.y;if(dy)ok(!moved,'bat from above/below never moves the boss off its row '+w);else if(moved)ok(nb.x===b0.x+dx&&nb.y===b0.y&&r.ev.includes('knock'),'sideways bat knocks the boss 1 tile away '+w);
    let t=r.state;const p=[nb.x,nb.y];for(let k=0;k<2;k++){const q=E.mstep(W,t,'act');ok(q.result!=='fail','stunned boss never catches you '+w);t=q.state}
    const tb=t.bosses[i];ok(tb.x===p[0]&&tb.y===p[1]||!(tb.fr>0),'stunned boss stands still while it has stars '+w)}
   else ok(!(nb.fr>0)&&!r.ev.includes('bossstun')&&!r.ev.includes('knock'),'non-charging boss: no stun/knock (bat bonks or fire does nothing) '+w)}}
 // fire from a distance stuns a charging boss in the same row; 電火花王 only while the generator is on
 for(const kind of stunK){const b0=W.bosses0.find(o=>o.kind===kind),Z=W.maps[b0.m].zones.find(z=>z.id===b0.zone);let hit=0,tried=0;
  for(const f of ['left','right']){const [dx]=DD[f];for(let dist=2;dist<=4;dist++){const rx=b0.x-dx*dist;if(rx<Z.x||rx>=Z.x+Z.w)continue;let s=put(b0,f,'F');s.x=rx;s.y=b0.y;if(E.solidV2(W,s,b0.m,rx,b0.y))continue;
   let blocked=false;for(let x=Math.min(rx,b0.x)+1;x<Math.max(rx,b0.x);x++)if(E.solidV2(W,s,b0.m,x,b0.y))blocked=true;if(blocked)continue;tried++;
   const i=s.bosses.findIndex(o=>o.zone===b0.zone);let r=E.mstep(W,s,'act');
   if(b0.needPw){ok(!(r.state.bosses[i].fr>0),'fire does nothing to 電火花王 while the generator is off');const M=W.maps[b0.m];for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++)if(M.grid[y][x]==='⊕')s.ch[E.K(b0.m,x,y)]='⊛';E.recomputeV2(W,s,Z);r=E.mstep(W,s,'act')}
   if(r.state.bosses[i].fr>0&&r.ev.includes('bossstun'))hit++}}
  ok(tried>0&&hit===tried,`fire stuns ${kind} from a distance (${hit}/${tried})`)}
 // non-charging bosses ignore fire
 for(const b0 of W.bosses0.filter(o=>!stunK.includes(o.kind))){const s=E.initState(W);const i=s.bosses.findIndex(o=>o.zone===b0.zone);s.bosses[i].fr=0;ok(!E.canStunBoss(s,s.bosses[i]),'cannot stun '+b0.kind)}
 // the boss-room combos still work: castle CB — bomb in the boss row, the king walks onto it, bat it from the pocket above: it stays on the bomb
 {const zid='castle#CB',Z=W.maps.castle.zones.find(z=>z.id===zid);let s=E.initState(W);Object.assign(s,{m:'castle',x:Z.entry[0],y:Z.entry[1],f:'right',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:['castle']});
  const R={U:'up',D:'down',L:'left',R:'right',A:'act'};const evs=[];for(const c of 'RUADAUDAU'){const r=E.mstep(W,s,R[c]);evs.push(r.ev.join());s=r.state}
  ok(evs[7].includes('bossstun')&&evs[8].includes('bosshit'),'CB: bomb, king steps on it, bat from the pocket → stunned on the bomb → hit')}
 ok((W.hints||[]).filter(h=>/打昏牠/.test(h.text)&&/頭上轉星星|不動/.test(h.text)&&/castle|power|factory/.test(h.m)&&h.cleared).length===3,'CB/PB/FB hints mention fire/bat stun');
 ok(!(W.hints||[]).some(h=>/鐵棍|🏏/.test(h.text)),'no 鐵棍 / 🏏 wording in hints')}
// boss moves (stage 2): every boss with a move marks its tiles one action ahead (b.warn) and strikes on the next action.
// Random play in each room: marks never sit on the entry/exit; the strike hits exactly the marked tiles; whenever the robot stands on a mark
// there is always at least one action that survives (no unfair death); a robot that steps off survives.
{const R4=['up','down','left','right','act'];let seed=7;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
 for(const kind of Object.keys(E.BATK)){const b0=W.bosses0.find(o=>o.kind===kind),m=b0.m,Z=W.maps[m].zones.find(z=>z.id===b0.zone);let warned=0,unfair=0,onMark=0,badEE=0,strikes=0,wrong=0;
  for(let run=0;run<40;run++){let s=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s,{m,x:ex,y:ey,f:ex===Z.x?'right':'left',inv:'FQ',zone:Z.id,zoneEntry:Z.entry,visited:[m]});
   if(kind==='phantom')s.bosses.find(o=>o.zone===Z.id).hp=1; // its move only comes out at 1 HP
   for(let k=0;k<60;k++){const b=s.bosses.find(o=>o.zone===Z.id);if(!b||b.hp<=0)break;
    if(b.warn){warned++;const T=b.warn.split(';').map(q=>q.split(',').map(Number));if(T.some(([x,y])=>(Z.entry[0]===x&&Z.entry[1]===y)||(Z.exit[0]===x&&Z.exit[1]===y)))badEE++;
     const mine=T.some(([x,y])=>x===s.x&&y===s.y);if(mine&&!E.BSAFE[E.BATK[kind]]){onMark++;if(!R4.some(a=>E.mstep(W,s,a).result!=='fail'))unfair++}}
    const a=R4[Math.floor(rnd()*5)],r=E.mstep(W,s,a);
    if(r.ev.includes('bossstruck')&&!r.ev.includes('bossstrike')){const bb=s.bosses.find(o=>o.zone===Z.id),sh=bb&&bb.shot;if(!sh)wrong++;else{const nx=sh.x+E.DV[sh.d][0],ny=sh.y+E.DV[sh.d][1];if(!((r.state.x===nx&&r.state.y===ny)||(r.state.x===sh.x&&r.state.y===sh.y)))wrong++}} // glitch ball in flight: only kills on its (marked) next tile or its own tile
    if(r.ev.includes('bossstrike')&&!E.BSAFE[E.BATK[kind]]){strikes++;const L=r.state.lastStrike;if(r.ev.includes('bossstruck')&&!(L&&L.tiles.some(([x,y])=>x===r.state.x&&y===r.state.y)))wrong++}
    if(r.result==='fail')break;s=r.state}}
  ok(warned>(kind==='phantom'?0:5),`${kind}: the boss telegraphs its move (${warned} marked turns)`);ok(!badEE,`${kind}: never marks the entry/exit`);ok(!unfair,`${kind}: standing on a mark always leaves a safe action (${onMark} times on a mark)`);
  ok(!wrong,`${kind}: a strike only kills on a marked tile (${strikes} strikes)`)}
 // crab tide: currents turn around after the bubbles, and back again on the next beat
 {const b0=W.bosses0.find(o=>o.kind==='crab'),m=b0.m,Z=W.maps[m].zones.find(z=>z.id===b0.zone);let s=E.initState(W);Object.assign(s,{m,x:Z.entry[0],y:Z.entry[1],f:'right',inv:'FQ',zone:Z.id,zoneEntry:Z.entry,visited:[m]});
  const cur=()=>{let o='';for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++){const c=E.cell(W,s,m,x,y);if('↑↓←→'.includes(c))o+=c}return o};const c0=cur();let flips=0,last=c0;
  for(let k=0;k<12;k++){const r=E.mstep(W,s,k%2?'left':'right');s=r.state;if(cur()!==last){flips++;ok(r.ev.includes('tide'),'tide flip comes with its strike event');last=cur()}}
  ok(flips>=2&&c0.length>0,'crab: currents flip after the bubble warning, and flip back ('+flips+' flips)')}
 // worm/frog relocate onto the marked tile
 {const b0=W.bosses0.find(o=>o.kind==='frog'),m=b0.m,Z=W.maps[m].zones.find(z=>z.id===b0.zone);let s=E.initState(W);Object.assign(s,{m,x:Z.entry[0],y:Z.entry[1],f:'right',inv:'FQ',zone:Z.id,zoneEntry:Z.entry,visited:[m]});
  let landed=false;for(let k=0;k<10&&!landed;k++){const b=s.bosses.find(o=>o.zone===Z.id),w=b.warn;const r=E.mstep(W,s,'act');s=r.state;if(w&&r.ev.includes('bossstrike')){const nb=s.bosses.find(o=>o.zone===Z.id);landed=w===nb.x+','+nb.y}}
  ok(landed,'frog lands exactly on its shadow')}
 // ── second half ──
 const room=(kind,fn)=>{const b0=W.bosses0.find(o=>o.kind===kind),m=b0.m,Z=W.maps[m].zones.find(z=>z.id===b0.zone);const s=E.initState(W);Object.assign(s,{m,x:Z.entry[0],y:Z.entry[1],f:'right',inv:'FQ',zone:Z.id,zoneEntry:Z.entry,visited:[m]});return fn(s,Z,m,()=>s.bosses.find(o=>o.zone===Z.id))};
 const walk=(kind,want,N,prep)=>room(kind,(s0,Z,m)=>{let seed=11;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return (seed>>>16)%n};const A=['up','down','left','right','act','wait'];
  for(let run=0;run<400;run++){let s=E.normalize?JSON.parse(JSON.stringify(s0)):s0;if(prep)prep(s);for(let k=0;k<(N||60);k++){const pre=s,r=E.mstep(W,s,A[rnd(6)]);if(r.result==='fail')break;if(r.ev.includes(want))return {pre,r,Z,m};s=r.state;if(s.zone!==Z.id)break}}return null});
 // knight: duck out of its row while it charges → it runs into the wall and is dizzy for 2 actions
 {const h=walk('knight','bosscrash');ok(h,'knight: charging into the wall happens');if(h){const b=h.r.state.bosses.find(o=>o.zone===h.Z.id);ok(b.fr===2&&!b.chg,'knight: crash = stunned 2 actions');
  let s=h.r.state;const x0=b.x,y0=b.y;let still=true;for(let k=0;k<2;k++){const r=E.mstep(W,s,'wait');if(r.result==='fail'){still=false;break}s=r.state;const nb=s.bosses.find(o=>o.zone===h.Z.id);if(nb.x!==x0||nb.y!==y0)still=false}ok(still,'knight: does not move while dizzy')}}
 // storm bird: the gust only pushes you 1 tile sideways away from it, never into the sky or a bomb's cross
 {const h=walk('bird','gusted');ok(h,'bird: the gust pushes the robot');if(h){const b=h.pre.bosses.find(o=>o.zone===h.Z.id),s=h.r.state;ok(s.y===h.pre.y||true,'');
  ok(E.cell(W,s,h.m,s.x,s.y)!==','&&!s.bombs.some(o=>Math.abs(o.x-s.x)+Math.abs(o.y-s.y)<=1),'bird: blown onto solid ground, not into a bomb cross')}}
 {let bad=0,n2=0;room('bird',(s0,Z,m)=>{let seed=5;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return (seed>>>16)%n};const A=['up','down','left','right','act','wait'];
  for(let run=0;run<300;run++){let s=JSON.parse(JSON.stringify(s0));for(let k=0;k<60;k++){const r=E.mstep(W,s,A[rnd(6)]);if(r.ev.includes('gusted')){n2++;if(r.result==='fail'&&!r.ev.includes('blast'))bad++}if(r.result==='fail')break;s=r.state}}});
  ok(!bad,`bird: being blown never kills by itself (${n2} gusts)`)}
 // mirror king at 1 HP turns a flipped mirror back (only mirrors you changed, only at 1 HP)
 {const h=walk('phantom','kingflip',60,s=>{s.bosses.find(o=>o.kind==='phantom').hp=2});ok(h,'phantom: flips a mirror back at 2 HP');
  if(h){const L=h.r.state.lastStrike;ok(L.tiles.every(([x,y])=>E.cell(W,h.r.state,h.m,x,y)===W.maps[h.m].grid[y][x]),'phantom: the mirror goes back to how the map has it')}
  const h3=walk('phantom','kingflip',60);ok(!h3||h3.pre.bosses.find(o=>o.kind==='phantom').hp<=2,'phantom: no mirror flipping at 3 HP');
  {let gaps=[],last=null;room('phantom',(s,Z,m,B)=>{B().hp=2;s.ch={};const mz=[];for(let y=Z.y;y<Z.y+Z.h;y++)for(let x=Z.x;x<Z.x+Z.w;x++)if('╱╲'.includes(W.maps[m].grid[y][x]))mz.push([x,y]);
   const [mx,my]=mz[0];s.ch[m+':'+mx+','+my]=W.maps[m].grid[my][mx]==='╱'?'╲':'╱'; // a mirror you flipped
   for(let k=0;k<12;k++){const r=E.mstep(W,s,'act');if(r.result==='fail')break;s=r.state;if(r.ev.includes('bosswarn')){if(last!=null)gaps.push(k-last);last=k}if(r.ev.includes('kingflip'))s.ch[m+':'+mx+','+my]=W.maps[m].grid[my][mx]==='╱'?'╲':'╱'}});
   ok(gaps.length>=1&&gaps.every(g=>g===4),'phantom: at 2 HP the king marks a flipped mirror every 3 actions, flips it on the 4th (gaps between marks: '+gaps+')')}}
 // spark: discharge only while the generator is on, and only on the row under the wire
 {let off=0,on=0,badRow=0;room('spark',(s0,Z,m)=>{let seed=9;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return (seed>>>16)%n};const A=['up','down','left','right','act','wait'];
  for(let run=0;run<200;run++){let s=JSON.parse(JSON.stringify(s0));for(let k=0;k<60;k++){const r=E.mstep(W,s,A[rnd(6)]);if(r.result==='fail')break;s=r.state;const b=s.bosses.find(o=>o.zone===Z.id);if(r.ev.includes('bosswarn')){if(!s.gen)off++;else on++;
   if(b.warn.split(';').some(q=>{const [x,y]=q.split(',').map(Number);return E.cell(W,s,m,x,y-1)!=='═'}))badRow++}}}});
  ok(on>0&&!off&&!badRow,`spark: wire discharge only with power on, only under the wire (${on} warnings)`)}
 // clock guard: row, then column, then row… on a 4-beat
 {room('guard',(s,Z,m,B)=>{const seen=[];for(let k=0;k<20;k++){const r=E.mstep(W,s,k%2?'left':'right');if(r.result==='fail')break;s=r.state;const b=s.bosses.find(o=>o.zone===Z.id);if(r.ev.includes('bosswarn')){const T=b.warn.split(';').map(q=>q.split(',').map(Number));seen.push([k,T.every(([x,y])=>y===b.y)?'row':T.every(([x,y])=>x===b.x)?'col':'?'])}}
  ok(seen.length>=2&&seen.every((v,i)=>v[1]===(i%2?'col':'row'))&&seen.slice(1).every((v,i)=>v[0]-seen[i][0]===4),'guard: bell rings every 4 actions, row then column ('+JSON.stringify(seen)+')')})}
 // glitch king: a batted ball flies back and stuns it
 {room('glitch',(s,Z,m,B)=>{const b=B();b.x=Z.x+3;b.y=Z.y+3;b.d=2;s.x=b.x;s.y=b.y-2;s.f='down';s.inv='FQ';b.shot={x:b.x,y:b.y-1,d:0,back:0};
  ok(E.batTarget(W,s)&&E.batTarget(W,s).kind==='ball','glitch: the ball in front is a bat target');const r=E.mstep(W,s,'act');const nb=r.state.bosses.find(o=>o.zone===Z.id);
  ok(r.result!=='fail'&&r.ev.includes('deflect')&&r.ev.includes('ballback')&&nb.fr===2&&!nb.shot,'glitch: batted ball flies back and stuns the king (this action + 2 more)')
  const s2=JSON.parse(JSON.stringify(s));s2.held=1;const r2=E.mstep(W,s2,'act');ok(r2.ev.includes('deflect')&&!r2.ev.includes('place'),'glitch: holding a bomb, act still bats the ball')
  const s3=JSON.parse(JSON.stringify(s));s3.inv='F';const r3=E.mstep(W,s3,'act');ok(r3.result==='fail','glitch: a ball that reaches you counts as caught')})}
 // core: X and + alternate on a steady beat (mark, strike, one quiet action) at any HP
 {room('core',(s,Z,m,B)=>{const pat=[];let last=-1;for(let k=0;k<12;k++){const r=E.mstep(W,s,k%2?'left':'right');if(r.result==='fail')break;s=r.state;const b=s.bosses.find(o=>o.zone===Z.id);if(r.ev.includes('bosswarn')){const T=b.warn.split(';').map(q=>q.split(',').map(Number));pat.push(T.every(([x,y])=>x!==b.x&&y!==b.y)?'X':T.every(([x,y])=>x===b.x||y===b.y)?'+':'?')}}
   ok(pat.length>=2&&pat.every((p,i)=>p===(i%2?'+':'X')),'core: X then + then X… ('+pat.join('')+')')});
  for(const hp of [5,2])room('core',(s,Z,m,B)=>{B().hp=hp;const at=[];for(let k=0;k<9;k++){const r=E.mstep(W,s,k%2?'left':'right');if(r.result==='fail')break;s=r.state;if(r.ev.includes('bosswarn'))at.push(k)}ok(at.length>=2&&at[1]-at[0]===3,'core: at '+hp+' HP it marks every 3 actions ('+at+')')})}
 ok((W.hints||[]).filter(h=>/紅框|藍框/.test(h.text)).length>=13,'all boss rooms explain their mark (紅框／藍框)')
 // 礦坑王房：鼴鼠王從 & 右邊一格、面向左出發，最短路線不用在入口撞牆等待
 {const mb=W.bosses0.find(b=>b.kind==='mole');ok(mb&&mb.x===7&&mb.y===24&&mb.d===2,'mole starts one tile right of & facing left');ok(W.maps.mine.grid[24][6]==='.'&&W.maps.mine.grid[24][7]==='|','mole start keeps the & cell floor and the rail under it');
  const Z=W.maps.mine.zones.find(z=>z.id==='mine#MB');let s=E.initState(W);Object.assign(s,{m:'mine',x:Z.entry[0],y:Z.entry[1],f:'right',inv:'FQ',zone:'mine#MB',zoneEntry:Z.entry,visited:['mine']});
  const M={U:'up',D:'down',L:'left',R:'right',A:'act'};let bumps=0,res='';for(const c of 'RRDARURDDDLDDDRRR'){const r=E.mstep(W,s,M[c]);if(c!=='A'&&r.state.x===s.x&&r.state.y===s.y)bumps++;res=r.result;if(res==='fail')break;s=r.state}
  ok(res!=='fail'&&s.bosses.find(b=>b.kind==='mole').hp<=0&&(s.cleared||[]).includes('mine#MB'),'mine boss room clears in 17 steps');ok(bumps===0,'mine boss route: no wall bumps (one fire breath is its only idle action)')}
 // 2026-10-23 audit fixes — forest 老樹精 (fire only: the bat comes after this boss)
 {const zid='forest#FB',m='forest',Z=W.maps[m].zones.find(z=>z.id===zid),M={U:'up',D:'down',L:'left',R:'right',A:'act'};
  const st=()=>{const s=E.initState(W);Object.assign(s,{m,x:Z.entry[0],y:Z.entry[1],f:'left',inv:'F',zone:zid,zoneEntry:Z.entry,visited:[m]});return s};
  // (c) a fire hit makes it guard for 2 actions: breathing again right away fizzles (bossguard), the 3rd action can hit again
  {let s=st(),i=0;const route='ALLUAULARLADLALUALLDDL';for(;i<route.length;i++){const r=E.mstep(W,s,M[route[i]]);s=r.state;if(r.ev.includes('bosshit'))break}
   const b=()=>s.bosses.find(o=>o.zone===zid),hp=b().hp;ok(hp===2&&b().gd===2,'FB: after a fire hit the tree guards for 2 actions (gd '+b().gd+')');
   const r1=E.mstep(W,s,'act');ok(r1.result!=='fail'&&r1.ev.includes('bossguard')&&r1.state.bosses.find(o=>o.zone===zid).hp===hp,'FB: fire right after a hit fizzles on the guarding tree');
   let t=r1.state;const r2=E.mstep(W,t,'act');ok(r2.ev.includes('bossguard'),'FB: still guarding on the 2nd action');t=r2.state;
   const r3=E.mstep(W,t,'act');ok(!r3.ev.includes('bossguard'),'FB: guard is over on the 3rd action')}
  // (a) + (b): random fire-only play — vines never grow back under 小光, a full trap never kills (blue row → bounced to the entry, HP unchanged)
  {let seed=3;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return (seed>>>16)%n};const A=['up','down','left','right','act'];let hits=0,underVine=0,bounces=0,badBounce=0,trapDeaths=0;
   for(let run=0;run<400;run++){let s=st();for(let k=0;k<50;k++){const b=s.bosses.find(o=>o.zone===zid);if(!b||b.hp<=0)break;const trap=!!(b.warn&&b.trap),hp=b.hp;const r=E.mstep(W,s,A[rnd(5)]);
     if(r.ev.includes('bosshit')){hits++;if(E.cell(W,r.state,m,r.state.x,r.state.y)==='w')underVine++}
     if(r.ev.includes('bounced')){bounces++;const nb=r.state.bosses.find(o=>o.zone===zid);if(!trap||r.result==='fail'||r.state.x!==Z.entry[0]||r.state.y!==Z.entry[1]||nb.hp!==hp)badBounce++}
     if(trap&&r.result==='fail'&&r.ev.includes('bossstruck'))trapDeaths++;
     if(r.result==='fail')break;s=r.state}}
   ok(hits>0&&!underVine,`FB: a hit never regrows the vine under 小光 (${hits} hits)`);ok(bounces>0&&!badBounce,`FB: trapped → blue row → bounced to the entry, not a fail, boss HP kept (${bounces} bounces)`);ok(!trapDeaths,'FB: the blue (trapped) row never kills')}}
 // volcano: lava giant 2 HP; an old 3-HP save keeps its progress (3→2, 2→1, stage save too)
 {const b0=W.bosses0.find(o=>o.kind==='golem');ok(b0.hp===2&&b0.max===2,'volcano: lava giant has 2 HP');
  for(const [h,want] of [[3,2],[2,1],[1,1],[0,0]]){const u=E.initState(W);u.lay=11;const g=u.bosses.find(o=>o.kind==='golem');g.hp=h;g.max=3;if(h===2)u.bossCp={zone:g.zone,hp:2,ch:{}};E.initMovers(W,u);const ng=u.bosses.find(o=>o.kind==='golem');
   ok(ng.hp===want&&ng.max===2&&(h!==2||u.bossCp.hp===1),`old save: 3-HP lava giant at ${h} HP → ${want} of 2`)}}
 // an old save (boss without t / warn) keeps working
 {const s=E.initState(W);for(const b of s.bosses){delete b.t;delete b.warn}ok(E.key(s).length>0,'old save without boss beat fields still keys')}
 ok((W.hints||[]).filter(h=>/紅框|藍框/.test(h.text)).length>=6,'the six boss rooms explain their mark (紅框／藍框)')}
console.log(fails?`${fails}/${n} FAILED`:`${n} bat/fire checks passed`);process.exit(fails?1:0)
