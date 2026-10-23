// node test-world.js — big-map engine unit tests + solver checks on world/test-map.js
const E=require('./world-engine.js'),assert=require('assert');let n=0;const T=(name,f)=>{const t=Date.now();f();n++;console.log('ok',name,(Date.now()-t)+'ms')};
const mk=(grid,extra)=>E.parseWorld({maps:{A:{grid,zones:(extra&&extra.zones)||[]}},...(extra||{})});
const run=(W,acts,s)=>{s=s||E.initState(W);let r;for(const a of acts){r=E.step(W,s,a);s=r.state}return{s,r}};
T('tunnel digits must appear exactly twice',()=>{assert.ok(mk(["#####","#S1.#","#####"]).errors.some(e=>/tunnel 1/.test(e)));assert.equal(mk(["######","#S1.1#","######"]).errors.length,0)});
T('zone size limit 7x8',()=>{assert.ok(mk(["##########","#S.......#","##########"],{zones:[{r1:1,r2:3,c1:1,c2:9}]}).errors.length===1)});
T('bomb rules: bump turns to face; act grabs; place on faced cell; moves never tick; real-time fuse 3,2,1 then boom at 3.0s; blast breaks cracked',()=>{
 const W=mk(["########","#S...%.#","#b.....#","########"]);
 let {s,r}=run(W,['down']);assert.equal(r.result,'bump');assert.equal(s.f,'down');
 ({s,r}=run(W,['act'],s));assert.equal(s.held,1);({s,r}=run(W,['act'],s));assert.equal(s.held,1,'max one bomb');
 ({s,r}=run(W,['right','right','act'],s));assert.deepEqual([s.bombs[0].x,s.bombs[0].y,s.bombs[0].t],[4,1,3],'placing does not count');assert.equal(s.held,0);
 ({s,r}=run(W,['left','down','left'],s));assert.equal(s.bombs[0].t,3,'moves/bumps do not tick');
 const adv=dt=>{r=E.advance(W,s,dt);s=r.state};adv(1000);assert.equal(s.bombs[0].t,2);adv(1000);assert.equal(s.bombs[0].t,1);assert.equal(E.FUSE_MS,3000);
 adv(999);assert.equal(s.bombs.length,1,'still showing 1');assert.equal(s.bombs[0].t,1);adv(1);assert.equal(s.bombs.length,0,'exploded');assert.ok(r.ev.indexOf('blast')>=0);
 assert.deepEqual(s.broken,['A:5,1']);assert.equal(E.solid(W,s,'A',5,1),false);
 ({s,r}=run(W,['right','right','right'],s));assert.equal(E.step(W,s,'act').result,'noop','placed bomb gone; nothing to grab');});
T('bomb: robot in blast = fail; bombs do not press switches; placed bomb cannot be re-grabbed',()=>{
 let W=mk(["#######","#S....#","#b....#","#######"]);let x=run(W,['down','act','right','act']);assert.equal(E.advance(W,x.s,E.FUSE_MS).result,'fail');
 W=mk(["#########","#S.X..D.#","#b......#","#########"]);x=run(W,['down','act','right','act']);assert.deepEqual([x.s.bombs[0].x,x.s.bombs[0].y],[3,1]);assert.equal(E.switchDoorOpen(W,x.s,'A',6,1),false);
 assert.equal(x.s.held,0);const y=E.step(W,x.s,'act');assert.equal(y.state.held,0);});
T('box/bomb slide on ice until hitting something; never onto hazard or tunnel',()=>{
 const W=mk(["#########","#.SB.III#","#.......#","#########"]);let s=run(W,['right']).s;assert.deepEqual(s.boxes,['A:4,1']);
 s=run(W,['right','right']).s;assert.deepEqual(s.boxes,['A:7,1']);
 const Wb=mk(["#########","#S..III.#","#b......#","#########"]);s=run(Wb,['down','act','right','act']).s;assert.deepEqual([s.bombs[0].x,s.bombs[0].y],[3,1]);
 s=run(Wb,['right'],s).s;assert.deepEqual([s.bombs[0].x,s.bombs[0].y,s.bombs[0].t],[7,1,3],'pushed bomb slid across ice (push does not tick)');
 assert.equal(run(mk(["#######","#SBH..#","#######"]),['right']).r.result,'bump');assert.equal(run(mk(["########","#SB1..1#","########"]),['right']).r.result,'bump');});
