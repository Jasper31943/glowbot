const E=require('/workspace/robot-maze/world-engine.js');const W=E.parseWorld(require('/workspace/robot-maze/world/world-def.js'));W.solverAbstract=true;
const t1=W.tunnels['1'].find(p=>p.m==='ice');let s=E.initState(W);s.m='ice';s.x=t1.x;s.y=t1.y;s.inv='c';s.zone=null;s.visited.push('ice');s.boxes=s.boxes;
const R=W.maps.ice.grid.findIndex(r=>r.includes('R'));const rx=W.maps.ice.grid[R].indexOf('R');
const goals=['A','B','C','D','E','F','G','H','I'].map(z=>x=>x.cleared.indexOf('ice#'+z)>=0).concat([x=>{const t=W.tunnels['2'][0];return x.m==='ice'&&x.x===t.x&&x.y===t.y}]);
const C={up:'U',down:'D',left:'L',right:'R',act:'A',reset:'Z',wait:'W'};let all=[],per=[];
for(const g of goals){const t0=Date.now();const p=E.bfsPath(W,s,g,2e6);if(!p){console.log('STUCK at segment',per.length);process.exit(1)}
 for(const a of p){const r=E.mstep(W,s,a);s=E.normalize(W,r.state)}per.push(p.length);all=all.concat(p);console.log('segment',per.length,p.length,'actions',(Date.now()-t0)/1000+'s')}
console.log('total',all.length,'per segment',per.join(' '),'inv',s.inv);require('fs').writeFileSync('/tmp/iceroute.txt',all.map(a=>C[a]).join(''));console.log(all.map(a=>C[a]).join(''));
