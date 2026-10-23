// replay a route in a boss room and draw it. usage: ROOT=... node trace.js factory#FB ROUTE [INV]
global.window=global;const ROOT=process.env.ROOT||'/workspace/robot-maze';const E=require(ROOT+'/world-engine.js'),W=E.parseWorld(require(ROOT+'/world/world-def.js'));
const [zid,route,inv]=process.argv.slice(2);const m=zid.split('#')[0],Z=W.maps[m].zones.find(z=>z.id===zid);
const inZ=k=>{if(!k.startsWith(m+':'))return false;const [x,y]=k.slice(m.length+1).split(',').map(Number);return x>=Z.x&&x<Z.x+Z.w&&y>=Z.y&&y<Z.y+Z.h};
let s=E.initState(W);const [ex,ey]=Z.entry;Object.assign(s,{m,x:ex,y:ey,f:'right',inv:inv==null?'FQ':inv,zone:zid,zoneEntry:Z.entry,visited:[m]});
s.boxes=s.boxes.filter(inZ);s.bugs=s.bugs.filter(o=>o.zone===zid);s.bosses=s.bosses.filter(o=>o.zone===zid);s.pats=[];s.cleared=[];
const show=s=>{const o=[];for(let y=Z.y;y<Z.y+Z.h;y++){let r='';for(let x=Z.x;x<Z.x+Z.w;x++){let c=E.cell(W,s,m,x,y);const b=s.bombs.find(q=>q.x===x&&q.y===y);if(b)c=String(b.t);
 const B=s.bosses.find(q=>q.hp>0&&q.x===x&&q.y===y);if(B)c='¥';if(s.bosses.some(q=>q.shot&&q.shot.x===x&&q.shot.y===y))c='o';if(s.x===x&&s.y===y)c=s.held?'@':'R';r+=c}o.push(r)}return o.join('\n')};
const M={U:'up',D:'down',L:'left',R:'right',A:'act',w:'wait'};console.log(show(s));
for(const ch of route){const r=E.mstep(W,s,M[ch]);s=r.state||s;const b=s.bosses[0];console.log('\n'+ch,r.result,r.ev.filter(e=>!['zone'].includes(e)).join(','),'hp',b.hp,'f',b.fr||0,b.warn?'warn':'');console.log(show(s))}
