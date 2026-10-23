# Lays out the panels of tools/hitfx-crackwall-preview.js into shots/t8/hitfx_crackwall_design.png (Traditional Chinese labels) + 2x crops.
import sys,os,re,json
from PIL import Image,ImageDraw,ImageFont
D,OUT,CROPS,SPEC=sys.argv[1:5]
FN='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';FB='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
f=ImageFont.truetype(FN,15);fs=ImageFont.truetype(FN,13);fh=ImageFont.truetype(FB,22);ft=ImageFont.truetype(FB,28);fm=ImageFont.truetype(FN,12)
P=lambda n:Image.open(os.path.join(D,n+'.png')).convert('RGB')
S=3;W=1500;BG=(24,20,37);FG=(234,212,170);HI=(254,231,97);MUTE=(139,155,180)
os.makedirs(CROPS,exist_ok=True)
for fn in os.listdir(D):
    if fn.endswith('.png'):
        q=Image.open(os.path.join(D,fn)).convert('RGB');q.resize((q.width*2,q.height*2),Image.NEAREST).save(os.path.join(CROPS,fn[:-4]+'_2x.png'))
spec_txt=open(SPEC,encoding='utf8').read()
SP={}
for m in re.finditer(r"^\s*(\w+):\s*\{colors:\[([^\]]*)\].*?count:\{bat:(\d+),bomb:(\d+),ko:(\d+)[^}]*\},\s*speed:\[(\d+),(\d+)\]",spec_txt,re.M):
    SP[m.group(1)]=dict(colors=[c.strip(" '") for c in m.group(2).split(',')],count=(m.group(3),m.group(4),m.group(5)),speed=(m.group(6),m.group(7)))
im=Image.new('RGB',(W,9000),BG);d=ImageDraw.Draw(im)
y=[16]
def head(t,sub=None):
    y[0]+=10;d.text((24,y[0]),t,font=fh,fill=HI);y[0]+=34
    if sub:
        for l in sub.split('\n'):d.text((24,y[0]),l,font=fs,fill=MUTE);y[0]+=20
        y[0]+=6
def tw(t,fo):b=d.textbbox((0,0),t,font=fo);return b[2]-b[0]
def row(items,sc=S,gap=22,x0=24,one=True,gray=False,extra=None):
    x=x0;h=0
    for n,lab in items:
        p=P(n)
        if gray:p=p.convert('L').convert('RGB')
        big=p.resize((p.width*sc,p.height*sc),Image.NEAREST);ls=lab.split('\n')
        cw=max(big.width,max(tw(l,f if i==0 else fs) for i,l in enumerate(ls)))
        if x+cw>W-20:y[0]+=h+14;x=x0;h=0
        bx=x+(cw-big.width)//2;im.paste(big,(bx,y[0]))
        if one:im.paste(p,(bx,y[0]+big.height+4))
        ly=y[0]+big.height+(p.height+10 if one else 8)
        for i,l in enumerate(ls):d.text((x,ly+i*19),l,font=f if i==0 else fs,fill=FG if i==0 else MUTE)
        eh=0
        if extra:eh=extra(n,x,ly+19*len(ls)+2)
        x+=cw+gap;h=max(h,ly-y[0]+19*len(ls)+eh)
    y[0]+=h+14
d.text((24,y[0]),'設計稿 T8：打擊手感（規格）＋ 球棒裂牆',font=ft,fill=(255,255,255));y[0]+=42
d.text((24,y[0]),'每格 16×16、Endesga 32。大圖 = 3 倍、小圖 = 1 倍。A 部分是「規格示意」：火花、碎片、震動由工程師在引擎裡畫，數字在 hit-fx-spec.js（window.HIT_FX_SPEC）與 shots/t8/hitfx_spec.md。',font=fs,fill=MUTE);y[0]+=28
# ---- A1 bat
head('A1 球棒打到王：時間軸（森林・老樹精）','0.07 秒揮棒打中 → 停格 75ms（王和小光都定住）→ 火花 3 格共 0.12 秒 → 木屑往打擊方向飛、0.45 秒內落地消失。震動 1px、200ms 內衰減。\n火花只在打中的那一點、不到一格大，沒有整個畫面的白閃；也沒有重複閃爍。')
def tl(x0,y0,w,marks,bands,total):
    d.line((x0,y0+10,x0+w,y0+10),fill=MUTE,width=2)
    for i,(a,b,c,l) in enumerate(bands):
        xa=x0+int(a/total*w);xb=x0+int(b/total*w);yy=y0+24+i*20;d.rectangle((xa,yy,xb,yy+12),fill=c);d.text((xb+6,yy-3),l,font=fm,fill=c)
    for t,l in marks:
        xx=x0+int(t/total*w);d.line((xx,y0,xx,y0+20),fill=FG);d.text((xx-8,y0-16),l,font=fm,fill=FG)
