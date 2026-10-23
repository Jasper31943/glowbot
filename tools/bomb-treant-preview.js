// Design sheet for bomb-range-art.js (炸彈範圍預告) + treant-guard-art.js (老樹精打不到狀態).
// Run: node tools/bomb-treant-preview.js -> shots/t7/bomb_treant_design.png (+ shots/t7/crops/*_2x.png)
// Panels are rendered 1x by the tiny canvas from tools/biome-art-preview.js, then laid out + labelled by tools/bomb-treant-sheet.py.
// Read-only use of world.js: bombSprite / blastWarn / bossMarkFrame / bossMark / digit are sliced out of it so the comparison is the live art.
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1');
const body=fs.readFileSync(__filename,'utf8').split('/*@@'+'BODY')[1].split('@@'+'END*/')[0];eval(src+body);
/*@@BODY
const OUT='/tmp/bomb-treant';fs.mkdirSync(OUT,{recursive:true});const panels=[];
const WJ=fs.readFileSync(path.join(ROOT,'world.js'),'utf8');const cut=(a,b)=>{const i=WJ.indexOf(a),j=WJ.indexOf(b,i);if(i<0||j<0)throw Error('slice '+a);return WJ.slice(i,j)};
const LIVE=WJ.slice(WJ.indexOf('const DIG='),WJ.indexOf('\n',WJ.indexOf('function digit('))+1)+'\n'+cut('function bombSprite(','// snowball patrols')+'\n'+cut('function bossMarkFrame(','function glitchBall(');
function panel(name,tw,th,code,tt){const c=makeCtx(tw*16,th*16),s=sandbox(c);s.T=tt==null?0.1:tt;
 vm.runInContext('var WE={FUSE_MS:3000},cam={ox:0,oy:0};'+LIVE.replace(/^const /gm,'var '),s);
 for(const f of['bomb-range-art.js','treant-guard-art.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8').replace(/^const /gm,'var '),s);
 vm.runInContext('TH=WORLDS.forest;var Fl=(x,y)=>forestGround(x*16,y*16,x,y,0),Wa=(x,y)=>forestCanopy(x*16,y*16,x,y),Bot=(x,y,d)=>{robotShadow(x*16,y*16);robot(x*16,y*16,"n",d||"right",0,0,1)};'+
  'var Room=(w,h,walls)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(x===0||y===0||x===w-1||y===h-1||(walls||[]).some(q=>q[0]===x&&q[1]===y))Wa(x,y);else Fl(x,y)}};'+
  'var Bomb=(x,y,fl)=>{const ms=3000-fl*1000;bombSprite(x*16,y*16,{x,y,t:Math.max(0,Math.ceil(fl-1e-9)),ms})};'+code,s);
 png(c,path.join(OUT,name+'.png'));panels.push(name)}
// ---- ① bomb range over the fuse, forest room 7x5, bomb at (3,2), 小光 at (5,2) stepped away
const B='Room(7,5);';
[['fuse3',3,.1],['fuse15',1.5,.1],['last_on',.8,.1],['last_off',.8,.6]].forEach(([n,fl,tt])=>panel('br_'+n,7,5,B+'bombRange(48,32,null,'+fl+','+tt+');Bomb(3,2,'+fl+');Bot(5,1,"left")',tt));
panel('br_old',7,5,B+'blastWarn({x:3,y:2,t:1,ms:2200});Bomb(3,2,.8);Bot(5,1,"left")',.1);
// blocked arm example: wall left of the bomb → engine passes arms {left:0}
panel('br_blocked',7,5,'Room(7,5,[[2,2],[2,3]]);bombRange(48,32,{left:0,up:1,down:1,right:1},2,.1);Bomb(3,2,2);Bot(5,1,"left")',.1);
panel('br_long',9,5,'Room(9,5);bombRange(64,32,{left:2,right:2,up:1,down:1},2,.1);Bomb(4,2,2);Bot(7,1,"left")',.1);
// ---- ② yellow vs red boss telegraph (forest root attack 'row'), same room
panel('cmp_boss',7,5,B+'[[2,1],[3,1],[4,1],[2,3],[3,3],[4,3]].forEach(([x,y])=>bossMark(x*16,y*16,"row",0.1,0));Bot(5,2,"left")',.1);
panel('cmp_both',7,5,B+'bossMark(16,16,"row",0.1,0);bossMark(16,32,"row",0.1,0);bossMark(16,48,"row",0.1,0);bombRange(64,32,null,.8,.1);Bomb(4,2,.8);Bot(2,2,"right")',.1);
// ---- ③ treant (2x2 boss, anchor px-8,py-16 of its tile) in a 6x5 room, boss tile (3,3); 小光 to its left
const TR='Room(6,6);';const at='40,32';
panel('tr_normal',5,6,TR+'elderTree('+at+',0,false,2,3);Bot(1,3,"right")');
panel('tr_hit',5,6,TR+'elderTree('+at+',0,true,2,3);Bot(1,3,"right")');
panel('tr_inv2',5,6,TR+'treantGuard('+at+',0,2,3,2,0.1);Bot(1,3,"right")');
panel('tr_inv1',5,6,TR+'treantGuard('+at+',0,2,3,1,0.1);Bot(1,3,"right")');
[0,1,2].forEach(k=>panel('tr_defl'+k,5,6,TR+'treantGuard('+at+',0,2,3,2,0.1,'+[.03,.15,.3][k]+',"left");Bot(1,3,"right")'));
panel('tr_inv2_f1',5,6,TR+'treantGuard('+at+',1,2,3,2,0.4);Bot(1,3,"right")');
fs.writeFileSync(path.join(OUT,'panels.json'),JSON.stringify(panels));
require('child_process').execFileSync('python3',[path.join(__dirname,'bomb-treant-sheet.py'),OUT,path.join(ROOT,'shots/t7/bomb_treant_design.png'),path.join(ROOT,'shots/t7/crops')],{stdio:'inherit'});
@@END*/
