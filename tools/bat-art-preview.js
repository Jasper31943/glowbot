// node tools/bat-art-preview.js -> shots/bat_art_preview.png (top: 1x actual size, bottom: same sheet at 3x)
//                                  shots/baseball_bat_icon_16.png + shots/baseball_bat_icon_32.png (transparent HUD icons)
const fs=require('fs'),path=require('path');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.slice(0,src.indexOf('// ---- desert sheet')).replace('SC=4','SC=1')+`
const SW=288,SH2=96+192,c=makeCtx(SW,SH2),s=sandbox(c);
vm.runInContext(fs.readFileSync(path.join(ROOT,'bat-art.js'),'utf8').replace(/^const /gm,'var '),s);
vm.runInContext(\`
var FL=[(x,y)=>{TH=WORLDS.grass;grass(x*16,y*16,x,y)},(x,y)=>swampMud(x*16,y*16,x,y),(x,y)=>mineFloor(x*16,y*16,x,y)];
for(let f=0;f<3;f++)for(let y=0;y<2;y++)for(let x=0;x<18;x++)FL[f](x,f*2+y);
for(let f=0;f<3;f++){const Y=f*32+8;TH=WORLDS.grass;T=.3;
 robot(8,Y,'normal','right',0,0,1);baseballBatItem(28,Y,.05);baseballBatItem(48,Y,.5);   // robot next to item, sparkle on/off
 baseballBatIcon(70,Y+3);baseballBatIcon(84,Y,16);
 mineBat(108,Y,0,1,0,false);mineBat(128,Y,1,1,0,false);mineBat(148,Y,0,2,0,false);mineBat(168,Y,1,3,1,false);mineBat(188,Y,0,1,1,true);mineBat(208,Y,1,0,0,false);
 mineBatStunned(232,Y,.1);mineBatStunned(256,Y,.4);}
// swing grid: rows = dir up/down/left/right, cols = frames 0,1,2 ; left block on grass, right block on mine
for(let blk=0;blk<2;blk++)for(let d=0;d<4;d++)for(let fr=0;fr<3;fr++){const ox=blk*144+fr*48,oy=96+d*48;
 for(let ty=0;ty<3;ty++)for(let tx=0;tx<3;tx++){const gx=ox/16+tx,gy=oy/16+ty;blk?mineFloor(gx*16,gy*16,gx,gy):(TH=WORLDS.grass,grass(gx*16,gy*16,gx,gy))}
 TH=WORLDS.grass;const nm=['up','down','left','right'][d];robot(ox+16,oy+16,'normal',nm,0,0,1);batSwing(ox+16,oy+16,d,(fr+.5)*.2/3,.2);
 if(blk&&d===1&&fr===2)mineBatStunned(ox+16,oy+32,.2)}
for(let i=0;i<=288;i+=144)R(i,96,1,192,E32.ink);\`,s);
const S3=3,FW=SW*S3,FH=SH2+8+SH2*S3,f=makeCtx(FW,FH);f.px.fill(24);
const blit=(sc,ox,oy)=>{for(let y=0;y<SH2*sc;y++)for(let x=0;x<SW*sc;x++){const a=((y/sc|0)*SW+(x/sc|0))*3,b=((oy+y)*FW+ox+x)*3;f.px[b]=c.px[a];f.px[b+1]=c.px[a+1];f.px[b+2]=c.px[a+2]}};
blit(1,0,0);blit(S3,0,SH2+8);png(f,path.join(ROOT,'shots/bat_art_preview.png'));
// transparent icons
function rgba(n,sc,file){const k=makeCtx(n,n),ks=sandbox(k);k.px.fill(0);for(let i=0;i<k.px.length;i+=3){k.px[i]=255;k.px[i+2]=255}
 vm.runInContext(fs.readFileSync(path.join(ROOT,'bat-art.js'),'utf8').replace(/^const /gm,'var '),ks);vm.runInContext('baseballBatIcon(0,0,16)',ks);
 const W=n*sc,raw=Buffer.alloc((W*4+1)*W);for(let y=0;y<W;y++)for(let x=0;x<W;x++){const s2=((y/sc|0)*n+(x/sc|0))*3,d=y*(W*4+1)+1+x*4,r=k.px[s2],g=k.px[s2+1],b=k.px[s2+2],key=r===255&&g===0&&b===255;raw[d]=r;raw[d+1]=g;raw[d+2]=b;raw[d+3]=key?0:255}
 const crc=b=>{let c2,t=[];for(let q=0;q<256;q++){c2=q;for(let j=0;j<8;j++)c2=c2&1?0xedb88320^(c2>>>1):c2>>>1;t[q]=c2>>>0}c2=~0;for(const x of b)c2=t[(c2^x)&255]^(c2>>>8);return(~c2)>>>0};
 const ch=(ty,dd)=>{const l=Buffer.alloc(4);l.writeUInt32BE(dd.length);const td=Buffer.concat([Buffer.from(ty),dd]);const cc=Buffer.alloc(4);cc.writeUInt32BE(crc(td));return Buffer.concat([l,td,cc])};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(W,4);ih[8]=8;ih[9]=6;
 fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]))}
rgba(16,1,path.join(ROOT,'shots/baseball_bat_icon_16.png'));rgba(16,2,path.join(ROOT,'shots/baseball_bat_icon_32.png'));`;eval(src);
