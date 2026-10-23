// a step "stalls" when the robot stays on its tile and achieves nothing: a wait, an act that changed nothing,
// or a bump that only faces a plain wall (turning to face a bomb pile / mirror / lever / crate before acting is not a stall)
const sig=s=>JSON.stringify([s.inv,s.held,s.got,s.boxes,(s.bombs||[]).map(b=>[b.m,b.x,b.y]),s.broken,s.holes,s.filled,s.ch,s.rocks,s.cart,(s.bosses||[]).map(b=>[b.hp,b.fr||0,b.shot?[b.shot.d,b.shot.back]:0])]);
const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
module.exports=(E,W)=>(a,t,ns)=>{if(a==='wait')return 1;if(ns.x!==t.x||ns.y!==t.y||sig(ns)!==sig(t))return 0;
 if(a!=='act'&&ns.f!==t.f){const [dx,dy]=D[ns.f];const c=E.cell(W,ns,ns.m,ns.x+dx,ns.y+dy);if(c&&c!=='#'&&c!==' ')return 0}return 1};