labs=['0 秒\n按動作、開始揮棒','0.07 秒\n打中！停格開始＋火花①','0.10 秒\n停格中＋火花②','0.14 秒\n火花③、停格剛結束','0.19 秒\n木屑往右飛','0.30 秒\n木屑落下','0.45 秒\n結束']
row([('bat_%d'%i,labs[i]) for i in range(7)],sc=2,gap=14,one=False)
tl(40,y[0]+20,1300,[(0,'0'),(.07,'70ms'),(.145,'145'),(.19,'190'),(.27,'270'),(.52,'520ms')],[(0,.07,(139,155,180),'揮棒 0.07 秒'),(.07,.145,(254,174,52),'停格 75ms'),(.07,.19,(234,212,170),'火花 3 格 0.12 秒'),(.09,.52,(184,111,80),'木屑 0.25–0.45 秒'),(.07,.27,(99,199,77),'震動 1px 200ms')],.56)
d.text((40,y[0]+150),'火花 0.03＋0.04＋0.05 秒；木屑從 0.09 秒開始，每顆壽命 0.25–0.45 秒；震動在停格開始時起跳。',font=fs,fill=MUTE);y[0]+=180
# ---- A1 bomb
head('A1 炸彈炸到王：時間軸（火山・熔岩巨人）','爆炸瞬間停格 110–120ms → 爆點火花 3 格（0.04／0.06／0.08 秒）：amber 核心 → orange 空心圈＋灰煙 → 只剩煙。碎片 12 顆、震動 2px。\n擊倒（KO）：停格 140ms、碎片 16–20 顆、震動 2px（最終王和熔岩巨人 3px，上限 3px）。')
labs=['0 秒\n爆炸：火花①＋停格','0.04 秒\n火花② 空心圈','0.10 秒\n火花③ 煙','0.18 秒\n停格結束，碎片飛','0.30 秒\n碎片落下','0.45 秒\n結束']
row([('bomb_%d'%i,labs[i]) for i in range(6)],sc=2,gap=14,one=False)
# ---- A2 debris
head('A2 每隻王的碎片（重疊顯示 0.06／0.14／0.24 秒，越淡越早）','色票＝ HIT_FX_SPEC 的 colors；數字＝碎片顆數（球棒／炸彈／擊倒）與速度 px/s。重力和飛散角度見 hitfx_spec.md。')
NM={'tree':'老樹精 tree・木屑','golem':'熔岩巨人 golem・火星','mole':'鼴鼠王 mole・石土','phantom':'鏡影王 phantom・玻璃','guard':'鐘塔守衛 guard・齒輪','knight':'騎士王 knight・金屬','crab':'巨蟹王 crab・水泡（往上飄）','spark':'電光王 spark・電花','worm':'沙蟲王 worm・沙','frog':'泥蛙王 frog・泥','bird':'風暴鳥 bird・羽毛','glitch':'故障機器人 glitch','core':'故障核心 core','default':'其他 default'}
def sw(n,x,yy):
    k=n[4:];s=SP.get(k)
    if not s:return 0
    for i,c in enumerate(s['colors']):
        rgb=tuple(int(c[j:j+2],16) for j in (1,3,5));d.rectangle((x+i*44,yy,x+i*44+14,yy+14),fill=rgb,outline=(0,0,0));d.text((x+i*44+17,yy),c[1:],font=fm,fill=MUTE)
    d.text((x,yy+18),'顆數 %s／%s／%s・速度 %s–%s'%(s['count']+s['speed']),font=fm,fill=MUTE);return 38
