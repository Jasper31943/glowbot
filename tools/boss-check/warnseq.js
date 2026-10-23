global.window=global;const E=require('/workspace/robot-maze/world-engine.js');const W=E.parseWorld(require('/workspace/robot-maze/world/world-def.js'));
const C={up:'U',down:'D',left:'L',right:'R',act:'A'};
for(const zid of process.argv.slice(2)){const m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);let best=null;
 // BFS over short sequences: first state where the boss shows a warning that covers at least 2 tiles or the robot's neighbourhood
 const s0=E.initState(W);Object.assign(s0,{m,x:Z.entry[0],y:Z.entry[1],f:Z.entry[0]===Z.x?'right':'left',inv:'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});
 let q=[[s0,'']];for(let d=0;d<8&&!best;d++){const nq=[];for(const [t,p] of q){for(const a of ['right','left','down','up','act']){const r=E.mstep(W,t,a);if(r.result==='fail'||r.state.zone!==zid)continue;const b=r.state.bosses.find(o=>o.zone===zid);
   if(b.warn&&d>=2&&Math.abs(r.state.x-Z.entry[0])+Math.abs(r.state.y-Z.entry[1])>=2){best=p+C[a];break}nq.push([r.state,p+C[a]])}if(best)break}q=nq.slice(0,3000)}
 console.log(zid,best,JSON.stringify({m,x:Z.entry[0],y:Z.entry[1],f:Z.entry[0]===Z.x?'right':'left',inv:'FQ',visited:[m]}))}
