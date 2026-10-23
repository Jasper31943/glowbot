// Old vs new ice wall contrast on a crop of world/ice.txt -> shots/ice_contrast_v2.png
const fs=require('fs'),path=require('path'),vm=require('vm'),ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
const lib=src.slice(0,src.indexOf('// ---- desert sheet'));const M={};new Function('require','__dirname','module',lib+';module.makeCtx=makeCtx;module.png=png;')(require,__dirname,M);
const rows=fs.readFileSync(path.join(ROOT,'world/ice.txt'),'utf8').split('\n').filter(l=>/^[#.]/.test(l));
const X0=0,Y0=1,CW=17,CH=9,GAP=1;const c=M.makeCtx((CW*2+GAP)*16,CH*16);
function run(artFile,ox){const sb={o:c,T:0,Math,console,save:{mute:true},addEventListener(){},window:{},Logic:{cell:()=>'.'},L:{}};vm.createContext(sb);
 vm.runInContext(fs.readFileSync(path.join(ROOT,'art.js'),'utf8').replace(/^(const|let) /gm,'var ')+';var TH=WORLDS.snow;',sb);
 vm.runInContext(fs.readFileSync(artFile,'utf8').replace(/^const /gm,'var '),sb);sb.G=rows;sb.OX=ox;sb.X0=X0;sb.Y0=Y0;sb.CW=CW;sb.CH=CH;
 vm.runInContext(`const g=(x,y)=>(G[y]||'')[x];const deep=(x,y)=>{for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const q=g(x+b,y+a);if(q!==undefined&&q!=='#')return false}return true};
 for(let j=0;j<CH;j++)for(let i=0;i<CW;i++){const x=X0+i,y=Y0+j,ch=g(x,y),px=OX+i*16,py=j*16;
  if(ch===undefined||(ch==='#'&&deep(x,y)))icePine(px,py,x,y);else if(ch==='#'){const up=g(x,y-1);iceRock(px,py,x,y,up===undefined||up!=='#'||deep(x,y-1))}
  else if(ch==='I')iceNormal(px,py,x,y);else if(ch==='J')iceHard(px,py,x,y);else{iceSnow(px,py,x,y);if(ch==='B')crate(px,py,false,0);if(ch==='P')snowball(px,py,0,1,false)}}
 if(typeof shortcutSign==='function'){shortcutSign(OX+16*1,16*0+0);purpleDoorShortcutMark(OX+16*5,16*4,0);robot(OX+16,16*3,'n','down',0,0,1)}else robot(OX+16,16*3,'n','down',0,0,1);`,sb)}
run(path.join(__dirname,'ice-art-old-ref.js'),0);c.fillStyle='#000000';c.fillRect(CW*16,0,GAP*16,CH*16);run(path.join(ROOT,'ice-art.js'),(CW+GAP)*16);
M.png(c,path.join(ROOT,'shots/ice_contrast_v2.png'));console.log('ok');
