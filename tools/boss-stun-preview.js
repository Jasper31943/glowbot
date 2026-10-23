// Design sheet for boss-stun-art.js (王被球棒打昏 → 炸彈時機). Run: node tools/boss-stun-preview.js -> shots/t9/boss_stun_design.png (+ shots/t9/crops/*_2x.png)
// Panels rendered 1x with the tiny canvas from tools/biome-art-preview.js; bombSprite / stunStars are sliced read-only from world.js so the
// "目前" (current engine) column and the bomb are the live art. Layout + Traditional Chinese labels: tools/boss-stun-sheet.py.
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1');
const body=fs.readFileSync(__filename,'utf8').split('/*@@'+'BODY')[1].split('@@'+'END*/')[0];eval(src+body);
/*@@BODY
const OUT='/tmp/bossstun';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});const panels=[];
const WJ=fs.readFileSync(path.join(ROOT,'world.js'),'utf8');const cut=(a,b)=>{const i=WJ.indexOf(a),j=WJ.indexOf(b,i);if(i<0||j<0)throw Error('slice '+a);return WJ.slice(i,j)};
const LIVE=WJ.slice(WJ.indexOf('const DIG='),WJ.indexOf('\n',WJ.indexOf('function digit('))+1)+'\n'+cut('function bombSprite(','// snowball patrols')+'\n'+cut('function stunStars(','function bossStars(');
function panel(name,tw,th,code,tt){const c=makeCtx(tw*16,th*16),s=sandbox(c);s.T=tt==null?0.1:tt;
 vm.runInContext('var WE={FUSE_MS:3000},cam={ox:0,oy:0};'+LIVE.replace(/^const /gm,'var '),s);
 for(const f of['bomb-range-art.js','boss-stun-art.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8').replace(/^const /gm,'var '),s);
 vm.runInContext('var Bot=(x,y,d)=>{robotShadow(x*16,y*16);robot(x*16,y*16,"n",d||"right",0,0,1)};var ZN={castle:[castleFloor,castleBrick],spark:[powerFloor,powerWall],glitch:[factoryFloor,factoryWall]};'+
  'var Room=(z,w,h)=>{const [F,Wl]=ZN[z];for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(x===0||y===0||x===w-1||y===h-1)Wl(x*16,y*16,x,y,0);else F(x*16,y*16,x,y,0)}};'+
  'var Bomb=(x,y,fl)=>{const ms=3000-fl*1000;bombSprite(x*16,y*16,{x,y,t:Math.max(0,Math.ceil(fl-1e-9)),ms})};'+code,s);
 png(c,path.join(OUT,name+'.png'));panels.push(name)}
// room 7x5: boss tile (3,3), 小光 (1,3) facing right, bomb (4,3) with its range (covers the boss), fuse 2 s
const KB={knight:['castle','armorKnightKing(48,48,0,2,0,false,false)'],spark:['spark','sparkKing(48,48,0,2,0,false,true,false)'],glitch:['glitch','glitchKing(48,48,0,2,0,false,false)']};
for(const k in KB){const [z,base]=KB[k],room='Room("'+z+'",7,5);',BR='bombRange(64,48,null,2,T);Bomb(4,3,2);',opt='{dir:2,max:3}';
 panel(k+'_normal',7,5,room+base+';Bot(1,3,"right")',.1);
 panel(k+'_now',7,5,room+BR+base.replace('48,48','48,49')+';stunStars(48,49,3);Bot(1,3,"right")',.1); // current engine: base + stunStars
 [3,2,1].forEach(n=>panel(k+'_s'+n,7,5,room+BR+'bossStunned("'+k+'",48,48,0,'+n+',T,'+opt+');Bot(1,3,"right")',.1+n*.37));
 panel(k+'_s1b',7,5,room+BR+'bossStunned("'+k+'",48,48,0,1,T,'+opt+');Bot(1,3,"right")',.6);
 panel(k+'_end',7,5,room+'bossStunEnd("'+k+'",48,48,.08,'+opt+');Bot(1,3,"right")',.1);
 panel(k+'_nobomb',7,5,room+'bossStunned("'+k+'",48,48,0,2,T,{dir:2,max:3,bombOk:false});Bot(1,3,"right")',.3);}
// support 1..N: 5-step and 8-step stuns (knight)
panel('knight_max5',7,5,'Room("castle",7,5);bossStunned("knight",48,48,0,4,T,{dir:2,max:5});Bot(1,3,"right")',.2);
panel('knight_max8',7,5,'Room("castle",7,5);bossStunned("knight",48,48,0,7,T,{dir:2,max:8});Bot(1,3,"right")',.2);
// facing right (dir 3) check
panel('spark_dir3',7,5,'Room("spark",7,5);bossStunned("spark",48,48,0,2,T,{dir:3});Bot(5,3,"left")',.2);
panel('knight_dir3',7,5,'Room("castle",7,5);bossStunned("knight",48,48,0,2,T,{dir:3});Bot(5,3,"left")',.2);
fs.writeFileSync(path.join(OUT,'panels.json'),JSON.stringify(panels));
require('child_process').execFileSync('python3',[path.join(__dirname,'boss-stun-sheet.py'),OUT,path.join(ROOT,'shots/t9/boss_stun_design.png'),path.join(ROOT,'shots/t9/crops')],{stdio:'inherit'});
@@END*/
