#!/usr/bin/env node
// Verify the big map: item reachability, min actions, soft-lock check.  usage: node tools/solve-world.js
const E=require('../world-engine.js'),W=E.parseWorld(require('../world/world-def.js'));W.solverAbstract=true;
const t0=Date.now(),lap=()=>((Date.now()-t0)/1000).toFixed(1)+'s';
console.log('errors:',W.errors.length?W.errors:'none');
for(const k in W.maps)for(const z of W.maps[k].zones)if(z.w>7)console.log('ZONE WIDER THAN 7:',z.id,z.w);
const q=(name,pred,start)=>{const p=E.bfsPath(W,start||null,pred,3000000);console.log(name.padEnd(34),p?p.length+' actions':'UNREACHABLE',lap());return p};
q('cyan key c',s=>E.hasInv(s,'c'));
q('secret bolt outside zones (row12)',s=>s.m==='grass'&&s.got.some(k=>k==='grass:6,12'));
q('tunnel 1 -> ice map',s=>s.m==='ice');
q('ice cave without claws (must fail)',s=>s.m==='ice'&&s.y===6);
const st=E.initState(W);st.inv='k';q('ice cave WITH claws (from start)',s=>s.m==='ice'&&s.y===6,st);
const r=E.softlocks(W,s=>s.m==='ice',null,3000000);console.log('soft-lock check: reachable states',r.reachable,'softlocked',r.softlocked,r.truncated?'TRUNCATED':'',lap());
if(r.example)console.log('example softlocked state:',JSON.stringify(r.example));
