// node tools/og-preview.js -> shots/og_launch_1200x630.png, shots/og_clear_1200x630.png, shots/lamp_colors_swatch.png
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');let src=fs.readFileSync(path.join(__dirname,'biome-art-preview.js'),'utf8');
src=src.replace('SC=4','SC=(global.SCALE||4)');src=src.slice(0,src.indexOf('// ---- desert sheet'));
global.SCALE=6;eval(src+`
const scene=(n,file)=>{const c=makeCtx(200,105),s=sandbox(c);s.N=n;vm.runInContext(\`
 const full=N>=15;
 // night sky gradient
 const hx=v=>v.toString(16).padStart(2,'0');for(let y=0;y<105;y++){const k=y/105;R(0,y,200,1,'#'+hx(Math.round(24+k*36))+hx(Math.round(22+k*24))+hx(Math.round(52+k*58)))}
 // soft glow orb behind lighthouse
 const glow=full?'#7fd8ff':'#6a5fb0';for(let r=60;r>4;r-=6){o.globalAlpha=full?.07:.05;for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j));R(150-w,40+j,w*2,1,glow)}}o.globalAlpha=1;
 // stars
 for(let i=0;i<60;i++){const x=(i*73)%200,y=(i*37)%60;R(x,y,1,1,i%7?E32.grey2:E32.white)}
 // glass panel glow on left (empty title area, no text)
 for(let r=40;r>4;r-=5){o.globalAlpha=.035;for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j)*1.4);R(50-w,45+j,w*2,1,full?'#b55088':'#5a4aa0')}}o.globalAlpha=1;
 // hill + sea
 R(0,92,200,13,E32.blue1);for(let x=0;x<200;x+=6)R(x+((x/6)%2)*2,95,3,1,E32.blue2);
 for(let x=100;x<200;x++){const h=Math.round(10-Math.abs(x-150)*.14);R(x,94-h,1,h+11,E32.green3);R(x,94-h,1,1,E32.green2)}
 lighthouse(134,22,0,false,0.3);
 for(let j=1;j<40;j++){const w=Math.round(8+j*.18),y=42+j,band=Math.floor(j/8)%2;R(150-w-1,y,w*2+2,1,E32.ink);R(150-w,y,w*2,1,band?E32.red3:E32.grey1);R(150-w,y,2,1,band?E32.red2:E32.grey2)}
  // rainbow beam from lantern room, diagonal up-left (stays above the title block)
 R(143,32,14,9,E32.yellow);R(144,33,3,7,E32.amber);
 {const n=N,sl=.36;for(let x=142;x>=-2;x--){const d=142-x,bw=Math.max(.6,(1.2+d*.035)*Math.min(1,6/n)),tot=bw*n,cy=36-d*sl,f=Math.min(1,d/6)*(x<20?Math.max(0,(x+2)/22):1);
  for(let i=0;i<n;i++){o.globalAlpha=.75*f;R(x,Math.round(cy-tot/2+i*bw),1,Math.ceil(bw),LAMP_COLORS[i].hex)}
  o.globalAlpha=.12*f;R(x,Math.round(cy-tot/2-3),1,Math.round(tot+6),E32.white)}o.globalAlpha=1}
 // lamp-room glow
 for(let r=10;r>3;r--){o.globalAlpha=.06;for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j));R(150-w,36+j,w*2,1,E32.yellow)}}o.globalAlpha=1;
 // windows: 5 rows x 3, bottom-to-top in scene order, bigger
 const win=i=>[150-8+(i%3)*6-1,77-Math.floor(i/3)*8];
 for(let i=0;i<15;i++){const[x,y]=win(i);if(i<N){R(x-1,y-1,6,6,E32.ink)}else{R(x,y,4,4,E32.grey4);R(x,y,4,1,E32.ink)}}
 for(let i=0;i<N;i++){const[x,y]=win(i),C=LAMP_COLORS[i].hex;for(let r=9;r>2;r-=1){o.globalAlpha=.08;for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j));R(x+2-w,y+2+j,w*2,1,C)}}o.globalAlpha=1}
 for(let i=0;i<N;i++){const[x,y]=win(i);R(x,y,4,4,LAMP_COLORS[i].hex);R(x,y,2,1,E32.white);R(x,y,1,2,E32.white)}
 // 小光 3/4 side view facing right, head tilted up
 {const X=114,Y=70,O=E32.ink,B=E32.white,S=E32.grey1,Cy=E32.cyan;
  o.globalAlpha=.35;R(X-1,Y+19,18,3,Cy);o.globalAlpha=.6;R(X+1,Y+19,14,2,Cy);o.globalAlpha=1;
  // antenna (tilted back) + glow
  for(let r=5;r>1;r--){o.globalAlpha=.14;for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j));R(X+4-w,Y-5+j,w*2,1,Cy)}}o.globalAlpha=1;
  R(X+4,Y-4,2,5,O);R(X+5,Y-3,1,4,S);R(X+2,Y-7,5,4,O);R(X+3,Y-6,3,2,Cy);R(X+3,Y-6,1,1,B);
  // head tilted up: offset rows
  R(X+1,Y+1,15,10,O);R(X+2,Y,13,1,O);R(X+2,Y+2,13,8,B);R(X+2,Y+8,13,2,S);
  // face screen on right side, raised
  R(X+8,Y+2,7,5,O);R(X+9,Y+3,5,3,E32.navy);R(X+11,Y+3,2,2,Cy);R(X+13,Y+3,1,1,Cy);R(X+11,Y+3,1,1,B);
  // body
  R(X+2,Y+11,12,7,O);R(X+3,Y+12,10,5,B);R(X+3,Y+15,10,2,S);R(X+10,Y+13,2,2,Cy);
  // arm pointing up toward lighthouse
  R(X+12,Y+9,3,5,O);R(X+13,Y+7,3,4,O);R(X+13,Y+8,2,4,S);
  // feet
  R(X+3,Y+18,4,3,O);R(X+9,Y+18,4,3,O);R(X+4,Y+18,2,2,E32.grey2);R(X+10,Y+18,2,2,E32.grey2)}
\`,s);png(c,'/tmp/'+file)};
scene(4,'og_launch.png');scene(15,'og_clear.png');
{const c=makeCtx(15*12,14),s=sandbox(c);vm.runInContext('R(0,0,180,14,E32.ink);LAMP_COLORS.forEach((l,i)=>{R(i*12+1,2,10,10,E32.ink);R(i*12+2,3,8,8,l.hex)})',s);png(c,'/tmp/sw.png')}`);
const py=`from PIL import Image,ImageDraw,ImageFont,ImageFilter
F='/workspace/robot-maze/tools/fonts/Cubic_11.ttf'
def title(im):
  big=ImageFont.truetype(F,88);sm=ImageFont.truetype(F,33)
  lay=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(lay);d.fontmode='1'
  items=[(55,330,'Glowbot 小光',big),(58,460,'像素解謎冒險・點亮 15 盞燈塔燈',sm)]
  for x,y,t,f in items:d.text((x,y),t,font=f,fill=(120,230,255,255))
  glow=lay.filter(ImageFilter.GaussianBlur(14));im=Image.alpha_composite(im,glow)
  sh=Image.new('RGBA',im.size,(0,0,0,0));ds=ImageDraw.Draw(sh);ds.fontmode='1'
  for x,y,t,f in items:ds.text((x+3,y+3),t,font=f,fill=(10,8,30,200))
  im=Image.alpha_composite(im,sh);top=Image.new('RGBA',im.size,(0,0,0,0));dt=ImageDraw.Draw(top);dt.fontmode='1'
  for x,y,t,f in items:dt.text((x,y),t,font=f,fill=(255,255,255,255))
  im=Image.alpha_composite(im,top)
  # badge bottom-right on the grass
  bf=ImageFont.truetype(F,33);txt='立即玩';bb=ImageDraw.Draw(im).textbbox((0,0),txt,font=bf);tw,th=bb[2]-bb[0],bb[3]-bb[1]
  x1,y1=1200-40,630-34;x0,y0=x1-tw-56-33,y1-th-30
  g=Image.new('RGBA',im.size,(0,0,0,0));dg=ImageDraw.Draw(g);dg.rounded_rectangle((x0,y0,x1,y1),radius=(y1-y0)//2,fill=(44,232,245,200));im=Image.alpha_composite(im,g.filter(ImageFilter.GaussianBlur(12)))
  d=ImageDraw.Draw(im);d.fontmode='1';d.rounded_rectangle((x0,y0,x1,y1),radius=(y1-y0)//2,fill=(24,20,37,255),outline=(44,232,245,255),width=4)
  cy=(y0+y1)//2;tx=x0+28
  for k in range(5):d.rectangle((tx+k*3,cy-14+k*3,tx+k*3+2,cy+14-k*3),fill=(44,232,245,255))
  d.text((x0+28+33-bb[0],y0+15-bb[1]),txt,font=bf,fill=(255,255,255,255))
  return im
for a,b in [('og_launch','og_launch_1200x630'),('og_clear','og_clear_1200x630')]:
  im=Image.open('/tmp/%s.png'%a).crop((0,0,1200,630)).convert('RGBA');im=title(im);im.convert('RGB').save('${path.join(__dirname,'..','shots')}/%s.png'%b)
Image.open('/tmp/sw.png').save('${path.join(__dirname,'..','shots')}/lamp_colors_swatch.png')`;
execSync('python3 -',{input:py});
