global.window=global;const E=require((process.env.ENG||'/workspace/robot-maze')+'/world-engine.js');const W=E.parseWorld(require('/workspace/robot-maze/world/world-def.js'));
const zid=process.argv[2],m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);let s=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s,{m,x:ex,y:ey,f:ex===Z.x?'right':'left',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});
const M={U:'up',D:'down',L:'left',R:'right',A:'act',w:'wait'},C={};let res='';for(const c of process.argv[3]){const r=E.mstep(W,s,M[c]);for(const e of r.ev)if(/boss|gust|flip|crash|deflect|ballback|bump/.test(e))C[e]=(C[e]||0)+1;res=r.result;if(r.result==='fail')break;s=r.state}
console.log(zid,res,'zone now',s.zone,JSON.stringify(C))
