// Design sheet for clock-mech-art.js (鐘塔 齒輪門 / 鐘擺 v2).
// Run: node tools/clock-mech-preview.js -> shots/t5/clock_mech_design.png  (panels rendered 1x here, laid out + labelled by PIL)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1')+`
const OUT='/tmp/clock-mech';fs.mkdirSync(OUT,{recursive:true});const panels=[];
function panel(name,tw,th,code){const c=makeCtx(tw*16,th*16),s=sandbox(c);
 vm.runInContext(fs.readFileSync(path.join(ROOT,'clock-mech-art.js'),'utf8').replace(/^const /gm,'var '),s);
 vm.runInContext('TH=WORLDS.clock;var Fl=(x,y)=>clockFloor(x*16,y*16,x,y),Wa=(x,y)=>clockWall(x*16,y*16,x,y),Bot=(x,y,d)=>{robotShadow&&robotShadow(x*16,y*16);robot(x*16,y*16,"n",d||"right",0,0,1)};'+code,s);
 png(c,path.join(OUT,name+'.png'));panels.push(name)}
// gate state cells: wall / floor-gate-floor / wall, with the tick that state happens on for a standard ¤ gate (open on ticks 0,1)
const GS=[['open',0],['closing',1],['closed',2],['opening',3]];
GS.forEach(([st,k])=>panel('gate_'+st,3,3,\`for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGateV2(16,16,'\${st}',\${k},0.1)\`));
// closing blink frame B
panel('gate_closing_b',3,3,\`for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGateV2(16,16,'closing',1,0.3)\`);
// gate cycle strip: 5 steps, robot waits left of the gate; at tick 0 it walks in, tick1 must leave (closing)
[0,1,2,3,4].forEach(k=>{const st=['open','closing','closed','opening','open'][k];panel('gcyc_'+k,3,3,\`for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGateV2(16,16,'\${st}',\${k%4},0.1);Bot(0,1,'right')\`)});
// pendulum: wall above (ceiling), pendulum tile, floor below
const PP=[[0,'ready'],[.15,'s1'],[.4,'hit'],[.6,'s3'],[1,'safe'],[1.5,'back'],[1.98,'ready2']];
PP.forEach(([p,n])=>panel('pend_'+n,1,3,\`Wa(0,0);Fl(0,1);Fl(0,2);\${p<.05||p>1.9?'pendulumDanger(0,16,0.1);':''}pendulumV2(0,16,\${p},0.1,-1)\`));
panel('pend_dangerB',1,3,'Wa(0,0);Fl(0,1);Fl(0,2);pendulumDanger(0,16,0.35);pendulumV2(0,16,0,0.3,-1)');
panel('pend_mark',1,1,'Fl(0,0);pendulumDanger(0,0,0.1)');
// pendulum 4-tick strip ('n' tile: hit on odd ticks). tick even = ready (danger), odd = safe. robot waits on the tile left of it.
[0,1,2,3].forEach(k=>panel('pcyc_'+k,3,3,\`for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(1,1);Fl(2,1);\${k%2===0?'pendulumDanger(16,16,0.1);':''}pendulumV2(16,16,\${k%2},0.1,Math.floor(\${k}/2)%2?1:-1);Bot(\${[0,0,1,2][k]},1,'right')\`));
// temporary (engineer) sprites from clock-art.js, same scene
panel('tmp_gate_closed',3,3,'for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGate(16,16,false,2,0.1,{now:false,next:false,cyc:[1,1,0,0],k:2})');
panel('tmp_gate_open',3,3,'for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGate(16,16,true,0,0.1,{now:true,next:true,cyc:[1,1,0,0],k:0})');
panel('tmp_pend_d',1,3,'Wa(0,0);Fl(0,1);Fl(0,2);pendulum(0,16,0,{danger:true,side:0})');
panel('tmp_pend_s',1,3,'Wa(0,0);Fl(0,1);Fl(0,2);pendulum(0,16,0,{danger:false,side:1})');
panel('new_gate_closed',3,3,'for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGateV2(16,16,"closed",2,0.1)');
panel('new_gate_open',3,3,'for(let x=0;x<3;x++){Wa(x,0);Wa(x,2)}Fl(0,1);Fl(2,1);gearGateV2(16,16,"open",0,0.1)');
panel('new_pend_d',1,3,'Wa(0,0);Fl(0,1);Fl(0,2);pendulumDanger(0,16,0.1);pendulumV2(0,16,0,0.1,-1)');
panel('new_pend_s',1,3,'Wa(0,0);Fl(0,1);Fl(0,2);pendulumV2(0,16,1,0.1,-1)');
// T5-like corridor mock-up (phone ~8 tiles wide). '#' wall, '.' floor, A/B gates (¤ open ticks 0,1 / ¢ open ticks 2,3), n/s pendulums, R robot. tick=0
const MAP=['########','#.R..A.#','#.##.#.#','#.n..s.#','###.##.#','#..B...#','########'];
[0,1].forEach(zt=>panel('corridor'+zt,8,7,\`const M=\${JSON.stringify(MAP)},zt=\${zt};
 M.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='#')Wa(x,y);else Fl(x,y)}));
 M.forEach((r,y)=>[...r].forEach((ch,x)=>{const px=x*16,py=y*16;
  if(ch==='A'||ch==='B'){const shut=z=>{const ph=(z%4)<2;return ch==='A'?!ph:ph},now=!shut(zt),nx=!shut(zt+1);gearGateV2(px,py,now?(nx?'open':'closing'):(nx?'opening':'closed'),zt%4,0.1)}
  if(ch==='n'||ch==='s'){const hitNext=ch==='n'?(zt+1)%2===1:(zt+1)%2===0;if(hitNext)pendulumDanger(px,py,0.1);pendulumV2(px,py,hitNext?0:1,0.1,ch==='n'?-1:1)}}));
 Bot(2+zt,1,'right');\`));
fs.writeFileSync(path.join(OUT,'panels.json'),JSON.stringify(panels));
require('child_process').execFileSync('python3',[path.join(__dirname,'clock-mech-sheet.py'),OUT,path.join(ROOT,'shots/t5/clock_mech_design.png')],{stdio:'inherit'});`;eval(src);