row([('mat_'+k,NM[k]) for k in NM],sc=3,gap=18,one=False,extra=sw)
# ---- A3 shake
head('A3 畫面震動示意','每 1/30 秒換一次位置（不是每格畫面都換，避免 60Hz 抖動），幅度 ×(1−t/200ms)² 衰減，第一下往打擊方向。上限 3px（遊戲像素，手機上 ×SC）。\n對照：現在上線的 shake=4 是「每格畫面 ±2px 來回跳」，bossdown 會連跳 4 格、沒有衰減。')
gx,gy,gw,gh=60,y[0]+20,560,160
def graph(x0,title,series):
    d.rectangle((x0,gy,x0+gw,gy+gh),outline=MUTE);mid=gy+gh//2;d.line((x0,mid,x0+gw,mid),fill=(58,68,102))
    for v in (-3,-2,-1,1,2,3):d.text((x0-24,mid-v*24-7),'%+d'%v,font=fm,fill=MUTE);d.line((x0,mid-v*24,x0+gw,mid-v*24),fill=(38,43,68))
    d.text((x0,gy-20),title,font=fs,fill=FG)
    for pts,col,lab,i in series:
        prev=None
        for t,v in pts:
            xx=x0+int(t/.2*gw);yy=mid-v*24
            if prev:d.line((prev[0],prev[1],xx,prev[1]),fill=col,width=2);d.line((xx,prev[1],xx,yy),fill=col,width=2)
            prev=(xx,yy)
        d.text((x0+gw+8,gy+i*18),lab,font=fm,fill=col)
    for ms in (0,50,100,150,200):d.text((x0+int(ms/200*gw)-8,gy+gh+4),'%dms'%ms,font=fm,fill=MUTE)
def model(s):
    pts=[];k=0;t=0
    while t<=.2:
        a=s*(1-t/.2)**2;v=round(a)*(1 if k%2==0 else -1);pts.append((t,v));k+=1;t+=1/30
    pts.append((.2,0));return pts
graph(gx,'新：衰減震動（球棒 1px／炸彈 2px／擊倒 2–3px）',[(model(1),(99,199,77),'球棒 1px',0),(model(2),(254,174,52),'炸彈 2px',1),(model(3),(181,80,136),'擊倒上限 3px',2)])
old=[];t=0;k=0
while k<4:old.append((t,2 if k%2==0 else -2));t+=1/60;k+=1
old.append((t,0));old.append((.2,0))
graph(gx+gw+220,'舊（對照）：shake=4，每格 ±2px、沒有衰減',[(old,(192,203,220),'舊 bossdown',0)])
y[0]=gy+gh+40
# ---- B crack walls
head('B1 球棒裂牆：每個主題（左＝小光、中＝裂牆、右＝一般牆）','裂牆＝原本的牆當背景，前面多一顆「圓角、右上缺一角、左上亮右下暗」的石塊；中間有圓形的打擊凹痕，裂縫從凹痕往外放射，每條裂縫旁邊有 1px 亮邊。\n不用黃色（不會跟炸彈範圍、球棒瞄準框、跳板混淆）；沒有灰色鐵框（跟只能用炸彈的鐵箍牆分開）。每 2.4 秒上緣滑過一道小反光（移動，不是閃爍）。')
TN={'forest':'森林','swamp':'沼澤','mine':'礦坑','volcano':'火山（裂縫透出岩漿橘光）','sea':'海底','castle':'古堡','sky':'天空島','mirror':'鏡子迷宮','power':'發電廠','clock':'鐘塔','factory':'夜間工廠','core':'核心'}
row([('cw_'+k,v) for k,v in TN.items()]+[('cw_glint','反光滑過的那一刻（礦坑）')],sc=3,gap=18,one=True)
head('B2 打碎動畫（約 0.35 秒）','0–0.06 秒：石塊往打擊方向震 1px、裂縫變粗 → 0.06–0.22 秒：裂成四塊往外飛、往下掉 → 0.06–0.35 秒：碎片（用 A 的碎片規格）＋淡淡的灰塵。地板在底下先畫好。')
BL=['打之前','0 秒 震一下','0.06 秒 裂成四塊','0.12 秒 四塊飛開','0.19 秒 碎片＋灰塵','0.27 秒 灰塵散開','0.33 秒 快結束']
for th in ['mine','swamp','volcano','mirror']:
    row([('br_%s_%d'%(th,i),(TN[th].split('（')[0]+'：' if i==0 else '')+BL[i]) for i in range(7)],sc=2,gap=10,one=False)
head('B3 灰階檢查','轉成灰階後，裂牆靠「圓角石塊＋缺角＋放射裂縫＋凹痕」跟旁邊的一般牆分得出來。')
row([('cw_'+k,TN[k].split('（')[0]) for k in TN],sc=2,gap=14,one=False,gray=True)
im=im.crop((0,0,W,y[0]));im.save(OUT);print('wrote',OUT,im.size)
