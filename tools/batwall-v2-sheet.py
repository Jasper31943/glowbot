# Lays out tools/batwall-v2-preview.js panels into shots/t8/batwall_v2_design.png (Traditional Chinese) + 2x crops.
import sys,os
from PIL import Image,ImageDraw,ImageFont
D,OUT,CROPS=sys.argv[1:4]
FN='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';FB='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
f=ImageFont.truetype(FN,15);fs=ImageFont.truetype(FN,13);fh=ImageFont.truetype(FB,22);ft=ImageFont.truetype(FB,28)
P=lambda n:Image.open(os.path.join(D,n+'.png')).convert('RGB')
W=1500;BG=(24,20,37);FG=(234,212,170);HI=(254,231,97);MUTE=(139,155,180)
os.makedirs(CROPS,exist_ok=True)
for fn in os.listdir(D):
    if fn.endswith('.png'):
        q=Image.open(os.path.join(D,fn)).convert('RGB');q.resize((q.width*2,q.height*2),Image.NEAREST).save(os.path.join(CROPS,fn[:-4]+'_2x.png'))
im=Image.new('RGB',(W,9000),BG);d=ImageDraw.Draw(im);y=[16]
def tw(t,fo):b=d.textbbox((0,0),t,font=fo);return b[2]-b[0]
def head(t,sub=None):
    y[0]+=10;d.text((24,y[0]),t,font=fh,fill=HI);y[0]+=34
    if sub:
        for l in sub.split('\n'):d.text((24,y[0]),l,font=fs,fill=MUTE);y[0]+=20
        y[0]+=6
def row(items,sc=3,gap=16,x0=24,gray=False,under=None):
    x=x0;h=0
    for n,lab in items:
        p=P(n)
        if gray:p=p.convert('L').convert('RGB')
        big=p.resize((p.width*sc,p.height*sc),Image.NEAREST);ls=lab.split('\n')
        cw=max(big.width,max(tw(l,f if i==0 else fs) for i,l in enumerate(ls)))
        if x+cw>W-20:y[0]+=h+14;x=x0;h=0
        im.paste(big,(x,y[0]));yy=y[0]+big.height+4
        if under:
            q=P(under(n));q=q.convert('L').convert('RGB') if gray else q;qb=q.resize((q.width*under.sc,q.height*under.sc),Image.NEAREST);im.paste(qb,(x,yy));yy+=qb.height+4
        for i,l in enumerate(ls):d.text((x,yy+i*19),l,font=f if i==0 else fs,fill=FG if i==0 else MUTE)
        x+=cw+gap;h=max(h,yy-y[0]+19*len(ls))
    y[0]+=h+14
d.text((24,y[0]),'設計稿 T8 v2：球棒木板牆（只能用球棒打破）vs 炸彈裂牆「%」',font=ft,fill=(255,255,255));y[0]+=42
for l in ['新的格子種類，跟原本的「%」裂牆分開：「%」的圖完全不動（整塊牆＋細細的裂縫，炸彈或球棒都能破）。',
          '球棒木板牆＝牆上破了一個黑洞，用三片木板釘起來（上下兩片有點歪、中間一片斜撐），每片兩頭都有灰色釘子，',
          '中間斜撐上有一個被球棒敲凹的圓痕（壓扁的木頭、露出淺色的新木頭、裂出木刺）＝「敲這裡」。木板顏色跟著每個主題變。',
          '不用黃色、白色、紅色，也沒有灰色鐵框（鐵箍牆只能用炸彈）。每 2.4 秒上面那片木板滑過一道小反光（是移動，不是閃）。']:
    d.text((24,y[0]),l,font=fs,fill=MUTE);y[0]+=20
y[0]+=8
TN={'forest':'森林','swamp':'沼澤','mine':'礦坑','volcano':'火山（燒焦木板＋餘燼）','sea':'海底（漂流木＋藤壺）','castle':'古堡（深色橡木）','sky':'天空島（淺色木板＋藤蔓）','mirror':'鏡子迷宮（紫色漆）','power':'發電廠（木箱板）','clock':'鐘塔','factory':'夜間工廠（棧板＋桃紅漆）','core':'核心'}
head('A 單格並排（4 倍）：左＝炸彈裂牆「%」（現在的圖）、中＝新的球棒木板牆、右＝一般牆')
class U:
    sc=1
row([('pair_'+k,v) for k,v in TN.items()],sc=4,gap=22)
head('B 真的房間（3 倍，下面是 1 倍）：小光 → 球棒木板牆 · 地板 · 炸彈裂牆「%」 · 一般牆')
u=lambda n:n;u.sc=1
row([('room_'+k,v) for k,v in TN.items()],sc=3,gap=18,under=u)
head('C 打碎動畫（約 0.35 秒）：木板裂開','0–0.05 秒：整組木板往打擊方向震 1px → 0.05–0.26 秒：每片木板從凹痕那裡斷成兩半，一邊轉一邊飛開、往下掉，釘子彈出來 →\n0.05–0.35 秒：木屑（用 hit-fx-spec 的 tree 顆數和速度、換成這個主題的木頭顏色）＋淡淡的灰塵；黑洞在 0.15 秒前淡掉（底下已經是地板）。')
BL=['打之前','0 秒 震一下','0.07 秒 斷成兩半','0.12 秒 轉著飛開','0.18 秒 木屑','0.24 秒 落下','0.31 秒 快結束']
for th in ['mine','castle','sky','mirror']:
    row([('br_%s_%d'%(th,i),(TN[th].split('（')[0]+'：' if i==0 else '')+BL[i]) for i in range(7)],sc=2,gap=10)
head('D 灰階檢查','轉成灰階後：「%」是整塊牆上的細裂縫；木板牆是「黑洞＋亮的橫木板＋斜撐＋釘子」，形狀完全不同，不靠顏色也分得出來。')
row([('pair_'+k,TN[k].split('（')[0]) for k in TN],sc=4,gap=22,gray=True)
row([('room_'+k,TN[k].split('（')[0]) for k in ['mine','castle','sky','mirror']],sc=2,gap=14,gray=True)
im=im.crop((0,0,W,y[0]));im.save(OUT);print('wrote',OUT,im.size)
