const C=require('./check-ice.js');const {S0,step,key}=C.mk({start:C.start,keys:'c'});
const goal=s=>s.p===C.t2; // tunnel 2 mouth: needs claws, m, and the rune fragment f to remove R
const t0=Date.now();const id=new Map(),st=[],edges=[];const add=s=>{const k=key(s);let i=id.get(k);if(i==null){i=st.length;id.set(k,i);st.push(s);edges.push([])}return i};
add(S0);let best=null;const dist=[0];
for(let i=0;i<st.length;i++){const s=st[i];if(goal(s)&&best==null)best=dist[i];if(C.T(s.p)==='1'&&i>0)continue;
 for(let a=0;a<7;a++){const t=step(s,a);if(!t||t==='fail')continue;const n=st.length;const j=add(t);if(j===n)dist[j]=dist[i]+1;edges[i].push(j)}
 if(st.length>4e6){console.log('TRUNCATED');break}}
console.log('reachable states',st.length,'| min steps T1 -> tunnel 2 mouth (k, m, fragment f, rune stone removed):',best,((Date.now()-t0)/1000).toFixed(1)+'s');
// reverse reachability to goal
const rev=st.map(()=>[]);edges.forEach((es,i)=>es.forEach(j=>rev[j].push(i)));
const ok=new Uint8Array(st.length);const q=[];st.forEach((s,i)=>{if(goal(s)){ok[i]=1;q.push(i)}});
while(q.length){const j=q.pop();for(const i of rev[j])if(!ok[i]){ok[i]=1;q.push(i)}}
const bad=[];st.forEach((s,i)=>{if(!ok[i]&&!(C.T(s.p)==='1'))bad.push(i)});
console.log('soft-locked states (cannot reach goal):',bad.length);
if(bad.length){const s=st[bad[0]];console.log('example',JSON.stringify({r:Math.floor(s.p/C.W)+1,c:s.p%C.W+1,keys:s.keys,claws:s.claws,cleared:s.cleared.toString(2),boxes:s.boxes.map(q=>[Math.floor(q/C.W)+1,q%C.W+1])}))}
// shortcut: from goal state, back to T1
const g=st.find(goal);let r=null;{const seen=new Set([key(g)]);let fr=[g],n=0;while(fr.length&&r==null){const nx=[];for(const s of fr){if(s.p===C.start){r=n;break}for(let a=0;a<7;a++){const t=step(s,a);if(!t||t==='fail')continue;const k=key(t);if(!seen.has(k)){seen.add(k);nx.push(t)}}}fr=nx;n++}}
console.log('shortcut: tunnel 2 mouth -> tunnel 1 (back to grass):',r,'steps');
// without m: is the M door shortcut closed? (from start, can we reach T1-side corridor row 27 col 2 region via north?)
console.log('box-out-of-zone attempts blocked:',C.viol.size);
