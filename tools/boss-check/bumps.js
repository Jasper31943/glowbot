global.window=global;const E=require((process.env.ENG||'/workspace/robot-maze')+'/world-engine.js');const W=E.parseWorld(require('/workspace/robot-maze/world/world-def.js'));
const zid=process.argv[2],m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);
if(process.env.BOSSOV){const [bx,by,bd]=process.env.BOSSOV.split(',').map(Number);for(const b of W.bosses0)if(b.zone===zid)Object.assign(b,{x:bx,y:by,d:bd})}
let s=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s,{m,x:ex,y:ey,f:ex===Z.x?'right':'left',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});
const M={U:'up',D:'down',L:'left',R:'right',A:'act',w:'wait'};let bumps=[],res='',i=0;
for(const c of process.argv[3]){const r=E.mstep(W,s,M[c]);if(c!=="A"&&r.state.x===s.x&&r.state.y===s.y&&r.state.m===s.m)bumps.push(i+c);res=r.result;i++;if(r.result!=='ok'&&r.result!=='moved'&&r.result!=='push'){}s=r.state;if(res==='fail')break}
console.log(process.env.BOSSOV||'base',res,'zone',s.zone,'bumps',bumps.length,bumps.join(' '))
