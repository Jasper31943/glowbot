// Standalone preview for desert-art.js / forest-art.js. No deps: tiny fillRect canvas + PNG writer.
// Run: node tools/biome-art-preview.js  -> shots/desert_art_preview.png, shots/forest_art_preview.png
const fs=require('fs'),path=require('path'),zlib=require('zlib'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),SC=4;
function makeCtx(w,h){const px=new Uint8Array(w*h*3);const c={w,h,px,globalAlpha:1,fillStyle:'#000',clipR:null,stack:[],
 save(){this.stack.push([this.clipR,this.globalAlpha])},restore(){[this.clipR,this.globalAlpha]=this.stack.pop()},beginPath(){},rect(x,y,w,h){this._r=[x,y,w,h]},clip(){this.clipR=this._r},
 fillRect(x,y,ww,hh){let x0=x,y0=y,x1=x+ww,y1=y+hh;if(this.clipR){const[a,b,cw,ch]=this.clipR;x0=Math.max(x0,a);y0=Math.max(y0,b);x1=Math.min(x1,a+cw);y1=Math.min(y1,b+ch)}
  x0=Math.max(0,Math.round(x0));y0=Math.max(0,Math.round(y0));x1=Math.min(w,Math.round(x1));y1=Math.min(h,Math.round(y1));
  const s=this.fillStyle,r=parseInt(s.slice(1,3),16),g=parseInt(s.slice(3,5),16),b=parseInt(s.slice(5,7),16),al=this.globalAlpha;
  for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){const i=(yy*w+xx)*3;px[i]+=(r-px[i])*al;px[i+1]+=(g-px[i+1])*al;px[i+2]+=(b-px[i+2])*al}}};return c}
function png(ctx,file){const{w,h,px}=ctx,W=w*SC,H=h*SC,raw=Buffer.alloc((W*3+1)*H);
 for(let y=0;y<H;y++){raw[y*(W*3+1)]=0;for(let x=0;x<W;x++){const s=((y/SC|0)*w+(x/SC|0))*3,d=y*(W*3+1)+1+x*3;raw[d]=px[s];raw[d+1]=px[s+1];raw[d+2]=px[s+2]}}
 const crc=b=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}c=~0;for(const x of b)c=t[(c^x)&255]^(c>>>8);return(~c)>>>0};
 const chunk=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=2;
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]))}
function sandbox(ctx){const sb={o:ctx,T:0,Math,console,save:{mute:true},addEventListener(){},window:{},Logic:{cell:()=>'.'},L:{}};vm.createContext(sb);
 const art=fs.readFileSync(path.join(ROOT,'art.js'),'utf8').replace(/^const /gm,'var ').replace(/^let /gm,'var ');
 vm.runInContext(art+'\nvar TH=WORLDS.grass;',sb);
 for(const f of['desert-art.js','forest-art.js','swamp-art.js','mine-art.js','volcano-art.js','sea-art.js','castle-art.js','sky-art.js','mirror-art.js','power-art.js','clock-art.js','factory-art.js','core-art.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8').replace(/^const /gm,'var '),sb);return sb}
// ---- desert sheet: row of tiles + mini scene
{const c=makeCtx(16*12,16*7),s=sandbox(c);s.T=0;const run=src=>vm.runInContext(src,s);
 run(`for(let y=0;y<7;y++)for(let x=0;x<12;x++)desertSand(x*16,y*16,x,y);
 [0,1,2,3,4,5,6,7,8,9,10,11].forEach(x=>desertRock(x*16,0,x,0,true));
 desertCactus(0,16,0,1);desertBone(16,16,1,1);quicksand(32,16,0);quicksand(48,16,1);sandBridge(64,16);dune(80,16,0,false);dune(96,16,1,false);plate(112,16,true);dune(112,16,0,true);
 boardedTunnel(144,16);comingSoonSign(128,16);
 [0,.25,.5,.75].forEach((t,i)=>robotQuicksand(i*16,40,t+.1));[0,.3,.6,.9].forEach((t,i)=>sandSplash(72+i*16,40,t));
 [.2,.6,1].forEach((t,i)=>{if(t>=1)sandBridge(144+i*16-16,40);else boxSink(128+i*16,40,t)});
 robotShadow(16,72);robot(16,72,'n','down',0,0,1);robot(40,72,'n','down',0,0,1);
 sandwormKing(72,64,0,false,2,2);sandwormKing(120,64,1,true,1,2);desertCactus(160,72,3,3);`);
 png(c,path.join(ROOT,'shots/desert_art_preview.png'))}
