// node replay.js engineDir zone route → counts bumps / idle acts / waits, verifies clear
global.window=global;const dir=process.argv[2];const E=require(dir+'/world-engine.js');const W=E.parseWorld(require(dir+'/world/world-def.js'));
const zid=process.argv[3],m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);let s=E.initState(W);const [ex,ey]=Z.entry;
Object.assign(s,{m,x:ex,y:ey,f:ex===Z.x?'right':ex===Z.x+Z.w-1?'left':ey===Z.y?'down':'up',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});const bi=s.bosses.findIndex(b=>b.zone===zid);
const M={U:'up',D:'down',L:'left',R:'right',A:'act',w:'wait'};let bumps=0,idle=0,waits=0,warns=0,res='';
for(const c of process.argv[4]){const r=E.mstep(W,s,M[c]);if(r.result==='bump')bumps++;if(c==='w')waits++;if(c==='A'&&!r.ev.some(e=>/grab|place|swing|fire|lever|mirror|gen|switch/.test(e)))idle++;if(r.ev.includes('bosswarn'))warns++;s=r.state;if(r.result==='fail'){res='FAIL '+r.ev;break}}
console.log(zid,process.argv[4],'len',process.argv[4].length,'bumps',bumps,'idleAct',idle,'waits',waits,'warnings',warns,'bossHP',s.bosses[bi].hp,'atExit',s.x===Z.exit[0]&&s.y===Z.exit[1],res);
