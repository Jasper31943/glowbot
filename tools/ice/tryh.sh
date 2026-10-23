python3 - "$@" <<'P'
import sys,json,re
rows=sys.argv[1:];s=open('/tmp/ice/build.py').read()
s=re.sub(r"paste\('H 雪球巡邏（新）',\[.*?\],2,10",lambda m:"paste('H 雪球巡邏（新）',"+json.dumps(rows)+",2,10",s,flags=re.S)
open('/tmp/ice/build.py','w').write(s)
P
python3 build.py >/dev/null && python3 mktxt.py
cat > /tmp/ice/h.js <<'J'
const C=require('/tmp/ice/check-ice.js');const i=C.areas.findIndex(a=>a.id==='H'),A=C.areas[i];
const r=C.bfs({rect:i,start:A.en,keys:'cm',claws:true},s=>s.p===A.ex,1e6);console.log(process.env.PATCH?'no box  ':'with box',r&&r.n);
if(!process.env.PATCH){const b=[];for(let q=0;q<C.W*C.H;q++)if(C.T(q)==='B'&&C.zoneOf(q)===i)b.push([Math.floor(q/C.W),q%C.W,'.']);console.log(JSON.stringify(b))}
J
O=$(node /tmp/ice/h.js); echo "$O" | head -1; PATCH="$(echo "$O" | tail -1)" node /tmp/ice/h.js