// ---- forest sheet
{const c=makeCtx(16*12,16*7),s=sandbox(c);const run=src=>vm.runInContext(src,s);
 run(`for(let y=0;y<7;y++)for(let x=0;x<12;x++)forestGround(x*16,y*16,x,y,0);
 for(let x=0;x<12;x++)forestCanopy(x*16,0,x,0);
 vine(0,16,0,1);vine(16,16,1,1);[6,5,4,3,2,1].forEach((n,i)=>vineBurnt(32+i*16,16,n,i===5?0.2:0));
 [0,1,2].forEach(f=>firePuff(144+f*16-16,16,f));
 [3,2,1,0].forEach((n,i)=>beetle(i*16,48,i%2,n,0.3));
 robotShadow(80,48);robot(80,48,'n','right',0,0,1);firePuff(96,48,0);firePuff(112,48,1);firePuff(128,48,2);
 elderTree(16,74,0,false,3,3);elderTree(64,74,1,true,2,3);boardedTunnel(128,80);comingSoonSign(112,80);`);
 png(c,path.join(ROOT,'shots/forest_art_preview.png'))}
const sheet=(name,src)=>{const c=makeCtx(16*12,16*7),s=sandbox(c);vm.runInContext(src,s);png(c,path.join(ROOT,'shots/'+name))};
sheet('swamp_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y<3?swampMud:swampWater)(x*16,y*16,x,y,0);
 for(let x=0;x<12;x++)swampReeds(x*16,0,x,0,x%2);
 lilyPad(0,48,0,3,0,false,0);lilyPad(16,48,1,3,1,false,0);lilyPad(48,48,3,3,0,true,0);lilyPad(64,48,4,3,1,true,0);lilyPad(80,48,5,3,0,true,.5);
 [.1,.35,.6,.85].forEach((t,i)=>robotSwampSink(112+i*16-16,48,i,3,t));[0,.3,.6,.9].forEach((t,i)=>swampBubbles(i*16,80,t));
 robotShadow(96,24);robot(96,24,'n','down',0,0,1);`);
sheet('mine_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)mineFloor(x*16,y*16,x,y);
 for(let x=0;x<12;x++)(x%4===0?mineBeam:mineRock)(x*16,0,x,0,0.2);mineLantern(32,0,0);mineLantern(160,0,0.2);
 [['se','h','h','h','sw'],['v',0,0,0,'v'],['ne','h','j','h','nw']].forEach((r,y)=>r.forEach((k,x)=>{if(k)mineTrack(x*16,24+y*16,x,y,k,1)}));
 ['h','v','ne','nw','se','sw'].forEach((k,i)=>mineTrack(96+i*16-16,24,i,9,k,0));mineTrack(96,56,6,2,'j',0);
 [0,1,2,3].forEach(d=>minecart(d*16,80,d,0));[0,1,2,3].forEach(s=>crumbleFloor(96+s*16,80,s,3,s));
 robotShadow(32,40);robot(32,40,'n','down',0,0,1);`);
sheet('volcano_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)volcanoGround(x*16,y*16,x,y);
 for(let x=0;x<12;x++)volcanoRock(x*16,0,x,0);
 [0,1,2,3].forEach(d=>{lavaFlow(d*32,24,0,d);lavaFlow(d*32+16,24,1,d)});lavaPool(144,48,0);lavaPool(160,48,1);
 cooledLava(0,48,0,3);cooledLava(16,48,1,3);robotShadow(48,48);robotDumbfounded(48,48,.6);for(let x=0;x<12;x++)cooledLava(x*16,96,x,6,0);for(let y=4;y<6;y++)for(let x=0;x<3;x++)volcanoRock(x*16,y*16+0,x,y,0);[0,1,2].forEach(f=>noEffectPuff(64+f*16,48,f));`);
sheet('sea_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y>=5?seaSand:seaWater)(x*16,y*16,x,y);
 [0,1,2,3].forEach(d=>{seaCurrent(d*32,16,d*2,1,d,0);seaCurrent(d*32+16,16,d*2+1,1,d,1)});
 airBubble(16,48,0);airBubble(48,48,.5);robot(96,48,'n','down',0,0,1);robotBubbleHelmet(96,48);
 seaCoral(0,80,0,5);seaCoral(16,80,1,5);seaweed(48,80,3,5,0);seaweed(64,80,4,5,1);seaCoral(160,96,10,6);seaweed(128,96,8,6,0);`);
