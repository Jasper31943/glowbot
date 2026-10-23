// node sim.js zone 'route' [inv]  — prints the room after each step (R robot, K boss, * bomb)
global.window=global;const E=require('/workspace/robot-maze/world-engine.js');const W=E.parseWorld(require('/workspace/robot-maze/world/world-def.js'));
const zid=process.argv[2],m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);let s=E.initState(W);const [ex,ey]=Z.entry;
Object.assign(s,{m,x:ex,y:ey,f:ex===Z.x?'right':'left',inv:process.argv[4]||'FQ',zone:zid,zoneEntry:Z.entry,visited:[m]});
const M={U:'up',D:'down',L:'left',R:'right',A:'act',w:'wait'};const bi=s.bosses.findIndex(b=>b.zone===zid);
const show=(t,lab,r)=>{const b=t.bosses[bi];console.log(lab,r?r.result+' ['+r.ev.join(',')+']':'','boss',b.x,b.y,'d'+b.d,'hp'+b.hp,'fr'+(b.fr||0),'held'+t.held,'gen'+(t.gen||0));
 for(let y=Z.y;y<Z.y+Z.h;y++){let l='';for(let x=Z.x;x<Z.x+Z.w;x++){l+=t.x===x&&t.y===y?'R':b.hp>0&&b.x===x&&b.y===y?'K':t.bombs.some(o=>o.x===x&&o.y===y)?'*':E.cell(W,t,m,x,y)}console.log('   '+l)}};
show(s,'start');let i=0;for(const c of process.argv[3]){const r=E.mstep(W,s,M[c]);s=r.state;show(s,(++i)+' '+c,r);if(r.result==='fail'){console.log('FAIL');break}}