T('ice claws stop normal ice but not hard ice J',()=>{const W=mk(["#######","#SkIII#","#.JJJ.#","#######"]);let {s}=run(W,['right','right']);assert.deepEqual([s.x,s.y],[3,1]);
 s.x=1;s.y=2;s=E.step(W,s,'right').state;assert.deepEqual([s.x,s.y],[5,2]);
 const {s:t}=run(W,['down','right']);assert.deepEqual([t.x,t.y],[5,2]);});
T('keys are not consumed',()=>{const W=mk(["########","#Sc.C.C#","########"]);const {s}=run(W,['right','right','right','right','right']);assert.deepEqual([s.x,s.y],[6,1]);assert.ok(E.hasInv(s,'c'))});
T('tunnel teleports across maps; items persist',()=>{const W=E.parseWorld({maps:{A:{grid:["#####","#Sc1#","#####"]},B:{grid:["#####","#1..#","#####"]}}});const {s,r}=run(W,['right','right']);
 assert.equal(r.result,'tunnel');assert.equal(s.m,'B');assert.deepEqual([s.x,s.y],[1,1]);assert.ok(E.hasInv(s,'c'));});
T('zone reset restores only that zone (boxes, broken walls), keeps items',()=>{const W=mk(["#########","#S.B..#.#","#.....c.#","#########"],{zones:[{r1:2,r2:3,c1:2,c2:8}]});
 let {s}=run(W,['right']);assert.ok(s.zone);({s}=run(W,['right','right','down','right','right'],s));assert.ok(E.hasInv(s,'c'));assert.notDeepEqual(s.boxes,W.boxes0);
 const r=E.step(W,s,'reset');assert.deepEqual(r.state.boxes,W.boxes0);assert.ok(E.hasInv(r.state,'c'));assert.deepEqual([r.state.x,r.state.y],[1,1]);});
T('zone limit applies only inside zone; upgrade +10',()=>{const W=mk(["#########","#S......#","#########"],{zones:[{r1:2,r2:2,c1:3,c2:5,limit:2}]});let {s}=run(W,['right']);assert.equal(s.left,2);
 ({s}=run(W,['right','right'],s));assert.equal(s.left,0);assert.equal(E.step(W,s,'right').result,'tired');});
// --- patrol (snowball P)
T('patrol: moves per move/bump/act (not on wait), turns at box, caught = fail',()=>{const W=mk(["#######","#S....#","##.####","#P...B#","#######"]);
 let s=E.initState(W);assert.deepEqual([s.pats[0].x,s.pats[0].y],[1,3]);
 let r=E.step(W,s,'up');assert.equal(r.result,'bump');assert.equal(r.state.pats[0].x,2,'bump moves patrol');
 r=E.step(W,r.state,'act');assert.equal(r.state.pats[0].x,2,'noop act does not move it');
 s=r.state;for(let i=0;i<3;i++){r=E.step(W,s,'left');s=r.state}assert.equal(s.pats[0].x,3,'turned at the box (col 5) and came back');
 const w=E.mstep(W,s,'wait');assert.equal(w.result,'noop','wait without bombs is a noop');
 // walk into its lane in front of it -> caught
 let W2=mk(["#####","#S..#","#.#.#","#P..#","#####"]);s=E.initState(W2);s.y=2;s.pats[0].x=2;s.pats[0].d=-1;r=E.step(W2,s,'down');assert.equal(r.result,'fail');assert.ok(r.ev.indexOf('caught')>=0)});