sheet('castle_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y===0?castleBrick:castleFloor)(x*16,y*16,x,y);
 castleBanner(32,0,2,0,0);castleTorch(64,0,4,0,0);castleTorch(80,0,5,0,.1);castleBanner(128,0,8,0,0);
 lever(0,24,false);lever(16,24,true);trapdoor(48,24,3,1,false);trapdoor(64,24,4,1,true);spikeTrap(96,24,6,1,false);spikeTrap(112,24,7,1,true);
 armorGhost(0,64,0,1,false);armorGhost(16,64,1,3,false);armorGhost(48,64,0,1,true);[.3,.9,1.2,1.5].forEach((t,i)=>armorGhostDefeat(80+i*20,64,t,3));
 robotShadow(32,96);robot(32,96,'n','down',0,0,1);`);
sheet('sky_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)skyBg(x*16,y*16,x,y);
 for(let y=2;y<=4;y++)for(let x=1;x<=5;x++)skyGround(x*16,y*16,x,y,{n:y===2,s:y===4,w:x===1,e:x===5});for(let x=1;x<=5;x++)skyUnderside(x*16,80,x,5);
 cloudPlatform(112,32,0);cloudPlatform(128,32,1);[0,1,2,3].forEach(d=>skyWind(112+(d%2)*16,64+Math.floor(d/2)*16,7+d%2,4+Math.floor(d/2),d,.2));
 robotShadow(48,40);robot(48,40,'n','down',0,0,1);`);
sheet('mirror_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y===0?mirrorWall:mirrorFloor)(x*16,y*16,x,y);
 for(let x=1;x<6;x++)beam(x*16,32,'h','light',0);mirror(96,32,'\\\\',0.5);for(let y=3;y<5;y++)beam(96,y*16,'v','light',0);lightTarget(96,80,true);lightTarget(128,80,false);
 mirror(0,64,'/',0);mirror(16,64,'\\\\',0.3);for(let x=2;x<5;x++)beam(x*16,96,'h','fire',0);robotShadow(16,96);robot(16,96,'n','right',0,0,1);`);
sheet('power_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y===0?powerWall:powerFloor)(x*16,y*16,x,y);
 for(let x=0;x<5;x++)wire(x*16,16,x,1,'h',true,.2);for(let x=5;x<9;x++)wire(x*16,16,x,1,'h',false,0);generator(144,16,true,0);generator(160,16,false,0);
 sparkMon(0,48,0,false);sparkMon(16,48,1,true);[.3,.9,1.2,1.5].forEach((t,i)=>sparkDefeat(48+i*20,48,t,3));firefly(160,48,0);robotShadow(32,88);robot(32,88,'n','down',0,0,1);`);
sheet('clock_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y===0?clockWall:clockFloor)(x*16,y*16,x,y);clockFace(48,0,3,0,1);clockFace(128,0,8,0,4);
 [0,1,2,3].forEach(r=>gear(r*16,32,r));gear(80,32,0);gear(96,32,1);[0,1,2,3].forEach(p=>pendulum(128+p*16-16,64,p));robotShadow(32,72);robot(32,72,'n','down',0,0,1);`);
sheet('factory_art_preview.png',`for(let y=0;y<7;y++)for(let x=0;x<12;x++)(y===0?factoryWall:factoryFloor)(x*16,y*16,x,y,0);
 for(let x=0;x<4;x++)conveyor(x*16,32,3,x);for(let x=4;x<7;x++)conveyor(x*16,32,2,x);conveyor(128,16,1,0);conveyor(128,32,1,1);conveyor(144,32,0,0);
 glitchBot(0,64,0,false,.1);glitchBot(16,64,1,true,0);[.3,.6,1.2].forEach((t,i)=>glitchBotDefeat(48+i*20,64,t));robotShadow(128,72);robot(128,72,'n','down',0,0,1);`);
{const c=makeCtx(16*16,16*9),s=sandbox(c);vm.runInContext(`for(let y=0;y<9;y++)for(let x=0;x<16;x++)(y===0?coreWall:coreFloor)(x*16,y*16,x,y,0);
 [0,2,5].forEach((p,i)=>glitchCore(14+i*86,30,p,false,.3+i*.1));glitchCore(14,90,1,true,0);
 lighthouse(70,78,0,false,0);lighthouse(108,78,7,false,0);lighthouse(144,78,15,false,0);lighthouse(186,78,15,true,.5);
 robotShadow(232,124);robot(232,124,'n','up',0,0,1);`,s);png(c,path.join(ROOT,'shots/core_art_preview.png'))}
console.log('ok');
