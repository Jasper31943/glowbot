const C=require('/tmp/ice/check-ice.js');const i=C.areas.findIndex(a=>a.id==='H'),A=C.areas[i];
const r=C.bfs({rect:i,start:A.en,keys:'cm',claws:true},s=>s.p===A.ex,1e6);console.log(process.env.PATCH?'no box  ':'with box',r&&r.n);
if(!process.env.PATCH){const b=[];for(let q=0;q<C.W*C.H;q++)if(C.T(q)==='B'&&C.zoneOf(q)===i)b.push([Math.floor(q/C.W),q%C.W,'.']);console.log(JSON.stringify(b))}
