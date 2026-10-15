// Pure game logic (shared by browser and Node: solve.js, test-logic.js)
(function(root){
const LEVELS=(typeof module!=='undefined')?require('./levels.js'):root.LEVELS;
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const KEYCOL={c:'cyan',m:'purple',n:'pink'};
const isKeyDoor=c=>c==='C'||c==='M'||c==='N';
const PICK={E:1,g:1,c:1,m:1,n:1,'*':1};
function parse(lv){let rows=lv.map.slice(),limit=0;
 if(/^limit=\d+/.test(rows[0])){limit=+rows[0].split('=')[1];rows.shift()}
 const g=rows.map(r=>r.split(''));const W=Math.max(...rows.map(r=>r.length)),H=g.length;
 const s={x:0,y:0,boxes:[],keys:'',got:[],open:[],glove:false,left:limit||null,t:0,holes:[],filled:[]};const patrols=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x]||'#';g[y][x]=c;
  if(c==='S'){s.x=x;s.y=y;g[y][x]='.'}if(c==='B'){s.boxes.push([x,y]);g[y][x]='.'}if(c==='P'){patrols.push([x,y]);g[y][x]='.'}}
 let bolts=0;for(const r of g)for(const c of r)if(c==='*')bolts++;
 const L={grid:g,W,H,start:s,limit,patrols:[],bolts};
 // patrol route: ping-pong along the open axis (horizontal preferred)
 L.patrols=patrols.map(([x,y])=>{const wall=(a,b)=>{const c=cell(L,a,b);return c==='#'||c==='D'||isKeyDoor(c)};
  let horiz=!wall(x-1,y)||!wall(x+1,y);const line=[];
  if(horiz){let a=x;while(!wall(a-1,y))a--;for(;!wall(a,y);a++)line.push([a,y])}else{let b=y;while(!wall(x,b-1))b--;for(;!wall(x,b);b++)line.push([x,b])}
  const i0=line.findIndex(p=>p[0]===x&&p[1]===y);const route=line.length>1?line.concat(line.slice(1,-1).reverse()):line;return{route,i0}});
 return L;}
function patrolAt(L,t){return L.patrols.map(p=>p.route[(p.i0+t)%p.route.length])}
function cell(L,x,y){return (y<0||y>=L.H||x<0||x>=L.W)?'#':L.grid[y][x]}
function isHole(st,x,y){return st.holes.indexOf(x+','+y)>=0}
function boltsGot(st){return st.got.filter(k=>k[0]==='*').length}
function hasBox(st,x,y){return st.boxes.findIndex(b=>b[0]===x&&b[1]===y)}
function doorOpen(L,st){for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++)if(L.grid[y][x]==='X'&&hasBox(st,x,y)<0)return false;return true}
function opened(st,x,y){return st.open.indexOf(x+','+y)>=0}
function taken(st,x,y){return st.got.indexOf(x+','+y)>=0||st.got.indexOf('*'+x+','+y)>=0}
function solid(L,st,x,y){const c=cell(L,x,y);if(isHole(st,x,y))return true;if(c==='#'||(c==='D'&&!doorOpen(L,st)))return true;
 if(isKeyDoor(c)&&!opened(st,x,y)&&st.keys.indexOf(c.toLowerCase())<0)return true;return false}
function boxBlocked(L,st,x,y){const c=cell(L,x,y);if(isHole(st,x,y))return false;return solid(L,st,x,y)||hasBox(st,x,y)>=0||c==='G'||c==='D'||c==='H'||isKeyDoor(c)||(PICK[c]&&!taken(st,x,y))}
function enter(L,s,x,y,ev){const c=cell(L,x,y),k=x+','+y;
 if(PICK[c]&&!taken(s,x,y)){s.got.push(c==='*'?'*'+k:k);if(c==='*')ev.push('bolt');if(KEYCOL[c]){s.keys+=c;ev.push('key')}if(c==='E'){if(s.left!=null)s.left+=5;ev.push('battery')}if(c==='g'){s.glove=true;ev.push('glove')}}
 if(isKeyDoor(c)&&!opened(s,x,y)){s.keys=s.keys.replace(c.toLowerCase(),'');s.open.push(k);ev.push('door')}}
