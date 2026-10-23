const fs=require('fs'),E=require('../world-engine.js'),W=E.parseWorld(require('../world/world-def.js'));
const route=JSON.parse(fs.readFileSync('/tmp/route.out','utf8')).toIce;const M={U:'up',D:'down',L:'left',R:'right',A:'act',Z:'reset'};
let s=E.initState(W),out=[];
[...route].forEach((k,i)=>{const pb=s.bombs.length,ph=s.held;const r=E.step(W,s,M[k]);const ev=(r.ev||[]).join(',');s=r.state;
 let tag='';if(k==='A'&&ph&&!s.held)tag=' PLACE bomb';if(k==='A'&&!ph&&s.held)tag=' PICKUP bomb';if(/blast|boom|explo/.test(ev))tag+=' EXPLOSION';
 out.push(`${String(i+1).padStart(3)} ${M[k].padEnd(5)} -> ${s.m} row ${s.y+1} col ${s.x+1}  [${r.result}${ev?' '+ev:''}]${tag}${s.zone?' zone '+s.zone:''}`)});
fs.writeFileSync(__dirname+'/../world/route-119.txt','# 119-action route start -> tunnel 1 (rows/cols 1-based, like grass.txt)\n'+out.join('\n')+'\n');
console.log(out.filter(l=>/PLACE|PICKUP|EXPLO|reset|tunnel/.test(l)).join('\n'));
