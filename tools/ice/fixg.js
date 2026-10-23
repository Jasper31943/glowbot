const C=require('./check-ice.js');const gi=C.areas.findIndex(a=>a.id==='G');const A=C.areas[gi];
const Is=[];for(let r=A.r1;r<=A.r2;r++)for(let c=A.c1;c<=A.c2;c++)if(C.grid[r][c]==='I')Is.push([r,c]);
const res=[];
for(let m=0;m<(1<<Is.length);m++){const patch=Is.filter((_,i)=>m>>i&1);
 const orig=C.grid.slice();patch.forEach(([r,c])=>{const a=C.grid[r].split('');a[c]='.';C.grid[r]=a.join('')});
 const r=C.bfs({rect:gi,start:A.en,keys:'cm'},s=>s.p===A.ex,3e5);
 for(let i=0;i<orig.length;i++)C.grid[i]=orig[i];
 if(r&&r.n>0)res.push([patch.length,r.n,JSON.stringify(patch)]);}
res.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);console.log(res.slice(0,8).join('\n'));