T('patrol: killed by blast cross, resets on zone reset and when leaving the zone',()=>{const W=mk(["#########","#Sb.....#","####....#","#...P...#","#########"],{zones:[{r1:3,r2:5,c1:4,c2:9,entry:[3,6]}]});
 let s=E.initState(W);s.x=5;s.y=2;s.zone=W.maps.A.zones[0].id;s.zoneEntry=[5,2];s.pats[0].x=4;s.pats[0].y=3;s.bombs=[{m:'A',x:5,y:3,t:3,ms:0}];
 let r=E.advance(W,s,4000);assert.ok(r.ev.indexOf('defeat')>=0);assert.equal(r.state.pats.length,0);assert.equal(r.result,'fail','robot at (5,2) was in the cross too');s=r.state;
 const back=E.step(W,s,'reset');assert.equal(back.state.pats.length,1,'zone reset revives it');
 s=E.initState(W);s.x=5;s.y=2;E.step(W,s,'up');s.zone=W.maps.A.zones[0].id;s.pats[0].x=6;const out=E.step(W,s,'up').state;assert.equal(out.pats[0].x,4,'leaving resets its position')});
T('rune stone: solid without fragment; walk into it or act with fragment removes it',()=>{const W=E.parseWorld({maps:{t:{grid:["#####","#SR.#","#####"]}},runeItem:'f'});
 let s=E.initState(W);assert.equal(E.step(W,s,'right').state.x,1);s.inv='f';let r=E.step(W,s,'right');assert.ok(r.ev.indexOf('rune')>=0);r=E.step(W,r.state,'right');assert.equal(r.state.x,2);
 s=E.initState(W);s.inv='f';s.f='right';r=E.step(W,s,'act');assert.ok(r.ev.indexOf('rune')>=0)});
// --- the real world (grass.txt + ice.txt)
const W=E.parseWorld(require('./world/world-def.js'));W.solverAbstract=true;
T('world (grass.txt + ice.txt) parses cleanly; tunnel 1 links grass<->ice',()=>{assert.deepEqual(W.errors,[]);assert.deepEqual(W.tunnels['1'].map(p=>p.m).sort(),['grass','ice'])});
T('ice: zone-by-zone route from tunnel 1 to tunnel 2 (claws, m, fragment, rune removed)',()=>{const t1=W.tunnels['1'].find(p=>p.m==='ice');let s=E.initState(W);s.m='ice';s.x=t1.x;s.y=t1.y;s.inv='c';s.zone=null;
 const per=[];for(const z of 'ABCDEFGHI'){const p=E.bfsPath(W,s,x=>x.cleared.indexOf('ice#'+z)>=0,2e6);assert.ok(p,'zone '+z);per.push(z+':'+p.length);
  if(z==='I'){const nk=E.initState(W);Object.assign(nk,E.normalize(W,s));nk.inv=nk.inv.replace('k','');assert.equal(E.bfsPath(W,nk,x=>x.cleared.indexOf('ice#I')>=0,3e5),null,'zone I needs claws')}
  for(const a of p)s=E.normalize(W,E.mstep(W,s,a).state)}
 const t2=W.tunnels['2'][0];const p=E.bfsPath(W,s,x=>x.x===t2.x&&x.y===t2.y,2e5);assert.ok(p);for(const a of p)s=E.mstep(W,s,a).state;assert.ok(E.hasInv(s,'f'),'fragment picked up');assert.ok(s.broken.some(k=>k.startsWith('ice:')&&W.maps.ice.grid[+k.split(',')[1]][+k.split(':')[1].split(',')[0]]==='R'),'rune stone removed');
 console.log('   ice actions per zone',per.join(' '),'| to tunnel 2',p.length)});
if(process.env.FULL){
T('grass: cyan key and tunnel 1 reachable',()=>{const p1=E.bfsPath(W,null,s=>E.hasInv(s,'c'),3000000);assert.ok(p1);const p2=E.bfsPath(W,null,s=>s.m==='ice',3000000);assert.ok(p2);console.log('   key',p1.length,'| to ice',p2.length)});}
else console.log('   (set FULL=1 for the slow whole-grass solver checks)');
console.log(n+' tests passed');
