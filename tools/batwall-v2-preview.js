// Design sheet for crack-wall-art.js v2 (球棒木板牆, bat-only) next to the existing bomb-breakable '%' cracked wall.
// Run: node tools/batwall-v2-preview.js -> shots/t8/batwall_v2_design.png (+ shots/t8/crops_v2/*_2x.png)
// The '%' tile is the LIVE art: its crack-line code is sliced read-only out of world.js v2Tile and drawn over the theme's normal wall.
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1');
const body=fs.readFileSync(__filename,'utf8').split('/*@@'+'BODY')[1].split('@@'+'END*/')[0];eval(src+body);
/*@@BODY
const OUT='/tmp/batwall2';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});const panels=[];
const WJ=fs.readFileSync(path.join(ROOT,'world.js'),'utf8'),a0=WJ.indexOf("if(c==='%'){v2Wall(px,py,x,y);"),a1=WJ.indexOf('return true}',a0);
if(a0<0||a1<0)throw Error('could not slice the % tile from world.js');
const PCT=WJ.slice(a0+"if(c==='%'){v2Wall(px,py,x,y);".length,a1).replace('FOR()','(TH0==="forest")'); // crack lines of the live '%' tile
function panel(name,tw,th,code,tt){const c=makeCtx(tw*16,th*16),s=sandbox(c);s.T=tt==null?1:tt;
 for(const f of['hit-fx-spec.js','crack-wall-art.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8').replace(/^const /gm,'var '),s);
 vm.runInContext('var Bot=(x,y,d)=>{robotShadow(x*16,y*16);robot(x*16,y*16,"n",d||"right",0,0,1)};var FL={forest:forestGround,swamp:swampMud,mine:mineFloor,volcano:volcanoGround,sea:seaSand,castle:castleFloor,sky:(a,b,c,d)=>skyGround(a,b,c,d,{}),mirror:mirrorFloor,power:powerFloor,clock:clockFloor,factory:factoryFloor,core:coreFloor};'+
  'var WL=th=>globalThis[CWA_THEMES[th].base];var Pct=(th,px,py,x,y)=>{WL(th)(px,py,x,y,0);var TH0=th;'+PCT+'};'+
  // room 7x3: row 1 = 小光 (1,1) → bat wall (2,1) · floor (3,1) · '%' (4,1) · normal wall (5,1)
  'var Room=(th,w,h,f)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(f(x,y))WL(th)(x*16,y*16,x,y,0);else FL[th](x*16,y*16,x,y,0)}};'+code,s);
 png(c,path.join(OUT,name+'.png'));panels.push(name)}
const TH=['forest','swamp','mine','volcano','sea','castle','sky','mirror','power','clock','factory','core'];
const open='(x,y)=>!(y===1&&x>=1&&x<=4)';
TH.forEach(th=>{
 panel('room_'+th,7,3,'Room("'+th+'",7,3,'+open+');crackWall(32,16,"'+th+'",T,2,1);Pct("'+th+'",64,16,4,1);Bot(1,1,"right")');
 panel('pair_'+th,3,1,'Pct("'+th+'",0,0,4,1);crackWall(16,0,"'+th+'",T,2,1);WL("'+th+'")(32,0,5,1,0)');});
panel('glint',3,1,'crackWall(16,0,"mine",2.3-(2*.7+1.3)+2.4,2,1);Pct("mine",0,0,4,1);WL("mine")(32,0,5,1,0)');
const BT=[0,.02,.09,.14,.20,.26,.33];
['mine','castle','sky','mirror'].forEach(th=>BT.forEach((t,i)=>panel('br_'+th+'_'+i,5,3,'Room("'+th+'",5,3,(x,y)=>!(y===1&&x>=1&&x<=3));'+(i===0?'crackWall(32,16,"'+th+'",1,2,1);':'FL["'+th+'"](32,16,2,1,0);crackWallBreak(32,16,"'+th+'",'+(t-.02)+',3,57);')+'Bot(1,1,"right")')));
fs.writeFileSync(path.join(OUT,'panels.json'),JSON.stringify(panels));
require('child_process').execFileSync('python3',[path.join(__dirname,'batwall-v2-sheet.py'),OUT,path.join(ROOT,'shots/t8/batwall_v2_design.png'),path.join(ROOT,'shots/t8/crops_v2')],{stdio:'inherit'});
@@END*/