function clone(st){return{x:st.x,y:st.y,boxes:st.boxes.map(b=>b.slice()),keys:st.keys,got:st.got.slice(),open:st.open.slice(),glove:st.glove,left:st.left,t:st.t,holes:st.holes.slice(),filled:st.filled.slice()}}
function crumbles(L,s,x,y){return cell(L,x,y)==='O'&&s.filled.indexOf(x+','+y)<0&&!isHole(s,x,y)}
// result: 'move'|'bump'|'win'|'fall'(hazard)|'caught'(patrol)|'tired'(no steps left)
function step(L,st,dir){const [dx,dy]=DIRS[dir];
 if(st.left!=null&&st.left<=0)return{state:st,result:'tired',path:[],boxMoves:[],ev:[]};
 const s=clone(st),ev=[],boxMoves=[];
 const nx=s.x+dx,ny=s.y+dy;if(solid(L,s,nx,ny))return{state:st,result:'bump',path:[],boxMoves,ev};
 const bi=hasBox(s,nx,ny);
 if(bi>=0){const bx=nx+dx,by=ny+dy;if(boxBlocked(L,s,bx,by))return{state:st,result:'bump',path:[],boxMoves,ev};boxMoves.push([[nx,ny],[bx,by]]);
  if(isHole(s,bx,by)){s.boxes.splice(bi,1);s.holes.splice(s.holes.indexOf(bx+','+by),1);s.filled.push(bx+','+by);ev.push('fill')}else s.boxes[bi]=[bx,by];}
 else if(s.glove){const pi=hasBox(s,s.x-dx,s.y-dy);if(pi>=0){boxMoves.push([[s.x-dx,s.y-dy],[s.x,s.y]]);s.boxes[pi]=[s.x,s.y];ev.push('pull')}}
 const leave=[[s.x,s.y]];s.x=nx;s.y=ny;enter(L,s,nx,ny,ev);const path=[[nx,ny]];
 while(cell(L,s.x,s.y)==='I'){const tx=s.x+dx,ty=s.y+dy;if(solid(L,s,tx,ty)||hasBox(s,tx,ty)>=0)break;leave.push([s.x,s.y]);s.x=tx;s.y=ty;enter(L,s,tx,ty,ev);path.push([tx,ty]);if(cell(L,tx,ty)==='H')break;}
 leave.forEach(([x,y])=>{if(crumbles(L,s,x,y)){s.holes.push(x+','+y);ev.push('crumble')}});
 if(s.left!=null)s.left--;
 const before=patrolAt(L,s.t);s.t++;const after=patrolAt(L,s.t);
 const caught=after.some((p,i)=>(p[0]===s.x&&p[1]===s.y)||(before[i][0]===s.x&&before[i][1]===s.y&&p[0]===st.x&&p[1]===st.y)||path.some(q=>q[0]===before[i][0]&&q[1]===before[i][1]));
 const c=cell(L,s.x,s.y);
 return{state:s,result:c==='H'?'fall':caught?'caught':c==='G'?'win':'move',path,boxMoves,ev};}
function key(st){return [st.x,st.y,st.boxes.map(b=>b.join(',')).sort().join(';'),st.keys,st.got.join(';'),st.open.join(';'),st.glove,st.left,st.t,st.holes.slice().sort().join(';'),st.filled.slice().sort().join(';')].join('|')}
function bfs(L,maxStates,allBolts){const lp=L.patrols.reduce((a,p)=>a*p.route.length/gcd(a,p.route.length),1);const norm=s=>{const c=clone(s);c.t=s.t%lp;return key(c)};
 const q=[[L.start,[]]],seen=new Set([norm(L.start)]);let n=0;
 while(q.length){if(maxStates&&++n>maxStates)return null;const [st,p]=q.shift();for(const d in DIRS){const r=step(L,st,d);if(r.result!=='move'&&r.result!=='win')continue;const np=p.concat(d);if(r.result==='win'&&(!allBolts||boltsGot(r.state)===L.bolts))return np;if(r.result==='win')continue;const k=norm(r.state);if(!seen.has(k)){seen.add(k);q.push([r.state,np])}}}return null}
function gcd(a,b){return b?gcd(b,a%b):a}
// all bolts collected -> judged against the all-bolts minimum, otherwise the plain minimum
function starsFor(steps,min,minAll,got,total){return stars(steps,total&&got===total&&minAll?minAll:min)}
function stars(steps,min){return steps<=min?3:steps<=Math.ceil(min*1.5)+1?2:1}
const api={LEVELS,DIRS,parse,step,bfs,stars,doorOpen,cell,hasBox,KEYCOL,isKeyDoor,opened,taken,patrolAt,isHole,boltsGot,starsFor};
if(typeof module!=='undefined')module.exports=api;else root.Logic=api;
})(this);
