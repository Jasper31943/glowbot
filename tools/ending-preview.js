// node tools/ending-preview.js -> shots/ending_preview.png (contact sheet, 2x)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.replace('SC=4','SC=2');src=src.slice(0,src.indexOf('// ---- desert sheet'))+`
const ts=[0.3,1.3,2.5,3.1,4.4,5.6,6.5,7.6,8.8,10];const c=makeCtx(256*2+4,(144+2)*5),s=sandbox(c);
// add simple translate/scale support to the preview ctx
c.M=[1,0,0];c.Ms=[];const fr=c.fillRect.bind(c),sv=c.save.bind(c),rs=c.restore.bind(c);
c.save=function(){c.Ms.push(c.M.slice());sv()};c.restore=function(){c.M=c.Ms.pop();rs()};
c.translate=(x,y)=>{c.M[1]+=x*c.M[0];c.M[2]+=y*c.M[0]};c.scale=k=>{c.M[0]*=k};
c.fillRect=(x,y,w,h)=>{const[z,tx,ty]=c.M;const x0=Math.floor(tx+x*z),y0=Math.floor(ty+y*z),x1=Math.floor(tx+(x+w)*z),y1=Math.floor(ty+(y+h)*z);fr(x0,y0,Math.max(1,x1-x0),Math.max(1,y1-y0))};
vm.runInContext(fs.readFileSync(path.join(ROOT,'ice-art.js'),'utf8').replace(/^const /gm,'var '),s);vm.runInContext(fs.readFileSync(path.join(ROOT,'ending-art.js'),'utf8').replace(/^const /gm,'var '),s);
s.TS=ts;vm.runInContext(\`R(0,0,516,730,E32.ink);TS.forEach((t,i)=>{const ox=(i%2)*258,oy=Math.floor(i/2)*146;o.save();o.beginPath();o.rect(ox,oy,256,144);o.clip();
 o.translate(ox,oy);endingScene(256,144,t);o.restore()})\`,s);
png(c,path.join(ROOT,'shots/ending_preview.png'));`;eval(src);
