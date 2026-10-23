global.window=global;const E=require('/workspace/robot-maze/world-engine.js');const W=E.parseWorld(require('/workspace/robot-maze/world/world-def.js'));
const ACT=['up','down','left','right','act','act','wait'];let seed=7;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed%n};
for(const zid of process.argv[2].split(',')){const m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);const C={};let fails=0,strDeaths=0,wins=0;
 for(let run=0;run<3000;run++){let s=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s,{m,x:ex,y:ey,f:ex===Z.x?'right':'left',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});
  for(let i=0;i<80;i++){const r=E.mstep(W,s,ACT[rnd(ACT.length)]);if(r.result==='noop'||r.result==='fall')continue;for(const e of r.ev)if(/boss|gust|flip|crash|deflect|ballback|fizzle|tide/.test(e))C[e]=(C[e]||0)+1;
   if(r.result==='fail'){fails++;if(r.ev.includes('bossstruck'))strDeaths++;break}s=r.state;if(s.zone!==zid){wins++;break}}}
 console.log(zid,'fails',fails,'strikeDeaths',strDeaths,'left',wins,JSON.stringify(C))}
